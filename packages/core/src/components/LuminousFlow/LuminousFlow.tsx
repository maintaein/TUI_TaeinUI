import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from 'react';
import clsx from 'clsx';
import * as styles from './LuminousFlow.css';
import { palette } from './luminousFlowPalette';
import { SCROLL_FLOW, shouldAnimate } from './luminousFlowMotion';
import {
  SCENE_HEIGHT,
  SCENE_HEIGHT_COMPACT,
  SCENE_WIDTH,
  POSE_COUNT,
  atoms,
  bends,
  centerlinePath,
  envelopePaths,
  strands,
} from './luminousFlowScene';

export interface LuminousFlowProps {
  className?: string;
  /**
   * 상자 높이를 장면 높이(2162)에 맞춘 긴 물길로 그린다. 흐름 속도는 창 스크롤에서 읽는다.
   * 끄면 물길의 맨 위 구간(318)만 상자에 꽉 차게 그린다.
   */
  scrollScene?: boolean;
  /**
   * true면 지금 장면에서 그리기를 멈춘다(rAF 예약 없음, 마지막 프레임 유지).
   * false로 돌아오면 흐름 시간이 튀지 않고 이어서 흐른다. WCAG 2.2.2의 멈춤 수단이다.
   */
  paused?: boolean;
}

/**
 * 굽이치는 물길 안을 빛줄기가 흐르고 빛 알갱이가 떠가는 배경(canvas 2D + SVG 대기층).
 * 부모 상자를 채우므로(`position: absolute; inset: 0`) 부모가 position 기준이어야 한다.
 * 색 덮어쓰기는 없다(고정 시안 팔레트). 대기층 텍스처를 Blob URL 이미지로 만들므로
 * 엄격한 CSP에서는 `img-src blob:`이 필요하다. 축소 모드면 정지 장면, 화면 밖·탭 숨김이면 그리기를 멈춘다.
 */
