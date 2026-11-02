import { describe, expect, it } from 'vitest';
import {
  MAX_BENDS,
  MIN_BENDS,
  POSE_COUNT,
  REFERENCE_HEIGHT,
  SCENE_WIDTH,
  bendsForBox,
  createScene,
} from './luminousFlowScene';
import { palette } from './luminousFlowPalette';

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// 장면 계산은 순수 계산이라 결정적이다. n=6은 굽이 수가 고정이던 때의 장면(머리 + 한 벌 + 마감)과 같은 물길이라
// 그때 값을 그대로 잠가 앵커·곡선 식·시드를 건드린 회귀가 바로 빨개진다.
describe('빛 물줄기 장면 함수', () => {
  it('굽이 수 6은 옛 고정 장면의 중심선과 같다(첫 점, 한가운데 점, 끝 점)', () => {
    const { centerline } = createScene(6);
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

  it('장면 높이는 굽이 수에 따라 한 벌(520)씩 늘고, 굽이 위치 개수가 굽이 수다', () => {
    const heights = range(MIN_BENDS, MIN_BENDS + 8).map(
      (n) => createScene(n).height
    );
    heights.slice(1).forEach((height, i) => {
      expect(height - heights[i]).toBe(520);
    });
    for (const n of [MIN_BENDS, 6, 7, 20, MAX_BENDS]) {
      expect(createScene(n).bends).toHaveLength(n);
    }
  });

  it('마지막 굽이 방향이 굽이 수를 따른다: 짝수는 왼쪽 밖(x<0), 홀수는 오른쪽 밖(x>492)', () => {
    for (const n of range(MIN_BENDS, MIN_BENDS + 12)) {
      const { centerline } = createScene(n);
      const end = centerline[centerline.length - 1];
      if (n % 2 === 0) expect(end[0]).toBeLessThan(0);
      else expect(end[0]).toBeGreaterThan(SCENE_WIDTH);
    }
  });

  it('굽이는 한 벌씩 왼쪽과 오른쪽을 번갈아 맞물리고 한 벌마다 같은 모양이 520 아래에 이어진다', () => {
    const { centerline, bends } = createScene(MIN_BENDS + 8);
    // 한 벌의 중심선 점: 한 벌 u는 앵커 8+4u부터 4구간이고 구간마다 점이 6개다
    const unit = (index: number) =>
      centerline.slice(6 * (8 + 4 * index), 6 * (12 + 4 * index));
    // 같은 방향 두 벌(둘 다 앞뒤에 한 벌씩 있는 안쪽 벌)은 y만 1040 다르다
    unit(2).forEach(([x, y, width], i) => {
      const [x2, y2, width2] = unit(4)[i];
      expect(x2).toBeCloseTo(x, 6);
      expect(y2 - y).toBeCloseTo(1040, 6);
      expect(width2).toBeCloseTo(width, 6);
    });
    // 이웃한 한 벌은 좌우가 뒤집힌 짝이다
    unit(3).forEach(([x, y, width], i) => {
      const [x2, y2, width2] = unit(2)[i];
      expect(x + x2).toBeCloseTo(SCENE_WIDTH, 6);
      expect(y - y2).toBeCloseTo(520, 6);
      expect(width).toBeCloseTo(width2, 6);
    });
    // 굽이 빛도 한 벌 간격(520)이고 좌우가 번갈아 있다
    const unitBends = bends.slice(2, 2 + 8);
    unitBends.slice(1).forEach(([x, y], i) => {
      expect(y - unitBends[i][1]).toBeGreaterThan(500);
      expect(y - unitBends[i][1]).toBeLessThan(540);
      expect(x < SCENE_WIDTH / 2).toBe(unitBends[i][0] > SCENE_WIDTH / 2);
    });
  });

  it('이음매(머리-한 벌, 한 벌-한 벌, 한 벌-마감)가 옛 장면 안의 가장 큰 점 사이 변화보다 크지 않다', () => {
    // 점 사이 거리, 폭 변화, 이웃 법선의 닮음(내적). 옛 장면(n=6)이 이미 갖고 있는 최댓값이 기준이다
    const worst = (n: number) => {
      const { centerline } = createScene(n);
      const result = { step: 0, width: 0, turn: 1 };
      centerline.slice(1).forEach(([x, y, width, nx, ny], i) => {
        const [px, py, pw, pnx, pny] = centerline[i];
        result.step = Math.max(result.step, Math.hypot(x - px, y - py));
        result.width = Math.max(result.width, Math.abs(width - pw));
        result.turn = Math.min(result.turn, nx * pnx + ny * pny);
      });
      return result;
    };
    const base = worst(6);
    for (const n of [MIN_BENDS, 7, 8, 13]) {
      const now = worst(n);
      expect(now.step).toBeLessThanOrEqual(base.step + 1e-6);
      expect(now.width).toBeLessThanOrEqual(base.width + 1e-6);
      expect(now.turn).toBeGreaterThanOrEqual(base.turn - 1e-6);
    }
  });

  it('같은 굽이 수는 같은 장면 객체이고, 오래 안 쓴 장면부터 버려 쌓이지 않는다', () => {
    const first = createScene(8);
    expect(createScene(8)).toBe(first);
    expect(createScene(9)).not.toBe(first);
    // 한도(4개)를 넘게 훑으면 8이 밀려난다
    [9, 10, 11, 12].forEach((n) => createScene(n));
    expect(createScene(8)).not.toBe(first);
  });

  it('범위 밖 굽이 수는 가까운 끝으로 자른다', () => {
    expect(createScene(0)).toBe(createScene(MIN_BENDS));
    expect(createScene(MAX_BENDS + 30)).toBe(createScene(MAX_BENDS));
  });

  it('물길 띠 80겹과 빛줄기 28가닥은 길이와 상관없고, 알갱이는 단위 높이당 개수·속도가 같다', () => {
    for (const n of [MIN_BENDS, 9, 20]) {
      const { envelopePaths, strands, atoms, height } = createScene(n);
      expect(envelopePaths).toHaveLength(80);
      expect(strands).toHaveLength(28);
      expect(atoms.length / height).toBeCloseTo(48 / REFERENCE_HEIGHT, 2);
      const growth = height / REFERENCE_HEIGHT;
      expect(atoms[7].duration).toBeCloseTo(58 * growth, 6);
    }
  });

  it('빛줄기는 가닥마다 포즈가 16+1개이고 마지막 포즈가 첫 포즈와 같으며 첫 점이 옛 값이다', () => {
    const { strands, centerline } = createScene(6);
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
    const { strands } = createScene(MIN_BENDS);
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

  it('빛 알갱이는 각자 가닥 하나를 타고 굽이 수 6에서는 옛 값과 같다(속도 배율만 높이에 비례)', () => {
    const { atoms, strands, height } = createScene(6);
    expect(atoms[7]).toEqual({
      index: 7,
      strand: 24,
      phase: '0.3962',
      duration: (58 * height) / REFERENCE_HEIGHT,
      radius: 1.25,
    });
    for (const { strand } of atoms) {
      expect(strand).toBeGreaterThanOrEqual(0);
      expect(strand).toBeLessThan(strands.length);
    }
  });

  it('굽이 첫 자리와 대기층 겹 80장, 중심선 경로 문자열 머리가 고정이다', () => {
    const { bends, envelopePaths, centerlinePath } = createScene(6);
    expect(bends[0][0]).toBeCloseTo(212.408179, 6);
    expect(bends[0][1]).toBeCloseTo(221.382716, 6);
    expect(envelopePaths[0]).toMatch(/^M .* Z$/);
    expect(
      centerlinePath.startsWith('M 507.000 -30.833 C 503.831 -28.993')
    ).toBe(true);
  });
});

describe('상자 크기에서 굽이 수 고르기', () => {
  const scaledHeight = (width: number, n: number) =>
    (createScene(n).height * width) / SCENE_WIDTH;

  it('아주 짧은 상자와 옛 318 구간 상자는 가장 짧은 장면이다(머리와 마감만)', () => {
    expect(bendsForBox(492, 40)).toBe(MIN_BENDS);
    expect(bendsForBox(492, 318)).toBe(MIN_BENDS);
    expect(bendsForBox(1080, 620)).toBe(MIN_BENDS);
  });

  it('긴 상자는 굽이가 늘고, 고른 장면이 상자를 덮는 가장 작은 굽이 수다', () => {
    for (const [width, height] of [
      [492, 1445],
      [492, 1446],
      [492, 2162],
      [492, 20000],
      [320, 5000],
      [1440, 9000],
    ]) {
      const n = bendsForBox(width, height);
      expect(scaledHeight(width, n)).toBeGreaterThanOrEqual(height);
      if (n > MIN_BENDS)
        expect(scaledHeight(width, n - 1)).toBeLessThan(height);
    }
    expect(bendsForBox(492, 2162)).toBe(MIN_BENDS + 2);
  });

  it('폭이 좁아지면 같은 높이가 더 긴 장면을 부른다(배율은 폭 기준)', () => {
    expect(bendsForBox(246, 2162)).toBeGreaterThan(bendsForBox(492, 2162));
    expect(bendsForBox(984, 2162)).toBeLessThan(bendsForBox(492, 2162));
  });

  it('상한에서 멈추고 크기를 모르면(0) 가장 짧은 장면이다', () => {
    expect(bendsForBox(492, 1e6)).toBe(MAX_BENDS);
    expect(bendsForBox(0, 500)).toBe(MIN_BENDS);
    expect(bendsForBox(500, 0)).toBe(MIN_BENDS);
  });
});

describe('가닥의 누적 길이와 y 범위(보이는 구간만 그리는 데 쓴다)', () => {
  // 되돌리면 빨개지는 것: poseLengths를 첫 포즈 것으로 두면 섞은 포즈와 20 단위 가까이 어긋나 아래 단언이 깨진다.
  // 점선 위상이 보이는 첫 구간 앞의 길이를 이 값으로 읽으므로, 어긋남이 작아야 첫 구간이 바뀔 때 점선이 튀지 않는다
  it('poseLengths를 섞은 값은 섞은 포즈의 실제 누적 길이와 가깝고, 첫 포즈 길이는 그렇지 않다', () => {
    const cumulativeOf = (points: number[][]) => {
      const total = [0];
      for (let sample = 1; sample < points.length; sample++)
        total.push(
          total[sample - 1] +
            Math.hypot(
              points[sample][0] - points[sample - 1][0],
              points[sample][1] - points[sample - 1][1]
            )
        );
      return total;
    };
    let worstMixed = 0;
    let worstFirst = 0;
    for (const { poses, poseLengths } of createScene(9).strands) {
      expect(poseLengths).toHaveLength(poses.length);
      for (const [first, fraction] of [
        [3, 0.5],
        [8, 0.25],
        [12, 0.9],
      ]) {
        const mixedPose = poses[first].map((point, sample) =>
          point.map(
            (value, axis) =>
              value + (poses[first + 1][sample][axis] - value) * fraction
          )
        );
        const actual = cumulativeOf(mixedPose);
        for (let sample = 0; sample < actual.length; sample++) {
          const mixed =
            poseLengths[first][sample] +
            (poseLengths[first + 1][sample] - poseLengths[first][sample]) *
              fraction;
          // 보이는 첫 구간이 한 칸 바뀔 때 점선 위상이 튀는 양은 한 칸 사이 어긋남의 변화다(누적 오차 전체가 아니다)
          if (sample) {
            const previous =
              poseLengths[first][sample - 1] +
              (poseLengths[first + 1][sample - 1] -
                poseLengths[first][sample - 1]) *
                fraction;
            worstMixed = Math.max(
              worstMixed,
              Math.abs(mixed - previous - (actual[sample] - actual[sample - 1]))
            );
            worstFirst = Math.max(
              worstFirst,
              Math.abs(
                poseLengths[0][sample] -
                  poseLengths[0][sample - 1] -
                  (actual[sample] - actual[sample - 1])
              )
            );
          }
        }
      }
    }
    expect(worstMixed).toBeLessThan(1);
    expect(worstFirst).toBeGreaterThan(5);
  });

  const scene = createScene(9);

  // 되돌리면 빨개지는 것: 누적 길이를 첫 포즈가 아닌 값으로 만들거나 합산 식을 바꾸면 점 사이 거리 합과 어긋난다
  it('lengths는 첫 포즈 점 사이 거리의 누적이다', () => {
    for (const { poses, lengths } of scene.strands) {
      expect(lengths).toHaveLength(poses[0].length);
      expect(lengths[0]).toBe(0);
      let sum = 0;
      for (let sample = 1; sample < lengths.length; sample++) {
        sum += Math.hypot(
          poses[0][sample][0] - poses[0][sample - 1][0],
          poses[0][sample][1] - poses[0][sample - 1][1]
        );
        expect(lengths[sample]).toBeCloseTo(sum, 6);
      }
    }
  });

  // 되돌리면 빨개지는 것: 단조가 깨지면 이진 탐색이 틀린 점을 가리키고, 포즈를 빠뜨리면 아래 경계 단언이 깨진다.
  // 0번 포즈는 마지막 포즈와 같은 배열이라 0번만 빠뜨리는 변이는 값이 같아 잡히지 않는다(동치 변이). 그 밖의 포즈를 빠뜨리면 빨개진다
  it('preMaxY는 점 앞쪽의 모든 포즈 y 최댓값, sufMinY는 점 뒤쪽 최솟값이고 둘 다 단조다', () => {
    for (const { poses, preMaxY, sufMinY } of scene.strands) {
      const count = poses[0].length;
      for (let sample = 0; sample < count; sample++) {
        let max = -Infinity;
        let min = Infinity;
        for (let before = 0; before <= sample; before++)
          for (const pose of poses) max = Math.max(max, pose[before][1]);
        for (let after = sample; after < count; after++)
          for (const pose of poses) min = Math.min(min, pose[after][1]);
        expect(preMaxY[sample]).toBe(max);
        expect(sufMinY[sample]).toBe(min);
        if (sample) {
          expect(preMaxY[sample]).toBeGreaterThanOrEqual(preMaxY[sample - 1]);
          expect(sufMinY[sample]).toBeGreaterThanOrEqual(sufMinY[sample - 1]);
        }
      }
    }
  });
});
