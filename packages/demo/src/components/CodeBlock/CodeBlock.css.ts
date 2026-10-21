import { themeContract } from '@taein-ui/core';
import { style } from '@vanilla-extract/css';
import { FRAME, MONO, MUTED } from '../DocText';

// 코드 우물: 복사 단추는 따로 한 칸을 차지해 가로로 밀리는 코드 위를 덮지 않는다
export const codeBlock = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'start',
  width: '100%',
  marginBottom: '1.5rem',
  background: FRAME,
  borderRadius: themeContract.borderRadius.lg,
  contentVisibility: 'auto',
  containIntrinsicSize: 'auto 300px',
});

export const fileName = style({
  gridColumn: '1 / -1',
  padding: '0.75rem 1.25rem 0',
  fontFamily: MONO,
  fontSize: '0.8125rem',
  color: MUTED,
});

export const codeContainer = style({
  overflow: 'auto',
  maxHeight: '500px',
});

export const copyCell = style({
  padding: themeContract.spacing[2],
});
