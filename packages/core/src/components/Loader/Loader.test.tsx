import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader } from './Loader';
import { gray } from '../../tokens/colors.css';

const LOADER_CSS = readFileSync(resolve(__dirname, './Loader.css.ts'), 'utf-8');

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

/** `const <name> = keyframes({...});` 블록 하나를 소스에서 잘라낸다. */
function keyframesBlock(source: string, name: string): string {
  const start = source.indexOf(`const ${name} = keyframes({`);
  expect(start, `'${name}' 키프레임을 찾지 못했다`).toBeGreaterThan(-1);
  const end = source.indexOf('\n});', start);
  return source.slice(start, end);
}

/** 흰 바탕과 #rrggbb 한 색의 WCAG 대비. */
function contrastOnWhite(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  return 1.05 / (lum + 0.05);
}

describe('Loader', () => {
  describe('렌더링 테스트', () => {
    it('기본적으로 렌더링된다', () => {
      render(<Loader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('spinner 타입을 렌더링한다', () => {
      render(<Loader type="spinner" />);
      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-type', 'spinner');
    });

    it('dots 타입을 렌더링한다', () => {
      render(<Loader type="dots" />);
      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-type', 'dots');
    });

    it('bar 타입을 렌더링한다', () => {
      render(<Loader type="bar" />);
      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-type', 'bar');
    });

    it('기본 타입은 orbit이다', () => {
      render(<Loader />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-type', 'orbit');
    });

    it('orbit 타입을 렌더링한다', () => {
      render(<Loader type="orbit" />);
      expect(screen.getByRole('status')).toHaveAttribute('data-type', 'orbit');
    });
  });

  describe('size prop 테스트', () => {
    it('sm 크기를 렌더링한다', () => {
      render(<Loader size="sm" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-size', 'sm');
    });

    it('md 크기를 렌더링한다', () => {
      render(<Loader size="md" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-size', 'md');
    });

    it('lg 크기를 렌더링한다', () => {
      render(<Loader size="lg" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-size', 'lg');
    });

    it('xl 크기를 렌더링한다', () => {
      render(<Loader size="xl" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-size', 'xl');
    });

    it('기본 크기는 md이다', () => {
      render(<Loader />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-size', 'md');
    });
  });

  describe('color prop 테스트', () => {
    it('primary 색상을 렌더링한다', () => {
      render(<Loader color="primary" />);
      const loader = screen.getByRole('status');
      // spinner/dots는 실제 색상 값을 사용하므로 style로 검증
      expect(loader.style.getPropertyValue('--spinner-color')).toBeTruthy();
    });

    it('secondary 색상을 렌더링한다', () => {
      render(<Loader color="secondary" />);
      const loader = screen.getByRole('status');
      expect(loader.style.getPropertyValue('--spinner-color')).toBeTruthy();
    });

    it('white 색상을 렌더링한다', () => {
      render(<Loader color="white" />);
      const loader = screen.getByRole('status');
      expect(loader.style.getPropertyValue('--spinner-color')).toBeTruthy();
    });

    it('기본 색상은 primary이다', () => {
      render(<Loader />);
      const loader = screen.getByRole('status');
      expect(loader.style.getPropertyValue('--spinner-color')).toBeTruthy();
    });
  });

  describe('임의 색상 통과 (색상 확장)', () => {
    it('bar는 preset이 아닌 색을 fill에 --loader-color 인라인으로 붙인다', () => {
      render(<Loader type="bar" color="#f00" />);
      const fill = screen
        .getByRole('status')
        .querySelector(':scope > div > div');
      expect(fill).toHaveStyle({ '--loader-color': '#f00' });
    });

    it('bar는 preset이면 인라인 style 없이 colorStyles 클래스를 붙인다', () => {
      render(<Loader type="bar" color="primary" />);
      const fill = screen
        .getByRole('status')
        .querySelector(':scope > div > div');
      expect(fill).not.toHaveAttribute('style');
      expect(fill?.className).toContain('colorStyles_primary');
    });

    it('currentColor가 --spinner-color로 그대로 통과한다 (Button이 쓰는 경로)', () => {
      render(<Loader color="currentColor" />);
      expect(
        screen.getByRole('status').style.getPropertyValue('--spinner-color')
      ).toBe('currentColor');
    });

    it('dots도 임의 색을 --spinner-color로 받는다', () => {
      render(<Loader type="dots" color="#0f0" />);
      expect(screen.getByRole('status')).toHaveStyle({
        '--spinner-color': '#0f0',
      });
    });
  });

  describe('HTMLAttributes 전달', () => {
    it('data-testid 같은 속성이 바깥 요소에 도달한다', () => {
      render(<Loader data-testid="loader-root" id="loader-id" />);
      expect(screen.getByTestId('loader-root')).toHaveAttribute(
        'id',
        'loader-id'
      );
    });

    it('role을 인자로 덮으려 해도 status는 하나만 남는다', () => {
      render(<Loader role="alert" label="로딩 중..." />);
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('role="status"를 가진다', () => {
      render(<Loader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('aria-live="polite"를 가진다', () => {
      render(<Loader />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });

    it('aria-label을 설정할 수 있다', () => {
      render(<Loader aria-label="데이터 로딩 중" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label', '데이터 로딩 중');
    });

    it('기본 aria-label을 가진다', () => {
      render(<Loader />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label');
    });

    it('aria-busy="true"를 가진다', () => {
      // bar 타입은 직접 aria-busy를 가짐
      render(<Loader type="bar" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('label prop 테스트', () => {
    it('label 텍스트를 렌더링한다', () => {
      render(<Loader label="로딩 중..." />);
      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });

    it('label 없이도 렌더링된다', () => {
      render(<Loader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('label이 있을 때 적절한 레이아웃을 가진다', () => {
      const { container } = render(<Loader label="로딩 중..." />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('loaderContainer');
    });
  });

  describe('fullScreen prop 테스트', () => {
    it('fullScreen 모드를 렌더링한다', () => {
      const { container } = render(<Loader fullScreen />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('fullScreen');
    });

    it('fullScreen이 아닐 때는 일반 레이아웃이다', () => {
      const { container } = render(<Loader />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain('fullScreen');
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className을 적용한다', () => {
      const { container } = render(<Loader className="custom-loader" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-loader');
    });
  });

  describe('타입별 렌더링 테스트', () => {
    it('spinner 타입은 회전 애니메이션을 가진다', () => {
      render(<Loader type="spinner" />);
      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
    });

    it('dots 타입은 여러 점을 렌더링한다', () => {
      const { container } = render(<Loader type="dots" />);
      const dots = container.querySelectorAll('[class*="dot"]');
      expect(dots.length).toBeGreaterThan(0);
    });

    it('bar 타입은 진행 바를 렌더링한다', () => {
      render(<Loader type="bar" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-type', 'bar');
      // bar 타입의 내부 구조 확인
      const barElement = loader.querySelector('div > div');
      expect(barElement).toBeInTheDocument();
    });
  });

  describe('overlay prop 테스트', () => {
    it('overlay 모드를 렌더링한다', () => {
      const { container } = render(<Loader overlay />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('overlay');
    });

    it('overlay가 아닐 때는 일반 렌더링이다', () => {
      const { container } = render(<Loader />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain('overlay');
    });
  });

  describe('Loader 모션 잠금 (M2 T3c)', () => {
    it('barFill이 T5 공유 자산(loopRhythmEasing)의 커브로, loop.base 주기로 스윕한다', () => {
      expect(LOADER_CSS).toMatch(
        /import \{ loopRhythmEasing \} from '\.\.\/\.\.\/tokens\/loopRhythm\.css'/
      );
      const barFillBlock = LOADER_CSS.match(
        /export const barFill = style\(\{([\s\S]*?)\n\}\);/
      )?.[1];
      expect(barFillBlock).toContain(
        'animation: `${progress} ${themeContract.animation.loop.base} ${loopRhythmEasing} infinite`'
      );
      // 리터럴 cubic-bezier가 남아 있으면 안 된다 — T5 공유 자산 경유로 대체됐다.
      expect(barFillBlock).not.toContain('cubic-bezier');
    });
  });

  // 흡수분: spinner·dots 타입, 4 size, 임의 색, aria-label 기본값 '로딩 중'
  describe('spinner·dots 흡수분', () => {
    describe('타입 변형', () => {
      it('기본 타입은 orbit이어야 한다', () => {
        render(<Loader />);
        const loader = screen.getByRole('status');
        expect(loader).toHaveAttribute('data-type', 'orbit');
      });

      it('spinner 타입을 렌더링해야 한다', () => {
        render(<Loader type="spinner" />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveAttribute('data-type', 'spinner');
      });

      it('dots 타입을 렌더링해야 한다', () => {
        render(<Loader type="dots" />);
        const dots = screen.getByRole('status');
        expect(dots).toHaveAttribute('data-type', 'dots');
      });
    });

    describe('크기 변형', () => {
      it('기본 크기는 md여야 한다', () => {
        render(<Loader />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveAttribute('data-size', 'md');
      });

      it('sm 크기를 적용해야 한다', () => {
        render(<Loader size="sm" />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveAttribute('data-size', 'sm');
      });

      it('md 크기를 적용해야 한다', () => {
        render(<Loader size="md" />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveAttribute('data-size', 'md');
      });

      it('lg 크기를 적용해야 한다', () => {
        render(<Loader size="lg" />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveAttribute('data-size', 'lg');
      });

      it('xl 크기를 적용해야 한다', () => {
        render(<Loader size="xl" />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveAttribute('data-size', 'xl');
      });
    });

    describe('색상 커스터마이징', () => {
      it('기본 색상으로 primary를 사용해야 한다', () => {
        render(<Loader />);
        const spinner = screen.getByRole('status');
        expect(spinner.style.getPropertyValue('--spinner-color')).toBeTruthy();
      });

      it('사용자 정의 색상을 적용해야 한다', () => {
        render(<Loader color="#FF0000" />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveStyle({ '--spinner-color': '#FF0000' });
      });
    });

    describe('접근성', () => {
      it('role="status" 속성을 가져야 한다', () => {
        render(<Loader />);
        const spinner = screen.getByRole('status');
        expect(spinner).toBeInTheDocument();
      });

      it('aria-live="polite" 속성을 가져야 한다', () => {
        render(<Loader />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveAttribute('aria-live', 'polite');
      });

      it('기본 aria-label은 "로딩 중"이어야 한다', () => {
        render(<Loader />);
        const spinner = screen.getByLabelText('로딩 중');
        expect(spinner).toBeInTheDocument();
      });

      it('사용자 정의 aria-label을 적용해야 한다', () => {
        render(<Loader aria-label="데이터 불러오는 중" />);
        const spinner = screen.getByLabelText('데이터 불러오는 중');
        expect(spinner).toBeInTheDocument();
      });
    });

    describe('애니메이션', () => {
      it('spinner 타입은 회전 애니메이션을 가져야 한다', () => {
        const { container } = render(<Loader type="spinner" />);
        const spinnerElement = container.querySelector('[data-spinner]');
        expect(spinnerElement).toBeInTheDocument();
      });

      it('dots 타입은 3개의 점을 렌더링해야 한다', () => {
        const { container } = render(<Loader type="dots" />);
        const dots = container.querySelectorAll('[data-dot]');
        expect(dots).toHaveLength(3);
      });

      it('dots 타입의 각 점은 다른 애니메이션 딜레이를 가져야 한다', () => {
        const { container } = render(<Loader type="dots" />);
        const dots = container.querySelectorAll('[data-dot]');

        expect(dots[0]).toHaveAttribute('data-delay', 'first');
        expect(dots[1]).toHaveAttribute('data-delay', 'second');
        expect(dots[2]).toHaveAttribute('data-delay', 'third');
      });
    });

    describe('className', () => {
      it('사용자 정의 className을 적용해야 한다', () => {
        const { container } = render(<Loader className="custom-class" />);
        const spinner = container.firstChild as HTMLElement;
        expect(spinner).toHaveClass('custom-class');
      });
    });

    describe('spinner·dots 모션 잠금 (M2 T3c)', () => {
      it('spin 키프레임이 50% 200deg의 비등속 중간 프레임을 가진다', () => {
        const start = LOADER_CSS.indexOf('const spin = keyframes({');
        expect(start).toBeGreaterThan(-1);
        const end = LOADER_CSS.indexOf('\n});', start);
        const spinBlock = LOADER_CSS.slice(start, end);
        expect(spinBlock).toContain("'0%': { transform: 'rotate(0deg)' }");
        expect(spinBlock).toContain("'50%': { transform: 'rotate(200deg)' }");
        expect(spinBlock).toContain("'100%': { transform: 'rotate(360deg)' }");
      });

      it('spinner 회전이 리터럴 linear 대신 easing.linear 토큰을 쓴다', () => {
        const spinnerBlock = block(LOADER_CSS, 'spinner');
        expect(spinnerBlock).toContain(
          'animation: `${spin} ${themeContract.animation.loop.fast} ${themeContract.animation.easing.linear} infinite`'
        );
      });

      it('dot 페이드가 T5 공유 자산(loopRhythmEasing)을 거치고 backwards를 유지한다(리뷰 F3)', () => {
        // 점 페이드는 주기·커브가 Skeleton wave와 같다 — 회전이라서 제외된다는
        // 사유가 이 선언에는 적용되지 않는다. 계열이 커브를 공유한다는 S1이
        // 코드에서 보여야 한다.
        // 무엇을 뒤집으면 빨개지는가: dot을 themeContract…easing.drift로 되돌리면.
        expect(LOADER_CSS).toMatch(
          /import \{ loopRhythmEasing \} from '\.\.\/\.\.\/tokens\/loopRhythm\.css'/
        );
        const dotBlock = block(LOADER_CSS, 'dot');
        expect(dotBlock).toContain(
          'animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ${loopRhythmEasing} backwards`'
        );
      });

      it('회전만 공유 자산 밖이고 그 이유가 회전 정의 바로 위에 적혀 있다', () => {
        // 제외 대상은 컴포넌트가 아니라 회전 하나다(리뷰 F3 — 옛 사유는
        // 점 페이드까지 통째로 제외한다고 적어 놓고 있었다).
        const spinnerBlock = block(LOADER_CSS, 'spinner');
        expect(spinnerBlock).not.toContain('loopRhythmEasing');
        expect(spinnerBlock).toContain('themeContract.animation.easing.linear');
        // 근거가 "파일 어딘가"에 있으면 무관한 한 줄로도 초록이 된다(리뷰 F4).
        // 회전 정의 바로 위 주석 블록 안에 있어야 한다.
        expect(
          commentBlockAbove(LOADER_CSS, 'const spin = keyframes({')
        ).toMatch(/loopRhythm|T5|공유 자산/);
      });
    });
  });

  describe('점 궤도 orbit (M5 task-20)', () => {
    it('기본 렌더가 점 8개를 가진다', () => {
      const { container } = render(<Loader />);
      expect(container.querySelectorAll('[data-orbit-dot]')).toHaveLength(8);
    });

    it('점마다 순번 i를 --orbit-i로 받는다 (회전 각 i × 45deg와 늦춤 loop.fast × i / 8의 입력)', () => {
      const { container } = render(<Loader />);
      const dots = [
        ...container.querySelectorAll<HTMLElement>('[data-orbit-dot]'),
      ];
      expect(dots.map((d) => d.style.getPropertyValue('--orbit-i'))).toEqual([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
      ]);
    });

    it('점의 회전 각은 i × 45deg이고 늦춤은 loop.fast × i / 8이다 (리터럴 ms 없음)', () => {
      const dotBlock = block(LOADER_CSS, 'orbitDot');
      expect(dotBlock).toContain('rotate(calc(var(--orbit-i) * 45deg))');
      expect(dotBlock).toContain(
        'animationDelay: `calc(${themeContract.animation.loop.fast} * var(--orbit-i) / 8)`'
      );
    });

    it('접근성: 지금 spinner와 같은 status 계약이고 점들은 aria-hidden이다', () => {
      const { container } = render(<Loader label="불러오는 중" />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-label', '불러오는 중');
      const dot = container.querySelector('[data-orbit-dot]') as HTMLElement;
      expect(dot.closest('[aria-hidden="true"]')).not.toBeNull();
    });

    it('색은 spinner·dots와 같은 --spinner-color로 받는다', () => {
      render(<Loader color="#0f0" />);
      expect(screen.getByRole('status')).toHaveStyle({
        '--spinner-color': '#0f0',
      });
    });

    it('켜짐 키프레임이 0.15 → 1 → 1 → 0.15 정지점이다 (18%·42%에 최대, 62%에 꺼짐)', () => {
      const frames = keyframesBlock(LOADER_CSS, 'orbitLit');
      expect(frames).toContain("'0%, 100%': { opacity: 0.15 }");
      expect(frames).toContain("'18%, 42%': { opacity: 1 }");
      expect(frames).toContain("'62%': { opacity: 0.15 }");
      expect(frames).not.toContain('transform');
    });

    it('한 바퀴는 loop.fast, 구간 커브는 drift(loopRhythmEasing)이고 점은 제자리에서 투명도만 바뀐다', () => {
      const dotBlock = block(LOADER_CSS, 'orbitDot');
      expect(dotBlock).toContain(
        'animation: `${orbitLit} ${themeContract.animation.loop.fast} ${loopRhythmEasing} infinite`'
      );
      expect(dotBlock).not.toMatch(/easing\.(snap|spring)/);
      expect(dotBlock).toContain('opacity: 0.15');
    });

    it('축소 선호: 늦춤을 없애고 한 바퀴를 loop.base로 늘려 모든 점이 같이 뛴다', () => {
      const dotBlock = block(LOADER_CSS, 'orbitDot');
      const media = dotBlock.slice(dotBlock.indexOf('prefers-reduced-motion'));
      expect(media).toContain("animationDelay: 'initial'");
      expect(media).toContain(
        'animationDuration: themeContract.animation.loop.base'
      );
    });

    it('type="spinner"를 명시하면 예전 고리가 나온다', () => {
      const { container } = render(<Loader type="spinner" />);
      expect(container.querySelector('[data-spinner]')).toBeInTheDocument();
      expect(container.querySelector('[data-orbit-dot]')).toBeNull();
    });
  });

  describe('버블 점 dots (M5 task-20)', () => {
    it('점 셋의 지연 0 / 0.2 / 0.4초가 바깥 상자와 안쪽 몸통에 같이 걸린다', () => {
      const { container } = render(<Loader type="dots" />);
      const dots = container.querySelectorAll('[data-dot]');
      expect(dots).toHaveLength(3);
      dots.forEach((dot) => {
        const delay = dot.getAttribute('data-delay') as string;
        expect(dot.className).toContain(`dotDelayStyles_${delay}`);
        expect(dot.firstElementChild?.className).toContain(
          `dotDelayStyles_${delay}`
        );
      });
    });

    it('솟음(bubbleRise)은 점 지름만큼 올라갔다 내려오고 투명도 변화가 없다', () => {
      const frames = keyframesBlock(LOADER_CSS, 'bubbleRise');
      expect(frames).toContain('translateY(calc(var(--bubble-rise) * -1))');
      expect(frames).not.toContain('opacity');
    });

    it('예비동작(bubbleSquash)은 가로로 퍼지고 세로로 눌리며 투명도 변화가 없다', () => {
      const frames = keyframesBlock(LOADER_CSS, 'bubbleSquash');
      expect(frames).toContain('scaleX(1.15) scaleY(0.8)');
      expect(frames).not.toContain('opacity');
    });

    it('움직이는 구간이 한 바퀴의 앞 1/3이다 (33%에 제자리, 나머지는 쉼)', () => {
      expect(keyframesBlock(LOADER_CSS, 'bubbleRise')).toContain(
        "'0%, 12%, 33%, 100%': { transform: 'translateY(0)' }"
      );
    });

    it('넘치는 커브(snap)는 transform만 움직이는 솟음에만 걸리고, 예비동작은 drift다', () => {
      expect(block(LOADER_CSS, 'dot')).toContain(
        'animation: `${bubbleRise} ${themeContract.animation.loop.base} ${themeContract.animation.easing.snap} infinite backwards`'
      );
      const bodyBlock = block(LOADER_CSS, 'dotBody');
      expect(bodyBlock).toContain(
        'animation: `${bubbleSquash} ${themeContract.animation.loop.base} ${loopRhythmEasing} infinite backwards`'
      );
      expect(bodyBlock).not.toMatch(/easing\.(snap|spring)/);
    });

    it('눌릴 때 바닥이 붙어 있도록 기준점이 아래 가운데다', () => {
      expect(block(LOADER_CSS, 'dotBody')).toContain(
        "transformOrigin: '50% 100%'"
      );
    });

    it('축소 선호: transform 없이 투명도 깜빡임(fadeInOut)으로 돌아간다', () => {
      const frames = keyframesBlock(LOADER_CSS, 'fadeInOut');
      expect(frames).toContain('opacity');
      expect(frames).not.toContain('transform');
      const dotBlock = block(LOADER_CSS, 'dot');
      const media = dotBlock.slice(dotBlock.indexOf('prefers-reduced-motion'));
      expect(media).toContain('${fadeInOut}');
      const bodyBlock = block(LOADER_CSS, 'dotBody');
      const bodyMedia = bodyBlock.slice(
        bodyBlock.indexOf('prefers-reduced-motion')
      );
      expect(bodyMedia).toContain("animation: 'none'");
    });
  });

  describe('fullScreen·overlay 반투명 (M5 task-20)', () => {
    it('컨테이너에 opacity가 없다, 안의 로더와 라벨이 흐려지지 않는다', () => {
      expect(block(LOADER_CSS, 'fullScreenStyles')).not.toMatch(/\bopacity\b/);
      expect(block(LOADER_CSS, 'overlayStyles')).not.toMatch(/\bopacity\b/);
    });

    it('배경색에만 같은 비율의 투명도를 준다 (90% / 80%)', () => {
      expect(block(LOADER_CSS, 'fullScreenStyles')).toContain(
        'backgroundColor: `color-mix(in srgb, ${themeContract.color.background.default} 90%, transparent)`'
      );
      expect(block(LOADER_CSS, 'overlayStyles')).toContain(
        'backgroundColor: `color-mix(in srgb, ${themeContract.color.background.default} 80%, transparent)`'
      );
    });

    it('라벨은 text.secondary이고 흰 바탕 대비가 4.88:1이다', () => {
      expect(block(LOADER_CSS, 'label')).toContain(
        'color: themeContract.color.text.secondary'
      );
      expect(contrastOnWhite(gray[600])).toBeCloseTo(4.88, 1);
    });
  });
});
