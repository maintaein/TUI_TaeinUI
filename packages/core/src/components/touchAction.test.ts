import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * components/ 아래 모든 *.css.ts 경로를 재귀적으로 수집한다. 특정 파일 목록을
 * 하드코딩하면 새 컴포넌트가 탭 대상을 들고 들어와도 이 테스트가 못 잡는다.
 */
function findCssFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...findCssFiles(full));
    } else if (entry.endsWith('.css.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('탭 대상 touch-action 잠금', () => {
  it("cursor: 'pointer'가 있는 스타일마다 touchAction: 'manipulation'이 짝을 이룬다", () => {
    // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
    // 읽는다 — .css.ts 소스 텍스트를 읽어 두 문자열의 출현 횟수를 파일 단위로
    // 대조한다. Slider는 예외다: touch-action: manipulation은
    // pan-x pan-y pinch-zoom과 같은 뜻이라 <input type="range"> 썸을 가로로
    // 끄는 동작을 브라우저가 가로 패닝으로 가져갈 여지를 남긴다 — 드래그는
    // 브라우저가 처리하게 둔다.
    // 한계: 짝이 아니라 파일 단위 개수만 센다. cursor: 'pointer' 3개와
    // touchAction 3개가 서로 다른 스타일에 흩어져 있어도 통과한다 — "같은
    // 스타일에 붙어 있다"까지는 보증하지 않는다.
    const cssFiles = findCssFiles(__dirname).filter(
      (path) => basename(dirname(path)) !== 'Slider'
    );
    expect(cssFiles.length).toBeGreaterThan(0);

    for (const path of cssFiles) {
      const source = readFileSync(path, 'utf-8');
      const cursorCount = source.match(/cursor: 'pointer'/g)?.length ?? 0;
      const touchActionCount =
        source.match(/touchAction: 'manipulation'/g)?.length ?? 0;
      expect(touchActionCount, path).toBe(cursorCount);
    }
  });
});
