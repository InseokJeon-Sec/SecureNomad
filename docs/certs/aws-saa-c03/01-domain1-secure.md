---
title: 01. 보안 아키텍처 설계 (Domain 1)
sidebar_label: 01. 보안 설계
sidebar_position: 2
description: SAA-C03 Domain 1 핵심 정리 — IAM 접근 제어, VPC·보안 서비스, 데이터 암호화를 시험 관점에서 1시간 분량으로
---

# Domain 1 — 보안 아키텍처 설계 (30%)

시험에서 비중이 가장 큰 도메인이다. 외우기보다 **"이 요구사항에는 어떤 서비스/구성이 맞는가"** 를 연결하는 연습이 중요하다. 아래는 1시간 안에 훑도록 핵심과 자주 나오는 비교 위주로 정리했다.

---

## 1.1 안전한 접근 설계 (IAM)

### IAM 구성요소

- **사용자(User)**: 사람 또는 장기 자격 증명이 필요한 개체. 액세스 키는 코드에 넣지 않는다.
- **그룹(Group)**: 사용자 묶음. 정책을 그룹에 붙여 관리한다. (그룹에 역할은 못 붙인다)
- **역할(Role)**: 임시 자격 증명을 발급받아 "빌려 쓰는" 신원. EC2·Lambda·교차 계정 접근의 기본.
- **정책(Policy)**: 권한을 JSON으로 정의. `Effect / Action / Resource / Condition` 구조.

### 정책의 종류 (시험 단골)

| 종류 | 붙는 대상 | 쓰임 |
| --- | --- | --- |
| Identity-based | 사용자·그룹·역할 | "이 신원이 무엇을 할 수 있나" |
| Resource-based | S3 버킷·KMS 키·SQS 등 | "이 리소스에 누가 접근 가능한가" (교차 계정에 유용) |
| **SCP** (Organizations) | 계정/OU | 계정 전체의 **권한 상한선**(guardrail). 권한을 주지는 않고 제한만 |
| Permission Boundary | 사용자·역할 | 그 신원이 가질 수 있는 **최대 권한** 제한 |
| Session Policy | AssumeRole 시 | 세션 동안의 추가 제한 |

### 정책 평가 로직

1. 기본은 **암묵적 거부(implicit deny)**.
2. 적용되는 정책 중 **명시적 Allow**가 있으면 허용.
3. 단, **명시적 Deny가 하나라도 있으면 무조건 거부**(Deny가 Allow를 이긴다).
4. SCP·Permission Boundary·Session Policy는 "허용 범위를 좁히는" 교집합으로 작동.

> 핵심: **Explicit Deny > Allow > Implicit Deny**. SCP는 허용이 아니라 상한이다.

### 역할과 STS

- **STS**(Security Token Service)가 `AssumeRole`로 **임시 자격 증명**을 발급한다.
- **EC2는 인스턴스 프로파일(역할)** 로 권한을 받는다 → 액세스 키 하드코딩 금지. "EC2 앱이 S3 접근" 같은 문제의 정답은 거의 역할.
- **교차 계정 접근**: 상대 계정에 역할을 만들고 신뢰 정책(Trust Policy)에 내 계정을 넣은 뒤 AssumeRole.
- **서비스 역할**: Lambda 실행 역할 등 서비스가 대신 수행할 때.

### 연합(Federation)과 디렉터리

- **IAM Identity Center**(구 AWS SSO): 여러 계정·앱에 SSO. 기업 사용자 중앙 관리.
- **SAML 2.0**: 기존 사내 AD/IdP 연동(기업 직원용).
- **Web Identity / OIDC**: 모바일·웹 앱에서 Google/Facebook 등 → 보통 **Amazon Cognito**(자격 증명 풀)로 처리.
- **AWS Managed Microsoft AD / AD Connector**: 온프렘 AD 연계.

### 루트·자격 증명 보호

- 루트 계정은 일상 사용 금지, **MFA 필수**, 액세스 키 삭제.
- 최소 권한 원칙, 액세스 키 정기 교체, 가능한 한 사용자 대신 역할.
- **IAM Access Analyzer**로 외부에 노출된 리소스 점검.

---

## 1.2 안전한 네트워크·워크로드 설계

### VPC 기본

- **서브넷**: 퍼블릭(IGW 경유 인터넷) / 프라이빗(직접 인터넷 불가).
- **NAT 게이트웨이**: 프라이빗 서브넷이 **아웃바운드만** 인터넷 접근(패치 등). 인바운드는 불가.
- **IGW**: VPC의 인터넷 출입구.

### 보안 그룹 vs 네트워크 ACL (매우 자주 나옴)

| 구분 | 보안 그룹(SG) | 네트워크 ACL(NACL) |
| --- | --- | --- |
| 적용 대상 | ENI(인스턴스 단위) | 서브넷 단위 |
| 상태 | **Stateful**(응답 자동 허용) | **Stateless**(인·아웃 각각 규칙 필요) |
| 규칙 | Allow만 | Allow·**Deny 모두** |
| 평가 | 모든 규칙 종합 | 번호 순서대로, 먼저 매칭 우선 |

