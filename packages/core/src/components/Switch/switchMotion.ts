/**
 * 머리가 움직이는 동안의 모양을 정하는 순수 함수.
 *
 * 이동 하나를 진행값 `p`(0 → 1)로 트윈하고, 머리 x·늘임·파란 채움이 모두 이 `p`를
 * 따른다. 늘임은 SquishSwitch처럼 이동 속도에서만 나온다: `p`의 커브가 sine.inOut이라
 * 속도가 한가운데서 가장 크고, 늘임의 사인 종도 한가운데서 가장 크다.
 */
import { thumbDiameter, trackHeight } from './Switch.css';

type SwitchSize = keyof typeof trackHeight;

/**
 * 가장 빠를 때의 늘임 초과분. SquishSwitch의 최대 늘임 0.4 x 기본 강도 0.36
 * (`stretch = 36`)이다. 가로가 1.144배, 세로가 1/1.144배가 된다.
 */
export const STRETCH = 0.144;

/** 켜진 머리가 트랙의 위아래로 넘어서는 길이(px, 한쪽). */
const OVERHANG = 1;

const growTo = (size: SwitchSize): number =>
  (trackHeight[size] + 2 * OVERHANG) / thumbDiameter[size];

/**
 * 켜진 상태의 머리 크기(scale). 트랙 높이보다 위아래 1px씩 크도록 px로 정한다
 * (md: 26 / 20 = 1.3).
 */
export const ON_SCALE = {
  sm: growTo('sm'),
  md: growTo('md'),
  lg: growTo('lg'),
} as const;

export interface ThumbFrame {
  /** 이 순간의 늘임. 1이면 늘지 않았다. */
  k: number;
  scaleX: number;
  scaleY: number;
}

/**
 * `p` 순간의 머리 scale. `base`는 켜진 크기 변화(1 또는 ON_SCALE)이고, 늘임 `k`는
 * 부피를 지키도록 가로에 곱하고 세로에 나눈다(scaleX x scaleY = base^2).
 *
 * `k0`는 이동을 시작할 때 이미 늘어 있던 정도다. 진행 중에 반대로 바뀌어도 늘임이
 * 끊기지 않도록, 시작 때의 초과분(`k0 - 1`)을 `(1 - p)`로 줄여 가며 사인 종에 더한다.
 */
export const thumbFrame = (p: number, base: number, k0 = 1): ThumbFrame => {
  const k = 1 + (k0 - 1) * (1 - p) + STRETCH * Math.sin(Math.PI * p);
  return { k, scaleX: base * k, scaleY: base / k };
};
