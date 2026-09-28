/**
 * 애니메이션 토큰 경계 명세 + 경계를 잠그는 검사 (M1 T8).
 *
 * ## 경계 (무엇이 토큰이고 무엇이 아닌가)
 *
 * - **토큰이다** — 여러 컴포넌트가 공유하는 의미 단위. 전이 속도
 *   (`animation.duration`), 무한 반복 주기(`animation.loop`), 등장·퇴장 커브
 *   (`animation.easing`).
 * - **토큰이 아니다** — 한 컴포넌트에만 있는 고유 연출의 내부 타이밍(스켈레톤
 *   wave 시작 지연, 로딩 점 스태거 등). 단, 그것도 `duration`·`loop` 토큰의
 *   배수로 표현한다. 지연(`*Delay`)은 전이 속도가 아니라 연출의 내부 타이밍이라
 *   duration 토큰의 대상이 아니다.
 * - **오버슈트 이징(`snap`·`spring`)은 `transform`에만 건다.** 프로브 실측으로
 *   `back.out(1.7)`의 피크는 1.0998, `elastic.out(1, 0.5)`는 1.2044다 —
 *   `linear()` 문자열에 1을 넘는 값이 들어간다. `transform: scale`에서는 그게
 *   정확히 원하는 것이지만 `opacity`·색에서는 1에서 잘려 "떴다가 살짝 꺼졌다
 *   다시 차오르는" 인공물이 되고, 색은 채널별로 잘려 색조까지 틀어진다.
 * - **전이 속성은 명시한다.** `transition: all`은 금지다. 화이트리스트
 *   (합성·페인트 속성) 밖의 속성을 전이하려면 직전 줄에 근거 주석을 남긴다.
 * - **예외는 허용 목록에 이유와 소유 마일스톤을 적어 올린다.** 목록에 없는 새
 *   리터럴은 실패한다. 목록에 있는데 더는 없는 항목도 실패한다(목록이 저절로
 *   줄어들지 않으면 다음 사람이 "이미 정리됐다"고 오해한다).
 *
 * ## 왜 소스 텍스트를 읽는가
 *
 * vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못 읽는다.
 * `components/touchAction.test.ts` · `docs/llms.test.ts` ·
 * `tokens/theme.reducedMotion.test.ts`가 모두 같은 이유로 소스 텍스트를 읽는다.
 * 스캔 대상은 `.css.ts`만이 아니다 — JS가 인라인 스타일로 거는 전이가 토큰
 * 체계를 빠져나가는 탈출구라서 `components/` 아래 `.tsx`·`.ts`도 같이 읽는다(R39).
 *
 * ## 여기서 자동 검증하지 않는 것
 *
 * "reduced-motion에서 모든 스토리가 정지 화면으로 보인다"는 **자동 검증이 아니라
 * 브라우저 육안 확인 항목이다.** jsdom은 `prefers-reduced-motion`을 모사하지도
 * 프레임을 그리지도 않아 vitest로 도달할 수 없다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { easing } from './animation.css';
import { SRC, rel, findFiles } from '../test/sourceScan';

const CORE_ROOT = resolve(SRC, '..');
const COMPONENTS = resolve(SRC, 'components');
const DIST = resolve(CORE_ROOT, 'dist');

const CSS_FILES = findFiles(COMPONENTS, (name) => name.endsWith('.css.ts'));
const INLINE_FILES = findFiles(
  COMPONENTS,
  (name) =>
    /\.tsx?$/.test(name) &&
    !name.endsWith('.css.ts') &&
    !/\.test\.tsx?$/.test(name)
);

// ---------------------------------------------------------------------------
// 모션 선언 수집
// ---------------------------------------------------------------------------

/**
 * 경계가 다스리는 속성. `animationName`·`animationIterationCount`는 시간이 아니라
 * 선택 항목이 아니다.
 *
 * **줄 머리에 고정하면 안 된다.** `LoadingSpinner.css.ts:77`의
 * `first: { animationDelay: '0s' },`처럼 한 줄 객체 안에 들어앉은 선언이 있어서,
 * `^\s*`로 고정한 첫 판은 지연 5건 중 3건을 조용히 놓쳤다. 앞의 `(?<![\w.'"])`가
 * `themeContract.animation.duration`류 참조와 문자열 안을 걸러낸다.
 */
