import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * 입력류의 키보드 포커스는 컨트롤 자신의 테두리로 알리고 바깥 링(outline·outline-offset)을
 * 쓰지 않는다(사용자 결정, M7.1 T12a).
 *
 * vanilla-extract가 낸 클래스는 jsdom에서 계산값을 못 읽으므로 .css.ts 소스를 읽는다.
 * 한계: 소스 문자열이라 값이 맞는지는 못 본다(값은 e2e/inputFocusBorder.spec.ts가 잰다).
 * 바깥 링 전체를 막는 경계는 components/outerRingBoundary.test.ts가 맡는다.
 */
const source = (name: string) =>
  readFileSync(join(__dirname, name, `${name}.css.ts`), 'utf-8');

// 바깥 링을 아예 쓰지 않는 컨트롤
const RING_FREE = [
  'Chip',
  'NumericSpinner',
  'Checkbox',
  'Switch',
  'Slider',
  'SegmentedButtons',
  'GooeySearch',
];

describe('입력류 포커스는 바깥 링이 아니라 테두리다', () => {
  it.each(RING_FREE)('%s: 포커스 outline 규칙이 없다', (name) => {
    const css = source(name);
    expect(css).not.toContain('outlineOffset');
    // outline은 'none'(브라우저 기본 링 끄기)만 허용한다
    const outlines = css.match(/outline: [^,\n]*/g) ?? [];
    for (const declaration of outlines) {
      expect(declaration, `${name} ${declaration}`).toBe("outline: 'none'");
    }
  });
});

/**
 * 색이 채워진 단추의 포커스는 가장자리 안쪽 두 겹(자기 색의 짙은 단계 2px, 그 안쪽 흰 2px)이고
 * 바깥 링이 아니다(사용자 결정, M7.2 T1). 값은 e2e/buttonFocusSurface.spec.ts가 잰다.
 */
const FILLED = ['Button', 'BurstToggle', 'RocketButton'];

describe('채운 단추 포커스는 바깥 링이 아니라 안쪽 겹이다', () => {
  it.each(FILLED)('%s: outline 오프셋이 없다', (name) => {
    const css = source(name);
    expect(css).not.toContain('outlineOffset');
    expect(css).not.toMatch(/outline: `/);
  });

  it('FanMenu: 허브와 부채꼴 항목 모두 안쪽 두 겹이고 바깥 링이 없다', () => {
    const css = source('FanMenu');
    expect(css).not.toContain('outlineOffset');
    // 허브 하나, 항목 하나
    expect(css.match(/inset 0 0 0 4px/g)).toHaveLength(2);
  });

  it('Button strong 네 색은 포커스에 inset 두 겹을 그린다', () => {
    const css = source('Button');
    expect(css).toContain('inset 0 0 0 2px');
    expect(css).toContain('inset 0 0 0 4px');
  });
});

/**
 * 테두리가 있는 표면(Button weak, Card 누를 수 있는 변형, Avatar 누를 수 있을 때)의 포커스는 자기 가장자리
 * 안쪽 2px이고 바깥 링이 아니다(사용자 결정, M7.2 T2). 값은 e2e/buttonFocusSurface.spec.ts가 잰다.
 */
const BORDERED = ['Button', 'Card', 'Avatar'];

describe('테두리 있는 표면 포커스는 바깥 링이 아니라 안쪽 2px다', () => {
  it.each(BORDERED)('%s: outline 오프셋이 없다', (name) => {
    const css = source(name);
    expect(css).not.toContain('outlineOffset');
    expect(css).not.toMatch(/outline: `/);
  });

  it('Button weak 네 색은 호버 미디어 밖에서 포커스 테두리를 그린다', () => {
    const css = source('Button');
    // focusEdge가 weak compound 넷에 한 번씩 쓰인다
    expect(css.match(/focusEdge\(/g)).toHaveLength(4);
    // 사용처는 (hover: hover) 미디어 블록 바깥이어야 터치 기기에서 보인다
    for (const block of css.match(
      /\(hover: hover\) and \(pointer: fine\)': \{[\s\S]*?\n {10}\},/g
    ) ?? []) {
      expect(block).not.toContain('focusEdge');
    }
  });
});

/**
 * 면도 테두리도 없는 단추류(IconButton, 오버레이 닫기, Snackbar 닫기, HeaderBar·HeaderBarNav, BoardRow,
 * FanMenu 항목, NumericSpinner +/-, Chip 삭제)의 포커스는 호버와 같은 옅은 면과 가장자리 안쪽 2px다
 * (사용자 결정, M7.2 T3). 값은 e2e/buttonFocusSurface.spec.ts가 잰다.
 */
const SURFACELESS = [
  'IconButton',
  'Modal',
  'BottomSheet',
  'SideSheet',
  'Snackbar',
  'HeaderBar',
  'BoardRow',
  'FanMenu',
  'NumericSpinner',
  'Chip',
];

/** (hover: hover) 미디어 블록의 본문들. 중괄호를 세어 블록 끝을 찾는다. */
const hoverBlocks = (css: string): string[] => {
  const blocks: string[] = [];
  const key = "'(hover: hover) and (pointer: fine)': {";
  let from = css.indexOf(key);
  while (from !== -1) {
    let depth = 0;
    let end = from + key.length - 1;
    for (; end < css.length; end += 1) {
      if (css[end] === '{') depth += 1;
      if (css[end] === '}') depth -= 1;
      if (depth === 0) break;
    }
    blocks.push(css.slice(from, end + 1));
    from = css.indexOf(key, end);
  }
  return blocks;
};

describe('면도 테두리도 없는 단추류 포커스는 바깥 링이 아니라 안쪽 2px다', () => {
  it.each([...SURFACELESS, 'HeaderBarNav'])(
    '%s: outline 오프셋이 없다',
    (name) => {
      const css = readFileSync(
        join(
          __dirname,
          name === 'HeaderBarNav' ? 'HeaderBar' : name,
          `${name}.css.ts`
        ),
        'utf-8'
      );
      expect(css).not.toContain('outlineOffset');
      expect(css).not.toMatch(/outline: `/);
    }
  );

  // 무엇을 되돌리면 빨개지는가: 포커스 규칙을 호버 미디어 안으로 옮기면(터치 기기에서 사라진다).
  it.each([...SURFACELESS, 'HeaderBarNav'])(
    '%s: 호버 미디어 블록 안에 :focus-visible이 없다',
    (name) => {
      const css = readFileSync(
        join(
          __dirname,
          name === 'HeaderBarNav' ? 'HeaderBar' : name,
          `${name}.css.ts`
        ),
        'utf-8'
      );
      for (const block of hoverBlocks(css)) {
        expect(block).not.toContain('focus-visible');
      }
    }
  );

  it('IconButton: 포커스 규칙이 tint 한 곳을 거쳐 8조합과 ghost에 모두 붙는다', () => {
    const css = source('IconButton');
    // 채운 4색 + 옅은 4색 + ghost = tint 호출 9번(정의 한 번 별도)
    expect(css.match(/\.\.\.tint\(/g)).toHaveLength(9);
    expect(css).toContain("'&:focus-visible': focus");
  });
});
