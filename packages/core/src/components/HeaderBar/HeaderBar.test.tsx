/**
 * HeaderBar. 떠 있는 둥근 바, 항목 데이터(`text` 형태), 좁은 화면 메뉴.
 * `navStyle="icon"`(근접 확대)은 `HeaderBarNav.test.tsx`가 맡는다.
 *
 * jsdom에는 레이아웃도 미디어 쿼리 평가도 없고 GSAP 티커도 안 돈다. 그래서
 * 기하와 상태 규칙은 vitest.config.ts의 css.include로 주입된 실제 생성 CSS를
 * CSSOM으로 읽고, 열림·닫힘 트윈은 패널 DOM 노드에 얹힌 `__panelTween`(테스트
 * 전용 손잡이)을 집어 `progress(1)`로 직접 seek한다. gsap은 값으로 import하지
 * 않는다(타입은 앰비언트 전역 네임스페이스, HeaderBarNav.test.tsx와 같은 선례).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import * as components from '../index';
import { HeaderBar } from './HeaderBar';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { themeContract } from '../../tokens/theme.css';
import {
  BAR_HEIGHT,
  BAR_MAX_WIDTH,
  PANEL_OFFSET_Y,
  HAMBURGER_LINE_WIDTH,
  HAMBURGER_LINE_HEIGHT,
  HAMBURGER_LINE_GAP,
} from './HeaderBar.css';

type PanelTweenHost = HTMLElement & { __panelTween?: gsap.core.Tween };

/** jsdom은 matchMedia를 구현하지 않는다. 축소 선호 경로를 열려면 깔아야 한다. */
const installReducedMotion = (matches: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    (media: string): MediaQueryList =>
      ({
        matches,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const items = [
  { label: '홈', href: '#home', active: true },
  { label: '소개', href: '#about' },
  { label: '문의' },
];

const getHamburger = (): HTMLElement =>
  screen.getByRole('button', { name: /메뉴 (열기|닫기)/ });

const getPanel = (): PanelTweenHost => {
  const id = getHamburger().getAttribute('aria-controls') ?? '';
  const panel = document.getElementById(id);
  if (!panel) throw new Error('aria-controls가 가리키는 패널이 없다');
  return panel as PanelTweenHost;
};

/** 열고 나서 트윈을 끝까지 돌려 열린 모습으로 만든다. */
const openMenu = (): PanelTweenHost => {
  fireEvent.click(getHamburger());
  const panel = getPanel();
  panel.__panelTween?.progress(1);
  return panel;
};

/**
 * vanilla-extract가 만든 CSS를 CSSOM으로 읽는다. @media 안의 규칙까지 펼쳐
 * 감싼 미디어 조건을 함께 들고 있다(Button.test.tsx의 buttonRules와 같은 모양).
 */
interface FlatRule {
  rule: CSSStyleRule;
  media: string | null;
}

function headerBarRules(): FlatRule[] {
  const sheet = Array.from(document.styleSheets).find((candidate) =>
    Array.from(candidate.cssRules).some((rule) =>
      rule.cssText.includes('HeaderBar_bar')
    )
  );
  if (!sheet) throw new Error('HeaderBar.css.ts의 스타일시트를 찾지 못했다');
  const flat: FlatRule[] = [];
  const walk = (rules: CSSRuleList, media: string | null) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, rule.media.mediaText);
      } else if (rule instanceof CSSStyleRule) {
        flat.push({ rule, media });
      }
    }
  };
  walk(sheet.cssRules, null);
  return flat;
}

/** 선택자 전체가 정규식에 맞고 감싼 미디어가 정확히 같은 규칙. 없으면 던진다. */
function ruleOf(selector: RegExp, media: string | null = null): CSSStyleRule {
  const found = headerBarRules().find(
    (flat) => selector.test(flat.rule.selectorText) && flat.media === media
  );
  if (!found) {
    throw new Error(`규칙을 찾지 못했다: ${selector} @ ${media ?? '(없음)'}`);
  }
  return found.rule;
}

