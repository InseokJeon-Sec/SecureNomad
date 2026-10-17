---
title: Safe AI Usage Guide
sidebar_label: 05. Safe-usage Guide
sidebar_position: 5
description: Practical guidance for using AI safely from the organization, user, technical-control, and developer perspectives
tags: [AI-security, guide, best-practices]
---

# Safe AI Usage Guide

Once the assessment shows "what is risky," the next question is **"how to use it safely."** Organized by audience.

## I. Organization (management) view

### Establish an AI usage policy
- **Allow/deny lists**: specify approved and forbidden AI tools (prevents Shadow AI)
- **Data-input classification**: define which data grades may be entered
  - e.g., public (OK) / internal (enterprise plan only) / confidential·personal (forbidden)
- **Owner & approval process**: security review when adopting new AI ([the review form in 06](./checklist.md))
- **Training**: AI-security awareness training for employees (no sensitive input, etc.)

### Governance
- Maintain an AI asset inventory, reassess periodically
- Adopt NIST AI RMF / ISO 42001 as an organization-level framework

## II. User (employee) rules

:::tip Five things employees should follow
1. **No sensitive input** — don't put resident-registration/account/passport numbers, customer data, or trade secrets in prompts
2. **Approved tools only** — only AI services/plans the organization approves
3. **Verify output** — don't trust AI answers blindly; re-check facts and sources (beware hallucination)
4. **Check training opt-out** — configure so input isn't used for model training
5. **Manage conversations** — turn off saving for sensitive chats, revoke unnecessary integration/plugin permissions
:::

The PIPC guide also recommends, from the user's view, checking **training use, deletion limits, and cross-border transfer** (see doc 02).

## III. Technical-control view

Technical safeguards you can apply at the organizational level.

| Control | Role |
|---|---|
| **AI gateway/proxy** | Funnel the org's AI traffic to one place to apply policy/logging/filters |
| **DLP (data loss prevention)** | Detect/block sensitive info going out via prompts |
| **Enterprise plan** | Provides training opt-out, data-retention control, admin features |
| **SSO & access control** | Central account/API-key management, least privilege, key rotation |
| **Logging & audit** | Make who-queried-what traceable |
| **Rate & cost limits** | Token/request rate limits, cost alarms (prevent unbounded consumption) |

## IV. Developer view (when building RAG/agents)

If you develop AI features directly, build the following into the design.

### Input/output safety
- **Input filtering**: don't trust external content (web/docs); isolate and validate (against indirect prompt injection)
- **Output validation**: validate/escape LLM output before passing it to other systems (LLM05)
- **Protect the system prompt**: don't rely on the prompt alone for sensitive settings (LLM07)

### Agent design
- **Least privilege**: give tool/API permissions only as needed (LLM06)
- **Human-in-the-loop**: a human-approval step for risky actions (delete files, pay, send mail)
- **Guardrails**: explicitly limit allowed actions/scope

### RAG design
- **Reflect document permissions**: don't let documents a user can't see leak into answers (LLM08)
- **Verify data provenance**: check data trustworthiness before indexing (against poisoning)
- **Tenant isolation**: separate embeddings/retrieval results in multi-tenant environments

## V. Adoption check (summary)

Minimum checks when adopting a new AI service:

- [ ] Checked training opt-out / data-retention policy
- [ ] Checked cross-border transfer and destination country
- [ ] Use enterprise plan (where possible)
- [ ] Configured access control and logging
- [ ] Completed training on forbidden-input data
- [ ] Reviewed applicable law (high-impact AI, output marking, etc.)

## VI. Conclusion
Safe AI usage is not a single control but a combination of **organizational policy + user habits + technical controls + secure development**. Use the next document's checklist to connect this to actual assessment.
