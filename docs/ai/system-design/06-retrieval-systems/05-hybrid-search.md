---
title: 하이브리드 검색
sidebar_position: 5
description: dense(의미)와 sparse(키워드) 검색을 결합해 양쪽 이점을 얻는 하이브리드 검색 — dense vs sparse, 아키텍처, 융합 방법(RRF·가중·상대점수), 학습된 희소 임베딩(SPLADE), 튜닝, 프로덕션 고려사항.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/05-hybrid-search.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 하이브리드 검색

하이브리드 검색은 dense(의미)와 sparse(키워드) 검색을 결합해 양쪽 이점을 얻는다. 프로덕션 RAG의 기준선이다: Elasticsearch `rrf`·`linear` 리트리버, OpenSearch 하이브리드 검색, Weaviate, Qdrant, Milvus, Azure AI Search 모두 네이티브 하이브리드 파이프라인을 기본 제공. Pinecone은 BM25 전문 검색을 추가(2026-09-09 GA)했으나 요청당 한 점수 타입으로 순위하므로 어휘·벡터 결과를 클라이언트 측에서 융합한다.

## 왜 하이브리드 검색인가

dense도 sparse도 보편적으로 더 낫지 않다. 각각 다른 쿼리 유형에 뛰어나다.

### 쿼리 유형 분석

| 쿼리 유형 | 예시 | 더 나은 검색 |
|------------|---------|------------------|
| 개념적 | "트랜스포머는 어떻게 배우나?" | Dense |
| 키워드 특정 | "GPT-4 API 레이트 리밋" | Sparse |
| 고유명사 | "John Smith의 BERT 연구" | Sparse |
| 약어·코드 | "HTTP 429가 뭔 뜻?" | Sparse |
| 패러프레이즈 | "AI를 빠르게" vs "LLM 최적화" | Dense |
| 혼합 | "GPT-4o API 비용은?" | Hybrid |

**뉘앙스**: dense 전용 검색은 특정 버전 번호·함수명이 정보 가치의 90%를 쥔 기술 문서에서 실패한다.

### 간극 문제

dense 검색은 정확 일치를 놓칠 수 있다:

```
Query: "Configure NVIDIA_VISIBLE_DEVICES"
Document: "Set the NVIDIA_VISIBLE_DEVICES environment variable..."

Dense search may miss this because:
- "NVIDIA_VISIBLE_DEVICES" might tokenize poorly
- Semantic embedding does not capture exact string matching
- Training data may not have this specific term
```

sparse 검색(BM25)은 정확 토큰 일치로 이를 즉시 찾는다.

---

## Dense vs Sparse 검색

### Dense(의미) 검색

신경 임베딩으로 의미를 매칭.

```python
def dense_search(query: str, top_k: int = 10) -> list[Result]:
    query_embedding = embedding_model.encode(query)
    results = vector_db.search(query_embedding, top_k=top_k)
    return results
```

**강점:**
- 패러프레이즈·동의어 이해
- 개념 유사도 포착
- 다국어 작동(다국어 모델로)

**약점:**
- 정확 키워드 일치 놓칠 수 있음
- 엔티티·코드·약어에 약함
- 임베딩 모델 필요

### Sparse(키워드) 검색

용어 빈도·통계(BM25, TF-IDF) 사용.

```python
def sparse_search(query: str, top_k: int = 10) -> list[Result]:
    tokens = tokenize(query)
    results = bm25_index.search(tokens, top_k=top_k)
    return results
```

**강점:**
- 정확 일치에 뛰어남
- 희귀 용어·코드·엔티티 처리
- 빠르고 해석 가능
- 학습 불필요

**약점:**
- 의미 유사도 놓침
- 동의어 이해 없음
- 어휘 불일치에 민감

### 정면 비교

| 측면 | Dense | Sparse | Hybrid |
|--------|-------|--------|--------|
| 의미 매칭 | 최고 | 빈약 | 최고 |
| 정확 매칭 | 빈약 | 최고 | 최고 |
| 희귀 용어 | 빈약 | 최고 | 매우 좋음 |
| 제로샷 도메인 | 매우 좋음 | 최고 | 최고 |
| 지연 | 중간 | 빠름 | 중간 |
| 구현 | 중간 | 단순 | 복잡 |

