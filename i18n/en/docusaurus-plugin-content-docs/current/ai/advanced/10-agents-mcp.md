---
title: 10. AI Agents · Tools · MCP
sidebar_label: 10. Agents & MCP
sidebar_position: 1
description: Agents that let AI use tools on its own, function calling (tools), and the standard connection protocol MCP
---

# 10. AI Agents · Tools · MCP

Until now the LLM was a passive thing that "answers when asked." Giving it **tools and letting it work on its own** makes an **AI agent**.

## Tools (function calling) — giving AI hands and feet

A basic LLM only generates text. It **can't take real actions** like calculating, searching, or reading files.
**Tools / function calling** let the LLM, when it decides "I should use a calculator now," **call a pre-connected function**.

```text
User: "What's the weather in Seoul today?"
   ▼
LLM decides: "I should call the weather API"  →  calls get_weather("Seoul")
   ▼
receives the result (sunny, 20°C)  →  answers "Seoul is sunny and 20°C today"
```

- This connects the LLM to **real-time info / external systems**.
- But since the LLM **decides** what to call, there's potential for wrong calls/misuse (security consideration needed).

## Agents — plan and iterate on their own

An **agent**, given a goal, proceeds on its own through **① plan → ② use tools → ③ judge from results → ④ repeat**.

```text
Goal: "Compile the prices of 3 competitors into a table"
  → query each site with a search tool (repeat)
  → gather results
  → organize into a table and report
```

- It takes **several steps by itself** without a human directing each one.
- "Automated pentest" tools like [ARTEX·PentestGPT](/en/security/ai-for-security/ai-tools/overview) are exactly agent examples in the security field.

:::warning Agent security risks
Precisely because they use tools on their own, they're vulnerable to **wrong actions, excessive permissions, and prompt injection**. It's important to design for least privilege and to route risky actions through human confirmation.
:::

## MCP — a 'standard protocol' for connecting tools

**MCP = Model Context Protocol.** A **standard way** to connect AI with external tools/data.

- In the past, each tool had its own connection method.
- MCP defines a **common spec** for "AI ↔ tool," so a tool you build once (an MCP server) can be reused across many AIs.
- Analogy: unifying chargers that differed per product into the **USB-C standard**.

```text
[AI app] ──MCP── [file server]
             └─ [DB server]
             └─ [internal system]
```

## Summary

- **Tools/function calling**: give AI hands and feet to act
- **Agent**: plans, uses tools, and iterates on its own
- **MCP**: a standard protocol to connect tools
- As powerful as they are, **permission/security design** matters.
