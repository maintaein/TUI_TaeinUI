/**
 * HeaderBar의 두 형태: 알약(`pill`)과 드롭다운(`dropdown`). M5 task-24 2부.
 *
 * jsdom에는 레이아웃도 GSAP 티커도 없다. 알약 타임라인과 열림·닫힘 트윈은 DOM 노드에
 * 얹힌 손잡이(`__pillTimeline`·`__pillTween`·`__panelTween`)를 집어 `progress()`로
 * 직접 seek하고, 결과는 요소의 인라인 스타일로 읽는다. gsap은 값으로 import하지
 * 않는다(타입은 앰비언트 전역 네임스페이스, HeaderBar.test.tsx와 같은 선례).
 * 알약 크기는 레이아웃이 없어 0이라, 측정이 필요한 시험만 getBoundingClientRect를
 * 돌려 준다(BoardRow·Modal 시험과 같은 선례).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { HeaderBar } from './HeaderBar';
import { pillGeometry } from './HeaderBarPill';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { themeContract } from '../../tokens/theme.css';
import {
  BAR_HEIGHT,
  DROPDOWN_ITEM_HEIGHT,
  PANEL_OFFSET_Y,
  PILL_NAV_HEIGHT,
  PILL_NAV_PADDING,
  PILL_GAP,
  TINT_HOVER,
} from './HeaderBar.css';

// 알약 하나를 그릴 때 GSAP이 클래스가 붙은 요소의 getComputedStyle을 읽는데, jsdom은
// 이를 전체 스타일시트를 훑어 계산한다. 혼자 돌려 가장 느린 시험이 1.6초, 리뷰에서 잰
// 최대는 3.6초(items가 바뀌면 다시 잰다)이고 다른 파일과 병렬로 돌면 5초 기본값을 넘기는
// 일이 있어 이 파일만 늘린다.
vi.setConfig({ testTimeout: 20000 });

type PillHost = HTMLElement & {
  __pillTimeline?: gsap.core.Timeline;
  __pillTween?: gsap.core.Tween;
};
type PanelTweenHost = HTMLElement & { __panelTween?: gsap.core.Tween };

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
  vi.restoreAllMocks();
});

/** jsdom에는 PointerEvent가 없다. React는 이름이 맞으면 받으므로 pointerType을 얹어 쏜다. */
const pointer = (
  el: HTMLElement,
  type: string,
  pointerType = 'mouse',
  relatedTarget: HTMLElement | null = null
) =>
  act(() => {
    const event = new MouseEvent(type, { bubbles: true, relatedTarget });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    el.dispatchEvent(event);
  });
const focusEl = (el: HTMLElement) => act(() => el.focus());
const hoverIn = (el: HTMLElement, pointerType?: string) =>
  pointer(el, 'pointerover', pointerType);
const hoverOut = (
  el: HTMLElement,
  pointerType?: string,
  relatedTarget?: HTMLElement
) => pointer(el, 'pointerout', pointerType, relatedTarget ?? null);

/** jsdom은 :focus-visible 휴리스틱이 없다. 그 선택자에만 답하는 스텁(Avatar 시험과 같은 선례). */
const stubFocusVisible = (el: HTMLElement, focusVisible: boolean) =>
  Object.defineProperty(el, 'matches', {
    configurable: true,
    value: (selector: string) =>
      selector === ':focus-visible' ? focusVisible : !focusVisible,
  });

const rectOf = (width: number, height: number) =>
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect
  );

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

const decl = (rule: CSSStyleRule, prop: string): string | undefined =>
  new RegExp(String.raw`(?<![\w-])${prop}:\s*([^;}]*)`)
    .exec(rule.cssText)?.[1]
    .trim();

const REDUCE = '(prefers-reduced-motion: reduce)';

const items = [
  { label: '홈', href: '#home', active: true },
  { label: '소개', href: '#about' },
  { label: '문의' },
];

// ---------------------------------------------------------------------------
// 알약
// ---------------------------------------------------------------------------

const getNav = (): HTMLElement =>
  screen.getByRole('navigation', { name: '주요 메뉴' });

const getPill = (name: string): PillHost => {
  const nav = getNav();
  const found =
    within(nav).queryByRole('link', { name }) ??
    within(nav).getByRole('button', { name });
  return found as PillHost;
};

/** 알약의 세 부품. 구조: [원(aria-hidden), 글자 묶음[원래 글자, 덮는 글자(aria-hidden)]] */
const partsOf = (pill: HTMLElement) => {
  const circle = pill.children[0] as HTMLElement;
  const stack = pill.children[1] as HTMLElement;
  return {
    circle,
    label: stack.children[0] as HTMLElement,
    cover: stack.children[1] as HTMLElement,
  };
};

