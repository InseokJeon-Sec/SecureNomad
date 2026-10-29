---
title: 벡터 데이터베이스
sidebar_position: 4
description: 고차원 임베딩을 저장·인덱싱·검색하는 전용 시스템 — 인덱싱 알고리즘(HNSW·DiskANN·IVF·PQ·저비트 양자화), 경쟁 지형, 메타데이터 필터링, 프로덕션 운영, 관리형 vs 자체 호스팅 TCO.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/04-vector-databases.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09). 제품 기능·가격·버전은 빠르게 바뀌므로 최신 값은 각 벤더 페이지를 확인하세요.
:::

# 벡터 데이터베이스

벡터 데이터베이스는 고차원 임베딩을 저장·인덱싱·검색하도록 특별 설계된 시스템이다. 시장이 **관리형 서버리스**와 **전문 고성능** 엔진으로 갈렸다. 더 이상 "벡터 검색을 지원하나?"(Postgres·Redis·Mongo 모두 지원)를 묻지 않는다. **"1억+ 벡터로 P99 100ms 미만과 전체 메타데이터 필터링까지 확장되나?"** 를 묻는다.

## 벡터 데이터베이스란

벡터 DB는 임베딩(dense 벡터)을 저장하고 그 위 빠른 유사도 검색을 가능하게 한다.

```
Traditional DB:      SELECT * FROM docs WHERE category = 'tech'
Vector DB:           SELECT * FROM docs ORDER BY similarity(embedding, query_embedding) LIMIT 10
```

### 핵심 역량

| 역량 | 목적 |
|------------|---------|
| 벡터 저장 | 고차원 임베딩 영속화 |
| 유사도 검색 | 최근접 이웃을 빠르게 찾기 |
| 메타데이터 필터링 | 벡터 검색과 속성 필터 결합 |
| CRUD 연산 | 데이터 변경 시 임베딩 갱신 |
| 확장 | 수백만~수십억 벡터 처리 |

### 범용 DB로는 안 되나?

전통 DB는 벡터를 저장할 수 있으나 최적화된 검색이 없다:

| 접근 | 검색 복잡도 | 대규모 실용성 |
|----------|-------------------|-------------------|
| 브루트포스(예: HNSW·IVFFlat 인덱스 없는 pgvector) | O(n * d) | 약 1M 벡터까지 OK |
| ANN 인덱스(전용 벡터 DB) | O(log n) 또는 O(1) | 예, 수십억 |

---

## 벡터 검색 기초

### 정확 vs 근사 검색

**정확(브루트포스):**
- 쿼리를 저장된 모든 벡터와 비교
- 쿼리당 O(n * d)
- 완벽한 정확도

**근사 최근접 이웃(ANN):**
- 인덱스 구조로 탐색 공간 가지치기
- 선형 미만 복잡도
- 약간 낮은 재현율(보통 95-99%)

### 거리 지표

| 지표 | 공식 | 범위 | 적합 |
|--------|---------|-------|----------|
| 코사인 | 1 - (a . b) / (norm(a) * norm(b)) | [0, 2] | 텍스트 임베딩 |
| 유클리드(L2) | sqrt(sum((a - b)^2)) | [0, inf) | 이미지 임베딩 |
| 내적 | a . b | (-inf, inf) | 이미 정규화됨 |

**텍스트 임베딩엔:** 코사인 유사도 사용(사전 정규화 시 내적).

### 재현율 vs 지연 트레이드오프

```
                    ^ Recall
                    |
               100% | ------------------ Brute force
                    |         *          Well-tuned ANN
                    |      *
                    |   *
                95% |*                   Fast ANN
                    |
                    +-----+-------+------> Latency
                       1ms      10ms
```

ANN 인덱스는 속도를 위해 정확도를 일부 교환한다. 요구에 맞춰 튜닝하라.

---

## 인덱싱 알고리즘

### HNSW(계층 탐색 가능 소세계)

프로덕션 **인메모리** 벡터 검색의 가장 인기 알고리즘.

**작동 방식:**
1. 노드가 벡터인 그래프 구축
2. 가까운 이웃과 연결
3. 여러 추상 계층(계층적)
4. 검색: 최상위 계층에서 아래로, 탐욕적 최근접 이웃

```
Layer 2:   *--------*--------*
           |        |        |
Layer 1:   *--*--*--*--*--*--*
           |  |  |  |  |  |  |
Layer 0:   ********************  (all vectors)
```

**장점:**
- 뛰어난 재현율/지연 트레이드오프
- 학습 불필요
- 업데이트 네이티브 지원

