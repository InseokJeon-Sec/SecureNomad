---
title: 토큰화 심층 분석
sidebar_position: 2
description: 텍스트를 토큰으로 변환하는 과정과 그것이 모델 능력·비용·성능에 미치는 영향 — BPE·WordPiece·Unigram, 어휘 설계, 멀티링궐·멀티모달 토큰화.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/01-foundations/02-tokenization-deep-dive.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 토큰화 심층 분석

토큰화(tokenization)는 텍스트를 모델이 처리할 수 있는 이산 단위(토큰)로 변환하는 과정이다. 모델의 능력, 비용, 성능에 직접적인 영향을 미친다.

## 토큰화가 중요한 이유

### 시스템 설계 관점

1. **비용**: LLM API는 토큰 단위로 과금한다. 토큰화 효율이 비용에 직접 영향을 준다.
2. **문맥 한도**: 문맥에 들어갈 수 있는 양을 단어 수가 아니라 토큰 수가 결정한다.
3. **능력**: 일부 과제(글자 수 세기, 애너그램)는 토큰화 때문에 어렵다.
4. **일관성**: 같은 텍스트라도 모델마다 다르게 토큰화된다.

### LLM 동작 이해 관점

**고전적 면접 질문**: GPT는 왜 "strawberry"의 글자 수를 세는 데 어려움을 겪는가?

"strawberry"가 여러 서브워드로 토큰화되기 때문이다. 모델은 개별 글자를 결코 보지 못하고 서브워드 단위를 본다. 글자를 세려면 토큰 내부 구조를 추론해야 한다.

---

## 토큰화 알고리즘

### 바이트 페어 인코딩(BPE)

가장 일반적인 알고리즘. GPT 계열, Llama, Qwen, DeepSeek에서 사용한다.

**학습 알고리즘:**
1. 개별 바이트 어휘(256개 토큰)로 시작
2. 학습 코퍼스에서 인접한 모든 토큰 쌍의 빈도를 센다
3. 가장 빈번한 쌍을 새 토큰으로 병합
4. 목표 어휘 크기에 도달할 때까지 반복

**예시:**
```
Corpus: "low lower lowest"
Initial: ['l', 'o', 'w', ' ', 'l', 'o', 'w', 'e', 'r', ' ', 'l', 'o', 'w', 'e', 's', 't']

Step 1: Most frequent pair is ('l', 'o'). Merge to 'lo'.
['lo', 'w', ' ', 'lo', 'w', 'e', 'r', ' ', 'lo', 'w', 'e', 's', 't']

Step 2: Most frequent pair is ('lo', 'w'). Merge to 'low'.
['low', ' ', 'low', 'e', 'r', ' ', 'low', 'e', 's', 't']

Step 3: Most frequent pair is ('low', 'e'). Merge to 'lowe'.
['low', ' ', 'lowe', 'r', ' ', 'lowe', 's', 't']

Continue until vocabulary size target...
```

**특성:**
- 학습된 어휘가 주어지면 토큰화가 결정적
- 흔한 단어는 단일 토큰이 되는 경향
- 희귀 단어는 서브워드로 분할

### WordPiece

BERT 계열 모델에서 사용한다.

**BPE와의 핵심 차이:**
- BPE: 빈도 기반 병합
- WordPiece: 우도(likelihood) 개선 기반 병합

```
Score = freq(AB) / (freq(A) * freq(B))
```

이는 무작위 동시 출현보다 더 의미 있는 병합을 선호하게 한다.

**시각적 표시:** WordPiece는 이어지는 토큰에 ## 접두사를 사용한다:
```
"embedding" becomes ["em", "##bed", "##ding"]
```

### Unigram (SentencePiece)

T5, ALBERT, 일부 다국어 모델에서 사용한다.

**학습 알고리즘:**
1. 큰 후보 어휘로 시작
2. 각 토큰을 제거했을 때의 손실을 계산
3. 손실을 가장 적게 늘리는 토큰을 제거
4. 목표 어휘 크기에 도달할 때까지 반복

**핵심 차이:** 빈도가 아니라 확률로 동작한다. 초기의 비최적 병합에서 회복할 수 있다.

### 비교

