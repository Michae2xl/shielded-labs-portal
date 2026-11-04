import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import Governance from '@/app/shielded-preview/governance';
import { comparisons } from './comparisons';
import record from './governance-data/record.json';

const captured = vi.hoisted(() => ({
  effects: [] as { effect: () => void | (() => void); dependencies: readonly unknown[] }[],
  writes: [] as { initial: unknown; value: unknown }[],
  navigate: undefined as undefined | ((section: 'Overview') => void),
  initialOverrides: new Map<unknown, unknown>(),
}));

// Run the actual navigation handler and effect subscription without requiring a DOM.
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: (effect: () => void | (() => void), dependencies: readonly unknown[] = []) => { captured.effects.push({ effect, dependencies }); },
  useState: (initial: unknown) => [captured.initialOverrides.has(initial) ? captured.initialOverrides.get(initial) : initial, (value: unknown) => { captured.writes.push({ initial, value }); }],
}));
vi.mock('@/app/shielded-preview/governance-navigation', async importOriginal => ({
  ...await importOriginal<typeof import('@/app/shielded-preview/governance-navigation')>(),
  default: ({ onChange }: { onChange: (section: 'Overview') => void }) => { captured.navigate = onChange; return null; },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  captured.effects.length = 0;
  captured.writes.length = 0;
  captured.navigate = undefined;
  captured.initialOverrides.clear();
});

it('shows a missing record state when a deep link uses a poll ID outside Voting', () => {
  const poll = record.polls.find(poll => poll.kind !== 'test')!;
  captured.initialOverrides.set(null, `poll:${poll.id}`);
  for (const section of ['Overview', 'Insights']) {
    captured.initialOverrides.set('Overview', section);
    const html = renderToStaticMarkup(createElement(Governance));
    expect(html).toContain('Record not found');
    expect(html).toContain(`Back to ${section.toLowerCase()}`);
  }
});

it('resets the NU7 selector when active Overview or the outer Governance route clears its question', () => {
  vi.useFakeTimers();
  const location = { search: '?view=governance&question=blocks', href: 'https://portal.example/?view=governance&question=blocks' };
  const window = Object.assign(new EventTarget(), { scrollTo: vi.fn(), location });
  vi.stubGlobal('location', location);
  vi.stubGlobal('window', window);
  vi.stubGlobal('history', { pushState: (_state: unknown, _unused: string, url: string) => { location.search = new URL(url, 'https://portal.example').search; } });
  renderToStaticMarkup(createElement(Governance));
  const subscription = captured.effects.find(({ dependencies }) => dependencies[0] === comparisons.rounds[0])!;
  expect(subscription).toBeDefined();
  const cleanup = subscription.effect();
  const selected = () => captured.writes.filter(write => write.initial === comparisons.rounds[0].questions[0].id).at(-1)?.value;
  vi.runOnlyPendingTimers();
  expect(selected()).toBe('blocks');

  captured.navigate!('Overview');
  expect(location.search).toBe('?view=governance&section=overview');
  expect(selected()).toBe('issuance');

  location.search = '?view=governance&question=blocks';
  window.dispatchEvent(new Event('popstate'));
  expect(selected()).toBe('blocks');
  location.search = '?view=governance';
  window.dispatchEvent(new Event('shielded:navigate'));
  expect(selected()).toBe('issuance');

  if (typeof cleanup === 'function') cleanup();
  const count = captured.writes.length;
  location.search = '?view=governance&question=blocks';
  window.dispatchEvent(new Event('shielded:navigate'));
  window.dispatchEvent(new Event('popstate'));
  expect(captured.writes).toHaveLength(count);
});
