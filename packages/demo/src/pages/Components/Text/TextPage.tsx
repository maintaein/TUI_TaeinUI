import { Card, List, ListItem } from '@taein-designsystem/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './TextPage.css';

export function TextPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      description: '텍스트 내용. 비어 있으면 렌더링하지 않음',
    },
    {
      name: 'variant',
      type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'body3'",
      default: "'body1'",
      description:
        '텍스트 variant (heading/body). variant에 따라 기본 HTML 태그가 자동 결정됨',
    },
    {
      name: 'as',
      type: 'ElementType',
      description: 'HTML 태그 직접 지정 (variant보다 우선)',
    },
    {
      name: 'color',
      type: "'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'disabled'",
      description:
        '텍스트 색상. semantic 색은 계약의 dark 슬롯을 사용합니다(main은 UI 요소용이라 본문 대비가 부족합니다)',
    },
    {
      name: 'weight',
      type: "'regular' | 'medium' | 'semibold' | 'bold'",
      description: '폰트 굵기 (variant 기본 weight를 오버라이드)',
    },
    {
      name: 'align',
      type: "'left' | 'center' | 'right'",
      description: '텍스트 정렬',
    },
    {
      name: 'truncate',
      type: '1 | 2 | 3',
      description: '텍스트 줄 수 제한 (넘치면 말줄임)',
    },
    {
      name: 'tabularNums',
      type: 'boolean',
      description:
        '숫자를 고정폭으로 렌더 (표·지표처럼 자릿수를 세로로 맞춰야 할 때)',
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
        <h1 className={styles.title}>Text</h1>
        <p className={styles.description}>
          Text 컴포넌트는 제목, 본문, 캡션 등 텍스트의 크기와 스타일을 일관되게
          적용할 때 사용합니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Text } from '@taein-designsystem/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Heading</h3>
            <CodeBlock
              language="tsx"
              code={`<Text variant="h1">페이지 제목</Text>`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Body</h3>
            <CodeBlock
              language="tsx"
              code={`<Text variant="body2" color="secondary">
  보조 텍스트
</Text>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Heading Variants */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Heading Variants</h2>
          <p className={styles.sectionDescription}>
            h1~h6 variant는 각각 대응하는 HTML heading 태그를 자동으로
            사용합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Headings (h1 ~ h6)</h3>
          <LivePreview
            title="Heading Variants"
            description="h1(36px)부터 h6(16px)까지 6단계의 heading을 제공합니다. 각 variant는 대응하는 HTML 태그를 자동 사용합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <Text variant="h1">h1 - 페이지 제목 (2.25rem)</Text>
  <Text variant="h2">h2 - 섹션 제목 (1.875rem)</Text>
  <Text variant="h3">h3 - 하위 섹션 (1.5rem)</Text>
  <Text variant="h4">h4 - 카드 제목 (1.25rem)</Text>
  <Text variant="h5">h5 - 소제목 (1.125rem)</Text>
  <Text variant="h6">h6 - 캡션 제목 (1rem)</Text>
</div>`}
          />
        </div>
      </section>

      {/* Body Variants */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Body Variants</h2>
          <p className={styles.sectionDescription}>
            본문 텍스트를 위한 3가지 크기를 제공합니다. 모두 p 태그로
            렌더링됩니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Body (body1 ~ body3)</h3>
          <LivePreview
            title="Body Variants"
            description="body1(16px, 기본값), body2(14px), body3(12px) 세 가지 본문 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Text variant="body1">body1 - 기본 본문 텍스트입니다. (1rem / 16px)</Text>
  <Text variant="body2">body2 - 보조 본문 텍스트입니다. (0.875rem / 14px)</Text>
  <Text variant="body3">body3 - 캡션이나 메타 정보에 사용합니다. (0.75rem / 12px)</Text>
</div>`}
          />
        </div>
      </section>

      {/* Colors */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Colors</h2>
          <p className={styles.sectionDescription}>
            의미에 따라 텍스트 색상을 지정할 수 있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Color Variants</h3>
          <LivePreview
            title="텍스트 색상"
            description="6가지 의미론적 색상을 제공합니다. semantic 색(success/warning/error/info)은 계약의 dark 슬롯을 써서 흰 배경과 paper 배경 모두에서 AA(4.5:1)를 만족합니다. main 슬롯은 UI 요소용이라 본문 텍스트로는 대비가 부족합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <Text color="primary">Primary - 주요 텍스트 (text.primary)</Text>
  <Text color="secondary">Secondary - 보조 텍스트 (text.secondary)</Text>
  <Text color="success">Success - 성공 상태 (success.dark)</Text>
  <Text color="warning">Warning - 주의 상태 (warning.dark)</Text>
  <Text color="error">Error - 에러 상태 (error.dark)</Text>
  <Text color="info">Info - 정보 안내 (info.dark)</Text>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Color with Headings</h3>
          <LivePreview
            title="Heading + Color 조합"
            description="heading variant와 color를 조합하여 다양한 맥락의 제목을 표현합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <Text variant="h3" color="primary">기본 섹션 제목</Text>
  <Text variant="h3" color="error">오류 안내 제목</Text>
  <Text variant="h3" color="success">완료 안내 제목</Text>
  <Text variant="h4" color="secondary">부가 설명 제목</Text>
</div>`}
          />
        </div>
      </section>

      {/* Weight */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Font Weight</h2>
          <p className={styles.sectionDescription}>
            weight prop으로 variant의 기본 굵기를 오버라이드할 수 있습니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Weight Variants</h3>
          <LivePreview
            title="폰트 굵기"
            description="regular(400), medium(500), semibold(600), bold(700) 네 가지 굵기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <Text weight="regular">Regular (400) - 가벼운 본문 텍스트</Text>
  <Text weight="medium">Medium (500) - 약간 강조된 텍스트</Text>
  <Text weight="semibold">Semibold (600) - 강조 텍스트</Text>
  <Text weight="bold">Bold (700) - 굵은 강조 텍스트</Text>
</div>`}
          />
        </div>
      </section>

      {/* Align */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Text Align</h2>
          <p className={styles.sectionDescription}>
            텍스트 정렬 방향을 지정합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Alignment</h3>
          <LivePreview
            title="텍스트 정렬"
            description="left, center, right 세 가지 정렬을 지원합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px dashed #d1d5db', padding: '1rem', borderRadius: '0.5rem' }}>
  <Text align="left">왼쪽 정렬 (기본값)</Text>
  <Text align="center">가운데 정렬</Text>
  <Text align="right">오른쪽 정렬</Text>
</div>`}
          />
        </div>
      </section>

      {/* Truncate */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Truncate</h2>
          <p className={styles.sectionDescription}>
            텍스트가 지정된 줄 수를 넘으면 말줄임(...) 처리합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Line Clamp</h3>
          <LivePreview
            title="줄 수 제한"
            description="truncate prop으로 1줄, 2줄, 3줄까지 말줄임을 적용할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
  <div>
    <Text variant="body2" color="secondary" weight="semibold">truncate={1}</Text>
    <Text truncate={1}>이것은 아주 긴 텍스트입니다. 한 줄을 넘어가면 말줄임 처리가 되어 깔끔하게 보여집니다. 긴 제목이나 한 줄 설명에 유용합니다.</Text>
  </div>
  <div>
    <Text variant="body2" color="secondary" weight="semibold">truncate={2}</Text>
    <Text truncate={2}>이것은 아주 긴 텍스트입니다. 두 줄까지 표시하고 나머지는 말줄임 처리됩니다. 카드 설명이나 리스트 아이템의 부가 설명에 적합합니다. 사용자가 전체 내용을 보려면 상세 페이지로 이동하면 됩니다.</Text>
  </div>
  <div>
    <Text variant="body2" color="secondary" weight="semibold">truncate={3}</Text>
    <Text truncate={3}>이것은 아주 긴 텍스트입니다. 세 줄까지 표시하고 나머지는 말줄임 처리됩니다. 미리보기 영역이나 요약 텍스트에 적합합니다. 더 많은 내용을 담으면서도 레이아웃을 일정하게 유지할 수 있습니다. 이렇게 충분히 긴 텍스트를 넣어야 말줄임이 발생합니다.</Text>
  </div>
</div>`}
          />
        </div>
      </section>

      {/* as Prop */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Custom Element</h2>
          <p className={styles.sectionDescription}>
            as prop으로 렌더링할 HTML 태그를 직접 지정할 수 있습니다.
            variant보다 우선합니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>as Prop</h3>
          <LivePreview
            title="커스텀 태그"
            description="as prop을 사용하면 variant의 스타일은 유지하면서 렌더링되는 HTML 태그만 변경할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <Text variant="h3" as="span">h3 스타일이지만 span으로 렌더링</Text>
  <Text variant="body1" as="label">body1 스타일이지만 label로 렌더링</Text>
  <Text variant="body2" as="strong">body2 스타일이지만 strong으로 렌더링</Text>
</div>`}
          />
        </div>
      </section>

      {/* Combination */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Combinations</h2>
          <p className={styles.sectionDescription}>
            variant, color, weight를 조합하여 다양한 UI 패턴을 구성하는
            예시입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Article Layout</h3>
          <LivePreview
            title="아티클 레이아웃"
            description="실제 콘텐츠에서 Text 컴포넌트를 조합하여 글 레이아웃을 구성하는 패턴입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
  <Text variant="h2">디자인 시스템의 장점</Text>
  <Text variant="body2" color="secondary">2024년 12월 15일 | 디자인 팀</Text>
  <Text variant="body1">디자인 시스템은 일관된 사용자 경험을 제공하고 개발 속도를 높여줍니다. 재사용 가능한 컴포넌트를 통해 디자이너와 개발자가 같은 언어로 소통할 수 있습니다.</Text>
  <Text variant="body2" color="secondary">디자인 시스템을 도입하면 유지보수 비용이 줄어들고 브랜드 일관성을 쉽게 유지할 수 있습니다.</Text>
</div>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Status Messages</h3>
          <LivePreview
            title="상태 메시지"
            description="color와 weight를 조합하여 상태 메시지를 표현합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#E8F5E9', borderRadius: '0.5rem', borderLeft: '3px solid #4CAF50' }}>
    <Text color="success" weight="semibold">저장이 완료되었습니다.</Text>
  </div>
  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FFEBEE', borderRadius: '0.5rem', borderLeft: '3px solid #D32F2F' }}>
    <Text color="error" weight="semibold">필수 항목을 입력해주세요.</Text>
  </div>
  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FAFAFA', borderRadius: '0.5rem', borderLeft: '3px solid #BDBDBD' }}>
    <Text>이 기능은 현재 사용할 수 없습니다.</Text>
  </div>
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Text 컴포넌트의 모든 Props와 타입 정보입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Text"
        intro="Text 컴포넌트는 시맨틱 HTML을 기반으로 다음과 같은 접근성을 기본 제공합니다."
        features={[
          {
            attribute: '시맨틱 태그 자동 선택',
            effect: 'heading은 h1~h6, body는 p 태그로 렌더링됩니다.',
            description:
              'variant에 따라 적절한 HTML 태그가 자동으로 선택되어 문서 구조를 올바르게 전달합니다.',
          },
          {
            attribute: 'as prop',
            effect: '시맨틱 태그를 직접 지정할 수 있습니다.',
            description:
              '필요한 경우 as prop으로 렌더링 태그를 변경하여 문서 구조에 맞게 조정할 수 있습니다.',
          },
          {
            attribute: '색상 대비',
            effect: '텍스트 가독성이 보장됩니다.',
            description:
              'primary(#000), secondary(#666) 등 웹 접근성 색상 대비 기준을 충족하는 색상을 제공합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: 'Heading 순서 지키기',
            description:
              '문서의 heading은 건너뛰지 않고 순서대로 사용해야 합니다.',
            examples: [
              {
                code: `// Good
<Text variant="h1">페이지 제목</Text>
<Text variant="h2">섹션 제목</Text>
<Text variant="h3">하위 섹션</Text>

// Bad - h2를 건너뜀
<Text variant="h1">페이지 제목</Text>
<Text variant="h3">하위 섹션</Text>`,
                explanation:
                  'heading 레벨을 건너뛰면 스크린 리더 사용자가 문서 구조를 파악하기 어렵습니다.',
              },
            ],
          },
          {
            title: '시각적 크기와 시맨틱 분리',
            description:
              '시각적으로 작은 heading이 필요하면 as prop으로 시맨틱은 유지하고 스타일만 변경하세요.',
            examples: [
              {
                code: `// Good - 시맨틱 h2, 시각적으로 h4 크기
<Text variant="h4" as="h2">작은 크기의 섹션 제목</Text>

// Bad - 시맨틱이 깨짐
<Text variant="h4">작은 크기의 섹션 제목</Text>`,
                explanation:
                  '문서 구조상 h2여야 하지만 크기를 작게 하고 싶을 때 as prop을 활용하세요.',
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
            Text를 효과적으로 사용하기 위한 권장사항입니다.
          </p>
        </div>

        <div className={styles.practicesGrid}>
          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIcon}>&#10003;</span>
                <h3 className={styles.practiceTitle}>Do</h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>heading 순서를 h1 → h2 → h3 순으로 유지</ListItem>
                <ListItem>body1은 주요 본문, body2는 보조 설명에 사용</ListItem>
                <ListItem>
                  의미에 맞는 color 사용 (error는 오류, success는 성공)
                </ListItem>
                <ListItem>긴 텍스트에 truncate로 레이아웃 일관성 유지</ListItem>
                <ListItem>시맨틱과 스타일이 다를 때 as prop 활용</ListItem>
              </List>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body padding="lg">
              <div className={styles.practiceHeader}>
                <span className={styles.practiceIconError}>&#10007;</span>
                <h3 className={styles.practiceTitle}>Don't</h3>
              </div>
              <List spacing="sm" className={styles.practiceList}>
                <ListItem>heading 레벨을 건너뛰지 않기 (h1 → h3 금지)</ListItem>
                <ListItem>
                  스타일 목적으로만 heading variant 사용하지 않기
                </ListItem>
                <ListItem>color를 장식 목적으로 사용하지 않기</ListItem>
                <ListItem>
                  truncate 없이 고정 높이 컨테이너에 긴 텍스트 넣지 않기
                </ListItem>
                <ListItem>
                  같은 영역에서 너무 많은 variant를 혼용하지 않기
                </ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
