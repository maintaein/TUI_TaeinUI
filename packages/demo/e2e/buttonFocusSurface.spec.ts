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

/** 브라우저가 color-mix를 계산한 값(rgb 또는 color())을 그대로 읽어 기대값으로 쓴다. */
const resolveColor = (page: Page, css: string) =>
  page.evaluate((value) => {
    const probe = document.createElement('i');
    probe.style.color = value;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, css);

// 호버 없는 터치·거친 포인터 기기(키보드를 붙인 경우 포함)에서도 포커스가 같아야 한다.
// 포커스 규칙을 호버 미디어쿼리 안에 두면 이 기기에서는 두 겹도 outline: none도 없다.
test.describe('Button strong 포커스(터치 기기)', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('호버 미디어가 꺼져 있어도 네 색의 두 겹이 보인다', async ({ page }) => {
    await mountSheet(
      page,
      `<Button>a</Button><Button variant="dark">b</Button><Button variant="danger">c</Button><Button variant="light">d</Button>`,
      '#sheet button'
    );
    expect(
      await page.evaluate(
        () => matchMedia('(hover: hover) and (pointer: fine)').matches
      )
    ).toBe(false);
    for (const [index, shadow] of [
      [1, two(PRIMARY_DARK)],
      [2, two(GRAY_DARK)],
      [3, two(ERROR_DARK)],
      [4, `${PRIMARY_DARK} 0px 0px 0px 2px inset`],
    ] as const) {
      await page.locator('#probe').focus();
      await tab(page, index);
      await expect.poll(async () => (await focused(page)).shadow).toBe(shadow);
      expect((await focused(page)).outline).toBe('none');
    }
  });
});

test.describe('Button customColor 포커스', () => {
  test('채운 색은 소비자 색의 짙은 단계 + 흰 겹이고 primary[900]가 아니다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<Button customColor={{ bg: '#8b5cf6', text: '#ffffff' }}>a</Button>`,
      '#sheet button'
    );
    const edge = await resolveColor(
      page,
      'color-mix(in srgb, #8b5cf6 50%, #212121)'
    );
    await tab(page, 1);
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toBe(`${edge} 0px 0px 0px 2px inset, ${WHITE} 0px 0px 0px 4px inset`);
    expect(edge).not.toBe(PRIMARY_DARK);
    expect((await focused(page)).outline).toBe('none');
  });

  test('테두리형(light)은 테두리와 안쪽 2px가 소비자 색의 짙은 단계다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<Button variant="light" customColor={{ bg: '#22c55e', text: '#ffffff' }}>a</Button>`,
      '#sheet button'
    );
    const edge = await resolveColor(
      page,
      'color-mix(in srgb, #22c55e 50%, #212121)'
    );
    await tab(page, 1);
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toBe(`${edge} 0px 0px 0px 2px inset`);
    expect((await focused(page)).border).toBe(edge);
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

// ② 테두리가 있는 표면(Button weak, Card, Avatar). 테두리가 원래 없는 면은 그 자리에 가장자리 안쪽 2px가 생긴다.
// weak 면은 primary.main이 눌림 면과 3:1이 안 돼(2.08~2.63) 짙은 단계(primary[900], danger는 error[900])를 쓴다.
const weakSheet = `<Button buttonStyle="weak">a</Button><Button buttonStyle="weak" variant="dark">b</Button><Button buttonStyle="weak" variant="danger">c</Button><Button buttonStyle="weak" variant="light">d</Button>`;
const WEAK_EDGES = [
  [1, 'primary', PRIMARY_DARK],
  [2, 'dark', PRIMARY_DARK],
  [3, 'danger', ERROR_DARK],
  [4, 'light', PRIMARY_DARK],
] as const;
const one = (color: string, width = 2) =>
  `${color} 0px 0px 0px ${width}px inset`;

