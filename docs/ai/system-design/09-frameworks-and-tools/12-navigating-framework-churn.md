---
title: 프레임워크 변동 항해
sidebar_position: 12
description: 가르치는 콘텐츠보다 빠르게 바뀌는 AI 오케스트레이션 프레임워크 — 튜토리얼이 깨지는 이유, 실제 바뀐 것, 핀·락·격리로 변동 생존, 프레임워크 vs 원시 SDK vs 얇은 계층, 버전 간 전이되는 것.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/09-frameworks-and-tools/12-navigating-framework-churn.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·버전·모델명은 원문 표기를 유지합니다. 코드·오류 메시지는 원문 그대로 둡니다.
:::

# 프레임워크 변동 항해

AI 오케스트레이션 프레임워크가 가르치는 콘텐츠보다 빠르게 바뀐다. LlamaIndex와 LangChain이 각각 2024에 전 패키지 레이아웃을 재아키텍처하고 원 헤드라인 추상화를 1년 내 제거, Haystack이 2026-07 3.0 릴리스에 같은 걸 함. 결과: 12개월 전 녹화된 강의가 흔히 첫 `import`에 실패. 이 페이지가 그 문제·발생 이유·지식과 코드가 변동 생존하게 배우고 구축하는 법에 관한 것.

한 줄 버전: **프레임워크는 이번 분기 배송하는 법; 프리미티브는 당신이 지키는 것. 전자를 핀, 후자를 학습.**

---

## 트리거: fresh 설치에 강의가 깨지는 이유

흔하고 실제인 예: 학습자가 호평받는 LlamaIndex 비디오 강의 시작, 첫 셀 복사, 맞닥뜨림

```
ImportError: cannot import name 'SimpleDirectoryReader' from 'llama_index'
```

또는 조금 후,

```
TypeError: Can't instantiate abstract class OpenAI with abstract method _prepare_chat_with_tools
```

학습자나 녹화 강의에 잘못은 없음. 강의 노트북 환경이 구 버전 핀(인기 LlamaIndex 강의 하나가 `llama-index==0.10.30`·`llama-index-llms-openai==0.1.26`의 `requirements.txt` 배송), 비디오가 그에 녹화됨. 오늘 fresh `pip install llama-index`하면 몇 마이너 릴리스 새 버전 받고, 거기선 import 경로·클래스 계층이 바뀜. 첫 오류가 이동 import; 둘째가 *부분* 버전 불일치, 코어 패키지와 통합 패키지가 보조 안 맞게 업그레이드돼 베이스 클래스에 구 통합 패키지가 구현 안 한 새 추상 메서드 존재.

이게 LlamaIndex 문제나 강의 품질 문제가 아님. 빠르게 움직이는 프레임워크 플러스 핀·녹화 교육 콘텐츠의 기본 결과. 메커니즘 이해가 포기 대신 초 단위 고치게 함.

---

## 실제 바뀐 것

### 2026년 10월 스냅샷

버전 변동이 튜토리얼만 깨지 않고 전 제품 표면 은퇴시키고 당신 코드 안 건드리고 동작 바꿈. 2026-08·9월 두 목록이 런타임 발견 대신 달력에 올릴 가치.

**은퇴 표면과 마감**

