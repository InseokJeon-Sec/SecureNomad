---
title: 가격과 비용
sidebar_position: 3
description: LLM 시스템의 비용 구조 — 가격 모델, 요율표 위의 배수들, 비용 계산, 최적화 전략, 컨텍스트 캐싱 경제학, 셀프 호스팅과 총소유비용(TCO).
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/03-pricing-and-costs.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 범위 안내
개념·방법론(가격 모델, 배수, 비용 계산, 최적화, 캐싱 경제학, TCO)은 전량 번역했습니다. 다만 **"현재 API 가격표"와 "폐기·가격변경 캘린더"는 수백 개 셀이 주 단위로 바뀌는 휘발성 데이터**라, 번역본에서 옮기기보다 [영문 원문(전체 표 포함)](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/03-pricing-and-costs.md)과 각 공급사 공식 가격 페이지를 참조하도록 안내합니다. 숫자·모델명·통화는 언어와 무관합니다.
:::

# 가격과 비용

LLM 시스템의 비용 구조를 이해하는 것은 프로덕션 계획에 필수다. 이 장은 가격 모델, 비용 최적화 전략, 총소유비용 분석을 다룬다.

## 가격 모델

### 토큰 기반 가격

대부분의 LLM API는 토큰 단위로 과금한다:

```
Cost = (input_tokens × input_rate) + (output_tokens × output_rate)
```

**핵심 관찰:**
- 출력 토큰은 보통 입력보다 2~8배 비싸다(Claude Opus 5.5·Sonnet 5.5·GPT-6 Sol·Gemini 3.8 Flash 5배; Grok 4.7 3배; GPT-5.6 Sol·Terra 정가 6배; Gemini 3.5 Flash-Lite 약 8배; 호스티드 MiMo-V2.6 2배), 일부 오픈 가중치 호스트는 둘을 같게 과금한다(Together AI Llama 3.3 70B $1.04 / $1.04). 그래서 출력 중심 워크로드는 출력 열을 먼저 보고 가격을 매겨야 한다
- 추론 토큰은 출력으로 과금되며, 최신 Claude 모델에선 사고를 완전히 끌 수 없다
- 요율표는 기본일 뿐이다: 장문맥 절벽, 캐시 조건, 속도 티어, 레지던시, 프로모션이 이를 배가한다

### 요율표 위의 배수들 (2026년 10월)

같은 모델에서 토큰 수가 같은 두 요청도 가격이 10배 넘게 차이 날 수 있다. 명시적으로 모델링해야 할 차원들:

| 차원 | 과금 방식 | 현재 예 |
|-----------|--------------|------------------|
| **장문맥 절벽** | 프롬프트가 임계를 넘으면 초과분만이 아니라 **요청 전체**가 상위 요율로 이동 | OpenAI 272K 입력 초과: 입력·캐시 2배, 출력 1.5배(Batch·Flex도, GPT-6·GPT-5.6 계열 Fast도). xAI Grok 4.6/4.7 200K 이상: 모든 토큰 2배. Gemini 3.1 Pro Preview 200K 초과. Anthropic Claude 4.6 이후: 1M까지 정액 |
| **캐시 쓰기 / 읽기** | 접두 쓰기에 프리미엄, TTL 내 재읽기에 할인 | OpenAI GPT-5.6 이후: 쓰기 1.25배, 읽기 0.1배(GPT-6.1 Sol 0.05배), 고정 30분 TTL. Anthropic: 쓰기 1.25배(5분)/2배(1시간); 읽기 0.1배, Opus 5.5 0.05배, Fable 5.1 0.025배. Gemini: 읽기 0.1배 + 시간당 저장 |
| **서비스 티어** | 기다리면 덜, 먼저·빨리 가면 더 | OpenAI·Anthropic·Gemini API Batch 0.5배; 제공처의 Flex 0.5배(OpenAI, Gemini API, 대부분 Bedrock; Anthropic은 Flex 없음, Bedrock의 GPT-6 Astra는 Flex·Priority 둘 다 미지원). OpenAI Fast(7/30 Priority에서 개명) 2배, GPT-5.5는 2.5배; Ultrafast 6배(GPT-6 Astra GA, GPT-5.6 Sol 프리뷰). Gemini Priority 약 1.8배. Bedrock Priority 1.75배. Anthropic Opus fast 모드(2배); Anthropic은 Priority Tier를 더 이상 판매 안 함 |
| **데이터 레지던시** | 리전 고정 처리는 약 10% 더 | Anthropic `inference_geo: "us"` 모든 토큰 유형 1.1배(Claude 4.6+). OpenAI는 2026-03-05 이후 출시 모델에 레지던시 엔드포인트. Bedrock·Google Cloud 리전 Claude. Bedrock 리전 GPT-6 Astra($11/$55). Mistral EU 추론 |
| **프로모션 창** | 종료일이 있는 임시 요율, 또는 하한일만 | Gemini 3.6/3.7/3.8 Flash 2026-12-31까지 반값. GPT-5.6 Sol $4/$20, "최소 2026-11-21까지"만 보장. Gemini 4 Argon 발표 도입가는 종료일 없음 |
| **시간대** | 오프피크 할인 | DeepSeek 오프피크는 피크의 50%; 피크는 평일 UTC 01:00-04:00·06:00-10:00, 중국 공휴일 제외 |
| **분당** | 토큰 대신 세션·오디오 시간 | `gpt-live-1` $0.05/분 + 백엔드 토큰; `gpt-transcribe` $0.0045/분 |
| **과금되는 거부** | 돈이 드는 안전 중단 | Anthropic은 2026-09-24부터 `bio`·`frontier_llm`·`reasoning_extraction` 범주의 출력 전 거부를 과금; 다른 범주는 미과금 |
| **할인 대가 데이터** | 벤더가 트래픽을 쓸 수 있으면 더 쌈 | Meta `muse-spark-1.3-contributor` $0.10/$0.20 vs $1.25/$4.25 |
| **런타임 미터** | 토큰 위에 세션·샌드박스 시간 | Claude Managed Agents 실행 세션-시간당 $0.08(유휴 무료). OpenAI Agents API 컨테이너: 20분 세션당 소형 $0.03, 중형 $0.12, 대형 $0.48, 분 단위 과금, 최소 5분 |

