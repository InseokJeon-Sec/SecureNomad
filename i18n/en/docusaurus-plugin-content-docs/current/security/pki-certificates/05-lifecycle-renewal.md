---
title: Certificate Lifecycle — Issuance, Renewal, Revocation
sidebar_label: 05. Lifecycle & Renewal
sidebar_position: 5
description: From issuance to renewal (shorter lifespans, ACME automation) and revocation (CRL/OCSP/OCSP stapling) and CT logs
tags: [PKI, certificate, renewal, revocation, ACME, OCSP]
---

# Certificate Lifecycle — Issuance, Renewal, Revocation

A certificate doesn't end at issuance; it has a lifecycle of **issue → use → renew → (if needed) revoke**.

## I. Issuance

```text
generate key pair (keep private key) → write CSR → submit to CA
→ CA verifies identity / domain ownership (DV/OV/EV) → signs/issues → install (full chain)
```

Domain Control Validation (DCV) typically confirms "you control this domain" via **HTTP (file upload) / DNS (TXT record) / email**.

## II. Validity period and renewal — the shrinking trend ⭐

Certificate lifetimes, once several years, keep getting shorter. The **CA/Browser Forum** approved a phased reduction in April 2025.

| Date | Max validity | Max DCV reuse |
|---|---|---|
| ~2026-03-14 | 398 days | — |
| **2026-03-15** | **200 days** | 200 days |
| 2027-03-15 | 100 days | 100 days |
| 2029-03-15 | **47 days** | 10 days |

:::info Where are we now?
As of 2026, we are already in the **200-day max** window. Lifetimes shrink to ① compensate for weaknesses in revocation (shorter means less damage from delayed revocation) ② accelerate algorithm/key rotation ③ reduce stale/abandoned certificates.
:::

**Conclusion: renewal automation is now essential.** You can't handle a 47-day cycle by hand.

### ACME and automatic renewal

**ACME** (Automated Certificate Management Environment) is a protocol that automates issuance/renewal. **Let's Encrypt** is the representative (free, 90-day validity, auto-renewal assumed).

```text
ACME client (certbot, etc.)
  → automatic domain-ownership proof (HTTP-01 / DNS-01)
  → automatic issuance/install/renewal (re-issue before expiry, periodically)
```

- Usually **auto-renews at the 1/3 point** (around day 60 of 90)
- The core of free HTTPS

## III. Revocation

Even with validity remaining, a certificate must be invalidated on **private-key leakage / misissuance / change of domain ownership**.

| Method | Description | Limitation |
|---|---|---|
| **CRL** (revocation list) | The CA publishes a list of revoked serials | The list grows; update delay |
| **OCSP** | Real-time query of one certificate's revocation status | Privacy / latency / CA load |
| **OCSP Stapling** | **The server** fetches the OCSP response in advance and attaches it to the handshake | The client needn't query the CA directly (recommended) |
| CRLite / aggregate | Browsers distribute compressed revocation info | Browser-specific implementation |

```text
OCSP Stapling flow:
server ─(periodically)→ queries OCSP at the CA → receives a signed "valid" response
client ← the server "staples" that response into the TLS handshake
→ the client confirms revocation without querying the CA directly (fast, better privacy)
```

:::caution The reality of revocation
OCSP/CRL aren't perfect due to latency/availability. So the industry moves toward **lowering reliance on revocation via short lifetimes** (the same context as the lifetime shrinking in II above). There's even a move to phase out OCSP.
:::

## IV. Certificate Transparency (CT)

To **monitor CA misissuance/fraudulent issuance**, issued certificates must be logged in public **CT logs**.

- Browsers (Chrome, etc.) trust only certificates with evidence (SCT) of CT-log inclusion
- Domain owners can monitor CT logs (crt.sh, etc.) to detect **unauthorized issuance for their domain**

## V. Renewal practice

| Item | Recommendation |
|---|---|
| Automation | ACME (certbot/acme.sh) or managed (cloud LB/CDN) |
| Monitoring | Expiry-approaching alerts (see 06), CT-log watching |
| Headroom | Renew **well before** expiry (at least the 1/3 point) |
| Key management | Decide a key-rotation policy on renewal (reuse vs new) |

## VI. Conclusion
A certificate has a lifecycle of **issue → renew → revoke**, and with the shortening trend (200→100→47 days), **automatic renewal (ACME)** has become essential. Revocation is complemented by CRL/OCSP/OCSP Stapling, and misissuance monitoring by CT logs.
