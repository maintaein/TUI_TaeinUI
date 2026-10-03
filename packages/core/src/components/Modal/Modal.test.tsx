import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Modal } from './index';

describe('Modal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링 테스트', () => {
    it('open이 true일 때 모달이 렌더링된다', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('open이 false일 때 모달이 렌더링되지 않는다', () => {
      render(<Modal {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('backdrop이 렌더링된다', () => {
      render(<Modal {...defaultProps} />);
      const backdrop = document.querySelector('[data-backdrop="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('role="dialog"를 가진다', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-modal="true"를 가진다', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('aria-labelledby가 제공될 때 설정된다', () => {
      render(
        <Modal {...defaultProps} aria-labelledby="modal-title">
          <h2 id="modal-title">Modal Title</h2>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('aria-describedby가 제공될 때 설정된다', () => {
      render(
        <Modal {...defaultProps} aria-describedby="modal-desc">
          <p id="modal-desc">Modal Description</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-desc');
    });

    it('aria-label이 제공될 때 설정된다', () => {
      render(<Modal {...defaultProps} aria-label="Custom Modal" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Custom Modal');
    });

    it('Flat title이 있을 때 aria-labelledby가 자동으로 제목과 연결된다', () => {
      render(
        <Modal {...defaultProps} title="자동 제목">
          <p>내용</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      const labelledby = dialog.getAttribute('aria-labelledby');
      expect(labelledby).toBeTruthy();
      expect(document.getElementById(labelledby!)).toHaveTextContent(
        '자동 제목'
      );
    });
  });

  describe('backdrop 클릭 테스트', () => {
    it('backdrop 클릭 시 onClose가 호출된다', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      const backdrop = document.querySelector('[data-backdrop="true"]');

      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closeOnBackdropClick이 false일 때 backdrop 클릭 시 onClose가 호출되지 않는다', () => {
      const onClose = vi.fn();
      render(
        <Modal
          {...defaultProps}
          onClose={onClose}
          closeOnBackdropClick={false}
        />
      );
      const backdrop = document.querySelector('[data-backdrop="true"]');

      fireEvent.click(backdrop!);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('모달 콘텐츠 클릭 시 onClose가 호출되지 않는다', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('Modal Content'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('ESC 키 테스트', () => {
    it('ESC 키 입력 시 onClose가 호출된다', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closeOnEscape가 false일 때 ESC 키 입력 시 onClose가 호출되지 않는다', () => {
      const onClose = vi.fn();
      render(
        <Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('다른 키 입력 시 onClose가 호출되지 않는다', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('포커스 관리 테스트', () => {
    it('모달이 열릴 때 첫 번째 포커스 가능 요소로 포커스가 이동한다', () => {
      render(
        <Modal {...defaultProps}>
          <div>
            <button>First Button</button>
            <button>Second Button</button>
          </div>
        </Modal>
      );

      const firstButton = screen.getByText('First Button');
      expect(firstButton).toHaveFocus();
    });

    it('포커스 가능한 요소가 없을 때 dialog로 포커스가 이동한다', () => {
      render(<Modal {...defaultProps}>Plain text content</Modal>);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveFocus();
    });

    it('모달이 닫힐 때 cleanup 함수가 실행된다', () => {
      const { unmount } = render(<Modal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('포커스 트랩 테스트', () => {
    it('마지막 요소에서 Tab을 누르면 첫 요소로 순환한다', () => {
      render(
        <Modal {...defaultProps}>
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </div>
        </Modal>
      );

      const button1 = screen.getByText('Button 1');
      const button3 = screen.getByText('Button 3');

      button3.focus();
      expect(button3).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Tab' });

      expect(button1).toHaveFocus();
    });

    it('첫 요소에서 Shift+Tab을 누르면 마지막 요소로 순환한다', () => {
      render(
        <Modal {...defaultProps}>
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </div>
        </Modal>
      );

      const button1 = screen.getByText('Button 1');
      const button3 = screen.getByText('Button 3');

      button1.focus();
      expect(button1).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      expect(button3).toHaveFocus();
    });
  });

  describe('size prop 테스트', () => {
    it('size="sm"일 때 dialog가 렌더링된다', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('size="md"일 때 dialog가 렌더링된다 (기본값)', () => {
      render(<Modal {...defaultProps} size="md" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('size="lg"일 때 dialog가 렌더링된다', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('size="xl"일 때 dialog가 렌더링된다', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('size="full"일 때 dialog가 렌더링된다', () => {
      render(<Modal {...defaultProps} size="full" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('className prop 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      render(<Modal {...defaultProps} className="custom-modal" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-modal');
    });
  });

  describe('body scroll 테스트', () => {
    it('모달이 열릴 때 body scroll이 비활성화된다', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('모달이 닫힐 때 body scroll이 복원된다', () => {
      const { rerender } = render(<Modal {...defaultProps} open={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal {...defaultProps} open={false} />);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('애니메이션 테스트', () => {
    it('모달이 열릴 때 backdrop이 렌더링된다', () => {
      render(<Modal {...defaultProps} />);
      const backdrop = document.querySelector('[data-backdrop="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    // 예전엔 퇴장이 `modalBackdropExit` 클래스였고 이 자리에서 클래스 유무를
    // 단언했다. M3 T2가 등장·퇴장을 한 GSAP 타임라인의 양방향으로 바꿨으므로
    // 퇴장 클래스는 존재하지 않는다 — 단언 대상을 "타임라인이 상태를 소유한다"로
    // 옮긴다. 퇴장이 재생될 자리를 남기는지는 아래 `언마운트 지연 테스트`가 잠근다.
    it('등장 시작 상태를 CSS가 아니라 타임라인이 소유한다', () => {
      render(<Modal {...defaultProps} />);

      const backdrop = document.querySelector<HTMLElement>(
        '[data-backdrop="true"]'
      );
      const dialog = screen.getByRole('dialog');

      // fromTo의 시작값은 만들어지는 순간 인라인으로 박힌다(immediateRender) —
      // 첫 페인트가 이미 닫힌 상태라 열린 판이 한 프레임 번쩍이지 않는다.
      expect(backdrop?.style.opacity).toBe('0');
      expect(dialog.style.opacity).toBe('0');
      expect(dialog.style.transform).toContain('scale(0.95, 0.95)');
    });

    it('CSS가 등장·퇴장 모션을 갖지 않는다 (명제 조항 1)', () => {
      const source = readFileSync(resolve(__dirname, 'Modal.css.ts'), 'utf-8');

      expect(source).not.toMatch(/keyframes/);
      expect(source).not.toMatch(/animation:/);
      expect(source).not.toMatch(/export const \w*Exit\w* = style/);
    });
  });

  describe('triggerRef — 버튼 자리에서 자란다', () => {
    /**
     * jsdom은 레이아웃을 구현하지 않아 모든 getBoundingClientRect가 0을 준다.
     * matchMedia와 같은 성격의 환경 보급이다 — 협력 객체를 가짜로 바꾸는 게
     * 아니라, 이 환경에 없는 레이아웃 값을 넣어 준다.
     */
    const installLayout = (
      trigger: { left: number; top: number; width: number; height: number },
      dialogBox: { left: number; top: number; width: number; height: number }
    ) => {
      const toRect = (box: {
        left: number;
        top: number;
        width: number;
        height: number;
      }) =>
        ({
          ...box,
          x: box.left,
          y: box.top,
          right: box.left + box.width,
          bottom: box.top + box.height,
          toJSON: () => box,
        }) as DOMRect;

      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: Element) {
          return toRect(this.matches('[role="dialog"]') ? dialogBox : trigger);
        }
      );
    };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const TriggeredModal = ({
      open,
      withRef = true,
    }: {
      open: boolean;
      withRef?: boolean;
    }) => {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={triggerRef} type="button">
            열기
          </button>
          <Modal
            open={open}
            onClose={() => {}}
            triggerRef={withRef ? triggerRef : undefined}
          >
            Modal Content
          </Modal>
        </>
      );
    };

    it('다이얼로그 중심이 트리거 중심으로 당겨진 상태에서 시작한다', () => {
      // 트리거 중심 (140, 210), 다이얼로그 중심 (500, 300) → 차이 (-360, -90)
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      render(<TriggeredModal open />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.style.transform).toBe('translate(-360px, -90px)');
    });

    it('transform만 쓴다 — 레이아웃 속성은 건드리지 않는다', () => {
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      render(<TriggeredModal open />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.style.top).toBe('');
      expect(dialog.style.left).toBe('');
      expect(dialog.style.width).toBe('');
      expect(dialog.style.height).toBe('');
    });

    it('트리거 크기의 창으로 시작한다. clip-path inset이 (패널-트리거)/2다', () => {
      // 패널 600x400, 트리거 80x20 → 가로 (600-80)/2=260, 세로 (400-20)/2=190
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      render(<TriggeredModal open />);

      expect(screen.getByRole('dialog').style.clipPath).toMatch(
        /^inset\(190px 260px 190px 260px round /
      );
    });

    it('scale을 쓰지 않는다. 비율이 아무리 작아도 글자가 찌그러지지 않는다', () => {
      // 8x8 트리거. 비율을 배율로 쓰면 본문이 사라진다.
      installLayout(
        { left: 0, top: 0, width: 8, height: 8 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      render(<TriggeredModal open />);

      expect(screen.getByRole('dialog').style.transform).not.toContain('scale');
    });

    it('트리거가 패널보다 큰 축은 inset이 0이다', () => {
      // 트리거 폭 800 > 패널 폭 600 → 가로 0. 높이 20 < 400 → 세로 190
      installLayout(
        { left: 0, top: 200, width: 800, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      render(<TriggeredModal open />);

      expect(screen.getByRole('dialog').style.clipPath).toMatch(
        /^inset\(190px 0px 190px 0px round /
      );
    });

    it('알약 트리거의 round는 짧은 변의 절반으로 누른다', () => {
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      const { rerender } = render(<TriggeredModal open={false} />);
      screen.getByRole('button', { name: '열기' }).style.borderTopLeftRadius =
        '9999px';
      rerender(<TriggeredModal open />);

      expect(screen.getByRole('dialog').style.clipPath).toMatch(
        /round 10px\)$/
      );
    });

    it('트리거 반경이 짧은 변의 절반보다 작으면 그대로 쓴다', () => {
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      const { rerender } = render(<TriggeredModal open={false} />);
      screen.getByRole('button', { name: '열기' }).style.borderTopLeftRadius =
        '4px';
      rerender(<TriggeredModal open />);

      expect(screen.getByRole('dialog').style.clipPath).toMatch(/round 4px\)$/);
    });

    it('끝 상태 clip-path의 inset은 음수다. 그림자가 잘리지 않는다', () => {
      // 축소 선호면 gateMotion이 타임라인을 끝 상태로 확정한다.
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
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      render(<TriggeredModal open />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.style.clipPath).toMatch(
        /^inset\(-50px -50px -50px -50px round /
      );
      expect(dialog.style.opacity).toBe('1');
      expect(dialog.style.transform).not.toContain('scale');
      vi.unstubAllGlobals();
    });

    it('직계 자식은 패널과 따로 opacity 0에서 시작한다', () => {
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );
      const Wrapped = () => {
        const ref = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button ref={ref} type="button">
              열기
            </button>
            <Modal open onClose={() => {}} triggerRef={ref}>
              <p>본문</p>
            </Modal>
          </>
        );
      };

      render(<Wrapped />);

      expect(screen.getByText('본문').style.opacity).toBe('0');
    });

    it('CENTER_START 폴백에는 clip-path가 붙지 않는다', () => {
      installLayout(
        { left: 0, top: 0, width: 1000, height: 3000 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      const { rerender } = render(
        <TriggeredModal open={false} withRef={false} />
      );
      rerender(<TriggeredModal open withRef={false} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.style.transform).toBe(
        'translate(0px, -20px) scale(0.95, 0.95)'
      );
      expect(dialog.style.clipPath).toBe('');
    });

    it('triggerRef 없이 버튼에서 열면 그 버튼 자리에서 자란다', () => {
      // 트리거 중심 (140, 210), 다이얼로그 중심 (500, 300) → 차이 (-360, -90)
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      const { rerender } = render(
        <TriggeredModal open={false} withRef={false} />
      );
      act(() => {
        screen.getByRole('button', { name: '열기' }).focus();
      });
      rerender(<TriggeredModal open withRef={false} />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(-360px, -90px)'
      );
    });

    it('활성 요소가 body면 가운데에서 자란다. body는 트리거로 쓰지 않는다', () => {
      // body는 연결돼 있고 크기도 있어 기존 가드를 다 통과한다. 막지 않으면
      // 문서 전체 기준 중심에서 모달이 날아온다.
      installLayout(
        { left: 0, top: 0, width: 1000, height: 3000 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      const { rerender } = render(
        <TriggeredModal open={false} withRef={false} />
      );
      expect(document.activeElement).toBe(document.body);
      rerender(<TriggeredModal open withRef={false} />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(0px, -20px) scale(0.95, 0.95)'
      );
    });

    it('triggerRef를 명시하면 활성 요소를 이긴다', () => {
      const Both = ({ open }: { open: boolean }) => {
        const explicitRef = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button type="button">활성</button>
            <button ref={explicitRef} type="button" data-explicit>
              명시
            </button>
            <Modal open={open} onClose={() => {}} triggerRef={explicitRef}>
              Modal Content
            </Modal>
          </>
        );
      };
      // 두 버튼이 같은 rect를 주면 구별이 안 된다. 명시 버튼만 다른 rect를 준다.
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: Element) {
          const box = this.matches('[role="dialog"]')
            ? { left: 200, top: 100, width: 600, height: 400 }
            : this.matches('[data-explicit]')
              ? { left: 100, top: 200, width: 80, height: 20 }
              : { left: 900, top: 900, width: 50, height: 50 };
          return {
            ...box,
            x: box.left,
            y: box.top,
            right: box.left + box.width,
            bottom: box.top + box.height,
            toJSON: () => box,
          } as DOMRect;
        }
      );

      const { rerender } = render(<Both open={false} />);
      act(() => {
        screen.getByRole('button', { name: '활성' }).focus();
      });
      rerender(<Both open />);

      // 명시 버튼 중심 (140, 210) 기준. 활성 버튼 (925, 925)였다면 값이 다르다.
      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(-360px, -90px)'
      );
    });

    it('활성 요소가 html이면 가운데에서 자란다. html도 트리거로 쓰지 않는다', () => {
      installLayout(
        { left: 0, top: 0, width: 1000, height: 3000 },
        { left: 200, top: 100, width: 600, height: 400 }
      );
      vi.spyOn(document, 'activeElement', 'get').mockReturnValue(
        document.documentElement
      );

      render(<TriggeredModal open withRef={false} />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(0px, -20px) scale(0.95, 0.95)'
      );
    });

    it('triggerRef로 다이얼로그 안의 요소를 명시하면 거절하지 않고 그 자리에서 자란다', () => {
      // 거절은 활성 요소 폴백 경로에만 붙는다. 명시한 ref는 유일한 의도 표명이다.
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      const Inside = () => {
        const innerRef = useRef<HTMLButtonElement>(null);
        return (
          <Modal open onClose={() => {}} triggerRef={innerRef}>
            <button ref={innerRef} type="button">
              안쪽
            </button>
          </Modal>
        );
      };
      render(<Inside />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(-360px, -90px)'
      );
    });

    describe('축소 선호가 뒤집혀 타임라인이 다시 만들어질 때', () => {
      // 이때 포커스는 이미 다이얼로그 안이다. 다이얼로그 자손을 트리거로 치면
      // 열려 있던 모달이 자기 안의 버튼 자리로 접혔다 다시 자란다.
      // jsdom은 matchMedia를 구현하지 않는다. 선호를 바꿀 수 있게 깔아야 한다.
      const listeners = new Set<() => void>();
      let reduce = true;

      beforeEach(() => {
        reduce = true;
        listeners.clear();
        vi.stubGlobal(
          'matchMedia',
          (media: string): MediaQueryList =>
            ({
              get matches() {
                return reduce;
              },
              media,
              addEventListener: (_: string, fn: () => void) =>
                listeners.add(fn),
              removeEventListener: (_: string, fn: () => void) =>
                listeners.delete(fn),
            }) as unknown as MediaQueryList
        );
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('다이얼로그 안에 있는 활성 요소는 트리거로 쓰지 않고 가운데에서 자란다', () => {
        installLayout(
          { left: 100, top: 200, width: 80, height: 20 },
          { left: 200, top: 100, width: 600, height: 400 }
        );

        render(
          <Modal open onClose={() => {}}>
            <button type="button">안쪽</button>
          </Modal>
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);

        act(() => {
          reduce = false;
          listeners.forEach((fn) => fn());
        });

        expect(dialog.style.transform).toBe(
          'translate(0px, -20px) scale(0.95, 0.95)'
        );
      });
    });

    it('활성 요소를 못 읽으면 가운데에서 자란다. 예외를 던지지 않는다', () => {
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );

      render(<TriggeredModal open withRef={false} />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(0px, -20px) scale(0.95, 0.95)'
      );
    });

    it('문서에서 떼어진 트리거면 가운데에서 자란다', () => {
      installLayout(
        { left: 100, top: 200, width: 80, height: 20 },
        { left: 200, top: 100, width: 600, height: 400 }
      );
      const detached = { current: document.createElement('button') };

      render(
        <Modal open onClose={() => {}} triggerRef={detached}>
          Modal Content
        </Modal>
      );

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(0px, -20px) scale(0.95, 0.95)'
      );
    });

    it('레이아웃이 없는 환경(크기 0)이면 가운데에서 자란다', () => {
      // jsdom 기본값 그대로 — getBoundingClientRect를 보급하지 않는다.
      render(<TriggeredModal open />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(0px, -20px) scale(0.95, 0.95)'
      );
    });
  });

  describe('언마운트 지연 테스트', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('open이 false가 돼도 즉시 DOM에서 제거되지 않는다', () => {
      const { rerender } = render(<Modal {...defaultProps} open={true} />);
      rerender(<Modal {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // 퇴장 길이(등장의 65%) 자체는 여기서 잠글 수 없다 — 티커가 없어 타이머가 0ms로
    // 접힌다. 길이는 `useOverlayTransition.test.ts`의
    // `전부 열린 상태에서 닫으면 퇴장 길이가 등장의 65%다`가 잠근다. 여기서 잠그는 건
    // "애니메이션 이벤트가 아니라 타이머가 DOM을 내린다"는 것뿐이다.
    it('퇴장 타이머가 끝나면 DOM에서 제거된다', () => {
      const { rerender } = render(<Modal {...defaultProps} open={true} />);
      rerender(<Modal {...defaultProps} open={false} />);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // "닫히는 도중 다시 열리면 언마운트가 취소된다"를 여기서 검증할 수 없어 지웠다.
    // jsdom엔 rAF 티커가 없어 `timeline.time()`이 0이고 퇴장 타이머가 0ms로 접힌다 —
    // 타이머를 조금만 진전시키면 취소가 아니라 재마운트를 보게 된다. 진짜 취소를
    // 만들려면 타임라인을 0이 아닌 위치로 seek해야 하는데 그러려면 이 파일이 gsap을
    // import해야 하고(게이트 검사가 막는다), 취소 메커니즘은 훅이 100% 소유한다.
    // 잠그는 자리: `_internal/useOverlayTransition.test.ts`의
    // `닫는 도중 다시 열면 현재 progress에서 정방향으로 이어진다`.

    it('컴포넌트가 unmount되면 대기 중인 타이머가 정리된다', () => {
      const errorSpy = vi.spyOn(console, 'error');
      const { rerender, unmount } = render(
        <Modal {...defaultProps} open={true} />
      );
      rerender(<Modal {...defaultProps} open={false} />);

      unmount();
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('퇴장 중(open=false)엔 다이얼로그가 inert해 포커스·클릭이 들어가지 않는다', () => {
      const { rerender } = render(<Modal {...defaultProps} open={true} />);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');

      rerender(<Modal {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('inert');
    });
  });
});

describe('Modal Compound API', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal.Header', () => {
    it('Modal.Header가 렌더링된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Header>헤더 내용</Modal.Header>
        </Modal>
      );
      expect(screen.getByText('헤더 내용')).toBeInTheDocument();
    });

    it('showClose가 true일 때 닫기 버튼이 렌더링된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Header showClose>헤더 내용</Modal.Header>
        </Modal>
      );
      expect(screen.getByRole('button', { name: /닫기/i })).toBeInTheDocument();
    });

    it('showClose 닫기 버튼 클릭 시 onClose가 호출된다', () => {
      const onClose = vi.fn();
      render(
        <Modal {...defaultProps} onClose={onClose}>
          <Modal.Header showClose>헤더 내용</Modal.Header>
        </Modal>
      );
      fireEvent.click(screen.getByRole('button', { name: /닫기/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('커스텀 className이 적용된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Header className="custom-header">헤더</Modal.Header>
        </Modal>
      );
      expect(screen.getByText('헤더').parentElement).toHaveClass(
        'custom-header'
      );
    });
  });

  describe('Modal.Title', () => {
    it('Modal.Title이 렌더링된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Header>
            <Modal.Title>모달 제목</Modal.Title>
          </Modal.Header>
        </Modal>
      );
      expect(screen.getByText('모달 제목')).toBeInTheDocument();
    });

    it('기본 heading level은 h2이다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Header>
            <Modal.Title>제목</Modal.Title>
          </Modal.Header>
        </Modal>
      );
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('as prop으로 heading level을 변경할 수 있다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Header>
            <Modal.Title as="h3">제목</Modal.Title>
          </Modal.Header>
        </Modal>
      );
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('Modal.Title이 dialog의 accessible name이 된다 (compound 경로)', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Header>
            <Modal.Title>탈퇴 확인</Modal.Title>
          </Modal.Header>
        </Modal>
      );
      expect(
        screen.getByRole('dialog', { name: '탈퇴 확인' })
      ).toBeInTheDocument();
    });

    it('aria-labelledby를 직접 주면 Modal.Title이 있어도 그 값이 우선한다', () => {
      render(
        <Modal {...defaultProps} aria-labelledby="external-label">
          <span id="external-label">외부 레이블</span>
          <Modal.Header>
            <Modal.Title>내부 제목</Modal.Title>
          </Modal.Header>
        </Modal>
      );
      expect(
        screen.getByRole('dialog', { name: '외부 레이블' })
      ).toBeInTheDocument();
    });

    it('Title에 소비자 id를 줘도 dialog의 접근 가능 이름이 유지된다', () => {
      // Title의 id는 컴포넌트가 소유한다. 소비자 id가 이기면 루트의
      // aria-labelledby가 허공을 가리켜 접근 가능 이름이 조용히 사라진다.
      render(
        <Modal {...defaultProps}>
          <Modal.Header>
            <Modal.Title id="my-heading">탈퇴 확인</Modal.Title>
          </Modal.Header>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toHaveAccessibleName('탈퇴 확인');
    });

    it('Title이 없으면 dangling IDREF가 되지만 이름 계산이 깨지지 않는다', () => {
      // compound 경로의 루트는 항상 생성 titleId를 가리킨다. 그 id를 가진
      // 요소가 없으면 accname 1.2는 그 단계를 건너뛴다 — 이름은 빈 문자열이고
      // id 문자열이 이름으로 새어 나오지 않는다. 라이브러리가 이 동작을 바꾸는
      // 날 여기서 잡힌다.
      render(
        <Modal {...defaultProps}>
          <Modal.Content>제목 없는 본문</Modal.Content>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAccessibleName('');
    });
  });

  describe('Modal.Content', () => {
    it('Modal.Content가 렌더링된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Content>컨텐츠 내용</Modal.Content>
        </Modal>
      );
      expect(screen.getByText('컨텐츠 내용')).toBeInTheDocument();
    });

    it('커스텀 className이 적용된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Content className="custom-content">내용</Modal.Content>
        </Modal>
      );
      expect(screen.getByText('내용')).toHaveClass('custom-content');
    });
  });

  describe('Modal.Footer', () => {
    it('Modal.Footer가 렌더링된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Footer>
            <button>확인</button>
          </Modal.Footer>
        </Modal>
      );
      expect(screen.getByText('확인')).toBeInTheDocument();
    });

    it('align="right"일 때 스타일이 적용된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Footer align="right" data-testid="footer">
            푸터
          </Modal.Footer>
        </Modal>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
    });

    it('align="center"일 때 스타일이 적용된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Footer align="center" data-testid="footer">
            푸터
          </Modal.Footer>
        </Modal>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
    });

    it('align="left"가 기본값이다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Footer data-testid="footer">푸터</Modal.Footer>
        </Modal>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Compound 조합 테스트', () => {
    it('Modal.Header, Modal.Content, Modal.Footer가 함께 렌더링된다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Header showClose>
            <Modal.Title>회원 탈퇴</Modal.Title>
          </Modal.Header>
          <Modal.Content>정말 탈퇴하시겠습니까?</Modal.Content>
          <Modal.Footer align="right">
            <button>취소</button>
            <button>탈퇴</button>
          </Modal.Footer>
        </Modal>
      );

      expect(screen.getByText('회원 탈퇴')).toBeInTheDocument();
      expect(screen.getByText('정말 탈퇴하시겠습니까?')).toBeInTheDocument();
      expect(screen.getByText('취소')).toBeInTheDocument();
      expect(screen.getByText('탈퇴')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /닫기/i })).toBeInTheDocument();
    });

    it('Header만 사용해도 동작한다', () => {
      render(
        <Modal {...defaultProps}>
          <Modal.Header>
            <Modal.Title>알림</Modal.Title>
          </Modal.Header>
          <div>내용</div>
        </Modal>
      );
      expect(screen.getByText('알림')).toBeInTheDocument();
    });

    it('접근성: aria-labelledby와 aria-describedby가 Content에 연결될 수 있다', () => {
      render(
        <Modal
          {...defaultProps}
          aria-labelledby="modal-title"
          aria-describedby="modal-desc"
        >
          <Modal.Header>
            <Modal.Title id="modal-title">제목</Modal.Title>
          </Modal.Header>
          <Modal.Content id="modal-desc">설명</Modal.Content>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-desc');
    });
  });
});

describe('Modal (Flat API)', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('title prop', () => {
    it('title을 전달하면 Header + Title 구조가 자동 생성된다', () => {
      render(
        <Modal {...defaultProps} title="알림">
          <p>모달 내용입니다.</p>
        </Modal>
      );
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        '알림'
      );
      expect(screen.getByText('모달 내용입니다.')).toBeInTheDocument();
    });

    it('title을 전달하면 dialog의 accessible name으로 사용된다', () => {
      render(
        <Modal {...defaultProps} title="설정">
          <p>내용</p>
        </Modal>
      );
      expect(screen.getByRole('dialog', { name: '설정' })).toBeInTheDocument();
    });

    it('title 없이 children만 전달하면 Compound 모드로 동작한다', () => {
      render(
        <Modal {...defaultProps}>
          <div>직접 구성한 내용</div>
        </Modal>
      );
      expect(screen.getByText('직접 구성한 내용')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('닫기 글리프', () => {
    it('Flat과 Compound의 닫기 버튼이 둘 다 공유 Glyph를 렌더한다', () => {
      const { unmount } = render(
        <Modal {...defaultProps} title="설정" showClose>
          내용
        </Modal>
      );
      expect(
        screen
          .getByRole('button', { name: '닫기' })
          .querySelector('[data-icon="close"]')
      ).toBeInTheDocument();
      unmount();

      render(
        <Modal {...defaultProps}>
          <Modal.Header showClose>헤더</Modal.Header>
        </Modal>
      );
      expect(
        screen
          .getByRole('button', { name: '닫기' })
          .querySelector('[data-icon="close"]')
      ).toBeInTheDocument();
    });
  });

  describe('showClose prop', () => {
    it('title + showClose로 닫기 버튼이 렌더링된다', () => {
      render(
        <Modal {...defaultProps} title="설정" showClose>
          <p>내용</p>
        </Modal>
      );
      expect(screen.getByRole('button', { name: /닫기/i })).toBeInTheDocument();
    });

    it('showClose 닫기 버튼 클릭 시 onClose가 호출된다', () => {
      const onClose = vi.fn();
      render(
        <Modal {...defaultProps} onClose={onClose} title="설정" showClose>
          <p>내용</p>
        </Modal>
      );
      fireEvent.click(screen.getByRole('button', { name: /닫기/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('showClose가 false이면 닫기 버튼이 없다', () => {
      render(
        <Modal {...defaultProps} title="설정">
          <p>내용</p>
        </Modal>
      );
      expect(
        screen.queryByRole('button', { name: /닫기/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('footer prop', () => {
    it('footer를 전달하면 Footer 영역이 렌더링된다', () => {
      render(
        <Modal
          {...defaultProps}
          title="알림"
          footer={<button>확인 버튼</button>}
        >
          <p>내용</p>
        </Modal>
      );
      expect(screen.getByText('확인 버튼')).toBeInTheDocument();
    });

    it('footer만 있고 title이 없어도 Flat 모드로 동작한다', () => {
      render(
        <Modal {...defaultProps} footer={<button>닫기</button>}>
          <p>본문 내용</p>
        </Modal>
      );
      expect(screen.getByText('본문 내용')).toBeInTheDocument();
      expect(screen.getByText('닫기')).toBeInTheDocument();
    });
  });

  describe('footerAlign prop', () => {
    it('footerAlign="right"가 적용된다', () => {
      render(
        <Modal
          {...defaultProps}
          title="제목"
          footer={<button>확인</button>}
          footerAlign="right"
        >
          <p>내용</p>
        </Modal>
      );
      const footer = screen.getByText('확인').closest('footer');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Flat 전체 조합', () => {
    it('title + showClose + footer + footerAlign 전체 조합이 동작한다', () => {
      const onClose = vi.fn();
      render(
        <Modal
          open={true}
          onClose={onClose}
          title="회원 탈퇴"
          showClose
          footer={
            <>
              <button>취소</button>
              <button>탈퇴</button>
            </>
          }
          footerAlign="right"
          size="sm"
        >
          <p>정말 탈퇴하시겠습니까?</p>
        </Modal>
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        '회원 탈퇴'
      );
      expect(screen.getByText('정말 탈퇴하시겠습니까?')).toBeInTheDocument();
      expect(screen.getByText('취소')).toBeInTheDocument();
      expect(screen.getByText('탈퇴')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /닫기/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /닫기/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