describe('pillGeometry (PillNav.tsx:60-63의 식)', () => {
  it('폭 100, 높이 40이면 R=51.25, D=105, delta=41, 기준점 y=64다', () => {
    const g = pillGeometry(100, 40);
    expect(g.diameter).toBe(105);
    expect(g.delta).toBe(41);
    expect(g.originY).toBe(64);
  });

  it('폭 60, 높이 34이면 D=63, delta=28, 기준점 y=35다', () => {
    const g = pillGeometry(60, 34);
    expect(g.diameter).toBe(63);
    expect(g.delta).toBe(28);
    expect(g.originY).toBe(35);
  });

  it('폭 200, 높이 34이면 D=331, delta=35, 기준점 y=296이다', () => {
    const g = pillGeometry(200, 34);
    expect(g.diameter).toBe(331);
    expect(g.delta).toBe(35);
    expect(g.originY).toBe(296);
  });

  it('글자 움직임은 높이에서 나온다: 원래 글자는 -(h+8), 덮는 글자는 ceil(h+100)에서 시작한다', () => {
    const g = pillGeometry(100, 34.2);
    expect(g.labelTo).toBeCloseTo(-42.2);
    expect(g.coverFrom).toBe(135);
  });

  it('레이아웃이 없어 0 x 0이어도 NaN이 나오지 않는다', () => {
    const g = pillGeometry(0, 0);
    for (const value of Object.values(g)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});

describe('navStyle="pill" 마크업', () => {
  it('항목마다 알약이 있고 링크/버튼 구분과 접근 이름은 text와 같다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    expect(getPill('홈')).toHaveAttribute('href', '#home');
    expect(getPill('문의').tagName).toBe('BUTTON');
  });

  it('원과 덮는 글자는 aria-hidden이고 덮는 글자는 같은 글자다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const { circle, label, cover } = partsOf(getPill('소개'));
    expect(circle).toHaveAttribute('aria-hidden', 'true');
    expect(cover).toHaveAttribute('aria-hidden', 'true');
    expect(label).not.toHaveAttribute('aria-hidden');
    expect(label).toHaveTextContent('소개');
    expect(cover).toHaveTextContent('소개');
  });

  it('active 항목만 aria-current="page"를 갖고 밑점은 없다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    expect(getPill('홈')).toHaveAttribute('aria-current', 'page');
    expect(getPill('소개')).not.toHaveAttribute('aria-current');
    expect(getNav().querySelectorAll('[data-pill-dot]')).toHaveLength(0);
    // 항목 알약이 바깥 알약의 바로 아래 자식이다(점을 위한 감싸개가 없다).
    expect(getPill('홈').parentElement).toBe(getNav());
  });

  it('버튼 항목을 누르면 onClick이 불린다', () => {
    const onClick = vi.fn();
    render(<HeaderBar navStyle="pill" items={[{ label: '문의', onClick }]} />);
    fireEvent.click(getPill('문의'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('navStyle="pill" 쉬는 모습 (CSSOM)', () => {
  it('바깥 알약: 높이 40, 안쪽 여백 3px, 간격 3px, 끝이 둥글다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    expect(PILL_NAV_PADDING).toBe(3);
    expect(PILL_GAP).toBe(3);
    const outer = ruleOf(/\.HeaderBar_pillNav__[^\s:]+$/);
    expect(decl(outer, 'height')).toBe(`${PILL_NAV_HEIGHT}px`);
    expect(decl(outer, 'padding')).toBe('3px');
    expect(decl(outer, 'gap')).toBe('3px');
    expect(decl(outer, 'border-radius')).toBe(themeContract.borderRadius.full);
  });

  it('알약 버튼: 높이 = 바깥 높이 - 6px, 좌우 spacing[4], semibold, sm, 둥근 끝, 넘침 자름', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = ruleOf(/\.HeaderBar_pillItem__[^\s:]+$/);
    expect(decl(pill, 'height')).toBe(`${PILL_NAV_HEIGHT - 6}px`);
    expect(decl(pill, 'padding')).toBe(`0 ${themeContract.spacing[4]}`);
    expect(decl(pill, 'font-weight')).toBe(
      String(themeContract.font.weight.semibold)
    );
    expect(decl(pill, 'font-size')).toBe(themeContract.font.size.sm);
    expect(decl(pill, 'border-radius')).toBe(themeContract.borderRadius.full);
    expect(decl(pill, 'overflow')).toBe('hidden');
  });

  it('바깥 면은 surface.hover, 알약 바탕은 background.default, 글자는 text.primary다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    expect(
      decl(ruleOf(/\.HeaderBar_pillNav__[^\s:]+$/), 'background-color')
    ).toBe(themeContract.color.surface.hover);
    const pill = ruleOf(/\.HeaderBar_pillItem__[^\s:]+$/);
    expect(decl(pill, 'background-color')).toBe(
      themeContract.color.background.default
    );
    expect(decl(pill, 'color')).toBe(themeContract.color.text.primary);
  });

  it('원은 primary.main, 덮는 글자는 primary.contrast다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    expect(
      decl(ruleOf(/\.HeaderBar_pillCircle__[^\s:]+$/), 'background-color')
    ).toBe(themeContract.color.primary.main);
    expect(decl(ruleOf(/\.HeaderBar_pillCover__[^\s:]+$/), 'color')).toBe(
      themeContract.color.primary.contrast
    );
  });

  it('밑점 규칙이 없다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    expect(
      headerBarRules().filter(({ rule }) => /pillDot/.test(rule.selectorText))
    ).toHaveLength(0);
  });

  it('active 항목의 덮는 글자에만 정적 광휘가 있다: 0 0 6px, 광휘 색 45%', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const base = ruleOf(/\.HeaderBar_pillCover__[^\s:]+$/);
    expect(decl(base, 'text-shadow')).toBeUndefined();
    const current = ruleOf(
      /\[aria-current="page"\] \.HeaderBar_pillCover__[^\s:]+$/
    );
    expect(decl(current, 'text-shadow')).toMatch(
      /^0 0 6px color-mix\(in srgb, var\(--[\w-]+\) 45%, transparent\)$/
    );
    // 맥박이 없다: 광휘 규칙에 animation이 없다.
    expect(decl(current, 'animation')).toBeUndefined();
  });

  it('광휘 색은 primary.contrast다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const current = ruleOf(
      /\[aria-current="page"\] \.HeaderBar_pillCover__[^\s:]+$/
    );
    expect(decl(current, 'text-shadow')).toContain(
      `color-mix(in srgb, ${themeContract.color.primary.contrast} 45%, transparent)`
    );
  });

  it('원은 알약 아래 가운데에서 시작하고 포인터를 가로채지 않는다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const circle = ruleOf(/\.HeaderBar_pillCircle__[^\s:]+$/);
    expect(decl(circle, 'position')).toBe('absolute');
    expect(decl(circle, 'left')).toBe('50%');
    expect(decl(circle, 'pointer-events')).toBe('none');
    expect(decl(circle, 'border-radius')).toBe(themeContract.borderRadius.full);
  });

  it('덮는 글자는 CSS 기본이 투명이다(레이아웃 전에 깜박이지 않는다)', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const cover = ruleOf(/\.HeaderBar_pillCover__[^\s:]+$/);
    expect(decl(cover, 'opacity')).toBe('0');
    expect(decl(cover, 'position')).toBe('absolute');
  });
});

