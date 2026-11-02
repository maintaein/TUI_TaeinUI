import { test, expect, type Page } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * 입력류 7개(NumericSpinner·GooeySearch·Checkbox·Switch·Slider·SegmentedButtons·Chip)의
 * 키보드 포커스가 바깥 링이 아니라 컨트롤 자신의 테두리로 나오는지 실제 브라우저로 잰다
 * (사용자 결정, M7.1 T12a). jsdom은 :focus-visible과 ::after의 계산값을 주지 못한다.
 *
 * 색은 계산값 rgb다: primary.main #1976D2, 한 단계 짙은 primary[900] #0D47A1(이미 같은 색
 * 테두리인 켜짐·선택 상태가 포커스 전후로 갈리게), error.main #D32F2F.
 * 누르는 컨트롤은 :focus-visible(Tab), 글자를 넣는 입력은 :focus(마우스 클릭도 같다).
 */
const PRIMARY = 'rgb(25, 118, 210)';
const PRIMARY_DARK = 'rgb(13, 71, 161)';
const ERROR = 'rgb(211, 47, 47)';
const WHITE = 'rgb(255, 255, 255)';
const NONE = 'rgba(0, 0, 0, 0)';

/** 시트 앞에 탐침 단추를 두고 거기서 Tab을 시작한다. */
const mountSheet = async (page: Page, jsx: string, ready: string) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mountLive(
    page,
    `<div id="sheet" style={{padding:16,display:'flex',flexDirection:'column',gap:16,width:360,alignItems:'flex-start'}}>${jsx}</div>`,
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

/** 포커스를 받은 요소의 outline-style은 none이다(브라우저 기본 링도 없다). */
const focusedOutline = (page: Page) =>
  page.evaluate(
    () => getComputedStyle(document.activeElement as Element).outlineStyle
  );

test.describe('Checkbox 포커스 테두리', () => {
  test.beforeEach(async ({ page }) => {
    await mountSheet(
      page,
      `<Checkbox label="a" /><Checkbox label="b" defaultChecked /><Checkbox label="c" error /><Checkbox label="d" error defaultChecked />`,
      '#sheet input'
    );
  });

  // 입력 옆 상자의 테두리 색과 ::after 안쪽 띠
  const box = (page: Page) =>
    page.evaluate(() => {
      const el = (document.activeElement as HTMLElement)
        .nextElementSibling as HTMLElement;
      return {
        border: getComputedStyle(el).borderTopColor,
        width: getComputedStyle(el).borderTopWidth,
        ring: getComputedStyle(el, '::after').boxShadow,
      };
    });

  test('해제: 상자 테두리가 primary가 되고 바깥 링이 없다', async ({
    page,
  }) => {
    await tab(page, 1);
    // 테두리 색 전이(fast)가 끝나길 기다린다
    await expect
      .poll(() => box(page))
      .toEqual({
        border: PRIMARY,
        width: '2px',
        ring: 'none',
      });
    expect(await focusedOutline(page)).toBe('none');
  });

  test('체크: 테두리가 짙은 primary가 되고 안쪽에 흰 2px가 한 겹 더해진다', async ({
    page,
  }) => {
    await tab(page, 2);
    await expect
      .poll(() => box(page))
      .toEqual({
        border: PRIMARY_DARK,
        width: '2px',
        ring: `${WHITE} 0px 0px 0px 2px inset`,
      });
  });

  test('오류(해제·체크): 테두리는 오류 색이고 안쪽 2px(해제는 오류 색, 체크는 면과 갈리도록 흰색)가 더해진다', async ({
    page,
  }) => {
    for (const [stops, inner] of [
      [3, ERROR],
      [4, WHITE],
    ] as const) {
      await page.locator('#probe').focus();
      await tab(page, stops);
      expect(await box(page)).toEqual({
        border: ERROR,
        width: '2px',
        ring: `${inner} 0px 0px 0px 2px inset`,
      });
    }
  });
});

test.describe('Switch 포커스 테두리', () => {
  test.beforeEach(async ({ page }) => {
    await mountSheet(
      page,
      `<Switch label="a" /><Switch label="b" defaultChecked /><Switch label="c" error /><Switch label="d" error defaultChecked />`,
      '#sheet [role=switch]'
    );
  });

  // 스윕 칸(트랙의 첫 자식)의 ::after가 트랙 가장자리 테두리를 그린다
  const ring = (page: Page) =>
    page.evaluate(() => {
      const track = (document.activeElement as HTMLElement)
        .parentElement as HTMLElement;
      return {
        ring: getComputedStyle(track.firstElementChild as Element, '::after')
          .boxShadow,
        trackOutline: getComputedStyle(track).outlineStyle,
      };
    });

  test('꺼짐: 트랙 가장자리 2px가 primary다', async ({ page }) => {
    await tab(page, 1);
    expect(await ring(page)).toEqual({
      ring: `${PRIMARY} 0px 0px 0px 2px inset`,
      trackOutline: 'none',
    });
    expect(await focusedOutline(page)).toBe('none');
  });

  test('켜짐: 가장자리 짙은 primary 2px와 그 안쪽 흰 2px 두 겹이다', async ({
    page,
  }) => {
    await tab(page, 2);
    expect((await ring(page)).ring).toBe(
      `${PRIMARY_DARK} 0px 0px 0px 2px inset, ${WHITE} 0px 0px 0px 4px inset`
    );
  });

  test('오류(꺼짐·켜짐): 오류 색이 이긴다', async ({ page }) => {
    for (const [stops, inner] of [
      [3, ERROR],
      [4, WHITE],
    ] as const) {
      await page.locator('#probe').focus();
      await tab(page, stops);
      expect((await ring(page)).ring).toBe(`${inner} 0px 0px 0px 2px inset`);
    }
  });
});

test.describe('Slider 포커스 테두리', () => {
  test.beforeEach(async ({ page }) => {
    await mountSheet(
      page,
      `<Slider label="a" defaultValue={40} /><Slider label="b" variant="bar" defaultValue={40} />`,
      '#sheet input[type=range]'
    );
  });

  test('머리: 테두리가 2px에서 4px로 굵어지고 바깥 링이 없다', async ({
    page,
  }) => {
    const head = () =>
      page.evaluate(() => {
        const el = (document.activeElement as HTMLElement)
          .previousElementSibling as HTMLElement;
        const style = getComputedStyle(el);
        return { width: style.borderTopWidth, color: style.borderTopColor };
      });
    const before = await page.evaluate(() => {
      const el = document.querySelector('#sheet input[type=range]')
        ?.previousElementSibling as HTMLElement;
      return getComputedStyle(el).borderTopWidth;
    });
    expect(before).toBe('2px');
    await tab(page, 1);
    expect(await head()).toEqual({ width: '4px', color: PRIMARY });
    expect(await focusedOutline(page)).toBe('none');
  });

  test('bar: 라인 테두리가 굵어지고 짙은 primary가 된다', async ({ page }) => {
    await tab(page, 2);
    const stroke = await page.evaluate(() => {
      const path = (
        document.activeElement as HTMLElement
      ).parentElement?.querySelector('svg path') as SVGPathElement;
      const style = getComputedStyle(path);
      return { color: style.stroke, width: style.strokeWidth };
    });
    expect(stroke).toEqual({ color: PRIMARY_DARK, width: '3px' });
    expect(await focusedOutline(page)).toBe('none');
  });
});

test.describe('SegmentedButtons 포커스 테두리', () => {
  test('키보드로 들어오면 트랙 가장자리에 primary 2px가 생기고 마우스로는 없다', async ({
    page,
  }) => {
    await mountSheet(
      page,
      `<SegmentedButtons aria-label="기간" defaultValue="day" options={[{value:'day',label:'일간'},{value:'week',label:'주간'}]} />`,
      '#sheet input[type=radio]'
    );
    const ring = () =>
      page.evaluate(() => {
        const track = (document.activeElement as HTMLElement).closest('label')
          ?.parentElement as HTMLElement;
        return getComputedStyle(track, '::after').boxShadow;
      });
    await tab(page, 1);
    expect(await ring()).toBe(`${PRIMARY} 0px 0px 0px 2px inset`);
    expect(await focusedOutline(page)).toBe('none');
    await page.locator('#sheet label', { hasText: '주간' }).click();
    expect(await ring()).toBe('none');
  });
});

test.describe('Chip 포커스 테두리', () => {
  test.beforeEach(async ({ page }) => {
    await mountSheet(
      page,
      `<Chip label="a" variant="outlined" onClick={()=>{}} /><Chip label="b" color="primary" onClick={()=>{}} /><Chip label="c" variant="outlined" color="primary" selected onClick={()=>{}} /><Chip label="d" color="error" selected onClick={()=>{}} onDelete={()=>{}} /><Chip label="e" color="success" onClick={()=>{}} />`,
      '#sheet button'
    );
  });

  // 포커스를 받은 단추(또는 단추를 품은 칩)의 ::after 테두리
  const edge = (page: Page) =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return {
        ring: getComputedStyle(el, '::after').boxShadow,
        outline: getComputedStyle(el).outlineStyle,
      };
    });

  test('테두리형: 안쪽 2px가 primary다', async ({ page }) => {
    await tab(page, 1);
    expect(await edge(page)).toEqual({
      ring: `${PRIMARY} 0px 0px 0px 2px inset, ${NONE} 0px 0px 0px 4px inset`,
      outline: 'none',
    });
  });

  test('primary 채움: 짙은 primary 2px와 그 안쪽 흰 2px 두 겹이다', async ({
    page,
  }) => {
    await tab(page, 2);
    expect((await edge(page)).ring).toBe(
      `${PRIMARY_DARK} 0px 0px 0px 2px inset, ${WHITE} 0px 0px 0px 4px inset`
    );
  });

  test('success 채움: 짙은 primary 2px만으로 면과 3:1이 넘어 흰 겹이 없다', async ({
    page,
  }) => {
    await tab(page, 6);
    expect((await edge(page)).ring).toBe(
      `${PRIMARY_DARK} 0px 0px 0px 2px inset, ${NONE} 0px 0px 0px 4px inset`
    );
  });

  test('선택된 칩: 표식 고리가 있어 4px로 굵어진다', async ({ page }) => {
    await tab(page, 3);
    expect((await edge(page)).ring).toBe(
      `${PRIMARY} 0px 0px 0px 4px inset, ${NONE} 0px 0px 0px 6px inset`
    );
  });

  test('누르기 + 삭제 칩: 주 동작 단추가 같은 테두리를 칩 전체에 그린다', async ({
    page,
  }) => {
    await tab(page, 4);
    expect(await edge(page)).toEqual({
      ring: `${PRIMARY_DARK} 0px 0px 0px 2px inset, ${WHITE} 0px 0px 0px 4px inset`,
      outline: 'none',
    });
  });
});

