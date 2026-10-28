import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, CodeSlots } from '@taein-ui/core';

const meta = {
  title: 'Motion/CodeSlots',
  component: CodeSlots,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    label: '인증번호',
  },
} satisfies Meta<typeof CodeSlots>;

export default meta;
type Story = StoryObj<typeof meta>;

// 123456을 넣으면 성공, 다른 여섯 자리면 오류 연출이 돈다
const Demo = (args: ComponentProps<typeof CodeSlots>) => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<'wrong' | 'ok' | null>(null);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <CodeSlots
        {...args}
        value={code}
        onChange={(next) => {
          setCode(next);
          setResult(null);
        }}
        onComplete={(full) => setResult(full === '123456' ? 'ok' : 'wrong')}
        error={result === 'wrong'}
        errorMessage="번호가 맞지 않습니다"
        success={result === 'ok'}
        successMessage="확인했습니다"
      />
      <Button
        variant="light"
        onClick={() => {
          setCode('');
          setResult(null);
        }}
      >
        다시
      </Button>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <Demo {...args} />,
};

export const FourDigits: Story = {
  args: { length: 4, label: 'PIN' },
  render: (args) => <Demo {...args} />,
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: '123' },
};
