---
title: 프레임워크 선택 가이드
sidebar_position: 8
description: 프로덕션 요구·팀 전문성·시스템 규모 기반 스택 선택의 결정 매트릭스 — 프레임워크 지형, 결정 로직, 자체 구축 vs 구매 vs 프레임워크, 안티패턴, 스태프급 권장.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/09-frameworks-and-tools/08-framework-selection-guide.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·버전·CVE는 원문 표기를 유지합니다.
:::

# 프레임워크 선택 가이드

AI 프레임워크 지형이 지난 1년간 상당히 통합됐다. 모든 주요 AI 랩이 이제 에이전트 SDK 배송, Microsoft가 AutoGen·Semantic Kernel을 통합 Agent Framework로 병합(2026-04 GA), 랩들이 이제 에이전트 루프도 관리형 런타임으로 임대, 상호운용 프로토콜(MCP·A2A)이 기본. 이 가이드가 프로덕션 요구·팀 전문성·시스템 규모 기반 스택 선택의 **결정 매트릭스**를 제공한다.

---

## 프레임워크 지형

### 오케스트레이션·에이전트 프레임워크

| 프레임워크 | 티어 | 주 가치 | 핵심 약점 |
|-----------|------|---------------|--------------|
| **LangGraph** | L1 (코어) | 정밀 상태 제어·그래프 기반·체크포인트 타임 트래블 | 복잡성·가파른 학습 곡선 |
| **DSPy** | L1 (코어) | 신뢰성·최적화(MIPROv2·GEPA·Flex) | 선행 비용(모델당 컴파일 실행) |
| **LlamaIndex**| L2 (데이터) | 고급 검색(RAG)·수집·파싱 | 로직 유연성; 벤더 초점이 파싱 제품으로 이동(2026-09) |
| **CrewAI** | L3 (앱) | 비즈니스 프로세스 속도·엔터프라이즈 RBAC·체크포인팅(1.14+) | 실패 은폐 |
| **MS Agent Framework** | L1 (엔터프라이즈) | 통합 .NET + Python·AutoGen+SK 대체·LTS의 GA(2026-04) | Azure 우선; 빠른 주 릴리스 케이던스 |
| **Pydantic AI / Mastra** | L1 (타입) | Python(Pydantic AI 2.x)·TypeScript(Mastra) 타입 에이전트 | 작은 생태계; [11장](11-pydantic-ai-and-mastra.md) 참고 |
| **Vercel AI SDK 7** | L2 (TS 런타임) | 제공자 중립 TS 호출·내구 `WorkflowAgent`·실험적 `HarnessAgent` | 코어보다 새 에이전트 추상화 |
| **Haystack 3** | L2 (데이터+에이전트) | 수명주기 훅·스킬·도구 결과 오프로드의 에이전트(3.0, 2026-07) | 3.0이 `ToolInvoker` 제거하고 30 컴포넌트를 별도 패키지로 |
| **Agno 3** | L2 (에이전트) | 도구 결과 오프로드·CodeMode(넓은 도구 스키마 대신 샌드박스 인터프리터 하나) | 3.0(2026-08)이 DB 마이그레이션 요구 |

### 에이전트 SDK (랩 특정)

| 프레임워크 | 티어 | 주 가치 | 핵심 약점 |
|-----------|------|---------------|--------------|
| **Claude Agent SDK** | L1 (에이전트) | 내장 도구·프로덕션 에이전트 루프·예산 | Claude 모델 필요 |
| **OpenAI Agents SDK** | L1 (에이전트) | 경량 handoff·가드레일·샌드박스 에이전트 | OpenAI 중심; 동작 변경 마이너의 0.x |
| **Google ADK** | L1 (에이전트) | 그래프 워크플로(2.0)·다중 언어·네이티브 A2A+Google Cloud | Google 생태계 편향; Java 아직 1.x |
| **AWS Strands Agents** | L1 (에이전트) | AWS 네이티브·모델 불가지론·PyPI 최다 다운로드 랩 SDK | 하네스 패키지가 릴리스 간 기본 모델 변경 |

