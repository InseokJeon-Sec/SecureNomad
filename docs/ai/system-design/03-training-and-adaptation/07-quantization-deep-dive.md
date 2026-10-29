---
title: 양자화 심층 분석
sidebar_position: 7
description: 모델 가중치 정밀도를 낮춰 메모리를 아끼고 추론을 가속하는 양자화 — 정밀도-성능 트레이드오프, 방법(NF4·AWQ·FP8·FP4), 포맷, KV 캐시 양자화, QAT.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/03-training-and-adaptation/07-quantization-deep-dive.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 양자화 심층 분석

양자화(quantization)는 모델 가중치의 정밀도를 낮춰(예: 16비트→4비트) 메모리를 아끼고 추론 속도를 높이는 과정이다. 소비자·단일 GPU 하드웨어에 대형 모델을 배포하는 주 도구이며, 2026년에는 FP4 가중치 + FP8 KV 캐시가 대표 구성인 데이터센터 서빙의 기본이기도 하다.

## 정밀도-성능 트레이드오프

전통적 모델은 **BF16**(16비트)을 쓴다. 양자화는 이를 **8비트(FP8)**, **4비트(Int4, NF4, NVFP4, MXFP4)**, 심지어 **~1.6비트 삼항(ternary)**(BitNet b1.58과 그 후손)으로 줄이려 한다.

| 정밀도 | 비트 | 가중치 크기(8B 모델) | 품질 손실 | 하드웨어 |
|-----------|------|------------------------|--------------|-------------------|
| **BF16** | 16 | 16 GB | 0%(기준선) | 모든 현대 |
| **FP8** | 8 | 8 GB | &lt; 1% | H100/H200/B200/RTX 4090 이후; AMD MI300 이후 |
| **4비트 정수(NF4, AWQ, GPTQ)** | 4 | 4.5-5 GB | 1-2% | 모든 현대 |
| **4비트 부동(NVFP4/MXFP4)** | 4 | ~4.5 GB | 좋은 보정·커널이면 작음 | NVFP4: Blackwell, Rubin. MXFP4: AMD MI350/MI455X, Blackwell |
| **2비트(순진한 PTQ)** | 2 | 2.5 GB | 10-15% | 연구/특수 |
| **삼항(학습/적응)** | ~1.6-1.7 | ~1.7 GB | 일부 27B급에서 벤더가 FP16 근접 주장 | 커스텀 커널만 |

2비트·삼항 행은 "비트"만으로 품질을 예측할 수 없음을 보인다: 순진한 2비트 PTQ는 추론을 망가뜨리지만, 삼항 가중치에 적응된 모델은 버틴다. PrismML Ternary Bonsai 2 27B(2026년 9월, Apache 2.0, Qwen3.8-27B 파생)는 5.95 GB 파일에서 가중치당 평균 1.72비트로, 14개 thinking-mode 벤치마크에서 FP16 품질의 98.2%를 보고한다(벤더 보고). PrismML의 llama.cpp·MLX 포크가 필요하다; 표준 llama.cpp는 로드할 수 없는데, 이것이 이색 포맷의 통상 대가다.

---

## 양자화 방법

### 1. NF4 (NormalFloat4)
파인튜닝(QLoRA)의 골드 스탠다드. 가중치가 정규분포를 따른다고 가정하고 16개 값 집합에 매핑.

### 2. AWQ (Activation-aware Weight Quantization)
AWQ는 약 **1% 가중치가 "현저(salient)"**(큰 활성값을 곱함)하며 양자화 오차를 지배함을 관찰한다. 이들을 고정밀로 유지하면 해결되나 하드웨어 비친화적 혼합 정밀도가 필요하므로, AWQ는 대신 **양자화 전에 현저한 입력 채널을 상향 스케일**(역스케일을 앞 연산에 접음)해 보호하면서 모든 가중치가 여전히 4비트가 되게 한다.
- **장점**: 많은 설정에서 같은 비트폭의 GPTQ보다 나은 정확도, 역전파 없음, 작은 보정 세트.

### 3. FP8
Hopper 이후 NVIDIA Transformer Engine(및 AMD MI300급)에서 하드웨어 네이티브.
- **이기는 이유**: Int8의 속도에 훨씬 넓은 동적 범위를 제공해 학습·추론 모두 안정적. 가중치·활성엔 E4M3, 범위가 더 중요한 곳(기울기)엔 E5M2.

### 4. FP4: NVFP4와 MXFP4
2026년 대표 서빙 정밀도. 둘 다 블록 스케일링의 4비트 부동(E2M1)이며, 블록 크기·스케일 포맷이 다르다:

