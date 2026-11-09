---
title: 13. Model Evaluation
sidebar_label: 13. Model Evaluation
sidebar_position: 4
description: How to measure whether a model works correctly and safely — the three axes of performance, hallucination, and safety, benchmark pitfalls, and red teaming
---

import YouTube from '@site/src/components/YouTube';

# 13. Model Evaluation

<YouTube id="m31_1gdBo4U" title="When an AI answers plausibly, is that enough? — Model evaluation and measuring performance, hallucination, and safety (security view) | AI 바로 알기 #8" />

So far we've seen how to **use** AI and how to **adapt** it. One question remains: **"How do we know the model actually works?"** Adding capability is no guarantee of trustworthiness. Confirming it with **numbers**, not gut feeling, is **evaluation**.

## Why evaluate — plausible ≠ correct

A generative model's biggest trap is that **sounding plausible is not the same as being correct**. Asked about a refund policy, a model may confidently answer "within 14 days" with no basis. If the real policy is 7 days, that's wrong.

- **Fluent phrasing** and **factual correctness** are entirely different things.
- A **confident tone** does not imply a higher probability of being right.

So don't deploy based on a good demo — confirm "how much can we trust it" **with numbers before** deployment.

## Three axes — performance, hallucination, safety

| Axis | Question | How to measure |
|---|---|---|
| **Performance** | How well does it do the task | Accuracy, quality |
| **Hallucination** | Does it make up falsehoods | Factuality vs sources |
| **Safety** | Does it block harmful/dangerous requests | Resistance to jailbreaks |

If **any one axis is empty**, it can't be called usable. In practice the **most often skipped axis is the third, safety**.

## Performance and benchmark pitfalls

Performance is often stated as benchmark scores (general knowledge, reasoning, coding). But don't take them at face value.

- **Benchmark contamination**: test items leak into training data → inflated scores.
- **Overfitting**: strong on benchmarks, weak in practice.
- **Distribution gap**: the benchmark differs from your data/work.

A high general score can go with a much lower score on your own document Q&A. The **most accurate measure is an evaluation set built from your real work**.

## Measuring hallucination — "is it grounded?"

Judge by **"is it grounded?" rather than "does it sound plausible?"**

- Compare the model's answer against **actual sources/facts**.
- Grounded → pass; asserted without basis → mark as **hallucination**.
- With RAG, check against the **source documents** too.

Human grading is accurate but slow and costly, so **automated evaluation (LLM-as-judge)** is mixed in. What matters is **grounding, not tone**.

## Safety evaluation and red teaming

Safety checks whether the model **refuses** harmful requests, blocks **sensitive-data** requests, avoids **biased output**, and withstands **jailbreak / role-bypass** attempts.

The representative method is **red teaming** — deliberately attacking to find weaknesses. Prepare attack scenarios, judge refusal/pass, fix weaknesses, and attack again. Repeating and **automating** this scales it up.

:::warning Passing once ≠ safe
If the model or prompt changes, safety can **break again**. Re-check **continuously**.
:::

## Pre-deployment security checklist

From a security engineer's view. **If any answer is "no," it's not ready.**

1. Do you have an **evaluation set** built from your own work?
2. Did you verify **hallucination against sources**?
3. Did you test **safety and jailbreak resistance**?
4. Did you check that **sensitive data** doesn't leak via input logs or output?
5. Did you define the **impact when the model is wrong**?
6. Did you set a **re-evaluation cadence** for when the model/prompt changes?

## The series, at a glance

From a talking **LLM** we added knowledge (**RAG**), action (**agents**), broader input (**multimodal**), and adaptation (**fine-tuning**) — and each added capability widened the **attack surface**. Today's addition is not capability but **evaluation** — confirming that the capabilities we built are actually trustworthy.

> **One line:** a trustworthy AI is not a "well-built" AI but a "well-evaluated" one.