---

## 하이브리드 검색 아키텍처

### 아키텍처 1: 병렬 검색 + 융합

```
                    +------------------+
                    |      Query       |
                    +--------+---------+
                             |
              +--------------+--------------+
              v                             v
    +-------------------+         +-------------------+
    |  Dense Retrieval  |         |  Sparse Retrieval |
    |   (Vector DB)     |         |    (BM25/ES)      |
    +---------+---------+         +---------+---------+
              |                             |
              +--------------+--------------+
                             v
                    +-------------------+
                    |      Fusion       |
                    |  (RRF, weighted)  |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    |  Final Results    |
                    +-------------------+
```

**장점:** 명확한 분리, 각각 최고 엔진 사용 가능(예: Pinecone + Algolia), 독립 튜닝
**단점:** 유지할 두 시스템, 높은 지연(느린 엔진 대기)

### 아키텍처 2: 네이티브 하이브리드(단일 시스템)

일부 벡터 DB는 하이브리드를 네이티브 지원:

```python
# Weaviate (Python client v4)
docs = client.collections.use("Document")
results = docs.query.hybrid(
    query="Configure NVIDIA_VISIBLE_DEVICES",
    alpha=0.5,  # 0 = sparse only, 1 = dense only
)

# Qdrant (Query API: prefetch both arms, fuse server-side)
from qdrant_client import models

results = client.query_points(
    collection_name="docs",
    prefetch=[
        models.Prefetch(query=dense_embedding, using="dense", limit=40),
        models.Prefetch(
            query=models.SparseVector(indices=sparse_indices, values=sparse_values),
            using="sparse",
            limit=40,
        ),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=10,
).points
```

**장점:** 단일 시스템, 단순 운영, 낮은 지연
**단점:** 제한된 융합 커스터마이즈, 키워드 vs 벡터 인프라 확장 유연성 적음

### 아키텍처 3: 단계적 검색

```
Query --> Sparse (fast, broad) --> Top 1000
                    |
                    v
          Dense reranking --> Top 100
                    |
                    v
           Cross-encoder --> Top 10
```

**장점:** 효율적, 각 단계가 정제
**단점:** 더 복잡, 초기 단계 오류 위험

---

## 융합 방법

### 상호 순위 융합(RRF)

RRF는 서로 다른 두 검색 엔진 결과 결합의 골드 스탠더드. *점수*(엔진 간 비교 불가)가 아니라 **순위**를 본다.

```python
def reciprocal_rank_fusion(
    rankings: list[list[str]],  # List of doc_id lists
    k: int = 60
) -> list[tuple[str, float]]:
    scores = defaultdict(float)

    for ranking in rankings:
        for rank, doc_id in enumerate(ranking):
            scores[doc_id] += 1 / (k + rank + 1)

    sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_docs
```

**속성:**
- 위치 기반, 원시 점수 무시
- 점수 스케일 차이에 강건: 높은 수치 점수만으로 한 엔진이 "지배"하는 것 방지
- k 파라미터가 순위 민감도 통제(높은 k = 위치에 덜 민감)
- 구현 단순, k 외 튜닝 없음

**전형적 k 값:** 60(원 논문), 실무 10-100

### 가중 점수 융합

정규화 점수 결합:

```python
def weighted_fusion(
    dense_results: list[Result],
    sparse_results: list[Result],
    alpha: float = 0.5  # Weight for dense
) -> list[Result]:
    # Normalize scores to [0, 1]
    dense_normalized = normalize_scores(dense_results)
    sparse_normalized = normalize_scores(sparse_results)

    # Combine
    combined = {}
    for r in dense_normalized:
        combined[r.id] = alpha * r.score
    for r in sparse_normalized:
        combined[r.id] = combined.get(r.id, 0) + (1 - alpha) * r.score

    sorted_docs = sorted(combined.items(), key=lambda x: x[1], reverse=True)
    return sorted_docs

def normalize_scores(results: list[Result]) -> list[Result]:
    if not results:
        return []
    min_score = min(r.score for r in results)
    max_score = max(r.score for r in results)
    range_score = max_score - min_score + 1e-6

    return [
        Result(id=r.id, score=(r.score - min_score) / range_score)
        for r in results
    ]
```

