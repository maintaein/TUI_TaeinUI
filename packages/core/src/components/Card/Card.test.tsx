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

  it('variantStyles.interactive가 hoverActiveMotion + cursor를 갖고 포커스 링은 M3로 미룬다(리뷰 I3)', () => {
    const variantBlock = cssSource.match(
      /export const variantStyles = styleVariants\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(variantBlock, 'variantStyles 블록을 찾지 못했다').toBeDefined();
    const interactiveBlock = (variantBlock as string).match(
      /interactive: \{([\s\S]*?)\n {2}\},/
    )?.[1];
    expect(interactiveBlock, 'interactive 블록을 찾지 못했다').toBeDefined();
    // 모션(hover/active)은 clickable과 같은 출처(hoverActiveMotion)를 공유한다
    // — onClick 없이 쓰여도(LivePreview가 렌더하는 CardPage.tsx 3곳) 살아있다.
    expect(interactiveBlock).toContain('...hoverActiveMotion');
    // :hover 리프트만이면 「강조」로 읽히지만 :active 누름까지 붙으면 버튼이라고
    // 말하는 것이다. 누름 피드백은 어포던스 신호라, 포인터에게 그 신호를 받을
    // 커서가 있어야 한다(리뷰 I3).
    // 무엇을 뒤집으면 빨개지는가: interactive에서 cursor 줄을 빼면.
    expect(interactiveBlock).toContain("cursor: 'pointer'");
    // 포커스 링은 아직 주지 않는다 — role·tabIndex 없이 링만 붙이면 받을 수
    // 없는 포커스를 그린다. Card에 진짜 상호작용 API를 주는 건 M3 몫이다.
    expect(interactiveBlock).not.toContain('focusRing');
  });

  it('clickable :hover가 translateY(-3px)/base로 합쳐진다', () => {
    const hover = cssSource.match(/':hover': \{([\s\S]*?)\n {2}\},/)?.[1];
    expect(hover, ':hover 블록을 찾지 못했다').toBeDefined();
    expect(hover).toContain("transform: 'translateY(-3px)'");
    expect(hover).toContain('themeContract.animation.duration.base');
  });

  it(':hover 블록에 transitionTimingFunction이 없다(리뷰 C3)', () => {
    // 포인터를 떼도 요소는 여전히 :hover에 매치된다. 이 블록의 타이밍 함수
    // 롱핸드가 cardRoot의 transition 숏핸드를 이기고 속성별 목록을 값
    // 하나로 무너뜨려서, 되돌아오는 전이까지 그 커브가 지배했다 —
    // cardRoot가 transform에 준 snap 오버슛이 포인터 사용자에게 한 번도
    // 재생되지 않았다(크로미엄 실측).
    // 무엇을 뒤집으면 빨개지는가: hoverActiveMotion의 ':hover'에
    // transitionTimingFunction: settle을 되돌려 놓으면 여기가 빨개진다.
    const hover = cssSource.match(/':hover': \{([\s\S]*?)\n {2}\},/)?.[1];
    expect(hover, ':hover 블록을 찾지 못했다').toBeDefined();
    expect(hover).not.toContain('transitionTimingFunction');
  });

  it('clickable :active가 scale(0.99) translateY(-1px)/fast/exit로 버틴다', () => {
    const active = cssSource.match(/':active': \{([\s\S]*?)\n {2}\},/)?.[1];
    expect(active, ':active 블록을 찾지 못했다').toBeDefined();
    expect(active).toContain("transform: 'scale(0.99) translateY(-1px)'");
    expect(active).toContain('themeContract.animation.duration.fast');
    expect(active).toContain('themeContract.animation.easing.exit');
  });

  it('남은 boxShadow rgba 값은 손대지 않는다(M5) — hoverActiveMotion 공유로 3곳 유지', () => {
    // hoverActiveMotion이 hover(0.15)/active(0.1) 값을 한 번만 갖고 clickable과
    // variantStyles.interactive가 스프레드로 공유한다(리뷰 F2) — 텍스트에
    // 새 리터럴이 추가되지 않아 elevated(0.1)까지 여전히 3곳이다. 소스 순서가
    // hoverActiveMotion(먼저 선언) → elevated(styleVariants 안)로 바뀌어
    // 등장 순서만 달라졌다.
    const rgbaValues = cssSource.match(/rgba\(0, 0, 0, 0\.\d+\)/g) ?? [];
    expect(rgbaValues).toHaveLength(3);
    expect(rgbaValues).toEqual([
      'rgba(0, 0, 0, 0.15)',
      'rgba(0, 0, 0, 0.1)',
      'rgba(0, 0, 0, 0.1)',
    ]);
  });
});
