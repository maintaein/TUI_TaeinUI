import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from '@taein-ui/core';
import { useState } from 'react';

const meta = {
  title: 'Components/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
  },
  args: {
    label: '',
    children: (props) => (
      <input
        {...props}
        placeholder="내용을 입력하세요"
        style={{ border: props.isError ? '1px solid red' : '1px solid gray' }}
      />
    ),
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: '레이블 텍스트',
    },
    helperText: {
      control: 'text',
      description: '도움말 텍스트',
    },
    error: {
      control: 'boolean',
      description: '에러 상태',
    },
    errorMessage: {
      control: 'text',
      description: '에러 메시지',
    },
    required: {
      control: 'boolean',
      description: '필수 입력',
    },
    fullWidth: {
      control: 'boolean',
      description: '전체 너비 사용',
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 - Input
export const Default: Story = {
  args: {
    label: '이름',
  },
  render: (args) => (
    <FormField {...args}>
      {({ inputId, helperId, hasHelper }) => (
        <input
          id={inputId}
          aria-describedby={hasHelper ? helperId : undefined}
          placeholder="이름을 입력하세요"
          style={{
            width: '300px',
            padding: '0.75rem 1rem',
            border: '1px solid #DDDDDD',
            borderRadius: '8px',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
      )}
    </FormField>
  ),
};

// 다양한 입력 요소와 함께
export const WithDifferentInputs: Story = {
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
      {/* Input */}
      <FormField label="텍스트 입력" helperText="일반 input 요소">
        {({ inputId, helperId, hasHelper }) => (
          <input
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            placeholder="텍스트를 입력하세요"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #DDDDDD',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        )}
      </FormField>

      {/* TextArea */}
      <FormField label="장문 입력" helperText="textarea 요소">
        {({ inputId, helperId, hasHelper }) => (
          <textarea
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            placeholder="내용을 입력하세요"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.75rem 1rem',
              border: '1px solid #DDDDDD',
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical',
            }}
          />
        )}
      </FormField>

      {/* Select */}
      <FormField label="선택 입력" helperText="select 요소">
        {({ inputId, helperId, hasHelper }) => (
          <select
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #DDDDDD',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          >
            <option value="">선택하세요</option>
            <option value="option1">옵션 1</option>
            <option value="option2">옵션 2</option>
            <option value="option3">옵션 3</option>
          </select>
        )}
      </FormField>

      {/* Checkbox */}
      <FormField label="체크박스" helperText="checkbox 요소">
        {({ inputId, helperId, hasHelper }) => (
          <input
            type="checkbox"
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
        )}
      </FormField>
    </div>
  ),
};

// Required (필수 입력)
export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '400px',
      }}
    >
      <FormField label="이메일" required helperText="필수 입력 항목입니다">
        {({ inputId, helperId, hasHelper }) => (
          <input
            type="email"
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            required
            placeholder="example@email.com"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #DDDDDD',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        )}
      </FormField>

      <FormField label="비밀번호" required>
        {({ inputId }) => (
          <input
            type="password"
            id={inputId}
            required
            placeholder="비밀번호를 입력하세요"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #DDDDDD',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        )}
      </FormField>
    </div>
  ),
};

// Error State (에러 상태)
export const ErrorState: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '400px',
      }}
    >
      <FormField
        label="이메일"
        error
        errorMessage="올바른 이메일 형식이 아닙니다"
      >
        {({ inputId, helperId, hasHelper, isError }) => (
          <input
            type="email"
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            aria-invalid={isError}
            placeholder="example@email.com"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #F04452',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        )}
      </FormField>

      <FormField
        label="비밀번호"
        error
        errorMessage="비밀번호는 최소 8자 이상이어야 합니다"
      >
        {({ inputId, helperId, hasHelper, isError }) => (
          <input
            type="password"
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            aria-invalid={isError}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #F04452',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        )}
      </FormField>
    </div>
  ),
};

// Helper Text (도움말 텍스트)
export const HelperText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '400px',
      }}
    >
      <FormField label="사용자명" helperText="4-20자의 영문, 숫자만 사용 가능">
        {({ inputId, helperId, hasHelper }) => (
          <input
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            placeholder="username"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #DDDDDD',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        )}
      </FormField>

      <FormField label="전화번호" helperText="'-' 없이 숫자만 입력하세요">
        {({ inputId, helperId, hasHelper }) => (
          <input
            type="tel"
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            placeholder="01012345678"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #DDDDDD',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        )}
      </FormField>
    </div>
  ),
};

// Full Width
export const FullWidth: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <FormField
        label="전체 너비"
        fullWidth
        helperText="fullWidth prop을 사용하면 전체 너비를 차지합니다"
      >
        {({ inputId, helperId, hasHelper }) => (
          <input
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            placeholder="전체 너비 입력"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #DDDDDD',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        )}
      </FormField>
    </div>
  ),
};

// Controlled Form Example
const ControlledFormExample = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [errors, setErrors] = useState({
    name: false,
    email: false,
    message: false,
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    message: false,
  });

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouched({ ...touched, [field]: true });

    if (field === 'name') {
      setErrors({ ...errors, name: formData.name.length < 2 });
    } else if (field === 'email') {
      setErrors({ ...errors, email: !validateEmail(formData.email) });
    } else if (field === 'message') {
      setErrors({ ...errors, message: formData.message.length < 10 });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      name: formData.name.length < 2,
      email: !validateEmail(formData.email),
      message: formData.message.length < 10,
    };

    setErrors(newErrors);
    setTouched({ name: true, email: true, message: true });

    if (!newErrors.name && !newErrors.email && !newErrors.message) {
      alert('폼 제출 성공!');
      console.log('Form data:', formData);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: '0.75rem 1rem',
    border: `1px solid ${hasError ? '#F04452' : '#DDDDDD'}`,
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
  });

  return (
    <form onSubmit={handleSubmit} style={{ width: '500px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <FormField
          label="이름"
          required
          error={touched.name && errors.name}
          errorMessage={
            touched.name && errors.name
              ? '이름은 2자 이상이어야 합니다'
              : undefined
          }
          helperText={!errors.name ? '실명을 입력하세요' : undefined}
        >
          {({ inputId, helperId, hasHelper, isError }) => (
            <input
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
              aria-invalid={isError}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              onBlur={() => handleBlur('name')}
              placeholder="홍길동"
              style={inputStyle(touched.name && errors.name)}
            />
          )}
        </FormField>

        <FormField
          label="이메일"
          required
          error={touched.email && errors.email}
          errorMessage={
            touched.email && errors.email
              ? '올바른 이메일 형식이 아닙니다'
              : undefined
          }
          helperText={!errors.email ? '로그인 시 사용할 이메일' : undefined}
        >
          {({ inputId, helperId, hasHelper, isError }) => (
            <input
              type="email"
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
              aria-invalid={isError}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              onBlur={() => handleBlur('email')}
              placeholder="example@email.com"
              style={inputStyle(touched.email && errors.email)}
            />
          )}
        </FormField>

        <FormField
          label="메시지"
          required
          error={touched.message && errors.message}
          errorMessage={
            touched.message && errors.message
              ? '메시지는 최소 10자 이상이어야 합니다'
              : undefined
          }
          helperText={!errors.message ? '구체적으로 작성해주세요' : undefined}
        >
          {({ inputId, helperId, hasHelper, isError }) => (
            <textarea
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
              aria-invalid={isError}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              onBlur={() => handleBlur('message')}
              placeholder="문의 내용을 입력하세요"
              style={{
                ...inputStyle(touched.message && errors.message),
                minHeight: '120px',
                resize: 'vertical',
              }}
            />
          )}
        </FormField>

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
          제출하기
        </button>
      </div>
    </form>
  );
};

export const ControlledForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ControlledFormExample />,
};

// All States
export const AllStates: Story = {
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
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          기본
        </h3>
        <FormField label="이름">
          {({ inputId }) => (
            <input
              id={inputId}
              placeholder="이름을 입력하세요"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #DDDDDD',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          )}
        </FormField>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          필수 입력
        </h3>
        <FormField label="이메일" required>
          {({ inputId }) => (
            <input
              type="email"
              id={inputId}
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #DDDDDD',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          )}
        </FormField>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          도움말 포함
        </h3>
        <FormField label="전화번호" helperText="'-' 없이 숫자만 입력">
          {({ inputId, helperId, hasHelper }) => (
            <input
              type="tel"
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
              placeholder="01012345678"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #DDDDDD',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          )}
        </FormField>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          에러 상태
        </h3>
        <FormField
          label="비밀번호"
          error
          errorMessage="비밀번호가 일치하지 않습니다"
        >
          {({ inputId, helperId, hasHelper, isError }) => (
            <input
              type="password"
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
              aria-invalid={isError}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #F04452',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          )}
        </FormField>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          필수 + 에러
        </h3>
        <FormField
          label="사용자명"
          required
          error
          errorMessage="이미 사용 중인 사용자명입니다"
        >
          {({ inputId, helperId, hasHelper, isError }) => (
            <input
              id={inputId}
              aria-describedby={hasHelper ? helperId : undefined}
              aria-invalid={isError}
              placeholder="username"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #F04452',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          )}
        </FormField>
      </div>
    </div>
  ),
};

// Render Prop Pattern Explanation
export const RenderPropPattern: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: '500px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          FormField Render Prop 패턴
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#666', lineHeight: 1.6 }}>
          FormField는 render prop 패턴을 사용하여 다양한 폼 요소를 감쌀 수
          있습니다.
          <br />
          children 함수는 다음 props를 제공합니다:
        </p>
        <ul
          style={{
            fontSize: '0.875rem',
            color: '#666',
            marginTop: '0.5rem',
            paddingLeft: '1.5rem',
          }}
        >
          <li>
            <strong>inputId</strong>: input 요소의 고유 ID
          </li>
          <li>
            <strong>helperId</strong>: helper/error 메시지의 ID
          </li>
          <li>
            <strong>hasHelper</strong>: helper/error 메시지 존재 여부
          </li>
          <li>
            <strong>isError</strong>: 에러 상태 여부
          </li>
        </ul>
      </div>

      <FormField
        label="예제 입력"
        helperText="이 필드는 FormField로 감싸져 있습니다"
      >
        {({ inputId, helperId, hasHelper }) => (
          <input
            id={inputId}
            aria-describedby={hasHelper ? helperId : undefined}
            placeholder="FormField의 props를 활용합니다"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #DDDDDD',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        )}
      </FormField>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#F5F5F5',
          borderRadius: '8px',
        }}
      >
        <pre
          style={{
            fontSize: '0.75rem',
            lineHeight: 1.5,
            margin: 0,
            overflow: 'auto',
          }}
        >
          {`<FormField label="예제" helperText="도움말">
  {({ inputId, helperId, hasHelper }) => (
    <input
      id={inputId}
      aria-describedby={hasHelper ? helperId : undefined}
    />
  )}
</FormField>`}
        </pre>
      </div>
    </div>
  ),
};
