import { useState, type ComponentProps } from 'react';
import { Checkbox } from '@taein-ui/core';
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
  '약관 동의, 여러 항목 고르기처럼 항목을 하나씩 체크하고 해제하는 자리에 둡니다.';

const CONTROLS: Control[] = [
  { prop: 'label', kind: 'text' },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'helperText', kind: 'text' },
  { prop: 'errorMessage', kind: 'text' },
  { prop: 'indeterminate', kind: 'toggle' },
  { prop: 'error', kind: 'toggle' },
  { prop: 'required', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
];

const INITIAL: Values = {
  label: '약관에 동의합니다',
  size: 'lg',
  helperText: '',
  errorMessage: '',
  indeterminate: false,
  error: false,
  required: false,
  disabled: false,
};

const DEFAULTS: Values = {
  size: 'md',
  helperText: '',
  errorMessage: '',
};

// 커서가 상자로 가서 올라타고(테두리가 진해지고), 눌러 체크하고, 한 번 더 눌러 해제한다
const SCRIPT = (act: Act) => {
  act.move('box');
  act.hover('box');
  act.wait(0.5);
  act.press('box');
  act.wait(1.3);
  act.press('box');
  act.wait(1);
  act.leave('box');
  act.home();
  act.wait(0.8);
};

const PROPS: PropDefinition[] = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description: '상자 옆 레이블. 레이블까지 눌리는 영역이다',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: '상자 크기. 16px, 20px, 24px',
  },
  {
    name: 'indeterminate',
    type: 'boolean',
    default: 'false',
    description:
      '일부만 선택된 상태. 체크 표시 대신 가로선이 그려진다. 전체 선택 상자에 쓴다',
  },
  {
    name: 'helperText',
    type: 'string',
    description: '아래 도움말. error일 때는 숨고 errorMessage가 대신 보인다',
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
    description: 'error일 때 아래에 보이는 메시지',
  },
  {
    name: 'checked',
    type: 'boolean',
    description: '체크 상태. onChange와 함께 넘겨 부모가 쥔다(제어)',
  },
  {
    name: 'defaultChecked',
    type: 'boolean',
    description: '처음 체크 상태. 이후는 컴포넌트가 쥔다(비제어)',
  },
  {
    name: 'required',
    type: 'boolean',
    default: 'false',
    description: '필수 선택. 레이블 뒤에 *가 붙는다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '누를 수 없게 한다',
  },
];

const CONTROLLED = `const [agree, setAgree] = useState(false);

<Checkbox
  label="약관에 동의합니다"
  checked={agree}
  onChange={(e) => setAgree(e.target.checked)}
/>`;

const UNCONTROLLED = `<form onSubmit={(e) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
}}>
  <Checkbox label="뉴스레터 받기" name="newsletter" defaultChecked />
</form>`;

const SELECT_ALL = `const [items, setItems] = useState([false, true, false]);
const all = items.every(Boolean);
const some = items.some(Boolean);

<Checkbox
  label="전체 선택"
  checked={all}
  indeterminate={!all && some}
  onChange={(e) => setItems(items.map(() => e.target.checked))}
/>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          서로 영향을 주지 않는 항목을 각각 켜고 끌 때 씁니다. 동의 여부,
          목록에서 여러 개 고르기가 그런 자리입니다. 여러 옵션 중 하나만 골라야
          하면 SegmentedButtons를 씁니다. 눌러서 바로 효과가 나는 설정은
          Switch가 어울립니다.
        </p>
      </Topic>
      <Topic title="값을 다루는 두 가지 방법">
        <p className={t.body} style={{ marginBottom: 12 }}>
          체크 상태에 따라 다른 화면을 보이거나 여러 상자를 연동해야 하면{' '}
          <code>checked</code>와 <code>onChange</code>를 함께 넘겨 부모가 값을
          쥡니다(제어).
        </p>
        <CodeBlock code={CONTROLLED} />
        <p className={t.body} style={{ margin: '16px 0 12px' }}>
          제출할 때만 값이 필요하면 <code>defaultChecked</code>로 처음 상태만
          주고 컴포넌트에 맡깁니다(비제어). <code>name</code>을 주면 폼 제출 때{' '}
          <code>FormData</code>로 읽을 수 있습니다.
        </p>
        <CodeBlock code={UNCONTROLLED} />
      </Topic>
      <Topic title="전체 선택">
        <p className={t.body} style={{ marginBottom: 12 }}>
          일부만 골라졌을 때 전체 선택 상자를 <code>indeterminate</code>로
          둡니다. 상자에 체크 표시 대신 가로선이 그려져 &quot;일부&quot;임이
          보입니다. 이 상태는 보이는 모양일 뿐이므로, 어떤 항목이 골라졌는지는
          부모가 세어 넘깁니다.
        </p>
        <CodeBlock code={SELECT_ALL} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          체크하면 상자가 살짝 움츠렸다 되튀면서 안쪽이 차오르고 체크 표시가
          그어집니다. 해제하면 표시가 거꾸로 지워집니다. 움직임 줄이기 설정을 켠
          환경에서는 애니메이션 없이 바로 바뀝니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        네이티브 <code>input type=&quot;checkbox&quot;</code>를 그대로 쓰므로
        Tab으로 들어가고 Space로 바꿉니다. 키보드로 포커스가 오면 상자에 포커스
        링이 생깁니다.
      </li>
      <li>
        <code>label</code>이 <code>label</code> 요소로 입력과 연결됩니다. 레이블
        글자를 눌러도 바뀌고 눌리는 영역은 최소 44px입니다.
      </li>
      <li>
        <code>indeterminate</code>는 입력의 <code>indeterminate</code> 속성으로
        전달됩니다. 체크 표시와 가로선은 장식이라 스크린 리더가 읽지 않습니다.
      </li>
      <li>
        <code>required</code>이면 입력에 <code>required</code> 속성이 붙고
        레이블 뒤에 <code>*</code>가 붙습니다.
      </li>
      <li>
        <code>error</code>이면 <code>aria-invalid</code>가 <code>true</code>가
        되고 도움말이나 에러 메시지가 보일 때는 <code>aria-describedby</code>로
        이어집니다.
      </li>
      <li>
        <code>disabled</code>이면 <code>aria-disabled</code>가 <code>true</code>
        가 되고 레이블까지 흐려집니다.
      </li>
      <li>
        레이블은 꼭 줍니다. 개발 중에 <code>label</code>이 비어 있으면 콘솔에
        오류가 나옵니다.
      </li>
    </ul>
  );
}

type Size = ComponentProps<typeof Checkbox>['size'];

export function CheckboxPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="Checkbox"
      lead={LEAD}
      stage={
        <Stage label="Checkbox 시연" script={SCRIPT}>
          <Checkbox
            // 입력은 보이지 않는 겹침이라 보이는 상자(다음 형제)를 대상으로 삼는다
            ref={(el) =>
              el?.nextElementSibling?.setAttribute('data-stage-target', 'box')
            }
            label={String(values.label)}
            size={values.size as Size}
            helperText={String(values.helperText) || undefined}
            errorMessage={String(values.errorMessage) || undefined}
            indeterminate={values.indeterminate === true}
            error={values.error === true}
            required={values.required === true}
            disabled={values.disabled === true}
          />
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({ component: 'Checkbox', values, defaults: DEFAULTS })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
