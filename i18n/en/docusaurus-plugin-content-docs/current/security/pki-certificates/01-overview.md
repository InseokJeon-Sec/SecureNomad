---
title: Certificate Overview and Cryptography Basics
sidebar_label: 01. Overview & Crypto Basics
sidebar_position: 1
description: The problem certificates solve and the underlying symmetric/asymmetric cryptography, hashing, and digital signatures
tags: [PKI, certificate, cryptography, digital-signature]
---

# Certificate Overview and Cryptography Basics

## I. The problem certificates solve

To communicate encrypted with a party on the internet, you need their **public key**. But there's a fundamental problem:

> "Is this public key I just received **really that server's (the bank's)**, or did a man-in-the-middle (MITM) swap it?"

A **certificate** answers this. In essence a certificate is:

```text
Certificate = public key + identity (domain/organization) + a trusted authority's (CA) digital signature
```

That is, a document in which a trustworthy third party (CA) **vouches, via a signature**, that "this public key belongs to this identity." To understand the basis, you need the three cryptographic elements.

## II. Symmetric vs asymmetric cryptography

| Aspect | Symmetric | Asymmetric (public-key) |
|---|---|---|
| Keys | One (shared secret) | A pair (public + private) |
| Speed | Fast | Slow |
| Key distribution | Hard (must share first) | Public key can be shared openly |
| Examples | AES, ChaCha20 | RSA, ECC (elliptic curve) |

**Key properties (asymmetric)**:
- Encrypt with public key → decrypt **only with the private key** (confidentiality)
- Sign with private key → verify **with the public key** (authentication/integrity)

:::info In practice both are used together (hybrid)
Asymmetric crypto is slow, so it doesn't encrypt all the data. Instead, it **securely exchanges a "symmetric session key" using asymmetric crypto**, and encrypts the actual data with a fast **symmetric key (AES)**. TLS works exactly this way. ([04. Authentication logic](./04-auth-logic-tls.md))
:::

## III. Hashing

A one-way function that turns arbitrary-length data into a **fixed-length fingerprint**.

```text
SHA-256("hello")  →  2cf24dba5fb0a30e...  (always 256 bits)
```

Properties:
- **One-way**: can't recover the original from the hash
- **Collision resistance**: very hard for different inputs to share a hash
- **Avalanche effect**: flip one bit and the hash changes completely

→ A core ingredient of integrity verification and digital signatures. (MD5/SHA-1 are deprecated due to collisions; use **SHA-256 or stronger** today.)

## IV. Digital signatures — the heart of certificates

A digital signature proves **"I (the private-key holder) created this data, and it hasn't been tampered with."**

```text
[Signing] signer
  1) Hash the data:        h = Hash(data)
  2) Sign the hash with the private key: sig = Sign(privateKey, h)
  → send (data + sig)

[Verifying] verifier
  1) Hash the received data: h' = Hash(data)
  2) Recover the hash with the public key: h = Verify(publicKey, sig)
  3) If h == h' → authentic (made by the signer, untampered)
```

Why it holds:
- **Only the signer has the private key**, so if it verifies with the public key, the signer made it (authentication/non-repudiation)
- Since hashes are compared, **a single bit change** fails verification (integrity)

:::tip A certificate = "data signed by a CA"
A certificate is exactly the content (public key + identity) **digitally signed by a CA with its private key**. So we verify the certificate's signature with the **CA's public key** to confirm "this certificate was really issued by the CA." ([03. Chain of trust](./03-root-trust-chain.md))
:::

## V. The three guarantees

What certificate-based communication (TLS) provides:

| Guarantee | Means |
|---|---|
| **Confidentiality** | Encrypt data with a symmetric key (AES); the key is exchanged with asymmetric crypto |
| **Integrity** | Detect tampering with hash + MAC/AEAD |
| **Authentication** | Verify the peer's identity with a certificate + digital signature |

## VI. Conclusion
A certificate is a device that **binds a public key to an identity and has a CA vouch for it with a signature**, and its operation rests on **asymmetric crypto + hashing + digital signatures**. The next document looks at the actual structure (X.509) of a certificate.
