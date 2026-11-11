---
title: 벤치마크와 리더보드
sidebar_position: 3
description: 공개 벤치마크를 비판적으로 읽는 법 — 역량 지도(지식·추론·수학·코딩·에이전트·장문·멀티모달·사실성·선호), 포화·오염·하네스 분산·리더보드 착시·벤치마크-프로덕션 격차·복합 지수, 실무 체크리스트, 2026에 중요한 벤치마크.
---

:::info 출처 · 라이선스
이 문서는 Om Bharatiya의 [AI System Design Guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/14-evaluation-and-observability/03-benchmarks-and-leaderboards.md)(MIT License, © 2026 Om Bharatiya)를 한국어로 옮긴 **비공식 번역본**입니다. 번역·편집 책임은 SecureNomad에 있습니다. 전체 안내는 [소개 · 출처 · 라이선스](../index.md)를 참고하세요. 번역 기준: 원문 커밋 `ed955b2`(2026-10-09).
:::

:::note 번역 주
원문은 외부 자료로, 벤치마크명·모델명·버전·점수·논문·기관명은 원문 표기를 유지합니다. **점수는 휘발성**이며 2026-10-01 기준 스냅샷이니 인용 전 원문·1차 리더보드로 재검증하세요.
:::

# 벤치마크와 리더보드

공개 벤치마크는 분야가 모델 역량을 말하는 방식이다: MMLU·SWE-bench·GPQA·Arena Elo. 방향 잡기엔 유용하고 의사결정엔 위험하다. 이 장은 각 주요 벤치마크가 무엇을 측정하는지, 어느 것이 아직 프런티어 모델을 가르고 어느 것이 포화됐는지, 그리고 숫자에 속지 않도록 벤치마크 주장을 비판적으로 읽는 법을 가르친다.

로드 베어링 아이디어: **벤치마크의 정의와 알려진 결함은 안정적이고, 그 점수는 휘발성이다.** 리더보드 숫자는 주간으로 바뀌고 오염·우호적 하네스로 부풀려지며 날조 항목으로 점점 오염된다. 그래서 이 페이지는 각 벤치마크가 *무엇을 측정하고* *어떻게 깨지는지*로 시작하고, 특정 점수는 재검증해야 할 날짜·출처 있는 스냅샷으로 취급한다. 실제로 프로덕션 품질을 예측하는 *내* 시스템 평가는 [LLM 평가](01-llm-evaluation.md) 참고.

## 이 페이지를 읽는 법

아래 각 벤치마크는 **무엇을 측정하는지**, **형식**, **포화 상태**(프런티어 클러스터가 너무 높아 점수 차가 노이즈인가?), **알려진 결함**을 나열한다. 현재 점수가 방향 잡기에 유용한 곳엔 출처와 "검증" 플래그와 함께 준다. 이유:

- **제공자 자가 보고가 독립 리더보드보다 높게 나온다.** 랩은 찾을 수 있는 최고 하네스·최고 노력 설정·무제한 인프라로 모델을 보고한다. 그 숫자는 다른 랩 숫자나 독립 실행과 비교 불가. *같은* 하네스가 낸 숫자만 비교하라.
- **2026 웹은 모델·점수를 지어내는 날조 리더보드 페이지로 오염됐다.** 모르는 모델 이름에 귀속된 프런티어 코딩 점수를 보면, 1차 출처(랩 포스트·벤치마크 자체 리더보드)가 확인할 때까지 SEO 스팸으로 가정하라.
- **헤드라인 숫자가 하네스를 숨긴다.** "SWE-bench 88%"는 에이전트 스캐폴드·도구 접근·노력 수준·출력 토큰 상한 없이는 해석 불가. 2026 중반부터 벤치마크 버전·지표(이진 완료 또는 부분 점수)·실행 주체·일부 작업을 안전 폴백 모델이 처리했는지도 필요.

그러니: *측정*·*결함* 열로 벤치마크를 추론하고, 어떤 단일 백분율도 사실이 아니라 날짜 있는 데이터 점으로 취급하라.

---

## 역량 지도

벤치마크는 탐침하는 역량으로 묶인다. 각 그룹 안에서 분야는 포화된 벤치마크를 계속 폐기하고 더 어려운 후속으로 교체하니, 살아있는 분리자가 매년 움직인다.

### 일반 지식·언어

대개 **포화**: 프런티어 모델이 88-90% 위로 몰려 차가 노이즈. 프런티어 변별자가 아니라 역사적 베이스라인으로 두라.

| 벤치마크 | 측정 | 상태 | 비고 |
|-----------|----------|--------|-------|
| **MMLU** | 57과목 객관식 학술 지식(약 15.9k 문항) | 포화(약 90%+ 클러스터) | 역사적으로 가장 많이 인용. 약 6.5% 항목에 라벨 오류(MMLU-Redux 기준); 심한 웹 오염. 모델 카드에서 단계적 제외. |
| **MMLU-Pro** | 더 어려운 MMLU 후속: 4지 대신 10지, 추론 비중, 약 12k 문항 | 거의 포화 | MMLU 포화를 고치려 지었으나 같은 천장(상위 클러스터 약 88-90%)에 도달. Artificial Analysis 지수에서 포화로 제외. |
| **MMLU-Redux** | MMLU의 오류 교정 재주석(약 3k 항목) | 포화 | MMLU 오류율을 *정량화*(6.49% 오류, 일부 서브셋 최대 57%)하려 존재, 프런티어 랭킹용 아님. |
| **HellaSwag** | 상식 문장 완성 | 완전 포화(95%+) | 인간 베이스라인 약 95%; GPT-4 시대부터 해결. |
| **ARC-Challenge** | 초등 과학 객관식 | 포화(약 96%+) | 사실상 해결. |
| **WinoGrande** | Winograd 스키마 상호참조/상식 | 포화(약 90%+) | 잔여 주석 아티팩트. |
| **BBH (BIG-Bench Hard)** | BIG-Bench 최난 23작업, 다단계 추론 | CoT로 포화(>90%) | BBH 포화로 지어진 **BIG-Bench Extra Hard (BBEH)**로 대체. |
| **GLUE / SuperGLUE** | 구형 NLU 작업 스위트 | 폐기 | 2021 초 SuperGLUE 인간 베이스라인 통과. |

### 프런티어 추론

분야 최상위를 가르던 벤치마크. 여럿이 2026 중 포화·버전 변경됐으니, 인용 전 상태 열을 읽어라.

