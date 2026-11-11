---
title: LLM 시스템의 접근 통제
sidebar_position: 2
description: 멀티유저·멀티테넌트 LLM 애플리케이션의 접근 통제 — 인증, 인가(RBAC·ABAC·모델 수준 권한), 에이전트·도구 인가, 테넌트 격리, API 키 관리, 감사·컴플라이언스.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/12-security-and-access/02-access-control.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·모델명·버전·CVE·RFC·라이선스명은 원문 표기를 유지합니다. 코드는 원문 그대로 둡니다.
:::

# LLM 시스템의 접근 통제

안전한 접근 통제는 멀티유저·멀티테넌트 LLM 애플리케이션에 필수다. 이 장은 인증·인가·데이터 격리 패턴을 다룬다.

## 접근 통제 요구사항

### 보안 차원

| 차원 | 설명 | 통제 수단 |
|-----------|-------------|----------|
| **인증(Authentication)** | 누가 요청하는가? | API 키·OAuth·JWT·워크로드 신원 |
| **인가(Authorization)** | 무엇을 할 수 있나? | RBAC·ABAC·정책 |
| **격리(Isolation)** | 어떤 데이터를 볼 수 있나? | 테넌트 필터링·암호화 |
| **감사(Audit)** | 무엇을 했나? | 로깅·컴플라이언스 리포트 |

### LLM 고유의 관심사

| 관심사 | 위험 | 완화 |
|---------|------|------------|
| 프롬프트 인젝션 | 접근 통제 우회 | 입력 검증 |
| 데이터 유출 | 교차 테넌트 노출 | 엄격한 필터링 |
| 모델 출력 | 보호 정보 노출 | 출력 필터링 |
| 컨텍스트 오염 | 권한 없는 데이터 주입 | 컨텍스트 검증 |
| 에이전트 자격증명 | 탈취된 에이전트·어시스턴트 세션이 토큰 재사용 | 범위 한정·단기·발신자 제약 토큰 |
| 도구 서버 간 혼동된 대리자 | 한 서버가 다른 서버용 자격증명을 가로챔 | 모든 자격증명을 발급자·대상(audience)에 바인딩 |

---

## 인증 패턴

### API 키 인증

```python
class APIKeyAuthenticator:
    def __init__(self, key_store):
        self.key_store = key_store
    
    async def authenticate(self, api_key: str) -> AuthResult:
        if not api_key:
            return AuthResult(authenticated=False, error="Missing API key")
        
        # Hash the key for lookup
        key_hash = self.hash_key(api_key)
        
        # Look up in store
        key_record = await self.key_store.get(key_hash)
        
        if not key_record:
            return AuthResult(authenticated=False, error="Invalid API key")
        
        if key_record.expired:
            return AuthResult(authenticated=False, error="Expired API key")
        
        if key_record.revoked:
            return AuthResult(authenticated=False, error="Revoked API key")
        
        return AuthResult(
            authenticated=True,
            user_id=key_record.user_id,
            tenant_id=key_record.tenant_id,
            scopes=key_record.scopes
        )
    
    def hash_key(self, key: str) -> str:
        return hashlib.sha256(key.encode()).hexdigest()
```

### 스코프를 담은 JWT

```python
class JWTAuthenticator:
    def __init__(self, public_key: str):
        self.public_key = public_key
    
    async def authenticate(self, token: str) -> AuthResult:
        try:
            payload = jwt.decode(
                token,
                self.public_key,
                algorithms=["RS256"],
                audience="llm-api"
            )
            
            return AuthResult(
                authenticated=True,
                user_id=payload["sub"],
                tenant_id=payload.get("tenant_id"),
                scopes=payload.get("scopes", []),
                expires_at=datetime.fromtimestamp(payload["exp"])
            )
        except jwt.ExpiredSignatureError:
            return AuthResult(authenticated=False, error="Token expired")
        except jwt.InvalidTokenError as e:
            return AuthResult(authenticated=False, error=str(e))
```

### 정적 키 대신 워크로드 신원

