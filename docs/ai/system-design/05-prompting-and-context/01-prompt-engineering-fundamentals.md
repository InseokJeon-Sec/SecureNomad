---
title: 프롬프트 엔지니어링 기초
sidebar_position: 1
description: LLM 동작을 조종하는 입력 설계 — 의도+제약 철학, 지시 계층, 역할 프롬프팅, 구분자, 제로샷 vs 퓨샷, 온도 없는 결정성.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/05-prompting-and-context/01-prompt-engineering-fundamentals.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 프롬프트 엔지니어링 기초

프롬프트 엔지니어링은 LLM 동작을 조종하도록 입력을 설계하는 것이다. "시행착오"에서 규율 있는 아키텍처 실천으로 진화했고, DSPy 같은 프레임워크는 이를 글쓰기 연습이 아니라 컴파일 문제로 다룬다.

## 핵심 철학: 의도 + 제약

효과적 프롬프팅은 **의도 공개(Intent Disclosure)** 를 최대화하면서 **출력 분산(Output Variance)** 을 최소화하는 것이다.

1. **의도**: 모델이 무엇을 해야 하는가를 정확히.
2. **제약**: 모델이 무엇을 *피해야* 하는가를 정확히(안전, 톤, 포맷).

**원칙**: "프롬프팅은 자연어로 하는 프로그래밍이다." 프롬프트를 코드처럼 다뤄라(버전 관리, 단위 테스트).

---

## 지시 계층

프로덕션 시스템은 계층화된 메시지 구조를 쓰고, 모델은 충돌을 상위 계층 쪽으로 해소하도록 학습된다:

| 역할 | 책임 | 뉘앙스 |
|------|----------------|--------|
| **System / Developer** | 운영자 규칙, 페르소나, 안전, 출력 계약. | 애플리케이션이 통제하는 최고 우선순위. OpenAI 추론 모델은 이를 `developer` 메시지라 부름. 최신 Claude 모델은 대화 중간 `system` 메시지도 받아, 운영자가 히스토리 재작성 없이 지시를 더할 수 있음. |
| **User** | 구체적·동적 쿼리. | 의도는 신뢰하나 운영자 규칙에 대한 권위는 아님. 사용자가 붙인 문서는 여전히 신뢰 못 할 데이터. |
| **Assistant** | 이전 턴 히스토리. | 최신성·자기일관성 편향의 원천. 최신 Claude 모델에선 이전 턴이 미편집으로 유지돼야 하며 아니면 사고 블록이 무효화됨([컨텍스트 엔지니어링](05-context-engineering.md) 참고). |
| **Tool / 검색 콘텐츠** | 도구 결과, RAG 청크, 웹 페이지. | 최저 신뢰: 데이터이지 지시가 아님. 간접 프롬프트 인젝션의 주 채널. |

이 계층은 **학습된 선호이지 보안 경계가 아니다**. OpenAI가 지시 계층 학습으로 정식화했고(Wallace et al., 2024) 이제 모든 프런티어 랩이 이를 학습시키나, 인젝션은 여전히 측정 가능한 비율로 성공한다. [프롬프트 인젝션과 방어](08-prompt-injection-defense.md) 참고.

---

## 역할 프롬프팅

페르소나 배정은 더 이상 단순 "당신은 교사입니다"가 아니다. **역량 앵커(Capabilities Anchor)** 다.

- **약함**: "당신은 코더입니다."
- **강함**: "당신은 1티어 테크 기업의 스태프 소프트웨어 엔지니어로 고동시성 Rust 시스템 전문입니다. 메모리 안전성과 제로 비용 추상화를 우선합니다."

**작동 이유**: 강한 버전은 **우선순위와 제약**(메모리 안전성, 제로 비용 추상화)을 인코딩해 모델이 최적화하는 대상을 바꾼다. 직함 자체는 사람들이 가정하는 것보다 훨씬 적게 한다: 여러 모델 계열에 걸친 162개 페르소나 통제 연구는 시스템 프롬프트에 페르소나를 더해도 사실 질문 정확도가 신뢰성 있게 오르지 않음을 발견(Zheng et al., 2024). 역할은 톤·어휘·우선순위에 쓰고, 정확성은 명시적 제약·검사에 두라.

