---
title: 03. 고성능 아키텍처 설계 (Domain 3)
sidebar_label: 03. 성능 설계
sidebar_position: 4
description: SAA-C03 Domain 3 — 스토리지·컴퓨팅·데이터베이스·네트워킹·데이터 처리의 성능 선택을 시험에 바로 쓰도록 설명한다
---

# Domain 3 — 고성능 아키텍처 설계 (24%)

:::tip 모르는 서비스·용어가 나오면
처음 나오는 서비스·모델·약어는 괄호로 짧게 설명을 달았다. 전체 목록과 한 줄 뜻은 **[한 줄 사전](./07-glossary.md)** 에서 한 번에 찾을 수 있다.
:::

핵심 질문은 하나다. **"이 워크로드 특성에는 어떤 서비스/옵션이 가장 빠르고 잘 늘어나는가?"** Domain 2가 "죽어도 견디기"라면, Domain 3는 "빠르고 탄력적으로". 거의 모든 문제가 **워크로드 성격(읽기/쓰기 비율, 지연 민감도, 처리량, 접근 패턴)** 을 주고 맞는 옵션을 고르게 한다.

:::note 이 문서의 구성
**3.1 스토리지 → 3.2 컴퓨팅 → 3.3 데이터베이스 → 3.4 네트워킹 → 3.5 데이터 수집·변환** 을 다루고, 마지막에 **연습문제 34개(해설 포함)** 로 자가 점검한다. 이 문서 하나로 Domain 3을 커버하는 것을 목표로 한다.
:::

---

## 3.1 고성능·확장형 스토리지

### 블록 vs 파일 vs 객체 — 먼저 성격 구분
- **블록(EBS, Instance Store)**: 한 인스턴스에 붙는 디스크. OS·DB용.
- **파일(EFS, FSx)**: 여러 서버가 공유하는 파일 시스템.
- **객체(S3)**: HTTP로 접근하는 무한 확장 저장소. 정적 자산·백업·데이터 레이크.

### EBS 볼륨 유형 (자주 나온다)

| 유형 | 성격 | 쓰는 상황 |
|---|---|---|
| **gp3** | 범용 SSD, IOPS·처리량을 용량과 **독립적으로** 설정 | 기본 선택. 대부분의 워크로드 |
| **io2 / io2 Block Express** | 프로비전드 IOPS SSD, 최고 IOPS·내구성 | 고성능 DB, 지연 민감 |
| **st1** | 처리량 최적화 HDD | 빅데이터·로그 순차 접근 |
| **sc1** | 콜드 HDD | 저빈도 접근, 최저 비용 |

- **gp3 vs gp2**: gp3는 성능을 용량과 분리해 따로 올릴 수 있어 비용·성능 모두 유리. "gp2에서 성능만 더" → gp3.
- **Instance Store**: 인스턴스에 물리적으로 붙은 임시 디스크. 초고속이지만 **정지/종료 시 소실**. 캐시·스크래치용.
- **EBS 다중 연결**: io1/io2는 같은 AZ의 여러 인스턴스에 연결 가능(클러스터 파일시스템 필요).

### 파일 스토리지 — EFS vs FSx

| 서비스 | 용도 |
|---|---|
| **EFS** | 리눅스 NFS, 다중 AZ 공유, 자동 확장 |
| **FSx for Windows** | Windows 공유(SMB), AD 통합 |
| **FSx for Lustre** | HPC·ML의 초고성능 병렬 파일시스템, S3 연동 |

### S3 성능
- 접두사(prefix)별로 초당 요청이 선형 확장된다 — 키를 분산하면 처리량↑.
- **S3 Transfer Acceleration**: 엣지 로케이션 경유로 먼 거리 업로드 가속.
- **멀티파트 업로드**: 큰 파일을 병렬 분할 업로드.
- **S3 Select**: 객체에서 필요한 행·열만 SQL로 뽑아 전송량↓.

### 전송·마이그레이션
- **Storage Gateway**: 온프레미스와 AWS 스토리지 연결(File/Volume/Tape).
- **DataSync**: 온프레미스↔AWS 대량 데이터 **반복 전송** 자동화.
- **Transfer Family**: SFTP/FTPS로 S3·EFS에 올리기.
- **Snowball**: 네트워크로 옮기기엔 너무 큰 데이터를 물리 장치로.

---

## 3.2 고성능·탄력적 컴퓨팅

