---
title: Zero Trust
sidebar_label: Zero Trust
sidebar_position: 1
tags: [security, important]
description: Concept, core principles, components (ZTA) of the zero-trust security model, and comparison with perimeter-based security
---

# Zero Trust

## I. Overview
- **Definition**: A security model based on the principle **"Never Trust, Always Verify"** — it **authenticates and authorizes every access request**, regardless of network location (inside/outside).
- **Background / motivation**: With the spread of cloud and remote work, the **perimeter-based model** ("inside = safe") broke down. As post-breach lateral movement attacks grew, zero trust emerged. Codified by US NIST SP 800-207.

## II. Core principles
| Principle | Content |
|---|---|
| Verify explicitly | Verify every request with all signals (user, device, location, behavior) |
| Least privilege | Only the necessary rights, only for the necessary time (JIT/JEA) |
| Assume breach | Assume you are already breached → minimize and segment damage |

## III. Components (ZTA)
```text
Request → [PEP: Policy Enforcement Point] → [PDP: Policy Decision Point]
         ↑ signals: user ID · device posture · location · risk
         ↓ allow / deny / step-up (MFA)
[Micro-segmentation] splits the inside into small zones
```

| Element | Role |
|---|---|
| PEP (Policy Enforcement Point) | Actually allows/denies access |
| PDP (Policy Decision Point) | Decides according to policy |
| IAM · MFA | Strengthens identity verification |
| Micro-segmentation | Blocks lateral movement |
| Continuous monitoring | Behavior-based anomaly detection |

## IV. Characteristics · pros/cons
| Aspect | Content |
|---|---|
| Pros | Defends internal threats/lateral movement, fits remote/cloud, shrinks blast radius |
| Cons | Complex/costly adoption, burden of migrating existing infra, UX degradation if over-verified |
| Considerations | Phased adoption (start with key assets), identity system first |

## V. Comparison — Perimeter-based vs Zero Trust
| Aspect | Perimeter-based | Zero Trust |
|---|---|---|
| Trust | Trusts the inside | Trusts no one |
| Verification | On first entry | On every request |
| Defense | External intrusion | Internal spread too |
| Assumption | Perimeter is safe | Already breached |

## VI. Practice · real-world view
- **Identity is the new perimeter**: IAM, MFA, SSO are the starting point. Then extend to device trust (EDR), micro-segmentation, SASE/ZTNA.
- Combines naturally with mTLS between services and a service mesh in MSA/cloud environments. Related: [MSA](../software-engineering/msa.md)

## VII. Conclusion
- Zero trust is not a product but a **strategy/architecture**. It is not completed at once but matured in phases.
- The key is "continuous verification based on identity and context, not location."
