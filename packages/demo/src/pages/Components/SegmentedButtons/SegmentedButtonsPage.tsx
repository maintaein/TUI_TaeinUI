import { useState, type ComponentProps } from 'react';
import { SegmentedButtons } from '@taein-ui/core';
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
  '보기 방식, 정렬, 기간처럼 서로 겹치지 않는 선택지 중 하나를 고르는 자리에 둡니다.';

const OPTIONS = [
  { value: 'day', label: '일간' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
  { value: 'year', label: '연간' },
];

const OPTIONS_CODE = `const options = [
  { value: 'day', label: '일간' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
  { value: 'year', label: '연간' },
];`;

const CONTROLS: Control[] = [
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'fullWidth', kind: 'toggle' },
  { prop: 'disabled', kind: 'toggle' },
];

const INITIAL: Values = {
  size: 'lg',
  fullWidth: false,
  disabled: false,
};

const DEFAULTS: Values = {
  size: 'md',
};

// options와 aria-label은 필수라 조작판에는 없어도 코드에는 늘 나온다
const NOTATION = { options: { expr: 'options' } };

// 커서가 옵션을 차례로 눌러 표식이 한 칸, 두 칸을 미끄러지게 한다. 일간에서 시작해 주간(한 칸), 연간(두 칸), 월간(한 칸), 일간(두 칸)
const SCRIPT = (act: Act) => {
  for (const [target, rest] of [
    ['week', 1.1],
    ['year', 1.1],
    ['month', 1.1],
    ['day', 1.1],
  ] as const) {
    act.move(target);
    act.hover(target);
    act.wait(0.3);
    act.press(target);
    act.leave(target);
    act.wait(rest);
  }
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'options',
    type: 'SegmentedButtonOption[]',
    required: true,
    description:
      '옵션 목록. 옵션 하나는 { value, label, icon?, iconOnly?, disabled? }다',
  },
  {
    name: 'aria-label',
    type: 'string',
    description:
      '그룹의 이름. aria-label과 aria-labelledby 중 하나는 꼭 줘야 한다(없으면 타입 오류)',
  },
  {
    name: 'aria-labelledby',
    type: 'string',
    description: '그룹의 이름을 담은 요소의 id. aria-label 대신 쓴다',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: '크기. sm은 보이는 높이 36px, 누르는 영역은 44px이다',
  },
  {
    name: 'fullWidth',
    type: 'boolean',
    default: 'false',
    description: '부모 폭을 채운다',
  },
  {
    name: 'value',
    type: 'string',
    description: '선택된 값. onChange와 함께 넘겨 부모가 쥔다(제어)',
  },
  {
    name: 'onChange',
    type: '(value: string) => void',
    description: '선택이 바뀔 때 새 값을 받는다',
  },
  {
    name: 'defaultValue',
    type: 'string',
    description:
      '처음 선택값. 이후는 컴포넌트가 쥔다(비제어). 없으면 첫 옵션이다',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '전체를 선택할 수 없게 한다',
  },
];

const CONTROLLED = `const [period, setPeriod] = useState('week');

<SegmentedButtons
  aria-label="기간"
  options={options}
  value={period}
  onChange={setPeriod}
/>`;

const UNCONTROLLED = `<SegmentedButtons aria-label="정렬" options={options} defaultValue="month" />`;

