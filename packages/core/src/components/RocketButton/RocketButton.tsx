import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { Button } from '../Button';
import { Glyph } from '../../_internal/glyph';
import { type FluidSmoke } from '../../_internal/fluidSmoke';
import { visuallyHidden } from '../../_internal/visuallyHidden.css';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { settleMotion } from '../../hooks/gateMotion';
import { BEAT, BEAT_END, CROUCH, TAIL_REACH, rocketBeat } from './rocketBeat';
import { makeSmoke } from './smokeEngine';
import {
  root,
  crouch,
  mark,
  markText,
  layer,
  craft,
  cloneHost,
} from './RocketButton.css';

export interface RocketButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** 단추 글자이자 접근 가능한 이름 */
  children: ReactNode;
  /** 날아간 뒤 단추 자리에 서는 표지 글자 @default '보냈어요' */
  sentLabel?: string;
  /**
   * 비행 레이어를 그릴 DOM 위치. 안 주거나 `null`이면 `document.body`(화면 전체)다.
   * 주면 로켓 단추가 그 안에서 날고 상자 밖으로 나가며 잘린다. 그 상자가 `position`의
   * 기준(`relative` 등)이어야 하고 스크롤되는 상자는 지원하지 않는다.
   */
  container?: HTMLElement | null;
  /**
   * 분사구 끝에서 불꽃이 켜진 동안 아래로 내뿜어 바닥에서 옆으로 퍼지고, 발사 때는 진행 반대쪽으로 꼬리를 남기는 유체 연기(WebGL2). 끄면 연기 없이 날고,
   * WebGL2가 없거나 움직임 줄이기여도 연기만 빠진다. 캔버스와 셰이더뿐이라 엄격한 CSP와 무관하다 @default true
   */
  smoke?: boolean;
  /** 비활성화 상태. 비활성이면 웅크리지도 날지도 않는다 @default false */
  disabled?: boolean;
}

// 테스트가 현재 타임라인과 웅크림을 읽는 손잡이(BurstToggle의 타임라인 손잡이와 같은 모양).
type Host = HTMLElement & {
  __rocketTimeline?: gsap.core.Timeline;
  __rocketCrouch?: gsap.core.Tween;
};

// 눌림 되감기용 제자리
const REST = { x: 0, y: 0, scale: 1 } as const;
// 분사구 끝에서 연기를 내보내는 간격(ms). 매 프레임 내보내면(약 16ms) 무대가 연기로 덮였다. 발사 중에는 단추가 빨리 움직여
// 간격이 벌어지면 점선이 되므로 매 프레임 내보낸다
const PUFF_GAP = 100;
// 분사구에서 몸체 아래 방향으로 밀어내는 속도(CSS px/초). 발사 중에는 몸체가 기울어 진행 반대(왼쪽 아래)로 꼬리가 남는다
const JET_PUSH = 500;
// 바닥(비행 층의 아래 가장자리)에서 옆으로 퍼지는 연기: 유체 엔진에는 벽이 없어 아래로 민 연기가 그냥 빠져나가므로
// 바닥 가까이에서 분사구 바깥쪽으로 직접 내보내 영상의 바닥 띠를 만든다. 둥실이 끝나(발사 전) 불꽃이 켜진 동안만이다
const FLOOR_LIFT = 12;
const FLOOR_SPREAD = 320;

interface Flight {
  clone: HTMLElement;
  left: number;
  top: number;
  width: number;
  height: number;
  dx: number;
  /** 레이어(창 또는 container 안쪽 상자)의 창 좌표 사각형. 이 밖에는 연기를 뿜지 않는다 */
  bounds: { left: number; top: number; right: number; bottom: number };
}

interface Launch {
  /** 누를 때 단추에 포커스가 있었는지 */
  focused: boolean;
  /** 누를 때 이미 웅크려 있었는지(눌렀다 뗀 click). 복제본이 그 자세로 이어받는다 */
  crouched: boolean;
  /** 움직임 줄이기에서는 비행이 없다 */
  flight: Flight | null;
}

