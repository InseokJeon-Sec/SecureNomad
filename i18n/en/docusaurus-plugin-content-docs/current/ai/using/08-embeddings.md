---
title: 08. Embeddings and Vector DB
sidebar_label: 08. Embeddings & Vector DB
sidebar_position: 3
description: Embeddings that turn meaning into vectors, and the vector DB that stores/searches them
---

# 08. Embeddings and Vector DB

:::tip Go deeper — AI System Design Guide (translation)
A deeper, production/interview-oriented treatment of this topic → [Embeddings and Vector Spaces](../system-design/01-foundations/05-embeddings-and-vector-spaces.md)
:::


Two elements underpin RAG's retrieval: **embeddings** and the **vector DB**.

## Embeddings

An **embedding** converts the meaning of a word/sentence into a numeric vector.

```text
"cat"  →  [0.21, -0.03, 0.88, ...]
"dog"  →  [0.19, -0.01, 0.85, ...]   ← close to cat
"car"  →  [-0.4, 0.7, 0.02, ...]     ← far from both
```

Similar meaning means closer vectors, so similar meaning is found even with different words (semantic, not keyword, search). Searching "device that blocks illegal access" still finds the "firewall" document.

## Vector DB

A database that stores documents chopped into chunks (as embeddings) and quickly finds the chunks nearest the question vector. Examples: Pinecone, Weaviate, Milvus, Chroma, pgvector.

```text
documents → (embed) → store in vector DB        [prepared]
question → (embed) → find similar chunks → pass to LLM as evidence → answer   [at runtime]
```

The retrieval step of [07. RAG](./07-rag.md) is embeddings + vector DB. For similarity computation, ANN, etc., see [RAG internals (deep dive)](../deep-dive/rag-internals.md).
