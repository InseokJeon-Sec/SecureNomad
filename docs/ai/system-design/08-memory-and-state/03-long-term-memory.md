---
title: 장기 메모리
sidebar_position: 3
description: 세션 간 지속을 제공하는 장기 메모리(L2·L3) — 에피소드 개인 로그, 의미 사실 스토어, 하이브리드 벡터-그래프, 가지치기와 감쇠, 프라이버시와 멀티테넌시.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/08-memory-and-state/03-long-term-memory.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 장기 메모리

장기 메모리(L2·L3)는 세션 간 지속을 제공한다. 프로덕션 스택은 단순 "히스토리 RAG"에서 벡터·그래프·관계형·파일 기반 데이터를 결합하는 **다표현 스토어(Multi-Representation Stores)**로 옮겼다. 전용 메모리 서비스가 이제 세 뚜렷한 형태: 벡터 데이터베이스 위 사실 스토어(Mem0), 시간 지식 그래프(Zep/Graphiti·Cognee), git 기반 메모리 파일(Letta MemFS·Claude 메모리 도구).

---

## 에피소드 메모리: 개인 로그

에피소드 메모리는 **궤적**을 저장: 이벤트 시퀀스와 그 결과.
- **데이터 구조**: `(Timestamp, Interaction_ID, Trajectory_Summary, Embedding)`.
- **근거**: 에이전트가 지난달 특정 도구 시퀀스로 React 컴포넌트를 성공 빌드했으면 오늘 다른 걸 빌드하라 들을 때 그 성공을 "회상"해야.
- **구현 노트**: *요약*을 검색용, *원시 로그*를 포렌식 분석 위해 콜드 스토리지(S3/GCS)에 저장. 원시 로그 유지가 읽기 시 큐레이션도 가능케: Just-in-Time Memory(arXiv 2609.27334)가 현 과제 위해 원시 궤적을 읽기 시 큐레이트해 ALFWorld·WebShop·tau2-bench서 최강 쓰기 시 메모리 베이스라인 이김.

---

## 의미 메모리: 사실 스토어

의미 메모리는 엔티티에 관한 **발견 사실** 저장.
- **엔티티 식별**: "사실 추출 에이전트"로 모든 사용자 턴 파싱.
- **예시 트리플릿**:
  - `(User_1, HAS_PREFERENCE, Dark_Mode)`
  - `(Company_X, USES_SDK, Stripe)`
- **기술**: 지식 그래프(Neo4j·AWS Neptune)와 관계 태깅 결합, 또는 엔티티 인덱스 있는 벡터 데이터베이스 내 사실 스토어(Mem0 v2).

---

## 하이브리드 벡터-그래프 저장

스태프급 엔지니어는 관계가 가치를 싣는 **GraphRAG 스타일 메모리** 사용.
- **벡터 검색**이 "관련" 노드 찾음.
- **그래프 순회**가 "연결된" 노드 찾음.
- **이점**: "Project Alpha"를 검색하면 벡터 검색이 이름 찾으나, 그래프 순회가 10 개발자·마감·연결 코드 레포 찾음.

**반론이 2026에 강해졌다.** Mem0 v2.0.0(2026-04)이 Neo4j·Memgraph·Kuzu·Apache AGE 드라이버(약 4,000줄) 제거하고 대신 엔티티 링크를 기존 벡터 스토어 내 병렬 컬렉션에 저장, 의미 유사도·BM25·엔티티 부스팅을 한 검색 점수로 융합. 베팅: 사용자 선호 메모리엔 엔티티 인식 검색이 둘째 DB 없이 그래프 이점 대부분 포착. 멀티홉 순회나 **시간 유효성**("3월 12일에 뭐가 참이었나?")이 필요할 때 진짜 그래프 사용, 그게 Zep/Graphiti 강점: 모든 엣지가 `valid_at`/`invalid_at`(세계서 참이던 때)과 `created_at`/`expired_at`(시스템이 배우고 은퇴시킨 때) 보유.

---

## 메모리 가지치기와 감쇠

메모리는 미제어 성장 시 부채.
- **시간 감쇠**: 오래된 메모리가 자주 접근 안 되면 "관련 점수" 상실.
- **통합**: "billing"에 관한 10 별도 상호작용을 한 고품질 요약 노드로 병합. 이것이 점점 **요청 경로 밖**서 돎: Anthropic Dreams 연구 프리뷰가 메모리 스토어 + 과거 전사 읽어 재조직 스토어 작성, Mem0 Dream이 유료 플랜서 병합·대체.
- **명시 망각**: 사용자 ID 연관 모든 에피소드·의미 클러스터 삭제로 GDPR "잊힐 권리" 존중, 파생 요약·백업·파일 기반 메모리 git 히스토리 포함.
- **게이트 주입**: 검색 관련성이 유용성과 같지 않음. MemTrapBench(arXiv 2608.20202)의 메모리 함정 유발 과제서 올바르고 의미 관련된 메모리도 추론 고착·신념 왜곡 유발, 테스트한 모든 메모리 전략이 무메모리 하회. 메모리가 문맥 진입할지 요청별 결정.

