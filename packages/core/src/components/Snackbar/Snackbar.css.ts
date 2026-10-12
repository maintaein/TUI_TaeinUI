import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 등장 `@keyframes` 4개와 퇴장 `snackbarExit`은 M3 T3에서 GSAP 타임라인으로
// 옮겼다(`Snackbar.tsx`의 `useOverlayTransition` 호출) — progress를 읽고
// 중단할 수 있어야 하는데 `@keyframes`는 그게 안 된다.

// 기본 스타일
export const snackbar = style({
  position: 'fixed',
  zIndex: themeContract.zIndex.toast,
  display: 'flex',
  alignItems: 'center',
  padding: themeContract.spacing[3],
  borderRadius: themeContract.borderRadius.base,
  boxShadow: themeContract.shadow.lg,
  minWidth: '288px',
  maxWidth: '568px',
  fontFamily: themeContract.font.family.sans,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
  lineHeight: themeContract.font.lineHeight.normal,
  color: themeContract.color.primary.contrast,
  // 카운트다운 막대(아래 `bar`)가 각진 모서리를 갖고 있어, 안 잘라내면
  // 둥근 하단 모서리 밖으로 살짝 튀어나온다.
  overflow: 'hidden',
});

// Severity 스타일
//
// success·warning은 면이 `dark`이고 글자가 흰색(`text.inverse`)이다. 글자만 흰색으로
// 바꾸면 `main` 위에서 2.78·2.16:1이라 AA를 못 넘는다. `dark` 위에서는 5.13·5.49:1이다.
// 아이콘과 카운트다운 막대는 `currentColor`라 글자색을 따라 흰색이 된다(막대 대 면 3:1
// 이상). error·info는 `main` 위 `contrast`(흰색)가 이미 4.98·4.6:1이라 그대로다.
export const severityStyles = styleVariants({
  success: {
    backgroundColor: themeContract.color.success.dark,
    color: themeContract.color.text.inverse,
  },
  error: {
    backgroundColor: themeContract.color.error.main,
    color: themeContract.color.error.contrast,
  },
  warning: {
    backgroundColor: themeContract.color.warning.dark,
    color: themeContract.color.text.inverse,
  },
  // 값은 primary와 같지만 어휘를 계약에 맞춘다. primary를 빌려 쓰면 브랜드 색을
  // 바꿀 때 정보 알림 색까지 따라 바뀐다.
  info: {
    backgroundColor: themeContract.color.info.main,
    color: themeContract.color.info.contrast,
  },
});

// Position 스타일 (화면 고정 위치만 잡는다 — 등장·퇴장은 GSAP 타임라인이 맡는다)
//
// center 2종은 예전엔 여기서 `transform: translateX(-50%)`로 가로 중앙을
// 잡았다. 이제 같은 요소의 `transform`을 GSAP 타임라인이 통째로 쓰므로(함정
// 1), 정적 transform을 여기 남겨 두면 GSAP이 매 프레임 덮어써 중앙 정렬이
// 깨진다 — `Snackbar.tsx`의 `buildTimeline`이 `xPercent: -50`을 대신 맡는다.
export const positionStyles = styleVariants({
  'top-left': {
    top: themeContract.spacing[6],
    left: themeContract.spacing[6],
  },
  'top-center': {
    top: themeContract.spacing[6],
    left: '50%',
  },
  'top-right': {
    top: themeContract.spacing[6],
    right: themeContract.spacing[6],
  },
  'bottom-left': {
    bottom: themeContract.spacing[6],
    left: themeContract.spacing[6],
  },
  'bottom-center': {
    bottom: themeContract.spacing[6],
    left: '50%',
  },
  'bottom-right': {
    bottom: themeContract.spacing[6],
    right: themeContract.spacing[6],
  },
});

// Content 스타일
export const content = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  gap: themeContract.spacing[3],
});

// Message 스타일
export const message = style({
  flex: 1,
});

// Actions 스타일
export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeContract.spacing[2],
  marginLeft: 'auto',
});

// Close button 스타일
export const closeButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  fontSize: themeContract.font.size.base,
  lineHeight: 1,
  cursor: 'pointer',
  touchAction: 'manipulation',
  opacity: 0.8,
  transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,

  ':hover': {
    opacity: 1,
  },

  ':focus-visible': {
    ...focusRing('currentColor'),
    borderRadius: themeContract.borderRadius.sm,
    opacity: 1,
  },
});

// 카운트다운 막대. `Snackbar.tsx`가 매 프레임 `transform: scaleX()`만 바꾼다
// (완료 조건 9 — `width`를 바꾸면 레이아웃 재계산이다). 배경은 severity가
// 이미 쓰는 글자색(`currentColor`)을 그대로 물려받는다 — 새 토큰 없이 4종
// severity 면 전부에서 글자 대비와 같은 쌍으로 검증된다(완료 조건 8, llms.test.ts).
// 시작 `scaleX(1)`은 첫 GSAP 틱 전 번쩍임을 막는 정적 기본값이다.
export const bar = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '3px',
  transform: 'scaleX(1)',
  transformOrigin: 'left',
  backgroundColor: 'currentColor',
});

// 시각적으로만 숨기는 라이브 리전. SegmentedButtons.css.ts의 radioInput과 같은
// 모양이다 — display: none·visibility: hidden은 접근성 트리에서도 지워져 쓸 수 없다.
export const visuallyHidden = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});
