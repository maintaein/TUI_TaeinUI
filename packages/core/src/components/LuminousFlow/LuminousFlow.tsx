import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import * as styles from './LuminousFlow.css';
import { palette } from './luminousFlowPalette';
import {
  SCROLL_FLOW,
  firstIndexAtLeast,
  visibleSegments,
} from './luminousFlowMotion';
import { bindFlowListeners, createFlowLoop } from './luminousFlowLoop';
import { canvasWindow, findScroller, readView } from './luminousFlowScroll';
import {
  MIN_BENDS,
  POSE_COUNT,
  REFERENCE_HEIGHT,
  SCENE_WIDTH,
  bendsForBox,
  createScene,
} from './luminousFlowScene';

export interface LuminousFlowProps {
  className?: string;
  /**
   * true면 흐름을 멈추고 지금 장면을 남긴다(이어 그리는 루프 없음). 크기·스크롤 구간이 바뀌면
   * 그 장면을 한 번 다시 그린다. false로 돌아오면 흐름 시간이 튀지 않고 이어서 흐른다.
   * WCAG 2.2.2의 멈춤 수단이다.
   */
  paused?: boolean;
}

/**
 * 굽이치는 물길 안을 빛줄기가 흐르고 빛 알갱이가 떠가는 배경(canvas 2D + SVG 대기층).
 * 부모 상자를 채우므로(`position: absolute; inset: 0`) 부모가 position 기준이어야 한다.
 * 물길의 길이는 상자 높이가 정한다(길수록 굽이가 늘고, 마감 방향은 굽이 수를 따른다).
 * 가장 가까운 스크롤 조상(없으면 창)의 보이는 구간에 위아래 반 화면 여유를 더한 만큼만 그리고, 흐름 속도도 그 스크롤에서 읽는다.
 * 색 덮어쓰기는 없다(고정 시안 팔레트). 대기층 텍스처를 Blob URL 이미지로 만들므로
 * 엄격한 CSP에서는 `img-src blob:`이 필요하다. 축소 모드면 정지 장면, 화면 밖·탭 숨김이면 그리기를 멈춘다.
 */
