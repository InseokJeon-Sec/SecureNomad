---
title: 01. Terminology — AI, ML, Deep Learning, Generative AI
sidebar_label: 01. Terminology
sidebar_position: 1
description: How AI, machine learning, deep learning, generative AI, and LLMs relate to each other, all in one place
---

# 01. Terminology

In the news, AI, machine learning, deep learning, generative AI, and LLM are used interchangeably. These terms are in a **nested (subset) relationship**.

```text
AI (artificial intelligence)  ── any technology that mimics human intelligence
 └ Machine learning           ── AI that "learns" rules from data by itself
    └ Deep learning           ── ML that learns with deep artificial neural networks
       └ Generative AI        ── deep learning that creates new content (text, images, etc.)
          └ LLM               ── large models that handle 'language' (e.g., GPT, Claude)
```

## One by one

| Term | Meaning | Examples |
|---|---|---|
| **AI** | All technology mimicking intelligent human behavior | Chess programs, recommendation algorithms |
| **Machine Learning (ML)** | Rather than hand-coding rules, **learn rules from data** | Spam classification, demand forecasting |
| **Deep Learning (DL)** | Learn with deep **artificial neural networks** modeled on brain neurons | Image recognition, speech recognition |
| **Generative AI** | Beyond classification/prediction, **generate new content** | Writing, image generation |
| **LLM** | A huge generative-AI model that handles **language** | ChatGPT, Claude, Gemini |

## Rule-based vs machine learning (the key difference)

The biggest difference between the old way and ML is **"who makes the rules."**

| | Rule-based (traditional) | Machine learning |
|---|---|---|
| Rules | Hand-coded by humans | Learned automatically from data |
| Spam example | A human writes a rule like "if the subject contains 'AD', it's spam" | Show tens of thousands of spam/ham emails and it figures out the pattern itself |
| Limitation | Rules explode as cases multiply | Learns complex patterns given enough data |

In security terms, rule-based is closer to **signature detection** (known patterns), ML to **anomaly detection** (learning normal/abnormal from data).

## Summary

- From broad to narrow: **AI ⊃ ML ⊃ Deep Learning ⊃ Generative AI ⊃ LLM**
- These days "AI" usually means **generative AI / LLMs**.
- From the next document we look at LLMs in detail. → [02. What is an LLM](./02-what-is-llm.md)
