import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Glyph, GLYPH_PATHS, type GlyphName } from './glyph';

const NAMES = Object.keys(GLYPH_PATHS) as GlyphName[];

describe('Glyph', () => {
  describe('기본 렌더링', () => {
    it('svg 요소로 렌더링되어야 한다', () => {
      const { container } = render(<Glyph name="close" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('aria-hidden이 기본값으로 true여야 한다', () => {
      const { container } = render(<Glyph name="close" />);
      expect(container.querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });
  });

  describe('글리프 데이터', () => {
    it('글리프가 정확히 8종이다 (chevron-up은 소비처가 없어 옮기지 않았다)', () => {
      expect([...NAMES].sort()).toEqual([
        'alert-circle',
        'alert-triangle',
        'check-circle',
        'chevron-down',
        'close',
        'info',
        'minus',
        'plus',
      ]);
    });

    it.each([
      ['close', 'M18 6L6 18M6 6l12 12'],
      ['plus', 'M12 5v14m-7-7h14'],
      ['minus', 'M5 12h14'],
      ['chevron-down', 'M6 9l6 6 6-6'],
      ['check-circle', 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3'],
      [
        'alert-circle',
        'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 8v4M12 16h.01',
      ],
      [
        'alert-triangle',
        'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
      ],
      ['info', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 16v-4M12 8h.01'],
    ] as const)('%s 글리프는 data-icon과 path d가 맞다', (name, d) => {
      const { container } = render(<Glyph name={name} />);
      expect(container.querySelector('svg')).toHaveAttribute('data-icon', name);
      expect(container.querySelector('path')).toHaveAttribute('d', d);
    });

    it.each(NAMES)('%s 글리프에 path 요소가 있어야 한다', (name) => {
      const { container } = render(<Glyph name={name} />);
      expect(container.querySelector('path')).toBeInTheDocument();
    });
  });

  describe('크기 변형', () => {
    it.each([
      ['sm', '16'],
      ['md', '20'],
      ['lg', '24'],
      ['xl', '32'],
    ] as const)('%s 크기를 적용해야 한다', (size, px) => {
      const { container } = render(<Glyph name="close" size={size} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', px);
      expect(svg).toHaveAttribute('height', px);
    });

    it('size를 생략하면 md(20)다', () => {
      const { container } = render(<Glyph name="close" />);
      expect(container.querySelector('svg')).toHaveAttribute('width', '20');
    });
  });

  describe('접근성', () => {
    it('aria-label이 제공되면 role이 img여야 한다', () => {
      render(<Glyph name="close" aria-label="닫기" />);
      const glyph = screen.getByRole('img');
      expect(glyph).toHaveAttribute('aria-label', '닫기');
    });

    it('aria-label이 제공되면 aria-hidden이 제거되어야 한다', () => {
      render(<Glyph name="close" aria-label="닫기" />);
      expect(screen.getByRole('img')).not.toHaveAttribute('aria-hidden');
    });

    it('aria-label이 없으면 role이 없고 aria-hidden이 true여야 한다', () => {
      const { container } = render(<Glyph name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).not.toHaveAttribute('role');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('SVG 속성', () => {
    it('viewBox, fill, xmlns가 있어야 한다', () => {
      const { container } = render(<Glyph name="close" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('fill', 'currentColor');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('path는 선으로 그려진다 (stroke currentColor, fill none, 둥근 끝)', () => {
      const { container } = render(<Glyph name="close" />);
      const path = container.querySelector('path');
      expect(path).toHaveAttribute('stroke', 'currentColor');
      expect(path).toHaveAttribute('stroke-width', '2');
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
      expect(path).toHaveAttribute('fill', 'none');
    });

    it('draw 애니메이션 장치(pathLength)가 없다 (가15 B)', () => {
      const { container } = render(<Glyph name="close" />);
      const path = container.querySelector('path');
      expect(path).not.toHaveAttribute('pathLength');
    });
  });
});
