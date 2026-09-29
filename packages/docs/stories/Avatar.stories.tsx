import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarGroup } from '@taein-ui/core';

const meta = {
  title: 'Data Display/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    alt: '',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: '아바타 크기',
    },
    variant: {
      control: 'select',
      options: ['circular', 'rounded', 'square'],
      description: '아바타 모양',
    },
    status: {
      control: 'select',
      options: [undefined, 'online', 'offline', 'busy', 'away'],
      description: '상태 표시',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시
export const Default: Story = {
  args: {
    alt: '홍길동',
  },
};

// 이미지 아바타
export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: '사용자 프로필',
  },
};

// 텍스트 아바타
export const WithText: Story = {
  args: {
    alt: '김철수',
    children: '김철',
  },
};

// 크기 옵션
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar src="https://i.pravatar.cc/150?img=2" alt="XS" size="xs" />
      <Avatar src="https://i.pravatar.cc/150?img=3" alt="SM" size="sm" />
      <Avatar src="https://i.pravatar.cc/150?img=4" alt="MD" size="md" />
      <Avatar src="https://i.pravatar.cc/150?img=5" alt="LG" size="lg" />
      <Avatar src="https://i.pravatar.cc/150?img=6" alt="XL" size="xl" />
    </div>
  ),
};

// Variant 옵션
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar
        src="https://i.pravatar.cc/150?img=7"
        alt="Circular"
        variant="circular"
        size="lg"
      />
      <Avatar
        src="https://i.pravatar.cc/150?img=8"
        alt="Rounded"
        variant="rounded"
        size="lg"
      />
      <Avatar
        src="https://i.pravatar.cc/150?img=9"
        alt="Square"
        variant="square"
        size="lg"
      />
    </div>
  ),
};

// 상태 표시
export const WithStatus: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <Avatar
          src="https://i.pravatar.cc/150?img=10"
          alt="온라인"
          status="online"
          size="lg"
        />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>온라인</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Avatar
          src="https://i.pravatar.cc/150?img=11"
          alt="오프라인"
          status="offline"
          size="lg"
        />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>오프라인</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Avatar
          src="https://i.pravatar.cc/150?img=12"
          alt="바쁨"
          status="busy"
          size="lg"
        />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>바쁨</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Avatar
          src="https://i.pravatar.cc/150?img=13"
          alt="자리비움"
          status="away"
          size="lg"
        />
        <div style={{ marginTop: '8px', fontSize: '12px' }}>자리비움</div>
      </div>
    </div>
  ),
};

// Fallback 텍스트
export const FallbackText: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar alt="홍길동" size="lg" />
      <Avatar alt="김철수" size="lg" />
      <Avatar alt="이영희" size="lg" />
      <Avatar alt="John Doe" size="lg" />
      <Avatar alt="Jane Smith" size="lg" />
    </div>
  ),
};

// 이미지 로딩 실패
export const ImageError: Story = {
  args: {
    src: 'https://invalid-image-url.com/404.jpg',
    alt: '홍길동',
    size: 'lg',
  },
};

// AvatarGroup 기본
export const GroupDefault: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar src="https://i.pravatar.cc/150?img=14" alt="사용자 1" />
      <Avatar src="https://i.pravatar.cc/150?img=15" alt="사용자 2" />
      <Avatar src="https://i.pravatar.cc/150?img=16" alt="사용자 3" />
      <Avatar src="https://i.pravatar.cc/150?img=17" alt="사용자 4" />
    </AvatarGroup>
  ),
};

// AvatarGroup with Max
export const GroupWithMax: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div
          style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
        >
          max=2
        </div>
        <AvatarGroup max={2}>
          <Avatar src="https://i.pravatar.cc/150?img=18" alt="사용자 1" />
          <Avatar src="https://i.pravatar.cc/150?img=19" alt="사용자 2" />
          <Avatar src="https://i.pravatar.cc/150?img=20" alt="사용자 3" />
          <Avatar src="https://i.pravatar.cc/150?img=21" alt="사용자 4" />
          <Avatar src="https://i.pravatar.cc/150?img=22" alt="사용자 5" />
        </AvatarGroup>
      </div>
      <div>
        <div
          style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
        >
          max=3
        </div>
        <AvatarGroup max={3}>
          <Avatar src="https://i.pravatar.cc/150?img=23" alt="사용자 1" />
          <Avatar src="https://i.pravatar.cc/150?img=24" alt="사용자 2" />
          <Avatar src="https://i.pravatar.cc/150?img=25" alt="사용자 3" />
          <Avatar src="https://i.pravatar.cc/150?img=26" alt="사용자 4" />
          <Avatar src="https://i.pravatar.cc/150?img=27" alt="사용자 5" />
          <Avatar src="https://i.pravatar.cc/150?img=28" alt="사용자 6" />
        </AvatarGroup>
      </div>
    </div>
  ),
};

