---
title: 07. RAG (Retrieval-Augmented Generation)
sidebar_label: 07. RAG
sidebar_position: 2
description: What RAG is, why it's needed, and how it works — explained simply with a diagram
---

# 07. RAG (Retrieval-Augmented Generation)

**RAG = Retrieval-Augmented Generation.**
Before the LLM answers, it **retrieves relevant material (Retrieval), includes it (Augmented), and generates the answer grounded in it (Generation)**.

## Why it's needed

On its own, an LLM can't do two things.

- **Recent info**: it doesn't know anything after its training cutoff ([see 04](../foundations/04-training.md))
- **Internal knowledge**: your company's documents/policies aren't in its training

RAG solves both. **Without retraining the model**, it attaches the needed material on the fly so the model can answer with recent/internal knowledge.

## How it works

```text
User question
   │
   ▼
① Retrieve: find document chunks relevant to the question from a store
   │        (semantic search → 08. Embeddings / vector DB)
   ▼
② Combine: merge the found chunks + the original question into one prompt
   │        "Answer based on the following material: [chunks] Question: [question]"
   ▼
③ Generate: the LLM answers based on that material (+ can show sources)
```

Analogy: an **open-book exam**. Instead of answering from memory, you open the relevant pages and answer while looking at them.

## Benefits of RAG

| Benefit | Description |
|---|---|
| **Reflects recent/internal knowledge** | Just update the store. No model retraining |
| **Reduces hallucination** | Answering within the provided material cuts fabrication ([see 05](../foundations/05-hallucination.md)) |
| **Shows sources** | Can show evidence like "this part of this document" |
| **Cost/speed** | Reflects knowledge cheaper and faster than fine-tuning |

## Limits

- **Depends on retrieval quality**: fetch the wrong material and the answer is wrong too.
- **If there's no material**, it may still not know or may fabricate.
- Requires **pipeline construction** — organizing material, chunk splitting, retrieval tuning.

## Where it's used

- Internal-document Q&A bots, customer-support chatbots
- Search-style assistants based on manuals/policies/wikis
- Assistant services that attach recent news/data

## Next

How is RAG's "finding relevant documents" possible? Its core is embeddings. → [08. Embeddings & vector DB](./08-embeddings.md)
