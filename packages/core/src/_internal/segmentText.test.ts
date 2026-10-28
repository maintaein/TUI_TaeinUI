import { describe, it, expect } from 'vitest';
import { segmentText } from './segmentText';

describe('segmentText', () => {
  it('낱말은 자소군 배열이고 공백은 문자열 그대로 사이에 낀다', () => {
    expect(segmentText('안녕  hi')).toEqual([['안', '녕'], '  ', ['h', 'i']]);
  });

  it('앞뒤 공백은 문자열로 남고 빈 낱말은 만들지 않는다', () => {
    expect(segmentText(' a ')).toEqual([' ', ['a'], ' ']);
    expect(segmentText('')).toEqual([]);
  });

  it('조합용 자모(NFD)는 음절 하나로 합쳐 한 칸이 된다', () => {
    const nfd = '한'.normalize('NFD');
    expect(nfd).not.toBe('한');
    expect(segmentText(nfd)).toEqual([['한']]);
  });

  it('ZWJ 이모지와 결합 부호는 갈리지 않고 한 칸이 된다', () => {
    const family = '👨‍👩‍👧';
    expect(segmentText(family)).toEqual([[family]]);
    expect(segmentText('e\u0301')).toEqual([['\u00e9']]);
  });
});
