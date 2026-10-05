import {
  useEffect,
  useRef,
  useMemo,
  useId,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { gsap } from 'gsap';
import {
  backdrop,
  bottomSheetContainer,
  bottomSheet as bottomSheetStyle,
  heightStyles,
  handle,
  header,
  title as titleStyle,
  closeButton,
  content,
} from './BottomSheet.css';
import { IconButton } from '../IconButton';
import { Glyph } from '../../_internal/glyph';
import { useFocusTrap } from '../../_internal/useFocusTrap';
import { createOverlayContext } from '../../_internal/createOverlayContext';
import { useOverlayTransition } from '../../_internal/useOverlayTransition';
import { gateMotion } from '../../hooks/gateMotion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

interface BottomSheetContextValue {
  onClose: () => void;
  titleId: string;
}

const [BottomSheetContext, useBottomSheetContext] =
  createOverlayContext<BottomSheetContextValue>('BottomSheet');

/** 이 거리보다 아래로 끌고 놓으면 닫는다. */
const DRAG_CLOSE_THRESHOLD_PX = 100;

/**
 * 시트가 올라와 목표를 지나치는 거리(px). 고정 px인 이유: 시트 이동거리는 시트
 * 높이와 같아서 `snap`(넘침 10%)을 그대로 걸면 240px 시트는 24px, 600px 시트는
 * 61px로 들쭉날쭉하고 큰 시트는 만화처럼 튄다. 높이와 무관하게 같은 크기로 튀게
 * 비율(`yPercent`)로 환산해 건다.
 */
const BOUNCE_OVERSHOOT_PX = 16;

/** 내용이 떠오르는 거리(px). `Modal`·`BubbleMenu`와 같은 24. */
const STAGGER_RISE_Y = 24;
/** 내용 항목 사이의 시차(초). folderfloat `stagger = 45`ms. */
const STAGGER_STEP = 0.045;
/** 시차를 받는 항목 수. 9번째부터는 8번째와 같이 뜬다(긴 목록이 늦게 끝나지 않게). */
const STAGGER_MAX = 8;
/** 내용이 뜨기 시작하는 지점: 시트 1단(`slow`)의 60%. 시트가 거의 올라왔을 때다. */
const STAGGER_AT = 0.6;

/**
 * float 루프는 등장이 끝나면 `data-floating`이 붙고 시트가 사라질 때까지 그대로다.
 * 떼면 `translate`가 0으로 돌아가며 시트가 툭 떨어지므로 떼지 않는다. 멈춤은
 * 별도 표시 `data-float-paused`(`animation-play-state: paused`)가 맡아 그 자리에 세운다.
 */
const setFloating = (sheet: HTMLElement | null) =>
  sheet?.toggleAttribute('data-floating', true);
const setFloatPaused = (sheet: HTMLElement | null, on: boolean) =>
  sheet?.toggleAttribute('data-float-paused', on);

/** 테스트 전용: 등장 타임라인과 내용 시차 타임라인을 시트 노드에 얹는다(Modal과 같은 모양). */
type BottomSheetTimelineHost = HTMLDivElement & {
  __bottomSheetTimeline?: gsap.core.Timeline;
  __bottomSheetStagger?: gsap.core.Timeline;
};

/** 화면 하단에서 올라오는 시트 컴포넌트. Compound 패턴(BottomSheet.Header/Content) 또는 Flat 패턴(title prop) 지원 */
export interface BottomSheetProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /** 시트 표시 여부 */
  open: boolean;
  /** 시트 닫기 콜백 */
  onClose: () => void;
  /** Flat 모드: 시트 제목. 설정 시 자동으로 헤더 생성 */
  title?: ReactNode;
  /** 시트 콘텐츠 */
  children: ReactNode;
  /** 시트 높이 @default 'auto' */
  height?: 'auto' | 'sm' | 'md' | 'lg' | 'full';
  /** 배경 클릭으로 닫기 허용 @default true */
  closeOnBackdropClick?: boolean;
  /** ESC 키로 닫기 허용 @default true */
  closeOnEscape?: boolean;
  /** 상단 드래그 핸들 표시 @default true */
  showHandle?: boolean;
  /** 닫기(X) 버튼 표시 @default false */
  showClose?: boolean;
  /** 드래그로 닫기 허용 @default true */
  enableDrag?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

const BottomSheetRoot = ({
  open,
  onClose,
  title,
  children,
  height = 'auto',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showHandle = true,
  showClose = false,
  enableDrag = true,
  className,
  'aria-labelledby': ariaLabelledby,
  ...props
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  /** 놓은 뒤 쉬는 자리로 돌아가는 트윈. 다시 잡으면 죽인다. */
  const restTweenRef = useRef<gsap.core.Tween | null>(null);
  /**
   * 내용 시차. 등장 타임라인 **밖**의 별도 타임라인이다. 안에 두면 등장 길이가
   * 시차 꼬리만큼 늘고(항목 6개에 705ms), 훅이 퇴장을 역재생할 때 그 꼬리부터
   * 풀어서 시트가 100ms 넘게 가만히 있는다. 밖에 두면 되감기지 않는다.
   */
  const staggerRef = useRef<gsap.core.Timeline | null>(null);
  const reduced = useReducedMotion();

  // 접근성(포커스 트랩 + ESC) 및 스크롤 제어 — 퇴장이 끝난 뒤 포커스를 복원해야
  // 하므로 restoreFocusOnClose는 false로 두고, 훅의 onExited에서
  // previousActiveElementRef를 직접 사용해 복원한다(기존 타이밍 그대로 유지).
  const { previousActiveElementRef } = useFocusTrap({
    open,
    onClose,
    closeOnEscape,
    containerRef: sheetRef,
    restoreFocusOnClose: false,
  });

  // 백드롭과 시트를 한 타임라인에 넣는다. 시트는 `yPercent`(시트 높이 기준)를
  // 쓰고 드래그는 `y`(px)를 쓴다 — GSAP이 두 채널을 하나의 transform으로
  // 합성하므로 손가락과 타임라인이 같은 속성을 놓고 다투지 않는다.
  // float 루프는 CSS `translate`라 이 둘과도 따로 합성된다.
  const { shouldRender } = useOverlayTransition({
    open,
    buildTimeline: (timeline) => {
      const backdropEl = backdropRef.current;
      const sheet = sheetRef.current;

      if (backdropEl) {
        timeline.fromTo(
          backdropEl,
          { opacity: 0 },
          { opacity: 1, duration: gsapDuration.base, ease: gsapEasing.settle },
          0
        );
      }
      if (sheet) {
        (sheet as BottomSheetTimelineHost).__bottomSheetTimeline = timeline;
        // 높이를 읽을 수 없으면(0, jsdom) 넘침 없이 곧장 앉는다. 0으로 나누지 않는다.
        const height = sheet.offsetHeight;
        const overshoot = height > 0 ? (BOUNCE_OVERSHOOT_PX / height) * 100 : 0;
        if (overshoot > 0) {
          // 1단: 목표를 지나쳐 오르고, 2단: 앉는다. 두 단의 이음매는 속도가 0이다.
          timeline.fromTo(
            sheet,
            { yPercent: 100 },
            {
              yPercent: -overshoot,
              duration: gsapDuration.slow,
              ease: gsapEasing.settle,
            },
            0
          );
          timeline.fromTo(
            sheet,
            { yPercent: -overshoot },
            {
              yPercent: 0,
              duration: gsapDuration.base,
              ease: gsapEasing.drift,
              immediateRender: false,
            },
            gsapDuration.slow
          );
        } else {
          timeline.fromTo(
            sheet,
            { yPercent: 100 },
            {
              yPercent: 0,
              duration: gsapDuration.slow,
              ease: gsapEasing.settle,
            },
            0
          );
        }

        // 내용은 시트가 거의 올라왔을 때 시차를 두고 뜬다. 헤더·핸들은 시트와 같이
        // 올라오므로 대상이 아니다. y와 opacity를 한 트윈에 묶지 않는다: snap은
        // 넘치는 커브라 불투명도에 걸면 1을 넘었다 돌아온다.
        const items = Array.from(
          sheet.querySelector(`.${content}`)?.children ?? []
        );
        // 다시 만들 때(축소 선호가 뒤집힐 때) 낡은 시차가 같은 대상을 놓고 다투지 않게 한다.
        staggerRef.current?.kill();
        staggerRef.current = null;
        if (items.length > 0) {
          // 처음 8개만 시차를 받는다. GSAP의 `stagger`는 항목 수에 따라 간격을
          // 나누므로 쓰지 않고 항목별 시작 시각을 직접 준다.
          const stagger = gsap.timeline({ paused: true });
          items.forEach((item, i) => {
            const start = Math.min(i, STAGGER_MAX - 1) * STAGGER_STEP;
            stagger.fromTo(
              item,
              { y: STAGGER_RISE_Y },
              { y: 0, duration: gsapDuration.slow, ease: gsapEasing.snap },
              start
            );
            stagger.fromTo(
              item,
              { opacity: 0 },
              {
                opacity: 1,
                duration: gsapDuration.fast,
                ease: gsapEasing.settle,
              },
              start
            );
          });
          staggerRef.current = stagger;
          (sheet as BottomSheetTimelineHost).__bottomSheetStagger = stagger;

          // 등장이 정방향으로 이 지점을 지날 때 시차를 처음부터 돌린다. `call`은
          // 역재생이 이 지점을 지날 때도 불리므로 방향을 확인한다. 축소 선호면
          // 게이트가 등장을 끝 상태로 확정하며 이것도 불리는데, 시차도 끝으로 확정한다.
          timeline.call(
            () => {
              if (timeline.reversed()) return;
              if (reduced) stagger.progress(1);
              else stagger.restart();
            },
            [],
            gsapDuration.slow * STAGGER_AT
          );
        }

        // 등장이 끝나면 둥실거리기 시작한다. 이후 시트가 사라질 때까지 붙어 있다.
        // 축소 선호면 게이트가 타임라인을 끝 상태로 확정하면서 이것도 켜지는데,
        // 전역 규칙이 루프를 접는다. 손가락이 먼저 잡았다면 `data-float-paused`가
        // 이미 붙어 있어 놓을 때까지 선 채로 있다.
        timeline.eventCallback('onComplete', () =>
          setFloating(sheetRef.current)
        );
      }
    },
    onExited: () => previousActiveElementRef.current?.focus(),
  });

  // 닫는 중엔 둥실거림이 그 자리에 선다(떼지 않는다. 떼면 시트가 툭 떨어진다).
  // 내용 시차는 되감지 않고 끝 상태로 확정해 시트에 실려 내려가게 한다.
  // 손가락이 내려간 채 닫혀 놓는 이벤트를 아무도 못 받으면 `isDraggingRef`가
  // 낡은 채 남아 다시 열 때 멈춤을 풀지 못하므로 여기서 되돌린다.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!open) {
      isDraggingRef.current = false;
      setFloatPaused(sheet, true);
      staggerRef.current?.progress(1);
    } else {
      setFloatPaused(sheet, false);
    }
  }, [open]);

  useEffect(
    () => () => {
      staggerRef.current?.kill();
    },
    []
  );

  //드래그 제어 로직
  useEffect(() => {
    if (!enableDrag || !open) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    // 손가락을 1:1로 따라가는 쓰기. 트윈이 아니라 즉시 쓰기라 추종이 늦지 않고,
    // `style.transform`에 직접 쓰는 것과 달리 타임라인의 `yPercent`를 지우지
    // 않는다 — GSAP이 같은 transform 캐시를 갱신해 두 채널을 합성한다.
    const dragTo = gsap.quickSetter(sheet, 'y', 'px') as (
      value: number
    ) => void;

    /**
     * 쉬는 자리(y=0)로 되돌린다. 축소 선호면 트윈 없이 즉시 붙는다. float은 이
     * 트윈과 무관하다(`y`와 `translate`는 다른 속성): 놓는 이벤트에서 이미 풀렸다.
     */
    const restToY0 = () => {
      restTweenRef.current = gateMotion(reduced, () =>
        gsap.to(sheet, {
          y: 0,
          duration: gsapDuration.fast,
          ease: gsapEasing.settle,
        })
      );
    };

    // 드래그로 닫히던 시트가 퇴장 도중 다시 열리면 손가락이 남긴 오프셋이 그대로
    // 남는다 — 열릴 때마다 쉬는 자리로 데려온다(갓 마운트된 시트는 이미 0이라
    // 눈에 보이는 변화가 없다). 단, 손가락이 내려가 있는 동안은 건드리지 않는다:
    // deps의 `onClose`가 인라인 화살표면 부모 리렌더마다 이 effect가 다시 돌고,
    // 그때 복귀 트윈을 걸면 `quickSetter`와 같은 `y`를 놓고 서로 되돌린다.
    if (!isDraggingRef.current) restToY0();

    const finishDrag = (diff: number) => {
      isDraggingRef.current = false;
      // 복귀 트윈이 끝나길 기다리지 않는다. 트윈이 재렌더에 죽어도 float은 돌아온다.
      setFloatPaused(sheet, false);

      if (diff > DRAG_CLOSE_THRESHOLD_PX) {
        // 닫기는 타임라인에 넘긴다 — 시트는 손가락이 멈춘 자리에서 그대로
        // 이어 내려간다(드래그가 만든 y 오프셋은 그대로 둔다. 화면 밖으로
        // 나가는 방향이라 되돌리면 오히려 위로 튀어오른다). 자체 전이를 걸면
        // 타임라인과 transform을 놓고 다툰다.
        onClose();
        return;
      }
      restToY0();
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest(
        'button, a, input, select, textarea'
      );
      if (isInteractive) return;
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;
      setFloatPaused(sheet, true);
      restTweenRef.current?.kill();
      restTweenRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) {
        dragTo(diff);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const diff = e.changedTouches[0].clientY - startYRef.current;
      finishDrag(diff);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // handle 영역 또는 header 영역에서만 드래그 시작 (버튼 클릭과 구분)
      const target = e.target as HTMLElement;
      const isInteractive = target.closest(
        'button, a, input, select, textarea'
      );
      if (isInteractive) return;
      startYRef.current = e.clientY;
      isDraggingRef.current = true;
      setFloatPaused(sheet, true);
      restTweenRef.current?.kill();
      restTweenRef.current = null;
    };

    // mousemove/mouseup은 document에 등록 — 마우스가 시트 밖으로 나가도 감지
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const diff = e.clientY - startYRef.current;
      if (diff > 0) {
        dragTo(diff);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const diff = e.clientY - startYRef.current;
      finishDrag(diff);
    };

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: true });
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true });
    sheet.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
      sheet.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      restTweenRef.current?.kill();
      restTweenRef.current = null;
    };
  }, [enableDrag, open, onClose, reduced]);

  const contextValue = useMemo(
    () => ({ onClose, titleId }),
    [onClose, titleId]
  );

  if (!shouldRender) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  const flatTitleId = title ? titleId : undefined;
  // compound 경로(BottomSheet.Title)는 title prop이 없어 flatTitleId가 undefined다.
  // titleId로 최종 폴백해 BottomSheet.Title이 같은 id를 받아 접근 가능 이름을 갖게 한다.
  const labelledby = ariaLabelledby ?? flatTitleId ?? titleId;

  const sheetContent = (
    <BottomSheetContext.Provider value={contextValue}>
      <div className={bottomSheetContainer}>
        <div
          ref={backdropRef}
          role="presentation"
          className={backdrop}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- dialog 내부 클릭이 backdrop으로 전파되는 것을 막기 위한 stopPropagation */}
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledby}
          // 퇴장 중(open=false, shouldRender=true)엔 DOM이 잠깐 더 남아있어도
          // 포커스가 그 안으로 들어가거나 클릭될 수 없게 inert로 막는다.
          inert={!open}
          className={clsx(bottomSheetStyle, heightStyles[height], className)}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {showHandle && (
            <div className={handle} data-testid="bottomsheet-handle" />
          )}

          {title ? (
            <>
              <div className={header}>
                <h2 id={flatTitleId} className={titleStyle}>
                  {title}
                </h2>
                {showClose && (
                  <IconButton
                    variant="dark"
                    buttonStyle="weak"
                    size="sm"
                    onClick={onClose}
                    aria-label="닫기"
                    className={closeButton}
                  >
                    <Glyph name="close" size="sm" />
                  </IconButton>
                )}
              </div>
              <div className={content}>{children}</div>
            </>
          ) : (
            children
          )}
        </div>
      </div>
    </BottomSheetContext.Provider>
  );

  return createPortal(sheetContent, document.body);
};

