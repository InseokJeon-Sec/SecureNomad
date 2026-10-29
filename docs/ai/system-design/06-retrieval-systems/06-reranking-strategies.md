---
title: 재순위 전략
sidebar_position: 6
description: 고정밀 모델로 소수 후보를 재점수하는 검색 2단계 재순위 — 바이·크로스 인코더, 재순위 모델, 구현 패턴, 언제 재순위하나, LLM 기반 재순위, SLM 증류, 프로덕션 고려사항.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/06-reranking-strategies.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 재순위 전략

재순위(reranking)는 소수 후보 집합(Top 50-100)을 고정밀 모델로 재점수하는 검색 2단계다. "효율적 검색"과 "완벽한 접지" 사이 다리다: 1단계 검색은 재현율을 최적화, 재순위는 정밀도를 최적화. 2026년 10월 흔한 프로덕션 선택은 호스팅 Cohere Rerank 4(Fast·Pro)와 Voyage rerank-3/rerank-3-lite, 오픈 가중치 Qwen3-Reranker·bge-reranker-v2-m3. 선택은 비용 모델·지연 꼬리·문맥 길이·언어 커버리지·라이선스, 그리고 자체 호스팅 가중치가 필요한지에 달렸다.

## 왜 재순위인가

### 품질 간극

| 단계 | 모델 | 속도 | 품질 |
|-------|-------|-------|---------|
| 임베딩 검색 | 바이 인코더 | 빠름(ms) | 좋음 |
| 재순위 | 크로스 인코더 | 느림(10-100ms) | 더 좋음 |

**간극이 존재하는 이유:**
- 바이 인코더는 쿼리·문서를 독립 임베딩
- 크로스 인코더는 쿼리·문서를 공동 처리
- 공동 처리가 바이 인코더가 놓치는 상호작용 포착

### 예시

```
Query: "How to configure CUDA memory"

Document 1: "Configure GPU memory using CUDA_VISIBLE_DEVICES..."
Document 2: "Memory management in CUDA applications..."
Document 3: "Configure RAM allocation for machine learning..."

Bi-encoder scores (cosine similarity):
- Doc 1: 0.72
- Doc 2: 0.75  <-- Ranked first (wrong)
- Doc 3: 0.71

Cross-encoder scores (relevance):
- Doc 1: 0.91  <-- Ranked first (correct)
- Doc 2: 0.67
- Doc 3: 0.42
```

크로스 인코더는 쿼리의 "CUDA memory"가 Doc 1의 "GPU memory...CUDA"와 연관됨을 본다.

---

## 재순위 아키텍처

### 바이 인코더 vs 크로스 인코더

**바이 인코더(1단계):**
```
Query --> Encoder --> Query Embedding -+
                                      +-> Similarity
Document --> Encoder --> Doc Embedding +
```
- 문서당 O(1)(임베딩 사전 계산)
- 쿼리-문서 상호작용 못 봄

**크로스 인코더(재순위):**
```
[Query, Document] --> Encoder --> Relevance Score
```
- 쿼리당 O(n)(각 후보 처리)
- 전체 쿼리-문서 문맥 봄
- **어텐션 메커니즘**으로 쿼리의 특정 단어가 문서 단어 의미를 어떻게 바꾸는지 비교(완전 조기 상호작용; ColBERT의 "레이트 인터랙션"은 이것과 바이 인코더 사이)

### 2단계 파이프라인

프로덕션 검색은 2단계 깔때기를 쓴다:

```
+----------------------------------------------------------------+
|  STAGE 1: Retrieval (Bi-Encoder)                                |
|                                                                 |
|  Query --> Embed --> Top-K candidates (K=100)                   |
|  Scale: Search 1 Billion docs. Cost: Low (ms).                  |
+----------------------------+-----------------------------------+
                             |
                             v
+----------------------------------------------------------------+
|  STAGE 2: Reranking (Cross-Encoder)                             |
|                                                                 |
|  For each candidate:                                            |
|    score = reranker([query, candidate])                         |
|  Scale: Search Top 100 docs. Cost: High (10-100ms).             |
|                                                                 |
|  Return Top-N by reranker score (N=5-10)                        |
+----------------------------------------------------------------+
```

### 다단계 파이프라인

아주 큰 코퍼스용:

```
Stage 1: Sparse (BM25)      -> Top 1000
Stage 2: Dense (Bi-encoder) -> Top 100
Stage 3: Cross-encoder      -> Top 10
```

