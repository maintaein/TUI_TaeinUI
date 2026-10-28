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
}

interface Entry extends MorphLook {
  at: number;
}

/**
 * 짝이 이만큼 안에 안 나타나면 버린다. 같은 커밋에서 짝이 마운트되는 보통의 전환은 0ms에 닿고,
 * 6프레임쯤(100ms)은 느린 렌더도 받는다. 더 늦은 짝은 다른 장면의 요소라 이어받지 않는다.
 */
export const MORPH_MAX_AGE_MS = 100;

const entries = new Map<string, Entry>();

/** 겉모양을 맡긴다. 같은 id가 이미 있으면 나중 것이 이긴다. 오래된 기록은 이때 함께 버린다. */
export const rememberMorph = (
  id: string,
  look: MorphLook,
  now = performance.now()
): void => {
  for (const [key, entry] of entries) {
    if (now - entry.at > MORPH_MAX_AGE_MS) entries.delete(key);
  }
  entries.set(id, { ...look, at: now });
};

/** 맡긴 겉모양을 집어 가며 지운다. 없거나 너무 오래됐으면 undefined. */
export const takeMorph = (
  id: string,
  now = performance.now()
): MorphLook | undefined => {
  const entry = entries.get(id);
  entries.delete(id);
  if (!entry || now - entry.at > MORPH_MAX_AGE_MS) return undefined;
  const { at: _at, ...look } = entry;
  return look;
};
