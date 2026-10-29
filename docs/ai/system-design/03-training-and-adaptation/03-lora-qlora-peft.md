---
title: LoRA, QLoRA, PEFT
sidebar_position: 3
description: LLM 적응의 업계 표준 PEFT — LoRA 메커니즘, QLoRA(4비트), 고급 변형(DoRA·VeRA·RS-LoRA), 멀티-LoRA 서빙.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/03-training-and-adaptation/03-lora-qlora-peft.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# LoRA, QLoRA, PEFT

파라미터 효율 파인튜닝(PEFT)은 LLM 적응의 업계 표준이다. 이 장은 LoRA와 기타 PEFT 방법의 메커니즘과 고급 변형을 다룬다.

## PEFT 혁명

프런티어 규모 오픈 모델(Llama 3.1 405B dense, 약 1.6T 총 파라미터의 DeepSeek V4 Pro, 총 2.8T / 활성 104B의 Kimi K3)의 전체 파인튜닝은 대부분 기업에 무리이고, 비공개 프런티어 모델은 고객이 아예 전체 파인튜닝할 수 없다. PEFT가 가능하게 하는 것:
1. **메모리 효율**: QLoRA로 80 GB GPU 하나에서 70B 모델 학습.
2. **속도**: 가중치의 1% 미만만 갱신해 2배 빠른 학습.
3. **모듈성**: 가중치 재로드 없이 공유 베이스에 "스킬"(어댑터)을 바꿔 끼움.

---

## LoRA 메커니즘

LoRA(Low-Rank Adaptation)는 학습 가능한 랭크 분해 행렬을 트랜스포머 레이어에 주입한다.

```python
# The LoRA Equation for a Weight Matrix W:
h = Wx + (BA)x * (alpha/r)
```
- **W**: 사전학습 가중치(고정, 기울기 = None)
- **A, B**: LoRA 어댑터(학습 가능)
- **r**: 랭크(예: 8, 16, 64)
- **alpha**: 스케일링 인자(보통 2 × 랭크)

### 시니어 뉘앙스: 타깃 모듈
과거엔 쿼리/밸류 투영(`q_proj`, `v_proj`)만 겨냥했다.
**현대 표준**: 낮은 랭크에서도 최대 안정성·성능을 위해 **모든** 선형 레이어(`q, k, v, o, gate, up, down`)를 겨냥.

---

## QLoRA: 4비트 파인튜닝

QLoRA는 16비트 기울기를 유지하면서 베이스 모델을 4비트(NF4)로 양자화해 효율을 더 밀어붙인다.

| 최적화 | 방법 | 이점 |
|--------------|--------|---------|
| **NF4 양자화** | Normalized Float 4 | 표준 Int4보다 나은 정보 밀도 |
| **더블 양자화** | 양자화 상수를 양자화 | 파라미터당 약 0.37비트 절약(65B 모델에서 약 3 GB) |
| **페이지드 옵티마이저** | NVIDIA Unified Memory | 메모리 스파이크 때 OOM 대신 옵티마이저 상태를 CPU RAM으로 페이징 |

---

## 고급 변형

### 1. DoRA (Weight-Decomposed Low-Rank Adaptation)
DoRA는 가중치 갱신을 **크기(Magnitude)**와 **방향(Direction)**으로 분해한다.
- **결과**: 논문은 같은 랭크에서 LLaMA·LLaVA·VL-BART 과제에 걸쳐 LoRA 대비 일관된 이득을 보고하며, 약간의 추가 학습 비용으로 전체 파인튜닝과의 격차 일부를 메운다.
- **이기는 이유**: 모델이 얼마나 바꿀지와 무엇을 바꿀지를 독립적으로 조정하게 한다.

### 2. VeRA (Vector-based Random Matrix Adaptation)
학습 가능한 저랭크 행렬 `A`, `B` 대신, VeRA는 레이어 전반에 고정 랜덤 행렬 한 쌍을 공유하고 레이어별 작은 스케일링 벡터만 학습한다.
- **효율**: 각 레이어가 작은 벡터 둘만 학습하므로, VeRA는 LoRA 학습 파라미터의 **극히 일부**만 필요; 얼마나 작은지는 비교 대상 LoRA 랭크에 달렸다(랭크가 클수록 격차↑).
- **용도**: 대규모 멀티-LoRA 서빙.

### 3. RS-LoRA (Rank-Stabilized LoRA)
`alpha / sqrt(r)` 스케일링 인자를 쓴다.
- **이점**: 모델 불안정이나 낮은 학습률 없이 랭크를 (256+까지) 올릴 수 있게 한다.

---

## 멀티-LoRA 서빙(어댑터)

