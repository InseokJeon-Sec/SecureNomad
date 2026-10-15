---
title: PowerShell 실행 정책으로 npm 실행 불가
sidebar_label: PowerShell 실행 정책
sidebar_position: 6
---

# PowerShell 실행 정책으로 npm 실행 불가

## 증상

VS Code 터미널에서 `npm run build` 실행 시:

```text
npm : 이 시스템에서 스크립트를 실행할 수 없으므로 C:\Program Files\nodejs\npm.ps1 파일을
로드할 수 없습니다. 자세한 내용은 about_Execution_Policies를 참조하십시오.
    + CategoryInfo          : 보안 오류: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess
```

## 원인

VS Code 터미널의 기본값은 **PowerShell** 이다.
Windows의 PowerShell 실행 정책 기본값(`Restricted`)은 `.ps1` 스크립트 실행을 막는데, PowerShell에서 `npm` 을 입력하면 `npm.ps1` 이 실행되므로 차단된다.
GitHub Desktop에서 연 **명령 프롬프트(cmd)** 는 `npm.cmd` 를 쓰기 때문에 문제가 없었다.

## 해결

### 방법 1. VS Code 기본 터미널을 Command Prompt로 변경 (선택)

1. `Ctrl + Shift + P` → `Terminal: Select Default Profile` → **Command Prompt**
2. 터미널 휴지통 아이콘으로 닫고 `` Ctrl + ` `` 로 다시 열기
3. 프롬프트가 `PS C:\...` 가 아닌 `C:\dev\SecureNomad>` 인지 확인

시스템 보안 정책을 변경하지 않는 방법이다.

### 방법 2. 현재 사용자 실행 정책 변경

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

| 정책 | 의미 |
|---|---|
| `Restricted` | 모든 스크립트 실행 차단 (Windows 클라이언트 기본값) |
| `RemoteSigned` | 로컬 스크립트는 허용, 인터넷에서 받은 스크립트는 서명 필요 |
| `Unrestricted` / `Bypass` | 제한 없음 (권장하지 않음) |

`-Scope CurrentUser` 는 현재 사용자에게만 적용되어 관리자 권한이 필요 없다.

## 보안 관점 메모

실행 정책은 보안 경계가 아니라 **실수로 스크립트가 실행되는 것을 막는 안전장치**에 가깝다 (`powershell -ExecutionPolicy Bypass` 로 쉽게 우회 가능).
그래도 불필요하게 완화하지 않는 것이 원칙이라 방법 1을 선택했다.
