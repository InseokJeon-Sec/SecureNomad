---
title: 대규모 프로덕션 RAG
sidebar_position: 14
description: 검색 파이프라인·캐싱·라우팅·자기교정 루프·멀티테넌트 격리·비용 제어가 엄격한 지연 SLA 하에 작동하는 분산 시스템으로서의 프로덕션 RAG — 라우팅, 시맨틱 캐싱, 멀티 인덱스, 파이프라인 최적화, 교정 RAG, 적응형 검색, 비용 최적화, 실패 모드, 모니터링, 확장, 멀티테넌시.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/14-production-rag-at-scale.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09). 코드·다이어그램은 원문 그대로 유지하며, 가격·버전 등 휘발성 수치는 당시 스냅샷입니다.
:::

# 대규모 프로덕션 RAG

프로덕션 RAG는 더 이상 주말 프로젝트가 아니다. 검색 파이프라인·캐싱 계층·라우팅 로직·자기교정 루프·멀티테넌트 격리·비용 제어가 모두 엄격한 지연 SLA 하에 작동하는 분산 시스템이다. RAG가 프로덕션에서 실패할 때 원인은 보통 모델 상류다: 올바른 구절이 깨끗이 청킹·인덱싱·검색된 적이 없어 생성기가 결코 보지 못한 것. 그래서 성공하는 엔터프라이즈 배포는 (모델이 아니라) 지식 소스를 주 투자로 다룬다.

## RAG vs 장문맥

대부분 프런티어 계열이 1M 토큰 문맥을 지원하면서(Claude Opus 5.5·Sonnet 5.5, GPT-6 Sol·Astra 1.05M, Gemini 3.8 Flash, Muse Spark 1.3, Xiaomi MiMo-V2.6·Llama 4 Maverick 같은 오픈 모델) 질문이 더 이상 "RAG냐 장문맥이냐"가 아니라 "각각 언제 이기나"다.

### 결정 매트릭스

```
                    Small Corpus           Large Corpus
                    (<100K tokens)         (>1M tokens)
                 +---------------------+---------------------+
  Static Data    |  Long Context Wins  |  RAG Required       |
  (rarely        |  - Stuff it all in  |  - Can't fit in     |
   changes)      |  - Simpler arch     |    context window   |
                 |  - No index needed  |  - Index + retrieve |
                 +---------------------+---------------------+
  Dynamic Data   |  Hybrid Approach    |  RAG Required       |
  (updates       |  - Cache context    |  - Incremental      |
   frequently)   |  - Invalidate on    |    indexing          |
                 |    change           |  - Real-time updates |
                 +---------------------+---------------------+
  Multi-User     |  RAG Preferred      |  RAG Required       |
  (per-user      |  - Personalized     |  - Tenant isolation  |
   data)         |    retrieval        |  - Access control    |
                 +---------------------+---------------------+
```

### 정면 비교

| 차원 | RAG | 장문맥(1M 토큰) |
|-----------|-----|--------------------------|
| **평균 쿼리 비용** | 약 $0.001-0.015(5K 문맥 토큰, GPT-6 Luna~Claude Sonnet 5.5) | 따뜻한 Claude 캐시로 입력 약 $0.20-0.25; 미캐시 $2-4 |
| **평균 지연(p50)** | 약 1초 | 약 30-45초 |
| **특정 사실 정밀도** | 높음(표적 검색) | 중간에서 저하 |
| **문서 간 합성** | 약함(제한 문맥) | 강함(전부 봄) |
| **코퍼스 크기 한계** | 무제한 | 약 1M 토큰 |
| **데이터 신선도** | 분(증분 인덱스) | 전체 재로드 필요; 편집 시 이후 캐시 무효화 |
| **1M 쿼리당 비용** | 약 $1K-15K | 따뜻한 캐시로 약 $200K+; 미캐시 $2M-4M |

### "중간에서 길 잃기" 문제

LLM은 문맥 윈도 전반에 균일 주의하지 않는다. 긴 문맥 중간 정보는 처음·끝 정보 대비 30%+ 정확도 저하. RAG는 가장 관련된 청크만 짧고 집중된 문맥에 넣어 이를 완전히 회피.

### 캐시 읽기 손익분기

더 싼 캐시 읽기가 **안정** 코퍼스의 선을 옮겼다. 같은 모델에서 공급자 프롬프트 캐시에 따뜻이 유지된 코퍼스가 다음일 때 RAG보다 쿼리당 입력이 덜 든다:

```
corpus_tokens x cache_read_multiplier  <  retrieved_context_tokens
```

| 모델(정가, 2026-10-01) | 캐시 읽기 | 5K 토큰 RAG 문맥과 같은 비용의 코퍼스 |
|----------------------------------|------------|------------------------------------------------------|
| Claude Fable 5.1 | 0.025배($0.25/1M) | 약 200K 토큰 |
| Claude Opus 5.5 | 0.05배($0.20/1M) | 약 100K 토큰 |
| GPT-6.1 Sol | 0.05배($0.10/1M) | 약 100K 토큰 |
| 대부분 다른 Claude·OpenAI | 0.1배 | 약 50K 토큰 |

공식이 빠뜨리는 것:
- **캐시 쓰기·TTL.** Claude는 5분 쓰기 1.25배·1시간 쓰기 2배(Opus 5.5: $5·$8/1M); OpenAI는 GPT-5.6 이후 1.25배·30분 TTL 고정. TTL보다 드물게 쿼리되는 코퍼스는 쓰기를 거듭 지불. Gemini 명시 캐시는 Gemini 3.8 Flash에서 0.1배 읽기이나 시간당 저장 과금($0.50/1M/시 2026-12-31까지, 이후 $1.00)이라 따뜻한 200K 코퍼스가 읽기 전 시간당 $0.10-0.20.
- **장문맥 추가요금.** OpenAI는 입력 272K 초과 시 전체 요청 장문맥 요율, xAI는 200K 이상 전 토큰 2배. Anthropic은 Claude 4.6 이후 1M까지 균일.
- **품질·지연.** 싼 캐시 읽기가 중간 길 잃기나 아주 긴 프롬프트 프리필을 고치지 않고, 코퍼스가 맞을 때만 도움.

고정 임계 인용 말고 모델별 재계산. 실무 변화는 작은 쪽: 거의 안 변하는 100K-200K 토큰 핸드북·정책 세트가 이제 인덱스보다 캐시 프리픽스로 더 싸고 단순한 경우가 흔함.

### 베스트 프랙티스: 하이브리드 패턴

승리 아키텍처는 둘을 결합: RAG로 대형 코퍼스에서 상위 후보를 검색하고 그것들을 장문맥 윈도에 로드해 문서 간 추론.

```
  User Query
      |
      v
+------------------+     +-------------------+
|  RAG Retrieval   |---->|  Long Context     |
|  (Find top 20    |     |  Synthesis        |
|   from 10M docs) |     |  (Reason across   |
+------------------+     |   20 docs deeply) |
                          +-------------------+
                                  |
                                  v
                          Final Answer with
                          Cross-Doc Citations
```

**어림 규칙**: 코퍼스가 문맥에 맞고 AND 지연을 감당하고 AND 비용을 감당하면 장문맥. 아니면 RAG. 비용·지연 제약의 대부분 프로덕션엔 RAG가 올바른 기본값.

### 셋째 옵션: 지식을 한 번 컴파일

더 새 제품 범주가 쿼리마다 청크 검색 대신 수집 시 구조화 지식을 사전 계산. 가장 명확한 예는 **Pinecone Nexus**(GA 2026-08-06): 주제 전문가가 작업을 Manifest(엔티티·관계·답 형태)로 기술; Nexus가 소스 문서를 한 번 요약·구조화 추출·엔티티-관계 그래프로 컴파일하고 에이전트가 KnowQL로 한 호출에 쿼리. 데이터 플레인이 고객 AWS·Google Cloud·Azure 계정에서 실행. Pinecone 보고(벤더): tau-Knowledge에서 Nexus의 GPT-5.5가 47.4%(미사용 46.4%), 과제당 비용 77% 낮고 모델 호출 약 35% 적음.

| | 쿼리 시 검색(RAG) | 한 번 컴파일 |
|---|---|---|
| **비용이 떨어지는 곳** | 모든 쿼리 | 수집·재컴파일 |
| **오류가 떨어지는 곳** | 검색 미스, 쿼리별 보임 | 컴파일 오류, 재컴파일까지 모든 답에 베임 |
| **예상 못 한 질문 처리** | 예 | Manifest가 예상한 형태 내에서만 |
| **코퍼스 드리프트** | 증분 재인덱스 | 영향 아티팩트 재컴파일 |

