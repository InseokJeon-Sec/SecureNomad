---
title: Fine-tuning and LoRA (Technical Deep Dive)
sidebar_label: Fine-tuning & LoRA
sidebar_position: 5
description: How full fine-tuning and PEFT (LoRA/QLoRA) work, and how adapters update weights in a low-rank way
tags: [AI, fine-tuning, LoRA, PEFT, deep-dive]
---

# Fine-tuning and LoRA (Technical Deep Dive)

:::note Prerequisite
On top of the big picture in [04. How models are trained](/en/ai/foundations/training) and [09. Fine-tuning vs RAG](/en/ai/using/finetune-vs-rag), this document covers **how fine-tuning actually changes weights**, and why LoRA is efficient.
:::

## 1. What fine-tuning is — updating weights

Adjusting a pretrained model's weights `W` by gradient descent to reduce the loss on new data.

```text
W_new = W - η · ∇W(Loss)     # η: learning rate, ∇: gradient
```

**Full fine-tuning** updates all parameters. Problems:
- For a 70B model, hundreds of GB of optimizer state/gradients → **enormous GPU memory**
- A full model copy per task → storage/deployment burden

## 2. PEFT — tune only a part, efficiently

**PEFT (Parameter-Efficient Fine-Tuning)** reduces cost by training only **a small number of parameters**. The representative is **LoRA**.

## 3. LoRA (Low-Rank Adaptation)

Core idea: the weight change `ΔW` can actually be approximated in **low rank**.

Keep the original weights **frozen**, and learn only the change as the product of two small matrices.

```text
Base :  h = W · x                       # W: d×d (frozen)
LoRA :  h = W · x + (B · A) · x          # A: r×d,  B: d×r,  r ≪ d
        ΔW = B · A  (rank = r, e.g., r=8,16)
```

- Only `A`, `B` are trained → **hundreds to thousands of times fewer** parameters
- At inference, `B·A` can be merged into `W` for zero added latency
- Initialization: `A` random, `B` zero → start at ΔW=0 (identical to the base model)

Why it works: the "directions" needed to adapt to a specific task live in **a few low-dimensional subspaces**, not the full dimension.

## 4. QLoRA — quantization + LoRA

With even less memory:

```text
① Quantize the base model to 4-bit (NF4) to cut memory
② Train only a (high-precision) LoRA adapter on top
→ fine-tune tens-of-billions models even on a single GPU
```

## 5. Comparison

| Method | Trained params | Memory | Traits |
|---|---|---|---|
| Full FT | All (100%) | Very large | Max performance, costly |
| LoRA | ~0.1–1% | Small | Store/swap adapters only, cost-effective |
| QLoRA | ~0.1–1% | Smallest | Single-GPU possible via quantization |

:::tip The benefit of adapters
You only need to store/swap **small adapter files (a few MB to a few hundred MB)** per task. You can operate one base model and hot-swap multiple adapters.
:::

## 6. When to fine-tune (vs RAG/prompt)

| Goal | Fit |
|---|---|
| Inject up-to-date/internal "knowledge" | **RAG** ([deep dive](./rag-internals.md)) |
| Fix "behavior" like format/tone/task | **Fine-tuning** |
| Light adjustment | Prompt/few-shot |

→ General rule: knowledge via RAG, behavior via fine-tuning. They're sometimes used together.

## 7. Alignment training — one line

The stage after pretraining that makes a model "follow instructions well and safely":
- **SFT** (supervised fine-tuning) → **RLHF** (RL from human feedback) or **DPO** (direct preference optimization)

## 8. Summary

```text
Full FT : update all of W (expensive)
LoRA    : freeze W + learn only ΔW=B·A (low-rank) (cost-effective)
QLoRA   : 4-bit quantization + LoRA (single GPU)
```

- Previous: [RAG internals (deep dive)](./rag-internals.md) · Next: [Inference optimization (deep dive)](./inference-optimization.md)
