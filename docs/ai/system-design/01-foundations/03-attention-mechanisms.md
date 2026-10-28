---
title: 어텐션 메커니즘
sidebar_position: 3
description: 어텐션의 수학적 기초, 변형, 최적화 — 스케일드 닷-프로덕트, 멀티헤드, 희소/선형 어텐션, Flash Attention, MLA, KV 캐시까지.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/01-foundations/03-attention-mechanisms.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 어텐션 메커니즘

:::tip 입문 먼저
개념이 처음이라면 SecureNomad 입문 문서 [어텐션과 트랜스포머 (기술 심화)](../../deep-dive/attention.md)를 먼저 보세요.
:::


어텐션은 트랜스포머를 가능하게 한 핵심 혁신이다. 이 장은 시스템 설계와 면접에 필수적인 수학적 기초, 변형, 최적화를 다룬다.

## 어텐션 기초

### 핵심 아이디어

어텐션은 시퀀스의 각 위치가 다른 모든 위치에서 정보를 모으도록 한다. 정보를 단계별로 넘기는 순환과 달리, 어텐션은 직접 연결을 만든다.

**분산 시스템 엔지니어를 위한 멘탈 모델:**
- RNN: 체인을 따라 메시지 전달
- 어텐션: 모든 노드가 다른 모든 노드에 질의하는 Pub/Sub

### Query, Key, Value 프레임워크

어텐션은 입력의 세 가지 투영(projection)을 쓴다:

| 구성 요소 | 역할 | 비유 |
|-----------|------|---------|
| Query (Q) | 나는 무엇을 찾는가? | 검색 쿼리 |
| Key (K) | 나는 무엇을 담는가? | 문서 색인 |
| Value (V) | 나는 무엇을 기여하는가? | 문서 내용 |

```python
# Input: x of shape [batch, seq_len, d_model]

Q = x @ W_q  # [batch, seq_len, d_k]
K = x @ W_k  # [batch, seq_len, d_k]
V = x @ W_v  # [batch, seq_len, d_v]
```

---

## 스케일드 닷-프로덕트 어텐션

가장 기본적인 어텐션 연산:

```python
def scaled_dot_product_attention(Q, K, V, mask=None):
    d_k = Q.shape[-1]
    
    # Compute attention scores
    scores = Q @ K.transpose(-2, -1)  # [batch, seq_len, seq_len]
    scores = scores / math.sqrt(d_k)  # Scale
    
    # Apply mask (for causal attention)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))
    
    # Convert to probabilities
    attention_weights = F.softmax(scores, dim=-1)
    
    # Weighted sum of values
    output = attention_weights @ V
    
    return output, attention_weights
```

### 왜 √d_k로 스케일링하는가?

**면접 단골**: 수치 직관을 시험하는 질문이다.

스케일링이 없으면 내적은 차원에 따라 커진다:
- 성분이 독립이고 평균 0, 분산 1인 차원 d의 q, k에 대해
- E[q · k] = 0 이지만 Var[q · k] = d
- 표준편차 = sqrt(d)

d가 크면(512 이상) 내적이 매우 크거나 작아질 수 있다. 큰 값에 대한 소프트맥스는 원-핫에 가까워져 기울기가 사라진다.

```python
# Demonstration
import numpy as np

d = 512
q = np.random.randn(d)
k = np.random.randn(d)

unscaled = np.dot(q, k)      # Magnitude ~ sqrt(512) ~ 22
scaled = unscaled / np.sqrt(d)  # Magnitude ~ 1
```

### 인과적 마스킹(Causal Masking)

자기회귀 생성에서는 각 위치가 이전 위치에만 주의를 기울일 수 있다:

```python
def create_causal_mask(seq_len):
    # Lower triangular matrix
    mask = torch.tril(torch.ones(seq_len, seq_len))
    return mask

# Example for seq_len=4:
# [[1, 0, 0, 0],
#  [1, 1, 0, 0],
#  [1, 1, 1, 0],
#  [1, 1, 1, 1]]
```

mask=0인 위치는 음의 무한대 점수를 받아 소프트맥스 후 0이 된다.

---

## 멀티헤드 어텐션

