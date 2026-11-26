---
title: Active Directory(AD) 보안 바로 알기
sidebar_label: AD (Active Directory)
sidebar_position: 9
description: AD의 구성요소와 왜 랜섬웨어 1순위 표적인지, 주요 공격 경로, 방어(티어링·LAPS·MFA)와 재해복구, Entra ID 전환을 운영 관점에서 정리
tags: [보안솔루션, AD, ActiveDirectory, EntraID, 신원보안]
---

# Active Directory(AD) 보안 바로 알기

> **대상 독자:** AD를 운영·방어하는 담당자. 숫자는 **출처·기준시점**을 함께 표기합니다.

## 1. AD란 — 신원의 중심

AD는 윈도우 네트워크의 신원·인증·정책의 뼈대입니다. 거의 모든 기업이 사용하죠.

- **DC(도메인 컨트롤러)** — 신원 저장·인증의 심장 (DC 장악 = 전체 장악)
- **도메인·포레스트** — 신뢰 경계
- **Kerberos·LDAP** — 티켓 인증·디렉터리 조회
- **GPO** — 전 단말에 설정·정책 배포
- **Domain Admin** — 사실상 전권, 최우선 보호

## 2. 왜 1순위 표적인가

AD를 장악하면 랜섬웨어가 전 서버를 한 번에 암호화합니다.

| 수치 | 의미 | 출처 |
|---|---|---|
| **87%** | 랜섬웨어가 신원 시스템(AD·Entra·Okta) 표적 | Semperis 2026 Ransomware Risk Report |
| **51%** | 공격이 **AD**를 직접 겨냥 | 동일 |
| **60%** | AD 복구 절차 문서화뿐 (나머지 무방비) | 동일 |

### 주요 공격 경로 (개념)

Kerberoasting(서비스 계정 티켓 크랙) · Pass-the-Hash(해시 재사용) · Golden/Silver Ticket(티켓 위조) · DCSync(복제 권한으로 해시 탈취) · 권한 상승 · 횡적 이동. **공통점 = 자격증명 도둑질** → 특권 분리가 핵심 방어.

## 3. 방어 — 티어링

| 계층 | 대상 | 규칙 |
|---|---|---|
| **Tier 0** | DC·도메인관리자·PKI | 전용 관리 단말만 |
| **Tier 1** | 서버·업무 시스템 | Tier 0 자격증명 사용 금지 |
| **Tier 2** | 워크스테이션·사용자 | 가장 넓은 공격면 |

> **Tier 0 자격증명을 낮은 티어 단말에서 절대 쓰지 않는다** — 횡적 이동을 구조로 끊습니다.

### 강화 체크리스트

LAPS(로컬 관리자 비번 자동·개별화) · 특권계정 MFA·PAM · 레거시(NTLM·SMBv1) 제거 · 서비스 계정 gMSA · Domain Admin 최소화 · 탐지(Defender for Identity·공격면 점검).

## 4. 재해복구

DC가 암호화되면 신원 전체 마비. 백업에 백도어가 함께 복원될 위험도 있습니다. → **격리(오프라인) 백업 + 전용 AD 복구 솔루션 + 복구 절차 문서화·리허설 + 복원 후 흔적 제거 검증.**

## 5. AD → Entra ID

온프렘 AD(도메인·GPO·Kerberos·폐쇄망)는 여전히 잔존하고, **Entra ID(구 Azure AD)** 는 클라우드 신원(SaaS·조건부 접근)입니다. AD Connect로 **하이브리드**. → 클라우드로 간다고 AD가 사라지지 않으며, **온프렘·클라우드 양쪽**을 지켜야 합니다(공격면도 둘).

## 6. 시장

- AD 보안 시장 **$1.37B(2025) → $3.85B(2033)**, CAGR 13.8% *(Marketintelo, 2026-03)*.
- 도구: Microsoft **Defender for Identity** · **Semperis**(복구·탐지) · Tenable(.ad) · 공격면 점검(Purple Knight·BloodHound). 핵심 축 = 공격면 점검 · 위협 탐지 · 재해복구.

## 7. 권고

AD를 쓰는 모든 조직은 **공격면 점검 → 티어링 → 복구 리허설**을 기본으로. 랜섬웨어 표적(금융·제조·공공)은 전용 복구, 하이브리드는 AD·Entra 양쪽 보호, 특권계정 많으면 PAM·gMSA·Domain Admin 최소화.

## 흔한 오해와 함정

- **AD는 그냥 ‘인프라’** → 보안 설계 없이 쓰면 최대 공격 경로
- **Domain Admin 남발** → 전권 계정 많을수록 위험
- **백업만 있고 복구 미연습** → 재감염·절차 부재로 실패
- **레거시 프로토콜 방치** → NTLM·SMBv1이 통로
- **Entra 가면 AD 끝** → 하이브리드는 둘 다

---

## 출처 (기준 시점)

- Semperis 2026 Ransomware Risk Report (2026) — 공격 통계
- Marketintelo (2026-03) — AD 보안 시장
- 참고: NIST 티어링 모델·Microsoft 보안 가이드

> 수치는 게시 시점에 재확인을 권장합니다.
