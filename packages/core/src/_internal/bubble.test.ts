import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { themeContract } from '../tokens/theme.css';
import { bubbleStyles, type BubbleSpec } from './bubble';

const { duration, easing } = themeContract.animation;

const spec: BubbleSpec = {
  scale: 0.7,
  closedOffset: 5,
  openOffset: 9,
  enterTransform: { duration: 'base', easing: 'snap' },
  enterOpacity: { duration: 'fast', easing: 'settle' },
  exitDuration: 'base',
};

const { closed, open } = bubbleStyles(spec);

describe('bubbleStyles', () => {
  it('매개변수를 닫힘 scale·오프셋과 열림 오프셋에 넣는다', () => {
    expect(closed.top.transform).toBe(
      'translateX(-50%) translateY(-5px) scale(0.7)'
    );
    expect(closed.right.transform).toBe(
      'translateY(-50%) translateX(5px) scale(0.7)'
    );
    expect(open.bottom.transform).toBe(
      'translateX(-50%) translateY(9px) scale(1)'
    );
    expect(open.left.transform).toBe(
      'translateY(-50%) translateX(-9px) scale(1)'
    );
  });

  it('등장 transform과 opacity의 길이·커브를 따로 받는다', () => {
    expect(open.top.transition).toBe(
      `opacity ${duration.fast} ${easing.settle}, transform ${duration.base} ${easing.snap}`
    );
  });

  it('퇴장은 길이 x 0.65 + exit 커브를 세 채널(opacity, transform, visibility)에 같이 건다', () => {
    const exit = `calc(${duration.base} * 0.65) ${easing.exit}`;
    expect(closed.top.transition).toBe(
      `opacity ${exit}, transform ${exit}, visibility ${exit}`
    );
  });

  it.each([
    ['top', 'bottom center'],
    ['bottom', 'top center'],
    ['left', 'right center'],
    ['right', 'left center'],
  ] as const)('%s 배치의 transform-origin은 화살표 쪽(%s)이다', (p, origin) => {
    expect(closed[p].transformOrigin).toBe(origin);
    expect(open[p].transformOrigin).toBe(origin);
  });

  it('닫힘은 히트 테스트와 접근성 트리에서 빠지고 열림은 즉시 visible이다', () => {
    expect(closed.top).toMatchObject({
      opacity: 0,
      pointerEvents: 'none',
      visibility: 'hidden',
    });
    expect(open.top).toMatchObject({ opacity: 1, visibility: 'visible' });
    expect(String(open.top.transition)).not.toContain('visibility');
  });

  it('리터럴 ms를 쓰지 않는다(길이는 토큰 이름으로만 받는다)', () => {
    const source = readFileSync(resolve(__dirname, './bubble.ts'), 'utf-8');
    expect(source).not.toMatch(/\d+ms/);
  });
});
