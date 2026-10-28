---
title: 추론 최적화 (기술 심화)
sidebar_label: 추론 최적화 심화
sidebar_position: 6
description: KV 캐시, 양자화, 배칭, FlashAttention, GQA/MQA 등 LLM을 빠르고 싸게 서빙하기 위한 기술을 설명
tags: [AI, 추론, 양자화, KV캐시, 심화]
---

# 추론 최적화 (기술 심화)

:::tip 더 깊이 — AI 시스템 디자인 가이드(번역)
이 주제를 프로덕션·인터뷰 관점에서 더 깊이 다룬 번역 문서 → [추론 파이프라인](../system-design/01-foundations/06-inference-pipeline.md)
:::


:::note 전제
[어텐션 문서](./attention.md)에서 본 `O(n²)` 비용과 KV 캐시를 더 깊이 다룹니다. "모델을 **빠르고 싸게** 돌리는" 서빙 단계의 기술입니다.
:::

## 1. 추론의 두 단계

```text
Prefill  : 입력 프롬프트 전체를 한 번에 처리(병렬) → 첫 토큰까지 시간(TTFT) 결정
Decode   : 토큰을 1개씩 순차 생성 → 토큰당 시간(TPOT), 여기가 대부분의 시간
```

지표: **TTFT**(첫 토큰 지연), **TPOT/throughput**(토큰 생성 속도).

## 2. KV 캐시 — 가장 중요한 최적화

생성은 토큰을 하나씩 늘려가며 어텐션을 반복합니다. 이미 만든 토큰의 **Key·Value는 변하지 않으므로** 저장해두고 재사용합니다.

```text
캐시 없음 : 새 토큰마다 지금까지 모든 토큰의 K·V 재계산  → O(n²) 중복
KV 캐시   : 과거 K·V를 메모리에 저장, 새 토큰의 K·V만 계산 → 스텝당 O(n)
```

- 대가: **메모리** 사용. 컨텍스트가 길수록 KV 캐시가 커짐(긴 컨텍스트의 메모리 병목)
- 관리 기법: **PagedAttention**(vLLM) — KV 캐시를 페이지 단위로 관리해 낭비 감소

## 3. 양자화(Quantization) — 정밀도 낮추기

가중치를 낮은 비트로 표현해 메모리·대역폭을 줄입니다.

```text
FP16/BF16(16비트)  →  INT8(8비트)  →  INT4/NF4(4비트)
```

| 방식 | 특징 |
|---|---|
| PTQ (학습 후 양자화) | 추가 학습 없이 변환(GPTQ, AWQ 등) |
| QAT (양자화 인지 학습) | 학습 중 반영, 정확도 손실 최소 |

- 효과: 모델 크기·메모리 대폭 ↓ → 더 작은 GPU·엣지에서 구동
- 대가: 약간의 정확도 손실(4비트에서도 실용 수준인 경우 많음)

## 4. 어텐션·구조 최적화

| 기법 | 핵심 |
|---|---|
| **FlashAttention** | 어텐션을 블록 단위로 계산해 메모리 I/O↓, 속도↑ (결과는 동일) |
| **GQA / MQA** | 여러 Query head가 K·V head를 **공유** → KV 캐시 축소 |
| **MoE** (전문가 혼합) | 토큰마다 일부 전문가만 활성화 → 파라미터는 크지만 연산은 적게 |
| **Speculative Decoding** | 작은 모델이 여러 토큰을 "초안"으로 빠르게 뽑고 큰 모델이 검증 → 속도↑ |

## 5. 처리량 — 배칭

```text
Static batching   : 요청을 모아 한 번에(대기 발생)
Continuous batching: 끝난 요청 자리에 새 요청을 즉시 채움 → GPU 활용률·처리량 ↑
```

vLLM·TGI 같은 서빙 엔진이 continuous batching + PagedAttention으로 처리량을 크게 올립니다.

## 6. 트레이드오프 정리

```text
빠름·쌈  ◀───────────────▶  정확·고품질
양자화↑, 캐시공유↑, 작은모델      정밀도↑, 큰모델
```

실무는 **지연(TTFT/TPOT)·처리량·비용·품질** 사이에서 균형점을 찾는 일입니다.

## 7. 요약

| 기법 | 노리는 것 |
|---|---|
| KV 캐시 | 중복 계산 제거(필수) |
| PagedAttention | KV 메모리 효율 |
| 양자화 | 메모리·크기 ↓ |
| FlashAttention | 어텐션 속도·메모리 |
| GQA/MQA | KV 캐시 축소 |
| Speculative | 생성 속도 |
| Continuous batching | 처리량 |

- 이전: [파인튜닝과 LoRA (심화)](./finetuning-lora.md)