### 관리형 에이전트 런타임

| 런타임 | 티어 | 주 가치 | 핵심 약점 |
|-----------|------|---------------|--------------|
| **Claude Managed Agents** | L1 (호스팅) | 샌드박스·세션 예산·서버 평가 권한 정책·에이전트 코드(`ant apply`) | Claude만; 둘째 비용 미터(실행 세션시당 $0.08) |
| **OpenAI Agents API** | L1 (호스팅) | 관리형 Codex 하네스: 컴팩션·복구·서브에이전트 | 퍼블릭 베타; US 거주만·ZDR 없음 |
| **Bedrock Managed Agents** | L1 (호스팅) | AWS 내 IAM·CloudTrail의 Agents API | 프리뷰; 세 US 리전 |

### 코딩 에이전트

| 프레임워크 | 티어 | 주 가치 | 핵심 약점 |
|-----------|------|---------------|--------------|
| **Claude Code** | L1 (코딩) | 자율 CLI 코딩 에이전트·플러그인·엔터프라이즈 관리 설정 | Claude 모델 필요; 클로즈드 소스 |
| **Codex CLI** | L1 (코딩) | 오픈소스(Apache-2.0) CLI·클라우드 환경·코드 리뷰 | OpenAI 중심 기본값 |
| **Cursor / Windsurf** | L2 (IDE) | 긴밀 IDE+에이전트 통합·클라우드 에이전트 | 클로즈드 소스 인프라; Cursor는 이제 SpaceX 일부, Windsurf는 Cognition 일부 |
| **OpenCode / OpenHands** | L2 (코딩) | 오픈소스·어느 모델이나 | 호스팅·샌드박싱·업그레이드를 당신이 소유 |

Semantic Kernel은 새 작업 선택지로 안 나열: Microsoft Agent Framework이 후속, 기존 SK 사용자는 마이그레이션 계획해야.

채택 데이터가 "리프엔 랩 SDK, 코어엔 중립 오케스트레이터" 조언 뒷받침. 2026-10-01까지 한 달 PyPI: `langchain` 169.4M, `langgraph` 43.7M, `strands-agents` 36.5M, `claude-agent-sdk` 28.9M, `openai-agents` 12.1M, `google-adk` 9.9M, `llama-index-core` 6.6M, `pydantic-ai` 5.3M, `dspy` 5.2M, `crewai` 2.4M, `agno` 1.7M, `agent-framework-core` 0.92M, `haystack-ai` 0.54M, `autogen-agentchat` 0.38M, `semantic-kernel` 0.29M. npm(8/31-9/29): `ai`(Vercel AI SDK) 104.6M, `@anthropic-ai/claude-agent-sdk` 48.7M, `@langchain/langgraph` 13.9M, `@openai/agents` 7.3M, `@mastra/core` 6.9M. CI 설치·전이 의존성이 전부 부풀리니 상대 신호로 읽음.

---

## 결정 매트릭스

**이 로직으로 스택 선택:**

### 코어 오케스트레이션
1. **순수 RAG 앱인가?** → **LlamaIndex**(자기 검색 인터페이스 뒤에 유지).
2. **장기 상태/Human-in-the-loop 필요?** → **LangGraph**.
3. **높은 신뢰성(99%+)·크로스 모델 이식성이 critical?** → **DSPy**.
4. **C#/.NET 엔터프라이즈?** → **Microsoft Agent Framework**(Semantic Kernel + AutoGen 대체).
5. **비즈니스 사용자용 고수준 자동화 구축?** → **CrewAI + Flows**.
6. **서비스가 TypeScript 우선?** → 호출엔 **Vercel AI SDK**, 에이전트·워크플로엔 **Mastra**나 **LangGraph TS**.

