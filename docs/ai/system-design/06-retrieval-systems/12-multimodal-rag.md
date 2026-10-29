---
title: 멀티모달 RAG
sidebar_position: 12
description: 텍스트를 넘어 이미지·표·차트·오디오·혼합 레이아웃 문서를 다루는 RAG — 아키텍처 패턴, 멀티모달 임베딩, 문서 이해용 VLM, ColPali, 표 추출, 차트 이해, 영상(고정 샘플링 vs 에이전트 처리).
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/12-multimodal-rag.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 멀티모달 RAG

멀티모달 RAG는 검색 증강 생성을 평문 텍스트를 넘어 이미지·표·차트·오디오·혼합 레이아웃 문서까지 확장한다. 프로덕션 시스템은 이제 다이어그램 있는 PDF, 슬라이드 덱, 스캔 인보이스, 시각 레이아웃이 *곧 의미*인 연구 논문을 일상적으로 수집한다. 세 아키텍처가 지배: 캡션-인덱스, 통합 비전-텍스트 임베딩(Cohere Embed 5, Voyage-Multimodal-3.5, Gemini Embedding 2), 레이트 인터랙션의 페이지-이미지(ColPali, ColQwen2.5, ColNomic). 영상은 모델이 모든 프레임을 샘플링하는 대신 어느 세그먼트를 볼지 고를 수 있게 되며 자기 비용 모델을 가진 가장 새 양식.

## 텍스트 전용 RAG가 실패하는 이유

전통 RAG 파이프라인은 문서를 텍스트 청크로 파싱·임베딩하고 텍스트 쿼리에 검색한다. 실제 문서에선 깨진다:

| 문서 요소 | 텍스트 전용 RAG 거동 | 실제로 잃는 정보 |
|-----------------|----------------------|------------------------|
| **막대 차트** | 축 라벨만 추출 | 추세·비교·크기 |
| **아키텍처 다이어그램** | 완전히 놓침 | 구성요소 관계·데이터 흐름 |
| **표** | 평탄화된 행이 구조 잃음 | 행-열 연관·헤더 |
| **인포그래픽** | 흩어진 텍스트 파편 포착 | 시각 계층·공간 그룹핑 |
| **캡션 있는 사진** | 캡션 얻고 이미지 잃음 | 시각 증거·공간 문맥 |

**현실**: 엔터프라이즈 문서의 40-60%가 비텍스트 콘텐츠. 재무 보고서 가치는 차트에, 의학 논문 핵심 발견은 그림에 있다. 시각 콘텐츠 무시는 지식 대부분을 무시하는 것.

---

## 아키텍처 패턴

멀티모달 RAG엔 세 지배 패턴, 각각 뚜렷한 트레이드오프:

### 패턴 1: 통합 임베딩 공간

```
                     Shared Vector Space
                    +-------------------+
  Text  --> Encoder |  [0.2, 0.8, ...] |
  Image --> Encoder |  [0.3, 0.7, ...] |  --> Single Index --> Retrieve
  Table --> Encoder |  [0.1, 0.9, ...] |
                    +-------------------+

  Query "show revenue trends" --> encode --> nearest neighbors across ALL modalities
```

- **방법**: 자연 이미지엔 CLIP·SigLIP, 페이지·슬라이드·스크린샷엔 문서급 멀티모달 임베더(Cohere Embed 5, Gemini Embedding 2, Voyage Multimodal)로 텍스트·이미지를 같은 벡터 공간에 투영.
- **장점**: 단일 인덱스, 단일 쿼리, 단순 검색 로직.
- **단점**: 임베딩 품질이 양식마다 다름; 표는 직렬화 필요.

### 패턴 2: 양식별 검색 + 융합

```
  Query --> +----> Text Index    --> Top-K text chunks
            |
            +----> Image Index   --> Top-K images
            |
            +----> Table Index   --> Top-K tables
            |
            v
        Fusion / Reranking Layer --> Combined Top-K --> VLM Generator
```

- **방법**: 양식별 별도 임베딩·인덱스. 재순위기나 RRF가 결과 병합.
- **장점**: 양식별 최고 임베딩; 각 검색기 독립 튜닝.
- **단점**: 인프라 복잡도 증가; 융합 로직이 사소치 않음.

### 패턴 3: 비전 우선(페이지-이미지)

