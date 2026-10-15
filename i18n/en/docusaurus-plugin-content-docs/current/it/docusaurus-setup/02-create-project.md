---
title: 02. Creating the Docusaurus Project
sidebar_label: 02. Create Project
sidebar_position: 2
description: Creating a Docusaurus project outside OneDrive and running it locally
---

# 02. Creating the Docusaurus Project

## Choosing the project location

The project was created at **`C:\dev\SecureNomad`**.

:::danger Do not create the project inside a OneDrive folder
GitHub Desktop's default path was `C:\Users\<user>\OneDrive\Documents\GitHub\`.
Docusaurus creates tens of thousands of files in `node_modules`, which keeps OneDrive syncing constantly and can cause build errors due to file locks.
→ [Troubleshooting: OneDrive path issues](./troubleshooting/03-onedrive-path.md)
:::

## Create the project

Run in Command Prompt:

```bash
mkdir C:\dev
cd /d C:\dev
npx create-docusaurus@latest SecureNomad classic
```

| Prompt | Answer |
|---|---|
| `Ok to proceed? (y)` | `y` |
| JavaScript / TypeScript | **JavaScript** |

The project is ready when `Successfully created` appears.

:::tip `cd /d`
In Command Prompt, add `/d` when moving to a path on a different drive so that the drive changes as well.
:::

## Run locally

```bash
cd SecureNomad
npm start
```

It succeeded when this message appears:

```text
client (Rspack 1.7.12) compiled successfully
```

Check the default site at `http://localhost:3000` in the browser.
To stop: `Ctrl + C` in the terminal → `Y`.

:::info npm start vs. npm run build
- `npm start`: development server. Changes appear immediately when you save. Use it to preview while writing.
- `npm run build`: produces the deployable output in the `build` folder and catches errors such as broken links.
:::

## Generated folder structure

```text
SecureNomad/
├── blog/                  # Blog examples (removed later)
├── docs/                  # Markdown docs → become sidebar menus
├── src/
│   ├── css/custom.css     # Site styles
│   └── pages/             # Standalone pages such as the home page (cleaned up later)
├── static/                # Static files such as images (static/img/...)
├── docusaurus.config.js   # Site-wide configuration
├── sidebars.js            # Sidebar configuration
├── package.json           # Dependencies and scripts
└── .gitignore             # Files excluded from Git (node_modules, build, ...)
```