한 번 컴파일은 반복 질문 형태의 안정·고볼륨 도메인(정책, 판례, 제품 카탈로그)에 맞음. 롱테일·탐색 질문엔 쿼리 시 검색 유지, 컴파일하는 곳에서도 폴백으로 유지.

---

## 쿼리 라우팅과 분류

모든 쿼리가 검색이 필요하진 않다. 프로덕션 시스템은 들어오는 쿼리를 분류해 최적 처리 경로로 라우팅.

### 4경로 라우터

```
                         User Query
                             |
                             v
                    +------------------+
                    |  Query Classifier |
                    |  (LLM or trained  |
                    |   classifier)     |
                    +--------+---------+
                             |
            +--------+-------+-------+--------+
            |        |               |        |
            v        v               v        v
        +------+ +--------+    +--------+ +--------+
        |Direct| |Simple  |    |Complex | |Agentic |
        | LLM  | |  RAG   |    |  RAG   | |  RAG   |
        +------+ +--------+    +--------+ +--------+
        "What    "What is      "Compare   "Analyze
        is 2+2?" our refund    Q3 vs Q4   all legal
                  policy?"     revenue    risks in
                               trends"    these 50
                                          contracts"
```

### 분류 신호

| 신호 | 직접 LLM | 단순 RAG | 복잡 RAG | 에이전트 RAG |
|--------|-----------|------------|-------------|-------------|
| **사적 데이터 필요** | 아니오 | 예 | 예 | 예 |
| **단일 홉 답** | 예 | 예 | 아니오 | 아니오 |
| **여러 출처 필요** | 아니오 | 아니오 | 예 | 예 |
| **추론 체인 필요** | 아니오 | 아니오 | 아마 | 예 |
| **시간 민감 데이터** | 아니오 | 아마 | 아마 | 예 |

### 구현: 경량 라우터

```python
class QueryRouter:
    """Routes queries to the optimal retrieval strategy."""

    def __init__(self, classifier_model: str = "gpt-6-luna"):
        self.classifier = classifier_model
        self.route_counts = Counter()  # for monitoring

    async def classify(self, query: str, user_context: dict) -> str:
        # Step 1: Rule-based fast path
        if self._is_trivial(query):
            return "direct_llm"

        # Step 2: Check if query references private/org data
        if not self._needs_retrieval(query, user_context):
            return "direct_llm"

        # Step 3: LLM-based complexity classification
        complexity = await self._assess_complexity(query)

        if complexity == "simple":
            return "simple_rag"
        elif complexity == "multi_hop":
            return "complex_rag"
        else:
            return "agentic_rag"

    def _is_trivial(self, query: str) -> bool:
        """Fast regex/keyword check for trivial queries."""
        trivial_patterns = [
            r"^(what is|define|explain)\s+\w+$",
            r"^(hi|hello|thanks|bye)",
        ]
        return any(re.match(p, query.lower()) for p in trivial_patterns)

    async def _assess_complexity(self, query: str) -> str:
        """Use a small, fast model to classify complexity."""
        prompt = f"""Classify this query's retrieval complexity:
        - "simple": needs one document lookup
        - "multi_hop": needs 2-3 lookups, comparison, or synthesis
        - "agentic": needs planning, tool use, or iterative search

        Query: {query}
        Classification:"""

        result = await llm_call(self.classifier, prompt, max_tokens=10)
        return result.strip().lower()
```

### 도메인별 라우팅

여러 지식 도메인 시스템엔 검색 전 쿼리를 올바른 인덱스로 라우팅.

```python
# Rule-based domain routing
DOMAIN_RULES = {
    "revenue|sales|quota|ARR":     "financial_index",
    "policy|handbook|PTO|benefits": "hr_index",
    "API|endpoint|SDK|integration": "engineering_index",
    "compliance|GDPR|SOC2|audit":   "legal_index",
}

# Embedding-based domain routing (for ambiguous queries)
class DomainRouter:
    def __init__(self):
        self.domain_centroids = {}  # pre-computed per domain

    def route(self, query_embedding: list[float]) -> str:
        similarities = {
            domain: cosine_sim(query_embedding, centroid)
            for domain, centroid in self.domain_centroids.items()
        }
        return max(similarities, key=similarities.get)
```

---

## RAG용 시맨틱 캐싱

시맨틱 캐싱은 새 쿼리가 본질적으로 이전 쿼리와 같은 의미임을 인식하고 캐시 결과를 재사용. 프로덕션 시스템은 잘 튜닝된 시맨틱 캐시로 비용 최대 68% 감소·지연 65배 개선 보고.

### 3계층 캐싱 아키텍처

```
  User Query
      |
      v
+---------------------+
| Layer 1: Exact Cache |  Hash(query) -> response
| (Redis/Memcached)    |  TTL: 1 hour
| Hit rate: ~15-25%    |  Latency: <5ms
+----------+----------+
           | miss
           v
+---------------------+
| Layer 2: Semantic    |  Embed(query) -> nearest neighbor
| Cache (Vector DB)    |  Threshold: cosine > 0.95
| Hit rate: ~20-35%    |  Latency: <50ms
+----------+----------+
           | miss
           v
+---------------------+
| Layer 3: Document    |  Cache retrieved chunks
| Cache               |  Skip re-embedding
| (saves embedding $) |  TTL: until doc changes
+----------+----------+
           | miss
           v
    Full RAG Pipeline
```

### 시맨틱 캐시 구현

```python
class SemanticCache:
    """Cache RAG responses by query semantic similarity."""

    def __init__(self, vector_store, similarity_threshold: float = 0.95):
        self.vector_store = vector_store
        self.threshold = similarity_threshold
        self.response_store = {}  # query_id -> cached response

    async def get(self, query: str) -> Optional[CachedResponse]:
        # Step 1: Exact match (fast path)
        exact_key = hashlib.sha256(query.encode()).hexdigest()
        if exact_key in self.response_store:
            return self.response_store[exact_key]

        # Step 2: Semantic match
        query_embedding = await embed(query)
        results = self.vector_store.search(
            query_embedding, top_k=1
        )

        if results and results[0].score >= self.threshold:
            cached_id = results[0].metadata["response_id"]
            cached = self.response_store.get(cached_id)
            if cached and not cached.is_expired():
                return cached

        return None

    async def put(
        self, query: str, response: str,
        sources: list[str], ttl_seconds: int = 3600
    ):
        query_embedding = await embed(query)
        response_id = str(uuid4())

        # Store the embedding for future similarity lookups
        self.vector_store.upsert(
            id=response_id,
            embedding=query_embedding,
            metadata={"response_id": response_id}
        )

        # Store the actual response
        self.response_store[response_id] = CachedResponse(
            response=response,
            sources=sources,
            created_at=time.time(),
            ttl=ttl_seconds,
        )
```

### 캐시 무효화 전략

| 전략 | 트리거 | 사용처 |
|----------|---------|----------|
| **TTL 기반** | 고정 시간 만료 | 일반 쿼리, 뉴스 |
| **이벤트 주도** | 문서 갱신 웹훅 | 지식 베이스 |
| **버전 태그** | 문서 버전 불일치 | 컴플라이언스 임계 |
| **신뢰 게이트** | 낮은 검색 점수 | 휘발 도메인 |

**결정적 규칙**: 항상 응답과 함께 소스 문서 ID 캐시. 소스 문서 갱신 시 그걸 참조하는 모든 캐시 항목 무효화.

```python
# Webhook-based cache invalidation
@app.post("/webhook/document-updated")
async def on_document_updated(doc_id: str):
    # Find all cache entries that used this document
    affected = cache_index.find_by_source(doc_id)
    for entry in affected:
        semantic_cache.invalidate(entry.response_id)
    logger.info(f"Invalidated {len(affected)} cache entries for doc {doc_id}")
```

---

## 멀티 인덱스 전략

단일 모놀리식 인덱스는 확장 안 됨. 프로덕션 시스템은 검색 정밀도·운영 격리 개선을 위해 벡터 인덱스를 도메인·테넌트·문서 유형으로 파티션.

### 인덱스 파티셔닝 패턴

```
Pattern 1: Per-Domain Indexes
+--------+  +--------+  +--------+  +--------+
|  Legal |  |   HR   |  |Finance |  |  Eng   |
| Index  |  | Index  |  | Index  |  | Index  |
+--------+  +--------+  +--------+  +--------+
    |            |            |           |
    +----------- +-----+------+-----------+
                       |
                 Query Router
                       |
                  User Query


Pattern 2: Per-Tenant Indexes (Silo Model)
+----------+  +----------+  +----------+
| Tenant A |  | Tenant B |  | Tenant C |
|  Index   |  |  Index   |  |  Index   |
| (Acme)   |  | (Globex) |  | (Wayne)  |
+----------+  +----------+  +----------+


Pattern 3: Shared Index with Metadata Filtering (Pool Model)
+-------------------------------------------+
|           Shared Vector Index              |
|  +-------+  +-------+  +-------+          |
|  | doc_1 |  | doc_2 |  | doc_3 |  ...     |
|  | t:A   |  | t:B   |  | t:A   |          |
|  +-------+  +-------+  +-------+          |
|                                            |
|  WHERE tenant_id = "A"  <-- filter         |
+-------------------------------------------+
```

