import { jamoRegions } from '../../_internal/jamoRegions';
import { FEATHER_EM, inkStrokes, type Stroke } from './inkStrokes';

/** 칸 하나의 잉크 비트맵과 찾은 획 */
export interface InkCell {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** 지금 그려진 상태. 틱마다 이 하나를 재사용해 바뀐 픽셀만 다시 쓴다 */
  img: ImageData;
  /** 완성 글자의 잉크(RGBA) */
  src: Uint8ClampedArray;
  strokes: Stroke[];
  /** 획 앞머리 가장자리 폭(비트맵 픽셀) */
  feather: number;
}

/**
 * 글자 칸(`glyph`)의 완성 글자를 칸과 같은 폰트, 같은 색으로 캔버스에 그려 잉크를 재고 획을 찾는다.
 * 캔버스를 쓸 수 없거나(jsdom 등) 글자 칸에 크기가 없거나 폰트 지표를 못 읽으면 null이고, 호출자는 완성 글자를 그대로 둔다.
 * 기준선은 브라우저가 인라인 글자를 놓는 방식과 같다: 칸 높이에서 (위 지표 + 아래 지표)를 뺀 반이 위 여백이다.
 * 비트맵은 칸 크기 x min(devicePixelRatio, 2)다. 레티나에서 3배로 재는 것은 비용이 커서 2배로 묶는다.
 */
export const measureCell = (glyph: HTMLElement): InkCell | null => {
  if (typeof ImageData === 'undefined') return null;
  const char = glyph.textContent ?? '';
  const rect = glyph.getBoundingClientRect();
  if (!char || rect.width === 0 || rect.height === 0) return null;
  const style = getComputedStyle(glyph);
  const fontPx = Number.parseFloat(style.fontSize);
  if (!(fontPx > 0)) return null;

  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(rect.width * scale));
  const h = Math.max(1, Math.round(rect.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // 칸의 CSS 크기를 비트맵에 맞춰 늘려 CSS 픽셀 좌표로 그린다
  ctx.scale(w / rect.width, h / rect.height);
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  ctx.textBaseline = 'alphabetic';
  if (style.letterSpacing !== 'normal' && 'letterSpacing' in ctx)
    ctx.letterSpacing = style.letterSpacing;
  const m = ctx.measureText(char);
  if (m.fontBoundingBoxAscent === undefined) return null;
  const content = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
  ctx.fillText(char, 0, (rect.height - content) / 2 + m.fontBoundingBoxAscent);

  const src = ctx.getImageData(0, 0, w, h).data;
  const emPx = fontPx * (h / rect.height);
  const strokes = inkStrokes(src, w, h, {
    emPx,
    regions: jamoRegions(char)?.map((r) => r.region) ?? null,
  });
  // 그린 글자를 지우고 빈 상태에서 시작한다
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return {
    canvas,
    ctx,
    img: ctx.createImageData(w, h),
    src,
    strokes,
    feather: FEATHER_EM * emPx,
  };
};
