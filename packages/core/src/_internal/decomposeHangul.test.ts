import { describe, it, expect } from 'vitest';
import { decomposeHangul } from './decomposeHangul';

describe('decomposeHangul', () => {
  it('받침 없는 글자는 초성과 중성만 나눈다 (하 → ㅎ ㅏ)', () => {
    expect(decomposeHangul('하')).toEqual({ initial: 'ㅎ', medial: 'ㅏ' });
  });

  it('받침이 있으면 종성까지 나눈다 (한 → ㅎ ㅏ ㄴ)', () => {
    expect(decomposeHangul('한')).toEqual({
      initial: 'ㅎ',
      medial: 'ㅏ',
      final: 'ㄴ',
    });
  });

  it('겹받침은 한 조각이다 (닭 → ㄷ ㅏ ㄺ)', () => {
    expect(decomposeHangul('닭')).toEqual({
      initial: 'ㄷ',
      medial: 'ㅏ',
      final: 'ㄺ',
    });
  });

  it('겹모음은 한 조각이다 (왜 → ㅇ ㅙ)', () => {
    expect(decomposeHangul('왜')).toEqual({ initial: 'ㅇ', medial: 'ㅙ' });
  });

  it('쌍자음 초성과 겹받침 ㅄ도 호환용 자모로 나온다 (쓰 → ㅆ ㅡ, 값 → ㄱ ㅏ ㅄ)', () => {
    expect(decomposeHangul('쓰')).toEqual({ initial: 'ㅆ', medial: 'ㅡ' });
    expect(decomposeHangul('값')).toEqual({
      initial: 'ㄱ',
      medial: 'ㅏ',
      final: 'ㅄ',
    });
  });

  it('한글 음절이 아니면 null이다 (라틴, 숫자, 공백, 홀로 쓴 자모)', () => {
    for (const char of ['A', '1', ' ', '.', 'ㄱ', 'ㅏ']) {
      expect(decomposeHangul(char), char).toBeNull();
    }
  });

  it('음절 구간의 경계를 지킨다 (가 U+AC00, 힣 U+D7A3, 그 바깥 이웃은 null)', () => {
    expect(decomposeHangul('\uAC00')).toEqual({ initial: 'ㄱ', medial: 'ㅏ' });
    expect(decomposeHangul('\uD7A3')).toEqual({
      initial: 'ㅎ',
      medial: 'ㅣ',
      final: 'ㅎ',
    });
    expect(decomposeHangul('\uABFF')).toBeNull();
    expect(decomposeHangul('\uD7A4')).toBeNull();
  });

  it('조합용 자모가 아니라 호환용 자모(U+3131~U+318E)만 돌려준다', () => {
    for (const char of ['한', '닭', '왜', '값']) {
      const jamo = decomposeHangul(char);
      const pieces = [jamo?.initial, jamo?.medial, jamo?.final].filter(
        (piece): piece is string => piece !== undefined
      );
      for (const piece of pieces) {
        const code = piece.codePointAt(0) ?? 0;
        expect(code, `${char} → ${piece}`).toBeGreaterThanOrEqual(0x3131);
        expect(code, `${char} → ${piece}`).toBeLessThanOrEqual(0x318e);
      }
    }
  });
});
