---
title: 트랜스포머 아키텍처
sidebar_position: 4
description: 입력 처리부터 트랜스포머 블록, 출력 처리, 임베딩 공유, 현대적 변형(하이브리드 MoE·MLA)과 스케일링 특성까지 — 완전한 트랜스포머 구조의 통합적 이해.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/01-foundations/04-transformer-architecture.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 트랜스포머 아키텍처

이 장은 완전한 트랜스포머 아키텍처를 종합적으로 보여주며, 앞선 장들의 구성 요소를 하나의 이해로 모은다.

## 아키텍처 개요

디코더 전용 트랜스포머(GPT-3, Llama와 대부분 오픈 모델의 아키텍처이며, 설계가 공개되지 않은 비공개 프런티어 모델에도 널리 가정됨)는 다음으로 구성된다:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Token Embeddings                            │
│              + Position Embeddings (or RoPE)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐      │
│    │                  Transformer Block                   │      │
│    │  ┌─────────────────────────────────────────────┐    │      │
│    │  │              RMSNorm/LayerNorm              │    │      │
│    │  └───────────────────┬─────────────────────────┘    │      │
│    │                      ▼                              │      │
│    │  ┌─────────────────────────────────────────────┐    │      │
│    │  │         Masked Multi-Head Attention         │    │      │
│    │  │            (with KV Cache)                  │    │      │
│    │  └───────────────────┬─────────────────────────┘    │      │
│    │                      │                              │      │
│    │                  + Residual                         │      │
│    │                      │                              │      │
│    │  ┌─────────────────────────────────────────────┐    │      │
│    │  │              RMSNorm/LayerNorm              │    │      │
│    │  └───────────────────┬─────────────────────────┘    │      │
│    │                      ▼                              │      │
│    │  ┌─────────────────────────────────────────────┐    │      │
│    │  │             Feed-Forward Network            │    │      │
│    │  │               (SwiGLU/GELU)                 │    │      │
│    │  └───────────────────┬─────────────────────────┘    │      │
│    │                      │                              │      │
│    │                  + Residual                         │      │
│    └──────────────────────┴──────────────────────────────┘      │
│                           │                                     │
│                    Repeat × N layers                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Output RMSNorm                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Language Model Head                           │
│              (Linear: hidden_dim → vocab_size)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                         Logits
```

---

## 입력 처리

### 토큰 임베딩

토큰 ID를 밀집 벡터로 변환한다:

```python
class TokenEmbedding(nn.Module):
    def __init__(self, vocab_size, d_model):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
    
    def forward(self, token_ids):
        return self.embedding(token_ids)
```

**차원:**
- 입력: [batch_size, seq_len] 토큰 ID
- 출력: [batch_size, seq_len, d_model] 임베딩

### 위치 정보

위치는 다음 중 하나로 반영된다:

**1. 회전 위치 임베딩(RoPE):**
임베딩에 더하지 않고 어텐션 내부에서 적용:
```python
def apply_rope(q, k, positions):
    # Rotate q and k vectors based on position
    freqs = compute_frequencies(positions)
    q_rotated = rotate_embeddings(q, freqs)
    k_rotated = rotate_embeddings(k, freqs)
    return q_rotated, k_rotated
