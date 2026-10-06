import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip';
import * as styles from './Chip.css';

describe('Chip', () => {
  describe('렌더링 테스트', () => {
    it('기본 Chip이 렌더링된다', () => {
      render(<Chip label="테스트" />);

      expect(screen.getByText('테스트')).toBeInTheDocument();
    });

    it('아이콘과 함께 렌더링된다', () => {
      render(
        <Chip label="테스트" icon={<span data-testid="test-icon">🔥</span>} />
      );

      expect(screen.getByText('테스트')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('아바타와 함께 렌더링된다', () => {
      render(
        <Chip label="테스트" avatar={<img src="avatar.jpg" alt="아바타" />} />
      );

      expect(screen.getByText('테스트')).toBeInTheDocument();
      expect(screen.getByAltText('아바타')).toBeInTheDocument();
    });
  });

  describe('size prop 테스트', () => {
    it('size="sm"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" size="sm" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'sm', variant: 'filled', color: 'default' })
      );
    });

    it('size="md"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" size="md" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'default' })
      );
    });

    it('size="lg"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" size="lg" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'lg', variant: 'filled', color: 'default' })
      );
    });

    it('기본값은 "md"이다', () => {
      const { container } = render(<Chip label="테스트" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'default' })
      );
    });
  });

  describe('variant prop 테스트', () => {
    it('variant="filled"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" variant="filled" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'default' })
      );
    });

    it('variant="outlined"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" variant="outlined" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'outlined', color: 'default' })
      );
    });

    it('기본값은 "filled"이다', () => {
      const { container } = render(<Chip label="테스트" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'default' })
      );
    });
  });

  describe('color prop 테스트', () => {
    it('color="default"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" color="default" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'default' })
      );
    });

    it('color="primary"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" color="primary" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'primary' })
      );
    });

    it('color="success"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" color="success" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'success' })
      );
    });

    it('color="error"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" color="error" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'error' })
      );
    });

    it('color="warning"일 때 적절한 클래스가 적용된다', () => {
      const { container } = render(<Chip label="테스트" color="warning" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'warning' })
      );
    });

    it('기본값은 "default"이다', () => {
      const { container } = render(<Chip label="테스트" />);

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'md', variant: 'filled', color: 'default' })
      );
    });
  });

  describe('삭제 기능 테스트', () => {
    it('onDelete가 제공되면 삭제 버튼이 표시된다', () => {
      const handleDelete = vi.fn();
      render(<Chip label="테스트" onDelete={handleDelete} />);

      expect(screen.getByRole('button', { name: /삭제/i })).toBeInTheDocument();
    });

    it('onDelete가 없으면 삭제 버튼이 표시되지 않는다', () => {
      render(<Chip label="테스트" />);

      expect(
        screen.queryByRole('button', { name: /삭제/i })
      ).not.toBeInTheDocument();
    });

    it('삭제 버튼 클릭 시 onDelete가 호출된다', async () => {
      const user = userEvent.setup();
      const handleDelete = vi.fn();
      render(<Chip label="테스트" onDelete={handleDelete} />);

      const deleteButton = screen.getByRole('button', { name: /삭제/i });
      await user.click(deleteButton);

      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('삭제 버튼은 aria-label을 가진다', () => {
      const handleDelete = vi.fn();
      render(<Chip label="테스트" onDelete={handleDelete} />);

      const deleteButton = screen.getByRole('button', { name: /삭제/i });
      expect(deleteButton).toHaveAttribute('aria-label');
    });
  });

  describe('선택 기능 테스트', () => {
    it('clickable이 true이면 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Chip label="테스트" clickable onClick={handleClick} />);

      const chip = screen.getByRole('button');
      await user.click(chip);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('clickable이 false이면 button role이 없다', () => {
      render(<Chip label="테스트" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('selected가 true이면 선택된 스타일이 적용된다', () => {
      const { container } = render(<Chip label="테스트" selected />);

      expect(container.firstChild).toHaveClass(/selected/);
    });

    it('selected가 false이면 선택되지 않은 스타일이 적용된다', () => {
      const { container } = render(<Chip label="테스트" selected={false} />);

      expect(container.firstChild).not.toHaveClass(/selected/);
    });
  });

  describe('disabled 상태 테스트', () => {
    it('disabled가 true이면 비활성화 스타일이 적용된다', () => {
      const { container } = render(<Chip label="테스트" disabled />);

      expect(container.firstChild).toHaveClass(/disabled/);
    });

    it('disabled일 때 클릭 이벤트가 발생하지 않는다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Chip label="테스트" clickable onClick={handleClick} disabled />);

      const chip = screen.getByRole('button');
      await user.click(chip);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('disabled일 때 삭제 버튼이 비활성화된다', () => {
      const handleDelete = vi.fn();
      render(<Chip label="테스트" onDelete={handleDelete} disabled />);

      const deleteButton = screen.getByRole('button', { name: /삭제/i });
      expect(deleteButton).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      const { container } = render(
        <Chip label="테스트" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('접근성 테스트', () => {
    it('clickable일 때 role="button"이 있다', () => {
      render(<Chip label="테스트" clickable onClick={() => {}} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('clickable이 아닐 때는 div로 렌더링된다', () => {
      const { container } = render(<Chip label="테스트" />);

      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('disabled일 때 aria-disabled가 있다', () => {
      render(<Chip label="테스트" clickable onClick={() => {}} disabled />);

      const chip = screen.getByRole('button');
      expect(chip).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('키보드 인터랙션 테스트', () => {
    it('Enter 키로 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Chip label="테스트" clickable onClick={handleClick} />);

      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('Space 키로 클릭할 수 있다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Chip label="테스트" clickable onClick={handleClick} />);

      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disabled일 때 키보드 이벤트가 발생하지 않는다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Chip label="테스트" clickable onClick={handleClick} disabled />);

      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('복합 시나리오 테스트', () => {
    it('아이콘 + 삭제 버튼이 함께 렌더링된다', () => {
      const handleDelete = vi.fn();
      render(
        <Chip
          label="테스트"
          icon={<span data-testid="test-icon">🔥</span>}
          onDelete={handleDelete}
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /삭제/i })).toBeInTheDocument();
    });

    it('선택 가능 + 삭제 가능 칩이 정상 동작한다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const handleDelete = vi.fn();
      render(
        <Chip
          label="테스트"
          clickable
          selected
          onClick={handleClick}
          onDelete={handleDelete}
        />
      );

      const chip = screen.getByRole('button', { name: '테스트' });
      await user.click(chip);
      expect(handleClick).toHaveBeenCalledTimes(1);

      const deleteButton = screen.getByRole('button', { name: /삭제/i });
      await user.click(deleteButton);
      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('다양한 색상과 크기 조합이 정상 동작한다', () => {
      const { container } = render(
        <Chip label="테스트" size="lg" color="primary" variant="outlined" />
      );

      expect(container.firstChild).toHaveClass(
        styles.chip({ size: 'lg', variant: 'outlined', color: 'primary' })
      );
    });
  });
});

describe('Chip 누름과 선택 상태', () => {
  afterEach(() => vi.useRealTimers());

  // jsdom에는 PointerEvent가 없어 fireEvent.pointerDown은 button을 못 싣는다.
  const pointer = (el: HTMLElement, type: string, button = 0) =>
    act(() => {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, button }));
    });

  it('pointerdown에 data-pressed가 붙는다', () => {
    render(<Chip label="테스트" clickable onClick={() => {}} />);
    const chip = screen.getByRole('button');

    pointer(chip, 'pointerdown');
    expect(chip).toHaveAttribute('data-pressed');
  });

  it('짧은 누름도 90ms는 유지한다', () => {
    vi.useFakeTimers();
    render(<Chip label="테스트" clickable onClick={() => {}} />);
    const chip = screen.getByRole('button');

    pointer(chip, 'pointerdown');
    pointer(chip, 'pointerup');
    expect(chip).toHaveAttribute('data-pressed');
    act(() => {
      vi.advanceTimersByTime(90);
    });
    expect(chip).not.toHaveAttribute('data-pressed');
  });

  it('Enter 누름에도 data-pressed가 붙고 onClick은 한 번이다', () => {
    const onClick = vi.fn();
    render(<Chip label="테스트" clickable onClick={onClick} />);
    const chip = screen.getByRole('button');

    fireEvent.keyDown(chip, { key: 'Enter' });
    expect(chip).toHaveAttribute('data-pressed');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('삭제 버튼을 눌러도 칩이 눌리지 않는다', () => {
    render(
      <Chip label="테스트" clickable onClick={() => {}} onDelete={() => {}} />
    );

    pointer(screen.getByRole('button', { name: /삭제/i }), 'pointerdown');
    expect(screen.getByRole('button', { name: '테스트' })).not.toHaveAttribute(
      'data-pressed'
    );
  });

  it('클릭 가능한 칩은 selected를 aria-pressed로 알린다', () => {
    const { rerender } = render(
      <Chip label="테스트" clickable onClick={() => {}} selected />
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');

    rerender(<Chip label="테스트" clickable onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('클릭 불가 칩에는 aria-pressed가 없다', () => {
    const { container } = render(<Chip label="테스트" selected />);

    expect(container.firstChild).not.toHaveAttribute('aria-pressed');
  });
});

describe('Chip 소스 잠금', () => {
  // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
  // 읽는다. Chip.css.ts 소스 텍스트에서 직접 확인한다(Card·HeaderBar 관례).
  const cssSource = readFileSync(resolve(__dirname, './Chip.css.ts'), 'utf-8');

  it('탭 가능한 size 변형이 24px 최소 높이를 갖는다 (WCAG 2.5.8)', () => {
    // lg는 padding 8×2 + 16px 글자로 이미 32px라 명시가 필요 없다.
    const sizeGroup = cssSource.match(/\n {4}size: \{([\s\S]*?)\n {4}\},/)?.[1];
    expect(sizeGroup, 'size 변형 그룹을 찾지 못했다').toBeDefined();
    const withMinHeight = [
      ...(sizeGroup as string).matchAll(/\n {6}(\w+): \{([\s\S]*?)\n {6}\},/g),
    ]
      .filter((m) => m[2].includes("minHeight: '24px'"))
      .map((m) => m[1]);
    expect(withMinHeight).toEqual(['sm', 'md']);
  });
});

describe('Chip 모션 잠금', () => {
  const cssSource = readFileSync(resolve(__dirname, './Chip.css.ts'), 'utf-8');

  it('base transition의 transform 구간이 snap을 쓴다(해제 오버슛)', () => {
    const transitionLine = cssSource.match(/transition: `([^`]*)`,/)?.[1];
    expect(transitionLine, 'base transition 선언을 찾지 못했다').toBeDefined();
    expect(transitionLine).toContain(
      'transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.snap}'
    );
  });

  // clickable 레시피 소스(base + compoundVariants). selected 뒤에 선언된다.
  const clickableSource = cssSource.match(
    /export const clickable = recipe\(\{([\s\S]*?)\n\}\);/
  )?.[1] as string;

  it('clickable이 selected 뒤에 선언된다(같은 특정도의 transition이 selected를 이긴다)', () => {
    expect(clickableSource, 'clickable 레시피를 찾지 못했다').toBeDefined();
    expect(cssSource.indexOf('export const clickable')).toBeGreaterThan(
      cssSource.indexOf('export const selected')
    );
  });

  it('호버는 (hover: hover) and (pointer: fine) 안에 있고 :not([data-pressed])를 단다', () => {
    const tint = cssSource.match(/const tint = [\s\S]*?\n\}\);/)?.[0];
    expect(tint, 'tint 헬퍼를 찾지 못했다').toBeDefined();
    expect(tint).toContain("'(hover: hover) and (pointer: fine)'");
    expect(tint).toContain(
      "'&:hover:not(:disabled):not([data-pressed])': hover"
    );
  });

  it('호버·누름 색 규칙은 transform을 바꾸지 않고 떠오름·그림자가 없다', () => {
    const tint = cssSource.match(/const tint = [\s\S]*?\n\}\);/)?.[0] as string;
    expect(tint).not.toContain('transform');
    // 예전 호버: translateY(-1px) + shadow.base. 둘 다 걷었다.
    expect(clickableSource).not.toContain('translateY');
    expect(clickableSource).not.toContain('boxShadow');
    expect(clickableSource).not.toContain("':hover'");
    expect(clickableSource).not.toContain("':active'");
  });

  it('[data-pressed]가 --chip-scale에 0.95를 곱하고 fast/settle로 들어간다', () => {
    const pressed = clickableSource.match(
      /'&\[data-pressed\]:not\(:disabled\)': \{([\s\S]*?)\n {6}\},/
    )?.[1];
    expect(pressed, '[data-pressed] 블록을 찾지 못했다').toBeDefined();
    expect(pressed).toContain(
      "transform: 'scale(calc(var(--chip-scale) * 0.95))'"
    );
    expect(pressed).toContain(
      'transitionDuration: themeContract.animation.duration.fast'
    );
    expect(pressed).toContain(
      'transitionTimingFunction: themeContract.animation.easing.settle'
    );
  });

  it('뗄 때는 base spring이 transform에만 걸린다(색은 settle)', () => {
    const transition = clickableSource.match(/transition: `([^`]*)`,/)?.[1];
    expect(transition).toContain(
      'transform ${themeContract.animation.duration.base} ${themeContract.animation.easing.spring}'
    );
    expect(transition).toContain(
      'background-color ${themeContract.animation.duration.base} ${themeContract.animation.easing.settle}'
    );
  });

  it("will-change: 'transform'이 상시이고 축소 모드에서 auto가 된다", () => {
    expect(clickableSource).toContain("willChange: 'transform'");
    const reduced = clickableSource.match(
      /'\(prefers-reduced-motion: reduce\)': \{([\s\S]*?)\n {6}\},/
    )?.[1];
    expect(reduced, '축소 모드 블록을 찾지 못했다').toBeDefined();
    expect(reduced).toContain("willChange: 'auto'");
    // 누름 scale을 끈다. 선택 배율(1.03)은 남긴다.
    expect(reduced).toContain("transform: 'scale(var(--chip-scale))'");
  });

  it('chip 베이스가 --chip-scale을 1로 선언한다(선택 안 된 칩은 hover/active가 그대로 유지)', () => {
    expect(cssSource).toMatch(/vars:\s*\{\s*'--chip-scale':\s*'1',\s*\}/);
  });

  it('base에 표식(::before)이 scale(0)로 숨어 있다가 calc(base*0.65)/exit로 물러난다', () => {
    const before = cssSource.match(/'::before': \{([\s\S]*?)\n {4}\},/)?.[1];
    expect(before, '::before 블록을 찾지 못했다').toBeDefined();
    expect(before).toContain("transform: 'scale(0)'");
    expect(before).toContain('* 0.65');
    expect(before).toContain('themeContract.animation.easing.exit');
  });

  it('selected::before가 spring으로 표식을 scale(1)로 박아 넣는다', () => {
    expect(cssSource).toMatch(/\$\{selected\}::before/);
    const marker = cssSource.match(
      /\$\{selected\}::before[`'"],?\s*\{([\s\S]*?)\n\}\)/
    )?.[1];
    expect(
      marker,
      'selected::before globalStyle 블록을 찾지 못했다'
    ).toBeDefined();
    expect(marker).toContain("transform: 'scale(1)'");
    expect(marker).toContain('themeContract.animation.easing.spring');
  });

  it('selected 클래스 자체가 --chip-scale을 1.03으로 올려 spring으로 본체를 흔든다', () => {
    const selectedBlock = cssSource.match(
      /export const selected = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(selectedBlock, 'selected 블록을 찾지 못했다').toBeDefined();
    expect(selectedBlock).toContain("'--chip-scale': '1.03'");
    expect(selectedBlock).toContain("transform: 'scale(var(--chip-scale))'");
    expect(selectedBlock).toContain('themeContract.animation.easing.spring');
  });

  it('selected가 transition을 통째로 재선언해 spring이 transform에만 걸린다(리뷰 F6 — box-shadow/opacity는 settle)', () => {
    const selectedBlock = cssSource.match(
      /export const selected = style\(\{([\s\S]*?)\n\}\);/
    )?.[1];
    expect(selectedBlock, 'selected 블록을 찾지 못했다').toBeDefined();
    expect(selectedBlock).toMatch(
      /transition: `transform \$\{themeContract\.animation\.duration\.base\} \$\{themeContract\.animation\.easing\.spring\}, box-shadow \$\{themeContract\.animation\.duration\.base\} \$\{themeContract\.animation\.easing\.settle\}, opacity \$\{themeContract\.animation\.duration\.base\} \$\{themeContract\.animation\.easing\.settle\}`,/
    );
    // 예전엔 transitionDuration/TimingFunction만 얹어 transition-property를
    // chip 베이스(transform·box-shadow·opacity)에서 그대로 물려받았다 — 그
    // 결과 bare 오버라이드가 box-shadow/opacity에도 spring을 흘렸다.
    expect(selectedBlock).not.toMatch(/transitionDuration:/);
    expect(selectedBlock).not.toMatch(/transitionTimingFunction:/);
  });

  it('삭제 버튼 hover가 translateX(1px)로 미는 방향 저항을 준다(settle)', () => {
    const deleteHover = cssSource.match(
      /export const deleteButton[\s\S]*?':hover': \{([\s\S]*?)\n {2}\},/
    )?.[1];
    expect(deleteHover, 'deleteButton :hover 블록을 찾지 못했다').toBeDefined();
    expect(deleteHover).toContain("transform: 'translateX(1px)'");
    const deleteTransition = cssSource.match(
      /export const deleteButton[\s\S]*?transition: `([^`]*)`,/
    )?.[1];
    expect(deleteTransition).toContain('transform');
    expect(deleteTransition).toContain('themeContract.animation.easing.settle');
    expect(deleteTransition).not.toContain(' ease,');
    expect(deleteTransition).not.toMatch(/ ease$/);
  });

  it('선택 시 --chip-marker-color 커스텀 프로퍼티가 인라인으로 붙고, boxShadow 인라인은 사라졌다', () => {
    const { container } = render(
      <Chip label="테스트" selected color="primary" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.getPropertyValue('--chip-marker-color')).toBeTruthy();
    expect(root.style.boxShadow).toBe('');
  });
});
