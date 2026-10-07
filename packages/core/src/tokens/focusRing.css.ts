import type { StyleRule } from '@vanilla-extract/css';
import { themeContract } from './theme.css';

/**
 * 포커스 링 유틸.
 *
 * 왜: 포커스 표시가 18개 `:focus-visible` 규칙에 흩어져 굵기가 3px/2px로
 * 갈렸고, 폼 컨트롤의 halo(rgba(25, 118, 210, 0.16))는 대비 1.12~1.23:1이라
 * 포커스 표시 구실을 못 한다(그 뒤 TextField는 M5 task-15에서 halo를 걷었고,
 * NumericSpinner·Checkbox·Switch가 halo를 계속 쓴다). 값을 하나씩 고치면 다음
 * 컴포넌트에서 또 갈라지므로, 폭·색·offset을 여기 한 곳에서 결정한다.
 *
 * 대비 계약: `color.border.focus`(#1976D2) 대비 `background.default`(#FFFFFF)
 * = 4.6:1 — WCAG 1.4.11의 3:1을 넘긴다. 굵기·offset은 기존 18개 규칙 중 가장
 * 흔한 값(2px/2px)을 그대로 쓴다 — 이미 3:1을 넘기므로 올릴 이유가 없다.
 *
 * 색을 파라미터로 두는 이유: `currentColor`를 쓰는 자리(Chip 삭제 버튼·Snackbar
 * 닫기 버튼)가 실제로 있다. 상수로 두면 그 두 곳이 outline을 손으로 다시 쓰게
 * 되고, 이 유틸이 없애려는 굵기 축이 다시 갈라진다.
 *
 * 사용: `':focus-visible': focusRing()` 또는
 * `selectors: { '&:focus-visible': focusRing() }`. offset을 벗어나는 자리는
 * `{ ...focusRing(), outlineOffset: '-2px' }`처럼 눈에 보이게 덮는다.
 *
 * 이 파일은 유틸만 정의한다. `boxShadow`는 두지 않는다 — outline과 함께
 * 스프레드하면 halo를 가진 폼 컨트롤에서 halo를 덮어써 지운다.
 */
export const focusRing = (
  color: string = themeContract.color.border.focus
): StyleRule => ({
  outline: `2px solid ${color}`,
  outlineOffset: '2px',
});
