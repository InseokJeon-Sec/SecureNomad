---
title: Database Access Control Explained
sidebar_label: DB Access Control
sidebar_position: 8
description: The four functions of DB access control (access control, SQL audit, masking, anomaly blocking), proxy vs sniffing, deployment (sensitive columns, app paths), and the Korea market
tags: [security-solutions, db-access-control, data-security, masking, access-control]
---

# Database Access Control Explained

> **Audience:** teams who evaluate/deploy solutions. Figures carry **source and as-of date**.

## 1. Why it matters

Databases concentrate personal and financial data, so a DBA or developer querying **directly** can pull **hundreds of thousands of records in one line** with no trace. DB access control funnels every connection through a **gateway** to record, mask, and control it. Privacy law (access control / access logging), electronic-finance rules, and ISMS mandate it.

## 2. Four functions

- **Access control** — differentiate by auth, permission, time, IP
- **SQL audit** — record and reconstruct every query
- **Data masking** — de-identify result values (SSN, card) *— the decisive difference from other tools*
- **Anomaly blocking** — block bulk queries and risky statements

## 3. How it works

| Method | Traits |
|---|---|
| **Proxy (gateway)** | Force all access through a proxy; firm blocking/masking; **no bypass** (recommended) |
| **Sniffing (monitoring)** | Network mirroring; easy to deploy; blocks via TCP reset (after the fact); **bypass possible** |

> Don't confuse with SAC (server OS access) — DB access control watches **query (DB) access**. They're complementary.

## 4. Deployment — assess · create · decide

**① Assess** — DB types/count (Oracle/MySQL/PostgreSQL/MSSQL/**NoSQL**), DB accounts (shared DBA/app/personal/batch), access paths (direct / **via WAS (app)** / tools), **map of sensitive-column locations**.

**② Create** — gateway + redundancy, per-DB integration accounts, **column-level masking policy**, approval workflow, WAS (app) integration, logs + long-term retention.

**③ Decide** — proxy vs sniffing, masking scope, bulk-query threshold/approval, **attribution for app-path access** (the real user behind a shared app account).

> **Real bulk queries often come via the app (WAS).** Watching only people and omitting the app path leaves you blind.

## 5. Cost & market (Korea-led)

- **Cost:** based on DB count/users. Korea's DB access-control market is **~KRW 100B**; public/finance require CC certification. Hidden cost = sensitive-column identification and masking design, app-path integration, proxy performance validation.
- **Market:** local vendors lead — **DBSAFER (PnPSecure)** 6,000+ deployments, self-claimed #1; **WareValley Chakra Max** (DB + system) forms a duopoly; **Sinsiway DB-i** (DB access + encryption). Regulation, Korean-language audit, and references are the barriers.

## 6. Where it fits

| Situation | Recommendation |
|---|---|
| Finance/public/large PII | Essential + masking |
| Many direct DBA/dev connections | Gateway control & audit |
| Outsourced DB maintenance | Session recording + approval |
| Bulk queries via app (WAS) | App-path attribution + bulk control |
| Cloud DB/DBaaS | Cloud support + encryption integration |

## Common misconceptions

- **Miss the app (WAS) path** → blind spot for real bulk queries
- **Record but don't mask** → the privileged see raw data
- **Skip sensitive-column discovery** → masking/control meaningless
- **Sniffing is enough** → bypass possible; use proxy for compliance
- **Skip performance testing** → proxy latency; benchmark first

---

## Sources (as-of)

- Korean industry press (ComputerWorld, ZDNet, TheBell, 2025–2026) — local vendors/market (incl. company claims)

> Re-verify figures at publication time.
