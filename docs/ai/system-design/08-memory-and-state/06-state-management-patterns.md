---
title: 상태 관리 패턴
sidebar_position: 6
description: 단순 "세션"에서 "상태 저장 에이전트 그래프"로 이동한 상태 관리 — 상태 객체, 상태 머신(LangGraph), 체크포인팅과 재개, 상태가 사는 곳, 병렬 상태(fork/join), 타임 트래블.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/08-memory-and-state/06-state-management-patterns.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 상태 관리 패턴

AI 시스템의 상태 관리가 단순 "세션"에서 **상태 저장 에이전트 그래프(Stateful Agent Graphs)**로 옮겼다. 에이전트 "마음"의 흐름·지속 관리가 LLM 자체만큼 critical하다: LangGraph(1.2.12, 2026-09-21 릴리스)가 LangChain 빌드 에이전트의 기본 제어 흐름 런타임이 된 주 이유 하나다. 2026에 "상태를 어떻게 구조화?"에 둘째 질문이 합류: **누가 보유하나**, 당신 체크포인터·내구 워크플로 엔진·관리형 에이전트 플랫폼.

---

## 상태 객체

"상태"는 에이전트 세션의 **단일 진실 소스**.
```python
from typing import Annotated, Any, TypedDict

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    plan: list[str]
    current_task: str
    tool_results: dict[str, Any]
    user_context: dict[str, Any]
    iteration_count: int
```
**베스트 프랙티스**: 상태는 긴 실행 루프 중 데이터 손실 막게 가능한 한 **엄격 타입**·**추가 전용**이어야. 추가 전용이 이제 모델에도 중요: 최신 Claude 모델이 이전 메시지 변경 시 사고 블록 무효화, 그래서 `messages`를 제자리 재작성하는 상태 리듀서가 조용히 추론 연속성 비용.

---

## 상태 머신 (LangGraph)

업계가 **순환 그래프**(상태 머신)로 수렴.
- **노드**: 상태 받아 업데이트 반환하는 함수.
- **엣지**: 상태 값 기반 다음 노드 결정하는 조건 로직(예: `if state['error'] -> goto 'recovery_node'`).

