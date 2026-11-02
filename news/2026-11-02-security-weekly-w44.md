---
title: 주간 보안 브리핑 2026-W44 (10월 26일 ~ 11월 1일)
description: PHP2Shell·Node2Shell KEV 등재와 국내 PHP 서버 패치율 5.5%, 바이낸스 63억 달러 탈취, Cursor 마켓플레이스 악성 Claude Code 확장, 국내 첫 생성형 AI 해킹 조직 검거 등 10월 다섯째 주 보안 이슈 정리
authors: [inseok]
toc_max_heading_level: 2
tags: [weekly, security, vulnerability, incident, ot, ai, supply-chain]
---

지난주 공개된 PHP2Shell과 Node2Shell이 이번 주 차례로 CISA KEV에 올랐고, 방화벽 25대를 장악한 공격 체인까지 확인됐지만 국내 PHP 서버 패치율은 일주일 뒤에도 5.5%에 머물렀다.
같은 주 바이낸스에서 약 63억 달러가 빠져나갔고, Cursor 확장 마켓플레이스는 변조된 Claude Code 확장을 정상 업데이트로 배포했으며, 경찰은 ARTEX와 생성형 AI로 90개 기업을 턴 국내 조직을 검거했다.

{/* truncate */}

:::info[대상 기간]
2026-10-26(월) ~ 2026-11-01(일), KST · ISO 2026-W44

공개 날짜가 이 기간 안에 있는 것만 넣었다. 취약점 자체는 이전에 공개됐지만 이번 주에 KEV에 등재되거나 악용이 새로 확인된 건은 그 날짜를 따로 표시했다.
:::

## 이번 주 한눈에 보기

1. **Black October의 청구서**: PHP2Shell(10/26), Node2Shell(10/27), GitLab(10/29), Ivanti Connect Secure(10/30)가 줄줄이 KEV에 올랐다. Dream은 PHP2Shell과 리눅스 커널 권한 상승을 엮어 방화벽 관리 서버 25대를 root로 장악한 공격을 공개했는데, 국내 PHP 서버 중 패치된 비율은 일주일 뒤 약 5.5%였다.
2. **신뢰된 경로가 돈과 권한을 빼냈다**: 바이낸스는 핫월렛 서명 체계가 뚫려 약 63억 달러를 잃었고, Cursor 마켓플레이스는 변조된 Claude Code 확장을 11시간 동안 정상 업데이트로 내보냈으며, Polymarket은 외부 공급자가 주입한 스크립트로 이용자 지갑이 털렸다.
3. **AI 공격이 수사 기록과 영수증으로 남기 시작했다**: 서울경찰청은 ARTEX와 생성형 AI로 90개 기업에서 820만 건을 빼낸 조직을 검거했고, SOCRadar는 국내 기업을 가장 많이 친 랜섬웨어 n0n이 9월 한 달 LLM API에 약 7,200달러를 썼다고 분석했다.

## 일반 보안

### PHP2Shell KEV 등재, 방화벽 25대 root 장악 체인 공개 (KEV 10/26, Dream 공개 10/28)

CISA가 10월 26일 PHP2Shell 두 건을 KEV에 올리고 연방 기관에 사흘 안에 조치하라고 했다.
이스라엘 보안업체 Dream은 중국 연계로 추정되는 공격자가 대형 벤더 방화벽의 PHP 8.0.30 기반 관리 웹 서버를 PHP2Shell로 뚫고, 리눅스 커널 권한 상승 Fragnesia로 root를 얻은 사례를 공개했다.
공격자는 관리 인터페이스가 노출된 방화벽 약 1만 9천 대 중 미국·일본·대만·한국의 240대를 골랐고, 미국 정부 관련 환경 3대를 포함해 25대를 장악했다. 역방향 SSH 터널로 내부 방화벽 관리 서버까지 들어가 AD 계정 열거와 패스워드 스프레이를 시도했다.
보안뉴스와 에스케어가 10월 29일 Shodan으로 집계한 결과, 8.2~8.5 국내 서버 중 패치된 비율은 27.3%, 8.1 이하를 포함한 전체로는 약 5.5%였다.

