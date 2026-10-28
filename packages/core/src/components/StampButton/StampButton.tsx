import {
  forwardRef,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { Button } from '../Button';
import { visuallyHidden } from '../../_internal/visuallyHidden.css';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gateMotion } from '../../hooks/gateMotion';
import { root, locked, label, layer, mark, face, ink } from './StampButton.css';

export interface StampButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** 단추 글자이자 접근 가능한 이름 */
  children: ReactNode;
  /** 도장 글자. 찍힌 뒤 보조기기 알림 문장에도 들어간다 @default '승인' */
  stampLabel?: string;
  /** 비활성화 상태. 비활성이면 찍히지 않는다 @default false */
  disabled?: boolean;
}

// 테스트가 현재 타임라인을 읽는 손잡이(BurstToggle의 __burstDots와 같은 모양).
type MarkHost = HTMLElement & { __stampTimeline?: gsap.core.Timeline };

// Button md의 높이. size를 받지 않아 고정이다. 도장은 이 높이의 1.5배 위에서 내려온다.
const BUTTON_HEIGHT = 44;
const FALL = BUTTON_HEIGHT * 1.5;
// 내려오는 도장의 처음 배율과 기울기. 기울기는 끝까지 유지된다.
const START_SCALE = 1.6;
const TILT = -8;
// 도장은 slow 동안 exit(power2.in)로 가속하며 내려오고 끝에 닿는다. 쾅과 인주는 그 순간에 시작한다.
// snap(back.out)으로 내리면 진행의 37%(110ms)에 이미 닿고 앞에서 대부분 끝나 내려오는 모습이 안 보인다(실측).
const LAND = gsapDuration.slow;
// 도장이 보이기 시작하는 구간. 내려오는 첫 15%에 걸쳐 나타난다.
const APPEAR = gsapDuration.slow * 0.15;
// 쾅: 단추는 fast의 절반을 내려갔다 절반을 올라온다(yoyo, 합쳐 fast). 도장 면은 그 3분의 1로 아주 짧게 납작해진다.
const KNOCK = gsapDuration.fast / 2;
const FLAT = gsapDuration.fast / 3;
const KNOCK_Y = 1;
const FLAT_Y = 0.92;
// 인주 마스크 원의 끝 반지름. viewBox(100x60) 가운데에서 모서리까지 약 58.3이라 60이면 자국 전체가 드러난다.
const INK_R = 60;
const STATUS_SUFFIX = ' 도장을 찍었습니다';

/**
 * 결재·제출·승인 단추. 누르면 도장이 위에서 1.6배로 내려와 쾅 찍히고(단추가 1px 눌린다), 도장 둘레로 옅은
 * 파란 인주가 번진다. 도장은 -8deg로 기운 채 남고 단추 글자는 도장 뒤로 옅게 비친다. 한 번만 찍히며, 찍힌
 * 뒤에는 `aria-disabled`로 잠겨(포커스는 남는다) 다시 눌러도 `onClick`이 불리지 않는다. 되돌리기 API는 없고
 * 소비자가 `key`를 바꿔 다시 그린다. 움직임 줄이기에서는 도장과 인주가 끝 상태로 바로 나타난다.
 */
export const StampButton = forwardRef<HTMLButtonElement, StampButtonProps>(
  (
    {
      children,
      stampLabel = '승인',
      disabled = false,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const reduced = useReducedMotion();
    const [stamped, setStamped] = useState(false);
    const rootRef = useRef<HTMLSpanElement>(null);
    const markRef = useRef<MarkHost>(null);
    const faceRef = useRef<HTMLSpanElement>(null);
    const circleRef = useRef<SVGCircleElement>(null);
    // 마스크 id는 문서 안에서 유일해야 한다. useId의 특수문자는 url(#...)에 안전하지 않아 걷어 낸다
    const maskId = `stamp-ink-${useId().replace(/\W/g, '')}`;

    // 도장이 새로 설 때 내려와 찍고 인주가 번진다. 정리 함수가 언마운트와 key 교체 도중의 트윈을 죽인다.
    useLayoutEffect(() => {
      const host = rootRef.current;
      const el = markRef.current;
      const faceEl = faceRef.current;
      const circle = circleRef.current;
      if (!stamped || !host || !el || !faceEl || !circle) return;
      const timeline = gateMotion(reduced, () =>
        gsap
          .timeline()
          .fromTo(
            el,
            { y: -FALL, scale: START_SCALE, rotation: TILT },
            {
              y: 0,
              scale: 1,
              rotation: TILT,
              duration: gsapDuration.slow,
              ease: gsapEasing.exit,
            },
            0
          )
          .fromTo(
            el,
            { opacity: 0 },
            { opacity: 1, duration: APPEAR, ease: gsapEasing.linear },
            0
          )
          .to(
            host,
            {
              y: KNOCK_Y,
              duration: KNOCK,
              ease: gsapEasing.settle,
              yoyo: true,
              repeat: 1,
            },
            LAND
          )
          .to(
            faceEl,
            {
              scaleY: FLAT_Y,
              duration: FLAT,
              ease: gsapEasing.settle,
              yoyo: true,
              repeat: 1,
            },
            LAND
          )
          .fromTo(
            circle,
            { attr: { r: 0 } },
            {
              attr: { r: INK_R },
              duration: gsapDuration.slower,
              ease: gsapEasing.settle,
            },
            LAND
          )
      );
      el.__stampTimeline = timeline;
      return () => {
        timeline.kill();
      };
    }, [stamped, reduced]);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      // 잠금: 찍힌 뒤에는 click이 와도(Enter와 Space도 click이 된다) 소비자에게 알리지 않는다.
      // type="submit"의 폼 제출도 click의 기본 동작이라 막는다(이중 제출 방지)
      if (stamped) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
      if (event.defaultPrevented) return;
      setStamped(true);
    };

    return (
      <span
        ref={rootRef}
        className={root}
        data-stamped={stamped ? '' : undefined}
      >
        <Button
          {...props}
          ref={ref}
          variant="light"
          className={clsx(locked, className)}
          data-stamped={stamped ? '' : undefined}
          disabled={disabled}
          aria-disabled={disabled || stamped}
          onClick={handleClick}
        >
          <span className={label} data-stamped={stamped ? '' : undefined}>
            {children}
          </span>
        </Button>
        {stamped && (
          <span aria-hidden="true" className={layer}>
            <span ref={markRef} data-stamp-mark="" className={mark}>
              <svg
                data-stamp-ink=""
                className={ink}
                viewBox="0 0 100 60"
                preserveAspectRatio="none"
              >
                <defs>
                  <mask id={maskId}>
                    <circle
                      ref={circleRef}
                      cx="50"
                      cy="30"
                      r="0"
                      fill="white"
                    />
                  </mask>
                </defs>
                <path
                  d="M12 30C10 12 30 4 52 6C78 4 94 14 92 32C95 48 76 56 50 54C26 57 8 48 12 30Z"
                  fill="currentColor"
                  fillOpacity="0.16"
                  mask={`url(#${maskId})`}
                />
              </svg>
              <span ref={faceRef} data-stamp-face="" className={face}>
                {stampLabel}
              </span>
            </span>
          </span>
        )}
        <span className={visuallyHidden} role="status" aria-live="polite">
          {stamped ? `${stampLabel}${STATUS_SUFFIX}` : ''}
        </span>
      </span>
    );
  }
);

StampButton.displayName = 'StampButton';
