---
title: 문맥 검색
sidebar_position: 10
description: RAG 실패 1위 원인(출처 문서에서 분리되면 의미를 잃는 청크)을 해결하는 수집 시 기법 — 문맥 희석, 문맥 임베딩, 문맥 BM25, 하이브리드+재순위 전체 파이프라인, 비용, 프로덕션 아키텍처.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/06-retrieval-systems/10-contextual-retrieval.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 문맥 검색

문맥 검색(Contextual Retrieval)은 RAG 실패의 1위 원인 — **출처 문서에서 분리되면 의미를 잃는 청크** — 을 해결하는 수집 시 기법이다. 2024년 말 Anthropic이 개척, 이제 고정밀 검색의 프로덕션 표준. Anthropic 자체 측정은 문맥 임베딩 + 문맥 BM25로 top-20 검색 실패 49% 감소, 재순위 추가 시 67%.

## 문제: 문맥 희석

RAG용으로 문서를 청킹하면 개별 청크가 의미를 주던 주변 문맥을 잃는다.

**문맥 희석 예시:**

```
Original Document: "Acme Corp Q3 2025 Financial Report"
  Section 4: Product Pricing

  "The Standard plan costs $200/month. The Enterprise
   plan includes SSO and audit logs for $800/month."

-------- After Chunking --------

Chunk 17: "It costs $200/month."
Chunk 18: "The Enterprise plan includes SSO and audit
           logs for $800/month."
```

**Chunk 17의 문제**: "Acme Standard plan은 얼마?"를 검색하는 사용자는 "Acme"·"Standard"·"plan" 언급이 없어 이 청크를 놓칠 가능성이 크다. "It costs $200/month" 임베딩은 쿼리와 의미적으로 멀다.

**통찰**: Anthropic 연구는 전통 청킹이 top-20 검색 청크에 **5.7% 검색 실패율**을 유발함을 보였다. 지식 베이스에 존재해도 약 18개 쿼리 중 1개가 관련 정보 검색에 실패한다는 뜻.

---

## 문맥 검색 작동 방식

핵심 아이디어는 단순: **청크 임베딩 전, 그 청크가 전체 문서 안에서 무엇에 관한지 설명하는 짧은 문맥 문자열을 접두**.

```
┌──────────────────────────────────────────────────┐
│              TRADITIONAL CHUNKING                │
│                                                  │
│  Document ──► Split ──► Chunks ──► Embed ──► DB  │
│                                                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              CONTEXTUAL RETRIEVAL                            │
│                                                              │
│  Document ──► Split ──► Chunks ──┐                           │
│                                  ├──► Contextualize ──►      │
│  Document (full) ───────────────┘    (LLM call per chunk)    │
│                                                              │
│  ──► Contextual Chunks ──► Embed ──► DB                      │
│                            + BM25 Index                      │
└──────────────────────────────────────────────────────────────┘
```

**문맥화 단계**는 전체 문서 + 개별 청크를 다음 프롬프트로 LLM에 보낸다:

```
<document>
{{WHOLE_DOCUMENT}}
</document>

Here is the chunk we want to situate within the whole document:
<chunk>
{{CHUNK_CONTENT}}
</chunk>

Please give a short succinct context to situate this chunk
within the overall document for the purposes of improving
search retrieval of the chunk. Answer only with the succinct
context and nothing else.
```

**Chunk 17 결과**:

```
Before: "It costs $200/month."

After:  "This chunk is from the Acme Corp Q3 2025 Financial
         Report, Section 4 on Product Pricing. It describes
         the cost of the Standard plan.
         It costs $200/month."
```

이제 이 청크 임베딩이 "Acme"·"Standard plan"·"Product Pricing" — 사용자가 자연히 검색할 모든 용어 — 를 담는다.

---

## 문맥 임베딩

문맥 임베딩이 첫 하위 기법: 원시 청크 대신 문맥화 청크를 임베딩.

