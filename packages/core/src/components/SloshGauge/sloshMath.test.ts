import { describe, it, expect } from 'vitest';
import {
  BOWL_H,
  MAX_BUBBLES,
  MAX_DT,
  agitation,
  createSim,
  levelForFill,
  scenePaths,
  settleSim,
  smoothPath,
  stepSlosh,
  surfaceY,
  type SloshSim,
} from './sloshMath';

const FRAME = 1 / 60;
const LOW = levelForFill(0.2);
const HIGH = levelForFill(0.9);

/** 목표로 간 시뮬레이션을 초 단위로 돌리며 프레임마다 훑는다 */
const run = (
  sim: SloshSim,
  target: number,
  seconds: number,
  each?: (sim: SloshSim, t: number) => void,
  random?: () => number
) => {
  for (let i = 1; i <= Math.round(seconds / FRAME); i += 1) {
    stepSlosh(sim, target, FRAME, random);
    each?.(sim, i * FRAME);
  }
};

/** 물결 위상 한 바퀴를 평균 내 잔물결을 지우고 기울기와 수위만 남긴다 */
const meanSurface = (x: number, sim: SloshSim) => {
  const n = 16;
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    sum += surfaceY(x, { ...sim, phase: (2 * Math.PI * i) / n }, 'front');
  }
  return sum / n;
};

describe('levelForFill: 넓이 기준 수위', () => {
  it('비어 있으면 0, 가득이면 1이고 범위 밖은 잘린다', () => {
    expect(levelForFill(0)).toBe(0);
    expect(levelForFill(1)).toBeCloseTo(1, 2);
    expect(levelForFill(-3)).toBe(0);
    expect(levelForFill(7)).toBeCloseTo(1, 2);
  });

  // 되돌리면 빨개지는 것: 높이 기준(levelForFill = fill)으로 되돌리면 0.5가 0.5가 되어 빨개진다
  it('아래가 넓은 물방울이라 넓이 50%의 수면은 높이 중간보다 아래다', () => {
    expect(levelForFill(0.5)).toBeLessThan(0.45);
    expect(levelForFill(0.5)).toBeGreaterThan(0.3);
  });

  it('채움이 늘면 수위도 늘고 위로 갈수록 같은 채움이 높이를 더 올린다', () => {
    let before = -1;
    for (let f = 0; f <= 1; f += 0.05) {
      const level = levelForFill(f);
      expect(level).toBeGreaterThan(before);
      before = level;
    }
    expect(levelForFill(1) - levelForFill(0.9)).toBeGreaterThan(
      levelForFill(0.1) - levelForFill(0)
    );
  });
});

describe('수위 용수철', () => {
  // 되돌리면 빨개지는 것: 감쇠를 키워 과감쇠로 만들면 넘침이 0이 되어 빨개진다
  it('목표를 10~25% 넘었다 돌아오고 1.5초 안에 잔잔해진다', () => {
    const sim = createSim(LOW);
    const step = HIGH - LOW;
    let peak = 0;
    let lastUnsettled = 0;
    run(sim, HIGH, 5, (s, t) => {
      peak = Math.max(peak, (s.level - HIGH) / step);
      if (Math.abs(s.level - HIGH) > 0.005 * step) lastUnsettled = t;
    });
    expect(peak).toBeGreaterThan(0.1);
    expect(peak).toBeLessThan(0.25);
    expect(lastUnsettled).toBeLessThan(1.5);
    expect(lastUnsettled).toBeGreaterThan(0.6);
  });

  it('내려갈 때는 목표 밑으로 넘었다 돌아온다', () => {
    const sim = createSim(HIGH);
    let low = HIGH;
    run(sim, LOW, 3, (s) => {
      low = Math.min(low, s.level);
    });
    expect(low).toBeLessThan(LOW);
    expect(sim.level).toBeCloseTo(LOW, 3);
  });
});