---

## 지시 명확성과 구분자

현재 프런티어 모델은 1M 토큰 문맥을 처리한다. 구분자는 모델이 지시와 데이터를 구별하게 돕는다.

```markdown
# Instructions
Analyze the following text for PII.

# Data to Analyze
--- START OF USER DATA ---
$USER_INPUT_HERE
--- END OF USER DATA ---

# Output Schema
{ "pii_found": boolean, "types": [] }
```

**쓸 구분자**: XML 태그(`<context>`, `</context>`), 마크다운 헤더(`#`), 또는 삼중 따옴표(`"""`). 출력 스키마는 산문으로 쓴 스키마보다 네이티브 구조화 출력을 선호하라([구조화 생성](06-structured-generation.md) 참고).

---

## 제로샷 vs 퓨샷 효율

| 측면 | 제로샷 | 퓨샷 |
|--------|-----------|----------|
| **지연** | 최저(짧은 프롬프트) | 높음(예시 토큰) |
| **정확도**| 가변 | 높음(포맷 안정성) |
| **사용처**| 단순 챗, 요약 | 특정 포맷, 미묘한 로직 |

**전략**: 추론 모델(Claude Opus 5.5, GPT-6.1 Sol, 높은 사고 레벨의 Gemini 3.8 Flash)엔 **명확한 목표·제약·성공 기준으로 제로샷** 시작하고 "단계적으로 생각하라"나 규정적 추론 스크립트는 건너뛰어라: 모델이 이미 내부적으로 추론한다. Anthropic의 현 지침은 일반 지시("철저히 생각하라")가 손으로 쓴 단계별 계획을 흔히 이기고, 옛 프롬프트가 필요로 하던 강조 어법("중요: 반드시...")이 이제 과발동을 일으키니 줄여야 한다는 것. 특정 출력 포맷이나 미묘한 라벨링 관례가 필요하면 예시를 더하라. 소형 모델(8B 이하)엔 **퓨샷**으로 접지하라.

---

## 온도 없는 결정성

"일관성엔 온도를 0으로"라는 고전적 조언은 최신 API에서 더 이상 통하지 않는다. 샘플링 파라미터가 제어면으로서의 추론 노력에 자리를 내주며 제거되고 있다:

| 벤더 | `temperature`/`top_p` 상태 |
|--------|-----------------------------------|
| **Anthropic** | Claude Opus 4.7 이후(Sonnet 5.5·Fable 5.1 포함) 비기본값은 400 반환. Python SDK 1.0(2026-08-20)이 Messages 메서드 시그니처에서 `temperature`·`top_p`·`top_k`를 제거해 전달 시 `TypeError`. |
| **OpenAI** | GPT-6 Astra(2026-09-03)는 커스텀 `temperature`·`top_p`·`logprobs` 미지원. |
| **Google** | Gemini API에서 2026-07-21 `temperature`·`top_p`·`top_k` 폐기; Gemini 3.8 Flash는 `thinking_budget` 대신 `thinking_level` 사용. |

이제 일관성을 얻는 법:

1. **모델 스냅샷과 노력 레벨을 핀하라.** 노력이 온도만큼 동작을 바꾸고 기본값이 다름(Opus 5.5는 `medium`, Opus 5는 `high`).
2. **출력을 제약하라** 구조화 출력이나 enum으로, 분산이 포맷에 닿지 못하게.
3. **입력 해시로 캐시하라** 동일 요청에, 요청-응답 쌍을 리플레이용으로 로깅.
4. **단일 샘플이 아니라 분포를 평가하라.** 각 평가 케이스를 여러 번 돌려 통과율 추적.
5. **벤더 체인지로그 이벤트마다 평가를 재실행하라**, 모델 ID 변경만이 아니라: OpenAI가 2026-09-25 동일 모델 ID 하에 GPT-6 Sol·Luna 이미지 버그를 고침.

