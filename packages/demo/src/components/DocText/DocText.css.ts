import { themeContract } from '@taein-ui/core';
import { globalStyle, style } from '@vanilla-extract/css';

const { color, palette, spacing, borderRadius } = themeContract;

export const INK = color.text.primary;
// text.secondary(#717171)는 회색 액자(#F5F5F5) 위에서 4.48:1이라 AA에 못 미친다. 한 단계 어둡게 둔다(5.9:1)
export const MUTED = palette.gray[700];
export const FRAME = color.surface.hover;
export const LINE = color.border.default;
export const BLUE = color.primary.main;

// 코드 안 한글이 굴림 같은 대체 글꼴로 떨어지지 않게 고정폭 뒤에 Pretendard를 둔다
export const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Pretendard Variable", monospace';

// 한 줄 40자 안팎(17px 기준 약 680px)
const PROSE = '40em';

// 한글 레이블. 고정폭·대문자를 쓰지 않는다(한글이 성기게 벌어진다)
export const label = style({
  fontSize: '0.8125rem',
  fontWeight: 600,
  lineHeight: 1.4,
  color: MUTED,
  fontVariantNumeric: 'tabular-nums',
});

// 숫자·코드 이름만 고정폭
export const num = style({
  fontFamily: MONO,
  fontSize: '0.75rem',
  color: MUTED,
});

export const display = style({
  fontWeight: 900,
  letterSpacing: '-0.045em',
  lineHeight: 0.86,
  color: INK,
  wordBreak: 'keep-all',
  textWrap: 'balance',
});

export const h2 = style({
  fontSize: '1.5rem',
  fontWeight: 700,
  lineHeight: 1.35,
  letterSpacing: '-0.02em',
  color: INK,
  wordBreak: 'keep-all',
  textWrap: 'balance',
});

export const h3 = style({
  fontSize: '1.125rem',
  fontWeight: 700,
  lineHeight: 1.4,
  color: INK,
  wordBreak: 'keep-all',
  textWrap: 'balance',
});

export const lead = style({
  fontSize: '1.1875rem',
  lineHeight: 1.75,
  color: INK,
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
  textWrap: 'pretty',
});

export const body = style({
  maxWidth: PROSE,
  fontSize: '1.0625rem',
  lineHeight: 1.8,
  color: INK,
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
  textWrap: 'pretty',
});

export const muted = style({ color: MUTED });

export const list = style({
  display: 'grid',
  gap: spacing[3],
  paddingLeft: '1.25em',
});

globalStyle(`${body} code, ${lead} code`, {
  // 여백이 조사를 밀어내지 않게 작게 둔다("variant로"가 "variant 로"처럼 떨어져 보이지 않게)
  padding: '0.08em 0.22em',
  borderRadius: borderRadius.sm,
  background: FRAME,
  fontFamily: MONO,
  fontSize: '0.88em',
});
