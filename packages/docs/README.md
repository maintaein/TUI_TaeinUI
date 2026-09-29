# @taein-ui/docs

TUI(TaeinUI)의 Storybook 문서 패키지입니다.
컴포넌트의 상태와 모션을 컨트롤로 바꿔 가며 눈으로 확인할 수 있습니다.

## 실행

```bash
# 루트에서
cd packages/docs

# Storybook 개발 서버 (http://localhost:6006)
pnpm storybook

# Storybook 빌드
pnpm build
```

> core 패키지가 먼저 빌드되어 있어야 합니다: `pnpm --filter core build`

## 구조

```
packages/docs/
├── .storybook/
│   ├── main.ts          # Storybook 설정
│   └── preview.ts       # 글로벌 데코레이터 (전역 스타일 적용)
├── stories/
│   ├── Introduction.mdx # 소개 문서
│   ├── Button.stories.tsx
│   ├── Card.stories.tsx
│   └── ...              # 컴포넌트별 스토리
└── package.json
```

## 스토리 작성 패턴

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@taein-ui/core';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'light', 'danger', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '버튼',
  },
};
```

## 기술 스택

- Storybook 8
- @storybook/react-vite
- @storybook/addon-a11y (접근성 검사)

## 라이선스

[MIT](../../LICENSE) © Taein
