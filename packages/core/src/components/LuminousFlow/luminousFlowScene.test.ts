import { describe, expect, it } from 'vitest';
import {
  POSE_COUNT,
  atoms,
  bends,
  centerline,
  centerlinePath,
  envelopePaths,
  strands,
} from './luminousFlowScene';
import { palette } from './luminousFlowPalette';

// 장면 계산은 모듈 수준 순수 계산이라 결정적이다. 값을 잠가 두면 앵커·곡선 식·시드를
// 건드린 회귀가 바로 빨개진다(원본을 옮긴 값과 같다).
describe('빛 물줄기 장면 계산', () => {
  it('중심선 첫 점과 끝 점, 한가운데 점의 좌표와 폭이 고정이다', () => {
    expect(centerline).toHaveLength(121);
    const [x0, y0, w0] = centerline[0];
    expect(x0).toBeCloseTo(507, 6);
    expect(y0).toBeCloseTo(-30.8333333, 6);
    expect(w0).toBeCloseTo(74.25, 6);
    const [x1, y1, w1] = centerline[120];
    expect(x1).toBeCloseTo(-15, 6);
    expect(y1).toBeCloseTo(1914.1666667, 6);
    expect(w1).toBeCloseTo(68.6471691, 6);
    const [xm, ym, wm] = centerline[60];
    expect(xm).toBeCloseTo(343.6666667, 6);
    expect(ym).toBeCloseTo(971.3333333, 6);
    expect(wm).toBeCloseTo(97.2, 6);
  });

  it('빛줄기는 28가닥이고 가닥마다 포즈가 16+1개이며 마지막 포즈가 첫 포즈와 같다', () => {
    expect(strands).toHaveLength(28);
    expect(POSE_COUNT).toBe(16);
    for (const { poses } of strands) {
      expect(poses).toHaveLength(POSE_COUNT + 1);
      expect(poses[POSE_COUNT]).toEqual(poses[0]);
      expect(poses[0]).toHaveLength(centerline.length);
    }
    expect(strands[0].poses[0][0]).toEqual([507, -30.833333333333336]);
    const [x, y] = strands[5].poses[3][40];
    expect(x).toBeCloseTo(184.3227854, 6);
    expect(y).toBeCloseTo(639.5027464, 6);
  });

  it('가닥 색은 고정 팔레트에서만 고른다(파랑은 7의 배수 가닥)', () => {
    expect(strands.map((s) => s.color).slice(0, 8)).toEqual([
      palette.blue,
      palette.glow,
      palette.cyan,
      palette.blue,
      palette.depth,
      palette.cyan,
      palette.glow,
      palette.blue,
    ]);
    expect(strands[0].blue).toBe(true);
    expect(strands[1].blue).toBe(false);
  });

  it('빛 알갱이는 48개이고 각자 가닥 하나를 탄다', () => {
    expect(atoms).toHaveLength(48);
    expect(atoms[7]).toEqual({
      index: 7,
      strand: 24,
      phase: '0.3962',
      duration: 58,
      radius: 1.25,
    });
    for (const { strand } of atoms) {
      expect(strand).toBeGreaterThanOrEqual(0);
      expect(strand).toBeLessThan(strands.length);
    }
  });

  it('굽이 다섯 곳과 대기층 겹 80장, 중심선 경로 문자열이 고정이다', () => {
    expect(bends).toHaveLength(5);
    expect(bends[0][0]).toBeCloseTo(212.408179, 6);
    expect(bends[0][1]).toBeCloseTo(221.382716, 6);
    expect(envelopePaths).toHaveLength(80);
    expect(envelopePaths[0]).toMatch(/^M .* Z$/);
    expect(
      centerlinePath.startsWith('M 507.000 -30.833 C 503.831 -28.993')
    ).toBe(true);
  });
});
