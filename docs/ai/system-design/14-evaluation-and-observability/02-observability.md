---
title: LLM 관측성
sidebar_position: 2
description: AI 애플리케이션 특성에 맞춘 관측성 — 로그·지표·트레이스 세 기둥, 계측이 조용해질 때, 핵심 지표, 품질 모니터링, 비용 추적, 알림 전략, 관측성 도구.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/14-evaluation-and-observability/02-observability.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·모델명·버전·라이선스명은 원문 표기를 유지합니다. 코드·설정은 원문 그대로 둡니다.
:::

# LLM 관측성

LLM 시스템의 관측성은 로그·지표·트레이스 세 기둥을 AI 애플리케이션 고유 특성에 맞춰 적응시켜야 한다.

## 왜 LLM 관측성은 다른가

전통 관측성은 이에 집중:
- 요청/응답 패턴
- 지연·처리량
- 오류율
- 리소스 활용

LLM 시스템은 추가:
- **품질이 일급 지표**: 빠르고 가용한 시스템이 나쁜 출력을 내면 실패 중
- **비결정성**: 같은 입력이 다른 출력 가능
- **토큰 경제학**: 비용이 복잡하게 사용량에 비례
- **멀티 컴포넌트 파이프라인**: RAG는 검색·리랭킹·생성 단계
- **주관적 정확성**: 대조할 정답이 없을 때가 많음

---

## 세 기둥

### 로깅

```python
class LLMLogger:
    def log_request(
        self,
        request_id: str,
        model: str,
        messages: list[dict],
        parameters: dict
    ):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request_id,
            "type": "llm_request",
            "model": model,
            "parameters": parameters,
            "input_tokens": self.count_tokens(messages),
            # Hash for privacy, full content in secure store
            "content_hash": self.hash_content(messages)
        }
        self.logger.info(json.dumps(log_entry))
    
    def log_response(
        self,
        request_id: str,
        response: str,
        latency_ms: float,
        tokens: dict
    ):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request_id,
            "type": "llm_response",
            "latency_ms": latency_ms,
            "input_tokens": tokens["input"],
            "output_tokens": tokens["output"],
            "ttft_ms": tokens.get("ttft_ms"),
            "content_hash": self.hash_content(response)
        }
        self.logger.info(json.dumps(log_entry))
```

**무엇을 로깅할지:**
- 상관용 요청 ID
- 모델·파라미터, 노력 수준 포함, 그리고 응답이 실제로 요청을 처리했다고 말하는 모델 ID(기본값·라우팅이 발밑에서 바뀜)
- 토큰 수를 비캐시 입력·캐시 읽기·캐시 쓰기·출력·추론 토큰으로 분할(추론은 출력으로 과금되나 응답 텍스트에 흔히 안 보임)
- 지연(TTFT·총)
- SDK·프롬프트 버전, 회귀를 변경에 연결하도록
- 콘텐츠(프라이버시 민감 시 해시)

### 지표

```python
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
llm_requests_total = Counter(
    "llm_requests_total",
    "Total LLM requests",
    ["model", "status"]
)

llm_latency_seconds = Histogram(
    "llm_latency_seconds",
    "LLM request latency",
    ["model"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

llm_ttft_seconds = Histogram(
    "llm_ttft_seconds",
    "Time to first token",
    ["model"],
    buckets=[0.05, 0.1, 0.2, 0.5, 1.0, 2.0]
)

# Token metrics
tokens_used_total = Counter(
    "tokens_used_total",
    "Total tokens consumed",
    ["model", "direction"]  # direction: uncached_input, cache_read, cache_write, output
)

# Cost metrics
llm_cost_dollars = Counter(
    "llm_cost_dollars",
    "LLM cost in dollars",
    ["model"]
)

# Quality metrics (sampled)
quality_score = Gauge(
    "llm_quality_score",
    "Sampled quality score",
    ["model", "criterion"]
)
```

### 트레이스

RAG 파이프라인의 엔드투엔드 트레이싱:

