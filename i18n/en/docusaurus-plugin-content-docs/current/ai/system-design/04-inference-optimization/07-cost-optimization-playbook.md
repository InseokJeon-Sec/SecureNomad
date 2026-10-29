---
title: "Cost Optimization Playbook"
sidebar_position: 7
description: "Korean-site mirror of the original English chapter from Om Bharatiya's AI System Design Guide (MIT)."
---

:::info Source / License
Original (English) from [ai-system-design-guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/04-inference-optimization/07-cost-optimization-playbook.md) by Om Bharatiya — MIT License, © 2026 Om Bharatiya. Reproduced with attribution; see [About · Source · License](../index.md). Snapshot: upstream `ed955b2` (2026-10-09). Links to not-yet-mirrored chapters point to the original repository.
:::

AI costs are no longer "magic." They are measurable, predictable, and highly optimizable. Per-token API prices keep falling at the mid and low tiers (in September 2026 GPT-6 Sol at $2/$10 and GPT-6 Luna at $0.10/$0.50 per 1M tokens at least halved the list prices of GPT-5.6 Sol and Luna, and Claude Opus 5.5 cut the Opus tier to $4/$20), while GPU rental prices rose through 2026. So the cost lever is mostly *routing*, *caching*, and *service-tier selection*, not just picking a cheaper provider. This chapter covers the strategies to reduce inference costs by 10x without sacrificing quality.

## Table of Contents

