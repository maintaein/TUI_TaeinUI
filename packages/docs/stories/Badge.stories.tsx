import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@taein-ui/core';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Badge content (number or text)',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning'],
      description: 'Color variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size',
    },
    max: {
      control: 'number',
      description: 'Maximum number to display (shows max+ when exceeded)',
    },
    dot: {
      control: 'boolean',
      description: 'Show as dot instead of number/text',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 5,
  },
};

export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Badge variant="primary">5</Badge>
      <Badge variant="secondary">10</Badge>
      <Badge variant="success">99</Badge>
      <Badge variant="error">3</Badge>
      <Badge variant="warning">NEW</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Badge size="sm">5</Badge>
      <Badge size="md">10</Badge>
      <Badge size="lg">99</Badge>
    </div>
  ),
};

export const MaxValue: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Badge max={99}>50</Badge>
      <Badge max={99}>99</Badge>
      <Badge max={99}>100</Badge>
      <Badge max={999}>1000</Badge>
      <Badge max={9}>15</Badge>
    </div>
  ),
};

export const TextBadge: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Badge variant="error">NEW</Badge>
      <Badge variant="warning">HOT</Badge>
      <Badge variant="success">SALE</Badge>
      <Badge variant="primary">BETA</Badge>
    </div>
  ),
};

export const DotMode: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Badge dot variant="primary" />
      <Badge dot variant="secondary" />
      <Badge dot variant="success" />
      <Badge dot variant="error" />
      <Badge dot variant="warning" />
    </div>
  ),
};

export const NotificationBadge: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            background: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          알림
        </button>
        <div style={{ position: 'absolute', top: '-8px', right: '-8px' }}>
          <Badge variant="error">5</Badge>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            background: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          메시지
        </button>
        <div style={{ position: 'absolute', top: '-8px', right: '-8px' }}>
          <Badge variant="error">99+</Badge>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            background: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          새 소식
        </button>
        <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
          <Badge dot variant="error" />
        </div>
      </div>
    </div>
  ),
};

export const AvatarWithBadge: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 600,
          }}
        >
          A
        </div>
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <Badge variant="success" size="sm" dot />
        </div>
      </div>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 600,
          }}
        >
          B
        </div>
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <Badge variant="error" size="sm">
            3
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const AllSizesAndVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Small
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Badge size="sm" variant="primary">
            5
          </Badge>
          <Badge size="sm" variant="secondary">
            10
          </Badge>
          <Badge size="sm" variant="success">
            99
          </Badge>
          <Badge size="sm" variant="error">
            3
          </Badge>
          <Badge size="sm" variant="warning">
            NEW
          </Badge>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Medium
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Badge size="md" variant="primary">
            5
          </Badge>
          <Badge size="md" variant="secondary">
            10
          </Badge>
          <Badge size="md" variant="success">
            99
          </Badge>
          <Badge size="md" variant="error">
            3
          </Badge>
          <Badge size="md" variant="warning">
            NEW
          </Badge>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Large
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Badge size="lg" variant="primary">
            5
          </Badge>
          <Badge size="lg" variant="secondary">
            10
          </Badge>
          <Badge size="lg" variant="success">
            99
          </Badge>
          <Badge size="lg" variant="error">
            3
          </Badge>
          <Badge size="lg" variant="warning">
            NEW
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    children: 42,
    variant: 'primary',
    size: 'md',
    max: 99,
    dot: false,
  },
};
