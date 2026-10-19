---
title: Detection Pipeline — From Logs to Response
sidebar_label: Detection Pipeline
sidebar_position: 3
description: The SOC detection pipeline from log sources, collection, normalization, correlation, alerting, triage, to response, and use-case design
tags: [SOC, security-monitoring, detection, SIEM]
---

# Detection Pipeline — From Logs to Response

SOC detection is one pipeline. If any stage is weak, the whole is weak.

```text
[log sources] → [collect/normalize] → [correlation/rules] → [alert] → [triage (L1)]
   → [analysis (L2)] → [response/escalation] → [feedback: rule tuning]
```

## 1. Log sources — what you look at

Detection is only possible **within the logs you have**. Source selection defines detection scope.

| Area | Representative sources |
|---|---|
| Network | Firewall, IDS/IPS, proxy, DNS, NetFlow |
| Endpoint | EDR, OS event logs, anti-malware |
| Identity/accounts | AD/LDAP, SSO/IdP, privileged accounts |
| Application | Web server, WAF, DB audit logs |
| Cloud | CloudTrail-type audit, IAM, workload logs |

- A **coverage gap** is an undetected area. An asset with no logs has no detection.
- Sources differ in format/time zone/fields, so **normalization** is needed. If time sync (NTP) drifts, correlation breaks.

## 2. Collection/normalization

- Collect via agents/syndicators/forwarders into a SIEM (or log lake).
- Normalize to a common schema to align fields (user, host, action, result).
- Retention period and capacity (license/storage) become the real constraint on collection scope.

## 3. Correlation and use cases

A **use case** defines "what to detect under what conditions" — a detection scenario. A SOC's detection strength comes not from the number of rules but from the **quality of use cases**.

- Judge by **combinations, sequences, and thresholds** of multiple events, not a single event (e.g., many failed logins then a success → off-hours access).
- Use threat intel (IOCs) and behavior-based (ATT&CK mapping) together.
- Design each use case as one bundle: **detection goal → required logs → logic → expected false positives → response procedure**.

:::tip MITRE ATT&CK mapping
Mapping use cases to ATT&CK techniques turns "which tactics/techniques we detect/miss" into a coverage map. (For AI systems, see [MITRE ATLAS](/en/security/ai-security-assessment/mitre-atlas))
:::

## 4. Alert → triage → response

- **Alert**: an event caught by a use case. Too many overwhelm analysts (alert fatigue).
- **Triage (L1)**: false/true-positive screening, prioritization, escalation when criteria are exceeded.
- **Analysis (L2)**: scope/impact judgment, linking related events, executing response.
- **Response**: account lockout, host isolation, IP blocking, etc. If judged an incident, hand off to incident response (IR).
- **SOAR**: automate repetitive responses (isolation, blocking, ticket creation) to reduce L1 load.

## 5. Feedback — the pipeline is a loop

It doesn't end at response; false/missed detections feed back into the rules. Without this loop, alerts grow and trust falls. (Metrics/tuning in the [next document](./metrics-and-tuning.md))

## Summary
- Detection scope = the scope of **log sources** you have. A gap is a miss.
- Detection strength = not rule count but **use-case quality** and ATT&CK coverage.
- The pipeline must loop through response and feedback to be sustained.
