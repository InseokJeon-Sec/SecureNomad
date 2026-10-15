---
title: 07. 검색엔진 등록 (네이버 · 구글)
sidebar_label: 07. 검색엔진 등록
sidebar_position: 7
description: robots.txt, sitemap, 메타 태그 설정과 네이버 서치어드바이저 · Google Search Console 사이트 등록
---

# 07. 검색엔진 등록 (네이버 · 구글)

네이버 · 구글 검색에 사이트가 수집·노출되도록 사이트 쪽 설정을 추가하고 각 검색엔진의 웹마스터 도구에 등록함.

```text
[사이트 준비]                         [네이버 서치어드바이저]
robots.txt  ─ 수집 허용 + 사이트맵 위치    소유 확인: HTML 메타 태그
sitemap.xml ─ 수집 대상 페이지 목록   ─▶  사이트맵 제출 / 수집 요청
메타 태그    ─ 설명·키워드·소유 확인
                                      [Google Search Console]
                                      소유 확인: DNS TXT (도메인 속성)
                                      사이트맵 제출 / 색인 생성 요청
```

## 1. robots.txt

`static/robots.txt` 를 만들면 빌드 시 사이트 루트(`/robots.txt`)로 배포됨.

```text title="static/robots.txt"
User-agent: *
Allow: /

Sitemap: https://wiki.securenomad.kr/sitemap.xml
```

| 항목 | 의미 |
|---|---|
| `User-agent: *` | 모든 검색로봇에 적용 |
| `Allow: /` | 전체 페이지 수집 허용 |
| `Sitemap:` | 사이트맵 위치 안내 |

## 2. sitemap.xml

classic preset에 사이트맵 플러그인이 포함되어 있어 별도 설치 없이 `/sitemap.xml` 이 자동 생성됨.
옵션을 추가해 문서별 수정일을 검색엔진에 전달함.

```js title="docusaurus.config.js (presets → classic)"
        sitemap: {
          lastmod: 'date',             // 검색엔진에 문서 수정일 전달
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
```

:::info lastmod
`lastmod` 는 Git 커밋 이력에서 수정일을 읽음. GitHub Actions 워크플로의 `fetch-depth: 0` 설정이 있어야 정확한 날짜가 들어감.
:::

## 3. 메타 태그

### 사이트 공통

```js title="docusaurus.config.js (themeConfig)"
      metadata: [
        {name: 'keywords', content: '정보보안, 보안, 침해사고 대응, 보안관제, SOC, OT 보안, 클라우드 보안, ISMS, ISO 27001, 네트워크 보안, IT'},
        {name: 'author', content: 'Inseok Jeon'},
        {name: 'naver-site-verification', content: '네이버 발급 값'},
      ],
```

### 문서별 설명 (description)

검색 결과의 요약 문구로 사용됨. 문서 front matter에 한두 문장으로 작성함.

```md
---
title: SecureNomad
description: 보안과 IT 지식을 정리하고 공유하는 SecureNomad 위키. 침해사고 대응, 보안관제, OT·클라우드 보안, 정보보호 인증 등을 다룹니다.
---
```

`description` 은 `<meta name="description">` 과 `og:description`(링크 공유 미리보기)에 함께 들어감.

## 4. 네이버 서치어드바이저 등록

### 사이트 등록

1. `searchadvisor.naver.com` 접속 → 네이버 로그인
2. **웹마스터 도구** → 사이트 등록에 `https://wiki.securenomad.kr` 입력

### 소유 확인 (HTML 태그 방식)

1. 확인 방법으로 **HTML 태그** 선택
2. 안내된 `naver-site-verification` 태그의 `content` 값을 config의 `metadata` 에 추가
3. Commit → Push → 배포 완료 후 **소유 확인** 클릭

:::tip HTML 태그 방식을 고른 이유
HTML 파일 업로드 방식도 가능하지만(`static/` 에 파일 추가), 태그 방식은 config 한 줄로 관리할 수 있어 간단함.
소유 확인 값은 페이지 소스에 공개되는 값이므로 비밀 정보는 아니지만, 문서에는 굳이 기록하지 않음.
:::

### 등록 후 작업

