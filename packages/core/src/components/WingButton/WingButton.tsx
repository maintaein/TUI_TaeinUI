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
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { settleMotion } from '../../hooks/gateMotion';
import {
  root,
  crouch,
  mark,
  layer,
  craft,
  cloneHost,
  wing,
  wingSvg,
  feather,
} from './WingButton.css';

export interface WingButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** 단추 글자이자 접근 가능한 이름 */
  children: ReactNode;
  /** 날아간 뒤 단추 자리에 서는 표지 글자 @default '보냈어요' */
  sentLabel?: string;
  /**
   * 비행 레이어를 그릴 DOM 위치. 안 주거나 `null`이면 `document.body`(화면 전체)다.
   * 주면 날개 달린 단추가 그 안에서 날고 상자 밖으로 나가며 잘린다. 그 상자가 `position`의
   * 기준(`relative` 등)이어야 하고 스크롤되는 상자는 지원하지 않는다.
   */
  container?: HTMLElement | null;
  /** 비활성화 상태. 비활성이면 웅크리지도 날지도 않는다 @default false */
  disabled?: boolean;
}

// 테스트가 현재 타임라인과 웅크림을 읽는 손잡이(StampButton의 __stampTimeline과 같은 모양).
type Host = HTMLElement & {
  __wingTimeline?: gsap.core.Timeline;
  __wingCrouch?: gsap.core.Tween;
};

// 웅크림: 왼쪽 아래로 살짝 눌린다
const CROUCH = { x: -2, y: 2, scale: 0.97 } as const;
const REST = { x: 0, y: 0, scale: 1 } as const;
// 날개 길이는 단추 높이의 1.2배(CSS와 같은 값)
const WING_RATIO = 1.2;
// 퍼덕임: 날개 회전 ±20deg, 한 번(내렸다 올림)에 base. 그 절반이 한 방향 휘두름이다.
const FLAP = 20;
const HALF_FLAP = gsapDuration.base / 2;
// 날개를 펴고 세 번 퍼덕이는 구간(0.6초), 그다음 이륙(0.8초). 퍼덕임은 이륙 중에도 이어진다.
const PREP = gsapDuration.base * 3;
const TAKEOFF = gsapDuration.base * 4;
const FLAP_HALVES = Math.round((PREP + TAKEOFF) / HALF_FLAP);
// 이륙: 진행 방향으로 -15deg 기울고 0.6배까지 작아진다
const TILT = -15;
const FAR_SCALE = 0.6;
// 날개 펴짐: 깃털이 단추 옆면을 따라 위로 접혀 있다가 부채로 펴진다. 깃털마다 base의 10%씩 늦게 시작한다.
const FOLD = -92;
const FEATHERS = [
  { angle: -68, length: 70 },
  { angle: -48, length: 84 },
  { angle: -30, length: 96 },
  { angle: -12, length: 100 },
] as const;
const UNFURL_STAGGER = gsapDuration.base * 0.1;
const UNFURL = gsapDuration.base - UNFURL_STAGGER * (FEATHERS.length - 1);
// 날개 svg 좌표계(100x100)에서 뿌리는 왼쪽 아래 모서리다
const ROOT = '0 100';
// 표지는 이륙의 75%에 떠오르기 시작해 비행이 끝나는 순간 다 보인다
const MARK_AT = PREP + TAKEOFF * 0.75;

// 깃털 하나: 뿌리(0,100)에서 오른쪽으로 length만큼 뻗는 잎 모양
const featherPath = (length: number) =>
  `M0 100C${length * 0.2} 87 ${length * 0.7} 85 ${length} 100C${length * 0.7} 115 ${length * 0.2} 113 0 100Z`;

interface Flight {
  clone: HTMLElement;
  left: number;
  top: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
}

interface Launch {
  /** 누를 때 단추에 포커스가 있었는지 */
  focused: boolean;
  /** 움직임 줄이기에서는 비행이 없다 */
  flight: Flight | null;
}

const measureFlight = (
  button: HTMLButtonElement,
  container: HTMLElement | null | undefined
): Flight => {
  const rect = button.getBoundingClientRect();
  const clone = button.cloneNode(true) as HTMLElement;
  clone.removeAttribute('data-pressed');
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('inert', '');
  clone.tabIndex = -1;

  // 레이어 좌표: 화면 전체거나 container의 안쪽 상자
  let originX = 0;
  let originY = 0;
  let width = document.documentElement.clientWidth;
  if (container) {
    const box = container.getBoundingClientRect();
    originX = box.left + container.clientLeft;
    originY = box.top + container.clientTop;
    width = container.clientWidth;
  }
  const left = rect.left - originX;
  const top = rect.top - originY;
  // 오른쪽 위 45도로 간다. 왼쪽 날개 끝까지 레이어의 오른쪽이나 위쪽 밖으로 나가는 거리
  const distance =
    Math.max(width - left, top + rect.height) + rect.height * WING_RATIO;
  return {
    clone,
    left,
    top,
    width: rect.width,
    height: rect.height,
    dx: distance,
    dy: -distance,
  };
};

