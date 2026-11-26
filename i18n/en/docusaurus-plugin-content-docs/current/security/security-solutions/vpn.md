---
title: VPN Explained — Principles, Limits, Migration
sidebar_label: VPN
sidebar_position: 4
description: VPN working principles (IPsec/SSL), structural limits, attack statistics, vendor EoL wave, how to use it safely, migration to ZTNA/SASE, and cost/market — from a practical adopter's standpoint
tags: [security-solutions, VPN, ZTNA, SASE, remote-access, network-security]
---

# VPN Explained — Principles, Limits, Migration

> **Audience:** teams who evaluate/operate solutions. Figures carry **source and as-of date**.
> **Read first:** [ZTNA Explained](./ztna.md) — what replaces the VPN.

## 1. What a VPN is — two uses

A VPN tunnels an **encrypted path** over the public internet to act like a private network.

- **Remote-access VPN** — remote staff reach the internal network (client → gateway). *Today's focus.*
- **Site-to-site VPN** — connects networks (gateway ↔ gateway). *Still valid.*

The keywords are **tunnel** and **trust** — and that "trust" becomes the problem.

## 2. IPsec vs SSL VPN

| | IPsec (L3) | SSL/TLS VPN (L4+) |
|---|---|---|
| How | Network-layer tunnel | TLS (443), browser/client |
| Strength | Site links, dedicated clients | Easy anywhere → **remote-access mainstream** |
| Limit | Complex firewall/NAT traversal | **Internet-facing listener** = attack surface |

→ Remote access is dominated by SSL VPN, and that **internet-exposed listener** is the hot target.

## 3. Why people say it's "dead" — structural problems

The weakness is architecture, not a single bug.

- **① Exposed listener** — gateway on the internet; one flaw → **pre-auth compromise (RCE)**.
- **② Implicit trust** — one connection exposes the whole network; account theft → free **lateral movement**; without MFA, one password ends it.

> **Like-for-like appliance swaps repeat the same risk.** The problem is the architecture.

### Attack statistics

| Figure | Meaning | Source / as-of |
|---|---|---|
| **73%** | Entry point of verified ransomware intrusions was legacy VPN | Coalition Cyber Claims (2025) |
| **22%** | Edge/VPN devices among exploitation breaches (3%→8x YoY) | Verizon DBIR (2024 data) |
| **63%** | Breached accounts with no MFA (22% in 2022) | Sophos (2024 data) |
| **54%** | Only this share of vulnerable edge devices fully patched (median 32 days) | Verizon DBIR (2024 data) |

### Vendor end-of-life wave & exploited CVEs

- **Fortinet** FortiGate SSL VPN — removed in 7.6.3+ · CVE-2024-21762 (9.8)
- **Cisco** ASA 5500-X/AnyConnect — EoS 2026 · CVE-2025-20333 (9.8)
- **Palo Alto** GlobalProtect — app 6.0/6.1 EoL 2025 · CVE-2024-3400 (10.0)
- **Ivanti** Connect Secure — PSA EoL 2025 · CVE-2025-0282 (RCE)
- **Citrix** NetScaler Gateway — 13.1 EoL 2026 · CitrixBleed 2 (2025)

*(Sources: vendor EoL notices · CISA KEV, 2024–2026)*

## 4. Using it safely — do now

If you can't remove it at once, **reduce risk**:

- **Enforce MFA everywhere** — don't let one password end it
- **Patch & EoL audit** — identify end-of-life devices, prioritize replacement
- **Minimize exposure** — block admin interfaces externally, allow-list IPs
- **Segment** — minimize what a connection can reach
- **Logging & detection** — watch abnormal logins/bulk access
- **Session control** — idle timeout, conditional access

## 5. Migration path — VPN → ZTNA/SASE

1. **Reduce exposure** — block admin plane, MFA, patch
2. **ZTNA pilot** — core apps first, per-app access
3. **Parallel run** — coexist with VPN, migrate apps
4. **Only site-to-site remains** — remote access moves to ZTNA/SASE

> Gartner — **70%** of new remote-access deployments use ZTNA, not VPN (end-2025 outlook).

## 6. Cost & market

- **Cost:** appliance + per-user/bandwidth license. Cheap and mature, but ongoing ops (patch/config). The real cost is an **incident** — one ransomware case exceeds years of licensing.
- **Market:** overall VPN **$44.6B (2022) → $151.9B (2030)**, CAGR 17.7% *(Grand View Research)* — but growth is driven by **consumer subscriptions**, while **enterprise remote access moves to ZTNA/SASE**.

## 7. Where VPN still fits

| Situation | Recommendation |
|---|---|
| Site/DC interconnect | Site-to-site VPN (still fits) |
| OT/closed/legacy | Keep VPN (+ segmentation, MFA) |
| Remote staff/BYOD/SaaS | **Move to ZTNA** |
| Multi-site + security convergence | Consider SASE |
| Small/budget-limited | Keep VPN but MFA & patch are mandatory |

## Common misconceptions

- **Buy new hardware = safe** → same architecture, same risk
- **Encrypted = safe** → encryption only stops eavesdropping; auth/patch is the defense
- **MFA later** → 63% of breached accounts had none; do it now
- **EoL isn't urgent** → end-of-life devices are the top entry point
- **VPN fully replaced by ZTNA** → site-to-site remains; coexist by use

---

## Sources (as-of)

- Coalition Cyber Claims (2025) / Verizon DBIR 2025 (2024 data) / Sophos Active Adversary 2025 — attack stats
- Vendor EoL notices · CISA KEV (2024–2026) — EoL/CVE
- Grand View Research · Gartner — market/outlook

> Market, prices, and CVEs change frequently. Re-verify at publication time.
