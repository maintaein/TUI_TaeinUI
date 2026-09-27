import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import {
  snackbar,
  severityStyles,
  positionStyles,
  content,
  message as messageClass,
  actions,
  closeButton,
  visuallyHidden,
  bar,
} from './Snackbar.css';
import { IconButton } from '../IconButton';
import { Icon, type IconName } from '../Icon';
import { useOverlayTransition } from '../../_internal/useOverlayTransition';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * 축소 모드에서 막대를 몇 단으로 끊을지 (Ruling 14). 정확한 개수를 못 박은
 * 명세는 없다 — 연속으로 흐르는 것처럼 안 보이면서도 "줄어드는 중"이라는
 * 정보는 남는 선에서 고른 값이다.
 */
const REDUCED_MOTION_BAR_STEPS = 8;

/**
 * 카운트다운 트윈을 테스트가 읽을 수 있는 통로. 공개 prop/state로 내보내지
 * 않고 막대 DOM 노드에 얹는다 — 타입 전용 확장이라 값으로 export되지 않고,
 * `SnackbarProps`에도 없으니 공개 API·`dist` 표면에 안 나간다(함정 2).
 * 테스트는 실제 GSAP 인스턴스를 그대로 받아 `progress()`/`time()`으로
 * seek한다(무모킹 — 가짜 트윈을 만들지 않는다).
 */
interface CountdownTweenHost extends HTMLDivElement {
  __countdownTween?: gsap.core.Tween;
}

/** 화면 모서리에 일시적으로 표시되는 알림 컴포넌트 */
export interface SnackbarProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'content'
> {
  /** 스낵바 표시 여부 */
  open: boolean;
  /** 알림 메시지 */
  message: ReactNode;
  /** 알림 유형 (색상 및 아이콘 결정) @default 'info' */
  severity?: 'success' | 'error' | 'warning' | 'info';
  /** 화면 내 표시 위치 @default 'bottom-center' */
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  /** 자동 닫힘 시간(ms). null이면 자동 닫힘 비활성화 @default 6000 */
  autoHideDuration?: number | null;
  /** 닫기 콜백 */
  onClose?: () => void;
  /** 메시지 옆 액션 영역 (버튼 등) */
  action?: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

const SEVERITY_ICONS: Record<
  NonNullable<SnackbarProps['severity']>,
  IconName
> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
};

/**
 * 라이브 리전이 함께 읽어 줄 severity 접두사. 시각 채널은 아이콘이 닫지만
 * 아이콘이 aria-hidden이라 소리 채널에는 severity가 실리지 않는다.
 */
const SEVERITY_LABELS: Record<
  NonNullable<SnackbarProps['severity']>,
  string
> = {
  success: '성공',
  error: '오류',
  warning: '경고',
  info: '알림',
};

