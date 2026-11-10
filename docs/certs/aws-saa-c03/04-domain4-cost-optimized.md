---
title: 04. 비용 최적화 아키텍처 설계 (Domain 4)
sidebar_label: 04. 비용 설계
sidebar_position: 5
description: SAA-C03 Domain 4 — 스토리지·컴퓨팅·DB·네트워크 비용 최적화와 비용 가시성을 시험에 바로 쓰도록 설명한다
---

# Domain 4 — 비용 최적화 아키텍처 설계 (20%)

:::tip 모르는 서비스·용어가 나오면
처음 나오는 서비스·모델·약어는 괄호로 짧게 설명을 달았다. 전체 목록과 한 줄 뜻은 **[한 줄 사전](./07-glossary.md)** 에서 한 번에 찾을 수 있다.
:::

핵심 질문은 **"성능·가용성을 지키면서 돈을 어떻게 덜 쓰나?"** 이다. 시험은 "같은 요구사항을 더 싸게" 또는 "비용을 가시화·통제" 하는 선택을 묻는다. 대부분 **적합한 요금 모델·스토리지 클래스·전송 경로**를 고르는 문제다.

:::note 이 문서의 구성
**4.1 스토리지 → 4.2 컴퓨팅 → 4.3 데이터베이스 → 4.4 네트워크 → 4.5 비용 가시성·거버넌스** 를 다루고, 마지막에 **연습문제 30개(해설 포함)** 로 자가 점검한다. 이 문서 하나로 Domain 4를 커버하는 것을 목표로 한다.
:::

---

## 4.1 비용 최적화 스토리지

### S3 스토리지 클래스 — 접근 빈도로 고른다

| 클래스 | 접근 빈도 | 특징 |
|---|---|---|
| **S3 Standard** | 자주 | 기본, 검색 비용 없음 |
| **Standard-IA** | 가끔 | 저장 저렴, **검색 시 과금**, 최소 보관 30일 |
| **One Zone-IA** | 가끔·재생성 가능 | 단일 AZ라 더 저렴, 가용성↓ |
| **Glacier Instant Retrieval** | 분기 1회 수준, 즉시 조회 | 아카이브 + 밀리초 조회 |
| **Glacier Flexible Retrieval** | 거의 안 함 | 분~시간 단위 복원, 매우 저렴 |
| **Glacier Deep Archive** | 연 1~2회 | 최저가, 복원 수 시간 |

- **Intelligent-Tiering**: 접근 패턴이 **불확실**할 때. 접근 빈도에 따라 자동 계층 이동(모니터링 소액). "패턴을 모른다/가변적" → Intelligent-Tiering.
- **수명 주기(Lifecycle) 규칙**: 생성 N일 후 IA로, 더 지나면 Glacier로, 최종 만료 삭제를 자동화.

### EBS·스냅샷 비용
- 미사용·과대 볼륨은 **right-sizing** 또는 gp3 전환으로 절감(gp3는 보통 gp2보다 저렴).
- 스냅샷은 증분 저장이지만 쌓이면 비용 → 보존 정책으로 오래된 스냅샷 정리(Data Lifecycle Manager).

### 데이터 전송 비용(스토리지 관점)
- **같은 리전·같은 AZ 내부** 전송은 대개 저렴/무료, **리전 간·인터넷 아웃바운드**는 과금.
- 아키텍처를 같은 AZ/리전에 모으면 전송비가 준다(단, 가용성과 균형).

---

## 4.2 비용 최적화 컴퓨팅 — 요금 모델이 핵심

| 모델 | 할인 | 약정 | 적합 |
|---|---|---|---|
| **On-Demand** | 없음 | 없음 | 단기·예측 불가·테스트 |
| **Savings Plans** | 큼(~72%) | 1/3년 **시간당 지출(\$/h)** 약정 | 꾸준한 사용, 유연(인스턴스 유형 바꿔도 적용) |
| **Reserved Instances(RI)** | 큼(~72%) | 1/3년 **특정 인스턴스** 약정 | 꾸준·고정 구성 |
| **Spot** | 최대 90% | 없음(중단 가능) | 내결함·배치·상태 비저장 |
| **Dedicated Host/Instance** | — | — | 라이선스·규정상 물리 격리 필요 |

