# CLAUDE.md - 장교조 재정 관리 웹앱

이 문서는 AI 어시스턴트가 본 코드베이스 작업 시 참고할 가이드입니다.

## 프로젝트 개요

**목적:** 함께하는장애인교원노동조합(장교조) 재정 관리 웹 애플리케이션

**주요 기능:**
- 월별 재정 보고서 시각화 (수입/지출)
- 예산 대비 실제 지출 비교
- 추세 분석 차트
- 예산 계획 및 초안 작성 도구
- 재정 기록 전체 텍스트 검색

**기술 스택:**
- 프론트엔드: 순수 JavaScript (ES6+), HTML5, CSS3
- 차트: Chart.js (CDN 사용)
- 빌드: Node.js 스크립트
- 배포: Vercel (정적 호스팅)
- UI 언어: 한국어

## 프로젝트 구조

```
fin-report-2025/
├── app/                          # 웹 애플리케이션 (배포 대상)
│   ├── index.html               # 단일 진입점
│   ├── css/style.css            # 전체 스타일 (724줄)
│   ├── js/
│   │   ├── app.js               # 메인 앱 컨트롤러
│   │   ├── utils/
│   │   │   ├── format.js        # 통화/날짜 포맷팅
│   │   │   └── keyboard.js      # 키보드 단축키 및 내비게이션
│   │   └── views/               # 기능별 모듈
│   │       ├── dashboard.js     # 요약 통계
│   │       ├── monthly.js       # 월별 보고서 뷰어
│   │       ├── budget.js        # 예산 대비 실제 비교
│   │       ├── trends.js        # 추세 차트 (Chart.js)
│   │       ├── planner.js       # 예산 초안 작성 도구
│   │       └── search.js        # 전체 텍스트 검색
│   └── data/
│       ├── reports.json         # 생성된 월별 보고서
│       └── budget.json          # 생성된 예산 데이터
│
├── monthly-reports/             # 원본: 월별 재정 보고서 (TXT)
├── budget-closing/              # 원본: 예산/결산 파일 (CSV)
├── build.js                     # ETL 스크립트: TXT/CSV → JSON
├── build.bat                    # Windows 빌드 래퍼
└── vercel.json                  # 배포 설정
```

## 주요 명령어

```bash
# 데이터 파일 빌드 (TXT/CSV 원본을 JSON으로 변환)
node build.js

# Windows 환경
build.bat

# 정적 HTML 앱 - 직접 열거나 로컬 서버 사용
# Python 예시:
cd app && python -m http.server 8000
```

## 데이터 흐름

```
원본 파일                        빌드 과정                  애플리케이션
─────────────────              ─────────────              ───────────────
monthly-reports/*.txt    ──┐
                           ├──> node build.js ──> app/data/reports.json ──┐
budget-closing/*.csv     ──┘                  ──> app/data/budget.json  ──┼──> app.js ──> Views
```

**빌드 스크립트 (`build.js`):**
- 한국어 마크다운 형식의 월별 보고서 파싱
- CSV 예산/결산 파일 파싱
- UTF-8 인코딩 및 BOM 제거 처리
- 프론트엔드용 구조화된 JSON 출력

## 아키텍처 패턴

### 모듈 패턴
각 뷰는 싱글톤 객체로 구성:
```javascript
const Dashboard = {
  render(data) { /* ... */ },
  calculateYearStats(reports) { /* ... */ }
}
```

### 애플리케이션 흐름
1. `app.js`가 fetch로 JSON 데이터 로드
2. 내비게이션 이벤트가 뷰 전환 트리거
3. 뷰가 템플릿 문자열로 DOM 렌더링
4. 프레임워크 없음 - 순수 DOM 조작

### 상태 관리
- `App.data`: 로드된 JSON (reports, budget) 저장
- `App.currentView`: 현재 활성 뷰 추적
- 뷰별 로컬 상태 유지 (예: `Monthly.selectedMonth`)
- `Planner`는 localStorage로 초안 영구 저장

## 코드 컨벤션

### 네이밍
- **변수/함수:** camelCase (`formatCurrency`, `selectedMonth`)
- **객체/클래스:** PascalCase (`Dashboard`, `Monthly`, `Keyboard`)
- **CSS 클래스:** kebab-case (`.stat-card`, `.month-selector`)
- **ID:** 접두사 포함 kebab-case (`#view-dashboard`, `#main-content`)

### 파일 구성
- `app/js/views/`에 뷰당 하나의 파일
- `app/js/utils/`에 유틸리티
- `style.css` 단일 파일에 CSS 커스텀 속성 사용

