import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avatar } from '../Avatar';
import { Popover } from './Popover';
import { bubbleSpec } from './Popover.css';
import { bubbleStyles } from '../../_internal/bubble';
import { themeContract } from '../../tokens/theme.css';

// 조항 3: 퇴장 = 등장 * 0.65. calc(duration.slow * 0.65) = 300ms * 0.65 = 195ms.
// Popover.tsx의 EXIT_DURATION_MS와 반드시 같은 값이어야 한다.
const EXIT_DURATION_MS = 195;

describe('Popover', () => {
  describe('렌더링 테스트', () => {
    it('children(트리거)이 렌더링된다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      expect(screen.getByText('트리거')).toBeInTheDocument();
    });

    it('기본 상태에서 content는 표시되지 않는다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
    });
  });

  describe('클릭 열기/닫기 테스트', () => {
    it('트리거 클릭 시 content가 표시된다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });

    describe('가짜 타이머 사용', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
      });

      it('트리거를 다시 클릭하면 content가 닫힌다', async () => {
        render(
          <Popover content={<div>팝오버 내용</div>}>
            <button>트리거</button>
          </Popover>
        );

        fireEvent.click(screen.getByText('트리거'));
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        fireEvent.click(screen.getByText('트리거'));
        // 퇴장 전이(195ms) 동안엔 DOM이 즉시 사라지지 않는다. transition이
        // 재생될 자리가 있어야 한다(조항 1: 일회성 @keyframes 금지의 반대편).
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(EXIT_DURATION_MS - 1);
        });
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(1);
        });
        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
      });
    });
  });

  describe('바깥 클릭 닫기 테스트', () => {
    describe('가짜 타이머 사용', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
      });

      it('팝오버 외부를 클릭하면 닫힌다', async () => {
        render(
          <div>
            <Popover content={<div>팝오버 내용</div>}>
              <button>트리거</button>
            </Popover>
            <button>외부 버튼</button>
          </div>
        );

        fireEvent.click(screen.getByText('트리거'));
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByText('외부 버튼'));
        act(() => {
          vi.advanceTimersByTime(EXIT_DURATION_MS);
        });
        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
      });
    });

    it('closeOnOutsideClick=false이면 외부 클릭으로 닫히지 않는다', async () => {
      render(
        <div>
          <Popover content={<div>팝오버 내용</div>} closeOnOutsideClick={false}>
            <button>트리거</button>
          </Popover>
          <button>외부 버튼</button>
        </div>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByText('외부 버튼'));
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });
  });

  describe('ESC 닫기 테스트', () => {
    describe('가짜 타이머 사용', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
      });

      it('Escape 키를 누르면 팝오버가 닫힌다', async () => {
        render(
          <Popover content={<div>팝오버 내용</div>}>
            <button>트리거</button>
          </Popover>
        );

        fireEvent.click(screen.getByText('트리거'));
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });
        act(() => {
          vi.advanceTimersByTime(EXIT_DURATION_MS);
        });
        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
      });
    });

    it('closeOnEscape=false이면 Escape로 닫히지 않는다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>} closeOnEscape={false}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });
  });

  describe('position prop 테스트', () => {
    it('기본 position은 "bottom"이다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_bottom/);
    });

    it('position="top"일 때 적절한 클래스가 적용된다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} position="top">
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_top/);
    });

    it('position="left"일 때 적절한 클래스가 적용된다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} position="left">
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_left/);
    });

    it('position="right"일 때 적절한 클래스가 적용된다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} position="right">
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_right/);
    });
  });

  describe('제어 모드 테스트', () => {
    it('open=true이면 content가 표시된다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>} open={true}>
          <button>트리거</button>
        </Popover>
      );

      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });

    it('첫 렌더링부터 open=true이면 닫힘이 아닌 열림 위치 클래스를 갖는다', () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} open={true}>
          <button>트리거</button>
        </Popover>
      );

      const popover = container.querySelector('[role="dialog"]');
      expect(popover).toHaveClass(/positionOpenStyles_bottom/);
    });

    it('open=false이면 content가 숨겨진다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>} open={false}>
          <button>트리거</button>
        </Popover>
      );

      expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
    });

    it('트리거 클릭 시 onOpenChange가 호출된다', async () => {
      const handleOpenChange = vi.fn();
      render(
        <Popover
          content={<div>팝오버 내용</div>}
          open={false}
          onOpenChange={handleOpenChange}
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });

    it('ESC 시 onOpenChange(false)가 호출된다', async () => {
      const handleOpenChange = vi.fn();
      render(
        <Popover
          content={<div>팝오버 내용</div>}
          open={true}
          onOpenChange={handleOpenChange}
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('비제어 모드 테스트', () => {
    describe('가짜 타이머 사용', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
      });

      it('내부 상태로 열기/닫기가 동작한다', async () => {
        render(
          <Popover content={<div>팝오버 내용</div>}>
            <button>트리거</button>
          </Popover>
        );

        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('트리거'));
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

        fireEvent.click(screen.getByText('트리거'));
        act(() => {
          vi.advanceTimersByTime(EXIT_DURATION_MS);
        });
        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
      });
    });

    it('onOpenChange 콜백이 호출된다', async () => {
      const handleOpenChange = vi.fn();
      render(
        <Popover
          content={<div>팝오버 내용</div>}
          onOpenChange={handleOpenChange}
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(handleOpenChange).toHaveBeenCalledWith(true);

      fireEvent.click(screen.getByText('트리거'));
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('disabled 테스트', () => {
    it('disabled 상태에서 클릭해도 열리지 않는다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>} disabled>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('트리거 버튼 자신에 aria-haspopup="dialog"가 설정된다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      expect(screen.getByRole('button', { name: '트리거' })).toHaveAttribute(
        'aria-haspopup',
        'dialog'
      );
    });

    it('닫힌 상태에서 버튼이 expanded: false이다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      expect(
        screen.getByRole('button', { name: '트리거', expanded: false })
      ).toBeInTheDocument();
    });

    it('열린 상태에서 버튼이 expanded: true이다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByRole('button', { name: '트리거' }));

      expect(
        screen.getByRole('button', { name: '트리거', expanded: true })
      ).toBeInTheDocument();
    });

    it('안쪽 래퍼 div에는 트리거 속성이 없다(회귀 가드)', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      const wrapper = screen.getByRole('button', { name: '트리거' })
        .parentElement as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper).not.toHaveAttribute('aria-expanded');
      expect(wrapper).not.toHaveAttribute('aria-haspopup');
      expect(wrapper).not.toHaveAttribute('aria-controls');
    });

    it('자식의 기존 onClick이 불리고 팝오버도 열린다', () => {
      const onClick = vi.fn();
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button onClick={onClick}>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByRole('button', { name: '트리거' }));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });

    it('Avatar 자식: onClick 없이도 버튼이고 Enter로 열리며 aria-expanded가 버튼에 있다', async () => {
      const user = userEvent.setup();
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <Avatar alt="프로필" />
        </Popover>
      );

      const button = screen.getByRole('button', { name: '프로필' });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      button.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button.querySelector('[aria-expanded]')).toBeNull();
    });

    it('Avatar 자식: Escape로 닫으면 포커스가 그 Avatar 버튼으로 돌아온다', async () => {
      const user = userEvent.setup();
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <Avatar alt="프로필" />
        </Popover>
      );

      const button = screen.getByRole('button', { name: '프로필' });
      button.focus();
      await user.keyboard('{Enter}');
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
    });

    it('팝오버에 role="dialog"가 있다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('버튼의 aria-controls가 팝오버 id와 같다', async () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      const button = screen.getByRole('button', { name: '트리거' });
      expect(button).not.toHaveAttribute('aria-controls');

      fireEvent.click(button);

      const popoverId = screen.getByRole('dialog').getAttribute('id');
      expect(popoverId).toBeTruthy();
      expect(button).toHaveAttribute('aria-controls', popoverId);
    });
  });

  describe('포커스 관리 테스트', () => {
    it('열릴 때 팝오버 내 첫 focusable 요소에 포커스된다', async () => {
      render(
        <Popover
          content={
            <div>
              <button>첫 번째</button>
              <button>두 번째</button>
            </div>
          }
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByText('첫 번째'));
      });
    });

    it('닫힐 때 트리거에 포커스가 복귀한다', async () => {
      render(
        <Popover
          content={
            <div>
              <button>내부 버튼</button>
            </div>
          }
        >
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByText('내부 버튼'));
      });

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByText('트리거'));
      });
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 컨테이너에 적용된다', () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} className="custom-class">
          <button>트리거</button>
        </Popover>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('arrow prop 테스트', () => {
    it('arrow=true이면 화살표가 표시된다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>} arrow>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const arrowEl = container.querySelector('[data-popover-arrow]');
      expect(arrowEl).toBeInTheDocument();
    });

    it('기본적으로 화살표는 표시되지 않는다', async () => {
      const { container } = render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));

      const arrowEl = container.querySelector('[data-popover-arrow]');
      expect(arrowEl).not.toBeInTheDocument();
    });
  });

  describe('모션 잠금 — @keyframes 제거 + transform-origin', () => {
    // vanilla-extract가 스타일을 클래스로 직렬화해서 jsdom에서 계산값을 못
    // 읽는다. 클래스 대신 _internal/bubble.ts가 만든 스타일 객체를 직접 읽는다.
    // 객체의 값은 Popover.css.ts가 export한 bubbleSpec에서 나온다.
    const cssSource = readFileSync(
      resolve(__dirname, './Popover.css.ts'),
      'utf-8'
    );
    const { closed, open } = bubbleStyles(bubbleSpec);
    const { duration, easing } = themeContract.animation;
    const POSITIONS = ['top', 'bottom', 'left', 'right'] as const;

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

    it('Popover.css.ts는 positionStyles·positionOpenStyles를 bubbleStyles 결과로 만든다', () => {
      expect(cssSource).toContain('bubbleStyles(bubbleSpec)');
      expect(cssSource).toContain('styleVariants(bubble.closed)');
      expect(cssSource).toContain('styleVariants(bubble.open)');
    });

    it.each([
      ['top', 'bottom center'],
      ['bottom', 'top center'],
      ['left', 'right center'],
      ['right', 'left center'],
    ] as const)(
      'position="%s"일 때 transform-origin이 화살표 쪽(%s)이다',
      (position, origin) => {
        // 닫힘·열림 둘 다 같은 origin이어야 펼쳐지는 방향이 유지된다.
        expect(closed[position].transformOrigin).toBe(origin);
        expect(open[position].transformOrigin).toBe(origin);
      }
    );

    it('퇴장 전이가 calc(duration.slow * 0.65) / easing.exit이다(리터럴 ms 금지)', () => {
      expect(closed.top.transition).toContain(
        `calc(${duration.slow} * 0.65) ${easing.exit}`
      );
      expect(cssSource).not.toMatch(/(130|195)ms/);
    });

    it.each(POSITIONS)(
      'position="%s" 닫힘 transform에 scale(0.6)이 있다(오버슛이 보일 만큼 작게 시작)',
      (position) => {
        expect(closed[position].transform).toMatch(/scale\(0\.6\)$/);
        expect(closed[position].transform).not.toContain('scale(0.95)');
      }
    );

    it.each(POSITIONS)(
      'position="%s" 열림 transform은 slow/snap, opacity는 fast/settle이다(커브가 다르다)',
      (position) => {
        const list = String(open[position].transition);
        expect(list).toContain(`transform ${duration.slow} ${easing.snap}`);
        expect(list).toContain(`opacity ${duration.fast} ${easing.settle}`);
      }
    );

    it.each(POSITIONS)(
      'position="%s" 닫힘 변형이 히트 테스트와 접근성 트리에서 빠진다(리뷰 I1)',
      (position) => {
        // shouldRender가 닫은 뒤에도 노드를 195ms 더 남긴다. opacity: 0은
        // 둘 중 어느 쪽에서도 요소를 빼지 않아서, 그 사이 클릭이 보이지 않는
        // 팝오버에 먹히고 Tab이 닫힌 dialog 안으로 들어간다.
        // 무엇을 뒤집으면 빨개지는가: 두 줄 중 하나라도 지우면.
        expect(closed[position].pointerEvents).toBe('none');
        expect(closed[position].visibility).toBe('hidden');
      }
    );

    it.each(POSITIONS)(
      'position="%s" 닫힘 변형의 visibility가 퇴장 길이를 다 쓴다 — 페이드가 살아 있다(리뷰 I1)',
      (position) => {
        // visibility는 한쪽 끝이 visible이면 중간값이 전부 visible이고 p=1에서만
        // 넘어간다. 그래서 퇴장과 같은 길이를 주면 페이드가 다 보인 뒤에 숨는다.
        // 무엇을 뒤집으면 빨개지는가: 길이를 0s로 바꾸면(= 페이드가 통째로 죽는다).
        const list = String(closed[position].transition);
        expect(list).toContain(
          `visibility calc(${duration.slow} * 0.65) ${easing.exit}`
        );
        expect(list).not.toContain('visibility 0s');
      }
    );

    it.each(POSITIONS)(
      'position="%s" 열림 변형은 지연 없이 즉시 visible이다(리뷰 I1)',
      (position) => {
        // 열림 쪽 목록에 visibility가 있으면 열 때도 끝에서 넘어가 첫 프레임이
        // 안 보인다 — 등장 페이드가 죽는다.
        // 무엇을 뒤집으면 빨개지는가: 열림 transition에 visibility를 끼워 넣으면.
        expect(open[position].visibility).toBe('visible');
        expect(String(open[position].transition)).not.toContain('visibility');
      }
    );
  });

  describe('조항 1 — 중단 가능·역재생 가능', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('퇴장 도중 다시 열면 언마운트 타이머가 취소되고 DOM이 유지된다(현재 위치에서 이어진다)', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

      // 닫는다. 퇴장 타이머(195ms)가 예약된다.
      fireEvent.click(screen.getByText('트리거'));

      // 타이머가 끝나기 전에(예: 100ms) 다시 연다. 처음부터 다시 마운트되는
      // 게 아니라 같은 DOM 노드가 계속 살아 있어야 한다(조항 1 ③).
      act(() => {
        vi.advanceTimersByTime(100);
      });
      const popoverBeforeReopen = screen.getByText('팝오버 내용');
      fireEvent.click(screen.getByText('트리거'));
      expect(screen.getByText('팝오버 내용')).toBe(popoverBeforeReopen);

      // 이 단정만으로는 타이머 취소를 잠그지 못한다. 렌더 중 보정(열림이면
      // 다시 렌더)이 있어서 낡은 타이머가 발화해도 DOM은 곧바로 되살아난다.
      // 취소는 아래 이중 순환 테스트가 잠근다.
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();
    });

    it('이중 순환: 퇴장 도중 다시 열었다 닫으면 두 번째 퇴장이 자기 길이를 다 채운 뒤에 사라진다', () => {
      render(
        <Popover content={<div>팝오버 내용</div>}>
          <button>트리거</button>
        </Popover>
      );

      fireEvent.click(screen.getByText('트리거'));
      fireEvent.click(screen.getByText('트리거')); // 닫기: 첫 퇴장 타이머(195ms)
      act(() => {
        vi.advanceTimersByTime(100);
      });
      fireEvent.click(screen.getByText('트리거')); // 재진입: 첫 타이머가 취소돼야 한다
      act(() => {
        vi.advanceTimersByTime(5);
      });
      fireEvent.click(screen.getByText('트리거')); // 다시 닫기: 두 번째 퇴장 195ms

      // 첫 타이머가 남아 있으면 닫은 지 90ms 뒤에 노드를 일찍 지운다. 사용자는
      // 두 번째 퇴장 전이가 중간에 잘리는 것을 본다.
      act(() => {
        vi.advanceTimersByTime(EXIT_DURATION_MS - 1);
      });
      expect(screen.getByText('팝오버 내용')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument();
    });
  });
});
