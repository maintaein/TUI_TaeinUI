import type { Meta, StoryObj } from '@storybook/react';
import { TextField } from '@taein-ui/core';
import { useState } from 'react';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: '레이블 텍스트',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'Input type',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input 크기',
    },
    error: {
      control: 'boolean',
      description: '에러 상태',
    },
    errorMessage: {
      control: 'text',
      description: '에러 메시지',
    },
    helperText: {
      control: 'text',
      description: '도움말 텍스트',
    },
    fullWidth: {
      control: 'boolean',
      description: '전체 너비 사용',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
    required: {
      control: 'boolean',
      description: '필수 입력',
    },
    readOnly: {
      control: 'boolean',
      description: '읽기 전용',
    },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본
export const Default: Story = {
  args: {
    label: '이름',
    placeholder: '이름을 입력하세요',
  },
};

// Sizes
export const Sizes: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '300px',
      }}
    >
      <TextField label="Small" size="sm" placeholder="Small size" />
      <TextField label="Medium (기본)" size="md" placeholder="Medium size" />
      <TextField label="Large" size="lg" placeholder="Large size" />
    </div>
  ),
};

// Types
export const Types: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '300px',
      }}
    >
      <TextField label="텍스트" type="text" placeholder="일반 텍스트" />
      <TextField label="이메일" type="email" placeholder="example@email.com" />
      <TextField label="비밀번호" type="password" placeholder="비밀번호 입력" />
      <TextField label="숫자" type="number" placeholder="0" />
      <TextField label="전화번호" type="tel" placeholder="010-0000-0000" />
      <TextField
        label="웹사이트"
        type="url"
        placeholder="https://example.com"
      />
    </div>
  ),
};

// States
export const States: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '300px',
      }}
    >
      <TextField label="기본" placeholder="기본 상태" />
      <TextField label="필수" required placeholder="필수 입력" />
      <TextField label="비활성화" disabled placeholder="비활성화 상태" />
      <TextField label="읽기 전용" readOnly value="읽기 전용 값" />
    </div>
  ),
};

// Error State
export const ErrorState: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '300px',
      }}
    >
      <TextField
        label="이메일"
        type="email"
        error
        errorMessage="올바른 이메일 형식이 아닙니다"
      />
      <TextField
        label="비밀번호"
        type="password"
        error
        errorMessage="비밀번호는 최소 8자 이상이어야 합니다"
      />
    </div>
  ),
};

// Helper Text
export const HelperText: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '300px',
      }}
    >
      <TextField
        label="사용자명"
        helperText="4-20자의 영문, 숫자만 사용 가능합니다"
      />
      <TextField
        label="비밀번호"
        type="password"
        helperText="8자 이상, 영문/숫자/특수문자 조합"
      />
    </div>
  ),
};

// Full Width
export const FullWidth: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <TextField
        label="전체 너비"
        fullWidth
        placeholder="전체 너비를 차지합니다"
      />
    </div>
  ),
};

// Required
export const Required: Story = {
  args: {
    label: '이메일',
    type: 'email',
    required: true,
    placeholder: '이메일을 입력하세요',
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    label: '이름',
    disabled: true,
    placeholder: '비활성화된 입력',
  },
};

// Read Only
export const ReadOnly: Story = {
  args: {
    label: '사용자 ID',
    readOnly: true,
    value: 'user12345',
  },
};

// Controlled Component
const ControlledExample = () => {
  const [value, setValue] = useState('');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '300px',
      }}
    >
      <TextField
        label="제어 컴포넌트"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="입력해보세요"
      />
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        입력된 값: {value || '(없음)'}
      </p>
    </div>
  );
};

export const Controlled: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => <ControlledExample />,
};

// Form Example
const FormExampleComponent = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [errors, setErrors] = useState({
    email: false,
    password: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      email: !formData.email.includes('@'),
      password: formData.password.length < 8,
    };

    setErrors(newErrors);

    if (!newErrors.email && !newErrors.password) {
      alert('폼 제출 성공!');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '400px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <TextField
          label="이름"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="홍길동"
          required
        />

        <TextField
          label="이메일"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="example@email.com"
          required
          error={errors.email}
          errorMessage={
            errors.email ? '올바른 이메일 형식이 아닙니다' : undefined
          }
          helperText="로그인 시 사용할 이메일을 입력하세요"
        />

        <TextField
          label="비밀번호"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder="••••••••"
          required
          error={errors.password}
          errorMessage={
            errors.password
              ? '비밀번호는 최소 8자 이상이어야 합니다'
              : undefined
          }
          helperText="8자 이상 입력하세요"
        />

        <TextField
          label="전화번호"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="010-0000-0000"
          helperText="선택사항입니다"
        />

        <button
          type="submit"
          style={{
            padding: '12px',
            backgroundColor: '#1E88E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          가입하기
        </button>
      </div>
    </form>
  );
};

export const FormExample: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => <FormExampleComponent />,
};

// All Combinations
export const AllCombinations: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
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
        <h3 style={{ marginBottom: '1rem' }}>기본</h3>
        <TextField label="이름" placeholder="홍길동" />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>필수 입력</h3>
        <TextField
          label="이메일"
          type="email"
          required
          placeholder="example@email.com"
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>도움말 포함</h3>
        <TextField
          label="비밀번호"
          type="password"
          helperText="8자 이상 입력하세요"
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>에러 상태</h3>
        <TextField
          label="전화번호"
          type="tel"
          error
          errorMessage="올바른 전화번호 형식이 아닙니다"
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>비활성화</h3>
        <TextField label="사용자 ID" disabled value="disabled_user" />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>읽기 전용</h3>
        <TextField label="고유 번호" readOnly value="12345-67890" />
      </div>
    </div>
  ),
};
