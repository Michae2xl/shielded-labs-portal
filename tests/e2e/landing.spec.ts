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
  { name: 'Blog', path: '/landing/blog.html' },
  { name: 'Governance', path: '/landing/governance.html' },
  { name: 'Board', path: '/landing/board.html' },
  { name: 'Projects', path: '/landing/projects.html' },
  { name: 'Dynamic Fees', path: '/landing/fees.html' },
  { name: 'Zero', path: '/landing/zero.html' },
  { name: 'Ironwood', path: '/landing/ironwood.html' },
  { name: 'Roadmap', path: '/landing/roadmap.html' },
  { name: 'Crosslink FAQ', path: '/landing/crosslink-faq.html' },
  { name: 'Jobs', path: '/landing/jobs.html' },
  { name: 'Contact', path: '/landing/contact.html' },
  { name: 'Privacy Policy', path: '/landing/privacy-policy.html' },
  { name: 'a blog post', path: '/landing/blog-epoch-future-proof-cryptography-for-zcash.html' },
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
      await expect(page.locator('.nav-list a', { hasText: 'Blog' }).first()).toHaveAttribute('href', 'blog.html');
      // The menu of the live site, in its order, with Transparency added last; no extra call, search or theme button.
      const menu = await page.locator('.nav-list > li > a').allTextContents();
      expect(menu.map(item => item.trim())).toEqual(['Home', 'Team', 'Jobs', 'Projects', 'Governance', 'Blog', 'Board', 'Contact', 'Transparency']);
      await expect(page.locator('#submenu-home a')).toHaveText(['About', 'Values', 'Mission']);
      await expect(page.locator('#submenu-projects a')).toHaveText(['NSM', 'Crosslink', 'Dynamic Fees', 'Zero', 'Ironwood']);
      await expect(page.locator('.nav-cta, .search-btn, .theme-btn'), 'controls the live site does not have').toHaveCount(0);
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
  // The text of the live NSM page, in the reader of the blog: the note, the original wording struck through, ZIP 237 added.
  await expect(page.locator('.post__back a')).toHaveAttribute('href', 'projects.html');
  // As on the live NSM page: the note on the change, the original wording struck through, and ZIP 237 added.
  await expect(page.locator('.post__body p').first()).toContainText('preserves the existing four-year halving schedule');
  await expect(page.locator('.post__body del a[href$="zip-0234"]').first()).toBeVisible();
  await expect(page.locator('.post__body a[href$="zip-0237"]').first()).toBeVisible();
  await expect(page.locator('.post-aside a[aria-current="page"]')).toHaveText('Network Sustainability Mechanism');

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
  await expect(page.locator('.post__title')).toHaveText('Crosslink');
  await expect(page.locator('.post__body a[href="roadmap.html"]')).toHaveText('Roadmap');
  await expect(page.locator('.post__body a[href="crosslink-faq.html"]')).toHaveText('Frequently Asked Questions');

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

test('the blog lives on the landing, in the format of the portal: filters, search and a reader for each post', async ({ page }) => {
  await open(page, '/landing/blog.html');
  await expect(page.locator('.nav-list a[aria-current="page"]')).toHaveText('Blog');
  const rows = page.locator('.blog-row');
  await expect(rows).toHaveCount(21);
  await expect(rows.first().locator('.blog-row__title')).toHaveText('The Network Sustainability Mechanism (NSM) Activates with NU7');
  // Every post opens a page of the landing, never the portal.
  const targets = await page.locator('.blog-row__link').evaluateAll(links => links.map(link => link.getAttribute('href') ?? ''));
  expect(targets.filter(href => !/^[a-z0-9-]+\.html$/.test(href)), 'posts that open outside the landing').toEqual([]);
  await page.getByRole('button', { name: 'Security' }).click();
  await expect(page.locator('.blog-row:visible')).toHaveCount(4);
  await page.getByRole('button', { name: 'All articles' }).click();
  await page.getByPlaceholder('Search articles…').fill('orchard');
  await expect(page.locator('.blog-row:visible')).toHaveCount(2);

  await open(page, '/landing/blog-epoch-future-proof-cryptography-for-zcash.html');
  await expect(page.locator('.post__title')).toHaveText('Epoch: Future-Proof Cryptography for Zcash');
  await expect(page.locator('.post__back a')).toHaveAttribute('href', 'blog.html');
  await expect(page.locator('.post-aside__toc a')).toHaveCount(5);
  await expect(page.locator('.post__body h2#what-is-epoch')).toHaveText('What Is Epoch?');
  await expect(page.locator('.post-aside a', { hasText: 'Original source' })).toHaveAttribute('href', 'https://shieldedlabs.net/epoch-future-proof-cryptography-for-zcash/');
  // No page of the landing sends the reader to the portal's blog.
  await expect(page.locator('a[href*="view=blog"]')).toHaveCount(0);
});

