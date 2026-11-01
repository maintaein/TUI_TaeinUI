import { describe, expect, it } from 'vitest';
import { gsapEasing } from '../../tokens/gsapEasing';
import {
  BEAT,
  BEAT_END,
  FLAME_PEAK,
  NOZZLE_RATIO,
  easeAt,
  wingBeat,
} from './wingBeat';

const GEOMETRY = { width: 120, height: 44, distance: 400 };
const beat = (t: number) => wingBeat(t, GEOMETRY);
// 이징은 토큰 이름을 직접 적어 기대값을 만든다(구현이 단계마다 무엇을 골랐는지에서 기대값을 끌어오지 않는다)
const settle = (p: number) => easeAt(gsapEasing.settle, p);
const snap = (p: number) => easeAt(gsapEasing.snap, p);
const spring = (p: number) => easeAt(gsapEasing.spring, p);
const drift = (p: number) => easeAt(gsapEasing.drift, p);
const exit = (p: number) => easeAt(gsapEasing.exit, p);

describe('wingBeat 박자표 (설계서 8절 로켓)', () => {
  it('단계는 0, 150, 450, 950, 2250, 3050ms에서 바뀐다', () => {
    const at = (t: number) => beat(t).phase;
    expect(at(0)).toBe('crouch');
    expect(at(149)).toBe('crouch');
    expect(at(150)).toBe('fins');
    expect(at(449)).toBe('fins');
    expect(at(450)).toBe('ignite');
    expect(at(949)).toBe('ignite');
    expect(at(950)).toBe('hover');
    expect(at(2249)).toBe('hover');
    expect(at(2250)).toBe('launch');
    expect(at(3049)).toBe('launch');
    expect(at(3050)).toBe('sent');
    expect(BEAT_END).toBe(3250);
  });

  it('웅크림은 150ms 안에 scale 0.97, 왼쪽 아래 2px에 닿고 꼬리날개가 펴지기 시작하는 구간에 풀린다', () => {
    const start = beat(0);
    expect(start.x).toBeCloseTo(0, 5);
    expect(start.y).toBeCloseTo(0, 5);
    expect(start.scale).toBe(1);
    const crouched = beat(BEAT.fins);
    expect(crouched.x).toBeCloseTo(-2, 5);
    expect(crouched.y).toBeCloseTo(2, 5);
    expect(crouched.scale).toBeCloseTo(0.97, 5);
    // 300ms에 제자리(떠오름은 450부터)
    const released = beat(300);
    expect(released.x).toBeCloseTo(0, 5);
    expect(released.y).toBeCloseTo(0, 5);
    expect(released.scale).toBeCloseTo(1, 5);
    expect(released.rotation).toBe(0);
  });

  it('꼬리날개는 150ms에 펴지기 시작해 300ms 뒤(450ms) 다 펴지고 snap이라 중간에 조금 넘친다', () => {
    expect(beat(149).fins).toBe(0);
    expect(beat(150).fins).toBe(0);
    expect(beat(450).fins).toBeCloseTo(1, 5);
    const overshoot = Math.max(
      ...Array.from({ length: 31 }, (_, i) => beat(150 + i * 10).fins)
    );
    expect(overshoot).toBeGreaterThan(1.05);
    expect(overshoot).toBeLessThan(1.15);
  });

  it('불꽃은 450ms 전에는 꺼져 있고 점화 뒤 켜진다', () => {
    for (const t of [0, 100, 150, 300, 449, 450]) {
      expect(beat(t).flame).toBe(0);
    }
    expect(beat(451).flame).toBeGreaterThan(0);
    // 점화는 150ms에 걸쳐 기본 길이(1)로 켜진다
    expect(beat(525).flame).toBeGreaterThan(0.5);
    expect(beat(525).flame).toBeLessThan(1.2);
    // 보냈어요에서는 다시 꺼진다
    expect(beat(3050).flame).toBe(0);
    expect(beat(3200).flame).toBe(0);
  });

  it('둥실 동안 불꽃은 기본 길이 둘레에서 결정적으로 깜빡인다(같은 시각이면 같은 값, 시각이 바뀌면 값이 바뀐다)', () => {
    const values: number[] = [];
    for (let t = 1000; t < BEAT.launch; t += 7) {
      const { flame } = beat(t);
      values.push(flame);
      expect(flame).toBeGreaterThanOrEqual(0.9 - 1e-9);
      expect(flame).toBeLessThanOrEqual(1.1 + 1e-9);
      expect(beat(t).flame).toBe(flame);
    }
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.08);
  });

  it('떠오름은 450ms에 시작해 500ms 동안 25px을 넘쳤다 앉는다', () => {
    expect(beat(450).y).toBeCloseTo(0, 5);
    const ys = Array.from({ length: 51 }, (_, i) => beat(450 + i * 10).y);
    // 넘침: 25px을 지나 더 올랐다가
    expect(Math.min(...ys)).toBeLessThan(-27);
    expect(Math.min(...ys)).toBeGreaterThan(-35);
    // 950ms에 25px 자리에 앉는다
    expect(beat(950).y).toBeCloseTo(-25, 5);
    // 가운데 한 점은 spring이 낸 값이다
    expect(beat(700).y).toBeCloseTo(-25 * spring(0.5), 6);
    // 떠오르는 동안 옆으로는 가지 않고 기울지도 않는다
    expect(beat(700).x).toBeCloseTo(0, 5);
    expect(beat(700).rotation).toBe(0);
  });

  it('둥실은 950ms부터 1300ms 동안 25px 둘레에서 위아래로 몇 px 흔들리고 발사 직전에 제자리로 온다', () => {
    const ys: number[] = [];
    for (let t = 950; t <= 2250; t += 10) ys.push(beat(t).y + 25);
    // 진폭은 몇 px(4px 이내)이고 위와 아래 양쪽으로 간다
    expect(Math.max(...ys)).toBeGreaterThan(2);
    expect(Math.max(...ys)).toBeLessThanOrEqual(4 + 1e-9);
    expect(Math.min(...ys)).toBeLessThan(-2);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-4 - 1e-9);
    expect(beat(950).y + 25).toBeCloseTo(0, 5);
    expect(beat(2250).y + 25).toBeCloseTo(0, 5);
    // 둥실 동안 거의 반듯하다
    for (let t = 950; t < 2250; t += 50) expect(beat(t).rotation).toBe(0);
  });

  it('발사는 오른쪽 위 45도로 가속해 윗면이 진행 방향을 향하게 시계 방향으로 기울고 0.6배가 된다', () => {
    const hover = beat(2250);
    expect(hover.x).toBeCloseTo(0, 5);
    expect(hover.y).toBeCloseTo(-25, 5);
    expect(hover.rotation).toBeCloseTo(0, 5);
    const end = beat(3050);
    // 45도: 이동량이 오른쪽과 위로 같다
    expect(end.x).toBeCloseTo(GEOMETRY.distance, 5);
    expect(end.y - hover.y).toBeCloseTo(-GEOMETRY.distance, 5);
    // 윗면이 오른쪽 위를 향하려면 시계 방향(+)으로 기운다. 45도보다는 덜 기운다
    expect(end.rotation).toBeCloseTo(30, 5);
    expect(end.scale).toBeCloseTo(0.6, 5);
    // exit 가속: 앞쪽 절반은 전체의 8분의 1만 간다
    expect(beat(2250 + 400).x / GEOMETRY.distance).toBeCloseTo(exit(0.5), 6);
    expect(beat(2250 + 400).x / GEOMETRY.distance).toBeCloseTo(0.125, 5);
  });

  it('발사 중 불꽃은 속도에 따라 길어지되 최대 길이를 넘지 않는다', () => {
    // 발사 시작은 속도 0이라 둥실의 불꽃과 같은 길이 둘레다
    expect(beat(2250).flame).toBeGreaterThan(0.9);
    expect(beat(2250).flame).toBeLessThan(1.1 + 1e-9);
    // 속도가 오를수록 길어진다: 깜빡임(최대 0.1)을 넘는 차이로 단계마다 길어진다
    const at = [2300, 2500, 2700, 2900, 3040].map((t) => beat(t).flame);
    expect(at[4]).toBeGreaterThan(at[2] + 0.2);
    expect(at[2]).toBeGreaterThan(at[0] + 0.1);
    expect(at[4]).toBeGreaterThan(2);
    for (let t = 450; t < 3050; t += 5) {
      expect(beat(t).flame).toBeLessThanOrEqual(FLAME_PEAK + 1e-9);
    }
  });

  it('연기는 불꽃이 켜진 동안만 나온다', () => {
    for (let t = 0; t <= 3300; t += 5) {
      const b = beat(t);
      expect(b.smoke).toBe(b.flame > 0);
    }
    [0, 100, 300, 450, 3050, 3200].forEach((t) =>
      expect(beat(t).smoke).toBe(false)
    );
    [451, 600, 1500, 2249, 2600, 3049].forEach((t) =>
      expect(beat(t).smoke).toBe(true)
    );
  });

  it('smokeAt은 분사구 끝이다: 폭의 1/3, 2/3 자리(중심에서 좌우 폭의 1/6)이고 단추 밑면 아래 분사구 길이만큼이다', () => {
    const [left, right] = beat(1500).smokeAt;
    expect(right.x).toBeCloseTo(GEOMETRY.width / 6, 6);
    expect(left.x).toBeCloseTo(-GEOMETRY.width / 6, 6);
    expect(left.y).toBeCloseTo(right.y, 6);
    expect(right.y).toBeCloseTo(GEOMETRY.height * (0.5 + NOZZLE_RATIO), 6);
    // 단추 밑면(높이의 절반)보다 아래다
    expect(right.y).toBeGreaterThan(GEOMETRY.height / 2);
  });

  it('보냈어요 표지는 3050ms부터 200ms에 떠오르고 그 전에는 투명하다', () => {
    expect(beat(3049).mark).toBe(0);
    expect(beat(3050).mark).toBe(0);
    expect(beat(3250).mark).toBeCloseTo(1, 5);
    expect(beat(5000).mark).toBeCloseTo(1, 5);
    expect(beat(3150).mark).toBeGreaterThan(0.5);
    // 보냈어요 단계에서도 단추는 발사 끝에 머문다
    expect(beat(3250).x).toBeCloseTo(beat(3050).x, 5);
    expect(beat(3250).y).toBeCloseTo(beat(3050).y, 5);
  });

  it('음수 시각은 0과 같다', () => {
    expect(beat(-50)).toEqual(beat(0));
  });
});

