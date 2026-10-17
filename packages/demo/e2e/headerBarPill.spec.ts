import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * HeaderBar 알약(navStyle="pill")의 호버 채움이 창 크기 변화에 풀리던 결함(afcb3ea)을
 * 실제 브라우저로 잰다.
 *
 * 알약은 마운트와 창 resize마다 크기를 다시 재서 타임라인을 새로 만든다. 예전에는
 * 새 타임라인을 선택(active) 여부로만 0 또는 1에 놓아서, 마우스를 올려 채워 둔
 * 알약이 resize 한 번에 비었다. jsdom은 실제 resize 이벤트와 실제 :hover 상태를
 * 함께 만들지 못한다(시험은 이벤트를 합성한다). 여기서는 실제 마우스를 올린 채
 * 뷰포트를 바꾼다.
 *
 * 채움의 지표는 알약 안 장식 원(첫 자식 span, aria-hidden)의 계산된 scale이다.
 * 채워지면 CIRCLE_SCALE_END(1.2, HeaderBarPill.tsx)이고 비면 0이다. 호버 채움은
 * slow(300ms) 트윈이라 처음 채움은 폴링으로 기다리고(상한 3초), 그 뒤 resize의 영향은
 * 동기로 일어나므로 500ms 기다렸다 한 번 읽는다. 고친 곳은 layout()의
 * `timeline.progress(pointer || focus || active ? 1 : 0)`와 같은 크기면 다시 만들지
 * 않는 `measured` 가드다.
 */

const FILLED = 1.19;

const circleScale = (item: Locator): Promise<number> =>
  item.evaluate((el) => {
    const circle = el.querySelector('span[aria-hidden="true"]')!;
    return new DOMMatrix(getComputedStyle(circle).transform).a;
  });

const hoverCenter = async (page: Page, item: Locator) => {
  const box = (await item.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(point.x, point.y);
  return point;
};

test('알약을 호버로 채운 뒤 뷰포트 폭이나 높이를 바꿔도 채움이 유지된다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/components/header-bar');

  const header = page
    .getByRole('heading', { name: 'navStyle: pill', level: 3 })
    .locator('..')
    .getByRole('banner');
  await header.scrollIntoViewIfNeeded();
  // 선택(aria-current)된 항목은 처음부터 채워져 있어 호버의 증거가 못 된다.
  const item = header.getByRole('link', { name: '카테고리' });
  await expect(item).not.toHaveAttribute('aria-current', 'page');
  await item.evaluate((el) => el.scrollIntoView({ block: 'center' }));

  expect(await circleScale(item)).toBeLessThan(0.1);
  const point = await hoverCenter(page, item);
  await expect
    .poll(() => circleScale(item), { timeout: 3000 })
    .toBeGreaterThan(FILLED);

  for (const size of [
    { width: 1260, height: 900 }, // 폭이 바뀐다
    { width: 1260, height: 700 }, // 높이만 바뀐다
  ]) {
    await page.setViewportSize(size);
    // 마우스는 그대로 두고 알약이 아직 그 아래에 있는지만 확인한다. 아래를 벗어나 나갔다
    // 들어오면 채움이 정당하게 새로 생겨 회귀를 가리므로, 그 경우는 실패로 둔다.
    const box = (await item.boundingBox())!;
    expect(point.x).toBeGreaterThan(box.x);
    expect(point.x).toBeLessThan(box.x + box.width);
    expect(point.y).toBeGreaterThan(box.y);
    expect(point.y).toBeLessThan(box.y + box.height);
    await page.waitForTimeout(500);
    expect(
      await circleScale(item),
      `${size.width}x${size.height}`
    ).toBeGreaterThan(FILLED);
  }
});
