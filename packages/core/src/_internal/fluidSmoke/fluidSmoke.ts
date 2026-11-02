import { themeContract } from '../../tokens/theme.css';
import {
  FLUID_CONFIG,
  MAX_FRAME_MS,
  advanceIdle,
  canvasPixels,
  fadeFactor,
  fitGrid,
  isExpired,
  splatRadius,
} from './grid';
import * as glsl from './shaders';

export interface FluidSmoke {
  /** 한 번 크게 터진다(사방으로). x, y는 창(clientX/Y) 기준 */
  burst(x: number, y: number, amount?: number): void;
  /** 방향 있는 분사(꼬리). vx, vy는 연기가 향하는 속도(CSS px/초) */
  emit(x: number, y: number, vx: number, vy: number): void;
  /** 언제든 즉시 정리한다. 여러 번 불러도 된다 */
  dispose(): void;
  readonly canvas: HTMLCanvasElement;
}

export interface FluidSmokeOptions {
  /** 이 상자를 덮는다(position이 잡힌 상자여야 한다). 없으면 body에 창 전체로 붙인다 */
  container?: HTMLElement;
  /** 시험 화면이 프레임 뒤에 픽셀을 읽으려고 쓴다. 쓰지 않는 쪽이 빠르다 */
  preserveDrawingBuffer?: boolean;
}

// 한 번 터질 때의 방울 수와 반지름·세기. 방울마다 방향·속도·위치를 흩뜨려 덩어리가 울퉁불퉁해야
// 소용돌이가 자란다(완벽한 원형 팽창은 압력 투영이 곧게 눌러 버린다).
const BURST = {
  rounds: 6,
  puffsPerRound: 6,
  radiusPx: 36,
  spreadPx: 60,
  speedPx: 1500,
  density: 0.3,
} as const;
const EMIT = { radiusPx: 30, density: 0.34, swirl: 0.3 } as const;
// 한 프레임에 쌓이는 주입 상한. 넘치면 버린다(연기가 이미 충분히 빽빽하다)
const MAX_QUEUE = 96;
const PROBE_SIZE = 16;
// 연기색 토큰 둘. 가장자리(옅은 밀도)는 흰 바탕에서 윤곽이 읽히는 gray[400](#BDBDBD)이고(gray[300]은 옅어 덩어리가 안 보였다),
// 밀도가 짙어질수록 흰색 토큰으로 옮겨 가 덩어리 속은 희고 테두리만 회색으로 보인다(전체가 한 색 gray[400]이던 때보다 희다)
const SMOKE_TOKEN = themeContract.palette.gray[400];
const SMOKE_CORE_TOKEN = themeContract.color.text.inverse;

interface Target {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
}
interface Pair {
  read: Target;
  write: Target;
  swap(): void;
}
interface Program {
  program: WebGLProgram;
  loc(name: string): WebGLUniformLocation | null;
}
interface Splat {
  /** 창 좌표(clientX/Y)로 들어와 캔버스 uv(0~1, y 위로)로 바뀐다 */
  u: number;
  v: number;
  vx: number;
  vy: number;
  density: number;
  radiusPx: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** 토큰 var()를 DOM에 풀어 읽는다. getComputedStyle이 `rgb(r, g, b)`로 돌려준다 */
function readSmokeColor(
  parent: HTMLElement,
  token: string
): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = token;
  parent.append(probe);
  const channels = getComputedStyle(probe).color.match(/[\d.]+/g) ?? [];
  probe.remove();
  const [r = 128, g = 128, b = 128] = channels.slice(0, 3).map(Number);
  return [r / 255, g / 255, b / 255];
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader 실패');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? '셰이더 컴파일 실패');
  }
  return shader;
}

function makeProgram(gl: WebGL2RenderingContext, fragment: string): Program {
  const program = gl.createProgram();
  if (!program) throw new Error('createProgram 실패');
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, glsl.VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? '프로그램 링크 실패');
  }
  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    program,
    loc(name) {
      if (!cache.has(name))
        cache.set(name, gl.getUniformLocation(program, name));
      return cache.get(name) ?? null;
    },
  };
}

function makeTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  half: boolean
): Target {
  const texture = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!texture || !fbo) throw new Error('텍스처·프레임버퍼 생성 실패');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    half ? gl.RGBA16F : gl.RGBA8,
    width,
    height,
    0,
    gl.RGBA,
    half ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
    null
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('프레임버퍼가 완성되지 않았다');
  }
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return { texture, fbo, width, height };
}

