---
title: MITRE ATLAS — Practitioner Detail
sidebar_label: 09. MITRE ATLAS
sidebar_position: 9
description: The structure of MITRE ATLAS (tactics, techniques, mitigations, case studies), its relationship to ATT&CK, and practical use
tags: [AI-security, MITRE, ATLAS, threat-model]
---

# MITRE ATLAS — Practitioner Detail

**MITRE ATLAS** (Adversarial Threat Landscape for Artificial-Intelligence Systems) is a knowledge base that organizes attacks against AI/ML systems into a **MITRE ATT&CK-style tactic/technique matrix**. Where the [OWASP LLM Top 10](./08-owasp-llm-top10.md) is an "app-risk checklist," ATLAS is an **attacker knowledge base of "how adversaries actually move," organized by tactic stage**. It is grounded in observed and researched cases.

- Original: [MITRE ATLAS](https://atlas.mitre.org/)

## Relationship to ATT&CK

- Same structure, terminology, and matrix approach as ATT&CK, so ATT&CK users adopt it readily.
- Inherits most tactics (reconnaissance, initial access, execution, exfiltration, etc.) from ATT&CK but reinterprets them for AI/ML.
- Adds two AI-specific tactics: **ML Model Access** and **ML Attack Staging** (crafting adversarial examples, etc.).
- Recommended use: ATT&CK for traditional infrastructure, ATLAS for AI-specific paths, together.

## Structure

| Element | Description |
|---|---|
| **Tactic** | The adversary's goal per stage ("why"). ID e.g. `AML.TA0004` |
| **Technique** | The means to the goal ("how"). ID e.g. `AML.T0051` |
| **Sub-technique** | Variations of a technique (e.g., direct/indirect prompt injection) |
| **Mitigation** | Defenses countering a specific technique |
| **Case study** | Real attacks mapped to tactics/techniques |

> Counts grow by version (v5.1.0, Nov 2025 added the **Command and Control** tactic → 16 tactics). Always check the official site for exact IDs/counts. ATLAS data is also provided in STIX 2.1.

## Tactic flow (16)

```text
Reconnaissance → Resource Development → Initial Access
→ [AI] ML Model Access → Execution → Persistence → Privilege Escalation
→ Defense Evasion → Credential Access → Discovery
→ Collection → [AI] ML Attack Staging → Exfiltration → Impact
→ Command and Control
```

- **[AI]** marks the AI-specific tactics (ML Model Access, ML Attack Staging).
- The rest are inherited from ATT&CK and applied to the AI context.

## Representative techniques (examples)

Exact IDs/names shift by version, so the below is for grasping the nature.

| Tactic | Technique example |
|---|---|
| ML Model Access | Inference-API access, querying to replicate a model |
| ML Attack Staging | Crafting adversarial examples, training a surrogate model |
| Initial Access | **Prompt injection** (`AML.T0051`, direct/indirect) |
| Exfiltration | Model extraction, training-data extraction |
| Impact | Disabling/misbehaving the model, denial of service |

## Extension to generative AI & agents

ATLAS has been rapidly reflecting the LLM/agent attack surface (examples):

- **Prompt injection** (direct/indirect) — initial access
- **RAG database retrieval/poisoning** — collection/poisoning
- **AI agent tool abuse / publishing poisoned tools** — execution/persistence
- **Credentials from AI agent configuration**, **AI agent context poisoning**
- **MCP server compromise** case study — targeting [MCP](/en/ai/advanced/agents-mcp) infrastructure

These map directly to LLM01 (injection), LLM06 (excessive agency), and LLM08 (vector/embedding) of the [OWASP LLM Top 10](./08-owasp-llm-top10.md).

## ATLAS vs OWASP LLM Top 10

| Aspect | MITRE ATLAS | OWASP LLM Top 10 |
|---|---|---|
| Nature | Attack tactic/technique KB (ATT&CK-style) | App-risk checklist |
| View | Attacker flow (by stage) | Defensive checklist |
| Use | Threat modeling, red-teaming, detection mapping, case learning | Assessment checklist, defense design |
| Relationship | The attack path by stage | What to check along that path |

They complement each other: **attack flow (ATLAS) ↔ defensive checks (OWASP)**.

## Practical use

- **Threat modeling**: derive an AI system's attack paths by tactic stage; check which stages are exposed.
- **Red-team planning**: use tactics/techniques as a shared scenario language (within an authorized scope).
- **Detection/response mapping**: connect per-technique mitigations/detection points to SOC detection rules.
- **Case learning**: understand how real attacks unfold via case studies.
- **Assessment linkage**: referencing ATLAS in the threat-modeling step of [04. Assessment methodology](./assessment-method.md) reinforces the "real attack scenario" axis.

## Summary
- ATLAS = the **ATT&CK of AI attacks**. Tactic (goal) × technique (means) matrix + mitigations + real cases.
- ATT&CK inheritance + AI-specific tactics (ML Model Access, ML Attack Staging) + a fast-growing set of LLM/agent techniques.
- Paired with OWASP LLM Top 10: **ATLAS for the attack flow, OWASP for the defensive checks.**
