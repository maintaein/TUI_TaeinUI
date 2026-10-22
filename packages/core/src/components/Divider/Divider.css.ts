import { createVar, style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

export const divider = style({
  display: 'flex',
  alignItems: 'center',
  border: 0,
  color: themeContract.color.text.secondary,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
});

// spacing은 방향마다 다른 축의 여백이다(가로는 위아래, 세로는 좌우). 크기만
// 변수로 받고 어느 축에 붙일지는 orientationStyles가 정한다.
const gap = createVar();

export const orientationStyles = styleVariants({
  horizontal: {
    width: '100%',
    flexDirection: 'row',
    margin: `${gap} 0`,
    borderTop: `1px solid ${themeContract.color.border.default}`,
  },
  // height를 두지 않는다: height: 100%는 줄의 높이가 정해지지 않은 flex 줄에서
  // stretch를 막는다. 줄 높이를 채우는 일은 alignSelf가 맡는다.
  vertical: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    margin: `0 ${gap}`,
    borderLeft: `1px solid ${themeContract.color.border.default}`,
  },
});

// 글자가 있으면 루트 border가 0이고 선은 자식 두 토막이 그린다. variant가 거기까지
// 닿도록 선 모양을 변수로 내려보낸다.
const lineStyle = createVar();

export const variantStyles = styleVariants({
  solid: {
    vars: { [lineStyle]: 'solid' },
    borderStyle: 'solid',
  },
  dashed: {
    vars: { [lineStyle]: 'dashed' },
    borderStyle: 'dashed',
  },
  dotted: {
    vars: { [lineStyle]: 'dotted' },
    borderStyle: 'dotted',
  },
});

export const spacingStyles = styleVariants({
  sm: { vars: { [gap]: themeContract.spacing[2] } },
  md: { vars: { [gap]: themeContract.spacing[4] } },
  lg: { vars: { [gap]: themeContract.spacing[6] } },
});

export const textAlignStyles = styleVariants({
  left: {
    justifyContent: 'flex-start',
  },
  center: {
    justifyContent: 'center',
  },
  right: {
    justifyContent: 'flex-end',
  },
});

export const dividerWithText = style({
  borderTop: 0,
  borderLeft: 0,
  position: 'relative',
});

export const line = style({
  flex: 1,
  borderTop: `1px ${lineStyle} ${themeContract.color.border.default}`,
});

export const lineVertical = style({
  flex: 1,
  borderLeft: `1px ${lineStyle} ${themeContract.color.border.default}`,
});

export const textContent = style({
  padding: `0 ${themeContract.spacing[3]}`,
  whiteSpace: 'nowrap',
});

export const textContentVertical = style({
  padding: `${themeContract.spacing[3]} 0`,
  whiteSpace: 'nowrap',
});