```

**2. 학습된 위치 임베딩:**
토큰 임베딩에 직접 더함:
```python
position_embeddings = nn.Embedding(max_seq_len, d_model)
x = token_embeddings + position_embeddings(positions)
```

**현대 오픈 모델(Llama, Mistral, Qwen, DeepSeek, Gemma)은 길이 일반화를 위해 RoPE를 쓰며**, 학습된 창을 늘리기 위해 흔히 YaRN 같은 스케일링 기법을 함께 쓴다. 비공개 연구소는 위치 인코딩을 공개하지 않는다.

---

## 트랜스포머 블록

### Pre-Norm 구조

현대 트랜스포머는 사전 정규화(pre-normalization)를 쓴다:

```python
class TransformerBlock(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.attn_norm = RMSNorm(config.d_model)
        self.attn = GroupedQueryAttention(
            d_model=config.d_model,
            n_heads=config.n_heads,
            n_kv_heads=config.n_kv_heads
        )
        self.ff_norm = RMSNorm(config.d_model)
        self.ff = SwiGLUFFN(
            d_model=config.d_model,
            d_ff=config.d_ff
        )
    
    def forward(self, x, mask=None, kv_cache=None):
        # Attention with residual
        h = x + self.attn(self.attn_norm(x), mask, kv_cache)
        
        # FFN with residual
        out = h + self.ff(self.ff_norm(h))
        
        return out
```

### 어텐션 구성 요소

```python
class GroupedQueryAttention(nn.Module):
    def __init__(self, d_model, n_heads, n_kv_heads):
        super().__init__()
        self.n_heads = n_heads
        self.n_kv_heads = n_kv_heads
        self.head_dim = d_model // n_heads
        
        self.q_proj = nn.Linear(d_model, n_heads * self.head_dim)
        self.k_proj = nn.Linear(d_model, n_kv_heads * self.head_dim)
        self.v_proj = nn.Linear(d_model, n_kv_heads * self.head_dim)
        self.o_proj = nn.Linear(n_heads * self.head_dim, d_model)
    
    def forward(self, x, mask, kv_cache):
        B, T, D = x.shape
        
        # Project
        q = self.q_proj(x).view(B, T, self.n_heads, self.head_dim)
        k = self.k_proj(x).view(B, T, self.n_kv_heads, self.head_dim)
        v = self.v_proj(x).view(B, T, self.n_kv_heads, self.head_dim)
        
        # Apply RoPE
        q, k = apply_rope(q, k, positions)
        
        # Update KV cache
        if kv_cache is not None:
            k = torch.cat([kv_cache.k, k], dim=1)
            v = torch.cat([kv_cache.v, v], dim=1)
            kv_cache.update(k, v)
        
        # Repeat KV heads for GQA
        k = k.repeat_interleave(self.n_heads // self.n_kv_heads, dim=2)
        v = v.repeat_interleave(self.n_heads // self.n_kv_heads, dim=2)
        
        # Attention (using Flash Attention in practice)
        attn_out = flash_attention(q, k, v, mask)
        
        # Output projection
        out = self.o_proj(attn_out.view(B, T, -1))
        return out
```

### 피드포워드 네트워크

```python
class SwiGLUFFN(nn.Module):
    def __init__(self, d_model, d_ff):
        super().__init__()
        # SwiGLU has 3 projections instead of 2
        self.gate_proj = nn.Linear(d_model, d_ff, bias=False)
        self.up_proj = nn.Linear(d_model, d_ff, bias=False)
        self.down_proj = nn.Linear(d_ff, d_model, bias=False)
    
    def forward(self, x):
        gate = F.silu(self.gate_proj(x))  # SiLU = Swish
        up = self.up_proj(x)
        return self.down_proj(gate * up)
```

SwiGLU의 **FFN 은닉 차원**은 보통 모델 차원의 2.7~3.5배다(표준 GELU FFN의 4배 대비). 8/3(약 2.67배)에서 세 개의 SwiGLU 행렬은 2-행렬 4배 FFN과 같은 파라미터를 갖는다. Llama 2 7B는 약 2.7배, Llama 2 70B와 Llama 3은 3.5배로 넓힌다.

### RMSNorm

```python
class RMSNorm(nn.Module):
    def __init__(self, d_model, eps=1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(d_model))
        self.eps = eps
    
    def forward(self, x):
        rms = torch.sqrt(torch.mean(x ** 2, dim=-1, keepdim=True) + self.eps)
        return self.weight * (x / rms)
```

평균 중심화를 생략하므로 LayerNorm보다 단순하고 빠르다.

---

## 출력 처리

### 최종 정규화

마지막 트랜스포머 블록 뒤에 RMSNorm을 적용:

```python
hidden_states = self.output_norm(hidden_states)
```

### 언어 모델 헤드

어휘 크기로 투영:

```python
class LMHead(nn.Module):
    def __init__(self, d_model, vocab_size):
        super().__init__()
        self.linear = nn.Linear(d_model, vocab_size, bias=False)
    
    def forward(self, x):
        return self.linear(x)  # Returns logits
```

### 예측 얻기

```python
# During generation
logits = lm_head(hidden_states[:, -1, :])  # Last position only
next_token = sample(logits)

# During training
logits = lm_head(hidden_states)  # All positions
loss = cross_entropy(logits, targets)
```

## 비공유 vs 공유 임베딩

**공유(Tied — GPT-2, T5, Gemma, 소형 Llama 3.2·Qwen 모델):** 가중치 공유(Weight Tying)
- 출력 헤드가 입력 임베딩과 가중치를 공유.
- **장점**: 메모리 절약(vocab_size * hidden_dim).
- **단점**: 입력과 출력 잠재 공간이 동일하도록 강제해, 최적이 아닐 수 있음.

**비공유(Untied — 7B 이상 Llama 1~3, 대부분의 대형 오픈 모델):** 별도 출력 헤드
- 출력 헤드가 자신만의 가중치를 가짐.
- **크기가 결정하는 이유**: 128K-262K 어휘에서는 임베딩 테이블이 소형 모델의 큰 비중을 차지한다. Llama 3.2 1B의 테이블은 약 2.63억 파라미터(128,256 x 2,048)로 모델의 약 1/5, Gemma 3 1B는 약 3억(262,144 x 1,152)으로 거의 1/3이다. 공유는 이를 아낀다. 70B+에서는 테이블이 반올림 오차 수준이라, 연구소들은 공유를 풀고 출력 헤드를 특화시킨다.
- **시스템 영향**: 비공유는 로드·서빙에 vocab_size x d_model 파라미터를 더한다. 엣지 모델에서는 공유 여부가 기기 메모리에 들어가느냐 마느냐를 가르는 경우가 많다.

---

## 현대적 아키텍처 변형

### Llama 2/3 아키텍처

| 구성 요소 | 구현 |
|-----------|----------------|
| 어텐션 | 그룹 쿼리 어텐션(GQA) |
| 위치 | 회전 위치 임베딩(RoPE) |
| 정규화 | RMSNorm(pre-norm) |
| 활성화 | SwiGLU |
| 편향 | 선형 레이어에 편향 없음 |

### Mistral 7B 아키텍처

Llama와 동일하되 추가:
- **슬라이딩 윈도 어텐션:** 각 레이어가 4K 토큰에만 주의
- 정보는 쌓인 레이어를 통해 여전히 더 멀리 전파됨(이론적 범위가 깊이에 따라 증가)
- 이후 Mistral 릴리스는 순수 SWA를 버렸고, 이 아이디어는 슬라이딩 윈도와 전역 레이어를 번갈아 두는 형태로 살아남음(Gemma 2·3, gpt-oss, MiMo-V2.6-Pro 같은 2026 모델; 아래 참고)

### 전문가 혼합(MoE) & 하이브리드 아키텍처

최신 오픈 모델은 밀집 블록과 희소 블록을 섞고, 점점 어텐션 유형도 섞는다:
- **밀집 레이어 + 공유 전문가**: 일부 설계는 앞쪽 레이어를 밀집으로 유지하고(DeepSeek-V3: 처음 3개; Tencent Hy4: 처음 1개), 다른 설계는 밀집과 MoE 레이어를 번갈아 둔다(Llama 4 Maverick). 많은 모델이 라우팅 전문가와 함께 모든 토큰이 통과하는 **공유 전문가**를 둔다(DeepSeek V4.1-Flash: 라우팅 384 + 공유 1, 토큰당 라우팅 6개 활성; Hy4: 라우팅 256 + 공유 1, top-8).
- **하이브리드 어텐션**: 선형 어텐션이나 슬라이딩 윈도 레이어가 깊이 대부분을 담당하고, 정밀 회상을 위한 소수의 완전/희소 어텐션 레이어를 둔다(Qwen3.8-Flash-Next: 네 개 중 세 레이어에 Gated DeltaNet; MiMo-V2.6-Pro: 슬라이딩 윈도 60개 + 전역 10개). [어텐션 메커니즘](03-attention-mechanisms.md)을 참고하라.
- **전문가 병렬(Expert Parallelism)**: 서로 다른 전문가를 서로 다른 GPU에 분산. 이는 **노드 간 대역폭**(NVLink/InfiniBand)과 all-to-all 통신을 주요 아키텍처 병목으로 만들며, 서빙 스택이 어텐션-FFN 분리(어텐션은 한 풀, 전문가는 다른 풀)를 실험하는 이유다.

### 멀티헤드 잠재 어텐션(MLA) 통합
[DeepSeek-V3](03-attention-mechanisms.md)와 이를 채택한 모델(Kimi K2, Tencent Hy4)의 어텐션 블록은 표준 K/V 투영을 저랭크 잠재 압축으로 대체한다.
- **아키텍처 전환**: 이제 "KV 캐시"는 압축된 잠재 표현이며, 트랜스포머 블록 전체의 메모리/연산 비율을 바꾼다.
- **MLA 너머**: DeepSeek의 V4 라인은 이를 Compressed Sparse Attention과 Heavily Compressed Attention의 하이브리드로 대체했고, V4.1-Flash는 디코더의 KV를 인코더 상태에서 투영한다. 이제 "KV 캐시"는 아키텍처가 정의하는 무엇이든 될 수 있으며, KV 산정을 모델 카드에서 시작해야 하는 이유다.

### 선택의 비교

| 선택 | 과거 방식 | 현대 방식 | 이점 |
|--------|--------------|-----------------|---------|
| 정규화 | Post-LN | Pre-LN / RMSNorm | 학습 안정성, 속도 |
| 위치 | 사인파/학습 | RoPE | 더 나은 외삽 |
| 활성화 | GELU | SwiGLU | 품질(벤치마크 +1%) |
| 어텐션 | MHA | GQA; 2026 오픈 플래그십에선 MLA·하이브리드 레이어 | GQA로 KV 캐시 8배 축소, MLA·하이브리드로 훨씬 더 |
| 편향 | 편향 있음 | 편향 없음 | 파라미터 감소, 유사 품질 |

---

## 스케일링 특성

### 파라미터 수

| 구성 요소 | 파라미터 |
|-----------|------------|
| 토큰 임베딩 | vocab_size * d_model |
| 레이어당 Q/K/V | 3 * d_model * d_model (MHA) |
| 레이어당 O 투영 | d_model * d_model |
| 레이어당 FFN | 3 * d_model * d_ff (SwiGLU) |
| LM 헤드 | d_model * vocab_size (소형 모델은 공유) |

**디코더 전용 근사:**
```
Total ≈ 12 * n_layers * d_model^2 (for d_ff = 4 * d_model, MHA)
```

이는 4배의 2-행렬 FFN을 가정한다. d_ff = 8/3 * d_model의 SwiGLU FFN은 레이어당 동일한 8 * d_model^2를 준다. GQA와 더 넓은 SwiGLU FFN은 비율을 바꾸며, 임베딩 테이블이 vocab_size * d_model을 추가로 더한다.

### 연산 요구량

**학습:** 토큰당 FLOPs ≈ 6 * 파라미터(순전파 + 역전파)

**추론:** 토큰당 FLOPs ≈ 2 * 파라미터(순전파만)

MoE 모델은 두 공식 모두 활성 파라미터를 쓴다. 메모리는 여전히 총 파라미터에 비례한다.

### 스케일링 법칙

친칠라 스케일링 법칙은 최적 배분을 제안한다:

```
D (데이터 토큰) ≈ 20 * N (파라미터)
```

70B 모델이면 연산 최적 학습을 위해 약 1.4T 토큰으로 학습한다.

**그러나:** 많은 현대 모델은 더 나은 추론 효율을 위해 친칠라 대비 과잉 학습한다. Llama 2는 2T 토큰으로, Llama 3 8B는 15T 이상으로 학습되었는데, 이는 파라미터당 약 1,900 토큰으로 친칠라 비율의 약 95배다.

---

## 아키텍처 비교표

| 모델 | 파라미터 | 레이어 | d_model | 헤드 | KV 헤드 | FFN | 문맥 |
|-------|--------|--------|---------|-------|----------|-----|---------|
| GPT-3 | 175B | 96 | 12288 | 96 | 96 | GELU | 2K |
| Llama 2 70B | 70B | 80 | 8192 | 64 | 8 | SwiGLU | 4K |
| Llama 3.1 405B | 405B | 126 | 16384 | 128 | 8 | SwiGLU | 128K |
| DeepSeek V3 | 671B (활성 37B) | 61 | 7168 | 128 | MLA | MoE | 128K |
| Llama 4 Maverick | 400B (활성 17B) | 48 | 5120 | 40 | 8 | MoE, 레이어 교대 | 1M |
| DeepSeek V4.1-Flash | 백본 552B (프리필 8B / 디코드 16B 활성) | 40 (인코더 20 + 디코더 20) | 5120 | 64 | 압축(인코더 투영) | MoE, 384 + 공유 1 | 1M |

Mistral 7B(미표시)는 모든 레이어에서 슬라이딩 윈도 어텐션을 쓴다. 2026 오픈 모델은 대신 슬라이딩 윈도·선형 어텐션 레이어를 전역 레이어와 번갈아 둔다.

하단 행에서 두 가지 추세가 두드러진다: 활성 파라미터가 총 파라미터와 함께 늘지 않게 되었고, KV 설계(MLA, 압축, 하이브리드)가 이제 레이어 수나 폭보다 모델 간 차이가 크다. GPT·Claude·Gemini 구성은 비공개다.

---

## 면접 질문

### Q: 트랜스포머의 순전파를 처음부터 설명하라.

**좋은 답변:**
텍스트를 생성하는 디코더 전용 모델에서:

1. **토큰화:** 입력 텍스트를 토큰 ID로 변환

2. **임베딩:** 임베딩 테이블에서 토큰 임베딩 조회

3. **각 트랜스포머 레이어마다:**
   - 입력에 RMSNorm 적용
   - Q, K, V 투영 계산
   - 위치를 위해 Q, K에 RoPE 적용
   - 생성 시: 새 K, V를 KV 캐시에 추가
   - 어텐션 계산(마스킹되어 각 위치는 이전만 봄)
   - 어텐션 출력 투영 후 잔차 더하기
   - RMSNorm 적용
   - SwiGLU 피드포워드 통과
   - 잔차 더하기

4. **출력 정규화:** 최종 RMSNorm 적용

5. **LM 헤드:** 어휘 크기로 투영해 로짓 획득

6. **샘플링:** temperature/top-p로 로짓에서 다음 토큰 선택

생성 시에는 새 토큰마다 3-6단계를 반복하며 이전 위치의 KV 캐시를 재사용한다.

### Q: Pre-norm과 Post-norm의 차이는?

**좋은 답변:**
차이는 레이어 정규화가 서브레이어(어텐션, FFN) 기준 어디에 적용되느냐다:

**Post-norm(원래 트랜스포머):**
```
x = LayerNorm(x + Sublayer(x))
```
잔차를 더한 뒤 정규화.

**Pre-norm(현대 트랜스포머):**
```
x = x + Sublayer(LayerNorm(x))
```
서브레이어 전에 정규화.

Pre-norm이 선호되는 이유:
1. 기울기가 잔차 연결을 통해 더 직접적으로 흐름
2. 특히 깊은 모델에서 학습이 더 안정적
3. 초기화와 학습률에 덜 민감
4. Post-LN이 의존하는 긴 학습률 워밍업 없이 학습 가능(대부분의 학습은 여전히 짧은 워밍업 사용)

비용은 일부 벤치마크에서 약간 낮은 최종 성능이지만, 대형 모델에는 학습 안정성이 그만한 가치가 있다.

### Q: GQA를 설명하고 서빙에 왜 중요한지 말하라.

**좋은 답변:**
그룹 쿼리 어텐션(GQA)은 Key와 Value 헤드를 Query 헤드 그룹 간에 공유한다.

표준 멀티헤드 어텐션: 쿼리 헤드 64, KV 헤드 64(1:1)
GQA: 쿼리 헤드 64, KV 헤드 8(8:1)

구현: 각 KV 헤드가 반복을 통해 8개 쿼리 헤드에 쓰인다.

**왜 중요한가:**
KV 캐시는 생성 중 모든 위치의 K, V를 저장한다. Llama 70B 8K 문맥에서:
- MHA: 토큰당 2.6 MB * 8K = 요청당 21 GB
- GQA(8:1): 토큰당 320 KiB * 8K = 요청당 약 2.7 GB

8배 감소가 가능하게 하는 것:
- 더 큰 배치(더 많은 동시 사용자)
- 더 긴 문맥
- 낮은 GPU 메모리 요구

품질 영향: 작다. GQA 논문은 업트레이닝된 GQA가 MQA 디코드 속도에 가깝게, MHA 품질에 근접함을 발견했고, 그래서 오픈 모델의 기본값이 되었다.

### Q: GPT-2와 Llama 2 사이에 무엇이 바뀌었나?

**좋은 답변:**
주요 아키텍처 개선:

| 구성 요소 | GPT-2 | Llama 2 |
|-----------|-------|---------|
| 정규화 | Post-LayerNorm | Pre-RMSNorm |
| 위치 | 학습된 절대 | RoPE(회전) |
| 활성화 | GELU | SwiGLU |
| 어텐션 | MHA | GQA(70B) |
| 편향 | 있음 | 제거 |

영향:
- RMSNorm: 더 빠르고 동등하게 효과적
- RoPE: 더 나은 길이 외삽
- SwiGLU: 약 1% 품질 개선
- GQA: 서빙용 KV 캐시 8배 축소
- 편향 없음: 파라미터 감소, 품질 손실 없음

이 변화들이 더 큰 모델을 더 안정적으로 학습하고 더 효율적으로 서빙하게 한다.

---

## 참고 문헌

- Vaswani et al. "Attention Is All You Need" (2017)
- Touvron et al. "Llama: Open and Efficient Foundation Language Models" (2023)
- Touvron et al. "Llama 2: Open Foundation and Fine-Tuned Chat Models" (2023)
- Llama Team, AI @ Meta. "The Llama 3 Herd of Models" (2024)
- DeepSeek-AI. "DeepSeek-V3 Technical Report" (2024)
- Zhang and Sennrich. "Root Mean Square Layer Normalization" (2019)
- Shazeer. "GLU Variants Improve Transformer" (2020)
- Su et al. "RoFormer: Enhanced Transformer with Rotary Position Embedding" (2021)
- Jiang et al. "Mistral 7B" (2023)

---

*이전: [어텐션 메커니즘](03-attention-mechanisms.md) | 다음: [임베딩과 벡터 공간](05-embeddings-and-vector-spaces.md)*