### 각 패턴을 쓸 때

| 패턴 | 격리 | 비용 | 운영 복잡도 | 적합 |
|---------|-----------|------|----------------------|----------|
| **도메인별** | 중간 | 중간 | 중간 | 뚜렷한 지식 도메인의 내부 도구 |
| **테넌트별 사일로** | 가장 강함 | 높음 | 높음 | 엔터프라이즈 SaaS, 규제 산업 |
| **공유 풀** | 가장 약함 | 낮음 | 낮음 | SMB SaaS, 비용 민감 제품 |
| **하이브리드 브리지** | 구성 가능 | 중간 | 높음 | 혼합 고객 기반(엔터프라이즈 + SMB) |

### 계층 인덱스 전략

아주 큰 코퍼스엔 2티어 인덱스: 라우팅용 거친 "요약 인덱스", 정밀용 세밀 "청크 인덱스".

```
  Query: "What is the refund policy for enterprise plans?"
      |
      v
+--------------------+
| Summary Index      |  Contains doc-level summaries
| (10K entries)      |  Fast, broad search
+--------+-----------+
         |
         | Top 3 matching docs identified
         v
+--------------------+
| Chunk Index        |  Contains 500-token chunks
| (2M entries)       |  Precise, targeted search
| Filtered to 3 docs |
+--------+-----------+
         |
         v
   Top 5 chunks -> LLM
```

---

## RAG 파이프라인 최적화

나이브 순차 RAG 파이프라인은 매 단계 지연을 더한다. 프로덕션 파이프라인은 병렬성·배칭·비동기 처리로 서브초 SLA를 맞춘다.

### 순차 vs 최적화 파이프라인

```
SEQUENTIAL (Naive):
Query -> Embed(200ms) -> Search(150ms) -> Rerank(300ms) -> Generate(800ms)
Total: ~1450ms

OPTIMIZED (Parallel + Cached):
Query ----+---> Embed(200ms) ---> Vector Search(150ms) ---+
          |                                                |--> RRF Merge -> Rerank(300ms) -> Generate(800ms)
          +---> BM25 Keyword Search(100ms) ---------------+
          |
          +---> Cache Check(5ms) -- HIT --> Return cached (5ms total)

With cache miss: ~1050ms (embedding + keyword in parallel)
With cache hit:  ~5ms
```

### 병렬 검색

```python
async def parallel_retrieve(
    query: str,
    query_embedding: list[float],
    indexes: list[str],
) -> list[Chunk]:
    """Run vector search, keyword search, and graph traversal in parallel."""

    tasks = [
        vector_search(query_embedding, index="main", top_k=20),
        bm25_search(query, index="main", top_k=20),
        # Optionally, graph-based retrieval for entity queries
        graph_search(query, max_hops=2, top_k=10),
    ]

    # All retrieval strategies execute concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Filter out failures (graceful degradation)
    valid_results = [r for r in results if not isinstance(r, Exception)]

    # Merge with Reciprocal Rank Fusion
    merged = reciprocal_rank_fusion(valid_results, k=60)

    return merged[:20]  # top 20 after fusion
```

### 배치 임베딩

수집·여러 쿼리를 동시 처리할 때 GPU 활용 최대화를 위해 임베딩 호출 배칭.

```python
class EmbeddingBatcher:
    """Batch embedding requests to reduce per-call overhead."""

    def __init__(self, model: str, batch_size: int = 64, max_wait_ms: int = 50):
        self.model = model
        self.batch_size = batch_size
        self.max_wait = max_wait_ms / 1000
        self.queue: asyncio.Queue = asyncio.Queue()
        self._running = True

    async def embed(self, text: str) -> list[float]:
        """Submit a single text and wait for its embedding."""
        future = asyncio.Future()
        await self.queue.put((text, future))
        return await future

    async def _batch_loop(self):
        """Background loop that collects and processes batches."""
        while self._running:
            batch = []
            try:
                # Wait for at least one item
                item = await asyncio.wait_for(
                    self.queue.get(), timeout=1.0
                )
                batch.append(item)

                # Collect more items up to batch_size or max_wait
                deadline = time.time() + self.max_wait
                while len(batch) < self.batch_size and time.time() < deadline:
                    try:
                        item = await asyncio.wait_for(
                            self.queue.get(),
                            timeout=max(0, deadline - time.time())
                        )
                        batch.append(item)
                    except asyncio.TimeoutError:
                        break

                # Process the batch
                texts = [t for t, _ in batch]
                embeddings = await embed_batch(self.model, texts)

                for (_, future), emb in zip(batch, embeddings):
                    future.set_result(emb)

            except asyncio.TimeoutError:
                continue
```

### 조기 검색의 스트리밍 생성

사용자가 입력을 마치기 전(멈춤 탐지) 검색을 시작하고 생성 토큰을 생성되는 대로 스트리밍.

```
Timeline:
0ms     User starts typing...
300ms   Pause detected -> trigger retrieval speculatively
500ms   User submits query
        Retrieval already 200ms in -> finishes at 650ms
650ms   Reranking begins
950ms   First generation token streams to user
1800ms  Full response complete

vs. without speculation:
0ms     User submits query
200ms   Embedding
350ms   Retrieval
650ms   Reranking
1500ms  First token
2300ms  Full response complete
```

---

## 교정 RAG: 자기검사 검색

교정 RAG(CRAG)는 검색과 생성 사이 검증 계층을 더한다. 시스템이 응답 생성 전 검색 문서가 실제로 쿼리에 답하는지 평가.

### CRAG 결정 루프

```
  User Query
      |
      v
  Retrieve Top-K
      |
      v
+------------------+
| Relevance Grader  |  "Are these docs relevant to the query?"
| (LLM or trained   |
|  classifier)      |
+--------+---------+
         |
    +----+----+--------+
    |         |        |
    v         v        v
 CORRECT   AMBIGUOUS  WRONG
    |         |        |
    v         v        v
 Generate  Supplement  Discard &
 directly  with web    re-retrieve
           search      with reformulated
                       query
```

AMBIGUOUS 분기엔 웹 검색 백엔드가 필요하고 게이트웨이가 이제 하나를 판다. Cloudflare Web Search API(베타, 2026-10-02)가 AI Gateway 안에서 돌며 Ceramic.ai·Exa·Linkup의 구조화 웹 스니펫을 파트너 정가·마크업 없이 반환, 게이트웨이로 과금·로깅. 누가 공급하든 웹 결과를 신뢰 못 할 입력으로 다뤄라: 프롬프트 인젝션을 나를 수 있으니 별도 라벨 문맥 블록에 두고 프롬프트에서 테넌트 자기 문서를 절대 능가하지 못하게.

### 구현

```python
class CorrectiveRAG:
    """Self-correcting RAG pipeline with retrieval quality checks."""

    def __init__(self, max_corrections: int = 2):
        self.max_corrections = max_corrections

    async def answer(self, query: str) -> RAGResponse:
        attempts = 0
        current_query = query
        all_sources = []

        while attempts <= self.max_corrections:
            # Step 1: Retrieve
            chunks = await retrieve(current_query, top_k=10)

            # Step 2: Grade relevance
            grade = await self._grade_relevance(query, chunks)

            if grade.verdict == "correct":
                # High-confidence retrieval, generate directly
                return await self._generate(query, chunks, all_sources)

            elif grade.verdict == "ambiguous":
                # Supplement with additional search
                web_results = await web_search(current_query)
                chunks = self._merge_and_dedupe(chunks, web_results)
                return await self._generate(query, chunks, all_sources)

            else:  # "wrong"
                # Reformulate query and retry
                current_query = await self._reformulate(
                    original_query=query,
                    failed_query=current_query,
                    reason=grade.reason,
                )
                all_sources.extend(chunks)
                attempts += 1

        # Exhausted retries: generate best-effort with disclaimer
        return await self._generate_with_caveat(query, all_sources)

    async def _grade_relevance(
        self, query: str, chunks: list[Chunk]
    ) -> RelevanceGrade:
        """Use LLM to grade whether chunks answer the query."""
        prompt = f"""Given this query and retrieved documents, assess relevance.

Query: {query}

Documents:
{self._format_chunks(chunks)}

Respond with:
- verdict: "correct" (docs clearly answer the query)
- verdict: "ambiguous" (docs partially relevant, need supplementing)
- verdict: "wrong" (docs are irrelevant to the query)
- reason: brief explanation

JSON response:"""

        result = await llm_call(prompt, response_format="json")
        return RelevanceGrade(**json.loads(result))
```

