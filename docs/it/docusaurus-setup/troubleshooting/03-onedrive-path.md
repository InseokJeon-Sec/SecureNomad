---
title: OneDrive 폴더에 프로젝트를 만들 때의 문제
sidebar_label: OneDrive 경로
sidebar_position: 3
---

# OneDrive 폴더에 프로젝트를 만들 때의 문제

## 상황

GitHub Desktop의 기본 저장소 경로가 OneDrive 안이었다.

```text
C:\Users\사용자\OneDrive\문서\GitHub\SecureNomad
```

## 문제점

- Docusaurus의 `node_modules` 는 파일이 수만 개라 **OneDrive 동기화가 계속 돌아간다.**
- 동기화 중 파일이 잠기면 `npm install` / `npm run build` 에서 `EPERM`, `EBUSY` 같은 에러가 날 수 있다.
- 클라우드 저장 용량도 불필요하게 차지한다.
- 경로에 한글(`문서`)이 포함되어 일부 도구에서 문제가 될 수 있다.

## 해결

OneDrive 밖의 짧은 영문 경로에 새로 만들었다.

```bash
mkdir C:\dev
cd /d C:\dev
npx create-docusaurus@latest SecureNomad classic
```

OneDrive 쪽에 만들었던 빈 저장소는 GitHub Desktop에서 **Repository → Remove** 로 정리했다.

## 정리

개발 프로젝트는 `C:\dev` 처럼 **동기화 폴더 밖, 영문 경로**에 둔다.
백업은 GitHub 저장소가 대신한다.
