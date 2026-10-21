import {
  useMemo,
  forwardRef,
  useId,
  useRef,
  type ReactNode,
  type HTMLAttributes,
  type RefObject,
} from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import {
  backdrop,
  modalContainer,
  modalDialog,
  sizeStyles,
  modalHeader as modalHeaderStyle,
  modalHeaderContent,
  modalTitle as modalTitleStyle,
  modalCloseButton,
  modalContent as modalContentStyle,
  modalFooter as modalFooterStyle,
  footerAlignStyles,
} from './Modal.css';
import { useFocusTrap } from '../../_internal/useFocusTrap';
import { Glyph } from '../../_internal/glyph';
import { getActiveHTMLElement } from '../../_internal/dom';
import { createOverlayContext } from '../../_internal/createOverlayContext';
import { useOverlayTransition } from '../../_internal/useOverlayTransition';
import { gsapDuration, gsapEasing } from '../../tokens/gsapEasing';

/**
 * 트리거를 못 읽을 때의 시작 상태: 화면 가운데에서 살짝 위·작게 자란다.
 * 이전 `slideIn` 키프레임의 0% 프레임과 같은 값이다(y -20px · scale 0.95).
 */
const CENTER_START = { opacity: 0, x: 0, y: -20, scale: 0.95 } as const;

/**
 * 끝 상태 `clip-path`의 여유. 패널 그림자가 잘리지 않을 만큼 넉넉한 음수 inset이다.
 *
 * `clip-path`는 `box-shadow`도 자른다. 끝 상태를 `inset(0)`으로 두면 `shadow.xl`이
 * 통째로 사라진다(실측: 그림자가 닿는 행 0/46, 최저 명도 255). `-20px`은 20/46으로
 * 아직 잘리고, `-50px`에서 32/46 · 명도 224로 클립 없음과 픽셀 단위로 같아진다.
 * 그림자는 아래로 32px 뻗는다. `shadow.xl` 토큰이 바뀌면 이 값을 다시 재야 한다.
 * 이 값은 애니메이션 중의 그림자를 위한 것이고, 쉬는 동안은 `clearProps`로 걷는다.
 */
const CLIP_BLEED = 50;

/**
 * 내용이 떠오르기 시작하는 지점: 상자 트윈(`slower`)의 45%. 내용(`slow`)은 상자보다
 * 25ms 늦게 끝난다. 레퍼런스(`BubbleMenu`의 라벨)도 주연과 조연을 일부러 어긋나게 둔다.
 */
const CHILD_RISE_AT = 0.45;

/** 내용이 떠오르는 거리(px). `BubbleMenu`의 라벨 `y: 24`와 같다. */
const CHILD_RISE_Y = 24;

/** 테스트 전용: 열린 타임라인을 다이얼로그 노드에 얹는다(SegmentedButtons와 같은 모양). */
type ModalTimelineHost = HTMLDivElement & {
  __modalTimeline?: gsap.core.Timeline;
};

/** 계산된 `border-radius`를 px로 읽는다. 읽을 수 없으면(jsdom의 var() 등) 0. */
const radiusOf = (el: HTMLElement, width: number): number => {
  const raw = getComputedStyle(el).borderTopLeftRadius;
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return raw.endsWith('%') ? (n / 100) * width : n;
};

/**
 * 트리거를 읽을 수 있을 때의 시작 상태. 못 읽으면 `null`이고 호출처는
 * `CENTER_START`로 물러난다.
 *
 * **`scale`을 쓰지 않는다.** 이전에는 `scale: 0.8`로 고정해 글자 가독성(이 모달의
 * 유일한 하드 제약)을 지켰다. 이제는 배율을 아예 안 쓴다. 패널 박스는 그대로 두고
 * `x`/`y`로 트리거에 겹친 뒤 `clip-path: inset()`으로 보이는 창만 트리거 크기로
 * 좁힌다. 글자는 단 한 프레임도 찌그러지지 않으니 24px 아이콘 버튼에서도 읽힌다.
 * 비율을 그대로 쓰면 본문 16px이 1px 미만이 되는 문제 자체가 없다.
 * 창이 열리면서 패널이 드러나고, `round`도 트리거 반경에서 패널 반경으로 같이
 * 보간된다(GSAP이 `inset()`을 `round`까지 선형 보간한다. 네 축 전부와 `round`
 * 하나를 from·to에 똑같이 적어야 구조가 같아 보간된다).
 *
 * 못 읽는 경우: 트리거가 없음(호출처가 `triggerRef.current`와 활성 요소를 모두
 * 못 구함) · 문서에서 떼어진 요소 · 크기 0(숨겨졌거나 레이아웃 없는 환경).
 * 어느 쪽도 예외를 던지지 않는다. 모달이 열리지 않는 것보다 가운데에서 자라는 게 낫다.
 */
