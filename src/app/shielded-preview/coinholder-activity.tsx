import type { CSSProperties } from 'react';
import type { ShareQueue } from '@/lib/shielded-preview/poll-turnout/share-queue';
import type { BodyTurnout, TurnoutSnapshot } from '@/lib/shielded-preview/poll-turnout/turnout';
import { SHARES_PER_VOTE } from '@/lib/shielded-preview/poll-turnout/vote-chain';
import { dayLabel, formatCount, stampLabel } from '@/lib/shielded-preview/poll-turnout/view';
import s from './coinholder-activity.module.css';

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const DAY = 86_400_000;
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });

/** A count short enough to sit on a day's bar: 21,247 reads as 21.2k. */
const short = (value: number): string => (value < 1_000 ? String(value) : `${(value / 1_000).toFixed(value < 100_000 ? 1 : 0)}k`);

/** When a figure was read; a reading kept from before the source stopped answering says so. */
function Observed({ at, stale }: { at?: string | null; stale?: boolean }) {
  if (!at) return <span className={s.observed}>Awaiting a reading</span>;
  return (
    <span className={s.observed}>
      {stale ? 'Last available' : 'Observed'} <time dateTime={at}>{stampLabel(Date.parse(at))}</time>
    </span>
  );
}

/** What the servers say about the queue, or what the chain implies when they do not answer. */
function queueReading(queue: ShareQueue | null, expected: number | null, onChain: number | null) {
  if (queue) return { waiting: queue.waiting, fromServers: true };
  if (expected === null || onChain === null) return null;
  return { waiting: Math.max(0, expected - onChain), fromServers: false };
}

/** A few shares are always mid-proof; only a real backlog (1% of the queue, or 50 shares) is called late. */
function QueueHealth({ queue }: { queue: ShareQueue }) {
  const late = queue.overdue + queue.failed;
  const servers = queue.servers === queue.asked ? `${queue.asked} servers answering` : `${queue.servers} of ${queue.asked} servers answering`;
  const behind = late >= Math.max(50, queue.waiting / 100);
  return <span className={s.line}>{servers}{behind ? `, ${formatCount(late)} shares running late` : ''}</span>;
}

/** Shares by the UTC day of their submission time: sent in a solid bar, still scheduled in an outlined one. */
function SharesByDay({ queue, now }: { queue: ShareQueue; now: number }) {
  const top = Math.max(1, ...queue.days.map((d) => d.sent + d.waiting));
  const today = Math.floor(now / DAY) * DAY;
  return (
    <section className={s.days} aria-labelledby="coinholder-shares-by-day">
      <header className={s.daysHead}>
        <h4 id="coinholder-shares-by-day">Shares by day</h4>
        <ul className={s.legend}>
          <li><i className={s.keySent} aria-hidden="true" />Sent to the chain</li>
          <li><i className={s.keyWaiting} aria-hidden="true" />Scheduled</li>
        </ul>
      </header>
      <ol className={s.columns} style={{ '--days': queue.days.length } as CSSProperties}>
        {queue.days.map((d) => {
          const total = d.sent + d.waiting;
          const spoken = `${dayLabel(d.day)}: ${formatCount(d.sent)} sent, ${formatCount(d.waiting)} scheduled`;
          return (
            <li key={d.day} className={s.column} data-today={d.day === today || undefined} aria-label={spoken} title={spoken}>
              <span className={s.amount} aria-hidden="true">{total ? short(total) : ''}</span>
              <span className={s.stack} aria-hidden="true" style={{ height: total ? `${Math.max(3, (total / top) * 100).toFixed(1)}%` : 0 }}>
                {d.waiting > 0 && <i className={s.waiting} style={{ flexGrow: d.waiting }} />}
                {d.sent > 0 && <i className={s.sent} style={{ flexGrow: d.sent }} />}
              </span>
              <span className={s.date} aria-hidden="true">{new Date(d.day).getUTCDate()}{new Date(d.day).getUTCDate() === 1 && <small> {MONTH.format(d.day)}</small>}</span>
            </li>
          );
        })}
      </ol>
      <p className={s.note}>From the public queue summaries of the {queue.asked} submission servers, each share counted once. UTC days.</p>
    </section>
  );
}

