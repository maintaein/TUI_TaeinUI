# @taein-ui/demo

TUI(TaeinUI)의 데모 및 문서 웹 애플리케이션입니다.
컴포넌트 사용법, 디자인 토큰, 접근성 가이드라인 등을 확인할 수 있습니다.

## 실행

```bash
# 루트에서
cd packages/demo

# 개발 서버 (http://localhost:3000)
pnpm dev

# 프로덕션 빌드
pnpm build

# 빌드 결과 미리보기
pnpm preview
```

> core 패키지가 먼저 빌드되어 있어야 합니다: `pnpm --filter core build`

## 페이지 구성

| 경로                   | 페이지        | 설명                                         |
| ---------------------- | ------------- | -------------------------------------------- |
| `/`                    | 소개          | TUI 개요, 핵심 목표, 빠른 미리보기           |
| `/getting-started`     | 시작하기      | 설치 방법, 사용법, 테마 설정                 |
| `/design-tokens/*`     | 디자인 토큰   | 색상, 타이포그래피, 간격, 그림자, 애니메이션 |
| `/components/overview` | 컴포넌트 개요 | 전체 컴포넌트 목록                           |
| `/components/:name`    | 컴포넌트 상세 | Props 표, 라이브 프리뷰, 접근성, 코드 예제   |
| `/guidelines/*`        | 가이드라인    | 접근성, 디자인 원칙                          |

## 구조

```
packages/demo/
├── src/
│   ├── main.tsx              # 엔트리 포인트
│   ├── components/           # 데모 전용 컴포넌트
│   │   ├── CodeBlock/        # 코드 하이라이팅
│   │   ├── LivePreview/      # 라이브 프리뷰 + 코드 표시
│   │   ├── PropsTable/       # Props 문서 테이블
│   │   ├── ColorPalette/     # 색상 팔레트 표시
│   │   ├── SearchDialog/     # 검색 다이얼로그
│   │   └── EditableCodeBlock/# 편집 가능한 코드 블록
│   ├── layouts/              # 레이아웃
│   │   ├── RootLayout.tsx    # 루트 (Header + Sidebar + Content)
│   │   ├── Header.tsx        # 헤더 (로고, 테마 토글)
│   │   └── Sidebar.tsx       # 사이드바 네비게이션
│   ├── pages/                # 페이지 컴포넌트
│   │   ├── Introduction/
│   │   ├── GettingStarted/
│   │   ├── DesignTokens/
│   │   ├── Components/       # 컴포넌트별 상세 페이지 (30개)
│   │   └── Guidelines/
│   ├── routes/               # React Router 설정
│   ├── data/                 # 네비게이션, 검색 인덱스 등
│   └── styles/               # 글로벌 스타일
├── public/
│   ├── fonts/                # Pretendard 폰트
│   └── favicon.svg
└── package.json
```

## 기술 스택

- React 19 + React Router DOM 6
- Vanilla Extract CSS
- react-syntax-highlighter (코드 하이라이팅)
- react-simple-code-editor (편집 가능 코드 블록)
- Vite 7

## 반응형

- **768px 이하**: 사이드바 숨김, 햄버거 메뉴로 토글
- **768px 초과**: 사이드바 항상 표시

## 배포

SPA이므로 모든 경로를 `index.html`로 리다이렉트하는 설정이 필요합니다.

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## 라이선스

[MIT](../../LICENSE) © Taein
