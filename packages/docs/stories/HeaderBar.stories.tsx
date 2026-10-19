import type { Meta, StoryObj } from '@storybook/react';
import { HeaderBar } from '@taein-ui/core';

const textItems = [
  { label: '홈', href: '#', active: true },
  { label: '소개', href: '#' },
  { label: '제품', href: '#' },
];

const circle = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
    <circle cx="16" cy="16" r="12" />
  </svg>
);

const meta = {
  title: 'Layout/HeaderBar',
  component: HeaderBar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    logo: { control: false },
    title: { control: 'text' },
    titleAs: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'],
    },
    items: { control: false },
    // icon은 항목마다 아이콘이 필요해 여기서 고르면 빈 알약이 된다. 자기 스토리가 따로 있다.
    // 기본값은 pill이라 맨 앞에 둔다.
    navStyle: {
      control: 'select',
      options: ['pill', 'text', 'dropdown', 'cards'],
    },
    actions: { control: false },
    sticky: { control: 'boolean' },
  },
} satisfies Meta<typeof HeaderBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시: 떠 있는 둥근 바 + 알약 항목(navStyle의 기본값이 pill)
export const Default: Story = {
  args: {
    title: 'My Application',
    items: textItems,
    navStyle: 'pill',
    sticky: false,
  },
  render: (args) => (
    <div style={{ height: '200vh', background: '#f5f5f5' }}>
      <HeaderBar {...args} />
      <div style={{ padding: '2rem' }}>
        <p>스크롤 테스트</p>
        <p style={{ marginTop: '100vh' }}>콘텐츠</p>
      </div>
    </div>
  ),
};

// Logo와 Title
export const WithLogo: Story = {
  render: () => (
    <HeaderBar
      logo={circle}
      title="My Brand"
      items={[
        { label: 'Features', href: '#', active: true },
        { label: 'Pricing', href: '#' },
      ]}
    />
  ),
};

// Actions 영역
export const WithActions: Story = {
  render: () => (
    <HeaderBar
      title="Dashboard"
      items={[
        { label: 'Overview', href: '#', active: true },
        { label: 'Analytics', href: '#' },
      ]}
      actions={
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
            Settings
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
            Sign In
          </button>
        </div>
      }
    />
  ),
};

// 글자 항목: 호버와 active에 옅은 바탕이 깔린다
export const TextItems: Story = {
  render: () => <HeaderBar title="Store" navStyle="text" items={textItems} />,
};

// 아이콘 항목: 커서가 올라간 항목만 커진다
export const IconItems: Story = {
  render: () => (
    <HeaderBar
      title="Store"
      navStyle="icon"
      items={[
        { icon: <span>H</span>, label: '홈', href: '#', active: true },
        { icon: <span>+</span>, label: '새로 만들기' },
        { icon: <span>V</span>, label: '완료함' },
        { icon: <span>B</span>, label: '알림' },
        { icon: <span>S</span>, label: '설정' },
      ]}
    />
  ),
};

// 알약 항목: 호버하면 원이 차오르며 글자가 바뀌고, active 항목은 늘 채워진다
export const PillItems: Story = {
  render: () => (
    <HeaderBar
      title="Store"
      navStyle="pill"
      items={[
        { label: '상품', href: '#', active: true },
        { label: '카테고리', href: '#' },
        { label: '이벤트', href: '#' },
        { label: '문의', href: '#' },
      ]}
    />
  ),
};

// 드롭다운 항목: links가 있는 항목에 마우스를 올리면 아래에 작은 판이 열린다
export const DropdownItems: Story = {
  render: () => (
    <HeaderBar
      title="Store"
      navStyle="dropdown"
      items={[
        {
          label: '상품',
          links: [
            { label: '전체 상품', href: '#' },
            { label: '신상품', href: '#' },
            { label: '할인', href: '#' },
          ],
        },
        {
          label: '고객지원',
          links: [
            { label: '자주 묻는 질문', href: '#' },
            { label: '문의하기', href: '#' },
          ],
        },
        { label: '이벤트', href: '#' },
      ]}
    />
  ),
};

