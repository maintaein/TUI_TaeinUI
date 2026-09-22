import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

const SPINNER_CSS = readFileSync(
  resolve(__dirname, './LoadingSpinner.css.ts'),
  'utf-8'
);

/** `export const <name> = style({...});` 블록 하나를 소스에서 잘라낸다. */
function block(source: string, name: string): string {
  const start = source.indexOf(`export const ${name} = style({`);
  expect(start, `'${name}' 선언을 찾지 못했다`).toBeGreaterThan(-1);
  const end = source.indexOf('\n});', start);
  return source.slice(start, end);
}

/** `anchor` 바로 위의 연속된 주석 줄만 모은다 — 파일 전체 검색은 무관한 한
 * 줄로도 초록이 되기 때문이다(animationBoundary.test.ts와 같은 관례). */
function commentBlockAbove(source: string, anchor: string): string {
  const at = source.indexOf(anchor);
  expect(at, `'${anchor}'를 찾지 못했다`).toBeGreaterThan(-1);
  const lines = source.slice(0, at).split('\n');
  const comments: string[] = [];
  for (let i = lines.length - 2; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (!trimmed.startsWith('//')) break;
    comments.unshift(trimmed);
  }
  expect(
    comments.length,
    `'${anchor}' 위에 근거 주석 블록이 없다`
  ).toBeGreaterThan(0);
  return comments.join('\n');
}

describe('LoadingSpinner', () => {
  describe('타입 변형', () => {
    it('기본 타입은 spinner여야 한다', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('spinner 타입을 렌더링해야 한다', () => {
      render(<LoadingSpinner type="spinner" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-type', 'spinner');
    });

    it('dots 타입을 렌더링해야 한다', () => {
      render(<LoadingSpinner type="dots" />);
      const dots = screen.getByRole('status');
      expect(dots).toHaveAttribute('data-type', 'dots');
    });
  });

  describe('크기 변형', () => {
    it('기본 크기는 md여야 한다', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-size', 'md');
    });

    it('sm 크기를 적용해야 한다', () => {
      render(<LoadingSpinner size="sm" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-size', 'sm');
    });

    it('md 크기를 적용해야 한다', () => {
      render(<LoadingSpinner size="md" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-size', 'md');
    });

    it('lg 크기를 적용해야 한다', () => {
      render(<LoadingSpinner size="lg" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-size', 'lg');
    });

    it('xl 크기를 적용해야 한다', () => {
      render(<LoadingSpinner size="xl" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('data-size', 'xl');
    });
  });

  describe('색상 커스터마이징', () => {
    it('기본 색상으로 primary를 사용해야 한다', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner.style.getPropertyValue('--spinner-color')).toBeTruthy();
    });

    it('사용자 정의 색상을 적용해야 한다', () => {
      const { container } = render(<LoadingSpinner color="#FF0000" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveStyle({ '--spinner-color': '#FF0000' });
    });
  });

  describe('접근성', () => {
    it('role="status" 속성을 가져야 한다', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('aria-live="polite" 속성을 가져야 한다', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });

    it('기본 aria-label은 "로딩 중"이어야 한다', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByLabelText('로딩 중');
      expect(spinner).toBeInTheDocument();
    });

    it('사용자 정의 aria-label을 적용해야 한다', () => {
      render(<LoadingSpinner aria-label="데이터 불러오는 중" />);
      const spinner = screen.getByLabelText('데이터 불러오는 중');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('애니메이션', () => {
    it('spinner 타입은 회전 애니메이션을 가져야 한다', () => {
      const { container } = render(<LoadingSpinner type="spinner" />);
      const spinnerElement = container.querySelector('[data-spinner]');
      expect(spinnerElement).toBeInTheDocument();
    });

    it('dots 타입은 3개의 점을 렌더링해야 한다', () => {
      const { container } = render(<LoadingSpinner type="dots" />);
      const dots = container.querySelectorAll('[data-dot]');
      expect(dots).toHaveLength(3);
    });

    it('dots 타입의 각 점은 다른 애니메이션 딜레이를 가져야 한다', () => {
      const { container } = render(<LoadingSpinner type="dots" />);
      const dots = container.querySelectorAll('[data-dot]');

      expect(dots[0]).toHaveAttribute('data-delay', 'first');
      expect(dots[1]).toHaveAttribute('data-delay', 'second');
      expect(dots[2]).toHaveAttribute('data-delay', 'third');
    });
  });

  describe('className', () => {
    it('사용자 정의 className을 적용해야 한다', () => {
      const { container } = render(<LoadingSpinner className="custom-class" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveClass('custom-class');
    });
  });

  describe('LoadingSpinner 모션 잠금 (M2 T3c)', () => {
    it('spin 키프레임이 50% 200deg의 비등속 중간 프레임을 가진다', () => {
      const start = SPINNER_CSS.indexOf('const spin = keyframes({');
      expect(start).toBeGreaterThan(-1);
      const end = SPINNER_CSS.indexOf('\n});', start);
      const spinBlock = SPINNER_CSS.slice(start, end);
      expect(spinBlock).toContain("'0%': { transform: 'rotate(0deg)' }");
      expect(spinBlock).toContain("'50%': { transform: 'rotate(200deg)' }");
      expect(spinBlock).toContain("'100%': { transform: 'rotate(360deg)' }");
    });

    it('spinner 회전이 리터럴 linear 대신 easing.linear 토큰을 쓴다', () => {
      const spinnerBlock = block(SPINNER_CSS, 'spinner');
      expect(spinnerBlock).toContain(
        'animation: `${spin} ${themeContract.animation.loop.fast} ${themeContract.animation.easing.linear} infinite`'
      );
    });

    it('dot 페이드가 T5 공유 자산(loopRhythmEasing)을 거치고 backwards를 유지한다(리뷰 F3)', () => {
      // 점 페이드는 주기·커브가 Skeleton wave와 같다 — 회전이라서 제외된다는
      // 사유가 이 선언에는 적용되지 않는다. 계열이 커브를 공유한다는 S1이
      // 코드에서 보여야 한다.
      // 무엇을 뒤집으면 빨개지는가: dot을 themeContract…easing.drift로 되돌리면.
      expect(SPINNER_CSS).toMatch(
        /import \{ loopRhythmEasing \} from '\.\.\/\.\.\/tokens\/loopRhythm\.css'/
      );
      const dotBlock = block(SPINNER_CSS, 'dot');
      expect(dotBlock).toContain(
        'animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ${loopRhythmEasing} backwards`'
      );
    });

    it('회전만 공유 자산 밖이고 그 이유가 회전 정의 바로 위에 적혀 있다', () => {
      // 제외 대상은 컴포넌트가 아니라 회전 하나다(리뷰 F3 — 옛 사유는
      // LoadingSpinner 전체를 제외한다고 적어 점 페이드까지 덮고 있었다).
      const spinnerBlock = block(SPINNER_CSS, 'spinner');
      expect(spinnerBlock).not.toContain('loopRhythmEasing');
      expect(spinnerBlock).toContain('themeContract.animation.easing.linear');
      // 근거가 "파일 어딘가"에 있으면 무관한 한 줄로도 초록이 된다(리뷰 F4).
      // 회전 정의 바로 위 주석 블록 안에 있어야 한다.
      expect(
        commentBlockAbove(SPINNER_CSS, 'const spin = keyframes({')
      ).toMatch(/loopRhythm|T5|공유 자산/);
    });
  });
});
