import { type StyleRule } from '@vanilla-extract/css';
import { themeContract } from '../tokens/theme.css';

export type BubblePosition = 'top' | 'bottom' | 'left' | 'right';
type DurationName = keyof typeof themeContract.animation.duration;
type EasingName = keyof typeof themeContract.animation.easing;
interface Motion {
  duration: DurationName;
  easing: EasingName;
}

/**
 * 두 bubble(Popover, Tooltip)이 실제로 다른 값만 받는다. 방향별 배치,
 * transform-origin, visibility 트릭은 함수 안에 한 번만 있다.
 */
export interface BubbleSpec {
  /** 닫힘 상태의 시작 scale. 작을수록 많이 움직이고 snap의 오버슛이 커진다 */
  scale: number;
  /** 닫힘 상태의 트리거 쪽 오프셋(px) */
  closedOffset: number;
  /** 열림 상태의 오프셋(px) */
  openOffset: number;
  /** 등장 transform의 길이와 커브 */
  enterTransform: Motion;
  /** 등장 opacity의 길이와 커브. transform과 일부러 다르게 둔다 */
  enterOpacity: Motion;
  /** 퇴장 길이의 기준. 실제 퇴장은 이 길이의 0.65배 + exit 커브다(조항 3) */
  exitDuration: DurationName;
}

// 방향별 위치. 화살표가 붙는 쪽이 transform-origin이다. 그 쪽은 거의 안
// 움직이고 반대쪽 몸통이 scale로 펼쳐진다. 트리거가 자기를 부른 자리에서
// 나오는 것(O1)을 지연 체인 없이 표현한다.
const PLACEMENT: Record<
  BubblePosition,
  {
    box: StyleRule;
    origin: string;
    translate: (px: number) => string;
  }
> = {
  top: {
    box: { bottom: '100%', left: '50%' },
    origin: 'bottom center',
    translate: (px) => `translateX(-50%) translateY(${-px}px)`,
  },
  bottom: {
    box: { top: '100%', left: '50%' },
    origin: 'top center',
    translate: (px) => `translateX(-50%) translateY(${px}px)`,
  },
  left: {
    box: { right: '100%', top: '50%' },
    origin: 'right center',
    translate: (px) => `translateY(-50%) translateX(${-px}px)`,
  },
  right: {
    box: { left: '100%', top: '50%' },
    origin: 'left center',
    translate: (px) => `translateY(-50%) translateX(${px}px)`,
  },
};

const POSITIONS = Object.keys(PLACEMENT) as BubblePosition[];

const { duration, easing } = themeContract.animation;
const motion = ({ duration: d, easing: e }: Motion) =>
  `${duration[d]} ${easing[e]}`;

const mapPositions = (
  build: (position: BubblePosition) => StyleRule
): Record<BubblePosition, StyleRule> =>
  Object.fromEntries(POSITIONS.map((p) => [p, build(p)])) as Record<
    BubblePosition,
    StyleRule
  >;

/**
 * 방향 4개 x 상태 2개(닫힘, 열림)의 스타일 객체를 만든다. 호출하는 쪽이
 * `styleVariants`에 넣는다. 방향 오프셋과 상태 scale이 같은 transform 하나에
 * 있어야 해서 방향 x 상태로 묶는다.
 *
 * 닫힘은 마운트 첫 프레임과 퇴장 도착지가 함께 쓴다(컴포넌트의 `visible`
 * 플래그가 false일 때). 열림의 transform-origin은 닫힘과 같아야 펼쳐지는
 * 방향이 유지된다.
 *
 * 닫힌 뒤에도 노드는 퇴장 길이만큼 더 남는다(컴포넌트의 shouldRender).
 * opacity: 0은 히트 테스트에서도 접근성 트리에서도 요소를 빼지 않아서, 그
 * 사이 클릭이 보이지 않는 요소에 먹히고 스크린 리더가 그걸 읽는다(리뷰 I1).
 * visibility: hidden이 양쪽에서 빼되, 한쪽 끝이 visible이면 중간값이 전부
 * visible이고 p=1에서만 넘어가는 성질이 있어 퇴장과 같은 길이를 주면 페이드를
 * 다 보여준 뒤 마지막 프레임에 숨는다. 지연 0s로 걸면 페이드가 통째로 죽는다.
 * 열림 쪽은 전이 목록에서 빼 즉시 켠다.
 */
export const bubbleStyles = (spec: BubbleSpec) => {
  const exit = `calc(${duration[spec.exitDuration]} * 0.65) ${easing.exit}`;

  const closed = mapPositions((position) => {
    const { box, origin, translate } = PLACEMENT[position];
    return {
      ...box,
      transformOrigin: origin,
      transform: `${translate(spec.closedOffset)} scale(${spec.scale})`,
      opacity: 0,
      pointerEvents: 'none',
      visibility: 'hidden',
      // 퇴장이 다 보인 뒤에 숨는다. visibility는 p=1에서만 넘어간다(위 머리말).
      transition: `opacity ${exit}, transform ${exit}, visibility ${exit}`,
    };
  });

  const open = mapPositions((position) => {
    const { box, origin, translate } = PLACEMENT[position];
    return {
      ...box,
      transformOrigin: origin,
      transform: `${translate(spec.openOffset)} scale(1)`,
      opacity: 1,
      visibility: 'visible',
      transition: `opacity ${motion(spec.enterOpacity)}, transform ${motion(spec.enterTransform)}`,
    };
  });

  return { closed, open };
};