```python
from opentelemetry import trace

tracer = trace.get_tracer("rag_pipeline")

async def rag_query(query: str) -> str:
    with tracer.start_as_current_span("rag_query") as span:
        span.set_attribute("query", query)
        
        # Embedding step
        with tracer.start_as_current_span("embed_query") as embed_span:
            query_embedding = await embed(query)
            embed_span.set_attribute("embedding_dim", len(query_embedding))
        
        # Retrieval step
        with tracer.start_as_current_span("vector_search") as search_span:
            results = await vector_db.search(query_embedding, top_k=10)
            search_span.set_attribute("results_count", len(results))
            search_span.set_attribute("top_score", results[0].score if results else 0)
        
        # Reranking step
        with tracer.start_as_current_span("rerank") as rerank_span:
            reranked = await reranker.rerank(query, results)
            rerank_span.set_attribute("reranked_count", len(reranked))
        
        # Generation step
        with tracer.start_as_current_span("generate") as gen_span:
            response = await llm.generate(query, context=reranked[:5])
            gen_span.set_attribute("model", llm.model)
            gen_span.set_attribute("output_tokens", count_tokens(response))
        
        return response
```

속성 이름은 자기 것을 발명하지 말고 OpenTelemetry GenAI 시맨틱 컨벤션(`gen_ai.*`)을 따르라; LLM 특화 백엔드가 이에 뷰를 키잉하고, Langfuse v4 SDK는 기본으로 Langfuse·`gen_ai.*`·알려진 LLM 계측 스팬만 내보낸다.

### 계측이 조용해질 때

가장 위험한 관측성 실패는 건강해 보이는 조용한 대시보드다. 2026-08 주요 Python 제공자 SDK 둘이 트레이싱·테스트 도구가 후킹하는 HTTP 계층을 바꿨다: OpenAI Python SDK 3.0.0(8/12)이 `httpx2`를 기본 클라이언트로 하고 `httpx` 설치를 멈췄고, Anthropic Python SDK 1.0.0(8/20)도 `httpx2`로 이동. Anthropic 마이그레이션 가이드는 OpenTelemetry HTTPX instrumentor·Sentry httpx 통합·`respx`·`pytest-httpx`·`vcrpy`가 무언가 `httpx`를 임포트하기 전에 `httpx2.alias_httpx()`가 돌지 않으면 SDK 요청을 조용히 놓칠 수 있다고 경고한다. 결과는 프로덕션 스팬 누락·테스트의 비목(unmocked) 라이브 호출인데, 어디에도 오류가 없다.

이 실패군을 잡는 두 통제:

- **CI의 텔레메트리 카나리아.** 한 테스트가 프로덕션 클라이언트로 실제(또는 녹화된) 모델 호출을 하고 예상 스팬·토큰 수·비용 지표가 방출됐는지 단언. 모든 의존성 범프에 실행.
- **일일 조정(reconciliation).** 내 텔레메트리의 토큰·달러를 제공자 사용량·청구 내보내기와 비교. 몇 % 넘는 격차는 무언가 보고를 멈췄다는 뜻.

---

## 핵심 지표

### 운영 지표

| 지표 | 설명 | 전형 알림 임계 |
|--------|-------------|------------------------|
| 요청률 | 초당 요청 | 이상 탐지 |
| 오류율 | 실패 요청 / 총 | > 5% |
| 지연 p50 | 중앙값 응답 시간 | > 2s |
| 지연 p95 | 95퍼센타일 | > 5s |
| 지연 p99 | 99퍼센타일 | > 10s |
| TTFT | 첫 토큰까지 시간 | > 1s |
| 토큰 처리량 | 초당 토큰 | 베이스라인 미만 |

### 품질 지표

| 지표 | 설명 | 수집 방법 |
|--------|-------------|-------------------|
| 품질 점수 | LLM-as-judge 평점 | 샘플(1-5%) |
| Faithfulness | RAG 답이 컨텍스트에 근거 | 샘플 |
| Relevance | 답이 질문을 다룸 | 샘플 |
| 사용자 만족 | Thumbs up/down·평점 | 사용자 피드백 |
| 작업 완료 | 사용자가 목표 달성? | 암묵 신호 |

### 비용 지표

| 지표 | 설명 | 입도 |
|--------|-------------|-------------|
| 요청당 비용 | 평균 비용 | 모델별 |
| 일 비용 | 총 일 지출 | 전체 + 모델별 |
| 사용자 행동당 비용 | 사용자 목표 완료 비용 | 작업 유형별 |
| 해결 작업당 비용 | 지출을 실제 성공 작업 수로 나눔 | 에이전트·모델별 |
| 캐시 적중률 | 캐시 입력 토큰 / 총 입력 토큰 | 모델·프롬프트 템플릿별 |
| 토큰 효율 | 토큰당 전달 가치 | 유스케이스별 |

---

## 품질 모니터링

### 샘플링 전략

