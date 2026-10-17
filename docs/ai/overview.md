---
title: AI 기초
sidebar_label: Overview
sidebar_position: 0
slug: /ai
description: LLM의 정의·동작부터 RAG·임베딩·에이전트까지 정리한 AI 지식 자료
---

# AI 기초

AI(특히 LLM, 대규모 언어 모델)를 개념부터 정리한다. 수식 없이 원리 이해에 초점을 둔다.

:::info 섹션 구분
- **AI 기초(여기)**: AI 기술 자체 — LLM의 정의·동작
- **[AI for Security](/security/ai-for-security/overview)**: AI를 보안에 활용하는 쪽
:::

## 학습 경로

### 기초 — 큰 그림과 동작 원리
1. [용어 정리](./foundations/01-terms.md) — AI / 머신러닝 / 딥러닝 / 생성형 AI
2. [LLM이란 무엇인가](./foundations/02-what-is-llm.md)
3. [LLM은 어떻게 동작하나](./foundations/03-how-llm-works.md) — 토큰, 다음 토큰 예측
4. [어떻게 학습되나](./foundations/04-training.md) — 사전학습 · 파인튜닝 · RLHF
5. [환각과 한계](./foundations/05-hallucination.md)

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
- [토크나이저와 BPE](./deep-dive/tokenizer.md) — 서브워드 분할
- [어텐션과 트랜스포머](./deep-dive/attention.md) — Q·K·V, Scaled Dot-Product, 멀티헤드
- [샘플링과 디코딩](./deep-dive/sampling.md) — temperature·top-k·top-p
- [RAG 내부 동작](./deep-dive/rag-internals.md) — 청킹·임베딩·ANN·리랭킹
- [파인튜닝과 LoRA](./deep-dive/finetuning-lora.md) — PEFT·LoRA·QLoRA
- [추론 최적화](./deep-dive/inference-optimization.md) — KV 캐시·양자화·배칭

### 참고
13. [모델·제공자 지형](./reference/13-model-landscape.md)
14. [용어 사전](./reference/14-glossary.md)