| 메뉴 | 작업 |
|---|---|
| 요청 → 사이트맵 제출 | `https://wiki.securenomad.kr/sitemap.xml` |
| 검증 → robots.txt | 수집 허용 상태 확인 |
| 요청 → 웹 페이지 수집 | 첫 화면 주소 수집 요청 |

## 5. Google Search Console 등록

### 속성 유형 선택

| 유형 | 인증 방법 | 범위 |
|---|---|---|
| **도메인** (선택) | DNS TXT 레코드 | `securenomad.kr` 전체 (모든 서브도메인, http/https) |
| URL 접두어 | 메타 태그, HTML 파일 등 | 입력한 주소(`https://wiki.securenomad.kr`)만 |

→ 사이트 파일 수정 없이 DNS만으로 인증되고, 이후 다른 서브도메인을 추가해도 그대로 적용되는 **도메인 속성** 선택

### 소유권 확인

1. `search.google.com/search-console` → **속성 추가**
2. **도메인** 칸에 `securenomad.kr` 입력 (`wiki`, `https://` 없이)
3. 안내된 `google-site-verification=...` 값 복사
4. 가비아 DNS 관리툴 → DNS 설정 **[레코드 수정] → [레코드 추가]**

| 타입 | 호스트 | 값/위치 |
|---|---|---|
| TXT | `@` | `google-site-verification=발급값` |

5. Search Console에서 **확인**

:::info 호스트 `@`
`@` 는 루트 도메인(`securenomad.kr`) 자체를 의미함. GitHub 인증용 TXT(`_github-pages-challenge-...`)와 호스트가 달라 함께 등록해도 충돌하지 않음.
:::

현재 가비아 DNS 레코드 구성:

| 타입 | 호스트 | 용도 |
|---|---|---|
| TXT | `_github-pages-challenge-사용자명` | GitHub Pages 도메인 인증 |
| CNAME | `wiki` | GitHub Pages 연결 |
| TXT | `@` | Google Search Console 인증 |

### 등록 후 작업

**사이트맵 제출**

1. 왼쪽 메뉴 **색인 생성 → Sitemaps**
2. `https://wiki.securenomad.kr/sitemap.xml` 입력 → **제출**
3. 상태 **성공** 확인 (초기에는 "가져올 수 없음" 표시 후 변경될 수 있음)

:::caution
도메인 속성에서는 사이트맵 주소를 `wiki.` 를 포함한 **전체 URL**로 입력해야 함.
:::

**첫 화면 색인 생성 요청**

1. 상단 **URL 검사** 창에 `https://wiki.securenomad.kr/` 입력
2. "URL이 Google에 등록되어 있지 않음" 확인 (최초 등록 시 정상)
3. **색인 생성 요청** → "색인 생성 요청됨" 확인

나머지 페이지는 사이트맵을 통해 수집되므로 개별 요청은 생략함 (일일 요청 한도 있음).

## 6. 확인

배포 후 브라우저에서 직접 확인함.

- `https://wiki.securenomad.kr/robots.txt`
- `https://wiki.securenomad.kr/sitemap.xml`
- 첫 화면에서 우클릭 → **페이지 소스 보기** → `naver-site-verification`, `description` 태그 확인

검색 노출까지는 보통 며칠 ~ 몇 주 소요됨.

| 확인 방법 | 위치 |
|---|---|
| 수집 여부 | 네이버 · 구글에서 `site:wiki.securenomad.kr` 검색 |
| 네이버 수집 현황 | 서치어드바이저 → 리포트 |
| 구글 색인 현황 | Search Console → 색인 생성 → 페이지 |

### 등록 체크리스트

- [x] robots.txt, sitemap.xml, 메타 태그 배포
- [x] 네이버 서치어드바이저: 소유 확인, 사이트맵 제출, 수집 요청
- [x] Google Search Console: 도메인 속성 소유 확인, 사이트맵 제출, 색인 생성 요청
- [ ] Bing Webmaster Tools: Search Console에서 가져오기 (선택)

## 앞으로 문서 작성 시

- 모든 문서 front matter에 `description` 작성
- 제목(`title`)에 핵심 키워드 포함
- 이미지에는 대체 텍스트 작성: `![XSS 공격 흐름도](/img/xss-flow.png)`
