import type { Meta, StoryObj } from '@storybook/react';
import { Modal, ModalProps } from '@taein-ui/core';
import { useState } from 'react';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    open: true,
    onClose: () => {
      console.log('closed');
    },
    children: '모달 컨텐츠입니다.',
  },
  argTypes: {
    open: { control: 'boolean', description: '모달 열림/닫힘 상태' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: '모달 크기',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description: 'Backdrop 클릭 시 닫기',
    },
    closeOnEscape: { control: 'boolean', description: 'ESC 키로 닫기' },
    children: { control: 'text', description: '모달 콘텐츠' },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const ModalWrapper = ({
  size,
  closeOnBackdropClick,
  closeOnEscape,
  children,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          backgroundColor: '#0066FF',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        모달 열기
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size={size}
        closeOnBackdropClick={closeOnBackdropClick}
        closeOnEscape={closeOnEscape}
      >
        {children}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <ModalWrapper>
      <div style={{ padding: '32px' }}>
        <h2
          style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold' }}
        >
          기본 모달
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: '1.6' }}>
          이것은 기본 모달입니다. backdrop을 클릭하거나 ESC 키를 눌러 닫을 수
          있습니다.
        </p>
        <button
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          확인
        </button>
      </div>
    </ModalWrapper>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <ModalWrapper size="sm">
        <div style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Small 모달</h3>
          <p style={{ margin: 0, color: '#666' }}>
            400px 너비의 작은 모달입니다.
          </p>
        </div>
      </ModalWrapper>

      <ModalWrapper size="md">
        <div style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Medium 모달</h3>
          <p style={{ margin: 0, color: '#666' }}>
            600px 너비의 중간 모달입니다.
          </p>
        </div>
      </ModalWrapper>

      <ModalWrapper size="lg">
        <div style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Large 모달</h3>
          <p style={{ margin: 0, color: '#666' }}>
            800px 너비의 큰 모달입니다.
          </p>
        </div>
      </ModalWrapper>

      <ModalWrapper size="xl">
        <div style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Extra Large 모달</h3>
          <p style={{ margin: 0, color: '#666' }}>
            1000px 너비의 아주 큰 모달입니다.
          </p>
        </div>
      </ModalWrapper>

      <ModalWrapper size="full">
        <div style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Full 모달</h3>
          <p style={{ margin: 0, color: '#666' }}>
            전체 화면에 가까운 모달입니다.
          </p>
        </div>
      </ModalWrapper>
    </div>
  ),
};

export const WithForm: Story = {
  render: () => (
    <ModalWrapper>
      <div style={{ padding: '32px' }}>
        <h2
          style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 'bold' }}
        >
          로그인
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('로그인 처리');
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'medium',
              }}
            >
              이메일
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'medium',
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <button
              type="button"
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0066FF',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  ),
};

export const WithScrollContent: Story = {
  render: () => (
    <ModalWrapper>
      <div style={{ padding: '32px' }}>
        <h2
          style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold' }}
        >
          긴 콘텐츠
        </h2>
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} style={{ margin: '0 0 12px 0', lineHeight: '1.6' }}>
              {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </div>
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #eee',
          }}
        >
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0066FF',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            확인
          </button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const NoBackdropClose: Story = {
  render: () => (
    <ModalWrapper closeOnBackdropClick={false}>
      <div style={{ padding: '32px' }}>
        <h2
          style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold' }}
        >
          Backdrop 클릭 비활성화
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: '1.6' }}>
          이 모달은 backdrop을 클릭해도 닫히지 않습니다. 버튼을 클릭하거나 ESC
          키를 눌러야 닫힙니다.
        </p>
        <button
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>
    </ModalWrapper>
  ),
};

