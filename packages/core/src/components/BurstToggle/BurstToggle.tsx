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
// 점이 퍼지는 거리. 단추 반지름(44px의 절반)의 1.5배라 점이 단추 테두리 밖 11px까지 나간다.
// 가장자리(1배)에서 끝나면 점이 아이콘 둘레의 후광으로 읽혀 터져 흩어지는 느낌이 안 난다.
const BUTTON_RADIUS = 22;
const SPREAD = BUTTON_RADIUS * 1.5;
// 점은 처음 40%가 지나서야 사라지기 시작한다. 처음부터 옅어지면 160ms쯤에 이미 안 보인다.
const FADE_DELAY = gsapDuration.slower * 0.4;
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
 * 단추의 click이 꺼짐에서 켜짐으로 보낸 때(소비자가 `selected`를 실제로 켠 때)만 일어난다. 처음부터 켜져 있거나 바깥에서 `selected`가
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
    // 켜려고 눌렀다는 표지. 터짐은 selected가 실제로 true가 된 렌더에서 이 표지가 있을 때만 일어난다
    const [armed, setArmed] = useState(false);
    const [prevSelected, setPrevSelected] = useState(selected);
    // 터짐 한 번의 번호. 있는 동안만 점 노드가 DOM에 있다(null이면 없다)
    const [burst, setBurst] = useState<number | null>(null);

    // 점 고리가 새로 생길 때 퍼뜨린다. 끝나면 노드를 거두고, 정리 함수가 도중 교체·언마운트를 맡는다.
    useLayoutEffect(() => {
      const el = ringRef.current;
      if (burst === null || !el) return;
      const dots = Array.from(el.children);
      const timeline = gateMotion(reduced, () =>
        gsap
          .timeline({ onComplete: () => setBurst(null) })
          .fromTo(
            dots,
            { x: 0, y: 0 },
            {
              x: (i: number) => Math.cos(DOT_ANGLES[i]) * SPREAD,
              y: (i: number) => Math.sin(DOT_ANGLES[i]) * SPREAD,
              duration: gsapDuration.slower,
              ease: gsapEasing.settle,
            }
          )
          // 작아짐과 사라짐은 linear로 따로 돈다. settle은 앞에서 거의 끝나 점이 160ms쯤에 이미 안 보인다.
          // 점은 4px라 0.6배(약 2.4px)까지만 줄여 흩어지는 동안에도 보이게 한다
          .fromTo(
            dots,
            { scale: 1 },
            {
              scale: 0.6,
              duration: gsapDuration.slower,
              ease: gsapEasing.linear,
            },
            '<'
          )
          .to(
            dots,
            {
              opacity: 0,
              duration: gsapDuration.slower - FADE_DELAY,
              ease: gsapEasing.linear,
            },
            `<+=${FADE_DELAY}`
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

    // selected가 바뀐 렌더 안에서 이전 값과 견주어 터뜨린다(효과 안 setState는 lint가 막는다).
    // 표지는 한 번 쓰고 지운다. 마운트 때의 true와 바깥에서만 바뀐 selected는 표지가 없어 터지지 않는다.
    // ponytail: 소비자가 켜짐을 거절하면 표지가 다음 click까지 남아, 그 사이 바깥에서 selected가 켜지면 터진다, 거절 뒤 표지를 지우는 신호가 생기면 그때 지운다
    if (selected !== prevSelected) {
      setPrevSelected(selected);
      if (selected && armed) {
        setArmed(false);
        setBurst((n) => (n ?? 0) + 1);
      }
    }

    // 터짐이 새로 설 때 아이콘 칸을 납작했다 튕기게 한다. 축소 모션이면 게이트가 터짐을 첫 페인트 전에
    // 끝 상태로 확정해 점 노드도 바로 거둔다.
    useLayoutEffect(() => {
      const el = slotRef.current;
      if (burst === null || !el) return;
      el.__burstSquash?.kill();
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
    }, [burst, reduced]);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      const el = slotRef.current;
      if (!el) return;
      if (selected) {
        setArmed(false);
        el.__burstSquash?.kill();
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
      // 켜려고 눌렀다는 표지만 세운다. 지난 click이 남긴 표지도 이 click이 새로 쓴다. 터짐은 selected가 실제로 true가 된 렌더의 효과가 쓴다
      setArmed(true);
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
