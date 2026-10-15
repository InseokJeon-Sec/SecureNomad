---
title: GitHub Desktop "Unable to locate Git"
sidebar_label: Unable to locate Git
sidebar_position: 2
---

# GitHub Desktop "Unable to locate Git"

## Symptom

Clicking **Repository → Open in Command Prompt** in GitHub Desktop shows:

```text
Unable to locate Git
We were unable to locate Git on your system. This means you won't be able
to execute any Git commands in the command prompt.
```

## Cause

GitHub Desktop **ships with its own embedded Git**, so commits and pushes inside the app work.
However, the system-wide `git` command used in the terminal is not installed.

## Fix

- For now, clicking **Open without Git** still opens the terminal (npm commands work).
- The real fix is to **install Git for Windows** (git-scm.com, default options).
  Without it, `npm run build` fails later.
  → [outside any Git worktree](./07-git-worktree-error.md)

## Takeaway

Even when using GitHub Desktop, install Git for Windows separately.
