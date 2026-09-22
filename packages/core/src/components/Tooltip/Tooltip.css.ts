import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 컨테이너 스타일
export const tooltipContainer = style({
  position: 'relative',
  display: 'inline-block',
});

// 기본 툴팁 스타일 — 위치·상태에 무관한 겉모습만 갖는다. opacity·translateY·
// 전이는 positionStyles/positionOpenStyles가 방향별로 쥔다.
export const tooltip = style({
  position: 'absolute',
  zIndex: themeContract.zIndex.tooltip,
  padding: `${themeContract.spacing[1]} ${themeContract.spacing[2]}`,
  backgroundColor: themeContract.color.text.primary,
  color: themeContract.color.background.paper,
  fontSize: themeContract.font.size.xs,
  fontWeight: themeContract.font.weight.medium,
  lineHeight: themeContract.font.lineHeight.normal,
  borderRadius: themeContract.borderRadius.sm,
  whiteSpace: 'nowrap',
});

// M2→M3 계약: Tooltip은 오버레이계의 최하한이다(O3 — 겹침 위층일수록 짧고
// 작게 움직인다, Tooltip이 거의 최상단). 채널 = opacity + translateY 2px,
// duration = fast(150ms), 퇴장 = calc(fast * 0.65). M3의 Modal·BottomSheet·
// SideSheet·Snackbar는 이 값(2px, fast)보다 **크게** 움직여야 한다 — 이
// 컴포넌트가 계열 전체의 바닥을 정한다.

// 닫힘(휴식) 상태 — 마운트 첫 프레임과 퇴장 도착지가 함께 쓴다(Tooltip.tsx의
// `visible` 플래그가 false일 때). 열림 오프셋(8px)보다 트리거 쪽으로 2px
// 가까운 자리다 — 툴팁이 트리거에서 나와 자리를 잡는(O1) 궤적의 시작점이고,
// 퇴장은 같은 궤적을 되짚어 돌아간다(O2). 퇴장 전이는 calc(fast * 0.65)/exit.
// 닫힌 뒤에도 노드는 퇴장 길이만큼 더 남는다(Tooltip.tsx의 shouldRender).
// opacity: 0은 히트 테스트에서도 접근성 트리에서도 요소를 빼지 않아서, 그
// 사이 클릭이 보이지 않는 툴팁에 먹히고 스크린 리더가 닫힌 툴팁을 읽는다
// (리뷰 I1). visibility: hidden이 양쪽에서 빼되, 한쪽 끝이 visible이면
// 중간값이 전부 visible이고 p=1에서만 넘어가는 성질이 있어 퇴장과 같은
// 길이를 주면 페이드를 다 보여준 뒤 마지막 프레임에 숨는다. 지연 0s로 걸면
// 페이드가 통째로 죽는다 — 열림 쪽은 목록에서 빼 즉시 켠다.
export const positionStyles = styleVariants({
  top: {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(-6px)',
    opacity: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    // 퇴장이 다 보인 뒤에 숨는다 — visibility는 p=1에서만 넘어간다(위 머리말).
    transition: `opacity calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}, visibility calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}`,
  },
  bottom: {
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(6px)',
    opacity: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    // 퇴장이 다 보인 뒤에 숨는다 — visibility는 p=1에서만 넘어간다(위 머리말).
    transition: `opacity calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}, visibility calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}`,
  },
  left: {
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%) translateX(-6px)',
    opacity: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    // 퇴장이 다 보인 뒤에 숨는다 — visibility는 p=1에서만 넘어간다(위 머리말).
    transition: `opacity calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}, visibility calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}`,
  },
  right: {
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%) translateX(6px)',
    opacity: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    // 퇴장이 다 보인 뒤에 숨는다 — visibility는 p=1에서만 넘어간다(위 머리말).
    transition: `opacity calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}, visibility calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}`,
  },
});

// 열림(도착) 상태 — 트리거에서 8px 떨어진 최종 자리. 등장은 fast 전체 길이 +
// settle(번역 문서가 확정: base가 아니라 fast를 그대로 유지한다).
export const positionOpenStyles = styleVariants({
  top: {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(-8px)',
    opacity: 1,
    visibility: 'visible',
    transition: `opacity ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  },
  bottom: {
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(8px)',
    opacity: 1,
    visibility: 'visible',
    transition: `opacity ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  },
  left: {
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%) translateX(-8px)',
    opacity: 1,
    visibility: 'visible',
    transition: `opacity ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  },
  right: {
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%) translateX(8px)',
    opacity: 1,
    visibility: 'visible',
    transition: `opacity ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,
  },
});

// 화살표 기본 스타일
export const arrow = style({
  position: 'absolute',
  width: 0,
  height: 0,
  borderStyle: 'solid',
});

// 화살표 위치별 스타일
export const arrowPositionStyles = styleVariants({
  top: {
    bottom: '-4px',
    left: '50%',
    transform: 'translateX(-50%)',
    borderWidth: '4px 4px 0 4px',
    borderColor: `${themeContract.color.text.primary} transparent transparent transparent`,
  },
  bottom: {
    top: '-4px',
    left: '50%',
    transform: 'translateX(-50%)',
    borderWidth: '0 4px 4px 4px',
    borderColor: `transparent transparent ${themeContract.color.text.primary} transparent`,
  },
  left: {
    right: '-4px',
    top: '50%',
    transform: 'translateY(-50%)',
    borderWidth: '4px 0 4px 4px',
    borderColor: `transparent transparent transparent ${themeContract.color.text.primary}`,
  },
  right: {
    left: '-4px',
    top: '50%',
    transform: 'translateY(-50%)',
    borderWidth: '4px 4px 4px 0',
    borderColor: `transparent ${themeContract.color.text.primary} transparent transparent`,
  },
});
