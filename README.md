# Color & T Picker

오프라인/QR 접속용 단일 폼. 참가자가 본인 ID(번호)로 5색 순서와 T값(2T+1~5T+4)을 제출하면, 관리자 화면에서 ID별 제출 현황을 볼 수 있습니다.

## 요구사항
- ID 범위: 기본 1~100 (lib/config.ts에서 수정 가능)
- 색상: 빨/노/파/초/흰 순서 드래그 또는 위아래 버튼으로 재배열
- T 값: 2T+1..4 / 3T+1..4 / 4T+1..4 / 5T+1..4 중 선택
- 같은 ID 재제출 시 최신 값으로 덮어쓰기
- 관리자 화면(/admin): ID별 색상 순서, T값, 업데이트 시간 표시. 5초마다 자동 새로고침 + 수동 새로고침 버튼

## 실행
```bash
npm install
npm run dev
```

## 구조
- `app/page.tsx` 참가자 폼
- `app/admin/page.tsx` 관리자 테이블
- `app/api/submit` POST 저장 (덮어쓰기)
- `app/api/data` GET 모든 제출 + 범위
- `app/api/participant` GET 특정 ID 조회
- `lib/config.ts` ID 범위 설정
- `lib/constants.ts` 색상/T값 목록
- `lib/db.ts` better-sqlite3 DB (데이터 파일: `data/db.sqlite`)

## QR 사용
- 배포한 홈 URL(`/`)을 QR로 만들어 참가자에게 배포하면 됩니다 (코드 없음).

## 주의
- Windows에서 better-sqlite3 빌드에 필요한 도구가 없다면 `npm install --build-from-source=better-sqlite3`가 필요할 수 있습니다.
