---
title: 레이트 인터랙션과 ColBERT
sidebar_position: 11
description: 빠르나 부정확한 바이 인코더와 정확하나 느린 크로스 인코더 사이에 앉는 검색 패러다임 — ColBERT 아키텍처, MaxSim, ColBERTv2·PLAID, 범용 벡터 DB의 멀티벡터(MUVERA), 배포 패턴.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/11-late-interaction-colbert.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 레이트 인터랙션과 ColBERT

레이트 인터랙션은 빠르나 부정확한 **바이 인코더**와 정확하나 느린 **크로스 인코더** 사이에 앉는 검색 패러다임이다. ColBERT(BERT 위 문맥화 레이트 인터랙션)가 이 공간의 대표 모델로, 바이 인코더 수준 속도에 크로스 인코더 수준 정확도를 낸다. 레이트 인터랙션 계열은 고정밀 검색의 프로덕션 대안으로 성숙했고, 멀티모달 확장(ColPali, ColQwen2.5, ColNomic, Wholembed v3 같은 통합 검색기)이 이제 같은 도구에 들어왔다.

## 검색 아키텍처 스펙트럼

신경 검색엔 세 근본 아키텍처가 있다. 레이트 인터랙션이 어디 맞는지 이해하는 것이 이 장의 핵심.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   SPEED ◄──────────────────────────────────────────────► ACCURACY   │
│                                                                     │
│   Bi-Encoder          Late Interaction          Cross-Encoder       │
│   (Single Vector)     (Multi-Vector)            (Full Attention)    │
│                                                                     │
│   ● Fast (< 10ms)     ● Balanced (10-50ms)      ● Slow (100ms+)   │
│   ● Low accuracy       ● High accuracy           ● Highest accuracy│
│   ● Scales to 1B+     ● Scales to 100M+         ● Scales to 10K   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 각 아키텍처가 쿼리-문서 쌍을 처리하는 방식

```
BI-ENCODER (e.g., E5, BGE):
  Query  ──► Encoder ──► [1 vector]  ─┐
                                      ├──► dot product ──► score
  Doc    ──► Encoder ──► [1 vector]  ─┘

  Total interaction: 1 comparison

─────────────────────────────────────────────

LATE INTERACTION (ColBERT):
  Query  ──► Encoder ──► [N vectors] ─┐
                (one per token)       ├──► MaxSim ──► score
  Doc    ──► Encoder ──► [M vectors] ─┘
                (one per token)

  Total interaction: N x M comparisons (but decomposable)

─────────────────────────────────────────────

CROSS-ENCODER (e.g., ms-marco-MiniLM):
  [Query + Doc] ──► Encoder ──► score

  Total interaction: Full self-attention across
                     all query AND document tokens
```

**통찰**: 결정적 차이는 쿼리와 문서가 *언제* 상호작용하느냐다. 바이 인코더는 결코 상호작용 안 함(독립 인코딩). 크로스 인코더는 완전 상호작용(공동 인코딩). 레이트 인터랙션은 중간: 독립 인코딩 후 토큰 수준에서 싸게 상호작용.

---

## ColBERT 아키텍처

ColBERT는 쿼리·문서를 (단일 벡터가 아니라) **토큰 수준 임베딩 행렬**로 인코딩하고 세밀한 토큰 상호작용으로 점수한다.

### 인코딩 단계

```
Query: "What is the price of Widget-X?"

Token Embeddings (each 128-dim):
  q1 = Embed("What")     = [0.12, -0.34, ..., 0.08]
  q2 = Embed("is")       = [0.05, -0.11, ..., 0.22]
  q3 = Embed("the")      = [0.01, -0.02, ..., 0.15]
  q4 = Embed("price")    = [0.45,  0.67, ..., 0.91]  ◄── high signal
  q5 = Embed("of")       = [0.03, -0.05, ..., 0.11]
  q6 = Embed("Widget-X") = [0.88,  0.21, ..., 0.73]  ◄── high signal

Document: "Widget-X costs $200 per month for the Standard plan"

Token Embeddings:
  d1 = Embed("Widget-X")  = [0.85,  0.19, ..., 0.71]
  d2 = Embed("costs")     = [0.42,  0.63, ..., 0.88]
  d3 = Embed("$200")      = [0.31,  0.55, ..., 0.79]
  d4 = Embed("per")       = [0.02, -0.01, ..., 0.09]
  d5 = Embed("month")     = [0.11,  0.08, ..., 0.14]
  d6 = Embed("Standard")  = [0.38,  0.44, ..., 0.62]
  d7 = Embed("plan")      = [0.29,  0.37, ..., 0.51]
```

