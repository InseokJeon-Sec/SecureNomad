---
title: 13. Model & Provider Landscape
sidebar_label: 13. Model Landscape
sidebar_position: 1
description: The big picture of major LLM providers and open/closed models — criteria for choosing
---

# 13. Model & Provider Landscape

LLMs split broadly into **closed (commercial API)** and **open (public weights)** models.

## Two branches

| Type | Traits | Representative examples |
|---|---|---|
| **Closed (commercial)** | Used via API, top-tier performance, weights not public | OpenAI (GPT), Anthropic (Claude), Google (Gemini) |
| **Open (public weights)** | Can be downloaded and run directly, easy to localize/customize | Meta (Llama), Mistral, Alibaba (Qwen), etc. |

:::info What "open-source model" means
Here 'open' mainly means the **model weights are public** so you can download and use them. License terms differ per model, so check before commercial use.
:::

## Criteria when choosing

| Criterion | Question |
|---|---|
| **Performance** | Is it enough for this task (varies by task: coding, reasoning, Korean, etc.) |
| **Data handling** | Does input go outside → if sensitive, open/local ([see 12](../advanced/12-local-llm.md)) |
| **Cost** | Usage-based billing vs self-hosting |
| **Context window** | How much you can put in at once |
| **License** | Terms for commercial use/redistribution |

## Trends

- Model competition moves fast, so **rankings/prices change constantly.** Rather than fixating on the current #1, it matters to develop a sense for picking **"the model that fits my task/constraints"** at each moment.
- As open models' performance rises quickly, mixed strategies like **sensitive work on a local open model + general work on the cloud** are becoming common.

## Summary

- A trade-off between closed (performance/convenience) ↔ open (privacy/freedom)
- Choose by **data sensitivity + task nature + cost**.
- The latest comparisons always change, so treat this document as "the big picture" only.