정적 API 키는 에이전트 플릿의 가장 약한 고리이고, 공격자는 이제 이를 이름으로 노린다. ChainDrop npm 웜(2026-08)은 클라우드·GitHub 자격증명과 함께 OpenAI·Anthropic·Cursor·Codex·Gemini 토큰을 수확했다. Mandiant는 공격자가 살아있는 AI 코딩 어시스턴트 세션을 장악하고, 어시스턴트가 이미 오염된 패키지를 추천하며, 훔친 GitHub OAuth 토큰으로 Shai-Hulud 웜이 약 100개 내부 저장소로 번진 침해를 기술했다. 제공자들은 그에 맞춰 움직였다: OpenAI가 상호 TLS·X.509 워크로드 신원 연합을 GA(2026-08-29)하고, 조직·프로젝트 수준 최대 수명의 API 키 만료를 추가(9/10)하며, 관리자가 키 생성을 제한·비활성화할 수 있게 했다(9/15).

따르는 규칙:

- **워크로드 신원을 선호**(mTLS·연합 단기 토큰) — 서비스 대 제공자 호출에. 키가 남는 곳엔 각각 소유자·만료·지출 상한을 둔다.
- **에이전트나 AI 어시스턴트 세션을 주체(principal)로 취급** — 자신의 범위 한정 자격증명·모니터링을 주고, 원시 API 키·장수명 OAuth 토큰은 손닿지 않게.
- **발신자 제약 토큰 사용** — 프로토콜이 지원하는 곳(DPoP, RFC 9449)에서, 훔친 베어러 토큰만으로는 부족하도록.

---

## 인가 모델

### 역할 기반 접근 통제(RBAC)

```python
class RBACAuthorizer:
    ROLE_PERMISSIONS = {
        "admin": ["*"],
        "developer": ["generate", "embed", "fine_tune", "read_metrics"],
        "user": ["generate", "embed"],
        "viewer": ["read_metrics"]
    }
    
    def authorize(self, user: User, action: str) -> bool:
        permissions = self.ROLE_PERMISSIONS.get(user.role, [])
        
        if "*" in permissions:
            return True
        
        return action in permissions
```

### 속성 기반 접근 통제(ABAC)

```python
class ABACAuthorizer:
    def __init__(self, policy_engine):
        self.policy_engine = policy_engine
    
    async def authorize(
        self,
        subject: dict,       # Who (user attributes)
        action: str,         # What (operation)
        resource: dict,      # On what (resource attributes)
        context: dict        # When/where (environmental)
    ) -> AuthzResult:
        # Evaluate all applicable policies
        policies = await self.policy_engine.get_policies(action)
        
        for policy in policies:
            result = policy.evaluate(subject, action, resource, context)
            if result == PolicyResult.DENY:
                return AuthzResult(allowed=False, reason=policy.name)
            if result == PolicyResult.ALLOW:
                return AuthzResult(allowed=True)
        
        return AuthzResult(allowed=False, reason="No matching policy")
```

### 모델 수준 권한

```python
class ModelAccessControl:
    MODEL_TIERS = {
        "claude-fable-5-1": ["enterprise"],
        "claude-opus-5-5": ["enterprise", "professional"],
        "gpt-6-sol": ["enterprise", "professional"],
        "claude-haiku-4-5": ["enterprise", "professional", "starter"],
        "gpt-6-luna": ["enterprise", "professional", "starter"]
    }
    
    def __init__(self, zdr_eligible: set[str]):
        # Load from your vendor agreements, not from code: retention terms are
        # per model (e.g. Fable 5.1 requires 30-day retention unless authorized)
        self.zdr_eligible = zdr_eligible
    
    def can_access_model(self, user: User, model: str) -> bool:
        if user.tier not in self.MODEL_TIERS.get(model, []):
            return False
        if user.tenant.requires_zdr and model not in self.zdr_eligible:
            return False
        return True
    
    def get_available_models(self, user: User) -> list[str]:
        return [
            model for model in self.MODEL_TIERS
            if self.can_access_model(user, model)
        ]
```

