/**
 * 진행값 `t`가 채움·상자를 어떻게 움직이는지 정하는 순수 함수.
 *
 * 값은 SpringCheck의 `readings()`(채움 `scale(max(t, 0))`, 상자
 * `scale(1 + SWELL × max(0, t - 1))`)를 가져왔다. `t`는 0(해제)과 1(체크) 사이를
 * 오가고, 스프링 커브가 1을 넘기면 그 순간에만 상자가 부푼다. 0 아래로 넘쳐도
 * 채움(`max(t, 0)`)이 잘라서 해제에는 부풂이 없다.
 *
 * 체크 획은 `t`를 따르지 않는다(SpringCheck의 `1 - clamp(t)`를 쓰지 않았다). 스프링이
 * 길이의 16%에 1을 지나 그리기가 54ms로 줄고 끝이 0.5px 되감겼다(실측). 그려지는
 * 효과는 사용자가 유지하라고 한 것이라 획은 자기 트윈(`slow` `settle`)으로 그어진다.
 */

/**
 * 상자 부풂 계수. SpringCheck.tsx:25의 `SWELL = 0.35`다. `spring` 토큰
 * (`elastic.out(1, 0.5)`)의 정점이 1.2044라 상자는 최대 1 + 0.35 × 0.2044 = 1.0715배
 * (20px 상자면 0.7px씩)까지 부푼다.
 */
export const SWELL = 0.35;

export interface ProgressFrame {
  /** 채움 층의 scale. 상자 가운데에서 차오른다. */
  fill: number;
  /** 상자의 scale. `t`가 1을 넘을 때만 1보다 커진다. */
  box: number;
}

export const progressFrame = (t: number): ProgressFrame => ({
  fill: Math.max(t, 0),
  box: 1 + SWELL * Math.max(0, t - 1),
});
