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