| 알고리즘 | 병합 기준 | 토큰화 | 사용처 |
|-----------|-----------------|--------------|---------|
| BPE | 빈도 | 결정적 | GPT, Llama, Qwen |
| WordPiece | 우도 | 결정적 | BERT, DistilBERT |
| Unigram | 확률 | 확률적 | T5, mT5, XLNet |

---

## 어휘 설계 트레이드오프

### 어휘 크기

| 크기 | 예시 | 장점 | 단점 |
|------|---------|------|------|
| 작음(10K) | 일부 초기 모델 | 작은 임베딩 | 긴 토큰 시퀀스 |
| 중간(32K) | Llama 2, Mistral 7B | 좋은 균형 | 다국어 비효율 |
| 큼(100K-152K) | GPT-4 (cl100k), Llama 3 (128K), DeepSeek V3·V4.1 (~129K), Mistral Tekken (~131K), Qwen3 (~152K) | **오픈 모델의 흔한 기본값.** 높은 압축률. | 더 큰 임베딩 테이블 |
| 매우 큼(200K+) | GPT-4o~GPT-5.x (o200k, ~200K), Llama 4 (~202K), Gemma 3 (~262K) | 멀티모달·다국어 효율 | LM Head에서의 메모리 압박 |

Anthropic과 Google은 Claude와 Gemini의 어휘 크기를 공개하지 않으며, tiktoken은 OpenAI가 공개한 인코딩(GPT-4o~GPT-5.x용 o200k_base)만 다룬다. 토크나이저를 로드해 확인할 수 없는 모델이라면, 대체 토크나이저가 아니라 공급사의 토큰 계산 API나 응답의 `usage` 필드로 세라.

**어휘 확장 심층 분석:**
- **Llama 3 (128K)**: Meta는 tiktoken의 10만 토큰에 비영어권 언어를 겨냥한 2.8만 토큰을 더했고, 같은 텍스트에 대해 Llama 2보다 최대 15% 적은 토큰을 보고했다. Llama 4는 ~202K로 갔다.
- **GPT-4o~GPT-5.x (o200k_base)**: cl100k 어휘를 두 배로 늘려 코드와 비영어 텍스트의 압축을 개선했고, 토큰당 단가가 같아도 의미 단위당 비용이 낮아졌다.
- **같은 단가, 다른 청구서**: 토크나이저 변경은 정가 변동 없이도 청구액을 바꾼다. Anthropic 문서에 따르면 Claude 4.7 이후 모델은 같은 텍스트에 대해 이전 Claude보다 약 30% 더 많은 토큰을 만드는 새 토크나이저를 쓰며, 정확한 증가폭은 내용에 따라 다르다. 모델 계열을 바꿀 때마다 토큰 수 기준을 다시 잡아라.

### 문자 vs 서브워드 vs 단어

| 세분도 | 예시 | "running"의 토큰 | 트레이드오프 |
|-------------|---------|---------------------|-----------|
| 문자 | ByT5 | ['r','u','n','n','i','n','g'] | 어떤 텍스트도 처리하나 매우 긴 시퀀스 |
| 서브워드 | GPT | ['running'] 또는 ['run','ning'] | 좋은 균형 |
| 단어 | 초기 NLP | ['running'] | 짧은 시퀀스지만 OOV 처리 불가 |

현대 LLM은 어휘 크기와 시퀀스 길이의 균형을 위해 보편적으로 서브워드 토큰화를 쓴다.

### 바이트 수준 BPE

GPT-2는 바이트 수준 BPE를 도입했다:
- 기본 어휘가 문자가 아니라 256개 바이트
- UNK 토큰 없이 어떤 텍스트도 표현 가능
- 유니코드가 바이트 시퀀스로 자연스럽게 처리됨

```python
# Character-level: Needs explicit handling of characters
text = "cafe"  # Unknown character might become [UNK]

# Byte-level: Works with any text (no UNK needed)
text = "cafe"  # Becomes bytes, then BPE operates on bytes
```

---

## 특수 토큰

특수 토큰은 일반 텍스트 밖의 구조 정보를 처리한다:

| 토큰 | 용도 | 예 |
|-------|---------|---------|
| BOS | 시퀀스 시작 | 생성 시작 신호 |
| EOS | 시퀀스 끝 | 완료 신호 |
| PAD | 패딩 | 배치를 같은 길이로 채움 |
| UNK | 미지 토큰 | OOV 대비(바이트 BPE에서는 드묾) |
| SEP | 구분자 | 세그먼트 분할(BERT 방식) |

