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

// 상자가 길수록 굽이가 늘어난다. 창 스크롤을 따라 보이는 구간만 그리고 흐름 속도도 창 스크롤을 따른다
export const Tall: Story = {
  render: (args) => (
    <div style={{ position: 'relative', width: '100vw', height: 6000 }}>
      <LuminousFlow {...args} />
    </div>
  ),
};

// 스크롤 상자 안: 가장 가까운 스크롤 조상을 읽는다. 상자 안에서 스크롤하면 물줄기를 따라 맨 아래 마감까지 내려간다
export const InScrollBox: Story = {
  parameters: { layout: 'centered' },
  render: (args) => (
    // 스크롤 상자는 키보드로 스크롤할 수 있어야 한다
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div style={{ width: 480, height: 480, overflowY: 'auto' }} tabIndex={0}>
      <div style={{ position: 'relative', height: 3600 }}>
        <LuminousFlow {...args} />
      </div>
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
