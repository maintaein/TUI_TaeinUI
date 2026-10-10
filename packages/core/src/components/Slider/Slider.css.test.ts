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

interface Flat {
  rule: CSSStyleRule;
  media: string | null;
}
function flatRules(): Flat[] {
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
}

describe('Slider 생성 CSS', () => {
  // 모듈을 최소 한 번 참조해 vanilla-extract가 CSS를 생성/주입하게 만든다.
  void SliderCss;

  it('라인은 SVG가 그린다: 안 채운 부분은 paper 면에 border.strong 1px 선, 채운 부분은 primary.main 면', () => {
    const sheet = findSliderStyleSheet();
    const track = findRule(sheet, 'sliderLineTrack');
    const fill = findRule(sheet, 'sliderLineFill');

    expect(track.style.getPropertyValue('fill')).toBe(
      themeContract.color.background.paper
    );
    expect(track.style.getPropertyValue('stroke')).toBe(
      themeContract.color.border.strong
    );
    expect(track.style.getPropertyValue('stroke-width')).toBe('1');
    expect(fill.style.getPropertyValue('fill')).toBe(
      themeContract.color.primary.main
    );
  });

  it('SVG는 박스 밖으로 부풀어도 잘리지 않고, 옛 DOM 채움·가림은 없다', () => {
    expect(
      findRule(findSliderStyleSheet(), 'sliderLine').style.getPropertyValue(
        'overflow'
      )
    ).toBe('visible');
    expect('sliderFillTrack' in SliderCss).toBe(false);
    expect(
      findRule(findSliderStyleSheet(), 'sliderTrack').style.getPropertyValue(
        'overflow'
      )
    ).toBe('');
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

    it('트랙은 쉬는 두께 6px이고 CSS로 전이하지 않는다: 호버 두께는 GSAP이 맡는다', () => {
      const rule = findRule(findSliderStyleSheet(), 'sliderTrack');

      expect(rule.style.getPropertyValue('height')).toBe('6px');
      expect(rule.style.getPropertyValue('transition')).toBe('');
    });

    it('트랙에는 호버 규칙이 없다 (머리와 포커스만 CSS)', () => {
      expect(hovers(/Slider_sliderTrack__\w+$/)).toHaveLength(0);
      for (const { rule } of flatRules()) {
        if (/Slider_sliderTrack__\w+$/.test(rule.selectorText)) {
          expect(rule.style.getPropertyValue('transition')).toBe('');
        }
      }
    });

    const HEAD = /Slider_sliderHead__\w+$/;
    const headRest = () =>
      flatRules().find(
        ({ rule }) =>
          HEAD.test(rule.selectorText) && !rule.selectorText.includes(' ')
      )!.rule;
    const headHovers = () => hovers(HEAD);

    it('그린 머리: rest는 base settle이고, 호버는 1.15배 slow spring이며, :active는 호버 이상이다', () => {
      const hover = headHovers().find(
        ({ rule }) => rule.style.getPropertyValue('transform') !== ''
      )!;
      const activeRule = findRule(
        findSliderStyleSheet(),
        'input:active) .Slider_sliderHead'
      );

      expect(headRest().style.getPropertyValue('transform')).toBe('');
      expect(headRest().style.getPropertyValue('transition')).toContain(
        `transform ${duration.base} ${easing.settle}`
      );
      expect(scaleOf(hover.rule)).toBe(1.15);
      expect(hover.media).toContain(MOTION_OK);
      expect(hover.rule.style.getPropertyValue('transition')).toContain(
        `transform ${duration.slow} ${easing.spring}`
      );
      expect(scaleOf(activeRule)).toBeGreaterThanOrEqual(scaleOf(hover.rule));
    });

    it('호버 머리 규칙은 :active를 뺀다 (특이도가 높아 잡는 동안의 색·그림자를 덮지 않는다)', () => {
      // 그림자 규칙(마우스 게이트)과 크기 규칙(마우스 + 움직임 허용 게이트) 둘.
      expect(headHovers()).toHaveLength(2);
      for (const { rule } of headHovers()) {
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

  describe('그린 머리와 투명한 기본 썸', () => {
    const THUMBS = /::-(webkit-slider-thumb|moz-range-thumb)$/;
    const HEAD = /Slider_sliderHead__\w+$/;
    const { duration, easing } = themeContract.animation;
    const headRules = () =>
      flatRules().filter(({ rule }) => HEAD.test(rule.selectorText));
    const rest = () =>
      headRules().find(({ rule }) => !rule.selectorText.includes(' '))!.rule;
    const withState = (state: string) =>
      headRules().find(({ rule }) => rule.selectorText.includes(state))!.rule;

    it.each([['webkit-slider-thumb'], ['moz-range-thumb']])(
      '기본 %s는 모든 변형에서 투명하다: 크기·히트 영역은 그대로 둔다',
      (pseudo) => {
        const plain = flatRules().filter(
          ({ rule: candidate }) =>
            candidate.selectorText.endsWith(`::-${pseudo}`) &&
            !candidate.selectorText.includes(':hover') &&
            !candidate.selectorText.includes(':disabled')
        );

        expect(plain).toHaveLength(1);
        expect(plain[0].rule.style.getPropertyValue('opacity')).toBe('0');
        expect(plain[0].rule.style.getPropertyValue('width')).toBe('24px');
        expect(plain[0].rule.style.getPropertyValue('height')).toBe('24px');
        expect(plain[0].rule.style.getPropertyValue('display')).toBe('');
      }
    );

    it('기본 썸에는 모습 규칙이 남지 않는다: 호버·active·포커스 규칙도 색·그림자도 없다', () => {
      const thumbs = flatRules().filter(({ rule }) =>
        THUMBS.test(rule.selectorText)
      );

      expect(thumbs.length).toBeGreaterThan(0);
      for (const { rule, media } of thumbs) {
        expect(media).toBeNull();
        expect(rule.selectorText).not.toContain(':hover');
        expect(rule.selectorText).not.toContain(':active');
        expect(rule.selectorText).not.toContain(':focus-visible');
        expect(rule.style.getPropertyValue('box-shadow')).toBe('');
        expect(rule.style.getPropertyValue('background-color')).toBe('');
      }
    });

    it('쉬는 모습은 예전 썸과 같다: 24px 원, paper 면, 2px primary 테두리, 은은한 그림자', () => {
      const r = rest();

      expect(r.style.getPropertyValue('width')).toBe('24px');
      expect(r.style.getPropertyValue('height')).toBe('24px');
      expect(r.style.getPropertyValue('box-sizing')).toBe('border-box');
      expect(r.style.getPropertyValue('border-radius')).toBe('50%');
      expect(r.style.getPropertyValue('background-color')).toBe(
        themeContract.color.background.paper
      );
      expect(r.style.getPropertyValue('border')).toBe(
        `2px solid ${themeContract.color.primary.main}`
      );
      expect(r.style.getPropertyValue('box-shadow')).toBe(
        '0 1px 4px rgba(0, 0, 0, 0.15)'
      );
      expect(r.style.getPropertyValue('transition')).toContain(
        `box-shadow ${duration.base} ${easing.settle}`
      );
      // 위치는 값에서 나온 %다: 중심이 (폭 - 24px) 위를 움직인다.
      expect(r.style.getPropertyValue('left')).toContain('100% - 24px');
      expect(r.style.getPropertyValue('pointer-events')).toBe('none');
    });

    it('잡는 동안(:active)은 진한 테두리와 호버 이상의 배율이다', () => {
      const active = withState('input:active) ');

      expect(active.style.getPropertyValue('border-color')).toBe(
        themeContract.color.primary.dark
      );
      expect(active.style.getPropertyValue('box-shadow')).toBe(
        '0 1px 3px rgba(0, 0, 0, 0.2)'
      );
      expect(active.style.getPropertyValue('transform')).toBe('scale(1.15)');
    });

    it('키보드 포커스(:focus-visible)면 머리 둘레에 포커스 링이 선다', () => {
      const ring = withState('input:focus-visible) ');

      expect(ring.style.getPropertyValue('outline')).toContain(
        themeContract.color.border.focus
      );
    });

    it('비활성이면 테두리가 흐려지고 반투명하다 (입력의 opacity 0.5를 대신한다)', () => {
      const disabled = withState('input:disabled) ');

      expect(disabled.style.getPropertyValue('border-color')).toBe(
        themeContract.color.text.disabled
      );
      expect(disabled.style.getPropertyValue('opacity')).toBe('0.5');
    });

    it('호버 그림자는 마우스 게이트 안에서 더 깊어진다', () => {
      const shadow = flatRules().find(
        ({ rule }) =>
          HEAD.test(rule.selectorText) &&
          rule.selectorText.includes(':hover') &&
          rule.style.getPropertyValue('box-shadow') !== ''
      )!;

      expect(shadow.media).toContain('(hover: hover) and (pointer: fine)');
      expect(shadow.rule.style.getPropertyValue('box-shadow')).toBe(
        '0 2px 6px rgba(0, 0, 0, 0.2)'
      );
    });
  });

  describe('bar 변형', () => {
    const BAR = /Slider_variantStyles_bar__\w+/;
    const own = (re: RegExp) =>
      flatRules().filter(({ rule }) => re.test(rule.selectorText));

    it('트랙은 쉬는 두께 8px이고 호버 규칙이 없다(12px는 GSAP이 맡는다)', () => {
      const rest = own(
        new RegExp(`${BAR.source} \\.Slider_sliderTrack__\\w+$`)
      );
      const hover = own(
        new RegExp(`${BAR.source}.*:hover \\.Slider_sliderTrack__\\w+$`)
      );

      expect(rest).toHaveLength(1);
      expect(rest[0].rule.style.getPropertyValue('height')).toBe('8px');
      expect(hover).toHaveLength(0);
    });

    it('키보드 포커스면 머리가 없으니 트랙 둘레에 포커스 링이 선다', () => {
      const ring = own(
        new RegExp(
          `${BAR.source}:has\\(input:focus-visible\\) \\.Slider_sliderTrack__\\w+$`
        )
      );

      expect(ring).toHaveLength(1);
      expect(ring[0].rule.style.getPropertyValue('outline')).toContain(
        themeContract.color.border.focus
      );
    });
  });

  describe('wake 변형', () => {
    const own = (re: RegExp) =>
      flatRules().filter(({ rule }) => re.test(rule.selectorText));
    const bar = () => own(/\.Slider_wakeBar__\w+$/)[0].rule;

    it('막대는 폭 2px, 최대 높이 24px에 쉬는 scaleY(0.25)이고 가운데를 중심으로 늘어난다', () => {
      expect(bar().style.getPropertyValue('width')).toBe('2px');
      expect(bar().style.getPropertyValue('height')).toBe('24px');
      expect(bar().style.getPropertyValue('transform')).toBe('scaleY(0.25)');
      expect(bar().style.getPropertyValue('transform-origin')).toBe('center');
      // 직사각형이라 scaleY로 일그러질 끝 반원이 없다.
      expect(bar().style.getPropertyValue('border-radius')).toBe('');
    });

    it('꺼진 막대는 border.strong, 켜진 막대는 primary.main', () => {
      expect(bar().style.getPropertyValue('background-color')).toBe(
        themeContract.color.border.strong
      );
      const on = own(/\.Slider_wakeBar__\w+\[data-on="true"\]$/)[0].rule;
      expect(on.style.getPropertyValue('background-color')).toBe(
        themeContract.color.primary.main
      );
    });

    it('막대 묶음은 양끝을 머리 반폭만큼 들여 머리 중심과 맞춘다', () => {
      const bars = own(/\.Slider_wakeBars__\w+$/)[0].rule;

      expect(bars.style.getPropertyValue('left')).toBe('12px');
      expect(bars.style.getPropertyValue('right')).toBe('12px');
    });

    it('막대 높이는 JS가 매 프레임 쓰므로 transform을 CSS로 전이하지 않는다', () => {
      expect(bar().style.getPropertyValue('transition')).not.toContain(
        'transform'
      );
    });
  });
});
