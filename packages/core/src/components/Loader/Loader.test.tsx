import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Loader } from './Loader';
import { gray } from '../../tokens/colors.css';
import { contrastRatio, AA_UI } from '../../docs/llmsSections';
import { themeTokens } from '../../tokens/contract';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import {
  WAVE_HEIGHT_PX,
  WAVE_PITCH_PX,
  WAVE_WIDTH_PX,
  inchwormFrames,
  waveBarCount,
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

/** `anchor` 바로 위의 연속된 주석 줄만 모은다. 파일 전체 검색은 무관한 한
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
    it.each(['spinner', 'dots', 'wave', 'orbit'] as const)(
      '%s는 preset이면 bar와 같은 colorStyles 클래스를 붙이고 인라인 색은 없다',
      (type) => {
        const { rerender } = render(<Loader type={type} color="primary" />);
        const root = () => screen.getByRole('status');
        expect(root().className).toContain('colorStyles_primary');
        expect(root().style.getPropertyValue('--spinner-color')).toBe('');
        rerender(<Loader type={type} color="secondary" />);
        expect(root().className).toContain('colorStyles_secondary');
        rerender(<Loader type={type} color="white" />);
        expect(root().className).toContain('colorStyles_white');
        expect(root().style.getPropertyValue('--spinner-color')).toBe('');
      }
    );

    it('기본 색상은 primary이다', () => {
      render(<Loader />);
      expect(screen.getByRole('status').className).toContain(
        'colorStyles_primary'
      );
    });

    it('colorStyles는 preset마다 --loader-color와 --spinner-color를 같은 테마 토큰으로 세운다', () => {
      const presets = {
        primary: 'themeContract.color.primary.main',
        secondary: 'themeContract.color.text.secondary',
        white: 'themeContract.color.text.inverse',
      };
      for (const [name, token] of Object.entries(presets)) {
        const block = LOADER_CSS.slice(
          LOADER_CSS.indexOf(`  ${name}: {`, LOADER_CSS.indexOf('colorStyles'))
        ).split('},')[0];
        expect(block).toContain(`'--loader-color': ${token}`);
        expect(block).toContain(`'--spinner-color': ${token}`);
      }
    });
  });

  describe('임의 색상 통과 (색상 확장)', () => {
    it('bar는 preset이 아닌 색을 fill에 --loader-color 인라인으로 붙인다', () => {
      render(<Loader type="bar" color="#f00" />);
      const fill = screen.getByRole('status').closest('[role="status"]');
      expect(fill).toHaveStyle({ '--loader-color': '#f00' });
    });

    it('bar는 preset이면 인라인 style 없이 colorStyles 클래스를 붙인다', () => {
      render(<Loader type="bar" color="primary" />);
      const fill = screen.getByRole('status').closest('[role="status"]');
      expect(fill?.getAttribute('style') ?? '').not.toContain('--loader-color');
      expect(fill?.className).toContain('colorStyles_primary');
    });

    it('currentColor가 --spinner-color로 그대로 통과한다 (Button이 쓰는 경로)', () => {
      render(<Loader color="currentColor" />);
      const root = screen.getByRole('status');
      expect(root.style.getPropertyValue('--spinner-color')).toBe(
        'currentColor'
      );
      expect(root.className).not.toContain('colorStyles');
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

    it('aria-busy를 달지 않는다 (busy 영역은 낭독 갱신이 미뤄질 수 있어 로딩 영역 표시는 소비자 몫)', () => {
      render(<Loader type="bar" />);
      const loader = screen.getByRole('status');
      expect(loader).not.toHaveAttribute('aria-busy');
    });
  });

  describe('label prop 테스트', () => {
    it('label 텍스트를 렌더링한다', () => {
      // 같은 글자가 status 영역 안의 숨은 메시지에도 있어 보이는 라벨(p)로 좁힌다
      const { container } = render(<Loader label="로딩 중..." />);
      expect(container.querySelector('p')).toHaveTextContent('로딩 중...');
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
      // 리터럴 cubic-bezier가 남아 있으면 안 된다. T5 공유 자산 경유로 대체됐다.
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
        expect(spinner.className).toContain('colorStyles_primary');
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
        // 점 페이드는 주기·커브가 Skeleton wave와 같다. 회전이라서 제외된다는
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
        // 제외 대상은 컴포넌트가 아니라 회전 하나다(리뷰 F3: 옛 사유는
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

    it('축소 선호: 멈춘 점은 눈에 보이는 투명도 0.6이다 (0.15면 고리가 사라진다)', () => {
      const dotBlock = block(LOADER_CSS, 'orbitDot');
      const media = dotBlock.slice(dotBlock.indexOf('prefers-reduced-motion'));
      expect(media).toContain('opacity: 0.6');
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
    it('접근성: aria-busy를 달지 않는다 (bar·inchworm과 같다)', () => {
      render(<Loader type="wave" />);
      expect(screen.getByRole('status')).not.toHaveAttribute('aria-busy');
    });

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

    it('bar로 마운트했다가 orbit으로 바꾼 뒤 언마운트해도 상태 타임라인이 죽는다', () => {
      const { container, rerender, unmount } = render(<Loader type="bar" />);
      rerender(<Loader type="orbit" />);
      rerender(<Loader type="orbit" status="done" />);
      const timeline = orbitOf(container).__loaderStatusTimeline;
      expect(timeline?.parent).not.toBeNull();
      unmount();
      expect(timeline?.parent).toBeNull();
    });

    it('도는 중에 orbit이 아닌 type으로 갈아타면 상태 타임라인이 죽는다', () => {
      const { container, rerender } = render(<Loader />);
      rerender(<Loader status="done" />);
      const timeline = orbitOf(container).__loaderStatusTimeline;
      expect(timeline?.parent).not.toBeNull();
      rerender(<Loader type="bar" />);
      expect(timeline?.parent).toBeNull();
    });

    it('접근성: 살아 있는 영역 안에 화면에 안 보이는 메시지 글자가 있고 상태를 따라 바뀐다', () => {
      const { rerender } = render(<Loader />);
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('로딩 중');
      rerender(<Loader status="done" />);
      expect(status).toHaveTextContent('완료');
      rerender(<Loader status="error" />);
      expect(status).toHaveTextContent('실패');
      // 이름이 정해져 있으면 그 글자다 (aria-label이 label보다 먼저)
      rerender(<Loader status="done" label="저장함" />);
      expect(status).toHaveTextContent('저장함');
      rerender(<Loader status="done" label="저장함" aria-label="저장 완료" />);
      expect(status).toHaveTextContent('저장 완료');
    });

    it('메시지 글자는 시각적으로만 숨기고(display none 아님) 보이는 라벨은 영역 밖이라 두 번 읽히지 않는다', () => {
      const { container } = render(<Loader label="불러오는 중" />);
      const status = screen.getByRole('status');
      const message = status.querySelector(
        '[data-loader-message]'
      ) as HTMLElement;
      expect(message).toHaveTextContent('불러오는 중');
      expect(message.className).toMatch(/visuallyHidden/);
      const hidden = block(LOADER_CSS, 'visuallyHidden');
      expectCss(hidden).toContain("position: 'absolute'");
      expectCss(hidden).toContain("clip: 'rect(0, 0, 0, 0)'");
      expect(hidden).not.toContain('display');
      expect(status.contains(container.querySelector('p'))).toBe(false);
    });

    it('숨은 메시지 글자는 top·left 0으로 문서 왼쪽 위에 놓여 페이지 스크롤을 늘리지 않는다', () => {
      // 위치 조상도 top·left도 없으면 안쪽 스크롤 컨테이너 속 자기 자리에 놓여 문서 높이를 늘린다.
      // CSSOM 대신 소스 텍스트로 잠그는 이유는 '버블 점이 보인다' 시험 위 주석과 같다.
      const hidden = block(LOADER_CSS, 'visuallyHidden');
      expectCss(hidden).toContain('top: 0');
      expectCss(hidden).toContain('left: 0');
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

    it('접근성: aria-busy는 어느 상태에도 없고 이름 기본값이 상태를 따른다', () => {
      const { rerender } = render(<Loader />);
      const status = screen.getByRole('status');
      expect(status).not.toHaveAttribute('aria-busy');
      expect(status).toHaveAttribute('aria-label', '로딩 중');
      rerender(<Loader status="done" />);
      expect(status).not.toHaveAttribute('aria-busy');
      expect(status).toHaveAttribute('aria-label', '완료');
      rerender(<Loader status="error" />);
      expect(status).not.toHaveAttribute('aria-busy');
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

    it('성공 색은 success.dark, 실패 색은 error.main이고 둘 다 흰 바탕 대비 3:1 이상이다', () => {
      expect(contrastOnWhite(themeTokens.color.success.dark)).toBeGreaterThan(
        3
      );
      expect(contrastOnWhite(themeTokens.color.error.main)).toBeGreaterThan(3);
      const dotBlock = block(LOADER_CSS, 'orbitDot');
      expectCss(dotBlock).toContain(
        '\'[data-status="done"] &\': { backgroundColor: themeContract.color.success.dark, boxShadow: loaderGlow(themeContract.color.success.dark) }'
      );
      expectCss(dotBlock).toContain(
        '\'[data-status="error"] &\': { backgroundColor: themeContract.color.error.main, boxShadow: loaderGlow(themeContract.color.error.main) }'
      );
    });

    it('색은 CSS background-color 전이(base settle)로 바뀌고, 멈춘 동안 밝기 키프레임은 없다', () => {
      const dotBlock = block(LOADER_CSS, 'orbitDot');
      expectCss(dotBlock).toContain(
        'transition: `background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}, box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}`'
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
  });

  describe('라벨 교체는 흐림 교체 GSAP 타임라인 하나다 (M5 task-20 수정 5)', () => {
    type LabelHost = HTMLElement & {
      __loaderLabelTimeline?: gsap.core.Timeline;
    };
    type Tween = gsap.core.Tween;

    // 레이아웃을 읽는 getter를 세는 껍데기. 값은 jsdom 그대로이고 읽은 횟수만 센다.
    const READ_PROPS = [
      'offsetWidth',
      'offsetHeight',
      'clientWidth',
      'clientHeight',
      'scrollWidth',
      'scrollHeight',
    ] as const;
    let layoutReads = 0;
    const restores: Array<() => void> = [];
    const installReadCounter = (): void => {
      for (const prop of READ_PROPS) {
        const proto = [HTMLElement.prototype, Element.prototype].find((p) =>
          Object.prototype.hasOwnProperty.call(p, prop)
        ) as object;
        const original = Object.getOwnPropertyDescriptor(proto, prop);
        Object.defineProperty(proto, prop, {
          configurable: true,
          get(this: Element) {
            layoutReads += 1;
            return original?.get?.call(this) ?? 0;
          },
        });
        restores.push(() => {
          if (original) Object.defineProperty(proto, prop, original);
        });
      }
      const rectOriginal = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function (this: Element) {
        layoutReads += 1;
        return rectOriginal.call(this);
      };
      restores.push(() => {
        Element.prototype.getBoundingClientRect = rectOriginal;
      });
    };
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

    afterEach(() => {
      restores.splice(0).forEach((restore) => restore());
      vi.unstubAllGlobals();
      layoutReads = 0;
    });

    const paragraph = (container: HTMLElement): LabelHost =>
      container.querySelector('p') as LabelHost;
    const layers = (container: HTMLElement) => [
      ...container.querySelectorAll<HTMLElement>('[data-label-layer]'),
    ];
    const texts = (container: HTMLElement): string[] =>
      layers(container).map((l) => l.textContent ?? '');
    const timelineOf = (container: HTMLElement): gsap.core.Timeline =>
      paragraph(container).__loaderLabelTimeline as gsap.core.Timeline;
    const tweenOn = (tl: gsap.core.Timeline, el: Element): Tween =>
      (tl.getChildren() as Tween[]).find((t) => t.targets()[0] === el) as Tween;
    const startOf = (tween: Tween): Record<string, unknown> =>
      tween.vars.startAt as Record<string, unknown>;

    it('글자가 바뀌면 두 글자 층만 한 타임라인이 base settle로 흐림 교체한다 (칸 폭 트윈이 없다)', () => {
      const { container, rerender } = render(
        <Loader label="저장하지 못했습니다" />
      );
      expect(timelineOf(container)).toBeUndefined();
      rerender(<Loader label="저장 중" />);
      const tl = timelineOf(container);
      const [old, next] = layers(container);
      expect(tl.duration()).toBe(gsapDuration.base);
      expect(tl.getChildren()).toHaveLength(2);
      expect(tweenOn(tl, paragraph(container))).toBeUndefined();

      const fadeOut = tweenOn(tl, old);
      expect(fadeOut.vars.opacity).toBe(0);
      expect(fadeOut.vars.filter).toBe('blur(2px)');
      expect(fadeOut.duration()).toBe(gsapDuration.base);
      expect(fadeOut.vars.ease).toBe(gsapEasing.settle);

      const fadeIn = tweenOn(tl, next);
      expect(startOf(fadeIn)).toMatchObject({
        opacity: 0,
        filter: 'blur(2px)',
      });
      expect(fadeIn.vars.opacity).toBe(1);
      expect(fadeIn.vars.filter).toBe('blur(0px)');
      expect(fadeIn.duration()).toBe(gsapDuration.base);
      expect(fadeIn.vars.ease).toBe(gsapEasing.settle);
    });

    it('도는 동안에도 칸에 폭이나 줄바꿈 고정을 걸지 않는다 (칸 폭은 새 글자 기준으로 바로 정해진다)', () => {
      const { container, rerender } = render(<Loader label="가" />);
      rerender(<Loader label="가나다라마" />);
      expect(paragraph(container).style.width).toBe('');
      expect(paragraph(container).style.whiteSpace).toBe('');
      expect(texts(container)).toEqual(['가', '가나다라마']);
    });

    it('끝나면 옛 층을 비우고 손잡이를 거둔다', () => {
      const { container, rerender } = render(<Loader label="가나다" />);
      rerender(<Loader label="가" />);
      act(() => {
        timelineOf(container).progress(1);
      });
      expect(texts(container)).toEqual(['', '가']);
      expect(paragraph(container).style.width).toBe('');
      expect(timelineOf(container)).toBeUndefined();
    });

    it('도는 중 또 바뀌면 이전 타임라인은 죽고, 더 옛 글자는 칸에서 빠지고, 새 타임라인도 흐림 교체뿐이다', () => {
      const { container, rerender } = render(<Loader label="가" />);
      rerender(<Loader label="가나다" />);
      const first = timelineOf(container);
      expect(texts(container)).toEqual(['가', '가나다']);
      rerender(<Loader label="가나다라마" />);
      const second = timelineOf(container);
      expect(second).not.toBe(first);
      expect(first.parent).toBeNull();
      // 맨 처음 글자 '가'가 빠지고 그 층이 새 글자로 재사용된다
      expect(texts(container)).toEqual(['가나다라마', '가나다']);
      expect(second.getChildren()).toHaveLength(2);
      expect(tweenOn(second, paragraph(container))).toBeUndefined();
    });

    it('라벨이 없어지면 타임라인이 죽고 두 층이 모두 비며, 다시 생기면 효과 없이 처음 렌더처럼 나온다', () => {
      const { container, rerender } = render(<Loader label="가" />);
      rerender(<Loader label="가나다" />);
      const running = timelineOf(container);
      rerender(<Loader />);
      expect(running.parent).toBeNull();
      expect(paragraph(container)).toBeNull();
      rerender(<Loader label="나" />);
      expect(texts(container)).toEqual(['나', '']);
      expect(timelineOf(container)).toBeUndefined();
      expect(paragraph(container).style.width).toBe('');
    });

    it('라벨 A → 없음 → 긴 B: 옛 글자가 남지 않고 B 하나만 켜져 있다', () => {
      const { container, rerender } = render(<Loader label="A" />);
      rerender(<Loader />);
      rerender(<Loader label="Bbbbbbbbbbbbbbb" />);
      expect(texts(container)).toEqual(['Bbbbbbbbbbbbbbb', '']);
      expect(timelineOf(container)).toBeUndefined();
    });

    it('언마운트하면 돌던 타임라인이 정리된다', () => {
      const { container, rerender, unmount } = render(<Loader label="가" />);
      rerender(<Loader label="가나다" />);
      const running = timelineOf(container);
      expect(running.parent).not.toBeNull();
      unmount();
      expect(running.parent).toBeNull();
    });

    it('라벨이 없으면 아무것도 재지 않는다 (Button, IconButton 안의 로더가 이 경우다)', () => {
      installReadCounter();
      const { rerender } = render(<Loader type="dots" />);
      rerender(<Loader type="dots" size="lg" />);
      rerender(<Loader type="spinner" />);
      rerender(<Loader type="bar" />);
      rerender(<Loader type="wave" />);
      rerender(<Loader type="inchworm" />);
      expect(layoutReads).toBe(0);
    });

    // orbit의 done·error 점 이동은 GSAP이 transform을 읽느라 getBoundingClientRect를
    // 부른다. 그것은 라벨 교체와 무관하므로 여기서는 라벨만 있는 spinner로 잰다.
    it('어떤 커밋에서도 레이아웃을 읽지 않는다 (마운트, 라벨 교체, 연속 교체, 끝, 제거, 재등장, 부모 이동)', () => {
      installReadCounter();
      const tree = (label: string | undefined, marginLeft = 0) => (
        <div style={{ marginLeft }}>
          <Loader type="spinner" size="xl" label={label} />
        </div>
      );
      const { container, rerender, unmount } = render(tree('저장 중...'));
      rerender(tree('저장했습니다'));
      rerender(tree('저장하지 못했습니다'));
      act(() => {
        timelineOf(container).progress(1);
      });
      rerender(tree('저장 중...'));
      rerender(tree(undefined));
      rerender(tree('저장했습니다'));
      rerender(tree('저장했습니다', 120));
      rerender(tree('저장했습니다', 0));
      unmount();
      expect(layoutReads).toBe(0);
    });

    it('라벨이 그대로면 다시 그려도(부모가 옮겨 가도) 아무 트윈이 없다', () => {
      const tree = (marginLeft: number) => (
        <div style={{ marginLeft }}>
          <Loader label="가나다" />
        </div>
      );
      const { container, rerender } = render(tree(0));
      rerender(tree(120));
      rerender(tree(0));
      expect(timelineOf(container)).toBeUndefined();
      expect(paragraph(container).style.width).toBe('');
    });

    it('축소 선호: 바로 끝 상태이고 옛 글자와 손잡이가 남지 않는다', () => {
      installReducedMotion();
      const { container, rerender } = render(<Loader label="가나다" />);
      rerender(<Loader label="가" />);
      expect(texts(container)).toEqual(['', '가']);
      expect(timelineOf(container)).toBeUndefined();
      expect(paragraph(container).style.width).toBe('');
      expect(paragraph(container).style.whiteSpace).toBe('');
    });

    it('도는 중에 축소 선호가 켜지면 끝 상태로 확정한다 (옛 층 비움, 손잡이 거둠)', () => {
      let reduce = false;
      const listeners = new Set<() => void>();
      vi.stubGlobal(
        'matchMedia',
        (media: string): MediaQueryList =>
          ({
            get matches() {
              return reduce;
            },
            media,
            addEventListener: (_: string, fn: () => void) => listeners.add(fn),
            removeEventListener: (_: string, fn: () => void) =>
              listeners.delete(fn),
            dispatchEvent: () => false,
            onchange: null,
          }) as unknown as MediaQueryList
      );
      const { container, rerender } = render(<Loader label="가나다" />);
      rerender(<Loader label="가" />);
      expect(timelineOf(container)).toBeDefined();
      expect(texts(container)).toEqual(['가나다', '가']);
      act(() => {
        reduce = true;
        listeners.forEach((fn) => fn());
      });
      expect(texts(container)).toEqual(['', '가']);
      expect(timelineOf(container)).toBeUndefined();
      expect(paragraph(container).style.width).toBe('');
      expect(paragraph(container).style.whiteSpace).toBe('');
    });

    it('꺼진 층은 left 0 right 0 절대 위치라 칸 폭에서 빠지고 칸 폭에 맞춰 줄바꿈되며(nowrap 없음), 흐림은 CSS 전이가 아니라 GSAP이 맡는다', () => {
      const layer = block(LOADER_CSS, 'labelLayer');
      expectCss(block(LOADER_CSS, 'label')).toContain("position: 'relative'");
      expectCss(layer).toContain("'&:not([data-active])'");
      expectCss(layer).toContain("position: 'absolute'");
      expectCss(layer).toContain('top: 0');
      expectCss(layer).toContain('left: 0');
      expectCss(layer).toContain('right: 0');
      expect(layer).not.toContain('whiteSpace');
      expect(layer).not.toContain('transform');
      expect(layer).not.toContain('transition');
      expect(layer).not.toContain('opacity');
      expect(layer).not.toContain('filter');
    });
  });
});

describe('버블 점이 보인다 (M5 task-20 수정 6)', () => {
  // CSSOM으로 읽으려면 vitest가 Loader.css를 jsdom에 주입해야 하는데, 그러면 궤도 점의
  // 배치용 transform까지 적용되어 GSAP 좌표 시험들이 어긋난다. 그래서 이 파일의 다른
  // CSS 시험처럼 소스 텍스트로 잠근다. 변이(display를 지움)로 빨개진다.
  it('버블 점 안쪽 몸은 inline이 아니라 block이다 (inline이면 width·height 100%가 먹지 않아 0 x 0이다)', () => {
    const body = block(LOADER_CSS, 'dotBody');
    expectCss(body).toContain("display: 'block'");
    expect(body).not.toMatch(/display:\s*'inline'/);
  });

  it('다른 span 그래픽은 inline 함정이 없다 (flex 항목이거나 절대 위치다)', () => {
    // 궤도 점·불똥은 절대 위치, 물결 막대와 버블 점 바깥 상자는 flex 항목이라 블록화된다.
    // 안쪽 몸만 부모(바깥 상자)가 flex가 아니라서 inline으로 남았다.
    expectCss(block(LOADER_CSS, 'orbitDot')).toContain("position: 'absolute'");
    expectCss(block(LOADER_CSS, 'waveBar')).toContain('flexShrink: 0');
    expectCss(block(LOADER_CSS, 'wave')).toContain("display: 'flex'");
    expectCss(block(LOADER_CSS, 'dotsContainer')).toContain("display: 'flex'");
  });
});

describe('막대 디자인: 테두리 없는 6px 회색 면 (M5 task-20 수정 6)', () => {
  const { palette, color } = themeTokens;

  it('트랙은 테두리(boxShadow inset)와 overflow hidden 없이 6px, 끝 3px, gray 200 면이다', () => {
    const track = block(LOADER_CSS, 'bar');
    const base = track.slice(0, track.indexOf('selectors'));
    expectCss(base).toContain("height: '6px'");
    expectCss(base).toContain("borderRadius: '3px'");
    expectCss(base).toContain(
      'backgroundColor: themeContract.palette.gray[200]'
    );
    expect(track).not.toContain('boxShadow');
    expect(track).not.toContain('border.strong');
    expect(track).not.toMatch(/^\s*overflow:/m);
  });

  it('트랙에는 clip-path가 없다 (직각으로 자르면 둥근 끝 밖으로 채움과 빛이 비어져 나온다)', () => {
    expect(block(LOADER_CSS, 'bar')).not.toContain('clipPath');
    expect(block(LOADER_CSS, 'bar')).not.toContain('clip-path');
  });

  it('white 변형의 어두운 면(surface.track)은 그대로다', () => {
    expectCss(block(LOADER_CSS, 'bar')).toContain(
      'backgroundColor: themeContract.color.surface.track'
    );
  });

  it('채움의 둥근 끝도 3px다', () => {
    expectCss(block(LOADER_CSS, 'barFill')).toContain("borderRadius: '3px'");
  });

  it('채움(primary.main)은 트랙(gray 200) 위에서 UI 요소 대비(3:1)를 만족한다', () => {
    expect(
      contrastRatio(color.primary.main, palette.gray[200])
    ).toBeGreaterThanOrEqual(AA_UI);
  });
});

describe('머리의 은은한 광휘 (M5 task-20 수정 6)', () => {
  it('광휘 값은 loaderGlow 하나에만 있고 리터럴이 다른 곳에 없다', () => {
    const at = LOADER_CSS.indexOf('const loaderGlow = ');
    expect(at, 'loaderGlow 정의를 찾지 못했다').toBeGreaterThan(-1);
    const def = LOADER_CSS.slice(at, LOADER_CSS.indexOf(';', at));
    expectCss(def).toContain(
      '`0 0 6px color-mix(in srgb, ${color} 45%, transparent)`'
    );
    expect(LOADER_CSS.match(/0 0 6px/g)).toHaveLength(1);
    expect(LOADER_CSS.match(/45%/g)).toHaveLength(1);
  });

  it('orbit: 점마다 자기 색으로 번지고 완료·실패 표식에서는 그 색이다', () => {
    const dot = block(LOADER_CSS, 'orbitDot');
    expectCss(dot).toContain("boxShadow: loaderGlow('var(--spinner-color)')");
    expectCss(dot).toContain(
      'boxShadow: loaderGlow(themeContract.color.success.dark)'
    );
    expectCss(dot).toContain(
      'boxShadow: loaderGlow(themeContract.color.error.main)'
    );
  });

  it('dots: 안쪽 몸에 건다', () => {
    expectCss(block(LOADER_CSS, 'dotBody')).toContain(
      "boxShadow: loaderGlow('var(--spinner-color)')"
    );
  });

  it('wave: 막대마다 건다', () => {
    expectCss(block(LOADER_CSS, 'waveBar')).toContain(
      "boxShadow: loaderGlow('var(--spinner-color)')"
    );
  });

  it('bar: 채움 자체에는 빛이 없고 자르기 층의 필터 하나가 건다', () => {
    const fill = block(LOADER_CSS, 'barFill');
    expect(fill).not.toContain('boxShadow');
    expect(fill).not.toContain('filter');
    expectCss(block(LOADER_CSS, 'barClip')).toContain(
      "filter: `drop-shadow(${loaderGlow('var(--loader-color)')})`"
    );
  });

  it('spinner: 회색 고리 층에는 그림자가 없고, 위쪽 호만 칠한 겹친 층에 drop-shadow가 걸린다', () => {
    const ring = block(LOADER_CSS, 'spinner');
    const own = ring.slice(0, ring.indexOf('selectors'));
    expect(own).not.toContain('boxShadow');
    expect(own).not.toContain('filter');
    const layer = ring.slice(ring.indexOf("'&::before'"));
    expectCss(layer).toContain(`content: "''"`);
    expectCss(layer).toContain("position: 'absolute'");
    expectCss(layer).toContain("borderColor: 'transparent'");
    expectCss(layer).toContain("borderTopColor: 'var(--spinner-color)'");
    expectCss(layer).toContain(
      "filter: `drop-shadow(${loaderGlow('var(--spinner-color)')})`"
    );
    expectCss(layer).toContain("boxSizing: 'border-box'");
    expectCss(layer).toContain("borderRadius: '50%'");
  });

  it('채움 자르기 층: 투명, overflow hidden + border-radius 3px로 둥글게 자르고 그 결과에 drop-shadow를 건다', () => {
    const clip = block(LOADER_CSS, 'barClip');
    expectCss(clip).toContain("position: 'absolute'");
    expectCss(clip).toContain("width: '100%'");
    expectCss(clip).toContain("height: '100%'");
    expectCss(clip).toContain("overflow: 'hidden'");
    expectCss(clip).toContain("borderRadius: '3px'");
    expectCss(clip).toContain(
      "filter: `drop-shadow(${loaderGlow('var(--loader-color)')})`"
    );
    expect(clip).not.toContain('clipPath');
    expect(clip).not.toContain('backgroundColor');
    expect(clip).not.toContain('boxShadow');
  });

  it('트랙 면 층에는 빛이 없고, 자벌레 채움에도 box-shadow가 없다', () => {
    const track = block(LOADER_CSS, 'bar');
    expect(track).not.toContain('boxShadow');
    expect(track).not.toContain('filter');
    expect(block(LOADER_CSS, 'inchwormFill')).not.toContain('boxShadow');
  });

  it.each(['bar'] as const)('%s DOM: 트랙 > 자르기 층 > 채움이다', (type) => {
    const { container } = render(<Loader type={type} />);
    const track = container.querySelector('[data-bar-clip]')?.parentElement;
    const clip = container.querySelector('[data-bar-clip]');
    expect(clip?.parentElement).toBe(track);
    expect(clip?.children).toHaveLength(1);
  });

  it('정지된 빛이라 축소 선호에서도 걷어내지 않고, 빛은 애니메이션하지 않는다', () => {
    ['orbitDot', 'dotBody', 'waveBar', 'barFill', 'spinner', 'barClip'].forEach(
      (name) => {
        const src = block(LOADER_CSS, name);
        const media = src.includes('prefers-reduced-motion')
          ? src.slice(src.indexOf('prefers-reduced-motion'))
          : '';
        expect(media, name).not.toMatch(/boxShadow|filter/);
      }
    );
    // 전이는 궤도 점의 색 바꿈에 빛이 따라가는 것뿐이고 filter는 전이하지 않는다.
    expect(LOADER_CSS).not.toMatch(/transition:[^\n]*filter/);
    expect(
      LOADER_CSS.match(/transition:[^\n]*box-shadow/g),
      'box-shadow 전이는 orbitDot 하나뿐이다'
    ).toHaveLength(1);
    expect(block(LOADER_CSS, 'orbitDot')).toMatch(
      /transition:[^\n]*box-shadow/
    );
    [
      'progress',
      'orbitLit',
      'bubbleRise',
      'bubbleSquash',
      'waveSwell',
      'inchworm',
      'fadeInOut',
    ].forEach((name) => {
      expect(keyframesBlock(LOADER_CSS, name), name).not.toMatch(
        /boxShadow|filter/
      );
    });
  });
});

describe('낭독: 살아 있는 영역에 aria-busy 없음, 라벨은 한 번만 (M5 기술 정리 R2·R3)', () => {
  // 회귀 분류표 (고치기 전 -> 고친 뒤)
  // | 지점                                    | 전             | 후                 | 종류 |
  // | bar·inchworm·wave status aria-busy      | "true"         | 없음               | 의도 |
  // | orbit status aria-busy                  | loading만 true | 없음(done·error도) | 의도 |
  // | spinner·dots status   | 없음           | 없음               | 유지 |
  // | 라벨 = 접근 이름일 때 p                 | aria-hidden 없음 | "true"           | 의도 |
  // | 라벨 != 접근 이름일 때 p                | aria-hidden 없음 | 없음             | 유지 |
  // | 라벨 없음                               | p 없음         | p 없음             | 유지 |
  // | 숨은 메시지 글자, role, aria-live, 이름 | 그대로         | 그대로             | 유지 |
  // | 소비자가 넘긴 aria-busy                 | 닿지 않음      | 닿지 않음          | 유지 |
  const TYPES = [
    'orbit',
    'spinner',
    'dots',
    'bar',
    'wave',
    'inchworm',
  ] as const;

  it.each(TYPES)('%s: status 요소에 aria-busy가 없다', (type) => {
    render(<Loader type={type} />);
    expect(screen.getByRole('status')).not.toHaveAttribute('aria-busy');
  });

  it.each(['loading', 'done', 'error'] as const)(
    'orbit status=%s: aria-busy가 없다',
    (status) => {
      render(<Loader status={status} />);
      expect(screen.getByRole('status')).not.toHaveAttribute('aria-busy');
    }
  );

  it('bar의 role·aria-live·이름은 그대로다', () => {
    render(<Loader type="bar" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-label', '로딩 중');
  });

  it('소비자가 넘긴 aria-busy는 바깥 래퍼와 status 어디에도 닿지 않는다', () => {
    const { container } = render(<Loader aria-busy="true" label="저장 중" />);
    expect(container.querySelector('[aria-busy]')).toBeNull();
  });

  it.each(TYPES)(
    '%s: 라벨이 접근 이름과 같으면 p는 aria-hidden이고 숨은 메시지가 그 글자를 읽는다',
    (type) => {
      const { container } = render(<Loader type={type} label="업로드 중" />);
      expect(container.querySelector('p')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
      expect(
        screen.getByRole('status').querySelector('[data-loader-message]')
      ).toHaveTextContent('업로드 중');
    }
  );

  it('aria-label이 라벨과 다르면 p는 aria-hidden이 아니다', () => {
    const { container } = render(
      <Loader label="저장 중" aria-label="파일 저장" />
    );
    expect(container.querySelector('p')).not.toHaveAttribute('aria-hidden');
  });

  it('aria-label이 라벨과 같으면 p는 aria-hidden이다', () => {
    const { container } = render(
      <Loader label="저장 중" aria-label="저장 중" />
    );
    expect(container.querySelector('p')).toHaveAttribute('aria-hidden', 'true');
  });

  it('라벨이 없으면 p도 없다', () => {
    const { container } = render(<Loader fullScreen />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('라벨 글자가 바뀌면 숨은 메시지도 바뀌고 p는 계속 aria-hidden이다', () => {
    const { container, rerender } = render(
      <Loader type="bar" label="업로드 중" />
    );
    const message = screen
      .getByRole('status')
      .querySelector('[data-loader-message]');
    expect(message).toHaveTextContent('업로드 중');
    rerender(<Loader type="bar" label="처리 중" />);
    expect(message).toHaveTextContent('처리 중');
    expect(container.querySelector('p')).toHaveAttribute('aria-hidden', 'true');
  });

  it('aria-label을 나중에 라벨과 다르게 바꾸면 p의 aria-hidden이 풀린다', () => {
    const { container, rerender } = render(<Loader label="저장 중" />);
    expect(container.querySelector('p')).toHaveAttribute('aria-hidden', 'true');
    rerender(<Loader label="저장 중" aria-label="파일 저장" />);
    expect(container.querySelector('p')).not.toHaveAttribute('aria-hidden');
  });
});

describe('모든 Loader type의 결과 전환', () => {
  const types = [
    'orbit',
    'spinner',
    'dots',
    'bar',
    'wave',
    'inchworm',
  ] as const;
  type Host = HTMLElement & { __loaderStatusTimeline?: gsap.core.Timeline };
  const hostOf = (container: HTMLElement) =>
    container.querySelector<Host>('[data-orbit], [data-loader-graphic]')!;
  const finish = (container: HTMLElement) =>
    hostOf(container).__loaderStatusTimeline?.progress(1);

  it.each(types)(
    '%s: 결과 이름과 표식, loading 복귀를 함께 갱신한다',
    (type) => {
      const { container, rerender } = render(<Loader type={type} />);
      const graphic = hostOf(container);
      for (const status of ['done', 'error'] as const) {
        rerender(<Loader type={type} status={status} />);
        expect(screen.getByRole('status')).toHaveAccessibleName(
          status === 'done' ? '완료' : '실패'
        );
        expect(
          screen.getByRole('status').querySelector('[data-loader-message]')
        ).toHaveTextContent(status === 'done' ? '완료' : '실패');
        expect(hostOf(container)).toBe(graphic);
        expect(graphic).toHaveAttribute('data-loader-mark', status);
        expect(graphic.__loaderStatusTimeline).toBeDefined();
        finish(container);
        expect(graphic).toHaveAttribute('data-paused');
        if (type !== 'orbit') {
          const path =
            graphic.querySelector<SVGPathElement>('[data-mark-path]')!;
          expect(Number(path.style.strokeDashoffset)).toBe(0);
          expect(Number(path.parentElement?.style.opacity)).toBe(1);
        }
        rerender(<Loader type={type} status="loading" />);
        expect(graphic).not.toHaveAttribute('data-loader-mark');
        finish(container);
        expect(graphic).not.toHaveAttribute('data-paused');
        expect(screen.getByRole('status')).toHaveAccessibleName('로딩 중');
      }
    }
  );

  it.each(types)('%s: 결과로 마운트하면 전환 없이 최종 상태다', (type) => {
    const { container } = render(<Loader type={type} status="error" />);
    expect(hostOf(container).__loaderStatusTimeline).toBeUndefined();
    expect(hostOf(container)).toHaveAttribute('data-loader-mark', 'error');
    if (type !== 'orbit') {
      expect(
        container.querySelector<SVGPathElement>('[data-mark-path]')?.style
          .strokeDashoffset
      ).toBe('0');
    }
  });

  it.each(types.filter((type) => type !== 'orbit'))(
    '%s: 전환 중 교체와 언마운트가 이전 타임라인을 정리한다',
    (type) => {
      const { container, rerender, unmount } = render(<Loader type={type} />);
      rerender(<Loader type={type} status="done" />);
      const first = hostOf(container).__loaderStatusTimeline!;
      first.progress(0.4);
      rerender(<Loader type={type} status="error" />);
      expect(first.parent).toBeNull();
      const next = hostOf(container).__loaderStatusTimeline!;
      expect(next).not.toBe(first);
      unmount();
      expect(next.parent).toBeNull();
    }
  );

  it('완료 색과 실패 색은 모든 그래픽에서 같은 토큰을 쓴다', () => {
    const state = block(LOADER_CSS, 'statusGraphic');
    expect(state).toContain('themeContract.color.success.dark');
    expect(state).toContain('themeContract.color.error.main');
    expect(contrastOnWhite(themeTokens.color.success.dark)).toBeGreaterThan(3);
    expect(contrastOnWhite(themeTokens.color.error.main)).toBeGreaterThan(3);
  });

  it('fuse type과 value는 공개 타입에서 제거됐다', () => {
    const elements = [
      // @ts-expect-error 삭제한 type은 받지 않는다
      <Loader key="fuse" type="fuse" value={20} />,
      // @ts-expect-error 진행률 API는 제거했다
      <Loader key="value" type="bar" value={20} />,
      <Loader key="spinner" type="spinner" status="done" />,
    ];
    expect(elements).toHaveLength(3);
    const source = readFileSync(resolve(__dirname, './Loader.tsx'), 'utf-8');
    expect(source).not.toMatch(/FuseLoaderProps|status\?: never|type: 'fuse'/);
    expect(LOADER_CSS).not.toMatch(/fuseFill|fuseFlicker|fuseSpark/);
  });
});

describe('자벌레는 캡슐 하나로 기어간다', () => {
  it('성공하면 같은 몸을 실제로 꺾어 체크로 만든다', () => {
    const { container, rerender } = render(<Loader type="inchworm" />);
    const body = container.querySelector('[data-worm-body]');
    expect(body).not.toBeNull();
    rerender(<Loader type="inchworm" status="done" />);
    const host = container.querySelector(
      '[data-loader-graphic]'
    ) as HTMLElement & { __loaderStatusTimeline?: gsap.core.Timeline };
    host.__loaderStatusTimeline?.progress(1);
    expect(container.querySelector('[data-worm-body]')).toBe(body);
    expect(body).toHaveAttribute('d', 'M15 16 L40 28 L85 4');
  });

  it('몸통은 트랙을 채우는 막대 대신 둥글고 두꺼운 캡슐이다', () => {
    const { container } = render(<Loader type="inchworm" />);
    expect(container.querySelector('[data-bar-clip]')).toBeNull();
    expect(container.querySelectorAll('[data-inchworm-fill]')).toHaveLength(1);
    expect(block(LOADER_CSS, 'inchwormFill')).toContain(
      "borderRadius: '999px'"
    );
    expect(block(LOADER_CSS, 'inchwormFill')).not.toContain('clipPath');
  });

  it('다섯 걸음이 이동, 수축, 굽힘을 transform으로 만들고 구간 이징 변수는 없다', () => {
    const frames = inchwormFrames();
    expect(Object.keys(frames).length).toBeGreaterThan(10);
    expect(
      Object.values(frames).some((frame) =>
        frame.transform.includes('scaleX(0.55)')
      )
    ).toBe(true);
    expect(
      Object.values(frames).every((frame) =>
        Object.keys(frame).every((key) =>
          ['transform', 'transformOrigin'].includes(key)
        )
      )
    ).toBe(true);
    expect(frames['100%'].transform).toContain('translateX(400%)');
  });
});
