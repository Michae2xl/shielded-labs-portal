import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GovernanceReference } from '@/app/shielded-preview/governance-participation';
import { parseBalanceTab, treasuryPrice, treasurySheetUrl, treasuryTabs } from './treasury';

// Excerpts of the two ZCG sheet tabs as exported on 7 Nov 2026.
const zcgTab = `Status:,OK ✅,,,
Coinbase address balance as of block height:,"3,548,853",,,
Block time (UTC):,7 Nov 2026 17:31:33,UTC,,
ZECUSD price:,"$1,245.13",,,
,,,,
"Summary (at ZECUSD price of $1245.13 and block 3,548,853)",,,,
Current ZEC balance:,"93,657",ZEC,,
USD value of Current ZEC balance:,"$ 116,615,726",,,
Current USD balance:,"$ 8,760,993",,,
Future grant liabilities (total in USD):,"-$ 2,251,246",,,
Total ZEC accrued to date:,"524,116.01",ZEC,,
Total ZEC receivables:,"107,647.33",ZEC,,
Total ZEC paid to grant recipients:,"411,251.94",ZEC,,
"ZEC receivable to the end of the 3rd Dev Fund 
(ZIP 1016 ending Nov 21, 2028 3:05 AM UTC)","107,647.33",ZEC,,`;
const fundTab = `Status:,OK ✅,,
Coinholder Grants balance as of block height:,"3,548,854",,Click here for the live Lockbox / ZIP 1016 / Coinholder Grants balance
Block time (UTC):,7 Nov 2026 17:32:00,UTC,
Current ZEC balance:,"145,641.94",ZEC,
Future grant liabilities (total in USD):,$ 0,,
Total ZEC accrued to date:,"153,529.06",ZEC,
Total ZEC receivables:,"161,470.94",ZEC,
ZEC Outflow,,,
Total ZEC paid to grant recipients:,"7,887.13",ZEC,`;

describe('ZCG treasury sheet', () => {
  it('reads each balance tab by its row labels', () => {
    expect(parseBalanceTab(zcgTab, treasurySheetUrl(treasuryTabs.zcg))).toEqual({
      zec: 93657, usdCash: 8760993, paidOutZec: 411251.94, zecUsd: 1245.13, accruedZec: 524116.01, liabilitiesUsd: 2251246, receivableZec: 107647.33, height: 3548853, blockTime: '2026-11-07T17:31:33.000Z', current: true,
      source: 'https://docs.google.com/spreadsheets/d/1FQ28rDCyRW0TiNxrm3rgD8ai2KGUsXAjPieQmI1kKKg/edit#gid=135980745',
    });
    expect(parseBalanceTab(fundTab, treasurySheetUrl(treasuryTabs.coinholder))).toMatchObject({ zec: 145641.94, usdCash: null, paidOutZec: 7887.13, zecUsd: null, accruedZec: 153529.06, liabilitiesUsd: 0, receivableZec: 161470.94, height: 3548854, current: true });
  });

  it('flags a tab not marked OK and refuses one it cannot read', () => {
    expect(parseBalanceTab(fundTab.replace('OK ✅', 'Updates required'), 'https://docs.google.com/x').current).toBe(false);
    expect(() => parseBalanceTab('<!DOCTYPE html><html></html>', 'https://docs.google.com/x')).toThrow();
    expect(() => parseBalanceTab(fundTab.replace('"145,641.94"', 'n/a'), 'https://docs.google.com/x')).toThrow();
    expect(parseBalanceTab(zcgTab.replace('"$1,245.13"', '$0'), 'https://docs.google.com/x').zecUsd).toBeNull();
  });

  it('values at the live price, else at the price the sheet recorded, else not at all', () => {
    const zcg = parseBalanceTab(zcgTab, treasurySheetUrl(treasuryTabs.zcg));
    expect(treasuryPrice({ usd: 1241.38, observedAt: '2026-11-08T02:54:10.000Z' }, zcg)).toEqual({ usd: 1241.38, observedAt: '2026-11-08T02:54:10.000Z', source: 'CoinGecko', url: 'https://www.coingecko.com/en/coins/zcash' });
    expect(treasuryPrice(null, zcg)).toEqual({ usd: 1245.13, observedAt: '2026-11-07T17:31:33.000Z', source: 'sheet', url: zcg.source });
    expect(treasuryPrice(null, { ...zcg, zecUsd: null })).toBeNull();
  });

  it('lays both treasuries out as one table, each figure in its own side\'s column', () => {
    const zcg = parseBalanceTab(zcgTab, treasurySheetUrl(treasuryTabs.zcg));
    const coinholder = parseBalanceTab(fundTab, treasurySheetUrl(treasuryTabs.coinholder));
    const card = (price: ReturnType<typeof treasuryPrice>, fund = coinholder, own = zcg) => renderToStaticMarkup(createElement(GovernanceReference, { treasury: {
      data: { zcg: own, coinholder: fund, price }, state: 'fetched', observedAt: '2026-11-08T03:00:00.000Z', url: treasurySheetUrl(treasuryTabs.zcg),
    } }));
    const row = (label: string, ours: string, theirs: string) => `<th scope="row">${label}</th><td>${ours}</td><td>${theirs}</td>`;
    const live = card(treasuryPrice({ usd: 1241.38, observedAt: '2026-11-08T02:54:10.000Z' }, zcg));
    // The split's slices are the column headers: ZCG first, then the coinholder fund.
    expect(live).toMatch(/<th scope="col">(?:(?!<\/th>)[\s\S])*>ZCG<(?:(?!<\/th>)[\s\S])*8%[\s\S]*?<\/th><th scope="col">(?:(?!<\/th>)[\s\S])*Coinholder fund[\s\S]*?12%/);
    for (const text of [
      row('ZEC held', '93,657 ZEC', '145,642 ZEC'), row('USD held', '$8.8M', '—'), row('Current value', '≈ $125.0M', '≈ $180.8M'),
      row('Accrued to date', '524,116 ZEC', '153,529 ZEC'), row('Paid to grants', '411,252 ZEC', '7,887 ZEC'), row('Grant liabilities', '$2.3M', '$0'),
      row('Receivable to Nov 2028', '107,647 ZEC', '161,471 ZEC'),
      'ZCG treasury sheet', ', 7 Nov 2026.', 'Valued at $1,241.38 per ZEC (', '>CoinGecko<', ', 8 Nov, 02:54 UTC).',
    ]) expect(live).toContain(text);
    expect(card(null, { ...coinholder, receivableZec: null })).toContain(row('Receivable to Nov 2028', '107,647 ZEC', '—'));
    // A row neither side reports is left out rather than shown as two dashes.
    expect(card(null, { ...coinholder, accruedZec: null }, { ...zcg, accruedZec: null })).not.toContain('Accrued to date');
    // Without the feed, the sheet's own price values both sides, and says so.
    const sheet = card(treasuryPrice(null, zcg));
    for (const text of [row('Value', '≈ $125.4M', '≈ $181.3M'), 'Valued at $1,245.13 per ZEC, the price the sheet recorded.']) expect(sheet).toContain(text);
    for (const text of ['Current value', 'CoinGecko']) expect(sheet).not.toContain(text);
    const unpriced = card(null);
    expect(unpriced).toContain(row('ZEC held', '93,657 ZEC', '145,642 ZEC'));
    expect(unpriced).not.toContain('≈');
    const bare = renderToStaticMarkup(createElement(GovernanceReference, {}));
    expect(bare).toContain('Share of block rewards');
    expect(bare).not.toContain('ZEC');
  });
});
