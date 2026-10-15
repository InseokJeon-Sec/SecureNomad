---
title: npm Blocked by PowerShell Execution Policy
sidebar_label: PowerShell Execution Policy
sidebar_position: 6
---

# npm Blocked by PowerShell Execution Policy

## Symptom

Running `npm run build` in the VS Code terminal:

```text
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts
is disabled on this system. For more information, see about_Execution_Policies.
    + CategoryInfo          : SecurityError: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess
```

(The original message was displayed in Korean.)

## Cause

The default VS Code terminal is **PowerShell**.
The default PowerShell execution policy on Windows clients (`Restricted`) blocks `.ps1` scripts, and typing `npm` in PowerShell runs `npm.ps1`, so it is blocked.
The **Command Prompt (cmd)** opened from GitHub Desktop uses `npm.cmd`, so it had no problem.

## Fix

### Option 1. Change the VS Code default terminal to Command Prompt (chosen)

1. `Ctrl + Shift + P` → `Terminal: Select Default Profile` → **Command Prompt**
2. Close the terminal with the trash icon and reopen it with `` Ctrl + ` ``
3. Confirm the prompt is `C:\dev\SecureNomad>` rather than `PS C:\...`

This option leaves the system security policy unchanged.

### Option 2. Change the execution policy for the current user

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

| Policy | Meaning |
|---|---|
| `Restricted` | Blocks all scripts (Windows client default) |
| `RemoteSigned` | Allows local scripts; scripts downloaded from the internet must be signed |
| `Unrestricted` / `Bypass` | No restrictions (not recommended) |

`-Scope CurrentUser` applies only to the current user and does not require administrator rights.

## Security note

The execution policy is not a security boundary; it is closer to **a safety feature that prevents scripts from running by accident** (it is easily bypassed with `powershell -ExecutionPolicy Bypass`).
Still, the principle is not to loosen settings unnecessarily, so Option 1 was chosen.
