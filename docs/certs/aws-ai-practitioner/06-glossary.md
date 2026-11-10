---
title: 06. 서비스·모델·용어 한 줄 사전
sidebar_label: 06. 한 줄 사전
sidebar_position: 7
description: AIF-C01에 나오는 AWS AI 서비스·파운데이션 모델·핵심 용어를 한 줄로 정리한 빠른 참조 사전
---

# AI Practitioner 서비스·모델·용어 한 줄 사전

본문을 읽다 모르는 서비스·모델·용어가 나오면 여기서 **한 줄로** 확인한다. 복습·시험 직전 훑기용. (본문에는 각 문서에서 **처음 나올 때** 괄호로 짧은 설명을 달아 두었다.)

## 기초 개념

| 용어 | 한 줄 설명 |
|---|---|
| **AI / ML / 딥러닝 / 생성형 AI** | 포함 관계: AI ⊃ ML(데이터로 학습) ⊃ 딥러닝(신경망) ⊃ 생성형 AI(새 콘텐츠 생성) |
| **지도학습** | 정답(레이블) 있는 데이터로 학습 — 분류(범주)·회귀(수치) |
| **비지도학습** | 정답 없이 구조 발견 — 군집화·이상탐지 |
| **강화학습** | 보상 신호로 시행착오 학습 |
| **특성(Feature) / 레이블(Label)** | 특성=입력 변수, 레이블=예측할 정답 |
| **학습(Training) / 추론(Inference)** | 학습=모델 만들기, 추론=만든 모델로 예측 |
| **과적합(Overfitting)** | 학습 데이터엔 잘 맞지만 새 데이터엔 약함(일반화 실패) |
| **MLOps** | 데이터·모델·배포를 자동화·버전관리·모니터링하는 운영 체계 |

## 생성형 AI 개념

| 용어 | 한 줄 설명 |
|---|---|
| **파운데이션 모델(FM)** | 방대한 데이터로 사전학습된 범용 대형 모델(여러 작업에 적응) |
| **LLM** | 텍스트에 특화된 FM(다음 토큰 예측으로 문장 생성) |
| **멀티모달 모델** | 텍스트 + 이미지·음성 등 여러 양식을 함께 처리 |
| **토큰(Token)** | 텍스트를 쪼갠 처리 단위 |
| **임베딩(Embedding)** | 의미를 숫자 벡터로 변환(검색·RAG의 기반) |
| **트랜스포머 / 어텐션** | 현대 LLM의 신경망 구조와 "중요한 토큰에 가중치" 메커니즘 |
| **컨텍스트 윈도** | 모델이 한 번에 볼 수 있는 토큰 양 |
| **파라미터** | 모델이 학습으로 조정한 가중치(많을수록 성능↑·비용↑) |
| **사전학습(Pre-training)** | 대규모 범용 데이터로 기초 능력 형성(고비용) |
| **파인튜닝(Fine-tuning)** | 특정 도메인·말투에 맞춘 추가 학습 |
| **RLHF** | 사람 선호 피드백으로 모델을 유용·무해하게 정렬 |
| **환각(Hallucination)** | 그럴듯하지만 사실이 아닌 출력 |
| **프롬프트 엔지니어링** | 지시·예시로 출력을 조정(제로샷/퓨샷) |
| **RAG** | 외부 지식을 검색해 프롬프트에 결합(환각·지식한계 보완) |
| **벡터DB / 벡터 저장소** | 임베딩을 저장·유사도 검색하는 DB(OpenSearch·pgvector 등) |
| **추론 파라미터** | 출력 성향 조절 — temperature(다양성)·top-k/top-p·max tokens |
| **LLM-as-judge** | 다른 모델이 출력을 채점하는 자동 평가 |

## 완성형 AI 서비스 (모델을 직접 안 만듦)

