---
title: LLM 애플리케이션 CI/CD
sidebar_position: 2
description: 모델 평가·프롬프트 테스트·품질 게이트 등 AI 특유 관심사에 맞춘 CI/CD — 변경 유형, 파이프라인, 테스트 스테이지, 품질 게이트, 배포·롤백, 공급망·에이전트 설정 게이트.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/11-infrastructure-and-mlops/02-cicd.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 기업명·제품명·모델명·버전·라이선스명은 원문 표기를 유지합니다. 코드·머메이드 다이어그램은 원문 그대로 둡니다.
:::

# LLM 애플리케이션 CI/CD

LLM 애플리케이션을 배포하려면 전통 CI/CD 관행을 모델 평가·프롬프트 테스트·품질 게이트 같은 AI 특유 관심사에 맞춰 바꿔야 한다.

---

## LLM CI/CD의 도전

### LLM 배포가 다른 점

| 전통 CI/CD | LLM CI/CD |
|-------------------|-----------|
| 이진 테스트(통과/실패) | 확률적 평가 |
| 빠른 테스트 | 느리고 비싼 평가 |
| 결정적 출력 | 비결정적 출력 |
| 코드 변경만 | 프롬프트 + 모델 + 데이터 변경 |
| 버전 관리가 명확 | 프롬프트 버전 관리가 복잡 |

### 변경 유형

| 변경 유형 | 위험 | 필요 테스트 |
|-------------|------|------------------|
| 프롬프트 텍스트 | 중 | 회귀 + 품질 평가 |
| 시스템 프롬프트 | 상 | 전체 평가 스위트 |
| 모델 버전(강제 마이그레이션 포함) | 상 | 종합 벤치마크 + API 계약 테스트 |
| RAG 인덱스 | 중 | 검색 + 품질 평가 |
| 파라미터(effort·thinking·max tokens) | 중 | 품질·비용 샘플링 |
| 같은 모델 ID 하의 제공자 측 변경 | 중상 | 프로덕션 모델 ID 대상 예약 평가 |
| SDK·프레임워크 메이저 버전 | 중 | 실제 전송되는 요청의 계약 테스트 |
| 저장소의 에이전트·에디터·VCS 설정 | 상 | 보안 리뷰; 실행 코드로 취급 |

마지막 네 행은 2026년이 필수로 만든 것들이다. 에이전트·VCS 설정은 아래 Stage 5에서 다루고, 나머지 셋:

- **샘플링 파라미터가 사라지는 중.** Claude API는 이미 Opus 4.7 이상에서 비기본 샘플링 값에 400을 반환하고, Anthropic Python SDK 1.0(2026-08-20)은 Messages 메서드에서 `temperature`·`top_p`·`top_k`를 제거했다(전달 시 `TypeError`). Google은 7/21 Gemini API에서 deprecate했고, GPT-6 Astra는 커스텀 temperature·`top_p`·logprobs를 거부한다. "재현 CI 위해 temperature 0"은 더 이상 안 통한다. reasoning effort가 주 노브이고 그 기본값이 버전마다 바뀐다(Claude Opus 5.5는 `medium`, Opus 5는 `high` 기본). 정확 문자열이 아니라 구조화 필드·시맨틱 체크로 단언하라.
- **고정 ID 하에서 모델이 바뀔 수 있다.** OpenAI가 2026-09-25 `gpt-6-sol`·`gpt-6-luna`의 이미지 인코딩 버그를 ID 변경 없이 고쳐, 그 날짜 전 돌린 이미지 평가는 그 엔드포인트가 지금 하는 일을 더는 기술하지 못한다. 코딩 에이전트 CLI도 포인트 릴리스에서 기본 모델을 바꾼다(Codex CLI가 rust-v0.159.1에서 GPT-6.1 Sol로, Claude Code가 2.1.280에서 Opus 5.5로). 평가 스위트를 내 커밋뿐 아니라 프로덕션이 쓰는 정확한 ID 대상으로 일정에 따라 돌려라.
- **SDK 메이저가 테스트 하네스를 조용히 깬다.** Anthropic SDK 1.0과 OpenAI SDK 3.0(8/12)이 `httpx2`로 옮겼다. Anthropic 마이그레이션 가이드에 따르면 OpenTelemetry 계측·`respx`·`vcrpy`가 `httpx2.alias_httpx()` 호출 없이는 호출을 놓칠 수 있어, 녹화 응답 테스트가 라이브 API를 때리거나 통과하면서도 아무것도 트레이스 안 할 수 있다.