describe('navStyle="pill" 타임라인', () => {
  it('마운트하면 원은 scale 0, 덮는 글자는 투명이고 타임라인은 2초다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    const { circle, cover } = partsOf(pill);
    expect(pill.__pillTimeline?.duration()).toBe(2);
    expect(circle.style.transform).toContain('scale(0');
    expect(cover.style.opacity).toBe('0');
  });

  it('들어오면 tweenTo(끝)을 slow settle로 건다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    hoverIn(pill);
    const tween = pill.__pillTween;
    expect(tween?.duration()).toBeCloseTo(gsapDuration.slow);
    expect(tween?.vars.ease).toBe(gsapEasing.settle);
    expect(tween?.vars.overwrite).toBe('auto');
  });

  it('끝에서 원은 scale 1.2, 원래 글자는 위로, 덮는 글자는 y 0에 불투명이다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    hoverIn(pill);
    pill.__pillTween?.progress(1);
    const { circle, label, cover } = partsOf(pill);
    expect(circle.style.transform).toContain('scale(1.2');
    // 레이아웃이 없어 높이는 0이다. 원래 글자는 -(0 + 8).
    expect(label.style.transform).toContain('translate(0px, -8px)');
    expect(cover.style.transform).toContain('translate(0, 0)');
    expect(cover.style.opacity).toBe('1');
  });

  it('나가면 tweenTo(0)을 base settle로 걸고 끝에서 쉬는 모습으로 돌아온다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    hoverIn(pill);
    pill.__pillTween?.progress(1);
    hoverOut(pill);
    const tween = pill.__pillTween;
    expect(tween?.duration()).toBeCloseTo(gsapDuration.base);
    expect(tween?.vars.ease).toBe(gsapEasing.settle);
    tween?.progress(1);
    const { circle, cover } = partsOf(pill);
    expect(circle.style.transform).toContain('scale(0');
    expect(cover.style.opacity).toBe('0');
  });

  it('도중에 바뀌면 지금 자리에서 이어받고 앞 tweenTo는 죽는다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    hoverIn(pill);
    const first = pill.__pillTween as gsap.core.Tween;
    first.progress(0.5);
    const timeline = pill.__pillTimeline as gsap.core.Timeline;
    const mid = timeline.time();
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(timeline.duration());
    hoverOut(pill);
    // 되감기를 시작해도 타임라인은 튀지 않고 그 자리에 있다.
    expect(timeline.time()).toBe(mid);
    expect(pill.__pillTween).not.toBe(first);
    // 죽은 트윈은 타임라인 시간을 더 이상 움직이지 못한다.
    first.progress(1);
    expect(timeline.time()).toBe(mid);
    pill.__pillTween?.progress(1);
    expect(timeline.time()).toBe(0);
  });

  it('터치 포인터는 무시한다(원이 들러붙지 않는다)', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    hoverIn(pill, 'touch');
    hoverIn(pill, 'pen');
    expect(pill.__pillTween).toBeUndefined();
  });

  it('키보드 포커스(:focus-visible)도 같은 들어옴이고 blur는 같은 나감이다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    stubFocusVisible(pill, true);
    act(() => pill.focus());
    const entering = pill.__pillTween;
    expect(entering?.duration()).toBeCloseTo(gsapDuration.slow);
    entering?.progress(1);
    expect(partsOf(pill).circle.style.transform).toContain('scale(1.2');
    act(() => pill.blur());
    expect(pill.__pillTween?.duration()).toBeCloseTo(gsapDuration.base);
  });

  it('마우스 클릭으로 생긴 포커스(:focus-visible 아님)는 무시한다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    stubFocusVisible(pill, false);
    act(() => pill.focus());
    expect(pill.__pillTween).toBeUndefined();
  });

  it('마우스가 나가도 키보드 포커스가 남아 있으면 채운 채로 둔다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    stubFocusVisible(pill, true);
    act(() => pill.focus());
    hoverIn(pill);
    pill.__pillTween?.progress(1);
    const filled = pill.__pillTween;
    hoverOut(pill);
    expect(pill.__pillTween).toBe(filled);
    act(() => pill.blur());
    expect(pill.__pillTween).not.toBe(filled);
  });

  it('축소 선호면 들어오면 바로 끝 상태, 나가면 바로 0이다', () => {
    installReducedMotion(true);
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    const { circle, label, cover } = partsOf(pill);
    hoverIn(pill);
    // progress를 부르지 않았다. 게이트가 끝 상태로 확정했다.
    expect(circle.style.transform).toContain('scale(1.2');
    expect(label.style.transform).toContain('translate(0px, -8px)');
    expect(cover.style.opacity).toBe('1');
    hoverOut(pill);
    expect(circle.style.transform).toContain('scale(0');
    expect(cover.style.opacity).toBe('0');
  });

  it('언마운트하면 돌던 트윈과 타임라인을 정리한다', () => {
    const { unmount } = render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    hoverIn(pill);
    const timeline = pill.__pillTimeline as gsap.core.Timeline;
    const tween = pill.__pillTween as gsap.core.Tween;
    unmount();
    // 죽은 타임라인은 부모에서 떨어진다.
    expect(timeline.parent).toBeNull();
    expect(tween.parent).toBeNull();
  });
});

