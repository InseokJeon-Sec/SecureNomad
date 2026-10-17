---
title: 07. RAG (Retrieval-Augmented Generation)
sidebar_label: 07. RAG
sidebar_position: 2
description: The definition, need, operation, and trade-offs of RAG
---

# 07. RAG (Retrieval-Augmented Generation)

**RAG** retrieves relevant material before answering, provides it (augmented), and generates the answer grounded in it. It references external source documents instead of knowledge internal to the model's parameters.

## Why it's needed

An LLM alone cannot do two things:

- **Recent info**: nothing after the training cutoff ([04](../foundations/04-training.md))
- **Internal knowledge**: organization documents/policies aren't in training

RAG solves both by attaching the needed material on the fly, without retraining.

## Operation

```text
Question
 ├ ① Retrieve: find relevant chunks from a store (semantic → 08. Embeddings/vector DB)
 ├ ② Combine: assemble chunks + question into one prompt
 └ ③ Generate: the LLM answers grounded in that material (can show sources)
```

## Benefits

| Benefit | Description |
|---|---|
| Recent/internal knowledge | Just update the store; no retraining |
| Less hallucination | Answers within the evidence ([05](../foundations/05-hallucination.md)) |
| Source attribution | Can show the document/location |
| Cost/speed | Cheaper and faster than fine-tuning |

## Limits

- Depends on retrieval quality; wrong material yields wrong answers.
- Without material, it may still not know or may fabricate.
- Requires pipeline construction (material prep, chunking, retrieval tuning).

See [RAG internals (deep dive)](../deep-dive/rag-internals.md) for details.
