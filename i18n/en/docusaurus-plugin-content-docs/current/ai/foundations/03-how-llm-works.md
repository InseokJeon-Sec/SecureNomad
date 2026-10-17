---
title: 03. How an LLM Works
sidebar_label: 03. How It Works
sidebar_position: 3
description: Tokens, next-token prediction, and the role of the Transformer and attention
---

# 03. How an LLM Works

Operation is three steps: **tokenize → predict the next token → repeat.**

## 1. Tokens

An LLM processes text in **tokens**, not characters or words. A token is roughly a word or part of a word.

```text
"Security matters"  →  [Secur] [ity] [ matters]   (splitting varies by model)
"security"          →  [sec] [urity]
```

English is ~1 word ≈ 1–1.5 tokens; Korean splits more finely. Cost and length limits are all based on **token count** (the context window in [06. Prompting](../using/06-prompting.md)).

## 2. Next-token prediction

It computes the probability of the token following the tokens so far, picks one, and appends it.

```text
Input:   "The capital of South Korea is"
Predict: Seoul (92%) · Busan (3%) · Pyongyang (1%) · ...
```

A high `temperature` also selects lower-ranked tokens (more varied); a low one is conservative/consistent.

## 3. Transformer and attention

The base structure is the **Transformer**, whose core is **attention**. Attention decides which tokens in the context to weight when predicting the next token. In "withdrew money from the **bank**" vs "sat on the river **bank**," the meaning of 'bank' is read differently from surrounding tokens. The 2017 Transformer is the basis of current LLMs.

```text
[next-token prediction]
   ▲   attention: weight important tokens in context
[N Transformer layers]  ← more abstract meaning layer by layer
   ▲
[token embeddings]  ← each token to a numeric vector (→ 08. Embeddings)
```

See [Attention & Transformer (deep dive)](../deep-dive/attention.md) for the computation.
