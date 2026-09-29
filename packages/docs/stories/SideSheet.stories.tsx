import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SideSheet } from '@taein-ui/core';

const meta: Meta<typeof SideSheet> = {
  title: 'Components/SideSheet',
  component: SideSheet,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'SideSheet 표시 여부',
    },
    width: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'full'],
      description: 'SideSheet 너비',
    },
    position: {
      control: 'select',
      options: ['left', 'right'],
      description: 'SideSheet 위치',
    },
    title: {
      control: 'text',
      description: 'SideSheet 제목',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description: 'Backdrop 클릭 시 닫기',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'ESC 키로 닫기',
    },
    showClose: {
      control: 'boolean',
      description: '닫기 버튼 표시',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SideSheet>;

const SideSheetWrapper = (
  args: typeof SideSheet extends (props: infer P) => unknown ? P : never
) => {
  const [open, setOpen] = useState(args.open ?? false);

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        style={{ padding: '8px 16px', cursor: 'pointer' }}
      >
        Open SideSheet
      </button>
      <SideSheet {...args} open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <SideSheetWrapper {...args} />,
  args: {
    title: 'SideSheet Title',
    children: (
      <div>
        <p>This is a SideSheet component.</p>
        <p>It slides in from the right side of the screen.</p>
      </div>
    ),
  },
};

const WidthsComponents = () => {
  const [openSm, setOpenSm] = useState(false);
  const [openMd, setOpenMd] = useState(false);
  const [openLg, setOpenLg] = useState(false);
  const [openFull, setOpenFull] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button onClick={() => setOpenSm(true)} style={{ padding: '8px 16px' }}>
        Small (300px)
      </button>
      <button onClick={() => setOpenMd(true)} style={{ padding: '8px 16px' }}>
        Medium (400px)
      </button>
      <button onClick={() => setOpenLg(true)} style={{ padding: '8px 16px' }}>
        Large (600px)
      </button>
      <button onClick={() => setOpenFull(true)} style={{ padding: '8px 16px' }}>
        Full Width
      </button>

      <SideSheet
        open={openSm}
        onClose={() => setOpenSm(false)}
        width="sm"
        title="Small SideSheet"
      >
        <p>Width: 300px</p>
      </SideSheet>
      <SideSheet
        open={openMd}
        onClose={() => setOpenMd(false)}
        width="md"
        title="Medium SideSheet"
      >
        <p>Width: 400px (default)</p>
      </SideSheet>
      <SideSheet
        open={openLg}
        onClose={() => setOpenLg(false)}
        width="lg"
        title="Large SideSheet"
      >
        <p>Width: 600px</p>
      </SideSheet>
      <SideSheet
        open={openFull}
        onClose={() => setOpenFull(false)}
        width="full"
        title="Full Width SideSheet"
      >
        <p>Width: 100vw</p>
      </SideSheet>
    </div>
  );
};

export const Widths: Story = {
  render: () => <WidthsComponents />,
};

const PositionsComponent = () => {
  const [openRight, setOpenRight] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => setOpenRight(true)}
        style={{ padding: '8px 16px' }}
      >
        Right (Default)
      </button>
      <button onClick={() => setOpenLeft(true)} style={{ padding: '8px 16px' }}>
        Left
      </button>

      <SideSheet
        open={openRight}
        onClose={() => setOpenRight(false)}
        position="right"
        title="Right SideSheet"
      >
        <p>Slides from the right side</p>
      </SideSheet>
      <SideSheet
        open={openLeft}
        onClose={() => setOpenLeft(false)}
        position="left"
        title="Left SideSheet"
      >
        <p>Slides from the left side</p>
      </SideSheet>
    </div>
  );
};

export const Positions: Story = {
  render: () => <PositionsComponent />,
};

export const WithCloseButton: Story = {
  render: (args) => <SideSheetWrapper {...args} />,
  args: {
    title: 'SideSheet with Close Button',
    showClose: true,
    children: <p>This SideSheet has a close button in the header.</p>,
  },
};

