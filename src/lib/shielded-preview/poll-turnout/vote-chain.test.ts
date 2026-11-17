import { describe, expect, it } from 'vitest';
import live from './nu7-1-vote-summary.json';
import { ROUND, castVoteTx, headerOf, statusOf, txOf, txSearch, type FakeCast } from './test-chain';
import { castVoteQuestion, parseCastPage, parseChainSummary, parseHeaderTime, parseStatus, tallyCasts, txSearchUrl } from './vote-chain';

const LIVE = () => structuredClone(live) as Record<string, unknown>;

describe('the vote chain summary (revealed shares)', () => {
  it('sums each question’s revealed shares across its options', () => {
    const summary = parseChainSummary(LIVE(), ROUND);
    expect(summary.status).toBe('active');
    expect(summary.endsAt).toBe('2026-12-01T02:59:00.000Z');
    expect(summary.totalShares).toBe(276);
    expect(summary.questions).toEqual([
      { id: 1, shares: 105 },
      { id: 2, shares: 43 },
      { id: 3, shares: 35 },
      { id: 4, shares: 45 },
      { id: 5, shares: 48 },
    ]);
  });
  it('refuses another round, a malformed body and a repeated question', () => {
    expect(() => parseChainSummary(LIVE(), '0'.repeat(64))).toThrow('another round');
    expect(() => parseChainSummary(LIVE(), 'nope')).toThrow('round id');
    expect(() => parseChainSummary({ ...LIVE(), proposals: [] }, ROUND)).toThrow();
    const twice = LIVE();
    twice.proposals = [(twice.proposals as unknown[])[0], (twice.proposals as unknown[])[0]];
    expect(() => parseChainSummary(twice, ROUND)).toThrow('twice');
  });
  it('reads counts serialized as strings, and missing ones as zero', () => {
    const body = LIVE();
    const [first] = body.proposals as { options: { ballot_count?: unknown }[] }[];
    first.options[0].ballot_count = '200';
    delete first.options[1].ballot_count;
    expect(parseChainSummary(body, ROUND).questions[0].shares).toBe(206);
  });
  it('rejects unsafe counts and totals instead of silently rounding the displayed shares', () => {
    const body = LIVE();
    const [first] = body.proposals as { options: { ballot_count?: unknown }[] }[];
    first.options[0].ballot_count = '9007199254740992';
    expect(() => parseChainSummary(body, ROUND)).toThrow();
    first.options[0].ballot_count = Number.MAX_SAFE_INTEGER;
    expect(() => parseChainSummary(body, ROUND)).toThrow('unsafe total');
  });
});

describe('votes as they are cast (RPC)', () => {
  const casts: FakeCast[] = [
    { event: 'delegate_and_cast_vote_batch', height: 100, questions: [1, 2, 3, 4, 5] },
    { event: 'delegate_and_cast_vote_batch', height: 120, questions: [1, 2] },
    { event: 'delegate_and_cast_vote_batch', height: 130, questions: [1], code: 5 },
    { event: 'delegate_and_cast_vote_batch', height: 140, questions: [3], round: 'a'.repeat(64) },
  ];
  const page = (event: FakeCast['event'], list: FakeCast[]) => txSearch(list, new URL(txSearchUrl(event, ROUND, 0, 1_000, 1, 50)));

  it('asks for one event in one round, after a block and up to another, oldest first', () => {
    const url = new URL(txSearchUrl('cast_vote', ROUND, 10, 20, 2, 50));
    expect(url.origin + url.pathname).toBe('https://prod.explorer-rpc.valargroup.org/tx_search');
    expect(url.searchParams.get('query')).toBe(`"cast_vote.vote_round_id='${ROUND}' AND tx.height>10 AND tx.height<=20"`);
    expect(url.searchParams.get('order_by')).toBe('"asc"');
    expect(() => txSearchUrl('cast_vote', "x' OR 1=1", 0, 1, 1, 1)).toThrow('round id');
  });
  it('reads each ballot’s questions, and leaves out failed transactions and other rounds', () => {
    const { total, txs, casts: read } = parseCastPage(page('delegate_and_cast_vote_batch', casts), 'delegate_and_cast_vote_batch', ROUND);
    expect([total, txs]).toEqual([4, 4]);
    expect(read).toEqual([
      { hash: 'TX0', height: 100, questions: [1, 2, 3, 4, 5] },
      { hash: 'TX1', height: 120, questions: [1, 2] },
    ]);
  });
  it('reads a lone vote’s question from the transaction itself', () => {
    expect(castVoteQuestion(castVoteTx(4), ROUND)).toBe(4);
    expect(castVoteQuestion(castVoteTx(4), 'b'.repeat(64))).toBeNull();
    expect(castVoteQuestion(btoa('\x03garbage'), ROUND)).toBeNull();
    expect(castVoteQuestion('%%%', ROUND)).toBeNull();
    const lone = parseCastPage(page('cast_vote', [{ event: 'cast_vote', height: 7, questions: [2] }]), 'cast_vote', ROUND);
    expect(lone.casts).toEqual([{ hash: 'TX0', height: 7, questions: [2] }]);
  });
  it('counts votes per question and keeps the most-answered question’s times', () => {
    const read = parseCastPage(page('delegate_and_cast_vote_batch', casts), 'delegate_and_cast_vote_batch', ROUND).casts;
    const { perQuestion, unread, topTimes } = tallyCasts([...read, { hash: 'x', height: 150, questions: null }], (h) => h * 10);
    expect([...perQuestion]).toEqual([[1, 2], [2, 2], [3, 1], [4, 1], [5, 1]]);
    expect(unread).toBe(1);
    expect(topTimes).toEqual([1000, 1200]);
  });
  it('reads the latest block and a block’s time', () => {
    expect(parseStatus(statusOf(1_000))).toEqual({ height: 1_000, time: Date.parse('2026-11-16T17:25:00Z') });
    expect(parseHeaderTime(headerOf(20))).toBe(Date.parse('2026-11-16T17:00:30Z'));
    expect(() => parseStatus({ result: {} })).toThrow();
  });
  it('builds transactions the way the chain indexes them', () => {
    expect(txOf({ event: 'cast_vote', height: 3, questions: [5] }, 0).tx_result.events[1].type).toBe('cast_vote');
  });
});