모델 접근은 이제 벤더 쪽에서도 게이트된다: Anthropic 문서는 Mythos 5.1을 Project Glasswing 참가자로 한정(Life Sciences·Cyber Verification Programs를 추가 경로로 명시), OpenAI의 `gpt-rosalind-research`는 신뢰 접근 전용, Gemini 3.8 Flash Cyber는 Google의 Fairwind Program으로만. 이 검사 뒤의 모델 레지스트리는 모델·플랫폼별로 조직이 쓸 자격이 있는 모델, 데이터 보존 조건, 폐기 일자를 기록해, 라우팅·폴백이 테넌트가 못 쓰는 모델을 결코 고르지 못하게 해야 한다.

---

## 에이전트·도구 인가

에이전트가 사용자를 대신해 도구를 호출할 때 인가는 세 당사자를 포함한다: 사용자, OAuth 클라이언트로서의 에이전트, 각 도구 서버. 2026년은 표준 방향과 구체적 실패를 둘 다 낳았다.

**실패: 인가 서버 혼동(authorization-server mix-up).** 공식 MCP SDK가 MCP 서버로 하여금 클라이언트 자격증명을 어느 인가 서버가 받을지 정하게 해, 악성·손상 서버가 자기 것을 지명해 사용자 상호작용 없이 저장된 리프레시 토큰·클라이언트 비밀을 받을 수 있었다(TypeScript의 CVE-2026-104850, Python의 GHSA-qx49-fqc8-xw99, 둘 다 CVSS 7.5; TypeScript 1.31.0·2.2.0, Python 1.30.0·2.2.0 수정). 업그레이드만으로는 부족하다: machine-to-machine 제공자는 예상 발급자(TypeScript `expectedIssuer`, Python `issuer=`)로 구성해야 하고, 업그레이드 전 저장된 자격증명은 발급자 태깅·삭제 전까지 노출된 채다. 멀티서버 에이전트 클라이언트는 천생 혼동된 대리자다. 규칙: **모든 자격증명을 발급자에 바인딩하고, 리소스 서버가 비밀이 갈 곳을 정하게 하지 말 것.**

**구성 요소:**

| 필요 | 메커니즘 | 상태 |
|------|-----------|--------|
| 한 서버에서만 쓸 수 있는 토큰 | 대상(audience) 바인딩 (RFC 8707 resource indicators) | MCP 인가 스펙의 일부 |
| 훔친 토큰이 단독으로 무용 | DPoP 발신자 제약 토큰 (RFC 9449) | MCP TypeScript 클라이언트 2.1.0 탑재(2026-09-23); 스펙 프로파일(SEP-1932)은 아직 공개 초안 |
| 도구별 최소 권한 | 도구별 step-up 스코프 챌린지 (HTTP 403 `insufficient_scope`) | MCP TypeScript 서버 2.1.0 탑재 |
| 엔터프라이즈 IdP가 에이전트가 쓸 서버를 통제 | MCP Enterprise-Managed Authorization 뒤의 ID-JAG grant | MCP 탑재; IETF 초안 -04, 아직 RFC 아님 |
| 헤드리스 에이전트의 자기 신원 | 새 프로토콜이 아니라 워크로드 신원 + OAuth 패밀리 | IETF WIMSE가 draft-ietf-wimse-aims-00 채택(2026-09-15); MCP 워크로드 신원 연합(SEP-1933)은 공개 초안 |

**승인도 인가다.** 호출마다 인간 승인은 확장되지 않으니 플랫폼은 정책으로 옮겨간다: Claude Managed Agents의 자동 권한 정책(2026-09-10)은 서버가 각 에이전트·MCP 도구 호출을 평가해 실행·거부·승인 대기 중 하나를 한다. 인간이 승인하는 곳에선 승인을 바로 그 호출에 바인딩하라: 승인 세탁(approval laundering) 연구(arXiv 2609.38983)는 사람이 승인한 행동이 코딩 에이전트 하네스가 실행하는 행동과 늘 같지는 않음을 보인다.

**사용자 위임 모델 접근.** Sign in with ChatGPT(OpenAI DevDay 발표, 2026-09-29; 선정 파트너 제한 트라이얼)는 OAuth 2.0 with PKCE·OpenID Connect를 쓰고, 적격 Responses API 요청을 선택적으로 사용자 자신의 ChatGPT 플랜에서 돌릴 수 있다. 편리한 신원이지만 로그인과 AI 청구를 한 모델 벤더에 집중시키니, 여느 IdP 종속 결정처럼 저울질하라.

