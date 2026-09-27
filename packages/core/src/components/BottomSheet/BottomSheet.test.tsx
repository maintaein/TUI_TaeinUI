import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    children: 'BottomSheet content',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('렌더링 테스트', () => {
    it('open이 true일 때 BottomSheet가 렌더링된다', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('BottomSheet content')).toBeInTheDocument();
    });

    it('open이 false일 때 BottomSheet가 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('children이 올바르게 렌더링된다', () => {
      render(
        <BottomSheet {...defaultProps}>
          <div>Custom content</div>
        </BottomSheet>
      );
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('title이 있을 때 렌더링된다', () => {
      render(<BottomSheet {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('title이 없을 때 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.querySelector('h2')).not.toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('role="dialog"를 가진다', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-modal="true"를 가진다', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveAttribute('aria-modal', 'true');
    });

    it('title이 있을 때 aria-labelledby가 설정된다', () => {
      render(<BottomSheet {...defaultProps} title="Test Title" />);
      const sheet = screen.getByRole('dialog');
      const labelledby = sheet.getAttribute('aria-labelledby');
      expect(labelledby).toBeTruthy();

      const title = document.getElementById(labelledby!);
      expect(title).toHaveTextContent('Test Title');
    });

    it('title을 dialog의 accessible name으로 사용한다', () => {
      render(<BottomSheet {...defaultProps} title="Test Title" />);
      expect(
        screen.getByRole('dialog', { name: 'Test Title' })
      ).toBeInTheDocument();
    });

    it('aria-label이 있을 때 설정된다', () => {
      render(<BottomSheet {...defaultProps} aria-label="Custom Label" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveAttribute('aria-label', 'Custom Label');
    });
  });

  describe('Backdrop 클릭 테스트', () => {
    it('closeOnBackdropClick이 true일 때 backdrop 클릭 시 onClose가 호출된다', async () => {
      render(<BottomSheet {...defaultProps} closeOnBackdropClick />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('closeOnBackdropClick이 false일 때 backdrop 클릭 시 onClose가 호출되지 않는다', () => {
      render(<BottomSheet {...defaultProps} closeOnBackdropClick={false} />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('시트 영역 클릭 시 onClose가 호출되지 않는다', () => {
      render(<BottomSheet {...defaultProps} closeOnBackdropClick />);
      const sheet = screen.getByRole('dialog');
      fireEvent.click(sheet);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('ESC 키 테스트', () => {
    it('closeOnEscape이 true일 때 ESC 키로 닫힌다', async () => {
      render(<BottomSheet {...defaultProps} closeOnEscape />);
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('closeOnEscape이 false일 때 ESC 키로 닫히지 않는다', () => {
      render(<BottomSheet {...defaultProps} closeOnEscape={false} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('높이 테스트', () => {
    it('기본 높이(auto)가 적용된다', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toBeInTheDocument();
    });

    it('height="sm" 일 때 작은 높이가 적용된다', () => {
      render(<BottomSheet {...defaultProps} height="sm" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('sm');
    });

    it('height="md" 일 때 중간 높이가 적용된다', () => {
      render(<BottomSheet {...defaultProps} height="md" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('md');
    });

    it('height="lg" 일 때 큰 높이가 적용된다', () => {
      render(<BottomSheet {...defaultProps} height="lg" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('lg');
    });

    it('height="full" 일 때 전체 높이가 적용된다', () => {
      render(<BottomSheet {...defaultProps} height="full" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('full');
    });
  });

  describe('드래그 핸들 테스트', () => {
    it('showHandle이 true일 때 드래그 핸들이 렌더링된다', () => {
      render(<BottomSheet {...defaultProps} showHandle />);
      const sheet = screen.getByRole('dialog');
      const handle = sheet.querySelector('[data-testid="bottomsheet-handle"]');
      expect(handle).toBeInTheDocument();
    });

    it('showHandle이 false일 때 드래그 핸들이 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} showHandle={false} />);
      const sheet = screen.getByRole('dialog');
      const handle = sheet.querySelector('[data-testid="bottomsheet-handle"]');
      expect(handle).not.toBeInTheDocument();
    });

    it('기본값은 showHandle=true이다', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const handle = sheet.querySelector('[data-testid="bottomsheet-handle"]');
      expect(handle).toBeInTheDocument();
    });
  });

  describe('닫기 버튼 테스트', () => {
    it('showClose가 true일 때 닫기 버튼이 렌더링된다', () => {
      render(<BottomSheet {...defaultProps} showClose title="Title" />);
      const closeButton = screen.getByRole('button', { name: /닫기/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
      render(<BottomSheet {...defaultProps} showClose title="Title" />);
      const closeButton = screen.getByRole('button', { name: /닫기/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('showClose가 false일 때 닫기 버튼이 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} showClose={false} title="Title" />);
      expect(
        screen.queryByRole('button', { name: /닫기/i })
      ).not.toBeInTheDocument();
    });

    it('title이 없으면 닫기 버튼이 렌더링되지 않는다', () => {
      render(<BottomSheet {...defaultProps} showClose />);
      expect(
        screen.queryByRole('button', { name: /닫기/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('포커스 관리 테스트', () => {
    it('열릴 때 BottomSheet로 포커스가 이동한다', async () => {
      render(<BottomSheet {...defaultProps} />);
      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        expect(document.activeElement).toBe(sheet);
      });
    });

    it('닫힐 때 이전 포커스가 복원된다', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const { rerender } = render(<BottomSheet {...defaultProps} />);

      rerender(<BottomSheet {...defaultProps} open={false} />);

      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
      document.body.removeChild(button);
    });

    it('포커스 가능한 요소가 있을 때 첫 번째 요소로 포커스가 이동한다', async () => {
      render(
        <BottomSheet {...defaultProps}>
          <button>First Button</button>
          <button>Second Button</button>
        </BottomSheet>
      );
      await waitFor(() => {
        const firstButton = screen.getByRole('button', {
          name: 'First Button',
        });
        expect(document.activeElement).toBe(firstButton);
      });
    });
  });

  describe('포커스 트랩 테스트', () => {
    it('마지막 요소에서 Tab을 누르면 첫 요소로 순환한다', () => {
      render(
        <BottomSheet {...defaultProps}>
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </div>
        </BottomSheet>
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
        <BottomSheet {...defaultProps}>
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </div>
        </BottomSheet>
      );

      const button1 = screen.getByText('Button 1');
      const button3 = screen.getByText('Button 3');

      button1.focus();
      expect(button1).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      expect(button3).toHaveFocus();
    });
  });

  describe('Body scroll 테스트', () => {
    it('열릴 때 body scroll이 비활성화된다', async () => {
      render(<BottomSheet {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('닫힐 때 body scroll이 복원된다', async () => {
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });

      rerender(<BottomSheet {...defaultProps} open={false} />);

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });
  });

  describe('드래그 동작 테스트', () => {
    it('enableDrag가 true일 때 드래그로 닫을 수 있다', async () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, {
        touches: [{ clientY: 100 }],
      });

      fireEvent.touchMove(sheet, {
        touches: [{ clientY: 300 }],
      });

      fireEvent.touchEnd(sheet, {
        changedTouches: [{ clientY: 300 }],
      });

      // 드래그 닫기는 transitionend 후 onClose를 호출함
      fireEvent.transitionEnd(sheet);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('enableDrag가 false일 때 드래그로 닫을 수 없다', () => {
      render(<BottomSheet {...defaultProps} enableDrag={false} />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, {
        touches: [{ clientY: 100 }],
      });

      fireEvent.touchMove(sheet, {
        touches: [{ clientY: 300 }],
      });

      fireEvent.touchEnd(sheet, {
        changedTouches: [{ clientY: 300 }],
      });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('위로 드래그하면 닫히지 않는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, {
        touches: [{ clientY: 300 }],
      });

      fireEvent.touchMove(sheet, {
        touches: [{ clientY: 100 }],
      });

      fireEvent.touchEnd(sheet, {
        changedTouches: [{ clientY: 100 }],
      });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  // 예전엔 드래그 닫기가 자체 CSS transition을 걸고 `transitionend`를 기다렸고,
  // 그 이벤트가 안 올 때를 위한 300ms 폴백 타이머가 있었다. M3 T2가 닫기를
  // 타임라인에 넘겨 전이도 폴백 타이머도 사라졌으므로, 이 자리는 그 둘이
  // 없어도 닫힘이 확정된다는 사실을 잠근다 — 폴백이 지키려던 바로 그 성질이다.
  describe('드래그 닫기는 애니메이션 이벤트에 기대지 않는다', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('transitionend가 오지 않아도 놓는 즉시 닫힘이 확정된다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 300 }] });
      fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 300 }] });

      // transitionend를 일부러 발생시키지 않는다 — 기다리는 이벤트가 없다.
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('시간이 더 흘러도 onClose가 중복 호출되지 않는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 300 }] });
      fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 300 }] });

      fireEvent.transitionEnd(sheet);
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
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
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      rerender(<BottomSheet {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('animationend 없이 타이머만으로 DOM에서 제거된다', () => {
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      rerender(<BottomSheet {...defaultProps} open={false} />);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('닫히는 도중 다시 열리면 언마운트가 취소된다', () => {
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      rerender(<BottomSheet {...defaultProps} open={false} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });
      rerender(<BottomSheet {...defaultProps} open />);
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('퇴장 중(open=false)엔 시트가 inert해 포커스·클릭이 들어가지 않는다', () => {
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');

      rerender(<BottomSheet {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('inert');
    });
  });

  describe('퇴장 메커니즘 잠금', () => {
    // jsdom은 애니메이션을 돌리지도 계산값을 주지도 않아 소스 텍스트를 읽는다
    // (tokens/animationBoundary.test.ts와 같은 방식).
    // M3 T2 전까지 퇴장은 CSS transition 클래스였고 이 검사가 그 존재를 잠갔다.
    // 지금은 등장·퇴장이 한 GSAP 타임라인의 양방향이므로 잠글 대상이 뒤집힌다 —
    // CSS가 모션을 **다시 갖지 않는다**. 키프레임이 돌아오면 조항 1이 또 깨지고
    // (진행 중 progress를 못 읽어 중단 지점에서 점프한다) 드래그가 다시 같은
    // transform을 놓고 다투게 된다.
    it('CSS가 등장·퇴장 모션을 갖지 않는다 (명제 조항 1)', () => {
      const source = readFileSync(
        resolve(__dirname, 'BottomSheet.css.ts'),
        'utf-8'
      );

      expect(source).not.toMatch(/keyframes/);
      expect(source).not.toMatch(/animation:/);
      expect(source).not.toMatch(/export const \w*Exit\w* = style/);
    });

    it('시트 시작 위치를 타임라인이 소유한다 — 화면 아래 밖에서 시작한다', () => {
      render(<BottomSheet {...defaultProps} />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(0%, 100%)'
      );
    });
  });

  describe('축소 선호 — 드래그 복귀', () => {
    /** jsdom은 matchMedia를 구현하지 않는다 — 축소 선호 경로를 열려면 깔아야 한다. */
    beforeEach(() => {
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
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('문턱 아래에서 놓으면 트윈 없이 즉시 쉬는 자리로 붙는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 160 }] });
      expect(sheet.style.transform).toContain('60px');

      fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 160 }] });

      // 게이트가 트윈을 끝 상태로 확정하고 죽인다 — 중간 어딘가에 멈추지 않는다.
      expect(sheet.style.transform).not.toContain('60px');
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('드래그와 타임라인의 채널 분리', () => {
    it('드래그는 y(px)에 쓰고 타임라인의 yPercent를 지우지 않는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');

      fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 160 }] });

      // 두 채널이 한 transform으로 합성된다 — 손가락이 60px 끌었고 타임라인의
      // 100%는 그대로 남아 있다. 예전처럼 style.transform에 직접 쓰면
      // yPercent가 지워져 시트가 튀었다.
      expect(sheet.style.transform).toContain('60px');
      expect(sheet.style.transform).toContain('100%');
    });

    it('위로 끌면 아무 채널도 움직이지 않는다', () => {
      render(<BottomSheet {...defaultProps} enableDrag />);
      const sheet = screen.getByRole('dialog');
      const before = sheet.style.transform;

      fireEvent.touchStart(sheet, { touches: [{ clientY: 300 }] });
      fireEvent.touchMove(sheet, { touches: [{ clientY: 100 }] });

      expect(sheet.style.transform).toBe(before);
    });
  });

  describe('className 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      render(<BottomSheet {...defaultProps} className="custom-class" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('custom-class');
    });
  });

  describe('Compound API 테스트', () => {
    describe('BottomSheet.Header', () => {
      it('BottomSheet.Header가 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>Header Content</BottomSheet.Header>
            <BottomSheet.Content>Body Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(screen.getByText('Header Content')).toBeInTheDocument();
      });

      it('showClose가 true일 때 닫기 버튼이 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header showClose>Header</BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(
          screen.getByRole('button', { name: /닫기/i })
        ).toBeInTheDocument();
      });

      it('showClose 닫기 버튼 클릭 시 onClose가 호출된다', async () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header showClose>Header</BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        const closeButton = screen.getByRole('button', { name: /닫기/i });
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('BottomSheet.Title', () => {
      it('BottomSheet.Title이 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>
              <BottomSheet.Title>제목입니다</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(screen.getByText('제목입니다')).toBeInTheDocument();
      });

      it('BottomSheet.Title이 h2 요소로 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>
              <BottomSheet.Title>제목</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        const title = screen.getByText('제목');
        expect(title.tagName).toBe('H2');
      });

      it('BottomSheet.Title이 dialog의 accessible name이 된다 (compound 경로)', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>
              <BottomSheet.Title>제목입니다</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(
          screen.getByRole('dialog', { name: '제목입니다' })
        ).toBeInTheDocument();
      });

      it('aria-labelledby를 직접 주면 BottomSheet.Title이 있어도 그 값이 우선한다', () => {
        render(
          <BottomSheet {...defaultProps} aria-labelledby="external-label">
            <span id="external-label">외부 레이블</span>
            <BottomSheet.Header>
              <BottomSheet.Title>내부 제목</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>Content</BottomSheet.Content>
          </BottomSheet>
        );
        expect(
          screen.getByRole('dialog', { name: '외부 레이블' })
        ).toBeInTheDocument();
      });

      it('Title에 소비자 id를 줘도 dialog의 접근 가능 이름이 유지된다', () => {
        // Title의 id는 컴포넌트가 소유한다. 소비자 id가 이기면 루트의
        // aria-labelledby가 허공을 가리켜 접근 가능 이름이 조용히 사라진다.
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header>
              <BottomSheet.Title id="my-heading">탈퇴 확인</BottomSheet.Title>
            </BottomSheet.Header>
          </BottomSheet>
        );
        expect(screen.getByRole('dialog')).toHaveAccessibleName('탈퇴 확인');
      });

      it('Title이 없으면 dangling IDREF가 되지만 이름 계산이 깨지지 않는다', () => {
        // compound 경로의 루트는 항상 생성 titleId를 가리킨다. 그 id를 가진
        // 요소가 없으면 accname 1.2는 그 단계를 건너뛴다 — 이름은 빈 문자열이고
        // id 문자열이 이름으로 새어 나오지 않는다. 라이브러리가 이 동작을 바꾸는
        // 날 여기서 잡힌다.
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Content>제목 없는 본문</BottomSheet.Content>
          </BottomSheet>
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAccessibleName('');
      });
    });

    describe('BottomSheet.Content', () => {
      it('BottomSheet.Content가 렌더링된다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Content>내용입니다</BottomSheet.Content>
          </BottomSheet>
        );
        expect(screen.getByText('내용입니다')).toBeInTheDocument();
      });

      it('복잡한 컴포넌트를 Content로 렌더링할 수 있다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Content>
              <div>
                <button>버튼 1</button>
                <button>버튼 2</button>
              </div>
            </BottomSheet.Content>
          </BottomSheet>
        );
        expect(
          screen.getByRole('button', { name: '버튼 1' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: '버튼 2' })
        ).toBeInTheDocument();
      });
    });

    describe('Compound 조합 테스트', () => {
      it('Header + Title + Content를 함께 사용할 수 있다', () => {
        render(
          <BottomSheet {...defaultProps}>
            <BottomSheet.Header showClose>
              <BottomSheet.Title>제목</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>내용</BottomSheet.Content>
          </BottomSheet>
        );
        expect(screen.getByText('제목')).toBeInTheDocument();
        expect(screen.getByText('내용')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /닫기/i })
        ).toBeInTheDocument();
      });

      it('showHandle과 함께 사용할 수 있다', () => {
        render(
          <BottomSheet {...defaultProps} showHandle>
            <BottomSheet.Header>
              <BottomSheet.Title>제목</BottomSheet.Title>
            </BottomSheet.Header>
            <BottomSheet.Content>내용</BottomSheet.Content>
          </BottomSheet>
        );
        const sheet = screen.getByRole('dialog');
        const handle = sheet.querySelector(
          '[data-testid="bottomsheet-handle"]'
        );
        expect(handle).toBeInTheDocument();
      });
    });
  });
});
