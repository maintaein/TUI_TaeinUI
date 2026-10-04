import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { bubbleStyles, type BubbleSpec } from '../../_internal/bubble';

// 컨테이너 스타일
export const tooltipContainer = style({
  position: 'relative',
  display: 'inline-block',
});

// 기본 툴팁 스타일. 위치·상태에 무관한 겉모습만 갖는다. opacity·transform·
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

// M2→M3 계약: Tooltip은 오버레이계의 최하한이다(O3: 겹침 위층일수록 짧고
// 작게 움직인다, Tooltip이 거의 최상단). 이 컴포넌트가 계열 전체의 바닥을
// 정한다. 지키는 것은 "Popover보다 가볍다"이고 수단은 값이다.
// - 시작 scale이 Popover보다 크다(0.8 > 0.6). 이동이 0.2로 Popover의 0.4보다 작다.
// - 등장이 짧다(transform base 200ms < slow 300ms).
// - 퇴장이 짧다(base * 0.65 = 130ms < slow * 0.65 = 195ms).
// M3의 Modal·BottomSheet·SideSheet·Snackbar는 이보다 크게 움직여야 한다.
// Tooltip.test.tsx가 이 파일과 Popover.css.ts가 bubbleStyles에 넘기는 값을
// 비교해 잠근다.
//
// 호버 요소는 하루에 수십 번 뜬다. 그래서 Popover의 절반 진폭이다. 시작이
// 0.8이면 snap의 정점이 1.020이고 불투명해진 뒤에 남는 크기 이동은 100x26px
// 툴팁에서 좌우 한쪽 2.5px다. 보이되 가볍다.
//
// bubble 배치(방향 4개 x 닫힘/열림)는 _internal/bubble.ts가 만든다.
// transform(base, snap)과 opacity(fast, settle)의 길이와 커브를 일부러 다르게
// 둔다. 불투명도가 먼저 끝나야 오버슛이 이미 불투명한 표면 위에서 보인다.
// 닫힘 오프셋(6px)이 열림 오프셋(8px)보다 트리거 쪽으로 2px 가깝다. 툴팁이
// 트리거에서 나와 자리를 잡는(O1) 궤적의 시작점이다.
export const bubbleSpec: BubbleSpec = {
  scale: 0.8,
  closedOffset: 6,
  openOffset: 8,
  enterTransform: { duration: 'base', easing: 'snap' },
  enterOpacity: { duration: 'fast', easing: 'settle' },
  exitDuration: 'base',
};

const bubble = bubbleStyles(bubbleSpec);

// 닫힘(휴식) 상태. 마운트 첫 프레임과 퇴장 도착지가 함께 쓴다(Tooltip.tsx의
// `visible` 플래그가 false일 때).
export const positionStyles = styleVariants(bubble.closed);

// 열림(도착) 상태. 트리거에서 8px 떨어진 최종 자리다.
export const positionOpenStyles = styleVariants(bubble.open);

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
