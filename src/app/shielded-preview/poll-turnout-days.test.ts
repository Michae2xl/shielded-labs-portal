import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NU7_1_TURNOUT, buildSnapshot } from '@/lib/shielded-preview/poll-turnout/turnout';
import { TurnoutByDayCard } from './poll-turnout-days';

const NOW = Date.parse('2026-11-17T01:30:00Z');
const at = (iso: string) => Date.parse(iso);
const SNAPSHOT = buildSnapshot(
  NU7_1_TURNOUT,
  {
    bodies: {
      coinholders: {
        state: 'fetched',
        observedAt: '2026-11-17T01:29:00.000Z',
        data: { value: 144, points: [{ at: at('2026-11-16T22:00:00Z'), value: 124 }, { at: at('2026-11-17T01:20:00Z'), value: 144 }], eligible: null, approximate: false, questions: [] },
      },
      'zcash-brasil': { state: 'fetched', observedAt: '2026-11-17T01:29:00.000Z', data: { value: 3, points: [{ at: at('2026-11-16T12:24:46Z'), value: 3 }], eligible: 18, approximate: false } },
      zechub: { state: 'fetched', observedAt: '2026-11-17T01:29:00.000Z', data: { value: 1, points: [{ at: at('2026-11-16T16:43:47Z'), value: 1 }], eligible: 23, approximate: false } },
    },
    roster: 203,
    chainStatus: 'active',
  },
  NOW,
);
const html = (snapshot: typeof SNAPSHOT | null) => renderToStaticMarkup(createElement(TurnoutByDayCard, { snapshot, now: NOW }));
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('panel ballots per day', () => {
  it('gives each body a row with what it added today, across the fifteen days of the poll', () => {
    const out = text(html(SNAPSHOT));
    expect(out).toContain('Panel ballots per day New each day · UTC');
    // Each day's count on its bar, then what the body added today.
    expect(out).not.toContain('Coinholders');
    expect(out).toContain('ZCAP 24 5 +5 today');
    expect(out).toContain('Zcash Brasil 3 0 0 today');
    expect(out).toContain('ZecHub 1 0 0 today');
    expect(out).toContain('Nov 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30');
    expect(out).toContain('ZCAP uses changes between observed totals; vote times are not published.');
  });
  it('reads every day so far aloud, row by row', () => {
    const markup = html(SNAPSHOT);
    expect(markup).not.toContain('aria-label="Coinholders:');
    expect(markup).toContain('aria-label="ZCAP: 24 on 16 Nov, 5 on 17 Nov"');
    expect(markup.match(/data-future="true"/g)).toHaveLength(3 * 13);
  });
  it('puts a count inside a bar with room for it, on top of a short one, and marks a day with none', () => {
    const markup = html(SNAPSHOT);
    // ZCAP: 24 fills the bar; 5 is about a fifth, so it sits above.
    expect(markup).toMatch(/<i style="height:100\.0%"><b>24<\/b><\/i>/);
    expect(markup).toMatch(/<i style="height:20\.8%"><\/i><b class="[^"]*" style="bottom:calc\(20\.8% \+ 4px\)">5<\/b>/);
    expect(markup).toMatch(/<b class="[^"]*" data-zero="true">0<\/b>/);
  });
  it('waits without numbers before the first reading', () => {
    const out = text(html(null));
    expect(out).toContain('Reading the vote chain and the panels.');
    expect(out).not.toMatch(/today/);
  });
});