// 박자표의 이징 열. 구간마다 중간 한 점에서 토큰 이름으로 만든 곡선과 맞댄다.
// 끝점만 보면 어떤 곡선이어도 통과하므로 곡선이 엉뚱한 것으로 바뀌면 여기서 빨개진다
describe('wingBeat 이징 열 (설계서 8절 로켓)', () => {
  // 시험의 전제: 곡선들이 중간 점에서 서로 달라야 이징을 바꿔 끼운 것이 보인다
  it('다섯 곡선은 중간 점에서 서로 다르다', () => {
    const mids = [settle, snap, spring, drift, exit].map((fn) => fn(0.5));
    expect(new Set(mids.map((v) => v.toFixed(4))).size).toBe(5);
  });

  it('웅크림은 settle이다(0~150ms)', () => {
    const b = beat(75);
    expect(b.x).toBeCloseTo(-2 * settle(0.5), 6);
    expect(b.scale).toBeCloseTo(1 - 0.03 * settle(0.5), 6);
  });

  it('웅크림 풀림은 snap이다(150~300ms)', () => {
    const b = beat(225);
    expect(b.x).toBeCloseTo(-2 * (1 - snap(0.5)), 6);
    expect(b.scale).toBeCloseTo(0.97 + 0.03 * snap(0.5), 6);
  });

  it('꼬리날개와 분사구는 snap이다(150~450ms)', () => {
    expect(beat(300).fins).toBeCloseTo(snap(0.5), 6);
  });

  it('점화는 settle이다(450~600ms)', () => {
    // 깜빡임을 나눠 내면 점화 곡선만 남는다: 깜빡임 값은 둥실 중 같은 시각의 불꽃과 맞댈 수 없어 범위로 본다
    const lit = settle(0.5);
    const flame = beat(525).flame;
    expect(flame).toBeGreaterThan(lit * 0.9 - 1e-9);
    expect(flame).toBeLessThan(lit * 1.1 + 1e-9);
  });

  it('떠오름은 spring이다(450~950ms)', () => {
    expect(beat(450 + 100).y).toBeCloseTo(-25 * spring(0.2), 6);
    expect(beat(450 + 250).y).toBeCloseTo(-25 * spring(0.5), 6);
  });

  it('둥실은 drift다(950~2250ms, 네 꼭짓점 사이)', () => {
    // 첫 구간(0~25%)은 0에서 위로 4px
    const u = 0.125 / 0.25;
    expect(beat(950 + 1300 * 0.125).y + 25).toBeCloseTo(-4 * drift(u), 6);
    // 가운데 구간(25~75%)은 위 4px에서 아래 4px
    expect(beat(950 + 1300 * 0.5).y + 25).toBeCloseTo(-4 + 8 * drift(0.5), 6);
  });

  it('발사의 이동은 exit, 기울기는 settle이다', () => {
    const b = beat(2650);
    expect(b.x).toBeCloseTo(GEOMETRY.distance * exit(0.5), 6);
    expect(b.rotation).toBeCloseTo(30 * settle(0.5), 6);
    expect(b.scale).toBeCloseTo(1 - 0.4 * 0.5, 6);
  });

  it('표지는 settle로 떠오른다(3050~3250ms)', () => {
    expect(beat(3150).mark).toBeCloseTo(settle(0.5), 6);
  });
});
