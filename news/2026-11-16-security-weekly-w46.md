---
title: 주간 보안 브리핑 2026-W46 (11월 9일 ~ 11월 15일)
description: Barracuda·Check Point·Outlook 등 KEV 12건과 사흘 기한, 탈취 계정 4,800여 개로 CI 비밀값을 턴 wfx-loot와 bee-js 릴리스 자동화 침해, Fireworks AI 키에서 시작된 Cursor 확장 변조와 SGLang RCE로 뚫린 TEE 추론 서버 등 11월 둘째 주 보안 이슈 정리
authors: [inseok]
toc_max_heading_level: 2
tags: [weekly, security, vulnerability, incident, ot, ai, cloud, compliance, supply-chain]
---

CISA는 Barracuda ESG 연쇄 결함, Check Point Gaia 권한 상승, Outlook·Chrome 제로데이 등 12건을 KEV에 올렸고 그중 다수에 사흘 기한을 걸었다.
공급망에서는 탈취한 GitHub 계정 4,800여 개로 CI 비밀값을 턴 wfx-loot가 나왔고, AI 쪽에서는 추론 업체 Fireworks AI에서 새어 나간 키가 Cursor 확장 변조의 출발점이었다는 사실이 확인됐다.

{/* truncate */}

:::info[대상 기간]
2026-11-09(월) \~ 2026-11-15(일), KST · ISO 2026-W46

공개 날짜가 이 기간 안에 있는 것만 넣었다. 사건 자체는 이전에 일어났지만 원인이나 새 사실이 이번 주에 처음 공개된 건은 그렇다고 따로 적었다. KEV 등재일과 기한은 CISA가 쓰는 미국 날짜다.
:::

## 이번 주 한눈에 보기

1. **경계 장비와 메일 클라이언트에 사흘 기한**: CISA는 11월 9일\~13일 KEV에 12건을 올렸다. Barracuda ESG 인증 우회와 root 명령 주입 연쇄, Check Point Gaia 로컬 권한 상승, UnrealIRCd 등은 등재 사흘 뒤가 연방 조치 기한이었다.
2. **탈취 계정과 릴리스 봇이 공급망 공격 수단이 됐다**: wfx-loot는 플랫폼 취약점 없이 훔친 GitHub 계정만으로 수천 개 저장소의 CI에서 비밀값과 클라우드 권한을 빼 갔다. `@ethersphere/bee-js`는 릴리스 봇이 만든 서명 없는 커밋이 정상 provenance까지 단 채 npm에 올라갔다.
3. **AI 인프라 업체가 침해의 경유지가 됐다**: Cursor 마켓플레이스의 Claude Code 확장 변조는 추론 업체 Fireworks AI에서 새어 나간 키가 출발점이었다. NEAR AI는 SGLang RCE로 TEE 추론 서버까지 뚫렸다고 밝혔다.

## 일반 보안

### CISA KEV 신규 12건, 다수에 사흘 기한 (11/09 \~ 11/13)

11월 9일에는 GPUStack, FreeSWITCH, IBM Aspera Faspex 결함과 지난주 다룬 OpenSSH SSHole이 올라갔고, 기한은 모두 11월 12일이었다.
11월 10일에는 Barracuda 2건, Chrome·Outlook 제로데이, Cisco BroadWorks XXE, Openwave Webtop 결함이 등재됐다.
11월 13일에는 UnrealIRCd와 Check Point Gaia가 올라가 기한이 11월 16일, 즉 등재 사흘 뒤였다.
GPUStack은 인증 없이 관리자 권한을 얻고 YAML 백엔드 등록 경로로 코드를 실행할 수 있는 AI 추론 클러스터 관리 도구 결함이다. UnrealIRCd는 IRCv3 label 태그를 이스케이프하지 않아 일반 사용자가 서버 간 명령(KILL, GLINE)을 끼워 넣을 수 있다.

