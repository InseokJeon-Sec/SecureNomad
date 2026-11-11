---
title: 신뢰성 패턴
sidebar_position: 3
description: 기본 재시도 로직 너머의 프로덕션 LLM 신뢰성 패턴 — 재시도(백오프·오류 분류·안전 거부 처리), 서킷 브레이커, 벌크헤드, 타임아웃 전략, 우아한 성능 저하, 멀티 제공자 페일오버.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/13-reliability-and-safety/03-reliability-patterns.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·모델명·버전·API 필드명은 원문 표기를 유지합니다. 코드는 원문 그대로 둡니다.
:::

# 신뢰성 패턴

프로덕션 LLM 시스템은 기본 재시도 로직 너머의 신뢰성 패턴이 필요하다. 이 장은 견고한 AI 애플리케이션을 짓는 고급 패턴을 다룬다.

## 신뢰성 과제

### LLM 고유 실패 모드

| 실패 모드 | 원인 | 영향 |
|--------------|-------|--------|
| 레이트 리밋 | 쿼터 초과, 트래픽이 너무 빨리 증가 | 요청 거절 |
| 지출 캡 | 월 예산 한도 도달 | 캡이 리셋·상향되기 전엔 재시도로 안 풀리는 429 |
| 타임아웃 | 긴 생성, 네트워크 문제 | 느림/실패 응답 |
| 제공자 장애 | 인프라 문제 | 완전 실패 |
| 품질 저하 | 모델 업데이트(때로 같은 모델 ID 하에서)·SDK 기본 모델 변경·부하 | 오류 없이 나빠진 출력 |
| 모델 폐기 | 모델 ID 예정 종료(예: `claude-sonnet-4-5-20250929`가 2026-11-30) | 사전 공지된 날짜의 하드 실패(Anthropic 최소 60일 전 공지, OpenAI는 GA 모델 6개월·프리뷰는 2주까지) |
| 안전 거부 | 제공자 분류기가 요청 거절 | 성공처럼 보이는 빈 콘텐츠 HTTP 200 |
| 컨텍스트 오버플로 | 입력이 너무 큼 | 요청 실패 |
| 깨진 출력 | 생성 오류 | 파싱 실패 |

이 중 두 행은 아무것도 throw하지 않아 놓치기 쉽다. **조용한 품질 변화**는 안정 모델 ID 하에서 일어난다: GPT-6 Sol·GPT-6 Luna가 2026-09-22 이미지 인코딩 버그와 함께 출시돼 이미지 이해·컴퓨터 사용을 저하시켰고, OpenAI가 9/25 새 스냅샷 없이 고치며 이미지 입력 고객에게 평가 재실행을 알렸다. 모델 ID 핀은 이름을 핀할 뿐 서빙 스택을 핀하지 않는다. 기본값도 움직인다: openai-agents 0.20.0(2026-08-11)이 `gpt-5.6-luna`를 암묵 기본 모델로 삼아, 모델을 지정 안 한 에이전트가 일상적 의존성 범프에 모델이 바뀌었다. 어디서나 모델을 명시하라. **안전 거부**는 최신 Claude 모델에서 `stop_reason: "refusal"`이 담긴 성공 응답으로 오니, 예외에 키잉된 재시도 로직은 결코 못 본다(아래 안전 거부 처리 절 참고).

### 신뢰성 목표

| 티어 | 가용성 | 지연 p99 | 예시 |
|------|--------------|-------------|----------|
| Critical | 99.99% | 3초 미만 | 결제 처리 |
| Standard | 99.9% | 10초 미만 | 고객 지원 |
| Best effort | 99% | 30초 미만 | 백그라운드 작업 |

---

## 재시도 패턴

### 지터를 더한 지수 백오프

```python
import random
import asyncio
from typing import TypeVar, Callable

T = TypeVar("T")

class RetryConfig:
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: float = 0.5
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
    
    def get_delay(self, attempt: int) -> float:
        delay = min(
            self.base_delay * (self.exponential_base ** attempt),
            self.max_delay
        )
        # Add jitter to prevent thundering herd
        jitter_range = delay * self.jitter
        delay += random.uniform(-jitter_range, jitter_range)
        return max(0, delay)


async def retry_with_backoff(
    func: Callable[[], T],
    config: RetryConfig,
    retryable_exceptions: tuple = (Exception,)
) -> T:
    last_exception = None
    
    for attempt in range(config.max_retries + 1):
        try:
            return await func()
        except retryable_exceptions as e:
            last_exception = e
            
            if attempt == config.max_retries:
                break
            
            delay = config.get_delay(attempt)
            await asyncio.sleep(delay)
    
    raise last_exception
```

