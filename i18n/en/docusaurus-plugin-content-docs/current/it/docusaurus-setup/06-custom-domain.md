---
title: 06. Connecting a Custom Domain
sidebar_label: 06. Custom Domain
sidebar_position: 6
description: Connecting a domain purchased from Gabia to GitHub Pages (wiki.securenomad.kr)
---

# 06. Connecting a Custom Domain

## 1. Overview

Purchased `securenomad.kr` from Gabia (a Korean domain registrar) and connected the subdomain **`wiki.securenomad.kr`** to the GitHub Pages site.

```text
Visitor ─▶ wiki.securenomad.kr
              │  (Gabia DNS: CNAME)
              ▼
          inseokjeon-sec.github.io   (GitHub Pages)
              │
              ▼
          Deployed output (build) of the SecureNomad repository
```

| Item | Before | After |
|---|---|---|
| Site URL | `https://inseokjeon-sec.github.io/SecureNomad/` | `https://wiki.securenomad.kr` |
| `baseUrl` | `/SecureNomad/` | `/` |
| HTTPS | GitHub default certificate | Certificate issued automatically by GitHub (Let's Encrypt) |

## 2. Choosing the connection method

### DNS instead of forwarding

| Method | Behavior | Result |
|---|---|---|
| URL redirect (forwarding) | Redirects my domain to the github.io URL | The address bar changes to github.io |
| URL masking (frame) | Shows the site inside an iframe on my domain | HTTPS issues, poor search visibility, fixed URL while navigating |
| **DNS (CNAME)** | My domain points directly to GitHub Pages servers | **Site served on my domain, free HTTPS** |

→ Chose **DNS**, the method officially supported by GitHub Pages.

### Subdomain

| Type | Example | Records needed |
|---|---|---|
| **Subdomain** (chosen) | `wiki.securenomad.kr` | 1 CNAME |
| Apex domain | `securenomad.kr` | 4 A records (+ www CNAME) |

- Simpler to configure
- The apex domain stays available for other uses such as a main homepage

## 3. Buying the domain (Gabia)

| Item | Setting | Reason |
|---|---|---|
| WHOIS privacy | On | Hides name, address, and contact details |
| Auto-renewal | On | Expiration would take the site down and let others register the domain |
| Hosting, forwarding, email add-ons | Not used | GitHub Pages provides hosting and HTTPS for free |
| Name servers | Keep Gabia defaults (`ns.gabia.co.kr`) | Only a few records are needed, so no separate DNS is required |

:::tip Check the renewal price
Check the **renewal price from year 2 onward**, not just the first-year discount.
:::

## 4. Verifying domain ownership on GitHub (TXT)

### Why it matters

:::danger Subdomain Takeover
If the CNAME record remains in DNS after GitHub Pages is disconnected, **someone else can register the same domain on their own GitHub Pages repository** and serve arbitrary content on my subdomain.
Verifying the domain on my GitHub account ensures that **only repositories in my account** can use it.
:::

### Steps

1. Top-right **profile picture → Settings** (account settings) on GitHub
2. Left menu **Pages → Add a domain**
3. Enter the apex domain `securenomad.kr` (verify the apex domain even when using a subdomain)
4. Add the TXT record that GitHub provides to Gabia DNS

| Type | Host | Value |
|---|---|---|
| TXT | `_github-pages-challenge-<username>` | Verification value issued by GitHub |

5. Click **Verify** on GitHub → confirm **Verified**

:::caution
The verification value is issued per account, so it is not published in documents or screenshots.
:::

## 5. Adding a CNAME record in Gabia DNS

### Menu location

**My Gabia → Domains → manage `securenomad.kr` → DNS management tool**

The DNS management screen:

| Section | Used |
|---|---|
| **DNS settings → [Edit records]** | **Yes** (add TXT and CNAME) |
| Domain connection | No (for Gabia hosting) |
| Forwarding | No (redirect / masking) |
| Web parking / Mobile parking | No |

### Add the record

1. Click **[Edit records]** next to **DNS settings**
2. Click **[Add record]** → fill in a new row
3. Click the row's **[OK]** → **[Save]** at the bottom

| Type | Host | Value | TTL |
|---|---|---|---|
| TXT | `_github-pages-challenge-<username>` | (verification value) | 600 |
| **CNAME** | `wiki` | `inseokjeon-sec.github.io.` | 600 |

- Enter only `wiki` as the host (Gabia appends `.securenomad.kr` automatically)
- Do not add a path such as `/SecureNomad` to the value
- The trailing dot (`.`) marks the end of the domain. Remove it and retry if you get a format error
- Keep the existing TXT record

## 6. Checking DNS propagation

```bash
nslookup wiki.securenomad.kr
```

Example of a correct result:

```text
Name:    inseokjeon-sec.github.io
Addresses:  185.199.108.153
            185.199.109.153
            185.199.110.153
            185.199.111.153
Aliases:  wiki.securenomad.kr
```

- If `Aliases` shows my domain and `Name` shows the `github.io` address, the CNAME is active
- Propagation can take from a few minutes to a few hours

## 7. Updating project files

### static/CNAME (new)

A file without an extension containing a single line with the domain.

```text title="static/CNAME"
wiki.securenomad.kr
```

Files in `static/` are copied to the root of `build/` → deployed as `build/CNAME` so GitHub Pages recognizes the domain.

### docusaurus.config.js

```js title="docusaurus.config.js"
  url: 'https://wiki.securenomad.kr',
  baseUrl: '/',
```

| Field | Reason for change |
|---|---|
| `url` | Canonical site URL (used for the sitemap, share links, etc.) |
| `baseUrl` | Served from the domain root, so `/SecureNomad/` → `/` |

:::warning If `baseUrl` is not changed
CSS and JS files are requested from `/SecureNomad/...`, and the page renders broken.
:::

### Apply

Check for errors with `npm run build`, then **Commit → Push origin** in GitHub Desktop.

## 8. Repository Pages settings

**Repository** `SecureNomad` → top **Settings** → left **Pages**

1. Under **Build and deployment**, enter `wiki.securenomad.kr` in **Custom domain** → **Save**
2. Confirm **DNS check successful**
3. Check **Enforce HTTPS**

:::info Enforce HTTPS is disabled
The checkbox stays grayed out until the certificate is issued. Check it once it becomes available (a few minutes to up to a day).
:::

## 9. Points that were confusing

### There are two Settings pages

| Location | Purpose |
|---|---|
| **Profile picture → Settings → Pages** (account) | Domain **ownership verification** (TXT, Verify) |
| **Repository → Settings → Pages** (repository) | **Custom domain**, Enforce HTTPS |

### Order of work

```text
① Buy the domain
② Verify the domain in account Settings (TXT)
③ Add the CNAME in Gabia
④ Confirm propagation with nslookup
⑤ Update CNAME file + config → Push
⑥ Save Custom domain in repository Settings → Enforce HTTPS
```

:::caution Why the order matters
If ⑤ and ⑥ are done before DNS propagates (④), the github.io URL **redirects to a domain that is not connected yet**, and the site becomes temporarily unreachable.
:::

## 10. Result

- Site URL: **https://wiki.securenomad.kr**
- `https://inseokjeon-sec.github.io/SecureNomad/` redirects to the new domain automatically
- HTTPS enabled (padlock icon)

### Checklist

- [x] Account Settings → Pages: `securenomad.kr` **Verified**
- [x] Gabia DNS: TXT and CNAME (`wiki`) records registered
- [x] `nslookup` shows `github.io`
- [x] `static/CNAME`, `url`, `baseUrl` updated and pushed
- [x] Repository Settings → Pages: DNS check successful
- [x] Enforce HTTPS checked
- [x] `https://wiki.securenomad.kr` reachable
