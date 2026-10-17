---
title: 09. Fine-tuning vs RAG vs Prompting
sidebar_label: 09. Fine-tuning vs RAG
sidebar_position: 4
description: Comparison of the three ways to inject knowledge/behavior, and how to choose
---

# 09. Fine-tuning vs RAG vs Prompting

There are three ways to make AI behave as intended; they don't compete — they serve different purposes.

| | Prompting | RAG | Fine-tuning |
|---|---|---|---|
| Method | Give instructions/context | Retrieve and combine external material | Further-train the model |
| Best for | Format, tone, simple context | Recent/internal knowledge | Embodying a tone/format/expertise |
| Cost/difficulty | Low | Medium (pipeline) | High (data/training) |
| Updating knowledge | Each input | Update the store | Retrain |

## How to choose

| Goal | Choice |
|---|---|
| Adjust answer format/tone | Prompting |
| Reflect internal docs/recent info | RAG |
| Embody a domain's judgment/tone | Fine-tuning |
| Accurate facts + specialized style | RAG + fine-tuning |

Decision order: **solve with prompting → if knowledge is lacking, RAG → if style/expertise is needed, fine-tuning.** Injecting knowledge is cheaper and more flexible with RAG; fine-tuning may reduce hallucination but isn't a fundamental fix (factual grounding is RAG's job).
