---
title: AI 설계 패턴
sidebar_position: 1
description: AI 시스템 구축의 공통 패턴 카탈로그 — RAG 패턴(Naive·Advanced·Parent-Child·Self-RAG·CRAG), 에이전트 패턴(ReAct·Plan-and-Execute·Critic·계층형), 최적화 패턴(캐스케이드·스펙큘레이티브·캐싱), 신뢰성 패턴, 비용 패턴.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/15-ai-design-patterns/01-design-patterns.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 제품명·모델명·버전·가격·패턴명은 원문 표기를 유지합니다. 코드·다이어그램은 원문 그대로 둡니다.
:::

# AI 설계 패턴

이 장은 소프트웨어 엔지니어링의 디자인 패턴처럼 AI 시스템 구축의 공통 패턴을 카탈로그한다. 각 패턴은 언제 쓸지, 구현 지침, 트레이드오프를 담는다.

## RAG 패턴

### 패턴: Naive RAG

가장 단순한 RAG 구현:

```
Query → Embed → Search → Top K → Stuff into prompt → Generate
```

**언제:**
- MVP·프로토타이핑
- 단순 질의응답
- 검색 품질이 충분할 때

**한계:**
- 리랭킹 없음
- 쿼리 강화 없음
- 무관 청크 검색 가능

---

### 패턴: Advanced RAG

다단계 강화 파이프라인:

```
Query → Rewrite → Embed → Hybrid Search → Rerank → Filter → Generate
```

```python
class AdvancedRAG:
    async def query(self, user_query: str) -> str:
        # Step 1: Query rewriting
        enhanced_query = await self.rewrite_query(user_query)
        
        # Step 2: Hybrid retrieval
        semantic_results = await self.vector_search(enhanced_query, top_k=50)
        keyword_results = await self.bm25_search(enhanced_query, top_k=50)
        
        # Step 3: Fusion
        combined = self.reciprocal_rank_fusion(semantic_results, keyword_results)
        
        # Step 4: Reranking
        reranked = await self.rerank(enhanced_query, combined[:20])
        
        # Step 5: Generation with top results
        context = self.format_context(reranked[:5])
        return await self.generate(user_query, context)
```

**언제:**
- 프로덕션 시스템
- 정확도가 중요할 때
- 복잡한 문서 집합

---

### 패턴: Parent-Child Retrieval

작은 청크로 검색, 더 큰 부모 청크 반환:

```
Document
    └── Parent chunk (2000 tokens)
            ├── Child chunk (200 tokens) ← Retrieve on this
            ├── Child chunk (200 tokens)
            └── Child chunk (200 tokens)
```

```python
class ParentChildRetriever:
    def __init__(self, vector_store):
        self.vector_store = vector_store
    
    async def retrieve(self, query: str, top_k: int = 5) -> list[str]:
        # Search on child chunks (more precise)
        child_results = await self.vector_store.search(
            query, 
            collection="child_chunks",
            top_k=top_k * 3
        )
        
        # Get unique parent chunks
        parent_ids = set(r.metadata["parent_id"] for r in child_results)
        
        # Return parent chunks (more context)
        parents = await self.get_parents(list(parent_ids)[:top_k])
        return parents
```

**언제:**
- 검색에 정밀도 필요
- 생성에 컨텍스트 필요
- 문서 구조가 계층적

---

### 패턴: Self-RAG

모델이 언제·무엇을 검색할지 결정:

```python
class SelfRAG:
    async def generate(self, query: str) -> str:
        # Step 1: Decide if retrieval is needed
        needs_retrieval = await self.assess_retrieval_need(query)
        
        if needs_retrieval:
            # Step 2: Retrieve
            context = await self.retrieve(query)
            
            # Step 3: Assess relevance
            relevant_context = await self.filter_relevant(query, context)
            
            # Step 4: Generate with context
            response = await self.generate_with_context(query, relevant_context)
            
            # Step 5: Self-critique
            is_supported = await self.check_support(response, relevant_context)
            if not is_supported:
                response = await self.regenerate(query, relevant_context)
        else:
            response = await self.generate_without_context(query)
        
        return response
```

**언제:**
- 혼합 지식(파라메트릭 + 검색)
- 모델이 선택적이길 원할 때
- 연구·실험

---

### 패턴: Corrective RAG (CRAG)

검색 품질 평가·교정:

