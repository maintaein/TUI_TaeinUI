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

// ─── M7.2 T3: 면도 테두리도 없는 단추류 ─────────────────────────────────────────
// 호버와 같은 옅은 면과 가장자리 안쪽 2px다(채워진 면은 ① 두 겹). gray[50] #FAFAFA.
const GRAY_50 = 'rgb(250, 250, 250)';
const CLEAR = 'rgba(0, 0, 0, 0)';

/** 포커스를 받은 요소의 윤곽선·면·그림자·불투명도·크기 */
const look = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      outline: style.outlineStyle,
      bg: style.backgroundColor,
      shadow: style.boxShadow,
      opacity: style.opacity,
      border: style.borderTopColor,
      w: rect.width,
      h: rect.height,
      // 조상의 transform(모달이 자라는 중 등)을 타지 않는 배치 크기
      ow: el.offsetWidth,
      oh: el.offsetHeight,
    };
  });

/** 조건에 맞는 요소가 포커스를 받을 때까지 Tab을 누른다(키보드 모달리티가 유지된다). */
const tabTo = async (page: Page, selector: string, limit = 12) => {
  for (let i = 0; i < limit; i += 1) {
    await page.keyboard.press('Tab');
    if (
      await page.evaluate(
        (sel) => document.activeElement?.matches(sel) ?? false,
        selector
      )
    )
      return;
  }
  throw new Error(`Tab으로 ${selector}에 닿지 못했다`);
};

const ICON_BUTTONS = `<IconButton aria-label="g"><Plus size={18} /></IconButton><IconButton aria-label="sp" buttonStyle="strong"><Plus size={18} /></IconButton><IconButton aria-label="sd" buttonStyle="strong" variant="dark"><Plus size={18} /></IconButton><IconButton aria-label="sx" buttonStyle="strong" variant="danger"><Plus size={18} /></IconButton><IconButton aria-label="sl" buttonStyle="strong" variant="light"><Plus size={18} /></IconButton><IconButton aria-label="wp" buttonStyle="weak"><Plus size={18} /></IconButton><IconButton aria-label="wd" buttonStyle="weak" variant="dark"><Plus size={18} /></IconButton><IconButton aria-label="wx" buttonStyle="weak" variant="danger"><Plus size={18} /></IconButton><IconButton aria-label="wl" buttonStyle="weak" variant="light"><Plus size={18} /></IconButton>`;

// [이름, 면, 그림자]. ghost는 ③ 호버 면 + primary, strong은 ① 두 겹(light는 4px 틀), weak는 안쪽 한 겹.
const ICON_EXPECT = [
  ['ghost', GRAY_100, one(PRIMARY)],
  ['strong primary', null, two(PRIMARY_DARK)],
  ['strong dark', null, two(GRAY_DARK)],
  ['strong danger', null, two(ERROR_DARK)],
  ['strong light', null, one(PRIMARY_DARK)],
  ['weak primary', null, one(PRIMARY_DARK)],
  ['weak dark', null, one(PRIMARY_DARK)],
  ['weak danger', null, one(ERROR_DARK)],
  ['weak light', null, one(PRIMARY_DARK)],
] as const;

const checkIconButtons = async (page: Page) => {
  await mountSheet(page, ICON_BUTTONS, '#sheet button');
  for (const [index, [name, face, shadow]] of ICON_EXPECT.entries()) {
    const before = await page.locator('#sheet button').nth(index).boundingBox();
    await tab(page, 1);
    await expect.poll(async () => (await look(page)).shadow, name).toBe(shadow);
    const state = await look(page);
    expect(state.outline, name).toBe('none');
    // 면은 전이(fast)가 끝난 값을 읽는다
    if (face)
      await expect.poll(async () => (await look(page)).bg, name).toBe(face);
    // light는 테두리와 안쪽 2px가 모두 짙은 primary다(4px 틀)
    if (name === 'strong light') expect(state.border, name).toBe(PRIMARY_DARK);
    expect([state.w, state.h], name).toEqual([before?.width, before?.height]);
  }
};

