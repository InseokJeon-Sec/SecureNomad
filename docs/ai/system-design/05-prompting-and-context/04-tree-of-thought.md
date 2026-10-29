---
title: 사고 나무(ToT)
sidebar_position: 4
description: 여러 추론 경로를 탐색·평가하고 막다른 길이면 되돌아가는 사고 나무 — 사슬과의 차이, 제안·평가·탐색 루프, 자기교정·백트래킹, MCTS와 서치-애즈-서비스.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/05-prompting-and-context/04-tree-of-thought.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 사고 나무(ToT)

사고 나무(ToT)는 모델이 여러 추론 경로를 탐색하고 평가해, 경로가 막다른 길이면 "되돌아가는(backtrack)" 고급 프롬프팅 아키텍처다. 현대 탐색 기반 에이전트의 청사진이며, RL 학습 추론 모델은 이제 그 상당 부분을 하나의 긴 추론 트레이스 안에 내재화한다.

## 나무 vs 사슬

**사고 사슬**이 선형(한 경로)인 반면, **사고 나무**는 분기를 허용한다.

| 특징 | 사고 사슬 | 사고 나무 |
|---------|------------------|-----------------|
| **위상** | 선형(1 경로) | 분기(여러 경로) |
| **로직** | 순차 | 병렬 + 평가적 |
| **자기교정**| 낮음(투신 편향) | 높음(백트래킹) |
| **사용처** | 수학, 단순 논리 | 퍼즐 풀이, 코딩 아키텍처, 전략 계획 |

---

## ToT 루프: 제안, 평가, 탐색

ToT 시스템은 세 모듈로 이뤄진다:
1. **사고 제안기**: 문제에 대한 잠재 "다음 단계" 3-5개 생성.
2. **상태 평가기**: 각 단계 채점(예: "좋음", "아마", "불가능").
3. **탐색 알고리즘**: (BFS·DFS) 다음에 어느 분기를 탐색할지 결정.

```python
# ToT 로직 (가지치기 있는 간소화 너비 우선 탐색)
def tree_of_thought(problem, propose, evaluate, depth=3, breadth=3, threshold=0.5):
    frontier = [[]]  # 각 상태는 지금까지의 사고 목록
    for _ in range(depth):
        candidates = []
        for state in frontier:
            for thought in propose(problem, state, k=breadth):
                new_state = state + [thought]
                score = evaluate(problem, new_state)
                if score >= threshold:  # 임계 미만: 가지치기(백트래킹)
                    candidates.append((score, new_state))
        candidates.sort(key=lambda c: c[0], reverse=True)
        frontier = [state for _, state in candidates[:breadth]]
        if not frontier:
            return None  # 모든 분기 가지치기됨
    return frontier[0]
```

---

## 자기교정과 백트래킹

ToT는 특히 **환각 캐스케이드**를 극복하도록 설계됐다.
선형 사슬에선 모델이 1단계에서 실수하면 이후 모든 단계가 틀릴 가능성이 크다. ToT에선 "평가기"(다른 모델이나 규칙 기반 검사일 수 있음)가 1단계에서 오류를 잡아 모델이 다른 출발점을 시도하게 강제한다.

평가기가 전부다. 자기 분기를 채점하는 LLM은 오류를 낳은 같은 맹점을 물려받는다; **결정적 평가기**(단위 테스트, 타입 체커, 제약 솔버, 게임 엔진)가 백트래킹을 신뢰성 있게 만든다.

---

## MCTS와 서치-애즈-서비스

