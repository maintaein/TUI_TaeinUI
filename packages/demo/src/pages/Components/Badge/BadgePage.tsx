import { useState, type ComponentProps } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Badge, IconButton } from '@taein-ui/core';
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
  '읽지 않은 알림 수나 새 메시지처럼 작은 숫자와 상태를 알립니다. 숫자가 바뀌면 새 값이 밀려 들어옵니다.';

const CONTROLS: Control[] = [
  {
    prop: 'variant',
    kind: 'choice',
    options: ['primary', 'secondary', 'success', 'error', 'warning'],
  },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'max', kind: 'choice', options: ['9', '99', '999'] },
  { prop: 'dot', kind: 'toggle' },
];

const INITIAL: Values = {
  variant: 'error',
  size: 'lg',
  max: '99',
  dot: false,
};

const DEFAULTS: Values = {
  variant: 'primary',
  size: 'md',
  max: '99',
};

const START = 8;
const STEPS = 3;

// 커서가 늘리기 단추를 세 번 누르면 숫자가 아래에서 올라오며 바뀌고(9에서 10은 자릿수도 바뀐다),
// 줄이기 단추를 세 번 누르면 위에서 내려오며 처음 값으로 돌아온다
const SCRIPT = (act: Act) => {
  act.move('inc');
  act.hover('inc');
  act.wait(0.3);
  for (let i = 0; i < STEPS; i++) {
    act.press('inc');
    act.wait(0.7);
  }
  act.leave('inc');
  act.move('dec');
  act.hover('dec');
  act.wait(0.3);
  for (let i = 0; i < STEPS; i++) {
    act.press('dec');
    act.wait(0.7);
  }
  act.leave('dec');
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description:
      '배지에 보일 숫자나 글자. 숫자는 max를 넘으면 "99+"처럼 줄여 보인다. 0도 그대로 보이고, 비어 있으면(null, undefined, 빈 문자열) 아무것도 그리지 않는다. dot이면 무시한다',
  },
  {
    name: 'variant',
    type: "'primary' | 'secondary' | 'success' | 'error' | 'warning'",
    default: "'primary'",
    description: '색',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: '크기. 높이는 sm 16px, md 20px, lg 24px',
  },
  {
    name: 'max',
    type: 'number',
    default: '99',
    description: '숫자의 최댓값. 넘으면 "max+"로 보인다',
  },
  {
    name: 'dot',
    type: 'boolean',
    default: 'false',
    description: '글자 없이 8px 점만 그린다',
  },
  {
    name: 'aria-label',
    type: 'string',
    description:
      '점 배지의 이름. 주면 role="img"가 붙는다. 글자 배지는 글자가 이름이라 보통 필요 없다',
  },
];

const NUMBERS = `<Badge variant="error">{3}</Badge>             {/* 3 */}
<Badge variant="error">{250}</Badge>           {/* 99+ */}
<Badge variant="error" max={9}>{10}</Badge>    {/* 9+ */}
<Badge variant="success">NEW</Badge>           {/* 글자는 그대로 */}`;

const HIDE_ZERO = `{count > 0 && <Badge variant="error">{count}</Badge>}`;

const BELL = `<span style={{ position: 'relative', display: 'inline-flex' }}>
  <Bell size={24} />
  <span style={{ position: 'absolute', top: -4, right: -8 }}>
    <Badge variant="error" size="sm">{3}</Badge>
  </span>
</span>`;

