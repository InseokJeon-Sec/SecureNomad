---
title: 임베딩 모델
sidebar_position: 3
description: 텍스트를 고차원 벡터로 변환하는 임베딩 모델 — 마트료시카 임베딩, 레이트 인터랙션(ColBERT v2), 바이너리·Int8 양자화, 모델 선택 기준, 공유·비대칭 임베딩 공간, 멀티모달 임베딩.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/03-embedding-models.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09). 모델 목록·가격·리더보드 순위는 빠르게 바뀌므로 최신 값은 각 벤더·벤치마크를 확인하세요.
:::

# 임베딩 모델

임베딩 모델은 텍스트를 고차원 벡터로 변환한다. 프런티어는 정적 단일 벡터 표현을 넘어 **다해상도·레이트 인터랙션·멀티모달** 임베딩으로, 2026년엔 한 모델로 인덱싱하고 다른 모델로 쿼리하게 하는 **공유 임베딩 공간**으로 옮겨갔다.

## 임베딩 프런티어: 마트료시카 임베딩

전통적으로 텍스트를 1,536차원으로 임베딩하면 검색에 1,536차원 전부를 써야 했다.

**마트료시카 표현 학습(MRL)**
- 가장 중요한 정보를 앞쪽 몇 차원에 "저장"하도록 학습.
- **승리**: 1,536차원으로 임베딩하되, "빠른 검색" 패스엔 짧은 프리픽스(64~256차원)만 인덱싱하고 상위 결과를 전체 1,536차원으로 정제.
- **효율**: 한 자릿수 작은 1차 인덱스. 재현율 비용은 모델·절단점에 달렸으니(OpenAI는 256차원으로 자른 text-embedding-3-large가 1,536차원 ada-002를 여전히 이긴다고 보고) 프리픽스 길이를 고르기 전 자신의 쿼리에서 측정하라.

대부분 현 API 모델이 마트료시카 학습됨: Cohere Embed 5(256~2,048), voyage-code-4(256~2,048), gemini-embedding-2(128~3,072), OpenAI text-embedding-3(`dimensions` 파라미터).

---

## 레이트 인터랙션: ColBERT v2

표준 임베딩은 "바이 인코더"(청크당 벡터 하나). **ColBERT**(BERT 위 문맥화 레이트 인터랙션)는 "토큰 수준" 접근을 쓴다.

- **방법**: 청크당 벡터 1개 대신 **토큰당** 벡터 1개 저장.
- **상호작용**: 쿼리 시 쿼리의 모든 토큰을 문서의 모든 토큰과 비교("MaxSim" 연산).
- **상태**: ColBERT v2(및 문서·페이지 이미지용 ColPali, ColQwen2.5, ColNomic 등 후속)는 PLAID 인덱싱으로 크게 압축돼 프로덕션에 가능. "건초 더미 속 바늘" 기술 쿼리에 훨씬 높은 정밀도 달성.
- **2026 서빙 경로**: 범용 엔진이 이제 멀티벡터 데이터를 직접 인덱싱, 흔히 고정 차원 MUVERA 인코딩으로: Milvus 3.0(EmbList + DiskANN, 2026-07), Weaviate(멀티벡터 컬렉션용 MUVERA, 1.40 RC에서 디스크 기반 HFresh 인덱스로 확장, 아직 GA 아님). 레이트 인터랙션을 시도하는 데 더 이상 전용 ColBERT 서버가 필요 없다. [레이트 인터랙션과 ColBERT](11-late-interaction-colbert.md) 참고.

---

## 바이너리·Int8 양자화

`float32` 벡터 저장은 비싸다. 프로덕션 인덱스는 **양자화**에 크게 의존하며, 모델이 내거나 DB가 적용한다.

- **바이너리 임베딩**: 벡터를 1·0으로 변환.
  - **메모리**: 32배 감소.
  - **속도**: 해밍 거리(XOR 연산)가 현대 CPU에서 코사인 유사도보다 10배 빠름.
