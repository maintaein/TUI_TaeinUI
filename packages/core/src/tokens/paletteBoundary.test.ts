/**
 * 색 원본(`tokens/colors.css`)을 컴포넌트가 직접 읽지 않고 테마 계약의
 * `palette`를 거치게 하는 경계를 잠근다(M5 가22).
 *
 * 계약을 거치면 값이 CSS 변수로 나가서 한 곳에서 테마를 바꿀 수 있다. 원본을 직접
 * 읽으면 hex가 컴포넌트 CSS에 박혀 그 길이 끊긴다.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { success, warning } from './colors.css';
import { themeTokens } from './contract';
import { SRC, rel, findFiles } from '../test/sourceScan';

const COMPONENTS = resolve(SRC, 'components');

// 원본을 직접 import하는 소스. `.test.`는 값 비교용이라 제외한다.
const RAW_COLORS_IMPORT = /from\s*['"][^'"]*tokens\/colors\.css['"]/;
const consumers = findFiles(
  COMPONENTS,
  (name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)
).filter((file) => RAW_COLORS_IMPORT.test(readFileSync(file, 'utf-8')));

describe('palette 경계', () => {
  it('palette.success가 원본 success 스케일 그대로다', () => {
    expect(themeTokens.palette.success).toEqual(success);
  });

  it('palette.warning이 원본 warning 스케일 그대로다', () => {
    expect(themeTokens.palette.warning).toEqual(warning);
  });

  // 예외는 이유와 함께 올린다. 목록에 없는 새 직접 import는 실패하고,
  // 목록에 있는데 더는 없는 항목도 실패한다.
  const ALLOWED: Record<string, string> = {
    // color prop이 임의의 CSS 색 문자열도 받아 spinner/dots 경로가 preset을
    // raw 값으로 풀어야 한다(Loader.tsx 주석). 계약의 var()로는 이 분기가 안 된다.
    'components/Loader/Loader.tsx': 'Loader color preset을 raw 값으로 푼다',
  };

  it('컴포넌트가 색 원본을 직접 import하지 않는다(예외 목록 밖)', () => {
    const violators = consumers.map(rel).filter((file) => !(file in ALLOWED));
    expect(violators).toEqual([]);
  });

  it('예외 목록의 항목이 여전히 원본을 직접 import한다', () => {
    expect(consumers.map(rel)).toEqual(Object.keys(ALLOWED).sort());
  });

  it('Chip.css.ts는 원본을 읽지 않는다', () => {
    const source = readFileSync(
      resolve(COMPONENTS, 'Chip/Chip.css.ts'),
      'utf-8'
    );
    expect(RAW_COLORS_IMPORT.test(source)).toBe(false);
  });
});
