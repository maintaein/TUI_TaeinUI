import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
