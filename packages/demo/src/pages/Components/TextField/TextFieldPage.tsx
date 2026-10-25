import { useState, type ChangeEvent, type ComponentProps } from 'react';
import { Button, TextField } from '@taein-ui/core';
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
  '이름, 이메일, 비밀번호, 검색어처럼 글자를 입력받는 자리에 둡니다. 여러 줄이 필요하면 multiline을 켭니다.';

const CONTROLS: Control[] = [
  { prop: 'label', kind: 'text' },
  { prop: 'placeholder', kind: 'text' },
  {
    prop: 'type',
    kind: 'choice',
    options: ['text', 'email', 'password', 'number', 'tel', 'url'],
  },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'helperText', kind: 'text' },
  { prop: 'errorMessage', kind: 'text' },
  { prop: 'successMessage', kind: 'text' },
  { prop: 'multiline', kind: 'toggle' },
  { prop: 'autoResize', kind: 'toggle' },
  { prop: 'error', kind: 'toggle' },
  { prop: 'success', kind: 'toggle' },
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
  errorMessage: '이메일 형식이 아닙니다. 예: user@taein.ui',
  successMessage: '사용할 수 있는 이메일입니다',
  multiline: false,
  autoResize: false,
  error: false,
  success: false,
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
  successMessage: '',
};