/**
 * 메일 보내기·제출·전송 단추. 누르는 순간 왼쪽 아래로 살짝 웅크리고, click이 확정되면 단추 양 끝에서
 * 날개가 펴져 세 번 퍼덕인 뒤 단추 모양 복제본이 오른쪽 위로 가속하며 기울고 작아지며 화면(또는 `container`)
 * 밖으로 날아간다. 원래 단추는 그 순간 보이지 않게 두어 자리를 지키고, 날아간 뒤 그 자리에 `sentLabel`
 * 표지가 떠오른다. 돌아오지 않으며 소비자가 `key`를 바꿔 다시 그린다. 포커스가 있었으면 표지로 옮긴다.
 * 움직임 줄이기에서는 날개와 비행 없이 단추가 표지로 교차 페이드된다.
 */
export const WingButton = forwardRef<HTMLButtonElement, WingButtonProps>(
  (
    {
      children,
      sentLabel = '보냈어요',
      container,
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
    const wingLeftRef = useRef<HTMLSpanElement>(null);
    const wingRightRef = useRef<HTMLSpanElement>(null);
    const timelineRef = useRef<gsap.core.Timeline>(null);
    const crouched = useRef(false);

    // 웅크림을 되감는다. 눌림이 없었으면 아무 일도 없다
    const release = () => {
      const el = crouchRef.current;
      const host = hostRef.current;
      if (!el || !host || !crouched.current) return;
      crouched.current = false;
      host.__wingCrouch = gsap.to(el, {
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
      host.__wingCrouch = gsap.to(el, {
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
      crouched.current = false;
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: 'transform' });
      const button = event.currentTarget;
      setLaunch({
        focused: button.ownerDocument.activeElement === button,
        flight: reduced ? null : measureFlight(button, container),
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

      const done = () => setFlying(false);
      const { flight } = launch;
      const body = craftRef.current;
      const clones = cloneHostRef.current;
      const left = wingLeftRef.current;
      const right = wingRightRef.current;
      let timeline: gsap.core.Timeline;
      if (!flight || !body || !clones || !left || !right) {
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
        gsap.set(body, CROUCH);
        const feathers = body.querySelectorAll('[data-feather]');
        timeline = gsap
          .timeline({ onComplete: done })
          // 웅크림을 풀며 날개가 돋는다
          .to(
            body,
            { ...REST, duration: gsapDuration.fast, ease: gsapEasing.snap },
            0
          )
          .fromTo(
            [left, right],
            { opacity: 0 },
            {
              opacity: 1,
              duration: gsapDuration.fast,
              ease: gsapEasing.linear,
            },
            0
          )
          // 안쪽 깃털부터 한 장씩 편다(왼쪽 날개 넷, 오른쪽 날개 넷의 순서라 index % 4가 깃털 번호다)
          .fromTo(
            feathers,
            { rotation: FOLD, svgOrigin: ROOT },
            {
              rotation: (index: number) =>
                FEATHERS[index % FEATHERS.length].angle,
              svgOrigin: ROOT,
              delay: (index: number) =>
                (index % FEATHERS.length) * UNFURL_STAGGER,
              duration: UNFURL,
              ease: gsapEasing.snap,
            },
            0
          )
          // 퍼덕임: 오른쪽 날개가 위에서 아래로 휘두를 때 왼쪽은 거울이라 부호가 반대다
          .fromTo(
            right,
            { rotation: -FLAP },
            {
              rotation: FLAP,
              duration: HALF_FLAP,
              ease: gsapEasing.drift,
              yoyo: true,
              repeat: FLAP_HALVES - 1,
            },
            0
          )
          .fromTo(
            left,
            { rotation: FLAP },
            {
              rotation: -FLAP,
              duration: HALF_FLAP,
              ease: gsapEasing.drift,
              yoyo: true,
              repeat: FLAP_HALVES - 1,
            },
            0
          )
          // 이륙
          .to(
            body,
            {
              x: flight.dx,
              y: flight.dy,
              duration: TAKEOFF,
              ease: gsapEasing.exit,
            },
            PREP
          )
          .to(
            body,
            { rotation: TILT, duration: TAKEOFF, ease: gsapEasing.settle },
            PREP
          )
          .to(
            body,
            { scale: FAR_SCALE, duration: TAKEOFF, ease: gsapEasing.linear },
            PREP
          )
          .to(
            label,
            {
              opacity: 1,
              duration: gsapDuration.base,
              ease: gsapEasing.settle,
            },
            MARK_AT
          );
      }
      timelineRef.current = timeline;
      host.__wingTimeline = timeline;
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
            // 포커스가 표지로 오면 그 글이 읽히므로 status까지 두면 두 번 읽힌다. 포커스가 없을 때만 status다.
            role={launch.focused ? undefined : 'status'}
            className={mark}
            data-wing-mark=""
          >
            <Glyph name="check" size="sm" />
            {sentLabel}
          </span>
        )}
        {flying &&
          flight &&
          createPortal(
            <div
              className={layer}
              data-wing-layer=""
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
                {(['left', 'right'] as const).map((side) => (
                  <span
                    key={side}
                    ref={side === 'left' ? wingLeftRef : wingRightRef}
                    className={wing}
                    data-side={side}
                    data-wing=""
                  >
                    <svg className={wingSvg} viewBox="0 0 100 100">
                      {FEATHERS.map(({ length }) => (
                        <path
                          key={length}
                          data-feather=""
                          className={feather}
                          d={featherPath(length)}
                        />
                      ))}
                    </svg>
                  </span>
                ))}
                <span ref={cloneHostRef} className={cloneHost} />
              </div>
            </div>,
            container ?? document.body
          )}
      </span>
    );
  }
);

WingButton.displayName = 'WingButton';