### 인스턴스 패밀리 — 글자만 알면 반 이상
- **T**: 버스터블(평소 낮고 가끔 급증), 저비용. **M**: 범용 균형.
- **C**: 컴퓨팅 최적화(CPU 집약, 배치·HPC·게임 서버).
- **R / X**: 메모리 최적화(인메모리 DB, 대용량 캐시).
- **I / D**: 스토리지 최적화(로컬 NVMe, 고 IOPS).
- **P / G / Inf / Trn**: 가속 컴퓨팅(GPU·ML 추론/학습).

요구사항의 병목(CPU? 메모리? I/O? GPU?)을 찾아 해당 패밀리를 고른다.

### 배치 그룹(Placement Group)
- **Cluster**: 같은 AZ에 밀집 — 저지연·고대역폭(HPC).
- **Spread**: 하드웨어를 분산 — 상호 독립 장애(소수의 중요 인스턴스).
- **Partition**: 파티션 단위 분산 — 대규모 분산 시스템(HDFS·Kafka).

### 탄력성과 비용-성능
- **Auto Scaling**: 수평 확장(인스턴스 수). 대상 추적이 기본 권장.
- **스팟(Spot)**: 유휴 용량을 최대 90%↓로. 중단 가능 → 상태 비저장·배치·내결함 작업.
- **우측 크기 조정(right-sizing)**: Compute Optimizer 권고로 과/소 프로비저닝 교정.
- **서버리스(Lambda)/Fargate**: 용량 관리 없이 자동 확장. 이벤트성·간헐 워크로드에 성능-효율 모두 유리.

### 수직 vs 수평
- **수직(scale up)**: 인스턴스를 더 큰 유형으로. 한계·단일 장애점.
- **수평(scale out)**: 인스턴스 수를 늘림. 클라우드의 기본 — 무상태 설계 전제.

---

## 3.3 고성능 데이터베이스

### 관계형 — RDS vs Aurora
- **RDS**: 관리형 관계형 DB(MySQL·PostgreSQL 등). 읽기 확장은 **읽기 전용 복제본**.
- **Aurora**: AWS 클라우드 네이티브 관계형. RDS보다 높은 처리량, 최대 15개 읽기 복제본, 자동 스토리지 확장. **Aurora Serverless v2** = 부하에 따라 용량 자동 조절.

### DynamoDB — NoSQL 고성능
- 한 자릿수 밀리초 지연, 수평 확장. 키-값/문서.
- **용량 모드**: **온디맨드**(예측 불가·간헐) vs **프로비전드**(예측 가능, 오토스케일 가능).
- **DAX**: DynamoDB 앞단 **인메모리 캐시**로 마이크로초 읽기. "DynamoDB 읽기를 더 빠르게" → DAX.
- **GSI/LSI**: 다른 키로 조회하려면 보조 인덱스.

### 캐싱 — ElastiCache
- **Redis**: 고급 자료구조·영속성·복제·Pub/Sub. 리더보드·세션·복잡 캐시.
- **Memcached**: 단순·멀티스레드 캐시. 샤딩만, 영속성 없음.
- **캐싱 전략**: Lazy Loading(필요 시 적재) vs Write-Through(쓸 때 갱신). TTL로 신선도 관리.
- 캐싱은 **반복 읽기 지연·DB 부하**를 동시에 줄이는 1순위 성능 카드.

### 분석·기타
- **Redshift**: 대규모 **분석(OLAP)** 데이터 웨어하우스. 트랜잭션(OLTP)용이 아니다.
- DB 선택 기준: 관계형(RDS/Aurora) · 키값(DynamoDB) · 인메모리(ElastiCache) · 분석(Redshift) · 그래프(Neptune) · 시계열(Timestream).

---

## 3.4 고성능·확장형 네트워킹

### CloudFront (CDN)
- 전 세계 **엣지 로케이션**에 콘텐츠를 캐싱해 사용자 가까이에서 제공 → 지연↓, 오리진 부하↓.
- 정적·동적 콘텐츠 모두. S3·ALB·외부 오리진 지원. WAF·서명 URL로 보호.
- "전 세계 사용자에게 정적/스트리밍 콘텐츠를 빠르게" → CloudFront.

### Global Accelerator
- AWS 글로벌 네트워크와 **고정 애니캐스트 IP**로 사용자를 최적 엔드포인트에 연결 → 지연·가용성 개선.
- **CloudFront vs GA**: 콘텐츠 **캐싱**이면 CloudFront, 캐싱이 아닌 **TCP/UDP 애플리케이션 트래픽 가속·고정 IP·빠른 장애 조치**면 Global Accelerator.

### 하이브리드 연결

