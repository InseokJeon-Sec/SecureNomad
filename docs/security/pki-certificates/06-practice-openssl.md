---
title: 실무 — OpenSSL과 인증서 운영
sidebar_label: 06. 실무 (OpenSSL)
sidebar_position: 6
description: OpenSSL로 키·CSR 생성, 인증서 확인·디버깅, 형식 변환, 풀체인 배포, 만료 모니터링과 사내 CA 운영 실무
tags: [PKI, OpenSSL, 실무, 인증서]
---

# 실무 — OpenSSL과 인증서 운영

이론을 실제 명령·운영으로 연결합니다. (아래 명령은 **본인 소유 서버·도메인**의 인증서를 관리하기 위한 표준 작업입니다.)

## I. 키와 CSR 생성

```bash
# 1) 개인키 생성 (ECC 권장: P-256)
openssl ecparam -genkey -name prime256v1 -out server.key
#   (RSA를 쓰면) openssl genrsa -out server.key 2048

# 2) CSR 생성 (공개키 + 신원). SAN 포함이 중요
openssl req -new -key server.key -out server.csr \
  -subj "/C=KR/O=SecureNomad/CN=example.com" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com"
```

- 개인키 `server.key`는 **서버 밖으로 내보내지 않음**
- CSR을 CA(또는 ACME)에 제출 → 인증서 수령

## II. 인증서 내용 확인·디버깅

```bash
# 인증서 상세 보기 (Subject/Issuer/SAN/유효기간/확장)
openssl x509 -in server.crt -noout -text

# 유효기간만
openssl x509 -in server.crt -noout -dates

# SAN만 확인
openssl x509 -in server.crt -noout -ext subjectAltName

# 키와 인증서가 짝이 맞는지(모듈러스/공개키 해시 비교)
openssl pkey -in server.key -pubout -outform der | openssl sha256
openssl x509 -in server.crt -pubkey -noout -outform der | openssl sha256
#   두 해시가 같으면 짝이 맞음
```

### 서버에 실제 적용된 체인 점검 (원격)

```bash
# 핸드셰이크·제시된 체인·만료 확인
openssl s_client -connect example.com:443 -servername example.com -showcerts

# 만료일만 빠르게
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -dates
```

:::tip 가장 흔한 사고 — 중간 CA 누락
`s_client` 결과에 **Intermediate가 안 보이면** 체인 불완전입니다. 일부 클라이언트(모바일·구형)에서만 오류가 나 재현이 까다롭습니다. **풀체인(fullchain)으로 배포**하세요. ([03. 신뢰 체인](./03-root-trust-chain.md))
:::

## III. 형식 변환

```bash
# PEM → PKCS#12(.pfx)  (인증서+키+체인 묶음, Windows/IIS 등)
openssl pkcs12 -export -out bundle.pfx \
  -inkey server.key -in server.crt -certfile chain.crt

# PKCS#12(.pfx) → PEM
openssl pkcs12 -in bundle.pfx -nodes -out all.pem

# DER ↔ PEM
openssl x509 -in cert.der -inform der -out cert.pem -outform pem
```

## IV. 풀체인 배포

```text
fullchain.pem =  [ Leaf 인증서 ]
                 [ Intermediate 인증서 ]   ← 반드시 포함
                 (Root는 보통 생략 — 클라이언트 트러스트 스토어에 이미 있음)
```

- Nginx: `ssl_certificate fullchain.pem; ssl_certificate_key server.key;`
- 순서 주의: Leaf가 먼저, 그 다음 Intermediate

## V. 만료 모니터링 (자동화)

짧아진 수명 때문에 **만료 감시는 필수**입니다.

```bash
# 만료까지 남은 일수 체크 (크론/모니터링에 연결)
exp=$(echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -enddate | cut -d= -f2)
echo "만료: $exp"
# -checkend: 30일 내 만료면 종료코드 1
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -checkend 2592000 && echo "30일 이상 여유" || echo "⚠ 30일 내 만료"
```

- 실무: Prometheus blackbox exporter, Uptime 모니터, 클라우드 인증서 관리자의 만료 알림 활용
- 가능하면 **ACME 자동 갱신**으로 수작업 자체를 없애기 ([05. 수명주기](./05-lifecycle-renewal.md))

## VI. 사내 CA(Private CA) — 개념

내부 서비스·mTLS용으로 **사설 CA**를 운영하기도 합니다.

```bash
# (개념) 사내 Root CA 생성
openssl req -x509 -newkey rsa:4096 -days 3650 -nodes \
  -keyout rootCA.key -out rootCA.crt -subj "/O=SecureNomad Internal/CN=SecureNomad Root CA"
```

- 사내 Root를 **직원 기기 트러스트 스토어에 배포**해야 신뢰됨(그룹정책/MDM)
- 용도: 내부망 HTTPS, 서비스 간 mTLS([04](./04-auth-logic-tls.md)), 테스트 환경
- 운영엔 전용 도구(step-ca, HashiCorp Vault PKI, EJBCA 등) 권장

## VII. 보안 체크리스트

- [ ] 개인키 권한 최소화(`chmod 600`), 서버 밖 유출 금지
- [ ] 키 길이·알고리즘 적정(ECC P-256 / RSA 2048 이상)
- [ ] 풀체인 배포(중간 CA 포함)
- [ ] TLS 1.2+ 만 허용, 취약 암호군 비활성화
- [ ] OCSP Stapling 활성화
- [ ] 만료 모니터링·자동 갱신
- [ ] CT 로그로 자사 도메인 미승인 발급 감시

## VIII. 결론
실무의 핵심은 **키 보호 · 풀체인 배포 · 자동 갱신 · 만료 감시**입니다. OpenSSL로 생성·검증·변환을 다루되, 운영은 ACME·관리형 서비스로 자동화하는 것이 짧아진 인증서 수명 시대의 정답입니다.