### Self-RAG: 크리틱 토큰

Self-RAG는 인라인 크리틱 토큰으로 이 패턴을 확장. 모델이 매 단계 자기 출력 평가:

1. **[Retrieve]**: 검색해야 하나?(예/아니오)
2. **[Relevant]**: 검색 정보가 관련인가?(예/아니오)
3. **[Supported]**: 내 답이 증거에 지지되나?(완전/부분/아니오)
4. **[Useful]**: 이 답이 실제로 유용한가?(1-5 점수)

어떤 크리틱 검사든 실패하면 모델이 이전 단계로 루프백.

---

## 적응형 검색

모든 쿼리가 검색으로 이득 보진 않는다. 적응형 검색이 동적으로 검색할지, 얼마나 검색할지, 어느 출처에서 검색할지 결정.

### 검색 결정 트리

```
  User Query
      |
      v
  "Does this query need external knowledge?"
      |
  +---+---+
  |       |
  No      Yes
  |       |
  v       v
Direct   "How complex is the retrieval need?"
 LLM      |
answer  +-+--+---------+
        |    |         |
        v    v         v
     Single Multi    Agentic
      hop   hop      (planning
        |    |       required)
        v    v         |
     1 index 2-3       v
     top-5  indexes  Full agent
             top-10  loop
```

### 쿼리 복잡도 추정기

```python
class AdaptiveRetriever:
    """Decides retrieval strategy based on query characteristics."""

    async def retrieve(self, query: str) -> RetrievalPlan:
        # Fast heuristics first
        if self._is_general_knowledge(query):
            return RetrievalPlan(strategy="none", reason="general knowledge")

        if self._is_simple_lookup(query):
            return RetrievalPlan(
                strategy="single_hop",
                indexes=["primary"],
                top_k=5,
            )

        # LLM-based assessment for ambiguous cases
        plan = await self._plan_retrieval(query)
        return plan

    def _is_general_knowledge(self, query: str) -> bool:
        """Check if query is about widely known facts."""
        general_indicators = [
            "what is", "who is", "define", "explain the concept",
        ]
        has_org_refs = bool(re.search(
            r"(our|my|the company|internal|proprietary)", query.lower()
        ))
        is_general = any(
            query.lower().startswith(g) for g in general_indicators
        )
        return is_general and not has_org_refs

    def _is_simple_lookup(self, query: str) -> bool:
        """Check if query can be answered with a single document."""
        single_hop_patterns = [
            r"what is (the|our) .+ policy",
            r"how (do I|to) .+",
            r"where (can I|do I) find",
        ]
        return any(re.search(p, query.lower()) for p in single_hop_patterns)
```

### 토큰 예산 인식 검색

가용 토큰 예산·예상 응답 복잡도에 따라 검색 노력 스케일.

```python
def plan_retrieval_budget(query: str, max_budget_tokens: int = 4000):
    """Allocate token budget across retrieval and generation."""

    complexity = estimate_complexity(query)  # 1-5 scale

    if complexity <= 2:
        # Simple query: small context, save tokens for generation
        return {"context_tokens": 1000, "generation_tokens": 3000, "top_k": 3}
    elif complexity <= 4:
        # Medium: balanced
        return {"context_tokens": 2500, "generation_tokens": 1500, "top_k": 8}
    else:
        # Complex: heavy retrieval, concise generation
        return {"context_tokens": 3500, "generation_tokens": 500, "top_k": 15}
```

### 관리형 기능으로서의 적응형 노력

관리형 검색 서비스가 이제 이 에스컬레이션 패턴을 설정으로 출시. Azure AI Search 지식 베이스가 REST API 2026-04-01에서 GA(추출 검색; 쿼리 계획·답 합성은 프리뷰), 2026-08-01-preview API가 `retrievalReasoningEffort: "auto"` 추가: 먼저 경량 검색 패스, 접지 불충분 시에만 LLM 쿼리 계획(최대 중간 노력)으로 에스컬레이션. 같은 프리뷰가 검색 결과를 SSE로 스트리밍하고 지식 소스별 재순위 우회 허용. 라우터를 직접 지으면 형태를 복사: 싼 경로가 기본이어야 하고 에스컬레이션 트리거가 쿼리 복잡도 추측이 아니라 측정된 접지 신호여야.

---

## 비용 최적화 패턴

규모에선 RAG 비용이 임베딩·검색·재순위·생성에 걸쳐 복합. 미최적화 시스템은 필요보다 10-50배 쓸 수 있다.

### 전형적 RAG 쿼리 비용 분해

```
Component         Cost per Query    % of Total    Optimization
-----------------------------------------------------------------
Embedding         $0.000005         ~1%           Batch + cache
Vector Search     $0.00001          ~2%           Index optimization
Reranking         $0.0001           ~5-15%        Skip for simple queries
LLM Generation    $0.0004-0.008     ~80-95%       Model tiering, caching
-----------------------------------------------------------------
Total (naive)     ~$0.001-0.01
Total (optimized) ~$0.0002-0.002    (5-10x reduction)
```

### 계층 모델 전략

```
                Query Complexity
                Low         Medium        High
             +----------+----------+----------+
 Generation  |  Small   |  Mid     |  Large   |
 Model       |  Model   |  Model   |  Model   |
             | (GPT-6   | (Sonnet  | (Opus    |
             |  Luna)   |  5.5)    |  5.5)    |
             | ~$0.0004 | ~$0.008  | ~$0.016  |
             +----------+----------+----------+

 Reranking   |  Skip    | Lightweight| Cross-  |
             |          | reranker   | encoder |
             +----------+----------+----------+
```

비용은 2.6K 입력·300 출력 토큰 요청당, 2026-10-01 정가, 추론 토큰 전. 격차가 어디인지 보라: Claude Opus 5.5($4/$20)가 Sonnet 5.5($2/$10)의 2배뿐인데, Sonnet 5.5·GPT-6 Sol이 GPT-6 Luna의 20배. 라우팅 가치 대부분이 이제 소/중 경계에 있으니 분류기 노력을 거기에; 중/대 경계는 오라우팅 비용을 거의 못 갚음.

### 점진적 상세 패턴

최소 검색으로 먼저 답. 사용자가 후속 질문하거나 신뢰가 낮을 때만 에스컬레이션.

```python
class ProgressiveRAG:
    """Start cheap, escalate only when needed."""

    async def answer(self, query: str, session: Session) -> str:
        # Level 1: Try semantic cache
        cached = await self.cache.get(query)
        if cached:
            return cached.response  # Cost: ~$0

        # Level 2: Fast retrieval + small model
        chunks = await retrieve(query, top_k=3)
        response = await generate(
            query, chunks, model="gpt-6-luna"
        )

        # Check confidence
        if response.confidence > 0.85:
            await self.cache.put(query, response)
            return response.text  # Cost: ~$0.0003

        # Level 3: Deep retrieval + reranking + larger model
        chunks = await retrieve(query, top_k=15)
        reranked = await rerank(query, chunks, top_k=5)
        response = await generate(
            query, reranked, model="claude-sonnet-5-5"  # replaces claude-sonnet-4-5 (retires Nov 30, 2026)
        )

        if response.confidence > 0.7:
            await self.cache.put(query, response)
            return response.text  # Cost: ~$0.008

        # Level 4: Full agentic pipeline (expensive but thorough)
        return await self.agentic_pipeline.run(query)  # Cost: ~$0.05
```

### 비용 가드레일

```python
class CostGuard:
    """Prevent runaway costs in production RAG."""

    def __init__(self):
        self.daily_budget = 500.0  # $500/day
        self.per_query_limit = 0.10  # $0.10 max per query
        self.per_user_hourly = 1.0  # $1/user/hour

    async def check(self, user_id: str, estimated_cost: float) -> bool:
        daily_spent = await self.get_daily_spend()
        if daily_spent + estimated_cost > self.daily_budget:
            raise BudgetExceededError("Daily budget exhausted")

        user_spent = await self.get_user_hourly_spend(user_id)
        if user_spent + estimated_cost > self.per_user_hourly:
            raise RateLimitError("User hourly budget exceeded")

        if estimated_cost > self.per_query_limit:
            # Downgrade to cheaper strategy
            return False  # signals caller to use cheaper path

        return True
```

### 빌드 vs 바이: 관리형 RAG 단가