const MOTION_DECLARATION =
  /(?<![\w.'"])(transition|animation)(Delay|Duration|Property|TimingFunction)?\s*:\s*(.*)$/;

/**
 * 모션 선언의 **머리만** 찾는다. 값을 읽지 않으므로 한 줄에 몇 개가 있는지
 * 세는 데 쓴다 — `MOTION_DECLARATION`은 `(.*)$`로 줄 끝까지 삼켜 개수를 못 센다.
 */
const MOTION_KEYWORD =
  /(?<![\w.'"])(?:transition|animation)(?:Delay|Duration|Property|TimingFunction)?\s*:/g;

/** `.tsx`/`.ts`가 인라인 스타일로 거는 모션 대입 (R39). */
const INLINE_ASSIGNMENT =
  /\.style\.(transition|animation)(Delay|Duration|Property|TimingFunction)?\s*=\s*(['"`])([^'"`]*)\3/g;

/**
 * 할 일 1 — M1이 자기 손으로 기록한 스캐너 맹점 셋.
 *
 * 셋 다 `.tsx`/`.ts`가 DOM 스타일을 거는 다른 문법이라 `INLINE_ASSIGNMENT`(대입 `=`)로는
 * 못 잡는다. 결과는 `analyze()`를 거쳐 `MotionDecl`로 만들어 기존 화이트리스트·허용목록
 * 검사가 그대로 먹히게 한다(카멜케이스 정규화 포함).
 */

/** 케밥케이스를 .css.ts 쪽 카멜케이스로 정규화한다 — `setProperty`·`cssText`는 실제 CSS
 * 속성명(케밥케이스)로 오지만 화이트리스트·허용목록은 카멜케이스 키를 쓴다. */
function toCamelProperty(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
}

/** 이 가드가 다스리는 속성만 통과시킨다. `color`·`width` 같은 무관한 속성은 대상이 아니다. */
const MOTION_PROPERTY =
  /^(transition|animation)(Delay|Duration|Property|TimingFunction)?$/;

/** 맹점 2 — `element.style.setProperty('transition-timing-function', '...')`. */
const INLINE_SET_PROPERTY =
  /\.style\.setProperty\(\s*(['"`])([\w-]+)\1\s*,\s*(['"`])([^'"`]*)\3/g;

/** 맹점 3 — `element.style.cssText = '...'`. 선언 여러 개가 한 문자열에 들어온다.
 * `+=`도 `cssText`를 정상적으로 건드리는 방법이라(F4) `\+?`로 한 글자만 늘려 받는다. */
const INLINE_CSS_TEXT = /\.style\.cssText\s*\+?=\s*(['"`])([^'"`]*)\1/g;

/**
 * 전이 **속성 목록**을 담는 선언. `transition` 단축뿐 아니라 `transitionProperty`
 * 롱핸드도 목록 그 자체라 같은 검사를 받아야 한다 — 롱핸드를 빼면
 * `transitionProperty: 'all'`이 'all' 금지와 화이트리스트를 둘 다 우회한다.
 */
function listsProperties(property: string): boolean {
  return property === 'transition' || property === 'transitionProperty';
}

/**
 * 값이 리터럴이 아니면 스캐너가 눈이 머는 선언.
 *
 * 단축과 속성 목록은 값을 못 읽으면 검사가 통째로 빈손이 된다. 반면
 * `transitionDuration: themeContract.animation.duration.base` 같은 시간·이징
 * 롱핸드는 리터럴이 아닌 게 **정답**이다 — 값을 숨긴 게 아니라 읽을 리터럴이
 * 없는 것이다. `DesignTokens.mdx`가 권하는 모양이 정확히 이것이라, 이걸
 * 불투명으로 세면 규칙을 지킨 코드가 빨개진다.
 */
function needsLiteral(property: string): boolean {
  return listsProperties(property) || property === 'animation';
}

interface Slot {
  /** `literal` = 리터럴 시간, `token` = duration·loop 토큰 참조 */
  kind: 'literal' | 'token';
  text: string;
  line: number;
}

interface Segment {
  /** 구간 원문 */
  text: string;
  /** 쉼표로 나뉜 구간의 첫 토큰. `transition`에서만 의미가 있다. */
  property: string;
  /** 구간이 시작하는 줄 */
  line: number;
  /** 시간 슬롯만. easing 토큰 참조는 시간이 아니라서 빠져 있다. */
  slots: Slot[];
}

interface MotionDecl {
  file: string;
  /** `transition` · `animationDelay` 처럼 소스에 적힌 그대로 */
  property: string;
  /** 선언이 시작하는 줄(1-based) */
  line: number;
  /** 따옴표·백틱을 벗긴 값. 여러 줄이면 개행이 그대로 들어 있다. */
  value: string;
  segments: Segment[];
}

/**
 * 콜론 뒤에서 문자열 리터럴 하나를 읽는다. 리터럴이 아니면 `null`.
 *
 * 백틱이 같은 줄에서 안 닫히면 닫힐 때까지 다음 줄을 이어 붙인다 —
 * `transition:`이 있는 줄만 보는 스캐너는 `SegmentedButtons.css.ts:32`·`:33`을
 * 통째로 놓친다(R32 함정 4).
 */
function readLiteral(
  rest: string,
  lines: string[],
  index: number
): string | null {
  const quote = rest[0];
  if (quote === "'" || quote === '"') {
    return (
      new RegExp(`^${quote}([^${quote}]*)${quote}`).exec(rest)?.[1] ?? null
    );
  }
  if (quote !== '`') return null;

  const sameLine = rest.indexOf('`', 1);
  if (sameLine !== -1) return rest.slice(1, sameLine);

  let value = rest.slice(1);
  for (let j = index + 1; j < lines.length; j += 1) {
    const close = lines[j].indexOf('`');
    if (close !== -1) return `${value}\n${lines[j].slice(0, close)}`;
    value += `\n${lines[j]}`;
  }
  return null;
}

/**
 * 쉼표로 구간을 나눈다. **괄호·`${}` 안의 쉼표는 구분자가 아니다** —
 * `cubic-bezier(0.4, 0, 0.2, 1)`을 넷으로 쪼개면 구간의 첫 토큰이 `0`·`0.2`가
 * 되어 속성 화이트리스트 검사가 통째로 헛돈다.
 */
function splitSegments(value: string): { text: string; offset: number }[] {
  const out: { text: string; offset: number }[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === '(' || ch === '{') depth += 1;
    else if (ch === ')' || ch === '}') depth -= 1;
    else if (ch === ',' && depth === 0) {
      out.push({ text: value.slice(start, i), offset: start });
      start = i + 1;
    }
  }
  out.push({ text: value.slice(start), offset: start });
  return out.filter((segment) => segment.text.trim().length > 0);
}

/**
 * 시간 슬롯: 리터럴 시간 **또는** `animation.duration.*`·`animation.loop.*`
 * 토큰 참조. `animation.easing.*`는 시간이 아니다 — 시간으로 세면 다중 속성
 * 전이가 속성마다 슬롯 둘을 갖게 되어 허수 지연이 쏟아진다(R35 함정 2).
 * 리터럴만 세면 duration 자리가 토큰인 `animation: ... ${loop.base} linear 0.5s`가
 * "시간 슬롯 하나"로 보여 지연을 놓친다(R35 함정 1).
 */
const TIME_SLOT =
  /animation\.(?:duration|loop)\.\w+|animation\.easing\.\w+|(?<![\w.])(?:\d+(?:\.\d+)?|\.\d+)(?:ms|s)(?![\w-])/g;

/**
 * 리터럴 이징. 긴 것 우선 교대라 `ease-in-out`이 `ease` 하나로 잘리지 않고
 * (함정 3), 앞의 `(?<![\w.-])`가 `themeContract...easing.linear`를 걸러내며
 * (함정 2), 뒤의 `(?![\w-])`가 `linear-gradient`를 걸러낸다(함정 1).
 */
const LITERAL_EASING =
  /(?<![\w.-])(?:cubic-bezier\([^)]*\)|steps\([^)]*\)|linear\([^)]*\)|ease-in-out|ease-in|ease-out|ease|step-start|step-end|linear)(?![\w-])/g;

function analyze(
  file: string,
  property: string,
  line: number,
  value: string
): MotionDecl {
  const lineAt = (offset: number): number =>
    line + (value.slice(0, offset).match(/\n/g)?.length ?? 0);

  const segments = splitSegments(value).map(({ text, offset }) => {
    const slots: Slot[] = [];
    for (const match of text.matchAll(TIME_SLOT)) {
      if (match[0].startsWith('animation.easing.')) continue;
      slots.push({
        kind: match[0].startsWith('animation.') ? 'token' : 'literal',
        text: match[0],
        line: lineAt(offset + (match.index ?? 0)),
      });
    }
    return {
      text,
      property: /^([-\w]+)/.exec(text.trim())?.[1] ?? '',
      line: lineAt(offset + (text.length - text.trimStart().length)),
      slots,
    };
  });

  return { file: rel(file), property, line, value, segments };
}

/** `.css.ts` 한 파일의 모션 선언 전부. 값이 리터럴이 아니면 `opaque`에 남는다. */
function declarationsOf(file: string): {
  decls: MotionDecl[];
  opaque: string[];
} {
  const lines = readFileSync(file, 'utf-8').split(/\r?\n/);
  const decls: MotionDecl[] = [];
  const opaque: string[] = [];
  lines.forEach((line, index) => {
    const match = MOTION_DECLARATION.exec(line);
    if (!match) return;
    const property = `${match[1]}${match[2] ?? ''}`;
    const value = readLiteral(match[3], lines, index);
    if (value === null) {
      if (needsLiteral(property)) opaque.push(`${rel(file)}:${index + 1}`);
      return;
    }
    if (value === '' || value === 'none') return;
    decls.push(analyze(file, property, index + 1, value));
  });
  return { decls, opaque };
}

/** `.tsx`/`.ts`의 인라인 모션 대입. `''`·`'none'`은 되돌리기라 값이 아니다. */
function inlineDeclarationsOf(file: string): MotionDecl[] {
  const lines = readFileSync(file, 'utf-8').split(/\r?\n/);
  const decls: MotionDecl[] = [];
  lines.forEach((text, index) => {
    for (const match of text.matchAll(INLINE_ASSIGNMENT)) {
      const value = match[4];
      if (value === '' || value === 'none') continue;
      decls.push(
        analyze(file, `${match[1]}${match[2] ?? ''}`, index + 1, value)
      );
    }
  });
  return decls;
}

/**
 * 맹점 1 — JSX 인라인 스타일 객체: `style={{ transition: '...' }}`.
 *
 * 카멜케이스 `속성: '문자열'` 문법이 `.css.ts`의 `style()`과 같아서 `MOTION_DECLARATION`을
 * 그대로 재사용한다. `style={{`로 여는 객체 리터럴 **안으로 스캔을 좁혀서**, 스타일과 무관한
 * 객체 리터럴에 우연히 `transition` 같은 키가 있어도 잡지 않게 한다 — `balancedFrom`으로
 * 중괄호 짝을 맞춰 블록을 떼어낸다(전이 목록 판정 단위 자르기에 쓰는 것과 같은 함수).
 *
 * `file`은 `readFileSync`를 하지 않고 텍스트를 직접 받는다 — 테스트가 소스 파일을 새로
 * 만들지 않고 문자열 픽스처를 바로 먹일 수 있어야 하기 때문이다.
 */
/** `style={{...}}` 블록들을 (시작 줄, 블록 내부 줄 배열)로 자른다. `jsxStyleDeclarationsFrom`과
 * `CROWDED_LINES` 확장(F1)이 같은 블록 경계를 써야 서로 어긋나지 않는다. */
function jsxStyleBlocksOf(
  text: string
): { startLine: number; lines: string[] }[] {
  const blocks: { startLine: number; lines: string[] }[] = [];
  for (const open of text.matchAll(/style=\{\{/g)) {
    const openIndex = (open.index ?? 0) + open[0].length - 2;
    const block = balancedFrom(text, openIndex);
    blocks.push({
      startLine: text.slice(0, openIndex).split(/\r?\n/).length,
      lines: block.split(/\r?\n/),
    });
  }
  return blocks;
}

function jsxStyleDeclarationsFrom(
  file: string,
  text: string
): { decls: MotionDecl[]; opaque: string[] } {
  const decls: MotionDecl[] = [];
  const opaque: string[] = [];
  for (const { startLine, lines: blockLines } of jsxStyleBlocksOf(text)) {
    blockLines.forEach((line, i) => {
      const match = MOTION_DECLARATION.exec(line);
      if (!match) return;
      const property = `${match[1]}${match[2] ?? ''}`;
      const value = readLiteral(match[3], blockLines, i);
      if (value === null) {
        // F2 — declarationsOf와 같은 판단: 리터럴이 아니면 opaque로 밀어 넣는다.
        // 안 그러면 transition·animation처럼 값이 안 보이면 가드가 완전히 눈머는
        // 속성이 조용히 사라진다(SegmentedButtons.tsx:218 · Slider.tsx:158류).
        if (needsLiteral(property))
          opaque.push(`${rel(file)}:${startLine + i}`);
        return;
      }
      if (value === '' || value === 'none') return;
      decls.push(analyze(file, property, startLine + i, value));
    });
  }
  return { decls, opaque };
}
function jsxStyleDeclarationsOf(file: string): {
  decls: MotionDecl[];
  opaque: string[];
} {
  return jsxStyleDeclarationsFrom(file, readFileSync(file, 'utf-8'));
}

/** F1 — JSX `style={{...}}` 블록 안에서 붐비는 줄(모션 선언 2개 이상)을 찾는다.
 * `jsxStyleDeclarationsFrom`도 `declarationsOf`처럼 줄마다 `exec`를 한 번만 불러
 * 둘째 선언을 조용히 놓친다 — `.css.ts` 쪽 `CROWDED_LINES`가 이미 막아 둔 결함과
 * 같다. 줄 안에서 매치를 반복하는 대신 붐비는 줄 자체를 막는 쪽으로 가드를 맞춘다. */
function crowdedJsxLinesFrom(file: string, text: string): string[] {
  const found: string[] = [];
  for (const { startLine, lines: blockLines } of jsxStyleBlocksOf(text)) {
    blockLines.forEach((line, i) => {
      if ([...line.matchAll(MOTION_KEYWORD)].length >= 2) {
        found.push(`${rel(file)}:${startLine + i}`);
      }
    });
  }
  return found;
}

/** 맹점 2 — `setProperty`의 케밥케이스 속성명을 정규화해 읽는다. */
function setPropertyDeclarationsFrom(file: string, text: string): MotionDecl[] {
  const decls: MotionDecl[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    // F4 — prettier가 두 인자를 각각 제 줄에 놓으면(여는 줄 · 속성 줄 · 값 줄) 한 줄
    // 전용 정규식이 못 잡는다. 다음 두 줄까지 묶은 창으로 본다 — `\s*`가 이미 개행을
    // 삼키므로 정규식은 그대로 두고 검사할 텍스트만 넓힌다. offset→줄 맵은 안 만든다:
    // 이 줄(index)에서 "시작하는" 매치만 세어 다음 반복에서 같은 호출이 또 잡히는
    // 것을 막는다.
    const window = [line, lines[index + 1], lines[index + 2]]
      .filter((l): l is string => l !== undefined)
      .join('\n');
    for (const match of window.matchAll(INLINE_SET_PROPERTY)) {
      if ((match.index ?? 0) >= line.length) continue;
      const property = toCamelProperty(match[2]);
      if (!MOTION_PROPERTY.test(property)) continue;
      const value = match[4];
      if (value === '' || value === 'none') continue;
      decls.push(analyze(file, property, index + 1, value));
    }
  });
  return decls;
}
function setPropertyDeclarationsOf(file: string): MotionDecl[] {
  return setPropertyDeclarationsFrom(file, readFileSync(file, 'utf-8'));
}

/** 맹점 3 — `cssText` 문자열 하나에 든 선언들을 `;`로 갈라 각각 읽는다. */
function cssTextDeclarationsFrom(file: string, text: string): MotionDecl[] {
  const decls: MotionDecl[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const match of line.matchAll(INLINE_CSS_TEXT)) {
      for (const piece of match[2].split(';')) {
        const found = /^\s*([\w-]+)\s*:\s*(.+?)\s*$/.exec(piece);
        if (!found) continue;
        const property = toCamelProperty(found[1]);
        if (!MOTION_PROPERTY.test(property)) continue;
        const value = found[2];
        if (value === '' || value === 'none') continue;
        decls.push(analyze(file, property, index + 1, value));
      }
    }
  });
  return decls;
}
function cssTextDeclarationsOf(file: string): MotionDecl[] {
  return cssTextDeclarationsFrom(file, readFileSync(file, 'utf-8'));
}

/**
 * 한 줄에 모션 선언이 둘 이상인 자리. `declarationsOf`는 줄마다 `exec`를 한 번만
 * 불러 **둘째를 통째로 놓친다** — prettier가 한 줄로 유지하는
 * `style({ transition: 'opacity 1s ease', animationDelay: '1s' })`가 그 모양이다.
 * 값 파싱 경계가 복잡해 `matchAll`로 바꾸는 대신 그런 줄 자체를 막는다.
 */
const CROWDED_LINES = [
  ...CSS_FILES.flatMap((file) =>
    readFileSync(file, 'utf-8')
      .split(/\r?\n/)
      .flatMap((line, index) =>
        [...line.matchAll(MOTION_KEYWORD)].length >= 2
          ? [`${rel(file)}:${index + 1}`]
          : []
      )
  ),
  // F1 — JSX style={{...}} 블록도 같은 결함을 가진다. CSS_FILES와 별개 소스라
  // 따로 순회한다.
  ...INLINE_FILES.flatMap((file) =>
    crowdedJsxLinesFrom(file, readFileSync(file, 'utf-8'))
  ),
];

const SCANNED = CSS_FILES.map(declarationsOf);
const CSS_DECLS = SCANNED.flatMap((scan) => scan.decls);
const JSX_SCANNED = INLINE_FILES.map((file) => jsxStyleDeclarationsOf(file));
const INLINE_DECLS = INLINE_FILES.flatMap((file, i) => [
  ...inlineDeclarationsOf(file),
  ...JSX_SCANNED[i].decls,
  ...setPropertyDeclarationsOf(file),
  ...cssTextDeclarationsOf(file),
]);
// F2 — JSX 스캐너의 opaque 결과도 .css.ts 쪽과 합쳐 "값을 읽을 수 있다" 단언이
// 전체 소스를 덮게 한다.
const OPAQUE_DECLS = [
  ...SCANNED.flatMap((scan) => scan.opaque),
  ...JSX_SCANNED.flatMap((scan) => scan.opaque),
];
const ALL_DECLS = [...CSS_DECLS, ...INLINE_DECLS];

/** 선언 안의 리터럴 이징을 줄 단위로 집어낸다. */
function literalEasingsOf(decl: MotionDecl): { line: number; text: string }[] {
  const lineAt = (offset: number): number =>
    decl.line + (decl.value.slice(0, offset).match(/\n/g)?.length ?? 0);
  return [...decl.value.matchAll(LITERAL_EASING)].map((match) => ({
    line: lineAt(match.index ?? 0),
    text: match[0],
  }));
}

/**
 * 할 일 3 — 허용목록 키를 `file:line`에서 `file` + 값 다중집합으로 바꾼다.
 *
 * 줄번호를 키에 넣으면 파일 위쪽에 import 한 줄만 늘어도 그 아래 모든 항목의 줄번호가
 * 밀려 허용목록을 다시 키잉해야 한다(M1에서 세 번 겪었다). 키를 파일로만 좁히고, 값
 * 비교를 순서 무관 다중집합(정렬한 배열)으로 하면 줄 위치가 안 걸린다.
 *
 * **대가**: 같은 파일 안에서 이미 허용된 값과 *정확히 같은* 리터럴이 하나 더 생기면
 * 개수가 늘어 다중집합 비교에 걸리지만, **한 줄을 지우고 다른 줄에 같은 값을 그대로
 * 옮겨 적은 변경**은 다중집합이 그대로라 조용히 통과한다. 같은 파일 안에서 값들이
 * 선언 사이를 서로 바꿔 앉는 변경도 통과한다(다중집합이 같으므로) — `reason`이 어느
 * 선언을 가리키는지는 기계가 보증하지 않는다. 그 좁은 틈을 재키잉
 * 반복(M1에서 3회, T3까지 포함하면 4회 확정)과 맞바꾼 것이고, 세 총량 단언(23·38·10)이
 * 총량이 몰래 느는 것까지는 막는다.
 */
function sortValues(map: Record<string, string[]>): Record<string, string[]> {
  for (const file of Object.keys(map)) map[file].sort();
  return map;
}

/** `at`(= 파일 경로) → 값 다중집합(정렬 완료). */
function groupByFile(
  entries: { file: string; text: string }[]
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const entry of entries) {
    (grouped[entry.file] ??= []).push(entry.text);
  }
  return sortValues(grouped);
}

/** 같은 파일을 가리키는 여러 `Exception` 항목의 `values`를 파일 단위로 합쳐 다중집합을
 * 만든다. `owner`·`reason`은 항목마다 그대로 둔다 — 합치는 건 비교용 값 목록뿐이다. */
function expectedMap(
  exceptions: { at: string; values: string[] }[]
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const e of exceptions) {
    (grouped[e.at] ??= []).push(...e.values);
  }
  return sortValues(grouped);
}

// ---------------------------------------------------------------------------
// 허용 목록 — 항목마다 이유와 소유 마일스톤을 적는다
// ---------------------------------------------------------------------------

interface Exception {
  /** `src` 기준 상대 경로. 줄번호는 없다 — 넣으면 위쪽 줄 하나만 늘어도 항목 전체가 다시 키잉된다(할 일 3). */
  at: string;
  values: string[];
  /** 이 예외를 없앨 책임이 있는 마일스톤. `-`는 영구 예외 */
  owner: string;
  reason: string;
}

/**
 * 리터럴 이징 11줄 20건 4파일(`.css.ts`) + 인라인 2줄 2건(`.tsx`).
 * BoardRow·Card·Chip은 M2 T3가, Loader·LoadingSpinner·Skeleton은 M2 T3c가
 * 갚아 토큰으로 옮겨져 이 목록에서 빠졌다.
 *
 * **여기서 토큰으로 바꾸지 않는다.** `cubic-bezier(0.4, 0, 0.2, 1)`(Material
 * 표준 곡선)을 `settle`(`power3.out`)로 바꾸는 건 감각이 달라지는 모션 설계
 * 결정이고, 컴포넌트별 모션 설계는 M2(Tier-A CSS 모션) 소관이다. 이 파일은
 * 잠그는 장치라 가드와 가드 대상이 같은 커밋에 들어가면 독립 리뷰가 없다.
 */
const LITERAL_EASING_EXCEPTIONS: Exception[] = [
  {
    at: 'components/Avatar/Avatar.css.ts',
    values: ['ease', 'ease'],
    owner: 'M2',
    reason: 'AvatarGroup 오버플로 버튼의 filter·transform 전이 곡선',
  },
  {
    at: 'components/NumericSpinner/NumericSpinner.css.ts',
    values: ['ease-in-out', 'ease-in-out', 'ease-in-out'],
    owner: 'M2',
    reason: '컨테이너 focus·error halo 전이 곡선',
  },
  {
    at: 'components/NumericSpinner/NumericSpinner.css.ts',
    values: ['ease', 'ease'],
    owner: 'M2',
    reason:
      '색 전이 곡선 — transform은 M3 T3d에서 GSAP(채널 A·B)로 옮겨 여기서 빠졌다',
  },
  {
    at: 'components/NumericSpinner/NumericSpinner.css.ts',
    values: ['ease-in-out', 'ease-in-out'],
    owner: 'M2',
    reason:
      '스텝 버튼 2속성 전이 곡선 — transform은 M3 T3d에서 GSAP(채널 A)로 옮겨 3속성에서 줄었다',
  },
  {
    at: 'components/SegmentedButtons/SegmentedButtons.css.ts',
    values: ['ease'],
    owner: 'M2',
    reason: '인디케이터 box-shadow 곡선',
  },
  {
    at: 'components/SegmentedButtons/SegmentedButtons.css.ts',
    values: ['ease', 'ease'],
    owner: 'M2',
    reason: '세그먼트 라벨 색·transform 전이 곡선',
  },
  {
    at: 'components/SegmentedButtons/SegmentedButtons.css.ts',
    values: ['ease', 'ease'],
    owner: 'M2',
    reason: '선택된 세그먼트 transform·text-shadow 전이 곡선',
  },
  {
    at: 'components/Slider/Slider.css.ts',
    values: ['ease-out'],
    owner: 'M2',
    reason: 'fill 추종 곡선. Task 4가 :87-89에 근거 주석을 남겼다',
  },
];

/** 리터럴 **duration**. 지연은 아래 목록이 따로 맡는다. */
const LITERAL_DURATION_EXCEPTIONS: Exception[] = [
  {
    at: 'components/Slider/Slider.css.ts',
    values: ['0.05s'],
    owner: '-',
    reason:
      '드래그 중 fill이 thumb를 프레임 단위로 따라붙게 하는 의도된 값이다. 가장 짧은 duration 토큰(fast 150ms)도 세 프레임 늦는다',
  },
];

/**
 * 리터럴 **지연**. 지연은 전이 속도가 아니라 한 컴포넌트 고유 연출의 내부
 * 타이밍이라 duration 토큰의 대상이 아니다 — 대신 토큰의 배수로 적는다.
 */
const LITERAL_DELAY_EXCEPTIONS: Exception[] = [
  {
    at: 'components/IconButton/IconButton.css.ts',
    values: ['40ms'],
    owner: '-',
    reason:
      '아이콘이 몸통보다 늦게 따라오는 지연. stagger 토큰이 없어 리터럴로 적는다',
  },
  {
    at: 'components/LoadingSpinner/LoadingSpinner.css.ts',
    values: ['0s'],
    owner: '-',
    reason: '점 스태거 1번. duration.base(200ms) × 0',
  },
  {
    at: 'components/LoadingSpinner/LoadingSpinner.css.ts',
    values: ['0.2s'],
    owner: '-',
    reason: '점 스태거 2번. duration.base(200ms) × 1',
  },
  {
    at: 'components/LoadingSpinner/LoadingSpinner.css.ts',
    values: ['0.4s'],
    owner: '-',
    reason: '점 스태거 3번. duration.base(200ms) × 2',
  },
  {
    at: 'components/Skeleton/Skeleton.css.ts',
    values: ['0.5s'],
    owner: '-',
    reason: 'wave 시작 지연. duration.slower(500ms)와 같은 값',
  },
  {
    at: 'components/Skeleton/Skeleton.css.ts',
    values: ['0.5s'],
    owner: '-',
    reason: 'pulse 시작 지연. duration.slower(500ms)와 같은 값',
  },
];

/**
 * 인라인 메커니즘(DOM 대입 · JSX `style={{}}` · `setProperty` · `cssText`)으로 건
 * transition·animation 허용 목록. 지금은 비어 있다 — M2의 경계 정의가 프레임워크가
 * 아니라 메커니즘이고, 런타임에 인라인으로 박는 모션이 그 경계 자체라 M2 소관
 * 파일에서는 0이 맞는 목표다(F7). M3의 GSAP 런타임이 여기에 항목을 추가한다.
 */
const INLINE_MECHANISM_EXCEPTIONS: Exception[] = [];

/**
 * 저장소 소비자가 0인 채로 살려 두는 easing 토큰과 그 소유 마일스톤.
 *
 * `linear`·`drift` 둘 다 M2 T3c가 갚아 빠졌다: `linear`는 `LoadingSpinner`
 * 회전이 토큰으로, `drift`는 `Loader`·`LoadingSpinner`(점 페이드)·`Skeleton`
 * (pulse·wave)의 자율 루프가 공유 자산 `loopRhythmEasing`을 거쳐 소비한다
 * — 지금은 소유자를 적어 둘 예외가 없어 빈 객체다.
 */
const EASING_OWNERS: Record<string, string> = {};

// ---------------------------------------------------------------------------
// 1. 전이 목록 (T3)
// ---------------------------------------------------------------------------

/** 합성·페인트로 끝나는 속성. 이 밖은 레이아웃을 건드리므로 근거가 필요하다. */
const TRANSITION_WHITELIST = new Set([
  'transform',
  'opacity',
  'filter',
  'color',
  'background-color',
  'border-color',
  'box-shadow',
  'text-shadow',
]);

/**
 * 할 일 2 — 근거 주석 술어가 여러 줄 블록을 읽게 한다.
 *
 * 선언 바로 윗줄 한 줄만 보면 여러 줄 근거 주석은 속성 이름이 **마지막 줄**에 있어야만
 * 통과한다(M1에서 BoardRow·SegmentedButtons 주석 문구를 내용이 아니라 줄 배치 때문에
 * 고쳐야 했던 이유). 연속된 주석 줄을 블록으로 모아 그 안 어디에 속성 이름이 있어도
 * 통과시킨다.
 */

/** 상한 8줄 — 근거 설명 서너 문장은 다 들어가는 길이다. 상한이 없으면 선언과 무관한
 * 윗 블록(예: 다른 속성 설명, 파일 머리말)의 주석까지 우연히 함께 딸려 들어와 "무관한
 * 주석이 우연히 그 자리에 있다는 이유만으로 면제"가 되는 문을 다시 여는 셈이다. */
const MAX_JUSTIFICATION_COMMENT_LINES = 8;

/** `//`·블록 주석 시작(`/*`)은 항상 주석 줄이다. `*`로 시작하는 줄(JSDoc 본문·블록을
 * 닫는 델리미터)은 실제 블록 주석 안(`inBlock`)에 있을 때만 주석으로 친다 — 아니면
 * `*`로 우연히 시작하는 코드 줄이 블록을 뛰어넘어 위의 무관한 주석을 끌어온다(F6). */
function isCommentLine(line: string, inBlock: boolean): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*/') ||
    (inBlock && trimmed.startsWith('*'))
  );
}

