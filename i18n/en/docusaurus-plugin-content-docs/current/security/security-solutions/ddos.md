---
title: DDoS Protection Explained — Absorb, Don't Block
sidebar_label: DDoS Protection
sidebar_position: 6
description: The three DDoS attack types and defense principles (Anycast, scrubbing), attack trends, deployment (failover/runbook), and cost/market
tags: [security-solutions, DDoS, CDN, network-security]
---

# DDoS Protection Explained — Absorb, Don't Block

> **Audience:** teams who evaluate/deploy solutions. Figures carry **source and as-of date**.

## 1. What DDoS is — why "absorb"

A DDoS (Distributed Denial of Service) paralyzes a service with massive traffic. The key is to **absorb rather than block** — you need capacity to take it.

## 2. Three attack types

| Type | Method | How to stop |
|---|---|---|
| **Volumetric (L3/4)** | UDP/ICMP flood, **amplification** (DNS/NTP/memcached) — bandwidth exhaustion, ~78% of all | Absorb (capacity/distribution) |
| **Protocol** | SYN flood etc. — exhausts firewall/LB session tables | Filter |
| **Application (L7)** | HTTP flood, sophisticated bots — looks normal, hard to detect | Behavioral analysis |

## 3. Defense principle

```text
attack+normal (Tbps) → Anycast distribution (global edge) → scrubbing (remove malicious/absorb) → only clean to origin
```

The key is **capacity + distribution** — the huge backbones of AWS/Cloudflare share and absorb the attack.

## 4. Attack trends (2025)

| Figure | Meaning | Source |
|---|---|---|
| **31.4 Tbps** | Largest 2025 attack (35s · 14.1B pps) | Cloudflare Q4 2025 |
| **47.1M** | Attacks mitigated in 2025, **+121% YoY** | Cloudflare 2025 |
| **78%** | Share that is L3/4 (volumetric) | Cloudflare Q4 2025 |
| **1–4M** | Aisuru botnet infections (IoT/Android TV) | Cloudflare |

## 5. Deployment — assess · create · decide

**① Assess** — protection target (web/API/network/**DNS**), public IPs/ranges/link capacity, **baseline of normal traffic** (basis for thresholds), latency sensitivity.

**② Create** — **failover method (BGP/DNS)**, always-on vs on-demand, **on-prem (instant) + cloud (volume) hybrid**, L7 bot defense (CAPTCHA/JS challenge), response runbook & contacts.

**③ Decide** — always-on vs on-demand, detection thresholds (false-positive vs miss), drill cadence.

> **Test the rerouting to scrubbing in peacetime** so you don't scramble during an attack.

## 6. Cost & market

- **Cost:** bandwidth/request-based or subscription. AWS Shield Standard is **free** by default; Advanced adds a response team and cost protection. Watch for **traffic-spike charges** on pay-as-you-go during attacks.
- **Market:** global DDoS protection **$5.16B (2025) → $20.3B (2033)**, CAGR 18.7% *(Grand View Research)*. Vendors: Cloudflare · Akamai · AWS Shield · Imperva · Radware · NETSCOUT · F5 · A10.

## 7. Where it fits

| Situation | Recommendation |
|---|---|
| E-commerce/gaming/media | always-on protection |
| Finance/public (easy targets) | Shield Advanced-class + cost protection |
| AWS/cloud-centric | Shield + WAF + CloudFront |
| On-prem/network protection | Dedicated appliance + cloud hybrid |
| Budget-limited/small | CDN base protection + WAF |

## Common misconceptions

- **Firewall/LB will stop it** → volume topples them first; absorption capacity needed
- **Sign up when attacked** → cutover/config take time; peacetime prep is key
- **Stop volumetric and you're done** → L7/bots need separate defense
- **Pay-as-you-go is always cheaper** → spike cost bomb during attacks
- **DNS isn't a target** → DNS down = total outage

---

## Sources (as-of)

- Cloudflare Q4 2025 DDoS Threat Report · NETSCOUT (2025) — attack trends
- Grand View Research — market size/CAGR

> Re-verify figures at publication time.
