---
title: 주간 보안 브리핑 2026-W41 (10월 5일 ~ 10월 11일)
description: AI 에이전트를 쓴 국내 은행 연쇄 침해, FortiBleed 경보, GhostAction 재확산 등 10월 첫째 주 보안 이슈 정리
authors: [inseok]
toc_max_heading_level: 2
tags: [weekly, security, vulnerability, incident, ot, ai, supply-chain]
---

AI 에이전트로 국내 은행 여러 곳이 연달아 털렸고, 취약점 없이 비밀번호만으로 FortiGate 8.6만 대가 장악됐다.
GitHub 계정을 탈취해 CI/CD 비밀정보와 AI API 키를 함께 노리는 공급망 공격도 다시 퍼졌다.

{/* truncate */}

:::info[대상 기간]
2026-10-05(월) ~ 2026-10-11(일), KST · ISO 2026-W41

공개 날짜가 이 기간 안에 있는 것만 넣었다. 같은 기간에 진행 중이던 사건은 날짜를 따로 표시했다.
:::

## 이번 주 한눈에 보기

1. **AI 에이전트로 국내 은행 연쇄 침해**: 중국산 오픈소스 AI 침투테스트 도구 ARTEX와 Claude Code를 쓴 공격자가 신한·KB국민·하나은행 등의 직원·협력사용 시스템을 털었다. CrowdStrike가 노출된 AI 세션 로그를 근거로 분석을 냈다.
2. **FortiBleed 경보 (FBI·비밀경호국)**: 취약점이 아니라 재사용된 비밀번호와 오프라인 해시 크래킹으로 FortiGate 약 8.6만 대가 장악됐다. 랜섬웨어 초기 침투 경로로도 쓰이고 있다.
3. **GhostAction 재확산 + Shai-Hulud 변종**: 탈취한 GitHub 계정으로 수만 개 저장소에 비밀정보를 훔치는 워크플로를 심었고, AI 샌드박스 SDK `tensorlake` npm 패키지도 웜에 감염됐다.

## 일반 보안

### CISA KEV, 10년 묵은 취약점 5개 한꺼번에 등재 (10/8)

CISA가 ProFTPD, ISC BIND, Apache Struts, ONLYOFFICE Docs, Strapi의 2015~2023년 취약점 5개를 KEV에 넣었다.
중국 Integrity Technology Group과 연계된 스캐닝·익스플로잇 도구(Microscan, FishHub) 활동이 배경으로 거론된다.
신규 제로데이가 아니라 패치되지 않은 레거시를 노린 대량 스캐닝이라는 점이 핵심이다.

