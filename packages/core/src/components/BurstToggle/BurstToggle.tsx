import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { root, slot, ring, dot } from './BurstToggle.css';
import { iconSlot, iconSizeVariants } from '../IconButton/IconButton.css';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gateMotion } from '../../hooks/gateMotion';

export interface BurstToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-pressed'
> {
  /** 켜짐. 상태는 소비자가 쥔다(제어 컴포넌트). `aria-pressed`로 알린다 */
  selected: boolean;
  /** 켜진 아이콘. 채워짐은 두 아이콘의 교체로 만든다 */
  selectedIcon: ReactNode;
  /** 꺼진 아이콘 */
  children: ReactNode;
  /** 단추의 접근 가능한 이름. 상태와 무관하게 고정이다 */
  'aria-label': string;
  /** 비활성화 상태 @default false */
  disabled?: boolean;
}

// 테스트가 현재 타임라인을 읽는 손잡이(IconButton의 __iconButtonJelly와 같은 모양).
type SlotHost = HTMLElement & { __burstSquash?: gsap.core.Timeline };
type RingHost = HTMLElement & { __burstDots?: gsap.core.Timeline };

// 점 개수. 6~8개가 고리로 읽힌다. 45도 간격이 딱 떨어지는 8개로 한다.
const DOT_ANGLES = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
// 점이 퍼지는 거리. 단추 반지름(44px의 절반)이라 점이 단추 가장자리까지 간다.
const SPREAD = 22;
// 켤 때 납작하게 눌리는 배율. 가로로 퍼지고 세로로 눌린다.
const FLAT_X = 1.15;
const FLAT_Y = 0.7;
// 1.2배를 넘겨야 튕김으로 읽힌다. 거기서 spring으로 1에 앉는다.
const POP = 1.3;
// 끌 때 작은 누름
const PRESS = 0.9;

/**
 * 켜면 아이콘이 납작해졌다가 튕기며 커지고, 켜진 아이콘으로 바뀌며 파란 점 고리가 터져 흩어지는
 * 토글 단추(좋아요, 저장, 즐겨찾기). 끌 때는 작게 눌리며 조용히 꺼진 아이콘으로 바뀐다. 터짐은 이
 * 단추의 click이 꺼짐에서 켜짐으로 보낼 때만 일어난다. 처음부터 켜져 있거나 바깥에서 `selected`가
 * 바뀌어도 터지지 않는다. 움직임 줄이기에서는 아이콘만 바뀐다.
 */
export const BurstToggle = forwardRef<HTMLButtonElement, BurstToggleProps>(
  (
    {
      selected,
      selectedIcon,
      children,
      onClick,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const reduced = useReducedMotion();
    const slotRef = useRef<SlotHost>(null);
    const ringRef = useRef<RingHost>(null);
    // 터짐 한 번의 번호. 있는 동안만 점 노드가 DOM에 있다(null이면 없다)
    const [burst, setBurst] = useState<number | null>(null);

    // 점 고리가 새로 생길 때 퍼뜨린다. 끝나면 노드를 거두고, 정리 함수가 도중 교체·언마운트를 맡는다.
    useLayoutEffect(() => {
      const el = ringRef.current;
      if (burst === null || !el) return;
      const timeline = gateMotion(reduced, () =>
        gsap.timeline({ onComplete: () => setBurst(null) }).fromTo(
          Array.from(el.children),
          { x: 0, y: 0, scale: 1, opacity: 1 },
          {
            x: (i: number) => Math.cos(DOT_ANGLES[i]) * SPREAD,
            y: (i: number) => Math.sin(DOT_ANGLES[i]) * SPREAD,
            scale: 0.3,
            opacity: 0,
            duration: gsapDuration.slower,
            ease: gsapEasing.settle,
          }
        )
      );
      el.__burstDots = timeline;
      return () => {
        timeline.kill();
      };
    }, [burst, reduced]);

    useEffect(() => {
      const el = slotRef.current;
      return () => {
        el?.__burstSquash?.kill();
      };
    }, []);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      const el = slotRef.current;
      if (!el) return;
      el.__burstSquash?.kill();
      if (selected) {
        // 끄기: 진행 중 터짐은 점 노드째 거두고(정리 함수가 트윈을 죽인다) 작게 눌리기만 한다
        setBurst(null);
        el.__burstSquash = gateMotion(reduced, () =>
          gsap
            .timeline()
            .to(el, {
              scale: PRESS,
              duration: gsapDuration.fast,
              ease: gsapEasing.settle,
            })
            .to(el, {
              scale: 1,
              duration: gsapDuration.base,
              ease: gsapEasing.settle,
            })
        );
        return;
      }
      // ponytail: 켜짐으로 가는 click이면 소비자가 거절해도 터진다, 거절 흐름이 생기면 selected가 바뀐 뒤로 미룬다
      // 축소 모션이면 게이트가 터짐을 첫 페인트 전에 끝 상태로 확정해 점 노드를 바로 거둔다
      setBurst((n) => (n ?? 0) + 1);
      el.__burstSquash = gateMotion(reduced, () =>
        gsap
          .timeline()
          .to(el, {
            scaleX: FLAT_X,
            scaleY: FLAT_Y,
            duration: gsapDuration.fast,
            ease: gsapEasing.settle,
          })
          .to(el, {
            scale: POP,
            duration: gsapDuration.fast,
            ease: gsapEasing.settle,
          })
          .to(el, {
            scale: 1,
            duration: gsapDuration.slower,
            ease: gsapEasing.spring,
          })
      );
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={clsx(root, className)}
        {...props}
        aria-pressed={selected}
        onClick={handleClick}
      >
        <span
          ref={slotRef}
          data-burst-slot=""
          aria-hidden="true"
          className={clsx(iconSlot, iconSizeVariants.md, slot)}
        >
          {selected ? selectedIcon : children}
        </span>
        {burst !== null && (
          <span
            key={burst}
            ref={ringRef}
            data-burst-ring=""
            aria-hidden="true"
            className={ring}
          >
            {DOT_ANGLES.map((angle) => (
              <span key={angle} data-burst-dot="" className={dot} />
            ))}
          </span>
        )}
      </button>
    );
  }
);

BurstToggle.displayName = 'BurstToggle';
