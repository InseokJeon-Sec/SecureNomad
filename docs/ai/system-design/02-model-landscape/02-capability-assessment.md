---
title: 역량 평가
sidebar_position: 2
description: 특정 용도에 맞게 모델 역량을 평가·비교하는 방법 — 벤치마크의 한계, 벤더 표 읽는 법, 평가 차원, 커스텀 평가 구축, 흔한 함정, A/B 테스트.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/02-capability-assessment.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 역량 평가

이 장은 특정 용도에 맞게 모델 역량을 평가·비교하는 방법을 다룬다. 일반 벤치마크는 전체 그림을 거의 보여주지 못한다. 이 가이드는 의미 있는 평가를 수행하는 법을 돕는다.

## 벤치마크만으로는 부족한 이유

### 벤치마크의 문제

공개 벤치마크는 포화된 것(MMLU, HumanEval, GPQA Diamond)부터 최신 에이전트 스위트(SWE-Bench Pro, Terminal-Bench 4.0, OSWorld 2.0)까지 한계가 있다:

| 문제 | 영향 |
|-------|--------|
| 학습 데이터 오염 | 모델이 시험 문제를 봤을 수 있다. SWE-Bench Pro v2의 공개 분할은 99.4%(Claude Opus 5)인데 비공개 272과제 세트는 81.6%다. Scale은 격차 대부분을 학습 노출 탓으로 본다 |
| 부당한 통과 | 에이전트가 과제를 풀지 않고 답을 찾아낸다. SWE-Bench Pro v1.0 감사에서 통과의 24%(Opus 4.7)~73%(Fable 5)가 부당했고, 대부분 git 히스토리의 정답 솔루션을 통해서였다(arXiv 2609.34262) |
| 하네스 의존 | 같은 모델, 같은 시험 세트인데 GPT-6 Astra가 ARC Prize의 벤더 중립 하네스에선 ARC-AGI-3에서 62.7%, 요청 간 추론 상태를 보존하는 OpenAI 어댑터에선 99.9% |
| 지표 선택 | OSWorld 2.0의 주지표는 이진 과제 완료지만 출시 글은 부분 점수를 인용한다. 공식 리더보드 v2.1 전체 세트에서 Opus 5(max)는 같은 실행에 이진 44.33%, 부분 77.67% |
| 안전 폴백 | Claude Opus 5.5는 안전장치를 켠 채 벤치마크됐고, 장치가 개입하면 Opus 4.8이나 Opus 5가 과제를 완료했다. Artificial Analysis는 이런 항목을 "with fallback"으로 표시 |
| 과제 불일치 | 벤치마크가 당신의 용도를 반영하지 못할 수 있다 |
| 약한 구성 타당도 | 같은 개념에 배정된 벤치마크들이, 무관한 벤치마크와 비슷한 정도로만 서로 상관된다(53개 모델에 걸친 56개 벤치마크, arXiv 2609.08812) |
| 종합 점수가 분산을 숨김 | 모델 A가 전체적으로 B를 이겨도 당신 도메인에선 질 수 있다 |
| 게이밍 | 실제 과제보다 벤치마크에 최적화된 모델 |
| 포화 | 벤치마크가 모델 역량을 따라가지 못함: GPQA Diamond는 프런티어에서 약 96% |

### 벤치마크가 알려주는 것

```
벤치마크 결과가 알려주는 것: "모델 X가 Terminal-Bench 4.0에서 58%를 받았다"

당신이 알아야 하는 것: "내가 감당할 수 있는 effort 수준에서, 내 하네스에서,
모델 X가 우리 팀의 실제 과제를 감독 없이 끝낼 수 있는가?"
```

**경험칙:** 벤치마크는 초기 필터링에만 쓰고, 그다음 직접 평가를 수행하라.

### 벤더 벤치마크 표 읽는 법 (2026년 10월)

