import { describe, it, expect } from 'vitest';
import { FAN_RADIUS, fanAngle, fanOffset, nearestFanItem } from './fanGeometry';

// 허브에서 각도 deg, 거리 r에 있는 포인터의 변위(dy는 위쪽이 양수)
const at = (deg: number, r: number): [number, number] => [
  Math.cos((deg * Math.PI) / 180) * r,
  Math.sin((deg * Math.PI) / 180) * r,
];

describe('fanAngle', () => {
  it('왼쪽 180도에서 오른쪽 0도로 균등하게 나뉜다', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => fanAngle(i, 6))).toEqual([
      180, 144, 108, 72, 36, 0,
    ]);
  });

  it('항목이 하나면 위쪽이다', () => {
    expect(fanAngle(0, 1)).toBe(90);
  });
});

describe('fanOffset', () => {
  it('양 끝은 허브와 같은 높이 좌우, 가운데는 바로 위다', () => {
    const left = fanOffset(0, 3, FAN_RADIUS);
    const mid = fanOffset(1, 3, FAN_RADIUS);
    const right = fanOffset(2, 3, FAN_RADIUS);
    expect(left.x).toBeCloseTo(-104);
    expect(left.y).toBeCloseTo(0);
    expect(mid.x).toBeCloseTo(0);
    expect(mid.y).toBeCloseTo(-104);
    expect(right.x).toBeCloseTo(104);
  });
});

describe('nearestFanItem', () => {
  it('각도가 가장 가까운 항목을 고른다', () => {
    expect(nearestFanItem(...at(110, 100), 6)).toBe(2);
    expect(nearestFanItem(...at(70, 100), 6)).toBe(3);
    expect(nearestFanItem(...at(15, 100), 6)).toBe(5);
  });

  it('호 아래쪽 각도는 가까운 끝으로 붙는다', () => {
    expect(nearestFanItem(...at(-30, 100), 6)).toBe(5);
    expect(nearestFanItem(...at(-150, 100), 6)).toBe(0);
    // 바로 아래(-90도)는 왼쪽 끝이다
    expect(nearestFanItem(0, -100, 6)).toBe(0);
  });

  it('허브 가까이(36px 안쪽)와 멀리(230px 밖)는 없다', () => {
    expect(nearestFanItem(...at(90, 35), 6)).toBe(-1);
    expect(nearestFanItem(...at(90, 36), 6)).toBe(2);
    expect(nearestFanItem(...at(90, 230), 6)).toBe(2);
    expect(nearestFanItem(...at(90, 231), 6)).toBe(-1);
  });

  it('항목이 없으면 없다', () => {
    expect(nearestFanItem(...at(90, 100), 0)).toBe(-1);
  });
});
