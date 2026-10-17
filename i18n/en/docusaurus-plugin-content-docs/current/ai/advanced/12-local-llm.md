---
title: 12. Local LLM
sidebar_label: 12. Local LLM
sidebar_position: 3
description: The concept, trade-offs, and security meaning of running an LLM in your own environment
---

# 12. Local LLM

A **local LLM** runs on your own PC/in-house server rather than an external service.

## Cloud vs local

A cloud LLM transmits input externally; a local LLM keeps data within your environment.

| | Cloud LLM | Local LLM |
|---|---|---|
| Data transfer | To an external provider | Within your environment |
| Performance | Top-tier models possible | Limited by hardware |
| Cost | Usage-based | Upfront hardware, then free |
| Offline | No | Yes |
| Management | Provider-run | Self-install/operate |

This "no data egress" property is why local scores high on the data-handling axis of [AI security tools](/en/security/ai-for-security/ai-tools/overview).

## Running it (concept)

With a runner like Ollama, download an open-source model (Llama, Mistral, Qwen) and run inference locally. With a GPU it's fast; small models can run on CPU.

## Limits

- Top-tier performance still often favors cloud models.
- Large models require high-spec hardware (especially GPU memory).
- You install, update, and manage security yourself.

Splitting sensitive data to local and general work to cloud is a practical strategy.