| 서비스 | 한 줄 설명 |
|---|---|
| **Rekognition** | 이미지·영상 분석(객체·얼굴·유해 콘텐츠) |
| **Transcribe** | 음성 → 텍스트(STT) |
| **Polly** | 텍스트 → 음성(TTS) |
| **Translate** | 기계 번역 |
| **Comprehend** | 텍스트 분석(감정·개체·핵심구·PII 탐지) |
| **Textract** | 문서에서 텍스트·표·양식 추출(OCR 이상) |
| **Lex** | 챗봇·음성봇(대화형 인터페이스) |
| **Personalize** | 개인화 추천 |
| **Forecast** | 시계열 수요 예측 |
| **Kendra** | 사내 문서를 자연어로 검색하는 지능형 엔터프라이즈 검색 |
| **Fraud Detector** | 온라인 사기 탐지 |

## 플랫폼 · 생성형 AI 서비스

| 서비스 | 한 줄 설명 |
|---|---|
| **SageMaker** | ML 모델을 직접 구축·학습·배포하는 종합 플랫폼 |
| **SageMaker JumpStart** | 사전학습 FM을 골라 배포·파인튜닝 |
| **SageMaker Clarify** | 편향 탐지 + 설명가능성(특성 기여도) |
| **SageMaker Model Monitor** | 배포 후 데이터·품질 드리프트 모니터링 |
| **SageMaker Model Cards** | 모델 용도·성능·한계를 문서화(거버넌스) |
| **Bedrock** | 여러 FM을 API로 쓰는 완전관리형 GenAI 서비스 |
| **Bedrock Knowledge Bases** | 관리형 RAG(데이터 연결·임베딩·검색 자동화) |
| **Bedrock Agents** | 도구(API)를 호출해 다단계 작업을 수행하는 에이전트 |
| **Bedrock Guardrails** | 유해·금지 주제·PII를 거르는 안전 가드레일 |
| **Amazon Q (Developer/Business)** | AWS 생성형 AI 어시스턴트 — 코딩용/업무·사내데이터용 |
| **Titan / Nova** | AWS 자체 파운데이션 모델(텍스트·임베딩·이미지 등) |
| **PartyRock** | 코딩 없이 Bedrock 기반 GenAI 앱을 실험하는 놀이터 |
| **A2I (Augmented AI)** | 사람 검토 워크플로(Human-in-the-loop) |

## 책임 있는 AI · 보안 · 거버넌스

| 용어 | 한 줄 설명 |
|---|---|
| **공정성 / 설명가능성 / 투명성** | 책임 AI 차원 — 차별 없음 / 결정 이유 설명 / 작동·한계 공개 |
| **Human-in-the-loop** | 고위험·되돌리기 어려운 결정에 사람 검토를 끼움 |
| **AI Service Cards** | AWS AI 서비스의 용도·한계·공정성 정보 공개 문서 |
| **책임 공유 모델** | AWS(인프라 보안) vs 고객(데이터·권한·사용 방식) 책임 분담 |
| **IAM / KMS / VPC 엔드포인트** | 접근 통제 / 암호화 / 사설 접근 — AI 데이터 보호 기본 |
| **CloudTrail / AWS Config / AWS Artifact** | API 감사 / 구성 준수 평가 / 규정 준수 보고서 |
| **Lake Formation / Glue Data Catalog** | 데이터 레이크 권한 관리 / 데이터 분류·카탈로그 |

## 약어

| 약어 | 뜻 |
|---|---|
| **FM** | Foundation Model. 파운데이션 모델 |
| **LLM** | Large Language Model. 대규모 언어 모델 |
| **RAG** | Retrieval-Augmented Generation. 검색 증강 생성 |
| **RLHF** | Reinforcement Learning from Human Feedback |
| **PII** | Personally Identifiable Information. 개인식별정보 |
| **STT / TTS** | Speech-to-Text / Text-to-Speech |
| **ROUGE / BLEU** | 요약·번역 품질 정량 지표 |