describe('navStyle="pill" 선택된(active) 항목', () => {
  it('마운트 때 active 항목은 움직임 없이 끝 상태다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('홈');
    const { circle, label, cover } = partsOf(pill);
    expect(pill.__pillTween).toBeUndefined();
    expect(pill.__pillTimeline?.progress()).toBe(1);
    expect(circle.style.transform).toContain('scale(1.2');
    expect(label.style.transform).toContain('translate(0px, -8px)');
    expect(cover.style.transform).toContain('translate(0, 0)');
    expect(cover.style.opacity).toBe('1');
    // 다른 항목은 쉬는 모습이다.
    expect(getPill('소개').__pillTimeline?.progress()).toBe(0);
  });

  it('호버·포커스가 오가도 active 항목은 비워지지 않는다', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('홈');
    hoverIn(pill);
    hoverOut(pill);
    stubFocusVisible(pill, true);
    act(() => pill.focus());
    act(() => pill.blur());
    expect(pill.__pillTween).toBeUndefined();
    expect(pill.__pillTimeline?.progress()).toBe(1);
  });

  it('active가 다른 항목으로 옮겨가면 새 항목은 들어옴(slow), 옛 항목은 나감(base)이다', () => {
    const { rerender } = render(<HeaderBar navStyle="pill" items={items} />);
    rerender(
      <HeaderBar
        navStyle="pill"
        items={items.map((item) => ({
          ...item,
          active: item.label === '소개',
        }))}
      />
    );
    const entering = getPill('소개').__pillTween;
    const leaving = getPill('홈').__pillTween;
    expect(entering?.duration()).toBeCloseTo(gsapDuration.slow);
    expect(leaving?.duration()).toBeCloseTo(gsapDuration.base);
    expect(entering?.vars.ease).toBe(gsapEasing.settle);
    entering?.progress(1);
    leaving?.progress(1);
    expect(partsOf(getPill('소개')).circle.style.transform).toContain(
      'scale(1.2'
    );
    expect(partsOf(getPill('홈')).circle.style.transform).toContain('scale(0');
    expect(getPill('소개')).toHaveAttribute('aria-current', 'page');
  });

  it('마우스가 올라 있는 동안 active가 떠나도 채운 채로 둔다', () => {
    const { rerender } = render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('홈');
    hoverIn(pill);
    rerender(
      <HeaderBar
        navStyle="pill"
        items={items.map((item) => ({ ...item, active: false }))}
      />
    );
    expect(pill.__pillTween).toBeUndefined();
    expect(pill.__pillTimeline?.progress()).toBe(1);
    hoverOut(pill);
    expect(pill.__pillTween?.duration()).toBeCloseTo(gsapDuration.base);
  });

  it('다시 재면 active는 끝 상태로, 아니면 처음으로 돌아온다', () => {
    const spy = rectOf(100, 40);
    render(<HeaderBar navStyle="pill" items={items} />);
    spy.mockImplementation(
      () => ({ width: 101, height: 40 }) as unknown as DOMRect
    );
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(partsOf(getPill('홈')).circle.style.transform).toContain(
      'scale(1.2'
    );
    expect(partsOf(getPill('홈')).cover.style.opacity).toBe('1');
    // 비활성 알약은 다시 만들어져 처음으로 돌아온다: 진행 0, 원은 접히고 글자는 제자리.
    const idle = getPill('소개');
    const idleParts = partsOf(idle);
    expect(idle.__pillTimeline?.progress()).toBe(0);
    expect(idleParts.circle.style.transform).toContain('scale(0');
    expect(idleParts.cover.style.opacity).toBe('0');
    expect(idleParts.label.style.transform).toContain('translate(0, 0)');
  });

  it('타임라인 안의 세 트윈은 linear다(감속은 tweenTo 하나만 건다)', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const children = (
      getPill('소개').__pillTimeline as gsap.core.Timeline
    ).getChildren();
    expect(children).toHaveLength(3);
    for (const child of children) {
      expect(child.vars.ease).toBe(gsapEasing.linear);
    }
  });
});

