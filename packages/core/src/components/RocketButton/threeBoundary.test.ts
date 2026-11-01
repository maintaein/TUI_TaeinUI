/**
 * three 번들 경계 (M7.1 T7). three는 dependencies이고 가리킬 때 import('three')로만 불러온다.
 * core를 빌드한 뒤(`pnpm --filter @taein-ui/core build`) dist를 읽는다. dist는 .gitignore 대상이라 빌드 전에는
 * 없고, 없으면 건너뛴다(animationBoundary의 gsap/all 검사와 같은 선례). 있으면 반드시 검사한다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SRC, rel, findFiles } from '../../test/sourceScan';

const DIST = resolve(SRC, '..', 'dist');
const built = existsSync(DIST);
const files = (pattern: RegExp) =>
  built ? findFiles(DIST, (name) => pattern.test(name)) : [];

describe('three 번들 경계', () => {
  it('src에서 three를 정적으로 import하는 파일이 없다(타입은 import type만)', () => {
    const offenders = findFiles(SRC, (name) => /\.tsx?$/.test(name))
      .filter((file) => !/\.test\.tsx?$/.test(file))
      .filter((file) =>
        /^\s*(import|export)\s(?!type\b)[^;]*\sfrom\s+['"]three(\/[^'"]*)?['"]/m.test(
          readFileSync(file, 'utf-8')
        )
      )
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it('dist에 three 코드가 한 바이트도 없다(번들 파일도, 따라 들어온 node_modules도)', () => {
    if (!built) return;
    const all = findFiles(DIST, () => true).map((file) => relative(DIST, file));
    expect(
      all.filter((path) => /node_modules|(^|[\\/])three[\\/]/.test(path))
    ).toEqual([]);
    for (const file of files(/\.(mjs|cjs|js)$/)) {
      const code = readFileSync(file, 'utf-8');
      // three 소스가 자기를 등록하는 표지. 번들에 딸려 들어왔다면 반드시 있다
      expect(code, rel(file)).not.toContain('__THREE__');
      expect(code.length, rel(file)).toBeLessThan(600_000);
    }
  });

  it('dist의 ES 모듈은 three를 동적 import로만 부른다', () => {
    if (!built) return;
    for (const file of files(/\.mjs$/)) {
      const code = readFileSync(file, 'utf-8');
      expect(code, rel(file)).not.toMatch(/\bfrom\s*['"]three/);
    }
  });

  it('공개 .d.ts(index.d.ts에서 닿는 모든 선언)에 three 문자열이 없다', () => {
    if (!built) return;
    const seen = new Set<string>();
    const visit = (file: string) => {
      if (seen.has(file) || !existsSync(file)) return;
      seen.add(file);
      const text = readFileSync(file, 'utf-8');
      for (const m of text.matchAll(
        /(?:from|import\()\s*['"](\.[^'"]*)['"]/g
      )) {
        const target = resolve(dirname(file), m[1]);
        visit(
          existsSync(`${target}.d.ts`)
            ? `${target}.d.ts`
            : `${target}/index.d.ts`
        );
      }
    };
    visit(resolve(DIST, 'index.d.ts'));
    // 시작점이 실제로 따라갔는지 확인한다(빈 순회가 통과하지 않게)
    expect(seen.size).toBeGreaterThan(10);
    expect(
      [...seen]
        .filter((file) => /three/i.test(readFileSync(file, 'utf-8')))
        .map((file) => relative(DIST, file))
    ).toEqual([]);
  });

  it('공개 export가 아니다: index에서 불러오기 모듈과 박자 함수를 내보내지 않는다', () => {
    const exported = [
      readFileSync(resolve(SRC, 'index.ts'), 'utf-8'),
      readFileSync(resolve(SRC, 'components/index.ts'), 'utf-8'),
      readFileSync(resolve(SRC, 'components/RocketButton/index.ts'), 'utf-8'),
    ].join('\n');
    expect(exported).not.toMatch(/loadThree|rocketBeat/);
  });
});
