import { useState, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import {
  badge,
  variantStyles,
  sizeStyles,
  dotStyles,
  valueCurrent,
  valueExiting,
  directionDown,
} from './Badge.css';

/** 숫자 또는 상태를 표시하는 배지 컴포넌트 */
export interface BadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children'
> {
  /** 배지에 표시할 내용. 숫자일 경우 max 초과 시 "max+" 형태로 표시 */
  children?: ReactNode;
  /** 배지 색상 테마 @default 'primary' */
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  /** 배지 크기 @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** 숫자 최대값. 초과 시 "99+" 형태로 표시 @default 99 */
  max?: number;
  /** true면 내용 없이 작은 점만 표시 @default false */
  dot?: boolean;
}

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  max = 99,
  dot = false,
  'aria-label': ariaLabel,
  className,
  ...props
}: BadgeProps) => {
  // 판정은 여기 하나다: 비었는가, 숫자인가. 빈 값(null·undefined·'')이면
  // 아래에서 렌더하지 않는다.
  const isEmpty =
    children === null || children === undefined || children === '';
  const num = isEmpty ? NaN : Number(children);
  const isNumeric = !Number.isNaN(num);

  // 표시할 내용 결정. 아래 훅보다 먼저 계산해 둔다: 훅은 이 컴포넌트가
  // 렌더될 때마다 같은 순서로 호출돼야 하므로 조기 return보다 앞에 와야 한다.
  let displayContent: ReactNode = children;
  if (dot) {
    displayContent = null;
  } else if (isNumeric) {
    displayContent = num > max ? `${max}+` : String(num);
  }

  // 값 교체 애니메이션: 직전 값을 훅 상태로 들고 있다가 값이 바뀌면 그
  // 직전 값을 퇴장 노드로 넘긴다. 이펙트 없이 렌더 중에 상태를 조정하는
  // 패턴이다. dot 모드는 표시값이 없어 대상에서 뺀다. prevValue가
  // null/undefined였다면(예: children이 잠깐 비었다가 돌아온 경우) 퇴장시킬
  // "헌 값"이 없으므로 새로 넘기는 대신 남아 있을 수 있는 옛 값을 지운다.
  const [prevValue, setPrevValue] = useState(displayContent);
  const [prevNum, setPrevNum] = useState(dot ? NaN : num);
  const [exitingValue, setExitingValue] = useState<typeof displayContent>(null);
  // 값이 줄어든 교체면 true: 새 값이 위에서 내려오고 헌 값이 아래로 빠진다.
  const [down, setDown] = useState(false);

  // key도 String(displayContent)로 매기므로(아래 valueCurrent), 변경
  // 감지도 반드시 같은 identity(String 형)로 비교해야 한다. 참조
  // 비교(!==)를 쓰면 JSX 자식(children이 텍스트/숫자가 아닌 경우)이 부모
  // 리렌더마다 새 객체로 오는 것과 key가 어긋난다. 비교는 "바뀌었다"고
  // 보는데 key는 "같다"고 봐서(React 엘리먼트는 String()하면 다 같은
  // "[object Object]"가 된다) 헌 값 유령이 뜨고 들어올 자리가 없어 제자리
  // 걸음만 반복한다. 이건 의도적으로 모든 JSX 엘리먼트를 하나의 identity로
  // 뭉갠다. Badge의 계약은 숫자·짧은 텍스트라, 부모가 무관하게 리렌더될
  // 때마다 조용히 애니메이션이 도는 게 JSX를 값으로 쓰는 드문 케이스를 못
  // 알아채는 것보다 나쁘다. 이 비교를 다시 참조 비교로 "고치지" 말 것.
  if (dot) {
    // dot인 동안은 직전 값을 비워 둔다. 안 비우면 5 → dot → 3에서 보이지
    // 않던 5가 퇴장 노드로 뜨고 방향도 그 5와 비교한다.
    if (prevValue !== null) {
      setPrevValue(null);
      setPrevNum(NaN);
      setExitingValue(null);
    }
  } else if (String(displayContent) !== String(prevValue)) {
    if (prevValue != null) {
      setExitingValue(prevValue);
    } else {
      // 퇴장시킬 헌 값이 없다 = 직전에 배지가 비어 있었다는 뜻이다. 그때
      // 박제된 옛 값이 남아 있을 수 있으므로 여기서 지운다. 안 지우면 배지가
      // 잠깐 사라졌다 돌아올 때 옛 숫자가 현재 값 옆에서 퇴장을 재생한다.
      setExitingValue(null);
    }
    // 방향은 표시 문자열이 아니라 숫자 값으로 가른다. 둘 중 하나라도 숫자가
    // 아니면 NaN 비교가 false라 위로 간다.
    setDown(num < prevNum);
    setPrevValue(displayContent);
    setPrevNum(num);
  }

  if (!dot && isEmpty) {
    return null;
  }

  return (
    // key를 여기 두지 않는다: 소비자가 role="status"나 aria-live를 줘서 이
    // span을 라이브 리전으로 쓸 수 있다. 값이 바뀔 때마다 재마운트하면
    // 스크린 리더가 매번 새 라이브 리전으로 취급해 알림이 불안정해진다.
    // 재마운트는 아래 값 노드에서만 일어난다.
    <span
      // 글자 배지는 글자가 곧 접근 이름이다. 점은 이름을 주면 이미지, 이름도
      // role도 없으면 장식이다. 소비자가 role을 주면 숨기지 않는다.
      {...(dot
        ? ariaLabel
          ? { role: 'img', 'aria-label': ariaLabel }
          : props.role
            ? {}
            : { 'aria-hidden': true }
        : { 'aria-label': ariaLabel })}
      className={clsx(
        badge,
        variantStyles[variant],
        sizeStyles[size],
        dot && dotStyles,
        down && directionDown,
        className
      )}
      {...props}
    >
      {!dot && exitingValue !== null && (
        // 퇴장 중인 헌 값. aria-hidden은 접근성 목적(라이브 리전이 헌 값을
        // 다시 읽지 않게)이지, getByText 다중 매치를 막으려는 게 아니다.
        // getByText는 aria-hidden을 무시하지 않는다. 값이 바뀌면
        // key가 바뀌어 재마운트되면서 valueExit이 처음부터 다시 재생된다.
        <span
          key={String(exitingValue)}
          aria-hidden="true"
          className={valueExiting}
          onAnimationEnd={() => setExitingValue(null)}
        >
          {exitingValue}
        </span>
      )}
      {!dot && (
        // 현재 값. 값이 바뀔 때만 재마운트해 valueEnter를 다시 재생한다.
        // variant·size 등 다른 prop 변경으로는 재생하지 않는다.
        <span key={String(displayContent)} className={valueCurrent}>
          {displayContent}
        </span>
      )}
    </span>
  );
};

Badge.displayName = 'Badge';
