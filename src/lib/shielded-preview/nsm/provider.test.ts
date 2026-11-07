import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));

// Chain value pools a full node reported at block 3,543,404, the block before NU7.
const POOLS = { transparent: 1_197_093_416_751_037, sprout: 1_222_421_094_946, sapling: 42_137_374_602_125, orchard: 32_357_676_389_848, ironwood: 422_365_440_216_524, lockbox: 7_443_843_750_000 };
const total = (pools: Record<string, number>) => Object.values(pools).reduce((sum, value) => sum + value, 0);
const stats = (height: number) => ({ data: { best_block_height: height }, context: { code: 200 } });
const block = (height: number, pools: Record<string, number> = POOLS, overrides: Record<string, unknown> = {}) => ({
  data: { [height]: { decoded_raw_block: {
    height, time: 1_793_932_401,
    valuePools: Object.entries(pools).map(([id, chainValueZat]) => ({ id, monitored: true, chainValue: chainValueZat / 1e8, chainValueZat })),
    chainSupply: { monitored: true, chainValueZat: total(pools) },
    ...overrides,
  } } },
});
function source(responses: unknown[]) {
  const fetch = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(async () => {
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next), { status: 200 });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('Live NSM balance', () => {
  it('computes the balance from the tip block’s chain value pools', async () => {
    const fetch = source([stats(3_543_404), block(3_543_404)]);
    const { getNsmBalance } = await import('./provider');
    const result = await getNsmBalance(1_000);
    expect(result.state).toBe('fetched');
    expect(result.reading).toEqual({ height: 3_543_404, time: '2026-11-06T02:33:21.000Z', issuedSupplyZat: 1_702_620_172_804_480, balanceZat: 36_858_445_520, removedSinceActivationZat: 0 });
    expect(fetch.mock.calls.map(call => String(call[0]))).toEqual(['https://api.blockchair.com/zcash/stats', 'https://api.blockchair.com/zcash/raw/block/3543404']);
  });

  it('reuses a fresh reading and skips the block when the tip has not moved', async () => {
    const fetch = source([stats(3_543_404), block(3_543_404), stats(3_543_404)]);
    const { getNsmBalance } = await import('./provider');
    await getNsmBalance(1_000);
    await getNsmBalance(30_000);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect((await getNsmBalance(70_000)).state).toBe('fetched');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('refuses a tip without every chain value pool, or with a total that does not match them', async () => {
    const missing = Object.fromEntries(Object.entries(POOLS).filter(([id]) => id !== 'lockbox'));
    source([stats(3_543_404), block(3_543_404, missing)]);
    const first = await (await import('./provider')).getNsmBalance(1_000);
    expect(first).toMatchObject({ state: 'unavailable', reading: null });
    vi.resetModules();
    source([stats(3_543_404), block(3_543_404, POOLS, { chainSupply: { monitored: true, chainValueZat: 1 } })]);
    expect((await (await import('./provider')).getNsmBalance(1_000)).state).toBe('unavailable');
  });

  it('keeps the last reading, marked as such, when the source fails', async () => {
    source([stats(3_543_404), block(3_543_404), new Error('rate limited')]);
    const { getNsmBalance } = await import('./provider');
    const fresh = await getNsmBalance(1_000);
    const later = await getNsmBalance(70_000);
    expect(later.state).toBe('stale');
    expect(later.reading).toEqual(fresh.reading);
  });
});