const ICONS = `import { AlignLeft, AlignRight } from 'lucide-react';

const options = [
  { value: 'left', label: '왼쪽 정렬', icon: <AlignLeft />, iconOnly: true },
  { value: 'right', label: '오른쪽 정렬', icon: <AlignRight />, iconOnly: true },
  { value: 'locked', label: '고정', disabled: true },
];`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          보기 방식, 정렬, 기간 필터처럼 선택지가 둘에서 일곱 개쯤이고 하나만
          고르는 자리에 씁니다. 고르면 바로 적용되는 경우가 어울립니다. 선택지가
          많거나 여러 개를 고르는 자리에는 맞지 않습니다.
        </p>
      </Topic>
      <Topic title="옵션과 그룹 이름">
        <p className={t.body} style={{ marginBottom: 12 }}>
          선택지는 <code>options</code> 배열로 줍니다. 그룹이 무엇을 고르는
          자리인지는 <code>aria-label</code>이나 <code>aria-labelledby</code>로
          꼭 알립니다. 둘 다 없으면 타입 오류가 납니다. 옵션에는{' '}
          <code>icon</code>을 더할 수 있고, <code>iconOnly</code>로 아이콘만
          보여 줄 수도 있습니다. 이때도 <code>label</code>은 꼭 적습니다. 화면
          낭독이 그 글자를 읽습니다. 옵션 하나만 <code>disabled</code>로 꺼 둘
          수도 있습니다.
        </p>
        <CodeBlock code={ICONS} />
      </Topic>
      <Topic title="값을 다루는 두 가지 방법">
        <p className={t.body} style={{ marginBottom: 12 }}>
          선택에 따라 다른 내용을 보여 주거나 서버에 저장해야 하면{' '}
          <code>value</code>와 <code>onChange</code>를 함께 넘겨 부모가 값을
          쥡니다(제어).
        </p>
        <CodeBlock code={CONTROLLED} />
        <p className={t.body} style={{ margin: '16px 0 12px' }}>
          값을 따로 추적하지 않아도 되면 <code>defaultValue</code>로 처음 선택만
          주고 컴포넌트에 맡깁니다(비제어). 주지 않으면 첫 옵션이 선택됩니다.
        </p>
        <CodeBlock code={UNCONTROLLED} />
      </Topic>
      <Topic title="움직임">
        <p className={t.body}>
          선택이 바뀌면 파란 표식이 사라졌다 나타나지 않고 하나의 물체로
          미끄러집니다. 먼저 옛 칸과 새 칸을 함께 덮도록 늘어나고, 진행 방향의
          앞쪽 끝이 새 칸 끝에 앉은 뒤 뒤쪽 끝이 따라와 자리를 잡습니다. 먼
          칸으로 옮길수록 더 길게 늘어납니다. 처음 놓일 때는 움직이지 않고 바로
          앉습니다. 움직임 줄이기 설정을 켠 환경에서는 애니메이션 없이 바로 옮겨
          갑니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        컨테이너에 <code>role=&quot;radiogroup&quot;</code>이 붙고, 옵션은 안쪽{' '}
        <code>input[type=&quot;radio&quot;]</code>가 맡아 스크린 리더가 단일
        선택 그룹으로 읽습니다. 각 옵션의 <code>aria-checked</code>가 선택
        여부를 전달합니다.
      </li>
      <li>
        그룹 이름은 <code>aria-label</code>이나 <code>aria-labelledby</code>로
        줍니다. 없으면 타입 오류이므로 직접 채워야 합니다.
      </li>
      <li>
        Tab은 그룹에 한 번 들어가 선택된 옵션(선택이 없거나 꺼져 있으면 첫 활성
        옵션)에만 닿고, 한 번 더 누르면 그룹을 나갑니다.
      </li>
      <li>
        왼쪽·위쪽 화살표는 이전 옵션, 오른쪽·아래쪽 화살표는 다음 활성 옵션으로
        포커스와 선택을 함께 옮기고 끝에서는 처음으로 돕니다. Home과 End는 첫
        활성 옵션과 끝 활성 옵션으로, Space와 Enter는 선택합니다.
      </li>
      <li>
        키보드로 포커스가 오면 옵션에 포커스 링이 생기고, 마우스로 눌렀을 때는
        링이 켜지지 않습니다. <code>sm</code>도 누르는 영역은 44px입니다.
      </li>
      <li>
        <code>disabled</code>인 옵션은 <code>aria-disabled</code>가{' '}
        <code>true</code>가 되고 선택할 수 없으며 키보드 이동에서도 건너뜁니다.
      </li>
      <li>
        <code>iconOnly</code>를 써도 <code>label</code>은 꼭 줍니다. 보이지
        않아도 스크린 리더가 그 글자를 읽습니다.
      </li>
    </ul>
  );
}

type Size = ComponentProps<typeof SegmentedButtons>['size'];

export function SegmentedButtonsPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="SegmentedButtons"
      lead={LEAD}
      stage={
        <Stage label="SegmentedButtons 시연" script={SCRIPT}>
          {/* 옵션 라벨에 대상 이름을 붙이는 껍데기. 레이아웃에는 끼지 않는다 */}
          <div
            style={{ display: 'contents' }}
            ref={(el) =>
              el
                ?.querySelectorAll('label')
                .forEach((label, i) =>
                  label.setAttribute('data-stage-target', OPTIONS[i].value)
                )
            }
          >
            <SegmentedButtons
              aria-label="기간"
              options={OPTIONS}
              size={values.size as Size}
              fullWidth={values.fullWidth === true}
              disabled={values.disabled === true}
            />
          </div>
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'SegmentedButtons',
        values: { 'aria-label': '기간', options: true, ...values },
        defaults: DEFAULTS,
        notation: NOTATION,
      }).replace('\n\n<', `\n\n${OPTIONS_CODE}\n\n<`)}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