### 챗 템플릿

현대 챗 모델은 대화 구조를 위해 특수 토큰을 쓴다:

**Llama 2 형식:**
```
[INST] <<SYS>>
You are a helpful assistant.
<</SYS>>

User message here [/INST] Assistant response here
```

**ChatML (OpenAI 방식):**
```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
Hello!<|im_end|>
<|im_start|>assistant
Hi there!<|im_end|>
```

**왜 중요한가:**
- 형식이 틀리면 결과가 나빠진다
- 특수 토큰은 사전학습 데이터에 없다
- transformers 같은 라이브러리는 chat_template로 자동 포맷팅한다

---

## 다국어 토큰화

### 과제

주로 영어로 학습된 토크나이저는 다른 언어에서 효율이 떨어진다:

| 언어 | "Hello"의 토큰 | 동등한 인사말의 토큰 |
|----------|-------------------|-------------------------------|
| 영어 | 1 ("Hello") | - |
| 중국어 | - | 동등 표현에 2-3+ |
| 일본어 | - | 동등 표현에 3-5+ |
| 한국어 | - | 동등 표현에 2-4+ |

**비용 함의:** 영어 중심 토크나이저에서는 비영어 사용자가 의미 단위당 2~3배를 더 낸다. 최신의 더 큰 어휘는 주요 언어에서 격차를 좁히지만 없애지는 못한다.

### 해법

1. **다국어 학습 코퍼스:** 균형 잡힌 다국어 데이터로 토크나이저 학습
2. **더 큰 어휘:** 비영어 토큰을 위한 여유 확보
3. **언어별 토크나이저:** 언어군별 별도 토크나이저

**다국어 지원이 좋은 모델:**
- mT5, XLM-R: 100개 이상 언어로 학습
- 최신 GPT·Claude·Qwen 모델: 폭넓은 다국어 커버리지의 큰 어휘
- Gemini: 처음부터 다국어 설계

동등한 영어 텍스트 대비 대략적인 토큰 배수(예시일 뿐이며, 비율이 도메인·문자 체계에 따라 다르므로 자신의 코퍼스로 측정하라):

| 토크나이저 | 중국어 | 일본어 | 한국어 | 힌디어 |
|-------|---------|----------|--------|--------|
| GPT-2 | 2.5x | 3.0x | 2.8x | 6.0x |
| GPT-4 (cl100k) | 1.4x | 1.6x | 1.5x | 3.2x |
| o200k (GPT-4o~GPT-5.x) | 1.1x | 1.2x | 1.1x | 1.4x |
| Llama 3 (128K) | 1.2x | 1.3x | 1.2x | 1.5x |

---

## 멀티모달 토큰화 (픽셀→토큰)

현대 네이티브 멀티모달 모델은 이미지를 단지 "보는" 게 아니라 토큰화한다.

### 이미지 토큰화(비전 트랜스포머)
이미지는 패치(예: 14x14 픽셀)로 쪼개진다. 각 패치는 비전 인코더(SigLIP 등)를 거쳐 하나의 시각 토큰이 된다.
- **고정 토큰 비용**: 대부분의 모델은 특정 해상도에서 이미지당 고정된 토큰 수를 쓴다(예: 이미지당 256 또는 729 토큰).
- **동적 해상도**: 일부 모델(Gemini 3)은 이미지 종횡비와 디테일 수준에 따라 가변 토큰 수를 쓴다.
- **인코더 없는 방식**: Gemma 4 12B "Unified"(2026년 6월)는 비전 인코더를 생략하고, 원시 이미지 패치와 오디오 파형을 경량 선형 레이어로 LLM 임베딩 공간에 투영한다. 이 경우 토큰 비용이 패치 수를 직접 따른다.

