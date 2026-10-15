---
title: GitHub Desktop 저장소 폴더 중복 생성
sidebar_label: 저장소 폴더 중복 생성
sidebar_position: 4
---

# GitHub Desktop 저장소 폴더 중복 생성

## 증상

`C:\dev\SecureNomad` 를 저장소로 만들려고 **Add local repository → create a repository** 를 사용했는데, 아래처럼 하위 폴더가 새로 생기고 그 안에 `.gitattributes` 만 들어 있었다.

```text
C:\dev\SecureNomad\SecurNomad\      ← 1차 시도 (Name 오타)
C:\dev\SecureNomad\SecureNomad\     ← 2차 시도 (Local path를 바꿔도 동일)
```

## 원인

`create a repository` 창은 **[Local path] 안에 [Name] 폴더를 새로 만들고** 그 안에 `.git` 을 생성한다.
기존 폴더를 그대로 저장소로 만드는 기능이 아니다.

## 해결 (실제로 한 방법)

1. 파일 탐색기 **보기 → 표시 → 숨긴 항목** 체크
2. `C:\dev\SecureNomad\SecureNomad\` 안의 **`.git` 폴더와 `.gitattributes`** 를 잘라내기
3. 한 단계 위 `C:\dev\SecureNomad\` 에 붙여넣기
4. 비어 있는 하위 `SecureNomad` 폴더 삭제
5. GitHub Desktop에서 기존 항목 **Remove** → **Add local repository** 로 `C:\dev\SecureNomad` 추가
6. Changes 탭의 파일 전체를 커밋

## 더 간단한 방법

Git for Windows가 설치되어 있다면 터미널에서 바로 만든다.

```bash
cd /d C:\dev\SecureNomad
git init -b main
```

이후 GitHub Desktop에서 **Add local repository** 로 추가만 하면 된다.
