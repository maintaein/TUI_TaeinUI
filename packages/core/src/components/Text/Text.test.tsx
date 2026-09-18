import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Text } from './Text';
import { themeTokens } from '../../tokens/contract';

describe('Text', () => {
  describe('렌더링 테스트', () => {
    it('기본 텍스트를 렌더링한다', () => {
      render(<Text>안녕하세요</Text>);
      expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    });

    it('children이 없으면 아무것도 렌더링하지 않는다', () => {
      const { container } = render(<Text />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('variant 테스트', () => {
    it('h1 variant를 렌더링한다', () => {
      render(<Text variant="h1">제목 1</Text>);
      const element = screen.getByText('제목 1');
      expect(element.tagName).toBe('H1');
    });

    it('h2 variant를 렌더링한다', () => {
      render(<Text variant="h2">제목 2</Text>);
      const element = screen.getByText('제목 2');
      expect(element.tagName).toBe('H2');
    });

    it('h3 variant를 렌더링한다', () => {
      render(<Text variant="h3">제목 3</Text>);
      const element = screen.getByText('제목 3');
      expect(element.tagName).toBe('H3');
    });

    it('h4 variant를 렌더링한다', () => {
      render(<Text variant="h4">제목 4</Text>);
      const element = screen.getByText('제목 4');
      expect(element.tagName).toBe('H4');
    });

    it('h5 variant를 렌더링한다', () => {
      render(<Text variant="h5">제목 5</Text>);
      const element = screen.getByText('제목 5');
      expect(element.tagName).toBe('H5');
    });

    it('h6 variant를 렌더링한다', () => {
      render(<Text variant="h6">제목 6</Text>);
      const element = screen.getByText('제목 6');
      expect(element.tagName).toBe('H6');
    });

    it('body1 variant를 렌더링한다 (기본값)', () => {
      render(<Text>본문 텍스트</Text>);
      const element = screen.getByText('본문 텍스트');
      expect(element.tagName).toBe('P');
    });

    it('body2 variant를 렌더링한다', () => {
      render(<Text variant="body2">본문 텍스트 2</Text>);
      const element = screen.getByText('본문 텍스트 2');
      expect(element.tagName).toBe('P');
    });

    it('body3 variant를 렌더링한다', () => {
      render(<Text variant="body3">본문 텍스트 3</Text>);
      const element = screen.getByText('본문 텍스트 3');
      expect(element.tagName).toBe('P');
    });
  });

  describe('as prop 테스트', () => {
    it('as prop으로 HTML 태그를 변경할 수 있다', () => {
      render(
        <Text variant="h1" as="span">
          스팬 태그
        </Text>
      );
      const element = screen.getByText('스팬 태그');
      expect(element.tagName).toBe('SPAN');
    });

    it('as prop이 variant보다 우선한다', () => {
      render(
        <Text variant="body1" as="div">
          div 태그
        </Text>
      );
      const element = screen.getByText('div 태그');
      expect(element.tagName).toBe('DIV');
    });
  });

  describe('color prop 테스트', () => {
    it('primary color를 적용한다', () => {
      render(<Text color="primary">Primary 텍스트</Text>);
      const element = screen.getByText('Primary 텍스트');
      expect(element.className).toContain('color_primary');
    });

    it('secondary color를 적용한다', () => {
      render(<Text color="secondary">Secondary 텍스트</Text>);
      const element = screen.getByText('Secondary 텍스트');
      expect(element.className).toContain('color_secondary');
    });

    it('success color를 적용한다', () => {
      render(<Text color="success">Success 텍스트</Text>);
      const element = screen.getByText('Success 텍스트');
      expect(element.className).toContain('color_success');
    });

    it('error color를 적용한다', () => {
      render(<Text color="error">Error 텍스트</Text>);
      const element = screen.getByText('Error 텍스트');
      expect(element.className).toContain('color_error');
    });

    it('warning color를 적용한다', () => {
      render(<Text color="warning">Warning 텍스트</Text>);
      const element = screen.getByText('Warning 텍스트');
      expect(element.className).toContain('color_warning');
    });

    it('info color를 적용한다', () => {
      render(<Text color="info">Info 텍스트</Text>);
      const element = screen.getByText('Info 텍스트');
      expect(element.className).toContain('color_info');
    });
  });

  describe('tabularNums prop 테스트', () => {
    it('기본값에서는 tabular 클래스를 적용하지 않는다', () => {
      render(<Text>1,234</Text>);
      const element = screen.getByText('1,234');
      expect(element.className).not.toContain('tabularNums');
    });

    it('tabularNums가 true면 고정폭 숫자 클래스를 적용한다', () => {
      render(<Text tabularNums>1,234</Text>);
      const element = screen.getByText('1,234');
      expect(element.className).toContain('tabularNums');
    });
  });

  describe('weight prop 테스트', () => {
    it('regular weight를 적용한다', () => {
      render(<Text weight="regular">Regular 텍스트</Text>);
      const element = screen.getByText('Regular 텍스트');
      expect(element.className).toContain('weight_regular');
    });

    it('medium weight를 적용한다', () => {
      render(<Text weight="medium">Medium 텍스트</Text>);
      const element = screen.getByText('Medium 텍스트');
      expect(element.className).toContain('weight_medium');
    });

    it('semibold weight를 적용한다', () => {
      render(<Text weight="semibold">Semibold 텍스트</Text>);
      const element = screen.getByText('Semibold 텍스트');
      expect(element.className).toContain('weight_semibold');
    });

    it('bold weight를 적용한다', () => {
      render(<Text weight="bold">Bold 텍스트</Text>);
      const element = screen.getByText('Bold 텍스트');
      expect(element.className).toContain('weight_bold');
    });
  });

  describe('align prop 테스트', () => {
    it('left align을 적용한다', () => {
      render(<Text align="left">Left 정렬</Text>);
      const element = screen.getByText('Left 정렬');
      expect(element.className).toContain('align_left');
    });

    it('center align을 적용한다', () => {
      render(<Text align="center">Center 정렬</Text>);
      const element = screen.getByText('Center 정렬');
      expect(element.className).toContain('align_center');
    });

    it('right align을 적용한다', () => {
      render(<Text align="right">Right 정렬</Text>);
      const element = screen.getByText('Right 정렬');
      expect(element.className).toContain('align_right');
    });
  });

  describe('truncate prop 테스트', () => {
    it('truncate가 1이면 한 줄로 자른다', () => {
      render(<Text truncate={1}>긴 텍스트입니다</Text>);
      const element = screen.getByText('긴 텍스트입니다');
      expect(element.className).toContain('truncate');
      expect(element.style.webkitLineClamp).toBe('1');
    });

    it('truncate가 2이면 두 줄로 자른다', () => {
      render(<Text truncate={2}>긴 텍스트입니다</Text>);
      const element = screen.getByText('긴 텍스트입니다');
      expect(element.className).toContain('truncate');
      expect(element.style.webkitLineClamp).toBe('2');
    });

    it('truncate가 3이면 세 줄로 자른다', () => {
      render(<Text truncate={3}>긴 텍스트입니다</Text>);
      const element = screen.getByText('긴 텍스트입니다');
      expect(element.className).toContain('truncate');
      expect(element.style.webkitLineClamp).toBe('3');
    });
  });

  describe('접근성 테스트', () => {
    it('시맨틱 HTML을 사용한다 (h1)', () => {
      render(<Text variant="h1">접근 가능한 제목</Text>);
      const element = screen.getByRole('heading', { level: 1 });
      expect(element).toBeInTheDocument();
    });

    it('시맨틱 HTML을 사용한다 (h2)', () => {
      render(<Text variant="h2">접근 가능한 제목 2</Text>);
      const element = screen.getByRole('heading', { level: 2 });
      expect(element).toBeInTheDocument();
    });

    it('시맨틱 HTML을 사용한다 (h3)', () => {
      render(<Text variant="h3">접근 가능한 제목 3</Text>);
      const element = screen.getByRole('heading', { level: 3 });
      expect(element).toBeInTheDocument();
    });
  });

  describe('className 테스트', () => {
    it('추가 className을 적용할 수 있다', () => {
      render(<Text className="custom-class">커스텀 클래스</Text>);
      const element = screen.getByText('커스텀 클래스');
      expect(element).toHaveClass('custom-class');
    });

    it('여러 className을 함께 적용할 수 있다', () => {
      render(
        <Text className="custom-class" color="primary">
          여러 클래스
        </Text>
      );
      const element = screen.getByText('여러 클래스');
      expect(element).toHaveClass('custom-class');
      expect(element.className).toContain('color_primary');
    });
  });

  describe('타이포 스케일 테스트', () => {
    it('variant가 참조하는 토큰 키와 그 값이 헤딩 스케일과 정확히 일치한다', () => {
      // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을
      // 못 읽는다. Text.css.ts 소스 텍스트에서 variant 이름과 그 fontSize가
      // 참조하는 토큰 키를 짝지어 뽑아 기대 매핑과 대조하고(variant끼리 키가
      // 뒤바뀌는 걸 막는다), 그 키가 font.size 스케일에서 실제로 갖는 값까지
      // 픽셀로 환산해 대조한다(리터럴 rem 값이 스케일 밖으로 되돌아가는 걸
      // 막는다).
      const cssSource = readFileSync(
        resolve(__dirname, './Text.css.ts'),
        'utf-8'
      );
      const keyByVariant: Record<string, string> = {};
      for (const m of cssSource.matchAll(
        /(\w+): \{\s*fontSize: themeContract\.font\.size(\.\w+|\['[^']+'\]),/g
      )) {
        keyByVariant[m[1]] = m[2].replace(/^\.|^\['|'\]$/g, '');
      }

      expect(keyByVariant).toEqual({
        h1: '4xl',
        h2: '3xl',
        h3: '2xl',
        h4: 'xl',
        h5: 'lg',
        h6: 'base',
        body1: 'base',
        body2: 'sm',
        body3: 'xs',
      });

      const px = (rem: string) => parseFloat(rem) * 16;
      expect(px(themeTokens.font.size['4xl']), 'font.size.4xl').toBe(36);
      expect(px(themeTokens.font.size['3xl']), 'font.size.3xl').toBe(30);
      expect(px(themeTokens.font.size['2xl']), 'font.size.2xl').toBe(24);
      expect(px(themeTokens.font.size.xl), 'font.size.xl').toBe(20);
      expect(px(themeTokens.font.size.lg), 'font.size.lg').toBe(18);
      expect(px(themeTokens.font.size.base), 'font.size.base').toBe(16);
      expect(px(themeTokens.font.size.sm), 'font.size.sm').toBe(14);
      expect(px(themeTokens.font.size.xs), 'font.size.xs').toBe(12);
    });
  });
});

describe('헤딩 굵기 스케일', () => {
  it('variant가 참조하는 fontWeight가 기대 매핑과 일치한다', () => {
    // 굵기는 h1~h2(700)와 h3~h6(600)를 가르는 축이고, 헤딩 위계를 따라
    // 단조롭게 내려간다. h4를 700으로 올려 h5와 벌리는 안은 h4가 부모인
    // h3(600)보다 굵어 보여 반려됐다. 크기 잠금이 fontSize만 보므로
    // (14e1db2) 굵기도 같이 잠근다.
    const cssSource = readFileSync(
      resolve(__dirname, './Text.css.ts'),
      'utf-8'
    );
    const weightByVariant: Record<string, number> = {};
    for (const m of cssSource.matchAll(
      /(\w+): \{\s*fontSize: themeContract\.font\.size(?:\.\w+|\['[^']+'\]),[^\n]*\n\s*fontWeight: (\d+),/g
    )) {
      weightByVariant[m[1]] = Number(m[2]);
    }

    expect(weightByVariant).toEqual({
      h1: 700,
      h2: 700,
      h3: 600,
      h4: 600,
      h5: 600,
      h6: 600,
      body1: 400,
      body2: 400,
      body3: 400,
    });
  });
});
