import type { Meta, StoryObj } from '@storybook/react';
import { HangulAssemble } from '@taein-ui/core';

const meta = {
  title: 'Motion/HangulAssemble',
  component: HangulAssemble,
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
} satisfies Meta<typeof HangulAssemble>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시: 화면에 들어올 때 한 번 재생한다
export const Default: Story = {
  args: {
    text: '안녕하세요',
    as: 'h1',
  },
};

// 한글과 라틴, 숫자, 문장부호가 섞인 문장. 한글이 아닌 글자는 페이드만 한다
export const Mixed: Story = {
  args: {
    text: 'TaeinUI로 만든 2026년 한글 문장, 닭과 값어치.',
    as: 'h2',
  },
};

// 좁은 폭의 긴 문장. 낱말은 줄 끝에서 갈리지 않는다
export const LongNarrow: Story = {
  args: {
    text: '흩어진 조각이 글자 칸 안의 제자리로 맞물려 완성된 글자가 됩니다 그리고 낱말은 줄 끝에서 갈리지 않습니다',
    as: 'p',
  },
  render: (args) => (
    <div style={{ width: 240 }}>
      <HangulAssemble {...args} />
    </div>
  ),
};
