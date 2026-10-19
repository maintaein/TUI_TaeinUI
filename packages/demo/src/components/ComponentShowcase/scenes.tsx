import gsap from 'gsap';
import { Check, Sparkles } from 'lucide-react';
import {
  Button,
  Checkbox,
  HeaderBar,
  IconButton,
  Loader,
  Popover,
  SegmentedButtons,
  Slider,
  Switch,
  themeContract,
} from '@taein-ui/core';
import * as styles from './ComponentShowcase.css';
import { PARTS, headOf, sliderHead, type Part } from './parts';

// 이징 값(출처: packages/core/src/tokens/gsapEasing.ts)과 시간(출처: animation.css.ts의
// duration)을 초 단위로 옮겨 적었다. 새 커브는 만들지 않는다.
// ponytail: core의 gsapEasing·gsapDuration은 공개 export가 아니라 값을 복사했다.
// core 값이 바뀌면 여기도 같이 바꿔야 한다. 데모가 GSAP 커브를 더 쓰게 되면
// core에서 export로 바꾸고 이 복사본을 지운다.
export const ease = {
  settle: 'power3.out',
  snap: 'back.out(1.7)',
  spring: 'elastic.out(1, 0.5)',
  exit: 'power2.in',
  linear: 'none',
} as const;
export const dur = { fast: 0.15, base: 0.2, slow: 0.3, slower: 0.5 } as const;

export type Period = 'day' | 'week' | 'month';
export type Page = 'intro' | 'components';

/** 장면마다 자기 필드만 되돌린다(앞 장면이 같은 상태를 읽으며 아직 화면에 있다) */
export interface Demo {
  page: Page;
  loader: 'loading' | 'done';
  popover: boolean;
  period: Period;
  volume: number;
  notify: boolean;
  agree: boolean;
}

export const INITIAL_DEMO: Demo = {
  page: 'intro',
  loader: 'loading',
  popover: false,
  period: 'day',
  volume: 30,
  notify: false,
  agree: false,
};

/** 사용자(또는 연출)가 컴포넌트를 만졌을 때 상태를 바꾸는 손잡이 */
export interface Actions {
  page: (value: Page) => void;
  popover: (value: boolean) => void;
  period: (value: string) => void;
  volume: (value: number) => void;
  notify: (value: boolean) => void;
  agree: (value: boolean) => void;
}

/** 연출 커서가 향하는 요소를 그 순간에 찾는 함수 */
export type Target = () => HTMLElement | null;

/** 장면 연출이 타임라인에 얹을 수 있는 것. 엔진(ComponentShowcase)이 채운다 */
export interface ActApi {
  tl: gsap.core.Timeline;
  cursor: HTMLElement;
  find: (selector: string, text?: string) => Target;
  /** 대상 요소의 (가로 비율 fx, 세로 가운데)로 커서를 옮긴다 */
  move: (target: Target, seconds: number, fx?: number) => void;
  /** 합성 pointerover(마우스가 올라옴) */
  hover: (target: Target) => void;
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
  /** 대상 요소의 (fx, 가운데) 좌표를 무대 기준으로 */
  at: (target: Target, fx?: number) => { x: number; y: number } | null;
}

type SceneId =
  | 'header'
  | 'button'
  | 'icon'
  | 'loader'
  | 'popover'
  | 'segment'
  | 'slider'
  | 'switch'
  | 'checkbox';

export interface Scene {
  /** 무대 캡션 */
  name: string;
  id: SceneId;
  /** 768px 미만에서는 건너뛴다(HeaderBar pill이 햄버거로 접힌다) */
  wideOnly?: boolean;
  /** 내용 층이 무대 폭을 채운다(바 형태) */
  wide?: boolean;
  /** 장면이 시작될 때 덮어쓰는 상태 */
  enter: Partial<Demo>;
  /** 다음 장면으로 넘겨주는 부품(앞 → 뒤 순서대로 짝지어진다) */
  give?: Part[];
  /** 앞 장면에서 넘겨받는 부품 */
  take?: Part[];
  /** 부품이 여럿으로 흩어지거나 모이는 수. 점마다 시차를 둔다 */
  spread?: number;
  /** 모양 이어받기의 이징. 없으면 커지면 snap, 줄면 settle */
  moveEase?: 'settle' | 'spring';
  /** 대리 상자를 앞 내용 뒤에 깐다. 앞 부품의 글자가 대리 상자 위에서 흐려지며 나가는 것이 보인다 */
  behind?: boolean;
  /**
   * 단계를 겹치지 않는다. 'out': 옛 내용이 다 나간 뒤 모양이 움직인다.
   * 'all': 거기에 더해 모양이 다 움직인 뒤 새 내용이 들어온다(눈이 대리 상자 하나만 따라간다)
   */
  staged?: 'out' | 'all';
  /** 대리 상자 없이 전환 끝에 snap으로 튀어나오는 요소 */
  pop?: (layer: HTMLElement) => Element | null;
  act: (a: ActApi) => void;
}

