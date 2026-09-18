import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderBar } from './HeaderBar';

describe('HeaderBar', () => {
  describe('렌더링 테스트', () => {
    it('기본 HeaderBar가 렌더링된다', () => {
      render(
        <HeaderBar>
          <div>Header Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('logo를 렌더링한다', () => {
      render(
        <HeaderBar logo={<img src="/logo.png" alt="Logo" />}>
          <div>Content</div>
        </HeaderBar>
      );

      expect(screen.getByAltText('Logo')).toBeInTheDocument();
    });

    it('title을 렌더링한다', () => {
      render(
        <HeaderBar title="My Application">
          <div>Content</div>
        </HeaderBar>
      );

      expect(screen.getByText('My Application')).toBeInTheDocument();
    });

    it('logo와 title을 함께 렌더링한다', () => {
      render(
        <HeaderBar logo={<img src="/logo.png" alt="Logo" />} title="App Title">
          <div>Content</div>
        </HeaderBar>
      );

      expect(screen.getByAltText('Logo')).toBeInTheDocument();
      expect(screen.getByText('App Title')).toBeInTheDocument();
    });

    it('actions 영역을 렌더링한다', () => {
      render(
        <HeaderBar actions={<button type="button">Login</button>}>
          <div>Content</div>
        </HeaderBar>
      );

      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });

    it('children을 렌더링한다', () => {
      render(
        <HeaderBar>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
          </nav>
        </HeaderBar>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });

  describe('sticky prop 테스트', () => {
    it('sticky가 false일 때 stickyStyles_false 클래스가 적용된다', () => {
      render(
        <HeaderBar sticky={false}>
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header.className).toMatch(/stickyStyles_false/);
    });

    it('sticky가 true일 때 stickyStyles_true 클래스가 적용된다', () => {
      render(
        <HeaderBar sticky>
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header.className).toMatch(/stickyStyles_true/);
    });
  });

  describe('variant prop 테스트', () => {
    it('variant가 default일 때 기본 스타일이 적용된다', () => {
      render(
        <HeaderBar variant="default">
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass(/default/);
    });

    it('variant가 dark일 때 dark 스타일이 적용된다', () => {
      render(
        <HeaderBar variant="dark">
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass(/dark/);
    });

    it('variant가 transparent일 때 transparent 스타일이 적용된다', () => {
      render(
        <HeaderBar variant="transparent">
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass(/transparent/);
    });
  });

  describe('elevation prop 테스트', () => {
    it('elevation이 false일 때 elevationStyles_false 클래스가 적용된다', () => {
      render(
        <HeaderBar elevation={false}>
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header.className).toMatch(/elevationStyles_false/);
    });

    it('elevation이 true일 때 elevationStyles_true 클래스가 적용된다', () => {
      render(
        <HeaderBar elevation>
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header.className).toMatch(/elevationStyles_true/);
    });
  });

  describe('border prop 테스트', () => {
    it('border가 false일 때 borderStyles_false 클래스가 적용된다', () => {
      render(
        <HeaderBar border={false}>
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header.className).toMatch(/borderStyles_false/);
    });

    it('border가 true일 때 borderStyles_true 클래스가 적용된다', () => {
      render(
        <HeaderBar border>
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header.className).toMatch(/borderStyles_true/);
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      render(
        <HeaderBar className="custom-header">
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('접근성 테스트', () => {
    it('role="banner"를 가진다', () => {
      render(
        <HeaderBar>
          <div>Content</div>
        </HeaderBar>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('aria-label을 설정할 수 있다', () => {
      render(
        <HeaderBar aria-label="Main navigation header">
          <div>Content</div>
        </HeaderBar>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveAttribute('aria-label', 'Main navigation header');
    });
  });

  describe('레이아웃 구조 테스트', () => {
    it('logo, title, children, actions가 올바른 순서로 렌더링된다', () => {
      const { container } = render(
        <HeaderBar
          logo={<img src="/logo.png" alt="Logo" />}
          title="Title"
          actions={<button type="button">Action</button>}
        >
          <nav>Navigation</nav>
        </HeaderBar>
      );

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();

      // 좌측 영역 (logo + title)
      const leftSection = header?.querySelector('[class*="left"]');
      expect(leftSection).toBeInTheDocument();

      // 중앙 영역 (children)
      const centerSection = header?.querySelector('[class*="center"]');
      expect(centerSection).toBeInTheDocument();

      // 우측 영역 (actions)
      const rightSection = header?.querySelector('[class*="right"]');
      expect(rightSection).toBeInTheDocument();
    });
  });

  describe('좁은 화면 넘침 방지 테스트', () => {
    it('title이 넘치지 않고 한 줄로 말줄임된다', () => {
      // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
      // 읽는다. HeaderBar.css.ts 소스 텍스트에서 직접 확인한다.
      const cssSource = readFileSync(
        resolve(__dirname, './HeaderBar.css.ts'),
        'utf-8'
      );
      const titleBlock = cssSource.match(
        /export const title = style\(\{([\s\S]*?)\n\}\);/
      )?.[1];
      expect(titleBlock).toContain("overflow: 'hidden'");
      expect(titleBlock).toContain("textOverflow: 'ellipsis'");
      expect(titleBlock).toContain("whiteSpace: 'nowrap'");
      expect(titleBlock).toContain('minWidth: 0');
    });

    it('leftSection이 줄어들 수 있어 title이 헤더를 밀어내지 않는다', () => {
      const cssSource = readFileSync(
        resolve(__dirname, './HeaderBar.css.ts'),
        'utf-8'
      );
      const leftSectionBlock = cssSource.match(
        /export const leftSection = style\(\{([\s\S]*?)\}\);/
      )?.[1];
      expect(leftSectionBlock).toContain('flexShrink: 1');
      expect(leftSectionBlock).toContain('minWidth: 0');
    });

    it('centerSection이 minWidth: 0으로 flex 기본 넘침을 막는다', () => {
      const cssSource = readFileSync(
        resolve(__dirname, './HeaderBar.css.ts'),
        'utf-8'
      );
      const centerSectionBlock = cssSource.match(
        /export const centerSection = style\(\{([\s\S]*?)\n\}\);/
      )?.[1];
      expect(centerSectionBlock).toContain('minWidth: 0');
    });
  });

  describe('HTML 속성 전달 테스트', () => {
    it('data-* 속성이 전달된다', () => {
      render(
        <HeaderBar data-testid="custom-header">
          <div>Content</div>
        </HeaderBar>
      );

      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });
  });
});
