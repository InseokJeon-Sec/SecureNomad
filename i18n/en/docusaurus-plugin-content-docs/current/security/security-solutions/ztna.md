---
title: ZTNA Explained — Principles, Deployment, Cost, Market
sidebar_label: ZTNA (Zero Trust Access)
sidebar_position: 2
description: The working principles and architecture of ZTNA (Zero Trust Network Access), deployment readiness, cost structure, global/Korea market landscape, and selection criteria, from a practical adopter's standpoint
tags: [security-solutions, ZTNA, zero-trust, SASE, SDP, network-security]
---

# ZTNA Explained — Principles, Deployment, Cost, Market

> **Audience:** Practitioners who actually evaluate and deploy solutions. Principles are covered thoroughly, but the weight is on "what to prepare, what it costs, and what to choose."
> **On figures:** Market and price numbers move a lot, so each is tagged with its **source and as-of date**. These are reference ranges, not contract quotes.

## 1. What ZTNA is — and why it emerged

**ZTNA (Zero Trust Network Access)** inverts the old "let in, then trust" model. It **verifies the user, device, and context on every connection and opens access only to that one application** — not the network. Three core principles:

- **Never trust, always verify**
- **Least privilege** — only the needed app, not the whole network
- **Continuous evaluation** — drop the session mid-stream if context changes

### Why a VPN isn't enough

ZTNA grew out of the structural limits of the VPN.

| VPN problem | ZTNA answer |
|---|---|
| One connection exposes the **whole internal network** (excessive trust) | Connect per app; everything else is **invisible** |
| On account theft, **lateral movement** is free | App isolation blocks lateral movement |
| Ignores context (device state, location, time) | Context-based policy evaluated on each connection |
| Server IP/port exposed externally | **Dark cloud** — resources aren't on the internet before auth |
| Scaling limits for remote work/cloud | Scales on a cloud broker |

As remote work and multi-cloud became the norm, the "perimeter" itself dissolved. So ZTNA became the **first practical step** of a zero-trust architecture. (Reference standards: NIST SP 800-207, Google BeyondCorp.)

## 2. How it works and the architecture

### Basic flow

```text
[user/device]            [ZTNA broker (trust broker)]            [internal app]
     │                         │ (cloud/gateway)                   │
     │ ① auth request ───────▶ │                                  │
     │   (IdP: SAML/OIDC)      │ ② verify identity/device/context │
     │                         │   (MFA, device posture, geo, time)│
     │                         │ ③ policy eval → allow per app     │
     │ ◀──── encrypted tunnel ─┤ ◀──── outbound connection ────────┤
     │   (to that one app)     │        (connector dials out first)│
```

The key: the **connector dials out from inside to the broker (outbound first)**. So there's no need to open inbound firewall ports, and resources are invisible on the internet before authentication (the biggest difference from a VPN).

### Two implementation styles (Gartner classification)

| Aspect | Endpoint-initiated (agent) | Service-initiated (service) |
|---|---|---|
| Method | Agent installed on device | Connector in front of app; device uses a browser |
| Strength | Fine device posture checks, performance | Fits agentless environments (partners, BYOD) |
| Limit | Deployment burden on unmanaged devices | Web-app centric, weak device-trust judgment |
| Common use | Managed employee devices | Contractors, partners, personal devices |

→ In practice the two are often **mixed**: agents for managed devices, clientless (browser) for partners.

### Relationship to SDP

ZTNA is essentially the productized form of **SDP (Software-Defined Perimeter)**. "Dynamically build a perimeter only for the authenticated user" is SDP; implementing it as a commercial service is ZTNA. Korean vendors often label it "ZTNA/SDP."

## 3. Deployment readiness — what a company must know

ZTNA isn't "install and done" — **prior assessment and preparation decide success.** Before deploying, lock down three buckets: **① what to assess, ② what to create/prepare, ③ what to decide.** (Same nature as needing to fix server OS/count, integration accounts, and local-account handling before a PAM rollout.)

### 3-1. First, what to 'assess' (current-state survey)

A weak survey will always stall mid-deployment.