// 카드 펼침: 햄버거를 누르면 바가 아래로 자라고 카드가 시차를 두고 솟는다
export const CardsItems: Story = {
  render: () => (
    <div style={{ minHeight: '360px' }}>
      <HeaderBar
        title="TUI"
        navStyle="cards"
        items={[
          {
            label: '회사 소개',
            links: [
              { label: '비전', href: '#' },
              { label: '팀', href: '#' },
            ],
          },
          {
            label: '프로젝트',
            links: [
              { label: '주요 사례', href: '#' },
              { label: '진행 중', href: '#' },
            ],
          },
          {
            label: '연락',
            links: [
              { label: '이메일', href: '#' },
              { label: '트위터', href: '#' },
            ],
          },
        ]}
      />
    </div>
  ),
};

// Sticky 헤더
export const Sticky: Story = {
  render: () => (
    <div style={{ height: '200vh', background: '#f5f5f5' }}>
      <HeaderBar title="Sticky Header" sticky items={textItems} />
      <div style={{ padding: '2rem' }}>
        <h1>스크롤 테스트</h1>
        <p>헤더가 스크롤 다운을 해도 따라와야 함</p>
        <div
          style={{
            height: '150vh',
            background: 'white',
            marginTop: '2rem',
            padding: '2rem',
            borderRadius: '8px',
          }}
        >
          <p>긴 분량의 콘텐츠</p>
        </div>
      </div>
    </div>
  ),
};

// 완전한 예시 (Logo + Items + Actions)
export const CompleteExample: Story = {
  render: () => (
    <div style={{ height: '150vh', background: '#f5f5f5' }}>
      <HeaderBar
        logo={
          <svg width="32" height="32" viewBox="0 0 32 32" fill="#0066ff">
            <circle cx="16" cy="16" r="14" fill="#0066ff" />
            <path d="M16 8 L22 24 L10 24 Z" fill="white" />
          </svg>
        }
        title="TaeinUI"
        sticky
        items={[
          { label: '문서', href: '#', active: true },
          { label: '컴포넌트', href: '#' },
          { label: '가이드', href: '#' },
        ]}
        actions={
          <div
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
          >
            <button
              type="button"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              회원가입
            </button>
            <button
              type="button"
              style={{
                padding: '0.5rem 1.25rem',
                border: 'none',
                borderRadius: '6px',
                background: '#0066ff',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              시작하기
            </button>
          </div>
        }
      />
      <div
        style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Complete Header Example
        </h1>
        <p
          style={{ fontSize: '1.125rem', color: '#666', marginBottom: '2rem' }}
        >
          이 예시는 로고, 제목, 항목, 액션 버튼을 포함한 헤더를 보여줍니다.
          <br />
          아래로 스크롤하여 고정 기능이 작동하는 모습을 확인하고, 창을 768px보다
          좁혀 햄버거 메뉴도 확인하세요.
        </p>
        <div
          style={{
            height: '100vh',
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
          }}
        >
          <p>테스트를 위해 스크롤 해보세요</p>
        </div>
      </div>
    </div>
  ),
};

// Interactive 플레이그라운드
export const Interactive: Story = {
  args: {
    title: 'Interactive Header',
    sticky: true,
    navStyle: 'pill',
    items: [
      { label: 'Link 1', href: '#', active: true },
      { label: 'Link 2', href: '#' },
      { label: 'Link 3', href: '#' },
    ],
  },
  render: (args) => (
    <div style={{ height: '150vh', background: '#f5f5f5' }}>
      <HeaderBar {...args} />
      <div style={{ padding: '2rem' }}>
        <p>헤더 커스터마이징 가능</p>
        <p style={{ marginTop: '100vh' }}>스크롤 테스트</p>
      </div>
    </div>
  ),
};
