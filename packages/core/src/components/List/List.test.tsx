import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { List, ListItem } from './List';
import { themeContract } from '../../tokens/theme.css';

const LIST_TSX = readFileSync(resolve(__dirname, './List.tsx'), 'utf-8');

/** 주석(줄 주석, 블록 주석, JSDoc)을 뺀 소스. 근거 주석 속 낱말이 검사에 걸리지 않게 한다. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|\s)\/\/.*$/gm, ' ');
}

describe('List', () => {
  describe('렌더링 테스트', () => {
    it('기본 List가 렌더링된다', () => {
      render(
        <List>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      expect(screen.getByText('이름')).toBeInTheDocument();
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('여러 ListItem을 렌더링한다', () => {
      render(
        <List>
          <ListItem label="이름" value="홍길동" />
          <ListItem label="이메일" value="hong@example.com" />
          <ListItem label="전화번호" value="010-1234-5678" />
        </List>
      );
      expect(screen.getByText('이름')).toBeInTheDocument();
      expect(screen.getByText('이메일')).toBeInTheDocument();
      expect(screen.getByText('전화번호')).toBeInTheDocument();
    });

    it('ReactNode 타입의 value를 렌더링한다', () => {
      render(
        <List>
          <ListItem label="상태" value={<span>활성</span>} />
        </List>
      );
      expect(screen.getByText('상태')).toBeInTheDocument();
      expect(screen.getByText('활성')).toBeInTheDocument();
    });
  });

  describe('spacing prop 테스트', () => {
    it('spacing="none"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <List spacing="none">
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const list = container.querySelector('ul');
      expect(list).toHaveClass(/spacingStyles_none/);
    });

    it('spacing="sm"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <List spacing="sm">
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const list = container.querySelector('ul');
      expect(list).toHaveClass(/spacingStyles_sm/);
    });

    it('spacing="md"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <List spacing="md">
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const list = container.querySelector('ul');
      expect(list).toHaveClass(/spacingStyles_md/);
    });

    it('spacing="lg"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <List spacing="lg">
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const list = container.querySelector('ul');
      expect(list).toHaveClass(/spacingStyles_lg/);
    });

    it('spacing 기본값은 "md"이다', () => {
      const { container } = render(
        <List>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const list = container.querySelector('ul');
      expect(list).toHaveClass(/spacingStyles_md/);
    });
  });

  describe('divider prop 테스트', () => {
    it('divider={true}일 때 구분선 클래스가 적용된다', () => {
      const { container } = render(
        <List divider>
          <ListItem label="이름" value="홍길동" />
          <ListItem label="이메일" value="hong@example.com" />
        </List>
      );
      const list = container.querySelector('ul');
      expect(list).toHaveClass(/withDivider/);
    });

    it('divider={false}일 때 구분선 클래스가 적용되지 않는다', () => {
      const { container } = render(
        <List divider={false}>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const list = container.querySelector('ul');
      expect(list).not.toHaveClass(/withDivider/);
    });

    it('divider 기본값은 false이다', () => {
      const { container } = render(
        <List>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const list = container.querySelector('ul');
      expect(list).not.toHaveClass(/withDivider/);
    });
  });

  describe('ListItem layout prop 테스트', () => {
    it('layout="horizontal"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <List>
          <ListItem label="이름" value="홍길동" layout="horizontal" />
        </List>
      );
      const listItem = container.querySelector('li');
      expect(listItem).toHaveClass(/layoutStyles_horizontal/);
    });

    it('layout="vertical"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <List>
          <ListItem label="이름" value="홍길동" layout="vertical" />
        </List>
      );
      const listItem = container.querySelector('li');
      expect(listItem).toHaveClass(/layoutStyles_vertical/);
    });

    it('layout 기본값은 "horizontal"이다', () => {
      const { container } = render(
        <List>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const listItem = container.querySelector('li');
      expect(listItem).toHaveClass(/layoutStyles_horizontal/);
    });
  });

  describe('ListItem labelWidth prop 테스트', () => {
    it('labelWidth를 지정하면 label에 해당 width가 적용된다', () => {
      render(
        <List>
          <ListItem label="이름" value="홍길동" labelWidth="100px" />
        </List>
      );
      const label = screen.getByText('이름');
      expect(label).toHaveStyle({ width: '100px' });
    });

    it('labelWidth를 지정하지 않으면 auto이다', () => {
      render(
        <List>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const label = screen.getByText('이름');
      // width가 명시적으로 설정되지 않음
      expect(label).not.toHaveStyle({ width: '100px' });
    });
  });

  describe('className prop 테스트', () => {
    it('List에 커스텀 className을 추가할 수 있다', () => {
      const { container } = render(
        <List className="custom-list">
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const list = container.querySelector('ul');
      expect(list).toHaveClass('custom-list');
    });

    it('ListItem에 커스텀 className을 추가할 수 있다', () => {
      const { container } = render(
        <List>
          <ListItem label="이름" value="홍길동" className="custom-item" />
        </List>
      );
      const listItem = container.querySelector('li');
      expect(listItem).toHaveClass('custom-item');
    });
  });

  describe('접근성 테스트', () => {
    it('List는 <ul> 요소로 렌더링된다', () => {
      const { container } = render(
        <List>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      expect(container.querySelector('ul')).toBeInTheDocument();
    });

    it('ul에 role="list"가 명시된다 (list-style: none이면 Safari가 목록 의미를 지운다)', () => {
      render(
        <List>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const list = screen.getByRole('list');
      expect(list.tagName).toBe('UL');
      expect(list).toHaveAttribute('role', 'list');
    });

    it('소비자가 준 role이 이긴다', () => {
      const { container } = render(
        <List role="menu">
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      expect(container.querySelector('ul')).toHaveAttribute('role', 'menu');
    });

    it('ListItem은 <li> 요소로 렌더링된다', () => {
      const { container } = render(
        <List>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      expect(container.querySelector('li')).toBeInTheDocument();
    });
  });

  describe('HTML 속성 전달 테스트', () => {
    it('List에 data-* 속성을 전달할 수 있다', () => {
      const { container } = render(
        <List data-testid="custom-list">
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      expect(container.querySelector('ul')).toHaveAttribute(
        'data-testid',
        'custom-list'
      );
    });

    it('ListItem에 data-* 속성을 전달할 수 있다', () => {
      const { container } = render(
        <List>
          <ListItem label="이름" value="홍길동" data-testid="custom-item" />
        </List>
      );
      expect(container.querySelector('li')).toHaveAttribute(
        'data-testid',
        'custom-item'
      );
    });
  });

  describe('없앤 API (타입)', () => {
    it('layout="custom"과 align은 타입 오류다', () => {
      render(
        <List>
          {/* @ts-expect-error custom은 layout 값이 아니다 */}
          <ListItem label="이름" value="홍길동" layout="custom" />
          {/* @ts-expect-error align은 ListItem의 prop이 아니다 */}
          <ListItem label="이름" value="홍길동" align="start" />
        </List>
      );
    });

    it('소스에 className 재선언과 layout 단언이 없다', () => {
      expect(code(LIST_TSX)).not.toMatch(/className\?:/);
      expect(code(LIST_TSX)).not.toMatch(/layout as /);
      expect(code(LIST_TSX)).not.toMatch(/custom|align/);
    });
  });

  describe('생성 CSS (CSSOM)', () => {
    function listRules(): CSSStyleRule[] {
      const sheets = Array.from(document.styleSheets).filter((sheet) =>
        Array.from(sheet.cssRules).some((rule) =>
          rule.cssText.includes('List_')
        )
      );
      if (sheets.length === 0) throw new Error('List 스타일시트가 없다');
      return sheets
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
    }

    /** 요소의 클래스 하나가 만든 규칙(단일 클래스 선택자) 가운데 이름이 맞는 것 */
    function ruleNamed(element: Element, pattern: RegExp): CSSStyleRule {
      const classes = element.className.split(' ');
      const rule = listRules().find(
        (r) =>
          classes.some((c) => r.selectorText === `.${c}`) &&
          pattern.test(r.selectorText)
      );
      if (!rule) throw new Error(`${pattern} 규칙을 찾지 못했다`);
      return rule;
    }

    /** 요소에 걸린 모든 단일 클래스 규칙 */
    function rulesOf(element: Element): CSSStyleRule[] {
      const classes = element.className.split(' ');
      return listRules().filter((r) =>
        classes.some((c) => r.selectorText === `.${c}`)
      );
    }

    const ALIGN = { horizontal: 'center', vertical: 'flex-start' } as const;

    for (const layout of ['horizontal', 'vertical'] as const) {
      it(`label-value 항목은 ${layout}에서 align-items: ${ALIGN[layout]}이다`, () => {
        const { container } = render(
          <List>
            <ListItem label="이름" value="홍길동" layout={layout} />
          </List>
        );
        const li = container.querySelector('li')!;

        const aligned = rulesOf(li).filter(
          (r) => r.style.getPropertyValue('align-items') === ALIGN[layout]
        );
        expect(aligned).toHaveLength(1);
        // 그 밖의 정렬을 거는 규칙은 없다.
        for (const rule of rulesOf(li)) {
          expect(['', ALIGN[layout]]).toContain(
            rule.style.getPropertyValue('align-items')
          );
        }
      });
    }

    it('code()는 JSDoc과 블록 주석과 줄 주석을 모두 거른다', () => {
      const src = [
        '/** align */',
        'const a = 1; // custom',
        '/* align',
        ' * custom */',
        'b',
      ].join('\n');
      expect(code(src)).not.toMatch(/custom|align/);
      expect(code(src)).toMatch(/const a = 1;/);
    });

    it('구분선 규칙은 바로 아래 자식 li(마지막 항목 제외)만 잡는다', () => {
      const { container } = render(
        <List divider>
          <ListItem label="이름" value="홍길동" />
        </List>
      );
      const withDivider = container
        .querySelector('ul')!
        .className.split(' ')
        .find((c) => /withDivider/.test(c))!;
      const selectors = listRules()
        .map((r) => r.selectorText)
        .filter((t) => t.includes(withDivider));

      expect(selectors).toEqual([`.${withDivider} > li:not(:last-child)`]);
    });

    it('children 항목은 자유 배치다: 배치 클래스도 정렬도 걸리지 않는다', () => {
      const { container } = render(
        <List>
          <ListItem>
            <span>자유</span>
          </ListItem>
        </List>
      );
      const li = container.querySelector('li')!;

      expect(li.className).not.toMatch(
        /layoutStyles|horizontalGap|verticalGap/
      );
      expect(li.querySelector('div')).toBeNull();
      const rules = rulesOf(li);
      expect(rules.length).toBeGreaterThan(0);
      for (const rule of rules) {
        expect(rule.style.getPropertyValue('align-items')).toBe('');
        expect(rule.style.getPropertyValue('flex-direction')).toBe('');
      }
    });

    const SPACING = {
      none: '0',
      sm: themeContract.spacing[2],
      md: themeContract.spacing[4],
      lg: themeContract.spacing[6],
    } as const;

    for (const spacing of ['none', 'sm', 'md', 'lg'] as const) {
      it(`divider + spacing="${spacing}": 선 위 여백이 항목 사이 gap과 같은 값을 읽는다`, () => {
        const { container } = render(
          <List divider spacing={spacing}>
            <ListItem label="이름" value="홍길동" />
            <ListItem label="이메일" value="hong@example.com" />
          </List>
        );
        const ul = container.querySelector('ul')!;

        const sizeRule = ruleNamed(ul, new RegExp(`spacingStyles_${spacing}`));
        const name = Array.from(sizeRule.style).find((n) => n.startsWith('--'));
        expect(name).toBeDefined();
        expect(sizeRule.style.getPropertyValue(name!)).toBe(SPACING[spacing]);

        const gap = ruleNamed(ul, /List_list__/).style.getPropertyValue('gap');
        expect(gap).toBe(`var(${name})`);

        const withDivider = ul.className
          .split(' ')
          .find((c) => /withDivider/.test(c))!;
        const dividerRule = listRules().find(
          (r) =>
            r.selectorText.includes(withDivider) &&
            r.selectorText.includes('li')
        );
        expect(dividerRule, '구분선 규칙').toBeDefined();
        expect(dividerRule!.style.getPropertyValue('padding-bottom')).toBe(
          `var(${name})`
        );
        expect(dividerRule!.style.getPropertyValue('border-bottom')).not.toBe(
          ''
        );
      });
    }
  });

  describe('복합 시나리오 테스트', () => {
    it('다양한 layout 조합을 지원한다', () => {
      render(
        <List divider spacing="lg">
          <ListItem label="이름" value="홍길동" layout="horizontal" />
          <ListItem label="소개" value="안녕하세요" layout="vertical" />
          <ListItem label="점수" value="95점" layout="horizontal" />
        </List>
      );
      expect(screen.getByText('이름')).toBeInTheDocument();
      expect(screen.getByText('소개')).toBeInTheDocument();
      expect(screen.getByText('점수')).toBeInTheDocument();
    });

    it('labelWidth를 통일하여 정렬된 리스트를 만들 수 있다', () => {
      render(
        <List>
          <ListItem label="이름" value="홍길동" labelWidth="80px" />
          <ListItem label="이메일" value="hong@example.com" labelWidth="80px" />
          <ListItem label="전화번호" value="010-1234-5678" labelWidth="80px" />
        </List>
      );
      const labels = screen.getAllByText(/이름|이메일|전화번호/);
      labels.forEach((label) => {
        expect(label).toHaveStyle({ width: '80px' });
      });
    });
  });
});
