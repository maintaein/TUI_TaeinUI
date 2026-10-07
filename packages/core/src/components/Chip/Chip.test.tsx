import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Chip } from './Chip';
import * as styles from './Chip.css';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

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
      const { container } = render(
        <Chip label="테스트" onDelete={handleDelete} />
      );

      const deleteButton = screen.getByRole('button', { name: /삭제/i });
      await user.click(deleteButton);

      // 퇴장이 끝난 뒤에 불린다.
      act(() => {
        (
          container.firstChild as HTMLElement & {
            __chipExitTimeline?: { progress(value: number): unknown };
          }
        ).__chipExitTimeline?.progress(1);
      });
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
      const { container } = render(
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
      act(() => {
        (
          container.firstChild as HTMLElement & {
            __chipExitTimeline?: { progress(value: number): unknown };
          }
        ).__chipExitTimeline?.progress(1);
      });
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

describe('Chip 삭제 퇴장', () => {
  afterEach(() => vi.unstubAllGlobals());

  // Chip.tsx가 DOM 노드에 얹는 손잡이. gsap을 직접 import하지 않고 이걸로 읽는다.
  type ExitStep = {
    vars: { scale?: number; opacity?: number; ease?: string };
    duration(): number;
  };
  type ExitTimeline = {
    getChildren(nested?: boolean): ExitStep[];
    progress(value: number): unknown;
    // 죽은 타임라인은 루트에서 떨어진다.
    parent: unknown;
  };
  type Host = HTMLElement & { __chipExitTimeline?: ExitTimeline };

  const stubReducedMotion = () =>
    vi.stubGlobal(
      'matchMedia',
      (media: string): MediaQueryList =>
        ({
          matches: true,
          media,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    );

  it('삭제를 눌러도 onDelete는 바로 불리지 않고, 퇴장이 끝난 뒤 한 번 불린다', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const { container } = render(<Chip label="테스트" onDelete={onDelete} />);
    const root = container.firstChild as Host;

    await user.click(screen.getByRole('button', { name: /삭제/i }));

    expect(onDelete).not.toHaveBeenCalled();
    const timeline = root.__chipExitTimeline as ExitTimeline;
    const [suck] = timeline.getChildren(false);
    expect(suck.vars.scale).toBe(0);
    expect(suck.vars.opacity).toBe(0);
    expect(suck.vars.ease).toBe(gsapEasing.exit);
    expect(suck.duration()).toBe(gsapDuration.base);

    act(() => {
      timeline.progress(1);
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('연달아 지워도 완료 시점의 onDelete를 불러 앞선 칩이 되살아나지 않는다', async () => {
    const user = userEvent.setup();
    // 문서가 권하는 패턴 그대로다. updater 형태면 stale 클로저가 드러나지 않는다.
    const Parent = () => {
      const [chips, setChips] = useState(['A', 'B', 'C']);
      return (
        <>
          {chips.map((c) => (
            <Chip
              key={c}
              label={c}
              onDelete={() => setChips(chips.filter((x) => x !== c))}
            />
          ))}
        </>
      );
    };
    render(<Parent />);
    const host = (label: string) =>
      screen
        .getByRole('button', { name: `${label} 삭제` })
        .closest('div') as Host;

    const a = host('A');
    const b = host('B');
    await user.click(screen.getByRole('button', { name: 'A 삭제' }));
    await user.click(screen.getByRole('button', { name: 'B 삭제' }));

    act(() => {
      a.__chipExitTimeline?.progress(1);
    });
    act(() => {
      b.__chipExitTimeline?.progress(1);
    });

    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.queryByText('B')).not.toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('퇴장 중 다시 눌러도 onDelete는 한 번이다', async () => {
    const onDelete = vi.fn();
    const { container } = render(<Chip label="테스트" onDelete={onDelete} />);
    const root = container.firstChild as Host;
    const del = screen.getByRole('button', { name: /삭제/i });

    fireEvent.click(del);
    const first = root.__chipExitTimeline;
    fireEvent.click(del);
    expect(root.__chipExitTimeline).toBe(first);

    act(() => {
      first?.progress(1);
    });
    fireEvent.click(del);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('퇴장 중에는 칩 전체가 입력을 받지 않는다', () => {
    const { container } = render(<Chip label="테스트" onDelete={() => {}} />);
    const root = container.firstChild as HTMLElement;

    fireEvent.click(screen.getByRole('button', { name: /삭제/i }));

    expect(root).toHaveAttribute('inert');
    expect(root).toHaveClass(styles.exiting);
  });

  it('축소 모드면 퇴장 없이 즉시 onDelete를 부른다', async () => {
    stubReducedMotion();
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<Chip label="테스트" onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /삭제/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('disabled면 아무것도 하지 않는다', () => {
    const onDelete = vi.fn();
    const { container } = render(
      <Chip label="테스트" onDelete={onDelete} disabled />
    );

    fireEvent.click(screen.getByRole('button', { name: /삭제/i }));

    expect((container.firstChild as Host).__chipExitTimeline).toBeUndefined();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('퇴장 중 언마운트하면 트윈을 죽인다', () => {
    const { container, unmount } = render(
      <Chip label="테스트" onDelete={() => {}} />
    );
    const root = container.firstChild as Host;

    fireEvent.click(screen.getByRole('button', { name: /삭제/i }));
    const timeline = root.__chipExitTimeline as ExitTimeline;
    expect(timeline.parent).toBeTruthy();
    unmount();

    expect(timeline.parent).toBeFalsy();
  });
});

describe('Chip 삭제 뒤 자리 닫기', () => {
  type Step = {
    vars: { scale?: number; marginInlineEnd?: number; ease?: string };
    duration(): number;
    startTime(): number;
    endTime(): number;
  };
  type Timeline = {
    getChildren(nested?: boolean): Step[];
    progress(value: number): unknown;
  };
  type Host = HTMLElement & { __chipExitTimeline?: Timeline };

  // jsdom은 레이아웃이 없어 offsetWidth가 0이다. 칩 폭을 정의해 준다.
  const renderIn = (
    parentStyle: Partial<CSSStyleDeclaration>,
    onDelete: () => void = () => {}
  ) => {
    const parent = document.createElement('div');
    Object.assign(parent.style, parentStyle);
    document.body.append(parent);
    const utils = render(<Chip label="테스트" onDelete={onDelete} />, {
      container: parent,
    });
    const root = parent.firstChild as Host;
    Object.defineProperty(root, 'offsetWidth', {
      configurable: true,
      value: 100,
    });
    fireEvent.click(screen.getByRole('button', { name: /삭제/i }));
    const timeline = root.__chipExitTimeline as Timeline;
    return { ...utils, parent, timeline, steps: timeline.getChildren(false) };
  };

  const row = { display: 'flex', flexDirection: 'row', columnGap: '8px' };

  it('flex row 부모에서는 빨려 든 뒤에 자리를 닫는 둘째 단계가 이어진다', () => {
    const { steps } = renderIn(row);

    expect(steps).toHaveLength(2);
    const [suck, close] = steps;
    expect(suck.vars.scale).toBe(0);
    // 둘째는 첫째가 끝난 시각에 시작한다. 겹치면 아직 보이는 칩 위로 옆 칩이 지난다.
    expect(close.startTime()).toBe(suck.endTime());
    expect(close.startTime()).toBeGreaterThan(suck.startTime());
  });

  it('둘째 단계는 넘침 없는 settle 커브로 base 동안 끝 여백을 움직인다', () => {
    const [, close] = renderIn(row).steps;

    expect(close.vars.marginInlineEnd).toBeDefined();
    expect(close.vars.ease).toBe(gsapEasing.settle);
    expect(close.vars.ease).not.toBe(gsapEasing.snap);
    expect(close.vars.ease).not.toBe(gsapEasing.spring);
    expect(close.duration()).toBe(gsapDuration.base);
  });

  it('끝 여백의 끝값은 -(칩 폭 + 부모 column-gap)이다', () => {
    const [, close] = renderIn(row).steps;

    expect(close.vars.marginInlineEnd).toBe(-(100 + 8));
  });

  it('column-gap이 normal이면 gap은 0으로 읽는다', () => {
    const [, close] = renderIn({ display: 'flex', flexDirection: 'row' }).steps;

    expect(close.vars.marginInlineEnd).toBe(-100);
  });

  it('일반 흐름(inline) 부모에서도 자리를 닫는다', () => {
    expect(renderIn({}).steps).toHaveLength(2);
  });

  it.each([
    ['grid', { display: 'grid', columnGap: '8px' }],
    ['flex column', { display: 'flex', flexDirection: 'column' }],
    ['flex row-reverse', { display: 'flex', flexDirection: 'row-reverse' }],
  ])('%s 부모에서는 자리 닫기 단계를 만들지 않는다', (_, style) => {
    const onDelete = vi.fn();
    const { timeline, steps } = renderIn(style, onDelete);

    expect(steps).toHaveLength(1);
    act(() => {
      timeline.progress(1);
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('onDelete는 자리 닫기까지 끝난 뒤에 한 번 불린다', () => {
    const onDelete = vi.fn();
    const { timeline, steps } = renderIn(row, onDelete);
    const [suck, close] = steps;

    // 첫째가 끝난 직후(둘째 시작 지점)까지는 아직 안 불린다.
    act(() => {
      timeline.progress(suck.endTime() / close.endTime());
    });
    expect(onDelete).not.toHaveBeenCalled();

    act(() => {
      timeline.progress(1);
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
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

  it('테두리형 success·warning은 평소 글자가 .dark이고 호버·누름에서 글자를 바꾸지 않는다', () => {
    for (const name of ['success', 'warning']) {
      const head = `variants: { variant: 'outlined', color: '${name}' },`;
      const parts = cssSource.split(head);
      // [0] 앞, [1] chip 본체 규칙, [2] clickable의 호버 규칙
      expect(parts.length, `${name} 규칙이 둘이어야 한다`).toBe(3);
      const base = parts[1].slice(0, parts[1].indexOf('\n    },'));
      expect(base).toContain(`color: themeContract.color.${name}.dark`);
      expect(base).toContain(
        `border: \`1px solid \${themeContract.color.${name}.main}\``
      );
      const tinted = parts[2].slice(0, parts[2].indexOf('\n    },'));
      expect(tinted).toContain(`backgroundColor: ${name}[50]`);
      expect(tinted).not.toContain('color: themeContract');
    }
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

  it('base에 표식(::before)이 opacity 0으로 숨어 있다가 opacity만 calc(slow*0.65)/exit로 물러난다', () => {
    const before = cssSource.match(/'::before': \{([\s\S]*?)\n {4}\},/)?.[1];
    expect(before, '::before 블록을 찾지 못했다').toBeDefined();
    expect(before).toContain('opacity: 0,');
    expect(before).not.toContain('transform');
    expect(before).toContain(
      'transition: `opacity calc(${themeContract.animation.duration.slow} * 0.65) ${themeContract.animation.easing.exit}`'
    );
  });

  it('selected::before가 opacity 1로 slow/settle에 서서히 나타나고 spring·snap·transform이 없다', () => {
    expect(cssSource).toMatch(/\$\{selected\}::before/);
    const marker = cssSource.match(
      /\$\{selected\}::before[`'"],?\s*\{([\s\S]*?)\n\}\)/
    )?.[1];
    expect(
      marker,
      'selected::before globalStyle 블록을 찾지 못했다'
    ).toBeDefined();
    expect(marker).toContain('opacity: 1,');
    // transition 단축 속성 통째로 쓴다. bare 롱핸드는 base의 속성 목록을 물려받는다(리뷰 F6).
    expect(marker).toContain(
      'transition: `opacity ${themeContract.animation.duration.slow} ${themeContract.animation.easing.settle}`'
    );
    expect(marker).not.toMatch(/transitionDuration|transitionTimingFunction/);
    expect(marker).not.toMatch(/easing\.(spring|snap)/);
    expect(marker).not.toContain('transform');
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

  it('삭제 버튼 hover가 translateX(1px)로 미는 방향 저항을 준다(settle, 포인터 게이트 안)', () => {
    const deleteBlock = cssSource.match(
      /export const deleteButton = style\(\{([\s\S]*?)\n\}\);/
    )?.[1] as string;
    expect(deleteBlock, 'deleteButton 블록을 찾지 못했다').toBeDefined();
    // 칩 호버(tint)와 같은 게이트다. 터치는 탭하면 호버가 발생해 이동이 들러붙는다.
    const gated = deleteBlock.match(
      /'@media': {\s*'\(hover: hover\) and \(pointer: fine\)': {([\s\S]*?)\n {4}},/
    )?.[1];
    expect(gated, '게이트 안 호버 블록을 찾지 못했다').toBeDefined();
    expect(gated).toContain("transform: 'translateX(1px)'");
    // 게이트 밖 맨 :hover는 없다. :focus-visible의 opacity는 따로 남는다.
    expect(deleteBlock).not.toMatch(/^ {2}':hover'/m);
    expect(deleteBlock).toMatch(/':focus-visible': {[\s\S]*?opacity: 1/);
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
