import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../tokens/theme.css';

/**
 * 미러와 input/textarea가 공유하는 테두리 두께(px, Ruling 83). TextField.css.ts·
 * TextArea.css.ts가 실제 테두리를 그릴 때도, TextField의 lineHeight를 44/52에서
 * 역산할 때도 이 값 하나만 참조한다 — 따로 적으면 한쪽만 바뀌었을 때 미러와
 * 실제 입력창의 글자 자리가 어긋난다.
 */
export const BORDER_WIDTH = 1;

/**
 * 미러 루트. input과 같은 position:relative 컨테이너 안에 절대 배치된다.
 * `border: 1px solid transparent`는 input의 1px 테두리만큼 콘텐츠 박스를 안으로
 * 밀어 넣는다 — 없으면 미러 글자가 input 글자보다 정확히 1px 왼쪽·위에 그려진다.
 */
export const root = style({
  position: 'absolute',
  inset: 0,
  border: `${BORDER_WIDTH}px solid transparent`,
  overflow: 'hidden',
  pointerEvents: 'none',
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
  '@media': {
    // 강제 색상 모드(Windows 고대비)는 color를 시스템 색으로 덮어쓴다 — 아래
    // hiddenText의 transparent가 무효가 되어 실제 입력 글자가 보이고, 이 루트의
    // color도 CanvasText로 강제되어 미러 글자까지 같이 보인다. 두 겹이 겹치고
    // 진입 중인 글자는 SCATTER 변환 때문에 어긋난 자리에 겹친다. transparent
    // 테두리도 시스템 색으로 강제되어 필드 안에 상자가 하나 더 생긴다.
    // 고대비에서는 모션을 포기하고 실제 입력만 그린다.
    '(forced-colors: active)': {
      visibility: 'hidden',
    },
  },
});

/**
 * 진입 단위(Ruling 50). char = TextField(글자 단위 줄바꿈 금지), word = TextArea(낱말 단위 줄바꿈).
 * word는 실제 textarea의 UA 기본값(overflow-wrap: break-word, font-weight/style: normal)을
 * 그대로 못 물려받으므로 여기서 같이 못 박는다(I-4) — 안 박으면 굵게·기울임 글꼴이나 긴
 * 낱말에서 줄바꿈 판정이 실제 textarea와 어긋난다.
 */
export const unit = styleVariants({
  char: { whiteSpace: 'pre' },
  word: {
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    fontWeight: 'normal',
    fontStyle: 'normal',
  },
});

/** 지금 들어오는 글자/낱말. transform이 먹으려면 inline-block이어야 한다. */
export const entering = style({
  display: 'inline-block',
});

/**
 * input에 imperative하게 classList로 붙인다(Ruling 47) — React state면 조합·선택마다 리렌더가 돈다.
 * `caretColor`를 따로 못 박는 이유: 초깃값 `auto`는 `currentColor`로 계산되므로
 * `color: transparent`만 두면 글자와 함께 **캐럿까지** 투명해진다. 미러 루트는
 * `pointerEvents: 'none'`이라 캐럿을 대신 그려 주지도 않는다. 미러 텍스트 색(root의
 * `color`)과 같은 토큰을 써야 캐럿과 글자가 같은 색으로 보인다.
 */
export const hiddenText = style({
  color: 'transparent',
  caretColor: themeContract.color.text.primary,
  '@media': {
    // 미러가 접혔으므로(root 참고) 실제 입력이 자기 색을 되찾아야 한다.
    '(forced-colors: active)': {
      color: 'revert',
    },
  },
});
