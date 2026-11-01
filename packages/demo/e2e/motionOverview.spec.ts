import { expect, test, type Page } from '@playwright/test';

// 시각 글자 중 가장 투명한 값. 정지 상태는 늘 1이다
const minGlyphOpacity = (page: Page) =>
  page
    .locator('[data-stage-mini] [data-hangul-glyph]')
    .evaluateAll((els) =>
      Math.min(...els.map((el) => Number(getComputedStyle(el).opacity)))
    );

// 보이는 오린 조각 수. 정지 상태와 재생이 끝난 뒤에는 0이다
const shownPieces = (page: Page) =>
  page
    .locator('[data-stage-mini] [data-hangul-jamo]')
    .evaluateAll(
      (els) =>
        els.filter((el) => getComputedStyle(el).display !== 'none').length
    );

const nav = (page: Page) => page.getByRole('navigation', { name: '사이트' });

test.describe('헤더 내비 모션 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('모션 링크로 /motion에 가고 현재 표시가 붙는다', async ({ page }) => {
    await page.goto('/');
    await nav(page).getByRole('link', { name: '모션' }).click();
    await expect(page).toHaveURL(/\/motion$/);
    await expect(nav(page).getByRole('link', { name: '모션' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(
      nav(page).getByRole('link', { name: '컴포넌트' })
    ).not.toHaveAttribute('aria-current', 'page');
  });

  test('모션 상세에서도 모션이 현재다', async ({ page }) => {
    await page.goto('/motion/hangul-assemble');
    await expect(nav(page).getByRole('link', { name: '모션' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('컴포넌트 쪽에서는 컴포넌트가 현재다', async ({ page }) => {
    await page.goto('/components/button');
    await expect(
      nav(page).getByRole('link', { name: '컴포넌트' })
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      nav(page).getByRole('link', { name: '모션' })
    ).not.toHaveAttribute('aria-current', 'page');
  });

  test('사이드바 시작 묶음의 전체 모션이 /motion으로 간다', async ({
    page,
  }) => {
    await page.goto('/components/button');
    const link = page
      .getByRole('navigation', { name: '문서' })
      .getByRole('link', { name: '전체 모션' });
    await link.click();
    await expect(page).toHaveURL(/\/motion$/);
    await expect(link).toHaveAttribute('aria-current', 'page');
  });
});

/** 카드를 순서가 아니라 안의 미니 이름표(data-stage-mini)로 고른다. 모션이 늘어도 번호가 밀리지 않는다 */
const cardOf = (page: Page, name: string) =>
  page.locator('main section > div > div').filter({
    has: page.locator(`[data-stage-mini="${name} 미리보기"]`),
  });

test.describe('모션 전체 보기', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('개수와 분류 절과 한글 조립 카드가 있고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    await expect(
      page.getByRole('heading', { level: 1, name: '모션 11개' })
    ).toBeVisible();
    const sections = page.locator('main section');
    await expect(sections).toHaveCount(4);
    await expect(page.locator('main section > div > div')).toHaveCount(11);
    for (const name of [/텍스트 애니메이션/, /컴포넌트/, /마이크로 인터랙션/])
      await expect(
        sections.getByRole('heading', { level: 2, name })
      ).toBeVisible();
    // 항목이 없는 '애니메이션' 분류는 절이 없다. '텍스트 애니메이션'의 부분 문자열이라 이름 전체로 맞춘다
    await expect(
      sections.getByRole('heading', {
        level: 2,
        name: '애니메이션',
        exact: true,
      })
    ).toHaveCount(0);
    await expect(
      sections.getByRole('heading', { level: 2, name: '배경', exact: true })
    ).toBeVisible();

    const card = page.locator('main section > div > div').first();
    await expect(
      card.getByText('HangulAssemble', { exact: true })
    ).toBeVisible();
    await expect(card.getByText('첫 화면 소개 문장, 섹션 제목')).toBeVisible();
    await card.getByRole('link', { name: '한글 조립' }).click();
    await expect(page).toHaveURL(/\/motion\/hangul-assemble$/);
  });

  test('빛 물줄기 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = cardOf(page, 'LuminousFlow');
    await expect(card.getByText('LuminousFlow', { exact: true })).toBeVisible();
    await expect(card.getByText('첫 화면 배경, 어두운 섹션')).toBeVisible();
    await card.getByRole('link', { name: '빛 물줄기' }).click();
    await expect(page).toHaveURL(/\/motion\/luminous-flow$/);
  });

  test('물방울 검색창 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = cardOf(page, 'GooeySearch');
    await expect(card.getByText('GooeySearch', { exact: true })).toBeVisible();
    await expect(card.getByText('헤더 검색, 도구 막대')).toBeVisible();
    // 바깥 영역 표지는 상세 무대용이다. 카드 미니에는 글자를 그리지 않는다
    await expect(card.getByText('바깥 영역')).toHaveCount(0);
    await card.getByRole('link', { name: '물방울 검색창' }).click();
    await expect(page).toHaveURL(/\/motion\/gooey-search$/);
  });

  test('분류 칩을 누르면 그 분류 절만 보이고 다시 누르면 전체로 돌아온다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const filters = page.getByRole('group', { name: '분류로 보기' });
    const chip = filters.getByRole('button', { name: '컴포넌트', exact: true });
    const sections = page.locator('main section');
    await expect(sections).toHaveCount(4);
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(sections).toHaveCount(1);
    await expect(sections).toHaveAccessibleName(/컴포넌트/);
    await expect(
      sections.getByText('GooeySearch', { exact: true })
    ).toBeVisible();
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await expect(sections).toHaveCount(4);
  });

  test('마이크로 인터랙션 칩이 있고 누르면 복사됨 절만 보인다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const filters = page.getByRole('group', { name: '분류로 보기' });
    const chip = filters.getByRole('button', {
      name: '마이크로 인터랙션',
      exact: true,
    });
    await expect(chip).toBeVisible();
    await chip.click();
    const sections = page.locator('main section');
    await expect(sections).toHaveCount(1);
    await expect(sections).toHaveAccessibleName(/마이크로 인터랙션/);
    await expect(
      sections.getByText('CopyButton', { exact: true })
    ).toBeVisible();
  });

  test('복사됨 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = cardOf(page, 'CopyButton');
    await expect(card.getByText('CopyButton', { exact: true })).toBeVisible();
    await expect(card.getByText('코드 블록, 공유 링크')).toBeVisible();
    await card.getByRole('link', { name: '복사됨' }).click();
    await expect(page).toHaveURL(/\/motion\/copy-button$/);
  });

  test('좋아요 터짐 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = cardOf(page, 'BurstToggle');
    await expect(card.getByText('BurstToggle', { exact: true })).toBeVisible();
    await expect(card.getByText('좋아요, 저장, 즐겨찾기')).toBeVisible();
    await card.getByRole('link', { name: '좋아요 터짐' }).click();
    await expect(page).toHaveURL(/\/motion\/burst-toggle$/);
  });

  test('꾹 눌러 확정 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = cardOf(page, 'HoldButton');
    await expect(card.getByText('HoldButton', { exact: true })).toBeVisible();
    await expect(card.getByText('삭제, 결제, 초기화')).toBeVisible();
    await card.getByRole('link', { name: '꾹 눌러 확정' }).click();
    await expect(page).toHaveURL(/\/motion\/hold-button$/);
  });

  test('출렁이는 게이지 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = cardOf(page, 'SloshGauge');
    await expect(card.getByText('SloshGauge', { exact: true })).toBeVisible();
    await expect(card.getByText('저장 공간, 할당량, 진행률')).toBeVisible();
    await card.getByRole('link', { name: '출렁이는 게이지' }).click();
    await expect(page).toHaveURL(/\/motion\/slosh-gauge$/);
  });

  test('인증번호 슬롯 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = cardOf(page, 'CodeSlots');
    await expect(card.getByText('CodeSlots', { exact: true })).toBeVisible();
    await expect(card.getByText('인증번호, PIN 입력')).toBeVisible();
    await card.getByRole('link', { name: '인증번호 슬롯' }).click();
    await expect(page).toHaveURL(/\/motion\/code-slots$/);
  });

  test('부채꼴 메뉴 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = cardOf(page, 'FanMenu');
    await expect(card.getByText('FanMenu', { exact: true })).toBeVisible();
    await expect(card.getByText('빠른 작업, 공유 메뉴')).toBeVisible();
    await card.getByRole('link', { name: '부채꼴 메뉴' }).click();
    await expect(page).toHaveURL(/\/motion\/fan-menu$/);
  });

  test('날개 전송 카드가 효과 이름과 쓰는 곳을 보이고 누르면 상세로 간다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const card = cardOf(page, 'WingButton');
    await expect(card.getByText('WingButton', { exact: true })).toBeVisible();
    await expect(card.getByText('메일 보내기, 제출, 전송')).toBeVisible();
    await card.getByRole('link', { name: '날개 전송' }).click();
    await expect(page).toHaveURL(/\/motion\/wing-button$/);
  });

  test('움직임 멈춤을 켜면 완성 글자가 서고 끄면 다시 재생한다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    // 재생 시작 직후라면 마지막 글자 칸이 아직 투명하다. 멈춤이면 처음부터 끝까지 1이다
    expect(await minGlyphOpacity(page)).toBe(1);
    await page.waitForTimeout(300);
    expect(await minGlyphOpacity(page)).toBe(1);
    // 오린 조각은 멈춤 구간 내내 걷혀 있다(완성 글자와 겹쳐 보이지 않는다)
    expect(await shownPieces(page)).toBe(0);

    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => minGlyphOpacity(page)).toBeLessThan(1);
    await expect.poll(() => minGlyphOpacity(page)).toBe(1);
  });
});