각 단계가 속도를 정확도와 교환.

---

## 재순위 모델

### 크로스 인코더 모델

| 모델 | 크기/접근 | 문맥 | 라이선스·가격 | 비고 |
|-------|---------------|---------|------------------|-------|
| ms-marco-MiniLM-L-6 | 22M, 오픈 | 512 | Apache 2.0 | 영어; CPU 친화 기준선 |
| bge-reranker-base | 278M, 오픈 | 512 | MIT | 영어 |
| **bge-reranker-v2-m3** | 568M, 오픈 | 카드 예시 512(기본 8K) | Apache 2.0 | 다국어 주력 |
| **Cohere Rerank 4**(`rerank-v4.0-fast`/`-pro`) | API | 32K | 사용량 기반 API | 2025-12 발표; Rerank 3.5(4,096 문맥) 후속 |
| **Voyage rerank-3/rerank-3-lite** | API | 32K | 1M 토큰당 $0.05/$0.02 | 2026-09-30; rerank-2.5와 같은 가격·API, 2.5 튜닝 점수 임계 유효 |
| **Qwen3-Reranker-8B** | 8B, 오픈 | 32K | Apache 2.0 | 강한 오픈 텍스트 재순위기(2025-06) |
| **Qwen3-VL-Reranker-2B/8B** | 오픈 | 32K | Apache 2.0 | 멀티모달(텍스트·이미지·페이지 스크린샷), 2026-01 |
| jina-reranker-v3.5 | 0.6B, 오픈 | 긴 | CC BY-NC 4.0(비상업) | Qwen3-0.6B 위 리스트와이즈; 상업 사용은 Jina API·별도 라이선스 |
| LightOn-rerank | 0.8B/2B/4B, 오픈 | 긴 | 모델 카드 확인 | Qwen3.5 백본의 포인트와이즈·리스트와이즈 변형(2026-07) |

Voyage는 rerank-3가 rerank-2.5를 전체 0.96%·장문서 3.35%, Cohere Rerank v4.0 Pro를 전체 2.72%·장문서 13.84% 이긴다 보고(벤더, 95개 데이터셋 + MAIR). 이를 중립 순위가 아니라 이득이 이제 어디(장문서·지시 따르기 관련성)에 집중되는지 신호로 읽어라.

**"중간 길 잃기" 교정**: 재순위기는 청크 내 위치와 무관하게 관련 정보를 우선하도록 학습돼, "중간" 데이터가 최종 LLM에 가기 전 올바르게 점수되게 보장.

### 크로스 인코더 사용

```python
from sentence_transformers import CrossEncoder

# Load model
reranker = CrossEncoder('BAAI/bge-reranker-base')

def rerank(query: str, documents: list[str], top_k: int = 5) -> list[tuple[str, float]]:
    # Create pairs
    pairs = [[query, doc] for doc in documents]

    # Score all pairs
    scores = reranker.predict(pairs)

    # Sort by score
    scored_docs = sorted(
        zip(documents, scores),
        key=lambda x: x[1],
        reverse=True
    )

    return scored_docs[:top_k]
```

### Cohere Rerank

```python
import cohere

co = cohere.ClientV2()  # reads CO_API_KEY from the environment

def cohere_rerank(
    query: str,
    documents: list[str],
    top_k: int = 5
) -> list[dict]:
    response = co.rerank(
        model="rerank-v4.0-pro",  # or "rerank-v4.0-fast" for lower latency
        query=query,
        documents=documents,
        top_n=top_k,
    )

    # v2 results carry index and relevance_score; map back to the input list
    return [
        {
            "text": documents[result.index],
            "score": result.relevance_score,
            "index": result.index
        }
        for result in response.results
    ]
```

### 모델 선택 가이드

| 사용처 | 추천 모델 | 비고 |
|----------|-------------------|-------|
| 영어, 자체 호스팅, CPU | bge-reranker-base·MiniLM-L-6 | MiniLM은 품질 낮으나 약 4배 빠름 |
| 다국어, 자체 호스팅 | bge-reranker-v2-m3·Qwen3-Reranker | GPU 있으면 긴 입력엔 Qwen3 |
| 최고 품질, 관리형 | Cohere Rerank 4 Pro·Voyage rerank-3 | 둘 다 자신 데이터에 벤치; 벤더 수치 불일치 |
| 비용 민감 관리형 | Voyage rerank-3-lite·Cohere Rerank 4 Fast | rerank-3-lite는 1M당 $0.02 |
| 장문서·도구 출력(8K+) | 32K 재순위기(Cohere Rerank 4, Voyage rerank-3, Qwen3) | 절단은 더 이상 제약 아님; 쌍당 토큰이 비용 |
| 페이지 스크린샷·차트 | Qwen3-VL-Reranker | Apache 2.0, 멀티모달 |

