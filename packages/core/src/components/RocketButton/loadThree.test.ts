import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  awaitWings,
  createThreeLoader,
  loadThree,
  preloadThree,
  replaceThreeImporter,
  type ThreeModule,
} from './loadThree';

// 세는 손과 실패하는 손: 진짜 three를 부르는 손에 호출 수만 센다
const counting = () => {
  const calls = { n: 0 };
  const importer = () => {
    calls.n += 1;
    return import('three');
  };
  return { calls, importer };
};
const failing = (calls: { n: number }) => () => {
  calls.n += 1;
  return Promise.reject<ThreeModule>(new Error('network'));
};
const withWebGL2 = () => vi.stubGlobal('WebGL2RenderingContext', class {});

afterEach(() => {
  vi.unstubAllGlobals();
  replaceThreeImporter();
});

describe('createThreeLoader', () => {
  it('한 번만 부르고 같은 약속을 돌려준다', async () => {
    const { calls, importer } = counting();
    const load = createThreeLoader(importer);
    const first = load();
    expect(load()).toBe(first);
    expect(await first).toBe(await load());
    expect(calls.n).toBe(1);
    expect(typeof (await first).WebGLRenderer).toBe('function');
  });

  it('실패한 약속은 쥐고 있지 않아 다음 호출이 다시 시도한다', async () => {
    const calls = { n: 0 };
    let ok = false;
    const load = createThreeLoader(() => {
      calls.n += 1;
      return ok ? import('three') : Promise.reject(new Error('network'));
    });
    await expect(load()).rejects.toThrow('network');
    ok = true;
    const three = await load();
    expect(calls.n).toBe(2);
    expect(typeof three.WebGLRenderer).toBe('function');
    // 성공한 뒤에는 다시 부르지 않는다
    await load();
    expect(calls.n).toBe(2);
  });
});

describe('preloadThree', () => {
  it('WebGL2가 없으면 three를 받지 않는다', () => {
    const { calls, importer } = counting();
    replaceThreeImporter(importer);
    preloadThree();
    expect(calls.n).toBe(0);
  });

  it('WebGL2가 있으면 한 번 불러오고 실패해도 던지지 않는다', async () => {
    withWebGL2();
    const calls = { n: 0 };
    replaceThreeImporter(failing(calls));
    preloadThree();
    expect(calls.n).toBe(1);
    // 삼켜진 거절이 처리되지 않은 거절로 새지 않고, 다음 가리킴은 다시 시도한다
    await Promise.resolve();
    preloadThree();
    expect(calls.n).toBe(2);
  });

  it('불러둔 약속을 loadThree가 그대로 돌려준다', async () => {
    withWebGL2();
    const { calls, importer } = counting();
    replaceThreeImporter(importer);
    preloadThree();
    await loadThree();
    expect(calls.n).toBe(1);
  });
});

describe('awaitWings', () => {
  it('WebGL2가 없으면 불러오지 않고 no-webgl2다', async () => {
    const { calls, importer } = counting();
    replaceThreeImporter(importer);
    expect(await awaitWings(50)).toEqual({ status: 'no-webgl2' });
    expect(calls.n).toBe(0);
  });

  it('기다리는 안에 오면 ready와 three를 돌려준다', async () => {
    withWebGL2();
    const { importer } = counting();
    replaceThreeImporter(importer);
    const outcome = await awaitWings(5000);
    expect(outcome.status).toBe('ready');
    expect(outcome.status === 'ready' && typeof outcome.three.Scene).toBe(
      'function'
    );
  });

  it('불러오기가 실패하면 failed다', async () => {
    withWebGL2();
    replaceThreeImporter(failing({ n: 0 }));
    expect(await awaitWings(5000)).toEqual({ status: 'failed' });
  });

  it('기다린 시간 안에 안 오면 timeout이고 나중에 와도 바뀌지 않는다', async () => {
    withWebGL2();
    let arrive: (three: ThreeModule) => void = () => {};
    replaceThreeImporter(
      () => new Promise<ThreeModule>((resolve) => (arrive = resolve))
    );
    expect(await awaitWings(20)).toEqual({ status: 'timeout' });
    arrive(await import('three'));
  });
});
