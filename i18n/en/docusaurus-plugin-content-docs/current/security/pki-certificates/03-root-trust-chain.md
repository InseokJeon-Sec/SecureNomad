---
title: Root Certificates and the Chain of Trust
sidebar_label: 03. Root & Chain of Trust
sidebar_position: 3
description: Roles of root/intermediate/leaf certificates, chain verification, the trust store, and root renewal/rollover
tags: [PKI, root-CA, chain-of-trust, certificate]
---

# Root Certificates and the Chain of Trust

## I. The three-tier hierarchy

Certificates are usually issued in a **three-tier chain**.

```text
[Root CA certificate]       ← self-signed, the top "anchor" of trust
     │ signs
     ▼
[Intermediate CA certificate]  ← signed by the root, handles actual issuance
     │ signs
     ▼
[Leaf (end-entity) certificate] ← our server's certificate (example.com)
```

| Tier | Traits |
|---|---|
| **Root CA** | Self-signed. **Pre-installed** in OS/browsers. Private key kept offline, vault-grade |
| **Intermediate CA** | Signed by the root. Handles actual issuance. May be multiple levels |
| **Leaf** | The final server/domain certificate. Short validity |

## II. Why have an intermediate CA

Reasons not to issue leaves directly from the root:

- **Protect the root private key**: if the root key leaks, **every certificate** that CA issued collapses. So the root is kept offline and routine issuance is done by an intermediate CA
- **Damage isolation**: if an intermediate CA is compromised, only that intermediate is revoked (the root stays safe)
- **Operational flexibility**: intermediates can be split by purpose/region

## III. Chain verification

When a browser receives a server certificate, it verifies **back up from Leaf to Root**.

```text
1) The server sends [Leaf + Intermediate] (full chain)
2) Verify Leaf's signature with the Intermediate public key ✔
3) Verify Intermediate's signature with the Root public key ✔
4) Is the Root a "trusted Root in the trust store"? ✔
5) Check each cert's validity / revocation / usage (EKU) / domain (SAN) ✔
→ trust is established if all pass
```

This is called **path validation**, and its core is the recursive structure of **"verify each step's signature with the parent's public key."**

:::caution The most common operational error — missing intermediate CA
If the server sends only the Leaf and omits the Intermediate, the chain breaks and some clients show "untrusted." **Always deploy the full chain (Leaf + Intermediate).** ([06. Practice](./06-practice-openssl.md))
:::

## IV. The trust store — the root of trust

The **trust store** is the list of root certificates an OS/browser pre-ships as "roots we trust."

- Maintainers: Microsoft, Apple, Google (Chrome), Mozilla (Firefox), each run their own **root program**
- To be included, a root CA must pass strict audits (WebTrust, etc.)
- **The ultimate basis of trust**: no matter how plausible the chain, if the top root isn't in the trust store, it is **not trusted**

```text
"Trust" ultimately means → trusting the roots in your device's trust store
```

## V. Root certificate renewal/rollover

Roots are issued to last **very long** (usually 20–25 years). Still, replacement is needed for expiry, algorithm change, or a security incident.

Challenge: changing the root takes time **until trust stores worldwide carry the new root** (OS updates, etc.). So the following techniques are used.

| Technique | Description |
|---|---|
| **Pre-distribution** | Include the new root in OS/browsers years in advance |
| **Cross-signing** | Also sign the new root (or intermediate) **with the existing trusted root**, so old devices use the old chain and new devices the new chain |
| **Overlapping validity** | Run old and new roots in parallel for a period |

:::info Real example — chain transition
Let's Encrypt's root/intermediate transitions, or sudden certificate errors on older devices when a certain root expires, relate to cross-signing/rollover. Server operators simply **switch to the new chain the CA announces**.
:::

### Leaf renewal vs root renewal

| Aspect | Cycle | Who does it |
|---|---|---|
| **Leaf (server) certificate** | Short (tens to hundreds of days, shrinking) | Server operator (automation recommended) |
| **Intermediate** | Several years | CA |
| **Root** | Decades (rare) | CA + OS/browser vendors |

→ The "renewal" a server operator deals with day-to-day is mostly **leaf renewal**. ([05. Lifecycle & renewal](./05-lifecycle-renewal.md))

## VI. Conclusion
The chain of trust flows **Leaf → Intermediate → Root** by signatures, and ultimate trust rests on the **root in the device's trust store**. Because the root is the anchor of trust, it is strongly protected and long-lived, and transitions preserve compatibility via cross-signing.