### CSS 변수 (디자인 시스템)
```css
--color-primary: #2563eb;    /* 파란색 - 주요 액션 */
--color-income: #059669;     /* 초록색 - 수입 표시 */
--color-expense: #dc2626;    /* 빨간색 - 지출 표시 */
--color-balance: #2563eb;    /* 파란색 - 잔액 표시 */
--color-warning: #f59e0b;    /* 황색 - 경고 */
```

## 접근성 기능

이 앱은 접근성을 우선시합니다:
- 시맨틱 HTML5 (header, nav, main, section)
- 인터랙티브 요소에 ARIA 레이블
- 키보드 내비게이션 (Tab, 화살표 키)
- 키보드 단축키 (1-5: 뷰 전환, Ctrl+K: 검색, ?: 도움말)
- `.sr-only` 클래스로 스크린 리더 전용 콘텐츠
- 키보드 사용자를 위한 건너뛰기 링크
- 포커스 표시 스타일
- 테이블 캡션 및 적절한 헤더

## 중요 파일 안내

| 파일 | 용도 |
|------|------|
| `app/js/app.js` | 진입점, 데이터 로딩, 내비게이션 |
| `app/js/views/planner.js` | 가장 큰 뷰 (418줄), 예산 초안 작성 |
| `build.js` | 데이터 변환 (518줄), 업데이트 시 필수 |
| `app/css/style.css` | 전체 스타일, 상단에 CSS 변수 정의 |
| `vercel.json` | 배포 설정, `/app` 디렉토리 지정 |

## 데이터 작업

### 월별 보고서 추가
1. `monthly-reports/`에 다음 형식의 TXT 파일 추가:
   ```
   # 2025년 X월 함께하는장애인교원노동조합 재정 보고서

   ## 요약
   - 전월이월금: X원
   - 당월수입: X원
   ...
   ```
2. `node build.js` 실행
3. `app/data/reports.json`에 데이터 반영

### 예산 데이터 수정
1. `budget-closing/`의 CSV 파일 편집
2. `node build.js` 실행
3. `app/data/budget.json`에 데이터 반영

## 자주 하는 작업

### 새 뷰 추가
1. `app/js/views/newview.js` 생성 (render 메서드 포함)
2. `index.html`에 script 태그 추가
3. `index.html`에 내비게이션 링크 추가
4. `app.js`의 navigate/renderView 메서드에 등록

### 스타일 수정
- 모든 스타일은 `app/css/style.css`에 있음
- `:root`에 CSS 변수 정의 (테마용)
- 모바일 반응형 브레이크포인트 이미 정의됨

### 차트 시각화 수정
- 차트는 `app/js/views/trends.js`에 있음
- Chart.js 라이브러리 사용 (CDN 로드)
- 뷰 전환 시 차트 파괴 후 재생성

## 배포

**플랫폼:** Vercel (git push 시 자동 배포)

**과정:**
1. `node build.js` 실행하여 JSON 데이터 생성
2. 생성된 `app/data/*.json` 포함하여 변경사항 커밋
3. 저장소에 푸시
4. Vercel이 `/app` 디렉토리를 정적 사이트로 배포

## 테스트

**현재 상태:** 자동화된 테스트 없음
- 수동 테스트만 진행
- `app/index.html`을 로컬에서 열어 뷰 테스트

## 언어 및 인코딩

- **UI 언어:** 한국어
- **인코딩:** UTF-8
- **빌드 스크립트:** Windows에서 생성된 파일의 BOM 제거 처리
- **통화:** 원(₩), 천 단위 구분자 포맷

## AI 어시스턴트를 위한 팁

1. **원본 데이터 파일 수정 후 반드시 `node build.js` 실행**
2. **인코딩 확인** - 한국어 텍스트는 반드시 UTF-8
3. **버전 파라미터** - 캐싱 문제 발생 시 index.html의 스크립트 태그에서 `?v=X` 업데이트
4. **package.json 없음** - npm 의존성 없음 (빌드용 Node.js만 사용)
5. **로컬 테스트** - 변경사항 확인을 위해 `app/index.html`을 브라우저에서 열기
6. **접근성 유지** - 편집 시 ARIA 레이블과 시맨틱 HTML 유지
7. **통화 포맷 정확히** - `utils/format.js`의 `formatCurrency()` 사용
8. **키보드 단축키** - 새 단축키 추가 시 `utils/keyboard.js`에 문서화
