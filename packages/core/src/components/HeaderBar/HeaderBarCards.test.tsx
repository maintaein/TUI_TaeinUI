/**
 * HeaderBar의 카드 펼침(`navStyle="cards"`). M5 task-24 3부.
 *
 * jsdom에는 레이아웃도 GSAP 티커도 없다. 타임라인은 면 DOM 노드에 얹힌
 * `__cardsTimeline` 손잡이를 집어 `time()`·`progress()`로 직접 seek하고 결과는 요소의
 * 인라인 스타일로 읽는다. gsap은 값으로 import하지 않는다(타입은 앰비언트 전역
 * 네임스페이스, HeaderBar.test.tsx와 같은 선례). 높이를 재는 `scrollHeight`는 jsdom이
 * 늘 0이라 환경으로 보급한다(HeaderBarForms.test.tsx의 getBoundingClientRect 보급과
 * 같은 선례). 넓은/좁은 화면 판정은 matchMedia 스텁이 쿼리 글자를 보고 답한다.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { HeaderBar } from './HeaderBar';
import { gsapDuration } from '../../tokens/gsapEasing';
import { themeContract } from '../../tokens/theme.css';
import {
  BAR_HEIGHT,
  CARDS_OPEN_HEIGHT,
  CARDS_RISE_Y,
  CARDS_STAGGER,
  CARDS_START_RATIO,
} from './HeaderBar.css';

// 카드를 그릴 때 GSAP이 클래스가 붙은 요소의 getComputedStyle을 읽는데, jsdom은 이를 전체
// 스타일시트를 훑어 계산해 한 번 렌더에 0.5~1.3초가 든다(혼자 돌릴 때 가장 느린 시험이
// 1.3초). 전체 시험이 병렬로 돌 때 5초 기본값을 넘기는 일이 있어 이 파일만 늘린다
// (HeaderBarForms.test.tsx와 같은 방식과 이유).
vi.setConfig({ testTimeout: 20000 });

type CardsHost = HTMLElement & { __cardsTimeline?: gsap.core.Timeline };

interface MediaState {
  reduced: boolean;
  narrow: boolean;
}

/** 쿼리 글자를 보고 답한다: 축소 선호 / max-width(좁은 화면) / 그 밖은 false. */
const installMedia = (state: Partial<MediaState> = {}): MediaState => {
  const current: MediaState = { reduced: false, narrow: false, ...state };
  vi.stubGlobal(
    'matchMedia',
    (media: string): MediaQueryList =>
      ({
        matches: media.includes('prefers-reduced-motion')
          ? current.reduced
          : media.includes('max-width')
            ? current.narrow
            : false,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );
  return current;
};

interface LayerSnapshot {
  position: string;
  height: string;
  visibility: string;
}

/** 재는 순간(scrollHeight를 읽는 순간)의 카드 층 인라인 스타일을 적어 둔다. */
let measured: LayerSnapshot[] = [];

/** jsdom의 scrollHeight는 늘 0이다. 카드 층이 읽힐 때 value를 돌려 준다. */
const supplyScrollHeight = (value: number): void => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      if (this.getAttribute('aria-label') === '메뉴 목록') {
        measured.push({
          position: this.style.position,
          height: this.style.height,
          visibility: this.style.visibility,
        });
      }
      return value;
    },
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight;
  measured = [];
});

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

function ruleOf(selector: RegExp, media: string | null = null): CSSStyleRule {
  const found = headerBarRules().find(
    (flat) => selector.test(flat.rule.selectorText) && flat.media === media
  );
  if (!found) {
    throw new Error(`규칙을 찾지 못했다: ${selector} @ ${media ?? '(없음)'}`);
  }
  return found.rule;
}

/** 감싼 미디어 글자에 `part`가 들어 있는 규칙(min-width / max-width 구분용). */
function ruleIn(selector: RegExp, part: string): CSSStyleRule {
  const found = headerBarRules().find(
    (flat) =>
      selector.test(flat.rule.selectorText) && flat.media?.includes(part)
  );
  if (!found) throw new Error(`규칙을 찾지 못했다: ${selector} @ ${part}`);
  return found.rule;
}

