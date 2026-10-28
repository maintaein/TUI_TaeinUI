import { useContext, useState } from 'react';
import { LuminousFlow } from '@taein-ui/core';
import {
  Customize,
  type Control,
  type Values,
} from '../../../components/Customize';
import { DetailLayout } from '../../../components/DetailLayout';
import * as t from '../../../components/DocText';
import type { PropDefinition } from '../../../components/PropsTable';
import { MiniFrozen, Stage, type DemoProps } from '../../../components/Stage';
import * as styles from './LuminousFlowPage.css';

const LEAD =
  '굽이치는 물길 안을 빛줄기가 흐르는 어두운 배경. 부모 상자를 채우고, 스크롤하면 흐름이 빨라집니다. 스스로 흐르기 때문에 무대의 일시정지 단추로 멈출 수 있습니다.';

const CONTROLS: Control[] = [
  { prop: 'children', kind: 'text', label: '배경 위에 얹는 글자' },
];

const INITIAL: Values = { children: '빛 물줄기' };

const PROPS: PropDefinition[] = [
  {
    name: 'paused',
    type: 'boolean',
    default: 'false',
    description:
      'true면 흐름을 멈추고 지금 장면을 남깁니다. 크기나 스크롤 구간이 바뀌면 그 장면을 한 번 다시 그립니다. false로 돌아오면 이어서 흐릅니다',
  },
  {
    name: 'scrollScene',
    type: 'boolean',
    default: 'false',
    description:
      '켜면 상자 높이를 긴 물길 한 장면에 맞추고 창에 보이는 구간만 그립니다. 끄면 물길의 맨 위 구간이 상자에 꽉 차게 그려집니다. 흐름 속도는 이 값과 상관없이 창 스크롤에서 읽습니다',
  },
  {
    name: 'className',
    type: 'string',
    description: '루트에 더할 CSS 클래스. 크기는 부모 상자를 따릅니다',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLDivElement>',
    description: '루트의 ref',
  },
];

/** 무대 조각. 무대 상자 전체를 배경으로 채우고 그 위에 글자를 얹는다. 일시정지 단추와 "움직임 멈춤"이 paused를 켠다 */
export function LuminousFlowDemo({ values = INITIAL, mini }: DemoProps) {
  // 스스로 흐르는 rAF 루프라 CSS data-frozen으로는 서지 않는다. 두 멈춤 경로를 모두 paused prop으로 잇는다
  const [userPaused, setUserPaused] = useState(false);
  const paused = (useContext(MiniFrozen) && !!mini) || userPaused;

  return (
    <Stage
      mini={mini}
      label="LuminousFlow 미리보기"
      className={styles.stage}
      onUserPause={setUserPaused}
    >
      <LuminousFlow paused={paused} />
      <p className={styles.line}>{String(values.children)}</p>
    </Stage>
  );
}

function Usage() {
  return (
    <p className={t.body}>
      어두운 섹션이나 첫 화면 뒤에 깝니다. 부모 상자를 채우므로(
      <code>position: absolute; inset: 0</code>) 부모를{' '}
      <code>position: relative</code> 같은 기준으로 만들고, 얹을 내용은 그 위에{' '}
      <code>position: relative</code>로 올립니다. 바탕은 검정이고 색은 바꿀 수
      없습니다.
    </p>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        장식입니다. <code>aria-hidden</code>이고 포인터 입력을 받지 않아 뒤에
        깔려도 위 내용의 읽기와 조작을 막지 않습니다. 위에 얹는 글자는 어두운
        바탕과 4.5:1 이상의 대비를 지켜야 합니다.
      </li>
      <li>
        흐름은 5초를 넘게 저절로 움직이므로 멈출 수 있어야 합니다(WCAG 2.2.2).{' '}
        <code>paused</code>를 버튼이나 설정에 이어 주세요. 이 사이트의 무대
        일시정지 단추와 &quot;움직임 멈춤&quot;이 그렇게 합니다.
      </li>
      <li>탭이 숨겨지거나 화면 밖에 있으면 그리기를 멈춥니다.</li>
      <li>
        CSP를 엄격하게 두었다면 <code>img-src blob:</code>이 필요합니다. 빛번짐
        층을 Blob 이미지로 만들어 캔버스에 옮기기 때문입니다.
      </li>
      <li>움직임 줄이기에서는 흐르지 않는 정지 장면으로 보입니다.</li>
    </ul>
  );
}

export function LuminousFlowPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="LuminousFlow"
      lead={LEAD}
      stage={<LuminousFlowDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={`import { LuminousFlow } from '@taein-ui/core';

<section style={{ position: 'relative' }}>
  <LuminousFlow paused={paused} />
  <h2 style={{ position: 'relative', color: '#fff' }}>
    ${String(values.children)}
  </h2>
</section>`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