---

## 파이프라인 아키텍처

### 전체 파이프라인

```
┌─────────────────────────────────────────────────────────────────┐
│                       LLM CI/CD PIPELINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │   Commit     │                                               │
│  │   Trigger    │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │   Validate   │ ─── Prompt syntax, config validation         │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Unit Tests   │ ─── Fast, deterministic tests                │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │  Golden Set  │ ─── Known input/output pairs                 │
│  │    Tests     │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │   LLM Eval   │ ─── Quality scoring, regression detection    │
│  │   (Sampled)  │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Quality Gate │ ─── Pass/fail based on thresholds            │
│  └──────┬───────┘                                               │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    ▼         ▼                                                  │
│ ┌──────┐ ┌───────┐                                             │
│ │Canary│ │Blocked│                                             │
│ │Deploy│ │       │                                             │
│ └──┬───┘ └───────┘                                             │
│    │                                                            │
│    ▼                                                            │
│ ┌──────────────┐                                               │
│ │  Production  │                                               │
│ │  Monitoring  │                                               │
│ └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 테스트 스테이지

### Stage 1: 정적 검증

```python
class PromptValidator:
    def validate(self, prompt_config: dict) -> ValidationResult:
        errors = []
        
        # Required fields
        if not prompt_config.get("system_prompt"):
            errors.append("Missing system_prompt")
        
        # Template syntax
        try:
            Template(prompt_config["user_template"]).substitute({})
        except KeyError:
            pass  # Expected for templates with variables
        except ValueError as e:
            errors.append(f"Invalid template syntax: {e}")
        
        # Token limits
        system_tokens = count_tokens(prompt_config.get("system_prompt", ""))
        if system_tokens > 4000:
            errors.append(f"System prompt too long: {system_tokens} tokens")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors
        )
```

### Stage 2: 단위 테스트

```python
class PromptUnitTests:
    def test_template_rendering(self):
        prompt = PromptTemplate(SYSTEM_PROMPT, USER_TEMPLATE)
        
        rendered = prompt.render(
            query="test query",
            context="test context"
        )
        
        assert "test query" in rendered
        assert "test context" in rendered
        assert len(rendered) < 10000  # Token limit
    
    def test_output_parsing(self):
        parser = OutputParser()
        
        valid_output = '{"answer": "test", "confidence": 0.9}'
        result = parser.parse(valid_output)
        assert result["answer"] == "test"
        
        invalid_output = "not json"
        with pytest.raises(ParseError):
            parser.parse(invalid_output)
```

### Stage 3: 골든 세트 테스트

```python
class GoldenSetRunner:
    def __init__(self, golden_set: list[dict]):
        self.golden_set = golden_set
    
    async def run(self, llm_client) -> TestResults:
        results = []
        
        for example in self.golden_set:
            response = await llm_client.generate(example["input"])
            
            # Exact match for deterministic outputs
            if example.get("exact_match"):
                passed = response == example["expected"]
            # Contains check for flexible outputs
            elif example.get("must_contain"):
                passed = all(
                    phrase in response 
                    for phrase in example["must_contain"]
                )
            # LLM judge for quality
            else:
                passed = await self.judge_quality(
                    response, example["expected"]
                )
            
            results.append(TestResult(
                input=example["input"],
                expected=example["expected"],
                actual=response,
                passed=passed
            ))
        
        return TestResults(
            total=len(results),
            passed=sum(1 for r in results if r.passed),
            failed=[r for r in results if not r.passed]
        )