따라서 한 요청의 실효 가격은:

```
effective_cost = residency_mult × tier_mult × (
      uncached_in × in_rate(prompt_size)
    + cache_write × write_rate(prompt_size)
    + cache_read  × read_rate(prompt_size)
    + (visible_output + reasoning_tokens) × out_rate(prompt_size)
)
# rate(prompt_size)는 벤더 장문맥 임계를 넘으면 요청 전체에 대해 점프한다
```

### 볼륨·약정 가격

공개 정가에는 자동 볼륨 할인이 없다. 할인은 협상된 약정에서 나오며, 아래 수치는 공개 조건이 아니라 엔터프라이즈 거래의 예시다:

| 티어 | 월 지출 | 전형적 협상 할인 |
|------|---------------|-----------------------------|
| Standard | $0 - $5K | 0% |
| Growth | $5K - $50K | 10-20% |
| Enterprise | $50K+ | 맞춤 협상 |

```
Standard: $2.50 / 1M input tokens
Committed (1-year): $2.00 / 1M input tokens (20% savings)
```

**이제 용량은 가격과 별도로 산다.** Anthropic은 Priority Tier 약정을 더 이상 판매하지 않으므로(기존 계약은 만료까지), 보장 용량은 맞춤 계약이나 Bedrock Reserved(1·3개월) 같은 클라우드 예약에서 온다. Anthropic 셀프서브 티어(Start·Build·Scale)는 월 지출 하드 상한 $500·$1,000·$200,000을 가진다. 상한에 닿으면 다음 달 1일 00:00 UTC까지 `retry-after` 없이 HTTP 429 `enforced_spend_limit_reached`를 반환한다. 이제 예산 상한은 가용성 위험이므로, 닿기 한참 전에 경보하라.

---

## 현재 API 가격 (휘발성 — 영문 미러 참조)

> OpenAI(GPT-6 세대), Anthropic(Claude 5.x), Google(Gemini 3.x·4), xAI(Grok), 오픈 가중치/밸류 티어, 음성·전사(분당 과금), 임베딩 모델의 **상세 요율표**와 **Q4 2026~2027 초 폐기·가격변경 캘린더**는 주 단위로 바뀝니다. 이 표들은 번역본에서 옮기면 즉시 낡으므로 생략하고, 아래를 참조하세요:
>
> - **영문 전체 표**: [Pricing and Costs (영문 원문)](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/03-pricing-and-costs.md)
> - **공급사 공식 가격 페이지**(항상 최신):
>   - OpenAI: https://developers.openai.com/api/docs/pricing
>   - Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
>   - Google: https://ai.google.dev/gemini-api/docs/pricing
>   - xAI: https://docs.x.ai/developers/models
>   - DeepSeek: https://api-docs.deepseek.com/quick_start/pricing
>   - Mistral: https://mistral.ai/pricing/api
>
> 요율표를 볼 때 기억할 점(2026년 10월 스냅샷 기준): 천장 가격은 $10 / $50(Fable 5.1, GPT-6 Astra)이되 장문맥 규칙이 다르고, 중간 티어는 $2 / $10로 수렴했으며(Sonnet 5.5, GPT-6 Sol, GPT-6.1 Sol), Opus 5.5는 $4 / $20로 내렸고, 바닥은 GPT-6 Luna $0.10 / $0.50입니다. 캐시 읽기는 모델별로 0.1배/0.05배/0.025배로 갈립니다.

:::warning 추론 토큰은 출력 토큰이다
사고가 항상 켜져 있거나 적응형인 모델(Claude Fable 5.1·Opus 5.5·Sonnet 5.5; `none` effort가 없는 GPT-6 Astra)에선, 응답에 전혀 나타나지 않는 사고에도 출력 요율을 낸다. 논리 집약 과제에서 요청 총비용이 2~10배 늘 수 있다. Opus 5.5는 사고를 끌 수 없고 Sonnet 5.5 최저 설정은 `between_tools`라, 비용 통제 수단은 사고 토글이 아니라 **effort 설정 + `max_tokens` 상한**이다. 조용한 기본값 변경 주의: Opus 5.5는 `medium` 기본(Opus 5는 `high`), GPT-6.1 Sol은 `medium`, Sonnet 5.5는 API에서 `high`. 매 요청에 effort를 명시하라.
:::

---

## 비용 계산

### 기본 비용 공식

아래 함수는 순진한 `토큰 × 요율` 계산이 놓치는 두 가지를 모델링한다: 캐시 분할과 요청 전체 장문맥 절벽.