const ORBIT_DOTS = 8;

const volumeProxy = { v: 30 };

export const SCENES: Scene[] = [
  {
    name: 'HeaderBar',
    id: 'header',
    wideOnly: true,
    wide: true,
    enter: { page: 'intro' },
    give: [PARTS.pill],
    take: [PARTS.pill],
    act: (a) => {
      const item = a.find('nav[aria-label="주요 메뉴"] button', '컴포넌트');
      a.move(item, dur.slower);
      // 알약은 마우스 진입(JS)으로 차오른다. 합성 진입을 건 뒤 차오르길 기다렸다 누른다.
      a.hover(item);
      a.wait(dur.slow);
      a.press(item);
      // 알약이 옮겨 가는 시간
      a.wait(dur.slow);
    },
  },
  {
    name: 'Button',
    id: 'button',
    enter: {},
    give: [PARTS.button],
    take: [PARTS.button],
    act: (a) => {
      const button = a.find('button', '모션 만들기');
      a.move(button, dur.slower);
      a.press(button);
    },
  },
  {
    name: 'IconButton',
    id: 'icon',
    enter: {},
    give: [PARTS.button],
    take: [PARTS.button],
    act: (a) => {
      const button = a.find('button[aria-label="모션 만들기"]');
      a.move(button, dur.slower);
      // 젤리는 마우스 진입(JS)으로 돈다. 끝까지 출렁이는 것(fast + slower)을 보여 주고 누른다.
      a.hover(button);
      a.wait(dur.fast + dur.slower);
      a.press(button);
    },
  },
  {
    name: 'Loader',
    id: 'loader',
    enter: { loader: 'loading' },
    give: [PARTS.dots],
    take: [PARTS.dots],
    spread: ORBIT_DOTS,
    act: (a) => {
      a.wait(dur.slower * 2);
      a.set({ loader: 'done' });
      // 점이 완료 표식으로 모이는 시간(slow + 점마다 fast / 8 시차)
      a.wait(dur.slow + dur.fast);
    },
  },
  {
    name: 'Popover',
    id: 'popover',
    enter: { popover: false },
    give: [PARTS.bubble],
    take: [PARTS.button],
    spread: ORBIT_DOTS,
    act: (a) => {
      const trigger = a.find('button[aria-haspopup]');
      a.move(trigger, dur.slower);
      a.press(trigger);
      // 말풍선이 열리는 시간
      a.wait(dur.slow);
    },
  },
  {
    name: 'SegmentedButtons',
    id: 'segment',
    enter: { period: 'day' },
    give: [PARTS.segTrack, PARTS.segMarker],
    take: [PARTS.segTrack],
    moveEase: 'spring',
    staged: 'out',
    behind: true,
    act: (a) => {
      const month = a.find('label', '월간');
      a.move(month, dur.slower);
      a.press(month);
      // 고무 표식이 미끄러지는 시간
      a.wait(dur.slower);
    },
  },
  {
    name: 'Slider',
    id: 'slider',
    enter: { volume: 30 },
    give: [PARTS.sliderTrack, PARTS.sliderFill, PARTS.sliderHead],
    take: [PARTS.sliderTrack, PARTS.sliderFill],
    pop: sliderHead,
    act: (a) => {
      const range = a.find('input[type="range"]');
      // 그려진 손잡이는 스프링으로 값을 늦게 따라간다. 커서는 값이 아니라 손잡이를 따른다.
      const head: Target = () => headOf(range());
      const drag = (to: number, seconds: number) => {
        a.tl.to(volumeProxy, {
          v: to,
          duration: seconds,
          ease: ease.settle,
          onUpdate: () => {
            a.now({ volume: Math.round(volumeProxy.v) });
            const p = a.at(head);
            if (p) gsap.set(a.cursor, p);
          },
        });
      };
      a.tl.set(volumeProxy, { v: 30 });
      a.move(head, dur.slower);
      a.down(range);
      drag(90, dur.slower);
      drag(60, dur.slow);
      a.up(range, false);
      // 손잡이 스프링이 값에 앉는 시간
      a.wait(dur.slow);
    },
  },
  {
    name: 'Switch',
    id: 'switch',
    enter: { notify: false },
    give: [PARTS.switchThumb],
    take: [PARTS.switchTrack, PARTS.switchTrack, PARTS.switchThumb],
    act: (a) => {
      const input = a.find('input[role="switch"]');
      // 입력은 보이지 않는 겹침이라 보이는 트랙(부모)을 누른다
      const toggle = () => input()?.parentElement ?? null;
      a.move(toggle, dur.slower);
      a.press(toggle);
      // 손잡이가 늘어나며 건너가는 시간
      a.wait(dur.slow + dur.fast);
    },
  },
  {
    name: 'Checkbox',
    id: 'checkbox',
    enter: { agree: false },
    give: [PARTS.checkBox],
    take: [PARTS.checkBox],
    moveEase: 'settle',
    staged: 'all',
    act: (a) => {
      const input = a.find('input[type="checkbox"]');
      // 입력은 보이지 않는 겹침이라 보이는 상자(다음 형제)를 누른다
      const box = () => (input()?.nextElementSibling as HTMLElement) ?? null;
      a.move(box, dur.slower);
      a.press(box);
      // 체크가 그어지는 시간
      a.wait(dur.slow + dur.fast);
    },
  },
];

