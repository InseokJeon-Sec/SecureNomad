---
title: 05. 보충 — 빈출 변두리 서비스
sidebar_label: 05. 보충 서비스
sidebar_position: 6
description: 핵심 4개 도메인 문서에서 비중상 가볍게 다룬, 그러나 시험에 종종 끼어드는 서비스들을 "무엇을·언제" 중심으로 정리한다
---

# 보충 — 빈출 '변두리' 서비스

:::tip 모르는 서비스·용어가 나오면
처음 나오는 서비스·모델·약어는 괄호로 짧게 설명을 달았다. 전체 목록과 한 줄 뜻은 **[한 줄 사전](./07-glossary.md)** 에서 한 번에 찾을 수 있다.
:::

핵심 4개 도메인 문서는 **출제 빈도 높은 서비스**를 중심으로 짰다. 이 문서는 비중은 작지만 실제 시험에 **1~2문제씩 끼어드는** 서비스를 모았다. 깊게 외울 필요는 없고, **"무엇을 하는 서비스이고, 언제(어떤 요구에) 고르는가"** 와 **비슷한 서비스와의 갈림길**만 잡으면 된다.

:::note 쓰는 법
각 표의 "언제 고르나"가 곧 시험의 정답 트리거다. 비슷한 서비스끼리 묶인 **구분 포인트**를 집중해서 본다. 마지막에 **연습문제 18개**로 점검한다.
:::

---

## 1. 컴퓨팅·배포 (EC2/Lambda 외)

| 서비스 | 무엇을 | 언제 고르나 |
|---|---|---|
| **Elastic Beanstalk** | 코드만 올리면 EC2·ELB·ASG를 자동 프로비저닝 | "인프라 관리 없이 웹앱을 빠르게 배포", 플랫폼(Java·Node 등) 표준 |
| **AWS Batch** | 대규모 배치 작업 스케줄링·실행(큐+컴퓨팅) | "수천 개 배치 잡을 관리형으로", 스팟과 잘 맞음 |
| **App Runner** | 컨테이너/소스를 완전관리형 웹서비스로 | "컨테이너 웹앱을 가장 단순하게", ALB·스케일 자동 |
| **Lightsail** | 고정 월정액의 단순 VPS | "소규모·예측 가능 비용의 간단한 사이트" |

구분: **Beanstalk = 오케스트레이션(리소스는 보임)**, **App Runner/Fargate = 서버 안 보임**, **Lightsail = 단순·정액**.

## 2. 애플리케이션 통합·API

| 서비스 | 무엇을 | 언제 고르나 |
|---|---|---|
| **API Gateway (REST/HTTP/WebSocket)** | API 프런트도어(인증·스로틀·캐시) | REST=기능 풍부, HTTP=저지연·저비용, WebSocket=양방향 실시간 |
| **AppSync** | 관리형 **GraphQL** API | "클라이언트가 필요한 필드만", 실시간 구독·오프라인 동기화 |
| **Amazon MQ** | 관리형 **ActiveMQ/RabbitMQ**(AMQP·MQTT·STOMP) | "기존 메시지 브로커 프로토콜을 그대로 마이그레이션" |
| **AppFlow** | SaaS↔AWS 노코드 데이터 연동 | "Salesforce·Slack 등과 데이터 주고받기" |

구분: **새로 만들면 SQS/SNS/EventBridge**, **기존 표준 프로토콜 이전이면 Amazon MQ**. GraphQL이 명시되면 **AppSync**.

## 3. 데이터·분석

| 서비스 | 무엇을 | 언제 고르나 |
|---|---|---|
| **Managed Service for Apache Flink**(구 Kinesis Data Analytics) | 스트림을 **SQL/Flink로 실시간 분석** | "들어오는 스트림에 실시간 집계·이상탐지" |
| **OpenSearch** | 검색·로그 분석·관측 | "로그 전문 검색/대시보드", ELK 대체 |
| **QuickSight** | 관리형 BI 대시보드·시각화 | "비개발자용 리포트/대시보드" |
| **Lake Formation** | 데이터 레이크 구축·중앙 권한 관리 | "S3 데이터 레이크에 세분화된 접근 제어" |
| **Glue DataBrew** | 노코드 데이터 정제 | "코드 없이 데이터 클렌징/프로파일링" |

흐름 연결: 적재 **Firehose** → 저장 **S3** → 카탈로그 **Glue** → 조회 **Athena** → 시각화 **QuickSight**.

## 4. 스토리지·마이그레이션 심화

