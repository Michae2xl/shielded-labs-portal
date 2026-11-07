import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { NsmSource } from '@/lib/shielded-preview/nsm/balance';
import { NsmBalanceCard } from './nsm-balance';

const reading = { height: 3_548_884, time: '2026-11-07T17:47:00.000Z', issuedSupplyZat: 1_703_000_000_000_000, balanceZat: 36_870_000_000, removedSinceActivationZat: 11_554_480 };
const render = (source: NsmSource | null, now = Date.parse('2026-11-07T17:47:30.000Z')) => renderToStaticMarkup(createElement(NsmBalanceCard, { source, now }));

describe('NSM balance card', () => {
  it('shows the live balance, its block and what was removed since activation', () => {
    const html = render({ state: 'fetched', observedAt: '2026-11-07T17:47:20.000Z', reading, source: 'https://api.blockchair.com/zcash' });
    expect(html).toContain('368.70000000');
    expect(html).toContain('3,548,884');
    expect(html).toContain('0.11554480');
    expect(html).toContain('30 s ago');
    expect(html).toContain('Live');
    expect(html).toContain('8,939,664');
  });
  it('labels an older reading as the last one received', () => {
    expect(render({ state: 'stale', observedAt: '2026-11-07T17:40:00.000Z', reading, source: 'https://api.blockchair.com/zcash' })).toContain('Last reading');
  });
  it('shows the balance at activation while no reading is available', () => {
    const html = render({ state: 'unavailable', observedAt: null, reading: null, source: 'https://api.blockchair.com/zcash' });
    expect(html).toContain('368.58445520');
    expect(html).toContain('Balance at NU7 activation');
    expect(render(null)).toContain('Loading');
  });
});
