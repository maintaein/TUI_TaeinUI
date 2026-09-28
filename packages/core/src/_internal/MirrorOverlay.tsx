import { useLayoutEffect, useRef, type RefObject } from 'react';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import * as styles from './mirrorOverlay.css';
import { gateMotion } from '../hooks/gateMotion';
import { gsapDuration, gsapEasing } from '../tokens/gsapEasing';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * `TextField`·`TextArea`가 공유하는 타이핑 미러 오버레이 (Task 7 브리프).
 * `_internal/index.ts`에 올리지 않는다 — 소비자는 이 두 컴포넌트뿐이다.
 */
export interface MirrorOverlayProps {
  /** 미러가 따라갈 실제 입력 요소 */
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** 진입 단위. 'char' = TextField, 'word' = TextArea (Ruling 50) */
  unit: 'char' | 'word';
  /**
   * 텍스트 기하(폰트 크기·패딩·line-height)를 담은 클래스. 소비자가 자기
   * `.css.ts`에서 input과 같은 객체를 스프레드해 만든 것이어야 한다 (Ruling 48).
   */
  geometryClassName: string;
}

/** 한 번에 애니메이션할 최대 글자 수. 넘으면 즉시 정착한다 (Ruling 45). */
const MAX_ANIMATED_CHARS = 12;
/** 애니메이션할 말미 낱말의 최대 길이. 넘으면 정착 텍스트로 넘긴다 — URL 방어. */
const MAX_WORD_CHARS = 24;
/** 글자 사이 시차(초). Material의 30~50ms 창 안이다. */
const CHAR_STAGGER = 0.04;
/**
 * 흐트러짐 각도(도). 배치 안의 인덱스로 순환한다 — 난수가 아니다 (Ruling 46).
 * 6개라 같은 패턴이 6글자마다 돌아오지만 시차가 겹쳐 육안으로는 반복이 안 보인다.
 */
const SCATTER_ANGLES = [-14, 9, -6, 17, -11, 5] as const;
/** 나타나는 자리의 세로 offset(px). 위에서 내려와 앉는다. */
const SCATTER_Y = -10;
/** 같은 순간의 가로 흔들림(px). 회전 각도와 부호를 맞춘다. */
const SCATTER_X = 4;
/** 나타날 때의 배율. 1보다 커서 "너무 큰 채로 와서 앉는다". */
const SCATTER_SCALE = 1.35;
/** 낱말이 줄을 넘어갈 때 가로로 밀리는 거리(px). 오른쪽 위에서 떨어진다. */
const FALL_X = 6;

/** selectionStart를 안전하게 읽을 수 있는 input type만 화이트리스트로 둔다(위험 7). */
const SELECTABLE_INPUT_TYPES = new Set([
  'text',
  'email',
  'password',
  'tel',
  'url',
]);

/** 선택·keyup·pointerup·input 네 이벤트에서 같은 함수를 다시 평가한다. */
const SELECTION_REEVAL_EVENTS = [
  'select',
  'keyup',
  'pointerup',
  'input',
] as const;

/**
 * 테스트가 트윈을 집기 위한 손잡이. props로 노출하지 않는다 — 공개 API가 된다.
 * `Snackbar.tsx`의 `CountdownTweenHost`·`Checkbox.tsx`의 `MarkTweenHost`와 같은 패턴.
 */
interface MirrorTweenHost extends HTMLDivElement {
  __mirrorTweens?: gsap.core.Tween[];
}

/**
 * 말미 낱말이 줄을 넘어갔는지 판정하고, 넘어갔으면 애니메이션 시작 y(px)를 돌려준다.
 *
 * jsdom이 `offsetTop`을 항상 0으로 주기 때문에 DOM 읽기와 판정을 갈라 놨다.
 * 판정은 여기서 단위 테스트로 전부 덮고, DOM 읽기는 호출부 한 줄로 남는다.
 *
 * @returns 애니메이션 시작 y(px, 음수 = 이전 줄의 위치). 애니메이션할 게 없으면 null
 */
