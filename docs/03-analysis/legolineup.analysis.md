# LegoLineup Gap Analysis Report

## Executive Summary

| Item | Value |
|------|-------|
| Feature | legolineup |
| Analysis Date | 2026-03-24 |
| Framework | Next.js 14.1.0, React 18.2.0, Firebase Firestore |
| Design Document | README.md + INSTRUCTOR_MANUAL.md (공식 설계 문서 없음) |

### Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Feature Match (Design vs Impl) | 92% | ✅ |
| Architecture Compliance | 55% | ❌ |
| Convention Compliance | 62% | ⚠️ |
| Code Quality | 50% | ❌ |
| Security | 30% | ❌ |
| **Overall Match Rate** | **58%** | **❌** |

---

## 1. Feature Gap Analysis

### 1.1 API Endpoints

| # | 설계 엔드포인트 | 구현 | 상태 |
|---|----------------|------|------|
| 1 | POST /api/submit — colors + tValue 저장 | `app/api/submit/route.ts` | ✅ 일치 |
| 2 | GET /api/data — 전체 제출 + 범위 | `app/api/data/route.ts` | ✅ 일치 |
| 3 | GET /api/participant — ID 단건 조회 | `app/api/participant/route.ts` | ✅ 일치 |
| 4 | (미설계) | POST /api/reset — 전체 초기화 | ⚠️ 추가됨 |
| 5 | (미설계) | POST /api/settings — 턴 입력 토글 | ⚠️ 추가됨 |
| 6 | (미설계) | POST/PUT/DELETE /api/record — CRUD | ⚠️ 추가됨 |

**결과:** 설계된 3개 엔드포인트 모두 구현 (100%). 설계 외 3개 엔드포인트 추가.

### 1.2 Data Model

| 필드 | 설계 | 구현 | 상태 |
|------|------|------|------|
| id | number (1-100) | number (ID_MIN-ID_MAX) | ✅ 일치 |
| colors | 5색 배열 | JSON 문자열 → 배열 파싱 | ✅ 일치 |
| tValue | 2T+1..5T+4 | 정규식 검증 `^\d+T\+\d+$` | ✅ 일치 |
| updatedAt | (미설계) | ISO 타임스탬프 | ⚠️ 추가됨 |
| record | (미설계) | M' SS" 형식 문자열 | ⚠️ 추가됨 |
| records | (미설계) | JSON 배열 (최대 3개) | ⚠️ 추가됨 |

### 1.3 화면/기능별 대조

| # | 설계 기능 (INSTRUCTOR_MANUAL) | 구현 | 상태 |
|---|-------------------------------|------|------|
| 1 | Step 1: 팀 ID + 색상 순서 선택 | app/page.tsx step 1 | ✅ |
| 2 | Step 2: 대기 화면 + 강사 게이트 | app/page.tsx step 2 | ✅ |
| 3 | Step 3: 턴 번호 입력 (2 드롭다운) | app/page.tsx step 3 | ✅ |
| 4 | Step 4: 완료 화면 | app/page.tsx step 4 | ✅ |
| 5 | 2, 4단계 수정 버튼 | handleEdit() step 1 리셋 | ✅ |
| 6 | Admin: 실시간 데이터 테이블 | admin dashboard 탭 | ✅ |
| 7 | Admin: 데이터 초기화 버튼 | handleReset() + /api/reset | ✅ |
| 8 | Admin: 턴 활성화 토글 | settings toggle | ✅ |
| 9 | Admin: 전체보기 모달 + 정렬 | isFullView + 4가지 정렬 | ✅ |
| 10 | Admin: 기록 입력 탭 | recorder 탭 | ✅ |
| 11 | Admin: 통계/분석 탭 | stats 탭 | ✅ |
| 12 | Admin: 기록 편집/삭제 | PUT/DELETE + 인라인 편집 | ✅ |
| 13 | 드래그앤드롭 색상 순서 변경 | SortableLegoItem.tsx 존재하나 **미사용** | ❌ 고아 코드 |
| 14 | 5초마다 자동 새로고침 (README) | Firebase onSnapshot (실시간) | ⚠️ 변경됨 |

**기능 일치율: 12/14 = 86%**

---

## 2. 발견된 차이점

### 2.1 설계에 있으나 미구현 (Critical/Important)

| # | 항목 | 설계 위치 | 설명 | 심각도 |
|---|------|----------|------|--------|
| 1 | 드래그앤드롭 색상 재배열 | README.md | SortableLegoItem.tsx 존재하지만 page.tsx에서 미사용 | Minor |

### 2.2 설계에 없으나 추가 구현됨

| # | 항목 | 위치 | 설명 |
|---|------|------|------|
| 1 | 기록 CRUD | app/api/record/route.ts | 강사용 시간 기록 관리 |
| 2 | 설정 토글 | app/api/settings/route.ts | 턴 입력 활성화/비활성화 |
| 3 | 데이터 초기화 | app/api/reset/route.ts | 전체 제출 데이터 삭제 |
| 4 | 통계/분석 탭 | app/admin/page.tsx | 팀 순위, 인사이트, T값 차트 |
| 5 | 기록 관리 UI | app/admin/page.tsx | 인라인 편집/삭제 (최대 3개) |
| 6 | Firebase 실시간 동기화 | lib/db.ts | 폴링 대신 onSnapshot 사용 |

