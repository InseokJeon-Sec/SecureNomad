---
title: SOC Metrics and Quality Management
sidebar_label: Metrics & Quality
sidebar_position: 4
description: SOC metrics like MTTD/MTTR, alert and false-positive management, detection-rule tuning, and quality management (QM)
tags: [SOC, security-monitoring, metrics, quality]
---

# SOC Metrics and Quality Management

As a SOC grows, "we work hard" can't be proven. You must **manage by metrics** to sustain quality and meet SLAs.

## Key metrics

| Metric | Meaning | Caveat |
|---|---|---|
| **MTTD** (mean time to detect) | From occurrence to detection | Shorter is better |
| **MTTR** (mean time to respond) | From detection to response complete | Split triage/analysis/response to see the bottleneck |
| **Alert volume** | Alerts per period | Excess causes fatigue/misses |
| **FP rate** | False positives / all alerts | High rate erodes trust and buries true positives |
| **Escalation ratio** | L1→L2 ratio | Too high means weak L1 criteria |
| **SLA compliance** | Meeting contracted response times | The contractual basis of remote monitoring |

:::warning The metric trap
Making "alerts closed" the KPI creates an incentive to **close fast**, missing true positives. You must watch throughput (quantity) and accuracy (quality) **together**.
:::

## Alert fatigue and false-positive management

Excessive false positives are the most common cause of SOC failure.

- Identify high-FP use cases and **tune or retire** them. Analysts learn to ignore rules that aren't fixed.
- Manage **exceptions/allowlists** with a rationale and an expiry (permanent exceptions seed misses).
- Aggregate duplicate alerts and sort by priority so analysts "see what matters first."

## Detection-rule/use-case tuning

- **Test new use cases before production** (estimate FP volume against historical logs).
- Periodically review use cases to adjust **coverage (new threats) and noise (FPs)** together.
- Use an ATT&CK coverage map to find undetected tactics and prioritize.

## Quality management (QM)

At large/remote scale, quality is sustained by **process, not individual skill**.

- **Sample review**: QM re-reviews a sample of analyst-closed alerts to catch misclassification.
- **Standardized runbooks/criteria**: same situation, same judgment.
- **Handover checks**: ensure open items/temporary blocks aren't lost.
- **Client reporting**: periodically report metrics, key events, and actions (the trust basis of remote monitoring).

## Summary
- Watch MTTD/MTTR/FP rate/SLA **together**. Throughput alone collapses quality.
- False-positive management and rule tuning preserve detection trust.
- At scale, QM (sample review, standardization, handover) decides success.
