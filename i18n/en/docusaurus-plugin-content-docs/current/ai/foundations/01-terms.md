---
title: 01. Terminology — AI, ML, Deep Learning, Generative AI
sidebar_label: 01. Terminology
sidebar_position: 1
description: The nesting and distinctions among AI, ML, deep learning, generative AI, and LLMs
---

# 01. Terminology

AI, machine learning, deep learning, generative AI, and LLM are in a **nesting relationship**.

```text
AI               ── any technology mimicking human intelligence
 └ Machine learning ── AI that learns rules from data
    └ Deep learning  ── ML using deep neural networks
       └ Generative AI ── deep learning that generates new content
          └ LLM        ── large models that handle language (GPT, Claude, …)
```

| Term | Definition | Example |
|---|---|---|
| **AI** | Technology mimicking intelligent behavior | Chess engine, recommendation algorithm |
| **Machine learning (ML)** | Learns rules from data rather than hand-coding them | Spam classification, demand forecasting |
| **Deep learning (DL)** | Learning based on neural networks | Image/speech recognition |
| **Generative AI** | Generates content beyond classification/prediction | Text/image generation |
| **LLM** | A large generative model for language | ChatGPT, Claude, Gemini |

## Rule-based vs machine learning

The key difference is **who makes the rules — a human, or learning from data.**

| | Rule-based | Machine learning |
|---|---|---|
| Rules | Hand-coded | Learned from data |
| Spam | Write a rule like "subject contains 'AD' → spam" | Learn patterns from many spam/ham emails |
| Limit | Rules explode as cases multiply | Learns complex patterns given data |

In security terms, rule-based maps to **signature detection**, ML to **anomaly detection**.

## Summary

- Nesting: **AI ⊃ ML ⊃ deep learning ⊃ generative AI ⊃ LLM**
- "AI" today usually means generative AI / LLMs.