const decl = (rule: CSSStyleRule, prop: string): string | undefined =>
  new RegExp(String.raw`(?<![\w-])${prop}:\s*([^;}]*)`)
    .exec(rule.cssText)?.[1]
    .trim();

const HOVER_GATE = '(hover: hover) and (pointer: fine)';

const cardItems = [
  {
    label: '회사 소개',
    links: [
      { label: '비전', href: '#vision' },
      { label: '팀', onClick: () => {} },
    ],
  },
  {
    label: '프로젝트',
    links: [
      { label: '특징', href: '#featured' },
      { label: '사례', href: '#cases' },
    ],
  },
  {
    label: '연락',
    links: [{ label: '이메일', href: '#mail' }],
  },
];

const getHamburger = (): HTMLElement =>
  screen.getByRole('button', { name: /메뉴 (열기|닫기)/ });

const getSurface = (): CardsHost => {
  const id = getHamburger().getAttribute('aria-controls') ?? '';
  const surface = document.getElementById(id);
  if (!surface) throw new Error('aria-controls가 가리키는 면이 없다');
  return surface as CardsHost;
};

// 숨은 층 안은 접근 이름이 비어 이름으로는 못 집는다. 구조로 집는다.
const getLayer = (): HTMLElement => {
  const layer = getSurface().querySelector('nav');
  if (!layer) throw new Error('카드 층이 없다');
  return layer;
};

const getCards = (): HTMLElement[] =>
  Array.from(getLayer().querySelectorAll<HTMLElement>('[role="group"]'));

/** 햄버거를 눌러 층을 보이게 한다(접근 이름으로 집으려면 보여야 한다). */
const openCards = (): void => {
  fireEvent.click(getHamburger());
};

const timelineOf = (): gsap.core.Timeline => {
  const timeline = getSurface().__cardsTimeline;
  if (!timeline) throw new Error('__cardsTimeline 손잡이가 없다');
  return timeline;
};

/** transform의 y(px)와 opacity를 읽는다. */
const cardY = (card: HTMLElement): number => {
  const match = /translate(?:3d)?\(([-\d.e]+)px,\s*([-\d.e]+)px/.exec(
    card.style.transform
  );
  return match ? Number(match[2]) : 0;
};
const cardOpacity = (card: HTMLElement): number => Number(card.style.opacity);
const surfaceHeight = (): number =>
  Number.parseFloat(getSurface().style.height);

/** power3.out(settle)은 네제곱 감속이라 반 지점에서 1 - (1 - 0.5)^4 */
const SETTLE_HALF = 0.9375;
const SLOW = gsapDuration.slow;

describe('navStyle="cards" 마크업', () => {
  it('바 안에 가운데 항목 nav가 없다(항목은 카드에만 있다)', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    openCards();
    expect(screen.queryByRole('navigation', { name: '주요 메뉴' })).toBeNull();
    expect(document.querySelectorAll('nav')).toHaveLength(1);
  });

  it('좁은 화면 세로 목록 판을 따로 그리지 않는다(카드 층 하나뿐)', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const layer = getLayer();
    expect(getSurface().contains(layer)).toBe(true);
    expect(layer.className).toMatch(/cardsLayer/);
    expect(document.querySelector('[class*="HeaderBar_panel__"]')).toBeNull();
  });

  it('면은 바의 마지막 자식이고 햄버거가 그 앞에 있다(탭 순서)', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const surface = getSurface();
    const bar = surface.parentElement as HTMLElement;
    expect(bar.lastElementChild).toBe(surface);
    expect(
      getHamburger().compareDocumentPosition(surface) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('카드 수는 항목 수와 같다(자르지 않는다)', () => {
    const five = [...cardItems, { label: '넷째' }, { label: '다섯째' }];
    render(<HeaderBar navStyle="cards" items={five} />);
    expect(getCards()).toHaveLength(5);
  });

  it('카드는 role="group"이고 제목에 연결된다', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const card = getCards()[0];
    const titleId = card.getAttribute('aria-labelledby') ?? '';
    expect(document.getElementById(titleId)).toHaveTextContent('회사 소개');
    openCards();
    expect(screen.getByRole('group', { name: '프로젝트' })).toBeInTheDocument();
  });

  it('링크는 href면 <a>, 아니면 <button>이다', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    openCards();
    const card = getCards()[0];
    expect(within(card).getByRole('link', { name: '비전' })).toHaveAttribute(
      'href',
      '#vision'
    );
    expect(within(card).getByRole('button', { name: '팀' })).toHaveAttribute(
      'type',
      'button'
    );
  });

  it('링크 앞에 오른쪽 위 화살표가 있다', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    openCards();
    const link = within(getCards()[0]).getByRole('link', { name: '비전' });
    const arrow = link.firstElementChild as Element;
    expect(arrow.getAttribute('data-icon')).toBe('arrow-up-right');
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
  });

  it('links가 없는 항목은 제목 자리에 그 항목 자체가 <a>/<button>으로 선다', () => {
    render(
      <HeaderBar
        navStyle="cards"
        items={[
          { label: '문의', href: '#contact' },
          { label: '후원', onClick: () => {} },
        ]}
      />
    );
    openCards();
    const group = screen.getByRole('group', { name: '문의' });
    const link = within(group).getByRole('link', { name: '문의' });
    expect(link).toHaveAttribute('href', '#contact');
    expect(group.getAttribute('aria-labelledby')).toBe(link.id);
    expect(
      within(screen.getByRole('group', { name: '후원' })).getByRole('button', {
        name: '후원',
      })
    ).toBeInTheDocument();
    expect(within(group).queryByRole('list')).toBeNull();
  });

  it('active 항목은 aria-current="page"를 가진다', () => {
    render(
      <HeaderBar
        navStyle="cards"
        items={[{ label: '홈', href: '#', active: true }]}
      />
    );
    openCards();
    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('items가 없으면 햄버거도 면도 없다', () => {
    render(<HeaderBar navStyle="cards" />);
    expect(screen.queryByRole('button', { name: /메뉴/ })).toBeNull();
  });
});

