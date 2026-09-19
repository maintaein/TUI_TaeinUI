import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import {
  snackbar,
  snackbarExit,
  severityStyles,
  positionStyles,
  content,
  message as messageClass,
  actions,
  closeButton,
  visuallyHidden,
} from './Snackbar.css';
import { IconButton } from '../IconButton';
import { Icon, type IconName } from '../Icon';

// 퇴장 전이(exit CSS transition, duration.base)와 맞춘다 — 등장(slow, 300ms)의
// 66.7%로, 모션 명세 조항 3의 "퇴장은 등장의 60~70%" 범위를 만족한다.
const EXIT_DURATION_MS = 200;

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [liveMessage, setLiveMessage] = useState<ReactNode>(null);

  // open이 꺼져도 DOM을 즉시 지우지 않고 한 틱 늦춰 언마운트한다 — 퇴장 전이가
  // 재생될 자리를 남겨 둔다. 애니메이션 종료 이벤트가 아니라 타이머로 배선해
  // 빠른 연속 개폐에서도 정확성이 이벤트 발생 여부에 기대지 않는다.
  const [shouldRender, setShouldRender] = useState(open);

  if (open && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (open || !shouldRender) return;

    const timer = setTimeout(() => {
      setShouldRender(false);
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [open, shouldRender]);

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

  useEffect(() => {
    if (!open) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (autoHideDuration !== null && onClose) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, autoHideDuration);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [open, autoHideDuration, onClose]);

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
          // 퇴장 중(open=false, shouldRender=true)엔 DOM이 200ms 더 남아있어도
          // action·닫기 버튼이 포커스되거나 클릭될 수 없게 inert로 막는다.
          inert={!open}
          className={clsx(
            snackbar,
            severityStyles[severity],
            positionStyles[position],
            !open && snackbarExit,
            className
          )}
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
        </div>
      )}
    </>
  );
};

Snackbar.displayName = 'Snackbar';
