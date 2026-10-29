---
title: RAG 평가 패턴
sidebar_position: 13
description: RAG에서 가장 어려운 미해결 문제인 평가 — RAG 삼요소, RAGAS, 구성요소 수준 평가, LLM-as-Judge, 골든 테스트셋 구축, 자동 회귀 테스트, 프로덕션 모니터링, 대규모 평가 비용.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/13-rag-evaluation-patterns.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09). 코드·다이어그램은 원문 그대로 유지합니다.
:::

# RAG 평가 패턴

평가는 RAG에서 가장 어려운 미해결 문제다. 검색 파이프라인은 하루에 지을 수 있으나, 그게 실제로 작동하는지 아는 데는 몇 주가 걸린다. 업계는 계층형 평가 전략으로 수렴했다: 정확성엔 RAG 삼요소, 디버깅엔 구성요소 수준 지표, 프로덕션 안전엔 자동 회귀 테스트. Langfuse·LangWatch·Braintrust·Arize Phoenix 모두 네이티브 RAG 평가 레시피 제공; 배포 모델(자체 호스팅 vs SaaS)과 평가 게이트 CI/CD 차단 필요 여부로 고르라.

## RAG 삼요소

RAG 삼요소는 RAG 시스템 평가의 기초 프레임워크. 정확성을 세 독립 차원으로 분해, 각각 다른 실패 모드를 잡는다.

```
                          User Query
                              |
                              v
                    +-------------------+
                    |    RETRIEVER      |
                    +-------------------+
                              |
                   (1) Context Relevance
                    "Did we retrieve the
                     right documents?"
                              |
                              v
                    +-------------------+
                    |    GENERATOR      |
                    +-------------------+
                         /         \
            (2) Groundedness      (3) Answer Relevance
            "Is the answer         "Does the answer
             supported by           address the actual
             the context?"          question?"
                  |                       |
                  v                       v
             No hallucination       No tangential answers
```

### 차원 1: 문맥 관련성

**질문**: 검색된 각 청크가 실제로 사용자 쿼리에 관련되나?
**잡는 것**: 나쁜 검색. 벡터 검색이 잘못된 주제 문서를 반환했거나 쿼리가 모호해 검색기가 잘못 추측.
**측정법**: 각 검색 청크에 "이 청크가 쿼리 답에 관련?" 질문. 점수: (관련 청크 수)/(총 검색 청크). 0.3이면 검색 문맥의 70%가 노이즈라 LLM이 무관한 건초 속 바늘을 찾아야.
**중요성**: 낮은 문맥 관련성이 대부분 RAG 실패의 근본 원인. 완벽한 생성기도 무관 문맥에서 좋은 답을 못 낸다.

### 차원 2: 접지성(충실성)

**질문**: 생성 답의 모든 주장이 검색 문맥에 지지되나?
**잡는 것**: 환각. LLM이 그럴듯하나 검색 문서에 없는 주장 생성.
**측정법**: 답을 개별 주장으로 분해. 각 주장에 검색 문맥에서 지지 증거 검색. 점수: (지지 주장 수)/(총 주장). 0.7이면 답의 30%가 환각.
**중요성**: 엔터프라이즈 고객이 가장 신경 쓰는 지표. 불충실 RAG는 RAG 없음보다 나쁘다 — 가짜 인용과 함께 자신 있게 틀린 답을 내기 때문.

### 차원 3: 답 관련성

**질문**: 최종 답이 실제로 사용자가 물은 것에 답하나?
**잡는 것**: 탈선 답. 검색도 좋고 답도 접지됐으나 질문에 답 안 함. 검색기가 관련되나 안 맞는 콘텐츠를 찾을 때 흔함.
**측정법**: 답이 좋은 응답이 될 가설 질문 N개 생성. 이 가설 질문과 원 쿼리 간 의미 유사도 측정. 높은 유사도 = 답이 온토픽.
**중요성**: 시스템이 관련 문맥을 검색하고 충실히 요약해도 질문 요점을 놓칠 수 있다. 답 관련성이 이를 잡는다.

### 삼요소 실패 모드

| 실패 패턴 | 문맥 관련성 | 접지성 | 답 관련성 | 근본 원인 |
|----------------|-------------------|-------------|-----------------|------------|
| 좋은 RAG | 높음 | 높음 | 높음 | 시스템 정상 작동 |
| 나쁜 검색 | **낮음** | 높음 | 낮음 | 임베딩·검색 오구성 |
| 환각 | 높음 | **낮음** | 높음 | LLM이 문맥 무시, 프롬프트 문제 |
| 탈선 답 | 높음 | 높음 | **낮음** | 쿼리 모호, 잘못된 인덱스 |
| 전면 실패 | **낮음** | **낮음** | **낮음** | 근본 파이프라인 문제 |

