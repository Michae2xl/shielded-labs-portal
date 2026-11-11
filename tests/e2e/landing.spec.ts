import { expect, test } from '@playwright/test';
import { open, sidewaysOverflow, viewports } from './support';

/**
 * The landing proposal is a static page served beside the portal (public/landing). It has to open on its
 * short address, draw its panorama, and keep the Support page free of anything that looks like a real address.
 */
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
    });
  });
}
