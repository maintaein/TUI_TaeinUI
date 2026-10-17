/**
 * 발행 문서(llms.txt · llms-full.txt)가 소스와 일치하는지 검사한다.
 *
 * 개선 요청 19번("llms.txt가 소스에서 생성되지 않음")의 근본 원인 처리.
 * 문서와 코드가 어긋나면 `pnpm test`가 깨지므로 별도 CI 설정이 필요 없다.
 * 문서를 갱신할 때는 `node scripts/update-llms.mjs`를 실행한다.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  renderTokenReference,
  renderTokenSummary,
  replaceSection,
  componentHeadings,
  contrastRatio,
  AA_TEXT,
  AA_UI,
} from './llmsSections';
import * as core from '../index';
import { themeTokens } from '../tokens/contract';

const ROOT = resolve(__dirname, '../..');
const FILES = {
  summary: resolve(ROOT, 'llms.txt'),
  full: resolve(ROOT, 'llms-full.txt'),
};

/** `UPDATE_DOCS=1`이면 검사 대신 문서를 다시 쓴다. */
const UPDATE = process.env.UPDATE_DOCS === '1';

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

/**
 * 최상위 컴포넌트 export. React 컴포넌트는 함수이거나 forwardRef/memo가 만든
 * 객체($$typeof를 가진다)이고, 이름은 PascalCase 한 덩어리다. 토큰 객체
 * (themeContract 등)와 타입은 여기 걸리지 않는다.
 */
function exportedComponentNames(): string[] {
  const registry: Record<string, unknown> = core;
  return Object.keys(registry)
    .filter((name) => /^[A-Z][A-Za-z]*$/.test(name))
    .filter((name) => {
      const value = registry[name];
      if (typeof value === 'function') return true;
      return typeof value === 'object' && value !== null && '$$typeof' in value;
    })
    .sort();
}

/** components 배럴이 re-export하는 컴포넌트 계열 이름 */
function componentFamilies(): string[] {
  const barrel = readFileSync(
    resolve(ROOT, 'src/components/index.ts'),
    'utf-8'
  );
  return [...barrel.matchAll(/^export \* from '\.\/(.+)';$/gm)]
    .map((m) => m[1])
    .sort();
}