// anchor는 단추를 감싼 상자다. 단추 자신의 사각형은 누름 scale(0.95)이 걸려 있으면(마우스를 떼는 순간 아직 눌려 있다)
// 줄어들어 복제본이 튀므로, 자식의 transform을 받지 않는 상자로 잰다.
const measureFlight = (
  button: HTMLButtonElement,
  anchor: HTMLElement,
  container: HTMLElement | null | undefined
): Flight => {
  const rect = anchor.getBoundingClientRect();
  const clone = button.cloneNode(true) as HTMLElement;
  // 복제본은 장식이다. 소비자의 data-*(테스트 손잡이, 누름 상태)와 id를 모두 걷는다
  [clone, ...clone.querySelectorAll<HTMLElement>('*')].forEach((node) => {
    node.removeAttribute('id');
    Array.from(node.attributes)
      .filter((attr) => attr.name.startsWith('data-'))
      .forEach((attr) => node.removeAttribute(attr.name));
  });
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('inert', '');
  clone.tabIndex = -1;

  // 레이어 좌표: 화면 전체거나 container의 안쪽 상자
  let originX = 0;
  let originY = 0;
  let width = document.documentElement.clientWidth;
  let height = document.documentElement.clientHeight;
  if (container) {
    const box = container.getBoundingClientRect();
    originX = box.left + container.clientLeft;
    originY = box.top + container.clientTop;
    width = container.clientWidth;
    height = container.clientHeight;
  }
  const left = rect.left - originX;
  const top = rect.top - originY;
  // 오른쪽 위 45도로 간다. 오른쪽과 위쪽 중 가까운 가장자리를 넘어 꼬리날개와 불꽃(진행 반대쪽으로 늘어진다)까지 나가는 거리(그보다 멀리 가면 이미
  // 안 보이는 구간이 길어 표지가 늦어 보인다). 발사가 끝나는 순간 복제본과 꼬리날개는 레이어 밖이다.
  const distance =
    Math.max(0, Math.min(width - left, top + rect.height)) +
    rect.height * TAIL_REACH;
  return {
    clone,
    left,
    top,
    width: rect.width,
    height: rect.height,
    dx: distance,
    bounds: {
      left: originX,
      top: originY,
      right: originX + width,
      bottom: originY + height,
    },
  };
};

/**
 * 메일 보내기·제출·전송 단추. 누르는 순간 왼쪽 아래로 살짝 웅크리고, click이 확정되면 단추 모양 복제본이
 * 박자(`rocketBeat`) 하나를 따라 꼬리날개가 펴지고 분사구가 내려오며 불꽃이 켜져 약 25px 떠올랐다 앉고(살짝 넘친다)
 * 몇 px 둥실거린 뒤, 오른쪽 위로 가속하며 진행 방향으로 기울고 불꽃이 길어지며 화면(또는 `container`) 밖으로 날아간다.
 * 불꽃이 켜진 동안 분사구 끝에서 연기가 나와 바닥에 띠가 쌓인다. 원래 단추는 그 순간 보이지 않게 두어 자리를
 * 지키고, 날아간 뒤 그 자리에 `sentLabel` 표지가 떠오른다. 돌아오지 않으며 소비자가 `key`를 바꿔 다시 그린다.
 * 포커스가 있었으면 표지로 옮기고, 없었으면 처음부터 있는 보이지 않는 알림 영역(`role="status"`)에 `sentLabel`을
 * 넣는다. 비행 중 다시 누르는 것은 무시한다.
 * 꼬리날개·분사구·불꽃은 3D로 그린다. 3D 라이브러리는 따로 불러오며(단추를 가리키거나 포커스가 가면 미리 받는다)
 * 누를 때까지 못 받았거나 불러오기에 실패했거나 WebGL2가 없으면 꼬리날개와 불꽃 없이 난다(연기는 WebGL2가 있어야 나온다).
 * 움직임 줄이기에서는 비행 없이(그 라이브러리도 받지 않는다) 단추가 표지로 교차 페이드된다.
 */
