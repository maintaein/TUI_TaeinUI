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
    children: <Plus />,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'dark', 'danger', 'light'],
      description: '버튼 색상 변형. weak와 strong에만 적용된다',
    },
    buttonStyle: {
      control: 'select',
      options: ['ghost', 'weak', 'strong'],
      description: '버튼 스타일. 기본값은 ghost',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '버튼 크기. sm은 보이는 크기 36px, 누르는 영역은 44px입니다',
    },
    hoverEffect: {
      control: 'select',
      options: ['none', 'jelly'],
      description:
        '호버 효과. 기본값 jelly는 마우스가 들어오면 아이콘이 옆으로 퍼졌다가 출렁이며 돌아온다. none으로 끈다',
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
    children: <Search />,
  },
};

export const WeakPrimary: Story = {
  args: {
    variant: 'primary',
    buttonStyle: 'weak',
    'aria-label': '좋아요',
    children: <Heart />,
  },
};

export const WeakDark: Story = {
  args: {
    variant: 'dark',
    buttonStyle: 'weak',
    'aria-label': '닫기',
    children: <X />,
  },
};

export const WeakDanger: Story = {
  args: {
    variant: 'danger',
    buttonStyle: 'weak',
    'aria-label': '삭제',
    children: <Trash />,
  },
};

export const StrongPrimary: Story = {
  args: {
    variant: 'primary',
    buttonStyle: 'strong',
    'aria-label': '검색',
    children: <Search />,
  },
};

export const StrongDark: Story = {
  args: {
    variant: 'dark',
    buttonStyle: 'strong',
    'aria-label': '설정',
    children: <Settings />,
  },
};

export const StrongDanger: Story = {
  args: {
    variant: 'danger',
    buttonStyle: 'strong',
    'aria-label': '삭제',
    children: <Trash />,
  },
};

export const StrongLight: Story = {
  args: {
    variant: 'light',
    buttonStyle: 'strong',
    'aria-label': '추가',
    children: <Plus />,
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    buttonStyle: 'strong',
    'aria-label': '검색',
    children: <Search />,
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    buttonStyle: 'strong',
    'aria-label': '검색',
    children: <Search />,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    buttonStyle: 'strong',
    'aria-label': '검색',
    children: <Search />,
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    buttonStyle: 'strong',
    'aria-label': '검색',
    children: <Search />,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    buttonStyle: 'strong',
    'aria-label': '로딩 중',
    children: <Search />,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    buttonStyle: 'strong',
    'aria-label': '비활성화',
    children: <Search />,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton buttonStyle="strong" size="sm" aria-label="Small">
        <Search />
      </IconButton>
      <IconButton buttonStyle="strong" size="md" aria-label="Medium">
        <Search />
      </IconButton>
      <IconButton buttonStyle="strong" size="lg" aria-label="Large">
        <Search />
      </IconButton>
      <IconButton buttonStyle="strong" size="xl" aria-label="Extra Large">
        <Search />
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
        <Heart />
      </IconButton>
      <IconButton variant="dark" buttonStyle="weak" aria-label="Dark Weak">
        <Settings />
      </IconButton>
      <IconButton variant="danger" buttonStyle="weak" aria-label="Danger Weak">
        <Trash />
      </IconButton>
      <IconButton variant="light" buttonStyle="weak" aria-label="Light Weak">
        <Plus />
      </IconButton>
    </div>
  ),
};

export const AllStrongVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <IconButton variant="primary" buttonStyle="strong" aria-label="Primary">
        <Heart />
      </IconButton>
      <IconButton variant="dark" buttonStyle="strong" aria-label="Dark">
        <Settings />
      </IconButton>
      <IconButton variant="danger" buttonStyle="strong" aria-label="Danger">
        <Trash />
      </IconButton>
      <IconButton variant="light" buttonStyle="strong" aria-label="Light">
        <Plus />
      </IconButton>
    </div>
  ),
};

// 젤리는 기본으로 켜져 있다. 왼쪽은 prop 없는 기본, 오른쪽은 hoverEffect="none"으로 끈 것.
export const JellyHover: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <IconButton buttonStyle="strong" aria-label="기본(젤리)">
        <Search />
      </IconButton>
      <IconButton buttonStyle="strong" hoverEffect="none" aria-label="젤리 끔">
        <Search />
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
        <Search />
      </IconButton>
      <IconButton aria-label="좋아요">
        <Heart />
      </IconButton>
      <IconButton aria-label="삭제">
        <Trash />
      </IconButton>
      <IconButton aria-label="추가">
        <Plus />
      </IconButton>
      <IconButton aria-label="설정">
        <Settings />
      </IconButton>
      <IconButton aria-label="닫기">
        <X />
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
          <IconButton
            buttonStyle="strong"
            onClick={handleClick}
            aria-label="좋아요"
          >
            <Heart />
          </IconButton>
          <IconButton
            variant="danger"
            buttonStyle="strong"
            onClick={handleClick}
            aria-label="삭제"
          >
            <Trash />
          </IconButton>
          <IconButton
            variant="dark"
            buttonStyle="strong"
            onClick={handleClick}
            aria-label="설정"
          >
            <Settings />
          </IconButton>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          버튼을 클릭해보세요
        </p>
      </div>
    );
  },
};