describe('navStyle="cards" 기하 (CSSOM)', () => {
  it('면: 바 위·왼쪽·오른쪽에 붙은 absolute, 쉴 때 높이 60, 모서리 lg, 그림자 md, 넘침 자름', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const surface = ruleOf(/\.HeaderBar_cardsSurface__[^\s:]+$/);
    expect(decl(surface, 'position')).toBe('absolute');
    expect(decl(surface, 'top')).toBe('0');
    expect(decl(surface, 'left')).toBe('0');
    expect(decl(surface, 'right')).toBe('0');
    expect(decl(surface, 'height')).toBe(`${BAR_HEIGHT}px`);
    expect(decl(surface, 'border-radius')).toBe(themeContract.borderRadius.lg);
    expect(decl(surface, 'box-shadow')).toBe(themeContract.shadow.md);
    expect(decl(surface, 'overflow')).toBe('hidden');
  });

  it('면은 바 뒤(z-index -1)에 깔리고, 바가 쌓임 맥락(isolation)을 만든다', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    expect(decl(ruleOf(/\.HeaderBar_cardsSurface__[^\s:]+$/), 'z-index')).toBe(
      '-1'
    );
    expect(decl(ruleOf(/\.HeaderBar_barCards__[^\s:]+$/), 'isolation')).toBe(
      'isolate'
    );
  });

  it('바는 자기 배경과 그림자를 없앤다(면이 대신 그린다)', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const bar = ruleOf(/\.HeaderBar_barCards__[^\s:]+$/);
    expect(decl(bar, 'background-color')).toBe('transparent');
    expect(decl(bar, 'box-shadow')).toBe('none');
    expect(getSurface().parentElement).toHaveClass(/barCards/);
  });

  it('바 클래스는 cards에서만 붙는다', () => {
    render(<HeaderBar navStyle="pill" items={cardItems} />);
    expect(document.querySelector('[class*="barCards"]')).toBeNull();
  });

  it('햄버거는 넓은 화면에서도 보인다(up.md에서 display를 되돌린다)', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const wide = ruleIn(/\.HeaderBar_hamburgerAlways__[^\s:]+$/, 'min-width');
    expect(decl(wide, 'display')).toBe('inline-flex');
    expect(getHamburger()).toHaveClass(/hamburgerAlways/);
  });

  it('다른 형태의 햄버거에는 그 클래스가 없다', () => {
    render(<HeaderBar navStyle="pill" items={cardItems} />);
    expect(getHamburger().className).not.toMatch(/hamburgerAlways/);
  });

  it('카드 층: 면 안 absolute, 위 60, 좌우 0, 안쪽 여백 spacing[2], 닫힘이 기본', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const layer = ruleOf(/\.HeaderBar_cardsLayer__[^\s:]+$/);
    expect(decl(layer, 'position')).toBe('absolute');
    expect(decl(layer, 'top')).toBe(`${BAR_HEIGHT}px`);
    expect(decl(layer, 'left')).toBe('0');
    expect(decl(layer, 'right')).toBe('0');
    expect(decl(layer, 'padding')).toBe(themeContract.spacing[2]);
    expect(decl(layer, 'box-sizing')).toBe('border-box');
    expect(decl(layer, 'visibility')).toBe('hidden');
  });

  it('넓은 화면: 카드가 가로로 늘어서고 사이 spacing[3], 카드는 층을 꽉 채운다', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const layer = ruleOf(/\.HeaderBar_cardsLayer__[^\s:]+$/);
    expect(decl(layer, 'display')).toBe('flex');
    expect(decl(layer, 'flex-direction')).toBe('row');
    expect(decl(layer, 'gap')).toBe(themeContract.spacing[3]);
    expect(decl(layer, 'align-items')).toBe('stretch');
    expect(decl(ruleOf(/\.HeaderBar_card__[^\s:]+$/), 'flex')).toBe('1 1 0');
  });

  it('좁은 화면: 세로로 쌓이고 사이 spacing[2], 카드 높이는 내용대로(최소 60)', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const layer = ruleIn(/\.HeaderBar_cardsLayer__[^\s:]+$/, 'max-width');
    expect(decl(layer, 'flex-direction')).toBe('column');
    expect(decl(layer, 'gap')).toBe(themeContract.spacing[2]);
    const card = ruleIn(/\.HeaderBar_card__[^\s:]+$/, 'max-width');
    expect(decl(card, 'flex')).toBe('none');
    expect(decl(card, 'min-height')).toBe(`${BAR_HEIGHT}px`);
  });

  it('카드: 모서리는 바 모서리에서 안쪽 여백을 뺀 동심원, 안쪽 여백 spacing[3] spacing[4], 세로 배치', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const card = ruleOf(/\.HeaderBar_card__[^\s:]+$/);
    expect(decl(card, 'border-radius')).toBe(
      `calc(${themeContract.borderRadius.lg} - ${themeContract.spacing[2]})`
    );
    expect(decl(card, 'padding')).toBe(
      `${themeContract.spacing[3]} ${themeContract.spacing[4]}`
    );
    expect(decl(card, 'display')).toBe('flex');
    expect(decl(card, 'flex-direction')).toBe('column');
  });

  it('제목: 넓은 화면 xl, 좁은 화면 lg, 굵기 medium', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const title = ruleOf(/\.HeaderBar_cardTitle__[^\s:]+$/);
    expect(decl(title, 'font-size')).toBe(themeContract.font.size.xl);
    expect(decl(title, 'font-weight')).toBe(
      String(themeContract.font.weight.medium)
    );
    expect(
      decl(ruleIn(/\.HeaderBar_cardTitle__[^\s:]+$/, 'max-width'), 'font-size')
    ).toBe(themeContract.font.size.lg);
  });

  it('링크 목록은 카드 아래(margin-top auto), 링크 사이 2px, 링크 글자 base(brief의 font.size.md는 토큰에 없다)', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const list = ruleOf(/\.HeaderBar_cardLinks__[^\s:]+$/);
    expect(decl(list, 'margin-top')).toBe('auto');
    expect(decl(list, 'gap')).toBe('2px');
    expect(decl(list, 'list-style')).toBe('none');
    expect(decl(ruleOf(/\.HeaderBar_cardLink__[^\s:]+$/), 'font-size')).toBe(
      themeContract.font.size.base
    );
  });

  it('링크 호버는 opacity 0.75, base settle이고 호버 게이트 안에 있다', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const rest = ruleOf(/\.HeaderBar_cardLink__[^\s:]+$/);
    expect(decl(rest, 'transition')).toContain('opacity');
    expect(decl(rest, 'transition')).toContain(
      themeContract.animation.duration.base
    );
    expect(decl(rest, 'transition')).toContain(
      themeContract.animation.easing.settle
    );
    const hover = ruleOf(/\.HeaderBar_cardLink__[^\s:]+:hover$/, HOVER_GATE);
    expect(decl(hover, 'opacity')).toBe('0.75');
    expect(
      headerBarRules().filter(
        ({ rule, media }) =>
          /cardLink__[^\s:]+:hover$/.test(rule.selectorText) &&
          media !== HOVER_GATE
      )
    ).toHaveLength(0);
  });

  it('variant 색: default·transparent는 surface.hover 카드에 text.primary 글자', () => {
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const vars = ruleOf(
      /\.HeaderBar_cardsVariantStyles_default__[^\s:]+$/
    ).cssText;
    expect(vars).toContain(themeContract.color.surface.hover);
    expect(vars).toContain(themeContract.color.text.primary);
    expect(vars).toContain(themeContract.color.background.default);
    expect(
      ruleOf(/\.HeaderBar_cardsVariantStyles_transparent__[^\s:]+$/).cssText
    ).toContain(themeContract.color.surface.hover);
  });

  it('variant 색: dark는 text.secondary 카드에 text.inverse 글자, 면은 text.primary', () => {
    render(<HeaderBar navStyle="cards" variant="dark" items={cardItems} />);
    const vars = ruleOf(
      /\.HeaderBar_cardsVariantStyles_dark__[^\s:]+$/
    ).cssText;
    expect(vars).toContain(themeContract.color.text.secondary);
    expect(vars).toContain(themeContract.color.text.inverse);
    expect(vars).not.toContain(themeContract.color.surface.hover);
    expect(
      decl(ruleOf(/cardsVariantStyles_dark__[^\s:]+$/), 'background-color')
    ).toBe(themeContract.color.text.primary);
    expect(getSurface()).toHaveClass(/cardsVariantStyles_dark/);
  });

  it('variant transparent: 면은 투명이고 그림자가 없다', () => {
    render(
      <HeaderBar navStyle="cards" variant="transparent" items={cardItems} />
    );
    const rule = ruleOf(/cardsVariantStyles_transparent__[^\s:]+$/);
    expect(decl(rule, 'background-color')).toBe('transparent');
    expect(decl(rule, 'box-shadow')).toBe('none');
  });
});

