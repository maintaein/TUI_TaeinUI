import type { StyleRule } from '@vanilla-extract/css';
import { themeContract } from './theme.css';

/**
 * 포커스 링 유틸.
 *
 * 왜: 포커스 표시가 15개 `:focus-visible` 규칙에 흩어져 굵기가 3px/2px로
 * 갈렸고, 폼 컨트롤 4종(TextField·TextArea 등)의 halo(rgba(25, 118, 210, 0.16))는
 * 대비 1.12~1.23:1이라 포커스 표시 구실을 못 한다. 값을 하나씩 고치면 다음
 * 컴포넌트에서 또 갈라지므로, 폭·색·offset·box-shadow를 여기 한 곳에서 결정한다.
 *
 * 대비 계약: `color.border.focus`(#1976D2) 대비 `background.default`(#FFFFFF)
 * = 4.6:1 — WCAG 1.4.11의 3:1을 넘긴다. 굵기·offset은 기존 15개 규칙 중 가장
 * 흔한 값(2px/2px)을 그대로 쓴다 — 이미 3:1을 넘기므로 올릴 이유가 없다.
 *
 * 사용: `':focus-visible': focusRing` 또는
 * `selectors: { '&:focus-visible': focusRing }`처럼 그대로 쓰거나, outline이
 * 클리핑되는 자리는 `boxShadow`만 스프레드한다.
 *
 * 이 파일은 유틸만 정의한다. 기존 15개 규칙을 이걸로 바꾸는 것은 이 단계의
 * 범위 밖이라, 이 파일을 추가해도 렌더 결과는 변하지 않는다.
 */
export const focusRing: StyleRule = {
  outline: `2px solid ${themeContract.color.border.focus}`,
  outlineOffset: '2px',
  boxShadow: `0 0 0 2px ${themeContract.color.border.focus}`,
};
