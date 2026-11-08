---
title: 03. 파운데이션 모델의 활용 (Domain 3)
sidebar_label: 03. FM 활용
sidebar_position: 4
description: AIF-C01 Domain 3 — 프롬프트 엔지니어링·RAG·파인튜닝·추론 파라미터·모델 평가와 Bedrock 기능을 정리한다
---

# Domain 3 — 파운데이션 모델의 활용 (28%)

**비중이 가장 큰 도메인**이다. FM을 실제로 **어떻게 활용·커스터마이징·평가하는가**를 묻는다. 프롬프트 → RAG → 파인튜닝의 선택, 추론 파라미터, 평가 방법, 그리고 Bedrock의 기능이 핵심이다.

:::note 이 문서의 구성
**3.1 프롬프트 엔지니어링 → 3.2 커스터마이징 3단계(프롬프트·RAG·파인튜닝) → 3.3 추론 파라미터 → 3.4 모델 평가 → 3.5 Bedrock 핵심 기능** 을 다루고, 마지막에 **연습문제 20개**로 점검한다.
:::

---

## 3.1 프롬프트 엔지니어링

- **제로샷**: 예시 없이 지시만. **퓨샷(few-shot)**: 예시 몇 개를 함께 제공 → 형식·품질 향상.
- **좋은 프롬프트**: 명확한 지시 + 맥락 + 출력 형식 지정 + (필요시) 역할 부여.
- **思고 유도**: 단계적으로 생각하게 하면(체인 오브 소트) 복잡한 추론 품질↑.
- **프롬프트 템플릿**: 변수를 끼워 재사용. Bedrock의 프롬프트 관리로 버전화.
- **위험**: **프롬프트 인젝션**(악의적 입력이 지시를 덮어씀) → 입력을 데이터로 격리·검증.

## 3.2 커스터마이징 3단계 — 언제 무엇을 (핵심)

| 방법 | 방식 | 적합 | 비용·난이도 |
|---|---|---|---|
| **프롬프트 엔지니어링** | 입력만 조정 | 형식·말투·간단 맥락 | 낮음 |
| **RAG** | 외부 지식을 검색해 결합 | 최신·내부 사실 근거 | 중간 |
| **파인튜닝** | 모델을 추가 학습 | 특정 말투·형식·전문성 체화 | 높음 |

판단 순서: **프롬프트로 해결 → 지식 부족이면 RAG → 스타일·전문성 필요하면 파인튜닝.**

- **RAG(검색 증강 생성)**: 질문을 임베딩해 **벡터DB**에서 관련 문서를 찾아 프롬프트에 붙인다. 환각·지식한계를 줄이고 출처를 댈 수 있다.
- **벡터 저장소 옵션(AWS)**: OpenSearch(벡터), Aurora/RDS(pgvector), Neptune, 그리고 Bedrock Knowledge Bases가 이를 묶어 관리.
- **파인튜닝 종류**: 지도 파인튜닝, **도메인 적응(continued pre-training)**. 데이터 품질·프라이버시가 관건(학습 데이터가 모델에 영구히 남는다).

## 3.3 추론 파라미터 — 출력 성향 조절

| 파라미터 | 효과 |
|---|---|
| **Temperature** | 낮으면 결정적·일관, 높으면 다양·창의(통제 어려움) |
| **Top-p / Top-k** | 후보 토큰 분포를 잘라 다양성·품질 균형 |
| **Max tokens** | 출력 길이 상한 |
| **Stop sequences** | 특정 문자열에서 생성 중단 |

> "사실 일관성이 중요" → temperature 낮게. "브레인스토밍·다양성" → 높게.

## 3.4 모델 평가

- **정성 평가**: 사람 검토(human evaluation), 품질·유용성·안전성.
- **정량 지표**: 작업별 지표 — 요약/번역의 **ROUGE·BLEU**, 분류의 정확도·F1, 임베딩 검색의 적중률 등.
- **벤치마크**: 표준 데이터셋으로 비교. **Bedrock Model Evaluation** 으로 자동/인간 평가 수행.
- **비용·지연·정확도·안전성**을 함께 본다. "한 번 통과 = 안전" 아님 → 여러 번·분포로 평가.

## 3.5 Amazon Bedrock 핵심 기능

| 기능 | 하는 일 |
|---|---|
| **Knowledge Bases** | 관리형 **RAG** — 데이터 소스 연결·임베딩·검색을 자동화 |
| **Agents** | 다단계 작업·도구(API) 호출을 수행하는 에이전트 |
| **Guardrails** | 유해·금지 주제·PII를 필터링하는 안전 가드레일 |
| **Model customization** | 파인튜닝·도메인 적응 |
| **Prompt management / flows** | 프롬프트 버전관리·워크플로 |
| **Provisioned throughput** | 처리량 예약(대규모 운영·비용 예측) |

> RAG를 직접 구축하지 않고 관리형으로 → **Knowledge Bases**. 안전 필터 → **Guardrails**. 도구를 쓰는 다단계 작업 → **Agents**.

---

## 연습문제 (Domain 3)

**Q1.** 프롬프트에 정답 예시 몇 개를 함께 주어 출력 형식·품질을 높이는 기법은?

<details>
<summary>정답·해설</summary>

