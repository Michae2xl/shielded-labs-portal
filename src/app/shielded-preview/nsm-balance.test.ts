import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { NsmSource } from '@/lib/shielded-preview/nsm/balance';
import { NsmBalanceCard, NsmCardSignalView } from './nsm-balance';

const reading = { height: 3_548_884, time: '2026-11-07T17:47:00.000Z', issuedSupplyZat: 1_703_000_000_000_000, balanceZat: 36_870_000_000, removedSinceActivationZat: 11_554_480 };
const live: NsmSource = { state: 'fetched', observedAt: '2026-11-07T17:47:20.000Z', reading, source: 'https://api.blockchair.com/zcash' };
const now = Date.parse('2026-11-07T17:47:30.000Z');
const card = (source: NsmSource | null) => renderToStaticMarkup(createElement(NsmBalanceCard, { source, now }));
const signal = (source: NsmSource | null) => renderToStaticMarkup(createElement(NsmCardSignalView, { source, now }));

describe('NSM balance card', () => {
  it('shows the live balance with its block, and how it splits into the initial balance and what was removed since', () => {
    const html = card(live);
    expect(html).toContain('value="36870000000"');
    expect(html).toContain('>368<');
    expect(html).toContain('>.70000000<');
    expect(html).toContain('Block 3,548,884 · 30 s ago');
    expect(html).toContain('Live');
    expect(html).toContain('368.58445520');
    expect(html).toContain('+0.11554480');
    expect(html).toContain('Block 8,939,664');
    expect(html).toContain('Estimated Feb 2031 at 25-second blocks');
  });
  it('labels an older reading as the last one received', () => {
    expect(card({ ...live, state: 'stale' })).toContain('Last reading');
  });
  it('shows the balance at activation while no reading is available', () => {
    const html = card({ state: 'unavailable', observedAt: null, reading: null, source: live.source });
    expect(html).toContain('value="36858445520"');
    expect(html).toContain('Balance at NU7 activation');
    expect(card(null)).toContain('Loading');
  });
});

describe('NSM project card signal', () => {
  it('puts the live balance in a readout where other projects show their latest update', () => {
    const html = signal(live);
    expect(html).toContain('NSM balance');
    expect(html).toContain('value="36870000000"');
    expect(html).toContain('<dt>Since NU7</dt><dd>+0.11554480 ZEC</dd>');
    expect(html).toContain('<dt>Block</dt><dd>3,548,884 · 30 s ago</dd>');
  });
  it('waits for the first reading without inventing a number', () => {
    expect(signal(null)).toContain('Reading the chain tip');
    expect(signal(null)).not.toContain('value=');
  });
});
