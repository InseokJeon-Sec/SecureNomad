---
title: 01. AI(LLM) 취약점 진단 랩 (Ollama + PyRIT)
sidebar_label: 01. AI 랩 (PyRIT)
sidebar_position: 1
description: Ollama로 로컬 LLM을 띄우고 Microsoft PyRIT로 프롬프트 인젝션·탈옥·시스템 프롬프트 유출을 자동 시도·채점·리포트까지 실습하는 격리 환경 구성
---

# 01. AI(LLM) 취약점 진단 랩 (Ollama + PyRIT)

웹 취약점을 다룬 방식 그대로, 이번엔 **LLM 자체**를 진단 대상으로 삼는다.
프롬프트 인젝션·탈옥(jailbreak)·유해 응답 유도·시스템 프롬프트 유출을 자동으로 시도하고, 그 결과를 **채점·리포트**한다. 기준표는 **OWASP Top 10 for LLM Applications**를 쓴다. (→ [09. MITRE ATLAS](../../security/ai-security-assessment/09-mitre-atlas.md), [00. 실습 원칙과 범위](../ai-pentest/00-approach-and-ethics.md))

![AI 취약점 진단 랩 구조](/img/security/lab-ai-pyrit-ko.svg)

## 1. 구성 요소

| 요소 | 역할 |
|---|---|
| **Ollama** | 로컬에서 LLM을 띄우는 런타임(진단 **대상**, `:11434`) |
| **PyRIT** | Microsoft의 생성형 AI 레드팀 도구(공격 프롬프트 생성·전송·채점) |
| **OWASP LLM Top 10** | 결과를 정리하는 기준표 |

:::info 왜 로컬인가
대상 LLM을 로컬(Ollama)에 두면 **외부로 아무것도 나가지 않고**, 유해 프롬프트를 마음껏 시험해도 외부 서비스 약관이나 비용 문제에서 자유롭다.
:::

## 2. Ollama 설치·모델 실행

[ollama.com](https://ollama.com)에서 설치한 뒤, 작은 모델부터 받는다.

```bash
ollama pull llama3.2:3b
ollama run llama3.2:3b        # 동작 확인
```

Ollama는 설치와 동시에 `http://localhost:11434`에서 **OpenAI 호환 API**(`/v1`)를 제공한다. PyRIT는 이 엔드포인트로 대상 모델에 접속한다.

:::tip GPU
GPU가 있으면 추론이 훨씬 빠르다. CPU만으로도 작은 모델(3B급)은 실습에 충분하다.
:::

## 3. PyRIT 설치

Python 가상환경(권장 3.11~3.13)에서 설치한다.

```bash
python3 -m venv pyrit-env
source pyrit-env/bin/activate      # Windows: pyrit-env\Scripts\activate
pip install pyrit
python -c "import pyrit; print(pyrit.__version__)"   # 설치 확인
```

:::caution 버전에 민감
PyRIT는 버전에 따라 API가 바뀐다(오케스트레이터 → Attack 클래스 등). 아래 예시가 안 맞으면 [공식 문서](https://microsoft.github.io/PyRIT)의 설치 페이지를 기준으로 맞춘다.
:::

## 4. Ollama를 대상으로 지정

PyRIT의 `OpenAIChatTarget`에 Ollama의 `/v1` 엔드포인트를 넣는다. 최소 예시는 다음과 같다.

```python
import asyncio
from pyrit.setup import IN_MEMORY, initialize_pyrit_async
from pyrit.executor.attack import PromptSendingAttack
from pyrit.prompt_target import OpenAIChatTarget

async def run():
    await initialize_pyrit_async(memory_db_type=IN_MEMORY)
    target = OpenAIChatTarget(
        endpoint="http://localhost:11434/v1",   # Ollama (OpenAI 호환)
        api_key="ollama",                        # 로컬용 자리표시자
        model_name="llama3.2:3b",
    )
    attack = PromptSendingAttack(objective_target=target)
    result = await attack.execute_async(objective="여기에 진단 목표를 쓴다")
    print(result)

asyncio.run(run())
```

여기에 PyRIT의 **스코어러**를 붙이면, 응답이 목표(예: 유해 응답·시스템 프롬프트 노출)에 도달했는지 자동 판정한다. 구체적인 공격 프롬프트는 이 문서에서 다루지 않으며, **탐지·방어 관점**으로 결과를 해석한다.

## 5. OWASP LLM Top 10으로 정리

웹 랩과 같은 체계를 유지한다. 시도한 항목을 기준표에 매핑한다.

| 시도 | OWASP LLM 항목 |
|---|---|
| 프롬프트 인젝션·탈옥 | LLM01 |
| 시스템 프롬프트 유출 | LLM07 |
| 유해·민감 정보 노출 | LLM02 |

전체 기준표는 [08. OWASP LLM Top 10](../../security/ai-security-assessment/08-owasp-llm-top10.md)을 참고한다.

## 6. 안전·범위

- [ ] 대상 LLM은 **로컬(Ollama)**이며 외부 모델/서비스를 때리지 않는가
- [ ] 생성·수집한 유해 프롬프트·응답을 외부에 공개하지 않는가
- [ ] 결과는 **방어·평가·교육** 목적으로만 쓰는가

## 7. AI를 쓰는 지점

- PyRIT 설치 에러(빌드 의존성·버전) 해석
- 채점 결과를 **OWASP LLM Top 10 항목별 대응책**으로 정리
- 웹 랩(04)과 LLM 랩(05) 결과를 한 장의 위협 맵으로 묶기

## 관련

- [04. 웹 취약점 진단 랩 (Kali + HexStrike + Juice Shop)](../ai-pentest/04-lab-web-hexstrike.md)