**비용 스케치:** 500토큰 후보 50개 재순위는 쿼리당 약 25K 토큰. Voyage rerank-3의 1M당 $0.05로 쿼리당 약 $0.00125, 1M 쿼리/일이면 약 $1,250/일. 토큰당 가격이라 긴 청크·깊은 후보 목록이 선형 증가하니, 후보 깊이·청크 길이가 지연뿐 아니라 비용 레버다.

---

## 구현 패턴

### 패턴 1: 기본 재순위

```python
class RerankedRetriever:
    def __init__(
        self,
        vector_db,
        embedding_model,
        reranker,
        retrieval_k: int = 50,
        rerank_k: int = 5
    ):
        self.vector_db = vector_db
        self.embedding_model = embedding_model
        self.reranker = reranker
        self.retrieval_k = retrieval_k
        self.rerank_k = rerank_k

    def search(self, query: str) -> list[Document]:
        # Stage 1: Retrieve candidates
        query_embedding = self.embedding_model.encode(query)
        candidates = self.vector_db.search(
            query_embedding,
            top_k=self.retrieval_k
        )

        # Stage 2: Rerank
        pairs = [[query, c.text] for c in candidates]
        scores = self.reranker.predict(pairs)

        # Combine and sort
        for candidate, score in zip(candidates, scores):
            candidate.rerank_score = score

        reranked = sorted(candidates, key=lambda x: x.rerank_score, reverse=True)
        return reranked[:self.rerank_k]
```

### 패턴 2: 배치 재순위

```python
def batch_rerank(
    queries: list[str],
    candidates_per_query: list[list[str]],
    reranker,
    batch_size: int = 32
) -> list[list[tuple[str, float]]]:
    # Flatten all pairs
    all_pairs = []
    pair_mapping = []  # (query_idx, doc_idx)

    for q_idx, (query, candidates) in enumerate(zip(queries, candidates_per_query)):
        for d_idx, doc in enumerate(candidates):
            all_pairs.append([query, doc])
            pair_mapping.append((q_idx, d_idx))

    # Batch score
    all_scores = []
    for i in range(0, len(all_pairs), batch_size):
        batch = all_pairs[i:i + batch_size]
        scores = reranker.predict(batch)
        all_scores.extend(scores)

    # Reconstruct per-query results
    results = [[] for _ in queries]
    for (q_idx, d_idx), score in zip(pair_mapping, all_scores):
        results[q_idx].append((candidates_per_query[q_idx][d_idx], score))

    # Sort each query's results
    for i in range(len(results)):
        results[i].sort(key=lambda x: x[1], reverse=True)

    return results
```

### 패턴 3: 비동기 재순위

```python
import asyncio

class AsyncReranker:
    def __init__(self, reranker, max_concurrent: int = 5):
        self.reranker = reranker
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def rerank_async(
        self,
        query: str,
        documents: list[str]
    ) -> list[tuple[str, float]]:
        async with self.semaphore:
            # Run reranking in thread pool
            loop = asyncio.get_event_loop()
            scores = await loop.run_in_executor(
                None,
                lambda: self.reranker.predict([[query, doc] for doc in documents])
            )
            return sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
```

---

## 언제 재순위하나

### 비용-편익 분석

| 요인 | 재순위 없음 | 재순위 있음 |
|--------|-------------------|----------------|
| 지연 | 50-100ms | 150-300ms |
| 품질(NDCG) | 0.65 | 0.78 |
| 복잡도 | 단순 | 중간 |
| 비용 | 기준선 | +API 비용·+컴퓨트 |

### 결정 프레임워크

**항상 재순위:**
- 품질이 임계(고객 대면, 고위험)
- 검색 후보들 점수가 비슷
- 쿼리가 복잡·다부분
- 예산이 지연 증가 허용

**재순위 건너뛰기:**
- 지연 예산 매우 빡빡(총 100ms 미만)
- 검색 후보가 명확히 순위됨
- 단순 쿼리(단일 용어 조회)
- 대규모 비용 제약

### 추론 시 트레이드오프

