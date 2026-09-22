/**
 * M2 T4 — Tier-A 14개의 `@keyframes`가 축소 모드에서 「멈춘다」와 「보인다」를
 * 둘 다 지키는지 원문으로 잠근다 (공통 제약 §6, task-4-brief.md 산출물 1).
 *
 * `animationBoundary.test.ts`가 `transition:`/`animation:` 선언의 속성
 * 화이트리스트·리터럴 duration·리터럴 easing을 저장소 전체로 이미 잠그고
 * 있지만, 그 스캐너의 `MOTION_DECLARATION`은 `transition|animation` **접두**
 * 줄만 찾는다 — `keyframes({...})` **본문 안의 개별 프레임**(`0%`·`100%`의
 * `transform`·`opacity` 값)은 그 대상이 아니다. 이 파일이 그 자리를 잠근다.
 *
 * `vitest.config.ts`가 CSS를 빈 문자열로 목킹하므로(Slider 예외 하나) jsdom에
 * `matchMedia`도 없다 — `theme.reducedMotion.test.ts`·`animationBoundary.test.ts`와
 * 같은 이유로 생성 CSS가 아니라 `.css.ts` 원문을 읽는다.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC = resolve(__dirname, '..');
const COMPONENTS = resolve(SRC, 'components');

/**
 * M2 계획서(`.claude/고도화/plan/M2(Tier-A-CSS-모션).md`) 「대상」 14개
 * 그대로다. `HeaderBar`·`NumericSpinner`·정적 3개(`FormField`·`List`·`Text`)·
 * `SegmentedButtons`·`Slider`·오버레이 4종(`BottomSheet`·`Modal`·`SideSheet`·
 * `Snackbar`)은 M2 밖이다 — 저장소 전체로 스캔하면 M3에 넘긴 오버레이 등장
 * 키프레임이 끌려온다(task-4-brief.md 경고).
 */
const TIER_A = [
  'Badge',
  'BoardRow',
  'Border',
  'Button',
  'Card',
  'Chip',
  'Divider',
  'Icon',
  'IconButton',
  'Loader',
  'LoadingSpinner',
  'Popover',
  'Skeleton',
  'Tooltip',
];

function rel(path: string): string {
  return relative(SRC, path).split(sep).join('/');
}

function findFiles(dir: string, accept: (name: string) => boolean): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...findFiles(full, accept));
    else if (accept(entry)) files.push(full);
  }
  return files.sort();
}

const CSS_FILES = TIER_A.flatMap((name) => {
  const dir = join(COMPONENTS, name);
  return existsSync(dir) ? findFiles(dir, (n) => n.endsWith('.css.ts')) : [];
});

const FILE_TEXT: Record<string, string> = {};
for (const file of CSS_FILES)
  FILE_TEXT[rel(file)] = readFileSync(file, 'utf-8');

// ---------------------------------------------------------------------------
// `@keyframes` 소스 열거 — 브리프: 준 목록을 믿지 말고 소스에서 찾아라
// ---------------------------------------------------------------------------

interface Frame {
  /** `'0%'` · `'0%, 100%'` · `'50%'` 등 */
  key: string;
  props: Record<string, string>;
}

interface Usage {
  /** `animation:` 값에서 `${keyframe명}` 다음에 오는 나머지(따옴표 밖 부분) */
  rest: string;
  /** 파일 텍스트에서 `animation:`이 시작하는 문자 오프셋 */
  index: number;
}

interface KeyframeDef {
  file: string;
  name: string;
  frames: Frame[];
}

/** `openIndex`의 `{`와 짝이 맞는 `}`의 인덱스. `${...}` 보간도 괄호 쌍이 맞아
 * depth에 상쇄되므로(보간 안에 중첩 객체가 없는 한) 안전하다. */
function matchBrace(text: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error(`짝이 맞는 }를 찾지 못했다 (openIndex=${openIndex})`);
}

/** `atIndex`를 감싸는 가장 안쪽 객체 리터럴을 `{`부터 `}`까지 잘라낸다. */
function enclosingBlock(text: string, atIndex: number): string {
  let depth = 0;
  let i = atIndex;
  for (; i >= 0; i -= 1) {
    const ch = text[i];
    if (ch === '}') depth += 1;
    else if (ch === '{') {
      if (depth === 0) break;
      depth -= 1;
    }
  }
  return text.slice(i, matchBrace(text, i) + 1);
}

