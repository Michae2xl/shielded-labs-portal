import 'server-only';
import { z } from 'zod';

/** The live ZEC price, read as OpenZcash reads it: CoinGecko's simple price, kept for ten minutes. */
export const zecPriceFeed = 'https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd&include_last_updated_at=true';
const TTL = 10 * 60_000;
const replySchema = z.object({ zcash: z.object({ usd: z.number().positive(), last_updated_at: z.number().positive().optional() }) });

export type LiveZecPrice = { usd: number; observedAt: string };
let last: { price: LiveZecPrice; at: number } | undefined;

/** The current price; the last one, with its own time, when the feed fails; null before any reading. */
export async function liveZecPrice(now = Date.now()): Promise<LiveZecPrice | null> {
  if (last && now - last.at < TTL) return last.price;
  try {
    const response = await fetch(zecPriceFeed, { cache: 'no-store', signal: AbortSignal.timeout(5_000), headers: { Accept: 'application/json', 'User-Agent': 'Shielded-Labs-Portal' } });
    if (response.ok) {
      const { zcash } = replySchema.parse(await response.json());
      const quoted = (zcash.last_updated_at ?? 0) * 1000;
      // A quote without a time, or dated ahead of the clock, is dated by this reading.
      const time = quoted > 0 && quoted <= now + 60_000 ? quoted : now;
      last = { price: { usd: zcash.usd, observedAt: new Date(time).toISOString() }, at: now };
      return last.price;
    }
  } catch {
    // Offline, timed out or malformed: the last reading stands.
  }
  return last?.price ?? null;
}
