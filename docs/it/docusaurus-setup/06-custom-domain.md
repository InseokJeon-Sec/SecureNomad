---
title: 06. 커스텀 도메인 연결
sidebar_label: 06. 커스텀 도메인 연결
sidebar_position: 6
description: 가비아에서 구매한 도메인을 GitHub Pages에 연결하기 (wiki.securenomad.kr)
---

# 06. 커스텀 도메인 연결

## 1. 개요

가비아에서 `securenomad.kr` 을 구매하고, 서브도메인 **`wiki.securenomad.kr`** 을 GitHub Pages 사이트에 연결함.

```text
사용자 ─▶ wiki.securenomad.kr
              │  (가비아 DNS: CNAME)
              ▼
          inseokjeon-sec.github.io   (GitHub Pages)
              │
              ▼
          저장소 SecureNomad 의 배포 결과(build)
```

| 구분 | 변경 전 | 변경 후 |
|---|---|---|
| 사이트 주소 | `https://inseokjeon-sec.github.io/SecureNomad/` | `https://wiki.securenomad.kr` |
| `baseUrl` | `/SecureNomad/` | `/` |
| HTTPS | GitHub 기본 인증서 | GitHub 자동 발급 인증서 (Let's Encrypt) |

## 2. 연결 방식 선택

### 포워딩 대신 DNS 연결

| 방식 | 동작 | 결과 |
|---|---|---|
| URL 리다이렉트(포워딩) | 내 도메인 접속 시 github.io 주소로 이동 | 주소창이 github.io로 바뀜 |
| URL 마스킹(프레임) | 내 도메인 화면 안에 iframe으로 사이트 표시 | HTTPS 문제, 검색 노출 불리, 페이지 이동 시 주소 고정 |
| **DNS 연결 (CNAME)** | 내 도메인이 GitHub Pages 서버를 직접 가리킴 | **내 도메인 그대로 접속, 무료 HTTPS** |

→ GitHub Pages 공식 지원 방식인 **DNS 연결** 선택

### 서브도메인 선택

| 구분 | 예시 | 필요한 레코드 |
|---|---|---|
| **서브도메인** (선택) | `wiki.securenomad.kr` | CNAME 1개 |
| 루트 도메인 | `securenomad.kr` | A 레코드 4개 (+ www CNAME) |

- 설정이 단순함
- 루트 도메인은 추후 메인 홈페이지 등 다른 용도로 활용 가능

## 3. 도메인 구매 (가비아)

| 항목 | 설정 | 이유 |
|---|---|---|
| WHOIS 정보 보호 | 사용 | 이름·주소·연락처 공개 방지 |
| 자동 갱신 | 사용 | 만료 시 사이트 중단 및 타인 선점 위험 |
| 웹호스팅·포워딩·이메일 등 부가 상품 | 미사용 | GitHub Pages가 호스팅·HTTPS 무료 제공 |
| 네임서버 | 가비아 기본(`ns.gabia.co.kr`) 유지 | 레코드 몇 개만 필요하므로 별도 DNS 불필요 |

:::tip 갱신 가격 확인
첫해 할인 가격보다 **2년 차 이후 갱신 가격**을 확인하고 구매함.
:::

## 4. GitHub 도메인 소유 인증 (TXT)

### 왜 필요한가

:::danger Subdomain Takeover
GitHub Pages 연결을 해제한 뒤 DNS의 CNAME 레코드가 남아 있으면, **다른 사람이 같은 도메인을 자신의 GitHub Pages 저장소에 등록**해 내 서브도메인으로 임의의 사이트를 띄울 수 있음.
도메인을 내 GitHub 계정에 인증해 두면 **내 계정의 저장소만** 이 도메인을 사용할 수 있음.
:::

### 진행 순서

1. GitHub 오른쪽 위 **프로필 사진 → Settings** (계정 설정)
2. 왼쪽 메뉴 **Pages → Add a domain**
3. 루트 도메인 `securenomad.kr` 입력 (서브도메인을 쓰더라도 루트 도메인으로 인증)
4. GitHub가 안내하는 TXT 레코드를 가비아 DNS에 추가

| 타입 | 호스트 | 값/위치 |
|---|---|---|
| TXT | `_github-pages-challenge-사용자명` | GitHub가 발급한 인증 값 |

5. GitHub 화면에서 **Verify** → **Verified** 표시 확인

:::caution
인증 값은 계정별로 발급되는 값이므로 문서나 캡처에 그대로 공개하지 않음.
:::

## 5. 가비아 DNS에 CNAME 레코드 추가

### 메뉴 위치

**My가비아 → 도메인 → `securenomad.kr` 관리 → DNS 관리툴**

DNS 관리 화면 구성:

| 영역 | 사용 여부 |
|---|---|
| **DNS 설정 → [레코드 수정]** | **사용** (TXT, CNAME 추가) |
| 도메인 연결 | 미사용 (가비아 호스팅 연결용) |
| 포워딩 | 미사용 (리다이렉트/마스킹 방식) |
| 웹 파킹 / 모바일 파킹 | 미사용 |

### 레코드 추가

1. **DNS 설정** 옆 **[레코드 수정]** 클릭
2. **[레코드 추가]** 클릭 → 새 행 입력
3. 행의 **[확인]** → 하단 **[저장]**

| 타입 | 호스트 | 값/위치 | TTL |
|---|---|---|---|
| TXT | `_github-pages-challenge-사용자명` | (인증 값) | 600 |
| **CNAME** | `wiki` | `inseokjeon-sec.github.io.` | 600 |

- 호스트에는 `wiki` 만 입력 (가비아가 `.securenomad.kr` 자동 추가)
- 값에는 `/SecureNomad` 같은 경로를 붙이지 않음
- 값 끝의 점(`.`)은 도메인의 끝을 의미함. 형식 오류가 나면 제거 후 재시도
- 기존 TXT 레코드는 삭제하지 않고 함께 유지

## 6. DNS 반영 확인

```bash
nslookup wiki.securenomad.kr
```

정상 결과 예시:

```text
이름:    inseokjeon-sec.github.io
Addresses:  185.199.108.153
            185.199.109.153
            185.199.110.153
            185.199.111.153
Aliases:  wiki.securenomad.kr
```

- `Aliases` 에 내 도메인, `이름` 에 `github.io` 주소가 보이면 CNAME 반영 완료
- 반영까지 수 분 ~ 수 시간 소요 가능

## 7. 프로젝트 파일 수정

### static/CNAME (신규)

확장자 없는 파일. 도메인 한 줄만 작성함.

```text title="static/CNAME"
wiki.securenomad.kr
```

`static/` 안의 파일은 빌드 시 `build/` 루트로 복사됨 → `build/CNAME` 으로 배포되어 GitHub Pages가 도메인을 인식함.

### docusaurus.config.js

```js title="docusaurus.config.js"
  url: 'https://wiki.securenomad.kr',
  baseUrl: '/',
```

| 항목 | 변경 이유 |
|---|---|
| `url` | 사이트 대표 주소 (sitemap, 공유 링크 등에 사용) |
| `baseUrl` | 도메인 루트에서 바로 서비스하므로 `/SecureNomad/` → `/` |

:::warning `baseUrl` 미변경 시
CSS·JS 파일을 `/SecureNomad/...` 경로에서 찾게 되어 화면이 깨짐.
:::

### 반영

`npm run build` 로 에러 확인 후 GitHub Desktop에서 **Commit → Push origin**.

## 8. 저장소 Pages 설정

**저장소** `SecureNomad` → 상단 **Settings** → 왼쪽 **Pages**

1. **Build and deployment** 아래 **Custom domain** 에 `wiki.securenomad.kr` 입력 → **Save**
2. **DNS check successful** 표시 확인
3. **Enforce HTTPS** 체크

:::info Enforce HTTPS 비활성 상태
인증서 발급 전에는 체크박스가 회색으로 비활성화되어 있음. 발급 완료 후(수 분 ~ 최대 하루) 활성화되면 체크함.
:::

## 9. 헷갈렸던 점 정리

### Settings가 두 군데

| 위치 | 하는 일 |
|---|---|
| **프로필 사진 → Settings → Pages** (계정) | 도메인 **소유 인증** (TXT, Verify) |
| **저장소 → Settings → Pages** (저장소) | **Custom domain** 입력, Enforce HTTPS |

### 작업 순서

```text
① 도메인 구매
② 계정 Settings에서 도메인 인증 (TXT)
③ 가비아 CNAME 추가
④ nslookup 으로 반영 확인
⑤ CNAME 파일 + config 수정 → Push
⑥ 저장소 Settings에서 Custom domain 저장 → Enforce HTTPS
```

:::caution 순서가 중요한 이유
DNS 반영(④) 전에 ⑤·⑥을 진행하면 기존 github.io 주소가 **아직 연결되지 않은 새 도메인으로 이동**되어 일시적으로 사이트 접속이 불가함.
:::

## 10. 결과

- 사이트 주소: **https://wiki.securenomad.kr**
- 기존 `https://inseokjeon-sec.github.io/SecureNomad/` 접속 시 새 도메인으로 자동 이동
- HTTPS 적용 (자물쇠 표시)

### 확인 체크리스트

- [x] 계정 Settings → Pages: `securenomad.kr` **Verified**
- [x] 가비아 DNS: TXT, CNAME(`wiki`) 레코드 등록
- [x] `nslookup` 결과에 `github.io` 확인
- [x] `static/CNAME`, `url`, `baseUrl` 수정 후 Push
- [x] 저장소 Settings → Pages: DNS check successful
- [x] Enforce HTTPS 체크
- [x] `https://wiki.securenomad.kr` 접속 확인