| 포맷 | 블록 크기 | 스케일 | 어디 |
|--------|-----------|-------|------|
| **NVFP4** | 16값 | 블록당 FP8(E4M3) + 텐서당 FP32 스케일 | NVIDIA Blackwell, Rubin |
| **MXFP4**(OCP Microscaling) | 32값 | 블록당 2의 거듭제곱(E8M0) | AMD MI350·MI455X, NVIDIA Blackwell |

주류라는 증거: NVIDIA는 Vera Rubin NVL72 랙을 추론용 3,600 PFLOPS NVFP4로 평가; MLPerf Inference v6.1(2026년 9월)은 FP8→FP4 제출(FP8 KV 캐시와 NVFP4 가중치 포함); DeepSeek-V4는 FP4 MoE 전문가 가중치 + 대부분 다른 파라미터 FP8로 출시. 체크포인트는 점점 벤더 간 이식 가능: SGLang v0.5.18은 AMD에서 로드 시 NVFP4를 MXFP4로 재양자화, 5개 대형 MoE에서 GSM8K 97.5%~100.2% 회복 보고.

**커널 주의점.** 낮은 정밀도는 커널 경로가 좋을 때만 이긴다. B200/GB200의 Nemotron 3.5 Lightning용 NVIDIA 자체 Dynamo 레시피는 Marlin 커널에서 BF16이 NVFP4보다 **80% 빠르고**, CuTeDSL 커널에서도 12% 빠르다고 측정했다. vLLM v0.30.0은 SM100/103에서 기본 NVFP4 W4A16 경로를 Marlin 대신 FlashInfer CuTeDSL로 바꿔, 같은 체크포인트가 엔진 업그레이드로 속도가 바뀔 수 있다. 마이그레이션 전 정확한 모델·엔진 버전·커널 백엔드를 벤치마크하라.

---

## 파일·서빙 포맷

### GGUF (llama.cpp)
- **배포**: CPU + GPU 오프로딩; llama.cpp·Ollama·LM Studio의 로컬 포맷.
- **장점**: 크로스 플랫폼(Mac·Linux·Windows), 단일 파일, 높은 이식성.
- **단점**: 동시성 하에서 GPU 네이티브 서빙 포맷보다 느림.

### EXL2 / EXL3 (ExLlama)
- **배포**: GPU 전용(NVIDIA), 단일 사용자 로컬 추론.
- **장점**: 소비자 NVIDIA GPU에서 매우 빠르고 가중치당 비트가 유연; ExLlamaV3 EXL3는 QTIP의 간소화 변형.
- **단점**: NVIDIA 전용, 멀티테넌트 서빙 포맷 아님.

### 데이터센터 서빙 포맷
- **AWQ / GPTQ** int4 체크포인트, vLLM·SGLang·TensorRT-LLM에서 Marlin 계열 커널로 서빙.
- **FP8, NVFP4, MXFP4** 체크포인트, NVIDIA Model Optimizer·llm-compressor 등으로 생성, 종종 모델 벤더가 공식 공개(예: Granite 4.2(원문 표기)는 FP8·MXFP4·NVFP4·GGUF·MLX 빌드 제공).
- **bitsandbytes(NF4)**는 우선 학습 시 포맷: vLLM은 v0.28.0(2026년 8월)에서 bitsandbytes를 트리 외 플러그인으로 이동. 프로덕션 전 QLoRA 어댑터를 병합하고 서빙 포맷으로 재양자화하라.

---

## KV 캐시 양자화(VRAM 절약)

장문맥 서빙에서 **KV 캐시**는 종종 모델 가중치보다 많은 VRAM을 쓴다. Llama 3.1 8B(32 레이어, 8 KV 헤드, head dim 128):

- **BF16 KV 캐시**: 토큰당 128 KiB, 128K 토큰 ≈ 16 GB(BF16 가중치만큼), 1M 토큰 ≈ 128 GB.
- **FP8 KV 캐시**: 그 절반(토큰당 64 KiB); **4비트 KV**: 1/4.

