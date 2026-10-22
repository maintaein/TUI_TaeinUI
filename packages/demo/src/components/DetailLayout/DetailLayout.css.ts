import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';
import { FRAME } from '../DocText';

const { spacing, borderRadius } = themeContract;

const MOBILE = '(max-width: 640px)';

// 회색 캔버스: 이름과 리드 아래에 무대가 앉는다
export const canvas = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  padding: spacing[2],
  background: FRAME,
  borderRadius: '28px',
  '@media': {
    [MOBILE]: { padding: spacing[1], borderRadius: borderRadius.xl },
  },
});

export const canvasHead = style({
  display: 'grid',
  gap: spacing[3],
  padding: `${spacing[5]} ${spacing[5]} ${spacing[4]}`,
  '@media': {
    [MOBILE]: {
      gap: spacing[2],
      padding: `${spacing[4]} ${spacing[3]} ${spacing[3]}`,
    },
  },
});

// 좁은 화면에서 가장 긴 이름(SegmentedButtons)도 한 줄에 들어가는 크기
export const name = style({ fontSize: 'clamp(1.75rem, 9vw, 4.5rem)' });
export const leadMax = style({
  maxWidth: '34em',
  '@media': { [MOBILE]: { fontSize: '1.0625rem' } },
});

// 무대가 이 높이를 채운다
export const canvasStage = style({
  display: 'grid',
  height: 'calc(100vh - 88px - 96px)',
  minHeight: '440px',
  maxHeight: '620px',
  '@media': { [MOBILE]: { height: '56vh', minHeight: '320px' } },
});

export const docCol = style({
  maxWidth: '880px',
  margin: `${spacing[16]} auto 0`,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[20],
  '@media': {
    [MOBILE]: { margin: `${spacing[12]} auto 0`, gap: spacing[16] },
  },
});

export const section = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[5],
});

export const sectionLead = style({ marginTop: `-${spacing[2]}` });

export const play = style({
  display: 'grid',
  gridTemplateColumns: '320px minmax(0, 1fr)',
  gap: spacing[8],
  alignItems: 'start',
  '@media': {
    '(max-width: 760px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: spacing[6],
    },
  },
});

// 코드 블록의 아래 여백(다른 페이지용)을 지워 격자 간격만 남긴다
export const flush = style({
  selectors: { '&&': { marginBottom: 0 } },
});

// 사용법의 소주제들
export const topics = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: spacing[8],
});

export const topicTitle = style({ marginBottom: spacing[2] });