describe('navStyle="cards" 타임라인', () => {
  it('마운트하면 멈춰 있고 0이며 면은 60px, 카드는 y 50에 투명, 층은 숨김이다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const timeline = timelineOf();
    expect(timeline.paused()).toBe(true);
    expect(timeline.progress()).toBe(0);
    expect(getSurface().style.height).toBe(`${BAR_HEIGHT}px`);
    expect(CARDS_RISE_Y).toBe(50);
    for (const card of getCards()) {
      expect(cardY(card)).toBe(CARDS_RISE_Y);
      expect(cardOpacity(card)).toBe(0);
    }
    expect(getLayer().style.visibility).toBe('hidden');
  });

  it('길이 = 면 slow + 시차 + 카드 slow (카드 셋이면 225 + 300 + 160ms = 685ms)', () => {
    supplyScrollHeight(100);
    expect(CARDS_STAGGER).toBe(0.08);
    expect(CARDS_START_RATIO).toBe(3 / 4);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    expect(timelineOf().duration()).toBeCloseTo(
      SLOW * 0.75 + 2 * 0.08 + SLOW,
      5
    );
    expect(timelineOf().duration()).toBeCloseTo(0.685, 5);
  });

  it('카드 둘이면 길이는 225 + 80 + 300ms다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems.slice(0, 2)} />);
    expect(timelineOf().duration()).toBeCloseTo(0.605, 5);
  });

  it('면은 slow settle로 자란다: 반 지점에서 settle의 비율만큼 와 있다', () => {
    supplyScrollHeight(300);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const timeline = timelineOf();
    timeline.time(SLOW / 2);
    // 끝값 360(= 60 + 300)
    expect(surfaceHeight()).toBeCloseTo(60 + (360 - 60) * SETTLE_HALF, 0);
    timeline.time(SLOW);
    expect(surfaceHeight()).toBeCloseTo(360, 1);
  });

  it('카드는 면 slow의 3/4 지점에서 솟기 시작한다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const timeline = timelineOf();
    const [first] = getCards();
    timeline.time(SLOW * 0.75);
    expect(cardOpacity(first)).toBe(0);
    expect(cardY(first)).toBe(50);
    timeline.time(SLOW * 0.75 + 0.01);
    expect(cardOpacity(first)).toBeGreaterThan(0);
    expect(cardY(first)).toBeLessThan(50);
  });

  it('카드는 y 50 -> 0, 불투명 0 -> 1을 slow settle로 한다(첫 카드 반 지점)', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const timeline = timelineOf();
    const [first] = getCards();
    timeline.time(SLOW * 0.75 + SLOW / 2);
    expect(cardOpacity(first)).toBeCloseTo(SETTLE_HALF, 2);
    expect(cardY(first)).toBeCloseTo(50 * (1 - SETTLE_HALF), 1);
    timeline.progress(1);
    for (const card of getCards()) {
      expect(cardOpacity(card)).toBe(1);
      expect(cardY(card)).toBe(0);
    }
  });

  it('카드 사이 시차는 80ms다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const timeline = timelineOf();
    const [first, second, third] = getCards();
    const start = SLOW * 0.75;
    timeline.time(start + 0.08);
    expect(cardOpacity(first)).toBeGreaterThan(0);
    expect(cardOpacity(second)).toBe(0);
    timeline.time(start + 0.08 + 0.01);
    expect(cardOpacity(second)).toBeGreaterThan(0);
    expect(cardOpacity(third)).toBe(0);
    timeline.time(start + 0.16 + 0.01);
    expect(cardOpacity(third)).toBeGreaterThan(0);
  });

  it('넓은 화면 끝값은 max(260, 잰 값)이다: 잰 값이 작으면 260', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    expect(CARDS_OPEN_HEIGHT).toBe(260);
    timelineOf().progress(1);
    expect(getSurface().style.height).toBe('260px');
  });

  it('넓은 화면 끝값은 잰 값이 260을 넘으면 잰 값이다(60 + 층 내용 높이)', () => {
    supplyScrollHeight(300);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    timelineOf().progress(1);
    expect(getSurface().style.height).toBe('360px');
  });

  it('좁은 화면 끝값은 잰 값 그대로다(260으로 올리지 않는다)', () => {
    installMedia({ narrow: true });
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    timelineOf().progress(1);
    expect(getSurface().style.height).toBe('160px');
  });

  it('카드 층 높이는 끝값에서 60을 뺀 값으로 고정된다', () => {
    supplyScrollHeight(300);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    expect(getLayer().style.height).toBe('300px');
  });

  it('잴 때는 층을 잠깐 보이게 펴서 읽고 원래대로 되돌린다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    expect(measured.length).toBeGreaterThan(0);
    expect(measured[0]).toEqual({
      position: 'static',
      height: 'auto',
      visibility: 'visible',
    });
    const layer = getLayer();
    expect(layer.style.position).toBe('');
    expect(layer.style.visibility).toBe('hidden');
    expect(layer.style.height).toBe('200px');
  });

  it('열면 층이 보이고 play()로 앞으로 간다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    const timeline = timelineOf();
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'true');
    expect(getLayer().style.visibility).toBe('visible');
    expect(timeline.paused()).toBe(false);
    expect(timeline.reversed()).toBe(false);
  });

  it('닫으면 reverse()로 거꾸로 간다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    timelineOf().progress(1);
    fireEvent.click(getHamburger());
    expect(timelineOf().reversed()).toBe(true);
    expect(timelineOf().paused()).toBe(false);
  });

  it('닫는 도중에 다시 열면 지금 자리에서 앞으로 간다(처음으로 튀지 않는다)', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const timeline = timelineOf();
    fireEvent.click(getHamburger());
    timeline.time(0.4);
    fireEvent.click(getHamburger());
    expect(timeline.reversed()).toBe(true);
    expect(timeline.time()).toBeCloseTo(0.4, 1);
    fireEvent.click(getHamburger());
    expect(timeline.reversed()).toBe(false);
    expect(timeline.time()).toBeCloseTo(0.4, 1);
  });

  it('여는 도중에 닫으면 지금 자리에서 뒤로 간다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const timeline = timelineOf();
    fireEvent.click(getHamburger());
    timeline.time(0.2);
    fireEvent.click(getHamburger());
    expect(timeline.reversed()).toBe(true);
    expect(timeline.time()).toBeCloseTo(0.2, 1);
  });

  it('거꾸로 끝까지 가면 카드 층이 숨는다(탭 순서에서 빠진다)', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    timelineOf().progress(1);
    fireEvent.click(getHamburger());
    expect(getLayer().style.visibility).toBe('visible');
    act(() => {
      timelineOf().totalTime(0);
    });
    expect(getLayer().style.visibility).toBe('hidden');
  });

  it('닫히는 중(아직 0이 아님)에는 층이 보인다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    timelineOf().progress(1);
    fireEvent.click(getHamburger());
    act(() => {
      timelineOf().time(0.3);
    });
    expect(getLayer().style.visibility).toBe('visible');
  });

  it('층이 숨어 있을 때 접근성 트리에서 빠진다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    expect(screen.queryByRole('link', { name: '비전' })).toBeNull();
    fireEvent.click(getHamburger());
    expect(screen.getByRole('link', { name: '비전' })).toBeInTheDocument();
  });
});

