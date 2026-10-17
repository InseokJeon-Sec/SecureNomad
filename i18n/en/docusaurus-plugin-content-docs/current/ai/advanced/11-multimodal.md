---
title: 11. Multimodal
sidebar_label: 11. Multimodal
sidebar_position: 2
description: Multimodal AI that handles images, audio, and documents together, beyond text — explained simply
---

# 11. Multimodal

Early LLMs handled **text only**. **Multimodal** AI understands and generates several forms (modalities) together — in addition to text, **images, audio, documents, video**, etc.

## What is a modality

It's "a form of information." Text, image, audio, video — each is a modality.
Multimodal = handling **several modalities at once**.

## What becomes possible

| Input | Example use |
|---|---|
| Image + text | "What's the error in this screenshot?", "Explain this diagram" |
| Audio | Transcription, voice conversation |
| Documents (PDF, etc.) | "Summarize this report," understanding tables/figures too |
| Image generation | Make a picture from text |

## How it's possible (high level)

The core idea is the same as [08. Embeddings](../using/08-embeddings.md).
**Images and audio are also turned into 'vectors (numbers)'**, so they can be handled in the **same space** as text.

```text
text  →┐
image →┤→ common vector space → the model understands them together
audio →┘
```

So "read the text in this photo (image)" and other **cross-form** tasks become possible.

## Security/practical view

- Convenient: you can have screenshots, log images, and documents analyzed directly.
- But **images/documents also contain sensitive info**, so mask it before external transmission. (→ [12. Local LLM](./12-local-llm.md))
- New attack surfaces appear too, like **multimodal prompt injection** — hidden instructions in an image that trick the model.

## Summary

- Multimodal = text + images/audio/documents handled together
- The principle is "turn everything into vectors and process in the same space"
- As convenient as it is, beware **sensitive info and new attack surfaces**.
