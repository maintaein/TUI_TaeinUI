import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

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

  describe('variant prop 테스트', () => {
    it('primary variant를 렌더링한다', () => {
      render(<Badge variant="primary">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('primary');
    });

    it('secondary variant를 렌더링한다', () => {
      render(<Badge variant="secondary">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge.className).toContain('secondary');
    });

    it('success variant를 렌더링한다', () => {
      render(<Badge variant="success">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge.className).toContain('success');
    });

    it('error variant를 렌더링한다', () => {
      render(<Badge variant="error">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge.className).toContain('error');
    });

    it('info variant를 렌더링한다', () => {
      render(<Badge variant="info">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge.className).toContain('info');
    });

    it('warning variant를 렌더링한다', () => {
      render(<Badge variant="warning">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge.className).toContain('warning');
    });

    it('기본 variant는 primary이다', () => {
      render(<Badge>5</Badge>);
      const badge = screen.getByText('5');
      expect(badge.className).toContain('primary');
    });
  });

  describe('size prop 테스트', () => {
    it('sm 크기를 렌더링한다', () => {
      render(<Badge size="sm">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge.className).toContain('sm');
    });

    it('md 크기를 렌더링한다', () => {
      render(<Badge size="md">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge.className).toContain('md');
    });

    it('lg 크기를 렌더링한다', () => {
      render(<Badge size="lg">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge.className).toContain('lg');
    });

    it('기본 크기는 md이다', () => {
      render(<Badge>5</Badge>);
      const badge = screen.getByText('5');
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
      const badge = screen.getByText('5');
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
    it('값이 바뀌면 노드가 재마운트된다 (key로 교체 애니메이션을 재생한다)', () => {
      const { container, rerender } = render(<Badge>5</Badge>);
      const before = container.querySelector('[role="status"]');
      rerender(<Badge>6</Badge>);
      const after = container.querySelector('[role="status"]');
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(after).not.toBe(before);
    });

    it('같은 값으로 리렌더링되면 노드를 유지한다', () => {
      const { container, rerender } = render(<Badge>5</Badge>);
      const before = container.querySelector('[role="status"]');
      rerender(<Badge variant="error">5</Badge>);
      const after = container.querySelector('[role="status"]');
      expect(after).toBe(before);
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

    it('badge가 duration.base·easing.settle 토큰으로 valueEnter를 재생한다', () => {
      expect(BADGE_CSS).toContain(
        'animation: `${valueEnter} ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`'
      );
    });

    it('조항 1 위반이 아니라는 판정이 주석으로 남아 있다', () => {
      expect(BADGE_CSS).toMatch(/조항 1|교체|전이가 아니/);
    });
  });
});