| 변화 | 날짜 | 의미 |
|---|---|---|
| **OpenAI Assistants API 종료** | 2026-08-26(실행) | `/v1/assistants`·threads·runs가 이제 OpenAI·Azure OpenAI서 에러. 대체가 Responses API 플러스 Conversations API, Threads에 **자동 마이그레이션 없음**. 벡터 스토어 생존: Responses `file_search`가 `vector_store_ids` 받음, 그래서 팀이 인덱스가 아니라 오케스트레이션 재작성. Assistants·Threads·Runs 쓰는 어느 튜토리얼이나 죽은 API 기술 |
| **OpenAI Evals·Agent Builder·Reusable Prompts** | Evals 10/31 읽기 전용; 셋 다 2026-11-30 종료 | OpenAI 마이그레이션 가이드가 평가 사용자를 Promptfoo로, OpenAI가 2026-03 인수 합의(MIT 라이선스 유지, 9/18 0.123.1). 이게 exit가 아니라 OpenAI 소유 도구로의 통합. Agent Builder 사용자는 Agents SDK나 ChatGPT Workspace Agents로. 아이러니 주목: OpenAI 자체 마이그레이션 가이드서 Assistants가 매핑되는 객체 Reusable Prompts가 Assistants 후 약 3개월인 2026-11-30 종료 |
| **OpenAI 셀프서브 파인튜닝 축소** | 2027-01-06부터 활성 고객 새 작업 없음 | "클로즈드 모델 나중 파인튜닝"이 OpenAI서 더 이상 계획 아님. 커스터마이제이션이 오픈 웨이트 파인튜닝(예: Fireworks·Baseten 통한 LangSmith Fine-Tuning)이나 프롬프트·문맥 방법으로 |
| **모델 스냅샷** | OpenAI API 레거시 배치 2026-10-23(4/22 발표): `gpt-4o-2024-05-13`·`gpt-4-turbo`·`gpt-4-0613`·`gpt-4-1106-preview`·`gpt-3.5-turbo-0125`·`gpt-4.1-nano`·`o1`·`o1-pro`·`o3-mini`·`o4-mini`·`gpt-image-1`. Claude Sonnet 4.5가 2026-11-30 은퇴(Claude API·Foundry); `gpt-5-2025-08-07`·`o3-2025-04-16`과 형제 스냅샷이 2026-12-11 | 2023-2025 시대 스냅샷 핀 시스템이 2026 말 전 하드 마감. 10/23 배치가 bare `gpt-4`·`gpt-3.5-turbo` 별칭과 GPT-3.5 Turbo·GPT-4·GPT-4.1-nano·o4-mini·`babbage-002`·`davinci-002` 파인튜닝도; OpenAI 나열 대체가 `gpt-5.6-sol`·`gpt-5.6-terra`·`gpt-5.6-luna`, 이미지엔 `gpt-image-2.5-sunburst`·`gpt-image-2.5-flare`. `gpt-5.4-cyber`가 10/1 약 3주 통지로 제거, OpenAI 전문 모델 명시 3개월 훨씬 밑 |
| **같은 모델, 다른 클라우드** | 지속 | Claude Opus 4.1이 2026-08-05 Claude API 떠났으나 Bedrock서 2027-01-08까지(10/8부터 높은 확장 접근 가격). 2026-09-07부터 론치 Bedrock 모델이 "no sooner than" EOL과 6개월이나 45일만 Legacy 기간. 수명주기를 모델별이 아니라 (모델, 플랫폼) 쌍별 추적 |
| **소유권 변경** | Dynatrace가 Arize 인수 합의(8/13, $915M); NVIDIA가 Hugging Face 인수 확인(9/3, $12.93B, 종료일 미공개) | 데이터 export 가능한 관찰성 도구 고르고, 허브가 중립 유지 가정 대신 의존 모델·데이터셋 미러 |

**조용한 동작 변화**

| 변화 | 날짜 | 왜 코드서 아무것도 경고 안 했나 |
|---|---|---|
| **기본 모델 스왑** | 2026-08-11부터 9-29 | OpenAI Agents SDK 0.20.0이 `gpt-5.6-luna`를 암묵 기본; Claude Code가 Opus 5.5(2.1.280)·Sonnet 5.5(2.1.284) 기본; Codex CLI rust-v0.159.1이 GPT-6.1 Sol로; Strands 하네스 패키지가 Claude Opus 5로. 모델 안 설정한 모든 호출자가 새것 받음. Azure Foundry가 2026-12-09 `gpt-4o` 2024-05-13 Standard 배포를 `gpt-5.6-sol`로 자동 업그레이드 |
| **제공자 SDK 전송 스왑** | OpenAI Python SDK 3.0.0(8/12)·Anthropic Python SDK 1.0.0(8/20) | 둘 다 `httpx2`로 이동. OpenTelemetry HTTPX 계측·Sentry·`respx`·`pytest-httpx`·`vcrpy`가 무엇이 `httpx` import 전 `httpx2.alias_httpx()` 실행 않으면 SDK 호출 조용히 놓침(Anthropic 마이그레이션 가이드). 누락 스팬·미목 라이브 호출이 오류 안 냄 |
| **샘플링 파라미터 제거** | Anthropic SDK 1.0(8/20)·Gemini API(7/21)·GPT-6 Astra(9/3) | `temperature`·`top_p`·`top_k`가 Anthropic Messages 메서드 시그니처서 사라짐(`TypeError`), Gemini API서 폐기, Astra서 미지원. effort나 thinking 수준이 새 제어 표면 |
| **강제 도구 선택 거부** | Claude Fable 5.1(9/1)·Opus 5.5(9/22)·Sonnet 5.5(9/28) | `any`·`tool` 유형 `tool_choice`가 400 반환, 파트너 패키지 따라잡을 때까지 도구 호출 강제한 프레임워크 구조화 출력 경로 깸(`langchain-anthropic` 1.7.3·1.7.5) |
| **MCP Python SDK 2.0** | 2026-07-28 | `pip install mcp`가 이제 2.x로, `FastMCP`가 `MCPServer`로, 프레임워크가 수주 내 따름(OpenAI Agents SDK 0.20.0·DSPy 3.3.1·LangChain 1.4.0). 포팅까지 `mcp<2` 핀 |

