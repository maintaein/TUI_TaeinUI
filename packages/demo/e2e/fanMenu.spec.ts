import { expect, test, type Page } from '@playwright/test';

const stage = (page: Page) =>
  page.getByRole('region', { name: 'FanMenu 미리보기' });
const hub = (page: Page) =>
  stage(page).getByRole('button', { name: '빠른 작업' });
const item = (page: Page, name: string) =>
  stage(page).getByRole('menuitem', { name });
// 빌드물의 클래스 이름은 해시라 역할로 찾는다. 이름표는 항목 묶음 바로 뒤의 장식 겹이다
const tag = (page: Page) =>
  stage(page).locator('[role="menu"] + [aria-hidden="true"]');
const menu = (page: Page) => stage(page).locator('[role="menu"]');

// 앱이 그려지기 전의 입력은 버려진다. 허브가 보인 뒤에 시연을 멈추고, 대본이 열어 둔 채였다면 접어 닫힌 상태에서 시작한다
const open = async (page: Page) => {
  await page.goto('/motion/fan-menu');
  await expect(hub(page)).toBeVisible();
  await stage(page).getByRole('button', { name: '시연 멈춤' }).click();
  // 멈추기 직전에 예약된 대본의 누름이 끝나길 기다린다
  await page.waitForTimeout(600);
  if ((await hub(page).getAttribute('aria-expanded')) === 'true') {
    await hub(page).click();
  }
  await expect(hub(page)).toHaveAttribute('aria-expanded', 'false');
};

// 허브 가운데에서 각도 deg(도), 거리 r만큼 떨어진 화면 좌표
const around = async (page: Page, deg: number, r: number) => {
  const box = (await hub(page).boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const rad = (deg * Math.PI) / 180;
  return { x: cx + Math.cos(rad) * r, y: cy - Math.sin(rad) * r };
};

test.describe('부채꼴 메뉴 상세 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('이름과 줄이기 글과 Props가 있다', async ({ page }) => {
    await page.goto('/motion/fan-menu');
    await expect(
      page.getByRole('heading', { level: 1, name: 'FanMenu' })
    ).toBeVisible();
    await expect(hub(page)).toBeVisible();
    await expect(page.getByText('움직임 줄이기에서는').first()).toContainText(
      '아이콘이 차례 없이 제자리에 바로 나타나고 사라집니다.'
    );
    await expect(page.getByText('onSelect').first()).toBeVisible();
  });

  test('닫힌 항목은 inert라 포커스를 받지 않고 Tab도 지나친다', async ({
    page,
  }) => {
    await open(page);
    await expect(menu(page)).toHaveAttribute('inert', '');
    await hub(page).focus();
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => document.activeElement?.getAttribute('role'))
    ).not.toBe('menuitem');
    // 코드로 포커스를 줘도 inert 항목은 받지 않는다
    await hub(page).focus();
    await item(page, '사진').evaluate((el: HTMLElement) => el.focus());
    await expect(hub(page)).toBeFocused();
  });

  test('마우스로 열고 호 위 방향으로 포인터를 옮기면 그 아이콘이 커지고 이름표가 뜬다', async ({
    page,
  }) => {
    await open(page);
    await hub(page).click();
    await expect(hub(page)).toHaveAttribute('aria-expanded', 'true');
    // 마우스로 열면 포커스는 허브에 남는다
    await expect(hub(page)).toBeFocused();
    const before = (await item(page, '위치').boundingBox())!;

    // 여섯 개는 180, 144, 108, 72, 36, 0도에 선다. 72도 쪽이 위치다
    const at = await around(page, 72, 110);
    await page.mouse.move(at.x, at.y);
    await expect(tag(page)).toHaveText('위치');
    await expect(tag(page)).toHaveCSS('opacity', '1');
    await expect
      .poll(async () => (await item(page, '위치').boundingBox())!.width)
      .toBeGreaterThan(before.width * 1.3);
    await expect(item(page, '위치')).toHaveCSS(
      'background-color',
      'rgb(25, 118, 210)'
    );
    // 다른 쪽으로 옮기면 가리킴이 옮겨 간다
    const other = await around(page, 144, 110);
    await page.mouse.move(other.x, other.y);
    await expect(tag(page)).toHaveText('메시지');
  });

  test('이름표 위로 포인터를 옮겨도 이름표가 남는다', async ({ page }) => {
    await open(page);
    await hub(page).click();
    const at = await around(page, 100, 110);
    await page.mouse.move(at.x, at.y);
    await expect(tag(page)).toHaveCSS('opacity', '1');
    const box = (await tag(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(400);
    await expect(tag(page)).toHaveCSS('opacity', '1');
  });

  test('키보드로 열어 화살표로 옮기고 Enter로 고르면 허브로 포커스가 돌아온다', async ({
    page,
  }) => {
    await open(page);
    await hub(page).focus();
    await page.keyboard.press('Enter');
    await expect(item(page, '사진')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect(item(page, '음악')).toBeFocused();
    // 포커스된 아이콘도 이름표가 뜬다
    await expect(tag(page)).toHaveText('음악');
    await expect(tag(page)).toHaveCSS('opacity', '1');
    await page.keyboard.press('End');
    await expect(item(page, '설정')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(item(page, '사진')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    await expect(stage(page).getByText('고른 항목: 좋아요')).toBeVisible();
    await expect(hub(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(hub(page)).toBeFocused();
  });

  test('Esc는 접고 허브로 포커스를 돌린다', async ({ page }) => {
    await open(page);
    await hub(page).focus();
    await page.keyboard.press('ArrowUp');
    await expect(item(page, '사진')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(hub(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(hub(page)).toBeFocused();
    await expect(menu(page)).toHaveAttribute('inert', '');
  });

  test('바깥을 누르면 접힌다', async ({ page }) => {
    await open(page);
    await hub(page).click();
    await expect(hub(page)).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.click(5, 5);
    await expect(hub(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('조작판의 항목 개수를 줄이면 그만큼만 그려진다', async ({ page }) => {
    await open(page);
    await page.getByRole('slider', { name: '항목 개수' }).fill('3');
    await hub(page).click();
    await expect(stage(page).getByRole('menuitem')).toHaveCount(3);
  });
});

test.describe('부채꼴 메뉴 움직임 줄이기 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('차례와 전이 없이 항목이 바로 나타난다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion/fan-menu');
    await expect(hub(page)).toBeVisible();
    await hub(page).click();
    // 열린 직후에 이미 끝 상태다(전이를 기다리지 않는다)
    const state = await item(page, '설정').evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        opacity: style.opacity,
        seconds: parseFloat(style.transitionDuration),
      };
    });
    // 전역 줄이기 규칙이 0.01ms로 눌러 정확히 0은 아니다
    expect(state.opacity).toBe('1');
    expect(state.seconds).toBeLessThan(0.001);
  });
});
