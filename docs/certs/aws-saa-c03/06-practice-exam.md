---
title: 06. 시나리오 모의고사
sidebar_label: 06. 모의고사
sidebar_position: 7
description: 실제 시험과 비슷한 시나리오형 문항으로 네 도메인을 종합 점검한다 (정답·해설 포함)
---

# 시나리오 모의고사 (Set 1)

실제 SAA-C03는 **5~6줄 상황 + 그럴듯한 오답**으로 "가장 적합한" 하나를 고르게 한다. 이 모의고사는 그 형식에 맞춘 **30문항**이다. 도메인 비중(보안 30 / 복원력 26 / 성능 24 / 비용 20)을 대략 반영했다.

:::tip 푸는 법
- **30문항 60분** 목표(실제는 65문항 130분). 먼저 전부 풀고, 그다음 해설을 펼친다.
- 채점: 맞힌 수 ÷ 30. **24개(80%)** 이상이면 실제 응시 수준에 근접한다.
- 틀린 문항은 괄호의 도메인 표시를 보고 해당 문서로 돌아가 복습한다.
:::

---

**Q1. (D1)** EC2에서 실행되는 앱이 S3에 접근해야 한다. 자격 증명을 가장 안전하게 제공하는 방법은?

A. 액세스 키를 EC2 사용자 데이터에 넣는다
B. 액세스 키를 앱 설정 파일에 저장한다
C. IAM 역할을 인스턴스 프로파일로 연결한다
D. 루트 계정 키를 환경변수로 넣는다

<details>
<summary>정답·해설</summary>

**C.** IAM 역할을 EC2에 연결하면 임시 자격 증명이 자동 교체되어 키 유출 위험이 없다. 키를 어디에 저장하든(A·B·D) 유출 위험이 있어 오답.
</details>

**Q2. (D2)** 주문 수신 웹 계층과 처리 워커 사이에서 트래픽 급증 시 요청 유실을 막으려 한다. 순서는 중요하지 않다.

A. SNS 토픽
B. SQS 표준 큐
C. Kinesis Data Streams
D. DynamoDB

<details>
<summary>정답·해설</summary>

**B.** 생산·소비 속도를 분리하는 버퍼로 SQS 표준 큐가 적합하다. 순서가 중요하면 FIFO. SNS는 팬아웃(1:N)이다.
</details>

**Q3. (D3)** 전 세계 사용자에게 동영상 등 정적 콘텐츠를 낮은 지연으로 제공하고 오리진 부하를 줄이려 한다.

A. Global Accelerator
B. Route 53 지연 라우팅
C. CloudFront
D. Transit Gateway

<details>
<summary>정답·해설</summary>

**C.** 콘텐츠 캐싱 CDN은 CloudFront. 비캐싱 TCP/UDP 트래픽 가속·고정 IP면 Global Accelerator.
</details>

**Q4. (D4)** 접근 패턴을 예측할 수 없는 다양한 S3 객체의 비용을 수동 관리 없이 최적화하려 한다.

A. S3 Standard
B. S3 Glacier Deep Archive
C. S3 One Zone-IA
D. S3 Intelligent-Tiering

<details>
<summary>정답·해설</summary>

**D.** 패턴 불확실 → Intelligent-Tiering이 접근 빈도에 따라 자동 계층 이동한다.
</details>

**Q5. (D1)** 여러 계정을 Organizations로 운영하며 특정 OU의 모든 계정에서 승인되지 않은 리전 사용을 전면 금지하려 한다.

A. IAM 정책
B. SCP(서비스 제어 정책)
C. 보안 그룹
D. Permission Boundary

<details>
<summary>정답·해설</summary>

**B.** SCP는 계정/OU 단위로 권한 상한을 긋는다. 계정 내 Admin이라도 SCP가 막으면 불가.
</details>

**Q6. (D2)** RDS의 가용성을 높여 AZ 장애 시 자동 전환되게 하려 한다. 읽기 성능 확장이 목적은 아니다.