관리형 검색이 이제 쿼리당 가격을 발행해 빌드-바이를 산술로 바꿈. Cloudflare AI Search가 2026-10-01 GA: 밑에 Workers AI·Vectorize·R2·Browser Run, 융합·선택적 재순위의 병렬 벡터·키워드 검색, 스캔 PDF용 선택 OCR, Qwen3-VL-Embedding 통한 이미지 검색. 과금은 2026-11-01 시작:

| 항목 | 가격 | 월 무료(모든 Workers 플랜) |
|------|-------|-------------------------------------|
| 수집 | 1M 토큰당 $0.75 + 이미지 처리 1M당 $0.50 | 5M 토큰 |
| 저장 | GB-월당 $2.00 | 10 GB |
| 의미 쿼리(벡터·하이브리드) | 1K당 $0.75 | 1,000 |
| 전문 쿼리 | 1K당 $0.10 | 1,000 |

월 1M 하이브리드 쿼리면 검색 비용 $750: 자체 스택 운영 엔지니어링 시간보다 훨씬 적음. 1,000 QPS(월 약 26억 쿼리)면 검색만 월 약 $1.9M, 자체 호스팅 벡터 DB 노드와 온콜 로테이션을 많이 살 수 있는 돈. 교차점은 월 수천만 쿼리대; 자신의 인프라·인력 비용으로 계산. 다른 벤더도 같은 스택 패키징: Cohere Compass Cloud(비공개 베타, 2026-09-25)가 파싱·dense+sparse 임베딩·권한 인식 검색·재순위를 에이전트가 코퍼스를 단계적으로 좁히는 MCP 서버 뒤에 번들.

**라이프사이클 위험이 "바이"의 다른 반쪽.** OpenAI가 2026-08-26 Assistants API 종료. 벡터 스토어는 생존: Responses API `file_search` 도구가 같은 `vector_store_ids`를 `max_num_results`·메타데이터 필터와 받아 인덱스는 재수집 불필요했으나 스레드·런 오케스트레이션 코드는 재작성해야 했음. 검색 저장과 오케스트레이션을 분리 가능하게 유지해 어느 하나가 다른 것 없이 옮겨갈 수 있게.

---

## 실패 모드와 디버깅

프로덕션 RAG 시스템은 복합 실패 확률을 가진다. 세 단계 각 95% 신뢰성이면 전체 신뢰성이 0.95 x 0.95 x 0.95 = 0.86으로 떨어진다. 실패 모드 이해가 필수.

### RAG 실패 분류

```
+------------------------------------------------------------------+
|                    RAG Failure Modes                               |
+------------------------------------------------------------------+
|                                                                    |
|  RETRIEVAL FAILURES          GENERATION FAILURES                   |
|  +---------------------+    +-------------------------+           |
|  | Missing documents   |    | Hallucination despite   |           |
|  | (not indexed)       |    | good context            |           |
|  +---------------------+    +-------------------------+           |
|  | Wrong chunks        |    | Ignoring retrieved      |           |
|  | (low precision)     |    | context                 |           |
|  +---------------------+    +-------------------------+           |
|  | Missed chunks       |    | Over-reliance on one    |           |
|  | (low recall)        |    | source                  |           |
|  +---------------------+    +-------------------------+           |
|  | Stale embeddings    |    | Citation fabrication    |           |
|  | (drift)             |    |                         |           |
|  +---------------------+    +-------------------------+           |
|                                                                    |
|  SYSTEM FAILURES             QUALITY FAILURES                      |
|  +---------------------+    +-------------------------+           |
|  | Index unavailable   |    | Chunking artifacts      |           |
|  +---------------------+    +-------------------------+           |
|  | Embedding service   |    | Context window overflow |           |
|  | timeout             |    +-------------------------+           |
|  +---------------------+    | Answer too vague        |           |
|  | Reranker OOM        |    | (over-hedging)          |           |
|  +---------------------+    +-------------------------+           |
|                                                                    |
+------------------------------------------------------------------+
```

### 많은 검색 실패가 청킹 실패다

검색기는 청커가 만든 청크만 반환할 수 있다. 두 청크에 쪼개진 사실, 또는 의미를 주던 섹션 헤더가 벗겨진 청크는 임베딩·재순위기가 아무리 좋아도 검색 불가. 그러니 아래 체크리스트가 검색을 가리키면 임베딩 모델 교체 전 청크를 검사하라. 흔한 청킹 실패:

- **청크 너무 작음**: 문맥 잃음. "It costs $200": 뭐가 $200?
- **청크 너무 큼**: 관련성 희석. 1문장만 관련인 2000토큰 청크.
- **경계 분할**: 표·목록이 두 청크로 쪼개짐.
- **메타데이터 누락**: 청크에 헤더·문서 제목·섹션 문맥 없음.

### 디버깅 체크리스트

```
When RAG quality drops, investigate in this order:

1. RETRIEVAL QUALITY (check first: most common root cause)
   [ ] Log the query and retrieved chunks side by side
   [ ] Compute retrieval precision@K manually for 20 failing queries
   [ ] Check if relevant documents exist in the index at all
   [ ] Compare BM25 vs vector results: if BM25 wins, embeddings are stale

2. CHUNKING QUALITY (check second)
   [ ] Sample 50 random chunks: do they make sense in isolation?
   [ ] Check chunk boundaries for tables, lists, code blocks
   [ ] Verify metadata (title, section, doc_id) is present

3. RERANKING QUALITY (check third)
   [ ] Compare pre-rerank vs post-rerank orderings
   [ ] Check if reranker is pushing relevant results down

4. GENERATION QUALITY (check last)
   [ ] Test with perfect context (manually curated): does LLM still fail?
   [ ] Check for context window overflow (truncated chunks)
   [ ] Verify system prompt is not conflicting with retrieved context
```

### 에이전트 RAG 실패 모드

에이전트 RAG는 세 추가 실패 패턴을 도입:

1. **검색 스래시**: 에이전트가 답에 수렴 않고 반복 검색. 트레이스가 근중복 쿼리와 진동 검색어를 보임. 고침: 3-5 검색 반복으로 제한하고 세션당 쿼리 고유성 추적.
2. **도구 폭풍**: 에이전트가 한 턴에 과도히 도구 호출. 고침: 쿼리당 도구 호출 한계·비용 상한.
3. **문맥 부풀림**: 에이전트가 너무 많은 검색 청크 누적해 문맥 윈도 넘침. 고침: 문맥이 임계 초과 시 가장 오래된 청크를 버리는 슬라이딩 윈도.

---

## 모니터링과 알림

프로덕션 RAG는 표준 애플리케이션 지표를 넘는 전용 모니터링이 필요. 체계적 평가를 이전 RAG 세대의 "먼저 출시, 평가 나중" 패턴이 아니라 1일차 요건으로 다뤄라; 지표·심판 티어는 [RAG 평가 패턴](13-rag-evaluation-patterns.md) 참고.

### RAG 모니터링 스택

```
+--------------------------------------------------------------------+
|                    RAG Observability Layers                          |
+--------------------------------------------------------------------+
|                                                                      |
|  L1: INFRASTRUCTURE          L2: PIPELINE                           |
|  +----------------------+   +-----------------------------+         |
|  | Latency (p50/p95/p99)|   | Retrieval precision@K      |         |
|  | Error rates          |   | Retrieval recall@K         |         |
|  | Throughput (QPS)     |   | Reranker effectiveness     |         |
|  | Cache hit rate       |   | Chunk utilization rate     |         |
|  | Index size/growth    |   | Context window fill rate   |         |
|  +----------------------+   +-----------------------------+         |
|                                                                      |
|  L3: QUALITY                 L4: BUSINESS                           |
|  +----------------------+   +-----------------------------+         |
|  | Faithfulness score   |   | User satisfaction (thumbs) |         |
|  | Answer relevancy     |   | Task completion rate       |         |
|  | Hallucination rate   |   | Escalation to human rate   |         |
|  | Citation accuracy    |   | Cost per successful query  |         |
|  +----------------------+   +-----------------------------+         |
|                                                                      |
+--------------------------------------------------------------------+
```

### 핵심 지표와 알림

| 지표 | 목표 | 알림 임계 | 조치 |
|--------|--------|-----------------|--------|
| **p95 지연** | &lt;2초 | &gt;5초 | 검색 인프라 확장 |
| **캐시 적중률** | &gt;40% | &lt;20% | 유사도 임계 튜닝 |
| **검색 Precision@5** | &gt;0.7 | &lt;0.5 | 청킹 재평가 |
| **충실성** | &gt;0.9 | &lt;0.8 | 생성 프롬프트 감사 |
| **환각률** | &lt;5% | &gt;10% | 접지 프롬프트 강화 |
| **빈 검색률** | &lt;2% | &gt;5% | 인덱스 커버리지 확인 |
| **쿼리당 비용** | &lt;$0.005 | &gt;$0.02 | 모델 계층 검토 |

