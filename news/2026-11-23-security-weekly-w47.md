---
title: 주간 보안 브리핑 2026-W47 (11월 16일 ~ 11월 22일)
description: 중국 연계 그룹의 vCenter 제로데이 등 KEV 9건과 사흘 기한, OpenJDK Base64 결함 Java4Shell, Microsoft agent-framework PyPI 탈취와 Optimizely 스크립트 변조, 한국전력 152만 건 유출 등 11월 셋째 주 보안 이슈 정리
authors: [inseok]
toc_max_heading_level: 2
tags: [weekly, security, vulnerability, incident, ot, ai, cloud, supply-chain]
---

CISA는 vCenter 제로데이와 Cisco Expressway, Apache Roller 등 9건을 KEV에 올렸고 11월 20일 등재분 4건에는 사흘 기한을 걸었다.
공급망에서는 Microsoft의 AI 에이전트 프레임워크가 PyPI에서 두 차례 변조됐고, Optimizely가 배포하는 스크립트를 통해 178개 조직 사이트에 스키머가 실렸다. 국내에서는 한국전력이 152만 건 유출을 확인했다.

{/* truncate */}

:::info[대상 기간]
2026-11-16(월) \~ 2026-11-22(일), KST · ISO 2026-W47

공개 날짜가 이 기간 안에 있는 것만 넣었다. 사건 자체는 이전에 일어났지만 원인이나 새 사실이 이번 주에 처음 공개된 건은 그렇다고 따로 적었다. KEV 등재일과 기한은 CISA가 쓰는 미국 날짜다.
:::

## 이번 주 한눈에 보기

1. **vCenter 제로데이와 사흘 기한**: CISA는 11월 17일\~20일 KEV에 9건을 올렸다. 11월 20일 등재된 vCenter 인증 우회(중국 연계 ARMORY CASTLE이 9월부터 제로데이로 사용), Cisco Expressway, Apache Roller, SAP NetWeaver는 기한이 11월 23일이었다.
2. **공식 패키지와 서드파티 스크립트가 침투 경로가 됐다**: Microsoft `agent-framework` 1.26.1·1.26.2가 PyPI에 올라가 45분가량 클라우드·CI 자격증명을 훔쳤다. Optimizely 가입 절차 결함으로 178개 조직 사이트에 카드 스키머와 암호화폐 주소 바꿔치기 코드가 실렸다.
3. **AI가 공격 도구이자 발견 도구가 됐다**: Google은 패치 diff로 n-day 익스플로잇을 스스로 만들고 실행하는 공격자 프레임워크 `exploit_agent`를 보고했다. 같은 주 공개된 OpenJDK 결함 Java4Shell은 연구자가 AI 코딩 에이전트로 200달러 미만에 찾아냈다.

## 일반 보안

### CISA KEV 신규 9건, 11월 20일 등재분은 사흘 기한 (11/17 \~ 11/20)

11월 17일에는 Puppet Server 역직렬화 RCE가 올라갔다. 정상 에이전트 인증서만 있으면 조작한 보고서로 서버 계정 권한 코드를 실행할 수 있고, CA 자동 서명이 켜져 있으면 인증 없는 공격자도 가능하다.
11월 18일에는 Synology DSM, Vanderbilt REDCap, Apache Axis 1.x, LiteLLM이 올라갔다. REDCap은 공개 설문 경로로 웹셸을 올리고 XMRig를 심은 사례가, Axis 1.x는 Rapid7이 N-able N-central 공격과 함께 Confluence Data Center를 노린 사례를 보고했다.
11월 20일에는 vCenter, Cisco Expressway, Apache Roller, SAP NetWeaver가 올라갔다(아래 항목).
Synology 결함은 THN이 C3RB3R 랜섬웨어 공격과 연결했지만, KEV의 랜섬웨어 사용 표시는 9건 모두 확인되지 않음이다.

