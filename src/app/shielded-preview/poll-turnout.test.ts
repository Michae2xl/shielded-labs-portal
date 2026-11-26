import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NU7_1_TURNOUT, buildSnapshot } from '@/lib/shielded-preview/poll-turnout/turnout';
import { PollTurnoutCard } from './poll-turnout';

// The latest ZCAP count read by hand: each new reading is one line in turnout.ts, and these tests follow it.
const ZCAP_SOURCE = NU7_1_TURNOUT.sources.find((source) => source.id === 'zcap');
const ZCAP_LAST = (ZCAP_SOURCE?.kind === 'siv' ? ZCAP_SOURCE.readings : []).at(-1)!;

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
        data: { value: 680, points: [], eligible: null, approximate: false, questions: [1, 2, 3, 4, 5].map((id) => ({ id, shares: 136 })) },
      },
      'zcash-brasil': helios(3, 18, '2026-11-16T12:24:46Z'),
      zechub: helios(1, 23, '2026-11-16T16:43:47Z'),
      'engineering-caucus': helios(2, 8, '2026-11-17T00:10:00Z'),
    },
    casts: { state: 'fetched', observedAt: '2026-11-17T01:08:00Z', data: { height: 300, questions: { 1: 12, 2: 11, 3: 10, 4: 9, 5: 0 } } },
    roster: 203,
    chainStatus: 'active',
  },
  NOW,
);
const html = (props: Parameters<typeof PollTurnoutCard>[0]) => renderToStaticMarkup(createElement(PollTurnoutCard, { now: NOW, ...props }));
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replaceAll('&#x27;', "'").replace(/\s+/g, ' ');

