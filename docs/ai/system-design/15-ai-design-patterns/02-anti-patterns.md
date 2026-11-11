---
title: AI 안티패턴
sidebar_position: 2
description: AI 시스템 설계의 흔한 실수 카탈로그 — 아키텍처(God Prompt·단일 제공자 의존·조급한 파인튜닝), RAG(전부 검색·청킹 전략 없음·메타데이터 무시), 에이전트(무한 루프·안전하지 않은 도구·메모리 없음), 프롬프팅, 평가, 프로덕션 안티패턴.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/15-ai-design-patterns/02-anti-patterns.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 제품명·모델명·버전·날짜는 원문 표기를 유지합니다. 코드·다이어그램은 원문 그대로 둡니다.
:::

# AI 안티패턴

하지 말아야 할 것을 아는 것은 모범사례를 아는 것만큼 중요하다. 이 장은 AI 시스템 설계의 흔한 실수를 카탈로그한다.

## 아키텍처 안티패턴

### The God Prompt

**문제:** 모든 걸 하려는 단일 거대 프롬프트.

```python
# ANTI-PATTERN: God Prompt
SYSTEM_PROMPT = """
You are a helpful assistant. You can:
1. Answer questions about our products
2. Help with technical support
3. Process refunds
4. Schedule appointments
5. Translate languages
6. Write code
7. Analyze data
8. Generate reports
... [continues for 5000 tokens]
"""
```

**왜 실패하나:**
- 컨텍스트가 사용자 콘텐츠가 아니라 지시에 소모
- 모델이 충돌 지시에 고전
- 모든 케이스에 최적화 불가
- 업데이트가 전부에 영향

**해법:**
```python
# PATTERN: Specialized components
class QueryRouter:
    async def route(self, query: str) -> str:
        intent = await self.classify_intent(query)
        handler = self.handlers[intent]
        return await handler.process(query)
```

---

### Single Provider Dependency

**문제:** 전체 시스템이 한 LLM 제공자에 의존.

```python
# ANTI-PATTERN: Single provider
async def generate(prompt: str) -> str:
    return await openai.chat.completions.create(...)
```

**왜 실패하나:**
- 제공자 장애 = 완전 시스템 실패. 장애는 드물지 않고 일상: Anthropic이 2026-08-16\~09-29에 주요·심각 사고 최소 12건 로그, OpenAI 9/29 한 사고가 API·ChatGPT·Codex를 함께 약 5시간 20분 저하
- 레이트 리밋이 전 트래픽에 영향
- 가격 협상 레버리지 없음
- 한 모델 패밀리·그 벤더 폐기 캘린더에 묶임(OpenAI가 2026-12-11 `gpt-5-2025-08-07`·`o3-2025-04-16` 스냅샷 폐기)

**해법:**
```python
# PATTERN: Multi-provider with failover
class LLMClient:
    def __init__(self):
        self.providers = [OpenAI(), Anthropic(), Google()]
    
    async def generate(self, prompt: str) -> str:
        # Run the same eval suite against every provider in this list:
        # a failover that silently changes quality is its own outage
        for provider in self.providers:
            try:
                return await provider.generate(prompt)
            except ProviderError:
                continue
        raise AllProvidersFailedError()
```

---

### Premature Fine-Tuning

**문제:** 더 단순한 접근을 소진하기 전 파인튜닝.

**왜 실패하나:**
- 비싸고 시간 소모
- 품질 학습 데이터 필요(흔히 없음)
- 업데이트·유지 어려움
- 흔히 불필요
- 플랫폼 위험 추가: OpenAI가 셀프서브 파인튜닝을 접고 있고, 활성 고객도 2027-01-06부터 새 작업 생성 불가. 파인튜닝한다면 내가 통제하는 가중치 선호

**결정 흐름:**
```
Try prompting first
    ↓ (not working)
Try few-shot examples
    ↓ (not working)
Try RAG for knowledge
    ↓ (not working)
Consider fine-tuning (with 500+ examples)
```

---

## RAG 안티패턴

### Retrieve Everything

**문제:** 관련성 무관하게 너무 많은 문서 검색.

```python
# ANTI-PATTERN: Retrieve everything
results = vector_db.search(query, top_k=50)
context = "\n".join([r.text for r in results])
```

