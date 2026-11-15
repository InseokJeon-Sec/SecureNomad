---
title: Microsoft 365 대규모 장애 (2026-11-12~13) — 복구 완료와 원인 정리
description: Exchange Online·Teams·SharePoint·Copilot·Defender XDR을 덮친 Microsoft 365 글로벌 장애가 하루 넘게 이어지다 복구됐다. Microsoft가 밝힌 원인('이전 네트워크 용량 증설 중 들어간 구성 변경'·사이버공격 아님)과 타임라인, 영향 범위를 확정 사실과 보도로 구분해 정리한다.
authors: [inseok]
toc_max_heading_level: 2
tags: [incident, cloud, security]
---

Microsoft 365가 한국시간 11월 13일 새벽부터 하루 넘게 대규모 접속 장애를 일으켜 Outlook·Teams 등 핵심 업무 도구가 멈췄다가 복구됐다.
Microsoft는 사이버공격이 아니라 '이전 네트워크 용량 증설 중 들어간 구성 변경'에서 비롯된 가용성 문제라고 밝혔고, 이 글은 복구 시점까지 확인된 사실을 정리한 것이다. **(2026-11-15 갱신 · 복구 완료)**

{/* truncate */}

:::info[정리 시점 · 범위]
- **갱신 시각**: 2026-11-15(일), 복구 완료·공식 원인 설명을 반영했다. (사건 발생: 2026-11-12~13)
- **원칙**: Microsoft가 상태 페이지·공지로 **밝힌 내용(확정)**과, 언론·제3자 집계의 **보도(미확정)**를 구분해 적었다.
- 공격 재현·침해와 무관한 **가용성(서비스 중단) 사건**이다. 아래 '보안 관점'은 방어·업무연속성 관점의 정리다.
:::

## 무슨 일이 있었나

미국시간 2026년 11월 12일 낮(동부 기준 12시 30분경, 한국시간 13일 새벽 2시 30분경)부터 Microsoft 365 전반에 접속 장애가 시작됐다.
Downdetector에는 Outlook 신고가 가장 많이 몰렸고, 메일·채팅·문서 협업이 동시에 영향을 받으며 기업 업무가 광범위하게 멈췄다. 장애는 하루 넘게 이어지다 11월 13일 밤(KST) 대체로 복구됐다.

Microsoft가 상태 페이지에서 영향을 **확인한 서비스**는 다음과 같다.

| 서비스 | 내용 |
|---|---|
| **Exchange Online (Outlook)** | 메일함 접속 불가 — 신고가 가장 많았다 |
| **Microsoft Teams** | 북미 중심 접속 장애 |
| **SharePoint Online** | 문서·협업 접속 영향 |
| **Microsoft 365 Copilot** | 서비스 영향 |
| **Microsoft Defender XDR** | 서비스 영향 |

보도로는 OneDrive와 Azure 쪽 이슈도 함께 언급됐다. 또한 Microsoft에 의존하는 Anthropic·OpenAI 같은 외부 서비스까지 영향을 받은 것으로 전해져, 장애가 공급망 위쪽으로 번진 사례로 꼽혔다.

## 타임라인 (모든 시각 KST 기준)

원 보도의 현지 시각(미 동부 ET·UTC)을 한국시간(KST)으로 환산해 정리했다.

- **11/13 02:30경** — Downdetector 신고 급증. 미국 Outlook 신고가 한때 13만 건을 넘었다.
- **11/13 새벽** — Microsoft가 '미주(Americas)'의 Exchange Online 접속 문제를 조사 중이라고 공지. 배포·구성 변경을 일시 중단하고, 구성 변경을 테스트하며 영향받은 서버를 재시작하기 시작했다.
- **11/13 06:02경** — 대체 헬스체크 방식을 검증해 일부 서버를 복구했다고 밝힘.
- **11/13 08:05경** — 복구된 서버가 안정적으로 유지되나, 밀린 처리량 때문에 복구는 점진적일 것이라고 안내.
- **11/13 10:06경** — 영향 시작과 상관관계가 있는 네트워크 구성 변경을 되돌리기(revert) 시작.
- **11/13 16:45경** — 적용한 조치에서 '긍정적 결과'가 보인다고 밝혔으나, 상태 페이지에는 여전히 접속 문제가 남아 있었다.
- **11/13 23시경** — 메일 큐가 정상 수준에 근접하며 서비스가 대체로 복구됐다.

## Microsoft가 밝힌 원인

