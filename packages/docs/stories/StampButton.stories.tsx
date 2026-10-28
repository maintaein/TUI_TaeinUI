import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, StampButton } from '@taein-ui/core';

const meta = {
  title: 'Motion/StampButton',
  component: StampButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: '제출',
    stampLabel: '승인',
  },
} satisfies Meta<typeof StampButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// 한 번만 찍힌다. 다시 찍어 보려면 key를 바꿔 새로 그린다
const Demo = (args: ComponentProps<typeof StampButton>) => {
  const [round, setRound] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <StampButton key={round} {...args} />
      <Button variant="light" onClick={() => setRound((n) => n + 1)}>
        다시 찍기
      </Button>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <Demo {...args} />,
};

export const Disabled: Story = {
  args: { disabled: true },
};