// AvatarGroup 크기
export const GroupSizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        alignItems: 'flex-start',
      }}
    >
      <div>
        <div
          style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
        >
          Small
        </div>
        <AvatarGroup size="sm">
          <Avatar src="https://i.pravatar.cc/150?img=29" alt="사용자 1" />
          <Avatar src="https://i.pravatar.cc/150?img=30" alt="사용자 2" />
          <Avatar src="https://i.pravatar.cc/150?img=31" alt="사용자 3" />
        </AvatarGroup>
      </div>
      <div>
        <div
          style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
        >
          Medium (기본)
        </div>
        <AvatarGroup size="md">
          <Avatar src="https://i.pravatar.cc/150?img=32" alt="사용자 1" />
          <Avatar src="https://i.pravatar.cc/150?img=33" alt="사용자 2" />
          <Avatar src="https://i.pravatar.cc/150?img=34" alt="사용자 3" />
        </AvatarGroup>
      </div>
      <div>
        <div
          style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
        >
          Large
        </div>
        <AvatarGroup size="lg">
          <Avatar src="https://i.pravatar.cc/150?img=35" alt="사용자 1" />
          <Avatar src="https://i.pravatar.cc/150?img=36" alt="사용자 2" />
          <Avatar src="https://i.pravatar.cc/150?img=37" alt="사용자 3" />
        </AvatarGroup>
      </div>
    </div>
  ),
};

// AvatarGroup Spacing
export const GroupSpacing: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        alignItems: 'flex-start',
      }}
    >
      <div>
        <div
          style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
        >
          Small Spacing
        </div>
        <AvatarGroup spacing="sm" size="lg">
          <Avatar src="https://i.pravatar.cc/150?img=38" alt="사용자 1" />
          <Avatar src="https://i.pravatar.cc/150?img=39" alt="사용자 2" />
          <Avatar src="https://i.pravatar.cc/150?img=40" alt="사용자 3" />
          <Avatar src="https://i.pravatar.cc/150?img=41" alt="사용자 4" />
        </AvatarGroup>
      </div>
      <div>
        <div
          style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
        >
          Medium Spacing (기본)
        </div>
        <AvatarGroup spacing="md" size="lg">
          <Avatar src="https://i.pravatar.cc/150?img=42" alt="사용자 1" />
          <Avatar src="https://i.pravatar.cc/150?img=43" alt="사용자 2" />
          <Avatar src="https://i.pravatar.cc/150?img=44" alt="사용자 3" />
          <Avatar src="https://i.pravatar.cc/150?img=45" alt="사용자 4" />
        </AvatarGroup>
      </div>
      <div>
        <div
          style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
        >
          Large Spacing
        </div>
        <AvatarGroup spacing="lg" size="lg">
          <Avatar src="https://i.pravatar.cc/150?img=46" alt="사용자 1" />
          <Avatar src="https://i.pravatar.cc/150?img=47" alt="사용자 2" />
          <Avatar src="https://i.pravatar.cc/150?img=48" alt="사용자 3" />
          <Avatar src="https://i.pravatar.cc/150?img=49" alt="사용자 4" />
        </AvatarGroup>
      </div>
    </div>
  ),
};

// 사용 예시: 팀 멤버
export const TeamMembers: Story = {
  render: () => (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>프로젝트 팀</h3>
      <AvatarGroup max={5}>
        <Avatar
          src="https://i.pravatar.cc/150?img=50"
          alt="홍길동"
          status="online"
        />
        <Avatar
          src="https://i.pravatar.cc/150?img=51"
          alt="김철수"
          status="busy"
        />
        <Avatar
          src="https://i.pravatar.cc/150?img=52"
          alt="이영희"
          status="online"
        />
        <Avatar
          src="https://i.pravatar.cc/150?img=53"
          alt="박민수"
          status="away"
        />
        <Avatar
          src="https://i.pravatar.cc/150?img=54"
          alt="정수진"
          status="offline"
        />
        <Avatar alt="최우석" />
        <Avatar alt="강민지" />
      </AvatarGroup>
    </div>
  ),
};

// 사용 예시: 사용자 프로필
export const UserProfile: Story = {
  render: () => (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '300px',
      }}
    >
      <Avatar
        src="https://i.pravatar.cc/150?img=55"
        alt="홍길동"
        size="xl"
        status="online"
      />
      <h3 style={{ marginTop: '16px', marginBottom: '4px' }}>홍길동</h3>
      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
        프론트엔드 개발자
      </p>
      <p style={{ margin: '8px 0 0', color: '#999', fontSize: '12px' }}>
        hong@example.com
      </p>
    </div>
  ),
};

// Interactive Playground
export const Interactive: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=56',
    alt: '사용자 이름을 입력하세요',
    size: 'lg',
    variant: 'circular',
    status: 'online',
  },
};
