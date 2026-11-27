---
title: Pre-training and Post-training — Alignment (Technical Deep Dive)
sidebar_label: Pre-training & Alignment
sidebar_position: 5
description: The two stages that make a model — pre-training (capability) and post-training/alignment (behavior). How 'refusal' is learned via SFT and RLHF, the three ways alignment breaks (jailbreak, fine-tuning reversal, distribution shift), the shallow-alignment hypothesis, and external-guardrail defense
tags: [AI, pre-training, post-training, alignment, RLHF, deep-dive]
---

import YouTube from '@site/src/components/YouTube';

# Pre-training and Post-training — Alignment (Technical Deep Dive)

Prefer to get the core ideas from a video first? See below ("AI Essentials" Deep Dive #5 — from "how it works" to "how it's made"; Korean audio).

<YouTube id="n0O1aEmweMY" title="How an AI gets tamed — Pre-training & post-training (alignment) | AI Essentials Deep Dive #5" />

:::note Prerequisite
The earlier deep dives — [attention](./attention.md), [tokenizer](./tokenizer.md), [sampling](./sampling.md), and [role separation](./roles-and-system-prompt.md) — covered **how a finished model processes input**. This document moves the view earlier: **how that model is made in the first place** (training), and how the second stage, **alignment**, connects to security.
:::

## 1. A model is made in two stages

An LLM is built in two broad stages. The first fixes **capability**; the second fixes **behavior**.

```text
[Stage 1] pre-training             [Stage 2] post-training = alignment
vast raw text, trillions of     →  behavior shaped by SFT + RLHF
tokens → base model                → a useful and safe model
(knowledge + reasoning)

'what it knows' = stage 1    'how it behaves' = stage 2
```

The key split: **knowledge and reasoning come from pre-training; behavior such as instruction-following and refusal comes from post-training (alignment).** And security mostly hinges on the back end — alignment.

## 2. Stage 1 — Pre-training (next-token prediction)

The method itself is simple: predict the token that follows `the cat is on the`, repeated trillions of times — **next-token prediction**.

```text
input: "the cat is on the"  →  predict: "roof" / "mat" / ...
        (weights updated by the error vs. the true token, trillions of times)
```

Through this the model gains grammar, world knowledge, and reasoning **capability**. But a base model that has only been through this stage does **not know what it should do**. It has no ability yet to follow instructions or refuse dangerous requests. Enormous capability, but untamed — not usable as a service as-is.

## 3. Stage 2 ① — Supervised Fine-Tuning (SFT)

The first step of post-training is **Supervised Fine-Tuning (SFT)**. Tens of thousands of human-written `question–ideal answer` pairs teach the model directly **how it should respond**.

- "Politely rewrite this email" → a courteous tone
- "Write this code" → code plus explanation

Here the model learns to follow instructions, match format and tone, and produce helpful answers. This is where a **frame of behavior** is laid over capability.

## 4. Stage 2 ② — Alignment (RLHF)

The second is **alignment**. The representative method is **RLHF (Reinforcement Learning from Human Feedback)**, which learns from human preference.

```text
same question → model produces answers A, B → a human picks the better one
            → collect choices → train a 'reward model' (judges what's a good answer)
            → fine-tune the model toward that preference
```

The result is a model shaped to behave **helpfully, harmlessly, honestly**. Crucially, the ability to **refuse** dangerous requests is also born in this stage. So **when this stage comes undone, refusal comes undone with it.**

## 5. What alignment is — balancing helpful, harmless, honest

Alignment is the process of making a model behave the way people want, usually aiming at three things.

| Aim | Meaning |
|---|---|
| **helpful** | carry out requests usefully |
| **harmless** | refuse harmful requests |
| **honest** | don't fabricate what it doesn't know |

These three often conflict. Push helpfulness all the way and it helps with dangerous requests; push safety all the way and it refuses perfectly fine questions. Alignment is finding the balance point between them **via human preference.**

:::caution Key point
**Refusal is not an innate property of the model — it is 'learned behavior.'** What is learned can be undone. This is exactly where security enters.
:::

## 6. How alignment breaks — three paths

| # | Path | What it is | Weight change |
|---|---|---|---|
| 1 | **jailbreak** | craft the input prompt to bypass refusal | none (behavior only) |
| 2 | **fine-tuning reversal** | re-train an open-weight model to strip the alignment layer | yes ([fine-tuning deep dive](./finetuning-lora.md)) |
| 3 | **distribution shift (OOD)** | alignment fails in languages/formats/contexts unseen in training | none (input is out of distribution) |

All three stab at the same weakness: **alignment is conditional.**

:::info Scope
This document aims to understand the **structure** of the three paths; it does not cover working attack methods or payloads.
:::

## 7. Why it breaks so easily — shallow alignment

One explanation is that alignment may be **shallow**.

```text
┌─────────────────────────────────────────────┐
│  alignment layer (thin; works only on        │  ← cracks under pressure
│  certain input distributions)                 │
├─────────────────────────────────────────────┤
│  the vast capability from pre-training        │  ← does not disappear
│  (stays intact)                               │
└─────────────────────────────────────────────┘
```

The vast capability gained in pre-training remains intact after alignment. Alignment is a thin layer on top, and it often works only on certain input distributions. So whether by jailbreak, re-training, or distribution shift, **under pressure this thin surface cracks and the capability beneath shows through.** Alignment is closer to **hiding** capability than **removing** it — and the thinner the cover, the more easily it peels.

## 8. Defense — don't rely on alignment alone

The principle is clear: **a model's alignment is only a first line of defense, and it is conditional.** Layer external guardrails outside it.

| Layer | Role |
|---|---|
| **input filter** | screen harmful or bypass-seeking input first |
| **output validation** | re-check the answer before it leaves |
| **least privilege** | narrow what the model can actually do |
| **monitoring / logging** | observe and accumulate bypass attempts |

The goal is a structure where, even if alignment is breached, the remaining layers hold. **Open-weight models** — whose weights can be downloaded directly — are especially easy to strip of alignment via re-training, so the key is to not assume the model is "safe" and to keep it **outside the trust boundary.**

:::danger Lesson of the day
Alignment is conditional. Rely not on the model's **good will** but on the **system's controls** around it.
:::

## Summary

1. A model gains **capability** from pre-training and **behavior** from post-training/alignment.
2. Alignment balances helpful, harmless, honest — and **refusal is behavior learned in stage 2.**
3. Alignment is conditional, so it can break via **jailbreak, re-training, distribution shift** — because it may be a **thin surface** on top of capability.
4. So defense doesn't rely on alignment alone; it layers **external guardrails.**

> **One-liner** — Rely not on the model's good will, but on the controls around it.

:::tip Read on
The next episode looks deeper at **refusal**, which appeared briefly here: why the same model helps with some requests and refuses others, how that refusal is built, and how jailbreaks touch it — from a defensive angle. For the big picture, read it alongside the [AI Threat Map (OWASP LLM Top 10)](../advanced/14-ai-threat-map.md).
:::
