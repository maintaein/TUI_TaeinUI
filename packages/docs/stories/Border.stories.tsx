import type { Meta, StoryObj } from '@storybook/react';
import { Border } from '@taein-ui/core';

const meta = {
  title: 'Layout/Border',
  component: Border,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    children: '',
  },
  argTypes: {
    children: { control: 'text' },
    sides: {
      control: 'select',
      options: [
        'all',
        'top',
        'right',
        'bottom',
        'left',
        'horizontal',
        'vertical',
      ],
    },
    variant: {
      control: 'select',
      options: ['solid', 'dashed', 'dotted'],
    },
    width: {
      control: 'select',
      options: ['thin', 'medium', 'thick'],
    },
    color: {
      control: 'select',
      options: ['default', 'primary', 'success', 'error', 'warning'],
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'full'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    glow: { control: 'boolean' },
  },
} satisfies Meta<typeof Border>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시
export const Default: Story = {
  args: {
    children: '기본 테두리',
    sides: 'all',
    variant: 'solid',
    width: 'thin',
    color: 'default',
    rounded: 'md',
    padding: 'md',
  },
};

// 4방향 개별 테두리
export const Sides: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '2rem',
      }}
    >
      <Border sides="all" padding="md" rounded="none">
        <strong>All</strong> - 모든 방향
      </Border>
      <Border sides="top" padding="md" rounded="none">
        <strong>Top</strong> - 상단만
      </Border>
      <Border sides="right" padding="md" rounded="none">
        <strong>Right</strong> - 우측만
      </Border>
      <Border sides="bottom" padding="md" rounded="none">
        <strong>Bottom</strong> - 하단만
      </Border>
      <Border sides="left" padding="md" rounded="none">
        <strong>Left</strong> - 좌측만
      </Border>
      <Border sides="horizontal" padding="md" rounded="none">
        <strong>Horizontal</strong> - 상하
      </Border>
      <Border sides="vertical" padding="md" rounded="none">
        <strong>Vertical</strong> - 좌우
      </Border>
    </div>
  ),
};

// 호버·포커스 시 테두리를 따라 도는 빛(선택 기능, sides='all'일 때만)
export const Glow: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '2rem',
      }}
    >
      <Border glow color="primary" padding="md">
        <button type="button">primary (호버 또는 Tab)</button>
      </Border>
      <Border glow color="success" padding="md">
        <button type="button">success</button>
      </Border>
      <Border glow color="error" padding="md">
        <button type="button">error</button>
      </Border>
      <Border glow sides="top" color="primary" padding="md">
        sides=&quot;top&quot;: 빛 없음
      </Border>
    </div>
  ),
};

// Variant 예시
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Border variant="solid" padding="md">
        <strong>Solid</strong> - 실선 테두리
      </Border>
      <Border variant="dashed" padding="md">
        <strong>Dashed</strong> - 대시선 테두리
      </Border>
      <Border variant="dotted" padding="md">
        <strong>Dotted</strong> - 점선 테두리
      </Border>
    </div>
  ),
};

// Width 예시
export const Widths: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Border width="thin" padding="md">
        <strong>Thin</strong> - 얇은 테두리 (1px)
      </Border>
      <Border width="medium" padding="md">
        <strong>Medium</strong> - 중간 테두리 (2px)
      </Border>
      <Border width="thick" padding="md">
        <strong>Thick</strong> - 두꺼운 테두리 (4px)
      </Border>
    </div>
  ),
};

// Color 예시
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Border color="default" padding="md">
        <strong>Default</strong> - 기본 색상
      </Border>
      <Border color="primary" padding="md">
        <strong>Primary</strong> - 주요 색상
      </Border>
      <Border color="success" padding="md">
        <strong>Success</strong> - 성공 색상
      </Border>
      <Border color="error" padding="md">
        <strong>Error</strong> - 오류 색상
      </Border>
      <Border color="warning" padding="md">
        <strong>Warning</strong> - 경고 색상
      </Border>
    </div>
  ),
};

// Rounded 예시
export const Rounded: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Border rounded="none" padding="md">
        <strong>None</strong> - 둥근 모서리 없음
      </Border>
      <Border rounded="sm" padding="md">
        <strong>Small</strong> - 작은 둥근 모서리
      </Border>
      <Border rounded="md" padding="md">
        <strong>Medium</strong> - 중간 둥근 모서리
      </Border>
      <Border rounded="lg" padding="md">
        <strong>Large</strong> - 큰 둥근 모서리
      </Border>
      <Border rounded="full" padding="md">
        <strong>Full</strong> - 완전히 둥근 모서리
      </Border>
    </div>
  ),
};