ToT는 LLM용 **몬테카를로 트리 탐색(MCTS)** 으로 진화했다(예: RAP — LLM을 세계 모델로 쓰는 추론-계획).
- **탐색 시 연산 스케일링**: 큰 프롬프트 하나 대신 작은 호출 여럿으로 최선 답을 "탐색": best-of-N 샘플링, 자기일관성 투표, 또는 검증기가 안내하는 완전 트리 탐색.
- **내재화된 탐색**: RL 학습 추론 모델(GPT-6 Astra, Claude Fable 5.1·Opus 5.5, 병렬 사고의 Gemini Deep Think 모드)은 하나의 추론 트레이스 안에서 제안·검사·백트래킹을 배우고, 노력 설정이 그 탐색량을 통제. 명시적 ToT 스캐폴딩은 이제 주로 모델이 스스로 못 돌리는 외부 검증기가 있거나, 채점·비교할 독립 병렬 샘플을 원할 때 비용값을 한다.

**스캐폴드가 모델만큼 중요할 수 있다.** ARC Prize는 ARC-AGI-3(2026-09)에서 GPT-6 Astra 테스트: 최소 Standard 하네스 max 노력에서 62.7%($26,098), 그러나 요청 간 모델 추론 상태를 보존하고 컴팩션을 쓰는 Provider Adapter 하네스 high 노력에서 99.9%($18,817). 같은 모델·테스트셋: 모델 자신의 추론 상태를 유지한 하네스가 더 낮은 노력·더 낮은 비용으로 37점 차 승리.

---

## 면접 질문

### Q: ToT가 단순 CoT보다 상당히 나을 때는?

**좋은 답변:**
ToT는 문제가 "큰 탐색 공간"을 가지고 "전역 일관성"을 요할 때 우월하다. 예로 복잡한 소프트웨어 리팩터에서 단일 CoT는 잘 시작하다 10단계 뒤 제약 충돌을 만날 수 있다. ToT로는 모델이 서로 다른 리팩터링 패턴 3개를 제안하고, 각각의 코드베이스 영향을 평가하고, 순환 의존을 낳는 패턴을 코드를 쓰기 전 버린다. 각 분기를 테스트 스위트나 컴파일러 같은 객관적 무언가로 검사할 수 있을 때 가장 값어치를 한다.

### Q: 소비자 대면 앱에서 사고 나무의 주 단점은?

**좋은 답변:**
주 단점은 **지수적 비용·지연**이다. 깊이 5로 분기 3개 탐색은 레벨당 분기당 제안·평가라, 공격적 가지치기에도 LLM 호출 30+. 소비자 앱에선 단일 쿼리에 30초 지연·$0.50 비용이 될 수 있다. 표준 완화는 "하이브리드 모델"이다: 고위험 오프라인 과제(골든 데이터셋 생성, 보안 감사)엔 ToT를 쓰고, 그 결과를 실시간 상호작용용 빠른 선형 모델로 증류.

### Q: 모델이 이미 추론 모델이면 명시적 ToT가 여전히 필요한가?

**좋은 답변:**
탐색 자체엔 대개 아니다: 높은 노력의 추론 모델은 이미 내부적으로 탐색·백트래킹하고, `high` 노력 호출 하나가 오케스트레이션된 30 호출보다 단순하고 흔히 싸다. 그래도 두 경우엔 명시적 탐색을 짓는다. 첫째, 모델이 못 돌리는 외부 검증기(독점 테스트 하네스, 솔버)가 있을 때 — 검증기 신호가 모델 자기평가를 이기기 때문. 둘째, 다양성·감사 가능성이 필요할 때: 채점·비교·로깅할 독립 샘플. 비용 검사는 호출당이 아니라 해결 과제당이다.

---

## 참고 문헌
- Yao et al. "Tree of Thoughts..." (2023)
- Hao et al. "Reasoning with Language Model is Planning with World Model"(RAP, 2023)
- Wang et al. "Self-Consistency..." (2023)
- Silver et al. "Mastering the Game of Go without Human Knowledge"(MCTS 영감)
- [ARC Prize. GPT-6 Astra on ARC-AGI-3 (2026-09)](https://arcprize.org/blog/astra)

---

*다음: [컨텍스트 엔지니어링](05-context-engineering.md)*
