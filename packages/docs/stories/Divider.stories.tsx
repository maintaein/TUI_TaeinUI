import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from '@taein-ui/core';

const meta = {
  title: 'Layout/Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    variant: {
      control: 'select',
      options: ['solid', 'dashed', 'dotted'],
    },
    spacing: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    textAlign: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시
export const Default: Story = {
  args: {
    variant: 'solid',
    spacing: 'md',
  },
  render: (args) => (
    <div>
      <p>콘텐츠 위</p>
      <Divider {...args} />
      <p>콘텐츠 아래</p>
    </div>
  ),
};

// 텍스트 포함
export const WithText: Story = {
  render: () => (
    <div>
      <p>섹션 1</p>
      <Divider>또는</Divider>
      <p>섹션 2</p>
    </div>
  ),
};

// 텍스트 정렬
export const TextAlignment: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3>왼쪽 정렬</h3>
        <Divider textAlign="left">왼쪽</Divider>
        <p>콘텐츠</p>
      </div>
      <div>
        <h3>중앙 정렬</h3>
        <Divider textAlign="center">중앙</Divider>
        <p>콘텐츠</p>
      </div>
      <div>
        <h3>오른쪽 정렬</h3>
        <Divider textAlign="right">오른쪽</Divider>
        <p>콘텐츠</p>
      </div>
    </div>
  ),
};

// Variant 예시
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3>Solid (실선)</h3>
        <Divider variant="solid" />
      </div>
      <div>
        <h3>Dashed (대시선)</h3>
        <Divider variant="dashed" />
      </div>
      <div>
        <h3>Dotted (점선)</h3>
        <Divider variant="dotted" />
      </div>
    </div>
  ),
};

// Spacing 예시
export const Spacing: Story = {
  render: () => (
    <div>
      <h3>Small (sm)</h3>
      <p>콘텐츠 위</p>
      <Divider spacing="sm" />
      <p>콘텐츠 아래</p>

      <h3 style={{ marginTop: '3rem' }}>Medium (md)</h3>
      <p>콘텐츠 위</p>
      <Divider spacing="md" />
      <p>콘텐츠 아래</p>

      <h3 style={{ marginTop: '3rem' }}>Large (lg)</h3>
      <p>콘텐츠 위</p>
      <Divider spacing="lg" />
      <p>콘텐츠 아래</p>
    </div>
  ),
};

// 수직 구분선
export const Vertical: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '200px',
        gap: '1rem',
      }}
    >
      <div style={{ padding: '1rem' }}>메뉴 1</div>
      <Divider orientation="vertical" />
      <div style={{ padding: '1rem' }}>메뉴 2</div>
      <Divider orientation="vertical" />
      <div style={{ padding: '1rem' }}>메뉴 3</div>
    </div>
  ),
};

// 수직 구분선 + 텍스트
export const VerticalWithText: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '300px',
        gap: '2rem',
      }}
    >
      <div style={{ padding: '1rem' }}>
        <h3>섹션 A</h3>
        <p>콘텐츠 A</p>
      </div>
      <Divider orientation="vertical">또는</Divider>
      <div style={{ padding: '1rem' }}>
        <h3>섹션 B</h3>
        <p>콘텐츠 B</p>
      </div>
    </div>
  ),
};

// 수직 구분선 Variant
export const VerticalVariants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '200px',
        gap: '2rem',
      }}
    >
      <div>Solid</div>
      <Divider orientation="vertical" variant="solid" />
      <div>Dashed</div>
      <Divider orientation="vertical" variant="dashed" />
      <div>Dotted</div>
      <Divider orientation="vertical" variant="dotted" />
      <div>끝</div>
    </div>
  ),
};

// 리스트 구분
export const ListSeparator: Story = {
  render: () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>알림</h2>
      <Divider />
      <div style={{ padding: '1rem 0' }}>
        <h3>새로운 메시지</h3>
        <p>김철수님이 메시지를 보냈습니다.</p>
      </div>
      <Divider />
      <div style={{ padding: '1rem 0' }}>
        <h3>친구 요청</h3>
        <p>이영희님이 친구 요청을 보냈습니다.</p>
      </div>
      <Divider />
      <div style={{ padding: '1rem 0' }}>
        <h3>시스템 알림</h3>
        <p>새로운 업데이트가 있습니다.</p>
      </div>
    </div>
  ),
};

// 섹션 구분 (텍스트 포함)
export const SectionDivider: Story = {
  render: () => (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2>개인 정보</h2>
        <p>이름: 홍길동</p>
        <p>이메일: hong@example.com</p>
      </div>

      <Divider>계정 설정</Divider>

      <div style={{ margin: '2rem 0' }}>
        <h2>보안</h2>
        <p>비밀번호: ********</p>
        <p>2단계 인증: 활성화됨</p>
      </div>

      <Divider>추가 정보</Divider>

      <div style={{ marginTop: '2rem' }}>
        <h2>알림 설정</h2>
        <p>이메일 알림: 켜짐</p>
        <p>푸시 알림: 꺼짐</p>
      </div>
    </div>
  ),
};

// 폼 구분
export const FormDivider: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '2rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
      }}
    >
      <h2>회원가입</h2>
      <Divider spacing="lg" />

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>이름</label>
        <input
          type="text"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          이메일
        </label>
        <input
          type="email"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <Divider spacing="lg">또는</Divider>

      <button
        type="button"
        style={{
          width: '100%',
          padding: '0.75rem',
          background: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Google로 계속하기
      </button>
    </div>
  ),
};

// 인터랙티브 플레이그라운드
export const Interactive: Story = {
  args: {
    children: '구분선 텍스트',
    orientation: 'horizontal',
    variant: 'solid',
    spacing: 'md',
    textAlign: 'center',
  },
  render: (args) => (
    <div
      style={{
        minHeight: args.orientation === 'vertical' ? '300px' : 'auto',
        display: args.orientation === 'vertical' ? 'flex' : 'block',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      {args.orientation === 'vertical' ? (
        <>
          <div style={{ padding: '1rem' }}>왼쪽 콘텐츠</div>
          <Divider {...args} />
          <div style={{ padding: '1rem' }}>오른쪽 콘텐츠</div>
        </>
      ) : (
        <>
          <p>위쪽 콘텐츠</p>
          <Divider {...args} />
          <p>아래쪽 콘텐츠</p>
        </>
      )}
    </div>
  ),
};
