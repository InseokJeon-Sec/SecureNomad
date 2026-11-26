---
title: SASE Explained — Principles, Deployment, Cost, Market
sidebar_label: SASE (Security + Network)
sidebar_position: 3
description: The components and architecture of SASE (Secure Access Service Edge), single-vendor vs dual-vendor, deployment readiness (assess/prepare/decide), cost structure, global/Korea market landscape, and selection criteria, from a practical adopter's standpoint
tags: [security-solutions, SASE, SSE, ZTNA, SWG, CASB, SD-WAN, network-security]
---

# SASE Explained — Principles, Deployment, Cost, Market

> **Audience:** Practitioners who actually evaluate and deploy solutions. Principles are covered thoroughly, with weight on "what to prepare, what it costs, and what to choose."
> **On figures:** Market and price numbers move a lot, so each is tagged with its **source and as-of date**. These are reference ranges, not contract quotes.
> **Read first:** [ZTNA Explained](./ztna.md) — ZTNA is the core component of SASE.

## 1. What SASE is — and why it emerged

**SASE (Secure Access Service Edge)** converges the once-scattered **network (WAN) and security functions into a single cloud service**. Proposed by Gartner in 2019, its core idea is: "**wherever the user/device is, handle connectivity and security together at a nearby cloud point of presence (PoP).**"

SASE is not a single product but a **bundle of five components**.

| Component | Role | Note |
|---|---|---|
| **ZTNA** | App-level zero-trust access | VPN replacement ([separate doc](./ztna.md)) |
| **SWG** (Secure Web Gateway) | Web traffic filtering / malware blocking | Proxy |
| **CASB** (Cloud Access Security Broker) | SaaS visibility/control/DLP | Shadow-IT control |
| **FWaaS** (Firewall as a Service) | Cloud firewall | Port/protocol |
| **SD-WAN** | Optimal path for sites/circuits | Network (WAN) axis |

> **SSE vs SASE:** bundling only the **four security functions (ZTNA+SWG+CASB+FWaaS) is SSE** (Security Service Edge); adding **SD-WAN (network) makes it SASE**. So Gartner's **SSE Magic Quadrant** is effectively the barometer of SASE's security capability.

### Why move to SASE

- **Dissolved perimeter** — remote/hybrid/multi-cloud breaks the "backhaul to HQ gateway" model.
- **Point-product fatigue** — buying VPN, proxy, firewall, and CASB **separately** means duplicated policy, scattered logs, operational overload.
- **Performance** — process close to the user at PoPs worldwide to cut latency.
- **Consistent policy** — "who/what/where" from **one console**.

## 2. How it works and the architecture

```text
[sites/remote users/devices]            [SASE cloud (PoPs worldwide)]            [destinations]
  HQ · branch · home · mobile             ┌─────────────────────────────┐          internet/SaaS
        │                                   │  ZTNA · SWG · CASB · FWaaS   │          internal apps (IaaS/DC)
        │ ── connect to nearest PoP ──────▶ │  (policies applied in one pass)│ ──────▶
        │   (SD-WAN/agent/tunnel)           │  identity/device/context eval │
        │ ◀──────────────────────────────── │  unified logs/visibility      │
                                            └─────────────────────────────┘
```

The key idea is **single-pass inspection** — as traffic passes a PoP once, ZTNA/SWG/CASB/firewall policies are applied **together**. It removes the chain-of-point-products with repeated inspections.

### Single-vendor SASE vs dual-vendor SASE

| Aspect | Single-vendor SASE | Dual-vendor SASE |
|---|---|---|
| Method | Security + network from one vendor | Security (SSE) + network (SD-WAN) from best-of-breed each |
| Strength | Unified policy/console/logs, simpler ops | Strongest combo per domain, reuse existing SD-WAN |
| Limit | A domain may be weak; lock-in | Complex integration / policy boundaries |
| Fits | New / simplification-oriented | Orgs with SD-WAN investment / strong network team |

## 3. Deployment readiness — what a company must know

SASE touches **both** security and networking, so the survey scope is wider than ZTNA. Order: **① assess, ② create/prepare, ③ decide.**

