---
title: Visual Studio Installer Hangs During Node.js Installation
sidebar_label: VS Installer Hang
sidebar_position: 1
---

# Visual Studio Installer Hangs During Node.js Installation

## Symptom

After installing Node.js, a blue console window opens and stops progressing at this log:

```text
Download requested: https://aka.ms/vs/installer/latest/feed
Warning: Failed to update the latest installer feed (operation canceled)
Warning: Didn't find any channel feed.
Authenticode verification returned 0x00000000 for path: C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe.
```

## Cause

Checking **"Automatically install the necessary tools"** in the Node.js installer runs an extra script that installs Chocolatey, Python, and Visual Studio Build Tools (C++ build tools).
These tools are only needed to compile native modules, and **Docusaurus does not need them.**

## Fix

1. Close the console window and the Visual Studio Installer window. Node.js itself is already installed.
2. Verify in a new terminal:
   ```bash
   node -v
   npm -v
   ```
3. If the commands are not found, reboot → if that does not help, run the Node.js installer again and choose **Repair** (with the checkbox unchecked).

## Takeaway

For Docusaurus, leave the extra tools option unchecked when installing Node.js.
