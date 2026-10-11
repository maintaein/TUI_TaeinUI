import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader } from './Loader';
import { gray } from '../../tokens/colors.css';
import { themeTokens } from '../../tokens/contract';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { SQUASH_PX } from '../SegmentedButtons/segmentedMotion';
import {
  INCHWORM_STEPS,
  WAVE_HEIGHT_PX,
  WAVE_PITCH_PX,
  WAVE_WIDTH_PX,
  inchwormFrames,
  inchwormInset,
  inchwormStops,
  waveBarCount,
  FUSE_SPARK_PX,
  ORBIT_RADIUS_PX,
  markPoints,
  pairByAngle,
  ringPoints,
  type Point,
} from './loaderMotion';

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

/** CSS 소스 조각 비교. 줄바꿈과 닫는 괄호 앞 쉼표는 prettier가 정하므로 지우고 비교한다. */
const squash = (src: string): string =>
  src.replace(/\s+/g, '').replace(/,([}\]])/g, '$1');
const expectCss = (src: string) => ({
  toContain: (fragment: string) =>
    expect(squash(src)).toContain(squash(fragment)),
});

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

    it('바깥 솟음 정지점이 0 → 10% 바닥, 20% 꼭대기, 32% 바닥, 그 뒤 쉼이다 (움직이는 구간은 한 바퀴의 앞 32%, M5 task-20 2부)', () => {
      const frames = keyframesBlock(LOADER_CSS, 'bubbleRise');
      expect(frames).toContain(
        "'0%, 10%, 32%, 100%': { transform: 'translateY(0)' }"
      );
      expect(frames).toContain(
        "'20%': { transform: 'translateY(calc(var(--bubble-rise) * -1))' }"
      );
    });

    it('안쪽 몸 정지점이 10% 눌림, 14% 늘어남, 20% 둥근 채, 32% 닿을 때 작게 눌림, 38% 쉼이다 (M5 task-20 2부)', () => {
      const frames = keyframesBlock(LOADER_CSS, 'bubbleSquash');
      expect(frames).toContain(
        "'0%, 20%, 38%, 100%': { transform: 'scale(1)' }"
      );
      expect(frames).toContain(
        "'10%': { transform: 'scaleX(1.15) scaleY(0.8)' }"
      );
      expect(frames).toContain(
        "'14%': { transform: 'scaleX(0.92) scaleY(1.1)' }"
      );
      expect(frames).toContain(
        "'32%': { transform: 'scaleX(1.08) scaleY(0.92)' }"
      );
    });

    it('예비동작은 솟기 전에 바닥에서 일어난다: 눌림 최대 정지점이 바깥이 바닥을 떠나는 정지점 이하이고 꼭대기보다 앞선다 (M5 task-20 2부, 교훈 14)', () => {
      const stops = (name: string) =>
        [
          ...keyframesBlock(LOADER_CSS, name).matchAll(
            /'([^']+)':\s*\{ transform: '([^']+)'/g
          ),
        ].flatMap((m) =>
          m[1].split(',').map((k) => ({ pct: parseFloat(k), transform: m[2] }))
        );
      const outer = stops('bubbleRise');
      const inner = stops('bubbleSquash');
      const peak = outer.find((s) => s.transform !== 'translateY(0)')!.pct;
      const leaveBottom = Math.max(
        ...outer
          .filter((s) => s.transform === 'translateY(0)' && s.pct < peak)
          .map((s) => s.pct)
      );
      const squashMax = inner.find((s) =>
        s.transform.includes('scaleX(1.15)')
      )!.pct;
      expect(squashMax).toBeLessThanOrEqual(leaveBottom);
      expect(squashMax).toBeLessThan(peak);
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

  describe('물결 막대 wave (M5 task-20 2부)', () => {
    const SIZES = [
      ['sm', 48, 12, 6],
      ['md', 64, 16, 8],
      ['lg', 96, 24, 12],
      ['xl', 128, 32, 16],
    ] as const;

    it.each(SIZES)(
      '%s: 폭 %i, 높이 %i, 막대 개수는 폭 / 8 = %i개다',
      (size, width, height, count) => {
        const { container } = render(<Loader type="wave" size={size} />);
        expect(container.querySelectorAll('[data-wave-bar]')).toHaveLength(
          count
        );
        expect(WAVE_WIDTH_PX[size]).toBe(width);
        expect(WAVE_HEIGHT_PX[size]).toBe(height);
        expect(waveBarCount(size)).toBe(width / WAVE_PITCH_PX);
      }
    );

    it('막대 중심 간격은 8px 고정이고 막대 폭 2px에 좌우 여백 3px씩이다 (교훈 18)', () => {
      expect(WAVE_PITCH_PX).toBe(8);
      const bar = block(LOADER_CSS, 'waveBar');
      expect(bar).toContain("width: '2px'");
      expect(bar).toContain("margin: '0 3px'");
    });

    it('막대마다 순번 i를 --wave-i로, 바깥이 개수를 --wave-n으로 받는다', () => {
      const { container } = render(<Loader type="wave" size="md" />);
      const bars = [
        ...container.querySelectorAll<HTMLElement>('[data-wave-bar]'),
      ];
      expect(bars.map((b) => b.style.getPropertyValue('--wave-i'))).toEqual([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
      ]);
      const wrap = container.querySelector<HTMLElement>('[data-wave]')!;
      expect(wrap.style.getPropertyValue('--wave-n')).toBe('8');
    });

    it('막대마다 늦춤은 loop.base × i / N이다 (리터럴 ms 없음)', () => {
      const bar = block(LOADER_CSS, 'waveBar');
      expect(bar).toContain(
        'animationDelay: `calc(${themeContract.animation.loop.base} * var(--wave-i) / var(--wave-n))`'
      );
    });

    it('한 막대의 키프레임이 0% 0.3 → 8% 1 → 40% 0.3 → 100% 0.3 이다 (앞은 빨리 솟고 뒤는 천천히 가라앉는다)', () => {
      const frames = keyframesBlock(LOADER_CSS, 'waveSwell');
      expect(frames).toContain("'0%, 40%, 100%': { transform: 'scaleY(0.3)' }");
      expect(frames).toContain("'8%': { transform: 'scaleY(1)' }");
    });

    it('솟는 구간(0 → 8%)이 가라앉는 구간(8% → 40%)보다 짧다', () => {
      const frames = keyframesBlock(LOADER_CSS, 'waveSwell');
      const peak = parseFloat(
        /'(\d+)%': \{ transform: 'scaleY\(1\)'/.exec(frames)![1]
      );
      const restAgain = parseFloat(/'0%, (\d+)%, 100%'/.exec(frames)![1]);
      expect(peak).toBeLessThan(restAgain - peak);
    });

    it('움직이는 속성은 transform scaleY뿐이다 (투명도·위치 없음)', () => {
      const frames = keyframesBlock(LOADER_CSS, 'waveSwell');
      expect(frames).not.toContain('opacity');
      expect(frames).not.toMatch(/translate|rotate|scaleX/);
      expect(frames.match(/transform:/g)).toHaveLength(2);
    });

    it('한 바퀴는 loop.base, 구간 커브는 drift, 기준점은 가운데이고 쉬는 높이가 scaleY(0.3)이다', () => {
      const bar = block(LOADER_CSS, 'waveBar');
      expect(bar).toContain(
        'animation: `${waveSwell} ${themeContract.animation.loop.base} ${loopRhythmEasing} infinite backwards`'
      );
      expect(bar).not.toMatch(/easing\.(snap|spring)/);
      expect(bar).toContain("transform: 'scaleY(0.3)'");
      expect(bar).toContain("transformOrigin: 'center'");
    });

    it('색은 --spinner-color이고 접근성은 다른 타입과 같다 (막대 묶음 aria-hidden)', () => {
      const { container } = render(
        <Loader type="wave" color="#0f0" label="불러오는 중" />
      );
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-label', '불러오는 중');
      expect(status).toHaveAttribute('data-type', 'wave');
      expect(status).toHaveStyle({ '--spinner-color': '#0f0' });
      const wrap = container.querySelector('[data-wave]') as HTMLElement;
      expect(wrap).toHaveAttribute('aria-hidden', 'true');
      expect(block(LOADER_CSS, 'waveBar')).toContain(
        "backgroundColor: 'var(--spinner-color)'"
      );
    });

    it('축소 선호: transform 없이 막대는 쉬는 높이로 늦춤 없이 함께 투명도 맥박(fadeInOut, loop.base)이다', () => {
      const bar = block(LOADER_CSS, 'waveBar');
      const media = bar.slice(bar.indexOf('prefers-reduced-motion'));
      expect(media).toContain(
        'animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ${loopRhythmEasing} backwards`'
      );
      expect(media).not.toContain('transform');
      expect(media).not.toContain('animationDelay');
    });
  });

  describe('자벌레 inchworm (M5 task-20 2부)', () => {
    const stops = inchwormStops();
    const at = (pct: number) => stops.find((s) => s.at === pct)!;

    it('걸음은 5번이고 정지점은 걸음마다 셋에 끝 하나, 16개다', () => {
      expect(INCHWORM_STEPS).toBe(5);
      expect(stops).toHaveLength(INCHWORM_STEPS * 3 + 1);
      expect(stops.map((s) => s.at)).toEqual(
        [...stops.map((s) => s.at)].sort((a, b) => a - b)
      );
      expect(stops[stops.length - 1].at).toBe(100);
    });

    it('몸이 왼쪽 밖(L -25, R 0)에서 들어와 오른쪽 밖(L 100, R 125)으로 나간다, 쉬는 몸은 25%다', () => {
      expect(at(0)).toMatchObject({ l: -25, r: 0, lPx: 0 });
      expect(at(100)).toMatchObject({ l: 100, r: 125, lPx: 0 });
      for (let k = 0; k < 5; k++) {
        const rest = at(k * 20);
        expect(rest.r - rest.l).toBe(25);
        expect(rest.lPx).toBe(0);
      }
    });

    it('한 걸음: 앞끝 R이 +25%(몸 50%, 걸음의 40%), 뒤끝 L이 +25% + 3px(85%), 3px 되돌아옴(100%)', () => {
      for (let k = 0; k < 5; k++) {
        const base = k * 20;
        const start = at(base);
        const stretched = at(base + 8);
        const over = at(base + 17);
        const next = at(base + 20);
        expect(stretched).toMatchObject({ l: start.l, r: start.r + 25 });
        expect(stretched.r - stretched.l).toBe(50);
        expect(over).toMatchObject({ l: start.l + 25, r: start.r + 25 });
        expect(over.lPx).toBe(SQUASH_PX);
        expect(next).toMatchObject({
          l: start.l + 25,
          r: start.r + 25,
          lPx: 0,
        });
      }
    });

    it('지나침은 SegmentedButtons의 SQUASH_PX(3px)이고 걸음마다 한 번이다', () => {
      expect(SQUASH_PX).toBe(3);
      const over = stops.filter((s) => s.lPx > 0);
      expect(over).toHaveLength(5);
      expect(over.every((s) => s.lPx === 3)).toBe(true);
    });

    it('좌 → 우다: 정지점마다 L과 R이 줄어들지 않는다 (S1)', () => {
      stops.slice(1).forEach((s, i) => {
        expect(s.l).toBeGreaterThanOrEqual(stops[i].l);
        expect(s.r).toBeGreaterThanOrEqual(stops[i].r);
      });
    });

    it('clip-path 문자열: inset(0 calc(100% - R) 0 L round 2px), 지나침이면 L에 3px를 더한다', () => {
      expect(inchwormInset(at(0))).toBe(
        'inset(0 calc(100% - 0%) 0 -25% round 2px)'
      );
      expect(inchwormInset(at(17))).toBe(
        'inset(0 calc(100% - 25%) 0 calc(0% + 3px) round 2px)'
      );
    });

    it('키프레임은 정지점마다 clipPath와 구간 커브를 갖고 끝 프레임만 커브가 없다', () => {
      const frames = inchwormFrames('EASE');
      const keys = Object.keys(frames);
      expect(keys).toHaveLength(16);
      expect(keys[0]).toBe('0%');
      expect(keys[keys.length - 1]).toBe('100%');
      expect(frames['8%']).toEqual({
        clipPath: inchwormInset(at(8)),
        animationTimingFunction: 'EASE',
      });
      expect(frames['100%']).toEqual({ clipPath: inchwormInset(at(100)) });
    });

    it('css는 반복문으로 만든 프레임을 settle 커브로 쓰고 손으로 정지점을 쓰지 않는다', () => {
      const frames = keyframesBlock(LOADER_CSS, 'inchworm');
      expect(frames).toContain(
        '...inchwormFrames(themeContract.animation.easing.settle)'
      );
      expect(frames).not.toMatch(/'\d+%'/);
    });

    it('한 바퀴는 loop.base × 2 이고 몸은 clip-path로 그린다', () => {
      const fill = block(LOADER_CSS, 'inchwormFill');
      expect(fill).toContain(
        'animation: `${inchworm} calc(${themeContract.animation.loop.base} * 2) infinite backwards`'
      );
      expect(fill).toContain('clipPath: inchwormInset(');
    });

    it('bar와 같은 트랙(크기 클래스, 면, 경계) 안에서 채움 층이 전체 폭으로 깔린다', () => {
      const { container } = render(<Loader type="inchworm" size="lg" />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('data-type', 'inchworm');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-busy', 'true');
      expect(status).toHaveAttribute('aria-label', '로딩 중');
      const track = status.firstElementChild as HTMLElement;
      expect(track.className).toContain('barSizeStyles_lg');
      expect(container.querySelector('[data-inchworm-fill]')).not.toBeNull();
      const fill = block(LOADER_CSS, 'inchwormFill');
      expect(fill).toContain("width: '100%'");
      expect(fill).toContain("backgroundColor: 'var(--loader-color)'");
    });

    it('color 프리셋과 임의 색상을 bar와 같은 방식으로 받는다', () => {
      const { container, rerender } = render(
        <Loader type="inchworm" color="white" />
      );
      expect(
        container.querySelector('[data-inchworm-fill]')!.className
      ).toContain('colorStyles_white');
      rerender(<Loader type="inchworm" color="#0f0" />);
      expect(
        (
          container.querySelector('[data-inchworm-fill]') as HTMLElement
        ).style.getPropertyValue('--loader-color')
      ).toBe('#0f0');
    });

    it('축소 선호: 기어가지 않고 몸은 가운데(L 37.5%, R 62.5%)에서 투명도 맥박(loop.base)이다', () => {
      const fill = block(LOADER_CSS, 'inchwormFill');
      const media = fill.slice(fill.indexOf('prefers-reduced-motion'));
      expect(media).toContain("clipPath: 'inset(0 37.5% 0 37.5% round 2px)'");
      expect(media).toContain(
        'animation: `${fadeInOut} ${themeContract.animation.loop.base} infinite ${loopRhythmEasing} backwards`'
      );
    });
  });

  describe('완료 표식 순수 함수 (M5 task-20 3부)', () => {
    const R = 10;
    const A: Point = { x: -0.55 * R, y: 0 };
    const B: Point = { x: -0.15 * R, y: 0.4 * R };
    const C: Point = { x: 0.6 * R, y: -0.45 * R };
    const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
    /** 점에서 선분 PQ까지의 거리와, P에서 그 수선의 발까지의 길이 */
    const project = (p: Point, P: Point, Q: Point) => {
      const len = dist(P, Q);
      const t = Math.max(
        0,
        Math.min(
          len,
          ((p.x - P.x) * (Q.x - P.x) + (p.y - P.y) * (Q.y - P.y)) / len
        )
      );
      const foot = {
        x: P.x + ((Q.x - P.x) * t) / len,
        y: P.y + ((Q.y - P.y) * t) / len,
      };
      return { gap: dist(p, foot), at: t };
    };
    const angle = (p: Point) =>
      (Math.atan2(p.x, -p.y) + 2 * Math.PI) % (2 * Math.PI);
    const rank = (pts: Point[]) =>
      pts.map((p) => pts.filter((q) => angle(q) < angle(p)).length);

    it('ringPoints: 12시에서 시계 방향으로 45도씩 반지름 위의 8점이다', () => {
      const pts = ringPoints(R);
      expect(pts).toHaveLength(8);
      expect(pts[0].x).toBeCloseTo(0, 5);
      expect(pts[0].y).toBeCloseTo(-R, 5);
      expect(pts[2].x).toBeCloseTo(R, 5);
      expect(pts[2].y).toBeCloseTo(0, 5);
      expect(pts[4].y).toBeCloseTo(R, 5);
      expect(pts[6].x).toBeCloseTo(-R, 5);
      pts.forEach((p) => expect(Math.hypot(p.x, p.y)).toBeCloseTo(R, 1));
    });

    it('markPoints done: 8점이 A, B, C 꺾은선 위에 양끝을 포함해 길이를 따라 고르게 놓인다', () => {
      const pts = markPoints('done', R);
      expect(pts).toHaveLength(8);
      expect(dist(pts[0], A)).toBeLessThan(0.02);
      expect(dist(pts[7], C)).toBeLessThan(0.02);
      const ab = dist(A, B);
      const total = ab + dist(B, C);
      pts.forEach((p, k) => {
        const onAB = project(p, A, B);
        const onBC = project(p, B, C);
        const [near, arc] =
          onAB.gap <= onBC.gap ? [onAB.gap, onAB.at] : [onBC.gap, ab + onBC.at];
        expect(near).toBeLessThan(0.02);
        expect(arc).toBeCloseTo((total * k) / 7, 1);
      });
    });

    it('markPoints error: 8점이 두 대각선에 4점씩 놓이고 가운데는 비어 있다', () => {
      const pts = markPoints('error', R);
      expect(pts).toHaveLength(8);
      const down = pts.filter((p) => Math.abs(p.x - p.y) < 0.02);
      const up = pts.filter((p) => Math.abs(p.x + p.y) < 0.02);
      expect(down).toHaveLength(4);
      expect(up).toHaveLength(4);
      pts.forEach((p) => {
        expect(Math.hypot(p.x, p.y)).toBeGreaterThan(R * 0.15);
        expect(Math.hypot(p.x, p.y)).toBeLessThan(R);
      });
    });

    it('pairByAngle: 점과 자리를 12시부터 시계 방향 각도순으로 나란히 짝짓는다', () => {
      const ring = ringPoints(R);
      const targets = markPoints('done', R);
      const paired = pairByAngle(ring, targets);
      expect(paired).toHaveLength(8);
      // 자리를 하나도 빼놓거나 겹치지 않는다
      const key = (pts: Point[]) => pts.map((p) => `${p.x},${p.y}`).sort();
      expect(key(paired)).toEqual(key(targets));
      // i번째 점이 각도순 i번째 자리를 받는다
      expect(rank(paired)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    it('pairByAngle: 자리가 어떤 순서로 주어져도 각도순이 기준이다', () => {
      const ring = ringPoints(R);
      expect(pairByAngle(ring, [...ring].reverse())).toEqual(ring);
    });
  });

  describe('완료 표식 status (M5 task-20 3부)', () => {
    type OrbitHost = HTMLElement & {
      __loaderStatusTimeline?: gsap.core.Timeline;
    };
    type Tween = gsap.core.Tween;

    const MD = ORBIT_RADIUS_PX.md;
    const STAGGER = gsapDuration.fast / 8;

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    /** jsdom은 matchMedia를 구현하지 않는다. 축소 선호 경로를 열려면 깔아야 한다. */
    const installReducedMotion = (): void => {
      vi.stubGlobal(
        'matchMedia',
        (media: string): MediaQueryList =>
          ({
            matches: true,
            media,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
            onchange: null,
          }) as unknown as MediaQueryList
      );
    };

    const orbitOf = (container: HTMLElement): OrbitHost =>
      container.querySelector('[data-orbit]') as OrbitHost;
    const dotsOf = (container: HTMLElement): HTMLElement[] => [
      ...container.querySelectorAll<HTMLElement>('[data-orbit-dot]'),
    ];
    const posOf = (el: HTMLElement): Point => {
      const m = el.style.transform.match(
        /translate(?:3d)?\(([-\d.e]+)px,\s*([-\d.e]+)px/
      );
      return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 };
    };
    const expectDotsAt = (container: HTMLElement, expected: Point[]): void => {
      dotsOf(container).forEach((dot, i) => {
        expect(posOf(dot).x).toBeCloseTo(expected[i].x, 4);
        expect(posOf(dot).y).toBeCloseTo(expected[i].y, 4);
      });
    };
    const markTargets = (kind: 'done' | 'error'): Point[] =>
      pairByAngle(ringPoints(MD), markPoints(kind, MD));
    const tweensOf = (container: HTMLElement): Tween[] =>
      (orbitOf(container).__loaderStatusTimeline?.getChildren() ??
        []) as Tween[];
    const tweenFor = (container: HTMLElement, dot: HTMLElement): Tween =>
      tweensOf(container).find((t) => t.targets()[0] === dot) as Tween;

    it('마운트: loading이면 점은 원 위에 있고 움직이는 것이 없다', () => {
      const { container } = render(<Loader />);
      expectDotsAt(container, ringPoints(MD));
      expect(orbitOf(container).__loaderStatusTimeline).toBeUndefined();
      expect(orbitOf(container)).toHaveAttribute('data-status', 'loading');
      expect(orbitOf(container)).not.toHaveAttribute('data-paused');
    });

    it('마운트: done으로 시작하면 효과 없이 바로 체크 자리에 있고 밝기 키프레임은 멈춘다', () => {
      const { container } = render(<Loader status="done" />);
      expectDotsAt(container, markTargets('done'));
      expect(orbitOf(container).__loaderStatusTimeline).toBeUndefined();
      expect(orbitOf(container)).toHaveAttribute('data-paused');
    });

    it('loading에서 done이 되면 점마다 트윈이 하나씩, 체크 자리로 slow settle로 간다', () => {
      const { container, rerender } = render(<Loader />);
      rerender(<Loader status="done" />);
      const expected = markTargets('done');
      const dots = dotsOf(container);
      expect(tweensOf(container)).toHaveLength(8);
      dots.forEach((dot, i) => {
        const tween = tweenFor(container, dot);
        expect(tween.vars.x).toBeCloseTo(expected[i].x, 4);
        expect(tween.vars.y).toBeCloseTo(expected[i].y, 4);
        expect(tween.vars.opacity).toBe(1);
        expect(tween.duration()).toBeCloseTo(gsapDuration.slow, 6);
        expect(tween.vars.ease).toBe(gsapEasing.settle);
      });
    });

    it('점마다 시차가 fast / 8씩 벌어진다 (0번 점은 바로, 7번 점이 가장 늦게)', () => {
      const { container, rerender } = render(<Loader />);
      rerender(<Loader status="error" />);
      dotsOf(container).forEach((dot, i) => {
        expect(tweenFor(container, dot).startTime()).toBeCloseTo(
          STAGGER * i,
          6
        );
      });
    });

    it('끝까지 가면 점이 체크 자리에 앉고, 손잡이가 비며, 밝기 키프레임은 멈춘 채다', () => {
      const { container, rerender } = render(<Loader />);
      rerender(<Loader status="done" />);
      const host = orbitOf(container);
      expect(host).toHaveAttribute('data-paused');
      host.__loaderStatusTimeline?.progress(1);
      expectDotsAt(container, markTargets('done'));
      expect(host.__loaderStatusTimeline).toBeUndefined();
      expect(host).toHaveAttribute('data-paused');
    });

    it('error는 X 자리로 모인다', () => {
      const { container, rerender } = render(<Loader />);
      rerender(<Loader status="error" />);
      orbitOf(container).__loaderStatusTimeline?.progress(1);
      expectDotsAt(container, markTargets('error'));
    });

    it('loading으로 돌아오면 같은 길을 거꾸로 원 위로 가고, 도착한 뒤에야 밝기 키프레임이 재개된다', () => {
      const { container, rerender } = render(<Loader status="done" />);
      rerender(<Loader status="loading" />);
      const host = orbitOf(container);
      expect(host).toHaveAttribute('data-paused');
      const ring = ringPoints(MD);
      dotsOf(container).forEach((dot, i) => {
        const tween = tweenFor(container, dot);
        expect(tween.vars.x).toBeCloseTo(ring[i].x, 4);
        expect(tween.vars.y).toBeCloseTo(ring[i].y, 4);
        expect(tween.duration()).toBeCloseTo(gsapDuration.slow, 6);
      });
      host.__loaderStatusTimeline?.progress(1);
      expectDotsAt(container, ring);
      expect(host).not.toHaveAttribute('data-paused');
      expect(host.__loaderStatusTimeline).toBeUndefined();
    });

    it('진행 중 상태가 바뀌면 지금 위치에서 새 목표로 가고 손잡이는 하나뿐이다', () => {
      const { container, rerender } = render(<Loader />);
      rerender(<Loader status="done" />);
      const host = orbitOf(container);
      const first = host.__loaderStatusTimeline as gsap.core.Timeline;
      first.time(gsapDuration.slow * 0.5 + STAGGER * 3);
      const dots = dotsOf(container);
      const mid = dots.map(posOf);
      // 아직 도착 전이라 원 위도 체크 자리도 아니다
      expect(mid[0].x).not.toBeCloseTo(ringPoints(MD)[0].x, 2);

      rerender(<Loader status="error" />);
      const second = host.__loaderStatusTimeline as gsap.core.Timeline;
      expect(second).not.toBe(first);
      expect(first.parent).toBeNull();
      second.progress(0);
      dots.forEach((dot, i) => {
        expect(posOf(dot).x).toBeCloseTo(mid[i].x, 4);
        expect(posOf(dot).y).toBeCloseTo(mid[i].y, 4);
      });
      second.progress(1);
      expectDotsAt(container, markTargets('error'));
    });

    it('언마운트하면 돌던 타임라인이 정리된다', () => {
      const { container, rerender, unmount } = render(<Loader />);
      rerender(<Loader status="done" />);
      const timeline = orbitOf(container).__loaderStatusTimeline;
      expect(timeline?.parent).not.toBeNull();
      unmount();
      expect(timeline?.parent).toBeNull();
    });

    it('축소 선호: 상태가 바뀌면 바로 끝 상태이고 타임라인이 남지 않는다', () => {
      installReducedMotion();
      const { container, rerender } = render(<Loader />);
      rerender(<Loader status="done" />);
      expectDotsAt(container, markTargets('done'));
      expect(orbitOf(container).__loaderStatusTimeline).toBeUndefined();
      rerender(<Loader status="loading" />);
      expectDotsAt(container, ringPoints(MD));
      expect(orbitOf(container)).not.toHaveAttribute('data-paused');
    });

    it('접근성: aria-busy는 loading일 때만 true이고 이름 기본값이 상태를 따른다', () => {
      const { rerender } = render(<Loader />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-busy', 'true');
      expect(status).toHaveAttribute('aria-label', '로딩 중');
      rerender(<Loader status="done" />);
      expect(status).toHaveAttribute('aria-busy', 'false');
      expect(status).toHaveAttribute('aria-label', '완료');
      rerender(<Loader status="error" />);
      expect(status).toHaveAttribute('aria-busy', 'false');
      expect(status).toHaveAttribute('aria-label', '실패');
    });

    it('접근 이름은 aria-label, label이 있으면 그것이 먼저다', () => {
      const { rerender } = render(<Loader status="done" label="저장함" />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        '저장함'
      );
      rerender(<Loader status="done" label="저장함" aria-label="저장 완료" />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        '저장 완료'
      );
    });

    it('성공 색은 success.dark, 실패 색은 error.dark이고 둘 다 흰 바탕 대비 3:1 이상이다', () => {
      expect(contrastOnWhite(themeTokens.color.success.dark)).toBeGreaterThan(
        3
      );
      expect(contrastOnWhite(themeTokens.color.error.dark)).toBeGreaterThan(3);
      const dotBlock = block(LOADER_CSS, 'orbitDot');
      expectCss(dotBlock).toContain(
        '\'[data-status="done"] &\': { backgroundColor: themeContract.color.success.dark }'
      );
      expectCss(dotBlock).toContain(
        '\'[data-status="error"] &\': { backgroundColor: themeContract.color.error.dark }'
      );
    });

    it('색은 CSS background-color 전이(base settle)로 바뀌고, 멈춘 동안 밝기 키프레임은 없다', () => {
      const dotBlock = block(LOADER_CSS, 'orbitDot');
      expectCss(dotBlock).toContain(
        'transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`'
      );
      expectCss(dotBlock).toContain("'[data-paused] &': { animation: 'none' }");
    });

    it('반지름 표는 CSS 변수와 표식 좌표가 함께 읽는다', () => {
      expect(ORBIT_RADIUS_PX).toEqual({ sm: 6.5, md: 10, lg: 13.5, xl: 20 });
      expectCss(LOADER_CSS).toContain('ORBIT_RADIUS_PX');
    });
  });

  describe('라벨 교체 (M5 task-20 3부)', () => {
    const layers = (container: HTMLElement) => [
      ...container.querySelectorAll<HTMLElement>('[data-label-layer]'),
    ];

    it('처음 렌더는 글자가 든 층 하나만 켜져 있고 다른 층은 비어 있다 (교체 효과 없음)', () => {
      const { container } = render(<Loader label="불러오는 중" />);
      const [first, second] = layers(container);
      expect(first).toHaveTextContent('불러오는 중');
      expect(first).toHaveAttribute('data-active');
      expect(second).toHaveTextContent('');
      expect(second).not.toHaveAttribute('data-active');
    });

    it('글자가 바뀌면 옛 글자와 새 글자가 같은 칸에 겹친 채 켜짐이 새 층으로 넘어간다', () => {
      const { container, rerender } = render(<Loader label="저장 중" />);
      rerender(<Loader label="저장 완료" />);
      const [old, next] = layers(container);
      expect(old).toHaveTextContent('저장 중');
      expect(old).not.toHaveAttribute('data-active');
      expect(old).toHaveAttribute('aria-hidden', 'true');
      expect(next).toHaveTextContent('저장 완료');
      expect(next).toHaveAttribute('data-active');
      expect(old.parentElement).toBe(next.parentElement);
    });

    it('다시 바뀌면 켜짐이 번갈아 넘어가고 같은 글자로 다시 그리면 그대로다', () => {
      const { container, rerender } = render(<Loader label="가" />);
      rerender(<Loader label="나" />);
      rerender(<Loader label="나" />);
      expect(layers(container).map((l) => l.textContent)).toEqual(['가', '나']);
      rerender(<Loader label="다" />);
      const [a, b] = layers(container);
      expect(a).toHaveTextContent('다');
      expect(a).toHaveAttribute('data-active');
      expect(b).toHaveTextContent('나');
    });

    it('모든 type에서 같다 (bar에도 적용)', () => {
      const { container, rerender } = render(<Loader type="bar" label="가" />);
      rerender(<Loader type="bar" label="나" />);
      expect(layers(container).map((l) => l.textContent)).toEqual(['가', '나']);
    });

    it('꺼진 층은 투명도 0과 blur(2px), 켜진 층은 또렷하고, base settle로 갈아끼운다', () => {
      const layer = block(LOADER_CSS, 'labelLayer');
      expectCss(layer).toContain("gridArea: '1 / 1'");
      expectCss(layer).toContain('opacity: 0');
      expectCss(layer).toContain("filter: 'blur(2px)'");
      expectCss(layer).toContain(
        'transition: `opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, filter ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`'
      );
      expectCss(layer).toContain(
        "'&[data-active]': { opacity: 1, filter: 'blur(0)' }"
      );
    });

    it('축소 선호: 전이 없이 바로 바뀐다', () => {
      const layer = block(LOADER_CSS, 'labelLayer');
      const media = layer.slice(layer.indexOf('prefers-reduced-motion'));
      expectCss(media).toContain("transition: 'none'");
    });
  });

  describe('도화선 fuse (M5 task-20 3부)', () => {
    const barOf = (container: HTMLElement) =>
      container.querySelector('[role="progressbar"]') as HTMLElement;

    it('progressbar 역할과 값 속성, 접근 이름을 가진다', () => {
      render(<Loader type="fuse" value={40} />);
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
      expect(bar).toHaveAttribute('aria-valuenow', '40');
      expect(bar).toHaveAttribute('aria-label', '진행률');
      expect(bar).toHaveAttribute('data-type', 'fuse');
    });

    it('label과 aria-label이 접근 이름을 정한다', () => {
      const { rerender } = render(
        <Loader type="fuse" value={1} label="올리는 중" />
      );
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-label',
        '올리는 중'
      );
      rerender(<Loader type="fuse" value={1} aria-label="업로드" />);
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-label',
        '업로드'
      );
    });

    it('value는 0에서 100으로 자른다', () => {
      const { container, rerender } = render(
        <Loader type="fuse" value={150} />
      );
      expect(barOf(container)).toHaveAttribute('aria-valuenow', '100');
      expect(barOf(container).style.getPropertyValue('--fuse-value')).toBe(
        '100'
      );
      rerender(<Loader type="fuse" value={-20} />);
      expect(barOf(container)).toHaveAttribute('aria-valuenow', '0');
      expect(barOf(container).style.getPropertyValue('--fuse-value')).toBe('0');
      rerender(<Loader type="fuse" value={Number.NaN} />);
      expect(barOf(container)).toHaveAttribute('aria-valuenow', '0');
    });

    it('트랙은 bar와 같다 (크기 클래스, 면, 경계 안에 채움 층)', () => {
      const { container } = render(<Loader type="fuse" size="lg" value={30} />);
      expect(
        container.querySelector('[class*="barSizeStyles_lg"]')
      ).not.toBeNull();
      const track = container.querySelector('[data-fuse-fill]')
        ?.parentElement as HTMLElement;
      expect(track.className).toMatch(/(^|\s|_)bar(_|\s|$)/);
    });

    it('채움은 트랙 전체 폭 층을 clip-path로 오려 좌에서 우로 채우고, slow settle로 전이한다', () => {
      const fill = block(LOADER_CSS, 'fuseFill');
      expectCss(fill).toContain("width: '100%'");
      expectCss(fill).toContain(
        "clipPath: 'inset(0 calc(100% - var(--fuse-value) * 1%) 0 0 round 2px)'"
      );
      expectCss(fill).toContain(
        'transition: `clip-path ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle}`'
      );
      expectCss(fill).toContain("backgroundColor: 'var(--loader-color)'");
    });

    it('불똥 래퍼는 트랙 폭 위에서 translateX(value% - 100%)로 옮기고 같은 전이를 쓴다', () => {
      const spark = block(LOADER_CSS, 'fuseSpark');
      expectCss(spark).toContain(
        "transform: 'translateX(calc(var(--fuse-value) * 1% - 100%))'"
      );
      expectCss(spark).toContain(
        'transform ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle}'
      );
    });

    it('불똥은 래퍼 오른쪽 끝의 작은 원이고 --loader-color로 번진다', () => {
      expect(FUSE_SPARK_PX).toEqual({ sm: 6, md: 8, lg: 10, xl: 12 });
      const dot = block(LOADER_CSS, 'fuseSparkDot');
      expectCss(dot).toContain("borderRadius: '50%'");
      expectCss(dot).toContain("backgroundColor: 'var(--loader-color)'");
      expectCss(dot).toContain(
        "boxShadow: '0 0 6px color-mix(in srgb, var(--loader-color) 55%, transparent)'"
      );
    });

    it('value가 100이면 data-complete가 붙고 불똥이 base로 사라진다', () => {
      const { container, rerender } = render(<Loader type="fuse" value={99} />);
      expect(barOf(container)).not.toHaveAttribute('data-complete');
      rerender(<Loader type="fuse" value={100} />);
      expect(barOf(container)).toHaveAttribute('data-complete');
      const spark = block(LOADER_CSS, 'fuseSpark');
      expectCss(spark).toContain("'[data-complete] &': { opacity: 0 }");
      expectCss(spark).toContain(
        'opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}'
      );
    });

    it('0이면 불똥은 시작점(translateX(-100%))에 있다', () => {
      const { container } = render(<Loader type="fuse" value={0} />);
      expect(barOf(container).style.getPropertyValue('--fuse-value')).toBe('0');
      expect(barOf(container)).not.toHaveAttribute('data-complete');
    });

    it('타들어 감: 고르지 않은 정지점(0 / 23 / 41 / 67 / 100)에서 scale 0.85 ~ 1.1, 투명도 0.7 ~ 1', () => {
      const frames = keyframesBlock(LOADER_CSS, 'fuseFlicker');
      expectCss(frames).toContain(
        "'0%, 100%': { transform: 'scale(1)', opacity: 1 }"
      );
      expectCss(frames).toContain(
        "'23%': { transform: 'scale(0.85)', opacity: 0.7 }"
      );
      expectCss(frames).toContain(
        "'41%': { transform: 'scale(1.1)', opacity: 1 }"
      );
      expectCss(frames).toContain(
        "'67%': { transform: 'scale(0.9)', opacity: 0.8 }"
      );
      const dot = block(LOADER_CSS, 'fuseSparkDot');
      expectCss(dot).toContain(
        'animation: `${fuseFlicker} ${themeContract.animation.loop.fast} ${loopRhythmEasing} infinite`'
      );
    });

    it('축소 선호: 깜빡임도 전이도 없다', () => {
      for (const name of ['fuseFill', 'fuseSpark', 'fuseSparkDot']) {
        const b = block(LOADER_CSS, name);
        const media = b.slice(b.indexOf('prefers-reduced-motion'));
        expect(media, name).toContain(
          name === 'fuseSparkDot' ? "animation: 'none'" : "transition: 'none'"
        );
      }
    });

    it('색은 bar와 같은 방식이다 (프리셋 클래스, 임의 색은 --loader-color 인라인)', () => {
      const { container, rerender } = render(
        <Loader type="fuse" value={10} color="secondary" />
      );
      expect(barOf(container).className).toContain('colorStyles_secondary');
      rerender(<Loader type="fuse" value={10} color="#0f0" />);
      expect(barOf(container).style.getPropertyValue('--loader-color')).toBe(
        '#0f0'
      );
    });
  });

  describe('status·value 타입 (M5 task-20 3부)', () => {
    it('fuse에 value가 없으면, spinner에 status를 주면 타입 오류다', () => {
      const elements = [
        // @ts-expect-error fuse는 value가 필수다
        <Loader key="a" type="fuse" />,
        // @ts-expect-error status는 orbit 전용이다
        <Loader key="b" type="spinner" status="done" />,
        // @ts-expect-error value는 fuse 전용이다
        <Loader key="c" type="bar" value={10} />,
        <Loader key="d" status="error" />,
        <Loader key="e" type="orbit" status="done" />,
        <Loader key="f" type="fuse" value={10} />,
      ];
      expect(elements).toHaveLength(6);
    });
  });
});