```python
class CorrectiveRAG:
    async def query(self, user_query: str) -> str:
        # Initial retrieval
        docs = await self.retrieve(user_query)
        
        # Grade each document
        graded = []
        for doc in docs:
            grade = await self.grade_relevance(user_query, doc)
            graded.append((doc, grade))
        
        # Categorize results
        relevant = [d for d, g in graded if g == "relevant"]
        ambiguous = [d for d, g in graded if g == "ambiguous"]
        
        if len(relevant) >= 3:
            # Enough relevant docs
            context = relevant
        elif len(relevant) + len(ambiguous) >= 2:
            # Refine ambiguous docs
            refined = await self.refine_search(user_query, ambiguous)
            context = relevant + refined
        else:
            # Web search fallback
            web_results = await self.web_search(user_query)
            context = relevant + web_results
        
        return await self.generate(user_query, context)
```

**언제:**
- 신뢰 불가 문서 코퍼스
- 높은 정확도 필요
- 품질 검사에 지연 감당 가능

---

## 에이전트 패턴

### 패턴: ReAct

추론과 행동을 교차:

```
Thought → Action → Observation → Thought → Action → Observation → Answer
```

구현은 [에이전트 아키텍처](../07-agentic-systems/01-agent-fundamentals.md) 참고.

**언제:**
- 범용 에이전트
- 설명 가능한 의사결정
- 중간 복잡도 작업

---

### 패턴: Plan-and-Execute

먼저 계획을 만들고 단계 실행:

```python
class PlanAndExecuteAgent:
    async def run(self, task: str) -> str:
        # Step 1: Create plan
        plan = await self.create_plan(task)
        
        # Step 2: Execute each step
        results = []
        for step in plan.steps:
            result = await self.execute_step(step, results)
            results.append(result)
            
            # Re-plan if needed
            if result.needs_replanning:
                plan = await self.replan(task, results)
        
        # Step 3: Synthesize final answer
        return await self.synthesize(task, results)
    
    async def create_plan(self, task: str) -> Plan:
        prompt = f"""
        Create a step-by-step plan to accomplish this task: {task}
        
        Return as JSON:
        {{
            "steps": [
                {{"id": 1, "description": "...", "tool": "..."}},
                ...
            ]
        }}
        """
        return await self.llm.generate(prompt)
```

**언제:**
- 복잡한 다단계 작업
- 계획 가시성 필요
- 분해로 이득 보는 작업

---

### 패턴: Critic/Verifier

한 에이전트가 생성, 다른 에이전트가 비평:

```python
class CriticPattern:
    async def generate_with_critique(self, task: str, max_iterations: int = 3) -> str:
        response = await self.generator.generate(task)
        
        for i in range(max_iterations):
            # Critique the response
            critique = await self.critic.evaluate(task, response)
            
            if critique.is_acceptable:
                break
            
            # Regenerate with feedback
            response = await self.generator.regenerate(
                task, 
                previous=response, 
                feedback=critique.feedback
            )
        
        return response
```

**언제:**
- 품질이 결정적
- 추가 지연 감당 가능
- 명확한 성공 기준 있는 작업

---

### 패턴: Hierarchical Agents

매니저가 전문 워커에 위임:

```python
class ManagerAgent:
    def __init__(self):
        self.workers = {
            "research": ResearchAgent(),
            "coding": CodingAgent(),
            "writing": WritingAgent()
        }
    
    async def run(self, task: str) -> str:
        # Decompose task
        subtasks = await self.decompose(task)
        
        # Assign to workers
        results = {}
        for subtask in subtasks:
            worker = self.workers[subtask.worker_type]
            results[subtask.id] = await worker.execute(subtask)
        
        # Synthesize results
        return await self.synthesize(task, results)
```

**언제:**
- 도메인을 걸치는 복잡한 작업
- 하위 작업별 다른 도구
- 병렬화 기회

---

## 최적화 패턴

### 패턴: Cascading Models

충분한 최저가 모델로 라우팅:

```python
class ModelCascade:
    def __init__(self):
        # (model, input USD per 1M tokens at list price, October 2026)
        self.models = [
            ("gpt-6-luna", 0.10),         # Cheapest
            ("claude-sonnet-5-5", 2.00),  # Mid-tier
            ("claude-opus-5-5", 4.00)     # Most capable
        ]
    
    async def generate(self, query: str) -> str:
        # Classify complexity
        complexity = await self.classify_complexity(query)
        
        if complexity == "simple":
            return await self.call_model("gpt-6-luna", query)
        elif complexity == "medium":
            return await self.call_model("claude-sonnet-5-5", query)
        else:
            return await self.call_model("claude-opus-5-5", query)
```

