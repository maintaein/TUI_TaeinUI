import type { Meta, StoryObj } from '@storybook/react';
import { BrushText } from '@taein-ui/core';

const meta = {
  title: 'Motion/BrushText',
  component: BrushText,
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
} satisfies Meta<typeof BrushText>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시: 화면에 들어올 때 한 번 붓으로 쓰듯 나타난다. 폰트는 들고 있지 않고 부모의 font-family를 쓴다(붓 글꼴을 주려면 소비자가 @font-face로 불러 부모에 준다)
export const Default: Story = {
  args: {
    text: '붓으로 쓰듯 나타납니다',
    as: 'h1',
  },
};

// 한글과 라틴, 숫자, 문장부호가 섞인 문장. 한글이 아닌 글자는 칸 하나를 왼쪽에서 오른쪽으로 한 번 쓴다
export const Mixed: Story = {
  args: {
    text: 'TaeinUI로 쓴 2026년 한글 문장, 닭과 값어치.',
    as: 'h2',
  },
};
