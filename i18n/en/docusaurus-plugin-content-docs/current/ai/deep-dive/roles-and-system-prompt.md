---
title: System Prompt and Role Separation (Technical Deep Dive)
sidebar_label: System Prompt & Roles
sidebar_position: 4
description: How the system, user, and assistant roles collapse into a single token stream, and why the role boundary is not a defense line — prompt injection, system prompt leakage (OWASP LLM07), and defensive design
tags: [AI, system-prompt, roles, prompt-injection, security, deep-dive]
---

import YouTube from '@site/src/components/YouTube';

# System Prompt and Role Separation (Technical Deep Dive)

Prefer to get the core ideas from a video first? See below ("AI Essentials" Deep Dive #4 — the last of the mechanics bundle; Korean audio).

<YouTube id="pZCr8ZlGBOU" title="How roles split, and why they leak — System prompt & role separation | AI Essentials Deep Dive #4" />

:::note Prerequisite
The earlier deep dives — [attention](./attention.md), [tokenizer](./tokenizer.md), and [sampling](./sampling.md) — looked **inside** the model. This document turns the view slightly outward: **how we structure the input into roles**, and why that structure is directly tied to security.
:::

## 1. The three roles of a conversation

A conversation with an LLM is a sequence of messages in three roles.

| Role | What it is | Note |
|---|---|---|
| **system** | Instructions, rules, persona set in advance by the developer | Usually invisible to the user |
| **user** | The actual question/request the user types | External documents or tool results may be mixed in |
| **assistant** | The answer the model generates | Built with reference to all prior context |

As the conversation grows, these messages stack up in order. But **how does the model receive this structure?** That is the crux of this article.

## 2. The roles collapse into a single token stream

The three roles on the left — system, user, assistant — are strung together into **one continuous token stream** on the way into the model.

```text
[<|system|>]  You are a customer-support bot …
[<|user|>]    How do I get a refund?
[<|assistant|>] A refund is …

      │  (just before model input)
      ▼
<|system|> You are … <|user|> How … <|assistant|> …
└──────────── a single token stream ────────────┘
```

Each role is merely preceded by a **special marker token** (the role marker in the chat template). In other words, role separation is not a physical partition — it is marked by **special tokens and a learned convention**.

:::caution Key point
There is **no hardware partition** inside the model that says "this is system, that is user." A role is a marker, not a wall.
:::

## 3. What the system prompt does

The system prompt is, in a word, close to an **app's configuration values**. For example:

```text
You are a company's customer-support bot.
Answer politely and concisely.
Refund policy is within 7 days; do not reveal the internal price list.
```

It is invisible to the user but governs behavior. It typically holds:

- **Role/persona** — who to act as
- **Rules/policy** — what is and isn't allowed
- **Format/tone** — the answer's tone and output format
- **Tool-use guidance** — which tool to use, when
- **Boundary settings** — guards such as disclosure bans and scope limits

## 4. The role boundary is an illusion

Here is the trap. **The role boundary is really closer to an illusion.**

As we saw in section 2, system instructions, user input, and external documents all end up in one continuous token stream, merely tagged with role markers. The model is usually trained to follow the system more — but **that is a tendency, not a guarantee.**

So an attempt by the user or external input to override the system instruction can succeed. This is an extension of **prompt injection**. When an external document (web page, email, search result) enters the same context, a sentence inside it can act like an instruction — that is **indirect prompt injection**.

:::danger Lesson of the day
**Role separation is a convenience, not a defense line.** The role marker only helps the model follow the system more; it is not a physical partition. If you build security on roles, your security collapses when that boundary wavers.
:::

Four things to remember:

1. A role is a **soft marker** — a learned tendency.
2. "Follows more" is a **tendency**, not a guarantee.
3. So build boundaries with **permissions, validation, isolation**.
4. The system prompt is **not a secret store.**

## 5. System prompt leakage (OWASP LLM07)

The signature consequence of the role boundary being only a convention is **system prompt leakage** — **LLM07 (System Prompt Leakage)** in the OWASP LLM Top 10. System instructions that should stay hidden are **surfaced in the answer** through coaxing or injection.

**Why it's dangerous**

- Hidden rules/internal info are exposed
- It provides clues for bypass (jailbreak)
- Persona or logic can be cloned

**What leaks**

- Internal policy, prices, routes
- Hints about connected tools and permissions
- In the worst case, even **hardcoded secrets**

```text
[Leak path]                         [Defense]
Boundary is only a convention → it  Keep sensitive info out of the prompt
wavers under strong coaxing         Filter system content from the output
External doc mixes into context →   Separate permissions → minimize 'even-if-leaked' harm
pulled out indirectly               Minimal-info principle — only necessary instructions
```

The point is to make it so there is **nothing to leak in the first place, and no harm even if it does.**

## 6. Four defensive design principles

| # | Principle | What it means |
|---|---|---|
| 1 | **No secrets inside** | Don't hardcode keys/internal secrets into the system prompt |
| 2 | **Safe even if leaked** | Assume leakage; design so exposure causes no harm |
| 3 | **Boundary by permission** | Restrict real permissions/tool access, not roles |
| 4 | **I/O separation, validation, approval** | Isolate external input as data, filter system content from output, require human approval for irreversible, sensitive actions |

In addition, **log and watch for leak-attempt patterns** that probe the system prompt.

## Summary

1. A conversation is a sequence of three-role messages that collapse into one token stream.
2. The system prompt is an app's config values — role, rules, format, tool guidance.
3. A role is a soft marker, not a hardware wall, so the boundary isn't perfect.
4. The system prompt is not a secret store, so design it to be safe even if leaked.

> **One-liner** — Role separation is a convenience, not a defense line. The defense line is built with permissions, validation, and isolation.

:::tip Read on
For the bigger picture of attacks that shake the role boundary, see [AI Threat Map (OWASP LLM Top 10)](../advanced/14-ai-threat-map.md).
:::