// 실패에서 성공으로: 커서가 입력칸에 틀린 이메일을 쓰고 확인을 누르면 입력칸이 흔들리며 빨개지고 오류 문구가 내려온다.
// 지우고 고쳐 쓴 뒤 다시 누르면 초록 확인이 보인다. 입력을 바꾸면 결과가 지워진다
// shortcut: 글자는 이메일 모양 둘뿐이라 type="number"를 고르면 칸이 비어 있는 채로 포커스만 보인다, 종류별로 다른 글자가 필요해지면 type 도구가 글자를 함수로 받게 한다
const WRONG = 'hello@taein';
const RIGHT = 'hello@taein.ui';
const EMAIL = /^\S+@\S+\.\S+$/;
const SCRIPT = (act: Act) => {
  act.move('field');
  act.hover('field');
  act.wait(0.5);
  act.press('field');
  act.focus('field');
  act.wait(0.3);
  act.type('field', WRONG);
  act.wait(0.4);
  act.move('submit', 0.5);
  act.hover('submit');
  act.press('submit');
  act.wait(1.8);
  act.leave('submit');
  act.move('field', 0.5);
  act.clear('field');
  act.wait(0.3);
  act.type('field', RIGHT);
  act.wait(0.4);
  act.move('submit', 0.5);
  act.hover('submit');
  act.press('submit');
  act.wait(1.8);
  act.leave('submit');
  act.clear('field');
  act.blur('field');
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
      '에러 상태. 테두리가 에러 색이 되고 aria-invalid가 true가 된다. 켜질 때 입력칸이 좌우로 짧게 흔들린다',
  },
  {
    name: 'errorMessage',
    type: 'string',
    description: 'error일 때 입력칸 아래에 보이는 메시지',
  },
  {
    name: 'success',
    type: 'boolean',
    default: 'false',
    description:
      '성공 상태. 테두리와 메시지가 초록(success.dark)이 되고 메시지가 위에서 내려온다. error가 함께 켜지면 error가 이긴다',
  },
  {
    name: 'successMessage',
    type: 'string',
    description:
      'success일 때 입력칸 아래에 보이는 메시지. helperText 자리를 대신한다',
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

const SUCCESS = `<TextField
  label="이메일"
  type="email"
  error={checked && !valid}
  errorMessage="올바른 이메일 형식이 아닙니다. 예: user@example.com"
  success={checked && valid}
  successMessage="사용할 수 있는 이메일입니다"
/>`;

function Usage() {
  return (
    <Topics>
      <Topic title="레이블은 꼭 씁니다">
        <p className={t.body}>
          <code>label</code>은 필수 prop입니다. 입력칸 위에 보이고 입력칸과
          연결되어 레이블을 누르면 입력칸에 포커스가 갑니다.{' '}
          <code>placeholder</code>는 입력을 시작하면 사라지므로 레이블을 대신할
          수 없습니다. 입력 형식의 예시를 보여 주는 용도로 씁니다.
        </p>
      </Topic>
      <Topic title="입력 종류">
        <p className={t.body}>
          <code>type</code>을 이메일, 전화번호, 주소에 맞게 지정하면 모바일에서
          알맞은 키보드가 뜨고 비밀번호는 글자가 가려집니다. 기본은{' '}
          <code>text</code>입니다. 전화번호는 <code>tel</code>, 주소는{' '}
          <code>url</code>입니다.
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
          보이는 줄 수를 정하고 <code>autoResize</code>를 함께 켜면 내용에 맞춰
          높이가 늘어납니다. <code>multiline</code>은 <code>true</code>나{' '}
          <code>false</code>를 직접 적어야 하고 값이 변수라면 삼항으로 갈라
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
        <p className={t.body} style={{ margin: '16px 0 12px' }}>
          <code>error</code>가 켜질 때 입력칸이 좌우로 짧게 흔들리고 빨개집니다.{' '}
          <code>error</code>가 <code>false</code>에서 <code>true</code>로 바뀔
          때와, 켜진 채 <code>errorMessage</code>가 바뀔 때 일어나고 처음부터
          켜져 있을 때는 없습니다. 같은 오류로 다시 제출해도 흔들리게 하려면{' '}
          <code>errorMessage</code>를 바꾸거나 <code>error</code>를 껐다 켭니다.
          사용자가 움직임을 줄이도록 설정했으면 흔들리지 않고 색만 바뀝니다.
        </p>
      </Topic>
      <Topic title="성공 표시">
        <p className={t.body} style={{ marginBottom: 12 }}>
          검사를 통과했다는 확인이 필요하면 <code>success</code>와{' '}
          <code>successMessage</code>를 씁니다. 테두리와 메시지가 초록이 되고
          메시지가 위에서 내려오며 나타납니다. 메시지는 도움말 자리에 보이고{' '}
          <code>error</code>와 함께 켜면 <code>error</code>가 이깁니다.
        </p>
        <CodeBlock code={SUCCESS} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>label</code>이 <code>label</code> 요소로 그려져 입력칸과
        연결됩니다. 스크린 리더가 입력칸의 용도를 읽고 레이블을 눌러도 포커스가
        갑니다.
      </li>
      <li>
        <code>required</code>이면 입력칸에 <code>required</code> 속성이 붙고
        레이블 뒤에 <code>*</code>가 붙습니다.
      </li>
      <li>
        <code>error</code>이면 <code>aria-invalid</code>가 <code>true</code>가
        됩니다. <code>success</code>는 <code>aria-invalid</code>를 바꾸지
        않습니다. <code>helperText</code>, <code>errorMessage</code>,{' '}
        <code>successMessage</code> 중 보이는 것은 <code>aria-describedby</code>
        로 입력칸에 이어져 입력칸에 들어가면 함께 읽힙니다.
      </li>
      <li>
        성공은 초록 하나에만 기대지 않고 <code>successMessage</code> 글자로도
        전해야 합니다. 테두리와 메시지는 흰 바탕에서 대비가 충분한 짙은 초록(
        <code>success.dark</code>)입니다. 오류의 흔들림은 움직임 줄이기 설정에서
        사라지고 색과 글자가 남습니다.
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

/** 무대 조각. 상세 페이지와 전체 컴포넌트 카드가 같이 쓴다 */
export function TextFieldDemo({ values = INITIAL, mini }: DemoProps) {
  const multiline = values.multiline === true;
  // 확인을 누르면 입력값을 검사해 결과가 정해지고, 입력을 바꾸면 결과가 지워진다
  const [text, setText] = useState('');
  const [result, setResult] = useState<'error' | 'success' | null>(null);
  const shared = {
    'data-stage-target': 'field',
    label: String(values.label),
    size: values.size as Size,
    placeholder: String(values.placeholder) || undefined,
    helperText: String(values.helperText) || undefined,
    errorMessage: String(values.errorMessage) || undefined,
    successMessage: String(values.successMessage) || undefined,
    error: values.error === true || result === 'error',
    success: values.success === true || result === 'success',
    required: values.required === true,
    disabled: values.disabled === true,
    fullWidth: values.fullWidth === true,
    value: text,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setText(e.target.value);
      setResult(null);
    },
  };

  return (
    <Stage mini={mini} label="TextField 시연" script={SCRIPT}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setResult(EMAIL.test(text) ? 'success' : 'error');
        }}
        style={{
          display: 'grid',
          justifyItems: 'center',
          gap: '0.75rem',
          width: '100%',
        }}
      >
        {multiline ? (
          <TextField
            {...shared}
            multiline
            autoResize={values.autoResize === true}
          />
        ) : (
          <TextField {...shared} type={values.type as FieldType} />
        )}
        <Button type="submit" size="sm" data-stage-target="submit">
          확인
        </Button>
      </form>
    </Stage>
  );
}

export function TextFieldPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const multiline = values.multiline === true;

  // type은 한 줄에만, autoResize는 여러 줄에만 있다. 조작판과 코드에도 그렇게 낸다
  const hidden = multiline ? 'type' : 'autoResize';
  const controls = CONTROLS.filter((c) => c.prop !== hidden);
  const shown = { ...values };
  delete shown[hidden];

  return (
    <DetailLayout
      name="TextField"
      lead={LEAD}
      stage={<TextFieldDemo values={values} />}
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