**언제:**
- 높은 쿼리 볼륨
- 가변 쿼리 복잡도
- 비용 최적화 우선

**라우팅 vs 캐스케이딩.** 위 코드는 분류기로 앞서 라우팅한다. 진짜 캐스케이드는 싼 모델을 먼저 돌리고 검증기·신뢰 검사가 실패할 때만 에스컬레이트하는데, 대부분 요청이 쉽고 실패가 탐지 가능할 때 이득이다. 현 복잡성 둘: 기본값이 버전 간 움직이니 티어별 추론 노력을 핀(Claude Opus 5.5는 `medium` 기본, Opus 5는 `high` 기본); 가격이 더는 역량의 프록시가 아니니 가격이 움직일 때마다 티어 재도출. Opus 5.5($4/$20 per 1M)가 Artificial Analysis Intelligence Index v4.3.2에서 58로, $10/$50 Claude Fable 5.1의 53 위(둘 다 max 노력·안전장치 폴백).

---

### 패턴: Speculative Execution

소형 모델로 초안, 대형으로 검증:

```python
class SpeculativeExecution:
    async def generate(self, prompt: str, n_tokens: int = 5, max_tokens: int = 512) -> str:
        output = []
        
        while len(output) < max_tokens:
            # Draft with small model
            draft = await self.draft_model.generate(
                prompt + "".join(output),
                n_tokens=n_tokens
            )
            
            # Verify with large model
            verified = await self.target_model.verify(
                prompt + "".join(output),
                draft
            )
            
            # Accept verified tokens
            output.extend(verified.accepted_tokens)
            
            if verified.is_complete:
                break
        
        return "".join(output)
```

**언제:**
- 지연 결정적 애플리케이션
- 정렬된 초안 모델 보유
- 예측 가능한 생성 패턴

프로덕션에선 이 루프를 직접 쓸 일이 드물고 서빙 엔진이 돌린다. vLLM·SGLang이 EAGLE-3·네이티브 다중 토큰 예측(MTP) 헤드 + DFlash 블록 확산 드래프터(Inco AI가 Qwen3.8-27B에서 DFlash 2에 2.7배\~3.4배 처리량 보고)를 제공하고, vLLM은 모델 체크포인트에 번들된 DeepSeek의 DSpark 모듈도 돌린다. 배치 크기가 커지면 속도 향상이 줄어드니 프로덕션 동시성에서 측정; vLLM은 적응형 검증이 동시성 256까지 스펙큘레이션을 유익하게 유지한다 함. 호스팅 API에선 동등 레버가 유료 속도 티어: OpenAI Fast 표준 요율 2배·Ultrafast 6배(GPT-6 Astra GA), 또는 Anthropic의 Opus 5.5 fast 모드 2배(리서치 프리뷰, Claude API만). [스펙큘레이티브 디코딩](../04-inference-optimization/03-speculative-decoding.md) 참고.

---

### 패턴: Caching Layers

다단계 캐싱 전략:

```python
class CachingLLM:
    def __init__(self):
        self.exact_cache = ExactMatchCache()
        self.semantic_cache = SemanticCache(threshold=0.95)
    
    async def generate(self, query: str) -> str:
        # Level 1: Exact match
        cached = await self.exact_cache.get(query)
        if cached:
            return cached
        
        # Level 2: Semantic similarity
        similar = await self.semantic_cache.get_similar(query)
        if similar:
            return similar
        
        # Cache miss: Generate
        response = await self.llm.generate(query)
        
        # Store in caches
        await self.exact_cache.set(query, response)
        await self.semantic_cache.set(query, response)
        
        return response
```

**언제:**
- 반복되는 유사 쿼리
- 비용 절감 우선
- 일부 낡음 허용 가능

