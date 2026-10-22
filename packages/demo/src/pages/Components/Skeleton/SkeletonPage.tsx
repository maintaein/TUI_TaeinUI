import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Avatar, Button, Skeleton } from '@taein-ui/core';
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
  '콘텐츠가 들어올 자리의 윤곽을 미리 보입니다. 화면이 곧 채워진다는 것을 알려 빈 화면의 불안을 줄입니다.';

const CONTROLS: Control[] = [
  {
    prop: 'variant',
    kind: 'choice',
    options: ['text', 'rect', 'circle', 'rounded'],
  },
  { prop: 'animation', kind: 'choice', options: ['wave', 'pulse', 'false'] },
];

const INITIAL: Values = { variant: 'rounded', animation: 'wave' };

const DEFAULTS: Values = { variant: 'text', animation: 'wave' };

const MEDIA_HEIGHT = 96;
const IMAGE = '/images/TUI.webp';

// 뼈대가 보이는 시간(ms). wave가 한 번 지나가고(2.1초 주기) 조금 더 머문 뒤 내용이 들어온다
const LOAD_MS = 2600;

// 커서가 새로고침을 누르면 뼈대가 물결치다가 내용으로 바뀐다. 내용을 잠시 보인 뒤 다시 누른다
const SCRIPT = (act: Act) => {
  act.move('reload');
  act.hover('reload');
  act.wait(0.4);
  act.press('reload');
  act.leave('reload');
  act.wait(LOAD_MS / 1000 + 1.6);
  act.home();
  act.wait(0.4);
};

const PROPS: PropDefinition[] = [
  {
    name: 'variant',
    type: "'text' | 'rect' | 'circle' | 'rounded'",
    default: "'text'",
    description:
      '모양. text는 글자 한 줄(높이 1em을 0.6배로 눌러 줄 굵기로 그린다), rect는 모서리가 작은 사각형, circle은 원, rounded는 모서리가 둥근 사각형',
  },
  {
    name: 'animation',
    type: "'wave' | 'pulse' | false",
    default: "'wave'",
    description:
      '움직임. wave는 빛이 왼쪽에서 오른쪽으로 지나가고, pulse는 투명도가 깜빡이고, false는 멈춘다',
  },
  {
    name: 'width',
    type: 'number | string',
    description:
      '너비. 숫자는 px, 문자열은 그대로 쓴다. 기본은 circle 40px, 나머지는 100%',
  },
  {
    name: 'height',
    type: 'number | string',
    description:
      '높이. 숫자는 px, 문자열은 그대로 쓴다. 기본은 text 1em, circle은 width와 같게, rect와 rounded는 100%',
  },
  {
    name: 'aria-label',
    type: 'string',
    description:
      '주면 aria-hidden이 빠지고 role="img"와 함께 이름이 된다. 로딩 알림은 감싸는 영역에 주는 것이 맞다',
  },
];

const SWAP = `const [loading, setLoading] = useState(true);

<section aria-busy={loading} aria-label="프로필">
  {loading ? (
    <>
      <Skeleton variant="circle" width={48} />
      <Skeleton variant="text" width="60%" />
    </>
  ) : (
    <>
      <Avatar alt={user.name} />
      <p>{user.name}</p>
    </>
  )}
</section>`;

const SIZES = `<Skeleton variant="text" width="60%" />
<Skeleton variant="circle" width={48} />
<Skeleton variant="rounded" width="100%" height={96} />`;

function Usage() {
  return (
    <Topics>
      <Topic title="언제 쓰나">
        <p className={t.body}>
          목록, 카드, 프로필처럼 콘텐츠가 들어올 자리의 모양을 미리 알 수 있을
          때 씁니다. 모양을 모르거나 짧게 끝나는 기다림이면 <code>Loader</code>
          가 맞습니다.
        </p>
      </Topic>
      <Topic title="실제 콘텐츠와 같은 크기로">
        <p className={t.body} style={{ marginBottom: 12 }}>
          뼈대는 곧 들어올 콘텐츠와 같은 자리, 같은 크기로 둡니다. 크기를 안
          주면 부모 폭을 채우므로, 줄 하나는 <code>width</code>를 비율로 주어
          길이를 다르게 하면 글처럼 보입니다. <code>circle</code>은{' '}
          <code>width</code>만 주면 <code>height</code>도 같아집니다.
        </p>
        <CodeBlock code={SIZES} />
      </Topic>
      <Topic title="로딩이 끝났을 때 바꾸기">
        <p className={t.body} style={{ marginBottom: 12 }}>
          Skeleton은 스스로 사라지지 않습니다. 로딩 상태를 들고 있다가 끝나면
          뼈대 대신 실제 콘텐츠를 그립니다. 감싸는 영역에 <code>aria-busy</code>
          를 주고 끝나면 거둡니다.
        </p>
        <CodeBlock code={SWAP} />
      </Topic>
      <Topic title="wave와 pulse">
        <p className={t.body}>
          <code>wave</code>는 빛 띠가 왼쪽에서 오른쪽으로 한 방향으로만
          지나가며, 한 번 지나가는 데 약 1초, 한 주기는 2.1초입니다.{' '}
          <code>pulse</code>는 투명도가 1에서 0.4로 내려갔다 돌아오는 데 1.8초
          걸립니다. 기본은 <code>wave</code>입니다. 움직임 줄이기 설정을 켠
          환경에서는 둘 다 멈추고 회색 면만 남습니다.
        </p>
      </Topic>
    </Topics>
  );
}

