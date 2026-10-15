---
title: Problems With Creating a Project in a OneDrive Folder
sidebar_label: OneDrive Path
sidebar_position: 3
---

# Problems With Creating a Project in a OneDrive Folder

## Situation

GitHub Desktop's default repository path was inside OneDrive:

```text
C:\Users\<user>\OneDrive\Documents\GitHub\SecureNomad
```

## Problems

- Docusaurus's `node_modules` contains tens of thousands of files, so **OneDrive keeps syncing.**
- Files locked during sync can cause errors such as `EPERM` or `EBUSY` in `npm install` / `npm run build`.
- It wastes cloud storage.
- The path contains Korean characters (`문서`, "Documents"), which can cause problems with some tools.

## Fix

Created the project again in a short English-only path outside OneDrive:

```bash
mkdir C:\dev
cd /d C:\dev
npx create-docusaurus@latest SecureNomad classic
```

The empty repository created in OneDrive was removed with **Repository → Remove** in GitHub Desktop.

## Takeaway

Keep development projects **outside synced folders, in an English-only path** such as `C:\dev`.
The GitHub repository serves as the backup.