describe('발행 문서와 소스 일치 검사', () => {
  it('llms.txt의 Design Tokens 절이 토큰 소스와 일치한다', () => {
    const expected = replaceSection(
      read(FILES.summary),
      'Design Tokens',
      renderTokenSummary()
    );
    if (UPDATE) {
      writeFileSync(FILES.summary, expected, 'utf-8');
      return;
    }
    expect(read(FILES.summary)).toBe(expected);
  });

  it('llms-full.txt의 Design Tokens 절이 토큰 소스와 일치한다', () => {
    const expected = replaceSection(
      read(FILES.full),
      'Design Tokens',
      renderTokenReference()
    );
    if (UPDATE) {
      writeFileSync(FILES.full, expected, 'utf-8');
      return;
    }
    expect(read(FILES.full)).toBe(expected);
  });

  it('llms-full.txt의 컴포넌트 절이 컴포넌트 계열과 정확히 일치한다', () => {
    // "계열"은 components 배럴이 re-export하는 디렉터리 하나를 말한다.
    // Modal.Header처럼 합성 하위 컴포넌트는 부모 절 안에서 다룬다.
    expect(componentHeadings(read(FILES.full))).toEqual(componentFamilies());
  });

  it('발행물(llms.txt·llms-full.txt)에 줄표(U+2014)가 없다', () => {
    // 사용자 지시: 줄표를 쓰지 않는다. 생성 형식과 손으로 쓴 문장 모두 막는다.
    // 글자 자체를 소스에 두지 않으려고 이스케이프로 적는다.
    const dash = '\u2014';
    const offenders = Object.entries(FILES).flatMap(([name, path]) =>
      read(path)
        .split('\n')
        .flatMap((line, i) => (line.includes(dash) ? [`${name}:${i + 1}`] : []))
    );
    expect(offenders).toEqual([]);
  });

  it('llms-full.txt가 최상위 컴포넌트 export를 하나도 빠뜨리지 않는다', () => {
    // 계열 절만 검사하면 CardImageOverlay처럼 개별 export되는 합성 조각이
    // 문서에서 누락돼도 통과한다. prop 단위 표류는 여기서 못 잡지만,
    // "import할 수 있는데 문서에 없는 이름"은 영구히 막힌다.
    const text = read(FILES.full);
    const missing = exportedComponentNames().filter(
      (name) => !new RegExp(`\\b${name}\\b`).test(text)
    );
    expect(missing).toEqual([]);
  });

  it('최상위 export에 Modal·Card의 합성 조각 별칭 10개가 없고 점 표기 조각은 남아 있다', () => {
    // 별칭(ModalHeader, CardBody 등)은 점 표기와 같은 컴포넌트라 이름만 둘이었다.
    // 지금은 Modal.Header처럼 한 이름만 쓰고, 최상위 export는 33개다.
    const aliases = [
      'ModalHeader',
      'ModalTitle',
      'ModalContent',
      'ModalFooter',
      'CardImage',
      'CardImageOverlay',
      'CardHeader',
      'CardTitle',
      'CardBody',
      'CardFooter',
    ];
    const names = exportedComponentNames();
    for (const alias of aliases) {
      expect(names, `${alias}가 아직 최상위로 export된다`).not.toContain(alias);
    }
    expect(names).toHaveLength(33);

    const modal: Record<string, unknown> = core.Modal;
    const card: Record<string, unknown> = core.Card;
    for (const part of ['Header', 'Title', 'Content', 'Footer']) {
      expect(modal[part], `Modal.${part}`).toBeDefined();
    }
    for (const part of [
      'Image',
      'ImageOverlay',
      'Header',
      'Title',
      'Body',
      'Footer',
    ]) {
      expect(card[part], `Card.${part}`).toBeDefined();
    }
  });

  it('llms.txt에 적힌 컴포넌트 개수가 실제와 맞고 세는 규칙이 명시돼 있다', () => {
    // v0.1.0 문서는 근거 없이 "30"만 적어서 소비자가 검증할 수 없었다.
    // 두 숫자가 다른 이유(합성 하위 컴포넌트)를 제목에 못박는다.
    const heading = read(FILES.summary).match(
      /^## Components \((\d+) families, (\d+) exports\)$/m
    );
    expect(heading).not.toBeNull();
    expect(Number(heading?.[1])).toBe(componentFamilies().length);
    expect(Number(heading?.[2])).toBe(exportedComponentNames().length);
  });

  it('llms.txt의 헤드라인 숫자가 같은 절 산문의 "계열 N개 · export는 M개"와 일치한다', () => {
    // 헤드라인만 검사하면 산문의 숫자가 낡아도 통과한다. 컴포넌트를 지울
    // 때마다 두 숫자가 바뀌므로 둘을 서로 묶어 둔다.
    const text = read(FILES.summary);
    const heading = text.match(
      /^## Components \((\d+) families, (\d+) exports\)$/m
    );
    const families = text.match(/계열\*\* (\d+)개/);
    const exportCount = text.match(/최상위 export는 (\d+)개/);
    expect(heading).not.toBeNull();
    expect(families).not.toBeNull();
    expect(exportCount).not.toBeNull();
    expect(Number(families?.[1])).toBe(Number(heading?.[1]));
    expect(Number(exportCount?.[1])).toBe(Number(heading?.[2]));
  });

  it('새로 만든 토큰(overlay.focusHalo·errorHalo·text.inverse)이 llms-full.txt에 나타난다', () => {
    // S1·S4가 만든 토큰이 발행 문서에 안 나타나던 문제(overlay.scrim)가
    // 여기서 같이 닫힌다. 참조가 생긴 scrim도 함께 확인한다.
    // llms.txt(요약)는 `## Design Tokens` 절에 그룹 이름만 나열해 점 표기
    // 전체 경로를 구조적으로 쓰지 않는다(surface.track·border.strong 같은
    // 기존 토큰도 마찬가지다). 점 표기 경로가 실제로 나타나는 llms-full.txt만
    // 검사한다.
    const names = [
      'overlay.scrim',
      'overlay.focusHalo',
      'overlay.errorHalo',
      'text.inverse',
    ];
    const fullText = read(FILES.full);
    for (const token of names) {
      expect(fullText, `llms-full.txt에 '${token}'이 없다`).toContain(token);
    }
  });

  it('삭제된 API를 쓰도록 안내하거나 없는 토큰 경로를 적지 않는다', () => {
    // v0.1.0 문서가 실제로 안내하던, 지금은 undefined를 반환하는 경로들.
    // `border.strong`은 이 목록에 있었으나 실제 토큰으로 추가되면서 빠졌다.
    // API 이름은 "쓰는 형태"만 금지한다. 문서에는 "ThemeProvider는 없다"처럼
    // 없다고 알리는 문장이 있어야 하므로 이름 자체를 금지하면 안 된다.
    const removed = [
      '<ThemeProvider',
      'darkTheme',
      'createTheme(',
      'useTheme(',
      'color.semantic.',
      'duration.normal',
      'spacing[11]',
    ];
    for (const [name, path] of Object.entries(FILES)) {
      const text = read(path);
      for (const token of removed) {
        expect(text, `${name}에 '${token}'이 남아 있다`).not.toContain(token);
      }
    }
  });
});

