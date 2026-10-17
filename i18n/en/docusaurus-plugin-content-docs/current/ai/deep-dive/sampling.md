---
title: Sampling and Decoding (Technical Deep Dive)
sidebar_label: Sampling & Decoding
sidebar_position: 3
description: How the next token is chosen from logits — temperature, top-k, top-p (nucleus), repetition penalty, greedy and beam search
tags: [AI, sampling, decoding, temperature, deep-dive]
---

# Sampling and Decoding (Technical Deep Dive)

:::note Prerequisite
At the final step in the [attention doc](./attention.md), the model produces `logits → softmax → next-token probability distribution`. This document covers **how a token is actually chosen** from that distribution (the decoding strategy).
:::

## 1. Starting point — the probability distribution

At each step the model outputs a probability over the whole vocabulary.

```text
logits (raw scores)  →  softmax(logits / T)  →  P(token)
e.g.: Seoul 0.60 · Busan 0.15 · Pyongyang 0.10 · Daejeon 0.05 · ...
```

How you pick one from this distribution is the **decoding strategy**, and it governs the answer's creativity, consistency, and repetition.

## 2. Temperature (T) — sharpness of the distribution

Divide the softmax by a **temperature T** to change the distribution's shape.

```text
P_i = exp(logit_i / T) / Σ exp(logit_j / T)
```

| T | Effect |
|---|---|
| T → 0 | Distribution sharpens → pick only #1 (converges to greedy), consistent/conservative |
| T = 1 | Original distribution as-is |
| T > 1 | Distribution flattens → diverse/creative, but risk of nonsense |

```text
logits=[2.0, 1.0, 0.1]
T=0.5 → [0.87, 0.12, 0.01]   (sharp)
T=1.0 → [0.66, 0.24, 0.10]
T=2.0 → [0.51, 0.31, 0.18]   (flat)
```

## 3. Greedy / Beam Search — deterministic methods

```text
Greedy : pick the #1 probability at each step. Fast but monotonous, stuck in local optima
Beam   : keep the top-b candidate paths simultaneously, searching for the highest overall-probability sentence
         → good for "near-correct" outputs like translation/summarization; can be dull for chat
```

## 4. Top-k sampling — candidate limiting

Keep only the **top k tokens** by probability, discard the rest, then sample within them (after renormalizing).

```text
k=3 → keep {Seoul 0.60, Busan 0.15, Pyongyang 0.10}, renormalize, then sample
```

- Pro: blocks the nonsensical long tail
- Con: k is fixed, so it doesn't adapt to the situation (sharp/flat distribution)

## 5. Top-p (Nucleus) sampling — cumulative-probability limiting

Add probabilities from highest down, keeping only tokens until the **cumulative sum reaches p (e.g., 0.9)**.

```text
p=0.9 → cumulative 0.60 → 0.75 → 0.85 → 0.90 reached
        → keep tokens up to that point, renormalize, then sample
```

- Few candidates when the distribution is sharp, many when flat → **situation-adaptive**, so used more widely than top-k
- Usually used together with temperature

## 6. Repetition suppression

LLMs tend to repeat phrases, so we correct for it.

| Technique | Method |
|---|---|
| repetition penalty | Lower the logit of tokens already produced |
| frequency penalty | More penalty the more a token appeared |
| presence penalty | Penalty if it appeared at all (encourages new topics) |
| no-repeat n-gram | Forbid the same n-gram reappearing |

## 7. Typical settings

| Use | Setting (example) |
|---|---|
| Factual QA / code | T 0–0.3, top-p 1.0 (deterministic/consistent) |
| General chat | T 0.7, top-p 0.9 |
| Creative / brainstorming | T 0.9–1.2, top-p 0.95 |

:::info Why the same question gives different answers
With temperature>0 + sampling, tokens are drawn **probabilistically**. To reproduce exactly, you need T=0 (greedy) or a fixed seed.
:::

## 8. Summary

```text
logits → (/T) softmax → [limit candidates via top-k / top-p] → [repetition penalty] → sample
```

| Knob | What it changes |
|---|---|
| temperature | Sharpness of the distribution (creativity ↔ consistency) |
| top-k | Fix candidates to the top k |
| top-p | Candidates up to cumulative probability p (adaptive) |
| penalties | Suppress repetition |

- Previous: [Attention and Transformer (deep dive)](./attention.md)