export const NoEscapeClose: Story = {
  render: () => (
    <ModalWrapper closeOnEscape={false}>
      <div style={{ padding: '32px' }}>
        <h2
          style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold' }}
        >
          ESC 키 비활성화
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: '1.6' }}>
          이 모달은 ESC 키로 닫을 수 없습니다. backdrop을 클릭하거나 버튼을
          클릭해야 닫힙니다.
        </p>
        <button
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>
    </ModalWrapper>
  ),
};

export const ConfirmDialog: Story = {
  render: () => (
    <ModalWrapper size="sm">
      <div style={{ padding: '32px' }}>
        <h2
          style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 'bold' }}
        >
          정말 삭제하시겠습니까?
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: '1.6' }}>
          이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
        </p>
        <div
          style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
        >
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#FF4444',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const WithImage: Story = {
  render: () => (
    <ModalWrapper size="lg">
      <div>
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop"
          alt="Sample"
          style={{ width: '100%', height: '300px', objectFit: 'cover' }}
        />
        <div style={{ padding: '24px' }}>
          <h2
            style={{
              margin: '0 0 12px 0',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            이미지가 포함된 모달
          </h2>
          <p style={{ margin: '0 0 16px 0', color: '#666', lineHeight: '1.6' }}>
            이미지와 텍스트를 함께 보여주는 모달입니다.
          </p>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0066FF',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            확인
          </button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <ModalWrapper>
      <div style={{ padding: '32px' }}>
        <h2 id="modal-title" style={{ margin: '0 0 16px 0' }}>
          접근성 모달
        </h2>
        <p
          id="modal-description"
          style={{ margin: '0 0 24px 0', color: '#666' }}
        >
          이 모달은 aria-labelledby와 aria-describedby 속성을 사용하여 접근성을
          향상시켰습니다.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0066FF',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            첫 번째 버튼
          </button>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            두 번째 버튼
          </button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

const InteractiveComponent = (args: ModalProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#0066FF',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        모달 열기
      </button>
      <Modal {...args} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export const Interactive: Story = {
  args: {
    open: false,
    size: 'md',
    closeOnBackdropClick: true,
    closeOnEscape: true,
    children: (
      <div style={{ padding: '32px' }}>
        <h2>인터랙티브 모달</h2>
        <p>Controls를 사용하여 모달을 제어해보세요.</p>
      </div>
    ),
  },
  render: (args) => <InteractiveComponent {...args} />,
};

// Compound API 예시

// Compound API 기본 사용
export const CompoundAPIBasic: Story = {
  render: () => {
    const CompoundWrapper = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            onClick={() => setOpen(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0066FF',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Compound API 모달 열기
          </button>
          <Modal open={open} onClose={() => setOpen(false)}>
            <Modal.Header showClose>
              <Modal.Title>Compound API 모달</Modal.Title>
            </Modal.Header>
            <Modal.Content>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                Modal.Header, Modal.Title, Modal.Content, Modal.Footer를
                조합하여 구조화된 모달을 만들 수 있습니다.
              </p>
            </Modal.Content>
            <Modal.Footer align="right">
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0066FF',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
            </Modal.Footer>
          </Modal>
        </>
      );
    };
    return <CompoundWrapper />;
  },
};

// 확인 다이얼로그 (Compound API)
export const CompoundConfirmDialog: Story = {
  render: () => {
    const ConfirmWrapper = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            onClick={() => setOpen(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#FF4444',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            삭제하기
          </button>
          <Modal open={open} onClose={() => setOpen(false)} size="sm">
            <Modal.Header>
              <Modal.Title>회원 탈퇴</Modal.Title>
            </Modal.Header>
            <Modal.Content>
              <p style={{ margin: 0, lineHeight: 1.6, color: '#666' }}>
                정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가
                삭제됩니다.
              </p>
            </Modal.Content>
            <Modal.Footer align="right">
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  alert('탈퇴 처리');
                  setOpen(false);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#FF4444',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                탈퇴
              </button>
            </Modal.Footer>
          </Modal>
        </>
      );
    };
    return <ConfirmWrapper />;
  },
};

// 폼 모달 (Compound API)
export const CompoundFormModal: Story = {
  render: () => {
    const FormWrapper = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            onClick={() => setOpen(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0066FF',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            로그인
          </button>
          <Modal open={open} onClose={() => setOpen(false)}>
            <Modal.Header showClose>
              <Modal.Title>로그인</Modal.Title>
            </Modal.Header>
            <Modal.Content>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('로그인 처리');
                  setOpen(false);
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 500,
                    }}
                  >
                    이메일
                  </label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 500,
                    }}
                  >
                    비밀번호
                  </label>
                  <input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </form>
            </Modal.Content>
            <Modal.Footer align="right">
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0066FF',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                로그인
              </button>
            </Modal.Footer>
          </Modal>
        </>
      );
    };
    return <FormWrapper />;
  },
};