**속성:**
- 실제 점수 사용(순위보다 정보 많음)
- 점수 정규화 필요
- alpha가 dense vs sparse 균형 통제

### 상대 점수 융합

점수 분포 반영:

```python
def relative_score_fusion(
    dense_results: list[Result],
    sparse_results: list[Result]
) -> list[Result]:
    # Use z-score normalization
    dense_normalized = z_score_normalize(dense_results)
    sparse_normalized = z_score_normalize(sparse_results)

    # Combine
    combined = {}
    for r in dense_normalized:
        combined[r.id] = r.score
    for r in sparse_normalized:
        combined[r.id] = combined.get(r.id, 0) + r.score

    return sorted(combined.items(), key=lambda x: x[1], reverse=True)

def z_score_normalize(results: list[Result]) -> list[Result]:
    scores = [r.score for r in results]
    mean = sum(scores) / len(scores)
    std = (sum((s - mean) ** 2 for s in scores) / len(scores)) ** 0.5 + 1e-6

    return [Result(id=r.id, score=(r.score - mean) / std) for r in results]
```

### 융합 방법 비교

| 방법 | 점수 사용 | 쿼리 적응 | 복잡도 |
|--------|-------------|----------------|------------|
| RRF | 아니오(순위만) | 아니오 | 낮음 |
| 가중 RRF | 아니오(순위, 암별 가중) | 아니오 | 낮음 |
| 가중 | 예 | 아니오 | 낮음 |
| 상대 점수 | 예 | 부분 | 중간 |
| 학습 | 예 | 예 | 높음 |

**엔진 현황:** Elasticsearch는 `rrf` 리트리버 또는 점수 기반 `linear` 리트리버로 융합. Weaviate는 상대 점수 융합 기본. Qdrant는 Query API에 RRF·분포 기반 점수 융합. Milvus 3.0.1은 RRF의 스케일 독립성을 유지하며 한 암을 선호하게 하는 가중 RRF 추가.

---

## 학습된 희소 임베딩(SPLADE)

프로덕션 스택은 하이브리드 검색의 sparse 암에서 BM25(단순 단어 빈도)를 넘어 **학습된 희소 임베딩**으로 옮겨갔다.

**기법**: **SPLADE v3** 같은 모델이 사전의 모든 단어에 "중요도 가중치"를 예측.

**왜?**: SPLADE는 쿼리를 "확장"할 수 있다. "CPU"를 검색하면 쿼리에 "processor"가 없어도 그 용어에 작은 가중을 자동 추가할 수 있다. sparse의 정확 일치 힘과 dense의 개념 힘을 단일 저장 포맷에 결합.

### SPLADE 구현

```python
import torch
from transformers import AutoModelForMaskedLM, AutoTokenizer

class SpladeEncoder:
    def __init__(self, model_name="naver/splade-cocondenser-ensembledistil"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForMaskedLM.from_pretrained(model_name)

    def encode(self, text: str) -> dict[str, float]:
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True)
        outputs = self.model(**inputs)

        # Get sparse weights
        weights = torch.max(
            torch.log(1 + torch.relu(outputs.logits)) * inputs["attention_mask"].unsqueeze(-1),
            dim=1
        ).values.squeeze()

        # Convert to sparse dict
        non_zero = weights.nonzero().squeeze().tolist()
        sparse_vec = {
            self.tokenizer.decode([idx]): weights[idx].item()
            for idx in non_zero
            if weights[idx] > 0
        }

        return sparse_vec
```

