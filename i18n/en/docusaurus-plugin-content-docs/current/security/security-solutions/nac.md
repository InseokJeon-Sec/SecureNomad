---
title: NAC Explained — Network Access Control
sidebar_label: NAC
sidebar_position: 5
description: NAC's five-step operation and implementation styles (802.1X, agentless, agent), deployment, cost/market (Genians leads Korea), and how it differs from ZTNA
tags: [security-solutions, NAC, 802.1X, zero-trust, network-security]
---

# NAC Explained — Network Access Control

> **Audience:** teams who evaluate/deploy solutions. Figures carry **source and as-of date**.

## 1. What NAC is — why it matters

The biggest risk is not knowing **what is attached** to your office ports and Wi-Fi. BYOD, IoT, visitor and unauthorized devices mix in, and one infected device becomes a foothold.

**NAC = the network's gatekeeper.** It detects and identifies every device, admits only those that pass authentication and posture checks, and quarantines non-compliant or unauthorized ones.

## 2. Five-step operation

```text
① detect/identify → ② authenticate → ③ posture check → ④ assign policy → ⑤ quarantine
 (profiling)        (802.1X/MAC/web)  (AV·patch·encryption) (role VLAN/ACL)  (block non-compliant)
```

The key is not just authentication but **posture** — devices without AV/patches are quarantined even if admitted.

## 3. Implementation styles

| Style | Traits | Note |
|---|---|---|
| **802.1X** | Switch/AP authenticates at the port; standard, strong | Needs 802.1X support on all gear |
| **Agentless** | Sensor/ARP detect & control, no install | Good for IoT/legacy (Korea mainstream); weak on device internals |
| **Agent** | Device internals (patch/device control/AV) | Fine posture, deployment burden |

→ In practice they're **mixed**: 802.1X for ports, agentless for IoT, agent for device control.

### NAC vs ZTNA

NAC governs **what attaches inside the LAN (L2)**; ZTNA governs **which app you reach remotely (L7)**. They're **complementary**, not competitors.

## 4. Deployment — assess · create · decide

**① Assess** — switch/AP **802.1X/RADIUS support** and legacy ratio; device inventory (count/OS); **devices that can't authenticate** (printers, IoT, OT); HR DB/AD/PKI; VLAN/segment/network separation.

**② Create** — RADIUS + PKI, role/policy design, **MAB list** (register MACs of non-auth devices — the operational core), agent deployment, guest/BYOD portal, SIEM integration.

**③ Decide** — **monitor → enforce** phased cutover (most outages come from skipping this), quarantine method (VLAN/ACL/remediation), guest/BYOD policy, exception handling.

> **Full 802.1X enforcement from day one cuts off printers/IoT.** Always start in monitor (audit) mode.

## 5. Cost

- Appliance + **per-device/user** license. Korean products bundle the agent at no extra cost (Genians).
- **Hidden cost = replacing switches that don't support 802.1X** (the biggest variable) + policy design and exception-list operations.

## 6. Market

- Global NAC **$5.43B (2025) → $48.8B (2035)**, CAGR 24.7% *(SNS Insider, 2026-07)*. Drivers: IoT, BYOD, zero trust, compliance.
- Global: Cisco ISE · Aruba ClearPass · Forescout · Fortinet FortiNAC · Portnox.
- Korea: **Genians (Genian NAC) #1** (self-reported) — strong on ISMS-P/network separation, agentless-centric.

## 7. Where it fits

| Situation | Recommendation |
|---|---|
| Hospitals/factories/campuses (lots of IoT/OT) | Strongly recommend NAC |
| ISMS-P/public/finance compliance | NAC effectively mandatory |
| Frequent visitors/BYOD | Guest portal + quarantine network |
| Remote/cloud app access | ZTNA (NAC isn't enough) |
| Many legacy switches | Phase in; plan hardware first |

## Common misconceptions

- **Enforce 802.1X immediately** → cuts off printers/IoT; start in monitor mode
- **NAC replaces ZTNA** → L2 vs L7, complementary
- **Agentless does everything** → device internals need an agent
- **Deploy without an asset inventory** → you can't write policy
- **Neglect the MAB exception list** → it becomes a backdoor; manage continuously

---

## Sources (as-of)

- SNS Insider, Network Access Control Market (2026-07) — size/CAGR
- Genians product/press — Korea landscape (self-reported share)

> Re-verify figures at publication time.