```python
# USD per 1M tokens, Standard tier, list prices as of October 1, 2026.
# lc_at = smallest prompt size that moves the WHOLE request to long-context rates.
PRICING = {
    "gpt-6-sol":         {"in": 2.00, "cached": 0.20, "out": 10.00,
                          "lc_at": 272_001, "lc_in": 4.00, "lc_cached": 0.40, "lc_out": 15.00},
    "gpt-6-luna":        {"in": 0.10, "cached": 0.01, "out": 0.50,
                          "lc_at": 272_001, "lc_in": 0.20, "lc_cached": 0.02, "lc_out": 0.75},
    "grok-4.7":          {"in": 2.00, "cached": 0.50, "out": 6.00,
                          "lc_at": 200_000, "lc_in": 4.00, "lc_cached": 1.00, "lc_out": 12.00},
    "claude-sonnet-5-5": {"in": 2.00, "cached": 0.20, "out": 10.00},  # flat to 1M
    "claude-opus-5-5":   {"in": 4.00, "cached": 0.20, "out": 20.00},  # flat to 1M
    # Gemini 3.8 Flash: budget on the January 1, 2027 list price, not the $0.75/$3.75 intro.
    # Cache reads assumed at 0.1x of input; hourly cache storage is not modeled here.
    "gemini-3.8-flash":  {"in": 1.50, "cached": 0.15, "out": 7.50},
}

def request_cost(
    model: str,
    uncached_in: int,
    output_tokens: int,          # visible output + reasoning tokens
    cached_in: int = 0,
    cache_write: int = 0,
    write_mult: float = 1.25,    # OpenAI 1.25x; Anthropic 1.25x (5 min) or 2x (1 h)
    tier_mult: float = 1.0,      # 0.5 Batch/Flex, 2.0 Fast, 6.0 OpenAI Ultrafast
    residency_mult: float = 1.0, # 1.1 for region-pinned processing
) -> float:
    p = PRICING[model]
    prompt = uncached_in + cached_in + cache_write
    long_ctx = "lc_at" in p and prompt >= p["lc_at"]

    def rate(key: str) -> float:
        return p[f"lc_{key}"] if long_ctx else p[key]

    cost = (
        uncached_in * rate("in")
        + cache_write * rate("in") * write_mult
        + cached_in * rate("cached")
        + output_tokens * rate("out")
    ) / 1_000_000
    return cost * tier_mult * residency_mult
```

**절벽을 숫자로(GPT-6 Sol, 출력 2K):** 270K 토큰 프롬프트는 (270,000 × $2 + 2,000 × $10) / 1M = **$0.56**. 275K 토큰 프롬프트는 (275,000 × $4 + 2,000 × $15) / 1M = **$1.13**. 5천 토큰 추가가 청구를 2배로 만들었다. Claude Fable 5.1에선 900K 프롬프트가 9K와 같은 1M당 $10로 과금되고, GPT-6 Astra에선 같은 프롬프트가 1M당 $20다. 장문맥 RAG 결정은 이제 부분적으로 가격 결정이다.

### 비용 계산 예시

**시나리오 1: RAG 챗봇**
```
Per request:
- System prompt: 500 tokens
- Retrieved context: 2,000 tokens
- User message: 100 tokens
- Response: 300 tokens

Input: 2,600 tokens, Output: 300 tokens

GPT-6 Sol or Claude Sonnet 5.5: (2600 × $2 + 300 × $10) / 1M = $0.0082 per request
GPT-6 Luna:                     (2600 × $0.10 + 300 × $0.50) / 1M = $0.00041 per request

At 10,000 requests/day on GPT-6 Sol:
Daily: $82
Monthly: $2,460
(GPT-6 Luna: $4.10/day, $123/month, if quality holds on your evals)
```

**시나리오 2: 문서 요약**
```
Per document:
- Document: 8,000 tokens
- Summary: 500 tokens

GPT-6 Sol cost: (8000 × $2 + 500 × $10) / 1M = $0.021

1,000 documents: $21
10,000 documents: $210 (Batch API: $105)
```

### 월별 비용 예측

```python
def project_monthly_cost(
    requests_per_day: int,
    avg_input_tokens: int,
    avg_output_tokens: int,
    model: str,
    **kwargs,
) -> dict:
    per_request = request_cost(
        model, avg_input_tokens, avg_output_tokens, **kwargs
    )

    daily = per_request * requests_per_day
    monthly = daily * 30
    yearly = monthly * 12

    return {
        "per_request": per_request,
        "daily": daily,
        "monthly": monthly,
        "yearly": yearly
    }

# Example
costs = project_monthly_cost(
    requests_per_day=50000,
    avg_input_tokens=2000,
    avg_output_tokens=400,
    model="gpt-6-sol"
)
# Output: $0.008/request, $400/day, ~$12,000/month
```

---

## 비용 최적화 전략

### 전략 1: 모델 라우팅

요청을 적절한 모델 티어로 라우팅:

