---
title: GitHub Desktop "Unable to locate Git"
sidebar_label: Unable to locate Git
sidebar_position: 2
---

# GitHub Desktop "Unable to locate Git"

## 증상

GitHub Desktop에서 **Repository → Open in Command Prompt** 를 누르면 다음 창이 뜬다.

```text
Unable to locate Git
We were unable to locate Git on your system. This means you won't be able
to execute any Git commands in the command prompt.
```

## 원인

GitHub Desktop은 **자체 Git을 내장**하고 있어서 앱 안의 커밋·푸시는 동작한다.
하지만 시스템(터미널)에서 쓰는 `git` 명령은 별도로 설치되어 있지 않은 상태다.

## 해결

- 당장은 **Open without Git** 을 눌러도 터미널은 열린다 (npm 명령은 사용 가능).
- 근본 해결은 **Git for Windows 설치** (git-scm.com, 기본 옵션).
  설치하지 않으면 이후 `npm run build`에서 에러가 난다.
  → [outside any Git worktree](./07-git-worktree-error.md)

## 정리

GitHub Desktop을 쓰더라도 Git for Windows는 따로 설치해 두는 것이 좋다.
