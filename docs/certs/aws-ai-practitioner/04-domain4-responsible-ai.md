---
title: 04. 책임 있는 AI (Domain 4)
sidebar_label: 04. 책임 있는 AI
sidebar_position: 5
description: AIF-C01 Domain 4 — 책임 있는 AI의 차원(공정성·설명가능성·투명성 등)과 편향·유해성 대응, AWS 도구를 정리한다
---

# Domain 4 — 책임 있는 AI 가이드라인 (14%)

AI를 **공정하고 안전하며 투명하게** 쓰기 위한 원칙과 AWS 도구를 묻는다. 개념 중심이라 범위는 좁지만 용어 구분이 중요하다.

:::note 이 문서의 구성
**4.1 책임 있는 AI의 차원 → 4.2 편향·공정성 → 4.3 투명성·설명가능성 → 4.4 생성형 AI의 안전 이슈 → 4.5 AWS 책임 AI 도구** 를 다루고, 마지막에 **연습문제 14개**로 점검한다.
:::

---

## 4.1 책임 있는 AI의 차원

AWS가 말하는 책임 있는 AI의 축(외워 둘 키워드):

- **공정성(Fairness)**: 특정 집단에 불리하지 않게.
- **설명가능성(Explainability)**: 왜 그런 결정을 했는지 설명 가능.
- **투명성(Transparency)**: 시스템의 작동·한계·데이터 사용을 공개.
- **견고성(Robustness)**: 교란·엣지 케이스에도 안정적.
- **프라이버시·보안**: 개인정보 보호.
- **거버넌스**: 정책·감독·책임 소재.
- **안전성(Safety)**: 유해 출력 방지.
- **통제가능성(Controllability)**: 사람이 개입·제어 가능.

## 4.2 편향(Bias)과 공정성

- **편향의 원인**: 치우친 학습 데이터, 과소대표 집단, 레이블 편향, 피드백 루프.
- **영향**: 차별적 결과, 신뢰 상실, 법적 리스크.
- **완화**: 대표성 있는 데이터, 편향 측정 지표, 사후 보정, 사람 검토.
- **AWS 도구**: **SageMaker Clarify** — 학습 전후 **편향 탐지**와 **특성 기여도(설명)** 를 제공.

## 4.3 투명성·설명가능성

- **설명가능성**: 모델이 특정 출력을 낸 이유(어떤 특성이 영향을 줬는지). 규제·의료·금융에서 중요.
- **투명 커뮤니케이션**: 사용자에게 "AI가 생성했음", 한계·데이터 출처를 알림.
- **AWS 모델 카드(SageMaker Model Cards)**: 모델의 용도·성능·한계·학습 데이터를 문서화해 거버넌스에 활용.
- **트레이드오프**: 성능 좋은 복잡 모델일수록 설명이 어렵다(블랙박스). 용도에 맞게 균형.

## 4.4 생성형 AI 특유의 안전 이슈

- **환각**: 사실이 아닌 그럴듯한 출력 → RAG·출처표기·검증.
- **유해·부적절 콘텐츠**: 폭력·혐오·성적 콘텐츠 → 가드레일·콘텐츠 필터.
- **저작권·지식재산**: 생성물의 출처·라이선스 문제.
- **프라이버시**: 학습·입력에 개인정보 유입.
- **오남용**: 허위정보·딥페이크.
- **사람의 감독(Human-in-the-loop)**: 되돌리기 어려운 결정은 사람이 최종 확인.

## 4.5 AWS 책임 있는 AI 도구

| 도구 | 하는 일 |
|---|---|
| **SageMaker Clarify** | 편향 탐지 + 설명가능성(특성 기여도) |
| **SageMaker Model Monitor** | 배포 후 데이터·품질 드리프트 모니터링 |
| **SageMaker Model Cards** | 모델 문서화(용도·성능·한계) |
| **Bedrock Guardrails** | 유해·금지 주제·PII 필터링, 환각 완화(근거 기반 응답) |
| **A2I (Augmented AI)** | 사람 검토 워크플로(Human-in-the-loop) |
| **AWS AI Service Cards** | AWS AI 서비스의 용도·한계·공정성 정보 공개 |

