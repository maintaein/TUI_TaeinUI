import { test, expect } from '@playwright/test';

/**
 * 무대의 호버 거울: 연출 커서의 합성 포인터 이벤트로는 CSS :hover가 켜지지 않아, 무대가 붙을 때
 * :hover 규칙마다 [data-stage-hover] 쌍둥이를 넣고 대본의 hover가 그 속성을 붙인다.
 * Button 상세의 시연(호버 머무름 0.7초)에서 무대 Button의 배경이 진짜 :hover와 같은지,
 * 같은 쪽에 놓은 무대 밖 Button(같은 클래스)은 그대로인지 잰다. 헤드리스 Chromium의 기본 포인터는
 * (hover: hover) and (pointer: fine)을 만족한다.
 */

type Win = Window & { __since?: number };

test('시연 호버 단계의 무대 Button은 진짜 :hover와 같은 배경이 되고 무대 밖 Button은 그대로다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(2, 2);
  await page.goto('/components/button');
  const stageBtn = page.locator('[data-stage-target="button"]');
  await expect(stageBtn).toBeVisible();

  // 같은 클래스의 무대 밖 Button
  await stageBtn.evaluate((el) => {
    const outside = el.cloneNode(true) as HTMLElement;
    outside.removeAttribute('data-stage-target');
    outside.id = 'outside';
    document.querySelector('main')!.append(outside);
  });

  // 쌍둥이 규칙 수가 :hover와 :active 규칙 수와 같다(하나라도 못 넣으면 거울이 비어 간다)
  const counts = await page.evaluate(() => {
    const out = { hover: 0, twin: 0 };
    const walk = (list: CSSRuleList) => {
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSStyleRule) {
          if (/:hover|:active/.test(rule.selectorText)) out.hover++;
          if (/data-stage-(hover|active)/.test(rule.selectorText)) out.twin++;
        } else if (rule instanceof CSSGroupingRule) walk(rule.cssRules);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch {
        // 다른 출처 시트
      }
    }
    return out;
  });
  expect(counts.hover).toBeGreaterThan(0);
  expect(counts.twin).toBe(counts.hover);

  // 시연이 호버 단계에 들어가 0.4초 머문 때(전이가 끝난 뒤, 누르기 전)의 두 배경
  const seen = await page.waitForFunction(
    () => {
      const w = window as Win;
      const el = document.querySelector('[data-stage-target="button"]')!;
      if (!el.hasAttribute('data-stage-hover')) {
        w.__since = undefined;
        return false;
      }
      w.__since ??= performance.now();
      if (performance.now() - w.__since < 400) return false;
      return {
        stage: getComputedStyle(el).backgroundColor,
        outside: getComputedStyle(document.querySelector('#outside')!)
          .backgroundColor,
        outsideMarked: document
          .querySelector('#outside')!
          .hasAttribute('data-stage-hover'),
      };
    },
    undefined,
    { polling: 'raf', timeout: 20_000 }
  );
  const { stage, outside, outsideMarked } = await seen.jsonValue();
  expect(outsideMarked).toBe(false);
  expect(stage).not.toBe(outside);

  // 진짜 마우스가 올라오면 시연은 넘겨주고(속성이 지워지고) 진짜 :hover가 같은 색을 낸다
  const box = (await stageBtn.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(stageBtn).not.toHaveAttribute('data-stage-hover', /.*/);
  await expect
    .poll(
      () => stageBtn.evaluate((el) => getComputedStyle(el).backgroundColor),
      {
        timeout: 3000,
      }
    )
    .toBe(stage);
  expect(
    await page
      .locator('#outside')
      .evaluate((el) => getComputedStyle(el).backgroundColor)
  ).toBe(outside);
});
