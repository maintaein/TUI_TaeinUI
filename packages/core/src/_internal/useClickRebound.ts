import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

// 왜 90ms인가: press-in(150ms, settle)의 60%. settle의 linear() 샘플을 보간해
// 실측하면 그 시점에 scale이 목표 거리의 97.4%에 닿아서 30ms 탭도 눌렸다는 것이
// 읽힌다(닫힌 식이 아니라 생성된 샘플이라 식으로 적지 않는다). 이보다 길게
// 붙잡으면 빠른 연타가 굼떠 보인다.
// 토큰 스케일(fast 150 / base 200 ...)에 대응 값이 없다. CSS가 아니라 JS가
// 해제 시점을 정하는 값이라 duration 토큰이 아니고, 옵션으로 열지 않는다.
const MIN_PRESS_MS = 90;

/** 소비자가 이미 갖고 있는 핸들러. 훅이 먼저 이것을 부르고 자기 일을 한다. */
export interface UseClickReboundHandlers<T extends HTMLElement> {
  onPointerDown?: (event: PointerEvent<T>) => void;
  onPointerUp?: (event: PointerEvent<T>) => void;
  onPointerLeave?: (event: PointerEvent<T>) => void;
  onPointerCancel?: (event: PointerEvent<T>) => void;
  onKeyDown?: (event: KeyboardEvent<T>) => void;
  onKeyUp?: (event: KeyboardEvent<T>) => void;
  onBlur?: (event: FocusEvent<T>) => void;
}

export interface UseClickReboundReturn<T extends HTMLElement> {
  /** 루트에 `data-pressed={pressed ? '' : undefined}`로 건다. */
  pressed: boolean;
  /** 루트에 펼쳐 건다. 소비자 핸들러를 먼저 부르고 누름 상태를 맞춘다. */
  handlers: Required<UseClickReboundHandlers<T>>;
}

/**
 * 누름 상태의 수명을 CSS `:active` 대신 JS가 정하게 하는 원시요소(Button, Chip).
 *
 * data-pressed는 :active 대신 누름 상태의 수명을 JS가 정하게 하는 손잡이다.
 * 해제 요청이 설정 후 MIN_PRESS_MS 안에 오면 남은 시간만큼 미룬다.
 * 포인터와 키보드(Enter/Space)가 같은 경로를 쓴다. 포커스된 버튼의 Space
 * 활성화는 클릭과 같은 단일 행동이라 포인터 사용자만 피드백을 받으면 안 된다.
 *
 * @param disabled 비활성이 되는 순간 누름 상태를 비운다
 * @param user 소비자의 기존 핸들러. 합성해서 돌려준다
 */
export const useClickRebound = <T extends HTMLElement>(
  disabled: boolean,
  user: UseClickReboundHandlers<T> = {}
): UseClickReboundReturn<T> => {
  const [pressed, setPressed] = useState(false);
  const minHoldRef = useRef(false);
  const releaseAskedRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(holdTimerRef.current), []);

  // 비활성이 되는 순간 누름 상태를 비운다. Enter는 keydown에서 click이 나서
  // onClick이 loading을 켜면 버튼이 곧바로 disabled가 되고, 그러면 keyup과 blur가
  // 오지 않아 눌린 모양이 다시 활성화된 뒤까지 남는다. 상태는 렌더 중에 맞추고
  // (effect 안 setState는 연쇄 렌더라 lint가 막는다), ref와 타이머는 effect가 정리한다.
  const [wasDisabled, setWasDisabled] = useState(disabled);
  if (wasDisabled !== disabled) {
    setWasDisabled(disabled);
    if (disabled) setPressed(false);
  }

  useEffect(() => {
    if (!disabled) return;
    clearTimeout(holdTimerRef.current);
    minHoldRef.current = false;
    releaseAskedRef.current = false;
  }, [disabled]);

  const press = () => {
    clearTimeout(holdTimerRef.current);
    minHoldRef.current = true;
    releaseAskedRef.current = false;
    setPressed(true);
    holdTimerRef.current = setTimeout(() => {
      minHoldRef.current = false;
      if (releaseAskedRef.current) setPressed(false);
    }, MIN_PRESS_MS);
  };

  const release = () => {
    if (minHoldRef.current) releaseAskedRef.current = true;
    else setPressed(false);
  };

  return {
    pressed,
    handlers: {
      onPointerDown: (event) => {
        user.onPointerDown?.(event);
        // 보조 버튼(우클릭)에는 걸지 않는다. 우클릭에 :active가 켜지지 않던
        // 기존 동작과 같다. (macOS ctrl+click은 button이 0이라 이 가드가 못 막는다.)
        if (event.button !== 0) return;
        press();
      },
      onPointerUp: (event) => {
        user.onPointerUp?.(event);
        release();
      },
      onPointerLeave: (event) => {
        user.onPointerLeave?.(event);
        release();
      },
      onPointerCancel: (event) => {
        user.onPointerCancel?.(event);
        release();
      },
      onKeyDown: (event) => {
        user.onKeyDown?.(event);
        // 길게 누르면 keydown이 반복해 오므로 repeat은 타이머를 다시 시작하지 않는다.
        if (event.repeat) return;
        if (event.key === 'Enter' || event.key === ' ') press();
      },
      onKeyUp: (event) => {
        user.onKeyUp?.(event);
        if (event.key === 'Enter' || event.key === ' ') release();
      },
      onBlur: (event) => {
        user.onBlur?.(event);
        // 키를 누른 채 포커스가 떠나면 keyup이 오지 않는다.
        release();
      },
    },
  };
};
