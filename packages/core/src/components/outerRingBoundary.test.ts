import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { SRC } from '../test/sourceScan';
import { themeTokens } from '../tokens/contract';

/**
 * 바깥 포커스 링 금지 경계(사용자 결정, M7.2). 포커스는 요소 가장자리 안쪽에만 그린다.
 *
 * 소스 정규식은 헬퍼(`focusInset`·`focusEdge`)와 함수 인자로 넘어가는 값을 못 따라가
 * 변이(`inset` 빼기)를 놓쳤다. 그래서 빌드된 `dist/core.css`를 읽는다. 거기서는 헬퍼가 다
 * 풀려 있다. 선택자에 `:focus`(`:focus-visible`, `:focus-within` 포함)가 든 모든 규칙(미디어
 * 쿼리 안 포함)에서 `outline-offset`이 0이 아니거나, `outline`이 `none`이 아니거나, `box-shadow`에
 * `inset`이 아닌 겹이 있으면 실패한다. 값(색·두께)이 맞는지는 e2e/buttonFocusSurface.spec.ts가 잰다.
 * dist는 .gitignore 대상이라 빌드 전에는 없다. 없으면 건너뛴다(`llms.test.ts` 선례, CI는 빌드 뒤 돈다).
 */

interface Rule {
  /** 감싼 at-규칙 머리글(예: `@media (hover: hover)`) */
  at: string[];
  selector: string;
  /** `이름: 값` 선언 목록 */
  decls: [string, string][];
}

/** 최상위 쉼표(괄호 밖)로 나눈다. */
function splitTop(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let cur = '';
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === sep && depth === 0) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function parseDecls(body: string): [string, string][] {
  return splitTop(body, ';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d): [string, string] => {
      const at = d.indexOf(':');
      return [
        d.slice(0, at).trim().toLowerCase(),
        d
          .slice(at + 1)
          .replace(/!important/i, '')
          .trim(),
      ];
    });
}

/** 선언만 가진 가장 안쪽 블록을 규칙으로 모은다(미디어 쿼리는 `at`에 쌓는다). */
function parseRules(css: string): Rule[] {
  const rules: Rule[] = [];
  const stack: { prelude: string; start: number; hasChild: boolean }[] = [];
  let prelude = '';
  let quote = '';
  let paren = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') paren++;
    else if (ch === ')') paren--;
    else if (paren === 0 && ch === '{') {
      if (stack.length) stack[stack.length - 1].hasChild = true;
      stack.push({ prelude: prelude.trim(), start: i + 1, hasChild: false });
      prelude = '';
      continue;
    } else if (paren === 0 && ch === '}') {
      const top = stack.pop();
      if (top && !top.hasChild) {
        rules.push({
          at: stack.map((s) => s.prelude),
          selector: top.prelude,
          decls: parseDecls(css.slice(top.start, i)),
        });
      }
      prelude = '';
      continue;
    } else if (paren === 0 && ch === ';') {
      prelude = '';
      continue;
    }
    prelude += ch;
  }
  return rules;
}

/** `:root`에 정의된 사용자 지정 속성(`--이름: 값`) */
function rootVars(rules: Rule[]): Map<string, string> {
  const vars = new Map<string, string>();
  for (const rule of rules) {
    if (rule.selector !== ':root') continue;
    for (const [name, value] of rule.decls) {
      if (name.startsWith('--')) vars.set(name, value);
    }
  }
  return vars;
}

/** 공백과 앞자리 0(`0.1`과 `.1`)을 지워 minify 전후 값을 같게 본다. */
const normalize = (v: string): string =>
  v.replace(/\s+/g, '').replace(/(^|[^\d])0\./g, '$1.');

// 허용 목록(길이 단언 1). FanMenu 허브·항목은 키보드로 닿아도 평소 드롭 그림자(shadow.md)를
// 안쪽 두 겹 뒤에 그대로 둔다. 포커스 표시가 아니라 떠 있는 깊이 단서다. 그 값과 정확히 같은
// 겹 하나가 inset 겹들과 함께 있을 때만 허용한다.
const ALLOWED_EXTRA_LAYER = normalize(themeTokens.shadow.md);

/** 바깥 링으로 읽히는 선언을 돌려준다. */
function outerRingViolations(rule: Rule, vars: Map<string, string>): string[] {
  const found: string[] = [];
  for (const [name, value] of rule.decls) {
    if (name === 'outline-offset' && !/^0(px)?$/.test(value)) {
      found.push(`outline-offset: ${value}`);
    } else if (
      (name === 'outline' || name === 'outline-style') &&
      !/^(none|0)$/.test(value)
    ) {
      found.push(`${name}: ${value}`);
    } else if (name === 'box-shadow' && value !== 'none') {
      const layers = splitTop(value, ',').map((l) => l.trim());
      const outer = layers.filter((l) => !/\binset\b/.test(l));
      const hasInset = outer.length < layers.length;
      const resolved = outer.map((l) => {
        const m = l.match(/^var\(\s*(--[\w-]+)\s*\)$/);
        return normalize(m ? (vars.get(m[1]) ?? l) : l);
      });
      const allowed =
        hasInset &&
        resolved.length === 1 &&
        resolved[0] === ALLOWED_EXTRA_LAYER;
      if (outer.length && !allowed) found.push(`box-shadow: ${value}`);
    }
  }
  return found;
}