- **모델이 내는 Int8·바이너리**: Cohere Embed 5(float, int8, binary), voyage-code-4(float32, int8, uint8, binary), Perplexity pplx-embed-v2 프리뷰(네이티브 int8)가 양자화 벡터를 직접 반환, 사후 반올림이 아니라 양자화 사용에 맞춰 설계. OpenAI text-embedding-3은 float만 반환하므로 DB에서 양자화.
- **DB의 저비트 양자화**: Qdrant TurboQuant·Turbo4, Weaviate 4비트 회전 양자화는 스칼라 양자화 전 랜덤·Hadamard 회전을 적용; 둘 다 2026년 기본값이 아닌 옵트인·프리뷰로 출시. Elasticsearch BBQ 계열이 예외: 차원당 약 1비트 저장, DiskBBQ(`bbq_disk`)가 라이선스 포함 시 9.4부터 float 벡터 기본 인덱스. 메커니즘·RAM 계산은 [벡터 데이터베이스](04-vector-databases.md) 참고.

---

## 모델 선택 기준

| 모델 | 공급자 | 특징 | 문맥 |
|-------|----------|----------|---------|
| **gemini-embedding-2** | Google | 네이티브 멀티모달: 텍스트, 이미지 최대 6개, 영상 최대 120초, 오디오, PDF 최대 6페이지, 인터리브 입력; 128~3,072차원. 2026-04부터 안정; 텍스트 전용 gemini-embedding-001 대체(2028-05-14 종료) | 텍스트 8,192토큰 |
| **Cohere Embed 5**(`embed-v5.0-pro`/`-fast`) | Cohere | 2026-09-30. 텍스트·이미지·융합 텍스트+이미지; Pro·Fast 한 공간; float/int8/binary; 텍스트 1M당 $0.12/$0.08 | 128K |
| **Voyage 4**(`voyage-4-large`/`voyage-4`/`voyage-4-lite`) | Voyage AI(MongoDB) | 2026-01-15. 크기 전반 한 공유 공간; 1M당 $0.12/$0.06/$0.02; 오픈 가중치 `voyage-4-nano` | 32K |
| **voyage-code-4** | Voyage AI | 2026-08-13. 풀 리퀘스트에서 캔 자연어-코드 쌍으로 학습, 버그 증상에서 검색하는 에이전트용; 1M당 $0.12 | 32K |
| **voyage-multimodal-3.5** | Voyage AI | 2026-01-15. 인터리브 텍스트·이미지·영상; 256~2,048차원; float·int8·binary 출력 | 32K |
| **Nemotron 3 Embed 8B/1B** | NVIDIA(오픈 가중치, OpenMDW-1.1) | 2026-07-16. 8B: 4,096 슬라이스 가능 차원, RTEB Multilingual 1위 78.5(벤더); 1B: 2,048차원, NVFP4 변형 | 32,768(8B) |
| **Qwen3-Embedding-8B** | 오픈 가중치 | 지시 튜닝, 장문서 강점; MTEB Multilingual 평균 70.58, 단 1위는 현재 경합 | 32K |
| **Llama-Embed-Nemotron-8B** | NVIDIA | 2025-10. 강한 다국어 점수, 4,096차원; 가중치는 비상업·연구용만 라이선스 | 32K |
| **Cohere Embed v4** | Cohere | 멀티모달(텍스트+이미지), 마트료시카, 바이너리 양자화; 여전히 가용, 폐기 미발표 | 128k |
| **OpenAI text-embedding-3-large** | OpenAI | `dimensions`로 마트료시카, 3,072차원, 1M당 $0.13, float 출력만. OpenAI는 더 새 임베딩 모델 미출시; "text-embedding-4"는 없음 | 8,192 |
| **BGE-M3** | 오픈 소스 | 다국어, 다중 입도(dense + sparse + 레이트 인터랙션) | 8k |
| **Jina-Embeddings-v3** | Jina AI | 과제별 LoRA 어댑터, 마트료시카; 레이트 인터랙션엔 Jina ColBERT 모델과 짝 | 8k |

오픈 가중치 모델(Nemotron 3 Embed, Qwen3, BGE)이 이제 공개 벤치마크에서 상용 API를 맞먹거나 능가한다. 관리형 인프라·SLA를 원하면 상용, 지연 바닥보다 고볼륨 쿼리당 비용이 중요하면 오픈 가중치를 고르라.

