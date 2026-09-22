import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    it('padding="none"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card>
          <Card.Body padding="none">내용</Card.Body>
        </Card>
      );

      const body = container.querySelector('[class*="cardBody"]');
      expect(body).toHaveClass(/paddingStyles_none/);
    });

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
      const user = userEvent.setup();
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
    // 읽는다. Card.css.ts 소스 텍스트에서 직접 확인한다(S7이 Text에 쓴 관례).
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
    it('padding="none"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(
        <Card title="제목" padding="none">
          내용
        </Card>
      );

      const card = container.firstChild as HTMLElement;
      const content = card.querySelector('[class*="cardBody"]');
      expect(content).toHaveClass(/paddingStyles_none/);
    });

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
      const user = userEvent.setup();
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

  it('variantStyles.interactive가 자기 :hover/transition을 더 갖지 않는다(clickable로 병합)', () => {
    const variantBlock = cssSource.match(
      /export const variantStyles = styleVariants\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(variantBlock, 'variantStyles 블록을 찾지 못했다').toBeDefined();
    const interactiveBlock = (variantBlock as string).match(
      /interactive: \{([\s\S]*?)\n {2}\},/
    )?.[1];
    expect(interactiveBlock, 'interactive 블록을 찾지 못했다').toBeDefined();
    expect(interactiveBlock).not.toContain('cubic-bezier');
    expect(interactiveBlock).not.toContain('transition');
    expect(interactiveBlock).not.toContain(':hover');
    expect(interactiveBlock).not.toContain('translateY(-8px)');
  });

  it('clickable :hover가 translateY(-3px)/base/settle로 합쳐진다', () => {
    const hover = cssSource.match(/':hover': \{([\s\S]*?)\n {2}\},/)?.[1];
    expect(hover, ':hover 블록을 찾지 못했다').toBeDefined();
    expect(hover).toContain("transform: 'translateY(-3px)'");
    expect(hover).toContain('themeContract.animation.duration.base');
    expect(hover).toContain('themeContract.animation.easing.settle');
  });

  it('clickable :active가 scale(0.99) translateY(-1px)/fast/exit로 버틴다', () => {
    const active = cssSource.match(/':active': \{([\s\S]*?)\n {2}\},/)?.[1];
    expect(active, ':active 블록을 찾지 못했다').toBeDefined();
    expect(active).toContain("transform: 'scale(0.99) translateY(-1px)'");
    expect(active).toContain('themeContract.animation.duration.fast');
    expect(active).toContain('themeContract.animation.easing.exit');
  });

  it('남은 boxShadow rgba 값은 손대지 않는다(M5) — interactive 병합 삭제로 4→3', () => {
    // interactive의 hover boxShadow(0.12 알파)가 병합으로 통째로 사라져 4→3.
    // 남은 3곳(elevated·clickable hover·clickable active)의 알파값은 그대로다.
    const rgbaValues = cssSource.match(/rgba\(0, 0, 0, 0\.\d+\)/g) ?? [];
    expect(rgbaValues).toHaveLength(3);
    expect(rgbaValues).toEqual([
      'rgba(0, 0, 0, 0.1)',
      'rgba(0, 0, 0, 0.15)',
      'rgba(0, 0, 0, 0.1)',
    ]);
  });
});