export const NoBackdropClose: Story = {
  render: (args) => <SideSheetWrapper {...args} />,
  args: {
    title: 'No Backdrop Close',
    closeOnBackdropClick: false,
    showClose: true,
    children: (
      <p>
        Clicking the backdrop will not close this SideSheet. Use the close
        button or ESC key.
      </p>
    ),
  },
};

export const NoEscapeClose: Story = {
  render: (args) => <SideSheetWrapper {...args} />,
  args: {
    title: 'No ESC Close',
    closeOnEscape: false,
    showClose: true,
    children: (
      <p>
        Pressing ESC will not close this SideSheet. Use the close button or
        backdrop click.
      </p>
    ),
  },
};

export const WithForm: Story = {
  render: (args) => <SideSheetWrapper {...args} />,
  args: {
    title: 'User Settings',
    showClose: true,
    width: 'md',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="name"
            style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <div>
          <label
            htmlFor="bio"
            style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}
          >
            Bio
          </label>
          <textarea
            id="bio"
            placeholder="Tell us about yourself"
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              resize: 'vertical',
            }}
          />
        </div>
        <div
          style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}
        >
          <button style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Save
          </button>
        </div>
      </div>
    ),
  },
};

export const WithNavigation: Story = {
  render: (args) => <SideSheetWrapper {...args} />,
  args: {
    title: 'Navigation Menu',
    width: 'sm',
    position: 'left',
    children: (
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>
              Dashboard
            </a>
          </li>
          <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>
              Projects
            </a>
          </li>
          <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>
              Team
            </a>
          </li>
          <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>
              Settings
            </a>
          </li>
          <li style={{ padding: '12px 0' }}>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>
              Logout
            </a>
          </li>
        </ul>
      </nav>
    ),
  },
};

export const ScrollableContent: Story = {
  render: (args) => <SideSheetWrapper {...args} />,
  args: {
    title: 'Long Content',
    showClose: true,
    children: (
      <div>
        {Array.from({ length: 50 }, (_, i) => (
          <p key={i}>
            This is paragraph {i + 1}. The SideSheet content is scrollable when
            it exceeds the viewport height.
          </p>
        ))}
      </div>
    ),
  },
};

export const FilterPanel: Story = {
  render: (args) => <SideSheetWrapper {...args} />,
  args: {
    title: 'Filters',
    width: 'sm',
    showClose: true,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h3
            style={{
              marginTop: 0,
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Price Range
          </h3>
          <input type="range" min="0" max="1000" style={{ width: '100%' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#666',
            }}
          >
            <span>$0</span>
            <span>$1000</span>
          </div>
        </div>
        <div>
          <h3
            style={{
              marginTop: 0,
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Category
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <input type="checkbox" />
              <span>Electronics</span>
            </label>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <input type="checkbox" />
              <span>Clothing</span>
            </label>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <input type="checkbox" />
              <span>Books</span>
            </label>
          </div>
        </div>
        <div>
          <h3
            style={{
              marginTop: 0,
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Rating
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <label
                key={rating}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <input type="radio" name="rating" />
                <span>
                  {'★'.repeat(rating)}
                  {'☆'.repeat(5 - rating)}
                </span>
              </label>
            ))}
          </div>
        </div>
        <button
          style={{
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Apply Filters
        </button>
      </div>
    ),
  },
};

export const Interactive: Story = {
  render: (args) => <SideSheetWrapper {...args} />,
  args: {
    title: 'Interactive SideSheet',
    width: 'md',
    position: 'right',
    closeOnBackdropClick: true,
    closeOnEscape: true,
    showClose: true,
    children: (
      <div>
        <p>Use the controls below to customize this SideSheet.</p>
        <p>Try different widths, positions, and interaction options.</p>
      </div>
    ),
  },
};
