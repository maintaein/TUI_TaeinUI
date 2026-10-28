import { globalStyle, style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

const { color, palette, font, spacing, borderRadius, zIndex } = themeContract;

// 단추 자리를 잡는 상자. 단추는 날아간 뒤에도 이 안에 보이지 않게 남아 자리를 지키고, 표지는 그 위에 겹친다.
export const root = style({
  position: 'relative',
  display: 'inline-flex',
});

// 웅크림(GSAP transform)을 받는 상자. Button이 누름 scale에 transform을 쓰고 있어 단추에 직접 걸면 겹친다.
export const crouch = style({
  display: 'inline-flex',
});

// 날아간 뒤 자리에 서는 표지. 단추와 같은 크기의 자리를 덮고 글자는 가운데에 둔다.
export const mark = style({
  position: 'absolute',
  inset: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[2],
  borderRadius: borderRadius.base,
  backgroundColor: palette.primary[50],
  color: palette.primary[900],
  fontFamily: font.family.sans,
  fontSize: font.size.base,
  fontWeight: font.weight.semibold,
  whiteSpace: 'nowrap',
  // 긴 sentLabel이 자리 밖으로 넘치지 않게 글자 상자가 줄어들 수 있어야 한다
  padding: `0 ${spacing[2]}`,
  overflow: 'hidden',
  selectors: {
    '&:focus-visible': focusRing(),
  },
});

// 표지 글자. flex 항목은 글자를 직접 받으면 말줄임이 안 걸려 상자로 감싼다
export const markText = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

// 비행 레이어. 기본은 화면 전체(고정)이고 container를 받으면 그 상자 안(absolute)에 갇혀 상자 밖은 잘린다.
export const layer = style({
  position: 'fixed',
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  zIndex: zIndex.toast,
  selectors: {
    '&[data-contained]': { position: 'absolute' },
  },
});

// 날아가는 한 벌(단추 복제본과 날개 둘). GSAP이 이 상자에 이동·기울기·배율을 건다.
export const craft = style({
  position: 'absolute',
});

// 복제본은 원래 단추 크기로 채운다
export const cloneHost = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
});
globalStyle(`${cloneHost} > *`, {
  width: '100%',
  height: '100%',
  flex: 'none',
});

// 날개 한 쪽. 뿌리가 단추 옆면 가운데 높이에 오고(단추 아래로 4px 겹쳐 들어간다), 그 점을 중심으로 퍼덕인다.
export const wing = style({
  position: 'absolute',
  bottom: '50%',
  height: '120%',
  aspectRatio: '1',
  selectors: {
    '&[data-side="right"]': {
      left: '100%',
      marginLeft: `calc(${spacing[1]} * -1)`,
      transformOrigin: '0% 100%',
    },
    '&[data-side="left"]': {
      right: '100%',
      marginRight: `calc(${spacing[1]} * -1)`,
      transformOrigin: '100% 100%',
    },
  },
});

export const wingSvg = style({
  display: 'block',
  width: '100%',
  height: '100%',
  overflow: 'visible',
  selectors: {
    [`${wing}[data-side="left"] &`]: { transform: 'scaleX(-1)' },
  },
});

// 깃털. primary 계열의 옅은 면에 한 단계 진한 선을 둘러 흰 바탕에서도 윤곽이 읽힌다.
export const feather = style({
  fill: palette.primary[200],
  stroke: color.primary.light,
  strokeWidth: 1.5,
  vectorEffect: 'non-scaling-stroke',
});
