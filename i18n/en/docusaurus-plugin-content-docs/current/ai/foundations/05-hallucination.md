---
title: 05. Hallucination & Limits — Why It Gets Things Wrong
sidebar_label: 05. Hallucination & Limits
sidebar_position: 5
description: The cause of hallucination, how to mitigate it, and other limits
---

# 05. Hallucination & Limits

An LLM confidently generates plausible but wrong content. This is **hallucination** — not a bug but a characteristic stemming from "generation, not lookup" ([02](./02-what-is-llm.md)).

## Causes

![How hallucination arises — generation by probability, not lookup](/img/ai/hallucination-flow-en.svg)

- It tries to fill blanks naturally even when it doesn't know, because "a plausible statement" may be learned as more probable than "I don't know."
- It produces nonexistent papers, precedents, functions, or URLs in correct form only.
- Confidence and accuracy are unrelated; a confident tone can still be wrong.

## High-risk situations

| Situation | Risk |
|---|---|
| Recent events | After training → unknown → fabricated |
| Specific numbers/dates/citations | Easily fabricated |
| Professional/legal/medical | Large damage if wrong |
| Existence questions | May claim the nonexistent exists |

## Mitigation

| Method | Description |
|---|---|
| Provide evidence (RAG) | Answer within trusted material ([07](../using/07-rag.md)) |
| Require sources | Instruct to cite, and to say "don't know" when unknown |
| Human verification | Check numbers/citations/code yourself; treat output as a draft |
| Low temperature | Be conservative for factual work |
| Cross-check | Re-verify important content against other sources |

## Other limits

- **Recency**: nothing after the training cutoff
- **Consistency**: different answers each time
- **Context limit**: a cap on what it processes at once
- **Bias**: may reflect training-data bias
