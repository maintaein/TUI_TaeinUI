# TUI: TaeinUI

재미있는 모션과 인터랙티브한 효과를 추구한 React UI 컴포넌트 라이브러리입니다.

컴포넌트 각각이 자기 역할에 맞는 특별한 모션을 가지면서도, 시인성·가독성·가시성은 접근성 기준에 맞추어 구현했습니다.

AI가 멋대로 만들어내는 이상한 UI 컴포넌트에 질리셨나요?

느낌없는 애니메이션 효과를 보니 내 토큰이 아까워지진 않으셨나요?

매번 "처음엔 이렇게 나왔다가 여기로 갔다가 어떠어떠한 느낌을 줘서..."라는 프롬프트를 입력하는 것이 지치지는 않으신가요?

그렇다면 TaeinUI가 무료로 해결해드릴 수 있습니다.

https://tui-taein-ui.vercel.app/

[![npm version](https://img.shields.io/npm/v/@taein-ui/core)](https://www.npmjs.com/package/@taein-ui/core)
[![license](https://img.shields.io/npm/l/@taein-ui/core)](./LICENSE)

변경 기록은 [CHANGELOG.md](./CHANGELOG.md)에 있습니다.

## 무엇으로 만들었나

주된 모션들은 GSAP으로 구현했습니다. 단, 오버엔지니어링을 방지하기 위해 CSS로 되는 건 CSS로 두고, CSS가 못 하는 것에만 GSAP을 사용했습니다. GSAP은 주로 트리거가 화면 어디 있는지 읽거나, 손가락을 1:1로 따라가거나, 여러 움직임을 동시에 멈춰야 하는 자리에 활용했습니다.

CSS는 빌드할 때 다 만들어져 나오기 때문에 런타임에 스타일을 계산하지 않습니다. 쓰는 컴포넌트만 번들에 들어갑니다. 타입은 엄격 모드로 썼고 `any`는 없습니다.

색·간격·타이포·이징은 `themeContract` 한 곳에 모여 있고 공개돼 있습니다. 모션은 컴포넌트마다 다르게 가져가지만 대비와 가독성은 조정할 수 있게 했습니다.

llms.txt도 같이 실어 보냅니다. AI한테 "이 라이브러리 어떻게 쓰냐"고 물어볼 때 쓰시면 됩니다. 요약은 `llms.txt`에 있고 npm 패키지에 같이 들어갑니다. Props 전체와 예제까지 필요하시면 [`llms-full.txt`](./packages/core/llms-full.txt)를 보시면 됩니다.

## 설치

```bash
npm install @taein-ui/core
# 또는
pnpm add @taein-ui/core
# 또는
yarn add @taein-ui/core
```

### 요구 사항

- `react` ^18.2.0 또는 ^19.0.0
- `react-dom` ^18.2.0 또는 ^19.0.0 (react와 같은 메이저 버전)

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

| 카테고리     | 컴포넌트                                            |
| ------------ | --------------------------------------------------- |
| **버튼**     | Button, IconButton, SegmentedButtons                |
| **입력**     | TextField, Checkbox, Switch, Slider, NumericSpinner |
| **표시**     | Badge, Chip, Avatar                                 |
| **피드백**   | Loader, Skeleton, Snackbar, Tooltip                 |
| **오버레이** | Modal, BottomSheet, SideSheet, Popover              |
| **레이아웃** | Card, List, BoardRow, Divider, Border, HeaderBar    |
| **폼**       | FormField                                           |

## 모션

GSAP 런타임이 붙어 있는 컴포넌트입니다. 여기 없는 컴포넌트는 CSS 트랜지션으로만 구현했습니다.

| 컴포넌트                                           | GSAP이 맡는 일                                    |
| -------------------------------------------------- | ------------------------------------------------- |
| Modal, BottomSheet, SideSheet                      | 타임라인 상대 위치, 트리거 좌표 읽기, 드래그 추적 |
| Checkbox, Switch, SegmentedButtons, NumericSpinner | 모양 변형, 여러 목표를 동시에 중단                |
| Slider, HeaderBar                                  | 제스처·포인터 추적                                |
| Snackbar, TextField, TextArea                      | CSS가 못 보는 값 읽기(진행률·줄바꿈 위치)         |

`prefers-reduced-motion: reduce`에서는 CSS 전역 규칙이 트랜지션·애니메이션을 끄고,
GSAP으로 도는 트윈은 인라인 스타일이라 그 규칙이 안 닿으므로 각 훅이 `gateMotion`으로
끝 상태에 확정한 뒤 멈춥니다. 중간 프레임에 멈추는 경우가 구조적으로 없습니다.

## 테마 토큰

색·간격·타이포·이징은 `themeContract` 하나로 모여 있고 공개 API입니다. 모션을 컴포넌트마다
다르게 가져가는 대신, 대비와 읽기 쉬움을 소비자가 직접 조일 수 있게 남겨 둔 도구입니다.
테마는 `:root`에 선언된 라이트 하나입니다.

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
Design Tokens 절에 있습니다. 토큰 소스에서 생성되므로 문서와 코드가 어긋날 수 없습니다.

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
| 모션          | GSAP 3.15                |
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

## 라이선스

[MIT](./LICENSE) © Taein
