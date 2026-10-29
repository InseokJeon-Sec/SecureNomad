---
title: 단기 컨텍스트 관리
sidebar_position: 2
description: 추론이 일어나는 고속 인터페이스인 단기 컨텍스트(L1) 관리 — KV 캐시 타일링과 PagedAttention, 프리픽스 캐싱, 슬라이딩 윈도 vs 요약, 문맥 압축.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/08-memory-and-state/02-short-term-context.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 단기 컨텍스트 관리

단기 컨텍스트(L1 메모리)는 추론이 일어나는 고속 인터페이스다. 잘 관리하는 것은 더 이상 "메시지 목록"이 아니라 **KV 캐시 최적화**·**동적 컨텍스트 할당**, 그리고 대화를 제공자가 캐시할 수 있고 모델이 계속 추론할 수 있는 형태로 유지하는 것이다.

---

## 컨텍스트 수명주기

컨텍스트는 세 단계 거침:
1. **인테이크**: 사용자 쿼리 + 최근 히스토리 + 시스템 지시.
2. **처리**: GPU가 새 토큰의 KV 캐시 계산.
3. **축출**: 한계 도달 시 새것 공간 위해 옛 토큰 제거.

호스팅 API에선 축출을 직접 제어 않음; 보내는 것을 제어. 최신 Claude 모델엔 제약 있음: 이전 턴을 편집하면 안 됨, 아니면 그 뒤 사고 블록 무효. 거기 축출은 메시지 목록 재작성이 아니라 제공자 컴팩션이나 컨텍스트 편집으로([컨텍스트 엔지니어링](https://github.com/ombharatiya/ai-system-design-guide/blob/main/05-prompting-and-context/05-context-engineering.md)(영문) 참고).

---

## KV 캐시 타일링

현대 추론 엔진(vLLM·SGLang·TensorRT-LLM)이 **PagedAttention**이나 동등한 블록 기반 할당기 사용.
- **아이디어**: 문맥에 연속 GPU 메모리 블록 할당 대신, 메모리를 **블록**(페이지)으로 쪼갬.
- **효율**: vLLM 논문이 이전 서빙 시스템이 단편화·과예약으로 KV 캐시 메모리 60-80% 낭비 측정; 페이징이 낭비를 4% 아래로 줄여 같은 하드웨어서 상당히 큰 배치 크기·긴 문맥 윈도 허용.
- **티어**: KV 캐시가 이제 GPU HBM서 호스트 DRAM으로, 그다음 로컬 디스크·오브젝트 스토리지·피어 노드로 넘침(vLLM이 v0.28.0에 디스크 티어 추가; SGLang HiCache가 GPU·CPU·스토리지 걸침), 그래서 긴 세션 프리픽스가 GPU 축출 생존. [PagedAttention](https://github.com/ombharatiya/ai-system-design-guide/blob/main/04-inference-optimization/05-paged-attention.md)·[KV 캐시와 컨텍스트 캐싱](https://github.com/ombharatiya/ai-system-design-guide/blob/main/04-inference-optimization/02-kv-cache-and-context-caching.md)(영문) 참고.

---

## 프리픽스 캐싱

이것이 어느 프로덕션 LLM 스택에나 **지연의 성배**.
- **문제**: 에이전트가 LLM 호출할 때마다 같은 2,000 토큰 시스템 프롬프트 + 50 도구 스키마 전송. 연산 낭비.
- **해법**: **영속 프리픽스 캐싱**. 서버가 프롬프트의 "정적" 부분(프리픽스) KV 캐시를 메모리에 유지.
- **결과**: 메시지의 *새* 부분 연산만 전액 지불(대기). 호스팅 캐시 읽기가 이제 모델별 입력가 약 0.02배-0.25배(대부분 0.1배).
- **멀티테넌트 주의(자체 호스팅)**: 공유 프리픽스 캐시는 타이밍 사이드 채널, 캐시 적중이 측정 가능히 빠르니. vLLM 제어는 요청별 `cache_salt`, 캐시 항목이 테넌트 내서만 공유; 프롬프트에 사설 데이터 있는 곳 어디나 설정. salt가 모든 코드 경로 생존해야: vLLM v0.30.0이 GHSA-935w-9g4m-p28p 수정, 한 Responses API 경로의 도구 연속 턴이 `cache_salt` 떨궈 크로스 테넌트 오라클 재개방, 그래서 v0.30.0 이상 실행.

---

## 슬라이딩 윈도 vs. 요약

| 방법 | 메커니즘 | 장점 | 단점 |
|--------|-----------|-----|-----|
| **슬라이딩 윈도** | 마지막 N 토큰 정확 유지. | 최근에 고충실도. | "Dory" 효과(시작 잊음). |
| **요약** | 옛 턴을 텍스트로 압축. | "핵심 사실" 보존. | 뉘앙스·포맷 손실. |
| **하이브리드** | 마지막 10 턴 + 요약 1. | 양쪽 최선. | 약간 높은 복잡성. |
| **제공자 컴팩션** | API가 옛 턴 요약해 되보낼 컴팩션 블록 반환(Claude API 베타; 온디맨드 모드 2026-09-14 추가). | 프리픽스 캐싱·사고 블록 규칙 온전 유지. | 유지 대상 제어 적음; 요약이 신뢰 경계라 원시 전사 유지. |

---

## 문맥 압축

현 프런티어 스택이 여러 형태 **선택적 드롭** 지원:
- **낡은 도구 결과 지움**: 제공자 컨텍스트 편집(예: Anthropic `clear_tool_uses` 전략)이 옛 도구 출력·사고 블록을 서버 측 제거, 메시지 목록서 삭제 대신.
- **큰 출력 오프로드**: 20K 토큰 검색 결과를 파일에 지속하고 문맥엔 한 줄 참조 유지.
- **토큰 가지치기**: 작은 모델(LLMLingua-2 스타일)로 긴 검색 문서·사용자 메시지를 "추론" 모델 도달 전 압축. 휘발·미캐시 콘텐츠에만 적용.

---

## 면접 질문

### Q: "모델 문맥 윈도"와 "애플리케이션 문맥 윈도"의 차이는?

**좋은 답변:**
**모델 문맥 윈도**는 아키텍처가 정의한 하드 한계(예: GPT-4o 128K, GPT-6.1 Sol 1.05M). **애플리케이션 문맥 윈도**는 엔지니어가 **지연·비용** 관리 위해 설정한 구성(예: 64K 한계). 프로덕션에선 어텐션 오버헤드가 문맥 크기로 증가해 생성 느려지고 품질이 한계 훨씬 전 저하(컨텍스트 부패)하니 매 턴 전 모델 윈도를 드물게 씀. 모델 응답 공간 위해 **버퍼 존** 사용, 추론 모델엔 사고 토큰이 `max_tokens`에 카운트되니 이를 포함해야.

### Q: "프리픽스 캐싱"이 시스템 프롬프트 설계를 어떻게 바꾸나?

**좋은 답변:**
**정적 콘텐츠를 앞으로**, **동적 콘텐츠를 뒤로** 옮기게 강제. 초기 LLM 패턴이 흔히 사용자 이름·날짜를 맨 위에 둠. 그게 프리픽스 캐시 깸. "불변 규칙"·"도구 스키마"를 시작에, (매 턴 바뀌는) "사용자 문맥"을 끝에. 이로 첫 5,000 토큰이 모든 사용자 걸쳐 동일, 추론 서버 캐시 적중 최대화. 도구·지시가 세션 중 바뀌어야 하면 프리픽스 편집 대신 변경 추가(대화 중 시스템 메시지나 Claude의 인라인 도구 추가), OpenAI·Anthropic 둘 다 캐시 진단 노출하니 캐시 적중률을 SLO로 추적.

---

## 참고 문헌
- Kwon et al. "Efficient Memory Management for Large Language Model Serving with PagedAttention" (SOSP 2023)
- Zheng et al. "SGLang: Efficient Execution of Structured Language Model Programs" (RadixAttention, 2024)
- NVIDIA. "Optimizing Inference with TensorRT-LLM" (2025)
- Anthropic. "Prompt Caching: Scale while reducing costs" (2024/2025)
- [Claude API release notes (compaction, context editing)](https://platform.claude.com/docs/en/release-notes/overview)

---

*다음: [장기 메모리](03-long-term-memory.md)*
