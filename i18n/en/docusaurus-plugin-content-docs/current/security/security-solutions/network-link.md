---
title: Network Interconnection (Separation · CDS · N2SF)
sidebar_label: Network Link (CDS)
sidebar_position: 11
description: Principles of network separation and interconnection (CDS), the N2SF shift (C/S/O tiering), deployment (data grading, direction, CDR), and the Korea market
tags: [security-solutions, network-link, network-separation, CDS, N2SF, data-diode]
---

# Network Interconnection (Separation · CDS · N2SF)

> **Audience:** teams who evaluate/deploy solutions. This is a Korea-specific area. Figures carry **source and as-of date**.

## 1. Network separation & interconnection

- **Separation** — cut the business network from the internet (physical/logical). Blocks external attack and internal leakage. **Mandated** for finance/public. (Physical: two PCs / Logical: VDI.)
- **Interconnection** — data still must move. **Without directly connecting** the two networks, a **CDS** (cross-domain solution) passes **only approved data**, inspected. Direction: two-way / **one-way (data diode)**.

> Key: no direct connection — **break the link (via storage), inspect, then deliver**.

## 2. How it works — CDS data transfer

```text
business net (transfer request) → isolation zone (break link, temp store) → inspect/approve (malware, export policy, sanitize) → internet net (approved only)
```

A CDS is not a pipe but a **checkpoint** — break, inspect, pass only the approved.

## 3. N2SF shift (first overhaul in 18 years)

Uniform network separation hampered AI/cloud adoption; guidelines were distributed Jan 2025 and took effect Jul 2025. It is **not an abolition of separation but data-grade differentiation**.

| Grade | Meaning | Control |
|---|---|---|
| **C** Classified | non-public, most sensitive | keep strong separation |
| **S** Sensitive | important work | differentiated by grade |
| **O** Open | publishable | allow cloud/AI use |

**CDS role expands** — the core control for cross-domain (cross-grade) data linkage. Legacy interconnection → the "post-interconnection (CDS)" market. N2SF earns bonus points in the 2026 cybersecurity evaluation index.

## 4. Deployment — assess · create · decide

**① Assess** — separation type (physical/logical), data types/frequency, **data grade (C/S/O)**, OT/control networks (where one-way is required), NIS verification / CC requirements.

**② Create** — directional CDS, export/import approval workflow, **sanitization (CDR)** + AV integration, transfer logs/audit.

**③ Decide** — two-way vs one-way, per-grade control level, CDR scope, N2SF migration roadmap.

> Using **two-way where OT/control needs one-way (diode)** creates a leakage path. Direction is the key decision.

## 5. Cost & market (Korea public procurement)

- Public-procurement-centric **local market**. NIS verification and CC certification are barriers.
- **Hunesion** leads interconnection public procurement at **47%, #1 for 11 straight years** (since 2015); one-way (diode) 50%. **Hansol, N&SP** offer N2SF-ready next-gen CDS. *(Source: ZDNet, 2026-01)*

## 6. Where it fits

| Situation | Recommendation |
|---|---|
| Public sector (N2SF scope) | CDS + grade-based transition |
| Finance (e-finance separation) | Interconnection + export control |
| OT/control/defense | One-way (data diode) |
| Want AI/cloud adoption | N2SF O-grade + CDS linkage |
| Heavy document import | Combine CDR (sanitization) |

## Common misconceptions

- **Treat it as a "copy pipe"** → without inspection/approval it's a leak/infection path
- **Wrong direction** → OT requires one-way
- **N2SF = abolition of separation** → no; it's grade differentiation
- **Skip sanitization (CDR)** → document malware imported as-is
- **Transition without grading** → differentiated control impossible

---

## Sources (as-of)

- ZDNet, MoneyToday, Datanet (2025–2026) — local vendors / N2SF (NIS N2SF guideline)

> Re-verify figures and regulation at publication time.
