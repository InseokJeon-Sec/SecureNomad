---
title: GitHub Desktop Creates a Nested Repository Folder
sidebar_label: Nested Repository Folder
sidebar_position: 4
---

# GitHub Desktop Creates a Nested Repository Folder

## Symptom

Using **Add local repository → create a repository** to turn `C:\dev\SecureNomad` into a repository created a new subfolder containing only `.gitattributes`:

```text
C:\dev\SecureNomad\SecurNomad\      ← 1st attempt (typo in Name)
C:\dev\SecureNomad\SecureNomad\     ← 2nd attempt (same result after changing Local path)
```

## Cause

The `create a repository` dialog **creates a new [Name] folder inside [Local path]** and creates `.git` there.
It does not turn an existing folder into a repository.

## Fix (what was actually done)

1. In File Explorer, check **View → Show → Hidden items**
2. Cut the **`.git` folder and `.gitattributes`** from `C:\dev\SecureNomad\SecureNomad\`
3. Paste them one level up into `C:\dev\SecureNomad\`
4. Delete the now-empty `SecureNomad` subfolder
5. In GitHub Desktop, **Remove** the old entry → add `C:\dev\SecureNomad` with **Add local repository**
6. Commit all files in the Changes tab

## Simpler way

If Git for Windows is installed, create the repository from the terminal:

```bash
cd /d C:\dev\SecureNomad
git init -b main
```

Then just add it in GitHub Desktop with **Add local repository**.
