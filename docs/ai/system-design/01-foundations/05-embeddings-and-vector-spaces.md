---
title: 임베딩과 벡터 공간
sidebar_position: 5
description: 의미를 담는 밀집 벡터 표현 — 임베딩 아키텍처, 학습 목표, 거리 척도, Matryoshka, 레이트 청킹/인터랙션, 양자화, 드리프트 관리까지.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/01-foundations/05-embeddings-and-vector-spaces.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 임베딩과 벡터 공간

:::tip 입문 먼저
개념이 처음이라면 SecureNomad 입문 문서 [08. 임베딩과 벡터 DB](../../using/08-embeddings.md)를 먼저 보세요.
:::


임베딩(embedding)은 의미를 담아내는 텍스트의 밀집 벡터 표현이다. RAG 시스템, 시맨틱 검색, 많은 AI 애플리케이션의 기초다.

## 임베딩이란

임베딩은 이산 텍스트(단어, 문장, 문서)를 연속 벡터 공간으로 매핑하며, 이 공간에서 의미적 유사성은 기하학적 근접성에 대응한다.

**핵심 특성:**
- 비슷한 의미는 서로 가깝다
- 관계가 벡터 연산으로 인코딩될 수 있다(king − man + woman = queen)
- 근사 최근접 이웃(ANN) 알고리즘으로 효율적 유사도 검색이 가능하다

**멘탈 모델:**
임베딩을 아주 고차원 공간의 좌표로 생각하라. 차원(512~4096)이 표현력을 제공한다. 각 차원은 의미의 어떤 측면을 포착하지만, 개별 차원 자체는 해석 가능하지 않다.

---

## 임베딩 모델 아키텍처

### 단어 임베딩(역사적)

초기 접근은 개별 단어를 임베딩했다:

| 모델 | 연도 | 접근 | 한계 |
|-------|------|----------|------------|
| Word2Vec | 2013 | Skip-gram, CBOW | 정적: "bank"가 모든 문맥에서 동일 |
| GloVe | 2014 | 동시 출현 행렬 | 정적 |
| FastText | 2017 | 서브워드 임베딩 | 정적이나 OOV 처리 가능 |

**핵심 한계:** 같은 단어가 문맥과 무관하게 같은 임베딩을 받는다.

### 문맥적 임베딩

트랜스포머 기반 모델은 문맥 의존적 임베딩을 만든다:

```python
# Static embedding (Word2Vec)
embed("bank") = [0.1, 0.3, ...]  # Same vector always

# Contextual embedding (BERT)
embed("river bank") = [0.1, 0.3, ...]   # Geography sense
embed("bank account") = [0.5, 0.2, ...]  # Finance sense
```

### 문장/문서 임베딩

검색을 위해서는 텍스트 전체를 임베딩해야 한다:

| 접근 | 방법 | 장점 | 단점 |
|----------|--------|------|------|
| 평균 풀링 | 토큰 임베딩 평균 | 단순 | 정보 손실 |
| CLS 토큰 | [CLS] 토큰 임베딩 사용 | BERT 표준 | 전체 텍스트를 담지 못할 수 있음 |
| 마지막 토큰 | 최종 토큰 사용 | 디코더 모델에 적합 | 위치 편향 |
| 학습된 풀링 | 풀링 가중치 학습 | 더 나은 품질 | 학습 필요 |

현대 임베딩 모델은 언어 모델에서 단순히 적응시킨 것이 아니라, 문장/문서 임베딩을 위해 전용으로 학습된다.

### 바이 인코더(Bi-Encoder) 아키텍처

표준 검색 임베딩 아키텍처:

```
Document -> Encoder -> Document Embedding
Query    -> Encoder -> Query Embedding

Similarity = cosine(doc_embedding, query_embedding)
```

**특성:**
- 문서를 미리 계산해 색인 가능
- 쿼리 임베딩은 질의 시점에 계산
- 문서당 O(1) 유사도 계산(ANN 사용 시)

### 크로스 인코더(Cross-Encoder) 아키텍처

