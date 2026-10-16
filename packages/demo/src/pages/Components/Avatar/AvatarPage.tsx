import { Card, List, ListItem } from '@taein-ui/core';
import { LivePreview } from '../../../components/LivePreview';
import { CodeBlock } from '../../../components/CodeBlock';
import { PropsTable } from '../../../components/PropsTable';
import type { PropDefinition } from '../../../components/PropsTable/PropsTable';
import { AccessibilitySection } from '../../../components/AccessibilitySection';
import * as styles from './AvatarPage.css';

export function AvatarPage() {
  const avatarPropsData: PropDefinition[] = [
    {
      name: 'src',
      type: 'string',
      default: 'undefined',
      description: '이미지 URL',
    },
    {
      name: 'alt',
      type: 'string',
      required: true,
      description: '대체 텍스트 (이미지 없을 때 이니셜 생성에도 사용)',
    },
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: '아바타 크기',
    },
    {
      name: 'variant',
      type: "'circular' | 'rounded' | 'square'",
      default: "'circular'",
      description: '모양 변형',
    },
    {
      name: 'status',
      type: "'online' | 'offline' | 'busy' | 'away'",
      default: 'undefined',
      description: '상태 표시 뱃지',
    },
    {
      name: 'children',
      type: 'ReactNode',
      default: 'undefined',
      description: 'fallback 콘텐츠 (이미지 없을 때 이니셜 대신 표시)',
    },
    {
      name: 'onError',
      type: '() => void',
      default: 'undefined',
      description: '이미지 로드 실패 시 콜백',
    },
    {
      name: 'onClick',
      type: '() => void',
      default: 'undefined',
      description: '클릭 핸들러 (설정 시 button으로 렌더링)',
    },
    {
      name: 'href',
      type: 'string',
      default: 'undefined',
      description: '링크 URL (설정 시 a 태그로 렌더링)',
    },
    {
      name: 'target',
      type: 'string',
      default: 'undefined',
      description: '링크 target 속성 (href와 함께 사용)',
    },
    {
      name: 'bouncy',
      type: 'boolean',
      default: 'false',
      description:
        '호버·키보드 포커스에 튀며 떠오르고 누르면 커지는 선택 효과. onClick 또는 href가 있을 때만 동작하고 모션 축소 선호에서는 움직이지 않음',
    },
    {
      name: 'className',
      type: 'string',
      default: 'undefined',
      description: '추가 CSS 클래스',
    },
  ];

  const avatarGroupPropsData: PropDefinition[] = [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: 'Avatar 컴포넌트들',
    },
    {
      name: 'max',
      type: 'number',
      default: 'undefined',
      description: '최대 표시 개수 (초과분은 +N으로 표시)',
    },
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: 'undefined',
      description: '모든 자식 Avatar에 일괄 적용할 크기',
    },
    {
      name: 'spacing',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: '아바타 간 겹침 간격',
    },
    {
      name: 'className',
      type: 'string',
      default: 'undefined',
      description: '추가 CSS 클래스',
    },
  ];

  return (
    <article className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Avatar</h1>
        <p className={styles.description}>
          Avatar 컴포넌트는 사용자나 그룹을 시각적으로 나타낼 때 사용합니다.
          프로필 사진, 댓글 작성자 표시, 참여자 목록 등에 활용할 수 있습니다.
        </p>
      </header>

      {/* Quick Reference */}
      <section className={styles.quickReference}>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Import</h3>
            <CodeBlock
              language="typescript"
              code={`import { Avatar, AvatarGroup } from '@taein-ui/core';`}
            />
          </Card.Body>
        </Card>
        <Card className={styles.quickRefCard}>
          <Card.Body padding="md">
            <h3 className={styles.quickRefTitle}>Basic Usage</h3>
            <CodeBlock
              language="tsx"
              code={`<Avatar src="/photo.jpg" alt="홍길동" />
<Avatar alt="김철수" /> {/* 이니셜 fallback */}`}
            />
          </Card.Body>
        </Card>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <p className={styles.sectionDescription}>
            다양한 사용 사례에 맞는 Avatar 예제입니다.
          </p>
        </div>

        {/* Basic */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Basic Avatar</h3>
          <LivePreview
            title="기본 사용법"
            description="이미지가 있으면 이미지를, 없으면 alt 텍스트에서 이니셜을 자동 생성합니다."
            editable
            code={`<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
  <Avatar src="https://i.pravatar.cc/150?img=1" alt="홍길동" />
  <Avatar alt="김철수" />
  <Avatar alt="이영희 박" />
</div>`}
          />
        </div>

        {/* Sizes */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Sizes</h3>
          <LivePreview
            title="크기"
            description="xs(24px), sm(32px), md(40px), lg(48px), xl(64px) 5가지 크기를 제공합니다."
            editable
            code={`<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
  <Avatar alt="XS" size="xs" />
  <Avatar alt="SM" size="sm" />
  <Avatar alt="MD" size="md" />
  <Avatar alt="LG" size="lg" />
  <Avatar alt="XL" size="xl" />
</div>`}
          />
        </div>

        {/* Variants */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Variants</h3>
          <LivePreview
            title="모양 변형"
            description="circular(원형), rounded(둥근 모서리), square(사각형) 3가지 모양을 제공합니다."
            editable
            code={`<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
  <Avatar src="https://i.pravatar.cc/150?img=2" alt="Circular" variant="circular" size="lg" />
  <Avatar src="https://i.pravatar.cc/150?img=3" alt="Rounded" variant="rounded" size="lg" />
  <Avatar src="https://i.pravatar.cc/150?img=4" alt="Square" variant="square" size="lg" />
</div>`}
          />
        </div>

        {/* Status */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Status Badge</h3>
          <LivePreview
            title="상태 표시"
            description="online, offline, busy, away 4가지 상태를 뱃지로 표시합니다."
            editable
            code={`<div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
  <Avatar src="https://i.pravatar.cc/150?img=5" alt="온라인" size="lg" status="online" />
  <Avatar src="https://i.pravatar.cc/150?img=6" alt="오프라인" size="lg" status="offline" />
  <Avatar src="https://i.pravatar.cc/150?img=7" alt="바쁨" size="lg" status="busy" />
  <Avatar src="https://i.pravatar.cc/150?img=8" alt="자리비움" size="lg" status="away" />
</div>`}
          />
        </div>

        {/* Fallback */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Fallback</h3>
          <LivePreview
            title="Fallback 동작"
            description="이미지가 없거나 로드 실패 시 alt에서 이니셜을 생성합니다. children을 전달하면 이니셜 대신 표시됩니다."
            editable
            code={`<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
  <Avatar alt="홍길동" size="lg" />
  <Avatar alt="김 영수" size="lg" />
  <Avatar alt="단일" size="lg" />
  <Avatar alt="커스텀" size="lg">
    <Palette size={20} />
  </Avatar>
  <Avatar src="https://invalid-url.com/404.jpg" alt="로드 실패" size="lg" />
</div>`}
          />
        </div>

        {/* AvatarGroup */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>AvatarGroup</h3>
          <LivePreview
            title="그룹"
            description="여러 아바타를 겹쳐 표시합니다. max를 설정하면 초과분은 +N으로 표시됩니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <AvatarGroup>
    <Avatar src="https://i.pravatar.cc/150?img=10" alt="사용자1" />
    <Avatar src="https://i.pravatar.cc/150?img=11" alt="사용자2" />
    <Avatar src="https://i.pravatar.cc/150?img=12" alt="사용자3" />
    <Avatar src="https://i.pravatar.cc/150?img=13" alt="사용자4" />
  </AvatarGroup>
  <AvatarGroup max={3}>
    <Avatar src="https://i.pravatar.cc/150?img=14" alt="사용자1" />
    <Avatar src="https://i.pravatar.cc/150?img=15" alt="사용자2" />
    <Avatar src="https://i.pravatar.cc/150?img=16" alt="사용자3" />
    <Avatar src="https://i.pravatar.cc/150?img=17" alt="사용자4" />
    <Avatar src="https://i.pravatar.cc/150?img=18" alt="사용자5" />
  </AvatarGroup>
</div>`}
          />
        </div>

        {/* AvatarGroup Spacing */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>AvatarGroup Spacing</h3>
          <LivePreview
            title="그룹 간격"
            description="sm, md, lg 3가지 겹침 간격을 제공합니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <AvatarGroup spacing="sm">
    <Avatar src="https://i.pravatar.cc/150?img=20" alt="A" />
    <Avatar src="https://i.pravatar.cc/150?img=21" alt="B" />
    <Avatar src="https://i.pravatar.cc/150?img=22" alt="C" />
    <Avatar src="https://i.pravatar.cc/150?img=23" alt="D" />
  </AvatarGroup>
  <AvatarGroup spacing="md">
    <Avatar src="https://i.pravatar.cc/150?img=20" alt="A" />
    <Avatar src="https://i.pravatar.cc/150?img=21" alt="B" />
    <Avatar src="https://i.pravatar.cc/150?img=22" alt="C" />
    <Avatar src="https://i.pravatar.cc/150?img=23" alt="D" />
  </AvatarGroup>
  <AvatarGroup spacing="lg">
    <Avatar src="https://i.pravatar.cc/150?img=20" alt="A" />
    <Avatar src="https://i.pravatar.cc/150?img=21" alt="B" />
    <Avatar src="https://i.pravatar.cc/150?img=22" alt="C" />
    <Avatar src="https://i.pravatar.cc/150?img=23" alt="D" />
  </AvatarGroup>
</div>`}
          />
        </div>

        {/* AvatarGroup Size */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>AvatarGroup Size</h3>
          <LivePreview
            title="그룹 크기 일괄 적용"
            description="AvatarGroup의 size prop으로 모든 자식 Avatar의 크기를 일괄 지정할 수 있습니다."
            editable
            code={`<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <AvatarGroup size="sm" max={3}>
    <Avatar src="https://i.pravatar.cc/150?img=30" alt="A" />
    <Avatar src="https://i.pravatar.cc/150?img=31" alt="B" />
    <Avatar src="https://i.pravatar.cc/150?img=32" alt="C" />
    <Avatar src="https://i.pravatar.cc/150?img=33" alt="D" />
  </AvatarGroup>
  <AvatarGroup size="lg" max={3}>
    <Avatar src="https://i.pravatar.cc/150?img=30" alt="A" />
    <Avatar src="https://i.pravatar.cc/150?img=31" alt="B" />
    <Avatar src="https://i.pravatar.cc/150?img=32" alt="C" />
    <Avatar src="https://i.pravatar.cc/150?img=33" alt="D" />
  </AvatarGroup>
</div>`}
          />
        </div>

        {/* Clickable Avatar: onClick */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Clickable Avatar: onClick</h3>
          <LivePreview
            title="클릭 이벤트"
            description="onClick을 전달하면 button으로 렌더링됩니다. Popover와 조합하면 프로필 메뉴 팝업을 구현할 수 있습니다."
            editable
            code={`const [open, setOpen] = useState(false);
const profileMenu = (
  <div style={{ minWidth: '260px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1rem 0.75rem' }}>
      <Avatar src="https://i.pravatar.cc/150?img=40" alt="홍길동" size="xl" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        <p style={{ margin: 0, fontWeight: 600 }}>홍길동</p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: themeContract.color.text.secondary }}>hong@example.com</p>
      </div>
    </div>
    <Divider spacing="sm" />
    <List spacing="sm" style={{ padding: '0.25rem 0.5rem' }}>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>내 프로필</ListItem>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>설정</ListItem>
    </List>
    <Divider spacing="sm" />
    <List spacing="sm" style={{ padding: '0.25rem 0.5rem 0.5rem' }}>
      <ListItem style={{ padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: themeContract.color.error.dark }}>로그아웃</p>
      </ListItem>
    </List>
  </div>
);

<Popover open={open} onOpenChange={setOpen} position="bottom" content={profileMenu}>
  <Avatar src="https://i.pravatar.cc/150?img=40" alt="프로필 메뉴" size="lg" />
</Popover>`}
          />
        </div>

        {/* Bouncy */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Bouncy</h3>
          <LivePreview
            title="튀는 호버·누름 효과"
            description="기본은 정적이고 bouncy를 켜야 움직입니다. 클릭 가능한 아바타(onClick 또는 href)에서만 동작합니다. 호버·키보드 포커스에 튀며 떠오르고, 누르면 떠오른 채 커집니다."
            editable
            code={`const [open, setOpen] = useState(false);

<div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
  <Avatar src="https://i.pravatar.cc/150?img=11" alt="작게" size="sm" bouncy onClick={() => {}} />
  <Avatar src="https://i.pravatar.cc/150?img=12" alt="보통" size="md" bouncy onClick={() => {}} />
  <Avatar src="https://i.pravatar.cc/150?img=13" alt="크게" size="xl" status="online" bouncy onClick={() => {}} />
  <Popover
    open={open}
    onOpenChange={setOpen}
    position="bottom"
    content={<div style={{ padding: '1rem' }}>프로필 메뉴</div>}
  >
    <Avatar src="https://i.pravatar.cc/150?img=14" alt="프로필 메뉴" size="lg" bouncy />
  </Popover>
</div>`}
          />
        </div>

        {/* Clickable Avatar: href */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Clickable Avatar: href</h3>
          <LivePreview
            title="링크 라우팅"
            description="href를 전달하면 a 태그로 렌더링되어 페이지 라우팅이 가능합니다. target='_blank'로 새 탭에서 열 수도 있습니다."
            editable
            code={`<div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
  <Avatar
    src="https://i.pravatar.cc/150?img=41"
    alt="내 프로필"
    size="lg"
    href="/components/avatar"
  />
  <Avatar
    src="https://i.pravatar.cc/150?img=42"
    alt="외부 링크"
    size="lg"
    href="https://github.com"
    target="_blank"
  />
</div>`}
          />
        </div>
      </section>

      {/* Props API: Avatar */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API: Avatar</h2>
          <p className={styles.sectionDescription}>
            Avatar 컴포넌트의 Props입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={avatarPropsData} />
        </div>
      </section>

      {/* Props API: AvatarGroup */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Props API: AvatarGroup</h2>
          <p className={styles.sectionDescription}>
            AvatarGroup 컴포넌트의 Props입니다.
          </p>
        </div>
        <div className={styles.propsTableWrapper}>
          <PropsTable props={avatarGroupPropsData} />
        </div>
      </section>

      {/* Accessibility */}
      <AccessibilitySection
        componentName="Avatar"
        intro="Avatar 컴포넌트는 다음과 같이 기본적인 접근성을 제공합니다."
        features={[
          {
            attribute: 'alt',
            effect: '이미지의 대체 텍스트를 스크린 리더에 전달합니다.',
            description:
              'img 태그에 alt 속성이 설정되어 이미지 내용을 설명합니다.',
          },
          {
            attribute: 'role="img"',
            effect: 'fallback 상태에서 이미지 역할을 알립니다.',
            description:
              '이미지가 없을 때 이니셜 영역에 role="img"을 설정하여 스크린 리더가 이미지로 인식합니다.',
          },
          {
            attribute: 'aria-label',
            effect: 'fallback 상태에서 접근 가능한 이름을 제공합니다.',
            description:
              '이니셜만 표시될 때 aria-label로 전체 이름을 전달합니다.',
          },
          {
            attribute: 'aria-hidden',
            effect: '상태 뱃지를 스크린 리더에서 숨깁니다.',
            description:
              '상태 뱃지는 장식적 요소이므로 aria-hidden="true"로 설정되어 있습니다.',
          },
          {
            attribute: 'button / a 태그',
            effect:
              'onClick 또는 href가 있으면 적절한 인터랙티브 요소로 렌더링됩니다.',
            description:
              'onClick → button, href → a 태그로 자동 전환되며, aria-label이 alt 값으로 설정됩니다.',
          },
        ]}
        additionalGuidance={[
          {
            title: '의미 있는 alt 텍스트 제공하기',
            description:
              'alt에 사용자의 실제 이름을 넣어 스크린 리더가 누구인지 전달할 수 있도록 합니다.',
            examples: [
              {
                code: `// Good
<Avatar src="/photo.jpg" alt="홍길동" />

// Bad
<Avatar src="/photo.jpg" alt="사진" />
<Avatar src="/photo.jpg" alt="avatar" />`,
                explanation: 'alt는 이미지의 내용(누구인지)을 설명해야 합니다.',
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
            Avatar를 효과적으로 사용하기 위한 권장사항입니다.
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
                <ListItem>alt에 사용자의 실제 이름 사용</ListItem>
                <ListItem>적절한 size를 맥락에 맞게 선택</ListItem>
                <ListItem>
                  AvatarGroup으로 여러 사용자 표시 시 max 활용
                </ListItem>
                <ListItem>이미지 로드 실패 대비 fallback 확인</ListItem>
                <ListItem>상태 뱃지는 실시간 상태 반영에만 사용</ListItem>
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
                  alt를 비워두거나 "사진", "이미지" 같은 일반적 텍스트 사용하지
                  않기
                </ListItem>
                <ListItem>너무 많은 아바타를 max 없이 나열하지 않기</ListItem>
                <ListItem>
                  장식용 아바타에 불필요한 status 사용하지 않기
                </ListItem>
                <ListItem>매우 큰 이미지를 src에 직접 전달하지 않기</ListItem>
              </List>
            </Card.Body>
          </Card>
        </div>
      </section>
    </article>
  );
}
