---
title: Domestic & International AI Security Guidelines & Standards
sidebar_label: 02. Guidelines
sidebar_position: 2
description: A roundup of international and domestic guidelines, standards, and laws that set the criteria for AI security assessment and safe use (OWASP, NIST, EU AI Act, ISO 42001, AI Framework Act, PIPC guide, etc.)
tags: [AI-security, guidelines, compliance]
---

# Domestic & International AI Security Guidelines & Standards

An AI security assessment should rest on **recognized criteria**, not gut feeling. Here are the international and domestic documents most referenced in practice.

:::tip To study deeper
Detailed explanations of each standard and a **map of how the standards relate** are in [07. Standards detail & map](./standards-deep-dive.md).
:::

:::tip Big picture
- Need a **threat checklist** → OWASP LLM Top 10, MITRE ATLAS
- Need a **risk-management system** → NIST AI RMF, ISO/IEC 42001·23894
- Need **regulatory compliance** → EU AI Act, (domestic) AI Framework Act, Personal Information Protection Act
:::

## I. International — threat/security focused

### OWASP Top 10 for LLM Applications (2025)
The ten representative security risks of LLM applications. The de facto standard for assessment checklists. Per-item detail is in [03. Threat model](./threats.md).

- Source: [OWASP Gen AI Security Project — LLM Top 10](https://genai.owasp.org/llm-top-10/)

### MITRE ATLAS
A knowledge base that organizes **attack tactics/techniques** against AI systems in an ATT&CK-style matrix. Being based on real cases, it is useful for threat modeling.

- Source: [MITRE ATLAS](https://atlas.mitre.org/)

### Google SAIF (Secure AI Framework)
A practical framework presenting six core elements for AI system security. Governance, detection, and response views are well organized.

- Source: [Google SAIF](https://saif.google/)

### CISA · NCSC "Guidelines for Secure AI System Development"
A joint **secure-AI development guide** from the US CISA and UK NCSC, covering security principles across the full lifecycle of design–development–deployment–operation.

- Source: [CISA — Guidelines for Secure AI System Development](https://www.cisa.gov/resources-tools/resources/guidelines-secure-ai-system-development)

## II. International — risk management/governance

### NIST AI RMF (AI Risk Management Framework)
NIST's AI risk-management framework (AI 100-1), composed of four functions: **Govern–Map–Measure–Manage**. Also refer to the generative-AI-specific companion, the **Generative AI Profile (NIST AI 600-1)**.

- Source: [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) · [Generative AI Profile (NIST AI 600-1)](https://airc.nist.gov/docs/NIST.AI.600-1.GenAI-Profile.pdf)

### ISO/IEC 42001 — AI Management System (AIMS)
A **management-system certification standard** for organizations that handle AI. What ISO 27001 does for information security, 42001 does for AI (policy, roles, risk management, continual improvement). Certifiable.

- Reference: [ISO/IEC 42001](https://www.iso.org/standard/81230.html)

### ISO/IEC 23894 — AI risk management
A **risk-management guide** applying ISO 31000 (risk management) to the AI context. Used together with 42001.

- Reference: [ISO/IEC 23894](https://www.iso.org/standard/77304.html)

### EU AI Act — risk-based regulation
The world's first comprehensive AI law, regulating AI by risk level: **prohibited (unacceptable) – high – limited – minimal**. It has extraterritorial effect, so Korean companies serving the EU are affected too.

Key dates (2025–2026):

| Date | What applies |
|---|---|
| 2025-02-02 | AI-system definition · **prohibited AI practices**, AI literacy obligation |
| 2025-08-02 | Governance provisions + **general-purpose AI (GPAI) model provider obligations** |
| 2026-07-27 | The **AI Omnibus** amending regulation enters into force (extends high-risk schedule, simplifications) |
| 2026-08-02 | Most remaining provisions apply (incl. Art. 50 **transparency**) = general application |
| 2026-12-02 | Two new prohibitions + **machine-readable marking (watermark) of synthetic output** |
| 2027-12-02 | Annex III **high-risk systems** (hiring, education, essential services, biometrics, etc.) requirements |

- Source: [EU AI Act portal](https://artificialintelligenceact.eu/) · [Implementation timeline](https://www.euaiact.com/implementation-timeline)

:::caution
The EU AI Act timeline was adjusted by the **AI Omnibus** (2026). For legal decisions, always check the Official Journal (EUR-Lex) text.
:::

## III. Domestic (Korea)

### AI Framework Act (인공지능 기본법)
Korea's comprehensive AI law, **in force since 22 January 2026**. It combines industry promotion with regulation.

Key points:
- **High-impact AI**: AI in domains with large effects on life/rights (energy, healthcare, nuclear, criminal investigation, hiring, loan screening, transport, public services, education, etc.) → obligation to provide safety measures that keep humans able to manage/control it
- **Output marking**: watermarking of generative-AI output in principle; deepfakes must disclose/label the fact of AI generation
- **Domestic representative**: required for overseas businesses above a certain size
- The regulated parties are **AI developers/service providers**; ordinary users are not targets. A grace period of at least one year applies

- Reference: [AI Framework Act explainer (KB)](https://kbthink.com/life/daily/ai-basic-act.html)

### PIPC — Generative AI Privacy Guide
Published by the Personal Information Protection Commission on **19 May 2026**. Centered on what users should know when entering personal data into AI, it organizes eight issues including training use, deletion, and cross-border transfer.

Key messages:
- Entered text/files/images/audio **may be used to improve models** → check each service's policy, **opt out of training** where possible, and never enter sensitive identifiers (resident registration, passport, account numbers)
- Deleting a chat **does not guarantee full erasure** (backups, retention periods)
- Data **may be stored/processed overseas** → check destination country, items, purpose
- Manage corporate data with an **enterprise license + internal usage rules**
- Data passed to plugins/integrations may remain even after disconnecting → grant minimum permissions only

- Reference: [Personal Information Protection Commission](https://www.pipc.go.kr)

### FSI · KISA · MSIT
- **Financial Security Institute (FSI)**: finance-specific guidance on generative-AI security/usage, pentest guidelines
- **KISA**: AI security guidelines and threat-response research
- **MSIT**: AI ethics/trustworthiness policy

## IV. Criteria mapping — what to look at

| Purpose | Primary reference | Nature |
|---|---|---|
| Threat checklist | OWASP LLM Top 10, MITRE ATLAS | Technical/threat |
| Risk-management system | NIST AI RMF, ISO/IEC 42001·23894 | Governance |
| Secure development lifecycle | CISA/NCSC guide, Google SAIF | Dev/ops |
| Compliance (overseas) | EU AI Act | Law (extraterritorial) |
| Compliance (domestic) | AI Framework Act, PIPA, PIPC guide | Law |
| Finance sector | FSI guidance | Industry-specific |

## V. Conclusion
Standards are not a "choice" but a **combination**. Typically you put a **threat checklist (OWASP/ATLAS)** on top of a **risk-management system (NIST/ISO)**, and map the **applicable laws (AI Framework Act, PIPA, EU AI Act)** as compliance criteria to design the assessment. The next document looks at the threat model in detail.
