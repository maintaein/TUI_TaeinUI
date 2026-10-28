import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { themeContract } from '../../tokens/theme.css';

const { animation } = themeContract;
const REDUCED = '(prefers-reduced-motion: reduce)';
// 글자와 아이콘이 오가는 길이. 눌림(fast)보다 느리고 시선이 따라갈 만한 slow(300ms)다.
const MOVE = animation.duration.slow;

// 글자 셋이 한 칸에 겹쳐 쌓이고 보이는 하나만 제자리에 있다. 칸 너비는 가장 긴 글자가 정하므로
// 상태가 바뀌어도 단추 너비가 변하지 않는다. 밖으로 밀려난 글자는 이 칸에서 잘린다.
export const slot = style({
  display: 'grid',
  overflow: 'hidden',
  lineHeight: 1.5,
});

// 쉬는 글자의 자리. 기본 글자(label)는 위로 빠졌다 위에서 돌아오고, 결과 글자는 아래에서 올라온다.
const textStyle = (rest: 'translateY(-100%)' | 'translateY(100%)') =>
  style({
    gridArea: '1 / 1',
    opacity: 0,
    transform: rest,
    transition: `opacity ${MOVE} ${animation.easing.settle}, transform ${MOVE} ${animation.easing.settle}`,
    selectors: {
      '&[data-shown]': { opacity: 1, transform: 'none' },
    },
    '@media': {
      // 이동만 걷고 교차 페이드는 둔다
      [REDUCED]: {
        transform: 'none',
        transition: `opacity ${MOVE} ${animation.easing.settle}`,
        selectors: { '&[data-shown]': { transform: 'none' } },
      },
    },
  });

export const textAbove = textStyle('translateY(-100%)');
export const textBelow = textStyle('translateY(100%)');

// 아이콘 둘이 20px 칸에 겹친다. 복사 아이콘은 접히듯 줄어 사라지고 체크는 선이 그려지며 나타난다.
export const icons = style({
  display: 'grid',
  width: '20px',
  height: '20px',
});

const iconStyle = (rest: string) =>
  style({
    gridArea: '1 / 1',
    display: 'grid',
    opacity: 0,
    transform: rest,
    transition: `opacity ${MOVE} ${animation.easing.settle}, transform ${animation.duration.slower} ${animation.easing.spring}`,
    selectors: {
      '&[data-shown]': { opacity: 1, transform: 'none' },
    },
    '@media': {
      [REDUCED]: {
        transform: 'none',
        transition: `opacity ${MOVE} ${animation.easing.settle}`,
        selectors: { '&[data-shown]': { transform: 'none' } },
      },
    },
  });

export const iconCopy = iconStyle('scale(0.5) rotate(-45deg)');

export const iconCheck = iconStyle('scale(0.5) rotate(45deg)');

// 체크 선의 길이는 22.6이다. 대시를 24로 잡고 26만큼 밀어 숨기면 둥근 끝 점도 안 보인다.
// 자식 선택자는 vanilla-extract의 selectors에 못 쓰고 globalStyle로만 쓸 수 있다.
globalStyle(`${iconCheck} path`, {
  strokeDasharray: '24 100',
  strokeDashoffset: 26,
  // stroke-dashoffset: 선이 그려지는 전이다. 합성 속성이 아니라 페인트지만 아이콘 한 개 크기다.
  transition: `stroke-dashoffset ${MOVE} ${animation.easing.settle}`,
  '@media': { [REDUCED]: { transition: 'none' } },
});
globalStyle(`${iconCheck}[data-shown] path`, { strokeDashoffset: 0 });

// 실패하면 아이콘이 좌우로 짧게 흔들린다. TextField의 shake-error와 같은 키프레임과 같은 토큰
// (길이 slower, 이징 drift)이다. 위치값은 토큰 스케일에 없는 연출 고유 거리라 리터럴이다.
const shakeFrames = keyframes({
  '10%, 90%': { transform: 'translateX(-2px)' },
  '20%, 80%': { transform: 'translateX(4px)' },
  '30%, 50%, 70%': { transform: 'translateX(-7px)' },
  '40%, 60%': { transform: 'translateX(7px)' },
});

export const shake = style({
  animation: `${shakeFrames} ${animation.duration.slower} ${animation.easing.drift}`,
  '@media': { [REDUCED]: { animation: 'none' } },
});