BottomSheetRoot.displayName = 'BottomSheet';

// Compound API 서브 컴포넌트들
/** BottomSheet 헤더 영역. Compound 패턴에서 사용 */
export interface BottomSheetHeaderProps extends HTMLAttributes<HTMLElement> {
  /** 헤더 콘텐츠 */
  children: ReactNode;
  /** 닫기(X) 버튼 표시 @default false */
  showClose?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const BottomSheetHeader = forwardRef<
  HTMLElement,
  BottomSheetHeaderProps
>(({ children, showClose = false, className, ...props }, ref) => {
  const context = useBottomSheetContext();

  return (
    <header ref={ref} className={clsx(header, className)} {...props}>
      <div style={{ flex: 1 }}>{children}</div>
      {showClose && context && (
        <IconButton
          variant="dark"
          buttonStyle="weak"
          size="sm"
          onClick={context.onClose}
          aria-label="닫기"
          className={closeButton}
        >
          <Glyph name="close" size="sm" />
        </IconButton>
      )}
    </header>
  );
});

BottomSheetHeader.displayName = 'BottomSheetHeader';

/**
 * BottomSheet.Title — 시트 제목. Compound 패턴에서 사용
 *
 * `id`는 컴포넌트가 소유한다 — 루트의 `aria-labelledby`가 이 id를 가리키므로
 * 소비자 `id`가 이기면 다이얼로그의 접근 가능 이름이 조용히 사라진다. 제목
 * 요소를 직접 참조해야 하면 루트에 `aria-labelledby`를 줘라.
 */
export interface BottomSheetTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** 제목 텍스트 */
  children: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const BottomSheetTitle = forwardRef<
  HTMLHeadingElement,
  BottomSheetTitleProps
>(({ children, className, ...props }, ref) => {
  const context = useBottomSheetContext();

  return (
    <h2
      ref={ref}
      className={clsx(titleStyle, className)}
      {...props}
      id={context?.titleId}
    >
      {children}
    </h2>
  );
});

BottomSheetTitle.displayName = 'BottomSheetTitle';

/** BottomSheet 본문 영역. Compound 패턴에서 사용 */
export interface BottomSheetContentProps extends HTMLAttributes<HTMLDivElement> {
  /** 본문 콘텐츠 */
  children: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

export const BottomSheetContent = forwardRef<
  HTMLDivElement,
  BottomSheetContentProps
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={clsx(content, className)} {...props}>
      {children}
    </div>
  );
});

BottomSheetContent.displayName = 'BottomSheetContent';

// ─── BottomSheet = BottomSheetRoot + Compound 서브 컴포넌트 ────────────────────────

export const BottomSheet = Object.assign(BottomSheetRoot, {
  Header: BottomSheetHeader,
  Title: BottomSheetTitle,
  Content: BottomSheetContent,
});
