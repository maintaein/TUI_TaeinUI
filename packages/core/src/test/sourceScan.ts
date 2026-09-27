/**
 * `gsapGateEnforcement.test.ts`와 `animationBoundary.test.ts`가 함께 쓰는 소스
 * 스캔 헬퍼. 두 파일이 각자 복붙해 갖고 있던 `rel()`·`findFiles()`·`GSAP_IMPORT`를
 * 한 곳으로 모은다 — 한쪽만 고치면 다른 쪽이 조용히 벌어지던 문제를 막는다.
 *
 * `src/test/` 아래 둔다. `tsconfig.build.json`의 `exclude`에 `src/test`가 이미
 * 있어서 이 파일의 `.d.ts`가 dist로 새지 않는다.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

/** `packages/core/src` 절대 경로. 이 파일(`src/test/`)의 부모 디렉터리다. */
export const SRC = resolve(__dirname, '..');

/** `SRC` 기준 posix 상대 경로. 허용 목록 키가 OS마다 달라지지 않게 한다. */
export function rel(path: string): string {
  return relative(SRC, path).split(sep).join('/');
}

export function findFiles(
  dir: string,
  accept: (name: string) => boolean
): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...findFiles(full, accept));
    } else if (accept(entry)) {
      files.push(full);
    }
  }
  return files.sort();
}

/**
 * 런타임 참조만 본다. gsap을 어떤 경로로든(코어·개별 플러그인·`gsap/all`) import하는지
 * 넓게 잡는다 — `animationBoundary.test.ts`의 `GSAP_ALL_IMPORT`(`gsap/all` 배럴만
 * 좁게 잡는 별개 검사)와는 목적이 다르다.
 *
 * 앞의 `(?<!`)`가 백틱 바로 뒤는 걸러낸다 — 이 저장소는 주석 안에서 코드를
 * `` `from 'gsap'` `` 처럼 백틱으로 인용한다(예: animationBoundary.test.ts R37절
 * 설명 주석). 그런 인용문은 실제 import가 아닌데 이 정규식만으로는 구분이 안 된다.
 */
export const GSAP_IMPORT =
  /(?<!`)(?:\bfrom\s*['"]gsap[^'"]*['"]|\brequire\(\s*['"]gsap[^'"]*['"]\s*\)|\bimport\(\s*['"]gsap[^'"]*['"]\s*\))/;
