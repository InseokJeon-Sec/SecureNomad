---
title: LangSmith 관찰성
sidebar_position: 3
description: 문자열 로깅에서 전 궤적 디버깅·자동 평가 파이프라인으로 진화한 LLM 관찰성 — 관찰성 피라미드, 트레이싱, 데이터셋 유닛 테스트, LLM-as-Judge, A/B 테스트, 2026년 9월 플랫폼 변화.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/09-frameworks-and-tools/03-langsmith-observability.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·버전은 원문 표기를 유지합니다.
:::

# LangSmith 관찰성

2023엔 LLM 관찰성이 "문자열 로깅"이었다. 이제 **전 궤적 디버깅(Full Trajectory Debugging)**과 **자동 평가 파이프라인**, 2026 말엔 플랫폼들이 트레이스→평가→파인튜닝 루프를 닫는 중이다. LangSmith는 Langfuse(2026-01부터 ClickHouse 일부; Python SDK 4.16.0)·LangWatch·Braintrust·Arize Phoenix(2026-10-01 20.19.0, Elastic-2.0 라이선스; Dynatrace가 2026-08-13 Arize를 $915M에 인수 합의)도 포함하는 붐비는 "LLMOps" 계층의 LangChain 네이티브 옵션. 소유권 변경이 이제 선택 기준: OpenTelemetry 수집하고 트레이스·데이터셋 export 가능한 도구 선호.

---

## 관찰성 피라미드

1. **최상(가치)**: 사용자 과제가 완료되나? (성공률)
2. **중간(흐름)**: 어느 에이전트 노드가 병목? (노드당 지연/비용)
3. **최하(원시)**: 정확한 프롬프트/완성 쌍이 뭐였나? (트레이스)

---

## 트레이싱과 궤적

LangSmith가 **LangGraph**·**체인**의 모든 노드 자동 포착.
- **메타데이터 태깅**: 모든 트레이스를 `user_id`·`model_tier`·`is_canary`로 태깅.
- **디버거**: LangSmith UI서 트레이스 "재생" 가능, 프롬프트 수정해 응답 변화 봄. 전 애플리케이션 재실행 없이 작동.
- **궤적 뷰**: 한 번에 트레이스 하나가 아니라 전 멀티턴 에이전트 실행 보이는 세션 수준 뷰(2026-09).
- **전송 주의**: OpenAI Python SDK 3.0(2026-08-12)·Anthropic Python SDK 1.0(2026-08-20)이 `httpx2`로 이동. `httpx` 훅하는 계측(OpenTelemetry HTTPX instrumentor·Sentry·`respx`·`vcrpy`)이 Anthropic 마이그레이션 가이드대로 무엇이 `httpx` import 전 `httpx2.alias_httpx()` 실행 않으면 SDK 호출을 조용히 놓칠 수 있음. SDK 업그레이드 후 조용한 대시보드 신뢰 전 스팬이 여전히 도착하는지 확인.

---

## LLM 유닛 테스트 (데이터셋)

**데이터셋** 없이 LLM 앱 구축은 "바이브 기반 개발".
- **골드 스탠다드 데이터셋**: `(입력, 기대 출력)` 쌍 모음.
- **표준 워크플로**: 사용자가 부정 피드백 줄 때마다 그 상호작용이 자동으로 미래 테스트용 "교정 데이터셋"에 펌핑.

---

## 자동 평가기

매일 아침 1,000 로그 항목을 수동 검사 불가.
- **LLM-as-Judge**: 강한 모델, 이상적으로 테스트 대상과 다른 계열(예: GPT-6.1 Sol 에이전트 심판하는 Claude Opus 5.5)로 프로덕션 모델을 **톤**·**정확성**·**안전 액션 실행** 같은 카테고리로 채점.
- **결정 모델 심판**: 셋째 티어가 2026-09 도착. TypeSafe Jev(얼리 액세스, 1M 입력 토큰당 $0.042, 출력 비계량)가 생성 텍스트 대신 확률과 함께 타입 예/아니오·선택·점수 반환; LangSmith가 9/21 평가기로 추가. LangChain이 호출당 약 $0.00035·평균 0.44초 지연을 LLM 심판 2.16-2.83초 대비 측정(벤더 실행 측정). 함정: 짝 연구(arXiv 2609.29769)가 Jev의 가장 확신한 오류서 약 96% LLM 심판 판정이 같은 틀린 답 반복, 심판 캐스케이드가 최대 2.7점 획득. 100% 트래픽의 싼 이진 검사엔 결정 모델, 작성 근거 필요한 곳엔 LLM 심판, 그리고 캐스케이딩이 상관 오류 못 잡으니 인간 레이블 골드 세트 유지.
- **커스텀 평가기**: 정규식 패턴·JSON 스키마 유효성·독성 점수 검사하는 Python 함수.