test.describe('IconButton 포커스', () => {
  test('ghost는 호버 면 + 안쪽 primary 2px, 채운 4색은 두 겹, 옅은 4색은 안쪽 한 겹이고 크기가 그대로다', async ({
    page,
  }) => {
    await checkIconButtons(page);
  });

  test('마우스 클릭으로는 생기지 않는다', async ({ page }) => {
    await mountSheet(page, ICON_BUTTONS, '#sheet button');
    await page.locator('#sheet button').first().click();
    await page.mouse.move(2, 2);
    expect((await look(page)).shadow).toBe('none');
  });
});

test.describe('IconButton 포커스(터치 기기)', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('호버 미디어가 꺼져 있어도 같게 보인다', async ({ page }) => {
    expect(
      await page.evaluate(
        () => matchMedia('(hover: hover) and (pointer: fine)').matches
      )
    ).toBe(false);
    await checkIconButtons(page);
  });
});

test.describe('오버레이 닫기 단추 포커스', () => {
  // 오버레이는 body로 포털되고 시트는 떠 있는 루프로 늘 움직여 scrollIntoView가 안정되길 기다리다 멈춘다.
  // 그래서 mountLive 대신 편집기에 채우고 닫기 단추가 보일 때까지만 기다린다. 면은 전이가 끝난 값을 읽는다.
  const closeOf = (jsx: string, bg: string) => async (page: Page) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/e2e/live');
    await page.locator('main textarea').first().fill(jsx);
    await page.locator('button[aria-label="닫기"]').waitFor();
    await page.evaluate(() => {
      const probe = document.createElement('button');
      document.body.prepend(probe);
      probe.focus();
    });
    await tabTo(page, 'button[aria-label="닫기"]');
    await expect.poll(async () => (await look(page)).shadow).toContain('inset');
    await expect.poll(async () => (await look(page)).bg).toBe(bg);
    return look(page);
  };

  test('Modal: 호버와 같은 gray[100] 면에 안쪽 primary 2px', async ({
    page,
  }) => {
    const state = await closeOf(
      `<Modal open onClose={()=>{}} title="제목" showClose>본문</Modal>`,
      GRAY_100
    )(page);
    expect(state.outline).toBe('none');
    expect(state.shadow).toBe(one(PRIMARY));
    expect([state.ow, state.oh]).toEqual([44, 44]);
  });

  test('BottomSheet: 안쪽 primary 2px이고 바깥 링이 없다', async ({ page }) => {
    const state = await closeOf(
      `<BottomSheet open onClose={()=>{}} title="제목" showClose>본문</BottomSheet>`,
      GRAY_50
    )(page);
    expect(state.outline).toBe('none');
    expect(state.shadow).toBe(one(PRIMARY));
  });

  test('SideSheet: 안쪽 primary 2px이고 바깥 링이 없다', async ({ page }) => {
    const state = await closeOf(
      `<SideSheet open onClose={()=>{}} title="제목" showClose>본문</SideSheet>`,
      GRAY_50
    )(page);
    expect(state.outline).toBe('none');
    expect(state.shadow).toBe(one(PRIMARY));
  });
});

test.describe('Snackbar 닫기 단추 포커스', () => {
  for (const severity of ['success', 'error', 'warning', 'info']) {
    test(`${severity}: 바탕 위 흰(글자색) 안쪽 2px와 옅은 면이고 불투명하다`, async ({
      page,
    }) => {
      await mountSheet(
        page,
        `<Snackbar open message="알림" severity="${severity}" autoHideDuration={null} onClose={()=>{}} />`,
        'button[aria-label="닫기"]'
      );
      await tabTo(page, 'button[aria-label="닫기"]');
      await expect
        .poll(async () => (await look(page)).shadow)
        .toBe(`${WHITE} 0px 0px 0px 2px inset`);
      expect((await look(page)).outline).toBe('none');
      // 면과 불투명도는 전이가 끝난 값을 읽는다
      await expect.poll(async () => (await look(page)).bg).not.toBe(CLEAR);
      await expect.poll(async () => (await look(page)).opacity).toBe('1');
    });
  }
});