프로토콜 수준 상세(Enterprise-Managed Authorization 포함)는 [도구 사용과 MCP](../07-agentic-systems/03-tool-use-and-mcp.md).

---

## 테넌트 격리

### 데이터 격리 패턴

```python
class TenantIsolatedVectorStore:
    def __init__(self, vector_db):
        self.db = vector_db
    
    async def search(
        self,
        tenant_id: str,
        query_embedding: list[float],
        top_k: int = 10
    ) -> list[dict]:
        # CRITICAL: Always filter by tenant_id at database level
        results = await self.db.search(
            query_vector=query_embedding,
            top_k=top_k,
            filter={"tenant_id": {"$eq": tenant_id}}  # Mandatory filter
        )
        
        return results
    
    async def insert(
        self,
        tenant_id: str,
        documents: list[dict]
    ):
        # CRITICAL: Always include tenant_id in metadata
        for doc in documents:
            doc["metadata"]["tenant_id"] = tenant_id
        
        await self.db.insert(documents)
```

### 프롬프트 격리

```python
class TenantAwarePromptBuilder:
    def build_prompt(
        self,
        tenant_id: str,
        user_query: str,
        context: list[dict]
    ) -> str:
        # Verify all context belongs to tenant
        for doc in context:
            if doc.get("tenant_id") != tenant_id:
                raise SecurityError("Cross-tenant context detected")
        
        # Build isolated prompt
        return f"""
[Tenant: {tenant_id}]
Context from tenant documents:
{self.format_context(context)}

User query: {user_query}
"""
```

### 캐시 격리

```python
class TenantIsolatedCache:
    def __init__(self, cache_backend):
        self.cache = cache_backend
    
    def _scoped_key(self, tenant_id: str, key: str) -> str:
        return f"tenant:{tenant_id}:{key}"
    
    async def get(self, tenant_id: str, key: str) -> any:
        return await self.cache.get(self._scoped_key(tenant_id, key))
    
    async def set(self, tenant_id: str, key: str, value: any, ttl: int = 3600):
        await self.cache.set(
            self._scoped_key(tenant_id, key),
            value,
            ttl=ttl
        )
```

캐시 격리는 추론 엔진까지 닿는다. 공유 접두사 캐시는 타이밍 사이드 채널이다: 테넌트 A가 같은 접두사를 이미 캐시해 테넌트 B의 요청이 더 빨리 돌아오면 B는 A의 프롬프트에 대해 무언가를 알게 된다. vLLM은 요청별 `cache_salt`로 테넌트를 격리하는데, 2026-09 한 코드 경로의 퇴행(Harmony `/v1/responses` 엔드포인트의 도구 연속 턴이 솔트를 떨굼)이 0.30.0까지 오라클을 다시 열었다. 모든 요청에 테넌트별 솔트를 넘기고, 엔드포인트마다 이를 테스트하며, 많은 테넌트가 한 제공자 계정을 공유할 땐 테넌트별 콘텐츠를 공유 캐시 가능 접두사 뒤에 둬라.

---

## API 키 관리

### 키 수명주기

```python
class APIKeyManager:
    KEY_PREFIX = "llm_"
    
    async def create_key(
        self,
        user_id: str,
        tenant_id: str,
        name: str,
        scopes: list[str],
        expires_in_days: int = 365
    ) -> APIKey:
        # Generate secure key
        raw_key = self.KEY_PREFIX + secrets.token_urlsafe(32)
        key_hash = self.hash_key(raw_key)
        
        # Store metadata (not the raw key)
        key_record = APIKeyRecord(
            id=generate_id(),
            hash=key_hash,
            user_id=user_id,
            tenant_id=tenant_id,
            name=name,
            scopes=scopes,
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=expires_in_days)
        )
        
        await self.store.save(key_record)
        
        # Return raw key only once (not stored)
        return APIKey(
            id=key_record.id,
            key=raw_key,  # Only returned on creation
            name=name,
            scopes=scopes,
            expires_at=key_record.expires_at
        )
    
    async def revoke_key(self, key_id: str, reason: str):
        await self.store.update(key_id, {
            "revoked": True,
            "revoked_at": datetime.now(),
            "revoke_reason": reason
        })
        
        await self.audit_log.log("api_key_revoked", {
            "key_id": key_id,
            "reason": reason
        })
```

