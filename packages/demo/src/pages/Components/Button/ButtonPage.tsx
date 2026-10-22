import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { ArrowRight, Send } from 'lucide-react';
import { Button } from '@taein-ui/core';
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
  '누르면 일이 일어나는 자리에 둡니다. 폼 제출, 창 열기, 삭제 같은 동작을 맡습니다.';

const CONTROLS: Control[] = [
  { prop: 'children', kind: 'text', label: '글자' },
  {
    prop: 'variant',
    kind: 'choice',
    options: ['primary', 'dark', 'danger', 'light'],
  },
  { prop: 'buttonStyle', kind: 'choice', options: ['strong', 'weak'] },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg', 'xl'] },
  { prop: 'loading', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
  { prop: 'fullWidth', kind: 'toggle' },
  { prop: 'leftIcon', kind: 'toggle' },
  { prop: 'rightIcon', kind: 'toggle' },
];

const INITIAL: Values = {
  children: '보내기',
  variant: 'primary',
  buttonStyle: 'strong',
  size: 'lg',
  loading: false,
  disabled: false,
  fullWidth: false,
  leftIcon: true,
  rightIcon: false,
};

const DEFAULTS: Values = {
  variant: 'primary',
  buttonStyle: 'strong',
  size: 'md',
};

const NOTATION = {
  leftIcon: {
    expr: '<Send />',
    import: { name: 'Send', from: 'lucide-react' },
  },
  rightIcon: {
    expr: '<ArrowRight />',
    import: { name: 'ArrowRight', from: 'lucide-react' },
  },
};

// 커서가 Button으로 가서 올라타 호버 색이 보이게 머문 뒤 누르면, 누른 Button이 잠깐 loading이 됐다가 돌아온다
const SCRIPT = (act: Act) => {
  act.move('button');
  act.hover('button');
  act.wait(0.7);
  act.press('button');
  act.leave('button');
  act.wait(1.5);
  act.home();
  act.wait(1);
};

// 누르면 loading이 켜져 있는 시간(ms). 스크립트의 쉬는 시간(1.5초)보다 짧아야 끝난 모습이 보인다
const BUSY_MS = 1100;

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    required: true,
    description: '버튼에 들어갈 글자나 내용',
  },
  {
    name: 'variant',
    type: "'primary' | 'dark' | 'danger' | 'light'",
    default: "'primary'",
    description: '색. 한 화면의 가장 중요한 동작에 primary',
  },
  {
    name: 'buttonStyle',
    type: "'strong' | 'weak'",
    default: "'strong'",
    description: 'strong은 면을 채우고 weak는 바탕을 비운다',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg' | 'xl'",
    default: "'md'",
    description: '높이와 글자 크기',
  },
  {
    name: 'fullWidth',
    type: 'boolean',
    default: 'false',
    description: '부모 폭을 채운다',
  },
  {
    name: 'loading',
    type: 'boolean',
    default: 'false',
    description: 'Loader를 돌리고 누름을 막는다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '누를 수 없게 한다',
  },
  {
    name: 'leftIcon',
    type: 'ReactNode',
    description: '글자 왼쪽 아이콘. 로딩 중에는 숨는다',
  },
  {
    name: 'rightIcon',
    type: 'ReactNode',
    description: '글자 오른쪽 아이콘. 로딩 중에는 숨는다',
  },
  {
    name: 'customColor',
    type: '{ bg: string; text: string; hoverBg?: string; activeBg?: string }',
    description:
      '배경·글자·호버·누름 색을 직접 준다. 주면 variant의 색은 쓰이지 않는다. variant="light"와 함께 쓰면 bg가 테두리와 글자 색이 된다',
  },
];

