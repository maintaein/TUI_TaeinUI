import type { Preview } from '@storybook/react';
import '@taein-ui/core';

// Global styles 적용
import '../stories/global.css';

// Story 래퍼: 패딩만 적용 (테마 클래스 불필요: core의 CSS 변수가 :root에 전역 적용됨)
function StoryWrapper({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '2rem', minHeight: '100vh' }}>{children}</div>;
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
};

export default preview;