test.describe('Button weak 포커스', () => {
  test.beforeEach(async ({ page }) => {
    await mountSheet(page, weakSheet, '#sheet button');
  });

  for (const [index, name, edge] of WEAK_EDGES) {
    test(`${name}: 가장자리 안쪽 2px 한 겹이고 크기가 그대로다`, async ({
      page,
    }) => {
      const before = await page
        .locator('#sheet button')
        .nth(index - 1)
        .boundingBox();
      await tab(page, index);
      await expect
        .poll(async () => (await focused(page)).shadow)
        .toBe(one(edge));
      const after = await focused(page);
      expect(after.outline).toBe('none');
      expect([after.w, after.h]).toEqual([before?.width, before?.height]);
    });
  }

  test('호버 중에도 보이고 마우스 클릭으로는 생기지 않는다', async ({
    page,
  }) => {
    await tab(page, 1);
    await page.locator('#sheet button').first().hover();
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toBe(one(PRIMARY_DARK));
    await page.locator('#probe').focus();
    await page.locator('#sheet button').nth(1).click();
    await page.mouse.move(2, 2);
    await expect.poll(async () => (await focused(page)).shadow).toBe('none');
  });
});

test.describe('Button weak 포커스(터치 기기)', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('호버 미디어가 꺼져 있어도 네 색의 테두리가 보인다', async ({
    page,
  }) => {
    await mountSheet(page, weakSheet, '#sheet button');
    expect(
      await page.evaluate(
        () => matchMedia('(hover: hover) and (pointer: fine)').matches
      )
    ).toBe(false);
    for (const [index, , edge] of WEAK_EDGES) {
      await page.locator('#probe').focus();
      await tab(page, index);
      await expect
        .poll(async () => (await focused(page)).shadow)
        .toBe(one(edge));
      expect((await focused(page)).outline).toBe('none');
    }
  });
});

test.describe('Button weak + customColor 포커스', () => {
  test('소비자 색의 두 겹이 weak 테두리를 이긴다', async ({ page }) => {
    await mountSheet(
      page,
      `<Button buttonStyle="weak" customColor={{ bg: '#8b5cf6', text: '#ffffff' }}>a</Button>`,
      '#sheet button'
    );
    const edge = await resolveColor(
      page,
      'color-mix(in srgb, #8b5cf6 50%, #212121)'
    );
    await tab(page, 1);
    await expect
      .poll(async () => (await focused(page)).shadow)
      .toBe(`${edge} 0px 0px 0px 2px inset, ${WHITE} 0px 0px 0px 4px inset`);
  });
});

/** 포커스를 받은 요소의 가상 요소(::after 등) 그림자와 자기 테두리 */
const focusedPseudo = (page: Page, pseudo: '::before' | '::after') =>
  page.evaluate((which) => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return {
      outline: style.outlineStyle,
      rootShadow: style.boxShadow,
      border: style.borderTopColor,
      borderWidth: style.borderTopWidth,
      shadow: getComputedStyle(el, which).boxShadow,
      pointerEvents: getComputedStyle(el, which).pointerEvents,
    };
  }, pseudo);

