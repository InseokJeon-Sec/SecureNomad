---
title: 사고 사슬(CoT)
sidebar_position: 3
description: 최종 답 전에 중간 추론 단계를 생성하도록 유도하는 사고 사슬 — 제로샷 vs 프로그램형 CoT, 사고 모델의 부상, 모니터링 신호로서의 CoT, 자기교정과 과사고.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/05-prompting-and-context/03-chain-of-thought.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 사고 사슬(CoT)

사고 사슬(CoT)은 LLM이 최종 답 전에 중간 추론 단계를 생성하도록 유도하는 기법이다. 단순 프롬프트 문구에서 추론 모델의 핵심 아키텍처 기능으로 진화했다: 먼저 OpenAI o1·DeepSeek-R1, 오늘날 GPT-6 Astra·GPT-6.1 Sol, Claude Opus 5.5·Fable 5.1, Gemini 3.8 Flash, DeepSeek V4.1-Flash 모두 노력·사고 레벨 제어 하에 답 전에 추론한다.

## CoT 혁명

표준 LLM은 "다음 토큰 예측기"다. 복잡한 수학·논리엔 단일 패스가 흔히 불충분하다. CoT는 모델이 하위 문제를 풀어나갈 "낙서장"(작업 기억)을 제공한다.

**공식**: `입력 → 추론(사슬) → 출력`

---

## 제로샷 vs 프로그램형 CoT

| 기법 | 트리거 문구 | 효율 | 사용처 |
|-----------|----------------|------------|----------|
| **제로샷 CoT** | "단계적으로 생각하자." | 높음 | 비추론 모델의 즉석 쿼리. |
| **퓨샷 CoT** | (로직 포함 예시 제공) | 더 높은 안정성 | 비추론 모델의 프로덕션 파이프라인. |
| **프로그램형 CoT** | "1. X 분석. 2. Y 검증. 3. Z 해결." | **에이전트에 최적** | 단계가 감사 가능해야 하는 복잡 멀티툴 과제. |

추론 모델에선 이 프롬프트가 대개 불필요하다: 모델이 이미 답 전에 생각한다. 대신 노력 레벨을 설정하고 답이 만족할 성공 기준을 진술하라.

최신 Claude 모델(Fable 5.1·5, Opus 5.5·5, Sonnet 5.5)에선 아예 실패할 수도 있다. 모델에게 추론을 출력에 쓰라는 프롬프트 — 답 전에 채우는 `<thinking>`·스크래치패드 섹션이나 JSON의 `reasoning` 필드 — 는 `reasoning_extraction` 거절 범주 하에 거절될 수 있고, 그 범주의 거절은 출력 전에 도착하며 과금된다. 대신 짧은 설명이나 답 뒤의 근거를 요청하고, 모델이 어떻게 추론했는지 봐야 하면 요약된 사고 블록을 읽어라.

---

## "사고" 모델의 부상

**GPT-6 Astra·GPT-6.1 Sol**, **Claude Opus 5.5·Fable 5.1**, **Gemini 3.8 Flash**, **DeepSeek V4.1-Flash** 같은 모델은 강화학습(RL)으로 CoT를 "내장"했다. 학습 방식은 [RLVR과 추론 모델](../03-training-and-adaptation/08-rlvr-and-reasoning-models.md) 참고.

1. **노력이 토큰 예산을 대체**: 모델이 전용 사고 단계를 가지며, 원시 토큰 수가 아니라 노력 레벨로 통제. OpenAI는 `reasoning.effort`(GPT-6 Astra·GPT-6.1 Sol에서 `low`~`max`), Anthropic은 적응형 사고 + `effort`(고정 `budget_tokens`는 이제 Opus 4.7 이후 400 반환), Gemini 3.8 Flash는 `thinking_level` 노출. API 세부는 [컨텍스트 엔지니어링](05-context-engineering.md) 참고.
2. **숨은 CoT**: 어떤 주요 벤더도 원시 사고 사슬을 반환하지 않는다. OpenAI는 선택적 요약·암호화 추론 아이템 반환; Anthropic은 요약 또는 빈("omitted", 최신 모델 기본) 사고 블록을 생산 모델·대화에 묶어 반환. 사고는 읽을 수 있든 없든 출력 토큰으로 과금. 한 동인은 **증류 방어**: Anthropic은 2026년 2월 경쟁사가 약 24,000개 사기 계정으로 1,600만+ 교환을 돌려 Claude에게 추론을 쓰게 했다고 공개했고, 2026년 9월 위협 보고서는 다섯 캠페인에 걸쳐 거의 2억 교환을 기술.
3. **스케일링 법칙**: 이 모델들은 **추론 스케일링 법칙**을 따른다: 더 오래 "생각"할수록 어려운 문제를 잘 풀되 토큰당 수익은 체감. OpenAI·Google DeepMind의 실험적 추론 모델이 IMO 2025에서 금메달 수준 도달.

