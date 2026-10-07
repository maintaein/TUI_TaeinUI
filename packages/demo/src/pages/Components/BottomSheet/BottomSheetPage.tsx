import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './BottomSheetPage.css';

export function BottomSheetPage() {
  const bottomSheetProps: PropDefinition[] = [
    {
      name: 'open',
      type: 'boolean',
      required: true,
      description: '바텀시트 표시 여부',
    },
    {
      name: 'onClose',
      type: '() => void',
      required: true,
      description: '닫기 이벤트 핸들러 (Esc, 백드롭 클릭, 드래그 닫힘 시 호출)',
    },
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '바텀시트 내부 콘텐츠',
    },
    {
      name: 'title',
      type: 'ReactNode',
      description: '바텀시트 제목. 지정하면 헤더 영역이 자동 생성됩니다',
    },
    {
      name: 'height',
      type: "'auto' | 'sm' | 'md' | 'lg' | 'full'",
      default: "'auto'",
      description: '바텀시트 높이 (sm:30vh, md:50vh, lg:70vh, full:100vh)',
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
      name: 'showHandle',
      type: 'boolean',
      default: 'true',
      description: '상단 드래그 핸들 표시 여부',
    },
    {
      name: 'showClose',
      type: 'boolean',
      default: 'false',
      description: '닫기(X) 버튼 표시 여부. title이 있을 때만 동작',
    },
    {
      name: 'enableDrag',
      type: 'boolean',
      default: 'true',
      description: '터치 드래그로 닫기 활성화 여부 (100px 이상 드래그 시 닫힘)',
    },
  ];

  const headerProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '헤더 내부 콘텐츠',
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
  ];

  const contentProps: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: '본문 콘텐츠',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>BottomSheet</h1>
        <p className={styles.description}>
          BottomSheet 컴포넌트는 모바일에서 옵션 선택, 필터, 공유 메뉴 등을 화면
          아래에서 올릴 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import {
  BottomSheet,
} from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`const [open, setOpen] = useState(false);

<>
  <Button onClick={() => setOpen(true)}>열기</Button>
  <BottomSheet
    open={open}
    onClose={() => setOpen(false)}
    title="제목"
  >
    내용
  </BottomSheet>
</>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 BottomSheet 예제입니다.
          </p>
        </div>

        <div className={styles.example}>
          <LivePreview
            title="기본 바텀시트"
            description="title을 전달하면 헤더가 자동 생성됩니다. showClose로 닫기 버튼을 추가할 수 있습니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div>
  <Button size="sm" onClick={() => setOpen(true)}>바텀시트 열기</Button>
  <BottomSheet open={open} onClose={() => setOpen(false)} title="알림" showClose>
    <p>바텀시트 내용이 여기에 표시됩니다.</p>
  </BottomSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Height</h3>
          <LivePreview
            title="height 옵션"
            description="auto(내용에 맞춤), sm(30vh), md(50vh), lg(70vh), full(100vh)"
            editable
            code={`const [height, setHeight] = useState('auto');
const [open, setOpen] = useState(false);
const heights = ['auto', 'sm', 'md', 'lg', 'full'];

