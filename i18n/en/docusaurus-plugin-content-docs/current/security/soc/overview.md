---
title: SOC · Security Monitoring — Overview
sidebar_label: Overview
sidebar_position: 1
description: The role and structure of a Security Operations Center (SOC) and this section, from a large-scale remote-monitoring operations view
tags: [SOC, security-monitoring, security-operations]
---

# SOC · Security Monitoring — Overview

A **SOC (Security Operations Center)** is the organization and system that **continuously monitors, analyzes, and responds** to an organization's security events. It is not just detection technology (SIEM, EDR, etc.) but the whole operating system in which **people, process, and technology** run together.

This section takes the view not only of a single organization's in-house monitoring but of **large-scale operations that remotely monitor many client organizations**. At scale, the key becomes less "do we detect well" and more **"do we run 24/7 at a consistent quality."**

## What a SOC does

| Function | Content |
|---|---|
| Monitoring | Continuous collection/observation of logs and events (24x7) |
| Detection | Identify suspicious events via correlation, rules, threat intel |
| Analysis (triage) | Distinguish false/true positives, assess impact and priority |
| Response | Containment/blocking/escalation, linkage to incident response |
| Improvement | Tune detection rules/use cases, metric-based quality management |

## People, process, technology

A SOC works only when three axes mesh. One being good is not enough.

- **People**: analyst tiers, shift work, role division
- **Process**: triage procedures, escalation criteria, runbooks, SLAs
- **Technology**: log collection, SIEM/correlation, EDR/NDR, SOAR, threat intel

## In-house vs MSSP vs hybrid

| Type | Traits |
|---|---|
| In-house | Deep organizational context; high cost to staff and sustain 24x7 |
| MSSP (outsourced) | Easier 24x7 and expertise; limits on context/confidentiality sharing |
| Hybrid | First-line monitoring outsourced, deep analysis/response in-house — the most common in practice |

## This section

| Document | Content |
|---|---|
| [Operating model](./operating-model.md) | Tier structure, 24x7 shifts, roles; in-house/MSSP/hybrid |
| [Detection pipeline](./detection-pipeline.md) | Log sources→collection→correlation→alert→triage→response, use cases |
| [Metrics & quality](./metrics-and-tuning.md) | MTTD/MTTR, false-positive management, rule tuning, QM |

> Incident response (IR), which continues from the SOC's response stage, is a separate topic to be added later.
