import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FanMenu } from '@taein-ui/core';

const meta = {
  title: 'Motion/FanMenu',
  component: FanMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    label: '빠른 작업',
    items: [],
  },
} satisfies Meta<typeof FanMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const NAMES = ['사진', '메시지', '음악', '위치', '좋아요', '설정'];
const PATHS = [
  'M4 7h16v12H4zM9 7l1.5-2h3L15 7M12 16a3 3 0 100-6 3 3 0 000 6z',
  'M4 5h16v11H9l-5 4z',
  'M9 18V6l10-2v12',
  'M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z',
  'M12 20s-8-4.8-8-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.2 12 20 12 20z',
  'M12 3v3M12 18v3M3 12h3M18 12h3',
];

// 호가 위로 펼쳐지므로 위쪽에 자리를 둔다. 고른 항목 이름을 아래에 글로 보인다
const Demo = ({ count = 6 }: { count?: number }) => {
  const [picked, setPicked] = useState('');
  return (
    <div style={{ display: 'grid', gap: 12, padding: '150px 140px 0' }}>
      <FanMenu
        label="빠른 작업"
        items={NAMES.slice(0, count).map((label, i) => ({
          icon: icon(PATHS[i]),
          label,
          onSelect: () => setPicked(label),
        }))}
      />
      <p aria-live="polite">{picked ? `${picked}을(를) 골랐습니다` : ' '}</p>
    </div>
  );
};

export const Default: Story = {
  render: () => <Demo />,
};

export const ThreeItems: Story = {
  render: () => <Demo count={3} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
    items: NAMES.slice(0, 3).map((label) => ({
      icon: icon(PATHS[0]),
      label,
      onSelect: () => {},
    })),
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '150px 140px 0' }}>
        <Story />
      </div>
    ),
  ],
};
