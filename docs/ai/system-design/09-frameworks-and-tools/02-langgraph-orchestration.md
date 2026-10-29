---
title: LangGraph 오케스트레이션
sidebar_position: 2
description: 상태 저장·멀티 에이전트 시스템 구축의 사실상 표준 LangGraph — 그래프 철학, 순환 vs 비순환, 상태 관리, 지속과 체크포인팅, 멀티 에이전트 패턴.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/09-frameworks-and-tools/02-langgraph-orchestration.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·버전은 원문 표기를 유지합니다. 코드는 원문 그대로 둡니다.
:::

# LangGraph 오케스트레이션

LangGraph는 상태 저장·멀티 에이전트 시스템 구축의 **사실상 표준**이다. 2025-10 v1.0 도달, 1.2.12(2026-09-21); LangGraph 0.4는 2026-12까지 유지보수 모드. 단순 체인과 달리 LangGraph는 **순환**·**상태 지속**·**Human-in-the-Loop** 개입을 허용한다.

채택도는 어느 숫자를 읽냐에 달림. GitHub 스타로는 CrewAI가 여전히 선두(2026-10-01 약 59.3K 대 `langchain-ai/langgraph` 42.6K). 다운로드로는 LangGraph가 한 자릿수 차 선두: 10/1까지 한 달 약 43.7M PyPI 다운로드 대 `crewai` 약 2.4M, 플러스 `@langchain/langgraph` 약 13.9M npm 다운로드(8/31-9/29). 스타가 주목을, 다운로드가 의존을 측정, CI·전이 설치로 부풀려짐. 하려는 주장에 맞는 지표 인용.

---

## 그래프 철학

2023엔 에이전트가 "블랙박스".
오늘 에이전트는 **그래프**.
그래프는:
- **노드**: Python 함수(LLM·도구·데이터 처리).
- **엣지**: 노드 간 경로.
- **조건 엣지**: **상태** 기반 경로 결정 로직.

---

## 순환 vs 비순환

표준 LangChain은 **비순환**(순차).
LangGraph는 **순환**.
- **루프의 힘**: 에이전트가 도구 시도, 오류 보고, "사고" 노드로 **순환 복귀**해 재시도. 이것이 **ReAct** 패턴의 기반.

---

## 상태 관리

**상태 스키마**가 그래프의 "마음".
```python
class GraphState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    plan: list[str]
    is_secure: bool
```
**뉘앙스**: `Annotated`를 `add_messages`와 쓰면 그래프가 히스토리 덮어쓰기 대신 **추가**, 전 추론 궤적 보존.

---

## 지속과 체크포인팅

현 LangGraph가 **스레드 기반 지속** 사용.
- **개념**: 모든 세션이 `thread_id` 가지고, 체크포인터(Postgres·SQLite·Redis·테스트용 인메모리)가 매 슈퍼스텝 후 상태 저장.
- **이점**: 사용자가 2일 후 돌아오면 에이전트가 다단계 워크플로서 있던 정확 지점 기억.
- **인터럽트**: `interrupt()`가 인간 승인 위해 노드 일시정지하고 체크포인트서 재개, 폴링 루프 없이 내구 human-in-the-loop 작동하는 법.
- **타임 트래블**: 개발자가 특정 스레드를 이전 상태서 "재실행"해 실패 디버그.

해자가 좁아짐. CrewAI가 1.14(2026-04)에 체크포인팅 추가, Microsoft Agent Framework이 워크플로 체크포인팅 배송, Google ADK 2.0이 일시정지·재개의 그래프 워크플로 추가. LangGraph 남은 우위는 성숙도: 어느 체크포인트서나 분기 디버깅과 LangSmith 트레이스 통합.

---

## 멀티 에이전트 패턴

| 패턴 | 설명 | 사례 |
|---------|-------------|------------|
| **Supervisor** | 한 "매니저"가 전문 워커 지휘. | 연구 팀 |
| **Peer-to-Peer**| 에이전트가 서로 직접 과제 넘김. | 고객 지원 |
| **Hierarchical**| 그래프 내 그래프(중첩 그래프). | 엔터프라이즈 엔지니어링 |

이 패턴들의 도구 접근이 점점 MCP 통해: `langchain` 1.4.0(2026-09-03)부터 MCP 어댑터가 코어 `langchain` 패키지의 일부, 그래서 LangGraph 노드가 별도 어댑터 의존성 없이 MCP 서버 마운트.

---

## 면접 질문

### Q: OpenAI Agents API나 Claude Managed Agents 같은 관리형 에이전트 런타임 대신 LangGraph를 쓰는 이유는?

**좋은 답변:**
**제어·이식성 대 운영 오프로드.** 질문이 예전엔 2026-08-26 종료해 모든 Threads 기반 앱을 Responses + Conversations로 재구축하게 한 OpenAI Assistants API에 맞섰음. 그게 첫 포인트: 벤더 관리 상태가 벤더 일정에 사라질 수 있음. 대체한 관리형 런타임이 훨씬 나으나(OpenAI Agents API, 2026-09-10 퍼블릭 베타, 내구 세션·컴팩션·복구의 Codex 하네스 실행; Claude Managed Agents가 세션 예산·서버 평가 권한 정책·`ant apply` 에이전트 코드 추가) 실제 작업 제거. 그러나 루프가 그들 측서 돎. LangGraph는 **화이트박스 프레임워크**: 어느 모델(OpenAI·Claude·오픈 웨이트)이나 쓰고, 도구 호출 시점 정확 제어, 단계 간 검증 주입, 온프렘 실행. 규제 워크로드엔 결정 사실이 구체적: Agents API 베타가 US 거주만·Zero Data Retention 없음. 내 기본값은 코어 워크플로엔 LangGraph(또는 얇은 커스텀 루프), 컴팩션·샌드박싱이 락인 비용보다 많이 아끼는 리프 에이전트엔 관리형 런타임.

### Q: 20+ 노드 그래프의 "상태 과부하"를 어떻게 다루나?

**좋은 답변:**
**상태 축소** 사용. 전 전역 상태를 모든 노드에 넘기는 대신, 서브그래프에 전문 하위 상태 정의. `trim_messages`(또는 요약 노드)로 LLM 도달 전 메시지 히스토리 가지치기, 지속 계층에 "진실" 보존하며 토큰 안 낭비. 큰 도구 결과는 상태에 포인터 남기고 스토어로, Haystack 3.0·Agno 3.0이 이제 내장 배송하는 같은 도구 결과 오프로드 패턴.

---

## 참고 문헌
- LangChain. "LangGraph: Multi-Agent Workflows" (Jan 2024): https://www.langchain.com/blog/langgraph-multi-agent-workflows
- LangGraph persistence docs: https://docs.langchain.com/oss/python/langgraph/persistence
- LangChain release policy: https://docs.langchain.com/oss/python/release-policy
- Anthropic. "Building Effective AI Agents" (Dec 2024; workflows vs agents, orchestrator-workers, evaluator-optimizer): https://www.anthropic.com/engineering/building-effective-agents

---

*다음: [LangSmith 관찰성](03-langsmith-observability.md)*
