import { useState, type ComponentProps } from 'react';
import { Menu, Plus, Star, Trash } from 'lucide-react';
import { IconButton } from '@taein-ui/core';
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
import { Stage, type Act, type DemoProps } from '../../../components/Stage';

const LEAD =
  '닫기, 메뉴 열기, 설정처럼 아이콘만으로 뜻이 분명한 동작을 버튼으로 만듭니다.';

const CONTROLS: Control[] = [
  {
    prop: 'buttonStyle',
    kind: 'choice',
    options: ['ghost', 'weak', 'strong'],
  },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg', 'xl'] },
  { prop: 'hoverEffect', kind: 'choice', options: ['jelly', 'none'] },
  { prop: 'loading', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
];

const INITIAL: Values = {
  buttonStyle: 'strong',
  size: 'lg',
  hoverEffect: 'jelly',
  loading: false,
  disabled: false,
};

const DEFAULTS: Values = {
  buttonStyle: 'ghost',
  size: 'md',
  hoverEffect: 'jelly',
};

// 무대는 색 네 가지를 나란히 보인다(variant는 조작판에 없다). 코드는 첫 단추의 것이다
const VARIANTS = [
  { variant: 'primary', icon: <Plus />, label: '추가', target: 'a' },
  { variant: 'dark', icon: <Menu />, label: '메뉴', target: 'b' },
  { variant: 'danger', icon: <Trash />, label: '삭제', target: 'c' },
  { variant: 'light', icon: <Star />, label: '즐겨찾기', target: 'd' },
] as const;

// 커서가 단추 위에 머물면 젤리가 한 번 출렁이고(0.65초) 끝난 뒤에 누르고, 떠나 다음 단추로 간다
// 젤리는 도는 동안 다시 들어와도 무시하므로 머무름이 출렁임보다 길어야 끝까지 보인다
const SCRIPT = (act: Act) => {
  act.move('a');
  act.hover('a');
  act.wait(0.9);
  act.press('a');
  act.wait(0.3);
  act.leave('a');
  act.move('b');
  act.hover('b');
  act.wait(0.9);
  act.press('b');
  act.wait(0.3);
  act.leave('b');
  act.move('c');
  act.hover('c');
  act.wait(0.9);
  act.leave('c');
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description:
      '아이콘 요소. lucide-react, react-icons 어느 라이브러리의 아이콘이든 넣는다',
  },
  {
    name: 'aria-label',
    type: 'string',
    description: '스크린 리더가 읽는 버튼 이름. 글자가 없어 꼭 필요하다',
  },
  {
    name: 'aria-labelledby',
    type: 'string',
    description: '이름이 될 요소의 id. aria-label 대신 쓴다',
  },
  {
    name: 'buttonStyle',
    type: "'ghost' | 'weak' | 'strong'",
    default: "'ghost'",
    description:
      'ghost는 배경 없이 아이콘만(호버에 옅은 배경), weak는 옅은 배경, strong은 진한 배경',
  },
  {
    name: 'variant',
    type: "'primary' | 'dark' | 'danger' | 'light'",
    default: "'primary'",
    description: '색. weak와 strong에만 적용되고 ghost는 회색 고정이다',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg' | 'xl'",
    default: "'md'",
    description:
      '버튼과 아이콘의 크기. 아이콘 크기는 이 값이 정한다. sm은 보이는 크기 36px, 누르는 영역은 44px',
  },
  {
    name: 'hoverEffect',
    type: "'jelly' | 'none'",
    default: "'jelly'",
    description:
      '마우스가 들어오면 아이콘이 옆으로 퍼졌다 출렁이며 돌아온다. none으로 끈다',
  },
  {
    name: 'loading',
    type: 'boolean',
    default: 'false',
    description: '아이콘 자리에 Loader를 돌리고 누름을 막는다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '누를 수 없게 한다',
  },
];

const NAMED = `// 이름이 있다
<IconButton aria-label="닫기">
  <X />
</IconButton>

// 이름이 없다: 스크린 리더 사용자가 용도를 알 수 없다
<IconButton>
  <X />
</IconButton>`;

const CONTEXT = `// 아이콘만으로 충분하다: IconButton
<IconButton aria-label="닫기">
  <X />
</IconButton>

// 글자가 필요하다: Button
<Button leftIcon={<Trash />}>삭제하기</Button>`;

const ICON_SIZE = `// size가 아이콘 크기를 정한다. 아이콘에 size를 따로 주지 않는다
<IconButton size="lg" aria-label="추가">
  <Plus />
</IconButton>

// 꼭 바꿔야 하면 size prop이 아니라 style이나 className으로 준다
<IconButton aria-label="추가">
  <Plus style={{ width: 28, height: 28 }} />
</IconButton>`;

