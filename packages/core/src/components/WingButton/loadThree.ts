import type * as Three from 'three';

// three는 정적 import하지 않는다. 날개를 처음 가리킬 때 import('three')로 따로 떼어 불러와 첫 화면 번들에 싣지 않는다.
// 타입은 import type이라 컴파일 뒤 사라지고, 이 모듈은 공개 export가 아니라 .d.ts로도 새지 않는다.

export type ThreeModule = typeof Three;

/** 날개를 그릴 수 있는지의 결과. `ready`일 때만 three가 있다 */
export type WingsOutcome =
  | { status: 'ready'; three: ThreeModule }
  | { status: 'timeout' }
  | { status: 'failed' }
  | { status: 'no-webgl2' };

/**
 * 한 번만 불러오고 같은 약속을 돌려주는 함수를 만든다. 실패하면 거절된 약속을 쥐고 있지 않아
 * 다음 호출이 다시 시도한다. 불러오는 함수를 인자로 받는 것은 목 없이 실패 경로를 시험하려는 이음매다.
 */
export const createThreeLoader = (
  importer: () => Promise<ThreeModule> = () => import('three')
) => {
  let pending: Promise<ThreeModule> | null = null;
  return () => {
    pending ??= importer().catch((error: unknown) => {
      pending = null;
      throw error;
    });
    return pending;
  };
};

let load = createThreeLoader();

/** 시험이 불러오는 함수를 갈아 끼우는 이음매. 갈아 끼우면 캐시도 새로 시작한다 */
export const replaceThreeImporter = (importer?: () => Promise<ThreeModule>) => {
  load = createThreeLoader(importer);
};

/** three를 불러온다(한 번만). T8이 날개를 그릴 때 쓴다 */
export const loadThree = () => load();

// WebGL2가 없으면 날개를 못 그리니 three도 받지 않는다. 컨텍스트를 실제로 만들어 보는 일은 날개를 그리는 쪽이 한다
const hasWebGL2 = () => typeof WebGL2RenderingContext !== 'undefined';

/** 가리키거나 포커스가 갈 때 미리 불러둔다. 실패는 삼킨다(누를 때 다시 시도하고 결과를 본다) */
export const preloadThree = () => {
  if (hasWebGL2()) loadThree().catch(() => {});
};

/**
 * 누른 순간부터 `waitMs`까지 three를 기다린 결과. 그때까지 안 왔으면 `timeout`, 불러오기가 실패했으면
 * `failed`, WebGL2가 없으면 `no-webgl2`다. 어느 쪽이든 날개는 그리지 않는다(WebGL2가 없으면 연기 엔진도 없어 단추만 난다). `timeout`은 확정이다:
 * 나중에 도착해도 이번 비행에는 쓰지 않는다.
 */
export const awaitWings = (waitMs: number): Promise<WingsOutcome> => {
  if (!hasWebGL2()) return Promise.resolve({ status: 'no-webgl2' });
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ status: 'timeout' }), waitMs);
    loadThree().then(
      (three) => {
        clearTimeout(timer);
        resolve({ status: 'ready', three });
      },
      () => {
        clearTimeout(timer);
        resolve({ status: 'failed' });
      }
    );
  });
};
