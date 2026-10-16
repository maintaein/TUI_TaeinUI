/**
 * llms.txt / llms-full.txt의 토큰 문서를 소스에서 생성한다.
 *
 * 이 파일이 존재하는 이유: 토큰 문서를 손으로 적으면 반드시 어긋난다.
 * 실제로 발행된 v0.1.0 문서에는 `color.semantic.success`, `color.border.strong`,
 * `duration.normal`처럼 계약에 없는 경로가 적혀 있었고 borderRadius 값 4개가
 * 전부 틀렸다. 문서를 보고 코드를 쓴 소비자는 `undefined`를 받는다.
 *
 * `themeContract`를 읽으면 값이 아니라 `var(--...)` 문자열이 나오므로
 * 값의 출처인 `themeTokens`(tokens/contract.ts)를 직접 읽는다.
 *
 * 이 모듈은 `src/index.ts`에서 export하지 않는다. 빌드 진입점에서 도달할 수
 * 없으므로 dist에 포함되지 않고 공개 API 표면이나 컴포넌트 개수에도 영향이 없다.
 */
import { themeTokens } from '../tokens/contract';
import { breakpoint, mediaQuery } from '../tokens/breakpoints.css';

/** 대비 계산의 상대편으로 쓰는 기준 배경색 */
const WHITE = themeTokens.color.background.default;
const PAPER = themeTokens.color.background.paper;

/** WCAG 2.2 본문 텍스트 최소 대비 */
export const AA_TEXT = 4.5;
/** WCAG 2.2 UI 요소·큰 텍스트 최소 대비 */
export const AA_UI = 3;

