/** Test helpers: vote-chain RPC answers built from a few casts, the way the chain writes them. */
export const ROUND = '290ce255ee4c4d63457a55b3e72e07c579e44b6e578438a01c3eaad5c158991e';
export const T0 = Date.parse('2026-11-16T17:00:00Z');
/** Block times in these tests: one block every 1.5 seconds from T0. */
export const blockAt = (height: number) => T0 + height * 1500;

const varint = (n: number) => {
  const out: number[] = [];
  let v = n;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  out.push(v);
  return out;
};
const hexBytes = (hex: string) => Array.from({ length: hex.length / 2 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16));
/** A lone vote's transaction: one type byte, then MsgCastVote with the question (field 4) and the round (field 6). */
export function castVoteTx(question: number, round = ROUND) {
  const roundBytes = hexBytes(round);
  const bytes = [0x03, 0x0a, 2, 0xaa, 0xbb, 0x20, ...varint(question), 0x32, roundBytes.length, ...roundBytes, 0x2a, 3, 1, 2, 3];
  return btoa(String.fromCharCode(...bytes));
}

export interface FakeCast {
  event: 'delegate_and_cast_vote_batch' | 'cast_vote_batch' | 'cast_vote';
  height: number;
  questions: number[];
  code?: number;
  round?: string;
}
const attr = (key: string, value: string) => ({ key, value, index: true });
export function txOf(cast: FakeCast, i: number) {
  const round = cast.round ?? ROUND;
  const attributes =
    cast.event === 'cast_vote'
      ? [attr('vote_round_id', round), attr('leaf_index', '1,2')]
      : [attr('vote_round_id', round), attr('batch_size', String(cast.questions.length)), attr('proposal_ids', cast.questions.join(','))];
  return {
    hash: `TX${i}`,
    height: String(cast.height),
    tx: cast.event === 'cast_vote' ? castVoteTx(cast.questions[0], round) : btoa('batch'),
    tx_result: { code: cast.code ?? 0, events: [{ type: 'message', attributes: [] }, { type: cast.event, attributes }] },
  };
}
/** /tx_search for one event and height range, paged as the RPC pages it. */
export function txSearch(casts: readonly FakeCast[], url: URL) {
  const query = url.searchParams.get('query') ?? '';
  const event = /"(\w+)\.vote_round_id/.exec(query)?.[1];
  const after = Number(/tx\.height>(\d+)/.exec(query)?.[1] ?? 0);
  const upTo = Number(/tx\.height<=(\d+)/.exec(query)?.[1] ?? Infinity);
  const page = Number(url.searchParams.get('page') ?? 1);
  const perPage = Number(url.searchParams.get('per_page') ?? 30);
  const matching = casts.map(txOf).filter((tx, i) => casts[i].event === event && Number(tx.height) > after && Number(tx.height) <= upTo);
  return { jsonrpc: '2.0', id: -1, result: { total_count: String(matching.length), txs: matching.slice((page - 1) * perPage, page * perPage) } };
}
export const statusOf = (height: number) => ({
  result: { sync_info: { latest_block_height: String(height), latest_block_time: new Date(blockAt(height)).toISOString() } },
});
export const headerOf = (height: number) => ({ result: { header: { height: String(height), time: new Date(blockAt(height)).toISOString() } } });
