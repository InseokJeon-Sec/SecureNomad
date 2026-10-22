---
title: PHP 코어 원격 코드 실행 취약점 2건 (CVE-2026-109618 · 109619)
description: PHP 코어에서 인증 없이 원격 코드 실행이 가능한 치명적 취약점 2건이 10월 21일 공개·패치됐다. PHP 5.4부터 8.5.11까지 광범위하게 영향을 받으며, 'PHP2Shell'로 불린다.
authors: [inseok]
toc_max_heading_level: 2
tags: [security, vulnerability]
---

PHP 코어에서 인증 없이 원격 코드 실행과 메모리 정보 노출이 가능한 치명적 취약점 2건이 10월 21일 공개됐다.
PHP 5.4부터 8.5.11까지 거의 모든 버전이 영향을 받고, 단종된 8.1 이하는 패치가 제공되지 않는다.

{/* truncate */}

:::info[요약]
- **CVE**: CVE-2026-109618, CVE-2026-109619 (통칭 "PHP2Shell")
- **영향**: 인증 없는 원격 코드 실행(RCE) + 메모리 정보 노출. 각 CVSS 9.2 (v4.0, Critical)
- **대상**: PHP 5.4 ~ 8.5.11 전 버전
- **패치**: 8.2.35, 8.3.36, 8.4.27, 8.5.12 (2026-10-21)
- **악용**: 공개 시점 기준 실제 악용은 확인되지 않았으나, 무기화된 페이로드가 관측됐다
:::

## 개요

PHP 프로젝트가 10월 21일 코어 취약점 2건을 GitHub Security Advisory로 공개하고 같은 날 패치를 배포했다.
두 건 모두 **인증 없이 원격에서 코드 실행**이 가능하고 메모리 정보가 노출될 수 있어, 각각 CVSS v4.0 기준 9.2(Critical)로 평가됐다.
Wiz Research를 포함한 여러 연구자가 제보했고, 일부 보안 업체는 이 취약점을 "PHP2Shell"로 부른다.

PHP는 웹 서버 대부분이 쓰는 기반 런타임이므로 영향 범위가 넓다. Shodan 기반 단일 집계로는 버전을 드러낸 호스트 약 150만 대 가운데 88만 대 이상이 **패치가 나오지 않는 단종 버전**에서 동작하는 것으로 추정됐다.

## 두 취약점의 성격

| CVE | 권고 | 성격 |
|---|---|---|
| **CVE-2026-109618** | GHSA-w8hw-w9fx-j79w | 메모리 부족(OOM) 처리 과정에서 요청 메모리가 완전히 초기화되기 전에 접근 가능한 상태가 되고, 요청 종료 단계가 그 불완전한 상태를 유효한 것으로 처리할 수 있다. PHP가 OOM 처리에 쓰던 `longjmp()` 경로가 원인이다. |
| **CVE-2026-109619** | GHSA-6wmf-4rv5-p3rp | 요청이 소유하던 내부 상태가 그 메모리가 해제된 뒤에도 남아, 같은 워커에서 처리되는 다음 요청이 정상 초기화 전에 그 낡은 상태를 사용할 수 있다. |

두 건 모두 메모리 안전 결함(해제 후 사용 등)으로, 공격자가 이를 엮으면 웹 워커 권한으로 임의 코드를 실행할 수 있다.

:::note[난도에 대한 참고]
CVSS 벡터(109618 기준 `AV:N/AC:H/AT:P`)가 보여주듯 공격 복잡도가 높고 선행조건이 있다. 공식 권고도 재현 신뢰도가 PHP 빌드, 확장 모듈, 프런트엔드 동작, 메모리 할당자 배치에 따라 달라진다고 밝혔다. 치명적이지만 모든 환경에서 손쉽게 성공하는 종류는 아니라는 의미다. 다만 "Critical"과 "무기화된 페이로드 관측"이 겹치므로 즉시 대응 대상이다.
:::

## 영향·패치 버전

- **영향**: PHP 5.4 ~ 8.5.11 전 버전
- **패치**: **8.2.35 · 8.3.36 · 8.4.27 · 8.5.12** (2026-10-21 배포)
- **패치 없음**: PHP 8.1 이하(8.0, 7.x, 5.x 포함)는 수명 종료(EOL)로 업스트림 수정이 제공되지 않는다. 배포판 패키지는 백포트가 있을 수 있으므로 각 제공자 권고를 확인한다.

클라우드·마켓플레이스에서 PHP를 번들로 제공하는 CMS·LAMP 스택(예: Magento/Adobe Commerce, 호스팅 패널)도 각 벤더 업데이트로 반영해야 한다.

## 악용 상태

- 공식 권고는 109618에 대해 **인증 없는 원격 코드 실행**을 확인했고, 기본 설정·prefork 구성의 mod_php 환경에서 HTTP로 검증했다고 밝혔다. FPM에 대한 완전한 익스플로잇은 아직 시연되지 않았으나 소스 분석상 취약하다고 봤다.
- Akamai는 **무기화된 페이로드**를 식별하고 모니터링 중이라고 밝혔다. watchTowr는 109618을 랩에서 재현했으나 실제 공격은 관측하지 못했다고 전했다.
- 공개 시점 기준 신뢰할 만한 공개 PoC는 확인되지 않았다. 떠도는 PoC 번들은 검증되지 않았고 악성일 수 있다는 경고가 함께 나왔다.
- CISA는 10월 21일 즉시 패치를 권고하는 알림을 냈다. KEV 등재는 공개 시점 기준 확인되지 않았다.

## 대응 방안

- **패치가 유일한 완전 대응이다.** 공식 권고는 "패치가 포함된 릴리스로 업데이트하는 것이 유일한 완전 완화책"이라고 못 박았다. 지원 브랜치는 8.2.35, 8.3.36, 8.4.27, 8.5.12 이상으로 올리고, 업데이트 후 PHP-FPM이나 웹 서버를 재시작한다.
- **자산 식별.** 실제 트래픽을 처리하는 PHP 버전과 SAPI(mod_php, FPM, CGI)를 호스트별로 파악한다. `php -v` 출력이 8.2.35 / 8.3.36 / 8.4.27 / 8.5.12 이상인지 확인한다.
- **단종 버전 처리.** PHP 8.1 이하는 패치가 없으므로 지원 브랜치로 올리거나, 당장 어렵다면 VPN·IP 허용목록·강화된 프록시 뒤로 격리하거나 오프라인한다.
- **임시 완화(완전하지 않음).** 즉시 패치가 어려우면 일부 벤더는 WAF 규칙 적용, 업로드를 받지 않는 엔드포인트에서 `multipart/form-data` 요청 제한·검사, 불필요한 SAPI·엔드포인트 비활성화를 임시 조치로 제안했다. 다만 공식 권고는 `memory_limit=-1` 같은 설정 변경은 부분 완화일 뿐이라고 밝혔다. 임시 조치는 완전한 차단을 보장하지 않는다.

## 참고 자료

- PHP Security Advisory [GHSA-w8hw-w9fx-j79w](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w) (CVE-2026-109618)
- PHP Security Advisory [GHSA-6wmf-4rv5-p3rp](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp) (CVE-2026-109619)
- [Google Cloud — Responding to core PHP vulnerabilities](https://cloud.google.com/blog/products/identity-security/responding-to-core-php-vulnerabilities-cve-2026-109618-cve-2026-109619)
- [Akamai — Critical RCE Vulnerabilities in PHP Core](https://www.akamai.com/blog/security-research/critical-remote-code-execution-vulnerabilities-php-core)
- [Sansec — PHP2Shell](https://sansec.io/research/php2shell)
