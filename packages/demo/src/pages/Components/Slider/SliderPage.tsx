import { useState, type ComponentProps } from 'react';
import { Slider } from '@taein-ui/core';
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
  '볼륨, 밝기, 가격 범위처럼 연속된 값을 손잡이를 끌어 고르는 자리에 둡니다.';

const CONTROLS: Control[] = [
  { prop: 'label', kind: 'text' },
  { prop: 'variant', kind: 'choice', options: ['default', 'bar', 'wake'] },
  { prop: 'helperText', kind: 'text' },
  { prop: 'showValue', kind: 'toggle' },
  { prop: 'showThumbValue', kind: 'toggle' },
  { prop: 'required', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
];

const INITIAL: Values = {
  label: '볼륨',
  variant: 'default',
  helperText: '',
  showValue: true,
  showThumbValue: true,
  required: false,
  disabled: false,
};

const DEFAULTS: Values = {
  variant: 'default',
  helperText: '',
};

// 시연이 시작하는 값. 코드에도 같은 값으로 적는다
const START = 30;
const NOTATION = { defaultValue: { expr: String(START) } };

// 커서가 손잡이로 가서 올라타(손잡이가 부풀고 라인이 두꺼워짐) 머문 뒤, 잡고 끌어 올렸다 놓고, 잠시 뒤 반대로 끌어 내린다
// 끌기는 값을 코드로 옮기며 input 이벤트를 보낸다. core는 값이 바뀌는 것과 pointerdown·pointerup만 보므로 손으로 끄는 것과 같은 길이다
const SCRIPT = (act: Act) => {
  act.move('slider');
  act.hover('slider');
  act.wait(0.8);
  act.drag('slider', 85, 1.6);
  act.wait(0.9);
  act.drag('slider', 25, 1.6);
  act.wait(0.7);
  act.leave('slider');
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description: '슬라이더의 이름. 스크린 리더가 읽는다',
  },
  {
    name: 'variant',
    type: "'default' | 'bar' | 'wake'",
    default: "'default'",
    description:
      '모양. default는 라인과 머리, bar는 머리 없이 채움 막대, wake는 눈금 막대로 나뉜 라인이다',
  },
  {
    name: 'min',
    type: 'number',
    default: '0',
    description: '최소값',
  },
  {
    name: 'max',
    type: 'number',
    default: '100',
    description: '최대값',
  },
  {
    name: 'step',
    type: 'number',
    default: '1',
    description: '한 번에 바뀌는 크기',
  },
  {
    name: 'value',
    type: 'number',
    description: '현재 값. onChange와 함께 넘겨 부모가 쥔다(제어)',
  },
  {
    name: 'defaultValue',
    type: 'number',
    default: '0',
    description: '처음 값. 이후는 컴포넌트가 쥔다(비제어)',
  },
  {
    name: 'onChange',
    type: 'ChangeEventHandler<HTMLInputElement>',
    description: '값이 바뀔 때 부른다. 값은 e.target.value에 문자열로 온다',
  },
  {
    name: 'showValue',
    type: 'boolean',
    default: 'false',
    description: '레이블 옆에 현재 값을 보인다',
  },
  {
    name: 'showThumbValue',
    type: 'boolean',
    default: 'false',
    description:
      '잡고 끄는 동안 머리 위에 값을 띄운다. 머리가 양 끝에 가면 레이블, showValue 값과 겹칠 수 있다',
  },
  {
    name: 'helperText',
    type: 'string',
    description: '아래 도움말',
  },
  {
    name: 'marks',
    type: 'SliderMark[]',
    description: '트랙 아래 눈금 표시. SliderMark는 { value, label }이다',
  },
  {
    name: 'trackColor',
    type: 'string',
    description: '채움 색. CSS 색 값을 준다',
  },
  {
    name: 'required',
    type: 'boolean',
    default: 'false',
    description: '필수 항목. 레이블 뒤에 *가 붙는다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '잡거나 키로 바꿀 수 없게 한다',
  },
];

const RANGE = `<Slider
  label="가격"
  min={0}
  max={1000}
  step={50}
  showValue
  helperText="50만원 단위로 조절됩니다"
  marks={[
    { value: 0, label: '0' },
    { value: 500, label: '500' },
    { value: 1000, label: '1000' },
  ]}
/>`;

const CONTROLLED = `const [volume, setVolume] = useState(30);

<Slider
  label="볼륨"
  value={volume}
  onChange={(e) => setVolume(Number(e.target.value))}
/>`;

