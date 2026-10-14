import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from './Badge';
import { valueExiting, directionDown } from './Badge.css';

const BADGE_CSS = readFileSync(resolve(__dirname, './Badge.css.ts'), 'utf-8');

// 루트에는 기본 role이 없다(M5 task-25). RTL 컨테이너의 첫 자식 span이 루트다.
const getRoot = () =>
  document.body.firstElementChild!.firstElementChild as HTMLElement;

describe('Badge', () => {
  describe('렌더링 테스트', () => {
    it('기본적으로 렌더링된다', () => {
      render(<Badge>5</Badge>);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('텍스트 뱃지를 렌더링한다', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('숫자 뱃지를 렌더링한다', () => {
      render(<Badge>99</Badge>);
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('children이 없으면 렌더링되지 않는다', () => {
      const { container } = render(<Badge />);
      expect(container.firstChild).toBeNull();
    });

    it('0을 렌더링한다', () => {
      render(<Badge>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('max prop 테스트', () => {
    it('max 값보다 큰 숫자는 max+ 형태로 표시한다', () => {
      render(<Badge max={99}>100</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('max 값과 같은 숫자는 그대로 표시한다', () => {
      render(<Badge max={99}>99</Badge>);
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('max 값보다 작은 숫자는 그대로 표시한다', () => {
      render(<Badge max={99}>50</Badge>);
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('텍스트에는 max가 적용되지 않는다', () => {
      render(<Badge max={99}>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('기본 max 값은 99이다', () => {
      render(<Badge>100</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  // variant·size 클래스는 루트가 갖는다. 값(텍스트)은 그 안의 별도 값
  // 노드에 있으므로(M2 T3c, Badge 값 교체 두 스팬 구조) getByText 대신
  // getRoot()로 루트를 찾는다.
  describe('variant prop 테스트', () => {
    it('primary variant를 렌더링한다', () => {
      render(<Badge variant="primary">5</Badge>);
      const badge = getRoot();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(badge.className).toContain('primary');
    });

    it('secondary variant를 렌더링한다', () => {
      render(<Badge variant="secondary">5</Badge>);
      const badge = getRoot();
      expect(badge.className).toContain('secondary');
    });

    it('success variant를 렌더링한다', () => {
      render(<Badge variant="success">5</Badge>);
      const badge = getRoot();
      expect(badge.className).toContain('success');
    });

    it('error variant를 렌더링한다', () => {
      render(<Badge variant="error">5</Badge>);
      const badge = getRoot();
      expect(badge.className).toContain('error');
    });

    it('warning variant를 렌더링한다', () => {
      render(<Badge variant="warning">5</Badge>);
      const badge = getRoot();
      expect(badge.className).toContain('warning');
    });

    it('기본 variant는 primary이다', () => {
      render(<Badge>5</Badge>);
      const badge = getRoot();
      expect(badge.className).toContain('primary');
    });
  });

  describe('size prop 테스트', () => {
    it('sm 크기를 렌더링한다', () => {
      render(<Badge size="sm">5</Badge>);
      const badge = getRoot();
      expect(badge.className).toContain('sm');
    });

    it('md 크기를 렌더링한다', () => {
      render(<Badge size="md">5</Badge>);
      const badge = getRoot();
      expect(badge.className).toContain('md');
    });

    it('lg 크기를 렌더링한다', () => {
      render(<Badge size="lg">5</Badge>);
      const badge = getRoot();
      expect(badge.className).toContain('lg');
    });

    it('기본 크기는 md이다', () => {
      render(<Badge>5</Badge>);
      const badge = getRoot();
      expect(badge.className).toContain('md');
    });
  });

  describe('dot prop 테스트', () => {
    it('dot 모드에서는 숫자 대신 점만 표시한다', () => {
      render(<Badge dot>5</Badge>);
      expect(screen.queryByText('5')).not.toBeInTheDocument();
      const badge = getRoot();
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('dot');
    });

    it('dot 모드에서도 variant가 적용된다', () => {
      render(<Badge dot variant="error" />);
      const badge = getRoot();
      expect(badge.className).toContain('dot');
      expect(badge.className).toContain('error');
    });
  });

  describe('0 표시 (showZero 삭제, M5 task-25 결정 2)', () => {
    it('0이면 늘 "0"을 보인다', () => {
      render(<Badge>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('숫자 0 children도 "0"을 보인다', () => {
      render(<Badge>{0}</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('showZero prop이 없다 (타입)', () => {
      // @ts-expect-error showZero는 삭제됐다
      render(<Badge showZero={false}>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('info variant가 없다 (타입)', () => {
      // @ts-expect-error info는 삭제됐다
      render(<Badge variant="info">5</Badge>);
      expect(getRoot()).toBeInTheDocument();
    });
  });

  describe('접근성 (M5 task-25 결정 3)', () => {
    it('루트에 기본 role이 없다', () => {
      render(<Badge>5</Badge>);
      expect(getRoot()).not.toHaveAttribute('role');
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('글자 배지에 자동 aria-label이 없다 (숫자도 텍스트도)', () => {
      const { rerender } = render(<Badge>5</Badge>);
      expect(getRoot()).not.toHaveAttribute('aria-label');
      rerender(<Badge>New</Badge>);
      expect(getRoot()).not.toHaveAttribute('aria-label');
    });

    it('글자 배지의 접근 이름은 글자다', () => {
      render(
        <button>
          알림 <Badge>5</Badge>
        </button>
      );
      expect(
        screen.getByRole('button', { name: '알림 5' })
      ).toBeInTheDocument();
    });

    it('aria-label을 주면 글자 배지에 그대로 붙는다', () => {
      render(<Badge aria-label="5개의 새 알림">5</Badge>);
      expect(getRoot()).toHaveAttribute('aria-label', '5개의 새 알림');
    });

    it('소비자가 준 role="status"와 aria-live가 루트에 붙는다', () => {
      render(
        <Badge role="status" aria-live="polite">
          5
        </Badge>
      );
      const root = screen.getByRole('status');
      expect(root).toBe(getRoot());
      expect(root).toHaveAttribute('aria-live', 'polite');
    });

    it('dot에 aria-label을 주면 role="img"와 그 이름을 갖는다', () => {
      render(<Badge dot aria-label="새 알림" />);
      const img = screen.getByRole('img', { name: '새 알림' });
      expect(img).toBe(getRoot());
      expect(img).not.toHaveAttribute('aria-hidden');
    });

    it('dot에 aria-label이 없으면 장식(aria-hidden)이고 role·이름이 없다', () => {
      render(<Badge dot />);
      const root = getRoot();
      expect(root).toHaveAttribute('aria-hidden', 'true');
      expect(root).not.toHaveAttribute('role');
      expect(root).not.toHaveAttribute('aria-label');
      expect(screen.queryByRole('img')).toBeNull();
    });

    it('dot에 소비자 role이 오면 aria-hidden을 달지 않는다', () => {
      render(<Badge dot role="status" />);
      const root = getRoot();
      expect(root).toHaveAttribute('role', 'status');
      expect(root).not.toHaveAttribute('aria-hidden');
    });

    it('dot에 aria-label과 소비자 role이 같이 오면 소비자 role이 이긴다', () => {
      render(<Badge dot aria-label="새 알림" role="status" />);
      const root = getRoot();
      expect(root).toHaveAttribute('role', 'status');
      expect(root).toHaveAttribute('aria-label', '새 알림');
    });

    it('글자 배지는 aria-hidden이 아니다', () => {
      render(<Badge>5</Badge>);
      expect(getRoot()).not.toHaveAttribute('aria-hidden');
    });
  });

  describe('숨은 색 변수와 토큰 (M5 task-25 결정 4)', () => {
    it('--badge-color가 CSS 소스에 없다', () => {
      expect(BADGE_CSS).not.toContain('--badge-color');
    });

    it('variant 면은 토큰을 바로 쓴다 (var() 감싸기 없음)', () => {
      const start = BADGE_CSS.indexOf('export const variantStyles');
      const end = BADGE_CSS.indexOf('\n});', start);
      const block = BADGE_CSS.slice(start, end);
      expect(block).not.toContain('var(');
      expect(block).toContain(
        'backgroundColor: themeContract.color.primary.main'
      );
    });

    it('badge 반경이 12px 리터럴이 아니라 borderRadius.full 토큰이다', () => {
      const start = BADGE_CSS.indexOf('export const badge = style({');
      const end = BADGE_CSS.indexOf('\n});', start);
      const block = BADGE_CSS.slice(start, end);
      expect(block).toContain('borderRadius: themeContract.borderRadius.full');
      expect(block).not.toContain("'12px'");
    });

    it('style prop으로 면 색을 직접 덮을 수 있다', () => {
      render(<Badge style={{ backgroundColor: 'rgb(1, 2, 3)' }}>5</Badge>);
      expect(getRoot().style.backgroundColor).toBe('rgb(1, 2, 3)');
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className을 적용한다', () => {
      render(<Badge className="custom-class">5</Badge>);
      // custom className은 루트에 붙는다(값 노드가 아니라).
      const badge = getRoot();
      expect(badge.className).toContain('custom-class');
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('매우 큰 숫자는 max+ 형태로 표시한다', () => {
      render(<Badge max={999}>10000</Badge>);
      expect(screen.getByText('999+')).toBeInTheDocument();
    });

    it('음수를 렌더링한다', () => {
      render(<Badge>-5</Badge>);
      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('긴 텍스트를 렌더링한다', () => {
      render(<Badge>SALE</Badge>);
      expect(screen.getByText('SALE')).toBeInTheDocument();
    });

    it('빈 문자열은 렌더링되지 않는다', () => {
      const { container } = render(<Badge>{''}</Badge>);
      expect(container.firstChild).toBeNull();
    });

    it('null은 렌더링되지 않는다', () => {
      const { container } = render(<Badge>{null}</Badge>);
      expect(container.firstChild).toBeNull();
    });

    it('undefined는 렌더링되지 않는다', () => {
      const { container } = render(<Badge>{undefined}</Badge>);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Badge 모션 잠금 (M2 T3c)', () => {
    it('값이 바뀌어도 소비자가 role="status"를 준 루트는 재마운트되지 않는다 (라이브 리전 안정성)', () => {
      const { rerender } = render(<Badge role="status">5</Badge>);
      const before = getRoot();
      rerender(<Badge role="status">6</Badge>);
      const after = getRoot();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(after).toBe(before);
    });

    it('값이 바뀌면 현재 값 노드는 재마운트된다 (key로 valueEnter를 재생한다)', () => {
      const { rerender } = render(<Badge>5</Badge>);
      const root = getRoot();
      const before = root.querySelector('span:not([aria-hidden])');
      rerender(<Badge>6</Badge>);
      const after = root.querySelector('span:not([aria-hidden])');
      expect(after).not.toBe(before);
      expect(after).toHaveTextContent('6');
    });

    it('같은 값으로 리렌더링되면 루트도 값 노드도 유지한다', () => {
      const { container, rerender } = render(<Badge>5</Badge>);
      const root = getRoot();
      const value = container.querySelector('span:not([aria-hidden])');
      rerender(<Badge variant="error">5</Badge>);
      expect(getRoot()).toBe(root);
      expect(container.querySelector('span:not([aria-hidden])')).toBe(value);
    });

    it('값이 바뀌면 헌 값이 aria-hidden 퇴장 노드로 남아 valueExiting을 재생한다', () => {
      const { rerender } = render(<Badge>5</Badge>);
      rerender(<Badge>6</Badge>);
      const root = getRoot();
      const exiting = root.querySelector('[aria-hidden="true"]');
      expect(exiting).toHaveTextContent('5');
      expect(exiting?.className).toContain(valueExiting);
      // 현재 값(6)도 동시에 존재한다 — 두 스팬이 같이 떠 있는 교체 구간이다.
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('퇴장 애니메이션이 끝나면 헌 값 노드가 제거된다 (스냅백 없이)', () => {
      const { rerender } = render(<Badge>5</Badge>);
      rerender(<Badge>6</Badge>);
      const root = getRoot();
      const exiting = root.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(exiting).toBeInTheDocument();
      fireEvent.animationEnd(exiting);
      expect(
        root.querySelector('[aria-hidden="true"]')
      ).not.toBeInTheDocument();
      // 현재 값은 그대로 남는다.
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('참조만 다른 동일 JSX 자식으로 부모가 리렌더돼도 퇴장 노드를 만들지 않는다 (변경 감지가 key와 같은 identity를 써야 한다)', () => {
      const Parent = ({ tick }: { tick: number }) => (
        <div data-tick={tick}>
          {/* JSX 리터럴은 렌더될 때마다 새 객체다 — 내용이 같아도 참조는
              다르다. 값 비교(prevValue)가 참조 비교면 "바뀌었다"고 오판해
              헌 값 유령이 뜬다. */}
          <Badge>{<span>ready</span>}</Badge>
        </div>
      );
      const { rerender } = render(<Parent tick={0} />);
      rerender(<Parent tick={1} />);
      const root = getRoot();
      expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('처음 마운트될 때는 퇴장 노드가 없다 (비교할 헌 값이 없다)', () => {
      render(<Badge>5</Badge>);
      const root = getRoot();
      expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('값이 잠깐 비었다 돌아오면 옛 값 유령이 안 뜬다 (3 → undefined → 7, 리뷰 I2)', () => {
      const { rerender } = render(<Badge>3</Badge>);

      // 1) 3 → undefined: setExitingValue(3)이 불리지만 그 직후 조기 반환이
      //    배지를 통째로 언마운트한다. 퇴장 노드가 렌더되지 않으니
      //    onAnimationEnd가 영영 안 불리고 exitingValue는 3으로 박제된다.
      rerender(<Badge>{undefined}</Badge>);
      expect(getRoot()).toBeNull();

      // 2) undefined → 7: 퇴장시킬 헌 값이 없는 경로다(prevValue가 null).
      //    여기서 박제를 지우지 않으면 3이 그대로 살아남는다.
      rerender(<Badge>7</Badge>);

      // 3) 배지가 다시 나타날 때 현재 값 7 옆에서 옛 값 3이 퇴장을 재생하면
      //    안 된다. aria-hidden이라 AT에는 안 새지만 화면에는 틀린 숫자다 —
      //    개수를 보여주는 것이 존재 이유인 컴포넌트다.
      // 무엇을 뒤집으면 빨개지는가: Badge.tsx의 else { setExitingValue(null) }를 지우면.
      const root = getRoot();
      expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.queryByText('3')).toBeNull();
    });

    it('dot 모드는 값 노드·퇴장 노드를 만들지 않는다', () => {
      const { rerender } = render(<Badge dot>5</Badge>);
      rerender(
        <Badge dot variant="error">
          6
        </Badge>
      );
      const root = getRoot();
      expect(root.querySelectorAll('span').length).toBe(0);
    });

    it('valueEnter 키프레임이 0% 시작 프레임만 갖고, base(=최종 상태)를 덮지 않는다', () => {
      const start = BADGE_CSS.indexOf('const valueEnter = keyframes({');
      expect(start).toBeGreaterThan(-1);
      const end = BADGE_CSS.indexOf('\n});', start);
      const block = BADGE_CSS.slice(start, end);
      expect(block).toContain("'0%'");
      expect(block).not.toContain("'100%'");
      expect(block).toContain('translateY(calc(100% * var(--badge-dir, 1)))');
      expect(block).toContain('opacity: 0');
    });

    it('valueExit 키프레임이 0% 시작 프레임만 갖는다 (base가 이미 퇴장 완료 상태)', () => {
      const start = BADGE_CSS.indexOf('const valueExit = keyframes({');
      expect(start).toBeGreaterThan(-1);
      const end = BADGE_CSS.indexOf('\n});', start);
      const block = BADGE_CSS.slice(start, end);
      expect(block).toContain("'0%'");
      expect(block).not.toContain("'100%'");
      expect(block).toContain('translateY(0)');
      expect(block).toContain('opacity: 1');
    });

    it('valueCurrent가 duration.base·easing.settle 토큰으로 valueEnter를 재생한다', () => {
      expect(BADGE_CSS).toContain(
        'animation: `${valueEnter} ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`'
      );
    });

    it('valueExiting이 duration.base*0.65(calc)·easing.exit 토큰으로 퇴장하고, 기본값이 이미 사라진 상태다', () => {
      const start = BADGE_CSS.indexOf('export const valueExiting = style({');
      expect(start).toBeGreaterThan(-1);
      const end = BADGE_CSS.indexOf('\n});', start);
      const block = BADGE_CSS.slice(start, end);
      // 리터럴이 아니라 calc() 관례를 쓴다 — :root 축소 모드 오버라이드를
      // 따라가려면 반드시 토큰 참조여야 한다.
      expect(block).toContain(
        'calc(${themeContract.animation.duration.base} * 0.65)'
      );
      expect(block).toContain('${themeContract.animation.easing.exit}');
      expect(block).toContain(
        "transform: 'translateY(calc(-100% * var(--badge-dir, 1)))'"
      );
      expect(block).toContain('opacity: 0');
    });

    it('퇴장 노드가 스냅백하지 않는 이유가 주석으로 남아 있다', () => {
      expect(BADGE_CSS).toMatch(/스냅백/);
    });

    it('조항 1 위반이 아니라는 판정이 주석으로 남아 있다', () => {
      expect(BADGE_CSS).toMatch(/조항 1|교체|전이가 아니/);
    });
  });

  describe('값 교체 방향: 늘면 위로, 줄면 아래로 (M5 task-25)', () => {
    const isDown = () => getRoot().className.includes(directionDown);

    it('처음에는 위로 간다 (방향 표시 없음)', () => {
      render(<Badge>5</Badge>);
      expect(isDown()).toBe(false);
    });

    it('숫자가 늘면 위로 간다', () => {
      const { rerender } = render(<Badge>5</Badge>);
      rerender(<Badge>6</Badge>);
      expect(isDown()).toBe(false);
    });

    it('숫자가 줄면 아래로 간다', () => {
      const { rerender } = render(<Badge>5</Badge>);
      rerender(<Badge>4</Badge>);
      expect(isDown()).toBe(true);
    });

    it('줄었다가 다시 늘면 위로 돌아온다', () => {
      const { rerender } = render(<Badge>5</Badge>);
      rerender(<Badge>4</Badge>);
      expect(isDown()).toBe(true);
      rerender(<Badge>8</Badge>);
      expect(isDown()).toBe(false);
    });

    it('숫자 문자열 "5" → "4"도 줄어든 것으로 본다', () => {
      const { rerender } = render(<Badge>{'5'}</Badge>);
      rerender(<Badge>{'4'}</Badge>);
      expect(isDown()).toBe(true);
    });

    it('음수로 줄어도 아래로 간다 (0 → -1)', () => {
      const { rerender } = render(<Badge>0</Badge>);
      rerender(<Badge>-1</Badge>);
      expect(isDown()).toBe(true);
    });

    it('숫자 → 글자, 글자 → 숫자, 글자 → 글자는 위로 간다', () => {
      const { rerender } = render(<Badge>5</Badge>);
      rerender(<Badge>4</Badge>);
      expect(isDown()).toBe(true);
      rerender(<Badge>NEW</Badge>);
      expect(isDown()).toBe(false);
      rerender(<Badge>3</Badge>);
      expect(isDown()).toBe(false);
      rerender(<Badge>2</Badge>);
      expect(isDown()).toBe(true);
      rerender(<Badge>HOT</Badge>);
      expect(isDown()).toBe(false);
      rerender(<Badge>NEW</Badge>);
      expect(isDown()).toBe(false);
    });

    it('max+로 잘린 둘은 표시가 같아 교체도 방향 바뀜도 없다 (100 → 150)', () => {
      const { rerender } = render(<Badge>100</Badge>);
      const value = getRoot().querySelector('span');
      rerender(<Badge>150</Badge>);
      expect(isDown()).toBe(false);
      expect(getRoot().querySelector('[aria-hidden="true"]')).toBeNull();
      expect(getRoot().querySelector('span')).toBe(value);
    });

    it('max+에서 내려오면 숫자 값으로 줄었다고 본다 (150 → 50)', () => {
      const { rerender } = render(<Badge>150</Badge>);
      rerender(<Badge>50</Badge>);
      expect(isDown()).toBe(true);
    });

    it('max+로 올라가는 것은 늘었다고 본다 (50 → 150)', () => {
      const { rerender } = render(<Badge>50</Badge>);
      rerender(<Badge>150</Badge>);
      expect(isDown()).toBe(false);
    });

    it('dot을 거쳐 값이 돌아와도 보이지 않던 직전 값이 퇴장 노드로 뜨지 않는다 (5 → dot → 3)', () => {
      const { rerender } = render(<Badge>5</Badge>);
      rerender(<Badge dot />);
      rerender(<Badge>3</Badge>);
      expect(getRoot().querySelector('[aria-hidden="true"]')).toBeNull();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.queryByText('5')).toBeNull();
      // 비교할 직전 값이 없으니 위로 간다.
      expect(isDown()).toBe(false);
    });

    it('줄어드는 교체에서도 헌 값 퇴장 노드와 새 값 노드가 함께 뜬다', () => {
      const { rerender } = render(<Badge>5</Badge>);
      rerender(<Badge>4</Badge>);
      expect(getRoot().querySelector('[aria-hidden="true"]')).toHaveTextContent(
        '5'
      );
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('방향은 --badge-dir 하나로 정해지고 directionDown이 -1로 뒤집는다', () => {
      expect(BADGE_CSS).toContain('export const directionDown = style({');
      expect(BADGE_CSS).toContain("vars: { '--badge-dir': '-1' }");
    });
  });
});