describe('수면 기울기', () => {
  // 되돌리면 빨개지는 것: 기울기 목표의 부호를 바꾸면 오를 때 오른쪽이 높아져 빨개진다
  it('오를 때는 왼쪽이 높고 내릴 때는 왼쪽이 낮다', () => {
    const up = createSim(LOW);
    run(up, HIGH, 0.2);
    expect(meanSurface(5, up)).toBeLessThan(meanSurface(95, up));

    const down = createSim(HIGH);
    run(down, LOW, 0.2);
    expect(meanSurface(5, down)).toBeGreaterThan(meanSurface(95, down));
  });

  it('큰 변화의 정점에서 15~20도 기울고 잔잔해지면 평평하다', () => {
    const sim = createSim(LOW);
    let maxSlope = 0;
    run(sim, HIGH, 3, (s) => {
      maxSlope = Math.max(maxSlope, Math.abs(s.tilt));
    });
    const deg = (Math.atan(maxSlope) * 180) / Math.PI;
    expect(deg).toBeGreaterThan(12);
    expect(deg).toBeLessThan(20.5);
    expect(Math.abs(sim.tilt)).toBeLessThan(0.005);
  });
});

describe('dt 묶기', () => {
  // 되돌리면 빨개지는 것: MAX_DT 자르기를 빼면 10초짜리 한 걸음이 수위를 크게 날려 빨개진다
  it('탭 복귀처럼 간격이 아주 커도 한 걸음은 MAX_DT만큼만 간다', () => {
    const huge = createSim(LOW);
    stepSlosh(huge, HIGH, 10);
    const capped = createSim(LOW);
    stepSlosh(capped, HIGH, MAX_DT);
    expect(huge.level).toBe(capped.level);
    stepSlosh(huge, HIGH, Number.POSITIVE_INFINITY);
    expect(Number.isFinite(huge.level)).toBe(true);
  });

  it('음수 간격은 아무것도 움직이지 않는다', () => {
    const sim = createSim(LOW);
    stepSlosh(sim, HIGH, -1);
    expect(sim.level).toBe(LOW);
  });
});

describe('거품', () => {
  // 되돌리면 빨개지는 것: 상한 검사를 빼면 난수가 늘 0일 때 8개를 넘어 빨개진다
  it('어떤 입력에서도 8개를 넘지 않는다', () => {
    const sim = createSim(LOW);
    let most = 0;
    // 난수가 늘 0이면 문턱을 넘는 매 프레임마다 거품이 생긴다(최악)
    for (let i = 0; i < 20; i += 1) {
      run(
        sim,
        i % 2 ? LOW : 1,
        0.4,
        (s) => {
          most = Math.max(most, s.bubbles.length);
        },
        () => 0
      );
    }
    expect(most).toBe(MAX_BUBBLES);
  });

  it('쉬는 동안에는 한 개도 없다', () => {
    const sim = createSim(HIGH);
    let most = 0;
    run(
      sim,
      HIGH,
      10,
      (s) => {
        most = Math.max(most, s.bubbles.length);
      },
      () => 0
    );
    expect(most).toBe(0);
  });

  it('크게 흔들리면 생기고 잔잔해지면 수면 아래에서 모두 사라진다', () => {
    const sim = createSim(LOW);
    let most = 0;
    run(
      sim,
      HIGH,
      1.5,
      (s) => {
        most = Math.max(most, s.bubbles.length);
      },
      () => 0
    );
    expect(most).toBeGreaterThan(0);
    run(sim, HIGH, 6, undefined, () => 0);
    expect(sim.bubbles).toHaveLength(0);
  });

  it('작은 변화(1%)로는 문턱을 넘지 않아 생기지 않는다', () => {
    const sim = createSim(levelForFill(0.5));
    let most = 0;
    run(
      sim,
      levelForFill(0.51),
      3,
      (s) => {
        most = Math.max(most, s.bubbles.length);
      },
      () => 0
    );
    expect(most).toBe(0);
  });
});

describe('값이 계속 바뀔 때', () => {
  // 되돌리면 빨개지는 것: 진폭을 상태에 더해 쌓게 바꾸면 수위가 범위를 크게 벗어나 빨개진다
  it('100ms마다 목표를 갈아도 흔들림이 쌓여 커지지 않고 마지막 변경 1.5초 뒤 잔잔하다', () => {
    const sim = createSim(0);
    let lowest = 0;
    let highest = 0;
    let top = 0;
    for (let i = 0; i < 40; i += 1) {
      run(sim, i % 2 ? 0 : 1, 0.1, (s) => {
        lowest = Math.min(lowest, s.level);
        highest = Math.max(highest, s.level);
        top = Math.max(top, agitation(s));
      });
    }
    expect(lowest).toBeGreaterThan(-0.3);
    expect(highest).toBeLessThan(1.3);
    expect(top).toBeLessThanOrEqual(1);
    run(sim, 0, 1.5);
    expect(sim.level).toBeCloseTo(0, 2);
    expect(agitation(sim)).toBeLessThan(0.02);
  });
});