| 서비스 | 성격 |
|---|---|
| **Site-to-Site VPN** | 인터넷 경유 암호화 터널. 빠르게 구성, 대역폭·지연은 인터넷에 의존 |
| **Direct Connect(DX)** | 전용 물리 회선. 일관된 저지연·고대역폭, 구축에 시간 |
| **Transit Gateway** | 다수 VPC·온프레미스를 **허브**로 연결, 라우팅 단순화 |

"일관된 고성능 전용 연결" → Direct Connect, "빠르고 저렴하게 즉시" → VPN, "VPC가 많아 연결이 복잡" → Transit Gateway.

### 기타 성능 네트워킹
- **향상된 네트워킹(ENA)/배치 그룹 Cluster**: 노드 간 초저지연.
- **Route 53 지연 라우팅**: 가장 빠른 리전으로(2.2와 연결).
- **VPC 엔드포인트**: AWS 서비스에 사설 경로(지연·보안).

---

## 3.5 고성능 데이터 수집·변환

### 스트리밍 — Kinesis
- **Kinesis Data Streams**: 실시간 스트림을 **직접 소비·커스텀 처리**(순서·재처리, 샤드 관리).
- **Kinesis Data Firehose**: 스트림을 **S3·Redshift·OpenSearch로 자동 적재**(관리형, 버퍼링·변환).
- "실시간 커스텀 처리" → Data Streams, "그냥 목적지로 흘려보내기" → Firehose.

### 분석·ETL
- **Glue**: 서버리스 ETL + 데이터 카탈로그. 스키마 탐색·변환.
- **Athena**: S3 데이터에 **직접 SQL**(서버리스, 쿼리당 과금). 데이터 레이크 조회에 최적.
- **EMR**: 관리형 Hadoop/Spark 대규모 배치·ML.
- **데이터 레이크**: S3 중심 + Glue 카탈로그 + Athena 쿼리 조합이 전형.

### 배치 vs 스트림
- **배치**: 모아서 주기 처리(EMR/Glue). 지연 허용, 대용량.
- **스트림**: 들어오는 즉시(Kinesis). 실시간 대시보드·이상 탐지.

---

## 연습문제 (Domain 3)

실제 시험처럼 "요구사항 → 적합한 구성"을 고르는 연습이다. 먼저 스스로 답을 정한 뒤 해설을 펼쳐 확인한다.

**Q1.** gp2 볼륨을 쓰는 DB가 용량은 충분한데 IOPS가 부족하다. 비용 효율적으로 성능만 올리려면?

<details>
<summary>정답·해설</summary>

**gp3로 전환.** gp3는 IOPS·처리량을 용량과 독립적으로 설정할 수 있어, 용량을 늘리지 않고 성능만 올릴 수 있고 일반적으로 더 저렴하다.
</details>

**Q2.** 최고 수준의 일관된 IOPS와 내구성이 필요한 미션 크리티컬 DB 볼륨은?

<details>
<summary>정답·해설</summary>

**io2 / io2 Block Express.** 프로비전드 IOPS SSD로 최고 성능과 높은 내구성을 제공한다.
</details>

**Q3.** 로그를 순차적으로 대량 기록·조회하는 빅데이터 워크로드에 가장 비용 효율적인 볼륨은?

<details>
<summary>정답·해설</summary>

**st1(처리량 최적화 HDD).** 순차 접근·높은 처리량에 적합하고 SSD보다 저렴하다. 랜덤 IOPS에는 부적합.
</details>

**Q4.** 임시 스크래치 공간이 매우 빠르면 좋고, 인스턴스 종료 시 사라져도 무방하다.

<details>
<summary>정답·해설</summary>

**Instance Store.** 인스턴스에 물리적으로 붙은 초고속 임시 디스크. 정지/종료 시 데이터가 사라진다.
</details>

**Q5.** 여러 리눅스 EC2가 동시에 마운트해 공유 파일을 읽고 써야 한다.

<details>
<summary>정답·해설</summary>

**EFS.** 다중 AZ NFS 공유. (Windows SMB 공유라면 FSx for Windows.)
</details>

**Q6.** HPC/머신러닝에서 S3 데이터셋에 초고성능 병렬 파일시스템으로 접근하려 한다.

<details>
<summary>정답·해설</summary>

**FSx for Lustre.** 고성능 병렬 파일시스템이며 S3와 연동된다.
</details>

**Q7.** 전 세계 사용자에게 동영상·이미지 등 정적 콘텐츠를 낮은 지연으로 전달하려 한다.