test.describe('Card 누를 수 있는 변형 포커스', () => {
  test('세 변형 모두 안쪽 primary 테두리이고 outlined는 1px 테두리 + 1px로 합쳐 2px다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<Card variant="outlined" onClick={()=>{}}>o</Card><Card variant="elevated" onClick={()=>{}}>e</Card><Card variant="filled" onClick={()=>{}}>f</Card>`,
      '#sheet button'
    );
    const before = await page.locator('#sheet button').first().boundingBox();
    // outlined: 테두리가 primary로 바뀌고 안쪽 1px를 더한다
    await tab(page, 1);
    await expect
      .poll(async () => (await focusedPseudo(page, '::after')).shadow)
      .toBe(one(PRIMARY, 1));
    const outlined = await focusedPseudo(page, '::after');
    expect(outlined.outline).toBe('none');
    expect(outlined.border).toBe(PRIMARY);
    expect(outlined.borderWidth).toBe('1px');
    expect(outlined.pointerEvents).toBe('none');
    const after = await page.locator('#sheet button').first().boundingBox();
    expect([after?.width, after?.height]).toEqual([
      before?.width,
      before?.height,
    ]);
    // elevated: 테두리가 없어 안쪽 2px가 새로 생기고 평소 그림자는 그대로 남는다
    await tab(page, 1);
    await expect
      .poll(async () => (await focusedPseudo(page, '::after')).shadow)
      .toBe(one(PRIMARY));
    const elevated = await focusedPseudo(page, '::after');
    expect(elevated.rootShadow).toContain('rgba');
    expect(elevated.rootShadow).not.toContain('inset');
    expect(elevated.outline).toBe('none');
    // filled
    await tab(page, 1);
    await expect
      .poll(async () => (await focusedPseudo(page, '::after')).shadow)
      .toBe(one(PRIMARY));
  });

  test('마우스 클릭으로는 생기지 않는다', async ({ page }) => {
    await mountSheet(
      page,
      `<Card variant="outlined" onClick={()=>{}}>o</Card>`,
      '#sheet button'
    );
    await page.locator('#sheet button').click();
    await page.mouse.move(2, 2);
    expect((await focusedPseudo(page, '::after')).shadow).toBe('none');
  });
});

test.describe('Card 포커스(터치 기기)', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('호버 미디어가 꺼져 있어도 안쪽 테두리가 보인다', async ({ page }) => {
    await mountSheet(
      page,
      `<Card variant="filled" hoverLift onClick={()=>{}}>f</Card>`,
      '#sheet button'
    );
    await tab(page, 1);
    await expect
      .poll(async () => (await focusedPseudo(page, '::after')).shadow)
      .toBe(one(PRIMARY));
    expect((await focusedPseudo(page, '::after')).outline).toBe('none');
  });
});

test.describe('Avatar 누를 수 있을 때 포커스', () => {
  test('테두리가 없는 면에 안쪽 primary 2px가 ::before로 생기고 마우스로는 없다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<Avatar alt="Kim Lee" onClick={()=>{}} status="online" /><Avatar alt="Park" href="#a" variant="rounded" />`,
      '#sheet button'
    );
    const before = await page.locator('#sheet button').boundingBox();
    await tab(page, 1);
    await expect
      .poll(async () => (await focusedPseudo(page, '::before')).shadow)
      .toBe(one(PRIMARY));
    const state = await focusedPseudo(page, '::before');
    expect(state.outline).toBe('none');
    expect(state.pointerEvents).toBe('none');
    const after = await page.locator('#sheet button').boundingBox();
    expect([after?.width, after?.height]).toEqual([
      before?.width,
      before?.height,
    ]);
    // 링크 아바타도 같다
    await tab(page, 1);
    await expect
      .poll(async () => (await focusedPseudo(page, '::before')).shadow)
      .toBe(one(PRIMARY));
    await page.locator('#probe').focus();
    await page.locator('#sheet button').click();
    await page.mouse.move(2, 2);
    expect((await focusedPseudo(page, '::before')).shadow).toBe('none');
  });

  test('AvatarGroup에서 포커스된 아바타가 겹친 뒤 형제 위로 올라와 테두리가 가려지지 않는다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<AvatarGroup><Avatar alt="Kim Lee" onClick={()=>{}} /><Avatar alt="Park" onClick={()=>{}} /><Avatar alt="Choi" onClick={()=>{}} /></AvatarGroup>`,
      '#sheet button'
    );
    await tab(page, 1);
    await expect
      .poll(async () => (await focusedPseudo(page, '::before')).shadow)
      .toBe(one(PRIMARY));
    // 포커스된 아바타의 오른쪽 가장자리 안쪽 점이 그 아바타 자신(또는 그 가상 요소)에 닿는다
    const top = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.right - 1, r.top + r.height / 2);
      return hit === el || el.contains(hit);
    });
    expect(top).toBe(true);
  });
});
