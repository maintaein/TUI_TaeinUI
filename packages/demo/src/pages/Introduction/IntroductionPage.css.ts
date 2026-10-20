import { themeContract } from '@taein-ui/core';
import { globalStyle, style } from '@vanilla-extract/css';

const { color, spacing, font } = themeContract;

export const container = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 2rem 2rem',
  '@media': {
    '(max-width: 768px)': {
      padding: '0 1rem 1rem',
    },
  },
});

// 로고 이미지와 "Taein UI" 글자를 한 h1에 세로로 쌓는다.
export const logo = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: 0,
});

export const logoText = style({
  marginTop: spacing[1],
  fontSize: font.size.xl,
  fontWeight: font.weight.semibold,
  color: color.text.secondary,
  '@media': {
    '(max-width: 768px)': {
      fontSize: font.size.base,
    },
  },
});

// "Taein UI"와 쇼케이스 사이 여백.
export const showcaseSlot = style({
  marginTop: spacing[8],
});

// 쇼케이스 root가 아래 여백 4rem을 스스로 갖는다. 이 페이지에서는 캡션과 소개글을 가깝게 붙이려고 0으로 덮는다.
globalStyle(`${showcaseSlot} > section`, {
  marginBottom: 0,
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
  margin: `${spacing[2]} auto 0`,
});

export const heroDescription = style({
  fontSize: '1.25rem',
  lineHeight: 1.8,
  color: '#4b5563',
  marginBottom: spacing[4],
  wordBreak: 'keep-all',
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
