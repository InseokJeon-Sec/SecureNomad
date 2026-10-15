---
title: 02. Docusaurus 프로젝트 생성
sidebar_label: 02. 프로젝트 생성
sidebar_position: 2
description: OneDrive 밖에 Docusaurus 프로젝트를 만들고 로컬에서 실행하기
---

# 02. Docusaurus 프로젝트 생성

## 프로젝트 위치 정하기

프로젝트는 **`C:\dev\SecureNomad`** 에 만들었다.

:::danger OneDrive 폴더에 만들지 않는다
GitHub Desktop 기본 경로가 `C:\Users\사용자\OneDrive\문서\GitHub\`로 잡혀 있었다.
Docusaurus는 `node_modules`에 수만 개의 파일을 만들기 때문에 OneDrive 동기화가 계속 돌고, 파일 잠금으로 빌드 에러가 날 수 있다.
→ [Troubleshooting: OneDrive 경로 문제](./troubleshooting/03-onedrive-path.md)
:::

## 프로젝트 생성

명령 프롬프트에서 실행한다.

```bash
mkdir C:\dev
cd /d C:\dev
npx create-docusaurus@latest SecureNomad classic
```

| 질문 | 선택 |
|---|---|
| `Ok to proceed? (y)` | `y` |
| JavaScript / TypeScript | **JavaScript** |

`Successfully created` 메시지가 나오면 완료된 것이다.

:::tip `cd /d`
명령 프롬프트에서 다른 드라이브(예: OneDrive가 있는 경로 → C:\dev)로 이동할 때는 `/d` 옵션을 붙여야 드라이브까지 함께 바뀐다.
:::

## 로컬 실행

```bash
cd SecureNomad
npm start
```

다음 메시지가 나오면 성공이다.

```text
client (Rspack 1.7.12) compiled successfully
```

브라우저에서 `http://localhost:3000` 으로 기본 사이트를 확인한다.
종료는 터미널에서 `Ctrl + C` → `Y`.

:::info npm start 와 npm run build
- `npm start`: 개발 서버. 파일을 저장하면 화면에 바로 반영된다. 작성 중 미리보기용.
- `npm run build`: 실제 배포용 결과물을 `build` 폴더에 만든다. 깨진 링크 같은 에러를 여기서 잡아준다.
:::

## 생성된 폴더 구조

```text
SecureNomad/
├── blog/                  # 블로그 예제 (이후 삭제)
├── docs/                  # 문서(MD) 폴더 → 사이드바 메뉴가 된다
├── src/
│   ├── css/custom.css     # 사이트 스타일
│   └── pages/             # 홈 화면 등 일반 페이지 (이후 정리)
├── static/                # 이미지 등 정적 파일 (static/img/...)
├── docusaurus.config.js   # 사이트 전체 설정
├── sidebars.js            # 사이드바 구성
├── package.json           # 의존성, 실행 스크립트
└── .gitignore             # node_modules, build 등 Git 제외 목록
```
