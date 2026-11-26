---
title: SAC (Server Access Control / PAM) Explained
sidebar_label: SAC (Server Access / PAM)
sidebar_position: 7
description: Principles of server access control and privileged access management (gateway, vault, session recording), deployment (full inventory of server OS/count/accounts), cost and market
tags: [security-solutions, SAC, PAM, privileged-access, access-control]
---

# SAC (Server Access Control / PAM) Explained

> **Audience:** teams who evaluate/deploy solutions. Figures carry **source and as-of date**.

## 1. What SAC is — why it matters

Connecting to servers with **shared root/administrator** leaves no trace of who did what, spreads passwords around, and lets insiders, contractors, or stolen accounts hold full power.

**SAC (= PAM, privileged access management)** funnels all privileged access through a **gateway** to authenticate, approve, record, and control it. Regulations (privacy law, electronic finance, ISMS) effectively mandate access control and audit.

## 2. Three PAM pillars

- **Access control** — force gateway transit, personal identity + MFA, block direct access
- **Account management (vault)** — store/rotate server passwords in a vault; **the admin never knows the password**
- **Session/command control** — full recording/replay, block or approve risky commands

## 3. How it works — proxied login

```text
admin (personal account + MFA) → gateway (approve/policy) → vault (logs in with server password) → server (full session recording)
```

The key: **the admin doesn't know the server password** — the vault logs in on their behalf, so password leakage/sharing is eliminated.

## 4. Deployment — assess · create · decide

**① Assess (full account inventory)** — target server **OS and count** (Windows/Linux/Unix, cloud instances); list of **shared/privileged accounts** (root/administrator); policy for hidden **local/service accounts** on each server; access paths (SSH/RDP/telnet/DB); contractor access.

**② Create** — gateway + redundancy, per-server **least-privilege integration accounts**, vault enrollment, personal admin accounts, agent/proxy model, SIEM integration.

**③ Decide** — session-recording scope, risky-command blocking, approval workflow, break-glass/exception access.

> The **full inventory — eliminating shared root and counting even local accounts** — decides success. (Same nature as fixing server OS/count, integration accounts, and local-account handling before a PAM rollout.)

## 5. Cost & market

- **Cost:** based on server (asset) or admin count. Korea's system-access-control market is **~KRW 50B**; public sector requires **CC certification**. Hidden cost = per-server integration/vault work and session-recording storage.
- **Market:** global PAM Gartner MQ Leaders **CyberArk · BeyondTrust · Delinea** (2026). Korea: NetAnd (HIWARE, self-claimed procurement #1), SGA Solutions, Hansol, PnPSecure (DBSAFER AM). Trend = convergence of access control + account management (IAM), HR-linked auto-lockout of leavers, dynamic cloud reflection.

## 6. Where it fits

| Situation | Recommendation |
|---|---|
| Many servers/admins | SAC essential |
| Heavy contractor/maintenance access | Gateway + session recording |
| Finance/public/privacy regulation | CC-certified local + audit |
| Cloud servers/DevOps | Cloud PAM / secrets management |
| Many SSH keys/automation accounts | Key management / secrets vault |

## Common misconceptions

- **Keep shared root** → can't attribute identity, half-baked
- **Only record sessions** → no control = after-the-fact
- **Miss local/service accounts** → hidden accounts become backdoors
- **Over-privileged integration account** → gateway account breach = full power; least privilege
- **Deployment = compliance done** → policy, log review, and response operations must accompany it

---

## Sources (as-of)

- Gartner Magic Quadrant for PAM (2026) — global leaders
- DailySecu · ZDNet Korea (2025) — Korea market size/vendors (incl. company claims)

> Re-verify figures at publication time.
