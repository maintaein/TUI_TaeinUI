import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Button, Loader } from '@taein-ui/core';
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
  '요청이 끝나기를 기다리는 동안 일이 진행 중임을 보입니다. 모든 모양이 로딩에서 완료나 실패 표식으로 이어져 결과까지 알립니다.';

const CONTROLS: Control[] = [
  {
    prop: 'type',
    kind: 'choice',
    options: ['orbit', 'spinner', 'dots', 'bar', 'wave'],
  },
  { prop: 'status', kind: 'choice', options: ['loading', 'done', 'error'] },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg', 'xl'] },
  { prop: 'color', kind: 'choice', options: ['primary', 'secondary'] },
];

const INITIAL: Values = {
  type: 'orbit',
  size: 'xl',
  color: 'primary',
  status: 'loading',
};

const DEFAULTS: Values = {
  type: 'orbit',
  size: 'md',
  color: 'primary',
  status: 'loading',
};

const NOTATION = {
  status: { expr: 'status' },
};

type Status = 'loading' | 'done' | 'error';

const CAPTION: Record<Status, string> = {
  loading: '저장 중...',
  done: '저장했습니다',
  error: '저장하지 못했습니다',
};

// 저장이 끝나는 시간은 대본의 결과 대기와 맞춘다.
const RUN_MS = 1600;

// 커서가 저장 단추를 누르면 로더가 돌다가 끝나는 순간 결과로 바뀐다(점들이 체크나 X로 모인다).
// 한 바퀴는 성공으로, 다음 바퀴는 실패로 끝난다. 결과가 보이는 동안 머문 뒤 돌아온다
const SCRIPT = (act: Act) => {
  act.move('save');
  act.hover('save');
  act.wait(0.5);
  act.press('save');
  act.leave('save');
  act.wait(RUN_MS / 1000 + 2);
  act.home();
  act.wait(0.6);
};

const PROPS: PropDefinition[] = [
  {
    name: 'type',
    type: "'orbit' | 'spinner' | 'dots' | 'bar' | 'wave'",
    default: "'orbit'",
    description: '점 궤도, 스피너, 점 세 개, 막대, 물결 막대입니다.',
  },
  {
    name: 'status',
    type: "'loading' | 'done' | 'error'",
    default: "'loading'",
    description:
      '모든 모양이 받습니다. bar는 표식 없이 성공색이나 실패색으로 바뀝니다. spinner는 원이 닫힌 뒤 체크나 X가 솟아 안착합니다. loading으로 돌아가면 다시 움직입니다.',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg' | 'xl'",
    default: "'md'",
    description: '크기입니다.',
  },
  {
    name: 'color',
    type: "'primary' | 'secondary' | 'white' | string",
    default: "'primary'",
    description:
      '정해진 색 셋이나 임의의 CSS 색을 받습니다(예: "#8b5cf6", "currentColor").',
  },
  {
    name: 'label',
    type: 'string',
    description: '로더 아래 글자입니다. 바뀌면 흐림으로 교체합니다.',
  },
  {
    name: 'overlay',
    type: 'boolean',
    default: 'false',
    description: '부모 위에 겹칩니다. 부모에 position: relative가 필요합니다.',
  },
  {
    name: 'fullScreen',
    type: 'boolean',
    default: 'false',
    description: '화면 전체를 덮고 가운데에 놓습니다(fixed).',
  },
  {
    name: 'aria-label',
    type: 'string',
    description:
      '스크린 리더가 읽을 이름입니다. 없으면 label, 그것도 없으면 status에 따라 "로딩 중", "완료", "실패"입니다.',
  },
];

const STATUS = `const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

save()
  .then(() => setStatus('done'))
  .catch(() => setStatus('error'));

<Loader size="xl" status={status} />`;

const COVER = `{/* 한 영역만 덮기: 부모에 position: relative */}
<div style={{ position: 'relative' }}>
  {content}
  {loading && <Loader overlay label="불러오는 중..." />}
</div>

{/* 화면 전체 */}
{loading && <Loader fullScreen />}`;

