'use client';

import type { ReactNode } from 'react';
import type { GovernanceData } from '@/lib/shielded-preview/governance-types';
import { paymentTotals, roundApplication } from '@/lib/shielded-preview/governance-metrics';
import { comparisons, questionResult, formatVoteShare } from '@/lib/shielded-preview/comparisons';
import { Arrow, Link, SourceInfo, Tabs, type CollectionNavigate } from './governance-collections';
import c from './governance-collections.module.css';
import s from './governance-insights.module.css';
import GovernanceReferences from './governance-references';
import ContextNotice from './context-notice';

const views = [
  { id: 'decisions', name: 'ZCG decisions', icon: 'proposals' },
  { id: 'payments', name: 'Grant payments', icon: 'grants' },
  { id: 'outcomes', name: 'Q3 outcomes', icon: 'results' },
  { id: 'panels', name: 'NU7 comparison', icon: 'zcap' },
] as const;
const money = (value: number | null) => value === null ? 'Not recorded' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const number = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value);
const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const label = (value: string) => value.replaceAll('_', ' ').replace(/^\w/, value => value.toUpperCase());
const programs = [
  { id: 'zcg_regular', name: 'Zcash Community Grants', sheet: 'grants_disbursed' },
  { id: 'coinholder', name: 'Coinholder grants', sheet: 'coinholder_grants' },
];

const shades = ['#eeeeee', '#b8b8b8', '#909090', '#6d6d6d', '#525252', '#3e3e3e'];
const share = (count: number, total: number) => total ? `${(count / total * 100).toFixed(1)}%` : '—';

function Metric({ name, children }: { name: string; children: ReactNode }) {
  return <span className={s.metric}><span className={s.metricLabel}>{name}</span><strong>{children}</strong></span>;
}
function Panel({ title, meta, children, className = '' }: { title: string; meta?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`${s.panel} ${className}`} aria-label={title}>
    <header className={s.panelHeading}><h2>{title}</h2>{meta && <span className={s.panelMeta}>{meta}</span>}</header>
    {children}
  </section>;
}
function Ring({ counts, total, caption }: { counts: number[]; total: number; caption: string }) {
  return <div className={s.ring}>
    <svg viewBox="0 0 180 180" fill="none" aria-hidden="true">
      <circle cx="90" cy="90" r="76" stroke="#292929" strokeWidth="13"/>
      {total > 0 && counts.map((count, index) => <circle key={index} cx="90" cy="90" r="76" pathLength="100" stroke={shades[index % shades.length]} strokeWidth="13"
        strokeDasharray={`${count / total * 100} 100`}
        strokeDashoffset={-counts.slice(0, index).reduce((sum, value) => sum + value, 0) / total * 100}
        transform="rotate(-90 90 90)"/>)}
    </svg>
    <div><strong>{number(total)}</strong><span>{caption}</span></div>
  </div>;
}
function Empty() { return <p className={s.empty}>No records available.</p>; }

