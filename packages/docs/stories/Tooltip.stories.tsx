import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from '@taein-ui/core';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: <button>마우스를 올려보세요</button>,
    content: '툴팁내용입니다.',
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'Tooltip content',
    },
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Tooltip position',
    },
    delay: {
      control: 'number',
      description: 'Delay before showing tooltip (ms)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable tooltip',
    },
    arrow: {
      control: 'boolean',
      description: 'Show arrow',
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: '이것은 툴팁입니다',
    children: <button>호버하세요</button>,
  },
};

export const Positions: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4rem',
        alignItems: 'center',
        padding: '4rem',
      }}
    >
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Tooltip content="Top 위치 툴팁" position="top">
          <button style={{ padding: '0.75rem 1.5rem' }}>Top</button>
        </Tooltip>
        <Tooltip content="Bottom 위치 툴팁" position="bottom">
          <button style={{ padding: '0.75rem 1.5rem' }}>Bottom</button>
        </Tooltip>
      </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Tooltip content="Left 위치 툴팁" position="left">
          <button style={{ padding: '0.75rem 1.5rem' }}>Left</button>
        </Tooltip>
        <Tooltip content="Right 위치 툴팁" position="right">
          <button style={{ padding: '0.75rem 1.5rem' }}>Right</button>
        </Tooltip>
      </div>
    </div>
  ),
};

export const Delays: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Tooltip content="즉시 표시 (0ms)" delay={0}>
        <button style={{ padding: '0.75rem 1.5rem' }}>즉시 표시</button>
      </Tooltip>
      <Tooltip content="기본 지연 (200ms)">
        <button style={{ padding: '0.75rem 1.5rem' }}>기본 (200ms)</button>
      </Tooltip>
      <Tooltip content="긴 지연 (1000ms)" delay={1000}>
        <button style={{ padding: '0.75rem 1.5rem' }}>긴 지연 (1s)</button>
      </Tooltip>
    </div>
  ),
};

export const WithoutArrow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Tooltip content="화살표 있음 (기본)" arrow={true}>
        <button style={{ padding: '0.75rem 1.5rem' }}>화살표 있음</button>
      </Tooltip>
      <Tooltip content="화살표 없음" arrow={false}>
        <button style={{ padding: '0.75rem 1.5rem' }}>화살표 없음</button>
      </Tooltip>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Tooltip content="활성화된 툴팁" disabled={false}>
        <button style={{ padding: '0.75rem 1.5rem' }}>활성화됨</button>
      </Tooltip>
      <Tooltip content="비활성화된 툴팁 (표시 안됨)" disabled={true}>
        <button style={{ padding: '0.75rem 1.5rem' }}>비활성화됨</button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Tooltip content="이것은 매우 긴 툴팁 내용입니다. 여러 단어와 정보를 포함할 수 있습니다.">
      <button style={{ padding: '0.75rem 1.5rem' }}>긴 내용 툴팁</button>
    </Tooltip>
  ),
};

export const OnIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Tooltip content="정보 아이콘">
        <button
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid #ccc',
            background: '#f5f5f5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ℹ️
        </button>
      </Tooltip>
      <Tooltip content="도움말">
        <button
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid #ccc',
            background: '#f5f5f5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ❓
        </button>
      </Tooltip>
      <Tooltip content="설정">
        <button
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid #ccc',
            background: '#f5f5f5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ⚙️
        </button>
      </Tooltip>
    </div>
  ),
};

export const OnText: Story = {
  render: () => (
    <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>
      이 문장에는{' '}
      <Tooltip content="이것은 약어입니다: HyperText Markup Language">
        <span
          style={{
            textDecoration: 'underline',
            cursor: 'help',
            color: '#1E88E5',
          }}
        >
          HTML
        </span>
      </Tooltip>
      과{' '}
      <Tooltip content="이것은 약어입니다: Cascading Style Sheets">
        <span
          style={{
            textDecoration: 'underline',
            cursor: 'help',
            color: '#1E88E5',
          }}
        >
          CSS
        </span>
      </Tooltip>
      에 대한 설명이 툴팁으로 제공됩니다.
    </p>
  ),
};

export const FormHelp: Story = {
  render: () => (
    <div style={{ width: '400px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          이메일
          <Tooltip content="유효한 이메일 주소를 입력하세요 (예: user@example.com)">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#e0e0e0',
                fontSize: '12px',
                cursor: 'help',
              }}
            >
              ?
            </span>
          </Tooltip>
        </label>
        <input
          type="email"
          placeholder="이메일 주소"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          비밀번호
          <Tooltip content="8자 이상, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#e0e0e0',
                fontSize: '12px',
                cursor: 'help',
              }}
            >
              ?
            </span>
          </Tooltip>
        </label>
        <input
          type="password"
          placeholder="비밀번호"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    content: '툴팁 내용을 변경해보세요',
    position: 'top',
    delay: 200,
    disabled: false,
    arrow: true,
    children: (
      <button style={{ padding: '0.75rem 1.5rem' }}>인터랙티브 툴팁</button>
    ),
  },
};