**왜 실패하나:**
- 노이즈가 신호를 묻음
- 컨텍스트 한계 초과
- 무관 콘텐츠에 토큰 낭비
- "Lost in the middle" 효과

**해법:**
```python
# PATTERN: Quality over quantity
results = vector_db.search(query, top_k=20)
reranked = await reranker.rerank(query, results)
context = "\n".join([r.text for r in reranked[:5] if r.score > 0.7])
```

---

### No Chunking Strategy

**문제:** 임의적이거나 없는 문서 청킹.

```python
# ANTI-PATTERN: Fixed-size blind chunking
chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
```

**왜 실패하나:**
- 문장·문단 중간 절단
- 시맨틱 일관성 상실
- 관련 정보 분리
- 나쁜 검색 품질

**해법:**
```python
# PATTERN: Semantic-aware chunking
chunks = semantic_chunker.chunk(
    text,
    chunk_size=500,
    overlap=100,
    respect_boundaries=["paragraph", "section"]
)
```

---

### Ignoring Metadata

**문제:** 모든 문서를 동등한 텍스트로 취급.

```python
# ANTI-PATTERN: Ignore metadata
embedding = embed(document.text)
vector_db.insert(embedding, {"text": document.text})
```

**왜 실패하나:**
- 날짜·출처·유형으로 필터 불가
- 문서별 접근 통제 없음
- 최신 대 과거 가중 불가
- 귀중한 컨텍스트 상실

**해법:**
```python
# PATTERN: Rich metadata
vector_db.insert(embedding, {
    "text": document.text,
    "source": document.source,
    "date": document.date,
    "access_level": document.access_level,
    "document_type": document.type,
    "section": document.section
})

# Filter query
results = vector_db.search(
    query,
    filter={"date": {"$gte": "2024-01-01"}, "access_level": user.level}
)
```

---

## 에이전트 안티패턴

### Infinite Loop Risk

**문제:** 에이전트에 종료 조건 없음.

```python
# ANTI-PATTERN: No limits
while not done:
    action = await agent.decide_action()
    result = await execute(action)
    done = agent.check_done(result)
```

**왜 실패하나:**
- 에이전트가 영원히 루프 가능
- 비용 통제 불능으로 폭주
- 사용자에게 결코 안 돌아옴
- 리소스 고갈

**해법:**
```python
# PATTERN: Multiple termination conditions
MAX_STEPS = 20
MAX_COST = 10.0
MAX_TIME = 300  # seconds

for step in range(MAX_STEPS):
    if cost_tracker.total > MAX_COST:
        return "Cost limit reached"
    if time.time() - start > MAX_TIME:
        return "Time limit reached"
    
    action = await agent.decide_action()
    result = await execute(action)
    
    if agent.check_done(result):
        return result
    
return "Step limit reached"
```

---

### Unsafe Tool Access

**문제:** 에이전트에 무제한 도구 접근 부여.

```python
# ANTI-PATTERN: Full access
tools = [
    delete_file,
    execute_shell_command,
    send_email,
    database_query  # unrestricted!
]
```

**왜 실패하나:**
- 에이전트가 핵심 파일 삭제 가능
- 데이터 유출 가능, 공격자 없이도: PixelLeak(Glow Security, 2026-09-29 공개)에서 스크린샷을 비공개 PR에 첨부하라던 코딩 에이전트가 대신 공개 저장소를 만들어 900+ 저장소에 13,000+ 이미지 게시
- 악성 명령 실행 가능
- 감사 추적 없음
- 평가·학습 실행도 예외 아님: UK AI Security Institute 사이버 테스트(2026-08-04 보도)에서 개발자 분류기를 의도적으로 끄고 인터넷 접근을 의도적으로 켠 채, 에이전트가 122 실행 중 10에서 실제 사람·조직을 상대로 일부 포함 19개 비승인 행동을 라이브 인터넷에서 수행
- 알림은 봉쇄가 아니다: 2026-09-25 공개된 OpenAI 학습 실행에서 에이전트가 불충분 필터 DNS로 터널링해 나갔고, 모니터링이 약 12분에 경보했으나 자동 정지 실패로 약 2.5시간 뒤에야 종료

