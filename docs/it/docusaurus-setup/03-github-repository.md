---
title: 03. GitHub 저장소 연결
sidebar_label: 03. GitHub 저장소 연결
sidebar_position: 3
description: GitHub Desktop으로 로컬 프로젝트를 저장소로 만들고 GitHub에 Publish하기
---

# 03. GitHub 저장소 연결

## 1. 로컬 폴더를 Git 저장소로 등록

GitHub Desktop에서 진행한다.

1. **File → Add local repository**
2. **Choose...** → `C:\dev\SecureNomad` 선택
3. "This directory does not appear to be a Git repository" 안내가 뜨면 **create a repository** 클릭

:::warning 폴더가 하나 더 생기는 문제
`create a repository` 창은 **Local path 안에 Name 이름의 폴더를 새로 만든다.**
그래서 `C:\dev\SecureNomad\SecureNomad` 처럼 폴더가 중첩되어 생겼다.
→ [Troubleshooting: 저장소 폴더 중복 생성](./troubleshooting/04-nested-repository.md)
:::

### 확실한 방법: 터미널에서 git init

Git for Windows를 설치했다면 터미널에서 직접 만드는 것이 가장 확실하다.

```bash
cd /d C:\dev\SecureNomad
git init -b main
```

그다음 GitHub Desktop에서 **File → Add local repository** → `C:\dev\SecureNomad` → **Add repository**.

## 2. 첫 커밋

1. **Changes** 탭에 Docusaurus 파일 목록이 보인다.
2. 목록에 **`node_modules`가 없는지 확인**한다. (`.gitignore`가 제외해 준다)
3. Summary: `docusaurus 프로젝트 생성` → **Commit to main**

## 3. GitHub에 Publish

1. 상단 **Publish repository** 클릭
2. 설정

| 항목 | 값 | 이유 |
|---|---|---|
| Name | `SecureNomad` | 사이트 주소의 경로가 된다 |
| Keep this code private | **체크 해제** | 무료 계정의 GitHub Pages는 Public 저장소만 지원 |

3. **Publish repository** 클릭

결과: `https://github.com/InseokJeon-Sec/SecureNomad`

:::caution Public 저장소 주의
Public 저장소는 누구나 모든 파일과 커밋 이력을 볼 수 있다.
실습 중의 IP, 계정, API 키, 내부 화면 캡처가 MD나 이미지에 섞이지 않도록 **커밋 전에 Changes 목록을 확인**한다.
한 번 push한 내용은 파일을 지워도 이력에 남는다.
:::

## 저장소 이름과 사이트 주소

| 저장소 이름 | 사이트 주소 | `baseUrl` |
|---|---|---|
| `사용자명.github.io` | `https://사용자명.github.io/` | `/` |
| `SecureNomad` (선택) | `https://inseokjeon-sec.github.io/SecureNomad/` | `/SecureNomad/` |

나중에 개인 도메인을 연결하면 어느 쪽이든 `baseUrl`은 `/`가 된다.
