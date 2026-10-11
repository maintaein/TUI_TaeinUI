import type { CSSProperties, HTMLAttributes } from 'react';
import clsx from 'clsx';
import {
  loaderContainer,
  fullScreenStyles,
  overlayStyles,
  label as labelClass,
  bar,
  barFill,
  inchwormFill,
  barSizeStyles,
  colorStyles,
  inlineContainer,
  spinner,
  dotsContainer,
  dot,
  dotBody,
  orbit,
  orbitDot,
  orbitDotSizeStyles,
  wave,
  waveBar,
  waveSizeStyles,
  spinnerSizeStyles,
  dotSizeStyles,
  dotDelayStyles,
} from './Loader.css';
import { waveBarCount } from './loaderMotion';
// 원본 팔레트를 직접 참조하는 이유: type="bar" 렌더 경로는 themeContract 기반
// colorStyles를 쓰지만(아래), spinner/dots 경로는 color를 --spinner-color에
// raw 값으로 넘긴다. color prop이 테마 role뿐 아니라 임의의 CSS 색상 문자열도
// 받기 때문에, preset은 raw 값으로 풀고 그 밖의 값은 그대로 통과시킨다.
import { primary, gray } from '../../tokens/colors.css';

/** 로딩 상태를 표시하는 컴포넌트. 점 궤도, 스피너, 점, 바, 물결, 자벌레 타입 지원 */
export interface LoaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'color'
> {
  /** 로딩 애니메이션 타입 @default 'orbit' */
  type?: 'orbit' | 'spinner' | 'dots' | 'bar' | 'wave' | 'inchworm';
  /** 로더 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 로더 색상. preset 또는 임의의 CSS 색상값(예: '#f00', 'currentColor') @default 'primary' */
  color?: 'primary' | 'secondary' | 'white' | (string & {});
  /** 로더 아래 표시할 텍스트 */
  label?: string;
  /** 전체 화면 중앙 배치 @default false */
  fullScreen?: boolean;
  /** 반투명 배경 오버레이 표시 @default false */
  overlay?: boolean;
  /** 스크린 리더용 레이블 */
  'aria-label'?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

type ColorPreset = keyof typeof colorStyles;

const isPreset = (value: string): value is ColorPreset =>
  value === 'primary' || value === 'secondary' || value === 'white';

// 접근성 계약(role, aria-live, aria-busy)은 안쪽 status 요소가 쥔다. 소비자가
// ...props로 바깥 래퍼에 같은 속성을 얹어 status를 이중으로 만들지 못하게,
// props 펼침 뒤에 undefined로 덮는다(React는 undefined 속성을 렌더하지 않는다).
const a11yLocked = {
  role: undefined,
  'aria-live': undefined,
  'aria-busy': undefined,
} as const;

export const Loader = ({
  type = 'orbit',
  size = 'md',
  color = 'primary',
  label,
  fullScreen = false,
  overlay = false,
  'aria-label': ariaLabel,
  className,
  ...props
}: LoaderProps) => {
  // color preset을 실제 색상 값으로 변환. preset이 아니면 CSS 색상값이므로 그대로 쓴다
  const getColorValue = (value: string) => {
    switch (value) {
      case 'primary':
        return primary[600];
      case 'secondary':
        return gray[600];
      case 'white':
        return '#FFFFFF';
      default:
        return value;
    }
  };

  const renderLoader = () => {
    const accessibleLabel = ariaLabel || label || '로딩 중';
    const presetClass = isPreset(color) ? colorStyles[color] : undefined;

    // 자벌레는 bar와 같은 트랙을 쓰고 채움 층만 다르다.
    if (type === 'bar' || type === 'inchworm') {
      return (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={accessibleLabel}
          data-type={type}
          data-size={size}
          data-color={color}
        >
          <div className={clsx(bar, barSizeStyles[size])}>
            <div
              className={clsx(
                type === 'bar' ? barFill : inchwormFill,
                presetClass
              )}
              data-inchworm-fill={type === 'inchworm' ? '' : undefined}
              // colorStyles는 preset 3개만 가진 styleVariants라 임의 색상 문자열이면
              // 클래스가 없다. 그때는 --loader-color를 인라인으로 직접 넘긴다.
              style={
                presetClass
                  ? undefined
                  : ({ '--loader-color': color } as CSSProperties)
              }
            />
          </div>
        </div>
      );
    }

    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={accessibleLabel}
        data-type={type}
        data-size={size}
        className={inlineContainer}
        style={{ '--spinner-color': getColorValue(color) } as CSSProperties}
      >
        {type === 'dots' ? (
          <div className={dotsContainer}>
            {(['first', 'second', 'third'] as const).map((delay) => (
              <span
                key={delay}
                className={clsx(
                  dot,
                  dotSizeStyles[size],
                  dotDelayStyles[delay]
                )}
                data-dot
                data-delay={delay}
              >
                <span className={clsx(dotBody, dotDelayStyles[delay])} />
              </span>
            ))}
          </div>
        ) : type === 'wave' ? (
          <div
            className={clsx(wave, waveSizeStyles[size])}
            style={{ '--wave-n': waveBarCount(size) } as CSSProperties}
            aria-hidden="true"
            data-wave
          >
            {Array.from({ length: waveBarCount(size) }, (_, i) => (
              <span
                key={i}
                className={waveBar}
                style={{ '--wave-i': i } as CSSProperties}
                data-wave-bar
              />
            ))}
          </div>
        ) : type === 'orbit' ? (
          <div
            className={clsx(orbit, spinnerSizeStyles[size])}
            aria-hidden="true"
          >
            {Array.from({ length: 8 }, (_, i) => (
              <span
                key={i}
                className={clsx(orbitDot, orbitDotSizeStyles[size])}
                style={{ '--orbit-i': i } as CSSProperties}
                data-orbit-dot
              />
            ))}
          </div>
        ) : (
          <div
            className={clsx(spinner, spinnerSizeStyles[size])}
            data-spinner
          />
        )}
      </div>
    );
  };

  const loaderElement = renderLoader();

  if (!label && !fullScreen && !overlay) {
    return (
      <div {...props} {...a11yLocked} className={className}>
        {loaderElement}
      </div>
    );
  }

  return (
    <div
      {...props}
      {...a11yLocked}
      className={clsx(
        loaderContainer,
        fullScreen && fullScreenStyles,
        overlay && overlayStyles,
        className
      )}
    >
      {loaderElement}
      {label && <p className={labelClass}>{label}</p>}
    </div>
  );
};

Loader.displayName = 'Loader';