**뉘앙스**: 서빙 엔진(vLLM·SGLang·TensorRT-LLM)은 쓰기 시 KV를 양자화하므로, FP8 KV는 작은 품질 비용으로 GPU당 동시 장문맥 요청 수를 대략 2배로 하며, 그래서 FP4 가중치 + FP8 KV가 기본 짝이다. 2026년 더 큰 레버는 dtype이 아니라 아키텍처다: DeepSeek V4.1-Flash는 압축 희소 어텐션으로 FP4 메인 KV를 저장해 토큰당 전역 KV 약 890바이트, BF16 Llama-3.1-70B의 토큰당 320 KiB 대비. [KV 캐시와 컨텍스트 캐싱](https://github.com/ombharatiya/ai-system-design-guide/blob/main/04-inference-optimization/02-kv-cache-and-context-caching.md) 참고.

---

## 양자화 인식 학습(QAT)

학습 *후* 모델을 양자화(사후 학습 양자화, PTQ)하는 대신, QAT는 학습 과정 *중에* 양자화를 시뮬레이션한다.
- **결과**: 모델이 잃은 정밀도를 보상하도록 학습.
- **상태**: 4비트가 목표인 소형·온디바이스 모델의 기본. Google은 Gemma(Gemma 4 12B 포함)의 QAT int4 빌드를 내고, Apple은 3세대 파운데이션 모델이 양자화 인식 학습을 썼다고 한다. 완전 정밀 모델이 교사인 양자화 인식 증류는 더 강한 신호의 같은 아이디어다([지식 증류](05-knowledge-distillation.md) 참고).

---

## 면접 질문

### Q: QLoRA에 표준 Float4 대신 NF4를 쓰는 이유는?

**좋은 답변:**
표준 Float4는 고정 격자라, 보통 0 중심 정규분포를 따르는 실제 LLM 가중치 분포에 잘 맞지 않는다. NF4(NormalFloat4)는 각 양자화 구간이 정규분포에서 같은 수의 값을 담도록 수학적으로 최적화된 자료형이다. 이는 가중치 "군집"을 막고 최대한 많은 정보(엔트로피)를 보존해, 표준 4비트 정수보다 훨씬 높은 정확도로 이어진다.

### Q: AWQ와 GPTQ의 차이는?

**좋은 답변:**
GPTQ는 레이어별로 양자화하며 보정 세트의 근사 2차(헤시안) 정보로 남은 가중치를 갱신해 각 레이어 출력 오차를 작게 유지한다. AWQ는 활성 인식이다: 보정 활성으로 약 1% 현저 입력 채널을 찾고 양자화 전에 그 채널을 상향 스케일해 상대 반올림 오차를 줄이며, 역스케일을 이전 연산에 접는다. 모든 것이 여전히 4비트가 되어 커널이 단순하다; 흔한 오해는 AWQ가 현저 가중치를 고정밀로 저장한다는 것이다. AWQ는 역전파·가중치 재구성이 없고, 보정 세트에 덜 과적합해 도메인 전반에 잘 일반화되며, 4비트 이하에서 종종 GPTQ를 이긴다.

### Q: 팀이 비용 절감을 위해 서빙을 FP8→NVFP4로 옮기려 한다. 무엇을 확인하나?

**좋은 답변:**
네 가지. 첫째 하드웨어: NVFP4는 Blackwell·Rubin 텐서코어 필요; AMD는 MXFP4가 등가이고 일부 엔진은 로드 시 NVFP4를 MXFP4로 재양자화하므로 그 경로의 품질 회복을 확인한다. 둘째 커널: 낮은 정밀도가 자동으로 빠르진 않다. NVIDIA 자체 Dynamo 레시피는 Marlin에서 BF16이 NVFP4보다 80%, CuTeDSL에서 12% 빠르다고 측정했으므로, 실제 배치 크기·문맥 길이에서 정확한 모델·엔진 버전·커널 백엔드를 단일 수치가 아니라 처리량-인터랙티비티 곡선으로 벤치마크한다. 셋째 품질: 퍼플렉시티만이 아니라 과제 평가를 돌리되 장문맥·추론 과제에 특히 주의하고, 자체 PTQ보다 벤더 공개·QAT 체크포인트를 선호한다. 넷째 KV 캐시: 가중치는 2배 줄지만 장문맥에선 KV 캐시가 메모리를 지배할 수 있으므로, FP4 가중치를 FP8 KV와 짝지어 동시 시퀀스 수를 재계산한다. 결정은 비트폭이 아니라 SLO에서 측정된 백만 토큰당 비용이다.

---

## 참고 문헌
- Dettmers et al. "QLoRA: Efficient Finetuning of Quantized LLMs" (2023)
- Frantar et al. "GPTQ: Accurate Post-Training Quantization..." (2022)
- Lin et al. "AWQ: Activation-aware Weight Quantization..." (2023)
- Ma et al. "The Era of 1-bit LLMs: All Large Language Models are in 1.58 Bits" (BitNet b1.58, 2024)
- Open Compute Project. "OCP Microscaling Formats (MX) Specification" (2023)
- NVIDIA. Vera Rubin NVL72

---

*다음: [추론 모델 학습: RLVR과 GRPO](08-rlvr-and-reasoning-models.md)*
