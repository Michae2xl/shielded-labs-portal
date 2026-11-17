import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NU7_1_TURNOUT, buildSnapshot, pollPhase, type CountRead, type Read, type TurnoutReads } from './turnout';

const NOW = Date.parse('2026-11-17T00:30:00Z');

// The latest ZCAP count read by hand: each new reading is one line in turnout.ts, and these tests follow it.
const ZCAP_SOURCE = NU7_1_TURNOUT.sources.find((source) => source.id === 'zcap');
const ZCAP_READINGS = ZCAP_SOURCE?.kind === 'siv' ? ZCAP_SOURCE.readings : [];
const ZCAP_LAST = ZCAP_READINGS.at(-1)!;
const fetched = (data: CountRead, observedAt = '2026-11-17T00:29:00.000Z'): Read<CountRead> => ({ state: 'fetched', observedAt, data });
const chain: CountRead = {
  value: 655,
  points: [],
  eligible: null,
  approximate: false,
  questions: [1, 2, 3, 4, 5].map((id) => ({ id, shares: 131 })),
};
const brasil: CountRead = {
  value: 3,
  points: [
    { at: Date.parse('2026-11-16T11:39:21Z'), value: 1 },
    { at: Date.parse('2026-11-16T12:24:46Z'), value: 3 },
  ],
  eligible: 18,
  approximate: false,
};
const zechub: CountRead = { value: 1, points: [{ at: Date.parse('2026-11-16T16:43:47Z'), value: 1 }], eligible: 23, approximate: false };
const READS: TurnoutReads = { bodies: { coinholders: fetched(chain), 'zcash-brasil': fetched(brasil), zechub: fetched(zechub) }, roster: 203, chainStatus: 'active' };

describe('the snapshot the route returns', () => {
  const snapshot = buildSnapshot(NU7_1_TURNOUT, READS, NOW);

  it('lists every body in the record’s order, with its count, who could vote and how it is known', () => {
    expect(snapshot.bodies.map((b) => [b.name, b.value, b.unit, b.eligible, b.timing, b.state])).toEqual([
      ['Coinholders', 655, 'shares', null, 'snapshot', 'live'],
      ['ZCAP', ZCAP_LAST.ballots, 'ballots', 203, 'recorded', 'recorded'],
      ['Zcash Brasil', 3, 'ballots', 18, 'exact', 'live'],
      ['ZecHub', 1, 'ballots', 23, 'exact', 'live'],
    ]);
    expect(snapshot.bodies[1]).toMatchObject({ observedAt: ZCAP_LAST.at, eligibleLabel: 'eligible', source: { label: 'SIV' } });
    expect(snapshot.bodies[1].series.map((p) => p.value)).toEqual([0, ...ZCAP_READINGS.map((r) => r.ballots)]);
    expect(ZCAP_READINGS.slice(0, 2).map((r) => r.ballots)).toEqual([24, 29]);
    expect(snapshot.bodies[0].previous).toBeNull();
    expect(snapshot.phase).toBe('open');
    expect(snapshot.questions.map((q) => q.shares)).toEqual([131, 131, 131, 131, 131]);
  });
  it('preserves panel history without inventing share history or reusing the old vote comparison', () => {
    const [coinholders, ...panels] = snapshot.bodies;
    expect(coinholders).toMatchObject({ series: [], reference: null, previous: null });
    for (const panel of panels) expect(panel.series[0]).toEqual({ at: '2026-11-16T00:00:00.000Z', value: 0 });
    expect(coinholders.value).toBe(snapshot.questions.reduce((sum, q) => sum + q.shares!, 0));
  });
  it('never carries an option’s count or label', () => {
    const json = JSON.stringify(buildSnapshot(NU7_1_TURNOUT, READS, NOW));
    // Q1's options hold 72, 27 and 6 shares in the summary; nothing per option reaches the snapshot.
    expect(json).not.toMatch(/\b(72|27)\b/);
    expect(json).not.toMatch(/Support|Oppose|Abstain|vote_decision/);
  });
  it('says what is missing when a source does not answer', () => {
    const empty = buildSnapshot(NU7_1_TURNOUT, { bodies: {}, roster: null, chainStatus: null }, NOW);
    expect(empty.bodies.map((b) => [b.value, b.state, b.eligible])).toEqual([
      [null, 'unavailable', null],
      [ZCAP_LAST.ballots, 'recorded', null],
      [null, 'unavailable', null],
      [null, 'unavailable', null],
    ]);
    expect(empty.questions.every((q) => q.shares === null)).toBe(true);
  });
});

describe('the record', () => {
  it('keeps every source public, every reading dated, and the gold for the coinholder vote alone', () => {
    expect(NU7_1_TURNOUT.sources.map((s) => [s.kind, s.slot])).toEqual([
      ['vote-chain', 3],
      ['siv', 1],
      ['helios', 1],
      ['helios', 1],
    ]);
    expect(new Set(NU7_1_TURNOUT.sources.map((s) => s.id)).size).toBe(NU7_1_TURNOUT.sources.length);
    for (const source of NU7_1_TURNOUT.sources) {
      if (source.previous) expect(source.previous.source).toMatch(/^https:\/\//);
      if (source.kind === 'recorded') {
        expect(source.liveUrl).toMatch(/^https:\/\//);
        for (const r of source.readings) expect(r.at).toMatch(/Z$/);
      }
    }
  });
  it('marks every body with a logo the portal serves itself', () => {
    for (const source of NU7_1_TURNOUT.sources) {
      expect(source.logos.length).toBeGreaterThan(0);
      for (const logo of source.logos) expect(existsSync(join(process.cwd(), 'public', logo.src))).toBe(true);
    }
  });
  it('follows the poll from opening to the tally', () => {
    const at = (iso: string) => Date.parse(iso);
    expect(pollPhase(NU7_1_TURNOUT, null, at('2026-11-15T12:00:00Z'))).toBe('upcoming');
    expect(pollPhase(NU7_1_TURNOUT, 'active', at('2026-11-20T12:00:00Z'))).toBe('open');
    expect(pollPhase(NU7_1_TURNOUT, 'active', at('2026-12-01T03:00:00Z'))).toBe('counting');
    expect(pollPhase(NU7_1_TURNOUT, 'tallying', at('2026-11-30T12:00:00Z'))).toBe('counting');
    expect(pollPhase(NU7_1_TURNOUT, 'finalized', at('2026-12-02T00:00:00Z'))).toBe('closed');
  });
});
