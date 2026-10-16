/**
 * 게이트가 실제로 쓰는 애니메이션 인터페이스만 추린 구조 타입.
 *
 * gsap은 이제 dependencies라 번들에 들어가도 된다. 그래도 값이든 타입이든
 * import하지 않고 구조로만 받는다. 이유는 번들 경계가 아니라 엔진 비의존이다:
 * GSAP의 Tween·Timeline 인스턴스가 둘 다 이 모양을 만족하므로, 호출자가 자기
 * 엔진으로 만든 인스턴스를 그대로 넘기면 된다. 엔진이 바뀌어도 이 파일은 안
 * 바뀐다. (금지된 건 gsap/all뿐이다. 검사는 import/require 기준이다. .d.ts와
 * 소스맵에 그대로 남는 "gsap/all" 같은 주석 글자는 번들도 의존성도 만들지
 * 않는다. animationBoundary.test.ts가 이 주석을 그 검사의 반증으로 쓴다.)
 */
export interface MotionAnimation {
  progress(value: number): unknown;
  kill(): unknown;
}

/**
 * 진행 중인 애니메이션을 최종 상태로 확정하고 정리한다.
 *
 * kill()만 하면 중간 상태에서 멈춰 UI가 깨진다. 끝 상태를 먼저 적용한 뒤 죽인다.
 * 마운트 뒤에 축소 선호가 켜졌을 때(=이미 돌고 있는 트윈이 있을 때) 이 경로를 쓴다.
 */
export const settleMotion = (animation: MotionAnimation): void => {
  animation.progress(1);
  animation.kill();
};

/**
 * 모션 축소 선호에 따라 애니메이션을 통과시키거나 최종 상태로 확정한다.
 *
 * CSS 전역 reduce 규칙은 인라인 스타일로 도는 트윈을 못 잡는다. 그 짝으로 JS
 * 쪽에서 같은 판단을 한다.
 *
 * @param reduced 모션 축소 선호 여부. useReducedMotion()의 반환값을 넘긴다
 * @param createAnimation 애니메이션 생성자. 축소여도 호출된다. 끝 상태를 알아야
 *   그 상태로 확정할 수 있기 때문이다(트윈은 렌더 전에 정리되므로 화면에는 안 보인다)
 * @returns 생성된 애니메이션. 축소였다면 이미 정리된 상태다
 */
export const gateMotion = <TAnimation extends MotionAnimation>(
  reduced: boolean,
  createAnimation: () => TAnimation
): TAnimation => {
  const animation = createAnimation();

  if (reduced) {
    settleMotion(animation);
  }

  return animation;
};
