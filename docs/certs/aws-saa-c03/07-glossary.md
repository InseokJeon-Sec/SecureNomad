---
title: 07. 서비스·용어 한 줄 사전
sidebar_label: 07. 한 줄 사전
sidebar_position: 8
description: SAA-C03에 나오는 AWS 서비스·기능·약어를 한 줄로 정리한 빠른 참조 사전
---

# SAA-C03 서비스·용어 한 줄 사전

본문을 읽다 모르는 서비스·약어가 나오면 여기서 **한 줄로** 확인한다. "무엇을 하는가 + 언제 쓰는가" 중심이다. 복습·시험 직전 훑기에도 쓴다. (본문에는 각 문서에서 **처음 나올 때** 괄호로 짧은 설명을 달아 두었다.)

:::note 보는 법
서비스 선택 문제는 결국 **"이 요구사항 → 어떤 서비스"** 연결이다. 각 항목의 "언제"가 그 트리거다. 비슷한 서비스는 **구분 포인트**를 같이 적었다.
:::

## 컴퓨팅

| 서비스/용어 | 한 줄 설명 |
|---|---|
| **EC2** | 가상 서버(인스턴스). 직접 OS·소프트웨어를 올려 돌리는 기본 컴퓨팅 |
| **인스턴스 패밀리(T·M·C·R·I·P…)** | 용도별 EC2 종류. T=버스터블·저비용, M=범용, C=CPU, R/X=메모리, I=스토리지, P/G=GPU |
| **Auto Scaling(ASG)** | 부하에 따라 EC2 수를 자동으로 늘리고 줄이는 그룹 |
| **Lambda** | 서버 관리 없이 코드를 이벤트로 실행(최대 15분). 쓴 만큼만 과금(서버리스) |
| **ECS** | 컨테이너 오케스트레이션(AWS 자체 방식) |
| **EKS** | 관리형 쿠버네티스(K8s 표준이 필요할 때) |
| **Fargate** | ECS·EKS를 서버(EC2) 관리 없이 돌리는 서버리스 컨테이너 실행 엔진 |
| **Elastic Beanstalk** | 코드만 올리면 EC2·ELB·ASG를 자동 구성해 주는 배포 서비스 |
| **배치 그룹(Placement Group)** | EC2 배치 방식 — Cluster(밀집·저지연), Spread(분산·독립장애), Partition(대규모 분산) |

## 로드 밸런싱

| 서비스/용어 | 한 줄 설명 |
|---|---|
| **ELB** | Elastic Load Balancing. 트래픽을 여러 대상에 분산하는 로드 밸런서 총칭 |
| **ALB** | L7(HTTP) 로드 밸런서. 경로·호스트 기반 라우팅(웹·컨테이너) |
| **NLB** | L4(TCP/UDP) 로드 밸런서. 초고성능·고정 IP |
| **GWLB** | Gateway LB. 트래픽을 방화벽 등 보안 어플라이언스로 통과시킴 |
| **대상 그룹(Target Group)** | LB가 트래픽을 보내는 대상(EC2·IP·Lambda) 묶음. 상태 확인이 붙는 곳 |

## 스토리지

| 서비스/용어 | 한 줄 설명 |
|---|---|
| **S3** | 객체 스토리지. HTTP로 접근하는 무한 확장 저장소(정적 파일·백업·데이터 레이크) |
| **S3 스토리지 클래스** | 접근 빈도별 요금제 — Standard / Standard-IA / One Zone-IA / Glacier 계열 |
| **S3 Glacier / Deep Archive** | 거의 안 쓰는 데이터용 초저가 아카이브(복원에 시간 걸림) |
| **Intelligent-Tiering** | 접근 패턴을 몰라도 자동으로 클래스를 옮겨 비용 최적화 |
| **수명 주기(Lifecycle)** | "N일 후 IA로, 더 지나면 Glacier로, 결국 삭제"를 자동화하는 규칙 |
| **버전 관리(Versioning)** | 덮어쓰기·삭제로부터 이전 버전을 보존 |
| **복제(CRR/SRR)** | S3 자동 복제 — CRR=교차 리전(DR), SRR=동일 리전(로그 집계) |
| **EBS** | EC2에 붙이는 블록 디스크. gp3(범용)·io2(고성능)·st1/sc1(HDD) |
| **Instance Store** | EC2에 물리로 붙은 초고속 임시 디스크(정지·종료 시 사라짐) |
| **EFS** | 여러 리눅스 EC2가 동시에 마운트하는 관리형 공유 파일시스템(NFS) |
| **FSx** | 관리형 파일시스템 — Windows(SMB)·Lustre(HPC 고성능) |
| **Storage Gateway** | 온프레미스에 AWS 스토리지를 연장(File/Volume/Tape) |
| **DataSync** | 온프레미스↔AWS 대량 데이터 반복 전송·동기화 |
| **Transfer Family** | SFTP/FTPS로 S3·EFS에 파일 올리기 |
| **Snowball / Snow Family** | 네트워크로 옮기기 힘든 대용량을 물리 장치로 오프라인 이전 |