내구 교훈이 이 장이 import에 대해 하는 것과 같음: **의존하는 것을 핀, 모델 ID 포함, 그리고 critical 경로 모든 벤더·클라우드 폐기 피드 구독**. Assistants 일몰이 꼬박 1년 전 발표, 깨진 팀이 통지 안 읽은 쪽이란 뜻. 조용한 변화가 더 나쁨: 평가 하네스와 텔레메트리 검사만 포착.

세 재아키텍처가 현대 변동 정의. 아래 버전 번호가 릴리스 날짜 수반; 계속 움직일 테니 스냅샷으로 취급.

### LlamaIndex

- **v0.10(2024-02): 대분할.** 모놀리식 `llama-index` 패키지가 `llama-index-core`(추상화만) 플러스 수백 독립 버전 통합 패키지(`llama-index-llms-openai`·`llama-index-embeddings-*`·`llama-index-vector-stores-*`·`llama-index-readers-*`)로 쪼개짐. 별도 `llama-hub`가 접힘. import가 두 방식 동시 변경, 그래서 구 노트북이 즉시 실패:
  - 톱레벨서 코어로: `from llama_index import VectorStoreIndex`가 `from llama_index.core import VectorStoreIndex`로
  - 통합이 자기 패키지로: `from llama_index.llms import OpenAI`가 `from llama_index.llms.openai import OpenAI`로
- **v0.11(2024-08): 플래그십 추상화 제거.** `ServiceContext`(모든 0.10 이전 튜토리얼이 LLM·임베딩·파서 배선에 쓴 객체)가 0.10에 폐기되고 0.11에 *제거*. 대체가 전역 `Settings` 객체. 같은 릴리스가 코드베이스를 Pydantic v2로 이동.
  ```python
  # OLD (pre-0.10, removed in 0.11)
  from llama_index import ServiceContext, set_global_service_context
  service_context = ServiceContext.from_defaults(llm=llm, embed_model=embed)
  set_global_service_context(service_context)

  # CURRENT
  from llama_index.core import Settings
  Settings.llm = llm
  Settings.embed_model = embed
  ```
- **Workflows(2025-06 1.0, 이제 2.x): 새 애플리케이션 표면.** 이벤트 주도·타입 상태 에이전트 오케스트레이션, 자기 `llama-index-workflows` 패키지로 추출. 많은 요약이 틀리는 교정 주목: 1.0 그다음 2.x 도달한 게 *Workflows*(`llama-index-workflows` 2.25.0, 2026-09-25); 코어 프레임워크 자체는 여전히 0.x 라인(`llama-index` 0.14.25, 2026-09-21), "1.x" 라인 아님. 회사가 2026-09 주 초점이 이제 파싱·추출 제품이라 했고, 코어 릴리스가 그에 따라 느려짐.
- **Codemod:** `llamaindex-cli upgrade <dir>`가 구 import 자동 재작성.

### LangChain

