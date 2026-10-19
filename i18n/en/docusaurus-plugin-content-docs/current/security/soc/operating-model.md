---
title: SOC Operating Model — Tiers, Shifts, Roles
sidebar_label: Operating Model
sidebar_position: 2
description: SOC analyst tier structure, 24x7 shifts, role division, and operating forms (in-house/MSSP/hybrid)
tags: [SOC, security-monitoring, operations]
---

# SOC Operating Model — Tiers, Shifts, Roles

The backbone of SOC operations is **"who looks, to what depth, and when."** At scale, this structure governs quality.

## Analyst tiers

Most SOCs layer analysts by depth of analysis.

| Tier | Role | Mainly handles |
|---|---|---|
| **L1 (triage)** | First-line alert screening, filtering false positives, escalating by set criteria | High alert volume, lookups, basic checks |
| **L2 (analysis)** | Deep analysis of true positives, scope/impact judgment, response execution | Correlation results, multi-event linkage |
| **L3 (advanced/hunting)** | Novel-threat analysis, threat hunting, detection-content development | Undetected areas, rule/use-case design |

- **Escalation**: L1 passes items exceeding criteria to L2; L2 passes to incident response (IR) when it judges an incident. **Clear "when to raise it" criteria** reduce both bottlenecks and misses.
- **Hunting (L3)** proactively searches logs on a hypothesis rather than waiting for alerts, filling what rules miss.

## 24x7 shifts and handover

Security events don't keep hours, so **24/7/365** operation is the premise.

- Shift composition (day/night/overnight) and fatigue management directly affect detection quality.
- **Handover** is the weak link. If in-progress cases, pending alerts, and temporary blocks are lost at shift change, incidents follow. Standardize the handover format and "open item" tracking.

## What changes in large-scale remote monitoring

Monitoring many clients (or business units) from one center creates problems a single-org SOC doesn't have.

- **Multi-tenancy isolation**: client data/permissions/views must not mix. Analyst access control and data separation are essential.
- **Consistent quality**: judgments must not vary by analyst/shift/client, so **standardizing runbooks and criteria** is key. At scale, you run on "standards," not "individual skill."
- **SLA**: per-client response times and reporting cadence are set by contract. Metrics (next document) are the basis for SLA compliance.
- **PM/QM separation**: a PM (Project Manager) drives operations and a QM (Quality Manager) watches quality, managing throughput and quality together.

## Considerations by form

| Form | Key considerations |
|---|---|
| In-house | Staffing/retention, 24x7 burnout, internalizing detection content |
| MSSP | Conveying org context, scope of confidentiality/log sharing, responsibility boundary (RACI) |
| Hybrid | The first-line(outsourced)/deep(in-house) boundary, handover/escalation linkage |

## Summary
- Tiers (L1–L3) secure **depth**, shifts secure **time**, runbooks/SLAs secure **consistency**.
- At scale, success hinges not on detection technology but on **standardization and handover**.