쿼리와 문서를 함께 처리하는 대안:

```
[Query, Document] -> Encoder -> Relevance Score
```

**특성:**
- 더 정확(둘을 함께 봄)
- 미리 계산 불가: n개 문서에 O(n) 추론
- 검색이 아니라 리랭킹에 사용

최신 리랭커는 32K 토큰 입력을 받으므로, 후보가 512 토큰 구절이 아니라 긴 섹션이나 짧은 문서일 수 있다: Cohere Rerank 4(Fast·Pro), Voyage rerank-3·rerank-3-lite(2026년 9월 30일, 100만 토큰당 $0.05·$0.02), 그리고 Qwen3-Reranker-8B·Qwen3-VL-Reranker(Apache 2.0, 멀티모달) 같은 오픈 가중치 옵션. [리랭킹 전략](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/06-reranking-strategies.md)을 참고하라.

---

## 학습 목표

### 대조 학습(Contrastive Learning)

대부분의 현대 임베딩 모델은 대조 학습을 쓴다:

```python
# Simplified contrastive loss
def contrastive_loss(anchor, positive, negatives):
    pos_sim = cosine_similarity(anchor, positive)
    neg_sims = [cosine_similarity(anchor, neg) for neg in negatives]
    
    # Push positive close, negatives far
    loss = -log(exp(pos_sim / tau) / 
                (exp(pos_sim / tau) + sum(exp(neg_sim / tau) for neg_sim in neg_sims)))
    return loss
```

**핵심 요소:**
- **양성 쌍(Positive pairs):** 의미적으로 유사한 텍스트(병렬 문장, 쿼리-문서 쌍)
- **하드 네거티브(Hard negatives):** 비슷하지만 일치하지 않는 텍스트(BM25로 검색된 비관련)
- **인배치 네거티브(In-batch negatives):** 같은 배치의 다른 항목을 네거티브로(효율적)

### 학습 데이터 출처

| 출처 | 양성 쌍 | 품질 | 규모 |
|--------|---------------|---------|-------|
| 병렬 문장 | 번역 쌍 | 높음 | 중간 |
| 쿼리-문서 | 검색 로그 | 높음 | 중간 |
| 제목-본문 | 문서 구조 | 중간 | 큼 |
| 패러프레이즈 | NLI 데이터셋 | 높음 | 작음 |
| 생성 | LLM이 쌍 생성 | 가변 | 큼 |

### 명령 튜닝 임베딩

최근 모델은 과제 명령을 받는다:

```python
# Instruction-tuned (e.g., E5, BGE)
query_embedding = embed("Represent this query for retrieval: What is RAG?")
doc_embedding = embed("Represent this document for retrieval: RAG combines...")
```

의도된 용도를 명시해 성능을 높인다.

---

## 거리 척도

### 코사인 유사도

텍스트 임베딩에 가장 흔하다:

```python
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

**특성:**
- 범위: [-1, 1](모든 성분이 음이 아니면 [0, 1])
- 크기가 아니라 각도를 측정
- 벡터 길이에 불변

**언제 쓰나:** 텍스트 임베딩의 기본 선택.

### 내적(Dot Product)

```python
def dot_product(a, b):
    return np.dot(a, b)
```

**특성:**
- 크기가 중요
- 범위 무한
- 정규화 벡터에 대해서는 코사인과 동등

**언제 쓰나:** 임베딩이 이미 정규화되었거나 크기가 의미 있을 때.

### 유클리드 거리

```python
def euclidean_distance(a, b):
    return np.linalg.norm(a - b)
