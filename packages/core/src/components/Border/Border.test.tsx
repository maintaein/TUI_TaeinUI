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

/** `glowLoop` 선언 블록(`const glowLoop = {` ~ 닫는 `};`)의 범위. */
function glowLoopRange(): [number, number] {
  const start = BORDER_CSS.indexOf('const glowLoop = {');
  expect(start, 'const glowLoop 선언을 찾지 못했다').toBeGreaterThan(-1);
  const end = BORDER_CSS.indexOf('};', start);
  expect(end, 'glowLoop의 닫는 };를 찾지 못했다').toBeGreaterThan(start);
  return [start, end];
}

/** 인덱스가 `glowLoop` 블록 안에 든다. "선언이 앞에 있기만 하면" 통과하는
 * lastIndexOf 판정은 glowLoop 뒤에 willChange를 단 별도 globalStyle을 두는
 * 상주 회귀를 못 잡는다. 위치 자체를 범위로 잠근다. */
function expectInsideGlowLoop(index: number) {
  const [start, end] = glowLoopRange();
  expect(index).toBeGreaterThan(start);
  expect(index).toBeLessThan(end);
}

/** 루프(animation·will-change)는 한 번 선언한 `glowLoop`를 :hover와
 * :focus-within 트리거 규칙 둘에만 펼친다. :hover는 포인터 게이트 때문에
 * 규칙이 갈라져서 선언이 두 번 쓰이면 tierA 소비처 수(6)가 7이 된다. */