**핵심 설계 선택**: ColBERT는 **128차원** 토큰 임베딩 사용(표준 바이 인코더의 768-1024 대비). 문서당 벡터 1개가 아니라 N개를 저장하므로 저장 효율에 이 작은 차원이 결정적.

### 오프라인 vs 온라인 연산

| 구성요소 | 시점 | 비용 |
|-----------|------|------|
| 문서 인코딩 | 오프라인(인덱싱) | 일회성, 병렬화 가능 |
| 쿼리 인코딩 | 온라인(쿼리당) | 빠름(GPU 약 5-10ms) |
| MaxSim 점수 | 온라인(쿼리당) | 토큰 수준 연산, PLAID 최적화 |

**이 분해가 ColBERT를 빠르게 만든다**: 문서는 한 번 사전 인코딩. 쿼리 시 쿼리만 인코딩 필요하고 점수는 사전 계산 벡터 위 단순 산술.

---

## MaxSim: 핵심 점수 메커니즘

MaxSim(최대 유사도)이 레이트 인터랙션을 작동하게 하는 연산자. 개념적으로 단순하나 놀랍도록 강력.

### MaxSim 작동 방식

```
For each query token qi:
  1. Compute dot product with EVERY document token dj
  2. Keep only the MAXIMUM score

Score(Q, D) = SUM over all qi of MAX over all dj of (qi . dj)
```

### 작동 예시

```
            d1        d2       d3       d4       d5
          Widget-X   costs    $200     per     month
  q4       0.41      0.89*    0.73     0.01     0.05
  price
  q6       0.95*     0.38     0.27     0.01     0.03
  Widget-X

  * = maximum for that query token

  MaxSim contribution from q4 ("price"): 0.89 (matched "costs")
  MaxSim contribution from q6 ("Widget-X"): 0.95 (matched "Widget-X")

  Total Score = sum of all max values across all query tokens
```

### MaxSim이 단일 벡터 유사도를 능가하는 이유

| 속성 | 단일 벡터(내적) | MaxSim(레이트 인터랙션) |
|----------|----------------------------|--------------------------|
| **입도** | 문서 수준 | 토큰 수준 |
| **부분 매칭** | 전부 아니면 전무 | 토큰이 독립 매치 |
| **용어 중요도** | 1 벡터로 압축 | 각 토큰이 따로 기여 |
| **희귀 용어** | 평균화로 희석 | 개별 벡터로 보존 |

**직관**: 바이 인코더에선 "Widget-X" 의미가 "costs"·"$200" 등 모든 토큰과 단일 벡터로 평균화. "Widget-X"가 희귀하면 신호가 희석. ColBERT에선 "Widget-X"가 자기 전용 벡터를 유지해 MaxSim이 그걸 독립적으로 강하게 매치 가능.

---

## ColBERTv2와 PLAID 인덱싱

원 ColBERT(2020)엔 결정적 한계가 있었다: **저장**. 모든 문서 모든 토큰에 128차원 벡터 저장은 비싸다. 각 200토큰 1천만 문서는 20억 토큰 벡터: float32로 약 1 TB, float16로도 512 GB.

### ColBERTv2 개선(2021)

ColBERTv2가 두 핵심 혁신 도입:

**1. 잔차 압축**:

```
Original ColBERT:
  Each token vector: 128 dims x 32-bit float = 512 bytes

ColBERTv2 Residual Compression:
  1. Cluster all token vectors into centroids (k-means)
  2. Store only the centroid ID + residual (difference)
  3. Quantize the residual to 1-2 bits per dimension

  Each token vector: ~16-32 bytes (16-32x compression)
```

**2. 디노이즈 감독**:
- 크로스 인코더 교사에서 캔 하드 네거티브로 학습
- 크로스 인코더 라벨이 잡음 학습 데이터 "정리"
- 결과: 압축에도 더 나은 품질 임베딩

