---
title: Authentication Logic — the TLS Handshake
sidebar_label: 04. Auth Logic (TLS)
sidebar_position: 4
description: How certificates are actually verified in the TLS handshake, server authentication and key exchange, and mTLS
tags: [PKI, TLS, authentication, handshake]
---

# Authentication Logic — the TLS Handshake

The main stage for "how a certificate is used" is the **TLS handshake**. Here's what happens before encryption on an HTTPS connection.

## I. Two things the handshake does

```text
① Authentication : confirm with a certificate that the server truly owns the domain
② Key Exchange   : securely agree on the symmetric session key for subsequent traffic
```

## II. TLS 1.3 handshake (summary)

```text
Client                                   Server
  │  ClientHello (supported cipher suites, ECDHE key-share public value)
  │ ─────────────────────────────────────▶
  │                 ServerHello (chosen suite, server key-share)
  │                 {Certificate}            ← server certificate (+ intermediate CA)
  │                 {CertificateVerify}      ← signed with the server private key
  │                 {Finished}
  │ ◀─────────────────────────────────────
  │  (verify certificate + derive keys)
  │  {Finished}
  │ ─────────────────────────────────────▶
  │  ===== application data is then encrypted with the symmetric key =====
```

TLS 1.3 finishes in **1-RTT**, and much of the handshake is encrypted (`{}`). TLS 1.2 had more round trips and an RSA key-exchange option, but 1.3 is simplified/strengthened around **ECDHE (forward secrecy)**.

## III. The client's certificate verification (core logic)

The received certificate must pass **all** of the following to be trusted.

```text
1) Chain construction / signature verification
   Leaf signature ← verify with Intermediate public key
   Intermediate signature ← verify with Root public key
2) Trust-anchor check
   Is the top Root in the trust store?
3) Validity period
   Is now within Not Before ~ Not After?
4) Domain match
   Is the connected hostname in the certificate's SAN?
5) Usage
   Does the EKU include serverAuth?
6) Revocation check
   Not revoked per CRL/OCSP?  ([see 05](./05-lifecycle-renewal.md))
```

If any fails, the browser shows a warning (NET::ERR_CERT_…).

## IV. Proving the server actually holds the private key

A certificate only carries a public key. The server must prove it **actually holds the private key** corresponding to that public key, to prevent impersonation.

- TLS 1.3: the server **signs the handshake transcript with its private key** (`CertificateVerify`). The client verifies this signature with the certificate's public key → **proof of private-key possession**.
- Simultaneously, **ECDHE** key exchange agrees the session key. ECDHE uses a fresh ephemeral key per session → **forward secrecy (PFS)**: even if the private key leaks later, past traffic can't be decrypted.

```text
certificate (public key) + CertificateVerify (private-key signature)
  → "the owner of this public key is genuine, and holds that private key right now"
```

## V. The signature/verification view

Server authentication (concept):

```text
Server:  sig = Sign(serverPrivateKey, handshake_hash)
Client:  Verify(cert_publicKey, sig, handshake_hash) == true ?
         AND the certificate itself verifies via the CA chain
```

→ Both conditions must hold to accept it as "the genuine server." (Review [01. Digital signatures](./01-overview.md))

## VI. Mutual authentication (mTLS)

Normally TLS authenticates **only the server** (the client logs in with a password, etc.). **mTLS** has **the client present a certificate too**, so both sides authenticate each other.

| Aspect | Server auth (normal) | mTLS |
|---|---|---|
| Server→Client | Server presents certificate | Same |
| Client→Server | None | **Client presents certificate** |
| Use | General web | Internal service-to-service, zero trust, API security |

- Widely used for service-to-service authentication in service meshes (Istio, etc.) and zero trust → [Zero Trust](/en/topics/security/zero-trust)

## VII. Conclusion
In the TLS handshake, the certificate authenticates "the genuine peer" via the logic of **① chain/validity/domain verification → ② proof of private-key possession (CertificateVerify) → ③ ECDHE session-key agreement**. mTLS extends this to both directions.
