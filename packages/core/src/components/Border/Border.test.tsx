import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Border } from './Border';

const BORDER_CSS = readFileSync(resolve(__dirname, './Border.css.ts'), 'utf-8');

describe('Border', () => {
  describe('렌더링 테스트', () => {
    it('기본 Border가 렌더링된다', () => {
      render(<Border>콘텐츠</Border>);

      expect(screen.getByText('콘텐츠')).toBeInTheDocument();
    });

    it('children이 렌더링된다', () => {
      render(
        <Border>
          <div data-testid="child">자식 요소</div>
        </Border>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('sides prop 테스트', () => {
    it('sides가 all일 때 모든 테두리가 적용된다', () => {
      const { container } = render(<Border sides="all">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/sidesStyles_all/);
    });

    it('sides가 top일 때 상단 테두리만 적용된다', () => {
      const { container } = render(<Border sides="top">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/sidesStyles_top/);
    });

    it('sides가 right일 때 우측 테두리만 적용된다', () => {
      const { container } = render(<Border sides="right">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/sidesStyles_right/);
    });

    it('sides가 bottom일 때 하단 테두리만 적용된다', () => {
      const { container } = render(<Border sides="bottom">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/sidesStyles_bottom/);
    });

    it('sides가 left일 때 좌측 테두리만 적용된다', () => {
      const { container } = render(<Border sides="left">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/sidesStyles_left/);
    });

    it('sides가 horizontal일 때 상하 테두리가 적용된다', () => {
      const { container } = render(<Border sides="horizontal">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/sidesStyles_horizontal/);
    });

    it('sides가 vertical일 때 좌우 테두리가 적용된다', () => {
      const { container } = render(<Border sides="vertical">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/sidesStyles_vertical/);
    });

    it('기본 sides는 all이다', () => {
      const { container } = render(<Border>콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/sidesStyles_all/);
    });
  });

  describe('variant prop 테스트', () => {
    it('variant가 solid일 때 실선 스타일이 적용된다', () => {
      const { container } = render(<Border variant="solid">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/variantStyles_solid/);
    });

    it('variant가 dashed일 때 대시선 스타일이 적용된다', () => {
      const { container } = render(<Border variant="dashed">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/variantStyles_dashed/);
    });

    it('variant가 dotted일 때 점선 스타일이 적용된다', () => {
      const { container } = render(<Border variant="dotted">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/variantStyles_dotted/);
    });

    it('기본 variant는 solid이다', () => {
      const { container } = render(<Border>콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/variantStyles_solid/);
    });
  });

  describe('width prop 테스트', () => {
    it('width가 thin일 때 얇은 테두리가 적용된다', () => {
      const { container } = render(<Border width="thin">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/widthStyles_thin/);
    });

    it('width가 medium일 때 중간 테두리가 적용된다', () => {
      const { container } = render(<Border width="medium">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/widthStyles_medium/);
    });

    it('width가 thick일 때 두꺼운 테두리가 적용된다', () => {
      const { container } = render(<Border width="thick">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/widthStyles_thick/);
    });

    it('기본 width는 thin이다', () => {
      const { container } = render(<Border>콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/widthStyles_thin/);
    });
  });

  describe('color prop 테스트', () => {
    it('color가 default일 때 기본 색상이 적용된다', () => {
      const { container } = render(<Border color="default">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/colorStyles_default/);
    });

    it('color가 primary일 때 primary 색상이 적용된다', () => {
      const { container } = render(<Border color="primary">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/colorStyles_primary/);
    });

    it('color가 success일 때 success 색상이 적용된다', () => {
      const { container } = render(<Border color="success">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/colorStyles_success/);
    });

    it('color가 error일 때 error 색상이 적용된다', () => {
      const { container } = render(<Border color="error">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/colorStyles_error/);
    });

    it('color가 warning일 때 warning 색상이 적용된다', () => {
      const { container } = render(<Border color="warning">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/colorStyles_warning/);
    });

    it('기본 color는 default이다', () => {
      const { container } = render(<Border>콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/colorStyles_default/);
    });
  });

  describe('rounded prop 테스트', () => {
    it('rounded가 none일 때 둥근 모서리가 없다', () => {
      const { container } = render(<Border rounded="none">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/roundedStyles_none/);
    });

    it('rounded가 sm일 때 작은 둥근 모서리가 적용된다', () => {
      const { container } = render(<Border rounded="sm">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/roundedStyles_sm/);
    });

    it('rounded가 md일 때 중간 둥근 모서리가 적용된다', () => {
      const { container } = render(<Border rounded="md">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/roundedStyles_md/);
    });

    it('rounded가 lg일 때 큰 둥근 모서리가 적용된다', () => {
      const { container } = render(<Border rounded="lg">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/roundedStyles_lg/);
    });

    it('rounded가 full일 때 완전히 둥근 모서리가 적용된다', () => {
      const { container } = render(<Border rounded="full">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/roundedStyles_full/);
    });

    it('기본 rounded는 none이다', () => {
      const { container } = render(<Border>콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/roundedStyles_none/);
    });
  });

  describe('padding prop 테스트', () => {
    it('padding이 none일 때 패딩이 없다', () => {
      const { container } = render(<Border padding="none">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/paddingStyles_none/);
    });

    it('padding이 sm일 때 작은 패딩이 적용된다', () => {
      const { container } = render(<Border padding="sm">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/paddingStyles_sm/);
    });

    it('padding이 md일 때 중간 패딩이 적용된다', () => {
      const { container } = render(<Border padding="md">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/paddingStyles_md/);
    });

    it('padding이 lg일 때 큰 패딩이 적용된다', () => {
      const { container } = render(<Border padding="lg">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/paddingStyles_lg/);
    });

    it('기본 padding은 none이다', () => {
      const { container } = render(<Border>콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/paddingStyles_none/);
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      const { container } = render(
        <Border className="custom-border">콘텐츠</Border>
      );
      const border = container.firstChild as HTMLElement;

      expect(border).toHaveClass('custom-border');
    });
  });

  describe('HTML 속성 전달 테스트', () => {
    it('div 요소의 HTML 속성이 전달된다', () => {
      render(<Border data-testid="test-border">콘텐츠</Border>);

      expect(screen.getByTestId('test-border')).toBeInTheDocument();
    });
  });

  describe('빛 루프 (장식계)', () => {
    it('sides가 all일 때만 borderGlow 클래스가 붙는다', () => {
      const { container } = render(<Border sides="all">콘텐츠</Border>);
      const el = container.firstChild as HTMLElement;

      expect(el.className).toMatch(/borderGlow/);
    });

    it('sides가 all이 아니면 borderGlow 클래스가 붙지 않는다', () => {
      const { container } = render(<Border sides="top">콘텐츠</Border>);
      const el = container.firstChild as HTMLElement;

      expect(el.className).not.toMatch(/borderGlow/);
    });
  });

  describe('빛 루프 소스 검증', () => {
    it('will-change가 :hover·:focus-within 선택자 블록 안에서만 선언된다', () => {
      const globalStyleIndex = BORDER_CSS.indexOf('globalStyle(');
      expect(globalStyleIndex).toBeGreaterThan(-1);
      const block = BORDER_CSS.slice(globalStyleIndex);

      expect(block).toContain(':hover::before');
      expect(block).toContain(':focus-within::before');
      expect(block).toContain('willChange');

      // globalStyle 앞부분(border 기본 블록 등)에는 willChange가 없다 —
      // 비활성 시 "제거"되는 게 아니라 규칙이 안 걸리면 애초에 존재하지
      // 않는다.
      const baseBlock = BORDER_CSS.slice(0, globalStyleIndex);
      expect(baseBlock).not.toContain('willChange');
    });

    it('conic-gradient + rotate + mask로 빛을 구현한다 (@property 없이)', () => {
      expect(BORDER_CSS).toContain('conic-gradient');
      expect(BORDER_CSS).toContain('rotate(360deg)');
      expect(BORDER_CSS).toContain('maskImage');
      // 실제 @property 규칙(예: `@property --angle`) 사용 여부만 본다 —
      // 이 판정 자체를 설명하는 주석 문구 속 "@property" 언급은 걸리지
      // 않아야 한다.
      expect(BORDER_CSS).not.toMatch(/@property\s+--/);
    });

    it('루프 주기·커브가 loop.base·easing.linear 토큰이다', () => {
      expect(BORDER_CSS).toContain('${themeContract.animation.loop.base}');
      expect(BORDER_CSS).toContain('${themeContract.animation.easing.linear}');
    });

    it('자율 루프라 조항 1 밖이라는 근거가 주석으로 남아 있다', () => {
      expect(BORDER_CSS).toMatch(/조항 1/);
    });

    it('이 파일에 keyframes 정의가 하나뿐이다', () => {
      const count = (BORDER_CSS.match(/= keyframes\(/g) ?? []).length;
      expect(count).toBe(1);
    });
  });
});
