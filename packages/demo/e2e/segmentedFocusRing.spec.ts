import { test, expect } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * SegmentedButtons를 마우스로 누르면 키보드 포커스 링이 켜지던 결함을 잰다.
 *
 * 라벨 클릭의 기본 동작을 막고 숨은 라디오로 focus()를 부르면 브라우저는 스크립트로
 * 옮긴 포커스에 :focus-visible을 켠다. 링은 `:has(input:focus-visible)`로 그려지므로
 * 마우스 클릭에도 링이 떴다. 고친 곳은 handleLabelClick의 `focusVisible: false`다.
 * jsdom은 :focus-visible을 계산하지 않아 실제 브라우저로 잰다.
 *
 * 키보드 쪽은 같은 포커스 이동이 여전히 링을 켜는지 본다(Tab으로 들어가 방향키).
 */

const CODE = `<div id="sb"><SegmentedButtons
  aria-label="기간"
  defaultValue="day"
  options={[
    { value: 'day', label: '일간' },
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
  ]}
/></div>`;

const state = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLInputElement | null;
    return {
      type: el?.type,
      value: el?.value,
      focusVisible: el?.matches(':focus-visible'),
    };
  });

test.describe('SegmentedButtons 포커스 링', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mountLive(page, CODE, '#sb');
  });

  test('마우스로 옵션을 누르면 그 라디오가 포커스이고 :focus-visible이 아니다', async ({
    page,
  }) => {
    await page.locator('#sb label', { hasText: '주간' }).click();
    expect(await state(page)).toEqual({
      type: 'radio',
      value: 'week',
      focusVisible: false,
    });
  });

  test('키보드로 들어가 방향키로 옮기면 :focus-visible이다', async ({
    page,
  }) => {
    await page.locator('#sb').evaluate((el) => {
      // 그룹 바로 앞에서 Tab을 시작한다.
      const probe = document.createElement('button');
      probe.id = 'sb-before';
      el.before(probe);
      probe.focus();
    });
    await page.keyboard.press('Tab');
    expect(await state(page)).toMatchObject({
      value: 'day',
      focusVisible: true,
    });
    await page.keyboard.press('ArrowRight');
    expect(await state(page)).toEqual({
      type: 'radio',
      value: 'week',
      focusVisible: true,
    });
  });
});
