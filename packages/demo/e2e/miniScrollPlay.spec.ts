import { expect, test, type Locator, type Page } from '@playwright/test';

const MINI = 'CopyButton 미리보기';

// 연출 커서는 재생 중 불투명, 멈추면 투명하다. gsap가 인라인 style에 쓰는 값을 읽는다
const cursorOf = (page: Page) =>
  page.locator(`[data-stage-mini="${MINI}"] [data-stage-cursor]`);
const opacity = (cursor: Locator) =>
  cursor.evaluate((el) => Number((el as HTMLElement).style.opacity));
const move = (cursor: Locator) =>
  cursor.evaluate(
    (el) => (el as HTMLElement).style.transform.split(' scale')[0]
  );

/** 미니의 윗변이 뷰포트 아래쪽에서 `shown` 비율만큼만 보이게 스크롤한다 */
const scrollToShow = (page: Page, shown: number) =>
  page.evaluate(
    ([label, ratio]) => {
      const el = document.querySelector(`[data-stage-mini="${label}"]`)!;
      const r = el.getBoundingClientRect();
      window.scrollTo(
        0,
        window.scrollY + r.top - window.innerHeight + r.height * Number(ratio)
      );
    },
    [MINI, shown] as const
  );

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.mouse.move(2, 2);
  await page.goto('/motion');
  await expect(cursorOf(page)).toBeAttached();
});

test('카드가 조금이라도 보이면 미니는 멈추지 않는다', async ({ page }) => {
  const cursor = cursorOf(page);
  await scrollToShow(page, 0.25);
  await expect.poll(() => opacity(cursor)).toBe(1);
  // 반쯤 보일 때도, 거의 벗어나는 순간(5%)도 선 채로 두지 않는다
  await scrollToShow(page, 0.5);
  await expect.poll(() => opacity(cursor)).toBe(1);
  await scrollToShow(page, 0.05);
  await page.waitForTimeout(400);
  expect(await opacity(cursor)).toBe(1);
});

const xy = (cursor: Locator) =>
  move(cursor).then((t) => (t.match(/-?[\d.]+(?=px)/g) ?? []).map(Number));
const gap = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test('완전히 벗어나면 서고, 돌아오면 서 있던 자리에서 이어 간다', async ({
  page,
}) => {
  const cursor = cursorOf(page);
  await scrollToShow(page, 1);
  await page.evaluate(() => window.scrollBy(0, 150));
  const rest = await xy(cursor);
  // 쉬는 자리로 돌아가는 중(쉬는 자리까지 20px 넘게 남고 가까워지는 중)에 벗어난다.
  // 다시 시작했다면 커서는 이 자리에 남았다 단추로 가고, 이어 갔다면 곧 쉬는 자리에 닿는다
  let before = rest;
  await expect
    .poll(
      async () => {
        const now = await xy(cursor);
        const homing =
          gap(now, rest) > 20 && gap(now, rest) < gap(before, rest) - 3;
        before = now;
        await page.waitForTimeout(30);
        return homing;
      },
      { timeout: 15_000, intervals: [0] }
    )
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => opacity(cursor)).toBe(0);
  const stopped = await xy(cursor);
  await page.waitForTimeout(600);
  expect(await xy(cursor)).toEqual(stopped);
  expect(gap(stopped, rest)).toBeGreaterThan(8);
  await scrollToShow(page, 1);
  // 남은 길을 마저 가 쉬는 자리에 닿는다. 다시 시작했다면 시작 지연(0.6초) 동안 이 자리에 서 있다 단추로 간다
  let nearest = Infinity;
  for (let i = 0; i < 30; i++) {
    nearest = Math.min(nearest, gap(await xy(cursor), rest));
    await page.waitForTimeout(30);
  }
  expect(nearest).toBeLessThan(3);
});