| 단계 | 검색(K) | 재순위(N) | 지연 | 품질 |
|-------|---------------|------------|---------|---------|
| **나이브** | 5 | 0 | 50ms | 낮음 |
| **표준** | 50 | 5 | 150ms | 높음 |
| **엔터프라이즈**| 200 | 20 | 500ms | 최대 |

**핵심 규칙**: 200ms 예산이면 검색에 50ms, 재순위에 150ms. Top 50 재순위가 벡터 DB에서 더 많은 청크를 검색하는 것보다 훨씬 높은 ROI.

### 최적 후보 수

재순위 전 몇 후보를 검색할지:

```python
def optimize_candidate_count(test_set, retriever, reranker):
    """Find optimal retrieval_k for reranking."""
    results = {}

    for retrieval_k in [10, 20, 50, 100, 200]:
        ndcg_scores = []
        latencies = []

        for query, relevant_docs in test_set:
            start = time.time()

            # Retrieve
            candidates = retriever.search(query, top_k=retrieval_k)

            # Rerank to top 5
            reranked = reranker.rerank(query, candidates, top_k=5)

            latency = time.time() - start
            latencies.append(latency)

            ndcg = compute_ndcg(reranked, relevant_docs)
            ndcg_scores.append(ndcg)

        results[retrieval_k] = {
            "ndcg": mean(ndcg_scores),
            "latency_p99": percentile(latencies, 99)
        }

    return results

# Typical findings:
# K=20:  NDCG 0.72, latency 120ms
# K=50:  NDCG 0.76, latency 180ms  <-- Often sweet spot
# K=100: NDCG 0.77, latency 280ms  <-- Diminishing returns
```

---

## LLM 기반 재순위

### LLM을 재순위기로

LLM은 관련성을 점수할 수 있으나 비싸다:

```python
def llm_rerank(
    query: str,
    documents: list[str],
    model: str = "gpt-6-luna"
) -> list[tuple[str, float]]:
    prompt = f"""Rate the relevance of each document to the query.
Query: {query}

Documents:
{format_documents(documents)}

For each document, output a relevance score from 0-10.
Format: DOC_NUM: SCORE
"""

    response = llm.generate(prompt)
    scores = parse_scores(response)

    return sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
```

**장점:**
- 복잡한 관련성 판단 처리
- 뉘앙스·문맥 이해
- 유지할 별도 모델 없음

**단점:**
- 대규모에 비쌈(크로스 인코더의 10-100배)
- 느림(100ms 대비 1-3초)
- 비결정적

**수치가 말하는 것:** "The Embedder's Dilemma"(arXiv 2608.12875, 2026-08)는 37개 MTEB식 과제에서 LLM 10개를 임베딩 모델 26개와 비교. 최고 LLM이 집계로 최고 임베더와 비등(77.6 vs 77.2)하나 최대 1,431배 비용; LLM은 추론 중심 검색, 임베더는 분류에서 앞섬. 추론 토큰이 LLM 비용의 28-81%였고, 낮은 추론 예산이 대개 검색 품질 유지. 규칙 둘: 추론 필요 쿼리의 최종 소수 후보에만 LLM을 쓰고, 평가셋에서 품질을 유지하는 최저 노력으로 돌려라.

### 리스트와이즈 vs 포인트와이즈 LLM 재순위

**포인트와이즈:** 각 문서 독립 점수
```
For document: [doc text]
Query: [query]
Rate relevance 0-10: _
```

**리스트와이즈:** 모든 문서 함께 순위
```
Query: [query]
Rank these documents by relevance:
A: [doc1]
B: [doc2]
C: [doc3]
Output order: _
```

**리스트와이즈가 흔히 더 나음** — LLM이 문서를 직접 비교 가능하기 때문. 작은 현 모델(GPT-6 Luna, Claude Haiku 4.5)이 리스트와이즈 순위를 낮은 노력으로 시도할 만큼 싸게 만드나, 평가셋에서 품질 확인, 여전히 1-2초 지연을 더하니 고위험 엔터프라이즈 검색(법률·의료)에 예약하라. 전용 리스트와이즈 재순위기(jina-reranker-v3.5, LightOn-rerank 리스트와이즈 변형)가 크로스 인코더 지연에 문서 간 비교를 준다.

### 많은 문서용 슬라이딩 윈도

