import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '@taein-ui/core';

const meta = {
  title: 'Components/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'body3'],
      description: '텍스트 variant',
    },
    as: {
      control: 'text',
      description: 'HTML 태그 (variant보다 우선)',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'disabled'],
      description: '텍스트 색상',
    },
    weight: {
      control: 'select',
      options: ['regular', 'medium', 'semibold', 'bold'],
      description: '폰트 굵기',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: '텍스트 정렬',
    },
    truncate: {
      control: 'select',
      options: [undefined, 1, 2, 3],
      description: '텍스트 줄 수 제한',
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본
export const Default: Story = {
  args: {
    children: '기본 텍스트입니다',
  },
};

// Heading Variants
export const Headings: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Text variant="h1">Heading 1 - 2.25rem (36px) / 700</Text>
      <Text variant="h2">Heading 2 - 1.875rem (30px) / 700</Text>
      <Text variant="h3">Heading 3 - 1.5rem (24px) / 600</Text>
      <Text variant="h4">Heading 4 - 1.25rem (20px) / 600</Text>
      <Text variant="h5">Heading 5 - 1.125rem (18px) / 600</Text>
      <Text variant="h6">Heading 6 - 1rem (16px) / 600</Text>
    </div>
  ),
};

// Body Variants
export const Bodies: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Text variant="body1">Body 1 - 1rem (16px)</Text>
      <Text variant="body2">Body 2 - 0.875rem (14px)</Text>
      <Text variant="body3">Body 3 - 0.75rem (12px)</Text>
    </div>
  ),
};

// Colors
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Text color="primary">Primary 텍스트 (검정)</Text>
      <Text color="secondary">Secondary 텍스트 (회색)</Text>
      <Text color="success">Success 텍스트 (초록)</Text>
      <Text color="error">Error 텍스트 (빨강)</Text>
    </div>
  ),
};

// Weights
export const Weights: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Text weight="regular">Regular 굵기 (400)</Text>
      <Text weight="medium">Medium 굵기 (500)</Text>
      <Text weight="semibold">Semibold 굵기 (600)</Text>
      <Text weight="bold">Bold 굵기 (700)</Text>
    </div>
  ),
};

// Alignments
export const Alignments: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '400px',
      }}
    >
      <Text align="left">왼쪽 정렬 텍스트</Text>
      <Text align="center">가운데 정렬 텍스트</Text>
      <Text align="right">오른쪽 정렬 텍스트</Text>
    </div>
  ),
};

// Truncate
export const Truncate: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        width: '300px',
      }}
    >
      <div>
        <Text variant="h6">1줄 제한</Text>
        <Text truncate={1}>
          이것은 매우 긴 텍스트입니다. 이 텍스트는 한 줄을 초과하면
          말줄임표(...)로 표시됩니다. 계속해서 더 많은 내용을 작성하고 있습니다.
        </Text>
      </div>
      <div>
        <Text variant="h6">2줄 제한</Text>
        <Text truncate={2}>
          이것은 매우 긴 텍스트입니다. 이 텍스트는 두 줄을 초과하면
          말줄임표(...)로 표시됩니다. 계속해서 더 많은 내용을 작성하고 있습니다.
          더 많은 텍스트를 추가합니다.
        </Text>
      </div>
      <div>
        <Text variant="h6">3줄 제한</Text>
        <Text truncate={3}>
          이것은 매우 긴 텍스트입니다. 이 텍스트는 세 줄을 초과하면
          말줄임표(...)로 표시됩니다. 계속해서 더 많은 내용을 작성하고 있습니다.
          더 많은 텍스트를 추가합니다. 계속해서 더 많은 내용을 작성하고
          있습니다.
        </Text>
      </div>
    </div>
  ),
};

// As Prop
export const AsProp: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Text variant="h1" as="span">
        h1 스타일이지만 span 태그입니다
      </Text>
      <Text variant="body1" as="div">
        body1 스타일이지만 div 태그입니다
      </Text>
    </div>
  ),
};

// 조합 예시
export const Combination: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '600px',
      }}
    >
      <Text variant="h1" color="primary" weight="bold" align="center">
        TUI - TaeinUI
      </Text>
      <Text variant="body1" color="secondary" align="center">
        컴포넌트마다 다른 움직임을 갖는 UI 컴포넌트 라이브러리입니다.
      </Text>
      <Text variant="body2" color="success">
        ✓ 성공적으로 저장되었습니다
      </Text>
      <Text variant="body2" color="error">
        ✗ 오류가 발생했습니다
      </Text>
      <Text variant="body3">마지막 업데이트: 2024년 1월 1일</Text>
    </div>
  ),
};