const LOADING = `<IconButton
  buttonStyle="strong"
  loading={saving}
  onClick={save}
  aria-label="저장"
>
  <Save />
</IconButton>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body} style={{ marginBottom: 12 }}>
          닫기, 메뉴 열기, 새로고침처럼 아이콘만 봐도 뜻이 통하는 동작에 씁니다.
          삭제처럼 구체적인 행동은 아이콘만으로 오해하기 쉬우니 글자가 있는{' '}
          <code>Button</code>을 씁니다.
        </p>
        <CodeBlock code={CONTEXT} />
      </Topic>
      <Topic title="이름과 아이콘 크기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          글자가 없으므로 <code>aria-label</code>로 버튼의 이름을 꼭 붙입니다.
          개발 환경에서는 이름이 없으면 콘솔에 오류가 납니다.
        </p>
        <CodeBlock code={NAMED} />
        <p className={t.body} style={{ margin: '16px 0 12px' }}>
          아이콘 크기는 <code>size</code>가 정합니다(sm 18px, md 22px, lg 26px,
          xl 30px). 아이콘에 <code>size</code> prop을 주면 버튼의 규칙에 져서
          적용되지 않으므로, 바꾸려면 <code>style</code>이나{' '}
          <code>className</code>으로 줍니다.
        </p>
        <CodeBlock code={ICON_SIZE} />
      </Topic>
      <Topic title="스타일과 색">
        <p className={t.body}>
          <code>buttonStyle</code>로 눈에 띄는 정도를 고릅니다. 기본{' '}
          <code>ghost</code>는 배경 없이 아이콘만 있어 카드 모서리의 닫기처럼
          콘텐츠 옆에 둘 때 맞습니다. <code>weak</code>는 툴바의 보조 동작,{' '}
          <code>strong</code>은 가장 눈에 띄어야 하는 동작에 씁니다.{' '}
          <code>variant</code>로 고르는 색은 <code>weak</code>와{' '}
          <code>strong</code>에만 적용되고 <code>ghost</code>는 회색 하나입니다.
          무대의 네 단추가 <code>primary</code>, <code>dark</code>,{' '}
          <code>danger</code>, <code>light</code>입니다.
        </p>
      </Topic>
      <Topic title="기다리는 동안">
        <p className={t.body} style={{ marginBottom: 12 }}>
          저장처럼 응답을 기다리는 동안은 <code>loading</code>을 켭니다. 아이콘
          자리에서 Loader가 돌고 누름을 받지 않으므로 요청이 두 번 가지
          않습니다.
        </p>
        <CodeBlock code={LOADING} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          마우스를 올리면 아이콘이 부피를 지키며 옆으로 1.15배 퍼졌다가 출렁이며
          돌아옵니다(젤리). 한 번 도는 동안 다시 들어와도 무시하고 터치와 키보드
          포커스, 비활성과 로딩에서는 일어나지 않습니다. 누르는 동안 버튼이
          0.95배로 눌렸다 되밀리고 아주 짧게 눌러도 끝까지 나옵니다.{' '}
          <code>hoverEffect=&quot;none&quot;</code>으로 젤리를 끌 수 있습니다.
          움직임 줄이기 설정을 켠 환경에서는 크기 변화 없이 색만 바뀝니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        네이티브 <code>&lt;button&gt;</code>이라 Tab으로 들어가고 Enter와
        Space로 누릅니다. 따로 붙일 것이 없습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 글자가 없으므로 <code>aria-label</code>(또는{' '}
        <code>aria-labelledby</code>)로 이름을 꼭 줍니다. 없으면 개발 환경에서
        콘솔 오류가 납니다.
      </li>
      <li>
        아이콘은 <code>aria-hidden=&quot;true&quot;</code>인 칸에 들어가 스크린
        리더가 읽지 않습니다. 이름 중복 읽기를 막습니다.
      </li>
      <li>
        <code>disabled</code>나 <code>loading</code>이면{' '}
        <code>aria-disabled</code>가 <code>true</code>가 되고 누를 수 없습니다.{' '}
        <code>loading</code>이면 <code>aria-busy</code>도 <code>true</code>이고
        안의 Loader는 &quot;로딩 중&quot;으로 읽힙니다.
      </li>
      <li>키보드로 포커스하면 2px 포커스 링이 생깁니다.</li>
      <li>
        <code>size=&quot;sm&quot;</code>는 보이는 크기가 36px이고 눈에 보이지
        않는 띠로 누르는 영역을 44px로 유지합니다. 이웃과 4px 안쪽으로 붙이면
        누르는 영역이 겹칩니다.
      </li>
    </ul>
  );
}

type Look = ComponentProps<typeof IconButton>['buttonStyle'];
type Size = ComponentProps<typeof IconButton>['size'];
type Hover = ComponentProps<typeof IconButton>['hoverEffect'];

/** 무대 조각. 상세 페이지와 전체 컴포넌트 카드가 같이 쓴다 */
export function IconButtonDemo({ values = INITIAL, mini }: DemoProps) {
  return (
    <Stage mini={mini} label="IconButton 시연" script={SCRIPT}>
      <div style={{ display: 'flex', gap: 12 }}>
        {VARIANTS.map(({ variant, icon, label, target }) => (
          <IconButton
            key={variant}
            data-stage-target={target}
            variant={variant}
            buttonStyle={values.buttonStyle as Look}
            size={values.size as Size}
            hoverEffect={values.hoverEffect as Hover}
            loading={values.loading === true}
            disabled={values.disabled === true}
            aria-label={label}
          >
            {icon}
          </IconButton>
        ))}
      </div>
    </Stage>
  );
}

export function IconButtonPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="IconButton"
      lead={LEAD}
      stage={<IconButtonDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'IconButton',
        values: { ...values, 'aria-label': '추가', children: '<Plus />' },
        defaults: DEFAULTS,
      }).replace(
        "from '@taein-ui/core';",
        "from '@taein-ui/core';\nimport { Plus } from 'lucide-react';"
      )}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
