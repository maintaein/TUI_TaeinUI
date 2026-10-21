import { test, expect } from '@playwright/test';

/**
 * 무대의 누름 거울: 합성 pointerdown은 CSS :active를 켜지 못해, 무대가 붙을 때 :active 규칙마다
 * [data-stage-active] 쌍둥이를 넣고 대본의 press가 누르는 동안 그 속성을 붙였다 뗀다.
 * NumericSpinner 상세의 시연이 + 단추를 누르는 동안의 배경이 진짜 마우스로 누른 배경과 같은지,
 * 같은 클래스의 무대 밖 단추는 그대로인지, 시연이 끝나면 속성이 남지 않는지 잰다.
 */

type Win = Window & { __since?: number };

test('시연 누름 단계의 + 단추는 진짜 :active와 같은 배경이 되고 무대 밖 단추는 그대로다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/numeric-spinner');
  const plus = page.locator('[data-stage-target="plus"]');
  await expect(plus).toBeVisible();

  await plus.evaluate((el) => {
    const outside = el.cloneNode(true) as HTMLElement;
    outside.removeAttribute('data-stage-target');
    outside.id = 'outside';
    document.querySelector('main')!.append(outside);
  });

  // 시연이 + 를 누르기 시작해 0.3초 지난 때(처음 세 번은 짧게, 그다음은 길게 누른다. 길게 누르는 쪽은 충분히 오래 머문다)
  const seen = await page.waitForFunction(
    () => {
      const w = window as Win;
      const el = document.querySelector('[data-stage-target="plus"]')!;
      if (!el.hasAttribute('data-stage-active')) {
        w.__since = undefined;
        return false;
      }
      w.__since ??= performance.now();
      if (performance.now() - w.__since < 300) return false;
      const outside = document.querySelector('#outside')!;
      return {
        stage: getComputedStyle(el).backgroundColor,
        outside: getComputedStyle(outside).backgroundColor,
        outsideMarked: outside.hasAttribute('data-stage-active'),
      };
    },
    undefined,
    { polling: 'raf', timeout: 30_000 }
  );
  const { stage, outside, outsideMarked } = await seen.jsonValue();
  expect(outsideMarked).toBe(false);
  expect(stage).not.toBe(outside);

  // 진짜 마우스가 올라오면 시연은 넘겨주고(속성이 지워지고) 눌러 보면 진짜 :active가 같은 색을 낸다
  const box = (await plus.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(plus).not.toHaveAttribute('data-stage-active', /.*/);
  await page.mouse.down();
  await expect
    .poll(() => plus.evaluate((el) => getComputedStyle(el).backgroundColor), {
      timeout: 3000,
    })
    .toBe(stage);
  await page.mouse.up();
});
