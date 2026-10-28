---
title: Pricing and Costs
sidebar_position: 3
description: "Korean-site mirror of the original English chapter from Om Bharatiya's AI System Design Guide (MIT)."
---

:::info Source / License
Original (English) from [ai-system-design-guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/02-model-landscape/03-pricing-and-costs.md) by Om Bharatiya — MIT License, © 2026 Om Bharatiya. Reproduced with attribution; see [About · Source · License](../index.md). Snapshot: upstream `ed955b2` (2026-10-09). Links to not-yet-mirrored chapters point to the original repository.
:::

Understanding the cost structure of LLM systems is essential for production planning. This chapter covers pricing models, cost optimization strategies, and total cost of ownership analysis.

## Table of Contents

- [Pricing Models](#pricing-models)
- [Current API Pricing](#current-api-pricing)
- [Cost Calculation](#cost-calculation)
- [Cost Optimization Strategies](#cost-optimization-strategies)
- [Context Caching Economics](#context-caching-economics)
- [Self-Hosting & GPU Cloud Arbitrage](#self-hosting--gpu-cloud-arbitrage)
- [Total Cost of Ownership](#total-cost-of-ownership)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## Pricing Models

### Token-Based Pricing

Most LLM APIs charge per token:

```
Cost = (input_tokens × input_rate) + (output_tokens × output_rate)
```

**Key observations:**
- Output tokens usually cost 2-8x more than input tokens (5x on Claude Opus 5.5, Claude Sonnet 5.5, GPT-6 Sol and Gemini 3.8 Flash; 3x on Grok 4.7; 6x on GPT-5.6 Sol and Terra at list; about 8x on Gemini 3.5 Flash-Lite; 2x on hosted MiMo-V2.6), and some open-weight hosts charge the same for both (Together AI's Llama 3.3 70B at $1.04 / $1.04), so output-heavy workloads should be priced on the output column first
- Reasoning tokens bill as output, and on the newest Claude models thinking can no longer be fully switched off
- The rate card is only the base: long-context cliffs, cache terms, speed tiers, residency and promotions multiply it

### The Multipliers on Top of the Rate Card (October 2026)

Two requests with the same token counts on the same model can differ in price by more than 10x. These are the dimensions to model explicitly:

| Dimension | How it bills | Current examples |
|-----------|--------------|------------------|
| **Long-context cliff** | The **whole request** moves to a higher rate once the prompt crosses a threshold, not just the excess | OpenAI above 272K input: 2x input and cache, 1.5x output (Batch and Flex too, and Fast on the GPT-6 and GPT-5.6 families). xAI Grok 4.6/4.7 at or above 200K: all tokens doubled. Gemini 3.1 Pro Preview above 200K. Anthropic Claude 4.6 and later: flat to 1M |
| **Cache write / read** | Premium to write a prefix, discount to reread it within the TTL | OpenAI GPT-5.6 and later: write 1.25x, read 0.1x (0.05x on GPT-6.1 Sol), fixed 30-minute TTL. Anthropic: write 1.25x (5 min) or 2x (1 h); read 0.1x, 0.05x on Opus 5.5, 0.025x on Fable 5.1. Gemini: read 0.1x plus hourly storage |
| **Service tier** | Pay less to wait, more to go first or faster | Batch 0.5x at OpenAI, Anthropic and the Gemini API; Flex 0.5x where offered (OpenAI, Gemini API, Bedrock for most models; Anthropic has no Flex tier, and GPT-6 Astra on Bedrock supports neither Flex nor Priority). OpenAI Fast (renamed from Priority on July 30) 2x, 2.5x on GPT-5.5; Ultrafast 6x (GA on GPT-6 Astra, preview on GPT-5.6 Sol). Gemini Priority about 1.8x. Bedrock Priority 1.75x. Anthropic fast mode on Opus (2x); Anthropic no longer sells Priority Tier |
| **Data residency** | Region-pinned processing costs about 10% more | Anthropic `inference_geo: "us"` 1.1x on all token types (Claude 4.6+). OpenAI residency endpoints for models released from March 5, 2026. Bedrock and Google Cloud regional Claude. Bedrock regional GPT-6 Astra ($11/$55). Mistral EU inference |
| **Promotional window** | Temporary rate with an end date, or only a floor date | Gemini 3.6/3.7/3.8 Flash at half price through December 31, 2026. GPT-5.6 Sol $4/$20, guaranteed only "at least through November 21, 2026". Gemini 4 Argon's announced intro price has no end date |
| **Time of day** | Off-peak discount | DeepSeek off-peak is 50% of peak; peak is 01:00-04:00 and 06:00-10:00 UTC on weekdays only, excluding Chinese public holidays |
| **Per-minute** | Session or audio time instead of tokens | `gpt-live-1` $0.05/min plus backend tokens; `gpt-transcribe` $0.0045/min |
| **Billed refusals** | Safety stops that cost money | Anthropic bills pre-output refusals in the `bio`, `frontier_llm` and `reasoning_extraction` categories from September 24, 2026; other categories stay unbilled |
| **Data for discount** | Cheaper if the vendor may use your traffic | Meta `muse-spark-1.3-contributor` at $0.10/$0.20 versus $1.25/$4.25 |
| **Runtime meters** | Session or sandbox time on top of tokens | Claude Managed Agents $0.08 per running session-hour (idle free). OpenAI Agents API container rates: small $0.03, medium $0.12, large $0.48 per 20-minute session, billed by the minute with a 5-minute minimum |

A request's effective price is therefore:

```
effective_cost = residency_mult × tier_mult × (
      uncached_in × in_rate(prompt_size)
    + cache_write × write_rate(prompt_size)
    + cache_read  × read_rate(prompt_size)
    + (visible_output + reasoning_tokens) × out_rate(prompt_size)
)
# rate(prompt_size) jumps for the WHOLE request past the vendor's long-context threshold
```

### Volume and Commitment Pricing

Public list prices carry no automatic volume discount. Discounts come from negotiated commitments, and the figures below are illustrative of enterprise deals, not public terms:

| Tier | Monthly Spend | Typical negotiated discount |
|------|---------------|-----------------------------|
| Standard | $0 - $5K | 0% |
| Growth | $5K - $50K | 10-20% |
| Enterprise | $50K+ | Custom negotiation |

```
Standard: $2.50 / 1M input tokens
Committed (1-year): $2.00 / 1M input tokens (20% savings)
```

**Capacity is now bought separately from price.** Anthropic no longer sells Priority Tier commitments (existing contracts run to term), so guaranteed capacity comes from custom agreements or cloud reservations such as Bedrock Reserved (1- or 3-month terms). Anthropic's self-serve tiers (Start, Build, Scale) carry hard monthly spend caps of $500, $1,000 and $200,000; hitting one returns HTTP 429 with `enforced_spend_limit_reached` and no `retry-after` until 00:00 UTC on the 1st of the next month. A budget cap is now an availability risk, so alert well before it.

---

## Current API Pricing

### October 2026 Pricing

> **Last verified: October 1, 2026.** Prices change frequently. Always re-check: [OpenAI](https://developers.openai.com/api/docs/pricing), [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing), [Google](https://ai.google.dev/gemini-api/docs/pricing), [xAI](https://docs.x.ai/developers/models), [DeepSeek](https://api-docs.deepseek.com/quick_start/pricing), [Mistral](https://mistral.ai/pricing/api). First-party rows were rechecked for this date. Rows marked "carried over" reflect the August 15, 2026 check. Third-party host prices (OpenRouter, Together AI, Fireworks) are each host's own list price and vary by provider.
>
> **What changed between August 15 and October 1, 2026:**
> - **The ceiling price held at $10 / $50, with different long-context rules.** Claude Fable 5.1 (September 1) and GPT-6 Astra (September 3) both list at $10 / $50, but Astra bills the entire request at $20 / $75 once input passes 272K while Fable stays flat to 1M.
> - **The mid tier converged on $2 / $10:** Claude Sonnet 5.5 (September 28), GPT-6 Sol (September 22) and GPT-6.1 Sol (September 29), plus Gemini 4 Argon's announced introductory price.
> - **Opus got cheaper.** Claude Opus 5.5 (September 22) cut Opus to $4 / $20 from $5 / $25, and Anthropic now tells customers to start there.
> - **The floor dropped.** GPT-6 Luna is $0.10 / $0.50, roughly half of GPT-5.6 Luna's $0.20 / $1.20.
> - **Cache reads diverged by model:** 0.1x standard, 0.05x on Opus 5.5 and GPT-6.1 Sol, 0.025x on Fable 5.1 (down from 0.1x on Fable 5).
> - **Promotions with dates attached.** Gemini 3.6, 3.7 and 3.8 Flash cost $0.75 / $3.75 until December 31 and $1.50 / $7.50 from January 1, 2027. GPT-5.6 Sol has been $4 / $20 since August 21, guaranteed only through November 21. Budget long-lived workloads on list prices.
> - **Voice and transcription moved to per-minute billing** (see [Voice and Transcription](#voice-and-transcription-per-minute-billing)).
> - **DeepSeek cut Flash prices** with V4.1-Flash on September 10 (peak $0.30 / $1.20). V4-Pro is unchanged and still served: a planned September 14 reroute of V4-Pro traffic to V4.1-Flash was reversed on September 11.

#### OpenAI (GPT-6 Generation)
| Model | Input / 1M | Output / 1M | Notes |
|-------|------------|-------------|-------|
| **GPT-6 Astra** | $10.00 | $50.00 | Staged release from September 3, 2026 (Daybreak program first), in the API by September 5. Cached $1.00, cache write $12.50. Above 272K input the whole request bills at $20 / $75. Batch and Flex $5 / $25; Fast $20 / $100; Ultrafast $60 / $300 (GA September 29). 1.05M context, 128K output. No `none` effort, temperature, top_p or logprobs; tool calling requires the Responses API. Bedrock GA September 8 ($11 / $55 for In-Region and Geo inference); also GA on Microsoft Foundry. |
| **GPT-6.1 Sol** | $2.00 | $10.00 | September 29, 2026. Cached $0.10 (0.05x), cache write $2.50; above 272K $4 / $15. Default effort `medium`. On Bedrock under OpenAI's own lifecycle terms. |
| **GPT-6 Sol** | $2.00 | $10.00 | September 22, 2026. Cached $0.20, cache write $2.50; above 272K $4 / $15; Batch and Flex $1 / $5. An image-understanding bug was fixed on September 25 under the same model ID: rerun image evals. Bedrock GA September 22. |
| **GPT-6 Luna** | $0.10 | $0.50 | September 22, 2026. Cached $0.01, cache write $0.125; above 272K $0.20 / $0.75; Batch and Flex $0.05 / $0.25. Same September 25 image fix. No GPT-6 Terra has been announced. |
| **GPT-5.6 Sol** | $4.00 promo ($5.00 list) | $20.00 promo ($30.00 list) | Promotional since August 21, 2026, guaranteed only "at least through November 21, 2026"; budget on $5 / $30. Above 272K $8 / $30 at the promo rate. Cached $0.40, cache write $5.00. Ultrafast in preview. Superseded by GPT-6 Sol. |
| **GPT-5.6 Terra** | $2.00 | $12.00 | Above 272K $4 / $18. No GPT-6 successor; GPT-6 Sol now matches its input price and undercuts its output. |
| **GPT-5.6 Luna** | $0.20 | $1.20 | Above 272K $0.40 / $1.80. Superseded by GPT-6 Luna at roughly half the price. |
| **GPT-5.6-Cyber** | $12.50 | $75.00 | August 10, 2026. Cached $1.25. 400K context, no long-context tier. Daybreak Red tier only (identity verification, legal attestations, Responses API only). |
| **GPT-Rosalind** (`gpt-rosalind-research`) | $5.00 | $25.00 | Life-sciences reasoning model, GA September 8, 2026 through a trusted-access program. Cached $0.50. Billing starts October 5, 2026. |
| **GPT-5.5** | $5.00 | $30.00 | April 23, 2026. Cached $0.50; above 272K $10 / $45. Fast is 2.5x on this model. |
| **GPT-5.5 Pro / GPT-5.4 Pro** | $30.00 | $180.00 | No cached-input discount; above 272K about $60 / $270. Pro is also `reasoning.mode: "pro"` on the GPT-5.6 and GPT-6 families at the selected model's standard rates. |
| **GPT-5.4** | $2.50 | $15.00 | Cached $0.25 (0.1x; earlier editions of this table showed $1.25). Above 272K $5 / $22.50. |
| **GPT-5.4-mini** | $0.75 | $4.50 | Cached $0.075. |
| **GPT-5.4-nano** | $0.20 | $1.25 | Cached $0.02. Shuts down April 1, 2027 (to GPT-6 Luna). |
| **GPT-4.1** | $2.00 | $8.00 | Cached $0.50. Legacy. |
| **GPT-4o** | $2.50 | $10.00 | Cached $1.25. Retired from ChatGPT February 13, 2026. The original `gpt-4o-2024-05-13` snapshot shuts down on the OpenAI API October 23, 2026 (substitute: gpt-5.6-sol). On Azure Foundry, gpt-4o 2024-05-13 Standard deployments auto-upgrade to gpt-5.6-sol on December 9, 2026. |
| **GPT-4o-mini** | $0.15 | $0.60 | Cached $0.075. Legacy. |

#### Anthropic (Claude 5.x Generation)
| Model | Input / 1M | Output / 1M | Context | Notes |
|-------|------------|-------------|---------|-------|
| **Claude Opus 5.5** | $4.00 | $20.00 | 1M | September 22, 2026 (`claude-opus-5-5`) on Claude API, Bedrock, Google Cloud, Microsoft Foundry and Claude Platform on AWS. Anthropic's "start here" default. Cache write $5 (5 min) / $8 (1 h); cache read $0.20 (0.05x); Batch $2 / $10; fast mode $8 / $40 (research preview, Claude API only). 128K output (300K on Batch with a beta header). Default effort `medium` (Opus 5 defaulted to `high`); thinking cannot be disabled. ZDR available. Retirement not before September 22, 2027. |
| **Claude Sonnet 5.5** | $2.00 | $10.00 | 1M | September 28, 2026 (`claude-sonnet-5-5`), same five platforms, price unchanged from Sonnet 5. Cache write $2.50 / $4.00; cache read $0.20; Batch $1 / $5. 128K output. API default effort `high` (medium in Claude Code and the Claude apps). `thinking: {type: "disabled"}` returns 400; the lowest setting is `between_tools`. ZDR available. Retirement not before September 28, 2027. |
| **Claude Fable 5.1** | $10.00 | $50.00 | 1M | September 1, 2026 (`claude-fable-5-1`), GA on all five platforms. Cache read $0.25 (0.025x, down from $1.00 on Fable 5); cache write $12.50 / $20.00; Batch $5 / $25. 128K output, default effort `high`. 30-day data retention; ZDR only where Anthropic expressly authorizes it (customers eligible for Enterprise Frontier Safeguards, until EFS is ready). Safeguard refusals can fall back server-side (`fallbacks: "default"`, beta) to Opus 4.8 or Opus 5. Retirement not before September 1, 2027. |
| **Claude Mythos 5.1** | $10.00 | $50.00 | 1M | Same model as Fable 5.1 with looser safeguards. Project Glasswing only per the docs; Life Sciences and Cyber Verification Program access announced. |
| **Claude Haiku 4.5** | $1.00 | $5.00 | 200K | Still the only Haiku. Haiku 5.5 is announced for "the coming weeks" but was not released as of October 1. Claude API retirement floor is "not sooner than October 15, 2026", but no deprecation notice has been issued, so under Anthropic's 60-day notice policy it should not retire there before about December. Foundry retires it November 15. |
| **Claude Opus 5** | $5.00 | $25.00 | 1M | July 24, 2026. Legacy, still available. Fast mode $10 / $50. |
| **Claude Sonnet 5** | $2.00 | $10.00 | 1M | June 30, 2026. Legacy, still available. Its introductory price was made permanent on August 10, 2026. |
| **Claude Fable 5** | $10.00 | $50.00 | 1M | June 9, 2026. Legacy, still available. Cache read $1.00 (0.1x), four times the Fable 5.1 rate. |
| **Claude Opus 4.8** | $5.00 | $25.00 | 1M | May 28, 2026. Legacy. Fast mode $10 / $50. |
| **Claude Opus 4.7 / 4.6** | $5.00 | $25.00 | 1M | Legacy. Fast mode is no longer offered (4.7 errors; 4.6 runs at standard speed and rates). |
| **Claude Sonnet 4.6** | $3.00 | $15.00 | 1M | Legacy; Sonnet 5.5 is newer and cheaper. |
| **Claude Sonnet 4.5** | $3.00 | $15.00 | 200K | Deprecated September 30, 2026; retires November 30, 2026 on the Claude API and Foundry (`claude-sonnet-4-5-20250929` to `claude-sonnet-5-5`). |
| **Claude Opus 4.5** | $5.00 | $25.00 | 200K | Retirement "not sooner than November 24, 2026" on the Claude API, but with no notice issued as of October 1 it should not retire there before about December. Foundry retires it November 24. |

> [!NOTE]
> **Anthropic billing rules worth memorizing (October 2026):**
> - **Flat long context.** Claude 4.6 and later bill the full 1M window at standard rates, and fast-mode premiums stay flat across the window.
> - **Cache reads differ by model:** 0.1x on most models, 0.05x on Opus 5.5, 0.025x on Fable 5.1. Batch is 50% and stacks with caching.
> - **Fast mode** runs on Opus 5.5 ($8 / $40, research preview on the Claude API only) and on Opus 5 and Opus 4.8 ($10 / $50). It stacks with caching multipliers but is not available on the Batch API or Claude Platform on AWS.
> - **Residency:** `inference_geo: "us"` costs 1.1x on input, output, cache writes and cache reads for Claude 4.6 and later; older models return 400 if the parameter is set.
> - **Refusals:** from September 24, 2026, pre-output refusals with `stop_details.category` of `bio`, `frontier_llm` or `reasoning_extraction` are billed; other categories are not. Break refusal spend out by category on cost dashboards.
> - **Breaking changes that touch cost code:** Fable 5.1, Opus 5.5 and Sonnet 5.5 return 400 on `tool_choice` of `any` or `tool`, and thinking blocks are bound to the producing model and conversation. Bedrock and Google Cloud set their own retirement schedules for Claude. Anthropic says its dates apply to the Claude API, Claude Platform on AWS and Foundry, but Microsoft's Foundry retirement schedule currently lists earlier Foundry dates for claude-haiku-4-5 (November 15) and claude-opus-4-5 (November 24) than Anthropic's notice policy implies; plan for the earlier date on Foundry and confirm with both vendors.

#### Google (Gemini 3.x and 4)
| Model | Input / 1M | Output / 1M | Context | Notes |
|-------|------------|-------------|---------|-------|
| **Gemini 3.8 Flash** | $0.75 intro ($1.50 from Jan 1, 2027) | $3.75 intro ($7.50 from Jan 1, 2027) | 1M (65K out) | GA September 2, 2026. Output price includes thinking tokens. Batch and Flex $0.375 / $1.875 intro ($0.75 / $3.75 from January 1); Priority $1.35 / $6.75 intro ($2.70 / $13.50 from January 1); cache read $0.075 intro ($0.15 from January 1) plus storage $0.50 per 1M tokens per hour intro ($1.00 from January 1). Thinking levels low, medium, high. Coverage notes it spends more reasoning tokens per task, which offsets part of the low rate. |
| **Gemini 3.7 Flash / 3.6 Flash** | $0.75 intro | $3.75 intro | 1M | Same introductory price and January 1, 2027 doubling. Superseded by 3.8 Flash. |
| **Gemini 4 Argon** | $2.00 intro ($4.00 after) | $10.00 intro ($20.00 after) | 1M output (per Google) | **Announced September 30, 2026, not generally available.** Rolling out first to cyber defenders in the Fairwind Program; paid API customers and Google AI Ultra come next with no date. No model ID in the Gemini API as of October 1. Cached input 95% off. The introductory period has no published end date. |
| **Gemini 3.1 Pro Preview** | $2.00 | $12.00 | 1M | Above 200K: $4.00 / $18.00. The only Pro-tier model in the Gemini API; there is no Gemini 3.5 Pro. |
| **Gemini 3.5 Flash** | $1.50 | $9.00 | 1M | |
| **Gemini 3.5 Flash-Lite** | $0.30 | $2.50 | 1M | Google's recommended target for new projects that would have used 2.5 Flash-Lite. |
| **Gemini 3.1 Flash-Lite** | $0.25 | $1.50 | 1M | Shutdown May 7, 2027 (to 3.5 Flash-Lite). |
| **Gemini 3 Flash Preview** | $0.50 | $3.00 | 1M | Earlier editions listed a "Gemini 3.1 Flash" at $0.10 / $3.00; no model with that name and price exists on Google's pricing page. |
| **Gemini 2.5 Pro** | $1.25 | $10.00 | 1M | Above 200K: $2.50 / $15.00. Restricted to existing users (see below). |
| **Gemini 2.5 Flash-Lite** | $0.10 | $0.40 | 1M | Restricted to existing users. |

Google Search grounding: 5,000 free requests per month shared across Gemini 3.x models, then $14 per 1,000.

> [!WARNING]
> **Gemini 2.5 lifecycle:** the June 17, 2026 shutdown date that earlier editions cited was real at the time but was later moved and then withdrawn. On September 18, 2026 Google limited Gemini 2.5 models in the Gemini API to projects that have used them before, stating they "are not deprecated" and will be served until further notice; new projects are pointed to Gemini 3.5 Flash-Lite or 3.8 Flash. On Google Cloud (Vertex AI, which Google's docs now present as Gemini Enterprise Agent Platform), `gemini-2.5-pro`, `gemini-2.5-flash` and `gemini-2.5-flash-lite` retire on **October 20, 2026**. Same model, two lifecycles.

#### xAI (Grok)
| Model | Input / 1M | Output / 1M | Context | Notes |
|-------|------------|-------------|---------|-------|
| **Grok 4.7** | $2.00 | $6.00 | 500K | September 21, 2026. Cached $0.50. At or above a 200K prompt the rate becomes $4 / $12 (cached $1) **for every token in the request**. A fast variant (2x speed, 2x price) is offered only in Cursor and Grok Build, not on the public API. New, larger base model than 4.6, but Artificial Analysis scores it only 2 points higher (46 vs 44). |
| **Grok 4.6** | $2.00 | $6.00 | 500K | August 12, 2026. Superseded by 4.7 at the same price and long-prompt rule. |
| **grok-4.3** | $1.25 | $2.50 | - | Redirect target for the text slugs xAI retired on May 15, 2026 (`grok-4-0709`, `grok-4-fast`, `grok-4-1-fast`, `grok-3`). Old slugs still resolve but bill at grok-4.3 rates and behavior. Azure Foundry still lists `grok-4` and `grok-4-1-fast` as GA. |

#### Open-Weight, Challenger, and Value-Tier Models via API
| Model | Input / 1M | Output / 1M | Context | Provider and License Notes |
|-------|------------|-------------|---------|----------------------------|
| **DeepSeek V4.1-Flash** (`deepseek-flash`) | $0.30 peak / $0.15 off-peak | $1.20 peak / $0.60 off-peak | 1M (384K out) | DeepSeek API from September 10, 2026. Cache-hit input $0.006 / $0.003. MIT weights; 552B backbone (763B checkpoint), 8B active on prefill and 16B on decode. Legacy `deepseek-v4-flash` names route here at these rates. Together AI and Fireworks list the same $0.30 / $1.20. |
| **DeepSeek V4-Pro** (`deepseek-v4-pro`, build 0813) | $1.32 peak / $0.66 off-peak | $3.96 peak / $1.98 off-peak | 1M | Unchanged since the August 16 repricing. Cache-hit input $0.044 / $0.022. DeepSeek announced on September 10 that all V4-Pro traffic would route to V4.1-Flash from September 14, then reversed that on September 11. V4.1-Pro has not launched. |
| **Xiaomi MiMo-V2.6-Pro** | $0.435 | $0.87 | 1M | September 21, 2026, MIT, 1.02T total / 42B active. OpenRouter price. Top open-weight model on Artificial Analysis Index v4.3.2 (46). |
| **Xiaomi MiMo-V2.6-Flash** | $0.14 | $0.28 | 1M | 309B / 15B active, MIT. OpenRouter price; the same numbers DeepSeek V4 Flash charged before August. |
| **Z.ai GLM-5.3** | $1.40 | $4.40 | 1M | Cached $0.26. Weights released August 28, 2026 under MIT plus a Z.ai security-review clause for Model-as-a-Service operators above US$10B revenue over 12 months. Also GA on Mistral La Plateforme (September 28); GLM 5.2 retires there October 31. |
| **Z.ai GLM-5.3-Flash** | $0.15 | $0.50 | 1M | August 26, 2026, plain MIT, 320B / 18B active. Cached $0.03. |
| **Moonshot Kimi K3** | $3.00 | $15.00 | 1M | Cached $0.30. Custom license: a separate agreement is required for MaaS operators above US$20M revenue over 12 months. Index v4.3.2 score 44 (the widely quoted 57.1 is from an older, non-comparable index version). |
| **Qwen3.8-Max / -0902** | $2.00 | $6.00 | 1M | Alibaba Model Studio international price for both `qwen3.8-max` and the September 2 `-0902` snapshot, which is API-only. The open 2.4T / 95B-active checkpoint is still the August 12 build and has a MaaS and assistant-product gate above US$50M revenue over 12 months: self-hosters fall behind the API model within weeks. |
| **Qwen3.8-Flash** (hosted Flash-Next) | $0.15 | $0.47 | 1M | Qwen Cloud. Open weights (Qwen3.8-Flash-Next, a Qwen4 architecture preview) use Qwen Community License 1.0, which requires a separate license for any MaaS or coding/office-assistant business regardless of revenue. |
| **Tencent Hy4 preview** | $0.834 | $2.501 | 1M | August 28, 2026, Apache 2.0, 770B / 49B active. Tencent TokenHub list (cache hit $0.042); third-party OpenRouter hosts match. |
| **Meta Muse Spark 1.3** (closed) | $1.25 | $4.25 | 1M | September 2, 2026, Meta Model API and Muse Code. Cached $0.15. `muse-spark-1.3-contributor` costs $0.10 / $0.20 because Meta may use the traffic: check policy before enabling. More verbose than 1.2, so cost per task rose at flat per-token prices. |
| **StepFun Step 5 Preview** (API only) | $1.00 | $2.70 | 1M | Cache hit $0.05. No official weights as of October 1. Index v4.3.2 score 44, but verbose: about 160M output tokens on Artificial Analysis's suite against an 81M median. |
| **Mistral Medium 3.5** | $1.50 | $7.50 | 256K | Weights under a modified MIT license that withdraws all rights from organizations above US$20M monthly revenue. EU regional inference +10%. Medium 3.1 retired August 31, 2026. |
| **Mistral Large 3** | $0.50 | $1.50 | 256K | Mistral API, AWS Bedrock. |
| **Microsoft MAI-Thinking-1** | not published | not published | 256K | August 12, 2026, Foundry public preview. About 1T total / 35B active. |
| **MAI-Code-1.1-Flash** | $0.20 | $1.20 | check latest | Microsoft, August 11, 2026. Carried over. |
| **Inception Mercury 2.5** (diffusion) | $0.20 list ($0.04 launch promo) | $0.75 list ($0.15 launch promo) | - | 1,107 tokens/s (vendor-reported). A speed option, not a frontier-quality one. |
| **Llama 3.3 70B** | $1.04 | $1.04 | 128K | Together AI list. Groq shut down `llama-3.3-70b-versatile` for free and developer tiers on August 16, 2026. |
| **Llama 4 Scout / Maverick** | check latest | check latest | 10M / 1M | Groq retired Scout for free and developer tiers on July 17, 2026, and fast-inference hosts now center on gpt-oss, Qwen, GLM and DeepSeek. Scout's effective context degrades fast past 32K. |
| **Gemma 4 / Qwen3.8-27B** | self-host | self-host | 256K / - | Apache 2.0. |

OpenRouter added a Batch API on September 22, 2026: generally 50% off on 70+ models, median batch completion 7 minutes in beta. That brings the batch discount to providers that do not offer one directly.

#### Voice and Transcription (Per-Minute Billing)

Voice moved off pure token billing in 2026. A voice agent's cost is now **minutes × session rate + backend model tokens**, so call duration and idle time matter as much as tokens. Close idle sessions: `gpt-live-1` bills silence and backend wait time.

| Model | Price | Notes |
|-------|-------|-------|
| **`gpt-live-1`** | $0.05 per session minute, billed per second, plus backend model and tool tokens | GA September 10, 2026. Full duplex; delegates reasoning and tools to a Responses model or your own backend. Creating a WebRTC session bills 15 seconds up front, credited once the session runs. |
| **`gpt-realtime-2.1`** | Audio $32 in / $0.40 cached / $64 out per 1M; text $4 / $0.40 / $24 | About $0.019 per minute of caller audio and $0.077 per minute of agent audio before context growth (derived). The whole conversation is re-sent on every response, so long calls get more expensive per minute. |
| **`gpt-realtime-2.1-mini`** | Audio $10 / $0.30 / $20 per 1M; text $0.60 / $0.06 / $2.40 | Replacement for `gpt-realtime-mini`. |
| **`gpt-realtime-translate`** | $0.034/min | One session per target language. |
| **`gpt-transcribe`** | $0.0045/min | Files and committed turns. Replaces `whisper-1` and the `gpt-4o-*-transcribe` models, which shut down February 26, 2027. |
| **`gpt-live-transcribe`** | $0.017/min | Streaming, about 3.8x the batch rate. |
| **Gemini 3.8 Live** | Audio $3 in / $12 out per 1M (about $0.005 / $0.018 per min); text $0.75 / $4.50 | GA September 15, 2026. Same rates for the Extended Thinking variant. |
| **Gemini 3.8 Flash TTS** | $0.50 in / $9 out per 1M promotional through December 31; $1 / $18 from January 1, 2027 | GA September 22, 2026. Flash-Lite TTS is $6 per 1M audio tokens, also doubling January 1. |
| **Gemini 3.5 Transcribe Live** | About $0.009/min blended | GA August 26, 2026. |
| **Microsoft MAI-Transcribe-2** | $0.10 per audio hour (about $0.0017/min), limited-time | Launched September 3, 2026. Budget for a higher rate once the offer ends. |
| **OpenAI TTS** (`gpt-4o-mini-tts`) | $12 per 1M audio tokens | No new OpenAI TTS model shipped in August or September. `tts-1`, `tts-1-hd` and the `gpt-4o-mini-tts` snapshots shut down January 6, 2027. |
| **xAI Grok voice** | $0.08/min plus $0.004 per text input | Flat per-minute speech-to-speech. xAI speech-to-text is $0.10 per hour (REST) or $0.20 per hour (streaming); TTS is $15 per 1M characters. |
| **Bundled voice-agent platforms** | About $0.06-0.14/min plus telephony | Telnyx about $0.06 (vendor-reported), Deepgram Voice Agent $0.075 ($0.05 with your own LLM and TTS), ElevenLabs Agents $0.08 ($0.16 burst), Vapi $0.05 plus providers at cost (about $0.08-0.13 in total), Retell about $0.13 in a worked example, Bland $0.12-0.14. This is the bar a self-assembled pipeline has to beat. |

For architecture tradeoffs between these options, see [Realtime Voice Agents](https://github.com/ombharatiya/ai-system-design-guide/blob/main/18-voice-and-audio-agents/01-realtime-voice-agents.md).

#### Embedding Models
| Model | Cost / 1M tokens | Notes |
|-------|------------------|-------|
| **Cohere embed-v5.0-pro / -fast** | $0.12 / $0.08 | September 30, 2026. Shared embedding space across both, 128K input. |
| **voyage-4-large / voyage-4 / voyage-4-lite** | $0.12 / $0.06 / $0.02 | January 15, 2026. Shared space, 32K input. |
| **voyage-context-4, voyage-code-4** | $0.12 | voyage-code-4 reports +27.54% over voyage-code-3 (vendor-reported). |
| **text-embedding-3-large** | $0.13 | 3072 dims, 8,192-token input. Unchanged. |
| **text-embedding-3-small** | $0.02 | 1536 dims. Carried over. |
| **gemini-embedding-2** | $0.20 (text; Batch $0.10) | Multimodal, stable since April 2026; image $0.45, audio $6.50, video $12.00 per 1M (Google pricing page). |
| **Cohere Embed 4** | $0.10 | Previous Cohere generation; Matryoshka dims 256 / 512 / 1024 / 1536. Carried over. |

Rerankers: Voyage rerank-3 at $0.05 and rerank-3-lite at $0.02 per 1M tokens (September 30, 2026, 32K context).

> [!IMPORTANT]
> **Reasoning tokens are output tokens.** On models with always-on or adaptive thinking (Claude Fable 5.1, Opus 5.5 and Sonnet 5.5; GPT-6 Astra, which has no `none` effort), you pay the output rate for thinking that never appears in the response. This can increase total request cost by 2x-10x on logic-heavy tasks. Thinking cannot be disabled on Opus 5.5, and Sonnet 5.5's lowest setting is `between_tools`, so the cost control is the **effort** setting plus a `max_tokens` cap, not a thinking toggle. Watch silent default changes: Opus 5.5 defaults to `medium` (Opus 5 used `high`), GPT-6.1 Sol to `medium`, and Sonnet 5.5 to `high` on the API. Set effort explicitly on every request.

### Retirement and Price-Change Calendar: Q4 2026 and Early 2027

Lifecycle is now tracked per **(model, platform)** pair: the same model can retire months apart on the vendor API, Bedrock, Google Cloud and Foundry. Minimum notice differs too: OpenAI gives 6 months for GA models, 3 months for specialized variants and as little as 2 weeks for previews (`gpt-5.4-cyber` got 20 days); Anthropic gives 60 days; Bedrock models launched from September 7, 2026 carry a 6-month or 45-day Legacy period, and in Legacy, existing customers can lose access after 15 days of inactivity; Foundry gives Fireworks per-token models 15 days.

**Executed between August 15 and October 1, 2026:** Groq free and developer Llama 3.3 70B and 3.1 8B (August 16); Anthropic Workbench and experimental prompt tools (August 17); OpenAI and Azure OpenAI Assistants API (August 26, replaced by Responses plus Conversations); Mistral Medium 3.1 (August 31, to 3.5); OpenAI's Sora 2 models and the Videos API (September 24, no one-to-one replacement); `gpt-5.4-cyber` (October 1, on 20 days' notice).

**Scheduled in the same window (execution not independently confirmed):** Bedrock Claude 3 Haiku (September 10); Bedrock Nova Premier and Nova Sonic v1 (September 14); Bedrock Nova Canvas and Nova Reel (September 30); `gpt-3.5-turbo-instruct`, `babbage-002` and `davinci-002` (September 28); Mistral OCR 4.0 (to OCR 4.1 at the same price) and Leanstral 1.5 on the API (September 30); `gemini-2.5-flash-image` (October 2). Treat any of these still in your code as broken until you have tested them.

| Date | Kind | Platform | What changes | Move to |
|------|------|----------|--------------|---------|
| Oct 5, 2026 | Retirement | Gemini API | `antigravity-preview-05-2026` | `antigravity-preview-09-2026` |
| Oct 5, 2026 | Price | OpenAI | GPT-Rosalind billing starts ($5 / $25) | - |
| Oct 8, 2026 | Price | Bedrock | Claude Opus 4.1 enters public extended access at higher provider-set pricing | Claude 4.6+ |
| Oct 14, 2026 | Retirement | Bedrock | Claude Sonnet 4 EOL | Sonnet 5.5 |
| Oct 14, 2026 | Retirement | Foundry | `gpt-4.1-nano` | - |
| Oct 15, 2026 | Retirement | Foundry | `gpt-4o-transcribe`, `gpt-4o-mini-transcribe` (2025-03-20) | `gpt-transcribe` |
| Oct 15, 2026 | Floor only | Claude API | Claude Haiku 4.5 retirement floor; no notice issued, so not before about December | Haiku 5.5 when released |
| Oct 20, 2026 | Retirement | Google Cloud | `gemini-2.5-pro`, `-flash`, `-flash-lite` | Gemini 3.8 Flash, 3.5 Flash-Lite |
| Oct 23, 2026 | Retirement | OpenAI | Legacy snapshots (announced April 22): `gpt-4o-2024-05-13`, `gpt-4-turbo`, `gpt-4-0613`, `gpt-4-1106-preview`, `gpt-3.5-turbo-0125`, `gpt-4.1-nano`, `o1`, `o1-pro`, `o3-mini`, `o4-mini`, `gpt-image-1`. The bare `gpt-4` and `gpt-3.5-turbo` aliases go too, as do fine-tunes of GPT-3.5 Turbo, GPT-4, GPT-4.1-nano, o4-mini, `babbage-002` and `davinci-002` | gpt-5.6-sol / terra / luna (o1-pro via `reasoning.mode: "pro"`); `gpt-image-2.5-sunburst` or `-flare` |
| Oct 31, 2026 | Retirement | OpenAI | Evals platform goes read-only | Promptfoo (OpenAI-owned, MIT) |
| Oct 31, 2026 | Retirement | Mistral | Z.ai GLM 5.2 | GLM 5.3 |
| Nov 2, 2026 | Retirement | xAI | `grok-imagine-image-quality` | `grok-imagine-image-2.0` |
| Nov 15, 2026 | Retirement | Foundry | `claude-haiku-4-5`, `codex-mini` | - |
| Nov 19, 2026 | Retirement | Foundry | o1, o1-pro, o3, o3-pro, o3-deep-research; o3-mini, o4-mini | gpt-5.6-sol; gpt-5.6-terra |
| Nov 21, 2026 | Price | OpenAI | End of GPT-5.6 Sol's guaranteed promo window ($4 / $20 may revert to $5 / $30) | GPT-6 Sol |
| Nov 24, 2026 | Retirement | Foundry | `claude-opus-4-5` (Claude API floor is the same date, no notice yet) | Opus 5.5 |
| Nov 26, 2026 | Retirement | Bedrock | AI21 Jamba 1.5 | - |
| Nov 30, 2026 | Retirement | Claude API, Foundry | `claude-sonnet-4-5-20250929` | `claude-sonnet-5-5` |
| Nov 30, 2026 | Retirement | OpenAI | Evals, Agent Builder, Reusable Prompts shut down | Promptfoo; Agents SDK |
| Dec 1, 2026 | Retirement | OpenAI | `gpt-image-1.5`, `gpt-image-1-mini`, `chatgpt-image-latest` | `gpt-image-2.5-sunburst` or `-flare` |
| Dec 9, 2026 | Auto-upgrade | Foundry | gpt-4o 2024-05-13 Standard deployments | gpt-5.6-sol (latency, cost and style change with no code change) |
| Dec 11, 2026 | Retirement | OpenAI | `gpt-5-2025-08-07` (and mini, nano), `gpt-5-pro-2025-10-06`, `o3-2025-04-16`, `o3-pro-2025-06-10` | gpt-5.6-sol / terra / luna; pro via `reasoning.mode: "pro"` |
| Dec 15, 2026 | Retirement | Foundry | whisper, tts, tts-hd | - |
| Dec 31, 2026 | Price | Gemini API | Last day of Gemini 3.6 / 3.7 / 3.8 Flash and 3.8 Flash TTS promotional pricing (2x from January 1) | Budget at list |
| Jan 6, 2027 | Retirement | OpenAI | `tts-1`, `tts-1-hd`, dated `gpt-4o-mini-tts` snapshots; fine-tuning job creation ends for existing customers | `gpt-realtime-2.1-mini`; open weights, Azure or Bedrock for tuning |
| Jan 8, 2027 | Retirement | Bedrock | Claude Opus 4.1 EOL | Claude 4.6+ |
| Jan 20, 2027 | Retirement | OpenAI | `gpt-realtime`, `gpt-audio`, `gpt-4o-realtime`, `gpt-4o-audio` families | `gpt-realtime-2.1`, `-2.1-mini`, `gpt-audio-1.5` |
| Feb 26, 2027 | Retirement | OpenAI | `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `gpt-4o-transcribe-diarize` | `gpt-transcribe`, `gpt-live-transcribe` |
| Apr 1, 2027 | Retirement | OpenAI | `gpt-5.1`, `gpt-5.3-codex`, `gpt-5.4-nano` | GPT-6 Sol, GPT-6 Luna |
| May 7, 2027 | Retirement | Gemini API | `gemini-3.1-flash-lite` | Gemini 3.5 Flash-Lite |

**Same model, different dates:** Claude Sonnet 4 retired on the Claude API June 15, 2026 but runs on Bedrock until October 14. Claude Opus 4.1 retired on the Claude API August 5, 2026 but runs on Bedrock until January 8, 2027 (at higher extended-access prices from October 8). Grok 4 was retired by xAI on May 15 but is still listed as GA on Azure Foundry. A multi-cloud failover chain can quietly land on a model already retired on your primary, so the model registry needs a date per platform.

### Earlier 2026 Price History

Kept for context; these explain how current prices were reached.

- **Anthropic.** Claude Fable 5 launched June 9 at $10 / $50 (Mythos-class with safeguards; Claude Mythos 5, the same model with safeguards lifted, shared the price for Glasswing partners). Claude Opus 4.8 launched May 28 at $5 / $25 with a $10 / $50 fast mode (the Opus 4.7 fast tier had been $30 / $150). Claude Sonnet 5's introductory $2 / $10 became permanent on August 10, and the scheduled September 1 rise to $3 / $15 was canceled. Claude Sonnet 4 and Opus 4 retired June 15 and Opus 4.1 retired August 5 on the Claude API.
- **OpenAI.** GPT-5.5 launched April 23 at $5 / $30. GPT-5.6 Sol, Terra and Luna went GA July 9; on July 30 Terra was cut to $2 / $12 and Luna to $0.20 / $1.20, and Priority was renamed Fast. GPT-5.6-Cyber launched August 10. GPT-4o, GPT-4.1, GPT-4.1-mini and o4-mini left ChatGPT February 13; the Realtime API Beta was removed May 12; the Sora app shut down April 26.
- **DeepSeek.** The 75% V4 Pro discount was made permanent on May 22 ($0.435 / $0.87 from June 1), and cache-hit input was cut to 1/10 of launch price on April 26. On August 16 DeepSeek moved to peak and off-peak billing and raised V4 prices 3x to 12x depending on token type, ending its run as the unambiguous cheap option.
- **Google.** Vertex retired `gemini-3-pro-preview` on March 26; Project Mariner shut down May 4. Gemini 3.7 Flash launched August 13 at the half-price introductory rate.

---

## Cost Calculation

### Basic Cost Formula

The function below models the two things a naive `tokens × rate` calculation misses: cache splits and the whole-request long-context cliff.

```python
# USD per 1M tokens, Standard tier, list prices as of October 1, 2026.
# lc_at = smallest prompt size that moves the WHOLE request to long-context rates.
PRICING = {
    "gpt-6-sol":         {"in": 2.00, "cached": 0.20, "out": 10.00,
                          "lc_at": 272_001, "lc_in": 4.00, "lc_cached": 0.40, "lc_out": 15.00},
    "gpt-6-luna":        {"in": 0.10, "cached": 0.01, "out": 0.50,
                          "lc_at": 272_001, "lc_in": 0.20, "lc_cached": 0.02, "lc_out": 0.75},
    "grok-4.7":          {"in": 2.00, "cached": 0.50, "out": 6.00,
                          "lc_at": 200_000, "lc_in": 4.00, "lc_cached": 1.00, "lc_out": 12.00},
    "claude-sonnet-5-5": {"in": 2.00, "cached": 0.20, "out": 10.00},  # flat to 1M
    "claude-opus-5-5":   {"in": 4.00, "cached": 0.20, "out": 20.00},  # flat to 1M
    # Gemini 3.8 Flash: budget on the January 1, 2027 list price, not the $0.75/$3.75 intro.
    # Cache reads assumed at 0.1x of input; hourly cache storage is not modeled here.
    "gemini-3.8-flash":  {"in": 1.50, "cached": 0.15, "out": 7.50},
}

def request_cost(
    model: str,
    uncached_in: int,
    output_tokens: int,          # visible output + reasoning tokens
    cached_in: int = 0,
    cache_write: int = 0,
    write_mult: float = 1.25,    # OpenAI 1.25x; Anthropic 1.25x (5 min) or 2x (1 h)
    tier_mult: float = 1.0,      # 0.5 Batch/Flex, 2.0 Fast, 6.0 OpenAI Ultrafast
    residency_mult: float = 1.0, # 1.1 for region-pinned processing
) -> float:
    p = PRICING[model]
    prompt = uncached_in + cached_in + cache_write
    long_ctx = "lc_at" in p and prompt >= p["lc_at"]

    def rate(key: str) -> float:
        return p[f"lc_{key}"] if long_ctx else p[key]

    cost = (
        uncached_in * rate("in")
        + cache_write * rate("in") * write_mult
        + cached_in * rate("cached")
        + output_tokens * rate("out")
    ) / 1_000_000
    return cost * tier_mult * residency_mult
```

**The cliff in numbers (GPT-6 Sol, 2K output):** a 270K-token prompt costs (270,000 × $2 + 2,000 × $10) / 1M = **$0.56**. A 275K-token prompt costs (275,000 × $4 + 2,000 × $15) / 1M = **$1.13**. Five thousand extra tokens doubled the bill. On Claude Fable 5.1 a 900K-token prompt is billed at the same $10 per 1M as a 9K one; on GPT-6 Astra the same prompt bills at $20 per 1M. Long-context RAG decisions are now partly pricing decisions.

### Example Cost Calculations

**Scenario 1: RAG Chatbot**
```
Per request:
- System prompt: 500 tokens
- Retrieved context: 2,000 tokens
- User message: 100 tokens
- Response: 300 tokens

Input: 2,600 tokens, Output: 300 tokens

GPT-6 Sol or Claude Sonnet 5.5: (2600 × $2 + 300 × $10) / 1M = $0.0082 per request
GPT-6 Luna:                     (2600 × $0.10 + 300 × $0.50) / 1M = $0.00041 per request

At 10,000 requests/day on GPT-6 Sol:
Daily: $82
Monthly: $2,460
(GPT-6 Luna: $4.10/day, $123/month, if quality holds on your evals)
```

**Scenario 2: Document Summarization**
```
Per document:
- Document: 8,000 tokens
- Summary: 500 tokens

GPT-6 Sol cost: (8000 × $2 + 500 × $10) / 1M = $0.021

1,000 documents: $21
10,000 documents: $210 (Batch API: $105)
```

### Monthly Cost Projection

```python
def project_monthly_cost(
    requests_per_day: int,
    avg_input_tokens: int,
    avg_output_tokens: int,
    model: str,
    **kwargs,
) -> dict:
    per_request = request_cost(
        model, avg_input_tokens, avg_output_tokens, **kwargs
    )

    daily = per_request * requests_per_day
    monthly = daily * 30
    yearly = monthly * 12

    return {
        "per_request": per_request,
        "daily": daily,
        "monthly": monthly,
        "yearly": yearly
    }

# Example
costs = project_monthly_cost(
    requests_per_day=50000,
    avg_input_tokens=2000,
    avg_output_tokens=400,
    model="gpt-6-sol"
)
# Output: $0.008/request, $400/day, ~$12,000/month
```

---

## Cost Optimization Strategies

### Strategy 1: Model Routing

Route requests to appropriate model tiers:

```python
class ModelRouter:
    def __init__(self):
        self.classifier = load_complexity_classifier()

    def route(self, query: str, context: str) -> str:
        complexity = self.classifier.predict(query)

        if complexity < 0.3:
            return "gpt-6-luna"   # Simple queries: $0.10 / $0.50
        elif complexity < 0.7:
            return "gpt-6-luna"   # Medium: try cheap first
        else:
            return "gpt-6-sol"    # Complex queries: $2 / $10

    def route_with_fallback(self, query: str, context: str) -> str:
        # Try cheap model first
        response = self.try_model("gpt-6-luna", query, context)

        if self.is_quality_sufficient(response):
            return response

        # Fallback to expensive model
        return self.try_model("gpt-6-sol", query, context)
```

**Potential savings:** 50-70% with minimal quality impact. The tier spread is now 20x on both input and output between GPT-6 Luna and GPT-6 Sol, so routing pays more than it did a year ago.

### Strategy 2: Prompt Optimization

Reduce token count without losing quality:

```python
# Before: 2,500 tokens
system_prompt = """
You are a helpful customer support assistant for Acme Corp.
You have access to our product documentation and should answer
questions accurately and helpfully. Always be polite and professional.
If you don't know something, say so rather than making things up.
Format your responses clearly with bullet points when listing items.
[... more verbose instructions ...]
"""

# After: 800 tokens
system_prompt = """
You are Acme Corp's support assistant.
Rules:
- Answer from provided context only
- Admit uncertainty
- Use bullet points for lists
- Be concise
"""

# Savings on GPT-6 Sol: 1,700 tokens × $2/1M = $0.0034 per request
# At 10K requests/day: $34/day = $1,020/month (before caching, which shrinks this further)
```

### Strategy 3: Caching

Cache responses for repeated or similar queries:

```python
class ResponseCache:
    def __init__(self, ttl_seconds: int = 3600):
        self.exact_cache = TTLCache(maxsize=10000, ttl=ttl_seconds)
        self.semantic_cache = SemanticCache(threshold=0.95)

    def get_or_generate(self, query: str, context: str) -> tuple[str, bool]:
        # Check exact cache
        cache_key = self.make_key(query, context)
        if cache_key in self.exact_cache:
            return self.exact_cache[cache_key], True  # Cache hit

        # Check semantic cache
        similar = self.semantic_cache.find_similar(query)
        if similar:
            return similar.response, True  # Semantic hit

        # Generate new response
        response = self.generate(query, context)
        self.exact_cache[cache_key] = response
        self.semantic_cache.add(query, response)

        return response, False  # Cache miss

# With 30% cache hit rate:
# Baseline: $3,000/month
# With caching: $2,100/month
# Savings: $900/month
```

### Strategy 4: Batch Processing and Service Tiers

Anything no human is waiting on belongs in a cheaper tier:

```python
# Real-time: pay full price
for query in queries:
    response = model.generate(query)

# Batch API (50% off at OpenAI, Anthropic, Google, and via OpenRouter on 70+ models):
batch_responses = model.batch_generate(queries)
# Cost: 50% of real-time pricing, results within 24 hours

# Flex tiers (OpenAI, Gemini, Bedrock): same 0.5x on the regular API, in exchange
# for slower, lower-priority processing
```

The ladder now runs from 0.5x (Batch, Flex) through Standard to 2x (OpenAI Fast, Anthropic fast mode) and 6x (OpenAI Ultrafast). A latency SLO is a cost decision: map each workload class (interactive, agent inner loop, offline) to a tier and report the blended rate.

### Strategy 5: Output Length Control

Limit response length appropriately:

```python
# Reduce unnecessary output
response = model.generate(
    prompt=prompt,
    max_tokens=300,  # Limit output (on reasoning models this budget includes thinking)
    stop=["\n\n"]    # Stop at natural break
)

# Cost impact on GPT-6 Sol:
# Before: avg 500 output tokens = $0.005 per request
# After: avg 250 output tokens = $0.0025 per request
# Savings: 50% on output costs
```

### Strategy 6: Prompt-Length Routing

Keep OpenAI prompts at or under 272K and xAI prompts under 200K, or route long prompts to a flat-priced model (Claude 4.6 and later). Trimming retrieved context by a few thousand tokens near the threshold halves the request cost; above it, compaction or RAG usually beats paying 2x on every token.

### Cost Optimization Summary

| Strategy | Effort | Potential Savings |
|----------|--------|-------------------|
| Model routing | Medium | 50-70% |
| **Context Caching** | Low | **90-97.5% (cached input)** |
| Prompt optimization | Low | 20-40% |
| Response caching | Medium | 20-40% |
| Batch / Flex tiers | Low | 50% (OpenAI, Anthropic, Google, OpenRouter) |
| Prompt-length routing | Low | Up to 50% on requests near a long-context threshold |
| Off-peak scheduling | Low | 50% (DeepSeek) |

---

## Context Caching Economics

**The rule still holds:** if a stable prefix (system prompt, tool definitions, a shared corpus) is more than a few thousand tokens and gets reused within the TTL, cache it. What changed in 2026 is that cache terms differ by model, so the math must be done per model.

**Break-even:** caching costs a write premium of `(write_mult - 1)` once and saves `(1 - read_mult)` on every reread, so

`break-even rereads = (write_mult - 1) / (1 - read_mult)`

| Model | Input | Cache write | Cache read | TTL | Break-even rereads |
|-------|-------|-------------|------------|-----|--------------------|
| Claude Fable 5.1 | $10.00 | $12.50 (5 min) / $20.00 (1 h) | $0.25 (0.025x) | 5 min or 1 h | 0.26 / 1.03 |
| Claude Opus 5.5 | $4.00 | $5.00 / $8.00 | $0.20 (0.05x) | 5 min or 1 h | 0.26 / 1.05 |
| Claude Sonnet 5.5 | $2.00 | $2.50 / $4.00 | $0.20 (0.1x) | 5 min or 1 h | 0.28 / 1.11 |
| GPT-6.1 Sol | $2.00 | $2.50 | $0.10 (0.05x) | Fixed 30 min | 0.26 |
| GPT-6 Sol | $2.00 | $2.50 | $0.20 (0.1x) | Fixed 30 min | 0.28 |
| GPT-6 Astra | $10.00 | $12.50 | $1.00 (0.1x) | Fixed 30 min | 0.28 |
| Gemini 3.8 Flash | $0.75 intro | - | $0.075 intro ($0.15 from Jan 1, 2027) + $0.50 per 1M tokens per hour of storage intro ($1.00 from Jan 1, 2027) | Explicit caches billed per hour stored | Depends on storage time |

A break-even below 1 means **one reuse inside the TTL pays for the write**. Anthropic's 1-hour write needs at least two rereads.

**Where caching now changes model choice.** Take a 50-turn agent loop with a 100K-token stable prefix (tool definitions plus repository context) on a 5-minute or 30-minute TTL, counting only the prefix:

| Model | Prefix cost uncached (50 turns) | Prefix cost cached (1 write + 49 reads) |
|-------|---------------------------------|-----------------------------------------|
| Claude Fable 5.1 | $50.00 | $1.25 + 49 × $0.025 = $2.48 |
| GPT-6 Astra | $50.00 | $1.25 + 49 × $0.10 = $6.15 |
| Claude Opus 5.5 | $20.00 | $0.50 + 49 × $0.02 = $1.48 |
| Claude Sonnet 5.5 | $10.00 | $0.25 + 49 × $0.02 = $1.23 |
| GPT-6.1 Sol | $10.00 | $0.25 + 49 × $0.01 = $0.74 |

Two lessons. First, with caching the prefix stops being the cost driver: cached Opus 5.5 costs 25 cents more than cached Sonnet 5.5 and far less than uncached Sonnet, so the real difference between them is output and reasoning tokens. Second, identical list prices hide different cached costs: Fable 5.1 and Astra both list at $10 input, but Astra's 0.1x read makes the same cached prefix about 2.5x as expensive.

**Caveats that bite in production:**
- **OpenAI** (GPT-5.6 and later): minimum cacheable prompt 1,024 tokens; `prompt_cache_options.ttl` accepts only `"30m"`. Earlier OpenAI models have no write charge and use `prompt_cache_retention`. The 272K long-context rate applies to cached tokens too.
- **Anthropic**: Opus 5.5's minimum cacheable prompt is 512 tokens. On Fable 5.1, Opus 5.5 and Sonnet 5.5, thinking blocks are bound to the conversation prefix: editing the system prompt, tools or earlier messages drops the block or, for accounts created on or after August 31, 2026, returns a 400. Treat history as append-only, the same discipline that keeps caches warm. The `inline-tools-2026-09-15` beta adds tools mid-conversation without losing the cache.
- **Gemini** explicit caches accrue storage per hour, so a cache that is written and then idles can cost more than it saves.
- **Observe it.** OpenAI's Prompt Cache Diagnostics went GA on September 8, 2026 and Anthropic's cache diagnostics on September 23. Track hit rate as an SLO; prompt rewrites and model bumps silently zero it.

Batch discounts (50%) stack with caching at both OpenAI and Anthropic. For how these discounts map to KV reuse inside the serving stack, see [KV Cache and Context Caching](https://github.com/ombharatiya/ai-system-design-guide/blob/main/04-inference-optimization/02-kv-cache-and-context-caching.md).

---

## Self-Hosting & GPU Cloud Arbitrage

**The Reserved vs. Serverless Tradeoff:**

| Model Size | Serverless (RunPod/Together) | Reserved (Lambda/AWS) |
|------------|-----------------------------|-----------------------|
| **Burst Capacity** | Infinite (cold starts) | Fixed |
| **Utilization** | Pay only for compute time | 24/7 fixed cost |
| **TCO Break-even**| **Cost-effective &lt; 40% util** | **Cost-effective > 40% util** |

**Principal-level Nuance:**
"GPU Cloud Arbitrage" involves moving production workloads between providers based on **spot instance availability**. Tools like **Skypilot** automate this, saving up to 60% on self-hosting costs by following "low-demand" regions globally. MoE models cut the active compute per token, but not the memory needed to hold the weights: Llama 4 Scout (109B total) fits one H100 at INT4, Maverick (about 400B total) needs an 8x H100 node, and Xiaomi says MiMo-V2.6-Flash (309B / 15B active) fits one 8-GPU node.

**GPU prices moved the other way from API prices in 2026.** The Silicon Data index on October 1 put B200 at $5.86 per GPU-hour (up 27.6% year to date entering September) and H100 at $2.77. On-demand list prices on October 1: Lambda H100 SXM $3.99 and B200 $6.69; RunPod H100 $2.69 (community) / $3.49 (secure), B200 $5.98 / $6.79, B300 $6.94 / $7.89. Longer terms are cheaper: on September 7, a 12-month B200 averaged $5.39 against $5.73 for 3 months.

### When Self-Hosting Makes Sense

```
API cost at scale (1M requests/month, 2,000 input + 500 output tokens each):
- Claude Opus 5.5:                $8,000 + $10,000 = $18,000/month
- Claude Sonnet 5.5 / GPT-6 Sol:  $4,000 +  $5,000 =  $9,000/month
- DeepSeek V4.1-Flash (peak):       $600 +    $600 =  $1,200/month (half off-peak)
- GPT-6 Luna:                       $200 +    $250 =    $450/month
- MiMo-V2.6-Flash (OpenRouter):     $280 +    $140 =    $420/month

Self-hosted MiMo-V2.6-Flash (309B / 15B active, MIT) on one 8x H100 node:
- GPU: 8 × $2.77/GPU-hr (index) × 730 = $16,177/month
       (8 × $3.99 Lambda on-demand = $23,302/month)
- Engineering time: $5,000/month (0.5 FTE)
- Ops overhead: $2,000/month
- Total: ~$23,200 to $30,300/month, before N+1 redundancy
```

At this volume self-hosting loses to **every** API row, including Opus. The old rule of thumb ("self-host above roughly 500K requests per month") assumed frontier-only APIs; it does not survive a $0.10 / $0.50 closed tier and hosted open weights at $0.14 / $0.28. Break-even is now about utilization: the node has to displace roughly $23K of API spend per month. At this request shape that is about 2.6M requests per month against Sonnet 5.5 or GPT-6 Sol, but about 51M requests (roughly 128B tokens, or about 49K tokens per second around the clock) against GPT-6 Luna. Measure your own throughput on the target model before believing either number.

### Self-Hosting Cost Components

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| GPU compute | $5K-50K | One 8x H100 node is $16K-23K; HA doubles it |
| Storage | $200-500 | Model weights, logs |
| Networking | $100-500 | Egress, load balancing |
| Engineering | $5K-15K | Partial FTE for ops |
| Monitoring | $100-500 | Observability tools |

### GPU Requirements by Model Size

| Model Size | GPU Config | Estimated Cost/Month |
|------------|------------|---------------------|
| 7B (INT4) | 1x A10G | $500-800 |
| 7B (FP16) | 1x A100 40GB | $1,500-2,500 |
| 70B (INT4) | 2x A100 80GB | $5,000-8,000 |
| 70B (FP16) | 4x A100 80GB | $10,000-15,000 |
| 405B dense (INT4), e.g. Llama 3.1 405B | 8x H100 | $16,000-23,000 |
| ~300B MoE, ~15B active (MiMo-V2.6-Flash) | 1x 8-GPU node | $16,000-23,000 (H100) |
| ~1T MoE, ~42B active (MiMo-V2.6-Pro) | 2x 8-GPU nodes (16-way tensor parallel in Xiaomi's SGLang recipe) | $32,000-47,000 (H100) |

H100 rows assume $2.77-3.99 per GPU-hour. Extreme quantization changes the small end: Ternary Bonsai 2 27B packs a Qwen3.8-27B base into 5.95 GB at 1.72 bits per weight (Apache 2.0), but needs PrismML's inference forks.

### Decision Framework

```
Choose API when:
- Volume cannot keep a GPU node busy around the clock
- No ML ops expertise
- Need highest quality (frontier models)
- Fast iteration needed

Choose self-hosting when:
- Sustained volume saturates nodes (price it against a ROUTED API bill)
- Have ML infrastructure team
- Data privacy or residency requirements an API cannot meet
- Predictable, stable workload
- Custom fine-tuning needed (OpenAI ends new fine-tuning jobs Jan 6, 2027)

Before either, check the license:
- MIT / Apache 2.0: MiMo-V2.6, GLM-5.3-Flash, DeepSeek V4.1-Flash, Hy4 preview, Qwen3.8-27B
- Gated: GLM-5.3 (security review for MaaS above US$10B revenue), Kimi K3 (deal for MaaS
  above US$20M revenue), Qwen3.8-Max (MaaS/assistant above US$50M), Qwen Community 1.0
  (any MaaS or coding/office-assistant business), Mistral Medium 3.5 (no rights above
  US$20M monthly revenue)
```

---

## Total Cost of Ownership

### TCO Components

```python
def calculate_tco(scenario: dict) -> dict:
    # Direct costs
    api_or_compute = scenario["monthly_api_cost"]

    # Engineering costs
    development = scenario["dev_hours"] * scenario["engineer_rate"]
    maintenance = scenario["maintenance_hours"] * scenario["engineer_rate"]

    # Infrastructure
    vector_db = scenario["vector_db_cost"]
    monitoring = scenario["monitoring_cost"]

    # Indirect costs
    downtime_risk = scenario["expected_downtime_hours"] * scenario["revenue_per_hour"]

    monthly_tco = (
        api_or_compute +
        development / 12 +  # Amortized over year
        maintenance +
        vector_db +
        monitoring +
        downtime_risk
    )

    return {
        "monthly_tco": monthly_tco,
        "yearly_tco": monthly_tco * 12,
        "breakdown": {
            "llm": api_or_compute,
            "engineering": development / 12 + maintenance,
            "infrastructure": vector_db + monitoring,
            "risk": downtime_risk
        }
    }
```

### Example TCO Comparison

**Scenario: Customer Support Bot (50K requests/month, 3,000 input + 400 output tokens on Claude Sonnet 5.5)**

| Cost Component | API-Based | Self-Hosted |
|----------------|-----------|-------------|
| LLM costs | $500 | $2,000 (one H100) |
| Vector DB | $70 | $200 |
| Engineering (monthly) | $500 | $3,000 |
| Monitoring | $100 | $200 |
| **Monthly Total** | **$1,170** | **$5,400** |

*At this scale, API is cheaper by a wide margin.*

**Scenario: Large-Scale RAG (2M requests/month, 4,000 input + 500 output tokens)**

| Cost Component | API (all mid-tier) | API (routed: 70% GPT-6 Luna, 30% GPT-6 Sol) | Self-Hosted (one 8x H100 node) |
|----------------|--------------------|---------------------------------------------|--------------------------------|
| LLM costs | $26,000 | $8,710 | $16,200 |
| Vector DB | $500 | $500 | $1,000 |
| Engineering (monthly) | $1,000 | $1,500 | $8,000 |
| Monitoring | $200 | $200 | $500 |
| **Monthly Total** | **$27,700** | **$10,910** | **$25,700** |

*Self-hosting only beats the naive all-mid-tier API bill, and only before you add a second node for redundancy. A routed API bill beats it by more than 2x. At 2M requests per month, self-host for control, residency, licensing or fine-tuned weights, not for cost.*

---

## Interview Questions

### Q: How would you optimize costs for a high-volume RAG application?

**Strong answer:**
I would approach cost optimization in layers:

**1. Architecture optimization:**
- Model routing: Use cheap model for simple queries
- Caching: provider prefix caching on the stable prefix, plus exact and semantic response caching (30-40% of queries may be cacheable)
- Prompt compression: Minimize system prompt tokens, and keep prompts under long-context thresholds (272K on OpenAI)

**2. Model selection:**
```
Request shape: 2,600 input + 300 output tokens
Simple queries (60%): GPT-6 Luna at $0.00041/request
Complex queries (40%): GPT-6 Sol at $0.0082/request
Weighted avg: $0.0035/request (vs $0.0082 all GPT-6 Sol)
Savings: 57%
```

**3. Infrastructure:**
- Batch or Flex for embedding refreshes and offline evals (50% cheaper)
- Right-size vector DB
- Use spot instances where possible

**4. Monitoring:**
- Track cost per query type and per task, not just per token
- Track cache hit rate as an SLO
- Alert on anomalies and on spend caps before they hard-stop traffic

### Q: When would you recommend self-hosting vs using APIs?

**Strong answer:**
Decision depends on multiple factors:

**Utilization, not request count:**
- A GPU node costs $16K-23K a month whether it is busy or not, so the question is whether my sustained traffic would displace that much API spend
- Against a mid-tier API ($2 / $10) that happens at a few million requests a month; against GPT-6 Luna ($0.10 / $0.50) it takes tens of millions
- I compare against a routed API bill, never against the frontier list price

**Team capabilities:**
- No ML ops: API regardless of scale
- Strong infra team: Consider self-hosting earlier

**Quality and license:**
- Need absolute best: APIs (frontier models)
- Good enough works: Self-hosted open models, after checking the license (Kimi K3, GLM-5.3, Qwen and Mistral Medium 3.5 all carry commercial gates)

**Other factors:**
- Data privacy: May force self-hosting, though ZDR-eligible APIs (Opus 5.5, Sonnet 5.5) cover many cases
- Latency control: Self-hosting gives more control
- Fine-tuning needs: OpenAI ends new fine-tuning jobs for existing customers on January 6, 2027, which pushes customization toward open weights

**My recommendation process:**
1. Start with APIs for fastest iteration
2. Build abstraction layer for model switching
3. Evaluate self-hosting when one stable workload's API spend approaches the cost of two nodes (one plus redundancy)
4. Pilot with shadow deployment before committing

### Q: Your cost model for next year uses today's per-token prices. What will it get wrong?

**Strong answer:**
Per-token list prices are the least stable input in the model. I would check eight things:

1. **Promotions expire.** Gemini 3.8 Flash doubles to $1.50 / $7.50 on January 1, 2027, and GPT-5.6 Sol's $4 / $20 is guaranteed only through November 21, 2026. I budget on list prices and treat promos as upside.
2. **Long-context cliffs.** On OpenAI, a prompt one token over 272K bills the entire request at roughly 2x input and 1.5x output. On xAI the line is 200K. I model the prompt-size distribution, not the mean.
3. **Cache multipliers differ by model.** Reads are 0.1x, 0.05x or 0.025x depending on the model, and OpenAI's TTL is fixed at 30 minutes. A model swap changes cached cost even at the same list price.
4. **Speed tiers.** If product wants lower latency, Fast is 2x and Ultrafast 6x. Each workload class gets an explicit tier.
5. **Residency.** Region-pinned processing is about 1.1x at Anthropic, OpenAI, Bedrock, Google Cloud and Mistral. I apply it only to tenants that need it.
6. **Tokens per task, not tokens per call.** Models differ several-fold in tokens per task (Artificial Analysis measured GPT-6 Astra using about a third of GPT-5.6 Sol's tokens per coding task, and Step 5 Preview about twice the median output). Thinking tokens bill as output.
7. **Non-token meters.** Per-minute voice billing, managed-agent session hours, sandbox minutes, and billed refusals in some Anthropic safety categories.
8. **Forced migrations.** Retirements move traffic to new models with new prices and defaults (the legacy GPT-4, GPT-3.5, o1 and o4-mini snapshots on October 23, Sonnet 4.5 on November 30, the GPT-5 and o3 snapshots on December 11, the audio stack in early 2027), and auto-upgrades such as Foundry's gpt-4o to gpt-5.6-sol change cost with no code change.

The deliverable is a model with a price schedule per (model, platform) and a scenario for each date in the calendar, not a single blended rate.

---

## References

- OpenAI Pricing: https://developers.openai.com/api/docs/pricing
- OpenAI Deprecations: https://developers.openai.com/api/docs/deprecations
- OpenAI Prompt Caching: https://developers.openai.com/api/docs/guides/prompt-caching
- Anthropic Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic Model Deprecations: https://platform.claude.com/docs/en/about-claude/model-deprecations
- Google AI Pricing: https://ai.google.dev/gemini-api/docs/pricing
- xAI Pricing: https://docs.x.ai/developers/models
- DeepSeek Pricing: https://api-docs.deepseek.com/quick_start/pricing
- Mistral Pricing: https://mistral.ai/pricing/api
- Amazon Bedrock Model Lifecycle: https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html
- Microsoft Foundry Model Retirement Schedule: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule
- Lambda Labs GPU Pricing: https://lambdalabs.com/service/gpu-cloud
- RunPod Pricing: https://www.runpod.io/pricing
- LLM Pricing Comparison: https://pricepertoken.com/

---

*Previous: [Capability Assessment](02-capability-assessment.md) | Next: [Model Selection Guide](04-model-selection-guide.md)*