```

**특성:**
- 절대 차이를 측정
- 크기의 영향을 받음
- 정규화 벡터: sqrt(2 - 2 * cosine)

**언제 쓰나:** 텍스트에는 드물고, 이미지 임베딩에 더 흔하다.

### 척도 선택

| 척도 | 벡터 DB | 흔한 용도 |
|--------|------------------|------------|
| 코사인 | Pinecone, Qdrant, Weaviate | 텍스트 임베딩 |
| 내적 | 주요 DB 전부 | 정규화된 임베딩 |
| 유클리드 | 주요 DB 전부 | 이미지, 멀티모달 |

---

## 임베딩 모델 비교

### 호스티드 모델 (2026년 10월)

| 모델 | 차원 | 최대 입력 | 모달리티 | 100만 토큰당 비용 | 비고 |
|-------|------------|-----------|------------|------------------|-------|
| OpenAI text-embedding-3-large | 3072 (Matryoshka) | 8,192 | 텍스트 | $0.13 | OpenAI는 더 새 임베딩 모델을 내지 않음 |
| OpenAI text-embedding-3-small | 1536 (Matryoshka) | 8,192 | 텍스트 | $0.02 | 저렴한 기준선 |
| Google gemini-embedding-2 | 128-3,072 (768/1,536/3,072 권장) | 텍스트 8,192 토큰; 이미지 6장, 영상 120초, 오디오, PDF 6쪽까지 | 멀티모달, 인터리브 | 텍스트 $0.20 (Google 가격 페이지) | 2026년 4월부터 안정; text-embedding-004(종료)와 텍스트 전용 gemini-embedding-001(2028-05-14 종료) 대체 |
| Cohere embed-v5.0-pro / -fast | 256-2,048 (Matryoshka) | 128K | 텍스트, 이미지, 텍스트+이미지 융합 | 텍스트 $0.12/$0.08; 이미지 $0.40 | 2026년 9월 30일; Pro·Fast가 한 임베딩 공간 공유 |
| Voyage voyage-4-large / voyage-4 / voyage-4-lite | 기본 1024 (256-2,048) | 32K | 텍스트 | $0.12/$0.06/$0.02 | 2026년 1월; 계열이 한 임베딩 공간 공유 |
| Voyage voyage-code-4 | 기본 1024 (256-2,048) | 32K | 코드 | $0.12 | 2026년 8월 13일; PR에서 추출한 자연어 쿼리로 학습, 에이전트형 코드 검색용 |
| Voyage voyage-context-4 | - | 32K 창; 더 긴 문서 처리 | 텍스트, 문맥화 청크 | $0.12 | 전체 문서 문맥을 인코딩하는 청크당 한 벡터 |

**벤치마크 주장 읽기:**
- **MTEB 단독 순위보다 RTEB를 선호하라**(MTEB 팀, 2025년 10월). RTEB는 공개 데이터셋에 비공개 홀드아웃 세트를 섞어 유지관리자가 평가하므로, 모델이 전부에 맞춰 튜닝될 수 없다. NVIDIA는 Nemotron 3 Embed 8B가 RTEB Multilingual 1위(78.5, 2026-07-15 기준)라고 보고한다.
- **MTEB 리더십은 다툼이 있다.** Qwen3-Embedding-8B(Multilingual 평균 70.58)는 이후 llama-embed-nemotron-8b, KaLM-Embedding-Gemma3-12B-2511(72.32)에 주장 순위에서 밀렸다. 실시간 리더보드를 확인하라.
- **벤더 수치는 재현 전까지 마케팅이다.** 시각적으로 풍부한 문서에 대해 Cohere는 ViDoRe V3 점수 85.8(embed-v5.0-pro), 84.5(fast), 83.7(voyage-4-large), 83.2(gemini-embedding-2), 75.5(text-embedding-3-large)를 보고한다. 자체 에이전트형 코드 검색 스위트에서 Voyage는 voyage-code-4가 voyage-code-3보다 27.54% 앞선다고 보고하며 독립 검증은 대기 중이다. 둘 다 벤더 보고다.

### 오픈소스 모델

| 모델 | 차원 | 최대 토큰 | 라이선스 | 비고 |
|-------|------------|------------|---------|-------|
| Nemotron 3 Embed 8B | 4096 (슬라이스 가능) | 32,768 | OpenMDW-1.1 | 2026-07-16; RTEB Multilingual 1위 78.5(NVIDIA 보고); `query:`/`passage:` 접두사 |
| Nemotron 3 Embed 1B | 2048 | - | OpenMDW-1.1 | RTEB Multilingual 72.4(NVIDIA 보고); 저렴한 서빙용 NVFP4 변형 |
| Qwen3-Embedding-8B | 최대 4096 (Matryoshka) | 32K | Apache 2.0 | MTEB Multilingual 평균 70.58 |
| BGE-large-en-v1.5 | 1024 | 512 | MIT | 오래됐지만 강한 영어 기준선 |
| E5-large-v2 | 1024 | 512 | MIT | 명령 튜닝 |
| Nomic-embed-text-v1.5 | 768 (Matryoshka) | 8192 | Apache 2.0 | 작고 긴 문맥 |

### 선택 기준

| 요소 | 고려 사항 |
|--------|----------------|
| 품질(RTEB, MTEB) | 높을수록 좋지만, 자신의 쿼리로 평가하는 게 더 중요; 홀드아웃 벤치마크가 공개보다 낫다 |
| 차원 | 높을수록 표현력↑, 저장·연산 비용↑ |
| 최대 토큰 | 문서 크기를 수용해야 함 |
| 비용 | API vs 셀프 호스팅 트레이드오프 |
| 지연 | 임베딩 생성 시간 |
| 다국어 | 비영어 콘텐츠 서빙 시 |
| 모달리티 | 이미지·PDF·영상·코드는 전용 학습 모델 필요(gemini-embedding-2, Cohere Embed 5, voyage-code-4) |
| 공유 공간 | 한 공간을 공유하는 계열은 재색인 없이 쿼리측 모델 교체 가능 |

---

## Matryoshka와 적응형 차원

### 아이디어

Matryoshka 표현 학습(MRL)은 전체 임베딩의 접두부(prefix)도 의미를 갖도록 임베딩을 학습한다:

```python
full_embedding = model.encode(text)  # 1024 dimensions

