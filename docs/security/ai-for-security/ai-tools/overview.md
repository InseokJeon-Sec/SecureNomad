---
title: AI 보안 도구 비교
sidebar_label: 비교표
sidebar_position: 0
description: 보안 분야에서 쓰이는 AI 도구를 용도·제공자·가격·대상·데이터 처리 기준으로 정리하고 비교하는 레퍼런스
---

# AI 보안 도구 비교

보안 분야에서 쓰이는 AI 도구를 **용도 · 제공자 · 가격 · 대상 · 데이터 처리** 기준으로 정리한다.
도구를 직관적으로 비교하고 참고하기 위한 레퍼런스이며, 사용 방법이 아니라 **도구 자체를 분석**하는 데 목적이 있다.

## 지표 범례

| 지표 | 값 |
|---|---|
| **분류** | <span className="badge badge--blue">방어</span> <span className="badge badge--red">공격·진단</span> <span className="badge badge--purple">분석</span> |
| **가격** | <span className="badge badge--green">무료·오픈소스</span> <span className="badge badge--amber">프리미엄</span> <span className="badge badge--red">유료</span> |
| **대상** | <span className="badge badge--blue">일반 사용자</span> <span className="badge badge--gray">전문가·기업</span> |
| **데이터 처리** | <span className="badge badge--green">로컬</span> <span className="badge badge--amber">클라우드</span> <span className="badge badge--gray">선택 가능</span> |

:::info 데이터 처리 축이 왜 중요한가
AI 도구에 로그·코드·문서를 입력하면 그 데이터가 **외부(제공자 서버)로 전송되는지**가 보안 담당자의 핵심 판단 기준이다.
<span className="badge badge--amber">클라우드</span> 는 입력 데이터가 외부로 나가는 구조, <span className="badge badge--green">로컬</span> 은 내 환경 안에서만 처리, <span className="badge badge--gray">선택 가능</span> 은 설정·백엔드에 따라 달라지는 경우를 뜻한다.
:::

## 비교표

| 도구 | 분류 | 제공자 | 가격 | 대상 | 데이터 처리 |
|---|---|---|---|---|---|
| [ARTEX](./artex.md) | <span className="badge badge--red">자동 침투테스트</span> | Autumn-27 (OSS) | <span className="badge badge--green">오픈소스</span> → 비공개 | <span className="badge badge--gray">전문가</span> | <span className="badge badge--gray">선택 가능</span> |

> 도구는 하나씩 추가해 나간다. 각 도구 이름을 클릭하면 상세 분석으로 이동한다.

:::caution
<span className="badge badge--red">공격·진단</span> 분류의 도구는 **반드시 허가된 환경에서만** 사용해야 한다.
이 문서는 도구를 파악하기 위한 분석이며, 구하는 법·설치·공격 수행법은 다루지 않는다.
→ [실습 원칙과 범위](../ai-pentest/00-approach-and-ethics.md)
:::