### 키 로테이션

```python
class KeyRotator:
    async def rotate_key(self, old_key_id: str) -> APIKey:
        old_key = await self.key_store.get(old_key_id)
        
        # Create new key with same permissions
        new_key = await self.key_manager.create_key(
            user_id=old_key.user_id,
            tenant_id=old_key.tenant_id,
            name=f"{old_key.name} (rotated)",
            scopes=old_key.scopes
        )
        
        # Grace period: old key still works temporarily
        await self.key_store.update(old_key_id, {
            "deprecated": True,
            "deprecated_at": datetime.now(),
            "grace_period_ends": datetime.now() + timedelta(days=7)
        })
        
        await self.notify_user(old_key.user_id, new_key)
        
        return new_key
```

---

## 감사와 컴플라이언스

### 감사 로깅

```python
class AuditLogger:
    async def log_request(
        self,
        request: LLMRequest,
        response: LLMResponse,
        auth: AuthResult
    ):
        audit_entry = {
            "timestamp": datetime.now().isoformat(),
            "request_id": request.id,
            "user_id": auth.user_id,
            "tenant_id": auth.tenant_id,
            "action": "llm_generate",
            "model": request.model,
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "cost": response.cost,
            "latency_ms": response.latency_ms,
            # Hash content for privacy
            "input_hash": self.hash_content(request.prompt),
            "output_hash": self.hash_content(response.content)
        }
        
        await self.audit_store.append(audit_entry)
```

### 컴플라이언스 리포트

```python
class ComplianceReporter:
    async def generate_report(
        self,
        tenant_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> ComplianceReport:
        logs = await self.audit_store.query(
            tenant_id=tenant_id,
            start=start_date,
            end=end_date
        )
        
        return ComplianceReport(
            tenant_id=tenant_id,
            period=(start_date, end_date),
            total_requests=len(logs),
            unique_users=len(set(l["user_id"] for l in logs)),
            models_used=list(set(l["model"] for l in logs)),
            total_cost=sum(l["cost"] for l in logs),
            data_access_events=self.extract_data_access(logs),
            security_events=await self.get_security_events(tenant_id, start_date, end_date)
        )
```

---

## 면접 질문

### Q: RAG 시스템에서 멀티테넌트 격리를 어떻게 구현하나?

**좋은 답변:**

"멀티테넌트 격리는 심층 방어가 필요하다:

**벡터 DB 수준:**
- 모든 벡터 메타데이터에 tenant_id
- 모든 쿼리를 DB 수준에서 tenant_id로 필터
- 검색 후 필터 금지(데이터가 이미 메모리로 유출됨)

**캐시 수준:**
- 모든 캐시 키에 tenant_id 접두사
- 시맨틱 캐시를 테넌트 범위로
- 동일 쿼리라도 교차 테넌트 캐시 적중 없음

**프롬프트 수준:**
- 포함 전 컨텍스트 문서가 요청 테넌트 소속인지 검증
- 여러 테넌트의 컨텍스트 혼입 금지

**출력 수준:**
- 응답에 교차 테넌트 정보가 없는지 확인
- 추가 안전장치로 출력 필터링

**감사:**
- 테넌트 맥락과 함께 모든 접근 로깅
- 교차 테넌트 접근 시도 모니터링

핵심 원칙: tenant_id는 선택 파라미터가 아니라 모든 데이터 접근 지점의 필수 필터다."

### Q: LLM 서비스의 API 키를 어떻게 관리하나?

**좋은 답변:**

"안전한 API 키 관리:

**생성:**
- 암호학적 난수 키 생성
- 해시만 저장, 원시 키는 한 번만 반환
- 사용자·테넌트·스코프·만료 연결

