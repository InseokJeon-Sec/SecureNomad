---
title: 06. Prompting Basics
sidebar_label: 06. Prompting
sidebar_position: 1
description: The concepts of prompt, context, and token limits, plus principles for writing prompts that get good answers
---

# 06. Prompting Basics

A **prompt** is the entire input you give an LLM (instructions, question, context). Using AI well ultimately comes down to **writing good prompts**.

## Three core concepts

| Concept | Meaning |
|---|---|
| **Prompt** | The entire input to the model (instruction + context + question) |
| **Context window** | The limit on **how many tokens the model can see at once**. Input + output combined |
| **Token** | The processing unit ([see 03](../foundations/03-how-llm-works.md)). The basis for cost/limits |

:::info When you exceed the context window
If a conversation grows past the limit, the model **forgets the earlier content.** For long documents, summarize, include only the needed parts, or use [RAG](./07-rag.md) to fetch pieces on the fly.
:::

## Principles of a good prompt

| Principle | Bad | Good |
|---|---|---|
| **Be specific** | "Tell me about security" | "Explain the OWASP Top 10 for beginners, 2 lines each" |
| **Give role/context** | "Review this" | "You are a security reviewer. Point out vulnerabilities in the code below, by severity" |
| **Specify format** | "Compare" | "As a table, columns: tool, pros, cons" |
| **Provide examples (few-shot)** | — | "In this format: [example 1] [example 2]" |
| **Elicit steps** | "Just the answer" | "Think step by step and give reasons" |

## Common patterns

- **Assign a role**: "You are an expert in ○○"
- **Impose constraints**: "under 300 characters," "code only," "in polite form"
- **Require evidence**: "cite sources, and say you don't know if you don't"
- **Iterate**: don't expect perfection at once; refine based on the answer — "shorter," "add an example"

## Security note

:::warning Don't put sensitive info in prompts
What you enter into a cloud LLM is transmitted externally. Don't paste **real accounts, keys, internal code, or personal data** as-is. If truly necessary, anonymize it or use a [local LLM](../advanced/12-local-llm.md).
:::

## Next

How do you supply the "recent/internal knowledge" that prompts alone can't? → [07. RAG](./07-rag.md)