---

## RAGAS 프레임워크와 지표

RAGAS(검색 증강 생성 평가)는 가장 널리 채택된 오픈소스 RAG 평가 프레임워크로, 정답 없이도 되는 참조 없는 지표 제공.

### 핵심 RAGAS 지표

```
  RAGAS Metric Suite (v0.2+)
  |
  +-- Retrieval Metrics
  |     +-- Context Precision: Are relevant docs ranked higher?
  |     +-- Context Recall: Did we find all relevant docs?
  |     +-- Context Entities Recall: Did we capture key entities?
  |     +-- Context Relevance: Is retrieved context pertinent?
  |
  +-- Generation Metrics
  |     +-- Faithfulness: Are claims supported by context?
  |     +-- Answer Relevance: Does the answer address the query?
  |     +-- Answer Correctness: Does the answer match ground truth?
  |     +-- Answer Similarity: Semantic overlap with reference answer
  |
  +-- Noise & Robustness
  |     +-- Noise Sensitivity: How much does irrelevant context hurt?
  |
  +-- Multi-Modal (2025+)
        +-- Multimodal Faithfulness: Claims supported by images + text?
        +-- Multimodal Relevance: Are retrieved images relevant?
```

### RAGAS 충실성 작동 방식(내부)

```
Step 1: Claim Extraction
  Answer: "Revenue grew 15% in Q3, driven by APAC expansion
           and the new enterprise tier launched in July."

  Claims:
    c1: "Revenue grew 15% in Q3"
    c2: "Growth was driven by APAC expansion"
    c3: "Growth was driven by the new enterprise tier"
    c4: "The enterprise tier was launched in July"

Step 2: Evidence Matching (per claim)
  c1: Found in Context chunk 3 --> SUPPORTED
  c2: Found in Context chunk 1 --> SUPPORTED
  c3: Not found in any context --> UNSUPPORTED
  c4: Context says "August" not "July" --> CONTRADICTED

Step 3: Score Calculation
  Faithfulness = supported / total = 2/4 = 0.50
```

### RAGAS 문맥 정밀도 작동 방식

```
  Retrieved chunks ranked by retriever score:
    Rank 1: Chunk about Q3 revenue    --> Relevant (v_1 = 1)
    Rank 2: Chunk about company history --> Not relevant (v_2 = 0)
    Rank 3: Chunk about Q3 expenses   --> Relevant (v_3 = 1)
    Rank 4: Chunk about office locations --> Not relevant (v_4 = 0)

  Context Precision@K:
    Precision@1 = 1/1 = 1.0
    Precision@2 = 1/2 = 0.5
    Precision@3 = 2/3 = 0.67
    Precision@4 = 2/4 = 0.5

  Average Precision = (1.0*1 + 0.5*0 + 0.67*1 + 0.5*0) / 2
                    = (1.0 + 0.67) / 2 = 0.835
```

### RAGAS vs 정답 지표

| 지표 | 정답 필요? | 측정 대상 |
|--------|-------------------|------------------|
| 충실성 | 아니오 | 문맥에 지지된 주장 |
| 문맥 관련성 | 아니오 | 검색 청크 관련성 |
| 답 관련성 | 아니오 | 답이 쿼리에 답함 |
| 문맥 재현율 | **예** | 참조 답 커버리지 |
| 답 정확성 | **예** | 참조 답 일치 |
| 답 유사도 | **예** | 참조와 의미 겹침 |

**통찰**: 빠른 반복엔 참조 없는 지표(충실성·문맥 관련성·답 관련성)로 시작. 회귀 테스트용 골든셋이 생기면 정답 지표 추가.

---

## 구성요소 수준 평가

RAG 삼요소는 시스템을 종단 평가. 구성요소 수준 평가는 각 단계를 격리해 실패를 짚는다.

### 검색기 평가

```
  Query Set (100+ queries with known relevant documents)
        |
        v
  Run Retriever --> Retrieved docs per query
        |
        v
  Compare against ground truth relevance labels
        |
        v
  Metrics:
    +-- Recall@K: What fraction of relevant docs are in the top K?
    +-- MRR (Mean Reciprocal Rank): How high is the first relevant doc?
    +-- NDCG@K: Quality-weighted ranking metric
    +-- Precision@K: What fraction of top K are relevant?
```

**핵심 검색기 벤치마크**:

| 지표 | 최소 임계 | 좋음 | 뛰어남 |
|--------|------------------|------|-----------|
| Recall@10 | 0.70 | 0.85 | 0.95+ |
| MRR | 0.50 | 0.70 | 0.85+ |
| NDCG@10 | 0.50 | 0.70 | 0.85+ |
| Precision@5 | 0.40 | 0.60 | 0.80+ |

### 임베더를 인덱스에서 분리하라