```python
class QualitySampler:
    def __init__(self, model: str, sample_rate: float = 0.05):
        self.model = model
        self.sample_rate = sample_rate
        self.judge = LLMJudge()
    
    async def maybe_evaluate(
        self,
        request_id: str,
        query: str,
        context: list[str],
        response: str
    ):
        # Sample randomly
        if random.random() > self.sample_rate:
            return
        
        # Evaluate quality
        scores = await self.judge.evaluate(
            query=query,
            context=context,
            response=response,
            criteria=["relevance", "faithfulness", "helpfulness"]
        )
        
        # Record metrics
        for criterion, score in scores.items():
            quality_score.labels(
                model=self.model,
                criterion=criterion
            ).set(score)
        
        # Store for analysis
        await self.store_evaluation(request_id, scores)
```

### 드리프트 탐지

```python
class QualityDriftDetector:
    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.baseline_scores = []
        self.current_scores = []
    
    def add_score(self, score: float):
        self.current_scores.append(score)
        
        if len(self.current_scores) >= self.window_size:
            self.check_drift()
            self.current_scores = []
    
    def check_drift(self):
        if not self.baseline_scores:
            self.baseline_scores = self.current_scores.copy()
            return
        
        # Statistical test for drift
        baseline_mean = np.mean(self.baseline_scores)
        current_mean = np.mean(self.current_scores)
        
        # Simple threshold-based detection
        drift_threshold = 0.1  # 10% degradation
        if (baseline_mean - current_mean) / baseline_mean > drift_threshold:
            self.alert_drift(baseline_mean, current_mean)
    
    def alert_drift(self, baseline: float, current: float):
        alert = {
            "type": "quality_drift",
            "baseline_score": baseline,
            "current_score": current,
            "degradation_pct": (baseline - current) / baseline * 100
        }
        self.send_alert(alert)
```

---

## 비용 추적

### 실시간 비용 계산

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Rate:
    """USD per 1M tokens."""
    input: float        # uncached input
    output: float       # output, including reasoning tokens
    cache_read: float   # input served from the prompt cache
    cache_write: float  # input written to the cache (Anthropic 5-minute tier; OpenAI bills 1.25x input)

class CostTracker:
    # Standard-tier list prices, October 2026. Load these from config in production:
    # promotions, long-context tiers, speed tiers, and residency premiums change monthly.
    PRICING = {
        "claude-opus-5-5":   Rate(input=4.00, output=20.00, cache_read=0.20, cache_write=5.00),
        "claude-sonnet-5-5": Rate(input=2.00, output=10.00, cache_read=0.20, cache_write=2.50),
        "gpt-6-sol":         Rate(input=2.00, output=10.00, cache_read=0.20, cache_write=2.50),
        "gpt-6-luna":        Rate(input=0.10, output=0.50,  cache_read=0.01, cache_write=0.125),
    }

    BUCKETS = ("uncached_input", "cache_read", "cache_write", "output")

    def track(self, model: str, usage: dict, request_id: str) -> float:
        # `usage` must already be split into the four disjoint BUCKETS. Providers
        # disagree on whether cached tokens are counted inside the input total,
        # so normalize per provider upstream or you will double-count.
        rate = self.PRICING.get(model)
        if rate is None:
            # Never price an unknown model at $0: that hides the most expensive mistakes.
            raise KeyError(f"No price configured for {model!r}")

        total_cost = (
            usage["uncached_input"] * rate.input
            + usage["cache_read"] * rate.cache_read
            + usage["cache_write"] * rate.cache_write
            + usage["output"] * rate.output
        ) / 1_000_000

        # Record metrics
        llm_cost_dollars.labels(model=model).inc(total_cost)
        for bucket in self.BUCKETS:
            tokens_used_total.labels(model=model, direction=bucket).inc(usage[bucket])

        # Log for analysis
        self.log_cost(request_id, model, usage, total_cost)

        return total_cost