### 재시도 가능 vs 불가능 오류

상태 **그리고** 오류 코드로 분류하라. 같은 상태가 이제 다른 뜻이다: 2026-09-02부터 OpenAI는 트래픽이 너무 빨리 증가하면 코드 `slow_down`의 429를, 일시 모델 과부하엔 503을 반환하고 둘 다 `Retry-After`를 담을 수 있다. Anthropic은 가속 한도에 429를 반환하나, 월 지출 캡은 `error_code: enforced_spend_limit_reached`·`retry-after` 없는 429이고, 캡이 리셋되거나 관리자가 상향하기 전엔 아무것도 안 푼다. 내가 스스로 설정한 더 낮은 지출 한도는 또 다르다: 지정 사용 한도에 도달했다는 메시지의 400 `invalid_request_error`를 반환하니, 아래 같은 분류기는 조직 전역 중단을 잘못된 요청으로 분류한다. 429·5xx만이 아니라 400의 급증에도 알림을 걸어라.

```python
from enum import Enum

class RetryAction(Enum):
    BACKOFF = "backoff"                      # same provider, exponential backoff + jitter
    FAILOVER = "failover"                    # next provider in the chain
    FAILOVER_AND_PAGE = "failover_and_page"  # will not clear on its own; a human must act
    DO_NOT_RETRY = "do_not_retry"            # fix the request

class LLMRetryPolicy:
    @staticmethod
    def classify(status: int, code: str | None) -> RetryAction:
        if status == 429 and code == "enforced_spend_limit_reached":
            return RetryAction.FAILOVER_AND_PAGE   # Anthropic spend cap
        if status == 429:
            return RetryAction.BACKOFF             # includes OpenAI "slow_down": ramp gently
        if status in (500, 502, 503, 504, 529):
            return RetryAction.BACKOFF             # overload or server error; fail over if it persists
        if status == 404:
            return RetryAction.FAILOVER            # retired or wrong model ID; then fix the registry
        return RetryAction.DO_NOT_RETRY            # auth, bad request, context too long

    @staticmethod
    def delay(retry_after_header: str | None, computed_backoff: float) -> float:
        # Never retry sooner than the provider asked
        if retry_after_header:
            return max(float(retry_after_header), computed_backoff)
        return computed_backoff
```

타임아웃·연결 오류는 `BACKOFF`로 매핑. `Retry-After` 무시가 가장 흔한 백오프 버그, 모든 429를 똑같이 다루는 게 두 번째.

### 안전 거부 처리

거부는 전송 오류가 아니라, 위의 어떤 재시도 기계도 못 본다. Claude Fable 5.1·5, Opus 5.5·5, Sonnet 5.5에서 안전 분류기 거절은 HTTP 200·`stop_reason: "refusal"`·빈 콘텐츠·`stop_details.category`(`cyber`·`bio`·`frontier_llm`·`reasoning_extraction`·`general_harms`·`null`)를 반환한다. 같은 모델에 같은 요청을 재시도하는 건 낭비니, 대신 라우팅하라:

