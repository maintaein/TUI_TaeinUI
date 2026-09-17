import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('렌더링 테스트', () => {
    it('children을 렌더링한다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      expect(
        screen.getByRole('button', { name: '호버하세요' })
      ).toBeInTheDocument();
    });

    it('기본적으로 툴팁이 숨겨져 있다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('호버 인터랙션 테스트', () => {
    it('마우스 호버 시 툴팁이 표시된다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('툴팁 내용')).toBeInTheDocument();
    });

    it('마우스 아웃 시 툴팁이 사라진다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(button);

      // Hoverable/Persistent 유예 시간이 지나야 결국 사라진다
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('포커스 인터랙션 테스트', () => {
    it('포커스 시 툴팁이 표시된다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>포커스하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.focus(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('블러 시 툴팁이 사라진다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>포커스하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.focus(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.blur(button);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('position prop 테스트', () => {
    it('top 위치를 렌더링한다', () => {
      render(
        <Tooltip content="툴팁 내용" position="top">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('top');
    });

    it('bottom 위치를 렌더링한다', () => {
      render(
        <Tooltip content="툴팁 내용" position="bottom">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('bottom');
    });

    it('left 위치를 렌더링한다', () => {
      render(
        <Tooltip content="툴팁 내용" position="left">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('left');
    });

    it('right 위치를 렌더링한다', () => {
      render(
        <Tooltip content="툴팁 내용" position="right">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('right');
    });
  });

  describe('delay prop 테스트', () => {
    it('delay 후에 툴팁이 표시된다', () => {
      render(
        <Tooltip content="툴팁 내용" delay={500}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('delay=0이면 즉시 표시된다', () => {
      render(
        <Tooltip content="툴팁 내용" delay={0}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('role="tooltip"을 가진다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('aria-describedby로 툴팁이 연결된다', () => {
      const { container } = render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      const tooltip = screen.getByRole('tooltip');
      const tooltipId = tooltip.getAttribute('id');
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.getAttribute('aria-describedby')).toBe(tooltipId);
    });
  });

  describe('disabled prop 테스트', () => {
    it('disabled=true이면 툴팁이 표시되지 않는다', () => {
      render(
        <Tooltip content="툴팁 내용" disabled>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('화살표 테스트', () => {
    it('기본적으로 화살표를 표시한다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      const tooltip = screen.getByRole('tooltip');
      const arrow = tooltip.querySelector('[class*="arrow"]');
      expect(arrow).toBeInTheDocument();
    });

    it('arrow=false이면 화살표를 표시하지 않는다', () => {
      render(
        <Tooltip content="툴팁 내용" arrow={false}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      const tooltip = screen.getByRole('tooltip');
      const arrow = tooltip.querySelector('[class*="arrow"]');
      expect(arrow).not.toBeInTheDocument();
    });
  });

  describe('비제어 모드 (Uncontrolled Mode)', () => {
    it('호버 시 내부 상태로 툴팁을 표시한다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('onOpenChange 콜백이 호출된다', () => {
      const handleOpenChange = vi.fn();
      render(
        <Tooltip content="툴팁 내용" onOpenChange={handleOpenChange}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(handleOpenChange).toHaveBeenCalledWith(true);

      fireEvent.mouseLeave(button);

      // Hoverable/Persistent 유예 시간이 지나야 결국 onOpenChange(false)가 호출된다
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('제어 모드 (Controlled Mode)', () => {
    it('open prop으로 툴팁 표시를 제어한다', () => {
      const { rerender } = render(
        <Tooltip content="툴팁 내용" open={false} onOpenChange={vi.fn()}>
          <button>호버하세요</button>
        </Tooltip>
      );

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      rerender(
        <Tooltip content="툴팁 내용" open={true} onOpenChange={vi.fn()}>
          <button>호버하세요</button>
        </Tooltip>
      );

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('호버 시 onOpenChange가 호출되지만 내부 상태는 변하지 않음', () => {
      const handleOpenChange = vi.fn();
      render(
        <Tooltip
          content="툴팁 내용"
          open={false}
          onOpenChange={handleOpenChange}
        >
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(handleOpenChange).toHaveBeenCalledWith(true);
      // 부모가 업데이트하지 않으면 여전히 숨겨진 상태
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('제어 모드에서 disabled는 onOpenChange 호출을 막는다', () => {
      const handleOpenChange = vi.fn();
      render(
        <Tooltip
          content="툴팁 내용"
          open={false}
          onOpenChange={handleOpenChange}
          disabled
        >
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(handleOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Dismissible (Escape) 테스트', () => {
    it('포커스로 열린 뒤 Escape를 누르면 사라진다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>포커스하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.focus(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.keyDown(button, { key: 'Escape' });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('호버로 열린 뒤(포커스 없이) document에서 Escape를 누르면 사라진다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('Escape로 닫힌 뒤 포인터가 트리거에 그대로 있어도 다시 열리지 않는다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // 포인터는 트리거를 벗어나지 않았다 — 남아있는 타이머가 있어도 다시 열리면 안 된다
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('Escape로 닫힌 뒤 leave 없이 다시 mouseEnter가 와도 열리지 않는다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // 포인터가 트리거를 벗어나지 않은 채로 다시 mouseEnter가 온다 — 가드가 없으면 재개방된다
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('Escape로 닫힌 뒤 포인터가 벗어났다 돌아오면 다시 열린다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      fireEvent.mouseLeave(button);
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('Hoverable + Persistent (유예) 테스트', () => {
    it('트리거에서 마우스가 나가도 유예 중엔 남아있고, 툴팁으로 들어오면 계속 남아있다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      const tooltipEl = screen.getByRole('tooltip');
      expect(tooltipEl).toBeInTheDocument();

      fireEvent.mouseLeave(button);
      // 유예 중엔 아직 있다
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseEnter(tooltipEl);

      // 유예가 다 지나도 닫기가 취소되어 여전히 남아있다
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('트리거에서 나간 뒤 아무 데도 들어가지 않으면 유예 뒤 닫힌다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(button);
      // 유예 중엔 아직 있다
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('타이머 정리(클린업) 테스트', () => {
    it('hide 유예 중 언마운트되면 타이머가 정리되어 이후 onOpenChange가 호출되지 않는다', () => {
      const handleOpenChange = vi.fn();
      const { unmount } = render(
        <Tooltip content="툴팁 내용" onOpenChange={handleOpenChange}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(handleOpenChange).toHaveBeenCalledWith(true);

      fireEvent.mouseLeave(button); // hide 유예 타이머 예약
      handleOpenChange.mockClear();

      unmount();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('hide 유예 중 Escape를 누르면 잔여 hide 타이머가 중복으로 닫기를 호출하지 않는다', () => {
      const handleOpenChange = vi.fn();
      render(
        <Tooltip content="툴팁 내용" onOpenChange={handleOpenChange}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(button); // hide 유예 시작
      handleOpenChange.mockClear();

      fireEvent.keyDown(document, { key: 'Escape' }); // 유예가 끝나기 전에 Escape

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      expect(handleOpenChange).toHaveBeenCalledTimes(1);

      handleOpenChange.mockClear();

      // 잔여 hide 타이머가 남아있었다면 여기서 다시 닫기를 호출한다
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('hide 유예 중 블러가 발생하면 즉시 닫히고 잔여 hide 타이머가 이후 문제를 일으키지 않는다', () => {
      const handleOpenChange = vi.fn();
      render(
        <Tooltip content="툴팁 내용" onOpenChange={handleOpenChange}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(button); // hide 유예 시작
      handleOpenChange.mockClear();

      fireEvent.blur(button); // 유예가 끝나기 전에 블러 → 즉시 닫힘

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      expect(handleOpenChange).toHaveBeenCalledTimes(1);

      handleOpenChange.mockClear();

      // 잔여 hide 타이머가 남아있었다면 여기서 다시 닫기를 호출한다
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(handleOpenChange).not.toHaveBeenCalled();
    });
  });
});
