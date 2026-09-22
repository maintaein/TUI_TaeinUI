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
// 닫힌 뒤에도 노드는 퇴장 길이만큼 더 남는다(Popover.tsx의 shouldRender).
// opacity: 0은 히트 테스트에서도 접근성 트리에서도 요소를 빼지 않아서, 그
// 사이 클릭이 보이지 않는 팝오버에 먹히고 Tab이 닫힌 dialog 안으로 들어가고
// 스크린 리더가 그걸 읽는다(리뷰 I1). visibility: hidden이 양쪽에서 빼되,
// 한쪽 끝이 visible이면 중간값이 전부 visible이고 p=1에서만 넘어가는 성질이
// 있어 퇴장과 같은 길이를 주면 페이드를 다 보여준 뒤 마지막 프레임에 숨는다.
// 지연 0s로 걸면 페이드가 통째로 죽는다 — 열림 쪽은 목록에서 빼 즉시 켠다.
export const positionStyles = styleVariants({
  top: {
    bottom: '100%',
    left: '50%',
    transformOrigin: 'bottom center',
    transform: 'translateX(-50%) translateY(-8px) scale(0.95)',
    opacity: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    // 퇴장이 다 보인 뒤에 숨는다 — visibility는 p=1에서만 넘어간다(위 머리말).
    transition: `opacity calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, visibility calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
  },
  bottom: {
    top: '100%',
    left: '50%',
    transformOrigin: 'top center',
    transform: 'translateX(-50%) translateY(8px) scale(0.95)',
    opacity: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    // 퇴장이 다 보인 뒤에 숨는다 — visibility는 p=1에서만 넘어간다(위 머리말).
    transition: `opacity calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, visibility calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
  },
  left: {
    right: '100%',
    top: '50%',
    transformOrigin: 'right center',
    transform: 'translateY(-50%) translateX(-8px) scale(0.95)',
    opacity: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    // 퇴장이 다 보인 뒤에 숨는다 — visibility는 p=1에서만 넘어간다(위 머리말).
    transition: `opacity calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, visibility calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
  },
  right: {
    left: '100%',
    top: '50%',
    transformOrigin: 'left center',
    transform: 'translateY(-50%) translateX(8px) scale(0.95)',
    opacity: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    // 퇴장이 다 보인 뒤에 숨는다 — visibility는 p=1에서만 넘어간다(위 머리말).
    transition: `opacity calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}, visibility calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
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
    visibility: 'visible',
    transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  },
  bottom: {
    top: '100%',
    left: '50%',
    transformOrigin: 'top center',
    transform: 'translateX(-50%) translateY(8px) scale(1)',
    opacity: 1,
    visibility: 'visible',
    transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  },
  left: {
    right: '100%',
    top: '50%',
    transformOrigin: 'right center',
    transform: 'translateY(-50%) translateX(-8px) scale(1)',
    opacity: 1,
    visibility: 'visible',
    transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  },
  right: {
    left: '100%',
    top: '50%',
    transformOrigin: 'left center',
    transform: 'translateY(-50%) translateX(8px) scale(1)',
    opacity: 1,
    visibility: 'visible',
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