### 종단 추적 로깅

모든 쿼리가 단일 요청 ID로 모든 파이프라인 단계를 잇는 추적을 생성해야.

```python
@dataclass
class RAGTrace:
    request_id: str
    timestamp: datetime
    query: str
    route: str                    # "simple_rag", "complex_rag", etc.
    cache_hit: bool
    retrieval_latency_ms: float
    chunks_retrieved: int
    chunks_after_rerank: int
    rerank_latency_ms: float
    generation_model: str
    generation_latency_ms: float
    total_latency_ms: float
    input_tokens: int
    output_tokens: int
    estimated_cost: float
    faithfulness_score: float     # 0-1, computed async
    user_feedback: Optional[str]  # thumbs up/down

    def to_dict(self) -> dict:
        return asdict(self)
```

### 자동 품질 샘플링

사용자가 알아채기 전 품질 드리프트 탐지를 위해 프로덕션 쿼리 샘플에 오프라인 평가 실행.

```python
async def nightly_quality_check(sample_size: int = 200):
    """Sample production queries and evaluate RAG quality."""
    traces = await get_recent_traces(limit=sample_size)

    scores = []
    for trace in traces:
        # Re-run the query with evaluation
        eval_result = await evaluate_rag_response(
            query=trace.query,
            response=trace.response,
            retrieved_chunks=trace.chunks,
            metrics=["faithfulness", "relevancy", "context_precision"],
        )
        scores.append(eval_result)

    avg_faithfulness = mean([s.faithfulness for s in scores])
    avg_relevancy = mean([s.relevancy for s in scores])

    if avg_faithfulness < 0.85:
        alert("RAG faithfulness degraded", severity="high")
    if avg_relevancy < 0.70:
        alert("RAG relevancy degraded", severity="medium")

    publish_metrics("rag.nightly.faithfulness", avg_faithfulness)
    publish_metrics("rag.nightly.relevancy", avg_relevancy)
```

---

## 수백만 문서로 확장

수천에서 수백만 문서로 가면 인덱싱 처리량·검색 지연·인덱스 관리에 도전이 생긴다.

### 확장 차원

```
Documents:   1K  -->  100K  -->  1M  -->  100M
             |        |         |         |
Chunks:      10K      1M        10M       1B
             |        |         |         |
Index Size:  50MB     5GB       50GB      5TB
             |        |         |         |
Strategy:    Single   Single    Sharded   Distributed
             Node     Node +    Index     Cluster +
                      Replicas             Tiered
```

### 대규모 수집 파이프라인

```
  Document Sources
  (S3, DBs, APIs, File Shares)
         |
         v
+-------------------+
| Ingestion Queue   |  (Kafka / SQS)
| - Deduplication   |
| - Priority queue  |
+--------+----------+
         |
    +----+----+----+----+
    |    |    |    |    |     Parallel workers
    v    v    v    v    v
  +--+ +--+ +--+ +--+ +--+
  |W1| |W2| |W3| |W4| |W5|  Parse + Chunk + Embed
  +--+ +--+ +--+ +--+ +--+
    |    |    |    |    |
    +----+----+----+----+
         |
         v
+-------------------+
| Vector DB Cluster |
| (Sharded by       |
|  doc_type or      |
|  tenant_id)       |
+-------------------+
```

### 샤딩 전략

| 전략 | 작동 | 장점 | 단점 |
|----------|-------------|------|------|
| **해시 기반** | shard = hash(doc_id) % N | 균등 분포 | 크로스샤드 쿼리 필요 |
| **범위 기반** | 날짜 범위로 샤드 | 시간 기반 쿼리 빠름 | 불균등 샤드 크기 |
| **도메인 기반** | 문서 유형으로 샤드 | 크로스샤드 쿼리 없음 | 불균형 도메인 |
| **테넌트 기반** | tenant_id로 샤드 | 완벽한 격리 | 많은 작은 샤드 |

### 인덱스 유지보수

수백만 문서에선 인덱스 유지보수가 결정적 운영 관심사.

```python
class IndexMaintenanceScheduler:
    """Scheduled tasks for index health at scale."""

    async def run_daily(self):
        # 1. Detect and re-embed stale documents
        stale_docs = await find_docs_with_old_embeddings(
            older_than_days=90,
            embedding_model_version="v2"  # current is v3
        )
        if stale_docs:
            await enqueue_reembedding(stale_docs)

        # 2. Remove orphaned vectors (doc deleted but vector remains)
        orphans = await find_orphaned_vectors()
        if orphans:
            await delete_vectors(orphans)

        # 3. Compact and optimize indexes
        for shard in await list_shards():
            if shard.fragmentation_pct > 20:
                await compact_shard(shard.id)

        # 4. Verify index health
        for shard in await list_shards():
            health = await check_shard_health(shard.id)
            if not health.ok:
                alert(f"Shard {shard.id} unhealthy: {health.reason}")
```

### 무중단 재임베딩

"새 임베딩 모델 = 전체 재인덱스"는 더 이상 유일한 답이 아니다:

- **공유 임베딩 공간.** Voyage 4 계열(voyage-4-large $0.12, voyage-4 $0.06, voyage-4-lite $0.02/1M, 오픈 가중치 voyage-4-nano)이 한 공간 공유, Cohere `embed-v5.0-pro`·`-fast`(2026-09-30)도. 큰 모델로 한 번 인덱싱·작은 모델로 쿼리; 인덱스를 안 건드리고 쿼리 측 모델 변경 가능. Qdrant Constella 연구 프리뷰(2026-09-29)가 더 나아감: 고정 Stella(400M) 문서 인덱스 + 교체 쿼리 인코더, 34.5M Constella Nano가 Stella BEIR nDCG@10의 약 91%를 12배 낮은 CPU 지연으로(벤더).
- **온라인 백필.** 문서 측이 바뀌어야 하면 둘째 벡터 필드 추가, 백그라운드 백필, 골든셋에 둘 다 섀도 쿼리, 그다음 전환. Milvus 3.0(2026-07)이 컬럼 온라인 추가·백필·드롭 지원, 수억 행 위 핫 패스로.
- **DB 내 임베딩.** MongoDB Atlas Automated Embedding(GA 2026-08-13)·turbopuffer 네이티브 임베딩(GA 2026-09-29)이 동기 파이프라인을 없애나 인덱스를 벤더 선택 모델 버전에 묶음. 채택 전 모델 업그레이드·재임베딩이 어떻게 스케줄·과금되는지 물어라.

### 메모리 티어와 양자화

1,536 float32 차원에서 벡터가 6 KB라 10억 청크가 그래프 전 약 6 TB. 회전 기반 저비트 양자화가 주 레버이고 **옵트인·프리뷰이지 기본값 아님**: Qdrant가 1.18에 Hadamard 회전 TurboQuant, 1.19에 4비트 전용 Turbo4 저장 타입(float32 + 4비트 사본보다 9배 작으나 원본이 사라져 최고 재현율 비용); Weaviate 1.39가 4비트 회전 양자화 프리뷰(1,536차원 벡터 6,144→784바이트). Qdrant 1.19도 `on_disk`/`always_ram`을 벡터·HNSW·sparse·페이로드 인덱스 전반의 한 `memory` 설정(핀·캐시·콜드)으로 대체.

프로덕션 패턴: 후보 검색엔 RAM에 핀된 양자화 벡터, 상위 후보 재점수엔 디스크의 콜드 전정밀 원본, 매 양자화 변경 후 정확 kNN 대비 ANN 재현율 측정([RAG 평가 패턴](13-rag-evaluation-patterns.md) 참고).

### 검색용 읽기 복제본

수집이 쿼리 지연을 저하시키지 않도록 읽기·쓰기 경로 분리.

```
  Ingestion Pipeline              Query Pipeline
        |                              |
        v                              v
  +-----------+     Replication   +-----------+
  |  Primary  | ----------------> |  Replica  |
  |  (Write)  |                   |  (Read)   |
  +-----------+                   +-----------+
                                  |  Replica  |
                                  |  (Read)   |
                                  +-----------+
                                  |  Replica  |
                                  |  (Read)   |
                                  +-----------+
```

---

## 멀티테넌트 RAG 격리

멀티테넌트 RAG는 SaaS 제품의 가장 흔한 프로덕션 패턴. 격리를 틀리면 테넌트 간 데이터 누출이 되고 이는 결정적 보안 실패.

### 세 격리 모델

