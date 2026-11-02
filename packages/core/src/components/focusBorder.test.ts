import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * 입력류의 키보드 포커스는 컨트롤 자신의 테두리로 알리고 바깥 링(outline·outline-offset·
 * focusRing 유틸)을 쓰지 않는다(사용자 결정, M7.1 T12a).
 *
 * vanilla-extract가 낸 클래스는 jsdom에서 계산값을 못 읽으므로 .css.ts 소스를 읽는다.
 * 한계: 소스 문자열이라 값이 맞는지는 못 본다(값은 e2e/inputFocusBorder.spec.ts가 잰다).
 * 단추류(Button·Card 등)는 사용자가 따로 정하므로 이 목록에 없다.
 */
const source = (name: string) =>
  readFileSync(join(__dirname, name, `${name}.css.ts`), 'utf-8');

// focusRing()을 아예 쓰지 않는 컨트롤
const RING_FREE = [
  'Checkbox',
  'Switch',
  'Slider',
  'SegmentedButtons',
  'GooeySearch',
];
// 안의 작은 단추 하나만 focusRing을 그대로 둔 컨트롤(Chip 삭제 단추, NumericSpinner +/- 단추)
const BUTTON_ONLY = ['Chip', 'NumericSpinner'];

describe('입력류 포커스는 바깥 링이 아니라 테두리다', () => {
  it.each(RING_FREE)(
    '%s: focusRing 유틸과 포커스 outline 규칙이 없다',
    (name) => {
      const css = source(name);
      expect(css).not.toContain('focusRing');
      expect(css).not.toContain('outlineOffset');
      // outline은 'none'(브라우저 기본 링 끄기)만 허용한다
      const outlines = css.match(/outline: [^,\n]*/g) ?? [];
      for (const declaration of outlines) {
        expect(declaration, `${name} ${declaration}`).toBe("outline: 'none'");
      }
    }
  );

  it.each(BUTTON_ONLY)(
    '%s: focusRing은 안의 작은 단추 하나에만 남는다(단추류 결정은 사용자 몫)',
    (name) => {
      const css = source(name);
      expect(css.match(/focusRing\(/g)).toHaveLength(1);
      expect(css).not.toContain('outlineOffset');
      expect(css).not.toMatch(/outline: `/);
    }
  );
});
