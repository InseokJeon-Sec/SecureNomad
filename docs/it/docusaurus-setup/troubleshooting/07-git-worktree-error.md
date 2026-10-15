---
title: "npm run build: outside any Git worktree"
sidebar_label: Git worktree 에러
sidebar_position: 7
---

# npm run build: outside any Git worktree

## 증상

```text
[ERROR] Loading of version failed for version current
[ERROR] Error: Unable to build website for locale ko.
  [cause]: Error: Can't process doc metadata for doc at path ...\docs\intro.md
    [cause]: Error: This Docusaurus site is outside any Git worktree.
    Unable to read Git info for file "C:\dev\SecureNomad\docs\intro.md"
```

## 원인

`docusaurus.config.js` 에 추가한 옵션 때문이다.

```js
docs: {
  showLastUpdateTime: true,   // 문서 하단에 마지막 수정일 표시
},
```

이 옵션은 빌드할 때 **`git log` 로 각 파일의 마지막 커밋 시간을 읽는다.**
PC에 Git for Windows가 없어서(GitHub Desktop 내장 Git만 있음) `git` 명령을 실행할 수 없었고, Docusaurus는 이를 "Git 저장소 밖"으로 판단했다.

## 해결

**Git for Windows 설치** (git-scm.com, 기본 옵션) → VS Code 재시작 → 확인

```bash
git --version
npm run build
```

대안: `showLastUpdateTime: true` 줄을 삭제하면 Git 없이도 빌드된다 (수정일 표시만 사라짐).

## 참고

GitHub Actions 러너에는 Git이 설치되어 있어 서버 빌드에서는 이 문제가 없다.
다만 워크플로에서 `fetch-depth: 0` 을 지정해야 전체 이력을 받아와 수정일이 정확히 표시된다.
