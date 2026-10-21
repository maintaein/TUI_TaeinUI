import { useState, type ComponentProps } from 'react';
import { TextField } from '@taein-ui/core';
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
  '이름, 이메일, 비밀번호, 검색어처럼 글자를 입력받는 자리에 둡니다. 여러 줄이 필요하면 multiline을 켭니다.';

const CONTROLS: Control[] = [
  { prop: 'label', kind: 'text' },
  { prop: 'placeholder', kind: 'text' },
  // 조작판 칸(320px)에 여섯은 안 들어가 넷만 둔다. tel과 url은 이렇게 씁니다 절에 적는다
  {
    prop: 'type',
    kind: 'choice',
    options: ['text', 'email', 'password', 'number'],
  },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'helperText', kind: 'text' },
  { prop: 'errorMessage', kind: 'text' },
  { prop: 'multiline', kind: 'toggle' },
  { prop: 'autoResize', kind: 'toggle' },
  { prop: 'error', kind: 'toggle' },
  { prop: 'required', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
  { prop: 'fullWidth', kind: 'toggle' },
];

const INITIAL: Values = {
  label: '이메일',
  placeholder: 'example@email.com',
  type: 'email',
  size: 'md',
  helperText: '',
  errorMessage: '',
  multiline: false,
  autoResize: false,
  error: false,
  required: false,
  disabled: false,
  fullWidth: false,
};

const DEFAULTS: Values = {
  placeholder: '',
  type: 'text',
  size: 'md',
  helperText: '',
  errorMessage: '',
};

// 커서가 입력칸으로 가서 올라타고(테두리가 호버 색으로), 눌러 포커스를 주고, 글자가 한 자씩 들어갔다 지워진다
// shortcut: 글자는 이메일 모양 하나뿐이라 type="number"를 고르면 칸이 비어 있는 채로 포커스만 보인다, 종류별로 다른 글자가 필요해지면 type 도구가 글자를 함수로 받게 한다
const TYPED = 'hello@taein.ui';
const SCRIPT = (act: Act) => {
  act.move('field');
  act.hover('field');
  act.wait(0.5);
  act.press('field');
  act.focus('field');
  act.wait(0.3);
  act.type('field', TYPED);
  act.wait(1.2);
  act.clear('field');
  act.blur('field');
  act.leave('field');
  act.wait(0.4);
  act.home();
  act.wait(0.8);
};

const PROPS: PropDefinition[] = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description: '입력칸 위에 보이는 레이블. 입력칸과 연결된다',
  },
  {
    name: 'type',
    type: "'text' | 'email' | 'password' | 'number' | 'tel' | 'url'",
    default: "'text'",
    description: '입력 종류. multiline일 때는 받지 않는다',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: '높이와 글자 크기',
  },
  {
    name: 'multiline',
    type: 'boolean',
    default: 'false',
    description:
      '여러 줄 입력(textarea)으로 바꾼다. 이때 ref는 HTMLTextAreaElement다',
  },
  {
    name: 'rows',
    type: 'number',
    default: '4',
    description: '보이는 줄 수. multiline일 때만 받는다',
  },
  {
    name: 'autoResize',
    type: 'boolean',
    default: 'false',
    description:
      '입력한 내용에 맞춰 높이가 늘어난다. multiline일 때만 받는다. rows가 최소 높이가 된다',
  },
  {
    name: 'helperText',
    type: 'string',
    description:
      '입력칸 아래 도움말. error일 때는 숨고 errorMessage가 대신 보인다',
  },
  {
    name: 'error',
    type: 'boolean',
    default: 'false',
    description:
      '에러 상태. 테두리가 에러 색이 되고 aria-invalid가 true가 된다',
  },
  {
    name: 'errorMessage',
    type: 'string',
    description: 'error일 때 입력칸 아래에 보이는 메시지',
  },
  {
    name: 'fullWidth',
    type: 'boolean',
    default: 'false',
    description: '부모 폭을 채운다',
  },
  {
    name: 'required',
    type: 'boolean',
    default: 'false',
    description: '필수 입력. 레이블 뒤에 *가 붙는다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '입력할 수 없게 한다',
  },
  {
    name: 'placeholder',
    type: 'string',
    description: '비어 있을 때 보이는 안내 글자',
  },
];

const CONTROLLED = `const [email, setEmail] = useState('');

<TextField
  label="이메일"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  helperText={\`\${email.length}자 입력됨\`}
/>`;

const UNCONTROLLED = `<form onSubmit={(e) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
}}>
  <TextField label="닉네임" name="nickname" defaultValue="홍길동" />
</form>`;

const MULTILINE = `<TextField label="소개" multiline rows={6} fullWidth />

<TextField label="메모" multiline autoResize rows={2} fullWidth />`;

const ERROR = `<TextField
  label="이메일"
  type="email"
  error={!valid}
  errorMessage="올바른 이메일 형식이 아닙니다. 예: user@example.com"
/>`;

