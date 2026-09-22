import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

// Tooltip.tsx의 EXIT_DURATION_MS와 반드시 같은 값이어야 한다. isOpen이
// false가 된 뒤 DOM이 실제로 사라지기까지 퇴장 전이 재생 시간만큼 더
// 기다려야 한다 — 그 시간을 만드는 setTimeout은 isOpen 변화를 반영하는
// effect가 플러시된 뒤에야 등록되므로, 닫는 이벤트/타이머 advance와
// 같은 act() 안에서는 잡히지 않고 별도의 advance가 필요하다.
const EXIT_DURATION_MS = 97.5;

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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
      });

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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
      });

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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
      });

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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
      });

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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
      });

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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
      });

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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
      });

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

      // 퇴장 전이가 재생될 시간만큼 더 흘려보내야 DOM이 실제로 사라진다
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS);
      });

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

  describe('모션 잠금 — @keyframes 제거 + O3 최하한', () => {
    // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
    // 읽는다. Tooltip.css.ts 소스 텍스트에서 직접 확인한다(Popover와 동일 관례).
    const cssSource = readFileSync(
      resolve(__dirname, './Tooltip.css.ts'),
      'utf-8'
    );

    it('@keyframes(fadeIn)가 없다 — 등장·퇴장 모두 transition이다', () => {
      expect(cssSource).not.toContain('keyframes');
      expect(cssSource).not.toContain('fadeIn');
      expect(cssSource).not.toContain('animation:');
    });

    it('transition: all이 없다', () => {
      expect(cssSource).not.toMatch(/transition:\s*['`]all/);
    });

    it("'use client'가 없다", () => {
      expect(cssSource).not.toContain('use client');
    });

    it('등장 전이가 duration.fast(변경 없음) / easing.settle이다', () => {
      expect(cssSource).toContain(
        'opacity ${themeContract.animation.duration.fast} ${themeContract.animation.easing.settle}'
      );
    });

    it('퇴장 전이가 calc(duration.fast * 0.65) / easing.exit이다(리터럴 ms 금지)', () => {
      expect(cssSource).toContain(
        'calc(${themeContract.animation.duration.fast} * 0.65) ${themeContract.animation.easing.exit}'
      );
      expect(cssSource).not.toMatch(/97\.5ms/);
    });

    it.each([
      ['top', 'translateY(-6px)', 'translateY(-8px)'],
      ['bottom', 'translateY(6px)', 'translateY(8px)'],
      ['left', 'translateX(-6px)', 'translateX(-8px)'],
      ['right', 'translateX(6px)', 'translateX(8px)'],
    ])(
      'position="%s"일 때 채널이 opacity + translateY 2px다(닫힘 %s → 열림 %s)',
      (_position, closedTranslate, openTranslate) => {
        expect(cssSource).toContain(closedTranslate);
        expect(cssSource).toContain(openTranslate);
      }
    );

    it('O3 — Popover(scale 채널, duration.base)보다 채널·길이가 작다(오버레이계 최하한)', () => {
      const popoverSource = readFileSync(
        resolve(__dirname, '../Popover/Popover.css.ts'),
        'utf-8'
      );
      // Tooltip은 scale 채널을 쓰지 않는다 — Popover보다 가벼운 채널(opacity+
      // translateY)만 쓴다.
      expect(cssSource).not.toContain('scale(');
      expect(popoverSource).toContain('scale(0.95)');
      // Tooltip은 duration.fast, Popover는 duration.base를 쓴다 — fast가
      // base보다 짧다(150ms < 200ms).
      expect(cssSource).toContain('duration.fast');
      expect(popoverSource).toContain('duration.base');
    });

    it('M2→M3 계약 주석(O3 — 오버레이계 최하한)이 남아있다', () => {
      expect(cssSource).toContain('오버레이계의 최하한');
    });
  });

  describe('조항 1 — 중단 가능·역재생 가능', () => {
    it('퇴장 도중 다시 호버하면 언마운트 타이머가 취소되고 DOM이 유지된다(현재 위치에서 이어진다)', () => {
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

      // 블러는 유예 없이 즉시 닫는다 — 퇴장 타이머(97.5ms)가 예약된다.
      fireEvent.blur(button);

      // 타이머가 끝나기 전에(절반 지점) 다시 포커스한다 — 처음부터 다시
      // 마운트되는 게 아니라 같은 DOM 노드가 계속 살아 있어야 한다(조항 1 ③).
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS / 2);
      });
      const tooltipBeforeReopen = screen.getByRole('tooltip');
      fireEvent.focus(button);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByRole('tooltip')).toBe(tooltipBeforeReopen);

      // 원래 퇴장 타이머가 그대로 발화했다면 이 시점에 사라졌을 것이다 —
      // 취소되지 않았다면 실패한다.
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS / 2);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('그레이스 타이머 동결 (WCAG 1.4.13)', () => {
    it('hide 유예(HIDE_GRACE_MS) 동안은 isOpen이 그대로라 전이가 돌지 않는다 — 열림 클래스가 유지된다', () => {
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
      const openClassName = tooltip.className;
      expect(openClassName).toContain('positionOpenStyles');

      fireEvent.mouseLeave(button); // hide 유예 시작(300ms)

      // 유예 중간 지점 — isOpen은 아직 true다(그레이스 타이머가 끝나야
      // setOpen(false)가 불린다). 전이를 일으키는 클래스가 바뀌면 안 된다.
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByRole('tooltip').className).toBe(openClassName);

      // 유예 중 다시 들어오면(hover-persistence) 닫기가 취소되고 그대로
      // 열림 상태를 유지한다
      fireEvent.mouseEnter(tooltip);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('tooltip').className).toBe(openClassName);
    });
  });

  describe('빠른 호버 아웃/인 반복 — 타이머 누수 없음', () => {
    it('빠르게 mouseLeave→mouseEnter를 반복해도 열림 상태로 수렴하고 잔여 타이머가 뒤늦게 닫지 않는다', () => {
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

      // 유예 시간(300ms)보다 짧은 간격으로 나갔다 들어왔다를 반복한다
      for (let i = 0; i < 5; i += 1) {
        fireEvent.mouseLeave(button);
        act(() => {
          vi.advanceTimersByTime(50);
        });
        fireEvent.mouseEnter(button);
        act(() => {
          vi.advanceTimersByTime(50);
        });
      }

      // 반복 끝에 열림 상태로 수렴했다 — 닫히지 않았다
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      // 충분히 기다려도 잔여 타이머가 뒤늦게 닫지 않는다
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });
});