describe('navStyle="pill" 기하 측정', () => {
  it('알약 폭·높이로 원 지름·바닥·기준점과 글자 시작 위치를 정한다', () => {
    rectOf(100, 40);
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    const { circle, label, cover } = partsOf(pill);
    expect(circle.style.width).toBe('105px');
    expect(circle.style.height).toBe('105px');
    expect(circle.style.bottom).toBe('-41px');
    expect(circle.style.transformOrigin).toBe('50% 64px');
    expect(cover.style.transform).toContain('translate(0px, 140px)');
    hoverIn(pill);
    pill.__pillTween?.progress(1);
    expect(label.style.transform).toContain('translate(0px, -48px)');
  });

  it('창 크기가 바뀌면 다시 재고 호버로 채워 둔 알약은 채운 채로 둔다', () => {
    const spy = rectOf(100, 40);
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    const { circle } = partsOf(pill);
    hoverIn(pill);
    pill.__pillTween?.progress(1);
    expect(circle.style.transform).toContain('scale(1.2');
    spy.mockImplementation(
      () => ({ width: 60, height: 34 }) as unknown as DOMRect
    );
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(circle.style.width).toBe('63px');
    expect(circle.style.transform).toContain('scale(1.2');
    expect(partsOf(pill).cover.style.opacity).toBe('1');
  });

  it('호버로 채운 뒤 폭이 바뀌어도 돌던 tweenTo는 죽고 끝에서 쉰다', () => {
    const spy = rectOf(100, 40);
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    hoverIn(pill);
    const running = pill.__pillTween as gsap.core.Tween;
    running.progress(0.3);
    spy.mockImplementation(
      () => ({ width: 60, height: 34 }) as unknown as DOMRect
    );
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    const timeline = pill.__pillTimeline as gsap.core.Timeline;
    expect(timeline.progress()).toBe(1);
    expect(running.parent).toBeNull();
  });

  it('키보드 포커스로 채운 알약도 창 크기가 바뀌면 채운 채로 둔다', () => {
    const spy = rectOf(100, 40);
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    stubFocusVisible(pill, true);
    act(() => pill.focus());
    pill.__pillTween?.progress(1);
    spy.mockImplementation(
      () => ({ width: 60, height: 34 }) as unknown as DOMRect
    );
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(partsOf(pill).circle.style.transform).toContain('scale(1.2');
  });

  it('알약 폭·높이가 그대로면 resize가 와도 타임라인을 다시 만들지 않는다', () => {
    rectOf(100, 40);
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    hoverIn(pill);
    const timeline = pill.__pillTimeline;
    const tween = pill.__pillTween;
    act(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
    });
    expect(pill.__pillTimeline).toBe(timeline);
    expect(pill.__pillTween).toBe(tween);
    expect(tween?.parent).not.toBeNull();
  });

  it('폭이 같고 높이만 달라지면 다시 만들고, 높이도 같으면 만들지 않는다', () => {
    const spy = rectOf(100, 40);
    render(<HeaderBar navStyle="pill" items={items} />);
    const pill = getPill('소개');
    const first = pill.__pillTimeline;
    spy.mockImplementation(
      () => ({ width: 100, height: 44 }) as unknown as DOMRect
    );
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    const second = pill.__pillTimeline;
    expect(second).not.toBe(first);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(pill.__pillTimeline).toBe(second);
  });

  it('글꼴 로딩이 끝나면 다시 잰다', async () => {
    let finish: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      finish = resolve;
    });
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready },
    });
    const spy = rectOf(100, 40);
    render(<HeaderBar navStyle="pill" items={items} />);
    const { circle } = partsOf(getPill('소개'));
    expect(circle.style.width).toBe('105px');
    spy.mockImplementation(
      () => ({ width: 60, height: 34 }) as unknown as DOMRect
    );
    await act(async () => {
      finish();
      await ready;
    });
    expect(circle.style.width).toBe('63px');
    delete (document as { fonts?: unknown }).fonts;
  });

  it('items가 바뀌면 다시 잰다', () => {
    const spy = rectOf(100, 40);
    const { rerender } = render(<HeaderBar navStyle="pill" items={items} />);
    spy.mockImplementation(
      () => ({ width: 60, height: 34 }) as unknown as DOMRect
    );
    rerender(
      <HeaderBar navStyle="pill" items={[...items, { label: '새 항목' }]} />
    );
    expect(partsOf(getPill('새 항목')).circle.style.width).toBe('63px');
  });

  it('언마운트 뒤에는 resize 리스너가 남지 않는다', () => {
    const removed = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<HeaderBar navStyle="pill" items={items} />);
    unmount();
    expect(removed).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});

describe('navStyle="pill" 좁은 화면', () => {
  it('좁은 화면 패널은 1부의 세로 목록 그대로다(알약 모양 아님)', () => {
    render(<HeaderBar navStyle="pill" items={items} />);
    const panel = openNarrowPanel();
    expect(within(panel).getByRole('link', { name: '홈' })).toHaveClass(
      /textItem/
    );
    expect(panel.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 드롭다운
// ---------------------------------------------------------------------------

const dropdownItems = [
  {
    label: '제품',
    links: [
      { label: '버튼', href: '#button' },
      { label: '헤더', onClick: () => {} },
    ],
  },
  { label: '회사', links: [{ label: '소개', href: '#about' }] },
  { label: '문의', href: '#contact' },
];

/** 좁은 화면 햄버거를 열고 트윈을 끝까지 돌려 판이 접근 가능하게 만든다. */
const openNarrowPanel = (): HTMLElement => {
  fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));
  const panel = document.getElementById(
    screen
      .getByRole('button', { name: '메뉴 닫기' })
      .getAttribute('aria-controls') ?? ''
  ) as PanelTweenHost;
  panel.__panelTween?.progress(1);
  return panel;
};

const getTrigger = (name: string): HTMLElement =>
  within(getNav()).getByRole('button', { name });

const getDropPanel = (name: string): PanelTweenHost => {
  const id = getTrigger(name).getAttribute('aria-controls') ?? '';
  const panel = document.getElementById(id);
  if (!panel) throw new Error('aria-controls가 가리키는 판이 없다');
  return panel as PanelTweenHost;
};

/** 열고 트윈을 끝까지 돌려 열린 모습으로 만든다. */
const openDrop = (name: string): PanelTweenHost => {
  fireEvent.click(getTrigger(name));
  const panel = getDropPanel(name);
  panel.__panelTween?.progress(1);
  return panel;
};

describe('navStyle="dropdown" 마크업', () => {
  it('links가 있는 항목은 aria-expanded 버튼이고 aria-controls가 판을 가리킨다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const trigger = getTrigger('제품');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(getDropPanel('제품')).toBeInTheDocument();
  });

  it('links가 없는 항목은 text와 같은 보통 항목이다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const link = within(getNav()).getByRole('link', { name: '문의' });
    expect(link).toHaveAttribute('href', '#contact');
    expect(link).not.toHaveAttribute('aria-expanded');
  });

  it('겉모습은 text와 같다: 같은 항목·라벨 클래스를 쓰고 links 항목에만 꺾쇠가 있다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const trigger = getTrigger('제품');
    expect(trigger).toHaveClass(/textItem/);
    expect(trigger.querySelector('[class*="textLabel"]')).not.toBeNull();
    const chevron = trigger.querySelector('svg[data-icon="chevron-down"]');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(
      within(getNav()).getByRole('link', { name: '문의' }).querySelector('svg')
    ).toBeNull();
  });

  it('판은 하위 링크 목록이다(href가 있으면 링크, 없으면 버튼)', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = openDrop('제품');
    expect(within(panel).getAllByRole('listitem')).toHaveLength(2);
    expect(within(panel).getByRole('link', { name: '버튼' })).toHaveAttribute(
      'href',
      '#button'
    );
    expect(
      within(panel).getByRole('button', { name: '헤더' })
    ).toBeInTheDocument();
  });

  it('links는 dropdown에서만 쓰인다: text·pill에서는 버튼이 토글이 아니다', () => {
    const { rerender } = render(
      <HeaderBar navStyle="text" items={dropdownItems} />
    );
    expect(
      within(getNav()).getByRole('button', { name: '제품' })
    ).not.toHaveAttribute('aria-expanded');
    rerender(<HeaderBar navStyle="pill" items={dropdownItems} />);
    expect(
      within(getNav()).getByRole('button', { name: '제품' })
    ).not.toHaveAttribute('aria-expanded');
  });
});