```
  Document Page --> Screenshot/Render --> Vision Encoder --> Multi-vector Index
                                              |
  Query ---------> Text Encoder --------------+---> Late Interaction Score
                                                    --> Retrieve top pages
```

- **방법**: 모든 문서 페이지를 이미지로. VLM(예: ColPali)으로 패치 수준 임베딩 생성. 레이트 인터랙션(MaxSim)으로 점수.
- **장점**: OCR 없음, 레이아웃 파싱 없음, 표 추출 파이프라인 없음. 종단 학습 가능.
- **단점**: 인덱싱 시 높은 컴퓨트; 세밀 텍스트 검색 잃음.

**권고**: 패턴 3(비전 우선)이 문서 중심 사용처에 빠르게 부상. 패턴 2는 시각 검색과 함께 정밀 텍스트 검색이 필요할 때 프로덕션 주력으로 남음.

---

## 멀티모달 임베딩 전략

### CLIP(대조 언어-이미지 사전학습)

텍스트·이미지를 공유 512/768차원 공간에 매핑하는 원조 듀얼 인코더.

- **강점**: 거대 생태계, 잘 이해됨, 많은 파인튜닝 변형.
- **약점**: 자연 사진보다 문서형 이미지(차트·표)에 약함. 대조 손실이 큰 배치 크기 요구.

### SigLIP / SigLIP 2

CLIP의 소프트맥스 교차 엔트로피를 시그모이드 손실로 대체, 각 이미지-텍스트 쌍 독립 평가.

- **SigLIP 2(2025)**: 캡셔닝 디코더, 자기 증류, 마스크 예측 추가. 109개 언어 100억+ 이미지 학습.
- **핵심 승리**: 작은 배치(4-8k)에서 CLIP 능가, 더 조밀·강건한 특성.
- **프로덕션 사용**: 노르웨이 국립도서관, 이커머스 시각 검색, AI 아트 큐레이션.

### RAG용 비교

| 모델 | 적합 | 임베딩 차원 | 문서 품질 | 자연 이미지 품질 |
|-------|----------|--------------|-----------------|----------------------|
| CLIP ViT-L/14 | 범용 | 768 | 중간 | 높음 |
| SigLIP 2 So400m | 다국어 문서 | 1152 | 높음 | 높음 |
| Nomic Embed Vision | 텍스트 중심 문서 | 768 | 높음 | 중간 |
| Voyage Multimodal 3.5 | 혼합 문서; 텍스트·이미지·영상 | 256-2048(기본 1024) | 높음 | 높음 |
| Cohere embed-v5.0-pro/-fast | 시각 풍부 엔터프라이즈 문서; 텍스트·이미지·융합 입력 | 256-2048(마트료시카) | 높음: ViDoRe V3 85.8/84.5(벤더) | 미보고 |
| Gemini Embedding 2 | 텍스트·이미지·영상·오디오·PDF 한 공간 | 128-3072(768/1536/3072 권장) | 높음: ViDoRe V3 83.2(Cohere 벤더 표) | 미보고 |

**2026년 바뀐 것**: 호스팅 멀티모달 임베더 둘이 별도 이미지 모델 없이 "통합 공간" 패턴 커버.
- **Gemini Embedding 2**(`gemini-embedding-2`, 3/10 발표, 2026-04부터 안정)는 Google 멀티모달: 텍스트 최대 8,192 토큰, 이미지 최대 6개, 영상 최대 120초, 네이티브 오디오, 입력당 PDF 최대 6페이지, 인터리브 입력 포함. `gemini-embedding-001`은 텍스트 전용, 2028-05-14 종료; Google이 Gemini Embedding 2를 대체로 명명.
- **Cohere Embed 5**(2026-09-30): `embed-v5.0-pro` 1M 텍스트 토큰당 $0.12, `embed-v5.0-fast` $0.08, 1M 이미지 토큰당 $0.40, 128K 문맥. Pro·Fast 한 임베딩 공간 공유, Pro로 인덱싱·Fast로 쿼리를 재인덱스 없이.

Cohere 자체 ViDoRe V3 표는 Embed 5 Pro 85.8, Fast 84.5, voyage-4-large 83.7, Gemini Embedding 2 83.2, OpenAI text-embedding-3-large 75.5. 상위 넷 격차가 3점 미만·벤더 실행이라 선택을 정하지 못함; 자신의 페이지 수준 평가셋이 정함.

