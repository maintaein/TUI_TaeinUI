import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@taein-ui/core';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'dark', 'danger', 'light'],
      description: '버튼의 색상 variant',
    },
    buttonStyle: {
      control: 'select',
      options: ['strong', 'weak'],
      description: '버튼의 스타일 (strong: 채워진, weak: 연한)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '버튼의 크기',
    },
    fullWidth: {
      control: 'boolean',
      description: '전체 너비 사용 여부',
    },
    loading: {
      control: 'boolean',
      description: '로딩 상태 표시',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
    children: {
      control: 'text',
      description: '버튼 내부 텍스트',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// All Sizes
export const AllSizes: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">XLarge</Button>
    </div>
  ),
};

// Fill Variants
export const FillVariants: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        padding: '2rem',
      }}
    >
      <Button variant="primary" buttonStyle="strong">
        Primary
      </Button>
      <Button variant="dark" buttonStyle="strong">
        Dark
      </Button>
      <Button variant="danger" buttonStyle="strong">
        Danger
      </Button>
      <Button variant="light" buttonStyle="strong">
        Light
      </Button>
    </div>
  ),
};

// Weak Variants
export const WeakVariants: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        padding: '2rem',
      }}
    >
      <Button variant="primary" buttonStyle="weak">
        Primary
      </Button>
      <Button variant="dark" buttonStyle="weak">
        Dark
      </Button>
      <Button variant="danger" buttonStyle="weak">
        Danger
      </Button>
      <Button variant="light" buttonStyle="weak">
        Light
      </Button>
    </div>
  ),
};

// Loading States
export const LoadingStates: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        padding: '2rem',
      }}
    >
      <Button variant="primary" loading>
        Primary
      </Button>
      <Button variant="dark" loading>
        Dark
      </Button>
      <Button variant="danger" loading>
        Danger
      </Button>
    </div>
  ),
};

// Loading and Disabled
export const LoadingAndDisabled: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        padding: '2rem',
      }}
    >
      <Button variant="primary" loading>
        Loading
      </Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
      <Button variant="primary" buttonStyle="weak" loading>
        Loading
      </Button>
      <Button variant="primary" buttonStyle="weak" disabled>
        Disabled
      </Button>
    </div>
  ),
};

// Primary Fill
export const PrimaryFill: Story = {
  args: {
    variant: 'primary',
    buttonStyle: 'strong',
    children: 'Primary',
  },
};

// Primary Weak
export const PrimaryWeak: Story = {
  args: {
    variant: 'primary',
    buttonStyle: 'weak',
    children: 'Primary',
  },
};

// Loading Example
export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Loading',
  },
};

// Disabled Example
export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled',
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

// Interactive Example
export const Interactive: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Click me!',
    onClick: () => alert('Button clicked!'),
  },
};