// Padding 예시
export const Paddings: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Border padding="none">
        <strong>None</strong> - 패딩 없음
      </Border>
      <Border padding="sm">
        <strong>Small</strong> - 작은 패딩
      </Border>
      <Border padding="md">
        <strong>Medium</strong> - 중간 패딩
      </Border>
      <Border padding="lg">
        <strong>Large</strong> - 큰 패딩
      </Border>
    </div>
  ),
};

// 카드 스타일
export const CardStyle: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem',
      }}
    >
      <Border rounded="md" padding="lg" color="default">
        <h3 style={{ margin: '0 0 0.5rem 0' }}>기본 카드</h3>
        <p style={{ margin: 0, color: '#666' }}>
          테두리와 패딩이 적용된 기본 카드입니다.
        </p>
      </Border>
      <Border rounded="md" padding="lg" color="primary" width="medium">
        <h3 style={{ margin: '0 0 0.5rem 0' }}>강조 카드</h3>
        <p style={{ margin: 0, color: '#666' }}>
          Primary 색상의 테두리로 강조된 카드입니다.
        </p>
      </Border>
      <Border rounded="lg" padding="lg" color="success" variant="dashed">
        <h3 style={{ margin: '0 0 0.5rem 0' }}>점선 카드</h3>
        <p style={{ margin: 0, color: '#666' }}>
          Success 색상의 대시 테두리 카드입니다.
        </p>
      </Border>
    </div>
  ),
};

// 알림 박스
export const AlertBoxes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Border
        sides="left"
        width="thick"
        color="primary"
        padding="md"
        rounded="sm"
      >
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          정보 알림
        </strong>
        <p style={{ margin: 0, color: '#666' }}>이것은 정보성 메시지입니다.</p>
      </Border>
      <Border
        sides="left"
        width="thick"
        color="success"
        padding="md"
        rounded="sm"
      >
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          성공 알림
        </strong>
        <p style={{ margin: 0, color: '#666' }}>
          작업이 성공적으로 완료되었습니다.
        </p>
      </Border>
      <Border
        sides="left"
        width="thick"
        color="warning"
        padding="md"
        rounded="sm"
      >
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          경고 알림
        </strong>
        <p style={{ margin: 0, color: '#666' }}>주의가 필요한 상황입니다.</p>
      </Border>
      <Border
        sides="left"
        width="thick"
        color="error"
        padding="md"
        rounded="sm"
      >
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          오류 알림
        </strong>
        <p style={{ margin: 0, color: '#666' }}>오류가 발생했습니다.</p>
      </Border>
    </div>
  ),
};

// 리스트 아이템
export const ListItems: Story = {
  render: () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Border sides="bottom" padding="md">
        <h3 style={{ margin: 0 }}>첫 번째 아이템</h3>
        <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>설명 텍스트</p>
      </Border>
      <Border sides="bottom" padding="md">
        <h3 style={{ margin: 0 }}>두 번째 아이템</h3>
        <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>설명 텍스트</p>
      </Border>
      <Border sides="bottom" padding="md">
        <h3 style={{ margin: 0 }}>세 번째 아이템</h3>
        <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>설명 텍스트</p>
      </Border>
    </div>
  ),
};

// 복잡한 레이아웃
export const ComplexLayout: Story = {
  render: () => (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Border rounded="lg" padding="none">
        <Border sides="bottom" padding="lg">
          <h2 style={{ margin: 0 }}>제목 영역</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            부제목 또는 설명
          </p>
        </Border>
        <div style={{ padding: '1.5rem' }}>
          <Border
            rounded="md"
            padding="md"
            color="default"
            style={{ marginBottom: '1rem' }}
          >
            <p style={{ margin: 0 }}>첫 번째 콘텐츠 블록</p>
          </Border>
          <Border
            rounded="md"
            padding="md"
            color="default"
            style={{ marginBottom: '1rem' }}
          >
            <p style={{ margin: 0 }}>두 번째 콘텐츠 블록</p>
          </Border>
          <Border rounded="md" padding="md" color="default">
            <p style={{ margin: 0 }}>세 번째 콘텐츠 블록</p>
          </Border>
        </div>
        <Border sides="top" padding="md">
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <button
              type="button"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="button"
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                background: '#0066ff',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              확인
            </button>
          </div>
        </Border>
      </Border>
    </div>
  ),
};

// 인터랙티브 플레이그라운드
export const Interactive: Story = {
  args: {
    children: '커스터마이즈 가능한 테두리',
    sides: 'all',
    variant: 'solid',
    width: 'thin',
    color: 'primary',
    rounded: 'md',
    padding: 'md',
  },
};