### 에이전트 SDK (주 모델 제공자 기반 선택)
7. **Claude/Anthropic API에 에이전트 구축?** → **Claude Agent SDK**(Python/TS, 파일/코드/명령 내장 도구).
8. **OpenAI API에 에이전트 구축?** → **OpenAI Agents SDK**(경량 handoff·가드레일·MCP 지원).
9. **Google Cloud/Gemini에 에이전트 구축?** → **Google ADK**(그래프 워크플로·네이티브 A2A·Vertex AI 배포·다중 언어).
10. **벤더 간 에이전트 통신 필요?** → 위 어느 프레임워크 위에 **A2A 프로토콜** 사용.
11. **벤더가 루프 돌길(컴팩션·복구·샌드박스) 원함?** → **관리형 런타임**, 데이터 거주·ZDR·세션시 미터 확인 후.

### 코딩 에이전트
12. **자율 파일시스템 수준 코딩 과제?** → **Claude Code**나 **Codex CLI**(터미널)·**Cline**(VS Code).
13. **어느 LLM과도 작동하는 오픈소스 코딩 에이전트 필요?** → **OpenCode**(MIT)나 **OpenHands**(Docker).
14. **AI와 최고 IDE 경험 원함?** → **Cursor**(클로즈드)나 **Windsurf**(Cognition).

---

## 자체 구축 vs 구매 vs 프레임워크

스태프 엔지니어로서 **프레임워크 비대**에 저항해야.

- 비자명한 **컴퓨터 과학 문제**(예: 상태 지속·베이지안 프롬프트 최적화·벡터-그래프 링크) 푸는 곳엔 **프레임워크 사용**.
- 단순 LLM 호출만 할 땐 **커스텀 구축(얇은 래퍼)**. 프레임워크가 단일 턴 에이전트엔 값하지 않는 지연·업데이트 변동·디버깅 오버헤드 추가.

**프레임워크 전에 패턴을 명명.** 2026-06 말과 9월 말 사이 독립 프레임워크들이 같은 세 프리미티브 배송:

| 패턴 | 하는 일 | 배송 형태 |
|---|---|---|
| **하네스 우선 API** | 에이전트가 맨 루프가 아니라 구성 가능 하네스(도구·훅·지시·설정이 역량으로 번들) | Pydantic AI 2 capabilities·AI SDK 7 `HarnessAgent`(실험적)·MAF Harness Agent·OpenAI Agents API(관리형 Codex 하네스) |
| **도구 결과 오프로드** | 큰 도구 출력이 파일·스토어로; 문맥이 포인터와 읽기/검색 도구 받음 | Haystack 3.0 `ToolResultOffloadHook`·Agno 3.0(16,000자 넘는 결과) |
| **코드 모드 도구** | 모델이 도구당 JSON 호출 하나 대신 샌드박스 인터프리터서 도구 호출 코드 작성 | Agno CodeMode·MAF `HyperlightCodeActProvider`(Microsoft가 워크로드서 60% 넘는 적은 토큰 보고)·DSPy 3.4 `LocalInterpreter` |

강한 설계 답이 이 메커니즘을 기술하고 프레임워크를 구현 디테일로 취급. 프레임워크가 하나 결하면 보통 수백 줄로 추가.

---

## 피할 안티패턴

1. **프레임워크 터널링**: 복잡 로직 흐름을 지원 안 하는 프레임워크에 강제(예: 코딩 에이전트에 순수 RAG 라이브러리).
2. **황금 망치**: 50줄 Python 스크립트가 더 빠르고 싼데 인기라고 LangChain 사용.
3. **관찰성 무시**: LLMOps 계층(LangSmith·Langfuse·Phoenix) 없이 어느 프레임워크나 배포, 이상적으로 트레이스 export 가능한 OpenTelemetry 수집.
4. **기본값 신뢰**: 프레임워크가 모델 고르게 둠. 2026-08·9월 OpenAI Agents SDK(0.20.0)·Claude Code(2.1.280·2.1.284)·Codex CLI(rust-v0.159.1)·Strands 하네스 패키지가 모두 기본 모델 변경, 설정 안 한 모든 호출자의 비용·지연·동작을 조용히 변경.

