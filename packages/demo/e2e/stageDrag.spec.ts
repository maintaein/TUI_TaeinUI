import { test, expect } from '@playwright/test';

/**
 * 무대의 drag(target, to, seconds): 합성 pointerdown, 값을 코드로 옮기며 input 이벤트, 합성 pointerup.
 * Slider 상세의 시연이 손잡이를 잡고 끌어 올렸다 내리는지, 잡은 동안 core의 끄는 중 표시
 * (showThumbValue의 머리 위 값)가 뜨는지, 시연을 멈추면 잡은 채 남지 않고 놓는지 잰다.
 */
test('시연이 손잡이를 잡고 끌며 멈추면 놓는다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/slider');
  const range = page.locator('[data-stage-target="slider"]');
  await expect(range).toBeVisible();

  // 슬라이더 칸의 자식: 라인, 머리, (잡은 동안만) 값 띄우기, 입력. 값 띄우기가 있으면 잡은 것이다
  const children = () =>
    range.evaluate((el) => el.parentElement!.children.length);

  // 끌어 올리는 중에 값이 시작값(30)을 넘고 잡힌 상태다. 값과 잡힘은 한 poll 안에서 함께 본다
  // (따로 읽으면 그 사이 끌기가 끝나 놓인 상태를 읽는다)
  await expect
    .poll(
      async () =>
        Number(await range.inputValue()) > 60 ? await children() : 0,
      { timeout: 15_000 }
    )
    .toBe(4);

  // 멈추면 놓는다(값 띄우기가 사라지고 값은 더 바뀌지 않는다)
  await page.getByRole('button', { name: '시연 멈춤' }).click();
  await page.mouse.move(2, 2);
  await expect.poll(children).toBe(3);
  const frozen = await range.inputValue();
  await page.waitForTimeout(1000);
  expect(await range.inputValue()).toBe(frozen);

  // 다시 시작하면 이어서 끈다
  await page.getByRole('button', { name: '시연 다시 시작' }).click();
  await page.mouse.move(2, 2);
  await expect.poll(children).toBe(4);
});