**ColBERTv2 저장 비교**:

| 시스템 | 토큰당 저장 | 1천만 문서(각 200토큰) |
|--------|------------------|---------------------------|
| ColBERT v1 | 512 bytes | 약 1 TB |
| ColBERTv2(압축) | 32 bytes | 약 64 GB |
| 바이 인코더(문서당 1벡터) | 3 KB | 약 30 GB |

### PLAID: 인덱싱 엔진

PLAID(성능 최적화 레이트 인터랙션 드라이버)가 ColBERT를 대규모에 실용적으로 만드는 인덱싱·검색 엔진.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLAID RETRIEVAL PIPELINE                     │
│                                                                 │
│  Stage 1: CANDIDATE GENERATION                                  │
│  ─────────────────────────────                                  │
│  For each query token, find nearest centroids                   │
│  Collect candidate passages that contain those centroids        │
│  Result: ~10,000 candidates from millions                       │
│                                                                 │
│  Stage 2: CENTROID INTERACTION (with pruning)                   │
│  ────────────────────────────────────────────                   │
│  Drop centroids whose query score is below a threshold          │
│  Approximate MaxSim using centroid-level scores only            │
│  Filter candidates to top ~1,000                                │
│                                                                 │
│  Stage 3: CENTROID INTERACTION (no pruning)                     │
│  ──────────────────────────────────────────                     │
│  Re-score survivors with all of their centroid IDs              │
│  (still no residuals decompressed)                              │
│  Filter to top ~100                                             │
│                                                                 │
│  Stage 4: FULL DECOMPRESSION                                    │
│  ────────────────────────────                                   │
│  Fully decompress token vectors for top candidates              │
│  Compute full MaxSim on the decompressed vectors                │
│  Return final ranked results                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**핵심 통찰**: PLAID는 모든 문서의 모든 벡터를 압축 해제하지 않는다. 각 단계가 후보 집합을 싸게 필터해 비싼 전체 점수가 코퍼스의 극히 일부에만 일어나게.

**PLAID 성능**:
- 단일 GPU에서 1천만+ 문서를 **50-100ms**에 검색
- 최종 후보에만 압축 해제(손실) 잔차 벡터 위 전체 MaxSim 계산. 후보 단계는 근사이므로 재현율은 가지치기 정도(`ncells`, 센트로이드 점수 임계)에 달림; 샘플에서 완전 MaxSim 대비 측정
- 센트로이드 가지치기로 전체 점수 전 코퍼스 99%+ 건너뜀

---

## 범용 벡터 DB의 멀티벡터(MUVERA)

PLAID는 전용 엔진이고 대부분 팀이 레이트 인터랙션만을 위한 둘째 검색 시스템을 원치 않는다. **MUVERA**(고정 차원 인코딩 통한 멀티벡터 검색, Google Research, NeurIPS 2024)가 그 간극을 메움: 문서의 토큰 벡터 집합을 내적이 MaxSim(Chamfer) 점수를 근사하는 하나의 긴 고정 길이 벡터로 바꿔, 평범한 단일 벡터 ANN 인덱스가 후보를 생성하게.

```
INDEX:  doc token vectors ──► FDE transform ──► 1 fixed-length vector ──► HNSW / DiskANN
                 └──────────────────────────────► keep the multi-vector set (compressed, on disk)

QUERY:  query token vectors ──► FDE ──► ANN top-k candidates
                                              └──► full MaxSim on stored multi-vectors ──► results
```

형태는 PLAID와 같다(싼 근사 후보, 수백 개에 전체 MaxSim)지만 후보 단계가 이미 운영하는 인프라에서 돈다. FDE는 길어(수천 차원) 보통 양자화.

**엔진 지원, 2026년 10월:**

