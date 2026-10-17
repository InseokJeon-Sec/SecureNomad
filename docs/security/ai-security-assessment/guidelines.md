---
title: 국내외 AI 보안 가이드라인·표준
sidebar_label: 02. 국내외 가이드라인
sidebar_position: 2
description: AI 보안성 평가와 안전한 사용의 기준이 되는 국제·국내 가이드라인, 표준, 법규 총정리 (OWASP, NIST, EU AI Act, ISO 42001, AI 기본법, 개인정보위 가이드 등)
tags: [AI보안, 가이드라인, 컴플라이언스]
---

# 국내외 AI 보안 가이드라인·표준

AI 보안성 평가는 "감(感)"이 아니라 **공인된 기준**을 근거로 해야 설득력이 있습니다. 여기서는 실무에서 가장 많이 참조되는 국제·국내 문서를 정리합니다.

:::tip 더 깊이 공부하려면
각 표준의 상세 설명과 **표준들 사이의 관계도**는 [07. 표준 상세·관계도](./standards-deep-dive.md)에 정리했습니다.
:::

:::tip 큰 그림
- **위협 체크리스트**가 필요하면 → OWASP LLM Top 10, MITRE ATLAS
- **리스크 관리 체계**가 필요하면 → NIST AI RMF, ISO/IEC 42001·23894
- **규제 준수**가 필요하면 → EU AI Act, (국내) AI 기본법, 개인정보보호법
:::

## I. 국제 — 위협·보안 중심

### OWASP Top 10 for LLM Applications (2025)
LLM 애플리케이션의 대표 보안 위험 10가지. 평가 체크리스트의 사실상 표준입니다. 자세한 항목별 설명은 [03. 위협 모델](./threats.md)에서 다룹니다.