export const wrapFallOffset = (
  previousWord: string,
  nextWord: string,
  previousTop: number,
  nextTop: number
): number | null => {
  if (nextTop <= previousTop) return null;
  if (previousWord === '') return null;
  if (!nextWord.startsWith(previousWord)) return null;
  return previousTop - nextTop;
};

/** 화면에 없는 곳에서 `type` 프로퍼티에 안전하게 접근한다(textarea엔 type이 없다). */
const isSelectableElement = (
  element: HTMLInputElement | HTMLTextAreaElement
): boolean => {
  if (element instanceof HTMLInputElement) {
    return SELECTABLE_INPUT_TYPES.has(element.type);
  }
  return true;
};

const evaluateHasSelection = (
  element: HTMLInputElement | HTMLTextAreaElement
): boolean => {
  if (!isSelectableElement(element)) return false;
  return element.selectionStart !== element.selectionEnd;
};

/** char 모드는 scrollLeft만, word 모드는 scrollTop도 미러에 맞춘다. */
const syncScroll = (
  root: HTMLElement,
  input: HTMLInputElement | HTMLTextAreaElement,
  unit: 'char' | 'word'
): void => {
  root.scrollLeft = input.scrollLeft;
  if (unit === 'word') {
    root.scrollTop = input.scrollTop;
  }
};

/**
 * 브라우저에 텍스트 렌더링을 넘길지 토글한다(Ruling 47). `owns`가 이전과 같으면
 * 아무것도 하지 않는다 — 조합·선택 이벤트마다 불필요한 DOM 쓰기를 막는다.
 */
const applyBrowserOwnsText = (
  owns: boolean,
  input: HTMLInputElement | HTMLTextAreaElement,
  root: HTMLElement,
  ownsRef: React.MutableRefObject<boolean>
): void => {
  if (owns === ownsRef.current) return;
  ownsRef.current = owns;
  if (owns) {
    input.classList.remove(styles.hiddenText);
    root.style.visibility = 'hidden';
  } else {
    input.classList.add(styles.hiddenText);
    root.style.visibility = '';
  }
};

/**
 * 트윈에 자가 종료를 붙인다(Ruling 41 — 유휴 상태에서 살아 있는 gsap 객체는 0개).
 * `Checkbox.tsx`의 `attachSelfKill`과 같은 이유로, `tween`은 이미 완전히 대입된
 * 매개변수로 받는다 — 생성 옵션 안에서 자기 자신을 참조하는 TDZ 경로를 만들지 않는다.
 * `reduced`면 `gateMotion`이 생성 시점에 이미 동기로 progress(1)+kill을 끝냈으므로
 * 배열에 올리지 않고 바로 정착시킨다.
 */
const attachTweenCleanup = (
  tween: gsap.core.Tween,
  root: MirrorTweenHost,
  reduced: boolean,
  onSettle: () => void
): void => {
  if (reduced) {
    onSettle();
    return;
  }
  root.__mirrorTweens = [...(root.__mirrorTweens ?? []), tween];
  tween.eventCallback('onComplete', () => {
    tween.kill();
    root.__mirrorTweens = (root.__mirrorTweens ?? []).filter(
      (t) => t !== tween
    );
    if (root.__mirrorTweens.length === 0) {
      onSettle();
    }
  });
};

/**
 * `char` 모드 절차 (`TextField`). Ruling 44·45·46·43을 그대로 코드로 옮긴다.
 * `overwrite`는 쓰지 않는다 — 배치마다 대상 span이 새것이라 겹칠 게 없다.
 */
