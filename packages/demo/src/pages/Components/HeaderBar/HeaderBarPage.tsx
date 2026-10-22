import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Gift, House, LayoutGrid, Palette } from 'lucide-react';
import { Button, HeaderBar } from '@taein-ui/core';
import { CodeBlock } from '../../../components/CodeBlock';
import {
  Customize,
  codeOf,
  type Control,
  type Values,
} from '../../../components/Customize';
import { DetailLayout, Topic, Topics } from '../../../components/DetailLayout';
import * as t from '../../../components/DocText';
import type { PropDefinition } from '../../../components/PropsTable';
import { Stage, type Act } from '../../../components/Stage';

const LEAD =
  '페이지 맨 위에 떠 있는 둥근 바입니다. 로고, 제목, 항목, 액션을 한 줄에 놓고 항목이 보이는 모습을 다섯 가지 중에서 고릅니다.';

const CONTROLS: Control[] = [
  {
    prop: 'navStyle',
    kind: 'choice',
    options: ['pill', 'text', 'icon', 'dropdown', 'cards'],
  },
  { prop: 'logo', kind: 'toggle' },
  { prop: 'actions', kind: 'toggle' },
];

const INITIAL: Values = { navStyle: 'pill', logo: true, actions: false };

const DEFAULTS: Values = { navStyle: 'pill' };

// 알약의 활성 항목이 옮겨 가는 모습이 이 컴포넌트의 주인공이라 항목을 눌러 활성을 바꾼다
const LABELS = ['상품', '카테고리', '이벤트'];
const LINK_LABELS = ['상품', '고객지원', '이벤트'];

// 데모는 이동 없이 활성만 바꾸려고 href 대신 onClick을 쓴다. 코드에는 가장 흔한 href 모양을 적는다
const CODE_ITEMS: Record<string, string> = {
  pill: `[
    { label: '상품', href: '/products', active: true },
    { label: '카테고리', href: '/categories' },
    { label: '이벤트', href: '/events' },
  ]`,
  icon: `[
    { icon: <House size={20} />, label: '홈', href: '/', active: true },
    { icon: <LayoutGrid size={20} />, label: '카테고리', href: '/categories' },
    { icon: <Gift size={20} />, label: '이벤트', href: '/events' },
  ]`,
  dropdown: `[
    {
      label: '상품',
      links: [
        { label: '전체 상품', href: '/products' },
        { label: '신상품', href: '/new' },
      ],
    },
    {
      label: '고객지원',
      links: [
        { label: '문의하기', href: '/contact' },
      ],
    },
    { label: '이벤트', href: '/events' },
  ]`,
  cards: `[
    {
      label: '상품',
      links: [
        { label: '전체 상품', href: '/products' },
        { label: '신상품', href: '/new' },
      ],
    },
    {
      label: '고객지원',
      links: [
        { label: '문의하기', href: '/contact' },
      ],
    },
    { label: '이벤트', href: '/events' },
  ]`,
};
CODE_ITEMS.text = CODE_ITEMS.pill;

const ICON_IMPORTS = [
  { name: 'House', from: 'lucide-react' },
  { name: 'LayoutGrid', from: 'lucide-react' },
  { name: 'Gift', from: 'lucide-react' },
];

// 항목 하나를 가리킨다. 알약과 글자는 호버로 바탕이 차오르고 누르면 활성이 옮겨 간다
const WALK = (act: Act) => {
  for (const i of [1, 2, 0]) {
    const item = `item:${i}`;
    act.move(item);
    act.hover(item);
    act.wait(0.8);
    act.press(item);
    act.leave(item);
    act.wait(0.6);
  }
  act.home();
  act.wait(0.4);
};

// 하위 링크가 있는 항목에 올라가면 아래로 판이 열리고, 떠나면 닫힌다
const DROP = (act: Act) => {
  for (const i of [0, 1]) {
    const item = `item:${i}`;
    act.move(item);
    act.hover(item);
    act.wait(1.6);
    act.leave(item);
    act.wait(0.5);
  }
  act.home();
  act.wait(0.4);
};

