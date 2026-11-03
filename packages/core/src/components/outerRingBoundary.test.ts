import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { SRC, findFiles, rel, stripComments } from '../test/sourceScan';

/**
 * 바깥 포커스 링 금지 경계(사용자 결정, M7.2). 포커스는 요소 가장자리 안쪽에만 그린다.
 * 소스 훑기라 값이 맞는지(색·두께)는 못 본다. 값은 e2e/buttonFocusSurface.spec.ts가 잰다.
 *
 * 검사 대상은 components/**\/*.css.ts의 포커스 선택자(`:focus`, `:focus-visible`,
 * `:focus-within`)가 가리키는 스타일이다. 선택자 값이 `focusInset(...)` 같은
 * 헬퍼 호출이나 식별자면 같은 파일의 선언을 따라가 본다.
 * 막는 것: outlineOffset, 'none'이 아닌 outline, inset이 아닌 boxShadow.
 */

const FOCUS_KEY =
  /(['"`])((?:(?!\1)[^\n])*:focus(?:(?!\1)[^\n])*)\1\]?\s*:\s*/g;

/** `start`의 여는 괄호에서 짝이 맞는 닫는 괄호까지 자른다. */
function balanced(text: string, start: number): string {
  const pairs: Record<string, string> = { '{': '}', '(': ')', '[': ']' };
  const open = text[start];
  const close = pairs[open];
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close && --depth === 0)
      return text.slice(start, i + 1);
  }
  return text.slice(start);
}

/** 포커스 선택자가 가리키는 스타일 텍스트를 모두 모은다(헬퍼 선언 포함). */
function focusBlocks(source: string): string[] {
  const code = stripComments(source);
  const blocks: string[] = [];
  for (const m of code.matchAll(FOCUS_KEY)) {
    const at = m.index + m[0].length;
    if (code[at] === '{') {
      blocks.push(balanced(code, at));
      continue;
    }
    const name = code.slice(at).match(/^[A-Za-z_$][\w$]*/)?.[0];
    if (!name) continue;
    blocks.push(code.slice(at, at + name.length));
    // 최상위 선언 하나(다음 최상위 const·export·function 전까지)
    const decl = code.match(
      new RegExp(
        `^(?:export )?(?:const|function) ${name.replace('$', '\\$')}\\b[\\s\\S]*?(?=\\n(?:export |const |function )|$)`,
        'm'
      )
    )?.[0];
    if (decl) blocks.push(decl);
  }
  return blocks;
}

