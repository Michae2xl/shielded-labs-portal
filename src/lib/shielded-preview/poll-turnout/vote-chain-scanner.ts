import 'server-only';
import { z } from 'zod';
import { CAST_EVENTS, parseCastPage, parseStatus, statusUrl, txSearchUrl, type CastCount } from './vote-chain';

export type GetJson = (url: string, limits: { timeout: number; maxBytes: number }) => Promise<unknown>;

const PAGE_SIZE = 16;
const PAGE_LIMIT = 2;
const archive = z.object({ result: z.object({
  node_info: z.object({ network: z.literal('zvote-1'), other: z.object({ tx_index: z.literal('on') }) }),
  sync_info: z.object({ catching_up: z.literal(false), earliest_block_height: z.literal('1') }),
}) });

// Recount of all three indexed event types from genesis through this block, across every page.
// This aggregate lets new server instances replay only the subsequent blocks.
const NU71_CHECKPOINT = {
  round: '290ce255ee4c4d63457a55b3e72e07c579e44b6e578438a01c3eaad5c158991e',
  time: Date.parse('2026-11-26T14:53:21.126Z'),
  count: { height: 11517175, questions: { 1: 2204, 2: 2202, 3: 2204, 4: 2204, 5: 2211 } } satisfies CastCount,
};
export function castCheckpoint(round: string, now: number) {
  return round === NU71_CHECKPOINT.round && now >= NU71_CHECKPOINT.time ? NU71_CHECKPOINT : null;
}

function startWindow(tip: { height: number; time: number }) {
  return {
    tip,
    streams: CAST_EVENTS.map((event) => ({
      event, page: 1, total: null as number | null, complete: false, seen: new Set<string>(), counts: new Map<number, number>(),
    })),
  };
}

/** Publish only after all three event indexes have been read through the same finalized block. */
export function createVoteChainScanner(round: string, ids: number[], getJson: GetJson, now: () => number) {
  const seed = castCheckpoint(round, now());
  let previous: CastCount = seed?.count ?? { height: 0, questions: Object.fromEntries(ids.map((id) => [id, 0])) };
  let window: ReturnType<typeof startWindow> | null = null;

  async function advance(stream: ReturnType<typeof startWindow>['streams'][number], tip: number) {
    for (let i = 0; i < PAGE_LIMIT && !stream.complete; i++) {
      const url = txSearchUrl(stream.event, round, previous.height, tip, stream.page, PAGE_SIZE);
      const page = parseCastPage(await getJson(url, { timeout: 8_000, maxBytes: 5_000_000 }), stream.event, round);
      const expected = Math.min(PAGE_SIZE, page.total - stream.seen.size);
      if (page.txs !== expected || (stream.total !== null && page.total !== stream.total) ||
          new Set(page.hashes).size !== page.txs || page.hashes.some((hash) => stream.seen.has(hash))) {
        throw new Error('Incomplete or repeated cast page');
      }
      const additions = new Map<number, number>();
      for (const cast of page.casts) {
        if (cast.height <= previous.height || cast.height > tip || !cast.questions?.length || cast.questions.some((id) => !ids.includes(id))) {
          throw new Error('Cannot attribute all cast commitments');
        }
        for (const id of cast.questions) additions.set(id, (additions.get(id) ?? 0) + 1);
      }
      for (const [id, count] of additions) stream.counts.set(id, (stream.counts.get(id) ?? 0) + count);
      for (const hash of page.hashes) stream.seen.add(hash);
      stream.total = page.total;
      stream.page++;
      stream.complete = stream.seen.size === page.total;
    }
  }

  return async () => {
    if (!window) {
      const raw = await getJson(statusUrl(), { timeout: 12_000, maxBytes: 200_000 });
      archive.parse(raw);
      const tip = parseStatus(raw);
      if (tip.height < previous.height) throw new Error('Archive is behind the last reading');
      window = startWindow(tip);
    }
    const { tip, streams } = window;
    const attempts = await Promise.allSettled(streams.map((s) => advance(s, tip.height)));
    if (attempts.some((a) => a.status === 'rejected') || streams.some((s) => !s.complete)) throw new Error('Cast count pending');
    const questions = { ...previous.questions };
    for (const stream of streams) for (const [id, count] of stream.counts) questions[id] += count;
    previous = { height: tip.height, questions };
    window = null;
    return { data: previous, observedAt: tip.time };
  };
}
