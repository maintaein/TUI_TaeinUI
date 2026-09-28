import { style, styleVariants } from '@vanilla-extract/css';
import { themeContract } from '../tokens/theme.css';

/**
 * 미러 루트. input과 같은 position:relative 컨테이너 안에 절대 배치된다.
 * `border: 1px solid transparent`는 input의 1px 테두리만큼 콘텐츠 박스를 안으로
 * 밀어 넣는다 — 없으면 미러 글자가 input 글자보다 정확히 1px 왼쪽·위에 그려진다.
 */
export const root = style({
  position: 'absolute',
  inset: 0,
  border: '1px solid transparent',
  overflow: 'hidden',
  pointerEvents: 'none',
  color: themeContract.color.text.primary,
  fontFamily: 'inherit',
});

/** 진입 단위(Ruling 50). char = TextField(글자 단위 줄바꿈 금지), word = TextArea(낱말 단위 줄바꿈). */
export const unit = styleVariants({
  char: { whiteSpace: 'pre' },
  word: { whiteSpace: 'pre-wrap' },
});

/** 지금 들어오는 글자/낱말. transform이 먹으려면 inline-block이어야 한다. */
export const entering = style({
  display: 'inline-block',
});

/** input에 imperative하게 classList로 붙인다(Ruling 47) — React state면 조합·선택마다 리렌더가 돈다. */
export const hiddenText = style({
  color: 'transparent',
});
