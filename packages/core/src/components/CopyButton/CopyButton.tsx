import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from 'react';
import clsx from 'clsx';
import { Button } from '../Button';
import { Glyph } from '../../_internal/glyph';
import { visuallyHidden } from '../../_internal/visuallyHidden.css';
import { loop } from '../../tokens/animation.css';
import {
  slot,
  textAbove,
  textBelow,
  icons,
  iconCopy,
  iconCheck,
  shake,
} from './CopyButton.css';

export interface CopyButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'value' | 'onCopy'
> {
  /** 복사할 글 */
  value: string;
  /** 평소 글자이자 단추의 접근 가능한 이름 @default '복사' */
  label?: string;
  /** 복사가 성공했을 때 글자 @default '복사됨' */
  copiedLabel?: string;
  /** 복사가 실패했을 때 글자 @default '복사 실패' */
  failedLabel?: string;
  /** 복사 결과가 나왔을 때. 소비자 onClick이 막았으면 불리지 않는다 */
  onCopy?: (ok: boolean) => void;
  /** 비활성화 상태 @default false */
  disabled?: boolean;
}

/** 결과를 보여 주고 평소 모습으로 돌아오기까지의 시간. loop.base 토큰에서 읽는다 */
const RESET_MS = Number.parseFloat(loop.base);

/** 누를 때마다 새 객체이고 id가 달라, 같은 결과가 이어져도 되돌림 타이머와 흔들림이 처음부터 다시 돈다 */
interface Outcome {
  ok: boolean;
  id: number;
}

/**
 * 누르면 클립보드 아이콘이 체크로 접히고 글자가 위로 빠지며 "복사됨"이 올라오는 복사 단추. 실패하면
 * 아이콘이 흔들리고 "복사 실패"가 된다. 잠시 뒤 평소 모습으로 돌아온다. 결과는 보이지 않는
 * aria-live 영역이 한 번 읽고, 단추의 이름은 늘 `label`이다. 움직임 줄이기에서는 이동과 흔들림 없이
 * 바뀌기만 한다.
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      value,
      label = '복사',
      copiedLabel = '복사됨',
      failedLabel = '복사 실패',
      onCopy,
      onClick,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const pressCount = useRef(0);

    // 결과가 새로 나올 때마다 타이머를 새로 건다. 정리 함수가 이전 타이머와 언마운트를 함께 맡는다.
    useEffect(() => {
      if (!outcome) return;
      const timer = setTimeout(() => setOutcome(null), RESET_MS);
      return () => clearTimeout(timer);
    }, [outcome]);

    const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || disabled) return;
      let ok = false;
      try {
        // 클립보드는 보안 맥락이 아니거나 권한이 막히면 없거나 거절한다. 둘 다 실패 경로다.
        await navigator.clipboard.writeText(value);
        ok = true;
      } catch {
        ok = false;
      }
      pressCount.current += 1;
      setOutcome({ ok, id: pressCount.current });
      onCopy?.(ok);
    };

    const state = outcome === null ? 'idle' : outcome.ok ? 'copied' : 'failed';
    const liveText =
      state === 'copied' ? copiedLabel : state === 'failed' ? failedLabel : '';

    return (
      <>
        <Button
          ref={ref}
          variant="light"
          className={className}
          disabled={disabled}
          onClick={handleClick}
          data-state={state}
          leftIcon={
            // 실패가 이어질 때 흔들림이 처음부터 다시 돌도록 누름마다 칸을 새로 세운다
            <span
              key={state === 'failed' ? outcome?.id : 'icons'}
              className={clsx(icons, state === 'failed' && shake)}
            >
              <span
                className={iconCopy}
                data-shown={state !== 'copied' ? '' : undefined}
              >
                <Glyph name="copy" />
              </span>
              <span
                className={iconCheck}
                data-shown={state === 'copied' ? '' : undefined}
              >
                <Glyph name="check" />
              </span>
            </span>
          }
          {...props}
        >
          <span className={slot}>
            <span
              className={textAbove}
              data-text=""
              data-shown={state === 'idle' ? '' : undefined}
            >
              {label}
            </span>
            <span
              className={textBelow}
              aria-hidden="true"
              data-text=""
              data-shown={state === 'copied' ? '' : undefined}
            >
              {copiedLabel}
            </span>
            <span
              className={textBelow}
              aria-hidden="true"
              data-text=""
              data-shown={state === 'failed' ? '' : undefined}
            >
              {failedLabel}
            </span>
          </span>
        </Button>
        <span className={visuallyHidden} role="status" aria-live="polite">
          {liveText}
        </span>
      </>
    );
  }
);

CopyButton.displayName = 'CopyButton';
