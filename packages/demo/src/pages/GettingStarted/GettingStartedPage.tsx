import { useNavigate } from 'react-router-dom';
import { Button, Card, Text } from '@taein-ui/core';
import { LayoutGrid, Sparkles, Eye } from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';
import * as styles from './GettingStartedPage.css';

export function GettingStartedPage() {
  const navigate = useNavigate();
  return (
    <div className={styles.container}>
      <Text variant="h1" className={styles.title}>
        시작하기
      </Text>
      <p className={styles.description}>
        TUI를 프로젝트에 설치하고 사용하는 방법을 알아보세요.
      </p>

      {/* Installation Section */}
      <section className={styles.section}>
        <Text variant="h2" className={styles.sectionTitle}>
          1. 설치
        </Text>
        <p className={styles.sectionDescription}>
          원하는 패키지 매니저를 사용하여 TUI를 설치하세요.
        </p>

        <div className={styles.installTabs}>
          <div className={styles.installOption}>
            <h3 className={styles.installTitle}>npm</h3>
            <CodeBlock
              code="npm install @taein-ui/core"
              language="bash"
              showLineNumbers={false}
            />
          </div>

          <div className={styles.installOption}>
            <h3 className={styles.installTitle}>pnpm</h3>
            <CodeBlock
              code="pnpm add @taein-ui/core"
              language="bash"
              showLineNumbers={false}
            />
          </div>

          <div className={styles.installOption}>
            <h3 className={styles.installTitle}>yarn</h3>
            <CodeBlock
              code="yarn add @taein-ui/core"
              language="bash"
              showLineNumbers={false}
            />
          </div>
        </div>
      </section>

      {/* Basic Usage Section */}
      <section className={styles.section}>
        <Text variant="h2" className={styles.sectionTitle}>
          2. 기본 사용법
        </Text>
        <p className={styles.sectionDescription}>
          TUI 컴포넌트를 사용하려면 먼저 CSS를 import하고 컴포넌트를 가져옵니다.
        </p>

        <div className={styles.codeExample}>
          <h3 className={styles.exampleTitle}>CSS Import</h3>
          <p className={styles.exampleDescription}>
            애플리케이션의 진입점(main.tsx 또는 App.tsx)에서 CSS를 import합니다.
          </p>
          <CodeBlock
            code={`// main.tsx 또는 App.tsx
import '@taein-ui/core/styles.css';`}
            language="tsx"
            fileName="main.tsx"
          />
        </div>

        <div className={styles.codeExample}>
          <h3 className={styles.exampleTitle}>폰트 설정 (권장)</h3>
          <p className={styles.exampleDescription}>
            TUI는 기본 폰트로 Pretendard를 사용합니다. 폰트가 로드되지 않은
            환경에서는 시스템 폰트로 자동 대체되지만, 최적의 경험을 위해
            Pretendard를 로드하는 것을 권장합니다.
          </p>
          <CodeBlock
            code={`<!-- index.html의 <head>에 추가 -->
<link
  rel="stylesheet"
  as="style"
  crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
/>`}
            language="html"
            fileName="index.html"
          />
        </div>

        <div className={styles.codeExample}>
          <h3 className={styles.exampleTitle}>컴포넌트 Import</h3>
          <p className={styles.exampleDescription}>
            필요한 컴포넌트를 import하여 사용합니다.
          </p>
          <CodeBlock
            code={`import { Button, TextField, Modal } from '@taein-ui/core';

function App() {
  return (
    <div>
      <Button variant="primary">클릭하세요</Button>
      <TextField label="이름" placeholder="이름을 입력하세요" />
    </div>
  );
}`}
            language="tsx"
            fileName="App.tsx"
          />
        </div>
      </section>

      {/* TypeScript Section */}
      <section className={styles.section}>
        <Text variant="h2" className={styles.sectionTitle}>
          3. TypeScript 설정
        </Text>
        <p className={styles.sectionDescription}>
          TUI는 TypeScript로 작성되었으며 모든 컴포넌트에 타입 정의가 포함되어
          있습니다. 별도의 @types 패키지가 필요하지 않습니다.
        </p>

        <div className={styles.codeExample}>
          <h3 className={styles.exampleTitle}>타입 안전성</h3>
          <p className={styles.exampleDescription}>
            TypeScript는 자동으로 props를 검증하고 자동완성을 제공합니다.
          </p>
          <CodeBlock
            code={`import { Button, type ButtonProps } from '@taein-ui/core';

// Props 타입을 명시적으로 사용할 수 있습니다
const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};

// 컴포넌트는 자동으로 타입을 추론합니다
function Example() {
  return (
    <Button
      variant="primary"  // 자동완성: 'primary' | 'dark' | 'danger' | 'light'
      size="md"          // 자동완성: 'sm' | 'md' | 'lg' | 'xl'
      onClick={() => {}}
    >
      클릭
    </Button>
  );
}`}
            language="tsx"
            fileName="Example.tsx"
          />
        </div>

        <div className={styles.infoBox}>
          <h4 className={styles.infoTitle}>💡 Tip</h4>
          <p className={styles.infoText}>
            VS Code를 사용하는 경우, Ctrl+Space(또는 Cmd+Space)를 눌러 사용
            가능한 props와 값을 확인할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Next Steps Section */}
      <section className={styles.section}>
        <Text variant="h2" className={styles.sectionTitle}>
          4. 다음 단계
        </Text>
        <p className={styles.sectionDescription}>
          TUI를 설치했다면 이제 컴포넌트를 탐색하고 프로젝트에 적용해보세요.
        </p>

        <div className={styles.nextStepsGrid}>
          <Card
            variant="interactive"
            accentColor="#8b5cf6"
            onClick={() => navigate('/components')}
            className={styles.nextStepCard}
          >
            <Card.Body padding="lg">
              <div className={styles.nextStepIcon} aria-hidden="true">
                <LayoutGrid size={32} />
              </div>
              <h3 className={styles.nextStepTitle}>컴포넌트</h3>
              <p className={styles.nextStepDescription}>
                컴포넌트 패밀리 30개(top-level export 49개)와 사용 예시를
                확인하세요.
              </p>
              <div className={styles.nextStepArrow}>&rarr;</div>
            </Card.Body>
          </Card>
          <Card
            variant="interactive"
            accentColor="#2563eb"
            onClick={() => navigate('/components/bottom-sheet')}
            className={styles.nextStepCard}
          >
            <Card.Body padding="lg">
              <div className={styles.nextStepIcon} aria-hidden="true">
                <Sparkles size={32} />
              </div>
              <h3 className={styles.nextStepTitle}>모션 만져보기</h3>
              <p className={styles.nextStepDescription}>
                BottomSheet를 드래그해 보세요. GSAP이 손가락을 1:1로 따라오는
                컴포넌트입니다.
              </p>
              <div className={styles.nextStepArrow}>&rarr;</div>
            </Card.Body>
          </Card>
          <Card
            variant="interactive"
            accentColor="#16a34a"
            onClick={() => navigate('/')}
            className={styles.nextStepCard}
          >
            <Card.Body padding="lg">
              <div className={styles.nextStepIcon} aria-hidden="true">
                <Eye size={32} />
              </div>
              <h3 className={styles.nextStepTitle}>TUI가 무엇인지</h3>
              <p className={styles.nextStepDescription}>
                왜 컴포넌트마다 모션을 다르게 가져가는지, 그러고도 무엇을 안
                깎는지 읽어보세요.
              </p>
              <div className={styles.nextStepArrow}>&rarr;</div>
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* Help Section */}
      <section className={styles.section}>
        <div className={styles.helpBox}>
          <h3 className={styles.helpTitle}>도움이 필요하신가요?</h3>
          <p className={styles.helpText}>
            문제가 발생하거나 질문이 있으시면 GitHub Issues에 문의해주세요.
          </p>
          <div className={styles.helpActions}>
            <a
              href="https://github.com/maintaein/TUI_TaeinUI/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="primary">GitHub Issues</Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