- 원문: [OWASP Gen AI Security Project — LLM Top 10](https://genai.owasp.org/llm-top-10/)

### MITRE ATLAS
AI 시스템을 겨냥한 **공격 전술·기법**을 MITRE ATT&CK 방식의 매트릭스로 정리한 지식 베이스. 실제 공격 사례 기반이라 위협 모델링에 유용합니다.

- 원문: [MITRE ATLAS](https://atlas.mitre.org/)

### Google SAIF (Secure AI Framework)
AI 시스템 보안을 위한 6대 핵심 요소를 제시하는 실무 프레임워크. 거버넌스·탐지·대응 관점이 잘 정리돼 있습니다.

- 원문: [Google SAIF](https://saif.google/)

### CISA · NCSC 「Guidelines for Secure AI System Development」
미국 CISA와 영국 NCSC가 공동 발표한 **AI 시스템 안전 개발 가이드**. 설계–개발–배포–운영 전 수명주기의 보안 원칙을 담았습니다.

- 원문: [CISA — Guidelines for Secure AI System Development](https://www.cisa.gov/resources-tools/resources/guidelines-secure-ai-system-development)

## II. 국제 — 리스크 관리·거버넌스

### NIST AI RMF (AI Risk Management Framework)
미국 NIST가 만든 AI 리스크 관리 프레임워크(AI 100-1). **Govern–Map–Measure–Manage** 4개 기능으로 구성됩니다. 생성형 AI에 특화된 부속 문서 **Generative AI Profile(NIST AI 600-1)** 도 함께 참고합니다.

- 원문: [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) · [Generative AI Profile (NIST AI 600-1)](https://airc.nist.gov/docs/NIST.AI.600-1.GenAI-Profile.pdf)

### ISO/IEC 42001 — AI 경영시스템(AIMS)
AI를 다루는 조직의 **경영시스템 인증 표준**. ISO 27001이 정보보안에 대해 하는 역할을, 42001은 AI에 대해 합니다(정책·역할·리스크 관리·지속 개선). 인증 획득이 가능합니다.

- 참고: [ISO/IEC 42001](https://www.iso.org/standard/81230.html)

### ISO/IEC 23894 — AI 리스크 관리
ISO 31000(리스크 관리)을 AI 맥락에 적용한 **리스크 관리 가이드**. 42001과 짝으로 쓰입니다.

- 참고: [ISO/IEC 23894](https://www.iso.org/standard/77304.html)

### EU AI Act — 위험 기반 규제
AI를 위험도에 따라 **금지(unacceptable)–고위험(high)–제한적(limited)–최소(minimal)** 로 나눠 규제하는 세계 최초의 포괄적 AI 법. 역외 적용이 있어 EU 대상 서비스라면 국내 기업도 영향을 받습니다.

주요 시행 일정(2025~2026):

| 시점 | 적용 내용 |
|---|---|
| 2025-02-02 | AI 시스템 정의 · **금지된 AI 관행** 적용, AI 리터러시 의무 |
| 2025-08-02 | 거버넌스 규정 + **범용 AI(GPAI) 모델 제공자 의무** 적용 |
| 2026-07-27 | **AI Omnibus** 개정 규정 발효(고위험 일정 연장·간소화) |
| 2026-08-02 | 대부분의 나머지 조항 적용(§50 **투명성** 의무 포함) = 일반 적용 |
| 2026-12-02 | 신규 금지 2건 + **생성물의 기계판독 표시(워터마크)** 의무 |
| 2027-12-02 | 부속서 III **고위험 시스템**(채용·교육·필수서비스·생체인식 등) 요건 적용 |

- 원문: [EU AI Act 공식 포털](https://artificialintelligenceact.eu/) · [시행 일정](https://www.euaiact.com/implementation-timeline)

:::caution
EU AI Act 일정은 **AI Omnibus** 개정으로 조정되었습니다(2026). 법적 판단이 필요하면 반드시 관보(EUR-Lex) 원문을 확인하세요.
:::

## III. 국내

### 인공지능 기본법 (AI 기본법)
대한민국의 AI 종합법으로 **2026년 1월 22일 시행**. 산업 진흥과 규제를 함께 담았습니다.

핵심 포인트:
- **고영향 AI**: 생명·권리에 큰 영향을 주는 분야(에너지·의료·원자력·범죄수사·채용·대출심사·교통·공공서비스·교육 등)의 AI → 사람이 관리·통제할 수 있는 안전조치 의무
- **생성물 표시**: 생성형 AI 결과물에 워터마크 부착 원칙, 딥페이크는 AI 생성 사실 고지·표시 의무
- **국내 대리인 지정**: 일정 규모 이상 해외 사업자
- 규제 대상은 **AI 개발·서비스 제공 사업자**이며 단순 이용자는 대상이 아님. 최소 1년 이상 계도 기간 운영

- 참고: [AI 기본법 해설 (KB)](https://kbthink.com/life/daily/ai-basic-act.html)

### 개인정보보호위원회 — 생성형 AI 개인정보 보호 가이드
개인정보위가 **2026년 5월 19일 공개**. 이용자가 AI에 개인정보를 입력할 때 알아야 할 점을 중심으로, 학습 활용·삭제·국외 이전 등 8가지 쟁점을 정리했습니다.

핵심 메시지:
- 입력한 텍스트·파일·이미지·음성이 **모델 개선에 활용될 수 있음** → 서비스별 정책 확인, 가능하면 **학습 opt-out**, 주민번호·여권·계좌 등 민감 식별자 입력 금지
- 대화 삭제가 **완전 삭제를 보장하지 않음**(백업·보관 기간)
- 데이터가 **국외에 저장·처리**될 수 있음 → 이전 국가·항목·목적 확인
- 기업 데이터는 **엔터프라이즈 라이선스 + 내부 이용규칙**으로 관리 권고
- 플러그인/연동 서비스에 넘어간 데이터는 연결 해제 후에도 남을 수 있음 → 최소 권한만 부여

- 참고: [개인정보보호위원회](https://www.pipc.go.kr)

### 금융보안원 · KISA · 과기정통부
- **금융보안원(FSI)**: 금융권 생성형 AI 보안·활용 가이드, 침투테스트 가이드 등 금융 특화 기준 발간
- **KISA**: AI 보안 가이드라인 및 위협 대응 연구 공개
- **과기정통부**: AI 윤리기준·신뢰성 확보 정책 추진

## IV. 기준 매핑 — 무엇을 볼 것인가

| 목적 | 1순위 참조 | 성격 |
|---|---|---|
| 위협 점검 체크리스트 | OWASP LLM Top 10, MITRE ATLAS | 기술·위협 |
| 리스크 관리 체계 수립 | NIST AI RMF, ISO/IEC 42001·23894 | 거버넌스 |
| 안전 개발 수명주기 | CISA/NCSC 가이드, Google SAIF | 개발·운영 |
| 규제 준수 (해외) | EU AI Act | 법규(역외 적용) |
| 규제 준수 (국내) | AI 기본법, 개인정보보호법, 개인정보위 가이드 | 법규 |
| 금융권 | 금융보안원 가이드 | 산업 특화 |

## V. 결론
표준은 "선택"이 아니라 **조합**입니다. 보통 **리스크 관리 체계(NIST·ISO)** 위에 **위협 체크리스트(OWASP·ATLAS)** 를 얹고, 적용되는 **법규(AI 기본법·개인정보보호법·EU AI Act)** 를 준수 기준으로 매핑하는 방식으로 평가를 설계합니다.
