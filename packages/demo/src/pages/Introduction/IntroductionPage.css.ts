import { style } from '@vanilla-extract/css';

export const container = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem',
  '@media': {
    '(max-width: 768px)': {
      padding: '1rem',
    },
  },
});

export const logo = style({
  display: 'flex',
  justifyContent: 'center',
  margin: '1.5rem 0 0.5rem',
  '@media': {
    '(max-width: 768px)': {
      margin: '1rem 0 0.5rem',
    },
  },
});

export const logoImage = style({
  height: '96px',
  width: 'auto',
  '@media': {
    '(max-width: 768px)': {
      height: '72px',
    },
  },
});

export const intro = style({
  textAlign: 'center',
  maxWidth: '800px',
  margin: '0 auto',
});

export const heroDescription = style({
  fontSize: '1.25rem',
  lineHeight: 1.8,
  color: '#4b5563',
  marginBottom: '2rem',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '1rem',
    },
  },
});

export const heroActions = style({
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  '@media': {
    '(max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
    },
  },
});
