---
title: 04. GitHub Pages 자동 배포
sidebar_label: 04. GitHub Pages 배포
sidebar_position: 4
description: docusaurus.config.js 설정, GitHub Actions 워크플로 작성, Pages 활성화
---

# 04. GitHub Pages 자동 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드해서 GitHub Pages에 배포하도록 구성한다.

```text
git push (main)
   └─▶ GitHub Actions: npm ci → npm run build
          └─▶ build 폴더 업로드 → GitHub Pages 배포
                 └─▶ https://inseokjeon-sec.github.io/SecureNomad/
```

## 1. GitHub Pages 소스 변경

1. 저장소 → **Settings**
2. 왼쪽 메뉴 **Code, planning, and automation → Pages**
   (General 화면에는 Source 항목이 없다)
3. **Build and deployment → Source** 를 **GitHub Actions** 로 변경

## 2. docusaurus.config.js

```js
  title: 'SecureNomad',
  tagline: '보안과 IT 지식 정리',

  url: 'https://inseokjeon-sec.github.io',   // 소문자
  baseUrl: '/SecureNomad/',                   // 저장소 이름, 앞뒤 슬래시 필수
  trailingSlash: false,

  organizationName: 'InseokJeon-Sec',         // GitHub 사용자명 그대로
  projectName: 'SecureNomad',                 // 저장소 이름

  i18n: {
    defaultLocale: 'ko',                      // 소문자 ko
    locales: ['ko'],
  },
```

| 항목 | 주의점 |
|---|---|
| `url` | 도메인은 대소문자 구분이 없지만 GitHub Pages는 소문자로 표기한다 |
| `baseUrl` | 대소문자를 구분한다. 저장소 이름과 정확히 같아야 한다 |
| `organizationName` | `github.com/사용자명/저장소` 의 사용자명 그대로 (하이픈 포함) |
| `defaultLocale` | `Ko`가 아니라 `ko` |

## 3. GitHub Actions 워크플로

프로젝트 최상위에 `.github/workflows/deploy.yml` 을 만든다.
VS Code에서 새 파일 이름을 `.github/workflows/deploy.yml` 로 입력하면 폴더가 자동으로 생성된다.

```yaml title=".github/workflows/deploy.yml"
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

| 부분 | 의미 |
|---|---|
| `on.push.branches: [main]` | main에 push될 때마다 실행 |
| `workflow_dispatch` | Actions 탭에서 수동 실행 버튼 활성화 |
| `permissions` | Pages 배포에 필요한 최소 권한만 부여 |
| `fetch-depth: 0` | 전체 커밋 이력을 받아온다. 문서 마지막 수정일 표시에 필요 |
| `npm ci` | `package-lock.json` 기준으로 정확히 같은 버전 설치 |
| `upload-pages-artifact` / `deploy-pages` | `build` 폴더를 Pages에 배포 |

## 4. 커밋 & Push

GitHub Desktop에서

1. Changes에 `docusaurus.config.js`, `.github/workflows/deploy.yml` 확인
2. Summary: `배포 설정 추가` → **Commit to main**
3. **Push origin** 클릭 (누르지 않으면 PC에만 저장된다)

## 5. 배포 확인

1. 저장소 **Actions** 탭 → `Deploy to GitHub Pages` 실행 확인
2. 2~3분 뒤 초록 체크 표시
3. `https://inseokjeon-sec.github.io/SecureNomad/` 접속

실패(빨간 X)하면 해당 실행을 눌러 로그를 확인한다. 처음 push가 Pages 설정 전이었다면 **Re-run jobs**로 다시 실행한다.

→ [Troubleshooting: 배포 후 404](./troubleshooting/05-pages-404.md)

## 이후: 커스텀 도메인 연결

이후 `wiki.securenomad.kr` 도메인을 연결하면서 사이트 주소와 `baseUrl` 이 변경됨.
→ [06. 커스텀 도메인 연결](./06-custom-domain.md)