/** 바깥 링으로 읽히는 선언을 돌려준다. */
function outerRingViolations(block: string): string[] {
  const found: string[] = [];
  if (/\boutlineOffset\b/.test(block)) found.push('outlineOffset');
  for (const m of block.matchAll(/\boutline(?!Offset)\w*:\s*([^,\n}]+)/g)) {
    if (!/^['"]none['"]$/.test(m[1].trim())) found.push(`outline: ${m[1]}`);
  }
  for (const m of block.matchAll(
    /\bboxShadow:\s*(`[^`]*`|'[^']*'|"[^"]*"|[^,\n}]+)/g
  )) {
    const value = m[1];
    // 쉼표로 이은 겹 중 하나라도 inset이 아니면 바깥 그림자다
    const layers = value.replace(/\([^)]*\)/g, '').split(',');
    if (!layers.every((layer) => /inset|^\W*none\W*$/.test(layer))) {
      found.push(`boxShadow: ${value}`);
    }
  }
  return found;
}

// 허용 목록. 키는 SRC 기준 경로, 값은 허용하는 위반 문자열 조각과 이유.
// 이유 없는 항목을 늘리지 않는다. 늘릴 때는 길이 단언도 함께 고친다.
const ALLOWED: Record<string, { includes: string; reason: string }> = {
  'components/FanMenu/FanMenu.css.ts': {
    includes: 'boxShadow',
    reason:
      '키보드로 닿은 항목이 허브처럼 안쪽 두 겹 위에 평소 드롭 그림자를 그대로 겹쳐 둔다. 포커스 표시가 아니라 항목이 떠 있는 깊이 단서다',
  },
};

const CSS_FILES = findFiles(resolve(SRC, 'components'), (name) =>
  name.endsWith('.css.ts')
);

describe('바깥 포커스 링 금지 경계', () => {
  it('components 아래 .css.ts를 찾는다(경로가 바뀌어 아무것도 안 보는 일을 막는다)', () => {
    expect(CSS_FILES.length).toBeGreaterThan(30);
  });

  it('포커스 선택자 안에 바깥 링(outlineOffset, none 아닌 outline, inset 아닌 boxShadow)이 없다', () => {
    const violations: string[] = [];
    let scanned = 0;
    for (const path of CSS_FILES) {
      const key = rel(path);
      const blocks = focusBlocks(readFileSync(path, 'utf-8'));
      scanned += blocks.length;
      for (const block of blocks) {
        for (const v of outerRingViolations(block)) {
          if (ALLOWED[key] && v.includes(ALLOWED[key].includes)) continue;
          violations.push(`${key}: ${v}`);
        }
      }
    }
    // 포커스 규칙을 하나도 못 잡으면 정규식이 깨진 것이다
    expect(scanned).toBeGreaterThan(50);
    expect(violations).toEqual([]);
  });

  it('허용 목록은 한 건이고 모두 이유가 있다', () => {
    expect(Object.keys(ALLOWED)).toHaveLength(1);
    for (const entry of Object.values(ALLOWED)) {
      expect(entry.reason.length).toBeGreaterThan(10);
    }
  });

  it('검사기가 바깥 링을 실제로 잡는다(변이)', () => {
    // 무엇을 되돌리면 빨개지는가: outerRingViolations의 세 갈래 중 하나를 지우면.
    expect(outerRingViolations("{ outline: '2px solid red' }")).toHaveLength(1);
    expect(
      outerRingViolations("{ outline: 'none', outlineOffset: '2px' }")
    ).toHaveLength(1);
    expect(outerRingViolations('{ boxShadow: `0 0 0 3px ${c}` }')).toHaveLength(
      1
    );
    expect(
      outerRingViolations(
        '{ boxShadow: `inset 0 0 0 2px ${c}, 0 0 0 3px red` }'
      )
    ).toHaveLength(1);
    expect(
      outerRingViolations(
        "{ outline: 'none', boxShadow: `inset 0 0 0 2px ${c}, inset 0 0 0 4px #fff` }"
      )
    ).toEqual([]);
    // 포커스 키를 헬퍼 호출 뒤에서도 따라간다
    const source = `
const ring = (c: string) => ({ outline: \`2px solid \${c}\` });
export const a = style({ selectors: { '&:focus-visible': ring('red') } });
`;
    expect(focusBlocks(source).flatMap(outerRingViolations)).toHaveLength(1);
  });
});

describe('빌드된 core.css의 :focus-visible', () => {
  // dist는 .gitignore 대상이라 빌드 전에는 없다. 없으면 건너뛰고, 있으면 반드시 검사한다.
  const CSS = resolve(SRC, '../dist/core.css');

  /** `(hover: hover)` 미디어 안에 든 `:focus-visible` 규칙의 선택자 */
  function focusVisibleInHoverMedia(css: string): string[] {
    const found: string[] = [];
    const stack: string[] = [];
    let prelude = '';
    for (const ch of css) {
      if (ch === '{') {
        stack.push(prelude.trim());
        if (
          prelude.includes(':focus-visible') &&
          stack.slice(0, -1).some((p) => /^@media[^{]*\(hover/.test(p))
        ) {
          found.push(prelude.trim());
        }
        prelude = '';
      } else if (ch === '}') {
        stack.pop();
        prelude = '';
      } else if (ch === ';') {
        prelude = '';
      } else {
        prelude += ch;
      }
    }
    return found;
  }

  it('호버 미디어 안에 :focus-visible 규칙이 없다(터치 기기에서 포커스가 사라진다)', () => {
    if (!existsSync(CSS)) return;
    const css = readFileSync(CSS, 'utf-8');
    // 파서가 규칙을 실제로 보고 있는지: :focus-visible 규칙이 많이 있어야 한다
    expect(css.match(/:focus-visible/g)?.length ?? 0).toBeGreaterThan(30);
    expect(focusVisibleInHoverMedia(css)).toEqual([]);
  });

  it('검사기가 호버 미디어 안의 :focus-visible을 실제로 잡는다(변이)', () => {
    const bad =
      '.a:hover{color:red}@media (hover: hover){.b:focus-visible{outline:none}.c:hover{x:y}}';
    expect(focusVisibleInHoverMedia(bad)).toEqual(['.b:focus-visible']);
    const ok =
      '@media (hover: hover){.c:hover{x:y}}.b:focus-visible{outline:none}';
    expect(focusVisibleInHoverMedia(ok)).toEqual([]);
  });
});