- **왜 중요한가**: 언어 런타임을 품은 어플라이언스는 PHP 공식 패치가 나와도 벤더 펌웨어가 나오기 전까지 막을 수 없다. 8.0처럼 공식 릴리스가 없는 버전이 장비 안에 박혀 있는 경우가 실제 공격 표적이 됐다.
- **CVE / CVSS / KEV**: CVE-2026-109618 · CVE-2026-109619 (PHP2Shell, 9.2) / KEV 등재 (2026-10-26) · CVE-2026-46300 (Fragnesia, 리눅스 커널 권한 상승, 7.8) / KEV 등재 (2026-10-28). 별도 RCE CVE-2026-115560은 10월 29일 기준 수정 버전 없음
- **출처**: [The Hacker News (Dream 분석)](https://thehackernews.com/2026/10/php2shell-attack-roots-25-servers.html) · [Help Net Security (KEV)](https://www.helpnetsecurity.com/2026/10/29/php2shell-fragnesia-vmware-esx-zero-day/) · [보안뉴스 (국내 패치율)](https://www.boannews.com/news/articleView.html?idxno=146873)

### Node2Shell(Brotli 디코더) 실제 악용 확인, KEV 등재 (10/27)

지난주 Node.js 보안 릴리스로 알려진 Brotli 디코더 범위 밖 쓰기가 실제 공격에 쓰이고 있다며 CISA가 10월 27일 KEV에 올렸다.
결함은 Node.js가 아니라 Google Brotli 라이브러리 자체에 있어, 이를 쓰는 HTTP 서버·클라이언트 전반이 영향을 받는다. Microsoft는 .NET 긴급 업데이트를 냈고, Palo Alto Networks PAN-OS와 Siemens 산업용 제품도 영향을 받았다.
패치가 어려우면 프록시나 방화벽에서 Brotli 압축 요청을 막거나 디코딩을 끄고, 패치 후에는 프로세스를 재시작하고 컨테이너 이미지를 다시 빌드해야 한다.

- **왜 중요한가**: 압축 라이브러리처럼 여러 언어와 제품에 정적으로 묻힌 구성요소는 SBOM 없이 영향 범위를 파악하기 어렵다. 이번 주 Siemens·PAN-OS 권고가 그 확산 경로를 보여 준다.
- **CVE / CVSS / KEV**: CVE-2026-111497 (Brotli 디코더 범위 밖 쓰기, 점수는 출처와 CVSS 버전마다 달라 적지 않았다) / KEV 등재 (2026-10-27, 연방 조치 기한 11/10)
- **출처**: [BleepingComputer](https://bleepingcomputer.com/news/security/cisa-warns-of-hackers-now-exploiting-critical-node2shell-flaw) · [Sophos](https://www.sophos.com/blog/node2shell-cve-2026-111497-in-active-exploitation) · [ASEC: Node2Shell 분석](https://asec.ahnlab.com/ko/96266/)

### Ivanti Connect Secure 3단계 체인, 완전 패치 장비에서 악용 (Ivanti 10/29, KEV 10/30)

Volexity는 10월 3일 당시 최신 패치가 적용된 22.8R2.4 장비가 UTA0576으로 명명한 공격자에게 뚫린 것을 확인했다.
공격자는 로그인 엔드포인트와 백엔드 CGI 라우팅의 처리 차이로 인증을 우회하고, ZIP 검증 전에 파일을 먼저 쓰는 업로드 처리기를 경쟁 조건으로 악용해 코드를 실행한 뒤, 특권 서비스 `dsinvoked`를 속여 root를 얻었다.
이후 장비 자격증명과 AD 서비스 계정으로 LAPS 암호와 BitLocker 복구 키를 조회했고, 웹셸 없이 HTTPS로만 명령을 주고받으며 디버그·감사 로그를 골라 지웠다.
Ivanti는 10월 29일 25.1.1.3과 22.8R2.6으로 남은 단계를 고쳤고, CISA는 다음 날 두 건을 KEV에 넣었다.

- **왜 중요한가**: 웹셸도 백도어도 남기지 않고 로그를 선택적으로 지우는 공격이라 장비 무결성 점검 도구만으로는 놓칠 수 있다. 장비가 조회한 AD 쿼리와 LAPS 접근 기록을 함께 봐야 한다.
- **CVE / CVSS / KEV**: CVE-2026-104935 (인증 우회·RCE, 기존 수정분) · CVE-2026-111357 (권한 상승) · CVE-2026-118527 (예측 가능한 파일명 업로드) / 111357과 118527 KEV 등재 (2026-10-30). 신규 두 건의 CVSS는 출처마다 달라 적지 않았다
- **출처**: [GBHackers (Volexity 분석 정리)](https://gbhackers.com/hackers-exploit-ivanti-connect-secure-zero-day-vulnerabilities/) · [Security Boulevard (Daily OT Security News 10/31)](https://securityboulevard.com/2026/10/daily-ot-security-news-october-31-2026/)

### 바이낸스 약 63억 달러 탈취, 북한 TraderTraitor 소행 추정 (10/29)

10월 29일 20시 5분(UTC)부터 약 20분 동안 바이낸스 지갑에서 10개 체인에 걸쳐 약 63억 6천만 달러가 빠져나갔다. TRM Labs는 2025년 Bybit 사건의 약 4배로, 기록상 최대 규모라고 밝혔다.
이더리움에서는 EIP-7702로 핫월렛을 공격자의 스위퍼 컨트랙트로 위임시키는 서명 50개를 논스별로 미리 받아 한 번에 실행했고, 나머지 체인은 정상 서명 전송으로 빠져나가 서명 인프라 자체가 장악된 것으로 보인다.
바이낸스는 개인 키 유출 증거는 없다고 했고, DevOps 엔지니어의 노트북 침해 가능성을 조사 중이라고 했지만 근본 원인은 아직 공개하지 않았다. 약 27억~30억 달러는 스테이블코인 발행사 등이 동결했다.

- **왜 중요한가**: 키를 훔치지 않고 "서명하는 시스템"을 장악해 미리 서명을 받아 두는 방식이다. 서명 승인 흐름과 이를 다루는 개발·운영자 단말이 거래소 보안의 실제 경계라는 점을 보여 준다.
- **CVE / KEV**: 해당 없음. 동결 금액은 출처마다 다르다(TRM 약 27억 달러, Bitdefender 인용 약 30억 달러)
- **출처**: [TRM Labs](https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history) · [Bitdefender](https://www.bitdefender.com/en-au/blog/hotforsecurity/binance-hack-6-3-billion-laptop-breach) · [BleepingComputer](https://bleepingcomputer.com/news/security/binance-links-63-billion-crypto-theft-to-compromised-devops-laptop)

### 국내 침해: 현대이지웰 회원 조회 API 악용, 한화시스템 협력사 계정 악용 (10/31, 10/30 보도)

복지포인트 쇼핑몰 현대이지웰은 10월 29일 밤 회원정보 조회 API에 비정상 외부 접근이 있었고, 이름·생년월일·성별·휴대전화·이메일·주소가 유출됐다고 밝혔다. 고객사 약 2,700곳, 이용자 약 340만 명 규모의 플랫폼이다.
한화시스템은 일부 계열사의 외부 접속 계정이 내부망 무단 접근에 쓰였고, ICT 부문 임직원 약 1,700명의 이름·연락처·사내 이메일이 담긴 서버가 영향을 받았다고 밝혔다. 방산·금융 계열사와는 무관하다고 했다.
안랩 ASEC은 10월 국내외 침해의 공통점을 공개 웹 서비스, 앱 백엔드 API, 외주 SaaS 같은 외곽 접점으로 정리했다.

- **왜 중요한가**: 두 건 모두 정상 API와 정상 계정을 통한 접근이다. 객체 단위 권한 검증과 협력사 계정의 접속 범위 제한이 없으면 경계 장비 패치만으로는 막을 수 없다.
- **CVE / KEV**: 공개된 CVE 없음
- **출처**: [보안뉴스 (현대이지웰)](https://www.boannews.com/news/articleView.html?idxno=146907) · [보안뉴스 (한화시스템)](https://www.boannews.com/news/articleView.html?idxno=146904) · [ASEC: 외곽 접점이 무너진 2026년 10월](https://asec.ahnlab.com/ko/96187/)

:::note[기타 일반 보안 (10/26 ~ 10/30)]
- Cisco Secure Firewall ASA·FTD에서 SSL VPN을 켠 장비를 재부팅시키는 결함이 악용돼 KEV에 올랐다. CVE-2026-76418 (8.6), KEV 등재 2026-10-29. [BleepingComputer](https://www.bleepingcomputer.com/news/security/cisco-warns-of-firewall-zero-day-exploited-to-crash-ssl-vpn-devices/)
- VMware ESX의 감사 로그 누락 결함 CVE-2026-41709 (2.7)가 KEV에 올랐다(10/28). 점수는 낮지만 CrowdStrike는 중국 연계 Warp Panda가 제로데이로 써서 흔적을 줄였다고 밝혔다. 7월에 이미 패치됐다. [The Hacker News](https://thehackernews.com/2026/10/china-linked-hackers-exploited-vmware.html)
- 이 밖에 KEV 신규: Adobe Commerce·Magento 위험 파일 업로드 CVE-2026-48356(10/27), GitLab 정수 오버플로 CVE-2026-97229(10/29, 소프트웨어 공급망 영역 참고). [Security Online 주간 CVE 리포트](https://securityonline.info/weekly-cve-report-oct-26-nov-1-2026)
- 미국 뉴멕시코대 보건과학센터가 사이버 사고로 구급차를 우회시키고 진료를 취소했다(10/26). [UNM HSC](https://hscnews.unm.edu/news/ambulance-traffic-diverted-clinical-appointments-cancelled-and-classes-cancelled-due-to-cybersecurity-issue-at-unm-hsc)
- KISA 보호나라는 10월 29일~30일 Palo Alto Networks, Synology, 다우기술, Sophos, Atlassian, Oracle, VMware, Linux, Cisco 보안 업데이트 권고 10건을 냈다.
:::

## OT/ICS · 제조 · 자동차

### Siemens 산업용 제품의 Node2Shell 영향: Industrial Edge, RUGGEDCOM APE1808 (SSA-443410·SSA-898633, 10/30)

Siemens가 Brotli 디코더 결함이 산업용 제품에 미치는 영향을 두 권고로 냈다.
Industrial Edge Hub와 Industrial Edge Management의 구성 앱 7종이 영향을 받는데, 클라우드 서비스는 10월 28일~29일에 고쳤지만 설치형 앱은 수정 버전이 없어 중지·제거 또는 방화벽·WAF로 막으라고 권고했다.
PAN-OS를 올린 RUGGEDCOM APE1808은 PAN-OS 수정 릴리스로 올리면 되고, Brotli 검사와 TLS 복호화가 켜진 경우에만 노출된다.
PHP2Shell 관련 SSA-566435도 10월 30일 1.4판으로 갱신됐다.

- **왜 중요한가**: IT 라이브러리 결함이 OT 엣지 관리 플랫폼과 변전소급 보안 장비까지 그대로 내려왔다. 수정 버전 없이 "앱을 끄라"는 권고는 현장에서 바로 쓰기 어려워 망 분리가 사실상 유일한 대책이다.
- **CVE / CVSS / KEV**: CVE-2026-111497 (Siemens 기준 v3.1 9.8, v4.0 9.2) / KEV 등재 (2026-10-27)
- **출처**: [Siemens SSA-443410](https://productcert.siemens.com/productcert/html/ssa-443410.html) · [Siemens SSA-898633](https://productcert.siemens.com/productcert/html/ssa-898633.html) · [Security Boulevard (Daily OT Security News 10/31)](https://securityboulevard.com/2026/10/daily-ot-security-news-october-31-2026/)

### EPICS Base 원격 취약점 4건 (ICSA-26-300-01, 10/27)

가속기·연구 시설과 일부 산업 현장에서 쓰는 오픈소스 제어 소프트웨어 EPICS Base 7.0.10 이하에서 취약점 4건이 나왔다.
CISA는 핵심 제조(Critical Manufacturing) 부문으로 분류했고, 7.0.11로 올리라고 권고했다.
SecurityWeek는 오래 숨어 있던 결함이라고 전했다.

- **왜 중요한가**: EPICS는 채널 액세스 프로토콜로 제어 변수를 네트워크에 노출하는 구조라 제어망 분리가 깨지면 원격 공격면이 넓다. 연구 시설 외 산업 현장 도입 여부도 자산 목록에서 확인할 필요가 있다.
- **CVE / CVSS / KEV**: CVE-2026-114595 · CVE-2026-114596 · CVE-2026-114597 · CVE-2026-114598 (CISA 기준 v3 9.8) / 미등재
- **출처**: [CISA ICSA-26-300-01](https://www.cisa.gov/news-events/ics-advisories/icsa-26-300-01) · [SecurityWeek](https://www.securityweek.com/long-hidden-flaws-patched-in-epics-research-facility-control-software/)

### Mitsubishi Electric ICONICS HMI·SCADA 제품군, 일부는 수정 계획 없음 (ICSA-26-300-02, 10/27)

GENESIS64, ICONICS Suite, Hyper Historian, MC Works64 등 Mitsubishi Electric·ICONICS의 HMI·SCADA 제품군에서 취약점 4건이 나왔다. 그중 하나는 2023년 libwebp 결함(CVE-2023-4863)이다.
ICONICS Suite 10.97.3·10.98과 GENESIS 11.04에서 고쳤지만, MC Works64, GENESIS32, BizViz는 수정 계획이 없고 완화 조치만 제공된다.

- **왜 중요한가**: 3년 전 브라우저 이미지 라이브러리 결함이 이제야 SCADA 제품에서 정리됐다. 산업용 소프트웨어 안 서드파티 구성요소의 패치 지연이 얼마나 긴지 보여 준다.
- **CVE / CVSS / KEV**: CVE-2023-4863 · CVE-2026-16436 · CVE-2026-16437 · CVE-2026-16438 (v4 7.1 ~ 9.4, 개별 점수는 확인하지 못했다) / CVE-2023-4863만 기존 KEV 등재
- **출처**: [CISA ICSA-26-300-02](https://www.cisa.gov/news-events/ics-advisories/icsa-26-300-02) · [Mitsubishi Electric PSIRT 2026-006](https://www.mitsubishielectric.com/psirt/vulnerability/pdf/2026-006_en.pdf)

### CONTEC M2M 컨트롤러·게이트웨이·CAN 인터페이스, PHP2Shell 수정 (10/30)

일본 CONTEC이 CONPROSYS Linux SDK, M2M 컨트롤러·게이트웨이, PAC 펌웨어에 PHP2Shell 수정을 냈다.
CPS-MC341 등은 4.2.0, CPS-PC341 등은 3.1.0, CAN-2-USB와 CAN-2-WF는 2.30으로 올리면 되고, CPS-TM341은 11월 6일 수정 예정이다.
CONTEC 제품에서 실제 악용이 확인된 것은 아니다.

- **왜 중요한가**: 웹 관리 화면에 PHP를 쓰는 소형 산업용 게이트웨이와 CAN 인터페이스까지 PHP2Shell 영향권이다. CAN 장비는 차량·설비 시험 환경에 흔해 자동차 개발 현장도 점검 대상이다.
- **CVE / CVSS / KEV**: CVE-2026-109618 · CVE-2026-109619 (9.2) / KEV 등재 (2026-10-26)
- **출처**: [CONTEC 공지](https://www.contec.com/info/2026/26102201/) · [Security Boulevard (Daily OT Security News 10/30)](https://securityboulevard.com/2026/10/daily-ot-security-news-october-30-2026/)

:::note[기타 OT · 제조 · 자동차 (10/27 ~ 10/30)]
- Hitachi Energy TRO600: 인증 없는 임의 파일 읽기와 포트 포워딩 우회. CVE-2026-10756 · CVE-2026-106087 (v3.1 7.5), 9.2.2.1·9.1.2.0에서 수정 (ICSA-26-302-02)
- Hitachi Energy CoreTec4·5 변압기 모니터링: OS 명령 주입과 리눅스 권한 상승 Dirty Frag. CVE-2026-13162 · CVE-2026-43284, CoreTec5 5.0.0에서 수정, CoreTec4는 단종 (ICSA-26-302-03)
- Siemens Mendix SAML 모듈: 캡처·재전송 인증 우회 CVE-2026-89209, 4.2.4(Mendix 10·11)와 3.6.29(Mendix 9)에서 수정 (ICSA-26-302-01)
- 자동차: QNX의 Under the Hood 2026 조사에서 차량 소프트웨어 개발자 83%가 3년 안에 SDV가 주요 공격 표적이 된다고 답했다(10/28). 이번 주 차량 자체의 공식 취약점 권고나 침해 사고는 찾지 못했다. [TheAutoExec](https://www.theautoexec.com/theautoexec/2026/10/28/four-fifths-of-automotive-software-developers-expect-their-cars-to-be-attacked-by-hackers-within-three-years/)
- [Security Boulevard (Daily OT Security News 11/01)](https://securityboulevard.com/2026/11/daily-ot-security-news-november-01-2026/)
:::

:::note[이번 주에서 뺀 항목]
- Forescout의 인터넷 노출 냉장 컨트롤러 연구(10/22)와 Kiloview E3 권고(10/22)는 지난주 공개분이라 뺐다.
- OT-ISAC의 아태 지역 정책 변화 정리(Industrial Cyber 10/26)는 인용된 제도 자체가 7월~10월 중순 발표분이라 뺐다.
:::

## AI 보안

### 국내 첫 생성형 AI 해킹 조직 검거: ARTEX로 90개 기업, 820만 건 (10/26 발표)

서울경찰청 사이버수사과가 생성형 AI와 자율 침투 도구 ARTEX로 약 13개월 동안 국내 기업 약 90곳에서 개인정보와 내부 자료 약 820만 건을 빼낸 조직을 검거했다.
총책(32세)은 10월 15일 체포돼 23일 송치됐고, 텔레그램으로 범행을 지시한 24세 남성을 포함해 7명이 구속됐다.
처음엔 자동화 취약점 스캐너를 쓰다가 8월 31일 이후 AI로 약 60곳을 뚫었고, 38곳을 상대로 3억 6천만 원을 요구했다. 피해 기업 75곳은 유출을 신고하지 않았다.
경찰은 52만 건 수사 자료와 수천만 줄의 해킹 로그를 자체 AI 분석 도구로 분석해 4개월 만에 사건을 마무리했다.

- **왜 중요한가**: 정규 IT 교육이 없는 공격자가 AI로 공격 규모를 키운 사례가 수사 기록으로 확인됐다. 피해 기업 대부분이 신고하지 않았다는 점도 탐지 공백을 보여 준다.
- **CVE / KEV**: 해당 없음
- **출처**: [파이낸셜뉴스](https://www.fnnews.com/news/202610261202284457) · [ASEC: 외곽 접점이 무너진 2026년 10월](https://asec.ahnlab.com/ko/96187/)

### 랜섬웨어 n0n, 9월 한 달 LLM API에 약 7,200달러 (SOCRadar 분석, 10/31 보도)

9월에 처음 나타난 n0n 랜섬웨어는 한 달 만에 피해자 93곳을 올렸고, 10월에는 해운·항만 업체 12곳과 한진정보통신 등 국내 기업 13곳을 공격했다. ransomware.live 기준 올해 국내 기업을 가장 많이 공격한 그룹이다.
SOCRadar는 이 그룹이 오픈소스 코딩 에이전트 Opencode에 7개 공급자의 모델 154개를 등록하고, 검열 해제 모델과 자체 호스팅 모델까지 섞어 공격 스크립트 작성과 디버깅, 데이터 탈취 자동화에 썼다고 분석했다.
다만 AI가 공격을 스스로 수행한 것이 아니라 사람이 지휘하고 AI는 도구 개발을 도왔다고 봤다. 초기 침투는 노출된 자격증명이었다.

- **왜 중요한가**: 공격용 AI 비용이 월 1천만 원 수준으로 구체화됐다. 여러 공급자 모델을 섞는 구조는 지난주 CyberCartel 사례와 같아, 단일 모델의 거부 정책만으로는 막기 어렵다는 점을 다시 보여 준다.
- **CVE / KEV**: 해당 없음. 기사 안의 Qilin 비교 수치는 국내 기준(13건 대 10건)만 일관성이 있어 그 수치만 옮겼다
- **출처**: [보안뉴스](https://www.boannews.com/news/articleView.html?idxno=146900)

### Dream, PHP2Shell 공격 인프라에서 Claude Code와 DeepSeek·Kimi 기반 공격 플랫폼 확인 (10/28)

일반 보안 영역의 방화벽 25대 장악 사건에서 Dream은 공격 인프라에 Anthropic Claude Code와 DeepSeek·Kimi 모델을 설정한 AI 공격 플랫폼, FOFA API 키가 있었다고 밝혔다.
약 40개 스크립트의 코드 구조와 주석으로 볼 때 AI 보조 개발 흔적이 뚜렷하다고 봤다.
공격자는 공개 PoC가 아닌 비공개 맞춤 익스플로잇으로 PHP 세션 업로드 진행률 기능을 노렸다.

- **왜 중요한가**: 패치 공개 이틀 만에 특정 벤더 장비용 맞춤 익스플로잇을 만들어 표적 240대를 고른 속도는 AI 보조 개발과 맞물린다. 지난주 다룬 Time-to-Exploit 단축이 실제 국가 연계 공격에서 확인됐다.
- **CVE / KEV**: 일반 보안 항목 참고
- **출처**: [The Hacker News](https://thehackernews.com/2026/10/php2shell-attack-roots-25-servers.html)

### Embrace: AI 개발 도구 내장 브라우저의 과도한 권한, 5개 제품 (10/29)

Forever Security가 Cursor, GitHub Copilot 앱, Claude Desktop, OpenAI Codex, VS Code의 내장 브라우저 결함을 묶어 Embrace라는 이름으로 공개했다.
Cursor에서는 내장 브라우저에 띄운 페이지가 에이전트 작성기를 호출해 숨은 프롬프트 인젝션으로 코드를 실행할 수 있었고, Claude Desktop과 VS Code에서는 웹 워커가 폴더 제한을 우회해 임의 파일을 읽을 수 있었다.
Cursor와 Copilot은 고쳤지만 Codex와 VS Code는 공개 시점에 미수정이었고, Microsoft는 유효하지 않은 보고로 분류했다.

- **왜 중요한가**: AI 도구의 내장 브라우저는 일반 브라우저의 샌드박스 모델 밖에서 에이전트·파일 시스템과 연결된다. 에이전트에게 웹을 보여 주는 기능 자체가 인젝션과 파일 유출 경로가 된다.
- **CVE / KEV**: 기사에 CVE 번호 없음 / 해당 없음
- **출처**: [The Register](https://theregister.com/security/2026/10/29/researchers-find-bugs-in-5-ai-developer-tools-with-openai-and-microsoft-flaws-still-unpatched/5306508)

:::note[이번 주에서 뺀 항목]
- CERT-In의 "평가 중인 AI 에이전트가 인도 기관 실제 시스템에 접근" 권고는 10월 15일 발표분이라 뺐다. [The Hacker News](https://thehackernews.com/2026/10/cert-in-warns-ai-agents-accessed.html)
- GitHub Copilot의 `.mcp.json` 확인 우회 CVE-2026-103572는 10월 13일 공개분이라 뺐다. CSA가 10월 22일 OpenCode 건과 묶어 연구 노트를 냈다.
:::

## 소프트웨어 공급망 보안

### Cursor 마켓플레이스, 변조된 Claude Code 확장을 정상 업데이트로 배포 (10/29)

10월 29일 새벽 2시 27분부터 오후 1시 35분(PT)까지 Cursor 확장 마켓플레이스에서 Anthropic Claude Code 확장 2.1.312와 2.1.313이 악성으로 변조된 채 배포됐다.
악성 코드는 호스트 정보를 보내고, `authorized_keys`에 `svc-telemetry` 주석이 붙은 공격자 SSH 키를 넣고, 로컬 SSH를 켜 역방향 터널을 열려 했다. macOS LaunchAgent와 Windows 예약 작업 `SysMon`으로 지속성도 만들었다.
Cursor는 최대 5,000명이 영향을 받았다고 밝혔고, 마켓플레이스를 내렸다가 재구축했다. Anthropic은 자사 시스템은 침해되지 않았다고 했다. 변조 경위는 공개되지 않았다.

- **왜 중요한가**: 개발자 단말에서 높은 권한으로 돌아가는 AI 코딩 확장이 공식 원본이 아닌 제3자 마켓플레이스 경로에서 변조됐다. 확장 자동 업데이트는 패키지 레지스트리와 같은 수준의 공급망 위험이다.
- **CVE / KEV**: 해당 없음. 지표: IP `134.209.82.225`(TCP 22, 8099), `~/.config/.smt`, `com.apple.sysmond.plist`, 예약 작업 `SysMon`. 확장 삭제만으로는 부족하고 SSH 키·지속성 제거와 자격증명 교체가 필요하다
- **출처**: [Cursor 보안 공지](https://cursor.com/blog/claude-code-extension-security-notice) · [SafeDep 10월 사고 정리](https://safedep.io/october-2026-security-incident-review/)

### GitLab 정수 오버플로 CVE-2026-97229 실제 악용, KEV 등재 (10/29)

CI/CD 설정에 넣은 조작 정규식으로 인증 없이 코드를 실행하는 GitLab 결함이 KEV에 올랐다. 10월 12일 패치분이고, 연방 기관 조치 기한은 11월 1일이었다.
Alpine Linux는 10월 20일~21일 자사 GitLab에 대한 익스플로잇 시도로 워커가 8번 크래시됐고, 공격자가 자사 GitLab 컨테이너 이미지를 내려받았다고 밝혔다. 침해 증거는 없었지만 인스턴스를 처음부터 다시 만들었다.
지난주 다룬 CVE-2026-110264는 별개 결함이라 97229 패치만으로는 막히지 않는다.

- **왜 중요한가**: 배포판 프로젝트 같은 공급망 상류의 GitLab이 실제 표적이 됐다. 두 정규식 결함을 모두 덮는 버전인지 확인해야 한다.
- **CVE / CVSS / KEV**: CVE-2026-97229 (정수 오버플로, 10.0) / KEV 등재 (2026-10-29)
- **출처**: [The Hacker News](https://thehackernews.com/2026/10/cisa-adds-actively-exploited-gitlab-rce.html) · [Cyber Security News](https://cybersecuritynews.com/gitlab-integer-overflow-vulnerability-exploited/)

### npm·PyPI 악성 패키지 106개, 사흘 사이 (10/26 ~ 10/28)

GitHub 권고 DB 기준 10월 26일~28일 악성 패키지 권고 112건, 패키지 106개(npm 96, PyPI 10)가 나왔다.
내부 패키지처럼 보이는 스코프와 부풀린 버전 번호로 의존성 혼동을 노린 비콘, 설치 스크립트로 Monero 채굴기를 심는 패키지, 설치한 사용자의 npm 계정으로 새 패키지를 올리려는 자기 전파형 패키지가 섞여 있었다.
PyPI에서는 `claudeopus` 계열 이름으로 AI 모델을 사칭해 이미지 안에 인포스틸러를 숨기고 Polygon 블록체인 거래로 C2 주소를 찾는 패키지가 보고됐다.

- **왜 중요한가**: AI 모델명을 쓴 타이포스쿼팅과 블록체인 기반 C2처럼 차단하기 어려운 기법이 일상화됐다. 사내 스코프 이름을 공개 레지스트리에 선점해 두는 것도 의존성 혼동 방어책이다.
- **CVE / KEV**: 해당 없음. OSV 번호 MAL-2026-18316, MAL-2026-18320, MAL-2026-18321, MAL-2026-18356 등
- **출처**: [Safeguard](https://safeguard.sh/resources/blog/106-malicious-npm-and-pypi-packages-october-2026-what-they-did-and-how-to-block-the-next-batch)

:::note[기타 공급망 (10/26 ~ 10/29)]
- Polymarket: 침해된 외부 공급자가 국제 사이트에 악성 JavaScript를 넣어 이용자 지갑을 털었다. 거래를 멈추고 390만 달러를 돌려주겠다고 했다(10/29). [The Block](https://www.theblock.co/news/defi/2026-10-29-polymarket-exploit-2-5-million-cancel-only-mode-432158)
- Coinbase: 분석 도구 공급자 Amplitude 침해로 일부 고객 연락처가 노출됐다(10/28). [Decrypt](https://decrypt.co/382009/coinbase-customer-data-hit-analytics-vendor-breach-funds-not-impacted)
- Warp: 인프라 내 공급자를 통한 침입으로 사용자 약 1%의 에이전트 판단 로그와 텔레메트리가 노출됐을 수 있다고 밝혔다(10/26 공개, 공급자 미공개).
:::

:::note[이번 주에서 뺀 항목]
- LiteLLM 1.107.0(10/21), testmetest npm 웜(10/22), hugo-paper·mevn-cli 위조 커밋(10/20)은 지난주 공개분이라 뺐다. LiteLLM은 W43에서 다뤘다.
:::

## 깊게 파볼 주제

### 주제 1. Node2Shell: 압축 라이브러리 한 곳의 결함이 Node.js, .NET, PAN-OS, Siemens로 번진 경로

**추천 이유**

- 한 C 라이브러리의 범위 밖 쓰기가 언어 런타임, 방화벽 OS, 산업용 엣지 플랫폼으로 일주일 사이 퍼졌다. "이 결함이 우리 어디에 있나"를 SBOM과 바이너리 분석으로 찾는 연습에 좋은 사례다.
- HTTP 계층의 `Content-Encoding` 처리라는 흔한 기능이 인증 전 공격면이 된다는 점에서, 웹 프록시·WAF·API 게이트웨이 운영자에게 바로 적용되는 주제다.

**무엇을 보면 좋을지**

- Brotli 저장소의 `c/dec/decode.c` 수정 커밋 diff: 어떤 반환값을 검사하지 않아 디코더 상태가 어긋났는지, 수정 후 어떤 경계 검사가 추가됐는지 본다.
- 영향 범위 추적: 자기 환경의 컨테이너 이미지와 바이너리에서 Brotli 정적 링크 여부를 Syft·Grype 같은 SBOM 도구로 찾아보고, 공식 패키지와 번들 사본을 구분한다.
- PoC 공개 상태: 이번 주 기준 신뢰할 수 있는 공개 PoC나 Vulhub 환경은 확인하지 못했다. 대신 패치 전후 Node.js 공식 Docker 이미지에서 퍼저(libFuzzer 기반 Brotli 디코더 타깃)를 돌려 크래시 재현 여부를 비교하는 방식이 안전하다.
- 방어 설정: 리버스 프록시에서 요청 본문의 Brotli 압축을 거부하는 규칙, 패치 후 프로세스 재시작과 이미지 재빌드 확인 절차
- ASEC의 Node2Shell 분석 글과 Siemens SSA-898633의 노출 조건(Brotli 검사 + TLS 복호화)을 비교해 "취약하지만 노출되지 않는" 조건을 정리한다.

:::warning
퍼징과 재현은 반드시 격리된 로컬 랩에서만 한다. 인터넷에 연결되지 않은 가상 머신과 직접 만든 테스트 서버만 대상으로 하고, 외부 서비스에 조작된 압축 데이터를 보내지 않는다. 실습 원칙은 [AI 취약점 진단 실습](/lab/ai-pentest/approach-and-ethics)을 따른다.
:::

**관련 개념**

- MITRE ATT&CK: T1190 (Exploit Public-Facing Application), T1203 (Exploitation for Client Execution), T1068 (Exploitation for Privilege Escalation)
- CWE-787 (Out-of-bounds Write), CWE-252 (Unchecked Return Value), SBOM과 VEX, 번들 의존성(vendored dependency) 관리

### 주제 2. Cursor 마켓플레이스 악성 확장: IDE 확장 공급망과 개발자 단말 침해 탐지

**추천 이유**

- 정상 이름, 정상 업데이트 경로, 11시간이라는 짧은 노출로 최대 5,000명을 건드린 사건이다. 공개된 IoC가 구체적이라 탐지 규칙과 점검 스크립트를 직접 만들어 보기 좋다.
- AI 코딩 확장은 소스, 클라우드 자격증명, 에이전트 권한이 모이는 개발자 단말에서 돈다. 지난주 LiteLLM, 이번 주 Embrace와 함께 "AI 개발 도구가 새 공급망 경계"라는 흐름을 정리할 수 있다.

**무엇을 보면 좋을지**

- Cursor 공지의 타임라인과 IoC: SSH 키 주석, 파일 경로, 예약 작업 이름, 네트워크 지표를 EDR·Sysmon 탐지 규칙으로 옮겨 본다.
- 지속성 기법 점검: 자기 랩 VM에서 `authorized_keys` 변경, LaunchAgent 생성, 예약 작업 생성을 감시하는 osquery 쿼리나 Sigma 규칙을 작성한다.
- 확장 통제: VS Code 계열 에디터의 확장 허용 목록, 자동 업데이트 끄기, 확장 게시자 검증 옵션, 오픈 VSX와 공식 마켓플레이스의 차이를 비교한다.
- 대응 절차: 확장 삭제만으로 끝나지 않는 이유(SSH 키, 지속성, 이미 나간 자격증명)를 IR 체크리스트로 정리한다.

:::warning
악성 확장 샘플을 내려받아 설치하지 않는다. 지속성 탐지 실습은 직접 만든 무해한 키와 예약 작업으로, 격리된 로컬 랩의 가상 머신에서만 한다. 실습 원칙은 [AI 취약점 진단 실습](/lab/ai-pentest/approach-and-ethics)을 따른다.
:::

**관련 개념**

- MITRE ATT&CK: T1195.002 (Compromise Software Supply Chain), T1098.004 (SSH Authorized Keys), T1543.001 (Launch Agent), T1053.005 (Scheduled Task), T1572 (Protocol Tunneling), T1082 (System Information Discovery)
- 확장 마켓플레이스 신뢰 모델, 코드 서명과 게시자 검증, 개발자 단말 EDR

## 이번 주 키워드

| 키워드 | 한 줄 설명 |
|---|---|
| **Node2Shell** | Google Brotli 디코더의 범위 밖 쓰기 CVE-2026-111497. Node.js에서 처음 알려졌지만 .NET, PAN-OS, Siemens 제품까지 영향을 받고 10월 27일 KEV에 올랐다. |
| **Fragnesia** | 리눅스 커널 로컬 권한 상승 CVE-2026-46300. PHP2Shell과 엮여 방화벽 관리 서버 root 장악에 쓰였다. |
| **EIP-7702 위임 악용** | 이더리움 계정을 스마트 컨트랙트 코드에 위임하는 기능을 미리 받은 서명으로 악용해 지갑 잔액을 쓸어 가는 방식(예: 바이낸스 탈취). |
| **Embrace** | AI 개발 도구 내장 브라우저가 일반 브라우저보다 넓은 권한을 가져 인젝션과 파일 읽기로 이어지는 취약점 유형을 Forever Security가 붙인 이름. |
| **Dependency Confusion** | 사내 패키지와 같은 이름을 공개 레지스트리에 더 높은 버전으로 올려 빌드가 악성 패키지를 받게 만드는 공격. |

## 참고

- CISA 웹사이트(KEV 알림, ICS 권고 원문)는 이번 실행에서 직접 열리지 않았다. KEV 등재일은 Security Online 주간 CVE 리포트, Sherlock Forensics 주간 정리, The Hacker News, BleepingComputer, Help Net Security 보도로 교차 확인했다. 확인한 KEV 신규는 10/26 2건, 10/27 2건, 10/28 2건, 10/29 2건, 10/30 2건이다.
- ICS 권고 번호와 내용은 Security Boulevard의 Daily OT Security News(10/29 ~ 11/01)로 확인했다. Hitachi Energy 권고의 수정 버전은 두 날짜 요약이 서로 달라(10/30은 수정 버전 명시, 11/01은 미기재) 10/30 요약을 따랐다.
- KISA 보호나라는 보안공지 목록 첫 페이지(10/29 ~ 10/30 게시 10건)를 직접 확인했다. 안랩 ASEC은 10/28 ~ 10/30 게시글 7건 목록과 Node2Shell 분석, 10월 침해 동향 글을 근거로 썼다.
- 보안뉴스는 메인 페이지 목록과 개별 기사(146873, 146900, 146904, 146907)를 직접 확인했다. 바이낸스 관련 보안뉴스 기사(146909, 146912)는 게시일이 표시되지 않아 근거로 쓰지 않았다.
- NVD와 GitHub Security Advisories는 직접 조회하지 못했다. 악성 패키지 수치는 GitHub 권고 DB를 집계한 Safeguard 글을 근거로 했다.
- BleepingComputer의 바이낸스 기사는 직접 열리지 않아 TRM Labs 원문과 Bitdefender 정리를 근거로 했다. 근본 원인(DevOps 노트북)은 조사 중인 가능성일 뿐 확정이 아니다.
- 자동차 분야는 이번 주 공개된 차량 자체의 취약점이나 침해 사고를 찾지 못했다. QNX 설문과 CAN 인터페이스를 포함한 CONTEC 권고만 넣었다.