function expectGlowLoopOnlyInTriggers() {
  const spreads = [...BORDER_CSS.matchAll(/\.\.\.glowLoop/g)];
  expect(spreads).toHaveLength(2);

  const triggers = spreads.map((spread) => {
    const ruleStart = BORDER_CSS.lastIndexOf('globalStyle(', spread.index);
    expect(ruleStart).toBeGreaterThan(-1);
    const selector = BORDER_CSS.slice(ruleStart, spread.index);
    expect(selector).toContain('::before');
    return selector.includes(':hover') ? ':hover' : ':focus-within';
  });
  expect(triggers.sort()).toEqual([':focus-within', ':hover']);
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

    it('sides가 all이 아니면 glowRing span이 없다', () => {
      const { container } = render(
        <Border sides="top" glow>
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
    it('will-change가 :hover·:focus-within 트리거 규칙 안에서만 선언된다', () => {
      // 링은 이제 항상 존재한다(예전엔 ::before가 :hover 선택자 안에서만
      // 정의돼 비활성 시 통째로 사라졌다). 상주 will-change를 되살리면
      // 비활성 Border마다 합성 레이어가 남으므로, 선언이 트리거 규칙
      // 하나뿐인 것을 개수로 잠근다.
      const hits = [...BORDER_CSS.matchAll(/willChange/g)];
      expect(hits).toHaveLength(1);

      expectInsideGlowLoop(hits[0].index);
      expectGlowLoopOnlyInTriggers();
    });

    it('conic-gradient + rotate + mask 숏핸드로 빛을 구현한다 (@property 없이)', () => {
      expect(BORDER_CSS).toContain('conic-gradient');
      expect(BORDER_CSS).toContain('rotate(360deg)');
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

      const beforeBlock = BORDER_CSS.match(
        /globalStyle\(`\$\{glowRing\}::before`, \{([\s\S]*?)^\}\);/m
      )?.[1];
      expect(beforeBlock, 'glowRing::before 블록을 찾지 못했다').toBeDefined();
      // 회전은 여기가 아니라 트리거 규칙에 있다. 아래 it이 그것을 잠근다.
      expect(beforeBlock).not.toContain('${rotate}');
    });

    it('루프가 :hover·:focus-within 트리거 규칙 안에서만 돈다', () => {
      // 링은 항상 존재하고 sides 기본값이 all이므로, 회전이 기본 ::before
      // 규칙에 있으면 페이지의 모든 Border가 안 보이는 채로 영원히 틱한다.
      // will-change와 같은 규칙 안에 있는 것을 선언 개수로 잠근다.
      const hits = [...BORDER_CSS.matchAll(/\$\{rotate\}/g)];
      expect(hits).toHaveLength(1);

      expectInsideGlowLoop(hits[0].index);
      expectGlowLoopOnlyInTriggers();
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

      // conic-gradient가 그 var를 읽어야 색이 실제로 바뀐다.
      expect(BORDER_CSS).toMatch(/conic-gradient\([^)]*\$\{glowColor\}/);
    });

    it('루프 주기·커브가 loop.slow·easing.linear 토큰이다', () => {
      expect(BORDER_CSS).toContain('${themeContract.animation.loop.slow}');
      expect(BORDER_CSS).toContain('${themeContract.animation.easing.linear}');
    });

    it('자율 루프라 조항 1 밖이라는 근거가 그 keyframes 정의 바로 위에 있다', () => {
      // 파일 전체 toMatch는 "조항 1" 네 글자가 파일 어디에 있기만 하면
      // 초록이다. 근거가 딴 데로 옮겨가거나 무관한 문장에 섞여도 모른다.
      // 무엇을 뒤집으면 빨개지는가: 근거 주석을 const rotate = keyframes({ 정의 위에서 떼면.
      expect(
        commentBlockAbove(BORDER_CSS, 'const rotate = keyframes({')
      ).toMatch(/조항 1/);
    });

    it('이 파일에 keyframes 정의가 하나뿐이다', () => {
      const count = (BORDER_CSS.match(/= keyframes\(/g) ?? []).length;
      expect(count).toBe(1);
    });
  });

  describe('빛 루프 생성 CSS (CSSOM)', () => {
    const HOVER_GATE = '(hover: hover) and (pointer: fine)';

    /** 최상위 스타일 규칙과 @media 안의 스타일 규칙을 게이트와 함께 평탄화한다. */
    function flatRules(sheet: CSSStyleSheet) {
      const out: { rule: CSSStyleRule; media: string | null }[] = [];
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSStyleRule) {
          out.push({ rule, media: null });
        } else if (rule instanceof CSSMediaRule) {
          for (const inner of Array.from(rule.cssRules)) {
            if (inner instanceof CSSStyleRule) {
              out.push({ rule: inner, media: rule.conditionText });
            }
          }
        }
      }
      return out;
    }

    function borderRules() {
      const sheet = Array.from(document.styleSheets).find((candidate) =>
        Array.from(candidate.cssRules).some((rule) =>
          rule.cssText.includes('Border_')
        )
      );
      if (!sheet) throw new Error('Border.css.ts의 스타일시트를 찾지 못했다');
      return flatRules(sheet);
    }

    it('호버 규칙(opacity·애니메이션)은 (hover: hover) and (pointer: fine) 안에 있다', () => {
      const hover = borderRules().filter(({ rule }) =>
        rule.selectorText.includes(':hover')
      );

      // opacity 트리거 + ::before 애니메이션 부착, 둘이다.
      expect(hover).toHaveLength(2);
      for (const { media } of hover) {
        expect(media).toBe(HOVER_GATE);
      }
    });

    it(':focus-within 규칙은 포인터 게이트 밖에 있다', () => {
      const focus = borderRules().filter(({ rule }) =>
        rule.selectorText.includes(':focus-within')
      );

      expect(focus).toHaveLength(2);
      for (const { media } of focus) {
        expect(media).toBeNull();
      }
    });

    it('rotate 애니메이션 길이가 loop.slow다 (loop.base가 아니다)', () => {
      const looping = borderRules().filter(({ rule }) =>
        rule.style.getPropertyValue('animation').includes('rotate')
      );

      // 트리거마다 하나(:hover, :focus-within).
      expect(looping).toHaveLength(2);
      for (const { rule } of looping) {
        const animation = rule.style.getPropertyValue('animation');
        expect(animation).toContain(themeContract.animation.loop.slow);
        expect(animation).not.toContain(themeContract.animation.loop.base);
        expect(animation).toContain('infinite');
        expect(animation).not.toMatch(/\b(forwards|both)\b/);
      }
    });

    it('loop.slow는 6000ms다 (StarBorder speed 6s, loop.base의 4배)', () => {
      expect(loop.slow).toBe('6000ms');
      expect(parseInt(loop.slow) / parseInt(loop.base)).toBe(4);
    });
  });
});