검색 미스엔 두 소유자가 가능하고 다른 테스트가 필요:

| 질문 | 지표 | 정답 | 실패 시 고침 |
|----------|--------|--------------|-----------------|
| **임베더**가 옳은 청크를 높이 순위했나? | **정확**(브루트포스) kNN의 Recall@K | 인간 관련성 라벨 | 모델, 청킹, 문맥화 |
| **ANN 인덱스**가 정확 kNN이 반환할 걸 반환했나? | 정확 kNN 대비 ANN recall@K | 정확 이웃, 라벨 불필요 | 인덱스 파라미터(`ef`, probes), 양자화, 재점수 |

같은 쿼리에 둘 다 실행. 정확 kNN 재현율이 괜찮고 ANN 재현율이 0.85면 임베딩 업그레이드가 안 도움. 양자화가 이 테스트를 필수로: 벡터 DB가 2026년 추가한 1-4비트 회전 방식(Qdrant TurboQuant·Turbo4, Weaviate 4비트 RQ 프리뷰)이 재현율을 메모리와 교환, 기본값이 아닌 옵트인·프리뷰.

라벨 못 할 규모의 인덱스 거동엔 정확 정답의 오픈 벤치 사용. Qdrant-FineWeb-10B(2026-09-01)가 100.7억 dense + 100.7억 sparse 벡터와 정확 top-1,000 이웃의 10만 쿼리 제공; 동반 PubMed-Multi-Vector 세트가 같은 코퍼스에 dense·sparse·ColBERT 비교. 얕은 top-k·필터 없이 1천만 벡터에서 측정한 벤더 지연 주장은 10억에서 필터 top-100 쿼리에 거의 말해주지 않는다.

**공개 리더보드는 사전확률이지 결과가 아니다.** MTEB 점수는 모델이 공개 테스트셋과 겹치는 데이터로 학습하면 부풀 수 있다. RTEB(MTEB 팀, 2025-10)는 오픈 데이터셋과 유지자 평가 비공개 홀드아웃을 섞어 더 나은 숏리스트 필터; NVIDIA는 Nemotron 3 Embed 8B(오픈 가중치, OpenMDW-1.1)를 RTEB Multilingual 1위 78.5로 보고(벤더, 2026-07). RTEB에서 숏리스트하고 자신의 골든셋에서 결정.

### 생성기 평가

검색 문맥을 고정하고 생성만 변경해 생성기 격리.

```
  Fixed Context (known relevant chunks)
  + Query
        |
        v
  Run Generator --> Answer
        |
        v
  Metrics:
    +-- Faithfulness (RAGAS): Does it stay grounded?
    +-- Completeness: Does it cover all relevant info in context?
    +-- Conciseness: Is it appropriately brief?
    +-- Format Compliance: Does it follow the expected output format?
    +-- Citation Accuracy: Do citations point to the right chunks?
```

### 재순위기 평가

```
  Query + Initial retrieval results (e.g., top 100 from BM25)
        |
        v
  Run Reranker --> Reranked results
        |
        v
  Metrics:
    +-- NDCG improvement: Did reranking move relevant docs up?
    +-- Recall preservation: Did reranking lose any relevant docs?
    +-- Latency: What did reranking add to query time?
```

---

## RAG용 LLM-as-Judge

LLM으로 다른 LLM 출력을 평가하는 게 지배적 평가 패러다임. 인간 평가가 못 하는 규모로 확장되나 알려진 편향이 있다.

### 작동 방식

```
  Evaluation Prompt Template:
  +------------------------------------------------------------------+
  | You are evaluating a RAG system. Given:                           |
  | - User Query: {query}                                             |
  | - Retrieved Context: {context}                                    |
  | - Generated Answer: {answer}                                      |
  |                                                                    |
  | Rate the following on a scale of 1-5:                             |
  | 1. Faithfulness: Are all claims in the answer supported by        |
  |    the context? (1=hallucinated, 5=fully grounded)                |
  | 2. Relevance: Does the answer address the user's question?        |
  |    (1=off-topic, 5=directly answers)                              |
  | 3. Completeness: Does the answer cover all relevant info?         |
  |    (1=missing key info, 5=comprehensive)                          |
  |                                                                    |
  | Provide scores and brief justifications in JSON.                  |
  +------------------------------------------------------------------+
```

### 알려진 편향과 완화

| 편향 | 설명 | 완화 |
|------|-------------|------------|
| **장황함** | LLM 심판이 긴 답 선호 | 답 길이로 점수 정규화; 간결 페널티 추가 |
| **자기 선호** | GPT-4가 GPT-4 답을 높게 평가 | 생성기와 다른 심판 모델 사용 |
| **위치** | A/B 비교에서 첫 옵션이 높게 | 제시 순서 무작위화 |
| **아첨** | 심판이 평가 대상 시스템에 동의 | 특정 기준의 구조화 루브릭 사용 |
| **관대함** | LLM이 3/5 미만을 거의 안 줌 | 리커트 대신 이진(합/불) 사용 |

