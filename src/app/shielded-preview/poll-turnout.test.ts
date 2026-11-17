import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NU7_1_TURNOUT, buildSnapshot } from '@/lib/shielded-preview/poll-turnout/turnout';
import { PollTurnoutCard } from './poll-turnout';

const NOW = Date.parse('2026-11-17T01:10:00Z');
const helios = (value: number, eligible: number, at: string) => ({
  state: 'fetched' as const,
  observedAt: '2026-11-17T01:09:00.000Z',
  data: { value, points: [{ at: Date.parse(at), value }], eligible, approximate: false },
});
const SNAPSHOT = buildSnapshot(
  NU7_1_TURNOUT,
  {
    bodies: {
      coinholders: {
        state: 'fetched',
        observedAt: '2026-11-17T01:09:30.000Z',
        data: { value: 136, points: [{ at: Date.parse('2026-11-16T17:30:05Z'), value: 1 }, { at: Date.parse('2026-11-17T00:58:00Z'), value: 136 }], eligible: null, approximate: false, questions: [1, 2, 3, 4, 5].map((id) => ({ id, votes: 136 })), unread: 0 },
      },
      'zcash-brasil': helios(3, 18, '2026-11-16T12:24:46Z'),
      zechub: helios(1, 23, '2026-11-16T16:43:47Z'),
    },
    roster: 203,
    chainStatus: 'active',
  },
  NOW,
);
const html = (props: Parameters<typeof PollTurnoutCard>[0]) => renderToStaticMarkup(createElement(PollTurnoutCard, { now: NOW, ...props }));
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('live turnout panel', () => {
  it('shows one card per body: who it is, its count, its share of who may vote, and where the count comes from', () => {
    const out = text(html({ snapshot: SNAPSHOT }));
    expect(out).toContain('Live turnout NU7.1 poll · day 2 of 15 · closes 1 Dec, 02:59 UTC');
    expect(out).toContain('Coinholders 136 votes 11% of last poll 16 Nov Now Live · Vote chain ↗');
    expect(out).toContain('ZCAP 33 ballots 16% of 203 · last poll 68% 16 Nov Now By hand 02:20 UTC · SIV ↗');
    expect(out).toContain('Zcash Brasil 3 ballots 17% of 18 16 Nov Now Live · Helios ↗');
    expect(out).toContain('ZecHub 1 ballot 4% of 23 16 Nov Now Live · Helios ↗');
    expect(out).toContain('Q1 Wind down ZCG 136');
    expect(out).toContain('Counts only: one ballot per panel member; coinholder votes on the most-answered question.');
    expect(out).toContain('So far Whole poll');
  });
  it('marks each body with its logo, and the coinholder vote with the wallets named for this round, each leading to its site', () => {
    const markup = html({ snapshot: SNAPSHOT });
    for (const [name, href] of [['Vizor', 'https://vizor.cash'], ['ZODL', 'https://zodl.com'], ['Zkool', 'https://github.com/hhanh00/zkool2']]) {
      expect(markup).toContain(`href="${href}"`);
      expect(markup).toContain(`aria-label="${name}, wallet site"`);
    }
    for (const name of ['Zcash Foundation', 'Zcash Brasil', 'ZecHub']) expect(markup).toContain(`aria-label="${name}"`);
    expect(markup.match(/<img /g)).toHaveLength(6);
  });
  it('sets the coinholder pace beside the earlier round’s, at the same time after each round’s first vote', () => {
    const out = text(html({ snapshot: SNAPSHOT }));
    expect(out).toMatch(/136 coinholder votes a question \d+ hours after the first vote\. The NU7 scope poll, Sep 2026 had ≈ [\d,]+ at the same point \(dashed line\)\./);
  });
  it('lays the cards out four to a row at most', () => {
    expect(html({ snapshot: SNAPSHOT })).toContain('--cards:4');
  });
  it('marks a reading the browser could not refresh as the last one', () => {
    expect(text(html({ snapshot: SNAPSHOT, failed: true }))).toContain('Last reading');
  });
  it('waits without numbers before the first reading', () => {
    const out = text(html({ snapshot: null }));
    expect(out).toContain('Loading');
    expect(out).not.toMatch(/\d+ ballots/);
  });
  it('keeps a daily table for reading without the charts', () => {
    const out = text(html({ snapshot: SNAPSHOT }));
    expect(out).toContain('Daily counts');
    expect(out).toContain('16 Nov 1 24 3 1 17 Nov 136 29 3 1');
  });
  it('opens every link in a new tab without leaking the opener', () => {
    for (const [, attrs] of html({ snapshot: SNAPSHOT }).matchAll(/<a ([^>]+)>/g)) {
      expect(attrs).toContain('target="_blank"');
      expect(attrs).toContain('rel="noopener noreferrer"');
      expect(attrs).toMatch(/href="https:\/\//);
    }
  });
});
