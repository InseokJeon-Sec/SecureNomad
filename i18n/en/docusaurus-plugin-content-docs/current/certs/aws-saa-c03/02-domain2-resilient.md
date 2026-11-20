---
title: 2. Resilient Architectures
sidebar_label: 2. Resilient Architectures
sidebar_position: 3
description: SAA-C03 Resilient Architectures study items
---

import YouTube from '@site/src/components/YouTube';

# Domain 2 — Resilient Architectures (26%)

The high availability section is also available as a video. — AWS Certification Essentials #9

<YouTube id="3u8IGNrMRok" title="High Availability — Multi-AZ, ELB, Auto Scaling, DB HA | AWS Certification Essentials (SAA-C03) #9" />

> Study checklist. Detailed notes to follow.

- Decoupling: SQS, SNS, EventBridge, Step Functions, API Gateway, event-driven/fan-out
- Compute coupling: ECS/EKS/Fargate/Lambda; load balancing ALB/NLB/GWLB; Auto Scaling
- HA/fault tolerance: Multi-AZ vs Multi-Region, failover
- DB resilience: RDS Multi-AZ, read replicas, Aurora, DynamoDB global tables
- Route 53 routing policies & health checks; S3 durability/versioning/replication, EFS
- Backup & DR strategies (Backup&Restore / Pilot Light / Warm Standby / Multi-Site), RTO/RPO
