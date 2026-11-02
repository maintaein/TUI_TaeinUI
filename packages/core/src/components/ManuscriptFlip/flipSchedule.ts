import { gsapDuration } from '../../tokens/gsapEasing';

/** 칸 한 변의 목표. 설계서의 40~56px 가운데다. 열·행을 정수로 맞추면 실제 한 변이 이 근처에서 움직인다 */
const CELL_TARGET = 48;

/** 칸 수 상한. 큰 상자에서는 칸을 키워 프레임 예산(칸마다 타일 하나)을 지킨다 */
export const MAX_CELLS = 48;

/** 전체 길이는 칸 수와 상관없이 700ms로 고정한다. 칸 하나(base 200ms)의 3.5배다 */
export const FLIP_TOTAL = gsapDuration.base * 3.5;

/** 상자 크기에서 열·행을 정한다. 한 변이 CELL_TARGET에 가깝게 나누고, 상한을 넘으면 칸을 키운다 */
export const gridFor = (
  width: number,
  height: number
): { cols: number; rows: number } => {
  let size = CELL_TARGET;
  for (;;) {
    const cols = Math.max(1, Math.round(width / size));
    const rows = Math.max(1, Math.round(height / size));
    if (cols * rows <= MAX_CELLS) return { cols, rows };
    size *= 1.05;
  }
};

/**
 * 칸 인덱스(글 쓰는 순서: 왼쪽에서 오른쪽, 윗줄에서 아랫줄)별 시작 시각(초).
 * 첫 칸이 0, 마지막 칸이 전체에서 칸 하나를 뺀 500ms에 시작하게 같은 간격으로 놓는다. 칸이 하나면 0이다.
 */
export const cellStarts = (count: number): number[] => {
  const gap = count > 1 ? (FLIP_TOTAL - gsapDuration.base) / (count - 1) : 0;
  return Array.from({ length: count }, (_, i) => i * gap);
};

/** 시각 time에 뒤집힌 것으로 치는 칸 수. 칸은 시작한 뒤 반쯤(base의 절반) 돌았을 때 바뀐다. 시작 시각이 단조라 앞에서부터 센다 */
export const flippedCount = (starts: readonly number[], time: number): number =>
  starts.filter((start) => start + gsapDuration.base / 2 <= time).length;

const pct = (value: number) => `${Number(value.toFixed(3))}%`;

/**
 * 앞 k칸(글 쓰는 순서)이 뒤집혔을 때 두 면의 clip-path.
 * 뒤집힌 영역은 윗줄들과 다음 줄의 앞쪽 칸들이라 계단 모양 다각형 하나다. 앞면은 그 보수다.
 * 퍼센트만 써서 상자 크기가 바뀌어도 다시 계산하지 않는다.
 * ponytail: 두 면의 경계 안티앨리어싱이 한 줄 겹쳐 가는 실선이 비칠 수 있다, 눈에 띄면 뒷면 영역을 1px 넓힌다
 */
export const maskClips = (
  k: number,
  cols: number,
  rows: number
): { front: string; back: string } => {
  const hidden = 'polygon(0% 0%, 0% 0%, 0% 0%)';
  if (k <= 0) return { front: 'none', back: hidden };
  if (k >= cols * rows) return { front: hidden, back: 'none' };
  const x = pct(((k % cols) / cols) * 100);
  const y1 = pct((Math.floor(k / cols) / rows) * 100);
  const y2 = pct(((Math.floor(k / cols) + 1) / rows) * 100);
  return {
    back: `polygon(0% 0%, 100% 0%, 100% ${y1}, ${x} ${y1}, ${x} ${y2}, 0% ${y2})`,
    front: `polygon(${x} ${y1}, 100% ${y1}, 100% 100%, 0% 100%, 0% ${y2}, ${x} ${y2})`,
  };
};
