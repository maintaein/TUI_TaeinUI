import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Divider } from './Divider';

const DIVIDER_CSS = readFileSync(
  resolve(__dirname, './Divider.css.ts'),
  'utf-8'
);

describe('Divider', () => {
  describe('렌더링 테스트', () => {
    it('기본 Divider가 렌더링된다', () => {
      render(<Divider />);

      const divider = screen.getByRole('separator');
      expect(divider).toBeInTheDocument();
    });

    it('children이 있을 때 텍스트가 렌더링된다', () => {
      render(<Divider>구분선</Divider>);

      expect(screen.getByText('구분선')).toBeInTheDocument();
    });

    it('children이 ReactNode일 때 렌더링된다', () => {
      render(
        <Divider>
          <span data-testid="custom-content">커스텀 콘텐츠</span>
        </Divider>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });

  describe('orientation prop 테스트', () => {
    it('orientation이 horizontal일 때 수평 스타일이 적용된다', () => {
      render(<Divider orientation="horizontal" />);

      const divider = screen.getByRole('separator');
      expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
      expect(divider.className).toMatch(/orientationStyles_horizontal/);
    });

    it('orientation이 vertical일 때 수직 스타일이 적용된다', () => {
      render(<Divider orientation="vertical" />);

      const divider = screen.getByRole('separator');
      expect(divider).toHaveAttribute('aria-orientation', 'vertical');
      expect(divider.className).toMatch(/orientationStyles_vertical/);
    });

    it('기본 orientation은 horizontal이다', () => {
      render(<Divider />);

      const divider = screen.getByRole('separator');
      expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
    });
  });

  describe('variant prop 테스트', () => {
    it('variant가 solid일 때 실선 스타일이 적용된다', () => {
      render(<Divider variant="solid" />);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/variantStyles_solid/);
    });

    it('variant가 dashed일 때 대시 스타일이 적용된다', () => {
      render(<Divider variant="dashed" />);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/variantStyles_dashed/);
    });

    it('variant가 dotted일 때 점선 스타일이 적용된다', () => {
      render(<Divider variant="dotted" />);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/variantStyles_dotted/);
    });

    it('기본 variant는 solid이다', () => {
      render(<Divider />);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/variantStyles_solid/);
    });
  });

  describe('spacing prop 테스트', () => {
    it('spacing이 sm일 때 작은 간격이 적용된다', () => {
      render(<Divider spacing="sm" />);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/spacingStyles_sm/);
    });

    it('spacing이 md일 때 중간 간격이 적용된다', () => {
      render(<Divider spacing="md" />);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/spacingStyles_md/);
    });

    it('spacing이 lg일 때 큰 간격이 적용된다', () => {
      render(<Divider spacing="lg" />);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/spacingStyles_lg/);
    });

    it('기본 spacing은 md이다', () => {
      render(<Divider />);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/spacingStyles_md/);
    });
  });

  describe('textAlign prop 테스트', () => {
    it('textAlign이 left일 때 텍스트가 왼쪽 정렬된다', () => {
      render(<Divider textAlign="left">왼쪽</Divider>);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/textAlignStyles_left/);
    });

    it('textAlign이 center일 때 텍스트가 중앙 정렬된다', () => {
      render(<Divider textAlign="center">중앙</Divider>);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/textAlignStyles_center/);
    });

    it('textAlign이 right일 때 텍스트가 오른쪽 정렬된다', () => {
      render(<Divider textAlign="right">오른쪽</Divider>);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/textAlignStyles_right/);
    });

    it('기본 textAlign은 center이다', () => {
      render(<Divider>텍스트</Divider>);

      const divider = screen.getByRole('separator');
      expect(divider.className).toMatch(/textAlignStyles_center/);
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      render(<Divider className="custom-divider" />);

      const divider = screen.getByRole('separator');
      expect(divider).toHaveClass('custom-divider');
    });
  });

  describe('접근성 테스트', () => {
    it('role="separator"가 적용된다', () => {
      render(<Divider />);

      const divider = screen.getByRole('separator');
      expect(divider).toBeInTheDocument();
    });

    it('aria-orientation이 올바르게 설정된다', () => {
      const { rerender } = render(<Divider orientation="horizontal" />);
      expect(screen.getByRole('separator')).toHaveAttribute(
        'aria-orientation',
        'horizontal'
      );

      rerender(<Divider orientation="vertical" />);
      expect(screen.getByRole('separator')).toHaveAttribute(
        'aria-orientation',
        'vertical'
      );
    });
  });

  describe('레이아웃 구조 테스트', () => {
    it('children이 있을 때 3개의 섹션이 렌더링된다', () => {
      const { container } = render(<Divider>텍스트</Divider>);

      const divider = container.querySelector('[role="separator"]');
      const childDivs = divider?.querySelectorAll('div');

      expect(childDivs?.length).toBe(3);
    });

    it('children이 없을 때 단순 선만 렌더링된다', () => {
      const { container } = render(<Divider />);

      const divider = container.querySelector('[role="separator"]');
      const childDivs = divider?.querySelectorAll('div');

      expect(childDivs?.length).toBe(0);
    });
  });

  describe('HTML 속성 전달 테스트', () => {
    it('div 요소의 HTML 속성이 전달된다', () => {
      render(<Divider data-testid="test-divider" />);

      const divider = screen.getByTestId('test-divider');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('등장 애니메이션 (장식계) — DOM', () => {
    it('textAlign이 center일 때 앞선에는 lineBefore, 뒷선에는 lineAfter가 붙는다', () => {
      const { container } = render(<Divider textAlign="center">중앙</Divider>);

      const divider = container.querySelector('[role="separator"]');
      const lines = divider?.querySelectorAll(':scope > div');

      expect(lines?.[0].className).toMatch(/lineBefore/);
      expect(lines?.[2].className).toMatch(/lineAfter/);
    });

    it('textAlign이 left일 때 뒷선(lineAfter)만 렌더링된다', () => {
      const { container } = render(<Divider textAlign="left">왼쪽</Divider>);

      const divider = container.querySelector('[role="separator"]');
      const lines = divider?.querySelectorAll(':scope > div');

      expect(lines?.length).toBe(2);
      expect(lines?.[1].className).toMatch(/lineAfter/);
    });

    it('textAlign이 right일 때 앞선(lineBefore)만 렌더링된다', () => {
      const { container } = render(<Divider textAlign="right">오른쪽</Divider>);

      const divider = container.querySelector('[role="separator"]');
      const lines = divider?.querySelectorAll(':scope > div');

      expect(lines?.length).toBe(2);
      expect(lines?.[0].className).toMatch(/lineBefore/);
    });

    it('세로 방향 텍스트 변형은 lineVertical을 그대로 쓴다 (모션 없음, 기존 동작 유지)', () => {
      const { container } = render(
        <Divider orientation="vertical" textAlign="center">
          세로
        </Divider>
      );

      const divider = container.querySelector('[role="separator"]');
      const lines = divider?.querySelectorAll(':scope > div');

      expect(lines?.[0].className).toMatch(/lineVertical/);
      expect(lines?.[0].className).not.toMatch(/lineBefore|lineAfter/);
    });
  });

  describe('등장 애니메이션 소스 검증', () => {
    it('네 경우(가로 평선·세로 평선·텍스트 앞선·텍스트 뒷선)의 transform-origin이 표대로다', () => {
      const horizontalBlock = DIVIDER_CSS.slice(
        DIVIDER_CSS.indexOf('horizontal: {'),
        DIVIDER_CSS.indexOf('vertical: {')
      );
      const verticalBlock = DIVIDER_CSS.slice(
        DIVIDER_CSS.indexOf('vertical: {'),
        DIVIDER_CSS.indexOf('});', DIVIDER_CSS.indexOf('vertical: {'))
      );
      expect(horizontalBlock).toContain("transformOrigin: 'center'");
      expect(verticalBlock).toContain("transformOrigin: 'center'");

      const lineBeforeBlock = DIVIDER_CSS.slice(
        DIVIDER_CSS.indexOf('export const lineBefore'),
        DIVIDER_CSS.indexOf('export const lineAfter')
      );
      const lineAfterBlock = DIVIDER_CSS.slice(
        DIVIDER_CSS.indexOf('export const lineAfter'),
        DIVIDER_CSS.indexOf('export const lineVertical')
      );
      expect(lineBeforeBlock).toContain("transformOrigin: 'right'");
      expect(lineAfterBlock).toContain("transformOrigin: 'left'");
    });

    it('세로+텍스트 조합(lineVertical)에는 애니메이션이 없다 — 네 경우에서 제외된 판정', () => {
      const lineVerticalBlock = DIVIDER_CSS.slice(
        DIVIDER_CSS.indexOf('export const lineVertical'),
        DIVIDER_CSS.indexOf('export const textContent')
      );
      expect(lineVerticalBlock).not.toContain('animation:');
    });

    it('텍스트 변형 루트(dividerWithText)는 animation을 none으로 끈다 — 텍스트가 찌그러지지 않는다', () => {
      const block = DIVIDER_CSS.slice(
        DIVIDER_CSS.indexOf('export const dividerWithText'),
        DIVIDER_CSS.indexOf('export const line =')
      );
      expect(block).toContain("animation: 'none'");
    });

    it('그 끄기가 선언 순서가 아니라 특정성으로 이긴다(리뷰 F2)', () => {
      // 평범한 animation: 'none'은 orientationStyles와 같은 (0,1,0)이라 파일
      // 뒤쪽에 있다는 사실 하나로만 이긴다. 순서가 바뀌면 텍스트 변형 루트가
      // scale(0)에서 자라며 텍스트를 찌그러뜨린다 — 주석이 막으려던 바로 그
      // 결과다. '&&'는 같은 클래스를 두 번 써 (0,2,0)을 만든다.
      // 무엇을 뒤집으면 빨개지는가: animation: 'none'을 selectors 밖 최상위로
      // 되돌리면(= 다시 순서에만 기대게 되면).
      const block = DIVIDER_CSS.slice(
        DIVIDER_CSS.indexOf('export const dividerWithText'),
        DIVIDER_CSS.indexOf('export const line =')
      );
      const selectorsAt = block.indexOf('selectors: {');
      expect(
        selectorsAt,
        'dividerWithText에 selectors 블록이 없다'
      ).toBeGreaterThan(-1);
      expect(block.slice(selectorsAt)).toContain("'&&': {");
      // animation "선언"이 딱 하나이고(주석 속 언급은 줄 머리가 //라 안 잡힌다),
      // selectors 바깥에는 하나도 없다.
      expect(block.match(/^\s+animation:/gm) ?? []).toHaveLength(1);
      expect(block.slice(0, selectorsAt)).not.toMatch(/^\s+animation:/m);
    });

    it('축소 모드: base가 scale(1)이고 키프레임 0%만 scale(0)이다 (100% 키프레임 없음)', () => {
      const keyframesBlock = DIVIDER_CSS.slice(
        DIVIDER_CSS.indexOf('const grow = keyframes({'),
        DIVIDER_CSS.indexOf(
          '});',
          DIVIDER_CSS.indexOf('const grow = keyframes({')
        )
      );
      expect(keyframesBlock).toContain("'0%': { transform: 'scale(0)' }");
      expect(keyframesBlock).not.toContain('100%');
    });

    it('이 파일에 keyframes 정의가 하나뿐이다', () => {
      const count = (DIVIDER_CSS.match(/= keyframes\(/g) ?? []).length;
      expect(count).toBe(1);
    });

    it('duration.slow·easing.settle 토큰을 쓴다', () => {
      expect(DIVIDER_CSS).toContain('${themeContract.animation.duration.slow}');
      expect(DIVIDER_CSS).toContain('${themeContract.animation.easing.settle}');
    });

    it('마운트 1회라 조항 1 밖이라는 근거가 주석으로 남아 있다', () => {
      expect(DIVIDER_CSS).toMatch(/조항 1/);
    });
  });
});