### LLM-as-Judge 베스트 프랙티스

1. **스케일보다 이진 결정**: "이 주장이 지지되나? YES/NO"가 "1-5로 지지 평가"보다 신뢰성 높음.
2. **원자적 평가로 분해**: 한 번에 한 주장·한 차원 평가.
3. **증거 요구**: 심판에게 각 주장을 지지·반박하는 특정 문맥 구절 인용 강제.
4. **인간 합의로 보정**: LLM·인간 심판에 100+ 예시 돌림. Cohen's Kappa 측정. > 0.7 목표.
5. **보정엔 강한 모델, 볼륨엔 싼 모델**: 인간 합의 보정셋·CI엔 프런티어 심판(Claude Opus 5.5, GPT-6 Sol); 그 셋에서 프런티어 심판 판정과 일치하면 샘플 프로덕션 트래픽엔 작은 모델. 답을 생성한 모델은 절대 안 씀.
6. **심판 핀·버전**: 심판 교체가 지표 변경. Claude Sonnet 4.5는 2026-11-30 은퇴(Claude API·Foundry), Claude Haiku 4.5는 Foundry에서 11/15 은퇴하니 거기서 둘 중 하나로 판정하는 팀은 이번 분기 전환해야. 교체 간 점수 비교 전 인간 합의 보정 재실행·임계 재기준.

### 셋째 심판 티어: 타입 결정 모델

많은 RAG 검사가 이진("이 주장이 지지되나? YES/NO")이고, 2026년 모델 부류가 텍스트 생성 없이 정확히 그것을 반환. TypeSafe **Jev**(2026-09부터 얼리 액세스)는 타입 결정(yes/no, 선택, 점수)을 확률과 함께 1M 입력 토큰당 $0.042로 반환, 출력 비과금, 출시 2주 내 LangSmith·Langfuse·Braintrust·Opik·DeepEval에 통합.

| | 프런티어 LLM 심판 | 작은 LLM 심판 | 결정 모델 심판 |
|---|---|---|---|
| **예시** | Claude Opus 5.5, GPT-6 Sol | GPT-6 Luna, Claude Haiku 4.5 | Jev |
| **출력** | 판정 + 서면 근거 | 판정 + 근거 | 확률 있는 타입 결정; 근거·기권 없음 |
| **적합** | 보정, CI, 모호 케이스 | 샘플 프로덕션 트래픽 | 전 트래픽 이진 주장 검사 |
| **못 하는 것** | 싼 볼륨 | 가장 어려운 엣지 | 주장 추출, 질문 생성, 개방형 비평 |

독립 검사가 가격보다 중요. 2026-09 연구(Rao·Callison-Burch, arXiv 2609.29769)는 LLM 루브릭 심판이 Jev보다 16-325배 비용이고 27개 비교 중 최대 8개에서만 정확도가 유의하게 달랐으나, Jev의 가장 확신한 오류에서 LLM 판정 약 96%가 같은 틀린 답을 반복하고 어떤 캐스케이드도 최고 단일 심판을 2.7점 넘게 못 이김을 발견. **싼 심판에서 비싼 심판으로 에스컬레이션은 돈을 아끼나 상관 오류를 못 잡는다.** 인간 라벨 조각만 잡는다. RAG에 직접 닿는 보고 한계 둘: 무관 문맥(긴 검색 문맥이 담는 바로 그것)에 정확도 저하, 독립 벤치가 등급 관련성에 약점 발견. 충실성·문맥 관련성 점수에 신뢰 전 자신의 문맥 길이에서 테스트.

---

## 골든 테스트셋 구축

골든 테스트셋은 회귀 테스트 정답으로 쓰는 큐레이션·버전 관리된 (쿼리, 예상_문맥, 예상_답) 삼항 모음.

### 구축 과정

```
  Step 1: Seed Collection
  +-------------------------------------------------------+
  | Source production queries (logs, support tickets)       |
  | Target: 200-500 diverse queries                        |
  | Coverage: all topics, question types, difficulty levels |
  +-------------------------------------------------------+
            |
            v
  Step 2: Synthetic Augmentation
  +-------------------------------------------------------+
  | Use RAGAS or DataMorgana to generate additional queries |
  | from your corpus:                                       |
  |   - Simple factual questions (40%)                     |
  |   - Multi-hop reasoning questions (25%)                |
  |   - Conditional/comparative questions (20%)            |
  |   - Adversarial/edge cases (15%)                       |
  +-------------------------------------------------------+
            |
            v
  Step 3: Human Annotation
  +-------------------------------------------------------+
  | For each query, annotate:                               |
  |   - Expected relevant document IDs (for retrieval eval) |
  |   - Reference answer (for generation eval)              |
  |   - Difficulty label (easy / medium / hard)             |
  |   - Category tags (topic, question type)                |
  +-------------------------------------------------------+
            |
            v
  Step 4: Versioning and Freezing
  +-------------------------------------------------------+
  | Store in version control (golden_set_v3.json)           |
  | FREEZE the set for each evaluation cycle                |
  | Never modify a frozen set; create a new version         |
  +-------------------------------------------------------+
```

