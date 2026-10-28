import { describe, it, expect } from 'vitest';
import { decomposeHangul } from './decomposeHangul';
import { jamoSlots } from './jamoSlots';

const slotsOf = (char: string) => {
  const parts = decomposeHangul(char);
  if (!parts) throw new Error(`${char}는 음절이 아니다`);
  return jamoSlots(parts);
};

describe('jamoSlots', () => {
  it('조각 수만큼 자리를 주고 크기는 0.5~0.65배다 (둘이면 큼, 셋이면 작음)', () => {
    for (const char of ['하', '고', '과']) {
      const slots = slotsOf(char);
      expect(slots, char).toHaveLength(2);
      expect(
        slots.every((s) => s.scale === 0.65),
        char
      ).toBe(true);
    }
    for (const char of ['한', '곧', '관']) {
      const slots = slotsOf(char);
      expect(slots, char).toHaveLength(3);
      expect(
        slots.every((s) => s.scale === 0.5),
        char
      ).toBe(true);
    }
  });

  it('세로 모음은 초성 오른쪽에 모음이 놓인다 (하)', () => {
    const [initial, medial] = slotsOf('하');
    expect(medial.x).toBeGreaterThan(initial.x);
    expect(medial.y).toBe(initial.y);
  });

  it('가로 모음은 초성 아래에 모음이 놓인다 (고)', () => {
    const [initial, medial] = slotsOf('고');
    expect(medial.y).toBeGreaterThan(initial.y);
    expect(medial.x).toBe(initial.x);
  });

  it('받침은 언제나 가장 아래 가운데다 (한, 곧, 관)', () => {
    for (const char of ['한', '곧', '관']) {
      const slots = slotsOf(char);
      const final = slots[2];
      expect(final.x, char).toBe(0);
      expect(final.y, char).toBeGreaterThan(Math.max(slots[0].y, slots[1].y));
    }
  });

  it('조각마다 자리가 다르다', () => {
    for (const char of ['하', '고', '과', '한', '곧', '관']) {
      const keys = slotsOf(char).map((s) => `${s.x},${s.y}`);
      expect(new Set(keys).size, char).toBe(keys.length);
    }
  });
});
