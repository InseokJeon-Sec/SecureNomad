---
title: Vulnhuntr
sidebar_label: Vulnhuntr
sidebar_position: 4
description: An analysis of Vulnhuntr, which finds code vulnerabilities with an LLM plus static analysis, from a tool perspective
---

# Vulnhuntr

## At a glance

| Item | Content |
|---|---|
| Specialization | <span className="badge badge--tag">Code Vuln Detection</span> LLM + static analysis |
| Category | <span className="badge badge--purple">Analysis</span> |
| Provider | Protect AI |
| License | AGPL-3.0 (open source) |
| Price | <span className="badge badge--green">Free/OSS</span> — but incurs LLM API fees (cost noted) |
| Audience | <span className="badge badge--gray">Security professionals</span> |
| Data handling | <span className="badge badge--gray">Configurable</span> default cloud LLM (Claude/GPT); Ollama is experimental |

## Overview

Vulnhuntr is a **tool that combines an LLM with static code analysis to find remotely exploitable vulnerabilities**.
It traces the call chain from user input to server output, detecting multi-step vulnerabilities like LFI, RCE, XSS, SQLi, SSRF, and IDOR.
At release it drew attention by finding actual zero-days in open-source Python projects.

**Currently it supports only Python codebases.**

## Data-handling view

The default behavior **sends code to a cloud LLM (Claude by default, GPT as an example)**. <span className="badge badge--amber">Cloud</span>
Since code leaves your environment, you must review the scope of data transmission when applying it to sensitive in-house code. Local (Ollama) is noted as experimental.

## Availability

- Public on GitHub (AGPL-3.0), provided by Protect AI
- Requires Python 3.10

## References

- GitHub: protectai/vulnhuntr
- Protect AI blog
