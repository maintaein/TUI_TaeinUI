/** 폰트를 기다리는 상한. 넘으면 있는 폰트로 간다 */
export const FONT_WAIT_MS = 3000;

/**
 * 폰트가 오는 중이면 기다릴 약속과 타이머를 걷는 stop을, 이미 있거나 FontFaceSet이 없으면 null(바로 간다)을 돌려준다.
 * 조각은 렌더된 글자를 오리는 것이라 폰트가 바뀌면 영역이 어긋난다.
 */
export const waitForFont = (
  el: HTMLElement,
  text: string
): { ready: Promise<void>; stop: () => void } | null => {
  const fonts = document.fonts as FontFaceSet | undefined;
  if (!fonts) return null;
  const font = getComputedStyle(el).font;
  try {
    if (fonts.check?.(font, text)) return null;
  } catch {
    // ponytail: computed font가 빈 문자열인 브라우저(옛 Firefox)는 check가 던진다. 기다리지 않고 간다, 지원 하한을 올리면 지운다.
    return null;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ready = new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    timer = setTimeout(done, FONT_WAIT_MS);
    fonts.load(font, text).then(done, done);
  });
  return { ready, stop: () => clearTimeout(timer) };
};
