---
title: Node.js 설치 중 Visual Studio Installer 멈춤
sidebar_label: VS Installer 멈춤
sidebar_position: 1
---

# Node.js 설치 중 Visual Studio Installer 멈춤

## 증상

Node.js 설치 후 파란 콘솔 창이 뜨고 아래 로그에서 진행이 멈춘다.

```text
Download requested: https://aka.ms/vs/installer/latest/feed
Warning: Failed to update the latest installer feed 작업이 취소되었습니다.
Warning: Didn't find any channel feed.
Authenticode verification returned 0x00000000 for path: C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe.
```

## 원인

Node.js 설치 마법사의 **"Automatically install the necessary tools"** 옵션을 체크하면, 설치 후 Chocolatey · Python · Visual Studio Build Tools(C++ 빌드 도구)를 추가로 설치하는 스크립트가 실행된다.
이 도구는 네이티브 모듈을 컴파일할 때만 필요하며 **Docusaurus에는 필요 없다.**

## 해결

1. 콘솔 창과 Visual Studio Installer 창을 닫는다. Node.js 본체는 이미 설치가 끝난 상태다.
2. 새 터미널에서 확인한다.
   ```bash
   node -v
   npm -v
   ```
3. 명령을 찾지 못하면 재부팅 → 그래도 안 되면 Node.js 설치 파일에서 **Repair** (체크박스는 해제).

## 정리

Docusaurus 용도라면 Node.js 설치 시 추가 도구 옵션은 체크하지 않는다.
