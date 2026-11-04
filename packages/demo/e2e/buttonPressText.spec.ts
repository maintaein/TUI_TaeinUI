import { test, expect, type Locator, type Page } from '@playwright/test';
import { mountLive } from './livePreview';

/**
 * Button의 합성 레이어가 데모의 모든 변형 단추에서 계산된 값으로 유지되는지 본다(M5 task-3 라운드 6).
 *
 * Button은 base에 `will-change: transform`을 영구로 둬 레이어를 처음부터 유지한다
 * (Button.css.ts 주석). 레이어가 호버나 누르는 동안만 생기거나 전이 끝에 사라지면 글자가 세로로
 * 약 1px 튄다. core 단위 시험('Button 생성 CSS: 합성 레이어')은 생성된 규칙만 본다. 여기서는
 * 실제 빌드물에서 소비자 쪽 클래스, customColor 인라인 변수, 변형별 규칙이 cascade로
 * will-change를 덮는 회귀를 잡는다. 단추마다 휴지(마우스 밖), 호버, 누름 중, 해제 뒤 전이 끝에서 본다.
 * 축소 모드는 이동이 없어 레이어가 필요 없으므로 auto여야 하고 누른 transform은 none이다.
 *
 * 튐 자체를 screencast 픽셀로 재던 시험은 부하에서 결정적이지 않아 지웠다(git 기록 3e905cd~b1beb87).
 */

/**
 * 옛 /components/button 문서 페이지의 예제 섹션 여섯 개를 같은 코드로 한 화면에 모은 구성.
 * 섹션마다 h3 제목과 버튼을 한 부모에 둔다(옛 페이지 구조와 같다).
 */
const row = `display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center'`;
const section = (title: string, body: string) =>
  `<div><h3>${title}</h3>${body}</div>`;
const CODE = `<div>${[
  section(
    'Variants (Fill)',
    `<div style={{ ${row} }}>
  <Button variant="primary">Primary</Button>
  <Button variant="dark">Dark</Button>
  <Button variant="danger">Danger</Button>
  <Button variant="light">Light</Button>
</div>`
  ),
  section(
    'Variants (Weak)',
    `<div style={{ ${row} }}>
  <Button variant="primary" buttonStyle="weak">Primary</Button>
  <Button variant="dark" buttonStyle="weak">Dark</Button>
  <Button variant="danger" buttonStyle="weak">Danger</Button>
  <Button variant="light" buttonStyle="weak">Light</Button>
</div>`
  ),
  section(
    'Sizes',
    `<div style={{ ${row} }}>
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
  <Button size="xl">X-Large</Button>
</div>`
  ),
  section(
    'With Icons',
    `<div style={{ ${row} }}>
  <Button leftIcon={<Plus size={16} />} variant="primary">추가</Button>
  <Button rightIcon={<ArrowRight size={16} />} variant="dark">다음</Button>
  <Button rightIcon={<Download size={16} />} variant="light">다운로드</Button>
  <Button leftIcon={<Trash size={16} />} variant="danger">삭제</Button>
</div>`
  ),
  section(
    'Full Width',
    `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <Button fullWidth>전체 너비 버튼</Button>
  <Button fullWidth variant="light">전체 너비 Light</Button>
</div>`
  ),
  section(
    'Custom Color',
    `<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <div style={{ ${row} }}>
    <Button customColor={{ bg: '#8b5cf6', text: '#fff' }}>보라색</Button>
    <Button customColor={{ bg: '#059669', text: '#fff', hoverBg: '#047857', activeBg: '#065f46' }}>초록색</Button>
    <Button customColor={{ bg: '#ea580c', text: '#fff' }}>오렌지</Button>
    <Button customColor={{ bg: '#0ea5e9', text: '#fff' }}>하늘색</Button>
  </div>
  <div style={{ ${row} }}>
    <Button variant="light" customColor={{ bg: '#8b5cf6', text: '' }}>보라색</Button>
    <Button variant="light" customColor={{ bg: '#059669', text: '' }}>초록색</Button>
    <Button variant="light" customColor={{ bg: '#ea580c', text: '' }}>오렌지</Button>
    <Button variant="light" customColor={{ bg: '#e11d48', text: '', hoverBg: '#fce7f3', activeBg: '#fbcfe8' }}>핑크</Button>
  </div>
</div>`
  ),
].join('\n')}</div>`;

/** count는 CODE가 섹션마다 마운트하는 단추 수다. 헤딩이 바뀌어 섹션이 통째로 빠지면 빨개진다. */
const SECTIONS: Array<{ heading: string; name: string; count: number }> = [
  { heading: 'Variants (Fill)', name: 'Variants(Fill)', count: 4 },
  { heading: 'Variants (Weak)', name: 'Weak', count: 4 },
  { heading: 'Sizes', name: 'Sizes', count: 4 },
  { heading: 'With Icons', name: 'Icons', count: 4 },
  { heading: 'Full Width', name: 'FullWidth', count: 2 },
  { heading: 'Custom Color', name: 'CustomColor', count: 8 },
];

