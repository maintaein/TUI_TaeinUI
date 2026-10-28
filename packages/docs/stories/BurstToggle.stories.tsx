import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BurstToggle } from '@taein-ui/core';
import { Heart } from 'lucide-react';

const meta = {
  title: 'Motion/BurstToggle',
  component: BurstToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    'aria-label': '좋아요',
    selected: false,
    selectedIcon: <Heart fill="currentColor" />,
    children: <Heart />,
  },
} satisfies Meta<typeof BurstToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// 상태는 소비자가 쥔다. 켜면 아이콘이 납작했다 튕기며 채워지고 파란 점이 터진다
const Toggle = (args: ComponentProps<typeof BurstToggle>) => {
  const [selected, setSelected] = useState(false);
  return (
    <BurstToggle
      {...args}
      selected={selected}
      onClick={() => setSelected(!selected)}
    />
  );
};

export const Default: Story = {
  render: (args) => <Toggle {...args} />,
};

// 처음부터 켜져 있으면 터지지 않는다
export const InitiallySelected: Story = {
  args: { selected: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
