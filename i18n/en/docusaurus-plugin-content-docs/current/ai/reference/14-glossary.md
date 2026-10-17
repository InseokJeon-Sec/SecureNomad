---
title: 14. Glossary
sidebar_label: 14. Glossary
sidebar_position: 2
description: Key AI/LLM terms
---

# 14. Glossary

| Term | Definition |
|---|---|
| **LLM** | Large language model; generates text by predicting the next token ([02](../foundations/02-what-is-llm.md)) |
| **Token** | The model's text-processing unit (roughly a word/part); basis for cost/length |
| **Parameter** | Weights adjusted by training; capacity for knowledge/patterns |
| **Context window** | Token limit processable at once (input + output) |
| **Prompt** | The entire input to the model |
| **temperature** | Controls output randomness; high = varied, low = conservative |
| **Pre-training** | Stage 1, learning basic ability from vast text |
| **Fine-tuning** | Additional training for a purpose/format |
| **RLHF** | Tuning to preferred answers via human feedback |
| **Hallucination** | Generating plausible but wrong content ([05](../foundations/05-hallucination.md)) |
| **Embedding** | Converting meaning to a vector ([08](../using/08-embeddings.md)) |
| **Vector DB** | DB for storing vectors and similarity search |
| **RAG** | Retrieving/combining external evidence to answer ([07](../using/07-rag.md)) |
| **Transformer** | The neural architecture underlying modern LLMs |
| **Attention** | The Transformer core that weights important parts of context |
| **Tool/function calling** | A feature letting the LLM call external functions to act ([10](../advanced/10-agents-mcp.md)) |
| **Agent** | AI that plans, uses tools, and iterates to meet a goal |
| **MCP** | A standard protocol connecting AI and tools |
| **Multimodal** | Processing text + images/audio/documents together ([11](../advanced/11-multimodal.md)) |
| **Local LLM** | A model run in your own environment ([12](../advanced/12-local-llm.md)) |
| **Open model** | A model with public weights |
| **Prompt injection** | An attack hijacking the model's instructions via malicious input |