> 편향·설명 → **Clarify**, 배포 후 드리프트 → **Model Monitor**, 생성형 안전 필터 → **Guardrails**, 사람 검토 → **A2I**.

---

## 연습문제 (Domain 4)

**Q1.** 모델이 특정 인구 집단에 불리한 결정을 내리지 않도록 보장하려는 책임 AI 차원은?

<details>
<summary>정답·해설</summary>

**공정성(Fairness).**
</details>

**Q2.** 모델이 "왜 그런 결정을 했는지" 이해·설명할 수 있어야 하는 성질은?

<details>
<summary>정답·해설</summary>

**설명가능성(Explainability).** 규제·의료·금융에서 특히 중요.
</details>

**Q3.** 학습 데이터·모델의 편향을 탐지하고 특성 기여도로 설명을 제공하는 AWS 도구는?

<details>
<summary>정답·해설</summary>

**SageMaker Clarify.**
</details>

**Q4.** 배포된 모델의 입력 분포·품질이 시간이 지나며 변하는 것을 감지하려 한다.

<details>
<summary>정답·해설</summary>

**SageMaker Model Monitor.** 데이터·품질 드리프트를 모니터링한다.
</details>

**Q5.** 생성형 모델이 유해·금지 주제·PII를 출력하지 않도록 거르는 Bedrock 기능은?

<details>
<summary>정답·해설</summary>

**Guardrails.**
</details>

**Q6.** 편향이 생기는 대표적 원인 하나를 들라.

<details>
<summary>정답·해설</summary>

**치우친/과소대표된 학습 데이터(또는 레이블 편향).** 대표성 있는 데이터와 편향 측정으로 완화.
</details>

**Q7.** 모델의 용도·성능·한계·학습 데이터를 문서화해 거버넌스에 쓰는 것은?

<details>
<summary>정답·해설</summary>

**SageMaker Model Cards.** (AWS 서비스 차원 공개는 AI Service Cards.)
</details>

**Q8.** 되돌리기 어려운 고위험 결정에서 책임 AI가 권장하는 장치는?

<details>
<summary>정답·해설</summary>

**사람의 감독(Human-in-the-loop).** AWS에서는 A2I로 사람 검토 워크플로를 만든다.
</details>

**Q9.** 복잡한 고성능 모델일수록 어떤 책임 AI 속성이 약해지기 쉬운가?

<details>
<summary>정답·해설</summary>

**설명가능성(투명성).** 성능과 설명가능성은 종종 트레이드오프다.
</details>

**Q10.** 사용자에게 "이 콘텐츠는 AI가 생성했다"고 알리는 것은 어떤 차원인가?

<details>
<summary>정답·해설</summary>

**투명성(Transparency).**
</details>

**Q11.** 생성형 AI의 환각을 책임 있게 다루는 방법은?

<details>
<summary>정답·해설</summary>

**RAG로 근거 제공, 출처 표기, 사람 검증, Guardrails의 근거 기반 응답.**
</details>

**Q12.** 교란이나 예외 입력에도 모델이 안정적으로 동작해야 하는 성질은?

<details>
<summary>정답·해설</summary>

**견고성(Robustness).**
</details>

**Q13.** AWS AI 서비스 자체의 용도·한계·공정성 정보를 공개하는 문서는?

<details>
<summary>정답·해설</summary>

**AWS AI Service Cards.**
</details>

**Q14.** 생성형 AI의 저작권·프라이버시 위험을 줄이는 운영 원칙은?

<details>
<summary>정답·해설</summary>

**학습·입력 데이터의 출처·라이선스·개인정보를 점검하고 최소화하며, 생성물의 사용을 검토한다.**
</details>
