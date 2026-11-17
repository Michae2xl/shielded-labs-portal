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
        data: { value: 144, points: [{ at: at('2026-11-16T22:00:00Z'), value: 124 }, { at: at('2026-11-17T01:20:00Z'), value: 144 }], eligible: null, approximate: false, questions: [], unread: 0 },
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

describe('votes per day', () => {
  it('gives each body a row with what it added today, across the fifteen days of the poll', () => {
    const out = text(html(SNAPSHOT));
    expect(out).toContain('Votes per day New each day · UTC');
    expect(out).toContain('Coinholders +20 today');
    expect(out).toContain('ZCAP +5 today');
    expect(out).toContain('Zcash Brasil 0 today');
    expect(out).toContain('ZecHub 0 today');
    expect(out).toContain('16 Nov 30 Nov');
    expect(out).toContain('ZCAP from counts read by hand.');
  });
  it('reads every day so far aloud, row by row', () => {
    const markup = html(SNAPSHOT);
    expect(markup).toContain('aria-label="Coinholders: 124 on 16 Nov, 20 on 17 Nov"');
    expect(markup).toContain('aria-label="ZCAP: 24 on 16 Nov, 5 on 17 Nov"');
    expect(markup.match(/data-future="true"/g)).toHaveLength(4 * 13);
  });
  it('waits without numbers before the first reading', () => {
    const out = text(html(null));
    expect(out).toContain('Reading the vote chain and the panels.');
    expect(out).not.toMatch(/today/);
  });
});