하나의 어텐션 함수 대신, 서로 다른 측면에 주의를 기울이는 여러 "헤드"를 쓴다:

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
    
    def forward(self, x, mask=None):
        batch_size, seq_len, d_model = x.shape
        
        # Project to Q, K, V
        Q = self.W_q(x)  # [batch, seq_len, d_model]
        K = self.W_k(x)
        V = self.W_v(x)
        
        # Reshape to multiple heads
        Q = Q.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        # Now: [batch, num_heads, seq_len, d_k]
        
        # Attention per head
        attn_output, _ = scaled_dot_product_attention(Q, K, V, mask)
        
        # Concatenate heads
        attn_output = attn_output.transpose(1, 2).contiguous()
        attn_output = attn_output.view(batch_size, seq_len, d_model)
        
        # Final projection
        output = self.W_o(attn_output)
        return output
```

**왜 여러 헤드인가?**
1. 헤드마다 다른 패턴을 학습(구문, 의미, 상호 참조)
2. 표현의 다양성을 제공(앙상블 효과)
3. 헤드 간 병렬 연산 가능

### 헤드 수 패턴

| 모델 | d_model | 헤드 | 헤드당 d_k |
|-------|---------|-------|--------------|
| BERT-base | 768 | 12 | 64 |
| GPT-2 | 768 | 12 | 64 |
| GPT-3 175B | 12288 | 96 | 128 |
| Llama 2 70B | 8192 | 64 | 128 |

헤드당 d_k가 64나 128로 모델 크기에 걸쳐 놀랍도록 일관된다.

---

## 어텐션 패턴

### 어텐션이 학습하는 것

헤드마다 다른 패턴에 특화된다:

| 패턴 유형 | 포착하는 것 | 예 |
|--------------|------------------|---------|
| 위치적 | 인접 토큰 | 다음/이전 단어 |
| 구문적 | 문법 관계 | 주어-동사 |
| 의미적 | 의미 관계 | 상호 참조 |
| 구분자 | 구두점, 구조 | 섹션 경계 |
| 희귀 | 드문 패턴 | 희귀 단어 복사 |

### 어텐션 시각화

어텐션 가중치는 어떤 위치가 어디에 주의를 기울이는지 보여주는 히트맵으로 시각화할 수 있다:

```
Query positions (rows) vs Key positions (columns)

"The cat sat on the mat"

         The  cat  sat  on   the  mat
The     [□    ○    ○    ○    ○    ○ ]
cat     [●    □    ○    ○    ○    ○ ]
sat     [○    ●    □    ○    ○    ○ ]
on      [○    ○    ●    □    ○    ○ ]
the     [○    ○    ○    ○    □    ○ ]
mat     [○    ●    ○    ●    ●    □ ]

● = high attention, ○ = low attention
```

"mat"은 "cat"(의미적), "on"(구문적), "the"(한정사)에 강하게 주의를 기울인다.

---

## 효율적 어텐션 변형

표준 어텐션은 시퀀스 길이에 대해 O(n^2)이다. 여러 변형이 이를 줄인다:

### 희소 어텐션(Sparse Attention)

모든 위치가 아니라 일부 위치에만 주의를 기울인다:

| 변형 | 패턴 | 복잡도 | 예 |
|---------|---------|------------|---------|
| 지역(Local) | 각 위치 주변 창 | O(n * w) | Longformer |
| 스트라이드(Strided) | k번째마다 | O(n^2 / k) | Sparse Transformer |
| 전역(Global) | 특수 토큰이 전역에 주의 | O(n * g) | Longformer, BigBird |
| 블록(Block) | 블록 대각 어텐션 | O(n * b) | BigBird |

**Longformer 패턴:**
```
Local window + Global tokens

[G] [L] [L] [L] [L] [G] [L] [L] [L] [L]

G: Global tokens (attend to/from all)
L: Local tokens (attend within window)
```

### 선형 어텐션(Linear Attention)

소프트맥스를 선형화 가능한 대안으로 바꾼다:

```python
# Standard attention (quadratic)
attention = softmax(Q @ K.T) @ V

