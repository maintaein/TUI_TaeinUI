/**
 * 진행값 `t`가 채움·상자·체크 획을 어떻게 움직이는지 정하는 순수 함수.
 *
 * 값은 SpringCheck의 `readings()`(채움 `scale(max(t, 0))`, 상자
 * `scale(1 + SWELL × max(0, t - 1))`, 획 `1 - clamp(t)`)를 가져왔다. `t`는 0(해제)과
 * 1(체크) 사이를 오가고, 스프링 커브가 1을 넘기면 그 순간에만 상자가 부푼다.
 * 0 아래로 넘쳐도 채움(`max(t, 0)`)과 획(`clamp01`)이 잘라서 해제에는 부풂이 없다.
 */

/**
 * 상자 부풂 계수. SpringCheck.tsx:25의 `SWELL = 0.35`다. `spring` 토큰
 * (`elastic.out(1, 0.5)`)의 정점이 1.2044라 상자는 최대 1 + 0.35 × 0.2044 = 1.0715배
 * (20px 상자면 0.7px씩)까지 부푼다.
 */
export const SWELL = 0.35;

export const clamp01 = (value: number): number =>
  Math.min(1, Math.max(0, value));

export interface ProgressFrame {
  /** 채움 층의 scale. 상자 가운데에서 차오른다. */
  fill: number;
  /** 상자의 scale. `t`가 1을 넘을 때만 1보다 커진다. */
  box: number;
  /** 체크 획의 `strokeDashoffset`. `length`는 지금 모양의 path 길이다. */
  dashoffset: number;
}

export const progressFrame = (t: number, length: number): ProgressFrame => ({
  fill: Math.max(t, 0),
  box: 1 + SWELL * Math.max(0, t - 1),
  dashoffset: length * (1 - clamp01(t)),
});