export const RocketButton = forwardRef<HTMLButtonElement, RocketButtonProps>(
  (
    {
      children,
      sentLabel = '보냈어요',
      container,
      smoke = true,
      disabled = false,
      onClick,
      onPointerDown,
      onPointerLeave,
      onPointerCancel,
      ...props
    },
    ref
  ) => {
    const reduced = useReducedMotion();
    const [launch, setLaunch] = useState<Launch | null>(null);
    const [flying, setFlying] = useState(false);
    const hostRef = useRef<Host>(null);
    const crouchRef = useRef<HTMLSpanElement>(null);
    const markRef = useRef<HTMLSpanElement>(null);
    const craftRef = useRef<HTMLDivElement>(null);
    const cloneHostRef = useRef<HTMLSpanElement>(null);
    const timelineRef = useRef<gsap.core.Timeline>(null);
    // 연기는 비행(flying)에 묶지 않는다. 레이어가 걷힌 뒤에도 엔진 수명대로 흩어지고 언마운트에서만 끊는다
    const smokeRef = useRef<FluidSmoke | null>(null);
    const crouched = useRef(false);

    // 웅크림을 되감는다. 눌림이 없었으면 아무 일도 없다
    const release = () => {
      const el = crouchRef.current;
      const host = hostRef.current;
      if (!el || !host || !crouched.current) return;
      crouched.current = false;
      host.__rocketCrouch = gsap.to(el, {
        ...REST,
        duration: gsapDuration.base,
        ease: gsapEasing.settle,
        overwrite: true,
      });
    };

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);
      const el = crouchRef.current;
      const host = hostRef.current;
      // 움직임 줄이기에서는 웅크리지 않는다. 주 단추가 아닌 누름은 click이 안 와서 눌린 채 남는다
      if (!el || !host || disabled || reduced || launch || crouched.current) {
        return;
      }
      if (event.button > 0) return;
      crouched.current = true;
      host.__rocketCrouch = gsap.to(el, {
        ...CROUCH,
        duration: gsapDuration.fast,
        ease: gsapEasing.settle,
        overwrite: true,
      });
    };

    const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(event);
      release();
    };

    const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerCancel?.(event);
      release();
    };

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      // 이미 날았다. 보이지 않는 단추에도 폼의 암묵 제출(Enter)은 click을 보내므로 제출을 막는다
      if (launch) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
      if (event.defaultPrevented) {
        release();
        return;
      }
      const el = crouchRef.current;
      if (!el) return;
      // 웅크림을 걷어 낸 원래 자리를 잰다. 복제본이 웅크린 자세로 이어받는다
      const wasCrouched = crouched.current;
      crouched.current = false;
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: 'transform' });
      // 첫 생성이 동기로 최대 약 84ms 걸린다. 웅크림·꼬리날개 박자(첫 연기는 0.45초 점화) 앞에서 치른다.
      // 엔진이 null(WebGL2 없음, 움직임 줄이기는 엔진이 스스로 거른다)이면 연기만 빠진다
      if (smoke) {
        smokeRef.current = makeSmoke({
          container: container ?? undefined,
        });
      }
      const button = event.currentTarget;
      setLaunch({
        focused: button.ownerDocument.activeElement === button,
        crouched: wasCrouched,
        flight: reduced ? null : measureFlight(button, el, container),
      });
      setFlying(!reduced);
    };

    // 날아오르는 연출. 단추를 감추고 표지로 포커스를 옮기는 것도 여기서 한다(그려지기 전이라 깜빡임이 없다).
    useLayoutEffect(() => {
      const wrap = crouchRef.current;
      const label = markRef.current;
      const host = hostRef.current;
      if (!launch || !wrap || !label || !host) return;
      gsap.set(label, { opacity: 0 });
      if (launch.focused) label.focus({ preventScroll: true });

      // 비행(레이어)은 발사가 끝나는 순간 걷는다. 표지가 떠오르는 순간과 같다
      const done = () => {
        setFlying(false);
      };
      const { flight } = launch;
      const body = craftRef.current;
      const clones = cloneHostRef.current;
      let timeline: gsap.core.Timeline;
      if (!flight || !body || !clones) {
        // 움직임 줄이기: 단추와 표지가 교차 페이드한다(opacity는 이동이 아니라 남긴다)
        timeline = gsap
          .timeline({ onComplete: done })
          .to(
            wrap,
            {
              autoAlpha: 0,
              duration: gsapDuration.base,
              ease: gsapEasing.settle,
            },
            0
          )
          .to(
            label,
            {
              opacity: 1,
              duration: gsapDuration.base,
              ease: gsapEasing.settle,
            },
            0
          );
      } else {
        clones.replaceChildren(flight.clone);
        gsap.set(wrap, { autoAlpha: 0 });
        const geometry = {
          width: flight.width,
          height: flight.height,
          distance: flight.dx,
        };
        // 박자 하나(rocketBeat)가 단추의 움직임, 꼬리날개와 불꽃, 분사구 끝 연기, 표지를 모두 정한다. 시계는 0에서 끝까지 도는 숫자 하나다
        const clock = { t: 0 };
        let lastPuff = -Infinity;
        const tick = () => {
          const beat = rocketBeat(clock.t, geometry);
          // 눌렀다 뗀 click이면 웅크림 구간은 이미 웅크린 자세를 이어받는다
          const pose =
            launch.crouched && beat.phase === 'crouch' ? CROUCH : beat;
          gsap.set(body, {
            x: pose.x,
            y: pose.y,
            rotation: beat.rotation,
            scale: pose.scale,
          });
          gsap.set(label, { opacity: beat.mark });
          const engine = smokeRef.current;
          // 불꽃이 켜진 동안만 분사구 끝에서 내보낸다. 발사 중에는 단추가 빨라 매 프레임, 그 밖에는 PUFF_GAP 간격이다
          const gap = beat.phase === 'launch' ? 0 : PUFF_GAP;
          if (!engine || !beat.smoke || clock.t - lastPuff < gap) return;
          lastPuff = clock.t;
          const r = body.getBoundingClientRect();
          const cx = (r.left + r.right) / 2;
          const cy = (r.top + r.bottom) / 2;
          // 자리는 단추 중심 기준이라 이동한 배율과 기울기를 걸어 창 좌표로 바꾼다. 연기는 몸체의 아래 방향으로 나간다
          const rad = (beat.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const floor = flight.bounds.bottom - FLOOR_LIFT;
          for (const p of beat.smokeAt) {
            const x = cx + beat.scale * (p.x * cos - p.y * sin);
            const y = cy + beat.scale * (p.x * sin + p.y * cos);
            engine.emit(x, y, -sin * JET_PUSH, cos * JET_PUSH);
            // 바닥이 분사구보다 아래일 때만: 분사구 바깥쪽 옆으로 퍼지는 띠
            if (beat.phase !== 'launch' && floor > y) {
              engine.emit(x, floor, Math.sign(p.x) * FLOOR_SPREAD, 0);
            }
          }
        };
        tick();
        timeline = gsap
          .timeline({ onComplete: done })
          .to(
            clock,
            {
              t: BEAT_END,
              duration: BEAT_END / 1000,
              ease: gsapEasing.linear,
              onUpdate: tick,
            },
            0
          )
          // 비행(레이어)은 발사가 끝나는 순간 걷는다. 표지가 떠오르기 시작하는 순간과 같다
          .call(done, [], BEAT.sent / 1000);
      }
      timelineRef.current = timeline;
      host.__rocketTimeline = timeline;
      return () => {
        timeline.kill();
        timelineRef.current = null;
      };
    }, [launch]);

    // 비행 도중 움직임 줄이기가 켜지면 끝 상태로 확정한다(단추는 이미 날아갔고 표지가 선다)
    useLayoutEffect(() => {
      if (reduced && timelineRef.current) settleMotion(timelineRef.current);
    }, [reduced]);

    // 언마운트와 key 교체 도중의 웅크림을 죽인다
    useLayoutEffect(() => {
      const el = crouchRef.current;
      return () => {
        if (el) gsap.killTweensOf(el);
        smokeRef.current?.dispose();
      };
    }, []);

    const flight = launch?.flight;
    return (
      <span ref={hostRef} className={root} data-sent={launch ? '' : undefined}>
        <span ref={crouchRef} className={crouch}>
          <Button
            {...props}
            ref={ref}
            disabled={disabled}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerCancel}
          >
            {children}
          </Button>
        </span>
        {launch && (
          <span
            ref={markRef}
            tabIndex={-1}
            className={mark}
            data-rocket-mark=""
          >
            <Glyph name="check" size="sm" />
            <span className={markText}>{sentLabel}</span>
          </span>
        )}
        {/* 처음부터 있는 빈 알림 영역. 새로 삽입된 영역은 스크린 리더가 읽지 않을 수 있어 글만 나중에 넣는다. 포커스를
            표지로 옮겼으면 포커스된 요소의 글이 읽히므로 비워 둔다(두 번 낭독 방지) */}
        <span className={visuallyHidden} role="status">
          {launch && !launch.focused && !flying ? sentLabel : ''}
        </span>
        {flying &&
          flight &&
          createPortal(
            <div
              className={layer}
              data-rocket-layer=""
              data-contained={container ? '' : undefined}
              aria-hidden="true"
              inert
            >
              <div
                ref={craftRef}
                className={craft}
                style={{
                  left: flight.left,
                  top: flight.top,
                  width: flight.width,
                  height: flight.height,
                }}
              >
                <span ref={cloneHostRef} className={cloneHost} />
              </div>
            </div>,
            container ?? document.body
          )}
      </span>
    );
  }
);

RocketButton.displayName = 'RocketButton';