A. 읽기 전용 복제본
B. Multi-AZ 배포
C. ElastiCache
D. DynamoDB Global Tables

<details>
<summary>정답·해설</summary>

**B.** Multi-AZ는 동기 복제 대기본으로 가용성을 제공한다. 읽기 확장은 읽기 전용 복제본.
</details>

**Q7. (D3)** DynamoDB 읽기 지연을 마이크로초 수준으로 더 낮추려 한다.

A. 읽기 용량 단위 증설
B. DAX
C. 글로벌 테이블
D. S3 캐시

<details>
<summary>정답·해설</summary>

**B.** DAX는 DynamoDB 전용 인메모리 캐시로 읽기를 마이크로초로 가속한다.
</details>

**Q8. (D4)** 3년간 꾸준한 기준 부하가 예상되는 EC2 비용을 크게 줄이되, 인스턴스 유형 변경 유연성도 원한다.

A. On-Demand
B. Spot
C. Savings Plans
D. Dedicated Host

<details>
<summary>정답·해설</summary>

**C.** Savings Plans는 큰 할인 + 유형/리전 변경에도 적용되는 유연성을 준다. 특정 구성 고정이면 RI.
</details>

**Q9. (D1)** 프라이빗 서브넷의 EC2가 S3에 접근해야 하는데, NAT 비용을 피하고 인터넷을 거치지 않으려 한다.

A. NAT 게이트웨이
B. 인터넷 게이트웨이
C. S3 게이트웨이 VPC 엔드포인트
D. Transit Gateway

<details>
<summary>정답·해설</summary>

**C.** S3·DynamoDB용 게이트웨이 엔드포인트는 무료이며 인터넷을 거치지 않는다.
</details>

**Q10. (D2)** 하나의 "결제 완료" 이벤트로 이메일·재고·분석 세 작업을 독립적으로 트리거하려 한다.

A. SQS 단일 큐
B. SNS → 여러 SQS 구독(팬아웃)
C. Kinesis Firehose
D. Step Functions 단독

<details>
<summary>정답·해설</summary>

**B.** SNS 팬아웃 + 작업별 SQS로 각 파이프라인이 독립 버퍼링한다.
</details>

**Q11. (D3)** CPU 집약적 렌더링 배치에 적합한 EC2 패밀리는?

A. R(메모리)
B. T(버스터블)
C. C(컴퓨팅)
D. I(스토리지)

<details>
<summary>정답·해설</summary>

**C.** 컴퓨팅 최적화(C) 패밀리가 CPU 집약 워크로드에 맞다.
</details>

**Q12. (D4)** 거의 조회하지 않고 복원에 수 시간이 걸려도 되는 장기 규정 보관 데이터. 최저가 클래스는?

A. Standard-IA
B. Glacier Instant Retrieval
C. Glacier Deep Archive
D. One Zone-IA

<details>
<summary>정답·해설</summary>

**C.** Glacier Deep Archive가 연 1~2회 접근·수 시간 복원 전제의 최저가다.
</details>

**Q13. (D1)** 특정 악성 IP 대역에서 오는 트래픽만 서브넷 수준에서 차단해야 한다.

A. 보안 그룹 Deny 규칙
B. 네트워크 ACL Deny 규칙
C. IAM 정책
D. 라우팅 테이블

<details>
<summary>정답·해설</summary>

**B.** 보안 그룹은 Allow만 가능하다. "차단"은 서브넷 단위 NACL의 Deny로 표현한다.
</details>

**Q14. (D2)** 금융 메시지는 순서 보장과 중복 제거가 필수다.

A. SQS 표준 큐
B. SQS FIFO 큐
C. SNS 표준
D. EventBridge

<details>
<summary>정답·해설</summary>

**B.** FIFO 큐가 순서 보장 + 정확히 1회 처리를 제공한다.
</details>