```python
class ModelRouter:
    def __init__(self):
        self.classifier = load_complexity_classifier()

    def route(self, query: str, context: str) -> str:
        complexity = self.classifier.predict(query)

        if complexity < 0.3:
            return "gpt-6-luna"   # Simple queries: $0.10 / $0.50
        elif complexity < 0.7:
            return "gpt-6-luna"   # Medium: try cheap first
        else:
            return "gpt-6-sol"    # Complex queries: $2 / $10

    def route_with_fallback(self, query: str, context: str) -> str:
        # Try cheap model first
        response = self.try_model("gpt-6-luna", query, context)

        if self.is_quality_sufficient(response):
            return response

        # Fallback to expensive model
        return self.try_model("gpt-6-sol", query, context)
```

**잠재 절감:** 품질 영향 최소로 50~70%. GPT-6 Luna와 GPT-6 Sol 사이 티어 격차가 이제 입력·출력 모두 20배라, 라우팅의 이득이 1년 전보다 크다.

### 전략 2: 프롬프트 최적화

품질 손실 없이 토큰 수 줄이기:

```python
# Before: 2,500 tokens
system_prompt = """
You are a helpful customer support assistant for Acme Corp.
You have access to our product documentation and should answer
questions accurately and helpfully. Always be polite and professional.
If you don't know something, say so rather than making things up.
Format your responses clearly with bullet points when listing items.
[... more verbose instructions ...]
"""

# After: 800 tokens
system_prompt = """
You are Acme Corp's support assistant.
Rules:
- Answer from provided context only
- Admit uncertainty
- Use bullet points for lists
- Be concise
"""

# Savings on GPT-6 Sol: 1,700 tokens × $2/1M = $0.0034 per request
# At 10K requests/day: $34/day = $1,020/month (before caching, which shrinks this further)
```

### 전략 3: 캐싱

반복·유사 쿼리에 대한 응답 캐싱:

```python
class ResponseCache:
    def __init__(self, ttl_seconds: int = 3600):
        self.exact_cache = TTLCache(maxsize=10000, ttl=ttl_seconds)
        self.semantic_cache = SemanticCache(threshold=0.95)

    def get_or_generate(self, query: str, context: str) -> tuple[str, bool]:
        # Check exact cache
        cache_key = self.make_key(query, context)
        if cache_key in self.exact_cache:
            return self.exact_cache[cache_key], True  # Cache hit

        # Check semantic cache
        similar = self.semantic_cache.find_similar(query)
        if similar:
            return similar.response, True  # Semantic hit

        # Generate new response
        response = self.generate(query, context)
        self.exact_cache[cache_key] = response
        self.semantic_cache.add(query, response)

        return response, False  # Cache miss

# With 30% cache hit rate:
# Baseline: $3,000/month
# With caching: $2,100/month
# Savings: $900/month
```

### 전략 4: 배치 처리와 서비스 티어

사람이 기다리지 않는 것은 모두 더 싼 티어에 속한다:

```python
# Real-time: pay full price
for query in queries:
    response = model.generate(query)

# Batch API (50% off at OpenAI, Anthropic, Google, and via OpenRouter on 70+ models):
batch_responses = model.batch_generate(queries)
# Cost: 50% of real-time pricing, results within 24 hours

# Flex tiers (OpenAI, Gemini, Bedrock): same 0.5x on the regular API, in exchange
# for slower, lower-priority processing
```

이제 사다리는 0.5배(Batch·Flex)에서 Standard를 거쳐 2배(OpenAI Fast, Anthropic fast 모드), 6배(OpenAI Ultrafast)까지다. 지연 SLO는 비용 결정이다: 각 워크로드 클래스(인터랙티브, 에이전트 내부 루프, 오프라인)를 티어에 매핑하고 혼합 요율을 보고하라.

### 전략 5: 출력 길이 제어

응답 길이를 적절히 제한:

```python
# Reduce unnecessary output
response = model.generate(
    prompt=prompt,
    max_tokens=300,  # Limit output (on reasoning models this budget includes thinking)
    stop=["\n\n"]    # Stop at natural break
)

# Cost impact on GPT-6 Sol:
# Before: avg 500 output tokens = $0.005 per request
# After: avg 250 output tokens = $0.0025 per request
# Savings: 50% on output costs
```

### 전략 6: 프롬프트 길이 라우팅

OpenAI 프롬프트는 272K 이하, xAI는 200K 미만으로 유지하거나, 긴 프롬프트는 정액 모델(Claude 4.6 이후)로 라우팅하라. 임계 근처에서 검색 문맥을 몇천 토큰 줄이면 요청 비용이 반으로 준다. 임계를 넘으면 컴팩션이나 RAG가 보통 모든 토큰에 2배 내는 것보다 낫다.

### 비용 최적화 요약

| 전략 | 노력 | 잠재 절감 |
|----------|--------|-------------------|
| 모델 라우팅 | 중 | 50-70% |
| **컨텍스트 캐싱** | 저 | **90-97.5%(캐시된 입력)** |
| 프롬프트 최적화 | 저 | 20-40% |
| 응답 캐싱 | 중 | 20-40% |
| Batch / Flex 티어 | 저 | 50%(OpenAI, Anthropic, Google, OpenRouter) |
| 프롬프트 길이 라우팅 | 저 | 장문맥 임계 근처 요청에서 최대 50% |
| 오프피크 스케줄링 | 저 | 50%(DeepSeek) |

---

## 컨텍스트 캐싱 경제학

**규칙은 여전히 유효하다:** 안정적 접두(시스템 프롬프트, 도구 정의, 공유 코퍼스)가 수천 토큰을 넘고 TTL 내 재사용되면 캐시하라. 2026년에 바뀐 건 캐시 조건이 모델별로 다르다는 점이라, 계산을 모델별로 해야 한다.

