---
title: 05. Hallucination & Limits — Why It Gets Things Wrong
sidebar_label: 05. Hallucination & Limits
sidebar_position: 5
description: The cause of 'hallucination' (fabricating facts) and practical ways to reduce it
---

# 05. Hallucination & Limits

An LLM sometimes **confidently fabricates plausible but wrong content.** This is called **hallucination**.
It's not a bug but **an intrinsic characteristic that stems from how the model works**.

## Why hallucination happens

An LLM doesn't "look up facts"; it **generates "a plausible next word"** ([see 02](./02-what-is-llm.md)).

- It tries to **fill blanks naturally** even for things it doesn't know, because "a plausible statement" may have been learned as more probable than "I don't know."
- It will produce nonexistent papers, precedents, functions, or URLs **in the right format only**.
- **Confidence and accuracy are separate.** A confident tone can still be wrong.

## When is it especially risky

| Situation | Risk |
|---|---|
| Recent events | After training → doesn't know → makes it up |
| Specific numbers/dates/citations | Easily fabricated plausibly |
| Professional/legal/medical | Big damage if wrong |
| Existence questions | May claim something nonexistent "exists" |

## Practical ways to reduce hallucination

| Method | Description |
|---|---|
| **Provide evidence (RAG)** | Supply trustworthy material and say "answer only from within this" → [07. RAG](../using/07-rag.md) |
| **Require sources** | Instruct "cite sources," "say you don't know if you don't" |
| **Verification habit** | **Check numbers/citations/code yourself**. Treat the AI answer as a first draft only |
| **Low temperature** | Be conservative for factual tasks |
| **Cross-check** | Re-verify important things against other sources |

:::tip The key attitude
It's safest to use AI as a **"fast draft generator" and have a human verify the facts**.
(→ The [AI vulnerability assessment labs](/en/security/ai-for-security/ai-tools/overview) also stress "don't trust AI answers as-is.")
:::

## Other limits

- **Recency**: doesn't know anything after the training cutoff
- **Consistency**: slightly different answers each time to the same question
- **Context limit**: a cap on how much it can see at once (context window)
- **Bias**: may reflect the biases of the training data as-is

## Summary

- Hallucination arises from the principle of "generation, not lookup."
- **Providing evidence + human verification** is the surest countermeasure.
- From the next part we look at how to actually use it well (prompting, RAG). → [06. Prompting basics](../using/06-prompting.md)