### 검색을 개선하는 방식

| 시나리오 | 원시 청크 임베딩 | 문맥 임베딩 |
|----------|--------------------|-----------------------|
| "Acme pricing" 질문 | "It costs $200" 놓침 | "Acme...Standard plan...costs $200" 매치 |
| "SSO features" 질문 | "SSO and audit logs" 매치 | "Enterprise plan" 문맥 추가로 매치 |
| "Q3 financials" 질문 | 매치 없음(Q3 언급 없음) | 접두된 "Q3 2025 Financial Report"로 매치 |

**성능**: 문맥 임베딩만으로 top-20 검색 실패를 **5.7%→3.7%**, **35% 감소**.

### 벡터 공간 이동

```
                    ▲ Dimension 2
                    │
                    │    ● "Acme pricing" (query)
                    │         \
                    │          \  close (contextual)
                    │           \
                    │            ● Contextualized chunk
                    │
                    │                          ● Raw chunk "It costs $200"
                    │                            (far from query)
                    │
                    └─────────────────────────────► Dimension 1
```

---

## 문맥 BM25

둘째 하위 기법은 같은 문맥화를 적용해 강화 청크 위 **BM25 키워드 인덱스**를 만든다.

### BM25가 여전히 중요한 이유

dense 임베딩은 의미 유사도에 뛰어나나 다음에 실패:
- **정확 용어**: 제품 ID, 버전 번호, 약어
- **희귀 토큰**: 임베딩 모델이 과소 표현하는 도메인 전문 용어
- **고유명사**: 회사·사람·장소명

**예**: "Widget-X pricing"을 검색하는 사용자는 원시 청크 "It costs $200/month"에 "Widget-X"가 없어 BM25 매치 0. 문맥 BM25로 접두 문맥이 "Widget-X"를 키워드로 포함해 BM25 매치 가능.

### 성능 이득(누적)

| 구성 | 실패율 | 기준선 대비 감소 |
|---------------|-------------|----------------------|
| 전통 임베딩(기준선) | 5.7% | -- |
| 문맥 임베딩만 | 3.7% | 35% |
| 문맥 임베딩 + 문맥 BM25 | 2.9% | **49%** |
| 문맥 임베딩 + 문맥 BM25 + 재순위 | 1.9% | **67%** |

**요점**: 문맥 임베딩 + 문맥 BM25 조합이 RAG 파이프라인에 가할 수 있는 최고 레버리지 단일 변경. 위에 재순위기를 더하면 실패 67% 감소.

---

## 전체 파이프라인: 하이브리드 + 재순위

프로덕션급 문맥 검색 파이프라인은 네 단계:

```
┌─────────────────────────────────────────────────────────────────┐
│                     INGESTION PIPELINE                          │
│                                                                 │
│  1. Chunk documents (recursive, 300-500 tokens)                 │
│  2. For each chunk:                                             │
│     a. Send (full_doc + chunk) to LLM                           │
│     b. Get context string (50-100 tokens)                       │
│     c. Prepend context to chunk                                 │
│  3. Embed contextualized chunks ──► Vector DB                   │
│  4. Index contextualized chunks ──► BM25 Index                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     QUERY PIPELINE                              │
│                                                                 │
│  User Query                                                     │
│      │                                                          │
│      ├──► Vector Search (Top 50) ──┐                            │
│      │                             ├──► RRF Fusion (Top 25)     │
│      └──► BM25 Search (Top 50)  ──┘         │                   │
│                                             ▼                   │
│                                      Reranker (Top 5)           │
│                                             │                   │
│                                             ▼                   │
│                                     LLM Generation              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 결과 결합용 RRF

표준 하이브리드 검색과 같은 RRF 기법 적용:

```
RRF_Score(doc) = sum( 1 / (k + rank_in_list) )
                 for each list where doc appears

k = 60 (standard smoothing constant)
```

---

## 구현 패턴

### 패턴 1: 기본 문맥 검색(Python)

```python
import anthropic
from typing import List

