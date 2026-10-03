# @taein-ui/core

컴포넌트마다 다른 움직임을 갖는 React UI 컴포넌트 라이브러리, TUI(TaeinUI)의 본체입니다.
컴포넌트 패밀리 30개(top-level export 49개)를 제공하고, 모션은 GSAP이 주도합니다.

전 컴포넌트에 같은 전환 하나를 입히지 않는 대신, 시인성·가독성·가시성은 어디서도 낮추지
않습니다. 모션이 이 셋 중 하나라도 깎으면 틀린 쪽은 모션입니다.

[![npm version](https://img.shields.io/npm/v/@taein-ui/core)](https://www.npmjs.com/package/@taein-ui/core)

변경 기록은 [CHANGELOG.md](https://github.com/maintaein/TUI_TaeinUI/blob/main/CHANGELOG.md)에 있습니다.

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

- **Button** — 기본 버튼 (variant: primary, dark, danger, light / buttonStyle: fill, weak)
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

### 피드백

- **Loader** — 로딩 바/스피너
- **Skeleton** — 콘텐츠 로딩 플레이스홀더
- **Snackbar** — 알림 토스트
- **Tooltip** — 호버/포커스 시 툴팁

### 오버레이

- **Modal** — 모달 다이얼로그 (Header, Title, Content, Footer 서브컴포넌트)
- **BottomSheet** — 하단 시트 (모바일)
- **SideSheet** — 사이드 패널
- **Popover**: 클릭으로 여는 팝오버 (위·아래·좌·우 배치)

### 레이아웃

- **Card** — 카드 컨테이너 (Header, Body, Footer 서브컴포넌트)
- **List** — 리스트 (Item 서브컴포넌트, divider 옵션)
- **BoardRow** — 게시판 행
- **Divider** — 구분선
- **Border** — 테두리 래퍼
- **HeaderBar** — 상단 헤더 바

### 폼

- **FormField** — 폼 필드 래퍼 (render prop 패턴)

## 모션

현재 GSAP 런타임이 붙어 있는 컴포넌트는 12개입니다 — Modal, BottomSheet, SideSheet,
Snackbar, Checkbox, Switch, SegmentedButtons, NumericSpinner, Slider, HeaderBarNav,
TextField, TextArea. 여기 없는 컴포넌트는 CSS 트랜지션만 씁니다. GSAP은 "쓸 수 있으니
쓴다"가 아니라 CSS로는 못 하는 일(트리거 좌표 읽기, 제스처 1:1 추적, 여러 목표를 동시에
중단)이 있는 자리에만 들어갑니다. 최신 목록과 각자 쓰는 능력은 `llms.txt`의
"Motion (GSAP Runtime)" 절에 있습니다.

`prefers-reduced-motion: reduce`에서는 CSS 전역 규칙이 트랜지션·애니메이션을 끄고,
전역 규칙이 닿지 않는 GSAP 트윈은 각 훅이 끝 상태로 확정한 뒤 멈춥니다.

## 테마 토큰

색·간격·타이포·이징은 `themeContract` 하나로 모이고, 공개 API로 열려 있습니다.
테마는 `:root`에 선언된 라이트 하나뿐이라 Provider도 훅도 필요 없습니다.

```tsx
import { themeContract } from '@taein-ui/core';
```

| 토큰          | 경로 예시                               |
| ------------- | --------------------------------------- |
| Colors        | `themeContract.color.primary.main`      |
| Typography    | `themeContract.font.size.md`            |
| Spacing       | `themeContract.spacing[4]`              |
| Shadows       | `themeContract.shadow.md`               |
| Border Radius | `themeContract.borderRadius.md`         |
| Animation     | `themeContract.animation.duration.base` |

전체 경로와 실측 대비비는 `llms-full.txt`의 Design Tokens 절에 있습니다.

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

[MIT](./LICENSE) © Taein