describe('navStyle="cards" 축소 선호', () => {
  it('열면 움직임 없이 바로 끝 상태다(면 끝값, 카드 y 0, 불투명, 층 보임)', () => {
    installMedia({ reduced: true });
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    expect(getSurface().style.height).toBe('260px');
    expect(getLayer().style.visibility).toBe('visible');
    for (const card of getCards()) {
      expect(cardOpacity(card)).toBe(1);
      expect(cardY(card)).toBe(0);
    }
    expect(timelineOf().isActive()).toBe(false);
  });

  it('닫으면 움직임 없이 바로 처음 상태다', () => {
    installMedia({ reduced: true });
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    fireEvent.click(getHamburger());
    expect(getSurface().style.height).toBe('60px');
    expect(getLayer().style.visibility).toBe('hidden');
    for (const card of getCards()) {
      expect(cardOpacity(card)).toBe(0);
      expect(cardY(card)).toBe(50);
    }
  });

  it('열린 뒤 다시 열어도(축소 선호) 타임라인이 살아 있어 반복해서 열고 닫힌다', () => {
    installMedia({ reduced: true });
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    for (let i = 0; i < 2; i += 1) {
      fireEvent.click(getHamburger());
      expect(getSurface().style.height).toBe('260px');
      fireEvent.click(getHamburger());
      expect(getSurface().style.height).toBe('60px');
    }
  });
});