**리더보드 읽는 법:**
- **MTEB 전용 순위보다 RTEB를 선호하라.** RTEB(MTEB 팀, 2025-10)는 오픈 데이터셋과 유지자가 평가하는 비공개 홀드아웃 세트를 섞어 테스트 학습을 상쇄. MTEB Multilingual 1위가 여러 번 바뀌었으니(Qwen3-Embedding-8B, 이어 llama-embed-nemotron-8b, 이어 주장된 순위의 KaLM-Embedding-Gemma3-12B) 리더를 인용하지 말고 라이브 보드를 확인하라.
- **임베더를 LLM으로 대체하지 마라.** "The Embedder's Dilemma"(arXiv 2608.12875, 2026-08)는 37개 MTEB식 과제에서 LLM 10개와 임베딩 모델 26개를 비교. 집계로 비등(최고 LLM 77.6, 최고 임베더 77.2)하나, 동점이 벤치마크 패스당 최대 1,431배 비싸고, 오픈 LLM이 같은 GPU에서 2.5~736배 느렸다. LLM은 추론 중심 검색, 임베더는 분류에서 앞선다. 이는 LLM의 자리를 가리킨다: 1단계가 아니라 어려운 쿼리의 후반 재순위기.
- **에이전트용 코드 검색은 별도 범주.** 에이전트 쿼리는 식별자가 아니라 모호한 버그 리포트처럼 보인다. Voyage는 홀드아웃 레포로 만든 19개 에이전트 코드 검색 스위트에서 voyage-code-4가 voyage-code-3 대비 +27.54% 보고(벤더; 독립 RTEB 결과 대기).

---

## 공유·비대칭 임베딩 공간

고전 규칙은 "새 임베딩 모델 = 전체 재인덱스". 2026 패턴 둘이 이를 깬다:

- **한 공유 공간의 모델 계열.** Voyage 4 계열과 Cohere Embed 5 Pro/Fast는 벡터가 호환되도록 학습됨. 큰 모델로 코퍼스를 한 번 인덱싱(최상 문서 표현)하고 작은 모델로 쿼리를 서빙(최저 쿼리 지연·비용)하거나, 인덱스를 안 건드리고 쿼리 트래픽을 크기 간 이동.
- **교체 가능 쿼리 인코더.** Qdrant Constella 연구 프리뷰(2026-09-29)는 고정 Stella(400M) 문서 인덱스를 유지하고 쿼리 인코더를 교체. Constella Nano(34.5M)는 Stella의 BEIR-15 nDCG@10의 약 91%(0.5081 vs 0.5614)를 12배 낮은 CPU 지연(3.1ms vs 39.0ms)으로; Constella Zero(트랜스포머 없는 토큰 룩업)는 0.081ms에 0.4572(벤더 연구 프리뷰).

제약: 공유 공간은 벤더 정의다. Voyage 인덱스와 Cohere 쿼리 인코더를 섞을 수 없고, 프리뷰 모델(pplx-embed-v2-context-9b-preview)은 벡터가 이후 릴리스와 비호환이라 명시 경고.

---

## 멀티모달 임베딩

텍스트 전용 RAG는 흔히 답을 쥔 차트·표·다이어그램·레이아웃 신호를 조용히 버린다. 현대 스택은 페이지·스크린샷·그림을 일급 검색 객체로 다룬다:

- **통합 비전-텍스트 임베딩**: Cohere Embed 5, voyage-multimodal-3.5, gemini-embedding-2 각각 이미지·텍스트를 단일 벡터 공간에 매핑, "비상 차단 밸브는 어디?"를 도면에 쿼리 가능. ViDoRe V3에서 Cohere는 Embed 5 Pro 85.8, Fast 84.5, voyage-4-large 83.7, Gemini Embedding 2 83.2, text-embedding-3-large 75.5 보고(벤더). voyage-multimodal-3.5·gemini-embedding-2는 같은 공간에서 영상도, gemini-embedding-2는 오디오도.
- **레이트 인터랙션의 페이지-이미지**: ColPali, ColQwen2.5, ColNomic이 각 페이지 렌더를 직접 임베딩, 취약한 OCR을 건너뛰고 시각 계층 보존.
- **CLIP 계열 모델**: 텍스트-이미지 정렬이 핵심 신호인 이미지 중심 카탈로그(이커머스, 미디어)에 여전히 유용.