client = anthropic.Anthropic()

CONTEXT_PROMPT = """<document>
{document}
</document>

Here is the chunk we want to situate within the whole document:
<chunk>
{chunk}
</chunk>

Please give a short succinct context to situate this chunk
within the overall document for the purposes of improving
search retrieval of the chunk. Answer only with the succinct
context and nothing else."""


def contextualize_chunk(
    full_document: str,
    chunk: str,
    model: str = "claude-haiku-4-5"  # small model: context strings are short and factual
) -> str:
    """Generate context for a single chunk."""
    response = client.messages.create(
        model=model,
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": CONTEXT_PROMPT.format(
                document=full_document,
                chunk=chunk
            )
        }]
    )
    # Read the text block, not content[0]: on models with thinking on
    # (Sonnet 5.5, Opus 5.5), a thinking block comes first.
    context = next(b.text for b in response.content if b.type == "text")
    return f"{context}\n\n{chunk}"


def process_document(document: str, chunks: List[str]) -> List[str]:
    """Contextualize all chunks in a document."""
    contextualized = []
    for chunk in chunks:
        ctx_chunk = contextualize_chunk(document, chunk)
        contextualized.append(ctx_chunk)
    return contextualized
```

### 패턴 2: 프롬프트 캐싱으로 비용 최적화

가장 큰 비용 동인은 청크마다 전체 문서를 보내는 것. **프롬프트 캐싱**이 해결:

```python
def contextualize_with_caching(
    full_document: str,
    chunks: List[str],
    model: str = "claude-haiku-4-5"
) -> List[str]:
    """
    Use prompt caching so the full document is only
    processed once across all chunks.
    """
    results = []

    for chunk in chunks:
        response = client.messages.create(
            model=model,
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"<document>\n{full_document}\n</document>",
                        "cache_control": {"type": "ephemeral"}
                    },
                    {
                        "type": "text",
                        "text": (
                            f"<chunk>\n{chunk}\n</chunk>\n\n"
                            "Please give a short succinct context to "
                            "situate this chunk within the overall "
                            "document for the purposes of improving "
                            "search retrieval of the chunk. Answer "
                            "only with the succinct context and "
                            "nothing else."
                        )
                    }
                ]
            }]
        )
        context = next(b.text for b in response.content if b.type == "text")
        results.append(f"{context}\n\n{chunk}")

    return results
```

**프롬프트 캐싱의 비용 영향**: 30 청크로 분할된 1만 토큰 문서에서 프롬프트 캐싱은 문서 입력 비용을 약 **85%** 절감: 30 전가 읽기 대신 입력가 1.25배 캐시 쓰기 1회 + 0.1배 읽기 29회.

세 운영 함정이 그 절감을 지운다:
- **인터리빙·콜드 팬아웃.** 기본 캐시 TTL은 5분. 한 문서 모든 청크를 그 윈도 안에 스케줄; 문서 청크를 수 시간에 퍼뜨리는 큐는 모든 호출을 캐시 쓰기로. 첫 호출을 단독으로 보내고 반환 후 나머지 팬아웃: 병렬 첫 호출은 모두 미스하고 쓰기 지불.
- **짧은 문서.** 최소 캐시 가능 프리픽스가 모델마다 다름: Haiku 4.5 4,096 토큰, Opus 5.5·Fable 5.1 512. 3,000 토큰 문서는 Haiku 4.5에서 조용히 캐시 안 됨; 가정 말고 `usage.cache_read_input_tokens` 확인.
- **은퇴 모델 ID.** 날짜 모델 ID는 은퇴: `claude-sonnet-4-20250514`가 2026-06-15 Claude API 떠나 하드코딩한 모든 파이프라인이 깨짐. 모델 ID를 코드가 아닌 설정에, 생성된 모든 문맥 문자열 옆에 저장.

### 패턴 3: 문맥 청크 헤더(경량 대안)

LLM 기반 문맥화가 너무 비싸면 결정적 대안으로 **문맥 청크 헤더(CCH)** 사용:

```python
def add_chunk_headers(
    document_title: str,
    section_hierarchy: List[str],
    chunk: str
) -> str:
    """
    Prepend document and section metadata to the chunk.
    No LLM call required: purely structural.
    """
    header_parts = [f"Document: {document_title}"]

    for i, section in enumerate(section_hierarchy):
        prefix = "  " * i
        header_parts.append(f"{prefix}Section: {section}")

    header = "\n".join(header_parts)
    return f"{header}\n\n{chunk}"