describe('수면과 그릇', () => {
  it('쉬는 잔물결은 그릇 높이의 1~2%다', () => {
    const sim = createSim(levelForFill(0.5));
    const ys = Array.from({ length: 101 }, (_, x) => surfaceY(x, sim, 'front'));
    const amp = (Math.max(...ys) - Math.min(...ys)) / 2;
    expect(amp / BOWL_H).toBeGreaterThan(0.01);
    expect(amp / BOWL_H).toBeLessThan(0.02);
  });

  it('쉬는 동안에도 물결이 흐른다(위상이 늘 나아간다)', () => {
    const sim = createSim(levelForFill(0.5));
    const before = surfaceY(30, sim, 'front');
    run(sim, sim.level, 0.5);
    expect(surfaceY(30, sim, 'front')).not.toBeCloseTo(before, 3);
  });

  it('빈 그릇에서는 물결이 바닥 밖으로 드러나지 않는다', () => {
    expect(surfaceY(30, createSim(0), 'front')).toBe(BOWL_H);
  });

  it('calm이면 수면이 평평하고 그릇도 가만하며 거품이 없다', () => {
    const sim = createSim(LOW);
    run(sim, HIGH, 0.3, undefined, () => 0);
    const scene = scenePaths(sim, true);
    expect(scene.bubbles).toEqual([]);
    expect(scene.bowl).toContain('rotate(0.000 ');
    expect(scene.bowl).toContain('scale(1.0000 1.0000)');
    const ys = [0, 25, 50, 75, 100].map((x) => surfaceY(x, sim, 'front', true));
    expect(new Set(ys).size).toBe(1);
  });

  // 되돌리면 빨개지는 것: 기울기·늘어남 상한을 풀면 1도 남짓, 1% 미만 단언이 빨개진다
  it('그릇은 큰 변화에서도 1도 남짓 기울고 1% 미만 늘어난다', () => {
    const sim = createSim(LOW);
    let angle = 0;
    let stretch = 0;
    run(sim, HIGH, 2, (s) => {
      const { bowl } = scenePaths(s);
      angle = Math.max(
        angle,
        Math.abs(Number(/rotate\((-?[\d.]+)/.exec(bowl)?.[1]))
      );
      stretch = Math.max(
        stretch,
        Number(/scale\([\d.]+ ([\d.]+)\)/.exec(bowl)?.[1]) - 1
      );
    });
    expect(angle).toBeGreaterThan(0.8);
    expect(angle).toBeLessThanOrEqual(1.25);
    expect(stretch).toBeGreaterThan(0.004);
    expect(stretch).toBeLessThan(0.01);
  });

  it('settleSim은 수위만 바로 두고 속도를 0으로 한다', () => {
    const sim = createSim(LOW);
    run(sim, HIGH, 0.2);
    const tilt = sim.tilt;
    settleSim(sim, HIGH);
    expect(sim.level).toBe(HIGH);
    expect(sim.speed).toBe(0);
    expect(sim.tilt).toBe(tilt);
  });
});

describe('smoothPath', () => {
  it('점을 모두 지나는 베지어 곡선이고 직선 조각이 없다', () => {
    const points: Array<[number, number]> = [
      [0, 10],
      [10, 0],
      [20, 10],
      [30, 0],
    ];
    const d = smoothPath(points);
    expect(d.startsWith('M0 10.00')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(3);
    expect(d).not.toContain('L');
    expect(d.endsWith('30 0.00')).toBe(true);
  });

  it('수면 테두리 곡선은 직선 조각 없이 곡선 명령으로만 이어진다', () => {
    const { rim } = scenePaths(createSim(0.5));
    expect(rim).not.toContain('L');
    expect(rim.match(/C/g)?.length).toBeGreaterThan(10);
  });
});