---

## 면접 질문

### Q: 임베딩의 "어휘 불일치" 문제란?

**좋은 답변:**
임베딩은 학습 중 배운 의미 공간에 의존한다. 사용자 쿼리가 임베딩 모델 학습셋에 없던 신조어(예: 임베딩 모델 컷오프 후 출시된 모델명)를 쓰면, 모델이 일반 "AI" 벡터를 할당해 특정 뉘앙스를 놓칠 수 있다. 표준 해법은 **하이브리드 검색**(BM25로 특정 키워드 포착) + **크로스 인코더 재순위**로, 쿼리·문서 토큰을 동시에 봐 분포 밖 어휘를 더 잘 다룬다.

### Q: 10억 벡터 인덱스에 왜 마트료시카 모델을 고르나?

**좋은 답변:**
표준 `float32` 1536차원 임베딩으로 10억 벡터로 확장하려면 HNSW 인덱스에 약 6TB 고속 RAM이 필요해 금지적으로 비싸다. 마트료시카 모델로는 1차 검색에 앞 128차원(바이너리 양자화)을 쓸 수 있다. 메모리 풋프린트를 90% 넘게 줄여 "상위 1,000" 후보를 훨씬 싼 하드웨어에서 찾는다. 그다음 그 1,000개만 전해상도 벡터를 가져와 최종 재순위를 수행한다.

### Q: 5억 벡터 인덱스의 임베딩 모델을 무중단으로 업그레이드하려면?

**좋은 답변:**
먼저 전체 재임베딩이 정말 필요한지 결정:
1. **같은 공유 공간 계열**(Voyage 4 크기, Cohere Embed 5 Pro·Fast): 재인덱스 없음. 쿼리 트래픽을 새 크기로 옮기고 A/B.
2. **다른 모델**: 전체 재임베딩. 500토큰 5억 청크면 2,500억 토큰, 배치 할인 전 1M당 $0.12로 약 $30,000, 더해 인덱스 쓰기 부하. 설정 변경이 아니라 마이그레이션으로 예산화.

재임베딩 자체엔 **듀얼 라이트 → 백필 → 섀도 리드 → 컷오버**: 새 쓰기는 두 벡터 필드에, 백그라운드 작업이 오래된 것부터 새 필드 백필, 섀도 경로가 새 필드를 쿼리해 골든셋 대비 recall@k 로깅, 새 필드가 옛 것을 맞먹거나 이기면 테넌트별로 트래픽 전환. 엔진이 이제 쉽게 함: Milvus 3.0은 컬럼을 온라인 추가·백필하니 새 임베딩이 또 하나의 필드. 롤백 윈도가 닫힐 때까지 옛 필드 유지.

DB가 대신 임베딩하면(MongoDB Atlas Automated Embedding, turbopuffer 네이티브 임베딩, Elasticsearch `semantic_text`) 동기 파이프라인은 잃으나 벤더가 모델 버전을 통제하니, 커밋 전 모델 변경 시 재임베딩 처리를 확인하라.

---

## 참고 문헌
- Kusupati et al. "Matryoshka Representation Learning" (2022/2024 갱신)
- Khattab and Zaharia. "ColBERT..." (2020); Santhanam et al. "ColBERTv2..." (2022)
- OpenAI. "New embedding models and API updates" (2024-01)
- [Google. Gemini Embedding 2 model page](https://ai.google.dev/gemini-api/docs/models/gemini-embedding-2)
- [Cohere. "Embed 5" (2026-09)](https://cohere.com/blog/embed-5)
- [Voyage AI. "voyage-4" (2026-01)](https://blog.voyageai.com/2026/01/15/voyage-4/), ["voyage-code-4" (2026-08)](https://blog.voyageai.com/2026/08/13/voyage-code-4/)
- [NVIDIA. Nemotron 3 Embed 8B model card](https://huggingface.co/nvidia/Nemotron-3-Embed-8B-BF16)
- ["The Embedder's Dilemma" (arXiv 2608.12875, 2026-08)](https://arxiv.org/abs/2608.12875)

---

*이전: [청킹 전략](02-chunking-strategies.md) | 다음: [벡터 데이터베이스](04-vector-databases.md)*