| 서비스/기능 | 무엇을 | 언제 고르나 |
|---|---|---|
| **S3 Object Lock** | 객체를 삭제·변경 불가(WORM)로 보존 | "규정상 변경 불가 보존(감사·법적 보류)" |
| **S3 Access Points** | 버킷에 용도별 접근 지점·정책 | "대규모 공유 버킷을 앱/팀별로 분리 접근" |
| **Storage Gateway (File/Volume/Tape)** | 온프레미스에 AWS 스토리지 연장 | File=NFS/SMB, Volume=iSCSI 블록, Tape=가상 테이프 백업 |
| **DataSync vs Transfer Family** | 대량 반복 전송 vs SFTP/FTPS 수신 | 동기화·이관=DataSync, 외부 SFTP 업로드=Transfer Family |
| **Snow Family** | 오프라인 대용량 이전 | 네트워크로 비현실적인 TB~PB 데이터 |

## 5. 마이그레이션 (DB·서버)

| 서비스 | 무엇을 | 언제 고르나 |
|---|---|---|
| **DMS** | DB 마이그레이션(동종·이기종) | "온프레DB→RDS/Aurora", 최소 다운타임 지속 복제 |
| **SCT (Schema Conversion Tool)** | 이기종 스키마 변환 | "Oracle→PostgreSQL처럼 엔진이 다를 때" DMS와 함께 |
| **Application Migration Service(MGN)** | 서버를 그대로 EC2로 리프트&시프트 | "VM·물리 서버를 통째로 AWS 이전" |

구분: **데이터만/이기종 지속복제 = DMS(+SCT)**, **서버 통째 = MGN**.

## 6. 네트워킹 심화

| 서비스/기능 | 무엇을 | 언제 고르나 |
|---|---|---|
| **PrivateLink / 인터페이스 엔드포인트** | 서비스에 **사설 IP**로 접근(인터넷 불필요) | "VPC에서 AWS/서드파티 서비스를 사설로" (S3·DynamoDB는 게이트웨이 엔드포인트=무료) |
| **VPC Peering vs Transit Gateway** | VPC 1:1 연결 vs 허브 다대다 | 소수=Peering, 다수·온프레 포함=TGW |
| **Direct Connect Gateway** | 여러 리전 VPC를 하나의 DX로 | "DX 하나로 여러 리전 연결" |
| **Route 53 Resolver** | 온프레↔VPC 간 DNS 질의 | "하이브리드 DNS 해석" |

## 7. 운영·거버넌스 (Systems Manager 계열)

| 서비스/기능 | 무엇을 | 언제 고르나 |
|---|---|---|
| **SSM Parameter Store** | 구성값·비밀 저장(계층·버전) | "설정/비밀을 코드 밖에"(고급 로테이션은 Secrets Manager) |
| **SSM Session Manager** | 배스천·키 없이 셸 접근 | "SSH 열지 않고 EC2 접속·감사" |
| **SSM Patch Manager / Automation** | 패치·운영 자동화 | "대규모 인스턴스 패치/반복 작업" |
| **CloudFormation** | IaC로 리소스 선언·반복 배포 | "환경을 코드로 재현/버전관리" |
| **AWS Config** | 리소스 구성 변경 기록·규정 준수 평가 | "구성이 규칙을 지키는지 지속 감사" |
| **CloudTrail vs CloudWatch** | API 호출 기록 vs 지표·로그·알람 | 누가 무엇을 호출=CloudTrail, 성능·로그·알람=CloudWatch |

## 8. 기타 자주 나오는 포인트

- **DynamoDB Streams**: 테이블 변경을 이벤트로 흘려 Lambda 트리거(변경 전파·집계).
- **Lambda@Edge / CloudFront Functions**: 엣지에서 요청/응답 가공(리다이렉트·헤더·A-B). 가벼운 변형은 CloudFront Functions, 무거운 로직은 Lambda@Edge.
- **ECR**: 컨테이너 이미지 레지스트리(ECS/EKS와 세트).
- **EventBridge Scheduler / Pipes**: 크론성 트리거, 소스→타깃 연결(폴링 코드 제거).
- **Cognito**: 사용자 풀(앱 로그인)·자격 증명 풀(임시 AWS 자격). "모바일/웹 사용자 인증" 트리거.

---

## 연습문제 (보충)

먼저 스스로 답을 정한 뒤 해설을 펼쳐 확인한다.

**Q1.** 개발자가 인프라를 직접 구성하지 않고 Java 웹앱 코드를 올리기만 하면 EC2·ELB·ASG가 자동 구성되길 원한다.

<details>
<summary>정답·해설</summary>

**Elastic Beanstalk.** 플랫폼에 코드를 올리면 리소스를 자동 프로비저닝한다. 컨테이너를 가장 단순히 웹서비스화하려면 App Runner.
</details>

**Q2.** 온프레미스에서 RabbitMQ(AMQP)를 쓰던 애플리케이션을 코드 변경 최소화로 AWS에 옮기려 한다.

<details>
<summary>정답·해설</summary>

**Amazon MQ.** 기존 표준 브로커 프로토콜(AMQP 등)을 그대로 지원한다. 새로 설계하는 디커플링이면 SQS/SNS가 맞다.
</details>

