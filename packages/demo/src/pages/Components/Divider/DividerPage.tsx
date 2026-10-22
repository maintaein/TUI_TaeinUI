import { useState, type ComponentProps } from 'react';
import { Divider } from '@taein-ui/core';
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
import { Stage } from '../../../components/Stage';

const LEAD =
  '콘텐츠 사이에 선을 긋습니다. 가로 선은 섹션을 나누고 세로 선은 한 줄에 놓인 메뉴를 나눕니다. 가운데에 글자를 넣을 수도 있습니다.';

const CONTROLS: Control[] = [
  { prop: 'orientation', kind: 'choice', options: ['horizontal', 'vertical'] },
  { prop: 'variant', kind: 'choice', options: ['solid', 'dashed', 'dotted'] },
  { prop: 'spacing', kind: 'choice', options: ['sm', 'md', 'lg'] },
  { prop: 'textAlign', kind: 'choice', options: ['left', 'center', 'right'] },
  { prop: 'children', kind: 'toggle' },
];

const INITIAL: Values = {
  orientation: 'horizontal',
  variant: 'solid',
  spacing: 'md',
  textAlign: 'center',
  children: false,
};

const DEFAULTS: Values = {
  orientation: 'horizontal',
  variant: 'solid',
  spacing: 'md',
  textAlign: 'center',
};

const PROPS: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description:
      '선 가운데에 놓을 글자. 있으면 선이 글자 양옆의 두 토막이 된다',
  },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
    description: '방향. 세로는 가로 flex 줄 안에서 줄 높이를 채운다',
  },
  {
    name: 'variant',
    type: "'solid' | 'dashed' | 'dotted'",
    default: "'solid'",
    description: '선 모양. 글자가 있으면 글자 양옆의 두 선에 적용된다',
  },
  {
    name: 'spacing',
    type: "'sm' | 'md' | 'lg'",
    default: "'md'",
    description: '선 바깥 여백. 가로는 위아래, 세로는 좌우로 8, 16, 24px',
  },
  {
    name: 'textAlign',
    type: "'left' | 'center' | 'right'",
    default: "'center'",
    description: '글자가 있을 때 글자의 자리',
  },
  {
    name: 'aria-label',
    type: 'string',
    description:
      '구분선 이름. 글자가 문자열이나 숫자면 그 글자가 이름이 되고 이 값을 주면 그것이 이긴다',
  },
];

const WITH_TEXT = `<Divider>또는</Divider>
<Divider textAlign="left">최근 항목</Divider>`;

const VERTICAL = `<div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
  <span>메뉴 A</span>
  <Divider orientation="vertical" />
  <span>메뉴 B</span>
</div>`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          성격이 다른 내용 사이나 한 줄에 놓인 메뉴 사이를 나눌 때 씁니다.
          간격만으로 나뉘는 곳에는 쓰지 않고 구분선을 연달아 놓지 않습니다.
          카드나 목록 안에서 이미 나뉜 곳을 한 번 더 나누지도 않습니다.
        </p>
      </Topic>
      <Topic title="글자가 있는 구분선">
        <p className={t.body} style={{ marginBottom: 12 }}>
          문자열이나 숫자를 <code>children</code>으로 주면 선이 글자 양옆으로
          갈라집니다. 로그인 폼의 &quot;또는&quot; 같은 곳에 쓰고{' '}
          <code>textAlign</code>으로 글자의 자리를 고릅니다. 글자가 있으면 선이
          두 토막이 되고 <code>variant</code>는 두 토막 모두에 적용됩니다.
        </p>
        <CodeBlock code={WITH_TEXT} />
      </Topic>
      <Topic title="세로 구분선">
        <p className={t.body} style={{ marginBottom: 12 }}>
          세로 선은 가로 flex 줄 안에 두면 줄의 높이를 채웁니다. 블록 부모
          안에서는 높이가 0이 되어 보이지 않으니, 그럴 때는 구분선에{' '}
          <code>height</code>를 직접 줍니다. <code>spacing</code>은 이때 좌우
          여백이 됩니다.
        </p>
        <CodeBlock code={VERTICAL} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        <code>role=&quot;separator&quot;</code>와 <code>aria-orientation</code>
        으로 방향이 있는 구분선으로 읽힙니다.
      </li>
      <li>
        구분선의 이름은 안쪽 글자에서 계산되지 않아 일부 보조 기술이 글자를 읽지
        않습니다. 그래서 글자가 문자열이나 숫자면 그 글자를{' '}
        <code>aria-label</code>로 주고 안쪽 글자는 <code>aria-hidden</code>으로
        가려 두 번 읽히지 않게 합니다.
      </li>
      <li>
        직접 <code>aria-label</code>을 주면 그 값이 이기고 안쪽 글자도 그대로
        읽힙니다. 글자 자리에 요소를 넣으면 이름을 만들지 않습니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 글자 자리에 요소를 넣을 때는{' '}
        <code>aria-label</code>로 이름을 줍니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 내용을 나누는 뜻이 없는 장식 선에는{' '}
        <code>aria-hidden=&quot;true&quot;</code>를 줍니다.
      </li>
    </ul>
  );
}

type Orientation = ComponentProps<typeof Divider>['orientation'];
type Variant = ComponentProps<typeof Divider>['variant'];
type Spacing = ComponentProps<typeof Divider>['spacing'];
type TextAlign = ComponentProps<typeof Divider>['textAlign'];

// 이 컴포넌트에는 시연할 움직임이 없다(M5에서 마운트 모션을 지웠다). 대본 없이 조작판 값만 바꿔 보인다
export function DividerPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const vertical = values.orientation === 'vertical';
  const text = values.children === true ? '또는' : undefined;

  const divider = (
    <Divider
      orientation={values.orientation as Orientation}
      variant={values.variant as Variant}
      spacing={values.spacing as Spacing}
      textAlign={values.textAlign as TextAlign}
    >
      {text}
    </Divider>
  );

  return (
    <DetailLayout
      name="Divider"
      lead={LEAD}
      stage={
        <Stage label="Divider 미리보기">
          {vertical ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '9rem',
              }}
            >
              <span>메뉴 A</span>
              {divider}
              <span>메뉴 B</span>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <p style={{ margin: 0 }}>첫 번째 섹션입니다.</p>
              {divider}
              <p style={{ margin: 0 }}>두 번째 섹션입니다.</p>
            </div>
          )}
        </Stage>
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Divider',
        values: {
          orientation: values.orientation,
          variant: values.variant,
          spacing: values.spacing,
          textAlign: values.textAlign,
          ...(text && { children: text }),
        },
        defaults: DEFAULTS,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
