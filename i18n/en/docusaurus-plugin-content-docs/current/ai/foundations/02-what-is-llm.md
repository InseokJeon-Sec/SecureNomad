---
title: 02. What is an LLM
sidebar_label: 02. What is an LLM
sidebar_position: 2
description: The definition and essential operation of an LLM, and common misconceptions
---

# 02. What is an LLM

An LLM (large language model) is trained on large-scale text to **estimate the probability distribution of the next token** given a token sequence. ChatGPT, Claude, and Gemini are LLMs.

Its essential operation is a single thing — **next-token prediction** — and sentences are produced by repeating it one token at a time.

## What "large" means

Two axes are large.

| Axis | Description |
|---|---|
| **Training data** | Trillions of words — books, web, code |
| **Parameters** | Weights adjusted by training; billions to trillions. The capacity where knowledge/patterns are stored |

## Why abilities emerge from prediction

Accurate next-token prediction requires internalizing grammar, facts, logic, and context. Completing "The capital of South Korea is ___" needs knowledge; "the bug in the following code is ___" needs code understanding. Translation, summarization, and reasoning emerge from this prediction process.

## Correcting a misconception

:::warning An LLM is not search
An LLM does not look up answers in a store; it generates the most plausible text from learned patterns. As a result it sometimes fabricates facts (hallucination → [05. Hallucination & limits](./05-hallucination.md)).
:::

- Not thought or consciousness — it strings together the statistically most plausible tokens.
- It does not know information after its training cutoff; supplement recent/internal knowledge with RAG/search.