function A11y() {
  return (
    <ul className={`${t.list} ${t.body}`}>
      <li>
        Skeleton은 장식이라 <code>aria-hidden=&quot;true&quot;</code>가 기본으로
        붙어 스크린 리더가 읽지 않습니다. 스켈레톤이 다섯 개여도 다섯 번 알리지
        않습니다.
      </li>
      <li>
        <code>aria-label</code>을 주면 <code>aria-hidden</code>이 빠지고{' '}
        <code>role=&quot;img&quot;</code>가 붙어 이름이 됩니다.{' '}
        <code>role</code>을 직접 주면 그 값이 이깁니다.
      </li>
      <li>
        개발자가 직접 해야 합니다. 로딩 알림은 뼈대들을 감싼 영역에{' '}
        <code>aria-busy=&quot;true&quot;</code>와 이름을 주어 한 번만 합니다.
        로딩이 끝나면 <code>aria-busy</code>를 거둡니다.
      </li>
    </ul>
  );
}

type Variant = ComponentProps<typeof Skeleton>['variant'];

export function SkeletonPage() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState(0);
  const timer = useRef(0);

  // 새로고침마다 뼈대 시간을 새로 센다
  useEffect(() => {
    if (run === 0) return;
    timer.current = window.setTimeout(() => setLoading(false), LOAD_MS);
    return () => window.clearTimeout(timer.current);
  }, [run]);

  const reload = () => {
    setLoading(true);
    setRun((r) => r + 1);
  };

  // 원은 가로를 높이와 같게 줘야 타원이 되지 않는다
  const mediaWidth = values.variant === 'circle' ? MEDIA_HEIGHT : '100%';
  const animation =
    values.animation === 'false'
      ? false
      : (values.animation as 'wave' | 'pulse');

  return (
    <DetailLayout
      name="Skeleton"
      lead={LEAD}
      stage={
        <Stage label="Skeleton 시연" script={SCRIPT}>
          <div
            aria-busy={loading}
            data-stage-state={loading ? 'loading' : 'ready'}
            style={{ display: 'grid', gap: 16, width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {loading ? (
                <Skeleton variant="circle" width={48} animation={animation} />
              ) : (
                <Avatar alt="Taein Kim" size="lg" />
              )}
              <div style={{ display: 'grid', gap: 4, flex: 1, minWidth: 0 }}>
                {loading ? (
                  <>
                    <Skeleton width="60%" animation={animation} />
                    <Skeleton width="40%" animation={animation} />
                  </>
                ) : (
                  <>
                    <strong>Taein Kim</strong>
                    <span>디자인 시스템 작업 중</span>
                  </>
                )}
              </div>
            </div>
            {loading ? (
              <Skeleton
                variant={values.variant as Variant}
                width={mediaWidth}
                height={MEDIA_HEIGHT}
                animation={animation}
              />
            ) : (
              <img
                src={IMAGE}
                alt="TUI"
                style={{
                  width: '100%',
                  height: MEDIA_HEIGHT,
                  objectFit: 'cover',
                  borderRadius: 12,
                }}
              />
            )}
            <Button
              data-stage-target="reload"
              size="sm"
              variant="light"
              onClick={reload}
            >
              새로고침
            </Button>
          </div>
        </Stage>
      }
      customize={
        <Customize
          controls={CONTROLS}
          values={values}
          // 바꾼 값이 뼈대에 보이도록 뼈대를 다시 보인다
          onChange={(v) => {
            setValues(v);
            reload();
          }}
        />
      }
      code={codeOf({
        component: 'Skeleton',
        values: {
          variant: values.variant,
          animation: values.animation,
          width: String(mediaWidth),
          height: String(MEDIA_HEIGHT),
        },
        defaults: DEFAULTS,
      })
        .replace('animation="false"', 'animation={false}')
        .replace(/(width|height)="(\d+)"/g, '$1={$2}')}
      props={PROPS}
      usage={<Usage />}
      a11y={<A11y />}
    />
  );
}