모든 점수는 의미를 가지려면 여섯 가지 라벨이 필요하다: **벤치마크 버전, 하네스, effort 수준, 누가 실행했는가(리더보드 vs 벤더), 폴백 상태, 지표**. 두 점수가 비슷하면 **과제당 비용**도 추가하라. 2026년 9월 출시들이 이유를 보여준다:

| 보게 될 주장 | 실제로 측정된 것 |
|--------------------|----------------------------|
| "Opus 5.5가 Terminal-Bench 4.0에서 66.4%" | Anthropic 자체 실행, xhigh effort(벤더 보고, SE ±2.6). tbench.ai 리더보드 9/21 업데이트는 Opus 5.5 이전이고, 최상위는 GPT-6 Astra 58.18%(max) |
| Terminal-Bench 4.0 "Astra 57.9%" vs "Astra 58.2%" | OpenAI 수치는 high effort, 58.18%는 리더보드 max-effort 실행 |
| "Fable 5.1 55.8%" vs "Fable 5.1 57.9%" | Anthropic 자체 실행 vs 리더보드 max-effort 항목(57.88%), xAI가 Grok 4.7 표에 인용 |
| "GPT-6 Astra ARC-AGI-3 99.9%" | ARC Prize Provider Adapter 하네스, high effort, $18,817. Standard 하네스 max effort는 62.7%, $26,098 |
| "Opus 5.5 OSWorld 2.1 81.8%" | 부분 점수 지표, 벤더 실행. 공식 리더보드 v2.1 전체 세트(9/17)에서 Opus 5(max)는 이진 44.33%, 부분 77.67%; 그 업데이트는 Opus 5.5 이전 |
| 도구 사용 HLE: Astra가 앞? Opus 5.5가 앞? | 둘 다. HLE-Diamond(정제 1,000문항): Astra 82.9%, Opus 5.5 73.9%. Anthropic 전체 HLE 표: Opus 5.5 67.7%, Astra 57.2%. 데이터셋과 실행기가 순서를 뒤집는다 |
| "DeepSWE v1.1에서 세 모델이 74% 동률" | 같은 통과율이지만 과제당 비용: $2.36(Gemini 3.8 Flash, high), $4.43(GPT-6 Astra, xhigh), $11.84(Claude Opus 5, max) |
| "Opus 5.5가 AA Intelligence Index 58로 선두" | Index v4.3.2, max effort, 안전장치 폴백 포함. v4.3(9/7 출시) 이전 점수는 다른 척도라 비교 불가 |

