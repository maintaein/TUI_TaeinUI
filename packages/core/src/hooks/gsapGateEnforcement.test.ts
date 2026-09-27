/**
 * GSAP 진입점 강제 검사 (M3 T1 · 계획서 T2 기반).
 *
 * useReducedMotion()은 신호만 준다 — 축소 선호를 실제로 반영하는 건 gateMotion()·
 * settleMotion()이다. gsap을 쓰는 파일이 이 둘을 거치지 않으면 축소 선호가
 * 조용히 무시된다. 지금은 컴포넌트가 0개라 위반 대상도 0건이지만, 이 검사가
 * 없으면 다음 Task부터 컴포넌트가 하나씩 늘 때마다 아무도 강제하지 않는 규칙이
 * 된다. 여기서 미리 잠가 둬서, gsap을 import하는 파일이 늘어나는 순간부터 이
 * 검사가 자동으로 살아나게 한다.
 *
 * 예외가 필요해질 수 있다(게이트 없이 gsap 타입만 쓰는 파일 등). 그럴 땐
 * GATE_ENFORCEMENT_EXCEPTIONS에 상대 경로와 이유를 같이 적어 올린다 — 목록이
 * 저절로 늘어나지 않도록 길이 자체를 단언해 둔다.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { SRC, rel, findFiles, GSAP_IMPORT } from '../test/sourceScan';

const SRC_FILES = findFiles(SRC, (name) => /\.tsx?$/.test(name));

/** 실제 호출만 게이트 사용으로 친다 — 주석·문자열에 이름만 있는 건 호출이 아니다. */
const GATE_USAGE = /\b(?:gateMotion|settleMotion)\s*\(/;

/**
 * 게이트 없이 gsap을 쓰는 게 정당한 파일의 `src` 기준 상대 경로 목록.
 * 지금은 비어 있다 — 아래 "예외 목록은 지금 비어 있다" 검사가 그 사실을 잠근다.
 */
const GATE_ENFORCEMENT_EXCEPTIONS: string[] = [];

/** gsap을 import하는 소스가 게이트를 실제로 쓰지 않으면 위반이다. */
function violatesGateEnforcement(source: string): boolean {
  return GSAP_IMPORT.test(source) && !GATE_USAGE.test(source);
}

describe('GSAP 진입점은 게이트를 거친다 (T2 강제)', () => {
  it('gsap을 import하는 파일은 같은 파일에서 gateMotion 또는 settleMotion도 쓴다', () => {
    expect(SRC_FILES.length).toBeGreaterThan(0);

    const violators = SRC_FILES.filter((file) =>
      violatesGateEnforcement(readFileSync(file, 'utf-8'))
    )
      .map(rel)
      .filter((path) => !GATE_ENFORCEMENT_EXCEPTIONS.includes(path));

    expect(violators).toEqual([]);
  });

  it('예외 목록은 지금 비어 있다', () => {
    // 컴포넌트가 아직 0개라 대상 파일 자체가 없다. 다음 Task가 gsap을 쓰는
    // 컴포넌트를 추가하는 순간 위 검사가 실제로 뭔가를 훑기 시작한다.
    expect(GATE_ENFORCEMENT_EXCEPTIONS).toEqual([]);
  });

  it('판정 함수 표본 검사 — 주석에 적힌 gateMotion·settleMotion은 실제 호출로 치지 않는다', () => {
    // 위반 아님: gsap을 import하고 게이트를 실제로 호출한다.
    const usesGate = [
      "import { gsap } from 'gsap';",
      "import { gateMotion } from './gateMotion';",
      'export const wobble = (el) => gateMotion(() => gsap.to(el, { x: 10 }));',
    ].join('\n');
    expect(violatesGateEnforcement(usesGate)).toBe(false);

    // 위반: gsap을 import하지만 게이트를 아예 안 쓴다.
    const noGate = [
      "import { gsap } from 'gsap';",
      'export const wobble = (el) => gsap.to(el, { x: 10 });',
    ].join('\n');
    expect(violatesGateEnforcement(noGate)).toBe(true);

    // 위반: 게이트를 주석으로만 언급한다 — 실제 호출이 없다(리뷰 재현 사례).
    const gateOnlyInComment = [
      "import { gsap } from 'gsap';",
      '// see gateMotion.ts for the settleMotion pattern, applied manually below',
      'export const wobble = (el) => gsap.to(el, { x: 10 });',
    ].join('\n');
    expect(violatesGateEnforcement(gateOnlyInComment)).toBe(true);
  });
});