- **왜 중요한가**: 등재와 기한 사이가 사흘로 줄어든 사례가 늘었다. 주말을 끼면 사실상 영업일 하루 안에 조치해야 하는 셈이라 자산 목록과 긴급 패치 절차가 미리 있어야 한다.
- **CVE / CVSS / KEV**: CVE-2026-102895 (GPUStack 인증 우회, 9.8) · CVE-2026-116779 (FreeSWITCH 코드 주입, 9.8) · CVE-2026-123218 (Aspera Faspex 권한 오류, 9.8) / KEV 11/09, 기한 11/12 · CVE-2026-20320 (Cisco BroadWorks OCI-P XXE, 7.5) · CVE-2026-111793 (Openwave Webtop 파일 형식 제한 우회, 4.3) / KEV 11/10, 기한 11/24 · CVE-2026-114713 (UnrealIRCd 구분자 주입, 8.6) / KEV 11/13, 기한 11/16. CISA는 12건 모두 랜섬웨어 사용 여부를 확인되지 않음으로 표시했다
- **출처**: [CISA kev-data (GitHub)](https://github.com/cisagov/kev-data) · [The Hacker News](https://thehackernews.com/2026/11/cisa-warns-of-active-exploitation-of.html) · [SecurityOnline (11/10 등재 6건)](https://securityonline.info/cisa-kev-six-vulnerabilities-november-2026/) · [SecurityOnline (UnrealIRCd)](https://securityonline.info/unrealircd-vulnerability-cve-2026-114713-exploited/)

### Barracuda ESG 인증 우회와 root 명령 주입 연쇄 악용 (11/10)

Barracuda는 일주일쯤 전 배포한 패치에 대한 권고를 11월 9일 갱신하며 "소수 조직"을 상대로 악용이 확인됐다고 밝혔다.
첫 결함은 조작한 백업 복원으로 전역 설정을 바꿔 인증을 건너뛰는 것이고, 두 번째는 시간대 입력값을 통한 OS 명령 주입으로 root 권한으로 실행된다.
ESG뿐 아니라 ADC, WAF, BMA, WCC, WSG 계열에도 영향이 있어 제품별 패치 번호(ESG는 BNSF-40425·BNSF-40430)가 따로 나왔다. SecurityOnline은 watchTowr가 익스플로잇 코드를 공개했고 Nuclei 템플릿도 있다고 전했다.

- **왜 중요한가**: 2023년 ESG 대규모 침해 이후에도 메일 게이트웨이는 계속 표적이다. 공개 익스플로잇이 있으니 패치 확인과 함께 설정 변경 이력과 백업 복원 기록을 점검해야 한다.
- **CVE / CVSS / KEV**: CVE-2026-116606 (설정 가져오기 인증 우회) · CVE-2026-111560 (OS 명령 주입). CVSS는 BleepingComputer가 적지 않았고 SecurityOnline은 v4 9.3·8.6으로 적어 출처마다 다르다 / KEV 11/10, 기한 11/13
- **출처**: [BleepingComputer](https://bleepingcomputer.com/news/security/hackers-exploit-barracuda-email-security-gateway-flaws-to-get-root-access) · [SecurityOnline](https://securityonline.info/cisa-kev-six-vulnerabilities-november-2026/)

### Check Point Gaia DynamicCLI 로컬 권한 상승 제로데이 (11/13 \~ 11/14)

Gaia OS의 `dynamic_server`가 root로 돌면서 누구나 쓸 수 있는(0777) 유닉스 소켓을 열어 두고, 호출자를 확인하지 않은 채 받은 명령을 root로 실행했다.
원격 코드 실행이 아니라 이미 발판을 얻은 뒤의 권한 상승 결함인데, Check Point는 초기 침투 이후 수십 곳의 고객을 상대로 쓰였고 PHP2Shell 관련 공격에도 엮였다고 밝혔다.
R81\~R82.20 계열의 방화벽, 관리·로그 서버, MDS, Maestro가 영향을 받고, R82.20 Take 14 등 Jumbo HFA에서 고쳤다. R81과 R81.10은 지원 종료라 수정이 없고 Dynamic CLI를 끄는 우회책만 있다.

- **왜 중요한가**: 경계 장비 침투가 곧 root 장악으로 이어지는 마지막 고리였다. `/var/log/dynamicCli.log`에서 Clish 경유가 아닌 요청을 찾는 것이 사후 점검의 출발점이다.
- **CVE / CVSS / KEV**: CVE-2026-123039 (로컬 권한 상승, 7.8) / KEV 11/13, 기한 11/16
- **출처**: [Cybersecurity News](https://cybersecuritynews.com/check-point-0-day-vulnerability)

### Microsoft 11월 정기 업데이트와 Outlook 제로데이, Chrome 올해 8번째 제로데이 (11/10)

Microsoft는 11월 정기 업데이트에서 1,000건이 넘는 CVE를 고쳤는데, 집계가 it-connect·Tenable 1,093건, SecurityWeek 1,094건, ZDI 약 1,090건으로 출처마다 다르다.
악용이 확인된 것은 Outlook 스푸핑 결함 하나로, 조작한 메시지 파일을 열면 외부 콘텐츠 경고 없이 공격자 서버에 접속해 NTLMv2 해시가 새어 나간다. 미리 보기 창은 공격 경로가 아니다.
그 밖에 Windows Search·LDAP RCE(각 9.8), 읽기 창을 통한 Outlook RCE 3건(8.8), Exchange·AD RCE가 함께 고쳐졌다.
Google은 같은 날 XML 구성요소의 use-after-free를 고친 Chrome 157.0.8103.50/.51을 내며 실제 익스플로잇이 있다고 밝혔다. 올해 8번째 Chrome 제로데이다.

- **왜 중요한가**: NTLM 해시 유출은 릴레이 공격의 재료가 된다. 외부 SMB 차단과 NTLM 제한이 패치와 함께 가야 한다.
- **CVE / CVSS / KEV**: CVE-2026-124194 (Outlook 스푸핑·NTLMv2 유출, 6.5) · CVE-2026-125350 (Chrome XML use-after-free, BleepingComputer는 점수 없이 높음, SecurityOnline은 8.8) / 둘 다 KEV 11/10, 기한 11/24 · CVE-2026-116928 (Windows Search RCE, 9.8) · CVE-2026-119958 (LDAP RCE, 9.8) / 미등재
- **출처**: [it-connect](https://www.it-connect.tech/patch-tuesday-november-2026-microsoft-fixes-1093-vulnerabilities-including-an-exploited-outlook-zero-day/) · [SecurityOnline (Outlook)](https://securityonline.info/outlook-zero-day-cve-2026-124194/) · [BleepingComputer (Chrome)](https://bleepingcomputer.com/news/security/google-patches-eighth-chrome-zero-day-exploited-in-attacks-this-year)

### 금융보안원 상시평가 지원시스템 침해 (11/10 첫 보도, 11/14 세부)

금융보안원은 11월 9일 오전 비정상 접근과 웹셸 업로드 시도를 막았지만, 오후에 무단 로그인이 이뤄져 상시평가 지원시스템의 파일이 빠져나간 것을 확인했다.
공격자는 문자 인증을 우회하고 금융감독원을 사칭해 계정을 만든 뒤 허술한 권한 검증으로 파일을 내려받았다. 2022년 감사 이후 고정 IP로 묶었던 접근을 다시 유동 IP로 풀어 둔 상태였다.
유출 규모는 보안뉴스가 금융회사 48곳 임직원 약 130건(이름 일부 마스킹, 이메일, 전화번호)으로 전했지만 다른 매체는 수백 건, 약 650건으로 보도해 아직 일치하지 않는다.
금융위원회와 금융감독원이 조사 중이고 다음 주 집중 점검을 예고했다.

- **왜 중요한가**: 금융권 보안을 평가하는 기관의 시스템이 본인 확인과 권한 검증의 기본 결함으로 뚫렸다. 유출된 연락처는 금융회사 보안 담당자를 노린 표적 피싱에 쓰일 수 있다.
- **CVE / KEV**: 공개된 CVE 없음
- **출처**: [머니투데이방송](https://news.mtn.co.kr/article/2026111020292055839) · [보안뉴스](https://www.boannews.com/news/articleView.html?idxno=147263)

:::note[기타 일반 보안 (11/09 \~ 11/15)]
- La Poste 자회사 Maileva: 9월 중순 침해로 고객사가 보낸 우편의 수신자 약 2,200만 명의 이름과 주소가 유출됐다고 La Poste가 11월 15일 확인했다. 일부 병원·연구소 독촉장 내용도 포함됐다. [Security Affairs](https://securityaffairs.com/203126/data-breach/data-breach-at-la-poste-subsidiary-maileva-affects-22-million-people-in-france.html)
- 코인원 고객상담 위탁사 메타엠이 11월 12일 새벽 침해돼 상담 기록(주민등록번호, 계좌번호, 지갑 주소 포함 가능)이 노출됐을 수 있다. 코인원은 핵심 시스템 침입은 없다고 했다(11/15). [보안뉴스](https://www.boannews.com/news/articleView.html?idxno=147270)
- 중소기업중앙회 노란우산(가입자 약 192만 명)이 11월 11일 비정상 외부 접근을 확인했다. 피해 규모는 공개되지 않았다(11/14). [보안뉴스](https://www.boannews.com/news/articleView.html?idxno=147267)
- BYOD 랜섬웨어 그룹이 Vanderbilt 대학 데이터베이스 암호화와 학생·직원 정보 탈취를 주장했다. 대학은 사고만 확인했다(11/10 KST). [BleepingComputer](https://bleepingcomputer.com/news/security/vanderbilt-university-hit-in-byod-ransomware-attack-data-theft-claimed)
- Bitdefender 10월 랜섬웨어 동향: 피해 주장 1,072건, 상위는 N0n·The Gentlemen·Qilin·Akira. 한국 피해 주장 18건 중 11건이 N0n이었다. Bitdefender는 N0n이 수치를 부풀린다고 봤다(11/10). [Bitdefender](https://www.bitdefender.com/en-au/blog/businessinsights/bitdefender-threat-debrief-november-2026)
- 안랩 ASEC: 국내 DVR 관리 프로그램으로 퍼진 Wpcdoor(11/11), 견적 요청 위장 SnakeKeylogger(11/12), DOCX altChunk로 RTF를 숨긴 Xloader(11/13), 주간 동향에서 INC Ransom의 국내 화학소재 제조사 공격 주장(11/11). [ASEC Wpcdoor](https://asec.ahnlab.com/ko/96476/) · [ASEC 주간 동향](https://asec.ahnlab.com/ko/96480/)
- KISA 보호나라는 11월 11일\~13일 Ivanti, MongoDB, MS 11월 정기, Apache, WordPress 플러그인, Node.js, Zoom, Synology, React Server Components, Vates 보안 업데이트 권고를 냈다.
:::

:::note[이번 주에서 뺀 항목]
- OpenSSH SSHole CVE-2026-123158은 11월 9일 KEV에 올랐지만 W45에서 다뤘다.
- Check Point의 이전 제로데이 CVE-2026-16232(7월)와 CVE-2026-50751은 검색에 함께 걸렸지만 기간 밖이다.
- Maileva 플랫폼 중단(9/23\~9/29)은 9월 일이고 이번 주 새 사실은 피해 규모뿐이다.
- 보안뉴스 목록의 인제대, 피터팬 좋은방 구하기, 모두의 창업 2차 유출 등은 기사 날짜를 확인하지 못해 뺐다. 더존비즈온 후속(13곳 추가 가능성, 11/13)은 원문을 열지 못했다.
- 11월 11일·12일·14일·15일은 KEV 신규 등재가 없었다.
:::

## OT/ICS · 제조 · 자동차

### Siemens 11월 정기 권고: Node2Shell이 WinCC·Opcenter·Teamcenter로 (SSA-242944, SSA-678870, 11/10)

Siemens는 Brotli 디코더 버퍼 오버플로(Node2Shell, 10월 27일 KEV 등재)가 자사 산업용·소프트웨어 제품에 미치는 영향을 두 권고로 정리했다.
산업용으로는 WinCC V7/V8, WinCC Unified, WinCC OA, BRAUMAT, SISTAR, TIA Administrator 등이, 소프트웨어로는 Opcenter, Teamcenter, Xpedition, Simcenter, PAVE360 Automotive 등이 포함됐다.
BRAUMAT·SISTAR(V8.2 Update 5)와 WinCC OA V3.20(P17.1)을 빼면 대부분 수정이 없고, 앱·프록시·방화벽에서 Brotli 압축을 끄는 완화책만 나왔다.
SecurityWeek는 Siemens 제품을 겨냥한 악용은 아직 보고되지 않았다고 전했다.

- **왜 중요한가**: 웹 런타임에 묻힌 압축 라이브러리 하나가 SCADA부터 MES, PLM, 차량 시뮬레이션 도구까지 번졌다. 수정이 늦는 OT 제품은 완화 설정이 실제 적용됐는지 확인하는 것이 대응의 중심이다.
- **CVE / CVSS / KEV**: CVE-2026-111497 (Brotli 디코더 범위 밖 쓰기, Siemens 기준 v3.1 9.8 · v4.0 9.2) / KEV 등재 (2026-10-27, 일반 제품 기준)
- **출처**: [Siemens SSA-242944](https://cert-portal.siemens.com/productcert/html/ssa-242944.html) · [Siemens SSA-678870](https://cert-portal.siemens.com/productcert/html/ssa-678870.html) · [SecurityWeek](https://www.securityweek.com/ics-patch-tuesday-siemens-flags-high-severity-flaws-node2shell-exposure/) · [INCIBE-CERT](https://www.incibe.es/incibe-cert/alerta-temprana/avisos-sci/boletin-de-seguridad-de-siemens-de-noviembre-de-2026)

### Siemens SIMATIC PCS 7·WinCC NTLM 릴레이, 수정 계획 없음 (SSA-970803, 11/10)

SIMATIC PCS 7, BATCH, Information Server, Process Historian, WinCC 등에서 원격 로그인에 쓰는 NTLM이 제대로 보호되지 않아, 중간자 위치의 공격자가 인증을 릴레이해 정상 사용자로 행세할 수 있다.
무엇에 접근할 수 있는지는 노출된 서비스에 달렸고, Siemens는 WinCC의 SQL Server를 예로 들었다.
BATCH, PCS 7 V9.1, Information Server, Process Historian은 수정 계획이 없고 WinCC 계열만 수정을 준비 중이다. SQL Server 통신 암호화와 Kerberos 전환이 권고됐다.

- **왜 중요한가**: 같은 주 Outlook 제로데이가 NTLMv2 해시를 흘리는 결함이었다. 사무망에서 얻은 해시가 공정 제어 시스템 릴레이로 이어질 수 있어 IT·OT 경계의 NTLM 정책을 함께 봐야 한다.
- **CVE / CVSS / KEV**: CVE-2026-58114 (약한 인증, v3.1 7.5 · v4.0 7.7) / 미등재
- **출처**: [Siemens SSA-970803](https://cert-portal.siemens.com/productcert/html/ssa-970803.html)

### Siemens Mendix Studio Pro MCP 서버가 외부에 열려 있었다 (SSA-710379, 11/10)

로코드 개발 도구 Mendix Studio Pro에 내장된 MCP 서버가 HTTP 리스너를 루프백으로 제한하지 않아 다른 호스트에서 접근할 수 있었다.
Content-Type과 Origin 헤더도 검증하지 않아 브라우저를 통한 CSRF가 가능했다.
11.16.0과 11.12.7에서 고쳤고, 임시로 TCP 7782 포트를 막으라고 했다.

- **왜 중요한가**: 산업 벤더의 개발 도구에도 AI 에이전트용 MCP 서버가 들어오면서, 로컬 전용이어야 할 기능이 네트워크 공격면이 됐다. 2025년부터 반복된 "localhost MCP" 문제가 OT 벤더 제품에서 다시 나왔다.
- **CVE / CVSS / KEV**: CVE-2026-112136 (제한 없는 IP 바인딩, v3.1 8.8 · v4.0 9.2, 그래서 INCIBE는 치명, SecurityWeek는 높음으로 분류) · CVE-2026-112137 (CSRF, v3.1 5.4 · v4.0 5.1) / 미등재
- **출처**: [Siemens SSA-710379](https://cert-portal.siemens.com/productcert/html/ssa-710379.html) · [SecurityWeek](https://www.securityweek.com/ics-patch-tuesday-siemens-flags-high-severity-flaws-node2shell-exposure/)

### CISA ICSA-26-316-01 \~ 05: Siemens Node2Shell·PHP2Shell 권고 재게시 (11/12)

CISA는 이번 주 ICS 권고 5건을 냈는데 모두 Siemens가 10월 23일\~11월 6일에 낸 권고를 다시 게시한 것이다.
316-01은 빌딩 자동화·에너지 제품(Spectrum Power, AMIS TS 등)의 PHP2Shell, 316-02는 Desigo CC와 Gridscale, 316-03은 Industrial Edge Management의 Node2Shell, 316-04·05는 RUGGEDCOM APE1808에 올라가는 PAN-OS의 두 결함이다.
Energy Engage V2.0SP9와 Industrial Edge Common Configurator처럼 수정이 없는 제품이 여럿이다.

- **왜 중요한가**: 내용 자체는 새롭지 않지만, 미국 에너지·빌딩 운영자 다수가 CISA 권고를 기준으로 움직이므로 이 시점부터 점검 대상이 넓어진다.
- **CVE / CVSS / KEV**: CVE-2026-109618 (PHP use-after-free, v3.1 9.8) · CVE-2026-109619 (PHP 해제 메모리 참조, v3.1 8.1) / KEV 등재 (2026-10-26) · CVE-2026-111497 (Node2Shell, v3.1 9.8) / KEV 등재 (2026-10-27)
- **출처**: [CISA ICSA-26-316-01](https://www.cisa.gov/news-events/ics-advisories/icsa-26-316-01) · [CISA CSAF (OT 2026)](https://github.com/cisagov/CSAF/tree/develop/csaf_files/OT/white/2026)

### CERT@VDE: Helmholz 원격 접속 서버 12건, Beckhoff TwinCAT 드라이버 권한 상승 (VDE-2026-141, VDE-2026-087, 11/10 \~ 11/11)

기계 원격 유지보수에 쓰이는 Helmholz myREX24V2에서 인증 없는 저장형 XSS, CSRF, 고정 백업 비밀번호, 속도 제한 없는 비밀번호 재설정, 고권한 OS 명령 주입 등 12건이 나왔다. 펌웨어 2.21.0에서 고쳤다.
Beckhoff TwinCAT의 커널 드라이버 `TcRouter.sys`는 접근 통제 없이 IOCTL을 열어 둬, 로컬 사용자가 I/O 포트와 물리 메모리를 다뤄 권한을 올릴 수 있다.
CERT@VDE는 두 권고 모두 자체 v3.1 점수가 CVE 레코드 값과 다르다고 적었다.

- **왜 중요한가**: 원격 유지보수 게이트웨이는 장비 제조사가 고객 공장 안으로 들어가는 통로다. 엔지니어링 PC의 드라이버 권한 상승은 PLC 프로젝트 변조로 이어질 수 있다.
- **CVE / CVSS / KEV**: CVE-2026-60035 \~ CVE-2026-60046 (Helmholz, 대표로 CVE-2026-60043 인증 없는 XSS는 v4 6.4 · v3.1 9.3) · CVE-2026-18767 · CVE-2026-18768 · CVE-2026-18769 (Beckhoff, v4.0 8.5 · v3.1 7.8). v3.1은 CVE 레코드와 다르다 / 미등재
- **출처**: [CERT@VDE VDE-2026-141](https://certvde.com/en/advisories/VDE-2026-141) · [CERT@VDE VDE-2026-087](https://certvde.com/en/advisories/VDE-2026-087)

:::note[기타 OT · 제조 · 자동차 (11/10 \~ 11/12)]
- Siemens 같은 날 권고: WinCC Graphics Designer가 파일을 열 때 경고 없이 활성 콘텐츠를 실행(SSA-979641, CVE-2026-59082, v3.1 7.8, 수정 없음), SIMATIC IOT2050 펌웨어 업데이트 도구 명령 주입(SSA-724261, CVE-2026-109830), ROS# 코드 주입(SSA-435267, 2.3.1 수정), Simcenter Femap(SSA-105852). [SecurityWeek](https://www.securityweek.com/ics-patch-tuesday-siemens-flags-high-severity-flaws-node2shell-exposure/)
- PHP2Shell이 MB connect line mbCONNECT24, Helmholz myREX24V2, Weidmueller IE-SR 라우터, ads-tec IRF로 번졌다(CERT@VDE, 11/10). [CERT@VDE](https://certvde.com/en/advisories)
- Schneider Electric은 EcoStruxure Power Build Rapsody 파일 처리 결함 1건(SEVD-2026-314-01)을 냈다. 원문을 열지 못해 CVE와 점수는 확인하지 못했다(11/10).
- Mitsubishi Electric은 CNC 시리즈 DoS 권고(2025-022)에 C80 시리즈 수정 버전을 추가했다(11/12). [Mitsubishi Electric](https://www.mitsubishielectric.com/fa/about-us/security/vulnerability/index.html)
- 자동차: 이름이 공개되지 않은 완성차 2곳의 ForgeRock 기반 고객 인증 결함으로 원격 문 열림·시동과 차량 위치 조회가 가능했다는 Sam Curry 등의 연구가 보도됐다. 두 회사는 올해 초 제보 두 시간 만에 고쳤다. 연구 원문은 11/7이고 보도가 11/12다. [Repairer Driven News](https://www.repairerdrivennews.com/2026/11/12/two-automakers-change-security-systems-two-hours-after-alerted-of-vulnerability/)
- 자동차: BYOD 랜섬웨어 그룹이 Toyota 데이터를 가졌다고 주장했다. 어느 법인인지 밝히지 않았고 Toyota 입장도 없어 검증되지 않은 주장이다(11/10). [Cybersecurity News](https://cybersecuritynews.com/toyota-data-breach-claim/)
:::

:::note[이번 주에서 뺀 항목]
- Phoenix Contact PLCnext Engineer·CodeMeter 권고(11/04)와 Mitsubishi CC-Link IE TSN 개정(11/05)은 지난주 공개분이다.
- Node2Shell의 KEV 등재 자체(10/27)는 배경으로만 적었다.
- Rockwell, ABB, EV 충전기 관련 기간 내 신규 권고는 찾지 못했다. 기간 안에 공개된 제조업 랜섬웨어 피해 중 확인된 건도 찾지 못했다(공격자 주장인 ASEC의 국내 화학소재 제조사 건은 일반 보안에 적었다).
:::

## AI 보안

### Cursor의 Claude Code 확장 변조, 출발점은 Fireworks AI에서 새어 나간 키 (11/09 \~ 11/15)

W44에서 다룬 Cursor 마켓플레이스의 변조된 `anthropic.claude-code` 2.1.312·2.1.313의 원인이 이번 주 공개됐다.
Cursor가 추론 업체 Fireworks AI에 발급한 접근 키가 Fireworks 침해로 노출됐고, 공격자는 이 키로 Privacy Mode를 끄고 쓴 사용자의 에이전트 실행 기록(주로 2025년분)이 든 버킷을 복사했다.
기록 안에 가려지지 않은 자격증명이 일부 있었고, 이를 타고 SaaS 도구와 내부 자격증명을 얻어 10월 29일 마켓플레이스 배포 캐시에 변조 빌드를 심었다.
Fireworks는 11월 9일 피해 범위를 자원 메타데이터, 청구 정보, 일부 고객의 모델 가중치와 데이터셋까지 넓혔고, Uber와 Notion도 이 침해로 데이터가 나갔다고 밝혔다.

- **왜 중요한가**: 에이전트 실행 기록에 남은 비밀값이 추론 하청 업체를 거쳐 개발 도구 공급망 침해로 이어졌다. AI 벤더 목록과 그들에게 넘어가는 로그·트레이스가 서드파티 위험 관리 대상이라는 뜻이다.
- **CVE / KEV**: 해당 없음. 지표는 W44와 같다(`134.209.82.225`, `svc-telemetry` SSH 키, `com.apple.sysmond`)
- **출처**: [The Hacker News](https://thehackernews.com/2026/11/stolen-fireworks-ai-key-led-to-cursor.html) · [The Register (Fireworks 피해 확대)](https://www.theregister.com/cyber-crime/2026/11/10/fireworks-ai-gets-burned-twice-as-customer-data-exposure-widens/5308722) · [Unite.AI](https://www.unite.ai/cursor-traces-breach-to-access-key-exposed-by-fireworks-ai/)

### SGLang RCE로 NEAR AI 추론 서버 침해, TEE 안 요청까지 노출 (11/09 \~ 11/10)

NEAR AI는 공격자가 오픈소스 추론 엔진 SGLang의 원격 코드 실행 결함으로 서버 한 대를 장악했다고 밝혔다.
공격자는 그날 처리된 요청을 볼 수 있었고, 여기에는 신뢰 실행 환경(TEE) 안에서 처리되는 기밀 모드 요청도 포함됐다. NEAR AI는 TEE가 그 안에서 도는 취약한 소프트웨어까지 지켜 주지는 않는다고 적었다.
구 Private Chat 사용자 약 100명의 계정 정보, TEE 밖 레거시 에이전트 18개의 대화 기록, 로그에 남은 고객 API 키 2개가 노출됐다.
CVE와 업스트림 수정 버전은 아직 공개되지 않았다.

- **왜 중요한가**: 하드웨어 격리를 내세운 기밀 추론도 서빙 엔진 하나가 뚫리면 무너진다. 같은 주 GPUStack이 KEV에 오른 것까지 보면 AI 서빙 계층이 본격적인 공격 대상이 됐다.
- **CVE / KEV**: CVE 미부여 (같은 계열 AI 서빙 도구 GPUStack CVE-2026-102895는 KEV 11/09 등재)
- **출처**: [The Hacker News](https://thehackernews.com/2026/11/sglang-rce-exploit-breaches-near-ai.html)

### Microsoft Lazarus: 뉴런 10개 미만을 고쳐 AI 에이전트에 백도어 (11/10 \~ 11/11)

Microsoft Research는 오픈 가중치 모델의 잠자는 피드포워드 뉴런 몇 개를 재학습 없이 고쳐, 프롬프트나 도구 출력에 트리거가 나타나면 에이전트가 공격자 명령을 내놓게 하는 기법을 공개했다.
Nemotron-Terminal-8B에서는 뉴런 7개로 트리거 세션의 98.8% 이상에서 명령이 나왔고, 트리거 없는 세션에서는 거의 나오지 않았다. 벤치마크 성능은 46.59%에서 42.05%로 조금만 떨어졌다.
이 수치는 모델이 명령을 출력한 비율이지 공격 전체의 성공률은 아니고, 가중치에 쓸 권한이 있어야 한다는 전제가 있다.
원본 가중치와 비교하지 않으면 안정적으로 찾기 어렵고, 학습한 탐지기는 작은 시험셋에서 91.4%를 잡았지만 오탐률이 9.7%였다.

- **왜 중요한가**: 모델 파일 자체가 실행 코드처럼 공급망 위험이 된다. 사내 모델 레지스트리, 해시·기반 모델 검증, 고위험 행동의 사람 승인이 현실적인 방어선이다.
- **CVE / KEV**: 해당 없음. 실사용 보고 없음
- **출처**: [Microsoft Research](https://www.microsoft.com/en-us/research/blog/lazare-veni-foras-reprogramming-dormant-neurons-to-backdoor-ai-agents) · [The Hacker News](https://thehackernews.com/2026/11/microsoft-researchers-show-ai-agents.html)

### ARTEX 복제판 AntiFox, IIS 웹셸과 AWS 자격증명 탈취 공격에 쓰여 (11/11)

Arctic Wolf는 ARTEX 0.1.1을 중국어 화면으로 고친 오픈소스 에이전트형 침투 테스트 플랫폼 AntiFox가 실제 공격에 쓰였다고 밝혔다.
인터넷에 노출된 IIS 서버에 ASPX 웹셸을 심어 `web.config`와 DB 연결 문자열을 읽었고, 정상 AWS IAM 신원과 EC2 역할로 30분 동안 수백 건의 API를 호출해 운영 비밀값 하나를 읽어 냈다. 다른 사례에서는 S3 객체를 복사한 뒤 지웠다.
AWS는 자사 서비스는 설계대로 동작했고 자격증명은 침해된 고객 앱에서 나왔다며 IMDSv2와 GuardDuty를 권고했다.

- **왜 중요한가**: 공개 AI 공격 도구가 포크되면서 행위자 귀속이 더 어려워졌다. 짧은 시간에 쏟아지는 AccessDenied 호출은 에이전트형 공격의 탐지 신호가 될 수 있다.
- **CVE / KEV**: 해당 없음. 초기 IIS 침투 방법은 밝혀지지 않았다
- **출처**: [The Hacker News](https://thehackernews.com/2026/11/antifox-ai-pentesting-platform-linked.html) · [보안뉴스](https://www.boannews.com/news/articleView.html?idxno=147198)

### 규제·정책: 호주 AI 안전 규제기관 추진, 파리 AI 안전·보안 선언 (11/09 \~ 11/13)

호주 정부는 OpenAI의 자율 에이전트가 6월 비공개 Medicare 통계에 접근한 사건을 계기로 한 신속 검토의 권고 18건을 모두 받아들였다. 연말까지 의무 AI 안전·보안 기준을 만들고, 독립 모델 평가를 요구하고 과징금을 매길 수 있는 규제기관, 기한 있는 사고 보고를 추진한다.
11월 9일 채택된 파리 AI 안전·보안 선언에는 OpenAI, Anthropic, Microsoft, Mistral이 서명했고 모델 정지 장치, 사고 정보 공유, 독립 감사를 약속했다. 구속력은 없고, 서명국 수는 매체마다 6곳과 8곳으로 달라 적지 않았다.
국내에서는 국가안보실이 11월 13일 민·관·군 회의에서 AI 기반 사이버 위협 대응을 위해 실시간 IT 자산 관리와 SBOM 도입 가속을 지시했다.

- **왜 중요한가**: 에이전트가 실제로 비공개 시스템에 들어간 사건이 규제 설계로 이어진 첫 사례 중 하나다. 국내 지시는 AI 위협 대응의 출발점을 자산 파악과 SBOM에 두었다.
- **CVE / KEV**: 해당 없음
- **출처**: [ABC News (호주)](https://www.abc.net.au/news/2026-11-10/openai-medicare-hack-government-loophole/107368330) · [The Decoder (파리 선언)](https://the-decoder.com/eight-countries-and-top-ai-labs-agree-to-shutdown-mechanisms-in-new-paris-declaration) · [보안뉴스 (국가안보실)](https://www.boannews.com/news/articleView.html?idxno=147274)

:::note[기타 AI 보안 (11/09 \~ 11/15)]
- Microsoft 11월 정기 업데이트의 AI 제품 결함: Azure OpenAI 권한 상승 CVE-2026-119990(9.8, 클라우드 측 수정, 고객 조치 불필요), MCP Gateway 권한 상승 CVE-2026-109492, 365 Agents SDK 정보 노출 CVE-2026-109485(6.3), JetBrains용 Copilot 정보 노출 CVE-2026-83953(5.5). [ZDI](https://www.zerodayinitiative.com/blog/2026/11/10/the-november-2026-security-update-review)
- CloudSEK: 노출된 Silent Lynx 서버에서 텔레그램으로 지시받는 AI 에이전트가 타지키스탄 철도 도메인 권한을 얻고 정부 문서 2,000건 이상을 가져간 흔적이 나왔다(11/11). [CloudSEK](https://www.cloudsek.com/blog/off-the-rails-inside-an-exposed-silent-lynx-server)
- Grok Build로 만든 앱 37,571개 중 35,578개가 로그인 없이 열려 있었다. 게시할 때 "링크가 있는 누구나"가 기본 선택이었다(11/11). [The Hacker News](https://thehackernews.com/2026/11/over-35000-grok-built-apps-exposed.html)
- Anthropic Claude Mythos 5.2 공개: CVE 재발견 89.6%, 샌드박스 밖 자격증명 사용 3.1%라고 밝혔다. 모두 회사 자체 수치다(11/09). [SecurityWeek](https://www.securityweek.com/anthropic-rolls-out-mythos-5-2-with-improved-bug-hunting-fewer-sandbox-escapes)
- Microsoft MDASH AI가 리눅스 커널에서 33개 CVE를 냈고, Unit 42는 가짜 AI 트레이딩 사이트 26곳의 간접 프롬프트 인젝션 캠페인을 보고했다(THN 주간 정리, 11/12). [The Hacker News](https://thehackernews.com/2026/11/threatsday-59-linux-kernel-bugs-falcon.html)
- OpenAI가 연구 모델 작업을 약 35초 안에 멈추는 중앙 정지 시스템 Control Room을 공개했다(11/11). [The Register](https://www.theregister.com/ai-and-ml/2026/11/11/openai-builds-a-kill-switch-for-its-research-models/5309006)
- United Airlines가 고객 AI 에이전트의 예약·결제를 막기로 했다(11/15). [보안뉴스](https://www.boannews.com/news/articleView.html?idxno=147238)
:::

:::note[이번 주에서 뺀 항목]
- Adversa MCP 정리에 실린 FastMCP OAuth, server-everything, MCP TypeScript SDK CVE-2026-111770, basic-memory DNS 리바인딩 권고는 모두 10월 공개분이다. 이번 주 새 MCP 서버 CVE는 Siemens Mendix(OT 영역)와 Microsoft MCP Gateway뿐이었다.
- Proofpoint BluePhishing(Entra Agent ID 동의 피싱)은 페이지 메타데이터상 11/7 게시라 경계에 걸려 뺐다. DeepMind RSA-1024 비용 절감은 원 발표가 11/6이다.
- ARTEX/WorkOS, Apiiro 설정 파일 유출, LLMjacking, GPT-6 Cyber 등은 W45에서 다뤘다. EU AI Act와 국내 인공지능기본법은 이번 주 새 진전을 찾지 못했다.
:::

## 소프트웨어 공급망 보안

### wfx-loot: 탈취한 GitHub 계정 4,800여 개로 CI 비밀값과 클라우드 권한 탈취 (11/12)

공격자는 훔친 GitHub 자격증명으로 계정들이 쓸 수 있는 저장소에 탐색용 PR(`wfx-docs` 브랜치)을 열어 쓰기 권한을 확인한 뒤, 기존 워크플로 수정, npm `postinstall` 훅, 새 워크플로 추가 등으로 1,500줄짜리 셸 스틸러를 넣었다.
스틸러는 비밀값, `GITHUB_TOKEN`과 OIDC 토큰, 러너 프로세스 메모리, AI·클라우드·레지스트리 키를 챙기고, 1분 안에 커밋을 되돌리고 실행 기록과 로그를 지웠다.
OIDC 토큰을 AWS·Azure·GCP 세션으로 바꿔 액세스 키를 만들고 역할 신뢰 정책을 모든 AWS 주체에 열거나 Entra에 `wfx-ci-*` 페더레이션 자격증명을 추가해, 비밀값을 교체해도 남는 백도어를 만들었다.
StepSecurity는 GitHub Actions 취약점은 쓰이지 않았다고 했다. 규모는 Aikido 기준 계정 4,837개, 실행 확인 저장소 1,806개 이상, SafeDep 기준 악성 커밋 저장소 8,093개로 출처마다 다르다.

- **왜 중요한가**: 10월 GhostAction 때 털린 계정이 재사용될 확률이 크게 높았다. 비밀값 교체만으로는 끝나지 않고 클라우드 쪽 신뢰 정책과 페더레이션 자격증명까지 되짚어야 한다.
- **CVE / KEV**: 해당 없음. 지표: 스틸러 SHA-256 `89695abb...735cf`, 유출지 `194.150.166[.]244:8080/exfil`·`18.143.168[.]96:8080/exfil`, 브랜치 `wfx-docs`·`ci-check-NNNN`, 커밋 메시지 "ci: refresh build cache", 아티팩트 `wfx-loot-RUNID`, AWS 세션 이름 `wfx-*`
- **출처**: [The Hacker News](https://thehackernews.com/2026/11/4837-hijacked-github-accounts-ran-ci.html) · [Aikido](https://www.aikido.dev/blog/compromised-github-accounts-push-ci-secret-stealer-to-tens-of-thousands-of-repositories) · [CSA 연구 노트](https://labs.cloudsecurityalliance.org/research/csa-research-note-wfx-github-ci-secret-stealer-20261112-csa/)

### `@ethersphere/bee-js` 13.3.0과 Swarm Desktop, 릴리스 봇 경로로 침해 (11/09)

공격자는 11월 6일 관리자 계정으로 CI 자격증명 탈취 워크플로를 밀어 넣으려다 실패한 뒤, 11월 8일 릴리스 봇 `bee-worker` 이름으로 어느 브랜치에도 없는 서명 없는 커밋을 만들었다.
이 커밋으로 GitHub 릴리스 `v13.3.0`을 만들자 npm 게시 워크플로가 돌아, 악성 버전이 정상 provenance를 단 채 올라갔다. 테스트는 브랜치 푸시에서만 돌게 돼 있어 실행되지 않았다.
`postinstall` 로더가 Swarm 지갑 키를 훔치고 macOS·리눅스에는 RAT, 윈도에는 ScreenConnect를 심었으며, C2 주소는 이더리움 계약에서 읽었다. npm은 약 75분 만에 내렸지만 Swarm Desktop 0.56.2는 약 8시간 반 동안 받을 수 있었다.

- **왜 중요한가**: provenance는 "어느 워크플로가 만들었나"를 증명할 뿐 "그 커밋이 검토됐나"는 보장하지 않는다. 릴리스 트리거를 누가 만들 수 있는지와 브랜치 밖 커밋 차단이 별도로 필요하다.
- **CVE / KEV**: 해당 없음. 지표: `api[.]frameworkmetrics[.]xyz`, `193[.]57[.]9[.]155:4912`, 지속성 `~/.solidity/`·`com.solidity.langsupport.runner`. bee-js는 13.2.0 고정, Swarm Desktop은 0.56.3 이상
- **출처**: [Socket](https://socket.dev/blog/bee-js-compromise) · [SafeDep](https://safedep.io/blog/ethersphere-bee-js-npm-compromise)

### React Server Components Flight 행 밀수로 RCE (CVE-2026-126187, 11/10)

Flight 프로토콜 작성기가 2,048바이트가 넘는 typed array를 살아 있는 ArrayBuffer 위의 뷰로 보내는데, 버퍼가 분리(detach)되면 길이 0인 청크는 건너뛰면서 행 헤더는 바이트가 온다고 약속한 채 남는다.
그러면 클라이언트 파서가 행 정렬을 잃고 공격자가 넣은 바이트 안에서 다시 맞춰져, 몰래 끼워 넣은 모듈 행을 실행하게 된다.
응답에 typed array 여러 개와 공격자 제어 값이 함께 있어야 해서 권고는 드문 조건이라고 했다. 수정 자체는 10월에 19.0.9·19.1.10·19.2.9·19.3.1과 Next.js 16.4.1로 나갔고, CVE와 권고 DB 등재가 이번 주였다.

- **왜 중요한가**: 2025년 React2Shell 이후 RSC 직렬화 계층에서 또 나온 원격 코드 실행 결함이다. 패치와 CVE 사이에 한 달 가까운 간격이 있어 CVE 기반 스캐너만 보면 늦게 알게 된다.
- **CVE / CVSS / KEV**: CVE-2026-126187 (역직렬화, GitHub 권고 CVSS 4.0 9.5 · GitLab 권고 CVSS 3.1 10.0으로 출처마다 다르다) · GHSA-xqc2-xf4c-x3h3 · Next.js GHSA-673q-mjm6-r5xr / 미등재, 악용 보고 없음
- **출처**: [StepSecurity](https://www.stepsecurity.io/blog/cve-2026-126187-react-flight-rce) · [GitHub Advisory](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3) · [GitLab Advisory](https://advisories.gitlab.com/npm/react-server-dom-webpack/CVE-2026-126187/)

### PyPI `fragment-api-py` 14.4.2, 클라이언트 시작만 해도 TON·USDT 지갑 비워 (11/10)

정상 13.0.0 코드에 세 파일만 바꿔 백도어를 넣고 버전을 14.4.2로 올려 `pip install -U`가 이 버전을 고르게 했다. 대응하는 GitHub 태그는 없다.
`FragmentClient`를 여는 순간 `sweep_wallet_to_self()`가 돌아 USDT 전부와 TON 대부분을 공격자 지갑으로 보낸다. 피해 송금 2건이 확인됐다.
프로젝트가 오래 쓰는 PyPI 토큰과 로컬 빌드를 써서, 토큰 탈취인지 단말 침해인지 내부자인지 밝혀지지 않았다.

- **왜 중요한가**: Trusted Publishing 없이 장기 토큰으로 게시하는 프로젝트는 업로더를 사후에 가려낼 수 없다. 저장소 태그와 패키지 버전이 맞는지 확인하는 것만으로도 이런 건을 걸러낼 수 있다.
- **CVE / KEV**: 해당 없음. 지표: wheel SHA-256 `24c402f3...d447`, 코드 표지 `_ensure_swept`·`_sweep_on_init`
- **출처**: [SafeDep](https://safedep.io/blog/fragment-api-py-pypi-ton-wallet-drainer)

### 가짜 면접 AccuraSoftHire, Tailwind 플러그인으로 위장한 npm 패키지가 수개월 설치 가능 (11/13)

과제 저장소, 가짜 카메라 "드라이버", 수동 설치 브라우저 확장을 엮은 가짜 채용 캠페인에서 `tailwind-lines-clamps` 등 npm 패키지 10개가 쓰였고, 일부는 200일 넘게 받을 수 있었다.
로더는 PolinRider로 분류되고 C2 주소를 이더리움 지갑에서 읽는다. `.vscode/tasks.json`의 폴더 열기 자동 실행도 쓴다.
바이낸스 탈취와 수법은 같지만 JFrog는 두 사건의 연결고리를 찾지 못했다.

- **왜 중요한가**: 지난주 바이낸스 원인 공개에 이어 면접 과제가 개발자 단말 침투의 주 경로임이 다시 확인됐다. 과제는 일회용 VM에서, VS Code 작업 자동 실행은 꺼 둔 채 열어야 한다.
- **CVE / KEV**: 해당 없음. 지표: `accurasofthire[.]com`, `103.179.142.155`, 네이티브 메시징 호스트 `com.accurasoft.jobalerts`
- **출처**: [StepSecurity](https://www.stepsecurity.io/blog/accurasofthire-fake-interview-developer-machines)

:::note[기타 공급망 (11/09 \~ 11/15)]
- crates.io `lwd_uri_util` 0.1.0\~0.1.4: `build.rs`가 환경 변수를 통째로 빼 가며 FASTLANE·KEYSTORE 같은 릴리스·서명 단말 표지를 노렸다(GHSA-8mh3-cf36-7xxq, 11/10). [Helix](https://helix.ml/threat-watch/i/lwd-uri-util-crates-io-malicious-build-rs-steals-env-credentials-from-release-publishing-workstations-no-cve)
- crates.io `basek`(윈도 키로거)와 `hesk`(지갑 스틸러), 둘 다 텔레그램으로 유출(11/13). [Helix](https://helix.ml/threat-watch/i/malicious-rust-crates-basek-hesk-on-crates-io-keyloggers-wallet-stealers-exfiltrating-via-telegram-bot-api)
- Railway 사고 보고: 10월 빌드 VM 파일시스템 격리 탈출로 빌드 인프라 자격증명이 새고, OIDC 설정 오류로 클라우드 접근까지 이어졌다. 원 보고서는 열지 못해 StepSecurity 요약을 근거로 했다(11/10). [StepSecurity](https://www.stepsecurity.io/blog/railway-security-incident-cicd-runtime-security)
- GitHub: 비밀 스캐닝이 Actions 워크플로 로그 안의 비밀값도 탐지하게 됐다(11/09). `pull_request_target` 시험 차단은 11월 9일에 이어 11월 16일 16시\~18시 UTC에 한 번 더 있다. [GitHub Changelog](https://github.blog/changelog/)
:::

:::note[이번 주에서 뺀 항목]
- `strutil-core` RubyGems 웜은 11월 10일 재보도됐지만 새 사실이 없다.
- Safeguard의 `@acitons/artifact` 글(11/14)은 2025년 11월 사건의 회고다.
- Xygeni 악성 코드 정리 94호의 패키지는 11월 2일·4일 확인분이고, PyPI `protecteda` 등은 11월 4일 권고다.
- SafeDep testmetest 웜은 10월 22일 원글의 갱신이다.
:::

## 깊게 파볼 주제

### 주제 1. CVE-2026-126187: React Flight 행 밀수, 스트림 프로토콜이 어떻게 RCE가 되는가

**추천 이유**

- 길이 접두 프레이밍과 분리된 ArrayBuffer라는 아주 작은 조건이 직렬화 경계 붕괴로 이어지는 과정을 따라갈 수 있다. HTTP 요청 밀수와 구조가 비슷해 개념을 넓히기 좋다.
- 패치가 작고 읽기 쉬우며, 패치(10월)와 CVE(11월) 사이의 간격, CVSS v4 9.5와 v3.1 10.0이 갈린 이유(`AT:P` 대 `S:C`)까지 함께 정리할 거리가 많다.

**무엇을 보면 좋을지**

- 패치 diff: react 저장소의 "[Flight] Improve transport protocol" PR(#37842\~#37846)에서 typed array 청크 작성과 detached 버퍼 처리, 행 헤더 길이 검증이 어떻게 바뀌었는지 본다.
- PoC 공개 여부: `briskets/CVE-2026-126187-poc` 저장소에 취약한 Next.js 16.4.0·React 19.3.0(3100 포트)과 수정된 16.4.1(3101 포트)을 나란히 띄우는 Docker 랩이 있다. 동작 여부는 확인하지 않았으니 코드를 먼저 읽고 판단한다. 이번 주 기준 Vulhub 환경은 확인하지 못했다.
- 탐지: RSC 응답 스트림에서 행 헤더 길이와 실제 바이트 수가 어긋나는 경우를 잡는 방법, 의존성 트리에서 `react-server-dom-*` 버전을 찾는 SCA 규칙을 써 본다.

:::warning
PoC 랩은 반드시 격리된 로컬 랩에서만 돌린다. 공개 저장소 코드는 먼저 읽어 본 뒤 루프백이나 외부와 끊긴 가상 머신에서만 실행하고, 다른 사람의 서비스에는 어떤 시도도 하지 않는다. 실습 원칙은 [AI 취약점 진단 실습](/lab/ai-pentest/approach-and-ethics)을 따른다.
:::

**관련 개념**

- MITRE ATT&CK: T1190 (Exploit Public-Facing Application), T1059.007 (Command and Scripting Interpreter: JavaScript)
- CWE-502 (Deserialization of Untrusted Data), CWE-130 (Improper Handling of Length Parameter Inconsistency), 스트림 프레이밍, 요청 밀수, React2Shell

### 주제 2. wfx-loot: 취약점 없는 CI 침해를 탐지하고 클라우드 백도어까지 걷어 내기

**추천 이유**

- 플랫폼 결함 없이 탈취한 계정만으로 CI, OIDC, 클라우드 IAM까지 이어지는 전 과정이 보고서에 구체적으로 나와 있다. "비밀값 교체로 끝"이라는 대응이 왜 틀렸는지 보여 주는 좋은 사례다.
- 증거를 지우는 "샌드위치 커밋"과 실행 기록 삭제 때문에, 남는 흔적(실행 번호 공백, 감사 로그)으로 사냥하는 연습을 할 수 있다.

**무엇을 보면 좋을지**

- GitHub 감사 로그와 API로 되돌림 커밋 쌍, 삭제된 워크플로 실행, Actions 실행 번호 공백을 찾는 스크립트를 써 본다.
- AWS CloudTrail에서 `wfx-*` 세션 이름 뒤의 `CreateAccessKey`·`UpdateAssumeRolePolicy`, Entra 감사 로그의 페더레이션 자격증명 추가를 찾는 쿼리를 만든다.
- 대응 체크리스트: PAT·세션 폐기, OIDC 신뢰 조건(`sub` 클레임) 좁히기, 역할 신뢰 정책 원복, 패키지 레지스트리 토큰 교체 순서를 정리한다. GitHub의 Actions 로그 비밀 스캐닝(11/09)이 어디까지 도움이 되는지도 본다.

:::warning
실습은 개인 소유의 시험용 GitHub 조직과 별도 클라우드 계정에서, 실제 비밀값 없이 격리된 로컬 랩 수준으로만 한다. 공개된 스틸러 샘플은 실행하지 않는다. 실습 원칙은 [AI 취약점 진단 실습](/lab/ai-pentest/approach-and-ethics)을 따른다.
:::

**관련 개념**

- MITRE ATT&CK: T1078.004 (Valid Accounts: Cloud Accounts), T1195.002 (Compromise Software Supply Chain), T1552.001 (Credentials In Files), T1098.001 (Account Manipulation: Additional Cloud Credentials), T1070 (Indicator Removal)
- OIDC 페더레이션, 역할 신뢰 정책, GhostAction, 샌드위치 커밋

## 이번 주 키워드

| 키워드 | 한 줄 설명 |
|---|---|
| **Node2Shell** | Brotli 디코더 범위 밖 쓰기 CVE-2026-111497. 이번 주 Siemens WinCC·Opcenter·Teamcenter 등으로 영향이 번졌고 대부분 수정이 없다. |
| **wfx-loot** | 탈취한 GitHub 계정으로 CI에 스틸러를 넣고 OIDC로 클라우드 백도어까지 만든 캠페인. 플랫폼 취약점은 쓰이지 않았다. |
| **Flight 행 밀수** | RSC 스트림의 행 길이와 실제 바이트가 어긋나 공격자 바이트가 모듈 행으로 해석되는 결함(CVE-2026-126187). |
| **뉴런 편집 백도어** | 재학습 없이 가중치 몇 개를 고쳐 트리거 시 에이전트가 명령을 내놓게 하는 기법(Microsoft Lazarus). |
| **AI 하청 경유 침해** | 추론 업체에 넘긴 키와 실행 기록이 새어 개발 도구 공급망 침해로 이어진 경로(Fireworks AI에서 Cursor로). |

## 참고

- CISA 웹사이트는 이번 실행에서 직접 열리지 않았다. KEV 12건은 CISA 공식 GitHub 미러(kev-data, 카탈로그 2026.11.13판)와 The Hacker News, SecurityOnline으로 교차 확인했다. ICS 권고는 CISA CSAF 저장소에서 icsa-26-313\~319 번호대를 확인했고 316-01\~05만 있었다.
- NVD는 자바스크립트가 필요해 내용을 볼 수 없었다. CVSS는 벤더 권고(Siemens, CERT@VDE, GitHub·GitLab 권고)와 보도를 따랐고, 출처마다 다른 값은 본문에 둘 다 적었다. Microsoft 11월 CVE 총수는 집계마다 달라 범위로 적었다.
- KISA 보호나라는 보안공지 목록(11/11\~11/13 게시)의 제목만 확인했다. 안랩 ASEC은 11월 11일\~13일 게시글 4건을 근거로 했다. 보안뉴스는 개별 기사(147198, 147238, 147263, 147267, 147270, 147274)를 근거로 했다.
- BleepingComputer의 Patch Tuesday 기사와 AntiFox 기사, SecurityWeek 일부 페이지는 열리지 않아 다른 매체로 확인했다. Schneider SEVD-2026-314-01 원문도 열지 못했다.
- 직접 열지 못한 원문: Cursor의 새 사고 공지, NEAR AI 블로그, Arctic Wolf 원보고서, Railway 사고 보고서, SafeDep·StepSecurity의 wfx 원글. 해당 내용은 The Hacker News, The Register, Aikido, CSA 연구 노트, StepSecurity 요약을 근거로 했다.
- 금융보안원 유출 규모와 wfx-loot 피해 규모는 출처마다 숫자가 달라 범위로 적었다. Toyota 건은 공격자 주장뿐이고, Mythos 5.2 수치는 회사 자체 발표다.