// 물방울 검색창 미니: 열림 표시. 멈추면 열린 대표 장면으로 선다
const gooeyOpen = (page: Page) =>
  page
    .locator('[data-stage-mini] [data-testid="gooey-search"]')
    .getAttribute('data-open');

test.describe('모션 전체 보기 물방울 검색창 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 열고 닫기를 되풀이하고 움직임 멈춤이면 열린 채 선다', async ({
    page,
  }) => {
    await page.goto('/motion');
    // 미니는 절반 이상 보일 때만 돈다. 가장자리에 걸치지 않게 가운데로 가져온다
    const centre = () =>
      page
        .locator('[data-stage-mini] [data-testid="gooey-search"]')
        .evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await centre();
    await expect
      .poll(() => gooeyOpen(page), { timeout: 15_000, intervals: [100] })
      .toBe('true');
    await expect
      .poll(() => gooeyOpen(page), { timeout: 15_000, intervals: [100] })
      .toBe('false');

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    // 화면 밖이어서 서 있는 것과 구분하려고 미니를 화면 안에 두고 잰다
    await centre();
    for (let i = 0; i < 60; i++) {
      expect(await gooeyOpen(page)).toBe('true');
      await page.waitForTimeout(100);
    }
    await pause.click();
    // 단추를 누르러 위로 올라갔으니 다시 가운데로 가져와야 미니가 돈다
    await centre();
    await expect
      .poll(() => gooeyOpen(page), { timeout: 15_000, intervals: [100] })
      .toBe('false');
  });
});

