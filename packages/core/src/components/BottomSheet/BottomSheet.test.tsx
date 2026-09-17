import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

      const sheet = screen.getByRole('dialog');
      fireEvent.animationEnd(sheet);

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

      const sheet = screen.getByRole('dialog');
      fireEvent.animationEnd(sheet);

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

      const sheet = screen.getByRole('dialog');
      fireEvent.animationEnd(sheet);

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

      const sheet = screen.getByRole('dialog');
      fireEvent.animationEnd(sheet);

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

      const sheet = screen.getByRole('dialog');
      fireEvent.animationEnd(sheet);

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