**BM25+Dense 하이브리드보다 SPLADE를 쓸 때:** SPLADE는 현대 벡터 DB(Milvus·Qdrant)에 dense 벡터와 나란히 저장 가능한 희소 벡터를 생성해, 별도 Elasticsearch·BM25 인덱스 없이 한 패스로 하이브리드 검색 가능. 신경 모델이 학습 중 못 봤을 극히 희귀한 비언어 토큰(고유 시리얼 번호 등)이 데이터셋에 있으면 BM25를 고수하라.

**희소 인덱스가 따라잡았다.** 학습된 희소 벡터는 문서당 비영(非零) 용어가 BM25보다 훨씬 많아, 키워드 검색용 역인덱스에선 느렸다. Milvus 3.0은 희소 인덱스를 SINDI·Block-Max WAND·Block-Max MaxScore로 재구축; Milvus는 압축 BM25 인덱스가 2.6 크기의 약 1/3, SINDI가 학습 희소 벡터에서 MaxScore의 최대 약 10배 QPS라 보고(벤더).

---

## 구현 패턴

### 패턴 1: Elasticsearch + 벡터 DB

```python
import asyncio

class HybridSearcher:
    def __init__(self, es_client, vector_db, embedding_model):
        self.es = es_client
        self.vector_db = vector_db
        self.embedding_model = embedding_model

    async def search(self, query: str, top_k: int = 10) -> list[Result]:
        # Parallel retrieval
        dense_results, sparse_results = await asyncio.gather(
            self.dense_search(query, top_k * 3),
            self.sparse_search(query, top_k * 3),
        )

        # Fusion
        combined = reciprocal_rank_fusion([
            [r.id for r in dense_results],
            [r.id for r in sparse_results]
        ])

        return combined[:top_k]

    async def dense_search(self, query: str, top_k: int) -> list[Result]:
        embedding = self.embedding_model.encode(query)
        return await self.vector_db.search(embedding, top_k=top_k)

    async def sparse_search(self, query: str, top_k: int) -> list[Result]:
        # es_client is an AsyncElasticsearch instance
        response = await self.es.search(
            index="documents",
            query={"match": {"content": query}},
            size=top_k,
        )
        return [
            Result(id=hit["_id"], score=hit["_score"])
            for hit in response["hits"]["hits"]
        ]
```

### 패턴 2: Weaviate 네이티브 하이브리드

```python
import weaviate
from weaviate.classes.query import HybridFusion

def hybrid_search_weaviate(
    client: weaviate.WeaviateClient,
    query: str,
    alpha: float = 0.5,
    top_k: int = 10
) -> list[dict]:
    docs = client.collections.use("Document")
    response = docs.query.hybrid(
        query=query,
        alpha=alpha,  # 0 = BM25 only, 1 = vector only
        fusion_type=HybridFusion.RELATIVE_SCORE,
        limit=top_k,
    )

    return [obj.properties for obj in response.objects]
```

---

## 튜닝과 최적화

### Alpha 튜닝

alpha 파라미터가 dense vs sparse 균형:

```python
def find_optimal_alpha(
    test_queries: list[tuple[str, list[str]]],  # (query, relevant_doc_ids)
    alpha_range: list[float] = [0.0, 0.3, 0.5, 0.7, 1.0]
) -> float:
    best_alpha = 0.5
    best_ndcg = 0

    for alpha in alpha_range:
        ndcg_scores = []
        for query, relevant in test_queries:
            results = hybrid_search(query, alpha=alpha)
            ndcg = compute_ndcg(results, relevant)
            ndcg_scores.append(ndcg)

        avg_ndcg = sum(ndcg_scores) / len(ndcg_scores)
        if avg_ndcg > best_ndcg:
            best_ndcg = avg_ndcg
            best_alpha = alpha

    return best_alpha
```

**베스트 프랙티스·전형적 소견:**
- 기술 문서·코드: alpha 0.3-0.4(키워드 중심)
- 일반 텍스트: alpha 0.5(균형)
- 챗·창작 탐색: alpha 0.7-0.9(의미 중심)

### 쿼리 적응 Alpha