const CUSTOM = `<Button customColor={{ bg: '#6D28D9', text: '#FFFFFF' }}>
  보라색 버튼
</Button>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          Button은 누르는 순간 무언가를 실행할 때 씁니다. 폼을 보내거나, 창을
          열거나, 항목을 지우는 자리입니다. 다른 페이지로 옮겨 가는 것이
          목적이면 Button 대신 링크(<code>&lt;a&gt;</code>)를 씁니다.
        </p>
      </Topic>
      <Topic title="색과 채우기">
        <p className={t.body}>
          <code>variant</code>로 색을, <code>buttonStyle</code>로 채우기를
          고릅니다. 한 화면에서 가장 중요한 동작 하나에만 <code>primary</code>와{' '}
          <code>strong</code>을 주고 나머지는 <code>weak</code>로 한 단계
          낮춥니다. 지우기처럼 되돌릴 수 없는 동작에는 <code>danger</code>를
          씁니다.
        </p>
      </Topic>
      <Topic title="기다리는 동안">
        <p className={t.body}>
          요청을 보내고 응답을 기다릴 때는 <code>loading</code>을 켭니다. 버튼의
          글자와 아이콘 자리에서 Loader가 돌고 누름을 받지 않으므로 같은 요청이
          두 번 가지 않습니다.
        </p>
      </Topic>
      <Topic title="정해진 색 밖의 색">
        <p className={t.body} style={{ marginBottom: 12 }}>
          브랜드 색이 따로 있으면 <code>customColor</code>에 배경과 글자 색을
          넘깁니다. 이때 <code>variant</code>의 색은 쓰이지 않습니다. 글자와
          배경의 대비가 4.5:1 이상인지는 직접 확인해야 합니다.
        </p>
        <CodeBlock code={CUSTOM} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          누르는 동안 0.95배로 눌렸다가, 손을 떼면 살짝 튕기며 제자리로
          돌아옵니다. 아주 짧게 눌러도 이 움직임은 끝까지 나옵니다. 움직임
          줄이기 설정을 켠 환경에서는 크기 변화 없이 색만 바뀝니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        네이티브 <code>&lt;button&gt;</code>을 그대로 그리므로 Tab으로 들어가고
        Enter와 Space로 누릅니다. 따로 붙일 것이 없습니다.
      </li>
      <li>
        <code>loading</code> 중에는 <code>aria-busy</code>가 <code>true</code>가
        되고 안에서 도는 Loader는 &quot;로딩 중&quot;으로 읽힙니다.
      </li>
      <li>
        <code>disabled</code>나 <code>loading</code>이면{' '}
        <code>aria-disabled</code>가 <code>true</code>가 되고 누를 수 없습니다.
      </li>
      <li>
        아이콘만 있는 버튼은 Button 대신 IconButton을 쓰고{' '}
        <code>aria-label</code>로 이름을 붙입니다.
      </li>
    </ul>
  );
}

type Variant = ComponentProps<typeof Button>['variant'];
type Look = ComponentProps<typeof Button>['buttonStyle'];
type Size = ComponentProps<typeof Button>['size'];

export function ButtonPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  // 연출 커서(또는 진짜 손)가 누르면 잠깐 loading이 된다
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(busyTimer.current), []);

  const press = () => {
    window.clearTimeout(busyTimer.current);
    setBusy(true);
    busyTimer.current = window.setTimeout(() => setBusy(false), BUSY_MS);
  };

  return (
    <DetailLayout
      name="Button"
      lead={LEAD}
      stage={
        <Stage label="Button 시연" script={SCRIPT}>
          <Button
            data-stage-target="button"
            variant={values.variant as Variant}
            buttonStyle={values.buttonStyle as Look}
            size={values.size as Size}
            loading={values.loading === true || busy}
            disabled={values.disabled === true}
            fullWidth={values.fullWidth === true}
            leftIcon={values.leftIcon === true ? <Send /> : undefined}
            rightIcon={values.rightIcon === true ? <ArrowRight /> : undefined}
            onClick={press}
          >
            {String(values.children) || ' '}
          </Button>
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Button',
        values,
        defaults: DEFAULTS,
        notation: NOTATION,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
