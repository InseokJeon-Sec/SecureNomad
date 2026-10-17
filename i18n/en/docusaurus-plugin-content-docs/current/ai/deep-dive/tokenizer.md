---
title: Tokenizers and BPE (Technical Deep Dive)
sidebar_label: Tokenizers & BPE
sidebar_position: 1
description: How an LLM splits text into tokens (BPE / WordPiece / SentencePiece), vocabulary, and why Korean uses more tokens
tags: [AI, tokenizer, BPE, deep-dive]
---

# Tokenizers and BPE (Technical Deep Dive)

:::note Prerequisite
Assuming you've seen the concept of "tokens" in [03. How an LLM works](/en/ai/foundations/how-llm-works), this document covers **how tokens are actually produced**. It is the entrance to all computation ([attention](./attention.md)).
:::

## 1. Why a tokenizer is needed

A model handles neither characters nor words but **arrays of integer IDs**. A tokenizer is the dictionary that converts text ↔ IDs.

```text
"security"  ──(encode)──▶  [3034, 1793]  ──model──▶ ... ──(decode)──▶  "security"
```

There were three options:

| Unit | Problem |
|---|---|
| Character | Sequences too long (inefficient), weak as a meaning unit |
| Word | Vocabulary explosion; can't handle typos/neologisms/out-of-vocabulary (OOV) |
| **Subword** | A compromise of the two — the modern LLM standard |

## 2. BPE (Byte-Pair Encoding) — the core algorithm

The most widely used subword method. It builds the vocabulary by **repeatedly merging frequently co-occurring pairs**.

Training (vocabulary building):

```text
Start: every character is a token
     low, lower, newest, widest ...
     → l o w / l o w e r / n e w e s t ...

Repeat: merge the most frequent "adjacent pair" into one
     1st: (e, s) most frequent → create "es"
     2nd: (es, t) → "est"
     3rd: (l, o) → "lo"
     ... repeat until the target vocabulary size is reached
```

At inference (encoding), the learned merge rules are applied in order to split text into tokens.

:::info Variants
- **Byte-level BPE** (GPT family): BPE over **bytes** rather than Unicode characters → any character (emoji, rare glyphs) is representable with no OOV
- **WordPiece** (BERT): merge criterion is likelihood increase rather than frequency
- **SentencePiece** (multilingual): treats whitespace as a symbol (▁) to work without language boundaries
:::

## 3. Vocabulary

- Vocabulary size is usually **30k–300k** (e.g., 32k, 100k, 256k)
- Each token ID maps 1:1 to a row of the embedding table ([attention doc](./attention.md))
- Special tokens exist: `<bos>` (start), `<eos>` (end), `<pad>`, `<unk>`, and role tokens for chat templates

## 4. Why Korean uses more tokens

For the same meaning, Korean consumes more tokens than English.

```text
"security"      → [sec][urity]           2 tokens
"보안"          → [보][안] or [보안]       1–2 tokens (model-dependent)
"정보보호"       → [정][보][보][호] possible  up to 4 tokens
```

Causes:
- English-centric vocabularies are **rich in English subwords**; Korean tends to split into character units
- In byte-level BPE, one Hangul character = 3 UTF-8 bytes → may split more finely

Impact:
- **Cost** (per-token billing) and **context-length limits** are less favorable for Korean
- Models with multilingual/Korean-specialized tokenizers are more token-efficient for Korean

## 5. Practical notes

- **Tokens ≠ character count**: length limits and cost are token-based
- Different tokenizers give different token counts for the same sentence → mind this when comparing cross-model cost
- How code/numbers/whitespace are handled differs by model, creating performance differences

## 6. Summary

| Concept | One line |
|---|---|
| Tokenizer | Text ↔ integer-ID conversion dictionary |
| BPE | Build a subword vocabulary by repeatedly merging frequent pairs |
| byte-level | Byte-based, so no OOV (GPT family) |
| Vocabulary | Token ID ↔ embedding row, 1:1 |
| Korean inefficiency | Vocabulary bias + UTF-8 bytes raise token count |

- Next: [Attention and Transformer (deep dive)](./attention.md)