- **왜 중요한가**: 오래된 내부 FTP·DNS·Struts 앱 같은 "잊힌 자산"이 국가 배후 공격자의 실제 침투 경로로 쓰이고 있다.
- **CVE / CVSS / KEV**: CVE-2015-3306 (ProFTPD mod_copy, 10.0) · CVE-2015-5477 (BIND TKEY DoS) · CVE-2016-3081 (Struts S2-032, 8.1) · CVE-2021-3199 (ONLYOFFICE 경로 탐색, 9.8) · CVE-2023-22894 (Strapi 평문 저장). 5개 모두 KEV 등재 (2026-10-08). BIND와 Strapi의 CVSS는 출처마다 달라 적지 않았다.
- **출처**: [DEV Community](https://dev.to/devaland/actively-exploited-this-week-5-new-cisa-kev-entries-5-october-to-11-october-2026-2m9o) · [SC Media](https://www.scworld.com/brief/cisa-adds-five-vulnerabilities-to-exploited-list-amid-china-linked-cyber-espionage-concerns) · [CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)

### FortiBleed: 비밀번호 재사용으로 FortiGate 8.6만 대 장악 (10/6 경보)

FBI와 미국 비밀경호국이 인터넷에 노출된 FortiGate 방화벽과 SSL VPN을 노린 자격증명 탈취 캠페인을 경고했다.
공격자는 인포스틸러 로그로 얻은 계정을 넣어 보고, 레거시 SHA-256 관리자 해시를 GPU로 크래킹한다.
들어간 뒤에는 관리자 계정을 새로 만들거나 기존 계정을 지워 소유자를 잠가 버린다.
SOCRadar는 이 경로로 랜섬웨어가 최소 12건 배포된 것을 확인했다.

- **왜 중요한가**: CVE가 없어서 "패치하면 끝"이 통하지 않는다. 비밀번호 해시 형식을 PBKDF2로 바꾸고 계정을 정리해야 쫓아낼 수 있다.
- **CVE / KEV**: 해당 없음 (자격증명 기반 공격). 관련 랜섬웨어: INC/Lynx, Payload 계열
- **출처**: [FBI IC3 공동 권고](https://www.ic3.gov/CSA/2026/261006.pdf) · [eSecurity Planet](https://www.esecurityplanet.com/news/news-fbi-fortibleed-attacks-fortinet/)

### 일본 IDC Frontier 클라우드 랜섬웨어, 고객 495곳 중단 (10/7)

소프트뱅크 자회사 IDC Frontier의 IDCF Cloud 동일본 리전 1이 10월 7일 새벽 랜섬웨어에 당해 리전째 격리됐다.
이바라키현과 현 경찰 웹사이트가 내려갔고, 닛스이(Nissui) 물류 자회사는 전국 출하에 차질을 빚었다.
공격 그룹은 아직 확인되지 않았다.

- **왜 중요한가**: 클라우드 사업자 한 곳이 당하면 지자체부터 제조·물류 공급망까지 한꺼번에 멈추는 집중 위험을 보여 준다.
- **출처**: [Tech Insider](https://tech-insider.org/idcf-cloud-ransomware-attack-495-clients-2026)

### 오사카공립대 랜섬웨어 (10/5) · ASOS 앱 푸시 해킹 (10/6)

오사카공립대는 서버 약 500대가 멈춘 원인을 랜섬웨어로 보고 10월 8일까지 휴강했다. 현지 보도로는 백업 데이터 상당 부분도 함께 암호화됐다.
영국 패션 플랫폼 ASOS에서는 외부 고객 커뮤니케이션 플랫폼이 뚫려 사용자들에게 "ASOS HACKED" 푸시 알림이 갔고, 주가가 약 10% 떨어졌다.

- **왜 중요한가**: 백업 격리, 그리고 푸시·메일 같은 SaaS 연동 계정의 권한 관리가 실제 피해 규모를 가른다.
- **출처**: [The Record](https://therecord.media/osaka-university-cancels-classes-ransomware) · [BleepingComputer](https://www.bleepingcomputer.com/news/security/asos-confirms-data-breach-after-hacked-in-app-notifications/)

### 랜섬웨어 동향: Everest · The Gentlemen · SafePay (10/9 리포트)

데이터 탈취와 암호화를 함께 쓰는 이중 협박이 기본값이 됐다.
Everest는 일본 IT 기업 데이터 약 128GB를 공개했고, 제조업을 주요 타깃으로 삼으며 초기 침투 브로커 역할로도 넓혀 가고 있다.
SafePay는 태국 화학 제조사 데이터를 공개했는데, 이 그룹은 VPN 약점과 자격증명 탈취를 자주 쓴다.

- **왜 중요한가**: 제조업과 VPN 계정이라는 조합이 계속 반복된다. FortiBleed와 같은 맥락이다.
- **출처**: [CYFIRMA Weekly Intelligence Report](https://www.cyfirma.com/news/weekly-intelligence-report-9-oct-2026/)

## OT/ICS · 제조 · 자동차

### lwIP SMTP 클라이언트 버퍼 오버플로 (ICSA-26-279-02, 10/6)

임베디드 기기에 널리 쓰이는 경량 TCP/IP 스택 lwIP의 SMTP 클라이언트에서 입력 길이를 확인하지 않는 버퍼 복사 취약점이 나왔다.
기기를 다운시킬 수 있고, 조건이 맞으면 원격 코드 실행까지 가능하다. 9월 22일 lwIP 관련 권고(MQTT 등)에 이어 또 나왔다.

- **왜 중요한가**: lwIP는 PLC, 센서, 게이트웨이 펌웨어에 들어가는 "보이지 않는 부품"이다. 우리 장비가 이 스택을 쓰는지 SBOM으로 확인해야 하는 전형적인 사례다.
- **CVE / CVSS / KEV**: CVE-2026-15340 / 9.8 / 미등재
- **출처**: [CISA ICSA-26-279-02](https://www.cisa.gov/news-events/ics-advisories/icsa-26-279-02)

### openPDC · openHistorian 역직렬화 · 하드코딩 자격증명 (ICSA-26-281-02, 10/8)

전력망 위상측정(PMU) 데이터 수집에 쓰는 Grid Protection Alliance의 오픈소스 openPDC와 openHistorian에서 취약점 6개가 공개됐다.
신뢰할 수 없는 데이터의 역직렬화, 하드코딩된 자격증명, 안전하지 않은 리플렉션, SSRF가 들어 있다.

- **왜 중요한가**: IT 웹 앱에서 익숙한 버그(역직렬화, SSRF)가 에너지 OT에 그대로 있다. IT 취약점 지식이 OT로 바로 이어지는 좋은 학습 소재다.
- **CVE / CVSS / KEV**: CVE-2026-100730 (역직렬화, 9.8) · CVE-2026-105278 (하드코딩 자격증명, 9.8) · CVE-2026-104629 (Unsafe Reflection, 8.8) 외 3건 / 미등재
- **출처**: [CISA ICSA-26-281-02](https://www.cisa.gov/news-events/ics-advisories/icsa-26-281-02)

### Red Lion N-Tron 700 산업용 스위치 관리자 권한 탈취 (ICSA-26-281-01, 10/8)

제조 현장에서 쓰는 N-Tron 700 시리즈 관리형 스위치에서 취약점 7개가 나왔다.
하드코딩 자격증명, 인증 누락, 복호화 가능한 비밀번호 저장, 무결성 검증 없는 코드 다운로드가 포함된다.
공격자는 설정 파일을 열람·수정·업로드할 수 있고, 특정 URL 접속만으로 스위치를 재부팅시킬 수도 있다.

- **왜 중요한가**: 라인 네트워크 스위치를 잃으면 제어 트래픽이 끊기거나 조작될 수 있다. 대상 분야에 Critical Manufacturing이 명시돼 있다.
- **CVE / CVSS / KEV**: CVE-2026-33367 (인증 누락, 8.1) · CVE-2026-39460 (8.1) · CVE-2026-39453 (8.3) · CVE-2026-29797 (7.1) 외 / 미등재
- **출처**: [CISA ICSA-26-281-01](https://www.cisa.gov/news-events/ics-advisories/icsa-26-281-01)

### Hitachi Energy RTU500 단종 펌웨어 (ICSA-26-279-06, 10/6)

Dragos가 제보한 건으로, 단종된 RTU500 CMU 펌웨어 9.x에서 인증 누락, 경로 탐색, 무결성 검증 없는 코드 다운로드가 확인됐다.
2010년과 2014년에 나온 오래된 CVE도 함께 묶였다. 같은 날 Asset Suite(인증 없는 서블릿)와 SOI(ActiveMQ RCE) 권고도 나왔다.

- **왜 중요한가**: 변전소 RTU는 10~20년씩 운영된다. "단종이라 패치 없음" 상황에서 네트워크 분리와 모니터링으로 버텨야 하는 OT의 현실을 보여 준다.
- **CVE / CVSS / KEV**: CVE-2026-8065 (9.1) · CVE-2026-8066 (9.1) · CVE-2010-2965 (9.8) 외 / 미등재
- **출처**: [CISA ICSA-26-279-06](https://www.cisa.gov/news-events/ics-advisories/icsa-26-279-06)

### 자동차: Android Automotive OS 10월 보안 업데이트 (10/5)

Google이 AAOS 10월 보안 공지를 냈다. System 구성요소에서 권한 상승(EoP) 취약점 5개(모두 High)를 고쳤다.
가장 심각한 건은 추가 권한도, 사용자 조작도 없이 로컬에서 권한을 올릴 수 있다.

- **왜 중요한가**: 인포테인먼트(IVI)에서 권한을 올리는 것은 차량 내부 네트워크로 가는 첫 단계다. OEM이 실제 차량에 이 패치를 얼마나 빨리 OTA로 내보내는지가 관전 포인트다.
- **CVE / CVSS / KEV**: CVE-2026-28625, CVE-2026-28640, CVE-2026-28641, CVE-2026-28647, CVE-2026-28648 (High, CVSS 미기재) / 미등재
- **출처**: [Android AAOS Security Bulletin 2026-10](https://source.android.com/docs/security/bulletin/aaos/2026/2026-10-01)

:::note[기타 CISA ICS 권고 (10/6 ~ 10/8)]
Johnson Controls EasyIO FG 하드코딩 자격증명(CVE-2026-27872, 7.7, 대상 분야에 Critical Manufacturing·Transportation 포함), Satel Netco Design 경로 탐색(CVE-2026-101024, 8.8), CISA Malcolm 인증·SSRF 등 7건.
:::

## AI 보안

### AI 에이전트를 쓴 국내 은행 연쇄 침해: ARTEX + Claude Code (10/6 정식 수사, 10/8 CrowdStrike 분석)

9월 27일~10월 1일, 신한(약 2.5만 명), KB국민(119명), 하나(89명), BNK부산, 예가람저축은행 등의 직원용·대출모집인용 시스템이 공격받았다.
금융보안원은 중국어권 오픈소스 LLM 자율 침투테스트 도구 ARTEX의 흔적을 찾았다.
CrowdStrike는 공격 인프라에 노출된 Claude Code 세션 기록, 설정 파일, AI 메모리 파일을 분석했고, 그 안에서 공격자로 추정되는 인물의 이력서 작성 프롬프트까지 나왔다.
경찰은 10월 6일 정식 수사로 전환했고, 국회는 10월 19일 국정감사에 5대 은행장을 부르기로 했다.

- **왜 중요한가**: 개인 공격자가 AI 에이전트로 짧은 기간에 여러 금융사를 동시에 털었다는 국내 첫 대형 사례다. 망분리 완화 정책에도 영향을 줄 수 있다.
- **CVE / KEV**: 공개된 CVE 없음
- **출처**: [헤럴드경제](https://www.heraldk.com/article/2026100220313469029) · [The Register](https://www.theregister.com/cyber-crime/2026/10/08/crowdstrike-finds-possible-bank-hackers-cv-among-exposed-ai-logs/5301908) · [BleepingComputer](https://www.bleepingcomputer.com/news/security/hacker-used-artex-ai-and-claude-agents-to-target-south-korean-banks/)

### AgentCorruption: Bedrock AgentCore 에이전트로 IMDS 자격증명 탈취 (10/8)

Zenity Labs가 SecTor 2026에서 발표했다.
외부로 요청을 보낼 수 있는 도구를 가진 에이전트를 프롬프트로 유도해 AWS 메타데이터 서비스(IMDS)를 호출하게 하면 실행 역할의 임시 자격증명을 얻을 수 있다.
기본 실행 역할이 넓게 잡혀 있어 계정 안의 다른 에이전트 메모리, 컨테이너 이미지, Secrets Manager까지 닿았다.
AWS는 "문서화된 정상 동작"이라며 취약점으로 보지 않는다고 반박했다.

- **왜 중요한가**: 고전적인 "SSRF → 클라우드 메타데이터" 공격이 AI 에이전트 도구 호출이라는 새 입구로 다시 나타났다. 에이전트 IAM 최소권한 설계의 교과서적 사례다.
- **CVE / KEV**: CVE 미부여
- **출처**: [OrcaRouter (Zenity Labs 발표 인용)](https://www.orcarouter.ai/blog/2026-10-08-agentcorruption-aws-bedrock-agentcore)

### AI 샌드박스 SDK `tensorlake` npm, Shai-Hulud 변종 감염 (10/8)

AI 에이전트용 서버리스 샌드박스 플랫폼 Tensorlake의 npm 패키지(누적 설치 10만 회 이상) 0.5.144 버전에 Shai-Hulud 웜 변종이 들어갔다.
공격자는 메인테이너 신원으로 저장소에 커밋한 뒤 약 20시간 후 npm에 배포했다.
페이로드는 Bun 런타임으로 실행되고, 이더리움 스마트 컨트랙트에서 C2 주소를 받아온다(Aikido 분석).

- **왜 중요한가**: AI 에이전트 인프라 SDK가 공급망 공격의 표적이 됐다. 에이전트 개발 환경에 쌓인 클라우드·LLM 키가 한꺼번에 털릴 수 있다.
- **CVE / KEV**: 해당 없음 (악성 릴리스 `tensorlake@0.5.144`)
- **출처**: [Cyber Security News](https://cybersecuritynews.com/tensorlake-npm-package/)

:::note[이번 주에서 뺀 항목]
LiteLLM MCP 인증 우회(CVE-2026-59822)의 KEV 등재와 Grafana MCP SSRF(CVE-2026-19516)는 9월 공개분이라 뺐다. MCP 보안을 공부한다면 함께 볼 만하다.
:::

## 소프트웨어 공급망 보안

### GhostAction 재확산: 탈취한 GitHub 계정으로 비밀정보 탈취 워크플로 주입 (10/7 ~ 10/9)

인포스틸러 로그로 얻은 PAT와 계정으로 메인테이너 행세를 하며 `security-audit.yml` 같은 그럴듯한 이름의 워크플로를 기본 브랜치에 넣었다.
이 워크플로는 git 히스토리 전체에서 AWS, GitHub, OpenAI, Anthropic 키 등 13가지 패턴을 찾아 평문 HTTP로 빼돌린다.
GitGuardian은 계정 약 1,900개와 저장소 3만 개 이상을 집계했다. GitHub가 10월 9일부터 실행을 막아 10일과 12일 공격분은 실패했다.

- **왜 중요한가**: 패키지를 오염시키지 않아도 개발자 계정 하나와 CI만 있으면 조직의 클라우드 키를 대량으로 가져갈 수 있다. 포크에도 악성 워크플로가 남는다.
- **CVE / KEV**: 해당 없음
- **출처**: [The Hacker News](https://thehackernews.com/2026/10/credential-stealing-github-actions.html) · [The Hacker News (GitGuardian 집계)](https://thehackernews.com/2026/10/ghostaction-compromises-about-1900.html) · [Socket](https://socket.dev/blog/ghostaction-cloud-credentials)

### MALFEX: npm 악성 패키지 8종, 4만 회 다운로드 (10/7)

CloudSEK과 Checkmarx가 한 공격자가 올린 악성 npm 패키지 8개를 찾아냈다. `function-flag` 하나만 3.7만 회 다운로드됐다.
lifecycle 훅(`postinstall`)으로 Windows에서 Overlord RAT이나 Discord·브라우저·지갑 탈취기를 받아온다. Overlord는 C2 주소를 솔라나 트랜잭션에서 읽는다.
공개 시점에 3개 패키지는 아직 살아 있었다.

- **왜 중요한가**: 의존성(`function-color` → `function-flag`)을 거쳐 감염되고 블록체인을 C2로 쓰는 패턴이 이번 주 Shai-Hulud 변종과 같다. 이제 트렌드로 봐야 한다.
- **패키지**: tlxbnhd, tldriver, mxdriver, img-to-native, native-runner, function-flag, function-color, cdn-img-fetch
- **출처**: [The Hacker News](https://thehackernews.com/2026/10/eight-malicious-npm-packages-downloaded.html)

### `tensorlake` npm Shai-Hulud 변종

자세한 내용은 위 AI 보안 항목 참고.
메인테이너 신원으로 커밋해 GitHub 저장소를 먼저 오염시키고 npm에 배포했다.
GhostAction과 함께 보면 "개발자 계정 탈취 → 저장소 → 레지스트리"로 이어지는 공급망 공격 체인이 그려진다.

## 깊게 파볼 주제

### 주제 1. AI 에이전트를 이용한 실제 침해: ARTEX + Claude Code 은행 공격 해부

**추천 이유**

- 국내 금융권에서 실제로 일어났고, CrowdStrike가 공격자 쪽 AI 세션 로그까지 분석한 드문 사례다. 공격자가 AI에 무엇을 시켰는지 볼 수 있다.
- 공격 대상이 고객용 뱅킹이 아니라 외부와 닿는 직원·협력사용 시스템이었다. 자동화된 정찰에 "덜 지켜지는 면"이 먼저 걸린다는 교훈이 분명하다.

**무엇을 보면 좋을지**

- CrowdStrike 원문과 The Register 기사: 노출된 디렉터리 → 지시 파일 → 홍콩 서버 → 세션·메모리 파일로 이어진 추적 과정. 공격자의 OPSEC 실패 지점을 정리해 본다.
- ARTEX GitHub 저장소(오픈소스): 에이전트 구조(정찰·익스플로잇·보고 루프), 사용하는 도구, 프롬프트 템플릿
- 금융보안원·금융위 후속 권고(외부 접점 내부 시스템 전수 점검)와 망분리 완화 논의
- 방어 관점: 짧은 시간에 여러 기관을 도는 IP 로테이션, 동일 IP 교차 관측, AI 도구 특유의 요청 패턴처럼 탐지에 쓸 만한 시그널

:::warning
실습은 반드시 격리된 로컬 랩(DVWA, Vulhub 등)에서만 한다. 실습 원칙은 [AI 취약점 진단 실습](/lab/ai-pentest/approach-and-ethics)을 따른다.
:::

**관련 개념**

- MITRE ATT&CK: T1595 (Active Scanning), T1190 (Exploit Public-Facing Application), T1078 (Valid Accounts), T1213 (Data from Information Repositories), T1090 (Proxy)
- MITRE ATLAS(AI 위협 프레임워크), Agentic pentest framework, IDOR·인증 우회 같은 웹 접근통제 취약점

### 주제 2. KEV에 다시 등재된 고전 취약점 재현: Struts S2-032 · ProFTPD mod_copy

**추천 이유**

- 이번 주 KEV 5건은 모두 공개 PoC와 실습 자료가 풍부한 고전 취약점인데, 2026년에도 국가 배후 스캐너가 실제로 쓰고 있다. 공격 원리, 탐지, 레거시 자산 관리를 한 번에 공부할 수 있다.
- 패치 diff가 짧고 원인이 명확해 "취약점 → 패치 → 탐지 룰"을 처음부터 끝까지 따라가기 좋다.

**무엇을 보면 좋을지**

- **CVE-2016-3081 (Struts2 S2-032)**: Dynamic Method Invocation이 켜진 상태에서 `method:` 접두사로 OGNL 식을 주입한다. Vulhub에 `struts2/s2-032` 환경이 있는 것으로 알려져 있으니 확인 후 쓴다. Struts 2.3.28.1 패치 diff에서 메서드명 검증 로직을 본다.
- **CVE-2015-3306 (ProFTPD mod_copy)**: 인증 없이 `SITE CPFR/CPTO`로 파일을 복사해 웹 루트에 웹셸을 쓰는 흐름. Metasploit `proftpd_modcopy_exec` 모듈과 공개 PoC가 있다.
- **CVE-2021-3199 (ONLYOFFICE)**: 경로 탐색 → 파일 쓰기. 위 두 개와 비교하며 공통 패턴을 정리한다.
- 탐지 룰: Suricata/Snort에서 `SITE CPFR`, OGNL 특수문자(`#`, `@`) 패턴 시그니처 만들기
- 자산 관리: 사내 버전 배너 점검 스크립트 만들기

**관련 개념**

- OGNL/표현식 언어 인젝션(EL Injection), 인증 전 명령 실행(pre-auth RCE), 경로 탐색(Path Traversal)
- MITRE ATT&CK: T1190, T1505.003 (Web Shell), T1046 (Network Service Discovery)

## 이번 주 키워드

| 키워드 | 한 줄 설명 |
|---|---|
| **Agentic Pentest Framework** | LLM이 정찰, 익스플로잇, 보고를 스스로 반복하는 자율 침투테스트 도구(예: ARTEX). 공격자 손에 들어가면 1인 공격자의 처리량이 크게 늘어난다. |
| **Blockchain C2 / EtherHiding** | C2 주소나 명령을 이더리움·솔라나 같은 퍼블릭 블록체인에 숨기는 기법. 도메인을 차단해도 공격자가 주소를 쉽게 바꿀 수 있다. |
| **IMDS 자격증명 탈취 via AI Agent** | 에이전트의 HTTP 도구를 SSRF처럼 악용해 `169.254.169.254` 메타데이터에서 IAM 임시 키를 빼내는 공격. IMDSv2와 역할 최소권한이 핵심 방어다. |
| **Credential-only Campaign** | CVE 없이 유출 계정과 오프라인 해시 크래킹만으로 경계 장비를 장악하는 캠페인(예: FortiBleed). 해시 알고리즘 마이그레이션이 대응의 일부다. |
| **Workflow Injection** | 탈취한 계정으로 GitHub Actions 워크플로 파일을 직접 넣어 CI 러너가 비밀정보를 빼돌리게 하는 공급망 공격(예: GhostAction). 포크와 미러에도 그대로 남는다. |

## 참고

- KISA 보호나라, 안랩 ASEC, 보안뉴스에서는 이번 주 날짜로 확인되는 항목을 찾지 못해 본문에 넣지 않았다.
- 국내 은행 사고는 헤럴드경제 보도를 근거로 했다.
- CISA ICS 권고는 CISA 공식 CSAF 데이터(cisagov/CSAF)에서 공개일과 CVSS를 확인했다.
