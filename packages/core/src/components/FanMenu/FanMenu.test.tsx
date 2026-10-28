import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FanMenu, type FanMenuItem } from './FanMenu';

const FINE = '(hover: hover) and (pointer: fine)';
const REDUCE = '(prefers-reduced-motion: reduce)';

// matchMedia 보급품: 질의별로 맞음 여부를 정한다(JellyText 시험과 같은 방식)
const installMedia = ({ fine = true, reduced = false } = {}) =>
  vi.stubGlobal(
    'matchMedia',
    (q: string): MediaQueryList =>
      ({
        media: q,
        matches: q === FINE ? fine : q === REDUCE ? reduced : false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const NAMES = ['사진', '메시지', '음악', '위치', '좋아요'];
const makeItems = (
  onSelect: (name: string) => void = () => {},
  names = NAMES
): FanMenuItem[] =>
  names.map((name) => ({
    icon: <svg data-icon={name} />,
    label: name,
    onSelect: () => onSelect(name),
  }));

const setup = (props: Partial<Parameters<typeof FanMenu>[0]> = {}) => {
  const utils = render(
    <>
      <button>앞</button>
      <FanMenu label="빠른 작업" items={makeItems()} {...props} />
      <button>뒤</button>
    </>
  );
  return {
    ...utils,
    hub: screen.getByRole('button', { name: '빠른 작업' }),
    menu: screen.getByRole('menu', { hidden: true }),
  };
};
const itemsOf = () => screen.getAllByRole('menuitem', { hidden: true });

// jsdom에는 PointerEvent가 없다. MouseEvent를 pointer 이름으로 쏜다(데모 대본의 합성 이벤트와 같은 길이다).
// 허브는 레이아웃이 없어 가운데가 (0, 0)이다. 위쪽은 clientY가 음수다.
const pointer = (type: string, x: number, y: number, target?: Element) =>
  act(() => {
    (target ?? document).dispatchEvent(
      new MouseEvent(type, { bubbles: true, clientX: x, clientY: y })
    );
  });
// 허브 가운데에서 각도 deg(도), 거리 r만큼 떨어진 곳으로 포인터를 옮긴다
const moveTo = (deg: number, r = 100, target?: Element) =>
  pointer(
    'pointermove',
    Math.cos((deg * Math.PI) / 180) * r,
    -Math.sin((deg * Math.PI) / 180) * r,
    target
  );
const hotNames = () =>
  itemsOf()
    .filter((el) => el.hasAttribute('data-hot'))
    .map((el) => el.getAttribute('aria-label'));
const tagOf = (container: HTMLElement) =>
  container.querySelector('[class*="tag"]') as HTMLElement;

describe('FanMenu', () => {
  describe('허브와 접근성', () => {
    it('허브는 메뉴 단추 패턴이고 이름은 열림과 무관하게 고정이다', async () => {
      const { hub, menu } = setup();
      expect(hub).toHaveAttribute('aria-haspopup', 'menu');
      expect(hub).toHaveAttribute('aria-expanded', 'false');
      expect(hub).toHaveAttribute('aria-controls', menu.id);
      expect(menu).toHaveAttribute('aria-label', '빠른 작업');
      await userEvent.click(hub);
      expect(hub).toHaveAttribute('aria-expanded', 'true');
      expect(hub).toHaveAccessibleName('빠른 작업');
      await userEvent.click(hub);
      expect(hub).toHaveAttribute('aria-expanded', 'false');
    });

    it('항목은 role=menuitem이고 이름은 label이다. 아이콘 칸과 이름표는 장식이다', async () => {
      const { hub, container } = setup();
      await userEvent.click(hub);
      expect(
        screen
          .getAllByRole('menuitem')
          .map((el) => el.getAttribute('aria-label'))
      ).toEqual(NAMES);
      expect(tagOf(container)).toHaveAttribute('aria-hidden', 'true');
      expect(
        container.querySelector('[data-icon="사진"]')!.parentElement
      ).toHaveAttribute('aria-hidden', 'true');
    });

    it('ref는 허브 단추로 가고 className은 루트로 간다', () => {
      const ref = createRef<HTMLButtonElement>();
      const { hub, container } = setup({ ref, className: 'mine' });
      expect(ref.current).toBe(hub);
      expect(container.querySelector('.mine')).toContainElement(hub);
    });

    it('disabled면 허브가 눌리지 않는다', async () => {
      const { hub } = setup({ disabled: true });
      expect(hub).toBeDisabled();
      await userEvent.click(hub);
      expect(hub).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('닫힌 상태', () => {
    it('항목 묶음이 inert이고 열리면 풀린다', async () => {
      const { hub, menu } = setup();
      expect(menu).toHaveAttribute('inert');
      await userEvent.click(hub);
      expect(menu).not.toHaveAttribute('inert');
      await userEvent.click(hub);
      expect(menu).toHaveAttribute('inert');
    });

    it('Tab이 허브 다음 요소로 바로 간다', async () => {
      setup();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: '앞' })).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: '빠른 작업' })).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: '뒤' })).toHaveFocus();
    });
  });

  describe('열기와 포커스', () => {
    it('마우스로 열면 허브에 포커스가 남는다', async () => {
      const { hub } = setup();
      await userEvent.click(hub);
      expect(hub).toHaveFocus();
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
      ['ArrowUp', '{ArrowUp}'],
    ])('%s로 열면 첫 항목에 포커스가 간다', async (_name, key) => {
      const { hub } = setup();
      hub.focus();
      await userEvent.keyboard(key);
      expect(hub).toHaveAttribute('aria-expanded', 'true');
      expect(itemsOf()[0]).toHaveFocus();
    });

    it('열린 허브에서 Tab은 로빙 항목으로, 거기서 Tab은 메뉴 밖으로 나가며 접는다', async () => {
      const { hub } = setup();
      await userEvent.click(hub);
      await userEvent.tab();
      expect(itemsOf()[0]).toHaveFocus();
      expect(itemsOf().filter((el) => el.tabIndex === 0)).toHaveLength(1);
      await userEvent.tab();
      expect(screen.getByRole('button', { name: '뒤' })).toHaveFocus();
      expect(hub).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('키보드 이동', () => {
    const openByKey = async () => {
      const utils = setup();
      utils.hub.focus();
      await userEvent.keyboard('{Enter}');
      return utils;
    };

    it('오른쪽과 아래쪽은 호를 따라 다음으로, 왼쪽과 위쪽은 이전으로 가고 끝에서 감긴다', async () => {
      await openByKey();
      await userEvent.keyboard('{ArrowRight}');
      expect(itemsOf()[1]).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(itemsOf()[2]).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(itemsOf()[1]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
      expect(itemsOf()[4]).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      expect(itemsOf()[0]).toHaveFocus();
    });

    it('Home과 End는 양 끝으로 간다', async () => {
      await openByKey();
      await userEvent.keyboard('{End}');
      expect(itemsOf()[4]).toHaveFocus();
      await userEvent.keyboard('{Home}');
      expect(itemsOf()[0]).toHaveFocus();
    });

    it('로빙 tabindex는 포커스를 따라간다', async () => {
      await openByKey();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}');
      expect(itemsOf().map((el) => el.tabIndex)).toEqual([-1, -1, 0, -1, -1]);
    });

    it('포커스된 항목은 가리킨 항목처럼 이름표가 뜬다', async () => {
      const { container } = await openByKey();
      await userEvent.keyboard('{ArrowRight}');
      expect(hotNames()).toEqual(['메시지']);
      expect(tagOf(container)).toHaveAttribute('data-on');
      expect(tagOf(container)).toHaveTextContent('메시지');
    });
  });

  describe('접기와 선택', () => {
    it('Esc는 접고 허브로 포커스를 돌린다', async () => {
      const { hub } = setup();
      hub.focus();
      await userEvent.keyboard('{Enter}');
      expect(itemsOf()[0]).toHaveFocus();
      await userEvent.keyboard('{Escape}');
      expect(hub).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(hub);
    });

    it('항목을 Enter로 고르면 onSelect가 한 번 불리고 접히며 허브로 포커스가 돌아온다', async () => {
      const onSelect = vi.fn();
      const { hub } = setup({ items: makeItems(onSelect) });
      hub.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard('{ArrowRight}{Enter}');
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('메시지');
      await waitFor(() =>
        expect(hub).toHaveAttribute('aria-expanded', 'false')
      );
      expect(document.activeElement).toBe(hub);
    });

    it('항목을 click으로 골라도 한 번만 불린다(번쩍이는 동안 다시 눌러도)', async () => {
      const onSelect = vi.fn();
      const { hub } = setup({ items: makeItems(onSelect) });
      await userEvent.click(hub);
      await userEvent.click(itemsOf()[2]);
      await userEvent.click(itemsOf()[2]);
      expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(hub).toHaveAttribute('aria-expanded', 'false')
      );
      expect(document.activeElement).toBe(hub);
    });

    it('고른 항목은 번쩍이다가 접힌다(바로 접히지 않는다)', async () => {
      const { hub, container } = setup();
      await userEvent.click(hub);
      await userEvent.click(itemsOf()[0]);
      expect(hub).toHaveAttribute('aria-expanded', 'true');
      expect(
        container.querySelector('[class*="flash"][data-on]')
      ).not.toBeNull();
      await waitFor(() =>
        expect(hub).toHaveAttribute('aria-expanded', 'false')
      );
    });

    it('움직임 줄이기에서는 번쩍임 없이 바로 접힌다', async () => {
      installMedia({ reduced: true });
      const onSelect = vi.fn();
      const { hub, container } = setup({ items: makeItems(onSelect) });
      await userEvent.click(hub);
      await userEvent.click(itemsOf()[0]);
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(hub).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(hub);
      expect(container.querySelector('[class*="flash"][data-on]')).toBeNull();
    });

    it('바깥 mousedown으로 접히고 안쪽 mousedown으로는 접히지 않으며 pointerdown만으로는 접히지 않는다', async () => {
      const { hub } = setup();
      await userEvent.click(hub);
      const outside = screen.getByRole('button', { name: '뒤' });
      pointer('mousedown', 0, 0, hub);
      expect(hub).toHaveAttribute('aria-expanded', 'true');
      // 다른 데모 대본의 합성 pointerdown은 메뉴를 접지 않는다
      pointer('pointerdown', 0, 0, outside);
      expect(hub).toHaveAttribute('aria-expanded', 'true');
      pointer('mousedown', 0, 0, outside);
      expect(hub).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('가리킴', () => {
    it('정밀 포인터에서는 가운데에서 포인터까지의 방향에 가장 가까운 항목이 커진다', async () => {
      installMedia();
      const { hub } = setup();
      await userEvent.click(hub);
      moveTo(180);
      expect(hotNames()).toEqual(['사진']);
      moveTo(100);
      expect(hotNames()).toEqual(['음악']);
      moveTo(10);
      expect(hotNames()).toEqual(['좋아요']);
    });

    it('이름표가 가리킨 항목의 이름으로 뜨고 범위 밖으로 나가면 꺼진다', async () => {
      installMedia();
      const { hub, container } = setup();
      await userEvent.click(hub);
      moveTo(135);
      expect(tagOf(container)).toHaveAttribute('data-on');
      expect(tagOf(container)).toHaveTextContent('메시지');
      moveTo(135, 300);
      expect(hotNames()).toEqual([]);
      expect(tagOf(container)).not.toHaveAttribute('data-on');
    });

    it('이름표 위로 포인터가 올라와도 가리킴과 이름표가 남는다', async () => {
      installMedia();
      const { hub, container } = setup();
      await userEvent.click(hub);
      moveTo(135);
      // 같은 자리 방향이 다른 항목이어도 이름표 위의 움직임은 가리킴을 바꾸지 않는다
      moveTo(45, 100, tagOf(container));
      expect(hotNames()).toEqual(['메시지']);
      expect(tagOf(container)).toHaveAttribute('data-on');
    });

    it('정밀 포인터가 아니면 pointermove 뒤에도 가리킴이 없다', async () => {
      installMedia({ fine: false });
      const { hub } = setup();
      await userEvent.click(hub);
      moveTo(100);
      expect(hotNames()).toEqual([]);
    });

    it('접으면 가리킴이 풀린다', async () => {
      installMedia();
      const { hub } = setup();
      await userEvent.click(hub);
      moveTo(100);
      await userEvent.click(hub);
      expect(hotNames()).toEqual([]);
    });
  });

  describe('개수', () => {
    it('2~8개 밖이면 개발 경고를 한 번 내고 8개까지만 그린다', () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const names = Array.from({ length: 9 }, (_, i) => `항목${i}`);
        const { rerender } = render(
          <FanMenu label="많음" items={makeItems(() => {}, names)} />
        );
        rerender(<FanMenu label="많음" items={makeItems(() => {}, names)} />);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(itemsOf()).toHaveLength(8);
      } finally {
        process.env.NODE_ENV = original;
      }
    });

    it('범위 안이면 경고하지 않는다', () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        render(
          <FanMenu label="적당" items={makeItems(() => {}, ['a', 'b'])} />
        );
        expect(warn).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = original;
      }
    });

    it('1개면 경고하고 그 하나는 그린다', () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        render(<FanMenu label="하나" items={makeItems(() => {}, ['a'])} />);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(itemsOf()).toHaveLength(1);
      } finally {
        process.env.NODE_ENV = original;
      }
    });
  });

  describe('차례와 시차', () => {
    it('열 때는 45ms씩 차례로, 닫을 때는 30ms씩 거꾸로 지연이 걸린다', async () => {
      const { hub } = setup();
      const delays = () =>
        itemsOf().map((el) =>
          (el as HTMLElement).style.getPropertyValue('--fan-delay')
        );
      await userEvent.click(hub);
      const open = delays();
      expect(open[0]).toMatch(/\* 0\.3 \* 0\)$/);
      expect(open[4]).toMatch(/\* 0\.3 \* 4\)$/);
      await userEvent.click(hub);
      const closed = delays();
      expect(closed[0]).toMatch(/\* 0\.2 \* 4\)$/);
      expect(closed[4]).toMatch(/\* 0\.2 \* 0\)$/);
    });

    it('열고 닫는 동안만 data-settling이 켜져 가리킴 전이에는 시차가 없다', async () => {
      const { hub, container } = setup();
      const root = container.querySelector('[class*="FanMenu_root"]')!;
      await userEvent.click(hub);
      expect(root).toHaveAttribute('data-settling');
      await waitFor(() => expect(root).not.toHaveAttribute('data-settling'), {
        timeout: 2000,
      });
    });
  });

  describe('CSS (CSSOM)', () => {
    const sheet = () =>
      Array.from(document.styleSheets).find((candidate) =>
        Array.from(candidate.cssRules).some((rule) =>
          rule.cssText.includes('FanMenu_item')
        )
      )!;
    const reducedRules = () =>
      Array.from(sheet().cssRules)
        .filter((r): r is CSSMediaRule => r instanceof CSSMediaRule)
        .filter((m) => /prefers-reduced-motion/.test(m.conditionText))
        .flatMap((m) => Array.from(m.cssRules) as CSSStyleRule[]);

    // render로 CSS가 주입되게 한다
    const inject = () => render(<FanMenu label="x" items={makeItems()} />);

    it('움직임 줄이기에서 항목·안내선·빛나는 선·+ 회전·이름표의 전이가 꺼지고 번쩍임이 없다', () => {
      inject();
      const reduced = reducedRules();
      for (const name of ['item', 'guide', 'glow', 'plus', 'tag', 'hub']) {
        const rule = reduced.find((r) =>
          new RegExp(`FanMenu_${name}__\\w+$`).test(r.selectorText)
        );
        expect(rule, name).toBeDefined();
        expect(rule!.style.getPropertyValue('transition'), name).toBe('none');
      }
      const flash = reduced.find((r) => /FanMenu_flash__/.test(r.selectorText));
      expect(flash!.style.getPropertyValue('animation')).toBe('none');
    });

    it('빛나는 선은 dashoffset이 100에서 0으로 그려지고 열린 상태에서만 켜진다', () => {
      inject();
      const rules = Array.from(sheet().cssRules).filter(
        (r): r is CSSStyleRule => r instanceof CSSStyleRule
      );
      const base = rules.find((r) =>
        /FanMenu_glow__\w+$/.test(r.selectorText)
      )!;
      expect(base.style.getPropertyValue('stroke-dashoffset')).toBe('100');
      expect(base.style.getPropertyValue('transition')).toContain(
        'stroke-dashoffset'
      );
      const open = rules.find(
        (r) =>
          /data-open/.test(r.selectorText) &&
          /FanMenu_glow/.test(r.selectorText)
      )!;
      expect(open.style.getPropertyValue('stroke-dashoffset')).toBe('0');
    });

    it('가리킨 항목은 1.38배로 커지고 닫힌 항목은 0.6배 이하로 작다', () => {
      inject();
      const rules = Array.from(sheet().cssRules).filter(
        (r): r is CSSStyleRule => r instanceof CSSStyleRule
      );
      const hot = rules.find((r) => /data-hot/.test(r.selectorText))!;
      expect(hot.style.getPropertyValue('transform')).toContain('scale(1.38)');
      const closed = rules.find((r) =>
        /FanMenu_item__\w+$/.test(r.selectorText)
      )!;
      expect(closed.style.getPropertyValue('transform')).toContain(
        'scale(0.6)'
      );
    });
  });
});
