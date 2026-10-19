// 장면이 이어받는 "부품"을 core 컴포넌트의 DOM에서 찾는 곳. 선택자는 전부 여기에 모은다.
//
// shortcut: 부품 위치를 core 내부 DOM 구조(자식 순서, aria 속성, role)로 찾는다. core가 구조를 바꾸면
// 부품을 못 찾아 그 전환이 흐림 교체로 내려앉는다(개발 모드에서 경고). 구조가 자주 바뀌면 core에
// 부품 표식(data 속성)을 더할지 판단한다.

/** 부품 하나가 화면에 보이는 모양. 위치는 뷰포트 기준 */
export interface Look {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
  color: string;
  borderWidth: number;
  borderColor: string;
  /** computed box-shadow. 없으면 'none' */
  shadow: string;
  /** 대리 상자가 대신 그리는 동안 감출 요소(바깥쪽부터) */
  hide: (HTMLElement | SVGElement)[];
}

type Hideable = HTMLElement | SVGElement;
const isHideable = (el: unknown): el is Hideable =>
  el instanceof HTMLElement || el instanceof SVGElement;

/** 내용 층에서 부품(들)을 찾는다. 못 찾으면 null */
export type Part = (layer: HTMLElement) => Look[] | null;

const radiusPx = (value: string, width: number, height: number) =>
  value.endsWith('%')
    ? (parseFloat(value) / 100) * Math.min(width, height)
    : parseFloat(value);

/** 요소 하나의 상자와 모양. color는 배경색을 읽을 요소(그려진 면이 다른 요소일 때) */
const lookOf = (
  box: Element | null | undefined,
  options: { color?: Element | null; radius?: number; hide?: Element[] } = {}
): Look[] | null => {
  if (!(box instanceof HTMLElement)) return null;
  const rect = box.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const style = getComputedStyle(box);
  const paint = options.color ?? box;
  return [
    {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      radius: Math.min(
        options.radius ??
          radiusPx(style.borderTopLeftRadius, rect.width, rect.height),
        Math.min(rect.width, rect.height) / 2
      ),
      color: getComputedStyle(paint).backgroundColor,
      borderWidth: parseFloat(style.borderTopWidth),
      borderColor: style.borderTopColor,
      shadow: style.boxShadow,
      hide: (options.hide ?? [box, paint]).filter(
        (el, i, all): el is Hideable => isHideable(el) && all.indexOf(el) === i
      ),
    },
  ];
};

const all = (layer: HTMLElement, selector: string) =>
  Array.from(layer.querySelectorAll(selector));

/** 그려진 슬라이더 손잡이. core Slider의 aria-hidden span이다 */
export const headOf = (range: Element | null) =>
  range?.parentElement?.querySelector<HTMLElement>(
    ':scope > span[aria-hidden]'
  ) ?? null;

const sliderHead = (layer: HTMLElement) =>
  headOf(layer.querySelector('input[type="range"]'));

/**
 * 기본 Slider의 라인. 트랙 칸(div)이 라인 높이로 서고 그 안의 SVG 경로가 그린다.
 * 채움은 같은 경로를 값 위치에서 자른 것(clipPath)이라 자른 폭을 viewBox 비율로 환산한다.
 * shortcut: 쉬는 모양(곧은 라인)만 읽는다. 물결치는 중에 읽으면 두께가 어긋난다. 끄는 중 전환이 필요하면 경로의 BBox를 읽는다.
 */
const sliderLine = (layer: HTMLElement, filled: boolean): Look[] | null => {
  const track = layer
    .querySelector('input[type="range"]')
    ?.parentElement?.querySelector(':scope > div');
  const svg = track?.querySelector('svg');
  const path = track?.querySelector(filled ? 'path:last-of-type' : 'path');
  const clip = track?.querySelector('clipPath rect');
  const look = lookOf(track, { hide: path ? [path] : [] })?.[0];
  if (!track || !svg || !path || !clip || !look) return null;
  const paint = getComputedStyle(path);
  const strokeWidth = filled ? 0 : parseFloat(paint.strokeWidth);
  const scale = look.width / svg.viewBox.baseVal.width;
  const width = filled
    ? Number(clip.getAttribute('width')) * scale
    : look.width;
  if (!(width > 0)) return null;
  return [
    {
      ...look,
      width,
      color: paint.fill,
      borderWidth: strokeWidth,
      borderColor: paint.stroke,
      shadow: 'none',
    },
  ];
};

const checkedMark = (layer: HTMLElement) => {
  const input = layer.querySelector('input[type="checkbox"]');
  const box = input?.nextElementSibling ?? null;
  return { input, box, fill: box?.firstElementChild ?? null };
};

