import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { bubbleStyles, type BubbleSpec } from '../../_internal/bubble';

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

// bubble 배치(방향 4개 x 닫힘/열림)는 _internal/bubble.ts가 만든다. 이 파일은
// Popover만의 값을 넘긴다.
//
// 시작을 많이 줄여(0.6) 둔 것은 snap의 오버슛이 이동거리에 비례해서다.
// 0.95처럼 거의 안 움직이면 오버슛이 1px도 안 돼 튀는 느낌이 없다.
// scale(0.6)은 표준 scale(0.9~0.97) 밖이다. 의도된 예외다: 0.9면 정점이
// 1.010이라 55px 팝오버의 먼 가장자리가 0.55px만 튀어 pop이 보이지 않는다.
//
// 본체(transform)는 오버슛하는 snap으로 튀어 오르고, 불투명도는 더 짧고
// 오버슛 없는 settle로 먼저 끝낸다. 주연(움직임)과 조연(페이드)의 길이와
// 커브를 일부러 다르게 둔 것이다. 등장 길이는 Modal보다 짧다(오버레이계 O3:
// 아래층이 클수록 위층은 짧게). 퇴장은 등장 길이의 0.65배 + exit 커브다(조항 3).
export const bubbleSpec: BubbleSpec = {
  scale: 0.6,
  closedOffset: 8,
  openOffset: 8,
  enterTransform: { duration: 'slow', easing: 'snap' },
  enterOpacity: { duration: 'fast', easing: 'settle' },
  exitDuration: 'slow',
};

const bubble = bubbleStyles(bubbleSpec);

// 닫힘(휴식) 상태. 마운트 첫 프레임과 퇴장 도착지가 함께 쓴다(Popover.tsx의
// `visible` 플래그가 false일 때).
export const positionStyles = styleVariants(bubble.closed);

// 열림(도착) 상태.
export const positionOpenStyles = styleVariants(bubble.open);

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