const triggerStart = (
  dialog: HTMLElement,
  trigger: HTMLElement | null | undefined
): { x: number; y: number; clipPath: string } | null => {
  if (!trigger?.isConnected) return null;

  const from = trigger.getBoundingClientRect();
  const to = dialog.getBoundingClientRect();
  if (
    from.width === 0 ||
    from.height === 0 ||
    to.width === 0 ||
    to.height === 0
  ) {
    return null;
  }

  // 트리거가 패널보다 큰 축은 음수 inset이 된다. 0으로 막아 그 축은 처음부터 다 보인다.
  const insetY = Math.max(0, (to.height - from.height) / 2);
  const insetX = Math.max(0, (to.width - from.width) / 2);
  // 알약(9999px)이 타원이 되지 않게 트리거 짧은 변의 절반으로 누른다.
  const round = Math.min(
    radiusOf(trigger, from.width),
    Math.min(from.width, from.height) / 2
  );

  // translate의 차이를 그대로 넣으면 두 중심이 정확히 겹친다.
  return {
    x: from.left + from.width / 2 - (to.left + to.width / 2),
    y: from.top + from.height / 2 - (to.top + to.height / 2),
    clipPath: `inset(${insetY}px ${insetX}px ${insetY}px ${insetX}px round ${round}px)`,
  };
};

/**
 * `triggerRef.current`가 없을 때(ref 미전달 포함)의 트리거: 지금 포커스된 요소. 이 시점은 layout 단계라
 * `useFocusTrap`이 포커스를 옮기기 전이므로 활성 요소가 아직 클릭된 버튼이다
 * (`useFocusTrap`의 `previousActiveElementRef`는 useEffect에서 채워져 여기선 비어 있다).
 * body·html은 연결돼 있고 크기도 있어 `triggerStart`의 가드를 통과하지만 문서 전체
 * 기준 중심이라 모달이 엉뚱한 곳에서 날아온다. 트리거로 치지 않는다.
 * 다이얼로그 자신의 자손도 치지 않는다. `autoFocus` 자식이 있거나 축소 선호가
 * 뒤집혀 타임라인이 다시 만들어지면 포커스가 이미 다이얼로그 안이라, 모달이
 * 자기 닫기 버튼 자리에서 자란다. 이 거절은 활성 요소 폴백에만 붙는다.
 * Safari·Firefox(macOS)는 버튼 클릭에 포커스를 주지 않아 body가 되고, 가운데에서 자란다.
 */
const activeTrigger = (dialog: HTMLElement) => {
  const el = getActiveHTMLElement();
  return el === document.body ||
    el === document.documentElement ||
    dialog.contains(el)
    ? null
    : el;
};

// Context로 onClose·titleId 전달 (Header의 닫기 버튼, Title의 id 연결에서 사용)
interface ModalContextValue {
  onClose: () => void;
  titleId: string;
}

const [ModalContext, useModalContext] =
  createOverlayContext<ModalContextValue>('Modal');

/** 모달 다이얼로그 컴포넌트. Compound 패턴(Modal.Header/Content/Footer) 또는 Flat 패턴(title/footer prop) 지원 */
export interface ModalProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> {
  /** 모달 표시 여부 */
  open: boolean;
  /** 모달 닫기 콜백 */
  onClose: () => void;
  /** 모달 콘텐츠 */
  children: ReactNode;
  /** 모달 너비 @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 배경 클릭으로 닫기 허용 @default true */
  closeOnBackdropClick?: boolean;
  /**
   * 모달을 연 버튼. 다이얼로그가 그 버튼 자리에서 자라 나온다.
   * `.current`가 있으면 그것이 활성 요소를 이긴다. 그런데 분리됐거나 크기가 0이면
   * 활성 요소로 내려가지 않고 가운데에서 자란다(명시한 ref가 유일한 의도 표명이다).
   * 안 주거나 `.current`가 null이면 열 때 포커스된 요소를 쓴다.
   * 그것도 못 읽으면(body, 다이얼로그 자손 등) 조용히 가운데에서 자란다.
   */
  triggerRef?: RefObject<HTMLElement | null>;
  /** ESC 키로 닫기 허용 @default true */
  closeOnEscape?: boolean;
  /**
   * 오버레이를 그릴 DOM 위치. 안 주거나 `null`이면 `document.body`다.
   * 주면 그 안에 그려지고 body 스크롤도 잠그지 않는다(포커스 가두기·Esc는 그대로).
   * 화면이 그 안에 갇히려면 container가 `position: fixed`의 기준이어야 한다.
   * `contain: layout` 또는 `transform`을 주면 된다. 아니면 여전히 뷰포트 전체를 덮는다.
   */
  container?: HTMLElement | null;
  /** 제목 요소 ID 참조 (접근성) */
  'aria-labelledby'?: string;
  /** 설명 요소 ID 참조 (접근성) */
  'aria-describedby'?: string;
  /** 스크린 리더용 레이블 */
  'aria-label'?: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** Flat: 모달 제목, 자동으로 Header + Title 구조 생성 */
  title?: string;
  /** Flat: 닫기(X) 버튼 표시 (title과 함께 사용) @default false */
  showClose?: boolean;
  /** Flat: 모달 푸터 영역 */
  footer?: ReactNode;
  /** Flat: 푸터 버튼 정렬 @default 'left' */
  footerAlign?: 'left' | 'center' | 'right';
}