const UNCONTROLLED = `<Slider label="밝기" name="brightness" defaultValue={70} />`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          볼륨, 밝기, 가격 범위처럼 범위 안에서 연속으로 바꾸고 정확한 숫자보다
          대략의 위치가 중요한 값에 씁니다. 정확한 숫자를 입력받아야 하면{' '}
          <code>NumericSpinner</code>가, 두세 개의 선택지 중 하나를 고르는
          자리에는 <code>SegmentedButtons</code>가 맞습니다.
        </p>
      </Topic>
      <Topic title="범위와 단위">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>min</code>, <code>max</code>, <code>step</code>으로 범위와
          단위를 정합니다. 현재 값은 <code>showValue</code>로 보여 주고 단위가
          1이 아니면 <code>helperText</code>로 알려 줍니다. <code>marks</code>로
          기준점을 트랙 아래에 표시하고 <code>trackColor</code>로 채움 색을 바꿀
          수 있습니다.
        </p>
        <CodeBlock code={RANGE} />
      </Topic>
      <Topic title="값을 다루는 두 가지 방법">
        <p className={t.body} style={{ marginBottom: 12 }}>
          값을 바로 다른 곳에 반영해야 하면 <code>value</code>와{' '}
          <code>onChange</code>를 함께 넘겨 부모가 값을 쥡니다(제어).{' '}
          <code>onChange</code>는 입력 이벤트를 받으므로 숫자는{' '}
          <code>Number(e.target.value)</code>로 꺼냅니다.
        </p>
        <CodeBlock code={CONTROLLED} />
        <p className={t.body} style={{ margin: '16px 0 12px' }}>
          값을 따로 추적하지 않아도 되면 <code>defaultValue</code>로 처음 값만
          주고 컴포넌트에 맡깁니다(비제어). <code>name</code>을 주면 폼 제출 때
          값이 함께 갑니다.
        </p>
        <CodeBlock code={UNCONTROLLED} />
      </Topic>
      <Topic title="모양 세 가지">
        <p className={t.body}>
          <code>default</code>는 가는 라인 위에 둥근 머리가 있는 기본
          모양입니다. <code>bar</code>는 머리 없이 채움 막대 자체가 값입니다.{' '}
          <code>wake</code>는 라인이 눈금 막대로 나뉘어 값이 바뀔 때 막대가
          물결처럼 솟았다 가라앉습니다. 모양은 조작판의 <code>variant</code>로
          바꿔 볼 수 있습니다.
        </p>
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          마우스를 올리면 라인이 두꺼워지고 머리가 부풉니다. 터치와 펜에서는
          일어나지 않습니다. 끌면 머리 둘레의 라인이 손의 속도에 비례해 부풀어
          물결치고 멈추면 매끈해집니다. <code>showThumbValue</code>를 켜면 잡고
          있는 동안 머리 위에 값이 뜹니다. 키보드로 조작하면 잡은 것으로 보고
          마지막 키 입력 뒤 0.5초가 지나면 놓은 것으로 봅니다. 움직임 줄이기
          설정을 켠 환경에서는 물결과 두께 변화 없이 값만 바뀝니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>input[type=&quot;range&quot;]</code> 위에 만들어져 스크린 리더가{' '}
        <code>slider</code>로 읽습니다. <code>label</code>이{' '}
        <code>aria-label</code>로 붙어 무엇을 조절하는지 전달합니다.
      </li>
      <li>
        <code>aria-valuemin</code>, <code>aria-valuemax</code>,{' '}
        <code>aria-valuenow</code>에 최소값, 최대값, 현재 값이 담기고 값이 바뀔
        때마다 갱신됩니다.
      </li>
      <li>
        키보드로 조절합니다. 화살표 키는 <code>step</code>만큼, Home과 End는
        최소값과 최대값으로 옮깁니다. 키보드로 포커스가 오면 머리에 포커스 링이
        생깁니다(<code>bar</code>는 트랙 둘레).
      </li>
      <li>
        <code>helperText</code>가 있으면 <code>aria-describedby</code>로 이어져
        슬라이더에 들어갈 때 함께 읽힙니다.
      </li>
      <li>
        <code>required</code>이면 입력에 <code>required</code> 속성이 붙고
        레이블 뒤에 <code>*</code>가 붙습니다.
      </li>
      <li>
        <code>disabled</code>이면 <code>aria-disabled</code>가 <code>true</code>
        가 되고 잡거나 키로 바꿀 수 없습니다.
      </li>
      <li>
        레이블은 꼭 줍니다. &quot;볼륨&quot;처럼 무엇을 조절하는지 구체적으로
        적고 단위가 1이 아닐 때는 <code>helperText</code>로 알립니다.
      </li>
    </ul>
  );
}

type Variant = ComponentProps<typeof Slider>['variant'];

export function SliderPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="Slider"
      lead={LEAD}
      stage={
        <Stage label="Slider 시연" script={SCRIPT}>
          <Slider
            // 대본의 커서와 끌기는 보이지 않는 range 입력을 대상으로 삼는다
            ref={(el) => el?.setAttribute('data-stage-target', 'slider')}
            label={String(values.label)}
            variant={values.variant as Variant}
            defaultValue={START}
            helperText={String(values.helperText) || undefined}
            showValue={values.showValue === true}
            showThumbValue={values.showThumbValue === true}
            required={values.required === true}
            disabled={values.disabled === true}
          />
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Slider',
        values: { ...values, defaultValue: true },
        defaults: DEFAULTS,
        notation: NOTATION,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
