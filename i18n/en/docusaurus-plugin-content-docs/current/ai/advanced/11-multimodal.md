---
title: 11. Multimodal
sidebar_label: 11. Multimodal
sidebar_position: 2
description: Multimodal AI that handles images, audio, and documents beyond text
---

# 11. Multimodal

**Multimodal** AI understands/generates several modalities together — images, audio, documents, video — in addition to text.

## What it enables

| Input | Use |
|---|---|
| Image + text | Analyze a screenshot error, explain a diagram |
| Audio | Transcription, voice conversation |
| Documents (PDF, etc.) | Summarize, understand tables/figures |
| Image generation | Generate from text |

## Principle (high level)

The core is the same as [08. Embeddings](../using/08-embeddings.md). Images and audio are also converted to vectors and handled in the **same space** as text.

```text
text  →┐
image →┤→ common vector space → processed together
audio →┘
```

## Security/practical view

- Convenient: screenshots, log images, and documents can be analyzed directly.
- Images/documents also contain sensitive info; remove it before external transmission ([12. Local LLM](./12-local-llm.md)).
- New attack surfaces appear, such as **multimodal prompt injection** (hidden instructions in an image).