# Linear attention approximation
attention = (Q @ (K.T @ V))  # Associativity trick
```

**변형:**
- Performer: 랜덤 특성 근사
- Linear Transformer: elu(Q) @ (elu(K).T @ V)
- 게이트 선형 어텐션(Gated DeltaNet, Kimi Delta Attention): 학습된 게이트와 델타 규칙 상태 갱신을 더한 것으로, 2026년 하이브리드가 실제로 채택한 방식

**트레이드오프:** 빠르지만 품질이 떨어진다. 특히 정밀한 어텐션(먼 과거 토큰의 정확한 회상)이 필요한 과제에서 그렇다. 그래서 프로덕션 모델은 완전 선형으로 가지 않고 선형 레이어를 완전/희소 어텐션 레이어와 번갈아 배치한다.

### 복잡도 비교

| 방식 | 시간 | 공간 | 품질 | 비고 |
|--------|------|-------|---------|-------|
| 표준 | O(n^2) | O(n^2) | 최고 | 기준선 |
| 희소(Longformer) | O(n) | O(n) | 최고에 근접 | 긴 문서용 |
| 선형(Performer) | O(n) | O(n) | 저하 | 매우 긴 문서에 최선 |
| Flash Attention | O(n^2) | O(n) | 최고 | 정확한 어텐션, IO 인식 커널 |
| 하이브리드(선형/SWA + 일부 완전/희소 레이어) | 대부분 O(n) | 대부분 O(n) | 최고에 근접 | 2026 오픈 플래그십에 흔함 |

### 2026년 오픈 모델의 하이브리드·희소 어텐션

위 변형들은 더 이상 연구에 머물지 않는다. 아래 다섯 개 플래그십 오픈 릴리스는 모두 2026년 8월 말~9월에 나왔으며, 모델 카드상 비표준 어텐션이나 KV 방식을 채택한다. 모든 릴리스가 그런 건 아니다. IBM(원문 표기)의 Granite 4.2(8월 25일)는 평범한 GQA 밀집 트랜스포머다.

| 모델(출시) | 어텐션 방식 | KV 영향 |
|-----------------|------------------|----------------|
| Qwen3.8-Flash-Next (8/26) | 네 레이어 중 세 개는 Gated DeltaNet 선형 어텐션, 넷째는 Qwen Sparse Attention | 네 개 중 한 레이어만 증가하는 KV 캐시 유지; 선형 레이어는 고정 크기 상태 |
| GLM-5.3-Flash (8/26) | 네 레이어 중 세 개는 Kimi Delta Attention(선형), 넷째는 MLA 잠재 위에서 DeepSeek식 희소 어텐션 | 약 네 개 중 한 레이어가 증가하는(압축된) KV 캐시 유지; Z.ai는 이 하이브리드가 장문맥 서빙 비용을 크게 줄인다고 밝힘 |
| Tencent Hy4 preview (8/28) | MLA 잠재 캐시 위에서 IndexCache를 쓰는 게이트형 DeepSeek Sparse Attention | 캐시는 토큰·레이어당 512차원 잠재 + 64차원 RoPE 키를 저장; 각 쿼리는 선택된 상위 2,048개 키만 읽음 |
| DeepSeek V4.1-Flash (9/10) | 인과적 인코더-디코더(디코더 전역 KV를 인코더 상태에서 투영), Compressed Sparse Attention 2, FP4 메인 KV | 토큰당 전역 KV 890바이트; DeepSeek은 V4-Flash 대비 약 4배, DeepSeek-V1 대비 약 437배 적다고 밝힘 |
| MiMo-V2.6-Pro (9/21) | 슬라이딩 윈도 60개 레이어(128토큰 창) + 전역 10개 레이어 | 70개 중 10개 레이어만 문맥에 따라 증가 |

다섯 모델 모두 1M 토큰 문맥을 지원한다(Qwen3.8-Flash-Next는 네이티브 262K에서 YaRN으로).

**시스템 설계에서 바뀌는 점:**
- **KV 산정은 아키텍처별이다.** `2 x layers x kv_heads x head_dim x bytes`는 Llama식 GQA에 맞지만(70B에서 토큰당 320 KiB) 이 모델들에는 맞지 않는다. DeepSeek V4.1-Flash는 토큰당 전역 KV 890바이트로, 위 Llama 수치보다 약 370배 적다. 890바이트는 전역 캐시만 포함한다. 모델 카드는 슬라이딩 윈도 KV도 기술하는데, 이는 문맥에 따라 증가하지 않고 창 길이로 상한된다. 따라서 이 비율은 짧은 요청의 총 캐시 메모리가 아니라 장문맥 증가분을 설명한다. 파라미터 수가 아니라 config·모델 카드의 토큰당 KV 바이트를 비교하고, 공개 수치가 캐시의 어느 부분을 포함하는지 확인하라.
- **희소 어텐션은 덜 읽을 뿐, 자동으로 덜 저장하진 않는다.** 인덱서 기반 방식은 쿼리당 상위 k개 키를 고르므로 장문맥에서 어텐션 연산과 대역폭을 줄이지만, 캐시는 희소 어텐션이 압축과 짝지어질 때만 줄어든다(Hy4의 MLA 잠재, V4.1-Flash의 압축 FP4 KV).
- **프리픽스 캐싱에는 하이브리드 인식 엔진이 필요하다.** 슬라이딩 윈도·선형 레이어는 평범한 토큰당 KV 리스트가 아닌 상태를 지닌다. SGLang v0.5.20의 SWA 인식 래딕스 트리는 공유 시스템 프롬프트가 있는 DeepSeek-V4-Flash에서 토큰 적중률을 43.8%→60.8%로 높이고 평균 TTFT를 1.57초→1.07초로 줄였다(SGLang 보고). 프리픽스 캐시 절감을 가정하기 전에 엔진 버전이 해당 아키텍처의 캐시 레이아웃을 지원하는지 확인하라.

---

## Flash Attention

Flash Attention은 정확한 어텐션을 계산하면서 O(n) 메모리를 달성하는 최신 구현이다.

### 해결하는 문제

표준 어텐션은 n x n 어텐션 행렬을 메모리에 실체화해야 한다:
- 8K 문맥: 6400만 실수 = 레이어·헤드당 256 MB
- 100K 문맥: 100억 실수 = 레이어·헤드당 40 GB

이 메모리 요구가 배치 크기와 문맥 길이를 제한한다.

### 작동 방식

Flash Attention은 타일링과 재계산으로 전체 어텐션 행렬 저장을 피한다:

```
Standard: Q, K -> Attention Matrix (n x n) -> Output
Flash:    Q, K -> Tiles (block_size x block_size) -> Incremental Output
```

**핵심 아이디어:**
1. SRAM에 들어가는 블록 단위로 어텐션 처리
2. 전체 어텐션 행렬을 HBM에 실체화하지 않음
3. 역전파 중 어텐션 재계산(HBM에서 로드하는 것보다 빠름)

### FlashAttention-2 (작업 분할)
헤드와 시퀀스 길이에 걸친 병렬성을 개선해 A100/H100에 최적화.

### FlashAttention-3 (FP8 & H100 최적화)
**Hopper(H100/H200)의 표준 커널:**
- **비동기 실행**: 워프 특수화와 TMA(Tensor Memory Accelerator)로 GEMM(행렬곱)과 소프트맥스를 중첩.
- **FP8 지원**: H100에서 FP16 최대 740 TFLOPS 대비 FP8로 1.2 PFLOPS에 근접. 블록 양자화와 비간섭 처리(이상치를 분산시키는 아다마르 회전)로 FP8 오차를 낮게 유지.
- **속도 향상**: FP16에서 FlashAttention-2 대비 약 1.5~2.0배(모든 수치는 논문 보고).

### FlashAttention-4 (Hopper & Blackwell)
FlashAttention-3은 Hopper만 대상으로 한다. **FlashAttention-4**는 CuTe DSL로 작성되어 Hopper와 Blackwell(H100, B200)을 모두 대상으로 하며, 별도 패키지(`flash-attn-4`)로 제공되는데 2026년 9월까지도 4.0.0 베타였다. Blackwell급 부품의 서빙 엔진은 다른 어텐션 백엔드(FlashInfer, 벤더 커널)도 제공하므로, 어텐션 처리량을 인용하기 전에 엔진이 실제로 어떤 백엔드를 선택하는지 확인하라.

---

## 멀티헤드 잠재 어텐션(MLA)

DeepSeek-V2에서 도입되어 V3로 이어진 **MLA는 극심한 KV 캐시 압박에 대한 GQA의 현대적 대안**이다.

MLA는 헤드를 그룹화하는 데 그치지 않고, 캐시에 저장하기 전에 Key와 Value 벡터를 **저차원 잠재 공간**으로 압축한다.

```
Query (Up-projected) ────────┐
                             ▼