const runCharSync = (
  root: MirrorTweenHost,
  settled: HTMLSpanElement,
  incoming: HTMLSpanElement,
  prev: string,
  next: string,
  reduced: boolean
): void => {
  const isTrailingAppend = next.startsWith(prev) && next.length > prev.length;
  const delta = next.length - prev.length;

  if (!isTrailingAppend || delta > MAX_ANIMATED_CHARS) {
    (root.__mirrorTweens ?? []).forEach((tween) => tween.kill());
    root.__mirrorTweens = [];
    settled.textContent = next;
    incoming.replaceChildren();
    return;
  }

  const deltaChars = Array.from(next.slice(prev.length));
  const newSpans = deltaChars.map((char) => {
    const span = document.createElement('span');
    span.className = styles.entering;
    span.textContent = char;
    return span;
  });
  newSpans.forEach((span) => incoming.appendChild(span));

  const tween = gateMotion(reduced, () =>
    gsap.from(newSpans, {
      rotation: (i: number) => SCATTER_ANGLES[i % SCATTER_ANGLES.length],
      x: (i: number) =>
        SCATTER_ANGLES[i % SCATTER_ANGLES.length] < 0 ? -SCATTER_X : SCATTER_X,
      y: SCATTER_Y,
      scale: SCATTER_SCALE,
      opacity: 0,
      duration: gsapDuration.slow,
      ease: gsapEasing.snap,
      stagger: CHAR_STAGGER,
    })
  );

  attachTweenCleanup(tween, root, reduced, () => {
    settled.textContent =
      (settled.textContent ?? '') + (incoming.textContent ?? '');
    incoming.replaceChildren();
  });
};

/**
 * `word` 모드 절차 (`TextArea`). 말미 낱말을 매 호출 다시 계산한다 — 아직
 * 완성되지 않은 낱말은 계속 span으로 남고, 공백이 오면 다음 호출에서 `head`로
 * 편입된다. Ruling 41: 이전 낱말의 살아 있는 트윈은 새 span을 만들기 전에 죽인다.
 */
const runWordSync = (
  root: MirrorTweenHost,
  settled: HTMLSpanElement,
  incoming: HTMLSpanElement,
  wordMeasureRef: React.MutableRefObject<{ word: string; top: number }>,
  next: string,
  reduced: boolean
): void => {
  (root.__mirrorTweens ?? []).forEach((tween) => tween.kill());
  root.__mirrorTweens = [];

  const lastSpaceIndex = next.lastIndexOf(' ');
  const head = lastSpaceIndex === -1 ? '' : next.slice(0, lastSpaceIndex + 1);
  const word = lastSpaceIndex === -1 ? next : next.slice(lastSpaceIndex + 1);

  if (word.length > MAX_WORD_CHARS) {
    settled.textContent = next;
    incoming.replaceChildren();
    wordMeasureRef.current = { word: '', top: 0 };
    return;
  }

  settled.textContent = head;
  incoming.replaceChildren();
  const span = document.createElement('span');
  span.className = styles.entering;
  span.textContent = word;
  incoming.appendChild(span);

  // 이 한 줄이 DOM 측정 전부다 — jsdom은 항상 0을 준다(위험 목록 2).
  const nextTop = span.offsetTop;
  const fromY = wrapFallOffset(
    wordMeasureRef.current.word,
    word,
    wordMeasureRef.current.top,
    nextTop
  );

  if (fromY !== null) {
    const tween = gateMotion(reduced, () =>
      gsap.from(span, {
        y: fromY,
        x: FALL_X,
        duration: gsapDuration.slow,
        ease: gsapEasing.snap,
      })
    );
    attachTweenCleanup(tween, root, reduced, () => {});
  }

  wordMeasureRef.current = { word, top: nextTop };
};