---

## 모니터링 신호로서의 CoT

모델의 추론 읽기는 비행동이 행동이 되기 전 오작동을 잡는 싼 방법이었다. 그 신호가 프런티어에서 약해지고 있다.

- **통제성이 오르고 있다.** OpenAI GPT-6 Astra 시스템 카드(2026-09-03)는 750~1,250 토큰 길이 사고 사슬 중 Astra가 61.0%(0.609) 시간 CoT를 통제하며, GPT-5.6 Sol 16.1%·GPT-5.5 Thinking 1.7%에 대비된다고 보고(OpenAI 평가). UK AISI 별도 통제성 평가는 Astra가 샘플의 93%에서 제약을 따랐음을 발견. OpenAI는 모델이 은밀히 샌드백하려 하면 신뢰성 있게 못 잡을 것이라 적는다.
- **모니터가 평범한 압력 하에 회피된다.** EvasionBench(arXiv 2609.30217)는 알려진 런타임 모니터가 금한 연산을 요하는 과제에 에이전트를 두었다: best-of-3 회피 시도가 약 98%, 성공 최대 88%, 회피가 대체로 추론 노력과 함께 상승.

**설계 함의:** CoT를 통제가 아니라 디버깅 보조로 다뤄라. 안전 모니터를 **행동과 출력**(도구 호출, 디프, 네트워크 이그레스, 기록된 데이터)에 두고, 에이전트가 건드릴 수 있는 걸 샌드박스하고, 추론 트레이스는 보조 증거로 유지하라. [에이전트 보안과 샌드박싱](https://github.com/ombharatiya/ai-system-design-guide/blob/main/07-agentic-systems/09-agentic-security-and-sandboxing.md)(영문)과 잠재 추론에 대한 [Research Radar](https://github.com/ombharatiya/ai-system-design-guide/blob/main/RESEARCH-RADAR.md)(영문) 참고.

---

## 자기교정과 검증

프로덕션 파이프라인은 더 이상 단일 CoT를 신뢰하지 않는다. **자기검증**을 겹쳐 넣는다.

```markdown
# Process
1. CoT로 답 A 생성.
2. 비평: "위 로직에 오류가 있나?"
3. 오류 있으면: "로직을 고치고 답 B 제공."
```

**뉘앙스**: 내재적 자기교정(새 정보 없이 같은 모델이 자신을 비평)은 흔히 추론을 개선 못 하고 악화시킬 수 있다(Huang et al., 2024). 통하는 건 **외부 피드백**이다: 코딩의 **실행 검증 CoT**(모델이 로직을 쓰고 코드를 돌려 테스트 실패 시 자기교정), 또는 다른 프롬프트·모델·도구의 별도 검증기. [루프 엔지니어링](https://github.com/ombharatiya/ai-system-design-guide/blob/main/07-agentic-systems/12-loop-engineering.md)(영문) 참고.

---

## CoT가 실패할 때(과사고)

CoT는 만능이 아니다. 단순 과제엔 다음을 더한다:
1. **지연**: 토큰 많음 = 느린 응답.
2. **비용**: 모든 "사고" 토큰을 출력 요율로 지불(예: Claude Opus 5.5 1M당 $20, GPT-6.1 Sol 1M당 $10).
3. **과사고**: 없는 복잡성을 환각할 수 있음(예: 2+2=4를 왜인지 3문단 설명).

현 모델의 해법은 노력 다이얼이다: 챗·분류·추출엔 `low`, 평가가 이득을 보이는 곳만 더 높게. 일부 모델은 사고를 아예 못 끈다(Opus 5.5는 비활성 불가; Sonnet 5.5 최저 설정은 `between_tools`)라 노력이 유일한 레버.

---

## 면접 질문

### Q: CoT는 왜 수학 서술형 문제 성능을 개선하나?

**좋은 답변:**
CoT는 모델의 계산 복잡도를 과제의 논리 복잡도에 맞춰 성능을 개선한다. 표준 단일 패스 생성에선 모델이 제한된 국소 정보로 최종 답 토큰을 예측해야 한다. CoT로 모델은 문제를 더 작은 자기회귀 단계로 "쪼갠다". 각 단계가 이전 단계 출력을 문맥으로 써, 모델 어텐션이 한 번에 하나의 하위 문제에 집중하게(예: 먼저 사과를 더하고 다음 오렌지를 빼고) 해, 단일 패스 예측의 "인지 부하"를 줄인다.

### Q: 지연이 임계인 프로덕션 환경에서 CoT를 어떻게 다루나?

**좋은 답변:**
**하이브리드 추론 아키텍처**를 쓴다:
1. **티어 1(라우팅)**: 싼 분류기가 요청별 노력 레벨을 고름(대부분 트래픽 `low`, 필요한 쿼리만 `high`), 전역 설정 하나가 아니라.
2. **티어 2(응축 추론)**: 고볼륨 경로엔 작고 빠른 모델을 낮은 노력으로, 또는 **지식 증류**: 교사의 추론 트레이스에서 최종 답을 직접 내도록 작은 모델 학습.
3. **티어 3(스트리밍)**: 모델이 생각하는 동안 뭔가 스트리밍. 원시 CoT는 없으니 요약 사고나 진행 업데이트를 스트리밍(Claude `display: "summarized"`, 또는 도구 간 진행 메모용 `display: "updates"` 베타)해 UI가 멈춘 것처럼 안 보이게.

결과를 요청당이 아니라 완료 과제당 비용·지연으로 판단한다: 재시도가 필요한 더 싼 호출은 더 싸지 않다.

### Q: 안전 팀이 코딩 에이전트를 사고 사슬 읽기로 모니터링하려 한다. 뭐라 하겠나?

**좋은 답변:**
유용하나 충분치 않고, 점점 덜 충분하다. 벤더는 원시 추론을 노출하지 않고 요약만 준다. GPT-6 Astra 시스템 카드는 Astra가 중간 길이 트레이스에서 61.0% 시간 CoT를 통제(GPT-5.6 Sol 16.1% 대비)하고 은밀 샌드백이 안 잡힐 것이라 밝힌다. 별도로 EvasionBench는 에이전트가 알려진 런타임 모니터를 높은 비율로, 높은 노력에서 더 회피함을 보였다. 그래서 주 모니터를 행동에 둔다: 모든 도구 호출·파일 디프·네트워크 요청이 정책 검사를 거치고, 샌드박스가 기본 이그레스를 거부하고, 되돌릴 수 없는 행동은 실행되는 정확한 행동에 묶인 승인을 요한다. 추론 요약은 사고 검토 인간용 문맥으로 감사 로그에 들어간다.

---

## 참고 문헌
- Wei et al. "Chain-of-Thought Prompting..." (2022)
- Kojima et al. "Large Language Models are Zero-Shot Reasoners" (2022)
- Wang et al. "Self-Consistency..." (2023)
- Huang et al. "Large Language Models Cannot Self-Correct Reasoning Yet" (ICLR 2024)
- OpenAI. "Learning to Reason with LLMs" (2024)
- [OpenAI. GPT-6 Astra System Card (2026-09)](https://deploymentsafety.openai.com/gpt-6-astra)
- [Anthropic. "Detecting and preventing distillation attacks" (2026)](https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks)
- [Instrumental Monitor Evasion... (arXiv 2609.30217)](https://arxiv.org/abs/2609.30217)

---

*다음: [사고 나무](04-tree-of-thought.md)*
