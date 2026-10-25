import { keyframes, style } from '@vanilla-extract/css';
import { themeContract } from '../tokens/theme.css';

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeContract.spacing[1],
  width: 'fit-content',
});

export const fullWidth = style({
  width: '100%',
});

export const label = style({
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.primary,
  lineHeight: 1.5,
});

export const required = style({
  color: themeContract.color.error.main,
  marginLeft: themeContract.spacing[1],
});

export const helperText = style({
  fontSize: themeContract.font.size.xs,
  color: themeContract.color.text.secondary,
  lineHeight: 1.5,
});

// 메시지가 나타날 때 4px 위에서 내려온다(모션 UI M46 shake-error의 문구). 한 번 나타나는
// 전이라 되돌아갈 상태가 없는 마운트 모션이고, fill-mode를 두지 않아 축소 모션(0.01ms)에서도
// 본래 모습(보임)으로 끝난다. 4px는 토큰 스케일에 없는 거리다.
const settleIn = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-4px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

const messageEnter = `${settleIn} ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`;

export const errorMessage = style({
  fontSize: themeContract.font.size.xs,
  color: themeContract.color.error.main,
  lineHeight: 1.5,
  animation: messageEnter,
});

// success.main은 흰 바탕 대비 2.77:1이라 글자로 못 쓴다. dark(4.5:1 이상)를 쓴다.
export const successMessage = style({
  fontSize: themeContract.font.size.xs,
  color: themeContract.color.success.dark,
  lineHeight: 1.5,
  animation: messageEnter,
});
