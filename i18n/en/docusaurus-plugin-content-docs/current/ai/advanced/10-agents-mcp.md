---
title: 10. AI Agents · Tools · MCP
sidebar_label: 10. Agents & MCP
sidebar_position: 1
description: Agents that use tools, function calling, and the standard connection protocol MCP
---

# 10. AI Agents · Tools · MCP

A base LLM is a passive model that answers questions. Giving it tools so it performs tasks on its own makes an **AI agent**.

## Tools (function calling)

A base LLM only generates text and cannot take real actions like calculating, searching, or accessing files. **Tools / function calling** let the LLM call a pre-connected function when needed.

```text
"Weather in Seoul today?"  →  LLM calls get_weather("Seoul")  →  receives (sunny, 20°C)  →  generates answer
```

This connects the LLM to real-time info and external systems. Since the LLM decides what to call, there is potential for wrong calls/misuse.

## Agents

An **agent** takes a goal and performs **plan → use tools → judge results → repeat** on its own. Automated pentest tools in security ([ARTEX, PentestGPT](/en/security/ai-for-security/ai-tools/overview)) are examples.

:::warning Agent security risks
Because they use tools on their own, they are vulnerable to wrong actions, excessive permissions, and prompt injection. Minimize permissions and route risky actions through human confirmation.
:::

## MCP

**MCP (Model Context Protocol)** is a standard protocol connecting AI with external tools/data. It unifies previously ad-hoc connection methods into a common spec, so a tool built once (an MCP server) can be reused across AIs.

```text
[AI app] ──MCP── [file server] · [DB server] · [internal system]
```

Tools, agents, and MCP are powerful, so permission/security design must go with them.