test.describe('HeaderBar 포커스', () => {
  const items = `[{label:'하나',href:'#a'},{label:'둘',href:'#b'}]`;

  test('text: 호버와 같은 옅은 바탕에 안쪽 primary 2px', async ({ page }) => {
    await mountSheet(
      page,
      `<HeaderBar title="t" navStyle="text" items={${items}} />`,
      'header a'
    );
    await tabTo(page, 'nav a');
    await expect.poll(async () => (await look(page)).shadow).toBe(one(PRIMARY));
    const state = await look(page);
    expect(state.outline).toBe('none');
    await expect.poll(async () => (await look(page)).bg).not.toBe(CLEAR);
  });

  test('pill: 차오른 primary 원 위에도 안쪽 짙은 2px와 흰 2px가 ::after로 보인다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<HeaderBar title="t" navStyle="pill" items={${items}} />`,
      'header a'
    );
    await tabTo(page, 'header a');
    await expect
      .poll(async () => (await focusedPseudo(page, '::after')).shadow)
      .toBe(two(PRIMARY_DARK));
    const state = await focusedPseudo(page, '::after');
    expect(state.outline).toBe('none');
    expect(state.pointerEvents).toBe('none');
    // 마우스로는 없다
    await page.locator('#probe').focus();
    await page.locator('header a').first().click();
    await page.mouse.move(2, 2);
    expect((await focusedPseudo(page, '::after')).shadow).toBe('none');
  });

  test('icon: 눈에 보이는 알약에 호버와 같은 바탕과 안쪽 primary 2px, 예약 박스는 윤곽선이 없다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<HeaderBar title="t" navStyle="icon" items={[{label:'홈',href:'#a',icon:<House size={18} />},{label:'검색',href:'#b',icon:<Search size={18} />}]} />`,
      'header a'
    );
    await tabTo(page, 'header a');
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            getComputedStyle(
              (document.activeElement as HTMLElement).firstElementChild!
            ).boxShadow
        )
      )
      .toBe(one(PRIMARY));
    expect((await look(page)).outline).toBe('none');
  });

  test('햄버거와 cards 카드 링크도 안쪽 primary 2px다', async ({ page }) => {
    await mountSheet(
      page,
      `<HeaderBar title="t" navStyle="cards" items={[{label:'제품',links:[{label:'버튼',href:'#a'},{label:'칩',href:'#b'}]}]} />`,
      'header button[aria-expanded]'
    );
    await tabTo(page, 'button[aria-expanded]');
    await expect.poll(async () => (await look(page)).shadow).toBe(one(PRIMARY));
    const hamburger = await look(page);
    expect(hamburger.outline).toBe('none');
    await expect.poll(async () => (await look(page)).bg).toBe(GRAY_100);
    await page.keyboard.press('Enter');
    await tabTo(page, 'a');
    await expect.poll(async () => (await look(page)).shadow).toBe(one(PRIMARY));
    const link = await look(page);
    expect(link.outline).toBe('none');
    await expect.poll(async () => (await look(page)).bg).not.toBe(CLEAR);
  });
});

test.describe('BoardRow 포커스', () => {
  test('호버와 같은 gray[50] 면에 행 가장자리 안쪽 primary 2px이고 행 모양을 따른다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<BoardRow title="행" variant="outlined">내용</BoardRow>`,
      '#sheet button'
    );
    await tab(page, 1);
    await expect.poll(async () => (await look(page)).shadow).toBe(one(PRIMARY));
    expect((await look(page)).outline).toBe('none');
    await expect.poll(async () => (await look(page)).bg).toBe(GRAY_50);
    // 행의 둥근 모서리를 따른다(그렇지 않으면 모서리에서 테두리가 잘린다): 가장 가까운 둥근 조상과 같은 반경
    const radii = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      let row = el.parentElement;
      while (row && getComputedStyle(row).borderTopLeftRadius === '0px')
        row = row.parentElement;
      return [
        getComputedStyle(el).borderTopLeftRadius,
        row ? getComputedStyle(row).borderTopLeftRadius : '',
      ];
    });
    expect(radii[0]).not.toBe('0px');
    expect(radii[0]).toBe(radii[1]);
  });
});