### 오디오/비디오 토큰화
- **오디오**: EnCodec 같은 코덱으로 이산 단위로 압축한 뒤 오디오 토큰 시퀀스로 표현.
- **비디오**: 이미지 프레임 시퀀스로 취급(시간적 토큰화). 1FPS 1초 영상이 고해상도 이미지 한 장만큼의 비용이 들 수 있다.
- **에이전트형 비디오 처리**: 2026년 9월 1일부터 Gemini API는 Gemini 3.7 Flash, 3.6 Flash, 3.5 Flash-Lite(Google 문서는 3.8 Flash도 명시)에서 옵트인 `"processing": "agentic"` 모드를 제공한다. 모델이 고정 비율로 샘플링하는 대신, 어떤 구간을 어떤 속도로, 어떤 모달리티(프레임·오디오·전사본)로 볼지 스스로 정한다. Google은 표준 비디오 벤치마크에서 토큰 최대 88% 절감, 비용 최대 66% 절감을 보고하며, 정상 토큰 단가로 과금된다. 기본값은 여전히 정적 1 FPS 샘플링이므로, 고정 비율 샘플링 기반 비용 모델은 에이전트 모드 토큰을 최대 약 8배 과대 추정할 수 있다.

---

## 비용 추정을 위한 토큰 계산

### 빠른 추정 규칙

영어 텍스트 기준:
- **단어→토큰:** 단어당 약 1.3 토큰
- **문자→토큰:** 토큰당 약 4 문자
- **페이지→토큰:** 페이지당 약 500-800 토큰

```python
def estimate_tokens(text: str) -> int:
    # Rough estimation for English
    word_count = len(text.split())
    return int(word_count * 1.3)
```

### 정확한 계산

모델별 토크나이저를 쓰거나, 토크나이저가 공개되지 않았다면 공급사의 계산 엔드포인트를 쓴다:

```python
import tiktoken

# For OpenAI models (tiktoken ships OpenAI encodings only; o200k_base
# covers GPT-4o through GPT-5.x)
encoding = tiktoken.get_encoding("o200k_base")
tokens = encoding.encode("Your text here")
token_count = len(tokens)

# For open-weight models, use the model's own Hugging Face tokenizer
from transformers import AutoTokenizer
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
tokens = tokenizer.encode("Your text here")
token_count = len(tokens)

# For Claude, the tokenizer is not public: call the count_tokens endpoint
import anthropic
client = anthropic.Anthropic()
count = client.messages.count_tokens(
    model="claude-sonnet-5-5",
    messages=[{"role": "user", "content": "Your text here"}],
)
token_count = count.input_tokens
```

Gemini에는 동등한 `countTokens` 호출이 있고, OpenAI의 Responses API에는 tiktoken이 매핑하지 않는 모델을 위한 입력 토큰 계산 엔드포인트가 있다. Claude나 Gemini 토큰을 tiktoken으로 추정하지 마라. 어휘가 다르면 같은 텍스트라도 수치가 다르다.

### 추론(reasoning) 토큰

추론 모델에서는 눈에 보이는 답변이 출력 청구의 일부일 뿐이다. 사고/추론 토큰은 OpenAI·Anthropic·Google 모델에서 원시 추론이 반환되지 않더라도 출력으로 과금되며, 그 양은 설정한 effort나 thinking 수준에 달렸다. 보이는 응답 길이가 아니라 실제 트래픽의 API `usage` 필드로 예산을 잡아라.

### 비용 계산

```python
# USD per 1M tokens, standard tier list prices as of October 2026.
# Excludes cache reads/writes, batch discounts and long-context surcharges
# (OpenAI bills the whole request at higher rates above 272K input tokens).
PRICING = {
    "gpt-6-sol": {"input": 2.00, "output": 10.00},
    "gpt-6-luna": {"input": 0.10, "output": 0.50},
    "claude-sonnet-5-5": {"input": 2.00, "output": 10.00},
}

def calculate_cost(input_tokens: int, output_tokens: int, model: str) -> float:
    """Token counts come from the response's usage field (output includes
    reasoning tokens), not from re-tokenizing text with a different tokenizer."""
    rates = PRICING[model]
    return (
        (input_tokens / 1_000_000) * rates["input"] +
        (output_tokens / 1_000_000) * rates["output"]
    )
```

---

## 흔한 토큰화 문제

### 문제 1: 토큰 경계 불일치

**문제:** 텍스트 연산이 토큰 경계와 어긋날 수 있다.

```python
text = "Hello world"
# Tokens: ["Hello", " world"]  # Note: space is part of second token

# Truncating at character 6 ("Hello ") splits a token
```

**해법:** 문맥을 관리할 때는 항상 토큰 경계에서 자른다.

### 문제 2: 일관되지 않은 토큰화

**문제:** 같은 텍스트가 문맥에 따라 다르게 토큰화된다.

