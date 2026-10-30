---
title: ARTEX
sidebar_label: ARTEX
sidebar_position: 1
description: An analysis of ARTEX, an LLM multi-agent autonomous penetration-testing tool, from a tool perspective (purpose, provider, price, data handling, availability)
---

# ARTEX

:::caution About this analysis
This document is an **analysis to understand** the tool called ARTEX. It does not cover how to obtain, install/configure, or carry out attacks.
ARTEX's source is currently closed, and **use against unauthorized targets is illegal**. → [Approach & scope](../../../lab/ai-pentest/00-approach-and-ethics.md)
:::

## At a glance

| Item | Content |
|---|---|
| Specialization | <span className="badge badge--tag">Autonomous Pentest</span> |
| Category | <span className="badge badge--red">Offense/Assessment</span> |
| Provider | Autumn-27 (individual developer, community open source) |
| Price | <span className="badge badge--green">OSS/Free</span> — currently gone closed |
| Audience | <span className="badge badge--gray">Security professionals</span> not for general users |
| Data handling | <span className="badge badge--gray">Configurable</span> depends on the LLM backend connected |
| Status | Previously public on GitHub → source now closed |

## Overview

ARTEX is an **LLM (large language model) multi-agent autonomous penetration-testing system**.
Without a human directing each step, it aims to have multiple AI agents split roles and autonomously carry out reconnaissance/assessment.

Where traditional pentest tools are "a human operating a tool," tools like ARTEX move toward "AI judging and proceeding," illustrating the **trend of pentest automation**.

## Characteristics (high level)

- **Multi-agent structure**: known to split work across several agents.
- **Pluggable LLM backend**: not fixed to a specific model; the LLM used can be swapped. According to reports, in actual cases DeepSeek was used as the main model, with GLM/Grok families as backups.
- **Open-source based**: the source was open at release so anyone could inspect it. (Now closed.)

:::note
Detailed architecture, configuration, and execution are out of scope here. We cover only "what kind of tool it is."
:::

## Data-handling view (security-staff checkpoint)

ARTEX's data handling is classified as <span className="badge badge--gray">Configurable</span>, because it differs completely depending on the LLM backend connected.

| Backend choice | Data flow |
|---|---|
| Cloud LLM API (e.g., an external commercial model) | <span className="badge badge--amber">Cloud</span> input data is sent to an external provider's servers |
| Local/self-hosted LLM | <span className="badge badge--green">Local</span> processed within your environment |

When reviewing an AI pentest tool, you must confirm whether target-system info and assessment results are **transmitted to an external LLM**.
Using a cloud API may hand sensitive information about the target to a third party.

## Availability · license

- At release: GitHub open source
- Now: **the developer made the source closed**, halting further updates/releases/maintenance
- Developer's stance: stated it was "built for learning/research, and misuse cases are unrelated to the project"

## Reference: known misuse case

From late September to early October 2026, ARTEX was reportedly **misused in attacks on Korean financial firms (Shinhan Bank, Yegaram Savings Bank, etc.)**, with data exfiltrated.
CrowdStrike investigated, and ARTEX configuration files and LLM session logs were found on exposed servers. The attacker was not attributed to a specific group and was presumed Chinese-speaking and financially motivated.

This case is **less a problem of the tool itself than an example of a dual-use tool being used maliciously**.
A pentest tool is a security-hardening means when a defender uses it, and an attack tool when an attacker uses it. ARTEX illustrates that boundary well.

### Lessons from the defense view

- **Exposure checks**: internet-exposed directories, config files, and session logs served as clues for both attack and investigation. Periodically review externally exposed assets.
- **LLM traffic monitoring**: detect anomalous traffic where internal servers communicate with an external LLM API.
- **Post-breach response**: a data breach can lead to secondary phishing/loan fraud, so user-facing advisories are needed.

## Assessment

A tool that showed the trend of AI autonomously performing pentests. From the defense view, it establishes the premise that "attackers can use such automation," and reminds us to scrutinize **whether data leaves to an external LLM** when choosing tools.

## References

- The Hacker News — ARTEX AI pentesting tool used in data theft from Korean firms
- Security Affairs — AI-driven tool ARTEX used in attacks against South Korean banks
- SBS Biz / WSJ — reports related to 'ARTEX' in the Korean bank hacking case