export const LuminousFlow = forwardRef<HTMLDivElement, LuminousFlowProps>(
  ({ className, paused = false }, ref) => {
    const id = useId().replace(/:/g, '');
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // paused가 바뀌어도 효과를 다시 돌리면 흐름 시간이 0으로 튀므로 ref로 읽고 sync만 부른다
    const pausedRef = useRef(paused);
    const syncRef = useRef<() => void>(() => {});
    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    // 상자 높이가 굽이 수를 정하고 굽이 수가 장면(길이와 마감 방향)을 정한다. 잰 값이 오기 전에는 가장 짧은 장면이다
    const [bendCount, setBendCount] = useState(MIN_BENDS);
    const scene = createScene(bendCount);
    // 굽이 수가 바뀌어 효과가 다시 돌아도 흐름 시간이 0으로 튀지 않게 시계를 효과 밖에 쥔다
    const clockRef = useRef({
      flowTime: 0,
      bobTime: 0,
      flowSpeed: SCROLL_FLOW.idleSpeed,
    });
    useEffect(() => {
      const root = rootRef.current;
      if (!root || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() =>
        setBendCount(bendsForBox(root.clientWidth, root.clientHeight))
      );
      observer.observe(root);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!root || !canvas || !context) return;
      const rimCanvas = document.createElement('canvas');
      const rim = rimCanvas.getContext('2d');
      if (!rim) return;
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      // 효과는 굽이 수(숫자)에 걸리고 장면은 여기서 읽는다. 캐시에서 밀려나 같은 n의 객체가 달라져도 효과가 다시 돌지 않는다
      const scene = createScene(bendCount);
      const { atoms, bends, strands } = scene;
      const sceneHeight = scene.height;
      const clock = clockRef.current;
      let visible = true;
      const atmosphere = root.querySelector<SVGSVGElement>('svg');
      // 장면이 바뀌어 효과가 다시 돌 때, 앞 장면의 텍스처가 숨겨 둔 대기층을 다시 보이게 한다(새 텍스처가 오면 또 숨는다)
      if (atmosphere) atmosphere.style.visibility = '';
      let atmosphereTexture: HTMLCanvasElement | null = null;
      let textureVersion = 0;
      let textureUrl: string | null = null;
      const loop = createFlowLoop({
        readState: () => ({
          reduced: media.matches,
          hidden: document.hidden,
          visible,
          paused: pausedRef.current,
        }),
        onFrame: (now, running) => draw(now, running),
        onSync: (running) => syncClocks(running),
      });
      const cacheAtmosphere = (width: number, height: number) => {
        if (!atmosphere || !width || !height) return;
        const version = ++textureVersion;
        if (textureUrl) URL.revokeObjectURL(textureUrl);
        const copy = atmosphere.cloneNode(true) as SVGSVGElement;
        copy.removeAttribute('style');
        copy.removeAttribute('class');
        copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        copy.setAttribute('width', String(width));
        copy.setAttribute('height', String(height));
        const url = URL.createObjectURL(
          new Blob([new XMLSerializer().serializeToString(copy)], {
            type: 'image/svg+xml',
          })
        );
        textureUrl = url;
        const image = new Image();
        image.onload = () => {
          if (version !== textureVersion) return;
          const texture = document.createElement('canvas');
          // 이 층은 넓은 빛번짐뿐이라 거대한 GPU 층 없이 경로만 남긴다.
          const ratio = Math.min(1, Math.sqrt(4e6 / (width * height)));
          texture.width = Math.ceil(width * ratio);
          texture.height = Math.ceil(height * ratio);
          const paint = texture.getContext('2d');
          if (paint) {
            paint.drawImage(image, 0, 0, texture.width, texture.height);
            atmosphereTexture = texture;
            atmosphere.style.visibility = 'hidden';
            loop.redrawIfIdle();
          }
          URL.revokeObjectURL(url);
          if (textureUrl === url) textureUrl = null;
        };
        image.src = url;
      };
      // 장면 좌표 패턴은 그리기 변환을 따라가므로 화면 크기 그라디언트를 다시 만들지 않는다.
      // 기준 높이 한 주기를 세로로 되풀이해 길이와 상관없이 같은 크기의 패턴을 쓰고, 끝색을 첫 색과 같게 해 이음매가 없다.
      const strandPaints = strands.map(({ index, color }) => {
        const texture = document.createElement('canvas');
        texture.width = 1;
        texture.height = REFERENCE_HEIGHT;
        const paint = texture.getContext('2d');
        if (!paint) return color;
        const gradient = paint.createLinearGradient(0, 0, 0, REFERENCE_HEIGHT);
        gradient.addColorStop(0, `${color}a6`);
        gradient.addColorStop(0.2 + (index % 5) * 0.12, color);
        gradient.addColorStop(1, `${color}a6`);
        paint.fillStyle = gradient;
        paint.fillRect(0, 0, 1, REFERENCE_HEIGHT);
        return context.createPattern(texture, 'repeat') ?? color;
      });
      // 보이는 구간의 점만 채운다. 나머지 칸은 쓰이지 않는다
      const interpolated = strands.map((strand) =>
        strand.poses[0].map((point) => [...point])
      );
      // 알갱이가 가닥 위치를 읽을 두 포즈의 첫 번호와 섞는 비율(가닥마다 매 프레임 갱신)
      const mixes = strands.map(() => [0, 0]);
      let width = 0;
      let height = 0;
      let sizeKey = '';
      let pixelRatio = 1;
      // 캔버스는 상자 전체가 아니라 보이는 구간만 덮는다. 상자 안 어디에 놓였는지(px)를 마지막으로 그린 값으로 둔다
      let scroller: HTMLElement | null = null;
      let canvasTop = 0;
      let canvasHeight = 0;
      // 스크롤 위치는 조상과 창의 합이다. 둘이 이어서 움직이면(끝에 닿아 창으로 넘어감) 상자가 화면에서 움직인 양이 그 합이다
      const scrollPosition = () => window.scrollY + (scroller?.scrollTop ?? 0);
      let previousFrame = performance.now();
      let previousScrollTime = previousFrame;
      let previousScrollY = scrollPosition();
      let scrollVelocity = 0;
      const geometry = () =>
        canvasWindow(
          root.getBoundingClientRect().top,
          root.clientHeight,
          readView(scroller)
        );

      // 그림은 루트 상자 안에서 그 상자만 채운다
      const resize = () => {
        const nextScroller = findScroller(root);
        if (nextScroller !== scroller) {
          if (scroller) observer.unobserve(scroller);
          if (nextScroller) observer.observe(nextScroller);
          scroller = nextScroller;
          previousScrollY = scrollPosition();
        }
        width = root.clientWidth;
        height = root.clientHeight;
        canvasHeight = geometry().height;
        // 상자 전체를 덮는 캔버스는 지금 값(18e5). 긴 상자는 보이는 구간 두 배 높이만 덮는데, 그 면적이 이전 긴 상자에서 실제로 칠하던
        // 면적(저해상도로 줄인 보이는 구간)보다 커지지 않게 4e5로 묶는다(창을 띄운 실측: 18e5에서는 프레임 중앙값이 33ms에서 50~67ms로 늘었다)
        const budget = canvasHeight < height ? 4e5 : 18e5;
        pixelRatio = Math.min(
          window.devicePixelRatio || 1,
          1,
          Math.sqrt(budget / (width * canvasHeight || 1))
        );
        const nextWidth = Math.ceil(width * pixelRatio);
        const nextHeight = Math.ceil(canvasHeight * pixelRatio);
        canvas.style.height = `${canvasHeight}px`;
        if (canvas.width !== nextWidth) canvas.width = nextWidth;
        if (canvas.height !== nextHeight) canvas.height = nextHeight;
        // 대기층은 장면 전체이고 상자 높이는 그 위쪽만 보이게 자른다. 그래서 폭이 바뀔 때만 다시 만든다
        const key = `${width}`;
        if (atmosphere && key !== sizeKey)
          cacheAtmosphere(width, (width * sceneHeight) / SCENE_WIDTH);
        sizeKey = key;
        loop.redrawIfIdle();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(root);
      window.addEventListener('resize', resize);
      const visibilityObserver = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        loop.sync();
      });
      visibilityObserver.observe(root);

      const paintScene = (time: number) => {
        // 폭에 맞춘 한 배율로 펴서 굽이가 찌그러지지 않는다. 상자는 장면의 위쪽 height / scale만큼을 보인다
        const scale = width / SCENE_WIDTH;
        const paths: Path2D[] = [];
        context.resetTransform();
        context.clearRect(0, 0, canvas.width, canvas.height);
        // 캔버스를 보이는 구간 쪽으로 옮기고, 그 구간이 캔버스 맨 위가 되게 장면을 올려 그린다
        canvasTop = geometry().top;
        canvas.style.transform = `translateY(${canvasTop}px)`;
        context.setTransform(
          pixelRatio * scale,
          0,
          0,
          pixelRatio * scale,
          0,
          -canvasTop * pixelRatio
        );
        context.lineCap = 'round';
        // 캔버스가 덮는 장면 구간(짧은 상자는 상자 전체)
        const top = canvasTop / scale;
        const bottom = Math.min(
          sceneHeight,
          (canvasTop + canvasHeight) / scale
        );

        if (atmosphereTexture) {
          context.globalAlpha = 1;
          context.drawImage(atmosphereTexture, 0, 0, SCENE_WIDTH, sceneHeight);
        }

        strands.forEach(({ poses, lengths, preMaxY, sufMinY, index, blue }) => {
          const pose = ((time / (8 + (index % 5) * 1.5)) % 1) * POSE_COUNT;
          const first = Math.floor(pose),
            fraction = pose - first;
          mixes[index][0] = first;
          mixes[index][1] = fraction;
          const current = interpolated[index];
          // 보이는 구간(빛번짐 반경 50 포함)에 닿을 수 있는 구간만 보간한다
          const { first: firstSegment, last: lastSegment } = visibleSegments(
            preMaxY,
            sufMinY,
            top,
            bottom
          );
          const from = Math.max(firstSegment - 1, 0);
          const to = Math.min(lastSegment + 2, current.length - 1);
          if (firstSegment <= lastSegment)
            for (let sample = from; sample <= to; sample++) {
              for (let axis = 0; axis < 2; axis++)
                current[sample][axis] =
                  poses[first][sample][axis] +
                  (poses[first + 1][sample][axis] -
                    poses[first][sample][axis]) *
                    fraction;
            }
          let skippedLength = 0;
          const path = new Path2D();
          // 보이는 영역과 빛번짐 반경 밖의 구간은 건너뛴다.
          let connected = false;
          for (let sample = firstSegment; sample <= lastSegment; sample++) {
            const point = current[sample];
            const before = current[Math.max(sample - 1, 0)];
            const next = current[sample + 1];
            const after = current[Math.min(sample + 2, current.length - 1)];
            if (
              Math.max(point[1], next[1]) < top - 50 ||
              Math.min(point[1], next[1]) > bottom + 50
            ) {
              connected = false;
              continue;
            }
            if (!connected) {
              path.moveTo(point[0], point[1]);
              skippedLength = lengths[sample];
            }
            path.bezierCurveTo(
              point[0] + (next[0] - before[0]) / 6,
              point[1] + (next[1] - before[1]) / 6,
              next[0] - (after[0] - point[0]) / 6,
              next[1] - (after[1] - point[1]) / 6,
              next[0],
              next[1]
            );
            connected = true;
          }
          paths.push(path);
          context.strokeStyle = strandPaints[index];
          const strength = 0.8 + (index % 6) * 0.16;
          const strokeBase = 0.17 + (index % 5) * 0.075;
          context.setLineDash([]);
          [
            [13, 0.023 * strength],
            [2 + strokeBase * 5, 0.13 * strength],
            [strokeBase, 0.48 * strength],
          ].forEach(([strokeWidth, opacity]) => {
            context.lineWidth = strokeWidth;
            context.globalAlpha = opacity;
            context.stroke(path);
          });
          context.lineWidth = (index + 1) % 4 === 0 ? 0.75 : 0.48;
          context.globalAlpha = (index + 1) % 3 === 0 ? 0.38 : 0.85;
          context.setLineDash([34, 7, 9, 230]);
          context.lineDashOffset =
            skippedLength -
            ((time + index * 0.137) * 280) /
              ((index + 1) % 3 === 0 ? 1.65 : 2.2);
          context.stroke(path);
          context.strokeStyle = blue ? palette.cyan : palette.glow;
          context.lineWidth = 0.65;
          context.globalAlpha = media.matches ? 0.18 : 0.48;
          context.setLineDash([0.6, 69.4]);
          context.lineDashOffset =
            skippedLength - ((time + index * 0.081) * 70) / 0.7;
          context.stroke(path);
        });

        // 굽이마다 전체 장면 텍스처가 아니라 작은 국소 면을 따로 쓴다.
        const combinedPath = new Path2D();
        paths.forEach((path) => combinedPath.addPath(path));
        bends
          .filter(([, y]) => y + 38 >= top && y - 38 <= bottom)
          .forEach(([x, y]) => {
            const rimWidth = Math.ceil(90 * scale * pixelRatio);
            const rimHeight = Math.ceil(76 * scale * pixelRatio);
            if (rimCanvas.width !== rimWidth) rimCanvas.width = rimWidth;
            if (rimCanvas.height !== rimHeight) rimCanvas.height = rimHeight;
            rim.resetTransform();
            rim.clearRect(0, 0, rimCanvas.width, rimCanvas.height);
            rim.setTransform(
              rimWidth / 90,
              0,
              0,
              rimHeight / 76,
              (-(x - 45) * rimWidth) / 90,
              (-(y - 38) * rimHeight) / 76
            );
            rim.globalCompositeOperation = 'source-over';
            rim.strokeStyle = palette.glow;
            rim.lineWidth = 1.1;
            rim.lineCap = 'round';
            rim.stroke(combinedPath);
            rim.globalCompositeOperation = 'destination-in';
            rim.translate(x, y);
            rim.scale(1, 38 / 45);
            const glow = rim.createRadialGradient(0, 0, 0, 0, 0, 45);
            glow.addColorStop(0, '#fff');
            glow.addColorStop(0.3, '#ffffffe6');
            glow.addColorStop(1, '#ffffff00');
            rim.fillStyle = glow;
            rim.fillRect(-700, -4000, 1400, 8000);
            context.globalAlpha = 1;
            context.drawImage(rimCanvas, x - 45, y - 38, 90, 76);
          });
        context.setLineDash([]);
        context.lineDashOffset = 0;
        atoms.forEach(({ index, strand, phase, duration, radius }) => {
          const progress = (Number(phase) + time / duration) % 1;
          const { poses, lengths } = strands[strand];
          const travel = progress * lengths[lengths.length - 1];
          const sample = Math.max(1, firstIndexAtLeast(lengths, travel));
          const mix =
            (travel - lengths[sample - 1]) /
            (lengths[sample] - lengths[sample - 1]);
          // 보간해 둔 점은 보이는 구간뿐이라 알갱이는 쓰는 두 점만 포즈에서 바로 읽는다
          const [first, fraction] = mixes[strand];
          const [a, b] = [sample - 1, sample].map((at) =>
            [0, 1].map(
              (axis) =>
                poses[first][at][axis] +
                (poses[first + 1][at][axis] - poses[first][at][axis]) * fraction
            )
          );
          const bob = media.matches
            ? 0
            : (1 -
                Math.cos(
                  ((clock.bobTime + index * 0.37) * Math.PI) /
                    (1.8 + (index % 5) * 0.45)
                )) /
              2;
          const x = a[0] + (b[0] - a[0]) * mix + (-4 + (index % 5) * 2) * bob;
          const y = a[1] + (b[1] - a[1]) * mix + (-5 - (index % 4) * 2) * bob;
          if (y < top - 15 || y > bottom + 15) return;
          context.globalAlpha = 0.4 + (index % 4) * 0.14;
          const glow = context.createRadialGradient(x, y, 0, x, y, radius * 5);
          [
            [0, palette.glow],
            [0.12, `${palette.glow}e6`],
            [0.3, `${palette.cyan}61`],
            [0.65, `${palette.blue}14`],
            [1, `${palette.blue}00`],
          ].forEach(([stop, color]) =>
            glow.addColorStop(Number(stop), String(color))
          );
          context.fillStyle = glow;
          context.beginPath();
          context.arc(x, y, radius * 5, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = palette.glow;
          context.lineWidth = 0.22;
          context.globalAlpha *= 0.45;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.stroke();
          context.globalAlpha = 0.4 + (index % 4) * 0.14;
          context.fillStyle = palette.glow;
          context.beginPath();
          context.arc(x, y, radius * 0.35, 0, Math.PI * 2);
          context.fill();
        });
      };

      const draw = (now: number, running: boolean) => {
        const delta = Math.min(0.1, Math.max(0, now - previousFrame) / 1000);
        previousFrame = now;
        if (running) {
          const targetSpeed =
            SCROLL_FLOW.idleSpeed +
            (SCROLL_FLOW.maxSpeed - SCROLL_FLOW.idleSpeed) *
              Math.min(1, scrollVelocity / SCROLL_FLOW.fullSpeedScroll);
          const nextSpeed =
            clock.flowSpeed +
            (targetSpeed - clock.flowSpeed) *
              (1 - Math.exp(-delta / SCROLL_FLOW.responseTime));
          // 속도를 적분해 속도가 바뀌어도 애니메이션 위상이 튀지 않게 한다.
          clock.flowTime += (delta * (clock.flowSpeed + nextSpeed)) / 2;
          clock.flowSpeed = nextSpeed;
          clock.bobTime += delta;
          scrollVelocity *= Math.exp(-delta / SCROLL_FLOW.decayTime);
        }
        if (width && height) paintScene(media.matches ? 0 : clock.flowTime);
      };
      // sync 때 시계를 새로 잡는다. 이어 그리지 않는 상태면 스크롤 속도와 흐름 속도도 쉬는 값으로 되돌린다
      const syncClocks = (running: boolean) => {
        previousFrame = performance.now();
        previousScrollTime = previousFrame;
        previousScrollY = scrollPosition();
        if (!running) {
          scrollVelocity = 0;
          clock.flowSpeed = SCROLL_FLOW.idleSpeed;
        }
      };
      // 창과 모든 스크롤 상자의 scroll을 캡처로 받는다(scroll은 거품이 일지 않는다). 내 스크롤 위치가 안 변했으면 남의 이벤트다
      const onScroll = () => {
        const moved = Math.abs(scrollPosition() - previousScrollY);
        if (!moved) return;
        const now = performance.now();
        const elapsed = Math.max(16, Math.min(100, now - previousScrollTime));
        if (loop.animating())
          scrollVelocity = Math.min(
            SCROLL_FLOW.fullSpeedScroll,
            (moved / elapsed) * 1000
          );
        previousScrollY = scrollPosition();
        previousScrollTime = now;
        // 스크롤로 캔버스가 덮을 구간이 바뀌면 정지 장면도 다시 그린다
        if (!loop.animating() && geometry().top !== canvasTop)
          loop.redrawIfIdle();
      };
      let previousWheelTime = 0;
      const onWheel = (event: WheelEvent) => {
        if (event.ctrlKey || !loop.animating()) return;
        const units =
          event.deltaMode === 1
            ? 16
            : event.deltaMode === 2
              ? window.innerHeight
              : 1;
        const elapsed = Math.max(
          16,
          Math.min(100, event.timeStamp - previousWheelTime)
        );
        previousWheelTime = event.timeStamp;
        scrollVelocity = Math.max(
          scrollVelocity,
          Math.min(
            SCROLL_FLOW.fullSpeedScroll,
            (Math.abs(event.deltaY * units) / elapsed) * 1000
          )
        );
      };
      syncRef.current = loop.sync;
      resize();
      loop.sync();
      const unbind = bindFlowListeners({
        win: window,
        doc: document,
        media,
        onScroll,
        onWheel,
        onSync: loop.sync,
      });
      return () => {
        syncRef.current = () => {};
        textureVersion++;
        if (textureUrl) URL.revokeObjectURL(textureUrl);
        loop.stop();
        observer.disconnect();
        visibilityObserver.disconnect();
        window.removeEventListener('resize', resize);
        unbind();
      };
    }, [bendCount]);

    useEffect(() => {
      pausedRef.current = paused;
      syncRef.current();
    }, [paused]);

    // 줄 간격은 기준 장면의 80칸과 같게 길이에 맞춰 늘린다(굽이 빛의 폭 85보다 훨씬 촘촘하다)
    const stopCount = Math.ceil((80 * scene.height) / REFERENCE_HEIGHT);
    return (
      <div
        ref={rootRef}
        className={clsx(styles.root, className)}
        aria-hidden="true"
      >
        <div className={styles.sourceHaze} />
        <svg
          className={styles.atmosphere}
          viewBox={`0 0 ${SCENE_WIDTH} ${scene.height}`}
          preserveAspectRatio="none"
          focusable="false"
        >
          <defs>
            <path id={`${id}-glow-route`} d={scene.centerlinePath} />
            <linearGradient
              id={`${id}-envelope`}
              x1="0"
              y1="0"
              x2="0"
              y2={scene.height}
              gradientUnits="userSpaceOnUse"
            >
              {Array.from({ length: stopCount + 1 }, (_, index) => {
                const y = (index / stopCount) * scene.height;
                const emission = Math.min(
                  1,
                  0.24 +
                    scene.bends.reduce(
                      (sum, [, bendY]) =>
                        sum + 0.76 * Math.exp(-(((y - bendY) / 85) ** 2)),
                      0
                    )
                );
                return (
                  <stop
                    key={index}
                    offset={index / stopCount}
                    stopColor={palette.glow}
                    stopOpacity={emission.toFixed(4)}
                  />
                );
              })}
            </linearGradient>
          </defs>
          <g data-flow-envelope="" fill={`url(#${id}-envelope)`} opacity=".45">
            {scene.envelopePaths.map((path, index) => (
              <path key={index} d={path} opacity=".025" />
            ))}
          </g>
        </svg>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.grain} />
      </div>
    );
  }
);

LuminousFlow.displayName = 'LuminousFlow';