**Q3.** 클라이언트가 필요한 필드만 선택해 받고 실시간 구독도 하는 API가 필요하다.

<details>
<summary>정답·해설</summary>

**AppSync(GraphQL).** 필드 선택·실시간 구독·오프라인 동기화를 제공한다.
</details>

**Q4.** 들어오는 IoT 스트림에 대해 실시간으로 집계·이상 탐지를 SQL로 하려 한다.

<details>
<summary>정답·해설</summary>

**Managed Service for Apache Flink(구 Kinesis Data Analytics).** 스트림에 실시간 SQL/Flink 분석을 적용한다.
</details>

**Q5.** 수천 개의 독립적 배치 연산을 관리형으로 스케줄·실행하고 스팟으로 비용을 아끼려 한다.

<details>
<summary>정답·해설</summary>

**AWS Batch.** 작업 큐 + 컴퓨팅 환경으로 대규모 배치를 관리하며 스팟과 잘 맞는다.
</details>

**Q6.** 규정상 저장 객체를 보존 기간 동안 **삭제·변경 불가**로 만들어야 한다.

<details>
<summary>정답·해설</summary>

**S3 Object Lock(WORM).** 지정 기간 동안 변경·삭제를 막는다. 법적 보류(Legal Hold)도 가능.
</details>

**Q7.** 온프레미스 Oracle DB를 PostgreSQL(Aurora)로 **엔진을 바꿔** 최소 다운타임으로 이전하려 한다.

<details>
<summary>정답·해설</summary>

**DMS + SCT.** SCT로 스키마를 변환하고 DMS로 지속 복제해 최소 다운타임 이전한다.
</details>

**Q8.** 수십 대의 VM을 애플리케이션 변경 없이 통째로 EC2로 옮기려 한다.

<details>
<summary>정답·해설</summary>

**Application Migration Service(MGN).** 서버를 리프트&시프트로 EC2에 이전한다.
</details>

**Q9.** VPC에서 서드파티 SaaS 엔드포인트에 **인터넷을 거치지 않고 사설로** 접근하려 한다.

<details>
<summary>정답·해설</summary>

**PrivateLink(인터페이스 엔드포인트).** 사설 IP로 서비스에 접근한다. (S3·DynamoDB는 무료 게이트웨이 엔드포인트.)
</details>

**Q10.** VPC가 많아지며 1:1 피어링 연결이 기하급수로 늘어 관리가 어렵다.

<details>
<summary>정답·해설</summary>

**Transit Gateway.** 허브로 다수 VPC·온프레미스를 묶어 연결을 단순화한다.
</details>

**Q11.** EC2에 SSH 포트를 열지 않고 셸 접근·감사 로그를 남기려 한다.

<details>
<summary>정답·해설</summary>

**SSM Session Manager.** 배스천·키 없이 접속하며 세션을 기록한다.
</details>

**Q12.** "누가 어떤 API를 언제 호출했는지"를 추적해야 한다. CloudTrail인가 CloudWatch인가?

<details>
<summary>정답·해설</summary>

**CloudTrail.** API 호출(행위) 기록용이다. 지표·로그·알람은 CloudWatch.
</details>

**Q13.** 리소스 구성이 사내 규칙(예: "모든 EBS는 암호화")을 지키는지 지속적으로 평가·기록하려 한다.

<details>
<summary>정답·해설</summary>

**AWS Config.** 구성 변경을 기록하고 규칙 준수를 지속 평가한다.
</details>

**Q14.** DynamoDB 테이블의 변경을 이벤트로 받아 Lambda로 후처리하려 한다.

<details>
<summary>정답·해설</summary>

**DynamoDB Streams → Lambda.** 테이블 변경을 스트림으로 흘려 트리거한다.
</details>

**Q15.** 비개발자 팀에게 데이터 기반 대시보드·리포트를 제공하려 한다.

<details>
<summary>정답·해설</summary>

**QuickSight.** 관리형 BI 대시보드/시각화 도구다.
</details>

**Q16.** 설정값과 몇 개의 비밀을 코드 밖에 저장하고 싶다. 자동 교체(로테이션)는 꼭 필요하지 않다.

<details>
<summary>정답·해설</summary>

**SSM Parameter Store.** 구성·비밀을 계층·버전으로 저장한다. 자동 로테이션이 필요하면 Secrets Manager.
</details>

**Q17.** 환경 전체(네트워크·서버·DB)를 코드로 선언해 재현 가능하게 배포·버전관리하려 한다.

<details>
<summary>정답·해설</summary>

**CloudFormation(IaC).** 리소스를 템플릿으로 선언·반복 배포한다.
</details>

**Q18.** CloudFront 요청에 대해 엣지에서 **가벼운 헤더 조작·리다이렉트**만 하려 한다.

<details>
<summary>정답·해설</summary>

**CloudFront Functions.** 초경량 엣지 변형에 적합하다. 무거운 로직·외부 호출은 Lambda@Edge.
</details>