| 엔진 | 멀티벡터 지원 | 상태 |
|--------|----------------------|--------|
| **Milvus 3.0** | 임베딩 리스트용 디스크 EmbList + DiskANN 인덱스, MUVERA·LEMUR 가속 | GA 2026-07-29(3.0.2 9/20) |
| **Weaviate** | 네이티브 멀티벡터 임베딩(1.29+), HNSW의 선택적 MUVERA 인코딩(1.31부터, 2025); 디스크 HFresh 인덱스용 MUVERA는 1.40 신규 | HNSW 멀티벡터·MUVERA 출시; HFresh MUVERA 경로는 1.40 RC(rc.2 2026-09-30), 비GA |
| **Qdrant** | MaxSim 점수 네이티브 멀티벡터 필드 | 출시; Qdrant 오픈 PubMed-Multi-Vector 데이터셋(83.7억 BGE-M3 토큰 벡터)이 dense vs sparse vs ColBERT 벤치 |
| **Vespa** | 네이티브 ColBERT 텐서 순위 | 출시 |

모델 측: Answer.AI가 2026-09-18 NeuML의 ColBERT-MUVERA micro·small 모델 ONNX 익스포트 발표.

### 벡터 자체 압축

다른 레버는 문서당 더 적은 벡터 저장. 페이지 이미지 검색기(ColPali식)엔 GLIE 논문(arXiv 2609.11808, 2026-09)이 시각 문서 토큰 벡터가 단위 구 위 내재 차원 5-6의 다양체 근처에 있음을 발견. 실무 결과 둘: k-means 센트로이드를 구로 재정규화하는 게 원시 센트로이드 대비 최대 +0.093 nDCG@5의 공짜 교정, 페이지당 학습 벡터 4개 + 상위 후보에 전체 집합을 재생성하는 415K 파라미터 디코더로 ViDoRe v1에서 무압축 nDCG@5의 거의 80% 유지(최고 사후 방법 70% 대비). 엔진 기능이 아닌 단일 연구 결과지만 같은 방향: 후보엔 컴팩트 표현, 전체 멀티벡터 점수는 상위에만.

---

## 레이트 인터랙션 vs 대안

### 종합 비교

| 차원 | BM25 | 바이 인코더 | ColBERT(레이트) | 크로스 인코더 |
|-----------|------|-----------|----------------|---------------|
| **인코딩** | 용어 빈도 | 문서당 1벡터 | 문서당 N벡터 | 공동(사전 계산 없음) |
| **쿼리 지연** | 약 5ms | 약 10ms | 약 30-50ms | 쌍당 약 500ms+ |
| **확장성** | 수십억 | 수십억 | 1억+ | 약 1만(재순위만) |
| **저장(100만 문서)** | 약 2 GB | 약 3 GB | 약 6-12 GB | 0(인덱스 없음) |
| **정확도(NDCG@10)** | 0.30-0.35 | 0.35-0.40 | 0.39-0.44 | 0.42-0.46 |
| **도메인 전이** | 강함(어휘) | 약함(파인튜닝 필요) | 강함(토큰 수준) | 가장 강함 |
| **설정 복잡도** | 낮음 | 중간 | 높음 | 낮음(인덱스 없음) |

### ColBERT가 이길 때

```
                  ▲ Accuracy
                  │
             0.45 ┤                     ● Cross-Encoder
                  │                   ●
             0.40 ┤              ● ColBERT
                  │         ●
             0.35 ┤    ● Bi-Encoder
                  │ ●
             0.30 ┤ BM25
                  │
                  └────┬────┬────┬────┬────┬──► Throughput (QPS)
                      10   100  1K   10K  100K
```

**ColBERT가 스위트스팟을 차지**: 보통 비슷한 크기 바이 인코더보다 몇 NDCG점을 더하고, 가장 큰 이득은 도메인 밖·용어 중심 코퍼스(전문 데이터셋에서 최대 +13.8% mAP), 크로스 인코더보다 10-50배 빠르면서.

---

## RAGatouille로 구현

RAGatouille(Answer.AI)가 RAG 파이프라인에서 ColBERT를 쓰는 표준 Python 라이브러리. Stanford ColBERT 코드베이스를 단순 고수준 API로 감쌈.

### 기본 사용

