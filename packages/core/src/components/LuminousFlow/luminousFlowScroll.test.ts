import { afterEach, describe, expect, it } from 'vitest';
import { canvasWindow, findScroller } from './luminousFlowScroll';

afterEach(() => {
  document.body.innerHTML = '';
});

// jsdom에는 레이아웃이 없어 넘침은 scrollHeight/clientHeight를 직접 건넨다
const box = (overflowY: string, overflowing: boolean, parent: HTMLElement) => {
  const el = document.createElement('div');
  el.style.overflowY = overflowY;
  Object.defineProperty(el, 'scrollHeight', { value: overflowing ? 900 : 100 });
  Object.defineProperty(el, 'clientHeight', { value: 100 });
  parent.append(el);
  return el;
};

describe('findScroller (가장 가까운 스크롤 조상)', () => {
  it('스크롤을 허용하고 실제로 넘치는 가장 가까운 조상을 찾는다', () => {
    const outer = box('auto', true, document.body);
    const inner = box('scroll', true, outer);
    const leaf = document.createElement('div');
    inner.append(leaf);
    expect(findScroller(leaf)).toBe(inner);
  });

  // 무엇을 되돌리면 빨개지는가: 넘침 검사를 빼면 넘치지 않는 안쪽 상자를 고르고, overflow 값 검사를 빼면 hidden 상자를 고른다
  it('넘치지 않거나 overflow가 hidden이면 건너뛰고 바깥 조상을 본다', () => {
    const outer = box('overlay', true, document.body);
    const flat = box('auto', false, outer);
    const hidden = box('hidden', true, flat);
    const leaf = document.createElement('div');
    hidden.append(leaf);
    expect(findScroller(leaf)).toBe(outer);
  });

  it('스크롤 조상이 없으면 null이다(창 스크롤). body와 html은 조상으로 치지 않는다', () => {
    document.body.style.overflowY = 'auto';
    Object.defineProperty(document.body, 'scrollHeight', {
      configurable: true,
      value: 5000,
    });
    const leaf = document.createElement('div');
    document.body.append(leaf);
    expect(findScroller(leaf)).toBeNull();
    document.body.style.overflowY = '';
    delete (document.body as { scrollHeight?: number }).scrollHeight;
  });
});

describe('canvasWindow (캔버스가 덮는 상자 안 구간)', () => {
  const view = { top: 0, bottom: 600, height: 600 };

  it('짧은 상자는 상자 전체를 덮는다(스크롤과 상관없이)', () => {
    expect(canvasWindow(0, 500, view)).toEqual({ top: 0, height: 500 });
    expect(canvasWindow(-200, 500, view)).toEqual({ top: 0, height: 500 });
  });

  // 무엇을 되돌리면 빨개지는가: 높이를 상자 높이로 되돌리면 첫 줄이, 위쪽 여유를 빼면 둘째 줄이, 끝 자르기를 빼면 마지막 줄이 빨개진다
  it('긴 상자는 보이는 창 높이의 두 배를 덮고, 보이는 곳 위로 창 높이의 반만큼 여유를 둔다', () => {
    const long = 20000;
    expect(canvasWindow(0, long, view)).toEqual({ top: 0, height: 1200 });
    // 상자가 화면 위로 5000px 올라갔다 = 상자 위에서 5000 아래가 창 맨 위
    expect(canvasWindow(-5000, long, view)).toEqual({
      top: 4700,
      height: 1200,
    });
    // 높이는 스크롤과 상관없이 같다
    expect(canvasWindow(-9000, long, view).height).toBe(1200);
    // 맨 끝에서는 상자 밖으로 나가지 않는다
    expect(canvasWindow(-19900, long, view)).toEqual({
      top: long - 1200,
      height: 1200,
    });
  });

  it('스크롤 상자 안에서는 그 상자의 보이는 창 위치를 따른다', () => {
    const stage = { top: 100, bottom: 700, height: 600 };
    // 상자 위가 창 위 100에서 시작해 스크롤 상자 맨 위에 맞닿아 있으면 아직 아래로 안 내려왔다
    expect(canvasWindow(100, 20000, stage).top).toBe(0);
    // 같은 스크롤 상자에서 3000 내려가면(상자 위가 화면 -2900)
    expect(canvasWindow(-2900, 20000, stage)).toEqual({
      top: 2700,
      height: 1200,
    });
  });
});
