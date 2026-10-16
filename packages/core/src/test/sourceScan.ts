/**
 * `gsapGateEnforcement.test.ts`와 `animationBoundary.test.ts`가 함께 쓰는 소스
 * 스캔 헬퍼. 두 파일이 각자 복붙해 갖고 있던 `rel()`·`findFiles()`·`GSAP_IMPORT`를
 * 한 곳으로 모은다. 한쪽만 고치면 다른 쪽이 조용히 벌어지던 문제를 막는다.
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
 * 넓게 잡는다. `animationBoundary.test.ts`의 `GSAP_ALL_IMPORT`(`gsap/all` 배럴만
 * 좁게 잡는 별개 검사)와는 목적이 다르다.
 *
 * 소비자가 `stripComments`로 걸러낸 텍스트에 돌리는 것을 전제한다. 주석 안
 * 백틱 인용(예: 옛 animationBoundary.test.ts R37절 설명 주석의 `` `from 'gsap'` ``)을
 * 가려내던 후방탐색(Ruling 12)은 주석 자체가 사라지므로 더 필요 없다.
 */
export const GSAP_IMPORT =
  /\bfrom\s*['"]gsap[^'"]*['"]|\brequire\(\s*['"]gsap[^'"]*['"]\s*\)|\bimport\(\s*['"]gsap[^'"]*['"]\s*\)/;

/**
 * 스캔 전에 소스 주석을 걷어낸다(Ruling 74). 따옴표 상태는 줄 안에서만 유지하고
 * (파일 전체로 이으면 `animationBoundary.test.ts:82`의 정규식과 충돌한다), 블록
 * 주석의 여닫힘만 줄을 넘어 이어간다. 주석 자리는 개행을 보존한 채 비워 줄번호를
 * 지킨다. 문자열 안의 `//`(URL 등)는 문자열 매치가 먼저 잡아 보존된다.
 *
 * 처리하지 않는 사각 세 가지: 정규식 리터럴(별도 토큰으로 인식하지 않아 그 안의
 * 텍스트가 일반 코드처럼 그대로 노출된다), 여러 줄에 걸친 템플릿 리터럴(따옴표
 * 상태를 줄 안에서만 유지하므로 여는 백틱과 닫는 백틱이 다른 줄에 있으면 못
 * 걷어냄), 이스케이프된 따옴표(`'it\'s'`, 이스케이프를 모르므로 그 `\'`를
 * 진짜 닫는 따옴표로 오인해 짝이 어긋난다). 실측 확인: 이 셋은 방향이 한쪽으로
 * 고정돼 있지 않다. 노출된 텍스트가 우연히 `from "gsap"` 같은 모양이면
 * `GSAP_IMPORT`가 진짜 import 없이도 매치해 오탐(violators에 가짜 추가)을 낼 수
 * 있고, 반대로 어긋난 짝이 실제 코드 줄을 주석 처리해 버리면 미탐도 낼 수 있다.
 */
export function stripComments(source: string): string {
  return source.replace(
    /'[^'\n]*'|"[^"\n]*"|`[^`\n]*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (m) => (m[0] === '/' ? m.replace(/[^\n]/g, '') : m)
  );
}