> 특정 IP를 **차단**해야 하면 SG로는 불가 → **NACL의 Deny** 규칙을 쓴다.

### VPC 엔드포인트 (인터넷 없이 AWS 서비스 접근)

- **게이트웨이 엔드포인트**: **S3, DynamoDB** 전용. 라우팅 테이블에 추가. 무료.
- **인터페이스 엔드포인트(PrivateLink)**: 그 외 대부분 서비스. ENI + 프라이빗 IP 생성. 시간당 과금.

### 운영 접근

- **Bastion Host** 대신 **SSM Session Manager**를 권장(포트 개방·키 관리 불필요, 감사 로깅). "SSH 포트 안 열고 접속" 문제의 정답.

### 보안 서비스 지도 (무엇을 하는지 구분)

| 서비스 | 역할 |
| --- | --- |
| **WAF** | L7(HTTP) 필터 — SQLi·XSS 등. CloudFront·ALB·API GW에 부착 |
| **Shield** | DDoS 방어 (Standard 자동 무료 / Advanced 유료·고급) |
| **GuardDuty** | 로그 기반 **위협 탐지**(이상 행위) |
| **Inspector** | EC2·컨테이너·Lambda **취약점(CVE) 스캔** |
| **Macie** | S3의 **민감정보(PII) 탐지** |
| **Security Hub** | 보안 상태 **통합 대시보드**(여러 서비스 결과 집계) |
| **Network Firewall** | VPC 레벨 상태 기반 방화벽/IPS |
| **Firewall Manager** | 여러 계정의 WAF·SG 규칙 중앙 관리 |

### 비밀 관리: Secrets Manager vs Parameter Store

| 구분 | Secrets Manager | Parameter Store |
| --- | --- | --- |
| 자동 교체(rotation) | **지원**(RDS 등 연동) | 기본 미지원 |
| 비용 | 유료 | 표준은 무료 |
| 용도 | DB 비밀번호·키 등 **교체 필요한 비밀** | 설정값·일반 파라미터 |

> "DB 자격 증명을 **자동 교체**" → Secrets Manager.

---

## 1.3 데이터 보호 (암호화)

### 기본 개념

- **전송 중 암호화**: TLS. 인증서는 **ACM**(AWS Certificate Manager)으로 발급·자동 갱신.
- **저장 시 암호화**: 대부분 **KMS** 기반. **봉투 암호화(envelope encryption)** — 데이터 키로 데이터를 암호화하고, 그 데이터 키를 다시 KMS 키로 암호화.

### KMS 키 종류

- **AWS 관리형 키**: 서비스가 자동 생성(`aws/s3` 등). 정책·교체를 사용자가 거의 못 바꿈.
- **고객 관리형 키(CMK)**: 사용자가 생성·키 정책 제어·**교체 설정**·삭제 가능. 세밀한 제어가 필요하면 이것.
- **AWS 소유 키**: AWS가 소유, 보이지 않음.
- **키 정책(Key Policy)** 이 KMS 접근의 1차 기준. IAM 정책과 함께 작동. **멀티 리전 키**로 리전 간 복제 가능.

### KMS vs CloudHSM

| 구분 | KMS | CloudHSM |
| --- | --- | --- |
| 관리 | 완전관리형(멀티테넌트) | **전용 HW HSM**(단일 테넌트) |
| 키 통제 | AWS와 공유 책임 | **고객이 완전 통제** |
| 용도 | 일반 암호화 | FIPS 140-2 Level 3, 규정상 전용 HSM 필요 시 |

### S3 암호화 옵션

| 방식 | 키 관리 주체 |
| --- | --- |
| **SSE-S3** | S3가 관리(AES-256) — 가장 단순, 기본값 |
| **SSE-KMS** | KMS 키 사용 — 접근 감사·키 제어. **버킷 키**로 KMS 호출 비용 절감 |
| **SSE-C** | 고객이 키 제공·관리(AWS는 저장 안 함) |

> "저장 시 암호화를 **강제**" → 버킷 정책에서 암호화 없는 PUT 거부. "키 사용을 **감사·제어**" → SSE-KMS.

---

## 시험 직전 핵심 요약

- **EC2/서비스가 다른 리소스 접근 → 역할(Role)**. 액세스 키 하드코딩은 오답.
- **명시적 Deny가 최우선**. SCP는 권한 부여가 아니라 상한선.
- **IP 차단은 NACL**(Deny), 세밀한 허용은 SG(Stateful).
- **S3·DynamoDB는 게이트웨이 엔드포인트**, 나머지는 인터페이스(PrivateLink).
- **자동 교체 비밀 → Secrets Manager**, 단순 설정값 → Parameter Store.
- **위협 탐지 GuardDuty / 취약점 Inspector / 민감정보 Macie / 통합 Security Hub** — 역할 구분이 포인트.
- **키 완전 통제·전용 HSM → CloudHSM**, 일반 관리형 → KMS.
- **SSH 포트 안 열고 접속 → SSM Session Manager**.

> 다음 단계: 각 서비스를 콘솔/문서로 한 번씩 눈에 익히고, "요구사항 → 서비스" 매핑을 반복하면 Domain 1은 충분히 커버된다.
