import { afterEach, describe, expect, it } from 'vitest';
import { tailSpray } from './smokeTrail';

const BOUNDS = { left: 0, top: 0, right: 1000, bottom: 800 };

// 레이아웃이 없는 jsdom에서 요소의 화면 사각형을 정해 준다(왼쪽 위 기준)
const place = (el: HTMLElement, left: number, top: number, size = 100) => {
  el.getBoundingClientRect = () =>
    ({
      left,
      top,
      right: left + size,
      bottom: top + size,
      width: size,
      height: size,
    }) as DOMRect;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('tailSpray', () => {
  it('오른쪽 위로 가면 왼쪽 아래 모서리에서 진행의 반대로 뿜는다', () => {
    const body = document.body.appendChild(document.createElement('div'));
    place(body, 300, 300);
    const { center, spray } = tailSpray(body, { x: 300, y: 400 }, BOUNDS, 400);
    expect(center).toEqual({ x: 350, y: 350 });
    // 직전 중심(300,400) -> (350,350): 오른쪽 위로 간다
    expect(spray?.x).toBe(300);
    expect(spray?.y).toBe(400);
    expect(spray?.vx).toBeCloseTo(-283, 0);
    expect(spray?.vy).toBeCloseTo(283, 0);
  });

  it('DOM에서 떨어진 요소는 사각형이 0이라도 뿜지 않는다(창 모서리 (0,0)에 뿜지 않는다)', () => {
    const body = document.createElement('div');
    const { spray } = tailSpray(body, { x: 500, y: 300 }, BOUNDS, 400);
    expect(spray).toBeNull();
  });

  it('꼬리 점이 범위 밖이거나 움직임이 없거나 첫 프레임이면 뿜지 않는다', () => {
    const body = document.body.appendChild(document.createElement('div'));
    place(body, 1200, 300);
    expect(tailSpray(body, { x: 1100, y: 400 }, BOUNDS, 400).spray).toBeNull();
    place(body, 300, 300);
    expect(tailSpray(body, { x: 350, y: 350 }, BOUNDS, 400).spray).toBeNull();
    expect(tailSpray(body, null, BOUNDS, 400).spray).toBeNull();
  });
});
