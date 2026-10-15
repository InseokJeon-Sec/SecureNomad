---
title: "npm run build: outside any Git worktree"
sidebar_label: Git Worktree Error
sidebar_position: 7
---

# npm run build: outside any Git worktree

## Symptom

```text
[ERROR] Loading of version failed for version current
[ERROR] Error: Unable to build website for locale ko.
  [cause]: Error: Can't process doc metadata for doc at path ...\docs\intro.md
    [cause]: Error: This Docusaurus site is outside any Git worktree.
    Unable to read Git info for file "C:\dev\SecureNomad\docs\intro.md"
```

## Cause

It was caused by an option added to `docusaurus.config.js`:

```js
docs: {
  showLastUpdateTime: true,   // show last-updated date at the bottom of each doc
},
```

This option **reads each file's last commit time with `git log`** at build time.
Without Git for Windows on the PC (only GitHub Desktop's embedded Git), the `git` command could not run, and Docusaurus concluded the site was "outside a Git repository."

## Fix

**Install Git for Windows** (git-scm.com, default options) → restart VS Code → verify:

```bash
git --version
npm run build
```

Alternative: removing the `showLastUpdateTime: true` line lets the site build without Git (only the last-updated date disappears).

## Note

GitHub Actions runners have Git installed, so server builds do not hit this problem.
However, the workflow must set `fetch-depth: 0` to fetch the full history so dates are accurate.