// Footer align 옵션
export const CompoundFooterAlign: Story = {
  render: () => {
    const AlignWrapper = () => {
      const [openLeft, setOpenLeft] = useState(false);
      const [openCenter, setOpenCenter] = useState(false);
      const [openRight, setOpenRight] = useState(false);

      return (
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => setOpenLeft(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Left Align
          </button>
          <Modal open={openLeft} onClose={() => setOpenLeft(false)} size="sm">
            <Modal.Header showClose>
              <Modal.Title>Left Align</Modal.Title>
            </Modal.Header>
            <Modal.Content>
              <p style={{ margin: 0 }}>Footer align="left" (기본값)</p>
            </Modal.Content>
            <Modal.Footer align="left">
              <button
                onClick={() => setOpenLeft(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0066FF',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
            </Modal.Footer>
          </Modal>

          <button
            onClick={() => setOpenCenter(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Center Align
          </button>
          <Modal
            open={openCenter}
            onClose={() => setOpenCenter(false)}
            size="sm"
          >
            <Modal.Header showClose>
              <Modal.Title>Center Align</Modal.Title>
            </Modal.Header>
            <Modal.Content>
              <p style={{ margin: 0 }}>Footer align="center"</p>
            </Modal.Content>
            <Modal.Footer align="center">
              <button
                onClick={() => setOpenCenter(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0066FF',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
            </Modal.Footer>
          </Modal>

          <button
            onClick={() => setOpenRight(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Right Align
          </button>
          <Modal open={openRight} onClose={() => setOpenRight(false)} size="sm">
            <Modal.Header showClose>
              <Modal.Title>Right Align</Modal.Title>
            </Modal.Header>
            <Modal.Content>
              <p style={{ margin: 0 }}>Footer align="right"</p>
            </Modal.Content>
            <Modal.Footer align="right">
              <button
                onClick={() => setOpenRight(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0066FF',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      );
    };
    return <AlignWrapper />;
  },
};

// API 비교
export const APIComparison: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        maxWidth: '800px',
      }}
    >
      <div
        style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0' }}>기존 방식 (Children)</h3>
        <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
          children에 자유로운 형태의 콘텐츠 전달
        </p>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
          }}
        >
          {`<Modal open={open} onClose={onClose}>
  <div style={{ padding: '32px' }}>
    <h2>제목</h2>
    <p>내용</p>
    <button>확인</button>
  </div>
</Modal>`}
        </pre>
      </div>
      <div
        style={{
          padding: '20px',
          border: '1px solid #0066FF',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', color: '#0066FF' }}>
          Compound API (권장)
        </h3>
        <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
          구조화된 서브 컴포넌트 사용
        </p>
        <pre
          style={{
            backgroundColor: '#f0f7ff',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
          }}
        >
          {`<Modal open={open} onClose={onClose}>
  <Modal.Header showClose>
    <Modal.Title>제목</Modal.Title>
  </Modal.Header>
  <Modal.Content>
    내용
  </Modal.Content>
  <Modal.Footer align="right">
    <Button>확인</Button>
  </Modal.Footer>
</Modal>`}
        </pre>
      </div>
    </div>
  ),
};
