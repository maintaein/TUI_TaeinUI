// 유체 연기의 격자·해상도 값과 이를 계산하는 순수 함수. GL 없이 시험한다.

/**
 * 값의 근거는 실제 GPU 실측(task-14-report)이다. 시뮬레이션은 소용돌이가 보일 만큼만
 * 거칠게(속도·압력 반복이 격자 크기에 비례해 비싸다), 밀도는 연기 가장자리가 뭉개지지
 * 않게 촘촘하게 둔다. 밀도 격자는 이류 한 번과 그리기만 치른다.
 */
export const FLUID_CONFIG = {
  /** 속도·압력 격자의 짧은 변(셀) */
  simShortSide: 128,
  /** 밀도 격자의 짧은 변(셀) */
  densityShortSide: 512,
  /** 캔버스 픽셀 비율 상한. 4K에서도 필레이트가 3배로 불지 않게 한다 */
  dprMax: 1.5,
  /** 압력 Jacobi 반복 */
  pressureIterations: 20,
  /** 속도 감쇠(1/s). 연기가 흩어지며 멈추는 속도 */
  velocityDecay: 0.4,
  /** 밀도 감쇠(1/s) */
  densityDecay: 0.9,
  /** 소용돌이 강화 세기(GPU Gems 38장의 e_c) */
  confinement: 22,
  /** 속도 길이 상한(셀/초). 터짐 주입 최고 속도(1500px/초 * 1.2, 1440폭에서 약 256셀/초)의 네 배쯤으로 두어 정상 흐름은 안 건드리고 강화의 폭주만 끊는다 */
  speedCap: 1000,
  /** 마지막 주입 뒤 시뮬레이션 시간이 이만큼 흐르면 밀도와 상관없이 접는다(ms). 벽시계가 아니다 */
  maxLifeMs: 3000,
  /** 접기 직전 이 시간 동안 알파를 0으로 내린다(ms). 잔연이 툭 끊기지 않게 한다 */
  fadeOutMs: 700,
  /** 밀도 확인 주기(프레임). 읽기 동기화가 파이프라인을 세우므로 매 프레임 하지 않는다 */
  probeEvery: 12,
  /** 화면 어디에도 이보다 짙은 알파가 없으면 흩어진 것으로 본다(약 5/255) */
  vanishAlpha: 0.02,
} as const;

/** 상자의 CSS 크기와 DPR로 캔버스 픽셀 크기를 정한다. DPR은 상한으로 자른다 */
export function canvasPixels(
  cssWidth: number,
  cssHeight: number,
  dpr: number
): { width: number; height: number } {
  const ratio = Math.min(dpr > 0 ? dpr : 1, FLUID_CONFIG.dprMax);
  return {
    width: Math.max(1, Math.round(cssWidth * ratio)),
    height: Math.max(1, Math.round(cssHeight * ratio)),
  };
}

/** 화면 비율을 지키며 짧은 변을 shortSide로 맞춘다. 원본보다 키우지 않는다 */
export function fitGrid(
  width: number,
  height: number,
  shortSide: number
): { width: number; height: number } {
  const scale = Math.min(1, shortSide / Math.min(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** splat 가우시안의 분모. 반지름을 짧은 변 대비 비율로 바꿔 제곱한다 */
export function splatRadius(radiusPx: number, shortSidePx: number): number {
  const ratio = radiusPx / Math.max(1, shortSidePx);
  return ratio * ratio;
}

/**
 * 프레임 하나가 수명에 더하는 시간의 상한(ms). 시뮬레이션 dt의 상한과 같다(1/30초).
 * 셰이더 컴파일이나 무거운 페이지로 메인 스레드가 멈춘 시간을 수명으로 세면 연기가 보이기도
 * 전에 접히므로, 멈춘 시간은 한 프레임 몫만 센다.
 */
export const MAX_FRAME_MS = 1000 / 30;

/** 마지막 주입 뒤 흐른 시뮬레이션 시간(ms)에 이번 프레임을 더한다. 음수는 0, 큰 값은 상한으로 자른다 */
export function advanceIdle(idleMs: number, frameMs: number): number {
  return idleMs + Math.min(Math.max(0, frameMs), MAX_FRAME_MS);
}

/** 수명 상한(maxLifeMs)에 이르렀는가 */
export function isExpired(idleMs: number): boolean {
  return idleMs >= FLUID_CONFIG.maxLifeMs;
}

/** 끝 fadeOutMs 동안 1에서 0으로 내려가는 알파 배율(0~1) */
export function fadeFactor(idleMs: number): number {
  const left = FLUID_CONFIG.maxLifeMs - idleMs;
  return Math.max(0, Math.min(1, left / FLUID_CONFIG.fadeOutMs));
}
