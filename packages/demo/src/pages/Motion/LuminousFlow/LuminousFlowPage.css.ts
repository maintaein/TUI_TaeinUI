import { themeContract } from '@taein-ui/core';
import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import * as stageStyles from '../../../components/Stage/Stage.css';
import { LINE } from '../../../components/DocText';

const { color, font } = themeContract;

// 배경이 무대 상자 전체를 채워야 하므로 안쪽 상자(position: relative)를 기준에서 뺀다. 그러면 안쪽 스크롤 상자의 absolute가 무대를 기준으로 삼는다
// 테두리는 늘 그려 두고 스크롤 상자에 키보드 포커스가 오면 그 색이 바뀐다(바깥 링은 두지 않는다)
export const stage = style({
  border: `1px solid ${LINE}`,
  selectors: { '&:has(:focus-visible)': { borderColor: color.border.focus } },
});
globalStyle(`${stage} > ${stageStyles.inner}`, { position: 'static' });

// 무대 안을 채우는 스크롤 상자. 일시정지 단추(무대 직속)가 스크롤에 딸려 가지 않도록 무대가 아니라 이 상자가 스크롤한다.
// container-type: size는 안쪽에서 보이는 창 높이(cqh)를 쓰려는 것이다
export const scroller = style({
  position: 'absolute',
  inset: 0,
  overflowY: 'auto',
  containerType: 'size',
  // 포커스 표시는 무대 테두리 색이 맡는다
  outline: 'none',
});

// 물길 상자. 높이는 폭에 대한 비율이라(장면 폭 492 기준) 무대 폭이 달라도 굽이 수가 같다.
// 각 비율은 굽이 수 5, 6, 7, 10의 장면 높이(1445, 1965, 2485, 4045)보다 조금 낮다. 같거나 높으면 반올림에 따라 굽이 수가 하나 늘 수 있고,
// 조금 낮게 두면 맨 아래에서 마감 굽이가 상자 끝으로 빠지는 모습이 그대로 보인다. 마감 방향은 오른쪽, 왼쪽, 오른쪽, 왼쪽으로 번갈아 나온다
export const flowBox = style({ position: 'relative', width: '100%' });
export const length = styleVariants({
  short: { aspectRatio: '492 / 1430' },
  normal: { aspectRatio: '492 / 1950' },
  long: { aspectRatio: '492 / 2470' },
  longest: { aspectRatio: '492 / 4030' },
});

// 글자는 첫 화면에만 둔다. 스크롤하면 글자가 올라가고 물길만 남는다
export const top = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  height: '100cqh',
});

// 배경(positioned)이 흐름 안의 글자 위에 그려지므로 글자도 positioned로 올린다. 흐르는 빛 위에서도 읽히도록 어두운 그림자를 두른다
export const line = style({
  position: 'relative',
  margin: 0,
  fontFamily: font.family.sans,
  fontSize: font.size['3xl'],
  fontWeight: font.weight.bold,
  wordBreak: 'keep-all',
  color: color.text.inverse,
  textShadow: `0 0 0.75rem ${color.text.primary}, 0 0 0.25rem ${color.text.primary}`,
});
