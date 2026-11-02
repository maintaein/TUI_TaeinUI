import { useState, type ComponentProps } from 'react';
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

type IconProps = ComponentProps<typeof MorphingIcon>;

// 컨트롤의 pair와 active가 먹는다. active가 컨트롤에서 바뀌면 단추 상태도 그 값을 따른다
const ToggleDemo = ({ pair, active }: IconProps) => {
  const [on, setOn] = useState(active);
  const [seen, setSeen] = useState(active);
  if (seen !== active) {
    setSeen(active);
    setOn(active);
  }
  return (
    <IconButton
      aria-label="아이콘 바꾸기"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
    >
      <MorphingIcon pair={pair} active={on} />
    </IconButton>
  );
};

// 기본 예시: 단추가 active를 쥐고, 누를 때마다 선이 늘어나고 접히며 짝을 오간다. 상태는 단추의 aria-pressed가 전한다
export const Default: Story = {
  args: { pair: 'menu-close', active: false },
  render: (args) => <ToggleDemo {...args} />,
};
