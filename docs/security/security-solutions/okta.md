---
title: Okta / IDaaS 바로 알기
sidebar_label: Okta (IDaaS)
sidebar_position: 10
description: IDaaS(SSO·MFA·라이프사이클)의 원리, Okta vs Entra ID, 도입 실무, IDaaS 보안(피싱저항 MFA)과 시장을 실무 관점에서 정리
tags: [보안솔루션, Okta, IDaaS, IAM, SSO, MFA]
---

# Okta / IDaaS 바로 알기

> **대상 독자:** 솔루션을 검토·도입하는 담당자. 숫자는 **출처·기준시점**을 함께 표기합니다.

## 1. IDaaS란 — 왜 필요한가

SaaS가 수십 개로 늘면 로그인·계정 관리가 지옥이 됩니다(비번 재사용, 퇴사자 계정 방치). **IDaaS**는 신원을 클라우드에서 하나로 모읍니다 — SSO(한 번 로그인, 모든 앱), MFA, **자동 프로비저닝(입·퇴사)**, 중앙 통제·감사.

## 2. 기능 5축 (+CIAM)

- **SSO** — 한 번 인증 → 모든 앱(SAML/OIDC)
- **MFA·적응형 인증** — 2차 인증·위험 기반 추가 확인
- **라이프사이클(SCIM)** — 입·퇴사 자동 계정 생성·회수 *(진짜 가치)*
- **디렉터리·연합** — AD·HR 소스 연결, 단일 신원
- **조건부 접근** — 기기·위치·위험으로 허용/차단
- **CIAM** — 외부 고객 신원

## 3. 동작 — SSO 흐름

```text
사용자 → Okta(IdP: 인증+MFA+조건) → SAML/OIDC 토큰 → SaaS 앱(비번 저장 안 함)
```

앱은 비밀번호 대신 IdP의 **토큰**을 믿습니다 — 그래서 **IdP가 급소**(뚫리면 전 앱 노출).

## 4. Okta vs Entra ID

| | Okta | Microsoft Entra ID |
|---|---|---|
| 성격 | **중립·멀티클라우드**, 앱 연동 생태계(OIN) | **M365 번들**(비용 유리), MS 생태계·AD 연속성 |
| 한계 | 중립 프리미엄(가격↑) | MS 종속 |

둘 다 Gartner Access Management **리더 9년 연속**. 선택 기준은 **생태계·중립성** — M365 중심이면 Entra, 멀티클라우드·중립이면 Okta.

## 5. 도입 실무 — 파악 · 생성 · 결정

**① 파악** — 쓰는 SaaS·온프렘 앱(**SSO/SCIM 지원** 여부), 사용자·그룹, **진실의 원천(HR·AD)**, 외부 고객(CIAM), IDaaS 관리자 보호 방안.

**② 생성·준비** — 앱 연동(SAML/OIDC), SCIM 프로비저닝, MFA 정책, HR/AD 소스 연결, 로그·SIEM.

**③ 결정** — **MFA 방식(피싱저항 FIDO2·패스키)**, 오프보딩 범위(퇴사 즉시 전 앱 차단), 조건부 접근, 관리자 보호.

> **SSO만 켜는 건 절반** — 자동 프로비저닝·오프보딩까지 가야 완성.

## 6. 보안 — IDaaS가 뚫리면

신원을 모은 만큼 급소도 하나. Semperis 2026 기준 랜섬웨어의 **27%**가 Okta 등 IDaaS 신원 표적. IdP·**슈퍼관리자 보호**와 **피싱저항 MFA(FIDO2)** 가 생명선(푸시 피로 공격 차단). 토큰·세션 관리도 필수.

## 7. 비용·시장

- **비용:** 사용자당 월 구독·모듈별. Entra는 M365 번들로 저렴, Okta는 중립 프리미엄. CIAM은 MAU 기반.
- **시장:** IDaaS **$16.15B(2025) → $229.56B(2035)**, CAGR 30.4% *(Future Market Insights)*. Gartner AM 리더 Okta·Microsoft(9년), Ping·CyberArk 등.

## 어떤 환경에 맞나

| 상황 | 권장 |
|---|---|
| 멀티클라우드·SaaS 다수·중립 | Okta |
| M365 중심·비용 민감 | Entra ID |
| 외부 고객 로그인 | CIAM |
| 온프렘 AD 다수·하이브리드 | Entra(AD 연속성) 또는 연동 |
| 규제·피싱 표적 | 피싱저항 MFA 필수 |

## 흔한 오해와 함정

- **SSO만 켜고 끝** → 오프보딩 없으면 퇴사자 계정 잔존
- **MFA를 푸시만** → 푸시 피로 공격, 피싱저항(FIDO2)로
- **IDaaS 관리자 방치** → 슈퍼관리자가 최상위 표적
- **Okta=Entra 단순 비교** → 생태계·중립성 다름, TCO로
- **토큰·세션 관리 소홀** → 토큰 탈취 시 MFA 우회

---

## 출처 (기준 시점)

- Gartner Magic Quadrant for Access Management (2025) — 리더
- Future Market Insights (2025) — IDaaS 시장
- Semperis 2026 — IDaaS 공격 비중

> 수치는 게시 시점에 재확인을 권장합니다.
