import type { Meta, StoryObj } from '@storybook/react';
import { Chip } from '@taein-ui/core';
import { useState } from 'react';
import { Heart, House, Settings } from 'lucide-react';

const meta = {
  title: 'Data Display/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    label: '',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '칩 크기',
    },
    variant: {
      control: 'select',
      options: ['filled', 'outlined'],
      description: '칩 스타일',
    },
    color: {
      control: 'select',
      options: ['default', 'primary', 'success', 'error', 'warning'],
      description: '칩 색상',
    },
    selected: {
      control: 'boolean',
      description:
        '선택 상태. onClick이 있는 칩에 주면 토글 칩(aria-pressed). onClick 없이 주면 선택 모양만',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 예시
export const Default: Story = {
  args: {
    label: '기본 칩',
  },
};

// 크기 옵션
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Chip label="Small" size="sm" />
      <Chip label="Medium" size="md" />
      <Chip label="Large" size="lg" />
    </div>
  ),
};

// Variant 옵션
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Chip label="Filled" variant="filled" color="primary" />
      <Chip label="Outlined" variant="outlined" color="primary" />
    </div>
  ),
};

// 색상 옵션 - Filled
export const ColorsFilled: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <Chip label="Default" variant="filled" color="default" />
      <Chip label="Primary" variant="filled" color="primary" />
      <Chip label="Success" variant="filled" color="success" />
      <Chip label="Error" variant="filled" color="error" />
      <Chip label="Warning" variant="filled" color="warning" />
    </div>
  ),
};

// 색상 옵션 - Outlined
export const ColorsOutlined: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <Chip label="Default" variant="outlined" color="default" />
      <Chip label="Primary" variant="outlined" color="primary" />
      <Chip label="Success" variant="outlined" color="success" />
      <Chip label="Error" variant="outlined" color="error" />
      <Chip label="Warning" variant="outlined" color="warning" />
    </div>
  ),
};

// 아이콘이 있는 칩
export const WithIcon: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <Chip label="Home" icon={<House size={16} />} color="primary" />
      <Chip label="Settings" icon={<Settings size={16} />} color="success" />
      <Chip label="Favorite" icon={<Heart size={16} />} color="error" />
    </div>
  ),
};

// 아바타가 있는 칩
export const WithAvatar: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Chip
        label="홍길동"
        avatar={
          <img
            src="https://i.pravatar.cc/40?img=1"
            alt="홍길동"
            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
          />
        }
        color="primary"
      />
      <Chip
        label="김철수"
        avatar={
          <img
            src="https://i.pravatar.cc/40?img=2"
            alt="김철수"
            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
          />
        }
        color="success"
      />
      <Chip
        label="이영희"
        avatar={
          <img
            src="https://i.pravatar.cc/40?img=3"
            alt="이영희"
            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
          />
        }
        color="error"
      />
    </div>
  ),
};

const DeletableComponent = () => {
  const [chips, setChips] = useState([
    { id: 1, label: 'React' },
    { id: 2, label: 'TypeScript' },
    { id: 3, label: 'Vite' },
    { id: 4, label: 'Vitest' },
  ]);

  const handleDelete = (id: number) => {
    setChips(chips.filter((chip) => chip.id !== id));
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
      }}
    >
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          label={chip.label}
          color="primary"
          onDelete={() => handleDelete(chip.id)}
        />
      ))}
    </div>
  );
};

// 삭제 가능한 칩
export const Deletable: Story = {
  render: () => <DeletableComponent />,
};

const ClickableComponent = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {['React', 'Vue', 'Angular', 'Svelte'].map((label, index) => (
        <Chip
          key={index}
          label={label}
          selected={selected === index}
          onClick={() => setSelected(index)}
          color="primary"
        />
      ))}
    </div>
  );
};

// 클릭 가능한 칩
export const Clickable: Story = {
  render: () => <ClickableComponent />,
};