**단점:**
- 메모리 집약: 전정밀 벡터와 그래프 링크가 모두 RAM에 상주
- 그래프 자체는 고차원에서 작은 비중. OpenSearch 산정 규칙은 벡터당 1.1 x (4 x dims + 8 x M) 바이트로, 1,536차원·M 16~64에서 원시 float32 벡터보다 약 12-19% 많음; 저차원 벡터가 비례적으로 더 지불
- 1,536차원 1천만 벡터는 복제본 전 복사본당 약 70-75 GB RAM 필요(그중 61 GB가 float32 벡터)

**핵심 파라미터:**
- `M`: 노드당 최대 연결(16-64)
- `ef_construction`: 빌드 시 탐색(100-500)
- `ef_search`: 쿼리 시 탐색(50-200)

### DiskANN(SSD 기반)

RAM에 안 맞는 **10억 규모** 인덱스용. 원 논문은 64 GB RAM과 SSD의 워크스테이션 하나에서 10억 SIFT 포인트를 초당 5,000+ 쿼리, 평균 3ms 미만, 95%+ 1-recall@1로 서빙.

**작동 방식:**
- 전정밀 벡터·그래프를 SSD(NVMe)에, 검색을 유도할 압축(PQ) 코드만 RAM에
- Vamana 알고리즘으로 효율적 디스크 기반 그래프 순회

**장점:**
- 10억 규모 데이터셋에 HNSW보다 10배 저렴, 지연 페널티 5ms 미만
- HNSW 대비 RAM 요구 90-95% 감소

**단점:**
- 순수 인메모리 HNSW보다 약간 높은 지연
- 꼬리 지연이 NVMe IOPS에 달림, SSD를 용량만이 아니라 쿼리 동시성에 맞춰 산정

**예시:** 1,536차원 1억 벡터 인덱스는 HNSW에 복사본당 약 700 GB RAM(float32 벡터 614 GB + 그래프·오버헤드). DiskANN으로 RAM 요구가 90-95% 줄며 10ms 미만 쿼리 유지.

### IVF(역파일 인덱스)

벡터를 클러스터로 분할, 관련 클러스터만 검색.

**작동 방식:**
1. k-means로 센트로이드 생성
2. 각 벡터를 최근접 센트로이드에 배정
3. 쿼리 시: 최근접 센트로이드 찾아 그 클러스터 검색

**장점:**
- HNSW보다 낮은 메모리
- 양자화 사용 가능(IVF-PQ)

**단점:**
- 학습 필요
- 업데이트에 재클러스터링·하이브리드 필요

**핵심 파라미터:**
- `nlist`: 클러스터 수(sqrt(n) 어림)
- `nprobe`: 쿼리 시 검색할 클러스터

### 곱 양자화(PQ)

메모리를 줄이고 비교를 가속하도록 벡터 압축.

**작동 방식:**
1. 벡터를 서브벡터로 분할
2. 각 서브벡터를 코드북으로 양자화
3. 전체 벡터 대신 코드 저장

**메모리 감소:** 보통 4-32배

**트레이드오프:** 양자화 손실로 낮은 정확도

### 저비트·회전 기반 양자화

2026년 5~9월 여러 엔진이 1~8비트 벡터 저장을 출시·확장, 대개 기본값이 아닌 옵트인·프리뷰로. 최신 트릭은 **먼저 회전, 그다음 양자화**다. 임베딩 차원은 분산이 매우 고르지 않아, 차원별 스칼라 양자화가 조용한 차원에 비트를 낭비하고 큰 차원을 클리핑한다. 랜덤·Hadamard 회전을 곱하면 에너지가 차원 전반에 고루 퍼져, 균일 4비트·1비트 그리드가 훨씬 적은 정보를 잃는다.

| 엔진 | 기능 | 상태 | 풋프린트 |
|---|---|---|---|
| Qdrant | Hadamard 회전의 TurboQuant(1.18, 2026-05); 4비트 형만 유지하는 Turbo4 저장 타입(1.19, 2026-08) | 옵트인 | 1.18의 좌표당 36비트(float32 원본 + 4비트 사본)에서 Turbo4 4비트로, 9배 절감 |
| Weaviate | 4비트 회전 양자화(1.39, 2026-08), 기존 8비트·1비트 RQ에 추가 | 프리뷰, HNSW만 | 1,536차원 벡터 6,144바이트→784바이트(7.84배) |
| Elasticsearch | DiskBBQ(`bbq_disk`, 9.2부터 GA)에 대칭 1비트 OSQ 스코어러·병합 시 보정 추가(9.5, 2026-08) | GA; 라이선스 포함 시(Enterprise) 9.4부터 float 벡터 기본 인덱스 | 차원당 약 1비트 + 보정항 |
| turbopuffer | 평이한 `i8` 벡터 타입(2026-06), 회전 없음 | 출시 | 양자화 인식 모델에 f32 대비 저장·쿼리 비용 75% 감소(벤더) |