```

순진한 토큰당 계산을 깨는 네 과금 규칙:

- **캐시 읽기가 에이전트 요금을 지배한다.** Anthropic 집계 Claude Code 사용 데이터(2026-09-24 공개, 벤더 보고)는 입력 대 출력 토큰 비를 324:1(3월 189:1에서 상승)로 둔다. 그 비율서 캐시 입력 가격·캐시 적중률이 출력 가격보다 비용을 훨씬 움직인다. 캐시 읽기 할인도 모델마다 다름: 대부분 Claude는 읽기를 입력의 0.1배, Opus 5.5는 0.05배, Fable 5.1은 0.025배 과금.
- **장문 티어가 전체 요청을 재가격한다.** OpenAI는 입력이 272K 토큰을 넘으면 전체 요청을 장문 요율로(GPT-6 Sol이 $2/$10서 $4/$15로) 과금하고, xAI는 Grok 4.7의 200K 이상 프롬프트에서 모든 토큰을 2배로 과금. Anthropic은 4.6 이상 모델을 1M까지 평탄 가격.
- **속도·레지던시 티어가 요율을 배수한다.** OpenAI Fast 티어는 2배(GPT-6 Astra Ultrafast는 6배)이고, 데이터 레지던시 옵션은 정가보다 약 10% 위(Anthropic `inference_geo: "us"`는 1.1배).
- **프로모션은 만료된다.** Gemini 3.8 Flash의 인트로 $0.75/$3.75는 2026-12-31까지, 2027-01-01에 $1.50/$7.50이 됨. 정가로 예산.

그러니 모든 비용 기록에 티어·리전·캐시 버킷을 태깅하고, 캐시 적중률을 지출과 같은 대시보드에 둬라.

### 비용 귀속

```python
class CostAttributor:
    def attribute_cost(
        self,
        request_id: str,
        user_id: str,
        team: str,
        use_case: str,
        cost: float
    ):
        # Store for billing and analysis
        attribution = {
            "request_id": request_id,
            "user_id": user_id,
            "team": team,
            "use_case": use_case,
            "cost": cost,
            "timestamp": datetime.utcnow()
        }
        
        self.store(attribution)
        
        # Update running totals
        self.update_user_total(user_id, cost)
        self.update_team_total(team, cost)
        
        # Check budgets
        if self.exceeds_budget(team):
            self.alert_budget_exceeded(team)
```

---

## 알림 전략

### 알림 설정

```yaml
alerts:
  # Availability
  - name: high_error_rate
    condition: error_rate > 0.05
    for: 5m
    severity: critical
    runbook: "Check provider status, verify API keys, review recent changes, fail over to a different vendor"
    
  # Latency
  - name: high_latency_p95
    condition: latency_p95 > 10s
    for: 5m
    severity: warning
    runbook: "Check model, reduce context size, verify provider status"
    
  # Cost
  - name: cost_spike
    condition: hourly_cost > 2 * rolling_avg_hourly_cost
    for: 1h
    severity: warning
    runbook: "Check for traffic spike, review recent deployments, verify caching"

  - name: cache_hit_rate_drop
    condition: cache_hit_rate < baseline_cache_hit_rate - 0.15
    for: 1h
    severity: warning
    runbook: "Diff the prompt prefix (tool order, timestamps, injected IDs), check for a model or SDK change"

  - name: served_model_changed
    condition: served_model != pinned_model
    for: 5m
    severity: warning
    runbook: "Check provider changelog and gateway routing; re-run the regression suite before accepting"
    
  # Quality
  - name: quality_degradation
    condition: avg_quality_score < 3.5 over 1h
    for: 30m
    severity: warning
    runbook: "Review recent changes, check model performance, sample responses"
    
  # Resource
  - name: rate_limit_approaching
    condition: rate_limit_usage > 0.8
    for: 15m
    severity: warning
    runbook: "Consider model routing, implement backpressure"