- **Savings Plans vs RI**: 둘 다 큰 할인이지만 Savings Plans가 더 **유연**(유형·리전 변경에도 적용). 대부분 Savings Plans 권장. 특정 구성 고정이면 RI.
- **기준선은 약정(SP/RI), 변동분은 On-Demand, 중단 가능 작업은 Spot** — 섞어 쓰는 게 정석.
- **Auto Scaling + right-sizing**: 필요한 만큼만. Compute Optimizer로 과대 인스턴스 교정.
- **서버리스(Lambda)/Fargate**: 유휴 비용이 없어 간헐·이벤트성 워크로드에 저렴. 다만 꾸준한 고부하는 예약형 EC2가 더 쌀 수 있다.

---

## 4.3 비용 최적화 데이터베이스

- **Aurora Serverless / RDS**: 부하가 간헐적이면 Serverless로 유휴 비용 절감. 꾸준하면 예약형(RI) DB 인스턴스.
- **DynamoDB 용량 모드**: 예측 가능한 꾸준한 부하 → **프로비전드(+오토스케일)** 가 온디맨드보다 저렴. 간헐·예측 불가 → 온디맨드.
- **읽기 복제본·캐싱**: ElastiCache/DAX로 읽기를 흡수하면 더 큰 DB 인스턴스로 올리는 것보다 쌀 수 있다.
- **DB right-sizing**: 과대 프로비저닝된 인스턴스·스토리지 조정.
- **스토리지 자동 확장**: 미리 크게 잡지 말고 필요 시 늘리기.

---

## 4.4 비용 최적화 네트워크

- **NAT 게이트웨이 vs VPC 엔드포인트**: 프라이빗 서브넷에서 **S3·DynamoDB** 접근은 **게이트웨이 엔드포인트(무료)** 로 NAT 데이터 처리비를 없앤다. NAT는 시간당 + 데이터 처리 과금.
- **CloudFront 캐싱**: 엣지에서 응답해 **오리진으로의 요청·전송비**를 줄인다(S3/ALB 데이터 아웃 절감).
- **데이터 전송 설계**: 인터넷 아웃바운드·리전 간 전송을 줄이고, 가능하면 같은 리전/AZ로 통신.
- **Direct Connect vs VPN 비용**: DX는 회선비가 들지만 **대량·지속 전송**에선 인터넷 아웃바운드보다 단가가 낮아 총비용이 역전될 수 있다. 소량·간헐이면 VPN이 저렴.

---

## 4.5 비용 가시성·거버넌스

| 도구 | 용도 |
|---|---|
| **Cost Explorer** | 비용·사용 추세 시각화·분석, 예측 |
| **AWS Budgets** | 예산 설정 + 초과/예측 초과 시 **알림**(및 액션) |
| **Cost and Usage Report(CUR)** | 가장 상세한 원천 데이터(청구 라인아이템) |
| **Trusted Advisor** | 비용·보안·성능·내결함성 점검 권고(유휴 리소스 탐지 등) |
| **Compute Optimizer** | 리소스 right-sizing 권고 |

- **태깅 전략**: 리소스에 비용 할당 태그(부서·프로젝트·환경)를 붙여 **누가 얼마 쓰는지** 분해·배분한다.
- **Organizations 통합 결제**: 여러 계정을 묶어 **볼륨 할인·RI/SP 공유**로 절감.
- 흐름: **가시화(Cost Explorer/CUR) → 통제(Budgets 알림) → 최적화(Compute Optimizer·Trusted Advisor 권고 반영) → 배분(태깅).**

---

## 연습문제 (Domain 4)

실제 시험처럼 "요구사항 → 가장 비용 효율적 구성"을 고르는 연습이다. 먼저 스스로 답을 정한 뒤 해설을 펼쳐 확인한다.

**Q1.** 거의 조회하지 않지만 필요 시 수 시간 내 복원이면 충분한 규정 보관 데이터. 최저 비용 클래스는?

<details>
<summary>정답·해설</summary>

**S3 Glacier Deep Archive.** 연 1~2회 접근·수 시간 복원을 전제로 한 최저가 아카이브 클래스다.
</details>

**Q2.** 접근 패턴을 예측할 수 없고 들쭉날쭉한 객체들의 비용을 자동으로 최적화하려면?

<details>
<summary>정답·해설</summary>

**S3 Intelligent-Tiering.** 접근 빈도에 따라 계층을 자동 이동해, 패턴이 불확실할 때 수동 관리 없이 비용을 맞춘다.
</details>

**Q3.** 가끔 접근하지만 접근 시 빠른 조회가 필요한 데이터를 저장비 위주로 아끼려 한다.

<details>
<summary>정답·해설</summary>

**S3 Standard-IA.** 저장비가 저렴하고 즉시 조회 가능하지만 검색 시 과금되며 최소 30일 보관 규칙이 있다.
</details>

