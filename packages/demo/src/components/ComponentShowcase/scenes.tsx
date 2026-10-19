import gsap from 'gsap';
import {
  Badge,
  Button,
  Chip,
  Loader,
  SegmentedButtons,
  Skeleton,
  Slider,
  Switch,
  TextField,
} from '@taein-ui/core';
import * as styles from './ComponentShowcase.css';

// 이징 값(출처: packages/core/src/tokens/gsapEasing.ts)과 시간(출처: animation.css.ts의
// duration)을 초 단위로 옮겨 적었다. 새 커브는 만들지 않는다.
// ponytail: core의 gsapEasing·gsapDuration은 공개 export가 아니라 값을 복사했다.
// core 값이 바뀌면 여기도 같이 바꿔야 한다. 데모가 GSAP 커브를 더 쓰게 되면
// core에서 export로 바꾸고 이 복사본을 지운다.
export const ease = {
  settle: 'power3.out',
  snap: 'back.out(1.7)',
  exit: 'power2.in',
} as const;
export const dur = { fast: 0.15, base: 0.2, slow: 0.3 } as const;

export type Period = 'day' | 'week' | 'month';

export interface Demo {
  period: Period;
  stats: 'loading' | 'ready';
  loader: 'loading' | 'done';
  volume: number;
  notify: boolean;
  query: string;
  chips: string[];
  picked: string | null;
}

export const INITIAL_DEMO: Demo = {
  period: 'day',
  stats: 'loading',
  loader: 'loading',
  volume: 30,
  notify: false,
  query: '',
  chips: ['Button', 'Loader', 'Slider', 'Switch'],
  picked: null,
};

/** 사용자(또는 연출)가 컴포넌트를 만졌을 때 상태를 바꾸는 손잡이 */
export interface Actions {
  period: (value: string) => void;
  volume: (value: number) => void;
  notify: (value: boolean) => void;
  query: (value: string) => void;
  remove: (label: string) => void;
  pick: (label: string) => void;
}

type GroupId = 'button' | 'loader' | 'period' | 'volume' | 'notify' | 'search';

/** 연출 커서가 향하는 요소를 그 순간에 찾는 함수 */
export type Target = () => HTMLElement | null;

/** 장면 연출이 타임라인에 얹을 수 있는 것. 엔진(ComponentShowcase)이 채운다 */
export interface ActApi {
  tl: gsap.core.Timeline;
  cursor: HTMLElement;
  find: (selector: string, text?: string) => Target;
  /** 대상 요소의 (가로 비율 fx, 세로 가운데)로 커서를 옮긴다 */
  move: (target: Target, seconds: number, fx?: number) => void;
  /** 합성 pointerdown, 커서 축소 */
  down: (target: Target) => void;
  /** 합성 pointerup(clickToo면 click까지), 커서 복귀 */
  up: (target: Target, clickToo?: boolean) => void;
  press: (target: Target) => void;
  wait: (seconds: number) => void;
  /** 타임라인의 그 시점에 상태를 바꾼다 */
  set: (patch: Partial<Demo>) => void;
  /** 지금 바로 상태를 바꾼다(트윈 onUpdate용) */
  now: (patch: Partial<Demo>) => void;
  /** 틀이 +8% 부풀었다 앉는다 */
  pop: () => void;
  /** 대상 요소의 (fx, 가운데) 좌표를 무대 기준으로 */
  at: (target: Target, fx?: number) => { x: number; y: number } | null;
}

export interface Scene {
  /** 무대 캡션 */
  name: string;
  group: GroupId;
  /** 틀 모양: 한 줄이면 알약, 카드면 큰 반경 */
  shape: 'pill' | 'card';
  /** 장면이 시작될 때 덮어쓰는 상태 */
  enter: Partial<Demo>;
  act: (a: ActApi) => void;
}

/** 통계 카드 장면의 자리(기간을 바꾸면 Skeleton이 잠깐 돈다) */
export const STATS_SCENE = 3;
const CHIPS_SCENE = 7;

const volumeProxy = { v: 30 };

