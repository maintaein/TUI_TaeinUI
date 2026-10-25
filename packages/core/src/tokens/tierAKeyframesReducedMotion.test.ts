/**
 * M2 T4: Tier-A 11개의 `@keyframes`가 축소 모드에서 「멈춘다」와 「보인다」를
 * 둘 다 지키는지 원문으로 잠근다 (공통 제약 §6, task-4-brief.md 산출물 1).
 *
 * `animationBoundary.test.ts`가 `transition:`/`animation:` 선언의 속성
 * 화이트리스트·리터럴 duration·리터럴 easing을 저장소 전체로 이미 잠그고
 * 있지만, 그 스캐너의 `MOTION_DECLARATION`은 `transition|animation` **접두**
 * 줄만 찾는다. `keyframes({...})` **본문 안의 개별 프레임**(`0%`·`100%`의
 * `transform`·`opacity` 값)은 그 대상이 아니다. 이 파일이 그 자리를 잠근다.
 *
 * `vitest.config.ts`가 CSS를 빈 문자열로 목킹하므로(Slider 예외 하나) jsdom에
 * `matchMedia`도 없다. `theme.reducedMotion.test.ts`·`animationBoundary.test.ts`와
 * 같은 이유로 생성 CSS가 아니라 `.css.ts` 원문을 읽는다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { describe, it, expect } from 'vitest';
import { inchwormFrames } from '../components/Loader/loaderMotion';

const SRC = resolve(__dirname, '..');
const COMPONENTS = resolve(SRC, 'components');

/**
 * M2 계획서(`.claude/고도화/plan/M2(Tier-A-CSS-모션).md`) 「대상」 14개
 * 에서 M5 Task 1이 스피너 하나를 `Loader`로 흡수해 뺀 13개에서 M5 Task 2가 `Icon`(공개 컴포넌트 삭제, `draw`
 * 폐기)을 더 빼 12개, M5 Task 26이 `Divider`(그어지는 모션을 지워 `@keyframes`와 애니메이션이 없다)를 더 빼 11개다(점 페이드·회전 키프레임은 `Loader` 디렉터리로 옮겨졌다). `HeaderBar`·`NumericSpinner`·정적 2개(`FormField`(M5 Task 14에서 `_internal/formField`로 내려갔다)·`List`; 정적이던 `Text`는 M5 7차 Task 23에서 컴포넌트째 삭제됐다)·
 * `SegmentedButtons`·`Slider`·오버레이 4종(`BottomSheet`·`Modal`·`SideSheet`·
 * `Snackbar`)은 M2 밖이다. 저장소 전체로 스캔하면 M3에 넘긴 오버레이 등장
 * 키프레임이 끌려온다(task-4-brief.md 경고).
 */
const TIER_A = [
  'Badge',
  'BoardRow',
  'Border',
  'Button',
  'Card',
  'Chip',
  'IconButton',
  'Loader',
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

/** `existsSync` 분기를 두지 않는다. TIER_A 이름에 오타가 나거나 컴포넌트
 * 디렉터리가 옮겨지면 `readdirSync`가 그 자리에서 던져야 한다. 빈 배열을
 * 돌려주면 그 컴포넌트가 소리 없이 스캔에서 빠지고 아래 모든 검사가
 * 「0건이라 통과」로 초록이 된다. */
const CSS_FILES = TIER_A.flatMap((name) =>
  findFiles(join(COMPONENTS, name), (n) => n.endsWith('.css.ts'))
);

const FILE_TEXT: Record<string, string> = {};
for (const file of CSS_FILES)
  FILE_TEXT[rel(file)] = readFileSync(file, 'utf-8');

// ---------------------------------------------------------------------------
// `@keyframes` 소스 열거: 브리프: 준 목록을 믿지 말고 소스에서 찾아라
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
 * 쓰이면(Loader의 `fadeInOut`처럼) 전부 개별로 검사해야 한다. */
function usagesOf(fileText: string, name: string): Usage[] {
  const re = new RegExp(`animation:\\s*\`\\$\\{${name}\\}([^\`]*)\``, 'g');
  const out: Usage[] = [];
  for (const m of fileText.matchAll(re)) {
    out.push({ rest: m[1], index: m.index ?? 0 });
  }
  return out;
}

/** 선언된 `transform`·`opacity`만 뽑는다. 이 가드가 다스리는
 * 두 속성 밖은 대상이 아니다. */
function declaredProps(block: string): Record<string, string> {
  const props: Record<string, string> = {};
  const RE =
    /(?:^|[,{])\s*(transform|opacity)\s*:\s*(?:'([^']*)'|(-?\d+(?:\.\d+)?))/g;
  for (const m of block.matchAll(RE)) props[m[1]] = m[2] ?? m[3];
  return props;
}

/** `scale`·`scaleX`·`scaleY`·`scale3d` 중 **평면 축**(x·y) 하나라도 0이면
 * 요소가 납작해져 안 보인다. 표기를 열거하지 않고 인자를 파싱한다.
 * `scale(0.0)`·`scale3d(0,0,1)`·`scaleX(0%)`·`scale(1, 0)`이 전부 걸린다.
 * `scaleZ`는 2D 렌더에서 가시성을 바꾸지 않아 대상이 아니다. */
function hasZeroScale(transform: string): boolean {
  const SCALE = /\bscale(3d|X|Y|Z)?\(([^)]*)\)/g;
  for (const m of transform.matchAll(SCALE)) {
    if (m[1] === 'Z') continue;
    const args = m[2].split(',').slice(0, 2);
    for (const arg of args) {
      const n = Number(arg.trim().replace(/%$/, ''));
      if (Number.isFinite(n) && n === 0) return true;
    }
  }
  return false;
}

