import type { Meta, StoryObj } from '@storybook/react';
import { HeaderBar } from '@taein-ui/core';

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
    children: { control: false },
    actions: { control: false },
    sticky: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['default', 'dark', 'transparent'],
    },
    elevation: { control: 'boolean' },
    border: { control: 'boolean' },
  },
} satisfies Meta<typeof HeaderBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시
export const Default: Story = {
  args: {
    title: 'My Application',
    sticky: false,
    variant: 'default',
    elevation: false,
    border: true,
  },
  render: (args) => (
    <div style={{ height: '200vh', background: '#f5f5f5' }}>
      <HeaderBar {...args}>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            Home
          </a>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            About
          </a>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            Products
          </a>
        </nav>
      </HeaderBar>
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
      logo={
        <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
          <circle cx="16" cy="16" r="12" />
        </svg>
      }
      title="My Brand"
    >
      <nav style={{ display: 'flex', gap: '1.5rem' }}>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Features
        </a>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Pricing
        </a>
      </nav>
    </HeaderBar>
  ),
};

// Actions 영역
export const WithActions: Story = {
  render: () => (
    <HeaderBar title="Dashboard">
      <nav style={{ display: 'flex', gap: '1.5rem' }}>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Overview
        </a>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Analytics
        </a>
      </nav>
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
    </HeaderBar>
  ),
};

// Sticky 헤더
export const Sticky: Story = {
  render: () => (
    <div style={{ height: '200vh', background: '#f5f5f5' }}>
      <HeaderBar title="Sticky Header" sticky>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            Home
          </a>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            About
          </a>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            Contact
          </a>
        </nav>
      </HeaderBar>
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

// Dark Variant
export const DarkVariant: Story = {
  render: () => (
    <HeaderBar
      title="Dark Header"
      variant="dark"
      logo={
        <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
          <circle cx="16" cy="16" r="12" />
        </svg>
      }
    >
      <nav style={{ display: 'flex', gap: '1.5rem' }}>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Explore
        </a>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Collections
        </a>
      </nav>
      <button
        type="button"
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid white',
          borderRadius: '4px',
          background: 'transparent',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        Get Started
      </button>
    </HeaderBar>
  ),
};

// Transparent Variant
export const TransparentVariant: Story = {
  args: {
    border: false,
  },
  render: () => (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}
    >
      <HeaderBar variant="transparent" title="Transparent Header">
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            Home
          </a>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            Features
          </a>
        </nav>
      </HeaderBar>
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Welcome</h1>
        <p style={{ fontSize: '1.25rem' }}>
          Transparent header blends with the background
        </p>
      </div>
    </div>
  ),
};

// Elevation (그림자)
export const WithElevation: Story = {
  render: () => (
    <HeaderBar title="Header with Shadow" elevation>
      <nav style={{ display: 'flex', gap: '1.5rem' }}>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Products
        </a>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Services
        </a>
      </nav>
    </HeaderBar>
  ),
};

// Border 없음
export const NoBorder: Story = {
  render: () => (
    <HeaderBar title="No Border Header" border={false}>
      <nav style={{ display: 'flex', gap: '1.5rem' }}>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Minimal
        </a>
        <a
          href="#"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '0.5rem',
          }}
        >
          Clean
        </a>
      </nav>
    </HeaderBar>
  ),
};

// 완전한 예시 (Logo + Navigation + Actions)
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
        elevation
      >
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 500,
              padding: '0.5rem',
            }}
          >
            문서
          </a>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 500,
              padding: '0.5rem',
            }}
          >
            컴포넌트
          </a>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 500,
              padding: '0.5rem',
            }}
          >
            가이드
          </a>
        </nav>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
      </HeaderBar>
      <div
        style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Complete Header Example
        </h1>
        <p
          style={{ fontSize: '1.125rem', color: '#666', marginBottom: '2rem' }}
        >
          이 예시는 로고, 제목, 탐색 메뉴 및 액션 버튼을 포함한 모든 기능을 갖춘
          헤더를 보여줍니다.<br></br>
          아래로 스크롤하여 고정 기능이 작동하는 모습을 확인하세요.
        </p>
        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}
        >
          <h2>Feature Highlights</h2>
          <ul style={{ lineHeight: 1.8 }}>
            <li>스크롤 시에도 상단에 고정</li>
            <li>입체감을 위한 그림자 효과</li>
            <li>로고와 제목 조합</li>
            <li>중앙 정렬된 내비게이션 링크</li>
            <li>오른쪽에 위치한 액션 버튼</li>
            <li>반응형 디자인 (크기 조정을 시도해 보세요)</li>
          </ul>
        </div>
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
    variant: 'default',
    elevation: true,
    border: true,
  },
  render: (args) => (
    <div style={{ height: '150vh', background: '#f5f5f5' }}>
      <HeaderBar {...args}>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            Link 1
          </a>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            Link 2
          </a>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '0.5rem',
            }}
          >
            Link 3
          </a>
        </nav>
      </HeaderBar>
      <div style={{ padding: '2rem' }}>
        <p>헤더 커스터마이징 가능</p>
        <p style={{ marginTop: '100vh' }}>스크롤 테스트</p>
      </div>
    </div>
  ),
};
