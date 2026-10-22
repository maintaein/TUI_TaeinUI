import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

export const container = style({
  width: '100%',
  borderRadius: '0.5rem',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 1rem',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
});

export const label = style({
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

export const copyButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.375rem 0.75rem',
  backgroundColor: 'transparent',
  border: `1px solid ${themeContract.color.border.default}`,
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#374151',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    backgroundColor: '#f3f4f6',
    borderColor: '#9ca3af',
  },
  ':active': {
    transform: 'scale(0.98)',
  },
});

export const copyText = style({
  '@media': {
    '(max-width: 480px)': {
      display: 'none',
    },
  },
});

export const editorContainer = style({
  overflow: 'auto',
  maxHeight: '500px',
});

export const editor = style({
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: '0.875rem',
  lineHeight: '1.5',
  minHeight: '60px',
});