# Example usage:
contextualized = add_chunk_headers(
    document_title="Acme Corp Q3 2025 Financial Report",
    section_hierarchy=["Finance", "Product Pricing", "Standard Plan"],
    chunk="It costs $200/month."
)

# Result:
# Document: Acme Corp Q3 2025 Financial Report
#   Section: Finance
#     Section: Product Pricing
#       Section: Standard Plan
#
# It costs $200/month.
```

**CCH vs LLM 문맥화를 쓸 때:**

| 요인 | 청크 헤더(CCH) | LLM 문맥화 |
|--------|--------------------|-----------------------|
| **비용** | 무료(LLM 호출 없음) | 캐싱 시 1M 문서 토큰당 약 $0.50(GPT-6 Luna)~$5(Claude Haiku 4.5) |
| **품질** | 구조 문서에 좋음 | 모든 문서에 뛰어남 |
| **속도** | 즉시 | 호출당 0.5-2초; 처리량은 동시성에서 |
| **적합** | 명확한 헤더의 Markdown·HTML·PDF | 비구조 텍스트, 법률, 의료 |

---

## 비용 고려사항

### 문맥화 비용

8,000 토큰 500 문서에서 뽑은 1만 청크(각 400 토큰) 지식 베이스에, 문서 캐시 + 호출당 약 500 미캐시 프롬프트 토큰·75 출력 토큰, 2026-10-01 정가:

| 옵션 | 1M당 가격(입력/캐시읽기/출력) | 청크당 비용 | 총 비용 | 비고 |
|--------|--------------------------------------|----------------|------------|-------|
| **GPT-6 Luna** | $0.10 / $0.01 / $0.50 | 약 $0.0002 | 약 $2 | OpenAI 자동 캐시; 1.25배 쓰기, 30분 TTL 고정 |
| **Claude Haiku 4.5** | $1 / $0.10 / $5 | 약 $0.002 | 약 $21 | 기본 사고 없음; 4,096 토큰 최소 캐시 프리픽스 |
| **Claude Sonnet 5.5** | $2 / $0.20 / $10 | 약 $0.004 | 약 $43 + 사고 | 기본 사고 켜짐; 이 작업엔 `thinking: {type: "between_tools"}`·낮은 노력 |
| **Claude Opus 5.5** | $4 / $0.20 / $20 | 약 $0.007 | 약 $70 + 사고 | 사고 비활성 불가; 이 작업엔 과함 |
| **voyage-context-4**(LLM 호출 없음) | $0.12 임베딩 | 약 $0.00005 | 약 $0.50 | 임베딩 단계 대체; dense 검색만 도움(아래) |

**베스트 프랙티스**: 문맥화엔 작은 모델. 문맥 문자열이 짧고 사실적이라 프런티어 모델은 비용과, 최신 Claude 모델에선 추론 토큰(기본 켜짐, Opus 5.5는 비활성 불가)을 측정 가능한 품질 이득 없이 더한다. 프롬프트 캐싱과 결합하고, 기다릴 수 있는 백필은 Batch API(Anthropic·OpenAI 모두 정가 50% 할인)로.

Haiku 4.5가 여전히 유일한 Haiku; Haiku 5.5는 "앞으로 몇 주" 발표됐으나 2026-10-01엔 미출시. Haiku 4.5는 Microsoft Foundry에서 2026-11-15 은퇴. Claude API엔 아직 폐기 통지 없고 Anthropic은 최소 60일 제공. 문맥화기를 교체 가능 의존으로 다뤄라.

### 언제 문맥 검색을 쓰나

**쓸 때:**
- 코퍼스에 고립 시 청크가 의미를 잃는 파편 문서
- 임베딩 모델이 어려워하는 도메인 전문 용어
- 검색 실패율 3-5% 초과
- 일회성 수집 비용 감당 가능

**건너뛸 때:**
- 청크가 이미 자립적(FAQ 쌍, 제품 설명)
- 코퍼스가 작음(100 청크 미만); 장문맥 사용
- 실시간 수집 필요(문서당 1초 미만)이고 배치 불가

---

## 문맥 검색 vs 다른 접근

| 접근 | 작동 | 검색 개선 | 비용 | 복잡도 |
|----------|-------------|----------------------|------|------------|
| **나이브 청킹** | 고정 크기 분할, 원시 임베딩 | 기준선 | 없음 | 낮음 |
| **청크 헤더(CCH)** | 문서·섹션 제목 접두 | 10-20% | 없음 | 낮음 |
| **문맥 검색** | 청크당 LLM 생성 문맥 | 35-49% | 1만 청크당 약 $2-45(소~중 모델) | 중간 |
| **문맥 + 재순위** | 위 + 크로스 인코더 재순위 | 67% | 위 + 쿼리당 재순위 요금 | 중-고 |
| **문맥 청크 임베딩** | 임베더가 전체 문서를 보고 청크당 벡터 1개 | dense 쪽만; Anthropic 벤치 미측정 | 1만 청크당 약 $0.50 | 낮음 |
| **HyDE** | 쿼리 시 가설 문서 생성 | 20-40% | 쿼리당 LLM 비용 | 중간 |
| **부모-자식 청킹** | 자식 임베딩, 부모 검색 | 15-30% | 없음 | 중간 |

**핵심 구별**: 문맥 검색은 **수집 시** 기법(한 번 지불), HyDE는 **쿼리 시** 기법(쿼리당 지불). 고볼륨 시스템엔 문맥 검색이 훨씬 잘 분산된다.

### 문맥 검색 vs 레이트 청킹

**레이트 청킹**(Jina, 2024)은 관련되나 구별되는 접근:

```
Contextual Retrieval:
  Chunk ──► LLM adds context ──► Embed enriched chunk