/**
 * `declLine`(1-based) 바로 위에서 시작해 연속된 주석 줄을 위로 모은다. 빈 줄이나 코드
 * 줄에서 끊기고, `MAX_JUSTIFICATION_COMMENT_LINES`에서도 끊는다.
 */
function commentBlockAbove(source: string[], declLine: number): string[] {
  const block: string[] = [];
  let inBlock = false; // `*/`를 만나 블록 안으로 들어왔는지 (F6)
  let i = declLine - 2; // declLine 직전 줄의 0-based 인덱스
  while (i >= 0 && block.length < MAX_JUSTIFICATION_COMMENT_LINES) {
    const line = source[i] ?? '';
    const trimmed = line.trim();
    if (!isCommentLine(line, inBlock)) break;
    if (trimmed.startsWith('/*')) inBlock = false;
    else if (trimmed.startsWith('*/')) inBlock = true;
    block.unshift(trimmed);
    i -= 1;
  }
  return block;
}

/** 상태 선택자 키(`':hover'` · `'&:focus-visible'` · `'&[data-x]'`). */
const STATE_SELECTOR = /'&?[:[][^']*'\s*:\s*\{/g;

/**
 * 파일을 최상위 선언 단위로 자른다. `export const x = style({...})` 하나가 한 덩이,
 * 최상위 `globalStyle(...)`도 한 덩이다.
 *
 * **판정 단위가 파일이면 안 된다.** 같은 파일의 다른 블록은 대개 다른 요소라,
 * 파일 단위로 보면 무관한 블록의 box-shadow 전이 하나가 진짜 회귀를 덮는다.
 */