// 장면 3(IconButton) 이후의 give/take 짝은 아래 표와 같다.
// 1 pill -> 2 Button | 2 Button -> 3 IconButton | 3 IconButton -> 4 점 여럿(흩어짐)
// 4 점 여럿 -> 5 ✓ 버튼(모임) | 5 말풍선 -> 6 트랙 | 6 트랙·표식 -> 7 트랙·채움(+손잡이 pop)
// 7 트랙·채움·손잡이 -> 8 트랙·트랙·손잡이 | 8 손잡이 -> 9 상자 | 9 상자 -> 1 pill

const PERIOD_OPTIONS = [
  { value: 'day', label: '일간' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
];

/** 장면 번호에 맞는 진짜 컴포넌트 */
export function SceneContent({
  scene,
  demo,
  on,
}: {
  scene: number;
  demo: Demo;
  on: Actions;
}) {
  switch (SCENES[scene].id) {
    case 'header':
      return (
        <HeaderBar
          aria-label="쇼케이스 헤더"
          title="TUI"
          navStyle="pill"
          items={[
            {
              label: '소개',
              active: demo.page === 'intro',
              onClick: () => on.page('intro'),
            },
            {
              label: '컴포넌트',
              active: demo.page === 'components',
              onClick: () => on.page('components'),
            },
            { label: '예제' },
          ]}
        />
      );
    case 'button':
      return (
        <Button variant="primary" size="lg">
          모션 만들기
        </Button>
      );
    case 'icon':
      return (
        <IconButton size="lg" aria-label="모션 만들기">
          {/* ghost는 core가 회색으로 고정해, 아이콘만 Button의 primary 파랑으로 칠한다 */}
          <Sparkles style={{ color: themeContract.color.primary.main }} />
        </IconButton>
      );
    case 'loader':
      return <Loader size="lg" status={demo.loader} />;
    case 'popover':
      return (
        <Popover
          open={demo.popover}
          onOpenChange={on.popover}
          arrow
          content={<span className={styles.bubbleBody}>모션이 준비됐어요</span>}
        >
          <IconButton
            variant="primary"
            buttonStyle="strong"
            size="lg"
            aria-label="결과 보기"
          >
            <Check />
          </IconButton>
        </Popover>
      );
    case 'segment':
      return (
        <SegmentedButtons
          aria-label="기간"
          options={PERIOD_OPTIONS}
          value={demo.period}
          onChange={on.period}
        />
      );
    case 'slider':
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
    case 'switch':
      return (
        <Switch
          label="알림"
          checked={demo.notify}
          onChange={(e) => on.notify(e.target.checked)}
        />
      );
    case 'checkbox':
      return (
        <Checkbox
          size="lg"
          label="약관 동의"
          checked={demo.agree}
          onChange={(e) => on.agree(e.target.checked)}
        />
      );
  }
}
