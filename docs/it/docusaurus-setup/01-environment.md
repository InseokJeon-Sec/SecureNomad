---
title: 01. 개발 환경 준비
sidebar_label: 01. 개발 환경 준비
sidebar_position: 1
description: Docusaurus 사이트 구축을 위해 Windows PC에 설치한 프로그램과 확인 방법
---

# 01. 개발 환경 준비

Windows PC에서 Docusaurus 사이트를 만들고 GitHub Pages로 배포하기 위해 설치한 프로그램을 정리한다.

## 전체 구성

```text
[내 PC]                                   [GitHub]
VS Code ── MD 문서 작성                   저장소(SecureNomad)
Node.js ── npm start / npm run build          │
Git + GitHub Desktop ── commit / push ──▶  GitHub Actions(빌드)
                                              │
                                          GitHub Pages(사이트 공개)
```

## 설치한 프로그램

| 프로그램 | 용도 | 설치한 버전 |
|---|---|---|
| Node.js (LTS) | Docusaurus 실행, 빌드 | v24.22.0 (npm 11.19.1) |
| Git for Windows | 터미널 git 명령, 문서 수정일 표시 | 최신 |
| GitHub Desktop | 커밋 / 푸시를 버튼으로 처리 | 최신 |
| Visual Studio Code | MD 문서 편집, 내장 터미널 | 최신 |

## 1. Node.js

- 다운로드: nodejs.org → **LTS** 버전
- Docusaurus 3.x는 Node.js 20 이상이 필요하다. 이후 버전은 24 이상을 요구할 예정이라 처음부터 24 LTS를 설치했다.
- 설치 옵션은 기본값으로 진행한다.

:::warning
설치 중간의 **"Automatically install the necessary tools"** 체크박스는 체크하지 않는다.
Visual Studio Build Tools(C++ 빌드 도구)를 추가로 설치하는 옵션인데 Docusaurus에는 필요 없고, 설치 창이 멈춘 것처럼 보일 수 있다.
→ [Troubleshooting: Node.js 설치 중 Visual Studio Installer 멈춤](./troubleshooting/01-vs-installer-hang.md)
:::

설치 확인:

```bash
node -v
npm -v
```

## 2. Git for Windows

- 다운로드: git-scm.com → Download for Windows
- 설치 옵션은 **모두 기본값**으로 진행한다.

:::info GitHub Desktop만으로는 부족한 이유
GitHub Desktop에는 자체 Git이 내장되어 있지만, **터미널에서 쓰는 `git` 명령은 별도로 설치해야 한다.**
Docusaurus의 `showLastUpdateTime`(문서 마지막 수정일 표시) 기능은 빌드할 때 `git` 명령으로 파일 이력을 읽기 때문에, Git for Windows가 없으면 로컬 빌드가 실패한다.
→ [Troubleshooting: outside any Git worktree](./troubleshooting/07-git-worktree-error.md)
:::

설치 후 사용자 정보를 한 번 등록한다.

```bash
git config --global user.name "이름"
git config --global user.email "GitHub 가입 이메일"
git --version
```

## 3. GitHub Desktop

- 다운로드: desktop.github.com
- GitHub 계정으로 로그인한다.
- 커밋, 푸시, 저장소 생성(Publish)을 버튼으로 처리한다.

## 4. Visual Studio Code

- 다운로드: code.visualstudio.com
- 설치 중 "추가 작업 선택"에서 다음 항목을 체크한다.
  - "Code(으)로 열기" 작업을 Windows 탐색기 파일/디렉터리 메뉴에 추가
  - PATH에 추가
- 설치 후 **GitHub Desktop을 완전히 종료했다가 다시 실행**해야 `File → Options → Integrations → External editor` 목록에 Visual Studio Code가 나타난다.

### VS Code 터미널을 명령 프롬프트로 변경

VS Code 터미널의 기본값인 PowerShell은 `npm` 실행이 막힐 수 있다.

1. `Ctrl + Shift + P` → `Terminal: Select Default Profile`
2. **Command Prompt** 선택
3. 터미널을 닫고 `` Ctrl + ` ``로 다시 열기

→ [Troubleshooting: PowerShell 실행 정책 오류](./troubleshooting/06-powershell-execution-policy.md)

## 확인 체크리스트

- [x] `node -v` → v24.x
- [x] `npm -v` → 버전 출력
- [x] `git --version` → 버전 출력
- [x] GitHub Desktop 로그인
- [x] VS Code 터미널 = Command Prompt
