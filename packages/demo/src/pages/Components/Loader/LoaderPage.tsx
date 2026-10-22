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
import { Stage, type Act } from '../../../components/Stage';

const LEAD =
  '요청이 끝나기를 기다리는 동안 일이 진행 중임을 보입니다. 점 궤도는 끝나면 체크나 X로 모여 결과까지 알립니다.';

const CONTROLS: Control[] = [
  {
    prop: 'type',
    kind: 'choice',
    options: ['orbit', 'spinner', 'dots', 'bar', 'wave', 'inchworm', 'fuse'],
  },
  { prop: 'size', kind: 'choice', options: ['sm', 'md', 'lg', 'xl'] },
  { prop: 'color', kind: 'choice', options: ['primary', 'secondary'] },
];

const INITIAL: Values = { type: 'orbit', size: 'xl', color: 'primary' };

const DEFAULTS: Values = { type: 'orbit', size: 'md', color: 'primary' };

// status는 orbit만, value는 fuse만 받는다. 코드에는 그 type일 때만 나온다
const NOTATION = {
  status: { expr: 'status' },
  value: { expr: 'progress' },
};

type Status = 'loading' | 'done' | 'error';

const CAPTION: Record<Status, string> = {
  loading: '저장 중...',
  done: '저장했습니다',
  error: '저장하지 못했습니다',
};

// 저장이 끝나기까지(ms). 진행률은 이 시간 동안 0에서 100까지 오른다
const STEP_MS = 160;
const STEPS = 10;
const RUN_MS = STEP_MS * STEPS;

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
    type: "'orbit' | 'spinner' | 'dots' | 'bar' | 'wave' | 'inchworm' | 'fuse'",
    default: "'orbit'",
    description:
      '모양. 점 궤도, 스피너, 점 세 개, 막대, 물결 막대, 자벌레, 진행률 도화선',
  },
  {
    name: 'status',
    type: "'loading' | 'done' | 'error'",
    default: "'loading'",
    description:
      'orbit 전용 결과 표식. done이면 점 여덟 개가 체크로, error면 X로 모인다. 다른 type에 주면 타입 오류',
  },
  {
    name: 'value',
    type: 'number',
    description:
      'fuse 전용 진행률(0~100, 범위 밖은 자른다). fuse에서는 필수이고 다른 type에 주면 타입 오류',
  },
  {
    name: 'size',
    type: "'sm' | 'md' | 'lg' | 'xl'",
    default: "'md'",
    description: '크기',
  },
  {
    name: 'color',
    type: "'primary' | 'secondary' | 'white' | string",
    default: "'primary'",
    description:
      '색. 정해진 셋 중 하나나 임의의 CSS 색(예: "#8b5cf6", "currentColor")',
  },
  {
    name: 'label',
    type: 'string',
    description:
      '로더 아래에 보일 글자. 글자가 바뀌면 옛 글자가 흐려지며 사라지고 새 글자가 흐림에서 또렷해진다',
  },
  {
    name: 'overlay',
    type: 'boolean',
    default: 'false',
    description:
      '부모 위에 반투명 배경과 함께 겹친다(absolute). 부모에 position: relative가 필요하다',
  },
  {
    name: 'fullScreen',
    type: 'boolean',
    default: 'false',
    description: '화면 전체를 반투명 배경으로 덮고 가운데에 놓는다(fixed)',
  },
  {
    name: 'aria-label',
    type: 'string',
    description:
      '스크린 리더가 읽을 이름. 없으면 label, 그것도 없으면 orbit은 status에 따라 "로딩 중", "완료", "실패", fuse는 "진행률", 나머지는 "로딩 중"',
  },
];

const STATUS = `const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

save()
  .then(() => setStatus('done'))
  .catch(() => setStatus('error'));

<Loader size="xl" status={status} />`;