## 데이터베이스

| 서비스/용어 | 한 줄 설명 |
|---|---|
| **RDS** | 관리형 관계형 DB(MySQL·PostgreSQL 등) |
| **Multi-AZ** | 다른 AZ에 동기 복제된 대기본을 둬 장애 시 자동 전환(가용성용) |
| **읽기 전용 복제본(Read Replica)** | 비동기 복제본으로 읽기 부하를 분산(확장용) |
| **Aurora** | AWS 클라우드 네이티브 관계형 DB(RDS보다 고성능·고가용). Serverless·Global 옵션 |
| **DynamoDB** | 관리형 NoSQL(키-값). 한 자릿수 ms 지연. Global Tables=다중 리전 활성-활성 |
| **DAX** | DynamoDB 앞단 인메모리 캐시(읽기를 마이크로초로) |
| **ElastiCache** | 관리형 인메모리 캐시 — Redis(고급·영속)·Memcached(단순) |
| **Redshift** | 대규모 분석(OLAP) 데이터 웨어하우스(트랜잭션용 아님) |
| **OLTP / OLAP** | OLTP=실시간 트랜잭션 처리(RDS·DynamoDB), OLAP=대량 집계 분석(Redshift) |

## 네트워킹

| 서비스/용어 | 한 줄 설명 |
|---|---|
| **VPC** | 내 전용 가상 네트워크 |
| **서브넷** | VPC를 나눈 구획 — 퍼블릭(인터넷 직접)·프라이빗(직접 불가) |
| **IGW(인터넷 게이트웨이)** | VPC를 인터넷과 연결 |
| **NAT 게이트웨이** | 프라이빗 서브넷이 아웃바운드로만 인터넷에 나가게 함 |
| **보안 그룹(SG)** | 인스턴스 단위 방화벽. Stateful, Allow만 |
| **네트워크 ACL(NACL)** | 서브넷 단위 방화벽. Stateless, Allow·Deny 모두 |
| **VPC 엔드포인트** | 인터넷을 안 거치고 AWS 서비스 접근 — 게이트웨이(S3·DynamoDB·무료)/인터페이스(PrivateLink·유료) |
| **PrivateLink** | 서비스에 사설 IP로 접근(인터페이스 엔드포인트의 기반) |
| **VPC Peering** | VPC 두 개를 1:1로 연결 |
| **Transit Gateway(TGW)** | 다수 VPC·온프레미스를 허브로 묶어 연결 |
| **Route 53** | 관리형 DNS. 라우팅 정책(장애조치·지연·가중치·지리) + 상태 확인 |
| **CloudFront** | CDN. 엣지에 캐싱해 전 세계에 빠르게 전달하고 오리진 부하↓ |
| **Global Accelerator** | 고정 애니캐스트 IP로 비캐싱 TCP/UDP 트래픽을 가속 |
| **Direct Connect(DX)** | 온프레미스↔AWS 전용 물리 회선(일관된 저지연·고대역폭) |
| **Site-to-Site VPN** | 인터넷 경유 암호화 터널(빠르게·저렴하게 연결) |

## 보안 · 자격 증명(IAM)

| 서비스/용어 | 한 줄 설명 |
|---|---|
| **IAM** | 누가(Principal) 무엇을(Action) 어디에(Resource) 할 수 있는지 정하는 인증·인가 체계 |
| **역할(Role)** | 특정 신원에 묶이지 않은 권한 꾸러미. 임시 자격 증명을 빌려 씀(EC2·교차계정) |
| **정책(Policy)** | 권한을 적은 JSON(Effect·Action·Resource·Condition) |
| **SCP** | Organizations에서 계정·OU의 권한 상한을 긋는 가드레일(권한 부여 아님) |
| **Permission Boundary** | 한 신원이 가질 수 있는 최대 권한을 제한 |
| **STS** | 유효 기간 있는 임시 자격 증명을 발급(AssumeRole) |
| **Organizations** | 여러 AWS 계정을 묶어 중앙 관리·통합 결제 |
| **IAM Identity Center** | 구 AWS SSO. 기업 직원 다계정 단일 로그인 |
| **Cognito** | 앱 사용자 로그인(사용자 풀)·임시 AWS 자격 증명(자격 증명 풀) |
| **KMS** | 관리형 암호화 키 서비스(봉투 암호화). 키 정책·CloudTrail 감사 |
| **CloudHSM** | 전용 하드웨어 HSM. 키를 고객이 완전 통제(FIPS 140-2 L3) |
| **ACM** | TLS 인증서 무료 발급·자동 갱신(ALB·CloudFront용, EC2 직접설치 불가) |
| **Secrets Manager** | 비밀 저장 + 자동 교체(rotation)(DB 비번 등) |
| **Parameter Store(SSM)** | 설정값·비밀 저장(표준 등급 무료, 자동 교체는 기본 미지원) |
| **WAF** | L7 웹 공격(SQLi·XSS) 필터 |
| **Shield** | DDoS 방어(Standard 무료 / Advanced 유료) |
| **GuardDuty** | 로그 기반 위협·이상행위 탐지(에이전트 불필요) |
| **Inspector** | EC2·컨테이너 이미지의 취약점(CVE) 점검 |
| **Macie** | S3의 민감정보(개인정보) 탐지·분류 |
| **Security Hub** | 여러 보안 서비스 결과를 한 대시보드로 통합 |
| **CloudTrail** | 계정의 모든 API 호출 기록(누가·언제·무엇을) |
| **AWS Config** | 리소스 구성·변경 기록 + 규정 준수 지속 평가 |
| **VPC Flow Logs** | 네트워크 트래픽 메타데이터 기록 |
| **Block Public Access(BPA)** | S3 퍼블릭 노출을 계정·버킷 단위로 원천 차단 |
| **사전서명 URL(presigned URL)** | 비공개 객체를 일정 시간만 접근하게 하는 임시 URL |
| **S3 Access Points** | 공유 버킷에 앱별 접근 지점·정책을 분리 |
| **AWS RAM** | 서브넷·Transit Gateway 등을 계정 간 공유 |
| **Session Manager(SSM)** | SSH 포트 없이 EC2에 접속·명령(배스천 대체) |
| **MFA** | 다단계 인증. `aws:MultiFactorAuthPresent` 조건으로 강제 가능 |

