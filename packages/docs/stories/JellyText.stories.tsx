import type { Meta, StoryObj } from '@storybook/react';
import { JellyText } from '@taein-ui/core';

const meta = {
  title: 'Motion/JellyText',
  component: JellyText,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'],
    },
  },
} satisfies Meta<typeof JellyText>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시: 마우스를 글자 위로 지나가 본다. 터치와 움직임 줄이기에서는 평범한 글자다
export const Default: Story = {
  args: {
    text: '말랑한 글자',
    as: 'h1',
  },
};

// 한글과 라틴이 섞인 문장
export const Mixed: Story = {
  args: {
    text: 'TaeinUI로 만든 말랑한 한글 문장',
    as: 'h2',
  },
};

// 좁은 폭의 긴 문장. 낱말은 줄 끝에서 갈리지 않고 커서가 있는 줄의 글자만 반응한다
export const LongNarrow: Story = {
  args: {
    text: '커서가 지나가는 글자가 말랑하게 늘었다 출렁이며 돌아옵니다 그리고 낱말은 줄 끝에서 갈리지 않습니다',
    as: 'p',
  },
  render: (args) => (
    <div style={{ width: 240 }}>
      <JellyText {...args} />
    </div>
  ),
};