- **서버측 폴백**(베타, Claude API): `server-side-fallback-2026-07-01` 헤더의 `fallbacks: "default"`가 그 범주에 Anthropic이 권장하는 모델로, 또는 모델 허용 목록에서 지정한 최대 3개 대상으로 재시도(Fable 5.1 허용 대상은 Opus 4.8·Opus 5). 분류기 거절에만 발동; 레이트 리밋·과부하는 그대로 온다. Bedrock·Google Cloud·Foundry에선 불가하며 Anthropic SDK의 거부 폴백 미들웨어가 클라이언트측 재시도를 하고, `fallbacks`를 설정한 Message Batches 항목은 오류 결과로 오니 거부된 배치 항목은 직접 재시도하라.
- **폴백 모델의 레이트 리밋을 크게 잡아라.** 폴백 모델이 레이트 리밋·과부하면 API가 시도를 건너뛰고 원래 거부를 반환하며, 직접 재시도 힌트로 `stop_details.recommended_model`을 준다. 각 시도가 자기 모델 한도에 계산되니 거부량이 폴백 모델 쿼터에 떨어진다.
- **끈끈한 라우팅을 예상하라.** 한 대화가 폴백된 뒤엔 `fallbacks`를 포함한 그 대화의 이후 요청이 곧장 폴백 모델로 간다(라우팅은 약 1시간 유지·best-effort라 언제든 요청 모델이 다시 시도될 수 있음). 모델별 트래픽·품질 대시보드가 그에 맞춰 이동하니, 요청 모델이 답했다고 가정하지 말고 응답의 `model` 필드·`usage.iterations`를 읽어라.
- **`reasoning_extraction`엔 권장 폴백이 없다.** 프롬프트가 추론을 쓰라고 할 때(`<thinking>` 섹션, JSON `reasoning` 필드) 발동. 프롬프트를 바꿔라; 재시도 금지.
- **거부는 돈·쿼터가 든다.** 2026-09-24부터 `bio`·`frontier_llm`·`reasoning_extraction`의 출력 전 거부가 과금되고 모든 거부가 레이트 리밋에 계산된다.

거부는 제공자 건강에 대해 아무 말도 안 하니, 서킷 브레이커를 걸어선 안 된다. 범주별 자체 지표로 추적하라; 급증은 보통 장애가 아니라 프롬프트·트래픽 믹스·제공자 안전장치 변화다. [가드레일](01-guardrails.md)은 가드레일 쪽을, [게이트웨이 장](../11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md)은 전체 응답 분류 흐름을 다룬다.

---

## 서킷 브레이커

### 구현

```python
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery

@dataclass
class CircuitBreakerConfig:
    failure_threshold: int = 5
    recovery_timeout: timedelta = timedelta(seconds=30)
    half_open_max_calls: int = 3
    success_threshold: int = 2  # Successes needed to close

class CircuitBreaker:
    def __init__(self, name: str, config: CircuitBreakerConfig):
        self.name = name
        self.config = config
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: datetime | None = None
        self.half_open_calls = 0
    
    def can_execute(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has passed
            if self._recovery_timeout_elapsed():
                self._transition_to_half_open()
                self.half_open_calls += 1
                return True
            return False
        
        if self.state == CircuitState.HALF_OPEN:
            # Allow a limited number of probe calls in half-open state
            if self.half_open_calls < self.config.half_open_max_calls:
                self.half_open_calls += 1
                return True
            return False
        
        return False
    
    def record_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self._transition_to_closed()
        else:
            self.failure_count = 0
    
    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.state == CircuitState.HALF_OPEN:
            self._transition_to_open()
        elif self.failure_count >= self.config.failure_threshold:
            self._transition_to_open()
    
    def _transition_to_open(self):
        self.state = CircuitState.OPEN
        self.success_count = 0
    
    def _transition_to_half_open(self):
        self.state = CircuitState.HALF_OPEN
        self.half_open_calls = 0
        self.success_count = 0
    
    def _transition_to_closed(self):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
    
    def _recovery_timeout_elapsed(self) -> bool:
        if self.last_failure_time is None:
            return True
        return datetime.now() - self.last_failure_time >= self.config.recovery_timeout
```

### LLM 클라이언트와 함께 사용

```python
class ResilientLLMClient:
    def __init__(self):
        self.circuit_breakers = {
            "openai": CircuitBreaker("openai", CircuitBreakerConfig()),
            "anthropic": CircuitBreaker("anthropic", CircuitBreakerConfig()),
        }
    
    async def generate(self, prompt: str, provider: str = "openai") -> str:
        cb = self.circuit_breakers[provider]
        
        if not cb.can_execute():
            raise CircuitOpenError(f"Circuit breaker open for {provider}")
        
        try:
            result = await self._call_provider(provider, prompt)
            cb.record_success()
            return result
        except RetryableError as e:
            cb.record_failure()
            raise
```

**무엇을 실패로 셀지 정하라.** 5xx·과부하·타임아웃·백오프로도 안 풀리는 429를 센다. 400류 오류·안전 거부는 세지 말 것: 제공자 건강이 아니라 요청을 기술하는 것이라, 세면 나쁜 프롬프트 템플릿 하나가 모두의 브레이커를 연다. 지출 캡 429는 반대 방향의 예외: 30초마다 탐침하지 말고 캡이 리셋·상향될 때까지 브레이커를 강제로 열어 둬라.

