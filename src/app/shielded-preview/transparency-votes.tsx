'use client';

import record from '@/lib/shielded-preview/governance-data/record.json';
import { voteShares, type Debate } from '@/lib/shielded-preview/transparency/debates';
import { EvidenceTag, ExternalMark, day } from './transparency';
import t from './transparency.module.css';

type Poll = (typeof record.polls)[number];
const pollById = (id: string): Poll | undefined => record.polls.find(poll => poll.id === id);
const zec = (value: number) => `${Math.round(value).toLocaleString('en-US')} ZEC`;
const percent = (share: number) => (share > 0 && share < 0.001 ? '<0.1%' : `${(share * 100).toFixed(1)}%`);

/** What was measured on the question: the latest vote with published results, then the earlier votes. */
export function VotesCard({ debate }: { debate: Debate }) {
  const { vote } = debate;
  const latest = vote ? pollById(vote.pollId) : undefined;
  const earlier = debate.polls.filter(id => id !== vote?.pollId).map(pollById).filter((poll): poll is Poll => Boolean(poll));
  return <section className={`${t.block} ${t.votes}`} aria-labelledby={`votes-${debate.id}`}>
    <div className={t.blockHead}><h4 id={`votes-${debate.id}`}>Measured sentiment</h4><EvidenceTag kind="record" label="Votes held" small/></div>
    <div className={`${t.votesBody}${vote && latest ? '' : ` ${t.votesSingle}`}`}>
    {vote && latest
      ? <div className={t.vote}>
        <p className={t.voteMeta}>{latest.name} · {day(latest.date)}{latest.totalZec ? ` · ${zec(latest.totalZec)}` : ''}</p>
        <p className={t.voteQuestion}>{vote.question}</p>
        <ul className={t.voteBars}>{voteShares(vote).map(option => <li key={option.label}>
          <span className={t.voteLabel}>{option.label}</span><strong>{percent(option.share)}</strong>
          <span className={t.bar} aria-hidden="true"><i style={{ width: `${option.share > 0 ? Math.max(option.share * 100, 0.8) : 0}%` }}/></span>
        </li>)}</ul>
        <a className={t.sourceLink} href={vote.source} target="_blank" rel="noopener noreferrer">Published results<ExternalMark/></a>
      </div>
      : <p className={t.none}>{debate.polls.length ? 'No vote has been tallied on this question yet.' : 'No coinholder or ZCAP vote has been held on this question.'}</p>}
    {earlier.length > 0 && <div className={t.earlier}>
      <h5>Earlier votes</h5>
      <ul>{earlier.map(poll => <li key={poll.id}>
        <a href={poll.sources[0]} target="_blank" rel="noopener noreferrer">{poll.name}<ExternalMark/></a>
        <span>{day(poll.date)} · {poll.outcome}</span>
      </li>)}</ul>
    </div>}
    </div>
  </section>;
}