### 골든셋 구성 지침

| 질문 유형 | 비율 | 목적 |
|--------------|-----------|---------|
| 단순 사실 | 40% | 기준선: 항상 통과해야 |
| 멀티홉 추론 | 25% | 문서 간 검색 테스트 |
| 비교형 | 15% | 여러 관련 문서 검색 테스트 |
| 시간적 | 10% | 버전·날짜 콘텐츠 처리 테스트 |
| 적대적 | 10% | 강건성 테스트(답 불가, 범위 밖) |

### RAGAS 합성 테스트 생성

```python
# Generate synthetic test queries from your corpus (RAGAS 0.2+ API;
# the 0.1-era ragas.testset.generator / evolutions imports no longer exist)
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from ragas.testset import TestsetGenerator
from ragas.testset.synthesizers import (
    SingleHopSpecificQuerySynthesizer,
    MultiHopSpecificQuerySynthesizer,
    MultiHopAbstractQuerySynthesizer,
)

generator_llm = LangchainLLMWrapper(ChatOpenAI(model="gpt-4o"))
generator_embeddings = LangchainEmbeddingsWrapper(
    OpenAIEmbeddings(model="text-embedding-3-large")
)
generator = TestsetGenerator(llm=generator_llm, embedding_model=generator_embeddings)

query_distribution = [
    (SingleHopSpecificQuerySynthesizer(llm=generator_llm), 0.40),
    (MultiHopSpecificQuerySynthesizer(llm=generator_llm), 0.35),
    (MultiHopAbstractQuerySynthesizer(llm=generator_llm), 0.25),
]
testset = generator.generate_with_langchain_docs(
    load_documents("./knowledge_base/"),
    testset_size=200,
    query_distribution=query_distribution,
)
# CRITICAL: Always human-review synthetic data before using as ground truth
testset.to_pandas().to_csv("golden_set_draft_v4.csv")
```

**경고**: 합성 테스트셋은 출발점이지 목적지가 아니다. 생성 모델 아티팩트에 대해 테스트하지 않도록 항상 인간 검토로 검증.

---

## 자동 회귀 테스트

모든 RAG 파이프라인 변경(새 임베딩, 청크 크기, 프롬프트 편집, 재순위기 교체)엔 배포 전 자동 회귀 테스트가 필요.

### CI/CD 통합

```
  PR (RAG change) --> CI: Load golden set --> Run pipeline --> Compute metrics
                          --> Compare vs. baseline --> FAIL if drop > 5%, WARN if > 2%
                          --> Post metrics table as PR comment
```

### 품질 게이트

| 지표 | 절대 최소 | 회귀 임계 |
|--------|-----------------|---------------------|
| Recall@10 | 0.85 | 기준선 대비 5% 하락 |
| MRR | 0.70 | 5% 하락 |
| 충실성 | 0.80 | 3% 하락 |
| 답 관련성 | 0.75 | 5% 하락 |
| 답 정확성 | 0.70 | 5% 하락 |

절대 최소 아래 지표는 PR 차단. 임계 넘는 회귀는 경고 트리거 + 저하된 특정 쿼리 플래그.

같은 스위트를 자기 PR뿐 아니라 프로덕션에 스케줄 실행. **핀된 모델 ID가 핀된 거동이 아니다**: 2026-09-25 OpenAI가 변경 없는 ID 하 GPT-6 Sol·Luna 이미지 인코딩 버그 수정, 고객에 이미지 평가 재실행 권고. 수정 전 측정한 이미지 의존 RAG 점수는 파이프라인이 아니라 결함을 반영할 수 있음.

---

## 프로덕션 모니터링

오프라인 평가는 필요하나 충분치 않다. 프로덕션 쿼리는 테스트셋과 다르고, 코퍼스가 변하며 검색 품질이 시간에 따라 저하될 수 있다.

### 핵심 프로덕션 신호

