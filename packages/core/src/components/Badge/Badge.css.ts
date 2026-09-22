import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

// 값 교체 진입 애니메이션 — "새 값이 들어오고 헌 값이 위로 나간다"(상태계,
// M2-모션-번역 §상태계).
//
// 조항 1(상태 전이는 중단·역재생 가능해야 하고 일회성 @keyframes는 금지다)
// 위반이 아니다: React가 숫자를 교체할 때 텍스트 노드만 바뀌고 마운트
// 시점의 스타일이 이미 최종 상태라 CSS 전이로 표현할 수 없다. Badge.tsx가
// key를 값에 묶어 강제로 재마운트하는데, 이 시점에 헌 값은 이미 DOM에서
// 사라진 뒤이고 되돌아갈 대상이 없다 — 전이가 아니라 교체다.
//
// 축소 모드: base 스타일이 최종 표시 상태여야 한다(공통 제약 §6). transform·
// opacity를 base에 따로 선언하지 않으면 초기값(none/1)이 곧 최종 상태이므로
// 0% 프레임만 두면 된다 — 100% 프레임을 쓰면 base와 값이 어긋날 위험이
// 생기고, duration이 0.01ms로 줄 때 새 값이 사라질 수 있다.
const valueEnter = keyframes({
  '0%': {
    transform: 'translateY(100%)',
    opacity: 0,
  },
});

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: themeContract.font.family.sans,
  fontWeight: themeContract.font.weight.semibold,
  // 짧은 대문자 라벨(SIZED, RISK_REJECTED 등)은 기본 자간에서 글자가 뭉친다.
  letterSpacing: themeContract.font.letterSpacing.wide,
  borderRadius: '12px',
  whiteSpace: 'nowrap',
  transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  animation: `${valueEnter} ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`,
  lineHeight: 1,
  minWidth: '20px',
});

export const variantStyles = styleVariants({
  primary: {
    backgroundColor: `var(--badge-color, ${themeContract.color.primary.main})`,
    color: themeContract.color.primary.contrast,
  },
  secondary: {
    backgroundColor: `var(--badge-color, ${themeContract.palette.gray[600]})`,
    color: themeContract.color.primary.contrast,
  },
  success: {
    backgroundColor: `var(--badge-color, ${themeContract.color.success.main})`,
    color: themeContract.color.success.contrast,
  },
  error: {
    backgroundColor: `var(--badge-color, ${themeContract.color.error.main})`,
    color: themeContract.color.error.contrast,
  },
  warning: {
    backgroundColor: `var(--badge-color, ${themeContract.color.warning.main})`,
    color: themeContract.color.warning.contrast,
  },
  info: {
    backgroundColor: `var(--badge-color, ${themeContract.color.info.main})`,
    color: themeContract.color.info.contrast,
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