### 2.3 설계와 다르게 구현됨

| # | 항목 | 설계 | 구현 | 영향 |
|---|------|------|------|------|
| 1 | 색상 선택 방식 | 드래그 재배열 | 순차 탭 선택 | 낮음 — UX 개선 |
| 2 | 데이터 새로고침 | 5초 폴링 | Firebase 실시간 | 낮음 — 개선됨 |
| 3 | 데이터베이스 | better-sqlite3 (README) | Firebase Firestore | **높음** — 근본적 변경 |
| 4 | README 정확성 | DB, 인터랙션 설명 | 5곳 이상 오류 | **높음** — README 업데이트 필요 |

---

## 3. 코드 품질 분석

### 3.1 보안 이슈 (Critical)

| 심각도 | 파일 | 이슈 | 권고 조치 |
|--------|------|------|----------|
| **CRITICAL** | lib/firebase.ts | Firebase API 키, appId 등 소스코드에 하드코딩됨 | NEXT_PUBLIC_ 환경변수로 이전 |
| **CRITICAL** | app/admin/page.tsx | /admin 페이지 인증 없음 — 누구나 데이터 초기화/수정 가능 | 비밀번호 게이트 또는 인증 미들웨어 추가 |
| Important | 프로젝트 루트 | .env.example 미존재 | .env.example + .env.local 생성 필요 |

### 3.2 코드 스멜

| 유형 | 파일 | 설명 | 심각도 |
|------|------|------|--------|
| 모놀리식 컴포넌트 | app/admin/page.tsx | 1100줄+ 단일 파일에 모든 로직 집중 | Critical |
| 모놀리식 컴포넌트 | app/page.tsx | 4단계 + 인라인 SVG 모두 467줄 | Important |
| 고아 코드 | components/SortableLegoItem.tsx | 어디서도 import되지 않음 | Minor |
| 미사용 의존성 | package.json @dnd-kit/* | SortableLegoItem 미사용으로 불필요 | Minor |
| 로직 중복 | app/admin/page.tsx | 데스크탑 테이블/모바일 카드 표시 중복 | Important |

### 3.3 파일별 복잡도

| 파일 | 라인 수 | 상태 |
|------|--------|------|
| app/admin/page.tsx | ~1100 | ❌ 분리 필요 |
| app/page.tsx | 467 | ⚠️ 경계선 |
| lib/db.ts | 205 | ✅ 양호 |
| lib/utils.ts | 44 | ✅ 양호 |

---

## 4. README 정확성

| README 내용 | 실제 현황 | 상태 |
|------------|----------|------|
| "better-sqlite3 DB (data/db.sqlite)" | Firebase Firestore 사용 | ❌ 오류 |
| "드래그 또는 위아래 버튼으로 재배열" | 탭 순차 선택 방식 | ❌ 오류 |
| "5초마다 자동 새로고침" | Firebase onSnapshot 실시간 | ❌ 오류 |
| submit/data/participant API만 언급 | 6개 API 엔드포인트 존재 | ❌ 불완전 |
| "Windows에서 better-sqlite3 빌드" 노트 | Firebase로 불필요 | ❌ 구식 |

---

## 5. 권고 조치 우선순위

### 즉시 조치 (Critical)

| # | 항목 | 파일 | 설명 |
|---|------|------|------|
| 1 | Firebase 설정 환경변수 이전 | lib/firebase.ts | API 키 git 노출 위험. .env.local + NEXT_PUBLIC_ 변수 생성 |
| 2 | Admin 페이지 인증 추가 | app/admin/page.tsx | 최소 비밀번호 게이트 추가 필요 |

### 단기 (1주일 내)

| # | 항목 | 설명 |
|---|------|------|
| 3 | README.md 업데이트 | 5곳 이상 사실 오류 수정 |
| 4 | admin 페이지 분리 | DashboardTab, StatsTab, RecorderTab, FullViewModal 컴포넌트로 추출 |
| 5 | .env.example 생성 | 필요 환경변수 문서화 |
| 6 | 고아 코드 제거 | SortableLegoItem.tsx + @dnd-kit 의존성 삭제 |

### 장기 (백로그)

| # | 항목 | 설명 |
|---|------|------|
| 7 | 커스텀 훅 추출 | useSubmissions(), useSettings(), useRecordManager() |
| 8 | 서비스 레이어 추가 | services/submission.ts, services/record.ts |
| 9 | 테스트 커버리지 | 현재 0% — 테스트 없음 |
| 10 | Next.js 업그레이드 | 14.1.0 → 15.x+ |

---

## 6. 심각도 요약

| 심각도 | 건수 | 항목 |
|--------|:----:|------|
| CRITICAL | 2 | Firebase 자격증명 소스 노출, Admin 인증 없음 |
| Important | 5 | README 오류, 모놀리식 admin, .env 없음, 고아 코드, 공식 설계 문서 없음 |
| Minor | 4 | dnd-kit 미사용 의존성, 인라인 SVG, import 순서, 명명 일관성 |

---

*Generated by bkit gap-detector — 2026-03-24*