- [The Unit Economics of AI](#the-unit-economics-of-ai)
- [Model Cascading (Efficiency Tiers)](#model-cascading-efficiency-tiers)
- [Small Language Models (SLMs)](#small-language-models-slms-for-production)
- [Service Tiers and Price Multipliers](#service-tiers-and-price-multipliers)
- [Spot Instances and GPU Pricing](#spot-instance-strategies)
- [The "Token Tax" Optimization](#the-token-tax-optimization)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The Unit Economics of AI

We measure success by **Tokens per Dollar ($)** at a given quality bar and latency SLO.

| Component | Cost Driver | Optimization |
|-----------|-------------|--------------|
| **Compute** | GPU Time ($/hr) | Better utilization (Batching). |
| **VRAM** | KV Cache Size | GQA, Quantization. |
| **Network** | Payload Size | Compression, Local serving. |
| **API** | Per-token pricing | Caching, Model selection, Service tier. |

---

## Model Cascading (Efficiency Tiers)

The most effective cost-saving strategy is to use the **cheapest model capable of the task.**

**The cascade pattern** (list prices per 1M input/output tokens as of October 1, 2026):
1. **Classifier**: A tiny model (0.5B) determines query complexity ($0.00).
2. **Tier 1 (Small/cheap)**: 90% of queries (greetings, simple Q&A, extraction) go to GPT-6 Luna ($0.10/$0.50), DeepSeek V4.1-Flash, or a self-hosted small model ($).
3. **Tier 2 (Mid)**: 9% of queries (complex reasoning) go to Claude Sonnet 5.5 ($2/$10), GPT-6 Sol ($2/$10), or Gemini 3.8 Flash ($0.75/$3.75 introductory through December 31, 2026; $1.50/$7.50 from January 1, 2027) ($$$).
4. **Tier 3 (Frontier reasoning)**: 1% of queries (expert-level) go to Claude Opus 5.5 ($4/$20), GPT-6 Astra ($10/$50), or Claude Fable 5.1 ($10/$50) at high reasoning effort ($$$$$).

**Net result**: 80% cost reduction vs. sending all traffic to Tier 2.

**Caching breaks tier monotonicity.** Opus 5.5 reads cached input at 0.05x ($0.20 per 1M), the same absolute price as Sonnet 5.5's 0.1x cache read. For an agent loop that rereads a long cached context, Opus 5.5 can cost less than uncached Sonnet traffic. Price cascades on *effective* cost per task, including cache hit rate, not on list input prices.

---

## Small Language Models (SLMs) for Production

Small open models (IBM Granite 4.2 3B and 8B, Gemma 4 12B, Qwen3.8-27B) and the cheapest API tiers (GPT-6 Luna, Claude Haiku 4.5) now match or beat the original GPT-4 from 2023 on most benchmarks.
- **Use Case**: Entity extraction, sentiment analysis, simple RAG, routing.
- **Cost**: roughly 10x (Claude Haiku 4.5) to 100x (GPT-6 Luna at $0.10 / $0.50) cheaper per token than the $10 / $50 ceiling tier (Claude Fable 5.1, GPT-6 Astra); self-hosted small models only go lower at high utilization.
- **Latency**: &lt; 100ms response times for short outputs.

### The Price Floor: GPT-6 Luna and DeepSeek V4.1-Flash

DeepSeek V4 Flash (released April 24, 2026) reset the floor at launch at $0.14 / $0.28 per 1M tokens. Pricing has moved since. DeepSeek introduced peak and off-peak billing on August 16, 2026, then released **V4.1-Flash** (`deepseek-flash`, September 10) at $0.30 input / $1.20 output at peak and half that off-peak ($0.15 / $0.60), with cache hits at $0.006 peak and $0.003 off-peak. Peak hours are 01:00-04:00 and 06:00-10:00 UTC on weekdays only, excluding Chinese public holidays, so weekends are entirely off-peak. **V4-Pro** (V4-Pro-0813) stays available at $1.32 / $3.96 peak and $0.66 / $1.98 off-peak; a planned September 14 reroute of V4-Pro traffic to V4.1-Flash was reversed on September 11.

The cheapest closed tier now undercuts it: **GPT-6 Luna** at $0.10 / $0.50 (cached input $0.01) beats V4.1-Flash's uncached input and output prices even off-peak ($0.15 / $0.60). DeepSeek's remaining edges are its cache-hit price ($0.006 peak, $0.003 off-peak, versus Luna's $0.01) and MIT weights you can self-host. For high-volume batch work the practical floor is "GPT-6 Luna, or DeepSeek V4.1-Flash scheduled off-peak for cache-heavy work (RAG over a shared knowledge base, codebase agents)," chosen by eval quality on your task. Verify on the [DeepSeek pricing page](https://api-docs.deepseek.com/quick_start/pricing) and [OpenAI pricing page](https://developers.openai.com/api/docs/pricing) before committing.

---

## Service Tiers and Price Multipliers

The same model now spans roughly a 12x price range by tier alone, so a cost model needs a tier policy per workload class (interactive, agent inner loop, offline), not one per-token price.

| Lever | Multiplier on Standard | Where (as of October 1, 2026) |
|-------|------------------------|-------------------------------|
| **Batch / Flex** | 0.5x | OpenAI Batch and Flex, Gemini Batch and Flex, Bedrock Flex, Anthropic Batch; OpenRouter's Batch API (September 22, 2026) is generally 50% off on 70+ models, with a median batch finishing in 7 minutes in beta |
| **Off-peak scheduling** | 0.5x | DeepSeek off-peak hours and weekends |
| **Cache reads** | 0.1x typical; 0.05x on Opus 5.5 and GPT-6.1 Sol; 0.025x on Fable 5.1 | All major APIs; writes cost 1.25x on Anthropic and on OpenAI GPT-5.6+ |
| **Priority / Fast** | about 1.75x to 2.5x | OpenAI Fast 2x (2.5x on GPT-5.5); Gemini Priority about 1.8x; Bedrock Priority 1.75x; Anthropic fast mode on Opus 5.5 at $8/$40 (research preview, Claude API only) |
| **Ultrafast** | 6x | OpenAI, GA on GPT-6 Astra since September 29, 2026 (also offered for Astra on Bedrock) |
| **Long context** | Whole request repriced | OpenAI bills the entire request at long-context rates above 272K input tokens (GPT-6 Sol $4/$15); xAI doubles all tokens at 200K+; Anthropic is flat to 1M on Claude 4.6 and later |
| **Data residency** | about 1.1x | Anthropic `inference_geo: "us"`, OpenAI residency endpoints, regional Claude on Bedrock and Google Cloud, Mistral EU |

Two traps: long-context surcharges apply to the *whole* request once you cross the threshold, so trimming a 280K-token GPT-6 Sol prompt to 270K halves its input rate and cuts its output rate by a third; and promotional prices (Gemini 3.8 Flash's introductory rate, GPT-5.6 Sol's promo guaranteed only through November 21, 2026) should be budgeted at list price.

---

## Spot Instance Strategies

For non-real-time workloads (batch processing, data extraction), use **GPU Spot Instances** (AWS Spot, Google Cloud Spot VMs, Azure Spot).

- **Risk**: The GPU can be reclaimed with short notice: two minutes on AWS, about 30 seconds on Google Cloud and Azure.
- **Mitigation**: Make work restartable. Checkpoint batch progress, keep requests idempotent, and requeue in-flight requests on the reclamation signal. Engines with tiered KV offload to shared storage can preserve prefix caches across a reclaim, but do not count on live migration of in-flight decode state.

### GPU Pricing in 2026: Up, and Longer Terms Are Cheaper

GPU rental prices rose through 2026 as memory-bound inference demand grew. Silicon Data's B200 rental index was $5.86 per GPU-hour on October 1, 2026 (it stood 27.6% up year to date entering September), and its H100 index was $2.77. Term structure inverted the old advice: on September 7 the B200 index was $5.73 for 3-month terms and $5.39 for 12-month terms, so locking in longer was cheaper. On-demand list prices on October 1: Lambda H100 SXM $3.99 and B200 $6.69; RunPod community/secure H100 $2.69/$3.49, B200 $5.98/$6.79, B300 $6.94/$7.89. Read neocloud contract terms carefully; SemiAnalysis's ClusterMAX 3.0 flagged prepayments reaching 100% on some 1-year commitments.

---

## The "Token Tax" Optimization

- **Prompt caching**: Keep prefixes byte-stable (no timestamps or per-user IDs near the top, stable tool order) so repeated context bills at cache-read rates: 0.1x on most models, 0.05x on Opus 5.5 and GPT-6.1 Sol, 0.025x on Fable 5.1.
- **Input dominates agent cost**: Anthropic's Claude Code telemetry (September 24, 2026, vendor-reported) shows the input-to-output token ratio rising from 189:1 to 324:1. At that ratio, cache hit rate and the cached-input price drive cost, not the output price. Cursor reported 7% lower user token costs after trimming about two-thirds of its system prompt and loading tools dynamically (vendor-reported).
- **Reasoning effort**: Set it explicitly per route. Defaults differ by model and change between versions: Claude Opus 5.5 defaults to `medium` (Opus 5 was `high`), Sonnet 5.5 and Fable 5.1 to `high`, GPT-6.1 Sol to `medium`. Some newer models cannot turn thinking off at all, so effort is the remaining dial.
- **Output Truncation**: Strictly limit `max_tokens`.
- **Concise-output instructions**: Asking for terse answers (and a fixed output schema) cuts output tokens; measure the saving on your own prompts rather than assuming a fixed percentage, since reasoning tokens often dominate and are not affected.

---

## Interview Questions

### Q: How do you justify the cost of an AI system to a CFO?

**Strong answer:**
I focus on the **ROI of Efficiency.** First, I implement "Model Cascading" to ensure that 90% of our traffic is handled by models priced well under $1 per million tokens. Second, I implement "Semantic Caching" and prompt caching to prevent paying for the same answer, or the same context, twice. Third, I assign a service tier per workload (batch at half price for offline jobs, priority only where the SLO needs it). Fourth, I set up "Inference Quotas" and "Chargeback Models" so each business unit is accountable for their usage. By treating AI as a "Commodity Resource" with tiered pricing, we can transition from "unbounded experimentation" to a "predictable OpEx" model.

### Q: When is a self-hosted individual GPU cluster cheaper than an API?

**Strong answer:**
The "Crossover Point" happens at **constant high throughput**, and it depends heavily on which API tier you are replacing. Worked with October 2026 inputs: two H100s at the Silicon Data index ($2.77 per GPU-hour) cost about $4,000 a month, enough for a 70B-class open model. At a 3:1 input-to-output blend, Claude Sonnet 5.5 or GPT-6 Sol ($2/$10) costs about $4 per million tokens, so the tie is around 1B tokens a month; against Opus 5.5 ($4/$20) it is about 500M. Against GPT-6 Luna ($0.10/$0.50, about $0.20 blended) it is around 20B tokens a month, roughly 7,700 tokens per second around the clock, which is at or beyond what two GPUs serving a 70B model sustain, so in practice you will not beat the cheapest API tier on price alone. And a self-hosted 70B is not equivalent in quality to a frontier API, so compare against the API tier that meets your quality bar, not the most expensive one. Spiky or business-hours traffic pushes the answer toward APIs because they let you "pay for the silence," and API cache reads at 0.1x or less push break-even further out for agentic workloads. Self-hosting wins when utilization is steady and high, when data cannot leave your boundary, or when you need a fine-tuned open model, and rising GPU rental prices in 2026 raise the bar further.

---

## References
- Google Cloud. "Cost Optimization for Generative AI" (2024)
- Anyscale. "LLM Inference: API vs. Self-Hosted Costs" (2024)
- OpenAI. [API pricing](https://developers.openai.com/api/docs/pricing); Anthropic. [Pricing](https://platform.claude.com/docs/en/about-claude/pricing); DeepSeek. [Models and pricing](https://api-docs.deepseek.com/quick_start/pricing)
- Silicon Data. [B200 rental index](https://www.silicondata.com/products/silicon-index/b200) and [H100 index](https://www.silicondata.com/products/silicon-index/h100)

---

*Next: [Diffusion Language Models](08-diffusion-llms.md)*

