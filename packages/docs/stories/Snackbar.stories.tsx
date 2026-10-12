import type { Meta, StoryObj } from '@storybook/react';
import { Snackbar } from '@taein-ui/core';
import { useRef, useState } from 'react';

const meta = {
  title: 'Components/Snackbar',
  component: Snackbar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    open: true,
    message: '1박 2일',
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Snackbar visibility',
    },
    message: {
      control: 'text',
      description: 'Message to display',
    },
    severity: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
      description: 'Severity type',
    },
    position: {
      control: 'select',
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
      description: 'Position on screen',
    },
    autoHideDuration: {
      control: 'number',
      description: 'Auto hide duration in ms (null to disable)',
    },
  },
} satisfies Meta<typeof Snackbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    message: '기본 알림 메시지입니다.',
  },
};

const SeveritiesComponent = () => {
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [openWarning, setOpenWarning] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <button
        onClick={() => setOpenSuccess(true)}
        style={{ padding: '0.5rem 1rem' }}
      >
        Success 표시
      </button>
      <button
        onClick={() => setOpenError(true)}
        style={{ padding: '0.5rem 1rem' }}
      >
        Error 표시
      </button>
      <button
        onClick={() => setOpenWarning(true)}
        style={{ padding: '0.5rem 1rem' }}
      >
        Warning 표시
      </button>
      <button
        onClick={() => setOpenInfo(true)}
        style={{ padding: '0.5rem 1rem' }}
      >
        Info 표시
      </button>

      <Snackbar
        open={openSuccess}
        message="작업이 성공적으로 완료되었습니다!"
        severity="success"
        onClose={() => setOpenSuccess(false)}
      />
      <Snackbar
        open={openError}
        message="오류가 발생했습니다. 다시 시도해주세요."
        severity="error"
        onClose={() => setOpenError(false)}
      />
      <Snackbar
        open={openWarning}
        message="주의: 이 작업은 되돌릴 수 없습니다."
        severity="warning"
        onClose={() => setOpenWarning(false)}
      />
      <Snackbar
        open={openInfo}
        message="새로운 업데이트가 있습니다."
        severity="info"
        onClose={() => setOpenInfo(false)}
      />
    </div>
  );
};

export const Severities: Story = {
  render: () => <SeveritiesComponent />,
};

const PositionsComponent = () => {
  const [position, setPosition] = useState<
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
  >('bottom-right');
  const [open, setOpen] = useState(false);

  const positions = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {positions.map((pos) => (
        <button
          key={pos}
          onClick={() => {
            setPosition(pos);
            setOpen(true);
          }}
          style={{ padding: '0.5rem 1rem' }}
        >
          {pos} 표시
        </button>
      ))}

      <Snackbar
        open={open}
        message={`${position} 위치의 알림입니다.`}
        position={position}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

export const Positions: Story = {
  render: () => <PositionsComponent />,
};

const WithActionComponent = () => {
  const [open, setOpen] = useState(false);

  const handleUndo = () => {
    alert('실행 취소됨');
    setOpen(false);
  };

  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '0.5rem 1rem' }}>
        알림 표시 (액션 포함)
      </button>

      <Snackbar
        open={open}
        message="파일이 삭제되었습니다."
        severity="info"
        onClose={() => setOpen(false)}
        action={
          <button
            onClick={handleUndo}
            style={{
              padding: '0.25rem 0.75rem',
              background: 'transparent',
              border: '1px solid currentColor',
              color: 'inherit',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            실행 취소
          </button>
        }
      />
    </div>
  );
};

export const WithAction: Story = {
  render: () => <WithActionComponent />,
};

