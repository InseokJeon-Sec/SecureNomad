---
title: 온디바이스·엣지 배포
sidebar_position: 9
description: 노트북·워크스테이션 GPU·폰·엣지 박스에서 LLM을 로컬로 — 런타임 스택, 플랫폼 모델, Ollama가 프로덕션 서버가 아닌 이유, 로컬이 클라우드를 이길 때, 로컬 서빙용 양자화, 하드웨어.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/04-inference-optimization/09-on-device-and-edge-deployment.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 온디바이스·엣지 배포

모든 모델이 남의 클라우드에서 돌 필요는 없다. LLM을 **로컬로** — 노트북, 워크스테이션 GPU, 폰, 엣지 박스에서 — 돌리는 것은 2026년 실제 배포 타깃이며, 프라이버시·오프라인 작동·지연·꾸준한 볼륨의 비용이 동인이다. 함정은 로컬 모델을 *시도*하기 쉽게 만드는 도구(Ollama)가 *프로덕션*에서 서빙하는 도구(vLLM)가 아니라는 점이고, 둘은 끊임없이 혼동된다. 이 장은 런타임 스택, 프로토타입→프로덕션 경로, 하드웨어 한계, 로컬이 실제로 API를 이길 때를 정리한다.

## 런타임 스택

핵심 심성 모형: 이 도구들은 **대체재가 아니다**. 서로 다른 계층을 차지한다.

| 도구 | 계층 | 용도 |
|------|-------|----------------|
| **Ollama** | 경험 계층 / 로컬 데몬 | 원커맨드 모델 풀·실행, OpenAI 유사 API, 단일 사용자 개발. llama.cpp 기반; Apple Silicon에선 지원 아키텍처에 MLX 기본으로 이동 중(v0.40.0 RC, 2026년 9월). |
| **LM Studio** | 경험 계층 / GUI | 로컬 모델 탐색·실행 데스크톱 GUI. 단일 사용자 중심. |
| **llama.cpp** | 추론 엔진 | 이식성 C/C++ CPU/GPU 추론(GGUF 포맷); 거의 어디서나 실행; 경험 계층 도구의 동력. |
| **MLX** | 추론 엔진 | Apple의 배열 프레임워크; 가장 빠른 Apple Silicon 경로; 연구·파인튜닝. |
| **vLLM** | 서빙 시스템 | PagedAttention·연속 배칭의 고처리량 동시 서빙; OpenAI 호환. 프로덕션 정답. |
| **vllm-metal** | 서빙 시스템(Apple Silicon) | vLLM의 Apple Silicon 플러그인(v0.30.0, 2026-09-23): MLX 모델에 vLLM 스케줄러·페이지 KV 캐시·연속 배칭·OpenAI 서버, 배치 MTP 추측 디코딩과 Homebrew 설치. |
| **SGLang / TensorRT-LLM** | 서빙 시스템 | 고처리량 서버(SGLang은 RadixAttention 프리픽스 캐싱; TensorRT-LLM은 최대 NVIDIA 성능); 프로덕션. Hugging Face TGI는 유지보수 모드(2026년 3월 레포 아카이브), HF는 신규 배포에 vLLM·SGLang 권고. |
| **ExecuTorch** | 임베디드/모바일 런타임 | PyTorch 네이티브 온디바이스 추론(폰~마이크로컨트롤러); 2025년 말 1.0 도달, 수십억 사용자 앱에 탑재. 배포사가 공식 익스포트 출시 중(Meta Muse Glimmer 30B `.pte`, 2026년 8월). |
| **Apple Foundation Models 프레임워크** | OS 제공 모델 | OS와 함께 오는 온디바이스 모델이라 앱이 아무것도 안 받음; 다음 절 참고. |
| **Core ML / ONNX Runtime / MLC LLM** | 임베디드/모바일 런타임 | 각각 Apple 온디바이스, 크로스플랫폼, 다중 타깃 컴파일(브라우저/WebGPU 포함). |

---

## 플랫폼 모델: Apple Foundation Models

iOS·macOS에서 첫 질문은 어느 런타임을 번들할지가 아니라 OS 모델로 충분한지다. Apple의 3세대 파운데이션 모델 계열(2026-06-08 발표, iOS 27 사이클 탑재; iOS 27 앱스토어 제출 9/9 개방)은 5개 멤버:

