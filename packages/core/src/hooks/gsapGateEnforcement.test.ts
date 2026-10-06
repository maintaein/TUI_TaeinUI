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
import {
  SRC,
  rel,
  findFiles,
  GSAP_IMPORT,
  stripComments,
} from '../test/sourceScan';

const SRC_FILES = findFiles(SRC, (name) => /\.tsx?$/.test(name));

/** 실제 호출만 게이트 사용으로 친다 — 주석·문자열에 이름만 있는 건 호출이 아니다. */
const GATE_USAGE = /\b(?:gateMotion|settleMotion)\s*\(/;

/** 게이트 없이 gsap을 쓰는 게 정당한 파일 한 항목. 경로와 이유를 같이 갖는다
 * (Ruling 14 — 예전엔 `string[]`이라 이유를 못 적었다). */
interface GateEnforcementException {
  /** `src` 기준 상대 경로 */
  path: string;
  /** 게이트(gateMotion/settleMotion) 없이 gsap을 쓰는 이유 */
  reason: string;
}

/**
 * 게이트 없이 gsap을 쓰는 게 정당한 파일의 목록. 첫 입주자는 M3 T3
 * `Snackbar`다 — 아래 "정확히 이 항목들" 검사가 목록이 몰래 늘지 않는지 잠근다.
 */
const GATE_ENFORCEMENT_EXCEPTIONS: GateEnforcementException[] = [
  {
    path: 'components/Snackbar/Snackbar.tsx',
    reason:
      'autoHideDuration 카운트다운 gsap.to가 스낵바의 시계다. gateMotion은 진행 중 ' +
      '애니메이션을 progress(1)로 확정하고 kill하므로, 축소 선호에서 이걸 거치면 ' +
      '카운트다운이 즉시 끝나 스낵바가 열리자마자 닫힌다(Ruling 14) — 2.2.1은 ' +
      '시간을 줄이지 말라는 뜻이라 게이트 대상이 아니다. 축소 모드가 바꾸는 건 ' +
      '막대의 그림(연속→이산 단계)뿐이고 시계는 그대로 둔다. 등장·퇴장 타임라인은 ' +
      '같은 파일의 useOverlayTransition을 통해 이미 게이트를 거친다.',
  },
  {
    path: '_internal/sheetFloat.ts',
    reason:
      'BottomSheet·SideSheet가 나눠 쓰는 등장 원시요소다. 시트 넘침 트윈은 호출자의 ' +
      'useOverlayTransition 타임라인에 붙고(이미 게이트를 거친다), 내용 시차 ' +
      '타임라인은 그 등장 타임라인의 call()이 돌린다. 축소 선호면 게이트가 등장을 끝 ' +
      '상태로 확정하며 그 call이 불려 시차도 progress(1)로 확정한다. settleMotion은 ' +
      'kill까지 해서 재열림 때 시차를 다시 돌릴 수 없으므로 쓰지 않는다.',
  },
];

/** gsap을 import하는 소스가 게이트를 실제로 쓰지 않으면 위반이다. */
function violatesGateEnforcement(source: string): boolean {
  const stripped = stripComments(source);
  return GSAP_IMPORT.test(stripped) && !GATE_USAGE.test(stripped);
}

describe('GSAP 진입점은 게이트를 거친다 (T2 강제)', () => {
  it('gsap을 import하는 파일은 같은 파일에서 gateMotion 또는 settleMotion도 쓴다', () => {
    expect(SRC_FILES.length).toBeGreaterThan(0);

    const exceptionPaths = GATE_ENFORCEMENT_EXCEPTIONS.map((e) => e.path);
    const violators = SRC_FILES.filter((file) =>
      violatesGateEnforcement(readFileSync(file, 'utf-8'))
    )
      .map(rel)
      .filter((path) => !exceptionPaths.includes(path));

    expect(violators).toEqual([]);
  });

  it('예외 목록은 정확히 이 항목들이고, 이 개수다', () => {
    // 목록이 저절로 늘어나지 않게 길이와 내용을 같이 잠근다. 새 예외가
    // 필요해지면 여기부터 고쳐야 하고, 그 순간 이유를 적어야 한다.
    expect(GATE_ENFORCEMENT_EXCEPTIONS).toHaveLength(2);
    expect(GATE_ENFORCEMENT_EXCEPTIONS.map((e) => e.path)).toEqual([
      'components/Snackbar/Snackbar.tsx',
      '_internal/sheetFloat.ts',
    ]);
    expect(
      GATE_ENFORCEMENT_EXCEPTIONS.every((e) => e.reason.trim().length > 0)
    ).toBe(true);
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

    // 위반: 게이트 호출이 주석 안에만 있다 — stripComments가 없으면 GATE_USAGE가
    // 이 주석의 `gateMotion(`에 걸려 위반이 아니라고 오판한다(산출물 3이 닫은 구멍).
    const gateCallOnlyInComment = [
      "import { gsap } from 'gsap';",
      '// TODO: call gateMotion(el) here',
      'export const wobble = (el) => gsap.to(el, { x: 10 });',
    ].join('\n');
    expect(violatesGateEnforcement(gateCallOnlyInComment)).toBe(true);
  });
});
