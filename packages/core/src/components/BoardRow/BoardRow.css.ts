import { style, styleVariants, globalStyle } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';
import { focusRing } from '../../tokens/focusRing.css';

// 아코디언 아이템 컨테이너
export const boardRow = style({
  width: '100%',
  borderRadius: themeContract.borderRadius.md,
  overflow: 'hidden',
  boxSizing: 'border-box',
  position: 'relative',

  // 좌측 3px 막대(B2 — 선택/펼침 상태는 계열 안에서 갈린다. BoardRow는 좌측
  // 막대다). Table.md §2.1 좌측 표식과 같은 언어라 형태를 바꾸지 않는다(M7
  // 제약 4). 항상 존재하되 scaleY(0)로 숨어 있다가 펼쳐지면만 자란다.
  '::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '3px',
    backgroundColor: themeContract.color.primary.main,
    transformOrigin: 'top',
    transform: 'scaleY(0)',
    pointerEvents: 'none',
    // 물러날 때(article 3): 진입(base)의 60~70%로 짧고, 가속 커브로 뺀다.
    transition: `transform calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit}`,
  },
});

// 펼침 상태를 나타내는 빈 placeholder — List.css.ts의 globalStyle(두 독립
// 클래스 결합) 관례로 boardRow의 ::before 막대와 결합한다(Chip의 selected와
// 동일 패턴).
export const rowExpanded = style({});

// 펼쳐지면 막대가 위에서 아래로 그어져 내려온다 — base 소유의 짧은 퇴장
// 전이와 달리 진입은 base 길이 그대로에 snap으로 긋는다.
globalStyle(`${rowExpanded}::before`, {
  transform: 'scaleY(1)',
  transitionDuration: themeContract.animation.duration.base,
  transitionTimingFunction: themeContract.animation.easing.snap,
});

export const variantStyles = styleVariants({
  default: {
    backgroundColor: 'transparent',
  },
  outlined: {
    border: `1px solid ${themeContract.color.border.default}`,
  },
  filled: {
    backgroundColor: themeContract.color.background.paper,
  },
});

// 헤더 버튼
export const header = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeContract.spacing[3],
  padding: themeContract.spacing[4],
  border: 'none',
  backgroundColor: 'transparent',
  fontSize: themeContract.font.size.base,
  fontWeight: themeContract.font.weight.medium,
  color: themeContract.color.text.primary,
  textAlign: 'left',
  cursor: 'pointer',
  touchAction: 'manipulation',
  transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,

  ':hover': {
    backgroundColor: themeContract.color.background.paper,
    transitionDuration: themeContract.animation.duration.fast,
    transitionTimingFunction: themeContract.animation.easing.settle,
  },

  // 지금은 배경색만 바뀌는 채널이라 article 4 관점에서 hover와 같은 한계를
  // 이어받는다 — header에 새 transform 채널을 넣는 건 이 작업 범위 밖이라
  // duration/curve만 표에 맞춘다(브리프가 명시한 값만 구현).
  ':active': {
    backgroundColor: themeContract.color.surface.active,
    transitionDuration: themeContract.animation.duration.fast,
    transitionTimingFunction: themeContract.animation.easing.exit,
  },

  ':focus-visible': {
    ...focusRing(),
    outlineOffset: '-2px',
  },

  ':disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
    backgroundColor: 'transparent',
  },
});

export const title = style({
  flex: 1,
});

export const iconContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  flexShrink: 0,
  transition: `transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
});

export const iconExpanded = style({
  transform: 'rotate(180deg)',
});

export const contentWrapper = style({
  display: 'grid',
  gridTemplateRows: '0fr',
  // grid-template-rows는 transform·opacity가 아니라 레이아웃 속성이라 매 프레임
  // 리플로우가 난다. 그래도 여기서만 쓰는 이유는 아코디언이 펼칠 콘텐츠의 높이를
  // 미리 알 수 없어서다 — max-height 근사는 점프하거나 늦게 끝나고, 높이를
  // 모르고도 자연 높이까지 여는 방법은 grid-template-rows의 0fr→1fr뿐이다.
  // 기존 커브 자리는 상태 전이라 조항 3이 지배한다 — 접힘(rest)은 exit,
  // 펼침(wrapperExpanded 오버라이드)은 settle. drift(자율 루프 전용)로 가지
  // 않는다.
  transition: `grid-template-rows ${themeContract.animation.duration.slow} ${themeContract.animation.easing.exit}`,
});

export const wrapperExpanded = style({
  gridTemplateRows: '1fr',
  transitionTimingFunction: themeContract.animation.easing.settle,
});

export const content = style({
  overflow: 'hidden',
  minHeight: 0,
});

// 내부 콘텐츠 패딩
export const contentInner = style({
  padding: `0 ${themeContract.spacing[4]} ${themeContract.spacing[4]}`,
  color: themeContract.color.text.secondary,
  fontSize: themeContract.font.size.sm,
  lineHeight: themeContract.font.lineHeight.relaxed,
});
