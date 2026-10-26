import { describe, it, expect } from 'vitest';
import { gsap } from 'gsap';
import { addSheetOvershoot, addSheetFade } from './sheetFloat';
import { gateMotion } from '../hooks/gateMotion';
import { gsapDuration, gsapEasing } from '../tokens/gsapEasing';

const SHEET_PACE = 1.3;

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
    expect(up.duration()).toBeCloseTo(gsapDuration.slow * SHEET_PACE, 5);
    expect(settle.vars.xPercent).toBe(0);
    expect(settle.duration()).toBeCloseTo(gsapDuration.base * SHEET_PACE, 5);
    expect(timeline.duration()).toBeCloseTo(
      (gsapDuration.slow + gsapDuration.base) * SHEET_PACE,
      5
    );
    expect(settle.vars.ease).toBe(gsapEasing.drift);
    expect(settle.startTime()).toBeCloseTo(gsapDuration.slow * SHEET_PACE, 5);
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

describe('addSheetFade', () => {
  it('keeps the default BoardRow fade at 60 percent of unscaled slow', () => {
    const timeline = newTimeline();
    const fade = addSheetFade(timeline, [document.createElement('p')], false)!;
    timeline.to({}, { duration: gsapDuration.slow });
    timeline.time(gsapDuration.slow * 0.6 - 0.01);
    expect(fade.paused()).toBe(true);
    timeline.time(gsapDuration.slow * 0.6 + 0.01);
    expect(fade.paused()).toBe(false);
    fade.kill();
    timeline.kill();
  });

  it('항목이 없으면 null이고 등장 타임라인에 아무것도 걸지 않는다', () => {
    const timeline = newTimeline();

    expect(addSheetFade(timeline, [], false)).toBeNull();
    expect(timeline.getChildren()).toHaveLength(0);
  });

  it('항목 수와 무관하게 opacity만 fast 동안 함께 바뀐다', () => {
    const items = Array.from({ length: 10 }, () => document.createElement('p'));
    const fade = addSheetFade(newTimeline(), items, false)!;
    fade.pause().time(gsapDuration.fast / 2);

    expect(fade.duration()).toBeCloseTo(gsapDuration.fast, 5);
    expect(tweensOf(fade)).toHaveLength(1);
    for (const item of items) {
      expect(Number(item.style.opacity)).toBeGreaterThan(0);
      expect(Number(item.style.opacity)).toBeLessThan(1);
      expect(item.style.opacity).toBe(items[0].style.opacity);
      expect(item.style.transform).toBe('');
    }
    fade.kill();
  });

  it('축소 선호면 만들자마자 끝으로 확정되고, 등장이 페이드 지점을 지나도 아무것도 하지 않는다', () => {
    const timeline = newTimeline();
    const item = document.createElement('p');
    timeline.to({}, { duration: 1 });
    const fade = addSheetFade(timeline, [item], true)!;

    expect(fade.progress()).toBe(1);
    expect(item.style.opacity).toBe('1');
    expect(fade.isActive()).toBe(false);

    timeline.time(gsapDuration.slow * 0.6 + 0.05);

    // 죽은 타임라인을 다시 돌리지 않는다.
    expect(fade.progress()).toBe(1);
    expect(fade.paused()).toBe(true);
  });
});
