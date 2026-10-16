---
title: garak
sidebar_label: garak
sidebar_position: 6
description: LLM 자체의 취약점을 점검하는 오픈소스 스캐너 garak을 도구 관점에서 분석한다
---

# garak

## 한눈에

| 항목 | 내용 |
|---|---|
| 특화 | <span className="badge badge--tag">LLM 보안</span> LLM/AI 시스템 취약점 스캔 |
| 분류 | <span className="badge badge--blue">방어</span> (AI 레드팀) |
| 제공자 | NVIDIA (+ 커뮤니티) |
| 라이선스 | 오픈소스 |
| 가격 | <span className="badge badge--green">무료·오픈소스</span> |
| 대상 | <span className="badge badge--gray">보안 전문가 · AI 개발자</span> |
| 데이터 처리 | <span className="badge badge--gray">선택 가능</span> 점검 대상 모델에 따라 다름 |

## 개요

garak은 **LLM 자체의 보안 약점을 점검하는 취약점 스캐너**다.
수십 종의 플러그인과 수천 개의 프롬프트로, 프롬프트 인젝션·유해 출력·데이터 유출 같은 LLM 특유의 약점을 자동으로 테스트한다.

앞의 도구들이 "AI로 (일반) 시스템을 점검"한다면, garak은 **점검 대상이 AI(LLM) 자체**라는 점이 다르다. 자사 LLM 서비스의 안전성을 평가하는 **AI 레드팀** 용도에 쓰인다.

## 데이터 처리 관점

garak은 대상 LLM에 테스트 프롬프트를 보내 반응을 평가한다.
대상이 **클라우드 LLM이면 외부 전송**, **로컬에 띄운 모델이면 로컬 처리**가 되므로, 점검 대상 설정에 따라 데이터 흐름이 달라진다. <span className="badge badge--gray">선택 가능</span>

## 가용성

- NVIDIA가 주도하는 오픈소스, PyPI로 설치 가능한 CLI 도구
- 활발히 업데이트됨

## 참고 자료

- garak 공식 사이트 / GitHub (NVIDIA)