Key, Value (Down-projected) ─▶ [Low-dim Latent Cache] ─▶ [Output]
                             ▲
                             └─ Projection Matrices
```

| 지표 | MHA | GQA | MLA |
|--------|-----|-----|-----|
| KV 캐시 크기 | 100% | 12.5% | **수 퍼센트**(DeepSeek-V2는 토큰·레이어당 576값 캐시, 128헤드 기준 MHA의 약 1.8%; DeepSeek은 밀집 DeepSeek 67B보다 93.3% 작은 캐시를 보고) |
| 품질 | 기준선 | 기준선에 근접 | **DeepSeek 애블레이션에서 MHA와 동등하거나 앞섬** |
| 지연 | 기준선 | 더 빠름 | **장문맥에서 가장 빠름(I/O 감소)** |

**MLA가 이기는 이유**: 캐시는 토큰당 하나의 압축 잠재와 작은 위치 키만 담는다. 디코드 시 업프로젝션 행렬이 쿼리·출력 투영에 흡수되므로, 잠재가 전체 K·V로 다시 확장되지 않는다. RoPE는 이 흡수를 막기 때문에 MLA는 **디커플드 RoPE**를 쓴다. 별도의 작은 회전 차원 집합이 위치를 담당한다. 그 결과 장문맥에서 디코드 스텝당 메모리 대역폭이 훨씬 줄어든다.

MLA는 DeepSeek 밖으로 퍼졌고(Kimi K2가 사용, Tencent Hy4·GLM-5.3-Flash의 희소 어텐션 레이어도 512차원 KV 잠재 위에 놓임), DeepSeek 자신의 V4 라인은 Compressed Sparse Attention과 Heavily Compressed Attention의 하이브리드로 옮겨갔다. 2026년 오픈 모델의 하이브리드·희소 어텐션을 참고하라.

---

## KV 캐시 최적화 & 컨텍스트 캐싱

### 컨텍스트 캐싱(시스템 수준)
API 공급사(OpenAI, Gemini, Anthropic, DeepSeek)는 **컨텍스트 캐싱(프롬프트 캐싱)**을 제공한다.
- **작동 방식**: 긴 "프리픽스"(예: 10만 토큰 법전)의 KV 텐서를 미리 계산·저장했다가, 이후 요청이 같은 바이트로 시작하면 재사용.
- **지연 이점**: 캐시된 프리픽스의 프리필을 건너뛰므로, 프롬프트가 공유되는 비율만큼 TTFT가 절감된다.
- **비용 이점**: 캐시 읽기는 현재 대부분의 OpenAI·Anthropic·Google 모델에서 입력의 0.1배, Claude Opus 5.5와 GPT-6.1 Sol은 0.05배, Claude Fable 5.1은 0.025배로 과금된다. 다른 벤더는 다르다(xAI Grok 4.7은 0.25배; DeepSeek V4.1-Flash 캐시 적중은 0.02배). 쓰기는 추가 비용이 든다: OpenAI GPT-5.6 이후는 1.25배(고정 30분 TTL), Anthropic 5분 캐싱도 1.25배, Anthropic 1시간 캐시는 2배이며, Google은 대신 명시적 캐시 저장을 시간당 과금한다. 최신 요율은 [가격과 비용](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/03-pricing-and-costs.md), 설계 패턴은 [KV 캐시와 컨텍스트 캐싱](https://github.com/ombharatiya/ai-system-design-guide/blob/main/04-inference-optimization/02-kv-cache-and-context-caching.md)을 참고하라.

### 슬라이딩 윈도 어텐션(SWA)
레이어의 어텐션을 고정 창(Mistral 7B: 4,096 토큰)으로 제한해, 그 레이어의 KV 캐시가 문맥에 따라 더 이상 증가하지 않게 한다. 현대 모델은 장거리 회상이 살아남도록 SWA 레이어를 소수의 전역 레이어와 번갈아 둔다. Gemma 3은 전역 레이어당 지역 5개, MiMo-V2.6-Pro는 슬라이딩 윈도 60개(128토큰 창)와 전역 10개를 쓴다.

### 멀티쿼리 어텐션(MQA)

모든 쿼리 헤드가 하나의 K와 V를 공유:

```python
# Standard MHA
Q: [batch, num_heads, seq, d_k]  # 32 heads
K: [batch, num_heads, seq, d_k]  # 32 separate K
V: [batch, num_heads, seq, d_k]  # 32 separate V