export const MirrorOverlay = ({
  inputRef,
  unit,
  geometryClassName,
}: MirrorOverlayProps): React.JSX.Element => {
  const rootRef = useRef<MirrorTweenHost>(null);
  const settledRef = useRef<HTMLSpanElement>(null);
  const incomingRef = useRef<HTMLSpanElement>(null);
  const lastSyncedRef = useRef<string | null>(null);
  const composingRef = useRef(false);
  const ownsTextRef = useRef(false);
  const wordMeasureRef = useRef<{ word: string; top: number }>({
    word: '',
    top: 0,
  });

  // "latest ref" — 마운트 시 한 번만 등록되는 imperative 이벤트 핸들러가
  // 매 렌더 최신 reduced 값을 읽게 한다(effect 없이 렌더 본문에서 동기화).
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const sync = (nextValue: string): void => {
    if (lastSyncedRef.current === nextValue) return;
    const root = rootRef.current;
    const settled = settledRef.current;
    const incoming = incomingRef.current;
    if (!root || !settled || !incoming) return;

    const prev = lastSyncedRef.current;

    if (prev === null) {
      // 마운트 첫 동기화 — 이미 그려 둔 초기값을 애니메이션 없이 인정한다
      // (Checkbox.tsx의 syncMarkState와 같은 이유: 초기 페인트 번쩍임 없음).
      settled.textContent = nextValue;
      incoming.replaceChildren();
      lastSyncedRef.current = nextValue;
      return;
    }

    if (unit === 'char') {
      runCharSync(root, settled, incoming, prev, nextValue, reducedRef.current);
    } else {
      runWordSync(
        root,
        settled,
        incoming,
        wordMeasureRef,
        nextValue,
        reducedRef.current
      );
    }
    lastSyncedRef.current = nextValue;
  };

  // 경로 1: input의 'input' 이벤트 — 비제어 컴포넌트는 타이핑해도 React가 렌더하지 않는다.
  // 마운트/언마운트에서 리스너를 등록·정리한다 (deps 없음 — 한 번만).
  useLayoutEffect(() => {
    const input = inputRef.current;
    const root = rootRef.current;
    if (!input || !root) return;

    input.classList.add(styles.hiddenText);
    root.__mirrorTweens = [];

    const evaluateOwnership = (): void => {
      const owns = composingRef.current || evaluateHasSelection(input);
      applyBrowserOwnsText(owns, input, root, ownsTextRef);
    };

    const handleCompositionStart = (): void => {
      composingRef.current = true;
      evaluateOwnership();
    };

    const handleCompositionEnd = (): void => {
      // 순서: 먼저 플래그를 내려 미러가 다시 보이게 하고, 그 다음 확정된 값을 동기화한다.
      composingRef.current = false;
      evaluateOwnership();
      sync(input.value);
    };

    const handleInput = (): void => {
      syncScroll(root, input, unit);
      if (!composingRef.current) {
        sync(input.value);
      }
    };

    const handleScroll = (): void => {
      syncScroll(root, input, unit);
    };

    SELECTION_REEVAL_EVENTS.forEach((eventName) =>
      input.addEventListener(eventName, evaluateOwnership)
    );
    input.addEventListener('input', handleInput);
    input.addEventListener('scroll', handleScroll);
    input.addEventListener('compositionstart', handleCompositionStart);
    input.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      root.__mirrorTweens?.forEach((tween) => tween.kill());
      root.__mirrorTweens = [];
      SELECTION_REEVAL_EVENTS.forEach((eventName) =>
        input.removeEventListener(eventName, evaluateOwnership)
      );
      input.removeEventListener('input', handleInput);
      input.removeEventListener('scroll', handleScroll);
      input.removeEventListener('compositionstart', handleCompositionStart);
      input.removeEventListener('compositionend', handleCompositionEnd);
      input.classList.remove(styles.hiddenText);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 경로 2: 매 렌더의 layout effect에서 input.value를 읽는다 — 제어 컴포넌트의
  // prop 변경을 잡는다. sync는 멱등이라 매 렌더 호출해도 안전하다.
  useLayoutEffect(() => {
    const input = inputRef.current;
    const root = rootRef.current;
    if (!input || !root) return;
    sync(input.value);
    syncScroll(root, input, unit);
  });

  return (
    <div
      ref={rootRef}
      className={clsx(styles.root, styles.unit[unit], geometryClassName)}
      aria-hidden="true"
    >
      <span ref={settledRef} />
      <span ref={incomingRef} />
    </div>
  );
};