쿼리별 최적 alpha 예측:

```python
def predict_alpha(query: str) -> float:
    # Heuristics-based
    has_quotes = '"' in query
    has_code = any(c in query for c in ['_', '()', '{}', '[]'])
    has_numbers = any(c.isdigit() for c in query)

    # More sparse for exact match queries
    if has_quotes or has_code:
        return 0.3
    if has_numbers:
        return 0.4

    # More semantic for natural language
    if len(query.split()) > 5:
        return 0.7

    return 0.5  # Default balanced
```

### 다양성과 비즈니스 규칙

융합은 문서별 관련성을 최적화하므로 같은 출처의 근중복 청크가 top-k를 채울 수 있다. 애플리케이션 코드에 있던 통제 둘이 Weaviate 1.39(2026-08)에서 GA 엔진 기능이 됨:
- **MMR(최대 한계 관련성)**: 하이브리드·벡터 검색용, 관련성 vs 다양성을 교환하는 0.0~1.0 균형 파라미터(하이브리드엔 Python client 4.23.0+).
- **Boost API**: 필터 일치·속성값·시간 감쇠·수치 감쇠로 결과를 승강하는 쿼리 시 재점수, 아무것도 필터아웃하지 않음. 결과 집합을 비울 수 있는 하드 필터 대신 신선도·"공식 문서 선호" 규칙에 사용.

### 검색 깊이

융합 전 몇 결과를 가져올지:

```python
# Rule of thumb: fetch 3-5x more from each source
def hybrid_search(query: str, final_k: int = 10):
    fetch_k = final_k * 4

    dense_results = dense_search(query, top_k=fetch_k)
    sparse_results = sparse_search(query, top_k=fetch_k)

    fused = rrf([dense_results, sparse_results])
    return fused[:final_k]
```

---

## 프로덕션 고려사항

### 지연 예산

```
Typical hybrid search latency breakdown:

Dense embedding:           30-50ms
Dense retrieval:          30-50ms
Sparse retrieval:         20-40ms  (parallel with dense)
Fusion:                    1-5ms
Total:                   60-100ms
```

**최적화:**
- dense·sparse 병렬 실행
- 흔한 쿼리 임베딩 사전 계산
- 둘 다 근사 검색
- 반복 쿼리 융합 결과 캐시

### 멀티테넌트 키워드 점수

BM25는 코퍼스 통계(IDF)에 의존. 공유 멀티테넌트 컬렉션에선 한 큰 테넌트의 어휘가 다른 모든 테넌트의 키워드 점수를 이동시켜, 같은 쿼리·문서가 인덱스에 누가 또 있느냐에 따라 다르게 순위되고 용어 통계가 테넌트 간 누출. Qdrant 1.19가 sparse·BM25에 테넌트별 IDF 추가; 다른 곳은 큰 테넌트에 자체 인덱스를 주거나 드리프트를 수용하고 테넌트별 평가.

### 캐싱 전략

```python
class HybridSearchCache:
    def __init__(self, ttl_seconds: int = 300):
        self.cache = TTLCache(ttl=ttl_seconds)

    def search(self, query: str, **kwargs) -> list[Result]:
        cache_key = self._make_key(query, kwargs)

        if cache_key in self.cache:
            return self.cache[cache_key]

        results = self._do_search(query, **kwargs)
        self.cache[cache_key] = results
        return results

    def _make_key(self, query: str, kwargs: dict) -> str:
        return hashlib.sha256(
            f"{query}:{sorted(kwargs.items())}".encode()
        ).hexdigest()
```

### 폴백 전략

```python
def hybrid_search_with_fallback(query: str, top_k: int = 10) -> list[Result]:
    try:
        return hybrid_search(query, top_k=top_k)
    except DenseSearchError:
        # Fallback to sparse only
        return sparse_search(query, top_k=top_k)
    except SparseSearchError:
        # Fallback to dense only
        return dense_search(query, top_k=top_k)
```

---

## 면접 질문

### Q: 언제 순수 dense보다 하이브리드 검색을 쓰나?

