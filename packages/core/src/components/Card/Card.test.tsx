import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './index';

describe('Card (Compound API)', () => {
  describe('렌더링 테스트', () => {
    it('Card.Body로 기본 카드가 렌더링된다', () => {
      const { container } = render(
        <Card>
          <Card.Body>기본 카드</Card.Body>
        </Card>
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('기본 카드')).toBeInTheDocument();
    });

    it('Card.Header가 렌더링된다', () => {
      render(
        <Card>
          <Card.Header>카드 헤더</Card.Header>
          <Card.Body>카드 내용</Card.Body>
        </Card>
      );

      expect(screen.getByText('카드 헤더')).toBeInTheDocument();
      expect(screen.getByText('카드 내용')).toBeInTheDocument();
    });

    it('Card.Footer가 렌더링된다', () => {
      render(
        <Card>
          <Card.Body>카드 내용</Card.Body>
          <Card.Footer>카드 푸터</Card.Footer>
        </Card>
      );

      expect(screen.getByText('카드 푸터')).toBeInTheDocument();
      expect(screen.getByText('카드 내용')).toBeInTheDocument();
    });

    it('Card.Title이 렌더링된다', () => {
      render(
        <Card>
          <Card.Header>
            <Card.Title>카드 제목</Card.Title>
          </Card.Header>
          <Card.Body>내용</Card.Body>
        </Card>
      );

      expect(screen.getByText('카드 제목')).toBeInTheDocument();
    });

    it('Card.Title의 as prop으로 heading 레벨을 변경할 수 있다', () => {
      render(
        <Card>
          <Card.Header>
            <Card.Title as="h1">H1 제목</Card.Title>
          </Card.Header>
        </Card>
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('모든 서브 컴포넌트가 함께 렌더링된다', () => {
      render(
        <Card>
          <Card.Header>
            <Card.Title>제목</Card.Title>
          </Card.Header>
          <Card.Body>내용</Card.Body>
          <Card.Footer>푸터</Card.Footer>
        </Card>
      );

      expect(screen.getByText('제목')).toBeInTheDocument();
      expect(screen.getByText('내용')).toBeInTheDocument();
      expect(screen.getByText('푸터')).toBeInTheDocument();
    });
  });

  describe('이미지 테스트', () => {
    it('Card.Image가 렌더링된다', () => {
      render(
        <Card>
          <Card.Image src="https://example.com/image.jpg" alt="테스트 이미지" />
          <Card.Body>카드 내용</Card.Body>
        </Card>
      );

      const img = screen.getByAltText('테스트 이미지');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('Card.ImageOverlay가 Card.Image 내부에 렌더링된다', () => {
      render(
        <Card>
          <Card.Image src="https://example.com/image.jpg" alt="이미지">
            <Card.ImageOverlay>NEW</Card.ImageOverlay>
          </Card.Image>
          <Card.Body>내용</Card.Body>
        </Card>
      );

      expect(screen.getByText('NEW')).toBeInTheDocument();
      expect(screen.getByAltText('이미지')).toBeInTheDocument();
    });
  });

  describe('variant prop 테스트', () => {
    it('variant="outlined"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card variant="outlined">
          <Card.Body>내용</Card.Body>
        </Card>
      );

      expect(container.firstChild).toHaveClass(/variantStyles_outlined/);
    });

    it('variant="elevated"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card variant="elevated">
          <Card.Body>내용</Card.Body>
        </Card>
      );

      expect(container.firstChild).toHaveClass(/variantStyles_elevated/);
    });

    it('variant="filled"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card variant="filled">
          <Card.Body>내용</Card.Body>
        </Card>
      );

      expect(container.firstChild).toHaveClass(/variantStyles_filled/);
    });
  });

  describe('클릭 기능 테스트', () => {
    it('onClick이 제공되면 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick}>
          <Card.Body>카드 내용</Card.Body>
        </Card>
      );

      const card = screen.getByRole('button');
      await user.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('onClick이 없으면 article로 렌더링된다', () => {
      const { container } = render(
        <Card>
          <Card.Body>카드 내용</Card.Body>
        </Card>
      );

      const card = container.firstChild as HTMLElement;
      expect(card.nodeName).toBe('ARTICLE');
    });
  });

  describe('Card.Body padding 테스트', () => {
    it('padding="lg"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card>
          <Card.Body padding="lg">내용</Card.Body>
        </Card>
      );

      const body = container.querySelector('[class*="cardBody"]');
      expect(body).toHaveClass(/paddingStyles_lg/);
    });
  });

  describe('disabled 상태 테스트', () => {
    it('disabled가 true이면 비활성화 스타일이 적용된다', () => {
      const { container } = render(
        <Card disabled onClick={() => {}}>
          <Card.Body>내용</Card.Body>
        </Card>
      );

      expect(container.firstChild).toHaveClass(/disabled/);
    });

    it('disabled일 때 클릭 이벤트가 발생하지 않는다', async () => {
      // 실제 생성 CSS가 주입돼 disabled 카드는 pointer-events: none이다. 그래도 막혀야 하니 검사는 끈다.
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick} disabled>
          <Card.Body>내용</Card.Body>
        </Card>
      );

      const card = screen.getByRole('button');
      await user.click(card);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('복합 시나리오 테스트', () => {
    it('커스텀 콘텐츠가 Header 내부에 렌더링된다 (확장성)', () => {
      render(
        <Card>
          <Card.Header>
            <Card.Title>제목</Card.Title>
            <span data-testid="custom-badge">Hot</span>
          </Card.Header>
          <Card.Body>내용</Card.Body>
        </Card>
      );

      expect(screen.getByText('제목')).toBeInTheDocument();
      expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
    });

    it('Image + Header + Body + Footer 전체 구조가 정상 동작한다', () => {
      render(
        <Card>
          <Card.Image src="/img.jpg" alt="이미지">
            <Card.ImageOverlay>NEW</Card.ImageOverlay>
          </Card.Image>
          <Card.Header>
            <Card.Title>제목</Card.Title>
          </Card.Header>
          <Card.Body>내용</Card.Body>
          <Card.Footer>푸터</Card.Footer>
        </Card>
      );

      expect(screen.getByAltText('이미지')).toBeInTheDocument();
      expect(screen.getByText('NEW')).toBeInTheDocument();
      expect(screen.getByText('제목')).toBeInTheDocument();
      expect(screen.getByText('내용')).toBeInTheDocument();
      expect(screen.getByText('푸터')).toBeInTheDocument();
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Enter 키로 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick}>
          <Card.Body>내용</Card.Body>
        </Card>
      );

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('Space 키로 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick}>
          <Card.Body>내용</Card.Body>
        </Card>
      );

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe('이미지 기준 박스 테스트', () => {
  it('cardImageWrapper가 aspectRatio 16:9 기준 박스를 가진다', () => {
    // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
    // 읽는다. Card.css.ts 소스 텍스트에서 직접 확인한다(S7 관례).
    const cssSource = readFileSync(
      resolve(__dirname, './Card.css.ts'),
      'utf-8'
    );
    const wrapperBlock = cssSource.match(
      /export const cardImageWrapper = style\(\{([\s\S]*?)\}\);/
    )?.[1];
    expect(wrapperBlock).toContain("aspectRatio: '16 / 9'");
  });

  it('cardImage가 높이를 100%로 채워 objectFit: cover가 실제로 동작한다', () => {
    const cssSource = readFileSync(
      resolve(__dirname, './Card.css.ts'),
      'utf-8'
    );
    const imageBlock = cssSource.match(
      /export const cardImage = style\(\{([\s\S]*?)\}\);/
    )?.[1];
    expect(imageBlock).toContain("height: '100%'");
  });
});

describe('Card (Flat API)', () => {
  describe('렌더링 테스트', () => {
    it('title prop으로 기본 카드가 렌더링된다', () => {
      render(<Card title="월간 리포트">리포트 내용</Card>);

      expect(screen.getByText('월간 리포트')).toBeInTheDocument();
      expect(screen.getByText('리포트 내용')).toBeInTheDocument();
    });

    it('header가 렌더링된다', () => {
      render(<Card header={<div>카드 헤더</div>}>카드 내용</Card>);

      expect(screen.getByText('카드 헤더')).toBeInTheDocument();
      expect(screen.getByText('카드 내용')).toBeInTheDocument();
    });

    it('footer가 렌더링된다', () => {
      render(<Card footer={<div>카드 푸터</div>}>카드 내용</Card>);

      expect(screen.getByText('카드 푸터')).toBeInTheDocument();
      expect(screen.getByText('카드 내용')).toBeInTheDocument();
    });

    it('header, content, footer가 모두 렌더링된다', () => {
      render(
        <Card header={<div>헤더</div>} footer={<div>푸터</div>}>
          내용
        </Card>
      );

      expect(screen.getByText('헤더')).toBeInTheDocument();
      expect(screen.getByText('내용')).toBeInTheDocument();
      expect(screen.getByText('푸터')).toBeInTheDocument();
    });

    it('title이 있을 때 header보다 title이 무시된다 (header 우선)', () => {
      render(
        <Card title="타이틀" header={<div>커스텀 헤더</div>}>
          내용
        </Card>
      );

      expect(screen.getByText('커스텀 헤더')).toBeInTheDocument();
      expect(screen.queryByText('타이틀')).not.toBeInTheDocument();
    });
  });

  describe('이미지 테스트', () => {
    it('이미지가 렌더링된다', () => {
      render(
        <Card image="https://example.com/image.jpg" imageAlt="테스트 이미지">
          카드 내용
        </Card>
      );

      const img = screen.getByAltText('테스트 이미지');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('이미지는 카드 상단에 렌더링된다', () => {
      const { container } = render(
        <Card image="https://example.com/image.jpg" imageAlt="테스트">
          내용
        </Card>
      );

      const card = container.firstChild as HTMLElement;
      const firstChild = card.firstChild as HTMLElement;
      const img = firstChild.querySelector('img');
      expect(img).toBeInTheDocument();
    });
  });

  describe('variant prop 테스트', () => {
    it('variant="outlined"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card title="제목" variant="outlined">
          내용
        </Card>
      );

      expect(container.firstChild).toHaveClass(/variantStyles_outlined/);
    });

    it('variant="elevated"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card title="제목" variant="elevated">
          내용
        </Card>
      );

      expect(container.firstChild).toHaveClass(/variantStyles_elevated/);
    });

    it('variant="filled"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card title="제목" variant="filled">
          내용
        </Card>
      );

      expect(container.firstChild).toHaveClass(/variantStyles_filled/);
    });

    it('기본값은 "elevated"이다', () => {
      const { container } = render(<Card title="제목">내용</Card>);

      expect(container.firstChild).toHaveClass(/variantStyles_elevated/);
    });
  });

  describe('클릭 기능 테스트', () => {
    it('onClick이 제공되면 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card title="제목" onClick={handleClick}>
          카드 내용
        </Card>
      );

      const card = screen.getByRole('button');
      await user.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('onClick이 없으면 button role이 없다', () => {
      render(<Card title="제목">카드 내용</Card>);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('onClick이 있으면 호버 스타일이 적용된다', () => {
      const { container } = render(
        <Card title="제목" onClick={() => {}}>
          내용
        </Card>
      );

      expect(container.firstChild).toHaveClass(/clickable/);
    });
  });

  describe('padding prop 테스트', () => {
    it('padding="sm"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card title="제목" padding="sm">
          내용
        </Card>
      );

      const card = container.firstChild as HTMLElement;
      const content = card.querySelector('[class*="cardBody"]');
      expect(content).toHaveClass(/paddingStyles_sm/);
    });

    it('padding="md"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card title="제목" padding="md">
          내용
        </Card>
      );

      const card = container.firstChild as HTMLElement;
      const content = card.querySelector('[class*="cardBody"]');
      expect(content).toHaveClass(/paddingStyles_md/);
    });

    it('padding="lg"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card title="제목" padding="lg">
          내용
        </Card>
      );

      const card = container.firstChild as HTMLElement;
      const content = card.querySelector('[class*="cardBody"]');
      expect(content).toHaveClass(/paddingStyles_lg/);
    });

    it('기본값은 "md"이다', () => {
      const { container } = render(<Card title="제목">내용</Card>);

      const card = container.firstChild as HTMLElement;
      const content = card.querySelector('[class*="cardBody"]');
      expect(content).toHaveClass(/paddingStyles_md/);
    });
  });

  describe('disabled 상태 테스트', () => {
    it('disabled가 true이면 비활성화 스타일이 적용된다', () => {
      const { container } = render(
        <Card title="제목" disabled onClick={() => {}}>
          내용
        </Card>
      );

      expect(container.firstChild).toHaveClass(/disabled/);
    });

    it('disabled일 때 클릭 이벤트가 발생하지 않는다', async () => {
      // 실제 생성 CSS가 주입돼 disabled 카드는 pointer-events: none이다. 그래도 막혀야 하니 검사는 끈다.
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const handleClick = vi.fn();
      render(
        <Card title="제목" onClick={handleClick} disabled>
          내용
        </Card>
      );

      const card = screen.getByRole('button');
      await user.click(card);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      const { container } = render(
        <Card title="제목" className="custom-class">
          내용
        </Card>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('접근성 테스트', () => {
    it('onClick이 있을 때 role="button"이 있다', () => {
      render(
        <Card title="제목" onClick={() => {}}>
          내용
        </Card>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('onClick이 없을 때는 article로 렌더링된다', () => {
      const { container } = render(<Card title="제목">내용</Card>);

      const card = container.firstChild as HTMLElement;
      expect(card.nodeName).toBe('ARTICLE');
    });

    it('disabled일 때 aria-disabled가 있다', () => {
      render(
        <Card title="제목" onClick={() => {}} disabled>
          내용
        </Card>
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Enter 키로 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card title="제목" onClick={handleClick}>
          내용
        </Card>
      );

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('Space 키로 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card title="제목" onClick={handleClick}>
          내용
        </Card>
      );

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disabled일 때 키보드 이벤트가 발생하지 않는다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card title="제목" onClick={handleClick} disabled>
          내용
        </Card>
      );

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('복합 시나리오 테스트', () => {
    it('이미지 + header + footer가 함께 렌더링된다', () => {
      render(
        <Card
          image="https://example.com/image.jpg"
          imageAlt="테스트"
          header={<div>헤더</div>}
          footer={<div>푸터</div>}
        >
          내용
        </Card>
      );

      expect(screen.getByAltText('테스트')).toBeInTheDocument();
      expect(screen.getByText('헤더')).toBeInTheDocument();
      expect(screen.getByText('내용')).toBeInTheDocument();
      expect(screen.getByText('푸터')).toBeInTheDocument();
    });

    it('클릭 가능 + variant + padding 조합이 정상 동작한다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const { container } = render(
        <Card
          title="제목"
          onClick={handleClick}
          variant="outlined"
          padding="lg"
        >
          내용
        </Card>
      );

      expect(container.firstChild).toHaveClass(/variantStyles_outlined/);
      expect(container.firstChild).toHaveClass(/clickable/);

      const card = container.firstChild as HTMLElement;
      const content = card.querySelector('[class*="cardBody"]');
      expect(content).toHaveClass(/paddingStyles_lg/);

      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('이미지 + 클릭 가능 카드가 정상 동작한다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card
          image="https://example.com/image.jpg"
          imageAlt="이미지"
          onClick={handleClick}
        >
          내용
        </Card>
      );

      expect(screen.getByAltText('이미지')).toBeInTheDocument();

      const card = screen.getByRole('button');
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Card 모션 잠금', () => {
  // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
  // 읽는다. Card.css.ts 소스 텍스트에서 직접 확인한다(이미지 기준 박스 관례).
  const cssSource = readFileSync(resolve(__dirname, './Card.css.ts'), 'utf-8');

  it('cardRoot transition의 transform 구간이 snap을, box-shadow/opacity가 settle을 쓴다', () => {
    const rootBlock = cssSource.match(
      /export const cardRoot = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(rootBlock, 'cardRoot 블록을 찾지 못했다').toBeDefined();
    const transitionLine = (rootBlock as string).match(
      /transition: `([^`]*)`,/
    )?.[1];
    expect(
      transitionLine,
      'cardRoot transition 선언을 찾지 못했다'
    ).toBeDefined();
    expect(transitionLine).toContain(
      'transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}'
    );
    expect(transitionLine).toContain(
      'box-shadow ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}'
    );
    expect(transitionLine).toContain(
      'opacity ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}'
    );
  });

  /**
   * hoverLift 규칙 블록을 꺼낸다. 호버는 (hover: hover) and (pointer: fine)
   * 안에, 누름(data-pressed)은 밖에 있다.
   */
  const hoverLiftBlock = (): string => {
    const block = cssSource.match(
      /export const hoverLift = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(block, 'hoverLift 블록을 찾지 못했다').toBeDefined();
    return block as string;
  };

  it('hoverLift :hover가 translateY(-3px)/base로 뜨고 (hover: hover) and (pointer: fine) 안에만 있다', () => {
    const block = hoverLiftBlock();
    const mediaAt = block.indexOf("'(hover: hover) and (pointer: fine)'");
    expect(mediaAt, '호버 미디어 쿼리가 없다').toBeGreaterThanOrEqual(0);
    // 미디어 쿼리 앞에는 :hover가 없다. 터치 기기에서 탭 뒤 들러붙지 않는다.
    expect(block.slice(0, mediaAt)).not.toContain(':hover');
    const hover = block.slice(
      mediaAt,
      block.indexOf("'(prefers-reduced-motion: reduce)'")
    );
    expect(hover).toContain("transform: 'translateY(-3px)'");
    expect(hover).toContain('themeContract.animation.duration.base');
    expect(hover).toContain("boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'");
  });

  it('hoverLift :hover 규칙에 transitionTimingFunction이 없다(리뷰 C3)', () => {
    // 포인터를 떼도 요소는 여전히 :hover에 매치된다. 이 블록의 타이밍 함수
    // 롱핸드가 cardRoot의 transition 숏핸드를 이기고 속성별 목록을 값
    // 하나로 무너뜨려서, 되돌아오는 전이까지 그 커브가 지배했다.
    // 무엇을 뒤집으면 빨개지는가: :hover에 transitionTimingFunction을 되돌리면.
    const block = hoverLiftBlock();
    const hover = block.slice(
      block.indexOf("'(hover: hover) and (pointer: fine)'"),
      block.indexOf("'(prefers-reduced-motion: reduce)'")
    );
    expect(hover).not.toContain('transitionTimingFunction');
  });

  it('hoverLift :hover 규칙은 :not([data-pressed])를 달아 호버가 누름을 덮지 않는다', () => {
    // @media가 selectors 뒤에 나와 특정도가 같은 호버가 누름 transform을 덮는다.
    // 무엇을 뒤집으면 빨개지는가: :not([data-pressed])를 지우면.
    const block = hoverLiftBlock();
    expect(block).toContain("'&:hover:not([data-pressed])'");
  });

  it('hoverLift 누름이 translateY(0) scale(0.98)/fast/settle로 눌리고 :active는 쓰지 않는다', () => {
    const block = hoverLiftBlock();
    expect(block).not.toContain("':active'");
    // 누름 규칙은 블록 맨 끝 selectors에 있다(축소 선호 안의 것이 앞선다).
    const pressedAt = block.lastIndexOf("'&[data-pressed]'");
    expect(pressedAt, '누름 규칙이 없다').toBeGreaterThanOrEqual(0);
    const pressed = block.slice(pressedAt);
    expect(pressed).toContain("transform: 'translateY(0) scale(0.98)'");
    expect(pressed).toContain('themeContract.animation.duration.fast');
    expect(pressed).toContain('themeContract.animation.easing.settle');
  });

  it('hoverLift 누름은 축소 선호에서 transform: none이고 willChange도 auto다', () => {
    const block = hoverLiftBlock();
    const reduced = block.slice(
      block.indexOf("'(prefers-reduced-motion: reduce)'"),
      block.lastIndexOf("'&[data-pressed]'")
    );
    expect(reduced).toContain("'&[data-pressed]'");
    expect(reduced).toContain("transform: 'none'");
    expect(reduced).toContain("willChange: 'auto'");
  });

  it('hoverLift는 축소 선호에서 호버 떠오름도 transform: none으로 끈다', () => {
    const block = hoverLiftBlock();
    const reduced = block.slice(
      block.indexOf("'(prefers-reduced-motion: reduce)'"),
      block.lastIndexOf("'&[data-pressed]'")
    );
    // 무엇을 뒤집으면 빨개지는가: 호버 규칙의 none을 지우면.
    expect(reduced).toContain("'&:hover:not([data-pressed])'");
    expect(reduced.match(/transform: 'none'/g)).toHaveLength(2);
  });

  it('willChange: transform은 hoverLift에만 있고 cardRoot에는 없다', () => {
    const root = cssSource.match(
      /export const cardRoot = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(root).not.toContain('willChange');
    expect(hoverLiftBlock()).toContain("willChange: 'transform'");
  });

  it('clickable은 커서·touch-action·포커스 링만 갖고 떠오르는 모션은 없다', () => {
    const block = cssSource.match(
      /export const clickable = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(block, 'clickable 블록을 찾지 못했다').toBeDefined();
    expect(block).toContain("cursor: 'pointer'");
    expect(block).toContain("touchAction: 'manipulation'");
    expect(block).toContain('focusRing');
    // 무엇을 뒤집으면 빨개지는가: clickable에 hover/active 모션을 되살리면.
    expect(block).not.toContain('translateY');
    expect(block).not.toContain(':hover');
    expect(block).not.toContain("':active'");
  });

  it('padding none과 interactive 변형이 CSS에 남아 있지 않다', () => {
    expect(cssSource).not.toMatch(/\binteractive:/);
    expect(cssSource).not.toMatch(/\bnone: \{/);
  });

  it('boxShadow rgba 리터럴 셋은 토큰에 같은 값이 없어 둔다(elevated, hover, pressed)', () => {
    // tokens/shadows.css.ts에 0 2px 8px / 0 4px 12px 와 같은 값이 없다. 바꾸면
    // 정지 모습이 바뀐다. 토큰에 같은 값이 생기면 이 시험과 함께 교체한다.
    const rgbaValues = cssSource.match(/rgba\(0, 0, 0, 0\.\d+\)/g) ?? [];
    expect(rgbaValues).toEqual([
      'rgba(0, 0, 0, 0.1)',
      'rgba(0, 0, 0, 0.15)',
      'rgba(0, 0, 0, 0.1)',
    ]);
  });
});

describe('Card hoverLift', () => {
  it('hoverLift를 주면 떠오름 클래스가 붙는다', () => {
    const { container } = render(
      <Card hoverLift>
        <Card.Body>내용</Card.Body>
      </Card>
    );

    expect(container.firstChild).toHaveClass(/hoverLift/);
  });

  it('기본은 떠오르지 않는다', () => {
    const { container } = render(
      <Card>
        <Card.Body>내용</Card.Body>
      </Card>
    );

    expect(container.firstChild).not.toHaveClass(/hoverLift/);
  });

  it('onClick만 있으면 클릭 가능하지만 떠오르지 않는다', () => {
    const { container } = render(
      <Card onClick={() => {}}>
        <Card.Body>내용</Card.Body>
      </Card>
    );

    expect(container.firstChild).toHaveClass(/clickable/);
    expect(container.firstChild).not.toHaveClass(/hoverLift/);
  });

  it('onClick과 hoverLift를 함께 주면 둘 다 붙는다', () => {
    const { container } = render(
      <Card onClick={() => {}} hoverLift>
        <Card.Body>내용</Card.Body>
      </Card>
    );

    expect(container.firstChild).toHaveClass(/clickable/);
    expect(container.firstChild).toHaveClass(/hoverLift/);
  });

  it('disabled이면 hoverLift를 줘도 떠오름 클래스가 붙지 않는다', () => {
    const { container } = render(
      <Card onClick={() => {}} hoverLift disabled>
        <Card.Body>내용</Card.Body>
      </Card>
    );

    expect(container.firstChild).toHaveClass(/disabled/);
    expect(container.firstChild).not.toHaveClass(/hoverLift/);
  });
});

describe('Card hoverLift의 합성 레이어는 호버·누름 중에만 선다 (CSSOM, 8차 기술 정리)', () => {
  const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
  const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

  interface Found {
    selector: string;
    media: string | null;
    willChange: string;
  }

  /** hoverLift 클래스에 걸린 규칙을 미디어 쿼리와 함께 평탄하게 읽는다. */
  const hoverLiftRules = (): Found[] => {
    const { container, unmount } = render(
      <Card hoverLift>
        <Card.Body>내용</Card.Body>
      </Card>
    );
    const klass = Array.from((container.firstChild as HTMLElement).classList)
      .find((name) => /^Card_hoverLift__/.test(name))
      ?.trim();
    unmount();
    if (!klass) throw new Error('hoverLift 클래스를 찾지 못했다');
    const found: Found[] = [];
    const walk = (rules: CSSRuleList, media: string | null) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule) {
          walk(rule.cssRules, rule.media.mediaText);
        } else if (
          rule instanceof CSSStyleRule &&
          rule.selectorText.startsWith(`.${klass}`)
        ) {
          found.push({
            selector: rule.selectorText.slice(klass.length + 1),
            media,
            willChange: rule.style.getPropertyValue('will-change'),
          });
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      walk(sheet.cssRules, null);
    }
    return found;
  };

  const willChangeOf = (selector: string, media: string | null) =>
    hoverLiftRules().find(
      (rule) => rule.selector === selector && rule.media === media
    )?.willChange;

  it('쉴 때 hoverLift 카드에는 will-change가 없다', () => {
    // 쉬는 규칙은 비면 생성 CSS에서 사라진다. 있다면 will-change가 없어야 하고, 호버·누름
    // 규칙만 미디어 안팎의 will-change를 가진다.
    const rules = hoverLiftRules();
    expect(rules.length).toBeGreaterThan(0);
    const resting = rules.filter(
      (rule) =>
        rule.media === null &&
        !rule.selector.includes(':hover') &&
        !rule.selector.includes('[data-pressed]')
    );
    for (const rule of resting) expect(rule.willChange).toBe('');
    expect(
      rules
        .filter((rule) => rule.willChange === 'transform')
        .map((rule) => `${rule.media ?? ''} ${rule.selector}`.trim())
        .sort()
    ).toEqual(
      [`${HOVER_QUERY} :hover:not([data-pressed])`, '[data-pressed]'].sort()
    );
  });

  it('정밀 포인터 호버 중에 will-change: transform이다', () => {
    expect(willChangeOf(':hover:not([data-pressed])', HOVER_QUERY)).toBe(
      'transform'
    );
  });

  it('누름 중에 will-change: transform이다', () => {
    expect(willChangeOf('[data-pressed]', null)).toBe('transform');
  });

  it('축소 선호에서는 쉴 때·호버·누름 모두 will-change: auto다', () => {
    expect(willChangeOf('', REDUCED_QUERY)).toBe('auto');
    expect(willChangeOf(':hover:not([data-pressed])', REDUCED_QUERY)).toBe(
      'auto'
    );
    expect(willChangeOf('[data-pressed]', REDUCED_QUERY)).toBe('auto');
  });
});

describe('Card hoverLift 누름은 짧은 클릭에도 보인다', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // jsdom에는 PointerEvent가 없어 MouseEvent로 쏜다(Button 시험과 같은 방식).
  const pointerDown = (el: HTMLElement) =>
    act(() => {
      el.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 })
      );
    });
  const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  it('hoverLift면 30ms 탭도 90ms까지 data-pressed가 남고 그 뒤 사라진다', () => {
    vi.useFakeTimers();
    const { container } = render(<Card hoverLift>내용</Card>);
    const card = container.firstChild as HTMLElement;

    pointerDown(card);
    expect(card).toHaveAttribute('data-pressed');
    wait(30);
    fireEvent.pointerUp(card);
    wait(59);
    expect(card).toHaveAttribute('data-pressed');
    wait(1);
    expect(card).not.toHaveAttribute('data-pressed');
  });

  it('클릭 가능한 hoverLift 카드도 Enter 키로 눌림이 붙는다', () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(
      <Card hoverLift onClick={onClick}>
        내용
      </Card>
    );
    const card = screen.getByRole('button');

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(card).toHaveAttribute('data-pressed');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('hoverLift가 없으면 눌러도 data-pressed가 붙지 않는다', () => {
    const { container } = render(<Card>내용</Card>);
    const card = container.firstChild as HTMLElement;

    pointerDown(card);
    expect(card).not.toHaveAttribute('data-pressed');
  });

  it('disabled면 hoverLift여도 data-pressed가 붙지 않는다', () => {
    render(
      <Card hoverLift disabled onClick={() => {}}>
        내용
      </Card>
    );
    const card = screen.getByRole('button');

    pointerDown(card);
    expect(card).not.toHaveAttribute('data-pressed');
  });

  it('자식 input의 Space·Enter에는 카드가 눌리지 않는다', () => {
    const { container } = render(
      <Card hoverLift>
        <input aria-label="이름" />
      </Card>
    );
    const card = container.firstChild as HTMLElement;
    const input = screen.getByLabelText('이름');

    fireEvent.keyDown(input, { key: ' ' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(card).not.toHaveAttribute('data-pressed');
  });

  it('클릭 가능한 카드 루트의 Space는 누르지만 안의 input에서는 누르지 않는다', () => {
    render(
      <Card hoverLift onClick={() => {}}>
        <input aria-label="이름" />
      </Card>
    );
    const card = screen.getByRole('button');

    fireEvent.keyDown(screen.getByLabelText('이름'), { key: ' ' });
    expect(card).not.toHaveAttribute('data-pressed');
    fireEvent.keyDown(card, { key: ' ' });
    expect(card).toHaveAttribute('data-pressed');
  });

  it('누른 채 disabled가 되면 data-pressed가 떨어진다', () => {
    const { rerender } = render(
      <Card hoverLift onClick={() => {}}>
        내용
      </Card>
    );
    const card = screen.getByRole('button');

    pointerDown(card);
    expect(card).toHaveAttribute('data-pressed');
    rerender(
      <Card hoverLift disabled onClick={() => {}}>
        내용
      </Card>
    );
    expect(card).not.toHaveAttribute('data-pressed');
    rerender(
      <Card hoverLift onClick={() => {}}>
        내용
      </Card>
    );
    expect(card).not.toHaveAttribute('data-pressed');
  });

  it('소비자 onKeyDown이 preventDefault하면 Enter·Space로 onClick이 불리지 않는다', () => {
    const onClick = vi.fn();
    render(
      <Card onClick={onClick} onKeyDown={(e) => e.preventDefault()}>
        내용
      </Card>
    );
    const card = screen.getByRole('button');

    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('소비자의 onPointerDown은 그대로 불린다', () => {
    const onPointerDown = vi.fn();
    const { container } = render(
      <Card hoverLift onPointerDown={onPointerDown}>
        내용
      </Card>
    );

    pointerDown(container.firstChild as HTMLElement);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });
});

describe('Card 타입 (@ts-expect-error가 잠근다)', () => {
  it('걷어낸 padding="none"·variant="interactive"·accentColor는 타입 오류다', () => {
    // 컴파일 시점 단정이라 런타임에는 렌더만 확인한다. tsc가 검사한다.
    render(
      <>
        {/* @ts-expect-error padding none은 없다 */}
        <Card title="제목" padding="none">
          a
        </Card>
        <Card>
          {/* @ts-expect-error padding none은 없다 */}
          <Card.Body padding="none">b</Card.Body>
        </Card>
        {/* @ts-expect-error interactive 변형은 없다 */}
        <Card variant="interactive">c</Card>
        {/* @ts-expect-error accentColor는 없다 */}
        <Card accentColor="#fff">d</Card>
      </>
    );

    expect(screen.getByText('a')).toBeInTheDocument();
  });
});