### 3-1. First, what to 'assess' (current-state survey)

| Target | What you must know concretely |
|---|---|
| **Current security stack** | What VPN/SWG/firewall/CASB/proxy you run today and **when each contract expires** (key to migration timing) |
| **Sites/circuits** | Number of sites, each site's **circuit type/bandwidth**, SD-WAN/router hardware |
| **Traffic pattern** | Internet vs internal app vs SaaS ratio, latency-sensitive traffic (video/VoIP) |
| **SaaS inventory** | Sanctioned/unsanctioned SaaS (shadow IT) to control via CASB |
| **Users/devices** | OS/count of managed/unmanaged devices, site/remote/mobile distribution |
| **Regulation/segmentation** | Public/finance network segmentation, N2SF, data-residency requirements |

### 3-2. What to 'create/prepare' in advance

- **IdP/MFA first** — same as ZTNA. The root of all access decisions.
- **Confirm PoP location** — whether the vendor has a **domestic (or nearby) PoP**. SASE sends traffic to the PoP, so a **far PoP adds latency** (a key check in Korea).
- **SD-WAN edge devices** — procurement/installation plan for per-site edges (physical/virtual).
- **Root CA for SSL inspection** — full inspection requires distributing an inspection certificate to devices (distribution method, exempt-domain list).
- **Connector/tunnel & service accounts** — connectors for internal apps and dedicated accounts (same concept as ZTNA).
- **Agent deployment pipeline** — push device agents via MDM/Intune/GPO; clientless for unmanaged.
- **Log/SIEM integration** — send single-console logs to the SOC.

### 3-3. Policies/strategy to 'decide'

- **Single-vendor vs dual-vendor** — choose by the trade-offs in section 2.
- **Order of adoption** — usually **ZTNA/SWG first → CASB/DLP → SD-WAN** in phases (not all at once).
- **Scope of full SSL inspection** — consider performance, privacy, app compatibility (exempt certificate-pinning apps).
- **Site cutover order / parallel period** — pilot site → rollout, coexistence period with existing circuits/hardware.
- **Network team ↔ security team governance** — SASE ownership overlaps both teams, so agree on **roles/responsibilities (RACI)** first.

> **In short:** half of a SASE rollout is drawing — in numbers — "what you run today (including contract expiries) and the shape of your sites/circuits/SaaS."

## 4. Cost structure

### Pricing model

Mostly a **per-user subscription (monthly/yearly)**, mixed with per-site and bandwidth (Mbps/Gbps) charges. Components are sold **per module (SKU)**, so pick what you need but check whether core features sit in higher bundles.

### Reference prices (per user/month, approx. · high variance)

| Vendor/category | Reference (monthly) | Note |
|---|---|---|
| Cloudflare One | **US$7–12** | lightweight, cloud-native |
| Zscaler | **US$8–15** | unit rate drops around 1,000 users |
| Palo Alto Prisma Access | **US$14–22** | |
| Netskope | **US$12–18** (full SASE **$40–75**) | CASB billed per app-seat — watch out |
| FortiSASE | **US$18–21** (real TCO ~$33) | branch hardware/bandwidth extra |
| Cato Networks | **US$20–50** | SD-WAN-inclusive |
| Mid-market full-platform baseline | **US$14–22** / real TCO **$33–60+** | |

*(Source: Jimber, SASE Pricing Models Explained, 2026-07 — approximate)*

### Hidden costs (often missed)

- **Branch hardware / SD-WAN edge** — per-site device and install cost.
- **Bandwidth overage** — charges when exceeding included bandwidth (e.g., FortiSASE default 1.5 Mbps/user; extra 25 Mbps block ~$1,100/yr).
- **Deployment/PS** — integrator ~**$1,200–1,800/day**, enterprise rollout **$150,000–225,000**, Year-1 overhead **+30–50%**.
- **Security add-ons** — DLP/advanced monitoring can double the base price.
- **Renewal uplift / premium support / compliance log retention** (NIS2-grade 180+ days ~$4,000–8,000/yr).

*(Sources: Jimber 2026-07, zerotrustcost.com 2026-09)*

## 5. Market landscape — global vs Korea

### Market size / share

