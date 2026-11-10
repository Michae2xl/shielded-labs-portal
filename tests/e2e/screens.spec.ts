import { expect, test } from '@playwright/test';
import { open, screens, sidewaysOverflow, viewports } from './support';

for (const viewport of viewports) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    for (const screen of screens) {
      test(`${screen.name} renders without errors or sideways scroll`, async ({ page }) => {
        const errors = await open(page, screen.path);
        expect(errors, 'uncaught errors in the page').toEqual([]);
        expect(await sidewaysOverflow(page), 'pixels of sideways scroll').toBeLessThanOrEqual(1);
      });
    }
  });
}
