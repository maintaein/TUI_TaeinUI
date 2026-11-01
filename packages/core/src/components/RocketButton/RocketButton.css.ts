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

// 분사구: 단추 밑면에서 아래로 벌어지는 작은 사다리꼴. 자리와 크기(px)는 컴포넌트가 단추 크기에서 구해 인라인으로 준다.
export const nozzle = style({
  position: 'absolute',
  backgroundColor: palette.primary[900],
  clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)',
});

// 불꽃: 분사구 끝에서 아래로 뻗는 길쭉한 물방울. 높이는 가장 긴 길이로 고정하고 길이는 scaleY(원점 위)로만 바꿔
// 매 프레임 레이아웃을 건드리지 않는다. 바깥은 primary 밝은 단계에서 끝으로 갈수록 투명해지고,
// 흰 바탕에서도 뿌리가 보이게 400단계에서 시작한다. 장식이라 단추 위로 가리는 것이 없다.
export const flame = style({
  position: 'absolute',
  transformOrigin: '50% 0',
  borderRadius: '0 0 50% 50% / 0 0 100% 100%',
  backgroundImage: `linear-gradient(to bottom, ${palette.primary[400]} 0%, ${palette.primary[200]} 55%, transparent 100%)`,
});

// 가는 흰 심지. 바깥 가운데에 폭 3분의 1로 앉고 끝으로 갈수록 투명하다
export const flameCore = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: '33%',
  width: '34%',
  borderRadius: '0 0 50% 50% / 0 0 100% 100%',
  backgroundImage: `linear-gradient(to bottom, ${color.text.inverse} 0%, transparent 75%)`,
});