## 메시징 · 통합

| 서비스/용어 | 한 줄 설명 |
|---|---|
| **SQS** | 메시지 큐. 생산·소비 속도를 분리하는 버퍼(당겨가기). 표준/FIFO |
| **SNS** | 발행/구독. 한 이벤트를 여러 구독자에게 밀어주기(팬아웃) |
| **EventBridge** | 이벤트 버스. 내용 기반 규칙으로 서비스 간 라우팅 |
| **Step Functions** | 여러 단계를 순서·분기·재시도로 묶는 워크플로(상태 머신) |
| **DLQ(Dead Letter Queue)** | 반복 실패 메시지를 격리하는 별도 큐 |
| **가시성 제한시간(Visibility Timeout)** | 소비자가 가져간 메시지가 그 시간 동안 안 보이는 설정 |
| **API Gateway** | API 프런트도어(인증·스로틀·캐시). REST/HTTP/WebSocket |
| **AppSync** | 관리형 GraphQL API |
| **Amazon MQ** | 관리형 ActiveMQ/RabbitMQ(기존 브로커 프로토콜 이전용) |

## 운영 · 거버넌스 · 비용

| 서비스/용어 | 한 줄 설명 |
|---|---|
| **CloudWatch** | 지표·로그·알람 모니터링 |
| **CloudFormation** | IaC. 리소스를 코드(템플릿)로 선언·반복 배포 |
| **AWS Backup** | 여러 서비스 백업을 중앙 정책으로 관리 |
| **DR 전략** | Backup&Restore→Pilot Light→Warm Standby→Multi-Site (오른쪽일수록 빠르고 비쌈) |
| **RTO / RPO** | RTO=얼마나 빨리 복구, RPO=데이터 손실 허용 범위 |
| **On-Demand / RI / Savings Plans / Spot** | 요금 모델 — 즉시 / 특정약정 / 유연약정 / 할인·중단가능 |
| **Compute Optimizer** | 사용 지표로 과·소 프로비저닝을 교정(right-sizing) 권고 |
| **Cost Explorer** | 비용 추세 시각화·예측 |
| **AWS Budgets** | 예산 설정 + 초과 알림 |
| **Cost and Usage Report(CUR)** | 가장 상세한 청구 원천 데이터 |
| **Trusted Advisor** | 비용·보안·성능·내결함성 점검 권고 |
| **AWS Artifact** | AWS의 규정 준수 보고서(ISO·SOC·PCI) 다운로드 |
| **통합 결제(Consolidated Billing)** | 여러 계정을 묶어 볼륨 할인·예약 공유 |

## 마이그레이션

| 서비스/용어 | 한 줄 설명 |
|---|---|
| **DMS** | DB 마이그레이션(동종·이기종, 지속 복제) |
| **SCT** | 이기종 DB 스키마 변환 도구(DMS와 함께) |
| **Application Migration Service(MGN)** | 서버를 통째로 EC2로 리프트&시프트 |

## 기타 약어

| 약어 | 뜻 |
|---|---|
| **AZ** | Availability Zone. 리전 안의 독립된 데이터센터 묶음 |
| **SPOF** | Single Point of Failure. 단일 장애점 |
| **IaC** | Infrastructure as Code. 인프라를 코드로 관리 |
| **IOPS** | 초당 입출력 수(디스크 성능 지표) |
| **CDN** | Content Delivery Network. 엣지 캐싱 전송망 |
| **HSM** | Hardware Security Module. 암호 키 전용 하드웨어 |
| **TLS / SSL** | 전송 중 암호화 프로토콜 |
| **ETL** | Extract-Transform-Load. 데이터 추출·변환·적재 |