<details>
<summary>정답·해설</summary>

**CloudFront.** 엣지 로케이션에 캐싱해 사용자 가까이에서 제공하고 오리진 부하를 줄인다.
</details>

**Q8.** 캐싱이 아니라 TCP 기반 게임 서버로 가는 트래픽을 전 세계에서 가속하고 고정 IP와 빠른 장애 조치를 원한다.

<details>
<summary>정답·해설</summary>

**Global Accelerator.** 애니캐스트 고정 IP와 AWS 백본으로 비캐싱 애플리케이션 트래픽을 가속한다. (콘텐츠 캐싱이면 CloudFront.)
</details>

**Q9.** 온프레미스와 AWS 사이에 일관된 저지연·고대역폭 전용 연결이 필요하다.

<details>
<summary>정답·해설</summary>

**Direct Connect.** 전용 물리 회선으로 일관된 성능을 제공한다. 즉시·저렴하게는 Site-to-Site VPN.
</details>

**Q10.** VPC가 수십 개로 늘어 VPC 간/온프레미스 연결이 복잡하다. 라우팅을 단순화하려면?

<details>
<summary>정답·해설</summary>

**Transit Gateway.** 허브 역할로 다수의 VPC와 온프레미스를 한 곳에서 연결·라우팅한다.
</details>

**Q11.** DynamoDB 읽기 지연을 마이크로초 수준으로 더 낮추고 싶다.

<details>
<summary>정답·해설</summary>

**DAX(DynamoDB Accelerator).** DynamoDB 전용 인메모리 캐시로 읽기를 가속한다.
</details>

**Q12.** 트래픽이 예측 불가하고 간헐적인 DynamoDB 테이블의 용량 모드는?

<details>
<summary>정답·해설</summary>

**온디맨드 용량 모드.** 사전 프로비저닝 없이 자동 확장하고 사용량만큼 과금한다. 예측 가능한 꾸준한 부하면 프로비전드가 저렴.
</details>

**Q13.** 관계형 DB의 읽기 트래픽이 급증한다. 쓰기는 그대로다.

<details>
<summary>정답·해설</summary>

**읽기 전용 복제본 추가.** 읽기를 분산한다. Aurora면 최대 15개까지, 읽기 복제본이 장애 조치 대상도 겸한다.
</details>

**Q14.** 반복되는 동일 쿼리와 세션 조회로 DB 부하가 크다. 지연과 부하를 함께 줄이려면?

<details>
<summary>정답·해설</summary>

**ElastiCache 캐싱.** 자주 읽는 결과를 인메모리에 두어 지연과 DB 부하를 동시에 줄인다. 복잡 자료구조·영속성은 Redis.
</details>

**Q15.** 리더보드, Pub/Sub, 영속성 있는 캐시가 필요하다. Redis인가 Memcached인가?

<details>
<summary>정답·해설</summary>

**Redis.** 고급 자료구조·영속성·복제·Pub/Sub를 지원한다. Memcached는 단순 멀티스레드 캐시로 이런 기능이 없다.
</details>

**Q16.** 수 TB 규모의 분석 쿼리(집계·리포팅)를 빠르게 돌려야 한다.

<details>
<summary>정답·해설</summary>

**Redshift.** 대규모 분석(OLAP) 웨어하우스다. 트랜잭션 처리(OLTP)에는 RDS/Aurora.
</details>

**Q17.** S3에 쌓인 로그를 서버 없이 **바로 SQL로** 조회하고 조회량만큼만 내고 싶다.

<details>
<summary>정답·해설</summary>

**Athena.** S3 데이터에 직접 SQL을 던지는 서버리스 쿼리 서비스로 쿼리당 과금한다.
</details>

**Q18.** 실시간 스트림을 **별도 처리 없이 S3로 자동 적재**하고 버퍼링·변환도 맡기고 싶다.

<details>
<summary>정답·해설</summary>

**Kinesis Data Firehose.** 관리형으로 스트림을 S3/Redshift/OpenSearch에 적재한다. 커스텀 실시간 처리가 필요하면 Data Streams.
</details>

**Q19.** 들어오는 스트림을 **순서대로 커스텀 로직으로 실시간 처리**하고 재처리도 해야 한다.

<details>
<summary>정답·해설</summary>

**Kinesis Data Streams.** 샤드 기반으로 순서·재처리·커스텀 소비가 가능하다.
</details>

**Q20.** CPU 집약적 배치 연산(렌더링·시뮬레이션)에 적합한 인스턴스 패밀리는?

<details>
<summary>정답·해설</summary>

