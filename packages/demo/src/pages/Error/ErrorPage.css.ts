import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';
import { FRAME } from '../../components/DocText';

const { spacing, borderRadius } = themeContract;

const MOBILE = '(max-width: 640px)';

// errorElement는 공통 틀 밖에서도 그려지므로 줄바꿈과 바깥 여백을 스스로 갖는다
export const container = style({
  padding: `${spacing[6]} ${spacing[4]}`,
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
});

export const frame = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  alignContent: 'center',
  justifyItems: 'start',
  gap: spacing[6],
  maxWidth: '1100px',
  minHeight: 'min(560px, 70vh)',
  margin: '0 auto',
  padding: `${spacing[12]} ${spacing[10]}`,
  background: FRAME,
  borderRadius: borderRadius.xl,
  '@media': { [MOBILE]: { padding: `${spacing[10]} ${spacing[6]}` } },
});

export const title = style({ fontSize: 'clamp(5rem, 22vw, 11rem)' });

export const message = style({ maxWidth: '28em' });

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[3],
});
