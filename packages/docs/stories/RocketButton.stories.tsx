import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, RocketButton } from '@taein-ui/core';

const meta = {
  title: 'Motion/RocketButton',
  component: RocketButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: '보내기',
    sentLabel: '보냈어요',
  },
} satisfies Meta<typeof RocketButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// 한 번만 난다. 다시 보내 보려면 key를 바꿔 새로 그린다. 무대(position: relative)에 가두면 그 안에서 날아간다
const Demo = (args: ComponentProps<typeof RocketButton>) => {
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState<HTMLElement | null>(null);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <div
        ref={setStage}
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          width: 360,
          height: 200,
          border: '1px dashed #90a4ae',
          overflow: 'hidden',
        }}
      >
        <RocketButton key={round} container={stage} {...args} />
      </div>
      <Button variant="light" onClick={() => setRound((n) => n + 1)}>
        다시
      </Button>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <Demo {...args} />,
};

export const Disabled: Story = {
  args: { disabled: true },
};