- **SASE market:** ~**US$2.4B quarterly revenue in Q3 2024**. The **top six (Zscaler, Cisco, Palo Alto, Broadcom, Fortinet, Netskope) hold 72%** (+7pp YoY). **Zscaler is #1 overall at 21%**, and **34% in SSE**. In SD-WAN, **Cisco leads at 31%**. Growth: **SSE +14%, SD-WAN +1%** YoY. *(Dell'Oro Group, Q3 2024 report — reported by IT-Online 2025-01-03)*

### Global vendor landscape (Gartner SSE 2025)

- **Gartner SSE Magic Quadrant 2025 (2025-05-20) Leaders:** **Netskope · Palo Alto Networks · Zscaler** (Palo Alto a Leader for 3 straight years)
- **Challenger:** Fortinet / **Niche:** Versa, Broadcom, Cloudflare, iboss, Skyhigh
- As **single-vendor SASE** (with SD-WAN): **Cato Networks, Fortinet, Palo Alto, Cisco** are frequently cited.

### Korea landscape (how it differs)

- **Structural difference:** globally it consolidates into **single-vendor SASE platforms**, while **Korea starts from ZTNA and links SWG/CASB/DLP over time.** Phased component adoption is more realistic than a complete SASE.
- **PoP/latency:** for global SASE, the presence of a domestic PoP drives perceived performance → **always check** for Korean deployments.
- **Korean vendors:** AhnLab, Future Systems, MonitorApp, SoftCamp, Initech, etc. offer **ZTNA/SSE components** and are expanding toward SASE (full global-style single-vendor SASE is limited). *(Boannews 2026-10-27)*
- **Regulation/public sector:** no legal mandate in Korea; the **public sector effectively requires it via N2SF**, with KISA pilots priming the market. (Contrast with US EO 14028, EU NIS2/DORA, Japan mandates.)

## 6. Which environment fits SASE (decision guide)

| Situation | Recommendation |
|---|---|
| Many sites + remote + lots of SaaS, point products sprawling | **SASE (single-vendor)** — big consolidation/simplification gain |
| Already invested in SD-WAN, strong network team | **Dual-vendor SASE** — add SSE only |
| Only remote access is urgent now | **ZTNA first**, SASE as a roadmap |
| SaaS control/DLP is the priority | **SSE (especially CASB) first** |
| Public/finance/segmented networks | Local vendor + phased adoption, verify **domestic PoP / network-interconnect fit** |
| Small/simple org | Lightweight platform (e.g., Cloudflare) or standalone ZTNA |

## 7. Common misconceptions and pitfalls

- **"SASE = buy one product and done"** → SASE is an **architecture/framework**. A journey of aligning components in phases.
- **"Single-vendor is always right"** → Simpler, but a domain may be weak or you get **lock-in**. Weigh against dual-vendor.
- **"A security-team-only job"** → **SD-WAN (network) and security ownership overlap.** Without agreeing RACI first, operations clash.
- **"Korea can use global SASE as-is"** → **PoP/latency/network segmentation** are variables. Verify local fit separately.
- **"Compare unit price only"** → Branch hardware, bandwidth overage, deployment, renewal all into **TCO** (real TCO is often 2x+ the list price).
- **"Turn on full SSL inspection and you're safe"** → performance/privacy/certificate-pinning compatibility issues. **Design the scope.**

---

## Sources (as-of)

- Dell'Oro Group, *SASE/SD-WAN Quarterly Report* Q3 2024 (reported by IT-Online 2025-01-03) — market size, share
- Gartner, *Magic Quadrant for Security Service Edge* (2025-05-20) — SSE leaders/challengers/niche (per SDxCentral / Palo Alto Networks blog)
- Jimber, *SASE Pricing Models Explained* (2026-07) / zerotrustcost.com (checked 2026-09) — pricing, hidden costs
- Boannews, "2026 Zero Trust Security Solution Report" (2026-10-27) — Korea vendors, structural difference, regulatory comparison
- Concept origin: Gartner, *The Future of Network Security Is in the Cloud* (2019, coined "SASE")

> Market share and prices change frequently. Re-verify the sources above at the time of publication.
