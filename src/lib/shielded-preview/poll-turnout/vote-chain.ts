import { z } from 'zod';

/**
 * The coinholder vote chain (Valar Group's vote-sdk, a CometBFT chain). Two public readings:
 *
 * - Its CometBFT RPC indexes every vote as it is cast. A wallet's ballot arrives as one transaction per
 *   bundle of notes, with the questions it answers (`proposal_ids`); a vote cast on its own carries its
 *   question inside the transaction. Counting those gives the votes cast per question, with block times.
 * - Its REST summary counts the encrypted shares revealed per question. Each vote is split into 16 shares
 *   revealed after delays. The portal displays these accepted shares directly, without a conversion
 *   to votes or people. The RPC supplies an independent count of commitments.
 *
 * While voting is open, only aggregate activity leaves this module. Final weights require the published tally.
 */

export const SHARES_PER_VOTE = 16;
export const SHARES_SOURCE = 'https://forum.zcashcommunity.com/t/nu7-coinholder-vote/56912/5';
export const VOTE_CHAIN_RPC = 'https://prod.explorer-rpc.valargroup.org';
export const VOTE_CHAIN_HOSTS = [
  { name: 'Valar Group', origin: 'https://prod.vote-chain-primary.valargroup.org' },
  { name: 'Zcash Foundation mirror', origin: 'https://zvote.zfnd.org' },
] as const;
export const voteSummaryUrl = (origin: string, round: string) => `${origin}/shielded-vote/v1/vote-summary/${round}`;

const ROUND_ID = /^[0-9a-f]{64}$/;
const assertRound = (round: string) => {
  if (!ROUND_ID.test(round)) throw new Error('not a vote-chain round id');
};

// ---------- REST summary: revealed shares ----------

/** The vote chain's session states (vote-sdk, proto/svote/v1/types.proto). */
const CHAIN_STATUS = { 1: 'active', 2: 'tallying', 3: 'finalized', 4: 'pending' } as const;
export type ChainRoundStatus = (typeof CHAIN_STATUS)[keyof typeof CHAIN_STATUS] | 'unknown';
export interface AnswerWeight {
  label: string;
  zec: number;
}
export interface ChainQuestion {
  id: number;
  shares: number;
  results?: AnswerWeight[];
}
export interface ChainSummary {
  status: ChainRoundStatus;
  endsAt: string | null;
  totalShares: number;
  questions: ChainQuestion[];
}

