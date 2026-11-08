import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

const quote = (usd: number, at?: number) => () => Promise.resolve(Response.json({ zcash: { usd, ...(at ? { last_updated_at: at } : {}) } }));

describe('Live ZEC price', () => {
  it('reads CoinGecko, dates the quote by the feed and keeps it for ten minutes', async () => {
    const fetch = vi.fn<(url: string) => Promise<Response>>(quote(1_248.46, 1_000));
    vi.stubGlobal('fetch', fetch);
    const { liveZecPrice } = await import('./zec-price');
    expect(await liveZecPrice(1_000_000)).toEqual({ usd: 1_248.46, observedAt: '1970-01-01T00:16:40.000Z' });
    await liveZecPrice(1_000_000 + 9 * 60_000);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0]?.[0])).toBe('https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd&include_last_updated_at=true');
  });

  it('keeps the last quote, with its own time, when the feed fails or refuses', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementationOnce(quote(1_248.46, 1_000))
      .mockResolvedValueOnce(new Response('', { status: 429 })).mockImplementationOnce(() => Promise.resolve(Response.json({ zcash: { usd: 0 } })));
    vi.stubGlobal('fetch', fetch);
    const { liveZecPrice } = await import('./zec-price');
    expect(await liveZecPrice(1_000_000)).toBeNull();
    const first = await liveZecPrice(1_000_000);
    expect(await liveZecPrice(1_000_000 + 11 * 60_000)).toEqual(first);
    expect(await liveZecPrice(1_000_000 + 12 * 60_000)).toEqual(first);
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('dates a quote without a time, or ahead of the clock, by the reading', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementationOnce(quote(1_248.46)).mockImplementationOnce(quote(1_250, 5_000)));
    const { liveZecPrice } = await import('./zec-price');
    expect((await liveZecPrice(1_000_000))?.observedAt).toBe('1970-01-01T00:16:40.000Z');
    expect(await liveZecPrice(2_000_000)).toEqual({ usd: 1_250, observedAt: '1970-01-01T00:33:20.000Z' });
  });
});