---

## 스태프급 권장

현대 프로덕션급 에이전트 시스템:
- **오케스트레이션**: LangGraph(상태·루프)나 Microsoft Agent Framework(.NET).
- **에이전트 SDK**: 모델 제공자 매칭: Claude Agent SDK(Anthropic)·Agents SDK(OpenAI)·ADK(Google)·Strands(AWS). 모두 도구 접근에 MCP 지원.
- **관리형 런타임**: 컴팩션·복구·샌드박싱이 락인보다 많이 아끼는 리프 에이전트만, 거주·ZDR 조건 맞는 곳만.
- **최적화**: DSPy(다른 모델 티어용 프롬프트 컴파일).
- **검색**: LlamaIndex(다단계 RAG).
- **관찰성**: export 가능한 OpenTelemetry 친화 트레이서(LangSmith·Langfuse·Phoenix).
- **크로스 벤더 에이전트**: 조직 경계 넘는 에이전트 간 조율에 A2A 프로토콜.
- **자율 코딩**: 파일 수준 편집 과제에 Claude Code나 Codex CLI(터미널)·Cline(VS Code).
- **오픈 코딩 에이전트**: 자체 호스팅·CI 파이프라인 통합에 OpenCode나 OpenHands.

**2026 통찰**:
1. 에이전트 코딩 도구(Claude Code·Codex·Cursor·OpenHands)가 오케스트레이션 프레임워크 대체가 아님. LLM API 위·애플리케이션 로직 아래 파일시스템 수준서 작동하는 **새 카테고리**. AI SDK 7 `HarnessAgent`이 한 걸음 더 가 그 하네스들을 플러그 가능 의존성으로 취급.
2. 프로토콜 계층이 성숙: **에이전트-도구엔 MCP**, **에이전트-에이전트엔 A2A**가 선택 애드온이 아니라 인프라 표준 되는 중. 둘 다 지원하게 아키텍처 설계.
3. 모든 랩이 자기 에이전트 SDK, 이제 자기 관리형 런타임 배송이 **벤더 락인 위험** 생성. 도구 접근에 MCP(SDK 간 이식), 에이전트 조율에 A2A(벤더 중립), 에이전트 정의를 레포에 코드로 유지해 완화.
4. 프레임워크가 같은 런타임 프리미티브(하네스 우선 API·도구 결과 오프로드·코드 모드 도구)로 수렴, 그래서 내구 스킬이 클래스명이 아니라 프리미티브 아는 것.

---

## 면접 질문

### Q: 왜 "프롬프팅" 대신 "프로그래밍"(DSPy) 추세를 보나?

**좋은 답변:**
**산업화**. 프롬프트 엔지니어링이 "연금술": 비일관적이고 스케일 안 함. DSPy 같은 프레임워크로 LLM 프로그래밍이 AI를 **소프트웨어 엔지니어링 규율**로 다루게 함. CI/CD·유닛 테스트(지표)·자동 최적화 적용 가능. 이로 AI를 "비결정적 마법"서 더 큰 분산 시스템의 **예측 가능 컴포넌트**로 옮김, 미션 크리티컬 프로덕션 환경의 요구.

### Q: OpenAI·Anthropic·로컬 오픈 웨이트 모델 걸쳐 작동하는 시스템을 구축해야 하면 어떻게 설계하나?