Late Chunking:
  Full doc ──► Long-context embed model ──► Token embeddings
  ──► THEN chunk the token embeddings (preserving context)
```

레이트 청킹은 장문맥 임베딩 모델(예: Jina v3)이 필요하고 LLM 호출을 전혀 안 한다. 명시 텍스트 접두 대신 임베딩 모델 어텐션으로 문맥 보존. 트레이드오프는 레이트 청킹이 BM25엔 도움 안 되고 dense 검색만 돕는다는 것.

### 문맥화 청크 임베딩 모델

같은 아이디어가 이제 호스팅 임베딩 API로 출시돼, 위 표의 수집 비용을 Claude 문맥화기 대비 한두 자릿수 절감:

- **voyage-context-4**(Voyage AI, GA 2026-06-29): 전체 문서 문맥을 인코딩하는 청크당 벡터 1개, 내장 자동 청킹(`enable_auto_chunking=True`), 네이티브 오버랩 청크, 32K 윈도보다 긴 문서의 투명 처리. 1M당 $0.12(voyage-context-3 $0.18에서 인하). Voyage는 39 데이터셋 전반 context-3 대비 청크 수준 2.08%·문서 수준 1.4% 이득 보고(벤더). MongoDB Atlas로도 서빙.
- **pplx-embed-v2-context-9b-preview**(Perplexity, Hugging Face, 2026-09-25): 문서 청크를 함께 인코딩, 2,048차원(마트료시카 1,024), 네이티브 int8 출력, 별도 `encode_queries`·`encode` 경로. 명시적 프리뷰, 임베딩을 이후 릴리스와 섞으면 안 되니 프로덕션 인덱스가 아닌 평가 후보로.

| | LLM 문맥화 | 문맥 청크 임베딩 |
|---|---|---|
| **수집 비용(1만 청크)** | 약 $2-45 + 임베딩 | 약 $0.50, 임베딩 대체 |
| **BM25 도움** | 예(문맥 텍스트 인덱싱) | 아니오 |
| **디버그 가능** | 예, 문맥 문자열 읽기 가능 | 아니오, 문맥이 벡터 내부 |
| **종속** | 문맥 문자열이 임베더 교체에도 생존 | 인덱스가 한 벤더 모델에 묶임; 전환엔 재임베딩 |
| **문서 편집** | 변경 청크 재문맥화 | 전체 문서 재임베딩 |

**합리적 2026 기본값**: dense엔 문맥 청크 임베딩, BM25엔 결정적 청크 헤더, LLM 문맥화는 둘 다 여전히 놓치는 문서 종류에만(지불 전 골든셋 측정).

---

## 프로덕션 아키텍처

### 참조 아키텍처: 대규모 문맥 RAG

```
┌─────────────────────────────────────────────────────────────────────┐
│                     INGESTION SERVICE                               │
│                                                                     │
│  Document Store ──► Chunker ──► Contextualization Queue             │
│                       │              │                              │
│                       │         ┌────┴────┐                         │
│                       │         │ Workers  │ (N parallel LLM calls) │
│                       │         │ + Cache  │                        │
│                       │         └────┬────┘                         │
│                       │              │                              │
│                       ▼              ▼                              │
│                  Raw Chunks    Contextualized Chunks                 │
│                       │              │                              │
│                       │         ┌────┴────┐                         │
│                       │         │ Embed + │                         │
│                       │         │ BM25    │                         │
│                       │         └────┬────┘                         │
│                       │              │                              │
│                       ▼              ▼                              │
│                  Metadata DB    Vector DB + BM25 Index               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     QUERY SERVICE                                   │
│                                                                     │
│  Query ──► [Vector Search] + [BM25 Search]                          │
│                    │               │                                │
│                    └───── RRF ─────┘                                │
│                           │                                         │
│                      Top 25 chunks                                  │
│                           │                                         │
│                      Reranker (Cohere Rerank 4, Voyage rerank-3,    │
│                      or a self-hosted cross-encoder)                │
│                           │                                         │
│                      Top 5 chunks                                   │
│                           │                                         │
│                      LLM Generation                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 확장 고려사항

