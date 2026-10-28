import { themeContract } from '@taein-ui/core';
import { globalStyle, style } from '@vanilla-extract/css';
import * as stageStyles from '../../../components/Stage/Stage.css';

const { color, font } = themeContract;

// 배경이 무대 상자 전체를 채워야 하므로 안쪽 상자(position: relative)를 기준에서 뺀다. 그러면 LuminousFlow의 absolute가 무대를 기준으로 삼는다
export const stage = style({});
globalStyle(`${stage} > ${stageStyles.inner}`, { position: 'static' });

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
