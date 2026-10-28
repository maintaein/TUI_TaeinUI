import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { HoldButton } from '@taein-ui/core';

const meta = {
  title: 'Motion/HoldButton',
  component: HoldButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: '삭제',
    confirmLabel: '한 번 더 누르면 삭제',
    onConfirm: () => {},
  },
} satisfies Meta<typeof HoldButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// 1.5초 꾹 누르면 차올라 실행된다. 짧게 누르면 글자가 바뀌고, 한 번 더 누르면 실행된다
const Demo = (args: ComponentProps<typeof HoldButton>) => {
  const [done, setDone] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <HoldButton {...args} onConfirm={() => setDone(true)} />
      <span>{done ? '삭제했습니다' : '아직 지우지 않았습니다'}</span>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <Demo {...args} />,
};

export const Disabled: Story = {
  args: { disabled: true },
};