```python
def sliding_window_rerank(
    query: str,
    documents: list[str],
    window_size: int = 10,
    step: int = 5
) -> list[str]:
    """Rerank many documents with LLM using sliding window."""
    ranked = list(range(len(documents)))

    for start in range(0, len(documents), step):
        window = ranked[start:start + window_size]

        # LLM ranks this window
        window_docs = [documents[i] for i in window]
        window_order = llm_listwise_rank(query, window_docs)

        # Update rankings
        for new_pos, old_idx in enumerate(window_order):
            ranked[start + new_pos] = window[old_idx]

    return [documents[i] for i in ranked]
```

---

## SLM 증류

LLM 기반 재순위 지연을 줄이려 LLM 판단을 **작은 크로스 인코더(SLM)** 로 증류한다.

- **과정**: 프런티어 모델로 100만 쌍을 재순위시키고 그 라벨로 작은 0.1B 모델을 "증류". 상업 API로 이를 하기 전 출력으로 모델 학습하는 공급자 약관을 확인하라.
- **결과**: 학생이 크로스 인코더 지연(이 장 예산에서 후보 50개 100-200ms, LLM 패스 1-3초 대비)으로 돌며 인도메인 쿼리에서 교사 순위 품질 상당 부분 유지. 얼마나는 코퍼스 특화이고 도메인 밖에선 격차 확대, LLM 경로 은퇴 전 골든셋에서 교사 대비 NDCG@10 비교하라.
- **프로덕션 패턴:** 평시 크로스 인코더, 저신뢰 재순위 점수엔 LLM 폴백.

---

## 프로덕션 고려사항

### 지연 최적화

```python
class OptimizedReranker:
    def __init__(self, model_name: str, device: str = "cuda"):
        self.model = CrossEncoder(model_name, device=device)
        # Enable optimizations
        self.model.model.half()  # FP16

    def rerank(self, query: str, documents: list[str]) -> list[tuple[str, float]]:
        with torch.inference_mode():
            pairs = [[query, doc] for doc in documents]
            scores = self.model.predict(
                pairs,
                batch_size=32,
                show_progress_bar=False
            )
        return sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
```

**최적화 기법:**
- FP16 추론: 2배 가속
- 배칭: 오버헤드 분산
- ONNX 익스포트: 1.5-2배 가속
- TensorRT: 2-3배 가속(NVIDIA)
- 모델 증류: 품질 교환으로 4배 가속

### 재순위 후: 다양성과 비즈니스 규칙

재순위기는 각 후보를 서로 독립 점수하므로 한 출처의 거의 동일한 청크 셋이 상위 셋을 차지할 수 있다. 다양성(MMR)과 비즈니스 규칙(신선도 감쇠, "공식 문서 선호")을 관련성 점수 **후**에 적용하라, 전이 아니라 — 아니면 재순위기가 되돌린다. 일부 엔진이 이제 DB에서 수행: Weaviate 1.39가 MMR과 Boost API(필터·속성·시간·수치 감쇠로 승강)를 GA, Milvus 3.0 Function Chain이 재점수·재순위 단계를 서버 측 조합.

### 재순위 결과 캐싱

```python
class CachedReranker:
    def __init__(self, reranker, cache_ttl: int = 3600):
        self.reranker = reranker
        self.cache = TTLCache(maxsize=10000, ttl=cache_ttl)

    def rerank(self, query: str, documents: list[str]) -> list[tuple[str, float]]:
        # Cache key includes query and doc hashes
        key = self._make_key(query, documents)

        if key in self.cache:
            return self.cache[key]

        result = self.reranker.rerank(query, documents)
        self.cache[key] = result
        return result

    def _make_key(self, query: str, documents: list[str]) -> str:
        doc_hash = hashlib.sha256(
            "".join(sorted(documents)).encode()
        ).hexdigest()[:16]
        query_hash = hashlib.sha256(query.encode()).hexdigest()[:16]
        return f"{query_hash}:{doc_hash}"
```

### 폴백 전략

```python
def rerank_with_fallback(
    query: str,
    candidates: list[Document],
    primary_reranker,
    timeout: float = 2.0
) -> list[Document]:
    try:
        # Try reranking with timeout
        result = timeout_call(
            primary_reranker.rerank,
            args=(query, candidates),
            timeout=timeout
        )
        return result
    except TimeoutError:
        # Fallback: return original order
        logger.warning("Reranker timeout, using original order")
        return candidates
    except Exception as e:
        logger.error(f"Reranker error: {e}")
        return candidates
```

---

