---
title: 03. 고성능 아키텍처 설계 (Domain 3)
sidebar_label: 03. 성능 설계
sidebar_position: 4
description: SAA-C03 Domain 3 공부 항목 — 스토리지·컴퓨팅·데이터베이스·네트워킹·데이터 처리 성능
---

# Domain 3 — 고성능 아키텍처 설계 (24%)

> 공부 항목 체크리스트. 세부 정리는 추후 업데이트.

## 3.1 고성능·확장형 스토리지

- S3 스토리지 클래스와 성능 특성
- EBS 볼륨 유형(gp3/io2 등)과 IOPS·처리량, Instance Store
- EFS, FSx(Windows/Lustre), 선택 기준
- 전송·마이그레이션: Storage Gateway, DataSync, Transfer Family

## 3.2 고성능·탄력적 컴퓨팅

- EC2 인스턴스 패밀리·유형 선택, 배치 그룹(placement group)
- Auto Scaling 정책, 버스터블/스팟, 우측 크기 조정(right-sizing)
- 서버리스·컨테이너: Lambda, ECS/EKS/Fargate

## 3.3 고성능 데이터베이스

- RDS vs Aurora, 읽기 전용 복제본
- DynamoDB(온디맨드/프로비전드, DAX 캐싱)
- ElastiCache(Redis/Memcached), 캐싱 전략
- Redshift(분석), 적합한 DB 선택 기준

## 3.4 고성능·확장형 네트워킹

- CloudFront(CDN), 캐싱, 엣지 로케이션
- Global Accelerator, 지연·가용성 개선
- 하이브리드 연결: Direct Connect, Site-to-Site VPN, Transit Gateway
- 향상된 네트워킹, 대역폭·지연 고려

## 3.5 고성능 데이터 수집·변환

- 스트리밍: Kinesis(Data Streams/Firehose)
- 분석·ETL: Glue, Athena, EMR, 데이터 레이크
- 배치 vs 스트림 처리 선택