// 복사됨 미니: 보이지 않는 live 영역이 결과를 읽는다
const copyResult = (page: Page) =>
  page.locator('[data-stage-mini="CopyButton 미리보기"] [role="status"]');

test.describe('모션 전체 보기 복사됨 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 눌러 복사됨을 보이고 움직임 멈춤이면 서 있다', async ({
    page,
  }) => {
    await page.goto('/motion');
    // 미니는 절반 이상 보일 때만 돈다. 가장자리에 걸치지 않게 가운데로 가져온다
    const centre = () =>
      copyResult(page).evaluate((el) =>
        el.closest('[data-stage-mini]')?.scrollIntoView({ block: 'center' })
      );
    await centre();
    await expect(copyResult(page)).toHaveText('복사됨', { timeout: 15_000 });
    await expect(copyResult(page)).toHaveText('', { timeout: 5_000 });

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre();
    // 대본 한 바퀴보다 길게 기다려도 누르지 않는다
    for (let i = 0; i < 50; i++) {
      await expect(copyResult(page)).toHaveText('');
      await page.waitForTimeout(100);
    }
    await pause.click();
    await centre();
    await expect(copyResult(page)).toHaveText('복사됨', { timeout: 15_000 });
  });
});

// 좋아요 터짐 미니: 대본이 눌러 켜고(aria-pressed) 다시 눌러 끈다
const likeButton = (page: Page) =>
  page.locator('[data-stage-mini="BurstToggle 미리보기"] button');