function channelLuminance(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.1 상대 휘도. hex는 `#RGB` 또는 `#RRGGBB`. */
export function relativeLuminance(hex: string): number {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const [r, g, b] = [0, 2, 4].map((i) =>
    channelLuminance(parseInt(full.slice(i, i + 2), 16))
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 두 색의 WCAG 대비비(1~21). 둘째 자리에서 내림해 과대 보고를 막는다. */
export function contrastRatio(fg: string, bg: string): number {
  const [lighter, darker] = [relativeLuminance(fg), relativeLuminance(bg)].sort(
    (a, b) => b - a
  );
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.floor(ratio * 100) / 100;
}

function ratioLabel(fg: string): string {
  const onWhite = contrastRatio(fg, WHITE);
  const onPaper = contrastRatio(fg, PAPER);
  // 판정은 더 불리한 쪽(paper)을 기준으로 한다. 흰 배경만 보고 통과라고
  // 적으면 Card 위에서 조용히 기준을 밑돈다.
  const verdict =
    onPaper >= AA_TEXT
      ? 'AA text'
      : onPaper >= AA_UI
        ? 'AA UI only, not for body text'
        : 'decorative only, fails AA';
  return `${onWhite.toFixed(2)}:1 on white / ${onPaper.toFixed(2)}:1 on paper, ${verdict}`;
}

/**
 * 슬롯의 역할에 맞는 대비만 적는다.
 *
 * 배경용 슬롯(`light`, `background.*`, `surface.*`)에 "흰 배경 위 텍스트 대비"를
 * 붙이면 숫자는 맞아도 무의미하고, `contrast`는 흰 배경이 아니라 `main` 위에
 * 얹히는 색이다. 역할과 다른 기준으로 판정한 줄이 섞이면 문서가 오히려
 * 오해를 만든다.
 */
function foregroundLine(path: string, hex: string): string {
  return `- \`${path}\`: ${hex}, ${ratioLabel(hex)}`;
}

function plainLine(path: string, hex: string, note: string): string {
  return `- \`${path}\`: ${hex}, ${note}`;
}

/** semantic 4슬롯 한 벌. 슬롯마다 기준이 다르므로 따로 만든다. */
function semanticLines(name: string, slots: Record<string, string>): string[] {
  const base = `themeContract.color.${name}`;
  const onLight = contrastRatio(color.text.primary, slots.light).toFixed(2);
  const onMain = contrastRatio(slots.contrast, slots.main).toFixed(2);
  return [
    foregroundLine(`${base}.main`, slots.main),
    plainLine(
      `${base}.light`,
      slots.light,
      `배경용. 위에 \`text.primary\`를 얹으면 ${onLight}:1`
    ),
    foregroundLine(`${base}.dark`, slots.dark),
    plainLine(
      `${base}.contrast`,
      slots.contrast,
      `\`${name}.main\` 위 글자색: ${onMain}:1`
    ),
  ];
}

function scaleLines(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([key, value]) => `${key} (${value})`)
    .join(', ');
}

/** rem 값에 16px 기준 px 환산을 덧붙인다. */
function withPx(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([key, value]) => {
      const rem = value.endsWith('rem') ? parseFloat(value) * 16 : null;
      return rem === null
        ? `${key} (${value})`
        : `${key} (${value} = ${rem}px)`;
    })
    .join(', ');
}

const { color, spacing, borderRadius, shadow, font, animation, zIndex } =
  themeTokens;

const SEMANTIC_NAMES = ['success', 'warning', 'error', 'info'] as const;

/** llms-full.txt의 `## Design Tokens` 본문 */
export function renderTokenReference(): string {
  const semanticNote = [
    'Semantic 색상은 역할별 4슬롯이다. 슬롯을 바꿔 쓰면 대비가 깨진다:',
    '- `main`: 글자(`contrast`)를 얹는 면. 판정 기준은 페이지 배경이 아니라',
    '  `contrast`와의 대비 4.5:1이다. 배경과의 3:1은 보장 대상이 아니다',
    '  (`success.main` 2.77, `warning.main` 2.15). **본문 텍스트로 쓰지 말 것**',
    '- `light`: 연한 배경용. 위에는 `color.text.primary`를 얹는다',
    '- `dark`: 흰 배경 위 본문 텍스트용 (기준 4.5:1). 글자를 얹지 않는 도형',
    '  (아이콘 단독·차트 마커·상태 점)도 이 슬롯을 쓴다. 1.4.11의 3:1을 넘긴다',
    '- `contrast`: `main` 위에 얹는 글자색',
  ].join('\n');

  return [
    'TUI uses `themeContract` for type-safe, theme-aware styling. 테마는 라이트',
    '단일 테마 하나뿐이며 `:root`에 전역 CSS 변수로 선언된다. `ThemeProvider`,',
    '`useTheme`, `createTheme`, 다크 테마는 존재하지 않는다. import하면 실패한다.',
    '',
    '아래 값과 대비비는 모두 소스(`tokens/contract.ts`)에서 생성되므로 코드와',
    '어긋날 수 없다.',
    '',
    '### Color: Brand & Neutral',
    '',
    '판정 기준은 흰 배경이 아니라 더 불리한 `background.paper`다.',
    '',
    foregroundLine('themeContract.color.primary.main', color.primary.main),
    foregroundLine('themeContract.color.primary.light', color.primary.light),
    foregroundLine('themeContract.color.primary.dark', color.primary.dark),
    plainLine(
      'themeContract.color.primary.contrast',
      color.primary.contrast,
      `\`primary.main\` 위 글자색: ${contrastRatio(
        color.primary.contrast,
        color.primary.main
      ).toFixed(2)}:1`
    ),
    foregroundLine('themeContract.color.text.primary', color.text.primary),
    foregroundLine('themeContract.color.text.secondary', color.text.secondary),
    plainLine(
      'themeContract.color.text.disabled',
      color.text.disabled,
      '비활성 표시용. 대비가 낮으므로 색만으로 상태를 전달하지 않는다 ' +
        '(`disabled`/`aria-disabled`를 함께 쓴다)'
    ),
    plainLine(
      'themeContract.color.text.inverse',
      color.text.inverse,
      '어두운 면 위 글자색 (Button·IconButton의 dark 변형, 스크림 위 텍스트)'
    ),
    plainLine(
      'themeContract.color.background.default',
      color.background.default,
      '페이지 배경'
    ),
    plainLine(
      'themeContract.color.background.paper',
      color.background.paper,
      '카드·패널 배경. 대비 판정의 기준 배경이다'
    ),
    plainLine(
      'themeContract.color.surface.default',
      color.surface.default,
      '표면 기본'
    ),
    plainLine(
      'themeContract.color.surface.hover',
      color.surface.hover,
      '표면 hover'
    ),
    plainLine(
      'themeContract.color.surface.active',
      color.surface.active,
      '표면 active'
    ),
    plainLine(
      'themeContract.color.surface.track',
      color.surface.track,
      `흰 배경 대비 ${contrastRatio(
        color.surface.track,
        color.background.default
      ).toFixed(
        2
      )}:1, 1.4.11의 3:1을 넘긴다. 컨트롤을 식별시키는 면(Switch·Slider의 트랙과 ` +
        'Loader `color="white"`의 트랙)에 쓴다. `border.strong`과 값은 같지만 경계선이 아니라 ' +
        '면이라 따로 둔다'
    ),
    plainLine(
      'themeContract.color.border.default',
      color.border.default,
      `흰 배경 대비 ${contrastRatio(
        color.border.default,
        color.background.default
      ).toFixed(2)}:1, UI 요소 기준 3:1 미달이므로 구분선·비활성 테두리처럼 ` +
        '정보를 전달하지 않는 자리에만 쓴다. 경계가 정보를 전달하면 `border.strong`'
    ),
    plainLine(
      'themeContract.color.border.strong',
      color.border.strong,
      `흰 배경 대비 ${contrastRatio(
        color.border.strong,
        color.background.default
      ).toFixed(
        2
      )}:1, 1.4.11의 3:1을 넘긴다. 폼 컨트롤·카드 경계처럼 있고 없고가 ` +
        '의미를 바꾸는 자리에 쓴다'
    ),
    plainLine(
      'themeContract.color.border.focus',
      color.border.focus,
      '포커스 링 색'
    ),
    plainLine(
      'themeContract.color.overlay.scrim',
      color.overlay.scrim,
      'Modal·BottomSheet·SideSheet 백드롭. 반투명 합성색이라 단일 대비값이 없다'
    ),
    plainLine(
      'themeContract.color.overlay.focusHalo',
      color.overlay.focusHalo,
      '포커스 halo(장식). 실제 포커스 표시는 focusRing 유틸의 outline이 맡는다(TextField는 예외로 outline 없이 테두리 색이 맡는다)'
    ),
    plainLine(
      'themeContract.color.overlay.errorHalo',
      color.overlay.errorHalo,
      '에러 halo(장식). 위와 같은 이유로 포커스 표시를 겸하지 않는다'
    ),
    '',
    '### Color: Semantic',
    '',
    semanticNote,
    '',
    ...SEMANTIC_NAMES.flatMap((name) => semanticLines(name, color[name])),
    '',
    `\`color.info\`는 값이 \`color.primary\`와 같다(${color.info.main}). 의도한 것이며`,
    '정보 알림을 브랜드 블루로 표현한다. 그래도 `primary`를 빌려 쓰지 말고 `info`를',
    '쓴다. 브랜드 색을 바꿀 때 알림 색이 따라 바뀌지 않으려면 어휘가 분리되어',
    '있어야 한다.',
    '',
    '### Color: Raw Palette',
    '`themeContract.palette.{primary,gray,error,success,warning}[단계]`(정의된 단계만, 예: `warning`은 50·100·500·700·750·800): hover/active처럼 4슬롯으로',
    '표현되지 않는 미세 단계가 필요할 때만 쓴다. 역할이 있는 자리에는 위의 역할',
    '토큰을 쓴다.',
    '',
    '### Spacing (8pt grid)',
    `- \`themeContract.spacing[n]\`: ${withPx(spacing)}`,
    '- 12단계에서 닫혀 있다. `spacing[7]`, `[9]`, `[11]`, `[13]`–`[15]`, `[17]`–`[19]`는',
    '  정의되지 않았고 `undefined`를 반환한다. 최대값은 80px이다.',
    '',
    '### Typography',
    `- \`font.family.sans\`: ${font.family.sans}`,
    `- \`font.family.mono\`: ${font.family.mono}`,
    `- \`font.size\`: ${withPx(font.size)}`,
    `- \`font.weight\`: ${scaleLines(font.weight)}`,
    `- \`font.lineHeight\`: ${scaleLines(font.lineHeight)}`,
    `- \`font.variantNumeric\`: ${scaleLines(font.variantNumeric)}`,
    '  숫자를 세로로 비교하는 표·지표에는 `tabular`를 쓴다. 비례 폰트는 `1`이 `8`보다',
    '  좁아서 자릿수가 행마다 어긋난다.',
    '',
    '### Border Radius',
    `- \`themeContract.borderRadius\`: ${withPx(borderRadius)}`,
    '',
    '### Shadow',
    `- \`themeContract.shadow\`: ${Object.keys(shadow).join(', ')}`,
    '',
    '### Animation',
    `- \`animation.duration\`: ${scaleLines(animation.duration)}`,
    `- \`animation.loop\`: ${scaleLines(animation.loop)}`,
    '  전이(A→B)가 아니라 무한 반복 한 바퀴의 길이라 duration과 다른 양이다.',
    '  같은 스케일에 끼우면 전이를 느리게 만드는 압력이 된다.',
    `- \`animation.easing\`: ${scaleLines(animation.easing)}`,
    '- **토큰 경계**: 여러 컴포넌트가 공유하는 의미(전이 속도, 반복 주기,',
    '  등장·퇴장 커브)만 토큰이다. 한 컴포넌트에만 있는 연출의 내부 타이밍',
    '  (Skeleton wave 시작 지연, Loader 점 스태거 같은 delay)은 토큰이 아니고,',
    '  그래도 duration·loop 토큰의 배수로 적는다. `.css.ts`에 duration을 리터럴로 박지 않는다.',
    '- 오버슈트 이징 `snap`(피크 1.0998)·`spring`(피크 1.2044)은 `transform`에만 건다.',
    '  값이 1을 넘어야 튕김이 보이는데 `opacity`·색은 1에서 잘려 인공물만 남는다.',
    '- `transition: all`을 쓰지 않는다. 전이할 속성을 적는다. 합성·페인트 속성',
    '  (transform/opacity/filter/색/box-shadow/text-shadow) 밖을 전이하려면 근거를 남긴다.',
    '- 이 경계는 `src/tokens/animationBoundary.test.ts`가 소스 스캔으로 잠근다.',
    '- `prefers-reduced-motion: reduce`이면 duration 넷과 loop 셋, 일곱 개가 모두 `0.01ms`로',
    '  덮어써지고, 전역 규칙이 `*, *::before, *::after`의 animation/transition duration·delay와',
    '  반복 횟수까지 함께 내린다. 토큰을 안 쓰고 초를 리터럴로 박은 애니메이션',
    '  (Skeleton의 무한 wave/pulse 등)도 멈춘다.',
    '',
    '### Z-Index',
    `- \`themeContract.zIndex\`: ${scaleLines(zIndex)}`,
    '- 층 이름으로 참조한다. 숫자를 직접 쓰면 소비자가 자기 오버레이를 안전하게',
    '  얹을 값을 알 수 없다.',
    '- `sticky` HeaderBar · `overlay` 배경 딤 · `modal` Modal/BottomSheet/SideSheet/',
    '  Loader(fullScreen) · `popover` Popover · `toast` Snackbar · `tooltip` Tooltip.',
    '- `popover`/`tooltip`/`toast`가 `modal`보다 위인 것은 의도다. 모달 안에서 툴팁을',
    '  띄우거나 모달 위에 Snackbar를 올리는 조합이 흔하다.',
    '',
    '### Breakpoints',
    `- \`breakpoint\`: ${Object.entries(breakpoint)
      .map(([k, v]) => `${k} (${v}px)`)
      .join(', ')}`,
    `- \`mediaQuery.up.md\`: \`${mediaQuery.up.md}\``,
    `- \`mediaQuery.down.md\`: \`${mediaQuery.down.md}\``,
    '- `themeContract`에 없다. CSS 변수는 `@media` 조건에서 동작하지 않으므로',
    '  (`@media (min-width: var(--x))`는 무효) 브레이크포인트는 빌드 타임 상수이며',
    '  테마로 바꿀 수 없다. `mediaQuery`를 import해 `.css.ts`의 `@media` 키에 그대로',
    '  넣는다. `down`이 1px이 아니라 0.02px을 빼는 것은 소수 픽셀 폭에서 `up`과',
    '  사이에 틈이 생기지 않게 하기 위함이다.',
  ].join('\n');
}

/** llms.txt의 `## Design Tokens` 본문 (요약판) */
export function renderTokenSummary(): string {
  const sizeKeys = Object.keys(font.size);
  return [
    'TUI uses a theme contract (`themeContract`) for consistent styling. 라이트 단일',
    '테마이며 `:root`의 전역 CSS 변수로 선언된다 (`ThemeProvider`·다크 테마 없음).',
    '',
    `- **Color**: primary, text (${Object.keys(color.text).join('/')}), background, surface, border, overlay, semantic (${SEMANTIC_NAMES.join('/')})`,
    '  semantic은 main(면, contrast와 4.5:1) / light(배경) / dark(본문 텍스트·단독 도형, 4.5:1) / contrast 4슬롯',
    `- **Spacing**: 8pt grid, 12단계 (${spacing[1]} = 4px ~ ${spacing[20]} = 80px). 중간 번호는 비어 있음`,
    `- **Typography**: sizes ${sizeKeys.length}단계 (${sizeKeys[0]} ~ ${sizeKeys[sizeKeys.length - 1]}), weights, line heights, variantNumeric(tabular-nums)`,
    `- **Border Radius**: ${Object.keys(borderRadius).join(', ')}`,
    `- **Shadow**: ${Object.keys(shadow).join(', ')}`,
    `- **Animation**: durations (${Object.keys(animation.duration).join('/')}), loops (${Object.keys(animation.loop).join('/')}), easings (${Object.keys(animation.easing).join('/')})`,
    '  공유하는 의미만 토큰이다. 컴포넌트 고유 연출의 delay도 duration·loop의 배수로',
    '  적고, 오버슈트 이징(snap/spring)은 transform 전용이며 `transition: all`은 안 쓴다',
    `- **Z-Index**: ${Object.keys(zIndex).join(' < ')}`,
    `- **Breakpoints**: ${Object.entries(breakpoint)
      .map(([k, v]) => `${k} ${v}px`)
      .join(', ')} (계약 밖의 빌드 타임 상수)`,
    '',
    '전체 값과 대비비는 [Full API Reference](/llms-full.txt)의 Design Tokens 절 참고.',
  ].join('\n');
}

/**
 * `## <제목>` 절의 본문을 교체한다. 다음 `## ` 또는 문서 끝까지가 한 절이다.
 * 절이 없으면 문서 구조가 예상과 다르다는 뜻이므로 조용히 넘기지 않고 던진다.
 */
export function replaceSection(
  text: string,
  heading: string,
  body: string
): string {
  const marker = `## ${heading}\n`;
  const start = text.indexOf(marker);
  if (start === -1) {
    throw new Error(`'## ${heading}' 절을 찾을 수 없습니다`);
  }
  const next = text.indexOf('\n## ', start + marker.length);
  const end = next === -1 ? text.length : next + 1;
  return `${text.slice(0, start)}${marker}\n${body}\n\n${text.slice(end)}`;
}

/**
 * 문서에 나타난 컴포넌트 `## 제목` 집합(정렬). 컴포넌트 이름은 PascalCase 한
 * 단어라서 `## Design Tokens`처럼 공백이 있는 산문 제목과는 자동으로 구분되고,
 * 한 단어인 산문 제목만 따로 제외한다.
 */
const PROSE_HEADINGS = new Set(['Installation', 'Setup']);

export function componentHeadings(text: string): string[] {
  return [...text.matchAll(/^## (.+)$/gm)]
    .map((m) => m[1].trim())
    .filter((h) => /^[A-Z][A-Za-z]*$/.test(h) && !PROSE_HEADINGS.has(h))
    .sort();
}
