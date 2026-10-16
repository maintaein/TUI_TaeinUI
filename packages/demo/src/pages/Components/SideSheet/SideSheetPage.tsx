import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './SideSheetPage.css';

export function SideSheetPage() {
  const sideSheetProps: PropDefinition[] = [
    {
      name: 'open',
      type: 'boolean',
      required: true,
      description: '사이드시트 표시 여부',
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
      description: '사이드시트 내부 콘텐츠',
    },
    {
      name: 'title',
      type: 'ReactNode',
      description: '사이드시트 제목. 지정하면 헤더 영역이 자동 생성됩니다',
    },
    {
      name: 'width',
      type: "'sm' | 'md' | 'lg' | 'full'",
      default: "'md'",
      description: '사이드시트 너비 (sm:300px, md:400px, lg:600px, full:100vw)',
    },
    {
      name: 'position',
      type: "'left' | 'right'",
      default: "'right'",
      description: '사이드시트가 나타나는 방향',
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
      name: 'showClose',
      type: 'boolean',
      default: 'false',
      description: '닫기(X) 버튼 표시 여부. title이 있을 때만 동작',
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
        <h1 className={styles.title}>SideSheet</h1>
        <p className={styles.description}>
          SideSheet 컴포넌트는 상세 정보, 설정 패널, 편집 폼 등을 화면 옆에서
          슬라이드로 열 때 사용합니다.
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
  SideSheet,
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
  <SideSheet
    open={open}
    onClose={() => setOpen(false)}
    title="제목"
    showClose
  >
    내용
  </SideSheet>
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
            다양한 사용 사례에 맞는 SideSheet 예제입니다.
          </p>
        </div>

        <div className={styles.example}>
          <LivePreview
            title="기본 사이드시트"
            description="title을 전달하면 헤더가 자동 생성됩니다. showClose로 닫기 버튼을 추가할 수 있습니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div>
  <Button size="sm" onClick={() => setOpen(true)}>사이드시트 열기</Button>
  <SideSheet open={open} onClose={() => setOpen(false)} title="알림" showClose>
    <p>사이드시트 내용이 여기에 표시됩니다.</p>
  </SideSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Position</h3>
          <LivePreview
            title="위치 옵션"
            description="버튼을 클릭하면 해당 방향에서 사이드시트가 열립니다. 기본값은 right입니다."
            editable
            code={`const [position, setPosition] = useState('right');
const [open, setOpen] = useState(false);

<div>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    {['left', 'right'].map((p) => (
      <Button key={p} size="sm" variant={p === position ? 'primary' : 'light'} onClick={() => { setPosition(p); setOpen(true); }}>
        {p}
      </Button>
    ))}
  </div>
  <SideSheet open={open} onClose={() => setOpen(false)} title={'position="' + position + '"'} showClose position={position}>
    <p>현재 위치: <strong>{position}</strong></p>
    <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>사이드시트가 화면의 {position === 'left' ? '왼쪽' : '오른쪽'}에서 슬라이드인됩니다.</p>
  </SideSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>시차 등장</h3>
          <LivePreview
            title="목록이 떠오르며 등장"
            description="시트가 옆에서 튀며 들어온 뒤, 내용의 직계 자식이 45ms 간격으로 위로 떠오르고 열린 동안 붙은 가장자리에서 안쪽으로 둥실거립니다. 항목을 하나의 래퍼로 감싸면 시차가 한 덩어리가 됩니다."
            editable
            code={`const [open, setOpen] = useState(false);
const [position, setPosition] = useState('right');
const rows = ['받은 알림', '멘션', '초대', '공지', '시스템', '업데이트'];

<div style={{ display: 'flex', gap: '0.5rem' }}>
  {['left', 'right'].map((p) => (
    <Button key={p} size="sm" onClick={() => { setPosition(p); setOpen(true); }}>
      {p}에서 열기
    </Button>
  ))}
  <SideSheet open={open} onClose={() => setOpen(false)} title="알림" showClose position={position}>
    {rows.map((r) => (
      <p key={r} style={{ padding: '0.75rem 0', borderBottom: '1px solid #e5e7eb' }}>{r}</p>
    ))}
  </SideSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Width</h3>
          <LivePreview
            title="width 옵션"
            description="sm(300px), md(400px), lg(600px), full(100vw)"
            editable
            code={`const [width, setWidth] = useState('md');
const [open, setOpen] = useState(false);
const widths = ['sm', 'md', 'lg', 'full'];

<div>
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    {widths.map((w) => (
      <Button key={w} size="sm" variant={w === width ? 'primary' : 'light'} onClick={() => { setWidth(w); setOpen(true); }}>
        {w}
      </Button>
    ))}
  </div>
  <SideSheet open={open} onClose={() => setOpen(false)} title={'width="' + width + '"'} showClose width={width}>
    <p>현재 너비: <strong>{width}</strong></p>
  </SideSheet>
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
  <Button size="sm" onClick={() => setOpen(true)}>백드롭 비활성 사이드시트</Button>
  <SideSheet open={open} onClose={() => setOpen(false)} title="설정" showClose closeOnBackdropClick={false}>
    <p>배경 클릭으로 닫히지 않습니다. X 버튼이나 Esc 키로만 닫을 수 있습니다.</p>
  </SideSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>네비게이션 패널</h3>
          <LivePreview
            title="Navigation Panel"
            description="왼쪽에서 슬라이드인되는 네비게이션 메뉴 패턴입니다."
            editable
            code={`const [open, setOpen] = useState(false);
const [selected, setSelected] = useState('');
const menuItems = ['대시보드', '프로젝트', '팀 멤버', '설정', '도움말'];

<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <Button size="sm" onClick={() => setOpen(true)}>메뉴</Button>
  {selected && <span style={{ color: '#10b981', fontSize: '0.875rem' }}>{selected} 선택됨</span>}
  <SideSheet open={open} onClose={() => setOpen(false)} title="메뉴" showClose position="left" width="sm">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {menuItems.map((item) => (
        <button key={item} onClick={() => { setSelected(item); setOpen(false); }} style={{ padding: '0.75rem 1rem', border: 'none', background: selected === item ? '#f3f4f6' : 'transparent', fontSize: '0.9375rem', textAlign: 'left', cursor: 'pointer', borderRadius: '0.5rem', color: '#374151' }}>
          {item}
        </button>
      ))}
    </div>
  </SideSheet>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>필터 패널</h3>
          <LivePreview
            title="Filter Panel"
            description="필터 옵션을 사이드시트에 배치하는 패턴입니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div>
  <Button size="sm" onClick={() => setOpen(true)}>필터</Button>
  <SideSheet open={open} onClose={() => setOpen(false)} title="필터" showClose width="sm" closeOnBackdropClick={false}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>카테고리</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {['전체', '디자인', '개발', '마케팅'].map((c) => (
            <Checkbox key={c} label={c} />
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>상태</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {['진행 중', '완료', '보류'].map((s) => (
            <Checkbox key={s} label={s} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Button size="sm" variant="light" onClick={() => setOpen(false)}>초기화</Button>
        <Button size="sm" onClick={() => setOpen(false)}>적용</Button>
      </div>
    </div>
  </SideSheet>
</div>`}
          />
        </div>
      </section>

      {/* Flat vs Compound */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Flat vs Compound 패턴</h2>
          <p className={styles.sectionDescription}>
            SideSheet는 두 가지 API 스타일을 제공합니다. 상황에 맞게 선택하세요.
          </p>
        </div>

        <div className={styles.patternCompareGrid}>
          <div className={styles.patternCard}>
            <p className={styles.patternCardTitle}>Flat Pattern (기본 권장)</p>
            <p className={styles.patternCardDesc}>
              SideSheet 컴포넌트에 title, showClose 등의 props를 전달하는
              방식입니다. 대부분의 사용 케이스에 적합합니다.
            </p>
            <p className={styles.patternCardWhen}>사용할 때</p>
            <ul className={styles.patternCardList}>
              <li>페이지·기능 컴포넌트에서 사이드시트를 직접 사용할 때</li>
              <li>title/showClose props로 충분한 표준 레이아웃</li>
              <li>별도 헤더 커스텀이 필요 없을 때</li>
            </ul>
          </div>
          <div className={styles.patternCard}>
            <p className={styles.patternCardTitle}>
              Compound Pattern (커스텀용)
            </p>
            <p className={styles.patternCardDesc}>
              SideSheet.Header, SideSheet.Content 등 점 표기법으로 헤더/콘텐츠
              영역을 자유롭게 커스텀합니다.
            </p>
            <p className={styles.patternCardWhen}>사용할 때</p>
            <ul className={styles.patternCardList}>
              <li>헤더에 커스텀 요소(검색바, 탭 등)를 배치할 때</li>
              <li>도메인 전용 사이드시트 컴포넌트를 만들 때</li>
              <li>서브컴포넌트별 className 오버라이드가 필요할 때</li>
            </ul>
          </div>
        </div>

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
                <td className={styles.patternCompareTd}>SideSheet 하나</td>
                <td className={styles.patternCompareTd}>
                  SideSheet.Header, SideSheet.Content 등 점 표기법
                </td>
              </tr>
              <tr className={styles.patternCompareTr}>
                <td className={styles.patternCompareTdLabel}>헤더 구성</td>
                <td className={styles.patternCompareTd}>
                  title, showClose props로 자동 생성
                </td>
                <td className={styles.patternCompareTd}>
                  SideSheetHeader 안에 자유 배치
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

        <div className={styles.example} style={{ marginTop: '2rem' }}>
          <h3 className={styles.exampleTitle}>
            Compound 실전 예시: 도메인 전용 사이드시트
          </h3>
          <p
            className={styles.sectionDescription}
            style={{ marginBottom: '1rem' }}
          >
            Compound Pattern으로 도메인 전용 컴포넌트를 만들 때 활용합니다.
          </p>
          <CodeBlock
            language="tsx"
            code={`// components/NotificationPanel.tsx
import { SideSheet } from '@taein-ui/core';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: { id: string; title: string; message: string }[];
}

export function NotificationPanel({ open, onClose, notifications }: NotificationPanelProps) {
  return (
    <SideSheet open={open} onClose={onClose} width="sm">
      <SideSheet.Header showClose>
        <SideSheet.Title>알림 ({notifications.length})</SideSheet.Title>
      </SideSheet.Header>
      <SideSheet.Content>
        {notifications.map((n) => (
          <div key={n.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ fontWeight: 600 }}>{n.title}</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{n.message}</p>
          </div>
        ))}
      </SideSheet.Content>
    </SideSheet>
  );
}

// 사용:
// <NotificationPanel
//   open={open}
//   onClose={() => setOpen(false)}
//   notifications={[...]}
// />`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            Compound 커스텀 확장: 점 표기법
          </h3>
          <p
            className={styles.sectionDescription}
            style={{ marginBottom: '1rem' }}
          >
            SideSheet.Header 점 표기법으로 검색바 등 커스텀 헤더를 구성할 수
            있습니다.
          </p>
          <CodeBlock
            language="tsx"
            code={`import { SideSheet } from '@taein-ui/core';
import * as styles from './SearchPanel.css';

export function SearchPanel({ open, onClose }) {
  return (
    <SideSheet open={open} onClose={onClose} position="left" width="lg">
      <SideSheet.Header className={styles.searchHeader} showClose>
        <SideSheet.Title>검색</SideSheet.Title>
        {/* 헤더에 커스텀 검색바 배치 */}
        <input
          type="search"
          placeholder="검색어 입력..."
          className={styles.searchInput}
        />
      </SideSheet.Header>
      <SideSheet.Content className={styles.searchResults}>
        {/* 검색 결과 */}
      </SideSheet.Content>
    </SideSheet>
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
            두 패턴 모두 동일한 Props를 사용합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>SideSheet</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={sideSheetProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            SideSheetHeader / SideSheet.Header
          </h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={headerProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            SideSheetTitle / SideSheet.Title
          </h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={titleProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>
            SideSheetContent / SideSheet.Content
          </h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={contentProps} />
          </div>
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="SideSheet"
        intro="SideSheet는 role='dialog', aria-modal, 포커스 트랩, 포커스 복귀를 통해 키보드와 스크린 리더 사용자가 사이드시트 콘텐츠에 올바르게 접근할 수 있도록 지원합니다."
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
              '스크린 리더가 사이드시트 뒤의 콘텐츠를 읽지 않도록 합니다.',
          },
          {
            attribute: 'aria-labelledby',
            effect: '사이드시트 제목 연결',
            description:
              'title prop이 있으면 자동으로 제목 요소의 id가 연결됩니다.',
          },
          {
            attribute: '포커스 트랩 (Tab)',
            effect: '내부 포커스 순환',
            description:
              'Tab/Shift+Tab이 사이드시트 내부 요소 사이에서만 순환되어 외부로 탈출하지 않습니다.',
          },
          {
            attribute: 'Escape 키',
            effect: '키보드 닫힘',
            description:
              'Esc 키로 사이드시트를 닫을 수 있습니다. closeOnEscape={false}로 비활성화 가능합니다.',
          },
          {
            attribute: '포커스 복귀',
            effect: '이전 포커스 복원',
            description:
              '사이드시트가 닫히면 사이드시트를 열었던 요소로 포커스가 자동 복귀됩니다.',
          },
        ]}
      />

      {/* Best Practices */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Best Practices</h2>
          <p className={styles.sectionDescription}>
            SideSheet를 효과적으로 사용하기 위한 권장사항입니다.
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
                  일반 케이스는 Flat Pattern (SideSheet + title/showClose props)
                  사용
                </ListItem>
                <ListItem>
                  네비게이션은 position="left", 상세 정보는 position="right"
                </ListItem>
                <ListItem>명확한 제목으로 사이드시트의 목적을 전달</ListItem>
                <ListItem>
                  폼 입력 시 closeOnBackdropClick={'{false}'} 설정
                </ListItem>
                <ListItem>콘텐츠 양에 맞는 width 선택 (sm/md/lg)</ListItem>
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
                  모바일 전용 화면에서 사이드시트 사용 (BottomSheet 권장)
                </ListItem>
                <ListItem>사이드시트 안에 사이드시트 중첩</ListItem>
                <ListItem>좁은 화면에서 width="lg" 또는 "full" 남용</ListItem>
                <ListItem>
                  Flat으로 충분한데 불필요하게 Compound 래퍼 추가
                </ListItem>
                <ListItem>
                  백드롭 비활성 + 닫기 버튼 없음 (닫을 수 없는 상태)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
