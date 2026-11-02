import { globalStyle, style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

const { palette, color, font, spacing, borderRadius, zIndex } = themeContract;

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

// 날아가는 단추 복제본 상자(분사구와 불꽃도 이 안에 있어 몸체와 함께 기울고 작아진다). GSAP이 이 상자에 이동·기울기·배율을 건다.
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

// 분출 세기 0~1. 박자 함수의 strength를 컴포넌트가 비행 상자에 매 프레임 넣고, 입 색, 빛 번짐, 몸체 밑면 빛, DOM 빛이 모두 이것 하나를 읽는다
export const THRUST = '--rocket-thrust';
const thrust = `var(${THRUST})`;
// 분출 색: primary 밝은 단계. 한가운데는 흰색 토큰이다
const jetColor = palette.primary[300];
const mix = (color: string, share: string, into = 'transparent') =>
  `color-mix(in srgb, ${color} ${share}, ${into})`;

// 분사구: 단추 몸체 뒤에 깔린(문서 순서가 몸체보다 앞) 작은 덩이. 위 몇 px는 몸체 밑면에 가려지고 아래로 삐져나온다.
// 위모서리는 작게 아래모서리는 크게 둥글고 짙은 gray에서 아래로 더 어둡다. 위치와 크기(px)는 컴포넌트가 단추 크기에서 구해
// 인라인으로 주고, 처음엔 GSAP이 transform으로 덩이 높이만큼 위(몸체 속)에 숨겨 두었다가 내려보낸다.
export const nozzle = style({
  position: 'absolute',
  borderRadius: '15% 15% 45% 45% / 15% 15% 50% 50%',
  backgroundImage: `linear-gradient(to bottom, ${palette.gray[700]}, ${palette.gray[900]})`,
});

// 입: 덩이 아랫면의 얇고 납작한 틈. 색은 분출 세기만큼 무채색에서 분출 색으로 섞이고 아래로 빛이 번진다
export const mouth = style({
  position: 'absolute',
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  borderRadius: '0 0 50% 50% / 0 0 100% 100%',
  backgroundColor: mix(jetColor, `calc(${thrust} * 100%)`, palette.gray[600]),
  boxShadow: `0 calc(${thrust} * 3px) calc(${thrust} * 9px) calc(${thrust} * 2px) ${mix(jetColor, `calc(${thrust} * 70%)`)}`,
});

// 몸체 밑면 빛: 몸체 위의 장식 층(레이어가 포인터를 안 받고 aria-hidden이다). 아래에서 위로 분출 색을 세기 x 30%까지 비추되
// 글자(가운데 줄)에는 닿지 않게 밑 32%에서 사라진다. 글자 대비 4.5:1이 깨지지 않게 하는 선이다(리포트에 계산).
export const underglow = style({
  position: 'absolute',
  inset: 0,
  backgroundImage: `linear-gradient(to top, ${mix(jetColor, `calc(${thrust} * 30%)`)}, transparent 32%)`,
});

// DOM 빛: 연기 엔진이 없을 때(smoke={false}, 미니, WebGL2 없음)도 입 아래에 분출이 보이게 하는 방사 그라디언트 빛무리.
// 엔진이 그리고 있으면(`data-engine`) 엔진이 주가 되므로 숨긴다
export const halo = style({
  position: 'absolute',
  borderRadius: '50%',
  opacity: thrust,
  backgroundImage: `radial-gradient(closest-side, ${mix(jetColor, '60%')}, ${mix(jetColor, '20%')} 45%, transparent)`,
  selectors: {
    '[data-engine] &': { display: 'none' },
  },
});

// DOM 심지: 가운데가 밝고 가장자리로 사라지는 종 모양이고 아래로 가늘어진다. 높이는 가장 긴 길이로 고정하고 길이는
// scaleY(원점 위)로만 바꿔 매 프레임 레이아웃을 건드리지 않는다
export const wick = style({
  position: 'absolute',
  transformOrigin: '50% 0',
  backgroundImage: `radial-gradient(ellipse 50% 100% at 50% 0, ${color.text.inverse} 0%, ${jetColor} 55%, transparent 100%)`,
});
