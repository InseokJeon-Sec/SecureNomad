---
title: AI 보안 도구 비교
sidebar_label: 비교표
sidebar_position: 0
description: 보안 분야에서 쓰이는 AI 도구를 특화·분류·제공자·가격·대상·데이터 처리 기준으로 정리하고 비교하는 레퍼런스
---

# AI 보안 도구 비교

보안 분야에서 쓰이는 **AI 기반·AI 활용 도구**를 정리한다.
도구마다 **무엇에 특화됐는지**(취약점 스캔 / 모의해킹 / 코드 분석 등)와 함께, 제공자·가격·데이터 처리를 한눈에 비교할 수 있게 하는 데 목적이 있다.
사용 방법이 아니라 **도구 자체를 분석**한다.

## 지표 범례

| 지표 | 값 |
|---|---|
| **특화** | <span className="badge badge--tag">자동 침투테스트</span> <span className="badge badge--tag">모의해킹 보조</span> <span className="badge badge--tag">코드 취약점 탐지</span> <span className="badge badge--tag">코드 보안(SAST)</span> <span className="badge badge--tag">LLM 보안</span> <span className="badge badge--tag">SOC·사고대응</span> |
| **분류** | <span className="badge badge--blue">방어</span> <span className="badge badge--red">공격·진단</span> <span className="badge badge--purple">분석</span> |
| **가격** | <span className="badge badge--green">무료·오픈소스</span> <span className="badge badge--amber">프리미엄</span> <span className="badge badge--red">유료</span> |
| **대상** | <span className="badge badge--blue">일반 사용자</span> <span className="badge badge--gray">전문가·기업</span> |
| **데이터 처리** | <span className="badge badge--green">로컬</span> <span className="badge badge--amber">클라우드</span> <span className="badge badge--gray">선택 가능</span> |

:::info 데이터 처리 축이 왜 중요한가
AI 도구에 코드·로그·대상 정보를 입력하면 그 데이터가 **외부(LLM 제공자 서버)로 전송되는지**가 보안 담당자의 핵심 판단 기준이다.
<span className="badge badge--amber">클라우드</span> 는 외부로 전송, <span className="badge badge--green">로컬</span> 은 내 환경 안에서만 처리, <span className="badge badge--gray">선택 가능</span> 은 연결하는 LLM 백엔드에 따라 달라지는 경우다.
:::

## 비교표

| 도구 | 특화 | 분류 | 제공자 | 가격 | 대상 | 데이터 |
|---|---|---|---|---|---|---|
| [ARTEX](./artex.md) | <span className="badge badge--tag">자동 침투테스트</span> | <span className="badge badge--red">공격·진단</span> | Autumn-27 (OSS) | <span className="badge badge--green">오픈소스</span>→비공개 | <span className="badge badge--gray">전문가</span> | <span className="badge badge--gray">선택</span> |
| [PentestGPT](./pentestgpt.md) | <span className="badge badge--tag">모의해킹 보조</span> | <span className="badge badge--red">공격·진단</span> | GreyDGL (NTU, OSS) | <span className="badge badge--green">무료·오픈소스</span> | <span className="badge badge--gray">전문가</span> | <span className="badge badge--gray">선택</span> |
| [XBOW](./xbow.md) | <span className="badge badge--tag">자동 침투테스트</span> | <span className="badge badge--red">공격·진단</span> | XBOW (상용) | <span className="badge badge--red">유료</span> | <span className="badge badge--gray">기업</span> | <span className="badge badge--amber">클라우드</span> |
| [Vulnhuntr](./vulnhuntr.md) | <span className="badge badge--tag">코드 취약점 탐지</span> | <span className="badge badge--purple">분석</span> | Protect AI (OSS) | <span className="badge badge--green">무료·오픈소스</span> | <span className="badge badge--gray">전문가</span> | <span className="badge badge--gray">선택</span> |
| [Snyk](./snyk.md) | <span className="badge badge--tag">코드 보안(SAST)</span> | <span className="badge badge--blue">방어</span> | Snyk | <span className="badge badge--amber">프리미엄</span> | <span className="badge badge--blue">일반(개발자)</span> | <span className="badge badge--amber">클라우드</span> |
| [garak](./garak.md) | <span className="badge badge--tag">LLM 보안</span> | <span className="badge badge--blue">방어</span> | NVIDIA (OSS) | <span className="badge badge--green">무료·오픈소스</span> | <span className="badge badge--gray">전문가</span> | <span className="badge badge--gray">선택</span> |
| [Microsoft Security Copilot](./security-copilot.md) | <span className="badge badge--tag">SOC·사고대응</span> | <span className="badge badge--blue">방어</span> | Microsoft | <span className="badge badge--red">유료</span> | <span className="badge badge--gray">기업</span> | <span className="badge badge--amber">클라우드</span> |

> 도구 이름을 클릭하면 상세 분석으로 이동한다. 도구는 계속 추가해 나간다.
> 가격·제공 조건은 바뀔 수 있으니, 도입 전 공식 사이트에서 최신 정보를 확인한다.

:::caution
<span className="badge badge--red">공격·진단</span> 분류의 도구는 **반드시 허가된 환경에서만** 사용해야 한다.
이 문서는 도구를 파악하기 위한 분석이며, 구하는 법·설치·공격 수행법은 다루지 않는다.
→ [실습 원칙과 범위](../../../lab/ai-pentest/00-approach-and-ethics.md)
:::