- **왜 중요한가**: 9건 중 7건이 기한 사흘이다. 지원이 끝난 Axis 1.x처럼 패치가 없는 항목은 자산 목록에서 찾아 걷어 내는 것 말고 방법이 없다.
- **CVE / CVSS / KEV**: CVE-2026-115731 (Puppet 역직렬화, CSA 기준 v4.0 9.4) / KEV 11/17, 기한 12/01 · CVE-2024-10441 (Synology DSM, 9.8) · CVE-2026-90817 (REDCap 코드 주입, 9.8) · CVE-2026-90436 (Apache Axis 1.x 안전하지 않은 리플렉션, 9.8, 패치 없음) / KEV 11/18, 기한 11/21 · CVE-2026-40217 (LiteLLM, 8.8) / KEV 11/18, 기한 12/02. 점수는 보도 기준이고 출처가 명시되지 않았다
- **출처**: [Security Affairs (Puppet)](https://securityaffairs.com/203377/hacking/u-s-cisa-adds-perforce-puppet-enterprise-flaw-to-its-known-exploited-vulnerabilities-catalog.html) · [The Hacker News (11/18 등재 4건)](https://thehackernews.com/2026/11/cisa-warns-of-4-exploited-flaws-linked.html) · [CSA 연구 노트 (Puppet)](https://labs.cloudsecurityalliance.org/research/csa-research-note-puppet-cve-2026-115731-kev-20261122-csa-st) · [CISA kev-data (GitHub)](https://github.com/cisagov/kev-data)

### vCenter 인증 우회를 9월부터 제로데이로, Cisco Expressway·Apache Roller도 악용 (11/20 \~ 11/21)

vCenter의 VMware Directory Service에서 대체 경로로 인증을 건너뛰는 결함이다. Google GTIG와 Mandiant는 중국 연계로 보이는 ARMORY CASTLE(옛 UNC5221)이 9월 초부터 패치 전에 썼다고 밝혔다.
공격자는 BONESAW라는 도구로 vCenter 데이터를 빼고 SAML STS를 가로채 관리자 계정을 만들었으며, BeyondTrust Remote Support 결함과 엮어 썼다.
Cisco Expressway는 하드코딩된 자격증명으로 클러스터 장비에서 root 명령을 실행할 수 있고, F6는 공개 PoC 이후 러시아 조직이 당했다고 보고했다. Apache Roller는 XML-RPC 엔드포인트가 인증 전에 역직렬화를 해 인증 없이 RCE가 된다.
SAP NetWeaver Enterprise Portal JNDI 주입은 2025년 11월에 고친 결함으로, 공개된 공격 보고는 없다.

- **왜 중요한가**: 가상화 관리 서버는 한 번 뚫리면 그 위의 모든 VM이 노출된다. SAML STS 탈취는 패치 후에도 남을 수 있어 관리자 계정과 토큰 서명 인증서를 다시 점검해야 한다.
- **CVE / CVSS / KEV**: CVE-2026-123890 (vCenter 인증 우회, 9.8) · CVE-2026-76466 (Cisco Expressway 하드코딩 자격증명, 9.8) · CVE-2026-129448 (Apache Roller 역직렬화, 9.8, 4.0.0\~6.1.4) · CVE-2025-42884 (SAP NetWeaver JNDI 주입, 6.5) / 모두 KEV 11/20, 기한 11/23. 함께 쓰인 BeyondTrust CVE-2026-102764는 THN 기준 9.3
- **출처**: [The Hacker News](https://thehackernews.com/2026/11/hackers-exploit-critical-vmware-cisco.html) · [Security Affairs](https://securityaffairs.com/203639/security/u-s-cisa-adds-cisco-expressway-sap-netweaver-broadcom-vmware-vcenter-and-apache-roller-flaws-to-its-known-exploited-vulnerabilities-catalog.html)

### Java4Shell: OpenJDK Base64 가속 디코더 메모리 손상 (CVE-2026-114938, 11/17)

AVX-512 VBMI를 지원하는 x86-64 CPU에서만 쓰이는 Base64 디코딩 고속 경로가 메모리를 잘못 다뤄, 특정 길이의 Base64 문자열만으로 메모리 유출이나 코드 실행이 가능하다.
OpenJDK 17.0.6 이후 빌드와 이를 기반으로 한 Oracle, Corretto, Temurin, Microsoft, Zulu, Red Hat 배포판이 모두 해당한다.
Calif 연구진은 Keycloak, Jira, Confluence, Artifactory, Jenkins, PingFederate 기본 설정에서 인증 전 RCE를 시연했다. 다만 범용 익스플로잇은 없고 앱마다 Base64를 전달할 경로가 필요하다.
Oracle은 11월 17일 정기 패치(CPU)에서 고쳤고, 임시 완화책은 `-XX:-UseBASE64Intrinsics` 옵션이다.

- **왜 중요한가**: 앱 코드가 아니라 런타임 결함이라 SCA 도구가 앱 의존성만 보면 놓친다. ARM64 서버는 영향이 없어 CPU 종류까지 자산 목록에 있어야 판단할 수 있다.
- **CVE / CVSS / KEV**: CVE-2026-114938 (메모리 손상, Calif v4.0 9.2 · Oracle v3.1 8.1로 출처마다 다르다). 수정: 17.0.21.1, 21.0.13.1, 25.0.5.1 / 미등재, 실제 악용 보고 없음(CSA는 GreyNoise가 시도를 관측했다고 전했다)
- **출처**: [BleepingComputer](https://www.bleepingcomputer.com/news/security/critical-java4shell-flaw-allows-rce-attacks-on-major-java-applications/) · [Keycloak](https://www.keycloak.org/2026/11/java4shell-vulnerability-cve-2026-114938) · [CSA CISO 브리핑 (11/19)](https://labs.cloudsecurityalliance.org/research/alt-ciso-briefing-2026-11-19/)

### 한국전력 152만 건, 노란우산 약 20만 명 개인정보 유출 확인 (11/18, 11/22)

한국전력은 11월 20일 외부 불법 접근 시도를 탐지해 IP를 막고 서비스를 멈췄고, 11월 22일 두 시스템에서 유출을 확인했다.
고객 서비스 한전ON에서 65만여 명(주민·외국인등록번호, 연락처, 주소, 계좌·카드번호 등), 전자조달 SRM에서 86만여 건(법인 대표자와 한전·협력사 직원)으로 합계 약 152만 건이며 중복이 있을 수 있다.
데일리시큐는 11월 19일 다크웹에 한전 데이터 판매 글이 올라왔다고 처음 보도했다. 경찰 수사와 국정원 협력이 진행 중이다.
중소기업중앙회 노란우산은 11월 14일 개인정보보호위원회에 약 20만 5천 명(이름, 주민번호 앞 7자리, 연락처, 주소, 이메일) 유출을 신고했다(보안뉴스 11/18). 다른 매체는 36만 명으로 보도해 숫자가 아직 일치하지 않는다.

- **왜 중요한가**: 공공기관 조달 시스템의 협력사 직원 정보는 공급망 표적 피싱의 재료가 된다. 두 건 모두 공격 경로와 원인은 공개되지 않았다.
- **CVE / KEV**: 공개된 CVE 없음
- **출처**: [데일리시큐 (한국전력)](https://www.dailysecu.com/news/articleView.html?idxno=209657) · [보안뉴스 (노란우산)](https://www.boannews.com/news/articleView.html?idxno=147355)

:::note[기타 일반 보안 (11/16 \~ 11/22)]
- 블랙다이아몬드 코리아: 외부 통합 ERP(주문·배송) 업체 서버에 비정상 접근이 있어 이름, 연락처, 배송지, 주문 내역 노출 가능성을 안내했다. 택배 사칭 문자를 주의하라고 했다(11/22). [보안뉴스](https://www.boannews.com/news/articleView.html?idxno=147428)
- 랜섬웨어 수사: INC·Lynx와 연계된 8-Digits Team 조직원이 이탈리아에서 미국으로 인도됐다(요구 몸값 합계 5억 달러 이상). 우크라이나와 FBI는 석유·가스, 제약, 제조 등 28개 기업에서 4,050만 달러를 뜯은 그룹 용의자 4명을 체포했다(THN 정리, 11/19). [The Hacker News](https://thehackernews.com/2026/11/threatsday-gpt-62-jailbreak-flaws.html)
- 안랩은 김수키가 한글 이력서 문서로 Funhouse 랜섬웨어를 퍼뜨린 사례를 보고했다. ASEC 원문 게시일은 확인하지 못했고 THN 11/19 정리 기준이다.
- Infoblox: SharePoint 데이터 이전 업체를 통한 서드파티 침해, 규모 미공개(TechCrunch 11/16, THN 정리 재인용).
- 불가리아 정부 대상 5년간 간첩 활동으로 130GB가 빠져나갔다는 Reuters 보도(11/18, THN 정리 재인용).
:::

:::note[이번 주에서 뺀 항목]
- N-able N-central 4EverAble2Shell(CVE-2026-114406)과 Windows CLFS 제로데이 SignDrop은 THN 11/16 주간 정리에 실렸지만 원 공개가 지난주다. N-central 연계 공격은 Axis 1.x KEV 설명에만 적었다.
- Synology NAS C3RB3R 공격 원 보도(11/03), DreamHost·DigiCert 침해(11/05 정리)는 기간 밖이다.
- Ruby2Shell(CVE-2026-132825, Ruby 4.0.10·3.4.13·3.3.14 수정)은 SecurityWeek 기사 날짜를 확인하지 못해 뺐다.
- KEV는 11월 16일, 19일, 21일, 22일 신규 등재가 없었다(kev-data 2026.11.20판 기준).
:::

## OT/ICS · 제조 · 자동차

### Elecbrakes EB2·VM1 BLE 명령 주입과 재전송 공격 (ICSA-26-323-02, 11/19)

교통 시스템 분야로 분류된 Elecbrakes 브레이크 컨트롤러 EB2, VM1, ELBC2000에서 세 결함이 나왔다.
인증 없이 BLE로 명령을 주입할 수 있고, 정상 명령을 가로채 다시 보내는 재전송 공격도 막지 못하며, 펌웨어 업데이트 채널이 보호되지 않았다.
EB2 3.0.4.4.3과 VM1 1.3.4.2.1(7월 배포)에서 고쳤지만, 판매가 끝난 ELBC2000은 수정이 없다.

- **왜 중요한가**: 무선으로 제동 장치에 명령을 넣을 수 있는 결함이다. 차량 관련 기기는 단종 뒤에도 오래 쓰이는데 수정이 없는 모델이 남는다.
- **CVE / CVSS / KEV**: CVE-2026-96805 (BLE 명령 주입, v3.1 9.6) · CVE-2026-125273 (재전송, v3.1 9.6) · CVE-2026-124281 (보호 없는 펌웨어 업데이트 채널, v3.1 6.1) / 미등재
- **출처**: [CISA CSAF ICSA-26-323-02](https://github.com/cisagov/CSAF/tree/develop/csaf_files/OT/white/2026) · [Security Boulevard (Daily OT 11/20)](https://securityboulevard.com/2026/11/daily-ot-security-news-november-20-2026/)

### Dorsett Controls InfoScan 6건, 수처리 감시 소프트웨어 (ICSA-26-321-01, 11/17)

수처리 분야에서 쓰이는 InfoScan 1.45.0 이하에서 결함 6건이 나왔다.
가장 심각한 것은 Electron 클라이언트가 서버 인증서를 제대로 검증하지 않는 문제로, 중간자 공격에 쓰일 수 있다.
그 밖에 공개 설치 파일에 호스트 이름 노출, 저장된 DB 비밀번호를 하드코딩 키로 보호, 템플릿 엔드포인트 인증 누락, 인증 없는 정보 노출, 스택 트레이스 경로 노출이 있다. 1.46 이상에서 고쳤다.

- **왜 중요한가**: 하나하나는 중간 등급이지만 정찰, 자격증명 복호화, 중간자 공격으로 이어 붙일 수 있는 조합이다. 수처리 HMI 클라이언트의 인증서 검증은 점검 목록에서 빠지기 쉽다.
- **CVE / CVSS / KEV**: CVE-2026-117659 (인증서 검증 미흡, v3.1 8.1) · CVE-2026-120157 · CVE-2026-120255 · CVE-2026-120260 · CVE-2026-120271 · CVE-2026-120298 (v3.1 4.3\~5.5) / 미등재, CISA는 알려진 악용이 없다고 했다
- **출처**: [CISA CSAF ICSA-26-321-01](https://github.com/cisagov/CSAF/tree/develop/csaf_files/OT/white/2026)

### libumqtt 정수 언더플로, 관리자 응답 없어 수정 없음 (ICSA-26-323-03, 11/19)

임베디드 기기용 경량 MQTT 클라이언트 라이브러리 libumqtt 1.1.1 이하에서 정수 언더플로가 나왔다.
네트워크에서 인증 없이 건드릴 수 있고 주로 서비스 거부를 일으킨다.
CISA는 관리자가 연락에 응답하지 않아 수정이 없다고 밝혔고, 영향 분야로 제조, 에너지, 교통, 수처리를 적었다.

- **왜 중요한가**: 펌웨어 안에 묻힌 오픈소스 라이브러리는 SBOM이 없으면 쓰는지조차 모른다. 관리가 끊긴 컴포넌트는 기기 벤더가 직접 고치거나 교체해야 한다.
- **CVE / CVSS / KEV**: CVE-2026-125132 (정수 언더플로, v3.1 8.6) / 미등재
- **출처**: [CISA CSAF ICSA-26-323-03](https://github.com/cisagov/CSAF/tree/develop/csaf_files/OT/white/2026)

### CISA, Siemens 11월 정기 권고 재게시: Node2Shell·NTLM 릴레이·Mendix MCP (ICSA-26-321-02 \~ 11, 11/17)

CISA는 Siemens가 11월 10일(일부는 10월 13일) 낸 권고를 11월 17일 한꺼번에 다시 게시했다.
WinCC·BRAUMAT·SISTAR와 Opcenter·Teamcenter의 Node2Shell(321-03, 321-04), PCS 7·WinCC NTLM 릴레이(321-08), Mendix Studio Pro MCP 서버 외부 노출(321-05), WinCC Graphics Designer 활성 콘텐츠 실행(321-09), IOT2050 명령 주입(321-11) 등이다.
내용은 W46에서 다뤘고, 대부분 수정이 없어 Brotli 압축 끄기와 SQL Server 통신 암호화 같은 완화책이 중심이다.

- **왜 중요한가**: 미국 제조·에너지 운영자가 기준으로 삼는 CISA 권고에 오르면서 점검 대상이 넓어졌다. 수정 없는 항목이 많아 완화 설정의 실제 적용 여부를 확인해야 한다.
- **CVE / CVSS / KEV**: CVE-2026-111497 (Node2Shell, v3.1 9.8) / KEV 등재 (2026-10-27) · CVE-2026-58114 (NTLM 약한 인증, v3.1 7.5) · CVE-2026-112136 (Mendix MCP 서버 IP 바인딩, v3.1 8.8) / 미등재
- **출처**: [CISA CSAF (OT 2026)](https://github.com/cisagov/CSAF/tree/develop/csaf_files/OT/white/2026) · [CISA ICSA-26-321-03](https://www.cisa.gov/news-events/ics-advisories/icsa-26-321-03)

:::note[기타 OT · 제조 · 자동차 (11/16 \~ 11/22)]
- 자동차: PCA Cyber Security가 VW ID.4의 블루투스 소프트웨어에서 비밀번호 없는 관리자 계정을 찾아 공조, 와이퍼, 선루프 조작과 eCall 대화 녹음, 연결된 휴대폰 문자·연락처 접근을 실험실에서 시연했다. VW는 안전 위험은 없다고 했다. 원 보도는 The Times 11/15(기간 직전)이고 WardsAuto 후속 보도가 11/19다. CVE는 없다. [WardsAuto](https://wardsauto.com/news/volkswagen-id4-hack-exposes-bluetooth-security-risks/875008)
- Siemens .NET Client Library for SIMATIC S7 Webserver API 경로 탐색(CVE-2026-85114, v3.1 7.5, V3.3.61 수정)도 ICSA-26-321-02로 재게시됐다. 원 공개는 10월 13일이다.
- 제조업 랜섬웨어: 우크라이나·FBI가 체포한 그룹의 피해 28곳에 제조·물류 기업이 포함됐다(일반 보안 참고).
:::

:::note[이번 주에서 뺀 항목]
- ForgeRock 기본 비밀번호로 완성차 2곳의 차량 원격 제어가 가능했던 연구(THN 11/09)는 W46에서 다뤘다.
- Danfoss AK-SM 800A 냉동 컨트롤러 제로데이(11/3)와 Copeland XWEB EVO 탐색 공격(THN 11/16 정리)은 원 공개가 기간 밖이거나 날짜를 확인하지 못했다.
- OpenPLC Runtime 권고(ICSA-26-323-01로 알려짐)는 2차 출처에서만 봤고 CISA 원문을 열지 못해 뺐다.
- Rockwell, Schneider, ABB, Mitsubishi의 기간 내 신규 권고는 찾지 못했다.
:::

## AI 보안

### Google, 패치를 읽고 익스플로잇을 스스로 만드는 공격자 프레임워크 `exploit_agent` 보고 (11/16 \~ 11/17)

GTIG와 Mandiant는 공격자의 노출된 스테이징 서버에서 여러 LLM에 연결된 다중 에이전트 프레임워크를 찾았다.
보안 패치의 코드 변경을 분석해 n-day를 찾고, 익스플로잇을 작성해 실행하는 과정을 단계마다 사람 지시 없이 돌린다. 운영자는 이를 시범 운영이라고 불렀고 성공률은 보고되지 않았다.
서버에서는 프랑스 미디어·교육 사이트에서 빼낸 데이터도 나왔지만, 그 탈취를 이 프레임워크가 했는지는 확인되지 않았다.
보고서는 CAIRN, PentAGI, ARTEX 등 다른 AI 공격 프레임워크 사용도 함께 정리했다.

- **왜 중요한가**: 패치 공개부터 익스플로잇까지의 시간이 더 줄어든다는 뜻이다. 사흘짜리 KEV 기한이 늘어나는 흐름과 같은 방향이다.
- **CVE / KEV**: 해당 없음
- **출처**: [CSO Online](https://www.csoonline.com/article/4249595/google-spots-the-first-hacker-ai-system-that-finds-and-exploits-flaws-autonomously.html) · [CSA CISO 브리핑 (11/19)](https://labs.cloudsecurityalliance.org/research/alt-ciso-briefing-2026-11-19/)

### 악성 웹페이지 하나로 Meta Muse 에이전트 장악, 대화와 기억까지 (11/20 \~ 11/21)

보안업체 NebuSec은 Meta의 개인 AI 에이전트 Muse가 악성 페이지를 열면 승인 창 없이 대화 기록과 저장된 기억을 외부로 보내고 바꿀 수 있음을 실험실에서 보였다.
여기에 Muse 내장 브라우저 결함과 리눅스 커널 결함을 엮어 사용자별 클라우드 머신 전체를 장악했고, 자격증명 저장소와 감시 모듈까지 닿았다. 공유 호스트나 다른 사용자 머신에는 닿지 않았다.
NebuSec은 공개 전에 모두 고쳐졌다고 했지만 Meta는 공식 확인을 하지 않았다.

- **왜 중요한가**: 간접 프롬프트 인젝션이 정보 유출에서 끝나지 않고 샌드박스 탈출과 엮여 실행 환경 장악으로 이어졌다. 에이전트 브라우저는 일반 브라우저 수준의 격리가 필요하다.
- **CVE / KEV**: CVE 미부여
- **출처**: [The Hacker News](https://thehackernews.com/2026/11/a-single-malicious-webpage-let.html)

### LiteLLM 결함 KEV 등재, LLMjacking에 사용 (CVE-2026-40217, 11/18)

LiteLLM의 `/guardrails/test_custom_code` 경로에서 바이트코드를 고쳐 코드 실행 제한을 우회할 수 있는 결함이 KEV에 올랐다.
GTIG에 따르면 공격자는 사용량이 제한된 추론 키를 전체 관리자 권한으로 올리고 지속성을 만들어, 남북미와 아태 지역의 금융·유통·교통·IT 조직을 상대로 LLMjacking을 벌였다.
LiteLLM은 6월에도 다른 결함(CVE-2026-42271)이 KEV에 오른 적이 있다.

- **왜 중요한가**: AI 게이트웨이는 여러 모델 공급자의 키를 한곳에 모아 둔다. 게이트웨이 하나가 뚫리면 모든 상위 API 키와 비용이 함께 넘어간다.
- **CVE / CVSS / KEV**: CVE-2026-40217 (보호되지 않은 대체 채널, 8.8, 점수 출처 미명시) / KEV 11/18, 기한 12/02
- **출처**: [The Hacker News](https://thehackernews.com/2026/11/cisa-warns-of-4-exploited-flaws-linked.html)

### 영국 AISI, 출시 전 GPT-6.2 Astra 범용 탈옥 성공 · EU 집행위, AI 활용 공격 확인 (11/19 \~ 11/20)

OpenAI는 GPT-6.2 Astra와 Sol을 자사 기준에서 사이버 능력 Critical로 분류했고, 영국 AI 보안연구소(AISI)는 출시 전 Astra에 대한 범용 탈옥을 만들었다. OpenAI는 해당 회귀를 고쳤다고 했다.
EU 집행위원회는 10월 22일 탐지한 공격에 AI 도구가 쓰였다고 11월 20일 확인했다. 인사(Sysper), 의료비 정산, 번역 시스템이 열흘 넘게 멈췄고, 직원 정보 유출 증거와 공격 주체는 밝혀지지 않았다.
CERT-EU는 그 약 2주 전 ARTEX AI 침투 테스트 프레임워크에 대해 경고했었다.

- **왜 중요한가**: 독립 평가기관의 출시 전 레드팀이 실제로 안전장치 회귀를 잡아낸 사례다. EU 기관 공격은 AI 활용 공격이 공공 서비스 중단으로 이어진 공식 확인 사례가 됐다.
- **CVE / KEV**: 해당 없음
- **출처**: [The Hacker News (THN 정리)](https://thehackernews.com/2026/11/threatsday-gpt-62-jailbreak-flaws.html) · [SecurityWeek](https://www.securityweek.com/european-commission-confirms-ai-assisted-cyberattack-disrupted-services/)

:::note[기타 AI 보안 (11/16 \~ 11/22)]
- Microsoft의 AI 에이전트 프레임워크 `agent-framework` PyPI 변조는 공급망 영역에 적었다. Microsoft는 조사 중 `agent-framework`와 `onnxruntime` GitHub 저장소를 비공개로 돌렸다.
- Java4Shell은 연구자가 OpenAI Codex로 OpenJDK 내부를 감사하다 약 1시간 만에 찾고 2시간 만에 첫 익스플로잇을 만들었다고 Calif가 밝혔다(AI 사용 비용 200달러 미만). [BleepingComputer](https://www.bleepingcomputer.com/news/security/critical-java4shell-flaw-allows-rce-attacks-on-major-java-applications/)
- Google은 Gemini 채팅 보관 기간을 약 2개월로 늘리는 정책을 냈고(11/17), Reuters는 중국의 미국 모델 증류(distillation)를 보도했다(11/17). [The Hacker News](https://thehackernews.com/2026/11/threatsday-gpt-62-jailbreak-flaws.html)
:::

:::note[이번 주에서 뺀 항목]
- Check Point의 Codex 탈옥 도구 속 "프롬프트 애드웨어"(11/04)와 DeepSeek 탈옥 에이전트의 유럽 통신사 침해 Operation Snowball(11/09)은 기간 밖이다.
- Adversa의 11월 MCP·코딩 에이전트 정리(11/02, 11/09)에 실린 권고는 모두 지난 공개분이다. 이번 주 새 MCP 서버 CVE는 찾지 못했다.
- GTIG AI Threat Tracker 검색 결과 중 Google Cloud 블로그 글은 5월 11일 게시라 근거로 쓰지 않았다.
:::

## 소프트웨어 공급망 보안

### Microsoft `agent-framework` PyPI 1.26.1·1.26.2, 45분간 클라우드·CI 자격증명 탈취 (11/18 KST)

Microsoft Agent Framework의 메타 패키지에 악성 버전 두 개가 33분 간격으로 올라갔다(UTC 11월 17일 20:35·21:08, KST 11월 18일 05:35·06:08). 21:20 UTC께 둘 다 내려갔다.
악성 코드는 `.pth` 시작 훅에 들어 있어 패키지를 import하지 않아도 pip를 포함한 모든 파이썬 실행 때 돈다. 1.26.2는 정상 1.26.0을 의존성으로 끌어와 기능도 정상처럼 보였다.
환경 변수와 다른 프로세스의 환경, `~/.azure`·`.npmrc`·`.git-credentials` 같은 자격증명 파일, IMDS를 통한 Azure 관리 ID 토큰을 모았고, 1.26.2는 GitHub Actions OIDC 토큰까지 노렸다. 수집물은 압축·인코딩해 webhook.site로 보냈다.
게시 권한을 어떻게 얻었는지는 확인되지 않았다. SafeDep은 11월 17일 만들어진 공동 관리자 계정을, OX Security는 Microsoft 공식 게시 계정을 지목해 출처마다 다르다.

- **왜 중요한가**: 월 19만\~19만 6천 회 받는 공식 벤더 패키지가 한 시간도 안 되는 노출로 CI 러너와 클라우드 토큰을 노렸다. 의존성 고정과 함께 새 버전 공개 직후 일정 시간은 받지 않는 정책이 실제 효과가 있다.
- **CVE / KEV**: 해당 없음. 지표: `agent_framework_meta.pth`, `af_runtime_diag.pth`, `af_runtime_diag.py`, User-Agent `af-runtime-diagnostics/1`·`runtime-diagnostics/1`, `webhook[.]site` 경로 `d381fd80-ec62-42ad-8f5c-d1b15103c9bb`. 1.26.0으로 고정하고 설치 이력이 있으면 모든 자격증명을 교체
- **출처**: [SafeDep](https://safedep.io/blog/microsoft-agent-framework-pypi-compromise) · [Aikido](https://www.aikido.dev/blog/two-malicious-agent-framework-releases-hit-pypi-in-33-minutes) · [Elastic Security Labs](https://www.elastic.co/security-labs/threat-command/we-caught-the-agent-framework-pypi-compromise-six-minutes-after-it-published) · [The Register](https://www.theregister.com/security/2026/11/18/microsofts-official-python-agent-framework-hijacked-to-distribute-malware/5310858) · [The Hacker News](https://thehackernews.com/2026/11/attackers-compromise-microsofts-agent.html)

### OPTIMJACK: Optimizely 스크립트로 178개 조직 사이트에 스키머와 암호화폐 주소 바꿔치기 (11/16 \~ 11/18)

공격자는 Optimizely Experimentation 가입 절차의 결함으로 고객 계정을 사칭해 고객 프로젝트에 악성 자바스크립트를 넣었다.
Report URI의 Scott Helme는 1,611개 스크립트 중 178개 조직의 188개가 감염됐다고 집계했고, CNN, BBC, Fox News, Salesforce, GitLab, Zoom 등이 포함됐다. 첫 주입은 11월 16일 04:21 UTC였고 같은 날 23:11 UTC까지 모두 정리됐다.
약 30KB 페이로드는 암호화폐 주소 바꿔치기, 카드 스키밍, 스크린샷·쿠키 탈취를 하고, iOS 방문자에게는 Coruna·DarkSword 익스플로잇 킷을 불렀다.
Optimizely는 자격증명 유출이 아니며 고객 5% 미만이 영향을 받았다고 했다. 피해 금액은 약 7,000달러(BleepingComputer)와 약 2,300달러(Galaxy Digital) 추정이 갈린다.

- **왜 중요한가**: 사이트가 직접 뚫리지 않아도 서드파티 스크립트 하나로 결제 페이지가 오염된다. SRI 고정이 어려운 동적 스크립트는 CSP와 스크립트 변경 감시가 현실적인 방어선이다.
- **CVE / KEV**: 해당 없음. 지표: `1688360[.]cc/track.js`, 유출 경로 `/card.php`·`/hit.php`
- **출처**: [BleepingComputer](https://www.bleepingcomputer.com/news/security/optimizely-supply-chain-attack-delivers-malware-to-cnn-fox-news-bbc-salesforce-sites/) · [StepSecurity](https://www.stepsecurity.io/blog/optimjack-optimizely-hosted-scripts-crypto-clipper-card-skimmer)

### 지원 끝난 오픈소스가 KEV로: Apache Axis 1.x와 libumqtt (11/18 \~ 11/19)

Apache Axis 1.x는 조작한 SOAP fault로 공격자가 고른 클래스를 만들게 하는 결함이 실제 악용돼 KEV에 올랐다. 지원 종료라 공식 패치가 없고 Axis2로 옮기거나 7월 12일 커밋을 넣어 직접 빌드하는 수밖에 없다.
Rapid7은 Confluence Data Center 안의 Axis를 노린 공격에서 공격자가 DB를 조회하고 자격증명을 찾은 뒤, 약 12시간 뒤 서비스 계정으로 Microsoft 365에 레거시 인증 로그인을 했다고 보고했다.
같은 주 CISA ICS 권고의 libumqtt도 관리자가 응답하지 않아 수정이 없다.

- **왜 중요한가**: 상용 제품 안에 묻힌 지원 종료 라이브러리는 벤더가 고치기 전까지 사용자가 손쓸 수 없다. SBOM에서 EoL 컴포넌트를 따로 표시해 두는 것이 출발점이다.
- **CVE / CVSS / KEV**: CVE-2026-90436 (Axis 1.x 안전하지 않은 리플렉션, 9.8) / KEV 11/18, 기한 11/21 · CVE-2026-125132 (libumqtt, v3.1 8.6) / 미등재
- **출처**: [The Hacker News](https://thehackernews.com/2026/11/cisa-warns-of-4-exploited-flaws-linked.html) · [CISA CSAF ICSA-26-323-03](https://github.com/cisagov/CSAF/tree/develop/csaf_files/OT/white/2026)

:::note[기타 공급망 (11/16 \~ 11/22)]
- Puppet Server RCE(CVE-2026-115731)는 설정 관리 서버가 전체 서버군의 배포 통로라는 점에서 공급망 위험이기도 하다. 수정은 Puppet Enterprise 2023.8.13, 2025.12.1, 2026.0.1이고 Puppet Core 8.x 수정 버전은 8.22.1과 8.22.2로 출처마다 다르다. [CSA 연구 노트](https://labs.cloudsecurityalliance.org/research/csa-research-note-puppet-cve-2026-115731-kev-20261122-csa-st)
- WordPress 7.1.5 보안 릴리스, ReversingLabs의 BubbleLoader(정상 PE에 PNG를 덧대는 로더) 보고가 THN 11/19 정리에 실렸다. [The Hacker News](https://thehackernews.com/2026/11/threatsday-gpt-62-jailbreak-flaws.html)
:::

:::note[이번 주에서 뺀 항목]
- TanStack npm 웜(5/11), node-ipc(5/14), Microsoft durabletask PyPI(5/20)는 검색에 함께 걸렸지만 기간 밖이다.
- `@ethersphere/bee-js` 13.3.0은 W46에서 다뤘다.
:::

## 깊게 파볼 주제

### 주제 1. Java4Shell: CPU 명령어 하나에 걸린 런타임 결함이 어떻게 인증 전 RCE가 되는가

**추천 이유**

- 앱 코드가 아니라 JIT 내장 함수(intrinsic)의 메모리 처리 실수가 Keycloak, Jira, Jenkins 같은 앱의 인증 전 RCE로 이어지는 과정을 따라갈 수 있다. 같은 바이트코드가 CPU 기능에 따라 다른 기계어로 돈다는 점을 이해하기 좋다.
- AI 코딩 에이전트로 1시간 만에 찾았다는 발견 과정, CVSS v4 9.2와 v3.1 8.1이 갈린 이유, 앱마다 다른 전달 경로까지 함께 정리할 거리가 많다.

**무엇을 보면 좋을지**

- 패치 diff: OpenJDK 17.0.21.1·21.0.13.1·25.0.5.1에서 HotSpot의 AVX-512 VBMI Base64 디코드 스텁이 어떻게 바뀌었는지 본다.
- PoC 공개 여부: Calif가 메모리 손상 PoC는 공개했고 앱별 무기화 익스플로잇은 공개하지 않았다. 이번 주 기준 Vulhub 환경은 확인하지 못했다.
- 확인 실습: `jcmd`로 `UseBASE64Intrinsics` 값을 확인하고, `-XX:-UseBASE64Intrinsics`나 `-XX:UseAVX=2`를 줬을 때 PoC가 더는 손상을 일으키지 않는지 비교한다. 서버 CPU에 `avx512vbmi` 플래그가 있는지 찾는 인벤토리 스크립트도 써 본다.

:::warning
PoC는 반드시 격리된 로컬 랩에서만 돌린다. 공개 코드는 먼저 읽어 본 뒤 외부와 끊긴 가상 머신에서만 실행하고, 다른 사람의 서비스에는 어떤 시도도 하지 않는다. 실습 원칙은 [AI 취약점 진단 실습](/lab/ai-pentest/approach-and-ethics)을 따른다.
:::

**관련 개념**

- MITRE ATT&CK: T1190 (Exploit Public-Facing Application), T1203 (Exploitation for Client Execution)
- CWE-787 (Out-of-bounds Write), JIT intrinsic, CPU 기능별 코드 경로, 런타임 의존성과 SCA의 사각지대

### 주제 2. agent-framework와 `.pth` 시작 훅: import 없이 실행되는 파이썬 악성 패키지를 탐지하기

**추천 이유**

- 파이썬은 `site-packages`의 `.pth` 파일에서 `import`로 시작하는 줄을 인터프리터가 뜰 때마다 실행한다. 이 정상 기능 하나로 설치 스크립트 없이도 지속성과 실행을 얻는 구조를 직접 확인할 수 있다.
- 6분 만에 잡은 Elastic, 15분대에 잡은 SafeDep의 탐지 방식과 공개된 해시·파일명·쿼리가 있어 탐지 규칙을 만들고 검증하기 좋다.

**무엇을 보면 좋을지**

- 공개된 1.26.0과 악성 wheel의 파일 목록 차이(SafeDep 표, Aikido의 재패킹 흔적 분석)를 비교한다.
- 내 환경 점검: `site-packages` 아래 `.pth` 파일 중 `import`로 시작하는 줄을 모두 뽑고, 알려진 정상 파일(예: 편집 설치용 파일)과 구분하는 스크립트를 써 본다.
- 탐지 규칙: Elastic이 공개한 파일 생성·DNS 쿼리를 참고해 CI 러너에서 `webhook.site` 같은 범용 수집 서비스로 나가는 연결을 잡는 규칙을 만든다. 새 버전 공개 후 일정 시간 설치를 막는 패키지 관리자 설정도 확인한다.

:::warning
악성 wheel은 실행하지 않는다. 구조 실습은 직접 만든 무해한 `.pth` 파일로, 실제 자격증명이 없는 격리된 로컬 랩에서만 한다. 실습 원칙은 [AI 취약점 진단 실습](/lab/ai-pentest/approach-and-ethics)을 따른다.
:::

**관련 개념**

- MITRE ATT&CK: T1195.002 (Compromise Software Supply Chain), T1546.018 (Event Triggered Execution: Python Startup Hooks), T1552.005 (Cloud Instance Metadata API), T1567 (Exfiltration Over Web Service)
- `.pth` 처리, Trusted Publishing, OIDC 토큰 교환, 공개 직후 설치 지연(cooldown)

## 이번 주 키워드

| 키워드 | 한 줄 설명 |
|---|---|
| **Java4Shell** | OpenJDK의 AVX-512 Base64 디코더 메모리 손상 CVE-2026-114938. 특정 x86-64 CPU에서만 발현되며 여러 Java 앱의 인증 전 RCE로 이어진다. |
| **`.pth` 시작 훅** | 파이썬이 시작할 때 자동 실행하는 경로 설정 파일. agent-framework 악성 버전이 import 없이 실행되는 데 쓰였다. |
| **OPTIMJACK** | Optimizely 가입 절차 결함으로 고객 프로젝트에 스키머를 넣어 178개 조직 사이트를 오염시킨 캠페인. |
| **exploit_agent** | 패치 diff를 분석해 n-day 익스플로잇을 스스로 만들고 실행하는 공격자 다중 에이전트 프레임워크(GTIG 보고). |
| **ARMORY CASTLE** | 옛 UNC5221. vCenter 인증 우회 CVE-2026-123890을 9월부터 제로데이로 쓴 중국 연계 추정 그룹. |

## 참고

- CISA 웹사이트(cisa.gov)는 이번 실행에서 열리지 않았다. KEV는 CISA 공식 GitHub 미러(kev-data, 카탈로그 2026.11.20판)와 CISA 메일 공지(11/17), Security Affairs, The Hacker News로 교차 확인했다. kev-data JSON은 앞부분만 확인했다. ICS 권고는 CISA CSAF 저장소의 ICSA-26-321-01\~11, 323-02, 323-03 파일로 확인했고 323-01, 04, 05는 열지 못했다.
- NVD는 확인하지 못했다. CVSS는 CISA CSAF(ICS 권고는 v3.1), 벤더(Oracle, Calif), 보도를 따랐고 출처마다 다른 값은 둘 다 적었다. KEV 항목 점수 상당수는 보도에 점수 출처가 명시되지 않았다.
- KISA 보호나라 보안공지와 안랩 ASEC 블로그는 이번 실행에서 직접 확인하지 못했다. 김수키 Funhouse 건은 THN 정리를 근거로 했다. 보안뉴스는 개별 기사(147355, 147428)를, 한국전력은 데일리시큐 기사를 근거로 했다. 노란우산 36만 명 수치는 네이트 뉴스 검색 결과 제목으로만 봤다.
- 직접 열지 못한 원문: GTIG·Mandiant 11월 보고서(CSO Online 보도로 대신), NebuSec 연구 원문, OX Security 글, Rapid7 Axis 보고서, F6 Cisco Expressway 보고서, The Times VW 보도, Optimizely 공식 공지.
- 사이트 레인이 빌드로 확인할 내부 링크: `/lab/ai-pentest/approach-and-ethics` (깊게 파볼 주제 1·2의 warning 상자, 2곳).
- 노란우산 피해 규모, agent-framework 게시 권한 획득 경로, OPTIMJACK 피해 금액, Puppet Core 수정 버전은 출처마다 달라 둘 다 적었다.