# All these are valid embeddings with decreasing quality
dim_512 = full_embedding[:512]  
dim_256 = full_embedding[:256]
dim_128 = full_embedding[:128]
dim_64 = full_embedding[:64]
```

### 왜 중요한가

| 사용 사례 | 차원 | 트레이드오프 |
|----------|-----------|----------|
| 전체 검색 | 1024-3072 | 최고 정확도 |
| **2단계 검색** | 128 -> 1024 | **프로덕션 표준**: 128차원으로 1000개 검색, 상위 100개를 1024차원으로 정제 |
| 비용 민감 | 256 | 3,072차원 대비 12배 저장 절감; OpenAI는 256차원 text-embedding-3-large도 MTEB에서 풀사이즈 ada-002를 앞선다고 보고 |
| 엣지/모바일 | 64 | 최대 속도, 단순 의도 처리 |

### Matryoshka 지원 모델

- OpenAI text-embedding-3-*(네이티브)
- Google gemini-embedding-2(128~3,072)
- Cohere Embed 5(256~2,048)와 Voyage 4 계열(voyage-code-4 포함, 256~2,048)
- 오픈 가중치: Nemotron 3 Embed, Qwen3-Embedding, Nomic-embed-text-v1.5
- 여러 파인튜닝 모델

### Matryoshka 임베딩 사용

```python
from openai import OpenAI
client = OpenAI()

