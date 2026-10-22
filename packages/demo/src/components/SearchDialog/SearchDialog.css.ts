import { themeContract } from '@taein-ui/core';
import { style, globalStyle } from '@vanilla-extract/css';

const { color, palette } = themeContract;

// 검색 모달 안에서 입력 아래에 이어 붙는다(떠 있는 드롭다운이 아니다)
export const dropdown = style({
  marginTop: '0.75rem',
  backgroundColor: color.background.default,
  borderRadius: '10px',
  border: `1px solid ${color.border.default}`,
  overflow: 'hidden',
});

export const resultsList = style({
  maxHeight: '400px',
  overflowY: 'auto',
  padding: '0.375rem',
  scrollbarWidth: 'thin',
  scrollbarColor: `${palette.gray[400]} transparent`,
});

globalStyle(`${resultsList}::-webkit-scrollbar`, {
  width: '5px',
});

globalStyle(`${resultsList}::-webkit-scrollbar-track`, {
  backgroundColor: 'transparent',
});

globalStyle(`${resultsList}::-webkit-scrollbar-thumb`, {
  backgroundColor: palette.gray[400],
  borderRadius: '3px',
});

export const categoryGroup = style({
  selectors: {
    '& + &': {
      marginTop: '0.25rem',
      paddingTop: '0.25rem',
      borderTop: `1px solid ${color.surface.hover}`,
    },
  },
});

export const categoryLabel = style({
  padding: '0.375rem 0.625rem',
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: color.text.secondary,
});

export const resultItem = style({
  display: 'block',
  width: '100%',
  padding: '0.5rem 0.625rem',
  textAlign: 'left',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background-color 0.1s',
  ':hover': {
    backgroundColor: color.surface.hover,
  },
});

export const resultItemSelected = style({
  backgroundColor: palette.primary[50],
  selectors: {
    '&:hover': {
      backgroundColor: palette.primary[50],
    },
  },
});

export const resultHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.125rem',
});

export const resultTitle = style({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: color.primary.dark,
  lineHeight: 1.4,
});

export const resultDescription = style({
  fontSize: '0.8125rem',
  color: palette.gray[700],
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const sectionsList = style({
  marginTop: '0.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
});

export const sectionItem = style({
  fontSize: '0.75rem',
  color: palette.gray[700],
  lineHeight: 1.5,
  padding: '0.0625rem 0',
});

export const sectionTitle = style({
  fontWeight: 600,
  color: color.primary.dark,
});

export const highlight = style({
  backgroundColor: palette.warning[100],
  color: color.text.primary,
  fontWeight: 600,
  borderRadius: '2px',
  padding: '0 1px',
});

export const emptyState = style({
  padding: '2rem 1rem',
  textAlign: 'center',
  color: color.text.secondary,
  fontSize: '0.875rem',
});

export const emptyStateQuery = style({
  fontWeight: 600,
  color: color.text.primary,
});
