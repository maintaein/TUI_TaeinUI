import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@taein-ui/core';

/**
 * Icon 컴포넌트
 *
 * SVG 기반의 아이콘 시스템입니다.
 * - 5가지 아이콘 지원 (close, plus, minus, chevron-down, chevron-up)
 * - 4가지 크기 (sm: 16px, md: 20px, lg: 24px, xl: 32px)
 * - currentColor 기본 지원으로 부모 색상 상속
 * - 접근성 완비 (aria-label, title)
 */
const meta = {
  title: 'Components/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    name: 'plus',
  },
  argTypes: {
    name: {
      control: 'select',
      options: ['close', 'plus', 'minus', 'chevron-down', 'chevron-up'],
      description: '아이콘 이름',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '아이콘 크기',
    },
    color: {
      control: 'color',
      description: '아이콘 색상 (CSS 색상 값)',
    },
    'aria-label': {
      control: 'text',
      description: '접근성 레이블 (스크린 리더에 노출)',
    },
    title: {
      control: 'text',
      description: '아이콘 설명 (호버 시 표시)',
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 기본 아이콘입니다.
 * close 아이콘을 md 크기로 표시합니다.
 */
export const Default: Story = {
  args: {
    name: 'close',
    size: 'md',
  },
};

/**
 * 모든 아이콘 타입을 한눈에 볼 수 있습니다.
 */
export const AllIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Icon name="close" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>close</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="plus" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>plus</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="minus" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>minus</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="chevron-down" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>chevron-down</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="chevron-up" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>chevron-up</p>
      </div>
    </div>
  ),
};

/**
 * 다양한 크기의 아이콘입니다.
 * sm(16px), md(20px), lg(24px), xl(32px)를 지원합니다.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
      <div style={{ textAlign: 'center' }}>
        <Icon name="close" size="sm" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>sm (16px)</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="close" size="md" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>md (20px)</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="close" size="lg" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>lg (24px)</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon name="close" size="xl" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>xl (32px)</p>
      </div>
    </div>
  ),
};

/**
 * 커스텀 색상을 적용한 아이콘입니다.
 */
export const CustomColor: Story = {
  args: {
    name: 'close',
    size: 'lg',
    color: '#FF6B6B',
  },
};

/**
 * currentColor를 사용하여 부모 요소의 색상을 상속합니다.
 */
export const InheritColor: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ color: '#4ECDC4' }}>
        <Icon name="close" size="lg" />
      </div>
      <div style={{ color: '#95E1D3' }}>
        <Icon name="plus" size="lg" />
      </div>
      <div style={{ color: '#F38181' }}>
        <Icon name="minus" size="lg" />
      </div>
    </div>
  ),
};

/**
 * 접근성 레이블이 있는 아이콘입니다.
 * aria-label을 제공하면 스크린 리더가 아이콘을 읽어줍니다.
 */
export const WithAriaLabel: Story = {
  args: {
    name: 'close',
    size: 'lg',
    'aria-label': '닫기',
  },
};

/**
 * title 속성이 있는 아이콘입니다.
 * 마우스 호버 시 툴팁이 표시됩니다.
 */
export const WithTitle: Story = {
  args: {
    name: 'close',
    size: 'lg',
    title: '닫기 아이콘',
  },
};

/**
 * 버튼과 함께 사용하는 예시입니다.
 */
export const InButton: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer',
        }}
      >
        <Icon name="plus" size="sm" />
        추가
      </button>
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer',
        }}
      >
        <Icon name="minus" size="sm" />
        제거
      </button>
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          border: 'none',
          borderRadius: '4px',
          background: '#f5f5f5',
          cursor: 'pointer',
        }}
        aria-label="닫기"
      >
        <Icon name="close" size="sm" />
      </button>
    </div>
  ),
};

/**
 * Plus 아이콘
 */
export const PlusIcon: Story = {
  args: {
    name: 'plus',
    size: 'lg',
  },
};

/**
 * Minus 아이콘
 */
export const MinusIcon: Story = {
  args: {
    name: 'minus',
    size: 'lg',
  },
};

/**
 * ChevronDown 아이콘
 */
export const ChevronDownIcon: Story = {
  args: {
    name: 'chevron-down',
    size: 'lg',
  },
};

/**
 * ChevronUp 아이콘
 */
export const ChevronUpIcon: Story = {
  args: {
    name: 'chevron-up',
    size: 'lg',
  },
};