test('team, board and governance follow the pattern of the homepage: a centered title, then centered content', async ({ page }) => {
  for (const [path, title, people] of [['/landing/team.html', 'Team', 14], ['/landing/board.html', 'Board of Directors', 5], ['/landing/governance.html', 'Governance & Polling', 0]] as const) {
    await open(page, path);
    await expect(page.locator('h1.orig__title')).toHaveText(title);
    const offset = await page.locator('h1.orig__title').evaluate(node => {
      const box = node.getBoundingClientRect();
      return Math.abs(box.left + box.width / 2 - document.documentElement.clientWidth / 2);
    });
    expect(offset, `distance of the ${title} title from the centre`).toBeLessThanOrEqual(2);
    await expect(page.locator('.people--orig .person')).toHaveCount(people);
    // The menu leads to the landing's own page, not to the old site.
    await expect(page.locator('a[href="https://shieldedlabs.net/governance/"], a[href="https://shieldedlabs.net/board/"]')).toHaveCount(0);
  }
  await expect(page.locator('.nav-list a[aria-current="page"]')).toHaveText('Governance');
  await expect(page.locator('.link-card')).toHaveCount(6);
});

test('every page of the menu and the footer is a page of the landing, with the text of the live site', async ({ page }) => {
  await open(page, '/landing');
  const links = await page.locator('.nav-list a, .site-foot a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href') ?? ''));
  const away = links.filter(href => /shieldedlabs\.net\/(?!feed\/)/.test(href));
  expect(away, 'menu and footer links that leave the landing for the old site').toEqual([]);
  await open(page, '/landing/projects.html');
  await expect(page.locator('.orig-prose a[href="fees.html"]')).toHaveText('Dynamic Fees');
  await open(page, '/landing/zero.html');
  await expect(page.locator('.post__body')).toContainText('Zero is a supported suite of open-source Zcash infrastructure software');
  await open(page, '/landing/contact.html');
  await expect(page.locator('.contact-form input[name="email"]')).toHaveAttribute('required', '');
  await expect(page.locator('.contact-form')).toHaveAttribute('action', 'mailto:info@shieldedlabs.net');
  await open(page, '/landing/governance.html');
  await expect(page.locator('.orig-prose h3 a').first()).toHaveText('ZCG and the Dev Fund');
  await expect(page.locator('.orig-facts dd').first()).toHaveText('November 16');
});

test('moving between pages: each page marks its place in the menu and its back link goes one level up', async ({ page }) => {
  const places = [
    ['/landing/nsm.html', 'Projects', 'projects.html'],
    ['/landing/roadmap.html', 'Projects', 'crosslink.html'],
    ['/landing/blog-epoch-future-proof-cryptography-for-zcash.html', 'Blog', 'blog.html'],
    ['/landing/jobs-cryptographer.html', 'Jobs', 'jobs.html'],
  ] as const;
  for (const [path, menu, back] of places) {
    await open(page, path);
    await expect(page.locator('.nav-list > li > a[aria-current]'), `menu item marked on ${path}`).toHaveText(menu);
    await expect(page.locator('.post__back a'), `back link on ${path}`).toHaveAttribute('href', back);
  }
  // From the homepage, the menu reaches every section and the projects through the Projects page.
  await open(page, '/landing');
  await page.locator('.nav-list > li > a', { hasText: 'Projects' }).click();
  await expect(page).toHaveURL(/\/landing\/projects\.html$/);
  await page.locator('.orig-prose a', { hasText: 'Zero' }).click();
  await expect(page.locator('.post__title')).toHaveText('Zero');
  await page.locator('.post__back a').click();
  await expect(page).toHaveURL(/\/landing\/projects\.html$/);
});
