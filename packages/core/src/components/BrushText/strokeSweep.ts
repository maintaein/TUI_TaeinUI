import {
  HORIZONTAL,
  VERTICAL,
  type Polygon,
} from '../../_internal/jamoRegions';

/** 붓이 쓸고 지나가는 방향: 왼→오, 위→아래, 왼쪽 위→오른쪽 아래 */
export type Sweep = 'right' | 'down' | 'diagonal';

/**
 * 자모의 쓸기 방향. 가로획이 주인인 모음은 왼→오, 세로획이 주인인 모음은 위→아래.
 * 자음과 섞인 모음(ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ)은 대각선이다. ㄱ자 영역을 대각선이 가로 부분과 세로 부분을 대략 순서대로 지난다.
 */
export const strokeDirection = (jamo: string): Sweep =>
  [...HORIZONTAL].includes(jamo)
    ? 'right'
    : [...VERTICAL].includes(jamo)
      ? 'down'
      : 'diagonal';

/** CSS `linear-gradient`의 첫 인자. 대각선은 모서리 키워드라 칸이 정사각형이 아니어도 등고선이 반대 대각선과 나란하다 */
export const SWEEP_GRADIENT: Record<Sweep, string> = {
  right: 'to right',
  down: 'to bottom',
  diagonal: 'to bottom right',
};

/**
 * 영역이 쓸기 방향의 어느 구간(0~1)에 놓이는가. 마스크 진행을 이 구간에 걸어야
 * 영역 밖을 지나는 시간이 헛돌지 않는다. 위치 t는 right는 x, down은 y, diagonal은 (x + y) / 2다.
 */
export const sweepSpan = (
  region: Polygon,
  sweep: Sweep
): readonly [from: number, to: number] => {
  const ts = region.map(([x, y]) =>
    sweep === 'right' ? x : sweep === 'down' ? y : (x + y) / 2
  );
  return [Math.min(...ts), Math.max(...ts)];
};