describe('navStyle="cards" 다시 재기', () => {
  it('창 크기가 바뀌면 다시 만들고, 닫혀 있으면 0이다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    const before = timelineOf();
    supplyScrollHeight(300);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    const after = timelineOf();
    expect(after).not.toBe(before);
    expect(after.progress()).toBe(0);
    expect(getLayer().style.visibility).toBe('hidden');
    after.progress(1);
    expect(getSurface().style.height).toBe('360px');
  });

  it('열려 있을 때 창 크기가 바뀌면 새 높이로 다시 만들고 progress(1)이다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    supplyScrollHeight(300);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(timelineOf().progress()).toBe(1);
    expect(getSurface().style.height).toBe('360px');
    expect(getLayer().style.visibility).toBe('visible');
    expect(getLayer().style.height).toBe('300px');
    for (const card of getCards()) expect(cardOpacity(card)).toBe(1);
  });

  it('넓은 화면에서 좁은 화면으로 바뀌면 끝값 규칙이 바뀐다(260 바닥이 사라진다)', () => {
    const media = installMedia({ narrow: false });
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    timelineOf().progress(1);
    expect(getSurface().style.height).toBe('260px');
    media.narrow = true;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    timelineOf().progress(1);
    expect(getSurface().style.height).toBe('160px');
  });

  it('items가 바뀌면 다시 만든다', () => {
    supplyScrollHeight(100);
    const { rerender } = render(
      <HeaderBar navStyle="cards" items={cardItems} />
    );
    const before = timelineOf();
    rerender(
      <HeaderBar
        navStyle="cards"
        items={[...cardItems, { label: '새 항목', href: '#new' }]}
      />
    );
    expect(timelineOf()).not.toBe(before);
    expect(getCards()).toHaveLength(4);
    expect(timelineOf().duration()).toBeCloseTo(
      SLOW * 0.75 + 3 * 0.08 + SLOW,
      5
    );
  });

  it('items가 같은 내용으로 다시 넘어오면(새 배열) 다시 만들지 않는다', () => {
    supplyScrollHeight(100);
    const { rerender } = render(
      <HeaderBar navStyle="cards" items={cardItems} />
    );
    const before = timelineOf();
    rerender(
      <HeaderBar navStyle="cards" items={cardItems.map((i) => ({ ...i }))} />
    );
    expect(timelineOf()).toBe(before);
  });

  it('언마운트하면 resize 리스너를 걷고 타임라인을 정리한다', () => {
    supplyScrollHeight(100);
    const removed = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <HeaderBar navStyle="cards" items={cardItems} />
    );
    const timeline = timelineOf();
    expect(timeline.parent).not.toBeNull();
    unmount();
    expect(removed).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(timeline.parent).toBeNull();
  });
});

