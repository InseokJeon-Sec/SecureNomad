---
title: 13. Model & Provider Landscape
sidebar_label: 13. Model Landscape
sidebar_position: 1
description: The closed/open model split and criteria for choosing
---

# 13. Model & Provider Landscape

LLMs split into **closed (commercial API)** and **open (public weights)**.

| Type | Traits | Examples |
|---|---|---|
| Closed | API use, top-tier performance, weights not public | OpenAI (GPT), Anthropic (Claude), Google (Gemini) |
| Open | Download and run/customize directly | Meta (Llama), Mistral, Alibaba (Qwen) |

"Open" mainly means the weights are public and downloadable. License terms differ per model; check before commercial use.

## Criteria

| Criterion | Check |
|---|---|
| Performance | Enough for the task (coding, reasoning, Korean, etc.) |
| Data handling | Does input leave externally → if sensitive, open/local ([12](../advanced/12-local-llm.md)) |
| Cost | Usage-based vs self-hosting |
| Context window | How much fits at once |
| License | Commercial-use/redistribution terms |

Rankings and prices change constantly, so choose the model that fits the task/constraints rather than the current #1. A mix — local open models for sensitive work, cloud for general work — is common.
