import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('Chip 소스 잠금', () => {
  // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
  // 읽는다. Chip.css.ts 소스 텍스트에서 직접 확인한다(Card·HeaderBar 관례).
  const cssSource = readFileSync(resolve(__dirname, './Chip.css.ts'), 'utf-8');

  it('clickable hover가 지각되는 채널을 쓴다', () => {
    // shadow.sm은 5% 알파 2px 블러라 색 있는 칩 위에서 지각 한계 아래다.
    // hover는 "누를 수 있다"를 알리는 가장 기본 어포던스다.
    const hover = cssSource.match(/':hover': \{([\s\S]*?)\n {2}\},/)?.[1];
    expect(hover, ':hover 블록을 찾지 못했다').toBeDefined();
    expect(hover).toContain("transform: 'translateY(-1px)'");
    expect(hover).toContain('themeContract.shadow.base');
  });

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
