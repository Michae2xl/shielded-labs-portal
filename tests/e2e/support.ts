import { expect, type Page } from '@playwright/test';

export const viewports = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

// The governance portal answers on its own address; a query here starts with `&`, as it did under `?view=governance`.
const governance = (query = '') => `/governance${query ? `?${query.slice(1)}` : ''}`;
const explorer = (query: string) => governance(`&section=zips&topic=dev-fund${query}`);
export const library = (query = '') => governance(`&section=zips&topic=library${query}`);

/** Every screen a reader can reach from the navigation. */
export const screens = [
  { name: 'overview', path: '/shielded-preview?view=overview' },
  { name: 'projects', path: '/shielded-preview?view=projects' },
  { name: 'crosslink videos', path: '/shielded-preview?view=projects&project=crosslink&section=participate&record=videos' },
  { name: 'milestones', path: '/shielded-preview?view=impact' },
  { name: 'code activity', path: '/shielded-preview?view=activity' },
  { name: 'team', path: '/shielded-preview?view=people' },
  { name: 'blog', path: '/shielded-preview?view=blog' },
  { name: 'about', path: '/shielded-preview?view=about' },
  { name: 'governance overview', path: governance() },
  { name: 'how it works', path: governance('&section=how-it-works') },
  { name: 'proposals', path: governance('&section=proposals') },
  { name: 'proposal history', path: governance('&section=proposals&lane=history') },
  { name: 'coinholder proposals', path: governance('&section=proposals&lane=coinholder') },
  { name: 'grants', path: governance('&section=grants') },
  { name: 'scheduled payments', path: governance('&section=grants&lane=schedule') },
  { name: 'meeting minutes', path: governance('&section=grants&lane=minutes') },
  { name: 'voting', path: governance('&section=voting') },
  { name: 'poll archive', path: governance('&section=voting&lane=archive') },
  { name: 'network upgrades', path: governance('&section=voting&lane=upgrades') },
  { name: 'upgrade under discussion', path: governance('&section=voting&lane=upgrades&record=upgrade:NU8') },
  { name: 'upgrade tied to a poll', path: governance('&section=voting&lane=upgrades&record=upgrade:NU7.1') },
  { name: 'dev fund calendar', path: governance('&section=voting&lane=dev-fund') },
  { name: 'results', path: governance('&section=results') },
  { name: 'elections', path: governance('&section=results&lane=elections') },
  { name: 'zcap', path: governance('&section=zcap') },
  { name: 'zcap members', path: governance('&section=zcap&lane=members') },
  { name: 'zip library', path: library() },
  { name: 'zip pull requests', path: library('&lane=proposals') },
  { name: 'proposal list', path: explorer('&layout=list') },
  { name: 'proposal map', path: explorer('&layout=map&panel=network') },
  { name: 'public positions', path: explorer('&layout=map&panel=signals') },
  { name: 'statement timeline', path: explorer('&layout=map&panel=timeline') },
  { name: 'proposal comparison', path: explorer('&layout=compare&compare=zap,lockbox') },
  { name: 'insights', path: governance('&section=insights') },
  { name: 'transparency', path: governance('&section=transparency') },
  { name: 'transparency involvement', path: governance('&section=transparency&lane=involvement') },
  { name: 'transparency evidence', path: governance('&section=transparency&lane=evidence') },
  { name: 'transparency policy', path: governance('&section=transparency&lane=method') },
] as const;

/** Lists drawn with the shared archive grid: a label, then fixed measure columns. */
export const archiveLists = [
  { name: 'proposals', path: governance('&section=proposals') },
  { name: 'proposal history', path: governance('&section=proposals&lane=history') },
  { name: 'grants', path: governance('&section=grants') },
  { name: 'scheduled payments', path: governance('&section=grants&lane=schedule') },
  { name: 'meeting minutes', path: governance('&section=grants&lane=minutes') },
  { name: 'poll archive', path: governance('&section=voting&lane=archive') },
  { name: 'network upgrades', path: governance('&section=voting&lane=upgrades') },
  { name: 'results', path: governance('&section=results') },
  { name: 'elections', path: governance('&section=results&lane=elections') },
  { name: 'numbered zips', path: library() },
  { name: 'draft zips', path: library('&lane=drafts') },
  { name: 'zip guides', path: library('&lane=guides') },
  { name: 'zip pull requests', path: library('&lane=proposals') },
] as const;

/** Open a screen and let it settle: live sources may be slow or absent, the bundled snapshot must still render. */
export async function open(page: Page, path: string) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main').first()).toBeVisible();
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => { /* a slow source is not a layout failure */ });
  return errors;
}

/** Pixels the document scrolls sideways; anything above zero means content escaped the viewport. */
export const sidewaysOverflow = (page: Page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
