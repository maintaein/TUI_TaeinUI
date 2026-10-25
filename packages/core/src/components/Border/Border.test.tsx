import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Border } from './Border';
import { themeContract } from '../../tokens/theme.css';
import { loop } from '../../tokens/animation.css';

const BORDER_CSS = readFileSync(resolve(__dirname, './Border.css.ts'), 'utf-8');

/** `anchor` 바로 위의 연속된 주석 줄만 모은다. 파일 전체 검색은 무관한 한
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

/** `glowRing::before` 규칙 본문. 이동·will-change·그라디언트가 모두 여기 한 곳에 있다. */
function beforeBlock(): string {
  const block = BORDER_CSS.match(
    /globalStyle\(`\$\{glowRing\}::before`, \{([\s\S]*?)^\}\);/m
  )?.[1];
  expect(block, 'glowRing::before 블록을 찾지 못했다').toBeDefined();
  return block as string;
}

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

    it('sides 미지정(all)이면 기본 rounded는 md이다', () => {
      const { container } = render(<Border>콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/roundedStyles_md/);
    });

    it('부분 sides이면 기본 rounded는 none이다', () => {
      const { container } = render(<Border sides="bottom">콘텐츠</Border>);
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/roundedStyles_none/);
      expect(border.className).not.toMatch(/roundedStyles_md/);
    });

    it('부분 sides에서도 명시한 rounded가 이긴다', () => {
      const { container } = render(
        <Border sides="bottom" rounded="lg">
          콘텐츠
        </Border>
      );
      const border = container.firstChild as HTMLElement;

      expect(border.className).toMatch(/roundedStyles_lg/);
      expect(border.className).not.toMatch(/roundedStyles_none/);
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
    it('sides가 all일 때만 장식용 glowRing span이 들어간다', () => {
      const { container } = render(
        <Border sides="all" glow>
          콘텐츠
        </Border>
      );
      const ring = container.querySelector('span[aria-hidden="true"]');

      expect(ring).not.toBeNull();
      expect(ring?.className).toMatch(/glowRing/);
    });

    it.each([
      'top',
      'right',
      'bottom',
      'left',
      'horizontal',
      'vertical',
    ] as const)('sides가 %s면 glowRing span이 없다', (sides) => {
      const { container } = render(
        <Border sides={sides} glow>
          콘텐츠
        </Border>
      );

      expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
    });

    it('glow 기본값은 false라서 장식용 span이 렌더되지 않는다', () => {
      const { container } = render(<Border>콘텐츠</Border>);

      expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
    });

    it('glow={false}를 명시해도 span이 없다', () => {
      const { container } = render(<Border glow={false}>콘텐츠</Border>);

      expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
    });
  });

  describe('빛 루프 소스 검증', () => {
    it('will-change가 ::before 규칙 하나에만 선언된다', () => {
      // 링이 있는 Border에서만 렌더되므로 이 규칙이 곧 켜진 Border다.
      // 다른 곳에 상주 will-change를 되살리면 안 쓰는 Border에도 합성 레이어가 남는다.
      expect([...BORDER_CSS.matchAll(/willChange/g)]).toHaveLength(1);
      expect(beforeBlock()).toContain("willChange: 'offset-distance'");
    });

    it('offset-path + linear-gradient + mask 숏핸드로 빛을 구현한다', () => {
      expect(beforeBlock()).toContain('offsetPath:');
      expect(beforeBlock()).toContain("offsetRotate: 'auto'");
      expect(BORDER_CSS).not.toContain('conic-gradient');
      expect(BORDER_CSS).not.toContain('rotate(360deg)');
      expect(BORDER_CSS).not.toContain("inset: '-100%'");
      // <geometry-box>(content-box)는 mask 숏핸드에만 올 수 있다. 롱핸드
      // maskImage에 넣으면 선언이 통째로 버려져(계산값 none) 마스크가 아예
      // 안 걸린다. 빛이 링이 아니라 박스 전체를 덮는다(리뷰 C1).
      expect(BORDER_CSS).not.toContain('maskImage');
      expect(BORDER_CSS).toContain(
        "mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)'"
      );
      expect(BORDER_CSS).toContain('WebkitMask:');
      // 표준 exclude에 대응하는 레거시 WebKit 값은 xor다. 접두사만 붙이면
      // 없는 값이라 무시되고 마스크가 꽉 찬 사각형이 된다.
      expect(BORDER_CSS).toContain("maskComposite: 'exclude'");
      expect(BORDER_CSS).toContain("WebkitMaskComposite: 'xor'");
      // 실제 @property 규칙(예: `@property --angle`) 사용 여부만 본다.
      // 이 판정 자체를 설명하는 주석 문구 속 "@property" 언급은 걸리지
      // 않아야 한다.
      expect(BORDER_CSS).not.toMatch(/@property\s+--/);
    });

    it('회전 링이 아니라 그 자식 그라디언트만 돈다 (리뷰 C2)', () => {
      // 마스크는 요소 좌표계에 정의된다. 링 요소 자체를 돌리면 사각 링이
      // 같이 돌아 모서리가 박스 밖으로 튀어나가고 링의 변이 children을
      // 가로지른다. 링은 고정하고 ::before만 돌린다.
      const ringBlock = BORDER_CSS.match(
        /export const glowRing = style\(\{([\s\S]*?)^\}\);/m
      )?.[1];
      expect(ringBlock, 'glowRing 블록을 찾지 못했다').toBeDefined();
      expect(ringBlock).not.toContain('animation:');
      // 링 밖으로 새지 않게 가두는 것이 가독성 보증의 전부다.
      expect(ringBlock).toContain("overflow: 'hidden'");

      const hits = [...BORDER_CSS.matchAll(/\$\{travel\}/g)];
      expect(hits).toHaveLength(1);
      expect(beforeBlock()).toContain('${travel}');
    });

    it('빛은 늘 돈다: 호버·포커스 트리거도 호버 게이트도 링의 숨김(opacity)도 없다', () => {
      // glow를 켠 Border는 마우스와 무관하게 로더로 돈다. 트리거 규칙이나
      // opacity 0이 되살아나면 켜 놓고도 안 보이는 Border가 생긴다.
      const code = BORDER_CSS.split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n');
      expect(code).not.toContain(':hover');
      expect(code).not.toContain(':focus-within');
      expect(code).not.toContain('hover: hover');
      expect(code).not.toContain('opacity');
    });

    it('머리가 앞서고 뒤로 투명해지는 고정 길이 꼬리가 달린다', () => {
      expect(beforeBlock()).toContain(
        'linear-gradient(to right, transparent, ${glowColor})'
      );
      expect(beforeBlock()).toContain('width: themeContract.spacing[12]');
    });

    it('빛 색이 color prop을 따라간다. default만 강조색을 유지한다', () => {
      const block = BORDER_CSS.match(
        /export const colorStyles = styleVariants\(\{([\s\S]*?)^\}\);/m
      )?.[1];
      expect(block, 'colorStyles 블록을 찾지 못했다').toBeDefined();

      // default는 회색 테두리라 회색 빛이 안 보인다. 판정대로 강조색을
      // 유지한다(나머지 넷만 자기 색을 따라간다).
      const expected: Record<string, string> = {
        default: 'themeContract.color.primary.main',
        primary: 'themeContract.color.primary.main',
        success: 'themeContract.color.success.main',
        error: 'themeContract.color.error.main',
        warning: 'themeContract.color.warning.main',
      };
      for (const [name, token] of Object.entries(expected)) {
        const head = (block as string).indexOf(`\n  ${name}: {`);
        expect(head, `colorStyles.${name} 블록을 찾지 못했다`).toBeGreaterThan(
          -1
        );
        const variant = (block as string).slice(
          head,
          (block as string).indexOf('\n  },', head)
        );
        expect(variant).toContain(`vars: { [glowColor]: ${token} }`);
      }

      expect(BORDER_CSS).toMatch(/linear-gradient\([^)]*\$\{glowColor\}/);
    });

    it('한 바퀴는 loop.base의 두 배이며 drift는 키프레임이 아닌 animation 숏핸드에 있다', () => {
      expect(beforeBlock()).toContain(
        'calc(${themeContract.animation.loop.base} * 2)'
      );
      expect(BORDER_CSS).not.toContain('animation.loop.slow');
      expect(beforeBlock()).toMatch(
        /animation:\s*`[^`]*\$\{themeContract\.animation\.easing\.drift\}[^`]*`/
      );
      const frames = BORDER_CSS.match(
        /const travel = keyframes\(\{([\s\S]*?)^\}\);/m
      )?.[1];
      expect(frames).toBeDefined();
      expect(frames).not.toContain('animationTimingFunction');
      for (const distance of ['0%', '50%', '100%']) {
        expect(BORDER_CSS).toContain(`offsetDistance: '${distance}'`);
      }
    });

    it('자율 루프라 조항 1 밖이라는 근거가 그 keyframes 정의 바로 위에 있다', () => {
      // 파일 전체 toMatch는 "조항 1" 네 글자가 파일 어디에 있기만 하면
      // 초록이다. 근거가 딴 데로 옮겨가거나 무관한 문장에 섞여도 모른다.
      // 근거를 키프레임 정의에서 떼면 실패해야 한다.
      expect(
        commentBlockAbove(BORDER_CSS, 'const travel = keyframes({')
      ).toMatch(/조항 1/);
    });

    it('이 파일에 keyframes 정의가 하나뿐이다', () => {
      const count = (BORDER_CSS.match(/= keyframes\(/g) ?? []).length;
      expect(count).toBe(1);
    });
  });

  describe('빛 루프 생성 CSS (CSSOM)', () => {
    function borderRules(): CSSStyleRule[] {
      const sheet = Array.from(document.styleSheets).find((candidate) =>
        Array.from(candidate.cssRules).some((rule) =>
          rule.cssText.includes('Border_')
        )
      );
      if (!sheet) throw new Error('Border.css.ts의 스타일시트를 찾지 못했다');
      return Array.from(sheet.cssRules).filter(
        (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
      );
    }

    it('glow의 ::before 규칙 하나에 둘레 경로와 무한 이동 애니메이션이 걸린다', () => {
      const { container } = render(<Border glow>콘텐츠</Border>);
      const ring = container.querySelector('span[aria-hidden="true"]')!;
      const looping = borderRules().filter((rule) =>
        rule.style.getPropertyValue('animation').includes('travel')
      );
      expect(looping).toHaveLength(1);
      expect(looping[0].selectorText).toMatch(/glowRing__\w+::before$/);
      expect(
        ring.matches(looping[0].selectorText.replace('::before', ''))
      ).toBe(true);
      expect(looping[0].style.getPropertyValue('offset-path')).not.toBe('');
      expect(looping[0].style.getPropertyValue('offset-distance')).toBe('0%');
      const animation = looping[0].style.getPropertyValue('animation');
      expect(animation).toContain(themeContract.animation.loop.base);
      expect(animation).toContain('* 2');
      expect(animation).toContain('infinite');
      expect(animation).not.toMatch(/\b(forwards|both)\b/);
    });

    it('호버·포커스 규칙이 없고 링은 숨겨져 있지 않다', () => {
      for (const rule of borderRules()) {
        expect(rule.selectorText).not.toContain(':hover');
        expect(rule.selectorText).not.toContain(':focus-within');
      }
      const ring = borderRules().find((rule) =>
        /glowRing__\w+$/.test(rule.selectorText)
      );
      expect(ring).toBeDefined();
      expect(ring!.style.getPropertyValue('opacity')).not.toBe('0');
    });

    it('loop.base 토큰 값 1500ms는 그대로다', () => {
      expect(loop.base).toBe('1500ms');
    });
  });
});
