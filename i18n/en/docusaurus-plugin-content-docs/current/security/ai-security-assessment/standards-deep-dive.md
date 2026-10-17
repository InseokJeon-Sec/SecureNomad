---
title: Standards & Frameworks — Detail and Relationships
sidebar_label: 07. Standards Detail & Map
sidebar_position: 7
description: A study document covering AI security standards in detail (NIST AI RMF, ISO/IEC 42001·23894, OWASP LLM Top 10, MITRE ATLAS, EU AI Act, Korea's AI Framework Act) and explaining how they relate
tags: [AI-security, standards, NIST, ISO, guidelines]
---

# Standards & Frameworks — Detail and Relationships

Where [02. Guidelines](./guidelines.md) is "a list and summary," this document is for studying **each standard in depth and how they fit together**.

:::tip First — "there is no single main standard"
AI security/governance has no one standard that rules everything. Different roles stack in **layers**. "Which is the main one" depends on **which layer** you mean.
:::

## I. The map — how the standards relate

### Layer map

| Layer | Role | Representative | Nature |
|---|---|---|---|
| **Law/regulation** | What you must obey | EU AI Act · (Korea) AI Framework Act · PIPA | Mandatory |
| **Certification** | Third-party attestation | ISO/IEC 42001 | Voluntary (certifiable) |
| **Governance framework** | The backbone/common language of risk management | NIST AI RMF | Voluntary |
| **Risk methodology** | How to identify/assess risk | ISO/IEC 23894 | Guidance (not certifiable) |
| **Secure development** | Lifecycle security principles | Google SAIF · CISA/NCSC guide | Guidance |
| **Threat checklists** | Actual assessment items | OWASP LLM Top 10 · MITRE ATLAS | Guidance (hands-on) |

### The order you weave them in practice

```text
[frame it]       Build the governance/risk backbone with NIST AI RMF
   │
   ├─[fill method]   Reinforce risk identification/assessment with ISO/IEC 23894
   │
   ├─[assess]        Assess real vulnerabilities with OWASP LLM Top 10 · MITRE ATLAS
   │
   ├─[certify]       Obtain ISO/IEC 42001 certification if required
   │
   └─[comply]        Map to EU AI Act · AI Framework Act · PIPA (mandatory)
```

### Crosswalks (mutual mapping)
The standards translate into one another. NIST officially provides an **AI RMF ↔ ISO/IEC 23894 crosswalk**, and when preparing ISO 42001 you can map material organized in NIST RMF language directly. In other words, **learn one well and it's easy to carry over to the others.**

:::info One-line summary
- Most used **when actually assessing** → OWASP LLM Top 10
- Most referenced **as a governance framework** → NIST AI RMF
- What you **must obey** → law (in Korea, the AI Framework Act and PIPA)
- Proof **by certification** → ISO/IEC 42001
:::

---

## II. Governance / risk frameworks

### NIST AI RMF (AI 100-1)
- **By/year**: US NIST, January 2023. **Free, voluntary**, general-purpose.
- **Structure — four functions**: `GOVERN` (foundation: culture, policy, roles) wraps the rest, and within it `MAP` (context/risk identification) → `MEASURE` (measurement/testing) → `MANAGE` (response) iterate.
- **7 characteristics of trustworthy AI**: valid & reliable / safe / secure & resilient / accountable & transparent / explainable & interpretable / privacy-enhanced / fair (bias managed).
- **Generative-AI companion — GenAI Profile (AI 600-1, Jul 2024)**: maps ~12 GenAI-specific risks (hallucination, information integrity, data privacy, cybersecurity, CBRN info, harmful bias, IP, etc.) to ~200 suggested actions across the four functions. **If you work with LLMs, this Profile is more practical than the core.**
- **Nature**: no legal force. Gives "what," but the organization fills in "how."
- **Original**: [NIST AI RMF (official)](https://www.nist.gov/itl/ai-risk-management-framework) · [GenAI Profile publication](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) — free PDF download

### ISO/IEC 23894 — AI risk management (guidance)
- **By/year**: ISO/IEC, 2023. A **non-certifiable guidance** document.
- **Content**: extends the general risk-management standard **ISO 31000 to the AI context**. Methods to identify/assess/treat AI-specific risks like bias, model drift, explainability, and societal impact.
- **In practice**: the **methodology** that fills the "risk process" ISO 42001 requires. But organizations rarely "implement 23894" directly; **NIST AI RMF more often takes that role**. Treat it as secondary/reference.
- **Original**: [ISO/IEC 23894:2023 (catalog)](https://www.iso.org/standard/77304.html) — **paid, copyrighted (cannot be attached)**

---

## III. Management system / certification

### ISO/IEC 42001 — AI Management System (AIMS)
- **By/year**: ISO/IEC, December 2023. The only **certifiable** AI standard.
- **Structure**: the same **PDCA (Plan-Do-Check-Act)** management-system frame as ISO 27001 + **Annex A controls** (AI policy, resources, impact assessment, data/model lifecycle, etc.).
- **Position**: does for AI what ISO 27001 does for information security. Proves organization-level governance by **audit/certification**.
- **Adoption (objective)**: being a late-2023 standard, it's **still early**. Few certified organizations (the first US certification was mid-2025), not yet universal like ISO 27001. Not legally required. The adoption driver is **customer/procurement trust demand** more than regulation. By analogy, it sits roughly where **ISO 27001 was 15–20 years ago** — a differentiator, not yet table stakes.
- **Original**: [ISO/IEC 42001:2023 (catalog)](https://www.iso.org/standard/81230.html) — **paid, copyrighted (cannot be attached)**

---

## IV. Threat / security checklists (hands-on)

### OWASP Top 10 for LLM Applications (2025)
- **By**: OWASP Gen AI Security Project. **Free, open license**.
- **Content**: the 10 major risks of LLM apps (LLM01 prompt injection ~ LLM10 unbounded consumption). Detail in [03. Threat model](./threats.md).
- **Position**: the checklist **most hands-on in actual security assessment**. Unlike abstract frameworks, it becomes assessment items directly.
- **Original**: [OWASP LLM Top 10 (official)](https://genai.owasp.org/llm-top-10/) — free PDF download

### MITRE ATLAS
- **By**: MITRE. Free.
- **Content**: attack tactics/techniques against AI systems in an ATT&CK-style matrix (case-based).
- **Position**: reference for "real attack scenarios" during threat modeling/red-teaming.
- **Original**: [MITRE ATLAS (official)](https://atlas.mitre.org/)

---

## V. Secure-development frameworks

### Google SAIF (Secure AI Framework)
- A practical framework presenting six core elements of AI-system security (governance/detection/response views).
- **Original**: [Google SAIF (official)](https://saif.google/)

### CISA · NCSC "Guidelines for Secure AI System Development"
- Joint US CISA / UK NCSC. Security principles across the full design–development–deployment–operation lifecycle.
- **Original**: [CISA guide (official)](https://www.cisa.gov/resources-tools/resources/guidelines-secure-ai-system-development)

---

## VI. Law / regulation (mandatory)

### EU AI Act
- **By/nature**: EU, the world's first comprehensive AI law. Risk-tiered (prohibited/high/limited/minimal). **Extraterritorial** (affects non-EU firms serving the EU).
- **Timeline (2025–2026)**: 2025-02 prohibited practices → 2025-08 general-purpose AI (GPAI) obligations → 2026-08 general application (Art. 50 transparency) → 2026-12 synthetic-output watermarking, etc. (the AI Omnibus adjusted part of the high-risk schedule)
- **Original**: [EU AI Act portal](https://artificialintelligenceact.eu/) · [official text, EUR-Lex (Regulation (EU) 2024/1689)](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)

### Korea — AI Framework Act
- **Formal name**: "Framework Act on the Development of Artificial Intelligence and Establishment of a Foundation of Trust." **In force since 22 January 2026**.
- **Key**: safety obligations for high-impact AI, output marking (watermark), a domestic representative for overseas businesses. Regulated parties are developers/service providers (not ordinary users), with a grace period of a year or more.
- **Original**: [National Law Information Center (law.go.kr)](https://www.law.go.kr) — search by the law's name

### Korea — PIPA + PIPC guide
- The legal basis for personal-data processing. The PIPC published a **Generative AI Privacy Guide (19 May 2026)** covering 8 issues such as training use, deletion, and cross-border transfer.
- **Original**: [Personal Information Protection Commission (pipc.go.kr)](https://www.pipc.go.kr)

---

## VII. Collected originals

| Standard | Nature | Free | Original |
|---|---|---|---|
| NIST AI RMF (100-1) | Framework | ✅ | [link](https://www.nist.gov/itl/ai-risk-management-framework) |
| NIST GenAI Profile (600-1) | Framework | ✅ | [link](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) |
| ISO/IEC 42001 | Certification | ❌ paid | [catalog](https://www.iso.org/standard/81230.html) |
| ISO/IEC 23894 | Guidance | ❌ paid | [catalog](https://www.iso.org/standard/77304.html) |
| OWASP LLM Top 10 | Checklist | ✅ | [link](https://genai.owasp.org/llm-top-10/) |
| MITRE ATLAS | Checklist | ✅ | [link](https://atlas.mitre.org/) |
| Google SAIF | Secure dev | ✅ | [link](https://saif.google/) |
| CISA/NCSC guide | Secure dev | ✅ | [link](https://www.cisa.gov/resources-tools/resources/guidelines-secure-ai-system-development) |
| EU AI Act | Law | ✅ | [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) |
| AI Framework Act | Law (KR) | ✅ | [law.go.kr](https://www.law.go.kr) |
| PIPA / guide | Law (KR) | ✅ | [pipc.go.kr](https://www.pipc.go.kr) |

:::caution ISO copyright note
ISO/IEC 42001 and 23894 are **paid, copyrighted documents**. Only the official purchase (catalog) links are provided; their original PDFs cannot be attached/redistributed on this site. The others (NIST, OWASP, EU, Korean law) are officially free and downloadable from the links above.
:::

## VIII. Conclusion

- **There is no single main standard.** Law (mandatory) · certification (ISO 42001) · framework (NIST) · checklist (OWASP) divide the roles and stack up.
- Practical depth priority: start with the trio **NIST AI RMF (frame) + OWASP LLM Top 10 (assess) + domestic law (mandatory)**; ISO 42001 when certification is needed; ISO 23894 as reference.
- Since the standards translate into one another via crosswalks, **learning one framework (NIST) well** makes it easy to extend to the rest.
