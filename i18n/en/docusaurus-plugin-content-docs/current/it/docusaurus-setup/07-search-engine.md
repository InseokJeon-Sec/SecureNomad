---
title: 07. Registering with Search Engines (Naver · Google)
sidebar_label: 07. Search Engines
sidebar_position: 7
description: Configuring robots.txt, the sitemap, and meta tags, and registering the site with Naver Search Advisor and Google Search Console
---

# 07. Registering with Search Engines (Naver · Google)

Added site-side settings so that Naver (Korea's largest search engine) and Google can crawl and index the site, then registered it with each search engine's webmaster tools.

```text
[Site preparation]                    [Naver Search Advisor]
robots.txt  ─ allow crawling + sitemap    Ownership: HTML meta tag
sitemap.xml ─ list of pages to crawl ─▶   Submit sitemap / request crawl
Meta tags   ─ description, keywords,
              ownership verification  [Google Search Console]
                                          Ownership: DNS TXT (domain property)
                                          Submit sitemap / request indexing
```

## 1. robots.txt

Creating `static/robots.txt` deploys it to the site root (`/robots.txt`).

```text title="static/robots.txt"
User-agent: *
Allow: /

Sitemap: https://wiki.securenomad.kr/sitemap.xml
```

| Line | Meaning |
|---|---|
| `User-agent: *` | Applies to all crawlers |
| `Allow: /` | Allows crawling of all pages |
| `Sitemap:` | Tells crawlers where the sitemap is |

## 2. sitemap.xml

The classic preset includes the sitemap plugin, so `/sitemap.xml` is generated automatically without extra installation.
Options were added to pass each document's last-modified date to search engines.

```js title="docusaurus.config.js (presets → classic)"
        sitemap: {
          lastmod: 'date',             // pass doc last-modified dates to search engines
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
```

:::info lastmod
`lastmod` is read from the Git commit history. The `fetch-depth: 0` setting in the GitHub Actions workflow is required for accurate dates.
:::

## 3. Meta tags

### Site-wide

```js title="docusaurus.config.js (themeConfig)"
      metadata: [
        {name: 'keywords', content: '...security keywords...'},
        {name: 'author', content: 'Inseok Jeon'},
        {name: 'naver-site-verification', content: 'value issued by Naver'},
      ],
```

### Per-document description

Used as the summary in search results. Write one or two sentences in each document's front matter.

```md
---
title: SecureNomad
description: A wiki for organizing and sharing security and IT knowledge.
---
```

`description` is used for both `<meta name="description">` and `og:description` (link previews).

## 4. Registering with Naver Search Advisor

### Register the site

1. Go to `searchadvisor.naver.com` → sign in with a Naver account
2. **Webmaster Tools** → enter `https://wiki.securenomad.kr` to register the site

### Ownership verification (HTML tag)

1. Choose **HTML tag** as the verification method
2. Add the `content` value of the `naver-site-verification` tag to `metadata` in the config
3. Commit → Push → after deployment, click **Verify ownership**

:::tip Why the HTML tag method
Uploading an HTML file also works (add it to `static/`), but the tag method is a single line in the config and easier to manage.
The verification value is visible in the page source, so it is not a secret, but it is not recorded in this document.
:::

### After registration

| Menu | Action |
|---|---|
| Request → Submit sitemap | `https://wiki.securenomad.kr/sitemap.xml` |
| Validate → robots.txt | Check that crawling is allowed |
| Request → Crawl web page | Request crawling of the home page |

## 5. Registering with Google Search Console

### Choosing the property type

| Type | Verification | Scope |
|---|---|---|
| **Domain** (chosen) | DNS TXT record | All of `securenomad.kr` (every subdomain, http/https) |
| URL prefix | Meta tag, HTML file, etc. | Only the entered URL (`https://wiki.securenomad.kr`) |

→ Chose the **domain property**: it is verified through DNS alone without changing site files, and it keeps working when other subdomains are added later.

### Ownership verification

1. `search.google.com/search-console` → **Add property**
2. Enter `securenomad.kr` in the **Domain** field (without `wiki` or `https://`)
3. Copy the `google-site-verification=...` value shown
4. Gabia DNS management tool → DNS settings **[Edit records] → [Add record]**

| Type | Host | Value |
|---|---|---|
| TXT | `@` | `google-site-verification=<issued value>` |

5. Click **Verify** in Search Console

:::info Host `@`
`@` means the apex domain (`securenomad.kr`) itself. It uses a different host from the GitHub verification TXT (`_github-pages-challenge-...`), so both records coexist without conflict.
:::

Current Gabia DNS records:

| Type | Host | Purpose |
|---|---|---|
| TXT | `_github-pages-challenge-<username>` | GitHub Pages domain verification |
| CNAME | `wiki` | GitHub Pages connection |
| TXT | `@` | Google Search Console verification |

### After registration

**Submit the sitemap**

1. Left menu **Indexing → Sitemaps**
2. Enter `https://wiki.securenomad.kr/sitemap.xml` → **Submit**
3. Confirm the status is **Success** (it may first show "Couldn't fetch" and change later)

:::caution
For a domain property, enter the sitemap as a **full URL** including `wiki.`.
:::

**Request indexing of the home page**

1. Enter `https://wiki.securenomad.kr/` in **URL inspection** at the top
2. "URL is not on Google" is expected for a new site
3. **Request indexing** → confirm "Indexing requested"

Other pages are crawled through the sitemap, so individual requests were skipped (there is a daily request limit).

## 6. Verification

Checked directly in the browser after deployment:

- `https://wiki.securenomad.kr/robots.txt`
- `https://wiki.securenomad.kr/sitemap.xml`
- Right-click on the home page → **View page source** → check the `naver-site-verification` and `description` tags

It usually takes a few days to a few weeks to appear in search results.

| What to check | Where |
|---|---|
| Whether pages are indexed | Search `site:wiki.securenomad.kr` on Naver and Google |
| Naver crawl status | Search Advisor → Reports |
| Google index status | Search Console → Indexing → Pages |

### Registration checklist

- [x] robots.txt, sitemap.xml, and meta tags deployed
- [x] Naver Search Advisor: ownership verified, sitemap submitted, crawl requested
- [x] Google Search Console: domain property verified, sitemap submitted, indexing requested
- [ ] Bing Webmaster Tools: import from Search Console (optional)

## Writing future documents

- Add a `description` to every document's front matter
- Include key terms in the `title`
- Add alt text to images: `![XSS attack flow](/img/xss-flow.png)`
