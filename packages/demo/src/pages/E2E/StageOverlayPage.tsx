import { useRef, useState } from 'react';
import { Button, Modal } from '@taein-ui/core';
import { Stage, type Act } from '../../components/Stage';

// 회귀 e2e 전용 시험 페이지: 함수형 children으로 받은 상자에 Modal을 그리는 무대. 앞에 포커스를 받을 단추, 뒤에 다음 절 단추가 있다
const SCRIPT = (act: Act) => {
  act.move('trigger');
  act.press('trigger');
  act.wait(1.2);
  act.move('close');
  act.press('close');
  act.wait(1);
  act.home();
};

export function StageOverlayPage() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <main style={{ padding: '2rem', display: 'grid', gap: '2rem' }}>
      <button id="before">앞</button>
      <div style={{ height: 440, display: 'grid' }}>
        <Stage
          label="오버레이 시연"
          script={SCRIPT}
          onPause={() => setOpen(false)}
        >
          {(container) => (
            <>
              <Button
                ref={trigger}
                data-stage-target="trigger"
                onClick={() => setOpen(true)}
              >
                열기
              </Button>
              <Modal
                open={open}
                onClose={() => setOpen(false)}
                container={container}
                triggerRef={trigger}
                title="제목"
                size="sm"
                footer={
                  <Button
                    data-stage-target="close"
                    onClick={() => setOpen(false)}
                  >
                    닫기
                  </Button>
                }
              >
                내용
              </Modal>
            </>
          )}
        </Stage>
      </div>
      <button id="after">뒤</button>
    </main>
  );
}
