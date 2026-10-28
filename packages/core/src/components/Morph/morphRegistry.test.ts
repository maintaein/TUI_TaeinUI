import { describe, it, expect } from 'vitest';
import {
  MORPH_MAX_AGE_MS,
  rememberMorph,
  takeMorph,
  type MorphLook,
} from './morphRegistry';

const look = (left: number): MorphLook => ({
  left,
  top: 0,
  width: 10,
  height: 10,
  radius: 4,
  background: 'rgb(1, 2, 3)',
  focused: false,
});

// 시계를 인자로 받으므로 실제 시간을 기다리지 않는다. 각 시험은 자기 id를 쓴다.
describe('morphRegistry', () => {
  it('맡긴 모양을 id로 집어 가고, 집으면 지워져 두 번째는 없다', () => {
    rememberMorph('a', look(5), 0);
    expect(takeMorph('a', 1)).toEqual(look(5));
    expect(takeMorph('a', 2)).toBeUndefined();
  });

  it('맡긴 적 없는 id는 undefined다', () => {
    expect(takeMorph('never', 0)).toBeUndefined();
  });

  it('다른 id의 기록은 건드리지 않는다', () => {
    rememberMorph('b1', look(1), 0);
    rememberMorph('b2', look(2), 0);
    expect(takeMorph('b2', 1)?.left).toBe(2);
    expect(takeMorph('b1', 1)?.left).toBe(1);
  });

  it('같은 id가 둘이면 나중에 맡긴 것이 이긴다', () => {
    rememberMorph('c', look(1), 0);
    rememberMorph('c', look(2), 1);
    expect(takeMorph('c', 2)?.left).toBe(2);
    expect(takeMorph('c', 3)).toBeUndefined();
  });

  it('짝이 제때 안 나타나면 버린다. 한도 안쪽은 받고 바깥은 받지 않는다', () => {
    rememberMorph('d1', look(1), 0);
    expect(takeMorph('d1', MORPH_MAX_AGE_MS)?.left).toBe(1);
    rememberMorph('d2', look(2), 0);
    expect(takeMorph('d2', MORPH_MAX_AGE_MS + 1)).toBeUndefined();
  });

  it('새로 맡길 때 오래된 기록을 함께 버려 쌓이지 않는다', () => {
    rememberMorph('e1', look(1), 0);
    rememberMorph('e2', look(2), MORPH_MAX_AGE_MS + 1);
    // e1은 아직 집지 않았지만 e2를 맡기며 버려졌으므로 시계를 되돌려도 없다
    expect(takeMorph('e1', 0)).toBeUndefined();
    expect(takeMorph('e2', MORPH_MAX_AGE_MS + 1)?.left).toBe(2);
  });
});