const ModalRoot = ({
  open,
  onClose,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  container,
  triggerRef,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  className,
  title,
  showClose = false,
  footer,
  footerAlign = 'left',
  ...props
}: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // 백드롭과 다이얼로그를 **한 타임라인**에 넣는다. 따로 두면 여는 도중 닫았을 때
  // 둘의 progress가 갈라져 배경만 남거나 판만 남는 프레임이 생긴다.
  const { shouldRender } = useOverlayTransition({
    open,
    buildTimeline: (timeline) => {
      const backdropEl = backdropRef.current;
      const dialog = dialogRef.current;

      if (backdropEl) {
        timeline.fromTo(
          backdropEl,
          { opacity: 0 },
          {
            opacity: 1,
            duration: gsapDuration.slow,
            ease: gsapEasing.settle,
          },
          0
        );
      }
      if (dialog) {
        // 테스트 손잡이. 타임라인을 만드는 자리에서 얹는다(SegmentedButtons와 같다).
        (dialog as ModalTimelineHost).__modalTimeline = timeline;
        const start = triggerStart(
          dialog,
          triggerRef?.current ?? activeTrigger(dialog)
        );
        if (!start) {
          timeline.fromTo(
            dialog,
            CENTER_START,
            {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: gsapDuration.slow,
              ease: gsapEasing.settle,
            },
            0
          );
        } else {
          const panelRadius = radiusOf(dialog, dialog.offsetWidth);
          const end = `inset(-${CLIP_BLEED}px -${CLIP_BLEED}px -${CLIP_BLEED}px -${CLIP_BLEED}px round ${panelRadius}px)`;
          // 패널 배경이 먼저 불투명해지는 동안 그 아래 트리거 글자가 흐려진다.
          // 트리거 요소는 직접 건드리지 않는다(중단 시 opacity 0으로 남을 위험).
          timeline.fromTo(
            dialog,
            { opacity: 0 },
            {
              opacity: 1,
              duration: gsapDuration.slow,
              ease: gsapEasing.settle,
            },
            0
          );
          timeline.fromTo(
            dialog,
            { x: start.x, y: start.y, clipPath: start.clipPath },
            {
              x: 0,
              y: 0,
              clipPath: end,
              // 쉬는 동안은 걷는다. 영구 inset(-50px)가 남으면 모달 밖 50px 너머
              // (푸터에 단 Popover 등)를 자른다. 완료 시 걷히고 역재생하면 GSAP이
              // 보간값을 다시 칠한다. x·y에는 걸지 않는다(transform을 걷으면 안 된다).
              clearProps: 'clipPath',
              duration: gsapDuration.slower,
              // 화면 안에서의 변형은 ease-in-out이다. settle(power3.out)은 거리의 94%를
              // 앞 절반에 쓰고 나머지를 기어가서, 상자가 먼저 열리고 내용이 뒤따른다.
              ease: gsapEasing.drift,
            },
            0
          );
          if (dialog.children.length > 0) {
            const children = Array.from(dialog.children);
            const at = gsapDuration.slower * CHILD_RISE_AT;
            // y와 opacity를 한 트윈에 묶지 않는다. snap(back.out)을 묶으면 불투명도도
            // 1을 넘었다 돌아올 수 있다. 오버슛은 y에만 건다.
            timeline.fromTo(
              children,
              { y: CHILD_RISE_Y },
              {
                y: 0,
                duration: gsapDuration.slow,
                ease: gsapEasing.snap,
              },
              at
            );
            timeline.fromTo(
              children,
              { opacity: 0 },
              {
                opacity: 1,
                duration: gsapDuration.slow,
                ease: gsapEasing.settle,
              },
              at
            );
          }
        }
      }
    },
  });

  useFocusTrap({
    open,
    onClose,
    closeOnEscape,
    containerRef: dialogRef,
    lockScroll: !container,
  });

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

  const isFlat = !!(title || footer);
  const flatTitleId = title ? titleId : undefined;
  // compound 경로(Modal.Title)는 title prop이 없어 flatTitleId가 undefined다.
  // titleId로 최종 폴백해 Modal.Title이 같은 id를 받아 접근 가능 이름을 갖게 한다.
  const labelledby = ariaLabelledby ?? flatTitleId ?? titleId;

  const content = isFlat ? (
    <>
      {title && (
        <header className={modalHeaderStyle}>
          <div className={modalHeaderContent}>
            <h2 id={flatTitleId} className={modalTitleStyle}>
              {title}
            </h2>
          </div>
          {showClose && (
            <button
              type="button"
              className={modalCloseButton}
              onClick={onClose}
              aria-label="닫기"
            >
              <Glyph name="close" />
            </button>
          )}
        </header>
      )}
      <div className={modalContentStyle}>{children}</div>
      {footer && (
        <footer
          className={clsx(modalFooterStyle, footerAlignStyles[footerAlign])}
        >
          {footer}
        </footer>
      )}
    </>
  ) : (
    children
  );

  const modalContentElement = (
    <ModalContext.Provider value={contextValue}>
      <div className={modalContainer}>
        <div
          ref={backdropRef}
          role="presentation"
          className={backdrop}
          onClick={handleBackdropClick}
          data-backdrop="true"
          aria-hidden="true"
        />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledby}
          aria-describedby={ariaDescribedby}
          aria-label={ariaLabel}
          // 퇴장 중(open=false, shouldRender=true)엔 DOM이 잠깐 더 남아있어도
          // 포커스가 그 안으로 들어가거나 클릭될 수 없게 inert로 막는다.
          inert={!open}
          className={clsx(modalDialog, sizeStyles[size], className)}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {content}
        </div>
      </div>
    </ModalContext.Provider>
  );

  return createPortal(modalContentElement, container ?? document.body);
};

