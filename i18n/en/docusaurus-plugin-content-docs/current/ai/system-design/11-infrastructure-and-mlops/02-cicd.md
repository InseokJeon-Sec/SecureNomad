---
title: "CI/CD for LLM Applications"
sidebar_position: 2
description: "Korean-site mirror of the original English chapter from Om Bharatiya's AI System Design Guide (MIT)."
---

:::info Source / License
Original (English) from [ai-system-design-guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/11-infrastructure-and-mlops/02-cicd.md) by Om Bharatiya — MIT License, © 2026 Om Bharatiya. Reproduced with attribution; see [About · Source · License](../index.md). Snapshot: upstream `ed955b2` (2026-10-09). Links to not-yet-mirrored chapters point to the original repository.
:::

Deploying LLM applications requires adapting traditional CI/CD practices for AI-specific concerns like model evaluation, prompt testing, and quality gates.

## Table of Contents

- [LLM CI/CD Challenges](#llm-cicd-challenges)
- [Pipeline Architecture](#pipeline-architecture)
- [Testing Stages](#testing-stages)
- [Quality Gates](#quality-gates)
- [Deployment Strategies](#deployment-strategies)
- [Rollback Procedures](#rollback-procedures)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## LLM CI/CD Challenges

### What Makes LLM Deployments Different

| Traditional CI/CD | LLM CI/CD |
|-------------------|-----------|
| Binary tests (pass/fail) | Probabilistic evaluation |
| Fast tests | Slow, expensive evaluations |
| Deterministic outputs | Non-deterministic outputs |
| Code changes only | Prompt + model + data changes |
| Version control obvious | Prompt versioning complex |

### Change Types

| Change Type | Risk | Testing Required |
|-------------|------|------------------|
| Prompt text | Medium | Regression + quality eval |
| System prompt | High | Full evaluation suite |
| Model version (including forced migrations) | High | Comprehensive benchmark + API contract tests |
| RAG index | Medium | Retrieval + quality eval |
| Parameters (effort, thinking, max tokens) | Medium | Quality and cost sampling |
| Provider-side change under the same model ID | Medium-High | Scheduled evals against production model IDs |
| SDK or framework major version | Medium | Contract tests on the request actually sent |
| Agent, editor or VCS config in the repo | High | Security review; treat as executable code |

The last four rows are the ones 2026 made non-optional. Agent and VCS config gets its own gate in [Stage 5](#stage-5-supply-chain-and-agent-config-gates); the other three:

- **Sampling parameters are going away.** The Claude API already returns 400 for non-default sampling values on Opus 4.7 and later, and Anthropic's Python SDK 1.0 (August 20, 2026) removed `temperature`, `top_p` and `top_k` from the Messages methods (passing them raises `TypeError`). Google deprecated them in the Gemini API on July 21, and GPT-6 Astra rejects custom temperature, `top_p` and logprobs. "Set temperature to 0 for reproducible CI" no longer works; reasoning effort is the main knob, and its defaults change between versions (Claude Opus 5.5 defaults to `medium`, Opus 5 to `high`). Assert on structured fields and semantic checks, not exact strings.
- **The model can change under a fixed ID.** OpenAI fixed an image-encoding bug in `gpt-6-sol` and `gpt-6-luna` on September 25, 2026 without changing the IDs, so image evals run before that date no longer describe what those endpoints do. Coding-agent CLIs also swap default models in point releases (Codex CLI moved to GPT-6.1 Sol in rust-v0.159.1; Claude Code moved to Opus 5.5 in 2.1.280). Run the eval suite on a schedule against the exact IDs production uses, not only on your own commits.
- **SDK majors break test harnesses silently.** The Anthropic SDK 1.0 and OpenAI SDK 3.0 (August 12) moved to `httpx2`. Per Anthropic's migration guide, OpenTelemetry instrumentation, `respx` and `vcrpy` can miss calls unless you call `httpx2.alias_httpx()`, so recorded-response tests may hit the live API or trace nothing while still passing.

---

## Pipeline Architecture

### Full Pipeline

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

## Testing Stages

### Stage 1: Static Validation

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

### Stage 2: Unit Tests

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

### Stage 3: Golden Set Tests

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

### Stage 4: LLM Evaluation

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

Keep the eval harness portable. Hosted eval products churn like everything else: OpenAI Evals becomes read-only on October 31, 2026 and shuts down on November 30, with OpenAI pointing users to Promptfoo (MIT-licensed; it agreed in March to be acquired by OpenAI). Store datasets, graders and thresholds in your repo in a tool-neutral format so the gate survives a vendor change. For a worked example of the full gate, see the [eval-gated CI/CD case study](https://github.com/ombharatiya/ai-system-design-guide/blob/main/16-case-studies/18-eval-gated-cicd.md).

### Stage 5: Supply-Chain and Agent-Config Gates

AI repositories now carry executable configuration that ordinary code review skims past, and attackers target it deliberately:

| Surface | 2026 incident | Gate |
|---------|---------------|------|
| Agent and editor auto-run config (`.claude/settings.json` hooks, `.vscode/tasks.json` folder-open tasks) | Mini Shai-Hulud used these hooks by April 30; the ChainDrop npm worm (August 4) reused them across 444 packages and 2,212 versions (StepSecurity) and harvested OpenAI, Anthropic, Cursor, Codex and Gemini tokens | CODEOWNERS review on these paths; fail CI when a new hook or auto-run task appears |
| Repository `.git/config` (`core.fsmonitor`, `core.hooksPath`, filters) | GitSpawn (Manifold, September 2): seven CLI coding agents ran attacker commands outside their sandboxes on background git calls | Run agent-initiated git with `-c core.fsmonitor=false`; never trust a `.git` directory that arrived outside a clone |
| SHA-pinned agent plugins | Plugin4Shell (AIR Security, September 17): a branch named like the pinned SHA swapped approved code; fixed in Claude Code 2.1.179 and Codex 0.146.0 | Verify the checked-out tree matches the pin after checkout |
| Dependencies with silent upstream fixes | Hacktron (disclosed September 13): in late July, Claude Opus 5 turned a libheif overflow, fixed upstream without a CVE, into a working exploit in about 3 hours; chained with an SSO misconfiguration it gave RCE on OpenAI's community forum | Patch on upstream fixes, not CVE announcements; rebuild base images on a schedule |

The exploit window is now measured in hours. Google moved Chrome from 4-week to 2-week releases on September 8, 2026, citing AI-driven patch volume. The CI implication: dependency and base-image freshness becomes a gate with an SLA, and agent configuration gets the same review as code because it is code.

Decide deliberately who may approve those paths. GitHub let Copilot code-review approvals count toward required reviews in a public preview on September 1, 2026 (off by default), with admins choosing which file paths Copilot may approve. AI review is a useful extra gate, but exclude agent config, CI workflows and dependency manifests from AI approval and keep a human CODEOWNER required there, since those are exactly the files an injected or compromised agent would want to change. The [agentic security chapter](../07-agentic-systems/09-agentic-security-and-sandboxing.md) covers the runtime side.

---

## Quality Gates

### Gate Configuration

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

## Deployment Strategies

### Canary Deployment

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

### Shadow Deployment

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

### Model Migrations Are Deploys

Model changes now arrive on the vendor's calendar, not yours. Claude Sonnet 4.5 retires on November 30, 2026 on the Claude API and Foundry (Anthropic points to Sonnet 5.5), OpenAI retires the `gpt-5-2025-08-07` and `o3-2025-04-16` snapshots on December 11, and Bedrock's Claude Sonnet 4 reaches end of life on October 14. Anthropic gives 60 days' notice. OpenAI states 6 months for GA models, 3 for specialized variants and as little as 2 weeks for previews, and it retired `gpt-5.4-cyber` on October 1 after only 20 days, so plan for less than the stated minimum.

The newest models also change the API contract, so a migration can fail on request shape before quality is even measured:

- Claude Fable 5.1, Opus 5.5 and Sonnet 5.5 return 400 on `tool_choice` of `any` or `tool`; use `auto` with strict tools or structured outputs.
- Opus 5.5 thinking cannot be disabled, and on Sonnet 5.5 `thinking: {"type": "disabled"}` returns 400 (the lowest setting is `between_tools`).
- Thinking blocks are bound to the model and conversation: blocks another model cannot read are dropped silently, and editing history before a thinking block returns 400 on accounts created on or after August 31, 2026. Replaying a transcript recorded on the old model is not a valid test of the new one.
- GPT-6 Astra drops temperature, `top_p` and logprobs and needs the Responses API for tools.

Treat a model bump exactly like a code deploy: run the full eval suite on the new ID, contract-test the request your client actually sends, shadow it on production traffic, then canary with the same rollback triggers as any release. Keep the outgoing model as the rollback target until its retirement date, and put that date in the deploy calendar.

---

## Rollback Procedures

### Automated Rollback

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

## Interview Questions

### Q: How do you test prompt changes before production?

**Strong answer:**

"I use a multi-stage testing pipeline:

**Stage 1: Static validation.** Syntax check, token limits, template errors. Fast and cheap.

**Stage 2: Unit tests.** Template rendering, output parsing, deterministic behavior. Still fast.

**Stage 3: Golden set tests.** Known input/output pairs that must pass. Catches obvious regressions.

**Stage 4: LLM evaluation.** Sampled evaluation using LLM-as-judge. Measures quality dimensions (relevance, accuracy). More expensive but catches subtle issues.

**Quality gates:** All stages must pass thresholds. Golden set > 95% pass rate, quality scores > 4.0/5.0.

**Deployment:** Canary at 5% traffic, bake for 30 minutes, monitor metrics, gradually increase.

The key insight is that LLM outputs are non-deterministic, so testing must be statistical. I cannot guarantee 100% correctness, but I can ensure quality stays within acceptable bounds."

### Q: What triggers should cause automatic rollback?

**Strong answer:**

"I configure multiple rollback triggers:

**Error rate:** If errors exceed 5% for 5 consecutive minutes, rollback. This catches outright failures.

**Latency:** If P99 latency exceeds SLA (e.g., 10s) for 10 minutes, rollback. This catches performance regressions.

**Quality score:** If sampled quality score drops below 3.5/5.0, rollback. This catches subtle quality degradation.

**User signals:** If negative feedback rate spikes 2x baseline, investigate and potentially rollback.

**Implementation:**
- Prometheus alerts trigger rollback script
- Automatic notification to team
- Rollback to last known good version
- Block further deploys until investigated

The key is fast detection and action. A bad prompt in production for 10 minutes is acceptable. For 10 hours is not."

### Q: Your provider is retiring the model your product runs on in 60 days. How do you migrate safely?

**Strong answer:**

"I treat it as a planned deploy with a hard deadline, in four steps.

**1. Contract first.** Before measuring quality, I check that the request still works. The newest Claude models (Fable 5.1, Opus 5.5, Sonnet 5.5) reject forced `tool_choice`, Sonnet 5.5 rejects `thinking: disabled`, and GPT-6 Astra rejects temperature. I run contract tests on the exact request my client sends and fix the shape (strict tools or structured outputs instead of forced tool calls, effort instead of temperature).

**2. Eval on the new ID.** Full golden set plus sampled LLM-judge evals, with cost and latency recorded, because default effort and thinking behavior differ between versions and change the bill as much as the quality. I do not reuse transcripts generated by the old model as multi-turn fixtures, since newer Claude models drop or reject thinking blocks from other models.

**3. Shadow, then canary.** Shadow real traffic for divergence, then canary with the usual rollback triggers. The old model stays the rollback target until the retirement date.

**4. Fix the process.** Retirement dates go into a registry keyed by model and platform, because the same model retires months apart on different clouds, and scheduled evals run against production model IDs so a silent provider-side change gets caught too.

Sixty days is enough if the pipeline exists. It is not enough if the eval suite has to be built during the migration."

---

## References

- ML Ops: https://ml-ops.org/
- LangSmith: https://docs.smith.langchain.com/
- Promptfoo: https://www.promptfoo.dev/
- OpenAI deprecations: https://developers.openai.com/api/docs/deprecations
- Anthropic model deprecations: https://platform.claude.com/docs/en/about-claude/model-deprecations
- StepSecurity, ChainDrop npm worm: https://www.stepsecurity.io/blog/chaindrop-npm-worm
- AIR Security, Plugin4Shell: https://www.air.security/blog-posts/plugin4shell

---

*Previous: [LLM Infrastructure](01-llm-infrastructure.md) · Next: [AI Gateways and Model Routing](03-ai-gateways-and-model-routing.md)*
