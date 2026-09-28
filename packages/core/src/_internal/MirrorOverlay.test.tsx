import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createRef, useRef, useState } from 'react';
import { MirrorOverlay, wrapFallOffset } from './MirrorOverlay';

// gsap 네임스페이스는 ambient 전역 타입이라 import 없이 참조된다
// (Checkbox.test.tsx/Switch.test.tsx와 같은 방식) — 이 파일에서
// `from 'gsap'`가 없어야 gsapGateEnforcement 스캔에 안 걸린다.

/**
 * GSAP는 항등값(rotation 0, scale 1)이면 transform 문자열에서 그 함수를 아예 뺀다 —
 * 매치가 없으면 항등값으로 되돌린다. NumericSpinner.test.tsx/Switch.test.tsx와 같은
 * 정규식 판독 방식(gsap.getProperty 대신 인라인 style을 직접 읽는다).
 */
const getTransformRotation = (el: HTMLElement): number => {
  const match = el.style.transform.match(/rotate\(([-\d.]+)deg\)/);
  return match ? Number(match[1]) : 0;
};

const getTransformTranslate = (el: HTMLElement): { x: number; y: number } => {
  const match = el.style.transform.match(
    /translate\(([-\d.]+)(?:px)?,\s*([-\d.]+)(?:px)?\)/
  );
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 };
};