export const LuminousFlow = forwardRef<HTMLDivElement, LuminousFlowProps>(
  ({ className, scrollScene = false, paused = false }, ref) => {
    const id = useId().replace(/:/g, '');
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // paused가 바뀌어도 효과를 다시 돌리면 흐름 시간이 0으로 튀므로 ref로 읽고 sync만 부른다
    const pausedRef = useRef(paused);
    const syncRef = useRef<() => void>(() => {});
    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    useEffect(() => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!root || !canvas || !context) return;
      const rimCanvas = document.createElement('canvas');
      const rim = rimCanvas.getContext('2d');
      if (!rim) return;
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const sceneHeight = scrollScene ? SCENE_HEIGHT : SCENE_HEIGHT_COMPACT;
      let frame = 0;
      let visible = true;
      const atmosphere = root.querySelector<SVGSVGElement>('svg');
      let atmosphereTexture: HTMLCanvasElement | null = null;
      let textureVersion = 0;
      let textureUrl: string | null = null;
      const animating = () =>
        shouldAnimate({
          reduced: media.matches,
          hidden: document.hidden,
          visible,
          paused: pausedRef.current,
        });
      // 이어 그리지 않는 동안(정지 장면)에는 크기·텍스처가 바뀔 때 한 번 다시 그려야 한다
      const redrawIfIdle = () => {
        if (!animating()) syncMotion();
      };
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
            redrawIfIdle();
          }
          URL.revokeObjectURL(url);
          if (textureUrl === url) textureUrl = null;
        };
        image.src = url;
      };
      // 장면 좌표 패턴은 그리기 변환을 따라가므로 화면 크기 그라디언트를 다시 만들지 않는다.
      const strandPaints = strands.map(({ index, color }) => {
        const texture = document.createElement('canvas');
        texture.width = 1;
        texture.height = SCENE_HEIGHT;
        const paint = texture.getContext('2d');
        if (!paint) return color;
        const gradient = paint.createLinearGradient(0, 0, 0, SCENE_HEIGHT);
        gradient.addColorStop(0, `${color}a6`);
        gradient.addColorStop(0.2 + (index % 5) * 0.12, color);
        gradient.addColorStop(1, `${color}bf`);
        paint.fillStyle = gradient;
        paint.fillRect(0, 0, 1, SCENE_HEIGHT);
        return context.createPattern(texture, 'repeat') ?? color;
      });
      const interpolated = strands.map((strand) =>
        strand.poses[0].map((point) => [...point])
      );
      const cumulativeLengths = strands.map(
        (strand) => new Float64Array(strand.poses[0].length)
      );
      let width = 0;
      let height = 0;
      let wide = false;
      let sizeKey = '';
      let pixelRatio = 1;
      let previousFrame = performance.now();
      let previousScrollTime = previousFrame;
      let previousScrollY = window.scrollY;
      let scrollVelocity = 0;
      let flowSpeed = SCROLL_FLOW.idleSpeed;
      let flowTime = 0;
      let bobTime = 0;

      // 그림은 루트 상자 안에서 그 상자만 채운다(창 좌표·overscan 없음)
      const resize = () => {
        width = root.clientWidth;
        height = root.clientHeight;
        // 좁고 긴 상자는 장면을 가로로 3배 펼친 부분만 보여 선이 가로로 뭉개지지 않게 한다
        wide = !scrollScene && width <= 600 && height > width;
        pixelRatio = Math.min(
          window.devicePixelRatio || 1,
          1,
          Math.sqrt(18e5 / (width * height || 1))
        );
        const nextWidth = Math.ceil(width * pixelRatio);
        const nextHeight = Math.ceil(height * pixelRatio);
        if (canvas.width !== nextWidth) canvas.width = nextWidth;
        if (canvas.height !== nextHeight) canvas.height = nextHeight;
        const key = `${width}x${height}x${wide}`;
        if (atmosphere && key !== sizeKey) {
          atmosphere.style.left = wide ? `${-width * 0.8}px` : '';
          atmosphere.style.right = wide ? 'auto' : '';
          atmosphere.style.width = wide ? `${width * 3}px` : '';
          cacheAtmosphere(width * (wide ? 3 : 1), height);
        }
        sizeKey = key;
        redrawIfIdle();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(root);
      const visibilityObserver = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        syncMotion();
      });
      visibilityObserver.observe(root);

      const paintScene = (time: number) => {
        const scaleX = (width * (wide ? 3 : 1)) / SCENE_WIDTH;
        const scaleY = height / sceneHeight;
        const left = wide ? -width * 0.8 : 0;
        const paths: Path2D[] = [];
        const points = interpolated;
        const lengths = cumulativeLengths;
        context.resetTransform();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(
          pixelRatio * scaleX,
          0,
          0,
          pixelRatio * scaleY,
          pixelRatio * left,
          0
        );
        context.lineCap = 'round';
        // 상자가 곧 보이는 영역이므로 장면 전체가 대상이다(창 밖 잘라내기는 상자가 창의 여러 배가 되면 되살린다).
        const top = 0;
        const bottom = sceneHeight;

        if (atmosphereTexture) {
          context.globalAlpha = 1;
          context.drawImage(atmosphereTexture, 0, 0, SCENE_WIDTH, sceneHeight);
        }

        strands.forEach(({ poses, index, blue }) => {
          const pose = ((time / (8 + (index % 5) * 1.5)) % 1) * POSE_COUNT;
          const first = Math.floor(pose),
            fraction = pose - first;
          const current = interpolated[index];
          for (let sample = 0; sample < current.length; sample++) {
            for (let axis = 0; axis < 2; axis++)
              current[sample][axis] =
                poses[first][sample][axis] +
                (poses[first + 1][sample][axis] - poses[first][sample][axis]) *
                  fraction;
          }
          let total = 0;
          const cumulative = cumulativeLengths[index];
          for (let sample = 0; sample < current.length; sample++) {
            if (sample)
              total += Math.hypot(
                current[sample][0] - current[sample - 1][0],
                current[sample][1] - current[sample - 1][1]
              );
            cumulative[sample] = total;
          }
          let skippedLength = 0;
          const path = new Path2D();
          // 보이는 영역과 빛번짐 반경 밖의 구간은 건너뛴다.
          let connected = false;
          current.slice(0, -1).forEach((point, sample) => {
            const before = current[Math.max(sample - 1, 0)];
            const next = current[sample + 1];
            const after = current[Math.min(sample + 2, current.length - 1)];
            if (
              Math.max(point[1], next[1]) < top - 50 ||
              Math.min(point[1], next[1]) > bottom + 50
            ) {
              connected = false;
              return;
            }
            if (!connected) {
              path.moveTo(point[0], point[1]);
              skippedLength = cumulative[sample];
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
          });
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
            const rimWidth = Math.ceil(90 * scaleX * pixelRatio);
            const rimHeight = Math.ceil(76 * scaleY * pixelRatio);
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
          const cumulative = lengths[strand];
          const travel = progress * cumulative[cumulative.length - 1];
          let sample = cumulative.findIndex((value) => value >= travel);
          sample = Math.max(1, sample);
          const mix =
            (travel - cumulative[sample - 1]) /
            (cumulative[sample] - cumulative[sample - 1]);
          const path = points[strand];
          const bob = media.matches
            ? 0
            : (1 -
                Math.cos(
                  ((bobTime + index * 0.37) * Math.PI) /
                    (1.8 + (index % 5) * 0.45)
                )) /
              2;
          const x =
            path[sample - 1][0] +
            (path[sample][0] - path[sample - 1][0]) * mix +
            (-4 + (index % 5) * 2) * bob;
          const y =
            path[sample - 1][1] +
            (path[sample][1] - path[sample - 1][1]) * mix +
            (-5 - (index % 4) * 2) * bob;
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

      const draw = (now: number) => {
        frame = 0;
        const delta = Math.min(0.1, Math.max(0, now - previousFrame) / 1000);
        previousFrame = now;
        const running = animating();
        if (running) {
          const targetSpeed =
            SCROLL_FLOW.idleSpeed +
            (SCROLL_FLOW.maxSpeed - SCROLL_FLOW.idleSpeed) *
              Math.min(1, scrollVelocity / SCROLL_FLOW.fullSpeedScroll);
          const nextSpeed =
            flowSpeed +
            (targetSpeed - flowSpeed) *
              (1 - Math.exp(-delta / SCROLL_FLOW.responseTime));
          // 속도를 적분해 속도가 바뀌어도 애니메이션 위상이 튀지 않게 한다.
          flowTime += (delta * (flowSpeed + nextSpeed)) / 2;
          flowSpeed = nextSpeed;
          bobTime += delta;
          scrollVelocity *= Math.exp(-delta / SCROLL_FLOW.decayTime);
        }
        if (width && height) paintScene(media.matches ? 0 : flowTime);
        if (running) frame = requestAnimationFrame(draw);
      };
      // 이어 그리지 않는 상태(축소·paused)여도 보일 때는 정지 장면을 한 번 그린다
      const syncMotion = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        previousFrame = performance.now();
        previousScrollTime = previousFrame;
        previousScrollY = window.scrollY;
        if (!animating()) {
          scrollVelocity = 0;
          flowSpeed = SCROLL_FLOW.idleSpeed;
        }
        if (!document.hidden && visible) frame = requestAnimationFrame(draw);
      };
      const onScroll = () => {
        const now = performance.now();
        const elapsed = Math.max(16, Math.min(100, now - previousScrollTime));
        if (animating())
          scrollVelocity = Math.min(
            SCROLL_FLOW.fullSpeedScroll,
            (Math.abs(window.scrollY - previousScrollY) / elapsed) * 1000
          );
        previousScrollY = window.scrollY;
        previousScrollTime = now;
      };
      let previousWheelTime = 0;
      const onWheel = (event: WheelEvent) => {
        if (event.ctrlKey || !animating()) return;
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
      syncRef.current = syncMotion;
      resize();
      syncMotion();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('wheel', onWheel, { passive: true });
      media.addEventListener('change', syncMotion);
      document.addEventListener('visibilitychange', syncMotion);
      return () => {
        syncRef.current = () => {};
        textureVersion++;
        if (textureUrl) URL.revokeObjectURL(textureUrl);
        cancelAnimationFrame(frame);
        observer.disconnect();
        visibilityObserver.disconnect();
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('wheel', onWheel);
        media.removeEventListener('change', syncMotion);
        document.removeEventListener('visibilitychange', syncMotion);
      };
    }, [scrollScene]);

    useEffect(() => {
      pausedRef.current = paused;
      syncRef.current();
    }, [paused]);

    const sceneHeight = scrollScene ? SCENE_HEIGHT : SCENE_HEIGHT_COMPACT;
    return (
      <div
        ref={rootRef}
        className={clsx(
          styles.root,
          scrollScene && styles.scrollScene,
          className
        )}
        aria-hidden="true"
      >
        <div className={styles.sourceHaze} />
        <svg
          className={styles.atmosphere}
          viewBox={`0 0 ${SCENE_WIDTH} ${sceneHeight}`}
          preserveAspectRatio="none"
          focusable="false"
        >
          <defs>
            <path id={`${id}-glow-route`} d={centerlinePath} />
            <linearGradient
              id={`${id}-envelope`}
              x1="0"
              y1="0"
              x2="0"
              y2={SCENE_HEIGHT}
              gradientUnits="userSpaceOnUse"
            >
              {Array.from({ length: 81 }, (_, index) => {
                const y = (index / 80) * SCENE_HEIGHT;
                const emission = Math.min(
                  1,
                  0.24 +
                    bends.reduce(
                      (sum, [, bendY]) =>
                        sum + 0.76 * Math.exp(-(((y - bendY) / 85) ** 2)),
                      0
                    )
                );
                return (
                  <stop
                    key={index}
                    offset={index / 80}
                    stopColor={palette.glow}
                    stopOpacity={emission.toFixed(4)}
                  />
                );
              })}
            </linearGradient>
          </defs>
          <g data-flow-envelope="" fill={`url(#${id}-envelope)`} opacity=".45">
            {envelopePaths.map((path, index) => (
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
