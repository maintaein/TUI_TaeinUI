import { themeContract } from '@taein-ui/core';
import { globalStyle, style } from '@vanilla-extract/css';
import { FRAME, INK } from '../DocText';

const { color, spacing, borderRadius } = themeContract;

export const stage = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  // position: fixed 자손(Snackbar 같은 인라인 오버레이)의 기준이 된다. 포털 오버레이는 아래 layer에 갇힌다
  contain: 'layout',
  background: color.background.default,
  borderRadius: borderRadius.lg,
});

// 카드 속 미니: 카드 상자를 채운다. 일시정지 단추 줄이 없으니 오버레이 상자와 바(헤더바)가 맨 위부터 쓴다
export const stageMini = style({
  alignSelf: 'stretch',
  justifySelf: 'stretch',
  borderRadius: 0,
  // 안쪽 시연(펼침, 열림)이 키를 바꿔도 카드 키는 그대로다. 높이는 카드 상자(minHeight)가 정하고 넘치는 것은 잘린다
  contain: 'size layout',
});

export const tools = style({
  position: 'absolute',
  top: spacing[3],
  right: spacing[3],
  zIndex: 2,
  display: 'flex',
  padding: spacing[1],
  background: FRAME,
  borderRadius: borderRadius.md,
});

// 오버레이(core container)가 갇혀 뜨는 상자. 일시정지 단추 아래 줄부터 무대 끝까지다(단추가 오버레이에 가리지 않고, 오버레이도 단추에 가리지 않는다).
// 비어 있을 때 아래 무대의 클릭을 막지 않도록 통과시키고, 오버레이 자신은 받는다
export const layer = style({
  position: 'absolute',
  top: '3.5rem',
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1,
  contain: 'layout',
  pointerEvents: 'none',
});
globalStyle(`${layer} > *`, { pointerEvents: 'auto' });

// 부모 폭을 채우는 컴포넌트(fullWidth)가 보이도록 폭을 정해 두고, 그 안에서 가운데에 놓는다
export const inner = style({
  position: 'relative',
  zIndex: 0,
  display: 'grid',
  justifyItems: 'center',
  width: 'min(calc(100% - 2rem), 22rem)',
});

// 바(헤더바)는 22rem에 눌리지 않게 넓히고 일시정지 단추 줄 아래 위쪽에 앉힌다. 판이 아래로 열릴 자리가 남는다
export const innerBar = style({
  width: 'min(calc(100% - 2rem), 46rem)',
  alignSelf: 'start',
  marginTop: '3.5rem',
});

export const cursor = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '24px',
  height: '24px',
  color: INK,
  pointerEvents: 'none',
  zIndex: 1,
  visibility: 'hidden',
  // lucide MousePointer2의 화살촉은 24px 상자의 (4,4)
  marginLeft: '-4px',
  marginTop: '-4px',
});

globalStyle(`${stageMini} > ${layer}`, { top: 0 });
globalStyle(`${stageMini} > ${innerBar}`, { marginTop: spacing[4] });
// 카드 속 미니는 연출 커서를 그리지 않는다(움직임 자체는 그대로). 커서는 타임라인의 대상이라 요소는 남기고 보이지만 않게 한다
globalStyle(`${stageMini} > ${cursor}`, { display: 'none' });
