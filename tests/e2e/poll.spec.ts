import { expect, test } from '@playwright/test';
import { open, sidewaysOverflow } from './support';

const LAUNCH = { host: 'governance.shieldedlabs.net' };

test.describe('The poll as a site of its own', () => {
  test('shows the poll alone: its title, the live turnout, and no way into the rest of the portal', async ({ page }) => {
    await open(page, '/poll');
    await expect(page.getByRole('heading', { level: 1, name: 'ZCG / Dev Fund poll' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Live turnout' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Votes per day' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Governance sections' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Switch to the (light|dark) theme/ })).toBeVisible();
    const internal = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')!).filter((href) => !/^https?:/.test(href)));
    expect(internal).toEqual([]);
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
