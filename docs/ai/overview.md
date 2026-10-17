---
title: AI 기초
sidebar_label: Overview
sidebar_position: 0
slug: /ai
description: LLM이 무엇이고 어떻게 동작하는지, RAG·임베딩·에이전트까지 — AI를 개념부터 쉽게 정리한 학습 자료
---

# AI 기초

요즘 가장 뜨거운 주제인 **AI(특히 LLM, 대규모 언어 모델)** 를 개념부터 차근차근 정리합니다.
수식 없이, IT·보안 배경이 있는 사람이 "원리를 이해하는" 데 초점을 둡니다.

:::tip 이 섹션의 성격
- **AI 기초(여기)**: AI *기술 자체*를 이해 — LLM이 뭔지, 어떻게 동작하는지
- **[AI for Security](/security/ai-for-security/overview)**: AI를 *보안에* 활용하는 쪽
:::

## 학습 경로

### 기초 — 큰 그림과 동작 원리
1. [용어 정리](./foundations/01-terms.md) — AI / 머신러닝 / 딥러닝 / 생성형 AI
2. [LLM이란 무엇인가](./foundations/02-what-is-llm.md)
3. [LLM은 어떻게 동작하나](./foundations/03-how-llm-works.md) — 토큰, 다음 단어 예측
4. [어떻게 학습되나](./foundations/04-training.md) — 사전학습 · 파인튜닝 · RLHF
5. [환각과 한계](./foundations/05-hallucination.md) — 왜 틀리나

### 활용 — 프롬프트·RAG
6. [프롬프트 기초](./using/06-prompting.md)
7. [RAG (검색 증강 생성)](./using/07-rag.md)
8. [임베딩과 벡터 DB](./using/08-embeddings.md)
9. [파인튜닝 vs RAG vs 프롬프트](./using/09-finetune-vs-rag.md)

### 확장 — 에이전트·로컬 LLM
10. [AI 에이전트 · 툴 · MCP](./advanced/10-agents-mcp.md)
11. [멀티모달](./advanced/11-multimodal.md)
12. [로컬 LLM](./advanced/12-local-llm.md)

### 심화 — 기술 상세
LLM 내부 계산과 RAG 동작을 수식·구조 수준에서 자세히 다룹니다. (개념을 먼저 본 뒤 읽는 것을 권장)

- [토크나이저와 BPE (심화)](./deep-dive/tokenizer.md) — 서브워드 분할, 한국어가 토큰을 더 쓰는 이유
- [어텐션과 트랜스포머 (심화)](./deep-dive/attention.md) — Q·K·V, Scaled Dot-Product, 멀티헤드, 인과 마스킹
- [샘플링과 디코딩 (심화)](./deep-dive/sampling.md) — temperature·top-k·top-p·반복 억제
- [RAG 내부 동작 (심화)](./deep-dive/rag-internals.md) — 청킹·임베딩·벡터 유사도·ANN·리랭킹·컨텍스트 주입
- [파인튜닝과 LoRA (심화)](./deep-dive/finetuning-lora.md) — PEFT·LoRA·QLoRA의 동작 원리
- [추론 최적화 (심화)](./deep-dive/inference-optimization.md) — KV 캐시·양자화·FlashAttention·배칭

### 참고
13. [모델·제공자 지형](./reference/13-model-landscape.md)
14. [용어 사전](./reference/14-glossary.md)

> 순서대로 읽으면 "AI가 뭔지" 큰 그림이 잡히도록 구성했습니다. 필요한 주제만 골라 봐도 됩니다.