| 신호 | 탐지하는 것 | 측정법 |
|--------|----------------|----------------|
| **빈 검색률** | 관련 결과 없는 쿼리 | top-1 유사도 &lt; 임계인 쿼리 % |
| **유사도 점수 드리프트** | 임베딩·코퍼스 저하 | 시간별 평균 유사도 추적; 하락 알림 |
| **충실성 샘플링** | 프로덕션 환각률 | 무작위 5-10% 샘플에 LLM-as-judge |
| **사용자 피드백 상관** | 지표가 실제 품질 반영하나 | 좋아요/싫어요를 자동 점수와 비교 |
| **지연 P99** | 성능 저하 | 검색+생성 지연 추적 |
| **토큰 사용** | 비용 드리프트 | 쿼리당 평균 문맥 토큰 모니터 |

### 검색 품질 드리프트

드리프트는 코퍼스가 변하나 임베딩·청크·프롬프트가 못 따라갈 때 발생. 네 흔한 시나리오: (1) 다른 어휘의 새 문서가 임베딩 공간 불일치(영향 컬렉션 재임베딩으로 고침); (2) 사용자 쿼리 패턴이 콘텐츠 없는 주제로 이동(빈 검색률 모니터로 탐지); (3) 낡은 콘텐츠가 구식 답 반환(신선도 메타데이터 추가·최근 문서 선호); (4) 임베딩 모델 업데이트가 유사도 분포 변경(모델 변경 후 모든 임계 재보정).

---

## 대규모 평가 비용

LLM-as-judge 평가는 강력하나 비싸다. 비용 구조 이해가 예산화에 결정적.

### 쿼리당 비용(전체 RAG 삼요소)

2026-10-01 정가, 토큰 90% 입력·10% 출력, 추론 토큰 전 가정:

| 지표 | LLM 호출 | 토큰 | Claude Opus 5.5($4/$20) | Claude Haiku 4.5($1/$5) | GPT-6 Luna($0.10/$0.50) |
|--------|-----------|--------|----------------------------|----------------------------|----------------------------|
| 충실성 | 약 3(추출+검증) | 약 3k | $0.017 | $0.0042 | $0.00042 |
| 문맥 관련성 | 약 5(청크당) | 약 2.5k | $0.014 | $0.0035 | $0.00035 |
| 답 관련성 | 약 2(질문 생성) | 약 1.6k | $0.009 | $0.0022 | $0.00022 |
| **전체 삼요소** | **약 10** | **약 7k** | **약 $0.04** | **약 $0.01** | **약 $0.001** |

실제 비용을 바꾸는 단서 둘. Claude Opus 5.5는 사고 비활성 불가(기본 노력 `medium`)이니 심판 호출에 `low` 노력 설정·추론 토큰 측정. 그리고 이진 검증 호출은 결정 모델 심판으로 이동 가능(Jev 1M 입력당 $0.042로 쿼리당 약 $0.0003), 생성 모델엔 주장 추출·질문 생성만 남김.

### 확장 전략

| 평가 유형 | 빈도 | 볼륨 | 심판 모델 | 월 비용(일 1만 쿼리) |
|----------------|-----------|--------|-------------|-------------------------------|
| **CI 회귀** | PR당 | 골든셋(500 쿼리) | 프런티어(Claude Opus 5.5/GPT-6 Sol) | 약 $20/실행 |
| **야간 배치** | 일간 | 무작위 1k 프로덕션 쿼리 | 작은(GPT-6 Luna), Batch API | 약 $15/월 |
| **프로덕션 샘플** | 실시간 | 트래픽 5%(일 500) | 작은(GPT-6 Luna) | 약 $15/월 |
| **심층 감사** | 주간 | 전체 골든셋 + 분석 | 프런티어, Batch API | 약 $45/월 |

프런티어 행은 Claude Opus 5.5 가격; GPT-6 Sol($2/$10)이 대략 반감.

**통찰**: 심판 비용은 인간 라벨링 비용 옆에서 작다; 비싼 실수는 주석자와 불일치하는 싼 심판. 고볼륨 샘플링엔 보정셋에서 프런티어 심판과 일치한 뒤에만 작은 모델(GPT-6 Luna, Claude Haiku 4.5), CI·심층 감사엔 Claude Opus 5.5·GPT-6 Sol 예약. 야간·주간 작업은 기다릴 수 있으니 50% 할인 Batch API로.

---

## 도구 비교

### 프레임워크 개요