---

## 벌크헤드 패턴

### 리소스 격리

```python
import asyncio
from contextlib import asynccontextmanager

class Bulkhead:
    """
    Isolate resources to prevent cascade failures.
    """
    
    def __init__(
        self,
        name: str,
        max_concurrent: int,
        max_queued: int = 100
    ):
        self.name = name
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.queue_semaphore = asyncio.Semaphore(max_queued)
    
    @asynccontextmanager
    async def acquire(self, timeout: float = 30.0):
        # Check queue capacity
        if not self.queue_semaphore.locked():
            await self.queue_semaphore.acquire()
        else:
            raise BulkheadFullError(f"Bulkhead {self.name} queue full")
        
        try:
            # Wait for execution slot
            acquired = await asyncio.wait_for(
                self.semaphore.acquire(),
                timeout=timeout
            )
            self.queue_semaphore.release()
            
            try:
                yield
            finally:
                self.semaphore.release()
        except asyncio.TimeoutError:
            self.queue_semaphore.release()
            raise BulkheadTimeoutError(f"Bulkhead {self.name} timeout")


class BulkheadedLLMClient:
    def __init__(self):
        # Separate bulkheads for different workloads
        self.bulkheads = {
            "realtime": Bulkhead("realtime", max_concurrent=50),
            "batch": Bulkhead("batch", max_concurrent=200),
            "critical": Bulkhead("critical", max_concurrent=10)
        }
    
    async def generate(
        self,
        prompt: str,
        priority: str = "realtime"
    ) -> str:
        bulkhead = self.bulkheads[priority]
        
        async with bulkhead.acquire():
            return await self._call_llm(prompt)
```

---

## 타임아웃 전략

### 계층형 타임아웃

```python
class TimeoutConfig:
    def __init__(
        self,
        connection_timeout: float = 5.0,
        first_token_timeout: float = 15.0,  # set per model and effort level
        read_timeout: float = 30.0,
        total_timeout: float = 60.0
    ):
        self.connection_timeout = connection_timeout
        self.first_token_timeout = first_token_timeout
        self.read_timeout = read_timeout
        self.total_timeout = total_timeout


class TimeoutManager:
    def __init__(self, config: TimeoutConfig):
        self.config = config
    
    async def execute_with_timeout(self, func, *args, **kwargs):
        try:
            return await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=self.config.total_timeout
            )
        except asyncio.TimeoutError:
            raise LLMTimeoutError(
                f"Request timed out after {self.config.total_timeout}s"
            )
```

**첫 토큰까지의 시간은 그 자체로 하나의 타임아웃이다.** 스트리밍에선 첫 토큰 데드라인이 페일오버에 중요한 것: 첫 토큰 전엔 다른 백엔드로 깔끔히 옮길 수 있고, 후엔 처음부터 재생하거나 오류를 드러내야 한다. 게이트웨이가 이제 이를 직접 노출한다(Envoy AI Gateway 1.1이 `streamIdleTimeout` 추가 — 첫 토큰 전 스트림이 멈추면 다음 백엔드로 페일오버하고 중간에 멈추면 504 반환). 모델·노력 수준별로 설정하라: 고노력 추론 요청은 오랫동안 눈에 보이는 걸 아무것도 스트림 안 할 수 있고, 빠른 모델에 맞춘 TTFT 데드라인은 그걸 괜히 페일오버시킨다.

### 적응형 타임아웃

```python
class AdaptiveTimeout:
    """
    Adjust timeouts based on observed latency.
    """
    
    def __init__(
        self,
        initial_timeout: float = 30.0,
        min_timeout: float = 10.0,
        max_timeout: float = 120.0,
        percentile: float = 0.99
    ):
        self.min_timeout = min_timeout
        self.max_timeout = max_timeout
        self.percentile = percentile
        self.latencies: list[float] = []
        self.current_timeout = initial_timeout
    
    def record_latency(self, latency: float):
        self.latencies.append(latency)
        
        # Keep last 1000 observations
        if len(self.latencies) > 1000:
            self.latencies = self.latencies[-1000:]
        
        # Update timeout to percentile + buffer
        if len(self.latencies) >= 10:
            sorted_latencies = sorted(self.latencies)
            idx = int(len(sorted_latencies) * self.percentile)
            p99_latency = sorted_latencies[idx]
            
            # Add 20% buffer
            new_timeout = p99_latency * 1.2
            self.current_timeout = max(
                self.min_timeout,
                min(self.max_timeout, new_timeout)
            )
    
    def get_timeout(self) -> float:
        return self.current_timeout
```