# Request smaller dimensions
response = client.embeddings.create(
    model="text-embedding-3-large",
    input="Your text here",
    dimensions=256  # Request 256 instead of full 3072
)
```

---

## 레이트 청킹과 레이트 인터랙션

### 레이트 청킹(Late Chunking)

**전통적 청킹:**
`문서 -> 청크로 분할 -> 청크를 개별 임베딩`
- **문제**: 청크 2가 청크 1의 문맥을 잃는다.

**레이트 청킹(Jina AI, 2024 도입):**
`전체 문서 -> 모델 인코더 -> 토큰 수준 임베딩 -> 청크 경계로 풀링`
- **이점**: 풀링 전에 트랜스포머의 셀프 어텐션이 전체 시퀀스에 적용되므로, 각 청크의 임베딩이 **문서 전체**의 정보를 담는다.
- **요구**: 장문맥 지원 모델(최소 8k+ 토큰).

**문맥화 청크 임베딩 모델**은 이제 이 아이디어를 제품으로 제공하므로, 청크마다 LLM 호출 없이 문서 인식 청크 벡터를 얻는다:
- **voyage-context-4**(2026-06-29 GA, 100만 토큰당 $0.12): 전체 문서 문맥을 인코딩하는 청크당 한 벡터, 내장 자동 청킹, 32K 창을 넘는 문서의 투명한 처리. Voyage는 39개 데이터셋에서 voyage-context-3 대비 청크 수준 2.08% 향상을 보고.
- **pplx-embed-v2-context-9b-preview**(Perplexity, 2026-09-25): 문서의 청크들을 2048차원으로 함께 인코딩. 프리뷰이며, 그 임베딩은 이후 릴리스와 섞어 쓰면 안 된다.

이는 청크마다 문맥 설명을 LLM으로 작성하는 문맥 접두 방식과의 비용 비교를 바꾼다.

### 레이트 인터랙션(ColBERT)

ColBERT는 문서당 하나가 아니라 토큰당 하나의 임베딩을 유지하고, 질의 시점에 MaxSim(각 쿼리 토큰이 가장 잘 맞는 문서 토큰과 매칭)으로 점수를 매긴다.

**ColBERT를 쓸 때:**
- 검색 정밀도가 결정적
- 저장 오버헤드를 감당 가능
- 쿼리 지연 예산 > 50ms

**구현:**

```python
# Using RAGatouille
from ragatouille import RAGPretrainedModel

model = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")

# Index documents
model.index(
    collection=documents,
    index_name="my_index"
)

# Search
results = model.search(query="What is RAG?", k=10)
```

---

## 확장을 위한 양자화

수십억 벡터를 다루려면 **이진(Binary)**과 **스칼라(Int8)** 양자화가 표준이며, 회전 기반 1~4비트 방식이 2026년의 추가다.

| 유형 | 데이터 크기 | 메모리 절감 | 품질 손실 | 어디서 얻나 |
|------|-----------|----------------|--------------|------------------|
| Float32 | 4 bytes/dim | 기준선 | 0% | 전부 |
| Int8 | 1 byte/dim | 4x | &lt;1% | 모델 출력(Cohere Embed 4/5, Voyage 4 계열), 대부분 벡터 DB |
| 4비트 회전(RaBitQ, TurboQuant, RQ) | 0.5 byte/dim | 8x | 재점수화 시 작음(벤더 주장) | Qdrant Turbo4(옵트인), Weaviate 4-bit RQ(프리뷰), LanceDB RaBitQ |
| **이진(Binary)** | **1 bit/dim** | **32x** | 약 5~10% | 모델 출력(Cohere, Voyage), 대부분 벡터 DB |

**회전이 돕는 이유:** 무작위 또는 아다마르 회전은 각 벡터의 에너지를 차원 전반에 고르게 퍼뜨려, 균일한 차원별 양자화기가 소수 이상치 차원에 비트를 낭비하지 않게 한다. 이것이 차원당 1~4비트를 쓸 수 있게 하는 핵심이다. 2026년 10월 기준 이 모드들은 기본이 아니라 옵트인/프리뷰다: Qdrant는 1.18에서 아다마르 회전 TurboQuant를, 1.19에서 옵트인 4비트 Turbo4 저장 유형을 추가했고, Weaviate는 1.39에서 4비트 회전 양자화를 프리뷰(7.84배 압축)했으며, LanceDB는 정제 단계 없이 멀티비트 RaBitQ로 96% 재현율을 보고한다(벤더 주장). Elasticsearch는 예외다: BBQ(차원당 약 1비트)가 9.1부터 384+차원 float `dense_vector` 필드의 기본이고, DiskBBQ(`bbq_disk`)는 라이선스에 포함된 경우 9.4부터 기본이며, 9.5는 대칭 1비트 OSQ 스코어러를 추가했다.

**이진 양자화 패턴**(모든 저비트 방식에 적용):
1. 이진 임베딩으로 상위 1000개 검색(극한 속도).
2. 상위 50개를 Float32(또는 디스크에 보관한 int8 원본)나 크로스 인코더로 리랭킹(최고 정확도).

---

## 실무 고려 사항

### 배치 처리

```python
# Inefficient: one API call per document
embeddings = [embed(doc) for doc in documents]