| 관심사 | 해법 |
|---------|----------|
| **수집 처리량** | 비동기 워커로 LLM 호출 병렬화(50-100 동시) |
| **문서 갱신** | 변경 청크만 재문맥화; 원시 + 문맥 분리 저장 |
| **대규모 비용** | 작은 모델 + 프롬프트 캐싱, 문서 청크 함께 스케줄; 백필엔 Batch API; 또는 문맥 임베딩 모델 |
| **품질 모니터링** | 청크 1% 샘플링, 문맥 품질 인간 평가 |
| **인덱스 일관성** | 문서당 벡터 DB + BM25 인덱스 원자적 갱신 |
| **모델 교체** | 문맥화기 모델 ID·프롬프트 버전을 각 문맥 문자열과 저장. 그 모델 은퇴 시 기존 문자열 유효; 한 인덱스에 스타일 섞기 전 후속 출력 샘플 |

---

## 면접 질문

### Q: Anthropic 문맥 검색을 설명하라. 언제 쓰고 언제 건너뛰나?

**좋은 답변:**
문맥 검색은 RAG의 "문맥 희석" 문제를 해결. 문서가 청킹되면 개별 청크가 의미를 주던 주변 문맥을 잃음: "$200 든다"는 청크는 *무엇*이 $200인지 모르면 쓸모없다. 이 기법은 수집 시 LLM으로 청크당 짧은 문맥 문자열(50-100 토큰)을 생성해 그 청크가 문서 안에서 무엇에 관한지 설명. 이 문맥을 임베딩·BM25 인덱싱 전 청크에 접두.

