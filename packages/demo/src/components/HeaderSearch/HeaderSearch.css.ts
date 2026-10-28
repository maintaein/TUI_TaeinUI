import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';

const MOBILE = '(max-width: 640px)';

// 헤더 줄에서 남는 폭을 쓰고, 좁은 화면에서 열리면 줄 전체를 덮는다.
export const root = style({
  flex: 1,
  '@media': {
    [MOBILE]: {
      selectors: {
        '&[data-open="true"]': {
          position: 'absolute',
          left: themeContract.spacing[2],
          right: themeContract.spacing[2],
        },
      },
    },
  },
});
