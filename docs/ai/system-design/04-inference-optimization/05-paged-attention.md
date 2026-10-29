---
title: PagedAttention
sidebar_position: 5
description: 고처리량 서빙 엔진의 기반 알고리즘 PagedAttention — 연속 메모리 문제, 작동 방식, 블록 매니저, Copy-on-Write KV 공유.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/04-inference-optimization/05-paged-attention.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# PagedAttention

PagedAttention은 고처리량 서빙 엔진(vLLM, SGLang, TensorRT-LLM)의 기반 알고리즘이다. 이전에 LLM 확장성을 제한하던 "메모리 단편화" 문제를 해결한다.

## 연속 메모리 문제

표준 딥러닝 프레임워크는 크고 연속된 블록으로 메모리를 할당한다.
LLM 요청에 대해 `max_sequence_length` 8192 토큰 분량을 미리 할당할 수 있다.

**낭비:**
1. **내부 단편화**: 사용자가 10토큰만 생성하면 예약 블록의 99.9%가 낭비.
2. **외부 단편화**: 총 여유 메모리가 많아도, 메모리가 새 "큰 블록"에 쓰기엔 너무 작은 틈으로 쪼개짐.

---

## PagedAttention 작동 방식(vLLM)

PagedAttention은 OS의 가상 메모리에서 영감을 얻는다.

1. **토큰→블록**: 요청의 KV 캐시를 작고 고정 크기인 **블록**(예: 블록당 16토큰)으로 쪼갬.
2. **논리 vs 물리**: 모델은 연속 시퀀스(논리 메모리)에 주의한다고 여기나, 블록은 VRAM(물리 메모리) 전역에 흩어짐.
3. **룩업 테이블**: **블록 테이블**이 논리 인덱스를 물리 주소로 매핑.

**주 이점**: 메모리 낭비가 ~60-80%에서 **4% 미만**으로.

---

## 가상 메모리 관리(블록 매니저)

서빙 프레임워크(vLLM, SGLang)는 GPU의 "미니 OS"처럼 작동한다.

- **할당**: 새 요청 시작 시 블록 매니저가 빈 물리 블록 집합 배정.
- **선점(Preemption)**: VRAM이 차면 스케줄러가 낮은 우선순위 요청을 선점해 블록을 해방하고, 나중에 재계산이나 느린 계층에서 재로드로 KV 재구축.
- **계층 오프로드**: 블록이 HBM에서 축출될 때 죽어야 하는 건 아니다. vLLM 계층형 KV 오프로딩은 블록을 고정 호스트 DRAM으로, 거기서 디스크·오브젝트 스토리지·피어 노드로 복사; SGLang HiCache도 GPU·호스트 메모리·스토리지 백엔드에 걸쳐 동일. 블록 테이블이 이를 싸게 만든다: 블록은 옮기고 해싱하고 공유할 수 있는 고정 크기 단위다. [KV 캐시와 컨텍스트 캐싱](02-kv-cache-and-context-caching.md) 참고.

---

## KV 캐시 공유(Copy-on-Write)

PagedAttention은 "공통 프리픽스"의 손쉬운 공유를 가능하게 한다.

**시나리오**: 100명이 같은 5,000토큰 시스템 프롬프트로 챗.
- **전통**: 그 5,000토큰 KV 캐시를 100번 저장(VRAM에 **50만 토큰**).
- **PagedAttention**: 블록 테이블로 **한 번** 저장하고 100명 모두 같은 물리 블록을 가리킴.
- **Copy-on-Write**: 사용자가 고유 토큰을 생성하면 그만을 위한 새 블록이 생기고, 공유 블록은 변경되지 않음.

**엔진이 공유 프리픽스를 찾는 법.** vLLM 자동 프리픽스 캐싱은 각 전체 블록을 그 앞 모든 것의 해시와 함께 해싱해, 동일 프리픽스가 동일 블록 해시로 매핑; SGLang RadixAttention은 같은 정보를 래딕스 트리에 유지. 두 프로덕션 세부:
- **분산 KV 공유 적중엔 해시가 노드 간 결정적이어야.** vLLM v0.29.0이 프리픽스 캐시 루트 해시를 결정적으로 만들어, 레플리카 간 `PYTHONHASHSEED` 고정이 더 이상 필요 없다.
- **공유는 테넌시를 존중해야.** 공유 블록은 타이밍 사이드 채널이기도 하다; 엔진은 테넌트별 `cache_salt`를 해시에 섞고, 모든 API 경로가 이를 적용해야 한다.

---

## 면접 질문

### Q: PagedAttention은 왜 처리량을 크게 늘리나?

**좋은 답변:**
PagedAttention은 훨씬 큰 **배치 크기**를 허용해 처리량을 늘린다. 내부·외부 메모리 단편화를 없애므로, 같은 GPU VRAM에 훨씬 많은 요청을 담을 수 있다. 전통 서빙에선 최대 길이 블록을 "예약"해야 해 4개만 맞을 수 있지만; PagedAttention에선 실제 존재하는 토큰에만 메모리를 써 20-30개를 맞출 수 있다. 큰 배치가 더 나은 GPU 활용과 상당히 높은 집계 초당 토큰으로 이어진다.

### Q: vLLM 맥락에서 "블록 테이블"을 설명하라.

**좋은 답변:**
블록 테이블은 모델의 연속 데이터 기대와 흩어진 메모리의 물리 현실 사이 간극을 잇는 매핑 구조다. 테이블의 각 항목은 토큰의 "논리 블록"에 대응한다. 그 블록의 키·밸류 텐서가 저장된 GPU 메모리 물리 주소를 담는다. 이로써 프레임워크가 작은 청크로 메모리를 동적 할당·해방하고, Copy-on-Write 프리픽스 공유, 단편화 없는 선점, 호스트 메모리·디스크로 블록 오프로드·복귀를 가능하게 한다.

---

## 참고 문헌
- Kwon et al. "Efficient Memory Management for LLM Serving with PagedAttention" (SOSP 2023)
- vLLM Documentation. "PagedAttention Logic" (2024)
- Zheng et al. "SGLang..." (RadixAttention, 2024)

---

*다음: [서빙 인프라](06-serving-infrastructure.md)*
