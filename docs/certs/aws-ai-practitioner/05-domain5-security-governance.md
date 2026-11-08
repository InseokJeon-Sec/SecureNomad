---
title: 05. 보안·규정 준수·거버넌스 (Domain 5)
sidebar_label: 05. 보안·거버넌스
sidebar_position: 6
description: AIF-C01 Domain 5 — AI 솔루션의 접근 제어·데이터 보호·규정 준수·거버넌스와 AWS 서비스를 정리한다
---

# Domain 5 — AI 솔루션의 보안·규정 준수·거버넌스 (14%)

AI 시스템을 **안전하게 보호하고 규정을 지키며 책임 있게 운영**하는 방법을 묻는다. SAA-C03 보안 도메인과 겹치는 IAM·암호화·로깅 개념 위에, AI 특유의 데이터·모델 거버넌스가 더해진다.

:::note 이 문서의 구성
**5.1 접근 제어·네트워크 → 5.2 데이터 보호 → 5.3 데이터·모델 거버넌스 → 5.4 규정 준수·감사 → 5.5 책임 공유 모델** 을 다루고, 마지막에 **연습문제 14개**로 점검한다.
:::

---

## 5.1 접근 제어와 네트워크 보안

- **IAM**: 최소 권한으로 누가 어떤 AI 리소스(Bedrock 모델·SageMaker·데이터)에 접근하는지 통제. 사람은 역할·연합, 서비스는 역할.
- **네트워크 격리**: **VPC 엔드포인트(PrivateLink)** 로 Bedrock·SageMaker에 **인터넷을 거치지 않고** 접근 → 데이터가 외부로 나가지 않음.
- **Bedrock/SageMaker는 기본적으로** 고객 데이터를 **FM 재학습에 사용하지 않는다**(데이터 프라이버시).

## 5.2 데이터 보호

- **암호화**: 저장 시 **KMS**, 전송 시 **TLS**. 학습 데이터·모델 아티팩트·프롬프트 로그 모두 암호화.
- **민감정보 최소화**: 학습·프롬프트에 PII를 넣지 않거나 **마스킹·가명화**. Comprehend/Guardrails로 PII 탐지·제거.
- **데이터 품질·출처**: 편향·오염을 막기 위해 출처가 검증된 데이터 사용(데이터 포이즈닝 방지).

## 5.3 데이터 거버넌스와 모델 거버넌스

- **데이터 거버넌스**: 데이터 수집·보관·사용·폐기 정책, 계보(lineage), 접근 통제. **SageMaker + AWS Glue Data Catalog / Lake Formation** 으로 분류·권한 관리.
- **모델 거버넌스**: 모델 버전·승인·배포 이력, **Model Cards**, 성능·드리프트 모니터링(Model Monitor).
- **감사 추적**: 누가 어떤 모델을 언제 호출·변경했는지 기록.

## 5.4 규정 준수·감사

- **CloudTrail**: API 호출(모델 호출·구성 변경) 기록 → 감사.
- **AWS Config**: 리소스 구성이 규정을 지키는지 지속 평가.
- **AWS Artifact**: AWS의 **규정 준수 보고서**(ISO·SOC·PCI 등) 다운로드.
- **데이터 레지던시**: 특정 리전에서만 처리하도록 제어(규제 대응).
- 관련 규제 예: GDPR, HIPAA, 그리고 한국의 개인정보보호법·AI 기본법 등 — "생성형 AI 표시" 같은 투명성 의무.

## 5.5 책임 공유 모델 (Shared Responsibility)

- **AWS의 책임("of the cloud")**: 인프라·하드웨어·관리형 서비스의 보안.
- **고객의 책임("in the cloud")**: 데이터 분류·접근 권한·암호화 설정·프롬프트에 넣는 내용·모델 사용 방식.
- 생성형 AI에서도 **데이터와 사용 방식의 책임은 고객**에게 있다.

---

## 연습문제 (Domain 5)

**Q1.** Bedrock·SageMaker에 인터넷을 거치지 않고 접근해 데이터 유출 경로를 줄이려 한다.

<details>
<summary>정답·해설</summary>

**VPC 엔드포인트(PrivateLink).** 사설 경로로 서비스에 접근한다.
</details>

**Q2.** 학습 데이터와 모델 아티팩트의 저장 시 암호화에 쓰는 AWS 서비스는?

<details>
<summary>정답·해설</summary>

**KMS.** 전송 중은 TLS.
</details>

**Q3.** 프롬프트·학습 데이터에서 개인정보(PII)를 탐지·제거하려 한다.

<details>
<summary>정답·해설</summary>

**Amazon Comprehend(PII 탐지) 또는 Bedrock Guardrails(PII 필터).**
</details>

**Q4.** 누가 어떤 모델을 언제 호출·변경했는지 감사 추적하려 한다.

<details>
<summary>정답·해설</summary>

**CloudTrail.** API 호출을 기록한다.
</details>

**Q5.** AI 리소스에 대한 접근을 최소 권한으로 통제하는 기본 서비스는?

<details>
<summary>정답·해설</summary>

**IAM.** 사람은 역할·연합, 서비스는 역할로.
</details>

**Q6.** AWS의 ISO·SOC·PCI 등 규정 준수 보고서를 받으려면?

<details>
<summary>정답·해설</summary>

**AWS Artifact.**
</details>

**Q7.** 리소스 구성이 사내·규제 규칙을 지키는지 지속 평가하려 한다.

<details>
<summary>정답·해설</summary>

**AWS Config.**
</details>

**Q8.** 책임 공유 모델에서 '고객'의 책임에 해당하는 것은?

<details>
<summary>정답·해설</summary>

**데이터 분류·접근 권한·암호화 설정·프롬프트 내용·모델 사용 방식.** 인프라 보안은 AWS 책임.
</details>

**Q9.** 파인튜닝 학습 데이터에 고객 PII를 그대로 넣으면 안 되는 이유는?

<details>
<summary>정답·해설</summary>

**모델에 영구히 각인돼 유출·암기 위험이 된다.** 제거·가명화·최소화한다.
</details>

**Q10.** 모델의 버전·승인·성능·한계를 문서화해 모델 거버넌스에 쓰는 것은?

<details>
<summary>정답·해설</summary>

**SageMaker Model Cards.**
</details>

**Q11.** 데이터 자산을 분류하고 레이크 전반의 접근 권한을 세분화 관리하려 한다.

<details>
<summary>정답·해설</summary>

**AWS Lake Formation (+ Glue Data Catalog).**
</details>

**Q12.** 규제상 데이터가 특정 국가/리전을 벗어나면 안 된다. 무엇을 고려하나?

<details>
<summary>정답·해설</summary>

**데이터 레지던시 — 처리·저장 리전을 제어**하고, 리전 내 서비스/엔드포인트를 사용한다.
</details>

**Q13.** Bedrock에 넣은 내 데이터가 기본적으로 공용 FM 재학습에 쓰이나?

<details>
<summary>정답·해설</summary>

**아니다.** 기본적으로 고객 데이터는 FM 재학습에 사용되지 않는다(프라이버시 보장).
</details>

**Q14.** 생성형 AI 투명성 의무(예: 한국 AI 기본법의 '생성형 AI 표시')가 요구하는 바는?

<details>
<summary>정답·해설</summary>

**AI가 생성한 콘텐츠임을 이용자가 알 수 있게 표시·고지**하는 것. 투명성·거버넌스 차원의 요구다.
</details>