### 임베딩 전략 결정

```
Is your content mostly natural images (photos, products)?
  YES --> CLIP or SigLIP fine-tuned on your domain
  NO
    |
    v
Is your content document pages (PDFs, slides, reports)?
  YES --> Baseline: single-vector multimodal embedder (Embed 5,
          Gemini Embedding 2) + reranker. Move to ColPali / ColQwen
          (multi-vector, no OCR) if page-level recall falls short
  NO
    |
    v
Is it a mix of text, images, and structured data?
  YES --> Modality-specific encoders + fusion (Pattern 2)
          or one hosted multimodal embedder (Embed 5, Gemini Embedding 2)
          if a single index matters more than per-modality tuning

Does it include audio or video clips?
  YES --> Gemini Embedding 2 for retrieval (clips up to 120 s per input),
          plus transcripts in the text index for exact-term search
```

---

## 문서 이해용 VLM

VLM은 멀티모달 RAG에서 두 역할: (1) 검색된 멀티모달 문맥에서 답을 합성하는 **생성기**, (2) 수집 시 구조화 정보를 추출하는 **인덱싱 엔진**.

### 문서 이해용 VLM 옵션

프런티어에선 차트 읽기·표 추출·다이어그램 이해가 충분히 비슷해 *자신의* 문서 위 순위는 페이지 믹스에 달림. 설계를 모는 차이는 가격·장문맥 과금·API 거동:

| | Claude Opus 5.5/Sonnet 5.5 | GPT-6 Astra/GPT-6 Sol | Gemini 3.8 Flash |
|---|---|---|---|
| **1M당 가격(입/출)** | $4/$20; $2/$10 | $10/$50; $2/$10 | $0.75/$3.75 도입, 2027-01-01부터 $1.50/$7.50 |
| **문맥** | 1M, 1M까지 균일가 | 1.05M; 272K 입력 초과 시 전체 요청 장문맥 요율 | 입력 1,048,576/출력 65,536 |
| **구조화 출력** | 네이티브(`output_config.format`) | 네이티브 | 네이티브 |
| **주의점** | 사고 항상 켜짐(Opus 5.5)·기본 켜짐(Sonnet 5.5); `content[0]`가 아닌 텍스트 블록 파싱 | OpenAI가 2026-09-25 동일 ID 하 GPT-6 Sol·Luna 이미지 이해 저하 버그 수정: 수정 전 이미지 평가 재실행 | 도입가 12/31 종료; 2027 정가로 예산 |