const COLOR = `<Loader color="secondary" />
<Loader color="#8b5cf6" />
<Loader color="white" />   {/* 어두운 배경에서 */}`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          데이터를 불러오거나 저장하는 동안처럼 곧 끝날 일을 기다리게 할 때
          씁니다. 배치에 맞는 모양을 고르고 완료나 실패는 status로 알립니다.
          콘텐츠가 들어올 자리의 윤곽을 미리 보이려면 <code>Skeleton</code>이
          맞습니다.
        </p>
      </Topic>
      <Topic title="모양 고르기">
        <ul className={`${t.list} ${t.body}`}>
          <li>
            <code>orbit</code>은 기본입니다. 점 여덟 개의 밝기가 시계 방향으로
            지나갑니다.
          </li>
          <li>
            <code>spinner</code>는 도는 원, <code>dots</code>는 점 세 개가
            차례로 솟는 모양입니다. 버튼 옆이나 채팅의 입력 중 표시에 맞습니다.
          </li>
          <li>
            <code>bar</code>는 페이지나 섹션 위에 놓는 막대입니다.
          </li>
          <li>
            <code>wave</code>는 가는 막대 줄 위로 물결이 왼쪽에서 오른쪽으로
            지납니다.
          </li>
        </ul>
      </Topic>
      <Topic title="결과까지 알리기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          모든 모양에 <code>status</code>를 줍니다. 스피너는 원이 닫힌 뒤 체크(
          <code>done</code>)나 X(<code>error</code>)가 중심에서 작게 솟아
          안착합니다. 점은 모이고 물결은 접혀 결과 표식으로 이어집니다. 막대는
          표식 없이 성공하면 초록으로 끝까지 차오르고, 실패하면 빨강으로
          흔들립니다. <code>loading</code>으로 돌아가면 다시 돕니다.
        </p>
        <CodeBlock code={STATUS} />
      </Topic>
      <Topic title="영역을 덮기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>overlay</code>는 부모 위에, <code>fullScreen</code>은 화면 전체
          위에 반투명 배경과 함께 겹칩니다. <code>label</code>을 주면 로더
          아래에 글자가 놓입니다.
        </p>
        <CodeBlock code={COVER} />
      </Topic>
      <Topic title="색">
        <p className={t.body} style={{ marginBottom: 12 }}>
          정해진 색은 <code>primary</code>, <code>secondary</code>,{' '}
          <code>white</code>입니다. <code>white</code>는 어두운 배경에서 씁니다.
          그 밖의 색은 CSS 색을 그대로 넘깁니다.
        </p>
        <CodeBlock code={COLOR} />
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        모든 모양은 <code>role=&quot;status&quot;</code>와{' '}
        <code>aria-live=&quot;polite&quot;</code>인 영역이라 숨은 메시지가
        바뀌면 스크린 리더가 읽습니다. <code>status</code>가 완료나 실패로 바뀔
        때가 그렇습니다.
      </li>
      <li>
        이름은 <code>aria-label</code>, 없으면 <code>label</code>, 그것도 없으면
        모양에 맞는 기본 이름입니다. <code>label</code>이 이름과 같으면 보이는
        글자는 <code>aria-hidden</code>이 되어 한 번만 읽힙니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. Loader는 <code>aria-busy</code>를 달지
        않습니다. 로딩 중인 영역을 알리려면 그 영역을 감싼 요소에{' '}
        <code>aria-busy</code>를 줍니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 무엇을 기다리는지 <code>label</code>이나{' '}
        <code>aria-label</code>로 구체적으로 적습니다. &quot;프로필을 불러오는
        중&quot;처럼 씁니다.
      </li>
      <li>
        움직임 줄이기 설정을 켠 환경에서는 결과 표식이 미끄러지지 않고 바로
        바뀝니다.
      </li>
    </ul>
  );
}

type Size = ComponentProps<typeof Loader>['size'];

/** 무대 조각. 상세 페이지와 전체 컴포넌트 카드가 같이 쓴다 */
export function LoaderDemo({ values = INITIAL, mini }: DemoProps) {
  const [status, setStatus] = useState<Status>(
    (values.status ?? 'loading') as Status
  );
  const [running, setRunning] = useState(false);
  const [previousValues, setPreviousValues] = useState(values);
  const runs = useRef(0);

  if (
    previousValues.status !== values.status ||
    previousValues.type !== values.type
  ) {
    setPreviousValues(values);
    setStatus((values.status ?? 'loading') as Status);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => {
      setStatus(runs.current % 2 === 1 ? 'done' : 'error');
      setRunning(false);
    }, RUN_MS);
    return () => window.clearTimeout(id);
  }, [running]);

  const save = () => {
    runs.current += 1;
    setStatus('loading');
    setRunning(true);
  };

  const type = String(values.type);
  const size = values.size as Size;
  const color = String(values.color);

  return (
    <Stage mini={mini} label="Loader 시연" script={SCRIPT}>
      <div
        style={{
          display: 'grid',
          justifyItems: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: 112,
            minWidth: 'min(100%, 16rem)',
          }}
        >
          <Loader
            type={type as ComponentProps<typeof Loader>['type']}
            size={size}
            color={color}
            status={status}
          />
        </div>
        <p className={t.body}>{CAPTION[status]}</p>
        <Button
          data-stage-target="save"
          size="sm"
          variant="light"
          disabled={running}
          onClick={save}
        >
          저장
        </Button>
      </div>
    </Stage>
  );
}

export function LoaderPage() {
  const [values, setValues] = useState<Values>(INITIAL);

  return (
    <DetailLayout
      name="Loader"
      lead={LEAD}
      stage={<LoaderDemo values={values} />}
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Loader',
        values: {
          ...values,
          status: true,
        },
        defaults: DEFAULTS,
        notation: NOTATION,
      })}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
