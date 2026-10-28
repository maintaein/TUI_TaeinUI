import type { Meta, StoryObj } from '@storybook/react';
import { CopyButton } from '@taein-ui/core';

const meta = {
  title: 'Motion/CopyButton',
  component: CopyButton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    value: 'pnpm add @taein-ui/core',
  },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// 누르면 클립보드 아이콘이 체크로 접히고 글자가 "복사됨"으로 바뀐다
export const Default: Story = {};

// 문구를 바꾼 모습. 접근 가능한 이름은 label이다
export const CustomLabels: Story = {
  args: {
    value: 'https://example.com',
    label: '링크 복사',
    copiedLabel: '복사했습니다',
    failedLabel: '복사하지 못했습니다',
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
