import { type Locator } from '@playwright/test';

// 가리킨 아이콘이 이름표와 함께 커져 있는 순간: 가리킨 아이콘의 이름이 name이고, 이름표가 같은 글자로 보이며, 가리킨 아이콘이 다른 아이콘보다 크다
export const pointing = (scope: Locator, name: string) =>
  scope.evaluate((el, label) => {
    const hot = el.querySelector<HTMLElement>('[data-hot]');
    const tag = el.querySelector<HTMLElement>(
      '[role="menu"] + [aria-hidden="true"]'
    );
    const other = el.querySelector<HTMLElement>(
      '[role="menuitem"]:not([data-hot])'
    );
    if (!hot || !tag || !other) return false;
    return (
      hot.getAttribute('aria-label') === label &&
      tag.textContent === label &&
      getComputedStyle(tag).opacity === '1' &&
      hot.getBoundingClientRect().width >
        other.getBoundingClientRect().width * 1.3
    );
  }, name);

// 부하에서 poll 간격이 길어지면 짚는 순간을 놓친다. 같은 판정을 페이지 안에서 매 프레임 돌려 짚힌 이름을 모아 둔다
export const watchPointing = (scope: Locator) =>
  scope.evaluate((el) => {
    const seen: string[] = [];
    (el as HTMLElement & { __pointed?: string[] }).__pointed = seen;
    const tick = () => {
      const hot = el.querySelector<HTMLElement>('[data-hot]');
      const tag = el.querySelector<HTMLElement>(
        '[role="menu"] + [aria-hidden="true"]'
      );
      const other = el.querySelector<HTMLElement>(
        '[role="menuitem"]:not([data-hot])'
      );
      const label = hot?.getAttribute('aria-label');
      if (
        hot &&
        tag &&
        other &&
        label &&
        tag.textContent === label &&
        getComputedStyle(tag).opacity === '1' &&
        hot.getBoundingClientRect().width >
          other.getBoundingClientRect().width * 1.3 &&
        seen[seen.length - 1] !== label
      )
        seen.push(label);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

export const pointedSoFar = (scope: Locator) =>
  scope.evaluate(
    (el) => (el as HTMLElement & { __pointed?: string[] }).__pointed ?? []
  );