export const SCENES: Scene[] = [
  {
    name: 'Button',
    group: 'button',
    shape: 'pill',
    enter: INITIAL_DEMO,
    act: (a) => {
      const button = a.find('button', '모션 만들기');
      a.move(button, 0.4);
      a.press(button);
      a.wait(0.15);
    },
  },
  {
    name: 'Loader',
    group: 'loader',
    shape: 'pill',
    enter: { loader: 'loading' },
    act: (a) => {
      a.wait(1.2);
      a.set({ loader: 'done' });
      a.pop();
      a.wait(0.3);
    },
  },
  {
    name: 'SegmentedButtons',
    group: 'period',
    shape: 'pill',
    enter: {},
    act: (a) => {
      const month = a.find('label', '월간');
      a.move(month, 0.4);
      a.press(month);
      a.wait(0.35);
    },
  },
  {
    name: 'Skeleton · Badge',
    group: 'period',
    shape: 'card',
    enter: { stats: 'loading' },
    act: (a) => {
      a.wait(0.9);
      a.set({ stats: 'ready' });
      a.wait(0.25);
      const week = a.find('label', '주간');
      a.move(week, 0.4);
      a.press(week);
      // 누르면 onPeriod가 Skeleton을 0.5초 돌린 뒤 값을 보인다
      a.wait(0.7);
    },
  },
  {
    name: 'Slider',
    group: 'volume',
    shape: 'pill',
    enter: { volume: 30 },
    act: (a) => {
      const range = a.find('input[type="range"]');
      const drag = (to: number, seconds: number) => {
        a.tl.to(volumeProxy, {
          v: to,
          duration: seconds,
          ease: ease.settle,
          onUpdate: () => {
            const v = Math.round(volumeProxy.v);
            a.now({ volume: v });
            const p = a.at(range, v / 100);
            if (p) gsap.set(a.cursor, p);
          },
        });
      };
      a.tl.set(volumeProxy, { v: 30 });
      a.move(range, 0.4, 0.3);
      a.down(range);
      drag(100, 0.4);
      drag(60, 0.25);
      a.up(range, false);
      a.wait(0.1);
    },
  },
  {
    name: 'Switch',
    group: 'notify',
    shape: 'pill',
    enter: { notify: false },
    act: (a) => {
      const input = a.find('input[role="switch"]');
      // 입력은 보이지 않는 겹침이라 보이는 트랙(부모)을 누른다
      const toggle = () => input()?.parentElement ?? null;
      a.move(toggle, 0.35);
      a.press(toggle);
      a.wait(0.3);
    },
  },
  {
    name: 'TextField',
    group: 'search',
    shape: 'pill',
    enter: { query: '', chips: INITIAL_DEMO.chips, picked: null },
    act: (a) => {
      a.move(a.find('input'), 0.4);
      a.wait(0.1);
      a.set({ query: '모' });
      a.wait(0.12);
      a.set({ query: '모션' });
      a.wait(0.2);
    },
  },
  {
    name: 'Chip',
    group: 'search',
    shape: 'card',
    enter: {},
    act: (a) => {
      const del = a.find('button[aria-label="Loader 삭제"]');
      a.move(del, 0.4);
      a.press(del);
      a.wait(0.4);
      const pick = a.find('button[aria-label="Switch"]');
      a.move(pick, 0.35);
      a.press(pick);
      a.wait(0.3);
    },
  },
];

const PERIOD_OPTIONS = [
  { value: 'day', label: '일간' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
];

const STATS: Record<Period, { label: string; value: string; delta: number }> = {
  day: { label: '오늘', value: '1,284', delta: 3 },
  week: { label: '이번 주', value: '8,930', delta: 7 },
  month: { label: '이번 달 방문', value: '36,512', delta: 12 },
};

function Stats({ demo }: { demo: Demo }) {
  const stat = STATS[demo.period];
  const loading = demo.stats === 'loading';
  return (
    <div className={styles.stats} data-enter>
      <div className={styles.statsLabel}>
        {loading ? (
          <Skeleton variant="text" animation="wave" width="5rem" />
        ) : (
          stat.label
        )}
      </div>
      <div className={styles.statsRow}>
        {loading ? (
          <Skeleton
            variant="rounded"
            animation="wave"
            width="8rem"
            height="2rem"
          />
        ) : (
          <>
            <strong className={styles.statsValue}>{stat.value}</strong>
            <Badge>{stat.delta}</Badge>
          </>
        )}
      </div>
    </div>
  );
}

/** 장면 번호에 맞는 진짜 컴포넌트. 같은 묶음 안에서는 같은 React 요소가 이어진다 */
export function SceneContent({
  scene,
  demo,
  on,
}: {
  scene: number;
  demo: Demo;
  on: Actions;
}) {
  switch (SCENES[scene].group) {
    case 'button':
      return (
        <Button variant="primary" size="lg">
          모션 만들기
        </Button>
      );
    case 'loader':
      return <Loader size="lg" status={demo.loader} />;
    case 'period':
      return (
        <div className={styles.column}>
          <div data-flip-id="shared">
            <SegmentedButtons
              aria-label="기간"
              options={PERIOD_OPTIONS}
              value={demo.period}
              onChange={on.period}
            />
          </div>
          {scene === STATS_SCENE && <Stats demo={demo} />}
        </div>
      );
    case 'volume':
      return (
        <div className={styles.field}>
          <Slider
            label="볼륨"
            showValue
            value={demo.volume}
            onChange={(e) => on.volume(Number(e.target.value))}
          />
        </div>
      );
    case 'notify':
      return (
        <Switch
          label="알림"
          checked={demo.notify}
          onChange={(e) => on.notify(e.target.checked)}
        />
      );
    case 'search':
      return (
        <div className={styles.column}>
          <div data-flip-id="shared" className={styles.field}>
            <TextField
              label="컴포넌트 찾기"
              value={demo.query}
              onChange={(e) => on.query(e.target.value)}
            />
          </div>
          {scene === CHIPS_SCENE && (
            <div className={styles.chips} data-enter-children>
              {demo.chips.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  selected={demo.picked === label}
                  onClick={() => on.pick(label)}
                  onDelete={() => on.remove(label)}
                />
              ))}
            </div>
          )}
        </div>
      );
  }
}