```

### Stage 4: LLM 평가

```python
class LLMEvaluationStage:
    def __init__(self, eval_set: list[dict], sample_rate: float = 0.1):
        self.eval_set = eval_set
        self.sample_rate = sample_rate
        self.evaluator = LLMEvaluator()
    
    async def run(self, llm_client) -> EvalResults:
        # Sample for cost efficiency
        sample = random.sample(
            self.eval_set,
            int(len(self.eval_set) * self.sample_rate)
        )
        
        scores = []
        for example in sample:
            response = await llm_client.generate(example["input"])
            
            score = await self.evaluator.evaluate(
                query=example["input"],
                response=response,
                reference=example.get("reference"),
                criteria=["relevance", "accuracy", "helpfulness"]
            )
            scores.append(score)
        
        return EvalResults(
            sample_size=len(sample),
            avg_relevance=np.mean([s["relevance"] for s in scores]),
            avg_accuracy=np.mean([s["accuracy"] for s in scores]),
            avg_helpfulness=np.mean([s["helpfulness"] for s in scores])
        )
```

평가 하네스를 이식 가능하게 유지하라. 호스팅 평가 제품도 다른 모든 것처럼 churn한다: OpenAI Evals가 2026-10-31 읽기 전용이 되고 11-30 종료되며, OpenAI는 사용자를 Promptfoo(MIT 라이선스; 3월에 OpenAI 인수 합의)로 안내한다. 데이터셋·그레이더·임계값을 도구 중립 포맷으로 저장소에 두어 벤더 교체에도 게이트가 살아남게 하라. 전체 게이트의 실습 예는 [평가 게이트 CI/CD 사례 연구](https://github.com/ombharatiya/ai-system-design-guide/blob/main/16-case-studies/18-eval-gated-cicd.md)(영문) 참고.

### Stage 5: 공급망·에이전트 설정 게이트

AI 저장소는 이제 일반 코드 리뷰가 지나치는 실행 설정을 품고, 공격자가 이를 의도적으로 노린다:

| 표면 | 2026 사건 | 게이트 |
|---------|---------------|------|
| 에이전트·에디터 자동 실행 설정(`.claude/settings.json` 훅, `.vscode/tasks.json` 폴더 열기 작업) | Mini Shai-Hulud가 4/30까지 이 훅 사용; ChainDrop npm 웜(8/4)이 444개 패키지·2,212개 버전에 재사용(StepSecurity)하고 OpenAI·Anthropic·Cursor·Codex·Gemini 토큰 수확 | 이 경로에 CODEOWNERS 리뷰; 새 훅·자동 실행 작업 등장 시 CI 실패 |
| 저장소 `.git/config`(`core.fsmonitor`·`core.hooksPath`·필터) | GitSpawn(Manifold, 9/2): 7개 CLI 코딩 에이전트가 백그라운드 git 호출에서 샌드박스 밖 공격자 명령 실행 | 에이전트 개시 git을 `-c core.fsmonitor=false`로; 클론 밖에서 온 `.git` 디렉터리 불신 |
| SHA 핀 에이전트 플러그인 | Plugin4Shell(AIR Security, 9/17): 핀한 SHA처럼 이름 붙인 브랜치가 승인 코드를 바꿈; Claude Code 2.1.179·Codex 0.146.0에서 수정 | 체크아웃 후 트리가 핀과 일치하는지 검증 |
| 조용한 업스트림 수정의 의존성 | Hacktron(9/13 공개): 7월 말 Claude Opus 5가 CVE 없이 업스트림 수정된 libheif 오버플로를 약 3시간 만에 작동 익스플로잇으로, SSO 오설정과 엮어 OpenAI 커뮤니티 포럼 RCE | CVE 발표가 아니라 업스트림 수정에 패치; 베이스 이미지를 일정에 따라 재빌드 |

익스플로잇 창은 이제 시간 단위로 잰다. Google이 2026-09-08 Chrome을 4주에서 2주 릴리스로 옮기며 AI 주도 패치 볼륨을 이유로 들었다. CI 함의: 의존성·베이스 이미지 신선도가 SLA 있는 게이트가 되고, 에이전트 설정이 코드이므로 코드와 같은 리뷰를 받는다.

그 경로를 누가 승인할지 의도적으로 정하라. GitHub가 2026-09-01 Copilot 코드 리뷰 승인을 필수 리뷰로 치는 공개 프리뷰를 냈다(기본 꺼짐), 어떤 파일 경로를 Copilot이 승인할지 관리자가 선택. AI 리뷰는 유용한 추가 게이트지만, 에이전트 설정·CI 워크플로·의존성 매니페스트는 AI 승인에서 제외하고 사람 CODEOWNER를 필수로 유지하라. 주입·침해된 에이전트가 바꾸고 싶어 할 바로 그 파일들이기 때문. 런타임 측면은 [에이전트 보안 장](../07-agentic-systems/09-agentic-security-and-sandboxing.md)에서 다룬다.

---

## 품질 게이트

### 게이트 구성

```python
class QualityGate:
    def __init__(self, thresholds: dict):
        self.thresholds = thresholds
    
    def evaluate(self, results: dict) -> GateResult:
        failures = []
        
        # Golden set pass rate
        if results["golden_pass_rate"] < self.thresholds["golden_pass_rate"]:
            failures.append({
                "metric": "golden_pass_rate",
                "actual": results["golden_pass_rate"],
                "threshold": self.thresholds["golden_pass_rate"]
            })
        
        # Quality scores
        for metric in ["relevance", "accuracy", "helpfulness"]:
            if results.get(f"avg_{metric}", 0) < self.thresholds.get(metric, 0):
                failures.append({
                    "metric": metric,
                    "actual": results.get(f"avg_{metric}"),
                    "threshold": self.thresholds[metric]
                })
        
        # Regression detection
        if results.get("regression_detected"):
            failures.append({
                "metric": "regression",
                "details": results["regression_details"]
            })
        
        return GateResult(
            passed=len(failures) == 0,
            failures=failures
        )

