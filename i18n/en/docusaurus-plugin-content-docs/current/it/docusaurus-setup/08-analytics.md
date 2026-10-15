---
title: 08. Website Analytics (Google Analytics 4)
sidebar_label: 08. Analytics (GA4)
sidebar_position: 8
description: Connecting Google Analytics 4 to a Docusaurus site on GitHub Pages and checking visitor statistics
---

# 08. Website Analytics (Google Analytics 4)

## 1. Overview

GitHub Pages **has no visitor analytics for sites.**

| Location | What it shows |
|---|---|
| GitHub repository → Insights → Traffic | Traffic to the **repository (code pages)**. Unrelated to site visitors |
| Search Console / Search Advisor | Clicks and queries for visits **from search** |
| **Analytics tool (GA4, etc.)** | **Site-wide** visitors, page views per page, referral sources |

→ A separate analytics tool is needed to see overall site traffic.

## 2. Comparing tools

| Tool | Cost | Characteristics |
|---|---|---|
| **Google Analytics 4** (chosen) | Free | Most features (real-time, referrals, page views, engagement time). Built-in Docusaurus support |
| Cloudflare Web Analytics | Free | No cookies, minimal personal data. Simple feature set |
| Naver Analytics | Free | Familiar interface for analyzing Korean traffic |

Why GA4:

- Managed with the same Google account as Search Console (search query data can be linked later)
- The Docusaurus classic preset includes a `gtag` option, so a few config lines are enough
- Detailed analysis features

## 3. Creating a GA4 account, property, and web stream

`analytics.google.com` → **Start measuring**

| Step | Value |
|---|---|
| Create account | Account name: `SecureNomad` |
| Create property | Property name: `SecureNomad Wiki` / Time zone: South Korea / Currency: KRW (₩) |
| Business details | Choose any industry, size, and objective (e.g., understand traffic) |
| Data collection | Platform: **Web** |
| Web stream | URL: `https://wiki.securenomad.kr` / Stream name: `SecureNomad Wiki` / **Enhanced measurement on** |

Creating the stream issues a **Measurement ID** (`G-XXXXXXXXXX`).
The installation snippet suggested by GA4 is not pasted in; the Docusaurus config is used instead.

:::info Enhanced measurement
Besides page views, it automatically measures scrolls, outbound clicks, site search, file downloads, and more without extra code.
:::

## 4. Docusaurus configuration

Add `gtag` to the classic preset options in `docusaurus.config.js`.

```js title="docusaurus.config.js (presets → classic)"
        gtag: {                        // Google Analytics 4
          trackingID: 'G-XXXXXXXXXX',
          anonymizeIP: true,
        },
```

| Option | Meaning |
|---|---|
| `trackingID` | GA4 Measurement ID |
| `anonymizeIP` | IP anonymization. GA4 does not store IPs by default, but it is set explicitly |

The GA4 script (`googletagmanager.com/gtag/js?id=...`) is added to the `<head>` of every page in the build output.
Docusaurus is a single-page application where navigation happens without full reloads, and the gtag plugin records a page view on each navigation.

:::note Is the Measurement ID secret?
The Measurement ID is exposed in the site source, so it is not secret. It is still recorded only as a placeholder here.
:::

## 5. Analytics notice (About)

GA4 distinguishes visitors with cookies, so even a personal site collects visitor data.
As a security professional, I decided **it is right to disclose the collection**, and added a notice to the About page.

| Item | Notice |
|---|---|
| Data collected | Pages visited, visit time, referral source, browser and device type, approximate location |
| Collection method | Google Analytics script and cookies |
| Purpose | Reviewing visitor statistics and improving content |
| Not collected | Information that directly identifies individuals, such as names or contact details |
| Opting out | Block cookies in the browser, Google Analytics opt-out add-on |

:::caution Deployment order
If only the notice is deployed first, the site would claim to collect data that it does not, so **the GA4 settings and the notice were deployed in the same commit.**
:::

## 6. Verifying after deployment

1. Commit → Push → wait for the GitHub Actions deployment
2. Open `https://wiki.securenomad.kr` in another browser or on a phone
3. Check that 1 active user appears in GA4 **Reports → Realtime**

### When visits are not recorded

| Cause | Explanation |
|---|---|
| Local preview | GA4 does not run on `localhost` with `npm start` (production builds only) |
| Ad blockers | Ad-blocking extensions block the GA4 script |
| Before deployment | The previous version is served until the Actions deployment finishes |

To check that the script is included, right-click the deployed page → **View page source** → search for `gtag/js?id=`.

## 7. Where to find page views

Based on the **Reports** menu on the left in GA4.

| What to see | Where |
|---|---|
| Users currently on the site | Reports → **Realtime** |
| Daily visitors | Reports → **Reports snapshot** (choose a date range) |
| Page views per page | Reports → Engagement → **Pages and screens** |
| Referral sources (search, direct, links) | Reports → Acquisition → **Traffic acquisition** |
| Country and city | Reports → User attributes → **Demographic details** |
| Device and browser | Reports → Tech → **Tech details** |

:::info Data latency
The Realtime report updates immediately, but daily reports usually take about a day to fill in.
:::

## 8. Next steps

- **Link Search Console**: once data accumulates, link it in GA4 **Admin → Product links → Search Console links** to see search queries in GA4
- **Exclude my own visits (optional)**: in Admin → Data streams → Configure tag settings → **Define internal traffic**, register your IP and activate the data filter to exclude your own visits from statistics
