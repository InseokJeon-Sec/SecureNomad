---
title: XBOW
sidebar_label: XBOW
sidebar_position: 3
description: An analysis of XBOW, a commercial autonomous AI penetration-testing service, from a tool perspective
---

# XBOW

:::caution About this analysis
This is analysis to understand the tool, and it must be used **only against authorized targets**. → [Approach & scope](../../../lab/ai-pentest/00-approach-and-ethics.md)
:::

## At a glance

| Item | Content |
|---|---|
| Specialization | <span className="badge badge--tag">Autonomous Pentest</span> autonomous AI pentest (SaaS) |
| Category | <span className="badge badge--red">Offense/Assessment</span> |
| Provider | XBOW (commercial startup) |
| Price | <span className="badge badge--red">Paid</span> — subscription/on-demand (official quote) |
| Audience | <span className="badge badge--gray">Enterprise</span> |
| Data handling | <span className="badge badge--amber">Cloud</span> SaaS |

## Overview

XBOW is a **commercial service in which AI autonomously performs penetration testing**.
It aims to have AI perform, at "machine speed," the pentesting a human used to do — in bulk and fast — and also offers an on-demand (run-as-needed) mode.

Where ARTEX/PentestGPT are the open-source line, XBOW differs in being an **enterprise commercial SaaS**.

## Data-handling view

As a cloud-based SaaS, target and result data are **processed in the service provider's environment**. When adopting it, confirm the data-handling/retention policy in the contract/terms.

## Availability

- A commercial service. Prices/plans are per the official site/sales quote and may change.
- Has also been offered via AWS Marketplace and the like.

## References

- XBOW official site / product announcement materials