**검증:**
- 들어온 키 해시를 저장 해시와 비교
- 만료·폐기 상태 확인
- 스코프가 요청 행동과 일치하는지 검증

**로테이션:**
- 유예 기간 있는 키 로테이션 지원
- 전환 중 옛 키 작동(7일)
- 임박한 만료를 사용자에 통지

**보안:**
- 실패한 인증 시도 레이트 리밋
- 손상 의심 시 즉시 폐기
- 모든 키 작업 감사

**스코프:**
- 세분화: 모델 접근·작업 유형·일일 한도
- 기본 최소 권한

**발급하는 키만이 아니라 보유하는 키:**
- 모델 제공자로의 우리 호출엔 정적 키보다 워크로드 신원(mTLS·연합 토큰)을 선호하고, 남는 키엔 소유자·만료·지출 상한을 둠
- LLM API 키는 이제 공급망 웜의 표준 전리품이니 개발자 머신·에이전트 세션·CI 로그에서 배제

핵심 원칙: 원시 키를 저장하지 말고, 로테이션을 지원하며, 최소 권한을 구현하라."

### Q: 한 에이전트가 사용자를 대신해 5개 MCP 서버의 도구를 호출한다. 어떻게 인가하나?

**좋은 답변:**

"혼동된 대리자를 전제로 설계한다 — 에이전트가 다섯 서버의 자격증명을 쥐고 있고 그중 어느 하나가 악성·손상일 수 있으니.

**자격증명을 발급자·대상에 바인딩.** 각 토큰은 자기 서버에 대상 바인딩(RFC 8707)되고, 저장된 자격증명마다 발급한 인가 서버를 태깅해 다른 어디로도 보내지 않는다. 바로 그 구멍이 2026-09 MCP TypeScript SDK의 CVE-2026-104850(Python SDK도 같은 결함)이었다: 악성 서버가 자기 인가 서버를 지명해 리프레시 토큰·클라이언트 비밀을 모을 수 있었다. SDK 업그레이드만으론 부족하고, machine-to-machine 클라이언트는 명시적 예상 발급자가 필요하며, 업그레이드 전 자격증명은 재태깅·삭제해야 한다.

**훔친 토큰을 덜 쓸모 있게.** 짧은 수명, 그리고 클라이언트·서버가 지원하는 곳의 DPoP 발신자 제약 토큰.

**도구별 최소 권한.** 좁은 기본 스코프 + 도구별 step-up 챌린지로, 읽기 전용 세션이 조용히 쓰기 도구를 호출하지 못하게.

**엔터프라이즈 통제.** 회사가 IdP를 운영하는 곳에선 Enterprise-Managed Authorization이 관리자에게 에이전트가 닿을 서버를 중앙에서 정하게 한다. 헤드리스 에이전트엔 사용자의 장수명 토큰 대신 자신의 워크로드 신원을 준다.

**승인과 감사.** 고위험 호출은 정책 엔진·인간을 거치되 승인을 실행되는 바로 그 호출에 바인딩하고, 모든 호출을 사용자·에이전트·서버·스코프와 함께 로깅한다.

표준이 아직 정착 중이니(MCP용 DPoP·워크로드 신원 연합은 초안, ID-JAG는 아직 RFC 아님) 인가 계층을 내 인터페이스 뒤에 두고 조각 교체를 예상한다."

---

## 참고 문헌

- OAuth 2.0: https://oauth.net/2/
- OWASP API Security: https://owasp.org/API-Security/
- RFC 8707, Resource Indicators for OAuth 2.0: https://www.rfc-editor.org/rfc/rfc8707
- RFC 9449, OAuth 2.0 Demonstrating Proof of Possession (DPoP): https://www.rfc-editor.org/rfc/rfc9449
- MCP TypeScript SDK advisory GHSA-6qxp-vccf-f47h (CVE-2026-104850): https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-6qxp-vccf-f47h
- IETF WIMSE, AI Identity Management System (draft-ietf-wimse-aims): https://datatracker.ietf.org/doc/draft-ietf-wimse-aims/
- OpenAI API changelog (workload identity, key expiry): https://developers.openai.com/api/docs/changelog

---

*이전: [LLM 보안](01-llm-security.md)*
