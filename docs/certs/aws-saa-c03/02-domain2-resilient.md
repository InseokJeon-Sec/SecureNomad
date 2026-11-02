---
title: 02. 복원력 아키텍처 설계 (Domain 2)
sidebar_label: 02. 복원력 설계
sidebar_position: 3
description: SAA-C03 Domain 2 공부 항목 — 확장성·느슨한 결합, 고가용성·내결함성
---

# Domain 2 — 복원력 아키텍처 설계 (26%)

> 공부 항목 체크리스트. 세부 정리는 추후 업데이트.

## 2.1 확장 가능하고 느슨하게 결합된 아키텍처

- 디커플링: SQS(표준/FIFO), SNS, EventBridge, Step Functions
- API 게이트웨이, 이벤트 기반·팬아웃 패턴
- 컴퓨팅 결합: ECS, EKS, Fargate, Lambda(서버리스)
- 로드 밸런싱: ALB · NLB · Gateway LB, 대상 그룹
- Auto Scaling(EC2/애플리케이션), 다계층 아키텍처
- 마이크로서비스, 스토리지/컴퓨팅 분리

## 2.2 고가용성·내결함성 아키텍처

- 다중 AZ vs 다중 리전, 장애 조치(failover)
- 데이터베이스 가용성: RDS Multi-AZ, 읽기 전용 복제본, Aurora, DynamoDB 글로벌 테이블
- Route 53 라우팅 정책(장애 조치·지연·가중치·지리), 상태 확인
- S3 내구성·버전 관리·복제(CRR/SRR), EFS
- 백업/복구: AWS Backup, 스냅샷
- DR 전략: Backup & Restore / Pilot Light / Warm Standby / Multi-Site, RTO·RPO