export default function GovernanceInsights({ data, lane, onLane, onNavigate }: {
  data: GovernanceData; lane: string; onLane: (value: string) => void; onNavigate: CollectionNavigate;
}) {
  const view = views.some(item => item.id === lane) ? lane : 'decisions';
  const statuses = Object.entries(data.proposals.data.reduce<Record<string, number>>((totals, proposal) => {
    totals[proposal.status] = (totals[proposal.status] ?? 0) + 1;
    return totals;
  }, {})).sort((a, b) => b[1] - a[1]);
  const latestDecisions = data.proposals.data.filter(row => row.decided && row.status !== 'under_review')
    .sort((a, b) => b.decided!.localeCompare(a.decided!)).slice(0, 4);
  const grantPayments = data.payments.data.filter(row => programs.some(program => program.sheet === row.sourceSheet));
  const paid = paymentTotals(grantPayments);
  const latestPayments = grantPayments.filter(row => row.isPaid && row.paidOutDate)
    .sort((a, b) => b.paidOutDate.localeCompare(a.paidOutDate)).slice(0, 3);
  const results = data.verification.data?.rows ?? [];
  const outcomes = [...new Set(results.map(row => row.published))].sort((a, b) => a === 'Funded' ? -1 : b === 'Funded' ? 1 : a.localeCompare(b)).map(outcome => {
    const rows = results.filter(row => row.published === outcome);
    const applications = rows.map(row => roundApplication(row.id)).filter(row => row !== undefined);
    return { outcome, count: rows.length, requested: applications.length ? applications.reduce((sum, row) => sum + row.requestedUsdCents, 0) / 100 : null, missing: rows.length - applications.length };
  });
  const largestFunded = results.filter(row => row.published === 'Funded' && roundApplication(row.id))
    .sort((a, b) => roundApplication(b.id)!.requestedUsdCents - roundApplication(a.id)!.requestedUsdCents).slice(0, 3);
  const highestWeight = results.reduce<(typeof results)[number] | undefined>((highest, row) => !highest || row.total > highest.total ? row : highest, undefined);
  const round = comparisons.rounds[0];
  const titles = { decisions: 'Proposal decisions', payments: 'Recorded grant payments', outcomes: 'Q3 voting outcomes', panels: 'NU7 panel comparison' };
  const key = view as keyof typeof titles;

  return <div className={`${c.collection} ${s.insights}`}>
    <Tabs label="Insight views" value={view} items={views} onChange={onLane}/>
    <div className={c.layout}>
      <div className={view === 'panels' ? s.comparisonLayout : `${s.workspace} ${view === 'payments' || view === 'outcomes' ? s.metricsWorkspace : ''}`}>
        {view === 'decisions' && <>
          <Panel title="Decision breakdown" meta="ZCG archive">
            {statuses.length ? <div className={s.distribution}>
              <Ring counts={statuses.map(([, count]) => count)} total={data.proposals.data.length} caption="records"/>
              <div className={s.legend}>
                <div className={s.statusColumns} aria-hidden="true"><span>Status</span><span>Records</span><span>Share</span><span/></div>
                <ul className={s.statusList} aria-label="ZCG status distribution">{statuses.map(([status, count], index) => <li key={status}>
                  <Link section="Proposals" selection={{ lane: 'history', filter: status }} onNavigate={onNavigate} className={s.statusRow}>
                    <span className={s.statusName}><i style={{ background: shades[index % shades.length] }} aria-hidden="true"/>{label(status)}</span>
                    <strong>{number(count)}<span className={c.srOnly}> records</span></strong><span className={s.share}>{share(count, data.proposals.data.length)}<span className={c.srOnly}> share</span></span><Arrow/>
                  </Link>
                </li>)}</ul>
              </div>
            </div> : <Empty/>}
            <Link section="Proposals" selection={{ lane: 'history' }} onNavigate={onNavigate} className={s.panelAction}>Explore the archive<Arrow/></Link>
          </Panel>
          <Panel title="Latest decisions">
            <ul className={s.records} aria-label="Latest ZCG decisions">{latestDecisions.map(row => <li key={row.id}>
              <Link section="Proposals" id={`history:${row.id}`} selection={{ lane: 'history' }} onNavigate={onNavigate} className={s.record}>
                <div className={s.identity}><h3>{row.title}</h3><div className={s.meta}><span className={c.badge}>{label(row.status)}</span><time dateTime={row.decided!}>{date(row.decided!)}</time></div></div><Arrow/>
              </Link>
            </li>)}</ul>
            {!latestDecisions.length && <Empty/>}
          </Panel>
        </>}

        {view === 'payments' && <>
          <Panel title="Recorded payments" meta="All recorded dates" className={s.summaryPanel}>
            <div className={s.totals} aria-label="All grant programs">
              <Metric name="Historical budget · USD">{money(paid.count > paid.missingUsd ? paid.usd : null)}</Metric>
              <Metric name="Recorded ZEC">{paid.count > paid.missingZec ? number(paid.zec) : 'Not recorded'}</Metric>
            </div>
            <p className={s.entryCount}>{number(paid.count)} entries marked paid</p>
          </Panel>
            <ul className={s.programs} aria-label="Grant payment totals">{programs.map(program => {
              const totals = paymentTotals(grantPayments.filter(row => row.sourceSheet === program.sheet));
              return <li key={program.id}><Link section="Grants" selection={{ filter: program.id }} onNavigate={onNavigate} className={s.program}>
                <div className={s.programHeading}><h3>{program.name}</h3><Arrow/></div>
                <span className={s.programCount}>{number(totals.count)} paid entries</span>
                <div className={s.programMetrics}>
                  <Metric name="Budget USD">{money(totals.count > totals.missingUsd ? totals.usd : null)}</Metric>
                  <Metric name="Recorded ZEC">{totals.count > totals.missingZec ? number(totals.zec) : 'Not recorded'}</Metric>
                </div>
              </Link></li>;
            })}</ul>
          <Panel title="Latest payments" meta={`${latestPayments.length} latest · Budget USD`} className={s.detailPanel}>
            <ul className={s.records} aria-label="Latest recorded grant payments">{latestPayments.map(row => {
              const program = programs.find(program => program.sheet === row.sourceSheet)!;
              const grant = data.grants.data.find(grant => grant.program === program.id && grant.grant === row.project);
              return <li key={row.id}><Link section="Grants" id={grant ? `${grant.program}|${grant.grant}` : undefined} selection={grant ? undefined : { filter: program.id, search: row.project }} onNavigate={onNavigate} className={`${s.record} ${s.valuedRecord}`}>
                <div className={s.identity}><h3>{row.project}</h3><div className={s.meta}><time dateTime={row.paidOutDate}>{date(row.paidOutDate)}</time><span>{row.milestone ? (/^\d+$/.test(row.milestone) ? `Milestone ${row.milestone}` : row.milestone) : row.recipient}</span>{!grant && <span>Related grants</span>}</div></div>
                <strong className={s.recordValue}>{money(row.amountUsd)}</strong><Arrow/>
              </Link></li>;
            })}</ul>
            {!latestPayments.length && <Empty/>}
            <Link section="Grants" onNavigate={onNavigate} className={s.panelAction}>Explore all grants<Arrow/></Link>
          </Panel>
        </>}

        {view === 'outcomes' && <>
          <Panel title="Voting outcomes" meta="Coinholder · Q3 2026" className={s.summaryPanel}>
            {outcomes.length ? <div className={s.roundSummary}>
              <Ring counts={outcomes.map(row => row.count)} total={results.length} caption="proposals"/>
              <Link section="Results" onNavigate={onNavigate} className={s.summaryAction}>Explore all results<Arrow/></Link>
            </div> : <Empty/>}
          </Panel>
              <ul className={s.outcomes} aria-label="Q3 outcome totals">{outcomes.map((row, index) => <li key={row.outcome}>
                <Link section="Results" selection={{ filter: row.outcome }} onNavigate={onNavigate} className={s.outcome}>
                  <div className={s.outcomeHeading}><span className={s.statusName}><i style={{ background: shades[index % shades.length] }} aria-hidden="true"/>{row.outcome}</span><Arrow/></div>
                  <div className={s.outcomeCount}><strong>{row.count}</strong><span>{share(row.count, results.length)}</span></div>
                  <Metric name="Requested USD">{money(row.requested)}</Metric>
                  {row.missing > 0 && <span className={s.meta}>{row.missing} amounts unavailable</span>}
                </Link>
              </li>)}</ul>
          <Panel title="Largest requests" meta={`Top ${largestFunded.length} · Funded · USD`} className={s.detailPanel}>
            <ul className={s.records} aria-label="Largest requests with a Funded outcome">{largestFunded.map(row => <li key={row.id}>
              <Link section="Results" id={`q3:${row.id}`} selection={{ filter: 'Funded' }} onNavigate={onNavigate} className={`${s.record} ${s.valuedRecord}`}>
                <div className={s.identity}><h3>{row.title}</h3><div className={s.meta}><span>Ballot #{row.ballot}</span><span>{row.applicant}</span></div></div>
                <strong className={s.recordValue}>{money(roundApplication(row.id)!.requestedUsdCents / 100)}</strong><Arrow/>
              </Link>
            </li>)}</ul>
            {!largestFunded.length && <Empty/>}
            <Link section="Results" selection={{ filter: 'Funded' }} onNavigate={onNavigate} className={s.panelAction}>All funded outcomes<Arrow/></Link>
          </Panel>
        </>}

        {view === 'panels' && <Panel title="Leading responses" meta="NU7 · September 2026" className={s.comparisonPanel}>
          <ul className={s.questions} aria-label="NU7 leading responses by question">{round.questions.map((question, index) => <li key={question.id}>
            <Link section="ZCAP" selection={{ filter: question.id, basis: 'include' }} onNavigate={onNavigate} className={s.questionRow}>
              <div className={s.questionName}><span className={s.questionNumber}>{String(index + 1).padStart(2, '0')}</span><h3>{question.title}</h3></div>
              {round.bodies.map(body => {
                const result = questionResult(question, body.id, false);
                const leaders = result.options.filter(option => result.leaders.includes(option.id));
                return <span className={s.panelResult} key={body.id}><span className={s.bodyLabel}>{body.name}<small>{body.unit === 'votes' ? 'Member votes' : 'ZEC voting weight'}</small></span><strong>{leaders.length ? formatVoteShare(leaders[0].percent, leaders[0].weight, result.denominator) : '—'}</strong><span className={s.option}>{leaders.length ? leaders.map(option => option.label).join(' / ') : 'No leading response'}</span></span>;
              })}<span className={s.questionAction}>Compare responses<Arrow/></span>
            </Link>
          </li>)}</ul>
          <p className={s.comparisonNote}>Leading non-abstention options. Percentages include abstentions; each group has its own voting base.</p>
        </Panel>}
      </div>

      <ContextNotice>
        {view === 'decisions' && 'Approval is a decision status; payments and delivery are recorded separately.'}
        {view === 'payments' && 'Payment flags are not an independent transaction or delivery audit. Budget USD records historical values, not a current valuation.'}
        {view === 'outcomes' && '“Funded” is the voting outcome; requested amounts are not payments. Each ballot has its own voting weight. Weights are never added across proposals.'}
        {view === 'panels' && 'Each group has its own voting base. These shares are not turnout or proof of protocol activation.'}
      </ContextNotice>
      <GovernanceReferences key={view}><aside className={c.aside} aria-label={`${titles[key]}: context and sources`}>
        {view === 'decisions' && <>
          <div><h3>Calculation basis</h3><p>{number(data.proposals.data.length)} published ZCG records form the percentage base.</p></div>
          <SourceInfo source={data.proposals} name="OpenZcash ZCG archive"/>
        </>}
        {view === 'payments' && <>
          <div><h3>Payment basis</h3><dl className={c.definitions}><div><dt>Budget USD</dt><dd>Historical budget values on entries marked paid.</dd></div><div><dt>Recorded ZEC</dt><dd>Known ZEC values on those entries.</dd></div></dl>
          {(paid.missingUsd > 0 || paid.missingZec > 0) && <p className={s.note}>{paid.missingUsd > 0 ? `${paid.missingUsd} paid entries lack USD values. ` : ''}{paid.missingZec > 0 ? `${paid.missingZec} lack ZEC values. ` : ''}Missing values are excluded from their respective totals.</p>}</div>
          <SourceInfo source={data.payments} name="OpenZcash grant payment ledger"/>
        </>}
        {view === 'outcomes' && <>
          <div><h3>Round summary</h3><p>{results.length} published proposal results.</p>
          {highestWeight && <Link section="Results" id={`q3:${highestWeight.id}`} onNavigate={onNavigate} className={s.highlight}><span>Highest proposal weight</span><strong>{number(highestWeight.total)} ZEC</strong><span>{highestWeight.title}<Arrow/></span></Link>}
          </div>
          <SourceInfo source={data.verification} name="OpenZcash Q3 verification"/>
        </>}
        {view === 'panels' && <>
          <div><h3>Comparison basis</h3><p>The most-supported non-abstention option in each question. Shares include abstentions.</p>
          <dl className={`${c.definitions} ${s.panelDefinitions}`}>{round.bodies.map(body => <div key={body.id}><dt>{body.name}</dt><dd>{body.unit === 'votes' ? 'Member votes' : 'ZEC voting weight'} · separate denominator.</dd></div>)}</dl>
          </div>
          <SourceInfo reviewedAt={comparisons.checkedAt} name="Published NU7 panel tallies"/>
        </>}
      </aside></GovernanceReferences>
    </div>
  </div>;
}