---

## 프라이버시와 멀티테넌시

:::caution
**크로스 세션 누출**이 전역 메모리의 #1 보안 위험.
`user_id`가 벡터 DB 메타데이터의 하드 파티션 키인지 보장. 결과를 사용자별 필터하는 데 LLM에 절대 의존 말 것.
:::

두 추가 제어:
- **쓰기 게이트 공유 메모리.** 많은 사용자가 쓸 수 있는 메모리는 오염 표적. Asana(2026-09)가 누구나 과제에 에이전트 피드백 주게 하나, 관리자·편집자만 영구 공유 메모리에 커밋·삭제 가능; 나머지 피드백은 현 과제만 적용.
- **필요 시 운영자 블라인드 저장.** 제공자 자신이 못 읽어야 하는 메모리엔 참조 설계가 클라이언트 보유 키 + 엔클레이브 처리 + 공개 어테스트 서버 소프트웨어. Google이 2026-09-23 Private AI Compute용으로 제품 날짜 없는 계획으로 기술.

메모리 오염·테넌트 격리 면접 질문은 [에이전트 메모리와 상태](https://github.com/ombharatiya/ai-system-design-guide/blob/main/07-agentic-systems/05-agent-memory-and-state.md)(영문) 참고.

---

## 면접 질문

### Q: 장기 메모리에 벡터 DB와 지식 그래프 중 어떻게 선택하나?

**좋은 답변:**
**에피소드 문맥**(비구조 로그·과거 대화)엔 의미에 "퍼지" 매칭 필요하니 **벡터 DB**. **구조적 의미 지식**(관계·속성·위계)엔 "결정적" 순회 필요하니 **지식 그래프**. 프로덕션 시스템은 **하이브리드** 접근: 벡터 인덱스가 그래프 ID 가리켜, 시스템이 올바른 "시작 노드" 찾아 고정밀 문맥 위해 순회. 다만 그래프 추가 전 벡터 스토어의 엔티티 인식 검색이 충분한지 확인; Mem0가 정확히 그 베팅으로 v2에서 그래프 데이터베이스 버림. 쿼리가 멀티홉이나 시간 범위일 때 그래프가 운영 비용 벌음.

### Q: 학습된 에이전트 메모리 맥락서 "파국적 망각"이란?

**좋은 답변:**
파인튜닝 에이전트에선 새 학습 데이터가 옛 지식 지울 때 파국적 망각 일어남. **에이전트 메모리(RAG 기반)**에선 **인덱스 과부하**를 지칭. 에이전트가 저품질 새 "사실" 1,000개 메모리에 추가하면 검색 정밀도 떨어져, 옛 고품질 사실이 노이즈에 묻혀 사실상 "잊음". ADD 전용 쓰기 경로(Mem0 v2엔 업데이트·삭제 패스 없음)가 나중 뭔가 통합 안 하면 이를 더 가능케. **품질 가중 검색**(감독자의 높은 "검증 점수" 메모리가 원시 로그 위로 부스트)과 중복 병합·낡은 사실 대체하는 스케줄 통합 작업으로 완화.

---

## 참고 문헌
- [Zep: A Temporal Knowledge Graph Architecture for Agent Memory (arXiv 2501.13956)](https://arxiv.org/abs/2501.13956)
- [Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory (arXiv 2504.19413)](https://arxiv.org/abs/2504.19413)
- [Mem0 v2.0.0 release notes](https://github.com/mem0ai/mem0/releases/tag/v2.0.0)
- Edge et al. "From Local to Global: A Graph RAG Approach to Query-Focused Summarization" (2024)
- [MemTrapBench (arXiv 2608.20202)](https://arxiv.org/abs/2608.20202)
- [Just-in-Time Memory (arXiv 2609.27334)](https://arxiv.org/abs/2609.27334)
- [Anthropic. "Agents you can coach: how Asana builds human-agent teams with Claude" (2026-09)](https://claude.com/blog/agents-you-can-coach-how-asana-builds-human-agent-teams-with-claude)

---

*다음: [Mem0로 보는 에이전트 메모리](04-agentic-memory-mem0.md)*