export const Snackbar = ({
  open,
  message,
  severity = 'info',
  position = 'bottom-center',
  autoHideDuration = 6000,
  onClose,
  action,
  className,
  ...props
}: SnackbarProps) => {
  const reduced = useReducedMotion();
  // rAF onUpdate 콜백에서 읽을 최신값. 렌더 중 ref를 직접 쓰면 안 되므로
  // (react-hooks/refs) effect에서 동기화한다 — 이 값이 바뀐다고 카운트다운
  // 트윈을 다시 만들지는 않는다(Ruling 14: 시계는 안 건드리고 막대의 그림만
  // 바뀐다).
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const sheetRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const pauseSourcesRef = useRef<Set<'hover' | 'focus'>>(new Set());

  const [liveMessage, setLiveMessage] = useState<ReactNode>(null);

  // `onClose`가 없으면 닫을 수단이 없다. 빈 채로 줄어드는 막대는 거짓말이라
  // 애초에 만들지 않는다(완료 조건 7) — 지금 타이머가 무장되는 조건과 같다.
  const hasCountdown = autoHideDuration !== null && !!onClose;

  const { shouldRender } = useOverlayTransition({
    open,
    buildTimeline: (timeline) => {
      const sheet = sheetRef.current;
      if (!sheet) return;

      const isTop = position.startsWith('top');
      const isCenter = position.endsWith('center');
      const yPercent = isTop ? -100 : 100;

      // center 2종은 GSAP이 transform을 통째로 소유한다(함정 1) — xPercent를
      // from·to에 같은 값(-50)으로 넣어 두면 가로 위치는 고정된 채 yPercent·
      // opacity만 실제로 움직인다. CSS 쪽 `translateX(-50%)`는 지웠다(있으면
      // GSAP이 쓰는 transform과 서로 덮어써 하나가 사라진다).
      timeline.fromTo(
        sheet,
        {
          yPercent,
          opacity: 0,
          ...(isCenter ? { xPercent: -50 } : {}),
        },
        {
          yPercent: 0,
          opacity: 1,
          ...(isCenter ? { xPercent: -50 } : {}),
          duration: gsapDuration.slow,
          ease: gsapEasing.settle,
        },
        0
      );
    },
  });

  useEffect(() => {
    // 렌더 중에 바로 채우면 리전 노드와 내용이 동시에 생겨 스크린 리더가 못 읽는 경우가
    // 생긴다(처음부터 open인 채 마운트하는 경로). 한 틱 늦게 채우는 것이 목적이라 의도적으로
    // effect에서 setState한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveMessage(
      open ? (
        <>
          {SEVERITY_LABELS[severity]}: {message}
        </>
      ) : null
    );
  }, [open, message, severity]);

  // 카운트다운 트윈 — 이게 시계다. 같은 트윈의 progress가 막대의 시각
  // 진행도이자 onComplete의 근거라 진실이 하나다(완료 조건 1). `useState`로
  // 남은 시간을 복제하지 않는다 — 복제하는 순간 막대와 닫힘이 갈라질 자리가
  // 생긴다. CSS/WAAPI로는 "같은 진행률을 읽어 막대와 닫힘을 동시에 구동"이
  // 안 된다(명제 라인 169 · Ruling 15) — GSAP의 진행률 read-back이 필요한
  // 이유가 이것이다.
  //
  // Ruling 14: gateMotion을 거치지 않는다. gateMotion은 애니메이션을 끝
  // 상태로 확정하는데, 6초 카운트다운에 그걸 적용하면 스낵바가 즉시 닫힌다.
  // 축소 선호는 "시간을 건너뛰어라"가 아니다. 그래서 이 파일이
  // `GATE_ENFORCEMENT_EXCEPTIONS`의 첫 항목이다 — 등장·퇴장은 위
  // `useOverlayTransition`이 이미 게이트를 거친다.
  useEffect(() => {
    if (!open || !hasCountdown) return;

    const barEl = barRef.current;
    // 실제 DOM 속성을 트윈 타깃으로 삼지 않는다 — 막대는 onUpdate에서
    // `transform: scaleX()`로 직접 그린다(완료 조건 9, width 애니메이션 금지).
    // 이 더미 객체의 `remaining`이 "남은 시간 비율"이고, 그 값 자체가 남은
    // 시간 계산과 막대 그림 양쪽의 유일한 출처다.
    const proxy = { remaining: 1 };

    const tween = gsap.to(proxy, {
      remaining: 0,
      duration: (autoHideDuration as number) / 1000,
      // 항상 linear(none)다 — 축소 선호가 바뀌어도 시계 자체(이 이징)는 안
      // 바뀐다. 바뀌는 건 아래 onUpdate가 그리는 시각값뿐이다.
      ease: gsapEasing.linear,
      onUpdate: () => {
        if (!barEl) return;
        const value = reducedRef.current
          ? Math.ceil(proxy.remaining * REDUCED_MOTION_BAR_STEPS) /
            REDUCED_MOTION_BAR_STEPS
          : proxy.remaining;
        barEl.style.transform = `scaleX(${value})`;
      },
      onComplete: () => {
        onClose?.();
      },
    });

    tweenRef.current = tween;
    if (barEl) {
      (barEl as CountdownTweenHost).__countdownTween = tween;
    }

    return () => {
      tween.kill();
      tweenRef.current = null;
    };
  }, [open, hasCountdown, autoHideDuration, onClose]);

  // 포인터·키보드가 같은 신호를 쓴다 — 둘 다 같은 pause()/resume()을 부른다.
  // 소스를 Set으로 들고 있는 이유: 마우스가 스낵바 위에 있는 채로 action에
  // 포커스가 들어와도(또는 그 반대) 하나가 먼저 빠져나가면서 시계가
  // 섣불리 재개되면 안 된다 — 둘 다 빠져야 재개한다.
  const pause = (source: 'hover' | 'focus') => {
    pauseSourcesRef.current.add(source);
    tweenRef.current?.pause();
  };

  const resume = (source: 'hover' | 'focus') => {
    pauseSourcesRef.current.delete(source);
    if (pauseSourcesRef.current.size === 0) {
      // GSAP의 resume()은 멈춘 자리에서 이어진다 — 처음부터 다시가 아니다
      // (완료 조건 5). 별도 로직이 필요 없다.
      tweenRef.current?.resume();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <div role="status" className={visuallyHidden}>
        {liveMessage}
      </div>
      {shouldRender && (
        <div
          ref={sheetRef}
          // 퇴장 중(open=false, shouldRender=true)엔 DOM이 남아있어도
          // action·닫기 버튼이 포커스되거나 클릭될 수 없게 inert로 막는다.
          inert={!open}
          className={clsx(
            snackbar,
            severityStyles[severity],
            positionStyles[position],
            className
          )}
          onMouseEnter={() => pause('hover')}
          onMouseLeave={() => resume('hover')}
          onFocus={() => pause('focus')}
          onBlur={() => resume('focus')}
          {...props}
        >
          <div className={content}>
            <Icon name={SEVERITY_ICONS[severity]} size="sm" />
            <span className={messageClass}>{message}</span>
            <div className={actions}>
              {action}
              <IconButton
                variant="dark"
                buttonStyle="weak"
                size="sm"
                onClick={handleClose}
                aria-label="닫기"
                className={closeButton}
              >
                <Icon name="close" size="sm" />
              </IconButton>
            </div>
          </div>
          {hasCountdown && (
            <div ref={barRef} className={bar} aria-hidden="true" />
          )}
        </div>
      )}
    </>
  );
};

Snackbar.displayName = 'Snackbar';
