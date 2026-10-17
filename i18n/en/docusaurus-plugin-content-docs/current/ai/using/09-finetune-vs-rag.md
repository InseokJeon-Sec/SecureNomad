---
title: 09. Fine-tuning vs RAG vs Prompting
sidebar_label: 09. Fine-tuning vs RAG
sidebar_position: 4
description: Comparing the three ways to inject knowledge/behavior into AI, and when to use which
---

# 09. Fine-tuning vs RAG vs Prompting

There are broadly **three ways** to make AI answer the way you want. They don't compete — they **serve different purposes.**

## At a glance

| | Prompting | RAG | Fine-tuning |
|---|---|---|---|
| **What** | Give instructions/context as input | Retrieve and attach external material | Further-train the model |
| **Best for** | Format, tone, simple context | Reflecting **recent/internal knowledge** | Embodying **a specific tone/format/expertise** |
| **Cost/difficulty** | Easiest/cheapest | Medium (needs a pipeline) | High (data/training cost) |
| **Updating knowledge** | Input each time | Just update the store | Requires retraining |
| **Analogy** | Asking good questions | Open-book exam | Studying until it's internalized |

## When to use which

| Goal | Recommendation |
|---|---|
| Just change answer format/tone | **Prompting** |
| Answer from our docs/recent info | **RAG** |
| "Internalize" a specific domain's tone/judgment | **Fine-tuning** |
| Both accurate facts + specialized style | **RAG + fine-tuning together** |

## Recommended decision order

```text
1) Can prompting solve it?   →  if so, done. (cheapest and fastest)
2) If not: is knowledge lacking?  →  RAG
3) Still lacking: do you need style/expertise?  →  Fine-tuning
```

:::tip Prompting + RAG is enough for most
Fine-tuning carries heavy cost/management overhead. Solve "lack of knowledge" with **RAG** and "things instructions can do" with **prompting** first, and fine-tune only when truly necessary.
:::

## Common misconceptions

- "To make it know recent info, fine-tune?" → **No.** Injecting knowledge is cheaper and more flexible with **RAG**.
- "Does fine-tuning eliminate hallucination?" → It may reduce it but isn't a fundamental fix. **RAG** handles factual grounding.

## Next

That covers "the core of using LLMs." Now we move to **agents**, where AI uses tools itself. → [10. AI agents · tools · MCP](../advanced/10-agents-mcp.md)