```python
from ragatouille import RAGPretrainedModel

# Load a pretrained ColBERT model
RAG = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")

# Index documents (one-time, creates PLAID index on disk)
documents = [
    "Widget-X costs $200 per month for the Standard plan.",
    "The Enterprise plan includes SSO and audit logs for $800/month.",
    "All plans include 99.9% uptime SLA and 24/7 email support.",
    "Widget-X was launched in 2023 and serves 10,000+ customers.",
]

index_path = RAG.index(
    index_name="products",
    collection=documents,
    split_documents=True  # auto-chunk long docs
)

# Search the index
results = RAG.search(
    query="How much does Widget-X cost?",
    k=3
)

for result in results:
    print(f"Score: {result['score']:.4f}")
    print(f"Text:  {result['content']}\n")
```

### LangChain 통합

```python
from ragatouille import RAGPretrainedModel
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# Create ColBERT retriever
RAG = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")
retriever = RAG.as_langchain_retriever(k=5)

# Build RAG chain
template = """Answer based on the following context:
{context}

Question: {question}"""

prompt = ChatPromptTemplate.from_template(template)
llm = ChatOpenAI(model="gpt-4o")

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
)

response = chain.invoke("What features does the Enterprise plan include?")
```

### 기타 ColBERT 라이브러리·통합

| 라이브러리 | 사용처 | 비고 |
|---------|----------|-------|
| **RAGatouille** | Python 우선, 단순 API | 프로토타이핑·중소 규모에 최적 |
| **colbert-ai**(Stanford) | 연구, 완전 통제 | 저수준, 설정 옵션 많음 |
| **Vespa** | 프로덕션 규모 배포 | 네이티브 ColBERT 지원 관리형 인프라 |
| **PyLate** | 유연한 학습·파인튜닝 | Sentence Transformers 기반, 커스텀 모델에 좋음 |
| **Jina ColBERT v2** | 다국어(89개 언어) | 유연한 출력 차원, 프로덕션 준비 |
| **Milvus 3.0/Weaviate/Qdrant** | 범용 벡터 DB 내 멀티벡터 | MUVERA·네이티브 MaxSim; 위 엔진 표 |

---

## 프로덕션 배포 패턴

### 패턴 1: 주 검색기로서 ColBERT

```
Query ──► ColBERT (PLAID) ──► Top 20 ──► LLM
```

적합: 정확도가 최우선이고 저장 오버헤드를 감당할 수 있는 중규모 코퍼스(100만-5천만 문서).

### 패턴 2: 재순위기로서 ColBERT(가장 흔함)

```
Query ──► BM25 or Bi-Encoder ──► Top 1000 ──► ColBERT Rerank ──► Top 20 ──► LLM
```

적합: 1단계 검색이 싸야 하나 크로스 인코더 비용 없이 고품질 재순위가 필요한 대규모 시스템.

```
┌─────────────────────────────────────────────────────────────────┐
│              COLBERT-AS-RERANKER ARCHITECTURE                   │
│                                                                 │
│  User Query                                                     │
│      │                                                          │
│      ▼                                                          │
│  First Stage: BM25 / Bi-Encoder                                 │
│  (cheap, high recall, Top 1000)                                 │
│      │                                                          │
│      ▼                                                          │
│  Second Stage: ColBERT MaxSim Reranking                         │
│  (pre-computed doc tokens, score Top 1000)                      │
│  Cost: only query encoding + MaxSim arithmetic                  │
│      │                                                          │
│      ▼                                                          │
│  Top 20 Passages ──► LLM Generation                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 패턴 3: 하이브리드(ColBERT + BM25 + Dense)

```
Query ──┬──► BM25 (Top 50) ────────┐
        ├──► Dense Bi-Encoder (50) ─┼──► RRF ──► ColBERT Rerank ──► Top 10
        └──► ColBERT (Top 50) ─────┘