프로덕션 시스템은 이제 베이스 모델 하나(예: Llama 3.3 70B나 Qwen3.8-27B)를 서빙하며 같은 배치에서 어댑터를 동적으로 바꾼다.

```python
# vLLM / SGLang multi-LoRA pattern:
# Request 1 -> Base + Finance_Adapter
# Request 2 -> Base + Legal_Adapter
# Request 3 -> Base + Medical_Adapter
```
**기술**: 배치 LoRA 커널(Punica의 SGMV)이 한 디코드 스텝에서 배치의 서로 다른 행에 다른 어댑터를 적용하고, S-LoRA의 **통합 페이징**이 어댑터 가중치와 KV 캐시를 하나의 페이지드 풀에서 관리하며 유휴 어댑터는 호스트 메모리에 둔다. S-LoRA는 당시 HuggingFace PEFT·vLLM 대비 최대 4배 처리량으로 수천 개 어댑터 서빙을 보고했다. vLLM에선 `--enable-lora`, `--max-loras`(배치당 상주 어댑터), `--max-lora-rank`가 용량 손잡이다; 오버헤드는 랭크와 배치당 서로 다른 어댑터 수에 따라 늘므로 자신의 혼합으로 벤치마크하라.

**약정 전 기능 상호작용을 확인하라.** LoRA 지원은 종종 다른 서빙 기능보다 뒤처진다: 예를 들어 vLLM의 적응형 추측 검증은 2026년 8월 출시 때 LoRA를 지원하지 않았다. 어떤 테넌트의 어댑터가 추측 디코딩이나 빠른 커널 경로를 조용히 끄면, 그 테넌트의 지연 프로파일이 베이스와 달라진다.

---

## 면접 질문

### Q: LoRA alpha는 왜 보통 랭크의 2배로 두는가?

**좋은 답변:**
갱신은 `alpha/r`로 스케일되고, B는 0 초기화·A는 랜덤이라 학습이 정확히 베이스에서 시작한다. 원 LoRA 논문은 `alpha`를 (처음 시도한 랭크로) 고정해 랭크가 커질수록 `alpha/r`이 줄어들게 하는데, 이는 갱신 크기를 대략 정규화해 학습률 재튜닝 없이 `r`을 바꿀 수 있게 한다. `alpha = 2r`은 법칙이 아닌 커뮤니티 휴리스틱이다: 스케일을 2로 고정해 더 강한 갱신을 주며, 흔한 랭크(8-64)에서 더 빨리 학습되는 경향이 있다. 함정은 높은 랭크다: rsLoRA는 `r`이 커질수록 `alpha/r`이 갱신을 과도하게 줄이고 `alpha/sqrt(r)`이 안정적 스케일링임을 보인다. 그래서 고랭크 실행(256+)은 rsLoRA를 쓴다. 면접의 요점은 `alpha`와 학습률이 결합돼 있다는 것; 한 관례를 고르고 다른 하나를 튜닝하라.

### Q: DoRA란 무엇이며 표준 LoRA 대신 언제 쓰는가?

**좋은 답변:**
DoRA(Weight-Decomposed Low-Rank Adaptation)는 사전학습 가중치를 크기·방향 성분으로 분리(Weight Normalization과 유사)하고 방향에만 LoRA를 적용하면서 크기 벡터는 직접 학습하는 2024년 기법이다. 표준 LoRA는 둘을 결합하므로, 큰 크기 변화에 작은 방향 변화(또는 그 반대)를 만들기 어렵다—전체 파인튜닝이 보이는 패턴이다. 논문은 적당한 추가 학습 연산으로 같은 랭크에서 LoRA 대비 일관된 이득을 보고하며, 크기 벡터는 추론 시 병합 가능해 서빙 비용이 그대로다. 나는 이를 자동 기본값이 아니라 고위험 도메인 적응에서 LoRA와의 싼 A/B로 다룬다.

---

## 참고 문헌
- Hu et al. "LoRA: Low-Rank Adaptation of Large Language Models" (2021)
- Liu et al. "DoRA: Weight-Decomposed Low-Rank Adaptation" (2024)
- Dettmers et al. "QLoRA: Efficient Finetuning of Quantized LLMs" (2023)
- Kopiczko et al. "VeRA: Vector-based Random Matrix Adaptation" (2024)
- Sheng et al. "S-LoRA: Serving Thousands of Concurrent LoRA Adapters" (2023)
- Kalajdzievski. "A Rank Stabilization Scaling Factor for Fine-Tuning with LoRA" (rsLoRA, 2023)

---

*다음: [RLHF와 DPO](04-rlhf-and-dpo.md)*
