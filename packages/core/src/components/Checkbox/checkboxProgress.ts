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

/**
 * `spring` 토큰(`elastic.out(1, 0.5)`)의 정점 1.2044에서 1을 뺀 값. 값의 출처는
 * 위 SWELL 주석과 같다(상자 정점 1 + SWELL × SPRING_OVERSHOOT).
 */
export const SPRING_OVERSHOOT = 0.2044;

/**
 * 해제 때 상자가 안으로 움츠리는 끝값 `s`. 체크 때 바깥으로 부푼 증가분
 * (SWELL × SPRING_OVERSHOOT = 0.0715)과 같은 양이라 부풂과 움츠림이 짝이 된다.
 */
export const SQUEEZE = 1 - SWELL * SPRING_OVERSHOOT;

export interface ProgressFrame {
  /** 채움 층의 scale. 상자 가운데에서 차오른다. */
  fill: number;
  /** 상자의 scale. 부풂(`t`가 1을 넘을 때)과 움츠림 `s`의 곱이다. */
  box: number;
}

/**
 * `s`는 해제 때 상자가 움츠리는 두 번째 진행값이다(평소 1). 상자 transform을 쓰는
 * 곳이 하나이도록 부풂 × `s`로 합성한다.
 */
export const progressFrame = (t: number, s: number): ProgressFrame => ({
  fill: Math.max(t, 0),
  box: (1 + SWELL * Math.max(0, t - 1)) * s,
});
