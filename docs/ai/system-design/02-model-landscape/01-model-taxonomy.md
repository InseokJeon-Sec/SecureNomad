---
title: 모델 분류 체계
sidebar_position: 1
description: 프로덕션 시스템을 위한 모델 지형 분류 — 역량 티어, 추론 모드, 그리고 공급사별 모델 카탈로그로 가는 안내.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/01-model-taxonomy.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 범위 안내
모델을 **어떻게 분류하고 고르는가**(역량 티어, 추론 모드)라는 틀은 비교적 오래가므로 한국어로 번역했습니다. 반면 **40여 개 개별 모델의 스펙·가격 카탈로그**(Frontier/Reasoning/Open Source/Specialized/Embedding 모델별 블록, 역량 비교표)는 주 단위로 바뀌는 휘발성 데이터라, 번역본에서 옮기면 즉시 낡습니다. 그 카탈로그는 [영문 원문(전체 모델 목록)](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/01-model-taxonomy.md)과 각 공급사 릴리스 노트를 참조하세요. 모델명·버전·숫자는 언어와 무관합니다.
:::

# 모델 분류 체계

이 장은 **2026년 10월 1일 기준** 모델 지형을 종합적으로 안내하며, 프로덕션 시스템을 위한 모델 계열·역량·선택 기준을 다룬다.

> **모델 지형은 빠르게 진화한다.** 항상 공급사 가격 페이지와 릴리스 노트로 교차 확인하라. 아래 벤치마크·가격 수치는 2026-10-01 스냅샷이다.

## 2026년 10월 요지 (요약)

9월에 Anthropic·OpenAI·Google·SpaceXAI·Meta가 모두 새 모델을 냈고, 이야기는 역량만큼이나 **가격**이다. 실무적 결과:

- **중간 티어가 $2 / $10로 수렴**(Claude Sonnet 5.5, GPT-6 Sol, GPT-6.1 Sol).
- **Opus 5.5가 $4 / $20로 하락**, Anthropic의 "여기서 시작" 기본값이 됨.
- **바닥이 내려감**: GPT-6 Luna $0.10 / $0.50.
- **캐시 읽기 배수가 모델별로 갈림**(0.1 / 0.05 / 0.025배).
- **OpenAI는 272K 입력 초과 시 요청 전체를 장문맥 요율로** 과금.
- **최신 Claude는 강제 `tool_choice`를 거부**하고 사고 블록을 생성 모델·대화에 묶어, 순진한 라우터를 깨뜨림.
- 벤치마크도 리셋: Artificial Analysis가 Intelligence Index를 재기준화(v4.3, 9/7; 이전 점수 비교 불가), Terminal-Bench 4.0이 3.0 대체, 공개 SWE-Bench Pro 분할 포화, Claude 점수에 "with fallback" 라벨.
- 오픈 가중치: GLM-5.3 가중치 공개(8/28, MIT+), Xiaomi MiMo-V2.6-Pro(9/21, MIT)가 최상위 오픈 모델, DeepSeek V4.1-Flash(9/10, MIT)가 Flash 가격 인하, Qwen 신규 커뮤니티 라이선스는 MaaS·코딩/오피스 비서 사업에 별도 라이선스 요구.

(월별 상세 연혁과 각 모델 블록은 [영문 원문](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/01-model-taxonomy.md) 참조.)

---

## 모델 범주

### 역량 수준별 (2026년 10월)