# Example thresholds
QUALITY_THRESHOLDS = {
    "golden_pass_rate": 0.95,  # 95% of golden tests must pass
    "relevance": 4.0,          # Average score >= 4.0/5.0
    "accuracy": 4.0,
    "helpfulness": 3.5
}
```

---

## 배포 전략

### 카나리 배포

```python
class CanaryDeployer:
    def __init__(
        self,
        initial_percentage: int = 5,
        increment: int = 10,
        bake_time_minutes: int = 30
    ):
        self.initial_percentage = initial_percentage
        self.increment = increment
        self.bake_time = bake_time_minutes
    
    async def deploy(self, new_version: str):
        # Start canary
        await self.router.set_canary(new_version, self.initial_percentage)
        
        percentage = self.initial_percentage
        while percentage < 100:
            # Wait for bake time
            await asyncio.sleep(self.bake_time * 60)
            
            # Check canary health
            metrics = await self.get_canary_metrics(new_version)
            
            if not self.is_healthy(metrics):
                await self.rollback(new_version)
                raise CanaryFailedError(metrics)
            
            # Increment traffic
            percentage = min(100, percentage + self.increment)
            await self.router.set_canary(new_version, percentage)
        
        # Full rollout
        await self.router.promote_canary(new_version)
```

### 섀도 배포

```python
class ShadowDeployer:
    async def shadow_test(
        self,
        new_version: str,
        duration_hours: int = 24
    ):
        # Run new version in shadow mode
        await self.enable_shadow(new_version)
        
        # Collect comparison data
        start = datetime.now()
        while datetime.now() - start < timedelta(hours=duration_hours):
            await asyncio.sleep(60)
            
            comparison = await self.compare_outputs()
            if comparison["divergence_rate"] > 0.1:
                await self.alert("High divergence in shadow test", comparison)
        
        # Analyze results
        return await self.generate_comparison_report(new_version)