/** opacity 0, `scale(0)`류: 요소를 완전히 안 보이게
 * 만드는 값만 대상이다. `translateX(±100%)`류는 대상이 아니다. Loader의
 * progress·Skeleton의 wave처럼 막대/셰이머가 트랙 밖으로 이동하는 것은
 * 의도된 스윕이지 숨김이 아니다(검사 1의 범위는 완료 조건이 명시한
 * opacity:0/scale(0)류뿐이다). */
function isHidden(props: Record<string, string>): boolean {
  if (props.opacity !== undefined && Number(props.opacity) === 0) return true;
  if (props.transform && hasZeroScale(props.transform)) return true;
  return false;
}

const DEFAULTS: Record<string, string> = {
  transform: 'none',
  opacity: '1',
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

describe('Tier-A 11개 @keyframes 소스 열거 (M2 T4)', () => {
  it('TIER_A 11개 디렉터리를 전부 읽었다. 스캔 대상이 0개로 줄면 아래 모든 검사가 진공이 된다', () => {
    // 무엇을 뒤집으면 빨개지는가: TIER_A에서 이름 하나를 빼면 11개가 되어
    // 여기가 빨개진다(오타를 내면 findFiles가 그 자리에서 던진다). 한
    // 컴포넌트가 .css.ts를 둘로 쪼개도 개수가 바뀌어 잡힌다.
    expect(CSS_FILES.map(rel)).toHaveLength(11);
  });

  it('모든 keyframes 참조가 최소 한 곳에서 쓰인다. 죽은 키프레임이 없다', () => {
    // 무엇을 뒤집으면 빨개지는가: keyframes를 정의만 하고 animation:에서 안 쓰면
    // (또는 이름을 오타내면) 여기서 잡힌다.
    const unused = CLASSIFIED.filter((k) => k.usages.length === 0);
    expect(unused.map((k) => `${k.file}:${k.name}`)).toEqual([]);
  });

  it('소스에서 찾은 keyframes 총량이 14개다, 늘거나 줄면 이 파일의 분류를 다시 본다', () => {
    // 무엇을 뒤집으면 빨개지는가: 11개 파일 중 하나에 keyframes를 새로 추가하거나
    // 지우면 총량이 바뀐다. (예상 자리 확인용, 브리프의 「예상되는 자리」는 참고이지
    // 여기서 실제로 세는 것이 진실이다.)
    // M5 task-20: Loader에 점 궤도(orbitLit)와 버블 점(bubbleRise·bubbleSquash)이
    // 들어 9개에서 12개가 됐다. fadeInOut은 버블 점의 축소 선호 대체(투명도
    // 깜빡임)로 남아 있어 빠지지 않았다.
    // M5 task-20 2부: 물결 막대(waveSwell)와 자벌레(inchworm)가 더해 14개가 됐다.
    // 자벌레는 정지점을 반복문으로 만들어 프레임이 0개로 읽힌다(아래 검사 4의
    // 생성형 키프레임 항목이 따로 지킨다).
    // M5 task-20 3부: 도화선 불똥의 깜빡임(fuseFlicker)이 더해 15개가 됐다. 축소
    // 선호에서는 깜빡임을 끄므로(animation: none) 대체 키프레임은 늘지 않았다.
    // M5 task-26: Divider의 그어지는 모션(grow)이 지워져 14개가 됐다.
    expect(KEYFRAMES).toHaveLength(14);
  });

  it('keyframes가 있는 파일은 Badge·Border·Loader·Skeleton 4개뿐이다. Popover·Tooltip은 0건이다', () => {
    // 무엇을 뒤집으면 빨개지는가: Popover.css.ts나 Tooltip.css.ts에 fadeIn류
    // keyframes를 다시 넣으면(=상태 전이에 @keyframes로 회귀) 여기가 잡는다.
    // Button·Card·Chip·IconButton·BoardRow도 같은 이유로 0건이어야 한다.
    const files = [...new Set(KEYFRAMES.map((k) => k.file))].sort();
    expect(files).toEqual([
      'components/Badge/Badge.css.ts',
      'components/Border/Border.css.ts',
      'components/Loader/Loader.css.ts',
      'components/Skeleton/Skeleton.css.ts',
    ]);
  });

  it('무한 루프 12개 · 마운트 1회 2개로 분류된다', () => {
    // 무엇을 뒤집으면 빨개지는가: 루프에서 infinite를 빼거나 마운트 1회에
    // infinite를 붙이면(잘못된 도구 선택, 공통 제약 §2) 분류가 바뀌어 잡힌다.
    expect(LOOP.map((k) => `${k.file}:${k.name}`).sort()).toEqual([
      'components/Border/Border.css.ts:rotate',
      'components/Loader/Loader.css.ts:bubbleRise',
      'components/Loader/Loader.css.ts:bubbleSquash',
      'components/Loader/Loader.css.ts:fadeInOut',
      'components/Loader/Loader.css.ts:fuseFlicker',
      'components/Loader/Loader.css.ts:inchworm',
      'components/Loader/Loader.css.ts:orbitLit',
      'components/Loader/Loader.css.ts:progress',
      'components/Loader/Loader.css.ts:spin',
      'components/Loader/Loader.css.ts:waveSwell',
      'components/Skeleton/Skeleton.css.ts:pulse',
      'components/Skeleton/Skeleton.css.ts:wave',
    ]);
    expect(ONCE.map((k) => `${k.file}:${k.name}`).sort()).toEqual([
      'components/Badge/Badge.css.ts:valueEnter',
      'components/Badge/Badge.css.ts:valueExit',
    ]);
  });

  it('keyframe 이름의 ${...} 보간이 전부 usagesOf에 잡힌다. 다른 표기로 쓴 사용처가 검사 1·2·3에서 통째로 빠지지 않는다', () => {
    // `usagesOf`는 `animation: \`${이름} ...\`` 한 가지 표기만 읽는다. 같은
    // keyframe을 `animationName:` 분리 선언이나 다른 셰이프로 쓰면 그
    // 사용처는 base·fill-mode·duration 검사에서 조용히 빠진다. 파일 안의
    // 보간 총량과 대조해 그 구멍을 닫는다(Loader fadeInOut이 3곳에서 쓰인다).
    // 무엇을 뒤집으면 빨개지는가: Loader.css.ts 두 번째 fadeInOut 사용처의
    // `animation: \`${fadeInOut} ...\``를 `animationName: fadeInOut` + 별도
    // 선언으로 바꾸면 보간 3건 vs 사용처 2건이 되어 여기가 빨개진다.
    const missed = CLASSIFIED.filter((k) => {
      const interpolations =
        FILE_TEXT[k.file].match(new RegExp(`\\$\\{${k.name}\\}`, 'g')) ?? [];
      return interpolations.length !== k.usages.length;
    }).map((k) => `${k.file}:${k.name}`);
    expect(missed).toEqual([]);
  });
});

/**
 * 축소 모드에서 루프가 실제로 「보인다」를 결정하는 것은 프레임 값이 아니라
 * **소비처 base + `animation-fill-mode`** 다. `theme.css.ts`의 `:root`
 * 오버라이드가 `animation-duration: 0.01ms !important`와
 * `animation-iteration-count: 1 !important`를 강제하므로, 무한 루프는 1회
 * 돌고 끝난 뒤 fill-mode에 따라 (a) base로 복귀하거나 (b) 마지막 프레임에
 * 고착한다. M1의 `LoadingSpinner`(지금은 `Loader`에 흡수됐다) 점 페이드 `opacity: 0.2` 고착이 바로 (b)였다.
 * `both`가 `'0%, 100%'` 프레임을 붙들었다.
 *
 * 그 성질은 지금까지 `theme.reducedMotion.test.ts`의 `dot` 한 자리에만
 * 리터럴 문자열로 잠겨 있었다. 여기서 LOOP 9개 전부로 일반화한다.
 */
describe('검사 1: 무한 루프 12개가 축소 모드(iteration 1)에서 보이는 상태로 끝난다: 소비처 base가 표시 상태이고 fill-mode가 forwards/both가 아니다', () => {
  it('LOOP 12개에서 프레임 30개·프레임 속성 34개·소비처 14곳을 실제로 순회한다, 파서가 0개를 세면 아래 검사들보다 먼저 여기가 빨개진다', () => {
    // 무엇을 뒤집으면 빨개지는가: 루프 하나를 `from`/`to` 표기로 바꾸거나
    // 프레임 값에 `${...}` 보간을 넣으면 parseFrames가 그 키프레임에서 0개를
    // 돌려준다. 개수가 어긋나 여기가 빨개진다. 개수 앵커가 없으면 같은
    // 리팩터링이 "순회할 것이 없으니 위반도 없다"로 조용히 초록이 된다.
    // M5 task-20 2부: 버블 몸이 프레임 4개가 되고(+2), 물결(+2)과 자벌레(0, 생성형)가
    // 더해 22개에서 26개. fadeInOut이 막대와 자벌레의 축소 선호에도 쓰여 소비처는
    // 9곳에서 13곳(물결 1, 자벌레 1, fadeInOut +2)이다.
    // M5 task-20 3부: 불똥 깜빡임이 프레임 4개(각각 transform과 opacity, 속성 +8)와
    // 소비처 1곳을 더해 프레임 30개·속성 34개·소비처 14곳이다.
    expect(LOOP.flatMap((k) => k.frames)).toHaveLength(30);
    expect(
      LOOP.flatMap((k) => k.frames).flatMap((f) => Object.keys(f.props))
    ).toHaveLength(34);
    expect(LOOP.flatMap((k) => k.usages)).toHaveLength(14);
  });

  it('0%·100% 프레임에 opacity:0 / scale(0)류가 없다', () => {
    // 무엇을 뒤집으면 빨개지는가: Loader.css.ts의 fadeInOut '0%, 100%'
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

  it('LOOP 소비처의 fill-mode에 forwards·both가 없다. 있으면 축소 모드에서 마지막 프레임에 고착한다 (M1 opacity:0.2 회귀 경로)', () => {
    // 무엇을 뒤집으면 빨개지는가: Loader.css.ts dot의 `backwards`를
    // `both`로 되돌리면(M1 회귀 그 자체) 여기가 빨개진다. Border rotate나
    // Skeleton pulse에 `forwards`를 붙여도 같다.
    const offenders: string[] = [];
    for (const k of LOOP) {
      for (const usage of k.usages) {
        if (/\b(forwards|both)\b/.test(usage.rest))
          offenders.push(`${k.file}:${k.name} → "${usage.rest.trim()}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('11개 파일 어디에도 animationFillMode 롱핸드가 없다. 바로 위 검사가 숏핸드 꼬리만 보기 때문이다', () => {
    // 위 it은 `animation:` 숏핸드에서 키프레임명 뒤 꼬리(`rest`)만 읽는다.
    // 같은 fill-mode를 `animationFillMode: 'forwards'` 롱핸드로 따로 쓰면
    // 그 스캔에 안 걸리고, Loader.css.ts의 dotDelayStyles처럼 소비처
    // 블록 밖에 놓이면 enclosingBlock도 못 닿는다. 그래서 롱핸드 자체를
    // 11개 파일 전역에서 금지한다. fill-mode는 숏핸드 꼬리에만 적는다.
    // 무엇을 뒤집으면 빨개지는가: 아무 .css.ts에나 `animationFillMode:
    // 'forwards'` 한 줄을 넣으면 여기가 빨개진다. 파일 수가 11에서 줄어도
    // 마찬가지다. 목록이 비면 아래 루프가 0번 돌고 조용히 초록이 된다.
    expect(Object.keys(FILE_TEXT)).toHaveLength(11);
    const offenders: string[] = [];
    for (const [file, text] of Object.entries(FILE_TEXT)) {
      for (const line of text.split('\n')) {
        if (/\banimationFillMode\b/.test(line))
          offenders.push(`${file} → "${line.trim()}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('LOOP 소비처의 base가 숨김 상태가 아니다. 1회 재생 뒤 복귀할 자리가 보이는 상태여야 한다', () => {
    // fill-mode가 없으면 애니메이션이 끝난 뒤 base로 돌아간다. base 자체가
    // 숨김이면 축소 모드에서 요소가 0.01ms 뒤에 사라진다.
    // 무엇을 뒤집으면 빨개지는가: Skeleton.css.ts wave의 `&::after` base에
    // `opacity: 0`을 넣거나 Loader.css.ts dot에
    // `transform: 'scale(0)'`를 넣으면 여기가 빨개진다.
    const offenders: string[] = [];
    for (const k of LOOP) {
      const fileText = FILE_TEXT[k.file];
      for (const usage of k.usages) {
        const base = declaredProps(enclosingBlock(fileText, usage.index));
        if (isHidden(base)) offenders.push(`${k.file}:${k.name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('검사 2: 마운트 1회 키프레임은 base가 최종 표시 상태이고 0%만 시작 상태다 (공통 제약 §6)', () => {
  it('프레임이 정확히 하나이고 키가 0%다. 100%로 뒤집히면 여기서 잡힌다', () => {
    // 무엇을 뒤집으면 빨개지는가: Badge.css.ts의 valueEnter 키 '0%'를 '100%'로
    // 바꾸면(완료 조건 1이 말하는 "0% 프레임이 뒤집힌 것" 그 자체) 여기가
    // 빨개진다.
    const bad = ONCE.filter(
      (k) => !(k.frames.length === 1 && k.frames[0].key === '0%')
    );
    expect(bad.map((k) => `${k.file}:${k.name}`)).toEqual([]);
  });

  it('0% 프레임이 소비자 base와 다르다. 같으면 애니메이션이 무의미해진 것이다', () => {
    // 무엇을 뒤집으면 빨개지는가: Badge.css.ts valueEnter의 0% 프레임 opacity·
    // transform을 소비자 base와 같은 값으로 바꾸면(즉 애니메이션이 아무것도 안 바꾸면)
    // 여기가 빨개진다.
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
   * base가 "숨김" 상태면 축소 모드(duration→0.01ms)에서 요소가 사라진다.
   * 허용목록에 없는 자리는 실패한다. `Badge`의 `valueExit`만 예외다: 그
   * 노드는 퇴장 중인 일시적 DOM이라(Badge.tsx가 onAnimationEnd에 제거한다)
   * base 자체가 "이미 사라진 뒤" 상태로 설계됐다. Badge.css.ts:31-40 주석이
   * 근거다. 목록에 없는데 사라지면 실측(마지막 it)이 잡아, "정리됐다"는
   * 오해를 막는다(animationBoundary.test.ts의 허용목록 관례와 동일 이유).
   */
  const HIDDEN_BASE_ALLOWLIST = new Set([
    'components/Badge/Badge.css.ts:valueExit',
  ]);

  it('base가 숨김 상태인 자리는 허용목록에 있는 것뿐이다', () => {
    // 무엇을 뒤집으면 빨개지는가: Badge.css.ts valueCurrent에
    // `opacity: 0`을 넣으면(base가 숨김이 됨,
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

  it('허용목록 항목은 실제로 숨김 base다. 정리되면 목록에서 뺀다', () => {
    // 무엇을 뒤집으면 빨개지는가: Badge.css.ts valueExiting의
    // opacity: 0을 지우면(더는 숨김 base가 아니게 되면) 허용목록이 낡아
    // 여기가 빨개진다.
    //
    // 개수를 먼저 고정한다(리뷰 F4). 목록이 비면 아래 루프가 0번 돌고 이
    // it은 조용히 초록이 된다. 지금은 Badge의 valueExit 하나뿐이고, 늘거나
    // 주는 건 정리가 아니라 결정이라 이 줄부터 고쳐야 한다.
    expect(HIDDEN_BASE_ALLOWLIST.size).toBe(1);
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
 * `calc(${...} * 0.65)`로 감싼 자리도 있다(공통 제약 §3의 calc 관례).
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

describe('검사 3: keyframes 소비의 duration 자리가 리터럴이 아니라 토큰 참조다 (공통 제약 §3)', () => {
  it('${keyframe명} 바로 다음 토큰이 ${...} 또는 calc(${...} * 배수) 형태다', () => {
    // 무엇을 뒤집으면 빨개지는가: Badge.css.ts valueEnter의
    // `${valueEnter} ${themeContract.animation.duration.base} ...`를
    // `${valueEnter} 200ms ...`로 리터럴 치환하면 :root 축소 오버라이드를 못
    // 따라가므로(공통 제약 §3) 여기가 빨개진다. Badge.css.ts valueExiting의
    // `calc(${duration.base} * 0.65)`를 `calc(200ms * 0.65)`로 바꿔도
    // 마찬가지로 잡힌다. 뒤에 오는 리터럴 지연(예: Skeleton의 0.5s)은
    // duration 자리가 아니라 검사 대상이 아니다(공통 제약 §3: 지연은
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

describe('검사 4: keyframes 본문이 transform·opacity 밖을 안 건드린다', () => {
  it('14개 전체에서 프레임 32개·프레임 속성 38개를 실제로 순회한다, 파싱이 비면 화이트리스트 검사가 진공이다', () => {
    // 무엇을 뒤집으면 빨개지는가: 프레임 값 하나를 백틱 보간(`\`${x}\``)으로
    // 바꾸면 PROP 정규식이 그 속성을 못 읽어 속성 수가 줄고, 프레임 키를
    // `from`/`to`로 바꾸면 FRAME 정규식이 그 프레임을 통째로 놓쳐 프레임 수가
    // 준다. 둘 다 여기가 먼저 잡는다.
    // M5 task-20 3부: 불똥 깜빡임 프레임 4개, 속성 8개가 더해 33개와 39개다.
    // M5 task-26: Divider의 grow(프레임 1개, 속성 1개)가 지워져 32개와 38개다.
    expect(KEYFRAMES.flatMap((k) => k.frames)).toHaveLength(32);
    expect(
      KEYFRAMES.flatMap((k) => k.frames).flatMap((f) => Object.keys(f.props))
    ).toHaveLength(38);
  });

  /**
   * 정지점을 반복문으로 만드는 키프레임은 위 파서가 프레임을 0개로 읽어서
   * 화이트리스트(transform·opacity)를 소리 없이 비껴간다. 그래서 프레임이 0개로
   * 읽히는 키프레임은 이 목록에 이름과 이유를 적어야만 허용하고, 실제 프레임은
   * 순수 함수의 출력에서 읽어 속성을 따로 잠근다.
   *
   * 자벌레(inchworm)는 clip-path를 움직인다. 화이트리스트 규칙(공통 제약 §4)의
   * 취지는 레이아웃을 건드리지 않는 것이다. clip-path는 레이아웃을 바꾸지 않는
   * 페인트 속성이고, 알약의 두 가장자리를 따로 움직이면서 둥근 끝을 지키는(교훈 16)
   * 방법이 이것뿐이다. animationTimingFunction은 정지점마다 구간 커브를 거는 자리다.
   */
  const GENERATED_KEYFRAMES: Record<string, string[]> = {
    'components/Loader/Loader.css.ts:inchworm': [
      'animationTimingFunction',
      'clipPath',
    ],
  };

  it('프레임이 0개로 읽히는(반복문으로 만든) 키프레임은 허용 목록의 것뿐이다', () => {
    const unparsed = KEYFRAMES.filter((k) => k.frames.length === 0).map(
      (k) => `${k.file}:${k.name}`
    );
    expect(unparsed.sort()).toEqual(Object.keys(GENERATED_KEYFRAMES).sort());
  });

  it('허용 목록의 자벌레는 clipPath와 구간 커브(animationTimingFunction)만 움직이고 레이아웃 속성이 없다', () => {
    const props = new Set(
      Object.values(inchwormFrames('x')).flatMap((frame) => Object.keys(frame))
    );
    expect([...props].sort()).toEqual(
      GENERATED_KEYFRAMES['components/Loader/Loader.css.ts:inchworm']
    );
  });

  it('프레임 속성이 화이트리스트 안이다', () => {
    // 무엇을 뒤집으면 빨개지는가: Loader.css.ts progress의 '0%' 프레임에
    // width: '0%' 같은 레이아웃 속성을 끼워 넣으면(공통 제약 §4 「금지」 목록)
    // 여기가 빨개진다.
    const offenders: string[] = [];
    for (const k of KEYFRAMES) {
      for (const frame of k.frames) {
        for (const prop of Object.keys(frame.props)) {
          const allowed = prop === 'transform' || prop === 'opacity';
          if (!allowed)
            offenders.push(`${k.file}:${k.name}@${frame.key} (${prop})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("검사 5: 'use client'가 진짜 지시어로 0건이다 (M2 경계, task-4-brief.md R7)", () => {
  // Popover.test.tsx:527-528 · Tooltip.test.tsx:818-819는 "없다"를 검증하는
  // 가드 테스트 **본문**이다. 그 안의 'use client' 문자열은 지시어가 아니라
  // assert 대상 문자열이다(`expect(cssSource).not.toContain('use client')`).
  // 지시어는 파일의 맨 첫 비어있지 않은 줄이 `'use client';` 형태일 때만
  // 성립한다. 그 위치 기준으로 가른다.
  const DIRECTIVE = /^['"]use client['"];?$/;

  /** 선행 주석 블록을 걷어낸다. esbuild·SWC는 주석 뒤에 놓인 지시어도
   * 지시어로 인정한다. "첫 비어있지 않은 줄"만 보면 주석 한 줄로 이 검사를
   * 우회할 수 있다(이 파일 자체가 `/** ... *\/`로 시작한다). */
  function stripLeadingComments(text: string): string {
    let rest = text.trimStart();
    for (;;) {
      if (rest.startsWith('//')) {
        const nl = rest.indexOf('\n');
        rest = nl === -1 ? '' : rest.slice(nl + 1).trimStart();
      } else if (rest.startsWith('/*')) {
        const end = rest.indexOf('*/');
        rest = end === -1 ? '' : rest.slice(end + 2).trimStart();
      } else {
        return rest;
      }
    }
  }

  function hasDirective(text: string): boolean {
    const firstLine = stripLeadingComments(text).split(/\r?\n/)[0];
    return firstLine !== undefined && DIRECTIVE.test(firstLine.trim());
  }

  it('반증: 파일 맨 위 지시어는 잡힌다', () => {
    expect(hasDirective("'use client';\nexport const x = 1;")).toBe(true);
    expect(hasDirective('"use client"\nexport const x = 1;')).toBe(true);
  });

  it('반증: 선행 주석 블록 뒤의 지시어도 잡힌다', () => {
    expect(
      hasDirective("// 라이선스 헤더\n'use client';\nexport const x = 1;")
    ).toBe(true);
    expect(
      hasDirective('/* 블록 주석 */\n\n"use client";\nexport const x = 1;')
    ).toBe(true);
  });

  it('반증: 가드 테스트 본문 안의 문자열은 안 잡힌다 (Popover.test.tsx:527류)', () => {
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
    // 'use client';를 추가하면 여기가 빨개진다. grep이 아니라 위치 기준
    // 판별이라 가드 테스트 두 파일은 여전히 통과한다.
    const ALL_SRC = findFiles(SRC, (n) => /\.tsx?$/.test(n));
    // 스캔 대상이 비면 `[].filter(...)` → `[]` → 초록이다. 실측 157개이므로
    // 100을 바닥으로 둔다(개수 자체는 컴포넌트가 늘면 바뀌는 값이라 고정하지
    // 않는다. 여기서 막으려는 것은 "0개를 돌았다"뿐이다).
    expect(ALL_SRC.length).toBeGreaterThan(100);
    const offenders = ALL_SRC.filter((f) =>
      hasDirective(readFileSync(f, 'utf-8'))
    ).map(rel);
    expect(offenders).toEqual([]);
  });
});

// M6 후속 Task 15: FormField는 정적이 아니게 됐다. 에러·성공 문구가 4px 위에서 내려오며
// 나타나는 모션(settleIn, 마운트 1회)이 문구 요소에 있어서 FormField 파일을 정적 목록에서 뺀다.
describe('검사 6: 정적 1개(List)에 애니메이션이 0건이다 (task-4-brief.md R8)', () => {
  /** `existsSync` 분기 없이 바로 읽는다. 디렉터리가 옮겨지면 던져야 한다. */
  const STATIC_CSS_FILES = [
    ...findFiles(join(COMPONENTS, 'List'), (n) => n.endsWith('.css.ts')),
  ];

  it('정적 1개의 .css.ts를 실제로 1개 읽었다. 0개를 읽고 "0건"이라 보고하는 진공을 막는다', () => {
    // 무엇을 뒤집으면 빨개지는가: 위 목록에서 이름 하나를 빼면 1개가 되어
    // 여기가 빨개진다(오타는 findFiles가 그 자리에서 던진다). 셋이던 목록이
    // 둘이 된 것은 M5 7차 Task 23에서 `Text`가 삭제됐기 때문이다. 이 앵커가
    // 없으면 아래 `it`은 파일을 하나도 안 읽고도 초록이다.
    expect(STATIC_CSS_FILES.map(rel)).toEqual(['components/List/List.css.ts']);
  });

  it('List.css.ts에 animation·transition·keyframes가 한 글자도 없다', () => {
    // 무엇을 뒤집으면 빨개지는가: List.css.ts에 `transition: ...` 한 줄을
    // 넣으면(M2가 정적으로 남기기로 한 컴포넌트에 모션이 들어오면) 여기가
    // 빨개진다.
    const offenders: string[] = [];
    for (const file of STATIC_CSS_FILES) {
      const text = readFileSync(file, 'utf-8');
      for (const m of text.matchAll(/\b(animation|transition|keyframes)\w*/g)) {
        const line = text.slice(0, m.index).split('\n').length;
        offenders.push(`${rel(file)}:${line} (${m[0]})`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('검사 7: 팔레트 밖 하드코딩 색상이 색상 3채널에 0건이다 (task-4-brief.md R10)', () => {
  /** `background`·`color`·`border-color` 계열만 본다. `boxShadow`·`textShadow`
   * 안의 rgba는 M5 소관이라 세지 않는다(브리프 50행). 그래서 속성 이름을
   * 열거해 그 셋만 고른다. `maskImage`의 `#000`도 색상 채널이 아니다. */
  const CHANNEL =
    /\b(background|backgroundColor|backgroundImage|color|borderColor|borderTopColor|borderRightColor|borderBottomColor|borderLeftColor)\s*:\s*(`[^`]*`|'[^']*'|[^,\n]*)/g;
  /** 팔레트를 거치지 않는 리터럴 색. 토큰은 전부 `themeContract...` 또는
   * `var(--...)`로 들어오므로 이 셋만 걸러내면 된다. */
  const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;

  it('TIER_A 11개 파일 전체에서 색상 3채널 선언을 실제로 순회한다', () => {
    // 무엇을 뒤집으면 빨개지는가: CHANNEL 정규식이 아무것도 못 잡게 되면
    // (속성 이름 철자가 바뀌거나 포매팅이 달라지면) 아래 `it`이 진공으로
    // 초록이 된다. 그 전에 여기가 잡는다. 실측 하한이다.
    const decls = Object.values(FILE_TEXT).flatMap((text) => [
      ...text.matchAll(CHANNEL),
    ]);
    expect(decls.length).toBeGreaterThan(50);
  });

  it('세 채널 값에 #hex·rgb()·hsl() 리터럴이 없다. 허용목록 없이 0건이다', () => {
    // 무엇을 뒤집으면 빨개지는가: Button.css.ts의
    // `var(--btn-hover-bg, ${themeContract.color.surface.hover})`를 T3 이전의
    // `var(--btn-hover-bg, rgba(0,0,0,0.04))`로 되돌리거나, Skeleton.css.ts
    // shimmer의 `${themeContract.color.overlay.shimmer}`를
    // `rgba(255,255,255,0.3)`으로 되돌리면 여기가 빨개진다.
    const offenders: string[] = [];
    for (const [file, text] of Object.entries(FILE_TEXT)) {
      for (const m of text.matchAll(CHANNEL)) {
        if (!RAW_COLOR.test(m[2])) continue;
        const line = text.slice(0, m.index).split('\n').length;
        offenders.push(`${file}:${line} (${m[1]})`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
