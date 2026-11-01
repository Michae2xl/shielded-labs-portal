'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { GovernanceData, Source } from '@/lib/shielded-preview/governance-types';
import { comparisons, questionResult, formatVoteShare, formatVotingWeight } from '@/lib/shielded-preview/comparisons';
import { Arrow, Link, type CollectionNavigate } from './governance-collections';
import s from './governance-overview.module.css';

const money = (value: number | null) => value === null ? 'Not recorded' : new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: value % 1 ? 2 : 0,
}).format(value);
const date = (value: string) => new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(value));
const count = (source: Source<unknown[]>) => source.state === 'unavailable' ? '—' : source.data.length;

function SourceStamp({ source }: { source: Source<unknown> }) {
  const state = source.state === 'unavailable' ? 'Source unavailable' : source.state === 'snapshot' ? 'Saved record' : source.state === 'mirror' ? 'Published record' : 'Retrieved';
  return <span className={s.source}>{state}{source.observedAt && <> · <time dateTime={source.observedAt}>{date(source.observedAt)}</time></>}{source.error && source.state !== 'unavailable' ? ' · Refresh unavailable' : ''}</span>;
}

function DomainIcon({ kind }: { kind: 'funding' | 'decisions' | 'community' }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'funding' ? <><path d="M4 4h11l5 5v11H4zM14 4v6h6M8 14h8M8 17h5"/></> : kind === 'decisions' ? <><circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 7.5v9M18 10.5v1a4 4 0 0 1-4 4H6"/></> : <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/></>}
  </svg>;
}

function Domain({ kind, title, value, metric, children, links }: {
  kind: 'funding' | 'decisions' | 'community'; title: string; value: ReactNode;
  metric: string; children: ReactNode; links: ReactNode;
}) {
  return <section className={s.domain}>
    <header><h2>{title}</h2><DomainIcon kind={kind}/></header>
    <p className={s.domainDescription}>{children}</p>
    <p className={s.domainMetric}><strong>{value}</strong><span>{metric}</span></p>
    <div className={s.domainLinks}>{links}</div>
  </section>;
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
    return () => { clearTimeout(timer); window.removeEventListener('popstate', read); };
  }, [round]);
  function chooseQuestion(id: string) {
    setSelected(id);
    const params = new URLSearchParams(location.search);
    params.set('question', id);
    history.replaceState(null, '', `?${params}`);
  }
  const question = round.questions.find(item => item.id === selected) ?? round.questions[0];
  return <section className={`${s.panel} ${s.network}`} aria-labelledby="governance-network-heading">
    <header className={s.sectionHeader}>
      <h2 id="governance-network-heading">NU7 scope</h2>
      <span className={s.badge}>Published results</span>
    </header>
    <label className={s.question}>Compare responses
      <select value={question.id} onChange={event => chooseQuestion(event.target.value)} aria-label="Governance question">
        {round.questions.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
    </label>
    <div className={s.comparison} aria-live="polite">
      {round.bodies.map(body => {
        const result = questionResult(question, body.id, false);
        const leaders = result.options.filter(option => result.leaders.includes(option.id));
        const leader = leaders[0];
        return <div key={body.id} className={s.electorate}>
          <div className={s.electorateHeading}><h3>{body.name}</h3><span>{body.unit === 'votes' ? 'Member ballots' : 'ZEC-weighted'}</span></div>
          <div className={s.leadingOption}><span>{leaders.map(item => item.label).join(' / ') || 'Result unavailable'}</span><strong>{leader ? formatVoteShare(leader.percent, leader.weight, result.denominator) : '—'}</strong></div>
          <div className={s.track} aria-hidden="true"><span style={{ width: `${leader?.percent ?? 0}%` }}/></div>
          <p className={s.weight}>{leader ? `${formatVotingWeight(leader.weight, body.decimals)} / ${formatVotingWeight(result.denominator, body.decimals)} ${body.unit}` : 'No complete tally available'}</p>
        </div>;
      })}
    </div>
    <p className={s.note}>Leading response in each group. Percentages include abstentions; ballot counts and ZEC weight stay separate.</p>
    <Link section="ZCAP" selection={{ lane: 'comparison', filter: question.id, basis: 'include' }} onNavigate={onNavigate} className={s.panelAction}>Compare every response<Arrow/></Link>
    <span className={s.source}>Results · <time dateTime={round.resultDate}>{date(round.resultDate)}</time></span>
  </section>;
}

