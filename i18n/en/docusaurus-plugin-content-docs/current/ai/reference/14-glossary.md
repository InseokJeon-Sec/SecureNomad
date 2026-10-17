---
title: 14. Glossary
sidebar_label: 14. Glossary
sidebar_position: 2
description: Key terms that come up often when working with AI/LLMs, in one page
---

# 14. Glossary

Key terms that appear often in AI/LLM documents, gathered in one page.

| Term | Meaning |
|---|---|
| **LLM** | Large language model. Generates text by predicting the next token ([02](../foundations/02-what-is-llm.md)) |
| **Token** | The chunk unit by which the model handles text (roughly a word/part of a word). Basis for cost/length |
| **Parameter** | Weights the model adjusts via training. The container for knowledge/patterns |
| **Context window** | The limit on tokens the model can see at once (input + output) |
| **Prompt** | The entire input to the model (instruction + context + question) |
| **temperature** | A knob for the answer's randomness/creativity. High = diverse, low = conservative |
| **Pre-training** | Stage 1, learning basic ability from vast text |
| **Fine-tuning** | Further training to fit a specific purpose/format |
| **RLHF** | Adjusting via human feedback to give preferred answers |
| **Hallucination** | Producing plausible but wrong content ([05](../foundations/05-hallucination.md)) |
| **Embedding** | Converting meaning into a numeric vector ([08](../using/08-embeddings.md)) |
| **Vector DB** | A DB that stores vectors and quickly finds similar ones |
| **RAG** | Retrieving relevant material and attaching it as evidence to answer ([07](../using/07-rag.md)) |
| **Transformer** | The neural-network architecture underlying modern LLMs |
| **Attention** | The Transformer's core device that 'focuses' on important parts of context |
| **Tool/function calling** | A feature that lets the LLM call external functions to act ([10](../advanced/10-agents-mcp.md)) |
| **Agent** | AI that plans, uses tools, and iterates on its own to accomplish a goal |
| **MCP** | A standard protocol connecting AI and tools (Model Context Protocol) |
| **Multimodal** | Handling text + images/audio/documents and more together ([11](../advanced/11-multimodal.md)) |
| **Local LLM** | A model run on your own PC/server. No external data transmission ([12](../advanced/12-local-llm.md)) |
| **Open model** | A model whose weights are public so you can download and use it |
| **Prompt injection** | An attack that hijacks the model's instructions via malicious input |

> More terms will be added here as they come up.