// 햄버거를 눌러 메뉴를 펼치고 다시 눌러 접는다. cards는 모든 폭에서, 나머지는 768px 미만에서 이렇게 열린다
// shortcut: 햄버거는 누를 때마다 뒤집히는 내부 상태라, 넘겨받은 뒤 이어 가면 열림과 닫힘 순서가 한 바퀴 뒤바뀔 수 있다(바를 새로 세워 닫힌 채 이어 간다), 바에 열림 prop이 생기면 Act.call로 맞춘다
const BURGER = (act: Act) => {
  act.move('menu');
  act.hover('menu');
  act.wait(0.3);
  act.press('menu');
  act.leave('menu');
  act.wait(2);
  act.move('menu');
  act.press('menu');
  act.wait(1);
  act.home();
  act.wait(0.4);
};

const SCRIPTS: Record<string, (act: Act) => void> = {
  pill: WALK,
  text: WALK,
  icon: WALK,
  dropdown: DROP,
  cards: BURGER,
};

// core가 항목을 햄버거 뒤로 접는 경계(768px 미만)와 같다
const NARROW = '(max-width: 767.98px)';
const subscribeNarrow = (notify: () => void) => {
  const query = window.matchMedia(NARROW);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
const isNarrow = () => window.matchMedia(NARROW).matches;

const PROPS: PropDefinition[] = [
  {
    name: 'logo',
    type: 'ReactNode',
    description: '왼쪽에 놓을 로고',
  },
  {
    name: 'title',
    type: 'ReactNode',
    description: '로고 옆에 놓을 제목',
  },
  {
    name: 'titleAs',
    type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span'",
    default: "'h1'",
    description:
      '제목 요소. 모양은 같다. 페이지에 이미 h1이 있으면 낮은 단계나 span을 고른다',
  },
  {
    name: 'items',
    type: 'HeaderBarItem[]',
    description:
      '가운데 항목. 항목은 label, href, onClick, icon, active, links를 가진다. href가 있으면 a, 없으면 button이다. active는 지금 보는 페이지다. icon은 navStyle이 icon일 때 모든 항목에 필요하다. links는 dropdown과 cards에서만 쓰이고 다른 형태에서는 무시된다',
  },
  {
    name: 'navStyle',
    type: "'pill' | 'text' | 'icon' | 'dropdown' | 'cards'",
    default: "'pill'",
    description:
      '항목이 보이는 모습. 알약, 글자, 아이콘 알약, 드롭다운, 카드 펼침이다',
  },
  {
    name: 'actions',
    type: 'ReactNode',
    description: '오른쪽에 놓을 버튼이나 아이콘',
  },
  {
    name: 'sticky',
    type: 'boolean',
    default: 'false',
    description: '스크롤해도 가장 가까운 스크롤 상자의 위에 붙어 따라온다',
  },
  {
    name: 'aria-label',
    type: 'string',
    description: '스크린 리더가 읽는 헤더 이름',
  },
];

const ITEMS_CODE = `<HeaderBar
  title="Store"
  items={[
    { label: '상품', href: '/products', active: true },
    { label: '카테고리', href: '/categories' },
  ]}
  actions={<Button size="sm">로그인</Button>}
/>`;

const STICKY_CODE = `<div style={{ height: 280, overflow: 'auto' }}>
  <HeaderBar sticky title="Store" items={items} />
  {/* 긴 내용 */}
</div>`;

function Usage() {
  return (
    <Topics>
      <Topic title="항목과 액션">
        <p className={t.body} style={{ marginBottom: 12 }}>
          가운데 항목은 <code>items</code>로, 오른쪽 버튼은 <code>actions</code>
          로 넘깁니다. 안쪽에 자식을 두는 자리는 없습니다. 항목에{' '}
          <code>href</code>를 주면 링크, 주지 않으면 버튼이고 지금 보는 페이지
          항목에는 <code>active</code>를 줍니다. 항목을 <code>items</code>로
          넘겨야 nav 요소와 이름, 현재 페이지 표시, 좁은 화면 메뉴가 함께
          따라옵니다.
        </p>
        <CodeBlock code={ITEMS_CODE} />
      </Topic>
      <Topic title="항목의 모습">
        <p className={t.body}>
          <code>pill</code>은 마우스를 올리거나 키보드로 포커스하면 아래에서
          원이 차오르고 글자가 같은 글자로 바뀝니다. 들어올 때 0.3초, 나갈 때
          0.2초이고 도중에 바뀌어도 지금 자리에서 이어받습니다. 활성 항목은 늘
          채워져 있어서, 활성이 다른 항목으로 넘어가면 새 항목은 차오르고 옛
          항목은 비워집니다. 터치에서는 움직이지 않습니다. <code>text</code>는
          호버와 활성에 옅은 바탕이 깔리는 글자 링크, <code>icon</code>은 커서를
          올린 아이콘만 커지는 아이콘 알약이고 모든 항목에 <code>icon</code>이
          필요합니다. 이때 <code>label</code>은 접근 이름입니다.
        </p>
      </Topic>
      <Topic title="하위 링크가 있는 형태">
        <p className={t.body}>
          <code>dropdown</code>과 <code>cards</code>는 항목의 <code>links</code>
          를 씁니다. dropdown은 <code>links</code>가 있는 항목에 마우스를 올리면
          아래에 작은 판이 열리고, 마우스로 누르면 열기만 합니다. 터치, 펜,
          키보드는 누를 때마다 열고 닫습니다. 한 번에 하나만 열리며 Esc, 판 밖
          누름, 링크 누름, 포커스 이탈로 닫힙니다. <code>cards</code>는 햄버거를
          누르면 바 뒤의 면이 아래로 자라고 항목마다 카드가 80ms 시차로
          솟습니다. 항목은 바 안이 아니라 카드에만 있고 <code>links</code>가
          없는 항목은 카드 제목이 곧 링크입니다. 카드는 셋 이하를 권합니다.
        </p>
      </Topic>
      <Topic title="좁은 화면">
        <p className={t.body}>
          화면이 768px보다 좁으면 <code>cards</code>를 뺀 모든 형태에서 항목이
          숨고 햄버거가 나타납니다. 누르면 바 아래에 세로 목록 판이 내용을 밀지
          않고 겹쳐 열리며 Esc, 판 밖 누름, 항목 누름으로 닫힙니다.{' '}
          <code>dropdown</code>의 하위 링크는 접지 않고 들여 써서 펼쳐 보입니다.
          위 무대를 375px 폭으로 보면 이 모습입니다.
        </p>
      </Topic>
      <Topic title="스크롤에 붙이기와 제목 단계">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>sticky</code>를 켜면 바가 가장 가까운 스크롤 상자의 위에
          붙습니다. 위 여백 16px은 그대로 남습니다. 스크롤 상자가 없으면 붙을
          곳이 없으니 상자를 두고 그 안에 둡니다.
        </p>
        <CodeBlock code={STICKY_CODE} />
        <p className={t.body} style={{ margin: '16px 0 0' }}>
          <code>title</code>은 기본으로 <code>h1</code>입니다. 이 페이지처럼
          제목이 이미 있으면 <code>titleAs</code>로 낮은 단계나{' '}
          <code>span</code>을 고릅니다. 위 무대의 바도 <code>span</code>입니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>header</code> 요소라 문서 최상위에 두면 스크린 리더가 배너로
        읽습니다. <code>section</code>, <code>article</code>, <code>aside</code>
        , <code>nav</code>, <code>main</code> 안에 두면 배너가 아닙니다.
      </li>
      <li>
        <code>items</code>는 이름이 &quot;주요 메뉴&quot;인 <code>nav</code>로
        그려지고, 활성 항목에는 <code>aria-current=&quot;page&quot;</code>가
        붙습니다. 활성의 보이는 표시는 바탕과 글자 모양이고 스크린 리더에는{' '}
        <code>aria-current</code>가 알립니다.
      </li>
      <li>
        햄버거는 <code>aria-expanded</code>와 <code>aria-controls</code>를 갖고
        이름이 열림에 따라 &quot;메뉴 열기&quot;와 &quot;메뉴 닫기&quot;로
        바뀝니다. Esc로 닫으면 포커스가 햄버거로 돌아옵니다.
      </li>
      <li>
        dropdown 항목의 버튼은 <code>aria-expanded</code>와{' '}
        <code>aria-controls</code>로 하위 링크 판을 가리킵니다. 닫힌 판은{' '}
        <code>visibility: hidden</code>이라 Tab 순서와 접근성 트리에서 빠지고,
        Esc로 닫으면 포커스가 그 버튼으로 돌아옵니다. 마우스를 올려 여는
        판이지만 키보드와 스크린 리더는 버튼을 눌러 엽니다.
      </li>
      <li>
        cards에서 <code>links</code>가 있는 카드는 제목을 이름으로 갖는{' '}
        <code>group</code>입니다. <code>links</code>가 없는 카드는 이름이 링크
        자신이라 그룹이 아닙니다. 닫힌 카드 층도 Tab 순서에서 빠집니다.
      </li>
      <li>
        pill의 호버 채움은 키보드 포커스로도 일어납니다. 클릭으로 생긴 포커스는
        채움을 남기지 않습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 한 페이지에 헤더바는 하나만 둡니다. 배너가
        여럿이면 스크린 리더 사용자가 헷갈립니다. 페이지에 이미 <code>h1</code>
        이 있으면 <code>titleAs</code>를 바꿉니다. 헤더 목적을 밝히려면{' '}
        <code>aria-label</code>을 줍니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. icon 형태는 아이콘만 보이므로 모든 항목의{' '}
        <code>label</code>이 접근 이름이 됩니다. 의미가 드러나게 씁니다.
      </li>
    </ul>
  );
}

type NavStyle = NonNullable<ComponentProps<typeof HeaderBar>['navStyle']>;

const ICONS: Record<string, ReactNode> = {
  상품: <House size={20} />,
  카테고리: <LayoutGrid size={20} />,
  이벤트: <Gift size={20} />,
};

const LINKS = [
  [{ label: '전체 상품' }, { label: '신상품' }],
  [{ label: '문의하기' }],
];

export function HeaderBarPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [active, setActive] = useState(LABELS[0]);
  // 시연이 멈출 때 바를 새로 세운다. 대본이 펼쳐 둔 메뉴나 호버로 채운 알약이 남지 않게 한다
  const [run, setRun] = useState(0);
  const narrow = useSyncExternalStore(subscribeNarrow, isNarrow);
  const box = useRef<HTMLDivElement>(null);
  const navStyle = String(values.navStyle) as NavStyle;

  // core 항목은 data-* 를 받지 않는다. 그려진 요소에 이름표를 달아 대본이 찾게 한다
  useEffect(() => {
    const bar = box.current;
    bar
      ?.querySelector('nav[aria-label="주요 메뉴"]')
      ?.querySelectorAll(':scope > *')
      .forEach((el, i) => {
        // dropdown의 하위 링크가 있는 항목은 슬롯 안의 버튼이 호버를 받는다
        const target = el.matches('a, button')
          ? el
          : el.querySelector('button');
        target?.setAttribute('data-stage-target', `item:${i}`);
      });
    bar
      ?.querySelector('button[aria-label^="메뉴"]')
      ?.setAttribute('data-stage-target', 'menu');
  });

  const common = {
    title: 'Store',
    titleAs: 'span' as const,
    logo: values.logo === true ? <Palette size={24} /> : undefined,
    actions:
      values.actions === true ? <Button size="sm">시작하기</Button> : undefined,
  };

  const bar =
    navStyle === 'icon' ? (
      <HeaderBar
        key={run}
        {...common}
        navStyle="icon"
        items={LABELS.map((label) => ({
          icon: ICONS[label],
          label,
          active: label === active,
          onClick: () => setActive(label),
        }))}
      />
    ) : navStyle === 'dropdown' || navStyle === 'cards' ? (
      <HeaderBar
        key={run}
        {...common}
        navStyle={navStyle}
        items={LINK_LABELS.map((label, i) => ({ label, links: LINKS[i] }))}
      />
    ) : (
      <HeaderBar
        key={run}
        {...common}
        navStyle={navStyle}
        items={LABELS.map((label) => ({
          label,
          active: label === active,
          onClick: () => setActive(label),
        }))}
      />
    );

  return (
    <DetailLayout
      name="HeaderBar"
      lead={LEAD}
      stage={
        <Stage
          label="HeaderBar 시연"
          script={narrow ? BURGER : SCRIPTS[navStyle]}
          onPause={() => setRun((n) => n + 1)}
          bar
        >
          <div ref={box} style={{ width: '100%' }}>
            {bar}
          </div>
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'HeaderBar',
        values: {
          navStyle: values.navStyle,
          logo: values.logo,
          title: 'Store',
          items: true,
          actions: values.actions,
        },
        defaults: DEFAULTS,
        notation: {
          logo: {
            expr: '<Palette size={24} />',
            import: { name: 'Palette', from: 'lucide-react' },
          },
          items: { expr: CODE_ITEMS[navStyle] },
          actions: {
            expr: '<Button size="sm">시작하기</Button>',
            import: { name: 'Button', from: '@taein-ui/core' },
          },
        },
        imports: navStyle === 'icon' ? ICON_IMPORTS : [],
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
