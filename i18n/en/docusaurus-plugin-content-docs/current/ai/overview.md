---
title: AI Basics
sidebar_label: Overview
sidebar_position: 0
slug: /ai
description: What an LLM is and how it works, through RAG, embeddings, and agents — AI organized from the ground up, the easy way
---

# AI Basics

A step-by-step walkthrough of today's hottest topic, **AI (especially LLMs, large language models)**, starting from the concepts.
No math — the focus is on helping people with an IT/security background "understand the principles."

:::tip What this section is
- **AI Basics (here)**: understand *AI technology itself* — what an LLM is, how it works
- **[AI for Security](/en/security/ai-for-security/overview)**: using AI *for security*
:::

## Learning path

### Foundations — big picture & how it works
1. [Terminology](/en/ai/foundations/terms) — AI / ML / deep learning / generative AI
2. [What is an LLM](/en/ai/foundations/what-is-llm)
3. [How an LLM works](/en/ai/foundations/how-llm-works) — tokens, next-word prediction
4. [How it's trained](/en/ai/foundations/training) — pretraining · fine-tuning · RLHF
5. [Hallucination & limits](/en/ai/foundations/hallucination) — why it gets things wrong

### Using — prompting & RAG
6. [Prompting basics](/en/ai/using/prompting)
7. [RAG (retrieval-augmented generation)](/en/ai/using/rag)
8. [Embeddings & vector DB](/en/ai/using/embeddings)
9. [Fine-tuning vs RAG vs prompting](/en/ai/using/finetune-vs-rag)

### Advanced — agents & local LLM
10. [AI agents · tools · MCP](/en/ai/advanced/agents-mcp)
11. [Multimodal](/en/ai/advanced/multimodal)
12. [Local LLM](/en/ai/advanced/local-llm)

### Deep Dive — technical detail
A detailed, formula/structure-level look at LLM internals and RAG. (Best read after the concepts.)

- [Tokenizers & BPE (deep dive)](/en/ai/deep-dive/tokenizer) — subword splitting, why Korean uses more tokens
- [Attention & Transformer (deep dive)](/en/ai/deep-dive/attention) — Q·K·V, Scaled Dot-Product, multi-head, causal masking
- [Sampling & decoding (deep dive)](/en/ai/deep-dive/sampling) — temperature · top-k · top-p · repetition suppression
- [RAG internals (deep dive)](/en/ai/deep-dive/rag-internals) — chunking · embeddings · vector similarity · ANN · reranking · context injection
- [Fine-tuning & LoRA (deep dive)](/en/ai/deep-dive/finetuning-lora) — how PEFT · LoRA · QLoRA work
- [Inference optimization (deep dive)](/en/ai/deep-dive/inference-optimization) — KV cache · quantization · FlashAttention · batching

### Reference
13. [Model & provider landscape](/en/ai/reference/model-landscape)
14. [Glossary](/en/ai/reference/glossary)

> Read in order for the big picture of "what AI is," or pick only the topics you need.
