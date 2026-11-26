---
title: Active Directory (AD) Security Explained
sidebar_label: AD (Active Directory)
sidebar_position: 9
description: AD components and why it is the #1 ransomware target, major attack paths, defense (tiering, LAPS, MFA) and disaster recovery, and the move to Entra ID
tags: [security-solutions, AD, ActiveDirectory, EntraID, identity-security]
---

# Active Directory (AD) Security Explained

> **Audience:** teams who operate/defend AD. Figures carry **source and as-of date**.

## 1. What AD is — the identity backbone

AD is the backbone of identity, authentication, and policy in Windows networks, used by nearly every enterprise.

- **DC (Domain Controller)** — heart of identity/auth (owning a DC = owning everything)
- **Domain/Forest** — trust boundary
- **Kerberos/LDAP** — ticket auth / directory lookup
- **GPO** — pushes settings/policy to all endpoints
- **Domain Admin** — effectively full power; protect first

## 2. Why it's the #1 target

Owning AD lets ransomware encrypt all servers at once.

| Figure | Meaning | Source |
|---|---|---|
| **87%** | Ransomware targets identity systems (AD/Entra/Okta) | Semperis 2026 Ransomware Risk Report |
| **51%** | Attacks aimed directly at **AD** | same |
| **60%** | Only this share has documented AD recovery | same |

### Major attack paths (concept)

Kerberoasting (crack service-account tickets) · Pass-the-Hash (reuse hashes) · Golden/Silver Ticket (forge tickets) · DCSync (steal hashes via replication rights) · privilege escalation · lateral movement. **Common thread = credential theft** → privilege separation is the core defense.

## 3. Defense — tiering

| Tier | Scope | Rule |
|---|---|---|
| **Tier 0** | DC, domain admins, PKI | dedicated admin workstations only |
| **Tier 1** | servers, business systems | never use Tier 0 credentials |
| **Tier 2** | workstations, users | the largest attack surface |

> **Never use Tier 0 credentials on lower-tier devices** — this structurally breaks lateral movement.

### Hardening checklist

LAPS (auto, per-device local admin passwords) · MFA/PAM for privileged accounts · remove legacy (NTLM/SMBv1) · gMSA service accounts · minimize Domain Admins · detection (Defender for Identity, attack-surface review).

## 4. Disaster recovery

If a DC is encrypted, identity collapses entirely, and backups may restore a hidden backdoor. → **isolated (offline) backups + a dedicated AD recovery solution + documented, rehearsed procedures + post-restore cleanup verification.**

## 5. AD → Entra ID

On-prem AD (domain/GPO/Kerberos/closed networks) persists, while **Entra ID (formerly Azure AD)** is cloud identity (SaaS, conditional access), bridged via AD Connect into a **hybrid**. → Moving to the cloud doesn't remove AD; you must protect **both on-prem and cloud** (two attack surfaces).

## 6. Market

- AD security market **$1.37B (2025) → $3.85B (2033)**, CAGR 13.8% *(Marketintelo, 2026-03)*.
- Tools: Microsoft **Defender for Identity** · **Semperis** (recovery/detection) · Tenable(.ad) · attack-surface review (Purple Knight, BloodHound). Core axes = attack-surface review, threat detection, disaster recovery.

## 7. Recommendation

Every AD-using org should make **attack-surface review → tiering → recovery rehearsal** standard. Ransomware targets (finance/manufacturing/public) add dedicated recovery; hybrids protect both AD and Entra; orgs with many privileged accounts use PAM/gMSA and minimize Domain Admins.

## Common misconceptions

- **AD is just "infrastructure"** → without security design it's the top attack path
- **Too many Domain Admins** → more full-power accounts = more risk
- **Backups but no recovery drill** → reinfection/procedure gaps cause failure
- **Neglect legacy protocols** → NTLM/SMBv1 are the conduit
- **Entra = AD done** → hybrid means both

---

## Sources (as-of)

- Semperis 2026 Ransomware Risk Report (2026) — attack stats
- Marketintelo (2026-03) — AD security market
- Reference: NIST tiering model, Microsoft security guidance

> Re-verify figures at publication time.
