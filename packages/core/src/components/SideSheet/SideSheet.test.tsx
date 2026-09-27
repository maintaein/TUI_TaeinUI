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
import { SideSheet } from './SideSheet';

describe('SideSheet', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    children: 'SideSheet content',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('렌더링 테스트', () => {
    it('open이 true일 때 SideSheet가 렌더링된다', () => {
      render(<SideSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('SideSheet content')).toBeInTheDocument();
    });

    it('open이 false일 때 SideSheet가 렌더링되지 않는다', () => {
      render(<SideSheet {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('children이 올바르게 렌더링된다', () => {
      render(
        <SideSheet {...defaultProps}>
          <div>Custom content</div>
        </SideSheet>
      );
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('title이 있을 때 렌더링된다', () => {
      render(<SideSheet {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('title이 없을 때 렌더링되지 않는다', () => {
      render(<SideSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.querySelector('h2')).not.toBeInTheDocument();
    });
  });

  describe('접근성 테스트', () => {
    it('role="dialog"를 가진다', () => {
      render(<SideSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-modal="true"를 가진다', () => {
      render(<SideSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveAttribute('aria-modal', 'true');
    });

    it('title이 있을 때 aria-labelledby가 설정된다', () => {
      render(<SideSheet {...defaultProps} title="Test Title" />);
      const sheet = screen.getByRole('dialog');
      const labelledby = sheet.getAttribute('aria-labelledby');
      expect(labelledby).toBeTruthy();

      const title = document.getElementById(labelledby!);
      expect(title).toHaveTextContent('Test Title');
    });

    it('title을 dialog의 accessible name으로 사용한다', () => {
      render(<SideSheet {...defaultProps} title="Test Title" />);
      expect(
        screen.getByRole('dialog', { name: 'Test Title' })
      ).toBeInTheDocument();
    });

    it('aria-label이 있을 때 설정된다', () => {
      render(<SideSheet {...defaultProps} aria-label="Custom Label" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveAttribute('aria-label', 'Custom Label');
    });
  });

  describe('Backdrop 클릭 테스트', () => {
    it('closeOnBackdropClick이 true일 때 backdrop 클릭 시 onClose가 호출된다', async () => {
      render(<SideSheet {...defaultProps} closeOnBackdropClick />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('closeOnBackdropClick이 false일 때 backdrop 클릭 시 onClose가 호출되지 않는다', () => {
      render(<SideSheet {...defaultProps} closeOnBackdropClick={false} />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('시트 영역 클릭 시 onClose가 호출되지 않는다', () => {
      render(<SideSheet {...defaultProps} closeOnBackdropClick />);
      const sheet = screen.getByRole('dialog');
      fireEvent.click(sheet);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('ESC 키 테스트', () => {
    it('closeOnEscape이 true일 때 ESC 키로 닫힌다', async () => {
      render(<SideSheet {...defaultProps} closeOnEscape />);
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('closeOnEscape이 false일 때 ESC 키로 닫히지 않는다', () => {
      render(<SideSheet {...defaultProps} closeOnEscape={false} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('너비 테스트', () => {
    it('기본 너비(md)가 적용된다', () => {
      render(<SideSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toBeInTheDocument();
    });

    it('width="sm" 일 때 작은 너비가 적용된다', () => {
      render(<SideSheet {...defaultProps} width="sm" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('sm');
    });

    it('width="md" 일 때 중간 너비가 적용된다', () => {
      render(<SideSheet {...defaultProps} width="md" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('md');
    });

    it('width="lg" 일 때 큰 너비가 적용된다', () => {
      render(<SideSheet {...defaultProps} width="lg" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('lg');
    });

    it('width="full" 일 때 전체 너비가 적용된다', () => {
      render(<SideSheet {...defaultProps} width="full" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('full');
    });
  });

  describe('위치 테스트', () => {
    it('position="right" (기본값)일 때 우측에서 슬라이드된다', () => {
      render(<SideSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toBeInTheDocument();
    });

    it('position="left" 일 때 좌측에서 슬라이드된다', () => {
      render(<SideSheet {...defaultProps} position="left" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('left');
    });
  });

  describe('닫기 버튼 테스트', () => {
    it('showClose가 true일 때 닫기 버튼이 렌더링된다', () => {
      render(<SideSheet {...defaultProps} showClose title="Title" />);
      const closeButton = screen.getByRole('button', { name: /닫기/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
      render(<SideSheet {...defaultProps} showClose title="Title" />);
      const closeButton = screen.getByRole('button', { name: /닫기/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('showClose가 false일 때 닫기 버튼이 렌더링되지 않는다', () => {
      render(<SideSheet {...defaultProps} showClose={false} title="Title" />);
      expect(
        screen.queryByRole('button', { name: /닫기/i })
      ).not.toBeInTheDocument();
    });

    it('title이 없으면 닫기 버튼이 렌더링되지 않는다', () => {
      render(<SideSheet {...defaultProps} showClose />);
      expect(
        screen.queryByRole('button', { name: /닫기/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('포커스 관리 테스트', () => {
    it('열릴 때 SideSheet로 포커스가 이동한다', async () => {
      render(<SideSheet {...defaultProps} />);
      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        expect(document.activeElement).toBe(sheet);
      });
    });

    it('닫힐 때 이전 포커스가 복원된다', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const { rerender } = render(<SideSheet {...defaultProps} />);

      rerender(<SideSheet {...defaultProps} open={false} />);

      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
      document.body.removeChild(button);
    });

    it('포커스 가능한 요소가 있을 때 첫 번째 요소로 포커스가 이동한다', async () => {
      render(
        <SideSheet {...defaultProps}>
          <button>First Button</button>
          <button>Second Button</button>
        </SideSheet>
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
    it('Tab 키로 마지막 요소에서 첫 요소로 순환한다', async () => {
      render(
        <SideSheet {...defaultProps}>
          <button>First</button>
          <button>Last</button>
        </SideSheet>
      );

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: 'First' });
        expect(document.activeElement).toBe(firstButton);
      });

      const firstButton = screen.getByRole('button', { name: 'First' });
      const lastButton = screen.getByRole('button', { name: 'Last' });

      lastButton.focus();
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(document.activeElement).toBe(firstButton);
    });

    it('Shift+Tab 키로 첫 요소에서 마지막 요소로 순환한다', async () => {
      render(
        <SideSheet {...defaultProps}>
          <button>First</button>
          <button>Last</button>
        </SideSheet>
      );

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: 'First' });
        expect(document.activeElement).toBe(firstButton);
      });

      const firstButton = screen.getByRole('button', { name: 'First' });
      const lastButton = screen.getByRole('button', { name: 'Last' });

      firstButton.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      expect(document.activeElement).toBe(lastButton);
    });
  });

  describe('Body scroll 테스트', () => {
    it('열릴 때 body scroll이 비활성화된다', async () => {
      render(<SideSheet {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('닫힐 때 body scroll이 복원된다', async () => {
      const { rerender } = render(<SideSheet {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });

      rerender(<SideSheet {...defaultProps} open={false} />);

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
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
      const { rerender } = render(<SideSheet {...defaultProps} />);
      rerender(<SideSheet {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('animationend 없이 타이머만으로 DOM에서 제거된다', () => {
      const { rerender } = render(<SideSheet {...defaultProps} />);
      rerender(<SideSheet {...defaultProps} open={false} />);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('닫히는 도중 다시 열리면 언마운트가 취소된다', () => {
      const { rerender } = render(<SideSheet {...defaultProps} />);
      rerender(<SideSheet {...defaultProps} open={false} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });
      rerender(<SideSheet {...defaultProps} open />);
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('퇴장 중(open=false)엔 시트가 inert해 포커스·클릭이 들어가지 않는다', () => {
      const { rerender } = render(<SideSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');

      rerender(<SideSheet {...defaultProps} open={false} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('inert');
    });
  });

  describe('퇴장 메커니즘 잠금', () => {
    // jsdom은 애니메이션을 돌리지도 계산값을 주지도 않아 소스 텍스트를 읽는다
    // (tokens/animationBoundary.test.ts와 같은 방식).
    // M3 T2 전까지 퇴장은 CSS transition 클래스였고 이 검사가 그 존재를 잠갔다.
    // 지금은 등장·퇴장이 한 GSAP 타임라인의 양방향이므로 잠글 대상이 뒤집힌다 —
    // CSS가 모션을 **다시 갖지 않는다**. 키프레임이 돌아오면 조항 1이 또 깨진다
    // (진행 중 progress를 읽을 수 없어 중단 지점에서 점프한다).
    it('CSS가 등장·퇴장 모션을 갖지 않는다 (명제 조항 1)', () => {
      const source = readFileSync(
        resolve(__dirname, 'SideSheet.css.ts'),
        'utf-8'
      );

      expect(source).not.toMatch(/keyframes/);
      expect(source).not.toMatch(/animation:/);
      expect(source).not.toMatch(/export const \w*Exit\w* = style/);
    });

    it('시트 시작 위치를 타임라인이 소유한다 — 오른쪽은 화면 오른쪽 밖', () => {
      render(<SideSheet {...defaultProps} position="right" />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(100%, 0%)'
      );
    });

    it('시트 시작 위치를 타임라인이 소유한다 — 왼쪽은 화면 왼쪽 밖', () => {
      render(<SideSheet {...defaultProps} position="left" />);

      expect(screen.getByRole('dialog').style.transform).toBe(
        'translate(-100%, 0%)'
      );
    });
  });

  describe('className 테스트', () => {
    it('커스텀 className이 적용된다', () => {
      render(<SideSheet {...defaultProps} className="custom-class" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet.className).toContain('custom-class');
    });
  });

  describe('Compound API 테스트', () => {
    describe('SideSheet.Header', () => {
      it('SideSheet.Header가 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>Header Content</SideSheet.Header>
            <SideSheet.Content>Body Content</SideSheet.Content>
          </SideSheet>
        );
        expect(screen.getByText('Header Content')).toBeInTheDocument();
      });

      it('showClose가 true일 때 닫기 버튼이 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header showClose>Header</SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        expect(
          screen.getByRole('button', { name: /닫기/i })
        ).toBeInTheDocument();
      });

      it('showClose 닫기 버튼 클릭 시 onClose가 호출된다', async () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header showClose>Header</SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        const closeButton = screen.getByRole('button', { name: /닫기/i });
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('SideSheet.Title', () => {
      it('SideSheet.Title이 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>
              <SideSheet.Title>제목입니다</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        expect(screen.getByText('제목입니다')).toBeInTheDocument();
      });

      it('SideSheet.Title이 h2 요소로 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>
              <SideSheet.Title>제목</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        const title = screen.getByText('제목');
        expect(title.tagName).toBe('H2');
      });

      it('SideSheet.Title이 dialog의 accessible name이 된다 (compound 경로)', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>
              <SideSheet.Title>제목입니다</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        expect(
          screen.getByRole('dialog', { name: '제목입니다' })
        ).toBeInTheDocument();
      });

      it('aria-labelledby를 직접 주면 SideSheet.Title이 있어도 그 값이 우선한다', () => {
        render(
          <SideSheet {...defaultProps} aria-labelledby="external-label">
            <span id="external-label">외부 레이블</span>
            <SideSheet.Header>
              <SideSheet.Title>내부 제목</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>Content</SideSheet.Content>
          </SideSheet>
        );
        expect(
          screen.getByRole('dialog', { name: '외부 레이블' })
        ).toBeInTheDocument();
      });

      it('Title에 소비자 id를 줘도 dialog의 접근 가능 이름이 유지된다', () => {
        // Title의 id는 컴포넌트가 소유한다. 소비자 id가 이기면 루트의
        // aria-labelledby가 허공을 가리켜 접근 가능 이름이 조용히 사라진다.
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Header>
              <SideSheet.Title id="my-heading">탈퇴 확인</SideSheet.Title>
            </SideSheet.Header>
          </SideSheet>
        );
        expect(screen.getByRole('dialog')).toHaveAccessibleName('탈퇴 확인');
      });

      it('Title이 없으면 dangling IDREF가 되지만 이름 계산이 깨지지 않는다', () => {
        // compound 경로의 루트는 항상 생성 titleId를 가리킨다. 그 id를 가진
        // 요소가 없으면 accname 1.2는 그 단계를 건너뛴다 — 이름은 빈 문자열이고
        // id 문자열이 이름으로 새어 나오지 않는다. 라이브러리가 이 동작을 바꾸는
        // 날 여기서 잡힌다.
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Content>제목 없는 본문</SideSheet.Content>
          </SideSheet>
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAccessibleName('');
      });
    });

    describe('SideSheet.Content', () => {
      it('SideSheet.Content가 렌더링된다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Content>내용입니다</SideSheet.Content>
          </SideSheet>
        );
        expect(screen.getByText('내용입니다')).toBeInTheDocument();
      });

      it('복잡한 컴포넌트를 Content로 렌더링할 수 있다', () => {
        render(
          <SideSheet {...defaultProps}>
            <SideSheet.Content>
              <div>
                <button>버튼 1</button>
                <button>버튼 2</button>
              </div>
            </SideSheet.Content>
          </SideSheet>
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
          <SideSheet {...defaultProps}>
            <SideSheet.Header showClose>
              <SideSheet.Title>제목</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>내용</SideSheet.Content>
          </SideSheet>
        );
        expect(screen.getByText('제목')).toBeInTheDocument();
        expect(screen.getByText('내용')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /닫기/i })
        ).toBeInTheDocument();
      });

      it('position과 함께 사용할 수 있다', () => {
        render(
          <SideSheet {...defaultProps} position="left">
            <SideSheet.Header>
              <SideSheet.Title>제목</SideSheet.Title>
            </SideSheet.Header>
            <SideSheet.Content>내용</SideSheet.Content>
          </SideSheet>
        );
        const sheet = screen.getByRole('dialog');
        expect(sheet.className).toContain('left');
      });
    });
  });
});
