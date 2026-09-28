/**
 * M3 T8 — HeaderBarNav. 커서/포커스 근접 확대 + 가드 2개.
 *
 * jsdom에는 레이아웃이 없다(getBoundingClientRect 등이 전부 0 — 선결 사실 9).
 * 포인터 경로는 여기서 끝까지 검증할 수 없으므로, 순수 함수(itemCenter·
 * proximityScales)와 "포커스도 같은 신호"라는 사실을 이용해 키보드 경로로
 * 끝까지 검증한다(Ruling 59). GSAP 티커도 jsdom에서 안 돌므로(선결 사실 10)
 * `__navScaleSetters`로 실제 quickTo 트윈을 꺼내 `tween.progress()`로 직접
 * seek한다 — 실제 GSAP 인스턴스를 조작하는 것이므로 무모킹 규칙에 맞다
 * (Snackbar.test.tsx의 `__countdownTween`과 같은 통로 모양).
 *
 * gsap은 타입 전용으로만 쓴다 — 값 import를 안 해도 `gsap.quickTo`가 앰비언트
 * 전역 네임스페이스로 잡힌다(`_internal/useOverlayTransition.test.ts:26,59`가
 * 선례). 그래서 이 파일은 `gsapGateEnforcement.test.ts`의 스캔 대상이 아니다.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  HeaderBarNav,
  itemCenter,
  proximityScales,
  type HeaderBarNavItem,
} from './HeaderBarNav';
import {
  ITEM_SCALE_VAR,
  RESERVED_SIZE,
  ITEM_PITCH,
  MAX_SCALE,
} from './HeaderBarNav.css';

/** Snackbar.tsx의 CountdownTweenHost와 같은 모양의 테스트 전용 통로. */
type NavScaleSetterHost = HTMLElement & {
  __navScaleSetters?: ReturnType<typeof gsap.quickTo>[];
};

/** jsdom은 matchMedia를 구현하지 않는다 — 축소 선호 경로를 열려면 깔아야 한다. */
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

const makeItems = (count: number): HeaderBarNavItem[] =>
  Array.from({ length: count }, (_, i) => ({
    icon: `icon-${i}`,
    label: `항목 ${i}`,
  }));

const getPills = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll('[aria-hidden="true"]'));

const readScale = (pill: HTMLElement): number =>
  Number(pill.style.getPropertyValue(ITEM_SCALE_VAR));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('itemCenter · proximityScales — 순수 함수 (DOM 없음)', () => {
  it('상수로부터 항목 중심을 계산한다', () => {
    expect(itemCenter(0)).toBe(RESERVED_SIZE / 2 + 0 * ITEM_PITCH);
    expect(itemCenter(1)).toBe(RESERVED_SIZE / 2 + 1 * ITEM_PITCH);
    expect(itemCenter(2)).toBe(RESERVED_SIZE / 2 + 2 * ITEM_PITCH);
    expect(itemCenter(0)).toBe(28);
    expect(itemCenter(1)).toBe(92);
    expect(itemCenter(2)).toBe(156);
  });

  it('"양옆 이웃은 절반만 부푼다"의 산술 증명', () => {
    const scales = proximityScales(itemCenter(2), 5);
    expect(scales[0]).toBeCloseTo(1);
    expect(scales[1]).toBeCloseTo(1.2);
    expect(scales[2]).toBeCloseTo(1.4);
    expect(scales[3]).toBeCloseTo(1.2);
    expect(scales[4]).toBeCloseTo(1);
  });

  it('가드 1: 정의역을 훑어도 배율이 [1, MAX_SCALE]을 벗어나지 않는다', () => {
    const from = -200;
    const to = itemCenter(4) + 200;
    for (let origin = from; origin <= to; origin += 1) {
      const scales = proximityScales(origin, 5);
      for (const scale of scales) {
        expect(scale).toBeGreaterThanOrEqual(1);
        expect(scale).toBeLessThanOrEqual(MAX_SCALE);
      }
    }
  });

  it('origin이 null(쉼)이면 전부 rest다', () => {
    expect(proximityScales(null, 3)).toEqual([1, 1, 1]);
  });
});