export default function GovernanceOverview({ data, pollCount, onNavigate }: {
  data: GovernanceData; pollCount: number; onNavigate: CollectionNavigate;
}) {
  const review = [...data.review.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const results = data.verification.data?.rows ?? [];
  const funded = results.filter(result => result.published === 'Funded').length;
  const rejected = results.filter(result => result.published === 'Rejected').length;
  const other = results.length - funded - rejected;
  const grants = data.grants.data.filter(grant => grant.lastPaid).sort((a, b) => b.lastPaid.localeCompare(a.lastPaid)).slice(0, 3);

  return <div className={s.overview}>
    <div className={s.domains} aria-label="Explore Zcash governance">
      <Domain kind="funding" title="Funding" value={count(data.review)} metric="proposals under review"
        links={<><Link section="Proposals" onNavigate={onNavigate}>Proposals<Arrow/></Link><Link section="Grants" onNavigate={onNavigate}>Grants<Arrow/></Link></>}>
        ZCG and coinholder grants, from applications to payment milestones.
      </Domain>
      <Domain kind="decisions" title="Decisions" value={pollCount} metric="polls in the archive"
        links={<><Link section="Voting" onNavigate={onNavigate}>Voting<Arrow/></Link><Link section="Results" onNavigate={onNavigate}>Results<Arrow/></Link></>}>
        Polls, network upgrades and the rules behind each published outcome.
      </Domain>
      <Domain kind="community" title="Participation" value={count(data.members)} metric="names on the ZCAP roster"
        links={<><Link section="ZCAP" selection={{ lane: 'members' }} onNavigate={onNavigate}>ZCAP members<Arrow/></Link><Link section="Insights" onNavigate={onNavigate}>Insights<Arrow/></Link></>}>
        ZCAP membership, community responses and governance insights.
      </Domain>
    </div>

    <div className={s.focusHeading}><h2>In focus</h2><a href="#governance-roles">Who decides?<Arrow/></a></div>
    <div className={s.workspace}>
      <section className={`${s.panel} ${s.review}`} aria-labelledby="governance-review-heading">
        <header className={s.sectionHeader}>
          <h2 id="governance-review-heading">ZCG proposals for review</h2>
          <span className={s.badge}>Applications</span>
        </header>
        <div className={s.proposals}>
          {review.map(proposal => <Link key={proposal.number} section="Proposals" id={`review:${proposal.number}`} onNavigate={onNavigate} className={s.proposal}>
            <div className={s.proposalInfo}><h3>{proposal.title}</h3><p>{proposal.applicant}<span aria-hidden="true">·</span><time dateTime={proposal.createdAt}>{date(proposal.createdAt)}</time></p></div>
            <div className={s.amount}><span>Requested</span><strong>{money(proposal.amount)}</strong></div><Arrow/>
          </Link>)}
          {!review.length && <p className={s.empty}>{data.review.state === 'unavailable' ? 'The review queue is unavailable.' : 'No applications awaiting review in this source.'}</p>}
        </div>
        <Link section="Proposals" onNavigate={onNavigate} className={s.panelAction}>View {data.review.state === 'unavailable' ? 'the' : `all ${data.review.data.length}`} proposals<Arrow/></Link>
        <SourceStamp source={data.review}/>
      </section>

      <NetworkComparison onNavigate={onNavigate}/>

      <section className={`${s.panel} ${s.grants}`} aria-labelledby="governance-funding-heading">
        <header className={s.sectionHeader}>
          <h2 id="governance-funding-heading">Recent payment records</h2>
          <span className={s.badge}>Milestones</span>
        </header>
        <div className={s.grantList}>
          {grants.map(grant => <Link key={`${grant.program}|${grant.grant}`} section="Grants" id={`${grant.program}|${grant.grant}`} onNavigate={onNavigate} className={s.grant}>
            <div><h3>{grant.grant}</h3><p>{grant.program === 'coinholder' ? 'Coinholder' : 'ZCG'}<span aria-hidden="true">·</span><time dateTime={grant.lastPaid}>{date(grant.lastPaid)}</time></p></div>
            <div className={s.paid}><span>Marked paid</span><strong>{grant.milestonesPaid}<span> / {grant.milestones}</span></strong><div className={s.track} aria-hidden="true"><span style={{ width: `${grant.milestones > 0 ? Math.min(100, grant.milestonesPaid / grant.milestones * 100) : 0}%` }}/></div></div><Arrow/>
          </Link>)}
          {!grants.length && <p className={s.empty}>No dated payment records available.</p>}
        </div>
        <Link section="Grants" onNavigate={onNavigate} className={s.panelAction}>Explore {data.grants.state === 'unavailable' ? '' : `${data.grants.data.length} `}grant records<Arrow/></Link>
        <SourceStamp source={data.grants}/>
      </section>

      <section className={`${s.panel} ${s.results}`} aria-labelledby="governance-results-heading">
        <header className={s.sectionHeader}>
          <h2 id="governance-results-heading">Coinholder outcomes · {data.verification.data?.round.label ?? 'Round'}</h2><span className={s.badge}>Closed</span>
        </header>
        {results.length > 0 ? <>
          <div className={s.outcomes} aria-label="Published voting outcomes">
            <Link section="Results" selection={{ filter: 'Funded' }} onNavigate={onNavigate}><span><i className={s.funded} aria-hidden="true"/>Funded</span><strong>{funded}</strong><Arrow/></Link>
            <Link section="Results" selection={{ filter: 'Rejected' }} onNavigate={onNavigate}><span><i className={s.rejected} aria-hidden="true"/>Rejected</span><strong>{rejected}</strong><Arrow/></Link>
          </div>
          <div className={s.outcomeBar} aria-hidden="true"><span className={s.funded} style={{ width: `${funded / results.length * 100}%` }}/><span className={s.rejected} style={{ width: `${rejected / results.length * 100}%` }}/></div>
          <p className={s.roundSize}>{results.length} proposal ballots{other > 0 && ` · ${other} other outcomes`}</p>
          <p className={s.note}>“Funded” is the vote outcome. Disbursements and paid milestones are recorded separately under Grants.</p>
        </> : <p className={s.empty}>Voting results are currently unavailable.</p>}
        <Link section="Results" onNavigate={onNavigate} className={s.panelAction}>Read the ballots & rules<Arrow/></Link>
        <SourceStamp source={data.verification}/>
      </section>
    </div>

    <section className={s.roles} id="governance-roles" aria-labelledby="governance-roles-heading">
      <header className={s.focusHeading}><h2 id="governance-roles-heading">Different roles. Clear responsibilities.</h2></header>
      <div className={s.roleGrid}>
        <section><h3>ZCG committee</h3><p>Reviews applications after community discussion and decides which ZCG grants to approve.</p><Link section="Proposals" onNavigate={onNavigate}>Follow the review process<Arrow/></Link></section>
        <section><h3>ZEC holders</h3><p>Vote in rounds with their own eligibility and rules, including the retroactive grants program.</p><Link section="Voting" onNavigate={onNavigate}>Read participation rules<Arrow/></Link></section>
        <section><h3>ZCAP</h3><p>The Zcash Community Advisory Panel provides advisory input and elects the ZCG committee.</p><Link section="ZCAP" selection={{ lane: 'members' }} onNavigate={onNavigate}>Explore the panel<Arrow/></Link></section>
      </div>
      <p className={s.editorialNote}>Neutral governance information. A poll result, a grant payment and a network activation each have their own record.</p>
    </section>
  </div>;
}
