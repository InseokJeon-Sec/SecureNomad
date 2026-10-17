---
title: AI Security Threat Model
sidebar_label: 03. Threat Model
sidebar_position: 3
description: AI/LLM security threats centered on OWASP LLM Top 10 (2025) and MITRE ATLAS — what you need to assess
tags: [AI-security, threat-model, OWASP]
---

# AI Security Threat Model

The starting point of a security assessment is knowing **"what can go wrong."** This document centers on **OWASP LLM Top 10 (2025)**, the de facto standard for LLM-application threats.

## I. OWASP Top 10 for LLM Applications (2025)

| Code | Threat | One-line description |
|---|---|---|
| **LLM01** | Prompt injection | Input (direct/indirect) overrides the model's intended instructions |
| **LLM02** | Sensitive information disclosure | Personal/confidential/regulated/proprietary data exposed in output |
| **LLM03** | Supply chain | Vulnerabilities in third-party models/datasets/libraries/plugins |
| **LLM04** | Data & model poisoning | Tampering with training/fine-tuning/retrieval data to distort behavior / add backdoors |
| **LLM05** | Improper output handling | Passing output to other systems without validation → XSS/SQLi |
| **LLM06** | Excessive agency | Too much autonomy/permission/tool access → harmful actions |
| **LLM07** | System prompt leakage | Extracting hidden instructions/internal rules/config |
| **LLM08** | Vector & embedding weaknesses | RAG returns poisoned/unauthorized/stale content, cross-tenant leakage |
| **LLM09** | Misinformation | The model produces false/misleading info that users trust and act on |
| **LLM10** | Unbounded consumption | Excessive token/API/compute use → cost spikes, outages |

- Source: [OWASP LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/)

### Three to watch especially

**① LLM01 Prompt injection** — the most fundamental threat, hard to fully solve.
- *Direct*: the user manipulates directly ("ignore previous instructions")
- *Indirect*: **hidden instructions** in external web pages/documents/emails that the AI reads and executes. The more RAG/agent/browsing features are attached, the higher the risk

**② LLM02 Sensitive information disclosure** — the most realistic risk in organizational assessments.
- Entered sensitive info remains in logs/training, or the model outputs similar info to another user

**③ LLM06 Excessive agency** — the core threat of the AI-agent era.
- When an agent has authority for **real actions** (delete files, send mail, make payments), a single injection turns into real damage

## II. MITRE ATLAS — attack tactics/techniques

[MITRE ATLAS](https://atlas.mitre.org/) organizes attacks against AI systems into an ATT&CK-style **Tactic × Technique** matrix. Being case-based, it covers "observed attacks," not "theoretical threats."

Example tactic flow:

```text
Reconnaissance → ML Model Access
→ Resource Development (e.g., crafting adversarial examples)
→ Execution → Evasion / Exfiltration
→ Impact (e.g., disabling/misbehaving the model)
```

Example techniques: Model Extraction, Evasion via Adversarial Example, training-data poisoning, prompt injection, etc.

## III. Threats by layer

Splitting threats into "layers" helps cover the assessment scope fully.

| Layer | Example threats | Related OWASP |
|---|---|---|
| **Data** | Training/RAG data poisoning, sensitive data included | LLM04, LLM08 |
| **Model** | Model extraction, adversarial examples, backdoor | LLM03, LLM04 |
| **Application/API** | Prompt injection, unvalidated output, system-prompt leakage | LLM01, LLM05, LLM07 |
| **Infrastructure** | API-key leakage, unbounded consumption (cost/DoS) | LLM10 |
| **Operations/people** | Shadow AI, entering sensitive info, over-trusting hallucinations | LLM02, LLM09 |

## IV. Connecting threats → assessment items

Each threat becomes a **check question** at assessment time. (Detailed checklist in [06. Checklist](./checklist.md))

| Threat | Example assessment question |
|---|---|
| Prompt injection | Does it process external content? Are there input/output filters/isolation? |
| Sensitive info disclosure | What data can be entered? Is there DLP/masking? |
| Excessive agency | Are agent tool permissions minimized? Is there a human-approval step? |
| Supply chain | Are the source/security of models/plugins verified? |
| Unbounded consumption | Token/request rate limits, cost alarms? |

## V. Conclusion
Knowing the threats reveals the **assessment items**. Using OWASP LLM Top 10 as the "skeleton of the checklist" and MITRE ATLAS as "real attack scenarios" yields a balanced threat model. The next document weaves these into an actual **assessment process**.
