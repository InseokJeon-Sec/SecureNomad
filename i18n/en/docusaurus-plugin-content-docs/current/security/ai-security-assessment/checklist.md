---
title: AI Security Assessment Checklist & Adoption Review Form
sidebar_label: 06. Checklist & Form
sidebar_position: 6
description: A ready-to-use AI security assessment checklist and a security review form for adopting new AI
tags: [AI-security, checklist, template]
---

# Checklist & Adoption Review Form

The previous documents are distilled here into a **ready-to-use check sheet**. During assessment, mark each item as Met (O) / Insufficient (△) / N/A, and raise insufficient items as risks.

## I. Assessment checklist (6 domains)

### 1) Governance & policy
| # | Item | Basis |
|---|---|---|
| G1 | An AI-usage policy (allow/deny tools) is documented | AI Framework Act, NIST Govern |
| G2 | An AI asset inventory is maintained | NIST Map |
| G3 | There is a means to detect Shadow AI (unapproved use) | — |
| G4 | There is a security-review process for new AI adoption | ISO 42001 |
| G5 | An AI security owner/organization is assigned | ISO 42001 |

### 2) Data
| # | Item | Basis |
|---|---|---|
| D1 | Enterable data grades are defined | PIPC guide |
| D2 | No-sensitive-input is trained/communicated | PIPA |
| D3 | Training opt-out is configured | PIPC guide |
| D4 | Data retention/deletion policy is checked | — |
| D5 | Cross-border transfer and destination are checked | PIPA |
| D6 | Leakage-prevention controls like DLP/masking exist | LLM02 |

### 3) Access control & authentication
| # | Item | Basis |
|---|---|---|
| A1 | AI service accounts are managed centrally via SSO | — |
| A2 | API keys are stored safely and rotated | — |
| A3 | Permissions are separated by user/role | Least privilege |

### 4) Model & prompt
| # | Item | Basis |
|---|---|---|
| M1 | Source/security of models/plugins is verified | LLM03 |
| M2 | A system prompt / guardrails are applied | LLM07 |
| M3 | Input (injection) filtering exists | LLM01 |
| M4 | Output (harmful/unvalidated) handling exists | LLM05 |
| M5 | RAG reflects document permissions | LLM08 |

### 5) Operations & monitoring
| # | Item | Basis |
|---|---|---|
| O1 | Query/response logs are kept and auditable | — |
| O2 | Token/request rate limits exist | LLM10 |
| O3 | Cost-anomaly alarms exist | LLM10 |
| O4 | Anomaly detection & incident response exist | MITRE ATLAS |

### 6) Compliance
| # | Item | Basis |
|---|---|---|
| C1 | High-impact-AI applicability reviewed | AI Framework Act |
| C2 | Output-marking (watermark) applicability reviewed | AI Framework Act |
| C3 | Legal basis for personal-data processing confirmed | PIPA |
| C4 | Extraterritorial regulation (EU, etc.) applicability reviewed | EU AI Act |

## II. New-AI adoption security review form

A one-page review sheet to fill in when adopting a new AI service/feature.

| Item | Content |
|---|---|
| Service name / provider | |
| Purpose / department | |
| Type | ☐ SaaS LLM ☐ Copilot ☐ In-house RAG ☐ Agent ☐ Self-built |
| Input data grade | ☐ Public ☐ Internal ☐ Confidential/personal |
| Training opt-out | ☐ Available (configured) ☐ Not available |
| Data storage location | ☐ Domestic ☐ Overseas ( ) |
| Plan | ☐ Free ☐ Enterprise |
| Access control | ☐ SSO ☐ Individual accounts / Logging ☐ Yes ☐ No |
| High-impact AI | ☐ Yes ☐ No |
| Output-marking duty | ☐ Applicable ☐ Not applicable |
| Identified risks | |
| Approval | ☐ Approved ☐ Conditional ☐ Rejected / Approver: |

:::tip Available as Excel too
This checklist/review form can be provided as a separate **Excel file** for easier per-assessment logging and aggregation. Ask if you'd like it.
:::

## III. Reference — basis codes
- **LLMxx**: [OWASP LLM Top 10](/en/security/ai-security-assessment/threats)
- **NIST Govern/Map/Measure/Manage**: [NIST AI RMF](/en/security/ai-security-assessment/guidelines)
- **AI Framework Act / PIPA / EU AI Act**: [02. Guidelines](./guidelines.md)