# Efficient: batch API calls
batch_size = 100
embeddings = []
for i in range(0, len(documents), batch_size):
    batch = documents[i:i + batch_size]
    batch_embeddings = embed_batch(batch)
    embeddings.extend(batch_embeddings)
```

### 임베딩을 위한 청킹

긴 문서는 임베딩 전에 청킹해야 한다:

```python
def embed_document(document: str, max_tokens: int = 512) -> list[np.array]:
    chunks = chunk_document(document, max_tokens=max_tokens)
    embeddings = []
    for chunk in chunks:
        embedding = embed(chunk)
        embeddings.append(embedding)
    return embeddings
```

**고려 사항:**
- 청크 크기는 모델 최대 토큰보다 작아야 함
- 오버랩이 청크 경계의 문맥 보존에 도움
- 검색을 위해 청크-문서 매핑을 저장

### 정규화

많은 시스템이 정규화된 임베딩을 기대한다:

```python
def normalize(embedding):
    norm = np.linalg.norm(embedding)
    return embedding / norm

# Cosine similarity of normalized vectors = dot product
similarity = np.dot(normalize(a), normalize(b))
```

대부분의 벡터 DB와 임베딩 API가 정규화를 처리하지만, 확인하라.

### 캐싱

임베딩 계산은 비싸다. 적극적으로 캐시하라:

```python
import hashlib

def get_embedding(text: str, cache: dict) -> np.array:
    key = hashlib.sha256(text.encode()).hexdigest()
    
    if key in cache:
        return cache[key]
    
    embedding = compute_embedding(text)
    cache[key] = embedding
    return embedding
```

---

## 임베딩 드리프트와 버전 관리

### 문제

임베딩은 다음에 걸쳐 비교할 수 없다:
- 다른 모델
- 같은 모델의 다른 버전
- 때로는 다른 API 호출(일부 API는 비결정성 있음)

### 결과

임베딩 모델을 업데이트하면:
- 기존 모든 임베딩이 호환되지 않음
- 전체 코퍼스를 다시 임베딩해야 함
- 마이그레이션 중 검색 결과가 일관되지 않음

### 완화 전략

**1. 임베딩에 버전을 매겨라:**
```python
embedding_metadata = {
    "model": "text-embedding-3-large",
    "model_version": "2024-01",
    "dimensions": 3072,
    "created_at": "2025-12-16"
}
```

**2. 재임베딩을 계획하라:**
- 전체 재임베딩의 비용·시간 추정
- 백그라운드 실행 파이프라인 구축
- 전환 전 새 임베딩 테스트

**3. 블루-그린 배포:**
```
Index A: Current embeddings
Index B: New embeddings (building)