function blocksOf(source: string): {
  name: string;
  start: number;
  end: number;
  text: string;
}[] {
  const lines = source.split(/\r?\n/);
  const heads: { name: string; index: number }[] = [];
  lines.forEach((line, index) => {
    const match = /^(?:export\s+)?const\s+(\w+)\s*=|^(globalStyle)\(/.exec(
      line
    );
    if (match) heads.push({ name: match[1] ?? match[2], index });
  });
  return heads.map((head, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].index : lines.length;
    return {
      name: head.name,
      start: head.index + 1,
      end,
      text: lines.slice(head.index, end).join('\n'),
    };
  });
}

function balancedFrom(text: string, openIndex: number): string {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(openIndex, i + 1);
    }
  }
  return text.slice(openIndex);
}

describe('전이 목록 잠금 (T3)', () => {
  it('모션 선언이 전부 리터럴이라 스캐너가 값을 읽을 수 있다', () => {
    // 값이 변수면 스캐너가 볼 수 없다. 오늘은 0건이고, 생기면 여기서 막힌다 —
    // 검사가 조용히 빈손이 되는 경로를 미리 닫는다.
    expect(OPAQUE_DECLS).toEqual([]);
  });

  it('한 줄에 모션 선언이 둘 이상인 자리가 없다', () => {
    // 스캐너가 줄마다 첫 선언만 읽어 둘째가 검사에서 통째로 빠진다. 걸리면
    // 스캐너를 고치는 게 아니라 선언을 여러 줄로 나눈다.
    expect(CROWDED_LINES).toEqual([]);
  });

  it("transition의 속성에 'all'이 없다", () => {
    // T3이 18군데를 속성 목록으로 좁혔다. 오늘 이미 0건이라 빈손이 정상이다.
    const found = ALL_DECLS.filter((d) => listsProperties(d.property)).flatMap(
      (d) =>
        d.segments
          .filter((s) => s.property === 'all')
          .map((s) => `${d.file}:${s.line}`)
    );
    expect(found).toEqual([]);
  });

  it('화이트리스트 밖 속성을 전이하면 선언 위 근거 주석 블록에 그 속성 이름이 있다', () => {
    // 블록 안 아무 줄에 있기만 하면 통과시키면 `// 크기 변형` 같은 무관한 주석이 우연히
    // 근처에 있는 것만으로 면제가 될 수 있다. 주석이 **그 속성 이름을 포함**할 것을
    // 요구해 우연 통과를 막는다 — 위치는 블록 안 어디든 상관없다(할 일 2).
    const missing: string[] = [];
    for (const decl of ALL_DECLS) {
      if (!listsProperties(decl.property)) continue;
      const source = readFileSync(resolve(SRC, decl.file), 'utf-8').split(
        /\r?\n/
      );
      const block = commentBlockAbove(source, decl.line);
      for (const segment of decl.segments) {
        if (segment.property === '' || segment.property === 'none') continue;
        if (TRANSITION_WHITELIST.has(segment.property)) continue;
        if (block.some((line) => line.includes(segment.property))) continue;
        missing.push(`${decl.file}:${segment.line} (${segment.property})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('자기 전이를 가진 블록이 상태에서 boxShadow를 바꾸면 그 목록에 box-shadow가 있다', () => {
    // TextField.css.ts:38(T3), NumericSpinner.css.ts:13 컨테이너(d03c209),
    // NumericSpinner.css.ts:64 input(63a2b53)에 box-shadow를 넣은 이유다.
    // 빠지면 focus·error halo가 페이드 없이 툭 튄다.
    //
    // 자기 전이가 없는 블록은 판정에서 뺀다. vanilla-extract는 별개 `style()`
    // 블록을 같은 요소에 합성하므로(`TextField.css.ts`의 `error`가 `input` 위에
    // 얹힌다), 그런 블록의 전이는 소스의 다른 어딘가에 있고 어느 블록인지
    // 텍스트만으로는 못 가린다. 판정하면 규칙을 지킨 코드가 빨개진다.
    //
    // 한계 둘: (1) box-shadow만 본다 — 상태가 바꾸는 다른 속성이 목록에서
    // 빠지는 경우는 보증하지 않는다(전이 목록 전체 대조는 변형마다 속성이
    // 갈려 오탐이 쏟아진다). (2) 합성으로만 전이를 받는 블록은 위 이유로
    // 사각이다.
    const missing: string[] = [];
    for (const file of CSS_FILES) {
      const source = readFileSync(file, 'utf-8');
      const decls = declarationsOf(file).decls;
      for (const block of blocksOf(source)) {
        const own = decls.filter(
          (d) =>
            d.line >= block.start &&
            d.line <= block.end &&
            listsProperties(d.property)
        );
        if (own.length === 0) continue;
        const stateSetsShadow = [...block.text.matchAll(STATE_SELECTOR)].some(
          (match) =>
            /\bboxShadow\s*:/.test(
              balancedFrom(block.text, (match.index ?? 0) + match[0].length - 1)
            )
        );
        if (!stateSetsShadow) continue;
        const listsShadow = own.some((d) =>
          d.segments.some((s) => s.property === 'box-shadow')
        );
        if (!listsShadow) {
          missing.push(`${rel(file)}:${block.start} (${block.name})`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('스캐너 맹점 셋 (할 일 1)', () => {
  // 반증 입력 — 소스 파일이 아니라 문자열 픽스처다. 저장소에는 오늘 0건이라 ALL_DECLS만
  // 보면 스캐너가 진짜 물리는지 정규식이 컴파일만 되고 노는지 구분이 안 된다(M1이 놓친
  // transition-property 초기값 `all`처럼). 수집 함수에 직접 먹여 빈손이 아님을 본다.
  const FIXTURE_FILE = resolve(SRC, 'components/__Fixture__/Fixture.tsx');

  it('맹점 1 — JSX 인라인 스타일 `style={{ transition: "..." }}`을 읽는다', () => {
    const fixture = [
      'function Fixture() {',
      '  return (',
      '    <div',
      '      style={{',
      "        transition: 'opacity 0.2s ease',",
      "        transitionDelay: '0.1s',",
      '      }}',
      '    />',
      '  );',
      '}',
    ].join('\n');
    const { decls } = jsxStyleDeclarationsFrom(FIXTURE_FILE, fixture);
    expect(decls).not.toEqual([]);
    expect(decls.map((d) => `${d.line}:${d.property}=${d.value}`)).toEqual([
      '5:transition=opacity 0.2s ease',
      '6:transitionDelay=0.1s',
    ]);
    // 무관한 객체의 `transition` 키는 style={{}} 밖이라 잡히면 안 된다(과탐 방지, F5).
    // `style={{ opacity: 1 }}` 블록과 무관한 `{ transition: ... }` 객체를 같이 둬야
    // balancedFrom의 범위 한정이 실제로 일한다는 증거가 된다 — 무관한 객체가
    // 스타일 블록 뒤에 있어서, 범위가 안 끊기면 그 transition까지 딸려 들어온다.
    const outside = jsxStyleDeclarationsFrom(
      FIXTURE_FILE,
      [
        '<div style={{ opacity: 1 }} />;',
        "const config = { transition: 'not-a-style' };",
      ].join('\n')
    ).decls;
    expect(outside).toEqual([]);
  });

  it('F1 — 한 줄에 모션 선언이 둘인 JSX style 줄은 CROWDED_LINES가 잡는다', () => {
    // 실측(리뷰): `<div style={{ transitionDuration: '0.2s', transitionDelay: '0.1s' }} />`
    // 한 줄이면 jsxStyleDeclarationsFrom이 줄마다 exec를 한 번만 불러 transitionDelay를
    // 조용히 놓친다. CROWDED_LINES를 INLINE_FILES까지 확장해 이 줄 자체를 막는다 — 줄
    // 안에서 매치를 반복하는 대신 .css.ts에 이미 있는 같은 판단을 따른다.
    const fixture =
      "<div style={{ transitionDuration: '0.2s', transitionDelay: '0.1s' }} />";
    expect(crowdedJsxLinesFrom(FIXTURE_FILE, fixture)).not.toEqual([]);
  });

  it('F2 — 리터럴이 아닌 JSX style 값은 사라지지 않고 opaque로 잡힌다', () => {
    // declarationsOf(.css.ts 쪽)와 같은 판단: transition·animation 값이 식별자면
    // 스캐너가 못 읽는다 — 조용히 버리지 않고 opaque로 밀어 넣어야 "값을 읽을 수
    // 있다" 단언이 이 경로도 덮는다. SegmentedButtons.tsx:218·Slider.tsx:158류.
    const fixture = '<div style={{ transition: motionValue }} />';
    const { decls, opaque } = jsxStyleDeclarationsFrom(FIXTURE_FILE, fixture);
    expect(decls).toEqual([]);
    expect(opaque).not.toEqual([]);
  });

  it("맹점 2 — `element.style.setProperty('kebab-case', ...)`을 읽고 카멜케이스로 정규화한다", () => {
    const fixture =
      "el.style.setProperty('transition-timing-function', 'ease-in-out');";
    const decls = setPropertyDeclarationsFrom(FIXTURE_FILE, fixture);
    expect(decls).not.toEqual([]);
    // .css.ts 쪽 MOTION_DECLARATION이 만드는 것과 같은 카멜케이스 모양이어야 화이트리스트·
    // 허용목록 검사가 그대로 먹힌다.
    expect(decls[0].property).toBe('transitionTimingFunction');
    expect(decls[0].value).toBe('ease-in-out');
  });

  it('F4 — prettier가 인자를 줄마다 쪼갠 setProperty도 읽는다', () => {
    // 실측: 2개짜리 문자열 인자는 폭을 넘으면 prettier가 여는 줄·속성 줄·값 줄로
    // 반드시 쪼갠다(한 줄 hug 없음) — 80자를 넘는 setProperty 호출은 도달 가능하다.
    const fixture = [
      'ref.current.style.setProperty(',
      "  'transition-timing-function',",
      "  'ease-in-out'",
      ');',
    ].join('\n');
    const decls = setPropertyDeclarationsFrom(FIXTURE_FILE, fixture);
    expect(decls).not.toEqual([]);
    expect(decls[0].property).toBe('transitionTimingFunction');
    expect(decls[0].value).toBe('ease-in-out');
  });

  it('맹점 3 — `element.style.cssText = "..."`에 든 선언 여러 개를 각각 읽는다', () => {
    const fixture =
      "el.style.cssText = 'transition: transform 0.2s ease; color: red; animation-delay: 0.3s;';";
    const decls = cssTextDeclarationsFrom(FIXTURE_FILE, fixture);
    expect(decls).not.toEqual([]);
    // `color`는 이 가드의 대상이 아니라 빠지고, transition·animationDelay만 남는다.
    expect(decls.map((d) => `${d.property}=${d.value}`)).toEqual([
      'transition=transform 0.2s ease',
      'animationDelay=0.3s',
    ]);
  });

  it('F4 — `cssText += "..."`도 읽는다', () => {
    // `+=`는 cssText를 정상적으로 건드리는 방법이고, 한 글자 차이로 맹점 3
    // 작업 전체를 우회한다.
    const fixture = "el.style.cssText += 'transition: all 1s ease';";
    const decls = cssTextDeclarationsFrom(FIXTURE_FILE, fixture);
    expect(decls).not.toEqual([]);
  });

  it('저장소 실측: 인라인 메커니즘 3종이 허용 목록과 정확히 일치한다 (F7)', () => {
    // 반증(위)은 정규식이 물린다는 증거고, 이 단언은 "저장소에 인라인 메커니즘으로
    // 건 전이가 있다면 전부 허용 목록에 올라 있다"는 브리프의 전제를 잠근다 —
    // 오늘은 목록이 비어 있어 사실상 0건 게이트와 같지만, 등록된 항목은 통과한다
    // (`INLINE_ASSIGNMENT` 경로의 `BottomSheet.tsx`가 그 선례다). 누가 새로 이
    // 패턴을 등록 없이 쓰기 시작하면 여기서 걸린다.
    const real = INLINE_FILES.flatMap((file) => [
      ...jsxStyleDeclarationsOf(file).decls,
      ...setPropertyDeclarationsOf(file),
      ...cssTextDeclarationsOf(file),
    ]);
    expect(
      groupByFile(real.map((d) => ({ file: d.file, text: d.value })))
    ).toEqual(expectedMap(INLINE_MECHANISM_EXCEPTIONS));
  });
});

describe('근거 주석 블록 (할 일 2)', () => {
  it('여러 줄 주석 블록 — 속성 이름이 마지막 줄이 아니어도 블록에 있으면 잡힌다', () => {
    const fixture = [
      '  // width 전이 근거 — 이 줄에 속성 이름이 있다',
      '  // 아래는 나머지 설명 문장이고 여기엔 속성 이름이 없다',
      "  transition: 'width 0.2s ease',",
    ];
    const block = commentBlockAbove(fixture, 3);
    expect(block).not.toEqual([]);
    expect(block.some((line) => line.includes('width'))).toBe(true);
  });

  it('JSDoc(` * `) 줄도 주석으로 센다', () => {
    const fixture = [
      '  /**',
      '   * width 전이 근거',
      '   */',
      "  transition: 'width 0.2s ease',",
    ];
    const block = commentBlockAbove(fixture, 4);
    expect(block.some((line) => line.includes('width'))).toBe(true);
  });

  it('빈 줄에서 블록이 끊긴다 — 그 위 무관한 주석까지 딸려 들어오지 않는다', () => {
    const fixture = [
      '  // width — 이 무관한 주석은 안 이어져야 한다',
      '',
      '  // color 전이 근거',
      "  transition: 'width 0.2s ease',",
    ];
    const block = commentBlockAbove(fixture, 4);
    expect(block.some((line) => line.includes('width'))).toBe(false);
  });

  it('블록 밖의 `*` 코드 줄은 주석으로 안 세진다 (F6)', () => {
    // 실측(리뷰): `*notAComment,`는 실제 블록 주석 안이 아닌데 `*`로 시작한다는
    // 이유만으로 주석 취급되면, 블록이 이 코드 줄을 뛰어넘어 위의 무관한 주석까지
    // 끌어온다. 고친 뒤에는 이 줄에서 바로 끊겨 블록이 비어야 한다.
    const fixture = [
      '  // width 근거',
      '  *notAComment,',
      "  transition: 'width 0.2s ease',",
    ];
    const block = commentBlockAbove(fixture, 3);
    expect(block).toEqual([]);
  });

  it(`상한 ${MAX_JUSTIFICATION_COMMENT_LINES}줄 — 그보다 위 주석은 블록에 안 들어온다`, () => {
    // 상한 줄 수만큼 무관한 주석을 쌓고, 그 위에 속성 이름이 있는 주석을 하나 더 둔다.
    const filler = Array.from(
      { length: MAX_JUSTIFICATION_COMMENT_LINES },
      (_, i) => `  // 무관한 설명 ${i}`
    );
    const fixture = [
      '  // width 전이 근거 — 상한 밖이라 안 잡혀야 한다',
      ...filler,
      "  transition: 'width 0.2s ease',",
    ];
    const declLine = fixture.length; // transition 줄(1-based)
    const block = commentBlockAbove(fixture, declLine);
    expect(block).toHaveLength(MAX_JUSTIFICATION_COMMENT_LINES);
    expect(block.some((line) => line.includes('width'))).toBe(false);
  });
});

describe('허용목록 키 = 파일 + 다중집합 (할 일 3)', () => {
  it('같은 파일 안에서 값이 다른 줄로 옮겨가도(줄번호 변화) 통과한다', () => {
    // 예전 `file:line` 키였다면 줄이 바뀌는 순간 키가 안 맞아 실패했다.
    const exceptions = [
      {
        at: 'components/Fixture/Fixture.css.ts',
        values: ['ease'],
        owner: 'M2',
        reason: 'a',
      },
      {
        at: 'components/Fixture/Fixture.css.ts',
        values: ['ease-in-out'],
        owner: 'M2',
        reason: 'b',
      },
    ];
    // 실측: 두 값이 예전과 다른 줄에서 나왔다고 가정 — 파일과 다중집합만 같다.
    const found = [
      { file: 'components/Fixture/Fixture.css.ts', text: 'ease-in-out' },
      { file: 'components/Fixture/Fixture.css.ts', text: 'ease' },
    ];
    expect(groupByFile(found)).toEqual(expectedMap(exceptions));
  });

  it('대가: 같은 값이 하나 더 생기면(개수 증가) 다중집합 비교가 잡아낸다', () => {
    const exceptions = [
      {
        at: 'components/Fixture/Fixture.css.ts',
        values: ['ease'],
        owner: 'M2',
        reason: 'a',
      },
    ];
    const found = [
      { file: 'components/Fixture/Fixture.css.ts', text: 'ease' },
      { file: 'components/Fixture/Fixture.css.ts', text: 'ease' }, // 새로 하나 더 생겼다
    ];
    expect(groupByFile(found)).not.toEqual(expectedMap(exceptions));
  });
});

// ---------------------------------------------------------------------------
// 2. 하드코딩 시간 (T5 · R35)
// ---------------------------------------------------------------------------

/**
 * 시간 슬롯을 duration과 delay로 가른다.
 * - 롱핸드 `*Delay` → 전부 지연, 롱핸드 `*Duration` → 전부 duration
 * - 단축 `transition`·`animation` → 구간별로 첫 슬롯이 duration, 둘째가 지연
 */
function timeSlots(): {
  durations: { file: string; line: number; text: string }[];
  delays: { file: string; line: number; text: string }[];
  surplus: string[];
} {
  const durations: { file: string; line: number; text: string }[] = [];
  const delays: { file: string; line: number; text: string }[] = [];
  const surplus: string[] = [];
  for (const decl of ALL_DECLS) {
    const forced = decl.property.endsWith('Delay')
      ? 'delay'
      : decl.property.endsWith('Duration')
        ? 'duration'
        : null;
    for (const segment of decl.segments) {
      segment.slots.forEach((slot, index) => {
        if (slot.kind !== 'literal') return;
        const role = forced ?? (index === 0 ? 'duration' : 'delay');
        if (forced === null && index > 1) {
          surplus.push(`${decl.file}:${slot.line} (${slot.text})`);
          return;
        }
        (role === 'delay' ? delays : durations).push({
          file: decl.file,
          line: slot.line,
          text: slot.text,
        });
      });
    }
  }
  return { durations, delays, surplus };
}

describe('하드코딩 시간 잠금 (T5 · R35)', () => {
  const { durations, delays, surplus } = timeSlots();

  it('단축 속성 한 구간에 시간 슬롯이 셋 이상인 자리가 없다', () => {
    // 셋째 슬롯은 CSS에 자리가 없다. 나오면 스캐너의 구간 나누기가 틀린 것이다.
    expect(surplus).toEqual([]);
  });

  it('리터럴 duration이 허용 목록과 정확히 일치한다', () => {
    expect(groupByFile(durations)).toEqual(
      expectedMap(LITERAL_DURATION_EXCEPTIONS)
    );
  });

  it('리터럴 지연 6건을 정확히 집어낸다 (IconButton 1 + LoadingSpinner 3 + Skeleton 2)', () => {
    expect(groupByFile(delays)).toEqual(expectedMap(LITERAL_DELAY_EXCEPTIONS));
    expect(delays).toHaveLength(6);
  });

  it('허용 목록의 모든 항목에 이유가 적혀 있다', () => {
    const blank = [
      ...LITERAL_DURATION_EXCEPTIONS,
      ...LITERAL_DELAY_EXCEPTIONS,
      ...LITERAL_EASING_EXCEPTIONS,
    ]
      .filter((e) => e.reason.trim() === '' || e.owner.trim() === '')
      .map((e) => e.at);
    expect(blank).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. 리터럴 이징 (T8 · R32)
// ---------------------------------------------------------------------------

describe('리터럴 이징 잠금 (T8 · R32)', () => {
  const cssEasings = CSS_DECLS.flatMap((decl) =>
    literalEasingsOf(decl).map((hit) => ({ file: decl.file, ...hit }))
  );
  const inlineEasings = INLINE_DECLS.flatMap((decl) =>
    literalEasingsOf(decl).map((hit) => ({ file: decl.file, ...hit }))
  );

  it('리터럴 이징이 허용 목록과 정확히 일치한다', () => {
    expect(groupByFile([...cssEasings, ...inlineEasings])).toEqual(
      expectedMap(LITERAL_EASING_EXCEPTIONS)
    );
  });

  it('.css.ts 쪽 실측이 11줄 20건 4파일이다', () => {
    expect(new Set(cssEasings.map((e) => `${e.file}:${e.line}`)).size).toBe(11);
    expect(cssEasings).toHaveLength(20);
    expect(new Set(cssEasings.map((e) => e.file)).size).toBe(4);
  });

  it('.tsx 인라인 모션 대입까지 읽는다 (R39)', () => {
    expect(inlineEasings.map((e) => `${e.file}:${e.line}`)).toEqual([]);
  });

  it('여러 줄 템플릿 리터럴의 :31·:32·:33을 세 검사 모두가 잡는다 (함정 4)', () => {
    const file = 'components/SegmentedButtons/SegmentedButtons.css.ts';
    const decl = CSS_DECLS.find((d) => d.file === file && d.line === 30);
    expect(decl, ':30에서 시작하는 전이 선언을 찾지 못했다').toBeDefined();

    // (1) 속성 추출 — transition: all 검사와 화이트리스트 검사가 쓰는 값
    expect(decl?.segments.map((s) => `${s.line}:${s.property}`)).toEqual([
      '31:transform',
      '32:width',
      '33:box-shadow',
    ]);
    // (2) 시간 슬롯 — duration 검사가 쓰는 값. 세 줄 모두 토큰 참조다
    expect(
      decl?.segments.flatMap((s) => s.slots.map((t) => `${t.line}:${t.kind}`))
    ).toEqual(['31:token', '32:token', '33:token']);
    // (3) 리터럴 이징
    expect(
      literalEasingsOf(decl as MotionDecl).map((h) => `${h.line}:${h.text}`)
    ).toEqual([
      '31:cubic-bezier(0.25, 1, 0.5, 1)',
      '32:cubic-bezier(0.25, 1, 0.5, 1)',
      '33:ease',
    ]);
  });
});

/**
 * 리뷰 F6 — `declarationsOf`의 눈먼 자리. `transitionTimingFunction:
 * themeContract.animation.easing.snap` 같은 줄은 값이 토큰 참조라(리터럴이
 * 아님) `needsLiteral(property)`가 false를 돌려주고(정상이다 — 토큰 참조가
 * 이 롱핸드의 맞는 모양이다), `ALL_DECLS`에도 `opaque`에도 남지 않는다. 이
 * 배치(T3a)가 막 채택한 idiom이 정확히 이 모양이라, 위 `it`의
 * `decl.property !== 'transition'` 분기는 여기 한 번도 걸리지 않고 죽어
 * 있었다 — bare 롱핸드가 애초에 `ALL_DECLS`까지 오지 않기 때문이다.
 *
 * bare 오버라이드는 자기 규칙이 `transition-property`를 선언하지 않고 같은
 * 선택자(또는 상위 규칙)의 `transition:` 단축에서 물려받는다. 물려받는
 * 목록에 `transform` 아닌 속성(box-shadow·opacity 등)이 있으면 snap/spring이
 * 거기에도 샌다 — Chip.css.ts의 옛 `selected`가 실사례였다(box-shadow까지
 * spring을 받았다). 소스 텍스트만으로는 "이 줄이 상속하는 transition-property
 * 목록"을 못 읽으므로, 여기 걸리는 모든 줄을 찾아 한 곳씩 손으로 안전을
 * 확인하고 `OVERSHOOT_TIMING_EXCEPTIONS`에 올린다 — 안 올라간 새 자리는 실패한다.
 */
const BARE_OVERSHOOT_TIMING_LINE =
  /(?<![\w.'"])transitionTimingFunction\s*:\s*themeContract\.animation\.easing\.(?:snap|spring)\b/;

function bareOvershootTimingOf(file: string): { file: string; line: number }[] {
  const lines = readFileSync(file, 'utf-8').split(/\r?\n/);
  const hits: { file: string; line: number }[] = [];
  lines.forEach((line, index) => {
    if (BARE_OVERSHOOT_TIMING_LINE.test(line)) {
      hits.push({ file: rel(file), line: index + 1 });
    }
  });
  return hits;
}

/** `.css.ts`와 인라인(`.tsx`/`.ts`) 양쪽을 다 스캔한다 — ALL_DECLS와 같은 범위. */
const BARE_OVERSHOOT_TIMING = [...CSS_FILES, ...INLINE_FILES].flatMap(
  bareOvershootTimingOf
);

/** `line`을 키에 넣는 이유는 위 `Exception`과 다르다 — bare 롱핸드 자리는 값
 * 다중집합으로 서로 바꿔 앉을 수 있는 항목이 아니라, 한 자리 한 자리가
 * "상속하는 transition-property 목록이 transform 하나뿐"임을 개별로 확인해야
 * 하는 지점이라 위치 자체가 곧 그 확인의 대상이다. */
interface OvershootException {
  at: string;
  line: number;
  owner: string;
  reason: string;
}

/**
 * 손으로 확인한 안전한 bare 오버라이드 2곳(F6 스캔 결과 전부) — 둘 다 자기
 * own 규칙이 단일 속성(`transform`) transition만 선언하는 `::before`
 * globalStyle이라, bare `transitionTimingFunction`이 상속할 수 있는 속성이
 * transform 하나뿐이다. 새 자리가 여기 없이 생기면 위 `it`이 실패한다.
 */
const OVERSHOOT_TIMING_EXCEPTIONS: OvershootException[] = [
  {
    at: 'components/BoardRow/BoardRow.css.ts',
    line: 42,
    owner: '-',
    reason:
      '`${rowExpanded}::before` 진입 — boardRow base의 ::before(BoardRow.css.ts:28)가 ' +
      'transform 단일 속성 transition만 선언해 bare snap이 샐 다른 속성이 없다.',
  },
  {
    at: 'components/Chip/Chip.css.ts',
    line: 223,
    owner: '-',
    reason:
      '`${selected}::before` 진입 — chip base의 ::before(Chip.css.ts:43)가 transform ' +
      '단일 속성 transition만 선언해 bare spring이 샐 다른 속성이 없다.',
  },
];

// ---------------------------------------------------------------------------
// 4. 오버슈트 이징 (R46)
// ---------------------------------------------------------------------------

describe('오버슈트 이징 경계 (R46)', () => {
  it('snap·spring은 transform 전이에만 걸린다', () => {
    // 오늘 소비자가 0이라 진공으로 통과하는 게 정상이다. M2가 둘을 쓰기
    // 시작할 때를 위해 미리 세워 두는 가드다.
    const OVERSHOOT = /animation\.easing\.(?:snap|spring)/;
    const violations: string[] = [];
    for (const decl of ALL_DECLS) {
      if (!OVERSHOOT.test(decl.value)) continue;
      if (decl.property !== 'transition') {
        // transition 밖(animation 단축·타이밍 롱핸드·인라인 대입)은 어느 속성에
        // 걸리는지 소스 텍스트만으로 못 가린다. 조용히 통과시키지 않고 막는다.
        violations.push(
          `${decl.file}:${decl.line} (${decl.property} — 검사 확장 필요)`
        );
        continue;
      }
      for (const segment of decl.segments) {
        if (!OVERSHOOT.test(segment.text)) continue;
        if (segment.property !== 'transform') {
          violations.push(`${decl.file}:${segment.line} (${segment.property})`);
        }
      }
    }
    // 리뷰 F6 — bare 롱핸드(transitionTimingFunction만 있고 transition 단축이
    // 없는 줄)는 위 ALL_DECLS 루프에 아예 들어오지 않는다. 별도로 찾은
    // BARE_OVERSHOOT_TIMING을 허용 목록과 대조해 같은 violations에 합류시킨다.
    for (const hit of BARE_OVERSHOOT_TIMING) {
      const allowed = OVERSHOOT_TIMING_EXCEPTIONS.some(
        (e) => e.at === hit.file && e.line === hit.line
      );
      if (!allowed) {
        violations.push(
          `${hit.file}:${hit.line} (bare transitionTimingFunction — 허용 목록에 없음)`
        );
      }
    }
    expect(violations).toEqual([]);
  });

  it('bare 오버슈트 타이밍 허용 목록이 실제 소스와 정확히 일치한다', () => {
    // 목록에 있는데 소스에서 사라진 항목(예: 전체 transition으로 다시 적어
    // 더는 bare가 아니게 된 경우)도 놓치지 않는다 — 목록이 저절로 줄지 않으면
    // 다음 사람이 "이미 정리됐다"고 오해한다(위 Exception 관례와 동일 이유).
    for (const e of OVERSHOOT_TIMING_EXCEPTIONS) {
      const stillThere = BARE_OVERSHOOT_TIMING.some(
        (hit) => hit.file === e.at && hit.line === e.line
      );
      expect(
        stillThere,
        `${e.at}:${e.line}가 더는 bare 오버라이드가 아니다 — 허용 목록에서 빼라`
      ).toBe(true);
    }
    // 허용 목록에 없는 새 항목이 몰래 늘어도(중복 등으로 개수만 늘고 각 항목은
    // 위 존재 확인을 통과하는 경우) 총량으로 잡는다.
    expect(BARE_OVERSHOOT_TIMING).toHaveLength(
      OVERSHOOT_TIMING_EXCEPTIONS.length
    );
  });
});

// ---------------------------------------------------------------------------
// 5. easing 토큰 소유자
// ---------------------------------------------------------------------------

const SRC_FILES = findFiles(
  SRC,
  (name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)
);

/** 토큰 정의 파일과 테스트를 뺀 저장소 소비자 수 */
function consumerCount(pattern: RegExp): number {
  return SRC_FILES.filter(
    (file) =>
      file !== resolve(__dirname, 'animation.css.ts') &&
      pattern.test(readFileSync(file, 'utf-8'))
  ).length;
}

describe('easing 토큰 소유자 (R5)', () => {
  it('export된 easing 토큰마다 저장소 소비자 또는 소유 마일스톤이 있다', () => {
    // easing 토큰은 `easing` 객체의 키라서 src/index.ts의 이름 있는 export가
    // 아니다 — 공개 표면이라는 이유로 면제되지 않는다. 소비자 0으로 남아 있던
    // 옛 `easeIn`이 바로 소유자 없는 토큰이었다.
    const orphans = Object.keys(easing).filter(
      (name) =>
        consumerCount(new RegExp(`easing\\.${name}\\b`)) === 0 &&
        !(name in EASING_OWNERS)
    );
    expect(orphans).toEqual([]);
  });

  it('허용 목록에 오른 토큰은 실재하고 아직 소비자가 0이다', () => {
    // M2의 이징 완결 신호: linear·drift 둘 다 M2 T3c가 소비자를 만들어
    // 목록에서 지웠다(LoadingSpinner 회전 → linear, Skeleton·Loader
    // 루프 커브 → drift). 지금 목록이 빈 게 우연이 아니라는 걸 여기서
    // 단언해 둔다 — 이 줄이 깨지면 누군가 목록을 다시 채운 것이고, 그건
    // 정리가 아니라 결정이니 이유를 남겨야 한다. M3가 새 토큰을 등록하며
    // 다시 채우면 이 단언부터 고쳐야 하고, 그 순간 아래 루프가 다시
    // 쓸모를 갖는다(지금은 목록이 비어 루프 본문이 0번 돈다).
    expect(EASING_OWNERS).toEqual({});

    // 소비자가 생겼는데 목록에 남아 있으면 목록이 낡은 것이다.
    for (const name of Object.keys(EASING_OWNERS)) {
      expect(name in easing, `easing.${name}이 토큰에 없다`).toBe(true);
      expect(consumerCount(new RegExp(`easing\\.${name}\\b`)), name).toBe(0);
    }
  });

  it('Task 5 모션 API가 배럴을 타고 공개 표면까지 실제로 이어져 있다 (R30)', () => {
    // 규칙은 "소비자 0이면 실패"가 아니라 "저장소 안 소비자가 0인데
    // src/index.ts로도 안 나가고 허용 목록에도 없으면 실패"다. 이 구분이
    // 빠지면 검사가 정상적인 발행 API(Task 5 산출물)를 결함으로 신고한다.
    const barrel = readFileSync(resolve(SRC, 'index.ts'), 'utf-8');
    const hooks = readFileSync(resolve(SRC, 'hooks/index.ts'), 'utf-8');
    expect(barrel).toContain("export * from './hooks'");
    for (const name of ['useReducedMotion', 'gateMotion']) {
      expect(hooks).toContain(`./${name}`);
    }
    // settleMotion·MotionAnimation은 gateMotion.ts가 같이 내보낸다.
    const gate = readFileSync(resolve(SRC, 'hooks/gateMotion.ts'), 'utf-8');
    for (const name of ['settleMotion', 'MotionAnimation']) {
      expect(gate).toMatch(new RegExp(`export (const|interface) ${name}\\b`));
    }
  });
});

// ---------------------------------------------------------------------------
// 6. reduce 전역 규칙 (T7 · R35)
// ---------------------------------------------------------------------------

describe('reduce 전역 규칙이 duration과 delay 양쪽을 덮는다 (T7 · R35)', () => {
  it('animation/transition의 duration·delay 네 속성이 모두 있다', () => {
    // R35 고유의 delay 커버리지는 theme.reducedMotion.test.ts가 값까지 잠근다.
    // 여기서는 경계 명세가 요구하는 네 속성이 빠짐없이 있는지만 본다.
    const theme = readFileSync(resolve(__dirname, 'theme.css.ts'), 'utf-8');
    for (const property of [
      'animationDuration',
      'animationDelay',
      'transitionDuration',
      'transitionDelay',
    ]) {
      expect(theme, `전역 reduce 규칙에 ${property}가 없다`).toMatch(
        new RegExp(`${property}: '-?0\\.01ms !important'`)
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 7. GSAP 번들 경계 (R37)
// ---------------------------------------------------------------------------
//
// M3부터 경계가 옮겨간다 — "gsap을 아예 안 들인다"가 아니라 "gsap/all(전체
// 배럴)을 안 들인다"로 반전됐다(계획서 T1). 코어(`from 'gsap'`)와 개별 플러그인
// 경로(`from 'gsap/Flip'` 등)는 이제 허용된다. tree-shaking이 먹는 건 개별
// 경로뿐이라 `gsap/all` import 금지만 남긴다.

/** `gsap/all` 전체 배럴만 잡는다. 코어와 개별 플러그인 경로는 이 정규식에 안 걸린다. */
const GSAP_ALL_IMPORT =
  /(?:\bfrom\s*['"]gsap\/all['"]|\brequire\(\s*['"]gsap\/all['"]\s*\)|\bimport\(\s*['"]gsap\/all['"]\s*\))/;

describe('GSAP 번들 경계 (R37)', () => {
  it('src의 gsap import가 gsap/all을 쓰지 않는다 (코어·개별 플러그인 경로만 허용)', () => {
    // scripts/build-easing.mjs는 빌드 타임 생성기라 대상이 아니다 —
    // 산출물(animation.css.ts)만 커밋되고 번들에는 들어가지 않는다.
    const importers = SRC_FILES.filter((file) =>
      GSAP_ALL_IMPORT.test(readFileSync(file, 'utf-8'))
    ).map(rel);
    expect(importers).toEqual([]);
  });

  it('빌드 산출물에 gsap/all import/require가 없다', () => {
    // dist는 .gitignore 대상이라 빌드 전에는 없다. 없으면 src 검사가 같은
    // 보증을 이미 들고 있으므로 건너뛰되, 있으면 반드시 검사한다.
    if (!existsSync(DIST)) return;
    const built = findFiles(DIST, (name) =>
      /\.(mjs|cjs|js|d\.ts)$/.test(name)
    ).filter((file) => GSAP_ALL_IMPORT.test(readFileSync(file, 'utf-8')));
    expect(built.map((file) => relative(DIST, file))).toEqual([]);
  });

  it('package.json의 dependencies에 gsap이 있고 devDependencies·peerDependencies에는 없다', () => {
    const pkg: unknown = JSON.parse(
      readFileSync(resolve(CORE_ROOT, 'package.json'), 'utf-8')
    );
    const section = (name: string): string[] => {
      const value = (pkg as Record<string, unknown>)[name];
      return typeof value === 'object' && value !== null
        ? Object.keys(value as Record<string, unknown>)
        : [];
    };
    // gsap은 이제 런타임 의존성이다 — 컴포넌트가 직접 import해서 쓴다.
    expect(section('dependencies')).toContain('gsap');
    expect(section('devDependencies')).not.toContain('gsap');
    expect(section('peerDependencies')).not.toContain('gsap');
  });

  it('주석에 적힌 gsap/all 문자열은 이 검사에 걸리지 않는다 (반증)', () => {
    // 순진한 `grep -ri "gsap/all" dist`였다면 실패할 자리다. import 기준 검사는
    // 통과한다 — 검사가 옳은 걸 보고 있다는 증거를 테스트 안에 남긴다.
    const gate = readFileSync(resolve(SRC, 'hooks/gateMotion.ts'), 'utf-8');
    expect(gate).toContain('gsap/all');
    expect(GSAP_ALL_IMPORT.test(gate)).toBe(false);
  });
});