| Target | What you must know concretely |
|---|---|
| **Applications** | Per-app **FQDN/IP, port/protocol** (web HTTP(S) vs TCP/UDP app), internal **DNS dependency**, SSO (SAML/OIDC) support, any apps using hardcoded IPs |
| **Users/groups** | The IdP's **group/attribute scheme**, a "which group to which app" mapping, scope of external staff (partners/contractors) |
| **Devices** | **Count and OS of managed devices** (Windows/macOS/Linux/mobile), unmanaged/BYOD scale, asset-inventory accuracy |
| **Network** | Sites/data centers/cloud (VPC) **topology and segments**, outbound firewall policy, bandwidth |
| **Non-web/legacy** | **Thick-client/non-web apps** like SSH, RDP, DB, file servers, printers; server-to-server traffic; helper apps |

### 3-2. What to 'create/prepare' in advance

Things you must **have in place** before attaching ZTNA. (Equivalent to PAM's "create an integration account.")

- **IdP/MFA first** — a SAML/OIDC IdP (Okta, Entra ID, local IAM) with MFA must exist first. ZTNA's "verify" ultimately leans on the IdP.
- **IdP groups & conditional access** — a group scheme to hold app-group mappings, join/leave provisioning (SCIM).
- **Service account/permissions for the connector** — a dedicated, least-privilege account for the connector to reach internal apps. **(Same concept as PAM's integration account.)**
- **Connector placement & redundancy** — **how many** per data center / VPC / segment, redundancy and capacity sizing, the connector's **outbound 443 allowance**.
- **Agent deployment pipeline** — a way to push agents to managed devices (MDM/Intune/GPO); a **clientless (browser)** path for unmanaged devices.
- **Device-trust signal source** — EDR/MDM integration to feed device posture (patch, disk encryption, AV) into policy.
- **Log collection path** — integration to send access logs to SIEM/SOC (including retention).

### 3-3. Policies to 'decide'

- **Split tunneling** — which traffic goes through ZTNA and which stays local.
- **Unmanaged/BYOD handling** — block, restrict to clientless only, or isolate via RBI (remote browser).
- **Exception-app handling** — temporary path for legacy that ZTNA can't wrap (hardcoded IPs, special protocols).
- **Parallel run/rollback** — **coexistence period** with the VPN, pilot-app selection, rollback plan, user notice/training.

> **In short:** you must fix the four axes — "what (app), to whom (group), on which device, from where (connector)" — down to the numbers before deployment rolls. This survey/prep is more than half the schedule.

## 4. Cost structure

### Pricing model

ZTNA is almost always a **per-user subscription (monthly or yearly)**. A **minimum of 25–100 users** is common.

### Reference prices (list price, high variance)

| Item | Reference price | Source · as-of |
|---|---|---|
| Zscaler ZPA Platform | **US$120/user·yr** | Zscaler reseller filing, UK G-Cloud 15, 2026-01 |
| Zscaler ZPA standalone (entry) | **US$60/user·yr** | same |
| Zscaler ZPA Clientless | **US$86.4/user·yr** | same |
| ZTNA/ZPA monthly range | **~US$6–15/user·mo** | Jimber SASE pricing analysis, 2026-07 (approx.) |

> These are **list ceilings**; real deals apply volume/negotiated discounts. (E.g., Zscaler's unit rate drops sharply around the 1,000-user tier.)

### Hidden costs (often missed)

- **Deployment/professional services** — tunnel, policy migration, POP routing. Integrator effort ~**US$1,200–1,800/day**; Year-1 overhead **+30–50%** over the software quote.
- **Add-on modules** — DLP, browser isolation, advanced threat protection billed on top of the base seat.
- **Renewal uplift** — discounts are front-loaded, so **Year-3 uplift of 10–15%** is common → cap it in the original contract.
- **Operations staff** — ongoing effort for policy tuning and exceptions. (Sources: zerotrustcost.com 2026-09, Jimber 2026-07)

## 5. Market landscape — global vs Korea

### Market size

- **Global ZTNA market:** ~**US$1.97B in 2025** → ~**US$11.03B in 2033**, **CAGR 24.2%** (2026–2033). North America largest at 38.1% (2025); **Asia-Pacific fastest (26.2%)**. *(Grand View Research, base year 2025)*
- **Adoption:** **72% of global enterprises have adopted or are deploying** (up from 44% in 2022). *(Gartner survey, cited by Boannews 2026-10-27)*

### Global vendor landscape

ZTNA is usually sold as a **component of an SSE/SASE platform**, so SSE ratings are effectively a barometer of ZTNA capability.

- **Gartner SSE Magic Quadrant 2025 (2025-05-20) Leaders:** **Netskope · Palo Alto Networks · Zscaler** (Challenger: Fortinet / Niche: Versa, Broadcom, Cloudflare, iboss, Skyhigh)
- Dedicated ZTNA strength: **Zscaler (ZPA)**, plus lightweight cloud-native players like **Cloudflare, Twingate, Tailscale**.

### Korea landscape (how it differs)

Unlike the global single-vendor SASE consolidation, **Korea starts from ZTNA and gradually links SWG, CASB, and DLP.** Diffusion is public-sector led.

- **Major Korean vendors (2026):** AhnLab (XTG), Future Systems (ITUz), MonitorApp (AIONCLOUD), SoftCamp (SHIELD), Initech (INI-ZTA), Private AI (PacketGo), Genians, Hunesion, Quad Miners, etc. *(Boannews 2026-10-27)*
- **Adoption stage (survey of 1,810 security pros, 2026-10):** concept review/education **50.8%**, strategy/roadmap **31.1%**, PoC/pilot **11.5%**, full build/optimization 3.3% each → "**past proof-of-concept, into early diffusion.**"
- **Public priming (KISA zero-trust pilots):** ~KRW 4.5B in 2024 (4 consortia) → ~KRW 4.2B in 2025 (6) → ~KRW 3.5B in 2026 (5), a **declining budget trend**.
- **Regulatory difference:** the US (EO 14028), EU (NIS2, DORA), and Japan (mandatory guideline compliance for critical infrastructure) trend toward **mandates**, while **Korea has no legal mandate** — the public sector effectively requires it via N2SF, while private-sector motivation is weak and legislation has stalled for years.

## 6. Which environment fits ZTNA (decision guide)

| Situation | Recommendation |
|---|---|
| Remote/hybrid work, lots of SaaS/cloud | **ZTNA first** — top VPN-replacement candidate |
| Open only specific web apps to partners/contractors/BYOD | **Service-initiated (clientless) ZTNA** |
| Managed-device centric, need precise device control | **Agent-based ZTNA + EDR/MDM integration** |
| Already need SWG, CASB, firewall, etc. | Consider a **SASE/SSE platform** over standalone ZTNA |
| Public/finance, regulated/segmented networks | Local vendor + **phased migration**, check fit with network interconnection |
| Small / endpoint-centric org (Korean SMB) | Endpoint-integrated approach is realistic |

## 7. Common misconceptions and pitfalls

- **"ZTNA = just a VPN replacement"** → No. VPN is 'connectivity'; ZTNA is 'per-app access control + continuous verification.' The **blast radius** on an incident is fundamentally different.
- **"Install it and zero trust is done"** → ZTNA is **one part** of zero trust. Identity (IAM), device (EDR), data, and governance must go together.
- **"Deploy without an IdP"** → The root of verification is IdP/MFA. Without identity infrastructure it's half-baked.
- **"Pick on unit price alone"** → Look at **TCO** including deployment (PS), add-ons, renewal uplift, operations staff (Year-1 +30–50%).
- **"Remove the VPN all at once"** → Reality is phased coexistence. Start with a pilot app.

---

## Sources (as-of)

- Grand View Research, *Zero Trust Network Access Market Report* (base year 2025) — market size, CAGR, regional share
- Gartner, *Magic Quadrant for Security Service Edge* (2025-05-20) — SSE leaders/challengers/niche (per SDxCentral / Palo Alto Networks blog)
- Dell'Oro Group, *SASE/SD-WAN Quarterly Report* Q3 2024 (reported by IT-Online 2025-01-03) — SASE share
- Boannews, "2026 Zero Trust Security Solution Report" (2026-10-27) — Korea vendors, adoption survey, KISA budget, regulatory comparison
- zerotrustcost.com, *Zscaler Pricing* (checked 2026-09) / Jimber, *SASE Pricing Models Explained* (2026-07) — pricing, hidden costs
- Reference standards: NIST SP 800-207 (Zero Trust Architecture), Google BeyondCorp

> Market share and prices change frequently. Re-verify the sources above at the time of publication.
