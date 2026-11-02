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
  '굽이치는 물길을 따라 빛이 흐르는 어두운 배경입니다. 상자가 길수록 굽이가 늘고, 스크롤하면 흐름이 빨라집니다. 스스로 흐르므로 무대의 일시정지 단추로 멈출 수 있습니다.';

// 길이 단계. 키는 LuminousFlowPage.css.ts의 length 변형과 같다
const LENGTHS = {
  짧게: 'short',
  보통: 'normal',
  길게: 'long',
  '아주 길게': 'longest',
} as const;

const CONTROLS: Control[] = [
  { prop: 'children', kind: 'text', label: '배경 위에 얹는 글자' },
  { prop: '길이', kind: 'choice', options: Object.keys(LENGTHS) },
];

const INITIAL: Values = { children: '빛 물줄기', 길이: '짧게' };

const PROPS: PropDefinition[] = [
  {
    name: 'paused',
    type: 'boolean',
    default: 'false',
    description:
      'true면 흐름을 멈추고 지금 장면을 남깁니다. 크기나 보이는 구간이 바뀌면 그 장면을 한 번 다시 그립니다. false로 돌아오면 이어서 흐릅니다',
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

/**
 * 무대 조각. 상세 무대는 스크롤 상자이고 그 안의 물길 상자가 길이 단계를 따른다(맨 아래까지 내려가 마감 굽이를 볼 수 있다).
 * 카드 속 미니는 늘 짧은 상자 하나다. 일시정지 단추와 "움직임 멈춤"이 paused를 켠다
 */
export function LuminousFlowDemo({ values = INITIAL, mini }: DemoProps) {
  // 스스로 흐르는 rAF 루프라 CSS data-frozen으로는 서지 않는다. 두 멈춤 경로를 모두 paused prop으로 잇는다
  const [userPaused, setUserPaused] = useState(false);
  const paused = (useContext(MiniFrozen) && !!mini) || userPaused;
  const length = LENGTHS[values['길이'] as keyof typeof LENGTHS] ?? 'short';

  return (
    <Stage
      mini={mini}
      label="LuminousFlow 미리보기"
      className={styles.stage}
      onUserPause={setUserPaused}
    >
      {mini ? (
        <>
          <LuminousFlow paused={paused} />
          <p className={styles.line}>{String(values.children)}</p>
        </>
      ) : (
        <div
          className={styles.scroller}
          role="group"
          aria-label="물줄기 스크롤 상자"
          // 스크롤 상자는 키보드로 스크롤할 수 있어야 한다(axe scrollable-region-focusable)
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          <div className={`${styles.flowBox} ${styles.length[length]}`}>
            <LuminousFlow paused={paused} />
            <div className={styles.top}>
              <p className={styles.line}>{String(values.children)}</p>
            </div>
          </div>
        </div>
      )}
    </Stage>
  );
}

function Usage() {
  return (
    <p className={t.body}>
      어두운 섹션이나 첫 화면 뒤에 깝니다. 부모 상자를 채우므로(
      <code>position: absolute; inset: 0</code>) 부모를{' '}
      <code>position: relative</code> 같은 기준으로 만들고, 얹을 내용은 그 위에{' '}
      <code>position: relative</code>로 올립니다. 물길의 길이는 상자 높이가
      정합니다. 상자가 길수록 굽이가 늘어나고 마지막 굽이는 굽이 수가 짝수면
      왼쪽, 홀수면 오른쪽으로 빠집니다. 방향을 고르는 prop은 없습니다. 스크롤
      상자 안에 두면 가장 가까운 스크롤 조상의 스크롤을 읽고 그 상자에 보이는
      구간만 그립니다. 없으면 창을 읽습니다. 바탕은 검정이고 색은 바꿀 수
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
      <li>
        탭이 숨겨지거나 화면 밖에 있으면 그리기를 멈춥니다. 스크롤 상자 안에서
        물길이 상자 밖으로 스크롤되어 가려질 때도 멈춥니다.
      </li>
      <li>
        이 사이트의 무대는 키보드로 스크롤할 수 있도록 포커스를 받습니다. 물길을
        스크롤 상자에 둘 때는 그 상자에 <code>tabIndex={0}</code>과 이름을
        주세요. 포커스 표시는 상자 테두리 색으로 합니다.
      </li>
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

<div style={{ height: 480, overflowY: 'auto' }}>
  <section style={{ position: 'relative', height: 2400 }}>
    <LuminousFlow paused={paused} />
    <h2 style={{ position: 'relative', color: '#fff' }}>
      ${String(values.children)}
    </h2>
  </section>
</div>`}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