test.describe('NumericSpinner 포커스 테두리', () => {
  test.beforeEach(async ({ page }) => {
    await mountSheet(
      page,
      `<NumericSpinner label="수량" defaultValue={5} /><NumericSpinner label="오류" defaultValue={5} error />`,
      '#sheet input'
    );
  });

  const box = (page: Page, label: string) =>
    page
      .getByLabel(label, { exact: true })
      .evaluate(
        (el) => getComputedStyle(el.parentElement as Element).borderTopColor
      );

  test('입력에 키보드로 오면 상자 테두리가 primary다(바깥 링 없음)', async ({
    page,
  }) => {
    await tab(page, 2);
    expect(await box(page, '수량')).toBe(PRIMARY);
    expect(await focusedOutline(page)).toBe('none');
  });

  test('마우스로 눌러도 같은 색이다', async ({ page }) => {
    await page.getByLabel('수량', { exact: true }).click();
    expect(await box(page, '수량')).toBe(PRIMARY);
  });

  test('오류면 포커스여도 오류 색이다(키보드·마우스)', async ({ page }) => {
    await page.getByLabel('오류', { exact: true }).click();
    expect(await box(page, '오류')).toBe(ERROR);
    await page.locator('#probe').focus();
    await tab(page, 5);
    expect(await box(page, '오류')).toBe(ERROR);
  });
});