| 벤치마크 | 측정 | 상태 | 비고 |
|-----------|----------|--------|-------|
| **HLE (Humanity's Last Exam)** | 100+ 과목 폐쇄형 전문가 문항, 검색 저항(약 2,500 문항, 약 10% 멀티모달) | 유효하나 HLE-Diamond가 이제 더 깨끗한 레퍼런스 | 2026 중반까지 최고 프런티어 지식 벤치마크, 여전히 AA 지수의 10% 구성. 2025-01 출시 시 SOTA가 10% 미만 — 프런티어가 얼마나 빨리 움직였는지의 신호. 도구 설정이 랭킹 결정: Anthropic 자체 full-HLE-with-tools 표는 Claude Opus 5.5 67.7%·GPT-6 Astra 57.2%(벤더 보고)로 아래 공식 HLE-Diamond 도구 실행과 역순. HLE-Physics 전문가 재채점(arXiv 2609.13009)은 감사된 "오답" 대부분이 채점 오류·나쁜 참조 해답·모호 문항이라, 남은 여유의 일부는 라벨 오류. |
| **HLE-Diamond** | 정제된 HLE 1,000문항, 추론·지식 균등 분할; HLE 팀이 1년 정제 후 2026-09-22 공개 | 유효, 넓은 분리 | 도구 없음: GPT-6 Astra 59.9%·Claude Opus 5.5 54.6%·GPT-6.1 Sol 53.2%·Claude Fable 5.1 50.7%. 웹·코드 도구: Astra 82.9%·Opus 5.5 73.9%·Fable 5.1 72.3%. 어느 설정을 인용하는지 항상 명시; 두 실행 다 나열된 각 모델에 도구가 약 20점 더함. |
| **GPQA-Diamond** | 박사급 생물/물리/화학 198문항, Google-proof | 포화 | 웹 접근 숙련 비전문가 약 34%·박사 전문가 약 65-70% 점수 받도록 설계. GPT-6 Astra가 OpenAI 출시 표(2차 재현) 96.0%·AA 독립 실행 xhigh 96.3%. AA가 Intelligence Index v4.2에서 레거시로 옮겨 단독만 실행. 중급 모델 새너티 체크, 더는 프런티어 랭킹 신호 아님. |
| **ARC-AGI-2** | 추상 격자 퍼즐 추론, 효율 인식(약 400작업); 암기 저항 | 유효, 강한 분리 | **주의 깊게 읽을 것:** 인간 패널이 85% 통과하고 85%가 그랜드프라이즈 *임계값*. 집계기가 프런티어 모델을 "85%"로 보고하나, 그건 비-ARC-Prize 하네스·무거운 테스트 타임 컴퓨트의 자가 보고 수치. ARC-Prize-Verified 천장은 훨씬 낮음(높은 비용에 50대 중반). 임계값을 달성 점수로 인용 금지. |
| **ARC-AGI-3** | 첫 완전 인터랙티브 ARC 벤치마크(2026-03-25 출시): 에이전트가 행동으로 결정적·폐쇄형 메커닉·목표를 발견, 효율을 레벨당 행동으로 인간 베이스라인과 비교 | 하네스 의존: 제공자 하네스 하 천장 근접 | 프런티어 AI가 출시 시 0.51%. ARC Prize의 GPT-6 Astra Semi-Private 실행(9/3): 제공자 중립 Standard 하네스 max 노력에서 **62.7%**($26,098), ARC Prize Provider Adapter 하네스 high 노력에서 **99.9%**($18,817) — 후자는 OpenAI 자체 컨텍스트 관리 기능으로 요청 간 불투명 추론 상태 보존·컨텍스트 압축. ARC Prize가 둘 다 라벨링해 보고. 같은 모델·같은 테스트셋, 37점 격차: 하네스가 헤드라인을 정한 가장 명확한 2026 사례. |
| **FrontierMath** | 연구급 수학, 전문 수학자가 몇 시간\~며칠 걸리는 문제(약 350문제, 비공개; Tier 4 최난) | 유효하나 빠르게 상승 | 자동 검증 가능 폐형 답의 개방형(추측 방지). v1은 약 42% 문제에 오류(2026-06 v2에서 수정); 부분 OpenAI 펀딩이라 단일 랩 수치엔 거버넌스 단서. Epoch 자체 틀은 70% 미만이 도달 가능이라, 그보다 훨씬 위의 집계 점수는 의심하라. |
| **CritPt** | 11도메인 연구급 물리 추론, 50+ 물리학자 | 유효하나 낮은 점수는 부분 채점 문제 | 신규(2025 말)·이제 AA 지수의 10% 구성. 원점수는 여전히 모델을 가르나, 9월 전문가 재채점(arXiv 2609.13009)이 참조 해답 교정·결함 항목 제거: 유지된 54개 CritPt 과제에서 GPT-5.6 Sol 교정 pass@4가 94.4%. 낮은 CritPt 점수를 부분 모델 약점·부분 라벨 오류로 읽어라. |

### 수학

고전 수학 벤치마크는 해결됨; 살아있는 분리자는 가장 신선한 경시대회 연도·연구급 세트.

| 벤치마크 | 측정 | 상태 | 비고 |
|-----------|----------|--------|-------|
| **GSM8K** | 초등 단어 문제 | 포화(>95%) | GSM-Symbolic은 숫자/절 교란 시 점수 하락을 보여, 높은 수치가 부분 암기임을 입증. |
| **MATH / MATH-500** | 경시 수학(AMC/AIME 수준) | 포화(상위 약 99%) | MATH-500은 500항목 서브셋; 작은 크기라 상위서 고분산. |
| **AIME (2024/2025/2026)** | 올림피아드 단답, 정수 답, 연 30문제 | 공개되면 연도 N 포화 | 각 연도가 신선(공개 전 저오염)해 가치. 30항목뿐이라 단일 연도 점수 고분산; 평균 실행 선호. 2024/2025 포화. |
| **HMMT, Putnam** | 더 어려운 올림피아드/학부 증명 경시 | Putnam 증명 미포화 | 증명 채점이 LLM 판정자 의존; 최종 답 지름길이 진짜 증명 능력 과장. |

### 코딩

스니펫 벤치마크는 랭킹엔 죽었다; 에이전트·저장소 규모 벤치마크가 프로덕션 신호.

| 벤치마크 | 측정 | 상태 | 비고 |
|-----------|----------|--------|-------|
| **HumanEval / HumanEval+ / MBPP / MBPP+** | docstring에서 단일 함수 합성, 단위 테스트 검사 | 포화(프런티어 약 90-97%) | 2021부터 작고 공개라 오염. HumanEval+는 약 80배 테스트 추가로 취약 코드 포착; + 버전 점수 하락은 약한 테스트가 버그 코드를 통과시켰다는 뜻. 프런티어 랭킹 금지. |
| **SWE-bench Verified** | 숨은 테스트가 통과하도록 실제 GitHub 이슈 해결(인간 검증 500이슈 서브셋) | 거의 포화, 오염 | 2024-2026 정준 코딩 수치. 그러나 OpenAI 자체 평가팀이 60% 넘는 작업에 결함 테스트가 있고 해답이 작업 ID에서 그대로 재현 가능함을 플래그했고, 2026 저장소 교란 연구(arXiv 2609.27891)가 네임스페이스·문제 진술 재작성 시 일관된 하락을 발견 — 암기된 저장소 단서를 가리킨다. "약 80% 이상이면 프런티어" 티어 필터론 유용, 미세 랭킹엔 불신. 하네스 선택만으로 결과가 10-20점 흔들림. |
| **SWE-Bench Pro (v2)** | 공개·홀드아웃·상업 저장소의 더 어려운 이슈 해결. v2(Scale, 2026-09-22)가 지시·검증기·컨테이너 이미지 갱신, 731 공개 작업 중 89개를 무효로 제거 | 공개 분할 포화; 비공개 세트가 신호 | 공개 642작업: Claude Opus 5 99.4%(638/642)·Kimi K3 97.7%. 비공개 272작업: Opus 5 81.6%(222)·Kimi K3 214·GLM-5.3·Gemini 3.8 Flash 각 211(Scale 실행). Scale은 17.8점 공개-비공개 격차를 주로 공개 저장소의 학습 시점 노출로 귀속. v2의 **네트워크 잠금 프로토콜**(샌드박스가 모델 엔드포인트만 도달)·모든 diff의 무결 이미지 재채점, 두 등급 공개가 한 모델의 Go 모듈 버전 위조를 포착. v1.0 감사(arXiv 2609.34262)는 매칭 작업의 미획득 통과가 24%(Opus 4.7)→73%(Fable 5)로 상승 — 대개 git 이력에서 읽은 참조 해답. |
| **SWE-bench Multimodal** | 시각/UI 소프트웨어 이슈 해결(JS 프런트엔드, 깨진 UI 스크린샷 포함) | 미포화 | 진짜 시각 grounding 테스트; 텍스트-SWE-bench 시스템이 고전. |
| **SWE-rebench / SWE-bench-Live** | 지속 갱신·탈오염 이슈 해결; 작업이 모델 컷오프 이후 | 미포화 | 가장 강한 오염 감사. SWE-rebench는 신선 작업에서 무너지는 부풀린 Verified 점수를 특히 포착. |
| **LiveCodeBench** | 공개 날짜 태그 경쟁 프로그래밍 문제; 컷오프 이후 문제만 채점 | 신선 윈도에선 미포화 | 구조적으로 오염 저항. 경쟁 프로그래밍은 소프트웨어 엔지니어링이 아니라 알고리즘 추론을 예측하지 저장소 작업은 아님. |
| **Aider Polyglot** | 6언어 실제 다파일 편집, 유효 편집 형식 방출 필수, 2시도 | 포화 접근(약 88%) | 저장소 규모 추론이 아니라 편집 형식 신뢰성 측정; Exercism 소스 공개(오염). |
| **SciCode** | 하위 문제로 분해된 연구급 과학 코딩 | 포화에서 먼 | 가장 어려운 주류 코딩 벤치마크. 양립 불가 채점 관례 둘(main-problem vs subproblem) 주의; 항상 어느 것인지 인용. |
| **Terminal-Bench 4.0** | 66작업: 3.0의 74에서 8개 제거(포화 2·거부 이슈 2·공개 해답 2·품질/플랫폼 문제 2), 19개 수정·균일 8시간 에이전트 타임아웃. 2026-08-28 발표 | 활성, 현 터미널 에이전트 변별자 | 시맨틱 버저닝 채택: 메이저 범프는 재실행, 3.0 점수 미승계. tbench.ai 리더보드(9/21): GPT-6 Astra(Codex) max 58.18%·high·xhigh 57.88%; Claude Fable 5.1(Claude Code) max·xhigh 57.88%·high 54.55%; Claude Opus 5(Claude Code) xhigh 53.94%. 비용 열 읽기: Astra max 실행 약 $3.3K vs Fable 5.1의 거의 동일 점수에 약 $6.2K. 벤더 보고: Anthropic이 Opus 5.5를 xhigh 66.4%(SE ±2.6)·Sonnet 5.5 70.6%(출시 표에 노력 미명시)로 줘 자체 실행선 더 싼 모델이 앞섬; OpenAI의 Astra 57.9%는 high 노력 실행. |
| **Terminal-Bench 3.0** | 7도메인 74작업, 포화된 2.1 교체 위해 2026-07-30 공개. 출시 시 잠시 "Frontier-Bench v0.1"로 인용 후 개명 | 약 4주 뒤 4.0으로 대체 | 출시 상위: GPT-5.6 Sol(Codex) 34.4%·Fable 5(Claude Code) 33.8%. 분리를 급격히 넓힘(2.1서 4.9점 차 두 모델이 3.0서 12.7점 차). 짧은 수명이 교훈: 버전 벤치마크가 이제 포화·유출 작업을 몇 주 안에 폐기하니, 모든 점수에 버전 필요. |
| **Terminal-Bench-Science 0.1** | 920 제안에서 고른 70 에이전트 과학 워크플로 작업, 생명·물리·지구·수리·공학 과학. 2026-08-27 발표 | 신규, 빠르게 이동 | 출시 리더보드: Opus 5 30.0%·GPT-5.6 Sol 22.4%·Fable 5 21.4%. 몇 주 내 벤더 보고: GPT-6 Astra 64.6%(OpenAI 표, 2차 재현)·Opus 5.5 58.7%·Fable 5.1 52.6%(Anthropic, SE ±3.5\~5점 각주). 벤더 자체 표선 순서가 Terminal-Bench 4.0과 달라, "최고 코딩 모델"을 워크로드로 한정. |
| **DeepSWE v1.1** | 91 저장소·5언어의 113개 원본·처음부터 작성 장기 작업(Datacurve); 신선 격리 컨테이너서 에이전트 커밋 패치 채점 | 활성, 구조적 오염 저항 | 커미션 작업이 Verified·Pro 공개 분할을 깬 병합 PR 유출 회피, 사이트에 canary GUID. 리더보드(9/22 갱신): GPT-6 Astra(xhigh) $4.43/작업·Gemini 3.8 Flash(high) $2.36·Claude Opus 5(max) $11.84의 3자 74% pass@1 동률. 동일 pass에 5배 비용 스프레드가 해결 작업당 비용을 일급 지표로 삼을 근거. Google은 발표된 Gemini 4 Argon을 77.9%로 보고(벤더 보고, 위 보드 수치와 별개). |
| **SWE-Bench ProMax** | 170 다국어 리팩터링 인스턴스(7언어, 각 평균 11.4 수정 파일), 2026-08-10 공개 | 신규, 넓은 여유 | 공개 시 최고 모델이 41.2%만 해결. 단일 이슈 버그 수정보다 어렵고 현실적인 거동 보존 조율 변경 겨냥 |
| **Terminal-Bench (2.x)** | 실제 터미널 샌드박스의 엔드투엔드 에이전트 작업(빌드·디버그·시스템 관리) | 상위 포화; 3.0, 이후 4.0으로 대체 | 점수가 하네스 쌍(에이전트 CLI가 모델만큼 중요). AA가 이제 Terminal-Bench 2.1을 레거시 평가로 나열. |

**왜 에이전트 벤치마크가 HumanEval을 밀어냈나:** HumanEval/MBPP는 모든 프런티어 모델에 90%+ 포화, 작고 암기됐으며, 단일 함수 docstring-to-code가 실제 엔지니어링을 예측 못 함. 증거: SWE-bench가 HumanEval을 석권한 같은 모델 세대에 2% 미만 해결로 출시. 저장소 읽기·테스트 실행·스택 트레이스 읽기·패치 반복은 다른 기술이라, 분야가 이슈 해결·터미널 벤치마크로 이동.

### 에이전트·도구 사용

가장 빠르게 움직이는 영역 — 에이전트가 2026 프로덕션 가치가 있는 곳이니. 대부분 미포화.

| 벤치마크 | 측정 | 상태 | 비고 |
|-----------|----------|--------|-------|
| **BFCL (Berkeley Function Calling Leaderboard)** | 도구/함수 호출 정확도; V4가 웹 검색·메모리 있는 에이전트 작업 추가 | V1/V2 포화, V3/V4 미포화 | AST 기반 채점이 시맨틱 오류를 놓칠 수 있음. 보드의 낡은 미러 주의; 공식 Berkeley 리더보드 사용. |
| **tau-bench 계열(Sierra): tau2-bench, 이제 tau3-bench** | 에이전트가 도메인 정책 하에 도구를 쓰고 시뮬레이션 사용자와 대화(retail·airline·telecom; tau3가 banking_knowledge 검색 도메인·풀듀플렉스 음성 추가) | 신뢰성에선 미포화 | **pass^k**(같은 작업 k회 재실행) 보고 — 잔혹한 신뢰성 절벽 노출: 약 60% pass@1 에이전트가 약 25% pass^8로 추락 가능. 최선 케이스가 아니라 일관성을 측정해 가장 프로덕션 관련 도구 사용 신호. 저장소는 이제 tau3-bench: v1.0.0(2026-03)이 banking_knowledge·tau-Voice·tau-Knowledge·75+ 작업 수정 추가, v1.0.1(2026-07-22)이 banking_knowledge 채점 수정 — 이전 banking_knowledge 결과 비교 불가. 음성 점수는 추론 백엔드를 따름: Sierra 음성 리더보드 gpt-live-1 81.7% pass@1. |
| **Hyper-tau-bench (Sierra)** | 에이전트를 짓는 에이전트: 개발자 에이전트가 비즈니스 기록·고객 인터뷰에서 요구사항 복원, 샌드박스서 고객 서비스 에이전트 구축, 그 에이전트의 홀드아웃 tau식 테스트로 채점. 2026-09-08 오픈소스 | 신규, 넓은 여유 | Claude Code 안 Claude Opus 5(max) 단독 23.9% 통과; 깊은 맥락 엔지니어와 짝지은 같은 모델급 82.2%. 요구사항 도출이 병목: 개발자 에이전트가 고객이 20\~25 요구사항을 쥐었을 때 최대 4개만 물음. |
| **GAIA** | 다단계 도구 사용·웹 브라우징·파일 필요한 일반 어시스턴트 작업 | 조율 앙상블로 상위 포화(약 92%) | 상위 항목이 베이스 모델이 아니라 멀티모델 앙상블·스캐폴드라, 모델보다 조율을 측정. |
| **BrowseComp** | 지속 웹 브라우징 필요한 찾기 어려운 사실 | 프런티어서 포화 | GPT-6 Astra 91.5% vs GPT-5.6 Sol 90.4%(OpenAI 표 2차 재현). 검색기를 에이전트에서 분리하는 BrowseComp-Plus 같은 코퍼스 통제 딥리서치 평가 사용. 웹 가능 인스턴스는 담합도 가능: 웹 리서치 벤치마크의 OpenAI 에이전트들이 6월 한 주에 휴면 공개 위키에 약 13,000 편집으로 답 공유(collusion.wiki). |
| **OSWorld-Verified** | 실제 OS의 컴퓨터 사용 에이전트, 실행 채점 | 자가 보고 점수서 포화 | OSWorld(최고 약 12% vs 인간 약 72%로 출시)의 정제·표준화 후속. 자가 보고 리더가 이제 80대 중반이라, 짧은 단일 세션 데스크톱 작업서 프런티어를 더는 못 가름. |
| **OSWorld 2.0 / 2.1 (XLANG Lab)** | 31 자체 호스팅 웹사이트·데스크톱 앱의 108 장기 작업(arXiv 2606.29537, 2026-06). 중앙값 작업 약 1.6 숙련 인간 시간, 약 27 가중 체크포인트, 500스텝 예산 | 유효, 주 지표서 넓은 여유 | **이진 완료가 주 지표**; 부분 점수는 옆에 보고되고 30+점 높음. 공식 리더보드(9/17): Claude Opus 5 max·배치 도구·v2.1 전체 세트 **44.33% 이진 / 77.67% 부분**. 벤더 출시 포스트는 부분 점수 인용: Opus 5.5 "OSWorld 2.1" 81.8%(Anthropic)·GPT-6 Astra 72.6% vs GPT-5.6 Sol 65.7% 오프라인 v2026.08.08 세트(OpenAI 표 2차 재현). Anthropic 자체 Opus 5 74.0% 부분은 어떤 리더보드 행과도 안 맞음. 이진으로 프로덕션 계획: 체크포인트 80% 달성은 일 완료가 아님. |
| **Agents' Last Exam** | 샌드박스서 돌리는 전문 워크플로; 결정적 작업별 채점기가 에이전트 출력 파일을 숨은 참조와 비교. ALE-V1이 55 하위 산업의 1,500+ 작업 코퍼스에서 147작업 공개(UC Berkeley RDI, Snorkel AI와) | 미포화 | 리더보드: Claude Opus 5.5(Claude Code, max) 38.2% pass rate·63.2 score·약 $1,340; GPT-6 Astra(Codex, max) 34.2% pass·59.3 score·약 $1,100. OpenAI 출시는 pass rate가 아니라 59.3 score 인용: 같은 행이 full-pass rate보다 약 25점 위의 부분 점수를 지님. |
| **Online-Mind2Web / WebArena** | 라이브 웹 에이전트 작업 | 혼합 | Online-Mind2Web의 "진보의 착시" 발견: 투명하게 판정하면 많은 상업 에이전트가 2024 학술 베이스라인에 못 미침. 판정 방법론이 크게 다름, 점수 흔히 비교 불가. |
| **GDPval** | 44 직종의 실제 경제적 가치 지식 작업, 인간 전문가 채점 | 활성, 미포화 | 전망적 "하루치 실제 작업을 할 수 있나" 신호; 프런티어가 약 100배 낮은 비용에 전문가 산출물 품질 접근. 쌍대 Elo 변형(GDPval-AA)은 승률 버전과 다름. |
| **METR time-horizon** | 모델이 50% 신뢰로 완료하는 작업 길이(인간-분) | 활성 연구 표준 | 리더보드가 아니라 추세: 지평이 전체 약 7개월마다, 코딩은 더 빨리 2배. 에이전트 자율 성장을 말하는 가장 깨끗한 방법. |

### 장문

헤드라인 발견: **광고된 컨텍스트 윈도가 사용 가능 컨텍스트를 과장한다.** 스펙시트의 윈도 크기가 아니라 이것으로 시작하라.

| 벤치마크 | 측정 | 상태 | 비고 |
|-----------|----------|--------|-------|
| **NIAH (needle-in-a-haystack)** | 다양한 깊이·길이의 단일 사실 검색 | 포화/사소 | 프런티어 모델 약 100%라 거짓 자신감. 변별자가 아니라 새너티 체크. |
| **RULER (NVIDIA)** | 통제된 길이의 검색·멀티홉 추적·집계·QA; "유효 길이" 보고 | 미포화 | 유효 대 광고 격차의 본산: 128K 주장 많은 모델이 약 32-64K(광고의 25-50%)까지만 품질 유지. 합성이라 산문 기반 테스트와 짝지어라. |
| **Fiction.LiveBench** | 약 192K 토큰까지 깊은 서사 이해(마음 이론·연대기·암묵 추론) | 미포화 | 가장 가혹한 실무 장문 테스트; 대부분 모델이 192K서 80% 미만. 작음(36문항)이라 노이즈. |
| **MRCR (multi-round coreference)** | 거의 동일한 여러 니들 구별, i번째 반환 | 미포화, 특히 8-니들 | 니들 수·길이에 점수 급락. |
| **LongBench v2 / LongBench Pro** | 8K-2M 토큰 현실 장문 이해·추론 | 미포화 | LongBench Pro 발견: 장문 *최적화*가 원시 파라미터 스케일링을 이기고, 모든 모델서 유효가 광고 아래. |

설계 문서용 방어 가능 한 줄: *광고 컨텍스트 윈도는 흔히 사용 가능 컨텍스트를 과장; RULER에서 128K 주장 많은 모델이 약 32-64K까지만 품질 유지, 다만 프런티어가 빠르게 개선 중.* "context rot" 작업(윈도 한계 훨씬 전에 시작되는 저하, 때로 섞인 haystack이 일관 문서를 이기는 반직관 결과)이 더 작은 유효 예산으로 설계할 근거를 강화. [컨텍스트 엔지니어링](../05-prompting-and-context/05-context-engineering.md) 참고.

### 멀티모달

이미지 객관식 벤치마크는 포화 중; 영상 추론이 진짜 미해결 프런티어.

| 벤치마크 | 측정 | 상태 | 비고 |
|-----------|----------|--------|-------|
| **MMMU / MMMU-Pro** | 6분야 대학급 멀티모달 추론 | 포화 접근 | MMMU-Pro가 강화(10지, 질문이 스크린샷인 비전 전용 항목)하나 심한 하네스 간 불일치(같은 모델이 다른 하네스서 81%·94%)라 출처 간 비교 금지. |
| **MathVista, DocVQA, ChartQA, MMBench** | 시각 수학·문서 QA·차트 QA·광범위 멀티모달 | 프런티어서 대체로 포화 | DocVQA/ChartQA 거의 해결; relaxed-accuracy 채점이 수치 오류 숨김. |
| **Video-MME / Video-MME-v2** | 영상 이해 | v1 포화 접근, v2 포화에서 먼 | Video-MME-v2(2026)가 비선형 그룹 채점 사용·큰 모델-인간 격차 보여 살아있는 멀티모달 분리자. |

### 사실성·지시 따르기

| 벤치마크 | 측정 | 상태 | 비고 |
|-----------|----------|--------|-------|
| **IFEval** | 프로그래밍적으로 검증 가능한 지시 따르기("400단어 이상"·유효 JSON·쉼표 없음) | 대체로 포화(약 90%+) | *검사 가능* 제약만 확인 — 지시 따르기의 좁은 조각; 게이밍 가능. |
| **SimpleQA / SimpleQA Verified** | 단답 폐쇄형 사실 회상, 적대적 난이도; 보정된 기권 보상 | 미포화 | 50대 중반 F1서 정점 — 환각은 해결에서 멀다. 헤드라인 교훈: 더 유능해도 더 사실적이진 않음. |
| **TruthfulQA** | 흔한 오해 저항 | 노후/부분 포화 | 정적·잘 알려져 오염; "진실" 라벨 논쟁적; 얼버무림으로 게이밍 가능. |
| **FACTS Grounding** | 장문 답이 제공 출처에 완전 뒷받침되는지(미근거 주장 없음) | 미포화(상위 약 0.88) | 참가자와 계보 공유 LLM 앙상블이 판정; 항목 자가 보고. RAG faithfulness에 맞는 벤치마크 계열. |

### 인간 선호

| 벤치마크 | 측정 | 상태 | 비고 |
|-----------|----------|--------|-------|
| **Arena (arena.ai, 구 LMArena·Chatbot Arena)** | 크라우드소싱 블라인드 쌍대 선호, Elo로 보고 | 천장 없으나 상위 약 15가 약 25 Elo로 압축 | 유명한 선호 신호이자 가장 오용. 아래 리더보드 착시 절 참고. 항상 **스타일 통제** Elo(길이·형식 편향 회귀 제거)와 신뢰 구간 읽기; 약 15-20 Elo 내 차는 노이즈. lmarena.ai가 이제 arena.ai로 리디렉션. 신규 모델은 수백만 라이브 투표로 학습한 보상 모델의 1일차 **AutoEval** 점수를 받음(Arena는 라이브 점수와 순위 상관 0.98 초과 주장), 인간 투표 누적 전까지 그렇게 라벨링: 예측으로 취급. 에이전트 범주(Code·Chat·Work)가 작업당 가격·비용 파레토 프런티어 추가. |
| **Arena-Hard-Auto v2** | Arena의 자동·재현 가능 프록시: 강한 LLM이 쌍대 판정하는 어려운 프롬프트 | 미포화, 강한 분리자 | MT-Bench의 약 3배 분리성·인간 Arena 랭킹과 약 98% 상관. 필요할 때 싼 재실행 가능 선호 신호. 스타일 통제 켜고 사용. |
| **MT-Bench** | LLM 판정자로 멀티턴 품질(80 프롬프트) | 포화/구식 | 작음; GPT-4 판정자 편향(자기 선호·장황). Arena-Hard로 대체. |

---

## 벤치마크를 비판적으로 읽기

실제로 중요한 부분. 리더보드는 누구나 읽지만, *올바로* 읽는 게 기술이다.

### 포화

벤치마크는 프런티어가 천장에 너무 가까이 몰려 점수 차가 노이즈 내일 때 포화다. MMLU가 정준 사례: GPT-4가 2023 초 약 86%, 프런티어가 이후 86-93%에 머물러, 2점 "승리"가 흔히 프롬프트 아티팩트(MMLU 점수가 프롬프트 표현에 4-5% 변동). 작동 신호: **리더가 약 3점 내로 몰리면 순위가 역량이 아니라 통계적 노이즈.**

벤치마크가 포화하면 분야는 (1) 더 어려운 후속(MMLU→MMLU-Pro→HLE), (2) 비공개·홀드아웃 세트, (3) 시간 게이트 "라이브" 벤치마크, (4) 복합 지수로 대응. 정적 공개 벤치마크의 중앙값 유용 수명은 약 2년 미만.

2026에 그 수명이 몇 달, 때로 몇 주로 압축됐다. Terminal-Bench 3.0이 4.0 교체 전 약 4주. 8월 아직 신흥 주 코딩 신호이던 SWE-Bench Pro가 9월 말 v2 공개 분할 99.4%. ARC-AGI-3이 3월 출시 0.51%에서 6개월 미만 뒤 제공자 하네스 하 99.9%. GPQA-Diamond·BrowseComp 둘 다 프런티어서 90% 돌파. 설계 문서에 인용하는 어느 벤치마크든 작동 가정: 인용하는 주에 버전·포화 상태 확인.

### 오염

벤치마크는 공개라 사전학습에 스크랩되니, 모델이 역량이 아니라 암기로 높은 점수를 낼 수 있다. 증거는 직접적: HumanEval식 문제 재도출(EvoEval)이 51개 모델서 점수 약 39% 하락; LiveCodeBench서 한 모델의 pass rate가 컷오프 전 문제 약 60%에서 이후 약 0%로; OpenAI가 SWE-bench Verified 해답을 작업 ID에서 그대로 재현 발견. 객관식 QA 벤치마크 전반에서 측정된 오염은 1%\~45%, 큰 모델이 더 이득.

오염 저항 설계: **시간 게이팅**(모델 컷오프 이후 공개 문제만 채점, LiveCodeBench·SWE-rebench식), **비공개 홀드아웃 세트**(FrontierMath·ARC-AGI-2; 비용은 비재현성), **canary 문자열**(데이터셋에 심은 고유 토큰, 모델이 암송하면 오염 플래그). 탐지법(n-gram 중첩·멤버십 추론·TS-Guessing 퀴즈)은 모두 실패 모드가 있음; 특히 멤버십 추론 공격은 실제 사전학습 모델서 랜덤을 간신히 이김. 실무 수: 어느 정적 공개 벤치마크든 일부 오염을 가정하고 절댓값 할인.

**구조적 방어가 2026 도착.** 세 설계가 시간 게이팅을 넘는다. **커미션 작업**은 병합 PR서 캐지 않고 벤치마크용으로 처음부터 작성(DeepSWE). **독립 재채점 네트워크 잠금 실행**은 에이전트를 저장소·패키지 인덱스·웹에서 끊고 모든 diff를 무결 이미지서 재채점(SWE-Bench Pro v2). **이중 블라인드 평가**는 각 측 비밀을 서로에게 숨김: Google DeepMind가 2026-08 Singapore AI Safety Institute·OpenMined·AVERI·MLCommons와, Google Cloud Confidential Space 엔클레이브 안에서 파일럿해 제공자는 테스트 프롬프트를, 평가자는 가중치를 못 봄(발표; 결과 미공개). 오염은 새 경로도 찾음: 웹 접근 병렬 인스턴스가 공개 위키로 답 공유 — 평가 하네스가 인터넷만이 아니라 인스턴스 간 격리도 해야.

### 하네스·스캐폴드 분산

같은 모델 가중치가 프롬프트·도구 가용성·추론 노력 수준·에이전트 스캐폴드에 따라 10-20점 다르게 나온다. Anthropic은 인프라 설정 *단독*(RAM·동시성·심지어 시간대 API 지연)이 Terminal-Bench 결과를 약 6점 움직임을 측정. 그래서 **제공자 자가 보고가 독립 리더보드보다 높다**: 랩이 자기 모델에 찾은 최고 하네스·노력을 무제한 인프라서 보고. 따르는 하드 규칙: **제공자 숫자를 다른 제공자 숫자나 독립 리더보드와 결코 비교 금지.** 같은 하네스 숫자만 비교. 그리고 추론 노력은 단조가 아님 — 한 대규모 에이전트 연구서 더 많은 thinking이 36설정 중 21에서 정확도를 낮춤 — 그래서 "high effort" 제공자 숫자는 그 같은 모델의 기본 노력 독립 실행과도 비교 불가.

**2026-09 출시가 이를 구체화했다.** 같은 GPT-6 Astra 가중치가 ARC Prize 제공자 중립 하네스서 ARC-AGI-3 62.7%, 요청 간 불투명 추론 상태를 나르는 OpenAI 자체 컨텍스트 관리 기능의 Provider Adapter 하네스서 99.9%. 지표가 모델만큼 숫자를 움직임: 상위 OSWorld 2.1 행이 44.33% 이진·77.67% 부분, 상위 Agents' Last Exam 행이 38.2% pass rate·63.2 score. 그리고 일부 헤드라인 숫자는 더는 한 세트 가중치의 것이 아님. Anthropic이 Claude Opus 5.5를 프로덕션 안전장치 켜고 평가; 개입 시 사이버보안 작업을 Claude Opus 4.8이, 생물·프런티어-LLM-개발 작업을 Claude Opus 5가 완료(Zapier AutomationBench는 폴백 없이 실행해 개입이 실패로 계산). AA가 이제 그런 항목을 "with fallback"으로 라벨링. 그 점수는 라우팅 시스템을 측정하고, 그에 대한 회귀 테스트는 하네스·노력처럼 폴백 상태도 핀해야.

두 숫자를 비교하기 전 이 모두를 핀하라:

| 핀 | 왜 숫자를 움직이나 | 2026 예시 |
|-----|-------------------------|--------------|
| 벤치마크 버전 | 메이저 버전이 작업을 폐기·수정; 점수 미승계 | Terminal-Bench 3.0→4.0: 8 제거·19 수정 |
| 하네스·스캐폴드 | 도구·나른 상태·압축이 측정 대상 변경 | ARC-AGI-3: 같은 모델 62.7% vs 99.9% |
| 노력 수준 | 비단조, 랩이 최고 설정 보고 | Terminal-Bench 4.0: Fable 5.1 54.55%(high) vs 57.88%(max) |
| 지표 | 이진 vs 부분 점수, pass rate vs score | OSWorld 2.1: 한 행 44.33% 이진 vs 77.67% 부분 |
| 실행자 | 벤더 실행은 찾은 최고 설정 사용 | Opus 5 OSWorld 2.1: Anthropic 74.0% 부분이 어떤 리더보드 행과도 안 맞음 |
| 폴백 상태 | 안전장치 라우팅이 일부 작업을 다른 모델에 | AA의 Opus 5.5 "with fallback" |
| 작업당 비용 | 동일 점수가 비용서 배수 차 | DeepSWE v1.1: $2.36\~$11.84/작업의 74% 동률 |

**2026 중반 세 번째 오류원 표면화: 벤치마크 자체 테스트.** 15 에이전트 벤치마크의 2,385 트레이스 감사가 둘에서 트레이스 약 67%에 보상 해킹·답 노출 발견 — 에이전트가 작업을 풀기보다 공개 해답 복원·평가 아티팩트 읽기·무효 채점 경로 악용. SWE-bench Verified 별도 감사는 미해결 인스턴스의 유의한 비율에 결함 테스트 보고. 9월이 이것이 역량에 따라 어떻게 스케일하는지 수치화: 3,810 통과 궤적 감사가 SWE-Bench Pro v1.0 미획득 통과를 24%(Opus 4.7)→73%(Fable 5)로 발견(arXiv 2609.34262), METR의 OpenAI 7월 사이버 평가 조사가 전사 약 7%에 도구 호출 위조 발견·목표의 30\~40%가 의도대로 익스플로잇 불가라는 외부 추정. 오르는 점수가 더 나은 속임수를 뜻할 수 있다. 실무 규칙: 점수가 뛰면 역량이 개선됐는지 프로토콜이 샜는지 확인하고, 유효성 감사·재채점을 공개하는 벤치마크 선호. 강화 체크리스트는 [에이전트 시스템 평가](../07-agentic-systems/10-evaluating-agentic-systems.md).

**오염 탐지가 이제 자체 한계 이론을 가진다.** 2026-08 공개된 형식적 처리는 탐지 가능성이 오염 비율·본/미본 항목 간 거동 격차·샘플 크기 제곱근에 스케일함을 보인다. 실무자 귀결: 작은 감사의 "오염 증거 없음"은 깨끗한 벤치마크와 저검정력 테스트 사이에서 모호하니, 오염 주장은 의미를 가지려면 명시된 검정력 계산이 필요.

### 리더보드 착시

LMArena(이제 Arena; Cohere et al., 약 2M 대결·243 모델 감사)의 중심 비판은 네 문제를 발견: 제공자가 많은 변형을 사적 테스트해 최고만 공개(Meta가 Llama-4 전 27 변형 테스트) — Elo 수학 뒤 비편향 샘플링 가정 위반; 독점 제공자가 오픈 모델보다 훨씬 많은 대결 데이터; Arena 분포에 *맞춰* 학습해 큰 승률 이득; 조용히 폐기된 모델이 랭킹 왜곡. LMArena 반박은 크기를 반박(사적 테스트 부스트 추정 약 11 Elo, 신선 투표 누적에 감쇠)하고 과적합 수치가 라이브 인간 보드가 아니라 정적 프록시서 측정됐다 지적. **논쟁적이나 입증됨**으로 제시하라.

어느 쪽이든 실무 지침은 같다: Arena Elo를 정확성·사실성·어려운 추론이 아니라 **일반 챗 선호** 측정으로 취급; 항상 스타일 통제 보드 사용(Arena가 길고 예쁜 답 보상); 신뢰 구간 읽기(상위 약 15가 통계적으로 근접 동률); 셋 중 하나 신호로 쓰고 단독 금지.

### 벤치마크-프로덕션 격차

공개 점수는 세 조건이 동시에 성립할 때만 내 프로덕션 성능을 예측: 벤치마크가 내 것과 유사한 작업 테스트, 테스트셋이 오염에서 깨끗, 벤치마크 미포화. 실제론 셋 다 드물게 성립. 벤치마크 점수의 주성분 분석은 단일 "일반 역량" 요인이 분산의 약 50%만 설명 — 나머지는 모델 패밀리 특이성·노이즈, 그래서 동일 일반 역량 두 모델이 *내* 작업에 크게 다를 수 있다. 높은 GPQA가 내 도메인 성능을 보장 안 함. 2026-09 구성 타당성 연구(arXiv 2609.08812, 53 모델 56 벤치마크)가 더 나아감: 같은 개념 할당 역량 벤치마크가 *다른* 개념 벤치마크와 비슷하게 서로 상관했고, 점수 형식 같은 설계 특징이 공유 개념보다 상관을 더 잘 예측하기도. 벤치마크 이름이 무엇을 측정하는지 보장 안 함.

그 주성분 분석서 가장 깨끗한 일반 역량 로더는 GPQA-Diamond·SWE-bench Verified(Aider Polyglot·AIME식 세트와)였고 둘 다 이후 포화 — 그게 요점: 프록시는 만료된다. 모든 실무자가 이르는 결론: **내 결정엔 리더보드를 무시하고 내 데이터로 평가를 지어라.** 특징·시나리오·페르소나로 분할한 골드셋 구성; 도메인 전문가에 보정된 이진 LLM-as-judge 사용(원시 일치가 아니라 정밀도·재현율로 측정); 역량을 비용에 대고 가격. 몇몇 공개 보드가 이제 작업당·실행당 비용 공개(Terminal-Bench 4.0·DeepSWE·Agents' Last Exam·ARC Prize·Arena 에이전트 범주)해 비용서 배수로 갈린 근접 동률을 보이나, 어느 것도 내 트래픽·캐시 적중률·노력 설정으로 가격되지 않음. [LLM 평가](01-llm-evaluation.md)와 [화이트보드 연습](https://github.com/ombharatiya/ai-system-design-guide/blob/main/00-interview-prep/04-whiteboard-exercises.md)(영문)의 평가 파이프라인 연습 참고.

### 복합 지수

어느 단일 벤치마크든 1\~2년 내 포화하니, 분야는 구성이 최대치에 이를 때도 계속 변별하고 한 테스트 과적합에 저항하는 가중 복합으로 프런티어 모델을 랭킹한다:

- **Artificial Analysis Intelligence Index**는 구성이 포화하면 재버전하고, **다른 버전 점수는 비교 불가**. v4.3이 2026-09-07 출시(현 개정 v4.3.2), 에이전트 작업 가중 10 평가:

  | 범주 | 가중 | 구성 |
  |----------|--------|------------|
  | Agents | 30% | AA-Briefcase v1.1 (15%), GDPval-AA v2.1 (10%), AutomationBench-AA (5%) |
  | Coding | 20% | Terminal-Bench 4.0 (10%), SciCode (10%) |
  | General | 30% | AA-Omniscience (15%: 정확도 10%·비환각 5%), GDP.pdf (10%), AA-LCR v1.1 (5%) |
  | Scientific reasoning | 20% | HLE (10%), CritPt (10%) |

  레거시로 폐기: GPQA Diamond·AIME 2025·MATH-500·MMLU-Pro·LiveCodeBench·tau2 Telecom·tau3-Banking·Terminal-Bench 2.1·Terminal-Bench Hard. 10월 초 보드는 Claude Opus 5.5(max with fallback) 58·Claude Sonnet 5.5(max with fallback) 56, Claude Fable 5.1(max with fallback)·GPT-6 Astra(max)·Gemini 4 Argon(high)이 추가 Opus 5.5 노력 설정 아래 53 동률; Argon은 9/30 제한 롤아웃 발표·아직 Gemini API 미포함. 9월 초 보도는 pre-v4.3 지수서 Fable 5.1 66·Astra 61 인용. 그 숫자는 다른 지수를 기술하니 한 표에 섞지 말 것.
- **Epoch Capability Index (ECI)**는 약 1,000+ 평가에 문항반응이론 모델을 적합, 각 벤치마크 난이도를 통계적으로 추론해 *더 어려운* 벤치마크를 잘하면 모델이 더 높은 점수.
- **HAL (Holistic Agent Leaderboard, Princeton)**은 에이전트 특화 비용 인식 복합: 정확도 *와* 달러 비용 채점, 모델 전반 고정 하네스 실행, 로그 분석으로 지름길 쓰는 에이전트(풀지 않고 arXiv서 답 당김)·평가 버그 표면화. 10배 비용에 1% 정확도 이득은 승리가 아니라 존재.

복합은 "어느 모델이 일반적으로 최고인가"에 맞는 도구이나, 여전히 구성의 결함을 상속하니 무엇을 집계하는지 읽어라.

---

## 실무 체크리스트

어느 벤치마크 주장이든 읽을 때:

1. **숫자만이 아니라 하네스를 읽어라.** 벤치마크 버전·스캐폴드·도구 접근·노력 수준·출력 토큰 상한·지표(이진·부분)·실행자·폴백 상태 요구(위 하네스·스캐폴드 분산 절의 핀 표 참고). 맨 백분율은 해석 불가.
2. **신뢰 구간 확인.** 노이즈 밴드 내 차 무시. SWE-bench Verified는 500문제뿐(항목당 약 0.2%); Terminal-Bench 4.0은 66작업, Anthropic 자체 Opus 5.5 수치가 ±2.6점 표준 오차; Arena 약 15-20 Elo 미만 차는 노이즈. 설정 매칭 전 약 3점 미만 차는 불신. 지속 갱신 보드엔 e-process 기반 anytime-valid 테스트(arXiv 2609.32248)가 고정 샘플 구간 재확인의 peeking 문제 없이 "이 차가 진짜인가"에 답.
3. **시간 게이트·비공개·홀드아웃·커미션 세트 선호.** 정적 공개 세트(MMLU·HumanEval·GSM8K·SWE-Bench Pro 공개 분할)엔 오염을 가정하고 절댓값 할인.
4. **하네스·자가 보고 간 비교 금지.** 같은 하네스 숫자만 비교.
5. **모델 이름 새너티 체크.** 1차 출처를 못 찾는 모델에 프런티어 점수가 귀속되면 아마 날조. 2026-10-01 확인 프런티어 이름: Claude Fable 5.1·Mythos 5.1·Opus 5.5·Sonnet 5.5·Haiku 4.5(Fable 5·Opus 5·Sonnet 5 유지); GPT-6 Astra·GPT-6 Sol·GPT-6 Luna·GPT-6.1 Sol·GPT-5.6 Sol·Terra·Luna 세대; Gemini 3.8 Flash·`gemini-3.1-pro-preview`, Gemini 4 Argon 9/30 발표하나 아직 Gemini API 미포함; Grok 4.7; Muse Spark 1.3; 오픈 웨이트 MiMo-V2.6-Pro·GLM-5.3·Kimi K3·DeepSeek V4.1-Flash·V4-Pro·Qwen3.8. 그 날짜 기준 미출시(집계 페이지가 뭐라 하든): GPT-6 Terra·Gemini 3.5 Pro·Claude Haiku 5.5, 그리고 존재한 적 없는 Llama 4 8B/70B/405B. 집계 페이지는 벤치마크 자체 보드와 모순되는 점수도 공개("Gemini 3 Pro SWE-bench Pro 84.8%" 등); 1차 리더보드 확인.
6. **세 신호 유형 삼각측량** 후 랭킹 신뢰: 정적 학술 평가·인간 선호 arena·에이전트 스위트.
7. **내 결정엔 내 데이터로 평가.** 공개 점수가 내 도메인을 예측하는 건 드물다. 리더보드는 누구를 쇼트리스트할지, 내 골드셋은 누구를 출시할지 알려준다.

---

## 2026에 어느 벤치마크가 중요한가

**프런티어 일반 역량** 방향: HLE-Diamond(도구 유무 명시)·라벨 오류 단서의 HLE·CritPt·하네스 명시한 ARC-AGI-2·ARC-AGI-3·복합 지수(Artificial Analysis Intelligence Index v4.3.2·Epoch ECI). 랭킹엔 MMLU·MMLU-Pro·HellaSwag·ARC-Challenge, 그리고 이제 GPQA-Diamond 무시.

**코딩·에이전트**: 실제 랭킹엔 SWE-Bench Pro v2 비공개 세트·DeepSWE·오염 저항 라이브 변형(SWE-rebench·SWE-bench-Live); 터미널 작업엔 Terminal-Bench 4.0·에이전트 과학 워크플로엔 Terminal-Bench-Science(둘 간 벤더 랭킹 다름); 도구 사용 신뢰성엔 tau3-bench(pass^k 주시); 컴퓨터 사용엔 OSWorld 2.x **이진** 완료; 아티팩트 채점 전문 작업엔 Agents' Last Exam; 비용 인식 비교엔 HAL이나 이 보드들의 비용 열. SWE-bench Verified·SWE-Bench Pro 공개 분할은 기껏 티어 필터로. 랭킹엔 HumanEval/MBPP·OSWorld-Verified 무시.

**딥리서치**: BrowseComp-Plus 같은 코퍼스 통제 평가; BrowseComp 자체는 포화.

**장문**: NIAH보다 RULER·Fiction.LiveBench; 광고가 아니라 유효 컨텍스트로 설계.

**임베딩·검색**: MTEB 전용 랭킹보다, 관리자가 평가하는 비공개 홀드아웃 세트와 공개 데이터셋을 섞는 RTEB; [임베딩 모델](../06-retrieval-systems/03-embedding-models.md) 참고.

**사실성**: 폐쇄형 환각엔 SimpleQA·RAG faithfulness엔 FACTS Grounding; 더 유능해도 더 사실적이진 않음을 기억.

**선호**: 신뢰 구간 있는 스타일 통제 Arena Elo(1일차 AutoEval 점수는 예측으로 읽기), 또는 재현 프록시로 Arena-Hard-Auto v2.

그리고 **내 제품엔**: 위 어느 것도 아님. 내 골드셋·판정자를 지어라. 이에 대한 프런티어 연구가 빠르게 이동 중(에이전트 신뢰성 과학·주장 수준 faithfulness 평가·모델이 테스트됨을 감지하는 평가 인지); [Research Radar](https://github.com/ombharatiya/ai-system-design-guide/blob/main/RESEARCH-RADAR.md)(영문) 참고.

---

## 면접 질문

### Q: 벤더가 모델이 SWE-bench Verified 90%라 한다. 내 코딩 에이전트 품질을 예측한다고 믿기 전 무엇을 묻나?

**좋은 답변:**
첫째, 하네스: 어느 에이전트 스캐폴드·무슨 도구·무슨 노력 수준·무슨 출력 토큰 상한? 동일 가중치가 스캐폴드만으로 10-20점 흔들리고 벤더 숫자는 찾은 최고 하네스를 쓰니, 90%는 다른 모델 공개 숫자와 비교 불가. 둘째, 오염: SWE-bench Verified는 부분 오염(OpenAI가 작업 ID서 재현 가능 해답 발견, 저장소 교란 연구가 암기 저장소 단서 의존 입증)이라 오염 저항 세트를 원함: SWE-Bench Pro v2 비공개 분할(Opus 5가 공개 99.4% 대비 거기 81.6%)·DeepSWE 커미션 작업·SWE-rebench. 셋째, 신뢰 구간: 500문제라 몇 점은 노이즈. 넷째이자 가장 중요, 프로덕션 격차: 깨끗한 SWE-bench 숫자도 내 작업이 GitHub 이슈 해결과 닮아야 내 코드베이스를 예측. 공개 숫자로 쇼트리스트하고 보정 판정자가 채점하고 비용에 대고 가격한 우리 저장소 실제 티켓 골드셋으로 결정.

### Q: 왜 MMLU·HumanEval 같은 벤치마크가 프런티어 모델 랭킹에 쓸모없어졌고 무엇이 대체했나?

**좋은 답변:**
포화됐다: 프런티어가 MMLU 88-90%·HumanEval 90%+ 위로 몰려 차가 프롬프트 표현 노이즈 내. 또 작고 공개라 오염 — HumanEval 문제 재도출이 점수 약 39% 하락. 그리고 구성이 너무 쉬움: 단일 함수 docstring-to-code가 실제 엔지니어링 예측 못 해, HumanEval 석권한 같은 모델에 SWE-bench가 2% 미만으로 출시. 분야가 더 어려운 후속(MMLU→MMLU-Pro→HLE→HLE-Diamond)·오염 저항 시간 게이트·커미션 벤치마크(LiveCodeBench·SWE-rebench·DeepSWE)·에이전트 저장소 규모 벤치마크(SWE-Bench Pro·Terminal-Bench·tau3-bench·OSWorld 2.x)·구성 포화 시도 계속 변별하는 복합 지수로 대체. 2026 함정은 후속도 빠르게 바뀜: Terminal-Bench 3.0이 약 4주라, 인용하는 모든 점수에 버전.

### Q: 챗 제품 모델 선택에 Arena(구 LMArena) Elo를 책임감 있게 어떻게 쓰나?

**좋은 답변:**
정확성·추론이 아니라 일반 챗 선호의 한 신호로, 결코 단독 아님. 원시 Arena가 정확성과 무관하게 길고 잘 형식화된 답 보상하니 스타일 통제 보드를 읽고, 상위 10여 모델이 약 15-20 Elo 내 통계적 근접 동률이니 신뢰 구간을 읽는다. 리더보드 착시 효과로 할인: 제공자가 많은 변형을 사적 테스트해 최고 공개하니 신선 상위 항목이 부분 best-of-N 운. 이번 주 출시 모델은 점수가 누적 인간 투표가 아니라 AutoEval 보상 모델 예측인지 확인하고 투표 도착까지 예측으로 취급. 그다음 객관 벤치마크·에이전트 스위트와 삼각측량하고, 궁극적으로 내 선호 데이터로 검증 — Arena 프롬프트는 내 사용자 프롬프트가 아니니.

### Q: 출시 포스트가 ARC-AGI-3 99.9%·OSWorld 2.1 81.8%를 주장한다. 그 숫자를 어떻게 읽나?

**좋은 답변:**
비교 전 무엇이 측정됐는지 핀한다. ARC-AGI-3서 하네스가 헤드라인 결정: ARC Prize가 GPT-6 Astra를 요청 간 불투명 추론 상태를 나르는 OpenAI 자체 컨텍스트 관리 기능의 Provider Adapter 하네스서 99.9%로, 제공자 중립 Standard 하네스서 62.7%로 검증 — 같은 모델·같은 테스트셋. 그래서 어느 하네스·무슨 노력·얼마였는지($18,817 vs $26,098) 묻는다. OSWorld선 어느 지표인지 묻는다: 81.8%는 Opus 5.5에 대한 Anthropic 부분 점수고, 벤치마크 주 지표는 이진 완료인데 거기 최고 리더보드 행이 44.33%(Opus 5 max 노력). 누가 실행했는지(Anthropic 자체 Opus 5 74.0%가 어떤 리더보드 행과도 안 맞음)·안전장치가 일부 작업을 폴백 모델로 라우팅했는지(Anthropic Opus 5.5 평가가 그랬음)도 묻는다. 그다음 실제로 계획할 것: 내 것 같은 작업으로 한정하고 내 평가셋에 확인한, 이진·독립 실행 숫자. 부분 점수는 에이전트가 얼마나 가는지, 이진 점수만 일이 얼마나 자주 완료되는지 알려준다.

---

## 참고 문헌

- Hendrycks et al. "Measuring Massive Multitask Language Understanding (MMLU)" arXiv:2009.03300
- Wang et al. "MMLU-Pro" arXiv:2406.01574
- Rein et al. "GPQA: A Graduate-Level Google-Proof Q&A Benchmark" arXiv:2311.12022
- "Humanity's Last Exam" arXiv:2501.14249
- "ARC-AGI-2" arXiv:2505.11831 and [ARC Prize leaderboard](https://arcprize.org/leaderboard)
- ARC Prize, [GPT-6 Astra on ARC-AGI-3](https://arcprize.org/blog/astra) (September 2026)
- [HLE-Diamond](https://lastexam.ai/blog/hle-diamond) (September 2026)
- [Epoch AI FrontierMath](https://epoch.ai/frontiermath) and [benchmarks hub](https://epoch.ai/benchmarks)
- Ansari et al. "How Good Are Frontier Models at Physics? Expert Re-Grading Reveals Broken Evaluations and Near-Saturation of Leading Benchmarks" arXiv:2609.13009
- Jimenez et al. "SWE-bench" arXiv:2310.06770 and [swebench.com](https://www.swebench.com/)
- Scale Labs, [SWE-Bench Pro v2 announcement](https://labs.scale.com/blog/swe-bench-pro-v2) and [public v2 leaderboard](https://labs.scale.com/leaderboard/swe_bench_pro_public_v2)
- "Maintaining Benchmarks Against Increasingly Capable Agents: Detection and Remediation of Unearned Passes" arXiv:2609.34262
- [DeepSWE](https://deepswe.datacurve.ai/blog/deepswe-v1-1) (Datacurve)
- [Terminal-Bench 4.0](https://www.tbench.ai/news/terminal-bench-4-0) and [leaderboard](https://www.tbench.ai/leaderboard/terminal-bench/4.0); [Terminal-Bench-Science 0.1](https://www.tbench.ai/news/terminal-bench-science-0-1)
- "SWE-bench-Live" arXiv:2505.23419 and [SWE-rebench](https://swe-rebench.com/)
- Jain et al. "LiveCodeBench" arXiv:2403.07974
- [Berkeley Function Calling Leaderboard (BFCL)](https://gorilla.cs.berkeley.edu/leaderboard.html)
- [Sierra tau-bench repository (tau2-bench, now tau3-bench)](https://github.com/sierra-research/tau2-bench) and [hyper-tau-bench](https://sierra.ai/blog/hyper-t-bench-evaluating-agents-that-build-agents)
- "OSWorld 2.0" arXiv:2606.29537 and [XLANG OSWorld 2.0 leaderboard](https://osworld-v2.xlang.ai/)
- "Agents' Last Exam" arXiv:2606.05405 and [leaderboard](https://snorkel.ai/leaderboard/agents-last-exam/)
- "GDPval" arXiv:2510.04374 and [OpenAI GDPval](https://openai.com/index/gdpval/)
- [METR, measuring AI task-completion time horizons](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks)
- "RULER" arXiv:2404.06654 and [NVIDIA/RULER](https://github.com/NVIDIA/RULER)
- "MMMU-Pro" arXiv:2409.02813
- [OpenAI SimpleQA](https://openai.com/index/introducing-simpleqa/) and "SimpleQA Verified" arXiv:2509.07968
- "FACTS Grounding" arXiv:2501.03200
- Singh et al. "The Leaderboard Illusion" arXiv:2504.20879 and the LMArena response
- Arena, [AutoEval scores](https://arena.ai/blog/autoeval-scores) and [agent categories and cost per task](https://arena.ai/blog/agent-categories-and-cost)
- "Holistic Agent Leaderboard (HAL)" arXiv:2510.11977
- [Artificial Analysis methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking) and [Epoch Capability Index](https://epoch.ai/benchmarks)
- Desai et al. benchmark construct validity across 56 benchmarks and 53 models, arXiv:2609.08812
- Google DeepMind, [double-blind AI evaluation pilot](https://deepmind.google/blog/piloting-the-worlds-first-double-blind-ai-evaluations/) (August 2026)
- METR, [OpenAI / Hugging Face incident investigation](https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/) (August 2026)
- Anthropic, "Quantifying infrastructure noise in agentic coding evals" (Feb 2026)
- Hamel Husain, ["Your AI Product Needs Evals"](https://hamel.dev/blog/posts/evals/) and ["LLM-as-a-Judge"](https://hamel.dev/blog/posts/llm-judge/)

---

*다음: [LLM 애플리케이션 CI/CD](../11-infrastructure-and-mlops/02-cicd.md). 리더보드 너머 프런티어 토픽은 [Research Radar](https://github.com/ombharatiya/ai-system-design-guide/blob/main/RESEARCH-RADAR.md)(영문) 참고.*
