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

  // 예외는 없다. 컴포넌트가 원본을 직접 import하면 실패한다.
  it('컴포넌트가 색 원본을 직접 import하지 않는다', () => {
    expect(consumers.map(rel)).toEqual([]);
  });

  it('Chip.css.ts는 원본을 읽지 않는다', () => {
    const source = readFileSync(
      resolve(COMPONENTS, 'Chip/Chip.css.ts'),
      'utf-8'
    );
    expect(RAW_COLORS_IMPORT.test(source)).toBe(false);
  });
});