---

## 우아한 성능 저하

### 저하 단계

```python
class DegradationLevel(Enum):
    FULL = "full"           # All features
    REDUCED = "reduced"     # Fewer features
    MINIMAL = "minimal"     # Core only
    CACHED = "cached"       # Cached responses only
    OFFLINE = "offline"     # Error message

class GracefulDegrader:
    def __init__(self):
        self.current_level = DegradationLevel.FULL
        self.health_checker = HealthChecker()
    
    async def get_response(self, query: str) -> str:
        level = await self.health_checker.get_degradation_level()
        
        if level == DegradationLevel.FULL:
            return await self.full_pipeline(query)
        
        elif level == DegradationLevel.REDUCED:
            # Skip expensive operations
            return await self.reduced_pipeline(query)
        
        elif level == DegradationLevel.MINIMAL:
            # Simpler model, no retrieval
            return await self.minimal_pipeline(query)
        
        elif level == DegradationLevel.CACHED:
            # Only return cached responses
            cached = await self.cache.get_similar(query)
            if cached:
                return cached
            return "I'm experiencing issues. Please try again later."
        
        else:
            return "Service temporarily unavailable."
    
    async def full_pipeline(self, query: str) -> str:
        # RAG + primary model + ensemble verification
        context = await self.retrieve(query)
        response = await self.generate(query, context, model="gpt-6.1-sol")
        verified = await self.verify(response)
        return verified
    
    async def reduced_pipeline(self, query: str) -> str:
        # RAG + smaller model, no verification
        context = await self.retrieve(query)
        return await self.generate(query, context, model="gpt-6-luna")
    
    async def minimal_pipeline(self, query: str) -> str:
        # Direct generation with smallest model, no retrieval
        return await self.generate(query, None, model="gpt-6-luna")
```

---

## 멀티 제공자 페일오버

**형제 모델이 아니라 벤더 간에 페일오버하라.** 장애는 벤더 표면 전체를 한 번에 내린다. Anthropic 상태 피드는 2026-08-16\~09-29에 주요·심각 사고를 최소 12건 기록했고, 여럿이 API·Claude Code·claude.ai를 함께 걸쳤다. OpenAI의 9/29 사고는 API(Agents API 포함)·ChatGPT·Codex를 약 5시간 20분 저하시켰다. 클라우드도 실패한다: 8/20 Google Cloud us-west1 사고는 2시간 22분 고객 영향. 같은 제공자의 한 모델에서 다른 모델로 넘어가는 체인은 이 중 어느 것도 못 버틴다.

**페일오버는 드롭인이 아니다.** 폴백 다리는 요청을 받고, 대화를 이어가고, 같은 데이터 조건을 충족하고, 일을 해내야 한다:

| 깨지는 것 | 예시 (2026년 10월) | 수정 |
|-------------|------------------------|-----|
| 요청 형태 | Claude Fable 5.1·Opus 5.5·Sonnet 5.5는 강제 `tool_choice`에 400; GPT-6 Astra는 커스텀 `temperature`·`top_p`·`logprobs` 거부 | 역량 프로파일에서 대상별 변환; 파라미터를 맹목 통과 금지 |
| 대화 상태 | 최신 Claude 모델은 thinking 블록을 모델·대화에 바인딩 | 턴 경계에서 페일오버; 가시 전사·도구 결과 전송 |
| 데이터 조건 | Fable 5.1은 ZDR 허가 없으면 30일 보존; OpenAI Agents API 베타는 ZDR 없음 | 레지스트리에 모델별 보존·레지던시 저장, 라우팅 시점 강제 |
| 출력 품질 | 폴백 모델이 내 작업에 평가된 적 없음 | 모든 폴백 다리에 평가 스위트를 일정대로 실행 |

[게이트웨이 장](../11-infrastructure-and-mlops/03-ai-gateways-and-model-routing.md)이 라우팅 메커니즘을, 아래 코드가 핵심 루프를 보인다.

### Provider Manager