Query -> Both indexes -> Merge or switch
```

**4. 임베딩 품질 추적:**
- 검색 지표 지속 모니터링
- 임베딩 분포의 드리프트 탐지
- 품질 저하 시 경보

**5. 공유 임베딩 공간이 있으면 활용하라:**
Voyage 4 계열(large·base·lite)이 한 공간을, Cohere Embed 5 Pro·Fast가 한 공간을 공유하므로, large로 색인하고 small로 질의하거나 이후 쿼리 모델을 바꿀 때 재색인이 필요 없다. Qdrant의 Constella 리서치 프리뷰(2026-09-29)는 이를 더 밀어붙인다: 고정된 Stella 문서 색인에 교체 가능한 초소형 쿼리 인코더를 붙이는데, Qdrant는 Constella Nano(3,450만 파라미터)가 CPU 쿼리 인코딩 12배 속도로 Stella BEIR nDCG@10의 약 91%를 유지한다고 보고한다. 공유 공간은 계열 내에서만 유효하며, 다른 벤더로 옮기면 여전히 전체 재구축이다.

**6. 임베더의 소유자를 파악하라:**
DB 내 임베딩(MongoDB Atlas Automated Embedding, 2026-08-13 GA; turbopuffer 네이티브 임베딩, 2026-09-29 GA; Elasticsearch `semantic_text`)은 동기화 파이프라인을 없애지만, 색인을 벤더가 고른 모델 버전에 묶는다. 모델을 고정하고, 벤더가 모델 업그레이드를 어떻게 다루는지, 재임베딩 비용은 누가 내는지 확인하라.

---

## 면접 질문

### Q: 임베딩 모델은 어떻게 의미 유사성을 학습하는가?

**좋은 답변:**
임베딩 모델은 대조 학습으로 학습된다. 목표는 의미적으로 유사한 텍스트의 임베딩을 가깝게, 비유사한 텍스트를 멀게 만드는 것이다.

학습 과정:
1. 양성 쌍: 유사해야 할 텍스트(쿼리-문서 쌍, 패러프레이즈, 번역)
2. 음성 쌍: 비유사해야 할 텍스트(흔히 같은 배치나 BM25 하드 네거티브)
3. 손실 함수: 양성 쌍을 가깝게, 음성 쌍을 멀게 민다

모델은 거리가 의미 유사성과 상관되는 고차원 공간에 텍스트를 배치하도록 학습한다. 이로써 검색이 가능하다: 쿼리를 임베딩하고 문서 임베딩 공간에서 최근접 이웃을 찾는다.

E5, BGE, Qwen3-Embedding 같은 현대 모델은 명령 튜닝도 되어, 과제 명령을 접두로 붙여 임베딩을 특화한다. Nemotron 3 Embed 같은 다른 모델은 고정된 `query:`·`passage:` 접두를 쓴다. 잘못된 접두는 조용히 검색 품질을 떨어뜨린다.

### Q: 바이 인코더 대신 ColBERT를 언제 쓰겠는가?

**좋은 답변:**
ColBERT는 레이트 인터랙션을 쓴다: 문서당 하나가 아니라 토큰당 임베딩을 유지하고, 질의 시점에 토큰 수준 유사도를 계산한다.

ColBERT를 택할 때:
- 검색 정밀도가 결정적(법률, 의료, 고위험)
- 문서당 10~100배 저장 오버헤드 감당 가능
- 쿼리 지연 예산 50ms+(바이 인코더보다 약간 느림)
- 질의가 어휘 매칭(기술 용어)에서 이득

바이 인코더를 택할 때:
- 저장이 제약됨
- 20ms 미만 지연 필요
- 바이 인코더의 검색 정밀도로 충분
- 잦은 재색인(ColBERT 재색인은 비쌈)

실무에서 흔한 패턴: 1단계 검색은 바이 인코더(상위 100), 이후 크로스 인코더나 ColBERT로 리랭킹.

### Q: 모델 업데이트 시 임베딩 드리프트를 어떻게 다루는가?

**좋은 답변:**
임베딩 모델은 같은 모델에 대해서만 의미 있는 벡터를 만든다. 모델을 업데이트하면 모든 과거 임베딩이 호환되지 않는다.

내 접근:
1. **제자리 업데이트 금지.** 새 임베딩으로 병렬 색인 생성.
2. **전환 전 테스트.** 테스트 세트에서 과거·신규 임베딩의 검색 품질 비교.
3. **백그라운드 재구축.** 새 모델로 전체 코퍼스 재임베딩.
4. **원자적 전환.** 새 색인이 완성·검증되면 트래픽을 원자적으로 전환.
5. **롤백 계획.** 빠른 롤백을 위해 과거 색인 유지.

비용 추정: 평균 500 토큰 문서 1000만 개가 있고 text-embedding-3-large가 100만 토큰당 $0.13이면, 재임베딩 비용은 약 $650이다. 모델 업데이트를 고려할 때 이 비용을 계획하라. API 청구액은 보통 작은 부분이고, 색인 재구축 시간·이중 색인 저장·평가 실행이 더 든다.

언급할 만한 예외 하나: 공유 공간 계열(Voyage 4, Cohere Embed 5 Pro·Fast) 안에서는 문서 색인을 건드리지 않고 쿼리측 모델을 바꿀 수 있다. 문서측 모델 변경은 여전히 전체 재구축이 필요하다.

### Q: 임베딩 차원은 어떻게 고르는가?

**좋은 답변:**
높은 차원은 더 많은 정보를 담지만 저장·연산 비용이 든다.

고려 사항:
- **저장:** 1024차원 float32 = 임베딩당 4 KB. 1000만 문서 = 임베딩만 40 GB.
- **검색 속도:** 높은 차원 = 느린 최근접 이웃 검색.
- **품질:** 대부분 과제에서 일정 차원 이상은 수확 체감.

실무 접근:
1. 모델 권장 차원에서 시작.
2. Matryoshka 모델(text-embedding-3 등)이면 자신의 과제에서 더 낮은 차원 실험.
3. 자신의 쿼리로 각 차원의 품질을 벤치마크. OpenAI 공개 수치가 하한을 제시한다: 256차원으로 줄인 text-embedding-3-large도 풀사이즈 ada-002(MTEB 평균 61.0)를 앞서며, 3,072차원 64.6 대비 그 벤치마크의 94% 이상을 유지한다. 좁은 도메인은 더 잃을 수 있다.
4. 2단계 검색: 1단계는 낮은 차원, 리랭킹은 전체 차원.

대부분 애플리케이션은 768~1024차원이 좋은 균형이다. 예외는 2048~4096이 도움될 수 있는 초고정밀 요구다.

### Q: 임베딩 대신 그냥 LLM에 관련성을 판단시키면 안 되나?

**좋은 답변:**
동등한 성능의 비용이 몇 자릿수 더 비싸기 때문이다. "The Embedder's Dilemma"(arXiv 2608.12875, 2026년 8월)는 10개 LLM과 26개 임베딩 모델을 37개 과제에서 비교했다. 종합하면 비긴다: 최고 LLM(Gemini 3.1 Pro) 77.6, 최고 임베더 77.2. 하지만 임베더를 따라잡는 데 최대 1,431배 비용(벤치마크 통과당 $154 vs $0.11)이 들었고, 오픈 LLM은 같은 GPU에서 2.5~736배 느렸으며, 추론 토큰이 LLM 비용의 28~81%였다.

따르는 분할:
- **임베딩**은 코퍼스 전체에 대한 1단계 유사도: 사전 계산, 저렴, 밀리초 조회.
- **크로스 인코더나 리스트와이즈 리랭커**를 상위 50~100개에.
- **LLM 심판은 마지막에만**, 소수 후보에 대해, 논문이 LLM이 실제로 앞선다고 본 추론 집약 쿼리에만. 낮은 추론 예산도 대개 검색 품질을 유지했으니, 그 심판은 낮은 effort로 돌려라.

---

## 참고 문헌

- Reimers and Gurevych. "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks" (2019)
- Khattab and Zaharia. "ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT" (2020)
- Wang et al. "Text Embeddings by Weakly-Supervised Contrastive Pre-training" (E5, 2022)
- Xiao et al. "C-Pack: Packaged Resources To Advance General Chinese Embedding" (BGE, 2023)
- Kusupati et al. "Matryoshka Representation Learning" (MRL, 2022)
- Günther et al. "Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models" (2024)
- "The Embedder's Dilemma" (arXiv 2608.12875, 2026)
- MTEB Leaderboard (includes RTEB): https://huggingface.co/spaces/mteb/leaderboard
- OpenAI Embeddings Guide: https://platform.openai.com/docs/guides/embeddings

---

*이전: [트랜스포머 아키텍처](04-transformer-architecture.md) | 다음: [추론 파이프라인](06-inference-pipeline.md)*
