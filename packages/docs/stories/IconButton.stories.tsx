import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from '@taein-ui/core';

// 아이콘 컴포넌트들
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M17.367 3.842a4.583 4.583 0 0 0-6.483 0L10 4.725l-.883-.883a4.584 4.584 0 1 0-6.484 6.483l.884.884L10 17.692l6.483-6.483.884-.884a4.583 4.583 0 0 0 0-6.483z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M2.5 5h15M6.667 5V3.333a1.667 1.667 0 0 1 1.666-1.666h3.334a1.667 1.667 0 0 1 1.666 1.666V5m2.5 0v11.667a1.667 1.667 0 0 1-1.666 1.666H5.833a1.667 1.667 0 0 1-1.666-1.666V5h11.666z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 4.167v11.666M4.167 10h11.666"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.167 12.5a1.375 1.375 0 0 0 .275 1.517l.05.05a1.668 1.668 0 1 1-2.359 2.358l-.05-.05a1.375 1.375 0 0 0-1.516-.275 1.375 1.375 0 0 0-.834 1.258v.142a1.667 1.667 0 1 1-3.333 0v-.075a1.375 1.375 0 0 0-.9-1.258 1.375 1.375 0 0 0-1.517.275l-.05.05a1.668 1.668 0 1 1-2.358-2.358l.05-.05a1.375 1.375 0 0 0 .275-1.517 1.375 1.375 0 0 0-1.258-.834h-.142a1.667 1.667 0 1 1 0-3.333h.075a1.375 1.375 0 0 0 1.258-.9 1.375 1.375 0 0 0-.275-1.517l-.05-.05a1.668 1.668 0 1 1 2.358-2.358l.05.05a1.375 1.375 0 0 0 1.517.275h.067a1.375 1.375 0 0 0 .833-1.258v-.142a1.667 1.667 0 1 1 3.333 0v.075a1.375 1.375 0 0 0 .834 1.258 1.375 1.375 0 0 0 1.516-.275l.05-.05a1.668 1.668 0 1 1 2.359 2.358l-.05.05a1.375 1.375 0 0 0-.275 1.517v.067a1.375 1.375 0 0 0 1.258.833h.142a1.667 1.667 0 0 1 0 3.333h-.075a1.375 1.375 0 0 0-1.258.834z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M15 5L5 15M5 5l10 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