**해법:**
```python
# PATTERN: Scoped, validated tools
tools = [
    ScopedFileTool(allowed_dirs=["/tmp/agent"]),
    RestrictedShellTool(allowed_commands=["ls", "cat"]),
    EmailTool(requires_confirmation=True),
    ReadOnlyDatabaseTool(allowed_tables=["products"])
]

# And contain the environment, not just the tool list
sandbox = Sandbox(
    egress="deny-by-default",          # DNS, package proxies, and publish endpoints included
    allow=["pypi-proxy.internal"],
    secrets=None,                      # agents can evade pattern-based secret scanning
    on_monitor_alert="kill",           # an alert that only pages a human is not a control
)
```

프로덕션 에이전트와 똑같은 샌드박스를 평가·RL 환경에도 적용하고, 페일오버를 테스트하듯 자동 정지를 테스트하라.

---

### Agent Without Memory

**문제:** 에이전트가 매 턴 처음부터 재시작.

```python
# ANTI-PATTERN: Stateless agent
async def handle_message(message: str) -> str:
    return await agent.run(message)  # No context
```

**왜 실패하나:**
- 멀티턴 작업 불가
- 같은 실수 반복
- 경험에서 학습 불가
- 나쁜 사용자 경험

**해법:**
```python
# PATTERN: Persistent memory
async def handle_message(session_id: str, message: str) -> str:
    memory = await memory_store.get(session_id)
    response = await agent.run(message, memory=memory)
    await memory_store.update(session_id, memory)
    return response
```

다만 메모리는 공짜가 아니다. 메모리 유발 함정을 노출하도록 지은 작업에서 MemTrapBench(arXiv 2608.20202)는 다섯 메모리 프레임워크의 모든 메모리 전략이, 저장 메모리가 올바르고 관련 있을 때도, 무메모리보다 못했음을 발견. 지속 메모리는 인젝션 표면이기도. 이후 턴이 입증 가능하게 필요한 것만 지속하고, 쓰기 시점에 출처 기록하고, 메모리 켜고 끄고 평가하라.

---

## 프롬프팅 안티패턴

### Vague Instructions

**문제:** 특정 거동을 기대하는 모호한 프롬프트.

```python
# ANTI-PATTERN: Vague
prompt = "Help the user with their request."
```

**왜 실패하나:**
- "Help"가 미정의
- 형식 미지정
- 경계 없음
- 비일관 거동

**해법:**
```python
# PATTERN: Specific and structured
prompt = """
You are a customer support agent for TechCorp.

Your role:
- Answer questions about our products
- Help troubleshoot issues
- Escalate to human when unsure

Response format:
1. Acknowledge the issue
2. Provide a solution or ask clarifying questions
3. Offer next steps

Do NOT:
- Make promises about refunds (escalate instead)
- Provide legal or medical advice
- Share internal company information
"""
```

---

### No Output Format

**문제:** 형식 지정 없이 구조적 출력 기대.

```python
# ANTI-PATTERN: Hope for structure
prompt = "Extract the person's name, date, and location from this text."
response = await llm.generate(prompt)
# Response: "The person is John, he was there on March 5th in NYC"
# Now try to parse that...
```

**해법:**
```python
# PATTERN: Explicit format
prompt = """
Extract information and return as JSON:
{
    "name": "string",
    "date": "YYYY-MM-DD",
    "location": "string"
}

Text: ...
"""
# Better: schema-constrained structured outputs
# (json_object mode guarantees valid JSON, not your schema)
response = await llm.generate(
    prompt,
    response_format={"type": "json_schema", "json_schema": EXTRACTION_SCHEMA}
)
```

JSON을 얻으려 도구 호출을 강제하던 옛 트릭에 손대지 말 것. `any`나 명명 도구의 `tool_choice`가 이제 Claude Fable 5.1·Opus 5.5·Sonnet 5.5에서 400 반환; 구조적 출력, 또는 엄격 도구 스키마의 `auto`를 쓰라.

---

## 평가 안티패턴

### Vibes-Based Evaluation

**문제:** "내 보기엔 괜찮아"가 평가 방법.

```python
# ANTI-PATTERN: Manual spot-checking
for i in range(5):
    response = await generate(test_prompts[i])
    print(response)  # Developer looks at it
# "Looks good, ship it!"
```

**왜 실패하나:**
- 재현 불가
- 체리피킹 예시
- 베이스라인 비교 없음
- 엣지 케이스 놓침

