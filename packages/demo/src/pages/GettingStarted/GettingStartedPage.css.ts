import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';
import { BLUE } from '../../components/DocText';

const { spacing } = themeContract;

const MOBILE = '(max-width: 640px)';

export const page = style({
  maxWidth: '760px',
  margin: `${spacing[12]} auto 0`,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[16],
  '@media': { [MOBILE]: { marginTop: spacing[6] } },
});

export const block = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[5],
});

export const title = style({ fontSize: 'clamp(2.5rem, 9vw, 4rem)' });
export const leadMax = style({ maxWidth: '36em' });

export const manager = style({ width: '220px', maxWidth: '100%' });

// 코드 블록의 아래 여백(다른 페이지용)을 지워 격자 간격만 남긴다
export const flush = style({ selectors: { '&&': { marginBottom: 0 } } });

export const result = style({ minHeight: '140px' });

// 전역 a 규칙이 색과 밑줄을 지우므로 본문 안 링크는 따로 보이게 한다
export const link = style({
  color: BLUE,
  textDecoration: 'underline',
  textUnderlineOffset: '0.2em',
});