export const PARTS = {
  /** HeaderBar pill: 선택된 항목의 파란 알약(원이 알약 안에서 잘려 그려진다) */
  pill: (layer) => {
    const item = layer.querySelector('[aria-current="page"]');
    return lookOf(item, { color: item?.firstElementChild });
  },
  /** Button: 그 층의 버튼 몸통 */
  button: (layer) => lookOf(layer.querySelector('button')),
  /**
   * Loader orbit: 점마다 하나.
   * shortcut: 점의 밝기 키프레임(불투명도)은 대리 상자에 옮기지 않는다. 대리 상자는 늘 또렷해서 넘겨받는 순간 점이 어두워진다. 거슬리면 대리 상자의 투명도를 그 순간의 점 값으로 트윈한다.
   */
  dots: (layer) => {
    const looks = all(layer, '[data-orbit-dot]').flatMap(
      (dot) => lookOf(dot) ?? []
    );
    return looks.length ? looks : null;
  },
  /** Popover 본체(말풍선) */
  bubble: (layer) => lookOf(layer.querySelector('[role="dialog"]')),
  /** SegmentedButtons 트랙 */
  segTrack: (layer) => lookOf(layer.querySelector('[role="radiogroup"]')),
  /**
   * SegmentedButtons 선택 표식. 파란 면은 clip-path 층이라 상자는 선택된 옵션 라벨을 쓰고
   * 색은 그 층에서 읽는다. 반경은 트랙에서 inset 1px을 뺀 값이다(core의 INDICATOR_RADIUS)
   */
  segMarker: (layer) => {
    const group = layer.querySelector('[role="radiogroup"]');
    const label = layer.querySelector('input:checked')?.closest('label');
    const indicator = group?.firstElementChild?.firstElementChild;
    if (!group || !label || !indicator) return null;
    return lookOf(label, {
      color: indicator,
      radius: parseFloat(getComputedStyle(group).borderTopLeftRadius) - 1,
      hide: [indicator],
    });
  },
  sliderTrack: (layer) => sliderLine(layer, false),
  sliderFill: (layer) => sliderLine(layer, true),
  sliderHead: (layer) => lookOf(sliderHead(layer)),
  /** Switch 트랙(알약) */
  switchTrack: (layer) =>
    lookOf(layer.querySelector('input[role="switch"]')?.parentElement),
  /** Switch 흰 손잡이: 트랙의 마지막 자식(위치 span) 안의 면 */
  switchThumb: (layer) =>
    lookOf(
      layer.querySelector('input[role="switch"]')?.parentElement
        ?.lastElementChild?.firstElementChild
    ),
  /** Checkbox 상자. 체크되면 파란 채움 층이, 아니면 상자 자신이 면이다 */
  checkBox: (layer) => {
    const { input, box, fill } = checkedMark(layer);
    const checked = input instanceof HTMLInputElement && input.checked;
    return lookOf(box, {
      color: checked ? fill : box,
      hide: [box, fill].filter((el) => el != null),
    });
  },
} satisfies Record<string, Part>;

/** 대리 상자가 대신하는 동안 부품을 감춘다. 자식은 다시 보여(흐림으로 따로 나가고 들어온다) 되돌리는 함수를 준다 */
export const hideParts = (looks: Look[]) => {
  const touched: Hideable[] = [];
  for (const look of looks) {
    for (const el of look.hide) {
      el.style.visibility = 'hidden';
      touched.push(el);
      for (const child of el.children) {
        if (isHideable(child)) {
          child.style.visibility = 'visible';
          touched.push(child);
        }
      }
    }
  }
  return () => touched.forEach((el) => el.style.removeProperty('visibility'));
};

/** 색 하나를 같은 색의 투명판으로. computed 색은 rgb(), rgba(), color(srgb ...) 중 하나다 */
const clear = (color: string) => {
  if (color.startsWith('color(')) {
    return color.replace(/(\s*\/\s*[\d.]+)?\)$/, ' / 0)');
  }
  const [r, g, b] = color.match(/[\d.]+/g) ?? [];
  return `rgba(${r}, ${g}, ${b}, 0)`;
};

/** 그림자의 색만 투명으로 바꿔 크기는 두고 걷는다 */
export const fadeShadow = (shadow: string) =>
  shadow.replace(/(?:rgba?|color)\([^)]*\)/g, clear);

/** 도착 색이 투명이면 출발 색의 투명판으로 바꿔 중간에 검게 비치지 않게 한다 */
export const reachable = (from: string, to: string) =>
  /^rgba\(.*,\s*0\)$|\/\s*0\)$/.test(to) || to === 'transparent'
    ? clear(from)
    : to;
