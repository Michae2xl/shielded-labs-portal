import { expect, test } from '@playwright/test';
import { open, sidewaysOverflow, viewports } from './support';

/**
 * The landing proposal is a static copy of the proposed shieldedlabs.net pages, served beside the portal
 * (public/landing). It has to open on its short address, draw its panorama, keep the Support page free of
 * anything that looks like a real address, and carry the content the portal already holds.
 * The executive layer adds a Support call in the menu, proof and a supporters section on the Support page, and a
 * Funding and transparency page. The homepage follows the live shieldedlabs.net: a clean top where the official
 * words rotate over the art, then About, Values and Mission, centered, in the type of the live site.
 */
const added = [
  { name: 'NSM', path: '/landing/nsm.html' },
  { name: 'the NU7 post', path: '/landing/nsm-activates-with-nu7.html' },
  { name: 'Team', path: '/landing/team.html' },
  { name: 'Key facts', path: '/landing/key-facts.html' },
  { name: 'Crosslink', path: '/landing/crosslink.html' },
  { name: 'Funding', path: '/landing/funding.html' },
  { name: 'Transparency', path: '/landing/transparency.html' },
] as const;

for (const viewport of viewports) {
  test.describe(`landing proposal, ${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('the landing renders without errors or sideways scroll', async ({ page }) => {
      const errors = await open(page, '/landing');
      expect(errors, 'uncaught errors in the page').toEqual([]);
      expect(new URL(page.url()).pathname).toBe('/landing/index.html');
      expect(await sidewaysOverflow(page), 'pixels of sideways scroll').toBeLessThanOrEqual(1);
      // A clean top, as on the live site: the official words rotate over the art, with no fixed sentence or buttons.
      await expect(page.locator('#hero-title')).toHaveText('Shielded Labs: Unstoppable Private Money');
      await expect(page.locator('.rot .rot__item'), 'rotating items: name, words, Zcash mark').toHaveCount(3);
      await expect(page.locator('.rot__item--words')).toHaveText('Unstoppable Private Money');
      await expect(page.locator('.rot__shield svg')).toHaveCount(1);
      await expect(page.locator('.hero .lead, .hero .actions, .hero-place'), 'fixed sentences and buttons in the top').toHaveCount(0);
      // Below it, the sections of the live site in its order, with no Independence band, project cards or posts.
      const order = await page.locator('main > section[id]').evaluateAll(sections => sections.map(section => section.id));
      expect(order, 'order of the sections below the top').toEqual(['about', 'values', 'mission']);
      await expect(page.locator('.independence, #writing, .work__item, .proof'), 'blocks the live site does not have').toHaveCount(0);
      await expect(page.locator('.orig__title')).toHaveText(['About', 'Values', 'Mission']);
      await expect(page.locator('#values .value__icon--cells'), 'value icons drawn in cells').toHaveCount(6);
      await expect(page.locator('.nav-list > li > a', { hasText: 'Transparency' })).toHaveAttribute('href', 'transparency.html');
      await expect(page.locator('.nav-list a', { hasText: 'Blog' }).first()).toHaveAttribute('href', '/?view=blog&section=all');
      await expect(page.locator('.nav-cta a'), 'the call in the menu').toHaveText('Support');
      await expect(page.locator('.nav-cta a')).toHaveAttribute('href', 'support.html');
      // Titles and statements are centered on the page, in the type of the live site.
      const centered = await page.locator('.orig__title, .orig__lead').evaluateAll(nodes => nodes.map(node => {
        const box = node.getBoundingClientRect();
        return { offset: Math.abs(box.left + box.width / 2 - document.documentElement.clientWidth / 2), align: getComputedStyle(node).textAlign, font: getComputedStyle(node).fontFamily };
      }));
      for (const item of centered) {
        expect(item.offset, 'distance from the centre of the page').toBeLessThanOrEqual(2);
        expect(item.align).toBe('center');
        expect(item.font).toContain('Raleway');
      }

      // The panorama is drawn by script once it is on screen: a blank canvas means the script never ran.
      const panorama = page.locator('.panorama canvas');
      await panorama.scrollIntoViewIfNeeded();
      await expect.poll(() => panorama.evaluate(node => {
        const canvas = node as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let painted = 0;
        for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) painted += 1;
        return painted;
      }), { message: 'painted pixels in the panorama', timeout: 6_000 }).toBeGreaterThan(1_000);
    });

    test('the support page shows placeholders, never an address', async ({ page }) => {
      const errors = await open(page, '/landing/support.html');
      expect(errors, 'uncaught errors in the page').toEqual([]);
      expect(await sidewaysOverflow(page), 'pixels of sideways scroll').toBeLessThanOrEqual(1);
      await expect(page.locator('.support__flag')).toBeVisible();
      await expect(page.locator('.give__address')).toHaveText([/to be provided by Shielded Labs/, /to be provided by Shielded Labs/]);
      await expect(page.locator('.section--page-head .proof__item'), 'facts that open the page').toHaveCount(4);
      await expect(page.locator('.pending'), 'items waiting for Shielded Labs').toHaveCount(3);
    });

    for (const screen of added) {
      test(`${screen.name} renders without errors, sideways scroll or missing images`, async ({ page }) => {
        const errors = await open(page, screen.path);
        expect(errors, 'uncaught errors in the page').toEqual([]);
        expect(await sidewaysOverflow(page), 'pixels of sideways scroll').toBeLessThanOrEqual(1);
        // Shown images must have loaded; the logo for the other theme is hidden, so its file is fetched instead.
        const failed = await page.evaluate(async () => {
          const shown = [...document.images].filter(image => image.getClientRects().length > 0 && image.complete && image.naturalWidth === 0);
          const hidden = [...document.images].filter(image => image.getClientRects().length === 0);
          const missing = await Promise.all(hidden.map(image => fetch(image.src).then(response => !response.ok, () => true)));
          return shown.length + missing.filter(Boolean).length;
        });
        expect(failed, 'images that failed to load').toBe(0);
      });
    }
  });
}

test('in light mode the logo keeps the original shield: nothing inverts it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await open(page, '/landing');
  await expect(page.locator('.brand .brand__light')).toBeVisible();
  await expect(page.locator('.brand .brand__dark')).toBeHidden();
  const filters = await page.evaluate(() => [...document.querySelectorAll('.brand img, .rot__shield svg')].map(node => getComputedStyle(node).filter));
  expect(filters, 'filters on the header logo and the rotating shield').toEqual(['none', 'none', 'none']);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('.brand .brand__dark')).toBeVisible();
  await expect(page.locator('.brand .brand__light')).toBeHidden();
});

test('the panorama keeps one colour, the Swiss flag: a red square with a white cross', async ({ page }) => {
  // With motion reduced the scene is one still frame, and it opens on the stretch of the village where the flag stands.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/landing');
  const panorama = page.locator('.panorama canvas');
  await panorama.scrollIntoViewIfNeeded();
  const paint = () => panorama.evaluate(node => {
    const canvas = node as HTMLCanvasElement;
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    const red = { count: 0, left: canvas.width, right: -1, top: canvas.height, bottom: -1 };
    const solid: Array<{ x: number; y: number; white: boolean }> = [];
    let other = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const [r, g, b, alpha] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
      if (alpha < 128) continue;
      const [x, y] = [(index / 4) % canvas.width, Math.floor(index / 4 / canvas.width)];
      // Ink and white have no hue; the flag red is the one hue allowed.
      if (Math.max(r, g, b) - Math.min(r, g, b) < 40) { solid.push({ x, y, white: Math.min(r, g, b) > 235 }); continue; }
      if (r > 200 && g < 70 && b < 70) { red.count += 1; red.left = Math.min(red.left, x); red.right = Math.max(red.right, x); red.top = Math.min(red.top, y); red.bottom = Math.max(red.bottom, y); continue; }
      other += 1;
    }
    const cross = solid.filter(pixel => pixel.white && pixel.x > red.left && pixel.x < red.right && pixel.y > red.top && pixel.y < red.bottom).length;
    return { red, other, cross };
  });
  await expect.poll(async () => (await paint()).red.count, { message: 'red pixels in the panorama', timeout: 6_000 }).toBeGreaterThan(100);
  const { red, other, cross } = await paint();
  expect(other, 'pixels in a colour other than the flag red').toBe(0);
  expect(Math.abs((red.right - red.left) - (red.bottom - red.top)), 'the flag is a square: width against height, in pixels').toBeLessThanOrEqual(2);
  expect(cross, 'white pixels of the cross inside the red field').toBeGreaterThan(20);
});

test('the panorama has no coin rolling through the town', async ({ page }) => {
  await open(page, '/landing');
  const panorama = page.locator('.panorama canvas');
  await panorama.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => 'coin' in (document.querySelector('[data-panorama]') ?? {})), 'a coin drawn in the panorama').toBe(false);
});

test('the added pages carry what the portal already holds', async ({ page }) => {
  await open(page, '/landing/nsm.html');
  await expect(page.locator('.lead')).toContainText('activated as part of NU7 at block height 3,543,405');
  // As on the live NSM page: the note on the change, the original wording struck through, and ZIP 237 added.
  await expect(page.locator('.nsm-note')).toContainText('preserves the existing four-year halving schedule');
  await expect(page.locator('.zips del a[href$="zip-0234"]')).toHaveCount(1);
  await expect(page.locator('.zips a[href$="zip-0237"]')).toHaveCount(1);

  await open(page, '/landing/transparency.html');
  await expect(page.locator('h1')).toHaveText('Transparency Statement');
  await expect(page.locator('.transparency p')).toHaveCount(7);
  await expect(page.locator('.transparency__qr img')).toHaveAttribute('src', 'assets/images/donation-qr.png');
  expect(await page.locator('.transparency__qr img').evaluate(node => (node as HTMLImageElement).naturalWidth), 'the QR code loads').toBeGreaterThan(0);

  await open(page, '/landing/team.html');
  await expect(page.locator('.person')).toHaveCount(14);
  await expect(page.locator('#aayush-giri .person__name')).toHaveText('Aayush Giri');
  await expect(page.locator('#wei-jie-koh .person__name')).toHaveText('Wei Jie Koh');

  await open(page, '/landing/key-facts.html');
  await expect(page.getByRole('link', { name: '14 people' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Donations from Zcash holders and supporters' })).toHaveAttribute('href', 'funding.html');

  await open(page, '/landing/crosslink.html');
  await expect(page.locator('.step')).toHaveCount(7);
  await expect(page.locator('a[href*="youtube.com/watch"]')).toHaveCount(20);

  await open(page, '/landing/nsm-activates-with-nu7.html');
  await expect(page.locator('h1')).toHaveText('The Network Sustainability Mechanism (NSM) Activates with NU7');

  await open(page, '/landing/funding.html');
  await expect(page.locator('h1')).toHaveText('Funding and transparency');
  await expect(page.locator('.record__item'), 'results listed as delivered').toHaveCount(2);
  await expect(page.locator('.facts__list > div'), 'oversight facts').toHaveCount(5);
  await expect(page.locator('.pending'), 'the reports section is marked as a proposal').toHaveCount(1);

  await open(page, '/landing/support.html');
  // Nobody is named until Shielded Labs confirms it: the section holds its sentence and a pending note only.
  await expect(page.locator('#supporters ~ .resource-list'), 'supporters named before confirmation').toHaveCount(0);
  await expect(page.locator('#supporters ~ .pending')).toHaveCount(1);
});

test('the rotating words keep one still frame when motion is reduced, and nothing above an item repeats a category', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/landing');
  // With motion reduced only the first item, the Shielded Labs name, stays on screen.
  const shown = await page.locator('.rot__item').evaluateAll(items => items.map(item => getComputedStyle(item).opacity));
  expect(shown).toEqual(['1', '0', '0']);
  // Each value is its icon, its name and a line about it.
  await expect(page.locator('#values .value .label'), 'category words above the values').toHaveCount(0);
  await open(page, '/landing/support.html');
  await expect(page.locator('.work__item .work__name')).toHaveCount(6);
  await expect(page.locator('.work__item .label'), 'category words above the project names on Support').toHaveCount(0);
});
