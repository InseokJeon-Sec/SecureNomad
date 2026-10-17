---
title: 표준·프레임워크 상세와 관계도
sidebar_label: 07. 표준 상세·관계도
sidebar_position: 7
description: NIST AI RMF, ISO/IEC 42001·23894, OWASP LLM Top 10, MITRE ATLAS, EU AI Act, 국내 AI 기본법 등 AI 보안 표준을 상세히 정리하고 서로의 관계를 설명하는 학습 문서
tags: [AI보안, 표준, NIST, ISO, 가이드라인]
---

# 표준·프레임워크 상세와 관계도

[02. 국내외 가이드라인](./guidelines.md)이 "목록과 요약"이라면, 이 문서는 **각 표준을 상세히 파고, 서로 어떻게 엮이는지**를 공부하기 위한 자료다.

:::tip 먼저 알아둘 것 — "단일 메인은 없다"
AI 보안·거버넌스에는 모든 걸 지배하는 하나의 표준이 없다. 역할이 다른 것들이 **층층이** 쌓인다. "무엇이 메인이냐"는 **어느 층을 말하느냐**에 따라 달라진다.
:::

## I. 관계도 — 표준들은 어떻게 엮이나

### 층위 지도

| 층 | 역할 | 대표 | 성격 |
|---|---|---|---|
| **법·규제** | 반드시 지켜야 하는 것 | EU AI Act · (국내) AI 기본법 · 개인정보보호법 | 강제 |
| **인증** | 제3자가 보증하는 체계 | ISO/IEC 42001 | 자발(인증 가능) |
| **거버넌스 프레임워크** | 리스크 관리의 뼈대·공통 언어 | NIST AI RMF | 자발 |
| **리스크 방법론** | 리스크를 식별·평가하는 방법 | ISO/IEC 23894 | 가이드(인증 불가) |
| **안전 개발** | 개발 수명주기 보안 원칙 | Google SAIF · CISA/NCSC 가이드 | 가이드 |
| **위협 체크리스트** | 실제 점검 항목 | OWASP LLM Top 10 · MITRE ATLAS | 가이드(핸즈온) |

### 실무에서 엮는 순서

```text
[틀 잡기]      NIST AI RMF 로 거버넌스·리스크 뼈대 구성
   │
   ├─[방법 채우기]  ISO/IEC 23894 로 리스크 식별·평가 방법 보강
   │
   ├─[점검하기]    OWASP LLM Top 10 · MITRE ATLAS 로 실제 취약점 평가
   │
   ├─[인증받기]    요구되면 ISO/IEC 42001 인증 취득
   │
   └─[준수하기]    EU AI Act · AI 기본법 · 개인정보보호법에 매핑(강제)
```

### 크로스워크(상호 매핑)
표준들은 서로 번역된다. NIST는 **AI RMF ↔ ISO/IEC 23894 크로스워크**를 공식 제공하고, ISO 42001을 준비할 때 NIST RMF 언어로 정리한 자료를 그대로 매핑하는 식으로 쓴다. 즉 **하나를 제대로 알면 나머지로 옮겨 쓰기 쉽다.**

:::info 한 줄 요약
- **직접 점검할 때** 가장 많이 쓰는 것 → OWASP LLM Top 10
- **거버넌스 틀**로 가장 많이 참조 → NIST AI RMF
- **반드시 지켜야 하는 것** → 법(국내는 AI 기본법·개인정보보호법)
- **인증으로 증명** → ISO/IEC 42001
:::

---

## II. 거버넌스·리스크 프레임워크

