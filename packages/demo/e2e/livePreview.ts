import { type Page } from '@playwright/test';

/**
 * 시험용 페이지 `/e2e/live`(빈 라이브 편집기 하나)에 JSX를 채워 고정 구성을 만든다.
 * 데모 문서 페이지는 바뀔 수 있으므로 회귀 스펙은 자기 구성을 직접 만들어 잰다.
 * `useState` 같은 문을 쓰면 JSX 앞에 빈 줄이 하나 있어야 편집기가 JSX를 분리한다.
 * `readySelector`가 그려질 때까지 기다린다(고정 대기를 쓰지 않는다).
 */
export const mountLive = async (
  page: Page,
  code: string,
  readySelector: string
): Promise<void> => {
  await page.goto('/e2e/live');
  const editor = page.locator('main textarea').first();
  await editor.scrollIntoViewIfNeeded();
  await editor.fill(code);
  await page.locator(readySelector).scrollIntoViewIfNeeded();
};
