import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from '@taein-ui/core';
import { Heart, Plus, Search, Settings, Trash, X } from 'lucide-react';

// 아이콘 컴포넌트들
const SearchIcon = () => <Search size={20} />;

const HeartIcon = () => <Heart size={20} />;

const TrashIcon = () => <Trash size={20} />;

const PlusIcon = () => <Plus size={20} />;

const SettingsIcon = () => <Settings size={20} />;

const CloseIcon = () => <X size={20} />;

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: <PlusIcon />,
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
    children: <SearchIcon />,
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    'aria-label': '검색',
    children: <SearchIcon />,
  },
};

export const Dark: Story = {
  args: {
    variant: 'dark',
    'aria-label': '설정',
    children: <SettingsIcon />,
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    'aria-label': '삭제',
    children: <TrashIcon />,
  },
};

export const Light: Story = {
  args: {
    variant: 'light',
    'aria-label': '추가',
    children: <PlusIcon />,
  },
};

export const WeakPrimary: Story = {
  args: {
    variant: 'primary',
    buttonStyle: 'weak',
    'aria-label': '좋아요',
    children: <HeartIcon />,
  },
};

export const WeakDark: Story = {
  args: {
    variant: 'dark',
    buttonStyle: 'weak',
    'aria-label': '닫기',
    children: <CloseIcon />,
  },
};

export const WeakDanger: Story = {
  args: {
    variant: 'danger',
    buttonStyle: 'weak',
    'aria-label': '삭제',
    children: <TrashIcon />,
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    'aria-label': '검색',
    children: <SearchIcon />,
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    'aria-label': '검색',
    children: <SearchIcon />,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    'aria-label': '검색',
    children: <SearchIcon />,
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    'aria-label': '검색',
    children: <SearchIcon />,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    'aria-label': '로딩 중',
    children: <SearchIcon />,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    'aria-label': '비활성화',
    children: <SearchIcon />,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton size="sm" aria-label="Small">
        <SearchIcon />
      </IconButton>
      <IconButton size="md" aria-label="Medium">
        <SearchIcon />
      </IconButton>
      <IconButton size="lg" aria-label="Large">
        <SearchIcon />
      </IconButton>
      <IconButton size="xl" aria-label="Extra Large">
        <SearchIcon />
      </IconButton>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <IconButton variant="primary" aria-label="Primary">
        <HeartIcon />
      </IconButton>
      <IconButton variant="dark" aria-label="Dark">
        <SettingsIcon />
      </IconButton>
      <IconButton variant="danger" aria-label="Danger">
        <TrashIcon />
      </IconButton>
      <IconButton variant="light" aria-label="Light">
        <PlusIcon />
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
        <HeartIcon />
      </IconButton>
      <IconButton variant="dark" buttonStyle="weak" aria-label="Dark Weak">
        <SettingsIcon />
      </IconButton>
      <IconButton variant="danger" buttonStyle="weak" aria-label="Danger Weak">
        <TrashIcon />
      </IconButton>
      <IconButton variant="light" buttonStyle="weak" aria-label="Light Weak">
        <PlusIcon />
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
        <SearchIcon />
      </IconButton>
      <IconButton aria-label="좋아요">
        <HeartIcon />
      </IconButton>
      <IconButton aria-label="삭제">
        <TrashIcon />
      </IconButton>
      <IconButton aria-label="추가">
        <PlusIcon />
      </IconButton>
      <IconButton aria-label="설정">
        <SettingsIcon />
      </IconButton>
      <IconButton aria-label="닫기">
        <CloseIcon />
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
            <HeartIcon />
          </IconButton>
          <IconButton variant="danger" onClick={handleClick} aria-label="삭제">
            <TrashIcon />
          </IconButton>
          <IconButton variant="dark" onClick={handleClick} aria-label="설정">
            <SettingsIcon />
          </IconButton>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          버튼을 클릭해보세요
        </p>
      </div>
    );
  },
};