전문 문서 파서(Cohere Parse, MinerU, jina-ocr-v1, Nemotron Parse 2.0)가 이제 페이지당 프런티어 VLM 비용의 일부로 표·바운딩 박스·읽기 순서의 Markdown 반환. 대량 추출 패스엔 먼저 비교; [OCR과 레이아웃 분석](https://github.com/ombharatiya/ai-system-design-guide/blob/main/10-document-processing/01-ocr-and-layout.md)(영문) 참고.

### VLM 강화 수집 파이프라인

```
  Raw PDF
    |
    v
  Page Renderer (pdf2image, 300 DPI)
    |
    v
  VLM Extraction Pass:
    +-- "Extract all tables as markdown"
    +-- "Describe this chart: axes, trends, key data points"
    +-- "Summarize the diagram: components and relationships"
    |
    v
  Structured Output (JSON)
    |
    +---> Text chunks     --> Text embedding index
    +---> Table markdown  --> Text embedding index (with metadata: "type=table")
    +---> Chart summaries --> Text embedding index (with metadata: "type=chart")
    +---> Page images     --> Image embedding index (CLIP/SigLIP)
```

이 "기술 후 임베딩" 접근은 시각 콘텐츠를 검색 가능 텍스트로 변환하면서 생성 단계용 원본 이미지를 보존.

---

## ColPali와 비전 기반 검색

ColPali는 패러다임 전환: 복잡한 OCR + 레이아웃 + 표 추출 파이프라인을 짓는 대신 각 문서 페이지를 단일 이미지로 다루고 VLM이 전부 처리하게.

### ColPali 작동 방식

```
  Document Page Image
        |
        v
  SigLIP Vision Encoder (So400m)
        |
  Splits image into patches (e.g., 32x32 grid = 1024 patches)
        |
        v
  Gemma 2B Language Model (contextualizes patch embeddings)
        |
        v
  Linear Projection --> 128-dim patch embeddings
        |
  Result: 1024 vectors of dim 128 per page
        |
        v
  Stored in Multi-Vector Index

  At query time:
  Query --> Tokenize --> Embed --> 128-dim token embeddings
        |
        v
  Late Interaction (MaxSim):
    Score = Sum over query tokens of Max similarity to any patch
```

### ColPali vs 전통 파이프라인

| 측면 | 전통 파이프라인 | ColPali |
|--------|---------------------|---------|
| **OCR** | 필요(Tesseract, Azure OCR) | 불필요 |
| **레이아웃 탐지** | 필요(Detectron2, LayoutLM) | 불필요 |
| **표 파서** | 필요(Camelot, Tabula) | 불필요 |
| **차트 추출기** | 필요(ChartOCR) | 불필요 |
| **인덱싱 속도** | 느림(다단계) | 빠름(단일 순전파) |
| **검색 품질** | 텍스트 높음, 시각 빈약 | 모든 양식 높음 |
| **저장** | 텍스트 인덱스(작음) | 멀티벡터 인덱스(큼) |

### ColPali 계열

- **ColPali(v1)**: PaliGemma-3B 백본. 원조.
- **ColQwen2/ColQwen2.5**: Qwen2-VL·Qwen2.5-VL 백본. 더 나은 다국어, 아시아 언어 문서 개선.
- **ColSmol**: 엣지 배포용 작은 변형, 1B 미만.

### ViDoRe 벤치 결과

ColPali는 인포그래픽·그림·표를 각각 테스트하는 InfographicVQA, ArxivQA, TabFQuAD 같은 시각 복잡 벤치에서 뛰어남. 텍스트 중심 문서에서도 전통 텍스트 기반 파이프라인 능가.

ViDoRe는 이후 V3로 이동, 벤더가 이제 단일 벡터 멀티모달 임베더에 인용(위 표). 아키텍처 선택에 중요: ViDoRe V3에서 80점대 중반 점수의 단일 벡터 페이지 임베딩(벤더)이 페이지당 1,024 패치 벡터보다 서빙이 훨씬 싸니, 멀티벡터 인덱스 커밋 전 단일 벡터 멀티모달 임베더 + 재순위기 테스트.

---

## 표 추출과 구조화 데이터 검색

표는 전통 RAG의 가장 어려운 양식. 표를 행별 평탄화하면 각 셀에 의미를 주는 열-헤더 관계가 파괴된다.

### 전략 1: VLM 기반 추출

```python
# Pseudocode: Extract tables using a VLM
def extract_tables_from_page(page_image: bytes) -> list[dict]:
    prompt = """
    Extract ALL tables from this document page.
    For each table, return:
    {
      "title": "table title or caption",
      "headers": ["col1", "col2", ...],
      "rows": [["val1", "val2", ...], ...],
      "markdown": "| col1 | col2 |\\n|---|---|\\n| val1 | val2 |"
    }
    Return JSON array. If no tables, return [].
    """
    response = vlm.generate(image=page_image, prompt=prompt)
    return json.loads(response)
```

### 전략 2: 전문 표 파서

- **Tabula/Camelot**: 규칙 기반 PDF 표 추출. 빠르나 복잡 레이아웃에 취약.
- **Table Transformer(DETR 기반)**: 이미지에서 표 경계·셀 구조 탐지.
- **Unstructured.io**: 휴리스틱과 ML 모델로 레이아웃 인식 파싱.
- **문서 파싱 VLM**(Cohere Parse, MinerU 4.0, 플러그형 VLM 백엔드의 Docling): 표를 HTML·Markdown으로 바운딩 박스·읽기 순서와 함께 인라인 방출, 표-페이지 인용 유지. [OCR과 레이아웃 분석](https://github.com/ombharatiya/ai-system-design-guide/blob/main/10-document-processing/01-ocr-and-layout.md)(영문) 참고.

### 전략 3: 표 인식 청킹

```
  Original Table (20 rows x 8 columns)
        |
        v
  Chunk as complete unit (do NOT split tables across chunks)
        |
        v
  Embed the full markdown table as a single chunk
        |
        v
  Add metadata: {"type": "table", "page": 14, "caption": "Q3 Revenue by Region"}
        |
        v
  At generation time: pass the FULL table to the LLM, not a fragment
```

**핵심 원칙**: 표는 원자적 검색 단위여야. 절대 청크 경계로 표를 분할 말 것.

---

## 차트와 다이어그램 이해

### 차트 유형과 추출 접근

| 차트 유형 | 추출할 것 | 최선 접근 |
|-----------|----------------|---------------|
| **막대/선/파이** | 데이터 값, 추세, 비교 | VLM 기술 + 데이터 표 추출 |
| **플로우 다이어그램** | 단계, 결정, 연결 | VLM 구조화 추출(노드+엣지) |
| **아키텍처 다이어그램** | 구성요소, 관계, 데이터 흐름 | VLM 기술 + 엔티티 추출 |
| **산점도** | 상관, 이상치, 클러스터 | VLM 추세 기술 + 가용 시 원시 데이터 |
| **간트 차트** | 타임라인, 의존, 마일스톤 | VLM 구조화 추출 |

### 이중 표현 전략

각 차트·다이어그램에 두 표현 저장:

```
  Chart Image
    |
    +---> (1) Text Description (for text-based retrieval)
    |         "This bar chart shows Q3 revenue by region.
    |          North America: $4.2M, Europe: $3.1M, APAC: $2.8M.
    |          NA grew 15% QoQ while APAC declined 3%."
    |
    +---> (2) Original Image (for visual retrieval + generation context)
              Stored with CLIP/SigLIP embedding for image-based queries
```

이로써 차트가 텍스트 쿼리("APAC 매출은?")와 시각 쿼리("매출 차트 보여줘") 모두로 검색 가능.

---

## 영상: 고정 샘플링 vs 에이전트 처리

영상 RAG 비용 모델은 단순 산술이었다: 길이 x 프레임레이트 x 프레임당 토큰. Gemini 기본 정적 처리는 1 FPS 샘플링, 기본(낮은) 미디어 해상도에서 영상 초당 약 100 토큰이라 1시간이 약 36만 토큰, Gemini 3.8 Flash 도입가로 입력 약 $0.27($0.54 2027 정가). 1M 문맥 모델이 낮은 해상도로 최대 약 3시간, 높은 해상도로 1시간.

2026-09-01 Google이 Gemini 3.7 Flash·3.6 Flash·3.5 Flash-Lite에 **에이전트 영상 처리**를 추가, 문서는 이제 Gemini 3.8 Flash도 나열: 영상 입력에 `"processing": "agentic"` 설정 시 모델이 내부 영상 도구로 어느 세그먼트를 어떤 속도로 어떤 양식(프레임·오디오·전사)으로 검사할지 결정. 옵트인(정적 1 FPS 기본 유지), 업로드·YouTube URL 작동, 기능 요금 없이 표준 토큰가 과금. Google은 표준 영상 벤치에서 토큰 최대 88% 감소, 비용 최대 66% 감소, 정확도 최대 7% 상승, 가장 큰 이득은 장편 영상 보고(벤더).

```
STATIC (default):   video ──► every frame at 1 FPS + audio ──► context ──► answer
                    cost scales with duration

AGENTIC (opt-in):   video + question ──► model picks segments, speed, modality
                                         (frames / audio / transcript) ──► answer
                    cost scales with how much of the video the question needs
```

설계 함의:
- **시간당이 아니라 질문 유형별 예산.** "끝에 무슨 일?"은 "모든 안전 위반 나열"보다 훨씬 적은 영상에 닿는다. 쿼리 클래스별 실제 토큰을 쿼터 설정 전 측정, 최대 88% 절감은 대개 긴 영상에서.
- **단일 영상 QA엔 검색이 모델 안으로 이동.** 에이전트 처리가 질문이 한 영상을 겨냥할 때 자체 장면 탐지·키프레임 샘플링·전사 청킹을 대체. 라이브러리 검색엔 여전히 인덱스 필요: 전사·장면 캡션을 텍스트 인덱스에, 짧은 클립(입력당 최대 120초)을 Gemini Embedding 2로 임베딩, 상위 영상을 모델에.
- **정확도만이 아니라 커버리지 평가.** 모델이 볼 걸 고르니 타임스탬프 인용을 요청하고 샘플 쿼리에서 출처 대조; 틀린 세그먼트로 지은 자신 있는 답이 영상판 검색 미스.

---

## 프로덕션 아키텍처

### 전체 멀티모달 RAG 파이프라인

```
  INGESTION:
  Raw Docs --> Doc Classifier --+--> Text-Heavy  --> chunking + text embeddings
                                +--> Visual-Heavy --> page render + ColPali
                                +--> Mixed        --> VLM extraction + hybrid
                                         |
                                         v
                          [Text Index] [Image Index] [Table Index]

  RETRIEVAL:
  Query --> Query Analyzer --+--> Text:  BM25 + dense search
                             +--> Image: CLIP/ColPali search
                             +--> Table: metadata-filtered dense
                                    |
                                    v
                             Cross-Modal Reranker --> Context Assembly --> VLM --> Response
```

### 확장 고려사항

| 관심사 | 해법 |
|---------|----------|
| **인덱스 크기** | ColPali는 페이지당 약 1024 벡터. 100만 페이지 = 약 10억 벡터. 양자화(바이너리·PQ), 후보 생성용 MUVERA식 단일 벡터 인코딩(Milvus 3.0; Weaviate 1.31+, 1.40 RC의 디스크 HFresh), 또는 페이지당 더 적은 벡터([레이트 인터랙션과 ColBERT](11-late-interaction-colbert.md) 참고) 사용. |
| **수집 지연** | 프런티어 VLM 추출 느림(페이지당 약 2-5초). 전문 파서 더 빠름: jina-ocr-v1이 A100 1개 동시성 32에서 초당 2.57페이지; Cohere Parse가 GPU당 초당 4.5페이지 보고(둘 다 벤더). 비동기 워커 사용. |
| **쿼리 지연** | 다중 인덱스 팬아웃이 지연 추가. 병렬 검색 + 공격적 top-k 가지치기. |
| **비용** | 수집은 일회성; 쿼리 볼륨에 분산. 2026-10 정가, 페이지당 약 1.7K 입력·800 출력 가정: Gemini 3.8 Flash(도입가) 페이지당 약 $0.004, Claude Sonnet 5.5·GPT-6 Sol 약 $0.011, 추론 토큰 전; Batch API가 둘 다 반감. Cohere Parse 1,000페이지당 $1.50. |
| **저장** | 페이지 이미지는 오브젝트 스토리지(S3). 임베딩은 벡터 DB. 텍스트는 검색 인덱스. |

---

## 구현 예시

### ColPali + VLM 종단 멀티모달 RAG

```python
# Pseudocode: Production multi-modal RAG pipeline

import uuid
from colpali_engine import ColPali, ColPaliProcessor
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue
import anthropic

# --- INDEXING ---

def index_document(pdf_path: str, collection: str):
    """Index a PDF document using ColPali for visual retrieval
    and VLM extraction for text-based retrieval."""

    pages = render_pdf_to_images(pdf_path, dpi=300)

    colpali_model = ColPali.from_pretrained("vidore/colpali-v1.3")
    processor = ColPaliProcessor.from_pretrained("vidore/colpali-v1.3")
    vlm_client = anthropic.Anthropic()

    for page_num, page_image in enumerate(pages):
        # 1. Generate ColPali multi-vector embeddings
        inputs = processor(images=[page_image])
        patch_embeddings = colpali_model(**inputs)  # shape: [1, 1024, 128]

        # 2. Extract structured content via VLM
        extraction = vlm_client.messages.create(
            model="claude-sonnet-5-5",
            max_tokens=16000,                  # thinking is on by default; leave headroom
            output_config={"effort": "low"},   # transcription, not reasoning
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": encode_image(page_image)},
                    {"type": "text", "text": """Extract from this page:
                    1. All text content (preserve structure)
                    2. Tables as markdown
                    3. Chart descriptions with data points
                    Return as JSON with keys: text, tables, charts"""}
                ]
            }]
        )

        # Current Claude models return thinking blocks before the text block,
        # so content[0] is not the answer. Read the text block explicitly.
        text = next(b.text for b in extraction.content if b.type == "text")
        structured = json.loads(text)

        # 3. Store in vector DB
        qdrant.upsert(collection, points=[
            # ColPali multi-vector for visual retrieval
            PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"{pdf_path}#page={page_num}")),
                vector={"colpali": patch_embeddings[0].tolist()},
                payload={
                    "source": pdf_path,
                    "page": page_num,
                    "type": "page_image",
                    "text_preview": structured["text"][:500]
                }
            ),
            # Text embeddings for each extracted element
            *create_text_chunks(structured, pdf_path, page_num)
        ])


# --- RETRIEVAL ---

def retrieve(query: str, collection: str, top_k: int = 5):
    """Hybrid retrieval: ColPali visual + text semantic search."""

    # Visual retrieval via ColPali
    query_inputs = processor(text=[query])
    query_embeddings = colpali_model(**query_inputs)

    # query_points (Query API) replaces the legacy search endpoints,
    # which Qdrant 1.19 removed from its OpenAPI schema
    visual_results = qdrant.query_points(
        collection,
        query=query_embeddings[0].tolist(),  # multi-vector query, MaxSim scoring
        using="colpali",
        query_filter=Filter(must=[
            FieldCondition(key="type", match=MatchValue(value="page_image"))
        ]),
        limit=top_k,
    ).points

    # Text retrieval via dense embeddings
    text_embedding = text_encoder.encode(query)
    text_results = qdrant.query_points(
        collection,
        query=text_embedding.tolist(),
        using="text",
        limit=top_k,
    ).points

    # Fuse results using reciprocal rank fusion
    fused = reciprocal_rank_fusion(visual_results, text_results, k=60)
    return fused[:top_k]


# --- GENERATION ---

def generate_answer(query: str, retrieved_context: list) -> str:
    """Generate answer using VLM with multi-modal context."""

    content_blocks = [{"type": "text", "text": f"Question: {query}\n\nContext:"}]

    for ctx in retrieved_context:
        if ctx.payload["type"] == "page_image":
            # Include the actual page image
            content_blocks.append({
                "type": "image",
                "source": load_page_image(ctx.payload["source"], ctx.payload["page"])
            })
        else:
            # Include text/table content
            content_blocks.append({
                "type": "text",
                "text": f"[{ctx.payload['type']}] {ctx.payload['content']}"
            })

    content_blocks.append({
        "type": "text",
        "text": "Answer the question using ONLY the provided context. Cite sources."
    })

    response = vlm_client.messages.create(
        model="claude-sonnet-5-5",
        max_tokens=16000,
        output_config={"effort": "medium"},
        messages=[{"role": "user", "content": content_blocks}]
    )
    return next(b.text for b in response.content if b.type == "text")
```

---

## 시스템 디자인 면접 관점

### Q: 텍스트·표·차트가 든 실적 보고서에 답해야 하는 금융 리서치 플랫폼용 RAG 시스템을 설계하라.

**좋은 답변:**

핵심 과제는 실적 보고서 정보의 60%+가 산문이 아니라 표·차트에 산다는 것. 텍스트 전용 RAG는 매출 분해, 추세선, 비교 데이터를 놓친다.

**아키텍처**: 하이브리드(패턴 2 + 패턴 3 요소):

1. **수집**: 각 PDF 페이지를 300 DPI 렌더. VLM 추출 패스로 표를 markdown, 차트를 구조화 기술로. 동시에 각 페이지 이미지에 ColPali 멀티벡터 임베딩 생성.
2. **저장**: 세 인덱스: (a) dense 임베딩 텍스트 청크(금융 텍스트), (b) 표 유형 메타데이터 필터 + dense 임베딩 표 markdown, (c) 페이지 수준 시각 검색용 ColPali 멀티벡터.
3. **검색**: 쿼리 분석기가 유형 분류. "Q3 매출은?"은 텍스트+표 검색, "매출 추세 보여줘"는 시각(ColPali). 결과를 RRF 융합하고 멀티모달 재순위기(Qwen3-VL-Reranker-2B/8B가 오픈 가중치 옵션: Apache 2.0, 32K 문맥)로 재순위해 페이지 이미지·표 텍스트가 한 스케일에서 경쟁.
4. **생성**: VLM(Claude·Gemini)이 융합 문맥(텍스트 청크·표 markdown·관련 페이지 이미지)을 받아 특정 페이지·표 인용의 접지 답 생성.

**핵심 트레이드오프**: ColPali는 시각 콘텐츠에 뛰어난 재현율이나 페이지당 약 1,024 벡터라 10만 문서(50만 페이지)면 약 5억 벡터. 작은 재현율 손실을 수용하며 바이너리 양자화로 저장 32배 감소, 또는 벡터 DB가 지원하면 MUVERA식 후보 생성. 멀티벡터 커밋 전 단일 벡터 멀티모달 임베더(Cohere Embed 5·Gemini Embedding 2) + 재순위기를 평가셋에 A/B: 5억 대신 50만 벡터. 텍스트 경로엔 BM25+dense 하이브리드가 금융 용어 잘 처리.

**수집 비용**(2026-10 정가, 페이지당 약 1.7K 입력·800 출력): 50만 페이지에 Gemini 3.8 Flash 도입가 약 $2,000, Claude Sonnet 5.5·GPT-6 Sol 추론 토큰 전 약 $5,700, Cohere Parse 1,000페이지당 $1.50로 $750. Batch API가 VLM 수치 반감. 페이지 라우팅: 텍스트·표 페이지엔 전문 파서, 기술이 중요한 차트 중심 페이지에만 프런티어 VLM.

### Q: 서로 다른 페이지의 차트와 표 둘 다에서 정보가 필요한 쿼리를 어떻게 다루나?

**좋은 답변:**

이는 교차 양식·교차 페이지 검색 문제. 해법 세 부분:

1. **검색 다양성**: 검색기가 여러 양식 결과를 반환하게. 최소 쿼터 설정: 어느 양식이 최고점이든 모든 검색 집합에 텍스트 2개+표 2개+시각 1개 이상.
2. **문맥 조립**: VLM 프롬프트 조립 시 명시 출처와 함께 모든 검색 콘텐츠 포함: "[14페이지 표: Q3 지역별 매출]", "[22페이지 차트: 2024-2026 매출 추세]". VLM이 둘을 넘나들며 추론 가능.
3. **에이전트 폴백**: 초기 검색이 교차 양식 문맥을 충분히 못 내면 에이전트 계층이 후속 검색: "표는 매출 수치를 보이나 사용자가 추세를 물었으니 매출 관련 차트도 검색."

핵심 통찰은 교차 양식 질문이 본질적으로 멀티홉이라는 것. 시스템이 한 양식에서 검색하고 간극을 인지하고 다른 양식에서 검색해야.

### Q: 사용자가 1만 시간 학습 영상 라이브러리에 질문하려 한다. 어떻게 설계·비용 산정하나?

**좋은 답변:**

라이브러리 검색과 단일 영상 이해를 분리 — 후자만 모델 자체 영상 도구를 쓸 수 있으니.

1. **한 번 인덱스.** 질문마다 모든 영상 처리는 불가: 초당 약 100 토큰이면 라이브러리가 전체 패스당 약 36억 토큰. 대신 한 번 전사(60만 분을 `gpt-transcribe` 분당 $0.0045로 약 $2,700), 전사·장면 캡션을 하이브리드 BM25+dense 인덱스에, 시각 쿼리엔 짧은 클립(입력당 최대 120초)을 Gemini Embedding 2로 임베딩.
2. **검색 후 시청.** 검색이 타임스탬프와 함께 상위 영상 반환. 그것만 Gemini 3.8 Flash로. 정적 1 FPS 전체 1시간이 약 36만 토큰(도입가 입력 약 $0.27); `"processing": "agentic"`으로 모델이 어느 세그먼트 검사할지 결정, Google은 장편 영상 토큰 최대 88% 감소 보고(벤더).
3. **쿼리 클래스별 비용.** 에이전트 토큰 사용이 질문에 달리니 파일럿 중 쿼리 유형별 측정, 길이가 아닌 측정 분포로 쿼터 설정.
4. **접지 평가.** 타임스탬프 인용 요구·대조 — 실패 모드가 틀린 세그먼트의 유창한 답이니.

---

## 참고 문헌

- Faysse et al. "ColPali..." (ICLR 2025)
- Google. "SigLIP 2..." (2025)
- NVIDIA. "An Easy Introduction to Multimodal RAG" (2025)
- HKUDS. "RAG-Anything..." (2025)
- Vespa Blog. "PDF Retrieval with Vision Language Models" (2024)
- Google. "Gemini Embedding 2" (2026-03), "Introducing agentic video in Gemini" (2026-09)
- Google. Gemini API video understanding documentation (2026-10 접근)
- Cohere. "Embed 5" (2026-09)

---

*이전: [레이트 인터랙션과 ColBERT](11-late-interaction-colbert.md) | 다음: [RAG 평가 패턴](13-rag-evaluation-patterns.md)*
