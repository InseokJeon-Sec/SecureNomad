---
title: 00. 시험 개요와 공부 전략
sidebar_label: 00. 시험 개요
sidebar_position: 1
description: AWS Certified AI Practitioner (AIF-C01) 시험 형식, 도메인 비중, 공부 로드맵
---

# AWS Certified AI Practitioner (AIF-C01) 개요

AWS의 **입문(Foundational) 등급 AI 자격증**이다. 코드를 짜게 하기보다, **AI/ML·생성형 AI의 개념과 AWS 서비스의 용도, 그리고 책임 있는·안전한 사용**을 이해하는지를 묻는다. SAA-C03처럼 "요구사항 → 적합한 서비스/개념"을 연결하는 힘이 핵심이다.

## 시험 정보 (한눈에)

- **정식 명칭**: AWS Certified AI Practitioner
- **시험 코드**: AIF-C01
- **문항 수**: 65문항(채점 50 + 비채점 15, 구분 표시 없음)
- **시험 시간**: 90분
- **합격 점수**: 700 / 1000 (scaled, 보상형 — 도메인별 과락 없음)
- **응시료**: USD 100
- **형태**: 객관식(단일/복수 정답)
- **유효 기간**: 3년

## 도메인 비중

| 도메인 | 주제 | 비중 |
| --- | --- | --- |
| Domain 1 | AI와 ML의 기초 | 20% |
| Domain 2 | 생성형 AI의 기초 | 24% |
| Domain 3 | 파운데이션 모델의 활용 | 28% |
| Domain 4 | 책임 있는 AI 가이드라인 | 14% |
| Domain 5 | AI 솔루션의 보안·규정 준수·거버넌스 | 14% |

> Domain 2+3(생성형 AI + FM 활용)이 **52%** 로 사실상 절반이다. 생성형 AI를 중심에 두고 공부한다.

## 공부 로드맵

1. **개념·용어**를 먼저 잡는다(AI/ML/딥러닝/생성형 AI의 관계, 지도·비지도·강화 학습).
2. **AWS AI 서비스 지도**를 "무엇을 하는가"로 외운다(Bedrock·SageMaker·Q·Rekognition 등).
3. 생성형 AI의 **프롬프트·RAG·파인튜닝·평가**와 **책임 있는 AI**를 시나리오로 연결.
4. 연습문제로 자가 점검 → 약한 도메인 반복.

## 전체 항목 지도

- [Domain 1 — AI와 ML의 기초](./domain1-ai-ml)
- [Domain 2 — 생성형 AI의 기초](./domain2-genai)
- [Domain 3 — 파운데이션 모델의 활용](./domain3-foundation-models)
- [Domain 4 — 책임 있는 AI](./domain4-responsible-ai)
- [Domain 5 — 보안·규정 준수·거버넌스](./domain5-security-governance)

:::tip 참고
이 트랙은 유튜브 'AI 바로 알기' 시리즈와 개념이 많이 겹친다(토큰·프롬프트·RAG·파인튜닝·멀티모달·환각 등). 영상으로 개념을 잡고 이 문서로 AWS 서비스 매핑을 더하면 효율적이다.
:::