```

### 모델 마이그레이션은 배포다

모델 변경이 이제 내 캘린더가 아니라 벤더의 캘린더에 온다. Claude Sonnet 4.5가 Claude API·Foundry에서 2026-11-30 폐기(Anthropic은 Sonnet 5.5 안내), OpenAI는 12/11 `gpt-5-2025-08-07`·`o3-2025-04-16` 스냅샷 폐기, Bedrock Claude Sonnet 4는 10/14 EOL. Anthropic은 60일 통지. OpenAI는 GA 6개월·특수 변형 3개월·프리뷰 최소 2주라면서도 `gpt-5.4-cyber`를 10/1에 20일 만에 폐기했으니, 명시 최소치보다 짧게 계획하라.

최신 모델은 API 계약도 바꿔, 품질 측정 전에 요청 형태에서 마이그레이션이 실패할 수 있다:

- Claude Fable 5.1·Opus 5.5·Sonnet 5.5는 `tool_choice`의 `any`·`tool`에 400 반환; strict tools나 구조화 출력과 함께 `auto` 사용.
- Opus 5.5 thinking은 끌 수 없고, Sonnet 5.5서 `thinking: {"type": "disabled"}`는 400 반환(최저 설정은 `between_tools`).
- thinking 블록은 모델·대화에 묶임: 다른 모델이 못 읽는 블록은 조용히 삭제되고, thinking 블록 앞 히스토리 편집은 2026-08-31 이후 생성 계정에서 400 반환. 옛 모델로 녹화한 트랜스크립트 리플레이는 새 모델의 유효한 테스트가 아니다.
- GPT-6 Astra는 temperature·`top_p`·logprobs를 떨구고 도구엔 Responses API 필요.

모델 범프를 코드 배포와 똑같이 다뤄라: 새 ID로 전체 평가 스위트 실행, 클라이언트가 실제 보내는 요청을 계약 테스트, 프로덕션 트래픽에 섀도, 그다음 여느 릴리스와 같은 롤백 트리거로 카나리. 나가는 모델을 폐기일까지 롤백 대상으로 유지하고, 그 날짜를 배포 캘린더에 넣어라.

---

## 롤백 절차

### 자동 롤백

```python
class AutoRollback:
    def __init__(self, rollback_thresholds: dict):
        self.thresholds = rollback_thresholds
    
    async def monitor_and_rollback(self, version: str):
        while True:
            metrics = await self.get_live_metrics(version)
            
            # Check error rate
            if metrics["error_rate"] > self.thresholds["error_rate"]:
                await self.trigger_rollback(version, "error_rate_exceeded")
                return
            
            # Check latency
            if metrics["p99_latency"] > self.thresholds["p99_latency"]:
                await self.trigger_rollback(version, "latency_exceeded")
                return
            
            # Check quality (sampled)
            if metrics.get("quality_score", 5) < self.thresholds["quality_score"]:
                await self.trigger_rollback(version, "quality_degradation")
                return
            
            await asyncio.sleep(60)
    
    async def trigger_rollback(self, version: str, reason: str):
        previous = await self.get_previous_version()
        await self.router.rollback_to(previous)
        await self.alert(f"Auto-rollback from {version}: {reason}")