ModalRoot.displayName = 'Modal';

// ─── Compound 서브 컴포넌트 ──────────────────────────────────────────

// ModalHeader
/** Modal.Header: 모달 헤더 영역 */
export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** 헤더 콘텐츠 */
  children: ReactNode;
  /** 닫기(X) 버튼 표시 @default false */
  showClose?: boolean;
}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ children, showClose = false, className, ...props }, ref) => {
    const context = useModalContext();

    return (
      <header
        ref={ref}
        className={clsx(modalHeaderStyle, className)}
        {...props}
      >
        <div className={modalHeaderContent}>{children}</div>
        {showClose && (
          <button
            type="button"
            className={modalCloseButton}
            onClick={context?.onClose}
            aria-label="닫기"
          >
            <Glyph name="close" />
          </button>
        )}
      </header>
    );
  }
);

ModalHeader.displayName = 'Modal.Header';

// ModalTitle
/**
 * Modal.Title: 모달 제목
 *
 * `id`는 컴포넌트가 소유한다. 루트의 `aria-labelledby`가 이 id를 가리키므로
 * 소비자 `id`가 이기면 다이얼로그의 접근 가능 이름이 조용히 사라진다. 제목
 * 요소를 직접 참조해야 하면 루트에 `aria-labelledby`를 줘라.
 */
export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** 제목 텍스트 */
  children: ReactNode;
  /** 렌더링할 HTML 헤딩 태그 @default 'h2' */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ children, as: Component = 'h2', className, ...props }, ref) => {
    const context = useModalContext();

    return (
      <Component
        ref={ref}
        className={clsx(modalTitleStyle, className)}
        {...props}
        id={context?.titleId}
      >
        {children}
      </Component>
    );
  }
);

ModalTitle.displayName = 'Modal.Title';

// ModalContent
/** Modal.Content: 모달 본문 영역 */
export interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  /** 본문 콘텐츠 */
  children: ReactNode;
}

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx(modalContentStyle, className)} {...props}>
        {children}
      </div>
    );
  }
);

ModalContent.displayName = 'Modal.Content';

// ModalFooter
/** Modal.Footer: 모달 푸터 영역 (보통 액션 버튼 배치) */
export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** 푸터 콘텐츠 */
  children: ReactNode;
  /** 콘텐츠 정렬 @default 'left' */
  align?: 'left' | 'center' | 'right';
}

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, align = 'left', className, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={clsx(modalFooterStyle, footerAlignStyles[align], className)}
        {...props}
      >
        {children}
      </footer>
    );
  }
);

ModalFooter.displayName = 'Modal.Footer';

// ─── Modal = ModalRoot + Compound 서브 컴포넌트 ────────────────────────

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Title: ModalTitle,
  Content: ModalContent,
  Footer: ModalFooter,
});
