import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from '@taein-ui/core';
import { Heart, Plus, Search, Settings, Trash, X } from 'lucide-react';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: <Plus size={22} />,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'dark', 'danger', 'light'],
      description: '버튼 색상 변형',
    },
    buttonStyle: {
      control: 'select',
      options: ['fill', 'weak'],
      description: '버튼 스타일',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '버튼 크기',
    },
    loading: {
      control: 'boolean',
      description: '로딩 상태',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    'aria-label': '검색',
    children: <Search size={22} />,
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    'aria-label': '검색',
    children: <Search size={22} />,
  },
};

export const Dark: Story = {
  args: {
    variant: 'dark',
    'aria-label': '설정',
    children: <Settings size={22} />,
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    'aria-label': '삭제',
    children: <Trash size={22} />,
  },
};

export const Light: Story = {
  args: {
    variant: 'light',
    'aria-label': '추가',
    children: <Plus size={22} />,
  },
};

export const WeakPrimary: Story = {
  args: {
    variant: 'primary',
    buttonStyle: 'weak',
    'aria-label': '좋아요',
    children: <Heart size={22} />,
  },
};

export const WeakDark: Story = {
  args: {
    variant: 'dark',
    buttonStyle: 'weak',
    'aria-label': '닫기',
    children: <X size={22} />,
  },
};

export const WeakDanger: Story = {
  args: {
    variant: 'danger',
    buttonStyle: 'weak',
    'aria-label': '삭제',
    children: <Trash size={22} />,
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    'aria-label': '검색',
    children: <Search size={18} />,
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    'aria-label': '검색',
    children: <Search size={22} />,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    'aria-label': '검색',
    children: <Search size={26} />,
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    'aria-label': '검색',
    children: <Search size={30} />,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    'aria-label': '로딩 중',
    children: <Search size={22} />,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    'aria-label': '비활성화',
    children: <Search size={22} />,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton size="sm" aria-label="Small">
        <Search size={18} />
      </IconButton>
      <IconButton size="md" aria-label="Medium">
        <Search size={22} />
      </IconButton>
      <IconButton size="lg" aria-label="Large">
        <Search size={26} />
      </IconButton>
      <IconButton size="xl" aria-label="Extra Large">
        <Search size={30} />
      </IconButton>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <IconButton variant="primary" aria-label="Primary">
        <Heart size={22} />
      </IconButton>
      <IconButton variant="dark" aria-label="Dark">
        <Settings size={22} />
      </IconButton>
      <IconButton variant="danger" aria-label="Danger">
        <Trash size={22} />
      </IconButton>
      <IconButton variant="light" aria-label="Light">
        <Plus size={22} />
      </IconButton>
    </div>
  ),
};

export const AllWeakVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <IconButton
        variant="primary"
        buttonStyle="weak"
        aria-label="Primary Weak"
      >
        <Heart size={22} />
      </IconButton>
      <IconButton variant="dark" buttonStyle="weak" aria-label="Dark Weak">
        <Settings size={22} />
      </IconButton>
      <IconButton variant="danger" buttonStyle="weak" aria-label="Danger Weak">
        <Trash size={22} />
      </IconButton>
      <IconButton variant="light" buttonStyle="weak" aria-label="Light Weak">
        <Plus size={22} />
      </IconButton>
    </div>
  ),
};

export const IconCollection: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
      }}
    >
      <IconButton aria-label="검색">
        <Search size={22} />
      </IconButton>
      <IconButton aria-label="좋아요">
        <Heart size={22} />
      </IconButton>
      <IconButton aria-label="삭제">
        <Trash size={22} />
      </IconButton>
      <IconButton aria-label="추가">
        <Plus size={22} />
      </IconButton>
      <IconButton aria-label="설정">
        <Settings size={22} />
      </IconButton>
      <IconButton aria-label="닫기">
        <X size={22} />
      </IconButton>
    </div>
  ),
};

export const InteractiveExample: Story = {
  render: () => {
    const handleClick = () => {
      alert('아이콘 버튼이 클릭되었습니다!');
    };

    return (
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <IconButton onClick={handleClick} aria-label="좋아요">
            <Heart size={22} />
          </IconButton>
          <IconButton variant="danger" onClick={handleClick} aria-label="삭제">
            <Trash size={22} />
          </IconButton>
          <IconButton variant="dark" onClick={handleClick} aria-label="설정">
            <Settings size={22} />
          </IconButton>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          버튼을 클릭해보세요
        </p>
      </div>
    );
  },
};
