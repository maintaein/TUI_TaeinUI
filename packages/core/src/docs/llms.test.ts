/**
 * 발행 문서(llms.txt · llms-full.txt)가 소스와 일치하는지 검사한다.
 *
 * 개선 요청 19번("llms.txt가 소스에서 생성되지 않음")의 근본 원인 처리.
 * 문서와 코드가 어긋나면 `pnpm test`가 깨지므로 별도 CI 설정이 필요 없다.
 * 문서를 갱신할 때는 `node scripts/update-llms.mjs`를 실행한다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
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

  it('새로 만든 토큰(overlay.focusHalo·errorHalo·text.inverse)이 발행 문서에 나타난다', () => {
    // S1·S4가 만든 토큰이 발행 문서에 안 나타나던 문제(overlay.scrim)가
    // 여기서 같이 닫힌다. 참조가 생긴 scrim도 함께 확인한다.
    // llms.txt(요약)는 토큰 경로를 spelling하지 않으므로(surface.track 등
    // 기존 토큰도 마찬가지다) 두 문서를 합쳐서 한 번이라도 나타나는지 본다.
    const names = [
      'overlay.scrim',
      'overlay.focusHalo',
      'overlay.errorHalo',
      'text.inverse',
    ];
    const combined = Object.values(FILES).map(read).join('\n');
    for (const token of names) {
      expect(combined, `발행 문서에 '${token}'이 없다`).toContain(token);
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
    // Text 컴포넌트가 실제로 쓰는 색만 검사한다. main 슬롯은 UI 요소용이라
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
    // SegmentedButtons·NumericSpinner가 이번에 background.paper 면 위에
    // border.strong 경계를 얹는다. 기존 검사는 흰 배경만 보므로 이 조합이
    // 이 커밋에서 처음 하중을 받는다.
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
    // 깨진다(recipe()류만 __recipe__ 마커로 예외 처리된다) — 그래서 소스
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
