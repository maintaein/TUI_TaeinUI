import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card, IconButton, Morph } from '@taein-ui/core';

const meta = {
  title: 'Motion/Morph',
  component: Morph,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    morphId: 'card-1',
    children: <div />,
  },
} satisfies Meta<typeof Morph>;

export default meta;
type Story = StoryObj<typeof meta>;

// 같은 morphId의 Morph가 사라지고 나타나면 새 요소가 이전 요소의 자리와 모양에서 자란다
const Demo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', width: 420, height: 240 }}>
      {!open && (
        <Morph morphId="card-1">
          <Card
            onClick={() => setOpen(true)}
            title="카드"
            style={{ width: 140 }}
          >
            눌러서 열기
          </Card>
        </Morph>
      )}
      {open && (
        <Morph morphId="card-1">
          <Card
            title="상세"
            footer={
              <IconButton aria-label="닫기" onClick={() => setOpen(false)}>
                x
              </IconButton>
            }
          >
            카드가 이 자리로 자라났습니다.
          </Card>
        </Morph>
      )}
    </div>
  );
};

export const Default: Story = {
  render: () => <Demo />,
};
