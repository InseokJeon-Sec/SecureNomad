---
title: 07. RAG (검색 증강 생성)
sidebar_label: 07. RAG
sidebar_position: 2
description: RAG의 정의, 필요성, 동작, 장단점
---

import YouTube from '@site/src/components/YouTube';

# 07. RAG (검색 증강 생성)

이 문서의 내용은 영상으로도 볼 수 있다.

<YouTube id="ZLZ-oE99TOg" title="RAG로 내 데이터를 붙이면 안전할까 — 지식 포이즈닝과 방어 4원칙 (보안 관점) | AI 바로 알기 #4" />

**RAG(Retrieval-Augmented Generation)** 는 답변 전에 관련 자료를 검색(Retrieval)해 함께 제공(Augmented)하고, 그 근거로 답을 생성(Generation)하는 방식이다. 모델 파라미터에 내재된 지식 대신 외부 근거 문서를 참조한다.

## 필요성

LLM 단독으로는 두 가지를 못 한다.

- **최신 정보**: 학습 시점 이후 미반영([04](../foundations/04-training.md))
- **내부 지식**: 조직 문서·규정은 학습에 없음

RAG는 모델 재학습 없이 필요한 자료를 그때그때 붙여 이 둘을 해결한다.

## 동작

```text
질문
 ├ ① 검색: 질문과 관련된 문서 조각을 저장소에서 검색 (의미 기반 → 08. 임베딩/벡터 DB)
 ├ ② 결합: 검색 조각 + 질문을 하나의 프롬프트로 구성
 └ ③ 생성: LLM이 해당 자료를 근거로 답 생성 (출처 표시 가능)
```

## 장점

| 장점 | 설명 |
|---|---|
| 최신·내부 지식 | 저장소만 갱신. 재학습 불필요 |
| 환각 감소 | 근거 범위 내 답변 ([05](../foundations/05-hallucination.md)) |
| 출처 제시 | 근거 문서·위치 표시 가능 |
| 비용·속도 | 파인튜닝보다 저렴·신속 |

## 한계

- 검색 품질에 좌우된다. 부적절한 자료를 검색하면 답도 틀린다.
- 자료가 없으면 여전히 모르거나 지어낼 수 있다.
- 자료 정리·청크 분할·검색 튜닝 등 파이프라인 구성이 필요하다.

내부 동작 상세는 [RAG 내부 동작 심화](../deep-dive/rag-internals.md) 참고.
