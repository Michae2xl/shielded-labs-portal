import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createSivReader } from './siv-provider';
import { NU7_1_TURNOUT, buildSnapshot, type SivSource } from './turnout';
import { dailyNew } from './view';
import { ZCAP_ELECTION_ID } from './siv-history';

const source = NU7_1_TURNOUT.sources.find((s): s is SivSource => s.kind === 'siv')!;
const NOW = Date.parse('2026-11-17T06:00:00Z');
const history = {
  version: 1, electionId: ZCAP_ELECTION_ID,
  observations: [
    { at: '2026-11-16T23:16:00Z', ballots: 24, method: 'manual' },
    { at: '2026-11-17T04:07:00Z', ballots: 40, method: 'manual' },
    { at: '2026-11-17T05:23:00Z', ballots: 42, method: 'api' },
  ],
};
afterEach(() => vi.unstubAllEnvs());

describe('the hourly SIV history', () => {
  it('coalesces concurrent reads and serves the durable history, with the roster and observed time', async () => {
    let now = NOW;
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(history));
    const read = createSivReader(fetcher, () => now);
    const [a, b] = await Promise.all([read(source, NU7_1_TURNOUT.closesAt), read(source, NU7_1_TURNOUT.closesAt)]);
    expect(a).toEqual(b);
    expect(a).toMatchObject({ state: 'fetched', observedAt: '2026-11-17T05:23:00.000Z', data: { value: 42, approximate: false } });
    const snapshot = buildSnapshot(NU7_1_TURNOUT, { bodies: { zcap: a }, roster: 203, chainStatus: 'active' }, now);
    expect(snapshot.bodies[1]).toMatchObject({ kind: 'siv', timing: 'recorded', state: 'live', value: 42, eligible: 203 });
    expect(dailyNew(snapshot, now).slice(0, 2).map((d) => d.values[1])).toEqual([24, 18]);
    now += 59_000;
    await read(source, NU7_1_TURNOUT.closesAt);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('keeps the last good count and original time when the feed fails, including stale files after restarts', async () => {
    let now = NOW;
    let down = false;
    const fetcher = vi.fn<typeof fetch>(async () => down ? new Response('not found', { status: 404 }) : Response.json(history));
    const read = createSivReader(fetcher, () => now);
    await read(source, NU7_1_TURNOUT.closesAt);
    down = true;
    now += 61_000;
    expect(await read(source, NU7_1_TURNOUT.closesAt)).toMatchObject({ state: 'stale', observedAt: '2026-11-17T05:23:00.000Z', data: { value: 42 } });
    down = false;
    now += 3 * 3_600_000;
    expect(await createSivReader(fetcher, () => now)(source, NU7_1_TURNOUT.closesAt)).toMatchObject({ state: 'stale', data: { value: 42 } });
  });

  it('rejects another election and older totals instead of overwriting valid data', async () => {
    let now = NOW;
    let data = history;
    const read = createSivReader(vi.fn<typeof fetch>(async () => Response.json(data)), () => now);
    await read(source, NU7_1_TURNOUT.closesAt);
    data = { ...history, electionId: 'wrong' };
    now += 61_000;
    expect(await read(source, NU7_1_TURNOUT.closesAt)).toMatchObject({ state: 'stale', data: { value: 42 } });
    data = { ...history, observations: history.observations.slice(0, 2).map((r) => ({ ...r, method: 'api' })) };
    now += 61_000;
    expect(await read(source, NU7_1_TURNOUT.closesAt)).toMatchObject({ state: 'stale', data: { value: 42 } });
  });

  it('keeps the dated saved record when a private feed has not been configured or cannot be read', async () => {
    const read = await createSivReader(vi.fn<typeof fetch>(async () => new Response('denied', { status: 404 })), () => NOW)(source, NU7_1_TURNOUT.closesAt);
    const snapshot = buildSnapshot(NU7_1_TURNOUT, { bodies: { zcap: read }, roster: 203, chainStatus: 'active' }, NOW);
    expect(snapshot.bodies[1]).toMatchObject({ state: 'recorded', value: 40, observedAt: '2026-11-17T04:07:00Z' });
  });

  it('does not send the repository token to other origins, repositories or redirects', async () => {
    vi.stubEnv('ZCAP_DATA_TOKEN', 'secret-test-token');
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(history));
    for (const url of ['https://example.com/zcap.json', 'https://raw.githubusercontent.com/other/repo/zcap.json']) {
      vi.stubEnv('ZCAP_DATA_URL', url);
      expect(await createSivReader(fetcher, () => NOW)(source, NU7_1_TURNOUT.closesAt)).toMatchObject({ state: 'unavailable' });
    }
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv('ZCAP_DATA_URL', '');
    await createSivReader(fetcher, () => NOW)(source, NU7_1_TURNOUT.closesAt);
    expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: 'error', headers: { Authorization: 'token secret-test-token' } });
  });

  it('keeps the final observation fresh after polling closes', async () => {
    const final = { ...history, observations: [...history.observations, { ballots: 135, at: '2026-12-01T03:23:00Z', method: 'api' }] };
    const read = await createSivReader(vi.fn<typeof fetch>(async () => Response.json(final)), () => Date.parse('2027-01-01T00:00:00Z'))(source, NU7_1_TURNOUT.closesAt);
    expect(read).toMatchObject({ state: 'fetched', data: { value: 135 } });
  });
});