const MultiSelectComponent = () => {
  const [selected, setSelected] = useState<number[]>([]);

  const toggleSelection = (index: number) => {
    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
    } else {
      setSelected([...selected, index]);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
      }}
    >
      {['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go'].map(
        (label, index) => (
          <Chip
            key={index}
            label={label}
            selected={selected.includes(index)}
            onClick={() => toggleSelection(index)}
            color="success"
            variant="outlined"
          />
        )
      )}
    </div>
  );
};

// 다중 선택 가능한 칩
export const MultiSelect: Story = {
  render: () => <MultiSelectComponent />,
};

// 비활성화된 칩
export const Disabled: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <Chip label="Disabled" disabled />
      <Chip label="Disabled Primary" color="primary" disabled />
      <Chip label="Disabled Clickable" onClick={() => {}} disabled />
      <Chip label="Disabled Deletable" onDelete={() => {}} disabled />
    </div>
  ),
};

const TagSystemComponent = () => {
  const [tags, setTags] = useState([
    { id: 1, label: 'Frontend', color: 'primary' as const },
    { id: 2, label: 'Backend', color: 'success' as const },
    { id: 3, label: 'DevOps', color: 'warning' as const },
    { id: 4, label: 'Design', color: 'error' as const },
  ]);

  const handleDelete = (id: number) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>프로젝트 태그</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.label}
            color={tag.color}
            onDelete={() => handleDelete(tag.id)}
          />
        ))}
      </div>
    </div>
  );
};

// 사용 예시: 태그 시스템
export const TagSystem: Story = {
  render: () => <TagSystemComponent />,
};

const FilterChipsComponent = () => {
  const [filters, setFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    if (filters.includes(filter)) {
      setFilters(filters.filter((f) => f !== filter));
    } else {
      setFilters([...filters, filter]);
    }
  };

  const filterOptions = [
    { label: '최신순', value: 'latest' },
    { label: '인기순', value: 'popular' },
    { label: '낮은 가격', value: 'price-low' },
    { label: '높은 가격', value: 'price-high' },
    { label: '할인 상품', value: 'sale' },
  ];

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>필터</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {filterOptions.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={filters.includes(option.value)}
            onClick={() => toggleFilter(option.value)}
            variant="outlined"
            color={filters.includes(option.value) ? 'primary' : 'default'}
          />
        ))}
      </div>
      {filters.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
          선택된 필터: {filters.join(', ')}
        </div>
      )}
    </div>
  );
};

// 사용 예시: 필터
export const FilterChips: Story = {
  render: () => <FilterChipsComponent />,
};

const ContactChipsComponent = () => {
  const [contacts, setContacts] = useState([
    { id: 1, name: '홍길동', avatar: 'https://i.pravatar.cc/40?img=1' },
    { id: 2, name: '김철수', avatar: 'https://i.pravatar.cc/40?img=2' },
    { id: 3, name: '이영희', avatar: 'https://i.pravatar.cc/40?img=3' },
    { id: 4, name: '박민수', avatar: 'https://i.pravatar.cc/40?img=4' },
    { id: 5, name: '정수진', avatar: 'https://i.pravatar.cc/40?img=5' },
  ]);

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>참여자</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {contacts.map((contact) => (
          <Chip
            key={contact.id}
            label={contact.name}
            avatar={
              <img
                src={contact.avatar}
                alt={contact.name}
                style={{ width: '24px', height: '24px', borderRadius: '50%' }}
              />
            }
            onDelete={() =>
              setContacts((prev) => prev.filter((c) => c.id !== contact.id))
            }
            color="primary"
          />
        ))}
      </div>
    </div>
  );
};

// 사용 예시: 연락처 칩
export const ContactChips: Story = {
  render: () => <ContactChipsComponent />,
};

// Interactive Playground
export const Interactive: Story = {
  args: {
    label: '인터랙티브 칩',
    size: 'md',
    variant: 'filled',
    color: 'primary',
    selected: false,
    disabled: false,
  },
};
