import { describe, expect, it } from 'vitest';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import {
  BEAT,
  BEAT_END,
  FLAME_MAX,
  NOZZLE_HEIGHT,
  NOZZLE_X,
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

describe('rocketBeat 박자 (설계서 8절 로켓 전송)', () => {
  it('단계는 0, 600, 1100, 3000, 5000ms에서 바뀌고 끝은 표지가 다 뜨는 5200ms다', () => {
    const at = (t: number) => beat(t).phase;
    expect(at(0)).toBe('ignite');
    expect(at(599)).toBe('ignite');
    expect(at(600)).toBe('rise');
    expect(at(1099)).toBe('rise');
    expect(at(1100)).toBe('hover');
    expect(at(2999)).toBe('hover');
    expect(at(3000)).toBe('launch');
    expect(at(4999)).toBe('launch');
    expect(at(5000)).toBe('sent');
    expect(BEAT_END).toBe(5200);
  });

  it('시간 경계는 토큰 시간의 배수에서 나온다', () => {
    const { fast, slow, slower, base } = gsapDuration;
    expect(BEAT.rise).toBe(4 * fast * 1000);
    expect(BEAT.hover).toBe(BEAT.rise + slower * 1000);
    expect(BEAT.launch).toBe(10 * slow * 1000);
    expect(BEAT.sent).toBe(BEAT.launch + 4 * slower * 1000);
    expect(BEAT_END).toBe(BEAT.sent + base * 1000);
  });

  describe('점화 (0~600ms)', () => {
    it('제자리에서 1px 안으로 떨고 시작과 뜨기 직전에는 선다', () => {
      expect(beat(0).x).toBe(0);
      expect(beat(0).y).toBe(0);
      expect(Math.abs(beat(BEAT.rise).x)).toBeLessThan(0.01);
      expect(Math.abs(beat(BEAT.rise).y)).toBeLessThan(0.01);
      const shake = range(0, 599, 7).map(beat);
      shake.forEach((b) => {
        expect(Math.abs(b.x)).toBeLessThan(1);
        expect(Math.abs(b.y)).toBeLessThan(1);
        expect(b.rotation).toBe(0);
      });
      // 떨림이 실제로 있다(0.1px를 넘는 흔들림이 점화 중간에 있다)
      expect(Math.max(...shake.map((b) => Math.abs(b.x)))).toBeGreaterThan(0.1);
    });
  });

  describe('떠오름 (600~1100ms)', () => {
    it('약 24px 위로 올라 3px쯤 넘쳤다 24px에 앉는다', () => {
      const heights = range(600, 1100, 5).map((t) => -beat(t).y);
      const peak = Math.max(...heights);
      expect(peak).toBeGreaterThan(26.5);
      expect(peak).toBeLessThan(27.5);
      // 첫 꼭짓점은 slow(300ms) 뒤다
      const peakAt = 600 + heights.indexOf(peak) * 5;
      expect(peakAt).toBeGreaterThanOrEqual(880);
      expect(peakAt).toBeLessThanOrEqual(920);
      // 넘친 뒤 내려앉아 24 가까이에 선다
      expect(Math.abs(-beat(BEAT.hover).y - 24)).toBeLessThan(1);
    });
  });

  describe('둥실 (1100~3000ms)', () => {
    it('24px 높이에서 1~2px 진폭으로 오르내린다', () => {
      const heights = range(1300, 2990, 10).map((t) => -beat(t).y);
      const amplitude = (Math.max(...heights) - Math.min(...heights)) / 2;
      expect(amplitude).toBeGreaterThanOrEqual(1);
      expect(amplitude).toBeLessThanOrEqual(2);
      const mid = (Math.max(...heights) + Math.min(...heights)) / 2;
      expect(mid).toBeCloseTo(24, 0);
    });

    it('기울지 않고 옆으로 가지 않는다', () => {
      range(1100, 2999, 50).forEach((t) => {
        expect(beat(t).rotation).toBeCloseTo(0, 5);
        expect(beat(t).x).toBe(0);
      });
    });
  });

  describe('발사 (3000~5000ms)', () => {
    it('속도가 0에서 시작해 끝까지 단조 증가한다', () => {
      const speeds = range(BEAT.launch + 50, BEAT.sent - 50, 50).map((t) => {
        const v = velocity(t);
        return Math.hypot(v.vx, v.vy);
      });
      speeds.forEach((s, i) => {
        if (i > 0) expect(s).toBeGreaterThan(speeds[i - 1]);
      });
      expect(speeds[0]).toBeLessThan(speeds[speeds.length - 1] / 20);
    });

    it('끝에서 distance만큼 24px 위에서 더 올라가 있고 오른쪽으로 휘며 작아진다', () => {
      const end = beat(BEAT.sent);
      expect(-end.y).toBeCloseTo(24 + GEOMETRY.distance, 0);
      expect(end.x).toBeGreaterThan(0);
      expect(end.scale).toBeLessThan(1);
      expect(beat(BEAT.launch).scale).toBe(1);
    });

    it('x는 늦게 커진다: 중간까지 위로 먼저 가고 끝에서 휜다', () => {
      const early = beat(launchAt(0.5));
      const end = beat(BEAT.sent);
      expect(early.x / end.x).toBeLessThan(0.1);
      expect(-early.y - 24).toBeGreaterThan(30);
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

  describe('불꽃', () => {
    it('점화 전 0이고 점화 뒤 켜져 발사대에 닿는 길이로 자란다', () => {
      expect(beat(0).flame).toBe(0);
      expect(beat(100).flame).toBeGreaterThan(0);
      expect(beat(300).flame).toBeGreaterThan(beat(60).flame);
      expect(beat(BEAT.rise - 1).flame).toBeGreaterThan(40);
    });

    it('떠 있으면 앉아 있을 때보다 길고 둥실 동안 길이가 떨린다', () => {
      const seated = beat(BEAT.rise - 1).flame;
      const floating = range(1500, 2900, 7).map((t) => beat(t).flame);
      expect(Math.min(...floating)).toBeGreaterThan(seated + 10);
      expect(Math.max(...floating) - Math.min(...floating)).toBeGreaterThan(3);
    });

    it('발사 속도와 함께 길어지고 FLAME_MAX를 넘지 않으며 보냈어요에서는 꺼진다', () => {
      const mean = (from: number, to: number) => {
        const xs = range(from, to, 3).map((t) => beat(t).flame);
        return xs.reduce((a, b) => a + b) / xs.length;
      };
      const hover = mean(2800, 2990);
      expect(mean(3300, 3500)).toBeGreaterThan(hover);
      expect(mean(4000, 4200)).toBeGreaterThan(mean(3300, 3500));
      expect(mean(4800, 4990)).toBeGreaterThan(mean(4000, 4200) + 20);
      range(0, BEAT_END, 3).forEach((t) =>
        expect(beat(t).flame).toBeLessThanOrEqual(FLAME_MAX)
      );
      expect(beat(BEAT.sent).flame).toBe(0);
    });
  });

  describe('연기', () => {
    it('불꽃이 켜지기 전과 보냈어요에는 내보내지 않는다', () => {
      expect(beat(0).smoke.puffs).toHaveLength(0);
      expect(beat(BEAT.sent).smoke.puffs).toHaveLength(0);
    });

    it('점화, 떠오름, 둥실에는 두 분사구 아래 발사대에서 양옆으로 내보낸다', () => {
      const nozzleTip = GEOMETRY.height * (0.5 + NOZZLE_HEIGHT);
      [300, 800, 2000].forEach((t) => {
        const { puffs, gap } = beat(t).smoke;
        expect(puffs).toHaveLength(2);
        expect(gap).toBeGreaterThanOrEqual(100);
        const [left, right] = puffs;
        expect(left.x).toBeCloseTo(-GEOMETRY.width * NOZZLE_X, 5);
        expect(right.x).toBeCloseTo(GEOMETRY.width * NOZZLE_X, 5);
        // 단추가 떠올라도 발사대는 제자리다
        expect(left.y).toBeGreaterThan(nozzleTip);
        expect(left.y).toBe(right.y);
        expect(left.vx).toBeLessThan(0);
        expect(right.vx).toBeGreaterThan(0);
        expect(left.vy).toBe(0);
      });
      // 불꽃이 자랄수록 더 자주
      expect(beat(100).smoke.gap).toBeGreaterThan(beat(2000).smoke.gap);
    });

    it('발사 중에는 50ms 간격으로 불꽃 끝에서 몸체 아래 방향(진행 반대쪽)으로 내보낸다', () => {
      [launchAt(0.3), launchAt(0.7), launchAt(0.95)].forEach((t) => {
        const b = beat(t);
        expect(b.smoke.gap).toBe(50);
        const rad = (b.rotation * Math.PI) / 180;
        const nozzleTip = GEOMETRY.height * (0.5 + NOZZLE_HEIGHT);
        b.smoke.puffs.forEach((p, i) => {
          // 단추 중심에서 (분사구 x, 분사구 끝 + 불꽃 길이)만큼 기울기와 배율을 걸어 떨어진 자리
          const mx = (i === 0 ? -1 : 1) * GEOMETRY.width * NOZZLE_X;
          const my = nozzleTip + b.flame;
          expect(p.x - b.x).toBeCloseTo(
            b.scale * (mx * Math.cos(rad) - my * Math.sin(rad)),
            5
          );
          expect(p.y - b.y).toBeCloseTo(
            b.scale * (mx * Math.sin(rad) + my * Math.cos(rad)),
            5
          );
          expect(p.vx).toBeLessThan(0);
          expect(p.vy).toBeGreaterThan(0);
          expect(p.vx / p.vy).toBeCloseTo(-Math.tan(rad), 5);
        });
      });
    });
  });

  describe('표지와 웅크림', () => {
    it('보냈어요 표지는 5000ms부터 base 동안 settle로 떠오른다', () => {
      expect(beat(4999).mark).toBe(0);
      expect(beat(5000).mark).toBe(0);
      expect(beat(5000 + 100).mark).toBeCloseTo(settle(0.5), 5);
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
