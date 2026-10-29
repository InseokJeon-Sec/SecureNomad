---
title: 구조화 생성
sidebar_position: 6
description: LLM이 100% 구문 신뢰성으로 기계 판독 포맷(JSON·YAML·CSV)을 내도록 강제 — JSON 모드, 함수 호출, 제약 디코딩(CFG·정규식), 다단계 추출, 검증.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/05-prompting-and-context/06-structured-generation.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

# 구조화 생성

구조화 생성은 LLM이 100% 구문 신뢰성으로 기계 판독 포맷(JSON, YAML, CSV) 출력을 내도록 강제하는 과정이다. 이 규율은 "프롬프트 기반 요청"에서 "엔진 수준 제약"으로 옮겨갔고, 2026년 마지막 프롬프트 시대 트릭(JSON을 얻으려 도구 호출 강제)이 최신 Claude 모델에서 통하지 않게 됐다.

## JSON 모드 혁명

역사적으로 JSON 얻기는 "다른 텍스트 없이 JSON만 반환"의 투쟁이었다.
**표준 접근**: 공급자의 네이티브 JSON 스키마 출력 사용.

| 공급자 | 네이티브 구조화 출력 |
|----------|--------------------------|
| **OpenAI** | `json_schema`의 `response_format`(Chat Completions) 또는 `text.format`(Responses API); 함수 도구에 `strict: true` |
| **Anthropic** | JSON 스키마의 `output_config.format`(구 `output_format` 파라미터는 폐기); 도구 정의에 `strict: true` |
| **Google** | JSON 응답 MIME 타입의 응답 스키마 |

- **이점**: 100% 구문 유효성. 모델이 유효한 JSON이 아닌 문자열을 문자 그대로 낼 수 없다.
- **이면**: 서빙 엔진이 각 스텝에서 어휘를 마스킹해, 유효 JSON 문자(예: `{`, `"`, `:`, `[`)만 다음에 뽑히게 보장.
- **확인할 예외 둘**: `max_tokens`로 출력 절단, 그리고 안전 거절(Claude는 `stop_reason: "refusal"` 반환). 파싱 전 중지 이유를 확인하라.

---

## 함수 호출과 도구 사용

함수 호출은 LLM이 함수를 "고르고" 인자를 채우는 구조화 생성이다.

```json
// 예시 도구 호출
{
  "name": "get_stock_price",
  "arguments": { "symbol": "AAPL", "interval": "1d" }
}
```

**뉘앙스**: **병렬 함수 호출**이 이제 표준. 모델이 5개 다른 도구를 동시에 호출(예: 계좌 잔액, 신용 점수, 대출 금리 확인)하고 결과를 집계하기로 결정할 수 있다.

**강제 도구 트릭은 최신 Claude 모델에서 은퇴.** 2년간 Claude에서 JSON을 얻는 표준법은 타깃 스키마의 도구를 정의하고 `tool_choice`로 강제하는 것이었다. Claude Fable 5.1(2026-09-01)·Opus 5.5(9/22)·Sonnet 5.5(9/28)는 `tool_choice` 타입 `any`·`tool`에 400 반환; `auto`·`none`은 여전히 작동. 어시스턴트 프리필(`{`로 답 시작)은 이미 Claude 4.6 이후 400 반환. 대체:

| 옛 패턴 | 대체 |
|-------------|-------------|
| JSON을 돌려받으려 도구 호출 강제 | JSON 스키마의 `output_config.format` |
| 에이전트 스텝에서 특정 도구 강제 | `tool_choice: auto`, 도구명을 명시한 프롬프트 지시, 스키마 유효 인자엔 `strict: true` |
| JSON 시작용 `{` 프리필 | 구조화 출력 |

프레임워크가 밑에서 재라우팅 중: langchain-anthropic 1.7.3(2026-09-22)은 Fable·Opus 5.5에 `with_structured_output`을 JSON 스키마 경로로 보내고, 1.7.5가 Sonnet 5.5 추가. 자체 래퍼에 `tool_choice`를 하드코딩했다면 업그레이드 시 깨진다. OpenAI 측은 GPT-6 Astra가 도구 호출에 Responses API 요구.

---

## 제약 디코딩(CFG와 정규식)

자체 호스팅 모델엔 **문맥 자유 문법(CFG)** 이나 **정규식**을 쓴다. vLLM·SGLang은 구조화 출력 옵션 뒤에 문법 백엔드(XGrammar, llguidance)를 탑재, llama.cpp는 GBNF 문법, Outlines는 Hugging Face 모델과 직접 작동.

```python
# Outlines 패턴 (1.x API)
import outlines
from outlines.types import Regex
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL = "Qwen/Qwen3-8B"  # 임의의 Hugging Face causal LM
model = outlines.from_transformers(
    AutoModelForCausalLM.from_pretrained(MODEL, device_map="auto"),
    AutoTokenizer.from_pretrained(MODEL),
)
phone = model("전화번호 추출: 415-555-0199로 전화 주세요", Regex(r"\d{3}-\d{3}-\d{4}"))
# 결과: 모델은 전화번호만 출력할 수 있음.
```

문법 컴파일은 공짜가 아니다: 큰 스키마·문법은 눈에 띄는 첫 요청 지연을 더할 수 있으니, 컴파일된 문법을 캐시하고 가능하면 스키마를 평탄하게 유지하라.

---

## 다단계 추출 패턴

