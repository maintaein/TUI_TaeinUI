import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '@taein-ui/core';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'rect', 'circle', 'rounded'],
      description: 'Skeleton variant',
    },
    animation: {
      control: 'select',
      options: ['wave', 'pulse', false],
      description: 'Animation type',
    },
    width: {
      control: 'text',
      description: 'Width (number or string)',
    },
    height: {
      control: 'text',
      description: 'Height (number or string)',
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '300px',
      }}
    >
      <div>
        <p
          style={{
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Text
        </p>
        <Skeleton variant="text" />
      </div>
      <div>
        <p
          style={{
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Rectangle
        </p>
        <Skeleton variant="rect" height={100} />
      </div>
      <div>
        <p
          style={{
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Circle
        </p>
        <Skeleton variant="circle" width={60} />
      </div>
      <div>
        <p
          style={{
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Rounded
        </p>
        <Skeleton variant="rounded" height={100} />
      </div>
    </div>
  ),
};

export const Animations: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        width: '300px',
      }}
    >
      <div>
        <h3
          style={{
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Wave Animation
        </h3>
        <Skeleton animation="wave" variant="rect" height={80} />
      </div>
      <div>
        <h3
          style={{
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Pulse Animation
        </h3>
        <Skeleton animation="pulse" variant="rect" height={80} />
      </div>
      <div>
        <h3
          style={{
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          No Animation
        </h3>
        <Skeleton animation={false} variant="rect" height={80} />
      </div>
    </div>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start',
        padding: '1rem',
      }}
    >
      <Skeleton variant="circle" width={48} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  ),
};

export const ArticleCard: Story = {
  render: () => (
    <div
      style={{
        width: '300px',
        border: '1px solid #E0E0E0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <Skeleton variant="rect" height={200} />
      <div style={{ padding: '1rem' }}>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <Skeleton variant="circle" width={24} />
          <Skeleton variant="text" width="30%" />
        </div>
      </div>
    </div>
  ),
};

export const BlogPost: Story = {
  render: () => (
    <div style={{ width: '600px', padding: '2rem' }}>
      <Skeleton variant="text" width="70%" height={40} />
      <div
        style={{
          marginTop: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <Skeleton variant="circle" width={40} />
        <div style={{ flex: 1 }}>
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="20%" />
        </div>
      </div>
      <Skeleton variant="rect" height={300} />
      <div style={{ marginTop: '2rem' }}>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="60%" />
      </div>
    </div>
  ),
};

export const ProductList: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        width: '600px',
      }}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          style={{
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <Skeleton variant="rect" height={150} />
          <div style={{ padding: '0.75rem' }}>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="50%" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const CommentList: Story = {
  render: () => (
    <div style={{ width: '500px' }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}
        >
          <Skeleton variant="circle" width={40} />
          <div style={{ flex: 1 }}>
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="90%" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Table: Story = {
  render: () => (
    <div style={{ width: '700px' }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          style={{
            display: 'grid',
            gridTemplateColumns: '50px 1fr 1fr 100px',
            gap: '1rem',
            padding: '1rem',
            borderBottom: '1px solid #E0E0E0',
            alignItems: 'center',
          }}
        >
          <Skeleton variant="circle" width={40} />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="60%" />
        </div>
      ))}
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div style={{ width: '800px', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Skeleton variant="text" width="40%" height={32} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            style={{
              padding: '1rem',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
            }}
          >
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="70%" height={36} />
          </div>
        ))}
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}
      >
        <Skeleton variant="rect" height={300} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
              }}
            >
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const CustomSizes: Story = {
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
        <h3
          style={{
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Custom Width & Height
        </h3>
        <Skeleton variant="rect" width={400} height={150} />
      </div>
      <div>
        <h3
          style={{
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Percentage Width
        </h3>
        <Skeleton variant="rect" width="75%" height={100} />
      </div>
      <div>
        <h3
          style={{
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Rem Units
        </h3>
        <Skeleton variant="rect" width="20rem" height="8rem" />
      </div>
    </div>
  ),
};

/** 스켈레톤은 장식(`aria-hidden`)이다. 로딩 알림은 감싸는 영역이 맡는다. */
export const LoadingRegion: Story = {
  render: () => (
    <section
      aria-busy="true"
      aria-label="프로필 로딩 중"
      style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
    >
      <Skeleton variant="circle" width={48} />
      <div style={{ width: '200px' }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </section>
  ),
};

export const Playground: Story = {
  args: {
    variant: 'text',
    animation: 'wave',
    width: undefined,
    height: undefined,
  },
};
