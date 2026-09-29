import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '@taein-ui/core';
import { useState } from 'react';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
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
      description: 'Checkbox 크기',
    },
    checked: {
      control: 'boolean',
      description: '체크 상태',
    },
    indeterminate: {
      control: 'boolean',
      description: '불확정 상태 (부분 선택)',
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
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
    required: {
      control: 'boolean',
      description: '필수 입력',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본
export const Default: Story = {
  args: {
    label: '이용약관에 동의합니다',
  },
};

// Sizes
export const Sizes: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Checkbox label="Small" size="sm" />
      <Checkbox label="Medium (기본)" size="md" />
      <Checkbox label="Large" size="lg" />
    </div>
  ),
};

// States
export const States: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" checked onChange={() => {}} />
      <Checkbox label="Indeterminate" indeterminate onChange={() => {}} />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled Checked" disabled checked onChange={() => {}} />
    </div>
  ),
};

// Error State
export const ErrorState: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Checkbox label="필수 약관 동의" error errorMessage="필수 항목입니다" />
      <Checkbox
        label="개인정보 처리방침 동의"
        error
        errorMessage="필수 항목입니다"
        required
      />
    </div>
  ),
};

// Helper Text
export const HelperText: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Checkbox label="마케팅 정보 수신 동의" helperText="선택사항입니다" />
      <Checkbox
        label="이벤트 및 혜택 알림 수신"
        helperText="이메일, SMS로 알림을 받을 수 있습니다"
      />
    </div>
  ),
};

// Required
export const Required: Story = {
  args: {
    label: '필수 약관에 동의합니다',
    required: true,
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    label: '비활성화된 체크박스',
    disabled: true,
  },
};

// Indeterminate
export const Indeterminate: Story = {
  args: {
    label: '부분 선택됨',
    indeterminate: true,
  },
};

// Controlled Component
const ControlledExample = () => {
  const [checked, setChecked] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox
        label="제어 컴포넌트"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        상태: {checked ? '체크됨 ✓' : '체크 안됨'}
      </p>
    </div>
  );
};

export const Controlled: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => <ControlledExample />,
};

// Select All Example
const SelectAllExample = () => {
  const [checkedItems, setCheckedItems] = useState({
    option1: false,
    option2: false,
    option3: false,
  });

  const allChecked = Object.values(checkedItems).every((v) => v);
  const someChecked = Object.values(checkedItems).some((v) => v) && !allChecked;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    setCheckedItems({
      option1: newChecked,
      option2: newChecked,
      option3: newChecked,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox
        label="전체 선택"
        checked={allChecked}
        indeterminate={someChecked}
        onChange={handleSelectAll}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginLeft: '1.5rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid #DDDDDD',
        }}
      >
        <Checkbox
          label="옵션 1"
          checked={checkedItems.option1}
          onChange={(e) =>
            setCheckedItems({ ...checkedItems, option1: e.target.checked })
          }
        />
        <Checkbox
          label="옵션 2"
          checked={checkedItems.option2}
          onChange={(e) =>
            setCheckedItems({ ...checkedItems, option2: e.target.checked })
          }
        />
        <Checkbox
          label="옵션 3"
          checked={checkedItems.option3}
          onChange={(e) =>
            setCheckedItems({ ...checkedItems, option3: e.target.checked })
          }
        />
      </div>
    </div>
  );
};

export const SelectAll: Story = {
  args: { label: '' },
  parameters: { controls: { disable: true } },
  render: () => <SelectAllExample />,
};

// Form Example
const FormExampleComponent = () => {
  const [formData, setFormData] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });

  const [errors, setErrors] = useState({
    terms: false,
    privacy: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      terms: !formData.terms,
      privacy: !formData.privacy,
    };

    setErrors(newErrors);

    if (!newErrors.terms && !newErrors.privacy) {
      alert('가입 완료!');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '400px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
          약관 동의
        </h3>

        <Checkbox
          label="[필수] 이용약관 동의"
          checked={formData.terms}
          onChange={(e) =>
            setFormData({ ...formData, terms: e.target.checked })
          }
          required
          error={errors.terms}
          errorMessage={errors.terms ? '필수 항목입니다' : undefined}
          helperText="서비스 이용을 위해 필수적으로 동의해야 합니다"
        />

        <Checkbox
          label="[필수] 개인정보 처리방침 동의"
          checked={formData.privacy}
          onChange={(e) =>
            setFormData({ ...formData, privacy: e.target.checked })
          }
          required
          error={errors.privacy}
          errorMessage={errors.privacy ? '필수 항목입니다' : undefined}
          helperText="개인정보 보호를 위한 필수 동의 사항입니다"
        />

        <Checkbox
          label="[선택] 마케팅 정보 수신 동의"
          checked={formData.marketing}
          onChange={(e) =>
            setFormData({ ...formData, marketing: e.target.checked })
          }
          helperText="이메일, SMS로 혜택 정보를 받을 수 있습니다"
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
        <Checkbox label="이용약관에 동의합니다" />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>필수 입력</h3>
        <Checkbox label="개인정보 처리방침 동의" required />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>도움말 포함</h3>
        <Checkbox label="마케팅 수신 동의" helperText="선택사항입니다" />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>에러 상태</h3>
        <Checkbox label="필수 약관 동의" error errorMessage="필수 항목입니다" />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>비활성화</h3>
        <Checkbox label="사용 불가" disabled />
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>불확정 상태</h3>
        <Checkbox label="부분 선택됨" indeterminate />
      </div>
    </div>
  ),
};