**C 패밀리(컴퓨팅 최적화).** CPU 성능이 핵심인 워크로드에 맞다.
</details>

**Q21.** 대용량 인메모리 캐시/인메모리 DB를 돌릴 인스턴스 패밀리는?

<details>
<summary>정답·해설</summary>

**R/X 패밀리(메모리 최적화).** 메모리 용량·대역폭이 큰 워크로드에 적합하다.
</details>

**Q22.** HPC에서 노드 간 네트워크 지연을 최소화하려 한다.

<details>
<summary>정답·해설</summary>

**Cluster 배치 그룹.** 같은 AZ에 인스턴스를 밀집 배치해 저지연·고대역폭을 얻는다.
</details>

**Q23.** 소수의 중요한 인스턴스를 서로 다른 하드웨어에 분산해 동시 장애를 피하려 한다.

<details>
<summary>정답·해설</summary>

**Spread 배치 그룹.** 각 인스턴스를 별도 하드웨어에 배치해 상호 독립 장애를 만든다.
</details>

**Q24.** 중단돼도 되는 대규모 배치 작업의 컴퓨팅 비용을 최대한 낮추되 성능은 필요하다.

<details>
<summary>정답·해설</summary>

**Spot 인스턴스.** 유휴 용량을 큰 폭 할인으로 쓴다. 중단 가능하므로 내결함·재시작 가능한 작업에 적합하다.
</details>

**Q25.** 온프레미스에서 AWS로 매일 밤 대량 파일을 반복 전송·동기화해야 한다.

<details>
<summary>정답·해설</summary>

**DataSync.** 대량 데이터의 반복 전송·동기화를 자동화·가속한다. 일회성 초대용량은 Snowball.
</details>

**Q26.** 네트워크로 옮기기엔 수십 TB로 너무 크고 시간이 오래 걸리는 데이터를 AWS로 이전하려 한다.

<details>
<summary>정답·해설</summary>

**Snowball(Snow Family).** 물리 장치로 대용량 데이터를 오프라인 이전한다.
</details>

**Q27.** 먼 지역 사용자의 대용량 S3 업로드 속도를 높이려 한다.

<details>
<summary>정답·해설</summary>

**S3 Transfer Acceleration.** 엣지 로케이션을 경유해 장거리 업로드를 가속한다.
</details>

**Q28.** 큰 객체에서 필요한 일부 행·열만 가져와 전송량과 처리 시간을 줄이려 한다.

<details>
<summary>정답·해설</summary>

**S3 Select.** 객체 내부를 SQL로 필터링해 필요한 부분만 반환한다.
</details>

**Q29.** 부하가 크게 출렁이는 관계형 워크로드에 용량을 자동으로 맞춰 성능과 효율을 함께 얻고 싶다.

<details>
<summary>정답·해설</summary>

**Aurora Serverless v2.** 부하에 따라 용량을 자동 조절한다.
</details>

**Q30.** 평소 CPU가 낮고 가끔만 튀는 소형 웹 서버에 비용 효율적인 인스턴스는?

<details>
<summary>정답·해설</summary>

**T 패밀리(버스터블).** 평소 낮게 쓰다 크레딧으로 순간 급증을 처리한다.
</details>

**Q31.** 과·소 프로비저닝된 EC2/볼륨을 지표 기반으로 교정하려 한다.

<details>
<summary>정답·해설</summary>

**Compute Optimizer**의 right-sizing 권고를 활용한다. 실제 사용 지표로 적정 유형을 제안한다.
</details>

**Q32.** 정적 웹사이트 자산 + 동적 API를 한 도메인에서 전 세계에 빠르게 제공하려 한다.

<details>
<summary>정답·해설</summary>

**CloudFront.** 정적·동적 콘텐츠 모두 가속하며 S3·ALB 등 여러 오리진을 묶을 수 있다.
</details>

**Q33.** S3 요청 처리량이 한 접두사에 몰려 병목이다.

<details>
<summary>정답·해설</summary>

**키(접두사)를 분산**한다. S3는 접두사별로 요청 처리량이 선형 확장되므로 키 설계로 병렬성을 높인다.
</details>

**Q34.** OLTP(실시간 트랜잭션)에 Redshift를 쓰면 왜 부적합한가?

<details>
<summary>정답·해설</summary>

**Redshift는 분석(OLAP) 전용**으로 대량 집계에 최적화돼 있고, 빈번한 소규모 트랜잭션에는 맞지 않는다. OLTP는 RDS/Aurora/DynamoDB.
</details>
