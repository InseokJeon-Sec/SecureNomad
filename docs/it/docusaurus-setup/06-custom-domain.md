---
title: 06. 커스텀 도메인 연결
sidebar_label: 06. 커스텀 도메인 연결
sidebar_position: 6
description: 가비아에서 구매한 도메인을 GitHub Pages에 연결하기 (wiki.securenomad.kr)
---

# 06. 커스텀 도메인 연결

가비아에서 `securenomad.kr` 을 구매하고, 서브도메인 **`wiki.securenomad.kr`** 을 GitHub Pages에 연결한다.

```text
wiki.securenomad.kr
   └─ CNAME ─▶ inseokjeon-sec.github.io  (GitHub Pages)
                  └─ 저장소 SecureNomad 의 Pages 사이트
```

## 포워딩이 아니라 DNS 연결을 쓰는 이유

| 방식 | 결과 |
|---|---|
| URL 리다이렉트(포워딩) | 주소창이 `github.io` 주소로 바뀐다 |
| URL 마스킹(프레임) | iframe 방식이라 HTTPS·검색 노출·페이지 주소에 문제가 생긴다 |
| **DNS 연결 (CNAME)** | 내 도메인 그대로 접속, GitHub가 **무료 HTTPS 인증서** 자동 발급 |

## 서브도메인을 선택한 이유

- CNAME 레코드 1개로 설정이 끝난다 (루트 도메인은 A 레코드 4개 필요)
- 루트 도메인(`securenomad.kr`)은 나중에 다른 용도로 쓸 수 있다

## 1. 도메인 구매 시 설정

- **WHOIS 정보 보호** 켜기 (이름·주소·연락처 비공개)
- **자동 갱신** 켜기 (만료 시 사이트 중단 + 타인이 도메인을 가져갈 위험)
- 웹호스팅·포워딩 등 부가 상품은 필요 없음

## 2. GitHub 도메인 소유 인증

**계정** Settings(프로필 사진 → Settings) → **Pages → Add a domain** → `securenomad.kr` 입력

GitHub가 알려주는 TXT 레코드를 가비아 DNS에 추가한 뒤 **Verify**.

| 타입 | 호스트 | 값 |
|---|---|---|
| TXT | `_github-pages-challenge-InseokJeon-Sec` | GitHub가 발급한 값 |

:::info 왜 인증하는가
연결을 끊은 뒤 DNS 레코드가 남아 있으면, 다른 사람이 같은 도메인을 자신의 GitHub Pages에 등록해 내 서브도메인으로 사이트를 띄울 수 있다 (**Subdomain Takeover**).
도메인을 계정에 인증해 두면 내 계정의 저장소만 이 도메인을 사용할 수 있다.
:::

## 3. 가비아 DNS 설정

My가비아 → 도메인 → `securenomad.kr` 관리 → **DNS 관리툴 → 설정 → 레코드 추가**

| 타입 | 호스트 | 값/위치 | TTL |
|---|---|---|---|
| CNAME | `wiki` | `inseokjeon-sec.github.io.` | 기본값 |

- 호스트에는 `wiki` 만 입력한다 (가비아가 `.securenomad.kr` 을 자동으로 붙인다)
- 값에 `/SecureNomad` 같은 경로는 붙이지 않는다
- 가비아는 CNAME 값 끝에 점(`.`)을 요구할 수 있다

반영 확인 (명령 프롬프트):

```bash
nslookup wiki.securenomad.kr
```

`inseokjeon-sec.github.io` 와 `185.199.x.x` 주소가 나오면 반영된 것이다.

## 4. 프로젝트 파일 수정

**`static/CNAME`** (확장자 없음, 도메인 한 줄)

```text title="static/CNAME"
wiki.securenomad.kr
```

빌드할 때 `build/CNAME` 으로 복사되어 GitHub Pages가 도메인을 인식한다.

**`docusaurus.config.js`**

```js
  url: 'https://wiki.securenomad.kr',
  baseUrl: '/',          // '/SecureNomad/' 에서 변경
```

:::warning 순서 주의
DNS(3번)가 반영되기 전에 이 변경을 push하면, 기존 `github.io` 주소가 아직 동작하지 않는 새 도메인으로 이동되어 잠시 사이트에 접속할 수 없다.
**DNS 반영 확인 → push** 순서로 진행한다.
:::

## 5. 저장소 Pages 설정

1. Commit → **Push origin**
2. **저장소** Settings → Pages → **Custom domain** 에 `wiki.securenomad.kr` 입력 → Save
3. DNS check 성공 후 **Enforce HTTPS** 체크 (인증서 발급에 시간이 걸리면 잠시 비활성 상태일 수 있다)

## 결과

- 사이트 주소: `https://wiki.securenomad.kr`
- 기존 `https://inseokjeon-sec.github.io/SecureNomad/` 는 새 도메인으로 자동 이동