describe('navStyle="dropdown" 열림·닫힘', () => {
  it('누르면 aria-expanded가 true가 되고 base settle로 opacity 0 -> 1, y 8 -> 0이다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    fireEvent.click(getTrigger('제품'));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
    const tween = getDropPanel('제품').__panelTween;
    expect(tween?.duration()).toBeCloseTo(gsapDuration.base);
    expect(tween?.vars.ease).toBe(gsapEasing.settle);
    expect(tween?.vars.y).toBe(0);
    expect(tween?.vars.autoAlpha).toBe(1);
  });

  it('열림이 끝나면 판이 보인다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = openDrop('제품');
    expect(panel.style.opacity).toBe('1');
    expect(panel.style.visibility).not.toBe('hidden');
  });

  it('닫힘은 fast settle로 opacity 0, y 8에 돌아간다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = openDrop('제품');
    fireEvent.click(getTrigger('제품'));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
    const tween = panel.__panelTween;
    expect(tween?.duration()).toBeCloseTo(gsapDuration.fast);
    expect(tween?.vars.y).toBe(PANEL_OFFSET_Y);
    tween?.progress(1);
    expect(panel.style.opacity).toBe('0');
    expect(panel.style.visibility).toBe('hidden');
  });

  it('한 번에 판 하나: 다른 항목을 열면 앞 것이 닫힌다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const first = openDrop('제품');
    fireEvent.click(getTrigger('회사'));
    expect(getTrigger('회사')).toHaveAttribute('aria-expanded', 'true');
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
    expect(first.__panelTween?.duration()).toBeCloseTo(gsapDuration.fast);
  });

  it('Esc로 닫히고 포커스가 그 항목 버튼으로 돌아간다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = openDrop('제품');
    focusEl(within(panel).getByRole('link', { name: '버튼' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
    expect(getTrigger('제품')).toHaveFocus();
  });

  it('닫혀 있을 때 Esc는 포커스를 가져가지 않는다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getTrigger('제품')).not.toHaveFocus();
  });

  it('판 밖을 누르면 닫히고, 판 안이나 자기 버튼의 mousedown은 닫지 않는다', () => {
    render(
      <>
        <button type="button">바깥</button>
        <HeaderBar navStyle="dropdown" items={dropdownItems} />
      </>
    );
    const panel = openDrop('제품');
    fireEvent.mouseDown(within(panel).getByRole('link', { name: '버튼' }));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
    // 버튼의 mousedown이 먼저 닫아 버리면 이어지는 click이 다시 열어 버린다.
    fireEvent.mouseDown(getTrigger('제품'));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
    fireEvent.mouseDown(screen.getByRole('button', { name: '바깥' }));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
  });

  it('하위 링크를 누르면 onClick이 불리고 닫히며 포커스는 항목 버튼으로 간다', () => {
    const onClick = vi.fn();
    render(
      <HeaderBar
        navStyle="dropdown"
        items={[{ label: '제품', links: [{ label: '헤더', onClick }] }]}
      />
    );
    const panel = openDrop('제품');
    fireEvent.click(within(panel).getByRole('button', { name: '헤더' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
    expect(getTrigger('제품')).toHaveFocus();
  });

  it('링크 하위 항목을 눌러도 닫힌다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = openDrop('제품');
    fireEvent.click(within(panel).getByRole('link', { name: '버튼' }));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
  });

  it('열려도 포커스는 버튼에 남는다(판 안으로는 Tab으로 들어간다)', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    focusEl(getTrigger('제품'));
    fireEvent.click(getTrigger('제품'));
    expect(getTrigger('제품')).toHaveFocus();
  });

  it('포커스가 버튼에서 판 안으로 가도 닫히지 않는다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = openDrop('제품');
    focusEl(getTrigger('제품'));
    focusEl(within(panel).getByRole('link', { name: '버튼' }));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
  });

  it('포커스가 판 밖으로 나가면 닫힌다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = openDrop('제품');
    focusEl(within(panel).getByRole('button', { name: '헤더' }));
    focusEl(within(getNav()).getByRole('link', { name: '문의' }));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
  });

  it('버튼에서 포커스가 밖으로 나가도 닫힌다(Shift+Tab)', () => {
    render(
      <>
        <button type="button">앞</button>
        <HeaderBar navStyle="dropdown" items={dropdownItems} />
      </>
    );
    openDrop('제품');
    focusEl(getTrigger('제품'));
    focusEl(screen.getByRole('button', { name: '앞' }));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
  });

  it('도착지 없는 blur(판 안쪽 빈 곳을 누를 때)는 닫지 않는다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    openDrop('제품');
    fireEvent.focusOut(getTrigger('제품'), { relatedTarget: null });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
  });

  it('닫힌 뒤에는 document 리스너가 남지 않는다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    openDrop('제품');
    fireEvent.click(getTrigger('제품'));
    const after = getDropPanel('제품').__panelTween;
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);
    expect(getDropPanel('제품').__panelTween).toBe(after);
    expect(getTrigger('제품')).not.toHaveFocus();
  });

  it('축소 선호면 열림이 트윈 없이 바로 끝 상태다', () => {
    installReducedMotion(true);
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    fireEvent.click(getTrigger('제품'));
    const panel = getDropPanel('제품');
    expect(panel.style.opacity).toBe('1');
    expect(panel.style.visibility).not.toBe('hidden');
    fireEvent.click(getTrigger('제품'));
    expect(panel.style.opacity).toBe('0');
    expect(panel.style.visibility).toBe('hidden');
  });
});

