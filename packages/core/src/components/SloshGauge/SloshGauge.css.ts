import { style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const { color, font, spacing, borderRadius } = themeContract;

// 기본 폭 7.5rem(120px). 통 높이가 192px이 되어 8%(15px)의 출렁임이 또렷하고 카드 한 칸에 들어가는 크기다. 폭은 부모(className)가 정한다.
// 통은 폭에서 높이를 비율로 얻는다.
export const root = style({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[2],
  width: `calc(${spacing[20]} * 1.5)`,
});

// 세로로 긴 둥근 통(가로 1 : 세로 1.6). 테두리는 primary이고 물을 둥근 모서리로 자른다.
export const tank = style({
  boxSizing: 'border-box',
  width: '100%',
  aspectRatio: '1 / 1.6',
  overflow: 'hidden',
  border: `2px solid ${color.primary.main}`,
  borderRadius: borderRadius.xl,
  backgroundColor: color.background.default,
});

export const water = style({
  display: 'block',
  width: '100%',
  height: '100%',
  // 채움(primary 80%)은 흰 바탕에서 3.4:1이라 비텍스트 대비 3:1을 넘는다. 옅기가 이보다 더하면 3:1 아래다.
  fill: color.primary.main,
  fillOpacity: 0.8,
});

// 이름표. Slider 같은 폼 계열의 label 글자 스타일이다.
export const label = style({
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  fontWeight: font.weight.medium,
  color: color.text.primary,
  textAlign: 'center',
  wordBreak: 'keep-all',
});

export const value = style({
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  fontWeight: font.weight.semibold,
  color: color.primary.dark,
  textAlign: 'center',
  wordBreak: 'keep-all',
  // 숫자 글자 폭이 값마다 달라 줄이 흔들리지 않게 한다
  fontVariantNumeric: 'tabular-nums',
});