**퓨샷(few-shot) 프롬프팅.** 예시 없이 지시만 하면 제로샷.
</details>

**Q2.** 최신 사내 문서를 근거로 답하게 하되 모델을 재학습하지 않으려 한다.

<details>
<summary>정답·해설</summary>

**RAG.** 외부/최신 지식을 검색해 프롬프트에 결합한다. 재학습(파인튜닝)보다 저렴·유연하고 환각을 줄인다.
</details>

**Q3.** 항상 같은 말투·출력 형식을 모델에 체화시켜야 한다. 지식은 자주 안 바뀐다.

<details>
<summary>정답·해설</summary>

**파인튜닝.** 스타일·형식·전문성을 모델에 새긴다. 지식이 자주 바뀌면 RAG.
</details>

**Q4.** 프롬프트·RAG·파인튜닝의 일반적 시도 순서는?

<details>
<summary>정답·해설</summary>

**프롬프트 → (지식 부족) RAG → (스타일·전문성) 파인튜닝.** 싸고 쉬운 것부터.
</details>

**Q5.** RAG에서 관련 문서를 찾기 위해 질문과 문서를 무엇으로 변환해 비교하나?

<details>
<summary>정답·해설</summary>

**임베딩(벡터).** 벡터 유사도로 관련 문서를 검색한다(벡터DB).
</details>

**Q6.** 사실 일관성이 중요한 고객 응대 봇의 temperature 설정 방향은?

<details>
<summary>정답·해설</summary>

**낮게.** 결정적·일관된 출력을 얻는다. 다양성·창의가 필요하면 높인다.
</details>

**Q7.** 출력이 특정 문자열에서 멈추도록 하는 파라미터는?

<details>
<summary>정답·해설</summary>

**Stop sequences.** 길이 상한은 max tokens.
</details>

**Q8.** Bedrock에서 데이터 소스를 연결해 관리형 RAG를 구성하는 기능은?

<details>
<summary>정답·해설</summary>

**Knowledge Bases.** 임베딩·검색·결합을 자동화한다.
</details>

**Q9.** 모델이 유해·금지 주제·PII를 출력하지 않도록 필터를 거는 Bedrock 기능은?

<details>
<summary>정답·해설</summary>

**Guardrails.**
</details>

**Q10.** API 호출 등 도구를 사용해 다단계 작업을 수행하는 Bedrock 기능은?

<details>
<summary>정답·해설</summary>

**Agents.**
</details>

**Q11.** 요약·번역 품질의 정량 평가에 흔히 쓰는 지표는?

<details>
<summary>정답·해설</summary>

**ROUGE(요약)·BLEU(번역).** 분류는 정확도·F1.
</details>

**Q12.** 프롬프트 인젝션을 줄이는 기본 원칙은?

<details>
<summary>정답·해설</summary>

**외부·사용자 입력을 '명령'이 아닌 '데이터'로 격리·검증한다.** 시스템 지시와 사용자 입력을 분리.
</details>

**Q13.** 대규모 운영에서 처리량을 예약해 성능·비용을 예측 가능하게 하는 Bedrock 옵션은?

<details>
<summary>정답·해설</summary>

**Provisioned throughput.**
</details>

**Q14.** 파인튜닝이 RAG보다 부적절한 전형적 상황은?

<details>
<summary>정답·해설</summary>

**지식이 자주 바뀌거나 출처 제시가 필요할 때.** 이때는 RAG. 파인튜닝은 재학습 비용·데이터 영구 각인 문제가 있다.
</details>

**Q15.** 복잡한 추론 문제의 품질을 높이려 모델에게 단계적으로 사고하도록 유도하는 기법은?

<details>
<summary>정답·해설</summary>

**체인 오브 소트(단계적 사고 유도) 프롬프팅.**
</details>

**Q16.** Bedrock에서 여러 모델의 품질을 자동·인간 평가로 비교하는 기능은?

<details>
<summary>정답·해설</summary>

**Model Evaluation.** 작업·지표·인간 평가를 지원한다.
</details>

**Q17.** 파인튜닝용 학습 데이터에 고객 개인정보를 그대로 넣으면 안 되는 이유는?

<details>
<summary>정답·해설</summary>

**학습 데이터는 모델 가중치에 영구히 남아 유출·암기 위험이 된다.** 학습 전에 제거·가명화·최소화한다.
</details>

**Q18.** 벡터 검색을 위해 AWS에서 쓸 수 있는 저장소 예를 들라.

<details>
<summary>정답·해설</summary>

**OpenSearch(벡터), Aurora/RDS PostgreSQL(pgvector)** 등. Bedrock Knowledge Bases가 이를 묶어 관리.
</details>

**Q19.** temperature를 매우 높게 설정했을 때의 위험은?

<details>
<summary>정답·해설</summary>

**출력이 다양·창의적이지만 통제가 어렵고 엉뚱·부정확해질 수 있다.**
</details>

**Q20.** 생성형 AI 평가에서 "테스트 한 번 통과했으니 안전하다"가 틀린 이유는?

<details>
<summary>정답·해설</summary>

**출력이 비결정적이라 같은 입력도 다르게 나온다.** 안전·품질은 여러 번·분포로, 다양한 입력으로 평가해야 한다.
</details>
