import { style, globalStyle } from '@vanilla-extract/css';

export const container = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '3rem 2rem',
  '@media': {
    '(max-width: 768px)': {
      padding: '2rem 1rem',
    },
  },
});

export const header = style({
  textAlign: 'left',
  marginBottom: '3rem',
});

export const title = style({
  fontSize: '2.5rem',
  fontWeight: 700,
  marginBottom: '1rem',
  color: '#2563eb',
  letterSpacing: '-0.02em',
});

export const description = style({
  fontSize: '1.125rem',
  color: '#6b7280',
  lineHeight: 1.6,
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '1rem',
  marginBottom: '4rem',
});

export const statCard = style({
  background: '#ffffff',
  padding: '2rem 1.5rem',
  borderRadius: '1rem',
  textAlign: 'center',
  border: '1px solid #e5e7eb',
});

export const statNumber = style({
  fontSize: '2.5rem',
  fontWeight: 800,
  color: '#2563eb',
  marginBottom: '0.5rem',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
});

export const statLabel = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

export const categorySection = style({
  marginBottom: '4rem',
});

export const categoryHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem',
});

export const categoryTitle = style({
  fontSize: '1.8rem',
  fontWeight: 600,
  color: '#111827',
});

export const categoryBadgeCustom = style({
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
});

export const componentsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.25rem',
  '@media': {
    '(max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const componentIcon = style({
  marginBottom: '1rem',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  transformOrigin: 'top left',
  transform: 'translateY(0) translateX(0) scale(1)',
  willChange: 'transform',
  backfaceVisibility: 'hidden',
});

export const componentName = style({
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '0.5rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform, color',
  // backfaceVisibility: 'hidden',
  transform: 'translateX(0)',
});

export const componentDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: 1.6,
  marginBottom: '1rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform',
  // backfaceVisibility: 'hidden',
  WebkitFontSmoothing: 'antialiased',
  transform: 'translateX(0)',
});

export const componentArrow = style({
  color: '#6b7280',
  opacity: 0,
  transform: 'translateX(-10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
});

export const componentCardCustom = style({
  height: '100%',
});

// Card 호버 시 자식 요소 애니메이션
globalStyle(`${componentCardCustom}:hover ${componentIcon}`, {
  transform: 'translateY(-4px) translateX(1px) scale(1.11)',
});

globalStyle(`${componentCardCustom}:hover ${componentName}`, {
  color: '#2563eb',
  transform: 'translateX(2px)',
});

globalStyle(`${componentCardCustom}:hover ${componentDescription}`, {
  color: '#4b5563',
  transform: 'translateX(2px)',
});

globalStyle(`${componentCardCustom}:hover ${componentArrow}`, {
  opacity: 1,
  transform: 'translateX(0)',
});

export const ctaCardCustom = style({
  height: '100%',
});

export const ctaSectionDivider = style({
  marginTop: '5rem',
});

export const ctaSection = style({
  paddingTop: '3rem',
});

export const ctaTitle = style({
  fontSize: '2rem',
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: '2rem',
  color: '#111827',
});

export const ctaGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
});

export const ctaIcon = style({
  fontSize: '3rem',
  marginBottom: '1rem',
});

export const ctaCardTitle = style({
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '0.5rem',
});

export const ctaCardDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: 1.6,
});
