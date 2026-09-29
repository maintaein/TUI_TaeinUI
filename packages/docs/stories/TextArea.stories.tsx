import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from '@taein-ui/core';
import { useState } from 'react';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: '레이블 텍스트',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'TextArea 크기',
    },
    autoResize: {
      control: 'boolean',
      description: '높이 자동 조정 여부',
    },
    height: {
      control: 'text',
      description: '최소 높이 (px 또는 문자열)',
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
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본
export const Default: Story = {
  args: {
    label: '설명',
    placeholder: '내용을 입력하세요',
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
        width: '400px',
      }}
    >
      <TextArea label="Small" size="sm" placeholder="Small size" />
      <TextArea label="Medium (기본)" size="md" placeholder="Medium size" />
      <TextArea label="Large" size="lg" placeholder="Large size" />
    </div>
  ),
};

// Fixed Height (고정 높이)
export const FixedHeight: Story = {
  args: { label: '' },
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
      <TextArea
        label="기본 높이 (120px)"
        placeholder="기본 높이는 120px입니다"
      />
      <TextArea
        label="높이 200px"
        height={200}
        placeholder="높이가 200px로 설정되었습니다"
      />
      <TextArea
        label="높이 300px"
        height="300px"
        placeholder="높이가 300px로 설정되었습니다"
      />
    </div>
  ),
};

// Auto Resize (자동 높이 조정)
const AutoResizeExample = () => {
  const [value, setValue] = useState('');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '400px',
      }}
    >
      <TextArea
        label="자동 높이 조정"
        autoResize
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="텍스트를 입력하면 높이가 자동으로 조정됩니다"
        helperText="줄바꿈을 해보세요!"
      />

      <TextArea
        label="자동 높이 + 최소 높이 100px"
        autoResize
        height={100}
        placeholder="최소 높이는 100px이고, 내용에 따라 자동으로 늘어납니다"
      />
    </div>
  );
};

export const AutoResize: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => <AutoResizeExample />,
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
        width: '400px',
      }}
    >
      <TextArea label="기본" placeholder="기본 상태" />
      <TextArea label="필수" required placeholder="필수 입력" />
      <TextArea label="비활성화" disabled placeholder="비활성화 상태" />
      <TextArea label="읽기 전용" readOnly value="읽기 전용 내용" />
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
        width: '400px',
      }}
    >
      <TextArea label="에러 상태" error errorMessage="내용이 너무 짧습니다" />
      <TextArea
        label="에러 + 필수"
        error
        required
        errorMessage="필수 입력 항목입니다"
        placeholder="필수로 입력해야 합니다"
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
        width: '400px',
      }}
    >
      <TextArea label="설명" helperText="최대 500자까지 입력 가능합니다" />
      <TextArea
        label="상세 설명"
        helperText="구체적으로 작성해주세요"
        height={150}
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
      <TextArea
        label="전체 너비"
        fullWidth
        height={150}
        placeholder="전체 너비를 차지합니다"
      />
    </div>
  ),
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
        width: '400px',
      }}
    >
      <TextArea
        label="제어 컴포넌트"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="입력해보세요"
        height={120}
      />
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        입력된 내용: {value || '(없음)'}
      </p>
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        글자 수: {value.length}자
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
    title: '',
    content: '',
    note: '',
  });

  const [errors, setErrors] = useState({
    content: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      content: formData.content.length < 10,
    };

    setErrors(newErrors);

    if (!newErrors.content) {
      alert('폼 제출 성공!');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '500px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <input
          type="text"
          placeholder="제목"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          style={{
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '1rem',
          }}
        />

        <TextArea
          label="내용"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="내용을 입력하세요"
          required
          height={200}
          error={errors.content}
          errorMessage={
            errors.content ? '최소 10자 이상 입력하세요' : undefined
          }
          helperText="구체적으로 작성해주세요"
        />

        <TextArea
          label="비고 (자동 높이)"
          autoResize
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="추가 메모 (선택사항)"
          height={80}
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
          제출하기
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
        width: '500px',
      }}
    >
      <div>
        <h3 style={{ marginBottom: '1rem' }}>기본</h3>
        <TextArea label="설명" placeholder="내용을 입력하세요" />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>필수 입력</h3>
        <TextArea label="의견" required placeholder="의견을 입력하세요" />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>도움말 포함</h3>
        <TextArea
          label="상세 설명"
          helperText="최대 500자까지 입력 가능합니다"
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>고정 높이 (200px)</h3>
        <TextArea
          label="내용"
          height={200}
          placeholder="높이가 200px로 고정되었습니다"
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>자동 높이 조정</h3>
        <TextArea
          label="자동 높이"
          autoResize
          placeholder="내용에 따라 높이가 자동으로 조정됩니다"
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>에러 상태</h3>
        <TextArea label="내용" error errorMessage="내용이 너무 짧습니다" />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>비활성화</h3>
        <TextArea label="설명" disabled value="비활성화된 내용" />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>읽기 전용</h3>
        <TextArea label="공지" readOnly value="읽기 전용 공지사항" />
      </div>
    </div>
  ),
};
