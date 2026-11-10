import type { GrantRound } from '@/lib/shielded-preview/coinholder-grant-rounds';
import { Arrow, Link, type CollectionNavigate } from './governance-link';
import s from './governance-grant-rounds.module.css';

const day = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

/** A meter per round: the share of its own proposals that the vote approved, bars aligned so rounds compare at a glance. */
export default function GrantRounds({ rounds, onNavigate }: { rounds: GrantRound[]; onNavigate: CollectionNavigate }) {
  const latest = rounds.find(round => round.decided)?.id;
  return <ol className={s.rounds} aria-label="Coinholder grant rounds, newest first">{rounds.map(round => {
    const body = <>
      <span className={s.name}><strong>{round.label}</strong><small>{`${round.decided ? 'Closed' : 'Postponed'} ${day(round.date)}`}</small></span>
      {round.decided
        ? <span className={s.meter}>
          <span className={s.track} aria-hidden="true"><i style={{ width: `${round.approved! / round.proposals! * 100}%` }}/></span>
          <span className={s.figure}><b>{`${round.approved} of ${round.proposals}`}</b>{' approved'}</span>
          {round.note && <span className={s.caveat}>{round.note}</span>}
        </span>
        : <span className={s.meter}><span className={s.plain}>{round.note ?? 'No vote held'}</span></span>}
      <Arrow/>
    </>;
    // The latest decided round has its full results page; earlier rounds open their record in the poll archive.
    return <li key={round.id}>{round.id === latest
      ? <Link section="Results" onNavigate={onNavigate} className={s.row}>{body}</Link>
      : <Link section="Voting" id={`poll:${round.id}`} selection={{ lane: 'archive' }} onNavigate={onNavigate} className={s.row}>{body}</Link>}</li>;
  })}</ol>;
}
