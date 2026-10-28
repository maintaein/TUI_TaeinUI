import { style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const { animation, color, font, spacing, borderRadius } = themeContract;

// 단추와 도장 층을 묶는 상자. 쾅의 1px 눌림은 이 상자가 받는다(Button이 누름 scale에 transform을 쓰고 있어
// 단추에 직접 걸면 겹친다). 도장이 단추 위에서 내려오므로 overflow는 기본값(visible)이다.
export const root = style({
  position: 'relative',
  display: 'inline-flex',
});

// 찍힌 뒤에는 눌러도 아무 일이 없다는 것을 커서로 알린다
export const locked = style({
  selectors: {
    '&[data-stamped]': { cursor: 'default' },
  },
});

// 찍힌 뒤 단추 글자는 도장 뒤로 옅게 비친다
export const label = style({
  transition: `opacity ${animation.duration.fast} ${animation.easing.settle}`,
  selectors: {
    '&[data-stamped]': { opacity: 0.5 },
  },
});

// 도장 층. 단추 전체를 덮고 도장을 가운데에 둔다. 클릭은 아래 단추로 지나간다.
export const layer = style({
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  display: 'grid',
  placeItems: 'center',
  pointerEvents: 'none',
});

// 도장 한 벌(면과 인주). GSAP이 이 상자에 내려옴(y, scale, rotation)을 건다.
export const mark = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
});

// 도장 면. 테두리와 글자가 모두 primary이고, 바탕은 단추 글자를 옅게 비치게 하는 반투명 흰색이다.
// 납작은 바닥(종이에 닿는 쪽)을 기준으로 눌린다.
export const face = style({
  position: 'relative',
  zIndex: 1,
  padding: `${spacing[1]} ${spacing[3]}`,
  border: `2px solid ${color.primary.main}`,
  borderRadius: borderRadius.sm,
  backgroundColor: `color-mix(in srgb, ${color.background.default} 85%, transparent)`,
  color: color.primary.main,
  fontFamily: font.family.sans,
  fontSize: font.size.sm,
  fontWeight: font.weight.bold,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  transformOrigin: '50% 100%',
});

// 인주 자국. 면보다 가로 20px, 세로 12px씩 크게 깔리고 면 뒤에 놓인다. 색은 currentColor(primary)이고
// 옅기는 path의 fill-opacity가 정한다.
export const ink = style({
  position: 'absolute',
  top: `calc(${spacing[3]} * -1)`,
  left: `calc(${spacing[5]} * -1)`,
  width: `calc(100% + ${spacing[5]} * 2)`,
  height: `calc(100% + ${spacing[3]} * 2)`,
  color: color.primary.main,
});
