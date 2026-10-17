---
title: garak
sidebar_label: garak
sidebar_position: 6
description: An analysis of garak, an open-source scanner that checks the vulnerabilities of LLMs themselves, from a tool perspective
---

# garak

## At a glance

| Item | Content |
|---|---|
| Specialization | <span className="badge badge--tag">LLM Security</span> LLM/AI-system vulnerability scanning |
| Category | <span className="badge badge--blue">Defense</span> (AI red-teaming) |
| Provider | NVIDIA (+ community) |
| License | Open source |
| Price | <span className="badge badge--green">Free/OSS</span> |
| Audience | <span className="badge badge--gray">Security pros · AI developers</span> |
| Data handling | <span className="badge badge--gray">Configurable</span> depends on the model under test |

## Overview

garak is a **vulnerability scanner that checks an LLM's own security weaknesses**.
With dozens of plugins and thousands of prompts, it automatically tests LLM-specific weaknesses like prompt injection, harmful output, and data leakage.

Where the earlier tools "assess (general) systems with AI," garak differs in that **the target under assessment is the AI (LLM) itself**. It's used for **AI red-teaming** — evaluating the safety of your own LLM service.

## Data-handling view

garak sends test prompts to the target LLM and evaluates the responses.
If the target is a **cloud LLM it's external transmission**, and if it's a **locally hosted model it's local processing**, so the data flow depends on the target configuration. <span className="badge badge--gray">Configurable</span>

## Availability

- Open source led by NVIDIA, a CLI tool installable via PyPI
- Actively updated

## References

- garak official site / GitHub (NVIDIA)