const count = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/).transform(Number)]).refine(Number.isSafeInteger, 'unsafe count');
const summarySchema = z.object({
  vote_round_id: z.string(),
  status: z.number().int().optional(),
  vote_end_time: count.optional(),
  proposals: z
    .array(z.object({ id: z.number().int().positive(), options: z.array(z.object({ ballot_count: count.optional() })).min(1) }))
    .min(1),
});
const base64ToHex = (value: string) => Array.from(atob(value), (c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');

/** A round's vote-summary JSON as shares per question; throws when malformed or about another round. */
export function parseChainSummary(json: unknown, round: string): ChainSummary {
  assertRound(round);
  const summary = summarySchema.parse(json);
  if (base64ToHex(summary.vote_round_id) !== round) throw new Error('answered for another round');
  if (new Set(summary.proposals.map((p) => p.id)).size !== summary.proposals.length) throw new Error('a question appears twice');
  const questions = summary.proposals
    .map((p) => ({ id: p.id, shares: p.options.reduce((sum, o) => sum + (o.ballot_count ?? 0), 0) }))
    .sort((a, b) => a.id - b.id);
  const totalShares = questions.reduce((sum, q) => sum + q.shares, 0);
  if (!Number.isSafeInteger(totalShares)) throw new Error('unsafe total');
  return {
    status: CHAIN_STATUS[summary.status as keyof typeof CHAIN_STATUS] ?? 'unknown',
    endsAt: summary.vote_end_time === undefined ? null : new Date(summary.vote_end_time * 1000).toISOString(),
    totalShares,
    questions,
  };
}

// A missing scalar in a published protobuf row represents zero. A missing row
// is different: it supplies no evidence that this option was tallied.
const finalRoster = z.object({
  vote_round_id: z.string(),
  status: z.literal(3),
  proposals: z.array(z.object({
    id: count,
    options: z.array(z.object({
      index: count.default(0), label: z.string().trim().min(1), total_value: count.default(0),
    })).min(1),
  })),
});
const finalTally = z.object({
  results: z.array(z.object({
    vote_round_id: z.string(), proposal_id: count, vote_decision: count.default(0), total_value: count.default(0),
  })).min(1),
});

/** Match the summary to an actual tally row for every answer, including explicit zero results. */
export function readFinalWeights(summary: unknown, tally: unknown, round: string): Map<number, AnswerWeight[]> {
  const roster = finalRoster.parse(summary);
  if (base64ToHex(roster.vote_round_id) !== round) throw new Error('Wrong finalized round');
  const rows = new Map<string, number>();
  for (const row of finalTally.parse(tally).results) {
    const key = `${row.proposal_id}/${row.vote_decision}`;
    if (row.vote_round_id !== roster.vote_round_id || rows.has(key)) throw new Error('Invalid tally row');
    rows.set(key, row.total_value);
  }
  const weights = new Map<number, AnswerWeight[]>();
  for (const proposal of roster.proposals) {
    let units = 0;
    const answers = proposal.options.map((option) => {
      const key = `${proposal.id}/${option.index}`;
      if (rows.get(key) !== option.total_value) throw new Error('Missing or inconsistent final weight');
      rows.delete(key);
      units += option.total_value;
      return { label: option.label, zec: option.total_value / 8 };
    });
    if (!Number.isSafeInteger(units) || weights.has(proposal.id)) throw new Error('Invalid proposal tally');
    weights.set(proposal.id, answers);
  }
  if (rows.size) throw new Error('Unexpected tally choices');
  return weights;
}

// ---------- RPC: votes as they are cast ----------

/** The events a cast vote leaves (vote-sdk, x/vote/types/events.go). */
export const CAST_EVENTS = ['delegate_and_cast_vote_batch', 'cast_vote_batch', 'cast_vote'] as const;
export type CastEvent = (typeof CAST_EVENTS)[number];

/** A page of one event's transactions in this round, after `after` and up to `upTo`, oldest first. */
export function txSearchUrl(event: CastEvent, round: string, after: number, upTo: number, page: number, perPage: number) {
  assertRound(round);
  const query = `${event}.vote_round_id='${round}' AND tx.height>${after} AND tx.height<=${upTo}`;
  const params = new URLSearchParams({ query: `"${query}"`, page: String(page), per_page: String(perPage), order_by: '"asc"' });
  return `${VOTE_CHAIN_RPC}/tx_search?${params}`;
}
export const statusUrl = () => `${VOTE_CHAIN_RPC}/status`;
export const headerUrl = (height: number) => `${VOTE_CHAIN_RPC}/header?height=${height}`;

export interface CastCount {
  height: number;
  questions: Record<number, number>;
}

function batchQuestions(attrs: Record<string, string>): number[] | null {
  if (!/^\d+(,\d+)*$/.test(attrs.proposal_ids ?? '')) return null;
  const ids = attrs.proposal_ids.split(',').map(Number);
  if (ids.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(ids).size !== ids.length ||
      (attrs.batch_size !== undefined && Number(attrs.batch_size) !== ids.length)) return null;
  return ids;
}

/** One cast: its block, and the questions it answers (null when a lone vote's question could not be read). */
export interface Cast {
  hash: string;
  height: number;
  questions: number[] | null;
}

const height = z.string().regex(/^\d+$/).transform(Number).refine(Number.isSafeInteger);
const pageSchema = z.object({
  result: z.object({
    total_count: height,
    txs: z.array(
      z.object({
        hash: z.string().min(1),
        height,
        tx: z.string(),
        tx_result: z.object({
          code: z.number().int().optional(),
          events: z.array(z.object({ type: z.string(), attributes: z.array(z.object({ key: z.string(), value: z.string().nullable() })) })),
        }),
      }),
    ),
  }),
});

/** One tx_search page as casts; failed transactions and events about other rounds are left out. */
export function parseCastPage(json: unknown, event: CastEvent, round: string): { total: number; txs: number; hashes: string[]; casts: Cast[] } {
  assertRound(round);
  const { result } = pageSchema.parse(json);
  const casts: Cast[] = [];
  for (const tx of result.txs) {
    if (tx.tx_result.code) continue;
    for (const e of tx.tx_result.events) {
      if (e.type !== event) continue;
      const attrs = Object.fromEntries(e.attributes.map((a) => [a.key, a.value ?? '']));
      if (attrs.vote_round_id !== round) continue;
      const questions =
        event === 'cast_vote'
          ? castVoteQuestion(tx.tx, round)
          : batchQuestions(attrs);
      casts.push({ hash: tx.hash, height: tx.height, questions: questions === null ? null : [questions].flat() });
    }
  }
  return { total: result.total_count, txs: result.txs.length, hashes: result.txs.map((tx) => tx.hash), casts };
}

/** Protobuf fields of one message, enough to read varints and byte strings. */
function protoFields(bytes: Uint8Array): Map<number, bigint | Uint8Array> {
  const fields = new Map<number, bigint | Uint8Array>();
  let i = 0;
  const varint = () => {
    let value = 0n;
    for (let shift = 0n; ; shift += 7n) {
      if (i >= bytes.length || shift > 63n) throw new Error('truncated');
      const byte = bytes[i++];
      value |= BigInt(byte & 0x7f) << shift;
      if (byte < 0x80) return value;
    }
  };
  while (i < bytes.length) {
    const key = Number(varint());
    const field = key >> 3;
    const wire = key & 7;
    if (wire === 0) fields.set(field, varint());
    else if (wire === 2) {
      const length = Number(varint());
      if (i + length > bytes.length) throw new Error('truncated');
      fields.set(field, bytes.subarray(i, i + length));
      i += length;
    } else if (wire === 1) i += 8;
    else if (wire === 5) i += 4;
    else throw new Error('unknown wire type');
  }
  return fields;
}

/**
 * The question a lone vote answers. The chain sends a one-byte message type, then MsgCastVote
 * (proto/svote/v1/tx.proto): field 4 is the question and field 6 the round. Null unless both read cleanly.
 */
export function castVoteQuestion(txBase64: string, round: string): number | null {
  try {
    const bytes = Uint8Array.from(atob(txBase64), (c) => c.charCodeAt(0));
    const fields = protoFields(bytes.subarray(1));
    const question = fields.get(4);
    const roundBytes = fields.get(6);
    if (typeof question !== 'bigint' || !(roundBytes instanceof Uint8Array)) return null;
    const roundHex = Array.from(roundBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return roundHex === round && question > 0n && question < 1000n ? Number(question) : null;
  } catch {
    return null;
  }
}

const timeSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)), 'not a time');
/** The chain's latest block, from /status. */
export function parseStatus(json: unknown): { height: number; time: number } {
  const { result } = z
    .object({ result: z.object({ sync_info: z.object({ latest_block_height: height, latest_block_time: timeSchema }) }) })
    .parse(json);
  return { height: result.sync_info.latest_block_height, time: Date.parse(result.sync_info.latest_block_time) };
}
/** A block's time, from /header. */
export function parseHeaderTime(json: unknown): number {
  return Date.parse(z.object({ result: z.object({ header: z.object({ time: timeSchema }) }) }).parse(json).result.header.time);
}

/** Votes per question so far, and the running total of the most-answered question over time. */
export function tallyCasts(casts: readonly Cast[], timeOf: (height: number) => number | null) {
  const perQuestion = new Map<number, number>();
  const times = new Map<number, number[]>();
  let unread = 0;
  for (const cast of casts) {
    if (!cast.questions) {
      unread++;
      continue;
    }
    const at = timeOf(cast.height);
    for (const id of new Set(cast.questions)) {
      perQuestion.set(id, (perQuestion.get(id) ?? 0) + 1);
      if (at === null) continue;
      const list = times.get(id) ?? [];
      list.push(at);
      times.set(id, list);
    }
  }
  const top = [...perQuestion].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? null;
  return { perQuestion, unread, topTimes: top === null ? [] : (times.get(top) ?? []) };
}