```

적합: 중규모에서 최대 정확도. 비싸나 모든 검색 양식 커버.

### 저장·인프라 고려사항

| 코퍼스 크기 | 바이 인코더 저장 | ColBERT 저장 | GPU 요구 |
|------------|-------------------|-----------------|-----------------|
| 10만 문서 | 약 300 MB | 약 600 MB - 1.2 GB | CPU만 OK |
| 100만 문서 | 약 3 GB | 약 6-12 GB | GPU 1개 권장 |
| 1천만 문서 | 약 30 GB | 약 60-120 GB | GPU 1-2개 필요 |
| 1억 문서 | 약 300 GB | 약 600 GB - 1.2 TB | 멀티 GPU/분산 |

**현실 점검**: ColBERT 저장은 바이 인코더의 2-4배. 대부분 RAG 사용처(1천만 문서 미만)엔 관리 가능. 웹 규모 검색(수십억 페이지)엔 바이 인코더나 학습 희소 방법이 1단계 검색에 더 실용적. 디스크 상주 인덱스의 MUVERA식 후보 생성(오늘 Milvus 3.0 DiskANN, 1.40 GA 후 Weaviate HFresh)이 RAM 상한을 올림 — 단일 벡터 FDE 인덱스만 핫이면 되기 때문.

---

## 언제 ColBERT를 고르나

### 결정 프레임워크

```
Is your corpus < 100M documents?
├── No  ──► Use Bi-Encoder for retrieval + ColBERT for reranking
└── Yes
    │
    Is accuracy more important than infrastructure simplicity?
    ├── No  ──► Use Bi-Encoder (simpler, cheaper)
    └── Yes
        │
        Can you afford 2-4x storage vs. bi-encoder?
        ├── No  ──► Use Bi-Encoder + Cross-Encoder reranker
        └── Yes
            │
            Do you want to run a separate retrieval engine?
            ├── No  ──► MUVERA / native multi-vector in your vector DB
            └── Yes ──► Use ColBERT (PLAID) as primary retriever