describe('HeaderBarNav — 렌더·접근성', () => {
  it('nav 랜드마크가 있고 기본 aria-label(주요 메뉴)이 붙는다', () => {
    render(<HeaderBarNav items={makeItems(3)} />);
    expect(
      screen.getByRole('navigation', { name: '주요 메뉴' })
    ).toBeInTheDocument();
  });

  it('aria-label을 넘기면 그 값을 쓴다', () => {
    render(<HeaderBarNav items={makeItems(3)} aria-label="커스텀 메뉴" />);
    expect(
      screen.getByRole('navigation', { name: '커스텀 메뉴' })
    ).toBeInTheDocument();
  });

  it('모든 항목이 label을 접근성 이름으로 갖는다', () => {
    render(<HeaderBarNav items={makeItems(3)} />);
    expect(screen.getByRole('button', { name: '항목 0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '항목 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '항목 2' })).toBeInTheDocument();
  });

  it('href를 준 항목은 link 롤로 잡히고 href가 그 값이다', () => {
    const items = makeItems(2);
    items[0].href = '/home';
    render(<HeaderBarNav items={items} />);
    expect(screen.getByRole('link', { name: '항목 0' })).toHaveAttribute(
      'href',
      '/home'
    );
  });

  it('onClick을 준 항목을 클릭하면 호출된다', () => {
    const onClick = vi.fn();
    const items = makeItems(2);
    items[1].onClick = onClick;
    render(<HeaderBarNav items={items} />);
    fireEvent.click(screen.getByRole('button', { name: '항목 1' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('HeaderBarNav — 키보드 = 포인터와 같은 신호', () => {
  it('두 번째 항목에 포커스하면 그 항목이 1.4, 양옆이 1.2, 그 밖은 1이다', () => {
    const { container } = render(<HeaderBarNav items={makeItems(5)} />);
    const nav = screen.getByRole('navigation') as NavScaleSetterHost;

    fireEvent.focus(screen.getByRole('button', { name: '항목 1' }));

    const setters = nav.__navScaleSetters ?? [];
    expect(setters).toHaveLength(5);
    setters.forEach((setter) => setter.tween.progress(1));

    const pills = getPills(container);
    expect(readScale(pills[0])).toBeCloseTo(1.2);
    expect(readScale(pills[1])).toBeCloseTo(1.4);
    expect(readScale(pills[2])).toBeCloseTo(1.2);
    expect(readScale(pills[3])).toBeCloseTo(1);
    expect(readScale(pills[4])).toBeCloseTo(1);
  });

  it('정착 전에 포커스를 옮겨도 배율이 0이나 1로 순간이동하지 않는다 (명제 조항 1③, Ruling 87)', () => {
    const { container } = render(<HeaderBarNav items={makeItems(5)} />);
    const nav = screen.getByRole('navigation') as NavScaleSetterHost;
    const pills = getPills(container);

    fireEvent.focus(screen.getByRole('button', { name: '항목 1' }));
    const setters = nav.__navScaleSetters ?? [];
    expect(setters).toHaveLength(5);

    // 항목 1의 트윈만 부분 진행시킨다 — progress(1)로 정착하지 않는다.
    setters[1].tween.progress(0.3);
    const midValue = readScale(pills[1]);
    expect(midValue).toBeGreaterThan(1);
    expect(midValue).toBeLessThan(1.4);

    // 정착 전에 다른 항목(3)으로 포커스를 옮긴다 — quickTo 재목표(다중 목표 중단).
    fireEvent.focus(screen.getByRole('button', { name: '항목 3' }));

    // 여기서 곧장 읽는다 — settle(progress(1))을 아직 아무 트윈에도 안 걸었다.
    // quickTo는 재목표해도 progress()는 새 트윈 기준 0으로 보이지만, 렌더된 값은
    // 그 순간의 값에서 그대로 이어받는다 — 0(쉼)이나 1.4(항목 1이 새로 원점일 때의
    // 최댓값)로 순간이동했다면 이 재현이 실패한다.
    const afterInterrupt = readScale(pills[1]);
    expect(afterInterrupt).not.toBeCloseTo(1, 5);
    expect(afterInterrupt).toBeCloseTo(midValue, 5);

    // 이제 전부 정착한다 — 최종값을 확인한다. 원점이 항목 3으로 옮겨갔으니
    // 항목 1은 두 칸 이상 떨어져 쉼(1)으로, 항목 3은 1.4로 향한다.
    setters.forEach((setter) => setter.tween.progress(1));
    expect(readScale(pills[1])).toBeCloseTo(1, 5);
    expect(readScale(pills[3])).toBeCloseTo(1.4);
  });

  it('nav 밖으로 blur가 나가면(relatedTarget이 nav 밖) 모두 1로 돌아온다', () => {
    const { container } = render(<HeaderBarNav items={makeItems(3)} />);
    const nav = screen.getByRole('navigation') as NavScaleSetterHost;

    fireEvent.focus(screen.getByRole('button', { name: '항목 0' }));
    const setters = nav.__navScaleSetters ?? [];
    setters.forEach((setter) => setter.tween.progress(1));
    expect(readScale(getPills(container)[0])).toBeCloseTo(1.4);

    fireEvent.blur(nav, { relatedTarget: document.body });
    setters.forEach((setter) => setter.tween.progress(1));

    for (const pill of getPills(container)) {
      expect(readScale(pill)).toBeCloseTo(1);
    }
  });
});

describe('HeaderBarNav — 축소 선호 (Ruling 53의 비용을 막는 왕복)', () => {
  it('축소 선호면 포커스해도 배율이 커지지 않는다', () => {
    installReducedMotion(true);
    const { container } = render(<HeaderBarNav items={makeItems(3)} />);
    const nav = screen.getByRole('navigation') as NavScaleSetterHost;

    fireEvent.focus(screen.getByRole('button', { name: '항목 1' }));

    expect(nav.__navScaleSetters ?? []).toHaveLength(0);
    for (const pill of getPills(container)) {
      const raw = pill.style.getPropertyValue(ITEM_SCALE_VAR);
      expect(raw === '' || Number(raw) === 1).toBe(true);
    }
  });

  it('왕복: 부풀린 뒤 축소 선호로 다시 렌더하면 settleMotion 경로가 전부 1로 되돌린다', () => {
    installReducedMotion(false);
    const { container, rerender } = render(
      <HeaderBarNav items={makeItems(3)} />
    );
    const nav = screen.getByRole('navigation') as NavScaleSetterHost;

    fireEvent.focus(screen.getByRole('button', { name: '항목 1' }));
    (nav.__navScaleSetters ?? []).forEach((setter) => setter.tween.progress(1));
    expect(readScale(getPills(container)[1])).toBeCloseTo(1.4);

    installReducedMotion(true);
    rerender(<HeaderBarNav items={makeItems(3)} />);

    for (const pill of getPills(container)) {
      expect(readScale(pill)).toBeCloseTo(1);
    }
    expect(nav.__navScaleSetters ?? []).toHaveLength(0);
  });
});

describe('HeaderBarNav — CSSOM 잠금 (가드 2를 구조로 고정)', () => {
  function findHeaderBarNavStyleSheet(): CSSStyleSheet {
    const sheet = Array.from(document.styleSheets).find((candidate) =>
      Array.from(candidate.cssRules).some((rule) =>
        rule.cssText.includes('HeaderBarNav_')
      )
    );
    if (!sheet) {
      throw new Error('HeaderBarNav.css.ts가 생성한 스타일시트를 찾지 못했다');
    }
    return sheet;
  }

  /** pseudo 선택자(`:`)가 없는 기본 규칙만 잡는다 — hover/active 규칙과 안 섞이게. */
  function findBaseRule(
    sheet: CSSStyleSheet,
    selectorSubstring: string
  ): CSSStyleRule {
    const rule = Array.from(sheet.cssRules).find(
      (candidate): candidate is CSSStyleRule =>
        candidate instanceof CSSStyleRule &&
        candidate.selectorText.includes(selectorSubstring) &&
        !candidate.selectorText.includes(':')
    );
    if (!rule) {
      throw new Error(`"${selectorSubstring}" 셀렉터 규칙을 찾지 못했다`);
    }
    return rule;
  }

  it('item(히트 영역) 규칙에 transform이 없다', () => {
    render(<HeaderBarNav items={makeItems(1)} />);
    const rule = findBaseRule(findHeaderBarNavStyleSheet(), 'item');
    expect(rule.style.getPropertyValue('transform')).toBe('');
  });

  it('item(히트 영역)은 56px 정사각으로 고정이다', () => {
    render(<HeaderBarNav items={makeItems(1)} />);
    const rule = findBaseRule(findHeaderBarNavStyleSheet(), 'item');
    expect(rule.style.width).toBe('56px');
    expect(rule.style.height).toBe('56px');
  });
});