복잡한 데이터 추출(예: 의료 기록에서 50개 필드)은 한 패스로 하지 말 것.
- **1단계(텍스트→텍스트)**: 자연어로 "지저분하나" 완전한 사실 집합 추출.
- **2단계(텍스트→JSON)**: 더 작고 싼 모델로 그 자연어 사실을 엄격 JSON 스키마로 변환.
- **이점**: "압박 하 환각" 감소 — 큰 모델은 추론과 엄격 구문 준수를 동시에 강제받으면 어려워한다. 추론 모델엔 덜 중요 — 사고 단계가 비제약이고 최종 답만 스키마 바운드이기 때문.
- **최신 Claude 모델에선 `reasoning` 필드를 버려라.** 흔한 트릭은 스키마에 `reasoning` 문자열을 먼저 둬 모델이 답 필드 채우기 전 "생각"하게 하는 것이었다. Claude Fable 5.1·Opus 5.5·Sonnet 5.5에선 JSON 출력이나 도구 입력의 `reasoning`·`thinking`·`trace` 필드가 `reasoning_extraction` 거절의 나열된 트리거다. 네이티브 사고가 그 일을 하게 두고, 감사용 근거가 필요하면 짧은 `explanation`·`evidence` 필드를 쓰라.

---

## 검증과 포맷 오류

"JSON 모드"에도 JSON 내부의 **로직**이 틀릴 수 있다(예: 필드 누락, 날짜 포맷 오류).

**복구 패턴**:
1. 파싱 전 중지 이유(`max_tokens`, `refusal`) 확인.
2. 출력을 **Pydantic/Zod**로 검증.
3. 실패 시 **트레이스백**을 모델에 돌려보냄: "오류: 'age' 필드는 정수여야 하는데 'twenty'를 받음. 고쳐 재생성."
4. 대부분 모델이 첫 재시도에 오류 수정.

도구 인자는 문자열 매칭이 아니라 JSON 파서로 파싱하라: 최신 Claude 모델은 도구 입력에서 유니코드·슬래시를 다르게 이스케이프할 수 있다.

---

## 면접 질문

### Q: "JSON 모드"는 왜 프롬프트 기반 JSON 요청보다 신뢰성 높나?

**좋은 답변:**
프롬프트 기반 요청은 모델의 지시 따르려는 *의지*에 의존; "JSON 모드"(또는 제약 디코딩)는 서빙 엔진이 다른 걸 *할 수 없음*에 의존한다. 추론 수준에서 "로짓 바이어스"나 "문법 마스크"를 적용해, 엔진이 다음 토큰 선택을 스키마상 유효한 것으로만 제한한다. 이는 "서문"(예: "네, 여기 JSON입니다...")을 없애고 샘플링 무작위성에서 오는 변형 문자열을 결코 안 받게 보장한다. 보장 못 하는 건 올바른 *내용*, `max_tokens`가 자를 때 완전한 응답, 모델이 거절하면 응답 자체이니, 검증과 중지 이유 검사가 파이프라인에 남는다.

### Q: LLM에 한 번에 너무 많은 구조화 필드를 요청하는 위험은?

**좋은 답변:**
**스키마 복잡도**와 **정보 무결성** 사이 트레이드오프가 있다. 스키마가 커지면(예: 20+ 계층 필드) 모델 주의가 데이터 정확성 검증보다 JSON 구조(괄호, 키, 따옴표) 유지에 소모된다. 이는 흔히 모델이 필드를 건너뛰거나 플레이스홀더로 채우는 "누락 환각"으로 이어진다. 완화는 추출을 더 작은 병렬 하위 스키마로 쪼개거나, 자연어로 먼저 추출하고 둘째 패스로 구조화하고, "unknown"을 명시적 허용값으로 만들어 모델이 하나를 지어내도록 밀리지 않게 하는 것.

### Q: 추출 파이프라인이 Claude에서 JSON을 얻으려 도구 호출을 강제했는데 Opus 5.5로 옮긴 뒤 모든 요청이 400을 반환한다. 뭘 바꾸나?

**좋은 답변:**
Opus 5.5·Sonnet 5.5·Fable 5.1은 `tool_choice` `any`·`tool`을 거부하므로 강제 도구 트릭이 사라졌다. 도구가 스키마를 나르려고만 있었다면 네이티브 구조화 출력(같은 JSON 스키마의 `output_config.format`)으로 대체 — 어차피 더 깔끔한 계약. 스텝이 정말 특정 도구를 호출해야 하면 `tool_choice: auto`로 전환, 지시에 도구명 명시, `strict: true`로 호출 시 인자를 스키마 유효하게 하고; 그다음 호출을 얼마나 건너뛰는지 측정해 그 경우 재시도를 더한다. 코드베이스·프레임워크 버전에서 같은 시대의 다른 하드코딩 가정(샘플링 파라미터, 어시스턴트 프리필, `budget_tokens`, 스키마의 `reasoning` 필드)도 grep하겠다 — 같은 모델에서 깨지거나 거절되기 때문.

---

## 참고 문헌
- OpenAI. "Structured Outputs Documentation" (2024-08 갱신)
- [Anthropic. Strict tool use and structured outputs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use)
- [Claude API release notes](https://platform.claude.com/docs/en/release-notes/overview)
- Outlines Project. "Output types: Regex, CFG, JSON"
- Willard and Louf. "Efficient Guided Generation..." (2023)
- Dong et al. "XGrammar..." (2024)

---

*다음: [프롬프트 최적화(DSPy)](07-prompt-optimization-dspy.md)*
