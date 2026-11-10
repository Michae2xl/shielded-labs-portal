import record from './governance-data/record.json';

export type GrantRound = { id: string; label: string; date: string; decided: boolean; proposals: number | null; approved: number | null; note: string | null };
type Recorded = { id: string; date: string; grantRound?: Pick<GrantRound, 'label' | 'proposals' | 'approved' | 'note'> };

/** Every coinholder grant round in the poll archive, newest first. A live result replaces the archived count for its own round only. */
export function coinholderGrantRounds(live?: { label: string; proposals: number; approved: number }): GrantRound[] {
  return (record.polls as Recorded[]).flatMap(poll => {
    const round = poll.grantRound;
    if (!round) return [];
    const counts = live?.label === round.label ? { proposals: live.proposals, approved: live.approved } : { proposals: round.proposals, approved: round.approved };
    return [{ id: poll.id, label: round.label, date: poll.date, decided: counts.approved !== null && counts.proposals !== null, ...counts, note: round.note }];
  }).sort((a, b) => b.date.localeCompare(a.date));
}
