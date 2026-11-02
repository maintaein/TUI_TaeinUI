import { describe, expect, it } from 'vitest';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import {
  BEAT,
  BEAT_END,
  NOZZLE_HEIGHT,
  NOZZLE_TUCK,
  WICK_LONGEST,
  crouchWeight,
  easeAt,
  rocketBeat,
} from './rocketBeat';

const GEOMETRY = { width: 120, height: 44, distance: 600 };
const beat = (t: number) => rocketBeat(t, GEOMETRY);
const range = (from: number, to: number, step: number) =>
  Array.from(
    { length: Math.floor((to - from) / step) + 1 },
    (_, i) => from + i * step
  );
// 이징은 토큰 이름을 직접 적어 기대값을 만든다(구현이 무엇을 골랐는지에서 기대값을 끌어오지 않는다)
const settle = (p: number) => easeAt(gsapEasing.settle, p);
// 발사 진행 p(0에서 1)의 시각
const launchAt = (p: number) => BEAT.launch + p * (BEAT.sent - BEAT.launch);
// 유한 차분으로 잰 이동 속도(px/ms). 위로 가는 것이 vy +
const velocity = (t: number, dt = 5) => {
  const a = beat(t - dt);
  const b = beat(t + dt);
  return { vx: (b.x - a.x) / (2 * dt), vy: -(b.y - a.y) / (2 * dt) };
};
// 입(분사구 아랫면)의 y: 몸체 밑면에서 덩이 높이 - 가려진 만큼 아래
// 분사구는 단추 폭 중심에서 좌우 30%(구현 상수를 끌어오지 않고 사용자 요구 값을 적는다)
const SIDE = 0.3;
const MOUTH_Y = GEOMETRY.height * (0.5 + NOZZLE_HEIGHT - NOZZLE_TUCK);

