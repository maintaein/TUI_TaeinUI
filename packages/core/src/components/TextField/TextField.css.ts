import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

/** 테두리 두께(px). input의 border와 lineHeight 역산이 같은 값을 쓴다. */
const BORDER_WIDTH = 1;

const HEIGHT = { sm: 44, md: 44, lg: 52 } as const;

/**
 * input의 텍스트 기하. lineHeight는 콘텐츠 박스 높이(HEIGHT − 테두리 2개)와 같다:
 * 단일행 세로 중앙 정렬을 line-height로 맞춘다.
 */
const textMetrics = {
  sm: {
    fontSize: '0.875rem',
    lineHeight: `${HEIGHT.sm - BORDER_WIDTH * 2}px`,
  },
  md: {
    fontSize: '1rem',
    lineHeight: `${HEIGHT.md - BORDER_WIDTH * 2}px`,
  },
  lg: {
    fontSize: '1.125rem',
    lineHeight: `${HEIGHT.lg - BORDER_WIDTH * 2}px`,
  },
} as const;

/** 좌우 패딩. */
const TEXT_PADDING = '0 1rem';

// size variants
export const size = styleVariants({
  sm: { height: `${HEIGHT.sm}px`, ...textMetrics.sm },
  md: { height: `${HEIGHT.md}px`, ...textMetrics.md },
  lg: { height: `${HEIGHT.lg}px`, ...textMetrics.lg },
});

// input 기본 스타일
export const input = style({
  width: '100%',
  // 단일 줄의 HEIGHT - BORDER_WIDTH * 2 역산과 autoResize의 테두리 보정이 border-box를
  // 전제한다. 소비처 리셋에 맡기지 않고 명시한다.
  boxSizing: 'border-box',
  padding: TEXT_PADDING,
  border: `${BORDER_WIDTH}px solid ${themeContract.color.text.secondary}`,
  // 토큰 base(0.5rem)와 px로 같다. 입력칸 높이와 테두리가 px 고정이라 반경도 px로 둔다.
  borderRadius: '8px',
  backgroundColor: themeContract.color.background.paper,
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  outline: 'none',
  transition: `background-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, border-color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}`,

  selectors: {
    '&::placeholder': {
      color: themeContract.color.text.secondary,
    },
    '&:hover:not(:disabled)': {
      borderColor: themeContract.color.primary.main,
    },
    // 사용자 요구(M5 task-15): 클릭 때 테두리를 따라 굵은 색선이 붙는 것을 걷고,
    // 클릭·키보드 모두 호버와 같은 테두리 색으로 둔다. 포커스 표시는 테두리 색
    // 변화와 캐럿이 맡는다(WCAG 2.4.7). :focus-visible이 아니라 :focus인 이유는
    // 마우스 클릭도 같은 모양이어야 해서다.
    '&:focus': {
      borderColor: themeContract.color.primary.main,
    },
    '&:disabled': {
      backgroundColor: themeContract.color.surface.default,
      color: themeContract.color.text.disabled,
      borderColor: themeContract.color.border.default,
      cursor: 'not-allowed',
    },
    '&:disabled::placeholder': {
      color: themeContract.color.text.disabled,
    },
    '&:read-only:not(:disabled)': {
      backgroundColor: themeContract.color.surface.default,
      borderColor: themeContract.color.border.strong,
      cursor: 'default',
    },
    // 읽기 전용은 위 규칙(특정도 0,3,0)이 :focus(0,2,0)를 이겨 포커스 때 테두리가
    // 안 변하고, 캐럿도 없어 위치가 안 보인다(WCAG 2.4.7). 포커스 색을 되돌려 놓는다.
    '&:read-only:not(:disabled):focus': {
      borderColor: themeContract.color.primary.main,
    },
  },
});

/**
 * 여러 줄(textarea). 글자 크기는 단일 줄 size와 같은 값이고, 높이는 `rows`가 정한다.
 * 단일 줄은 height로 세로 중앙을 잡아 세로 패딩이 없으므로, 여러 줄만 세로 패딩을
 * 따로 갖는다(단일 줄에 대응하는 값이 없어, 합치기 전 여러 줄 입력의 값을 그대로 쓴다). `input` 뒤에 정의해 같은 특정도에서 padding을 덮는다.
 */
export const multilineSize = styleVariants({
  sm: { fontSize: textMetrics.sm.fontSize, padding: '0.5rem 1rem' },
  md: { fontSize: textMetrics.md.fontSize, padding: '0.75rem 1rem' },
  lg: { fontSize: textMetrics.lg.fontSize, padding: '1rem 1rem' },
});

export const multiline = style({
  lineHeight: 1.5,
  resize: 'none',
});

// error 상태
export const error = style({
  borderColor: `${themeContract.color.error.main} !important`,
});

// success 상태. 테두리는 success.dark다(main은 흰 바탕 대비 2.77:1이라 테두리 3:1에 못 미친다).
// 호버·포커스 테두리 색을 이겨야 해서 error와 같이 !important를 쓴다.
export const success = style({
  borderColor: `${themeContract.color.success.dark} !important`,
});

// 오류가 걸릴 때 입력칸이 좌우로 짧게 흔들린다(모션 UI M46 shake-error의 키프레임).
// 위치값(-2·4·-7·7px)은 토큰 스케일에 없는 연출 고유 거리라 리터럴이다: 10%·90%가 -2px,
// 20%·80%가 +4px, 30%·50%·70%가 -7px, 40%·60%가 +7px로 점점 커졌다 잦아든다.
// 한 번 도는 마운트형 모션이라 되돌아갈 상태가 없다(조항 1 밖). fill-mode가 없어 축소
// 모션(0.01ms, 1회)에서는 흔들림이 사라지고 빨강만 남는다.
const shakeFrames = {
  '10%, 90%': { transform: 'translateX(-2px)' },
  '20%, 80%': { transform: 'translateX(4px)' },
  '30%, 50%, 70%': { transform: 'translateX(-7px)' },
  '40%, 60%': { transform: 'translateX(7px)' },
} as const;
// 같은 오류가 다시 걸릴 때 애니메이션이 처음부터 다시 돌려면 animation-name이 바뀌어야 한다.
// 키프레임 이름이 다른 클래스 둘을 번갈아 건다(TextField.tsx의 useErrorShake).
const shakeA = keyframes(shakeFrames);
const shakeB = keyframes(shakeFrames);

// 길이는 duration 토큰 중 원본(0.42초)에 가장 가까운 slower(500ms)다.
export const shake = styleVariants({
  a: {
    animation: `${shakeA} ${themeContract.animation.duration.slower} ${themeContract.animation.easing.drift}`,
  },
  b: {
    animation: `${shakeB} ${themeContract.animation.duration.slower} ${themeContract.animation.easing.drift}`,
  },
});
