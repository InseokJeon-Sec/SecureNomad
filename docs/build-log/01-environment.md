---
title: 01. 개발 환경 준비
sidebar_position: 1
---

# 01. 개발 환경 준비

## 설치한 프로그램
| 프로그램 | 용도 |
|---|---|
| Node.js (LTS, v24) | Docusaurus 실행 |
| GitHub Desktop | 커밋 / 푸시 |
| VS Code | 문서 편집 |

:::tip
Node.js 설치 중 "Automatically install the necessary tools"는 체크하지 않아도 된다.
Docusaurus에는 필요 없고, 설치가 오래 걸리거나 멈출 수 있다.
:::

## 프로젝트 생성
```bash
mkdir C:\dev
cd /d C:\dev
npx create-docusaurus@latest SecureNomad classic
cd SecureNomad
npm start
```

:::warning
OneDrive 폴더 안에 프로젝트를 만들면 node_modules 동기화 문제가 생길 수 있다.
C:\dev 처럼 OneDrive 밖에 만드는 것이 좋다.
:::