test.describe('모션 전체 보기 좋아요 터짐 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 켜고 끄며 움직임 멈춤이면 서 있다', async ({ page }) => {
    await page.goto('/motion');
    // 미니는 절반 이상 보일 때만 돈다. 가장자리에 걸치지 않게 가운데로 가져온다
    const centre = () =>
      likeButton(page).evaluate((el) =>
        el.closest('[data-stage-mini]')?.scrollIntoView({ block: 'center' })
      );
    await centre();
    await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'true', {
      timeout: 15_000,
    });
    await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'false', {
      timeout: 5_000,
    });

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre();
    // 대본 한 바퀴보다 길게 기다려도 누르지 않는다
    for (let i = 0; i < 50; i++) {
      await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'false');
      await page.waitForTimeout(100);
    }
    await pause.click();
    await centre();
    await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'true', {
      timeout: 15_000,
    });
  });
});

// 꾹 눌러 확정 미니: 대본이 길게 눌러 채워 실행하고(data-state가 done) 처음으로 돌아온다
const holdButton = (page: Page) =>
  page.locator('[data-stage-mini="HoldButton 미리보기"] button');

test.describe('모션 전체 보기 꾹 눌러 확정 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 채워 실행하고 움직임 멈춤이면 서 있다', async ({ page }) => {
    await page.goto('/motion');
    const centre = () =>
      holdButton(page).evaluate((el) =>
        el.closest('[data-stage-mini]')?.scrollIntoView({ block: 'center' })
      );
    await centre();
    await expect(holdButton(page)).toHaveAttribute('data-state', 'done', {
      timeout: 15_000,
    });
    await expect(holdButton(page)).toHaveAttribute('data-state', 'idle', {
      timeout: 5_000,
    });

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre();
    // 대본 한 바퀴보다 길게 기다려도 누르지 않는다
    for (let i = 0; i < 100; i++) {
      await expect(holdButton(page)).toHaveAttribute('data-state', 'idle');
      await page.waitForTimeout(100);
    }
    await pause.click();
    await centre();
    await expect(holdButton(page)).toHaveAttribute('data-state', 'done', {
      timeout: 15_000,
    });
  });
});

// 출렁이는 게이지 미니: 대본이 값 단추를 눌러 aria-valuenow를 90, 20, 60으로 바꾼다
const sloshMeter = (page: Page) =>
  page.locator('[data-stage-mini="SloshGauge 미리보기"] [role="meter"]');