const AutoHideComponent = () => {
  const [open3s, setOpen3s] = useState(false);
  const [open10s, setOpen10s] = useState(false);
  const [openNoAuto, setOpenNoAuto] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <button
        onClick={() => setOpen3s(true)}
        style={{ padding: '0.5rem 1rem' }}
      >
        3초 후 자동 닫힘
      </button>
      <button
        onClick={() => setOpen10s(true)}
        style={{ padding: '0.5rem 1rem' }}
      >
        10초 후 자동 닫힘
      </button>
      <button
        onClick={() => setOpenNoAuto(true)}
        style={{ padding: '0.5rem 1rem' }}
      >
        자동 닫힘 없음 (수동으로만 닫기)
      </button>

      <Snackbar
        open={open3s}
        message="3초 후에 자동으로 닫힙니다."
        severity="success"
        autoHideDuration={3000}
        onClose={() => setOpen3s(false)}
      />
      <Snackbar
        open={open10s}
        message="10초 후에 자동으로 닫힙니다."
        severity="info"
        autoHideDuration={10000}
        onClose={() => setOpen10s(false)}
      />
      <Snackbar
        open={openNoAuto}
        message="닫기 버튼을 클릭해야 닫힙니다."
        severity="warning"
        autoHideDuration={null}
        onClose={() => setOpenNoAuto(false)}
      />
    </div>
  );
};

export const AutoHide: Story = {
  render: () => <AutoHideComponent />,
};

const MultipleSnackbarsComponent = () => {
  const [snackbars, setSnackbars] = useState<
    Array<{
      id: number;
      message: string;
      severity: 'success' | 'error' | 'warning' | 'info';
    }>
  >([]);
  const nextId = useRef(0);

  const addSnackbar = (severity: 'success' | 'error' | 'warning' | 'info') => {
    const id = nextId.current++;
    setSnackbars((prev) => [
      ...prev,
      { id, message: `${severity} 알림 #${id}`, severity },
    ]);
  };

  const removeSnackbar = (id: number) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => addSnackbar('success')}
          style={{ padding: '0.5rem 1rem' }}
        >
          Success 추가
        </button>
        <button
          onClick={() => addSnackbar('error')}
          style={{ padding: '0.5rem 1rem' }}
        >
          Error 추가
        </button>
        <button
          onClick={() => addSnackbar('warning')}
          style={{ padding: '0.5rem 1rem' }}
        >
          Warning 추가
        </button>
        <button
          onClick={() => addSnackbar('info')}
          style={{ padding: '0.5rem 1rem' }}
        >
          Info 추가
        </button>
      </div>

      {/* 같은 위치에 열린 스낵바는 자동으로 줄을 선다(최대 3개, 넘치면 가장 오래된 것의 onClose). */}
      {snackbars.map((snackbar) => (
        <Snackbar
          key={snackbar.id}
          open
          message={snackbar.message}
          severity={snackbar.severity}
          autoHideDuration={3000}
          onClose={() => removeSnackbar(snackbar.id)}
        />
      ))}
    </div>
  );
};

export const MultipleSnackbars: Story = {
  render: () => <MultipleSnackbarsComponent />,
};

const FormSubmissionComponent = () => {
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState<'success' | 'error'>('success');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const random = Math.random();
    if (random > 0.3) {
      setSeverity('success');
      setMessage('폼이 성공적으로 제출되었습니다!');
    } else {
      setSeverity('error');
      setMessage('폼 제출에 실패했습니다. 다시 시도해주세요.');
    }
    setOpen(true);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '300px',
        }}
      >
        <input
          type="text"
          placeholder="이름"
          style={{
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
        <input
          type="email"
          placeholder="이메일"
          style={{
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.75rem',
            backgroundColor: '#1E88E5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          제출
        </button>
      </form>

      <Snackbar
        open={open}
        message={message}
        severity={severity}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

export const FormSubmission: Story = {
  render: () => <FormSubmissionComponent />,
};

const LongMessageComponent = () => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '0.5rem 1rem' }}>
        긴 메시지 표시
      </button>

      <Snackbar
        open={open}
        message="이것은 매우 긴 알림 메시지입니다. 사용자에게 중요한 정보를 전달하기 위해 여러 줄에 걸쳐 표시될 수 있습니다. Snackbar는 자동으로 높이를 조절하여 모든 내용을 표시합니다."
        severity="info"
        onClose={() => setOpen(false)}
        autoHideDuration={null}
      />
    </div>
  );
};

export const LongMessage: Story = {
  render: () => <LongMessageComponent />,
};

export const Playground: Story = {
  args: {
    open: true,
    message: '알림 메시지를 입력하세요.',
    severity: 'info',
    position: 'bottom-right',
    autoHideDuration: 6000,
  },
};