/** 예제 섹션의 프리뷰 버튼. 편집기의 "코드 복사" 버튼은 뺀다. */
const sectionButtons = (page: Page, heading: string) =>
  page
    .getByRole('heading', { name: heading, exact: true, level: 3 })
    .locator('..')
    .getByRole('button')
    .filter({ hasNotText: '복사' });

const mount = async (page: Page) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await mountLive(page, CODE, 'h3:has-text("Custom Color")');
};

const computed = (button: Locator, prop: 'willChange' | 'transform') =>
  button.evaluate((el, p) => getComputedStyle(el)[p], prop);

/** 마우스를 단추 한가운데로 옮긴다(호버). */
const hover = async (page: Page, button: Locator) => {
  await button.scrollIntoViewIfNeeded();
  const box = (await button.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
};

/** 마우스를 단추 밖으로 빼고 :hover가 풀린 것을 확인한다(진짜 휴지). */
const rest = async (page: Page, button: Locator, id: string) => {
  await page.mouse.move(2, 2);
  await expect
    .poll(() => button.evaluate((el) => el.matches(':hover')), {
      message: `${id} 호버 풀림`,
      intervals: [50, 100],
    })
    .toBe(false);
};

// 섹션마다 시험을 나눈다. 단추가 늘어도 시험 하나의 시간이 한도에 닿지 않고 실패가 섹션별로 갈린다.
for (const { heading, name, count } of SECTIONS) {
  test(`${name}: 단추가 휴지, 호버, 누름 중, 해제 뒤 전이 끝에서 will-change: transform을 유지한다`, async ({
    page,
  }) => {
    await mount(page);
    const buttons = sectionButtons(page, heading);
    expect(await buttons.count(), `${name} 버튼 수`).toBe(count);
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const id = `${name}#${i} ${((await button.textContent()) ?? '').trim()}`;

      await button.scrollIntoViewIfNeeded();
      await rest(page, button, id);
      expect
        .soft(await computed(button, 'willChange'), `${id} 휴지`)
        .toContain('transform');

      await hover(page, button);
      expect
        .soft(await computed(button, 'willChange'), `${id} 호버`)
        .toContain('transform');

      await page.mouse.down();
      // 누름은 data-pressed로 표시된다. 속성이 붙은 뒤의 계산된 스타일은 곧바로 맞다.
      await expect(button, `${id} 누름`).toHaveAttribute('data-pressed', /.*/);
      expect
        .soft(await computed(button, 'willChange'), `${id} 누름 중`)
        .toContain('transform');

      await page.mouse.up();
      // 최소 체류(90ms) 뒤 속성이 빠지고 spring 전이가 끝나야 transform이 none이다.
      // 단위행렬로 떨어지는 spring이 1을 지나는 중간 값과 구별되도록 none만 받는다.
      await expect(button, `${id} 해제`).not.toHaveAttribute(
        'data-pressed',
        /.*/
      );
      await expect
        .poll(() => computed(button, 'transform'), {
          message: `${id} 해제 뒤 전이 끝`,
          timeout: 5000,
          intervals: [50, 100],
        })
        .toBe('none');
      expect
        .soft(await computed(button, 'willChange'), `${id} 해제 뒤`)
        .toContain('transform');

      await rest(page, button, id);
      expect
        .soft(await computed(button, 'willChange'), `${id} 해제 뒤 휴지`)
        .toContain('transform');
    }
  });
}

test('축소 모드에서는 will-change가 auto이고 누른 transform이 none이다', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page);
  // 규칙이 base의 @media 하나라 섹션마다 첫 단추면 된다.
  for (const { heading, name } of SECTIONS) {
    const button = sectionButtons(page, heading).first();
    const id = `${name}#0`;
    await button.scrollIntoViewIfNeeded();
    await rest(page, button, id);
    expect
      .soft(await computed(button, 'willChange'), `${id} 휴지`)
      .toBe('auto');

    await hover(page, button);
    await page.mouse.down();
    await expect(button, `${id} 누름`).toHaveAttribute('data-pressed', /.*/);
    expect
      .soft(await computed(button, 'willChange'), `${id} 누름 중`)
      .toBe('auto');
    expect
      .soft(await computed(button, 'transform'), `${id} 누름 transform`)
      .toBe('none');
    await page.mouse.up();
    await expect(button, `${id} 해제`).not.toHaveAttribute(
      'data-pressed',
      /.*/
    );
  }
});
