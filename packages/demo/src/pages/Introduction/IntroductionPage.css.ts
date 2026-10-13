import { themeContract } from '@taein-ui/core';
import { style, globalStyle } from '@vanilla-extract/css';

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

export const hero = style({
  textAlign: 'center',
  padding: '4rem 0 6rem',
  '@media': {
    '(max-width: 768px)': {
      padding: '2rem 0 3rem',
    },
  },
});

export const heroContent = style({
  maxWidth: '800px',
  margin: '0 auto',
});

export const heroTitle = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginBottom: '1.5rem',
});

export const heroTitleMain = style({
  // Text(h1)가 주던 줄 높이. Text를 걷은 뒤에도 같은 모습(M5 7차)
  lineHeight: 1.2,
  fontSize: '4rem',
  fontWeight: 800,
  color: '#2563eb',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '3rem',
    },
  },
});

export const heroTitleSub = style({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#6b7280',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '1.25rem',
    },
  },
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

export const section = style({
  marginBottom: '6rem',
  '@media': {
    '(max-width: 768px)': {
      marginBottom: '4rem',
    },
  },
});

export const sectionTitle = style({
  // Text(h2)가 주던 위쪽 여백 0과 줄 높이. Text를 걷은 뒤에도 같은 모습(M5 7차)
  marginTop: 0,
  lineHeight: 1.3,
  fontSize: '2.25rem',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '1rem',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '1.75rem',
    },
  },
});

export const sectionDescription = style({
  fontSize: '1.125rem',
  color: '#6b7280',
  marginBottom: '2rem',
  lineHeight: 1.6,
});

export const goalList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  marginTop: '2rem',
});

export const goalRow = style({
  display: 'flex',
  gap: '1.5rem',
  padding: '2rem 0',
  borderBottom: '1px solid #e5e7eb',
  selectors: {
    '&:first-child': {
      paddingTop: '0',
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  '@media': {
    '(max-width: 768px)': {
      gap: '1rem',
      padding: '1.5rem 0',
    },
  },
});

export const goalIcon = style({
  flexShrink: 0,
  color: themeContract.color.primary.main,
  backgroundColor: themeContract.palette.primary[50],
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '2px',
  '@media': {
    '(max-width: 768px)': {
      width: '40px',
      height: '40px',
    },
  },
});

export const goalContent = style({
  flex: 1,
  minWidth: 0,
});

export const goalTitle = style({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '0.375rem',
});

export const goalDescription = style({
  fontSize: '1rem',
  color: '#4b5563',
  lineHeight: 1.6,
  marginBottom: '0.75rem',
});

export const goalDetails = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
  paddingLeft: '0',
  listStyle: 'none',
  margin: 0,
});

export const goalDetailItem = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.5rem',
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: 1.5,
  selectors: {
    '&::before': {
      content: '"\\2022"',
      color: '#d1d5db',
      fontSize: '0.75rem',
      flexShrink: 0,
    },
  },
});

export const preview = style({
  marginTop: '2rem',
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '2rem',
  marginTop: '2rem',
});

export const statCard = style({
  textAlign: 'center',
  padding: '2rem',
  backgroundColor: '#eff6ff',
  borderRadius: '1rem',
});

export const statNumber = style({
  fontSize: '3rem',
  fontWeight: 800,
  color: '#2563eb',
  marginBottom: '0.5rem',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '2.5rem',
    },
  },
});

export const statLabel = style({
  fontSize: '1rem',
  fontWeight: 500,
  color: '#1e40af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

export const nextStepsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
  marginTop: '2rem',
});

export const nextStepIcon = style({
  color: themeContract.color.primary.main,
  marginBottom: '0.75rem',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  transformOrigin: 'top left',
  transform: 'translateY(0) translateX(0) scale(1)',
  willChange: 'transform',
  backfaceVisibility: 'hidden',
});

export const nextStepCard = style({
  height: '100%',
});

export const nextStepTitle = style({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '0.5rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform, color',
  transform: 'translateX(0)',
});

export const nextStepDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: 1.5,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform',
  WebkitFontSmoothing: 'antialiased',
  transform: 'translateX(0)',
});

export const nextStepArrow = style({
  fontSize: '1.5rem',
  color: '#6b7280',
  opacity: 0,
  transform: 'translateX(-10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
});

// Card 호버 시 자식 요소 애니메이션
globalStyle(`${nextStepCard}:hover ${nextStepIcon}`, {
  transform: 'translateY(-4px) translateX(1px) scale(1.11)',
});

globalStyle(`${nextStepCard}:hover ${nextStepTitle}`, {
  color: '#2563eb',
  transform: 'translateX(2px)',
});

globalStyle(`${nextStepCard}:hover ${nextStepDescription}`, {
  color: '#4b5563',
  transform: 'translateX(2px)',
});

globalStyle(`${nextStepCard}:hover ${nextStepArrow}`, {
  opacity: 1,
  transform: 'translateX(0)',
});
