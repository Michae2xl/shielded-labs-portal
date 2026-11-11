import { expect, test, type Page } from '@playwright/test';
import { archiveLists, library, open, viewports } from './support';

/** Each row link of the archive lists, with where its measure columns start and how wide they are. */
const rowGeometry = (page: Page) => page.evaluate(() => [...document.querySelectorAll('main ul[class*="_rows"] > li > a[class*="_record"]')].map(row => {
  const measures = [...row.children].find(child => (child.getAttribute('class') ?? '').includes('_measures'));
  const box = measures?.getBoundingClientRect();
  return { display: getComputedStyle(row).display, left: box ? Math.round(box.left) : null, width: box ? Math.round(box.width) : null };
}));

for (const viewport of viewports) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    for (const list of archiveLists) {
      test(`${list.name} keeps every row on one grid`, async ({ page }) => {
        await open(page, list.path);
        // Rows arrive after the data does; on a busy machine that can be after the page settles.
        await page.locator('main ul[class*="_rows"] > li > a[class*="_record"]').first().waitFor({ state: 'visible', timeout: 20_000 });
        const rows = await rowGeometry(page);
        expect(rows.length, 'rows in the list').toBeGreaterThan(0);
        // A row that stops being a grid lets its columns float: the 9 Nov 2026 regression.
        expect([...new Set(rows.map(row => row.display))]).toEqual(['grid']);
        expect(new Set(rows.map(row => row.left)).size, 'distinct left edges of the measure columns').toBe(1);
        expect(new Set(rows.map(row => row.width)).size, 'distinct widths of the measure columns').toBe(1);
      });
    }
  });
}

test.describe('ZIP library filters', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('are compact segmented controls whose tracks line up', async ({ page }) => {
    await open(page, library());
    const groups = page.locator('[role="group"][aria-label^="Filter by"]');
    await expect(groups).toHaveCount(2);
    const facts = await groups.evaluateAll(list => list.map(group => {
      const chip = group.querySelector('button')!;
      return { size: parseFloat(getComputedStyle(chip).fontSize), height: Math.round(chip.getBoundingClientRect().height), left: Math.round(group.querySelector(':scope > div')!.getBoundingClientRect().left) };
    }));
    // Filters stay a step below the tabs; a governance-wide rule once reset them to body size.
    for (const fact of facts) { expect(fact.size).toBeLessThanOrEqual(14); expect(fact.height).toBeLessThanOrEqual(36); }
    expect(facts[0].left).toBe(facts[1].left);
  });

  test('narrow the pull requests by status and by activity, and keep the choice in the address', async ({ page }) => {
    await open(page, library('&lane=proposals'));
    const status = page.getByRole('group', { name: 'Filter by status' });
    const activity = page.getByRole('group', { name: 'Filter by activity' });
    const draft = status.getByRole('button', { name: /^Draft/ });
    const expected = Number((await draft.locator('strong').innerText()).trim());
    await draft.click();
    await expect(draft).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/filter=Draft/);
    const statuses = await page.locator('main ul[class*="_rows"] > li span[class*="_status"]').allInnerTexts();
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.length).toBeLessThanOrEqual(expected);
    expect([...new Set(statuses.map(text => text.trim()))]).toEqual(['Draft']);
    const week = activity.getByRole('button', { name: /^7 days/ });
    await week.click();
    await expect(week).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/activity=7/);
    await expect(page).toHaveURL(/filter=Draft/);
  });
});