```

---

## 면접 질문

### Q: 프롬프트 변경을 프로덕션 전에 어떻게 테스트하나?

**좋은 답변:**

"다단계 테스트 파이프라인을 씁니다:

**Stage 1: 정적 검증.** 문법 체크, 토큰 제한, 템플릿 오류. 빠르고 쌈.

**Stage 2: 단위 테스트.** 템플릿 렌더링, 출력 파싱, 결정적 동작. 여전히 빠름.

**Stage 3: 골든 세트 테스트.** 반드시 통과해야 할 알려진 입출력 쌍. 명백한 회귀 포착.

**Stage 4: LLM 평가.** LLM-as-judge로 샘플 평가. 품질 차원(관련성·정확성) 측정. 더 비싸지만 미묘한 문제 포착.

**품질 게이트:** 모든 스테이지가 임계값 통과해야. 골든 세트 95% 초과 통과율, 품질 점수 4.0/5.0 초과.

**배포:** 5% 트래픽 카나리, 30분 bake, 지표 모니터, 점진 증가.

핵심 통찰은 LLM 출력이 비결정적이라 테스트가 통계적이어야 한다는 것. 100% 정확성은 보장 못 하지만 품질이 수용 범위 안에 머물게 보장할 수 있습니다."

### Q: 어떤 트리거가 자동 롤백을 일으켜야 하나?

**좋은 답변:**

"여러 롤백 트리거를 구성합니다:

**오류율:** 오류가 5분 연속 5% 초과면 롤백. 명백한 실패 포착.

**지연:** P99 지연이 SLA(예: 10초)를 10분 초과면 롤백. 성능 회귀 포착.

**품질 점수:** 샘플 품질 점수가 3.5/5.0 아래로 떨어지면 롤백. 미묘한 품질 저하 포착.

**사용자 신호:** 부정 피드백율이 베이스라인 2배로 튀면 조사하고 가능하면 롤백.

**구현:**
- Prometheus 알림이 롤백 스크립트 트리거
- 팀 자동 알림
- 마지막 양호 버전으로 롤백
- 조사 전까지 추가 배포 차단

핵심은 빠른 탐지·조치. 나쁜 프롬프트가 프로덕션에 10분은 수용 가능. 10시간은 아님."

### Q: 제공자가 제품이 돌리는 모델을 60일 뒤 폐기한다. 어떻게 안전하게 마이그레이션하나?

**좋은 답변:**

"하드 데드라인 있는 계획 배포로 다루고, 네 단계로 합니다.

**1. 계약 먼저.** 품질 측정 전에 요청이 여전히 작동하는지 확인. 최신 Claude(Fable 5.1·Opus 5.5·Sonnet 5.5)가 강제 `tool_choice` 거부, Sonnet 5.5가 `thinking: disabled` 거부, GPT-6 Astra가 temperature 거부. 클라이언트가 보내는 정확한 요청을 계약 테스트하고 형태 수정(강제 도구 호출 대신 strict tools·구조화 출력, temperature 대신 effort).

**2. 새 ID로 평가.** 전체 골든 세트 + 샘플 LLM-judge 평가, 비용·지연 기록. 기본 effort·thinking 동작이 버전마다 달라 품질만큼 요금도 바뀌기 때문. 옛 모델이 생성한 트랜스크립트를 멀티턴 픽스처로 재사용 안 함. 최신 Claude가 다른 모델의 thinking 블록을 떨구거나 거부하기 때문.

**3. 섀도, 그다음 카나리.** 발산 보려 실제 트래픽 섀도, 그다음 평소 롤백 트리거로 카나리. 옛 모델이 폐기일까지 롤백 대상.

**4. 프로세스 수정.** 폐기일을 모델·플랫폼 키의 레지스트리에 넣음. 같은 모델이 클라우드마다 몇 달 차이로 폐기되기 때문. 예약 평가를 프로덕션 모델 ID 대상으로 돌려 조용한 제공자 측 변경도 포착.

파이프라인이 있으면 60일로 충분. 평가 스위트를 마이그레이션 중에 지어야 하면 부족합니다."

---

## 참고 문헌

- ML Ops: https://ml-ops.org/
- LangSmith: https://docs.smith.langchain.com/
- Promptfoo: https://www.promptfoo.dev/
- OpenAI deprecations: https://developers.openai.com/api/docs/deprecations
- Anthropic model deprecations: https://platform.claude.com/docs/en/about-claude/model-deprecations
- StepSecurity, ChainDrop npm worm: https://www.stepsecurity.io/blog/chaindrop-npm-worm
- AIR Security, Plugin4Shell: https://www.air.security/blog-posts/plugin4shell

---

*이전: [LLM 인프라](01-llm-infrastructure.md) · 다음: [AI 게이트웨이와 모델 라우팅](03-ai-gateways-and-model-routing.md)*