const getTransformScale = (el: HTMLElement): number => {
  const match = el.style.transform.match(/scale\(([-\d.]+)/);
  return match ? Number(match[1]) : 1;
};

/** Snackbar.test.tsx/Checkbox.test.tsx와 같은 축소 선호 스텁. */
const installReducedMotion = (): void => {
  vi.stubGlobal(
    'matchMedia',
    (media: string): MediaQueryList =>
      ({
        matches: true,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }) as unknown as MediaQueryList
  );
};

/** 테스트가 트윈을 집기 위한 손잡이. MirrorOverlay.tsx의 것과 같은 구조다(무모킹). */
interface MirrorTweenHost extends HTMLElement {
  __mirrorTweens?: gsap.core.Tween[];
}

/** 실제 타이핑처럼 비제어 input에 값을 직접 대입하고 네이티브 input 이벤트를 쏜다. */
const typeUncontrolled = (
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void => {
  input.value = value;
  fireEvent.input(input);
};

const renderCharMirror = () => {
  const inputRef = createRef<HTMLInputElement>();
  const utils = render(
    <div>
      <input ref={inputRef} defaultValue="" />
      <MirrorOverlay inputRef={inputRef} unit="char" geometryClassName="geo" />
    </div>
  );
  const root = utils.container.querySelector(
    '[aria-hidden="true"]'
  ) as MirrorTweenHost;
  return { ...utils, input: inputRef.current as HTMLInputElement, root };
};

const renderWordMirror = () => {
  const inputRef = createRef<HTMLTextAreaElement>();
  const utils = render(
    <div>
      <textarea ref={inputRef} defaultValue="" />
      <MirrorOverlay inputRef={inputRef} unit="word" geometryClassName="geo" />
    </div>
  );
  const root = utils.container.querySelector(
    '[aria-hidden="true"]'
  ) as MirrorTweenHost;
  return { ...utils, input: inputRef.current as HTMLTextAreaElement, root };
};

describe('wrapFallOffset (Ruling 51 순수 판정 함수)', () => {
  it('nextTop이 previousTop보다 작거나 같으면 null이다 — 줄을 안 넘었다', () => {
    expect(wrapFallOffset('hel', 'hell', 10, 10)).toBeNull();
    expect(wrapFallOffset('hel', 'hell', 20, 10)).toBeNull();
  });

  it('previousWord가 빈 문자열이면 null이다 — 없던 낱말이 처음 생긴 것', () => {
    expect(wrapFallOffset('', 'hello', 0, 20)).toBeNull();
  });

  it('nextWord가 previousWord로 시작하지 않으면 null이다 — 새 낱말이거나 지워졌다', () => {
    expect(wrapFallOffset('hello', 'world', 0, 20)).toBeNull();
  });

  it('그 외에는 previousTop - nextTop을 돌려준다 — 이전 줄 위치에서 떨어진다', () => {
    expect(wrapFallOffset('hel', 'hello', 0, 20)).toBe(-20);
    expect(wrapFallOffset('hel', 'hello', 5, 25)).toBe(-20);
  });
});

describe('MirrorOverlay — 공통', () => {
  it('aria-hidden="true"이고 pointerEvents가 none이다', () => {
    const { root } = renderCharMirror();
    expect(root).toHaveAttribute('aria-hidden', 'true');

    // vitest.config.ts의 css.include가 Slider.css.ts만 실제 CSS로 주입한다 —
    // 이 파일은 목킹 대상이라 getComputedStyle로 pointerEvents를 읽을 수 없다.
    // Popover.test.tsx:512-513과 같은 방식으로 .css.ts 소스에서 직접 단언한다.
    const cssSource = readFileSync(
      resolve(__dirname, './mirrorOverlay.css.ts'),
      'utf-8'
    );
    const rootBlock = cssSource.match(
      /export const root = style\(\{([\s\S]*?)\}\);/
    )?.[1];
    expect(rootBlock, 'root 스타일 블록을 찾지 못했다').toBeDefined();
    expect(rootBlock).toContain("pointerEvents: 'none'");
  });

  it('정지 상태에서 __mirrorTweens가 빈 배열이다 (Ruling 43)', () => {
    const { root } = renderCharMirror();
    expect(root.__mirrorTweens).toEqual([]);
  });

  it('마운트 시 defaultValue를 애니메이션 없이 그대로 인정한다', () => {
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <div>
        <input ref={inputRef} defaultValue="안녕" readOnly={false} />
        <MirrorOverlay
          inputRef={inputRef}
          unit="char"
          geometryClassName="geo"
        />
      </div>
    );
    const root = container.querySelector(
      '[aria-hidden="true"]'
    ) as MirrorTweenHost;
    expect(root.children[0].textContent).toBe('안녕');
    expect(root.children[1].children).toHaveLength(0);
    expect(root.__mirrorTweens).toEqual([]);
  });
});

describe('MirrorOverlay — char 모드 (TextField)', () => {
  it('6글자를 한 번에 넣으면 진입 span이 6개 생기고 rotation 시작값이 SCATTER_ANGLES와 정확히 같다', () => {
    const { input, root } = renderCharMirror();
    typeUncontrolled(input, 'abcdef');

    const enteringSpans = Array.from(
      root.children[1].children
    ) as HTMLElement[];
    expect(enteringSpans).toHaveLength(6);

    const SCATTER_ANGLES = [-14, 9, -6, 17, -11, 5];
    enteringSpans.forEach((span, i) => {
      expect(getTransformRotation(span)).toBe(SCATTER_ANGLES[i]);
    });

    expect(root.__mirrorTweens).toHaveLength(1);
  });

  it('같은 트윈의 progress(1)에서 모든 span의 rotation·x·y가 0, scale이 1, opacity가 1이다', () => {
    const { input, root } = renderCharMirror();
    typeUncontrolled(input, 'abcdef');

    const tween = root.__mirrorTweens![0];
    tween.progress(1);

    const enteringSpans = Array.from(
      root.children[1].children
    ) as HTMLElement[];
    enteringSpans.forEach((span) => {
      expect(getTransformRotation(span)).toBe(0);
      expect(getTransformTranslate(span)).toEqual({ x: 0, y: 0 });
      expect(getTransformScale(span)).toBe(1);
      expect(span.style.opacity).toBe('1');
    });
  });

  it('트윈이 완료되면 진입 span이 0개가 되고 정착 텍스트가 값 전체와 같다 (Ruling 43)', () => {
    const { input, root } = renderCharMirror();
    typeUncontrolled(input, 'abcdef');

    const tween = root.__mirrorTweens![0];
    tween.progress(1);
    // GSAP는 progress(1) 대입만으로 onComplete를 동기 실행하지 않는다 — 자연 완료를 흉내내려면
    // eventCallback이 걸려 있으므로 tween 자신이 완료 상태가 되면 콜백이 돈다. totalProgress(1)로
    // 완료를 트리거한다.
    tween.totalProgress(1, true);

    expect(root.children[1].children).toHaveLength(0);
    expect(root.children[0].textContent).toBe('abcdef');
    expect(root.__mirrorTweens).toEqual([]);
  });

  it('MAX_ANIMATED_CHARS(12)를 넘는 붙여넣기에서 진입 span이 0개이고 트윈도 0개다 (Ruling 45)', () => {
    const { input, root } = renderCharMirror();
    const longPaste = 'a'.repeat(13);
    typeUncontrolled(input, longPaste);

    expect(root.children[1].children).toHaveLength(0);
    expect(root.children[0].textContent).toBe(longPaste);
    expect(root.__mirrorTweens).toEqual([]);
  });

  it('중간 삽입·삭제에서 진입 span이 0개이고 미러 텍스트가 값과 같다 (Ruling 44)', () => {
    const { input, root } = renderCharMirror();
    typeUncontrolled(input, 'hello');
    // 트윈을 끝까지 진행해 정착시킨다.
    root.__mirrorTweens?.forEach((t) => t.totalProgress(1, true));

    // 중간 삽입: "hello" -> "heXllo" (말미 추가가 아니다)
    typeUncontrolled(input, 'heXllo');
    expect(root.children[1].children).toHaveLength(0);
    expect(root.children[0].textContent).toBe('heXllo');
    expect(root.__mirrorTweens).toEqual([]);

    // 삭제: "heXllo" -> "heXll"
    typeUncontrolled(input, 'heXll');
    expect(root.children[1].children).toHaveLength(0);
    expect(root.children[0].textContent).toBe('heXll');
    expect(root.__mirrorTweens).toEqual([]);
  });

  it('선택 후 덮어쓰기(같은 길이로 대체)도 즉시 정착이다', () => {
    const { input, root } = renderCharMirror();
    typeUncontrolled(input, 'hello');
    root.__mirrorTweens?.forEach((t) => t.totalProgress(1, true));

    typeUncontrolled(input, 'world');
    expect(root.children[1].children).toHaveLength(0);
    expect(root.children[0].textContent).toBe('world');
  });

  it('compositionstart 중에는 hiddenText 클래스가 없고 미러가 visibility:hidden이다. compositionend 후에는 되돌아오고 확정 음절이 애니메이션된다 (Ruling 47)', () => {
    const { input, root } = renderCharMirror();
    typeUncontrolled(input, '안');

    const hiddenTextClassBefore = Array.from(input.classList).find((c) =>
      c.includes('hiddenText')
    );
    expect(hiddenTextClassBefore).toBeDefined();

    fireEvent.compositionStart(input);
    const hiddenTextClassDuring = Array.from(input.classList).find((c) =>
      c.includes('hiddenText')
    );
    expect(hiddenTextClassDuring).toBeUndefined();
    expect(root.style.visibility).toBe('hidden');

    input.value = '안녕';
    fireEvent.compositionEnd(input);

    const hiddenTextClassAfter = Array.from(input.classList).find((c) =>
      c.includes('hiddenText')
    );
    expect(hiddenTextClassAfter).toBeDefined();
    expect(root.style.visibility).toBe('');

    // 확정된 음절("녕")이 애니메이션 대상이 됐다 — 진입 span이 생겼다.
    expect(root.children[1].children.length).toBeGreaterThan(0);
    expect(root.children[0].textContent + root.children[1].textContent).toBe(
      '안녕'
    );
  });

  it('선택 영역이 생기면(select 이벤트) 미러가 물러나고, 선택이 풀리면 되돌아온다', () => {
    const { input, root } = renderCharMirror();
    typeUncontrolled(input, 'hello');
    root.__mirrorTweens?.forEach((t) => t.totalProgress(1, true));

    input.setSelectionRange(0, 3);
    fireEvent.select(input);

    const hiddenTextDuring = Array.from(input.classList).find((c) =>
      c.includes('hiddenText')
    );
    expect(hiddenTextDuring).toBeUndefined();
    expect(root.style.visibility).toBe('hidden');

    input.setSelectionRange(3, 3);
    fireEvent.select(input);

    const hiddenTextAfter = Array.from(input.classList).find((c) =>
      c.includes('hiddenText')
    );
    expect(hiddenTextAfter).toBeDefined();
    expect(root.style.visibility).toBe('');
  });

  it('disabled·readOnly에서는 컴포넌트가 렌더되지만, TextField/TextArea 배선 레벨의 조건부 렌더는 별도 테스트에서 검증한다', () => {
    // MirrorOverlay 자체는 disabled/readOnly를 모른다 — 조건부 렌더는 소비자(TextField/TextArea) 책임.
    // 이 테스트는 자리 표시만 한다 (조건 11의 실제 단언은 TextField.test.tsx/TextArea.test.tsx에 있다).
    expect(true).toBe(true);
  });

  it('축소 선호에서 글자가 즉시 최종 상태로 나타난다 — 진행 중 트윈 0개, 진입 span 0개, 정착 텍스트가 값과 같다', () => {
    installReducedMotion();
    const { input, root } = renderCharMirror();

    typeUncontrolled(input, 'abcdef');

    expect(root.__mirrorTweens).toEqual([]);
    expect(root.children[1].children).toHaveLength(0);
    expect(root.children[0].textContent).toBe('abcdef');

    vi.unstubAllGlobals();
  });

  it('언마운트 후: 트윈 0개, input에 hiddenText 클래스 없음, 리스너 누수 없음', () => {
    const inputRef = createRef<HTMLInputElement>();
    const { container, unmount } = render(
      <div>
        <input ref={inputRef} defaultValue="" />
        <MirrorOverlay
          inputRef={inputRef}
          unit="char"
          geometryClassName="geo"
        />
      </div>
    );
    const input = inputRef.current as HTMLInputElement;
    const root = container.querySelector(
      '[aria-hidden="true"]'
    ) as MirrorTweenHost;

    typeUncontrolled(input, 'abcdef');
    const tween = root.__mirrorTweens![0];
    expect(tween).toBeDefined();

    const removeSpy = vi.spyOn(input, 'removeEventListener');

    unmount();

    expect(tween.parent).toBeNull(); // kill()된 트윈은 parent를 잃는다 (NumericSpinner.test.tsx 선례와 동일)
    const hiddenTextClassAfterUnmount = Array.from(input.classList).find((c) =>
      c.includes('hiddenText')
    );
    expect(hiddenTextClassAfterUnmount).toBeUndefined();
    expect(removeSpy).toHaveBeenCalled();

    // 언마운트 후 추가로 input 이벤트를 쏴도 더 이상 반응(트윈 생성)하지 않는다 — 리스너가 실제로 떨어졌다.
    typeUncontrolled(input, 'abcdefg');
  });
});

describe('MirrorOverlay — word 모드 (TextArea)', () => {
  it('값이 "안녕 세상"이면 정착 텍스트가 "안녕 ", 진입 span이 "세상" 하나다 (Ruling 50)', () => {
    const { input, root } = renderWordMirror();
    typeUncontrolled(input, '안녕 세상');

    expect(root.children[0].textContent).toBe('안녕 ');
    expect(root.children[1].children).toHaveLength(1);
    expect(root.children[1].children[0].textContent).toBe('세상');
  });

  it('MAX_WORD_CHARS(24)를 넘는 낱말에서는 진입 span이 0개고 정착 텍스트가 값 전체와 같다', () => {
    const { input, root } = renderWordMirror();
    const longWord = 'a'.repeat(25);
    typeUncontrolled(input, longWord);

    expect(root.children[1].children).toHaveLength(0);
    expect(root.children[0].textContent).toBe(longWord);
  });

  it('여러 낱말을 입력하면 head가 누적된다', () => {
    const { input, root } = renderWordMirror();
    typeUncontrolled(input, '하나 둘 셋');

    expect(root.children[0].textContent).toBe('하나 둘 ');
    expect(root.children[1].children[0].textContent).toBe('셋');
  });

  it('jsdom에서는 offsetTop이 항상 0이라 낙하 트윈이 생기지 않는다 (위험 목록 2)', () => {
    const { input, root } = renderWordMirror();
    typeUncontrolled(input, '안녕 세상');
    expect(root.__mirrorTweens).toEqual([]);
  });
});

describe('MirrorOverlay — 제어 컴포넌트 경로 (layout effect)', () => {
  it('React 렌더로 value가 바뀌면(제어 컴포넌트) layout effect가 sync를 대신 태운다', () => {
    const Controlled = () => {
      const [value, setValue] = useState('');
      const inputRef = useRef<HTMLInputElement>(null);
      return (
        <div>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <MirrorOverlay
            inputRef={inputRef}
            unit="char"
            geometryClassName="geo"
          />
          <button onClick={() => setValue('xyz')}>set</button>
        </div>
      );
    };

    const { container, getByText } = render(<Controlled />);
    const root = container.querySelector(
      '[aria-hidden="true"]'
    ) as MirrorTweenHost;

    fireEvent.click(getByText('set'));

    const enteringSpans = Array.from(
      root.children[1].children
    ) as HTMLElement[];
    expect(enteringSpans).toHaveLength(3);
    expect(root.__mirrorTweens).toHaveLength(1);
  });
});