function Usage() {
  return (
    <Topics>
      <Topic title="레이블은 꼭 씁니다">
        <p className={t.body}>
          <code>label</code>은 필수 prop입니다. 입력칸 위에 보이고, 입력칸과
          연결되어 레이블을 누르면 입력칸에 포커스가 갑니다.{' '}
          <code>placeholder</code>는 입력을 시작하면 사라지므로 레이블을 대신할
          수 없습니다. 입력 형식의 예시를 보여 주는 용도로 씁니다.
        </p>
      </Topic>
      <Topic title="입력 종류">
        <p className={t.body}>
          <code>type</code>을 이메일, 전화번호, 주소에 맞게 지정하면 모바일에서
          알맞은 키보드가 뜨고, 비밀번호는 글자가 가려집니다. 기본은{' '}
          <code>text</code>입니다. 조작판에는 네 가지만 있지만 <code>tel</code>
          (전화번호)과 <code>url</code>(주소)도 같은 방식으로 씁니다.
        </p>
      </Topic>
      <Topic title="값을 다루는 두 가지 방법">
        <p className={t.body} style={{ marginBottom: 12 }}>
          입력값에 따라 바로 검사하거나 다른 곳에 보여 줘야 하면{' '}
          <code>value</code>와 <code>onChange</code>를 함께 넘겨 부모가 값을
          쥡니다(제어).
        </p>
        <CodeBlock code={CONTROLLED} />
        <p className={t.body} style={{ margin: '16px 0 12px' }}>
          제출할 때만 값이 필요하면 <code>defaultValue</code>로 처음 값만 주고
          컴포넌트에 맡깁니다(비제어). <code>name</code>을 주면 폼 제출 때{' '}
          <code>FormData</code>로 한꺼번에 읽을 수 있습니다.
        </p>
        <CodeBlock code={UNCONTROLLED} />
      </Topic>
      <Topic title="여러 줄 입력">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>multiline</code>을 켜면 textarea를 그립니다. <code>rows</code>로
          보이는 줄 수를 정하고, <code>autoResize</code>를 함께 켜면 내용에 맞춰
          높이가 늘어납니다. <code>multiline</code>은 <code>true</code>나{' '}
          <code>false</code>를 직접 적어야 하고, 값이 변수라면 삼항으로 갈라
          씁니다. 도중에 바꾸면 다른 요소로 다시 그려져 포커스와 비제어 값이
          사라집니다.
        </p>
        <CodeBlock code={MULTILINE} />
      </Topic>
      <Topic title="에러와 도움말">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>helperText</code>로 입력 형식을 미리 안내합니다.{' '}
          <code>error</code>가 켜지면 도움말은 숨고 <code>errorMessage</code>가
          그 자리에 보입니다. 메시지는 무엇이 틀렸고 어떻게 고치는지까지
          적습니다.
        </p>
        <CodeBlock code={ERROR} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>label</code>이 <code>label</code> 요소로 그려져 입력칸과
        연결됩니다. 스크린 리더가 입력칸의 용도를 읽고, 레이블을 눌러도 포커스가
        갑니다.
      </li>
      <li>
        <code>required</code>이면 입력칸에 <code>required</code> 속성이 붙고
        레이블 뒤에 <code>*</code>가 붙습니다.
      </li>
      <li>
        <code>error</code>이면 <code>aria-invalid</code>가 <code>true</code>가
        됩니다. <code>helperText</code>나 <code>errorMessage</code>가 보일 때는{' '}
        <code>aria-describedby</code>로 입력칸에 이어져 입력칸에 들어가면 함께
        읽힙니다.
      </li>
      <li>
        <code>disabled</code>이면 <code>aria-disabled</code>가 <code>true</code>
        가 되고 입력할 수 없습니다.
      </li>
      <li>
        레이블에는 입력할 내용을 구체적으로 적습니다. 에러 메시지도 &quot;잘못된
        입력&quot;처럼 막연하게 쓰지 않고 고치는 방법을 적습니다.
      </li>
    </ul>
  );
}

type Single = ComponentProps<typeof TextField>;
type FieldType = NonNullable<Single['type']>;
type Size = NonNullable<Single['size']>;

export function TextFieldPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const multiline = values.multiline === true;

  const shared = {
    'data-stage-target': 'field',
    label: String(values.label),
    size: values.size as Size,
    placeholder: String(values.placeholder) || undefined,
    helperText: String(values.helperText) || undefined,
    errorMessage: String(values.errorMessage) || undefined,
    error: values.error === true,
    required: values.required === true,
    disabled: values.disabled === true,
    fullWidth: values.fullWidth === true,
  };

  // type은 한 줄에만, autoResize는 여러 줄에만 있다. 조작판과 코드에도 그렇게 낸다
  const hidden = multiline ? 'type' : 'autoResize';
  const controls = CONTROLS.filter((c) => c.prop !== hidden);
  const shown = { ...values };
  delete shown[hidden];

  return (
    <DetailLayout
      name="TextField"
      lead={LEAD}
      stage={
        <Stage label="TextField 시연" script={SCRIPT}>
          {multiline ? (
            <TextField
              {...shared}
              multiline
              autoResize={values.autoResize === true}
            />
          ) : (
            <TextField {...shared} type={values.type as FieldType} />
          )}
        </Stage>
      }
      customize={
        <Customize controls={controls} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'TextField',
        values: shown,
        defaults: DEFAULTS,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
