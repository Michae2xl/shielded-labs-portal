import { expect, test } from '@playwright/test';
import { open, sidewaysOverflow, viewports } from './support';

/**
 * The landing proposal is a static copy of the proposed shieldedlabs.net pages, served beside the portal
 * (public/landing). It has to open on its short address, draw its panorama, keep the Support page free of
 * anything that looks like a real address, and carry the content the portal already holds.
 * The executive layer adds a Support call in the menu, proof and named supporters on the Support page, and a
 * Funding and transparency page. The homepage hero stays as it was, clear for the art. Below it every section
 * is two halves (head on the left, content on the right, on one centre axis), Mission comes before Values, the
 * six values carry icons drawn in cells, and dark mode is one black from the header to the footer.
 */
const added = [
  { name: 'NSM', path: '/landing/nsm.html' },
  { name: 'the NU7 post', path: '/landing/nsm-activates-with-nu7.html' },
  { name: 'Team', path: '/landing/team.html' },
  { name: 'Key facts', path: '/landing/key-facts.html' },
  { name: 'Crosslink', path: '/landing/crosslink.html' },
  { name: 'Funding', path: '/landing/funding.html' },
] as const;

for (const viewport of viewports) {
  test.describe(`landing proposal, ${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('the landing renders without errors or sideways scroll', async ({ page }) => {
      const errors = await open(page, '/landing');
      expect(errors, 'uncaught errors in the page').toEqual([]);
      expect(new URL(page.url()).pathname).toBe('/landing/index.html');
      expect(await sidewaysOverflow(page), 'pixels of sideways scroll').toBeLessThanOrEqual(1);
      await expect(page.locator('.hero-globe--shield svg')).toBeVisible();
      await expect(page.locator('.work__item'), 'projects listed under the mission').toHaveCount(6);
      await expect(page.locator('#writing .feature__title'), 'newest post, featured').toContainText('Activates with NU7');
      await expect(page.locator('#writing .posts--rows .post'), 'the two posts after it').toHaveCount(2);
      await expect(page.locator('#independence .proof--panel .proof__item'), 'facts beside the funding statement').toHaveCount(4);
      // The hero stays as it was: the proof row lives on the Support page, so nothing competes with the art.
      await expect(page.locator('.hero .proof'), 'proof row in the hero').toHaveCount(0);
      await expect(page.locator('.nav-cta a'), 'the call in the menu').toHaveText('Support');
      await expect(page.locator('.nav-cta a')).toHaveAttribute('href', 'support.html');
      await expect(page.locator('#values .value__icon--cells'), 'value icons drawn in cells').toHaveCount(6);
      // Mission, what the organization does and builds, comes before Values.
      const order = await page.locator('main > section[id]').evaluateAll(sections => sections.map(section => section.id));
      expect(order, 'order of the sections below the hero').toEqual(['mission', 'values', 'independence', 'writing']);
      if (viewport.width >= 1180) {
        // Two halves: every title starts on the left edge and every content block on the same centre axis.
        const edges = await page.locator('.halves').evaluateAll(sections => sections.map(section => ({
          title: Math.round(section.querySelector('.sec-head h2')?.getBoundingClientRect().left ?? -1),
          content: Math.round(section.querySelector('.halves__content')?.getBoundingClientRect().left ?? -1),
        })));
        expect(edges).toHaveLength(4);
        expect(new Set(edges.map(edge => edge.title)).size, 'left edges of the four titles').toBe(1);
        expect(new Set(edges.map(edge => edge.content)).size, 'left edges of the four content blocks').toBe(1);
        expect(edges[0].content, 'the content starts right of the title').toBeGreaterThan(edges[0].title + 400);
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
        const failed = await page.evaluate(() => [...document.images].filter(image => image.complete && image.naturalWidth === 0).length);
        expect(failed, 'images that failed to load').toBe(0);
      });
    }
  });
}

test('dark mode is one black: the homepage band matches the page', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await open(page, '/landing');
  const [body, band] = await page.evaluate(() => {
    const section = document.querySelector('.independence');
    return [getComputedStyle(document.body).backgroundColor, section ? getComputedStyle(section).backgroundColor : 'missing'];
  });
  expect(body, 'page background in dark mode').toBe('rgb(7, 7, 7)');
  expect(band, 'background of the Funded by donations section').toBe(body);
});

test('the added pages carry what the portal already holds', async ({ page }) => {
  await open(page, '/landing/nsm.html');
  await expect(page.locator('.lead')).toContainText('activated as part of NU7 at block height 3,543,405');

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
  await expect(page.locator('#supporters ~ .resource-list .resource'), 'named supporters').toHaveCount(1);
});

test('each section opens with its name as the section title, and nothing above an item repeats a category', async ({ page }) => {
  await open(page, '/landing');
  const heads = await page.locator('.sec-head').evaluateAll(list => list.map(head => ({
    headings: [...head.querySelectorAll('h1, h2, h3')].map(node => ({ text: node.textContent?.trim() ?? '', title: node.matches('.sec-title > h2:not(.label)') })),
    labels: head.querySelectorAll('.sec-label, .no').length,
  })));
  // One heading per section head: the section name as its title, with no label or number over it.
  expect(heads.map(head => head.headings)).toEqual(['Mission', 'Values', 'Independence', 'Blog'].map(text => [{ text, title: true }]));
  expect(heads.map(head => head.labels)).toEqual([0, 0, 0, 0]);
  // The name keeps the size and the ink of a section title: it is not drawn as a small label.
  const type = await page.evaluate(() => {
    const read = (node: Element) => ({ size: parseFloat(getComputedStyle(node).fontSize), color: getComputedStyle(node).color });
    const probe = document.body.appendChild(Object.assign(document.createElement('p'), { className: 'label' }));
    const label = read(probe);
    probe.remove();
    return { label, titles: [...document.querySelectorAll('.sec-head h2')].map(read) };
  });
  expect(type.titles).toHaveLength(4);
  for (const title of type.titles) {
    expect(title.size, 'a section title is far larger than a label').toBeGreaterThan(type.label.size * 2);
    expect(title.color, 'a section title is in ink, not in the muted label colour').not.toBe(type.label.color);
  }
  // An item is its name and a line about it. Posts keep their date, which is a fact and not a category.
  await expect(page.locator('.work__item .work__name')).toHaveCount(6);
  await expect(page.locator('.work__item .label'), 'category words above the project names').toHaveCount(0);
  await expect(page.locator('#writing .tag'), 'category words above the post titles').toHaveCount(0);
  await expect(page.locator('#writing .post-meta time'), 'dates of the three posts').toHaveCount(3);
  await open(page, '/landing/support.html');
  await expect(page.locator('.work__item .work__name')).toHaveCount(6);
  await expect(page.locator('.work__item .label'), 'category words above the project names on Support').toHaveCount(0);
});