const PROGRESS = `<Loader type="fuse" value={progress} label={\`\${progress}%\`} />`;

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
          씁니다. 끝나는 시간을 알면 <code>fuse</code>로 진행률을 보이고, 모르면
          나머지 모양 중 하나를 고릅니다. 콘텐츠가 들어올 자리의 윤곽을 미리
          보이려면 <code>Skeleton</code>이 맞습니다.
        </p>
      </Topic>
      <Topic title="모양 고르기">
        <ul className={`${t.list} ${t.body}`}>
          <li>
            <code>orbit</code>은 기본입니다. 점 여덟 개의 밝기가 시계 방향으로
            지나가고, 결과(<code>status</code>)를 받습니다.
          </li>
          <li>
            <code>spinner</code>는 도는 원, <code>dots</code>는 점 세 개가
            차례로 솟는 모양입니다. 버튼 옆이나 채팅의 입력 중 표시에 맞습니다.
          </li>
          <li>
            <code>bar</code>와 <code>inchworm</code>은 막대입니다. 페이지 위나
            섹션 위에 가로로 길게 놓습니다. <code>inchworm</code>은 앞끝을 뻗고
            뒤끝을 끌어오며 걷습니다.
          </li>
          <li>
            <code>wave</code>는 가는 막대 줄 위로 물결이 왼쪽에서 오른쪽으로
            지납니다.
          </li>
          <li>
            <code>fuse</code>는 진행률(<code>value</code>)을 받아 왼쪽에서
            오른쪽으로 채웁니다.
          </li>
        </ul>
      </Topic>
      <Topic title="결과까지 알리기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>orbit</code>에 <code>status</code>를 주면 돌던 점이 그 자리에서
          체크(<code>done</code>)나 X(<code>error</code>)로 모입니다. 같은
          점들이 모양을 바꾸는 것이라 로더를 지우고 다른 아이콘을 띄울 필요가
          없습니다. <code>loading</code>으로 돌아가면 다시 돕니다.
        </p>
        <CodeBlock code={STATUS} />
      </Topic>
      <Topic title="진행률">
        <p className={t.body} style={{ marginBottom: 12 }}>
          <code>fuse</code>는 <code>value</code>가 필수입니다. 0 미만과 100
          초과는 잘라서 그립니다.
        </p>
        <CodeBlock code={PROGRESS} />
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
        <code>fuse</code>를 뺀 모양은 <code>role=&quot;status&quot;</code>와{' '}
        <code>aria-live=&quot;polite&quot;</code>인 영역이라 숨은 메시지가
        바뀌면 스크린 리더가 읽습니다. orbit의 <code>status</code>가 완료나
        실패로 바뀔 때가 그렇습니다.
      </li>
      <li>
        <code>fuse</code>는 <code>role=&quot;progressbar&quot;</code>이고{' '}
        <code>aria-valuemin</code> 0, <code>aria-valuemax</code> 100,{' '}
        <code>aria-valuenow</code>(자른 값)가 함께 붙습니다.
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

export function LoaderPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [status, setStatus] = useState<Status>('loading');
  const [progress, setProgress] = useState(35);
  const [running, setRunning] = useState(false);
  const runs = useRef(0);

  // 진행률이 오르다 끝나면 홀수 번째는 성공으로, 짝수 번째는 실패로 끝난다
  useEffect(() => {
    if (!running) return;
    let step = 0;
    const id = window.setInterval(() => {
      step += 1;
      if (step < STEPS) {
        setProgress((step / STEPS) * 100);
        return;
      }
      window.clearInterval(id);
      setProgress(100);
      setStatus(runs.current % 2 === 1 ? 'done' : 'error');
      setRunning(false);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [running]);

  const save = () => {
    runs.current += 1;
    setStatus('loading');
    setProgress(0);
    setRunning(true);
  };

  const type = String(values.type);
  const size = values.size as Size;
  const color = String(values.color);
  // 점 궤도와 도화선은 결과가 로더에 남고, 나머지는 끝나면 로더가 사라지고 글자만 남는다
  const shown = type === 'orbit' || type === 'fuse' || status === 'loading';

  return (
    <DetailLayout
      name="Loader"
      lead={LEAD}
      stage={
        <Stage label="Loader 시연" script={SCRIPT}>
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
              {shown &&
                (type === 'fuse' ? (
                  <Loader
                    type="fuse"
                    size={size}
                    color={color}
                    value={progress}
                  />
                ) : type === 'orbit' ? (
                  <Loader size={size} color={color} status={status} />
                ) : (
                  <Loader
                    type={
                      type as 'spinner' | 'dots' | 'bar' | 'wave' | 'inchworm'
                    }
                    size={size}
                    color={color}
                  />
                ))}
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
      }
      customize={
        <Customize controls={CONTROLS} values={values} onChange={setValues} />
      }
      code={codeOf({
        component: 'Loader',
        values: {
          ...values,
          ...(type === 'orbit' ? { status: true } : {}),
          ...(type === 'fuse' ? { value: true } : {}),
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
