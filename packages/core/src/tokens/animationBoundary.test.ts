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
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, it, expect } from 'vitest';
import { easing } from './animation.css';

const CORE_ROOT = resolve(__dirname, '../..');
const SRC = resolve(CORE_ROOT, 'src');
const COMPONENTS = resolve(SRC, 'components');
const DIST = resolve(CORE_ROOT, 'dist');

/** `src` 기준 posix 상대 경로. 허용 목록 키가 OS마다 달라지지 않게 한다. */
function rel(path: string): string {
  return relative(SRC, path).split(sep).join('/');
}

function findFiles(dir: string, accept: (name: string) => boolean): string[] {
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

/** `.tsx`/`.ts`가 인라인 스타일로 거는 모션 대입 (R39). */
const INLINE_ASSIGNMENT =
  /\.style\.(transition|animation)(Delay|Duration|Property|TimingFunction)?\s*=\s*(['"`])([^'"`]*)\3/g;

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

const SCANNED = CSS_FILES.map(declarationsOf);
const CSS_DECLS = SCANNED.flatMap((scan) => scan.decls);
const OPAQUE_DECLS = SCANNED.flatMap((scan) => scan.opaque);
const INLINE_DECLS = INLINE_FILES.flatMap(inlineDeclarationsOf);
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

/** `at`(= `파일:줄`) → 값 목록. 허용 목록과 같은 모양으로 맞춘다. */
function groupByLocation(
  entries: { file: string; line: number; text: string }[]
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const entry of entries) {
    const at = `${entry.file}:${entry.line}`;
    (grouped[at] ??= []).push(entry.text);
  }
  return grouped;
}

function expectedMap(
  exceptions: { at: string; values: string[] }[]
): Record<string, string[]> {
  return Object.fromEntries(exceptions.map((e) => [e.at, e.values]));
}

// ---------------------------------------------------------------------------
// 허용 목록 — 항목마다 이유와 소유 마일스톤을 적는다
// ---------------------------------------------------------------------------

interface Exception {
  /** `src` 기준 상대 경로 + 줄번호 */
  at: string;
  values: string[];
  /** 이 예외를 없앨 책임이 있는 마일스톤. `-`는 영구 예외 */
  owner: string;
  reason: string;
}

/**
 * 리터럴 이징 23줄 38건 10파일(`.css.ts`) + 인라인 2줄 2건(`.tsx`).
 *
 * **여기서 토큰으로 바꾸지 않는다.** `cubic-bezier(0.4, 0, 0.2, 1)`(Material
 * 표준 곡선)을 `settle`(`power3.out`)로 바꾸는 건 감각이 달라지는 모션 설계
 * 결정이고, 컴포넌트별 모션 설계는 M2(Tier-A CSS 모션) 소관이다. 이 파일은
 * 잠그는 장치라 가드와 가드 대상이 같은 커밋에 들어가면 독립 리뷰가 없다.
 */
const LITERAL_EASING_EXCEPTIONS: Exception[] = [
  {
    at: 'components/Avatar/Avatar.css.ts:106',
    values: ['ease', 'ease'],
    owner: 'M2',
    reason: 'AvatarGroup 오버플로 버튼의 filter·transform 전이 곡선',
  },
  {
    at: 'components/BoardRow/BoardRow.css.ts:41',
    values: ['ease'],
    owner: 'M2',
    reason: '행 hover 배경색 전이 곡선',
  },
  {
    at: 'components/BoardRow/BoardRow.css.ts:70',
    values: ['ease'],
    owner: 'M2',
    reason: '펼침 셰브론 회전 전이 곡선',
  },
  {
    at: 'components/BoardRow/BoardRow.css.ts:84',
    values: ['ease-in-out'],
    owner: 'M2',
    reason: 'grid-template-rows 0fr→1fr 펼침 곡선',
  },
  {
    at: 'components/Card/Card.css.ts:12',
    values: ['ease', 'ease', 'ease'],
    owner: 'M2',
    reason: '카드 기본 전이 3속성 곡선',
  },
  {
    at: 'components/Card/Card.css.ts:35',
    values: [
      'cubic-bezier(0.4, 0, 0.2, 1)',
      'cubic-bezier(0.4, 0, 0.2, 1)',
      'cubic-bezier(0.4, 0, 0.2, 1)',
    ],
    owner: 'M2',
    reason:
      'outlined 변형의 Material 표준 곡선. settle로 바꾸면 감각이 달라진다',
  },
  {
    at: 'components/Chip/Chip.css.ts:18',
    values: ['ease', 'ease', 'ease'],
    owner: 'M2',
    reason: '칩 기본 전이 3속성 곡선',
  },
  {
    at: 'components/Chip/Chip.css.ts:202',
    values: ['ease'],
    owner: 'M2',
    reason: '삭제 버튼 opacity 전이 곡선',
  },
  {
    at: 'components/Loader/Loader.css.ts:73',
    values: ['cubic-bezier(0.4, 0, 0.2, 1)'],
    owner: 'M2',
    reason: 'indeterminate 바의 Material 표준 진행 곡선',
  },
  {
    at: 'components/LoadingSpinner/LoadingSpinner.css.ts:32',
    values: ['linear'],
    owner: 'M2',
    reason: '회전은 등속이어야 한다. easing.linear 토큰으로 옮길 후보',
  },
  {
    at: 'components/LoadingSpinner/LoadingSpinner.css.ts:47',
    values: ['ease-in-out'],
    owner: 'M2',
    reason: '점 페이드 왕복 곡선',
  },
  {
    at: 'components/NumericSpinner/NumericSpinner.css.ts:13',
    values: ['ease-in-out', 'ease-in-out', 'ease-in-out'],
    owner: 'M2',
    reason: '컨테이너 focus·error halo 전이 곡선',
  },
  {
    at: 'components/NumericSpinner/NumericSpinner.css.ts:64',
    values: ['cubic-bezier(0.25, 0.8, 0.5, 1)', 'ease', 'ease'],
    owner: 'M2',
    reason: '버튼 눌림 transform 곡선 + 색 전이 곡선',
  },
  {
    at: 'components/NumericSpinner/NumericSpinner.css.ts:68',
    values: ['cubic-bezier(0.25, 0.8, 0.25, 1)'],
    owner: 'M2',
    reason: 'clickPulse 키프레임 곡선',
  },
  {
    at: 'components/NumericSpinner/NumericSpinner.css.ts:122',
    values: ['ease-in-out', 'ease-in-out', 'ease-in-out'],
    owner: 'M2',
    reason: '스텝 버튼 3속성 전이 곡선',
  },
  {
    at: 'components/SegmentedButtons/SegmentedButtons.css.ts:31',
    values: ['cubic-bezier(0.25, 1, 0.5, 1)'],
    owner: 'M2',
    reason: '인디케이터 transform 곡선',
  },
  {
    at: 'components/SegmentedButtons/SegmentedButtons.css.ts:32',
    values: ['cubic-bezier(0.25, 1, 0.5, 1)'],
    owner: 'M2',
    reason: '인디케이터 width 곡선',
  },
  {
    at: 'components/SegmentedButtons/SegmentedButtons.css.ts:33',
    values: ['ease'],
    owner: 'M2',
    reason: '인디케이터 box-shadow 곡선',
  },
  {
    at: 'components/SegmentedButtons/SegmentedButtons.css.ts:77',
    values: ['ease', 'ease'],
    owner: 'M2',
    reason: '세그먼트 라벨 색·transform 전이 곡선',
  },
  {
    at: 'components/SegmentedButtons/SegmentedButtons.css.ts:93',
    values: ['ease', 'ease'],
    owner: 'M2',
    reason: '선택된 세그먼트 transform·text-shadow 전이 곡선',
  },
  {
    at: 'components/Skeleton/Skeleton.css.ts:80',
    values: ['linear'],
    owner: 'M2',
    reason: 'wave 훑기는 등속이어야 한다. easing.linear 토큰으로 옮길 후보',
  },
  {
    at: 'components/Skeleton/Skeleton.css.ts:85',
    values: ['ease-in-out'],
    owner: 'M2',
    reason: 'pulse 왕복 곡선',
  },
  {
    at: 'components/Slider/Slider.css.ts:86',
    values: ['ease-out'],
    owner: 'M2',
    reason: 'fill 추종 곡선. Task 4가 :83-85에 근거 주석을 남겼다',
  },
  {
    at: 'components/BottomSheet/BottomSheet.tsx:158',
    values: ['ease-out'],
    owner: 'M2',
    reason:
      '드래그 놓음 복귀 모션. 곡선·길이를 정하는 건 컴포넌트별 모션 설계라 M2 소관이다 (R39)',
  },
  {
    at: 'components/BottomSheet/BottomSheet.tsx:185',
    values: ['ease-out'],
    owner: 'M2',
    reason:
      '드래그 닫힘 모션. 곡선·길이를 정하는 건 컴포넌트별 모션 설계라 M2 소관이다 (R39)',
  },
];

/** 리터럴 **duration**. 지연은 아래 목록이 따로 맡는다. */
const LITERAL_DURATION_EXCEPTIONS: Exception[] = [
  {
    at: 'components/Slider/Slider.css.ts:86',
    values: ['0.05s'],
    owner: '-',
    reason:
      '드래그 중 fill이 thumb를 프레임 단위로 따라붙게 하는 의도된 값이다. 가장 짧은 duration 토큰(fast 150ms)도 세 프레임 늦는다',
  },
  {
    at: 'components/BottomSheet/BottomSheet.tsx:158',
    values: ['0.2s'],
    owner: 'M2',
    reason: '드래그 놓음 복귀 길이. duration.base(200ms)와 같은 값이다 (R39)',
  },
  {
    at: 'components/BottomSheet/BottomSheet.tsx:185',
    values: ['0.2s'],
    owner: 'M2',
    reason: '드래그 닫힘 길이. duration.base(200ms)와 같은 값이다 (R39)',
  },
];

/**
 * 리터럴 **지연**. 지연은 전이 속도가 아니라 한 컴포넌트 고유 연출의 내부
 * 타이밍이라 duration 토큰의 대상이 아니다 — 대신 토큰의 배수로 적는다.
 */
const LITERAL_DELAY_EXCEPTIONS: Exception[] = [
  {
    at: 'components/LoadingSpinner/LoadingSpinner.css.ts:77',
    values: ['0s'],
    owner: '-',
    reason: '점 스태거 1번. duration.base(200ms) × 0',
  },
  {
    at: 'components/LoadingSpinner/LoadingSpinner.css.ts:78',
    values: ['0.2s'],
    owner: '-',
    reason: '점 스태거 2번. duration.base(200ms) × 1',
  },
  {
    at: 'components/LoadingSpinner/LoadingSpinner.css.ts:79',
    values: ['0.4s'],
    owner: '-',
    reason: '점 스태거 3번. duration.base(200ms) × 2',
  },
  {
    at: 'components/Skeleton/Skeleton.css.ts:80',
    values: ['0.5s'],
    owner: '-',
    reason: 'wave 시작 지연. duration.slower(500ms)와 같은 값',
  },
  {
    at: 'components/Skeleton/Skeleton.css.ts:85',
    values: ['0.5s'],
    owner: '-',
    reason: 'pulse 시작 지연. duration.slower(500ms)와 같은 값',
  },
];

/**
 * 저장소 소비자가 0인 채로 살려 두는 easing 토큰과 그 소유 마일스톤.
 *
 * `linear`는 R46이 예고하지 않은 세 번째 항목이다(실측으로 찾았다). 쓰일 자리
 * 둘(`LoadingSpinner.css.ts:32` 회전, `Skeleton.css.ts:80` wave)이 아직 리터럴
 * `linear` 키워드를 쓰고 있어서 토큰 쪽 소비자가 0으로 남았다 — 그 둘도 M2
 * 소유로 리터럴 이징 허용 목록에 올라가 있으니 소유자는 같다.
 */
const EASING_OWNERS: Record<string, string> = {
  snap: 'M2 T3',
  spring: 'M2 T3',
  linear: 'M2',
};

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

  it('화이트리스트 밖 속성을 전이하면 직전 줄에 근거 주석이 있다', () => {
    const missing: string[] = [];
    for (const decl of ALL_DECLS) {
      if (!listsProperties(decl.property)) continue;
      const source = readFileSync(resolve(SRC, decl.file), 'utf-8').split(
        /\r?\n/
      );
      const previous = (source[decl.line - 2] ?? '').trim();
      for (const segment of decl.segments) {
        if (segment.property === '' || segment.property === 'none') continue;
        if (TRANSITION_WHITELIST.has(segment.property)) continue;
        if (previous.startsWith('//')) continue;
        missing.push(`${decl.file}:${segment.line} (${segment.property})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('자기 전이를 가진 블록이 상태에서 boxShadow를 바꾸면 그 목록에 box-shadow가 있다', () => {
    // T3이 TextField:38에, T4가 NumericSpinner:64에 box-shadow를 넣은 이유다.
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
    expect(groupByLocation(durations)).toEqual(
      expectedMap(LITERAL_DURATION_EXCEPTIONS)
    );
  });

  it('리터럴 지연 5건을 정확히 집어낸다 (LoadingSpinner 3 + Skeleton 2)', () => {
    expect(groupByLocation(delays)).toEqual(
      expectedMap(LITERAL_DELAY_EXCEPTIONS)
    );
    expect(delays).toHaveLength(5);
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
    expect(groupByLocation([...cssEasings, ...inlineEasings])).toEqual(
      expectedMap(LITERAL_EASING_EXCEPTIONS)
    );
  });

  it('.css.ts 쪽 실측이 23줄 38건 10파일이다', () => {
    expect(new Set(cssEasings.map((e) => `${e.file}:${e.line}`)).size).toBe(23);
    expect(cssEasings).toHaveLength(38);
    expect(new Set(cssEasings.map((e) => e.file)).size).toBe(10);
  });

  it('.tsx 인라인 모션 대입까지 읽는다 (R39)', () => {
    expect(inlineEasings.map((e) => `${e.file}:${e.line}`)).toEqual([
      'components/BottomSheet/BottomSheet.tsx:158',
      'components/BottomSheet/BottomSheet.tsx:185',
    ]);
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
    expect(violations).toEqual([]);
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

/** 런타임 참조만 본다. 주석·소스맵에 남는 글자는 번들도 의존성도 만들지 않는다. */
const GSAP_IMPORT =
  /(?:\bfrom\s*['"]gsap[^'"]*['"]|\brequire\(\s*['"]gsap[^'"]*['"]\s*\)|\bimport\(\s*['"]gsap[^'"]*['"]\s*\))/;

describe('GSAP 번들 경계 (R37)', () => {
  it('src의 발행 코드가 gsap을 값으로도 타입으로도 import하지 않는다', () => {
    // scripts/build-easing.mjs는 빌드 타임 생성기라 대상이 아니다 —
    // 산출물(animation.css.ts)만 커밋되고 번들에는 들어가지 않는다.
    const importers = SRC_FILES.filter((file) =>
      GSAP_IMPORT.test(readFileSync(file, 'utf-8'))
    ).map(rel);
    expect(importers).toEqual([]);
  });

  it('빌드 산출물에 gsap import/require가 없다', () => {
    // dist는 .gitignore 대상이라 빌드 전에는 없다. 없으면 src 검사가 같은
    // 보증을 이미 들고 있으므로 건너뛰되, 있으면 반드시 검사한다.
    if (!existsSync(DIST)) return;
    const built = findFiles(DIST, (name) =>
      /\.(mjs|cjs|js|d\.ts)$/.test(name)
    ).filter((file) => GSAP_IMPORT.test(readFileSync(file, 'utf-8')));
    expect(built.map((file) => relative(DIST, file))).toEqual([]);
  });

  it('package.json의 런타임 의존성에 gsap이 없다', () => {
    const pkg: unknown = JSON.parse(
      readFileSync(resolve(CORE_ROOT, 'package.json'), 'utf-8')
    );
    const section = (name: string): string[] => {
      const value = (pkg as Record<string, unknown>)[name];
      return typeof value === 'object' && value !== null
        ? Object.keys(value as Record<string, unknown>)
        : [];
    };
    expect(section('dependencies')).not.toContain('gsap');
    expect(section('peerDependencies')).not.toContain('gsap');
    // devDependency이긴 해야 한다 — 빌드 타임 생성기와 게이트 테스트가 쓴다.
    expect(section('devDependencies')).toContain('gsap');
  });

  it('주석에 적힌 엔진 이름은 이 검사에 걸리지 않는다 (반증)', () => {
    // 순진한 `grep -ri gsap dist`였다면 실패할 자리다. import 기준 검사는
    // 통과한다 — 검사가 옳은 걸 보고 있다는 증거를 테스트 안에 남긴다.
    const gate = readFileSync(resolve(SRC, 'hooks/gateMotion.ts'), 'utf-8');
    expect(gate).toContain('GSAP');
    expect(GSAP_IMPORT.test(gate)).toBe(false);
  });
});