describe('live turnout panel', () => {
  it('shows one card per body: who it is, its count, its share of who may vote, and where the count comes from', () => {
    const out = text(html({ snapshot: SNAPSHOT }));
    expect(out).toContain('Panels NU7.1 poll · day 2 of 15 · closes 1 Dec, 02:59 UTC');
    expect(out).toContain('Casts 42 1% of the NU7 scope poll NU7.1 42 NU7 scope 6,677 NU7 scope poll: 6,677 casts in all. Observed 17 Nov, 01:08 UTC Shares on chain 680 Observed 17 Nov, 01:09 UTC In queue — Awaiting a reading');
    expect(out).toContain(`ZCAP ${ZCAP_LAST.ballots} ballots ${Math.round((ZCAP_LAST.ballots / 203) * 100)}% of 203 · last poll 68% 16 Nov Now Saved ${ZCAP_LAST.at.slice(11, 16)} UTC · SIV ↗`);
    expect(out).toContain('Zcash Brasil 3 ballots 17% of 18 16 Nov Now Live · Helios ↗');
    expect(out).toContain('ZecHub 1 ballot 4% of 23 16 Nov Now Live · Helios ↗');
    expect(out).toContain('Zcash Engineering Caucus 2 ballots 25% of 8 16 Nov Now Live · Helios ↗');
    expect(out).toContain('Q1 Wind down ZCG');
    expect(out).toContain('Casts 42');
    expect(out).toContain('Shares on chain 680');
    expect(out).toContain('So far Whole poll');
  });
  it('marks each body with its logo, and the coinholder vote with the wallets named for this round, each leading to its site', () => {
    const markup = html({ snapshot: SNAPSHOT });
    for (const [name, href] of [['Vizor', 'https://vizor.cash'], ['ZODL', 'https://zodl.com'], ['Zkool', 'https://github.com/hhanh00/zkool2']]) {
      expect(markup).toContain(`href="${href}"`);
      expect(markup).toContain(`aria-label="${name}, wallet site"`);
    }
    for (const name of ['Zcash Foundation', 'Zcash Brasil', 'ZecHub', 'Zcash Engineering Caucus']) expect(markup).toContain(`aria-label="${name}"`);
    expect(markup.match(/aria-label="[^"]+, wallet site"/g)).toHaveLength(3);
  });
  it('shows the same activity metric for every question in ballot order with the observation time', () => {
    const markup = html({ snapshot: SNAPSHOT });
    const summaries = Array.from(markup.matchAll(/<summary[^>]*>(.*?)<\/summary>/gs), (m) => text(m[1]).trim());
    expect(summaries.slice(0, 5)).toEqual(SNAPSHOT.questions.map((q) => `Q${q.id} ${q.label} ${SNAPSHOT.casts?.data?.questions[q.id]} casts 136 shares`));
    expect(markup.toLowerCase()).toContain('datetime="2026-11-17t01:09:30.000z"');
    expect(markup).not.toContain('Zcash Grants Hub');
    expect(markup).not.toContain('details open');
  });
  it('distinguishes no activity from a missing reading', () => {
    const questions = SNAPSHOT.questions.map((q) => ({ ...q, shares: 0 }));
    const allZero = { ...SNAPSHOT, questions, bodies: SNAPSHOT.bodies.map((b) => b.unit === 'shares' ? { ...b, value: 0 } : b) };
    expect(text(html({ snapshot: allZero }))).toContain('Shares on chain 0');
    const missing = { ...allZero, questions: questions.map((q) => ({ ...q, shares: null })), bodies: allZero.bodies.map((b) => b.unit === 'shares' ? { ...b, value: null, observedAt: null, state: 'unavailable' as const } : b) };
    const out = text(html({ snapshot: missing }));
    expect(out).toContain('Shares on chain —');
    expect(out).toContain('Awaiting a reading');
    expect(out).toContain('Casts 42');
    expect(text(html({ snapshot: { ...SNAPSHOT, casts: undefined } }))).toContain('Casts — Awaiting a reading');
  });
  it('includes the official wording and answer options for all five expandable questions', () => {
    const markup = html({ snapshot: SNAPSHOT });
    const out = text(markup);
    expect(out).toContain('[ZIP] Wind Down Zcash Community Grants');
    expect(out).toContain('Do you support the Wind Down Zcash Community Grants proposal?');
    expect(out).toContain('Do you support the Future Dev and Legal Defense Fund proposal?');
    expect(out).toContain('Do you support the Zcash Adoption Pool (ZAP) proposal?');
    expect(out).toContain('Do you support maintaining ZCG’s existing funding and operations?');
    expect(out).toContain('Assuming it can be done safely in a network upgrade, do you support reducing Zcash’s target block time from 25 seconds to 20 seconds?');
    expect(markup.match(/aria-label="Answer options"/g)).toHaveLength(5);
    expect(out.match(/Support Oppose Abstain/g)).toHaveLength(5);
  });
  it('only shows live-round answer weights after a complete final tally', () => {
    const questions = SNAPSHOT.questions.map((q) => ({ ...q, results: [{ label: 'Support', zec: 40.125 }, { label: 'Abstain', zec: 0 }] }));
    const card = (phase: typeof SNAPSHOT.phase, rows = questions) => text(html({ snapshot: { ...SNAPSHOT, phase, questions: rows } }));
    expect(card('open')).not.toContain('40.125 ZEC');
    expect(card('counting')).toContain('Awaiting tally');
    expect(card('counting')).not.toContain('40.125 ZEC');
    expect(card('closed')).toContain('40.125 ZEC · 100%');
    expect(html({ snapshot: { ...SNAPSHOT, phase: 'closed', questions } })).not.toMatch(/<details[^>]*\sopen[\s=>]/);
    expect(card('closed')).toContain('Abstain 0 ZEC · 0%');
    expect(card('closed', questions.map((q, i) => i ? q : { ...q, results: [] }))).toContain('Tally unavailable');
  });
  it('does not attach NU7.1 wording to a different round', () => {
    expect(text(html({ snapshot: { ...SNAPSHOT, round: 'A later poll' } }))).not.toContain('[ZIP] Wind Down Zcash Community Grants');
  });
  it('keeps verified casts visible before the first share reading', () => {
    const down = buildSnapshot(
      NU7_1_TURNOUT,
      {
        bodies: { coinholders: { state: 'unavailable', observedAt: null, data: null }, 'zcash-brasil': helios(3, 18, '2026-11-16T12:24:46Z'), zechub: helios(1, 23, '2026-11-16T16:43:47Z') },
        casts: { state: 'fetched', observedAt: '2026-11-17T01:08:00Z', data: { height: 300, questions: { 1: 12, 2: 11, 3: 10, 4: 9, 5: 0 } } },
        roster: 203,
        chainStatus: 'active',
      },
      NOW,
    );
    const out = text(html({ snapshot: down, failed: false }));
    expect(out).toContain('Casts 42 1% of the NU7 scope poll NU7.1 42 NU7 scope 6,677 NU7 scope poll: 6,677 casts in all. Observed 17 Nov, 01:08 UTC Shares on chain — Awaiting a reading In queue — Awaiting a reading');
    expect(out).not.toMatch(/Estimate|≈/);
  });
  describe('coinholder activity with the share queue', () => {
    const day = (iso: string) => Date.parse(iso);
    const queue = {
      servers: 15, asked: 15, waiting: 915, overdue: 2, failed: 0, sent: 682, lastDueAt: '2026-11-30T05:10:00.000Z', perHour: 12,
      days: [
        { day: day('2026-11-16T00:00:00Z'), sent: 500, waiting: 0 },
        { day: day('2026-11-17T00:00:00Z'), sent: 182, waiting: 115 },
        { day: day('2026-11-18T00:00:00Z'), sent: 0, waiting: 800 },
      ],
    };
    const casts = { state: 'fetched' as const, observedAt: '2026-11-17T01:08:00Z', data: { height: 300, questions: { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 } } };
    const withQueue = { ...SNAPSHOT, casts, queue: { state: 'fetched' as const, observedAt: '2026-11-17T01:09:40Z', data: queue } };

    it('sets shares on the chain against the 16 each cast will send, and the last poll beside both', () => {
      const out = text(html({ snapshot: withQueue }));
      expect(out).toContain('Casts 100 1% of the NU7 scope poll NU7.1 100 NU7 scope 6,677');
      expect(out).toContain('Shares on chain 680 43% of 1,600 expected NU7 scope poll ended with 104,092 Observed 17 Nov, 01:09 UTC');
    });
    it('says how many shares wait, until when, at what pace, and how many servers answered', () => {
      const out = text(html({ snapshot: withQueue }));
      expect(out).toContain('In queue ≈ 915 shares scheduled through 30 Nov ≈ 12 an hour now 15 servers answering Observed 17 Nov, 01:09 UTC');
      const partial = text(html({ snapshot: { ...withQueue, queue: { ...withQueue.queue, data: { ...queue, servers: 12, overdue: 70 } } } }));
      expect(partial).toContain('12 of 15 servers answering, 70 shares running late');
    });
    it('lays the shares on the poll’s days, sent and scheduled, with today marked', () => {
      const markup = html({ snapshot: withQueue });
      expect(text(markup)).toContain('Shares by day Sent to the chain Scheduled');
      expect(markup).toContain('aria-label="16 Nov: 500 sent, 0 scheduled"');
      expect(markup).toMatch(/data-today="true" aria-label="17 Nov: 182 sent, 115 scheduled"/);
      expect(markup).toContain('aria-label="18 Nov: 0 sent, 800 scheduled"');
      expect(text(markup)).toContain('From the public queue summaries of the 15 submission servers, each share counted once.');
    });
    it('falls back to what the casts imply when the servers do not answer, and says so', () => {
      const out = text(html({ snapshot: { ...withQueue, queue: { state: 'unavailable', observedAt: null, data: null } } }));
      expect(out).toContain('In queue ≈ 920 shares, from 16 a cast Observed 17 Nov, 01:08 UTC');
      expect(out).not.toContain('Shares by day');
    });
    it('derives nothing from a cast count kept from an earlier reading', () => {
      const out = text(html({ snapshot: { ...withQueue, casts: { ...casts, state: 'stale' }, queue: undefined } }));
      expect(out).toContain('Casts 100 Last available 17 Nov, 01:08 UTC Shares on chain 680 Observed 17 Nov, 01:09 UTC In queue — Awaiting a reading');
    });
    it('never turns shares into votes, people or answers', () => {
      // The figures and the days, up to the questions' own rows (which carry the official answer options).
      const markup = html({ snapshot: withQueue });
      const block = text(markup.slice(markup.indexOf('Coinholder activity across all questions'), markup.indexOf('UTC days.')));
      expect(block).toContain('In queue');
      expect(block).not.toMatch(/voters|people|ballots|Support|Oppose|Abstain|ZEC/);
    });
  });
  it('lays the cards out four to a row at most', () => {
    expect(html({ snapshot: SNAPSHOT })).toContain('--cards:4');
  });
  it('marks a reading the browser could not refresh as the last one', () => {
    expect(text(html({ snapshot: SNAPSHOT, failed: true }))).toContain('Last reading');
  });
  it('distinguishes hourly ZCAP observations from delayed and saved readings', () => {
    for (const [state, label] of [['live', 'Hourly'], ['stale', 'Delayed'], ['recorded', 'Saved']] as const) {
      const snapshot = { ...SNAPSHOT, bodies: SNAPSHOT.bodies.map((body) => body.id === 'zcap' ? { ...body, state } : body) };
      expect(text(html({ snapshot }))).toContain(`${label} ${ZCAP_LAST.at.slice(11, 16)} UTC · SIV`);
    }
  });
  it('waits without numbers before the first reading', () => {
    const out = text(html({ snapshot: null }));
    expect(out).toContain('Loading');
    expect(out).not.toMatch(/\d+ ballots/);
  });
  it('keeps cumulative totals accessible without a separate daily disclosure', () => {
    const markup = html({ snapshot: SNAPSHOT });
    const out = text(markup);
    expect(out).not.toContain('Daily panel counts');
    expect(markup).toContain('<table><caption>Cumulative panel ballots by UTC day.');
    expect(out).toContain('Panel ballots per day');
    expect(out).toContain('16 Nov 24 3 1 0 17 Nov 29 3 1 2');
  });
  it('opens external sources in a new tab without leaking the opener', () => {
    for (const [, attrs] of html({ snapshot: SNAPSHOT }).matchAll(/<a (href="https?:[^>]+)>/g)) {
      expect(attrs).toContain('target="_blank"');
      expect(attrs).toContain('rel="noopener noreferrer"');
      expect(attrs).toMatch(/href="https:\/\//);
    }
  });
});
