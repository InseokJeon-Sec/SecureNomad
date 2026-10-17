---
title: 02. What is an LLM
sidebar_label: 02. What is an LLM
sidebar_position: 2
description: What a large language model (LLM) is and why it "seems smart," explained with simple analogies
---

# 02. What is an LLM

An **LLM (Large Language Model)** is a model that learns from an enormous amount of text and **predicts "the next word" probabilistically**. ChatGPT, Claude, and Gemini are all LLMs.

## In one sentence

> An LLM is a giant autocomplete that read internet-scale text and learned **"given this text, what word is most likely to come next."**

The **principle is the same** as your phone keyboard's autocomplete ("hel" → "hello"). The difference is an incomparably larger scale, and it looks at whole documents and conversation context rather than a single sentence.

## Why 'Large'

Two things are huge.

| What is big | Description |
|---|---|
| **Training data** | Trillions of words of text — books, web pages, code, etc. |
| **Parameters** | The number of 'knobs (weights)' the model adjusts during training. Billions to trillions |

Think of parameters as **the container where knowledge and patterns are stored**. More can hold more complex patterns (though more isn't unconditionally better).

## Why it seems smart

How can "just predicting the next word" do translation, summarization, and coding?

- To predict the next word **accurately**, it must "understand" grammar, facts, logic, and context to some degree.
- For example, to complete "The capital of South Korea is ___" needs knowledge, and to complete "The bug in the following code is ___" requires being able to read code.
- In other words, abilities like translation, summarization, and reasoning **"emerge"** as a byproduct of vast prediction practice.

## Correcting an important misconception

:::warning An LLM is not 'search'
An LLM doesn't fetch answers from a database; it **generates plausible text from learned patterns**.
That's why it sometimes fabricates facts incorrectly (hallucination). → [05. Hallucination & limits](./05-hallucination.md)
:::

- **It doesn't think or have consciousness.** It strings together the statistically most plausible words.
- **It doesn't know the latest information.** It doesn't know anything after its training cutoff unless told (hence RAG/search).

## Next

How does "predicting the next word" actually work?
→ [03. How an LLM works](./03-how-llm-works.md)
