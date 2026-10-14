import {
  createVar,
  style,
  styleVariants,
  globalStyle,
} from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 항목 사이 간격과 구분선 위 여백은 같은 값이다. spacing이 변수 하나를 정하고
// gap과 구분선의 paddingBottom이 같이 읽는다.
const gap = createVar();

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap,
});

export const spacingStyles = styleVariants({
  none: { vars: { [gap]: '0' } },
  sm: { vars: { [gap]: themeContract.spacing[2] } },
  md: { vars: { [gap]: themeContract.spacing[4] } },
  lg: { vars: { [gap]: themeContract.spacing[6] } },
});

export const withDivider = style({});

globalStyle(`${withDivider} > li:not(:last-child)`, {
  borderBottom: `1px solid ${themeContract.color.border.default}`,
  paddingBottom: gap,
});

export const listItem = style({
  display: 'flex',
  width: '100%',
});

// label-value 항목의 정렬은 고정이다. 가로는 세로 가운데, 세로는 왼쪽.
// children 항목(자유 배치)에는 걸지 않는다.
export const layoutStyles = styleVariants({
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vertical: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});

export const label = style({
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.secondary,
  flexShrink: 0,
});

export const value = style({
  color: themeContract.color.text.primary,
  flex: 1,
});

export const horizontalGap = style({
  gap: themeContract.spacing[4],
});

export const verticalGap = style({
  gap: themeContract.spacing[1],
});