**Q4.** 로그를 30일 후 IA로, 90일 후 Glacier로 옮기고 1년 뒤 삭제하도록 자동화하려 한다.

<details>
<summary>정답·해설</summary>

**S3 수명 주기(Lifecycle) 규칙.** 생성 경과일 기준으로 계층 이동과 만료 삭제를 자동 수행한다.
</details>

**Q5.** 재생성 가능한 임시 데이터를 가장 저렴하게 S3에 두되 단일 AZ 가용성이어도 된다.

<details>
<summary>정답·해설</summary>

**S3 One Zone-IA.** 단일 AZ라 Standard-IA보다 저렴하다. 소실돼도 재생성 가능한 데이터에 적합.
</details>

**Q6.** 3년간 꾸준히 돌 워크로드의 EC2 비용을 크게 줄이되 인스턴스 유형을 바꿀 유연성도 원한다.

<details>
<summary>정답·해설</summary>

**Savings Plans.** 시간당 지출을 약정해 큰 할인을 받으면서 인스턴스 유형·리전 변경에도 할인이 적용된다. 특정 구성 고정이면 RI.
</details>

**Q7.** 중단돼도 되는 대규모 분산 배치 작업의 비용을 최대한 낮추려 한다.

<details>
<summary>정답·해설</summary>

**Spot 인스턴스.** 최대 90% 할인. 중단 가능하므로 내결함·재시작 가능한 작업에 적합하다.
</details>

**Q8.** 예측 불가하고 짧게 끝나는 테스트성 워크로드에 약정 없이 쓰려면?

<details>
<summary>정답·해설</summary>

**On-Demand.** 약정·선결제 없이 쓴 만큼 낸다. 단기·불규칙 워크로드에 맞다.
</details>

**Q9.** 간헐적으로만 실행되는 이벤트 처리 로직의 컴퓨팅 유휴 비용을 없애려 한다.

<details>
<summary>정답·해설</summary>

**Lambda(서버리스).** 실행 시에만 과금되어 유휴 비용이 없다. 간헐·이벤트성에 비용 효율적이다.
</details>

**Q10.** 특정 인스턴스 패밀리·리전으로 1년 고정 운영이 확실하다. 최대 할인을 원한다.

<details>
<summary>정답·해설</summary>

**Reserved Instances(RI).** 특정 인스턴스 약정으로 큰 할인을 받는다. 유형 변경 유연성이 필요하면 Savings Plans.
</details>

**Q11.** 프라이빗 서브넷 EC2가 S3에 접근하는데 NAT 게이트웨이 데이터 처리 비용이 크다.

<details>
<summary>정답·해설</summary>

**S3 게이트웨이 VPC 엔드포인트(무료).** NAT를 거치지 않아 데이터 처리비를 없앤다. (S3·DynamoDB 전용.)
</details>

**Q12.** 전 세계로 나가는 S3 정적 콘텐츠의 데이터 아웃바운드 비용을 줄이려 한다.

<details>
<summary>정답·해설</summary>

**CloudFront 캐싱.** 엣지에서 응답해 오리진(S3)으로의 요청·전송을 줄여 데이터 아웃 비용을 낮춘다.
</details>

**Q13.** 예산을 정하고 초과하거나 초과가 예측되면 알림을 받고 싶다.

<details>
<summary>정답·해설</summary>

**AWS Budgets.** 예산 임계치·예측 기반 알림(및 자동 액션)을 제공한다.
</details>

**Q14.** 지난 6개월 비용 추세를 서비스별로 시각화하고 다음 달을 예측하려 한다.

<details>
<summary>정답·해설</summary>

**Cost Explorer.** 비용·사용 추세 시각화와 예측을 제공한다.
</details>

**Q15.** 청구를 라인아이템 수준까지 가장 상세히 분석하려 한다.

<details>
<summary>정답·해설</summary>

**Cost and Usage Report(CUR).** 가장 세밀한 청구 원천 데이터를 제공한다(Athena 등으로 분석).
</details>

**Q16.** 유휴 리소스·저활용 인스턴스 등 절감 기회를 점검 권고로 받고 싶다.

<details>
<summary>정답·해설</summary>

**Trusted Advisor.** 비용(유휴 리소스)·보안·성능·내결함성·한도 점검을 권고한다.
</details>

**Q17.** 부서·프로젝트별로 누가 얼마 쓰는지 비용을 분해·배분하려 한다.

<details>
<summary>정답·해설</summary>

