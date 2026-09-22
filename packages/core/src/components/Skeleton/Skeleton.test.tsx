import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './Skeleton';

const SKELETON_CSS = readFileSync(
  resolve(__dirname, './Skeleton.css.ts'),
  'utf-8'
);

describe('Skeleton', () => {
  describe('렌더링 테스트', () => {
    it('기본적으로 렌더링된다', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('text 타입을 렌더링한다', () => {
      const { container } = render(<Skeleton variant="text" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('text');
    });

    it('rect 타입을 렌더링한다', () => {
      const { container } = render(<Skeleton variant="rect" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('rect');
    });

    it('circle 타입을 렌더링한다', () => {
      const { container } = render(<Skeleton variant="circle" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('circle');
    });

    it('rounded 타입을 렌더링한다', () => {
      const { container } = render(<Skeleton variant="rounded" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('rounded');
    });
  });

  describe('애니메이션 prop 테스트', () => {
    it('wave 애니메이션을 적용한다', () => {
      const { container } = render(<Skeleton animation="wave" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('wave');
    });

    it('pulse 애니메이션을 적용한다', () => {
      const { container } = render(<Skeleton animation="pulse" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('pulse');
    });

    it('애니메이션을 비활성화할 수 있다', () => {
      const { container } = render(<Skeleton animation={false} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).not.toContain('wave');
      expect(skeleton.className).not.toContain('pulse');
    });
  });

  describe('width/height prop 테스트', () => {
    it('width를 설정할 수 있다', () => {
      const { container } = render(<Skeleton width={200} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('200px');
    });

    it('width를 문자열로 설정할 수 있다', () => {
      const { container } = render(<Skeleton width="50%" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('50%');
    });

    it('height를 설정할 수 있다', () => {
      const { container } = render(<Skeleton height={100} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('100px');
    });

    it('height를 문자열로 설정할 수 있다', () => {
      const { container } = render(<Skeleton height="3rem" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('3rem');
    });
  });

  describe('variant별 기본 스타일 테스트', () => {
    it('text variant는 기본 너비와 높이를 가진다', () => {
      const { container } = render(<Skeleton variant="text" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('text');
    });

    it('circle variant는 정사각형이다', () => {
      const { container } = render(<Skeleton variant="circle" width={40} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('40px');
      expect(skeleton.style.height).toBe('40px');
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className을 적용한다', () => {
      const { container } = render(<Skeleton className="custom-skeleton" />);
      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('custom-skeleton');
    });
  });

  describe('접근성 테스트', () => {
    it('aria-busy="true"를 가진다', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('aria-live="polite"를 가진다', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    });

    it('role="status"를 가진다', () => {
      render(<Skeleton />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('커스텀 aria-label을 설정할 수 있다', () => {
      const { container } = render(
        <Skeleton aria-label="프로필 이미지 로딩 중" />
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-label', '프로필 이미지 로딩 중');
    });

    it('기본 aria-label을 가진다', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-label', '콘텐츠 로딩 중');
    });
  });

  describe('타입별 조합 테스트', () => {
    it('text + wave를 렌더링한다', () => {
      const { container } = render(
        <Skeleton variant="text" animation="wave" />
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('text');
      expect(skeleton.className).toContain('wave');
    });

    it('circle + pulse를 렌더링한다', () => {
      const { container } = render(
        <Skeleton variant="circle" animation="pulse" />
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('circle');
      expect(skeleton.className).toContain('pulse');
    });

    it('rect + 커스텀 크기를 렌더링한다', () => {
      const { container } = render(
        <Skeleton variant="rect" width={300} height={200} />
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.className).toContain('rect');
      expect(skeleton.style.width).toBe('300px');
      expect(skeleton.style.height).toBe('200px');
    });
  });

  describe('다중 Skeleton 렌더링 테스트', () => {
    it('여러 Skeleton을 연속으로 렌더링할 수 있다', () => {
      const { container } = render(
        <div>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="circle" width={40} />
        </div>
      );
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Skeleton 모션 잠금 (M2 T3c)', () => {
    it('wave가 T5 공유 자산(loopRhythmEasing)의 커브로, loop.base 주기로 좌→우 훑는다', () => {
      expect(SKELETON_CSS).toMatch(
        /import \{ loopRhythmEasing \} from '\.\.\/\.\.\/tokens\/loopRhythm\.css'/
      );
      const start = SKELETON_CSS.indexOf("'&::after': {");
      const end = SKELETON_CSS.indexOf('\n        },', start);
      const afterBlock = SKELETON_CSS.slice(start, end);
      expect(afterBlock).toContain(
        'animation: `${wave} ${themeContract.animation.loop.base} ${loopRhythmEasing} 0.5s infinite`'
      );
      expect(afterBlock).not.toContain(' linear ');
    });

    it('pulse가 리터럴 ease-in-out 대신 easing.drift 토큰을 쓴다', () => {
      const start = SKELETON_CSS.indexOf('pulse: {');
      const end = SKELETON_CSS.indexOf('\n  },', start);
      const pulseBlock = SKELETON_CSS.slice(start, end);
      expect(pulseBlock).toContain(
        'animation: `${pulse} ${themeContract.animation.loop.base} ${themeContract.animation.easing.drift} 0.5s infinite`'
      );
    });

    it('shimmer 그라디언트가 하드코딩 rgba 대신 overlay.shimmer 토큰을 쓴다', () => {
      expect(SKELETON_CSS).not.toContain('rgba(255, 255, 255, 0.3)');
      expect(SKELETON_CSS).toContain('themeContract.color.overlay.shimmer');
    });
  });
});
