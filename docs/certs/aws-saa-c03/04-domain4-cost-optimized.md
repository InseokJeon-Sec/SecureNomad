---
title: 04. 비용 최적화 아키텍처 설계 (Domain 4)
sidebar_label: 04. 비용 설계
sidebar_position: 5
description: SAA-C03 Domain 4 공부 항목 — 스토리지·컴퓨팅·DB·네트워크 비용 최적화
---

# Domain 4 — 비용 최적화 아키텍처 설계 (20%)

> 공부 항목 체크리스트. 세부 정리는 추후 업데이트.

## 4.1 비용 최적화 스토리지

- S3 수명주기·Intelligent-Tiering·스토리지 클래스 선택
- EBS 우측 크기 조정, 스냅샷 비용
- 데이터 전송 비용 이해

## 4.2 비용 최적화 컴퓨팅

- 요금 모델: On-Demand · Reserved Instances · Savings Plans · Spot · Dedicated
- Auto Scaling·우측 크기 조정, Compute Optimizer
- Lambda·Fargate 비용 특성

## 4.3 비용 최적화 데이터베이스

- RDS/Aurora Serverless, DynamoDB 용량 모드
- 읽기 전용 복제본·캐싱으로 비용 절감
- DB 우측 크기 조정

## 4.4 비용 최적화 네트워크

- 데이터 전송 최적화, VPC 엔드포인트 vs NAT 게이트웨이 비용
- CloudFront 캐싱으로 오리진 비용 절감
- Direct Connect vs VPN 비용 비교

## 4.5 비용 가시성·거버넌스

- Cost Explorer, AWS Budgets, Cost and Usage Report
- Trusted Advisor, 태깅 전략, 비용 할당 태그
