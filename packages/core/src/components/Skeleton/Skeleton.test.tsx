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

  describe('접근성 테스트: 스켈레톤은 장식이다(로딩 알림은 감싸는 영역이 맡는다)', () => {
    it('기본은 aria-hidden="true"이고 role, aria-live, aria-busy, aria-label이 없다', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      expect(skeleton).not.toHaveAttribute('role');
      expect(skeleton).not.toHaveAttribute('aria-live');
      expect(skeleton).not.toHaveAttribute('aria-busy');
      expect(skeleton).not.toHaveAttribute('aria-label');
    });

    it('라이브 리전이 아니라서 접근성 트리에 status가 없다', () => {
      render(<Skeleton />);
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('커스텀 aria-label을 설정할 수 있다', () => {
      const { container } = render(
        <Skeleton aria-label="프로필 이미지 로딩 중" />
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-label', '프로필 이미지 로딩 중');
    });

    it('소비자가 aria-label을 주면 aria-hidden을 달지 않는다', () => {
      const { container } = render(<Skeleton aria-label="프로필 로딩 중" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).not.toHaveAttribute('aria-hidden');
    });

    it('소비자가 role을 주면 aria-hidden을 달지 않고 role을 그대로 붙인다', () => {
      render(<Skeleton role="status" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).not.toHaveAttribute('aria-hidden');
    });

    it('소비자의 aria-hidden이 우선한다({...props}가 접근성 속성 뒤에 온다)', () => {
      const { container } = render(
        <Skeleton aria-label="로딩" aria-hidden="true" />
      );
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });

    it('감싸는 영역의 aria-busy와 이름이 로딩을 알린다(문서 예제 패턴)', () => {
      render(
        <section aria-busy="true" aria-label="프로필 로딩 중">
          <Skeleton />
          <Skeleton variant="circle" width={40} />
        </section>
      );
      const region = screen.getByRole('region', { name: '프로필 로딩 중' });
      expect(region).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('소비자 속성 병합 테스트', () => {
    it('소비자의 style이 계산된 크기를 덮는다({...props}가 style 뒤에 온다)', () => {
      const { container } = render(
        <Skeleton width={200} style={{ width: '10px' }} data-testid="sk" />
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('10px');
      expect(skeleton).toHaveAttribute('data-testid', 'sk');
    });

    it('width, height가 없으면 인라인 크기를 달지 않는다', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('');
      expect(skeleton.style.height).toBe('');
    });

    it('circle에 height를 따로 주면 width를 따라가지 않는다', () => {
      const { container } = render(
        <Skeleton variant="circle" width={40} height={20} />
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('20px');
    });

    it('circle이 아니면 width만 줘도 height를 달지 않는다', () => {
      const { container } = render(<Skeleton variant="rect" width={40} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('');
    });

    it('circle에 문자열 width만 줘도 height가 같다', () => {
      const { container } = render(<Skeleton variant="circle" width="3rem" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('3rem');
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
      // 스켈레톤 여럿이 라이브 리전을 여럿 만들지 않는다: 전부 장식이다.
      expect(container.querySelectorAll('[role]')).toHaveLength(0);
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
        3
      );
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

    it('pulse도 wave와 같은 공유 자산(loopRhythmEasing)을 거친다(리뷰 F3)', () => {
      // 같은 파일 안에서 wave는 공유 자산, pulse는 토큰 직참조면 같은 값을 두
      // 이름으로 부르는 것이다 — S1의 "계열이 커브를 공유한다"가 코드에서
      // 안 보이고, 커브를 바꾸는 날 한쪽만 바뀐다.
      // 무엇을 뒤집으면 빨개지는가: pulse를 themeContract…easing.drift로 되돌리면.
      const start = SKELETON_CSS.indexOf('pulse: {');
      const end = SKELETON_CSS.indexOf('\n  },', start);
      const pulseBlock = SKELETON_CSS.slice(start, end);
      expect(pulseBlock).toContain(
        'animation: `${pulse} ${themeContract.animation.loop.base} ${loopRhythmEasing} 0.5s infinite`'
      );
      expect(pulseBlock).not.toContain('themeContract.animation.easing');
    });

    it('shimmer 그라디언트가 하드코딩 rgba 대신 overlay.shimmer 토큰을 쓴다', () => {
      expect(SKELETON_CSS).not.toContain('rgba(255, 255, 255, 0.3)');
      expect(SKELETON_CSS).toContain('themeContract.color.overlay.shimmer');
    });
  });
});
