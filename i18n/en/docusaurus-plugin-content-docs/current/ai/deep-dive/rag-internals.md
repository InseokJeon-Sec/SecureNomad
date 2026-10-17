---
title: RAG Internals (Technical Deep Dive)
sidebar_label: RAG Internals
sidebar_position: 4
description: How RAG retrieves and incorporates sources — chunking, embeddings, vector similarity, ANN search, reranking, context injection
tags: [AI, RAG, embeddings, vector-search, deep-dive]
---

# RAG Internals (Technical Deep Dive)

:::note Prerequisite
Assuming you've seen the big picture in [07. RAG](/en/ai/using/rag) and [08. Embeddings & vector DB](/en/ai/using/embeddings), this document covers **"how it retrieves and incorporates"** step by step, technically.
:::

## 0. Two phases

RAG must be seen in two phases.

```text
[Offline] Indexing : pre-split documents into vectors and store them   (one-time / on update)
[Online]  Query    : retrieve on each question and generate the answer  (every request)
```

## 1. Indexing pipeline

```text
Source docs → ① load/clean → ② chunking → ③ embedding → ④ store in vector DB
```

### ② Chunking — 80% of the quality
Split a document into retrieval-unit chunks. **How you split decides RAG quality.**

| Strategy | Description | Traits |
|---|---|---|
| Fixed size | Cut every N tokens (e.g., 512) | Simple; context may be cut mid-way |
| Overlap | Overlap between chunks (e.g., 50 tokens) | Reduces context loss at boundaries |
| Semantic | Cut by paragraph/heading/sentence boundaries | Best context preservation, complex to build |
| Structural | By markdown headers/tables | Good for technical docs |

:::tip
If a chunk is **too large**, irrelevant content mixes in as noise; if **too small**, context breaks. Usually start at 256–1024 tokens + 10–20% overlap and tune.
:::

### ③ Embedding — meaning into a vector
Feed each chunk into an embedding model to make a `d`-dimensional vector (e.g., 768/1536/3072 dims).

```text
"Zero trust never trusts by default"  →  [0.021, -0.044, 0.198, ... ]  (d-dim)
```

Semantically similar sentences sit **close** in vector space. That is why "semantic search" works.

### ④ Store
Index (vector, original chunk, metadata) into a **vector DB** (FAISS, pgvector, Milvus, Elasticsearch, etc.).

## 2. Similarity computation — the math

The question is turned into a vector `q` by the **same embedding model**, then its similarity to each stored chunk vector `d_i` is computed.

```text
Cosine similarity :  cos(q, d) = (q · d) / (‖q‖ · ‖d‖)      # compares direction (angle), -1 ~ 1
Dot product       :  q · d = Σ q_k · d_k                      # also reflects magnitude
Euclidean distance:  ‖q - d‖ = √Σ(q_k - d_k)²                 # closer = more similar
```

- If embeddings are **normalized (‖v‖=1)**, cosine = dot product, which is faster → the default in many vector DBs
- "High similarity = a chunk semantically close to the question"

## 3. Retrieval

### Top-k
Fetch the **top k** chunks by similarity (e.g., k=5). Larger k means richer evidence but more noise/token cost.

### ANN — brute force is slow
With millions of chunks, comparing against every vector (brute force) is expensive. So we use **Approximate Nearest Neighbor (ANN)**.

```text
HNSW (representative algorithm): connect vectors in a hierarchical graph,
                                 "hop" along near neighbors to search
                                 → sacrifice a little accuracy for a big speed gain
```

- Trade-off: accuracy (recall) ↔ speed. Tune via parameters (ef_search, etc.)

### Hybrid search
Semantic (dense) search alone may miss **exact keywords/proper nouns/code**. So it's **combined** with traditional keyword search (**BM25**, sparse).

```text
final score = α · (semantic similarity) + (1-α) · (BM25 score)
or merge the two rankings with RRF (Reciprocal Rank Fusion)
```

## 4. Reranking

Take 20–50 candidates from the first (fast but coarse) retrieval, then reorder with a **precise reranker**.

```text
1st: bi-encoder (embed question and chunk separately)      → fast, less precise
2nd: cross-encoder (feed question + chunk together, score)  → slow, precise
     → select only the final top k among candidates
```

A cross-encoder feeds the question and chunk **as a pair** into the model to score relevance directly, far more accurately (but slowly, so applied only to the candidate set).

## 5. Context assembly & injection

Assemble the selected top-k chunks with the question into **one prompt**.

```text
System: Answer using ONLY the "reference" below. If unknown, say you don't know.
Reference:
[1] (source: zero-trust.md) Zero trust is ...
[2] (source: msa.md) Microservices are ...
Question: Why is zero trust important in MSA?
```

Technical points to watch:
- **Context-window limit**: chunk count × size must not exceed the model's max tokens
- **Lost in the Middle**: models tend to miss info in the **middle** of a long context → place key evidence at the front/back
- Include **source metadata** to generate citations

## 6. Generation

The LLM generates an answer grounded in the injected reference. Here the model uses [attention](./attention.md) to compute relationships between question tokens and reference tokens and reflect them. Done well, you can produce **footnote citations**.

## 7. Variables that affect quality

| Variable | Impact |
|---|---|
| Chunk size/overlap | Context preservation vs noise |
| Embedding model | Semantic capture (domain/multilingual fit) |
| k (top-k) | Evidence richness vs noise/cost |
| Hybrid/reranker | Accuracy (esp. keywords/proper nouns) |
| Prompt/chunk order | Mitigate Lost in the Middle |

## 8. Evaluation metrics

```text
Retrieval quality : Recall@k, Precision@k, MRR, nDCG   (did it fetch the right chunks)
Generation quality: Faithfulness (grounding), Answer Relevance, (hallucination)
```

Frameworks like RAGAS measure "retrieval" and "generation" separately, pinpointing the bottleneck (retrieval vs generation).

## 9. One line on security

RAG must **reflect document permissions**. If chunks a user has no right to leak into retrieval/answers, that's a data breach (OWASP **LLM08 vector & embedding weaknesses**). → [Securing AI / Threat model](/en/security/ai-security-assessment/threats)

## 10. Summary

```text
[Indexing]  docs → chunking → embedding → vector DB
[Query]     embed question → (ANN) top-k similarity → hybrid/rerank
            → assemble/inject context → LLM generation → citations
```

- Original paper: [Retrieval-Augmented Generation (Lewis et al., 2020)](https://arxiv.org/abs/2005.11401)
- Related: [08. Embeddings & vector DB](/en/ai/using/embeddings) · [Attention & Transformer (deep dive)](./attention.md)