| 도구 | 적합 | 오픈소스 | 핵심 강점 | 핵심 약점 |
|------|----------|------------|--------------|--------------|
| **RAGAS** | 빠른 RAG 평가, 합성 데이터 | 예 | 참조 없는 지표, 강한 커뮤니티 | 지표 결과에 설명 부족 |
| **DeepEval** | CI/CD 통합, LLM용 TDD | 예 | pytest 호환, 자기 설명 점수 | 무거운 설정 |
| **TruLens** | RAG 삼요소 평가, 관측성 | 예 | RAG 삼요소 창안, 좋은 추적 | 개발 덜 활발 |
| **UpTrain** | 프로덕션 모니터링, 드리프트 | 예 | 하이브리드 평가(LLM+휴리스틱), 드리프트 알림 | 낮은 순위 정확도 |
| **Braintrust** | 팀 협업, 실험 추적 | 상업 | 최고 UI/UX, 실험 비교 | 고급 기능 유료 |
| **LangSmith** | 추적, 평가, 추적-파인튜닝 루프 | 상업 | 가장 깊은 LangChain/LangGraph 통합; 타 스택엔 SDK·OTel 수집 | SaaS 확장 보존 추적 180일 상한(2026-09-14부터): 감사 로그 아님 |
| **Langfuse** | 자체 호스팅 추적+평가 | 예 | OTel 네이티브, 익스포트 가능; Python SDK 4.x(`@observe()`; v2 `trace()` API 사라짐) | 자체 호스팅은 Postgres와 함께 ClickHouse·Redis·오브젝트 스토리지 운영 |
| **Arize Phoenix** | 자체 호스팅 추적+RAG 평가 | 소스 공개(Elastic-2.0) | OTel 네이티브, 강한 검색 뷰 | Dynatrace가 Arize 인수 합의(2026-08-13): 로드맵 주시 |
| **Promptfoo** | CI 어서션, 레드팀 | 예(MIT) | 선언적 테스트 스위트; OpenAI Evals 마이그레이션 타깃(읽기전용 10/31, 11/30 종료) | OpenAI가 인수 합의(2026-03 발표): 벤더 중립성 고려 |

### 언제 뭘 쓰나

```
  Starting a new RAG project?
    --> RAGAS for quick baseline metrics + synthetic test generation

  Adding RAG eval to CI/CD?
    --> DeepEval (pytest integration, quality gates as assertions)

  Need production monitoring?
    --> UpTrain or Braintrust (drift detection, alerting)

  Want end-to-end observability?
    --> LangSmith or Braintrust (SaaS), Langfuse or Phoenix (self-hosted, OTel)

  Still on OpenAI Evals?
    --> It goes read-only on October 31, 2026 and shuts down November 30:
        export results and move to Promptfoo or your own harness before then

  Building custom eval pipeline?
    --> Roll your own with LLM-as-judge + the RAG Triad structure
```

### 커스텀 평가기 패턴

커스텀 평가기의 핵심 패턴은 단순: 각 삼요소 차원에 이진 LLM-as-judge 호출을 쓰고 집계.

```python
# Pseudocode: Core faithfulness evaluator (other dimensions follow the same pattern)

def evaluate_faithfulness(answer: str, context: str, judge) -> float:
    # Step 1: Extract atomic claims from the answer
    claims = judge.generate(f"List every factual claim as a JSON array:\n{answer}")

    # Step 2: Verify each claim against context (binary YES/NO)
    supported = sum(
        1 for claim in json.loads(claims)
        if "YES" in judge.generate(
            f"Is this claim supported by the context? YES or NO.\n"
            f"Claim: {claim}\nContext: {context}"
        ).upper()
    )
    return supported / max(len(json.loads(claims)), 1)
```

문맥 관련성(청크당: "이게 쿼리에 관련?")과 답 관련성(가설 질문 생성, 원 쿼리와 유사도 측정)에 같은 분해-후-판정 패턴 적용.

---

## 시스템 디자인 면접 관점

### Q: RAG 시스템을 배포했는데 사용자가 답이 가끔 틀리다 보고한다. 어떻게 체계적으로 진단·수정하나?

**좋은 답변:**

RAG 삼요소로 실패 모드 격리:

1. **실패 쿼리 샘플링**: 사용자가 나쁜 답을 플래그한 쿼리 50-100개 수집. 실패 유형별 분류.
2. **삼요소 실행**:
   - **문맥 관련성 낮음?** → 검색 문제. 잘못된 문서를 가져옴. 고침: 임베딩 유사도 점수 검사, 쿼리 언어가 문서 언어와 맞는지 확인, 하이브리드 검색(BM25+dense) 시도, 재순위기 추가.
   - **접지성 낮음?** → 환각 문제. 좋은 문맥에도 LLM이 지어냄. 고침: 시스템 프롬프트 강화("제공 문맥에서만 답"), 청크 ID 인용 요구·검증, 또는 더 지시 따르는 모델. 온도 낮추기는 더 이상 보편 레버 아님: GPT-6 Astra가 `temperature` 거부, 최신 Claude가 비기본 샘플링 거부.
   - **답 관련성 낮음?** → 관련 콘텐츠를 검색·충실 요약하나 실제 질문을 놓침. 고침: 쿼리 이해 개선(쿼리 재작성, HyDE), 올바른 인덱스로 라우팅할 쿼리 분류 추가.
