import { describe, it, expect } from 'vitest';
import { gsap } from 'gsap';
import { addSheetOvershoot, addSheetStagger } from './sheetFloat';
import { gateMotion } from '../hooks/gateMotion';
import { gsapDuration, gsapEasing } from '../tokens/gsapEasing';

type TweenLike = gsap.core.Tween & { vars: gsap.TweenVars };

const sizedSheet = (width: number, height: number) => {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetWidth', { value: width });
  Object.defineProperty(el, 'offsetHeight', { value: height });
  return el;
};
/** 축소 선호가 아닌 평범한 타임라인. 게이트 강제 검사(gsapGateEnforcement)가 요구해 게이트를 거친다. */
const newTimeline = () =>
  gateMotion(false, () => gsap.timeline({ paused: true }));
const tweensOf = (timeline: gsap.core.Timeline) =>
  timeline.getChildren() as TweenLike[];

describe('addSheetOvershoot', () => {
  it('xPercent 100(오른쪽)은 폭 기준 -16px로 지나쳤다 0으로 앉는다', () => {
    const timeline = newTimeline();
    addSheetOvershoot(timeline, sizedSheet(400, 900), 'xPercent', 100);
    const [up, settle, ...rest] = tweensOf(timeline);

    expect(rest).toHaveLength(0);
    // 16px / 400px = 4%
    expect(up.vars.xPercent).toBeCloseTo(-4, 5);
    expect(up.vars.ease).toBe(gsapEasing.settle);
    expect(up.duration()).toBeCloseTo(gsapDuration.slow, 5);
    expect(settle.vars.xPercent).toBe(0);
    expect(settle.vars.ease).toBe(gsapEasing.drift);
    expect(settle.startTime()).toBeCloseTo(gsapDuration.slow, 5);
  });

  it('xPercent -100(왼쪽)은 부호가 뒤집혀 +16px 상당으로 지나친다', () => {
    const timeline = newTimeline();
    addSheetOvershoot(timeline, sizedSheet(400, 900), 'xPercent', -100);

    expect(tweensOf(timeline)[0].vars.xPercent).toBeCloseTo(4, 5);
  });

  it('yPercent는 높이를 읽고 yPercent 채널만 쓴다', () => {
    const timeline = newTimeline();
    addSheetOvershoot(timeline, sizedSheet(999, 200), 'yPercent', 100);
    const tweens = tweensOf(timeline);

    // 16px / 200px = 8%
    expect(tweens[0].vars.yPercent).toBeCloseTo(-8, 5);
    for (const t of tweens) expect(t.vars).not.toHaveProperty('xPercent');
  });

  it('크기를 읽을 수 없으면(0) 넘침 없이 from → 0 하나다', () => {
    const timeline = newTimeline();
    addSheetOvershoot(timeline, sizedSheet(0, 0), 'xPercent', 100);
    const tweens = tweensOf(timeline);

    expect(tweens).toHaveLength(1);
    expect(tweens[0].vars.xPercent).toBe(0);
    expect(tweens[0].vars.ease).toBe(gsapEasing.settle);
  });
});

describe('addSheetStagger', () => {
  it('항목이 없으면 null이고 등장 타임라인에 아무것도 걸지 않는다', () => {
    const timeline = newTimeline();

    expect(addSheetStagger(timeline, [], false)).toBeNull();
    expect(timeline.getChildren()).toHaveLength(0);
  });

  it('시작 오프셋을 넘기면 그 값에서 0으로, 안 넘기면 24에서 0으로 뜬다', () => {
    const own = document.createElement('p');
    const dflt = document.createElement('p');
    const fromAbove = addSheetStagger(newTimeline(), [own], false, -24)!;
    const fromBelow = addSheetStagger(newTimeline(), [dflt], false)!;
    const yOf = (t: gsap.core.Timeline) =>
      (
        tweensOf(t).find((x) => x.vars.y === 0)!.vars as gsap.TweenVars & {
          startAt?: gsap.TweenVars;
        }
      ).startAt?.y;

    expect(yOf(fromAbove)).toBe(-24);
    expect(yOf(fromBelow)).toBe(24);
  });

  it('축소 선호면 만들자마자 끝으로 확정되고, 등장이 시차 지점을 지나도 아무것도 하지 않는다', () => {
    const timeline = newTimeline();
    const item = document.createElement('p');
    timeline.to({}, { duration: 1 });
    const stagger = addSheetStagger(timeline, [item], true)!;

    expect(stagger.progress()).toBe(1);
    expect(item.style.opacity).toBe('1');
    expect(stagger.isActive()).toBe(false);

    timeline.time(gsapDuration.slow * 0.6 + 0.05);

    // 죽은 타임라인을 다시 돌리지 않는다.
    expect(stagger.progress()).toBe(1);
    expect(stagger.paused()).toBe(true);
  });
});
