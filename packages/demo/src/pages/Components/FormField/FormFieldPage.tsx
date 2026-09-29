import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './FormFieldPage.css';

export function FormFieldPage() {
  const formFieldProps: PropDefinition[] = [
    {
      name: 'label',
      type: 'string',
      required: true,
      description: '폼 필드 레이블 텍스트',
    },
    {
      name: 'children',
      type: '(props: FormFieldRenderProps) => ReactNode',
      required: true,
      description:
        'Render prop 함수. inputId, helperId, hasHelper, isError를 인자로 받습니다.',
    },
    {
      name: 'helperText',
      type: 'string',
      description: '입력 안내 텍스트. error가 아닐 때 표시됩니다.',
    },
    {
      name: 'error',
      type: 'boolean',
      default: 'false',
      description: '에러 상태 여부',
    },
    {
      name: 'errorMessage',
      type: 'string',
      description: '에러 메시지. error가 true일 때 표시됩니다.',
    },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: '필수 입력 표시 (* 표시)',
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      description: '전체 너비 사용',
    },
  ];

  const renderPropsData: PropDefinition[] = [
    {
      name: 'inputId',
      type: 'string',
      required: true,
      description: 'label의 htmlFor와 연결할 input의 id 값',
    },
    {
      name: 'helperId',
      type: 'string',
      required: true,
      description: 'aria-describedby에 연결할 helperText/errorMessage의 id 값',
    },
    {
      name: 'hasHelper',
      type: 'boolean',
      required: true,
      description: 'helperText 또는 errorMessage가 표시 중인지 여부',
    },
    {
      name: 'isError',
      type: 'boolean',
      required: true,
      description: '현재 에러 상태인지 여부',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>FormField</h1>
        <p className={styles.description}>
          FormField 컴포넌트는 입력 요소에 라벨, 도움말, 에러 메시지를 일관되게
          감쌀 때 사용합니다. 커스텀 입력 컴포넌트에도 동일한 폼 레이아웃을
          적용할 수 있습니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { FormField } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<FormField label="이름" required>
  {({ inputId }) => (
    <TextField id={inputId} placeholder="이름 입력" />
  )}
</FormField>`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Render Props 패턴 설명 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Render Prop 패턴</h2>
          <p className={styles.sectionDescription}>
            FormField는 children으로 함수를 받습니다. 이 함수에 전달되는 props를
            활용해 입력 컴포넌트의 접근성을 자동으로 연결할 수 있습니다.
          </p>
        </div>

        <div className={styles.patternCard}>
          <p className={styles.patternCardTitle}>children에 전달되는 Props</p>
          <p className={styles.patternCardDesc}>
            FormField가 내부에서 고유 id를 생성하고, 자식 함수에 전달합니다. 이
            값들을 input 요소에 연결하면 label-input 연결, 도움말 연결이
            자동으로 이루어집니다.
          </p>
          <div className={styles.renderPropsGrid}>
            <div className={styles.renderPropItem}>
              <span className={styles.renderPropName}>inputId</span>
              <span className={styles.renderPropDesc}>
                input의 id에 설정 → label과 자동 연결
              </span>
            </div>
            <div className={styles.renderPropItem}>
              <span className={styles.renderPropName}>helperId</span>
              <span className={styles.renderPropDesc}>
                aria-describedby에 설정 → 도움말/에러와 연결
              </span>
            </div>
            <div className={styles.renderPropItem}>
              <span className={styles.renderPropName}>hasHelper</span>
              <span className={styles.renderPropDesc}>
                도움말이 표시 중인지 확인. aria-describedby 조건부 설정에 사용
              </span>
            </div>
            <div className={styles.renderPropItem}>
              <span className={styles.renderPropName}>isError</span>
              <span className={styles.renderPropDesc}>
                에러 상태 여부. aria-invalid 설정에 사용
              </span>
            </div>
          </div>
        </div>

        <div className={styles.example} style={{ marginTop: '2rem' }}>
          <h3 className={styles.exampleTitle}>Render Prop 연결 방법</h3>
          <CodeBlock
            language="tsx"
            code={`<FormField label="이메일" helperText="업무용 이메일을 입력하세요" required>
  {({ inputId, helperId, hasHelper, isError }) => (
    <input
      id={inputId}
      type="email"
      aria-invalid={isError}
      aria-describedby={hasHelper ? helperId : undefined}
    />
  )}
</FormField>`}
          />
        </div>
      </section>

      {/* Examples */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 FormField 예제입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>기본 사용법</h3>
          <LivePreview
            title="Basic FormField"
            description="label과 TextField를 연결하는 가장 기본적인 사용법입니다."
            editable
            code={`<FormField label="이름">
  {({ inputId }) => (
    <TextField id={inputId} placeholder="이름을 입력하세요" />
  )}
</FormField>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Required</h3>
          <LivePreview
            title="필수 입력"
            description="required를 설정하면 레이블 옆에 빨간색 * 표시가 추가됩니다."
            editable
            code={`<FormField label="이메일" required>
  {({ inputId }) => (
    <TextField id={inputId} placeholder="이메일을 입력하세요" />
  )}
</FormField>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Helper Text</h3>
          <LivePreview
            title="도움말 텍스트"
            description="helperText로 입력에 대한 추가 안내를 제공합니다."
            editable
            code={`<FormField label="비밀번호" helperText="8자 이상, 영문+숫자 조합">
  {({ inputId, helperId, hasHelper }) => (
    <TextField
      id={inputId}
      type="password"
      placeholder="비밀번호 입력"
      aria-describedby={hasHelper ? helperId : undefined}
    />
  )}
</FormField>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Error State</h3>
          <LivePreview
            title="에러 상태"
            description="error와 errorMessage로 유효성 검증 실패를 표시합니다. 에러 상태에서는 helperText 대신 errorMessage가 표시됩니다."
            editable
            code={`<FormField label="이메일" error errorMessage="올바른 이메일 형식이 아닙니다" required>
  {({ inputId, helperId, hasHelper, isError }) => (
    <TextField
      id={inputId}
      defaultValue="invalid-email"
      aria-invalid={isError}
      aria-describedby={hasHelper ? helperId : undefined}
    />
  )}
</FormField>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Full Width</h3>
          <LivePreview
            title="전체 너비"
            description="fullWidth로 부모 요소의 전체 너비를 채웁니다."
            editable
            code={`<FormField label="주소" fullWidth helperText="상세 주소까지 입력해 주세요">
  {({ inputId, helperId, hasHelper }) => (
    <TextField
      id={inputId}
      placeholder="주소를 입력하세요"
      fullWidth
      aria-describedby={hasHelper ? helperId : undefined}
    />
  )}
</FormField>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>TextArea와 조합</h3>
          <LivePreview
            title="TextArea 연결"
            description="FormField는 TextField 외에 TextArea, Checkbox 등 어떤 입력 컴포넌트와도 조합할 수 있습니다."
            editable
            code={`<FormField label="자기소개" fullWidth helperText="최대 500자">
  {({ inputId, helperId, hasHelper }) => (
    <TextArea
      id={inputId}
      placeholder="자기소개를 작성해 주세요"
      rows={4}
      fullWidth
      aria-describedby={hasHelper ? helperId : undefined}
    />
  )}
</FormField>`}
          />
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>실전 폼 예시</h3>
          <LivePreview
            title="회원가입 폼"
            description="여러 FormField를 조합한 실제 폼 패턴입니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
  <FormField label="이름" required fullWidth>
    {({ inputId }) => (
      <TextField id={inputId} placeholder="홍길동" fullWidth />
    )}
  </FormField>

  <FormField label="이메일" required fullWidth helperText="업무용 이메일을 입력하세요">
    {({ inputId, helperId, hasHelper }) => (
      <TextField
        id={inputId}
        type="email"
        placeholder="example@company.com"
        fullWidth
        aria-describedby={hasHelper ? helperId : undefined}
      />
    )}
  </FormField>

  <FormField label="비밀번호" required fullWidth helperText="8자 이상, 영문+숫자 조합">
    {({ inputId, helperId, hasHelper }) => (
      <TextField
        id={inputId}
        type="password"
        placeholder="비밀번호"
        fullWidth
        aria-describedby={hasHelper ? helperId : undefined}
      />
    )}
  </FormField>

  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
    <Button variant="light">취소</Button>
    <Button variant="primary">가입하기</Button>
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
            FormField 컴포넌트의 모든 Props와 타입 정보입니다.
          </p>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>FormField</h3>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={formFieldProps} />
          </div>
        </div>

        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>FormFieldRenderProps</h3>
          <p
            className={styles.sectionDescription}
            style={{ marginBottom: '1rem' }}
          >
            children 함수에 전달되는 props 타입입니다.
          </p>
          <div className={styles.propsTableWrapper}>
            <PropsTable props={renderPropsData} />
          </div>
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="FormField"
        intro="FormField는 label-input 연결, 도움말 텍스트 연결, 에러 메시지 연결을 자동으로 처리하여 스크린 리더 사용자가 폼을 올바르게 인식할 수 있도록 지원합니다."
        features={[
          {
            attribute: '<label htmlFor={inputId}>',
            effect: '레이블과 입력 요소가 연결됩니다.',
            description:
              '자동 생성된 id로 label의 htmlFor와 input의 id가 연결되어, 레이블 클릭 시 입력 요소에 포커스됩니다.',
          },
          {
            attribute: 'aria-describedby={helperId}',
            effect: '도움말/에러가 스크린 리더에 전달됩니다.',
            description:
              'helperText 또는 errorMessage가 있을 때, helperId를 input의 aria-describedby에 연결하면 스크린 리더가 해당 텍스트를 읽어줍니다.',
          },
          {
            attribute: 'aria-invalid={isError}',
            effect: '에러 상태를 스크린 리더에 알립니다.',
            description:
              'isError를 input의 aria-invalid에 연결하면, 스크린 리더가 "잘못된 항목"으로 안내합니다.',
          },
          {
            attribute: '필수 입력 표시 (*)',
            effect: '시각적 필수 입력 안내',
            description:
              'required 설정 시 레이블 옆에 빨간색 *가 표시됩니다. input에 required 속성도 함께 설정하는 것을 권장합니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: 'Render Props 올바르게 연결하기',
            description:
              'FormField가 제공하는 id 값들을 input에 빠짐없이 연결해야 접근성이 완성됩니다.',
            examples: [
              {
                code: `// Good — 모든 props 연결
<FormField label="이메일" error errorMessage="오류">
  {({ inputId, helperId, hasHelper, isError }) => (
    <TextField
      id={inputId}
      aria-invalid={isError}
      aria-describedby={hasHelper ? helperId : undefined}
    />
  )}
</FormField>

// Bad — id 미연결
<FormField label="이메일">
  {() => <TextField />}
</FormField>`,
                explanation:
                  'inputId를 연결하지 않으면 label 클릭 시 input에 포커스되지 않습니다.',
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
            FormField를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>모든 폼 입력에 FormField로 레이블을 제공</ListItem>
                <ListItem>inputId를 input의 id에 항상 연결</ListItem>
                <ListItem>
                  hasHelper가 true일 때만 aria-describedby 설정
                </ListItem>
                <ListItem>에러 상태에서 구체적인 errorMessage 제공</ListItem>
                <ListItem>
                  폼에서 fullWidth를 통일하여 일관된 레이아웃 유지
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
                <ListItem>
                  render prop의 인자를 무시하고 id를 연결하지 않기
                </ListItem>
                <ListItem>
                  error만 true로 설정하고 errorMessage를 비워두기
                </ListItem>
                <ListItem>
                  FormField 없이 label 태그를 직접 작성 (일관성 저하)
                </ListItem>
                <ListItem>
                  helperText와 errorMessage를 동시에 보여주려 하기 (error 시
                  errorMessage만 표시)
                </ListItem>
                <ListItem>버튼이나 비입력 요소에 FormField 사용</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