3. **회귀 테스트 구축**: 실패 쿼리 50개를 예상 답 주석해 골든셋에 추가. 모든 미래 변경이 이 케이스 통과해야.
4. **지속 모니터링**: 프로덕션 트래픽 5% 샘플 자동 평가. 충실성 0.80 미만·문맥 관련성 0.60 미만 시 알림.

핵심 통찰은 "답이 틀리다"는 진단이 아니라 증상. RAG 삼요소가 모호한 불만을 구체적·실행 가능한 근본 원인으로 바꾼다.

### Q: 정답이 없을 때 RAG 시스템을 어떻게 평가하나?

**좋은 답변:**

가장 흔한 실세계 시나리오. 세 계층 접근:

**계층 1: 참조 없는 지표(1일차)**. RAGAS 충실성·문맥 관련성은 정답 불필요. 환각 여부와 검색 작동 여부를 말해줌. 어떤 쿼리에도 즉시 실행.

**계층 2: 합성 골든셋(1주차)**. RAGAS TestsetGenerator로 코퍼스에서 합성 (쿼리, 답) 쌍 생성. 답 정확성·문맥 재현율의 근사 정답 제공. 품질 검증에 샘플 인간 검토.

**계층 3: 프로덕션 유래 골든셋(1개월차)**. 높은 사용자 만족(좋아요, 후속 질문 없음) 쿼리를 프로덕션 로그에서 캠. 주석자가 참조 답 라벨. 합성 분포가 아닌 실사용 패턴 반영 골든셋.

트레이드오프는 정확도 vs 속도. 계층 1은 시간 단위 신호나 근사. 계층 3은 정답이나 몇 주. 즉각 피드백엔 계층 1로 시작해 셋을 병렬 실행.

### Q: RAG 평가 파이프라인이 LLM 심판 호출로 일 $500 든다. 어떻게 줄이나?

**좋은 답변:**

영향순 다섯 전략:

1. **계층 심판 모델**: 프로덕션 샘플링(볼륨 90%)엔 보정셋에서 프런티어 심판과 일치 확인 후 GPT-6 Luna(전체 삼요소 쿼리당 약 $0.001) 같은 작은 심판. CI 회귀·주간 심층 감사엔 Claude Opus 5.5(약 $0.04)·GPT-6 Sol(약 $0.02) 예약. 20-40배 가격 격차라 이것만으로 80% 넘게 절감.
2. **스마트 샘플링**: 모든 쿼리 평가 안 함. 쿼리 유형·사용자 세그먼트 층화 프로덕션 5% 샘플. CI엔 전체 합성 세트가 아닌 골든셋(500 쿼리)만.
3. **캐싱**: 많은 프로덕션 쿼리가 유사. (쿼리, 문맥, 답) 튜플 해시·평가 결과 캐시. 동일·근사 입력은 캐시 점수.
4. **휴리스틱 사전 필터**: LLM 심판 호출 전 싼 휴리스틱. 답에 "모르겠다"가 있거나 문맥과 겹침 0(ROUGE-L &lt; 0.1)이면 비싼 충실성 평가 건너뛰고 점수 직접 배정.
5. **배치·결정 모델**: 야간·주간 실행을 Batch API(50% 할인)로, 이진 주장 검증을 Jev 같은 타입 결정 모델 심판으로 이동. 결정 모델이 정확도를 더하리라 기대 안 함: 2026-09 연구가 그 확신 오류가 대부분 LLM 심판과 공유됨을 발견해 캐스케이드는 돈을 아끼나 인간 라벨 조각이 여전히 진짜 검사.

목표는 평가 예산을 가장 신호 많은 곳에 쓰는 것: LLM 심판의 미묘한 추론이 중요한 모호·경계 케이스, 그리고 모든 심판을 정직하게 유지하는 인간 라벨.

---

## 참고 문헌

- Es et al. "RAGAS..." (2023, arXiv:2309.15217)
- TruLens. "The RAG Triad" (2024)
- DeepEval. "Using the RAG Triad for RAG Evaluation" (2025)
- Confident AI. "RAG Evaluation Metrics" (2025)
- Microsoft. "The Path to a Golden Dataset" (2025)
- Prem AI. "RAG Evaluation: Metrics, Frameworks & Testing" (2026)
- Rao and Callison-Burch. "JEV vs. LLMs as Rubric Judges..." (arXiv 2609.29769, 2026)
- MTEB team. "RTEB..." (2025-10)
- Qdrant. "Qdrant-FineWeb-10B" (2026-09)
- RAGAS documentation. "Testset Generation for RAG" (docs.ragas.io)

---

*이전: [멀티모달 RAG](12-multimodal-rag.md) | 다음: [대규모 프로덕션 RAG](14-production-rag-at-scale.md)*
