'use client';

import { useEffect, useState } from 'react';
import type { GovernanceData, Source } from '@/lib/shielded-preview/governance-types';
import { comparisons, questionResult, formatVoteShare, formatVotingWeight } from '@/lib/shielded-preview/comparisons';
import { participationRound } from '@/lib/shielded-preview/governance-participation';
import { Arrow, Link, type CollectionNavigate } from './governance-collections';
import ContextNotice from './context-notice';
import GovernanceParticipation, { GovernanceReference } from './governance-participation';
import s from './governance-overview.module.css';
import b from './governance-bento.module.css';

const money = (value: number | null) => value === null ? 'Not recorded' : new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: value % 1 ? 2 : 0,
}).format(value);
const date = (value: string) => new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(value));
function SourceStamp({ source }: { source: Source<unknown> }) {
  if (source.state !== 'snapshot' && source.state !== 'unavailable' && !source.error) return null;
  const state = source.state === 'unavailable' ? 'Source unavailable' : source.state === 'snapshot' ? 'Saved record' : 'Published record';
  return <span className={s.source}>{state}{source.observedAt && <> · <time dateTime={source.observedAt}>{date(source.observedAt)}</time></>}{source.error && source.state !== 'unavailable' ? ' · Refresh unavailable' : ''}</span>;
}

