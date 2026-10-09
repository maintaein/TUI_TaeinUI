/** 한쪽에 돋는 눈금 개수. 양쪽 합 최대 10개. */
const TICKS_PER_SIDE = 5;

/** 트랙 폭 대비 눈금 최소 간격(%). step 간격이 이보다 촘촘하면 파생 간격을 쓴다. */
const MIN_TICK_GAP_PERCENT = 2;

/**
 * 중심 값 근방의 눈금 값 목록(중심 제외). step이 범위에 비해 너무 촘촘하면
 * `MIN_TICK_GAP_PERCENT`로 파생 간격을 써서 눈금이 붙지 않게 한다.
 */
export function computeTickValues(
  centerValue: number,
  min: number,
  max: number,
  step: number
): number[] {
  const range = max - min;
  if (range <= 0) return [];

  const stepGapPercent = (step / range) * 100;
  const interval =
    stepGapPercent >= MIN_TICK_GAP_PERCENT
      ? step
      : (MIN_TICK_GAP_PERCENT / 100) * range;
  if (interval <= 0) return [];

  const values: number[] = [];
  for (let i = 1; i <= TICKS_PER_SIDE; i += 1) {
    const left = centerValue - i * interval;
    const right = centerValue + i * interval;
    if (left >= min) values.push(left);
    if (right <= max) values.push(right);
  }
  return values;
}
