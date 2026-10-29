---
title: "DSPy: 언어 모델 프로그래밍"
sidebar_position: 5
description: 프롬프트를 최적화 가능 파라미터로 다루는 업계 레퍼런스 DSPy — 프로그래밍 패러다임, 시그니처, MIPROv2·GEPA·Flex 옵티마이저, 출력 제약, 모델 드리프트 관리.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/09-frameworks-and-tools/05-dspy.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·버전은 원문 표기를 유지합니다. 코드는 원문 그대로 둡니다.
:::

# DSPy: 언어 모델 프로그래밍

**DSPy**는 프롬프트를 최적화 가능 파라미터로 다루는 업계 레퍼런스가 됐다. "프롬프트 엔지니어링"(시행착오)에서 **프롬프트 컴파일(Prompt Compilation)**(자동 최적화)로의 패러다임 전환을 대표한다. 발행 결과가 일부 과제서 수제 프롬프트 대비 큰 이득을 보이나, 리프트는 전적으로 당신 지표·데이터에 달렸으니 숫자 약속 전 자기 평가 세트에 측정하라.

2026 스토리는 둘째 전환, **프롬프트** 최적화서 **프로그램 구조** 최적화로: GEPA(반성적 프롬프트 진화, DSPy 3.0)가 최적화를 트레이스 주도로, Flex(DSPy 3.3.0, 2026-08-03)가 이로 모듈 조합법을 지시 텍스트뿐 아니라 검색. 현 릴리스: DSPy 3.4.0(2026-09-25).

---

## 프로그래밍 패러다임

DSPy가 LLM 애플리케이션을 **신경망**처럼 다룸.
- **모듈**: 재사용 로직 블록(예: `ChainOfThought`).
- **시그니처**: 모듈이 하는 일의 선언 명세(입력 -> 출력).
- **옵티마이저**: 지표 기반 모듈 최선 "가중치"(프롬프트) 찾는 프로세스.

---

## 시그니처: 과제 기술

100줄 프롬프트 작성 대신 **시그니처** 작성:
```python
class ResearchAssistant(dspy.Signature):
    """Answer the question by synthesizing the provided web context."""
    context = dspy.InputField(desc="Scraped web content")
    question = dspy.InputField()
    answer = dspy.OutputField(desc="A technical summary with citations")
```
**이기는 뉘앙스**: 시그니처가 **모델 불가지론**. 프로그램 코드 한 줄 안 바꾸고 Claude Opus 5.5·Claude Sonnet 5.5·GPT-6.1 Sol·Gemini 3.8 Flash나 Qwen3.8-27B 같은 오픈 웨이트 모델에 컴파일 가능. 모델별 바뀌는 건 컴파일 아티팩트(지시·데모), 그래서 각 모델 티어가 자기 컴파일 실행 받음.

---

## 옵티마이저: MIPROv2, GEPA, Flex

**MIPROv2(Multi-stage Instruction PRoposal Optimizer)**가 오랜 일꾼.
1. **지시 제안**: "어시스턴트 모델"이 과제용 시스템 프롬프트 작성 10-20 다른 방법 제안.
2. **베이지안 최적화**: DSPy가 제안 프롬프트를 작은 학습 세트에 돌려 지표로 채점.
3. **선택**: 지표(예: 사실성 점수) 최대화 프롬프트 고름.

**GEPA**(반성적 프롬프트 진화, `dspy.GEPA`, DSPy 3.0 추가)가 점수 전용 검색을 반성으로 대체: LLM이 실행 트레이스·지표 피드백 읽고 타깃 지시 편집 제안, 다른 예시서 이기는 후보의 Pareto 프런티어 유지. 스칼라 점수뿐 아니라 텍스트 피드백 사용 가능, 저자들이 RL보다 훨씬 적은 롤아웃으로 RL 파인튜닝(GRPO)·MIPROv2 둘 다 이김 보고.

**Flex**(DSPy 3.3.0, 2026-08-03)가 GEPA로 **프로그램 구조** 최적화: 각 프롬프트가 뭐라는지뿐 아니라 어느 모듈 존재하고 어떻게 연결되나. **ReAnchor**(3.4.0, 2026-09-25)가 결정 임계·점수 컷·선택 가중치를 프로그램 지표 대비 보정.

| 옵티마이저 | 검색 대상 | 손 뻗을 때 |
|---|---|---|
| MIPROv2 | 지시·few-shot 데모 | 고정 파이프라인이 더 나은 프롬프트 필요하고 수백 레이블 예시 보유 |
| GEPA | 지시, 트레이스 반성·텍스트 피드백 안내 | 롤아웃이 비싸거나 지표가 왜 출력 실패했는지 설명 가능 |
| Flex | 프로그램 구조, GEPA 통해 | 분해 자체가 틀렸다 의심(누락 검증 스텝·틀린 모듈 경계) |

---

## 출력 제약: Refine와 BestOfN

구 튜토리얼이 `dspy.Assert`·`dspy.Suggest` 가르침. DSPy 2.6에 폐기돼 3.x엔 사라짐; 이를 쓰는 코드가 현 설치에 실패. 대체는 불리언 어서션 대신 **보상 함수** 받음:

```python
import dspy

def under_50_words(args, pred) -> float:
    return 1.0 if len(pred.answer.split()) <= 50 else 0.0

qa = dspy.ChainOfThought("question -> answer")

# Retry up to 3 times with feedback until the reward clears the threshold
refined = dspy.Refine(module=qa, N=3, reward_fn=under_50_words, threshold=1.0)

# Or sample 3 independently and keep the best
best = dspy.BestOfN(module=qa, N=3, reward_fn=under_50_words, threshold=1.0)
```