describe('navStyle="dropdown" 모양 (CSSOM)', () => {
  it('판은 바 아래에 겹쳐 뜨고(absolute, 내용을 밀지 않는다) 닫힌 모습이 CSS 기본이다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = ruleOf(/\.HeaderBar_dropdownPanel__[^\s:]+$/);
    expect(decl(panel, 'position')).toBe('absolute');
    // 가로는 static position(항목 왼쪽)에, 세로는 바 기준 아래로.
    expect(decl(panel, 'left')).toBe('auto');
    expect(decl(panel, 'top')).toBe(`calc(100% + ${themeContract.spacing[2]})`);
    expect(decl(panel, 'opacity')).toBe('0');
    expect(decl(panel, 'visibility')).toBe('hidden');
    expect(decl(panel, 'transform')).toBe(`translateY(${PANEL_OFFSET_Y}px)`);
  });

  it('판의 모서리는 borderRadius.md, 그림자는 shadow.md다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = ruleOf(/\.HeaderBar_dropdownPanel__[^\s:]+$/);
    expect(decl(panel, 'border-radius')).toBe(themeContract.borderRadius.md);
    expect(decl(panel, 'box-shadow')).toBe(themeContract.shadow.md);
  });

  it('항목 슬롯은 위치를 잡지 않는다(판의 기준이 바가 되도록)', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const slot = ruleOf(/\.HeaderBar_dropdownSlot__[^\s:]+$/);
    expect(decl(slot, 'position')).toBeUndefined();
  });

  it('판의 면은 background.default, 글자는 text.primary다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = ruleOf(/\.HeaderBar_dropdownPanel__[^\s:]+$/);
    expect(decl(panel, 'background-color')).toBe(
      themeContract.color.background.default
    );
    expect(decl(panel, 'color')).toBe(themeContract.color.text.primary);
  });

  it('열리면 꺾쇠가 180도 돌고 base settle이다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const rest = ruleOf(/\.HeaderBar_dropdownChevron__[^\s:]+$/);
    expect(decl(rest, 'transition')).toContain(
      themeContract.animation.duration.base
    );
    expect(decl(rest, 'transition')).toContain(
      themeContract.animation.easing.settle
    );
    const open = ruleOf(
      /\[aria-expanded="true"\] \.HeaderBar_dropdownChevron__[^\s:]+$/
    );
    expect(decl(open, 'transform')).toBe('rotate(180deg)');
  });

  it('축소 선호에서는 꺾쇠 전이가 없다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    expect(
      decl(
        ruleOf(/\.HeaderBar_dropdownChevron__[^\s:]+$/, REDUCE),
        'transition'
      )
    ).toBe('none');
  });
});

const slotOf = (name: string): HTMLElement =>
  getTrigger(name).parentElement as HTMLElement;

