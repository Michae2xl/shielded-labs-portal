import { expect, test } from '@playwright/test';
import { open, sidewaysOverflow } from './support';
import { NU7_1_TURNOUT, buildSnapshot } from '../../src/lib/shielded-preview/poll-turnout/turnout';

const LAUNCH = { host: 'governance.shieldedlabs.net' };

test.describe('The poll as a site of its own', () => {
  for (const width of [375, 1440]) {
    test(`all poll section links are visible on arrival and jump below the header at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 667 });
      await open(page, '/poll');
      const nav = page.getByRole('navigation', { name: 'Poll sections' });
      const links = nav.getByRole('link');
      await expect(links).toHaveText(['How to participate', 'Video tutorials', 'Coinholder activity by question', 'Panels', 'Miner sentiment']);
      expect(await links.evaluateAll(items => {
        const sections = items.map(a => document.getElementById(a.getAttribute('href')!.slice(1))!);
        return sections.every((el, i) => i === 0 || (sections[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
      })).toBe(true);
      await expect(nav).toBeInViewport({ ratio: 1 });
      for (const link of await links.all()) {
        const hash = (await link.getAttribute('href'))!;
        await link.click();
        await expect(page).toHaveURL(new RegExp(hash + '$'));
        await expect.poll(() => page.locator(hash).evaluate(el => {
          const top = el.getBoundingClientRect().top;
          return top >= document.querySelector('header')!.getBoundingClientRect().bottom && top < window.innerHeight / 2;
        })).toBe(true);
      }
      expect(await sidewaysOverflow(page)).toBe(0);
    });

    test(`miner cards and manual verification work at ${width}px`, async ({ page, context }) => {
      await page.setViewportSize({ width, height: 900 });
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.route('**/api/shielded-preview/miner-poll', route => route.fulfill({ json: {
        phase: 'counting', height: 3591399, tallied: 200, withBallot: 50, questions: null, updatedAt: '2026-11-20T02:00:00Z',
      } }));
      await open(page, '/poll#miner-sentiment');
      const card = page.locator('#miner-sentiment');
      await expect(card.locator('dt')).toHaveText(['Status', 'Blocks tallied', 'Blocks with a ballot']);
      await expect(card.getByText('25.0% of tallied blocks')).toBeVisible();
      for (const value of await card.locator('dt + dd').all()) {
        await expect(value).toHaveCSS('text-align', 'center');
      }
      const boxes = await card.locator('dl > div').evaluateAll(items => items.map(item => item.getBoundingClientRect().top));
      expect(boxes[1]).toBe(boxes[2]);
      if (width === 375) expect(boxes[1]).toBeGreaterThan(boxes[0]);
      else expect(boxes[1]).toBe(boxes[0]);
      const resources = card.getByRole('navigation', { name: 'Miner poll resources' });
      const resourceLinks = resources.getByRole('link');
      await expect(resourceLinks).toHaveText(['Official tally', 'Poll rules', 'Ballot builder', 'Foundation announcement']);
      await expect(resourceLinks.first()).toHaveAttribute('href', 'https://miner-poll.zfnd.org/');
      for (const item of await resourceLinks.all()) {
        await expect(item).toBeVisible();
        await expect(item).toHaveAttribute('target', '_blank');
        expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      const copy = card.getByRole('button', { name: 'Copy command' });
      await expect(copy).toBeHidden();
      await card.getByText('Verify the tally', { exact: true }).press('Enter');
      await copy.click();
      await expect(card.getByText('Command copied.')).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await card.locator('pre code').textContent());
      expect(await sidewaysOverflow(page)).toBe(0);
    });

    test(`coinholders see the mainnet height and its block time at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route('**/api/shielded-preview/chain-tip', route => route.fulfill({ json: {
        height: 3590254, time: '2026-11-19T17:15:44.000Z',
      } }));
      await open(page, '/poll');
      const card = page.locator('#how-to-take-part li').filter({ has: page.getByRole('heading', { name: 'Coinholders', exact: true }) });
      const time = card.locator('time');
      await expect(time).toHaveText('17:15:44 UTC');
      await expect(card.getByText('3,590,254')).toBeVisible();
      const title = await card.getByRole('heading', { name: 'Coinholders' }).boundingBox();
      const stamp = await time.boundingBox();
      expect(stamp!.x).toBeGreaterThanOrEqual(title!.x + title!.width);
      expect(await sidewaysOverflow(page)).toBe(0);
    });

    test(`coinholders can play each wallet tutorial at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/poll');
      await page.getByRole('link', { name: 'Watch wallet tutorials' }).click();
      const gallery = page.getByRole('region', { name: 'Video tutorials' });
      await expect(gallery.locator('video')).toHaveCount(0);
      for (const title of ['Vizor on desktop', 'Vizor on mobile', 'Zodl on mobile']) {
        const trigger = gallery.getByRole('button', { name: `Watch ${title}` });
        await trigger.click();
        const player = page.getByRole('dialog', { name: title }).locator('video');
        await expect.poll(() => player.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
        await player.evaluate(v => { (v as HTMLVideoElement).textTracks[0].mode = 'showing'; });
        await expect.poll(() => player.evaluate(v => (v as HTMLVideoElement).textTracks[0].cues?.length ?? 0)).toBeGreaterThan(0);
        await page.getByRole('button', { name: 'Close video' }).click();
        await expect(player).toHaveCount(0);
        await expect(trigger).toBeFocused();
      }
      expect(await sidewaysOverflow(page)).toBe(0);
    });

    test(`official questions expand and coinholder bars keep their own units at ${width}px`, async ({ page }, testInfo) => {
      const now = Date.parse('2026-11-17T16:30:00Z');
      const snapshot = buildSnapshot(NU7_1_TURNOUT, {
        bodies: {
          coinholders: {
            state: 'fetched', observedAt: '2026-11-17T16:29:00Z',
            data: { value: 18120, points: [], eligible: null, approximate: false, questions: [4800, 4700, 4600, 4000, 20].map((shares, index) => ({ id: index + 1, shares })) },
          },
        },
        casts: { state: 'fetched', observedAt: '2026-11-17T16:28:00Z', data: { height: 900, questions: { 1: 51, 2: 50, 3: 49, 4: 48, 5: 47 } } },
        roster: 203, chainStatus: 'active',
      }, now);
      await page.setViewportSize({ width, height: 900 });
      await page.clock.setFixedTime(now);
      await page.route('**/api/shielded-preview/turnout', (route) => route.fulfill({ json: snapshot }));
      const errors = await open(page, '/poll');
      const questions = page.getByRole('region', { name: 'Coinholder activity by question', exact: true });
      const totals = page.getByLabel('Coinholder activity across all questions');
      await expect(page.getByRole('link', { name: 'Coinholder activity by question' })).toHaveAttribute('href', '#poll-turnout-questions');
      await expect(totals).toContainText('245');
      await expect(totals).toContainText('18,120');
      await expect(questions.locator('summary').first()).toContainText('51 casts');
      await expect(questions.locator('details[open]')).toHaveCount(0);
      await expect(questions.locator('summary').first()).toContainText('4,800 shares');
      await expect(questions.locator('summary [style*="width"]')).toHaveCount(0);
      const first = questions.locator('summary').first();
      await expect(questions.getByText('[ZIP] Wind Down Zcash Community Grants', { exact: true })).toBeHidden();
      await first.focus();
      await first.press('Enter');
      await expect(questions.getByText('[ZIP] Wind Down Zcash Community Grants', { exact: true })).toBeVisible();
      await expect(questions.getByText('Do you support the Wind Down Zcash Community Grants proposal?', { exact: true })).toBeVisible();
      await expect(questions.getByRole('list', { name: 'Answer options' }).getByRole('listitem')).toHaveText(['Support', 'Oppose', 'Abstain']);
      await first.press('Space');
      await expect(questions.getByText('[ZIP] Wind Down Zcash Community Grants', { exact: true })).toBeHidden();
      for (let index = 0; index < 5; index++) await questions.locator('summary').nth(index).click();
      await expect(questions.getByRole('list', { name: 'Answer options' })).toHaveCount(5);
      await expect(questions.getByRole('link', { name: 'Official ballot source' })).toHaveCount(5);
      const shares = page.getByRole('region', { name: 'Coinholder network activity', exact: true });
      await shares.locator('summary').click();
      await expect(shares.getByRole('listitem')).toHaveCount(5);
      await expect(shares.getByRole('listitem').first()).toHaveAccessibleName('Q1 Wind down ZCG: 4,800 shares');
      await expect(shares).toContainText('18,120');
      await expect(shares).toContainText('total shares');
      await expect(shares).not.toContainText('today');
      const resources = page.getByRole('region', { name: 'Resources', exact: true });
      await expect(resources.getByRole('link', { name: 'Zakura vote tracker' })).toHaveAttribute('href', 'https://zakura.com/voting/#vote-290ce255ee4c');
      await expect(questions.getByRole('link', { name: /Zakura/ })).toHaveCount(0);
      for (const theme of ['light', 'dark']) {
        if (await page.locator('html').getAttribute('data-gov-theme') !== theme) await page.getByRole('button', { name: `Switch to the ${theme} theme` }).click();
        expect(await sidewaysOverflow(page)).toBe(0);
        await shares.scrollIntoViewIfNeeded();
        await page.getByRole('region', { name: 'Panel ballots per day', exact: true }).screenshot({ path: testInfo.outputPath(`turnout-${theme}.png`) });
      }
      expect(errors).toEqual([]);
    });
  }

  test('shows the poll alone: its title, the live turnout, and no way into the rest of the portal', async ({ page }) => {
    await open(page, '/poll');
    await expect(page.getByRole('heading', { level: 1, name: 'ZCG / Dev Fund poll' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Panels', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Panel ballots per day' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Governance sections' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Switch to the (light|dark) theme/ })).toBeVisible();
    // Links leave for public sources, write to a help address, or jump within the page; none leads into the portal.
    const internal = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')!).filter((href) => !/^(https?:|mailto:|#)/.test(href)));
    expect(internal).toEqual([]);
    const jumps = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href'), Boolean(document.getElementById(a.getAttribute('href')!.slice(1)))]));
    expect(jumps).toContainEqual(['#how-to-take-part', true]);
    for (const jump of jumps) {
      expect([['#poll-turnout', true], ['#panel-ballots', true], ['#how-to-take-part', true], ['#poll-turnout-questions', true], ['#wallet-tutorials', true], ['#miner-sentiment', true]]).toContainEqual(jump);
    }
    await expect(page.getByRole('heading', { name: 'How to participate' })).toBeVisible();
    // The jump lands below the page's fixed bar, with the block's title in view.
    await page.getByRole('link', { name: 'How to participate' }).click();
    await expect.poll(() => page.evaluate(() => {
      const bar = document.querySelector('header')!.getBoundingClientRect().bottom;
      const title = document.getElementById('take-part-heading')!.getBoundingClientRect().top;
      return title >= bar;
    })).toBe(true);
    expect(await sidewaysOverflow(page)).toBe(0);
  });

  test('the launch address serves the poll at its root and leads everything else back to it', async ({ request }) => {
    const root = await request.get('/', { headers: LAUNCH, maxRedirects: 0 });
    expect(root.status()).toBe(200);
    expect(await root.text()).toContain('ZCG / Dev Fund poll');
    for (const path of ['/governance', '/governance?section=zips', '/landing/index.html']) {
      const response = await request.get(path, { headers: LAUNCH, maxRedirects: 0 });
      expect(response.status(), path).toBe(307);
      expect(response.headers().location, path).toBe('https://governance.shieldedlabs.net/');
    }
    expect((await request.get('/api/shielded-preview/governance', { headers: LAUNCH })).status()).toBe(404);
    expect((await request.get('/api/shielded-preview/turnout', { headers: LAUNCH })).status()).toBe(200);
  });

  test('the preview address keeps the whole portal', async ({ request }) => {
    expect((await request.get('/governance', { maxRedirects: 0 })).status()).toBe(200);
    expect((await request.get('/', { maxRedirects: 0 })).status()).toBe(200);
  });
});
