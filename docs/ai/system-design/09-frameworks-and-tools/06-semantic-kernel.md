---
title: Semantic Kernel
sidebar_position: 6
description: Microsoft의 엔터프라이즈급 AI 오케스트레이션 엔진 Semantic Kernel과 후속 Microsoft Agent Framework — 엔터프라이즈 DNA, 플러그인·함수 호출, 메모리·커넥터, 다중 언어 지원.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/09-frameworks-and-tools/06-semantic-kernel.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·버전은 원문 표기를 유지합니다.
:::

# Semantic Kernel

**Semantic Kernel(SK)**은 Microsoft의 엔터프라이즈급 AI 오케스트레이션 엔진이자 기존 **Azure/Microsoft**·**C#/.NET** AI 코드 대부분이 작성된 프레임워크다. 전진 모멘텀이 같은 팀이 만든 AutoGen·SK의 후속 **Microsoft Agent Framework(MAF)**로 이동했다. MAF 1.0이 2026-04-02 .NET·Python에 장기 지원과 GA, 대략 주 단위 배송(Python 1.19.0 9/18, .NET 1.23.0 2026-10-01). SK는 여전히 배송(`semantic-kernel` 1.44.1, 2026-08-06)되고 Microsoft가 SK→MAF 마이그레이션 가이드 발행.

**실무 규칙**: 기존 SK 코드 유지, 새 에이전트 작업은 MAF서 시작. 아래 개념(커널 함수·플러그인·커넥터·함수 호출)이 곧바로 넘어감.

---

## 엔터프라이즈 DNA

LangChain이 스타트업에 선호된다면, Semantic Kernel은 **은행·Fortune 500**에 선호됨.
- **의존성 주입**: SK가 표준 엔터프라이즈 설계 패턴 따름.
- **강한 타이핑**: C# 타입 일급 지원이 대규모 미션 크리티컬 시스템서 매우 신뢰 가능.
- **보안**: Azure Active Directory(Microsoft Entra ID)·Managed Identities 깊은 통합.

---

## 플러그인과 함수 호출

1. **커널 함수**: 로직의 기본 단위(네이티브 코드나 LLM 프롬프트).
2. **플러그인**: 함수 모음(예: "GitHub 플러그인"·"SQL 플러그인").
3. **계획이 네이티브 함수 호출**: Stepwise·Handlebars 플래너가 SK의 Python·.NET·Java서 **폐기·제거**(Microsoft Learn, 2026-05-26 갱신). 자동 함수 호출(`FunctionChoiceBehavior.Auto()`)이 계획 메커니즘: 모델이 다음 함수 고르고, 커널이 호출, 루프 반복. Microsoft가 Stepwise Planner 마이그레이션 가이드 발행.

이것이 프레임워크 변동 스토리의 축소판. 프롬프트 기반 플래너가 초기 모델이 도구를 신뢰 호출 못 해 존재; 네이티브 도구 호출 도착하자 추상화가 오버헤드 되고 삭제됨. 장기 다일 프로세스는 플래너가 아니라 체크포인팅의 MAF 워크플로에 속함.

---

## 메모리와 커넥터

Semantic Kernel이 **커넥터**로 바탕 인프라 추상화.
- **범용 커넥터**: Azure OpenAI·OpenAI·Mistral·로컬 ONNX 모델에 한 인터페이스.
- **벡터 스토어 추상화**: 코어 비즈니스 로직 안 바꾸고 Azure AI Search·Pinecone·Qdrant 전환. .NET서 MAF가 같은 `Microsoft.Extensions.AI` 챗 클라이언트 추상화 위에 구축, 마이그레이션 단축.

---

## 다중 언어 지원

SK는 C#·Python을 동등 취급하는 몇 안 되는 주요 프레임워크(Java도 지원, 작은 표면). MAF가 .NET·Python에 그 약속 유지하고 Go를 퍼블릭 프리뷰로 추가.
- **패턴**: Python서 개발·프로토타입; 성능·타입 안전 위해 C#로 코어 오케스트레이션 배포.
- **로직 공유**: 양 언어 걸쳐 작동하는 공유 프롬프트 템플릿(.yaml).

---

## 면접 질문

### Q: 스태프 엔지니어가 LangChain 대신 Semantic Kernel을 고를 이유는?

**좋은 답변:**
**아키텍처 정렬**. 조직이 이미 .NET/Azure 스택 위에 구축됐으면 Microsoft 스택이 기존 CI/CD·모니터링(App Insights)·보안(Entra ID) 파이프라인에 맞음. LangChain은 흔히 "외부" 기술로 느껴짐. 게다가 **강한 타이핑**·**의존성 주입** 패턴이 대규모 LangChain 프로젝트 괴롭히는 "스파게티 코드" 방지. 민감 금융 데이터 다루는 엔터프라이즈엔 보안·감사의 **네이티브 Azure 통합**이 결정 요인. 2026 말엔 새 작업에 선택을 **Microsoft Agent Framework 대 LangGraph**로 표현: MAF가 장기 지원의 GA고 SK 엔터프라이즈 기능 흡수했으니, 기존 코드엔 SK 유지하고 마이그레이션 계획하지 새 프로젝트를 거기 시작 안 함.

### Q: Semantic Kernel의 "함수 호출" 추상화란?

**좋은 답변:**
SK가 **플러그인 기반 모델** 사용. 모든 함수(네이티브 C#나 LLM 기반)가 커널에 등록, 스키마가 도구로 모델에 광고. 모델이 도구 호출 방출하면 커널이 플러그인 레지스트리서 함수 찾아, 파라미터 검증, 모든 **필터**(승인·로깅·편집) 실행, 수행. `FunctionChoiceBehavior.Auto()`로 커널이 모델이 도구 호출 멈출 때까지 루프, 그게 SK 옛 플래너가 제거된 이유: 네이티브 함수 호출이 계획함. 거버넌스 훅이 필터, 그래서 거기 민감 함수의 인간 승인·감사 로깅 둠.

---

## 참고 문헌
- Microsoft Learn. "Introduction to Semantic Kernel": https://learn.microsoft.com/en-us/semantic-kernel/overview/
- Microsoft Learn. "Planning" (planners deprecated and removed; function calling): https://learn.microsoft.com/en-us/semantic-kernel/concepts/planning
- Microsoft. "Microsoft Agent Framework Version 1.0" (Apr 2026): https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/

---

*다음: [Microsoft Agent Framework, CrewAI, 에이전트 SDK](07-autogen-crewai.md)*
