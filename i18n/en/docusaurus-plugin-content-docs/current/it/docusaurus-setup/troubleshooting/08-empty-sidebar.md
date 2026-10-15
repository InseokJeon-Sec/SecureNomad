---
title: "Sidebar doesn't have anything to be linked to"
sidebar_label: Empty Sidebar Error
sidebar_position: 8
---

# Sidebar doesn't have anything to be linked to

## Symptom

```text
[WARNING] No docs found in "build-log": can't auto-generate a sidebar.
[ERROR] Error: Unable to build website for locale ko.
  [cause]: Error: Docusaurus static site generation failed for 4 paths:
  - "/SecureNomad/404.html"
  - "/SecureNomad/it/overview"
  - "/SecureNomad/security/overview"
  - "/SecureNomad/"
    [cause]: Error: DocSidebarNavbarItem: Sidebar with ID "buildSidebar"
             doesn't have anything to be linked to.
```

## Cause

A navbar item pointed to `buildSidebar`, which was auto-generated from the `docs/build-log` folder, but **no documents were found in that folder.**
Because the navbar with nothing to link to appears at the top of every page, generation of every page failed.

## Fix

Created at least one `.md` document in `docs/build-log/`.

Things to check:

- The folder is inside `docs` (not created at the project root)
- The folder name exactly matches `dirName` in `sidebars.js`
- The file extension is `.md` (not `.md.txt`)
- The file is saved in VS Code (`Ctrl + S`; watch for the ● on the tab)

## Takeaway

When adding a menu, create it in this order: **folder + one doc → sidebars.js → navbar**.
When removing a menu, delete the entries in both the navbar and sidebars.js.