test.describe('모션 전체 보기 출렁이는 게이지 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 값을 바꾸고 움직임 멈춤이면 서 있다', async ({ page }) => {
    await page.goto('/motion');
    const centre = () =>
      sloshMeter(page).evaluate((el) =>
        el.closest('[data-stage-mini]')?.scrollIntoView({ block: 'center' })
      );
    await centre();
    await expect(sloshMeter(page)).toHaveAttribute('aria-valuenow', '90', {
      timeout: 15_000,
    });
    await expect(sloshMeter(page)).toHaveAttribute('aria-valuenow', '20', {
      timeout: 8_000,
    });

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre();
    const frozen = await sloshMeter(page).getAttribute('aria-valuenow');
    // 움직임 멈춤은 물 그림도 세운다(paused 연결). 정지 장면이 그려진 뒤 수면 경로가 그대로다
    const rim = () =>
      sloshMeter(page).locator('g[clip-path] > path').nth(2).getAttribute('d');
    await page.waitForTimeout(300);
    const stillRim = await rim();
    await page.waitForTimeout(500);
    expect(await rim()).toBe(stillRim);
    // 대본 한 바퀴보다 길게 기다려도 값이 바뀌지 않는다
    for (let i = 0; i < 80; i++) {
      await expect(sloshMeter(page)).toHaveAttribute('aria-valuenow', frozen!);
      await page.waitForTimeout(100);
    }
    await pause.click();
    await centre();
    await expect.poll(rim).not.toBe(stillRim);
    await expect(sloshMeter(page)).not.toHaveAttribute(
      'aria-valuenow',
      frozen!,
      { timeout: 15_000 }
    );
  });
});

// 인증번호 슬롯 미니: 대본이 틀린 번호(111111)와 맞는 번호(123456)를 차례로 입력한다
const slotsInput = (page: Page) =>
  page.locator('[data-stage-mini="CodeSlots 미리보기"] input');

test.describe('모션 전체 보기 인증번호 슬롯 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 틀린 번호와 맞는 번호를 넣고 움직임 멈춤이면 서 있다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const centre = () =>
      slotsInput(page).evaluate((el) =>
        el.closest('[data-stage-mini]')?.scrollIntoView({ block: 'center' })
      );
    await centre();
    await expect(slotsInput(page)).toHaveAttribute('aria-invalid', 'true', {
      timeout: 15_000,
    });
    await expect(slotsInput(page)).toHaveValue('111111');
    // 비운 뒤 맞는 번호가 들어와 성공 메시지가 선다
    const mini = page.locator('[data-stage-mini="CodeSlots 미리보기"]');
    await expect(mini.getByText('확인했습니다')).toBeVisible({
      timeout: 8_000,
    });
    await expect(slotsInput(page)).toHaveValue('123456');

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre();
    const frozen = await slotsInput(page).inputValue();
    // 대본 한 바퀴보다 길게 기다려도 값이 바뀌지 않는다
    for (let i = 0; i < 80; i++) {
      await expect(slotsInput(page)).toHaveValue(frozen);
      await page.waitForTimeout(100);
    }
    await pause.click();
    await centre();
    await expect(slotsInput(page)).not.toHaveValue(frozen, {
      timeout: 15_000,
    });
  });
});

// 부채꼴 메뉴 미니: 대본이 열고 호를 훑어 아이콘이 차례로 커지게 한 뒤 접는다
const fanMini = (page: Page) =>
  page.locator('[data-stage-mini="FanMenu 미리보기"]');
const fanHub = (page: Page) => fanMini(page).locator('[aria-haspopup="menu"]');

test.describe('모션 전체 보기 부채꼴 메뉴 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 열고 호를 훑어 가리킴이 옮겨 가며 움직임 멈춤이면 서 있다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const centre = () =>
      fanMini(page).evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await centre();
    await expect(fanHub(page)).toHaveAttribute('aria-expanded', 'true', {
      timeout: 15_000,
    });
    // 훑는 동안 가리킨 아이콘이 생기고 이름표가 선다
    await expect(fanMini(page).locator('[data-hot]')).toHaveCount(1, {
      timeout: 8_000,
    });

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre();
    // 멈추기 직전에 예약된 누름이 끝나길 기다린 뒤의 자세가 그대로 서 있다
    await page.waitForTimeout(600);
    const snapshot = () =>
      fanMini(page).evaluate((el) => ({
        expanded: el
          .querySelector('[aria-haspopup="menu"]')
          ?.getAttribute('aria-expanded'),
        hot: el.querySelector('[data-hot]')?.getAttribute('aria-label') ?? '',
      }));
    const frozen = await snapshot();
    for (let i = 0; i < 40; i++) {
      expect(await snapshot()).toEqual(frozen);
      await page.waitForTimeout(100);
    }
    await pause.click();
    await centre();
    await expect
      .poll(async () => JSON.stringify(await snapshot()), { timeout: 15_000 })
      .not.toBe(JSON.stringify(frozen));
  });
});