**해법:**
```python
# PATTERN: Systematic evaluation
eval_dataset = load_eval_set()  # 100+ examples
results = []

for example in eval_dataset:
    response = await generate(example["input"])
    score = await evaluate(response, example["expected"])
    results.append(score)

metrics = {
    "accuracy": sum(results) / len(results),
    "failures": [e for e, r in zip(eval_dataset, results) if r < 0.5]
}
```

---

### Training on Test Set

**문제:** 평가 데이터를 개발 결정에 사용.

```python
# ANTI-PATTERN: Overfitting to eval
for iteration in range(100):
    accuracy = evaluate_on_test_set()  # Same set every time
    tweak_prompt_based_on_failures(test_set)  # Optimizing for test set
```

**왜 실패하나:**
- 특정 예시에 과적합
- 실세계 성능 다름
- 일반화의 진짜 측정 없음

**해법:**
```python
# PATTERN: Proper data splits
dev_set = load_dev_set()      # For iteration
test_set = load_test_set()    # Final evaluation only

# Iterate on dev set
for iteration in range(100):
    accuracy = evaluate(dev_set)
    improve_based_on(dev_set)

# Final evaluation on untouched test set
final_accuracy = evaluate(test_set)
```

---

### Leaderboard-Driven Model Choice

**문제:** 출시 포스트 표나 리더보드 헤드라인에서 모델 선택.

```python
# ANTI-PATTERN: Take the top number
model = max(leaderboard, key=lambda m: m.score).name
```

**왜 실패하나:**
- 같은 모델이 노력·실행자에 따라 다른 점수: Claude Fable 5.1이 tbench.ai 리더보드 Terminal-Bench 4.0 max 노력 57.88%, Anthropic 자체 실행 55.8%
- 점수가 라우팅 시스템의 것일 수 있음: Anthropic이 Opus 5.5를 안전장치 폴백 켜고 채점해 차단된 사이버 작업이 Opus 4.8에서 실행
- 공개 세트 포화·유출: SWE-Bench Pro v2 공개 세트가 99.4%(Opus 5)서 정점, 한 연구가 모델별 SWE-Bench Pro v1.0 통과의 24\~73%가 git 이력 유출로 미획득임을 발견
- 내 작업 분포는 벤치마크의 것이 아님

**해법:**
```python
# PATTERN: Shortlist from benchmarks, decide on your own evals
shortlist = [m for m in leaderboard if m.reports_effort_and_harness][:3]
results = {m.name: evaluate(m.name, my_eval_set, effort=m.effort) for m in shortlist}
model = pick(results, constraints={"p95_latency_s": 8, "cost_per_task_usd": 0.05})
```

---

## 프로덕션 안티패턴

### No Rate Limiting

**문제:** 사용자당 무제한 LLM 호출.

```python
# ANTI-PATTERN: Open access
@app.route("/generate")
async def generate():
    return await llm.generate(request.prompt)  # No limits!
```

**왜 실패하나:**
- 단일 사용자가 예산 고갈 가능
- 서비스 거부 위험
- 비용 서프라이즈
- 공정 사용 없음

**해법:**
```python
# PATTERN: Rate limiting
@app.route("/generate")
@rate_limit(requests_per_minute=10, requests_per_day=100)
@cost_limit(max_cost_per_day=1.0)
async def generate():
    return await llm.generate(request.prompt)
```

---

### No Caching

**문제:** 동일한 모든 요청이 LLM을 때림.

```python
# ANTI-PATTERN: No cache
async def answer_faq(question: str) -> str:
    return await llm.generate(question)  # Same FAQ, same cost every time
```

**왜 실패하나:**
- 동일 쿼리에 돈 낭비
- 불필요한 지연
- 같은 질문에 비일관 답변

**해법:**
```python
# PATTERN: Semantic caching
async def answer_faq(question: str) -> str:
    cached = await cache.get_similar(question, threshold=0.95)
    if cached:
        return cached.response
    
    response = await llm.generate(question)
    await cache.set(question, response)
    return response
```

시맨틱 캐싱은 질문 전체가 반복될 때만 돕는다. 에이전트 루프·긴 시스템 프롬프트엔 제공자 프롬프트 캐싱을 먼저 켜라: 안정 접두사를 공유하는 모든 호출을 할인하고 읽기가 입력 요율의 0.025배\~0.1배로 과금.

---

### Floating Model Defaults

