import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import live from './nu7-1-vote-summary.json';
import { createTurnoutProvider } from './provider';
import { headerOf, statusOf, txSearch, type FakeCast } from './test-chain';
import { NU7_1_TURNOUT } from './turnout';

// The latest ZCAP count read by hand: each new reading is one line in turnout.ts, and these tests follow it.
const ZCAP_SOURCE = NU7_1_TURNOUT.sources.find((source) => source.id === 'zcap');
const ZCAP_LAST = (ZCAP_SOURCE?.kind === 'recorded' ? ZCAP_SOURCE.readings : []).at(-1)!;

const T0 = Date.parse('2026-11-17T00:00:00Z');
const ballots = [
  { voter_uuid: 'a', cast_at: '2026-11-16 11:39:21.731163' },
  { voter_uuid: 'b', cast_at: '2026-11-16 11:41:04.872919' },
  { voter_uuid: 'c', cast_at: '2026-11-16 12:24:46.692601' },
];
const voters = (n: number, from = 0) => Array.from({ length: n }, (_, i) => ({ uuid: `v${String(from + i).padStart(4, '0')}`, name: 'Hidden' }));
const roster = 'Name,Handle,Joined\nA,@a,May 2021\nB,@b,May 2021\n,,\n';
const five = [1, 2, 3, 4, 5];

/** A fake network: each source answers by URL, a source can be switched off, and the chain can grow. */
function network(state: { casts: FakeCast[]; tip: number; down?: { rpc?: boolean; valar?: boolean; zf?: boolean; helios?: boolean } }) {
  return vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    const down = state.down ?? {};
    if (url.hostname === 'prod.explorer-rpc.valargroup.org') {
      if (down.rpc) throw new Error('offline');
      if (url.pathname === '/status') return Response.json(statusOf(state.tip));
      if (url.pathname === '/header') return Response.json(headerOf(Number(url.searchParams.get('height'))));
      if (url.pathname === '/tx_search') return Response.json(txSearch(state.casts, url));
    }
    if (url.hostname === 'prod.vote-chain-primary.valargroup.org') return down.valar ? new Response('down', { status: 502 }) : Response.json(live);
    if (url.hostname === 'zvote.zfnd.org') {
      if (down.zf) throw new Error('offline');
      return Response.json(live);
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
const searches = (fetcher: ReturnType<typeof network>) => fetcher.mock.calls.map(([u]) => String(u)).filter((u) => u.includes('/tx_search'));

describe('the turnout provider', () => {
  it('counts votes as cast on the chain, pages through Helios, counts the roster, and caches for a minute', async () => {
    let now = T0;
    const state = {
      casts: [
        { event: 'delegate_and_cast_vote_batch', height: 100, questions: five },
        { event: 'delegate_and_cast_vote_batch', height: 200, questions: five },
        { event: 'cast_vote', height: 300, questions: [1] },
      ] as FakeCast[],
      tip: 400,
    };
    const fetcher = network(state);
    const get = createTurnoutProvider(fetcher, () => now);
    const [a, b] = await Promise.all([get(), get()]);
    expect(a.bodies.map((body) => [body.name, body.value, body.eligible, body.state])).toEqual([
      ['Coinholders', 3, null, 'live'],
      ['ZCAP', ZCAP_LAST.ballots, 2, 'recorded'],
      ['Zcash Brasil', 3, 518, 'live'],
      ['ZecHub', 3, 518, 'live'],
    ]);
    expect(a.questions.map((q) => q.votes)).toEqual([3, 2, 2, 2, 2]);
    expect(a.bodies[0].series.at(-1)?.value).toBe(3);
    expect(a.bodies[2].series.map((p) => p.value)).toEqual([0, 2, 3]);
    expect(b.bodies).toEqual(a.bodies);
    expect(JSON.stringify(a)).not.toMatch(/Hidden|v0001|"a"/);
    const calls = fetcher.mock.calls.length;
    now += 59_000;
    await get();
    expect(fetcher.mock.calls.length).toBe(calls);
  });

  it('reads only the blocks that arrived since the last reading', async () => {
    let now = T0;
    const state = { casts: [{ event: 'delegate_and_cast_vote_batch', height: 100, questions: five }] as FakeCast[], tip: 150 };
    const fetcher = network(state);
    const get = createTurnoutProvider(fetcher, () => now);
    await get();
    state.casts.push({ event: 'delegate_and_cast_vote_batch', height: 180, questions: five });
    state.tip = 200;
    now += 61_000;
    const later = await get();
    expect(later.bodies[0].value).toBe(2);
    const second = searches(fetcher).slice(-3);
    expect(second.map((u) => new URL(u).searchParams.get('query')).every((q) => q?.includes('tx.height>150 AND tx.height<=200'))).toBe(true);
  });

  it('falls back to the revealed shares when the RPC cannot be read, and to the Zcash Foundation mirror', async () => {
    const fetcher = network({ casts: [], tip: 10, down: { rpc: true, valar: true } });
    const snapshot = await createTurnoutProvider(fetcher, () => T0)();
    expect(snapshot.bodies[0]).toMatchObject({ value: 7, approximate: true, timing: 'approximate', series: [] });
    expect(fetcher.mock.calls.some(([url]) => String(url).includes('zvote.zfnd.org'))).toBe(true);
  });

  it('keeps the last good reading, marked stale, when a source goes down', async () => {
    let now = T0;
    const state: Parameters<typeof network>[0] = { casts: [{ event: 'delegate_and_cast_vote_batch', height: 100, questions: five }], tip: 150 };
    const get = createTurnoutProvider(network(state), () => now);
    await get();
    state.down = { rpc: true, valar: true, zf: true, helios: true };
    now += 61_000;
    const later = await get();
    expect(later.bodies[2]).toMatchObject({ value: 3, state: 'stale' });
    expect(later.bodies[0]).toMatchObject({ value: 1, state: 'stale', approximate: false });
  });

  it('says unavailable when nothing good was ever read', async () => {
    const snapshot = await createTurnoutProvider(network({ casts: [], tip: 1, down: { rpc: true, valar: true, zf: true, helios: true } }), () => T0)();
    expect(snapshot.bodies.map((b) => [b.value, b.state])).toEqual([
      [null, 'unavailable'],
      [ZCAP_LAST.ballots, 'recorded'],
      [null, 'unavailable'],
      [null, 'unavailable'],
    ]);
  });
});
