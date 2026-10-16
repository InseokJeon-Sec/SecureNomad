---
title: Vulnhuntr
sidebar_label: Vulnhuntr
sidebar_position: 4
description: LLM과 정적 분석으로 코드 취약점을 찾는 Vulnhuntr를 도구 관점에서 분석한다
---

# Vulnhuntr

## 한눈에

| 항목 | 내용 |
|---|---|
| 특화 | <span className="badge badge--tag">코드 취약점 탐지</span> LLM + 정적 분석 |
| 분류 | <span className="badge badge--purple">분석</span> |
| 제공자 | Protect AI |
| 라이선스 | AGPL-3.0 (오픈소스) |
| 가격 | <span className="badge badge--green">무료·오픈소스</span> — 단, LLM API 사용료 발생(비용 주의 명시) |
| 대상 | <span className="badge badge--gray">보안 전문가</span> |
| 데이터 처리 | <span className="badge badge--gray">선택 가능</span> 기본 클라우드 LLM(Claude/GPT), Ollama는 실험적 |

## 개요

Vulnhuntr는 **LLM과 정적 코드 분석을 결합해 원격 악용 가능한 취약점을 찾는 도구**다.
사용자 입력부터 서버 출력까지 호출 흐름(call chain)을 추적해, LFI·RCE·XSS·SQLi·SSRF·IDOR 같은 다단계 취약점을 탐지한다.
공개 당시 Python 오픈소스 프로젝트에서 실제 제로데이를 발견해 주목받았다.

**현재 Python 코드베이스만 지원**한다.

## 데이터 처리 관점

기본 동작은 **클라우드 LLM(Claude 기본, GPT 예시)에 코드를 전송**하는 방식이다. <span className="badge badge--amber">클라우드</span>
코드가 외부로 나가므로, 민감한 사내 코드에 적용할 때는 데이터 전송 범위를 반드시 검토해야 한다. 로컬(Ollama)은 실험적 단계로 안내된다.

## 가용성

- GitHub 공개(AGPL-3.0), Protect AI 제공
- Python 3.10 요구

## 참고 자료

- GitHub: protectai/vulnhuntr
- Protect AI 블로그
