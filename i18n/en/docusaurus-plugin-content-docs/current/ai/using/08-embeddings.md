---
title: 08. Embeddings and Vector DB
sidebar_label: 08. Embeddings & Vector DB
sidebar_position: 3
description: Embeddings that turn meaning into numbers, and the vector DB that stores and searches them — explained simply
---

# 08. Embeddings and Vector DB

The two parts that make RAG's "finding relevant documents" possible are **embeddings** and the **vector DB**.

## Embeddings — turning meaning into numbers (vectors)

An **embedding** turns the **meaning of a word/sentence into an array of numbers (a vector)**.

```text
"cat"  →  [0.21, -0.03, 0.88, ...]   (hundreds to thousands of numbers)
"dog"  →  [0.19, -0.01, 0.85, ...]   ← numbers 'close' to cat
"car"  →  [-0.4, 0.7, 0.02, ...]     ← numbers 'far' from both
```

The key point is that **similar meaning → closer vectors**.

- "cat" and "dog" sit **close** in vector space
- "cat" and "car" sit **far** apart
- So it can find things **with similar meaning even if the words differ** (semantic search, not keyword search)

:::info Difference from keyword search
Keyword search finds a "firewall" document only if you type "firewall."
Embedding-based search finds the semantically close "firewall" document even if you type "device that blocks illegal access."
:::

## Vector DB — store vectors and search fast

A **vector DB** is a special database that stores documents chopped into chunks, each turned into an embedding (vector), and **quickly finds the chunks nearest to the question vector**.

```text
[documents]
  │  chop into chunks, each embedded
  ▼
[vector DB]  ← stores many vectors
  ▲
  │  embed the question too and search for the "nearest vectors" (similarity search)
[question]
```

Representative examples: Pinecone, Weaviate, Milvus, Chroma, pgvector (a PostgreSQL extension), etc.

## Its place in the whole RAG

```text
documents → (embed) → store in vector DB        [prepared in advance]
question → (embed) → search similar chunks in vector DB → pass to LLM as evidence → answer   [at runtime]
```

So the "① Retrieve" step of [07. RAG](./07-rag.md) is exactly embeddings + vector DB.

## Summary

- **Embedding**: meaning → vector (numbers) → enables semantic comparison
- **Vector DB**: stores vectors and quickly finds the nearest ones
- Together they underpin RAG's "finding relevant documents."
- Next: comparing three ways to inject knowledge. → [09. Fine-tuning vs RAG vs prompting](./09-finetune-vs-rag.md)
