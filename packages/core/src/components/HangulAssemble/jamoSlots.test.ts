import { describe, it, expect } from 'vitest';
import { decomposeHangul } from './decomposeHangul';
import { jamoSlots } from './jamoSlots';

const slotsOf = (char: string) => {
  const parts = decomposeHangul(char);
  if (!parts) throw new Error(`${char}는 음절이 아니다`);
  return jamoSlots(parts);
};

const OPEN = { 하: 'vertical', 고: 'horizontal', 과: 'mixed' } as const;
const CLOSED = { 한: 'vertical', 곧: 'horizontal', 관: 'mixed' } as const;

describe('jamoSlots', () => {
  it('조각 수만큼 자리를 주고 크기는 0.5~0.65배다 (둘이면 큼, 셋이면 작음)', () => {
    for (const char of Object.keys(OPEN)) {
      const slots = slotsOf(char);
      expect(slots, char).toHaveLength(2);
      expect(
        slots.every((s) => s.scale === 0.65),
        char
      ).toBe(true);
    }
    for (const char of Object.keys(CLOSED)) {
      const slots = slotsOf(char);
      expect(slots, char).toHaveLength(3);
      expect(
        slots.every((s) => s.scale === 0.5),
        char
      ).toBe(true);
    }
  });

  // 받침이 있든 없든 모음 방향이 초성과 모음의 상대 위치를 정한다.
  it.each([...Object.entries(OPEN), ...Object.entries(CLOSED)])(
    '%s: 초성과 모음의 상대 위치가 모음 방향(%s)을 따른다',
    (char, shape) => {
      const [initial, medial] = slotsOf(char);
      if (shape === 'vertical') {
        // 세로 모음은 초성의 오른쪽, 높이는 같다
        expect(medial.x).toBeGreaterThan(initial.x);
        expect(medial.y).toBe(initial.y);
      } else if (shape === 'horizontal') {
        // 가로 모음은 초성의 아래, 가로 자리는 같다
        expect(medial.y).toBeGreaterThan(initial.y);
        expect(medial.x).toBe(initial.x);
      } else {
        // 섞인 모음은 초성의 오른쪽 아래
        expect(medial.x).toBeGreaterThan(initial.x);
        expect(medial.y).toBeGreaterThan(initial.y);
      }
    }
  );

  it('받침은 언제나 가장 아래 가운데다 (한, 곧, 관)', () => {
    for (const char of Object.keys(CLOSED)) {
      const slots = slotsOf(char);
      const final = slots[2];
      expect(final.x, char).toBe(0);
      expect(final.y, char).toBeGreaterThan(Math.max(slots[0].y, slots[1].y));
    }
  });

  it('조각마다 자리가 다르다', () => {
    for (const char of [...Object.keys(OPEN), ...Object.keys(CLOSED)]) {
      const keys = slotsOf(char).map((s) => `${s.x},${s.y}`);
      expect(new Set(keys).size, char).toBe(keys.length);
    }
  });

  it('겹모음은 섞인 모양이다 (왜 → 모음이 초성의 오른쪽 아래)', () => {
    const [initial, medial] = slotsOf('왜');
    expect(medial.x).toBeGreaterThan(initial.x);
    expect(medial.y).toBeGreaterThan(initial.y);
  });
});
