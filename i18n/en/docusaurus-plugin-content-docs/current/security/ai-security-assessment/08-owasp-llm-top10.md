---
title: OWASP LLM Top 10 — Practitioner Detail
sidebar_label: 08. OWASP LLM Top 10
sidebar_position: 8
description: A practitioner-oriented breakdown of the OWASP Top 10 for LLM Applications (2025) by concept, where it arises, how to check, and how to defend
tags: [AI-security, OWASP, LLM, threats]
---

# OWASP LLM Top 10 — Practitioner Detail

The OWASP **Top 10 for LLM Applications (2025)** is the de facto checklist of the ten major security risks of LLM applications. Where [03. Threat model](./threats.md) is a summary, this document covers each item's **where-it-arises, how-to-check, and how-to-defend** from a practitioner view. (Assessment/defense, not carrying out attacks.)

- Original: [OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/)

## Concept map — LLM app pipeline and where threats sit

Seeing where each item arises in the pipeline reveals the control points.

```text
[user input]
   │ LLM01 prompt injection (direct) · LLM10 unbounded consumption
   ▼
[external content · RAG] ── LLM01 indirect injection · LLM08 vector/embedding · LLM04 poisoning
   ▼
[model]           ── LLM03 supply chain · LLM07 system-prompt leakage
   ▼
[output handling] ── LLM02 sensitive-info disclosure · LLM05 improper output handling · LLM09 misinformation
   ▼
[tools · agents]  ── LLM06 excessive agency
   ▼
[downstream systems / infrastructure]
```

## Item detail

### LLM01 · Prompt Injection
- **Concept**: input overrides the model's intended instructions. Split into *direct* (user manipulates) and *indirect* (hidden instructions in external docs/web/email that the model reads and executes).
- **Where it arises**: user input, and external content fetched by RAG/browsing/agents.
- **Check**: does it process external content? Is there a trust boundary between system instructions and user/external data? Does the model succumb to indirect injection?
- **Defend**: separate trust boundaries, isolate/sanitize external content, validate output, human confirmation before risky actions, least privilege, guardrails/content filters. Full prevention is impossible, so **defense-in-depth** is the premise.

### LLM02 · Sensitive Information Disclosure
- **Concept**: personal/confidential/regulated data exposed in output.
- **Where it arises**: training-data memorization, sensitive info in the system prompt/context, RAG returning out-of-permission documents.
- **Check**: are enterable data grades defined? DLP/masking? Does RAG reflect document permissions? Does sensitive info remain in logs?
- **Defend**: input-data classification/minimization, DLP, output filtering, RAG access control, training opt-out, log masking.

### LLM03 · Supply Chain
- **Concept**: vulnerabilities/tampering in external models, datasets, libraries, or plugins undermine the app.
- **Where it arises**: third-party models from hubs, pretraining data, plugins, dependency packages.
- **Check**: are the source/signature/license of models and plugins verified? Is there an SBOM? Is model-artifact integrity checked?
- **Defend**: trusted sources only, model/artifact signing and verification, dependency scanning (SCA), plugin review, version pinning.

### LLM04 · Data and Model Poisoning
- **Concept**: tampering with training/fine-tuning/RAG data distorts behavior or plants a backdoor.
- **Where it arises**: public-data collection, fine-tuning data, RAG indexing sources.
- **Check**: is data-source trustworthiness verified? Is there cleaning/anomaly detection before indexing? Reproducibility/versioning?
- **Defend**: data-source governance/verification, cleaning and anomaly detection, a trust boundary for RAG sources, data/model versioning.

### LLM05 · Improper Output Handling
- **Concept**: passing output to other systems without validation, enabling downstream attacks like XSS, SQLi, command execution.
- **Where it arises**: feeding LLM output directly into HTML rendering, DB queries, shell/code execution.
- **Check**: is output validated/encoded before going downstream? Are there code/query execution paths?
- **Defend**: don't trust output, context-appropriate encoding/parameterization, sandboxing, allowlists. (Same as web output-handling principles → [XSS](/en/lab/ai-pentest/xss), [SQLi](/en/lab/ai-pentest/sqli))

### LLM06 · Excessive Agency
- **Concept**: an agent with too much autonomy/permission/tool access can take harmful actions.
- **Where it arises**: agents with file-delete, email, payment, or DB-write permissions.
- **Check**: are tool permissions minimized? Human approval for risky actions? Are action scope/limits defined?
- **Defend**: least privilege, expose only needed tools, human-in-the-loop, audit logging, action limits. (Agent concept → [10. Agents & MCP](/en/ai/advanced/agents-mcp))

### LLM07 · System Prompt Leakage
- **Concept**: the system prompt, internal rules, or configuration are extracted.
- **Where it arises**: putting secrets/credentials/internal rules in the prompt.
- **Check**: does the system prompt contain secrets/credentials? What is the blast radius if leaked?
- **Defend**: no secrets in prompts (move to server-side controls), separate sensitive logic, minimize exposure. Assume the prompt can be revealed.

### LLM08 · Vector and Embedding Weaknesses
- **Concept**: RAG returns poisoned/unauthorized/stale content, or data leaks across tenants.
- **Where it arises**: multi-tenant vector DBs, permission-unaware indexes, poisoned embeddings.
- **Check**: do search results reflect document permissions? Is there tenant isolation? Can index sources be trusted?
- **Defend**: permission-aware retrieval, tenant isolation, source verification, index-integrity management. (RAG internals → [RAG internals deep dive](/en/ai/deep-dive/rag-internals))

### LLM09 · Misinformation
- **Concept**: users trust/act on false or misleading information (including hallucination).
- **Where it arises**: ungrounded generation, overconfidence, unverified automated decisions.
- **Check**: are grounding (RAG)/sources presented? Is there a human-verification step? Are important decisions automated?
- **Defend**: RAG grounding, source attribution, human verification, stating confidence limits, human involvement for important decisions. (Hallucination → [05. Hallucination & limits](/en/ai/foundations/hallucination))

### LLM10 · Unbounded Consumption
- **Concept**: excessive token/API/compute use causes cost spikes, degradation, or denial of service.
- **Where it arises**: unlimited requests, large inputs, recursive agent loops.
- **Check**: are there rate limits? Token/cost limits and alarms? Input-size limits? Loop guards?
- **Defend**: rate/quota limits, input-size limits, cost alarms, timeouts/loop guards, caching.

## Practical summary — primary defenses

| Code | Primary defense |
|---|---|
| LLM01 | Trust-boundary separation + defense-in-depth (input isolation, output validation, human confirmation) |
| LLM02 | Input-data classification + DLP + RAG access control |
| LLM03 | Source verification + signing + dependency scanning |
| LLM04 | Data-source governance + cleaning/anomaly detection |
| LLM05 | Distrust output + context-appropriate encoding/parameterization |
| LLM06 | Least privilege + human-in-the-loop |
| LLM07 | No secrets in prompts (server-side control) |
| LLM08 | Permission-aware retrieval + tenant isolation |
| LLM09 | RAG grounding + sources + human verification |
| LLM10 | Rate/quota + cost alarms + loop guards |

## Assessment linkage
These ten items connect to the "Model & prompt / Operations" check areas in [04. Assessment methodology](./assessment-method.md) and the M/O items in the [06. Checklist](./checklist.md).