```

### 알림 우선순위

| 심각도 | 대응 시간 | 예시 |
|----------|---------------|----------|
| Critical | 15분 미만 | 서비스 다운, 오류율 50% 초과 |
| High | 1시간 미만 | 오류율 10% 초과, P99 30s 초과 |
| Warning | 4시간 미만 | 품질 저하, 비용 급증 |
| Info | 다음 영업일 | 추세 변화, 용량 계획 |

critical 티어는 단일 모델 실패가 아니라 벤더 전역 장애를 중심으로 계획하라. 2026-08-16\~09-29 Anthropic 상태 피드가 주요·심각 사고를 최소 12건 로그했고, OpenAI의 9/29 사고가 API·ChatGPT·Codex를 함께 약 5시간 20분 저하시켰다. 장애가 벤더 API와 코딩 에이전트를 한 번에 내릴 때 한 벤더 안에 머무는 폴백 체인은 소용없으니, 벤더 간 라우팅하고, 백업으로 돌고 있는지 알도록 폴백 비율에 알림을 걸어라.

---

## 관측성 도구

### LLM 특화 도구

| 도구 | 초점 | 적합 | 주의 |
|------|-------|----------|-------|
| LangSmith | 트레이싱·평가; trace-to-fine-tune가 2026-09-24부터 퍼블릭 베타 | LangChain·LangGraph 앱 | SaaS 트레이스의 확장 보존은 2026-09-14부터 최대 180일(자체 호스팅·BYOC 불변) |
| Langfuse | 오픈소스, OpenTelemetry 기반 트레이싱·평가 | 자체 호스팅·프라이버시 | 2026-01부터 ClickHouse 일부; Python SDK v4가 API 변경·기본으로 내보내는 스팬을 LLM 스코프로 필터 |
| Weights & Biases | 실험 추적; LLM 트레이싱·평가엔 Weave | 학습·파인튜닝도 추적하는 ML 팀 | 2025부터 CoreWeave 일부 |
| Arize Phoenix | LLM 트레이싱·평가 | 프로덕션 모니터링 | Elastic-2.0 라이선스(source-available, OSI 오픈소스 아님); Dynatrace가 2026-08 Arize를 $915M에 인수 합의, Phoenix는 계속 제공된다 함 |
| Helicone | API 프록시 로깅 | 간단한 통합 | Mintlify 인수(2026-03 발표); 채택 전 로드맵 확인 |

**기능만이 아니라 탈출을 기준으로 고르라.** 이 계층이 빠르게 통합되니 벤더 위험이 선택 기준이다. 내 코드에서 `gen_ai.*` 속성의 OpenTelemetry를 방출해 백엔드를 바꿀 수 있게 하고, 감사·컴플라이언스에 필요한 트레이스를 내가 통제하는 저장소에 두고(180일 상한의 SaaS 트레이싱 저장소는 감사 로그가 아니다), 평가 데이터셋·판정자 프롬프트를 내가 소유한 형식으로 내보내라.

### 통합 예시: Langfuse (Python SDK v4)

Langfuse Python SDK는 v3 재작성(2025-06)부터 OpenTelemetry 기반이고 2026-09 말 4.16.0. 옛 튜토리얼의 v2 패턴(`langfuse.trace()`·`trace.span()`·`trace.generation()`·`span.end()`)은 폐기; `@observe()` 데코레이터와 `start_as_current_observation()` 사용:

```python
from langfuse import get_client, observe, propagate_attributes

langfuse = get_client()  # credentials from the LANGFUSE_* environment variables

@observe(name="rag_query")  # root observation; captures input and return value
async def traced_rag_query(query: str, user_id: str, session_id: str) -> str:
    with propagate_attributes(user_id=user_id, session_id=session_id):
        with langfuse.start_as_current_observation(as_type="span", name="retrieve") as span:
            embedding = await embed(query)
            results = await vector_db.search(embedding, top_k=10)
            span.update(output={"count": len(results), "ids": [r.id for r in results]})

        context = results[:5]
        with langfuse.start_as_current_observation(
            as_type="generation",
            name="generate",
            model="claude-sonnet-5-5",
            input={"query": query, "context": [r.text for r in context]},
        ) as gen:
            response = await llm.generate(query, context=context)
            gen.update(
                output=response.text,
                usage_details={  # Langfuse's own keys; flat buckets must not overlap
                    "input": response.usage.input_tokens,
                    "output": response.usage.output_tokens,
                },
            )

    return response.text