| 모델 | 어디서 실행 | 무엇 |
|-------|---------------|------|
| AFM 3 Core | 온디바이스 | 3B dense |
| AFM 3 Core Advanced | 온디바이스 | 20B sparse, 네이티브 멀티모달, 요청당 1B~4B 활성; 전체 모델은 NAND 플래시에 상주하고 선택된 전문가만 DRAM 로드 |
| AFM 3 Cloud | Private Cloud Compute | 서버 모델 |
| ADM 3 Cloud(Image) | Private Cloud Compute | 이미지 생성·편집 |
| AFM 3 Cloud Pro | Private Cloud Compute, Google Cloud의 NVIDIA GPU | 에이전트 도구 사용·복잡 추론 |

Apple은 양자화 인식 학습으로 훈련하고 Google과 협업해 모델을 지었다고 밝힌다. Apple을 넘어 여행하는 설계 교훈 둘:
- **플래시 상주 희소 모델**은 *총* 파라미터의 "폰은 1-3B 모델" 규칙을 깬다: 전문가를 스토리지에 두고 요청이 라우팅하는 것만 페이지인해, DRAM이 활성 조각만 쥠. 지연은 플래시 대역폭과 요청별 라우팅 예측성에 달림.
- **디바이스→클라우드 에스컬레이션 경로가 플랫폼의 일부.** 앱이 온디바이스로 시작해 Apple 프라이버시 보장 하 Private Cloud Compute로 에스컬레이션 가능 — 이 장이 권하는 하이브리드 아키텍처를 OS가 제공.

Foundation Models 프레임워크가 타깃 OS 버전에서 서드파티 앱에 어느 모델을 노출하는지 확인하고, Apple Intelligence 없는 기기용 폴백을 계획하라.

---

## Ollama가 프로덕션 서버가 아닌 이유

Ollama·LM Studio는 프로토타이핑에 훌륭하고 공유 프로덕션 엔드포인트엔 부적합한데, 가르칠 만한 구조적 이유가 있다.

Ollama는 기본적으로 매우 제한된 병렬성으로 요청을 서빙하고 초과 요청을 FIFO로 큐잉; 가득 찬 큐는 에러 반환. 각 병렬 슬롯이 문맥 메모리 할당을 정적으로 배수한다. LM Studio는 레이트 리밋·인증 없는 단일 사용자용. 둘 다 동시 수요를 처리량으로 바꾸도록 설계되지 않았다.

**vLLM**은 두 메커니즘으로 그렇게 한다: **PagedAttention**(OS 페이징처럼 비연속 블록에 KV 캐시 저장, 나이브 서빙의 60-80% KV 메모리 낭비를 약 4% 미만으로)과 **연속 배칭**(완료 요청을 빼고 큐된 요청을 배치 중간에 넣음). 가장 명확한 일급 벤치마크(Red Hat): 8B 모델을 돌리는 단일 데이터센터 GPU에서 vLLM이 초당 약 **793 토큰 대 Ollama 약 41**, 약 19배, 훨씬 낮은 꼬리 지연, 튜닝된 Ollama조차 모든 동시성 수준에서 뒤처짐.

요점은 "vLLM이 더 잘 튜닝됐다"가 아니라 구조적이다: Ollama·LM Studio는 직렬화하고, vLLM은 연속 배칭하고 KV 캐시를 페이징한다. 단일 사용자엔 차이가 작지만, 동시성 하에선 약 16-20배가 된다. 정직을 위한 유의점: 대부분 공개 대결 수치는 *소프트웨어* 차이를 분리하려 데이터센터 GPU에서 돌리므로, "vLLM이 Ollama를 이긴다"를 "GPU가 Mac을 이긴다"로 읽지 말 것.

그 격차의 Mac 측은 좁혀지고 있다. vllm-metal이 vLLM의 연속 배칭·페이지 KV 캐시를 Apple Silicon에 가져와, 대용량 메모리 Mac의 공유 엔드포인트(팀 서버, 온프렘 어플라이언스)가 더 이상 Ollama 직렬 큐로 몰리지 않는다.

