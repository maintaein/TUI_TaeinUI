import { test, expect, type Page } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * 색이 채워진 단추(Button strong 4색, FanMenu 허브, RocketButton)와 BurstToggle의 키보드 포커스가
 * 바깥 링이 아니라 요소 자신의 가장자리 안쪽으로 나오는지 실제 브라우저로 잰다(사용자 결정, M7.2 T1).
 * jsdom은 :focus-visible과 box-shadow 계산값을 주지 못한다.
 *
 * 색은 계산값 rgb다: primary[900] #0D47A1, gray[900] #212121, error[900] #B71C1C, primary.main
 * #1976D2, gray[100] #F5F5F5, 흰색. 누르는 컨트롤이라 :focus-visible(Tab)이고 마우스 클릭은 아니다.
 */
const PRIMARY = 'rgb(25, 118, 210)';
const PRIMARY_DARK = 'rgb(13, 71, 161)';
const GRAY_DARK = 'rgb(33, 33, 33)';
const ERROR_DARK = 'rgb(183, 28, 28)';
const GRAY_100 = 'rgb(245, 245, 245)';
const WHITE = 'rgb(255, 255, 255)';

const two = (dark: string) =>
  `${dark} 0px 0px 0px 2px inset, ${WHITE} 0px 0px 0px 4px inset`;

/** 시트 앞에 탐침 단추를 두고 거기서 Tab을 시작한다. */
const mountSheet = async (page: Page, jsx: string, ready: string) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mountLive(
    page,
    `<div id="sheet" style={{padding:48,display:'flex',flexDirection:'column',gap:24,width:360,alignItems:'flex-start'}}>${jsx}</div>`,
    `${ready} >> nth=0`
  );
  await page.evaluate(() => {
    const probe = document.createElement('button');
    probe.id = 'probe';
    document.getElementById('sheet')?.before(probe);
    probe.focus();
  });
};

const tab = async (page: Page, times = 1) => {
  for (let i = 0; i < times; i += 1) await page.keyboard.press('Tab');
};

/** 포커스를 받은 요소의 윤곽선·그림자·크기. 전이(box-shadow base)가 끝난 값을 읽으려 poll로 쓴다. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      outline: style.outlineStyle,
      shadow: style.boxShadow,
      border: style.borderTopColor,
      w: rect.width,
      h: rect.height,
    };
  });

test.describe('Button strong 포커스', () => {
  test.beforeEach(async ({ page }) => {
    await mountSheet(
      page,
      `<Button>a</Button><Button variant="dark">b</Button><Button variant="danger">c</Button><Button variant="light">d</Button>`,
      '#sheet button'
    );
  });

  for (const [index, name, dark] of [
    [1, 'primary', PRIMARY_DARK],
    [2, 'dark', GRAY_DARK],
    [3, 'danger', ERROR_DARK],
  ] as const) {
    test(`${name}: 가장자리 안쪽 짙은 2px와 흰 2px 두 겹이고 크기가 그대로다`, async ({
      page,
    }) => {
      const before = await page
        .locator('#sheet button')
        .nth(index - 1)
        .boundingBox();
      await tab(page, index);
      await expect
        .poll(async () => (await focused(page)).shadow)
        .toBe(two(dark));
      const after = await focused(page);
      expect(after.outline).toBe('none');
      expect([after.w, after.h]).toEqual([before?.width, before?.height]);
    });
  }

  test('light: 테두리와 안쪽 2px가 모두 짙은 primary다', async ({ page }) => {
    await tab(page, 4);
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toBe(`${PRIMARY_DARK} 0px 0px 0px 2px inset`);
    const state = await focused(page);
    expect(state.outline).toBe('none');
    expect(state.border).toBe(PRIMARY_DARK);
  });

  test('호버 중에도 보이고 마우스 클릭으로는 생기지 않는다', async ({
    page,
  }) => {
    await tab(page, 1);
    await page.locator('#sheet button').first().hover();
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toBe(two(PRIMARY_DARK));
    await page.locator('#sheet button').nth(1).click();
    await page.mouse.move(2, 2);
    // 같은 단추를 마우스로 눌러 포커스가 와도 :focus-visible이 아니라 그림자가 없다
    await expect.poll(async () => (await focused(page)).shadow).toBe('none');
  });
});

test.describe('FanMenu 허브 포커스', () => {
  test('안쪽 두 겹에 평소 그림자가 합쳐져 있고 마우스로는 없다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<FanMenu label="메뉴" items={[{icon:<b>1</b>,label:'하나',onSelect:()=>{}},{icon:<b>2</b>,label:'둘',onSelect:()=>{}}]} />`,
      '#sheet [aria-haspopup=menu]'
    );
    await tab(page, 1);
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toContain(two(PRIMARY_DARK));
    // 안쪽 두 겹 뒤에 평소 바깥 그림자가 이어진다
    expect((await focused(page)).shadow).toContain('rgba');
    expect((await focused(page)).outline).toBe('none');
    // 이미 키보드로 포커스된 단추는 다시 눌러도 :focus-visible이 남는다. 포커스를 치우고 마우스로 누른다
    await page.locator('#probe').focus();
    await page.locator('#sheet [aria-haspopup=menu]').click();
    await page.mouse.move(2, 2);
    await expect
      .poll(async () => (await focused(page)).shadow)
      .not.toContain('inset');
  });
});

test.describe('BurstToggle 포커스', () => {
  test('호버와 같은 옅은 면에 안쪽 primary 2px이고 마우스로는 없다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<BurstToggle aria-label="좋아요" selected={false} onClick={()=>{}} selectedIcon={<b>x</b>}><b>o</b></BurstToggle>`,
      '#sheet button'
    );
    await tab(page, 1);
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toBe(`${PRIMARY} 0px 0px 0px 2px inset`);
    expect((await focused(page)).outline).toBe('none');
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            getComputedStyle(document.activeElement as Element).backgroundColor
        )
      )
      .toBe(GRAY_100);
    await page.locator('#probe').focus();
    await page.locator('#sheet button').click();
    await page.mouse.move(2, 2);
    await expect.poll(async () => (await focused(page)).shadow).toBe('none');
  });
});

test.describe('RocketButton 포커스', () => {
  test('단추는 Button strong primary를 따르고 날아간 뒤 표지로 옮겨 온 포커스는 안쪽 primary 2px다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mountSheet(
      page,
      `<RocketButton smoke={false}>보내기</RocketButton>`,
      '#sheet button'
    );
    await tab(page, 1);
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toBe(two(PRIMARY_DARK));
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-rocket-mark]')).toBeFocused();
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toBe(`${PRIMARY} 0px 0px 0px 2px inset`);
    expect((await focused(page)).outline).toBe('none');
  });
});
