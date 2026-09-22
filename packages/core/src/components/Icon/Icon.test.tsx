import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

const ICON_CSS = readFileSync(resolve(__dirname, './Icon.css.ts'), 'utf-8');

/** `anchor` 바로 위의 연속된 주석 줄만 모은다 — 파일 전체 검색은 무관한 한
 * 줄로도 초록이 되기 때문이다(리뷰 F4, animationBoundary.test.ts와 같은 관례). */
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

describe('Icon', () => {
  describe('기본 렌더링', () => {
    it('아이콘이 올바르게 렌더링되어야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('aria-hidden이 기본값으로 true여야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('svg 요소로 렌더링되어야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('아이콘 타입', () => {
    it('close 아이콘을 렌더링해야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-icon', 'close');
    });

    it('plus 아이콘을 렌더링해야 한다', () => {
      const { container } = render(<Icon name="plus" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('data-icon', 'plus');
    });

    it('minus 아이콘을 렌더링해야 한다', () => {
      const { container } = render(<Icon name="minus" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('data-icon', 'minus');
    });

    it('chevron-down 아이콘을 렌더링해야 한다', () => {
      const { container } = render(<Icon name="chevron-down" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('data-icon', 'chevron-down');
    });

    it('chevron-up 아이콘을 렌더링해야 한다', () => {
      const { container } = render(<Icon name="chevron-up" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('data-icon', 'chevron-up');
    });
  });

  describe('크기 변형', () => {
    it('sm 크기를 적용해야 한다', () => {
      const { container } = render(<Icon name="close" size="sm" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });

    it('md 크기를 적용해야 한다 (기본값)', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
    });

    it('lg 크기를 적용해야 한다', () => {
      const { container } = render(<Icon name="close" size="lg" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    it('xl 크기를 적용해야 한다', () => {
      const { container } = render(<Icon name="close" size="xl" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });
  });

  describe('색상', () => {
    it('기본 색상은 currentColor여야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('style', 'color: currentcolor;');
    });

    it('커스텀 색상을 적용해야 한다', () => {
      const { container } = render(<Icon name="close" color="#FF0000" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveStyle({ color: '#FF0000' });
    });

    it('CSS 변수 색상을 적용해야 한다', () => {
      const { container } = render(
        <Icon name="close" color="var(--primary-600)" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveStyle({ color: 'var(--primary-600)' });
    });
  });

  describe('접근성', () => {
    it('aria-label이 제공되면 role이 img여야 한다', () => {
      render(<Icon name="close" aria-label="닫기" />);
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-label', '닫기');
    });

    it('aria-label이 제공되면 aria-hidden이 제거되어야 한다', () => {
      render(<Icon name="close" aria-label="닫기" />);
      const icon = screen.getByRole('img');
      expect(icon).not.toHaveAttribute('aria-hidden');
    });

    it('aria-label이 없으면 aria-hidden이 true여야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('title이 제공되면 접근 가능해야 한다', () => {
      const { container } = render(<Icon name="close" title="닫기 아이콘" />);
      const title = container.querySelector('title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('닫기 아이콘');
    });
  });

  describe('추가 속성', () => {
    it('className을 추가해야 한다', () => {
      const { container } = render(
        <Icon name="close" className="custom-icon" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-icon');
    });

    it('data 속성을 추가해야 한다', () => {
      const { container } = render(
        <Icon name="close" data-testid="test-icon" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('data-testid', 'test-icon');
    });

    it('추가 props를 전달해야 한다', () => {
      const { container } = render(<Icon name="close" id="icon-1" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('id', 'icon-1');
    });
  });

  describe('SVG 속성', () => {
    it('viewBox 속성이 있어야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox');
    });

    it('fill이 currentColor여야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });

    it('xmlns 속성이 있어야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 아이콘 이름에 대해 경고해야 한다', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // @ts-expect-error - 의도적으로 유효하지 않은 아이콘 이름 테스트
      render(<Icon name="invalid-icon" />);

      if (process.env.NODE_ENV === 'development') {
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });
  });

  describe('아이콘 경로 검증', () => {
    it('close 아이콘에 path 요소가 있어야 한다', () => {
      const { container } = render(<Icon name="close" />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('plus 아이콘에 path 요소가 있어야 한다', () => {
      const { container } = render(<Icon name="plus" />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('minus 아이콘에 path 요소가 있어야 한다', () => {
      const { container } = render(<Icon name="minus" />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('chevron-down 아이콘에 path 요소가 있어야 한다', () => {
      const { container } = render(<Icon name="chevron-down" />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('chevron-up 아이콘에 path 요소가 있어야 한다', () => {
      const { container } = render(<Icon name="chevron-up" />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });
  });

  describe('등장 획 (장식계) — DOM', () => {
    it('path에 pathLength="1"이 정규화되어 있다', () => {
      const { container } = render(<Icon name="close" />);
      const path = container.querySelector('path');
      expect(path).toHaveAttribute('pathLength', '1');
    });

    it('path에 iconPath 클래스가 적용된다', () => {
      const { container } = render(<Icon name="close" />);
      const path = container.querySelector('path');
      expect(path?.getAttribute('class')).toMatch(/iconPath/);
    });

    it('name이 바뀌면 key로 인해 path 노드가 다시 마운트된다', () => {
      const { container, rerender } = render(<Icon name="close" />);
      const before = container.querySelector('path');

      rerender(<Icon name="plus" />);
      const after = container.querySelector('path');

      expect(after).not.toBe(before);
    });

    it('name이 그대로면 path 노드가 유지된다', () => {
      const { container, rerender } = render(<Icon name="close" />);
      const before = container.querySelector('path');

      rerender(<Icon name="close" color="#FF0000" />);
      const after = container.querySelector('path');

      expect(after).toBe(before);
    });
  });

  describe('등장 획 소스 검증', () => {
    it('stroke-dashoffset/-dasharray로 그린다 (공통 제약 §4의 유일한 SVG 예외)', () => {
      expect(ICON_CSS).toContain('strokeDasharray');
      expect(ICON_CSS).toContain('strokeDashoffset');
    });

    it('축소 모드: base가 strokeDashoffset 0이고 키프레임 0%만 1이다', () => {
      const keyframesBlock = ICON_CSS.slice(
        ICON_CSS.indexOf('const draw = keyframes({'),
        ICON_CSS.indexOf('});', ICON_CSS.indexOf('const draw = keyframes({'))
      );
      expect(keyframesBlock).toContain("'0%': { strokeDashoffset: 1 }");
      expect(keyframesBlock).not.toContain('100%');

      const iconPathBlock = ICON_CSS.slice(
        ICON_CSS.indexOf('export const iconPath')
      );
      expect(iconPathBlock).toContain('strokeDashoffset: 0');
    });

    it('이 파일에 keyframes 정의가 하나뿐이다', () => {
      const count = (ICON_CSS.match(/= keyframes\(/g) ?? []).length;
      expect(count).toBe(1);
    });

    it('duration.slow·easing.settle 토큰을 쓴다', () => {
      expect(ICON_CSS).toContain('${themeContract.animation.duration.slow}');
      expect(ICON_CSS).toContain('${themeContract.animation.easing.settle}');
    });

    it('마운트 1회라 조항 1 밖이라는 근거가 그 keyframes 정의 바로 위에 있다', () => {
      // 파일 전체 toMatch는 "조항 1" 네 글자가 파일 어디에 있기만 하면
      // 초록이다 — 근거가 딴 데로 옮겨가거나 무관한 문장에 섞여도 모른다.
      // 무엇을 뒤집으면 빨개지는가: 근거 주석을 const draw = keyframes({ 정의 위에서 떼면.
      expect(commentBlockAbove(ICON_CSS, 'const draw = keyframes({')).toMatch(
        /조항 1/
      );
    });
  });
});
