import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';
import { Popover } from '../Popover';
import { bubbleSpec as popoverBubbleSpec } from '../Popover/Popover.css';
import { bubbleSpec } from './Tooltip.css';
import { bubbleStyles } from '../../_internal/bubble';
import { themeContract } from '../../tokens/theme.css';
import { duration } from '../../tokens/animation.css';

// Tooltip.tsx의 EXIT_DURATION_MS와 반드시 같은 값이어야 한다. isOpen이
// false가 된 뒤 DOM이 실제로 사라지기까지 퇴장 전이 재생 시간만큼 더
// 기다려야 한다 — 그 시간을 만드는 setTimeout은 isOpen 변화를 반영하는
// effect가 플러시된 뒤에야 등록되므로, 닫는 이벤트/타이머 advance와
// 같은 act() 안에서는 잡히지 않고 별도의 advance가 필요하다.
const EXIT_DURATION_MS = 130;

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

    // container.querySelector('[aria-describedby]')는 래퍼에 붙어도 통과한다.
    // 스크린 리더가 읽는 것은 포커스되는 요소이므로 button 역할로 찾는다.
    const openTooltip = () => {
      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(200);
      });
    };

    it('aria-describedby가 트리거 버튼에 붙고 툴팁 id를 가리킨다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      openTooltip();

      const tooltipId = screen.getByRole('tooltip').getAttribute('id');
      expect(tooltipId).toBeTruthy();
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-describedby',
        tooltipId
      );
    });

    it('닫혀 있으면 버튼에 aria-describedby가 없다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      expect(screen.getByRole('button')).not.toHaveAttribute(
        'aria-describedby'
      );
    });

    it('래퍼 div에는 aria-describedby가 없다(회귀 가드)', () => {
      const { container } = render(
        <Tooltip content="툴팁 내용">
          <button>호버하세요</button>
        </Tooltip>
      );

      openTooltip();

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper).not.toHaveAttribute('aria-describedby');
    });

    it('자식이 이미 aria-describedby를 가지면 공백으로 합친다', () => {
      render(
        <Tooltip content="툴팁 내용">
          <button aria-describedby="hint">호버하세요</button>
        </Tooltip>
      );

      openTooltip();

      const tooltipId = screen.getByRole('tooltip').getAttribute('id');
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-describedby',
        `hint ${tooltipId}`
      );
    });

    it('받은 aria-describedby도 자식 것·자기 것과 합친다', () => {
      render(
        <Tooltip content="툴팁 내용" aria-describedby="outer">
          <button aria-describedby="hint">호버하세요</button>
        </Tooltip>
      );

      openTooltip();

      const tooltipId = screen.getByRole('tooltip').getAttribute('id');
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-describedby',
        `hint outer ${tooltipId}`
      );
    });
  });

  describe('Popover 안에 넣기 (리뷰 M6)', () => {
    it('버튼 하나가 aria-expanded·aria-haspopup·aria-describedby를 모두 갖고 클릭으로 팝오버가 열린다', () => {
      render(
        <Popover content={<div>메뉴 내용</div>}>
          <Tooltip content="더보기 툴팁">
            <button>더보기</button>
          </Tooltip>
        </Popover>
      );

      const button = screen.getByRole('button', { name: '더보기' });
      fireEvent.mouseEnter(button);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      fireEvent.click(button);

      expect(screen.getByText('메뉴 내용')).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).toHaveAttribute(
        'aria-describedby',
        screen.getByRole('tooltip').getAttribute('id')
      );
      expect(button).toHaveAttribute(
        'aria-controls',
        screen.getByRole('dialog').getAttribute('id')
      );
    });

    it('툴팁 노드를 눌러도 팝오버가 닫히지 않는다(툴팁이 Popover 루트의 DOM 자손이다)', () => {
      render(
        <Popover content={<div>메뉴 내용</div>}>
          <Tooltip content="더보기 툴팁" delay={0}>
            <button>더보기</button>
          </Tooltip>
        </Popover>
      );

      const button = screen.getByRole('button', { name: '더보기' });
      fireEvent.mouseEnter(button);
      fireEvent.click(button);
      const tooltipNode = screen.getByRole('tooltip');

      // Popover의 바깥 클릭 감지는 mousedown이 루트 밖일 때만 닫는다.
      fireEvent.mouseDown(tooltipNode);
      fireEvent.mouseUp(tooltipNode);
      fireEvent.click(tooltipNode);

      expect(screen.getByText('메뉴 내용')).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('aria-expanded·aria-haspopup·aria-controls가 어떤 div에도 붙지 않는다', () => {
      const { container } = render(
        <Popover content={<div>메뉴 내용</div>}>
          <Tooltip content="더보기 툴팁">
            <button>더보기</button>
          </Tooltip>
        </Popover>
      );

      fireEvent.click(screen.getByRole('button', { name: '더보기' }));

      for (const div of container.querySelectorAll('div')) {
        expect(div).not.toHaveAttribute('aria-expanded');
        expect(div).not.toHaveAttribute('aria-haspopup');
        expect(div).not.toHaveAttribute('aria-controls');
      }
      expect(container.querySelectorAll('[aria-expanded]')).toHaveLength(1);
    });

    it('받은 onClick은 자식의 onClick을 먼저 부르고 합성한다', () => {
      const calls: string[] = [];
      render(
        <Tooltip content="툴팁" onClick={() => calls.push('받은 것')}>
          <button onClick={() => calls.push('자식')}>버튼</button>
        </Tooltip>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(calls).toEqual(['자식', '받은 것']);
    });

    it('aria-가 아닌 props(data-*)는 래퍼에 남는다', () => {
      const { container } = render(
        <Tooltip content="툴팁" data-testid="wrapper" aria-label="자식행">
          <button>버튼</button>
        </Tooltip>
      );

      expect(container.firstChild).toHaveAttribute('data-testid', 'wrapper');
      expect(container.firstChild).not.toHaveAttribute('aria-label');
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        '자식행'
      );
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

  describe('모션 잠금: bubble + O3 최하한', () => {
    // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
    // 읽는다. 클래스 대신 _internal/bubble.ts가 만든 스타일 객체를 직접 읽는다.
    // 객체의 값은 Tooltip.css.ts가 export한 bubbleSpec에서 나온다.
    const cssSource = readFileSync(
      resolve(__dirname, './Tooltip.css.ts'),
      'utf-8'
    );
    const { closed, open } = bubbleStyles(bubbleSpec);
    const popover = bubbleStyles(popoverBubbleSpec);
    const { duration: dur, easing } = themeContract.animation;
    const POSITIONS = ['top', 'bottom', 'left', 'right'] as const;

    it('@keyframes(fadeIn)가 없다. 등장·퇴장 모두 transition이다', () => {
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

    it('Tooltip.css.ts는 positionStyles·positionOpenStyles를 bubbleStyles 결과로 만든다', () => {
      expect(cssSource).toContain('bubbleStyles(bubbleSpec)');
      expect(cssSource).toContain('styleVariants(bubble.closed)');
      expect(cssSource).toContain('styleVariants(bubble.open)');
    });

    it.each(POSITIONS)(
      'position="%s" 닫힘 transform에 scale(0.8)이 있고 열림은 scale(1)이다',
      (position) => {
        expect(closed[position].transform).toMatch(/scale\(0\.8\)$/);
        expect(open[position].transform).toMatch(/scale\(1\)$/);
      }
    );

    it.each([
      ['top', 'translateY(-6px)', 'translateY(-8px)'],
      ['bottom', 'translateY(6px)', 'translateY(8px)'],
      ['left', 'translateX(-6px)', 'translateX(-8px)'],
      ['right', 'translateX(6px)', 'translateX(8px)'],
    ] as const)(
      'position="%s" 닫힘 오프셋이 %s, 열림 오프셋이 %s다',
      (position, closedTranslate, openTranslate) => {
        expect(closed[position].transform).toContain(closedTranslate);
        expect(open[position].transform).toContain(openTranslate);
      }
    );

    it.each([
      ['top', 'bottom center'],
      ['bottom', 'top center'],
      ['left', 'right center'],
      ['right', 'left center'],
    ] as const)(
      'position="%s"일 때 transform-origin이 화살표 쪽(%s)이다',
      (position, origin) => {
        expect(closed[position].transformOrigin).toBe(origin);
        expect(open[position].transformOrigin).toBe(origin);
      }
    );

    it.each(POSITIONS)(
      'position="%s" 열림 transform은 base/snap, opacity는 fast/settle이다(커브가 다르다)',
      (position) => {
        expect(open[position].transition).toBe(
          `opacity ${dur.fast} ${easing.settle}, transform ${dur.base} ${easing.snap}`
        );
      }
    );

    it('퇴장 전이가 calc(duration.base * 0.65) / easing.exit이다(리터럴 ms 금지)', () => {
      const exit = `calc(${dur.base} * 0.65) ${easing.exit}`;
      expect(closed.top.transition).toBe(
        `opacity ${exit}, transform ${exit}, visibility ${exit}`
      );
      const code = cssSource.replace(/\/\/.*$/gm, '');
      expect(code).not.toMatch(/\d+(\.\d+)?ms/);
    });

    it('EXIT_DURATION_MS(130)가 퇴장 길이 base * 0.65와 같다', () => {
      expect(parseFloat(duration.base) * 0.65).toBe(EXIT_DURATION_MS);
    });

    it.each(POSITIONS)(
      'position="%s" 닫힘 변형이 히트 테스트와 접근성 트리에서 빠진다(리뷰 I1)',
      (position) => {
        // shouldRender가 닫은 뒤에도 노드를 130ms 더 남긴다. opacity: 0은
        // 둘 중 어느 쪽에서도 요소를 빼지 않아서, 그 사이 클릭이 보이지 않는
        // 툴팁에 먹히고 스크린 리더가 닫힌 툴팁을 읽는다.
        expect(closed[position].pointerEvents).toBe('none');
        expect(closed[position].visibility).toBe('hidden');
      }
    );

    it.each(POSITIONS)(
      'position="%s" 열림 변형은 지연 없이 즉시 visible이다(리뷰 I1)',
      (position) => {
        expect(open[position].visibility).toBe('visible');
        expect(String(open[position].transition)).not.toContain('visibility');
      }
    );

    describe('O3: Popover보다 가볍다(목적은 그대로, 수단은 값)', () => {
      // 두 컴포넌트가 같은 bubbleStyles를 부르므로 함수에 넘기는 인자를 비교한다.
      const ms = (name: keyof typeof duration) => parseFloat(duration[name]);

      it('시작 scale이 Popover보다 크다(이동이 작다): 0.8 > 0.6', () => {
        expect(bubbleSpec.scale).toBe(0.8);
        expect(popoverBubbleSpec.scale).toBe(0.6);
        expect(bubbleSpec.scale).toBeGreaterThan(popoverBubbleSpec.scale);
      });

      it('등장 길이가 Popover보다 짧다: base < slow', () => {
        expect(bubbleSpec.enterTransform.duration).toBe('base');
        expect(popoverBubbleSpec.enterTransform.duration).toBe('slow');
        expect(ms(bubbleSpec.enterTransform.duration)).toBeLessThan(
          ms(popoverBubbleSpec.enterTransform.duration)
        );
      });

      it('퇴장 길이가 Popover보다 짧다', () => {
        expect(ms(bubbleSpec.exitDuration)).toBeLessThan(
          ms(popoverBubbleSpec.exitDuration)
        );
      });

      it('위 인자가 실제 스타일에 반영된다(두 컴포넌트의 객체가 다르다)', () => {
        expect(closed.top.transform).not.toBe(popover.closed.top.transform);
        expect(open.top.transition).not.toBe(popover.open.top.transition);
        expect(closed.top.transition).not.toBe(popover.closed.top.transition);
      });
    });

    it('M2→M3 계약 주석(O3: 오버레이계 최하한)이 남아있다', () => {
      expect(cssSource).toContain('오버레이계의 최하한');
    });
  });

  describe('조항 1 — 중단 가능·역재생 가능', () => {
    it('EXIT_DURATION_MS 경계: 130ms 직전에는 DOM이 있고 직후에는 없다', () => {
      render(
        <Tooltip content="툴팁 내용" delay={0}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.focus(button);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      // 블러는 유예 없이 즉시 닫는다. 퇴장 타이머(130ms)가 예약된다.
      fireEvent.blur(button);

      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS - 1);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('퇴장 도중 다시 호버하면 언마운트 타이머가 취소되고 DOM이 유지된다(현재 위치에서 이어진다)', () => {
      render(
        <Tooltip content="툴팁 내용" delay={0}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      // 블러는 유예 없이 즉시 닫는다. 퇴장 타이머(130ms)가 예약된다.
      fireEvent.blur(button);

      // 타이머가 끝나기 전에(절반 지점) 다시 포커스한다 — 처음부터 다시
      // 마운트되는 게 아니라 같은 DOM 노드가 계속 살아 있어야 한다(조항 1 ③).
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS / 2);
      });
      const tooltipBeforeReopen = screen.getByRole('tooltip');
      // delay={0}이라 즉시 열린다. delay가 있으면 재개방 타이머가 같은 act()
      // 안에서 퇴장 타이머와 함께 배치되어, 퇴장 타이머가 취소되지 않아도 DOM이
      // 유지되는 것처럼 보인다(상태 갱신이 한 번에 합쳐지기 때문이다).
      fireEvent.focus(button);
      expect(screen.getByRole('tooltip')).toBe(tooltipBeforeReopen);
      // 다시 열리면 예약돼 있던 언마운트 타이머가 실제로 지워진다. 렌더 중
      // 보정(isOpen && !shouldRender)이 있어서 타이머가 발화해도 DOM은 살아
      // 있으므로, 취소는 남은 타이머 수로만 보인다. delay={0}이라 다른 타이머는 없다.
      expect(vi.getTimerCount()).toBe(0);

      // DOM으로는 타이머 취소가 관찰되지 않는다(렌더 중 보정이 되살린다). 위
      // `getTimerCount`와 아래 이중 순환 테스트가 취소를 잠근다.
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS / 2);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('이중 순환: 퇴장 도중 다시 열었다 닫으면 두 번째 퇴장이 자기 길이를 다 채운 뒤에 사라진다', () => {
      render(
        <Tooltip content="툴팁 내용" delay={0}>
          <button>호버하세요</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.focus(button);
      fireEvent.blur(button); // 닫기: 첫 퇴장 타이머(130ms)
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS / 2);
      });
      fireEvent.focus(button); // 재진입: 첫 타이머가 취소돼야 한다
      act(() => {
        vi.advanceTimersByTime(5);
      });
      fireEvent.blur(button); // 다시 닫기: 두 번째 퇴장 130ms

      // 첫 타이머가 남아 있으면 닫은 지 60ms 뒤에 노드를 일찍 지운다. 사용자는
      // 두 번째 퇴장 전이가 중간에 잘리는 것을 본다.
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS - 1);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
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
