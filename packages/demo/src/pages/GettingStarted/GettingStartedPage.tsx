import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, SegmentedButtons } from '@taein-ui/core';
import { CodeBlock } from '../../components/CodeBlock';
import * as t from '../../components/DocText';
import * as wall from '../../components/FrameCard/FrameCard.css';
import * as styles from './GettingStartedPage.css';

const cx = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(' ');

const INSTALL = {
  pnpm: 'pnpm add @taein-ui/core',
  npm: 'npm install @taein-ui/core',
  yarn: 'yarn add @taein-ui/core',
};
type Manager = keyof typeof INSTALL;

const MANAGERS = (Object.keys(INSTALL) as Manager[]).map((value) => ({
  value,
  label: value,
}));

const STYLES = "import '@taein-ui/core/styles.css';";

const FIRST = `import { Button } from '@taein-ui/core';

export function App() {
  return <Button>보내기</Button>;
}`;

const FONT = `<link
  rel="stylesheet"
  as="style"
  crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
/>`;

const TYPES = `import { Button, type ButtonProps } from '@taein-ui/core';

function SaveButton(props: ButtonProps) {
  return <Button {...props} />;
}`;

const ISSUES = 'https://github.com/maintaein/TUI_TaeinUI/issues';

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.block}>
      <h2 className={t.h2}>{title}</h2>
      {children}
    </section>
  );
}

export function GettingStartedPage() {
  const [manager, setManager] = useState<Manager>('pnpm');

  return (
    <div className={styles.page}>
      <section className={styles.block}>
        <span className={t.label}>시작하기</span>
        <h1 className={cx(t.display, styles.title)}>설치부터 첫 화면까지</h1>
        <p className={cx(t.lead, t.muted, styles.leadMax)}>
          TUI는 npm 패키지 하나입니다. 설치하고, 스타일 파일을 한 번 불러오고,
          필요한 컴포넌트를 가져다 씁니다. 모션에 쓰는 GSAP은 패키지가 함께
          가져오므로 따로 설치하지 않습니다.
        </p>
      </section>

      <Block title="1. 설치">
        <p className={t.body}>
          쓰는 패키지 매니저를 고릅니다. React 18.2 이상이 먼저 설치되어 있어야
          합니다.
        </p>
        <div className={styles.manager}>
          <SegmentedButtons
            aria-label="패키지 매니저"
            size="sm"
            fullWidth
            options={MANAGERS}
            value={manager}
            onChange={(value) => setManager(value as Manager)}
          />
        </div>
        <CodeBlock
          code={INSTALL[manager]}
          language="bash"
          className={styles.flush}
        />
      </Block>

      <Block title="2. 스타일 불러오기">
        <p className={t.body}>
          앱의 진입 파일에서 한 번만 불러옵니다. 색, 간격, 글꼴 크기가 CSS
          변수로 깔립니다. 빼먹으면 컴포넌트가 스타일 없이 그려집니다.
        </p>
        <CodeBlock code={STYLES} fileName="main.tsx" className={styles.flush} />
      </Block>

      <Block title="3. 첫 컴포넌트">
        <p className={t.body}>필요한 컴포넌트를 이름으로 가져옵니다.</p>
        <CodeBlock code={FIRST} fileName="App.tsx" className={styles.flush} />
        <div className={wall.frame}>
          <div className={cx(wall.frameInner, styles.result)}>
            <Button>보내기</Button>
          </div>
        </div>
      </Block>

      <Block title="4. 글꼴 (권장)">
        <p className={t.body}>
          TUI는 Pretendard를 기본 글꼴로 씁니다. 불러오지 않아도 시스템 글꼴로
          대체되지만, 같은 모습을 보려면 <code>index.html</code>의{' '}
          <code>&lt;head&gt;</code>에 넣어 둡니다.
        </p>
        <CodeBlock
          code={FONT}
          language="html"
          fileName="index.html"
          className={styles.flush}
        />
      </Block>

      <Block title="5. 타입">
        <p className={t.body}>
          모든 컴포넌트에 타입 정의가 들어 있어 별도의 <code>@types</code>{' '}
          패키지가 필요 없습니다. props 타입도 함께 내보내므로 Button의 props는{' '}
          <code>ButtonProps</code>로 가져옵니다.
        </p>
        <CodeBlock
          code={TYPES}
          fileName="SaveButton.tsx"
          className={styles.flush}
        />
      </Block>

      <Block title="다음 단계">
        <p className={t.body}>
          <Link className={styles.link} to="/components/overview">
            전체 컴포넌트
          </Link>
          에서 25개를 훑어보고, 마음에 드는 것의 페이지에서 무대를 만져 보며
          코드를 가져갑니다. 막히는 부분은{' '}
          <a
            className={styles.link}
            href={ISSUES}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Issues
          </a>
          에 남겨 주세요.
        </p>
      </Block>
    </div>
  );
}