---

## A/B 테스트

LangSmith가 **실험 비교**를 오프라인, 변종 태깅을 온라인 지원. 트래픽 분할·롤백은 트레이싱 도구가 아니라 배포 계층(피처 플래그·게이트웨이)에 거주:
- 트래픽 2%를 새 "시스템 프롬프트" 버전에 실행, 각 트레이스를 변종 태깅.
- 샘플 트레이스의 온라인 평가기로 변종별 **성공률**·**토큰 비용**을 근실시간 비교.
- 실패율 임계 경보를 플래그 시스템에 연결해 자동 롤백.

---

## 2026년 9월 플랫폼 변화

| 변화 | 날짜 | 설계 결과 |
|---|---|---|
| 확장 보존의 SaaS 트레이스를 **최대 180일** 유지 | 2026-09-14부터 | SaaS 트레이싱 스토어는 감사 로그 아님. 컴플라이언스가 더 긴 보존 필요하면 자기 스토어 export나 자체 호스팅·BYOC(불변) |
| **LangSmith Fine-Tuning** 퍼블릭 베타(`smithtune` CLI) | 2026-09-24 | 트레이스 궤적이 Fireworks·Baseten 통해 오픈 웨이트 모델의 SFT·LoRA 실행 되고 평가·배포. OpenAI가 셀프서브 파인튜닝 축소(2027-01-06부터 활성 고객 새 작업 없음)이라 관련 |
| **Engine v2** | 2026-09-24~25 | 레드팀 가설 생성, 오류·지연·비용 추세와 반복 도구 호출 탐지, 제안 수정을 더 넓은 평가 세트 대비 검증. LangChain이 Engine이 이제 40% 적은 사용 크레딧 사용한다 함 |
| SDK 케이던스 | 2026-08~09 | `langsmith`가 0.11.0(8/14)서 0.14.2(9/30)로: 여느 의존성처럼 핀 |

---

## 면접 질문

### Q: "트레이스 귀인(Trace Attribution)"이 스태프급 엔지니어에 왜 critical한가?

**좋은 답변:**
복잡 멀티 에이전트 시스템서 최종 출력이 나쁠 수 있으나 오류는 10단계 전 "연구자" 노드서 일어남. **트레이스 귀인** 없이는 프롬프트 어디 고칠지 추측만. 귀인이 **추론 라인**을 보게 함. "연구자"가 올바른 URL 못 찾아 "요약기"가 환각함을 봄. 이로 넓은 "프롬프트 엔지니어링" 대신 **타깃 최적화** 가능.

### Q: LangSmith 같은 관찰성 플랫폼 비용을 어떻게 정당화하나?

**좋은 답변:**
비용이 **개발자 생산성**·**토큰 효율**로 상쇄. 모델이 왜 실패하는지 "추측"하는 엔지니어 하루가 월 구독보다 상당히 비쌈. 게다가 LangSmith로 "배회" 에이전트(단계 너무 많이 밟는 것) 찾아, 평균 단계를 8서 5로 줄이게 그래프 최적화 가능. 모든 단계가 커지는 문맥을 재전송하니, 그게 입력 토큰을 37.5% 단계 감소가 시사하는 것보다 더 절감, 에이전트 워크로드가 출력 토큰당 수백 입력 토큰으로 돌 때 중요. 심판 예산도: 모든 트레이스에 LLM 심판 실행이 관찰성 좌석보다 비쌀 수 있어, 그게 100% 트래픽의 싼 결정 모델 심판 플러스 샘플의 LLM 심판이 합리적 기본값인 이유.

---

## 참고 문헌
- LangChain. "LangSmith Observability" docs: https://docs.langchain.com/langsmith/home
- LangChain. "LangSmith Engine, agents, fine-tuning and trajectories" (Sep 2026): https://www.langchain.com/blog/langsmith-engine-agents-fine-tuning-trajectories
- Rao and Callison-Burch. "JEV vs. LLMs as Rubric Judges: Cheaper, Faster, and Wrong in the Same Places" (arXiv 2609.29769, Sep 2026): https://arxiv.org/abs/2609.29769

---

*다음: [LlamaIndex와 데이터 중심 AI](04-llamaindex.md)*
