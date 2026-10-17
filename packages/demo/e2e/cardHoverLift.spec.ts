import { test, expect, type Locator } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * hoverLift 카드의 `will-change`가 쉴 때 상주하지 않고 움직이는 동안에만 서는지
 * 실제 :hover와 눌림으로 잰다(8520a5c).
 *
 * 카드는 크고 hoverLift 카드가 한 페이지에 수십 장이면 쉬는 카드마다 합성 레이어가
 * 상주한다. 지금은 정밀 포인터 호버 중과 누름 중에만 `transform`이고 쉴 때와 떠난
 * 뒤에는 `auto`다. jsdom은 :hover 규칙과 미디어 쿼리를 평가하지 않아 이 CSS를 읽지
 * 못한다. 헤드리스 Chromium의 기본 포인터는 `(hover: hover) and (pointer: fine)`을
 * 만족한다.
 *
 * will-change는 트랜지션 대상이 아니라 규칙이 바뀌면 곧바로 계산된다. 그래도
 * 포인터 이벤트(React가 data-pressed를 다는 시점)와 렌더 사이를 부하에서 흔들리지
 * 않게 폴링으로 읽는다(상한 3초). 쉼은 값이 변하지 않아야 하는 쪽이라 이동 전에
 * 한 번만 읽는다.
 */

const CODE = `<div id="k" style={{ width: '300px' }}><Card hoverLift onClick={() => {}}><Card.Body>카드 본문</Card.Body></Card></div>`;

const willChange = (card: Locator): Promise<string> =>
  card.evaluate((el) => getComputedStyle(el).willChange);

test('hoverLift 카드는 쉴 때 auto, 호버와 누름 중에만 transform, 떠나면 다시 auto다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.mouse.move(2, 2);
  await mountLive(page, '/components/card', CODE, '#k');
  // 클릭 가능한 카드는 button 역할이 아닐 수 있어 DOM 위치로 잡는다(#k 의 첫 자식).
  const card = page.locator('#k > *').first();
  await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.mouse.move(2, 2);

  expect(await willChange(card)).toBe('auto');

  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect
    .poll(() => willChange(card), { timeout: 3000 })
    .toBe('transform');

  await page.mouse.down();
  await expect(card).toHaveAttribute('data-pressed', /.*/);
  await expect
    .poll(() => willChange(card), { timeout: 3000 })
    .toBe('transform');

  await page.mouse.up();
  await page.mouse.move(2, 2);
  await expect(card).not.toHaveAttribute('data-pressed', /.*/);
  await expect.poll(() => willChange(card), { timeout: 3000 }).toBe('auto');
});