function parseFrames(body: string): Frame[] {
  const frames: Frame[] = [];
  const FRAME = /'([\d.,%\s]+)'\s*:\s*\{([^{}]*)\}/g;
  for (const m of body.matchAll(FRAME)) {
    const props: Record<string, string> = {};
    const PROP = /(\w+)\s*:\s*(?:'([^']*)'|(-?\d+(?:\.\d+)?))/g;
    for (const p of m[2].matchAll(PROP)) props[p[1]] = p[2] ?? p[3];
    frames.push({ key: m[1].trim(), props });
  }
  return frames;
}

function keyframesOf(file: string): KeyframeDef[] {
  const text = FILE_TEXT[rel(file)];
  const defs: KeyframeDef[] = [];
  const HEAD = /const\s+(\w+)\s*=\s*keyframes\(\{/g;
  for (const m of text.matchAll(HEAD)) {
    const openIndex = (m.index ?? 0) + m[0].length - 1;
    const closeIndex = matchBrace(text, openIndex);
    defs.push({
      file: rel(file),
      name: m[1],
      frames: parseFrames(text.slice(openIndex, closeIndex + 1)),
    });
  }
  return defs;
}

/** `animation: \`${keyframe명} ...\`` 참조 전부. 한 keyframe이 여러 곳에서
 * 쓰이면(Divider의 `grow`처럼) 전부 개별로 검사해야 한다. */
function usagesOf(fileText: string, name: string): Usage[] {
  const re = new RegExp(`animation:\\s*\`\\$\\{${name}\\}([^\`]*)\``, 'g');
  const out: Usage[] = [];
  for (const m of fileText.matchAll(re)) {
    out.push({ rest: m[1], index: m.index ?? 0 });
  }
  return out;
}

/** 선언된 `transform`·`opacity`·`strokeDashoffset`만 뽑는다 — 이 가드가 다스리는
 * 세 속성 밖은 대상이 아니다. */
function declaredProps(block: string): Record<string, string> {
  const props: Record<string, string> = {};
  const RE =
    /(?:^|[,{])\s*(transform|opacity|strokeDashoffset)\s*:\s*(?:'([^']*)'|(-?\d+(?:\.\d+)?))/g;
  for (const m of block.matchAll(RE)) props[m[1]] = m[2] ?? m[3];
  return props;
}

/** opacity 0, `scale(0)`류, 초기화 안 된 stroke — 요소를 완전히 안 보이게
 * 만드는 값만 대상이다. `translateX(±100%)`류는 대상이 아니다 — Loader의
 * progress·Skeleton의 wave처럼 막대/셰이머가 트랙 밖으로 이동하는 것은
 * 의도된 스윕이지 숨김이 아니다(검사 1의 범위는 완료 조건이 명시한
 * opacity:0/scale(0)류뿐이다). */
function isHidden(props: Record<string, string>): boolean {
  if (props.opacity !== undefined && Number(props.opacity) === 0) return true;
  if (
    props.transform &&
    /scale[XY]?\(\s*0(?:\s*,\s*0)?\s*\)/.test(props.transform)
  )
    return true;
  if (
    props.strokeDashoffset !== undefined &&
    Number(props.strokeDashoffset) !== 0
  )
    return true;
  return false;
}

const DEFAULTS: Record<string, string> = {
  transform: 'none',
  opacity: '1',
  strokeDashoffset: '0',
};

/** `frameProps`에 있는 속성 중 하나라도 `baseProps`(없으면 CSS 초기값)와 다르면 true. */
function differsFromBase(
  frameProps: Record<string, string>,
  baseProps: Record<string, string>
): boolean {
  return Object.entries(frameProps).some(
    ([k, v]) => (baseProps[k] ?? DEFAULTS[k]) !== v
  );
}

const KEYFRAMES = CSS_FILES.flatMap(keyframesOf);
const CLASSIFIED = KEYFRAMES.map((k) => {
  const usages = usagesOf(FILE_TEXT[k.file], k.name);
  const loop = usages.some((u) => /\binfinite\b/.test(u.rest));
  return { ...k, usages, loop };
});
const LOOP = CLASSIFIED.filter((k) => k.loop);
const ONCE = CLASSIFIED.filter((k) => !k.loop);

describe('Tier-A 14개 @keyframes 소스 열거 (M2 T4)', () => {
  it('모든 keyframes 참조가 최소 한 곳에서 쓰인다 — 죽은 키프레임이 없다', () => {
    // 무엇을 뒤집으면 빨개지는가: keyframes를 정의만 하고 animation:에서 안 쓰면
    // (또는 이름을 오타내면) 여기서 잡힌다.
    const unused = CLASSIFIED.filter((k) => k.usages.length === 0);
    expect(unused.map((k) => `${k.file}:${k.name}`)).toEqual([]);
  });

  it('소스에서 찾은 keyframes 총량이 10개다 — 늘거나 줄면 이 파일의 분류를 다시 본다', () => {
    // 무엇을 뒤집으면 빨개지는가: 14개 파일 중 하나에 keyframes를 새로 추가하거나
    // 지우면 총량이 바뀐다. (예상 자리 확인용 — 브리프의 「예상되는 자리」는 참고이지
    // 여기서 실제로 세는 것이 진실이다.)
    expect(KEYFRAMES).toHaveLength(10);
  });

  it('keyframes가 있는 파일은 Badge·Border·Divider·Icon·Loader·LoadingSpinner·Skeleton 7개뿐이다 — Popover·Tooltip은 0건이다', () => {
    // 무엇을 뒤집으면 빨개지는가: Popover.css.ts나 Tooltip.css.ts에 fadeIn류
    // keyframes를 다시 넣으면(=상태 전이에 @keyframes로 회귀) 여기가 잡는다.
    // Button·Card·Chip·IconButton·BoardRow도 같은 이유로 0건이어야 한다.
    const files = [...new Set(KEYFRAMES.map((k) => k.file))].sort();
    expect(files).toEqual([
      'components/Badge/Badge.css.ts',
      'components/Border/Border.css.ts',
      'components/Divider/Divider.css.ts',
      'components/Icon/Icon.css.ts',
      'components/Loader/Loader.css.ts',
      'components/LoadingSpinner/LoadingSpinner.css.ts',
      'components/Skeleton/Skeleton.css.ts',
    ]);
  });

  it('무한 루프 6개 · 마운트 1회 4개로 분류된다', () => {
    // 무엇을 뒤집으면 빨개지는가: 루프에서 infinite를 빼거나 마운트 1회에
    // infinite를 붙이면(잘못된 도구 선택, 공통 제약 §2) 분류가 바뀌어 잡힌다.
    expect(LOOP.map((k) => `${k.file}:${k.name}`).sort()).toEqual([
      'components/Border/Border.css.ts:rotate',
      'components/Loader/Loader.css.ts:progress',
      'components/LoadingSpinner/LoadingSpinner.css.ts:fadeInOut',
      'components/LoadingSpinner/LoadingSpinner.css.ts:spin',
      'components/Skeleton/Skeleton.css.ts:pulse',
      'components/Skeleton/Skeleton.css.ts:wave',
    ]);
    expect(ONCE.map((k) => `${k.file}:${k.name}`).sort()).toEqual([
      'components/Badge/Badge.css.ts:valueEnter',
      'components/Badge/Badge.css.ts:valueExit',
      'components/Divider/Divider.css.ts:grow',
      'components/Icon/Icon.css.ts:draw',
    ]);
  });
});

describe('검사 1 — 무한 루프 키프레임은 시작·끝 프레임에서 요소를 안 보이게 만들지 않는다 (M1 LoadingSpinner opacity:0.2 고착 재발 방지)', () => {
  it('0%·100% 프레임에 opacity:0 / scale(0)류가 없다', () => {
    // 무엇을 뒤집으면 빨개지는가: LoadingSpinner.css.ts의 fadeInOut '0%, 100%'
    // 프레임 opacity를 0.2 → 0으로 바꾸면(또는 Border rotate 0%에
    // transform: 'scale(0)'를 끼워 넣으면) 여기가 빨개진다.
    const offenders: string[] = [];
    for (const k of LOOP) {
      for (const frame of k.frames) {
        const keys = frame.key.split(',').map((s) => s.trim());
        if (!keys.includes('0%') && !keys.includes('100%')) continue;
        if (isHidden(frame.props))
          offenders.push(`${k.file}:${k.name}@${frame.key}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('검사 2 — 마운트 1회 키프레임은 base가 최종 표시 상태이고 0%만 시작 상태다 (공통 제약 §6)', () => {
  it('프레임이 정확히 하나이고 키가 0%다 — 100%로 뒤집히면 여기서 잡힌다', () => {
    // 무엇을 뒤집으면 빨개지는가: Divider.css.ts의 grow 키 '0%'를 '100%'로
    // 바꾸면(완료 조건 1이 말하는 "0% 프레임이 뒤집힌 것" 그 자체) 여기가
    // 빨개진다.
    const bad = ONCE.filter(
      (k) => !(k.frames.length === 1 && k.frames[0].key === '0%')
    );
    expect(bad.map((k) => `${k.file}:${k.name}`)).toEqual([]);
  });

  it('0% 프레임이 소비자 base와 다르다 — 같으면 애니메이션이 무의미해진 것이다', () => {
    // 무엇을 뒤집으면 빨개지는가: Icon.css.ts iconPath의 strokeDashoffset: 0을
    // 지우고 keyframes의 0% 값(1)과 같게 만들면(즉 애니메이션이 아무것도 안
    // 바꾸면) 여기가 빨개진다.
    const offenders: string[] = [];
    for (const k of ONCE) {
      const fileText = FILE_TEXT[k.file];
      for (const usage of k.usages) {
        const base = declaredProps(enclosingBlock(fileText, usage.index));
        if (!differsFromBase(k.frames[0].props, base)) {
          offenders.push(`${k.file}:${k.name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * base가 "숨김" 상태면 축소 모드(duration→0.01ms)에서 요소가 사라진다 —
   * 허용목록에 없는 자리는 실패한다. `Badge`의 `valueExit`만 예외다: 그
   * 노드는 퇴장 중인 일시적 DOM이라(Badge.tsx가 onAnimationEnd에 제거한다)
   * base 자체가 "이미 사라진 뒤" 상태로 설계됐다 — Badge.css.ts:31-40 주석이
   * 근거다. 목록에 없는데 사라지면 실측(마지막 it)이 잡아, "정리됐다"는
   * 오해를 막는다(animationBoundary.test.ts의 허용목록 관례와 동일 이유).
   */
  const HIDDEN_BASE_ALLOWLIST = new Set([
    'components/Badge/Badge.css.ts:valueExit',
  ]);

  it('base가 숨김 상태인 자리는 허용목록에 있는 것뿐이다', () => {
    // 무엇을 뒤집으면 빨개지는가: Divider.css.ts horizontal의
    // transform: 'scaleX(1)'을 'scale(0)'으로 바꾸면(base가 숨김이 됨,
    // 완료 기준을 직접 위반하는 자리) 허용목록에 없어 여기가 빨개진다.
    const offenders: string[] = [];
    for (const k of ONCE) {
      const fileText = FILE_TEXT[k.file];
      for (const usage of k.usages) {
        const base = declaredProps(enclosingBlock(fileText, usage.index));
        if (
          isHidden(base) &&
          !HIDDEN_BASE_ALLOWLIST.has(`${k.file}:${k.name}`)
        ) {
          offenders.push(`${k.file}:${k.name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('허용목록 항목은 실제로 숨김 base다 — 정리되면 목록에서 뺀다', () => {
    // 무엇을 뒤집으면 빨개지는가: Badge.css.ts valueExiting의
    // opacity: 0을 지우면(더는 숨김 base가 아니게 되면) 허용목록이 낡아
    // 여기가 빨개진다.
    for (const key of HIDDEN_BASE_ALLOWLIST) {
      const k = ONCE.find((x) => `${x.file}:${x.name}` === key);
      expect(k, `${key}를 ONCE에서 찾지 못했다`).toBeDefined();
      const fileText = FILE_TEXT[k!.file];
      const base = declaredProps(enclosingBlock(fileText, k!.usages[0].index));
      expect(isHidden(base), `${key}의 base가 더는 숨김이 아니다`).toBe(true);
    }
  });
});

/** `rest`(keyframe명 다음 나머지) 맨 앞의 duration 자리 하나를 뽑는다.
 * 보통은 `${...}` 토큰 하나지만, Badge.css.ts의 valueExit처럼
 * `calc(${...} * 0.65)`로 감싼 자리도 있다(공통 제약 §3의 calc 관례) —
 * 그 경우 괄호 짝을 맞춰 `calc(...)` 전체를 한 자리로 취급한다. */
function firstToken(rest: string): string {
  const trimmed = rest.replace(/^\s+/, '');
  if (trimmed.startsWith('calc(')) {
    let depth = 0;
    for (let i = 0; i < trimmed.length; i += 1) {
      if (trimmed[i] === '(') depth += 1;
      else if (trimmed[i] === ')') {
        depth -= 1;
        if (depth === 0) return trimmed.slice(0, i + 1);
      }
    }
  }
  return /^\S+/.exec(trimmed)?.[0] ?? '';
}

describe('검사 3 — keyframes 소비의 duration 자리가 리터럴이 아니라 토큰 참조다 (공통 제약 §3)', () => {
  it('${keyframe명} 바로 다음 토큰이 ${...} 또는 calc(${...} * 배수) 형태다', () => {
    // 무엇을 뒤집으면 빨개지는가: Divider.css.ts grow의
    // `${grow} ${themeContract.animation.duration.slow} ...`를
    // `${grow} 200ms ...`로 리터럴 치환하면 :root 축소 오버라이드를 못
    // 따라가므로(공통 제약 §3) 여기가 빨개진다. Badge.css.ts valueExiting의
    // `calc(${duration.base} * 0.65)`를 `calc(200ms * 0.65)`로 바꿔도
    // 마찬가지로 잡힌다. 뒤에 오는 리터럴 지연(예: Skeleton의 0.5s)은
    // duration 자리가 아니라 검사 대상이 아니다(공통 제약 §3 — 지연은
    // duration 토큰 대상이 아니고 animationBoundary.test.ts의
    // LITERAL_DELAY_EXCEPTIONS가 이미 따로 잠갔다).
    const TOKEN = /^(\$\{[\w.]+\}|calc\(\$\{[\w.]+\}\s*[*/]\s*[\d.]+\s*\))$/;
    const offenders: string[] = [];
    for (const k of CLASSIFIED) {
      for (const usage of k.usages) {
        const durationToken = firstToken(usage.rest);
        if (!TOKEN.test(durationToken)) {
          offenders.push(`${k.file}:${k.name} → "${durationToken}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('검사 4 — keyframes 본문이 transform·opacity·(Icon 한정) strokeDashoffset 밖을 안 건드린다', () => {
  it('프레임 속성이 화이트리스트 안이다', () => {
    // 무엇을 뒤집으면 빨개지는가: Loader.css.ts progress의 '0%' 프레임에
    // width: '0%' 같은 레이아웃 속성을 끼워 넣으면(공통 제약 §4 「금지」 목록)
    // 여기가 빨개진다.
    const offenders: string[] = [];
    for (const k of KEYFRAMES) {
      for (const frame of k.frames) {
        for (const prop of Object.keys(frame.props)) {
          const allowed =
            prop === 'transform' ||
            prop === 'opacity' ||
            (prop === 'strokeDashoffset' &&
              k.file === 'components/Icon/Icon.css.ts');
          if (!allowed)
            offenders.push(`${k.file}:${k.name}@${frame.key} (${prop})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("검사 5 — 'use client'가 진짜 지시어로 0건이다 (M2 경계, task-4-brief.md R7)", () => {
  // Popover.test.tsx:527-528 · Tooltip.test.tsx:818-819는 "없다"를 검증하는
  // 가드 테스트 **본문**이다 — 그 안의 'use client' 문자열은 지시어가 아니라
  // assert 대상 문자열이다(`expect(cssSource).not.toContain('use client')`).
  // 지시어는 파일의 맨 첫 비어있지 않은 줄이 `'use client';` 형태일 때만
  // 성립한다 — 그 위치 기준으로 가른다.
  const DIRECTIVE = /^['"]use client['"];?$/;

  function hasDirective(text: string): boolean {
    const firstLine = text.split(/\r?\n/).find((l) => l.trim() !== '');
    return firstLine !== undefined && DIRECTIVE.test(firstLine.trim());
  }

  it('반증 — 파일 맨 위 지시어는 잡힌다', () => {
    expect(hasDirective("'use client';\nexport const x = 1;")).toBe(true);
    expect(hasDirective('"use client"\nexport const x = 1;')).toBe(true);
  });

  it('반증 — 가드 테스트 본문 안의 문자열은 안 잡힌다 (Popover.test.tsx:527류)', () => {
    const fixture = [
      "import { describe, it, expect } from 'vitest';",
      "describe('x', () => {",
      '  it("\'use client\'가 없다", () => {',
      "    expect(cssSource).not.toContain('use client');",
      '  });',
      '});',
    ].join('\n');
    expect(hasDirective(fixture)).toBe(false);
  });

  it('저장소 실측: src 전체에 실제 지시어가 0건이다', () => {
    // 무엇을 뒤집으면 빨개지는가: 아무 .ts/.tsx 파일 맨 위에
    // 'use client';를 추가하면 여기가 빨개진다 — grep이 아니라 위치 기준
    // 판별이라 가드 테스트 두 파일은 여전히 통과한다.
    const ALL_SRC = findFiles(SRC, (n) => /\.tsx?$/.test(n));
    const offenders = ALL_SRC.filter((f) =>
      hasDirective(readFileSync(f, 'utf-8'))
    ).map(rel);
    expect(offenders).toEqual([]);
  });
});
