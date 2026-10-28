import { useCallback, useState } from 'react';
import { Button, SloshGauge, Slider } from '@taein-ui/core';
import { CodeBlock } from '../../../components/CodeBlock';
import { DetailLayout, Topic, Topics } from '../../../components/DetailLayout';
import * as t from '../../../components/DocText';
import type { PropDefinition } from '../../../components/PropsTable';
import { Stage, type Act, type DemoProps } from '../../../components/Stage';

const LEAD =
  '값을 통 안의 물높이로 보이는 게이지. 값이 바뀌면 물이 크게 출렁였다가 잔잔해집니다. 출렁임은 값이 바뀔 때만 생기고 저절로 되풀이되지 않습니다.';

const PROPS: PropDefinition[] = [
  {
    name: 'value',
    type: 'number',
    required: true,
    description: '현재 값. min과 max 밖이면 잘라 그립니다',
  },
  {
    name: 'min',
    type: 'number',
    default: '0',
    description: '범위의 아래 끝',
  },
  {
    name: 'max',
    type: 'number',
    default: '100',
    description: '범위의 위 끝',
  },
  {
    name: 'label',
    type: 'string',
    required: true,
    description: '접근 가능한 이름이자 통 아래에 보이는 이름표',
  },
  {
    name: 'valueText',
    type: 'string',
    description: '보이는 값 글이자 aria-valuetext. 없으면 백분율("60%")입니다',
  },
  {
    name: 'className',
    type: 'string',
    description: '루트에 더할 CSS 클래스. 폭은 부모가 정합니다',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLDivElement>',
    description: '루트의 ref. 그 밖의 네이티브 div 속성도 루트로 갑니다',
  },
];

// 통 크기는 10GB를 기준으로 한 저장 공간 글로 보입니다
const storageText = (value: number) => `${value / 10}GB / 10GB`;

const STEPS = [90, 20, 60];

// 커서가 값 단추를 차례로 눌러 90, 20, 60으로 바꾼다. 누른 뒤 출렁임이 잔잔해지는 1.5초보다 길게 머문다
const SCRIPT = (act: Act) => {
  for (const v of STEPS) {
    act.move(`v${v}`);
    act.wait(0.3);
    act.press(`v${v}`);
    act.wait(2.2);
  }
  act.home();
  act.wait(0.4);
};

interface SloshGaugeDemoProps extends DemoProps {
  /** 값을 바깥(조작판의 슬라이더)이 쥘 때. 없으면 무대가 스스로 쥔다 */
  value?: number;
  onValueChange?: (value: number) => void;
}

/** 무대 조각. 대본의 커서가 값 단추를 눌러 물이 출렁이게 하고, 마우스를 올리면 직접 눌러 볼 수 있다 */
export function SloshGaugeDemo({
  mini,
  value: controlled,
  onValueChange,
}: SloshGaugeDemoProps) {
  const [own, setOwn] = useState(60);
  const value = controlled ?? own;
  const set = useCallback(
    (v: number) => {
      setOwn(v);
      onValueChange?.(v);
    },
    [onValueChange]
  );

  return (
    <Stage mini={mini} label="SloshGauge 미리보기" script={SCRIPT}>
      {/* 미니는 카드 칸이 낮고 좁아 통을 줄이고 단추를 옆에 세우며 값 글은 짧은 백분율로 둔다 */}
      <div
        style={
          mini
            ? { display: 'flex', gap: 16, alignItems: 'center' }
            : { display: 'grid', gap: 12, justifyItems: 'center' }
        }
      >
        <SloshGauge
          style={mini ? { width: '4.5rem' } : undefined}
          value={value}
          label="저장 공간"
          valueText={mini ? undefined : storageText(value)}
        />
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexDirection: mini ? 'column' : 'row',
          }}
        >
          {[20, 60, 90].map((v) => (
            <Button
              key={v}
              variant="light"
              size="sm"
              data-stage-target={`v${v}`}
              onClick={() => set(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>
    </Stage>
  );
}

const USE = `<SloshGauge
  value={used}
  max={10}
  label="저장 공간"
  valueText={\`\${used}GB / 10GB\`}
/>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          저장 공간, 할당량, 진행률처럼 한도 안에서 얼마나 찼는지를 보여 줄 때
          씁니다. 조작하는 요소가 아니라 값을 알리는 표시 요소입니다.
        </p>
      </Topic>
      <Topic title="출렁임의 규칙">
        <p className={t.body} style={{ marginBottom: 12 }}>
          출렁임은 값이 바뀔 때만 생깁니다. 바뀐 양에 비례해 커지되 통 높이의
          8%에서 잘리고, 마지막 변경 뒤 1.5초 안에 수면이 평평해집니다. 다운로드
          진행률처럼 값이 자주 바뀌어도 출렁임이 쌓여 커지지 않습니다. 도중에
          값이 바뀌어도 수위는 튀지 않고 그 자리에서 새 값으로 이어집니다.
        </p>
        <CodeBlock code={USE} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        루트가 <code>role=&quot;meter&quot;</code>이고{' '}
        <code>aria-valuenow</code>, <code>aria-valuemin</code>,{' '}
        <code>aria-valuemax</code>, <code>aria-valuetext</code>를 가집니다.
        이름은 보이는 <code>label</code>이 맡습니다(
        <code>aria-labelledby</code>).
      </li>
      <li>
        <code>aria-valuenow</code>는 물이 차오르기를 기다리지 않고 값이 바뀌는
        즉시 새 값입니다.
      </li>
      <li>
        <code>valueText</code>가 없으면 백분율을 읽습니다. 단위가 있는 값은{' '}
        <code>valueText</code>로 &quot;6GB / 10GB&quot;처럼 넘기세요.
      </li>
      <li>통과 물은 aria-hidden 장식입니다.</li>
      <li>
        통 테두리와 물은 바탕과 3:1 이상, 값 글은 4.5:1 이상의 대비입니다.
      </li>
      <li>
        출렁임은 값이 바뀔 때의 반응이고 되풀이되지 않으므로 멈춤 prop이
        필요하지 않습니다(WCAG 2.2.2).
      </li>
      <li>움직임 줄이기에서는 물이 출렁이지 않고 높이만 바뀝니다.</li>
    </ul>
  );
}

export function SloshGaugePage() {
  const [value, setValue] = useState(60);

  return (
    <DetailLayout
      name="SloshGauge"
      lead={LEAD}
      stage={<SloshGaugeDemo value={value} onValueChange={setValue} />}
      customize={
        <Slider
          label="value"
          min={0}
          max={100}
          step={1}
          showValue
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      }
      code={`import { SloshGauge } from '@taein-ui/core';

<SloshGauge
  value={${value}}
  label="저장 공간"
  valueText="${storageText(value)}"
/>`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