# MQA
Q: [batch, num_heads, seq, d_k]  # 32 heads
K: [batch, 1, seq, d_k]          # 1 shared K
V: [batch, 1, seq, d_k]          # 1 shared V
```

**효과:** KV 캐시 크기 32배 감소, 약간의 품질 손실.

### 그룹 쿼리 어텐션(GQA)

쿼리 헤드 그룹이 K와 V를 공유:

```python
# GQA with 8 KV heads for 64 query heads (8:1 ratio)
Q: [batch, 64, seq, d_k]  # 64 query heads
K: [batch, 8, seq, d_k]   # 8 KV heads
V: [batch, 8, seq, d_k]   # 8 KV heads

# Each KV head serves 8 query heads
```

**효과:** 품질 손실을 최소화하며 KV 캐시 8배 감소.

**GQA를 쓰는 모델:**
- Llama 2 70B, Llama 3.x 70B: 64 쿼리 헤드에 8 KV 헤드
- Llama 3.1 405B: 128 쿼리 헤드에 8 KV 헤드
- Llama 4 Maverick: 40 쿼리 헤드에 8 KV 헤드
- Mistral 7B: 32 쿼리 헤드에 8 KV 헤드
- Gemma: 다양한 구성

### 비교

| 어텐션 | KV 캐시 | 품질 | 모델 |
|-----------|----------|---------|--------|
| MHA | 전체 | 최고 | GPT-3 |
| GQA | 일반적으로 1/8 | 최고에 근접 | Llama 2 70B, Llama 3, Mistral |
| MQA | 1/n_heads | 저하 | PaLM, Falcon |
| MLA | 압축 잠재, MHA의 수 퍼센트 | DeepSeek 애블레이션에서 MHA와 동등 | DeepSeek-V2·V3 계열, Kimi K2, Tencent Hy4 |

---

## 실무적 함의

### 시스템 설계 관점

1. **배치 크기 vs 문맥 트레이드오프:**
   - 총 GPU 메모리 = 모델 + KV 캐시 * 배치 크기
   - 긴 문맥일수록 배치가 작아짐
   - GQA 모델은 더 많은 동시 요청을 처리 가능

2. **지연 예산 배분:**
   - 어텐션은 O(n^2) 연산이다. Flash Attention은 연산이 아니라 메모리를 O(n)으로 만든다
   - 프리필(프롬프트 처리)은 프롬프트 길이에 비례
   - 디코드(생성)는 생성 길이 + 프롬프트 길이에 비례

3. **메모리 대역폭 병목:**
   - 생성은 흔히 메모리 바운드
   - 각 디코드 스텝은 가중치(작은 배치에서 지배적)와 KV 캐시(장문맥·큰 배치에서 지배적)를 다시 읽음
   - 큰 배치는 가중치 읽기를 분할 상환하지만, KV 읽기는 요청을 추가할 때마다 늘어남

### 프리필 vs 디코드

| 단계 | 연산 패턴 | 병목 |
|-------|-----------------|------------|
| 프리필 | 모든 입력 토큰 처리 | 연산(GPU 코어) |
| 디코드 | 한 번에 한 토큰 생성 | 메모리(대역폭) |

이것이 TTFT(첫 토큰까지 시간)와 TPS(초당 토큰)를 따로 측정하는 이유다.

### 문맥 길이 스케일링

| 문맥 | 어텐션 연산 | KV 캐시, Llama 3.x 70B (GQA, BF16) | 동일 형태 완전 MHA |
|---------|-------------------|-------------------------------------|--------------------------|
| 4K | 기준선 | 1.3 GB | 10.7 GB |
| 8K | 4x | 2.7 GB | 21.5 GB |
| 32K | 64x | 10.7 GB | 86 GB |
| 128K | 1024x | 43 GB | 344 GB |

장문맥에는 다음이 필요하다:
- Flash Attention(메모리 효율)
- GQA, MQA 또는 MLA(작은 KV 캐시), 또는 하이브리드 어텐션 아키텍처
- FP8 KV 캐시(위 BF16 수치의 절반)와 호스트 DRAM으로의 오프로드
- 경우에 따라 모델 병렬화

---

## 면접 질문

### Q: 어텐션 메커니즘과 그것이 왜 이차적으로 확장되는지 설명하라.

**좋은 답변:**
어텐션은 모든 위치 간의 쌍별 상호작용을 계산한다. n개 위치에 대해:

1. Q @ K^T가 n x n 점수 행렬을 만든다
2. 각 어텐션 점수는 쿼리와 키의 내적
3. 총: n^2 내적

이는 시퀀스 길이에 대해 이차적이다. 8K 토큰이면 레이어·헤드당 6400만 쌍별 점수, 128K면 160억이다.

이차 확장이 문맥 길이를 제한한다. 해법:
- Flash Attention: 연산 O(n^2)이지만 메모리 O(n)
- 희소 어텐션: 부분집합에 주의해 O(n)
- 선형 어텐션: O(n) 근사
- 하이브리드: 깊이 대부분은 선형/슬라이딩 윈도 레이어, 정밀 회상을 위한 소수의 완전/희소 어텐션 레이어(2026 오픈 플래그십 대부분의 방식)

### Q: KV 캐시란 무엇이며 서빙에 왜 결정적인가?

**좋은 답변:**
자기회귀 생성 중에는 한 번에 한 토큰씩 만든다. 캐싱이 없으면 새 토큰마다 이전 모든 위치의 K·V를 다시 계산해야 한다.

KV 캐시는 이전 위치의 K·V 텐서를 저장한다. 새 토큰마다:
1. 새 위치에 대해서만 Q, K, V 계산
2. 새 K, V를 캐시에 추가
3. 전체 캐시된 K, V에 주의

이로써 투영 계산의 토큰당 복잡도가 O(n)에서 O(1)로 줄어든다.

비용은 메모리다: KV 캐시는 시퀀스 길이에 선형으로 증가한다. Llama 70B 8K 문맥에서 GQA(8 KV 헤드)로 요청당 약 2.7GB이고, 완전 MHA면 약 21GB다. 128K에서는 GQA로도 약 43GB다. 이는 배치 크기와 처리량을 직접 제한한다.

GQA·MQA는 쿼리 헤드 간 K, V 공유로, MLA는 K, V를 잠재로 압축해 이를 줄인다. FP8 KV는 바이트를 절반으로 만든다.

### Q: MHA, GQA, MQA를 비교하라.

**좋은 답변:**
| 변형 | K,V 헤드 | KV 캐시 | 품질 | 용도 |
|---------|-----------|----------|---------|----------|
| MHA | Q 헤드와 동수 | 전체 | 최고 | 학습, 품질 중시 |
| GQA | Q 헤드보다 적음 | 감소 | MHA에 근접 | 프로덕션 서빙 |
| MQA | 1 | 최소 | 저하 | 메모리 제약 |

MHA: 각 쿼리 헤드가 자신의 K, V를 가짐. 최고 품질이지만 가장 큰 KV 캐시.

GQA: 쿼리 헤드 그룹이 K, V를 공유. Llama 2 70B는 64 쿼리 헤드에 8 KV 헤드(8:1). 품질 손실 최소로 8배 작은 캐시.

MQA: 모든 쿼리 헤드가 하나의 K, V를 공유. 최대 메모리 절감이지만 측정 가능한 품질 저하. PaLM에서 사용.

서빙에는 GQA가 최선의 트레이드오프다. MHA와 거의 동일한 품질로 더 큰 배치(더 높은 처리량)를 가능하게 한다.

### Q: Flash Attention은 어떻게 O(n) 메모리를 달성하는가?

**좋은 답변:**
표준 어텐션은 전체 n x n 어텐션 행렬을 GPU 메모리에 실체화한다. Flash Attention은 이를 피한다:

1. **타일링:** 온칩 SRAM에 들어가는 Q, K 블록 단위로 처리
2. **온라인 소프트맥스:** 모든 점수를 저장하지 않고 소프트맥스를 점진적으로 계산
3. **재계산:** 역전파 시 저장값을 로드하는 대신 어텐션을 재계산

핵심 통찰은 온칩 SRAM이 HBM보다 한 자릿수 빠르지만 아주 작다는 점이다. FlashAttention 논문의 A100 수치: SM당 192 KB SRAM(108개 SM에 걸쳐 약 20 MB)을 약 19 TB/s로, HBM 40-80 GB를 1.5-2.0 TB/s로. SRAM에서 산술을 더 하고 HBM 읽기/쓰기를 줄여, Flash Attention은 더 빠르면서 메모리도 덜 쓴다.

결과는 근사가 아닌 정확한 어텐션으로, 원 논문 기준 O(n) 메모리와 표준 대비 2-4배 속도다. FlashAttention-3은 Hopper, FlashAttention-4는 Blackwell까지 대상으로 한다.

### Q: 2026년 새 오픈 가중치 모델의 KV 캐시를 어떻게 산정하겠는가?

**좋은 답변:**
교과서 공식만으로는 안 된다. `2 x layers x kv_heads x head_dim x bytes`는 모든 레이어가 모든 토큰의 완전한 K, V를 저장한다고 가정하는데, Llama식 GQA에는 맞지만(BF16 70B에서 토큰당 320 KiB) 현재 오픈 플래그십에는 맞지 않는다:

- **하이브리드 레이어:** MiMo-V2.6-Pro는 128토큰 창의 슬라이딩 윈도 60개와 전역 10개 레이어라, 전역 레이어만 문맥에 따라 증가한다. Qwen3.8-Flash-Next는 네 개 중 세 레이어에서 고정 크기 선형 어텐션 상태를 유지한다.
- **압축/공유 KV:** DeepSeek V4.1-Flash는 디코더 전역 KV를 인코더 상태에서 투영하고 FP4 메인 KV를 저장해, 토큰당 전역 KV 890바이트(DeepSeek 보고)로 Llama 70B 수치보다 300배 이상 적다. 이는 슬라이딩 윈도 KV(창으로 상한된 요청당 고정량)를 제외한 값이라, 격차는 장문맥에서 가장 크다.
- **정밀도:** FP8 KV는 BF16의 절반, FP4는 다시 절반(품질 점검 동반).

내 절차: `config.json`(레이어 유형, 창 크기, KV 헤드나 잠재 차원, KV dtype)을 읽고, 공개된 벤더의 토큰당 KV 수치를 취한 뒤, 하이브리드 캐시 레이아웃 지원이 버전마다 다르므로 실제 문맥 분포에서 대상 엔진의 실제 캐시 사용량을 측정한다. 용량은 (HBM − 가중치)를 P95 문맥 길이의 요청당 KV로 나눈 값에, 엔진이 지원하는 호스트 메모리 오프로드 계층을 더해 산출된다.

---

## 참고 문헌

- Vaswani et al. "Attention Is All You Need" (2017)
- Dao et al. "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness" (2022)
- Dao "FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning" (2023)
- Shah et al. "FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision" (2024)
- DeepSeek-AI "DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model" (MLA, 2024)
- Beltagy et al. "Longformer: The Long-Document Transformer" (2020)
- Ainslie et al. "GQA: Training Generalized Multi-Query Transformer Models" (2023)
- Shazeer "Fast Transformer Decoding: One Write-Head is All You Need" (MQA, 2019)
- [Flash Attention Repository](https://github.com/Dao-AILab/flash-attention)

---

*이전: [토큰화 심층 분석](02-tokenization-deep-dive.md) | 다음: [트랜스포머 아키텍처](04-transformer-architecture.md)*