- **패키지 분할.** `langchain-core`(Runnable·메시지·베이스 인터페이스, 하위 호환 보장 있는 유일 패키지)·`langchain-community`(서드파티 통합)·`langchain`(체인·에이전트)·벤더별 파트너 패키지(`langchain-openai`·`langchain-anthropic` 등). LCEL `|`-파이프 조합 모델이 구 `Chain` 하위클래스 대체.
- **v0.3(2024-09): Pydantic v1→v2.** Pydantic v1 모델 전달 사용자 코드가 깨짐.
- **v1.0(2025-10): LangGraph의 에이전트.** 에이전트 구축의 축복받은 길이 미들웨어 시스템의 LangGraph 런타임 실행 `create_agent`로. 레거시 체인(`LLMChain`·`RetrievalQA`·`AgentExecutor`·`initialize_agent`)이 `langchain-classic`으로, 폐기되나 삭제 안 됨. `langchain`이 1.4.3(2026-09-28)·Python 3.10+ 필요; 1.4.0(9/3)이 MCP 어댑터를 코어 패키지로. LangChain 0.3·LangGraph 0.4가 2026-12까지 보안·치명 수정만.
- **폐기 맵:** `LLMChain`이 LCEL 파이프(`prompt | llm | parser`)로; `RetrievalQA`가 `create_retrieval_chain`으로; `AgentExecutor`/`initialize_agent`가 `create_agent`로; 레거시 `Memory` 클래스가 LangGraph 체크포인터로.

### Haystack

- **3.0(2026-07-20): 에이전트가 장악.** 독립 `ToolInvoker` 제거; `Agent`가 수명주기 훅(`before_run`·`before_llm`·`before_tool`·`after_tool`·`on_exit`·`after_run`)·점진 공개의 `SkillToolset`·`ConfirmationHook`로서 human-in-the-loop·큰 도구 출력용 `ToolResultOffloadHook`와 종단 도구 실행 소유.
- **파이프라인 병합, 통합 분리.** `Pipeline`·`AsyncPipeline`이 한 클래스 됨, 레거시 제너레이터 제거, 30 컴포넌트(Sentence Transformers·Hugging Face·Whisper·OpenTelemetry와 Datadog 트레이서 등)가 별도 릴리스 통합 패키지로. 3.3.0이 2026-10-01 배송.

더 깊은 디테일은 [LangChain 심층 분석](01-langchain-deep-dive.md)·[LlamaIndex 장](04-llamaindex.md). 여기 요점은 *패턴*: 모놀리스가 코어 플러스 플러그인으로 쪼개짐, 원 편의 추상화 제거, 에이전트 계층이 더 풍부한 런타임으로 이동. 세 프레임워크 다 대략 1년 간격으로 따름, 랩 SDK가 이제 같은 러닝머신에: OpenAI 0.x Agents SDK가 2026-08 8일 내 기본 모델 변경·파괴적 클라이언트 변경 배송, DSPy 3.4가 3.3이 8주도 안 전 도입한 실험적 API 제거.

---

## 강의·튜토리얼이 낡는 이유

녹화 강의·블로그 포스트가 *스냅샷* 포착: 비디오와 보통 핀 `requirements.txt`나 호스팅 노트북 환경이 녹화 시점 고정. 라이브 패키지 인덱스는 아님. 학습자가 fresh 설치하면 리졸버가 핀 지난 현 버전 당기고, 녹화 코드가 설치 API와 안 맞음.

실패 모드가 예측 가능:

- **이동 import**(`cannot import name ... from 'llama_index'`): 심볼이 `.core`나 파트너 패키지로 재배치.
- **제거 심볼**(`ImportError: ServiceContext`·`LLMChain`/`RetrievalQA` 참조): 추상화가 이동이 아니라 삭제.
- **부분 업그레이드 불일치**(`Can't instantiate abstract class ...`): 코어와 통합 패키지가 보조 안 맞게 드리프트; 통상 수정이 *세트* 함께 업그레이드(`pip install -U llama-index llama-index-llms-openai`).
- **모델명 폐기**(`gpt-3.5-turbo-0301` 더 이상 가용 안 됨; 2023 시대 튜토리얼 흔한 `gpt-3.5-turbo`·`gpt-4` 별칭이 2026-10-23 종료; `claude-sonnet-4-5-20250929`이 2026-11-30 은퇴): 튜토리얼이 제공자가 이후 은퇴시킨 모델 ID 핀. 같은 변동, 한 계층 아래.
- **제거 파라미터**(Anthropic Python SDK 1.x의 `TypeError: ... unexpected keyword argument 'temperature'`, 최신 Claude 모델 강제 `tool_choice`의 400): 프레임워크 아래 API 표면 이동.
- **조용한 변화**(오류 전혀 없음): 새 기본 모델, SDK가 `httpx2`로 옮긴 후 멈춘 트레이스. 평가·대시보드가 찾지 스택 트레이스가 아님.