```python
# GPT tokenizer example
"New York"     # Might be ["New", " York"]
"NewYork"      # Might be ["New", "York"]
" New York"    # Might be [" New", " York"]
```

**함의:** 토큰 수는 주변 텍스트에 따라 달라질 수 있다. 항상 전체 문맥을 토큰화하라.

### 문제 3: 코드와 구조화 데이터

**문제:** 코드와 JSON은 종종 비효율적으로 토큰화된다.

```python
# Python code often tokenizes poorly
"def calculate_average(numbers):"
# Becomes many tokens: ["def", " calculate", "_", "average", "(", "numbers", "):", ...]

# JSON keys tokenize individually
'{"firstName": "John"}'
# Many tokens for structure
```

**완화책:**
- 일부 모델은 코드 최적화 토크나이저를 가진다
- 보내기 전에 JSON 압축을 고려하라
- 가능하면 구조화 출력 모드를 사용하라

### 문제 4: 공백 처리

**문제:** 토크나이저마다 공백을 다르게 처리한다.

```python
# Leading spaces often become separate tokens
" Hello"  # [" ", "Hello"] or [" Hello"]

# Multiple spaces may merge or stay separate
"Hello  world"  # Behavior varies by tokenizer
```

**모범 사례:** 토큰화 전에 공백을 정규화하라.

---

## 실전 토큰화 패턴

### 패턴 1: 문맥 창 관리

```python
def fit_to_context(
    system_prompt: str,
    user_message: str,
    history: list[str],
    max_tokens: int = 8000,
    reserve_for_output: int = 2000
) -> str:
    # Use the target model's tokenizer; o200k_base fits OpenAI models only
    encoding = tiktoken.get_encoding("o200k_base")
    
    available = max_tokens - reserve_for_output
    
    # System prompt always included
    tokens_used = len(encoding.encode(system_prompt))
    available -= tokens_used
    
    # User message always included
    tokens_used = len(encoding.encode(user_message))
    available -= tokens_used
    
    # Add history from most recent, drop oldest if needed
    included_history = []
    for msg in reversed(history):
        msg_tokens = len(encoding.encode(msg))
        if msg_tokens <= available:
            included_history.insert(0, msg)
            available -= msg_tokens
        else:
            break
    
    return format_prompt(system_prompt, included_history, user_message)
```

### 패턴 2: 토큰 경계에서 청킹

```python
def chunk_at_token_boundaries(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50
) -> list[str]:
    encoding = tiktoken.get_encoding("o200k_base")
    tokens = encoding.encode(text)
    
    chunks = []
    start = 0
    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)
        start = end - overlap
    
    return chunks
```

### 패턴 3: 토큰 예산 할당

```python
class TokenBudget:
    def __init__(self, total: int):
        self.total = total
        self.allocated = {}
    
    def allocate(self, component: str, tokens: int) -> bool:
        used = sum(self.allocated.values())
        if used + tokens > self.total:
            return False
        self.allocated[component] = tokens
        return True
    
    def remaining(self) -> int:
        return self.total - sum(self.allocated.values())

# Usage
budget = TokenBudget(total=8000)
budget.allocate("system_prompt", 500)
budget.allocate("retrieved_context", 2000)
budget.allocate("user_message", 200)
budget.allocate("output_reserve", 2000)
# Remaining: 3300 tokens for conversation history
```

---

## 면접 질문

### Q: LLM은 왜 단순한 글자 수 세기를 어려워하는가?

**좋은 답변:**
토큰화는 텍스트를 글자가 아니라 서브워드 단위로 변환한다. "strawberry에 'r'이 몇 개?"라고 물으면, 모델은 개별 글자가 아니라 ["str", "aw", "berry"] 같은 토큰을 본다.

모델은 직접 관찰하지 못하는 토큰의 내부 구조를 추론해야 한다. 이는 토큰의 글자 구성을 암기하거나 계산하는 능력을 요구하는데, 항상 신뢰할 수 있는 창발적 능력은 아니다.

해법은 모델에게 먼저 단어를 한 글자씩 풀어 쓰게 한 뒤 세게 하는 것이다. 이렇게 하면 글자 수준 토큰이 강제로 생성된다.

### Q: 비용 계획을 위해 토큰 수를 어떻게 추정하겠는가?

