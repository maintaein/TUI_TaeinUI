// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useReducedMotion } from './useReducedMotion';

// window가 아예 없는 환경. 모듈 로드도, 렌더도 터지면 안 된다.
const Probe = () => createElement('span', null, String(useReducedMotion()));

describe('useReducedMotion (SSR)', () => {
  it('window가 없어도 터지지 않고 축소 아님으로 렌더해야 한다', () => {
    expect(typeof globalThis.window).toBe('undefined');

    expect(renderToString(createElement(Probe))).toBe('<span>false</span>');
  });
});