describe('navStyle="cards" 닫힘 경로', () => {
  it('Esc로 닫히고 포커스가 햄버거로 돌아간다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    within(getLayer()).getByRole('link', { name: '비전' }).focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
    expect(getHamburger()).toHaveFocus();
    expect(timelineOf().reversed()).toBe(true);
  });

  it('면 밖을 누르면 닫힌다', () => {
    supplyScrollHeight(100);
    render(
      <>
        <button type="button">바깥</button>
        <HeaderBar navStyle="cards" items={cardItems} />
      </>
    );
    fireEvent.click(getHamburger());
    fireEvent.mouseDown(screen.getByRole('button', { name: '바깥' }));
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('면 안(카드 빈 곳)을 눌러도 닫히지 않는다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    fireEvent.mouseDown(getCards()[0]);
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('햄버거를 다시 누르면 닫힌다(mousedown은 닫지 않는다)', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.click(getHamburger());
    fireEvent.mouseDown(getHamburger());
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(getHamburger());
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('카드 안 링크를 누르면 onClick을 부르고 닫히며 포커스가 햄버거로 간다', () => {
    supplyScrollHeight(100);
    const onClick = vi.fn();
    render(
      <HeaderBar
        navStyle="cards"
        items={[{ label: '소개', links: [{ label: '팀', onClick }] }]}
      />
    );
    fireEvent.click(getHamburger());
    const link = within(getLayer()).getByRole('button', { name: '팀' });
    link.focus();
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
    expect(getHamburger()).toHaveFocus();
  });

  it('links 없는 항목을 누르면 onClick을 부르고 닫히며 포커스가 햄버거로 간다', () => {
    supplyScrollHeight(100);
    const onClick = vi.fn();
    render(<HeaderBar navStyle="cards" items={[{ label: '후원', onClick }]} />);
    fireEvent.click(getHamburger());
    const button = within(getLayer()).getByRole('button', { name: '후원' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
    expect(getHamburger()).toHaveFocus();
  });

  it('닫혀 있을 때 Esc는 아무 일도 하지 않는다', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getHamburger()).not.toHaveFocus();
    expect(timelineOf().progress()).toBe(0);
  });

  it('햄버거 X 모임은 1부 그대로다(aria-expanded가 선택자)', () => {
    supplyScrollHeight(100);
    render(<HeaderBar navStyle="cards" items={cardItems} />);
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(getHamburger());
    expect(getHamburger()).toHaveAttribute('aria-expanded', 'true');
    expect(getHamburger()).toHaveAccessibleName('메뉴 닫기');
  });
});
