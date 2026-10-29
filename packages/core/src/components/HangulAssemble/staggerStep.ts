import { gsapDuration } from '../../tokens/gsapEasing';

/** 글자 칸마다 시작을 늦추는 간격. fast(150ms)의 0.4배 = 60ms, 열 글자가 0.5초 안에 이어지는 속도 */
export const STAGGER = gsapDuration.fast * 0.4;

/** 한 음절 안에서 조각이 어긋나 닿는 간격. fast(150ms)의 0.2배 = 30ms, 음절 간격(60ms)의 절반이라 한 음절의 조각이 차례로 닿는 게 보인다 */
export const PIECE_STAGGER = gsapDuration.fast * 0.2;

/** 긴 문장도 첫 칸부터 끝 칸까지 1초(slower의 2배) 안에 시작한다 */
export const MAX_SPREAD = gsapDuration.slower * 2;

/** 칸 수에 맞춘 시작 간격. 짧은 문장은 STAGGER, 긴 문장은 전체 폭이 MAX_SPREAD를 넘지 않게 줄인다 */
export const staggerStep = (cells: number): number =>
  cells > 1 ? Math.min(STAGGER, MAX_SPREAD / (cells - 1)) : 0;
