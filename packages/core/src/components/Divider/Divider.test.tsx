import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Divider } from './Divider';
import { themeContract } from '../../tokens/theme.css';

const DIVIDER_CSS = readFileSync(
  resolve(__dirname, './Divider.css.ts'),
  'utf-8'
);
const DIVIDER_TSX = readFileSync(resolve(__dirname, './Divider.tsx'), 'utf-8');

/** 주석 줄을 뺀 소스. 근거 주석 속 낱말이 금지어 검사에 걸리지 않게 한다. */
function code(source: string): string {
  return source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
}

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

    describe('글자의 접근 이름 (separator는 자식에서 이름을 계산하지 않는다)', () => {
      it('글자가 문자열이면 separator의 접근 이름이 그 글자다', () => {
        render(<Divider>또는</Divider>);

        expect(screen.getByRole('separator', { name: '또는' })).toHaveAttribute(
          'aria-label',
          '또는'
        );
      });

      it.each(['left', 'center', 'right'] as const)(
        'textAlign=%s, 세로여도 접근 이름이 그 글자다',
        (textAlign) => {
          render(
            <Divider orientation="vertical" textAlign={textAlign}>
              또는
            </Divider>
          );

          expect(
            screen.getByRole('separator', { name: '또는' })
          ).toBeInTheDocument();
        }
      );

      it('글자가 없으면 aria-label이 없다 (지금 그대로)', () => {
        render(<Divider />);

        const separator = screen.getByRole('separator');
        expect(separator).not.toHaveAttribute('aria-label');
        expect(separator).not.toHaveAccessibleName();
      });

      it('글자가 문자열이 아니면(요소) aria-label을 만들지 않는다', () => {
        render(
          <Divider>
            <span>또는</span>
          </Divider>
        );

        expect(screen.getByRole('separator')).not.toHaveAttribute('aria-label');
      });

      it('소비자가 aria-label을 직접 주면 그것을 따른다', () => {
        render(<Divider aria-label="구간 나눔">또는</Divider>);

        expect(
          screen.getByRole('separator', { name: '구간 나눔' })
        ).toBeInTheDocument();
      });

      it('빈 문자열은 글자가 없는 것과 같다', () => {
        render(<Divider>{''}</Divider>);

        expect(screen.getByRole('separator')).not.toHaveAttribute('aria-label');
      });

      describe('이름과 글자가 두 번 읽히지 않는다', () => {
        it('이름을 글자에서 만들었으면 안쪽 글자는 보조 기술에서 숨긴다', () => {
          render(<Divider>또는</Divider>);

          expect(screen.getByText('또는')).toHaveAttribute(
            'aria-hidden',
            'true'
          );
        });

        it.each(['left', 'center', 'right'] as const)(
          'textAlign=%s, 세로여도 안쪽 글자를 숨긴다',
          (textAlign) => {
            render(
              <Divider orientation="vertical" textAlign={textAlign}>
                또는
              </Divider>
            );

            expect(screen.getByText('또는')).toHaveAttribute(
              'aria-hidden',
              'true'
            );
          }
        );

        it('소비자가 aria-label을 직접 주면 안쪽 글자는 그대로 둔다', () => {
          render(<Divider aria-label="구간 나눔">또는</Divider>);

          expect(screen.getByText('또는')).not.toHaveAttribute('aria-hidden');
        });

        it('요소 children이면 이름을 만들지 않으므로 안쪽 글자를 숨기지 않는다', () => {
          render(
            <Divider>
              <span>또는</span>
            </Divider>
          );

          expect(screen.getByText('또는').parentElement).not.toHaveAttribute(
            'aria-hidden'
          );
        });

        it('aria-label을 빈 문자열로 주면 소비자 값으로 취급해 이름은 비고 안쪽 글자는 그대로 둔다', () => {
          render(<Divider aria-label="">또는</Divider>);

          expect(screen.getByRole('separator')).toHaveAttribute(
            'aria-label',
            ''
          );
          expect(screen.getByText('또는')).not.toHaveAttribute('aria-hidden');
        });

        it('aria-label을 undefined로 넘기면 주지 않은 것과 같아 글자가 이름이 되고 숨는다', () => {
          render(<Divider aria-label={undefined}>또는</Divider>);

          expect(
            screen.getByRole('separator', { name: '또는' })
          ).toBeInTheDocument();
          expect(screen.getByText('또는')).toHaveAttribute(
            'aria-hidden',
            'true'
          );
        });
      });

      describe('숫자 children', () => {
        it('숫자도 문자열처럼 접근 이름이 되고 안쪽 글자는 숨는다', () => {
          render(<Divider>{3}</Divider>);

          expect(screen.getByRole('separator', { name: '3' })).toHaveAttribute(
            'aria-label',
            '3'
          );
          expect(screen.getByText('3')).toHaveAttribute('aria-hidden', 'true');
        });

        it('0은 렌더되지 않으므로 이름도 만들지 않는다', () => {
          render(<Divider>{0}</Divider>);

          expect(screen.getByRole('separator')).not.toHaveAttribute(
            'aria-label'
          );
        });
      });
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

  describe('텍스트 변형의 선 (구조)', () => {
    it('textAlign이 left일 때 뒷선 하나만 렌더링된다', () => {
      const { container } = render(<Divider textAlign="left">왼쪽</Divider>);

      const parts = container.querySelectorAll('[role="separator"] > div');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toHaveTextContent('왼쪽');
    });

    it('textAlign이 right일 때 앞선 하나만 렌더링된다', () => {
      const { container } = render(<Divider textAlign="right">오른쪽</Divider>);

      const parts = container.querySelectorAll('[role="separator"] > div');
      expect(parts).toHaveLength(2);
      expect(parts[1]).toHaveTextContent('오른쪽');
    });

    it('앞선과 뒷선은 같은 선 클래스다. 그어지는 모션이 없어 방향 구분이 필요 없다', () => {
      const { container } = render(<Divider>중앙</Divider>);

      const parts = container.querySelectorAll('[role="separator"] > div');
      expect(parts[0].className).toBe(parts[2].className);
      expect(parts[0].className).not.toMatch(/lineBefore|lineAfter/);
    });
  });

  describe('루트 하나', () => {
    const BASE = [
      /^Divider_divider__/,
      /orientationStyles_(horizontal|vertical)__/,
      /variantStyles_solid__/,
      /spacingStyles_md__/,
    ];

    for (const orientation of ['horizontal', 'vertical'] as const) {
      it(`${orientation}: 글자 유무와 상관없이 같은 루트 클래스에 role과 aria-orientation을 갖는다`, () => {
        const plain = render(<Divider orientation={orientation} />);
        const plainRoot = plain.getByRole('separator');
        const plainClasses = plainRoot.className.split(' ');
        plain.unmount();

        const withText = render(
          <Divider orientation={orientation}>글자</Divider>
        );
        const textRoot = withText.getByRole('separator');
        const textClasses = textRoot.className.split(' ');

        for (const root of [plainRoot, textRoot]) {
          expect(root).toHaveAttribute('aria-orientation', orientation);
        }
        for (const pattern of BASE) {
          expect(plainClasses.some((c) => pattern.test(c))).toBe(true);
        }
        // 글자가 있으면 정렬과 텍스트 변형 클래스 둘만 더해진다.
        expect(textClasses.filter((c) => !plainClasses.includes(c))).toEqual([
          expect.stringMatching(/textAlignStyles_center__/),
          expect.stringMatching(/dividerWithText__/),
        ]);
        expect(plainClasses.every((c) => textClasses.includes(c))).toBe(true);
      });
    }

    it('소스에 루트가 하나이고 className 재선언이 없다', () => {
      expect(code(DIVIDER_TSX).match(/role="separator"/g)).toHaveLength(1);
      expect(code(DIVIDER_TSX)).not.toMatch(/className\?:/);
    });
  });

  describe('모션 없음', () => {
    it('Divider CSS에 keyframes·animation·transform·transition이 없다', () => {
      expect(code(DIVIDER_CSS)).not.toMatch(
        /keyframes|animation|transform|transition/
      );
    });
  });

  describe('생성 CSS (CSSOM)', () => {
    function dividerRules(): CSSStyleRule[] {
      const sheets = Array.from(document.styleSheets).filter((sheet) =>
        Array.from(sheet.cssRules).some((rule) =>
          rule.cssText.includes('Divider_')
        )
      );
      if (sheets.length === 0) throw new Error('Divider 스타일시트가 없다');
      return sheets
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
    }

    /** 요소의 클래스 하나가 만든 규칙(단일 클래스 선택자)을 모은다. */
    function rulesOf(element: Element): CSSStyleRule[] {
      const classes = element.className.split(' ');
      return dividerRules().filter((rule) =>
        classes.some((c) => rule.selectorText === `.${c}`)
      );
    }

    function ruleNamed(element: Element, pattern: RegExp): CSSStyleRule {
      const rule = rulesOf(element).find((r) => pattern.test(r.selectorText));
      if (!rule) throw new Error(`${pattern} 규칙을 찾지 못했다`);
      return rule;
    }

    it('모든 Divider 규칙이 animation·transform을 쓰지 않는다 (루트와 선 포함)', () => {
      const { container } = render(
        <>
          <Divider />
          <Divider orientation="vertical" />
          <Divider>글자</Divider>
          <Divider orientation="vertical">글자</Divider>
        </>
      );

      const elements = Array.from(container.querySelectorAll('div'));
      expect(elements.length).toBeGreaterThan(8);
      for (const element of elements) {
        const rules = rulesOf(element);
        expect(rules.length).toBeGreaterThan(0);
        for (const rule of rules) {
          expect(rule.cssText).not.toMatch(/animation|transform/);
        }
      }
      expect(
        dividerRules()
          .map((r) => r.cssText)
          .join('')
      ).not.toMatch(/animation|transform/);
    });

    it('세로는 min-height 없이 줄 높이를 채우도록 align-self: stretch다', () => {
      const { getByRole } = render(<Divider orientation="vertical" />);
      const rule = ruleNamed(
        getByRole('separator'),
        /orientationStyles_vertical/
      );

      expect(rule.style.getPropertyValue('min-height')).toBe('');
      expect(rule.style.getPropertyValue('align-self')).toBe('stretch');
      // height가 정해져 있으면(100% 포함) stretch가 먹지 않는다.
      expect(rule.style.getPropertyValue('height')).toBe('');
    });

    it('가로는 spacing이 위아래 여백, 세로는 좌우 여백이다', () => {
      const horizontal = render(<Divider spacing="lg" />);
      const hRoot = horizontal.getByRole('separator');
      const gap = ruleNamed(hRoot, /spacingStyles_lg/);
      const gapName = Array.from(gap.style).find((n) => n.startsWith('--'));
      expect(gapName).toBeDefined();
      expect(gap.style.getPropertyValue(gapName!)).toBe(
        themeContract.spacing[6]
      );
      const hMargin = ruleNamed(hRoot, /orientationStyles_horizontal/).style
        .margin;
      expect(hMargin).toBe(`var(${gapName}) 0`);
      horizontal.unmount();

      const vertical = render(<Divider orientation="vertical" spacing="lg" />);
      const vMargin = ruleNamed(
        vertical.getByRole('separator'),
        /orientationStyles_vertical/
      ).style.margin;
      expect(vMargin).toBe(`0 var(${gapName})`);
    });

    it('세로 + 글자: 선이 남은 길이를 나눠 갖는다 (flex: 1)', () => {
      const { container } = render(
        <Divider orientation="vertical">글자</Divider>
      );

      const parts = container.querySelectorAll('[role="separator"] > div');
      const lineRule = rulesOf(parts[0]).find((r) =>
        r.style.getPropertyValue('border-left')
      );
      expect(lineRule, '세로 선의 border-left 규칙').toBeDefined();
      expect(lineRule!.style.getPropertyValue('flex')).toBe('1');
    });

    it('가로 + 글자: 선이 남은 길이를 나눠 갖는다 (보존)', () => {
      const { container } = render(<Divider>글자</Divider>);

      const parts = container.querySelectorAll('[role="separator"] > div');
      const lineRule = rulesOf(parts[0]).find((r) =>
        r.style.getPropertyValue('border-top')
      );
      expect(lineRule!.style.getPropertyValue('flex')).toBe('1');
    });
  });
});
