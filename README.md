# 헤어살롱 예약 관리 시스템

헤어디자이너와 고객을 위한 예약 관리 웹 애플리케이션입니다.

## 기능

### 고객
- 서비스, 디자이너, 날짜/시간 선택 (5단계 예약 플로우)
- 실시간 가능 시간대 확인
- 예약 확인 화면

### 디자이너
- 로그인 후 개인 예약 관리 대시보드
- 오늘 / 예정 / 전체 예약 조회
- 예약 상태 관리: 대기중 → 확정 → 완료 / 취소
- 통계 카드 (오늘 예약 현황)

## 실행 방법

```bash
# 의존성 설치
cd server && npm install
cd ../client && npm install

# 개발 서버 실행 (두 터미널)
cd server && npm run dev      # 백엔드 :3001
cd client && npm run dev      # 프론트엔드 :5173
```

## 테스트 계정

| 디자이너 | 아이디 | 비밀번호 |
|---------|--------|---------|
| 김지수 (커트) | jisu | 1234 |
| 이민준 (컬러) | minjun | 1234 |
| 박소연 (펌) | soyeon | 1234 |

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, better-sqlite3
- **Auth**: JWT

## URL

- 고객 예약: `http://localhost:5173/`
- 디자이너 로그인: `http://localhost:5173/login`
- 디자이너 대시보드: `http://localhost:5173/dashboard`