---

## 로컬이 클라우드를 이길 때(와 아닐 때)

**로컬·엣지로 기울 때:**
- **프라이버시·규제 데이터**가 박스를 못 떠날 때(HIPAA, GDPR, 계약상 레지던시). 가르칠 유의점: 주요 API 공급자가 제로 데이터 보존(ZDR) 엔터프라이즈 티어를 제공하므로 "프라이버시"만으로 더 이상 자동으로 로컬이 아니다. 역-유의점: 최신 프런티어 티어엔 조건이 붙는다. Claude Fable 5.1은 Anthropic이 명시 허가하지 않는 한 30일 보존 필요, OpenAI(Private Safety Processing, 2026-08-19부터 프리뷰)·Anthropic(Enterprise Frontier Safeguards, 9/1 발표, 올 가을 단계적 롤아웃 예정)이 ZDR를 자동 안전 모니터링과 짝짓는 중. 벤더별이 아니라 모델별로 보존 조건을 읽어라.
- **오프라인·에어갭** 작동(현장 기기, 핵심 인프라).
- **지연 바닥**: 온디바이스가 네트워크 왕복(흔히 50-200ms)을 제거해 빡빡한 인터랙티브 루프에 중요; 총 응답 지연은 여전히 모델·하드웨어에 달림.
- **꾸준한 고볼륨 비용**: 2026년 10월 렌탈 가격으로, 70B급 오픈 모델을 돌리는 H100 2장(월 약 $4,000)은 $2/$10 API 티어 대비 월 약 10억 토큰(일 약 3,300만)에 손익분기, 반면 GPT-6 Luna 같은 가장 싼 티어 대비 동점(월 약 200억 토큰)은 2 GPU가 지속할 수 있는 한계 이상([비용 최적화 플레이북](07-cost-optimization-playbook.md)에 계산 예시). 이미 지불한 자체 엣지 하드웨어는 계산을 바꾸니, 손익분기는 워크로드·품질 기준 의존적.

**클라우드 API에 머물 때**: 프런티어 품질이 필요하거나, 스파이크·예측 불가 수요(유휴 GPU 비용; 약 50% 할인 배치 엔드포인트가 중간 볼륨에서 흔히 로컬을 이김), 낮은-중간 볼륨(손익분기 이하라 총비용이 API 유리), 또는 오토스케일·모니터링의 vLLM을 운영할 역량 부족. 2026년 합의는 대개 **하이브리드**: 작고 사적이고 오프라인이거나 비용 민감한 경로는 로컬, 무겁거나 프런티어거나 스파이크 경로는 클라우드, 한 제품 안에서.

---

## 로컬 서빙용 양자화

양자화가 로컬 서빙을 가능케 한다; [양자화 심층 분석](../03-training-and-adaptation/07-quantization-deep-dive.md)이 수학을 다루니 여기선 배포 계층만.

**GGUF**는 llama.cpp·Ollama·LM Studio가 쓰는 로컬 모델 포맷. 흔한 양자 레벨이 품질↔크기를 교환: Q4_K_M이 실무 스위트스팟(FP16 대비 약 1-3% 품질 손실, 약 1/4 크기), Q5_K_M이 코드·추론에 눈에 띄게 좋음(1% 미만 손실), Q8_0이 사실상 무손실(FP16 약 절반), Q2/Q3이 메모리를 가장 아끼나 수학·추론을 5-10% 이상 저하.

그 마지막 규칙은 16비트 학습 모델의 나이브 사후 양자화에 성립한다. 저비트용으로 지어진 모델은 다르게 행동한다. PrismML **Ternary Bonsai 2 27B**(2026년 9월, Apache 2.0, Qwen3.8-27B 파생)는 5.95 GB 파일에 가중치당 평균 1.72비트, 14개 사고 모드 벤치마크에서 FP16 품질 98.2%, RTX 5090에서 약 130 tok/s·M5 Pro에서 약 28 tok/s 디코드 보고(모두 벤더). 함정: PrismML의 llama.cpp·MLX 포크에서만 실행. 반대 극단으로 Cactus Compute **Needle 3**는 약 2비트/가중치, 8-29 MB 파일의 121M 파라미터 도구 호출·추출 모델. 직접 양자화보다 벤더 QAT 빌드를 선호하라(Google은 QAT int4 Gemma 빌드 출시, Gemma 4 12B 포함).

