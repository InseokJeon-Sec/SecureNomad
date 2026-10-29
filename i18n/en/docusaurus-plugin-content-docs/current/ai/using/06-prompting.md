---
title: 06. Prompting Basics
sidebar_label: 06. Prompting
sidebar_position: 1
description: The concepts of prompt, context, and token limits, and prompt-writing principles
---

import YouTube from '@site/src/components/YouTube';

# 06. Prompting Basics

This page is also available as a video.

<YouTube id="qd1d0sPy1Ps" title="How a single prompt breaks an AI — prompt injection and 4 defense principles (security view) | AI Essentials #3" />

A **prompt** is the entire input to an LLM (instruction, context, question).

## Core concepts

| Concept | Definition |
|---|---|
| Prompt | The entire input to the model |
| Context window | The token limit processable at once (input + output) |
| Token | The processing unit ([03](../foundations/03-how-llm-works.md)); the basis for cost/limits |

Exceeding the context window drops earlier content. Handle long documents by summarizing, excerpting, or [RAG](./07-rag.md).

![Context window — input+output over the limit drops earliest content](/img/ai/context-window-en.svg)

## Principles

| Principle | Bad | Good |
|---|---|---|
| Specificity | "Tell me about security" | "Explain the OWASP Top 10, 2 lines each" |
| Role/context | "Review this" | "As a security reviewer, list vulnerabilities by severity" |
| Format | "Compare" | "As a table, columns: tool, pros, cons" |
| Examples | — | "In this format: [example 1][example 2]" |
| Elicit steps | "Just the answer" | "Step by step with reasons" |

## Security note

:::warning No sensitive info in prompts
Cloud-LLM input is transmitted externally. Do not paste real accounts, keys, internal code, or personal data. Anonymize if needed, or use a [local LLM](../advanced/12-local-llm.md).
:::