describe('rocketBeat 박자 (설계서 8절 로켓 전송, 승인 정지 피드백 뒤)', () => {
  it('단계는 0, 600, 2600, 5100ms에서 바뀌고 끝은 표지가 다 뜨는 5300ms다', () => {
    const at = (t: number) => beat(t).phase;
    expect(at(0)).toBe('emerge');
    expect(at(599)).toBe('emerge');
    expect(at(600)).toBe('build');
    expect(at(2599)).toBe('build');
    expect(at(2600)).toBe('launch');
    expect(at(5099)).toBe('launch');
    expect(at(5100)).toBe('sent');
    expect(BEAT_END).toBe(5300);
  });

  it('시간 경계는 토큰 시간의 배수에서 나오고 사용자가 정한 길이(분사구 slow 이상, 분출 1초 이상)를 넘는다', () => {
    const { slow, slower, base } = gsapDuration;
    expect(BEAT.build).toBe(2 * slow * 1000);
    expect(BEAT.launch).toBe(BEAT.build + 4 * slower * 1000);
    expect(BEAT.sent).toBe(BEAT.launch + 5 * slower * 1000);
    expect(BEAT_END).toBe(BEAT.sent + base * 1000);
    expect(BEAT.build - BEAT.emerge).toBeGreaterThanOrEqual(slow * 1000);
    expect(BEAT.launch - BEAT.build).toBeGreaterThan(1000);
  });

  describe('분사구 빠져나옴 (0~600ms)', () => {
    it('테두리 아래로 나온 정도가 0에서 서서히 1까지 단조 증가하고 그동안 분출도 연기도 없다', () => {
      expect(beat(0).nozzle).toBe(0);
      expect(beat(BEAT.build).nozzle).toBeCloseTo(1, 5);
      const values = range(0, BEAT.build, 20).map((t) => beat(t).nozzle);
      values.forEach((v, i) => {
        if (i > 0) expect(v).toBeGreaterThanOrEqual(values[i - 1]);
      });
      expect(beat(100).nozzle).toBeCloseTo(settle(100 / BEAT.build), 5);
      range(0, BEAT.build - 1, 20).forEach((t) => {
        const b = beat(t);
        expect(b.strength).toBe(0);
        expect(b.wick).toBe(0);
        expect(b.column).toBe(0);
        expect(b.smoke.ground.puffs).toHaveLength(0);
        expect(b.smoke.tail.puffs).toHaveLength(0);
      });
    });

    it('끝까지 나온 뒤에도 그대로 1이다', () => {
      range(BEAT.build, BEAT_END, 100).forEach((t) =>
        expect(beat(t).nozzle).toBeCloseTo(1, 5)
      );
    });
  });

  describe('서서히 분출 (600~2600ms)', () => {
    it('분출 세기가 0에서 1까지 단조 증가하고 급등이 없다', () => {
      expect(beat(BEAT.build).strength).toBe(0);
      expect(beat(BEAT.launch).strength).toBeCloseTo(1, 5);
      const values = range(BEAT.build, BEAT.launch, 20).map(
        (t) => beat(t).strength
      );
      values.forEach((v, i) => {
        if (i > 0) {
          expect(v).toBeGreaterThanOrEqual(values[i - 1]);
          // 20ms 한 걸음에 세기가 3%를 넘게 뛰지 않는다
          expect(v - values[i - 1]).toBeLessThan(0.03);
        }
      });
      // 시작 직후에는 거의 0이고 중간에서 절반이다
      expect(beat(BEAT.build + 100).strength).toBeLessThan(0.05);
      expect(beat(BEAT.build + 1000).strength).toBeCloseTo(0.5, 5);
    });

    it('단추는 발사 전까지 제자리다(떠오르거나 둥실거리거나 떨지 않는다)', () => {
      range(0, BEAT.launch, 50).forEach((t) => {
        const b = beat(t);
        expect([b.x, b.y, b.rotation, b.scale].map(Math.abs)).toEqual([
          0, 0, 0, 1,
        ]);
      });
    });

    it('심지는 분출 세기에 따라 단추 높이의 0.2~0.5배이고 시각 t의 함수로 빠르게 +-10% 깜빡인다', () => {
      expect(beat(BEAT.build).wick).toBe(0);
      const H = GEOMETRY.height;
      // 깜빡임을 걷어 낸 길이(세기로 0.2에서 0.5배)가 범위 안이다
      range(BEAT.build + 3, BEAT.launch + 300, 3).forEach((t) => {
        const b = beat(t);
        const base = H * (0.2 + 0.3 * b.strength);
        expect(b.wick).toBeGreaterThanOrEqual(base * 0.9 - 1e-9);
        expect(b.wick).toBeLessThanOrEqual(base * 1.1 + 1e-9);
        expect(b.wick).toBeLessThanOrEqual(H * WICK_LONGEST);
      });
      // 분출이 다 오르면 0.5배 둘레에서 +-10%를 실제로 오가고(깜빡임), 3ms 걸음(프레임보다 촘촘)에도 같은 시각이면 같은 값이다
      const lit = range(BEAT.launch, BEAT.launch + 300, 3).map(
        (t) => beat(t).wick
      );
      expect(Math.max(...lit)).toBeGreaterThan(H * 0.5 * 1.07);
      expect(Math.min(...lit)).toBeLessThan(H * 0.5 * 0.93);
      expect(beat(BEAT.launch + 33).wick).toBe(beat(BEAT.launch + 33).wick);
      // 한 프레임(16ms)에 길이가 눈에 띄게 바뀌는 빠른 깜빡임이다
      const swing = lit.slice(1).map((v, i) => Math.abs(v - lit[i]));
      expect(Math.max(...swing)).toBeGreaterThan(H * 0.01);
    });

    it('분출구 입 둘은 단추 폭 중심에서 좌우 30% 자리, 몸체 밑면 아래이고 기울기와 배율을 따라간다', () => {
      const rest = beat(BEAT.build + 500);
      const [l, r] = rest.mouths;
      expect(l.x).toBeCloseTo(-GEOMETRY.width * SIDE, 5);
      expect(r.x).toBeCloseTo(GEOMETRY.width * SIDE, 5);
      expect(l.y).toBeCloseTo(MOUTH_Y, 5);
      expect(MOUTH_Y).toBeGreaterThan(GEOMETRY.height / 2);
      expect(l.dx).toBeCloseTo(0, 9);
      expect(l.dy).toBe(1);
      // 발사 중: 단추 중심에서 (입의 로컬 자리)를 기울기 -> 배율 -> 이동 순으로 옮긴 자리, 방향은 몸체 아래
      const t = launchAt(0.8);
      const b = beat(t);
      const rad = (b.rotation * Math.PI) / 180;
      b.mouths.forEach((m, i) => {
        const lx = (i === 0 ? -1 : 1) * GEOMETRY.width * SIDE;
        expect(m.x).toBeCloseTo(
          b.x + b.scale * (lx * Math.cos(rad) - MOUTH_Y * Math.sin(rad)),
          5
        );
        expect(m.y).toBeCloseTo(
          b.y + b.scale * (lx * Math.sin(rad) + MOUTH_Y * Math.cos(rad)),
          5
        );
        expect(m.dx).toBeCloseTo(-Math.sin(rad), 5);
        expect(m.dy).toBeCloseTo(Math.cos(rad), 5);
      });
      expect(b.rotation).toBeGreaterThan(5);
    });

    it('땅 연기가 분사구 아래 땅에서 양옆으로 구르고 세기가 오를수록 자주 나온다', () => {
      const early = beat(BEAT.build + 300).smoke.ground;
      const late = beat(BEAT.launch - 1).smoke.ground;
      expect(late.puffs).toHaveLength(2);
      const [left, right] = late.puffs;
      expect(left.x).toBeCloseTo(-GEOMETRY.width * SIDE, 5);
      expect(right.x).toBeCloseTo(GEOMETRY.width * SIDE, 5);
      expect(left.y).toBe(right.y);
      expect(left.y).toBeGreaterThan(MOUTH_Y);
      expect([left.vx, left.vy, right.vx, right.vy]).toEqual([-320, 0, 320, 0]);
      expect(early.gap).toBeGreaterThan(late.gap);
      // 세기가 낮아도 간격은 상한이 있다
      expect(early.gap).toBeLessThanOrEqual(500);
      // 분출 전에는 꼬리 연기가 없다
      expect(beat(BEAT.launch - 1).smoke.tail.puffs).toHaveLength(0);
    });
  });

  describe('발사 (2600~5100ms)', () => {
    it('속도가 0에서 시작해 끝까지 단조 증가한다(무겁게 천천히 뜬다)', () => {
      const speeds = range(BEAT.launch + 50, BEAT.sent - 50, 50).map((t) => {
        const v = velocity(t);
        return Math.hypot(v.vx, v.vy);
      });
      speeds.forEach((s, i) => {
        if (i > 0) expect(s).toBeGreaterThan(speeds[i - 1]);
      });
      expect(speeds[0]).toBeLessThan(speeds[speeds.length - 1] / 20);
    });

    it('끝에서 distance만큼 올라가 오른쪽으로 휘고 작아진다', () => {
      const end = beat(BEAT.sent);
      expect(-end.y).toBeCloseTo(GEOMETRY.distance, 0);
      expect(end.x).toBeGreaterThan(0);
      expect(end.scale).toBeLessThan(1);
      expect(beat(BEAT.launch).scale).toBe(1);
    });

    it('x는 늦게 커진다: 중간까지 위로 먼저 가고 끝에서 휜다', () => {
      const early = beat(launchAt(0.5));
      const end = beat(BEAT.sent);
      expect(early.x / end.x).toBeLessThan(0.1);
      expect(-early.y).toBeGreaterThan(60);
    });

    it('기울기는 그 순간의 속도 방향이고 20도를 넘지 않는다', () => {
      range(launchAt(0.1), launchAt(0.95), 40).forEach((t) => {
        const { vx, vy } = velocity(t);
        const heading = (Math.atan2(vx, vy) * 180) / Math.PI;
        const { rotation } = beat(t);
        expect(rotation).toBeLessThanOrEqual(20);
        expect(rotation).toBeCloseTo(Math.min(20, heading), 0);
      });
      // 처음엔 곧게 오르고 휘면서 커진다
      expect(beat(launchAt(0.1)).rotation).toBeLessThan(2);
      expect(beat(launchAt(0.5)).rotation).toBeGreaterThan(
        beat(launchAt(0.1)).rotation
      );
      expect(beat(launchAt(0.8)).rotation).toBeGreaterThan(
        beat(launchAt(0.5)).rotation
      );
      expect(beat(BEAT.sent).rotation).toBe(20);
    });
  });

  describe('가상의 땅 (비행 내내)', () => {
    it('땅 연기 자리 y는 비행 내내 같은 높이에 고정이고 분사구 끝 아래다', () => {
      const ys = range(BEAT.build + 100, BEAT.sent - 10, 90).flatMap((t) =>
        beat(t).smoke.ground.puffs.map((p) => p.y)
      );
      expect(new Set(ys).size).toBe(1);
      expect(ys[0]).toBeGreaterThan(MOUTH_Y);
    });

    it('땅 연기는 로켓 바로 아래(x는 로켓을 따라감)에서 계속 나온다', () => {
      [launchAt(0.3), launchAt(0.7), launchAt(0.98)].forEach((t) => {
        const b = beat(t);
        expect(b.smoke.ground.puffs).toHaveLength(2);
        const [left, right] = b.smoke.ground.puffs;
        expect(left.x).toBeCloseTo(b.x - GEOMETRY.width * SIDE, 5);
        expect(right.x).toBeCloseTo(b.x + GEOMETRY.width * SIDE, 5);
      });
    });

    it('높이 오를수록 땅에 닿는 세기가 줄어 간격이 벌어진다', () => {
      const gaps = [
        BEAT.launch - 1,
        launchAt(0.4),
        launchAt(0.7),
        launchAt(0.99),
      ].map((t) => beat(t).smoke.ground.gap);
      for (let i = 1; i < gaps.length; i++)
        expect(gaps[i]).toBeGreaterThan(gaps[i - 1]);
    });

    it('배기 기둥은 입에서 땅까지 이어지고 땅은 그대로인 채 올라갈수록 옅어지다 비행이 끝나면 없다', () => {
      const grounds = range(BEAT.build + 100, BEAT.sent - 10, 90).map(
        (t) => beat(t).groundY
      );
      expect(new Set(grounds).size).toBe(1);
      // 기둥은 입(올라가면 위로 간다)에서 고정된 땅까지다: 올라갈수록 길어진다
      expect(grounds[0]).toBeGreaterThan(MOUTH_Y);
      const length = (t: number) => beat(t).groundY - beat(t).mouths[0].y;
      expect(length(launchAt(0.7))).toBeGreaterThan(length(launchAt(0.3)) + 50);
      // 올라갈수록 짙기가 줄어든다
      const columns = [
        BEAT.launch - 1,
        launchAt(0.3),
        launchAt(0.6),
        launchAt(0.9),
      ].map((t) => beat(t).column);
      for (let i = 1; i < columns.length; i++)
        expect(columns[i]).toBeLessThan(columns[i - 1]);
      expect(columns[0]).toBeGreaterThan(0.9);
      // 서서히 분출하는 동안은 세기와 함께 자란다
      expect(beat(BEAT.build + 1000).column).toBeCloseTo(0.5, 5);
    });

    it('꼬리 연기는 막 뜰 때는 없고 속도가 붙으면 심지 끝 한가운데에서 몸체 아래 방향으로 한 방울씩 나간다', () => {
      expect(beat(BEAT.launch + 5).smoke.tail.puffs).toHaveLength(0);
      [launchAt(0.5), launchAt(0.8), launchAt(0.97)].forEach((t) => {
        const b = beat(t);
        const { gap, puffs } = b.smoke.tail;
        expect(gap).toBe(70);
        expect(puffs).toHaveLength(1);
        const rad = (b.rotation * Math.PI) / 180;
        const my = MOUTH_Y + b.wick;
        expect(puffs[0].x - b.x).toBeCloseTo(-b.scale * my * Math.sin(rad), 5);
        expect(puffs[0].y - b.y).toBeCloseTo(b.scale * my * Math.cos(rad), 5);
        expect(puffs[0].vx / puffs[0].vy).toBeCloseTo(-Math.tan(rad), 5);
        expect(puffs[0].vy).toBeGreaterThan(0);
      });
    });

    it('보냈어요에서는 연기도 분출도 내보내지 않는다', () => {
      const b = beat(BEAT.sent);
      expect(b.wick).toBe(0);
      expect(b.column).toBe(0);
      expect(b.strength).toBe(0);
      expect(b.smoke.ground.puffs).toHaveLength(0);
      expect(b.smoke.tail.puffs).toHaveLength(0);
    });
  });

  describe('표지와 웅크림', () => {
    it('보냈어요 표지는 5100ms부터 base 동안 settle로 떠오른다', () => {
      expect(beat(BEAT.sent - 1).mark).toBe(0);
      expect(beat(BEAT.sent).mark).toBe(0);
      expect(beat(BEAT.sent + 100).mark).toBeCloseTo(settle(0.5), 5);
      expect(beat(BEAT_END).mark).toBe(1);
    });

    it('눌렀다 뗀 click의 웅크림은 fast 동안 풀린다', () => {
      expect(crouchWeight(0)).toBe(1);
      expect(crouchWeight(75)).toBeCloseTo(1 - settle(0.5), 5);
      expect(crouchWeight(150)).toBe(0);
      expect(crouchWeight(1000)).toBe(0);
    });
  });

  it('같은 시각에는 늘 같은 값이다(난수 없음, 부르는 순서와 무관)', () => {
    const times = [4000, 150, 3300, 0, 2000, 4999, 800];
    const first = times.map(beat);
    expect([...times].reverse().map(beat).reverse()).toEqual(first);
    expect(times.map(beat)).toEqual(first);
  });
});