LangGraph 선두가 좁아짐: CrewAI가 1.14에 체크포인팅 추가, Microsoft Agent Framework이 워크플로 체크포인팅·재연결 백그라운드 응답 배송, Google ADK 2.x가 그래프 워크플로 추가. [LangGraph 오케스트레이션](https://github.com/ombharatiya/ai-system-design-guide/blob/main/09-frameworks-and-tools/02-langgraph-orchestration.md)(영문) 참고.

---

## 체크포인팅과 재개

프로덕션서 에이전트가 분·시간 실행 가능.
- **지속 계층**: 모든 상태 업데이트를 DB(Postgres/Redis)에 저장.
- **복원력**: 서버 크래시 시 오케스트레이터가 마지막 `checkpoint_id` 검색해 정확히 멈춘 곳서 재개.
- **부작용**: 재개가 마지막 체크포인트서 리플레이, 그래서 그 후 도구 호출이 두 번 돌 수 있음. 부작용 도구에 멱등 키 주거나, 체크포인트 전진 전 결과 기록.
- **UX**: 이로 사용자가 "작업 중" 메시지 받고 10분 후 상태가 "완료"일 때 알림 받는 **비동기 에이전트** 가능.

---

## 상태가 사는 곳

| 옵션 | 상태 보유 주체 | 강점 | 비용 |
|--------|---------------------|-----------|-------|
| **그래프 체크포인터**(LangGraph + Postgres) | 당신, 슈퍼스텝당 | 완전 제어·검사 가능 상태·타임 트래블 | 재시도·타임아웃·멱등을 스스로 구축 |
| **내구 워크플로 엔진**(Temporal·Durable Functions) | 엔진 이벤트 히스토리 | 재시도·타이머·정확히 한 번 워크플로 로직; 모델·도구 호출이 재시도 정책 있는 액티비티로 | 워크플로 코드 결정성 규칙; 운영할 또 다른 시스템 |
| **관리형 에이전트 플랫폼**(Claude Managed Agents·OpenAI Agents API·프리뷰 Bedrock Managed Agents) | 제공자 세션 | 운영할 루프·상태 스토어 없음; 버전 에이전트 구성; 세션 예산 | 데이터 거주·보존이 벤더 따름(OpenAI Agents API, 2026-09-10부터 퍼블릭 베타, US 거주만·ZDR 없음); 락인 |

프런티어 랩도 내구 실행 사용(Temporal이 OpenAI 사용 1년 못 돼 60배 보고), 관리형 런타임이 콜드 스타트 공략 중: AWS가 2026-09-18 AgentCore Runtime V2 발표, 원 런타임 대략 5.4-30초 대비 약 2초 P75 콜드 스타트 보고, 훨씬 적은 GB시간에 높은 요율 청구(벤더 보고). 트레이드오프와 자체 구축 vs 임차 면접 질문은 [내구 실행](https://github.com/ombharatiya/ai-system-design-guide/blob/main/07-agentic-systems/11-durable-execution.md)(영문) 참고.

---

## 병렬 상태 (Fork/Join)

복잡 과제엔 상태를 **Fork**.
1. **팬아웃**: 상태를 3 서브에이전트(예: 연구자 A·B·C)로 전송.
2. **팬인(Join)**: "매니저" 에이전트가 셋 출력 받아 메인 상태 객체로 병합.

병합을 리듀서(필드별 추가·합집합·last-writer-wins)로 정의, 브랜치가 공유 키 덮어쓰게 두지 말고, 팬아웃 상한: OpenAI Agents API가 예로 `max_concurrent_subagents` 기본 6.

---

## 타임 트래블 (상태 재작성)

[Human-in-the-Loop 패턴](https://github.com/ombharatiya/ai-system-design-guide/blob/main/07-agentic-systems/08-human-in-the-loop-patterns.md)(영문)서 다룬 대로, 상태 관리가 **인간 개입** 허용.
- 개발자가 세션 히스토리 탐색해 "나쁜 턴" 찾아, 그 특정 타임스탬프서 상태 객체 편집하고 그 지점부터 그래프 **재실행**.
- **재작성을 편집이 아니라 fork로 취급.** Claude Fable 5.1·Opus 5.5·Sonnet 5.5서 사고 블록이 그를 생성한 정확 프리픽스에 바인딩. 옛 사고 블록이 여전히 붙은 채 편집 체크포인트서 재실행하면 2026-08-31 이후 생성 계정서 400(또는 `drop_block` 베타 옵션 하 블록 드롭). 편집 지점서 fresh 모델 호출로 리플레이, 원 브랜치는 감사 위해 유지.

---

## 면접 질문

### Q: 에이전트에 단순 "While 루프" 대신 "그래프 기반" 상태 머신(LangGraph)을 쓰는 이유는?

**좋은 답변:**
While 루프는 **불투명·부서지기 쉬움**. 로직을 쉽게 시각화 못 하고, 오류 처리가 중첩 if 문 난장. 그래프 기반 접근은 **관찰 가능·모듈러**. 전 흐름을 (머메이드 다이어그램으로) 시각화하고, 개별 노드 유닛 테스트하고, "백트래킹"·"병렬 실행" 같은 복잡 기능을 엣지 추가로 간단 구현. 프레임워크가 노드 간 저장·로드 처리하니 **상태 지속**도 사소. 솔직한 반론: 한 도구 루프의 단일 에이전트엔 while 루프 + 내구 체크포인트가 흔히 충분, 그래프는 브랜치·인간 인터럽트·병렬 서브에이전트 있을 때 복잡성 벌음.

### Q: 장기 에이전트 세션의 "상태 비대"를 어떻게 막나?

**좋은 답변:**
**상태 가지치기**·**메시지 요약** 사용. 전체 `tool_results` 딕셔너리를 그래프 내내 나르는 대신, 하위 과제 완료 시 트림하고 전체 출력 참조를 스토리지에 유지. `messages` 목록엔 토큰 임계 넘으면 히스토리 컴팩트, 이전 턴 재작성하는 자작 요약기보다 제공자 컴팩션(프리픽스 캐싱·사고 블록 유효 유지) 선호. 요약을 신뢰 불가 출력으로 취급: 원시 전사 유지하고 요약이 원본에 없던 지시 안 도입하는지 검사.

### Q: 팀이 LangGraph서 나쁜 턴 편집해 그 체크포인트서 리플레이. Claude Opus 5.5 전환 후 리플레이가 400 오류로 실패 시작. 무슨 일?

**좋은 답변:**
Opus 5.5가 각 사고 블록을 모델과 그를 생성한 정확 대화 프리픽스에 바인딩. 이전 턴 편집이 프리픽스 바꿔, 리플레이가 옛 사고 블록 되보낼 때 API가 불일치 감지하고 2026-08-31 이후 생성 계정엔 400 반환. 수정은 타임 트래블을 fork로 취급: 편집 지점 후 사고 블록 벗기고 모델이 새로 추론하게, 또는 마이그레이션 중 바인딩 제어 베타 하 `drop_block` 동작 사용. 메인 경로를 추가 전용으로도 만들어, 편집 대신 대화 중 시스템 메시지로 교정, 의도적 디버깅 세션만 비용 지불하게.

---

## 참고 문헌
- [LangGraph persistence and checkpointing documentation](https://docs.langchain.com/oss/python/langgraph/persistence)
- [Temporal. Amazon Bedrock AgentCore with Temporal Serverless Workers (2026-09)](https://temporal.io/blog/amazon-bedrock-agentcore-with-temporal-serverless-workers)
- [AWS. The new AgentCore Runtime (2026-09)](https://aws.amazon.com/blogs/machine-learning/the-new-agentcore-runtime-elastic-optimized-and-consistently-fast-starts/)
- [Anthropic. Preserved thinking (thinking-block binding)](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking)

---

*다음: [섹션 09: 프레임워크와 도구](https://github.com/ombharatiya/ai-system-design-guide/blob/main/09-frameworks-and-tools/01-langchain-deep-dive.md)*