```python
class ProviderManager:
    def __init__(self):
        self.providers = {
            "primary": OpenAIProvider(),
            "secondary": AnthropicProvider(),
            "tertiary": GoogleProvider()
        }
        self.health = {name: True for name in self.providers}
        self.priority_order = ["primary", "secondary", "tertiary"]
    
    async def generate(self, request: dict) -> str:
        for provider_name in self.priority_order:
            if not self.health[provider_name]:
                continue
            
            provider = self.providers[provider_name]
            
            try:
                result = await provider.generate(request)
                return result
            except RetryableError as e:
                # Mark unhealthy but continue to next provider
                self.health[provider_name] = False
                asyncio.create_task(
                    self._health_check_later(provider_name)
                )
                continue
        
        raise AllProvidersUnavailableError()
    
    async def _health_check_later(self, provider_name: str):
        await asyncio.sleep(30)  # Wait before retrying
        try:
            await self.providers[provider_name].health_check()
            self.health[provider_name] = True
        except:
            # Schedule another check
            asyncio.create_task(self._health_check_later(provider_name))
```

### 요청 헤징(Hedging)

```python
class HedgedRequest:
    """
    Start the primary; if it is slow or fails, race the other providers
    against it and keep the first successful response.
    """
    
    def __init__(self, providers: list, hedge_delay: float = 2.0):
        self.providers = providers
        self.hedge_delay = hedge_delay
    
    async def generate(self, request: dict) -> str:
        primary = asyncio.create_task(self.providers[0].generate(request))
        
        # asyncio.wait, unlike wait_for, does not cancel the primary on timeout
        done, _ = await asyncio.wait({primary}, timeout=self.hedge_delay)
        if primary in done and primary.exception() is None:
            return primary.result()
        
        # Primary is slow or failed: hedge to the others, keeping a slow primary in the race
        pending = set() if primary in done else {primary}
        pending |= {
            asyncio.create_task(provider.generate(request))
            for provider in self.providers[1:]
        }
        
        try:
            while pending:
                done, pending = await asyncio.wait(
                    pending, return_when=asyncio.FIRST_COMPLETED
                )
                for task in done:
                    if task.exception() is None:
                        return task.result()  # first success wins, not first finisher
            raise AllProvidersFailedError()
        finally:
            for task in pending:
                task.cancel()  # stop paying for the losers
```

멱등(idempotent) 요청만 헤지하고(부작용 있는 도구 호출 없음), `hedge_delay`를 그 모델·노력 수준의 primary p95 지연 근처로 설정하며(스트림을 헤지하면 첫 토큰까지의 시간), 예산을 잡아라: 헤지 요청은 지는 다리도 지불하는데, 최소한 그 입력 토큰에 흔히 더 많이 — 클라이언트에서 취소해도 제공자가 생성을 멈춘다는 보장이 없으니.

---

## 면접 질문

### Q: LLM 시스템의 고가용성을 어떻게 설계하나?

**좋은 답변:**

"여러 신뢰성 계층을 쓴다:

**백오프 재시도:** 일시 실패엔 `Retry-After`를 지키는 지터 지수 백오프. 재시도 가능(대부분 레이트 리밋·과부하·타임아웃)과 불가능(인증·잘못된 요청)을 구분하고, 상태만이 아니라 오류 코드로 분기하는 게 중요: 지출 캡 429는 레이트 리밋처럼 보이나 백오프가 아니라 페일오버·사람이 필요.

**서킷 브레이커:** 제공자가 반복 실패하면 쿨다운 동안 시도를 멈춤. 죽은 제공자에 지연을 낭비하지 않고 회복 시간을 준다.

**멀티 제공자 페일오버:** 단일 제공자에 의존하지 말 것. 벤더 장애가 보통 제공하는 모든 모델을 내리니 서로 다른 벤더로 primary/secondary/tertiary를 구성한다. 각 제공자에 자체 서킷 브레이커, 모든 폴백 다리를 내 작업에 평가 — 아무도 안 테스트한 폴백은 대기 중인 두 번째 장애다.

**거부 처리:** 최신 Claude 모델의 안전 거부가 `stop_reason: "refusal"`의 HTTP 200으로 오니, 오류나 성공으로 세지 말고 승인 폴백 모델로 라우팅한다.