function NetworkComparison({ onNavigate }: { onNavigate: CollectionNavigate }) {
  const round = comparisons.rounds[0];
  const [selected, setSelected] = useState(round.questions[0].id);
  useEffect(() => {
    const read = () => {
      const id = new URLSearchParams(location.search).get('question');
      setSelected(round.questions.find(item => item.id === id)?.id ?? round.questions[0].id);
    };
    const timer = setTimeout(read, 0);
    window.addEventListener('popstate', read);
    window.addEventListener('shielded:navigate', read);
    return () => { clearTimeout(timer); window.removeEventListener('popstate', read); window.removeEventListener('shielded:navigate', read); };
  }, [round]);
  function chooseQuestion(id: string) {
    setSelected(id);
    const params = new URLSearchParams(location.search);
    params.set('question', id);
    history.replaceState(null, '', `?${params}`);
  }
  const question = round.questions.find(item => item.id === selected) ?? round.questions[0];
  return <section className={`${b.card} ${b.network}`} aria-labelledby="governance-network-heading">
    <header className={b.header}>
      <h3 id="governance-network-heading">NU7 scope</h3>
      <time className={b.meta} dateTime={round.resultDate}>{date(round.resultDate)}</time>
    </header>
    <div className={b.question}>
      <select value={question.id} onChange={event => chooseQuestion(event.target.value)} aria-label="Governance question">
        {round.questions.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
    </div>
    <div className={b.comparison} aria-live="polite">
      {round.bodies.map(body => {
        const result = questionResult(question, body.id, false);
        const leaders = result.options.filter(option => result.leaders.includes(option.id));
        const leader = leaders[0];
        const share = leader ? formatVoteShare(leader.percent, leader.weight, result.denominator) : '—';
        return <div key={body.id} className={b.electorate}>
          <div className={b.electorateHeading}><h4>{body.name}</h4><span>{body.unit === 'votes' ? 'Member ballots' : 'ZEC-weighted'}</span></div>
          <strong aria-label={leader ? `${share}, ${formatVotingWeight(leader.weight, body.decimals)} of ${formatVotingWeight(result.denominator, body.decimals)} ${body.unit}` : undefined}>{share.endsWith('%') ? <>{share.slice(0, -1)}<span>%</span></> : share}</strong>
          <span className={b.leadingOption}>{leaders.map(item => item.label).join(' / ') || 'Result unavailable'}</span>
          {leader?.percent != null && <span className={b.shareTrack} aria-hidden="true"><span style={{ width: `${leader.percent}%` }}/></span>}
        </div>;
      })}
    </div>
    <p className={b.note}>Leading responses · includes abstentions.</p>
    <Link section="ZCAP" selection={{ lane: 'comparison', filter: question.id, basis: 'include' }} onNavigate={onNavigate} className={b.footer}>Compare all responses<Arrow/></Link>
  </section>;
}

export default function GovernanceOverview({ data, pollCount, onNavigate }: {
  data: GovernanceData; pollCount: number; onNavigate: CollectionNavigate;
}) {
  const review = [...data.review.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const results = data.verification.data?.rows ?? [];
  const funded = results.filter(result => result.published === 'Funded').length;
  const rejected = results.filter(result => result.published === 'Rejected').length;
  const other = results.length - funded - rejected;
  const grants = data.grants.data.filter(grant => grant.lastPaid).sort((a, b) => b.lastPaid.localeCompare(a.lastPaid)).slice(0, 3);

  return <div className={s.overview}>
    <GovernanceParticipation/>

    <section className={s.group} aria-labelledby="governance-activity-heading">
      <header className={s.groupHeader}><h2 id="governance-activity-heading">Latest activity</h2></header>
      <div className={s.activityGrid}>
      <section className={`${b.card} ${s.applications}`} aria-labelledby="governance-review-heading">
        <header className={b.header}>
          <h3 id="governance-review-heading">ZCG applications</h3>
          <span className={b.meta}>Under review</span>
        </header>
        <div className={s.proposals}>
          {review.map(proposal => <Link key={proposal.number} section="Proposals" id={`review:${proposal.number}`} selection={{ lane: 'review' }} onNavigate={onNavigate} className={s.record}>
            <div className={s.recordInfo}><h4>{proposal.title}</h4><time className={s.recordDate} dateTime={proposal.createdAt}>{date(proposal.createdAt)}</time></div>
            <div className={s.recordMetric}><span>Requested · USD</span><strong>{money(proposal.amount)}</strong></div>
            <span className={s.recordArrow}><Arrow/></span>
          </Link>)}
          {!review.length && <p className={s.empty}>{data.review.state === 'unavailable' ? 'The review queue is unavailable.' : 'No applications awaiting review in this source.'}</p>}
        </div>
        <Link section="Proposals" selection={{ lane: 'review' }} onNavigate={onNavigate} className={b.footer}>View {data.review.state === 'unavailable' ? 'all' : `all ${data.review.data.length}`} applications<Arrow/></Link>
        <SourceStamp source={data.review}/>
      </section>

      <section className={`${b.card} ${s.payments}`} aria-labelledby="governance-funding-heading">
        <header className={b.header}>
          <h3 id="governance-funding-heading">Grant payments</h3>
          <span className={b.meta}>Milestones</span>
        </header>
        <div className={s.grantList}>
          {grants.map(grant => <Link key={`${grant.program}|${grant.grant}`} section="Grants" id={`${grant.program}|${grant.grant}`} onNavigate={onNavigate} className={s.record}>
            <div className={s.recordInfo}><h4>{grant.grant}</h4><time className={s.recordDate} dateTime={grant.lastPaid}>{date(grant.lastPaid)}</time></div>
            <div className={s.recordMetric} aria-label={`${grant.milestonesPaid} of ${grant.milestones} milestones marked paid`}><span>Marked paid</span><strong>{grant.milestonesPaid}<span className={s.metricTotal}> / {grant.milestones}</span></strong></div>
            <span className={s.recordArrow}><Arrow/></span>
          </Link>)}
          {!grants.length && <p className={s.empty}>No dated payment records available.</p>}
        </div>
        <Link section="Grants" onNavigate={onNavigate} className={b.footer}>View all grant records<Arrow/></Link>
        <SourceStamp source={data.grants}/>
      </section>
      </div>
    </section>

    <section className={s.group} aria-labelledby="governance-outcomes-heading">
      <header className={s.groupHeader}><h2 id="governance-outcomes-heading">Voting & governance</h2><div className={s.groupLinks}><Link section="How it works" onNavigate={onNavigate}>How it works<Arrow/></Link><Link section="ZIPs" onNavigate={onNavigate}>ZIP library<Arrow/></Link><Link section="Voting" selection={{lane:'archive'}} onNavigate={onNavigate}>{pollCount} archived polls<Arrow/></Link></div></header>
      <div className={b.grid}>
      <section className={`${b.card} ${b.grants}`} aria-labelledby="governance-results-heading">
        <header className={b.header}>
          <div><h3 id="governance-results-heading">Coinholder grants</h3>{results.length > 0 && <p className={b.meta}>{results.length} proposal ballots{other > 0 && ` · ${other} other outcomes`}</p>}</div>
          <span className={b.meta}>{data.verification.data?.round.label ?? 'Past round'}</span>
        </header>
        {results.length > 0 ? <>
          <div className={b.outcomes} aria-label="Published voting outcomes">
            <Link section="Results" selection={{ filter: 'Funded' }} onNavigate={onNavigate}><strong>{funded}</strong>{' '}<span>Funded</span><Arrow/></Link>
            <Link section="Results" selection={{ filter: 'Rejected' }} onNavigate={onNavigate}><strong>{rejected}</strong>{' '}<span>Rejected</span><Arrow/></Link>
          </div>
          <p className={b.note}>Voting results · payment records are under Grants.</p>
        </> : <p className={s.empty}>Voting results are currently unavailable.</p>}
        <Link section="Results" onNavigate={onNavigate} className={b.footer}>View results & rules<Arrow/></Link>
        <SourceStamp source={data.verification}/>
      </section>

      <NetworkComparison onNavigate={onNavigate}/>
      <GovernanceReference/>
      </div>
      <p className={b.reviewed}>Reviewed <time dateTime={participationRound.reviewedAt}>1 Nov 2026</time> · Rules vary by poll.</p>
    </section>

    <ContextNotice className={s.editorialNote}>Neutral governance information. A poll result, a grant payment and a network activation each have their own record.</ContextNotice>
  </div>;
}