test.describe('GooeySearch 포커스 테두리', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mountLive(
      page,
      `const [open, setOpen] = useState(false);

<div id="sheet" style={{padding:16,width:320}}><GooeySearch open={open} onOpenChange={setOpen} placeholder="검색어" /></div>`,
      '#sheet button'
    );
  });

  const state = (page: Page) =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return {
        tag: el.tagName,
        ring: style.boxShadow,
        outline: style.outlineStyle,
      };
    });

  test('닫힘: 공 안쪽에 흰 띠가 생기고 바깥 링이 없다', async ({ page }) => {
    await page.locator('#sheet button').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await state(page)).toEqual({
      tag: 'BUTTON',
      ring: `${PRIMARY} 0px 0px 0px 3px inset, ${WHITE} 0px 0px 0px 5px inset`,
      outline: 'none',
    });
  });

  test('열린 입력: 포커스(스크립트·마우스)에 primary 2px 테두리다', async ({
    page,
  }) => {
    await page.locator('#sheet button').click();
    await expect(page.locator('#sheet input')).toBeFocused();
    // box-shadow 전이(fast)가 끝나길 기다린다
    await expect
      .poll(() => state(page))
      .toEqual({
        tag: 'INPUT',
        ring: `${PRIMARY} 0px 0px 0px 2px inset`,
        outline: 'none',
      });
    await page.locator('#sheet button').focus();
    await page.locator('#sheet input').click();
    await expect
      .poll(async () => (await state(page)).ring)
      .toBe(`${PRIMARY} 0px 0px 0px 2px inset`);
  });
});
