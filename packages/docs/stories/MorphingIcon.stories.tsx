import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconButton, MorphingIcon } from '@taein-ui/core';

const meta = {
  title: 'Motion/MorphingIcon',
  component: MorphingIcon,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    pair: {
      control: 'select',
      options: [
        'menu-close',
        'plus-check',
        'play-pause',
        'search-close',
        'expand-collapse',
      ],
    },
    active: { control: 'boolean' },
  },
} satisfies Meta<typeof MorphingIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

const ToggleDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <IconButton
      aria-label="메뉴"
      aria-pressed={open}
      onClick={() => setOpen((v) => !v)}
    >
      <MorphingIcon pair="menu-close" active={open} />
    </IconButton>
  );
};

// 기본 예시: 단추가 active를 쥐고, 누를 때마다 선이 늘어나고 접히며 메뉴와 닫기를 오간다. 상태는 단추의 aria-pressed가 전한다
export const Default: Story = {
  args: { pair: 'menu-close', active: false },
  render: () => <ToggleDemo />,
};