/** cssstyle이 var()·일부 속성을 버려서 rule.style로는 못 읽는다. 선언 텍스트에서 읽는다. */
const decl = (rule: CSSStyleRule, prop: string): string | undefined =>
  new RegExp(String.raw`(?<![\w-])${prop}:\s*([^;}]*)`)
    .exec(rule.cssText)?.[1]
    .trim();

const HOVER_GATE = '(hover: hover) and (pointer: fine)';
const REDUCE = '(prefers-reduced-motion: reduce)';

describe('HeaderBar 렌더링', () => {
  it('기본 HeaderBar가 banner로 렌더링된다', () => {
    render(<HeaderBar title="앱" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('logo를 렌더링한다', () => {
    render(<HeaderBar logo={<img src="/logo.png" alt="Logo" />} />);
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('title을 h1로 렌더링한다', () => {
    render(<HeaderBar title="My Application" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'My Application' })
    ).toBeInTheDocument();
  });

  it('actions 영역을 렌더링한다', () => {
    render(<HeaderBar actions={<button type="button">Login</button>} />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('items가 없으면 nav도 햄버거도 패널도 없다', () => {
    render(<HeaderBar title="앱" />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /메뉴/ })
    ).not.toBeInTheDocument();
  });

  it('logo·title, 항목, actions가 DOM에서 이 순서로 놓인다', () => {
    const { container } = render(
      <HeaderBar
        logo={<img src="/logo.png" alt="Logo" />}
        title="Title"
        items={items}
        actions={<button type="button">Action</button>}
      />
    );
    const order = [
      screen.getByAltText('Logo'),
      screen.getByRole('navigation', { name: '주요 메뉴' }),
      screen.getByRole('button', { name: 'Action' }),
    ];
    const header = container.querySelector('header') as HTMLElement;
    const all = Array.from(header.querySelectorAll('*'));
    const positions = order.map((el) => all.indexOf(el));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.every((p) => p >= 0)).toBe(true);
  });

  it('className과 data-* 속성이 header에 전달된다', () => {
    render(<HeaderBar className="custom-header" data-testid="hb" />);
    expect(screen.getByTestId('hb')).toHaveClass('custom-header');
  });

  it('aria-label을 설정할 수 있다', () => {
    render(<HeaderBar aria-label="메인 헤더" />);
    expect(screen.getByRole('banner')).toHaveAttribute(
      'aria-label',
      '메인 헤더'
    );
  });
});

describe('HeaderBar 바의 기하 (CSSOM)', () => {
  it('높이 60px, 최대 폭 960px, 가운데 정렬이다', () => {
    render(<HeaderBar title="앱" />);
    expect(BAR_HEIGHT).toBe(60);
    expect(BAR_MAX_WIDTH).toBe(960);
    const bar = ruleOf(/\.HeaderBar_bar__[^\s:]+$/);
    expect(decl(bar, 'height')).toBe('60px');
    expect(decl(bar, 'max-width')).toBe('960px');
    expect(decl(bar, 'margin-left')).toBe('auto');
    expect(decl(bar, 'margin-right')).toBe('auto');
  });

  it('폭은 양쪽 spacing[4]를 뺀 100%다', () => {
    render(<HeaderBar title="앱" />);
    const width = decl(ruleOf(/\.HeaderBar_bar__[^\s:]+$/), 'width') ?? '';
    expect(width).toContain('100%');
    expect(width).toContain(themeContract.spacing[4]);
  });

  it('모서리는 borderRadius.lg, 그림자는 shadow.md다', () => {
    render(<HeaderBar title="앱" />);
    const bar = ruleOf(/\.HeaderBar_bar__[^\s:]+$/);
    expect(decl(bar, 'border-radius')).toBe(themeContract.borderRadius.lg);
    expect(decl(bar, 'box-shadow')).toBe(themeContract.shadow.md);
  });

  it('바 높이 + 위 여백만큼 header가 자리를 미리 차지한다', () => {
    render(<HeaderBar title="앱" />);
    const header = ruleOf(/\.HeaderBar_headerBar__[^\s:]+$/);
    expect(decl(header, 'padding-top')).toBe(themeContract.spacing[4]);
    // 높이는 바(60px)가 정하고 패널은 absolute라 header 높이를 바꾸지 않는다.
    expect(decl(ruleOf(/\.HeaderBar_panel__[^\s:]+$/), 'position')).toBe(
      'absolute'
    );
  });

  it('안쪽 여백은 spacing[2], 왼쪽은 spacing[4]다', () => {
    render(<HeaderBar title="앱" />);
    const bar = ruleOf(/\.HeaderBar_bar__[^\s:]+$/);
    expect(decl(bar, 'padding-left')).toBe(themeContract.spacing[4]);
    expect(decl(bar, 'padding')).toBe(themeContract.spacing[2]);
  });
});

describe('variant', () => {
  it('세 variant 클래스가 바에 붙는다', () => {
    const { rerender } = render(<HeaderBar variant="default" title="앱" />);
    const bar = () => screen.getByRole('banner').firstElementChild;
    expect(bar()).toHaveClass(/variantStyles_default/);
    rerender(<HeaderBar variant="dark" title="앱" />);
    expect(bar()).toHaveClass(/variantStyles_dark/);
    rerender(<HeaderBar variant="transparent" title="앱" />);
    expect(bar()).toHaveClass(/variantStyles_transparent/);
  });

  it('default는 background.default 면이다', () => {
    render(<HeaderBar title="앱" />);
    expect(
      decl(
        ruleOf(/\.HeaderBar_variantStyles_default__[^\s:]+$/),
        'background-color'
      )
    ).toBe(themeContract.color.background.default);
  });

  it('dark는 지금의 dark 색(text.primary 면, background.paper 글자)이다', () => {
    render(<HeaderBar variant="dark" title="앱" />);
    const dark = ruleOf(/\.HeaderBar_variantStyles_dark__[^\s:]+$/);
    expect(decl(dark, 'background-color')).toBe(
      themeContract.color.text.primary
    );
    expect(decl(dark, 'color')).toBe(themeContract.color.background.paper);
  });

  it('transparent는 면이 투명하고 그림자가 없다', () => {
    render(<HeaderBar variant="transparent" title="앱" />);
    const rule = ruleOf(/\.HeaderBar_variantStyles_transparent__[^\s:]+$/);
    expect(decl(rule, 'background-color')).toBe('transparent');
    expect(decl(rule, 'box-shadow')).toBe('none');
  });

  it('transparent여도 패널은 읽을 수 있는 면을 가진다', () => {
    render(<HeaderBar variant="transparent" items={items} />);
    expect(
      decl(
        ruleOf(/\.HeaderBar_panelVariantStyles_transparent__[^\s:]+$/),
        'background-color'
      )
    ).toBe(themeContract.color.background.default);
  });
});

describe('sticky', () => {
  it('sticky면 position: sticky, top 0이고 아니면 relative다', () => {
    const { rerender } = render(<HeaderBar sticky title="앱" />);
    expect(screen.getByRole('banner')).toHaveClass(/stickyStyles_true/);
    const on = ruleOf(/\.HeaderBar_stickyStyles_true__[^\s:]+$/);
    expect(decl(on, 'position')).toBe('sticky');
    expect(decl(on, 'top')).toBe('0');
    rerender(<HeaderBar title="앱" />);
    expect(screen.getByRole('banner')).toHaveClass(/stickyStyles_false/);
    expect(
      decl(ruleOf(/\.HeaderBar_stickyStyles_false__[^\s:]+$/), 'position')
    ).toBe('relative');
  });
});

describe('지운 표면', () => {
  it('border, elevation, children은 타입 오류다', () => {
    // 런타임은 컴파일 없이 돌아서 실패하지 않는다. 잠금은 tsc가 한다.
    // @ts-expect-error border는 지워졌다
    render(<HeaderBar border={false} />);
    // @ts-expect-error elevation은 지워졌다
    render(<HeaderBar elevation />);
    // @ts-expect-error children은 지워졌다(가운데 슬롯은 items가 맡는다)
    render(<HeaderBar>가운데</HeaderBar>);
  });

  it('HeaderBarNav는 공개 export가 아니다', () => {
    expect('HeaderBarNav' in components).toBe(false);
    // @ts-expect-error HeaderBarNav는 export되지 않는다
    expect(components.HeaderBarNav).toBeUndefined();
  });

  it('icon 형태에서 icon이 없는 항목은 타입 오류다', () => {
    // @ts-expect-error navStyle="icon"이면 모든 항목에 icon이 필요하다
    render(<HeaderBar navStyle="icon" items={[{ label: '홈' }]} />);
  });
});

describe('좁은 화면 넘침 방지 테스트', () => {
  // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못 읽는
  // 속성이 있다. 소스 텍스트에서 직접 확인한다.
  const cssSource = () =>
    readFileSync(resolve(__dirname, './HeaderBar.css.ts'), 'utf-8');

  it('title이 넘치지 않고 한 줄로 말줄임된다', () => {
    const titleBlock = cssSource().match(
      /export const title = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(titleBlock).toContain("overflow: 'hidden'");
    expect(titleBlock).toContain("textOverflow: 'ellipsis'");
    expect(titleBlock).toContain("whiteSpace: 'nowrap'");
    expect(titleBlock).toContain('minWidth: 0');
  });

  it('leftSection이 줄어들 수 있어 title이 헤더를 밀어내지 않는다', () => {
    const leftSectionBlock = cssSource().match(
      /export const leftSection = style\(\{([\s\S]*?)\}\);/
    )?.[1];
    expect(leftSectionBlock).toContain('flexShrink: 1');
    expect(leftSectionBlock).toContain('minWidth: 0');
  });

  it('centerSection이 minWidth: 0으로 flex 기본 넘침을 막는다', () => {
    const centerSectionBlock = cssSource().match(
      /export const centerSection = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(centerSectionBlock).toContain('minWidth: 0');
  });
});

describe('navStyle="text" 항목', () => {
  it('href가 있으면 링크, 없으면 버튼이다', () => {
    render(<HeaderBar items={items} />);
    const nav = screen.getByRole('navigation', { name: '주요 메뉴' });
    expect(within(nav).getByRole('link', { name: '홈' })).toHaveAttribute(
      'href',
      '#home'
    );
    expect(
      within(nav).getByRole('button', { name: '문의' })
    ).toBeInTheDocument();
  });

  it('active 항목만 aria-current="page"를 갖는다', () => {
    render(<HeaderBar items={items} />);
    const nav = screen.getByRole('navigation', { name: '주요 메뉴' });
    expect(within(nav).getByRole('link', { name: '홈' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(nav).getByRole('link', { name: '소개' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('버튼 항목을 누르면 onClick이 불린다', () => {
    const onClick = vi.fn();
    render(<HeaderBar items={[{ label: '문의', onClick }]} />);
    const nav = screen.getByRole('navigation', { name: '주요 메뉴' });
    fireEvent.click(within(nav).getByRole('button', { name: '문의' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('밑줄은 글자 아래 2px 선이고 왼쪽 원점에서 scaleX 0으로 쉰다', () => {
    render(<HeaderBar items={items} />);
    const line = ruleOf(/\.HeaderBar_textLabel__[^\s:]+::after$/);
    expect(decl(line, 'height')).toBe('2px');
    expect(decl(line, 'transform')).toBe('scaleX(0)');
    expect(decl(line, 'transform-origin')).toBe('left');
  });

  it('나갈 때는 fast settle, 들어올 때는 base settle이다', () => {
    render(<HeaderBar items={items} />);
    const rest = ruleOf(/\.HeaderBar_textLabel__[^\s:]+::after$/);
    expect(decl(rest, 'transition')).toContain(
      themeContract.animation.duration.fast
    );
    expect(decl(rest, 'transition')).toContain(
      themeContract.animation.easing.settle
    );
    const enter = ruleOf(
      /:hover \.HeaderBar_textLabel__[^\s:]+::after$/,
      HOVER_GATE
    );
    expect(decl(enter, 'transition-duration')).toBe(
      themeContract.animation.duration.base
    );
  });

  it('호버로 그어지는 규칙은 전부 (hover: hover) and (pointer: fine) 안에 있다', () => {
    render(<HeaderBar items={items} />);
    const hovers = headerBarRules().filter(({ rule }) =>
      /\.HeaderBar_textItem__[^\s]*:hover/.test(rule.selectorText)
    );
    expect(hovers.length).toBeGreaterThan(0);
    for (const { media, rule } of hovers) {
      expect(media, rule.selectorText).toBe(HOVER_GATE);
      expect(decl(rule, 'transform'), rule.selectorText).toBe('scaleX(1)');
    }
  });

  it('키보드 포커스(:focus-visible)는 호버 게이트 밖에서 밑줄을 긋는다', () => {
    render(<HeaderBar items={items} />);
    const focus = ruleOf(
      /:focus-visible \.HeaderBar_textLabel__[^\s:]+::after$/
    );
    expect(decl(focus, 'transform')).toBe('scaleX(1)');
  });

  it('active 항목은 밑줄이 늘 그어져 있다', () => {
    render(<HeaderBar items={items} />);
    const current = headerBarRules().find(
      ({ rule, media }) =>
        media === null &&
        /\[aria-current="page"\] \.HeaderBar_textLabel__[^\s:]+::after$/.test(
          rule.selectorText
        )
    );
    expect(current && decl(current.rule, 'transform')).toBe('scaleX(1)');
  });

  it('축소 선호에서는 밑줄 전이가 없다', () => {
    render(<HeaderBar items={items} />);
    const reduced = ruleOf(/\.HeaderBar_textLabel__[^\s:]+::after$/, REDUCE);
    expect(decl(reduced, 'transition')).toBe('none');
  });
});

describe('좁은 화면 (768px 미만) 규칙 (CSSOM)', () => {
  it('항목은 down.md에서 숨고 햄버거는 up.md에서 숨는다', () => {
    render(<HeaderBar items={items} />);
    const media = headerBarRules();
    const hiddenNarrow = media.find(
      ({ rule, media: m }) =>
        /\.HeaderBar_centerSection__/.test(rule.selectorText) &&
        m?.includes('max-width')
    );
    expect(hiddenNarrow && decl(hiddenNarrow.rule, 'display')).toBe('none');
    const hiddenWide = media.find(
      ({ rule, media: m }) =>
        /\.HeaderBar_hamburger__[^\s:]+$/.test(rule.selectorText) &&
        m?.includes('min-width')
    );
    expect(hiddenWide && decl(hiddenWide.rule, 'display')).toBe('none');
  });

  it('햄버거 선은 24 x 2px, 간격 6px이다', () => {
    render(<HeaderBar items={items} />);
    expect(HAMBURGER_LINE_WIDTH).toBe(24);
    expect(HAMBURGER_LINE_HEIGHT).toBe(2);
    expect(HAMBURGER_LINE_GAP).toBe(6);
    const line = ruleOf(/\.HeaderBar_hamburgerLine__[^\s:]+$/);
    expect(decl(line, 'width')).toBe('24px');
    expect(decl(line, 'height')).toBe('2px');
    expect(decl(ruleOf(/\.HeaderBar_hamburger__[^\s:]+$/), 'gap')).toBe('6px');
  });

  it('열리면 두 선이 translateY ±4px + rotate ±45deg로 모이고 slow settle이다', () => {
    render(<HeaderBar items={items} />);
    const top = ruleOf(
      /\[aria-expanded="true"\] \.HeaderBar_hamburgerLineTop__[^\s:]+$/
    );
    const bottom = ruleOf(
      /\[aria-expanded="true"\] \.HeaderBar_hamburgerLineBottom__[^\s:]+$/
    );
    expect(decl(top, 'transform')).toBe('translateY(4px) rotate(45deg)');
    expect(decl(bottom, 'transform')).toBe('translateY(-4px) rotate(-45deg)');
    const rest = ruleOf(/\.HeaderBar_hamburgerLine__[^\s:]+$/);
    expect(decl(rest, 'transition')).toContain(
      themeContract.animation.duration.slow
    );
    expect(decl(rest, 'transition')).toContain(
      themeContract.animation.easing.settle
    );
  });

  it('패널은 바 아래에 겹쳐 뜨고(absolute) 바와 같은 모서리·그림자를 쓴다', () => {
    render(<HeaderBar items={items} />);
    const panel = ruleOf(/\.HeaderBar_panel__[^\s:]+$/);
    expect(decl(panel, 'position')).toBe('absolute');
    expect(decl(panel, 'border-radius')).toBe(themeContract.borderRadius.lg);
    expect(decl(panel, 'box-shadow')).toBe(themeContract.shadow.md);
    expect(decl(panel, 'visibility')).toBe('hidden');
    expect(decl(panel, 'opacity')).toBe('0');
    expect(PANEL_OFFSET_Y).toBe(8);
    expect(decl(panel, 'transform')).toBe(`translateY(${PANEL_OFFSET_Y}px)`);
  });

  it('패널은 up.md에서 숨는다(넓어지면 열린 채 남지 않는다)', () => {
    render(<HeaderBar items={items} />);
    const wide = headerBarRules().find(
      ({ rule, media }) =>
        /\.HeaderBar_panel__[^\s:]+$/.test(rule.selectorText) &&
        media?.includes('min-width')
    );
    expect(wide && decl(wide.rule, 'display')).toBe('none');
  });
});

describe('좁은 화면 메뉴 동작', () => {
  it('햄버거는 닫힘이 기본이고 aria-controls가 패널을 가리킨다', () => {
    render(<HeaderBar items={items} />);
    const hamburger = getHamburger();
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    expect(hamburger).toHaveAccessibleName('메뉴 열기');
    expect(getPanel()).toBeInTheDocument();
  });

  it('누르면 aria-expanded가 true, 이름이 "메뉴 닫기"가 된다', () => {
    render(<HeaderBar items={items} />);
    fireEvent.click(getHamburger());
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'true');
    expect(getHamburger()).toHaveAccessibleName('메뉴 닫기');
  });

  it('열림은 opacity 0 -> 1, y 8 -> 0, base settle이다', () => {
    render(<HeaderBar items={items} />);
    fireEvent.click(getHamburger());
    const tween = getPanel().__panelTween;
    expect(tween).toBeDefined();
    expect(tween?.duration()).toBeCloseTo(gsapDuration.base);
    expect(tween?.vars.ease).toBe(gsapEasing.settle);
    expect(tween?.vars.y).toBe(0);
    expect(tween?.vars.autoAlpha).toBe(1);
  });

  it('열림이 끝나면 패널이 보이고 y가 0이다', () => {
    render(<HeaderBar items={items} />);
    const panel = openMenu();
    expect(panel.style.opacity).toBe('1');
    expect(panel.style.visibility).not.toBe('hidden');
    expect(within(panel).getByRole('link', { name: '홈' })).toBeInTheDocument();
  });

  it('닫힘은 fast settle로 opacity 0, y 8에 돌아간다', () => {
    render(<HeaderBar items={items} />);
    const panel = openMenu();
    fireEvent.click(getHamburger());
    const tween = panel.__panelTween;
    expect(tween?.duration()).toBeCloseTo(gsapDuration.fast);
    expect(tween?.vars.ease).toBe(gsapEasing.settle);
    expect(tween?.vars.y).toBe(PANEL_OFFSET_Y);
    tween?.progress(1);
    expect(panel.style.opacity).toBe('0');
    expect(panel.style.visibility).toBe('hidden');
  });

  it('active 항목은 패널에서도 aria-current="page"다', () => {
    render(<HeaderBar items={items} />);
    const panel = openMenu();
    expect(within(panel).getByRole('link', { name: '홈' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('Esc로 닫히고 포커스가 햄버거로 돌아간다', () => {
    render(<HeaderBar items={items} />);
    const panel = openMenu();
    within(panel).getByRole('link', { name: '소개' }).focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
    expect(getHamburger()).toHaveFocus();
    expect(panel.__panelTween?.duration()).toBeCloseTo(gsapDuration.fast);
  });

  it('닫혀 있을 때 Esc는 아무 일도 하지 않는다', () => {
    render(<HeaderBar items={items} />);
    const before = getPanel().__panelTween;
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getPanel().__panelTween).toBe(before);
    expect(getHamburger()).not.toHaveFocus();
  });

  it('판 밖을 누르면 닫힌다', () => {
    render(
      <>
        <button type="button">바깥</button>
        <HeaderBar items={items} />
      </>
    );
    openMenu();
    fireEvent.mouseDown(screen.getByRole('button', { name: '바깥' }));
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('판 안이나 햄버거를 누르는 mousedown은 닫지 않는다', () => {
    render(<HeaderBar items={items} />);
    const panel = openMenu();
    fireEvent.mouseDown(within(panel).getByRole('link', { name: '소개' }));
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'true');
    // 햄버거의 mousedown이 먼저 닫아 버리면 이어지는 click이 다시 열어 버린다.
    fireEvent.mouseDown(getHamburger());
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('항목을 누르면 onClick이 불리고 닫힌다', () => {
    const onClick = vi.fn();
    render(
      <HeaderBar
        items={[
          { label: '홈', href: '#home' },
          { label: '문의', onClick },
        ]}
      />
    );
    const panel = openMenu();
    fireEvent.click(within(panel).getByRole('button', { name: '문의' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
    expect(getHamburger()).toHaveFocus();
  });

  it('링크 항목을 눌러도 닫힌다', () => {
    render(<HeaderBar items={items} />);
    const panel = openMenu();
    fireEvent.click(within(panel).getByRole('link', { name: '소개' }));
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('다시 누르면 닫힌다', () => {
    render(<HeaderBar items={items} />);
    openMenu();
    fireEvent.click(getHamburger());
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('닫힌 뒤에는 document 리스너가 남지 않는다', () => {
    render(<HeaderBar items={items} />);
    openMenu();
    fireEvent.click(getHamburger());
    const after = getPanel().__panelTween;
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);
    expect(getPanel().__panelTween).toBe(after);
  });

  it('축소 선호면 열림이 트윈 없이 바로 끝 상태다', () => {
    installReducedMotion(true);
    render(<HeaderBar items={items} />);
    fireEvent.click(getHamburger());
    const panel = getPanel();
    // progress를 부르지 않았다. 게이트가 끝 상태로 확정했다.
    expect(panel.style.opacity).toBe('1');
    expect(panel.style.visibility).not.toBe('hidden');
    fireEvent.click(getHamburger());
    expect(panel.style.opacity).toBe('0');
    expect(panel.style.visibility).toBe('hidden');
  });

  it('열려 있는 동안 축소 선호가 켜지면 진행 중인 트윈이 끝 상태로 확정된다', () => {
    installReducedMotion(false);
    const { rerender } = render(<HeaderBar items={items} />);
    fireEvent.click(getHamburger());
    const panel = getPanel();
    panel.__panelTween?.progress(0.3);
    installReducedMotion(true);
    rerender(<HeaderBar items={[...items]} />);
    expect(panel.style.opacity).toBe('1');
  });
});