**Q15. (D3)** S3에 쌓인 로그를 서버 없이 바로 SQL로 조회하고 조회량만큼만 과금되길 원한다.

A. Redshift
B. Athena
C. EMR
D. RDS

<details>
<summary>정답·해설</summary>

**B.** Athena는 S3에 직접 SQL을 던지는 서버리스 쿼리로 쿼리당 과금한다.
</details>

**Q16. (D1)** 저장 시 암호화를 위해 암호화 키를 AWS가 관리하되 키 정책으로 접근을 통제하고 CloudTrail로 사용을 감사하려 한다.

A. S3 SSE-C
B. KMS(SSE-KMS)
C. 클라이언트 측 자체 암호화
D. 암호화하지 않음

<details>
<summary>정답·해설</summary>

**B.** KMS 관리형 키는 키 정책 기반 접근 제어와 CloudTrail 감사 로그를 제공한다. SSE-C는 키를 사용자가 들고 와야 한다.
</details>

**Q17. (D2)** 주 사이트 장애 시 DNS 수준에서 대기 사이트로 자동 전환하려 한다.

A. 가중치 라우팅
B. 지연 라우팅
C. 장애 조치(Failover) 라우팅 + 상태 확인
D. 단순 라우팅

<details>
<summary>정답·해설</summary>

**C.** Failover 라우팅 + 상태 확인으로 주 리소스 실패 시 보조로 전환한다(액티브-패시브).
</details>

**Q18. (D4)** 간헐적으로만 실행되는 이벤트 처리 로직의 유휴 비용을 없애려 한다.

A. 예약형 EC2
B. Lambda
C. Dedicated Host
D. 상시 가동 ECS on EC2

<details>
<summary>정답·해설</summary>

**B.** Lambda는 실행 시에만 과금되어 유휴 비용이 없다.
</details>

**Q19. (D3)** 여러 리눅스 EC2가 동시에 같은 파일 시스템을 마운트해 읽고 써야 한다.

A. EBS
B. Instance Store
C. EFS
D. S3 Glacier

<details>
<summary>정답·해설</summary>

**C.** EFS는 다중 AZ에서 여러 인스턴스가 동시 마운트하는 NFS다.
</details>

**Q20. (D1)** 개발자에게 넓은 권한을 주되, 그가 만드는 IAM 신원이 가질 수 있는 권한의 상한을 제한하려 한다.

A. SCP
B. Permission Boundary
C. 세션 정책
D. 신뢰 정책

<details>
<summary>정답·해설</summary>

**B.** Permission Boundary는 특정 신원이 가질 수 있는 최대 권한을 제한한다(최종 권한 = 부여 정책 ∩ Boundary).
</details>

**Q21. (D2)** RTO/RPO가 매우 빡빡하지만 Active-Active만큼 비용을 들이긴 어렵다. 축소판 전체를 상시 가동하는 DR 전략은?

A. Backup & Restore
B. Pilot Light
C. Warm Standby
D. Multi-Site

<details>
<summary>정답·해설</summary>

**C.** Warm Standby는 축소판 전체를 상시 가동하다 장애 시 증설한다. Pilot Light는 핵심만 켜둔다.
</details>

**Q22. (D3)** 온프레미스↔AWS 간 일관된 저지연·고대역폭 전용 연결이 필요하다.

A. Site-to-Site VPN
B. Direct Connect
C. Transit Gateway
D. CloudFront

<details>
<summary>정답·해설</summary>

**B.** Direct Connect는 전용 물리 회선으로 일관된 성능을 제공한다. 즉시·저렴은 VPN.
</details>

**Q23. (D4)** 프라이빗 서브넷에서 S3 접근 시 NAT 게이트웨이 데이터 처리 비용이 크다. 비용을 없애려면?

A. 인터넷 게이트웨이 추가
B. S3 게이트웨이 VPC 엔드포인트
C. NAT 인스턴스로 교체
D. Transit Gateway

