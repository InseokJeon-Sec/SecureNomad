---
title: 14. AI Threat Map
sidebar_label: 14. Threat Map (OWASP LLM Top 10)
sidebar_position: 5
description: Scattered AI security threats on one page — the AI attack surface, OWASP LLM Top 10, per-layer responsibility, and end-to-end defense principles
---

# 14. AI Threat Map

Across this series we met AI security threats one at a time — prompt injection, knowledge poisoning, excessive agency, hidden instructions, the supply chain. The problem was that they were **scattered**, making it hard to see at a glance "what do we need to check in our AI?" This page pulls those threats into **one map** and organizes the AI attack surface using the widely used standard taxonomy, **OWASP LLM Top 10**.

## The AI attack surface, on one page

An AI application flows **input → model inference → knowledge/tools → output/action**. Each of those points is an attack surface.

| Stage | Representative threat |
|---|---|
| **Input** | Prompt injection |
| **Model (acquisition)** | Supply chain (tampered/malicious models) |
| **Knowledge/tools** | Knowledge poisoning, excessive agency |
| **Output/action** | Over-trusting output, unbounded consumption |

There are also **cross-cutting threats**: sensitive-information disclosure, system-prompt leakage, hallucination, data/model poisoning. The key: look at the **entire path from input to output**, not one spot.

## OWASP LLM Top 10

| # | Item | One line |
|---|---|---|
| **LLM01** | Prompt Injection | Input overrides the model's instructions |
| **LLM02** | Sensitive Information Disclosure | PII/secrets leak via output or training |
| **LLM03** | Supply Chain | Tampered/forged models, tools, data |
| **LLM04** | Data & Model Poisoning | Malicious data injected into training/knowledge |
| **LLM05** | Improper Output Handling | Model output executed/shown without validation |
| **LLM06** | Excessive Agency | Agents given too-broad permissions |
| **LLM07** | System Prompt Leakage | Hidden system instructions revealed |
| **LLM08** | Vector & Embedding Weaknesses | Poisoning/leakage in RAG vector stores |
| **LLM09** | Misinformation | Trusting wrong output (e.g. hallucination) |
| **LLM10** | Unbounded Consumption | Cost/resource exhaustion (DoW/DoS) |

All ten map onto topics this series already covered — a scattered set of threats gathered into one checklist.

## Responsibility by layer

| Layer | What it owns |
|---|---|
| **People & process** | Usage policy/training, approval gates, shadow-AI management |
| **Application** | Input/output validation, least privilege, no blind trust in output |
| **Model** | Provenance/integrity, safety evaluation, system-prompt protection |
| **Data** | Training/RAG data quality, vector-store access control |
| **Infrastructure** | Endpoint auth & rate limits, logging & monitoring |

## Five end-to-end defense principles

1. **Draw trust boundaries** — external input/documents/tool results are data, not commands.
2. **Least privilege** — give models/agents/keys only what's needed; human approval for irreversible actions.
3. **Validate output** — don't execute/display model output as-is; check grounding, format, safety.
4. **Verify the supply chain** — check provenance and integrity of models, tools, and data.
5. **Log and record** — connect input → delegation → tool calls → execution, and re-evaluate continuously.

## Where to start — priorities

1. **Know what you use** — AI usage inventory and shadow AI.
2. **Set trust boundaries first** — design so external input isn't trusted as commands.
3. **Narrow permissions** — minimize agent/key/data access + approval gates.
4. **Evaluation & red teaming** — measure performance/hallucination/safety before rollout, re-check periodically.
5. **Logging & monitoring** — keep action records somewhere the model cannot touch.

> There is no perfect AI security. What matters is knowing the attack surface and narrowing it everywhere, little by little.

## Series ↔ OWASP mapping

| Ep | Topic | OWASP |
|---|---|---|
| 3 | Prompt injection | LLM01, LLM05 |
| 4 | RAG | LLM08 (vector/embedding), LLM04 (poisoning) |
| 5 | Agents/MCP | LLM06 (excessive agency), LLM03 (supply chain) |
| 6 | Multimodal | LLM01 (indirect injection), LLM02 (sensitive info) |
| 7 | Fine-tuning | LLM04 (data poisoning), LLM02 (leakage) |
| 8 | Model evaluation | LLM09 (misinformation) |
| 9 | Local & open weights | LLM03 (supply chain), LLM10 (unbounded consumption) |

> **One line:** every time you add a capability, control the new input and new privilege it opens — together.
