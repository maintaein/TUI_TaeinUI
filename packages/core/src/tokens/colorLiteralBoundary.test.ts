/**
 * 컴포넌트가 생 색 리터럴(`#hex`·`rgb()`·`rgba()`·`hsl()`·`hsla()`)을 들고 있지
 * 못하게 잠근다(M5 T-tok-b).
 *
 * 색은 테마 계약(`themeContract`)을 거쳐야 한 곳에서 바꿀 수 있다. 남은 리터럴은
 * 아래 `ALLOWED`에 이유와 함께 올리고 파일별 개수를 잠근다. 개수가 늘어도(새 리터럴)
 * 줄어도(고친 뒤 목록을 안 줄임) 빨개진다.
 *
 * 겹치는 검사와의 선: `tierAKeyframesReducedMotion.test.ts` 가드 7은 TIER_A 11개
 * `.css.ts`의 색 3채널(`color`·`background*`·`border*Color`) 선언만 0건으로 본다.
 * 여기는 컴포넌트 전체 `.css.ts`와 `.tsx`의 모든 자리(그림자 안의 색 포함)를 본다.
 * 가드 7이 보는 자리는 여기서도 0건이라 두 검사가 서로 어긋나지 않는다.
 * `paletteBoundary.test.ts`는 원본 import를, 이 파일은 리터럴을 막는다.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { SRC, rel, findFiles, stripComments } from '../test/sourceScan';

const COMPONENTS = resolve(SRC, 'components');

/** 가드 7의 RAW_COLOR와 같은 모양이되 대문자 함수(`RGB(`)도 잡는다. */
const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/gi;

// 소스만 본다. `.test.`는 기대값에 리터럴을 쓴다.
const FILES = findFiles(
  COMPONENTS,
  (name) =>
    (name.endsWith('.css.ts') || name.endsWith('.tsx')) &&
    !/\.test\.tsx?$/.test(name)
);

/** 주석을 걷어낸 소스에서 파일별로 리터럴이 놓인 줄 번호를 모은다. */
const found: Record<string, number[]> = {};
for (const file of FILES) {
  const lines = stripComments(readFileSync(file, 'utf-8')).split('\n');
  const hits = lines.flatMap((line, i) =>
    Array.from(line.matchAll(RAW_COLOR), () => i + 1)
  );
  if (hits.length > 0) found[rel(file)] = hits;
}

// 파일별 허용 개수와 이유. 개수는 줄 수가 아니라 리터럴 개수다. 토큰으로 바꿀 수
// 있게 되면(같은 값의 토큰이 생기면) 바꾸고 이 목록을 줄인다.
const ALLOWED: Record<string, { count: number; reason: string }> = {
  'components/Border/Border.css.ts': {
    count: 4,
    reason:
      'glowRing의 mask 알파 마스크 `#000`(두 gradient가 두 줄에 한 벌씩). 보이는 색이 아니라 알파만 쓴다',
  },
  'components/Card/Card.css.ts': {
    count: 3,
    reason:
      '그림자 안의 rgba(0,0,0,a) 셋(elevated 휴지·호버 리프트·누름). shadows.css.ts에 같은 값이 없다',
  },
  'components/Loader/Loader.tsx': {
    count: 1,
    reason:
      "spinner·dots 경로가 color preset 'white'을 원본 값 #FFFFFF로 푼다. bar·fuse 경로는 background.paper(#FAFAFA)라 다르고, 맞추면 색이 바뀌어 사용자 결정 전까지 둔다",
  },
  'components/SegmentedButtons/SegmentedButtons.css.ts': {
    count: 2,
    reason:
      '표시의 파란 drop-shadow rgba(0,102,255,.25)와 선택 글자 빛 rgba(255,255,255,.5). 같은 값의 토큰이 없다',
  },
  'components/Slider/Slider.css.ts': {
    count: 3,
    reason:
      '머리 그림자 세 단계(휴지·호버·누름)의 rgba(0,0,0,a). shadows.css.ts에 같은 값이 없다',
  },
  'components/Switch/Switch.css.ts': {
    count: 1,
    reason: '머리 그림자 rgba(0,0,0,.2). shadows.css.ts에 같은 값이 없다',
  },
};

describe('컴포넌트의 생 색 리터럴 경계 (T-tok-b)', () => {
  it('소스를 실제로 훑는다', () => {
    // 무엇을 뒤집으면 빨개지는가: 훑을 파일 필터가 깨지거나 컴포넌트 폴더가 옮겨져
    // 파일이 0개가 되면 아래 둘이 진공으로 초록이 된다. 실측 하한이다.
    expect(FILES.filter((f) => f.endsWith('.css.ts')).length).toBeGreaterThan(
      20
    );
    expect(FILES.filter((f) => f.endsWith('.tsx')).length).toBeGreaterThan(20);
    // 정규식이 실제로 색을 잡는지(허용 목록이 비어 보이는 사고를 막는다).
    expect(Object.keys(found).length).toBeGreaterThan(0);
  });

  it('허용 목록 밖의 컴포넌트 소스에 생 색 리터럴이 없다', () => {
    // 무엇을 뒤집으면 빨개지는가: 목록에 없는 `.css.ts`·`.tsx`에 `#fff`나
    // `rgba(...)`를 쓰면 `파일:줄`이 찍힌다. themeContract 토큰을 써라.
    const offenders = Object.entries(found)
      .filter(([file]) => !(file in ALLOWED))
      .map(([file, lines]) => `${file}:${lines.join(',')}`);
    expect(offenders).toEqual([]);
  });

  it('허용 목록의 파일별 개수가 실제와 같다', () => {
    // 무엇을 뒤집으면 빨개지는가: 목록 파일에 리터럴을 더하면(늘었다), 토큰으로
    // 바꾸거나 지우고 목록을 안 줄이면(줄었다) 빨개진다.
    const problems: string[] = [];
    for (const [file, { count }] of Object.entries(ALLOWED)) {
      const actual = found[file]?.length ?? 0;
      if (actual > count) {
        problems.push(
          `${file}: ${count}개 허용인데 ${actual}개다. 토큰을 쓰거나 이유를 달아 목록을 고쳐라`
        );
      } else if (actual < count) {
        problems.push(
          `${file}: ${count}개 허용인데 ${actual}개뿐이다. 목록을 줄여라`
        );
      }
    }
    expect(problems).toEqual([]);
  });

  it('허용 목록의 모든 항목에 이유가 있다', () => {
    const empty = Object.entries(ALLOWED)
      .filter(([, { reason }]) => reason.trim() === '')
      .map(([file]) => file);
    expect(empty).toEqual([]);
  });
});