- **사이버공격·AI 때문이 아니라고 선을 그었다.** 악성 활동 징후는 없다고 밝혔다.
- 복구 뒤 Microsoft는 원인을 '**이전 네트워크 용량 증설 과정에서 들어간 구성 변경**'으로 설명했다. 실제 복구도 **영향 시작과 상관관계가 있는 네트워크 구성 변경을 되돌려(revert)** 이뤄졌다.
- 메커니즘은 이렇다 — 다수 서버가 **헬스체크에 실패**해 로테이션에서 빠지자, 남은 서버에 부하가 몰렸고, 보안 연결을 수립하는 프로세스가 과부하되며 요청 처리가 멈췄다. 즉 트래픽 급증이 아니라 **자사 변경에서 비롯된 서버 불가용의 연쇄**였다.
- 다만 초기 공지에서는 '최근 변경과 상관관계가 확인되지 않았다'고 했다가, 이후 구성 변경을 되돌리는 쪽으로 설명이 바뀌었다. **초기 설명과 최종 원인이 달라진 사례**다.

Microsoft는 이번 장애에 공식 **사과**했고(책임 임원 Charles Lamanna), **전체 사후 보고서(PIR)**를 검토 완료 후 공개하겠다고 밝혔다. (이 글 갱신 시점까지 전체 PIR은 미공개.)

즉 "공격을 당해 데이터가 유출된 사건"이 아니라, **자사 변경에서 비롯돼 대형 클라우드의 가용성이 무너진 사건**이다.

## 영향 범위 — 확정과 보도

- **Microsoft 확인**: 영향 지역을 '미주(Americas)' / '북미'로 안내했다.
- **보도(미확정)**: 실제로는 글로벌하게 번져 여러 국가에서 영향이 보고됐고, 영국 정부·일부 지자체·경찰 등 공공 영역의 차질도 전해졌다. 사용자 피해 규모(신고 수)는 Downdetector 등 제3자 집계 수치다.

## 보안 관점에서 — 무엇을 봐야 하나

이 사건은 침해가 아니라 **가용성(Availability)** 사고지만, 가용성 역시 기밀성·무결성과 함께 보안의 한 축이다. 이번 건이 다시 확인시켜 준 지점은 다음과 같다.

1. **단일 클라우드 집중 리스크.** 메일·채팅·문서·보안관제(Defender XDR)까지 한 공급자에 묶여 있으면, 그 공급자의 장애 하나가 조직 전체를 동시에 멈춘다. 'Defender XDR 영향'은 **장애 상황에서 탐지·대응 수단마저 흔들릴 수 있다**는 점에서 특히 곱씹을 대목이다.
2. **변경관리가 진짜 공격면.** 외부 공격이 아니라 자사 네트워크 구성 변경이 방아쇠였다. 단계적 배포·롤백 플랜·장애 중 변경 동결(change freeze)이 가용성 방어의 핵심이다.
3. **업무연속성(BCP)과 대체 수단.** 메일·협업이 몇 시간 멈추는 상황을 전제로, 긴급 연락·의사결정의 **대체 경로**가 플랫폼 밖에 준비돼 있는지 점검해야 한다.
4. **'공격 아님'이 '문제 없음'은 아니다.** 사이버공격이 배제됐다고 위험이 끝나는 게 아니라, 운영·구성·헬스체크 같은 **내부 복원력** 문제가 동일한 규모의 피해를 낸다.

> 보안 관점의 더 깊은 분석은 Notes의 [클라우드 장애를 보안으로 읽기](/notes/2026/11/15/cloud-outage-as-security) 글에서 다룬다.

## 아직 확인되지 않은 것

- **전체 사후 보고서(PIR)**와 거기 담길 'defense-in-depth' 재발방지 항목. 원인의 큰 줄기는 네트워크 구성 변경으로 좁혀졌으나, 정식 RCA는 PIR로 확정된다.
- 글로벌 영향 범위·피해 규모의 **공식 수치**(현재는 제3자 집계).

정식 PIR이 공개되면 이 글을 다시 갱신한다.

## 참고

- [Microsoft Apologises For Outage And Reveals Cause (Forbes)](https://www.forbes.com/sites/kateoflahertyuk/2026/11/13/microsoft-outage-what-happened-and-what-to-do-next/)
- [Microsoft blames massive Microsoft 365 outage on maintenance bug (BleepingComputer)](https://bleepingcomputer.com/news/microsoft/microsoft-blames-massive-microsoft-365-outage-on-maintenance-bug)
- [Microsoft 365 Outage (Nov 2026): Root Cause & What IT Admins Should Learn (DEV)](https://dev.to/epifive/microsoft-365-outage-nov-2026-what-we-know-about-the-root-cause-and-what-it-admins-should-learn-4hld)
- [Microsoft outage live — Outlook and Teams (TechRadar)](https://www.techradar.com/news/live/outlook-outage-nov-2026)
- Microsoft 365 Service Health / 상태 페이지 (관리자 포털·공식 공지)