**우아한 성능 저하:** 어떤 제공자도 없을 때 무엇이 일어날지 정의. 완전 실패보다 저하 응답(더 단순한 모델·캐시 결과)이 낫다.

**벌크헤딩:** 다른 워크로드 격리. 배치 처리 급증이 실시간 쿼리를 내려선 안 된다.

핵심 통찰은 실패를 가정하는 것. LLM API는 전통 API보다 덜 신뢰할 만하다. 제공자가 내려갈 것처럼 설계하라 — 내려갈 테니."

### Q: 서킷 브레이커와 재시도의 차이는?

**좋은 답변:**

"둘은 다른 문제를 푼다:

**재시도**는 일시 실패를 다룬다. 단일 요청이 실패하면 다시 시도. 실패가 독립적이고 다음 시도가 성공할 수 있다고 가정.

**서킷 브레이커**는 시스템적 실패를 다룬다. 많은 요청이 실패하면 아예 시도를 멈춤. 하류 시스템이 건강하지 않고 반복 시도가 리소스를 낭비하며 회복을 늦춘다고 가정.

**함께 작동하는 법:**
1. 요청 실패 → 백오프 재시도(시도 1·2·3)
2. 모든 재시도 실패 → 서킷 브레이커가 실패 기록
3. N회 실패 후 → 서킷 열림, 요청 즉시 거절
4. 타임아웃 후 → 서킷 반열림, 제한된 테스트 요청 허용
5. 테스트 성공 → 서킷 닫힘, 정상 복귀

서킷 브레이커 없으면: 장애 중 모든 요청이 모든 재시도를 기다린 뒤 실패. 지연 급증, 리소스 고갈.

서킷 브레이커 있으면: 장애 감지 후 요청이 빠르게 실패. 시스템이 반응성을 유지하고 대안으로 페일오버 가능."

### Q: 제공자가 같은 모델 ID 하에 수정을 배포했고 품질 지표가 움직였다. 조용한 모델 변화를 어떻게 탐지·대응하나?

**좋은 답변:**

"ID 뒤의 모델이 바뀔 수 있다고 가정한다 — 실제로 그러니. GPT-6 Sol·Luna가 2026-09-22 이미지 인코딩 버그와 함께 출시됐고, OpenAI가 9/25 같은 ID 하에 고치며 이미지 입력 고객에게 평가 재실행을 알렸다. 출시 주 수치로 이미지·컴퓨터 사용 마이그레이션을 확정한 사람은 깨진 경로를 측정했을 수 있다.

**탐지:**
- CI만이 아니라 프로덕션 엔드포인트에 일정대로(중요 경로는 매시간) 돌리는 작은 카나리아 평가 스위트.
- 싼 신호의 분포 모니터: 출력 길이, 범주별 거부율, 도구 호출율, 스키마 검증 실패, 트래픽 샘플의 판정자 점수.
- 제공자 체인지로그·상태 페이지를 우리 배포와 같은 알림 채널에 연결.

**대응:**
- 제공자가 제공하는 곳에 날짜 스냅샷 핀 — 이름을 핀할 뿐 서빙 스택은 아님을 알고.
- 출시 1\~2주 뒤 두 번째 평가 실행에 마이그레이션을 게이팅하고, 새 모델이 안정될 때까지 이전 모델을 따뜻하게 유지.
- 제공자가 수정을 발표하면 영향받은 평가 슬라이스를 재실행하고 마지막 known-good 베이스라인과 비교한 뒤 어느 수치든 신뢰.

원칙: 모델 거동은 버전 범프 없이 바뀌는 의존성이라, 여느 외부 서비스처럼 지속적 검증이 필요하다."

---

## 참고 문헌

- Microsoft Resilience Patterns: https://learn.microsoft.com/en-us/azure/architecture/patterns/
- Netflix Hystrix: https://github.com/Netflix/Hystrix
- OpenAI API changelog (September 2, 2026 `slow_down` 429 and 503 overload; September 25, 2026 GPT-6 Sol/Luna image-encoding fix): https://developers.openai.com/api/docs/changelog
- Anthropic, refusals and fallback: https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback
- Anthropic, rate limits: https://platform.claude.com/docs/en/api/rate-limits
- Anthropic status history: https://status.claude.com/history

---

*이전: [앙상블 기법](02-ensemble-methods.md) · 다음: [AI 거버넌스와 컴플라이언스](04-ai-governance-and-compliance.md)*
