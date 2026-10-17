---
title: AI Security Assessment Methodology
sidebar_label: 04. Methodology
sidebar_position: 4
description: The AI security assessment process (asset identification→threat modeling→control check→testing→risk rating→reporting) and how to check each domain
tags: [AI-security, security-assessment, methodology]
---

# AI Security Assessment Methodology

Once you know the threats, it's time to **assess systematically**. This document lays out the assessment process and check domains used in practice.

## I. Assessment process (6 steps)

```text
1. Asset identification → 2. Threat modeling → 3. Control check
      → 4. Testing → 5. Risk rating → 6. Report & improve
```

| Step | Key activity | Output |
|---|---|---|
| **1. Asset identification** | Inventory which AI is used, by whom, with what data (SaaS/RAG/agent) | AI asset inventory |
| **2. Threat modeling** | Derive threats per asset (map to OWASP LLM Top 10 / ATLAS) | Threat list |
| **3. Control check** | Check governance/data/access/model/ops/compliance controls | Control checklist |
| **4. Testing** | Verify prompt injection, data leakage, etc. (assessment view) | Test results |
| **5. Risk rating** | Likelihood × impact → rate | Risk-rating table |
| **6. Report & improve** | Report results, prioritize fixes and action plan | Assessment report |

## II. Checking by domain (6 domains)

The core of the assessment is covering the six domains below without gaps. Detailed items per domain are tabulated in [06. Checklist](./checklist.md).

### 1) Governance & policy
- Is there an AI-usage policy and approval process? (allowed/forbidden tools, assigned owner)
- Is an AI asset inventory maintained? Is there a means to detect Shadow AI?

### 2) Data
- Are enterable data grades defined? (classify data forbidden as input)
- Have you checked training opt-out, data retention, cross-border transfer policies?
- Are leakage-prevention controls like DLP/masking in place?

### 3) Access control & authentication
- Are AI service accounts / API keys managed safely? (SSO, least privilege, key rotation)
- Are permissions separated by user/role?

### 4) Model & prompt
- Are the source/security of models/plugins verified? (supply chain)
- Are a system prompt / guardrails applied?
- Is there input/output filtering (injection / harmful output)?

### 5) Operations & monitoring
- Are query/response logs kept and auditable?
- Are there token/request rate limits and cost alarms?
- Is there anomaly detection and an incident-response procedure?

### 6) Compliance
- What are the gaps against applicable law (AI Framework Act, PIPA, EU AI Act)?
- Is it high-impact AI? Is it subject to output-marking obligations?

## III. Testing — from the "assessment view"

Testing at the assessment stage is to **confirm whether a weakness exists**, not to carry out attacks. Typically:

| Test | What it checks |
|---|---|
| Prompt-injection resistance | Does the model succumb to external/hidden instructions? |
| Data leakage | Does sensitive info remain in output/logs? |
| Permission boundary | Does the agent act beyond the allowed scope? |
| Output safety | Is harmful/false output passed downstream as-is? |

:::caution Scope & authorization
Always perform testing **within a pre-approved scope** and with the target system owner's permission. Reproducing real attack techniques or unauthorized testing is out of scope for this document. Red-team methodology follows separate authorization and procedures.
:::

## IV. Risk rating

A simple, widely used approach is a **likelihood × impact** matrix.

| Impact \ Likelihood | Low | Medium | High |
|---|---|---|---|
| **High** | Medium | High | Critical |
| **Medium** | Low | Medium | High |
| **Low** | Low | Low | Medium |

Set remediation priority (immediate/short/mid-term) by rating. Connecting it to NIST AI RMF's **Measure–Manage** stages makes the system more robust.

## V. Assessment report structure (recommended)

1. Overview — target, scope, period, method
2. Asset inventory
3. Threat/vulnerability findings (by domain)
4. Risk-rating table
5. Improvement recommendations (priority, action plan)
6. Appendix — checklist, criteria mapping

## VI. Conclusion
Assessment should be a **repeatable process**. Don't stop at a one-time check; build a system that reassesses at each AI adoption (the review form in 06) and periodically.
