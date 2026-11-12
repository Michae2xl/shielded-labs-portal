import { expect, test, type Page } from '@playwright/test';
import { open } from './support';

const address = (page: Page) => { const url = new URL(page.url()); return `${url.pathname}${url.search}${url.hash}`; };
const sidebar = (page: Page) => page.getByRole('complementary', { name: 'Portal sidebar' });
const governanceSidebar = (page: Page) => page.getByRole('complementary', { name: 'Governance sidebar' });
const sections = (page: Page) => page.getByRole('navigation', { name: 'Governance sections' });

test.describe('Two portals, two addresses', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the bare root answers with the governance front page and shows its address', async ({ page }) => {
    // The hosting health check asks the root for a 2xx: the page is served there, not behind a redirect.
    for (const root of ['/', '/shielded-preview']) {
      expect((await page.request.get(root, { maxRedirects: 0 })).status(), root).toBe(200);
      await open(page, root);
      // The page corrects its address once it is running, which can lag behind the first paint on a busy machine.
      await expect(page).toHaveURL(/\/governance$/, { timeout: 20_000 });
      await expect(page).toHaveTitle('Zcash Governance');
      await expect(sidebar(page)).toHaveCount(0);
    }
    // Opened at the root, the portal still moves and reloads on its own address.
    await sections(page).getByRole('link', { name: 'Voting', exact: true }).click();
    await expect(page).toHaveURL(/\/governance\?section=voting$/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(sections(page).getByRole('link', { name: 'Voting', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.goBack();
    await expect(page).toHaveURL(/\/governance$/);
    await expect(sections(page).getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('old governance links are redirected to the governance portal', async ({ page }) => {
    // Governance was a view of the single portal, and its default one.
    for (const [from, to] of [
      ['/shielded-preview?view=governance&section=zips&record=zip-0237', '/governance?section=zips&record=zip-0237'],
      ['/?view=governance&section=voting&lane=dev-fund', '/governance?section=voting&lane=dev-fund'],
      ['/?section=grants', '/governance?section=grants'],
      ['/governance?view=governance&section=grants', '/governance?section=grants'],
    ]) {
      const response = await page.request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(307);
      const location = new URL(response.headers().location, 'http://portal.example');
      expect(`${location.pathname}${location.search}`, from).toBe(to);
      await page.goto(from, { waitUntil: 'domcontentloaded' });
      expect(address(page), from).toBe(to);
    }
  });

  test('a Labs link opened on the governance address goes to the Labs portal', async ({ page }) => {
    await page.goto('/governance?view=projects&project=nsm', { waitUntil: 'domcontentloaded' });
    expect(address(page)).toBe('/?view=projects&project=nsm');
    await expect(sidebar(page)).toBeVisible();
  });

  test('the governance portal has its own sidebar and title, without the Labs menu', async ({ page }) => {
    const errors = await open(page, '/governance?section=zips');
    expect(errors, 'uncaught errors in the page').toEqual([]);
    await expect(page).toHaveTitle('ZIPs · Zcash Governance');
    await expect(sidebar(page)).toHaveCount(0);
    const side = governanceSidebar(page);
    await expect(side.getByRole('link', { name: 'Zcash Governance' })).toBeVisible();
    await expect(sections(page).getByRole('link')).toHaveCount(10);
    await expect(sections(page).getByRole('link', { name: 'ZIPs', exact: true })).toHaveAttribute('aria-current', 'page');
    // On a wide screen nothing sits on top: the sidebar carries the name and the sections, and the page starts beside it.
    await expect(page.getByRole('banner')).toBeHidden();
    const [menu, content] = [await side.boundingBox(), await page.locator('main').boundingBox()];
    expect(content!.x).toBeGreaterThanOrEqual(menu!.x + menu!.width);
    expect(content!.y).toBeLessThanOrEqual(1);
    // Moving between sections keeps the address free of the old `view`.
    await sections(page).getByRole('link', { name: 'Voting', exact: true }).click();
    await expect(page).toHaveURL(/\/governance\?section=voting$/);
    await expect(sections(page).getByRole('link', { name: 'Voting', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('the Labs Overview opens the governance portal and the governance sidebar leads back', async ({ page }) => {
    await open(page, '/?view=overview');
    await expect(page).toHaveTitle('Shielded Labs');
    // Two separate systems: the Labs menu has no governance entry, and the Overview keeps the way across.
    await expect(sidebar(page).getByRole('link', { name: /Governance/ })).toHaveCount(0);
    await page.getByRole('link', { name: 'Open governance' }).click();
    await expect(page).toHaveURL(/\/governance\?section=overview$/);
    await expect(page).toHaveTitle('Zcash Governance');
    await governanceSidebar(page).getByRole('link', { name: /Shielded Labs/ }).click();
    await expect(page).toHaveURL(/\/\?view=overview$/);
    await expect(sidebar(page)).toBeVisible();
  });

  test('the name on the sidebar returns to the front page without piling up history', async ({ page }) => {
    await open(page, '/governance?section=voting');
    const brand = governanceSidebar(page).getByRole('link', { name: 'Zcash Governance' });
    await brand.click();
    await expect(page).toHaveURL(/\/governance$/);
    await expect(sections(page).getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute('aria-current', 'page');
    const entries = await page.evaluate(() => window.history.length);
    await brand.click();
    await brand.click();
    expect(await page.evaluate(() => window.history.length)).toBe(entries);
    await page.goBack();
    await expect(page).toHaveURL(/\/governance\?section=voting$/);
  });

  test('the skip link passes the sidebar and lands on the page', async ({ page }) => {
    await open(page, '/governance?section=grants');
    // A page opens with its heading focused, so the reader reaches the skip link by going back to the top.
    await page.getByRole('link', { name: 'Skip to content' }).focus();
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => ({ inMenu: Boolean(document.activeElement?.closest('aside, nav[aria-label="Governance sections"]')), inPage: Boolean(document.activeElement?.closest('main')) }));
    expect(focus).toEqual({ inMenu: false, inPage: true });
  });

  test('shows exactly one navigation on each side of the 900px boundary', async ({ page }) => {
    for (const width of [900, 901, 1100]) {
      await page.setViewportSize({ width, height: 800 });
      await open(page, '/governance?section=grants');
      const wide = width > 900;
      // Up to 900px the bar and the grid of buttons; above it the sidebar, and the page beside it.
      await expect(page.getByRole('banner'), `bar at ${width}px`).toBeVisible({ visible: !wide });
      await expect(governanceSidebar(page), `sidebar at ${width}px`).toBeVisible({ visible: wide });
      await expect(sections(page)).toHaveCount(1);
      await expect(sections(page).getByRole('link')).toHaveCount(10);
      const content = await page.locator('main').boundingBox();
      if (wide) { const menu = await governanceSidebar(page).boundingBox(); expect(content!.x, `page beside the sidebar at ${width}px`).toBeGreaterThanOrEqual(menu!.x + menu!.width); }
      else expect(content!.x, `page at the edge at ${width}px`).toBe(0);
    }
  });

  test('a project page opens its ZIPs in the governance portal', async ({ page }) => {
    await open(page, '/?view=projects&project=nsm');
    await page.getByRole('link', { name: 'All ZIPs' }).click();
    await expect(page).toHaveURL(/\/governance\?section=zips$/);
    await expect(sections(page).getByRole('link', { name: 'ZIPs', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('a portal link inside governance stays in the governance portal, on a clean address', async ({ page }) => {
    // A ZIP with Shielded Labs owners carries a note that links the editorial policy as `?view=governance&…`.
    await open(page, '/governance?section=zips&record=zip-0237');
    await page.getByRole('link', { name: 'How this portal marks involvement' }).click();
    await expect(page).toHaveURL(/\/governance\?section=transparency&lane=method#editorial-policy$/);
    await expect(sections(page).getByRole('link', { name: 'Transparency', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(sidebar(page)).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(/\/governance\?section=zips&record=zip-0237$/);
  });

  test('a Labs page linked from governance opens in the Labs portal, and back returns to governance', async ({ page }) => {
    await open(page, '/governance?section=how-it-works');
    await page.getByRole('link', { name: /Zcash Governance Is a Superpower/ }).first().click();
    await expect(page).toHaveURL(/\/\?view=blog&section=all&record=zcash-governance-is-a-superpower$/);
    await expect(sidebar(page)).toBeVisible();
    await expect(page).toHaveTitle('Zcash Governance Is a Superpower · Shielded Labs');
    await page.goBack();
    await expect(page).toHaveURL(/\/governance\?section=how-it-works$/);
    await expect(page).toHaveTitle('How it works · Zcash Governance');
  });
});

test.describe('The governance bar on small screens', () => {
  for (const width of [375, 600]) {
    test(`is sticky and as tall as the Labs bar at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await open(page, '/?view=about');
      // The Labs bar leads with its own mark; governance is no longer a shortcut on it.
      await expect(sidebar(page).getByRole('link', { name: 'Shielded Labs' })).toBeVisible();
      await expect(sidebar(page).getByRole('link', { name: /Governance/ })).toHaveCount(0);
      const labsBar = Math.round((await sidebar(page).boundingBox())!.height);
      await open(page, '/governance?section=zips');
      const bar = page.getByRole('banner');
      await expect(bar.getByRole('link', { name: /Governance/ })).toBeVisible();
      await expect(bar.getByRole('link', { name: /Shielded Labs/ })).toBeVisible();
      // No sidebar at this width: the sections are the grid of buttons under the bar.
      await expect(governanceSidebar(page)).toBeHidden();
      await expect(sections(page).getByRole('link')).toHaveCount(10);
      // Record bars inside the pages stick right below the portal bar, at offsets tuned to the Labs bar.
      expect(Math.round((await bar.boundingBox())!.height)).toBe(labsBar);
      await page.mouse.wheel(0, 1200);
      // Only once the page has really moved does the bar's place say whether it sticks.
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
      expect(Math.round((await bar.boundingBox())!.y)).toBe(0);
    });
  }

  test('keeps both names apart on a 320px screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page, '/governance');
    const bar = page.getByRole('banner');
    const brand = bar.getByRole('link', { name: /Governance/ });
    const labs = bar.getByRole('link', { name: /Shielded Labs/ });
    await expect(labs).toBeVisible();
    // Nothing is squeezed out of the brand block, and the two links do not touch.
    expect(await brand.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(0);
    const [left, right] = [await brand.boundingBox(), await labs.boundingBox()];
    expect(left!.x + left!.width).toBeLessThan(right!.x);
    expect(right!.x + right!.width).toBeLessThanOrEqual(320);
  });
});
