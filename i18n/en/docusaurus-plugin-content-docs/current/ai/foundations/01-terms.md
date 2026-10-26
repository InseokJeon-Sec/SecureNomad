---
title: 01. Terminology — AI, ML, Deep Learning, Generative AI
sidebar_label: 01. Terminology
sidebar_position: 1
description: The nesting and distinctions among AI, ML, deep learning, generative AI, and LLMs
---

import YouTube from '@site/src/components/YouTube';

# 01. Terminology

You can also watch this as a video (in Korean).

<YouTube id="FTbxcQ0UpPI" title="AI vs ML vs DL vs LLM — one-take overview (security view) | AI 바로 알기 #1" />

AI, machine learning, deep learning, generative AI, and LLM are in a **nesting relationship**.

![Nesting of AI, ML, deep learning, generative AI, and LLM](/img/ai/nesting-en.svg)

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

## Security perspective

Each layer means something different for security. Read alongside the threats, the nesting looks like this.

| Layer | What it means for security | Representative threats |
|---|---|---|
| Machine learning | Widens detection from rules to learning | Classifier evasion via adversarial input, false positives/negatives |
| Deep learning | The model itself becomes a target | Adversarial examples, model extraction, backdoors |
| Generative AI | The ability to produce content is abused | Deepfakes, automated phishing / social engineering |
| LLM | External input becomes the execution context | Prompt injection, sensitive-data leakage, excessive agency |

In security, AI splits into three views.

- **AI for Security** — AI as a tool for defense and assessment. → [AI for Security](/en/security/ai-for-security/overview)
- **Securing AI** — making the use of AI itself safe (threat models, assessment, guidance). → [Securing AI](/en/security/ai-security-assessment/overview)
- **AI as Threat** — adversaries abusing AI (autonomous intrusion, attack automation).

It is the same technology seen from attack, defense, or protection, and the three views interlock.

## Summary

- Nesting: **AI ⊃ ML ⊃ deep learning ⊃ generative AI ⊃ LLM**
- "AI" today usually means generative AI / LLMs.
- In security, this distinction separates **the type of threat and where to respond**. As you go deeper, the attack surface shifts toward external input (prompts) and execution privileges.