대부분 교육 플랫폼이 버전 계약을 번들 lockfile이나 동결 호스팅 환경으로만 인코딩, 가시 "이 강의는 버전 X에 녹화됨" 배너가 아님. 그래서 낡음이 코드 깨질 때까지 안 보임.

---

## 이 튜토리얼 현재인가? 30초 검사

어느 강의·포스트·노트북에 시간 투자 전:

1. **프레임워크 릴리스 케이던스 대비 날짜 확인.** 2024 LlamaIndex·LangChain 튜토리얼이 구성상 최소 한 전 재아키텍처 선행.
2. **번들 `requirements.txt`나 lockfile 열고 핀을 현 릴리스와 비교.** 현 `0.14.x` 대비 `llama-index==0.10.x` 핀, 또는 어느 `langchain<1.0`이나 깨짐 예상.
3. **알려진 제거 심볼 grep.** 그 존재가 자료 즉시 연대:
   - LlamaIndex: `ServiceContext`·`LLMPredictor`·`set_global_service_context`, 또는 `.core` 없는 `from llama_index import`.
   - LangChain: `LLMChain`·`RetrievalQA`·`initialize_agent`·`AgentExecutor`.
   - OpenAI: `client.beta.assistants`·`threads`·`runs`(Assistants API가 2026-08-26 종료).
   - MCP: `from mcp.server.fastmcp import FastMCP`(MCP Python SDK 2.0서 `MCPServer`로 개명).
   - DSPy: `dspy.Assert`·`dspy.Suggest`(3.x서 사라짐). Semantic Kernel: Stepwise나 Handlebars 플래너(제거).
   - Anthropic SDK: `messages.create`에 전달된 `temperature=`·`top_p=`(1.0서 시그니처서 제거).
4. **프로젝트 자체 현 퀵스타트를 진실 소스로 선호**, 서드파티 강의는 복붙 코드가 아니라 *개념*에.

---

## 변동 생존: 핀, 락, 격리

"어제 작동, 오늘 깨짐" 방지 규율:

- **정확 버전 핀.** 느슨한 미버전 `llama-index`가 놀람 깨짐의 단일 최대 원인. 최소한 직접 의존성을 `==`-핀.
- **실제 lockfile 사용**, 전이 의존성도 포착. [`uv`](https://docs.astral.sh/uv/)(`uv.lock`·`uv sync`)가 빠르게 움직이는 2026 선호; Poetry(`poetry.lock`)·pip-tools(`pip-compile`)가 확립. 떠오르는 표준이 도구 불가지론 `pylock.toml`(PEP 751). `pyproject.toml`을 의도로, lockfile을 현실로 취급, lockfile 커밋.
- **분할 패키지를 세트로 핀.** LlamaIndex·LangChain엔 `core`와 모든 통합 패키지가 함께 움직여야. "abstract class" 오류가 정확히 부분 업그레이드. 한 패키지가 아니라 세트 업그레이드.
- **모든 프로젝트 격리** 자기 virtualenv나 컨테이너에. 시스템 Python에 절대 설치 말 것. Python 베이스 이미지 플러스 lockfile 핀 컨테이너가 호스팅 강의 노트북이 사실상 하는 것, 로컬 학습자가 보통 건너뛰는 것.
- **폐기 경고를 노이즈가 아니라 시계로.** 경고 보이게 실행; 각각 대체와 흔히 제거 버전 명명. 침묵 경고가 작동 앱이 다음 통상 업그레이드에 깨진 것 되는 법.
- **패키지뿐 아니라 모델 ID 핀.** 모든 SDK·에이전트 하네스 호출에 모델 명시 설정, 패키지 업그레이드가 모델 스왑 실을 수 있으니. 수명주기를 (모델, 플랫폼) 쌍별 추적, 같은 모델이 벤더 API·Bedrock·Google Cloud·Foundry서 다른 날짜 은퇴하니.
- **모든 업그레이드 후 텔레메트리 검증.** 스팬·토큰 수·목이 여전히 제공자 호출 보는지 확인; 전송 변화가 오류 없이 눈멀게 할 수 있음.

---

## 프레임워크 vs 원시 SDK vs 얇은 계층

라이브 2026 질문, 프레임워크 존재의 원 이유가 부분 증발했으니. LangChain·LlamaIndex 등장 때 제공자 API가 비일관적이고 통합 계층이 값함. 이후 도구/함수 호출과 구조화 출력이 주요 제공자 SDK 걸쳐 네이티브·유사 기능으로 수렴, 그래서 프레임워크 추상화 가치가 줄고 변동 비용은 안 줆.

| 고도 | 쓸 때 | 비용 |
|----------|----------|------|
| **원시 제공자 SDK**(`anthropic`·`openai`) | 몇 모델 호출하고, 가장 안정 표면과 명확 스택 트레이스 원하거나, 라이브러리 코드 작성 | 검색·에이전트 루프·재시도를 스스로 구축 |
| **프레임워크**(LangChain·LlamaIndex) | 통합 폭(수십 벡터 스토어·로더)이나 빠르게 움직일 배터리 포함 RAG/에이전트 스캐폴딩 필요 | 의존성 난립·깊은 스택 트레이스·버전 변동 |
| **얇은 계층**(SDK 위 자기 인터페이스) | 호출 지점 안 건드리고 모델·프레임워크 스왑 원하는 프로덕션 시스템 | 약간의 선행 설계 |

프로덕션엔 얇은 계층이 흔히 스위트 스폿: 제공자 SDK(나 `langchain-core`만) 의존, 자기 작은 인터페이스 뒤 래핑, 프레임워크 세부를 한 교체 가능 모듈에 유지. 원시 SDK도 변동 없음 아님(양 주요 Python SDK가 2026-08 HTTP 전송 바꾸고 Anthropic이 샘플링 파라미터 제거), 그러나 변화가 적고 한 곳 문서화되고 당신의 한 모듈에 안착. 추상화 누출 엄지 법칙: 계층이 디버그에 이해해야 할 것(검색 랭킹·토큰 예산·도구 호출 루프)을 더 숨길수록 더 위험. 누출 에이전트 추상화가 정확히 LangChain이 LangGraph 구축하게 민 것. 깊은 선택은 [프레임워크 선택 가이드](08-framework-selection-guide.md) 참고.

---

## 버전 간 전이되는 것

이게 내구 학습의 핵심. 프레임워크 *API* 반감기가 대략 1년. 그 아래 *개념* 반감기가 분야 자체. 그에 맞춰 투자.

**전이(깊이 학습):**
- **RAG 메커니즘:** 청킹·분할 전략·임베딩 플러스 유사도 검색·검색·재순위·문맥 관련성/근거성/답 관련성 평가 삼총사. 모든 `VectorStoreIndex` 개명 생존.
- **에이전트 루프:** 모델 호출·도구 선택·도구 실행·관찰·반복, 플러스 상태·메모리·human-in-the-loop. `AgentExecutor`·`create_agent`·수제 `while` 루프든 루프가 같음.
- **제공자 네이티브 프리미티브:** 도구/함수 호출·구조화 출력·스트리밍·토큰과 문맥 예산. 이제 벤더 걸쳐 표준화, 그래서 가장 내구 계층.
- **엔지니어링 규율:** lockfile·재현 환경·체인지로그 읽기·평가 하네스. 순수 전이 가치.

**전이 안 됨(과투자 말 것):** 정확 import 경로·클래스명·생성자 시그니처·이달의 전역 설정 객체(`ServiceContext` vs `Settings`)·이번 분기 축복받은 체인 헬퍼(`LLMChain` vs LCEL vs `create_agent`). 이를 암기가 감가 자산 암기.

---

## 업그레이드해야 할 때 마이그레이션

실제 코드베이스를 앞으로 옮겨야 할 때:

1. **브랜치서 업그레이드, lockfile 먼저**, 한 번에 많이가 아니라 한 메이저 단계씩(0.10→0.11→0.12).
2. **공식 codemod 실행**(있는 곳, `llamaindex-cli upgrade`), 그다음 폐기 경고·import 오류가 작업 목록 몰게.
3. **브릿지 패키지에 기댐**(`langchain-classic`·`llama-index-legacy`), 빅뱅 대신 점진 마이그레이션하며 앱 작동 유지. 프레임워크 파트너 패키지를 제공자 SDK·지원할 모델 ID와 함께 업그레이드, 한 번에 하나가 아니라.
4. **평가 하네스로 동작 확인**, import 해결뿐 아니라. 컴파일되나 검색 품질·에이전트 성공률 조용히 바꾸는 마이그레이션이 프로덕션 전 잡고 싶은 회귀. [LLM 평가](https://github.com/ombharatiya/ai-system-design-guide/blob/main/14-evaluation-and-observability/01-llm-evaluation.md)(영문) 참고.

---

## 내구 학습 플레이북

1. **루프를 한 번 원시 SDK로 구축**, 프레임워크 없이, 프레임워크가 자동화하는 걸 이해하게. 이후 프레임워크 실패를 훨씬 빨리 디버그.
2. **그다음 프레임워크 채택** 폭·속도 위해, 그러나 API를 얇은 인터페이스 뒤 교체 가능으로 취급.
3. **모든 걸 핀, lockfile 커밋, 폐기 경고 보이게 유지.**
4. **재암기가 아니라 재도출.** 프레임워크가 이름 바꾸면 새 API를 처음부터 재학습 대신 구현하는 프리미티브로 매핑("`create_agent`가 LangGraph의 에이전트 루프일 뿐").
5. **투자 전 강의 현재성 검증** 위 30초 검사로. 낡은 강의는 개념에, 프로젝트 현 문서는 코드에.

큐레이트·현재성 검사 강의는 [COURSES.md](https://github.com/ombharatiya/ai-system-design-guide/blob/main/COURSES.md)(영문) 참고. 그 파일이 날짜 있고 재검증되는 이유가 정확히 이 페이지 기술 변동.

---

## 면접 질문

### Q: 동료가 6개월 된 LlamaIndex 튜토리얼 따랐는데 import에 실패. 무슨 일이고 어떻게 고치나?

**좋은 답변:**
튜토리얼이 구 핀 버전에 녹화됐고, fresh 설치가 패키지 레이아웃 바뀐 새것 당김. v0.10부터 LlamaIndex가 `llama-index-core` 플러스 별도 통합 패키지, 그래서 `from llama_index import SimpleDirectoryReader` 같은 톱레벨 import가 이제 `from llama_index.core import SimpleDirectoryReader`여야, `ServiceContext`가 전역 `Settings` 객체 위해 v0.11에 제거됨. 오류가 대신 "can't instantiate abstract class OpenAI"면 코어와 OpenAI 통합 패키지가 드리프트한 부분 업그레이드; 수정이 함께 업그레이드. 내구 수정이 환경 재현 가능케 하는 핀 lockfile과 추측 대신 마이그레이션 가이드 읽기. 장기엔 동료를 프로젝트 현 퀵스타트의 코드로 가리키고 튜토리얼을 개념에만.

### Q: 이 프레임워크들이 얼마나 빨리 변동하는지 고려하면, 아예 쓸지 어떻게 결정하나?

**좋은 답변:**
프레임워크가 실제 사주는 걸 봄. 원 일이 비일관 제공자 API 매끈하게였으나, 도구 호출·구조화 출력이 주요 SDK 걸쳐 수렴, 그래서 그 가치 줆. 통합 폭이나 빠르게 움직일 배터리 포함 스캐폴딩 필요하면 프레임워크 값함. 몇 모델 호출하거나 라이브러리 코드 작성하면 원시 제공자 SDK가 더 안정·디버그 쉬움. 프로덕션엔 보통 SDK를 자기 얇은 인터페이스 뒤 래핑, 프레임워크·모델 스왑이 한 모듈 건드리게. 뭘 고르든 핀·락하고 프레임워크 특정 코드 격리, 이번 분기 축복받은 API가 폐기될 거라 가정하니.

### Q: 에이전트 과제당 비용이 40% 오르고 톤이 하룻밤 바뀜, 당신 측 코드·의존성 변경 없이. 무슨 일이고 다음엔 어떻게 놓칠 수 없게?

**좋은 답변:**
"우리 측 변경 없음"이 보통 우리가 *핀* 안 한 변경 없음 의미. 첫 검사: 무엇이 모델 암묵 해결했나(SDK나 하네스 기본값·`-latest` 별칭·Foundry가 `gpt-4o` 2024-05-13 배포 `gpt-5.6-sol`로 옮기는 클라우드 자동 업그레이드), CI나 개발자 머신서 플로팅 도구 버전 업데이트했나(Claude Code·Codex CLI 둘 다 2026-09 기본 모델 변경), 제공자가 스냅샷 은퇴 리디렉트 같은 서버 측 뭔가 바꿨나. 트레이스가 호출별 해결 모델 ID 기록하면 빨리 답, 그게 요청한 모델이 아니라 제공자 보고 모델 로그하는 이유. 방지가 세 습관: 도처 명시 모델 ID·모든 SDK와 에이전트 CLI 핀 버전과 평가 게이트 통한 업그레이드·과제당 비용과 토큰과 캐시 적중률 경보, 조용한 스왑이 같은 날 이상으로 나타나게.

### Q: 벤더·클라우드 걸쳐 분기 폐기 달력 생존하는 모델 레지스트리를 설계하라.

**좋은 답변:**
핵심이 단위: 모델별이 아니라 (모델, 플랫폼, 리전) 쌍별 수명주기 레코드, 같은 모델이 이제 벤더 API·Bedrock·Google Cloud·Foundry서 다른 날짜 은퇴하니(Claude Opus 4.1이 2026-08 Claude API 떠났으나 Bedrock서 2027-01까지). 각 레코드가 핀 ID·"no sooner than" 플로어·발표 종료일·벤더 통지 정책(OpenAI가 GA 모델 6개월·전문 변종 3개월·프리뷰 2주만큼; Anthropic 60일; 2026-09-07부터 론치 Bedrock 모델 6개월이나 45일)·평가 승인 대체 보유. 일간 작업이 폐기 페이지·체인지로그 스크랩해 레지스트리와 diff. 경보가 90·60·30일에 발사, 페일오버 경로가 타깃이 주보다 먼저 은퇴 안 할 때만 유효. Bedrock Legacy 규칙이 검사 하나 더 추가: 모델이 Legacy 진입하면 기존 고객이 15일 비활성 후 접근 상실 가능, 그래서 Legacy 모델 재해 복구 경로가 합성 하트비트나 더 나은 대체 필요.

---

## 참고 문헌

- LlamaIndex v0.10 migration guide: https://developers.llamaindex.ai/python/framework/getting_started/v0_10_0_migration/
- LlamaIndex ServiceContext to Settings guide: https://developers.llamaindex.ai/python/framework/module_guides/supporting_modules/service_context_migration/
- LlamaIndex Workflows 1.0 announcement (June 2025): https://www.llamaindex.ai/blog/announcing-workflows-1-0-a-lightweight-framework-for-agentic-systems
- LangChain and LangGraph 1.0 (Oct 2025): https://www.langchain.com/blog/langchain-langgraph-1dot0
- LangChain v0.3 migration (Pydantic v2): https://docs.langchain.com
- `uv` (lockfiles and reproducible environments): https://docs.astral.sh/uv/
- PEP 751 (`pylock.toml`, standard lockfile format): https://peps.python.org/pep-0751/
- LangChain release policy: https://docs.langchain.com/oss/python/release-policy
- Haystack 3.0.0 release notes (Jul 2026): https://github.com/deepset-ai/haystack/releases/tag/v3.0.0
- OpenAI deprecations: https://developers.openai.com/api/docs/deprecations
- Anthropic model deprecations: https://platform.claude.com/docs/en/about-claude/model-deprecations
- Amazon Bedrock model lifecycle: https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html
- OpenAI Python SDK `httpx2` notes: https://github.com/openai/openai-python/blob/main/httpx2.md
- Promptfoo. "Promptfoo is joining OpenAI" (Mar 2026): https://www.promptfoo.dev/blog/promptfoo-joining-openai/

---

*다음: [문서 처리](https://github.com/ombharatiya/ai-system-design-guide/blob/main/10-document-processing/01-ocr-and-layout.md)(영문)*
