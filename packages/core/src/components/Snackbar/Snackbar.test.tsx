import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Snackbar } from './Snackbar';

describe('Snackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('렌더링 테스트', () => {
    it('open=true일 때 렌더링된다', () => {
      render(<Snackbar open message="테스트 메시지" />);
      expect(
        screen.getByText('테스트 메시지', { selector: 'span' })
      ).toBeInTheDocument();
    });

    it('open=false일 때 렌더링되지 않는다', () => {
      render(<Snackbar open={false} message="테스트 메시지" />);
      expect(screen.queryByText('테스트 메시지')).not.toBeInTheDocument();
    });

    it('message를 표시한다', () => {
      render(<Snackbar open message="알림 메시지" />);
      expect(
        screen.getByText('알림 메시지', { selector: 'span' })
      ).toBeInTheDocument();
    });
  });

  describe('severity prop 테스트', () => {
    it('success severity를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="성공" severity="success" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('success');
    });

    it('error severity를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="에러" severity="error" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('error');
    });

    it('warning severity를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="경고" severity="warning" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('warning');
    });

    it('info severity를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="정보" severity="info" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('info');
    });

    it('기본 severity는 info이다', () => {
      const { container } = render(<Snackbar open message="기본" />);
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('info');
    });
  });

  describe('position prop 테스트', () => {
    it('top-left 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="top-left" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('top-left');
    });

    it('top-center 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="top-center" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('top-center');
    });

    it('top-right 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="top-right" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('top-right');
    });

    it('bottom-left 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="bottom-left" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('bottom-left');
    });

    it('bottom-center 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="bottom-center" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('bottom-center');
    });

    it('bottom-right 위치를 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" position="bottom-right" />
      );
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('bottom-right');
    });

    it('기본 위치는 bottom-center이다', () => {
      const { container } = render(<Snackbar open message="메시지" />);
      const snackbar = container.querySelector('[class*="content"]')
        ?.parentElement as HTMLElement;
      expect(snackbar.className).toContain('bottom-center');
    });
  });

  describe('자동 닫힘 테스트 (타이머)', () => {
    it('autoHideDuration 후에 onClose가 호출된다', () => {
      const handleClose = vi.fn();
      render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={handleClose}
        />
      );

      expect(handleClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('autoHideDuration 기본값은 6000ms이다', () => {
      const handleClose = vi.fn();
      render(<Snackbar open message="메시지" onClose={handleClose} />);

      vi.advanceTimersByTime(5999);
      expect(handleClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('autoHideDuration=null이면 자동으로 닫히지 않는다', () => {
      const handleClose = vi.fn();
      render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={null}
          onClose={handleClose}
        />
      );

      vi.advanceTimersByTime(10000);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('open이 false로 변경되면 타이머가 클리어된다', () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <Snackbar
          open
          message="메시지"
          autoHideDuration={3000}
          onClose={handleClose}
        />
      );

      vi.advanceTimersByTime(1000);

      rerender(
        <Snackbar
          open={false}
          message="메시지"
          autoHideDuration={3000}
          onClose={handleClose}
        />
      );

      // open=false가 shouldRender 지연-언마운트 타이머(EXIT_DURATION_MS)도
      // 같이 예약시키므로, 그 setState가 act() 밖에서 플러시되지 않게 감싼다.
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('닫기 버튼 테스트', () => {
    it('닫기 버튼이 렌더링된다', () => {
      render(<Snackbar open message="메시지" />);
      const closeButton = screen.getByLabelText('닫기');
      expect(closeButton).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
      const user = userEvent.setup({ delay: null });
      const handleClose = vi.fn();
      render(<Snackbar open message="메시지" onClose={handleClose} />);

      const closeButton = screen.getByLabelText('닫기');
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('action prop 테스트', () => {
    it('action 버튼을 렌더링한다', () => {
      const action = <button>실행 취소</button>;
      render(<Snackbar open message="메시지" action={action} />);
      expect(screen.getByText('실행 취소')).toBeInTheDocument();
    });

    it('action 버튼 클릭이 동작한다', async () => {
      const user = userEvent.setup({ delay: null });
      const handleAction = vi.fn();
      const action = <button onClick={handleAction}>실행 취소</button>;
      render(<Snackbar open message="메시지" action={action} />);

      const actionButton = screen.getByText('실행 취소');
      await user.click(actionButton);

      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('접근성 테스트', () => {
    it('시각 상자는 role과 aria-live를 갖지 않는다', () => {
      const { container } = render(<Snackbar open message="메시지" />);
      const snackbar = container.querySelector(
        '[class*="Snackbar_snackbar__"]'
      ) as HTMLElement;
      expect(snackbar).not.toHaveAttribute('role');
      expect(snackbar).not.toHaveAttribute('aria-live');
    });

    it('role="status" 리전이 시각 상자와 별도로 존재한다', () => {
      const { container } = render(<Snackbar open message="메시지" />);
      const snackbar = container.querySelector(
        '[class*="Snackbar_snackbar__"]'
      ) as HTMLElement;
      const region = screen.getByRole('status');
      expect(region).toBeInTheDocument();
      expect(region).not.toBe(snackbar);
    });

    it('닫기 버튼에 aria-label이 있다', () => {
      render(<Snackbar open message="메시지" />);
      const closeButton = screen.getByLabelText('닫기');
      expect(closeButton).toHaveAttribute('aria-label', '닫기');
    });
  });

  describe('라이브 리전 테스트', () => {
    it('open=false여도 role="status" 리전이 DOM에 존재하고 비어 있다', () => {
      render(<Snackbar open={false} message="테스트 메시지" />);
      const region = screen.getByRole('status');
      expect(region).toBeInTheDocument();
      expect(region).toBeEmptyDOMElement();
    });

    it('처음부터 open된 채 마운트해도 리전에 메시지가 채워진다', () => {
      render(<Snackbar open message="처음부터 열림" />);
      const region = screen.getByRole('status');
      expect(region).toHaveTextContent('처음부터 열림');
    });

    it('리전이 severity를 접두사로 함께 읽어 준다', () => {
      // 아이콘은 aria-hidden이라 스크린 리더는 메시지 텍스트만 듣는다.
      // 화면에서 빨간 상자 + 경고 아이콘인 것이 소리로는 그냥 문장이 된다.
      render(<Snackbar open message="저장에 실패했습니다" severity="error" />);
      expect(screen.getByRole('status')).toHaveTextContent(
        '오류: 저장에 실패했습니다'
      );
    });

    it('severity마다 접두사가 다르다', () => {
      const labels = {
        success: '성공',
        error: '오류',
        warning: '경고',
        info: '알림',
      } as const;
      for (const [severity, label] of Object.entries(labels)) {
        const { unmount } = render(
          <Snackbar
            open
            message="메시지"
            severity={severity as keyof typeof labels}
          />
        );
        expect(screen.getByRole('status')).toHaveTextContent(
          `${label}: 메시지`
        );
        unmount();
      }
    });

    it('open이 false가 되면 리전이 비워진다', () => {
      const { rerender } = render(<Snackbar open message="닫히는 메시지" />);
      const region = screen.getByRole('status');
      expect(region).toHaveTextContent('닫히는 메시지');

      rerender(<Snackbar open={false} message="닫히는 메시지" />);
      expect(region).toBeEmptyDOMElement();
    });
  });

  describe('severity 아이콘 테스트', () => {
    it('success severity는 check-circle 아이콘을 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="성공" severity="success" />
      );
      expect(
        container.querySelector('[data-icon="check-circle"]')
      ).toBeInTheDocument();
    });

    it('error severity는 alert-circle 아이콘을 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="에러" severity="error" />
      );
      expect(
        container.querySelector('[data-icon="alert-circle"]')
      ).toBeInTheDocument();
    });

    it('warning severity는 alert-triangle 아이콘을 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="경고" severity="warning" />
      );
      expect(
        container.querySelector('[data-icon="alert-triangle"]')
      ).toBeInTheDocument();
    });

    it('info severity는 info 아이콘을 렌더링한다', () => {
      const { container } = render(
        <Snackbar open message="정보" severity="info" />
      );
      expect(container.querySelector('[data-icon="info"]')).toBeInTheDocument();
    });

    it('severity 아이콘은 접근성 트리에서 숨겨진다', () => {
      const { container } = render(
        <Snackbar open message="메시지" severity="success" />
      );
      const icon = container.querySelector('[data-icon="check-circle"]');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className을 적용한다', () => {
      const { container } = render(
        <Snackbar open message="메시지" className="custom-snackbar" />
      );
      const snackbar =
        container.querySelector('[class*="content"]')?.parentElement;
      expect(snackbar).toHaveClass('custom-snackbar');
    });
  });

  describe('다중 Snackbar 시나리오', () => {
    it('여러 Snackbar를 동시에 렌더링할 수 있다', () => {
      const { container } = render(
        <>
          <Snackbar open message="첫 번째" position="top-center" />
          <Snackbar open message="두 번째" position="bottom-center" />
        </>
      );
      expect(
        screen.getByText('첫 번째', { selector: 'span' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('두 번째', { selector: 'span' })
      ).toBeInTheDocument();
      const snackbars = container.querySelectorAll('[class*="content"]');
      expect(snackbars).toHaveLength(2);
    });
  });

  describe('언마운트 지연 테스트', () => {
    it('open이 false가 돼도 즉시 DOM에서 제거되지 않는다', () => {
      const { container, rerender } = render(
        <Snackbar open message="메시지" />
      );
      rerender(<Snackbar open={false} message="메시지" />);

      expect(container.querySelector('[class*="content"]')).toBeInTheDocument();
    });

    it('일정 시간 후 DOM에서 제거된다', () => {
      const { container, rerender } = render(
        <Snackbar open message="메시지" />
      );
      rerender(<Snackbar open={false} message="메시지" />);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(container.querySelector('[class*="content"]')).toBeNull();
    });

    it('닫히는 도중 다시 열리면 언마운트가 취소된다', () => {
      const { container, rerender } = render(
        <Snackbar open message="메시지" />
      );
      rerender(<Snackbar open={false} message="메시지" />);

      act(() => {
        vi.advanceTimersByTime(100);
      });
      rerender(<Snackbar open message="메시지" />);
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(container.querySelector('[class*="content"]')).toBeInTheDocument();
    });

    it('컴포넌트가 unmount되면 대기 중인 타이머가 정리된다', () => {
      const errorSpy = vi.spyOn(console, 'error');
      const { rerender, unmount } = render(<Snackbar open message="메시지" />);
      rerender(<Snackbar open={false} message="메시지" />);

      unmount();
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('퇴장 중(open=false)엔 스낵바가 inert해 포커스·클릭이 들어가지 않는다', () => {
      const { container, rerender } = render(
        <Snackbar open message="메시지" />
      );
      expect(
        container.querySelector('[class*="content"]')?.parentElement
      ).not.toHaveAttribute('inert');

      rerender(<Snackbar open={false} message="메시지" />);

      expect(
        container.querySelector('[class*="content"]')?.parentElement
      ).toHaveAttribute('inert');
    });
  });
});
