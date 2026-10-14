import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 값 교체 애니메이션: "새 값이 들어오고 헌 값이 나간다"(상태계,
// M2-모션-번역 §상태계, task-3c-brief.md 「Badge」). 값마다 key를 갖는 span
// 두 개(valueCurrent·valueExiting) + 교체 전용 @keyframes 두 벌이 유일한
// CSS-only 경로다(Badge.tsx 참고) — 등장·퇴장이 같은 축(translateY)을 같은
// 방향으로 계속 움직이는 컨베이어라, 하나를 역재생해서는 반대쪽 도착
// 위치로 되돌아갈 뿐 빠져나가지 않는다. 그래서 조항 3의
// "퇴장용 애니메이션을 따로 만들지 않는다"를 문자 그대로 재사용이 아니라
// "새 제스처를 만들지 않는다"로 읽었다 — 두 keyframes 다 translateY+opacity
// 뿐이고 값도 100%가 같다. 방향은 --badge-dir 하나로 정한다: 기본 1이면 새
// 값이 아래에서 올라오고 헌 값이 위로 빠진다(값이 늘 때). directionDown이
// -1로 뒤집으면 새 값이 위에서 내려오고 헌 값이 아래로 빠진다(값이 줄 때).
//
// 조항 1(상태 전이는 중단·역재생 가능해야 하고 일회성 @keyframes는 금지다)
// 위반이 아니다: React가 숫자를 교체할 때 텍스트 노드만 바뀌고 마운트
// 시점의 스타일이 이미 최종 상태라 CSS 전이로 표현할 수 없다. Badge.tsx가
// key를 값에 묶어 강제로 재마운트하는데, 이 시점에 헌 값은 이미 DOM에서
// 사라진 뒤이고 되돌아갈 대상이 없다 — 전이가 아니라 교체다.
//
// 축소 모드: base 스타일이 최종 표시 상태여야 한다(공통 제약 §6). 등장은
// transform·opacity를 base에 따로 선언하지 않으면 초기값(none/1)이 곧 최종
// 상태이므로 0% 프레임만 두면 된다 — 100% 프레임을 쓰면 base와 값이
// 어긋날 위험이 생기고, duration이 0.01ms로 줄 때 새 값이 사라질 수 있다.
const valueEnter = keyframes({
  '0%': {
    transform: 'translateY(calc(100% * var(--badge-dir, 1)))',
    opacity: 0,
  },
});

// 퇴장은 등장과 거울 대칭이다: base 스타일 자체가 "이미 사라진 뒤" 상태고
// (translateY(-100%)·opacity 0, 방향이 뒤집히면 +100%), 0% 프레임만 "아직 보이는" 시작 상태를
// 준다. 축소 모드에서 duration이 0.01ms로 줄면 거의 즉시 사라진 상태가
// 되는데, 그게 바로 우리가 원하는 동작이다(퇴장이니 사라지는 게 맞다).
//
// 이 노드는 언마운트 직전까지만 존재하는 일시적 노드다(Badge.tsx의
// onAnimationEnd가 제거한다). base가 이미 "퇴장 완료" 상태와 같은 값이라
// 애니메이션이 끝나고 되돌아갈 자리가 정지 위치(가운데)가 아니라 그대로
// 퇴장 위치다 — 한 프레임이라도 제자리로 스냅백했다가 사라지는 경우가
// 없다. fill-mode: forwards는 그 위에 얹는 보험이다.
const valueExit = keyframes({
  '0%': {
    transform: 'translateY(0)',
    opacity: 1,
  },
});

export const badge = style({
  display: 'inline-grid',
  placeItems: 'center',
  // 퇴장 노드가 위로 밀려나가는 동안 알약 밖으로 삐져나오지 않게 자른다.
  overflow: 'hidden',
  fontFamily: themeContract.font.family.sans,
  fontWeight: themeContract.font.weight.semibold,
  // 짧은 대문자 라벨(SIZED, RISK_REJECTED 등)은 기본 자간에서 글자가 뭉친다.
  letterSpacing: themeContract.font.letterSpacing.wide,
  borderRadius: themeContract.borderRadius.full,
  whiteSpace: 'nowrap',
  transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  lineHeight: 1,
  minWidth: '20px',
});

// 현재 값. 같은 그리드 칸(1/1)에 퇴장 노드와 겹쳐 쌓인다.
export const valueCurrent = style({
  gridArea: '1 / 1',
  animation: `${valueEnter} ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
});

// 퇴장 중인 헌 값. 조항 3: duration은 등장의 60~70%(calc 관례 — 리터럴은
// :root 축소 모드 오버라이드를 따라가지 못한다), 커브는 가속(easing.exit).
export const valueExiting = style({
  gridArea: '1 / 1',
  transform: 'translateY(calc(-100% * var(--badge-dir, 1)))',
  opacity: 0,
  animation: `${valueExit} calc(${themeContract.animation.duration.base} * 0.65) ${themeContract.animation.easing.exit} forwards`,
});

export const variantStyles = styleVariants({
  primary: {
    backgroundColor: themeContract.color.primary.main,
    color: themeContract.color.primary.contrast,
  },
  secondary: {
    backgroundColor: themeContract.palette.gray[600],
    color: themeContract.color.primary.contrast,
  },
  success: {
    backgroundColor: themeContract.color.success.main,
    color: themeContract.color.success.contrast,
  },
  error: {
    backgroundColor: themeContract.color.error.main,
    color: themeContract.color.error.contrast,
  },
  warning: {
    backgroundColor: themeContract.color.warning.main,
    color: themeContract.color.warning.contrast,
  },
});

export const sizeStyles = styleVariants({
  sm: {
    fontSize: themeContract.font.size['2xs'],
    padding: '2px 6px',
    minWidth: '16px',
    height: '16px',
  },
  md: {
    fontSize: themeContract.font.size.xs,
    padding: '3px 8px',
    minWidth: '20px',
    height: '20px',
  },
  lg: {
    fontSize: themeContract.font.size.sm,
    padding: '4px 10px',
    minWidth: '24px',
    height: '24px',
  },
});

export const dotStyles = style({
  padding: 0,
  minWidth: '8px',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
});

// 값이 줄어든 교체: 같은 두 keyframes의 방향 부호를 뒤집는다.
export const directionDown = style({
  vars: { '--badge-dir': '-1' },
});