```
SILO MODEL (Strongest Isolation)
+----------+  +----------+  +----------+
| Tenant A |  | Tenant B |  | Tenant C |
| +------+ |  | +------+ |  | +------+ |
| |Index | |  | |Index | |  | |Index | |
| +------+ |  | +------+ |  | +------+ |
| |Cache | |  | |Cache | |  | |Cache | |
| +------+ |  | +------+ |  | +------+ |
+----------+  +----------+  +----------+
Cost: $$$$    Best for: Enterprise, Regulated Industries


POOL MODEL (Cost-Efficient)
+-------------------------------------------+
|              Shared Index                  |
|  [A] [B] [A] [C] [B] [A] [C] [B] [C]    |
|                                            |
|  Every query includes:                     |
|  WHERE tenant_id = ? (MANDATORY)           |
+-------------------------------------------+
Cost: $       Best for: SMB SaaS


BRIDGE MODEL (Hybrid)
+----------+  +----------------------------+
| Tenant A |  |     Shared Pool            |
| (Enterprise) | [B] [C] [D] [E] [F] [G]  |
| +------+ |  |                            |
| |Dedicated|  | WHERE tenant_id = ?       |
| |Index | |  +----------------------------+
| +------+ |
+----------+
Cost: $$      Best for: Mixed customer base
```

### 보안: 심층 방어

```python
class TenantIsolatedRetriever:
    """Enforces tenant isolation at every retrieval layer."""

    async def retrieve(
        self, query: str, tenant_id: str, user_id: str
    ) -> list[Chunk]:
        # Layer 1: Tenant ID is MANDATORY in every query
        if not tenant_id:
            raise SecurityError("tenant_id required for retrieval")

        # Layer 2: Validate user belongs to tenant
        if not await self.authz.user_in_tenant(user_id, tenant_id):
            raise AuthorizationError("User not in tenant")

        # Layer 3: Apply tenant filter at the database level
        chunks = await self.vector_db.search(
            query_embedding=await embed(query),
            filter={"tenant_id": {"$eq": tenant_id}},  # ALWAYS filtered
            top_k=10,
        )

        # Layer 4: Post-retrieval verification
        for chunk in chunks:
            assert chunk.metadata["tenant_id"] == tenant_id, \
                f"Cross-tenant leak detected: {chunk.id}"

        # Layer 5: Audit log
        await self.audit_log.record(
            action="retrieve",
            tenant_id=tenant_id,
            user_id=user_id,
            chunk_ids=[c.id for c in chunks],
        )

        return chunks
```

### 테넌트 필터가 못 막는 누출

필수 `tenant_id` 필터는 크로스테넌트 *결과*를 막는다. 크로스테넌트 *신호*는 못 막는다:

| 채널 | 어떻게 누출 | 완화 |
|---------|--------------|------------|
| **공유 BM25 통계** | 풀 인덱스에서 IDF가 모든 테넌트 문서 위 계산돼 한 테넌트 어휘가 다른 테넌트 순위를 이동시키고 점수가 코퍼스 전역 용어 빈도 반영 | 테넌트별 IDF(Qdrant 1.19가 sparse/BM25에 추가), 또는 사일로 어휘 인덱스 |
| **추론 프리픽스 캐시** | 자체 호스팅 엔진에서 공유 프리픽스 캐시가 다른 테넌트가 같은 프리픽스를 보냈는지에 대한 타이밍 오라클 | 모든 코드 경로에 테넌트별 캐시 솔트. vLLM GHSA-935w-9g4m-p28p(0.30.0 수정)가 솔트를 빠뜨린 한 경로였으니 vLLM 0.30.0 이상 실행 |
| **시맨틱 응답 캐시** | 테넌트 A 문서로 지은 답이 테넌트 B 유사 쿼리에 제공 | 전역이 아니라 테넌트·ACL 집합으로 캐시 키 |
| **엔진 취약점** | 인덱스 빌드 허용 롤이면 닿는 버그 | pgvector 0.8.7(2026-10-01)이 코드 실행으로 이어질 수 있는 IVFFlat 빌드 오버플로 CVE-2026-103484(0.8.6 이하) 수정. 앱 롤에 인덱스 생성 부여 금지, 관리형 Postgres 패치 확인 |

사일로는 이제 고객 자기 클라우드 계정을 뜻할 수도: Pinecone BYOC(GA 2026-09-23, AWS·Google Cloud·Azure)가 벡터·문서·메타데이터·요청 페이로드 포함 데이터 플레인을 고객 클라우드에서 실행, 벤더 컨트롤 플레인은 아웃바운드 호출로만 관리.

### 테넌트 인식 수집

테넌트 문맥을 수집부터 생성까지 모든 단계에 주입해야.

```
Document Upload (Tenant A)
        |
        v
  +---------------------+
  | Validate Ownership  |  Does this doc belong to Tenant A?
  +---------------------+
        |
        v
  +---------------------+
  | Chunk + Embed       |  Attach tenant_id to every chunk
  +---------------------+
        |
        v
  +---------------------+
  | Index with Metadata |  {"tenant_id": "A", "doc_id": "...", ...}
  +---------------------+
        |
        v
  +---------------------+
  | Invalidate Cache    |  Clear Tenant A's cache entries
  +---------------------+             for affected documents
```

### 시끄러운 이웃 방지

풀 모델에선 한 테넌트의 과다 사용이 모든 테넌트 성능을 저하시킬 수 있다.

```python
class TenantRateLimiter:
    """Per-tenant rate limiting and resource quotas."""

    def __init__(self):
        self.tenant_limits = {
            "free":       {"qps": 5,   "daily_queries": 500},
            "pro":        {"qps": 50,  "daily_queries": 10_000},
            "enterprise": {"qps": 200, "daily_queries": 100_000},
        }

    async def check(self, tenant_id: str, tier: str) -> bool:
        limits = self.tenant_limits[tier]

        current_qps = await self.redis.get(f"qps:{tenant_id}")
        if current_qps and int(current_qps) >= limits["qps"]:
            raise RateLimitError(f"QPS limit ({limits['qps']}) exceeded")

        daily_count = await self.redis.get(f"daily:{tenant_id}")
        if daily_count and int(daily_count) >= limits["daily_queries"]:
            raise RateLimitError("Daily query limit exceeded")

        # Increment counters
        pipe = self.redis.pipeline()
        pipe.incr(f"qps:{tenant_id}")
        pipe.expire(f"qps:{tenant_id}", 1)  # 1-second window
        pipe.incr(f"daily:{tenant_id}")
        pipe.expire(f"daily:{tenant_id}", 86400)
        await pipe.execute()

        return True
```

---

## 실세계 아키텍처 예시

### 예시 1: 고객 지원 RAG

```
+------------------------------------------------------------------+
|                   Customer Support RAG System                     |
+------------------------------------------------------------------+
|                                                                    |
|  Customer Query                                                    |
|       |                                                            |
|       v                                                            |
|  +------------+    +---------+    +------------------+             |
|  | Query      |--->| Semantic|--->| Intent           |             |
|  | Normalizer |    | Cache   |    | Classifier       |             |
|  +------------+    +---------+    +--------+---------+             |
|                     (hit->skip)            |                       |
|                                   +--------+---------+             |
|                                   |                  |             |
|                                   v                  v             |
|                             +-----------+    +-------------+      |
|                             | Knowledge |    | Order/Acct  |      |
|                             | Base RAG  |    | Database    |      |
|                             | (articles,|    | (SQL lookup)|      |
|                             |  FAQs)    |    +-------------+      |
|                             +-----------+           |              |
|                                   |                 |              |
|                                   +--------+--------+              |
|                                            |                       |
|                                            v                       |
|                                   +------------------+             |
|                                   | Response Gen     |             |
|                                   | (with citations  |             |
|                                   |  + confidence)   |             |
|                                   +--------+---------+             |
|                                            |                       |
|                                   +--------+---------+             |
|                                   |                  |             |
|                                   v                  v             |
|                            confidence > 0.8    confidence < 0.8   |
|                            Auto-respond        Route to human      |
|                                                                    |
+------------------------------------------------------------------+

Scale: 50K articles, 2M customer interactions/month
Latency SLA: p95 < 3s
Cache hit rate: ~45%
Auto-resolution rate: ~60%
```

### 예시 2: 엔터프라이즈 지식 플랫폼