**VRAM 어림 규칙**:

```
VRAM(GB) ≈ (파라미터 수(10억) × 가중치당 비트) / 8   # 모델 가중치만
```

그다음 KV 캐시(문맥 길이×동시 요청으로 증가)와 약 10-20% 런타임 오버헤드를 더한다. 그래서 7B 모델 가중치는 FP16 약 14GB, Q8_0 약 7.7GB, Q4_K_M 약 4.5GB(그 오버헤드 전). 모두가 되뇌는 운영 규칙: **KV 캐시·활성값·문맥용 10-20% 여유와 함께 맞는 최고 품질 양자를 쓰라.**

---

## 하드웨어

모델 크기→하드웨어 가이드(Q4 양자 가정; 계획 지침이지 보장 아님):

| 모델 크기(Q4) | 최소 VRAM/RAM | 현실적 하드웨어 |
|-----------------|--------------|--------------------|
| 1-3B | 4-6 GB | 모든 현대 GPU; 고급 폰(NPU); AI PC |
| 7-8B | 8 GB | 주류 GPU; 16 GB Mac |
| 13-14B | 12 GB | 상위 주류 GPU; 16-24 GB Mac |
| 32-35B | 24 GB | 24 GB 소비자 GPU; 36-48 GB Mac |
| 27B ternary(약 1.7비트) | 약 6-8 GB | 8 GB+ GPU 또는 16 GB Mac, 벤더 런타임 포크 |
| 70B | 약 40 GB+ | 고급·듀얼 GPU; 64 GB+ Mac; 또는 데이터센터 카드 |
| 200B+ | 48 GB+, 흔히 멀티 GPU / 128 GB+ 통합 | 멀티 GPU 리그; 대용량 통합 메모리 워크스테이션 |

참고:
- **소비자 GPU**는 24-32 GB VRAM이 상한이고, 이것이 로컬 모델 크기의 결정적 제약.
- **Apple Silicon**은 CPU·GPU가 한 메모리 풀을 공유해 시스템 RAM이 VRAM 역할, 대용량 RAM Mac이 동가 개별 GPU가 못 쥐는 모델을 쥠. Apple MLX 경로가 계속 개선: Ollama MLX 백엔드가 통합 메모리 활용으로 Apple Silicon에서 상당한 프리필·디코드 향상 보고하며 지원 아키텍처에 기본이 되는 중, 별도 업데이트가 NVFP4(Apple 것 아닌 NVIDIA 4비트 부동) 추가로 Q4_K_M보다 약 20% 빠름 보고.
- **NPU**(폰·AI PC)는 높은 TOPS를 광고하나, 가르칠 뉘앙스: 제한된 연산자 지원·메모리 대역폭이 실성능을 게이팅하므로 TOPS만으로 LLM 속도를 예측 못 함. NPU는 경량·배터리 효율 과제에 적합; 무거운 로컬 추론엔 개별 GPU가 여전히 이김.
- **모바일**은 대역폭 바운드·메모리 제약: 현실적 *dense* 온폰 모델은 1B 미만~약 3B(MBZUAI는 폰에 오픈 K2 Horizon 3.7B·7B, 워치에 0.9B 포지셔닝), 가용 앱 RAM이 플래그십에도 흔히 4 GB 미만, 모바일 메모리 대역폭이 데이터센터 GPU의 30-50배 아래. 온디바이스 표준은 4비트 양자화. 플래시 상주 전문가의 희소 모델이 DRAM 예산을 안 올리고 총 파라미터 상한을 올림(Apple 20B AFM 3 Core Advanced는 요청당 1-4B 활성).

### 소형 모델은 전문화한다

유용한 온디바이스 답은 흔히 범용 모델 하나가 아니라 여러 소형 전문가다:

| 작업 | 예시 오픈 모델(2026) | 비고 |
|-----|---------------------------|-------|
| 도구 호출, 라우팅, 추출 | Cactus Needle 3(121M, Apache 2.0) | 단일 8-29 MB 파일; 벤더 주장 모바일 도구 호출에서 10배 크기 모델 능가 |
| 폰·워치 범용 어시스턴트 | K2 Horizon 0.9B/3.7B/7B(Apache 2.0, 오픈 학습 데이터) | 0.9B 128K 문맥; 3.7B·7B 512K |
| 엔터프라이즈 친화 소형, 비중국 가중치 | IBM Granite 4.2 3B/8B(Apache 2.0) | 공식 FP8·MXFP4·NVFP4·GGUF·MLX 빌드 |
| 노트북급 멀티모달(텍스트·이미지·오디오·비디오) | Gemma 4 12B(Apache 2.0) | 인코더 프리 설계; 공식 QAT int4 빌드 |
| 로컬 코딩 에이전트 | MiMo-V2.6-Distill-Qwen-9B(MIT) | 벤더 보고 SWE-bench Verified 61.1% |
| 노트북 추론 | Ternary Bonsai 2 27B(Apache 2.0) | PrismML 런타임 포크 필요 |

> 번역 주: 원문은 외부 자료로, 기업명(IBM 등)·모델명은 원문 표기를 충실히 유지합니다.

---

## 프로토타입→프로덕션

1. **프로토타입**: GGUF Q4_K_M 모델에 Ollama(CLI)·LM Studio(GUI)로; 통과하는 가장 작은 모델에서 품질·프롬프트 검증.
2. **가장 큰 모델·최고 양자 선택**: KV 캐시 여유와 함께 타깃 하드웨어에 맞는.
3. **서빙 엔진 전환**: 동시 엔드포인트엔 vLLM(NVIDIA·AMD), vllm-metal(Apple Silicon), SGLang, 또는 TensorRT-LLM(최대 NVIDIA). 애플리케이션 코드가 거의 안 바뀌게 OpenAI 호환 API 유지.
4. **모바일·엣지엔** 먼저 플랫폼 모델 확인(iOS 27 Apple Foundation Models). 아니면 ExecuTorch·Core ML·ONNX Runtime/MLC LLM로 익스포트, 4비트 양자화(벤더 QAT 빌드 선호), 4 GB 미만 RAM과 대역폭 한계로 예산화.

흔한 함정: Ollama·LM Studio를 서버로 취급(부하 하 직렬화); 메모리 산정 시 KV 캐시 망각(긴 문맥×병렬 슬롯이 지배 가능); 과양자화(Q2/Q3이 추론 해침); "vLLM이 Ollama를 이긴다"를 "GPU가 Mac을 이긴다"로 혼동; NPU TOPS를 LLM 속도와 동일시; 엔진-하드웨어 불일치(vLLM은 GPU 우선이나 vllm-metal로 Apple Silicon도, MLX는 Apple 전용, llama.cpp는 이식성 폴백); 런타임이 로드 가능한지 안 보고 이색 저비트 포맷 채택.

**성숙도:** 서버 측 로컬 서빙은 프로덕션 성숙(vLLM이 OpenAI 호환 API로 널리 배포). 온디바이스·모바일은 *소형* dense 모델(1B 미만~3B)과 OS 제공 모델엔 프로덕션 준비, 프런티어엔 아님. NPU-as-LLM-엔진은 아직 초기; 개별 GPU와 대용량 통합 메모리 Mac이 2026년 진지한 로컬 경로로 남음. 벤치마크가 따라잡는 중: MLPerf Inference v6.1이 늘어나는 멀티턴 문맥의 엣지 에이전트 테스트 추가.

---

## 면접 질문

### Q: 팀이 Ollama로 프로토타입하고 공유 API로 출시하려 한다. 뭐가 바뀌고 왜인가?