## 면접 질문

### Q: 크로스 인코더가 바이 인코더보다 근본적으로 정확한 이유는?

**좋은 답변:**
바이 인코더는 쿼리를 알기 *전* 문서에 단일 정적 벡터 표현을 만든다. 텍스트 부분 간 특정 관계를 잃는다. 크로스 인코더는 쿼리·문서를 단일 입력 쌍으로 받아 **어텐션 메커니즘**으로 비교한다. 쿼리의 특정 단어가 문서 단어 의미를 매 레이어에서 어떻게 바꾸는지(ColBERT식 레이트 인터랙션이 아니라 완전 크로스 어텐션) 봐, 두 고정 벡터의 단순 수학 유사도보다 훨씬 미묘한 관련성 점수가 가능.

**실무:** 1단계 검색엔 바이 인코더(속도), 재순위엔 크로스 인코더(품질). 양쪽 최선을 얻는다.

### Q: 몇 후보를 재순위할지 어떻게 정하나?

**좋은 답변:**
품질과 지연 트레이드오프:

**요인:**
- 문서당 재순위기 지연
- 총 지연 예산
- 품질 개선 곡선(보통 수익 체감)
- 1단계 검색 품질

**과정:**
1. 문서당 재순위기 지연 벤치
2. 지연 예산 내 최대 후보 계산
3. 다른 K 값에서 품질 테스트
4. 엘보 포인트 찾기(품질 vs 지연)

**전형적 소견:**
- K=20-50이 흔히 최적
- K=100 넘으면 품질 이득 미미
- 1단계 검색 품질에 따라 조정

200ms 재순위 예산, 문서당 4ms면 약 50 후보 재순위.

### Q: 언제 LLM 기반 재순위를 쓰나?

**좋은 답변:**
LLM 재순위가 타당할 때:
1. **복잡한 관련성 판단:** 뉘앙스·문맥·멀티홉 추론 이해 필요
2. **낮은 볼륨:** 크로스 인코더 학습·호스팅 정당화 불가
3. **최고 품질 필요:** 법률·의료·안전 임계
4. **파이프라인에 이미 LLM:** 한계 비용 낮음

**주의:**
- 대규모 비쌈(크로스 인코더 10-100배)
- 느림(100ms 대비 1-3초)
- 비결정적
- 신중한 프롬프트 엔지니어링 필요 가능

**프로덕션 패턴:** 평시 크로스 인코더, 저신뢰 재순위 점수엔 LLM 폴백.

### Q: 아주 긴 쿼리(문단 전체)의 재순위는 어떻게 다루나?

**좋은 답변:**
고전 BERT 크기 크로스 인코더(MiniLM, bge-reranker-base)는 512 토큰 상한이라 긴 쿼리·청크가 절단된다. 옛 해법은 **슬라이딩 윈도 재순위**나 **쿼리 요약**. 현 재순위기가 제약을 바꿈: Cohere Rerank 4, Voyage rerank-3, Qwen3 재순위기가 32K 토큰을 받아, 문제가 절단이 아니라 쌍당 비용·지연이 됨(토큰당 가격·어텐션 비용 모두 입력 길이로 증가). 내 패턴: 절단 청크로 후보 50개 빠른 1차 재순위, 그다음 32K 재순위기로 상위 5-10개를 전장 텍스트로 2차. "문서"가 긴 도구 출력이고 쿼리가 자연어 관련성 기준 문단인 에이전트 RAG에서 가장 중요 — 바로 Voyage가 rerank-3의 최대 이득(장문서·MAIR 지시 따르기 스위트, 벤더)을 보고하는 곳.

---

## 참고 문헌

- Nogueira and Cho. "Passage Re-ranking with BERT" (2019)
- Nogueira et al. "Multi-Stage Document Ranking with BERT" (2019/2025 갱신)
- BAAI BGE Reranker: https://huggingface.co/BAAI/bge-reranker-base
- Cohere Rerank: https://docs.cohere.com/docs/rerank
- [Voyage AI. "rerank-3" (2026-09)](https://blog.voyageai.com/2026/09/30/rerank-3/)
- ["The Embedder's Dilemma" (arXiv 2608.12875, 2026-08)](https://arxiv.org/abs/2608.12875)
- Sun et al. "Is ChatGPT Good at Search?..." (2023)

---

*이전: [하이브리드 검색](05-hybrid-search.md) | 다음: [GraphRAG](07-graph-rag.md)*