```

알아둘 v4 거동 둘. 데코레이트된 함수는 인수·반환값을 기록하니, 임베딩·원시 문서·민감 필드를 관측 시그니처 밖에 두거나 마스킹하라. 그리고 v4는 기본으로 Langfuse·`gen_ai.*`·알려진 LLM 계측 스팬만 내보내니, 같은 프로세스의 DB·HTTP 스팬은 필터를 넓히지 않으면 안 나타난다.

---

## 면접 질문

### Q: 프로덕션 LLM 시스템에 어떤 지표를 추적하나?

**좋은 답변:**

"지표를 세 범주로 조직한다:

**운영 지표:** 어느 서비스든 기본.
- 요청률·오류율
- 지연 퍼센타일: p50·p95·p99
- 스트리밍의 첫 토큰까지 시간(TTFT)
- 가용성

**품질 지표:** LLM 관측성을 고유하게 만드는 것.
- LLM-as-judge로 샘플 품질 점수(1-5% 샘플률)
- 이진 검사(정책 위반·인용 누락)를 증류·결정 모델 판정자로 전 트래픽에 — 이제 100% 돌릴 만큼 쌈
- RAG엔: faithfulness·relevance 점수
- 사용자 피드백: thumbs up/down·명시 평점
- 측정 가능한 곳엔 작업 완료율

**비용 지표:**
- 모델별 요청당 비용
- 일/주 비용 추세
- 성공 사용자 행동당 비용
- 토큰 효율

운영 이슈(오류율 5% 초과·P95 SLA 초과)와 품질 드리프트(평균 점수 베이스라인 대비 10% 하락)에 알림을 설정. 비용 급증 알림이 폭주 사용을 잡는다.

핵심 통찰은 빠르고 가용한 LLM 시스템이 나쁜 출력을 내면 여전히 실패 중이라는 것. 품질은 일급 지표여야."

### Q: 프로덕션에서 품질 저하를 어떻게 탐지하나?

**좋은 답변:**

"여러 접근:

**지속 샘플링:** LLM-as-judge로 요청의 1-5% 평가. 전부를 평가하지 않고 품질 신호를 준다.

**드리프트 탐지:** 베이스라인 품질 분포를 유지하고 통계 검정으로 현 점수가 유의하게 드리프트할 때 탐지. 10% 저하가 경고 트리거.

**사용자 피드백:** Thumbs up/down·명시 평점. 사용자 만족의 정답.

**암묵 신호:** 작업 완료·재시도율·에스컬레이션율·세션 길이. 사용자가 더 헤매면 품질이 떨어졌을 수 있다.

**저하 탐지 시 할 것:**
1. 최근 배포·프롬프트 변경 확인
2. 특정 응답 샘플로 이슈 진단
3. 모델 특정(제공자 이슈)인지 보편인지 확인
4. 필요시 롤백 후 조사

모든 배포에 돌려 프로덕션 전 회귀를 잡는, 기대 거동 있는 쿼리의 골든 테스트셋도 유지한다."

### Q: 일상적 의존성 업그레이드 후 LLM 대시보드가 조용해졌다: 스팬 감소, 토큰 수 하락. 트래픽·제공자 청구는 불변. 무슨 일이고 어떻게 재발을 막나?

**좋은 답변:**

"청구는 불변인데 텔레메트리가 떨어졌다면 트래픽이 아니라 계측이 깨진 것. 첫 용의자는 HTTP 전송. 2026-08 OpenAI Python SDK 3.0·Anthropic Python SDK 1.0이 둘 다 `httpx2`로 옮겼고, `httpx`를 후킹하는 계측(OpenTelemetry HTTPX instrumentor·Sentry 통합·`respx`·`vcrpy` 같은 모킹 라이브러리)이 무언가 `httpx`를 임포트하기 전 `httpx2.alias_httpx()`가 돌지 않으면 SDK 호출을 조용히 안 볼 수 있다. 같은 증상의 다른 용의자: API나 기본 스팬 필터를 바꾼 트레이싱 SDK 메이저 버전, 업그레이드와 함께 온 샘플링 설정.

확인하려면 하루치 제공자 사용량 내보내기를 내 토큰 지표와 비교하고, 스테이징에서 한 호출을 해 그 스팬이 나타나는지 본다.

재발 방지:
1. **CI 텔레메트리 카나리아**: 한 테스트가 프로덕션 클라이언트로 모델 호출을 하고 스팬·토큰 수·비용 지표가 방출됐는지 단언. 모든 의존성 범프에 실행.
2. **일일 조정**: 텔레메트리 토큰·달러 대 제공자 청구 내보내기, 몇 % 넘는 격차에 알림.
3. **세트로 업그레이드**: 제공자 SDK·HTTP 클라이언트·계측 패키지를 함께 핀·함께 범프.

일반 교훈은 관측성이 자체 테스트가 필요하다는 것. 오류 없는 대시보드는 오류를 보여줄 것임을 입증했을 때만 좋은 소식이다."

---

## 참고 문헌

- OpenTelemetry: https://opentelemetry.io/
- OpenTelemetry GenAI semantic conventions: https://opentelemetry.io/docs/specs/semconv/gen-ai/
- Langfuse: https://langfuse.com/docs
- Langfuse Python SDK v3 to v4 upgrade guide: https://langfuse.com/docs/observability/sdk/upgrade-path/python-v3-to-v4
- LangSmith: https://docs.smith.langchain.com/
- OpenAI Python SDK `httpx2` notes: https://github.com/openai/openai-python/blob/main/httpx2.md

---

*다음: [벤치마크와 리더보드](03-benchmarks-and-leaderboards.md)*