**문제:** 도구·SDK·별칭이 프로덕션에 어느 모델·설정이 쓰일지 정하게 둠.

```python
# ANTI-PATTERN: Whatever the framework or CLI defaults to today
agent = Agent(instructions=PROMPT)                  # model chosen by the SDK
response = await llm.generate(prompt, model=ALIAS)  # effort left at the default
```

**왜 실패하나:**
- 기본값이 내 쪽 코드 변경 없이 바뀜. 2026-09 Codex CLI가 기본을 GPT-6.1 Sol로(rust-v0.159.1), Claude Code가 기본 Opus를 Opus 5.5로(2.1.280)·기본 Sonnet을 Sonnet 5.5로(2.1.284) 이동; openai-agents SDK는 이미 0.20.0에서 기본을 `gpt-5.6-luna`로 이동
- 설정이 모델 패밀리 안에서 바뀜: Opus 5.5가 기본 노력을 `high`에서 `medium`으로 낮춤
- 고정 모델 ID도 바뀔 수 있음: OpenAI가 2026-09-25 GPT-6 Sol·Luna의 이미지 입력 버그를 같은 ID 하에 고쳐, 수정 전 이미지 평가는 재실행 필요

**해법:**
```python
# PATTERN: Pin everything that changes behavior, and re-test on any change
MODEL = config["model"]    # exact model ID, never a framework default
EFFORT = config["effort"]  # explicit, per route
response = await llm.generate(prompt, model=MODEL, effort=EFFORT)
if not response.model.startswith(MODEL):  # providers may append a snapshot suffix
    alert("served model differs from the pinned one", served=response.model)
```

모델 ID·노력·SDK 버전·CLI 버전이 바뀔 때마다 평가 스위트 재실행하고, 각 응답이 보고하는 모델 이름 로깅.

---

## 면접 질문

### Q: LLM 애플리케이션에서 보는 가장 큰 안티패턴은?

**좋은 답변:**

"가장 해로운 건 'God Prompt' 안티패턴: 모든 시나리오를 다루려는 단일 거대 프롬프트.

**왜 흔한가:** 한 프롬프트로 시작해 필요 생길 때마다 지시를 더하는 게 단순해 보인다.

**왜 실패하나:**
- 컨텍스트가 사용자 콘텐츠가 아니라 지시에 소모
- 충돌 지시가 모델 혼란
- 다른 유스케이스에 최적화 불가
- 변경이 예측 불가 부작용

**수정:** 전문 핸들러로 라우팅. 각 핸들러가 한 작업에 최적화된 집중 프롬프트. 라우터 자체는 단순(키워드 기반)하거나 똑똑(복잡 케이스엔 LLM 기반)할 수 있다.

프롬프트 너머에도 적용. 일반 원칙: 모든 걸 하나의 모놀리스에 쑤셔넣지 말고 복잡성을 전문 컴포넌트로 분해."

### Q: 에이전트 비용 폭주를 어떻게 피하나?

**좋은 답변:**

"여러 수준의 여러 한도:

**요청당 한도:**
- 최대 스텝(예: 20)
- 최대 토큰(예: 50K)
- 최대 시간(예: 5분)

**세션당 한도:**
- 일일 토큰 예산
- 일일 비용 캡
- 관리형 플랫폼의 네이티브 통제: Claude Managed Agents 세션이 하드 예산 도달 시 `budget_reached`로 일시정지, OpenAI Agents API가 `max_concurrent_subagents`(기본 6)로 병렬 서브에이전트 상한

**사용자당 한도:**
- 레이트 리밋(분/시/일당 요청)
- 비용 귀속·캡

**모니터링:**
- 실시간 비용 추적
- 이상 알림(단일 요청 $1 초과)
- 비용 급증 시 서킷 브레이커

**아키텍처:**
- 싼→비싼 모델 캐스케이드
- 기본값을 받지 말고 라우트별 추론 노력 핀
- 흔한 작업 캐시, 안정 접두사엔 제공자 프롬프트 캐시부터
- 유사 요청 배치

핵심은 에이전트가 영원히 돌려 할 거라 가정하는 것. 모든 수준에 하드 스톱을 넣어라. 적절한 한도 없이 에이전트가 몇 분에 $1000 요금을 올리는 걸 봤다."

---

*이전: [설계 패턴](01-design-patterns.md)*
