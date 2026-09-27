import { describe, it, expect } from 'vitest';
import * as SliderCss from './Slider.css';

/**
 * vanilla-extract가 실제로 만들어 낸 CSS(jsdom에 주입된 <style>)를 CSSOM으로
 * 읽어 검사한다. Slider.css.ts 소스 문자열을 정규식으로 훑는 방식은 클래스
 * 해시나 var() 참조가 실제로 브라우저 규칙으로 뒤집히는지 보증하지 못한다.
 */
function findSliderStyleSheet(): CSSStyleSheet {
  const sheet = Array.from(document.styleSheets).find((candidate) =>
    Array.from(candidate.cssRules).some((rule) =>
      rule.cssText.includes('Slider_')
    )
  );
  if (!sheet) {
    throw new Error('Slider.css.ts가 생성한 스타일시트를 찾지 못했다');
  }
  return sheet;
}

function findRule(
  sheet: CSSStyleSheet,
  selectorSubstring: string
): CSSStyleRule {
  const rule = Array.from(sheet.cssRules).find(
    (candidate): candidate is CSSStyleRule =>
      candidate instanceof CSSStyleRule &&
      candidate.selectorText.includes(selectorSubstring)
  );
  if (!rule) {
    throw new Error(`"${selectorSubstring}" 셀렉터 규칙을 찾지 못했다`);
  }
  return rule;
}

describe('Slider 생성 CSS', () => {
  // 모듈을 최소 한 번 참조해 vanilla-extract가 CSS를 생성/주입하게 만든다.
  void SliderCss;

  it('fill 트랙이 width가 아니라 transform(scaleX)으로 움직인다', () => {
    const sheet = findSliderStyleSheet();
    const fillRule = findRule(sheet, 'sliderFillTrack');

    expect(fillRule.style.width).toBe('100%');
    expect(fillRule.style.transform).toContain('scaleX(var(');
    expect(fillRule.style.transition).toContain('transform');
    expect(fillRule.style.transition).not.toContain('width');
  });

  it('트랙이 overflow: hidden으로 자식 fill의 캡을 자른다 (Ruling 22)', () => {
    const sheet = findSliderStyleSheet();
    const trackRule = findRule(sheet, 'sliderTrack');

    expect(trackRule.style.overflow).toBe('hidden');
  });

  it('fill은 트랙 안에 들어가면서 절대 위치·borderRadius를 잃는다 (Ruling 22)', () => {
    const sheet = findSliderStyleSheet();
    const fillRule = findRule(sheet, 'sliderFillTrack');

    expect(fillRule.style.position).not.toBe('absolute');
    expect(fillRule.style.getPropertyValue('border-radius')).toBe('');
    expect(fillRule.style.height).toBe('100%');
  });

  it.each([['webkit-slider-thumb'], ['moz-range-thumb']])(
    '%s의 :active 크기가 :hover보다 크고, :hover는 rest보다 크다',
    (pseudo) => {
      const sheet = findSliderStyleSheet();

      const restRule = Array.from(sheet.cssRules).find(
        (candidate): candidate is CSSStyleRule =>
          candidate instanceof CSSStyleRule &&
          candidate.selectorText.endsWith(`::-${pseudo}`) &&
          !candidate.selectorText.includes(':hover') &&
          !candidate.selectorText.includes(':active') &&
          !candidate.selectorText.includes(':focus-visible') &&
          !candidate.selectorText.includes(':disabled')
      );
      if (!restRule) {
        throw new Error(`rest 상태 ::-${pseudo} 규칙을 찾지 못했다`);
      }
      const hoverRule = findRule(sheet, `:hover::-${pseudo}`);
      const activeRule = findRule(sheet, `:active::-${pseudo}`);

      // rest는 scale를 아예 선언하지 않는다 — 선언 없음은 scale(1)과 같다.
      const restScale = restRule.style.transform
        ? Number(restRule.style.transform.match(/scale\(([\d.]+)\)/)?.[1])
        : 1;
      const hoverScale = Number(
        hoverRule.style.transform.match(/scale\(([\d.]+)\)/)?.[1]
      );
      const activeScale = Number(
        activeRule.style.transform.match(/scale\(([\d.]+)\)/)?.[1]
      );

      expect(restScale).toBeLessThan(hoverScale);
      expect(hoverScale).toBeLessThanOrEqual(activeScale);
      // 이 Task가 고치는 결함: 드래그 중(:active) 썸이 rest 크기로 되돌아가던 것.
      expect(activeScale).toBeGreaterThan(hoverScale);
    }
  );
});
