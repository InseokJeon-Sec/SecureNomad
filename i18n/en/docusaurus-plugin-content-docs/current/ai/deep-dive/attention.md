---
title: Attention and Transformer (Technical Deep Dive)
sidebar_label: Attention & Transformer
sidebar_position: 2
description: Q·K·V, Scaled Dot-Product Attention, multi-head, causal masking, and the Transformer block — a technical look at how an LLM computes
tags: [AI, transformer, attention, deep-dive]
---

# Attention and Transformer (Technical Deep Dive)

:::note Prerequisite
Assuming you've seen the big picture of "tokens → next-token prediction" in [03. How an LLM works](/en/ai/foundations/how-llm-works), this document covers the **actual computation inside**. Formulas are written in code blocks.
:::

## 1. Input representation — tokens to vectors

The model must turn tokens into numeric vectors to compute.

```text
token ID  ──(embedding-table lookup)──▶  embedding vector (dim d_model, e.g., 4096)
```

- **Token embedding**: look up a row by token ID in a vocab-size × d_model matrix
- **Positional info**: attention doesn't know order, so **positional encoding** is added
  - Early transformers: sine/cosine (sinusoidal)
  - Modern LLMs: **RoPE (rotary position embedding)** applied to Q·K is mainstream

As a result each token becomes a vector `x_i ∈ ℝ^(d_model)`, and the sentence becomes a matrix `X ∈ ℝ^(n × d_model)` (n = number of tokens).

## 2. The heart of self-attention — Q, K, V

Each token vector is multiplied by **three learned weight matrices** to produce three role vectors.

```text
Q = X · W_Q     (Query : "what I'm looking for")
K = X · W_K     (Key   : "the index I hold")
V = X · W_V     (Value : "the actual info to deliver")
```

Intuition (library analogy):
- **Query** = my search term
- **Key** = each book's index card
- **Value** = the book's actual content
- Bring more content (V) from books whose index (K) matches the search (Q)

## 3. Scaled Dot-Product Attention

The core formula of attention.

```text
Attention(Q, K, V) = softmax( (Q · Kᵀ) / √d_k ) · V
```

Step by step:

```text
① Scores :  S = Q · Kᵀ          # (n×d_k)·(d_k×n) = n×n matrix
             S[i][j] = dot product of token i's Query and token j's Key
             → raw score of "how much i attends to j"

② Scale  :  S = S / √d_k         # if d_k is large, dot products grow and softmax
                                  # saturates to one side → divide by √d_k to stabilize variance

③ Normalize :  A = softmax(S)    # each row sums to 1 (attention weights)

④ Weighted sum :  Z = A · V      # mix Values by the attention weights
```

Small example (3 tokens):

```text
A (attention weights, 3×3)     V (values, 3×d)
[0.7 0.2 0.1]                 [v1]        Z1 = 0.7·v1 + 0.2·v2 + 0.1·v3
[0.1 0.8 0.1]        ·        [v2]   =    Z2 = 0.1·v1 + 0.8·v2 + 0.1·v3
[0.2 0.3 0.5]                 [v3]        Z3 = 0.2·v1 + 0.3·v2 + 0.5·v3
```

→ Token 1 mostly attends to itself (0.7), token 2 to token 2, token 3 evenly across all three, producing new representations Z. **Each token's meaning is recombined by context** — that is the essence of attention.

:::info Why divide by √d_k
The dot product of d_k-dimensional vectors has variance proportional to d_k as the dimension grows. Feeding that straight into softmax saturates the largest value near 1, making gradients nearly 0. Dividing by √d_k restores variance to ~1 and stabilizes training.
:::

## 4. Multi-Head Attention

With only one attention, you see one kind of relationship. So we put **several (heads) in parallel**.

```text
head_h = Attention(Q·W_Q^h, K·W_K^h, V·W_V^h)   # h = 1..H, each in a different subspace
MultiHead = Concat(head_1, ..., head_H) · W_O
```

- Each head captures a different relationship (e.g., one head grammatical subject–verb, another pronoun–antecedent)
- Concatenate the results and project back to d_model with the output weight `W_O`

## 5. Causal masking (the key to generation)

An LLM generates **left to right, one token at a time**. So token i **must not see tokens after itself (the future)**. To enforce this, future positions in the score matrix S are set to `-∞` before softmax.

```text
S' = S + M       # M[i][j] = -∞  (j > i),  0 (j ≤ i)
softmax(-∞) → 0  # future tokens get weight 0
```

Thanks to this **causal mask**, even when the whole sentence is fed at training time, each position is forced to predict "only up to its own position."

## 6. The Transformer block — the full flow

Attention is part of a block, and this block is stacked N times (e.g., 32 or 80 layers).

```text
Input X
 │
 ├─▶ LayerNorm ─▶ Multi-Head Attention ─┐
 │                                       + (residual connection)
 └───────────────────────────────────────┤
                                          ▼
 ├─▶ LayerNorm ─▶ FFN (feed-forward) ────┐
 │   (Linear → activation (GELU, etc.) → Linear) + (residual)
 └───────────────────────────────────────┤
                                          ▼
                                     block output → next block
```

- **Residual connection**: add input to output to avoid vanishing gradients in deep stacks
- **FFN**: nonlinear transform per token (expressive power). Inner dimension is usually 4× d_model
- After passing N blocks, project the final vector to vocab size → **logits**

```text
logits = Z_last · W_vocab          # (n × d_model)·(d_model × V) = n × V
P(next token) = softmax(logits[last position] / temperature)
```

→ Sample the next token from this distribution. The "next-token prediction" in [doc 03](/en/ai/foundations/how-llm-works) is exactly this final step.

## 7. Compute and context length

```text
The score matrix S is n × n  →  time/memory complexity O(n²)
```

- So the longer the context, the cost grows **quadratically** → why long context is expensive
- **KV cache**: store already-computed K·V during generation to avoid recomputation per token (key to inference speed)
- Mitigations: FlashAttention (memory efficiency), GQA/MQA (share KV heads), sparse/linear attention

## 8. Summary

| Element | One line |
|---|---|
| Q·K·V | Project token vectors into 3 roles |
| Scaled Dot-Product | `softmax(QKᵀ/√d_k)·V` — context-based recombination |
| Multi-head | Capture several relationships in parallel |
| Causal masking | Block future tokens → generation possible |
| Transformer block | Attention + FFN + residual + LayerNorm, N layers |
| O(n²) | The fundamental reason long context is expensive |

- Original paper: [Attention Is All You Need (Vaswani et al., 2017)](https://arxiv.org/abs/1706.03762)
- Next: [RAG internals (deep dive)](./rag-internals.md)