// 날개 전송 미니: 대본이 눌러 날려 보내고 표지를 보인 뒤 새로 세운다
const wingMini = (page: Page) =>
  page.locator('[data-stage-mini="WingButton 미리보기"]');

test.describe('모션 전체 보기 날개 전송 미니 (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('대본이 눌러 로켓 단추를 날리고 움직임 멈춤이면 서 있다', async ({
    page,
  }) => {
    await page.goto('/motion');
    const centre = () =>
      wingMini(page).evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await centre();
    // 날아가는 동안 복제본 레이어가 서고, 다 날면 표지가 남는다
    await expect(wingMini(page).locator('[data-wing-layer]')).toHaveCount(1, {
      timeout: 15_000,
    });
    await expect(wingMini(page).locator('[data-wing-mark]')).toHaveCount(1);
    // 미니는 연기를 끈다(문맥 스물다섯 개가 한 화면에 뜨지 않게). 비행 중에도 연기 canvas가 없다.
    // 로켓 canvas는 비행 층 안에 있으니 거른다(안 거르면 이 단언이 비행이 끝나기를 기다리게 된다)
    await expect(
      wingMini(page).locator('canvas:not([data-wing-layer] canvas)')
    ).toHaveCount(0);

    const pause = page.getByRole('button', { name: '움직임 멈춤' });
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await centre();
    // 멈추기 직전에 시작한 비행은 끝까지 가고(일시정지는 대본만 멈춘다) 새 비행은 시작하지 않는다.
    // 시간을 재서 기다리지 않고 비행 층이 걷히는 것을 신호로 삼아, 멈춘 시점이 비행과 겹쳐도 같은 끝 자세에 선다
    await expect(wingMini(page).locator('[data-wing-layer]')).toHaveCount(0, {
      timeout: 8000,
    });
    const snapshot = () =>
      wingMini(page).evaluate((el) => ({
        layer: el.querySelectorAll('[data-wing-layer]').length,
        mark: el.querySelectorAll('[data-wing-mark]').length,
      }));
    const frozen = await snapshot();
    expect(frozen.layer).toBe(0);
    for (let i = 0; i < 30; i++) {
      expect(await snapshot()).toEqual(frozen);
      await page.waitForTimeout(100);
    }
    await pause.click();
    await centre();
    await expect
      .poll(async () => JSON.stringify(await snapshot()), { timeout: 15_000 })
      .not.toBe(JSON.stringify(frozen));
  });
});

test.describe('모션 전체 보기 (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // 낱말 묶음 span의 글자 칸 top이 모두 같으면 낱말이 두 줄로 갈리지 않았다
  const brokenWords = (page: Page, scope: string) =>
    page.locator(`${scope} [data-hangul-word]`).evaluateAll(
      (words) =>
        words.filter((w) => {
          const tops = [...w.querySelectorAll('[data-hangul-cell]')].map((c) =>
            Math.round(c.getBoundingClientRect().top)
          );
          return new Set(tops).size > 1;
        }).length
    );

  test('카드 안 한글 조립이 390px에서도 재생되고 낱말이 갈리지 않는다', async ({
    page,
  }) => {
    await page.goto('/motion');
    // 마지막 글자 칸은 시작이 늦어 한동안 투명하다
    await expect.poll(() => minGlyphOpacity(page)).toBeLessThan(1);
    expect(await brokenWords(page, '[data-stage-mini]')).toBe(0);
  });

  test('상세 무대에서도 낱말이 갈리지 않는다', async ({ page }) => {
    await page.goto('/motion/hangul-assemble');
    await expect(page.locator('[data-hangul-word]').first()).toBeVisible();
    expect(await brokenWords(page, 'main')).toBe(0);
  });
});
