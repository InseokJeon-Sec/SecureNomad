---
title: MITRE ATLAS 상세 (실무)
sidebar_label: 09. MITRE ATLAS
sidebar_position: 9
description: AI 시스템 대상 공격 지식베이스 MITRE ATLAS의 구조(전술·기법·완화·사례연구), ATT&CK과의 관계, 실무 활용을 정리
tags: [AI보안, MITRE, ATLAS, 위협모델]
---

# MITRE ATLAS 상세 (실무)

**MITRE ATLAS**(Adversarial Threat Landscape for Artificial-Intelligence Systems)는 AI·ML 시스템을 겨냥한 공격을 **MITRE ATT&CK 방식의 전술·기법 매트릭스**로 정리한 지식베이스다. [OWASP LLM Top 10](./08-owasp-llm-top10.md)이 "앱 보안 위험 체크리스트"라면, ATLAS는 **"공격자가 실제로 어떻게 움직이는가"를 전술 단계로 정리한 공격 지식베이스**다. 실제 관측·연구 사례에 기반한다.

- 원본: [MITRE ATLAS](https://atlas.mitre.org/)

## ATT&CK과의 관계

- 구조·용어·매트릭스 방식이 ATT&CK과 동일해, ATT&CK에 익숙하면 바로 적용할 수 있다.
- 대부분의 전술(정찰·초기접근·실행·탈취 등)을 ATT&CK에서 상속하되 **AI·ML 맥락**으로 재해석한다.
- AI 고유 전술 두 개를 추가한다: **ML Model Access**(모델 접근)와 **ML Attack Staging**(공격 준비·적대적 예제 제작 등).
- 권장 사용법: 전통 인프라는 ATT&CK, AI 특화 경로는 ATLAS를 함께 쓴다.

## 구조

| 요소 | 설명 |
|---|---|
| **전술(Tactic)** | 공격 단계별 목표 ("왜"). ID 예: `AML.TA0004` |
| **기법(Technique)** | 목표 달성 수단 ("어떻게"). ID 예: `AML.T0051` |
| **하위 기법(Sub-technique)** | 기법의 변형 (예: 프롬프트 인젝션의 직접/간접) |
| **완화책(Mitigation)** | 특정 기법에 대응하는 방어 수단 |
| **사례 연구(Case Study)** | 전술·기법에 매핑된 실제 공격 사례 |

> 전술·기법·완화·사례 수는 버전마다 늘어난다(2025.11 v5.1.0에서 **Command and Control** 전술 추가로 16개 전술). 정확한 ID·개수는 항상 공식 사이트를 기준으로 한다. ATLAS 데이터는 STIX 2.1로도 제공된다.

## 전술 흐름 (16개)

```text
정찰(Reconnaissance) → 자원 개발(Resource Development) → 초기 접근(Initial Access)
→ [AI] ML Model Access → 실행(Execution) → 지속(Persistence) → 권한 상승(Privilege Escalation)
→ 방어 회피(Defense Evasion) → 자격증명 접근(Credential Access) → 탐색(Discovery)
→ 수집(Collection) → [AI] ML Attack Staging → 탈취(Exfiltration) → 영향(Impact)
→ 명령·제어(Command and Control)
```

- **[AI]** 표시가 AI 고유 전술(ML Model Access, ML Attack Staging)이다.
- 나머지는 ATT&CK에서 상속하되 AI 맥락으로 적용된다.

## 대표 기법 (예시)

실제 ID·명칭은 버전에 따라 바뀌므로 아래는 "성격 파악용" 예시다.

| 전술 | 기법 예 |
|---|---|
| ML Model Access | 추론 API 접근, 모델 복제를 위한 질의 |
| ML Attack Staging | 적대적 예제(Adversarial Example) 제작, 대리 모델 학습 |
| Initial Access | **프롬프트 인젝션**(`AML.T0051`, 직접/간접) |
| Exfiltration | 모델 추출(Model Extraction), 학습 데이터 추출 |
| Impact | 모델 무력화·오작동, 서비스 거부 |

## 생성형 AI·에이전트로의 확장

최근 ATLAS는 LLM·에이전트 공격 표면을 빠르게 반영하고 있다(예시):

- **프롬프트 인젝션**(직접/간접) — 초기 접근
- **RAG 데이터베이스 검색/오염** — 수집·포이즈닝
- **AI 에이전트 도구 악용·오염된 도구 배포** — 실행·지속
- **AI 에이전트 설정에서 자격증명 탈취**, **에이전트 컨텍스트 포이즈닝**
- **MCP 서버 침해** 사례 연구 — [MCP](/ai/advanced/agents-mcp) 인프라 대상

이 항목들은 [OWASP LLM Top 10](./08-owasp-llm-top10.md)의 LLM01(인젝션)·LLM06(과도한 권한)·LLM08(벡터·임베딩)과 직접 대응된다.

## ATLAS vs OWASP LLM Top 10

| 구분 | MITRE ATLAS | OWASP LLM Top 10 |
|---|---|---|
| 성격 | 공격 전술·기법 지식베이스(ATT&CK형) | 앱 위험 체크리스트 |
| 관점 | 공격자 행동 흐름(단계별) | 방어 점검 항목 |
| 쓰임 | 위협 모델링·레드팀·탐지 매핑·사례 학습 | 평가 체크리스트·대응 설계 |
| 상호관계 | 공격 경로를 단계로 | 그 경로에서 점검할 항목을 |

둘은 경쟁이 아니라 **공격 흐름(ATLAS) ↔ 방어 점검(OWASP)** 으로 상호보완한다.

## 실무 활용

- **위협 모델링**: AI 시스템의 공격 경로를 전술 단계로 도출. 어느 단계가 노출됐는지 점검.
- **레드팀 계획**: 전술·기법을 시나리오 설계의 공통 언어로 사용(승인된 범위 내).
- **탐지·대응 매핑**: 기법별 완화책·탐지 포인트를 SOC 탐지 규칙과 연결.
- **사례 학습**: 사례 연구로 실제 공격의 전개 방식을 이해.
- **평가 연계**: [04. 평가 방법론](./assessment-method.md)의 위협 모델링 단계에서 ATLAS를 참조하면 "실제 공격 시나리오" 축이 보강된다.

## 요약
- ATLAS = AI 공격의 **ATT&CK**. 전술(목표) × 기법(수단) 매트릭스 + 완화 + 실제 사례.
- ATT&CK 상속 + AI 고유 전술(ML Model Access, ML Attack Staging) + 빠르게 느는 LLM·에이전트 기법.
- OWASP LLM Top 10과 짝으로: **공격 흐름은 ATLAS, 방어 점검은 OWASP.**
