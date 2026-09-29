# @taein-ui/core

TUI(TaeinUI)의 핵심 컴포넌트 라이브러리입니다.
30개의 React UI 컴포넌트와 디자인 토큰을 제공합니다.

[![npm version](https://img.shields.io/npm/v/@taein-ui/core)](https://www.npmjs.com/package/@taein-ui/core)

## 설치

```bash
npm install @taein-ui/core
# 또는
pnpm add @taein-ui/core
```

### Peer Dependencies

- `react` ^18.2.0 또는 ^19.0.0
- `react-dom` ^18.2.0 또는 ^19.0.0 (react와 같은 메이저 버전)

## 빠른 시작

```tsx
// 1. CSS import (앱 엔트리에서 한 번)
import '@taein-ui/core/styles.css';

// 2. 컴포넌트 사용
import { Button, TextField, Card } from '@taein-ui/core';

function LoginForm() {
  return (
    <Card variant="outlined" padding="lg">
      <TextField label="이메일" placeholder="email@example.com" />
      <TextField label="비밀번호" type="password" />
      <Button variant="primary" size="lg" fullWidth>
        로그인
      </Button>
    </Card>
  );
}
```

## 컴포넌트 목록

### 버튼

- **Button** — 기본 버튼 (primary, secondary, light, danger, ghost)
- **IconButton** — 아이콘 전용 버튼
- **SegmentedButtons** — 세그먼트 선택 버튼 그룹

### 입력

- **TextField** — 텍스트 입력 필드 (label, helperText, error 지원)
- **TextArea** — 여러 줄 텍스트 입력
- **Checkbox** — 체크박스 (indeterminate 지원)
- **Switch** — 토글 스위치
- **Slider** — 범위 슬라이더
- **NumericSpinner** — 숫자 증감 입력

### 표시

- **Text** — 타이포그래피 컴포넌트 (h1~h6, body, caption 등)
- **Badge** — 상태/수량 배지
- **Chip** — 태그/필터 칩
- **Avatar** — 사용자 아바타 (이미지, 이니셜, 아이콘)
- **Icon** — SVG 아이콘 래퍼

### 피드백

- **Loader** — 로딩 바/스피너
- **LoadingSpinner** — 회전 로딩 인디케이터
- **Skeleton** — 콘텐츠 로딩 플레이스홀더
- **Snackbar** — 알림 토스트
- **Tooltip** — 호버/포커스 시 툴팁

### 오버레이

- **Modal** — 모달 다이얼로그 (Header, Body, Footer 서브컴포넌트)
- **BottomSheet** — 하단 시트 (모바일)
- **SideSheet** — 사이드 패널
- **Popover** — 팝오버 (위치 자동 조정)

### 레이아웃

- **Card** — 카드 컨테이너 (Header, Body, Footer 서브컴포넌트)
- **List** — 리스트 (Item, ItemButton, Divider 서브컴포넌트)
- **BoardRow** — 게시판 행
- **Divider** — 구분선
- **Border** — 테두리 래퍼
- **HeaderBar** — 상단 헤더 바

### 폼

- **FormField** — 폼 필드 래퍼 (render prop 패턴)

## 디자인 토큰

```tsx
import { themeContract } from '@taein-ui/core';
```

| 토큰          | 경로 예시                                 |
| ------------- | ----------------------------------------- |
| Colors        | `themeContract.color.primary.main`        |
| Typography    | `themeContract.font.size.md`              |
| Spacing       | `themeContract.spacing[4]`                |
| Shadows       | `themeContract.shadow.md`                 |
| Border Radius | `themeContract.borderRadius.md`           |
| Animation     | `themeContract.animation.duration.normal` |

## API 패턴

모든 컴포넌트는 일관된 API를 따릅니다:

- `variant` — 시각적 스타일 (primary, secondary 등)
- `size` — 크기 (sm, md, lg)
- `disabled` — 비활성화 상태
- `className` — 커스텀 클래스 추가
- `ref` — forwardRef 지원

## 빌드 출력

```
dist/
├── index.mjs         # ES Module
├── index.cjs         # CommonJS
├── index.d.ts        # TypeScript 선언
├── core.css          # 컴파일된 CSS
└── components/       # 개별 컴포넌트 모듈 (Tree-shaking 지원)
```

## 개발

```bash
pnpm dev              # 빌드 감시 모드
pnpm build            # 라이브러리 빌드
pnpm test             # 테스트 실행
pnpm test:coverage    # 커버리지 포함
pnpm typecheck        # 타입 체크
```

## 라이선스

[MIT](../../LICENSE) © Taein
