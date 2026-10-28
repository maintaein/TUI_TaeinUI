import { useEffect, useRef } from 'react';
import {
  createFluidSmoke,
  type FluidSmoke,
} from '../../../../core/src/_internal/fluidSmoke';

// core 내부 엔진은 공개 export가 아니다. e2e와 GPU 측정이 소스를 직접 번들해 쓴다.
// 내비·검색 색인에 없고, 스펙이 window.__smoke로 엔진을 조작한다.
interface SmokeHarness {
  /** 이 브라우저가 WebGL2와 float 렌더 확장을 주는지, 어떤 GPU인지 */
  support(): { webgl2: boolean; floatRender: boolean; renderer: string };
  /** 현재 연기를 정리하고 새로 만든다. 만들었으면 true, 지원 안 하면 false */
  create(opts?: { stage?: boolean; preserve?: boolean }): boolean;
  burst(x: number, y: number, amount?: number): void;
  emit(x: number, y: number, vx: number, vy: number): void;
  /** 경로를 따라 매 프레임 분사하며 프레임 간격(ms)을 돌려준다 */
  emitFor(
    ms: number,
    from: [number, number],
    to: [number, number]
  ): Promise<number[]>;
  /** 알파가 0이 아닌 픽셀 수(preserve로 만든 연기만 읽힌다) */
  alphaPixels(): number;
  /** 알파가 minAlpha(0~255)보다 큰 픽셀의 외접 상자 크기(CSS px). 없으면 0 */
  alphaExtent(minAlpha: number): { width: number; height: number };
  /** 수명을 잇는다. 접힐 때까지 매 프레임 제자리(속도 0)에 작은 주입을 한다 */
  keepAlive(x: number, y: number): void;
  /** rAF를 n번(벽시계가 아니라 프레임 수) 기다린다 */
  frames(n: number): Promise<void>;
  /** 연기 캔버스가 DOM에 붙어 있는가 */
  attached(): boolean;
  /** 현재 연기를 즉시 정리한다 */
  dispose(): void;
  /** 연기 문맥이 놓였는가 */
  contextLost(): boolean;
  /** 생성하고 곧바로 소멸하기를 n번 되풀이한다. 만든 횟수와 그중 문맥이 놓인 횟수 */
  churn(n: number): { made: number; lost: number };
}

declare global {
  interface Window {
    __smoke?: SmokeHarness;
  }
}

export function SmokePage() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let smoke: FluidSmoke | null = null;
    let canvas: HTMLCanvasElement | null = null;

    const harness: SmokeHarness = {
      support() {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2');
        if (!gl) return { webgl2: false, floatRender: false, renderer: '' };
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = info
          ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
          : String(gl.getParameter(gl.RENDERER));
        const floatRender = !!(
          gl.getExtension('EXT_color_buffer_float') ||
          gl.getExtension('EXT_color_buffer_half_float')
        );
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return { webgl2: true, floatRender, renderer };
      },
      create({ stage = false, preserve = false } = {}) {
        smoke?.dispose();
        smoke = createFluidSmoke({
          container: stage ? (stageRef.current ?? undefined) : undefined,
          preserveDrawingBuffer: preserve,
        });
        canvas = smoke?.canvas ?? null;
        return smoke !== null;
      },
      burst(x, y, amount) {
        smoke?.burst(x, y, amount);
      },
      emit(x, y, vx, vy) {
        smoke?.emit(x, y, vx, vy);
      },
      emitFor(ms, from, to) {
        return new Promise((resolve) => {
          const intervals: number[] = [];
          let start = 0;
          let last = 0;
          const frame = (now: number) => {
            if (!start) start = last = now;
            else intervals.push(now - last);
            last = now;
            const t = Math.min((now - start) / ms, 1);
            const x = from[0] + (to[0] - from[0]) * t;
            const y = from[1] + (to[1] - from[1]) * t;
            // 진행 방향의 반대로 뿜는다(꼬리). 속도는 px/초
            const speed = 300;
            const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
            smoke?.emit(
              x,
              y,
              (-(to[0] - from[0]) / len) * speed,
              (-(to[1] - from[1]) / len) * speed
            );
            if (t < 1) requestAnimationFrame(frame);
            else resolve(intervals);
          };
          requestAnimationFrame(frame);
        });
      },
      alphaPixels() {
        if (!canvas) return 0;
        const copy = document.createElement('canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;
        const ctx = copy.getContext('2d');
        if (!ctx) return 0;
        ctx.drawImage(canvas, 0, 0);
        const data = ctx.getImageData(0, 0, copy.width, copy.height).data;
        let count = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count += 1;
        return count;
      },
      alphaExtent(minAlpha) {
        const none = { width: 0, height: 0 };
        if (!canvas) return none;
        const copy = document.createElement('canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;
        const ctx = copy.getContext('2d');
        if (!ctx) return none;
        ctx.drawImage(canvas, 0, 0);
        const { data } = ctx.getImageData(0, 0, copy.width, copy.height);
        let minX = copy.width;
        let maxX = -1;
        let minY = copy.height;
        let maxY = -1;
        for (let y = 0; y < copy.height; y++) {
          for (let x = 0; x < copy.width; x++) {
            if (data[(y * copy.width + x) * 4 + 3] > minAlpha) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        }
        if (maxX < 0) return none;
        const ratio = copy.width / canvas.clientWidth;
        return {
          width: (maxX - minX + 1) / ratio,
          height: (maxY - minY + 1) / ratio,
        };
      },
      keepAlive(x, y) {
        const tick = () => {
          if (!canvas?.isConnected) return;
          smoke?.emit(x, y, 0, 0);
          requestAnimationFrame(tick);
        };
        tick();
      },
      async frames(n) {
        for (let i = 0; i < n; i++) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
      },
      attached() {
        return !!canvas && canvas.isConnected;
      },
      dispose() {
        smoke?.dispose();
      },
      contextLost() {
        return !!canvas && !!canvas.getContext('webgl2')?.isContextLost();
      },
      churn(n) {
        let made = 0;
        let lost = 0;
        for (let i = 0; i < n; i++) {
          const each = createFluidSmoke({});
          if (!each) continue;
          made += 1;
          each.burst(100, 100);
          each.dispose();
          if (each.canvas.getContext('webgl2')?.isContextLost()) lost += 1;
        }
        return { made, lost };
      },
    };
    window.__smoke = harness;
    return () => {
      smoke?.dispose();
      delete window.__smoke;
    };
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>연기 시험 화면</h1>
      <div
        ref={stageRef}
        data-testid="stage"
        style={{
          position: 'relative',
          width: 480,
          height: 320,
          border: '1px solid currentColor',
          overflow: 'hidden',
        }}
      />
    </main>
  );
}
