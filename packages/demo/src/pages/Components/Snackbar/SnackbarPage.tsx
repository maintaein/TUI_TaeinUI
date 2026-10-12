import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './SnackbarPage.css';

export function SnackbarPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'open',
      type: 'boolean',
      required: true,
      description: '스낵바 표시 여부',
    },
    {
      name: 'message',
      type: 'ReactNode',
      required: true,
      description: '스낵바에 표시할 메시지',
    },
    {
      name: 'severity',
      type: "'success' | 'error' | 'warning' | 'info'",
      default: "'info'",
      description: '메시지 심각도에 따른 색상',
    },
    {
      name: 'position',
      type: "'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
      default: "'bottom-right'",
      description: '화면 내 위치',
    },
    {
      name: 'autoHideDuration',
      type: 'number | null',
      default: '6000',
      description: '자동 닫힘까지 시간(ms). null이면 자동 닫힘 비활성화',
    },
    {
      name: 'stack',
      type: 'boolean',
      default: 'true',
      description:
        'false면 같은 위치에 혼자 있다: 열릴 때 다른 스낵바를 닫고, 새 스낵바가 열리면 닫힌다',
    },
    {
      name: 'onClose',
      type: '() => void',
      description: '닫기 버튼 클릭 또는 자동 닫힘 시 호출',
    },
    {
      name: 'action',
      type: 'ReactNode',
      description: '닫기 버튼 왼쪽에 표시할 커스텀 액션 (버튼 등)',
    },
    {
      name: 'className',
      type: 'string',
      description: '추가 CSS 클래스',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Snackbar</h1>
        <p className={styles.description}>
          Snackbar 컴포넌트는 저장 완료, 에러 발생, 네트워크 상태 등 짧은 알림을
          화면에 잠시 띄울 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <div className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body>
            <div className={styles.quickRefTitle}>Import</div>
            <CodeBlock
              code="import { Snackbar } from '@taein-ui/core';"
              language="tsx"
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body>
            <div className={styles.quickRefTitle}>Basic Usage</div>
            <CodeBlock
              code={`<Snackbar
  open={open}
  message="저장되었습니다"
  onClose={() => setOpen(false)}
/>`}
              language="tsx"
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body>
            <div className={styles.quickRefTitle}>Key Features</div>
            <CodeBlock
              code={`severity: 'success' | 'error' | 'warning' | 'info'
position: 6가지 위치 옵션
autoHideDuration: 자동 닫힘 (기본 6초)
쌓기: 같은 위치에 최대 3개`}
              language="text"
            />
          </Card.Body>
        </Card>
      </div>

      {/* Severity */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Severity</h2>
          <p className={styles.sectionDescription}>
            메시지의 심각도에 따라 4가지 색상 변형을 제공합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Info (Default)</h3>
          <LivePreview
            title="Info 스낵바"
            description="일반적인 알림 메시지에 사용합니다. 기본값입니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div>
  <Button size="sm" onClick={() => setOpen(true)}>Info 스낵바 열기</Button>
  <Snackbar open={open} message="새로운 업데이트가 있습니다." severity="info" onClose={() => setOpen(false)} autoHideDuration={3000} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Success</h3>
          <LivePreview
            title="Success 스낵바"
            description="작업이 성공적으로 완료되었을 때 사용합니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div>
  <Button size="sm" onClick={() => setOpen(true)}>Success 스낵바 열기</Button>
  <Snackbar open={open} message="저장이 완료되었습니다." severity="success" onClose={() => setOpen(false)} autoHideDuration={3000} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Error</h3>
          <LivePreview
            title="Error 스낵바"
            description="오류가 발생했을 때 사용합니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div>
  <Button size="sm" onClick={() => setOpen(true)}>Error 스낵바 열기</Button>
  <Snackbar open={open} message="저장에 실패했습니다. 다시 시도해주세요." severity="error" onClose={() => setOpen(false)} autoHideDuration={3000} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Warning</h3>
          <LivePreview
            title="Warning 스낵바"
            description="주의가 필요한 상황에 사용합니다. success와 함께 진한 면 위에 흰 글자로 표시됩니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div>
  <Button size="sm" onClick={() => setOpen(true)}>Warning 스낵바 열기</Button>
  <Snackbar open={open} message="저장 공간이 부족합니다." severity="warning" onClose={() => setOpen(false)} autoHideDuration={3000} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>All Severities</h3>
          <LivePreview
            title="전체 Severity 비교"
            description="4가지 심각도를 버튼으로 전환하며 비교할 수 있습니다."
            editable
            code={`const [severity, setSeverity] = useState('info');
const [open, setOpen] = useState(false);
const messages = { info: '새 알림이 있습니다.', success: '완료되었습니다!', error: '오류가 발생했습니다.', warning: '주의가 필요합니다.' };

<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
  {['info', 'success', 'error', 'warning'].map((s) => (
    <Button key={s} size="sm" variant={s === severity ? 'primary' : 'light'} onClick={() => { setSeverity(s); setOpen(true); }}>
      {s}
    </Button>
  ))}
  <Snackbar open={open} message={messages[severity]} severity={severity} onClose={() => setOpen(false)} autoHideDuration={3000} />
</div>`}
          />
        </div>
      </section>

      {/* Position */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Position</h2>
          <p className={styles.sectionDescription}>
            6가지 위치 옵션으로 스낵바를 화면 가장자리에 배치할 수 있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Position Options</h3>
          <LivePreview
            title="위치 선택"
            description="버튼을 클릭하여 각 위치에 스낵바를 표시합니다. 기본값은 bottom-right입니다."
            editable
            code={`const [open, setOpen] = useState(false);
const [position, setPosition] = useState('bottom-right');
const positions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

<div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', maxWidth: '360px' }}>
    {positions.map((pos) => (
      <Button key={pos} size="sm" variant={pos === position ? 'primary' : 'light'} onClick={() => { setPosition(pos); setOpen(true); }}>
        {pos.replace('-', ' ')}
      </Button>
    ))}
  </div>
  <Snackbar open={open} message={position + ' 위치의 스낵바'} position={position} onClose={() => setOpen(false)} autoHideDuration={2000} />
</div>`}
          />
        </div>
      </section>

      {/* Stacking */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Stacking</h2>
          <p className={styles.sectionDescription}>
            같은 위치에 열린 스낵바는 겹치지 않고 자동으로 줄을 섭니다. 새것이
            화면 가장자리에 서고 먼저 있던 것은 안쪽으로 밀립니다. 같은 위치에
            최대 3개이며, 넘치면 가장 오래된 것이 닫힘(onClose)입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>여러 개 쌓기</h3>
          <LivePreview
            title="여러 개 쌓기"
            description="쌓기가 기본입니다. 버튼을 누를 때마다 스낵바를 하나씩 더합니다. 위치를 주지 않으면 오른쪽 아래에 쌓입니다. 4번째부터 가장 오래된 것이 onClose로 빠집니다. severity가 번갈아 나와 흰 글자도 함께 볼 수 있습니다."
            editable
            code={`const [items, setItems] = useState([]);
const severities = ['success', 'warning', 'error', 'info'];
const add = () => setItems((prev) => [...prev, { id: prev.length + 1, severity: severities[prev.length % 4], open: true }]);
const close = (id) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, open: false } : item)));

<div>
  <Button size="sm" onClick={add}>스낵바 추가</Button>
  {items.map((item) => (
    <Snackbar key={item.id} open={item.open} message={'#' + item.id + ' ' + item.severity + ' 알림'} severity={item.severity} autoHideDuration={null} onClose={() => close(item.id)} />
  ))}
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>하나씩만 보이기</h3>
          <LivePreview
            title="하나씩만 보이기"
            description="쌓기는 기본입니다. 한 번에 하나만 보여 주려면 stack={false}"
            editable
            code={`const [items, setItems] = useState([]);
const add = () => setItems((prev) => [...prev, { id: prev.length + 1, open: true }]);
const close = (id) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, open: false } : item)));

<div>
  <Button size="sm" onClick={add}>스낵바 열기</Button>
  {items.map((item) => (
    <Snackbar key={item.id} open={item.open} stack={false} message={'#' + item.id + ' 알림'} autoHideDuration={null} onClose={() => close(item.id)} />
  ))}
</div>`}
          />
        </div>
      </section>

      {/* Auto Hide Duration */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Auto Hide Duration</h2>
          <p className={styles.sectionDescription}>
            일정 시간 후 자동으로 닫히는 기능을 제어합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Custom Duration</h3>
          <LivePreview
            title="자동 닫힘 시간 조절"
            description="autoHideDuration prop으로 밀리초 단위의 시간을 설정합니다. 기본값은 6000ms(6초)입니다."
            editable
            code={`const [open, setOpen] = useState(false);
const [duration, setDuration] = useState(3000);

<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    {[1000, 3000, 6000, 10000].map((d) => (
      <Button key={d} size="sm" variant={d === duration ? 'primary' : 'light'} onClick={() => setDuration(d)}>
        {d / 1000}초
      </Button>
    ))}
  </div>
  <Button size="sm" variant="dark" onClick={() => setOpen(true)}>스낵바 열기 ({duration / 1000}초 후 자동 닫힘)</Button>
  <Snackbar open={open} message={duration / 1000 + '초 후 자동으로 닫힙니다.'} severity="info" onClose={() => setOpen(false)} autoHideDuration={duration} />
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Persistent (No Auto Hide)</h3>
          <LivePreview
            title="자동 닫힘 비활성화"
            description="autoHideDuration={null}로 설정하면 수동으로만 닫을 수 있습니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div>
  <Button size="sm" onClick={() => setOpen(true)}>Persistent 스낵바 열기</Button>
  <Snackbar open={open} message="이 스낵바는 자동으로 닫히지 않습니다. X 버튼을 클릭하세요." severity="warning" onClose={() => setOpen(false)} autoHideDuration={null} />
</div>`}
          />
        </div>
      </section>

      {/* Custom Action */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Custom Action</h2>
          <p className={styles.sectionDescription}>
            action prop으로 닫기 버튼 옆에 커스텀 액션을 추가할 수 있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Action Button</h3>
          <LivePreview
            title="실행 취소 액션"
            description="action prop에 버튼을 전달하여 '실행 취소' 같은 추가 동작을 제공합니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div>
  <Button size="sm" onClick={() => setOpen(true)}>삭제 실행</Button>
  <Snackbar
    open={open}
    message="항목이 삭제되었습니다."
    severity="info"
    onClose={() => setOpen(false)}
    autoHideDuration={5000}
    action={
      <Button size="sm" variant="light" onClick={() => { setOpen(false); }}>
        실행 취소
      </Button>
    }
  />
</div>`}
          />
        </div>
      </section>

      {/* Composition Patterns */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Composition Patterns</h2>
          <p className={styles.sectionDescription}>
            실제 사용 시나리오에서의 스낵바 활용 패턴입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Form Submit Feedback</h3>
          <LivePreview
            title="폼 제출 피드백"
            description="폼 제출 성공/실패에 따라 다른 스낵바를 표시합니다."
            editable
            code={`const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
const handleSubmit = (success) => {
  setSnackbar(success ? { open: true, message: '설정이 저장되었습니다.', severity: 'success' } : { open: true, message: '저장에 실패했습니다.', severity: 'error' });
};

<div style={{ display: 'flex', gap: '0.5rem' }}>
  <Button size="sm" variant="primary" onClick={() => handleSubmit(true)}>저장 (성공)</Button>
  <Button size="sm" variant="danger" onClick={() => handleSubmit(false)}>저장 (실패)</Button>
  <Snackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} autoHideDuration={3000} />
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Snackbar 컴포넌트의 전체 props 목록입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}></div>
        <AccessibilitySection
          componentName="Snackbar"
          intro="Snackbar는 role='alert'와 aria-live 속성으로 스크린 리더에 메시지를 전달하며, 닫기 버튼에 적절한 레이블과 포커스 인디케이터를 제공합니다."
          features={[
            {
              attribute: 'role="alert"',
              effect: '알림 역할 전달',
              description: '스크린 리더가 스낵바를 알림으로 인식합니다.',
            },
            {
              attribute: 'aria-live="polite"',
              effect: '실시간 메시지 전달',
              description: '현재 읽기가 끝난 후 스낵바 메시지를 읽어줍니다.',
            },
            {
              attribute: 'aria-label="닫기"',
              effect: '닫기 버튼 레이블',
              description: 'IconButton에 설정되어 닫기 동작을 전달합니다.',
            },
            {
              attribute: 'focus-visible',
              effect: '포커스 인디케이터',
              description: '닫기 버튼에 키보드 포커스 시 윤곽선이 표시됩니다.',
            },
            {
              attribute: 'autoHideDuration',
              effect: '충분한 읽기 시간',
              description:
                '기본 6초의 자동 닫힘 시간으로 메시지를 읽을 시간을 제공합니다.',
            },
          ]}
        />
      </section>

      {/* Best Practices */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Best Practices</h2>
          <p className={styles.sectionDescription}>
            Snackbar를 효과적으로 사용하기 위한 권장사항입니다.
          </p>
        </div>
        <div className={styles.practicesGrid}>
          <Card>
            <Card.Body>
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIcon}>O</span>
                <span className={styles.practiceTitle}>권장</span>
              </div>
              <List>
                <ListItem>짧고 명확한 메시지 작성</ListItem>
                <ListItem>severity를 상황에 맞게 선택</ListItem>
                <ListItem>중요한 작업에는 실행 취소 액션 제공</ListItem>
                <ListItem>자동 닫힘 시간은 메시지 길이에 맞게 설정</ListItem>
                <ListItem>
                  같은 위치에는 가능하면 하나만, 많아도 3개까지만 표시
                </ListItem>
              </List>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIconError}>X</span>
                <span className={styles.practiceTitle}>지양</span>
              </div>
              <List>
                <ListItem>긴 문장이나 여러 줄의 메시지 사용</ListItem>
                <ListItem>중요한 정보를 스낵바로만 전달</ListItem>
                <ListItem>
                  알림을 한꺼번에 여러 개 쏟아내기 (4개째부터 가장 오래된 것이
                  닫힘)
                </ListItem>
                <ListItem>자동 닫힘을 너무 짧게 설정 (최소 3초)</ListItem>
                <ListItem>
                  사용자 확인이 필요한 내용에 스낵바 사용 (Modal 사용)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
