import type { Meta, StoryObj } from '@storybook/react';
import { NumericSpinner } from '@taein-ui/core';
import { ComponentProps, useState } from 'react';

const meta = {
  title: 'Components/NumericSpinner',
  component: NumericSpinner,
  args: {
    label: 'text',
  },
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
      description: '크기',
    },
    min: {
      control: 'number',
      description: '최소값',
    },
    max: {
      control: 'number',
      description: '최대값',
    },
    step: {
      control: 'number',
      description: '증감 단위',
    },
    error: {
      control: 'boolean',
      description: '에러 상태',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
    required: {
      control: 'boolean',
      description: '필수 입력',
    },
    fullWidth: {
      control: 'boolean',
      description: '전체 너비',
    },
  },
} satisfies Meta<typeof NumericSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: '수량',
    defaultValue: 0,
  },
};

export const WithValue: Story = {
  args: {
    label: '수량',
    defaultValue: 5,
  },
};

export const WithMinMax: Story = {
  args: {
    label: '수량',
    defaultValue: 5,
    min: 0,
    max: 10,
  },
};

export const WithStep: Story = {
  args: {
    label: '수량',
    defaultValue: 0,
    step: 5,
  },
};

export const Small: Story = {
  args: {
    label: '수량',
    size: 'sm',
    defaultValue: 0,
  },
};

export const Medium: Story = {
  args: {
    label: '수량',
    size: 'md',
    defaultValue: 0,
  },
};

export const Large: Story = {
  args: {
    label: '수량',
    size: 'lg',
    defaultValue: 0,
  },
};

export const Disabled: Story = {
  args: {
    label: '수량',
    defaultValue: 5,
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    label: '수량',
    defaultValue: 5,
  },
};

export const Required: Story = {
  args: {
    label: '수량',
    defaultValue: 0,
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: '수량',
    defaultValue: 0,
    error: true,
    errorMessage: '1 이상의 값을 입력하세요',
  },
};

export const WithHelperText: Story = {
  args: {
    label: '수량',
    defaultValue: 0,
    helperText: '최소 1개 이상 입력하세요',
  },
};

export const FullWidth: Story = {
  args: {
    label: '수량',
    defaultValue: 0,
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

const ControlledSpinner = (args: ComponentProps<typeof NumericSpinner>) => {
  const [value, setValue] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <NumericSpinner
        {...args}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <div style={{ fontSize: '0.875rem', color: '#666' }}>
        현재 값: {value}
      </div>
    </div>
  );
};

export const Controlled: Story = {
  render: (args) => <ControlledSpinner {...args} />,
  args: {
    label: '수량',
  },
};

const FormExampleComponent = () => {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(10000);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '320px',
      }}
    >
      <NumericSpinner
        label="수량"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        min={1}
        max={99}
        required
        helperText="최대 99개까지 구매 가능합니다"
      />

      <NumericSpinner
        label="단가 (원)"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        min={0}
        step={1000}
        fullWidth
        helperText="1,000원 단위로 입력하세요"
      />

      <div
        style={{
          padding: '1rem',
          backgroundColor: '#F5F5F5',
          borderRadius: '8px',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>주문 요약</div>
        <div>수량: {quantity}개</div>
        <div>단가: {price.toLocaleString()}원</div>
        <div style={{ marginTop: '0.5rem', fontWeight: 600, fontSize: '1rem' }}>
          총액: {(quantity * price).toLocaleString()}원
        </div>
      </div>
    </div>
  );
};

export const FormExample: Story = {
  render: () => <FormExampleComponent />,
};
