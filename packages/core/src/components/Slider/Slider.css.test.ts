import { describe, it, expect } from 'vitest';
import * as SliderCss from './Slider.css';
import { themeContract } from '../../tokens/theme.css';

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

  it('잡을 때 나오던 눈금 스타일이 없다', () => {
    expect('scrubTicksContainer' in SliderCss).toBe(false);
    expect('scrubTick' in SliderCss).toBe(false);
    expect('scrubTickLanded' in SliderCss).toBe(false);
  });

  describe('호버', () => {
    const HOVER_GATE = '(hover: hover) and (pointer: fine)';
    const MOTION_OK = '(prefers-reduced-motion: no-preference)';
    const { duration, easing } = themeContract.animation;

    interface Flat {
      rule: CSSStyleRule;
      media: string | null;
    }
    const flatRules = (): Flat[] => {
      const flat: Flat[] = [];
      const walk = (rules: CSSRuleList, media: string | null) => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSMediaRule) {
            walk(rule.cssRules, rule.media.mediaText);
          } else if (rule instanceof CSSStyleRule) {
            flat.push({ rule, media });
          }
        }
      };
      walk(findSliderStyleSheet().cssRules, null);
      return flat;
    };
    const hovers = (tail: RegExp) =>
      flatRules().filter(
        ({ rule }) =>
          rule.selectorText.includes(':hover') &&
          rule.selectorText.includes('Slider_sliderWrapper') &&
          tail.test(rule.selectorText)
      );
    const scaleOf = (rule: CSSStyleRule) =>
      Number(
        rule.style.getPropertyValue('transform').match(/scale\(([\d.]+)\)/)?.[1]
      );

    it('wrapper에 호버하는 규칙은 전부 마우스 게이트 안에 있다 (게이트 없는 :hover 규칙이 없다)', () => {
      const hoverRules = flatRules().filter(({ rule }) =>
        rule.selectorText.includes(':hover')
      );

      expect(hoverRules.length).toBeGreaterThan(0);
      for (const { media } of hoverRules) {
        expect(media).toContain(HOVER_GATE);
      }
    });

    it('rest 트랙은 6px이고 height를 base settle로 전이한다', () => {
      const rule = findRule(findSliderStyleSheet(), 'sliderTrack');

      expect(rule.style.getPropertyValue('height')).toBe('6px');
      expect(rule.style.getPropertyValue('transition')).toContain('height');
      expect(rule.style.getPropertyValue('transition')).toContain(
        duration.base
      );
      expect(rule.style.getPropertyValue('transition')).toContain(
        easing.settle
      );
    });

    it('호버하면 트랙이 9px로 두꺼워진다: height 전이, 들어갈 때 slow', () => {
      const [track] = hovers(/Slider_sliderTrack__\w+$/);

      expect(track).toBeDefined();
      expect(track.rule.style.getPropertyValue('height')).toBe('9px');
      expect(track.media).toContain(MOTION_OK);
      expect(track.rule.style.getPropertyValue('transition')).toContain(
        'height'
      );
      expect(track.rule.style.getPropertyValue('transition')).toContain(
        duration.slow
      );
      // height는 오버슈트 이징을 받을 수 없다(animationBoundary: snap·spring은 transform만).
      expect(track.rule.style.getPropertyValue('transition')).toContain(
        easing.settle
      );
      expect(track.rule.style.getPropertyValue('transform')).toBe('');
    });

    it.each([['webkit-slider-thumb'], ['moz-range-thumb']])(
      '%s: rest는 base settle, 호버는 1.15배 slow spring이고, :active는 호버 이상이다',
      (pseudo) => {
        const restRule = flatRules().find(
          ({ rule }) =>
            rule.selectorText.endsWith(`::-${pseudo}`) &&
            !rule.selectorText.includes(':hover') &&
            !rule.selectorText.includes(':active') &&
            !rule.selectorText.includes(':focus-visible') &&
            !rule.selectorText.includes(':disabled')
        )!.rule;
        const hover = hovers(new RegExp(`::-${pseudo}$`)).find(
          ({ rule }) => rule.style.getPropertyValue('transform') !== ''
        )!;
        const activeRule = findRule(
          findSliderStyleSheet(),
          `:active::-${pseudo}`
        );

        expect(restRule.style.getPropertyValue('transform')).toBe('');
        expect(restRule.style.getPropertyValue('transition')).toContain(
          `transform ${duration.base} ${easing.settle}`
        );
        expect(scaleOf(hover.rule)).toBe(1.15);
        expect(hover.media).toContain(MOTION_OK);
        expect(hover.rule.style.getPropertyValue('transition')).toContain(
          `transform ${duration.slow} ${easing.spring}`
        );
        expect(scaleOf(activeRule)).toBeGreaterThanOrEqual(scaleOf(hover.rule));
      }
    );

    it('호버 머리 규칙은 :active를 뺀다 (특이도가 높아 잡는 동안의 색·그림자를 덮지 않는다)', () => {
      const thumbHovers = flatRules().filter(
        ({ rule }) =>
          rule.selectorText.includes(':hover') &&
          /::-(webkit-slider-thumb|moz-range-thumb)$/.test(rule.selectorText)
      );

      expect(thumbHovers).toHaveLength(4);
      for (const { rule } of thumbHovers) {
        expect(rule.selectorText).toContain(':not(:active)');
      }
    });

    it('비활성 슬라이더는 호버로 변하지 않는다', () => {
      for (const { rule } of flatRules().filter(({ rule }) =>
        rule.selectorText.includes(':hover')
      )) {
        expect(rule.selectorText).toContain('input:not(:disabled)');
      }
    });
  });
});
