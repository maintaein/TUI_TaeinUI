import { useState, type ComponentProps } from 'react';
import { Avatar } from '@taein-ui/core';
import { CodeBlock } from '../../../components/CodeBlock';
import {
  Customize,
  codeOf,
  type Control,
  type Values,
} from '../../../components/Customize';
import { DetailLayout, Topic, Topics } from '../../../components/DetailLayout';
import * as t from '../../../components/DocText';
import { PropsList } from '../../../components/PropsList';
import type { PropDefinition } from '../../../components/PropsTable';
import { Stage, type Act, type DemoProps } from '../../../components/Stage';

const LEAD =
  '프로필 사진이나 이니셜로 사용자와 그룹을 나타냅니다. 댓글 작성자, 참여자 목록에 둡니다.';

const CONTROLS: Control[] = [
  { prop: 'alt', kind: 'text' },
  { prop: 'size', kind: 'choice', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
  {
    prop: 'variant',
    kind: 'choice',
    options: ['circular', 'rounded', 'square'],
  },
  {
    prop: 'status',
    kind: 'choice',
    options: ['none', 'online', 'offline', 'busy', 'away'],
  },
  { prop: 'bouncy', kind: 'toggle' },
];

const INITIAL: Values = {
  alt: 'Taein Kim',
  size: 'xl',
  variant: 'circular',
  status: 'online',
  bouncy: true,
};

const DEFAULTS: Values = {
  alt: '',
  size: 'md',
  variant: 'circular',
  status: 'none',
};

// 무대의 Avatar는 늘 누를 수 있다(onClick). bouncy는 누를 수 있는 아바타에서만 움직이기 때문이다
const NOTATION = { onClick: { expr: 'openProfile' } };

// 커서가 아바타로 가서 올라타면 떠오르고(튀며 15%), 누르면 떠오른 채 커졌다 돌아오고, 떠나면 내려앉는다
// bouncy를 끄면 밝기만 어두워지고 누르는 동안 0.95배로 눌린다
const SCRIPT = (act: Act) => {
  act.move('avatar');
  act.hover('avatar');
  act.wait(0.9);
  act.press('avatar');
  act.wait(0.5);
  act.leave('avatar');
  act.wait(0.6);
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'alt',
    type: 'string',
    required: true,
    description:
      '누구인지 알리는 이름. 이미지의 대체 텍스트가 되고 이미지가 없으면 이니셜이 여기서 나온다',
  },
  {
    name: 'src',
    type: 'string',
    description: '이미지 주소. 없거나 불러오지 못하면 이니셜을 보인다',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
    default: "'md'",
    description: '크기. 24, 32, 40, 48, 64px',
  },
  {
    name: 'variant',
    type: "'circular' | 'rounded' | 'square'",
    default: "'circular'",
    description: '모양. 원형, 둥근 모서리, 사각형',
  },
  {
    name: 'status',
    type: "'online' | 'offline' | 'busy' | 'away'",
    description: '오른쪽 아래에 상태 점을 붙인다. 스크린 리더는 읽지 않는다',
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: '이미지가 없을 때 이니셜 대신 보일 내용',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: '주면 button으로 그려진다',
  },
  {
    name: 'href',
    type: 'string',
    description: '주면 a로 그려진다',
  },
  {
    name: 'target',
    type: 'string',
    description:
      'href와 함께 쓰는 링크 대상. _blank이면 rel="noopener noreferrer"가 붙는다',
  },
  {
    name: 'bouncy',
    type: 'boolean',
    default: 'false',
    description:
      '마우스를 올리면 튀며 떠오르고 누르면 커진다. onClick이나 href가 있을 때만 움직인다',
  },
  {
    name: 'onError',
    type: '() => void',
    description: '이미지를 불러오지 못했을 때 부른다',
  },
];

const GROUP_PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: '겹쳐 보일 Avatar들',
  },
  {
    name: 'max',
    type: 'number',
    description: '보이는 최대 개수. 넘는 만큼은 +N 하나로 줄인다',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
    default: "'md'",
    description: '모든 자식 Avatar의 크기를 한 번에 정한다',
  },
  {
    name: 'spacing',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: '겹치는 정도. 8, 12, 16px씩 겹친다',
  },
];

const FALLBACK = `// 이름이 두 단어면 앞 글자 둘: TK
<Avatar alt="Taein Kim" />

// 한 단어면 앞 글자 하나: 홍
<Avatar alt="홍길동" />

// 이니셜 대신 내용을 직접 준다
<Avatar alt="관리자">
  <ShieldCheck size={18} />
</Avatar>`;

const STATUS = `<Avatar alt="Taein Kim" status="online" />

// 점은 스크린 리더가 읽지 않으니 글로도 알린다
<Avatar alt="Taein Kim" status="busy" />
<span>다른 용무 중</span>`;

const GROUP = `<AvatarGroup max={3} size="sm" spacing="md">
  <Avatar alt="Taein Kim" />
  <Avatar alt="Mina Park" />
  <Avatar alt="Joon Lee" />
  <Avatar alt="Sora Choi" />
  <Avatar alt="Hana Yoon" />
</AvatarGroup>`;

