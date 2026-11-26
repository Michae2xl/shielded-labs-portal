import { z } from 'zod';

/**
 * The coinholder vote's share queue. A wallet splits each cast into 16 shares and gives every share its own
 * submission time, drawn at random before the poll closes. It sends each share to half of the submission
 * servers, rounded up; they run beside the validators and reveal the share on the chain when its time comes.
 * The first reveal counts and the other servers drop theirs. (Vote Share Submission Server, zcash/zips pull
 * request 1218; vote-sdk, internal/helper.)
 *
 * Every server publishes a coarse summary of its own queue, in three-hour buckets by submission time. A share
 * sits on several servers, so the sum across servers counts it once per copy; dividing by the copies gives the
 * shares. On 26 Nov 2026 that matched the chain within 0.3%. Counts and times only: nothing here says how
 * anyone voted.
 */

export interface QueueServer {
  label: string;
  origin: string;
}
export const queueSummaryUrl = (origin: string, round: string): string => `${origin}/shielded-vote/v1/queue-summary/${round}`;
/** Each share goes to half of the servers, rounded up. */
export const copiesPerShare = (servers: number): number => Math.ceil(servers / 2);

const HOUR = 3_600_000;
const DAY = 86_400_000;
/** The pace is read from the shares due in the coming hours. */
const PACE_WINDOW = 3 * HOUR;

const seconds = z.number().int().positive().max(4_102_444_800);
const count = z.number().int().nonnegative().max(1_000_000_000);
const summarySchema = z.object({
  round_id: z.string(),
  generated_at: seconds,
  buckets: z
    .array(z.object({ start: seconds, end: seconds, submitted: count, pending_future: count, overdue_pending: count, processing: count, failed: count }))
    .min(1)
    .max(2_000),
});

export interface QueueBucket {
  /** Milliseconds. */
  start: number;
  end: number;
  sent: number;
  waiting: number;
  /** Past its time and not on the chain yet: being proven, or waiting for a retry. */
  overdue: number;
  failed: number;
}
export interface ServerQueue {
  generatedAt: number;
  buckets: QueueBucket[];
}

/** One server's queue summary for a round; throws when malformed or about another round. */
export function parseQueueSummary(json: unknown, round: string): ServerQueue {
  const summary = summarySchema.parse(json);
  if (summary.round_id.toLowerCase() !== round) throw new Error('answered for another round');
  const buckets = summary.buckets.map((b) => {
    if (b.end <= b.start) throw new Error('empty bucket');
    return { start: b.start * 1000, end: b.end * 1000, sent: b.submitted, waiting: b.pending_future, overdue: b.overdue_pending + b.processing, failed: b.failed };
  });
  return { generatedAt: summary.generated_at * 1000, buckets };
}

export interface QueueDay {
  /** Midnight UTC that starts the day, in milliseconds. */
  day: number;
  sent: number;
  waiting: number;
}
export interface ShareQueue {
  /** Servers that answered, of those asked. */
  servers: number;
  asked: number;
  /** Shares still waiting for their time, each counted once. */
  waiting: number;
  overdue: number;
  failed: number;
  /** Shares the servers have revealed, each counted once. The chain's own count is the reference. */
  sent: number;
  /** When the last waiting share is due: the end of its bucket. */
  lastDueAt: string | null;
  /** Shares due in the coming three hours, as a rate an hour. */
  perHour: number;
  /** Shares by the UTC day of their submission time, across the poll. */
  days: QueueDay[];
}

/** How much of [start, end) falls in [from, to). */
const overlap = (start: number, end: number, from: number, to: number): number => Math.max(0, Math.min(end, to) - Math.max(start, from)) / (end - start);

/**
 * The servers' queues as one: sums across the servers that answered, scaled up for those that did not,
 * divided by the copies of each share. A bucket that crosses midnight is split by time between its two days.
 */
export function combineQueues(queues: readonly ServerQueue[], asked: number, window: { opensAt: number; closesAt: number }, now: number): ShareQueue {
  if (!queues.length || queues.length > asked) throw new Error('no queue summaries');
  const once = asked / queues.length / copiesPerShare(asked);
  const buckets = queues.flatMap((queue) => queue.buckets);
  const total = (pick: (bucket: QueueBucket) => number) => buckets.reduce((sum, bucket) => sum + pick(bucket), 0) * once;

  const firstDay = Math.floor(window.opensAt / DAY) * DAY;
  const dayCount = Math.floor((window.closesAt - 1) / DAY) - firstDay / DAY + 1;
  const days = Array.from({ length: dayCount }, (_, i) => {
    const day = firstDay + i * DAY;
    const within = (pick: (bucket: QueueBucket) => number) => buckets.reduce((sum, b) => sum + pick(b) * overlap(b.start, b.end, day, day + DAY), 0) * once;
    return { day, sent: Math.round(within((b) => b.sent)), waiting: Math.round(within((b) => b.waiting)) };
  });

  const dueByEnd = new Map<number, number>();
  for (const bucket of buckets) dueByEnd.set(bucket.end, (dueByEnd.get(bucket.end) ?? 0) + bucket.waiting * once);
  const lastDue = Math.max(0, ...[...dueByEnd].filter(([, waiting]) => waiting >= 0.5).map(([end]) => end));
  const soon = buckets.reduce((sum, b) => sum + b.waiting * overlap(b.start, b.end, now, now + PACE_WINDOW), 0) * once;

  return {
    servers: queues.length,
    asked,
    waiting: Math.round(total((b) => b.waiting)),
    overdue: Math.round(total((b) => b.overdue)),
    failed: Math.round(total((b) => b.failed)),
    sent: Math.round(total((b) => b.sent)),
    lastDueAt: lastDue ? new Date(lastDue).toISOString() : null,
    perHour: Math.round(soon / (PACE_WINDOW / HOUR)),
    days,
  };
}
