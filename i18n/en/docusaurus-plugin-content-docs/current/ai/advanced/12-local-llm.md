---
title: 12. Local LLM
sidebar_label: 12. Local LLM
sidebar_position: 3
description: The concept, pros/cons, and security implications of a local LLM you run on your own PC/server
---

# 12. Local LLM

A **local LLM** is a model you run **directly on your own PC or in-house server**, rather than an external service like OpenAI or Anthropic.

## Why local — why it matters to security staff

With a cloud LLM, input is **transmitted externally**. With a local LLM, **data never leaves your environment.**

| | Cloud LLM | Local LLM |
|---|---|---|
| Data transfer | Sent to an external provider | **Only within your environment** |
| Performance | Can use top-tier models | Limited by hardware |
| Cost | Usage-based billing | Upfront hardware, then free |
| Offline | Not possible | **Possible** |
| Management | Operated by the provider | Install/operate yourself |

This "data doesn't leave" point is why local scores high on the **data-handling axis** of [AI security tools](/en/security/ai-for-security/ai-tools/overview).

## How to run it (concept)

A representative tool is **Ollama**. With one command it downloads an open-source model (Llama, Mistral, Qwen, etc.) and runs it locally.

```text
[my PC/server]
  a runner like Ollama
     └ open-source model (weight files)
     └ inference with no external transmission
```

- You download and use an open-source model (one whose weights are public).
- With a GPU it's fast; without one it's slow, but small models can run on CPU.

## Limits

- **Top-tier performance still often favors cloud models.**
- Large models need **high-spec hardware (especially GPU memory)**.
- You must install, update, and manage security yourself.

## When to use it

- When you handle sensitive code/documents/logs and **external transmission is problematic**
- Air-gapped/offline environments
- When API costs are burdensome due to high volume

## Summary

- Local LLM = run it in your own environment → **data doesn't leave**
- Weigh performance/management overhead against **privacy/security** when choosing.
- For security staff, a split like "sensitive data local, general work cloud" is realistic.
