import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import live from './nu7-1-vote-summary.json';
import { createTurnoutProvider } from './provider';
import { NU7_1_TURNOUT } from './turnout';

const ZCAP_SOURCE = NU7_1_TURNOUT.sources.find((source) => source.id === 'zcap');
const ZCAP_LAST = (ZCAP_SOURCE?.kind === 'siv' ? ZCAP_SOURCE.readings : []).at(-1)!;
const T0 = Date.parse('2026-11-17T00:00:00Z');
const ballots = [
  { voter_uuid: 'a', cast_at: '2026-11-16 11:39:21.731163' },
  { voter_uuid: 'b', cast_at: '2026-11-16 11:41:04.872919' },
  { voter_uuid: 'c', cast_at: '2026-11-16 12:24:46.692601' },
];
const voters = (n: number, offset = 0) => Array.from({ length: n }, (_, i) => ({ uuid: `v${String(i + offset).padStart(4, '0')}` }));
const roster = 'Name,Status\nHidden A,active\nHidden B,active\n';
type Network = { summary?: typeof live; down?: { valar?: boolean; zf?: boolean; helios?: boolean } };
function network(state: Network = {}) {
  return vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    const down = state.down ?? {};
    if (url.hostname === 'prod.vote-chain-primary.valargroup.org') return down.valar ? new Response('down', { status: 502 }) : Response.json(state.summary ?? live);
    if (url.hostname === 'zvote.zfnd.org') {
      if (down.zf) throw new Error('offline');
      return Response.json(state.summary ?? live);
    }
    if (url.hostname === 'vote.heliosvoting.org') {
      if (down.helios) throw new Error('offline');
      if (url.pathname.endsWith('/ballots/')) return Response.json(ballots);
      return Response.json(url.searchParams.get('after') ? voters(18, 500) : voters(500));
    }
    if (url.hostname === 'docs.google.com') return new Response(roster);
    throw new Error(`unexpected ${url}`);
  });
}

describe('the turnout provider', () => {
  it('uses raw shares for each question and their sum, preserving panel ballots and one-minute caching', async () => {
    let now = T0;
    const fetcher = network();
    const get = createTurnoutProvider(fetcher, () => now);
    const [a, b] = await Promise.all([get(), get()]);
    expect(a.bodies.map((body) => [body.name, body.value, body.eligible, body.state])).toEqual([
      ['Coinholders', 276, null, 'live'],
      ['ZCAP', ZCAP_LAST.ballots, 2, 'recorded'],
      ['Zcash Brasil', 3, 518, 'live'],
      ['ZecHub', 3, 518, 'live'],
    ]);
    expect(a.questions.map((q) => q.shares)).toEqual([105, 43, 35, 45, 48]);
    expect(a.bodies[0]).toMatchObject({ unit: 'shares', approximate: false, series: [], reference: null, previous: null });
    expect(a.bodies[2].series.map((p) => p.value)).toEqual([0, 2, 3]);
    expect(b.bodies).toEqual(a.bodies);
    expect(JSON.stringify(a)).not.toMatch(/Hidden|v0001|vote_decision|Support|Oppose|Abstain/);
    expect(fetcher.mock.calls.filter(([url]) => String(url).includes('vote-summary'))).toHaveLength(1);
    expect(fetcher.mock.calls.some(([url]) => String(url).includes('explorer-rpc'))).toBe(false);
    const calls = fetcher.mock.calls.length;
    now += 59_000;
    await get();
    expect(fetcher.mock.calls.length).toBe(calls);
    now += 2_000;
    expect((await get()).bodies[0].value).toBe(276);
  });

  it('replaces a cumulative reading instead of adding it or multiplying by the number of questions', async () => {
    let now = T0;
    const state: Network = { summary: structuredClone(live) };
    const get = createTurnoutProvider(network(state), () => now);
    await get();
    state.summary!.proposals[0].options[0].ballot_count = 73;
    now += 61_000;
    const later = await get();
    expect(later.bodies[0].value).toBe(277);
    expect(later.questions.map((q) => q.shares)).toEqual([106, 43, 35, 45, 48]);
  });

  it('uses the Foundation mirror when the primary summary is unavailable', async () => {
    const fetcher = network({ down: { valar: true } });
    const snapshot = await createTurnoutProvider(fetcher, () => T0)();
    expect(snapshot.bodies[0]).toMatchObject({ value: 276, state: 'live' });
    expect(snapshot.phase).toBe('open');
    expect(fetcher.mock.calls.some(([url]) => String(url).includes('zvote.zfnd.org'))).toBe(true);
  });

  it('preserves the complete last reading and its timestamp when both summaries fail', async () => {
    let now = T0;
    const state: Network = {};
    const get = createTurnoutProvider(network(state), () => now);
    const first = await get();
    state.down = { valar: true, zf: true, helios: true };
    now += 61_000;
    const later = await get();
    expect(later.bodies[0]).toMatchObject({ value: 276, state: 'stale', observedAt: first.bodies[0].observedAt });
    expect(later.questions).toEqual(first.questions);
    expect(later.bodies[2]).toMatchObject({ value: 3, state: 'stale' });
  });

  it('does not publish a partial total if a question is missing', async () => {
    const incomplete = structuredClone(live);
    incomplete.proposals.pop();
    const snapshot = await createTurnoutProvider(network({ summary: incomplete }), () => T0)();
    expect(snapshot.bodies[0]).toMatchObject({ value: null, state: 'unavailable' });
    expect(snapshot.questions.every((q) => q.shares === null)).toBe(true);
  });

  it('distinguishes genuine zero shares from an unavailable source', async () => {
    const empty = structuredClone(live);
    empty.proposals.forEach((q) => q.options.forEach((o) => { o.ballot_count = 0; }));
    const zero = await createTurnoutProvider(network({ summary: empty }), () => T0)();
    expect(zero.bodies[0]).toMatchObject({ value: 0, state: 'live' });
    expect(zero.questions.map((q) => q.shares)).toEqual([0, 0, 0, 0, 0]);
    const down = await createTurnoutProvider(network({ down: { valar: true, zf: true } }), () => T0)();
    expect(down.bodies[0]).toMatchObject({ value: null, state: 'unavailable' });
    expect(down.questions.every((q) => q.shares === null)).toBe(true);
  });
});
