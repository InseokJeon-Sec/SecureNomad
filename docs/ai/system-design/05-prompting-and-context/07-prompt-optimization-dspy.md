---
title: 프롬프트 최적화(DSPy)
sidebar_position: 7
description: 알고리즘이 프롬프트를 자동 최적화하는 LLM 파이프라인 구축의 사실상 표준 DSPy — 프로그래밍 vs 프롬프팅 철학, 시그니처·모듈, 텔레프롬프터(옵티마이저), 프롬프트-가중치 유비, 지표 주도 최적화.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/05-prompting-and-context/07-prompt-optimization-dspy.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 프롬프트 최적화(DSPy)

프롬프팅이 "손튜닝" 시대에서 "프로그램형" 시대로 옮겨갔다. **DSPy(Declarative Self-improving Language Programs)** 는 프롬프트가 알고리즘으로 자동 최적화되는 LLM 파이프라인 구축의 사실상 표준이다. 현 릴리스는 DSPy 3.4.0(2026-09-25)이고, 3.x 라인은 강조점을 프롬프트 텍스트 최적화(MIPROv2)에서 반성·프로그램 구조 최적화(GEPA, 3.3의 Flex)로 옮겼다. 프레임워크 심층은 [DSPy](https://github.com/ombharatiya/ai-system-design-guide/blob/main/09-frameworks-and-tools/05-dspy.md)(영문); 이 장은 프롬프팅 아이디어를 다룬다.

## DSPy 철학: 프로그래밍 vs 프롬프팅

전통 프롬프팅에선 모델 변경(예: GPT-6.1 Sol→Claude Sonnet 5.5 또는 Qwen3.8-27B 같은 오픈 가중치)에 모든 프롬프트 재작성이 필요하다.
**DSPy는 로직을 포맷팅에서 분리한다.**

- **로직**: **모듈**(예: ChainOfThought, ReAct)로 정의.
- **최적화**: 시스템이 그 로직을 충족하도록 *특정* 모델에 대한 최선 프롬프트·예시를 자동으로 찾음.

---

## 시그니처와 모듈

프롬프트를 쓰는 대신 **시그니처**를 정의한다: 입력이 무엇이고 출력이 무엇이어야 하는가.

```python
# 시그니처 패턴
class MultiHopQA(dspy.Signature):
    """여러 문맥 검색이 필요한 질문에 답한다."""
    context = dspy.InputField()
    question = dspy.InputField()
    answer = dspy.OutputField(desc="간결한 1문장 답")

# 로직은 모듈이 처리
qa_system = dspy.ChainOfThought(MultiHopQA)
```

기본적으로 `ChainOfThought`는 모델이 답 전에 채우는 평문 `reasoning` 출력 필드를 앞에 붙인다. 추론 모델엔 중복 작업이고, 최신 Claude 모델(Fable 5.1, Opus 5.5, Sonnet 5.5)에선 출력의 `reasoning` 필드가 `reasoning_extraction` 거절의 나열된 트리거다. 고정 노력 레벨의 네이티브 사고를 쓰는 `dspy.Predict`와 비교하고 지표가 고르게 하라.

---

## 텔레프롬프터(옵티마이저)

텔레프롬프터(원래 이름; DSPy 문서는 이제 **옵티마이저**라 부름)는 정확도를 높이려 프로그램을 반복하는 알고리즘이다.
1. **BootstrapFewShot**: 프롬프트용 고품질 예시를 자동으로 찾음.
2. **MIPROv2**: 다른 지시 표현·데모를 시도해 점수를 극대화하는 조합을 고르는 베이지안 옵티마이저. 수백 개 라벨 예시와 고정 파이프라인이 있을 때 여전히 주력.
3. **GEPA**(반성적 프롬프트 진화): LLM이 실행 트레이스와 지표 피드백을 읽고 표적 지시 편집을 제안하며 후보의 파레토 프런티어를 유지. 논문은 훨씬 적은 롤아웃으로 RL 기반 튜닝을 맞먹거나 능가함을 보고 — 각 롤아웃이 긴 에이전트 실행일 때 중요.
4. **Flex**(DSPy 3.3.0, 2026-08-03): GEPA로 각 프롬프트 텍스트만이 아니라 **프로그램 구조**(어떤 모듈이 존재하고 어떻게 연결되는지)를 최적화.
5. **ReAnchor**(DSPy 3.4.0): 출력이 자유 텍스트가 아닌 타입 결정(예/아니오, 선택, 점수)인 프로그램에 대해, 결정 임계·점수 컷·선택 가중치를 프로그램 지표에 맞춰 보정.

**중요한 이유**: "Be helpful"이 나은지 "Think carefully"가 나은지 더 이상 추측 안 한다. 옵티마이저가 데이터로 증명한다.

---

## "프롬프트는 가중치" 유비

DSPy에서 프롬프트는 신경망의 가중치 같다. 가중치를 "하드코딩"하지 않고 학습시킨다.
- 모델을 바꾸면 프로그램을 **재컴파일**(재학습)만 하면 된다. 옵티마이저가 새 모델이 더 잘 이해하는 새 퓨샷 예시를 찾는다.
- **노력 레벨을 모델의 일부로 다뤄라.** 기본값이 다르고(Opus 5.5 `medium`, Opus 5 `high`) 샘플링 파라미터가 최신 API에서 사라지므로, 한 노력 레벨에서 컴파일된 프로그램은 다른 레벨에서 검증되지 않았다.
- DSPy 버전도 핀하라. 3.4.0이 실험적 3.3 타입 LM API를 제거했고, OpenAI 식 `messages=` 호출이 이제 3.5 제거를 앞두고 폐기 경고를 낸다.

---

## 지표 주도 최적화

최적화엔 **지표**(점수를 반환하는 함수)가 필요하다.
- **정확 일치**: `prediction.answer == target.answer`
- **LLM-as-Judge**: 더 강한 모델(Claude Opus 5.5, GPT-6.1 Sol)로 더 작은 모델(Claude Haiku 4.5, GPT-6 Luna, Gemini 3.8 Flash) 출력을 채점. 먼저 심판을 인간 라벨에 보정하라: 옵티마이저는 지표의 맹점을 악용한다.
- **심판 비용**: 옵티마이저 실행은 수백~수천 후보 출력을 채점하니 심판이 흔히 과금을 지배. 이진 체크리스트 기준엔 타입 결정 모델이 더 싼 선택: 한 비교(arXiv 2609.29769)는 LLM 루브릭 심판이 TypeSafe Jev(얼리 액세스)의 16~325배 비용이고, 27개 짝 비교 중 최대 8개에서만 정확도가 유의하게 달랐다고 발견. 함께 실패하기도 했다: Jev의 가장 확신한 오류에서 LLM 판정의 약 96%가 같은 틀린 답을 반복해, 심판 교체가 인간 보정셋을 대체하지 않는다.
- **텍스트 피드백**: GEPA는 지표가 숫자만이 아니라 출력이 *왜* 실패했는지 반환할 때 가장 잘 작동.

---

## 면접 질문

### Q: DSPy는 프롬프트 엔지니어링의 "취약성"을 어떻게 해결하나?

**좋은 답변:**
DSPy는 "포맷팅"과 "접지"의 복잡성을 인간에서 컴파일러로 옮긴다. 손으로 프롬프트를 쓰면 한 모델의 한 시점에 특정한 동작을 사실상 "하드코딩"하는 것이다(시점 튜닝). 그 모델이 갱신·교체되면 프롬프트가 깨진다. DSPy는 프롬프트를 학습 가능 파라미터로 다룬다. 명확한 **시그니처**와 **지표**를 정의해, 시스템이 수백~수천 평가 롤아웃에 걸쳐 가장 효과적 프롬프트를 "탐색"하게 해, 최종 시스템을 모델 변경에 훨씬 탄력적으로 만든다. 취약성이 사라지진 않는다; 이제 바로잡아야 할 지표로 옮겨간다.

### Q: DSPy 맥락에서 "텔레프롬프터"란?

**좋은 답변:**
텔레프롬프터(이제 옵티마이저)는 프로그램형 옵티마이저다. 할 일은 DSPy 프로그램(복잡한 모듈 사슬일 수 있음)과 소량의 학습 예시를 받아 최적화 버전으로 "컴파일"하는 것. 잠재적 "사고 패턴"과 예시를 생성해 지표에 대해 테스트하고 가장 효과적인 것을 고른다. 요컨대 텔레프롬프터는 프롬프트 엔지니어링 세계의 "경사하강"이다. 2026 확장은 더 새 옵티마이저가 프롬프트뿐 아니라 프로그램 구조도 탐색한다는 것: Flex는 지시를 재표현만 하지 않고 검증 단계를 더하거나 모듈 경계를 바꿀 수 있다.

---

## 참고 문헌
- Khattab et al. "DSPy: Compiling Declarative Language Model Calls..." (2023/2024)
- Agrawal et al. "GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning" (2025)
- [DSPy releases (3.3.0, 3.4.0)](https://github.com/stanfordnlp/dspy/releases)
- [Rao and Callison-Burch. "JEV vs. LLMs as Rubric Judges..." (arXiv 2609.29769)](https://arxiv.org/abs/2609.29769)
- Stanford NLP. "DSPy Documentation and Tutorials" (2025)

---

*다음: [프롬프트 인젝션과 방어](08-prompt-injection-defense.md)*
