/**
 * reduced-motion 전역 규칙의 delay 커버리지(R35)와 Loader 점 페이드의 `both`
 * 고착(R31·R36)을 원문 읽기로 잠근다.
 *
 * getComputedStyle로 검증하지 않는 이유: vitest.config.ts의 css.include가
 * Slider.css만 남기도록 좁혀져 있어 theme.css.ts·Loader.css.ts는
 * 테스트에 주입되지 않고(빈 문자열로 목킹됨), 넓혀도 jsdom은 matchMedia와
 * @media 캐스케이드를 구현하지 않아 reduced-motion 자체가 도달 불가능한
 * 상태다. touchAction.test.ts·llms.test.ts의 선례를 따라 소스 텍스트를 직접
 * 읽어 단언한다.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const THEME_CSS = readFileSync(resolve(__dirname, 'theme.css.ts'), 'utf-8');
const LOADER_CSS = readFileSync(
  resolve(__dirname, '../components/Loader/Loader.css.ts'),
  'utf-8'
);

/** `export const <name> = ...;` 또는 `globalStyle(...)` 호출 하나를 소스에서 잘라낸다. */
function block(source: string, startMarker: string): string {
  const start = source.indexOf(startMarker);
  expect(start, `'${startMarker}' 선언을 찾지 못했다`).toBeGreaterThan(-1);
  const end = source.indexOf('\n});', start);
  expect(end, `'${startMarker}' 선언의 끝을 찾지 못했다`).toBeGreaterThan(
    start
  );
  return source.slice(start, end);
}

describe('전역 reduced-motion 규칙이 delay까지 리셋한다 (R35)', () => {
  it('animationDelay와 transitionDelay를 0.01ms !important로 덮는다', () => {
    const reduceRule = block(THEME_CSS, "globalStyle('*, *::before, *::after'");
    expect(reduceRule).toMatch(/animationDelay: '-?0\.01ms !important'/);
    expect(reduceRule).toMatch(/transitionDelay: '-?0\.01ms !important'/);
  });
});

describe('Loader의 fadeInOut이 reduced-motion에서 opacity 0.2로 고착되지 않는다 (R31·R36)', () => {
  it('dot의 animation fill-mode가 both가 아니라 backwards다', () => {
    const dotBlock = block(LOADER_CSS, 'export const dot = ');
    // both = backwards + forwards. infinite라 forwards는 평상 모드에서 죽은
    // 코드이고, reduce가 animationIterationCount를 1로 접는 순간에만
    // 100% 프레임(opacity: 0.2, '0%, 100%' 한 줄이라 100%도 0.2)을 고정한다.
    // backwards만 남기면 그 절반이 사라져 애니메이션 종료 후 base(opacity
    // 미선언 → 1)로 복귀한다.
    expect(dotBlock).toMatch(/animation: `\$\{fadeInOut\}[^`]*\bbackwards`/);
    expect(dotBlock).not.toMatch(/\bboth\b/);
  });
});