/** Casts beside the last poll's, shares on the chain against those the casts will send, and the queue between them. */
export function CoinholderActivity({ snapshot, body, now }: { snapshot: TurnoutSnapshot; body: BodyTurnout; now: number }) {
  const castRead = snapshot.casts;
  const casts = castRead?.data ? Object.values(castRead.data.questions).reduce((sum, n) => sum + n, 0) : null;
  const shares = body.value;
  // A cast count kept from an earlier reading can trail the shares: it is shown with its time, and nothing is derived from it.
  const current = casts !== null && castRead?.state === 'fetched';
  const implied = current ? casts * SHARES_PER_VOTE : null;
  const expected = implied !== null && (shares === null || implied >= shares) ? implied : null;
  const earlier = snapshot.earlier;
  const queue = snapshot.queue?.data ?? null;
  const reading = queueReading(queue, expected, shares);
  const widest = Math.max(1, casts ?? 0, earlier?.casts ?? 0);
  const arrived = expected && shares !== null ? Math.min(1, shares / expected) : null;
  return (
    <>
      <dl className={s.stats} aria-label="Coinholder activity across all questions">
        <div>
          <dt>Casts</dt>
          <dd className={s.figure}>{formatCount(casts)}</dd>
          {earlier && casts !== null && current && (
            <dd className={s.context}>
              <span className={s.line}>{percent.format(casts / earlier.casts)} of the {earlier.label}</span>
              <span className={s.compare} aria-hidden="true">
                <span>{snapshot.round.replace(/ poll$/, '')}</span><i className={s.barNow} style={{ width: `${(casts / widest) * 100}%` }} /><b>{formatCount(casts)}</b>
                <span>{earlier.label.replace(/ poll$/, '')}</span><i className={s.barThen} style={{ width: `${(earlier.casts / widest) * 100}%` }} /><b>{formatCount(earlier.casts)}</b>
              </span>
              <span className={s.srOnly}>{earlier.label}: {formatCount(earlier.casts)} casts in all.</span>
            </dd>
          )}
          <dd><Observed at={castRead?.observedAt} stale={castRead?.state === 'stale'} /></dd>
        </div>
        <div>
          <dt>Shares on chain</dt>
          <dd className={s.figure}>{formatCount(shares)}</dd>
          {arrived !== null && expected !== null && (
            <dd className={s.context}>
              <span className={s.line}>{percent.format(arrived)} of {formatCount(expected)} expected</span>
              <span className={s.progress} aria-hidden="true"><i style={{ width: `${(arrived * 100).toFixed(1)}%` }} /><b /></span>
              {earlier && <span className={s.line}>{earlier.label} ended with {formatCount(earlier.shares)}</span>}
            </dd>
          )}
          <dd><Observed at={body.observedAt} stale={body.state === 'stale'} /></dd>
        </div>
        <div>
          <dt>In queue</dt>
          <dd className={s.figure}>{reading ? formatCount(reading.waiting, true) : '—'}</dd>
          {reading && (
            <dd className={s.context}>
              {queue?.lastDueAt
                ? <span className={s.line}>shares scheduled through {dayLabel(Date.parse(queue.lastDueAt) - 1)}</span>
                : <span className={s.line}>{reading.fromServers ? 'no shares waiting' : `shares, from ${SHARES_PER_VOTE} a cast`}</span>}
              {queue && queue.perHour > 0 && <span className={s.line}>≈ {formatCount(queue.perHour)} an hour now</span>}
              {queue && <QueueHealth queue={queue} />}
            </dd>
          )}
          <dd><Observed at={(snapshot.queue?.data ? snapshot.queue : reading ? castRead : null)?.observedAt} stale={snapshot.queue?.state === 'stale'} /></dd>
        </div>
      </dl>
      {queue && <SharesByDay queue={queue} now={now} />}
    </>
  );
}
