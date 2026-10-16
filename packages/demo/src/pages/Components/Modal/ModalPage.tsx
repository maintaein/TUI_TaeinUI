import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './ModalPage.css';

export function ModalPage() {
  const modalProps: PropDefinition[] = [
    {
      name: 'open',
      type: 'boolean',
      required: true,
      description: '모달 표시 여부',
    },
    {
      name: 'onClose',
      type: '() => void',
      required: true,
      description: '닫기 이벤트 핸들러 (Esc, 백드롭 클릭 시 호출)',
    },
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: 'Flat: 본문 콘텐츠 / Compound: 서브 컴포넌트',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl' | 'full'",
      default: "'md'",
      description:
        '모달 너비 (sm:400px, md:600px, lg:800px, xl:1000px, full:100vw)',
    },
    {
      name: 'closeOnBackdropClick',
      type: 'boolean',
      default: 'true',
      description: '백드롭 클릭 시 닫힘 여부',
    },
    {
      name: 'closeOnEscape',
      type: 'boolean',
      default: 'true',
      description: 'Escape 키 입력 시 닫힘 여부',
    },
    {
      name: 'triggerRef',
      type: 'RefObject<HTMLElement | null>',
      description:
        '안 주면 열 때 포커스된 요소에서 자란다. Safari·Firefox(macOS)는 버튼 클릭에 포커스를 주지 않아 가운데에서 열린다. 주면 모든 브라우저에서 그 요소 자리에서 자란다.',
    },
    {
      name: 'title',
      type: 'string',
      description: 'Flat: 모달 제목 — 자동으로 Header + Title 구조 생성',
    },
    {
      name: 'showClose',
      type: 'boolean',
      default: 'false',
      description: 'Flat: 닫기(X) 버튼 표시 (title과 함께 사용)',
    },
    {
      name: 'footer',
      type: 'ReactNode',
      description: 'Flat: 모달 푸터 영역',
    },
    {
      name: 'footerAlign',
      type: "'left' | 'center' | 'right'",
      default: "'left'",
      description: 'Flat: 푸터 버튼 정렬',
    },
    {
      name: 'aria-labelledby',
      type: 'string',
      description: '모달 제목 요소의 id (접근성)',
    },
    {
      name: 'aria-describedby',
      type: 'string',
      description: '모달 설명 요소의 id (접근성)',
    },
    {
      name: 'aria-label',
      type: 'string',
      description: '모달의 접근성 레이블 (aria-labelledby 대체)',
    },
  ];

  const headerProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '헤더 내부 콘텐츠 (주로 Modal.Title)',
    },
    {
      name: 'showClose',
      type: 'boolean',
      default: 'false',
      description: '닫기(X) 버튼 표시 여부. Context를 통해 onClose 자동 연결',
    },
  ];

  const titleProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '제목 텍스트',
    },
    {
      name: 'as',
      type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'",
      default: "'h2'",
      description: '렌더링할 HTML 헤딩 요소',
    },
  ];

  const footerProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '푸터 내부 콘텐츠 (주로 버튼)',
    },
    {
      name: 'align',
      type: "'left' | 'center' | 'right'",
      default: "'left'",
      description: '버튼 정렬 방향',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Modal</h1>
        <p className={styles.description}>
          Modal 컴포넌트는 사용자의 확인이 필요한 대화상자, 폼 입력, 상세 정보
          등을 화면 중앙에 띄울 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Flat (간편)</h3>
            <CodeBlock
              language="tsx"
              code={`import { Modal, Button } from '@taein-ui/core';

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="알림"
  showClose
  footer={<Button onClick={() => setOpen(false)}>확인</Button>}
  footerAlign="right"
>
  <p>모달 내용입니다.</p>
</Modal>`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Compound (커스텀)</h3>
            <CodeBlock
              language="tsx"
              code={`import { Modal, Button } from '@taein-ui/core';

<Modal open={open} onClose={() => setOpen(false)}>
  <Modal.Header showClose>
    <Modal.Title>알림</Modal.Title>
  </Modal.Header>
  <Modal.Content>
    <p>모달 내용입니다.</p>
  </Modal.Content>
  <Modal.Footer align="right">
    <Button onClick={() => setOpen(false)}>확인</Button>
  </Modal.Footer>
</Modal>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* ===================== FLAT EXAMPLES ===================== */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 modal 예제입니다.
          </p>
        </div>

        <div className={styles.example}>
          <LivePreview
            title="기본 모달"
            description="title과 footer를 props로 전달하는 가장 간단한 방식입니다. triggerRef를 주면 모든 브라우저에서 누른 버튼 자리에서 자라 나옵니다(Safari·Firefox는 버튼 클릭에 포커스를 주지 않아 생략하면 가운데에서 열립니다)."
            editable
            code={`const [open, setOpen] = useState(false);
const triggerRef = useRef(null);

<div>
  <Button size="sm" ref={triggerRef} onClick={() => setOpen(true)}>모달 열기</Button>
  <Modal
    open={open}
    onClose={() => setOpen(false)}
    triggerRef={triggerRef}
    title="알림"
    showClose
    footer={
      <>
        <Button size="sm" variant="light" onClick={() => setOpen(false)}>취소</Button>
        <Button size="sm" onClick={() => setOpen(false)}>확인</Button>
      </>
    }
    footerAlign="right"
  >
    <p>모달 내용이 여기에 표시됩니다.</p>
  </Modal>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="size 옵션"
            description="sm(400px), md(600px), lg(800px), xl(1000px), full(뷰포트 전체)"
            editable
            code={`const [size, setSize] = useState('md');
const [open, setOpen] = useState(false);
const triggerRef = useRef(null);
const sizes = ['sm', 'md', 'lg', 'xl', 'full'];

<div>
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    {sizes.map((s) => (
      <Button key={s} size="sm" variant={s === size ? 'primary' : 'light'} onClick={(e) => { triggerRef.current = e.currentTarget; setSize(s); setOpen(true); }}>
        {s}
      </Button>
    ))}
  </div>
  <Modal
    open={open}
    onClose={() => setOpen(false)}
    triggerRef={triggerRef}
    size={size}
    title={'size="' + size + '"'}
    showClose
    footer={<Button size="sm" onClick={() => setOpen(false)}>닫기</Button>}
    footerAlign="right"
  >
    <p>현재 모달 크기: <strong>{size}</strong></p>
  </Modal>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Footer Align</h3>
          <LivePreview
            title="Footer 정렬"
            description="footerAlign으로 버튼 정렬 방향을 제어합니다. 기본값은 left입니다."
            editable
            code={`const [align, setAlign] = useState('left');
const [open, setOpen] = useState(false);
const triggerRef = useRef(null);

<div>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    {['left', 'center', 'right'].map((a) => (
      <Button key={a} size="sm" variant={a === align ? 'primary' : 'light'} onClick={(e) => { triggerRef.current = e.currentTarget; setAlign(a); setOpen(true); }}>{a}</Button>
    ))}
  </div>
  <Modal
    open={open}
    onClose={() => setOpen(false)}
    triggerRef={triggerRef}
    size="sm"
    title={'footerAlign="' + align + '"'}
    showClose
    footer={
      <>
        <Button size="sm" variant="light" onClick={() => setOpen(false)}>취소</Button>
        <Button size="sm" onClick={() => setOpen(false)}>확인</Button>
      </>
    }
    footerAlign={align}
  >
    <p>버튼 정렬: <strong>{align}</strong></p>
  </Modal>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Close Behavior</h3>
          <LivePreview
            title="닫힘 방식 제어"
            description="백드롭 클릭 · Esc 키 닫힘을 개별적으로 비활성화할 수 있습니다."
            editable
            code={`const [open, setOpen] = useState(false);
const triggerRef = useRef(null);

<div>
  <Button size="sm" ref={triggerRef} onClick={() => setOpen(true)}>백드롭 비활성 모달</Button>
  <Modal
    open={open}
    onClose={() => setOpen(false)}
    triggerRef={triggerRef}
    closeOnBackdropClick={false}
    title="설정 변경"
    showClose
    footer={
      <>
        <Button size="sm" variant="light" onClick={() => setOpen(false)}>취소</Button>
        <Button size="sm" onClick={() => setOpen(false)}>저장</Button>
      </>
    }
    footerAlign="right"
  >
    <p>배경 클릭으로 닫히지 않습니다. 작성 중 실수 방지에 유용합니다.</p>
  </Modal>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>확인 다이얼로그</h3>
          <LivePreview
            title="Confirm Dialog"
            description="위험한 작업 전 사용자 확인을 받는 가장 일반적인 패턴입니다."
            editable
            code={`const [open, setOpen] = useState(false);
const [deleted, setDeleted] = useState(false);
const triggerRef = useRef(null);

<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <Button size="sm" variant="danger" ref={triggerRef} onClick={() => setOpen(true)} disabled={deleted}>삭제</Button>
  {deleted && <span style={{ color: '#10b981', fontSize: '0.875rem' }}>삭제되었습니다</span>}
  <Modal
    open={open}
    onClose={() => setOpen(false)}
    triggerRef={triggerRef}
    size="sm"
    closeOnBackdropClick={false}
    title="항목 삭제"
    footer={
      <>
        <Button size="sm" variant="light" onClick={() => setOpen(false)}>취소</Button>
        <Button size="sm" variant="danger" onClick={() => { setDeleted(true); setOpen(false); }}>삭제</Button>
      </>
    }
    footerAlign="right"
  >
    <p>이 항목을 삭제하면 되돌릴 수 없습니다. 정말 삭제하시겠습니까?</p>
  </Modal>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>폼 모달</h3>
          <LivePreview
            title="Form Modal"
            description="사용자 입력을 받는 폼을 모달 안에 배치합니다."
            editable
            code={`const [open, setOpen] = useState(false);
const [name, setName] = useState('');
const triggerRef = useRef(null);

<div>
  <Button size="sm" ref={triggerRef} onClick={() => setOpen(true)}>프로필 수정</Button>
  <Modal
    open={open}
    onClose={() => setOpen(false)}
    triggerRef={triggerRef}
    closeOnBackdropClick={false}
    title="프로필 수정"
    showClose
    footer={
      <>
        <Button size="sm" variant="light" onClick={() => setOpen(false)}>취소</Button>
        <Button size="sm" onClick={() => setOpen(false)} disabled={!name}>저장</Button>
      </>
    }
    footerAlign="right"
  >
    <TextField label="이름" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" fullWidth />
  </Modal>
</div>`}
          />
        </div>
      </section>

      {/* ===================== FLAT vs COMPOUND ===================== */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Flat vs Compound 패턴</h2>
          <p className={styles.sectionDescription}>
            Modal은 하나의 컴포넌트로 두 가지 API 스타일을 모두 지원합니다.
            간단하면 prop(title, footer), 직접 꾸미려면 조합(Modal.Header 등)을
            쓰세요.
          </p>
        </div>

        {/* 개요 비교 카드 */}
        <div className={styles.patternCompareGrid}>
          <div className={styles.patternCard}>
            <p className={styles.patternCardTitle}>Flat Pattern (기본 권장)</p>
            <p className={styles.patternCardDesc}>
              title, footer 등 props만 전달하면 내부 구조가 자동 생성됩니다.
              빠르고 간결한 모달 사용의 표준 방식입니다.
            </p>
            <p className={styles.patternCardWhen}>사용할 때</p>
            <ul className={styles.patternCardList}>
              <li>일반적인 확인/알림 모달을 빠르게 만들 때</li>
              <li>title + footer 구조로 충분할 때</li>
              <li>코드를 간결하게 유지하고 싶을 때</li>
            </ul>
          </div>
          <div className={styles.patternCard}>
            <p className={styles.patternCardTitle}>
              Compound Pattern (커스텀용)
            </p>
            <p className={styles.patternCardDesc}>
              Modal.Header, Modal.Content 등 점 표기법으로 내부 구조를 직접
              구성합니다. 헤더에 이미지나 커스텀 레이아웃이 필요할 때
              활용합니다.
            </p>
            <p className={styles.patternCardWhen}>사용할 때</p>
            <ul className={styles.patternCardList}>
              <li>헤더에 아이콘, 이미지 등 커스텀 요소가 필요할 때</li>
              <li>도메인 전용 모달 컴포넌트(ConfirmModal 등)를 만들 때</li>
              <li>서브 컴포넌트별로 className 오버라이드가 필요할 때</li>
            </ul>
          </div>
        </div>

        {/* 비교 테이블 */}
        <div className={styles.patternCompareTableWrapper}>
          <table className={styles.patternCompareTable}>
            <thead className={styles.patternCompareHead}>
              <tr>
                <th className={styles.patternCompareTh}>항목</th>
                <th className={styles.patternCompareTh}>Flat Pattern</th>
                <th className={styles.patternCompareTh}>Compound Pattern</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>API 방식</td>
                <td className={styles.patternCompareTd}>
                  title, footer 등 props 전달
                </td>
                <td className={styles.patternCompareTd}>
                  Modal.Header, Modal.Content 점 표기법
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>Import</td>
                <td className={styles.patternCompareTd}>Modal 하나만</td>
                <td className={styles.patternCompareTd}>Modal 하나만 (동일)</td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>커스텀 자유도</td>
                <td className={styles.patternCompareTd}>
                  제한적 (props로 제어)
                </td>
                <td className={styles.patternCompareTd}>
                  높음 (서브 컴포넌트별 className, children 커스텀)
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>코드량</td>
                <td className={styles.patternCompareTd}>간결함</td>
                <td className={styles.patternCompareTd}>상대적으로 많음</td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>주 용도</td>
                <td className={styles.patternCompareTd}>
                  일반 확인/알림/폼 모달
                </td>
                <td className={styles.patternCompareTd}>
                  도메인 전용 래퍼, 커스텀 레이아웃
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>권장 여부</td>
                <td className={styles.patternCompareTd}>대부분의 경우 권장</td>
                <td className={styles.patternCompareTd}>
                  커스텀이 필요할 때 선택
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Compound 실전 예시 */}
        <div className={styles.example} style={{ marginTop: '2rem' }}>
          <h3 className={styles.exampleTitle}>
            Compound 실전 예시 — 도메인 전용 모달 컴포넌트
          </h3>
          <p
            className={styles.sectionDescription}
            style={{ marginBottom: '1rem' }}
          >
            Compound Pattern으로 ConfirmModal 같은 재사용 컴포넌트를 만들 때
            활용합니다. 소비자는 내부 구조를 몰라도 되고, props만 전달하면
            됩니다.
          </p>
          <CodeBlock
            language="tsx"
            code={`// components/ConfirmModal.tsx
import { Modal, Button } from '@taein-ui/core';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({
  open, onClose, onConfirm,
  title, message,
  confirmLabel = '확인', cancelLabel = '취소', danger = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnBackdropClick={false}>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Content>{message}</Modal.Content>
      <Modal.Footer align="right">
        <Button variant="light" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}`}
          />
        </div>

        {/* Compound 커스텀 확장 예시 */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            Compound 커스텀 확장 — 서브컴포넌트 교체
          </h3>
          <p
            className={styles.sectionDescription}
            style={{ marginBottom: '1rem' }}
          >
            Compound Pattern에서 특정 서브컴포넌트에 className이나 커스텀 요소를
            조합해 확장할 수 있습니다.
          </p>
          <CodeBlock
            language="tsx"
            code={`// components/ProductDetailModal.tsx
import { Modal, Button } from '@taein-ui/core';
import * as styles from './ProductDetailModal.css';

export function ProductDetailModal({ open, onClose, product }) {
  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* className으로 헤더만 부분 스타일 오버라이드 */}
      <Modal.Header className={styles.productHeader} showClose>
        <img src={product.thumbnail} alt="" className={styles.thumbnail} />
        <Modal.Title>{product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Content className={styles.productContent}>
        <p>{product.description}</p>
      </Modal.Content>
      <Modal.Footer align="right">
        <Button onClick={onClose}>닫기</Button>
      </Modal.Footer>
    </Modal>
  );
}`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Modal 하나로 Flat과 Compound 모두 사용합니다. title이나 footer
            prop이 있으면 Flat 모드로 자동 전환됩니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Modal</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={modalProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Modal.Header</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={headerProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Modal.Title</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={titleProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Modal.Footer</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={footerProps} />
          </div>
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Modal"
        intro="Modal은 role='dialog', aria-modal, 포커스 트랩, 포커스 복귀를 통해 키보드와 스크린 리더 사용자가 모달 콘텐츠에 올바르게 접근할 수 있도록 지원합니다."
        features={[
          {
            attribute: 'role="dialog"',
            effect: '다이얼로그 역할 전달',
            description: '스크린 리더가 해당 영역을 대화 상자로 인식합니다.',
          },
          {
            attribute: 'aria-modal="true"',
            effect: '모달 외부 비활성화',
            description: '스크린 리더가 모달 뒤의 콘텐츠를 읽지 않도록 합니다.',
          },
          {
            attribute: 'aria-labelledby / aria-label',
            effect: '모달 제목 연결',
            description: '스크린 리더가 모달 열림 시 제목을 읽어줍니다.',
          },
          {
            attribute: '포커스 트랩 (Tab)',
            effect: '모달 내부 포커스 순환',
            description:
              'Tab/Shift+Tab이 모달 내부 요소 사이에서만 순환되어 외부로 탈출하지 않습니다.',
          },
          {
            attribute: 'Escape 키',
            effect: '키보드 닫힘',
            description:
              'Esc 키로 모달을 닫을 수 있습니다. closeOnEscape={false}로 비활성화 가능합니다.',
          },
          {
            attribute: '포커스 복귀',
            effect: '이전 포커스 복원',
            description:
              '모달이 닫히면 모달을 열었던 요소(버튼 등)로 포커스가 자동 복귀됩니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: 'aria-labelledby 연결하기',
            description:
              'Modal.Title을 쓰면 Modal의 aria-labelledby에 자동으로 연결되어 스크린 리더가 모달 열림 시 제목을 읽어줍니다. aria-labelledby는 제목이 Modal.Title 밖에 있을 때만 직접 줍니다.',
            examples: [
              {
                code: `// Modal.Title은 id를 직접 관리한다. id를 주지 않아도 연결된다.
<Modal open={open} onClose={onClose}>
  <Modal.Header>
    <Modal.Title>설정 저장</Modal.Title>
  </Modal.Header>
  <Modal.Content>...</Modal.Content>
</Modal>

// 제목이 Modal.Title 밖에 있을 때만 직접 연결한다.
<Modal open={open} onClose={onClose} aria-labelledby="custom-title">
  <h2 id="custom-title">설정 저장</h2>
  <Modal.Content>...</Modal.Content>
</Modal>`,
                explanation:
                  'Modal.Title을 쓰면 연결이 자동입니다. Modal.Title에 준 id는 내부 id로 덮어쓰이므로 aria-labelledby에 쓰지 마세요.',
              },
            ],
          },
        ]}
      />

      {/* Best Practices */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Best Practices</h2>
          <p className={styles.sectionDescription}>
            Modal을 효과적으로 사용하기 위한 권장사항입니다.
          </p>
        </div>
        <div className={styles.practicesGrid}>
          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIcon}>✓</span>
                <h3 className={styles.practiceTitle}>Do</h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>
                  일반 모달은 Flat Pattern (title, footer props) 사용
                </ListItem>
                <ListItem>
                  커스텀 레이아웃이 필요할 때만 Compound Pattern 활용
                </ListItem>
                <ListItem>명확한 제목으로 목적을 즉시 파악 가능하게</ListItem>
                <ListItem>취소/확인 버튼을 함께 제공</ListItem>
                <ListItem>
                  Modal.Title로 제목 두기 (aria-labelledby 자동 연결)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIconError}>✗</span>
                <h3 className={styles.practiceTitle}>Don't</h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>단순 알림에 모달 사용 (Snackbar 권장)</ListItem>
                <ListItem>모달 안에 모달 중첩</ListItem>
                <ListItem>너무 많은 내용을 한 모달에 담기</ListItem>
                <ListItem>Flat으로 충분한데 불필요하게 Compound 사용</ListItem>
                <ListItem>모바일에서 full 크기 남용</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
