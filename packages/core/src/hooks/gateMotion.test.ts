import { describe, it, expect, afterEach } from 'vitest';
import { gsap } from 'gsap';
import { gateMotion, settleMotion } from './gateMotion';

// gsap은 devDependency다. 여기서만 쓰고 src 구현은 참조하지 않는다 —
// 게이트는 구조 타입으로 트윈을 받고, 진짜 트윈으로 검증한다(대역 없음).
const createTarget = (): HTMLElement => {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return element;
};

afterEach(() => {
  gsap.globalTimeline.clear();
  document.body.innerHTML = '';
});

describe('gateMotion', () => {
  it('축소일 때 최종 상태를 즉시 적용해야 한다', () => {
    const element = createTarget();

    gateMotion(true, () => gsap.to(element, { opacity: 0.25, duration: 1 }));

    expect(element.style.opacity).toBe('0.25');
  });

  it('축소일 때 무한 반복 애니메이션도 멈춰야 한다', () => {
    const element = createTarget();

    // 끝나는 트윈은 progress(1)만으로도 타임라인에서 빠진다. 무한 반복은
    // 안 빠지므로 정리 경로(kill)가 실제로 도는지는 여기서만 잡힌다.
    gateMotion(true, () =>
      gsap.to(element, { opacity: 0.25, duration: 1, repeat: -1 })
    );

    expect(element.style.opacity).toBe('0.25');
    expect(gsap.isTweening(element)).toBe(false);
    expect(gsap.getTweensOf(element)).toHaveLength(0);
  });

  it('축소가 아니면 애니메이션을 그대로 돌려야 한다', () => {
    const element = createTarget();

    const tween = gateMotion(false, () =>
      gsap.to(element, { opacity: 0.25, duration: 1 })
    );

    // 최종 상태로 건너뛰지 않았다
    expect(element.style.opacity).toBe('');
    expect(tween.progress()).toBe(0);
    expect(gsap.getTweensOf(element)).toHaveLength(1);
  });

  it('호출자가 넘긴 인스턴스를 그대로 반환해야 한다', () => {
    const element = createTarget();
    const tween = gsap.to(element, { opacity: 0.25, duration: 1 });

    expect(gateMotion(false, () => tween)).toBe(tween);
  });
});

describe('settleMotion', () => {
  it('진행 중인 트윈을 최종 상태로 확정하고 정리해야 한다', () => {
    const element = createTarget();
    const tween = gsap.to(element, { opacity: 0.25, duration: 1 });

    tween.progress(0.5);
    expect(element.style.opacity).not.toBe('0.25');

    settleMotion(tween);

    expect(element.style.opacity).toBe('0.25');
    expect(gsap.getTweensOf(element)).toHaveLength(0);
  });

  it('타임라인도 최종 상태로 확정해야 한다', () => {
    const element = createTarget();
    const timeline = gsap
      .timeline()
      .to(element, { opacity: 0.5, duration: 1 })
      .to(element, { opacity: 0.25, duration: 1 });

    settleMotion(timeline);

    expect(element.style.opacity).toBe('0.25');
  });
});
