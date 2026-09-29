import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './DividerPage.css';

export function DividerPage() {
  const propsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      description: '구분선 내부에 표시할 텍스트 또는 콘텐츠',
    },
    {
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: '구분선 방향',
    },
    {
      name: 'variant',
      type: "'solid' | 'dashed' | 'dotted'",
      default: "'solid'",
      description: '선 스타일',
    },
    {
      name: 'spacing',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: '구분선 위아래 여백',
    },
    {
      name: 'textAlign',
      type: "'left' | 'center' | 'right'",
      default: "'center'",
      description: '텍스트가 있을 때 정렬 위치',
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
        <h1 className={styles.title}>Divider</h1>
        <p className={styles.description}>
          Divider 컴포넌트는 콘텐츠 사이에 시각적 구분선을 넣을 때 사용합니다.
          섹션 분리, 메뉴 항목 구분, 레이아웃 정리 등에 활용할 수 있습니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Divider } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<Divider />
<Divider>또는</Divider>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 Divider 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic Divider</h3>
          <LivePreview
            title="기본 사용법"
            description="콘텐츠 사이에 수평 구분선을 배치합니다."
            editable
            code={`<div>
  <p style={{ color: '#374151' }}>첫 번째 섹션의 내용입니다.</p>
  <Divider />
  <p style={{ color: '#374151' }}>두 번째 섹션의 내용입니다.</p>
</div>`}
          />
        </div>

        {/* Variants */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants</h3>
          <LivePreview
            title="선 스타일"
            description="solid, dashed, dotted 세 가지 선 스타일을 제공합니다."
            editable
            code={`<div>
  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>solid (기본)</p>
  <Divider variant="solid" />
  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>dashed</p>
  <Divider variant="dashed" />
  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>dotted</p>
  <Divider variant="dotted" />
</div>`}
          />
        </div>

        {/* Spacing */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Spacing</h3>
          <LivePreview
            title="여백 크기"
            description="sm, md, lg 세 가지 여백 옵션을 제공합니다."
            editable
            code={`<div>
  <p style={{ color: '#374151' }}>sm 여백</p>
  <Divider spacing="sm" />
  <p style={{ color: '#374151' }}>md 여백 (기본)</p>
  <Divider spacing="md" />
  <p style={{ color: '#374151' }}>lg 여백</p>
  <Divider spacing="lg" />
  <p style={{ color: '#374151' }}>끝</p>
</div>`}
          />
        </div>

        {/* With Text */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>With Text</h3>
          <LivePreview
            title="텍스트 포함"
            description="children으로 텍스트를 전달하면 구분선 사이에 텍스트가 표시됩니다."
            editable
            code={`<div>
  <p style={{ color: '#374151' }}>로그인 폼 영역</p>
  <Divider>또는</Divider>
  <p style={{ color: '#374151' }}>소셜 로그인 영역</p>
  <Divider>OR</Divider>
  <p style={{ color: '#374151' }}>회원가입 영역</p>
</div>`}
          />
        </div>

        {/* Text Align */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Text Align</h3>
          <LivePreview
            title="텍스트 정렬"
            description="textAlign prop으로 텍스트 위치를 left, center, right로 조정합니다."
            editable
            code={`<div>
  <Divider textAlign="left">LEFT</Divider>
  <Divider textAlign="center">CENTER</Divider>
  <Divider textAlign="right">RIGHT</Divider>
</div>`}
          />
        </div>

        {/* Vertical */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Vertical</h3>
          <LivePreview
            title="수직 구분선"
            description="orientation='vertical'로 수직 구분선을 사용합니다. 부모 요소에 height가 있어야 합니다."
            editable
            code={`<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '60px' }}>
  <span style={{ color: '#374151' }}>메뉴 A</span>
  <Divider orientation="vertical" />
  <span style={{ color: '#374151' }}>메뉴 B</span>
  <Divider orientation="vertical" variant="dashed" />
  <span style={{ color: '#374151' }}>메뉴 C</span>
</div>`}
          />
        </div>

        {/* Combination */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Combination</h3>
          <LivePreview
            title="조합 예제"
            description="variant, spacing, textAlign을 조합한 실제 사용 예시입니다."
            editable
            code={`<div>
  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1a2332', marginBottom: '0.5rem' }}>이메일로 로그인</h3>
    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>등록된 이메일과 비밀번호를 입력하세요.</p>
  </div>
  <Divider variant="dashed" spacing="lg">간편 로그인</Divider>
  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
    <Button size="sm" variant="dark">Google</Button>
    <Button size="sm" variant="dark">GitHub</Button>
    <Button size="sm" variant="dark">Kakao</Button>
  </div>
  <Divider spacing="lg" />
  <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
    계정이 없으신가요? 회원가입하세요.
  </p>
</div>`}
          />
        </div>
      </section>

      {/* Props API */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API</h2>
          <p className={styles.sectionDescription}>
            Divider 컴포넌트의 모든 Props와 타입 정보입니다. HTML div 속성도
            모두 사용 가능합니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={propsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Divider"
        intro="Divider 컴포넌트는 시맨틱한 구분선으로 다음과 같은 접근성을 기본 제공합니다."
        features={[
          {
            attribute: 'role="separator"',
            effect: '스크린 리더에서 구분선으로 인식합니다.',
            description:
              'WAI-ARIA separator role을 사용하여 콘텐츠 구분을 명확히 전달합니다.',
          },
          {
            attribute: 'aria-orientation',
            effect: '구분선 방향을 알립니다.',
            description:
              'horizontal 또는 vertical 값으로 구분선의 방향을 스크린 리더에 전달합니다.',
          },
          {
            attribute: '시각적 구분',
            effect: '콘텐츠 영역을 명확히 나눕니다.',
            description:
              'solid, dashed, dotted 스타일로 시각적 구분을 제공하여 콘텐츠 구조를 파악하기 쉽게 합니다.',
          },
          {
            attribute: '텍스트 콘텐츠',
            effect: '구분선의 맥락을 설명합니다.',
            description:
              'children으로 텍스트를 넣으면 스크린 리더가 구분선의 의미를 읽을 수 있습니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '장식용 구분선과 의미 있는 구분선',
            description:
              '콘텐츠 구분이 아닌 단순 장식 목적이라면 aria-hidden을 사용하세요.',
            examples: [
              {
                code: `// Good - 의미 있는 구분선
<Divider>또는</Divider>

// Good - 장식용
<Divider aria-hidden="true" />

// Bad - 불필요한 구분선 남발
<Divider />
<Divider />
<Divider />`,
                explanation:
                  '구분선이 너무 많으면 스크린 리더 사용자에게 불필요한 정보가 전달됩니다.',
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
            Divider를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>논리적으로 다른 콘텐츠 사이에 배치</ListItem>
                <ListItem>
                  로그인/회원가입 폼에서 "또는" 텍스트와 함께 사용
                </ListItem>
                <ListItem>수직 구분선은 인라인 메뉴 구분에 활용</ListItem>
                <ListItem>spacing으로 적절한 시각적 여백 확보</ListItem>
                <ListItem>텍스트가 있을 때 textAlign으로 가독성 향상</ListItem>
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
                <ListItem>연속으로 여러 구분선을 배치하지 않기</ListItem>
                <ListItem>
                  padding/margin으로 대체 가능한 곳에 남용하지 않기
                </ListItem>
                <ListItem>
                  수직 구분선에 height 없는 부모 사용하지 않기
                </ListItem>
                <ListItem>텍스트에 너무 긴 문장 넣지 않기</ListItem>
                <ListItem>카드, 리스트 내부에서 중복 구분하지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