<div>
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    {heights.map((h) => (
      <Button key={h} size="sm" variant={h === height ? 'primary' : 'light'} onClick={() => { setHeight(h); setOpen(true); }}>
        {h}
      </Button>
    ))}
  </div>
  <BottomSheet open={open} onClose={() => setOpen(false)} title={'height="' + height + '"'} showClose height={height}>
    <p>현재 높이: <strong>{height}</strong></p>
    <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>auto는 내용에 맞게 높이가 결정됩니다. sm/md/lg/full은 뷰포트 비율로 고정됩니다.</p>
  </BottomSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Handle & Drag</h3>
          <LivePreview
            title="핸들 & 드래그 제어"
            description="showHandle과 enableDrag를 각각 제어할 수 있습니다. 드래그 닫기는 100px 이상 아래로 드래그 시 동작합니다."
            editable
            code={`const [open1, setOpen1] = useState(false);
const [open2, setOpen2] = useState(false);

<div style={{ display: 'flex', gap: '0.5rem' }}>
  <Button size="sm" onClick={() => setOpen1(true)}>핸들 숨김</Button>
  <Button size="sm" variant="dark" onClick={() => setOpen2(true)}>드래그 비활성</Button>
  <BottomSheet open={open1} onClose={() => setOpen1(false)} title="핸들 숨김" showClose showHandle={false}>
    <p>상단 핸들 바가 숨겨진 상태입니다.</p>
  </BottomSheet>
  <BottomSheet open={open2} onClose={() => setOpen2(false)} title="드래그 비활성" showClose enableDrag={false}>
    <p>터치 드래그로 닫을 수 없습니다. X 버튼이나 백드롭 클릭으로만 닫힙니다.</p>
  </BottomSheet>
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

<div>
  <Button size="sm" onClick={() => setOpen(true)}>백드롭 비활성 바텀시트</Button>
  <BottomSheet open={open} onClose={() => setOpen(false)} title="설정 변경" showClose closeOnBackdropClick={false}>
    <p>배경 클릭으로 닫히지 않습니다. X 버튼이나 드래그로만 닫을 수 있습니다.</p>
  </BottomSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>리스트 메뉴</h3>
          <LivePreview
            title="액션 리스트"
            description="바텀시트 안에 선택 가능한 액션 목록을 배치하는 일반적인 모바일 패턴입니다."
            editable
            code={`const [open, setOpen] = useState(false);
const [selected, setSelected] = useState('');
const actions = ['사진 촬영', '갤러리에서 선택', '파일에서 선택'];

<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <Button size="sm" onClick={() => setOpen(true)}>첨부</Button>
  {selected && <span style={{ color: '#10b981', fontSize: '0.875rem' }}>{selected} 선택됨</span>}
  <BottomSheet open={open} onClose={() => setOpen(false)} title="첨부 방식 선택">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {actions.map((action) => (
        <button key={action} onClick={() => { setSelected(action); setOpen(false); }} style={{ padding: '0.875rem 0', border: 'none', background: 'transparent', fontSize: '1rem', textAlign: 'left', cursor: 'pointer', borderRadius: '0.5rem', color: '#374151' }}>
          {action}
        </button>
      ))}
    </div>
  </BottomSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>시차 등장</h3>
          <LivePreview
            title="목록이 차례로 떠오른다"
            description="시트가 튀며 올라온 뒤 내용의 직계 자식이 0.045초 간격으로 떠오릅니다(처음 8개까지). 목록을 한 요소로 감싸면 하나로 떠오르니 항목을 직접 children으로 넘기세요. 열린 동안에는 시트가 가볍게 둥실거리고, 드래그하는 동안은 멈춥니다."
            editable
            code={`const [open, setOpen] = useState(false);
const options = ['최신순', '인기순', '가격 낮은순', '가격 높은순', '평점순', '리뷰 많은순'];

<div>
  <Button size="sm" onClick={() => setOpen(true)}>정렬</Button>
  <BottomSheet open={open} onClose={() => setOpen(false)} title="정렬 기준">
    {options.map((option) => (
      <button key={option} onClick={() => setOpen(false)} style={{ display: 'block', width: '100%', padding: '0.875rem 0', border: 'none', background: 'transparent', fontSize: '1rem', textAlign: 'left', cursor: 'pointer', color: '#374151' }}>
        {option}
      </button>
    ))}
  </BottomSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>폼 바텀시트</h3>
          <LivePreview
            title="Form BottomSheet"
            description="사용자 입력을 받는 폼을 바텀시트 안에 배치합니다."
            editable
            code={`const [open, setOpen] = useState(false);
const [name, setName] = useState('');

<div>
  <Button size="sm" onClick={() => setOpen(true)}>메모 추가</Button>
  <BottomSheet open={open} onClose={() => setOpen(false)} title="메모 추가" showClose closeOnBackdropClick={false} height="md">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <TextField label="제목" value={name} onChange={(e) => setName(e.target.value)} placeholder="메모 제목을 입력하세요" fullWidth />
      <TextField label="내용" placeholder="메모 내용을 입력하세요" multiline fullWidth rows={4} />
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Button size="sm" variant="light" onClick={() => setOpen(false)}>취소</Button>
        <Button size="sm" onClick={() => setOpen(false)} disabled={!name}>저장</Button>
      </div>
    </div>
  </BottomSheet>
</div>`}
          />
        </div>
      </section>

      {/* Flat vs Compound */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Flat vs Compound 패턴</h2>
          <p className={styles.sectionDescription}>
            BottomSheet는 두 가지 API 스타일을 제공합니다. 상황에 맞게
            선택하세요.
          </p>
        </div>

        {/* 개요 비교 카드 */}
        <div className={styles.patternCompareGrid}>
          <div className={styles.patternCard}>
            <p className={styles.patternCardTitle}>Flat Pattern (기본 권장)</p>
            <p className={styles.patternCardDesc}>
              BottomSheet 컴포넌트에 title, showClose 등의 props를 전달하는
              방식입니다. 대부분의 사용 케이스에 적합합니다.
            </p>
            <p className={styles.patternCardWhen}>사용할 때</p>
            <ul className={styles.patternCardList}>
              <li>페이지·기능 컴포넌트에서 바텀시트를 직접 사용할 때</li>
              <li>title/showClose props로 충분한 표준 레이아웃</li>
              <li>별도 헤더 커스텀이 필요 없을 때</li>
            </ul>
          </div>
          <div className={styles.patternCard}>
            <p className={styles.patternCardTitle}>
              Compound Pattern (커스텀용)
            </p>
            <p className={styles.patternCardDesc}>
              BottomSheet.Header, BottomSheet.Content 등 점 표기법으로
              헤더/콘텐츠 영역을 자유롭게 커스텀합니다.
            </p>
            <p className={styles.patternCardWhen}>사용할 때</p>
            <ul className={styles.patternCardList}>
              <li>헤더에 커스텀 요소(아이콘, 뱃지 등)를 배치할 때</li>
              <li>도메인 전용 바텀시트 컴포넌트를 만들 때</li>
              <li>서브컴포넌트별 className 오버라이드가 필요할 때</li>
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
                <td className={styles.patternCompareTdLabel}>Import</td>
                <td className={styles.patternCompareTd}>BottomSheet 하나</td>
                <td className={styles.patternCompareTd}>
                  BottomSheet.Header, BottomSheet.Content 등 점 표기법
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>헤더 구성</td>
                <td className={styles.patternCompareTd}>
                  title, showClose props로 자동 생성
                </td>
                <td className={styles.patternCompareTd}>
                  BottomSheetHeader 안에 자유 배치
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>커스텀 자유도</td>
                <td className={styles.patternCompareTd}>props 범위 내 제어</td>
                <td className={styles.patternCompareTd}>
                  서브컴포넌트별 className, 커스텀 요소 자유 배치
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>주 용도</td>
                <td className={styles.patternCompareTd}>
                  일반 페이지 · 표준 레이아웃
                </td>
                <td className={styles.patternCompareTd}>
                  도메인 전용 래퍼 · 커스텀 헤더
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>권장 여부</td>
                <td className={styles.patternCompareTd}>
                  ✅ 대부분의 경우 권장
                </td>
                <td className={styles.patternCompareTd}>
                  커스텀 래퍼 제작 시 선택
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Compound 실전 예시 */}
        <div className={styles.example} style={{ marginTop: '2rem' }}>
          <h3 className={styles.exampleTitle}>
            Compound 실전 예시 — 도메인 전용 바텀시트
          </h3>
          <p
            className={styles.sectionDescription}
            style={{ marginBottom: '1rem' }}
          >
            Compound Pattern으로 도메인 전용 컴포넌트를 만들 때 활용합니다.
            소비자는 내부 구조를 몰라도 되고, props만 전달하면 됩니다.
          </p>
          <CodeBlock
            language="tsx"
            code={`// components/ShareBottomSheet.tsx
import { BottomSheet } from '@taein-ui/core';

interface ShareBottomSheetProps {
  open: boolean;
  onClose: () => void;
  onShare: (platform: string) => void;
}

export function ShareBottomSheet({ open, onClose, onShare }: ShareBottomSheetProps) {
  const platforms = ['카카오톡', '인스타그램', '트위터', '링크 복사'];

  return (
    <BottomSheet open={open} onClose={onClose}>
      <BottomSheet.Header showClose>
        <BottomSheet.Title>공유하기</BottomSheet.Title>
      </BottomSheet.Header>
      <BottomSheet.Content>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {platforms.map((p) => (
            <button key={p} onClick={() => { onShare(p); onClose(); }}>
              {p}
            </button>
          ))}
        </div>
      </BottomSheet.Content>
    </BottomSheet>
  );
}

// 사용:
// <ShareBottomSheet
//   open={open}
//   onClose={() => setOpen(false)}
//   onShare={(p) => console.log(p)}
// />`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            Compound 커스텀 확장 — 점 표기법
          </h3>
          <p
            className={styles.sectionDescription}
            style={{ marginBottom: '1rem' }}
          >
            BottomSheet.Header 점 표기법으로 커스텀 헤더를 구성할 수도 있습니다.
          </p>
          <CodeBlock
            language="tsx"
            code={`import { BottomSheet } from '@taein-ui/core';
import * as styles from './FilterSheet.css';

export function FilterSheet({ open, onClose, onApply }) {
  return (
    <BottomSheet open={open} onClose={onClose} height="lg">
      {/* 점 표기법으로 헤더를 커스텀 */}
      <BottomSheet.Header className={styles.filterHeader} showClose>
        <BottomSheet.Title>필터</BottomSheet.Title>
      </BottomSheet.Header>
      <BottomSheet.Content className={styles.filterContent}>
        {/* 필터 UI */}
      </BottomSheet.Content>
    </BottomSheet>
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
            BottomSheet 하나로 Flat과 Compound 모두 사용합니다. title prop이
            있으면 Flat 모드로 자동 전환됩니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>BottomSheet</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={bottomSheetProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            BottomSheetHeader / BottomSheet.Header
          </h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={headerProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            BottomSheetTitle / BottomSheet.Title
          </h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={titleProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            BottomSheetContent / BottomSheet.Content
          </h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={contentProps} />
          </div>
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="BottomSheet"
        intro="BottomSheet는 role='dialog', aria-modal, 포커스 트랩, 포커스 복귀를 통해 키보드와 스크린 리더 사용자가 바텀시트 콘텐츠에 올바르게 접근할 수 있도록 지원합니다."
        features={[
          {
            attribute: 'role="dialog"',
            effect: '다이얼로그 역할 전달',
            description: '스크린 리더가 해당 영역을 대화 상자로 인식합니다.',
          },
          {
            attribute: 'aria-modal="true"',
            effect: '외부 콘텐츠 비활성화',
            description:
              '스크린 리더가 바텀시트 뒤의 콘텐츠를 읽지 않도록 합니다.',
          },
          {
            attribute: 'aria-labelledby',
            effect: '바텀시트 제목 연결',
            description:
              'title prop이 있으면 자동으로 제목 요소의 id가 연결됩니다.',
          },
          {
            attribute: '포커스 트랩',
            effect: '내부 포커스 순환',
            description:
              '바텀시트가 열리면 내부의 첫 번째 포커스 가능한 요소로 포커스가 이동합니다.',
          },
          {
            attribute: 'Escape 키',
            effect: '키보드 닫힘',
            description:
              'Esc 키로 바텀시트를 닫을 수 있습니다. closeOnEscape={false}로 비활성화 가능합니다.',
          },
          {
            attribute: '포커스 복귀',
            effect: '이전 포커스 복원',
            description:
              '바텀시트가 닫히면 바텀시트를 열었던 요소로 포커스가 자동 복귀됩니다.',
          },
          {
            attribute: '드래그 닫기',
            effect: '터치 제스처 지원',
            description:
              '100px 이상 아래로 드래그하면 닫힙니다. enableDrag={false}로 비활성화 가능합니다.',
          },
        ]}
      />

      {/* Best Practices */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Best Practices</h2>
          <p className={styles.sectionDescription}>
            BottomSheet를 효과적으로 사용하기 위한 권장사항입니다.
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
                  일반 케이스는 Flat Pattern (BottomSheet + title/showClose
                  props) 사용
                </ListItem>
                <ListItem>
                  모바일 중심 인터랙션에 활용 (액션 선택, 필터, 간단한 폼)
                </ListItem>
                <ListItem>명확한 제목으로 바텀시트의 목적을 전달</ListItem>
                <ListItem>
                  폼 입력 시 closeOnBackdropClick={'{false}'} 설정
                </ListItem>
                <ListItem>height="auto"로 내용에 맞는 높이 사용</ListItem>
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
                <ListItem>
                  데스크톱 전용 화면에서 바텀시트 사용 (Modal 권장)
                </ListItem>
                <ListItem>바텀시트 안에 바텀시트 중첩</ListItem>
                <ListItem>
                  너무 많은 내용을 height="auto"에 담기 (lg/full 사용)
                </ListItem>
                <ListItem>
                  Flat으로 충분한데 불필요하게 Compound 래퍼 추가
                </ListItem>
                <ListItem>
                  드래그 비활성 + 백드롭 비활성 + 닫기 버튼 없음 (닫을 수 없는
                  상태)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