### NIST AI RMF (AI 100-1)
- **주체·연도**: 미국 NIST, 2023년 1월. **무료·자발적**, 범용.
- **구조 — 4개 기능**: `GOVERN`(토대: 문화·정책·역할) 이 나머지를 감싸고, 그 안에서 `MAP`(맥락·리스크 식별) → `MEASURE`(측정·테스트) → `MANAGE`(대응)를 반복.
- **신뢰할 수 있는 AI 7특성**: 유효·신뢰 / 안전 / 보안·복원력 / 책임·투명 / 설명·해석가능 / 프라이버시 강화 / 공정(편향 관리).
- **생성형 AI 특화판 — GenAI Profile(AI 600-1, 2024.7)**: 생성형 AI 고유 리스크 약 12종(환각, 정보 무결성, 데이터 프라이버시, 사이버보안, CBRN 정보, 유해 편향, 지식재산 등)에 4기능별 권장 조치 200여 개를 매핑. **LLM을 다룬다면 본체보다 이 Profile이 더 실질적.**
- **성격**: 강제력 없음. "무엇을"은 주지만 "어떻게"는 조직이 채워야 함.
- **원본**: [NIST AI RMF (공식)](https://www.nist.gov/itl/ai-risk-management-framework) · [GenAI Profile 발간물](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) — PDF 무료 다운로드

### ISO/IEC 23894 — AI 리스크 관리 (가이드)
- **주체·연도**: ISO/IEC, 2023년. **인증 불가**한 **가이드** 문서.
- **내용**: 범용 리스크 관리 표준 **ISO 31000을 AI 맥락으로 확장**. 편향·모델 드리프트·설명가능성·사회적 영향 같은 AI 특유 리스크의 식별·평가·처리 방법을 제시.
- **실무 위치**: ISO 42001이 요구하는 "리스크 프로세스"를 채우는 **방법론**. 단, 현장에서 직접 "23894를 구현한다"는 경우는 드물고, 같은 역할을 **NIST AI RMF가 더 많이 가져간다**. 보조·참고로 보는 게 정확.
- **원본**: [ISO/IEC 23894:2023 (카탈로그)](https://www.iso.org/standard/77304.html) — **유료·저작권 문서(첨부 불가)**

---

## III. 경영시스템·인증

### ISO/IEC 42001 — AI 경영시스템(AIMS)
- **주체·연도**: ISO/IEC, 2023년 12월. **인증 가능한** 유일한 AI 표준.
- **구조**: ISO 27001과 같은 **PDCA(계획-실행-점검-개선)** 경영시스템 틀 + **Annex A 통제 항목**(AI 정책, 자원, 영향평가, 데이터·모델 수명주기 등).
- **위치**: ISO 27001이 정보보안에 대해 하는 역할을 AI에 대해 한다. 조직 수준 거버넌스를 **감사·인증**으로 증명.
- **채택 현황(객관적)**: 2023년 말 제정이라 **아직 초기**. 인증 기업 수가 많지 않고(미국 첫 인증이 2025년 중반), ISO 27001처럼 보편화되지 않았다. 법적 의무도 아니다. 채택 동인은 규제보다 **고객·조달의 신뢰 요구**. 비유하면 **15~20년 전의 ISO 27001 위치** — "받으면 차별화되는 것"이지 "다들 갖춘 것"은 아직 아니다.
- **원본**: [ISO/IEC 42001:2023 (카탈로그)](https://www.iso.org/standard/81230.html) — **유료·저작권 문서(첨부 불가)**

---

## IV. 위협·보안 체크리스트 (핸즈온)

### OWASP Top 10 for LLM Applications (2025)
- **주체**: OWASP Gen AI Security Project. **무료, 개방 라이선스**.
- **내용**: LLM 애플리케이션 대표 위험 10종(LLM01 프롬프트 인젝션 ~ LLM10 무제한 소비). 상세는 [03. 위협 모델](./threats.md).
- **위치**: **실제 보안성 평가에서 가장 손이 많이 가는** 체크리스트. 추상적 프레임워크와 달리 바로 점검 항목이 됨.
- **원본**: [OWASP LLM Top 10 (공식)](https://genai.owasp.org/llm-top-10/) — PDF 무료 다운로드

### MITRE ATLAS
- **주체**: MITRE. 무료.
- **내용**: AI 시스템 대상 공격 전술·기법을 ATT&CK 방식 매트릭스로 정리(실제 사례 기반).
- **위치**: 위협 모델링·레드팀 시 "실제 공격 시나리오" 참조.
- **원본**: [MITRE ATLAS (공식)](https://atlas.mitre.org/)

---

## V. 안전 개발 프레임워크

### Google SAIF (Secure AI Framework)
- AI 시스템 보안 6대 요소를 제시하는 실무 프레임워크. 거버넌스·탐지·대응 관점.
- **원본**: [Google SAIF (공식)](https://saif.google/)

### CISA · NCSC 「Guidelines for Secure AI System Development」
- 미국 CISA·영국 NCSC 공동. 설계–개발–배포–운영 전 수명주기 보안 원칙.
- **원본**: [CISA 가이드 (공식)](https://www.cisa.gov/resources-tools/resources/guidelines-secure-ai-system-development)

---

## VI. 법·규제 (강제)

### EU AI Act
- **주체·성격**: EU, 세계 최초 포괄 AI 법. 위험도별(금지/고위험/제한적/최소) 규제. **역외 적용**(EU 대상 서비스면 국내 기업도 영향).
- **일정(2025~2026)**: 2025-02 금지 관행 → 2025-08 범용 AI(GPAI) 의무 → 2026-08 일반 적용(§50 투명성) → 2026-12 생성물 워터마크 등. (AI Omnibus로 고위험 일정 일부 조정)
- **원본**: [EU AI Act 포털](https://artificialintelligenceact.eu/) · [공식 법령 EUR-Lex (Regulation (EU) 2024/1689)](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)

### 국내 — 인공지능 기본법(AI 기본법)
- **정식 명칭**: 「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」. **2026년 1월 22일 시행**.
- **핵심**: 고영향 AI 안전조치 의무, 생성물 표시(워터마크), 해외 사업자 국내 대리인. 규제 대상은 개발·서비스 제공 사업자(일반 이용자 아님), 1년 이상 계도기간.
- **원본**: [국가법령정보센터 (law.go.kr)](https://www.law.go.kr) — 법령명으로 검색

### 국내 — 개인정보보호법 + 개인정보위 가이드
- 개인정보 처리의 법적 근거. 개인정보위가 **생성형 AI 개인정보 보호 가이드(2026.5.19)** 공개 — 학습 활용·삭제·국외 이전 등 8대 쟁점.
- **원본**: [개인정보보호위원회 (pipc.go.kr)](https://www.pipc.go.kr)

---

## VII. 원본 자료 모음

| 표준 | 성격 | 무료 | 원본 |
|---|---|---|---|
| NIST AI RMF (100-1) | 프레임워크 | ✅ | [링크](https://www.nist.gov/itl/ai-risk-management-framework) |
| NIST GenAI Profile (600-1) | 프레임워크 | ✅ | [링크](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) |
| ISO/IEC 42001 | 인증 | ❌ 유료 | [카탈로그](https://www.iso.org/standard/81230.html) |
| ISO/IEC 23894 | 가이드 | ❌ 유료 | [카탈로그](https://www.iso.org/standard/77304.html) |
| OWASP LLM Top 10 | 체크리스트 | ✅ | [링크](https://genai.owasp.org/llm-top-10/) |
| MITRE ATLAS | 체크리스트 | ✅ | [링크](https://atlas.mitre.org/) |
| Google SAIF | 안전개발 | ✅ | [링크](https://saif.google/) |
| CISA/NCSC 가이드 | 안전개발 | ✅ | [링크](https://www.cisa.gov/resources-tools/resources/guidelines-secure-ai-system-development) |
| EU AI Act | 법 | ✅ | [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) |
| AI 기본법 | 법(국내) | ✅ | [law.go.kr](https://www.law.go.kr) |
| 개인정보보호법·가이드 | 법(국내) | ✅ | [pipc.go.kr](https://www.pipc.go.kr) |

:::caution ISO 문서 저작권 안내
ISO/IEC 42001·23894는 **유료 저작권 문서**다. 공식 구매(카탈로그) 링크만 제공하며, 원문 PDF를 이 사이트에 첨부·재배포할 수 없다. 나머지(NIST·OWASP·EU·국내법)는 공식적으로 무료 공개되어 위 링크에서 원문을 받을 수 있다.
:::

## VIII. 결론

- **하나의 메인은 없다.** 법(강제) · 인증(ISO 42001) · 프레임워크(NIST) · 체크리스트(OWASP)가 역할을 나눠 쌓인다.
- 실무 깊이 우선순위: **NIST AI RMF(틀) + OWASP LLM Top 10(점검) + 국내법(강제)** 세 조합을 먼저, ISO 42001은 인증이 필요할 때, ISO 23894는 참고.
- 표준들은 서로 크로스워크로 번역되므로, **틀 하나(NIST)를 제대로 익히면** 나머지로 확장하기 쉽다.