/** 포커스 선택자를 가진 규칙의 위반을 `선택자: 위반` 꼴로 모은다. */
function focusViolations(css: string): string[] {
  const rules = parseRules(css);
  const vars = rootVars(rules);
  return rules
    .filter((r) => /:focus/.test(r.selector))
    .flatMap((r) =>
      outerRingViolations(r, vars).map((v) => `${r.selector}: ${v}`)
    );
}

/** `(hover` 미디어 안에 든 `:focus-visible` 규칙의 선택자 */
function focusVisibleInHoverMedia(css: string): string[] {
  return parseRules(css)
    .filter(
      (r) =>
        r.selector.includes(':focus-visible') &&
        r.at.some((a) => /^@media[^{]*\(hover/.test(a))
    )
    .map((r) => r.selector);
}

const CSS = resolve(SRC, '../dist/core.css');

describe('빌드된 core.css의 포커스 규칙', () => {
  it('포커스 규칙 안에 바깥 링(outline-offset, none 아닌 outline, inset 아닌 box-shadow 겹)이 없다', () => {
    if (!existsSync(CSS)) return;
    const css = readFileSync(CSS, 'utf-8');
    // 파서가 규칙을 실제로 보고 있는지: 포커스 규칙이 많이 있어야 한다
    const focusRules = parseRules(css).filter((r) => /:focus/.test(r.selector));
    expect(focusRules.length).toBeGreaterThan(50);
    expect(focusViolations(css)).toEqual([]);
  });

  it('호버 미디어 안에 :focus-visible 규칙이 없다(터치 기기에서 포커스가 사라진다)', () => {
    if (!existsSync(CSS)) return;
    const css = readFileSync(CSS, 'utf-8');
    expect(css.match(/:focus-visible/g)?.length ?? 0).toBeGreaterThan(30);
    expect(focusVisibleInHoverMedia(css)).toEqual([]);
  });
});

describe('검사기가 바깥 링을 실제로 잡는다(변이)', () => {
  // 무엇을 되돌리면 빨개지는가: 아래 입력이 dist에서 실제로 푼 헬퍼 모양이다(inset을 뺀 변이 포함).
  const ok =
    '._a:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--x),inset 0 0 0 4px var(--y)}';

  it('안쪽 두 겹은 통과한다', () => {
    expect(focusViolations(ok)).toEqual([]);
  });

  it('두 번째 겹에서 inset을 빼면 잡는다(Button focusInset 변이)', () => {
    const bad = ok.replace('inset 0 0 0 4px', '0 0 0 4px');
    expect(focusViolations(bad)).toHaveLength(1);
  });

  it('outline-offset과 none 아닌 outline을 잡는다', () => {
    expect(
      focusViolations('.a:focus-visible{outline:none;outline-offset:2px}')
    ).toHaveLength(1);
    expect(focusViolations('.a:focus{outline:2px solid red}')).toHaveLength(1);
    expect(focusViolations('.a:focus-within{outline-offset:0}')).toEqual([]);
  });

  it('미디어 쿼리 안과 가상 요소 선택자도 본다', () => {
    const css =
      '@media (prefers-reduced-motion: reduce){.a:focus-visible::after{box-shadow:0 0 0 2px red}}';
    expect(focusViolations(css)).toHaveLength(1);
  });

  it('포커스가 아닌 규칙의 바깥 그림자는 보지 않는다', () => {
    expect(focusViolations('.a:hover{box-shadow:0 0 0 2px red}')).toEqual([]);
  });

  it('허용 겹은 shadow.md 값과 정확히 같고 inset 겹과 함께일 때만 통과한다', () => {
    const md = themeTokens.shadow.md;
    const root = `:root{--m: ${md.replace(/0\./g, '.')}}`;
    const withInset = `${root}.a:focus-visible{box-shadow:inset 0 0 0 2px red,var(--m)}`;
    expect(focusViolations(withInset)).toEqual([]);
    // inset 없이 그림자만 있으면 바깥 링이다
    expect(
      focusViolations(`${root}.a:focus-visible{box-shadow:var(--m)}`)
    ).toHaveLength(1);
    // 다른 바깥 겹이 섞이면 잡는다
    expect(
      focusViolations(
        `${root}.a:focus-visible{box-shadow:inset 0 0 0 2px red,0 0 0 3px red,var(--m)}`
      )
    ).toHaveLength(1);
  });

  it('호버 미디어 안의 :focus-visible을 잡는다', () => {
    const bad =
      '.a:hover{color:red}@media (hover: hover){.b:focus-visible{outline:none}.c:hover{x:y}}';
    expect(focusVisibleInHoverMedia(bad)).toEqual(['.b:focus-visible']);
    const fine =
      '@media (hover: hover){.c:hover{x:y}}.b:focus-visible{outline:none}';
    expect(focusVisibleInHoverMedia(fine)).toEqual([]);
  });
});
