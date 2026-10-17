---
title: Practice — OpenSSL and Certificate Operations
sidebar_label: 06. Practice (OpenSSL)
sidebar_position: 6
description: Generating keys/CSRs, inspecting/debugging certificates, format conversion, full-chain deployment, expiry monitoring, and private-CA operation with OpenSSL
tags: [PKI, OpenSSL, practice, certificate]
---

# Practice — OpenSSL and Certificate Operations

Connecting the theory to actual commands/operations. (The commands below are standard tasks for managing certificates for **your own servers/domains**.)

## I. Generating keys and CSRs

```bash
# 1) Generate a private key (ECC recommended: P-256)
openssl ecparam -genkey -name prime256v1 -out server.key
#   (for RSA) openssl genrsa -out server.key 2048

# 2) Create a CSR (public key + identity). Including SAN is important
openssl req -new -key server.key -out server.csr \
  -subj "/C=KR/O=SecureNomad/CN=example.com" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com"
```

- The private key `server.key` **never leaves the server**
- Submit the CSR to a CA (or ACME) → receive the certificate

## II. Inspecting / debugging a certificate

```bash
# View certificate details (Subject/Issuer/SAN/validity/extensions)
openssl x509 -in server.crt -noout -text

# Validity only
openssl x509 -in server.crt -noout -dates

# SAN only
openssl x509 -in server.crt -noout -ext subjectAltName

# Check the key and certificate match (compare public-key hashes)
openssl pkey -in server.key -pubout -outform der | openssl sha256
openssl x509 -in server.crt -pubkey -noout -outform der | openssl sha256
#   if the two hashes match, they are a pair
```

### Inspect the chain actually served (remote)

```bash
# Handshake / presented chain / expiry
openssl s_client -connect example.com:443 -servername example.com -showcerts

# Expiry only, quickly
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -dates
```

:::tip The most common incident — missing intermediate CA
If the `s_client` output **doesn't show the Intermediate**, the chain is incomplete. Some clients (mobile/older) error only sometimes, making it hard to reproduce. **Deploy the full chain (fullchain).** ([03. Chain of trust](./03-root-trust-chain.md))
:::

## III. Format conversion

```bash
# PEM → PKCS#12 (.pfx)  (certificate+key+chain bundle, for Windows/IIS, etc.)
openssl pkcs12 -export -out bundle.pfx \
  -inkey server.key -in server.crt -certfile chain.crt

# PKCS#12 (.pfx) → PEM
openssl pkcs12 -in bundle.pfx -nodes -out all.pem

# DER ↔ PEM
openssl x509 -in cert.der -inform der -out cert.pem -outform pem
```

## IV. Full-chain deployment

```text
fullchain.pem =  [ Leaf certificate ]
                 [ Intermediate certificate ]   ← must be included
                 (Root usually omitted — already in the client's trust store)
```

- Nginx: `ssl_certificate fullchain.pem; ssl_certificate_key server.key;`
- Order matters: Leaf first, then Intermediate

## V. Expiry monitoring (automation)

Because of shorter lifetimes, **expiry monitoring is essential**.

```bash
# Check days remaining until expiry (wire into cron/monitoring)
exp=$(echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -enddate | cut -d= -f2)
echo "Expires: $exp"
# -checkend: exit code 1 if expiring within 30 days
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -checkend 2592000 && echo "30+ days left" || echo "⚠ expires within 30 days"
```

- In practice: use Prometheus blackbox exporter, uptime monitors, or a cloud certificate manager's expiry alerts
- Where possible, remove manual work entirely with **ACME auto-renewal** ([05. Lifecycle](./05-lifecycle-renewal.md))

## VI. Private CA — concept

For internal services / mTLS, organizations sometimes run a **private CA**.

```bash
# (concept) create an internal Root CA
openssl req -x509 -newkey rsa:4096 -days 3650 -nodes \
  -keyout rootCA.key -out rootCA.crt -subj "/O=SecureNomad Internal/CN=SecureNomad Root CA"
```

- The internal root must be **distributed to employee devices' trust stores** (group policy/MDM) to be trusted
- Uses: internal HTTPS, service-to-service mTLS ([04](./04-auth-logic-tls.md)), test environments
- For operations, dedicated tools are recommended (step-ca, HashiCorp Vault PKI, EJBCA, etc.)

## VII. Security checklist

- [ ] Minimize private-key permissions (`chmod 600`), never leak off the server
- [ ] Appropriate key length/algorithm (ECC P-256 / RSA 2048+)
- [ ] Deploy the full chain (include intermediate CA)
- [ ] Allow only TLS 1.2+, disable weak cipher suites
- [ ] Enable OCSP Stapling
- [ ] Expiry monitoring / auto-renewal
- [ ] Watch CT logs for unauthorized issuance of your domains

## VIII. Conclusion
The core of practice is **key protection · full-chain deployment · auto-renewal · expiry monitoring**. Use OpenSSL for generation/verification/conversion, but automate operations with ACME/managed services — the right answer in an era of shorter certificate lifetimes.
