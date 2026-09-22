import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 컨테이너 스타일 (Tooltip 패턴)
export const popoverContainer = style({
  position: 'relative',
  display: 'inline-block',
});

// 팝오버 본체 — 위치·상태에 무관한 겉모습만 갖는다. opacity·transform·전이는
// positionStyles/positionOpenStyles가 방향별로 쥔다(방향 오프셋과 상태 scale이
// 같은 transform 하나에 있어야 해서 방향×상태로 묶는다).
export const popover = style({
  position: 'absolute',
  zIndex: themeContract.zIndex.popover,
  backgroundColor: themeContract.color.background.paper,
  borderRadius: themeContract.borderRadius.md,
  boxShadow: themeContract.shadow.lg,
  border: `1px solid ${themeContract.color.border.default}`,
  width: 'max-content',
  minWidth: '120px',
  overflow: 'visible',
});

// 닫힘(휴식) 상태 — 마운트 첫 프레임과 퇴장 도착지가 함께 쓴다(Popover.tsx의
// `visible` 플래그가 false일 때). transform-origin을 화살표가 붙는 쪽에 두면
// 그 쪽은 거의 안 움직이고 반대쪽 몸통이 scale로 펼쳐진다 — O1("자기를 부른
// 자리에서")을 지연 체인 없이 표현한다(arrowPositionStyles와 같은 방향 매핑).
// 퇴장은 등장 전이를 반대로 돌리고 커브만 바꾼 것이다(조항 3):
// calc(base * 0.65)/exit.
export const positionStyles = styleVariants({
  top: {
    bottom: '100%',
    left: '50%',
    transformOrigin: 'bottom center',
    transform: 'translateX(-50%) translateY(-8px) scale(0.95)',
    opacity: 0,
    transition: `opacity calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
  },
  bottom: {
    top: '100%',
    left: '50%',
    transformOrigin: 'top center',
    transform: 'translateX(-50%) translateY(8px) scale(0.95)',
    opacity: 0,
    transition: `opacity calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
  },
  left: {
    right: '100%',
    top: '50%',
    transformOrigin: 'right center',
    transform: 'translateY(-50%) translateX(-8px) scale(0.95)',
    opacity: 0,
    transition: `opacity calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
  },
  right: {
    left: '100%',
    top: '50%',
    transformOrigin: 'left center',
    transform: 'translateY(-50%) translateX(8px) scale(0.95)',
    opacity: 0,
    transition: `opacity calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
  },
});

// 열림(도착) 상태 — transform-origin은 닫힘과 같은 값이어야 펼쳐지는 방향이
// 유지된다. 등장은 base 전체 길이 + settle(오버레이계 O3: `Tooltip`보다
// 무거운 "중간" 무게).
export const positionOpenStyles = styleVariants({
  top: {
    bottom: '100%',
    left: '50%',
    transformOrigin: 'bottom center',
    transform: 'translateX(-50%) translateY(-8px) scale(1)',
    opacity: 1,
    transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  },
  bottom: {
    top: '100%',
    left: '50%',
    transformOrigin: 'top center',
    transform: 'translateX(-50%) translateY(8px) scale(1)',
    opacity: 1,
    transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  },
  left: {
    right: '100%',
    top: '50%',
    transformOrigin: 'right center',
    transform: 'translateY(-50%) translateX(-8px) scale(1)',
    opacity: 1,
    transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  },
  right: {
    left: '100%',
    top: '50%',
    transformOrigin: 'left center',
    transform: 'translateY(-50%) translateX(8px) scale(1)',
    opacity: 1,
    transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  },
});

// 화살표: 정사각형을 45도 회전 + 방향별 rotate
// 배경색 + border를 팝오버와 동일하게 적용
export const arrow = style({
  position: 'absolute',
  width: '10px',
  height: '10px',
  backgroundColor: themeContract.color.background.paper,
  border: `1px solid ${themeContract.color.border.default}`,
});

// 방향별 위치 + 회전 (top 기준 45도 회전 → 나머지는 추가 회전)
export const arrowPositionStyles = styleVariants({
  top: {
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    borderTop: 'none',
    borderLeft: 'none',
  },
  bottom: {
    top: '-6px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    borderBottom: 'none',
    borderRight: 'none',
  },
  left: {
    right: '-6px',
    top: '50%',
    transform: 'translateY(-50%) rotate(45deg)',
    borderBottom: 'none',
    borderLeft: 'none',
  },
  right: {
    left: '-6px',
    top: '50%',
    transform: 'translateY(-50%) rotate(45deg)',
    borderTop: 'none',
    borderRight: 'none',
  },
});