describe('navStyle="dropdown" 호버로 열림', () => {
  it('마우스가 항목 슬롯에 들어오면 열리고 나가면 닫힌다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    hoverIn(slotOf('제품'));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
    expect(getDropPanel('제품').__panelTween?.duration()).toBeCloseTo(
      gsapDuration.base
    );
    hoverOut(slotOf('제품'));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
    expect(getDropPanel('제품').__panelTween?.duration()).toBeCloseTo(
      gsapDuration.fast
    );
  });

  it('터치·펜은 들어와도 열리지 않는다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    hoverIn(slotOf('제품'), 'touch');
    hoverIn(slotOf('제품'), 'pen');
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
  });

  it('터치로 누르면 지금처럼 열고 닫는다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    hoverIn(slotOf('제품'), 'touch');
    fireEvent.click(getTrigger('제품'), { detail: 1 });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(getTrigger('제품'), { detail: 1 });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
  });

  it('마우스 클릭은 열기만 한다: 호버로 열린 판이 클릭에 닫히지 않는다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    hoverIn(slotOf('제품'));
    fireEvent.click(getTrigger('제품'), { detail: 1 });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(getTrigger('제품'), { detail: 1 });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
  });

  it('Esc로 닫은 뒤 마우스가 아직 안에 있어도 클릭하면 다시 열린다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    hoverIn(slotOf('제품'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(getTrigger('제품'), { detail: 1 });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
  });

  it('키보드(Enter·Space는 detail 0인 click)는 열고 닫는다. 마우스가 안에 있어도 같다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    fireEvent.click(getTrigger('제품'), { detail: 0 });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(getTrigger('제품'), { detail: 0 });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
    hoverIn(slotOf('제품'));
    fireEvent.click(getTrigger('제품'), { detail: 0 });
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
  });

  it('다른 항목 슬롯에 들어오면 앞 것이 닫힌다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    hoverIn(slotOf('제품'));
    hoverIn(slotOf('회사'));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
    expect(getTrigger('회사')).toHaveAttribute('aria-expanded', 'true');
  });

  it('버튼에서 판으로 건너가는 것은 슬롯을 나간 게 아니라 닫히지 않는다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    hoverIn(slotOf('제품'));
    const panel = getDropPanel('제품');
    panel.__panelTween?.progress(1);
    const link = within(panel).getByRole('link', { name: '버튼' });
    hoverOut(getTrigger('제품'), undefined, link);
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'true');
    hoverOut(link);
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
  });

  it('닫혀 있을 때 나가도 아무 일이 없다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    hoverOut(slotOf('제품'));
    expect(getTrigger('제품')).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('navStyle="dropdown" 보이지 않는 다리 (CSSOM)', () => {
  it('판 위에 판 폭 전체로 깔리고 높이가 판 위 끝에서 버튼 아래 끝까지다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const bridge = ruleOf(/\.HeaderBar_dropdownPanel__[^\s:]+::before$/);
    expect(decl(bridge, 'content')).toBe('""');
    expect(decl(bridge, 'position')).toBe('absolute');
    expect(decl(bridge, 'bottom')).toBe('100%');
    expect(decl(bridge, 'left')).toBe('0');
    expect(decl(bridge, 'right')).toBe('0');
    // 판은 바 아래 spacing[2]에서 시작하고, 버튼은 바 안 가운데에 있다.
    expect(decl(bridge, 'height')).toBe(
      `calc(${themeContract.spacing[2]} + ${(BAR_HEIGHT - DROPDOWN_ITEM_HEIGHT) / 2}px)`
    );
  });

  it('버튼 높이가 정해져 있어 다리 높이와 어긋나지 않는다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const trigger = ruleOf(/\.HeaderBar_dropdownTrigger__[^\s:]+$/);
    expect(decl(trigger, 'height')).toBe(`${DROPDOWN_ITEM_HEIGHT}px`);
    expect(getTrigger('제품')).toHaveClass(/dropdownTrigger/);
  });

  it('판이 닫혀 있으면 다리도 숨는다: 다리가 자기 visibility를 정하지 않고 판을 따른다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const bridge = ruleOf(/\.HeaderBar_dropdownPanel__[^\s:]+::before$/);
    expect(decl(bridge, 'visibility')).toBeUndefined();
    expect(
      decl(ruleOf(/\.HeaderBar_dropdownPanel__[^\s:]+$/), 'visibility')
    ).toBe('hidden');
  });
});

describe('navStyle="dropdown" 바탕 (CSSOM)', () => {
  it('판 안 링크도 textItem이라 같은 옅은 바탕을 쓴다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const link = within(openDrop('제품')).getByRole('link', { name: '버튼' });
    expect(link).toHaveClass(/textItem/);
    expect(
      decl(
        ruleOf(/\.HeaderBar_textItem__[^\s:]+:focus-visible$/),
        'background-color'
      )
    ).toBe(TINT_HOVER);
  });
});

describe('navStyle="dropdown" 좁은 화면', () => {
  it('세로 목록 판에서 links 항목은 하위 링크를 들여 써서 펼쳐 둔다(접기 없이)', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = openNarrowPanel();
    const group = within(panel).getByRole('group', { name: '제품' });
    expect(within(group).getByRole('link', { name: '버튼' })).toHaveClass(
      /panelSubItem/
    );
    expect(
      within(group).getByRole('button', { name: '헤더' })
    ).toBeInTheDocument();
    // 접기 토글이 아니다.
    expect(
      within(panel).queryByRole('button', { name: '제품' })
    ).not.toBeInTheDocument();
    expect(
      within(panel).getByRole('group', { name: '회사' })
    ).toBeInTheDocument();
    // links 없는 항목은 그대로 항목이다.
    expect(within(panel).getByRole('link', { name: '문의' })).toBeVisible();
  });

  it('하위 링크는 항목보다 spacing[6] 들여 쓴다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    expect(
      decl(ruleOf(/\.HeaderBar_panelSubItem__[^\s:]+$/), 'padding-left')
    ).toBe(themeContract.spacing[6]);
  });

  it('하위 링크를 누르면 좁은 화면 판이 닫히고 포커스가 햄버거로 간다', () => {
    render(<HeaderBar navStyle="dropdown" items={dropdownItems} />);
    const panel = openNarrowPanel();
    fireEvent.click(within(panel).getByRole('link', { name: '소개' }));
    expect(screen.getByRole('button', { name: '메뉴 열기' })).toHaveFocus();
  });

  it('dropdown이 아니면 좁은 화면 판에서도 links를 펼치지 않는다', () => {
    render(<HeaderBar navStyle="text" items={dropdownItems} />);
    const panel = openNarrowPanel();
    expect(within(panel).queryByRole('group')).not.toBeInTheDocument();
    expect(
      within(panel).getByRole('button', { name: '제품' })
    ).toBeInTheDocument();
  });
});
