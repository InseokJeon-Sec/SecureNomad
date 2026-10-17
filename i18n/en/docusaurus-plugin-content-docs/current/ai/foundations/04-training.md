---
title: 04. How It's Trained — Pretraining, Fine-tuning, RLHF
sidebar_label: 04. Training
sidebar_position: 4
description: The three stages that complete an LLM — pretraining, fine-tuning, RLHF
---

# 04. How It's Trained

An LLM is usually completed in **three stages**.

```text
① Pre-training   learn the patterns of the world from vast text
② Fine-tuning    adjust to a specific form, such as question-answer
③ RLHF           adjust to human preferences
```

## 1. Pre-training

Repeatedly learns next-token prediction from vast text, forming the basis of grammar, common sense, world knowledge, and reasoning. The most expensive and time-consuming stage. Its output knows much but is poor at following instructions, tending to continue text rather than answer.

## 2. Fine-tuning

Further-trains the pretrained model for a specific purpose/format. Representatively, **instruction tuning** teaches it to answer questions and follow requested formats. Also used when organizations build purpose-specific models from their own data ([09. Fine-tuning vs RAG](../using/09-finetune-vs-rag.md)).

## 3. RLHF (reinforcement learning from human feedback)

Humans rate which of several answers is preferred, and that preference is reflected. Helpfulness, safety, and politeness are tuned here.

:::info Why products differ in "attitude"
Even with similar pretraining foundations, what each was tuned to prefer in fine-tuning/RLHF differs, so tone, refusal criteria, and safety vary by product.
:::

## Implications

- **The knowledge cutoff is fixed.** It doesn't know anything after collection; supplement via [07. RAG](../using/07-rag.md) or search.
- **Input data may be used for training.** Whether input is trained on/retained varies by product policy; verify from a security/privacy standpoint ([12. Local LLM](../advanced/12-local-llm.md)).
