import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GooeySearch } from '@taein-ui/core';

const meta = {
  title: 'Motion/GooeySearch',
  component: GooeySearch,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    open: false,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof GooeySearch>;

export default meta;
type Story = StoryObj<typeof meta>;

const FRUITS = ['사과', '바나나', '포도', '복숭아'];

const FruitSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const found = query ? FRUITS.filter((name) => name.includes(query)) : [];
  return (
    <div style={{ width: 360, height: 220 }}>
      <GooeySearch
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery('');
        }}
        placeholder="과일 검색..."
        inputProps={{
          value: query,
          onChange: (event) => setQuery(event.target.value),
        }}
      >
        {found.length > 0 && (
          <ul>
            {found.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </GooeySearch>
    </div>
  );
};

// 열림 상태와 검색어는 소비자가 쥔다. 결과는 children으로 넘긴다
export const Default: Story = {
  render: () => <FruitSearch />,
};

// 처음부터 열려 있는 모습
export const Open: Story = {
  args: { open: true },
  render: (args) => (
    <div style={{ width: 360 }}>
      <GooeySearch {...args} placeholder="검색..." />
    </div>
  ),
};
