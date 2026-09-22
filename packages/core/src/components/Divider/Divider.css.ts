import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

export const divider = style({
  display: 'flex',
  alignItems: 'center',
  border: 0,
  color: themeContract.color.text.secondary,
  fontSize: themeContract.font.size.sm,
  fontWeight: themeContract.font.weight.medium,
});

// 중앙(또는 텍스트)에서 양끝으로 그어진다(장식계, 명제 §3) — 마운트 1회이고
// 되돌아갈 상태가 없어 조항 1 밖이다(공통 제약 §2). @keyframes +
// animation-fill-mode가 맞는 도구다. 얇은 선이라 "안 쓰는 축" 스케일은
// 육안으로 안 보여서, scale(0) 하나로 가로/세로/텍스트 두 줄 네 경우를 전부
// 커버한다 — origin만 케이스마다 바꾼다(완료 조건 5: keyframes 총 1개).
// 축소 모드(공통 제약 §6): base가 scaleX(1)/scaleY(1)(최종 상태)이고 0%만
// scale(0)이다 — duration이 0.01ms로 줄어도 즉시 최종 길이가 보인다.
const grow = keyframes({
  '0%': { transform: 'scale(0)' },
});

export const orientationStyles = styleVariants({
  horizontal: {
    width: '100%',
    flexDirection: 'row',
    borderTop: `1px solid ${themeContract.color.border.default}`,
    transform: 'scaleX(1)',
    transformOrigin: 'center',
    animation: `${grow} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle} forwards`,
  },
  vertical: {
    height: '100%',
    flexDirection: 'column',
    borderLeft: `1px solid ${themeContract.color.border.default}`,
    minHeight: '100px',
    transform: 'scaleY(1)',
    transformOrigin: 'center',
    animation: `${grow} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle} forwards`,
  },
});

export const variantStyles = styleVariants({
  solid: {
    borderStyle: 'solid',
  },
  dashed: {
    borderStyle: 'dashed',
  },
  dotted: {
    borderStyle: 'dotted',
  },
});

export const spacingStyles = styleVariants({
  sm: {
    margin: `${themeContract.spacing[2]} 0`,
  },
  md: {
    margin: `${themeContract.spacing[4]} 0`,
  },
  lg: {
    margin: `${themeContract.spacing[6]} 0`,
  },
});

export const textAlignStyles = styleVariants({
  left: {
    justifyContent: 'flex-start',
  },
  center: {
    justifyContent: 'center',
  },
  right: {
    justifyContent: 'flex-end',
  },
});

export const dividerWithText = style({
  borderTop: 0,
  borderLeft: 0,
  position: 'relative',
  // 루트에도 orientationStyles의 animation이 얹히는데, 그대로 두면 flex
  // 컨테이너 전체(텍스트 포함)가 scale(0)에서 자라며 텍스트까지 찌그러뜨린다
  // — 텍스트 변형에서는 두 line div가 각자 자라므로 루트 애니메이션은 끈다.
  // 파일 뒤쪽 정의라 orientationStyles보다 캐스케이드에서 이긴다(같은 파일
  // 안 borderTop/borderLeft 0 처리와 동일한 관례).
  animation: 'none',
});

export const line = style({
  flex: 1,
  borderTop: `1px solid ${themeContract.color.border.default}`,
});

// 텍스트 변형의 두 line은 하나의 class로 origin을 공유할 수 없다 — 왼쪽 선은
// 오른쪽에서, 오른쪽 선은 왼쪽에서(=텍스트 쪽에서) 자라야 텍스트 양옆에
// 틈이 생기지 않는다(브리프 표). line은 그대로 두고 조합용 modifier 두 개로
// 나눈다.
export const lineBefore = style({
  transform: 'scaleX(1)',
  transformOrigin: 'right',
  animation: `${grow} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle} forwards`,
});

export const lineAfter = style({
  transform: 'scaleX(1)',
  transformOrigin: 'left',
  animation: `${grow} ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle} forwards`,
});

// 세로 + 텍스트 조합: lineVertical에는 flex:1이 없어(실측 결함, 모션과
// 무관) 이미 크기가 0으로 죽어 있다 — 완료 조건 2의 "네 경우"에서 제외된
// 판정(브리프 판정). 모션 배치라 레이아웃 결함은 고치지 않고 여기 기록만
// 한다 — M3 이관.
export const lineVertical = style({
  borderTop: 0,
  borderLeft: `1px solid ${themeContract.color.border.default}`,
});

export const textContent = style({
  padding: `0 ${themeContract.spacing[3]}`,
  whiteSpace: 'nowrap',
});

export const textContentVertical = style({
  padding: `${themeContract.spacing[3]} 0`,
  whiteSpace: 'nowrap',
});