```
+------------------------------------------------------------------+
|              Enterprise Multi-Tenant Knowledge Platform            |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+                                              |
|  | Auth + Tenant    |                                              |
|  | Resolution       |                                              |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+                                              |
|  | Query Router     |                                              |
|  +--+----+----+-----+                                              |
|     |    |    |                                                     |
|     v    v    v                                                     |
|  +----+ +----+ +--------+                                          |
|  |Docs| |Wiki| |Tickets |  Per-domain indexes                     |
|  |Idx | |Idx | |Idx     |  (all tenant-filtered)                   |
|  +----+ +----+ +--------+                                          |
|     |    |    |                                                     |
|     +----+----+                                                     |
|          |                                                          |
|          v                                                          |
|  +------------------+                                              |
|  | Cross-Encoder    |                                              |
|  | Reranker         |                                              |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+     +-------------------+                    |
|  | Tiered LLM       |<--->| Permission Filter |                    |
|  | Generation        |     | (doc-level ACLs)  |                    |
|  +------------------+     +-------------------+                    |
|           |                                                        |
|           v                                                        |
|  +------------------+                                              |
|  | Response + Audit |                                              |
|  | Trail            |                                              |
|  +------------------+                                              |
|                                                                    |
+------------------------------------------------------------------+

Scale: 200 tenants, 10M documents total, 500K queries/day
Isolation: Bridge model (5 enterprise silos + shared pool)
Ingestion: Async via Kafka, ~50K docs/day
```

### 예시 3: 법률 문서 분석

```
  User: "Summarize indemnification clauses across all vendor contracts"
      |
      v
  +---------------------+
  | Agentic RAG Planner |
  +---------------------+
      |
      | Plan: 1. Find all vendor contracts
      |        2. Extract indemnification clauses
      |        3. Synthesize comparison
      |
      v
  +---------------------+    +-------------------+
  | Step 1: Metadata    |--->| Filter: doc_type  |
  | Search              |    | = "vendor_contract"|
  +---------------------+    +-------------------+
      |                            |
      | 47 contracts found         |
      v                            v
  +---------------------+    +-------------------+
  | Step 2: Section     |--->| Filter: section   |
  | Retrieval           |    | = "indemnification"|
  +---------------------+    +-------------------+
      |                            |
      | 43 relevant sections       |
      v                            |
  +---------------------+         |
  | Step 3: Long Context|<--------+
  | Synthesis           |
  | (load 43 sections   |
  |  into 1M context)   |
  +---------------------+
      |
      v
  Comparative summary with
  per-contract citations
```

---

## 시스템 디자인 면접 관점

### Q: 500 테넌트 전반 초당 1만 쿼리를 p99 지연 2초로 서빙하는 RAG 시스템을 설계하라.

**좋은 답변:**

네 계층으로 설계하겠다.

**계층 1: 라우팅과 캐싱.** 쿼리 라우터가 각 쿼리 분류(직접 LLM, 단순 RAG, 복잡 RAG). 3티어 캐시(정확 일치, 시맨틱, 문서)가 트래픽 약 40-50% 처리. 즉 5,000-6,000 QPS만 실제 검색 파이프라인에 닿음.

**계층 2: 검색.** 브리지 격리 모델: 상위 20 엔터프라이즈 테넌트는 전용 인덱스(사일로), 나머지 480은 필수 tenant_id 필터의 풀 인덱스 공유. 검색은 하이브리드(벡터+BM25) 병렬, RRF로 병합. 벡터 DB 클러스터는 테넌트 티어로 샤딩·읽기 처리량 복제.

**계층 3: 생성.** 계층 모델 전략이 단순 쿼리를 작은 모델, 복잡 쿼리를 큰 모델로. 평균 비용 낮게 유지하며 어려운 쿼리 품질 유지. 테넌트별 레이트 리밋이 시끄러운 이웃 방지.

**계층 4: 관측성.** 모든 쿼리가 지연 분해·검색 점수·비용 추적 생성. 야간 품질 검사가 500 쿼리 샘플해 충실성·관련성 평가. p95 지연 3초 초과·충실성 0.85 미만 시 알림.

**비용 추정**: 1만 QPS는 일 8.64억 쿼리라 요청당 산술이 모든 걸 지배. 50% 캐시 적중이면 일 4.32억 생성 남음. 요청당 2.6K 입력·300 출력, 2026-10 정가로 GPT-6 Luna(요청당 약 $0.0004)와 Claude Sonnet 5.5·GPT-6 Sol 같은 $2/$10 중티어(약 $0.008) 70/30 분할이 약 $120K + $1.06M, 공유 시스템 프롬프트 프롬프트 캐싱 전 대략 **일 $1.2M**. 그 수가 진짜 설계 결정을 몬다: 정적 프롬프트 프리픽스 캐시(0.1배 읽기 이하), 캐시 적중률 상향, 약정 가격 협상, 작은 티어 자체 호스팅 — 일 약 3억 소형 모델 요청은 전용 GPU 플릿이 토큰당 API를 이기는 지점을 한참 지남.

### Q: RAG 시스템이 무관 문서를 검색했는데 LLM이 그래도 그럴듯한 답을 생성하는 경우를 어떻게 다루나?

**좋은 답변:**

가장 위험한 RAG 실패 모드 — 실제(그러나 무관) 문서에 접지된 자신 있는 환각을 내기 때문. 세 지점에서 다루겠다:

첫째, 검색 단계에서 각 검색 청크를 쿼리 대비 점수하는 관련성 그레이더(분류기·LLM 호출) 구현. 모든 청크가 임계 아래면 시스템이 웹 검색으로 에스컬레이션(교정 RAG)하거나 약한 문맥에서 생성하는 대신 "정보가 부족하다"로 응답.

둘째, 생성 단계에서 증거 부족 시 명시하라 지시하는 제약 프롬프팅. 출력에 신뢰 점수 포함, 저신뢰 답을 인간 검토로 라우팅.

셋째, 모니터링에서 검색 점수와 사용자 피드백 상관 추적. 검색 점수가 높았던 쿼리에 사용자가 싫어요를 주면 재순위기·청킹 전략이 근본 원인일 가능성. 전체 추적(쿼리·검색 청크·생성 답·사용자 피드백)을 로깅해 특정 실패 케이스 디버그.

### Q: RAG 시스템 비용이 쿼리 볼륨 증가 없이 지난달 3배가 됐다. 어떻게 진단·수정하나?

**좋은 답변:**

이 순서로 조사:

첫째, **캐시 적중률** 확인. 떨어졌으면 더 많은 쿼리가 전체 파이프라인에 닿음. 흔한 원인: 시맨틱 캐시 임계 변경, 데이터 갱신 후 너무 공격적 캐시 무효화, 캐시 쿼리와 안 맞는 쿼리 분포 이동.

둘째, **모델 라우팅 분포** 확인. 쿼리 분류기가 더 많은 쿼리를 비싼 큰 모델로 라우팅하면 그것만으로 비용 3배 가능. 쿼리 복잡도가 이동했는지, 분류기 거동이 드리프트했는지 보라.

셋째, 에이전트 RAG 경로의 **검색 스래시** 확인. 교정 RAG 루프가 더 자주 재시도하면(낡은 임베딩·저하된 검색 품질 때문일 수도) 각 쿼리가 여러 검색·생성 호출. 추적 로그가 쿼리당 평균 반복 수 보임.

넷째, **임베딩 파이프라인** 확인. 문서가 불필요 재임베딩되면(중복 수집, 중복제거 없음) 임베딩 비용 급증.

고침은 근본 원인에 달렸으나 흔한 개입: 시맨틱 캐시 임계 튜닝, 쿼리당 비용 상한으로 싼 폴백 경로 강제, 임베딩 낡음 고쳐 교정 검색 루프 감소, 수집 파이프라인에 중복제거 추가.

---

## 참고 문헌

- Asai et al. "Self-RAG..." (2024)
- Yan et al. "Corrective Retrieval Augmented Generation (CRAG)" (2024)
- Shi et al. "RAGRouter..." (2025)
- Redis. "RAG at Scale: How to Build Production AI Systems in 2026"
- Anthropic. "1M Token Context Window General Availability" (2026-03)
- RAGAS Framework. "Context Precision, Recall, Faithfulness, and Relevancy Metrics"
- AWS. "Multi-Tenant RAG with Amazon Bedrock Knowledge Bases" (2025)
- Microsoft. "Design a Secure Multitenant RAG Inferencing Solution" (2025)
- Microsoft. "What's new in Azure AI Search" (2026-08-01-preview)
- Cloudflare. "AI Search is now generally available" (2026-10)
- Pinecone. "Pinecone Nexus is generally available" (2026-08)
- Qdrant. "Qdrant 1.19" release notes (2026-08)
- pgvector. CHANGELOG, 0.8.7 (2026-10)

---

*이전: [RAG 평가 패턴](13-rag-evaluation-patterns.md) | 다음: [AI를 위한 데이터 엔지니어링](15-data-engineering-for-ai.md)*