const CLICKABLE = `// button으로 그려진다
<Avatar alt="프로필 열기" onClick={openProfile} bouncy />

// a로 그려진다
<Avatar alt="내 프로필" href="/me" />

// 새 탭: rel="noopener noreferrer"가 자동으로 붙는다
<Avatar alt="GitHub" href="https://github.com" target="_blank" />`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          댓글 작성자, 참여자 목록, 프로필 메뉴의 트리거처럼 사람이나 팀을 작게
          나타내는 자리에 씁니다. 크기와 모양은 <code>size</code>와{' '}
          <code>variant</code>로 맞춥니다.
        </p>
      </Topic>
      <Topic title="사진이 없을 때">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>src</code>가 없거나 불러오지 못하면 <code>alt</code>에서
          이니셜을 만들어 보입니다. 이름이 두 단어 이상이면 앞의 두 단어의 첫
          글자를 대문자로 잇습니다. 한 단어면 첫 글자 하나, 비어 있으면{' '}
          <code>?</code>입니다. <code>children</code>을 주면 이니셜 대신 그
          내용을 보입니다.
        </p>
        <CodeBlock code={FALLBACK} />
      </Topic>
      <Topic title="상태 점">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>status</code>는 오른쪽 아래에 점을 붙입니다. <code>online</code>
          은 초록, <code>offline</code>은 회색, <code>busy</code>는 빨강,{' '}
          <code>away</code>는 주황입니다. 점은 스크린 리더에 전달되지 않으므로
          상태가 중요하면 글로도 알립니다.
        </p>
        <CodeBlock code={STATUS} />
      </Topic>
      <Topic title="여러 명을 겹쳐 보이기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>AvatarGroup</code>이 자식 Avatar를 겹쳐 놓습니다.{' '}
          <code>max</code>를 넘는 인원은 <code>+2</code>처럼 하나로 줄여
          보입니다. 이 칸은 스크린 리더가 &quot;2명 더 보기&quot;로 읽습니다.
        </p>
        <CodeBlock code={GROUP} />
        <div style={{ marginTop: 16 }}>
          <PropsList props={GROUP_PROPS} />
        </div>
      </Topic>
      <Topic title="누를 수 있는 아바타와 움직임">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>onClick</code>을 주면 button, <code>href</code>를 주면 a로
          그려지고 이름은 <code>alt</code>가 됩니다. 누를 수 있는 아바타는
          마우스를 올리면 밝기가 어두워집니다.
        </p>
        <CodeBlock code={CLICKABLE} />
        <p className={t.body} style={{ margin: '16px 0 0' }}>
          누르는 동안은 0.95배로 눌립니다. <code>bouncy</code>를 켜면 눌림 대신
          마우스를 올릴 때 튀며 15% 떠오르고 누르면 떠오른 채 1.1배로 커졌다가
          돌아옵니다. 키보드로 포커스가 오면 튀지 않고 떠오르기만 합니다.
          마우스로 눌러서 생긴 포커스와 터치에서는 떠오르지 않습니다. 누를 수
          없는 아바타가 움직이면 누를 수 있다고 오해하게 되므로{' '}
          <code>bouncy</code>는 누를 수 없는 아바타에서는 무시됩니다. 움직임
          줄이기 설정을 켠 환경에서는 움직이지 않습니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        이미지가 있으면 <code>img</code>에 <code>alt</code>가 붙고 없으면 이니셜
        칸이 <code>role=&quot;img&quot;</code>와 <code>aria-label</code>로{' '}
        <code>alt</code>를 전달합니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. <code>alt</code>에는 &quot;사진&quot;,
        &quot;avatar&quot; 같은 말 대신 실제 이름을 적습니다. 누구인지가
        전달되어야 합니다.
      </li>
      <li>
        상태 점은 <code>aria-hidden=&quot;true&quot;</code>라 스크린 리더가 읽지
        않습니다. 온라인인지 같은 정보가 필요하면 이름 옆에 글로 적습니다.
      </li>
      <li>
        <code>onClick</code>이면 <code>button</code>, <code>href</code>면{' '}
        <code>a</code>로 그려져 Tab으로 들어가고 Enter로 누릅니다(button은
        Space도). 이름은 <code>alt</code>입니다. 누를 수 있을 때{' '}
        <code>aria-expanded</code> 같은 <code>aria-*</code> 속성은 이미지가
        아니라 이 button이나 a에 붙습니다.
      </li>
      <li>누를 수 있는 아바타는 키보드로 포커스하면 포커스 링이 생깁니다.</li>
      <li>
        <code>AvatarGroup</code>의 <code>+N</code> 칸은{' '}
        <code>role=&quot;img&quot;</code>에 &quot;N명 더 보기&quot;라는 이름이
        붙습니다.
      </li>
    </ul>
  );
}

type Size = ComponentProps<typeof Avatar>['size'];
type Variant = ComponentProps<typeof Avatar>['variant'];
type Status = ComponentProps<typeof Avatar>['status'];

/** 무대 조각. 상세 페이지와 전체 컴포넌트 카드가 같이 쓴다 */
export function AvatarDemo({ values = INITIAL, mini }: DemoProps) {
  return (
    <Stage mini={mini} label="Avatar 시연" script={SCRIPT}>
      {/* core가 data-* 를 루트에 안 달아 주므로 감싼 요소가 첫 자식(루트)에 대상 표시를 단다 */}
      <span
        style={{ display: 'contents' }}
        ref={(el) =>
          el?.firstElementChild?.setAttribute('data-stage-target', 'avatar')
        }
      >
        <Avatar
          alt={String(values.alt)}
          size={values.size as Size}
          variant={values.variant as Variant}
          status={
            values.status === 'none' ? undefined : (values.status as Status)
          }
          bouncy={values.bouncy === true}
          onClick={() => undefined}
        />
      </span>
    </Stage>
  );
}

export function AvatarPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="Avatar"
      lead={LEAD}
      stage={<AvatarDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Avatar',
        values: { ...values, onClick: true },
        defaults: DEFAULTS,
        notation: NOTATION,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
