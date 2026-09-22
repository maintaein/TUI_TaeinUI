import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from './Badge';
import { valueExiting } from './Badge.css';

const BADGE_CSS = readFileSync(resolve(__dirname, './Badge.css.ts'), 'utf-8');

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

  // variant·size 클래스는 role="status" 루트가 갖는다. 값(텍스트)은 이제
  // 그 안의 별도 값 노드에 있으므로(M2 T3c, Badge 값 교체 두 스팬 구조),
  // 여기서는 getByText 대신 getByRole('status')로 루트를 찾는다 — 각
  // 테스트가 확인하려는 것(루트에 해당 클래스가 붙는지)은 그대로다.
  describe('variant prop 테스트', () => {
    it('primary variant를 렌더링한다', () => {
      render(<Badge variant="primary">5</Badge>);
      const badge = screen.getByRole('status');
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(badge.className).toContain('primary');
    });

    it('secondary variant를 렌더링한다', () => {
      render(<Badge variant="secondary">5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('secondary');
    });

    it('success variant를 렌더링한다', () => {
      render(<Badge variant="success">5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('success');
    });

    it('error variant를 렌더링한다', () => {
      render(<Badge variant="error">5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('error');
    });

    it('info variant를 렌더링한다', () => {
      render(<Badge variant="info">5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('info');
    });

    it('warning variant를 렌더링한다', () => {
      render(<Badge variant="warning">5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('warning');
    });

    it('기본 variant는 primary이다', () => {
      render(<Badge>5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('primary');
    });
  });

  describe('size prop 테스트', () => {
    it('sm 크기를 렌더링한다', () => {
      render(<Badge size="sm">5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('sm');
    });

    it('md 크기를 렌더링한다', () => {
      render(<Badge size="md">5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('md');
    });

    it('lg 크기를 렌더링한다', () => {
      render(<Badge size="lg">5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('lg');
    });

    it('기본 크기는 md이다', () => {
      render(<Badge>5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('md');
    });
  });

  describe('dot prop 테스트', () => {
    it('dot 모드에서는 숫자 대신 점만 표시한다', () => {
      render(<Badge dot>5</Badge>);
      expect(screen.queryByText('5')).not.toBeInTheDocument();
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('dot');
    });

    it('dot 모드에서도 variant가 적용된다', () => {
      render(<Badge dot variant="error" />);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('dot');
      expect(badge.className).toContain('error');
    });
  });

  describe('접근성 테스트', () => {
    it('role="status"를 가진다', () => {
      render(<Badge>5</Badge>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('aria-label이 설정된다', () => {
      render(<Badge aria-label="5개의 새 알림">5</Badge>);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        '5개의 새 알림'
      );
    });

    it('숫자 뱃지는 기본 aria-label을 가진다', () => {
      render(<Badge>5</Badge>);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label');
    });

    it('dot 모드는 aria-label을 가진다', () => {
      render(<Badge dot aria-label="새 알림" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', '새 알림');
    });
  });

  describe('showZero prop 테스트', () => {
    it('showZero가 false면 0을 렌더링하지 않는다', () => {
      const { container } = render(<Badge showZero={false}>0</Badge>);
      expect(container.firstChild).toBeNull();
    });

    it('showZero가 true면 0을 렌더링한다', () => {
      render(<Badge showZero>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('기본적으로 0을 렌더링한다', () => {
      render(<Badge>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className을 적용한다', () => {
      render(<Badge className="custom-class">5</Badge>);
      // custom className은 role="status" 루트에 붙는다(값 노드가 아니라).
      const badge = screen.getByRole('status');
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
    it('값이 바뀌어도 role="status" 루트는 재마운트되지 않는다 (라이브 리전 안정성)', () => {
      const { container, rerender } = render(<Badge>5</Badge>);
      const before = container.querySelector('[role="status"]');
      rerender(<Badge>6</Badge>);
      const after = container.querySelector('[role="status"]');
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(after).toBe(before);
    });

    it('값이 바뀌면 현재 값 노드는 재마운트된다 (key로 valueEnter를 재생한다)', () => {
      const { container, rerender } = render(<Badge>5</Badge>);
      const root = container.querySelector('[role="status"]') as HTMLElement;
      const before = root.querySelector('span:not([aria-hidden])');
      rerender(<Badge>6</Badge>);
      const after = root.querySelector('span:not([aria-hidden])');
      expect(after).not.toBe(before);
      expect(after).toHaveTextContent('6');
    });

    it('같은 값으로 리렌더링되면 루트도 값 노드도 유지한다', () => {
      const { container, rerender } = render(<Badge>5</Badge>);
      const root = container.querySelector('[role="status"]');
      const value = container.querySelector('span:not([aria-hidden])');
      rerender(<Badge variant="error">5</Badge>);
      expect(container.querySelector('[role="status"]')).toBe(root);
      expect(container.querySelector('span:not([aria-hidden])')).toBe(value);
    });

    it('값이 바뀌면 헌 값이 aria-hidden 퇴장 노드로 남아 valueExiting을 재생한다', () => {
      const { container, rerender } = render(<Badge>5</Badge>);
      rerender(<Badge>6</Badge>);
      const root = container.querySelector('[role="status"]') as HTMLElement;
      const exiting = root.querySelector('[aria-hidden="true"]');
      expect(exiting).toHaveTextContent('5');
      expect(exiting?.className).toContain(valueExiting);
      // 현재 값(6)도 동시에 존재한다 — 두 스팬이 같이 떠 있는 교체 구간이다.
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('퇴장 애니메이션이 끝나면 헌 값 노드가 제거된다 (스냅백 없이)', () => {
      const { container, rerender } = render(<Badge>5</Badge>);
      rerender(<Badge>6</Badge>);
      const root = container.querySelector('[role="status"]') as HTMLElement;
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
      const root = screen.getByRole('status');
      expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('처음 마운트될 때는 퇴장 노드가 없다 (비교할 헌 값이 없다)', () => {
      const { container } = render(<Badge>5</Badge>);
      const root = container.querySelector('[role="status"]') as HTMLElement;
      expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('값이 잠깐 비었다 돌아오면 옛 값 유령이 안 뜬다 (3 → undefined → 7, 리뷰 I2)', () => {
      const { container, rerender } = render(<Badge>3</Badge>);

      // 1) 3 → undefined: setExitingValue(3)이 불리지만 그 직후 조기 반환이
      //    배지를 통째로 언마운트한다. 퇴장 노드가 렌더되지 않으니
      //    onAnimationEnd가 영영 안 불리고 exitingValue는 3으로 박제된다.
      rerender(<Badge>{undefined}</Badge>);
      expect(container.querySelector('[role="status"]')).toBeNull();

      // 2) undefined → 7: 퇴장시킬 헌 값이 없는 경로다(prevValue가 null).
      //    여기서 박제를 지우지 않으면 3이 그대로 살아남는다.
      rerender(<Badge>7</Badge>);

      // 3) 배지가 다시 나타날 때 현재 값 7 옆에서 옛 값 3이 퇴장을 재생하면
      //    안 된다. aria-hidden이라 AT에는 안 새지만 화면에는 틀린 숫자다 —
      //    개수를 보여주는 것이 존재 이유인 컴포넌트다.
      // 무엇을 뒤집으면 빨개지는가: Badge.tsx의 else { setExitingValue(null) }를 지우면.
      const root = container.querySelector('[role="status"]') as HTMLElement;
      expect(root.querySelector('[aria-hidden="true"]')).toBeNull();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.queryByText('3')).toBeNull();
    });

    it('dot 모드는 값 노드·퇴장 노드를 만들지 않는다', () => {
      const { container, rerender } = render(<Badge dot>5</Badge>);
      rerender(
        <Badge dot variant="error">
          6
        </Badge>
      );
      const root = container.querySelector('[role="status"]') as HTMLElement;
      expect(root.querySelectorAll('span').length).toBe(0);
    });

    it('valueEnter 키프레임이 0% 시작 프레임만 갖고, base(=최종 상태)를 덮지 않는다', () => {
      const start = BADGE_CSS.indexOf('const valueEnter = keyframes({');
      expect(start).toBeGreaterThan(-1);
      const end = BADGE_CSS.indexOf('\n});', start);
      const block = BADGE_CSS.slice(start, end);
      expect(block).toContain("'0%'");
      expect(block).not.toContain("'100%'");
      expect(block).toContain('translateY(100%)');
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
      expect(block).toContain("transform: 'translateY(-100%)'");
      expect(block).toContain('opacity: 0');
    });

    it('퇴장 노드가 스냅백하지 않는 이유가 주석으로 남아 있다', () => {
      expect(BADGE_CSS).toMatch(/스냅백/);
    });

    it('조항 1 위반이 아니라는 판정이 주석으로 남아 있다', () => {
      expect(BADGE_CSS).toMatch(/조항 1|교체|전이가 아니/);
    });
  });
});