**제공자 프롬프트 캐시를 두 계층 아래 두라.** 정확·시맨틱 캐시는 질문 전체가 반복될 때만 돕는다. 프롬프트(접두사) 캐싱은 안정 접두사를 공유하는 모든 요청을 돕는데, 에이전트 루프에선 거의 매 호출: Anthropic은 Claude Code 트래픽이 출력 토큰당 입력 324 토큰으로 돈다고 보고. 캐시 읽기는 대부분 모델서 입력의 0.1배, Claude Opus 5.5·GPT-6.1 Sol서 0.05배, Claude Fable 5.1서 0.025배 과금, 쓰기 프리미엄 1.25배(Anthropic 1시간 캐시는 2배; OpenAI GPT-5.6 이상은 고정 30분 TTL). 프롬프트를 안정부(시스템 프롬프트·도구 정의·지속 문서)가 먼저 오도록 순서 짓고, 캐시 적중률을 SLO로 취급; OpenAI·Anthropic 둘 다 2026-09 캐시 미스 진단을 GA.

---

## 신뢰성 패턴

### 패턴: Retry with Fallback

```python
class RetryWithFallback:
    async def generate(self, query: str) -> LLMResponse:
        providers = [
            ("openai", "gpt-6-sol"),
            ("anthropic", "claude-sonnet-5-5"),
            ("google", "gemini-3.8-flash")
        ]
        
        for provider, model in providers:
            try:
                response = await self.call(provider, model, query)
            except (RateLimitError, ServiceError, TimeoutError):
                continue
            
            # A safety refusal is an outcome, not an outage: Claude returns it
            # as HTTP 200 with stop_reason "refusal". Handle it deliberately
            # (the provider's own fallback, a user message, or a human), not by
            # shopping the request to another vendor.
            if response.stop_reason == "refusal":
                return self.handle_refusal(response)
            return response
        
        # All providers failed
        raise AllProvidersUnavailable()
```

루프가 시사하는 것보다 폴백을 어렵게 하는 세 가지:

- **폴백은 벤더를 교차해야.** Anthropic이 2026-08-16\~09-29에 주요·심각 사고 최소 12건 로그, OpenAI 9/29 단일 사고가 API·ChatGPT·Codex를 약 5시간 20분 저하. 같은 벤더 두 번째 모델 폴백은 실패 도메인 공유.
- **폴백은 거동 변화.** Claude thinking 블록은 생성한 모델·대화에 바인딩되니 대화 중간 페일오버는 그걸 떨구고 가시 메시지에서 재구성해야. 요청 형태도 다름: 최신 Claude 모델은 강제 `tool_choice`에 400, GPT-6 Astra는 커스텀 `temperature` 거부. 대화 상태를 제공자 중립 형식으로 유지하고 체인 내 모든 모델에 평가 스위트 실행.
- **거부는 오류가 아니다.** HTTP 상태가 아니라 `stop_reason`으로 라우팅하고, 2026-09-24부터 예산 잡기: Anthropic이 `bio`·`frontier_llm`·`reasoning_extraction` 범주 출력 전 거부 과금.

---

### 패턴: Circuit Breaker

```python
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, reset_timeout: int = 60):
        self.failures = 0
        self.state = "closed"
        self.last_failure = None
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
    
    async def call(self, func, *args):
        if self.state == "open":
            if time.time() - self.last_failure > self.reset_timeout:
                self.state = "half-open"
            else:
                raise CircuitOpenError()
        
        try:
            result = await func(*args)
            self.failures = 0
            self.state = "closed"
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure = time.time()
            if self.failures >= self.failure_threshold:
                self.state = "open"
            raise
```

---

### 패턴: Bulkhead

컴포넌트 간 실패 격리:

```python
class BulkheadExecutor:
    def __init__(self, max_concurrent: int = 10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
    
    async def execute(self, func, *args):
        async with self.semaphore:
            return await func(*args)

# Separate bulkheads for different operations
rag_bulkhead = BulkheadExecutor(max_concurrent=20)
agent_bulkhead = BulkheadExecutor(max_concurrent=5)
```

---

## 비용 패턴

### 패턴: Token Budget

```python
class TokenBudget:
    def __init__(self, max_input: int, max_output: int):
        self.max_input = max_input
        self.max_output = max_output
    
    def constrain_input(self, messages: list[dict]) -> list[dict]:
        total_tokens = 0
        constrained = []
        
        for msg in reversed(messages):
            tokens = count_tokens(msg["content"])
            if total_tokens + tokens > self.max_input:
                break
            constrained.insert(0, msg)
            total_tokens += tokens
        
        return constrained
```

---

### 패턴: Cost Tracking Decorator