test.describe('FanMenu 항목 포커스', () => {
  test('키보드로 닿은 항목은 채워진 원이라 안쪽 짙은 2px와 흰 2px에 평소 그림자가 이어진다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<FanMenu label="메뉴" items={[{icon:<b>1</b>,label:'하나',onSelect:()=>{}},{icon:<b>2</b>,label:'둘',onSelect:()=>{}}]} />`,
      '#sheet [aria-haspopup=menu]'
    );
    await tab(page, 1);
    await page.keyboard.press('Enter');
    await expect
      .poll(async () =>
        page.evaluate(() =>
          document.activeElement?.getAttribute('role') === 'menuitem'
            ? getComputedStyle(document.activeElement).boxShadow
            : ''
        )
      )
      .toContain(two(PRIMARY_DARK));
    const state = await look(page);
    expect(state.outline).toBe('none');
    expect(state.shadow).toContain('rgba');
  });
});

test.describe('NumericSpinner 증감 단추 포커스', () => {
  test('호버와 같은 gray[100] 면에 안쪽 primary 2px이고 크기가 그대로다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<NumericSpinner label="수량" defaultValue={3} />`,
      '#sheet button'
    );
    const before = await page.locator('#sheet button').first().boundingBox();
    await tab(page, 1);
    await expect.poll(async () => (await look(page)).shadow).toBe(one(PRIMARY));
    const first = await look(page);
    expect(first.outline).toBe('none');
    await expect.poll(async () => (await look(page)).bg).toBe(GRAY_100);
    expect([first.w, first.h]).toEqual([before?.width, before?.height]);
    await tab(page, 2);
    await expect.poll(async () => (await look(page)).shadow).toBe(one(PRIMARY));
    // 마우스로 누르면 생기지 않는다
    await page.locator('#probe').focus();
    await page.locator('#sheet button').first().click();
    await page.mouse.move(2, 2);
    await expect.poll(async () => (await look(page)).shadow).toBe('none');
  });
});

test.describe('Chip 삭제 단추 포커스', () => {
  const chips = `<Chip label="a" onDelete={()=>{}} /><Chip label="b" variant="outlined" onDelete={()=>{}} /><Chip label="c" color="primary" onDelete={()=>{}} /><Chip label="d" color="warning" onDelete={()=>{}} />`;

  test('칠하지 않은 칩은 primary, 색이 칠해진 칩은 칩 글자색 안쪽 2px와 글자색을 섞은 면이다', async ({
    page,
  }) => {
    await mountSheet(page, chips, '#sheet button');
    // [기대 테두리]: default·outlined는 primary, filled primary는 흰색, filled warning은 gray[900]
    for (const edge of [PRIMARY, PRIMARY, WHITE, GRAY_DARK]) {
      await tabTo(page, 'button[aria-label$="삭제"]');
      await expect.poll(async () => (await look(page)).shadow).toBe(one(edge));
      const state = await look(page);
      expect(state.outline).toBe('none');
      expect([state.w, state.h]).toEqual([16, 16]);
      await expect.poll(async () => (await look(page)).bg).not.toBe(CLEAR);
      await expect.poll(async () => (await look(page)).opacity).toBe('1');
    }
  });

  test('마우스 클릭으로는 생기지 않는다', async ({ page }) => {
    await mountSheet(page, chips, '#sheet button');
    await page.locator('button[aria-label$="삭제"]').first().click();
    await page.mouse.move(2, 2);
    expect((await look(page)).shadow).not.toContain('inset');
  });
});
