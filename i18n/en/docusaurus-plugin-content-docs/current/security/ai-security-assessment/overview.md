---
title: Securing AI — Overview
sidebar_label: 01. Overview
sidebar_position: 1
description: The concept and scope of security assessment for an organization's safe use of AI, and the difference between Security for AI and AI for Security
tags: [AI-security, security-assessment]
---

# Securing AI — Overview

## I. Why a security assessment is needed for AI usage

As generative AI rapidly enters the workplace, the risks grow as much as the convenience. The main problems:

| Risk | Description |
|---|---|
| **Data leakage** | Entering sensitive info / trade secrets in prompts → may remain in external model training or logs |
| **Shadow AI** | Employees use unapproved AI tools on their own (no control, no visibility) |
| **Prompt injection** | Malicious instructions hidden in external docs/web pages hijack AI behavior |
| **Hallucination** | Trusting plausible wrong answers leads to bad decisions |
| **Excessive agency** | An AI agent with too much system/tool authority amplifies damage |
| **Compliance violation** | Potential breach of the Personal Information Protection Act, AI Framework Act, etc. |

:::info Key distinction — "AI for Security" vs "Security for AI"
- **AI for Security**: using AI **as a tool for security work** (vulnerability analysis, pentest assistance, etc.) → the [AI for Security](/en/security/ai-for-security/overview) section
- **Security for AI (this section)**: making the **use of AI itself safe** (security assessment and controls for adopting/using AI)

The two point in opposite directions. This document covers the latter — **assessment and guidance for using AI safely**.
:::

## II. Goals of the assessment

1. **Identify risk** — grasp which AI is used, by whom, with what data
2. **Check controls** — confirm technical/administrative/physical controls are appropriate
3. **Confirm compliance** — find gaps against domestic/international guidelines and law
4. **Prioritize improvements** — decide what to fix first based on risk rating

## III. Assessment scope

AI enters an organization in many forms, each with different threats and controls.

| Type | Example | Main concerns |
|---|---|---|
| **SaaS LLM** | External services like ChatGPT, Claude, Gemini | Data training/transfer, account management, logging |
| **Copilot/plugins** | GitHub Copilot, office copilots | Source-code/document leakage, permissions |
| **In-house RAG** | Internal-document Q&A bot | Access control, document permissions, embedding leakage |
| **AI agent** | Agents that call tools/APIs | Excessive agency, prompt injection, chained actions |
| **Self-built/fine-tuned** | In-house model building | Training data, model supply chain, infrastructure |

## IV. This section

| Document | Content |
|---|---|
| 02. Guidelines | The international/domestic standards and laws that **set the criteria** for assessment and usage |
| 03. Threat model | **What** to assess (OWASP LLM Top 10, MITRE ATLAS) |
| 04. Assessment methodology | **How** to assess (process, check domains) |
| 05. Safe-usage guide | **How** to use it (organization, user, technical, developer) |
| 06. Checklist & review form | A ready-to-use checklist for practice |
| 07. Standards detail & map | Per-standard detail + a **map** of how they relate + original links (deep dive) |
| 08. OWASP LLM Top 10 | Each of the 10 risks — where it arises, how to check, how to defend (practitioner detail) |

## V. Conclusion

An AI security assessment is not "don't use AI" but **"have the evidence and controls to use it safely."**
