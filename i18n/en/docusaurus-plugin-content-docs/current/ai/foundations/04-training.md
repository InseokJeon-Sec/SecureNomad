---
title: 04. How It's Trained — Pretraining, Fine-tuning, RLHF
sidebar_label: 04. Training
sidebar_position: 4
description: The three stages that create an LLM — pretraining, fine-tuning, RLHF — explained with simple analogies
---

# 04. How It's Trained

An LLM is usually completed through **three stages**: "acquire vast knowledge → correct tone/format → align to human preferences."

```text
① Pre-training    learn 'the patterns of the world' wholesale from vast text
        ↓
② Fine-tuning     refine it into a specific style, such as a question-answer format
        ↓
③ RLHF            adjust it to give 'more preferred answers' using human feedback
```

## 1. Pre-training

- Reading **enormous text** (books, web, code) it endlessly practices "next-token prediction."
- This stage forms the basis of grammar, common sense, world knowledge, and reasoning.
- It's **the most expensive and time-consuming stage** (months and huge cost for large models).
- The result "knows a lot but can't hold a conversation well" — it tends to continue writing text rather than answer a question.

## 2. Fine-tuning

- Further train the pretrained model **to fit a specific purpose/format**.
- Representatively, **instruction tuning**: it learns **how to follow conversations/instructions** like "answer questions" and "write in the requested format."
- Analogy: teaching someone who memorized an entire encyclopedia "how to answer interview questions."
- Companies also use this stage to build **purpose-specific models** from their own data. (→ [09. Fine-tuning vs RAG](../using/09-finetune-vs-rag.md))

## 3. RLHF (Reinforcement Learning from Human Feedback)

**RLHF = Reinforcement Learning from Human Feedback**

- Humans **rate which of several model answers is 'better'**, and that preference is reflected into the model.
- As a result it gives more **helpful, safe, and polite** answers.
- Analogy: repeatedly giving a good writer feedback like "this answer is good, that one is rude" to align their taste.

:::info Why each model's 'attitude' differs on the same question
Even with similar foundations (pretraining), **what each was tuned to prefer in fine-tuning/RLHF** differs, so tone, refusal criteria, and safety vary by product.
:::

## Important implications

- **The knowledge cutoff is fixed**: it doesn't know anything after the training-data collection point → supplement with [07. RAG](../using/07-rag.md) or search for recent info.
- **Your data may be used for training**: whether what you enter is used/retained for training varies by product policy → always check from a security/privacy standpoint. (→ [12. Local LLM](../advanced/12-local-llm.md))

## Next

Even trained this way, why does it fabricate facts incorrectly? → [05. Hallucination & limits](./05-hallucination.md)
