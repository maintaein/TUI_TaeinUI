import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, LuminousFlow } from '@taein-ui/core';

const meta = {
  title: 'Motion/LuminousFlow',
  component: LuminousFlow,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    scrollScene: { control: 'boolean' },
    paused: { control: 'boolean' },
  },
} satisfies Meta<typeof LuminousFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

// 부모 상자를 채운다. 부모가 position 기준(relative 등)이어야 한다
export const Default: Story = {
  render: (args) => (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <LuminousFlow {...args} />
    </div>
  ),
};

// 작은 상자에서도 그림이 상자를 넘지 않는다
export const SmallBox: Story = {
  parameters: { layout: 'centered' },
  render: (args) => (
    <div style={{ position: 'relative', width: 320, height: 200 }}>
      <LuminousFlow {...args} />
    </div>
  ),
};

// 상자 높이를 장면 높이(2162)에 맞춘 긴 물길. 흐름 속도는 창 스크롤을 따른다
export const ScrollScene: Story = {
  args: { scrollScene: true },
  render: (args) => (
    <div style={{ position: 'relative', width: '100vw', height: 2162 }}>
      <LuminousFlow {...args} />
    </div>
  ),
};

// paused면 지금 장면에서 멈추고(WCAG 2.2.2), 풀면 이어서 흐른다
const PausedDemo = () => {
  const [paused, setPaused] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <LuminousFlow paused={paused} />
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <Button
          variant="light"
          size="sm"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? '다시 흐르게 하기' : '멈추기'}
        </Button>
      </div>
    </div>
  );
};

export const Paused: Story = {
  render: () => <PausedDemo />,
};
