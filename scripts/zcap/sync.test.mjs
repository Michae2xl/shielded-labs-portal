import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collect, readApi } from './sync.mjs';
import { parseSivCount, parseSivHistory, recordSivCount, ZCAP_ELECTION_ID } from '../../src/lib/shielded-preview/poll-turnout/siv-history.ts';

const history = { version: 1, electionId: ZCAP_ELECTION_ID, observations: [{ at: '2026-11-17T04:07:00.000Z', ballots: 40, method: 'manual' }] };
const time = '2026-11-17T05:23:00.000Z';

test('uses total votes cast, never adds pending or invalidated votes', () => {
  assert.equal(parseSivCount({ num_votes: 42, num_pending_votes: 3, num_invalidated_votes: 2 }), 42);
  for (const num_votes of [null, '42', -1, 2.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => parseSivCount({ num_votes, num_pending_votes: 0, num_invalidated_votes: 0 }));
  }
  assert.throws(() => parseSivCount({ error: 'Unknown Election ID.' }));
});

test('40 then 42 stays 42, and retries replace this hour instead of double counting', () => {
  const first = recordSivCount(history, 42, time, 'api');
  const retried = recordSivCount(first, 42, '2026-11-17T05:30:00.000Z', 'api');
  assert.deepEqual(retried.observations.map((r) => r.ballots), [40, 42]);
  const later = recordSivCount(retried, 42, '2026-11-17T06:23:00.000Z', 'api');
  assert.deepEqual(later.observations.map((r) => r.ballots), [40, 42, 42]);
  assert.equal(later.observations.at(-1).at, '2026-11-17T06:23:00.000Z');
  assert.deepEqual(history.observations.map((r) => r.ballots), [40]);
});

test('rejects wrong elections, future or duplicate dates, and regressing totals', () => {
  assert.throws(() => parseSivHistory({ ...history, electionId: 'wrong' }));
  assert.throws(() => recordSivCount(history, 39, time, 'api'));
  assert.throws(() => recordSivCount(history, 42, '2026-11-16T05:23:00Z', 'api'));
  assert.throws(() => parseSivHistory({ ...history, observations: [...history.observations, ...history.observations] }));
  assert.throws(() => parseSivHistory(history, ZCAP_ELECTION_ID, Date.parse('2026-11-16T00:00:00Z')));
});

test('uses API data first and reads the public page only when the API cannot answer', async () => {
  let browserCalls = 0;
  const browser = async () => { browserCalls++; return 42; };
  const api = await collect(history, { api: async () => 42, browser, now: () => time });
  assert.equal(api.observations.at(-1).method, 'api');
  assert.equal(browserCalls, 0);
  const fallback = await collect(history, { api: async () => { throw new Error('checkpoint'); }, browser, now: () => time });
  assert.equal(fallback.observations.at(-1).method, 'browser');
  assert.equal(browserCalls, 1);
});

test('source errors preserve the previous history instead of publishing zero', async () => {
  const fail = async () => { throw new Error('unavailable'); };
  await assert.rejects(collect(history, { api: fail, browser: fail, now: () => time }));
  assert.equal(history.observations.at(-1).ballots, 40);
  await assert.rejects(readApi(async () => new Response('<html>checkpoint</html>')));
  await assert.rejects(readApi(async () => new Response('{}', { status: 403 })));
});