**좋은 답변:**
Ollama는 공유 엔드포인트에 잘못된 도구다. 제한된 병렬성으로 서빙하고 초과 요청을 FIFO로 큐잉해, 동시성 하에서 지연이 치솟고 요청이 실패하기 시작한다. 해법은 같은 OpenAI 호환 API를 유지해 앱이 거의 안 바뀌게 서빙 엔진을 vLLM(또는 SGLang·TensorRT-LLM)으로 전환하는 것. vLLM은 튜닝이 아니라 구조적으로 이긴다: PagedAttention이 비연속 블록에 KV 캐시를 저장해 메모리 낭비 대부분을 없애고, 연속 배칭이 완료 요청을 빼고 큐된 것을 배치 중간에 넣어 동시 수요를 처리량으로 바꾼다. 일급 벤치마크가 부하 하 약 한 자릿수 높은 처리량과 훨씬 낮은 꼬리 지연을 보인다. 또 KV 캐시 여유와 함께 모델·양자를 타깃 GPU에 맞추고, Ollama가 안 주는 오토스케일·모니터링을 더하겠다.

### Q: 언제 클라우드 API 대신 로컬·온디바이스 추론을 택하나?

**좋은 답변:**
프라이버시·레지던시로 데이터가 박스를 못 떠날 때, 시스템이 오프라인·에어갭으로 작동해야 할 때, 네트워크 왕복을 잘라 최저 지연이 필요할 때, 또는 예약 GPU가 토큰당 가격을 이기는 꾸준한 고볼륨일 때: 렌탈 H100 2장이 $2/$10 API 티어 대비 월 약 10억 토큰에 손익분기이나 가장 싼 티어엔 아님. 프런티어 품질, 유휴 GPU가 돈을 낭비하는 스파이크 수요, 손익분기 이하 저볼륨, 또는 서빙 스택 운영 역량 부족엔 API에 머물겠다. 실무상 대개 하이브리드다: 작고 사적이거나 오프라인 경로는 양자화 모델로 로컬, 무겁거나 프런티어거나 버스티 경로는 클라우드. 폰에선 특히 모바일이 메모리·대역폭 제약이니 1B 미만~3B dense 모델을 계획하거나, OS 제공 모델이 있으면 쓰겠다. 또 클라우드 경로가 ZDR라 가정하기 전 모델별로 보존 조건을 확인하겠다 — 일부 프런티어 티어가 이제 보존·안전 모니터링을 요구하기 때문.

### Q: iOS 앱에 AI 기능을 출시한다. 자체 모델을 번들하나, Apple Foundation Models를 쓰나?

**좋은 답변:**
OS 모델로 시작해 번들할 권리를 벌어라. Apple 온디바이스 모델은 OS와 함께 오므로 다운로드도, 앱 크기 타격도, 둘째 모델과의 메모리 경쟁도 없다; 3세대 계열은 전문가가 플래시에 상주하고 요청당 DRAM으로 페이지인하는 20B 희소 온디바이스 모델과, 무거운 추론용 Private Cloud Compute 에스컬레이션 경로를 더한다. 내 평가셋으로 기능을 그에 대해 프로토타입하겠다. 자체 모델은 평가가 OS 모델이 과제를 못 함을 보일 때(튜닝 안 된 도메인, 놓치는 엄격 출력 포맷), iOS·Android에 동일 거동이 필요할 때, 또는 Apple Intelligence 없는 기기를 지원해야 할 때만 번들하겠다. 번들하면 통과하는 가장 작은 전문가(200M 미만 도구 호출기나 1-3B dense)를 고르고, 벤더 QAT int4 빌드를 쓰고, Core ML·ExecuTorch로 익스포트하고, 가용한 곳에선 OS 모델을 기본 경로로 둔다. 어느 쪽이든 평가셋이 자산이다 — OS 모델이 릴리스마다 내 밑에서 바뀔 것이기 때문.

---

## 참고 문헌
- Red Hat Developer, "Ollama vs vLLM: a deep dive into performance benchmarking"
- vLLM [docs](https://docs.vllm.ai/), [PagedAttention blog](https://blog.vllm.ai/2023/06/20/vllm.html)
- Ollama, "now powered by MLX on Apple Silicon", concurrency FAQ
- PyTorch, "Introducing ExecuTorch 1.0"
- Chandra and Krishnamoorthi (Meta), "On-Device LLMs: State of the Union, 2026"
- Apple Machine Learning Research, "Introducing the third generation of Apple Foundation Models"
- vLLM, vllm-metal releases
- PrismML, Ternary Bonsai 2 27B

---

*다음: [프롬프트 엔지니어링 기초](../05-prompting-and-context/01-prompt-engineering-fundamentals.md)*
