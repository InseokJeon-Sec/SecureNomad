---
title: 04. Automatic Deployment to GitHub Pages
sidebar_label: 04. GitHub Pages Deploy
sidebar_position: 4
description: docusaurus.config.js settings, a GitHub Actions workflow, and enabling GitHub Pages
---

# 04. Automatic Deployment to GitHub Pages

Every push to the `main` branch triggers GitHub Actions to build the site and deploy it to GitHub Pages.

```text
git push (main)
   └─▶ GitHub Actions: npm ci → npm run build
          └─▶ upload build folder → deploy to GitHub Pages
                 └─▶ https://inseokjeon-sec.github.io/SecureNomad/
```

## 1. Change the GitHub Pages source

1. Repository → **Settings**
2. Left menu **Code, planning, and automation → Pages**
   (the General screen has no Source option)
3. Change **Build and deployment → Source** to **GitHub Actions**

## 2. docusaurus.config.js

```js
  title: 'SecureNomad',
  tagline: '보안과 IT 지식 정리',

  url: 'https://inseokjeon-sec.github.io',   // lowercase
  baseUrl: '/SecureNomad/',                   // repository name, leading and trailing slashes required
  trailingSlash: false,

  organizationName: 'InseokJeon-Sec',         // GitHub username as is
  projectName: 'SecureNomad',                 // repository name

  i18n: {
    defaultLocale: 'ko',                      // lowercase ko
    locales: ['ko'],
  },
```

| Field | Note |
|---|---|
| `url` | Domains are case-insensitive, but GitHub Pages uses lowercase |
| `baseUrl` | Case-sensitive. Must match the repository name exactly |
| `organizationName` | The username in `github.com/<username>/<repo>`, including hyphens |
| `defaultLocale` | `ko`, not `Ko` |

## 3. GitHub Actions workflow

Create `.github/workflows/deploy.yml` at the project root.
In VS Code, entering `.github/workflows/deploy.yml` as a new file name creates the folders automatically.

```yaml title=".github/workflows/deploy.yml"
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

| Part | Meaning |
|---|---|
| `on.push.branches: [main]` | Runs on every push to main |
| `workflow_dispatch` | Enables a manual run button in the Actions tab |
| `permissions` | Grants only the minimum permissions needed for Pages deployment |
| `fetch-depth: 0` | Fetches the full commit history, needed for last-updated dates on docs |
| `npm ci` | Installs exactly the versions in `package-lock.json` |
| `upload-pages-artifact` / `deploy-pages` | Deploys the `build` folder to Pages |

## 4. Commit & Push

In GitHub Desktop:

1. Check `docusaurus.config.js` and `.github/workflows/deploy.yml` in Changes
2. Summary: `Add deployment settings` → **Commit to main**
3. Click **Push origin** (without it, changes stay only on your PC)

## 5. Verify the deployment

1. Repository **Actions** tab → check the `Deploy to GitHub Pages` run
2. A green check appears after 2–3 minutes
3. Open `https://inseokjeon-sec.github.io/SecureNomad/`

If it fails (red X), open the run and read the log. If the first push happened before Pages was configured, run it again with **Re-run jobs**.

→ [Troubleshooting: 404 after deployment](./troubleshooting/05-pages-404.md)

## Later: custom domain

The site URL and `baseUrl` changed later when the `wiki.securenomad.kr` domain was connected.
→ [06. Connecting a Custom Domain](./06-custom-domain.md)
