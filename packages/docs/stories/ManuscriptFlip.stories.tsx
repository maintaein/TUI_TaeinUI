import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, ManuscriptFlip } from '@taein-ui/core';

const meta = {
  title: 'Motion/ManuscriptFlip',
  component: ManuscriptFlip,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    flipped: { control: 'boolean' },
  },
} satisfies Meta<typeof ManuscriptFlip>;

export default meta;
type Story = StoryObj<typeof meta>;

const face = { padding: 24, minHeight: 180 } as const;

const FlipDemo = () => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div style={{ maxWidth: 360 }}>
      <ManuscriptFlip
        flipped={flipped}
        front={<div style={face}>가볍고 오래 신는 러닝화</div>}
        back={<div style={face}>밑창이 두껍고 발볼이 넉넉합니다.</div>}
      />
      <div style={{ marginTop: 12 }}>
        <Button onClick={() => setFlipped((v) => !v)}>
          {flipped ? '앞면 보기' : '뒷면 보기'}
        </Button>
      </div>
    </div>
  );
};

// 기본 예시: 단추로 flipped를 쥐고, 누를 때마다 칸이 글 쓰는 순서(왼쪽에서 오른쪽, 윗줄에서 아랫줄)로 뒤집히며 뒷면이 드러난다. 되넘길 때는 반대 순서다
export const Default: Story = {
  args: {
    flipped: false,
    front: <div style={face}>앞면</div>,
    back: <div style={face}>뒷면</div>,
  },
  render: () => <FlipDemo />,
};