핵심 결과: 문맥 임베딩만으로 검색 실패 35% 감소. 문맥 BM25 추가로 49%. 재순위 추가로 67%.

청크가 고립 시 정기적으로 의미를 잃을 때 쓴다: 법률 계약, 재무 보고서, 기술 매뉴얼. 청크가 이미 자립적(FAQ, 제품 카드)이거나 장문맥 RAG로 충분한 작은 코퍼스면 건너뛴다.

### Q: 5만 문서 지식 베이스가 문맥 검색이 필요하다. 수집 비용을 어떻게 관리하나?

**좋은 답변:**
네 전략:
1. **모델 선택**: 문맥화엔 작고 빠른 모델(Claude Haiku 4.5·GPT-6 Luna급). 출력이 창작이 아니라 짧은 사실 텍스트. 프런티어 모델은 품질 이득 없이 비용을 더하고, 최신 Claude Opus·Sonnet은 완전히 못 끄는 추론 토큰을 더함.
2. **프롬프트 캐싱**: 모든 청크 문맥화 호출에 전체 문서 캐시, 각 문서 청크를 함께 스케줄해 캐시 TTL 안에 들게. 30 청크 1만 토큰 문서에 문서 입력 비용 약 85% 절감.
3. **계층 접근**: 모든 문서가 LLM 문맥화 필요한 건 아님. 잘 구조화된 문서(헤더 있는 Markdown·HTML)엔 무료인 결정적 CCH(문서 제목 + 섹션 계층 접두). LLM 문맥화는 비구조·모호 문서에 예약.
4. **문맥을 임베더로**: voyage-context-4($0.12/1M) 같은 문맥화 청크 임베딩 모델이 청크당 LLM 호출 없이 문서 인식 청크 벡터 생성. 약 8,000 토큰 5만 문서(4억 토큰)면 Haiku 4.5 + 캐싱 약 $2,000 대신 약 $50. 함정은 dense만 도우니 BM25엔 청크 헤더와 짝짓고 골든셋에서 여전히 실패하는 문서엔 LLM 문맥화 유지.

### Q: 문맥 검색은 검색 품질 개선에서 HyDE와 어떻게 비교되나?

**좋은 답변:**
같은 문제의 다른 면을 해결. 문맥 검색은 수집 시 **문서**를 강화(한 번 지불), HyDE는 검색 시 **쿼리**를 강화(쿼리당 지불). 5만 청크 코퍼스에 일 1만 쿼리 시스템엔 수집 비용이 분산돼 문맥 검색이 훨씬 싸다. HyDE엔 환각 위험도: 가설 문서가 틀린 데이터를 끌어올 수 있음. 실무상 가장 강한 시스템은 둘 다 씀: 수집 강화엔 문맥 검색, 쿼리 측 도움이 필요한 복잡 쿼리엔 HyDE(또는 멀티 쿼리 확장).

---

## 참고 문헌
- Anthropic. "Contextual Retrieval" (2024-09)
- Jina AI. "Late Chunking..." (2024)
- Voyage AI. "voyage-context-3..." (2025)
- Voyage AI. "voyage-context-4" (2026-06)
- Perplexity. "pplx-embed-v2-context-9b-preview" model card (Hugging Face, 2026-09)
- NirDiamant. "RAG Techniques: Contextual Chunk Headers" (GitHub, 2024)

---

*이전: [고급 검색 패턴](09-advanced-retrieval-patterns.md) | 다음: [레이트 인터랙션과 ColBERT](11-late-interaction-colbert.md)*