| 티어 | 특징 | 예시 | 용도 |
|------|-----------------|----------|----------|
| **프런티어(Frontier)** | 최고 역량 천장; $10/$50 급 또는 게이트 | Claude Fable 5.1, GPT-6 Astra, Claude Opus 5.5($4/$20); Gemini 4 Argon 발표(미GA) | 최난 추론, 장기 에이전트, 천장급 코딩 |
| **워크호스($2/$10 티어)** | 중간 가격에 프런티어 근접 에이전트 품질 | Claude Sonnet 5.5, GPT-6 Sol, GPT-6.1 Sol, Grok 4.7($2/$6), Muse Spark 1.3($1.25/$4.25) | 프로덕션 에이전트, 대규모 코딩, 기본 라우팅 티어 |
| **빠름/효율** | 최저 토큰 단가, 대량 | GPT-6 Luna, Gemini 3.8 Flash, Claude Haiku 4.5, DeepSeek V4.1-Flash | 분류, 추출, 라우팅, 대량 스트리밍 |
| **이전 세대(여전히 서빙)** | 특성 파악 완료, 종종 몇 주 만에 대체됨 | Claude Opus 5 / Sonnet 5 / Fable 5, GPT-5.6 Sol / Terra / Luna, Claude Opus 4.8, Gemini 3.7 Flash | 안정적·이미 평가된 동작을 중시하는 워크로드 |
| **소형/엣지** | 프라이빗, 엣지, 단일 GPU | Gemma 4(12B, E4B), Qwen3.8-27B, Granite 4.2(원문 표기), Muse Glimmer 30B | 로컬 프라이버시, 온디바이스, 단일 GPU 서빙 |
| **추론 집약** | 높은 effort의 확장된 내부 추론 | GPT-6 Astra(xhigh/max), Claude Fable 5.1, 높은 effort의 Claude Opus 5.5, DeepSeek V4.1-Flash(effort 1-100) | 수학, 코드 디버깅, 다단계 논리 |

Anthropic의 유일한 Haiku는 여전히 Haiku 4.5다. Claude Haiku 5.5는 "앞으로 몇 주 내" 발표됐으나 2026-10-01 기준 미출시.

### 추론 모드별 (2026년 10월)

| 모드 | 역량 | 모델 | 용도 |
|------|------------|--------|----------|
| **최소 추론** | 모델이 허용하는 가장 빠른 경로 | `low`의 GPT-6.1 Sol, 최저 effort의 GPT-6 Luna, `low`의 Gemini 3.8 Flash, `between_tools`의 Claude Sonnet 5.5, Claude Haiku 4.5 | 챗, 단순 추출 |
| **상시 추론** | 사고를 끌 수 없음 | Claude Opus 5.5·Fable 5.1(적응형 사고 상시), GPT-6 Astra(`none` effort 없음; `low`~`max`) | 수학, 코드 디버깅, 계획 |
| **다이얼 제어** | 요청별 effort·thinking 수준 | GPT-6.1 Sol(`low`~`max`, 기본 `medium`), Claude Opus 5.5(기본 `medium`), Gemini 3.8 Flash(`thinking_level`), DeepSeek V4.1-Flash(1-100) | 가변 복잡도 과제 |

**끄기 스위치가 사라지고 있다.** Sonnet 5.5는 `thinking: {type: "disabled"}`에 400, Opus 5.5는 사고 비활성 불가, Astra는 `none` effort 없음. 샘플링 손잡이도 사라지는 중: Claude API는 Opus 4.7 이후 비기본 `temperature`·`top_p`에 400, Astra는 `temperature`·`top_p`·logprobs를 받지 않고, Google은 2026-07-21 Gemini API에서 그 파라미터들을 폐기. 이제 effort가 제어면이고, 기본값이 버전 간 이동하므로(Opus 5는 `high`, Opus 5.5는 `medium` 기본) 매 경로에 명시하라.

---

## 개별 모델 카탈로그 (영문 미러 참조)

아래 항목들은 **개별 모델의 스펙·가격·수명이 주 단위로 바뀌는** 부분이라, 번역본에서는 옮기지 않고 영문 원문으로 안내합니다. 모델명·버전·수치는 언어와 무관하며, 가장 정확한 최신 정보는 각 공급사 페이지입니다.

- **Frontier Models** (Claude 5.x, GPT-6 세대, Gemini 3.x·4, Grok 등 모델별 블록)
- **Reasoning & Math** 모델
- **Open Source Models** (라이선스·활성 파라미터 포함)
- **Specialized Models** (코드·사이버·생명과학·음성 등)
- **Embedding Models**
- **Model Selection Framework & Semantic Routing**
- **Sovereign AI & Data Residency**
- **Capability Comparison** (벤치마크 표)
- **Interview Questions / References**

→ 전체 목록: **[Model Taxonomy (영문 원문)](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/01-model-taxonomy.md)**

가격·요율 상세는 [가격과 비용](03-pricing-and-costs.md), 모델 고르는 절차는 [모델 선택 가이드](04-model-selection-guide.md), 평가 방법은 [역량 평가](02-capability-assessment.md)를 참고하세요.

---

*다음: [역량 평가](02-capability-assessment.md)*
