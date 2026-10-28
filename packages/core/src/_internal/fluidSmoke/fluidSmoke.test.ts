import { describe, it, expect } from 'vitest';
import { createFluidSmoke } from './index';

// jsdom에는 WebGL이 없다. 지원 판정의 null 경로와 DOM 청결만 본다.
// 셰이더 컴파일·그리기·문맥 놓기는 e2e(demo /e2e/smoke)가 실제 Chromium에서 본다.
describe('createFluidSmoke (WebGL2 없음)', () => {
  it('null을 돌려주고 DOM에 canvas를 남기지 않는다', () => {
    expect(createFluidSmoke({})).toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('container를 줘도 그 안에 canvas를 남기지 않는다', () => {
    const container = document.createElement('div');
    document.body.append(container);
    expect(createFluidSmoke({ container })).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
    container.remove();
  });
});
