import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from '@taein-ui/core';

/**
 * LoadingSpinner 컴포넌트
 *
 * 로딩 상태를 시각적으로 표현하는 컴포넌트입니다.
 * Spinner와 Dots 두 가지 타입을 지원하며, 크기와 색상을 커스터마이징할 수 있습니다.
 */
const meta = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '로딩 상태를 표시하는 스피너 컴포넌트입니다. 버튼, 모달, 전체 화면 로딩 등 다양한 상황에서 재사용할 수 있습니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['spinner', 'dots'],
      description: '로딩 스피너 타입',
      table: {
        type: { summary: "'spinner' | 'dots'" },
        defaultValue: { summary: 'spinner' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '스피너 크기',
      table: {
        type: { summary: "'sm' | 'md' | 'lg' | 'xl'" },
        defaultValue: { summary: 'md' },
      },
    },
    color: {
      control: 'color',
      description: '스피너 색상 (CSS 색상 값)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '#1E88E5 (primary[600])' },
      },
    },
    'aria-label': {
      control: 'text',
      description: '접근성 레이블',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '로딩 중' },
      },
    },
  },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 기본 스피너 형태입니다.
 */
export const Default: Story = {
  args: {
    type: 'spinner',
    size: 'md',
  },
};

/**
 * Dots 타입 스피너입니다.
 * 3개의 점이 순차적으로 깜빡이며 로딩 상태를 표현합니다.
 */
export const DotsType: Story = {
  args: {
    type: 'dots',
    size: 'md',
  },
};

/**
 * 다양한 크기의 스피너입니다.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="sm" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Small (16px)
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="md" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Medium (24px)
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="lg" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Large (32px)
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="xl" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          X-Large (48px)
        </p>
      </div>
    </div>
  ),
};

/**
 * Dots 타입의 다양한 크기입니다.
 */
export const DotsSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner type="dots" size="sm" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Small
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner type="dots" size="md" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Medium
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner type="dots" size="lg" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Large
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner type="dots" size="xl" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          X-Large
        </p>
      </div>
    </div>
  ),
};

/**
 * 다양한 색상의 스피너입니다.
 */
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner color="#1E88E5" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Primary
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner color="#43A047" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Success
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner color="#E53935" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Error
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner color="#FB8C00" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
          Warning
        </p>
      </div>
    </div>
  ),
};

export const OnDarkBackground: Story = {
  render: () => (
    <div
      style={{
        padding: '3rem',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
      }}
    >
      <LoadingSpinner color="#FFFFFF" size="md" />
      <LoadingSpinner type="dots" color="#FFFFFF" size="md" />
    </div>
  ),
};

/**
 * 버튼 내부에서 사용되는 작은 스피너 예시입니다.
 */
export const InButton: Story = {
  render: () => (
    <button
      style={{
        padding: '12px 24px',
        backgroundColor: '#1E88E5',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <LoadingSpinner size="sm" color="#FFFFFF" />
      로딩 중...
    </button>
  ),
};

/**
 * 접근성 레이블 커스터마이징 예시입니다.
 */
export const WithCustomAriaLabel: Story = {
  args: {
    'aria-label': '데이터 불러오는 중',
  },
};