Qdrant 자체 수치가 트레이드오프를 보임: 한 데이터셋에서 4비트 TurboQuant 재현율 0.9193 vs 8비트 스칼라 양자화 0.9285 vs 무압축 0.9419, 스칼라 양자화의 2배 압축에서(벤더). 설계 결정은 **재점수용 float 원본 유지 여부**다. 디스크·오브젝트 스토리지에 두고 상위 수백 후보를 재점수하면 손실 재현율 대부분을 회복; 버리면(Turbo4) 가장 싸나 최대 재현율을 상한.

RAM 계산이 그에 따라 바뀜: 1,536차원 1억 벡터가 float32로 약 614 GB, 4비트로 약 77 GB. 10억 벡터에선 고메모리 노드 플릿과 몇 머신 + SSD의 차이.

### Flat 인덱스(브루트포스)

근사 없음, 정확 검색.

**쓸 때:**
- 10만 벡터 미만
- 정확도가 임계
- 지연 예산이 넉넉

### 알고리즘 비교

| 알고리즘 | 메모리 | 빌드 시간 | 쿼리 속도 | 재현율 | 업데이트 |
|-----------|--------|------------|-------------|--------|---------|
| HNSW | 높음 | 중간 | 매우 빠름 | 95-99% | 좋음 |
| DiskANN | 낮음(SSD) | 중간 | 빠름 | 95-99% | 보통 |
| IVF | 중간 | 빠름 | 빠름 | 90-98% | 보통 |
| IVF-PQ | 낮음 | 빠름 | 빠름 | 85-95% | 보통 |
| Flat | 낮음 | 없음 | 느림 | 100% | 즉시 |

---

## 경쟁 지형

### 벡터 네이티브(전용)

| 데이터베이스 | 유형 | 적합 | 가격 모델 |
|----------|------|----------|---------------|
| **Pinecone** | 관리형 클라우드(서버리스 표준); BYOC GA 2026-09-23(데이터 플레인을 자기 AWS·GCP·Azure 계정에) | 쉬운 시작, 확장, 관리형 SLA; BM25 전문 검색 GA 2026-09-09 | 저장 + 읽기·쓰기 단위 |
| **Qdrant** | 오픈소스/클라우드(Rust, 고성능) | 자체 호스팅 통제, 강한 필터 검색; 벤더 벤치 10M 벡터 약 12ms p99 | GB당(클라우드) 또는 무료 |
| **Weaviate** | 오픈소스/클라우드 | 단일 쿼리의 네이티브 하이브리드(BM25+dense+메타데이터), MMR 다양성·Boost API(1.39 GA), 멀티모달 | 차원-시간당 |
| **Milvus** | 오픈소스/클라우드(Zilliz) | 분산 확장; 3.0(2026-07)이 오브젝트 스토리지의 Parquet·Iceberg·Lance·Vortex 외부 컬렉션, 온라인 컬럼 백필 추가 | 무료(자체) 또는 Zilliz Cloud |
| **turbopuffer** | 관리형, 오브젝트 스토리지 우선 | 저비용 다수 콜드 네임스페이스(테넌트별 인덱스); 네이티브 임베딩 GA 2026-09-29 | 사용량 기반 |
| **Chroma** | 오픈소스 | 프로토타이핑, 로컬 개발, 임베디드 | 무료 |

### 범용(플러그인·확장)

| 데이터베이스 | 유형 | 적합 | 가격 모델 |
|----------|------|----------|---------------|
| **pgvector(0.8.7)** | PostgreSQL 확장 | 소규모, 기존 PG(HNSW + IVFFlat). 0.8.7 패치(2026-10-01): 인덱스 생성 허용 롤이면 누구나 트리거 가능한 IVFFlat 빌드 오버플로 CVE-2026-103484 수정 | 컴퓨트만 |
| **Elasticsearch(9.5)** | 검색 엔진 | `rrf`·`linear` 리트리버 하이브리드, DiskBBQ 양자 벡터, 수집 시 자동 임베딩하는 `semantic_text` 필드 | 라이선스 기반 |
| **MongoDB Atlas Vector Search** | 문서 DB | 기존 Mongo 샵; Automated Embedding GA 2026-08-13(Atlas가 쓰기 시 Voyage 모델로 문서 임베딩·재임베딩) | Atlas 클러스터 가격 |

### 2026년 시장이 움직인 곳

엔진 평가 방식을 바꾸는 세 변화:

1. **임베딩이 DB로 들어왔다.** MongoDB Atlas Automated Embedding(GA), turbopuffer 네이티브 임베딩(GA; turbopuffer는 Readwise가 쿼리 실행과 병렬 임베딩으로 중앙값 임베딩 지연 8배 단축 인용), Elasticsearch `semantic_text`, Milvus 3.0 Hugging Face Inference Providers 통합 모두 별도 임베드·동기 파이프라인을 없앤다. 비용은 결합: 벤더가 이제 모델 버전을 고르니, 채택 전 모델 변경이 어떻게 재임베딩을 트리거하는지 물어라.
2. **인덱스가 레이크하우스로 이동.** Milvus 3.0 외부 컬렉션은 Parquet·Iceberg·Lance·Vortex 데이터를 제자리 쿼리(제로카피, 읽기 전용), turbopuffer의 9/30 "RIP, vector database" 글은 ANN 인덱스가 주 데이터 레이아웃이 아닌 보조 인덱스가 되는 v3 저장 설계 기술(발표; CI는 통과하나 아직 프로덕션 아님, 글의 규모 수치는 벤더). 논쟁이 "어느 벡터 DB"에서 "오브젝트 스토리지 위 제자리 인덱스냐, 서빙 스토어로 복사냐"로 옮겨감.
3. **저비트 양자화가 벤더 전반에 퍼짐**([위](#저비트회전-기반-양자화) 참고), HNSW 산정의 RAM 예산 변경.

---

## 상세 데이터베이스 비교

### 기능 매트릭스

| 기능 | Pinecone | Qdrant | Weaviate | Milvus | pgvector |
|---------|----------|--------|----------|--------|----------|
| **언어** | 독점 | Rust | Go | Go/C++ | C |
| 호스팅 옵션 | 예 | 예 | 예 | 예(Zilliz) | 클라우드 PG 경유 |
| 자체 호스팅 | BYOC만(자기 클라우드의 데이터 플레인) | 예 | 예 | 예 | 예 |
| **서버리스** | 예(최고) | 예 | 예 | 예(Zilliz) | 아니오 |
| **클라우드 네이티브** | 임의 | 임의 | 임의 | 분산은 K8s; 단독 Docker | 임의 |
| 메타데이터 필터링 | 좋음 | 뛰어남 | 좋음 | 좋음 | SQL 경유 |
| **하이브리드 검색** | sparse-dense 또는 클라이언트 융합 BM25 FTS | 네이티브 | 네이티브 | 네이티브 | 다단계(제한적) |
| 최대 벡터 | 수십억 | 수십억 | 수십억 | 수십억 | 약 10M |
| HNSW 인덱스 | 예 | 예 | 예 | 예 | 예 |

---

## 메타데이터 필터링

멀티테넌트·필터링 사용처에 결정적.

```python
# Pinecone
results = index.query(
    vector=query_embedding,
    top_k=10,
    filter={"tenant_id": "123", "category": {"$in": ["tech", "science"]}}
)

# Qdrant (Query API; legacy /search endpoint removed from 1.19 REST schema)
results = client.query_points(
    collection_name="documents",
    query=query_embedding,
    limit=10,
    query_filter=Filter(
        must=[
            FieldCondition(key="tenant_id", match=MatchValue(value="123")),
            FieldCondition(key="category", match=MatchAny(any=["tech", "science"]))
        ]
    )
).points
```

**성능 영향:** 필터링이 검색 후가 아니라 검색 중 일어난다. 사전 필터 인덱스는 빠르나 덜 유연하다.

**메타데이터 필터링이 흔히 병목인 이유:** 나이브 벡터 검색은 "Top K" 최근접 이웃을 찾고 **그다음** 메타데이터로 필터한다. 필터가 아주 제한적이면 필터 후 0개가 될 수 있다. 전문 DB는 이제 **HNSW 사전 필터링**을 써, 그래프를 순회하되 불리언 메타데이터 제약을 만족하는 노드만 고려한다. 지연을 낮게 유지하려면 전문 비트마스크나 하드웨어 가속(SIMD)이 필요하다.

**디스크 네이티브 메타데이터:** 현대 DB는 구성요소별로 RAM과 디스크 간 데이터를 계층화한다. Qdrant 1.19는 구 `on_disk`·`always_ram` 플래그를 벡터·HNSW 그래프·sparse·페이로드 인덱스에 적용되는 하나의 `memory` 설정(핀·캐시·콜드)으로 대체해, 복잡한 필터(전문+지오+벡터)가 모든 페이로드 인덱스를 RAM에 안 쥐고 실행된다.

---

## 쿼리 패턴

### 패턴 1: 단순 의미 검색

```python
def semantic_search(query: str, top_k: int = 5) -> list[Document]:
    query_embedding = embed(query)
    results = vector_db.search(query_embedding, top_k=top_k)
    return [Document(id=r.id, text=r.payload["text"], score=r.score) for r in results]
```

### 패턴 2: 필터 검색

```python
def filtered_search(query: str, filters: dict, top_k: int = 5) -> list[Document]:
    query_embedding = embed(query)
    results = vector_db.search(
        query_embedding,
        top_k=top_k,
        filter=filters  # {"tenant_id": "abc", "created_after": "2025-01-01"}
    )
    return results
```

### 패턴 3: 하이브리드 검색(dense + sparse)

```python
def hybrid_search(query: str, alpha: float = 0.5, top_k: int = 5) -> list[Document]:
    # Dense (semantic)
    dense_embedding = embed(query)
    dense_results = vector_db.search(dense_embedding, top_k=top_k * 2)

    # Sparse (keyword)
    sparse_results = bm25_search(query, top_k=top_k * 2)

    # Combine with reciprocal rank fusion
    combined = reciprocal_rank_fusion(
        [dense_results, sparse_results],
        weights=[alpha, 1 - alpha]
    )

    return combined[:top_k]
```

일부 DB(Weaviate, Qdrant, Milvus, Elasticsearch)는 dense·키워드 결과를 네이티브 융합한다. Pinecone BM25 전문 검색은 요청당 한 점수 타입으로 순위하므로, 어휘·벡터 검색을 따로 돌려 클라이언트 측에서 융합(예: RRF)한다.

```python
# Weaviate native hybrid (Python client v4)
docs = client.collections.use("Document")
results = docs.query.hybrid(
    query=query,
    alpha=0.5,  # 0 = BM25 only, 1 = vector only
    limit=5,
)
```

### 패턴 4: 멀티벡터 쿼리

부모-자식·다측면 검색용:

```python
def multi_vector_search(queries: list[str], top_k: int = 5) -> list[Document]:
    all_results = []

    for query in queries:
        embedding = embed(query)
        results = vector_db.search(embedding, top_k=top_k)
        all_results.extend(results)

    # Dedupe and rerank
    unique = dedupe_by_id(all_results)
    reranked = rerank(queries[0], unique)  # Use primary query for reranking

    return reranked[:top_k]
```

---

## 프로덕션 운영

### 용량 계획

```python
def estimate_resources(
    num_vectors: int,
    dimensions: int,
    metadata_size_bytes: int = 500
) -> dict:
    # Vector storage
    vector_size = dimensions * 4  # float32
    total_vector_storage = num_vectors * vector_size

    # Index overhead (HNSW ~1.5x)
    index_overhead = total_vector_storage * 1.5

    # Metadata
    metadata_storage = num_vectors * metadata_size_bytes

    # Total
    total_gb = (total_vector_storage + index_overhead + metadata_storage) / 1e9

    # QPS estimate (rough)
    qps_per_gb = 50  # depends heavily on config
    estimated_qps = total_gb * qps_per_gb

    return {
        "storage_gb": total_gb,
        "estimated_qps": estimated_qps,
        "recommended_replicas": max(1, int(total_gb / 50))  # ~50GB per replica
    }
```

### 인덱스 유지보수

```python
class VectorDBMaintenance:
    def __init__(self, client):
        self.client = client

    def add_documents(self, documents: list[Document]):
        """Upsert documents with batching."""
        batch_size = 100
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            embeddings = embed_batch([d.text for d in batch])

            self.client.upsert([
                {
                    "id": doc.id,
                    "vector": embedding,
                    "payload": doc.metadata
                }
                for doc, embedding in zip(batch, embeddings)
            ])

    def delete_documents(self, doc_ids: list[str]):
        """Delete by document ID."""
        self.client.delete(ids=doc_ids)

    def update_metadata(self, doc_id: str, metadata: dict):
        """Update metadata without re-embedding."""
        self.client.set_payload(
            collection_name="documents",
            payload=metadata,
            points=[doc_id]
        )
```

### 고가용성

```
+-------------------------------------------------------------+
|                    Load Balancer                             |
+----------------------------+--------------------------------+
                             |
            +----------------+----------------+
            v                v                v
     +--------------+ +--------------+ +--------------+
     |  Replica 1   | |  Replica 2   | |  Replica 3   |
     |   (Read)     | |   (Read)     | |   (Primary)  |
     +--------------+ +--------------+ +--------------+
                                             |
                                       (Replication)
                                             |
                                       +-----v-----+
                                       |  Storage   |
                                       +-----------+
```

**핵심 패턴:**
- 쓰기엔 리더-팔로워
- 쿼리 확장엔 읽기 복제본
- HA엔 비동기 복제

### 패치

벡터 스토어를 CVE 피드의 여느 DB처럼 다뤄라. pgvector 0.8.7(2026-10-01)은 인덱스 생성 허용 롤이면 코드 실행으로 이어질 수 있는 IVFFlat 빌드 중 버퍼 오버플로 CVE-2026-103484 수정; 연초 패치가 병렬 HNSW 빌드 오버플로(0.8.2), HNSW 배큐밍 중 인덱스 손상 가능성(0.8.3) 수정. 관리형 Postgres에선 공급자가 0.8.7 출시 확인, 멀티테넌트 스키마의 애플리케이션 롤에 `CREATE INDEX` 부여 금지. Milvus 3.0.1도 외부 프록시 포트의 스트리밍 gRPC 호출을 통한 미인증 접근 수정.

### 모니터링

```python
VECTOR_DB_METRICS = [
    "query_latency_p50",
    "query_latency_p99",
    "queries_per_second",
    "index_size_gb",
    "vector_count",
    "filter_latency",
    "upsert_latency",
    "cache_hit_rate"
]

def alert_rules():
    return {
        "query_latency_p99_high": {
            "condition": "query_latency_p99 > 500ms",
            "severity": "warning"
        },
        "query_latency_p99_critical": {
            "condition": "query_latency_p99 > 2000ms",
            "severity": "critical"
        },
        "low_recall": {
            "condition": "bench_recall < 0.90",
            "severity": "warning"
        }
    }
```

---

## 관리형 vs 자체 호스팅(TCO 분석)

### 비용 비교

| 측면 | Pinecone(서버리스) | 자체 호스팅(Qdrant/Milvus) |
|--------|-----------------------|-----------------------------|
| **운영 부담** | 제로 | 높음(K8s + SRE 필요) |
| **확장** | 즉시(0으로 축소) | 수동(노드 프로비저닝) |
| **비용(소)** | 월 $0-$100 | 월 $50(최소 인스턴스) |
| **비용(대규모)** | 토큰·벡터당 높음 | 낮은 단가 |

### 관리형 서비스 가격(참고, 항상 공급자 페이지 확인)

| 공급자 | 모델 | 예: 1536차원 10M 벡터 |
|----------|-------|--------------------------------|
| Pinecone | 팟 기반·서버리스 | 서버리스 월 약 $70-150 |
| Qdrant Cloud | GB당 | 약 $50/월(20GB) |
| Weaviate Cloud | 차원당 | 약 $100/월 |
| Zilliz(Milvus) | CU당 | 약 $75/월 |

### 관리형 RAG 파이프라인(빌드 vs 바이)

더 새 옵션은 벡터 DB 결정을 아예 건너뛴다: 파싱·청킹·임베딩·인덱싱·검색을 수집 토큰·저장·쿼리로 과금하는 관리형 파이프라인. Cloudflare AI Search가 2026-10-01 GA, 가격은 2026-11-01 시행:

| 미터 | 가격 | 월 포함(Workers 플랜) |
|---|---|---|
| 수집 | 1M 토큰당 $0.75(이미지 1M당 +$0.50) | 5M 토큰 |
| 저장 | GB-월당 $2.00 | 10 GB-월 |
| 의미·벡터·하이브리드 쿼리 | 1K당 $0.75 | 1,000 |
| 전문 쿼리 | 1K당 $0.10 | 1,000 |

쿼리 미터가 대규모에서 지배: 월 1천만 하이브리드 쿼리는 쿼리 요금만 약 $7,500, 반면 프로비저닝된 자체 인덱스의 쿼리당 한계 비용은 0에 가깝다. 관리형 파이프라인은 첫 답까지 시간과 낮거나 스파이크한 볼륨에 이기고; 꾸준한 고 QPS에선 쿼리 미터를 노드 비용 + 임베딩 API 지출과 비교하라. Pinecone Nexus·Cohere Compass Cloud가 같은 "파이프라인을 사라" 접근을 더 밀고 나감; [에이전트 RAG](08-agentic-rag.md) 참고.

### 자체 호스팅 비용

```python
def estimate_self_hosted_cost(
    vectors: int,
    dimensions: int,
    cloud: str = "aws"
) -> dict:
    storage_gb = (vectors * dimensions * 4 * 2.5) / 1e9  # 2.5x for index

    # Instance sizing: an in-RAM HNSW index must fit in memory with headroom
    if storage_gb < 12:
        instance = "r6g.large"  # 16 GB RAM
    elif storage_gb < 25:
        instance = "r6g.xlarge"  # 32 GB RAM
    elif storage_gb < 50:
        instance = "r6g.2xlarge"  # 64 GB RAM
    else:
        instance = "r6g.4xlarge"  # 128 GB RAM; past ~100 GB, shard, quantize, or use DiskANN

    return {
        "storage_gb": storage_gb,
        "instance": instance,
        "monthly_compute": instance_pricing[instance],
        "monthly_storage": storage_gb * 0.10,  # EBS
        "total_monthly": instance_pricing[instance] + storage_gb * 0.10
    }
```

### 결정: 관리형 vs 자체 호스팅

| 요인 | 관리형 | 자체 호스팅 |
|--------|---------|-------------|
| 운영 부담 | 낮음 | 높음 |
| 소규모 비용 | 높음 | 낮음 |
| 대규모 비용 | 가변 | 흔히 낮음 |
| 통제 | 적음 | 완전 |
| 컴플라이언스 | 의존 | 완전 통제 |
| 벤더 종속 | 있음 | 없음(오픈소스면) |

**결론**: 서버리스로 시작. 5억+ 벡터나 엄격한 **온프렘·GPU 로컬** 요구가 있을 때만 자체 호스팅. 요구가 "운영"이 아니라 "데이터가 우리 클라우드 계정에 남음"이면 BYOC(Pinecone, 2026-09 GA)가 운영 없이 그걸 커버.

---

## 선택 프레임워크

### 결정 트리

```
Need < 100K vectors?
+-- Yes -> pgvector (if already using PostgreSQL)
|          +-- Chroma (for prototyping)
|
+-- No -> Need managed service?
          +-- Yes -> Cloud-first?
          |          +-- Yes -> Pinecone (easiest)
          |          +-- No -> Qdrant Cloud or Zilliz
          |
          +-- No -> Need enterprise features?
                    +-- Yes -> Milvus on Kubernetes
                    +-- No -> Qdrant or Weaviate self-hosted
```

### 평가 기준

| 기준 | 가중 | 물을 질문 |
|-----------|--------|------------------|
| 규모 | 높음 | 지금 몇 벡터? 1년 후? |
| 지연 | 높음 | p99 요구는? |
| 운영 역량 | 높음 | 운영할 수 있나? |
| 비용 | 중간 | 예산 제약? |
| 기능 | 중간 | 하이브리드? 멀티모달? |
| 종속 위험 | 중저 | 오픈소스 선호? |

### PoC 체크리스트

벡터 DB 커밋 전:

- [ ] 대표 데이터 볼륨 로드
- [ ] 실제 필터·top-k 깊이로 목표 QPS에서 쿼리 지연 벤치(벤더 수치는 제한적 필터를 거의 포함 안 함; 2026-09 공개된 Qdrant-FineWeb-10B는 100.7억 벡터 위 정확 top-1,000 정답의 프로덕션 규모 공개 벤치)
- [ ] 메타데이터 필터링 성능 테스트
- [ ] 업데이트·삭제 성능 검증
- [ ] 장애 복구 테스트
- [ ] 모니터링·관측성 평가
- [ ] 총소유비용 계산

---

## 면접 질문

### Q: Pinecone과 자체 호스팅 중 어떻게 고르나?

**좋은 답변:**
여러 요인에 달림:

**Pinecone 선택 시기:**
- 상태 저장 인프라 운영 역량이 없는 팀
- 빠른 이동 필요(주가 아니라 일)
- 규모 중간(1억 벡터 미만)
- 관리형 프리미엄 예산 허용
- 컴플라이언스가 클라우드 벤더 의존 허용

**자체 호스팅(Qdrant, Milvus) 선택 시기:**
- Kubernetes·운영 전문성 보유
- 대규모 비용 민감
- 데이터 위치만이 아니라 소프트웨어 전체 통제 필요
- 특정 컴플라이언스 요구
- 벤더 종속 회피

2026 변화 둘이 격차를 좁힘: Pinecone BYOC(2026-09-23 GA)는 Pinecone의 인바운드 접근 없이 자기 클라우드 계정에서 데이터 플레인 실행, Pinecone BM25 전문 검색(2026-09-09 GA)은 "별도 키워드 엔진 필요" 논거를 없앰(단 어휘·벡터 결과는 여전히 클라이언트 융합).

대부분 스타트업엔 속도를 위해 Pinecone·Qdrant Cloud로 시작하고, 대규모에서 비용이 금지적이면 마이그레이션 평가. 전환 비용은 API가 아니라 재임베딩·재인덱스; 쿼리 표면은 비슷하나 DB 내 임베딩 기능이 벤더 모델 선택에 묶는다.

### Q: HNSW 작동과 안 쓸 때를 설명하라.

**좋은 답변:**
HNSW는 벡터의 계층 그래프를 짓는다:

**작동 방식:**
1. 벡터를 다층 그래프 노드로 삽입
2. 상위 계층은 노드 적고 점프 큼
3. 검색: 최상위에서 탐욕적으로 최근접 이웃 이동
4. 바닥(모든 벡터)까지 하강

**좋은 이유:**
- O(log n) 쿼리 복잡도
- 학습 불필요
- 실시간 업데이트 지원
- 뛰어난 재현율/지연

**안 쓸 때:**
- 아주 작은 데이터셋(10K 미만): 브루트포스로 충분
- 극도 메모리 제약: HNSW는 모든 전정밀 벡터 + 그래프 링크를 RAM에
- 정확 검색 필요: HNSW는 근사
- 빡빡한 지연의 무거운 업데이트: 업데이트가 일시 저하 유발 가능

대안:
- 메모리 제약엔 IVF-PQ
- 비용 효율 10억 규모엔 DiskANN
- 정확 검색엔 Flat
- 초고차원 희소 벡터엔 LSH

### Q: 언제 RAM 기반(HNSW)보다 디스크 기반(DiskANN) 인덱스를 쓰나?

**좋은 답변:**
인덱스 메모리 비용이 예산이나 단일 고메모리 노드 용량을 넘을 때. 예로 1,536차원 1억 벡터 인덱스는 HNSW에 복제본당 약 700 GB RAM(float32 벡터만 614 GB). DiskANN으로 전체 벡터·그래프를 NVMe SSD에, 압축 코드만 RAM에 둬 RAM 요구를 90-95% 줄이며 10ms 미만 쿼리 유지. 쿼리당 몇 ms를 흡수할 수 있는 모든 워크로드(LLM 호출이 종단 지연을 지배하는 대부분 RAG 트래픽)에 막대한 TCO 감소.

### Q: 벡터 DB에서 메타데이터 필터링이 흔히 병목인 이유는?

**좋은 답변:**
나이브 벡터 검색은 "Top K" 최근접 이웃을 찾고 **그다음** 메타데이터로 필터(예: "2024 문서만")한다. 필터가 아주 제한적이면 필터 후 0개가 될 수 있다. 전문 DB는 이제 **HNSW 사전 필터링**으로 그래프를 순회하되 불리언 메타데이터 제약 만족 노드만 고려한다. 이는 HNSW의 "단락" 로직을 깨서 연산 비싸므로, 지연을 낮게 유지하려면 전문 비트마스크나 하드웨어 가속(SIMD)이 필요.

### Q: 벡터 DB에서 멀티테넌시를 어떻게 다루나?

**좋은 답변:**
세 주요 접근:

**1. 메타데이터 필터링(가장 흔함):**
```python
results = db.search(
    vector=query,
    filter={"tenant_id": current_tenant}
)
```
- 장점: 단순, 단일 인덱스
- 단점: 모든 테넌트 자원 공유, 데이터 노출 버그 가능

**2. 테넌트별 컬렉션:**
```python
results = db.collection(f"tenant_{tenant_id}").search(vector=query)
```
- 장점: 강한 격리, 테넌트별 확장
- 단점: 많은 컬렉션, 운영 부담

**3. 테넌트별 네임스페이스(Pinecone):**
```python
results = index.query(vector=query, namespace=tenant_id)
```
- 장점: 단일 인덱스 내 격리
- 단점: 벤더 특화

**나라면:**
- 대부분 메타데이터 필터링(단순, 비용 효율)
- 고보안 요구엔 별도 컬렉션
- 누출 위험으로 사후 필터(전부 검색 후 필터) 금지

**하이브리드 검색 함정:** BM25 점수는 코퍼스 전역 IDF 통계에 의존. 공유 컬렉션에선 한 큰 테넌트의 어휘가 다른 모든 테넌트의 키워드 점수를 이동시키고 용어 통계가 경계를 넘어 누출. 테넌트별 IDF 엔진(Qdrant 1.19가 sparse·BM25에 추가)을 쓰거나 큰 테넌트에 자체 컬렉션을 주라.

---

## 참고 문헌

- Malkov and Yashunin. "Efficient and robust approximate nearest neighbor search using HNSW graphs" (2018)
- Subramanya et al. "DiskANN..." (Microsoft Research, NeurIPS 2019)
- [OpenSearch. "k-NN index: HNSW memory estimation"](https://docs.opensearch.org/2.9/search-plugins/knn/knn-index/)
- Pinecone Documentation: https://docs.pinecone.io/
- Qdrant Documentation: https://qdrant.tech/documentation/
- Weaviate Documentation: https://weaviate.io/developers/weaviate
- Milvus Documentation: https://milvus.io/docs
- pgvector: https://github.com/pgvector/pgvector
- [Milvus 3.0.0 release notes (2026-07)](https://github.com/milvus-io/milvus/releases/tag/v3.0.0)
- [Qdrant 1.19 release (2026-08)](https://qdrant.tech/blog/qdrant-1.19.x/)
- [Weaviate 1.39 release (2026-08)](https://weaviate.io/blog/weaviate-1-39-release)
- [Elasticsearch release notes](https://www.elastic.co/docs/release-notes/elasticsearch)
- [turbopuffer. "RIP, vector database" (2026-09)](https://turbopuffer.com/blog/rip-vector-database)
- [Qdrant-FineWeb-10B benchmark (2026-09)](https://qdrant.tech/blog/qdrant-fineweb-10b-release/)
- [Cloudflare AI Search pricing](https://developers.cloudflare.com/ai-search/platform/limits-pricing/)

---

*이전: [임베딩 모델](03-embedding-models.md) | 다음: [하이브리드 검색](05-hybrid-search.md)*