따르는 규칙: **같은 하네스·같은 effort·같은 실행자 수치만 비교 가능하다.** 벤더 수치는 벤더 최적 구성에 대한 주장이지, 당신 환경에 대한 예측이 아니다. [벤치마크 장](https://github.com/ombharatiya/ai-system-design-guide/blob/main/14-evaluation-and-observability/03-benchmarks-and-leaderboards.md#harness-and-scaffold-variance)이 하네스 분산을 더 깊이 다룬다.

---

## 평가 차원

### 차원 1: 과제 성능

| 과제 유형 | 평가 접근 | 핵심 지표 |
|-----------|---------------------|------------|
| **자율 코딩** | SWE-Bench Pro v2(비공개 세트), DeepSWE v1.1, Terminal-Bench 4.0, 그다음 자신의 저장소 | 해결된 과제 %, 해결 과제당 비용 |
| **장기 계획** | 에이전트 루프 테스트(tau3-bench v1.0.1, Agents' Last Exam) | 10단계 이상 계획의 성공률 |
| **컴퓨터 사용** | OSWorld 2.0 | 이진 완료 우선, 부분 점수 차순위 |
| **추론 깊이** | effort 스윕(low~max) | 각 effort 수준의 정확도와 토큰 |
| **장문맥 RAG** | 최대 1M 토큰의 멀티니들·추론 회상(MRCR, AA-LCR) | 깊이에서의 회상과 교차 문서 추론 |
| **네이티브 멀티모달** | 인터리브 비전/음성/텍스트 | 모달리티 간 동기 정확도 |

### 차원 2: 에이전트 숙련도

모델이 도구를 얼마나 잘 쓰고 다단계 지시를 얼마나 잘 따르는가?

```python
def evaluate_agentic_flow(agent, task_environment):
    """
    Measure success on 'Autonomous Agent' tasks:
    1. Plan generation
    2. Tool selection accuracy
    3. Error recovery
    4. Feedback loop utilization
    """
    results = []
    for scenario in task_environment.scenarios:
        traj = agent.run(scenario.goal)
        results.append({
            "success": traj.reached_goal,
            "steps": len(traj.steps),
            "tool_errors": traj.count_invalid_tool_calls()
        })
    return aggregate(results)
```

최종 상태는 에이전트 자신의 보고가 아니라 **새롭고 격리된 검사**로 채점하고, 가능하면 샌드박스 네트워크를 모델 엔드포인트로 잠가라. SWE-Bench Pro v2는 이제 둘 다 한다(네트워크 잠금 샌드박스 + 깨끗한 이미지에서 모든 diff 재채점). 재채점은 한 프런티어 모델이 Go 모듈 버전을 위조한 것을 잡아냈다.

### 차원 3: 추론 신뢰성

사고(thinking)는 이제 스위치가 아니라 다이얼이다. Claude Opus 5.5는 사고를 끌 수 없고, Sonnet 5.5의 최저 설정은 `between_tools`이며, GPT-6 Astra에는 `none` effort가 없다. 질문은 당신 과제가 어떤 **effort 수준**을 필요로 하느냐다:

| Effort(예시) | 정확도(수학) | 정확도(코드) | 평균 지연 | 출력당 토큰 |
|-----------------------|-----------------|-----------------|-------------|-----------------|
| **Low** | 78% | 74% | 2.1s | 600 |
| **Medium** | 88% | 84% | 5.8s | 1,500 |
| **High** | 93% | 88% | 12.5s | 2,800 |
| **Max** | 94% | 89% | 31s | 7,000 |

기본값은 당신 모르게 바뀐다: Opus 5.5는 Opus 5가 `high`를 쓰던 자리에서 `medium`을 기본으로 하고, GPT-6.1 Sol도 `medium` 기본, Sonnet 5.5는 API에선 `high`지만 Claude Code에선 medium이 기본이다. 평가와 프로덕션 모두에서 effort를 명시적으로 고정하라. max-effort 평가는 medium-effort 배포를 예측하지 못한다.

### 추론 보정(Calibration)

**"과잉 사고(Over-Thinking)" 문제:**
모델은 10토큰이면 답할 수 있는 질문("2+2는?")에 종종 2000+ "사고" 토큰을 쓴다.

**시니어급 뉘앙스:**
모델을 **논리 효율(Logic Efficiency)**로 평가하라: `정확도 / (추론 토큰)`.
프로덕션 시스템은 **모델 중재(Model Arbitration)**를 쓴다: 작고 싼 모델(GPT-6 Luna, 낮은 thinking의 Gemini 3.8 Flash, Claude Haiku 4.5)이 쿼리를 분류해 메인 호출의 effort 수준이나 모델을 고른다. 사고를 끌 수 없는 모델에선 중재자의 일이 `low` vs `high`를 고르는 것이고, 그래도 단순 쿼리의 10배 지연·비용 페널티를 피한다.

정확도만이 아니라 **과제당 토큰**을 측정하라. 여기서 모델 간 차이가 몇 배다: Artificial Analysis는 GPT-6 Astra가 코딩 과제당 GPT-5.6 Sol 토큰의 약 1/3을 쓴다고 측정했고, Muse Spark 1.3은 1.2보다 장황해져 토큰 단가는 안 바뀌었는데도 과제당 비용이 올랐다.

### 차원 4: 문맥 회상

1M 토큰 창이 이제 표준이 되면서(Claude 4.6 이후, GPT-6 1.05M, Gemini 3.8 Flash 1,048,576), 단순 "건초더미 속 바늘"로는 부족하다. 이제 창 전반의 **문맥적 추론(Contextual Reasoning)**을 측정한다.

| 지표 | 측정 | 목표 |
|--------|-------------|--------|
| **창 회상** | 창 깊이 90%에서의 사실 회상 | &gt; 98% |
| **교차 문서 추론** | 문서 A(위치 10k)와 문서 B(위치 900k)를 잇는 논리 | &gt; 90% |
| **문맥 잡음 저항** | 창의 90%가 무관한 "채움"일 때의 정확도 | &gt; 95% |
| **장문 출력 일관성** | 생성 64K-128K 토큰에 걸친 일관성(현재 출력 상한은 Claude 5.x·GPT-6 128K, Gemini 3.8 Flash 65,536; Google은 발표된 Gemini 4 Argon이 상한을 1M으로 올린다고 함) | 과제별 |

회상과 함께 비용을 기록하라. OpenAI 모델에선 272K 토큰을 넘는 프롬프트가 요청 전체를 장문맥 요율로 과금하므로, 800K에서 잘 회상하는 모델도 가격에서 RAG에 질 수 있다. 출력도 마찬가지다: 1M 토큰 출력 상한은 한 호출로 청크 생성 루프를 대체할 수 있지만, 그 길이에서 일관성과 비용을 측정한 뒤에만 그렇다.

---

## 내부 Elo 기반 평가

**정적 루브릭을 넘어서.**
루브릭(1-5 척도)은 "심판 피로"와 "점수 표류"에 취약하다. 현대 시스템은 내부 골든 세트에 **쌍별 Elo(Pairwise Elo)**를 쓴다.

**워크플로:**
1. **블라인드 병렬 비교:** 모델 A와 B가 같은 쿼리에 답을 생성.
2. **심판:** 강한 모델(Claude Opus 5.5, GPT-6 Astra 또는 사람)이 승자를 고름. 각 쌍을 위치를 바꿔 두 번 실행하라. 대부분 프런티어 심판은 temperature를 더 이상 고정할 수 없으니, 분산을 가정으로 치우지 말고 측정하라.
3. **Elo 갱신:** 내부 리더보드 업데이트.

```python
def update_elo(winner_elo, loser_elo, k=32):
    expected_winner = 1 / (1 + 10 ** ((loser_elo - winner_elo) / 400))
    new_winner_elo = winner_elo + k * (1 - expected_winner)
    new_loser_elo = loser_elo + k * (0 - (1 - expected_winner))
    return new_winner_elo, new_loser_elo
```

**왜 이기나:** 심판 성향이나 모델 버전 변경에 훨씬 견고한 **상대적** 순위를 제공한다.

**이제 심판 비용은 설계 선택이다.** 텍스트 대신 보정된 점수를 반환하는 결정-모델 심판(TypeSafe의 Jev)은 LLM 루브릭 심판보다 16~325배 싸고, 27개 쌍 비교 중 최대 8개에서만 정확도가 유의미하게 달랐다(arXiv 2609.29769). 다만 결정 모델이 가장 확신한 오류에서는 LLM 판정의 약 96%가 같은 오답을 반복했고, 심판 캐스케이드는 최대 2.7점만 얻었다. 싼 심판은 이진 체크리스트 기준엔 괜찮지만, 같은 계열의 두 번째 심판은 독립성을 사주지 않는다.

---

## 커스텀 평가 구축

### 1단계: 평가 기준 정의

```python
evaluation_criteria = {
    "correctness": {
        "weight": 0.4,
        "description": "Is the answer factually correct?",
        "scale": [1, 2, 3, 4, 5],
        "rubric": {
            5: "Completely correct, no errors",
            4: "Mostly correct, minor issues",
            3: "Partially correct, some errors",
            2: "Mostly incorrect",
            1: "Completely wrong or nonsensical"
        }
    },
    "relevance": {
        "weight": 0.3,
        "description": "Does the answer address the question?",
        "scale": [1, 2, 3, 4, 5]
    },
    "completeness": {
        "weight": 0.2,
        "description": "Are all parts of the question addressed?",
        "scale": [1, 2, 3, 4, 5]
    },
    "conciseness": {
        "weight": 0.1,
        "description": "Is the answer appropriately concise?",
        "scale": [1, 2, 3, 4, 5]
    }
}
```

### 2단계: 테스트 세트 생성

```python
test_set = [
    {
        "id": "q001",
        "query": "What is the refund policy for subscription cancellation?",
        "context": "[relevant documentation]",
        "ground_truth": "Full refund within 30 days, prorated after",
        "difficulty": "easy",
        "category": "policy"
    },
    {
        "id": "q002",
        "query": "How do I integrate the API with a Python async application?",
        "context": "[API documentation]",
        "ground_truth": "[expected code pattern]",
        "difficulty": "medium",
        "category": "technical"
    },
    # ... 50-100+ test cases
]
```

**테스트 세트 지침:**
- 모든 주요 용도를 포괄
- 쉬움·중간·어려움 예시 포함
- 카테고리 간 균형
- 엣지 케이스 포함
- 명확한 정답 보유
- 가능하면 실제 프로덕션 트래픽에서 추출(시험처럼 보이지 않도록)

### 3단계: 평가 구현

```python
class ModelEvaluator:
    def __init__(self, models: list[str], test_set: list[dict]):
        self.models = models
        self.test_set = test_set
        self.results = {}
    
    def evaluate_all(self):
        for model in self.models:
            self.results[model] = self.evaluate_model(model)
        return self.results
    
    def evaluate_model(self, model: str) -> dict:
        scores = []
        latencies = []
        
        for case in self.test_set:
            start = time.time()
            response = self.generate(model, case)
            latency = time.time() - start
            latencies.append(latency)
            
            # Score using LLM judge or human
            score = self.score_response(case, response)
            scores.append(score)
        
        return {
            "mean_score": mean(scores),
            "score_by_category": self.group_by_category(scores),
            "p50_latency": percentile(latencies, 50),
            "p99_latency": percentile(latencies, 99)
        }
    
    def score_response(self, case: dict, response: str) -> float:
        # Option 1: LLM-as-judge
        return self.llm_judge(case, response)
        
        # Option 2: Exact match
        # return exact_match(response, case["ground_truth"])
        
        # Option 3: Semantic similarity
        # return cosine_sim(embed(response), embed(case["ground_truth"]))
```

### 4단계: LLM-as-Judge

```python
def llm_judge(case: dict, response: str) -> dict:
    prompt = f"""Evaluate this response to a customer query.

Query: {case['query']}
Expected Answer: {case['ground_truth']}
Model Response: {response}

Rate the response on these criteria (1-5 scale):
1. Correctness: Is it factually accurate?
2. Relevance: Does it answer the question?
3. Completeness: Are all aspects covered?
4. Conciseness: Is it appropriately brief?

Output JSON:
{{"correctness": X, "relevance": X, "completeness": X, "conciseness": X, "reasoning": "..."}}
"""
    
    result = judge_model.generate(prompt)
    return parse_json(result)
```

---

## 흔한 평가 함정

### 함정 1: 작은 테스트 세트

**문제:** 20개 케이스로는 신뢰할 만한 비교가 안 된다.

**해법:** 난이도·카테고리로 계층화한 100+ 케이스를 목표로.

### 함정 2: 모호한 정답

**문제:** "합리적인" 답이 오답 처리된다.

```
Query: "What is the capital of Australia?"
Ground truth: "Canberra"
Model answer: "The capital of Australia is Canberra."
Exact match: FAIL (but clearly correct)
```

**해법:** 정확 일치가 아니라 의미 매칭이나 LLM 심판을 쓰라.

### 함정 3: 평가 세트 유출

**문제:** 개발과 평가에 같은 케이스를 쓴다.

**해법:** 프롬프트 튜닝에 절대 쓰지 않는 홀드아웃 테스트 세트를 유지.

### 함정 4: 분산 무시

**문제:** 각 테스트를 한 번만 실행하면 모델 무작위성을 무시한다.

**해법:** 프로덕션 effort 설정으로 각 케이스를 최소 세 번 실행하고 신뢰구간을 보고하라. temperature는 대부분 프런티어 모델에서 더 이상 레버가 아니다: Claude API는 Opus 4.7 이후 비기본 샘플링 값에 400을 반환하고, Anthropic Python SDK 1.0은 Messages에서 `temperature`를 제거했으며, Google은 Gemini API에서 폐기했고, GPT-6 Astra는 받지 않는다. 분산은 튜닝으로 없애는 게 아니라 측정하는 것이다.

### 함정 5: 비용 맹점

**문제:** 최고 모델이 10배 비싸다.

**해법:** 항상 토큰이 아니라 과제당 품질 보정 비용을 보고하라. 74% DeepSWE v1.1 삼자 동률은 과제당 $2.36~$11.84에 걸친다.

```python
def quality_adjusted_cost(model_results):
    return {
        model: {
            "quality": results["mean_score"],
            "cost_per_1k": results["cost_per_1k_queries"],
            "quality_per_dollar": results["mean_score"] / results["cost_per_1k"]
        }
        for model, results in model_results.items()
    }
```

### 함정 6: 배포하는 것과 다른 시스템을 평가

**문제:** 평가가 max effort, 벤더 하네스, 다른 모델로의 안전 폴백, 또는 같은 ID로 이후 바뀐 모델에 대해 실행됐다.

**해법:** effort·하네스·도구·폴백 설정을 프로덕션에 맞추고, 모델 ID 변경뿐 아니라 공급사 측 변경에도 평가를 다시 돌려라. OpenAI는 2026-09-25 모델 ID를 바꾸지 않고 GPT-6 Sol·Luna의 이미지 이해 버그를 고치며 고객에게 이미지 평가 재실행을 알렸다. DeepSeek의 레거시 `deepseek-v4-flash` 이름은 이제 V4.1-Flash를 서빙한다.

### 함정 7: 평가 인식(Eval Awareness)

**문제:** 모델이 시험임을 알아채면 다르게 행동한다. Anthropic은 Opus 5.5가 감사 트랜스크립트의 36%에서 평가 인식을 보였고, 내부 Claude Code 트랜스크립트에선 0.4%였다고 보고한다.

**해법:** 명백히 합성된 프롬프트가 아니라 실제(정제된) 프로덕션 트래픽과 섀도 모드 실행에서 평가 세트를 만들고, 불일치 시 오프라인 점수보다 프로덕션 신호에 가중치를 둬라.

---

## 실전 평가 프로세스

### 1주차: 설정과 초기 필터링

```
1-2일: 평가 기준 정의 및 테스트 세트 생성
3-4일: 배포 가능한 effort 수준에서 후보 모델 4-6개 벤치마크
5일: 결과 분석, 상위 2-3개로 필터
```

### 2주차: 심층 평가

```
1-2일: 상위 후보용 테스트 세트 확장
3일: 엣지 케이스·견고성 테스트
4일: 지연·처리량 측정
5일: 총소유비용(TCO) 계산
```

### 3주차: 프로덕션 검증

```
1-2일: 섀도 모드 배포
3-4일: 트래픽이 허용하면 A/B 테스트
5일: 최종 결정 및 문서화
```

### 결정 템플릿

```markdown
## Model Evaluation Report

### Candidates Evaluated
- Model A: GPT-6 Sol (effort: medium)
- Model B: Claude Sonnet 5.5 (effort: high, API default)
- Model C: GLM-5.3-Flash (API)

### Evaluation Results

| Metric | Model A | Model B | Model C |
|--------|---------|---------|---------|
| Overall Score | 4.2/5 | 4.3/5 | 3.9/5 |
| Category 1 | ... | ... | ... |
| P50 Latency | 4.1s | 5.2s | 3.6s |
| Tokens per task (2,600 in + output incl. reasoning) | 3,500 | 3,700 | 4,000 |
| Cost/1K queries (list price) | $14.20 | $16.20 | $1.09 |

### Recommendation
Model B (Claude Sonnet 5.5) for quality-critical paths
Model C (GLM-5.3-Flash) for high-volume, cost-sensitive paths

### Rationale
[Detailed reasoning, including harness, effort and retirement dates]
```

---

## 모델 A/B 테스트

### 언제 A/B 테스트하나

- 높은 트래픽(1일 1000+ 쿼리)
- 명확한 성공 지표
- 품질 변동의 허용 가능한 위험
- 프로덕션 검증 필요

### A/B 테스트 설계

```python
import hashlib

class ModelABTest:
    def __init__(self, model_a: str, model_b: str, traffic_split: float = 0.5):
        self.model_a = model_a
        self.model_b = model_b
        self.traffic_split = traffic_split
        self.results = {"a": [], "b": []}
    
    def route_request(self, request_id: str) -> str:
        # Deterministic routing for consistency. Python's built-in hash() is
        # salted per process for strings, so use a stable digest instead.
        digest = hashlib.sha256(request_id.encode()).digest()
        hash_val = int.from_bytes(digest[:8], "big") % 100
        if hash_val < self.traffic_split * 100:
            return self.model_a
        return self.model_b
    
    def record_outcome(self, request_id: str, metrics: dict):
        model = self.route_request(request_id)
        bucket = "a" if model == self.model_a else "b"
        self.results[bucket].append(metrics)
    
    def analyze(self):
        return {
            "model_a": {
                "name": self.model_a,
                "mean_score": mean([r["score"] for r in self.results["a"]]),
                "sample_size": len(self.results["a"])
            },
            "model_b": {
                "name": self.model_b,
                "mean_score": mean([r["score"] for r in self.results["b"]]),
                "sample_size": len(self.results["b"])
            },
            "p_value": self.calculate_significance()
        }
```

모델이 턴 간 상태를 지닐 때는 요청 ID가 아니라 안정적 단위(사용자·대화 ID)로 라우팅하라. Claude Fable 5.1, Opus 5.5, Sonnet 5.5에서 사고 블록은 그것을 생성한 모델에 묶이므로, 대화를 스트림 중간에 두 암(arm) 사이로 바꾸면 추론이 조용히 버려진다.

### 추적할 지표

| 지표 유형 | 예 |
|-------------|----------|
| 품질 | 사용자 평점, 전문가 리뷰, LLM 심판 |
| 참여 | 클릭률, 체류 시간, 후속 쿼리 |
| 비즈니스 | 전환, 지원 에스컬레이션, 해결률 |
| 운영 | 지연, 오류, 과제당 비용, 거부율 |

---

## 면접 질문

### Q: 고객 지원 챗봇용 모델을 어떻게 평가하겠는가?

**좋은 답변:**
평가를 계층으로 구성한다:

**1. 오프라인 평가(노력의 80%):**
- 실제 지원 티켓에서 테스트 세트 생성(200+ 케이스)
- 모든 카테고리 포괄: 결제, 기술, 반품, 일반
- 쉬움·중간·어려움 난이도 포함
- 측정: 정확도, 유용성, 안전성

**2. 평가 방법:**
- 주관적 지표엔 LLM-as-judge
- 샘플(20%)은 사람 리뷰
- 지시 준수(형식, 길이) 추적

**3. 지표:**
```python
metrics = {
    "resolution_accuracy": "Does answer solve the problem?",
    "safety": "No harmful/wrong advice?", 
    "tone": "Professional and empathetic?",
    "escalation_appropriate": "Knows when to involve human?"
}
```

**4. 프로덕션 검증:**
- 섀도 모드: 새 모델 실행, 출력 비교
- A/B 테스트: 트래픽 10%를 새 모델로
- 모니터링: CSAT, 에스컬레이션율, 해결 시간

### Q: 당신 용도에 맞게 모델을 비교할 때 MMLU를 쓰는 게 왜 문제인가?

**좋은 답변:**
MMLU는 특정 용도에 여러 문제가 있다:

**1. 도메인 불일치:** MMLU는 학술 지식을 시험한다. 내 고객 지원 봇은 제품 지식이 필요하다.

**2. 형식 불일치:** MMLU는 객관식이다. 내 용도는 자유 형식 생성이다.

**3. 오염:** 모델이 MMLU 문제로 학습했을 수 있다.

**4. 종합이 분산을 숨김:** 모델 A가 MMLU에선 B를 이겨도 내가 신경 쓰는 특정 카테고리에선 질 수 있다.

**5. 문맥 미검증:** MMLU는 RAG나 장문맥 능력을 시험하지 않는다.

**6. 포화:** 프런티어 모델이 상단에 몰려 더 이상 구분하지 못한다. Artificial Analysis는 이제 MMLU-Pro, GPQA Diamond 등을 현재 인덱스 밖의 레거시로 둔다.

**더 나은 접근:**
- 벤치마크는 초기 필터링에만(시간 절약), 비공개 분할이 있는 오염 저항 벤치마크 선호
- 최종 결정엔 커스텀 평가 구축
- 실제 용도 데이터로 테스트
- 운영 지표(지연, 과제당 비용) 포함

### Q: 한 벤더가 새 모델의 ARC-AGI-3 점수를 99.9%로 보고한다. ARC Prize 자체 하네스는 같은 모델에 62.7%를 보인다. 어느 수치를 쓰겠는가?

**좋은 답변:**
둘 다 진짜이며 서로 다른 시스템을 측정한다. ARC Prize는 GPT-6 Astra에 대해 둘 다 검증했다. 99.9%는 요청 간 모델의 불투명한 추론 상태를 보존하는 Provider Adapter 하네스에서 high effort, 약 $19K로 실행됐다. 62.7%는 모델이 스스로 적는 메모만 유지하는 벤더 중립 Standard 하네스에서 max effort, 약 $26K로 실행됐다.

**어느 쪽이 내 시스템을 예측하나:**
- 내 에이전트가 벤더의 상태 보존 API·하네스에서 돈다면(OpenAI는 턴 간 추론 상태를 이어가는 Responses API), 어댑터 수치가 내 환경에 가깝다.
- 벤더 중립 하네스를 돌리거나 벤더 간 라우팅하거나 매 턴 문맥을 재구성한다면, 표준 수치가 정직하다. 모든 벤더 간 비교는 이것을 써야 한다.

**격차에서 얻는 것:** 같은 가중치의 두 실행이 약 37점 차이고, 차이는 스캐폴드다(낮은 점수가 심지어 더 높은 effort였다). 그래서 나는 내 하네스에서, 내 effort 수준으로 평가하고, 상태 처리(턴 간 무엇이 유지되는가, 페일오버가 그것을 버리는가)를 모델 선택의 일부로 다룬다. 과제당 비용도 기록한다: 여기선 높은 점수가 더 쌌다.

---

## 참고 문헌

- Zheng et al. "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (2023)
- Arena (formerly LMArena / LMSYS Chatbot Arena): https://arena.ai/
- Artificial Analysis Intelligence Index methodology: https://artificialanalysis.ai/methodology/intelligence-benchmarking
- ARC Prize, GPT-6 Astra on ARC-AGI-3: https://arcprize.org/blog/astra
- OSWorld 2.0 leaderboard (XLANG): https://osworld-v2.xlang.ai/
- "Maintaining Benchmarks Against Increasingly Capable Agents" (arXiv 2609.34262)
- "JEV vs. LLMs as Rubric Judges" (arXiv 2609.29769)
- HELM: https://crfm.stanford.edu/helm/
- LMSys Evaluation: https://github.com/lm-sys/FastChat/tree/main/fastchat/llm_judge
- OpenAI Evals (open-source framework; the hosted Evals platform goes read-only October 31, 2026 and shuts down November 30): https://github.com/openai/evals

---

*이전: [모델 분류 체계](01-model-taxonomy.md) | 다음: [가격과 비용](03-pricing-and-costs.md)*
