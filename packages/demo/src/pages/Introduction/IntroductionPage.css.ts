import { themeContract } from '@taein-ui/core';
import { globalStyle, style } from '@vanilla-extract/css';
import { FRAME, INK, MONO, MUTED } from '../../components/DocText';

const { spacing, borderRadius } = themeContract;

const MOBILE = '(max-width: 640px)';

export const hero = style({
  display: 'grid',
  justifyItems: 'center',
  gap: spacing[6],
  padding: `${spacing[16]} ${spacing[6]} ${spacing[12]}`,
  textAlign: 'center',
  '@media': {
    [MOBILE]: {
      gap: spacing[4],
      padding: `${spacing[8]} ${spacing[4]} ${spacing[8]}`,
    },
  },
});

export const logo = style({
  height: '72px',
  width: 'auto',
  '@media': { [MOBILE]: { height: '56px' } },
});

export const title = style({ fontSize: 'clamp(3.25rem, 15vw, 11rem)' });

export const desc = style({
  maxWidth: '760px',
  textWrap: 'balance',
  '@media': { [MOBILE]: { fontSize: '1.0625rem' } },
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  gap: spacing[2],
  '@media': {
    // 좁은 화면: 설치 줄은 한 줄을 다 쓰고, 버튼 둘은 반씩 나눈다
    [MOBILE]: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      width: '100%',
    },
  },
});

globalStyle(`${actions} > :first-child`, {
  '@media': {
    [MOBILE]: { gridColumn: '1 / -1', justifyContent: 'space-between' },
  },
});

export const install = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[2],
  height: '48px',
  padding: `0 ${spacing[2]} 0 ${spacing[4]}`,
  background: FRAME,
  borderRadius: borderRadius.md,
  fontFamily: MONO,
  fontSize: '0.8125rem',
  color: INK,
  whiteSpace: 'nowrap',
});

export const installDim = style({ color: MUTED });

export const wide = style({ maxWidth: '1200px', margin: '0 auto' });

// 쇼케이스의 흰 무대가 회색 액자를 가장자리까지 채운다(쇼케이스는 제 폭을 44rem으로 두므로 풀어 준다)
export const fill = style({ width: '100%' });
globalStyle(`${fill} > section`, { maxWidth: 'none' });
// 장면 이름은 무대 밖, 회색 액자 위에 놓인다. 기본 보조 글자색(4.48:1)은 AA에 못 미쳐 한 단계 어둡게 둔다
globalStyle(`${fill} > section > div:last-child > p`, { color: MUTED });

export const more = style({
  display: 'flex',
  justifyContent: 'center',
  marginTop: spacing[8],
});

export const moreLink = style({
  fontSize: '0.875rem',
  color: MUTED,
  selectors: { '&:hover': { color: INK } },
});