```

### ColBERT vs Dense 검색 vs 하이브리드

| 시나리오 | 최선 선택 | 이유 |
|----------|-------------|-----|
| 범용 RAG(100만 문서 미만) | 하이브리드(Dense + BM25) | 가장 단순, 충분한 정확도 |
| 도메인 특화 검색(법률·의료) | ColBERT | 토큰 수준 매칭이 전문 용어 보존 |
| 다국어 코퍼스 | Jina ColBERT v2 | 네이티브 89개 언어 지원 |
| 비용 민감, 고볼륨 | 바이 인코더 + BM25 | 최저 저장·컴퓨트 |
| 최대 정확도, 중규모 | ColBERT + 재순위기 | 크로스 인코더 지연 없이 최고 품질 |
| 웹 규모(10억+ 문서) | 바이 인코더 1단계 + ColBERT 재순위 | ColBERT 인덱스가 주 검색엔 너무 큼 |

---

## 면접 질문

### Q: 바이 인코더·크로스 인코더·레이트 인터랙션의 차이를 설명하라. 언제 각각을 고르나?

**좋은 답변:**
세 아키텍처는 쿼리와 문서가 *언제* 상호작용하느냐로 다르다:

**바이 인코더**는 쿼리·문서를 단일 벡터로 독립 인코딩. 상호작용은 끝의 내적으로만. 빠르나(모든 문서 벡터 사전 계산, ms 검색) 세밀 매칭을 잃음: 전체 문서 의미가 벡터 공간의 한 점으로 압축.

**크로스 인코더**는 연결된 쿼리+문서를 단일 트랜스포머로 처리. 완전 셀프 어텐션이라 모든 쿼리 토큰이 모든 문서 토큰에 주의. 최고 정확도이나 아무것도 사전 계산 못 함. 모든 쿼리-문서 쌍이 전체 순전파를 요해 1단계 검색엔 불가. 상위 10-100 후보 재순위기로 사용.

**레이트 인터랙션(ColBERT)**은 쿼리·문서를 (바이 인코더처럼) 독립 인코딩하되 단일 벡터가 아닌 *토큰별* 벡터 행렬로. 점수는 MaxSim: 각 쿼리 토큰에 최적 매치 문서 토큰 찾기. 토큰 수준 입도를 보존하며 문서 사전 계산도 허용. 결과는 바이 인코더 속도 근처에 크로스 인코더 정확도 근처.

단순성이 중요한 대규모 1단계 검색엔 바이 인코더, 소수 후보 집합의 고위험 재순위엔 크로스 인코더, 크로스 인코더 정확도가 필요하나 그 지연을 감당 못 할 때 특히 용어 매칭이 중요한 도메인 특화 검색(법률·의료·기술 문서)엔 ColBERT를 고른다.

### Q: ColBERT는 토큰당 벡터 1개를 저장한다. 어떻게 확장하고 저장 트레이드오프는?

**좋은 답변:**
ColBERT의 나이브 저장 비용은 상당. 200토큰 문서는 각 128차원 벡터 200개(25,600 float)를, 바이 인코더는 768-1024차원 벡터 1개를 요함. 압축 전 문서당 약 25-33배 저장.

ColBERTv2가 **잔차 압축**으로 해결: 토큰 벡터를 센트로이드로 클러스터링, 센트로이드 ID + 양자화 잔차만 저장. 토큰 벡터당 16-32배 압축 달성, 실무 저장을 float32 바이 인코더의 약 2-4배로.

PLAID 인덱싱 엔진이 쿼리 시 다단계 파이프라인으로 효율을 더 개선. 각 쿼리 토큰 최근접 센트로이드에서 후보 생성, 센트로이드 ID만으로 점수(저점수 센트로이드 먼저 가지치기)해 코퍼스 99% 제거, 최종 후보에만 잔차 압축 해제. 압축 해제 잔차 벡터 위 최종 전체 MaxSim은 100개 미만 문서에 계산돼 1천만+ 코퍼스에도 50-100ms 유지. 후보 단계가 근사이니 가지치기를 공격적으로 튜닝하기 전 샘플에서 완전 MaxSim 대비 재현율 측정.

1억 문서 넘는 규모엔 주 검색기가 아니라 재순위기로 ColBERT 사용: 바이 인코더·BM25가 1단계 검색으로 후보를 1,000으로 좁히고 ColBERT MaxSim으로 고품질 재순위. 팀이 이미 Milvus·Qdrant·Weaviate를 돌리면 중간 경로는 MUVERA: ANN 후보 생성용 문서당 고정 차원 인코딩 1개 인덱싱, 상위 수백에 전체 MaxSim용 압축 토큰 벡터는 디스크에.

### Q: 500만 문서의 법률 문서 검색 시스템을 설계 중. 팀이 크로스 인코더 재순위의 dense 바이 인코더 vs ColBERT로 논쟁한다. 뭘 권하나?

**좋은 답변:**
이 사용처엔 세 이유로 ColBERT를 권한다:

첫째, **법률 텍스트는 용어 민감**. 계약 조항이 특정 섹션 번호, 정의 용어(예: "Force Majeure"), 정확 구절 참조. ColBERT 토큰 수준 MaxSim이 단일 벡터 바이 인코더에서 희석되는 희귀하나 결정적인 용어 보존.

둘째, **500만 문서는 ColBERT 스위트스팟의 한가운데**. ColBERTv2 압축으로 인덱스가 약 30-60 GB, 단일 80 GB GPU에 맞음. 주 검색에 충분히 작아 별도 1단계 검색기 불필요.

셋째, **크로스 인코더 재순위가 지연을 더함**. 각 쿼리-문서 쌍이 전체 트랜스포머 순전파. 크로스 인코더로 100 후보 재순위는 500ms-2초. ColBERT는 문서 토큰이 사전 계산돼 총 지연 100ms 미만으로 비슷한 정확도 달성.

ColBERT를 보충할 한 영역은 키워드 정밀도가 중요한 정확 일치 쿼리(법령 번호, 판례 인용)용 병렬 BM25 인덱스. LLM 전달 전 RRF로 ColBERT·BM25 결과 결합.

---

## 참고 문헌
- Khattab & Zaharia. "ColBERT..." (SIGIR 2020)
- Santhanam et al. "ColBERTv2..." (NAACL 2022)
- Santhanam et al. "PLAID..." (CIKM 2022)
- Answer.AI. "RAGatouille..." (GitHub, 2024)
- Jina AI. "Jina-ColBERT-v2..." (2024)
- Dhulipala et al. "MUVERA..." (NeurIPS 2024)
- Weaviate. "An Overview of Late Interaction Retrieval Models" (2025)
- Milvus. "v3.0.0 release notes" (GitHub, 2026-07)
- GLIE, arXiv 2609.11808 (2026-09)
- ECIR 2026. "Late Interaction Workshop" (2026)

---

*이전: [문맥 검색](10-contextual-retrieval.md) | 다음: [멀티모달 RAG](12-multimodal-rag.md)*