const DOT = `<Badge dot variant="error" aria-label="새 알림" />`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          읽지 않은 알림 수, 새 메시지, 상태 라벨처럼 작은 정보를 다른 요소 옆에
          붙여 알릴 때 씁니다. 사용자가 직접 고르거나 지울 라벨이면{' '}
          <code>Chip</code>이 맞습니다.
        </p>
      </Topic>
      <Topic title="숫자와 글자">
        <p className={t.body} style={{ marginBottom: 12 }}>
          숫자는 <code>max</code>를 넘으면 <code>99+</code>처럼 줄어 레이아웃이
          늘어나지 않습니다. 숫자가 아닌 글자는 그대로 보입니다. 0도 그대로
          &quot;0&quot;으로 보이므로 숨기려면 쓰는 쪽에서 조건을 겁니다.
        </p>
        <CodeBlock code={NUMBERS} />
        <p className={t.body} style={{ margin: '12px 0' }}>
          0일 때 숨기는 방법입니다.
        </p>
        <CodeBlock code={HIDE_ZERO} />
      </Topic>
      <Topic title="아이콘에 붙이기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          Badge는 자리를 정하지 않고 제 크기만 그립니다. 아이콘 모서리에
          붙이려면 부모에 <code>position: relative</code>를 주고 Badge를 감싼
          요소를 절대 위치로 놓습니다.
        </p>
        <CodeBlock code={BELL} />
      </Topic>
      <Topic title="점">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>dot</code>은 숫자 없이 새 소식이 있다는 사실만 알립니다. 스크린
          리더에는 이름이 필요하므로 <code>aria-label</code>을 줍니다.
        </p>
        <CodeBlock code={DOT} />
      </Topic>
      <Topic title="값이 바뀔 때">
        <p className={t.body}>
          표시된 값이 바뀌면 새 값이 들어오고 헌 값이 나갑니다. 값이 늘면 새
          값이 아래에서 올라오고 헌 값은 위로 빠집니다. 줄면 새 값이 위에서
          내려오고 헌 값은 아래로 빠집니다. 새 값은 200ms, 헌 값은 130ms
          걸립니다. 표시된 글자가 같으면(예: 250에서 300, 둘 다 99+) 움직이지
          않습니다. 움직임 줄이기 설정을 켠 환경에서는 바로 바뀝니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        글자 배지는 안의 글자가 그대로 이름입니다. 버튼 안에 두면 버튼 이름의
        일부로 읽힙니다.
      </li>
      <li>
        <code>dot</code>에 <code>aria-label</code>을 주면{' '}
        <code>role=&quot;img&quot;</code>와 그 이름이 붙습니다. 주지 않으면{' '}
        <code>aria-hidden=&quot;true&quot;</code>인 장식이 됩니다.
      </li>
      <li>
        값이 바뀔 때 읽히게 하려면 <code>role=&quot;status&quot;</code>(또는{' '}
        <code>aria-live</code>)를 직접 줍니다. 값이 바뀌어도 루트는 다시
        마운트되지 않아 라이브 영역으로 쓸 수 있습니다. 나가는 헌 값은{' '}
        <code>aria-hidden</code>이라 다시 읽히지 않습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 숫자만 읽히면 무엇의 개수인지 알 수 없으므로
        알림처럼 쓸 때는 <code>role</code>과 <code>aria-label</code>을 함께
        줍니다.
      </li>
      <li>
        글자색은 변형마다 배경과의 대비를 지키도록 정해져 있습니다.{' '}
        <code>success</code>와 <code>warning</code>은 밝은 배경이라 어두운
        글자를 씁니다.
      </li>
    </ul>
  );
}

type Variant = ComponentProps<typeof Badge>['variant'];
type Size = ComponentProps<typeof Badge>['size'];

export function BadgePage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [count, setCount] = useState(START);
  const dot = values.dot === true;

  return (
    <DetailLayout
      name="Badge"
      lead={LEAD}
      stage={
        <Stage label="Badge 시연" script={SCRIPT}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <IconButton
              data-stage-target="dec"
              aria-label="줄이기"
              buttonStyle="weak"
              onClick={() => setCount((c) => Math.max(0, c - 1))}
            >
              <Minus />
            </IconButton>
            {/* zoom: 20px짜리 배지가 무대에서 작아 보이지 않게 키운다. 코드의 크기는 그대로다 */}
            <div style={{ zoom: 2.5, minWidth: 56, display: 'grid' }}>
              <Badge
                variant={values.variant as Variant}
                size={values.size as Size}
                max={Number(values.max)}
                dot={dot}
                aria-label={dot ? '새 알림' : undefined}
              >
                {count}
              </Badge>
            </div>
            <IconButton
              data-stage-target="inc"
              aria-label="늘리기"
              buttonStyle="weak"
              onClick={() => setCount((c) => c + 1)}
            >
              <Plus />
            </IconButton>
          </div>
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Badge',
        values: dot
          ? { ...values, 'aria-label': '새 알림' }
          : { children: '{count}', ...values },
        defaults: DEFAULTS,
      }).replace(/max="(\d+)"/, 'max={$1}')}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
