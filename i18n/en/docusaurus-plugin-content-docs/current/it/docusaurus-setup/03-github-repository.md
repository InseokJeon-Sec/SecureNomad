---
title: 03. Connecting a GitHub Repository
sidebar_label: 03. GitHub Repository
sidebar_position: 3
description: Turning a local project into a repository with GitHub Desktop and publishing it to GitHub
---

# 03. Connecting a GitHub Repository

## 1. Register the local folder as a Git repository

Done in GitHub Desktop:

1. **File → Add local repository**
2. **Choose...** → select `C:\dev\SecureNomad`
3. When "This directory does not appear to be a Git repository" appears, click **create a repository**

:::warning An extra nested folder gets created
The `create a repository` dialog **creates a new folder named [Name] inside [Local path].**
As a result, a nested folder such as `C:\dev\SecureNomad\SecureNomad` was created.
→ [Troubleshooting: Nested repository folder](./troubleshooting/04-nested-repository.md)
:::

### The reliable way: git init in the terminal

If Git for Windows is installed, creating the repository from the terminal is the most reliable approach:

```bash
cd /d C:\dev\SecureNomad
git init -b main
```

Then in GitHub Desktop: **File → Add local repository** → `C:\dev\SecureNomad` → **Add repository**.

## 2. First commit

1. The **Changes** tab lists the Docusaurus files.
2. **Make sure `node_modules` is not in the list.** (`.gitignore` excludes it)
3. Summary: `Create Docusaurus project` → **Commit to main**

## 3. Publish to GitHub

1. Click **Publish repository** at the top
2. Settings

| Item | Value | Reason |
|---|---|---|
| Name | `SecureNomad` | Becomes part of the site URL path |
| Keep this code private | **Unchecked** | GitHub Pages on a free account supports public repositories only |

3. Click **Publish repository**

Result: `https://github.com/InseokJeon-Sec/SecureNomad`

:::caution Public repositories
Anyone can see every file and the full commit history of a public repository.
**Review the Changes list before committing** so that IPs, accounts, API keys, or internal screenshots from labs do not slip into Markdown or images.
Once pushed, content remains in the history even after the file is deleted.
:::

## Repository name and site URL

| Repository name | Site URL | `baseUrl` |
|---|---|---|
| `<username>.github.io` | `https://<username>.github.io/` | `/` |
| `SecureNomad` (chosen) | `https://inseokjeon-sec.github.io/SecureNomad/` | `/SecureNomad/` |

Once a custom domain is connected, `baseUrl` becomes `/` either way.
