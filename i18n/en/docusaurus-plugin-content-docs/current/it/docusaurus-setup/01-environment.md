---
title: 01. Preparing the Development Environment
sidebar_label: 01. Environment
sidebar_position: 1
description: Programs installed on a Windows PC to build a Docusaurus site, and how to verify them
---

# 01. Preparing the Development Environment

The programs installed on a Windows PC to build a Docusaurus site and deploy it to GitHub Pages.

## Overall setup

```text
[My PC]                                   [GitHub]
VS Code ── write Markdown docs            Repository (SecureNomad)
Node.js ── npm start / npm run build           │
Git + GitHub Desktop ── commit / push ──▶  GitHub Actions (build)
                                               │
                                           GitHub Pages (publish site)
```

## Installed programs

| Program | Purpose | Installed version |
|---|---|---|
| Node.js (LTS) | Run and build Docusaurus | v24.22.0 (npm 11.19.1) |
| Git for Windows | `git` in the terminal, last-updated dates on docs | Latest |
| GitHub Desktop | Commit / push with buttons | Latest |
| Visual Studio Code | Edit Markdown, built-in terminal | Latest |

## 1. Node.js

- Download: nodejs.org → **LTS** version
- Docusaurus 3.x requires Node.js 20 or later, and upcoming versions will require 24 or later, so Node.js 24 LTS was installed from the start.
- Install with the default options.

:::warning
Do **not** check **"Automatically install the necessary tools"** during installation.
It installs Visual Studio Build Tools (C++ build tools), which Docusaurus does not need, and the installer window may appear to hang.
→ [Troubleshooting: Visual Studio Installer hangs during Node.js installation](./troubleshooting/01-vs-installer-hang.md)
:::

Verify the installation:

```bash
node -v
npm -v
```

## 2. Git for Windows

- Download: git-scm.com → Download for Windows
- Install with **all default options**.

:::info Why GitHub Desktop alone is not enough
GitHub Desktop ships with its own embedded Git, but **the `git` command used in the terminal must be installed separately.**
Docusaurus's `showLastUpdateTime` option (last-updated date on each doc) reads file history with `git` at build time, so local builds fail without Git for Windows.
→ [Troubleshooting: outside any Git worktree](./troubleshooting/07-git-worktree-error.md)
:::

After installation, register your user information once:

```bash
git config --global user.name "Your Name"
git config --global user.email "your GitHub email"
git --version
```

## 3. GitHub Desktop

- Download: desktop.github.com
- Sign in with your GitHub account.
- Handles commits, pushes, and repository creation (Publish) with buttons.

## 4. Visual Studio Code

- Download: code.visualstudio.com
- On the "Select Additional Tasks" screen, check:
  - Add "Open with Code" action to Windows Explorer file/directory context menu
  - Add to PATH
- After installation, **fully quit and restart GitHub Desktop** so that Visual Studio Code appears under `File → Options → Integrations → External editor`.

### Switch the VS Code terminal to Command Prompt

The default VS Code terminal, PowerShell, may block `npm`.

1. `Ctrl + Shift + P` → `Terminal: Select Default Profile`
2. Select **Command Prompt**
3. Close the terminal and reopen it with `` Ctrl + ` ``

→ [Troubleshooting: PowerShell execution policy error](./troubleshooting/06-powershell-execution-policy.md)

## Checklist

- [x] `node -v` → v24.x
- [x] `npm -v` → prints a version
- [x] `git --version` → prints a version
- [x] Signed in to GitHub Desktop
- [x] VS Code terminal = Command Prompt