**좋은 답변:**
하이브리드를 쓸 때:

1. **쿼리가 특정 용어 포함:** 제품 코드, API 명, 에러 코드. dense가 정확 일치 놓칠 수 있음.
2. **도메인에 전문 어휘:** 기술 문서, 법률, 의료. sparse가 특정 용어 포착.
3. **제로샷 검색:** 파인튜닝 임베딩 없는 신 도메인. sparse가 강건한 기준선.
4. **품질 임계:** 하이브리드가 단독보다 나쁜 경우 드묾, 복잡성 비용은 있음.

**순수 dense 고수:**
- 쿼리가 순수 개념·의미적
- 지연 예산 매우 빡빡
- 단순 아키텍처 우선
- 임베딩 모델이 도메인에 잘 튜닝됨

결정은 경험적. 실제 쿼리 분포에서 하이브리드 vs dense A/B 테스트.

### Q: RRF가 "단순 점수 합산"보다 안전한 이유는?

**좋은 답변:**
단순 점수 합산은 벡터·키워드 점수가 완전히 다른 스케일이라 위험하다. 코사인 유사도는 -1~1에 묶이고 많은 임베더가 좁은 양수 밴드로 밀어넣음; BM25는 무한하고 코퍼스 통계·쿼리 길이로 이동. 운 좋은 키워드 일치의 극도로 높은 BM25 점수가 관련 높은 의미 일치 10개를 "익사"시킬 수 있다. RRF는 절대 점수를 무시하고 상대 순서(순위)만 보므로, 이상치와 엔진 간 점수 드리프트에 둔감하다.

### Q: 언제 표준 BM25+Dense 하이브리드보다 SPLADE를 고르나?

**좋은 답변:**
인프라를 단순화하고 싶을 때. SPLADE는 많은 현대 벡터 DB(Milvus·Qdrant)에 dense 벡터와 나란히 저장 가능한 희소 벡터를 생성한다. 별도 Elasticsearch·BM25 인덱스 없이 한 패스로 "하이브리드 검색"을 수행하게 한다. 단, 신경 모델이 학습 중 못 봤을 극히 희귀한 비언어 토큰(고유 시리얼 번호 등)이 데이터셋에 있으면 BM25를 고수한다.

### Q: 하이브리드 검색에서 dense vs sparse를 어떻게 균형 잡나?

**좋은 답변:**
alpha 파라미터가 균형 통제(보통 dense 가중):

**튜닝 접근:**
1. alpha=0.5(동등 가중)로 시작
2. 쿼리·관련성 라벨 평가셋 생성
3. [0.1, 0.3, 0.5, 0.7, 0.9] alpha 그리드 서치
4. 각 설정에서 NDCG·MRR 측정
5. 평가 지표 최대 alpha 선택

**쿼리 적응 튜닝:**
- 쿼리 유형 탐지(키워드 중심, 개념적, 혼합)
- 쿼리별 alpha 조정
- 단순 휴리스틱·학습 분류기 사용 가능

**어림 규칙:**
- 기술·코드 쿼리: alpha 0.3-0.4
- 일반 텍스트: alpha 0.5
- 대화형: alpha 0.7-0.8

---

## 참고 문헌

- Cormack et al. "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods" (2009)
- Formal et al. "SPLADE..." (2021/2025)
- Weaviate Hybrid Search: https://weaviate.io/developers/weaviate/search/hybrid
- Qdrant Hybrid Search: https://qdrant.tech/documentation/concepts/hybrid-queries/
- [Elasticsearch release notes (9.5)](https://www.elastic.co/docs/release-notes/elasticsearch)
- [Pinecone full-text search GA (2026-09)](https://www.pinecone.io/blog/full-text-search-generally-available/)
- [Milvus 3.0.0 release notes (2026-07)](https://github.com/milvus-io/milvus/releases/tag/v3.0.0)

---

*이전: [벡터 데이터베이스](04-vector-databases.md) | 다음: [재순위 전략](06-reranking-strategies.md)*
