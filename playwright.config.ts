import { defineConfig } from '@playwright/test';

// Screen checks run against the production build (`npm run build` first), on their own port so a
// running preview is never touched. They drive the installed Chrome: no browser download.
const port = Number(process.env.E2E_PORT ?? 4258);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 45_000,
  use: { baseURL: `http://127.0.0.1:${port}`, channel: 'chrome', trace: 'retain-on-failure' },
  webServer: {
    command: `npx next start --hostname 127.0.0.1 --port ${port}`,
    env: { SHIELDED_LABS_PREVIEW: '1' },
    url: `http://127.0.0.1:${port}/shielded-preview`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
