import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, SloshGauge } from '@taein-ui/core';

const meta = {
  title: 'Motion/SloshGauge',
  component: SloshGauge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    value: 60,
    label: '저장 공간',
  },
} satisfies Meta<typeof SloshGauge>;

export default meta;
type Story = StoryObj<typeof meta>;

// 값이 바뀌면 출렁이고, 쉬는 동안에도 잔물결이 남는다. 단추로 값을 바꿔 본다
const Demo = (args: ComponentProps<typeof SloshGauge>) => {
  const [value, setValue] = useState(args.value);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <SloshGauge {...args} value={value} />
      <div style={{ display: 'flex', gap: 8 }}>
        {[20, 60, 90].map((v) => (
          <Button key={v} variant="light" onClick={() => setValue(v)}>
            {v}
          </Button>
        ))}
      </div>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <Demo {...args} />,
};

export const WithValueText: Story = {
  args: { valueText: '6GB / 10GB' },
  render: (args) => <Demo {...args} />,
};

// paused면 지금 모습에서 멈춘다. 값을 바꿔도 출렁임 없이 수위만 바로 바뀐다
export const Paused: Story = {
  args: { paused: true },
  render: (args) => <Demo {...args} />,
};
