import 'server-only';
import { blockTime } from './series';
import { CAST_EVENTS, headerUrl, parseCastPage, parseHeaderTime, parseStatus, statusUrl, tallyCasts, txSearchUrl, type Cast, type CastEvent } from './vote-chain';

/** Reads a JSON body; the scanner passes its own size and time limits. */
export type GetJson = (url: string, limits: { timeout: number; maxBytes: number }) => Promise<unknown>;

// A ballot transaction carries its proofs (about 100 KB), so pages stay small and each reading
// fetches only what arrived since the last one. A long backlog is read over several readings.
const PAGE: Record<CastEvent, number> = { delegate_and_cast_vote_batch: 20, cast_vote_batch: 20, cast_vote: 50 };
const MAX_PAGES_PER_READING = 25;
const RPC_LIMITS = { timeout: 15_000, maxBytes: 6_000_000 };
const SMALL_LIMITS = { timeout: 8_000, maxBytes: 200_000 };
/** Exact block times fetched per reading; any other block is placed between its known neighbours. */
const HEADERS_PER_READING = 24;

export interface ChainCount {
  /** Votes per question so far. */
  questions: { id: number; votes: number }[];
  /** Running total of the most-answered question, at block times. */
  points: { at: number; value: number }[];
  unread: number;
  /** The block every event up to which has been read, and its time. */
  through: { height: number; time: number };
}

/** Counts a round's votes from the RPC, keeping what it has read between readings. */
export function createVoteChainScanner(round: string, getJson: GetJson) {
  const casts = new Map<string, Cast>();
  const anchors = new Map<number, number>();
  const scanned: Record<CastEvent, number> = { delegate_and_cast_vote_batch: 0, cast_vote_batch: 0, cast_vote: 0 };

  async function scanEvent(event: CastEvent, upTo: number) {
    let last = scanned[event];
    for (let page = 1, seen = 0; page <= MAX_PAGES_PER_READING; page++) {
      const result = parseCastPage(await getJson(txSearchUrl(event, round, scanned[event], upTo, page, PAGE[event]), RPC_LIMITS), event, round);
      for (const cast of result.casts) {
        casts.set(`${event}:${cast.hash}`, cast);
        last = Math.max(last, cast.height);
      }
      seen += result.txs;
      if (seen >= result.total || result.txs === 0) {
        scanned[event] = upTo;
        return;
      }
    }
    // Stopped early: every block below the last one read is complete; that block is read again next time.
    scanned[event] = Math.max(scanned[event], last - 1);
  }

  async function placeBlocks() {
    const missing = [...new Set([...casts.values()].map((c) => c.height))].filter((h) => !anchors.has(h)).sort((a, b) => a - b);
    // The oldest block first, so every other block has known neighbours, then blocks spread across the rest.
    const step = Math.max(1, Math.ceil(missing.length / HEADERS_PER_READING));
    const batch = [...new Set([missing[0], ...missing.filter((_, i) => i % step === step - 1)])].filter((h) => h !== undefined).slice(0, HEADERS_PER_READING);
    const times = await Promise.all(batch.map((h) => getJson(headerUrl(h), SMALL_LIMITS).then(parseHeaderTime, () => null)));
    batch.forEach((h, i) => {
      const time = times[i];
      if (time !== null && Number.isFinite(time)) anchors.set(h, time);
    });
  }

  return async function read(): Promise<ChainCount> {
    const latest = parseStatus(await getJson(statusUrl(), SMALL_LIMITS));
    anchors.set(latest.height, latest.time);
    for (const event of CAST_EVENTS) await scanEvent(event, latest.height);
    await placeBlocks();
    const throughHeight = Math.min(...CAST_EVENTS.map((e) => scanned[e]));
    const all = [...casts.values()].filter((c) => c.height <= throughHeight);
    const { perQuestion, unread, topTimes } = tallyCasts(all, (h) => blockTime(h, anchors));
    const sorted = [...topTimes].sort((a, b) => a - b);
    return {
      questions: [...perQuestion].map(([id, votes]) => ({ id, votes })).sort((a, b) => a.id - b.id),
      points: sorted.map((at, i) => ({ at, value: i + 1 })),
      unread,
      through: { height: throughHeight, time: blockTime(throughHeight, anchors) ?? latest.time },
    };
  };
}
