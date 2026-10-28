import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const { color, spacing, borderRadius } = themeContract;

// 알약이 흰색이라 흰 무대 위에서는 묻힌다. 헤더 줄과 같은 회색 틀 안에 둔다.
export const box = style({
  width: '100%',
  padding: spacing[3],
  background: color.surface.hover,
  border: `1px solid ${color.border.default}`,
  borderRadius: borderRadius.lg,
});

// 결과 목록이 검색창 아래로 펼쳐질 자리. 대본이 입력하지 않는 카드 속 미니에는 필요 없다
export const tall = style({ minHeight: '14rem' });

export const results = style({
  listStyle: 'none',
  margin: 0,
  padding: spacing[2],
  background: color.background.default,
  borderRadius: borderRadius.md,
});
