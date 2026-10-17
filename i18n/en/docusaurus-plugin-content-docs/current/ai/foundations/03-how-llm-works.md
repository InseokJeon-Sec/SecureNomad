---
title: 03. How an LLM Works
sidebar_label: 03. How It Works
sidebar_position: 3
description: Tokens, next-word prediction, Transformer and attention — explained with simple analogies, no math
---

# 03. How an LLM Works

An LLM's operation can be summarized in three steps: **① split into tokens → ② predict the next token → ③ repeat**.

## 1. Tokens — the unit by which AI sees text

An LLM handles text in pieces called **tokens**, not characters or words.
A token is roughly **a word or part of a word**.

```text
"Security matters"  →  [Secur] [ity] [ matters]   (example; actual splitting varies by model)
"security"          →  [sec] [urity]
```

- English is roughly **1 word ≈ 1–1.5 tokens**; Korean splits more finely.
- Cost and length limits are all based on **token count**. (→ context window, [06. Prompting](../using/06-prompting.md))

## 2. Next-token prediction

The essential operation of an LLM is just one thing: it **computes "the probability of the token that comes after the tokens so far."**

```text
Input:   "The capital of South Korea is"
Predict: Seoul (92%) · Busan (3%) · Pyongyang (1%) · ...
→ pick the highest-probability 'Seoul'
```

It **repeats this one token at a time** to complete a sentence. That's why answers stream out from left to right.

:::info temperature — how much to 'take risks'
If you always pick the #1 token, answers are predictable. A high **temperature** occasionally picks the #2/#3 token for more creativity/variety; a low one is conservative/consistent.
:::

## 3. Transformer and attention (why it reads context well)

An LLM's brain structure is called a **Transformer**. Its core device is **attention**.

- Attention decides **which words in the sentence to 'focus on'** when predicting the next token.
- Example: "withdrew money from the **bank**" vs "sat on the river **bank**" — it interprets 'bank' differently based on surrounding words.
- Thanks to this, it captures relationships (context) between distant words well. The 2017 arrival of the Transformer opened today's LLM era.

```text
[next-token prediction]
   ▲   focus (attention): weight the important words in prior context
   │
[many Transformer layers]  ← grasps more abstract meaning layer by layer
   ▲
[token embeddings]  ← convert each token to a numeric vector (→ 08. Embeddings)
```

## Summary

- LLM = **predict the next token probabilistically, token by token, repeat**
- The Transformer's **attention** reads context and raises prediction quality.
- Next: **how** this ability is **trained**. → [04. How it's trained](./04-training.md)
