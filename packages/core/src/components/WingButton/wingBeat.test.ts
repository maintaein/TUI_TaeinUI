import { describe, expect, it } from 'vitest';
import { BEAT, BEAT_END, WING_DOWN, WING_UP, wingBeat } from './wingBeat';

const GEOMETRY = { width: 120, height: 44, distance: 400 };
const beat = (t: number) => wingBeat(t, GEOMETRY);

describe('wingBeat 박자표 (설계서 8절)', () => {
  it('단계는 0, 150, 300, 750, 2250, 3050ms에서 바뀐다', () => {
    const at = (t: number) => beat(t).phase;
    expect(at(0)).toBe('crouch');
    expect(at(149)).toBe('crouch');
    expect(at(150)).toBe('bud');
    expect(at(299)).toBe('bud');
    expect(at(300)).toBe('unfurl');
    expect(at(749)).toBe('unfurl');
    expect(at(750)).toBe('flap');
    expect(at(2249)).toBe('flap');
    expect(at(2250)).toBe('takeoff');
    expect(at(3049)).toBe('takeoff');
    expect(at(3050)).toBe('sent');
    expect(BEAT_END).toBe(3250);
  });

  it('웅크림은 150ms 안에 scale 0.97, 왼쪽 아래 2px에 닿고 봉오리 구간에 풀린다', () => {
    const start = beat(0);
    expect(start.x).toBeCloseTo(0, 5);
    expect(start.y).toBeCloseTo(0, 5);
    expect(start.scale).toBe(1);
    // 웅크림 끝(150ms 직전)은 거의 끝값이고 150ms에 정확히 끝값
    const crouched = beat(BEAT.bud);
    expect(crouched.x).toBeCloseTo(-2, 5);
    expect(crouched.y).toBeCloseTo(2, 5);
    expect(crouched.scale).toBeCloseTo(0.97, 5);
    // 300ms에 제자리
    const released = beat(BEAT.unfurl);
    expect(released.x).toBeCloseTo(0, 5);
    expect(released.y).toBeCloseTo(0, 5);
    expect(released.scale).toBeCloseTo(1, 5);
    expect(released.rotation).toBe(0);
  });

  it('봉오리는 150~300ms에 돋고 깃 넷은 안쪽부터 45ms 간격으로 300ms씩 펴진다', () => {
    expect(beat(150).bud).toBe(0);
    expect(beat(300).bud).toBeCloseTo(1, 5);
    // 깃 i는 300 + 45i에 시작해 300ms 뒤 1에 닿는다
    for (let i = 0; i < 4; i++) {
      const start = 300 + 45 * i;
      expect(beat(start).feathers[i]).toBe(0);
      expect(beat(start + 300).feathers[i]).toBeCloseTo(1, 5);
      // 시작 전의 깃은 접힌 채다
      if (i > 0) expect(beat(start - 1).feathers[i]).toBe(0);
    }
    // 같은 시각에는 안쪽 깃이 바깥 깃보다 더 펴졌다
    const mid = beat(300 + 100).feathers;
    expect(mid[0]).toBeGreaterThan(mid[1]);
    expect(mid[1]).toBeGreaterThan(mid[2]);
    expect(mid[2]).toBeGreaterThan(mid[3]);
    // 모두 날갯짓이 시작되기 전에 펴졌다
    expect(beat(750).feathers.every((f) => Math.abs(f - 1) < 1e-9)).toBe(true);
  });

  it('날갯짓 세 번은 아래 200ms + 위 300ms이고 아래 끝에서 단추가 6, 10, 14px 떠 있다', () => {
    const lifts = [6, 10, 14];
    lifts.forEach((lift, k) => {
      const down = 750 + 500 * k;
      // 아래치기: 위 끝에서 시작해 200ms에 아래 끝
      expect(beat(down).wingAngle).toBeCloseTo(WING_UP, 5);
      expect(beat(down).downstroke).toBe(true);
      expect(beat(down + 199).downstroke).toBe(true);
      expect(beat(down + 200).wingAngle).toBeCloseTo(WING_DOWN, 5);
      expect(beat(down + 200).downstroke).toBe(false);
      expect(beat(down + 200).y).toBeCloseTo(-lift, 5);
      // 위치기 300ms 동안 아래 끝에서 위 끝으로 돌아오고 높이는 머문다
      expect(beat(down + 350).y).toBeCloseTo(-lift, 5);
      expect(beat(down + 500).wingAngle).toBeCloseTo(WING_UP, 5);
    });
    // 칠수록 높이
    expect(beat(950).y).toBeGreaterThan(beat(1450).y);
    expect(beat(1450).y).toBeGreaterThan(beat(1950).y);
    // 첫 날갯짓 전에는 아직 뜨지 않았다
    expect(beat(749).y).toBe(0);
    // 아래치기 도중에는 이전 높이와 다음 높이 사이다
    const mid = beat(1250 + 100).y;
    expect(mid).toBeLessThan(-6);
    expect(mid).toBeGreaterThan(-10);
  });

  it('각도는 아래 끝과 위 끝 사이를 벗어나지 않는다', () => {
    for (let t = 0; t <= 3250; t += 10) {
      const { wingAngle } = beat(t);
      expect(wingAngle).toBeGreaterThanOrEqual(WING_DOWN - 1e-9);
      expect(wingAngle).toBeLessThanOrEqual(WING_UP + 1e-9);
    }
  });

  it('연기는 아래로 칠 때만 나오고 위로 올릴 때와 다른 단계에서는 나오지 않는다', () => {
    for (let t = 0; t <= 3300; t += 5) {
      const b = beat(t);
      if (b.smoke) {
        expect(b.downstroke).toBe(true);
        expect(['flap', 'takeoff']).toContain(b.phase);
      }
      if (b.phase !== 'flap' && b.phase !== 'takeoff') {
        expect(b.smoke).toBe(false);
      }
    }
    // 위 구간(첫 날갯짓 200~500ms)은 거짓, 아래 구간은 참
    expect(beat(750 + 100).smoke).toBe(true);
    expect(beat(750 + 250).smoke).toBe(false);
    expect(beat(750 + 499).smoke).toBe(false);
    expect(beat(1250).smoke).toBe(true);
    // 웅크림, 봉오리, 깃 펼침, 보냈어요에서는 거짓
    [0, 100, 200, 400, 700, 3050, 3200].forEach((t) =>
      expect(beat(t).smoke).toBe(false)
    );
    // 내뿜는 자리는 날개 밑이다: 양쪽 날개에서 좌우 대칭이고 단추 가장자리 바깥이다
    const [left, right] = beat(850).smokeAt;
    expect(right.x).toBeGreaterThan(GEOMETRY.width / 2);
    expect(left.x).toBeCloseTo(-right.x, 5);
    expect(left.y).toBeCloseTo(right.y, 5);
  });

  it('이륙은 오른쪽 위 45도로 가속해 -15도로 기울고 0.6배가 되며 날갯짓은 조금 빨라져 이어진다', () => {
    const hover = beat(2250);
    expect(hover.x).toBeCloseTo(0, 5);
    expect(hover.y).toBeCloseTo(-14, 5);
    expect(hover.rotation).toBeCloseTo(0, 5);
    const end = beat(3050);
    // 45도: 이동량이 오른쪽과 위로 같다
    expect(end.x).toBeCloseTo(GEOMETRY.distance, 5);
    expect(end.y - hover.y).toBeCloseTo(-GEOMETRY.distance, 5);
    expect(end.rotation).toBeCloseTo(-15, 5);
    expect(end.scale).toBeCloseTo(0.6, 5);
    // exit(power2.in, 3제곱) 가속: 앞쪽 절반은 전체의 8분의 1만 간다
    expect(beat(2250 + 400).x / GEOMETRY.distance).toBeCloseTo(0.125, 5);
    // 날갯짓은 이륙 중에도 이어지되 한 번이 350ms(아래 150 + 위 200)로 빨라졌다
    expect(beat(2250).downstroke).toBe(true);
    expect(beat(2399).downstroke).toBe(true);
    expect(beat(2400).downstroke).toBe(false);
    expect(beat(2600).downstroke).toBe(true);
    expect(beat(2600).wingAngle).toBeCloseTo(WING_UP, 5);
    expect(beat(2750).downstroke).toBe(false);
    expect(beat(2750).wingAngle).toBeCloseTo(WING_DOWN, 5);
  });

  it('보냈어요 표지는 3050ms부터 200ms에 떠오르고 그 전에는 투명하다', () => {
    expect(beat(3049).mark).toBe(0);
    expect(beat(3050).mark).toBe(0);
    expect(beat(3250).mark).toBeCloseTo(1, 5);
    expect(beat(5000).mark).toBeCloseTo(1, 5);
    expect(beat(3150).mark).toBeGreaterThan(0.5);
    // 보냈어요 단계에서도 단추는 이륙 끝에 머문다
    expect(beat(3250).x).toBeCloseTo(beat(3050).x, 5);
    expect(beat(3250).y).toBeCloseTo(beat(3050).y, 5);
  });

  it('음수 시각은 0과 같다', () => {
    expect(beat(-50)).toEqual(beat(0));
  });
});