function makePair(
  gl: WebGL2RenderingContext,
  width: number,
  height: number
): Pair {
  const pair: Pair = {
    read: makeTarget(gl, width, height, true),
    write: makeTarget(gl, width, height, true),
    swap() {
      [pair.read, pair.write] = [pair.write, pair.read];
    },
  };
  return pair;
}

/**
 * WebGL2 유체 연기를 만든다. 지원하지 않는 환경이면 null이고 아무것도 남기지 않는다
 * (호출자는 연기 없이 진행한다). 마지막 주입 뒤 연기가 흩어지면 스스로 정리한다.
 */
export function createFluidSmoke(
  options: FluidSmokeOptions = {}
): FluidSmoke | null {
  // 움직임 줄이기: 연기는 순수한 움직임이라 통째로 없앤다(호출자의 실수도 막는다)
  if (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return null;
  }
  // 없는 환경(jsdom·구형 브라우저)에서 getContext가 콘솔에 "not implemented"를 찍지 않게 먼저 거른다
  if (typeof WebGL2RenderingContext === 'undefined') return null;

  const { container, preserveDrawingBuffer = false } = options;
  const host = container ?? document.body;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer,
  });
  if (!gl) return null;

  const loseContext = () => {
    if (!gl.isContextLost()) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  };

  try {
    if (
      !gl.getExtension('EXT_color_buffer_float') &&
      !gl.getExtension('EXT_color_buffer_half_float')
    ) {
      throw new Error('float 렌더 확장이 없다');
    }

    // absolute inset:0은 테두리 안쪽(padding box)을 덮으므로 clientWidth로 맞춘다
    const box = container ?? document.documentElement;
    const pixels = canvasPixels(
      box.clientWidth,
      box.clientHeight,
      window.devicePixelRatio
    );
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    const sim = fitGrid(pixels.width, pixels.height, FLUID_CONFIG.simShortSide);
    const densitySize = fitGrid(
      pixels.width,
      pixels.height,
      FLUID_CONFIG.densityShortSide
    );

    const splatP = makeProgram(gl, glsl.SPLAT);
    const advectP = makeProgram(gl, glsl.ADVECT);
    const vortP = makeProgram(gl, glsl.VORTICITY);
    const confineP = makeProgram(gl, glsl.CONFINEMENT);
    const divergenceP = makeProgram(gl, glsl.DIVERGENCE);
    const pressureP = makeProgram(gl, glsl.PRESSURE);
    const projectP = makeProgram(gl, glsl.PROJECT);
    const displayP = makeProgram(gl, glsl.DISPLAY);
    const probeP = makeProgram(gl, glsl.PROBE);

    const velocity = makePair(gl, sim.width, sim.height);
    const pressure = makePair(gl, sim.width, sim.height);
    const density = makePair(gl, densitySize.width, densitySize.height);
    const divergence = makeTarget(gl, sim.width, sim.height, true);
    const vorticity = makeTarget(gl, sim.width, sim.height, true);
    const probe = makeTarget(gl, PROBE_SIZE, PROBE_SIZE, false);

    const color = readSmokeColor(host, SMOKE_TOKEN);
    const core = readSmokeColor(host, SMOKE_CORE_TOKEN);
    const texel: [number, number] = [1 / sim.width, 1 / sim.height];

    const queue: Splat[] = [];
    const bursts: { x: number; y: number; amount: number; rounds: number }[] =
      [];
    const probeBytes = new Uint8Array(PROBE_SIZE * PROBE_SIZE * 4);
    let disposed = false;
    let raf = 0;
    let lastFrame = performance.now();
    // 마지막 주입 뒤 흐른 시뮬레이션 시간(ms). 벽시계가 아니라 프레임마다 상한을 둔 dt의 합이다
    let idleMs = 0;
    let injected = false;
    let frame = 0;

    const bindTex = (p: Program, name: string, unit: number, t: Target) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t.texture);
      gl.uniform1i(p.loc(name), unit);
    };
    const setTexel = (p: Program) =>
      gl.uniform2f(p.loc('uCell'), texel[0], texel[1]);
    const draw = (target: Target | null, width: number, height: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target?.fbo ?? null);
      gl.viewport(0, 0, width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    // 쓰기 쪽 텍스처에 그린 뒤 바꾼다
    const pass = (pair: Pair) => {
      draw(pair.write, pair.write.width, pair.write.height);
      pair.swap();
    };
    const passTo = (target: Target) =>
      draw(target, target.width, target.height);

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', dispose);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
      // 문맥을 쥐고 있으면 동시 상한(약 16)에 걸려 새 연기가 막힌다. 늦은 회수를 기다리지 않는다
      loseContext();
    };
    // 탭이 숨겨지면 rAF가 서서 문맥만 쥐고 있게 된다. 접어서 문맥을 놓는다
    const onVisibility = () => {
      if (document.hidden) dispose();
    };

    const applySplat = (s: Splat, w: number, h: number) => {
      const short = Math.min(w, h);
      gl.useProgram(splatP.program);
      gl.uniform2f(splatP.loc('uCenter'), s.u, s.v);
      gl.uniform2f(splatP.loc('uBoxRatio'), w / short, h / short);
      gl.uniform1f(splatP.loc('uRadiusSq'), splatRadius(s.radiusPx, short));
      bindTex(splatP, 'uBase', 0, velocity.read);
      gl.uniform3f(splatP.loc('uImpulse'), s.vx, s.vy, 0);
      pass(velocity);
      bindTex(splatP, 'uBase', 0, density.read);
      gl.uniform3f(splatP.loc('uImpulse'), s.density, 0, 0);
      pass(density);
    };

    const step = (dt: number) => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      for (const s of queue.splice(0)) applySplat(s, w, h);

      // 속도 이류
      gl.useProgram(advectP.program);
      setTexel(advectP);
      gl.uniform1f(advectP.loc('uDt'), dt);
      gl.uniform1f(advectP.loc('uDecayRate'), FLUID_CONFIG.velocityDecay);
      bindTex(advectP, 'uVelocity', 0, velocity.read);
      bindTex(advectP, 'uQuantity', 1, velocity.read);
      pass(velocity);

      // 소용돌이도를 구하고, 그 소용돌이를 키우는 힘(vorticity confinement)을 속도에 더한다
      gl.useProgram(vortP.program);
      setTexel(vortP);
      bindTex(vortP, 'uVelocity', 0, velocity.read);
      passTo(vorticity);
      gl.useProgram(confineP.program);
      setTexel(confineP);
      gl.uniform1f(confineP.loc('uConfinement'), FLUID_CONFIG.confinement);
      gl.uniform1f(confineP.loc('uDt'), dt);
      gl.uniform1f(confineP.loc('uSpeedCap'), FLUID_CONFIG.speedCap);
      bindTex(confineP, 'uVelocity', 0, velocity.read);
      bindTex(confineP, 'uVorticity', 1, vorticity);
      pass(velocity);

      // 발산 -> 압력 Jacobi -> 기울기 빼기
      gl.useProgram(divergenceP.program);
      setTexel(divergenceP);
      bindTex(divergenceP, 'uVelocity', 0, velocity.read);
      passTo(divergence);
      gl.useProgram(pressureP.program);
      setTexel(pressureP);
      bindTex(pressureP, 'uDivergence', 1, divergence);
      for (let i = 0; i < FLUID_CONFIG.pressureIterations; i++) {
        bindTex(pressureP, 'uPressure', 0, pressure.read);
        pass(pressure);
      }
      gl.useProgram(projectP.program);
      setTexel(projectP);
      bindTex(projectP, 'uPressure', 0, pressure.read);
      bindTex(projectP, 'uVelocity', 1, velocity.read);
      pass(velocity);

      // 밀도 이류 + 감쇠
      gl.useProgram(advectP.program);
      gl.uniform1f(advectP.loc('uDecayRate'), FLUID_CONFIG.densityDecay);
      bindTex(advectP, 'uVelocity', 0, velocity.read);
      bindTex(advectP, 'uQuantity', 1, density.read);
      pass(density);
    };

    const render = (fade: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(displayP.program);
      gl.uniform3f(displayP.loc('uColor'), color[0], color[1], color[2]);
      gl.uniform3f(displayP.loc('uCore'), core[0], core[1], core[2]);
      gl.uniform1f(displayP.loc('uFade'), fade);
      bindTex(displayP, 'uDensity', 0, density.read);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // 화면의 최대 알파(0~1, 칸 단위 표본). 읽기 동기화가 파이프라인을 한 번 세우므로 주기적으로만 부른다
    const peakAlpha = () => {
      gl.useProgram(probeP.program);
      bindTex(probeP, 'uDensity', 0, density.read);
      passTo(probe);
      gl.readPixels(
        0,
        0,
        PROBE_SIZE,
        PROBE_SIZE,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        probeBytes
      );
      let peak = 0;
      for (let i = 0; i < probeBytes.length; i += 4) {
        peak = Math.max(peak, probeBytes[i]);
      }
      return peak / 255;
    };

    // 멈췄다 돌아온 프레임의 dt는 상한으로 자른다. 수명도 같은 dt를 더해 세므로 버벅임이 연기 시간을 갉지 않는다
    const tick = (now: number) => {
      raf = 0;
      const frameMs = now - lastFrame;
      lastFrame = now;
      idleMs = advanceIdle(idleMs, frameMs);
      if (isExpired(idleMs)) return dispose();
      const dt = Math.min(Math.max(0, frameMs), MAX_FRAME_MS) / 1000;
      feedBursts();
      step(dt);
      render(fadeFactor(idleMs));
      frame += 1;
      if (
        injected &&
        frame % FLUID_CONFIG.probeEvery === 0 &&
        queue.length === 0 &&
        bursts.length === 0 &&
        peakAlpha() < FLUID_CONFIG.vanishAlpha
      ) {
        return dispose();
      }
      raf = requestAnimationFrame(tick);
    };

    // 터짐은 한 프레임에 몰아 넣지 않고 여섯 프레임에 걸쳐 밀어 낸다. 한 번의 충격은 압력
    // 투영에 곧 눌리지만 이어지는 분출은 운동량이 쌓여 덩어리가 부풀고 말려 오른다.
    const feedBursts = () => {
      for (const b of bursts) {
        for (let i = 0; i < BURST.puffsPerRound; i++) {
          const angle = rand(0, Math.PI * 2);
          const heading = angle + rand(-0.5, 0.5);
          const speed = BURST.speedPx * b.amount * rand(0.4, 1.2);
          const dist = BURST.spreadPx * rand(0.3, 1) * b.amount;
          inject({
            u: b.x + Math.cos(angle) * dist,
            v: b.y + Math.sin(angle) * dist,
            vx: Math.cos(heading) * speed,
            vy: Math.sin(heading) * speed,
            density: BURST.density * b.amount,
            radiusPx: BURST.radiusPx * rand(0.7, 1.2),
          });
        }
        b.rounds -= 1;
      }
      bursts.splice(0, bursts.length, ...bursts.filter((b) => b.rounds > 0));
    };

    const inject = (s: Splat) => {
      if (disposed || queue.length >= MAX_QUEUE) return;
      const rect = canvas.getBoundingClientRect();
      // 속도는 창 px/초 -> 시뮬레이션 셀/초. GL의 y는 위로 자라므로 뒤집는다
      queue.push({
        ...s,
        u: (s.u - rect.left) / rect.width,
        v: 1 - (s.v - rect.top) / rect.height,
        vx: (s.vx / rect.width) * sim.width,
        vy: (-s.vy / rect.height) * sim.height,
      });
      idleMs = 0;
      injected = true;
    };

    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: container ? 'absolute' : 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: themeContract.zIndex.popover,
    });
    // 문맥이 밖에서 빼앗겨도(상한·GPU 리셋) 되살리지 않고 조용히 접는다
    canvas.addEventListener('webglcontextlost', dispose);
    document.addEventListener('visibilitychange', onVisibility);
    host.append(canvas);
    raf = requestAnimationFrame(tick);

    return {
      canvas,
      dispose,
      burst(x, y, amount = 1) {
        if (!disposed) bursts.push({ x, y, amount, rounds: BURST.rounds });
      },
      emit(x, y, vx, vy) {
        // 분사 방향에 수직인 성분을 조금 흩뿌려야 꼬리가 곧은 줄이 아니라 소용돌이로 풀린다
        const swirl = rand(-EMIT.swirl, EMIT.swirl);
        inject({
          u: x,
          v: y,
          vx: vx - vy * swirl,
          vy: vy + vx * swirl,
          density: EMIT.density,
          radiusPx: EMIT.radiusPx,
        });
      },
    };
  } catch {
    // 지원 판정 실패(확장·셰이더·프레임버퍼): 문맥을 남기지 않고 연기 없이 진행하게 한다
    loseContext();
    return null;
  }
}