**좋은 답변:**
대략 추정: 영어 텍스트는 단어 수에 1.3을 곱한다.

정확한 계산: 모델별 토크나이저를 쓴다.
- OpenAI: 제공되는 인코딩은 tiktoken(GPT-4o~GPT-5.x는 o200k_base); 매핑되지 않는 모델은 Responses API 입력 토큰 계산 엔드포인트나 `usage` 필드
- 오픈 가중치 모델: 해당 모델의 Hugging Face 토크나이저
- Claude·Gemini: 공급사의 토큰 계산 엔드포인트(토크나이저 비공개)

중요 고려 사항:
- 비영어 텍스트는 토큰을 더 쓴다: 최신 128K-200K 어휘의 주요 언어는 약 1.1-1.5배, 구형 토크나이저와 커버리지가 낮은 문자 체계는 3배 이상
- 코드와 구조화 데이터는 비효율적으로 토큰화됨
- 출력 토큰(입력의 3-6배 단가; 최신 프런티어 대부분 5배)에 항상 여유를 두라. 출력으로 과금되고 effort 수준에 비례하는 추론 토큰 포함
- 시스템 프롬프트, 도구 정의, 포맷팅 토큰도 포함하라
- 같은 텍스트가 공급사마다 다른 토큰 수가 들므로, 토큰 단가가 아니라 완료된 과제당 비용을 비교하라

프로덕션 비용 추정에서는 실제 요청을 샘플링해 API `usage` 필드의 실제 토큰 사용량을 측정하고 안전 마진을 적용한다. 토크나이저 변경(Anthropic에 따르면 Claude 4.7 이후는 같은 텍스트에 약 30% 더 많은 토큰)이나 새 기본 effort 수준은 단가 변동 없이 청구액을 바꾸므로, 모델 마이그레이션마다 측정을 다시 돌린다.

### Q: 모델 간에 토크나이저를 바꾸면 무슨 일이 생기는가?

**좋은 답변:**
모든 모델 계열은 자신만의 토크나이저를 가진다. 모델 간 토큰 재사용이 불가능한 이유:

1. **어휘가 다름:** 토큰 ID가 다른 문자열을 의미
2. **병합 규칙이 다름:** 같은 텍스트가 다르게 쪼개짐
3. **특수 토큰이 다름:** 챗 포맷팅이 다름

실무적 함의:
- 토큰 계산에는 항상 올바른 토크나이저를 쓴다
- 캐시된 임베딩은 모델 전용이다
- 프롬프트 템플릿은 모델별 조정이 필요하다
- 파인튜닝 모델은 베이스의 토크나이저를 상속한다

### Q: RAG 청킹을 위한 토큰화를 어떻게 처리하는가?

**좋은 답변:**
핵심 고려 사항:

1. **토큰 경계에서 청킹:** 토큰 중간에서 자르면 디코딩 시 텍스트가 깨진다
2. **템플릿 토큰 반영:** 시스템 프롬프트, 포맷팅이 토큰을 소비한다
3. **여유 두기:** 검색된 청크와 질문이 문맥에 들어가야 한다

구현 접근:
```python
# Determine available tokens for chunks
available = max_context - system_prompt_tokens - question_tokens - output_reserve

# Chunk with overlap at token boundaries
chunks = chunk_at_token_boundaries(document, chunk_size=500, overlap=50)

# Select chunks until budget exhausted
selected = []
tokens_used = 0
for chunk in ranked_chunks:
    chunk_tokens = count_tokens(chunk)
    if tokens_used + chunk_tokens <= available:
        selected.append(chunk)
        tokens_used += chunk_tokens
```

---

## 참고 문헌

- Sennrich et al. "Neural Machine Translation of Rare Words with Subword Units" (BPE, 2016)
- Wu et al. "Google's Neural Machine Translation System" (WordPiece, 2016)
- Kudo and Richardson "SentencePiece: A simple and language independent subword tokenizer" (2018)
- OpenAI tiktoken library: https://github.com/openai/tiktoken
- Anthropic token counting: https://platform.claude.com/docs/en/build-with-claude/token-counting
- HuggingFace tokenizers: https://github.com/huggingface/tokenizers

---

*이전: [LLM 내부 구조](01-llm-internals.md) | 다음: [어텐션 메커니즘](03-attention-mechanisms.md)*
