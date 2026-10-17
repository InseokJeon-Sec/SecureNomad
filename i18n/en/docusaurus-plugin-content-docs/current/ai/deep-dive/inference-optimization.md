---
title: Inference Optimization (Technical Deep Dive)
sidebar_label: Inference Optimization
sidebar_position: 6
description: KV cache, quantization, batching, FlashAttention, GQA/MQA and more — techniques to serve LLMs fast and cheap
tags: [AI, inference, quantization, KV-cache, deep-dive]
---

# Inference Optimization (Technical Deep Dive)

:::note Prerequisite
This goes deeper into the `O(n²)` cost and KV cache seen in the [attention doc](./attention.md). It covers the serving-stage techniques for running a model **fast and cheap**.
:::

## 1. Two stages of inference

```text
Prefill  : process the whole input prompt at once (parallel) → determines time-to-first-token (TTFT)
Decode   : generate tokens one by one (sequential) → most of the time is here (TPOT)
```

Metrics: **TTFT** (first-token latency), **TPOT/throughput** (token generation speed).

## 2. KV cache — the most important optimization

Generation repeats attention while growing one token at a time. Since the **Key·Value of already-produced tokens don't change**, store and reuse them.

```text
No cache : recompute K·V of all tokens so far for each new token  → O(n²) duplication
KV cache : store past K·V in memory, compute only the new token's K·V → O(n) per step
```

- Cost: **memory** usage. The longer the context, the larger the KV cache (the memory bottleneck of long context)
- Management: **PagedAttention** (vLLM) — manage the KV cache in pages to reduce waste

## 3. Quantization — lowering precision

Represent weights with fewer bits to reduce memory/bandwidth.

```text
FP16/BF16 (16-bit)  →  INT8 (8-bit)  →  INT4/NF4 (4-bit)
```

| Method | Traits |
|---|---|
| PTQ (post-training quantization) | Convert without extra training (GPTQ, AWQ, etc.) |
| QAT (quantization-aware training) | Reflected during training, minimal accuracy loss |

- Effect: greatly reduce model size/memory → run on smaller GPUs / edge
- Cost: slight accuracy loss (often still practical even at 4-bit)

## 4. Attention/architecture optimization

| Technique | Core |
|---|---|
| **FlashAttention** | Compute attention block-by-block to cut memory I/O, boost speed (same result) |
| **GQA / MQA** | Multiple Query heads **share** K·V heads → shrink the KV cache |
| **MoE** (mixture of experts) | Activate only some experts per token → huge params but little compute |
| **Speculative Decoding** | A small model drafts several tokens fast, a big model verifies → faster |

## 5. Throughput — batching

```text
Static batching    : gather requests and run together (incurs waiting)
Continuous batching : immediately fill finished-request slots with new requests → higher GPU utilization/throughput
```

Serving engines like vLLM/TGI greatly raise throughput with continuous batching + PagedAttention.

## 6. Trade-offs

```text
fast·cheap  ◀───────────────▶  accurate·high-quality
more quantization, shared cache, small model      higher precision, big model
```

In practice it's about finding the balance among **latency (TTFT/TPOT), throughput, cost, and quality**.

## 7. Summary

| Technique | Target |
|---|---|
| KV cache | Remove duplicate computation (essential) |
| PagedAttention | KV memory efficiency |
| Quantization | Reduce memory/size |
| FlashAttention | Attention speed/memory |
| GQA/MQA | Shrink KV cache |
| Speculative | Generation speed |
| Continuous batching | Throughput |

- Previous: [Fine-tuning and LoRA (deep dive)](./finetuning-lora.md)
