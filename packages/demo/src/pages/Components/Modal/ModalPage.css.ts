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
  marginBottom: '4rem',
  paddingBottom: '3rem',
  borderBottom: '1px solid #e5e7eb',
});

export const title = style({
  fontSize: '2.5rem',
  fontWeight: 700,
  color: '#1a2332',
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  marginBottom: '1rem',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '2rem',
    },
  },
});

export const description = style({
  fontSize: '1.125rem',
  lineHeight: 1.7,
  color: '#6b7280',
  maxWidth: '800px',
});

export const quickReference = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
  marginBottom: '6rem',
  '@media': {
    '(max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const quickRefCard = style({
  transition: 'all 0.2s ease',
  ':hover': {
    borderColor: '#f59e0b',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
});

export const quickRefTitle = style({
  fontSize: '1rem',
  fontWeight: 600,
  color: '#1a2332',
  marginBottom: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

export const section = style({
  marginBottom: '6rem',
});

export const sectionHeader = style({
  marginBottom: '3rem',
  paddingLeft: '1rem',
  borderLeft: '4px solid #f59e0b',
});

export const sectionTitle = style({
  fontSize: '2rem',
  fontWeight: 600,
  color: '#1a2332',
  marginBottom: '0.5rem',
  letterSpacing: '-0.01em',
});

export const sectionDescription = style({
  fontSize: '1rem',
  lineHeight: 1.6,
  color: '#6b7280',
});

export const example = style({
  marginBottom: '3rem',
});

export const exampleTitle = style({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#1a2332',
  marginBottom: '1rem',
});

export const propsTableWrapper = style({
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.75rem',
  padding: '1.5rem',
  overflow: 'auto',
});

export const practicesGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '2rem',
  '@media': {
    '(max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const practiceHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '1.5rem',
});

export const practiceIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#059669',
  backgroundColor: '#d1fae5',
  borderRadius: '0.5rem',
});

export const practiceIconError = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#dc2626',
  backgroundColor: '#fee2e2',
  borderRadius: '0.5rem',
});

export const practiceTitle = style({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#1a2332',
});

export const practiceList = style({
  marginTop: '1.5rem',
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: '#475569',
});

export const guidelineList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  marginTop: '1.5rem',
  backgroundColor: '#ffffff',
  borderRadius: '0.75rem',
  overflow: 'hidden',
});

export const guidelineRow = style({
  display: 'grid',
  gridTemplateColumns: '200px 1fr',
  gap: '1.5rem',
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid #e5e7eb',
  ':last-child': {
    borderBottom: 'none',
  },
  '@media': {
    '(max-width: 640px)': {
      gridTemplateColumns: '1fr',
      gap: '0.5rem',
    },
  },
});

export const guidelineTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#111827',
});

export const guidelineText = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: 1.6,
});

/* 패턴 비교 테이블: PropsTable과 동일한 구조 사용 */
export const patternCompareTable = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
});

export const patternCompareTableWrapper = style({
  width: '100%',
  overflowX: 'auto',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  marginTop: '1.5rem',
});

export const patternCompareHead = style({
  backgroundColor: '#f9fafb',
});

export const patternCompareTh = style({
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '2px solid #e5e7eb',
});

export const patternCompareTr = style({
  borderBottom: '1px solid #e5e7eb',
  transition: 'background-color 0.2s',
  ':hover': {
    backgroundColor: '#f9fafb',
  },
  ':last-child': {
    borderBottom: 'none',
  },
});

export const patternCompareTd = style({
  padding: '0.75rem 1rem',
  verticalAlign: 'top',
  color: '#374151',
  lineHeight: 1.6,
});

export const patternCompareTdLabel = style({
  padding: '0.75rem 1rem',
  verticalAlign: 'top',
  fontWeight: 600,
  color: '#111827',
  lineHeight: 1.6,
});

/* 패턴 비교 섹션 내부 2컬럼 그리드 */
export const patternCompareGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1.5rem',
  marginTop: '1.5rem',
  '@media': {
    '(max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const patternCard = style({
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.75rem',
  padding: '1.5rem',
});

export const patternCardTitle = style({
  fontSize: '1rem',
  fontWeight: 700,
  color: '#1a2332',
  marginBottom: '0.5rem',
});

export const patternCardDesc = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: 1.6,
  marginBottom: '1rem',
});

export const patternCardWhen = style({
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '0.375rem',
});

export const patternCardList = style({
  margin: '0 0 0 1.25rem',
  padding: 0,
  fontSize: '0.8125rem',
  color: '#6b7280',
  lineHeight: 1.7,
});

globalStyle(`${guidelineText} code`, {
  padding: '0.125rem 0.375rem',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '0.25rem',
  color: '#dc2626',
});
