import type { Meta, StoryObj } from '@storybook/react';
import { Loader } from '@taein-ui/core';
import { useState } from 'react';

const meta = {
  title: 'Components/Loader',
  component: Loader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['spinner', 'dots', 'bar'],
      description: 'Loader type',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'white'],
      description: 'Color',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    fullScreen: {
      control: 'boolean',
      description: 'Full screen overlay',
    },
    overlay: {
      control: 'boolean',
      description: 'Absolute positioned overlay',
    },
  },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Types: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '3rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Spinner
        </p>
        <Loader type="spinner" />
      </div>
      <div>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Dots
        </p>
        <Loader type="dots" />
      </div>
      <div>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Bar
        </p>
        <Loader type="bar" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Loader size="sm" />
      <Loader size="md" />
      <Loader size="lg" />
      <Loader size="xl" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '3rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Primary
        </p>
        <Loader color="primary" />
      </div>
      <div>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Secondary
        </p>
        <Loader color="secondary" />
      </div>
      <div
        style={{
          padding: '2rem',
          backgroundColor: '#333',
          borderRadius: '8px',
        }}
      >
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#FFF',
          }}
        >
          White
        </p>
        <Loader color="white" />
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
      <Loader label="로딩 중..." />
      <Loader type="dots" label="데이터를 불러오는 중입니다" />
      <Loader type="bar" label="처리 중..." />
    </div>
  ),
};

export const DotsVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Small
        </h3>
        <Loader type="dots" size="sm" label="로딩 중..." />
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Medium
        </h3>
        <Loader type="dots" size="md" label="로딩 중..." />
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Large
        </h3>
        <Loader type="dots" size="lg" label="로딩 중..." />
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Extra Large
        </h3>
        <Loader type="dots" size="xl" label="로딩 중..." />
      </div>
    </div>
  ),
};

export const BarVariants: Story = {
  args: {
    size: 'xl',
    type: 'bar',
    color: 'white',
    label: '안녕하세요',
  },

  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        width: '400px',
      }}
    >
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Primary
        </h3>
        <Loader type="bar" color="primary" label="파일 업로드 중..." />
      </div>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Secondary
        </h3>
        <Loader type="bar" color="secondary" label="다운로드 중..." />
      </div>
    </div>
  ),
};

const OverlayExampleComponent = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div style={{ position: 'relative', width: '400px', height: '300px' }}>
      <div
        style={{
          padding: '2rem',
          border: '1px solid #E0E0E0',
          borderRadius: '8px',
          height: '100%',
        }}
      >
        <h3 style={{ marginTop: 0 }}>콘텐츠 영역</h3>
        <p>이 영역 위에 로더 오버레이가 표시됩니다.</p>
        <button
          onClick={handleClick}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            border: '1px solid #1E88E5',
            borderRadius: '6px',
            backgroundColor: '#1E88E5',
            color: '#FFF',
            cursor: 'pointer',
          }}
        >
          3초간 로딩 시작
        </button>
      </div>
      {loading && <Loader overlay label="로딩 중..." />}
    </div>
  );
};

export const OverlayExample: Story = {
  render: () => <OverlayExampleComponent />,
};

const FullScreenExampleComponent = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          border: '1px solid #1E88E5',
          borderRadius: '6px',
          backgroundColor: '#1E88E5',
          color: '#FFF',
          cursor: 'pointer',
        }}
      >
        전체 화면 로딩 시작 (3초)
      </button>
      {loading && <Loader fullScreen label="처리 중입니다..." />}
    </div>
  );
};

export const FullScreenExample: Story = {
  render: () => <FullScreenExampleComponent />,
};

const InButtonComponent = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        border: '1px solid #1E88E5',
        borderRadius: '6px',
        backgroundColor: loading ? '#BBDEFB' : '#1E88E5',
        color: '#FFF',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
      }}
    >
      {loading && <Loader size="sm" color="white" />}
      {loading ? '처리 중...' : '제출하기'}
    </button>
  );
};

export const InButton: Story = {
  render: () => <InButtonComponent />,
};

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3rem',
        width: '600px',
      }}
    >
      <div>
        <h3
          style={{
            marginBottom: '1.5rem',
            fontSize: '1.125rem',
            fontWeight: 600,
          }}
        >
          Spinner Variants
        </h3>
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Loader type="spinner" size="sm" />
          <Loader type="spinner" size="md" />
          <Loader type="spinner" size="lg" />
          <Loader type="spinner" size="xl" />
        </div>
      </div>

      <div>
        <h3
          style={{
            marginBottom: '1.5rem',
            fontSize: '1.125rem',
            fontWeight: 600,
          }}
        >
          Dots Variants
        </h3>
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Loader type="dots" size="sm" />
          <Loader type="dots" size="md" />
          <Loader type="dots" size="lg" />
          <Loader type="dots" size="xl" />
        </div>
      </div>

      <div>
        <h3
          style={{
            marginBottom: '1.5rem',
            fontSize: '1.125rem',
            fontWeight: 600,
          }}
        >
          Bar Variants
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Loader type="bar" size="sm" />
          <Loader type="bar" size="md" />
          <Loader type="bar" size="lg" />
        </div>
      </div>

      <div>
        <h3
          style={{
            marginBottom: '1.5rem',
            fontSize: '1.125rem',
            fontWeight: 600,
          }}
        >
          With Labels
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Loader type="spinner" label="스피너 로딩 중..." />
          <Loader type="dots" label="Dots 로딩 중..." />
          <Loader type="bar" label="진행률 표시 중..." />
        </div>
      </div>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    type: 'spinner',
    size: 'md',
    color: 'primary',
    label: '',
    fullScreen: false,
    overlay: false,
  },
};