<details>
<summary>정답·해설</summary>

**B.** 무료 게이트웨이 엔드포인트로 S3에 접근하면 NAT 데이터 처리비가 사라진다.
</details>

**Q24. (D1)** 실수로 덮어쓰거나 삭제된 S3 객체를 이전 상태로 되돌릴 수 있어야 한다.

A. 교차 리전 복제
B. 버전 관리(Versioning)
C. 수명 주기 규칙
D. Transfer Acceleration

<details>
<summary>정답·해설</summary>

**B.** 버전 관리로 이전 버전이 보존되고 삭제 마커로 복구 가능하다.
</details>

**Q25. (D2)** 메시지 소비자가 반복 실패하는 메시지로 큐가 막힌다. 유실 없이 격리하려면?

A. 가시성 타임아웃 0
B. DLQ(Dead Letter Queue)
C. FIFO 전환
D. 큐 삭제

<details>
<summary>정답·해설</summary>

**B.** DLQ로 반복 실패 메시지를 격리해 정상 흐름을 막지 않는다.
</details>

**Q26. (D3)** 글로벌 사용자에게 각 리전에서 쓰기도 저지연으로 처리되는 키-값 저장소가 필요하다.

A. RDS Multi-AZ
B. Aurora 읽기 복제본
C. DynamoDB Global Tables
D. ElastiCache

<details>
<summary>정답·해설</summary>

**C.** DynamoDB Global Tables는 다중 리전 활성-활성 복제를 제공한다.
</details>

**Q27. (D4)** 중단돼도 되는 대규모 분산 배치의 컴퓨팅 비용을 최대한 낮추려 한다.

A. On-Demand
B. Reserved Instances
C. Spot
D. Dedicated Host

<details>
<summary>정답·해설</summary>

**C.** Spot은 최대 90% 할인. 중단 가능하므로 내결함·재시작 가능한 배치에 적합하다.
</details>

**Q28. (D1·보충)** EC2에 SSH 포트를 열지 않고 셸 접근과 감사 로그를 남기려 한다.

A. 배스천 호스트
B. SSM Session Manager
C. 보안 그룹에 22 허용
D. VPN

<details>
<summary>정답·해설</summary>

**B.** Session Manager는 포트 개방·키 없이 접속하며 세션을 기록한다. 공격면을 줄이는 모범 사례.
</details>

**Q29. (D2·보충)** 온프레미스에서 RabbitMQ(AMQP)를 쓰던 앱을 코드 변경 최소화로 AWS에 옮기려 한다.

A. SQS
B. SNS
C. Amazon MQ
D. Kinesis

<details>
<summary>정답·해설</summary>

**C.** Amazon MQ는 기존 표준 브로커 프로토콜을 그대로 지원한다. 새 설계면 SQS/SNS.
</details>

**Q30. (D3·보충)** 온프레미스 Oracle DB를 Aurora PostgreSQL로 엔진을 바꿔 최소 다운타임으로 이전하려 한다.

A. DataSync
B. DMS + SCT
C. Snowball
D. Storage Gateway

<details>
<summary>정답·해설</summary>

**B.** SCT로 이기종 스키마를 변환하고 DMS로 지속 복제해 최소 다운타임 이전한다.
</details>

---

## 채점 가이드

| 맞힌 수 | 상태 |
|---|---|
| 27~30 | 매우 안정권 — 응시 추천 |
| 24~26 | 합격권(80%+) — 틀린 도메인만 보완 |
| 18~23 | 조금 더 — 약한 도메인 문서 재독 후 재시도 |
| ~17 | 개념 재정리 필요 — 해당 도메인 문서부터 다시 |

각 문항 끝의 **(D1~D4)** 표시로 약한 도메인을 파악해 해당 문서로 돌아가 복습하세요. 추가 세트(Set 2)가 필요하면 같은 형식으로 더 만들어 드립니다.