describe('문서가 약속한 대비를 실제 토큰이 지키는지', () => {
  it('본문 텍스트용 색은 paper 배경에서도 AA를 만족한다', () => {
    // 본문 텍스트에 쓰는 색만 검사한다. main 슬롯은 UI 요소용이라
    // 여기서 제외하는 것이 맞다.
    const { color } = themeTokens;
    const bodyColors = {
      'text.primary': color.text.primary,
      'text.secondary': color.text.secondary,
      'success.dark': color.success.dark,
      'warning.dark': color.warning.dark,
      'error.dark': color.error.dark,
      'info.dark': color.info.dark,
    };
    for (const [name, hex] of Object.entries(bodyColors)) {
      expect(
        contrastRatio(hex, color.background.paper),
        `${name}(${hex})`
      ).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('surface.track은 흰 배경에서 UI 요소 대비(3:1)를 만족한다', () => {
    // 흰 트랙 위에 흰 트랙(surface.default)을 얹으면 대비가 아예 없다.
    // 트랙은 컨트롤을 식별시키는 면이라 1.4.11의 3:1이 걸린다.
    const { color } = themeTokens;
    expect(
      contrastRatio(color.surface.track, color.background.default)
    ).toBeGreaterThanOrEqual(AA_UI);
  });

  it('border.strong은 background.paper 위에서도 UI 요소 대비(3:1)를 만족한다', () => {
    // background.paper 면 위에 border.strong 경계를 얹는 조합을 따로 본다.
    // 기존 검사는 흰 배경만 본다(NumericSpinner의 바깥 테두리는 없어져 그쪽 근거는 아니다).
    const { color } = themeTokens;
    expect(
      contrastRatio(color.border.strong, color.background.paper)
    ).toBeGreaterThanOrEqual(AA_UI);
  });

  it('weak 버튼(primary/danger/light)의 rest·hover·active 글자 대비가 AA를 만족한다', () => {
    // Button.css.ts의 weak 변형 3종은 배경이 아니라 글자를 어둡게 해 AA를
    // 맞춘다(weak dark는 이미 전부 통과해 대상에서 뺐다). error[900]가
    // error[100] 위에서 AA를 만족하는지도 여기서 같이 잡힌다.
    const { palette, color } = themeTokens;
    const pairs: Record<string, [string, string]> = {
      'weak primary rest': [palette.primary[900], palette.primary[50]],
      'weak primary hover': [palette.primary[900], palette.primary[100]],
      'weak primary active': [palette.primary[900], palette.primary[200]],
      'weak danger rest': [palette.error[900], palette.error[50]],
      'weak danger hover': [palette.error[900], palette.error[100]],
      'weak danger active': [palette.error[900], palette.error[100]],
      'weak light rest': [color.text.primary, palette.primary[100]],
      'weak light hover': [color.text.primary, palette.primary[200]],
      'weak light active': [color.text.primary, palette.primary[300]],
    };
    for (const [name, [fg, bg]] of Object.entries(pairs)) {
      expect(
        contrastRatio(fg, bg),
        `${name} (${fg} on ${bg})`
      ).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('border.focus는 흰 배경에서 UI 요소 대비(3:1)를 넘는다', () => {
    // focusRing() 유틸의 대비 계약을 잠근다(실측 4.60:1).
    const { color } = themeTokens;
    expect(
      contrastRatio(color.border.focus, color.background.default)
    ).toBeGreaterThanOrEqual(AA_UI);
  });

  it('발행 문서가 약속한 포커스 링 폭이 유틸의 실제 폭과 일치한다', () => {
    // 문서가 다시 거짓말을 못 하게 막는 테스트. focusRing.css.ts를 모듈로
    // import하면 vanilla-extract가 함수 export를 직렬화하지 못해 빌드가
    // 깨진다(recipe()류만 __recipe__ 마커로 예외 처리된다). 그래서 소스
    // 텍스트에서 폭을 뽑아 llms.txt·llms-full.txt의 Focus indicators 줄과
    // 대조한다.
    const focusRingSource = read(resolve(ROOT, 'src/tokens/focusRing.css.ts'));
    const width = focusRingSource.match(/outline: `(\d+px) solid/)?.[1];
    expect(
      width,
      'focusRing.css.ts에서 outline 폭을 찾지 못했다'
    ).toBeDefined();
    for (const [name, path] of Object.entries(FILES)) {
      const line = read(path).match(/^- Focus indicators \(.+\)$/m)?.[0];
      expect(line, `${name}에 Focus indicators 줄이 없다`).toBeDefined();
      expect(line, `${name}: "${line}"`).toContain(`${width} outline`);
    }
  });
});

describe('컴포넌트가 실제로 합성하는 색 쌍', () => {
  // 토큰 쌍만 재는 검사(`surface.track` vs 페이지 배경)는 트랙이 어두울수록 더
  // 잘 통과하고 화면은 더 안 보인다. 결함 방향을 보상한다. 여기서는 .css.ts
  // 소스가 실제로 참조하는 토큰 경로를 뽑아 컴포넌트가 화면에서 합성하는 쌍을
  // 잰다(Card·HeaderBar가 쓰는 소스 텍스트 대조 관례를 색에 적용).
  const SLIDER_CSS = read(resolve(ROOT, 'src/components/Slider/Slider.css.ts'));
  const LOADER_CSS = read(resolve(ROOT, 'src/components/Loader/Loader.css.ts'));

  /** `export const <name> = ...;` 선언 하나를 소스 텍스트에서 잘라낸다. */
  function declBlock(source: string, name: string): string {
    const start = source.indexOf(`export const ${name} = `);
    expect(start, `${name} 선언을 찾지 못했다`).toBeGreaterThan(-1);
    const end = source.indexOf('\n});', start);
    expect(end, `${name} 선언의 끝을 찾지 못했다`).toBeGreaterThan(start);
    return source.slice(start, end);
  }

  /** `color.primary.main`·`palette.error[900]` 참조를 실제 색값으로 바꾼다. */
  function tokenValue(ref: string): string {
    const value = ref
      .replace(/\[(\w+)\]/g, '.$1')
      .split('.')
      .reduce<unknown>(
        (node, key) => (node as Record<string, unknown>)[key],
        themeTokens as unknown
      );
    expect(typeof value, `themeContract.${ref}가 토큰에 없다`).toBe('string');
    return value as string;
  }

  /** 블록 안에서 처음 나오는 면 색(backgroundColor, SVG는 fill)의 토큰 참조 */
  function firstBackground(block: string, label: string): string {
    const ref = block.match(
      /(?:backgroundColor|fill): themeContract\.([\w.[\]]+)/
    )?.[1];
    expect(
      ref,
      `${label}의 backgroundColor가 토큰 참조가 아니다`
    ).toBeDefined();
    return ref as string;
  }

  it('Slider의 fill과 썸 테두리가 트랙 대비 3:1을 지킨다', () => {
    const track = firstBackground(
      declBlock(SLIDER_CSS, 'sliderLineTrack'),
      'sliderLineTrack'
    );
    const fill = firstBackground(
      declBlock(SLIDER_CSS, 'sliderLineFill'),
      'sliderLineFill'
    );
    expect(
      contrastRatio(tokenValue(fill), tokenValue(track)),
      `fill(${fill}) on track(${track})`
    ).toBeGreaterThanOrEqual(AA_UI);

    // 머리의 면은 트랙과 같은 색일 수 있다. 머리를 식별시키는 건 테두리다.
    // 머리는 기본 썸을 대신해 sliderHead가 그린다.
    const thumbBorder = declBlock(SLIDER_CSS, 'sliderHead').match(
      /border: `2px solid \$\{themeContract\.([\w.[\]]+)\}`/
    )?.[1];
    expect(thumbBorder, '썸 테두리 색을 찾지 못했다').toBeDefined();
    expect(
      contrastRatio(tokenValue(thumbBorder as string), tokenValue(track)),
      `thumb border(${thumbBorder}) on track(${track})`
    ).toBeGreaterThanOrEqual(AA_UI);
  });

  it('Loader bar의 세 색 변형이 각자의 트랙 대비 3:1을 지킨다', () => {
    const barBlock = declBlock(LOADER_CSS, 'bar');
    // white 변형은 어두운 면 위에서 쓰는 것이라 밝은 fill이 올라탄다.
    // 이 변형만 트랙이 어두워야 해서 분기가 있어야 한다.
    const whiteAt = barBlock.indexOf('data-color="white"');
    expect(whiteAt, 'bar에 white 변형 트랙 분기가 없다').toBeGreaterThan(-1);
    const defaultTrack = firstBackground(
      barBlock.slice(0, whiteAt),
      'bar 기본 트랙'
    );
    const whiteTrack = firstBackground(
      barBlock.slice(whiteAt),
      'bar white 트랙'
    );

    const fillRefs = Object.fromEntries(
      [
        ...declBlock(LOADER_CSS, 'colorStyles').matchAll(
          /(\w+): \{\s*vars: \{\s*'--loader-color': themeContract\.([\w.[\]]+)/g
        ),
      ].map((m) => [m[1], m[2]])
    );
    expect(Object.keys(fillRefs).sort()).toEqual([
      'primary',
      'secondary',
      'white',
    ]);

    for (const [variant, fill] of Object.entries(fillRefs)) {
      const track = variant === 'white' ? whiteTrack : defaultTrack;
      expect(
        contrastRatio(tokenValue(fill), tokenValue(track)),
        `color="${variant}" fill(${fill}) on track(${track})`
      ).toBeGreaterThanOrEqual(AA_UI);
    }
  });

  it('연한 트랙 면은 border.strong 경계선이 식별을 맡는다', () => {
    // 트랙 면을 background.paper로 내리면 면 자체는 흰 페이지 대비 1.02:1이라
    // 안 보인다. 1.4.11의 3:1을 넘기는 건 선(stroke) 쪽이다.
    // Loader 막대 트랙은 경계선이 없는 gray 200 면으로 바뀌어 이 시험을 떠났다
    // (채움 대비는 위 시험, 면은 SegmentedButtons 트랙과 같은 값, M5 task-20 수정 6).
    const blocks: Record<string, string> = {
      'Slider sliderLineTrack': declBlock(SLIDER_CSS, 'sliderLineTrack'),
    };
    for (const [label, block] of Object.entries(blocks)) {
      // Slider는 SVG 선(stroke).
      const ringMatch = block.match(
        /boxShadow: `inset 0 0 0 1px \$\{themeContract\.([\w.]+)\}`|stroke: themeContract\.([\w.]+)/
      );
      const ring = ringMatch?.[1] ?? ringMatch?.[2];
      expect(ring, `${label}에 inset 경계선이 없다`).toBe(
        'color.border.strong'
      );
      expect(
        contrastRatio(
          tokenValue(ring as string),
          tokenValue(firstBackground(block, label))
        ),
        `${label}: 경계선 vs 트랙 면`
      ).toBeGreaterThanOrEqual(AA_UI);
      expect(
        contrastRatio(
          tokenValue(ring as string),
          themeTokens.color.background.default
        ),
        `${label}: 경계선 vs 페이지 배경`
      ).toBeGreaterThanOrEqual(AA_UI);
    }
  });

  it('Button weak 변형이 참조하는 색 토큰이 기대 매핑·AA 대비와 일치한다', () => {
    // 쌍을 테스트 안에 다시 적으면 Button.css.ts가 되돌아가도 통과한다.
    // 소스가 실제로 참조하는 키를 뽑아 매핑을 대조하고, 그 키의 실제 값으로
    // 대비까지 잰다.
    const source = read(resolve(ROOT, 'src/components/Button/Button.css.ts'));
    const start = source.indexOf('compoundVariants: [');
    const compound = source.slice(start, source.indexOf('\n  ],', start));
    const weak: Record<string, { color: string; backgrounds: string[] }> = {};
    for (const chunk of compound.split('variants: { buttonStyle: ').slice(1)) {
      const head = chunk.match(/^'(\w+)', variant: '(\w+)' \}/);
      if (head?.[1] !== 'weak') continue;
      weak[head[2]] = {
        color: chunk.match(/\n\s+color: themeContract\.([\w.[\]]+)/)?.[1] ?? '',
        backgrounds: [
          ...chunk.matchAll(/backgroundColor: themeContract\.([\w.[\]]+)/g),
        ].map((m) => m[1]),
      };
    }

    // 순서는 rest → hover → active다.
    expect(weak).toEqual({
      primary: {
        color: 'palette.primary[900]',
        backgrounds: [
          'palette.primary[50]',
          'palette.primary[100]',
          'palette.primary[200]',
        ],
      },
      dark: {
        color: 'palette.gray[800]',
        backgrounds: [
          'palette.gray[200]',
          'palette.gray[300]',
          'palette.gray[400]',
        ],
      },
      danger: {
        color: 'palette.error[900]',
        backgrounds: [
          'palette.error[50]',
          'palette.error[100]',
          'palette.error[100]',
        ],
      },
      light: {
        color: 'color.text.primary',
        backgrounds: [
          'palette.primary[100]',
          'palette.primary[200]',
          'palette.primary[300]',
        ],
      },
    });

    for (const [variant, { color, backgrounds }] of Object.entries(weak)) {
      for (const bg of backgrounds) {
        expect(
          contrastRatio(tokenValue(color), tokenValue(bg)),
          `weak ${variant}: ${color} on ${bg}`
        ).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
  });

  it('Snackbar 네 severity의 면 대 글자가 AA, 카운트다운 막대 대 면이 3:1을 지킨다', () => {
    // 글자만 흰색으로 바꾸면 success.main 2.78:1, warning.main 2.16:1이다. 그래서
    // success는 면이 `dark`로 내려가고(5.13) `text.inverse`가 얹힌다. 막대는
    // `currentColor`라 글자색을 따르므로 막대 대 면도 같은 쌍이다.
    // warning만 예외다. 사용자가 겨자색 노랑 #BF8A00(`palette.warning[750]`)을 골랐고
    // 흰 글자 대비는 3.07:1이다. 글자 AA(4.5:1, 1.4.3)에는 못 미치고 3:1은 넘는다.
    // 알고 받아들인 결정이라 이 이름을 목록에 못박는다. 다른 severity가 슬쩍 낮아지면
    // 4.5:1 검사가 잡는다.
    const BELOW_AA_TEXT_BY_USER_DECISION = ['warning'];
    const css = read(resolve(ROOT, 'src/components/Snackbar/Snackbar.css.ts'));
    const pairs = Object.fromEntries(
      [
        ...declBlock(css, 'severityStyles').matchAll(
          /(\w+): \{\s*backgroundColor: themeContract\.([\w.[\]]+),\s*color: themeContract\.([\w.[\]]+)/g
        ),
      ].map((m) => [m[1], { bg: m[2], fg: m[3] }])
    );
    expect(Object.keys(pairs).sort()).toEqual([
      'error',
      'info',
      'success',
      'warning',
    ]);
    expect(pairs.success).toEqual({
      bg: 'color.success.dark',
      fg: 'color.text.inverse',
    });
    expect(pairs.warning).toEqual({
      bg: 'palette.warning[750]',
      fg: 'color.text.inverse',
    });
    expect(declBlock(css, 'bar')).toContain("backgroundColor: 'currentColor'");

    for (const [severity, { bg, fg }] of Object.entries(pairs)) {
      expect(
        contrastRatio(tokenValue(fg), tokenValue(bg)),
        `${severity} 글자(${fg}) on 면(${bg})`
      ).toBeGreaterThanOrEqual(
        BELOW_AA_TEXT_BY_USER_DECISION.includes(severity) ? AA_UI : AA_TEXT
      );
      expect(
        contrastRatio(tokenValue(fg), tokenValue(bg)),
        `${severity} 막대(${fg}) on 면(${bg})`
      ).toBeGreaterThanOrEqual(AA_UI);
    }
  });

  it('Snackbar 닫기 버튼의 호버·눌림 면 위에서 흰 글리프가 면 자체 대비 이상이고 네 severity 모두 3:1을 지킨다', () => {
    // 면은 text.primary(어두운 회색)를 옅게 섞은 반투명이라 severity 면과 섞인 색 위에
    // 글리프(currentColor)가 얹힌다. 합성은 CSS `color-mix(in srgb, …)`와 같은 선형
    // 평균이다. 어둡게 섞으니 흰 글리프 대비는 면 자체 대비보다 오른다. 흰색을 섞던
    // 이전 방식은 노란 면을 더 밝혀 2.5:1로 떨어졌다.
    const css = read(resolve(ROOT, 'src/components/Snackbar/Snackbar.css.ts'));
    const closeBlock = declBlock(css, 'closeButton');
    const mixes = [
      ...closeBlock.matchAll(
        /background: `color-mix\(in srgb, \$\{themeContract\.([\w.[\]]+)\} (\d+)%, transparent\)`/g
      ),
    ].map((m) => ({ ref: m[1], weight: Number(m[2]) / 100 }));
    expect(mixes, '호버·눌림 두 규칙이 있어야 한다').toEqual([
      { ref: 'color.text.primary', weight: 0.12 },
      { ref: 'color.text.primary', weight: 0.18 },
    ]);

    const channels = (hex: string): number[] =>
      [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const toHex = (rgb: number[]): string =>
      '#' +
      rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
    const mixOver = (fg: string, bg: string, weight: number): string =>
      toHex(
        channels(bg).map((b, i) => channels(fg)[i] * weight + b * (1 - weight))
      );

    const pairs = Object.fromEntries(
      [
        ...declBlock(css, 'severityStyles').matchAll(
          /(\w+): \{\s*backgroundColor: themeContract\.([\w.[\]]+),\s*color: themeContract\.([\w.[\]]+)/g
        ),
      ].map((m) => [m[1], { bg: m[2], fg: m[3] }])
    );
    expect(Object.keys(pairs)).toHaveLength(4);

    for (const [severity, { bg, fg }] of Object.entries(pairs)) {
      const own = contrastRatio(tokenValue(fg), tokenValue(bg));
      for (const { ref, weight } of mixes) {
        const surface = mixOver(tokenValue(ref), tokenValue(bg), weight);
        const ratio = contrastRatio(tokenValue(fg), surface);
        const label = `${severity} 글리프(${fg}) on ${weight * 100}% 섞은 면(${surface})`;
        expect(ratio, `${label}: 면 자체 대비 이상`).toBeGreaterThanOrEqual(
          own
        );
        expect(ratio, label).toBeGreaterThanOrEqual(AA_UI);
      }
    }
  });
});

describe('Server Components 절이 빌드물의 지시문과 맞는다', () => {
  // dist는 .gitignore 대상이라 빌드 전에는 없다. 없으면 건너뛰고, 있으면 반드시 검사한다.
  const DIST = resolve(ROOT, 'dist');

  /** 빌드물 첫 줄이 `"use client";` 지시문인가. 판정은 이 함수 하나만 한다. */
  function hasClientDirective(firstLine: string): boolean {
    return /^\s*['"]use client['"];?\s*$/.test(firstLine);
  }

  function builtHasDirective(name: string): boolean {
    const file = resolve(DIST, 'components', name, `${name}.mjs`);
    const firstLine = readFileSync(file, 'utf-8').split(/\r?\n/, 1)[0];
    return hasClientDirective(firstLine);
  }

  /** `## Next.js & Server Components` 절의 문장들(줄바꿈은 공백 하나로 합친다). */
  function sectionSentences(text: string): string[] {
    const marker = '## Next.js & Server Components\n';
    const start = text.indexOf(marker);
    expect(start, `'${marker.trim()}' 절이 없다`).toBeGreaterThan(-1);
    const next = text.indexOf('\n## ', start + marker.length);
    const section = text.slice(
      start + marker.length,
      next === -1 ? undefined : next
    );
    return section.replace(/\s+/g, ' ').split(/(?<=\.)\s/);
  }

  /** 문장 안에서 백틱으로 감싼 컴포넌트 계열 이름. */
  function namesIn(sentence: string): string[] {
    const families = componentFamilies();
    return [...sentence.matchAll(/`([A-Z][A-Za-z]*)`/g)]
      .map((m) => m[1])
      .filter((name) => families.includes(name));
  }

  /** 절이 "지시문이 없다"고 적은 이름과 "'use client'가 붙는다"고 적은 이름. */
  function claims(text: string): { none: string[]; client: string[] } {
    const sentences = sectionSentences(text);
    const none = sentences
      .filter((s) => /지시문이 없다/.test(s))
      .flatMap(namesIn);
    const client = sentences
      .filter((s) => /'use client'`가 붙는다/.test(s))
      .flatMap(namesIn);
    // 문장 형식이 바뀌어 아무것도 못 읽으면 통과가 아니라 실패여야 한다.
    expect(none, '"지시문이 없다" 문장을 못 읽었다').not.toHaveLength(0);
    expect(client, `"'use client'가 붙는다" 문장을 못 읽었다`).not.toHaveLength(
      0
    );
    return { none, client };
  }

  it('절이 "지시문이 없다"고 적은 이름은 빌드물에 지시문이 없다', () => {
    if (!existsSync(DIST)) return;
    for (const [file, path] of Object.entries(FILES)) {
      const wrong = claims(read(path)).none.filter(builtHasDirective);
      expect(wrong, `${file}: 지시문이 있는데 없다고 적힌 이름`).toEqual([]);
    }
  });

  it('절이 "\'use client\'가 붙는다"고 적은 이름은 빌드물에 지시문이 있다', () => {
    if (!existsSync(DIST)) return;
    for (const [file, path] of Object.entries(FILES)) {
      const wrong = claims(read(path)).client.filter(
        (name) => !builtHasDirective(name)
      );
      expect(wrong, `${file}: 지시문이 없는데 붙는다고 적힌 이름`).toEqual([]);
    }
  });

  it('빌드물에 지시문이 없는 컴포넌트는 전부 "지시문이 없다" 목록에 있다', () => {
    if (!existsSync(DIST)) return;
    const serverSide = componentFamilies().filter(
      (name) => !builtHasDirective(name)
    );
    for (const [file, path] of Object.entries(FILES)) {
      const listed = claims(read(path)).none;
      const missing = serverSide.filter((name) => !listed.includes(name));
      expect(missing, `${file}: 목록에서 빠진 서버 컴포넌트`).toEqual([]);
    }
  });
});
