import 'server-only';
import { z } from 'zod';
import { NSM, nsmValueBalance, type NsmReading, type NsmSource } from './balance';

export const NSM_SOURCE = 'https://api.blockchair.com/zcash';
// Blocks arrive every 25 seconds and the public API caches for about a minute; one reading a
// minute keeps within its free request allowance.
const TTL = 60_000;
const POOLS = ['transparent', 'sprout', 'sapling', 'orchard', 'ironwood', 'lockbox'];
const statsSchema = z.object({ data: z.object({ best_block_height: z.number().int().positive() }) });
const blockSchema = z.object({
  height: z.number().int(),
  time: z.number().int(),
  valuePools: z.array(z.object({ id: z.string(), monitored: z.boolean(), chainValueZat: z.number().int().nonnegative() })),
  chainSupply: z.object({ monitored: z.boolean(), chainValueZat: z.number().int().nonnegative() }),
});
const rawBlockSchema = z.object({ data: z.record(z.string(), z.object({ decoded_raw_block: blockSchema })) });

let cache: NsmSource = { state: 'unavailable', observedAt: null, reading: null, source: NSM_SOURCE };
let refreshedAt = -Infinity;
let pending: Promise<NsmSource> | undefined;

async function read(path: string): Promise<unknown> {
  const response = await fetch(`${NSM_SOURCE}/${path}`, { cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json', 'User-Agent': 'Shielded-Labs-Portal' } });
  if (!response.ok) throw new Error('Chain data unavailable');
  return response.json();
}

/** The issued supply is the sum of every chain value pool; a pool the node does not report makes it unknown. */
function issuedSupply(block: z.infer<typeof blockSchema>): number {
  const pools = new Map(block.valuePools.map(pool => [pool.id, pool]));
  if (POOLS.some(id => !pools.get(id)?.monitored)) throw new Error('A chain value pool is missing');
  const total = block.valuePools.reduce((sum, pool) => sum + pool.chainValueZat, 0);
  if (!Number.isSafeInteger(total) || !block.chainSupply.monitored || block.chainSupply.chainValueZat !== total) throw new Error('Chain supply does not match its pools');
  return total;
}

async function readTip(previous: NsmReading | null): Promise<NsmReading> {
  const height = statsSchema.parse(await read('stats')).data.best_block_height;
  if (previous?.height === height) return previous;
  const block = rawBlockSchema.parse(await read(`raw/block/${height}`)).data[String(height)]?.decoded_raw_block;
  if (!block || block.height !== height) throw new Error('Tip block unavailable');
  const supply = issuedSupply(block);
  const balance = nsmValueBalance(height, supply);
  if (balance < 0) throw new Error('Balance out of range');
  return { height, time: new Date(block.time * 1000).toISOString(), issuedSupplyZat: supply, balanceZat: balance, removedSinceActivationZat: balance - NSM.initialBalanceZat };
}

async function refresh(now: number): Promise<NsmSource> {
  try {
    cache = { state: 'fetched', observedAt: new Date(now).toISOString(), reading: await readTip(cache.reading), source: NSM_SOURCE };
  } catch {
    cache = { ...cache, state: cache.reading ? 'stale' : 'unavailable' };
  }
  refreshedAt = now;
  return cache;
}

export async function getNsmBalance(now = Date.now()): Promise<NsmSource> {
  if (now - refreshedAt < TTL) return cache;
  pending ??= refresh(now).finally(() => { pending = undefined; });
  return pending;
}