- `dspy.Refine`이 실패 시도를 힌트로 되먹임, 길이·포맷 같은 소프트 제약에 적합.
- `dspy.BestOfN`이 독립 샘플해 최고 보상 유지, 노이지 과제에 적합.
- **하드 제약**("PII 포함 금지")은 재시도에 전혀 의존 말 것. 모듈 뒤에 결정적 검증기 두고 fail closed; 보상 함수는 준수를 가능케 하지 보장 않음.

---

## 모델 드리프트 관리

OpenAI나 Anthropic이 새 모델 출시하면 수제 프롬프트가 흔히 깨짐. 2026-09에만 Anthropic이 Fable 5.1·Opus 5.5·Sonnet 5.5, OpenAI가 GPT-6 Astra·GPT-6 Sol·Luna·GPT-6.1 Sol 배송.
- **DSPy 답**: **재컴파일**. 옵티마이저가 같은 지표 대비 새 모델용 새 지시·데모 찾음, 모델 마이그레이션을 재작성이 아니라 측정 작업으로 전환.
- **함정**: 재컴파일이 뒤의 평가 세트·지표만큼만 좋고 실제 모델 호출 비용. 모델 스왑당 예산, 컴파일 프로그램이 옛것 이기는 데 스왑 게이트.

---

## DSPy 3.3·3.4 변화

DSPy가 여느 프레임워크처럼 변동하니 핀:

| 릴리스 | 날짜 | 바뀐 것 |
|---|---|---|
| 3.3.0 | 2026-08-03 | Flex 구조 최적화; 네이티브 도구 호출의 **ReActV2**; 타입·제공자 중립 LM 경계 시작; NumPy 선택 |
| 3.3.1 | 2026-08-21 | GEPA 0.1.4; 하드닝 `PythonInterpreter`; MCP Python SDK v2 호환 |
| 3.4.0 | 2026-09-25 | 커스텀 HTTP 제공자의 네이티브 LM 엔진. **파괴적**: 실험적 3.3 타입 LM API 제거. 또 비동기 ReActV2·`LocalInterpreter`(신뢰 코드용 영속 CPython, RLM·Flex와 사용)·ReAnchor·TypeSafe Jev 결정 모델 통합하는 실험적 타입 결정 출력(`Noul`·`Choice`·`Score`) |

계획할 두 폐기: OpenAI 스타일 `messages=` 호출이 이제 경고하고 3.5 제거 예정, 커스텀 `BaseLM.forward` 통합이 3.5까지 폐기 경고와 실행.

---

## 면접 질문

### Q: DSPy가 왜 "안티 프롬프트 엔지니어링"으로 여겨지나?

**좋은 답변:**
**수동 시행착오 루프**를 **최적화 루프**로 대체하니. 프롬프트 엔지니어링선 인간이 옵티마이저. DSPy선 인간이 **교사**. *목표*(시그니처)·*평가*(지표) 정의하고 몇 *예시* 제공. 프레임워크가 수학 최적화(베이지안 검색 등)로 통계적 최선 토큰 찾음. 이로 시스템이 하드코딩 문자열 라이브러리보다 훨씬 **이식·확장** 가능.

### Q: 프로덕션 환경서 DSPy의 가장 큰 단점은?

**좋은 답변:**
**컴파일 지연·비용**. 복잡 DSPy 파이프라인 컴파일에 다른 프롬프트 변형 테스트 위해 100-500 LLM 호출 필요할 수 있고, 타깃 모델마다 반복. 상당한 선행 비용. 그러나 스태프급엔 **트레이드오프**: 개발·컴파일 시간 더 지불해 제어하는 지표 대비 **측정 신뢰성**과 낮은 **런타임 실패율** 획득. 보장은 없음: 컴파일 프로그램이 평가 세트만큼만 좋음. 또 다른 도전은 학습 곡선; 전통 개발자보다 ML 연구자처럼 사고 요구. 셋째는 프레임워크 변동: 3.4가 3.3이 8주도 안 전 도입한 실험적 API 제거, 그래서 버전 핀하고 업그레이드 시 평가 스위트 재실행.

### Q: MIPROv2 대신 GEPA나 Flex를 언제 쓰나?

**좋은 답변:**
MIPROv2가 고정 파이프라인의 지시·데모 검색, 베이지안 검색 작동에 충분 롤아웃 필요. GEPA가 트레이스·텍스트 피드백 반성, 그래서 각 롤아웃 비쌀 때(긴 에이전트 실행)나 지표가 *왜* 출력 실패했는지 말할 때 적합. Flex가 한 수준 올라 GEPA로 프로그램 구조 변경, 오류 분석이 분해가 틀렸다 할 때(예: 누락 검증 스텝) 시도, 표현이 아니라. 모든 경우 결정 입력이 지표: 약한 지표가 어느 옵티마이저나 과적합 허용하니, 옵티마이저가 안 보는 홀드아웃 세트 유지.

---

## 참고 문헌
- Khattab et al. "DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines" (arXiv 2310.03714, Oct 2023): https://arxiv.org/abs/2310.03714
- Opsahl-Ong et al. "Optimizing Instructions and Demonstrations for Multi-Stage Language Model Programs" (arXiv 2406.11695, Jun 2024; the MIPRO paper): https://arxiv.org/abs/2406.11695
- Agrawal et al. "GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning" (arXiv 2507.19457, Jul 2025): https://arxiv.org/abs/2507.19457
- DSPy 3.4.0 release notes (Sep 25, 2026): https://github.com/stanfordnlp/dspy/releases
- DSPy. "Output Refinement: BestOfN and Refine": https://dspy.ai/tutorials/output_refinement/best-of-n-and-refine/

---

*다음: [Semantic Kernel: 엔터프라이즈 AI](06-semantic-kernel.md)*