**손익분기:** 캐싱은 쓰기 프리미엄 `(write_mult - 1)`을 한 번 쓰고 재읽기마다 `(1 - read_mult)`를 아끼므로,

`손익분기 재읽기 수 = (write_mult - 1) / (1 - read_mult)`

| 모델 | 입력 | 캐시 쓰기 | 캐시 읽기 | TTL | 손익분기 재읽기 |
|-------|-------|-------------|------------|-----|--------------------|
| Claude Fable 5.1 | $10.00 | $12.50(5분) / $20.00(1시간) | $0.25(0.025x) | 5분/1시간 | 0.26 / 1.03 |
| Claude Opus 5.5 | $4.00 | $5.00 / $8.00 | $0.20(0.05x) | 5분/1시간 | 0.26 / 1.05 |
| Claude Sonnet 5.5 | $2.00 | $2.50 / $4.00 | $0.20(0.1x) | 5분/1시간 | 0.28 / 1.11 |
| GPT-6.1 Sol | $2.00 | $2.50 | $0.10(0.05x) | 고정 30분 | 0.26 |
| GPT-6 Sol | $2.00 | $2.50 | $0.20(0.1x) | 고정 30분 | 0.28 |
| GPT-6 Astra | $10.00 | $12.50 | $1.00(0.1x) | 고정 30분 | 0.28 |
| Gemini 3.8 Flash | $0.75 도입 | - | $0.075 도입($0.15 2027-01-01) + 저장 시간당 1M 토큰당 $0.50 도입($1.00 2027-01-01) | 명시 캐시는 저장 시간당 과금 | 저장 시간에 따라 |

손익분기가 1 미만이면 **TTL 내 한 번 재사용으로 쓰기 값을 치른다**. Anthropic 1시간 쓰기는 최소 두 번 재읽기가 필요하다.

**캐싱이 이제 모델 선택을 바꾸는 지점.** 100K 토큰 안정 접두(도구 정의 + 저장소 문맥)를 가진 50턴 에이전트 루프를 5분·30분 TTL에서, 접두만 계산하면:

| 모델 | 접두 비용(캐시 없음, 50턴) | 접두 비용(캐시: 쓰기 1 + 읽기 49) |
|-------|---------------------------------|-----------------------------------------|
| Claude Fable 5.1 | $50.00 | $1.25 + 49 × $0.025 = $2.48 |
| GPT-6 Astra | $50.00 | $1.25 + 49 × $0.10 = $6.15 |
| Claude Opus 5.5 | $20.00 | $0.50 + 49 × $0.02 = $1.48 |
| Claude Sonnet 5.5 | $10.00 | $0.25 + 49 × $0.02 = $1.23 |
| GPT-6.1 Sol | $10.00 | $0.25 + 49 × $0.01 = $0.74 |

두 가지 교훈. 첫째, 캐싱하면 접두가 비용 동인이 아니게 된다: 캐시된 Opus 5.5는 캐시된 Sonnet 5.5보다 25센트 비싸고 캐시 없는 Sonnet보다 훨씬 싸므로, 둘의 진짜 차이는 출력·추론 토큰이다. 둘째, 동일 정가가 다른 캐시 비용을 숨긴다: Fable 5.1과 Astra 둘 다 입력 $10이지만, Astra의 0.1배 읽기 때문에 같은 캐시 접두가 약 2.5배 비싸다.

**프로덕션에서 무는 주의점:**
- **OpenAI**(GPT-5.6 이후): 최소 캐시 가능 프롬프트 1,024 토큰; `prompt_cache_options.ttl`은 `"30m"`만 허용. 이전 OpenAI 모델은 쓰기 비용 없고 `prompt_cache_retention` 사용. 272K 장문맥 요율은 캐시 토큰에도 적용.
- **Anthropic**: Opus 5.5 최소 캐시 프롬프트 512 토큰. Fable 5.1·Opus 5.5·Sonnet 5.5에서 사고 블록은 대화 접두에 묶인다: 시스템 프롬프트·도구·이전 메시지를 편집하면 블록이 버려지거나, 2026-08-31 이후 계정은 400을 반환한다. 히스토리를 추가만으로 다뤄라(캐시를 따뜻하게 유지하는 규율과 동일). `inline-tools-2026-09-15` 베타는 캐시를 잃지 않고 대화 중간에 도구를 추가한다.
- **Gemini** 명시 캐시는 시간당 저장이 쌓이므로, 쓰고 나서 유휴인 캐시가 아끼는 것보다 더 들 수 있다.
- **관측하라.** OpenAI Prompt Cache Diagnostics는 2026-09-08, Anthropic 캐시 진단은 2026-09-23 GA. 적중률을 SLO로 추적하라; 프롬프트 재작성과 모델 교체가 조용히 0으로 만든다.

