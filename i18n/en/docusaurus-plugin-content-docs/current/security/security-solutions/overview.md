---
title: Security Solutions Explained — Overview & Landscape
sidebar_label: Overview
sidebar_position: 1
slug: /security/security-solutions
description: Overview of a series that explains enterprise security solutions (ZTNA, SASE, PAM, NAC, DB access control, etc.) from a practical adoption standpoint. Covers the SSE/SASE/ZTNA relationship and a shared comparison frame
tags: [security-solutions, ZTNA, SASE, overview]
---

# Security Solutions Explained — Overview & Landscape

> **Purpose of this series:** For teams who actually **evaluate and deploy** solutions, each security solution is laid out as "principles → deployment readiness → cost → market → selection criteria." Market and price figures are tagged with **source and as-of date**.

## Why start with the landscape

Security solutions have similar names and overlapping functions (ZTNA, SASE, SSE, VPN...). So before looking at individual products, it's faster to map **what contains what**.

### SSE / SASE / ZTNA relationship

```text
                 ┌──────────────────────── SASE ────────────────────────┐
                 │                                                        │
                 │   ┌──────────────── SSE (security) ───────────┐       │
                 │   │   ZTNA   ·   SWG   ·   CASB   ·   FWaaS    │  +    │  SD-WAN
                 │   │ (access)  (web)    (SaaS)   (firewall)     │ (network)
                 │   └───────────────────────────────────────────┘       │
                 └────────────────────────────────────────────────────────┘

· ZTNA : app-level zero-trust access control (VPN replacement)
· SSE  : bundle of four security functions (ZTNA + SWG + CASB + FWaaS)
· SASE : architecture that converges SSE + SD-WAN (network)
```

- **ZTNA** is the smallest unit (access control). It replaces the VPN.
- **SSE** is a **bundle of security functions** that includes ZTNA.
- **SASE** is the **largest umbrella**, adding **networking (SD-WAN)** to SSE.

→ That's why Gartner's **SSE Magic Quadrant** is effectively the barometer for SASE's security capability.

## Shared comparison frame (7 parts)

Every solution doc in this series uses the same structure, which makes cross-solution comparison easy.

1. **Definition + why it emerged** — the threat/limitation it addresses
2. **How it works / architecture** — diagram-first
3. **Deployment readiness** — what a company must ① assess ② create/prepare ③ decide
4. **Cost structure** — pricing model, reference prices, hidden costs
5. **Market landscape** — global vs Korea (source + date)
6. **Fit by environment** — decision guide
7. **Common misconceptions & pitfalls**

## Document list

| Solution | One-line summary | Doc |
|---|---|---|
| **ZTNA** | App-level zero-trust access (VPN replacement) | [Open](./ztna.md) |
| **SASE** | Converges security + networking in the cloud | [Open](./sase.md) |
| PAM | Privileged access control | (planned) |
| NAC | Network access control | (planned) |
| DB access control | DB access/query control & audit | (planned) |
| Server access control (SAC) | Server access path control & session recording | (planned) |

> For each doc, re-verify market/price figures against the source at publication time. Rankings in the security-solution market shift quarter by quarter.
