/**
 * 사라지는 요소가 남긴 겉모양을 `morphId`로 맡아 두는 등록부.
 * React 루트가 아니라 모듈 전역이다. 값은 숫자와 문자열뿐이라 DOM 노드를 붙들지 않는다.
 */
export interface MorphLook {
  /** 뷰포트 기준 사각형(그 순간 보이던 모습, transform 포함) */
  left: number;
  top: number;
  width: number;
  height: number;
  /** 보이던 둥글기(px) */
  radius: number;
  /** 보이던 배경색 */
  background: string;
  /** 사라지기 전에 포커스가 그 안에 있었는지 */
  focused: boolean;
  /** 이어받는 도중의 모습인지(쉬는 모습이 아니라). 같은 인스턴스가 다시 마운트될 때 이어갈 만한 기록이라는 뜻이다 */
  inFlight: boolean;
}

interface Entry extends MorphLook {
  at: number;
  /** 기록을 남긴 Morph 인스턴스 표지 */
  owner: object;
}

/**
 * 짝이 이만큼 안에 안 나타나면 버린다. 같은 커밋에서 짝이 마운트되는 보통의 전환은 0ms에 닿고,
 * 6프레임쯤(100ms)은 느린 렌더도 받는다. 더 늦은 짝은 다른 장면의 요소라 이어받지 않는다.
 */
export const MORPH_MAX_AGE_MS = 100;

const entries = new Map<string, Entry>();

/**
 * 겉모양을 맡긴다. 같은 id가 이미 있으면 나중에 맡긴 것이 이긴다. 오래된 기록은 이때 함께 버린다.
 * ponytail: 동시에 사라지는 같은 id가 여럿이면 정리가 도는 순서(트리 순서)로 "나중"이 정해진다, 마운트 순서가 아니다. 어긋나는 레이아웃이 나오면 마운트 번호를 기록에 더한다.
 */
export const rememberMorph = (
  id: string,
  look: MorphLook,
  owner: object,
  now = performance.now()
): void => {
  for (const [key, entry] of entries) {
    if (now - entry.at > MORPH_MAX_AGE_MS) entries.delete(key);
  }
  entries.set(id, { ...look, at: now, owner });
};

/**
 * 맡긴 겉모양을 집어 가며 지운다. 없거나 너무 오래됐으면 undefined.
 * 자기(같은 owner)가 남긴 쉬는 모습은 집지 않고 지운다: StrictMode는 마운트 직후 효과를 정리했다 다시 거는데,
 * 그 정리가 남긴 기록을 곧 다시 도는 효과가 집으면 짝이 없어도 이어받기가 시작된다. 이어받는 도중의 기록은
 * 자기 것이어도 돌려준다(그 재실행이 막 시작한 이어받기를 이어 가야 한다).
 */
export const takeMorph = (
  id: string,
  owner: object,
  now = performance.now()
): MorphLook | undefined => {
  const entry = entries.get(id);
  entries.delete(id);
  if (!entry || now - entry.at > MORPH_MAX_AGE_MS) return undefined;
  if (entry.owner === owner && !entry.inFlight) return undefined;
  const { at: _at, owner: _owner, ...look } = entry;
  return look;
};
