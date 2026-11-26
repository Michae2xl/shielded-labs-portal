import { describe, expect, it } from 'vitest';
import { combineQueues, copiesPerShare, parseQueueSummary, queueSummaryUrl, type ServerQueue } from './share-queue';
import { ROUND } from './test-chain';

const at = (iso: string) => Date.parse(iso);
const secs = (iso: string) => at(iso) / 1000;
const bucket = (start: string, end: string, counts: Partial<Record<'submitted' | 'pending_future' | 'overdue_pending' | 'processing' | 'failed', number>> = {}) => ({
  start: secs(start), end: secs(end), submitted: 0, pending_future: 0, overdue_pending: 0, processing: 0, failed: 0, total: 0, ...counts,
});
const summary = (buckets: ReturnType<typeof bucket>[], round = ROUND) => ({
  round_id: round, bucket_seconds: 10_800, created_at_time: secs('2026-11-16T17:10:02Z'), vote_end_time: secs('2026-12-01T02:59:00Z'), generated_at: secs('2026-11-26T01:00:00Z'), ready: 0, not_yet_due: 0, processing: 0, buckets,
});
const WINDOW = { opensAt: at('2026-11-16T00:00:00Z'), closesAt: at('2026-12-01T02:59:00Z') };
const NOW = at('2026-11-26T01:00:00Z');

describe('a submission server’s queue summary', () => {
  it('is read as buckets of sent and waiting shares, with shares past their time counted together', () => {
    const queue = parseQueueSummary(summary([bucket('2026-11-25T23:10:02Z', '2026-11-26T02:10:02Z', { submitted: 40, pending_future: 80, overdue_pending: 2, processing: 1, failed: 3 })]), ROUND);
    expect(queue.generatedAt).toBe(NOW);
    expect(queue.buckets).toEqual([{ start: at('2026-11-25T23:10:02Z'), end: at('2026-11-26T02:10:02Z'), sent: 40, waiting: 80, overdue: 3, failed: 3 }]);
  });
  it('is refused when it is about another round, malformed, or has a bucket without a span', () => {
    const one = [bucket('2026-11-26T02:10:02Z', '2026-11-26T05:10:02Z')];
    expect(() => parseQueueSummary(summary(one, 'f'.repeat(64)), ROUND)).toThrow('another round');
    expect(() => parseQueueSummary({ round_id: ROUND, generated_at: 1, buckets: [] }, ROUND)).toThrow();
    expect(() => parseQueueSummary(summary([{ ...one[0], pending_future: -1 }]), ROUND)).toThrow();
    expect(() => parseQueueSummary(summary([bucket('2026-11-26T05:10:02Z', '2026-11-26T05:10:02Z')]), ROUND)).toThrow('empty bucket');
    expect(() => parseQueueSummary('<html>', ROUND)).toThrow();
  });
  it('is asked at the server’s own address', () => {
    expect(queueSummaryUrl('https://zvote.zfnd.org', ROUND)).toBe(`https://zvote.zfnd.org/shielded-vote/v1/queue-summary/${ROUND}`);
  });
});

describe('the queue across servers', () => {
  // Fifteen servers, eight copies of each share: every server holds 8/15 of the queue.
  const server = (scale = 1): ServerQueue =>
    parseQueueSummary(
      summary([
        bucket('2026-11-25T20:10:00Z', '2026-11-25T23:10:00Z', { submitted: 800 * scale }),
        bucket('2026-11-25T23:10:00Z', '2026-11-26T02:10:00Z', { submitted: 240 * scale, pending_future: 480 * scale, overdue_pending: 8 * scale }),
        bucket('2026-11-26T02:10:00Z', '2026-11-26T05:10:00Z', { pending_future: 1_600 * scale }),
        bucket('2026-11-29T23:10:00Z', '2026-11-30T02:10:00Z', { pending_future: 160 * scale }),
      ]),
      ROUND,
    );

  it('sends each share to half of the servers, rounded up', () => {
    expect([15, 14, 1].map(copiesPerShare)).toEqual([8, 7, 1]);
  });
  it('counts each share once: the sum across servers, divided by its copies', () => {
    const queue = combineQueues(Array.from({ length: 15 }, () => server()), 15, WINDOW, NOW);
    expect(queue).toMatchObject({ servers: 15, asked: 15, sent: 1_950, waiting: 4_200, overdue: 15, failed: 0 });
    expect(queue.lastDueAt).toBe('2026-11-30T02:10:00.000Z');
  });
  it('scales up for servers that did not answer, so the count does not drop with them', () => {
    const queue = combineQueues(Array.from({ length: 12 }, () => server()), 15, WINDOW, NOW);
    expect(queue).toMatchObject({ servers: 12, asked: 15, sent: 1_950, waiting: 4_200 });
  });
  it('reads the pace from the shares due in the coming three hours', () => {
    // 01:00 to 04:00: 70 of the 180 minutes of the first bucket's waiting shares, 110 of the next one's.
    const queue = combineQueues(Array.from({ length: 15 }, () => server()), 15, WINDOW, NOW);
    expect(queue.perHour).toBe(Math.round(((900 * 70) / 180 + (3_000 * 110) / 180) / 3));
  });
  it('lays the shares on the poll’s UTC days, splitting a bucket that crosses midnight by time', () => {
    const queue = combineQueues(Array.from({ length: 15 }, () => server()), 15, WINDOW, NOW);
    expect(queue.days).toHaveLength(16);
    expect(queue.days[0].day).toBe(at('2026-11-16T00:00:00Z'));
    expect(queue.days.at(-1)!.day).toBe(at('2026-12-01T00:00:00Z'));
    const day = (iso: string) => queue.days.find((d) => d.day === at(iso))!;
    // 23:10 to 02:10: 50 minutes on the 25th, 130 on the 26th.
    expect(day('2026-11-25T00:00:00Z')).toMatchObject({ sent: 1_500 + Math.round((450 * 50) / 180), waiting: Math.round((900 * 50) / 180) });
    expect(day('2026-11-26T00:00:00Z')).toMatchObject({ sent: Math.round((450 * 130) / 180), waiting: Math.round((900 * 130) / 180) + 3_000 });
    expect(day('2026-11-27T00:00:00Z')).toMatchObject({ sent: 0, waiting: 0 });
  });
  it('has no last due time once nothing waits, and refuses an empty or impossible set of answers', () => {
    const done = parseQueueSummary(summary([bucket('2026-11-25T20:10:00Z', '2026-11-25T23:10:00Z', { submitted: 80 })]), ROUND);
    expect(combineQueues([done], 15, WINDOW, NOW)).toMatchObject({ waiting: 0, lastDueAt: null, perHour: 0 });
    expect(() => combineQueues([], 15, WINDOW, NOW)).toThrow();
    expect(() => combineQueues([done, done], 1, WINDOW, NOW)).toThrow();
  });
});
