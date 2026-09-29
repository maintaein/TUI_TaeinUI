import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './ListPage.css';

export function ListPage() {
  const listPropsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: 'ListItem 요소들',
    },
    {
      name: 'spacing',
      type: "'none' | 'sm' | 'md' | 'lg'",
      default: "'md'",
      description: '항목 간 간격',
    },
    {
      name: 'divider',
      type: 'boolean',
      default: 'false',
      description: '항목 사이에 구분선 표시',
    },
  ];

  const listItemPropsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      description:
        '자유 레이아웃 콘텐츠. 지정 시 label/value를 무시하고 커스텀 렌더링합니다.',
    },
    {
      name: 'label',
      type: 'ReactNode',
      description: '라벨 (왼쪽 또는 위쪽에 표시)',
    },
    {
      name: 'value',
      type: 'ReactNode',
      description: '값 (오른쪽 또는 아래쪽에 표시)',
    },
    {
      name: 'layout',
      type: "'horizontal' | 'vertical' | 'custom'",
      default: "'horizontal'",
      description: 'label-value 배치 방향',
    },
    {
      name: 'align',
      type: "'start' | 'center' | 'end' | 'baseline'",
      default: "'center'",
      description: '항목 내 수직 정렬',
    },
    {
      name: 'labelWidth',
      type: 'string',
      default: 'undefined',
      description: 'label 영역의 고정 너비 (예: "120px")',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>List</h1>
        <p className={styles.description}>
          List 컴포넌트는 설정 항목, 주문 내역, 사양 정보 등을 세로로 나열할 때
          사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { List, ListItem } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<List>
  <ListItem label="이름" value="홍길동" />
  <ListItem label="이메일" value="hong@example.com" />
</List>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 List 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic List</h3>
          <LivePreview
            title="기본 사용법"
            description="label-value 쌍으로 구조화된 정보를 표시합니다."
            editable
            code={`<List>
  <ListItem label="이름" value="홍길동" />
  <ListItem label="이메일" value="hong@example.com" />
  <ListItem label="전화번호" value="010-1234-5678" />
  <ListItem label="주소" value="서울시 강남구" />
</List>`}
          />
        </div>

        {/* Spacing */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Spacing</h3>
          <LivePreview
            title="간격 옵션"
            description="spacing prop으로 항목 사이의 간격을 조절합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <div>
    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>none</div>
    <Border padding="md" rounded="md">
      <List spacing="none">
        <ListItem label="항목 1" value="값 1" />
        <ListItem label="항목 2" value="값 2" />
        <ListItem label="항목 3" value="값 3" />
      </List>
    </Border>
  </div>
  <div>
    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>sm</div>
    <Border padding="md" rounded="md">
      <List spacing="sm">
        <ListItem label="항목 1" value="값 1" />
        <ListItem label="항목 2" value="값 2" />
        <ListItem label="항목 3" value="값 3" />
      </List>
    </Border>
  </div>
  <div>
    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>md (기본)</div>
    <Border padding="md" rounded="md">
      <List spacing="md">
        <ListItem label="항목 1" value="값 1" />
        <ListItem label="항목 2" value="값 2" />
        <ListItem label="항목 3" value="값 3" />
      </List>
    </Border>
  </div>
  <div>
    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>lg</div>
    <Border padding="md" rounded="md">
      <List spacing="lg">
        <ListItem label="항목 1" value="값 1" />
        <ListItem label="항목 2" value="값 2" />
        <ListItem label="항목 3" value="값 3" />
      </List>
    </Border>
  </div>
</div>`}
          />
        </div>

        {/* Divider */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Divider</h3>
          <LivePreview
            title="구분선"
            description="divider prop을 true로 설정하면 각 항목 사이에 구분선이 표시됩니다."
            editable
            code={`<Border padding="md" rounded="md">
  <List divider>
    <ListItem label="주문번호" value="ORD-2024-001" />
    <ListItem label="상품명" value="디자인 시스템 라이선스" />
    <ListItem label="결제금액" value="₩99,000" />
    <ListItem label="결제일" value="2024-01-15" />
    <ListItem label="상태" value="결제완료" />
  </List>
</Border>`}
          />
        </div>

        {/* Layout */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Layout</h3>
          <LivePreview
            title="레이아웃 방향"
            description="ListItem의 layout prop으로 label-value의 배치 방향을 지정합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  <div>
    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>horizontal (기본)</div>
    <Border padding="md" rounded="md">
      <List>
        <ListItem layout="horizontal" label="이름" value="홍길동" />
        <ListItem layout="horizontal" label="역할" value="프론트엔드 개발자" />
      </List>
    </Border>
  </div>
  <div>
    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>vertical</div>
    <Border padding="md" rounded="md">
      <List>
        <ListItem layout="vertical" label="이름" value="홍길동" />
        <ListItem layout="vertical" label="역할" value="프론트엔드 개발자" />
      </List>
    </Border>
  </div>
</div>`}
          />
        </div>

        {/* Align */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Align</h3>
          <LivePreview
            title="수직 정렬"
            description="ListItem의 align prop으로 수직 정렬 방식을 지정합니다. 여러 줄 콘텐츠에서 차이가 드러납니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <Border padding="md" rounded="md">
    <List>
      <ListItem
        align="start"
        label="start"
        value="여러 줄의 긴 텍스트입니다. 정렬 차이를 확인하기 위해 텍스트가 길어야 합니다."
        labelWidth="80px"
      />
    </List>
  </Border>
  <Border padding="md" rounded="md">
    <List>
      <ListItem
        align="center"
        label="center"
        value="여러 줄의 긴 텍스트입니다. 정렬 차이를 확인하기 위해 텍스트가 길어야 합니다."
        labelWidth="80px"
      />
    </List>
  </Border>
  <Border padding="md" rounded="md">
    <List>
      <ListItem
        align="end"
        label="end"
        value="여러 줄의 긴 텍스트입니다. 정렬 차이를 확인하기 위해 텍스트가 길어야 합니다."
        labelWidth="80px"
      />
    </List>
  </Border>
  <Border padding="md" rounded="md">
    <List>
      <ListItem
        align="baseline"
        label="baseline"
        value="여러 줄의 긴 텍스트입니다. 정렬 차이를 확인하기 위해 텍스트가 길어야 합니다."
        labelWidth="80px"
      />
    </List>
  </Border>
</div>`}
          />
        </div>

        {/* Label Width */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Label Width</h3>
          <LivePreview
            title="라벨 고정 너비"
            description="labelWidth prop으로 라벨 영역의 너비를 고정하면 값 영역이 깔끔하게 정렬됩니다."
            editable
            code={`<Border padding="md" rounded="md">
  <List divider>
    <ListItem label="이름" value="홍길동" labelWidth="120px" />
    <ListItem label="이메일" value="hong@example.com" labelWidth="120px" />
    <ListItem label="전화번호" value="010-1234-5678" labelWidth="120px" />
    <ListItem label="가입일" value="2024-01-01" labelWidth="120px" />
  </List>
</Border>`}
          />
        </div>

        {/* Free Layout (children) */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Free Layout (children)</h3>
          <LivePreview
            title="자유 레이아웃"
            description="ListItem에 children을 직접 전달하면 label/value 구조를 무시하고 자유롭게 콘텐츠를 렌더링합니다."
            editable
            code={`<Border padding="md" rounded="md">
  <List divider spacing="md">
    <ListItem>첫 번째 항목입니다.</ListItem>
    <ListItem>두 번째 항목입니다.</ListItem>
    <ListItem>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>커스텀 레이아웃</span>
        <Badge variant="primary">NEW</Badge>
      </div>
    </ListItem>
  </List>
</Border>`}
          />
        </div>

        {/* Combination */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Combination</h3>
          <LivePreview
            title="조합 예제"
            description="실제 사용 사례에 맞는 조합 예시입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
  {/* 사용자 프로필 */}
  <Border padding="lg" rounded="lg">
    <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>사용자 정보</div>
    <List divider>
      <ListItem label="이름" value="홍길동" labelWidth="100px" />
      <ListItem label="이메일" value="hong@example.com" labelWidth="100px" />
      <ListItem label="역할" value="프론트엔드 개발자" labelWidth="100px" />
      <ListItem label="팀" value="디자인 시스템" labelWidth="100px" />
      <ListItem label="가입일" value="2024-01-01" labelWidth="100px" />
    </List>
  </Border>

  {/* 설정 목록 */}
  <Border padding="lg" rounded="lg">
    <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>설정</div>
    <List spacing="lg">
      <ListItem layout="vertical" label="알림" value="모든 알림을 이메일로 수신합니다." />
      <ListItem layout="vertical" label="언어" value="한국어 (Korean)" />
      <ListItem layout="vertical" label="테마" value="시스템 설정에 따름" />
    </List>
  </Border>
</div>`}
          />
        </div>
      </section>

      {/* Props API — List */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API — List</h2>
          <p className={styles.sectionDescription}>
            List 컴포넌트의 Props입니다. HTML ul 속성도 모두 사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={listPropsData} />
        </div>
      </section>

      {/* Props API — ListItem */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API — ListItem</h2>
          <p className={styles.sectionDescription}>
            ListItem 컴포넌트의 Props입니다. HTML li 속성도 모두 사용
            가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={listItemPropsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="List"
        intro="List 컴포넌트는 시맨틱 HTML 목록 요소를 기반으로 다음과 같은 접근성을 기본 제공합니다."
        features={[
          {
            attribute: '<ul> / <li> 요소',
            effect: '스크린 리더에서 "목록"과 "항목"으로 인식합니다.',
            description:
              '네이티브 ul, li 요소를 사용하여 목록 구조를 올바르게 전달합니다.',
          },
          {
            attribute: 'label-value 구조',
            effect: '정보가 순서대로 읽힙니다.',
            description:
              'label과 value가 자연스러운 순서로 스크린 리더에 전달됩니다.',
          },
          {
            attribute: 'HTML 속성 전달',
            effect: 'aria-label 등을 자유롭게 설정할 수 있습니다.',
            description:
              'List는 HTMLUListElement, ListItem은 HTMLLIElement 속성을 모두 지원합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '목록에 제목 연결',
            description:
              '목록의 맥락을 명확히 하려면 aria-labelledby로 제목 요소와 연결하세요.',
            examples: [
              {
                code: `<h3 id="user-info">사용자 정보</h3>
<List aria-labelledby="user-info">
  <ListItem label="이름" value="홍길동" />
  <ListItem label="이메일" value="hong@example.com" />
</List>`,
                explanation:
                  '스크린 리더 사용자가 목록의 맥락을 바로 이해할 수 있습니다.',
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
            List를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>구조화된 데이터에 label-value 패턴 사용</ListItem>
                <ListItem>긴 목록에 divider로 가독성 확보</ListItem>
                <ListItem>labelWidth로 라벨 영역 정렬 통일</ListItem>
                <ListItem>aria-labelledby로 목록 제목 연결</ListItem>
                <ListItem>관련된 정보끼리 하나의 List로 그룹화</ListItem>
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
                  한 List에 label-value와 children 모드를 혼용하지 않기
                </ListItem>
                <ListItem>
                  항목이 너무 많으면 섹션을 나누기 (10개 이상 주의)
                </ListItem>
                <ListItem>
                  spacing="none"과 divider 없이 사용하지 않기 (구분 불가)
                </ListItem>
                <ListItem>
                  네비게이션 목적으로 사용하지 않기 (nav 요소 사용)
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