---

## 면접 질문

### Q: 현대 LLM에서 시스템 프롬프트가 사용자 프롬프트보다 무게를 더 가지는 이유는?

**좋은 답변:**
모델이 **지시 계층**에 복종하도록 학습되기 때문: 사후 학습 중 랩이 system·developer·user·tool 메시지 간 충돌을 구성하고 상위 권한 쪽을 따르도록 보상한다(OpenAI가 2024년 지시 계층 학습으로 공개, Model Spec은 이를 명령 체인이라 부름). 그래서 사용자가 시스템 프롬프트가 금한 걸 요청하면 잘 정렬된 모델은 운영자 편을 든다. 중요한 단서는 이것이 아키텍처 보장이 아니라 학습된 선호라는 점: 현 프런티어 모델의 벤더 보고 간접 인젝션 성공률은 약 1%(Gray Swan IPI 벤치마크 시나리오당 15회에서 Claude Opus 5.5)에서 8.5%(IPI Arena 세트에서 GPT-6 Astra)에 이른다. 따라서 임계 규칙은 모델 밖 강제도 필요하다: 도구 권한, 출력 검증, 이그레스 제어.

### Q: "단계별" 프롬프트 최적화란?

**좋은 답변:**
2022년엔 "단계적으로 생각하라"가 CoT를 발동하는 마법 문구였다. 비추론 모델엔 더 나은 버전이 **프로그램형 CoT**다: "1. 핵심 문제 식별. 2. 제약 나열. 3. 해법 3개 제안. 4. 최선을 고르고 정당화" 같은 명시적 이정표. 이는 출력을 구조화·감사 가능하게 만든다. 추론 모델엔 사고를 스크립트화하지 않는다. 목표·제약과 올바른 답이 만족해야 할 것을 진술하고, 깊이는 노력 설정으로 통제한다. 감사 가능한 단계가 필요하면 사고의 전사가 아니라 짧은 설명이나 답 뒤의 근거를 요청한다. 최신 Claude 모델에선 이 구별이 강제된다: 모델에게 추론을 출력에 쓰라는 프롬프트(`<thinking>` 섹션, `reasoning` 필드)는 `reasoning_extraction` 거절 범주 하에 거절될 수 있고, 추론 검사의 지원 방법은 요약된 사고 블록이다.

### Q: 이제 API가 `temperature`를 거부한다. 테스트할 만큼 출력을 재현 가능하게 어떻게 만드나?

**좋은 답변:**
재현성을 샘플링 설정이 아니라 시스템 속성으로 다룬다. 첫째, 동작을 바꾸는 모든 걸 핀한다: 날짜 붙은 모델 ID, 노력 레벨, 시스템 프롬프트 버전, 도구 정의. 둘째, 속하지 않는 곳의 분산을 제거한다: 포맷엔 구조화 출력, 라벨엔 enum, 반복 요청엔 입력 해시 캐시. 셋째, 통계적으로 테스트한다: 각 평가 케이스를 여러 번 돌리고, 게이트는 단일 골든 문자열이 아니라 신뢰구간 있는 통과율. 끝으로, 벤더 체인지로그가 뭔가 바뀌었다 하면 스위트를 재실행한다 — 공급자가 때로 안정 모델 ID 하에 동작을 고치기 때문.

---

## 참고 문헌
- OpenAI. "Prompt Engineering Guide", "Reasoning Best Practices" (2024-2026)
- [Anthropic. "Prompting best practices" (2026)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Anthropic. "Refusals and fallback"](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback#keep-reasoning-in-thinking-blocks)
- Wallace et al. "The Instruction Hierarchy..." (2024)
- Zheng et al. "When 'A Helpful Assistant' Is Not Really Helpful..." (EMNLP Findings 2024)
- Microsoft Research. "The Power of Prompting"(Medprompt, 2023)
- [Claude API release notes](https://platform.claude.com/docs/en/release-notes/overview)

---

*다음: [퓨샷과 인컨텍스트 러닝](02-few-shot-and-icl.md)*