```python
def track_cost(model: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            response = await func(*args, **kwargs)
            
            # Read usage from the response itself; a global token counter is
            # wrong under concurrency. Field names vary by provider.
            u = response.usage
            cost = calculate_cost(
                model,
                uncached_input=u.input_tokens,
                cache_writes=u.cache_write_tokens,  # 1.25x input (2x for a 1-hour cache)
                cache_reads=u.cache_read_tokens,    # 0.025x to 0.1x input
                output=u.output_tokens,             # includes reasoning tokens
            )
            metrics.record("llm_cost", cost, tags={"model": model})
            
            return response
        return wrapper
    return decorator

@track_cost("gpt-6-sol")
async def generate_response(query: str):
    return await llm.generate(query)
```

각 토큰 클래스를 따로 가격 매겨라, 안 그러면 대시보드가 배수로 틀어진다: 캐시 읽기·쓰기가 다른 요율로 과금, 추론 토큰이 출력으로 과금, OpenAI가 입력이 272K 토큰을 넘으면 전체 요청을 장문 요율로 과금, 서비스 티어(Batch·Fast)·데이터 레지던시가 총액 배수. 전체 공식은 [가격과 비용](../02-model-landscape/03-pricing-and-costs.md) 참고.

---

## 면접 질문

### Q: RAG 패턴 셋과 각각 언제 쓰는지 설명하라.

**좋은 답변:**

"Naive RAG·Advanced RAG·Parent-Child Retrieval을 설명하겠다.

**Naive RAG**는 가장 단순: 쿼리 임베드·벡터 검색·top K를 프롬프트에 채우고 생성. MVP와 검색 품질이 이미 좋을 때 쓴다. 구현이 빠르나 리랭킹·쿼리 강화가 없다.

**Advanced RAG**는 여러 단계 추가: 쿼리 재작성·하이브리드 검색(시맨틱 + 키워드)·리랭킹·필터링. 정확도가 중요한 프로덕션에 쓴다. 추가 지연(리랭킹 100-200ms)이 10-15% 정밀도 향상에 값한다.

**Parent-Child Retrieval**은 정밀 매칭엔 작은 청크를 임베드하되 컨텍스트엔 더 큰 부모 청크 반환. 문서에 구조가 있고 검색 정밀도와 생성 충분 컨텍스트가 둘 다 필요할 때 쓴다.

고르는 패턴은 정확도 요건·지연 예산·문서 특성에 달렸다. 흔히 Naive RAG로 베이스라인을 잡고 Advanced RAG로 반복한다."

### Q: 프로덕션 LLM 시스템에 어떤 신뢰성 패턴을 쓰나?

**좋은 답변:**

"여러 신뢰성 계층을 구현한다:

**지수 백오프 재시도** — 일시 실패에. LLM API엔 레이트 리밋·일시 오류가 흔하다.

**멀티 제공자 폴백** — OpenAI가 문제면 자동으로 Anthropic·Google로 라우팅. LLM 인터페이스 추상화, 대화 상태를 제공자 중립 형식으로 유지(Claude thinking 블록은 다른 모델에 재생 불가), 체인 내 모든 모델에 평가 스위트 실행이 필요해 페일오버가 조용히 품질을 바꾸지 않게. 안전 거부는 따로 다룬다: 거부 stop reason의 성공 응답으로 오니 HTTP 상태가 아니라 stop reason으로 라우팅.

**서킷 브레이커** — 실패 서비스를 계속 때리지 않게. N회 실패 후 서킷을 열고 즉시 폴백, primary에 회복 시간을 준다.

**우아한 성능 저하** — 모든 제공자 실패 시. 오류 대신 캐시 응답 반환·폴백 메시지 표시·나중 처리 큐.

**벌크헤드 격리** — 한 컴포넌트 실패가 연쇄되지 않게. 에이전트 워크로드가 RAG 워크로드와 별도 스레드 풀.

**타임아웃** — 모든 수준에. LLM 호출이 멈출 수 있으니 공격적 타임아웃을 설정하고 우아하게 처리.

핵심은 실패가 일어난다고 가정하고 설계하는 것 — 안 일어나길 바라는 게 아니라."

---

## 참고 문헌

- Gao et al. "Retrieval-Augmented Generation for Large Language Models: A Survey" (2024)
- Yao et al. "ReAct: Synergizing Reasoning and Acting in Language Models" (2023)
- Microsoft Patterns for AI: https://learn.microsoft.com/azure/architecture/patterns/

---

*다음: [피해야 할 안티패턴](02-anti-patterns.md)*