**좋은 답변:**
프롬프트 계층엔 **DSPy**, 오케스트레이션 계층엔 **LangGraph**. DSPy **시그니처**가 과제 정의를 모델 특정 동작서 분리. 그다음 **범용 모델 게이트웨이**(LiteLLM이나 내부 프록시)로 다른 API 포맷 처리. 게이트웨이가 모든 제공자 키 쥐니 보안 critical 인프라: LiteLLM만도 2026에 미인증 RCE(CVE-2026-37004, CVSS 9.8, 1.83.7 수정)·인증 우회(CVE-2026-49468, 1.84.0 수정) 있었고, 두 PyPI 릴리스(1.82.7·1.82.8)가 침해됨. `api_base` 통한 저장 키 탈출 버그(CVE-2026-84377)가 각 마이너 라인 특정 패치 릴리스(예: 1.96.2)서만 수정, 단순 버전 플로어로 불충분. 권고 수정 목록서 정확 버전 핀하고, `allow_client_side_credentials=false` 설정, 게이트웨이를 공개 인터넷 밖에. 게이트웨이가 샘플링 파라미터 주입도 멈춰야, GPT-6 Astra·최근 Claude가 커스텀 `temperature` 거부하니. 도구 접근엔 **MCP**: 모델 불가지론이라 어느 LLM 백엔드 활성이든 같은 MCP 서버 작동. 크로스 팀 에이전트 조율 필요 시 경계 계층서 **A2A**. 이 스택이 비용·지연 이유로 GPT-6.1 Sol서 Claude Sonnet 5.5로 바꿔야 하면 50 프롬프트 재작성 없이 재컴파일·평가 스위트 재실행·설정 갱신 보장.

### Q: 모든 AI 랩이 자기 에이전트 SDK(Claude Agent SDK·OpenAI Agents SDK·Google ADK) 배송하는데 벤더 락인을 어떻게 피하나?

**좋은 답변:**
핵심은 **오케스트레이션 계층을 모델 계층서 분리**. 코어 워크플로 로직엔 LangGraph나 얇은 커스텀 래퍼 같은 프레임워크 불가지론 오케스트레이터. 모델 특정 SDK가 프로토타이핑이나 단일 제공자 전념 시 유용하나, 프로덕션 멀티 벤더 시스템엔 모델 상호작용을 추상화(LiteLLM 게이트웨이·DSPy 시그니처) 뒤에 유지. 도구 접근엔 **MCP**가 이식성 제공: 같은 MCP 서버가 어느 SDK와도 작동. 에이전트 조율엔 **A2A**가 벤더 중립 에이전트 간 통신 제공. 실무 규칙: 랩 특정 SDK·관리형 런타임을 리프 노드(개별 에이전트 구현)에 쓰되 오케스트레이션 그래프·에이전트 정의·평가 스위트를 벤더 중립·내 레포에. 락인이 수명주기에도: 같은 모델이 이제 다른 클라우드서 다른 날짜 은퇴, 그래서 수명주기를 모델별이 아니라 (모델, 플랫폼) 쌍별 추적.

---

## 참고 문헌
- Gartner. "Gartner Predicts 40% of Enterprise Apps Will Feature Task-Specific AI Agents by 2026, Up from Less Than 5% in 2025" (press release, Aug 26, 2025): https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025
- Thoughtworks. Technology Radar (Vol. 34, Apr 2026): https://www.thoughtworks.com/radar
- Microsoft. "Agent Framework Overview": https://learn.microsoft.com/en-us/agent-framework/overview/
- Anthropic. "Agent SDK reference: Python": https://code.claude.com/docs/en/agent-sdk/python
- Google. "Agent Development Kit": https://google.github.io/adk-docs
- OpenAI. Agents SDK releases: https://github.com/openai/openai-agents-python/releases
- OpenAI. "Agents API overview" (beta, Sep 2026): https://developers.openai.com/api/docs/guides/agents-api/overview
- Vercel. "AI SDK 7" (Jun 2026): https://vercel.com/blog/ai-sdk-7
- deepset. Haystack 3.0 release notes (Jul 2026): https://github.com/deepset-ai/haystack/releases/tag/v3.0.0
- Agno 3.0 release notes (Aug 2026): https://github.com/agno-agi/agno/releases/tag/v3.0.0

---

*다음: [프레임워크 변동 항해](12-navigating-framework-churn.md)*