배치 할인(50%)은 OpenAI·Anthropic 모두 캐싱과 중첩된다. 이 할인이 서빙 스택 내 KV 재사용에 어떻게 매핑되는지는 [KV 캐시와 컨텍스트 캐싱](https://github.com/ombharatiya/ai-system-design-guide/blob/main/04-inference-optimization/02-kv-cache-and-context-caching.md)을 참고하라.

---

## 셀프 호스팅 & GPU 클라우드 차익

**Reserved vs 서버리스 트레이드오프:**

| 모델 크기 | 서버리스(RunPod/Together) | Reserved(Lambda/AWS) |
|------------|-----------------------------|-----------------------|
| **버스트 용량** | 무한(콜드 스타트) | 고정 |
| **활용률** | 연산 시간만 지불 | 24/7 고정 비용 |
| **TCO 손익분기** | **활용률 &lt; 40%에 유리** | **활용률 &gt; 40%에 유리** |

**시니어급 뉘앙스:**
"GPU 클라우드 차익"은 **스팟 인스턴스 가용성**에 따라 프로덕션 워크로드를 공급사 간 이동하는 것이다. **Skypilot** 같은 도구가 이를 자동화해, 전 세계 "저수요" 리전을 따라가며 셀프 호스팅 비용을 최대 60% 아낀다. MoE 모델은 토큰당 활성 연산을 줄이지만 가중치를 담는 메모리는 줄이지 않는다: Llama 4 Scout(총 109B)는 INT4로 H100 하나에, Maverick(총 약 400B)은 8x H100 노드에, Xiaomi에 따르면 MiMo-V2.6-Flash(309B / 15B 활성)는 8-GPU 노드 하나에 맞는다.

**GPU 가격은 2026년 API 가격과 반대로 움직였다.** 10/1 Silicon Data 인덱스는 B200을 GPU-시간당 $5.86(9월 진입 시 연초 대비 +27.6%), H100을 $2.77로 집계. 10/1 온디맨드 정가: Lambda H100 SXM $3.99·B200 $6.69; RunPod H100 $2.69(커뮤니티)/$3.49(시큐어), B200 $5.98/$6.79, B300 $6.94/$7.89. 장기 약정이 더 싸다: 9/7 기준 12개월 B200은 3개월 $5.73 대비 평균 $5.39.

### 셀프 호스팅이 말이 되는 때

```
API cost at scale (1M requests/month, 2,000 input + 500 output tokens each):
- Claude Opus 5.5:                $8,000 + $10,000 = $18,000/month
- Claude Sonnet 5.5 / GPT-6 Sol:  $4,000 +  $5,000 =  $9,000/month
- DeepSeek V4.1-Flash (peak):       $600 +    $600 =  $1,200/month (half off-peak)
- GPT-6 Luna:                       $200 +    $250 =    $450/month
- MiMo-V2.6-Flash (OpenRouter):     $280 +    $140 =    $420/month

Self-hosted MiMo-V2.6-Flash (309B / 15B active, MIT) on one 8x H100 node:
- GPU: 8 × $2.77/GPU-hr (index) × 730 = $16,177/month
  (8 × $3.99 Lambda on-demand = $23,302/month)
- Engineering time: $5,000/month (0.5 FTE)
- Ops overhead: $2,000/month
- Total: ~$23,200 to $30,300/month, before N+1 redundancy
```

이 볼륨에선 셀프 호스팅이 Opus를 포함한 **모든** API 행에 진다. 옛 경험칙("월 약 50만 요청 이상이면 셀프 호스트")은 프런티어 전용 API를 전제했고, $0.10 / $0.50 비공개 티어와 $0.14 / $0.28 호스티드 오픈 가중치에는 살아남지 못한다. 이제 손익분기는 활용률이다: 노드가 월 약 $23K의 API 지출을 대체해야 한다. 이 요청 형태라면 Sonnet 5.5·GPT-6 Sol 대비 월 약 260만 요청, GPT-6 Luna 대비 약 5,100만 요청(약 1,280억 토큰, 또는 24시간 내내 초당 약 4.9만 토큰)이다. 어느 수치든 믿기 전에 대상 모델에서 자신의 처리량을 측정하라.

### 셀프 호스팅 비용 구성

| 구성 요소 | 월 비용 | 비고 |
|-----------|--------------|-------|
| GPU 연산 | $5K-50K | 8x H100 노드 하나 $16K-23K; HA는 2배 |
| 저장 | $200-500 | 모델 가중치, 로그 |
| 네트워킹 | $100-500 | 이그레스, 로드 밸런싱 |
| 엔지니어링 | $5K-15K | 운영 부분 FTE |
| 모니터링 | $100-500 | 관측 도구 |

### 모델 크기별 GPU 요구

| 모델 크기 | GPU 구성 | 월 비용 추정 |
|------------|------------|---------------------|
| 7B (INT4) | 1x A10G | $500-800 |
| 7B (FP16) | 1x A100 40GB | $1,500-2,500 |
| 70B (INT4) | 2x A100 80GB | $5,000-8,000 |
| 70B (FP16) | 4x A100 80GB | $10,000-15,000 |
| 405B dense (INT4), 예: Llama 3.1 405B | 8x H100 | $16,000-23,000 |
| ~300B MoE, ~15B 활성 (MiMo-V2.6-Flash) | 1x 8-GPU 노드 | $16,000-23,000 (H100) |
| ~1T MoE, ~42B 활성 (MiMo-V2.6-Pro) | 2x 8-GPU 노드 (Xiaomi SGLang 레시피의 16-way 텐서 병렬) | $32,000-47,000 (H100) |

H100 행은 GPU-시간당 $2.77-3.99 가정. 극단 양자화가 소형 끝을 바꾼다: Ternary Bonsai 2 27B는 Qwen3.8-27B 베이스를 가중치당 1.72비트로 5.95 GB에 담지만(Apache 2.0), PrismML 추론 포크가 필요하다.

### 결정 프레임워크

```
Choose API when:
- Volume cannot keep a GPU node busy around the clock
- No ML ops expertise
- Need highest quality (frontier models)
- Fast iteration needed

Choose self-hosting when:
- Sustained volume saturates nodes (price it against a ROUTED API bill)
- Have ML infrastructure team
- Data privacy or residency requirements an API cannot meet
- Predictable, stable workload
- Custom fine-tuning needed (OpenAI ends new fine-tuning jobs Jan 6, 2027)

Before either, check the license:
- MIT / Apache 2.0: MiMo-V2.6, GLM-5.3-Flash, DeepSeek V4.1-Flash, Hy4 preview, Qwen3.8-27B
- Gated: GLM-5.3 (security review for MaaS above US$10B revenue), Kimi K3 (deal for MaaS
  above US$20M revenue), Qwen3.8-Max (MaaS/assistant above US$50M), Qwen Community 1.0
  (any MaaS or coding/office-assistant business), Mistral Medium 3.5 (no rights above
  US$20M monthly revenue)
```

---

## 총소유비용(TCO)

### TCO 구성 요소

```python
def calculate_tco(scenario: dict) -> dict:
    # Direct costs
    api_or_compute = scenario["monthly_api_cost"]

    # Engineering costs
    development = scenario["dev_hours"] * scenario["engineer_rate"]
    maintenance = scenario["maintenance_hours"] * scenario["engineer_rate"]

    # Infrastructure
    vector_db = scenario["vector_db_cost"]
    monitoring = scenario["monitoring_cost"]

    # Indirect costs
    downtime_risk = scenario["expected_downtime_hours"] * scenario["revenue_per_hour"]

    monthly_tco = (
        api_or_compute +
        development / 12 +  # Amortized over year
        maintenance +
        vector_db +
        monitoring +
        downtime_risk
    )

    return {
        "monthly_tco": monthly_tco,
        "yearly_tco": monthly_tco * 12,
        "breakdown": {
            "llm": api_or_compute,
            "engineering": development / 12 + maintenance,
            "infrastructure": vector_db + monitoring,
            "risk": downtime_risk
        }
    }
```

### TCO 비교 예시

**시나리오: 고객 지원 봇(월 5만 요청, Claude Sonnet 5.5에서 입력 3,000 + 출력 400 토큰)**

| 비용 구성 | API 기반 | 셀프 호스트 |
|----------------|-----------|-------------|
| LLM 비용 | $500 | $2,000(H100 하나) |
| 벡터 DB | $70 | $200 |
| 엔지니어링(월) | $500 | $3,000 |
| 모니터링 | $100 | $200 |
| **월 합계** | **$1,170** | **$5,400** |

*이 규모에선 API가 큰 차이로 싸다.*

**시나리오: 대규모 RAG(월 200만 요청, 입력 4,000 + 출력 500 토큰)**

| 비용 구성 | API(전부 중간 티어) | API(라우팅: 70% GPT-6 Luna, 30% GPT-6 Sol) | 셀프 호스트(8x H100 노드 하나) |
|----------------|--------------------|---------------------------------------------|--------------------------------|
| LLM 비용 | $26,000 | $8,710 | $16,200 |
| 벡터 DB | $500 | $500 | $1,000 |
| 엔지니어링(월) | $1,000 | $1,500 | $8,000 |
| 모니터링 | $200 | $200 | $500 |
| **월 합계** | **$27,700** | **$10,910** | **$25,700** |

*셀프 호스팅은 순진한 "전부 중간 티어" API 청구만 이기고, 그마저 중복용 두 번째 노드를 더하기 전에만이다. 라우팅된 API 청구는 2배 넘게 이를 이긴다. 월 200만 요청에선 비용이 아니라 통제·레지던시·라이선스·파인튜닝 가중치를 위해 셀프 호스트하라.*

---

## 면접 질문

### Q: 대량 RAG 애플리케이션의 비용을 어떻게 최적화하겠는가?

**좋은 답변:**
비용 최적화를 계층으로 접근한다:

**1. 아키텍처 최적화:**
- 모델 라우팅: 단순 쿼리엔 싼 모델
- 캐싱: 안정 접두에 공급사 접두 캐싱 + 정확·의미 응답 캐싱(쿼리의 30-40%가 캐시 가능할 수 있음)
- 프롬프트 압축: 시스템 프롬프트 토큰 최소화, 장문맥 임계(OpenAI 272K) 아래 유지

**2. 모델 선택:**
```
Request shape: 2,600 input + 300 output tokens
Simple queries (60%): GPT-6 Luna at $0.00041/request
Complex queries (40%): GPT-6 Sol at $0.0082/request
Weighted avg: $0.0035/request (vs $0.0082 all GPT-6 Sol)
Savings: 57%
```

**3. 인프라:**
- 임베딩 갱신·오프라인 평가엔 Batch나 Flex(50% 저렴)
- 벡터 DB 적정 크기
- 가능하면 스팟 인스턴스

**4. 모니터링:**
- 토큰당만이 아니라 쿼리 유형별·과제당 비용 추적
- 캐시 적중률을 SLO로 추적
- 이상치와 지출 상한(트래픽 하드 중단 전)에 경보

### Q: 셀프 호스트 vs API는 언제 추천하는가?

**좋은 답변:**
결정은 여러 요인에 달렸다:

**요청 수가 아니라 활용률:**
- GPU 노드는 바쁘든 아니든 월 $16K-23K라, 질문은 지속 트래픽이 그만큼 API 지출을 대체하느냐다
- 중간 티어 API($2 / $10) 대비론 월 수백만 요청에서, GPT-6 Luna($0.10 / $0.50) 대비론 수천만에서 일어난다
- 프런티어 정가가 아니라 라우팅된 API 청구와 비교한다

**팀 역량:**
- ML 운영 없음: 규모 불문 API
- 강한 인프라 팀: 셀프 호스팅을 더 일찍 고려

**품질·라이선스:**
- 절대 최고 필요: API(프런티어)
- 충분히 좋으면 됨: 라이선스 확인 후 셀프 호스트 오픈 모델(Kimi K3·GLM-5.3·Qwen·Mistral Medium 3.5 모두 상업 게이트)

**기타:**
- 데이터 프라이버시: 셀프 호스트를 강제할 수 있으나 ZDR 가능 API(Opus 5.5·Sonnet 5.5)가 많은 경우 커버
- 지연 통제: 셀프 호스트가 더 많은 통제
- 파인튜닝: OpenAI는 2027-01-06 기존 고객 신규 파인튜닝 종료 → 커스터마이징이 오픈 가중치로

**추천 프로세스:**
1. 가장 빠른 반복을 위해 API로 시작
2. 모델 전환용 추상화 레이어 구축
3. 한 안정 워크로드의 API 지출이 두 노드(하나 + 중복) 비용에 근접하면 셀프 호스팅 평가
4. 약정 전 섀도 배포로 파일럿

### Q: 내년 비용 모델에 오늘의 토큰 단가를 썼다. 무엇이 틀릴까?

**좋은 답변:**
토큰 정가는 모델에서 가장 불안정한 입력이다. 여덟 가지를 확인한다:

1. **프로모션 만료.** Gemini 3.8 Flash는 2027-01-01에 $1.50 / $7.50로 2배, GPT-5.6 Sol $4 / $20는 2026-11-21까지만 보장. 정가로 예산 잡고 프로모를 상방으로 취급.
2. **장문맥 절벽.** OpenAI는 272K 한 토큰 초과로 요청 전체가 입력 약 2배·출력 1.5배. xAI는 200K. 평균이 아니라 프롬프트 크기 분포를 모델링.
3. **캐시 배수가 모델별.** 읽기가 모델에 따라 0.1/0.05/0.025배, OpenAI TTL은 고정 30분. 모델 교체는 같은 정가에도 캐시 비용을 바꿈.
4. **속도 티어.** 제품이 낮은 지연을 원하면 Fast 2배, Ultrafast 6배. 각 워크로드 클래스에 명시 티어.
5. **레지던시.** 리전 고정 처리는 Anthropic·OpenAI·Bedrock·Google Cloud·Mistral 약 1.1배. 필요한 테넌트에만 적용.
6. **호출당이 아니라 과제당 토큰.** 과제당 토큰이 모델 간 몇 배(AA는 GPT-6 Astra가 코딩 과제당 GPT-5.6 Sol 토큰의 약 1/3, Step 5 Preview는 중앙값의 약 2배 출력). 사고 토큰은 출력으로 과금.
7. **비토큰 미터.** 분당 음성 과금, 매니지드 에이전트 세션 시간, 샌드박스 분, 일부 Anthropic 안전 범주의 과금 거부.
8. **강제 마이그레이션.** 폐기는 트래픽을 새 가격·기본값의 새 모델로 옮기고(10/23 레거시 GPT-4·GPT-3.5·o1·o4-mini 스냅샷, 11/30 Sonnet 4.5, 12/11 GPT-5·o3 스냅샷, 2027 초 오디오 스택), Foundry의 gpt-4o→gpt-5.6-sol 같은 자동 업그레이드는 코드 변경 없이 비용을 바꿈.

산출물은 단일 혼합 요율이 아니라, (모델, 플랫폼)별 가격 스케줄과 캘린더 각 날짜별 시나리오를 가진 모델이다.

---

## 참고 문헌

- OpenAI Pricing: https://developers.openai.com/api/docs/pricing
- OpenAI Deprecations: https://developers.openai.com/api/docs/deprecations
- OpenAI Prompt Caching: https://developers.openai.com/api/docs/guides/prompt-caching
- Anthropic Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic Model Deprecations: https://platform.claude.com/docs/en/about-claude/model-deprecations
- Google AI Pricing: https://ai.google.dev/gemini-api/docs/pricing
- xAI Pricing: https://docs.x.ai/developers/models
- DeepSeek Pricing: https://api-docs.deepseek.com/quick_start/pricing
- Mistral Pricing: https://mistral.ai/pricing/api
- Amazon Bedrock Model Lifecycle: https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html
- Microsoft Foundry Model Retirement Schedule: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule
- Lambda Labs GPU Pricing: https://lambdalabs.com/service/gpu-cloud
- RunPod Pricing: https://www.runpod.io/pricing
- LLM Pricing Comparison: https://pricepertoken.com/

---

*이전: [역량 평가](02-capability-assessment.md) | 다음: [모델 선택 가이드](04-model-selection-guide.md)*
