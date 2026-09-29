# TUI — TaeinUI

컴포넌트마다 다른 움직임을 갖는 React UI 컴포넌트 라이브러리입니다.
전 컴포넌트에 같은 전환 하나를 입히는 대신, 컴포넌트 각각이 자기 성격에 맞는 모션을 갖습니다.
통일성을 내려놓는 범위는 모션까지이고, 시인성·가독성·가시성은 그 밖입니다 — 모션이 이 셋 중
하나라도 깎으면 틀린 쪽은 모션입니다.

https://tds-taein-design-system.vercel.app/

[![npm version](https://img.shields.io/npm/v/@taein-ui/core)](https://www.npmjs.com/package/@taein-ui/core)
[![license](https://img.shields.io/npm/l/@taein-ui/core)](./LICENSE)

## 특징

- **컴포넌트별 모션** — 열림·전환·되먹임을 컴포넌트마다 따로 설계합니다. 같은 이징 하나를 전부에 바르지 않습니다
- **GSAP이 모션의 메인 런타임** — 현재 12개 컴포넌트가 GSAP으로 움직입니다. CSS가 못 하는 것(트리거 좌표 읽기, 제스처 1:1 추적, 여러 목표를 동시에 중단)이 있는 자리에만 쓰고, 나머지는 CSS 트랜지션으로 둡니다. 최신 목록은 [`packages/core/llms.txt`](./packages/core/llms.txt)의 "Motion (GSAP Runtime)" 절
- **시인성은 협상 대상이 아님** — WCAG 2.2 AA를 테스트로 잠가 두었고, `prefers-reduced-motion`에서는 CSS 전역 규칙과 GSAP 트윈 게이트가 함께 움직임을 끕니다
- **컴포넌트 패밀리 30개** — Button, Modal, Card 등 실무에 필요한 UI 컴포넌트. 패키지의 top-level export는 49개로, 차이는 개별 import도 가능한 하위 컴포넌트입니다(`ModalHeader`, `CardBody`, `AvatarGroup`, `ListItem` 등)
- **Zero-runtime CSS** — Vanilla Extract 기반, 빌드 타임에 CSS 생성
- **Tree-shakable** — 사용하는 컴포넌트만 번들에 포함
- **TypeScript** — 엄격 모드, `any` 미사용, 완전한 타입 지원
- **AI 친화** — llms.txt 제공, 일관된 API 패턴, JS doc 주석

런타임 의존성은 `@vanilla-extract/css`, `@vanilla-extract/recipes`, `clsx`, `gsap` 넷입니다.

## 설치

```bash
npm install @taein-ui/core
# 또는
pnpm add @taein-ui/core
# 또는
yarn add @taein-ui/core
```

### 요구 사항

- `react` ^19.0.0 이상
- `react-dom` ^19.0.0 이상 (react와 같은 메이저 버전)

## 사용법

### 1. CSS import

```tsx
// 앱 엔트리 파일 (main.tsx 등)
import '@taein-ui/core/styles.css';
```

### 2. 컴포넌트 사용

```tsx
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

| 카테고리     | 컴포넌트                                                      |
| ------------ | ------------------------------------------------------------- |
| **버튼**     | Button, IconButton, SegmentedButtons                          |
| **입력**     | TextField, TextArea, Checkbox, Switch, Slider, NumericSpinner |
| **표시**     | Text, Badge, Chip, Avatar, Icon                               |
| **피드백**   | Loader, LoadingSpinner, Skeleton, Snackbar, Tooltip           |
| **오버레이** | Modal, BottomSheet, SideSheet, Popover                        |
| **레이아웃** | Card, List, BoardRow, Divider, Border, HeaderBar              |
| **폼**       | FormField                                                     |

## 모션

GSAP 런타임이 실제로 붙어 있는 컴포넌트입니다. 계획이 아니라 코드에서 읽은 목록이고,
여기 없는 컴포넌트는 CSS 트랜지션만 씁니다.

| 컴포넌트                                           | GSAP이 맡는 일                                    |
| -------------------------------------------------- | ------------------------------------------------- |
| Modal, BottomSheet, SideSheet                      | 타임라인 상대 위치, 트리거 좌표 읽기, 드래그 추적 |
| Checkbox, Switch, SegmentedButtons, NumericSpinner | 모양 변형, 여러 목표를 동시에 중단                |
| Slider, HeaderBarNav                               | 제스처·포인터 추적                                |
| Snackbar, TextField, TextArea                      | CSS가 못 보는 값 읽기(진행률·줄바꿈 위치)         |

`prefers-reduced-motion: reduce`에서는 CSS 전역 규칙이 트랜지션·애니메이션을 끄고,
GSAP으로 도는 트윈은 인라인 스타일이라 그 규칙이 안 닿으므로 각 훅이 `gateMotion`으로
끝 상태에 확정한 뒤 멈춥니다. 중간 프레임에 멈추는 경우가 구조적으로 없습니다.

## 테마 토큰

색·간격·타이포·이징은 `themeContract` 하나로 모여 있고 공개 API입니다. 모션을 컴포넌트마다
다르게 가져가는 대신, 대비와 읽기 쉬움을 소비자가 직접 조일 수 있게 남겨 둔 손잡이입니다.
테마는 `:root`에 선언된 라이트 하나뿐이라 Provider도 훅도 없습니다.

```tsx
import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const customStyle = style({
  color: themeContract.color.primary.main,
  padding: themeContract.spacing[4],
  borderRadius: themeContract.borderRadius.md,
});
```

전체 토큰 경로와 실측 대비비는 [`packages/core/llms-full.txt`](./packages/core/llms-full.txt)의
Design Tokens 절에 있습니다 — 토큰 소스에서 생성되므로 문서와 코드가 어긋날 수 없습니다.

## 프로젝트 구조

```
designsystem/
├── packages/
│   ├── core/          # 컴포넌트 라이브러리 (@taein-ui/core)
│   ├── demo/          # 데모 및 문서 앱
│   └── docs/          # Storybook
├── LICENSE
└── README.md
```

## 기술 스택

| 구분          | 기술                     |
| ------------- | ------------------------ |
| UI            | React 18/19              |
| 언어          | TypeScript 5.9 (strict)  |
| 스타일링      | Vanilla Extract CSS      |
| 빌드          | Vite 7                   |
| 테스트        | Vitest + Testing Library |
| 패키지 매니저 | pnpm workspace           |

## 로컬 개발

```bash
# 의존성 설치
pnpm install

# core 패키지 빌드
pnpm build:all

# 테스트 실행
pnpm test

# 타입 체크
pnpm typecheck

# 데모 앱 실행
cd packages/demo && pnpm dev
```

## AI 지원

TUI는 AI 도구와의 협업을 위해 다음을 제공합니다:

- **llms.txt** — 컴포넌트 요약 정보 (NPM 패키지에 포함)
- **llms-full.txt** — 전체 Props 인터페이스 및 예제 코드

## 라이선스

[MIT](./LICENSE) © Taein