**비용 할당 태그(태깅 전략).** 리소스에 태그를 붙여 Cost Explorer/CUR에서 태그 기준으로 비용을 분해한다.
</details>

**Q18.** 여러 AWS 계정의 비용을 묶어 볼륨 할인과 RI/SP 공유 혜택을 받으려 한다.

<details>
<summary>정답·해설</summary>

**Organizations 통합 결제(Consolidated Billing).** 계정을 묶어 볼륨 티어·예약 할인 공유 혜택을 얻는다.
</details>

**Q19.** 꾸준하고 예측 가능한 부하의 DynamoDB 테이블 비용을 낮추려 한다.

<details>
<summary>정답·해설</summary>

**프로비전드 용량 모드(+ 오토스케일링).** 꾸준한 부하에선 온디맨드보다 저렴하다. 간헐·예측 불가면 온디맨드.
</details>

**Q20.** 부하가 간헐적인 관계형 DB의 유휴 비용을 줄이려 한다.

<details>
<summary>정답·해설</summary>

**Aurora Serverless v2.** 부하에 따라 용량을 자동 조절해 유휴 비용을 줄인다.
</details>

**Q21.** 읽기 부하를 감당하려는데 더 큰 DB 인스턴스로 올리는 것보다 싸게 하려면?

<details>
<summary>정답·해설</summary>

**캐싱(ElastiCache/DAX) 또는 읽기 복제본.** 반복 읽기를 흡수해 인스턴스 업그레이드 비용을 피한다.
</details>

**Q22.** gp2 볼륨 비용을 성능 저하 없이 낮추려 한다.

<details>
<summary>정답·해설</summary>

**gp3로 전환.** 일반적으로 gp2보다 저렴하면서 성능을 독립 설정할 수 있다.
</details>

**Q23.** 오래된 EBS 스냅샷이 쌓여 비용이 는다. 자동 정리하려면?

<details>
<summary>정답·해설</summary>

**Data Lifecycle Manager**로 스냅샷 생성·보존·삭제 정책을 자동화한다.
</details>

**Q24.** 온프레미스↔AWS로 대량 데이터를 지속 전송하는데 인터넷 아웃바운드 비용이 크다.

<details>
<summary>정답·해설</summary>

**Direct Connect.** 회선비가 들지만 대량·지속 전송에서 데이터 전송 단가가 낮아 총비용이 유리해질 수 있다. 소량·간헐이면 VPN.
</details>

**Q25.** 과대 프로비저닝된 EC2를 실제 사용량 기반으로 줄이려 한다.

<details>
<summary>정답·해설</summary>

**Compute Optimizer**의 right-sizing 권고를 반영한다.
</details>

**Q26.** 리전 간 데이터 전송 비용을 줄이는 일반 원칙은?

<details>
<summary>정답·해설</summary>

**통신하는 리소스를 같은 리전/AZ에 모은다.** 리전 간·인터넷 아웃바운드 전송은 과금되고, 같은 AZ 내부는 저렴/무료에 가깝다(가용성과 균형 필요).
</details>

**Q27.** 비용 통제의 올바른 순서는?

<details>
<summary>정답·해설</summary>

**가시화(Cost Explorer/CUR) → 통제(Budgets 알림) → 최적화(Compute Optimizer·Trusted Advisor) → 배분(태깅).** 먼저 보이게 하고, 한도를 걸고, 권고를 반영하고, 책임을 배분한다.
</details>

**Q28.** 기준 부하는 예약형, 변동 피크는 온디맨드, 배치는 스팟으로 나눴다. 이 접근의 이점은?

<details>
<summary>정답·해설</summary>

**워크로드 성격별로 가장 싼 모델을 섞어** 전체 비용을 최소화한다. 약정으로 기준선 할인, 온디맨드로 유연성, 스팟으로 배치 비용 절감.
</details>

**Q29.** 저장은 아주 저렴해야 하지만 분기 1회 정도는 즉시 조회가 필요하다.

<details>
<summary>정답·해설</summary>

**S3 Glacier Instant Retrieval.** 아카이브 수준 저장비에 밀리초 즉시 조회를 제공한다.
</details>

**Q30.** 라이선스나 규정 때문에 물리적으로 격리된 서버가 필요하다. 어떤 옵션인가?

<details>
<summary>정답·해설</summary>

**Dedicated Host/Instance.** 전용 물리 하드웨어를 제공해 라이선스(BYOL)·규정상 격리 요구를 충족한다. 일반적으로 비용은 더 높다.
</details>
