import { createFluidSmoke } from '../../_internal/fluidSmoke';

// 연기 엔진을 만드는 함수의 이음매. jsdom에는 WebGL이 없어 엔진이 늘 null이라, 분사구 끝 연기를 내보내는 연결을
// 목 없이 시험하려면 엔진 자리에 emit 호출을 세는 손을 끼울 수 있어야 한다.
let create = createFluidSmoke;

export const makeSmoke: typeof createFluidSmoke = (options) => create(options);

/** 시험이 엔진 만드는 함수를 갈아 끼운다. 인자 없이 부르면 원래대로 */
export const replaceSmokeFactory = (factory = createFluidSmoke) => {
  create = factory;
};
