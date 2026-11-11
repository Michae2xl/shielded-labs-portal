'use client';

import { useRef, type ReactNode } from 'react';
import record from '@/lib/shielded-preview/governance-data/record.json';
import type { GrantRecord, Source, Verification } from '@/lib/shielded-preview/governance-types';
import s from './governance-collections.module.css';
import a from './governance-archive.module.css';
import GovernanceGlyph, { type GovernanceGlyphKind } from './governance-glyph';
import GovernanceReferences from './governance-references';
import ContextNotice from './context-notice';
import { CurrentParticipationRound } from './governance-participation';
import { coinholderTotals, type CoinholderProposal } from '@/lib/shielded-preview/coinholder-proposals';
import { coinholderRoundLabel, coinholderRounds } from '@/lib/shielded-preview/coinholder-rounds';
import c from './coinholder-proposals.module.css';

import { devFundLane, devFundSources, devFundTimeline } from '@/lib/shielded-preview/governance-dev-fund';
import { DevFundProposals, DevFundVoting } from './governance-dev-fund';
import { Arrow, Link, type CollectionNavigate, type CollectionSelection } from './governance-link';

export { Arrow, Link };
export type { CollectionNavigate, CollectionSelection };
type Navigate = CollectionNavigate;
export type Controls = {
  search: string; onSearch: (value: string) => void;
  filter: string; onFilter: (value: string) => void;
  page: number; onPage: (page: number) => void; onNavigate: Navigate;
};
export type ProposalListItem = {
  id: string; title: string; applicant: string; amount: number | null; status: string;
  summary: string; submitted: string | null; decided: string | null; url: string | null;
  sourceUrl: string | null; origin: string; roundId?: string; rounds?: string[];
};
const pageSize = 12;
const money = (value: number | null) => value === null ? 'Not recorded' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const number = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : 'Not recorded';
const label = (value: string) => value.replaceAll('_', ' ').replace(/^\w/, c => c.toUpperCase());
const matches = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase());
export const visiblePage = (page: number, total: number) => Math.max(1, Math.min(page, Math.ceil(total / pageSize)));
export const pageRows = <T,>(rows: T[], page: number) => rows.slice((visiblePage(page, rows.length) - 1) * pageSize, visiblePage(page, rows.length) * pageSize);
const polls = record.polls.filter(poll => poll.kind !== 'test').sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
const pollTitles: Record<string, string> = {
  '2019-07-nu3-codename-straw-poll': 'NU3 codename · straw poll',
  '2019-staked-poll-dev-fund': 'Dev Fund petition · Staked',
  '2021-09-ecc-coinholder-poll': 'Post-NU5 priorities & ZIP 1014 · ECC',
  '2024-07-ywallet-devfund-polls': 'Dev Fund proposals · polls 1 & 2 · YWallet',
  '2024-07-ywallet-devfund-runoff': 'Dev Fund runoff · YWallet',
  '2024-12-nsm-coinholder-poll': 'Include NSM in NU7?',
  '2025-05-devfund-funding-model-poll': 'Dev Fund 2025 · funding-model ZIPs',
  '2025-09-cdrgp-ratification-poll': 'Retroactive Grants Program · ratification',
  '2025-11-cdrgp-q4-round': 'Retroactive grants · Q4 2025',
  '2026-02-nu7-protocol-feature-sentiment-poll': 'NU7 feature sentiment · 11 questions',
  '2026-04-cdrgp-q1-round': 'Coinholder grants · Q1 2026',
  '2026-06-zodl-nu7-poll': 'NU7 sentiment · Zodl (planned)',
  '2026-q2-cdrgp-round': 'Retroactive grants · Q2 2026',
  '2026-09-nu7-scope-coinholder-vote': 'NU7 scope',
  '2026-09-cdrgp-q3-round': 'Retroactive grants · Q3 2026',
};
const elections = [...record.elections].sort((a, b) => (b.date ?? b.month ?? '').localeCompare(a.date ?? a.month ?? ''));

export function Tabs({ label, value, items, onChange }: {
  label: string; value: string; items: readonly { id: string; name: string; count?: number; icon?: GovernanceGlyphKind }[]; onChange: (value: string) => void;
}) {
  return <nav className={s.collectionTabs} aria-label={label}>{items.map(item => <button key={item.id} type="button" aria-current={value === item.id ? 'page' : undefined} onClick={() => onChange(item.id)}>
    {item.icon && <GovernanceGlyph kind={item.icon} size={24}/>}<span className={s.tabName}>{item.name}</span>{item.count !== undefined && <span className={s.tabCount}>{item.count}</span>}
  </button>)}</nav>;
}

export function Search({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) {
  return <label className={s.search}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label={name} placeholder={name} value={value} onChange={event => onChange(event.target.value)}/></label>;
}

export function SourceInfo({ source, reviewedAt, name }: { source?: Source<unknown>; reviewedAt?: string; name: string }) {
  const state = !source ? 'Reviewed' : source.state === 'snapshot' ? 'Saved record' : source.state === 'mirror' ? 'Published record' : source.state === 'unavailable' ? 'Source unavailable' : 'Retrieved';
  return <div className={s.source}><strong>{name}</strong><p>{state} · {date(source?.observedAt ?? reviewedAt ?? null)}{source?.error ? ' · Refresh unavailable' : ''}</p>{source?.url.startsWith('https://') && <a href={source.url} target="_blank" rel="noopener noreferrer">View source{/^https:\/\/(www\.)?openzcash\.org(?:\/|$)/i.test(source.url) ? ' · OpenZcash' : ''}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></a>}</div>;
}

export function Pager({ page, total, onPage }: { page: number; total: number; onPage: (value: number) => void }) {
  const current = visiblePage(page, total);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1) return <p className={s.srOnly} role="status">{total} records</p>;
  return <div className={s.pager}><span>{total ? `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, total)} of ${total}` : '0 records'}</span>{pages > 1 && <div><button aria-label="Previous page" disabled={current === 1} onClick={() => onPage(current - 1)}><span className={s.previous}><Arrow/></span></button><span>{current} / {pages}</span><button aria-label="Next page" disabled={current === pages} onClick={() => onPage(current + 1)}><Arrow/></button></div>}</div>;
}

export function Empty({ onReset }: { onReset: () => void }) {
  return <div className={s.empty}><h3>No matching records</h3><p>Try another search or reset the filters.</p><button onClick={onReset}>Reset filters<Arrow/></button></div>;
}

export function Collection({ tabs, title, context, toolbar, summary, children, notice, aside, total, page, onPage, id, archive = false, bare = false }: {
  tabs: ReactNode; title: string; context: string; toolbar: ReactNode; summary?: ReactNode;
  children: ReactNode; notice: ReactNode; aside: ReactNode; total: number | null; page: number; onPage: (page: number) => void; id: string; archive?: boolean; bare?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  function changePage(next: number) {
    onPage(next);
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  return <div className={`${s.collection} ${archive ? a.archive : ''}`}>
    {archive ? <div className={a.collectionTools}>{tabs}{toolbar && <div className={a.searchTools}>{toolbar}</div>}</div> : <div className={s.collectionTools}>{tabs}<div className={s.toolbar}>{toolbar}</div></div>}
    <div className={s.layout}>
      <section className={`${s.main} ${archive && !bare ? a.panel : ''}`} aria-labelledby={`${id}-heading`}>
        <h2 className={s.srOnly} ref={heading} tabIndex={-1} id={`${id}-heading`}>{context}: {title}</h2>
        {archive ? summary && <div className={a.tools}>{summary}</div> : summary}
        {children}
        {total !== null && (archive ? <div className={a.pagination}><Pager page={page} total={total} onPage={changePage}/></div> : <Pager page={page} total={total} onPage={changePage}/>)}
      </section>
      <ContextNotice>{notice}</ContextNotice>
      <GovernanceReferences key={`${context}:${title}`}><aside className={s.aside} aria-label={`${title}: context and sources`}>{aside}</aside></GovernanceReferences>
    </div>
  </div>;
}

function DevFundAside() {
  return <><div><h3>Reading this timeline</h3><p>Dates and rules as published on {date(devFundTimeline.publishedAt)}. Times are UTC where the announcement gives one. Questions, answer choices and results appear here only after they are published.</p></div><SourceInfo name="ZCG and the Dev Fund: Timeline for Proposals and Polling" source={{ state: 'fetched', url: devFundSources.timeline, observedAt: devFundTimeline.publishedAt, error: false, data: null }}/></>;
}

export function ProposalsCollection({ datasets, coinholderSource, lane, onLane, source, round, onRound, busy, ...controls }: Controls & {
  datasets: { review: ProposalListItem[]; history: ProposalListItem[] };
  coinholderSource: Source<CoinholderProposal[] | null>;
  lane: string; onLane: (value: string) => void; source: Source<unknown>;
  round: string; onRound: (value: string) => void; busy: boolean;
}) {
  const { search, onSearch, filter, onFilter, page, onPage, onNavigate } = controls;
  // Old Q3 listing links now enter the complete Coinholder collection.
  const selected = lane === devFundLane ? devFundLane : lane === 'history' ? 'history' : lane === 'q3' || lane === 'coinholder' ? 'coinholder' : 'review';
  const tabs = <Tabs label="Proposal collections" value={selected} onChange={onLane} items={[{ id: 'review', name: 'ZCG review', count: datasets.review.length, icon: 'proposals' }, { id: 'history', name: 'ZCG history', count: datasets.history.length, icon: 'history' }, { id: 'coinholder', name: 'Coinholder', count: coinholderSource.data?.length, icon: 'grants' }, { id: devFundLane, name: 'ZCG / Dev Fund', icon: 'voting' }]}/>;
  if (selected === devFundLane) return <Collection archive bare id="dev-fund-proposals" title="ZCG / Dev Fund" context="Proposals"
    tabs={tabs} toolbar={null} total={null} page={page} onPage={onPage}
    notice="This process has its own timeline. ZCG applications and Coinholder grants are listed under their own tabs."
    aside={<DevFundAside/>}
  ><DevFundProposals onNavigate={onNavigate}/></Collection>;
  const isCoinholder = selected === 'coinholder';
  const unavailable = isCoinholder && coinholderSource.data === null;
  const rows: ProposalListItem[] = isCoinholder ? (coinholderSource.data ?? []).map(row => ({
    id: `coinholder:${row.number}`, title: row.title, applicant: row.applicant,
    amount: row.requestedUsdCents === null ? null : row.requestedUsdCents / 100, status: row.status,
    summary: row.summary, submitted: row.createdAt, decided: null, url: row.url,
    sourceUrl: row.url, origin: 'FPF applications', rounds: row.rounds,
  })) : datasets[selected];
  const statuses = [...new Set(rows.map(row => row.status))].sort();
  const filtered = rows.filter(row => matches(`${row.title} ${row.applicant}`, search) && (filter === 'all' || row.status === filter) && (!isCoinholder || round === 'all' || row.rounds?.includes(round)));
  // The selected round at a glance: how many applications, where they stand and what they request.
  const roundRows = isCoinholder ? rows.filter(row => round === 'all' || row.rounds?.includes(round)) : [];
  const standing = (...statuses: string[]) => roundRows.filter(row => statuses.includes(row.status)).length;
  const [ready, approved, vetoed, rejected] = [standing('Steps completed'), standing('Approved', 'Vetoed'), standing('Vetoed'), standing('Rejected')];
  const withoutAmount = roundRows.filter(row => row.amount === null).length;
  const roundSummary = isCoinholder && !unavailable ? <div className={`${c.summary} ${c.roundSummary}`}><dl>
    <div><dt>Applications</dt><dd>{roundRows.length}</dd></div>
    {ready > 0 && <div><dt>Ready for vote</dt><dd>{ready}</dd></div>}
    {approved + rejected > 0 && <><div><dt>Approved</dt><dd>{approved}</dd></div><div><dt>Rejected</dt><dd>{rejected}</dd></div></>}
    {vetoed > 0 && <div><dt>Later vetoed</dt><dd>{vetoed}</dd></div>}
    <div><dt>{withoutAmount ? 'Known requests · USD' : 'Total requested · USD'}</dt><dd>{roundRows.length > 0 && withoutAmount === roundRows.length ? '—' : money(roundRows.reduce((sum, row) => sum + (row.amount ?? 0), 0))}</dd></div>
  </dl>{withoutAmount > 0 && <div className={c.sourceState}><span>{withoutAmount} without a specified amount</span></div>}</div> : undefined;
  const titles = { review: 'Under review', history: 'Application history', coinholder: 'Coinholder applications' };
  const statusHeading = selected === 'review' ? 'Submitted' : 'Status';
  return <Collection archive id="proposals" title={titles[selected]} context={isCoinholder ? 'Coinholder grants' : 'Zcash Community Grants'}
    tabs={tabs} summary={roundSummary}
    toolbar={<><Search name="Search proposals" value={search} onChange={onSearch}/>{isCoinholder && <select aria-label="Filter Coinholder round" value={round} onChange={event => onRound(event.target.value)}><option value="all">All rounds</option>{coinholderRounds.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>}{statuses.length > 1 && <select aria-label="Filter proposal status" value={filter} onChange={event => onFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map(status => <option key={status} value={status}>{label(status)}</option>)}</select>}</>}
    total={unavailable ? null : filtered.length} page={page} onPage={onPage}
    notice={isCoinholder ? 'All submitted applications, including closed records and resubmissions. Amounts are requests; approval and payment are separate.' : 'Amounts are funding requests. Decisions, payments and delivery are tracked separately.'}
    aside={<><div><h3>Reading these applications</h3><p>A dash means the amount is not recorded.</p>{isCoinholder && <><p>Each application issue is counted once. Q2 applications carried into Q3 appear in both round filters, without increasing the total. Closed does not mean rejected.</p><p>Round assignments follow published application lists. Other records remain available under “Round not recorded”.</p>{coinholderRounds.filter(item => item.source && (round === 'all' || item.id === round)).map(item => <a key={item.id} href={item.source!} target="_blank" rel="noopener noreferrer">{item.label} · source ↗</a>)}</>}</div><SourceInfo name={isCoinholder ? 'FPF application history' : selected === 'history' ? 'OpenZcash ZCG archive' : 'OpenZcash review queue'} source={isCoinholder ? coinholderSource : source}/></>}
  >
    {unavailable ? <div className={c.empty} role="status"><h3>{busy ? 'Loading applications…' : 'Application history unavailable'}</h3><p>{busy ? 'Retrieving the complete FPF history.' : 'The source could not be read. Refresh the data to try again.'}</p></div> : <>
    <div className={a.columns} aria-hidden="true"><span>Proposal</span><div className={`${a.measures} ${a.fundingMeasures}`}><span>{statusHeading}</span><span className={a.money}>Requested · USD</span></div><span/></div>
    <ul className={a.rows} aria-label={titles[selected]}>{pageRows(filtered, page).map(row => <li key={row.id}><Link section="Proposals" id={row.id} selection={{ lane: selected, filter, search, page: visiblePage(page, filtered.length), ...(isCoinholder ? { round } : {}) }} onNavigate={onNavigate} className={a.record}>
      <span className={a.symbol} aria-hidden="true"><GovernanceGlyph kind="proposals" size={23}/></span>
      <div className={a.identity}><h3>{row.title}</h3><div className={a.meta}>{isCoinholder && <span>{coinholderRoundLabel(row.rounds ?? [])}</span>}{row.applicant.trim().toLowerCase() !== row.title.trim().toLowerCase() && <span className={isCoinholder ? c.historyApplicant : undefined}>{row.applicant}</span>}{selected !== 'review' && row.submitted && <time dateTime={row.submitted}>{date(row.submitted)}</time>}</div></div>
      <div className={`${a.measures} ${a.fundingMeasures}`}>
        <span className={a.measure}><span className={a.mobileLabel}>{statusHeading}</span>{selected === 'review' ? row.submitted ? <time dateTime={row.submitted}>{date(row.submitted)}</time> : <small>Not recorded</small> : <span className={a.status}>{label(row.status)}</span>}</span>
        <span className={`${a.measure} ${a.money}`}><span className={a.mobileLabel}>Requested · USD</span>{row.amount === null ? <small><span aria-hidden="true">—</span><span className={s.srOnly}>Not recorded</span></small> : <strong>{money(row.amount)}</strong>}</span>
      </div><Arrow/>
    </Link></li>)}</ul>
    {!filtered.length && <Empty onReset={() => { onSearch(''); onFilter('all'); onRound('all'); }}/>}</>}
  </Collection>;
}

export function GrantsCollection({ source, ...controls }: Controls & { source: Source<GrantRecord[]> }) {
  const { search, onSearch, filter, onFilter, page, onPage, onNavigate } = controls;
  const filtered = source.data.filter(row => matches(`${row.grant} ${row.grantee}`, search) && (filter === 'all' || row.program === filter));
  return <Collection archive id="grants" title="Funding ledger" context={filter === 'coinholder' ? 'Coinholder grants' : filter === 'zcg_regular' ? 'Zcash Community Grants' : 'ZCG & coinholder programs'}
    tabs={<Tabs label="Grant programs" value={filter} onChange={onFilter} items={[{ id: 'all', name: 'All programs', count: source.data.length, icon: 'overview' }, { id: 'zcg_regular', name: 'ZCG', count: source.data.filter(row => row.program === 'zcg_regular').length, icon: 'zcap' }, { id: 'coinholder', name: 'Coinholder', count: source.data.filter(row => row.program === 'coinholder').length, icon: 'grants' }]}/>}
    toolbar={<Search name="Search grants" value={search} onChange={onSearch}/>}
    total={filtered.length} page={page} onPage={onPage}
    notice="“Paid” is a ledger status, not independent verification of a transaction or project delivery. Budget values reflect the source record, not a current ZEC conversion."
    aside={<><div><h3>Funding basis</h3><dl className={s.definitions}><div><dt>Budget</dt><dd>USD value recorded by the source.</dd></div><div><dt>Milestones marked paid</dt><dd>Payment flags in the ledger.</dd></div></dl></div><SourceInfo name="OpenZcash grant records" source={source}/></>}
  >
    <div className={a.columns} aria-hidden="true"><span>Grant</span><div className={`${a.measures} ${a.fundingMeasures}`}><span>Milestones<small>Marked paid</small></span><span className={a.money}>Budget · USD</span></div><span/></div>
    <ul className={a.rows} aria-label="Grant records">{pageRows(filtered, page).map(row => <li key={`${row.program}|${row.grant}`}><Link section="Grants" id={`${row.program}|${row.grant}`} selection={{ filter, search, page: visiblePage(page, filtered.length) }} onNavigate={onNavigate} className={a.record}>
      <span className={a.symbol} aria-hidden="true"><GovernanceGlyph kind="grants" size={23}/></span>
      <div className={a.identity}><h3>{row.grant}</h3><div className={a.meta}>{row.grantee.trim().toLowerCase() !== row.grant.trim().toLowerCase() && <span>{row.grantee}</span>}{filter === 'all' && <span>{row.program === 'coinholder' ? 'Coinholder' : 'ZCG'}</span>}<span className={a.outcome}>{label(row.status)}</span></div></div>
      <div className={`${a.measures} ${a.fundingMeasures}`}>
        <span className={`${a.measure} ${a.milestones}`}><span className={a.mobileLabel}>Milestones <span className={s.srOnly}>marked </span>paid</span><strong>{row.milestonesPaid}<small> / {row.milestones}</small></strong>{row.milestones > 0 && row.milestonesPaid >= 0 && row.milestonesPaid <= row.milestones && <span className={a.track} aria-hidden="true"><span style={{ width: `${row.milestonesPaid / row.milestones * 100}%` }}/></span>}</span>
        <span className={`${a.measure} ${a.money}`}><span className={a.mobileLabel}>Budget · USD</span><strong>{money(row.usd)}</strong></span>
      </div><Arrow/>
    </Link></li>)}</ul>
    {!filtered.length && <Empty onReset={() => { onSearch(''); onFilter('all'); }}/>}
  </Collection>;
}

function pollStatus(status: string) {
  const names: Record<string, string> = {
    closed: 'Closed', closed_results_published: 'Results published',
    closed_no_official_tally: 'No official tally', closed_final_tally_not_preserved: 'Tally not preserved',
    paused_before_voting: 'Paused before voting', postponed_merged_into_q3: 'Postponed · moved to Q3',
  };
  return names[status] ?? label(status);
}

export function VotingCollection({ source, lane, onLane, busy, ...controls }: Controls & {
  source: Source<CoinholderProposal[] | null>; lane: string; onLane: (value: string) => void; busy: boolean;
}) {
  const { search, onSearch, filter, onFilter, page, onPage, onNavigate } = controls;
  const isCurrent = lane === 'current';
  const isUpgrade = lane === 'upgrades';
  const tabs = <Tabs label="Voting collections" value={lane} onChange={onLane} items={[
    { id: 'current', name: 'Current proposals', icon: 'proposals' },
    { id: 'archive', name: 'Poll archive', icon: 'history' },
    { id: 'upgrades', name: 'Network upgrades', icon: 'network' },
    { id: devFundLane, name: 'ZCG / Dev Fund', icon: 'voting' },
  ]}/>;
  if (lane === devFundLane) return <Collection archive bare id="dev-fund-voting" title="ZCG / Dev Fund" context="Voting"
    tabs={tabs} toolbar={null} total={null} page={page} onPage={onPage}
    notice="Polls inform decisions. ZIP status, node releases and network activation remain separate milestones."
    aside={<DevFundAside/>}
  ><DevFundVoting onNavigate={onNavigate}/></Collection>;
  if (isCurrent) {
    const rows = (source.data ?? []).filter(row => row.readyForCurrentVote);
    const categories = [...new Set(rows.map(row => row.category).filter((category): category is string => Boolean(category)))];
    const filtered = rows.filter(row => matches(`${row.title} ${row.applicant} ${row.summary}`, search) && (filter === 'all' || row.category === filter));
    const totals = coinholderTotals(rows);
    const unavailable = source.data === null;
    return <><CurrentParticipationRound compact/><Collection archive id="coinholder-proposals" title="Current proposals" context="Coinholder grants"
      tabs={tabs}
      toolbar={<><Search name="Search current proposals" value={search} onChange={onSearch}/>{categories.length > 1 && <select aria-label="Proposal category" value={filter} onChange={event => onFilter(event.target.value)}><option value="all">All categories</option>{categories.map(category => <option key={category}>{category}</option>)}</select>}</>}
      summary={<div className={c.summary}><dl><div><dt>Proposals</dt><dd>{unavailable ? '—' : rows.length}</dd></div><div><dt>{totals.missingAmounts ? 'Known requests · USD' : 'Total requested · USD'}</dt><dd>{unavailable || rows.length > 0 && totals.missingAmounts === rows.length ? '—' : money(totals.requestedUsdCents / 100)}</dd></div></dl><div className={c.sourceState}>{source.observedAt && <span>{source.error ? 'Saved' : 'Updated'} <time dateTime={source.observedAt}>{date(source.observedAt)}</time></span>}{source.error && <span>Refresh unavailable</span>}{totals.missingAmounts > 0 && <span>{totals.missingAmounts} without a specified amount</span>}</div></div>}
      total={unavailable ? null : filtered.length} page={page} onPage={onPage}
      notice="Funding requests for the current round. Voting outcomes and grant payments are recorded separately."
      aside={<><div><h3>Included applications</h3><p>Open Q4 applications marked “Ready For Vote - All Steps Completed” by the FPF. Earlier rounds, withdrawn and decided applications are excluded. Updates every five minutes.</p></div><SourceInfo name="FPF · Coinholder applications on GitHub" source={source}/></>}
    >
      <ul className={c.rows} aria-label="Current Coinholder proposals">{pageRows(filtered, page).map(row => <li key={row.number}><Link section="Voting" id={`proposal:${row.round}:${row.number}`} selection={{ lane: 'current', filter, search, page: visiblePage(page, filtered.length) }} onNavigate={onNavigate} className={c.row}>
        <div className={c.identity}><div className={c.meta}><span>#{row.number}</span>{row.category && <span>{row.category}</span>}<time dateTime={row.createdAt}>{date(row.createdAt)}</time></div><h3>{row.title}</h3><p className={c.excerpt}>{row.summary}</p><span className={c.applicant}>{row.applicant}</span></div>
        <div className={c.amount}><span>Requested · USD</span><strong>{row.requestedUsdCents === null ? 'Not specified' : money(row.requestedUsdCents / 100)}</strong><span className={c.view}>View proposal<Arrow/></span></div>
      </Link></li>)}</ul>
      {unavailable ? <div className={c.empty} role="status"><h3>{busy ? 'Loading current proposals…' : 'Current proposals unavailable'}</h3><p>{busy ? 'Checking the FPF applications.' : 'The source could not be reached. Try refreshing the data below.'}</p></div> : !rows.length ? <div className={c.empty}><h3>No eligible applications yet</h3><p>Completed applications will appear here after they are marked ready by the FPF.</p></div> : !filtered.length && <Empty onReset={() => { onSearch(''); onFilter('all'); }}/>}
    </Collection></>;
  }
  const filteredPolls = polls.filter(row => matches(`${row.name} ${pollTitles[row.id] ?? ''}`, search));
  const upgrades = [...record.upgrades].reverse().filter(row => matches(`${row.name} ${row.zips.join(' ')}`, search));
  return <><CurrentParticipationRound compact/><Collection archive id="voting" title={isUpgrade ? 'Network upgrades' : 'Poll archive'} context={isUpgrade ? 'Protocol decisions' : 'Coinholder participation'}
    tabs={tabs}
    toolbar={<Search name={isUpgrade ? 'Search network upgrades' : 'Search voting archive'} value={search} onChange={onSearch}/>}
    total={isUpgrade ? upgrades.length : filteredPolls.length} page={page} onPage={onPage}
    notice="Polls inform decisions. ZIP status, node releases and network activation remain separate milestones."
    aside={<SourceInfo name="OpenZcash governance archive" reviewedAt={record.checkedAt}/>}
  >
    <div className={a.columns} aria-hidden="true"><span>{isUpgrade ? 'Network upgrade' : 'Poll'}</span><div className={a.measures}><span>{isUpgrade ? 'Stage' : 'Status'}</span><span>{isUpgrade ? 'Activation' : 'Recorded date'}</span></div><span/></div>
    <ul className={a.rows} aria-label={isUpgrade ? 'Network upgrades' : 'Coinholder polls'}>{isUpgrade ? pageRows(upgrades, page).map(row => <li key={row.name}><Link section="Voting" id={`upgrade:${row.name}`} selection={{ lane: 'upgrades', filter, search, page: visiblePage(page, upgrades.length) }} onNavigate={onNavigate} className={a.record}>
      <span className={a.symbol} aria-hidden="true"><GovernanceGlyph kind="network" size={23}/></span>
      <div className={a.identity}><h3>{row.name}</h3><div className={a.meta}>{row.zips.map(zip => `ZIP ${zip}`).join(' · ') || 'No ZIP listed'}</div></div>
      <div className={a.measures}><span className={a.measure}><span className={a.mobileLabel}>Stage</span><span className={a.status}>{row.height ? 'Activated' : 'Protocol work'}</span></span><span className={a.measure}><span className={a.mobileLabel}>Activation</span>{row.time ? <time dateTime={row.time}>{date(row.time)}</time> : <small>Not recorded</small>}{row.height !== null && <small>Block {number(row.height)}</small>}</span></div><Arrow/>
    </Link></li>) : pageRows(filteredPolls, page).map(row => <li key={row.id}><Link section="Voting" id={`poll:${row.id}`} selection={{ lane: 'archive', filter, search, page: visiblePage(page, filteredPolls.length) }} onNavigate={onNavigate} className={a.record}>
      <span className={a.symbol} aria-hidden="true"><GovernanceGlyph kind="voting" size={23}/></span>
      <div className={a.identity}><h3>{pollTitles[row.id] ?? row.name}</h3><div className={a.meta}><span>{row.scope === 'fund' ? 'Funding' : 'Protocol & funding model'}</span>{row.informal && <span>Informal</span>}{row.kind === 'sentiment' && <span>Advisory</span>}</div></div>
      <div className={a.measures}><span className={a.measure}><span className={a.mobileLabel}>Status</span><span className={a.status}>{pollStatus(row.status)}</span></span><span className={a.measure}><span className={a.mobileLabel}>Recorded date</span>{row.date ? <time dateTime={row.date}>{date(row.date)}</time> : <small>Not recorded</small>}</span></div><Arrow/>
    </Link></li>)}</ul>
    {!(isUpgrade ? upgrades.length : filteredPolls.length) && <Empty onReset={() => onSearch('')}/>}
  </Collection></>;
}

const acceptShare = (share: number | null) => share === null ? 'Not recorded' : share > .999 && share < 1 ? '>99.9%' : share > 0 && share < .001 ? '<0.1%' : `${(share * 100).toFixed(1)}%`;

export function ResultsCollection({ source, lane, onLane, ...controls }: Controls & {
  source: Source<Verification | null>; lane: string; onLane: (value: string) => void;
}) {
  const { search, onSearch, filter, onFilter, page, onPage, onNavigate } = controls;
  const isElection = lane === 'elections';
  const results = source.data?.rows ?? [];
  const filtered = results.filter(row => matches(`${row.title} ${row.applicant} ${row.ballot}`, search) && (filter === 'all' || row.published === filter));
  const filteredElections = elections.filter(row => matches(`${row.label} ${row.elected.map(person => person.name).join(' ')}`, search));
  return <Collection archive id="results" title={isElection ? 'Committee elections' : 'Q3 2026 outcomes'} context={isElection ? 'Zcash Community Grants' : 'Coinholder grants'}
    tabs={<Tabs label="Result collections" value={isElection ? 'elections' : 'q3'} onChange={onLane} items={[{ id: 'q3', name: 'Coinholder · Q3 2026', count: results.length, icon: 'results' }, { id: 'elections', name: 'ZCG elections', count: elections.length, icon: 'zcap' }]}/>}
    toolbar={<Search name={isElection ? 'Search elections' : 'Search voting results'} value={search} onChange={onSearch}/>}
    summary={!isElection && <div className={a.filters} role="group" aria-label="Filter voting results">{['all', 'Funded', 'Rejected'].map(outcome => <button key={outcome} aria-pressed={filter === outcome} onClick={() => onFilter(outcome)}><span>{outcome === 'all' ? 'All' : outcome}</span><strong>{outcome === 'all' ? results.length : results.filter(row => row.published === outcome).length}</strong></button>)}</div>}
    total={isElection ? filteredElections.length : filtered.length} page={page} onPage={onPage}
    notice={isElection ? 'Voters can support several candidates. Candidate approvals are not added to count unique voters.' : '“Funded” is a voting outcome. Payment records are available under Grants. ZEC weights apply to each proposal and are never added across ballots.'}
    aside={isElection ? <SourceInfo name="OpenZcash election archive" reviewedAt={record.checkedAt}/> : <>
      <div><h3>Outcome & verification</h3><p>Accept share excludes abstentions.</p><dl className={s.checks}><div><dt>Quorum met</dt><dd>{results.filter(row => row.quorumMet).length} / {results.length}</dd></div><div><dt>Rule agreement</dt><dd>{results.filter(row => row.agrees).length} / {results.length}</dd></div></dl></div>
      <SourceInfo name="OpenZcash Q3 verification" source={source}/>
    </>}
  >
    <div className={a.columns} aria-hidden="true"><span>{isElection ? 'Election & elected members' : 'Ballot & proposal'}</span><div className={`${a.measures} ${isElection ? a.electionMeasures : a.resultMeasures}`}>{isElection ? <><span>Ballots</span><span>Seats</span><span>Recorded date</span></> : <><span>Accept share<small>Excludes abstentions</small></span><span>Voting weight<small>ZEC · per proposal</small></span></>}</div><span/></div>
    <ul className={a.rows} aria-label={isElection ? 'Committee elections' : 'Q3 proposal results'}>{isElection ? pageRows(filteredElections, page).map(row => <li key={row.id}><Link section="Results" id={`election:${row.id}`} selection={{ lane: "elections", filter, search, page: visiblePage(page, filteredElections.length) }} onNavigate={onNavigate} className={a.record}>
      <span className={a.symbol} aria-hidden="true"><GovernanceGlyph kind="zcap" size={23}/></span>
      <div className={a.identity}><h3>{row.label}</h3><p className={a.winners}><span className={s.srOnly}>Elected: </span>{row.elected.map(person => person.name).join(' · ')}</p></div>
      <div className={`${a.measures} ${a.electionMeasures}`}><span className={a.measure}><span className={a.mobileLabel}>Ballots</span>{row.ballots === null ? <small>Not recorded</small> : <strong>{number(row.ballots)}</strong>}</span><span className={a.measure}><span className={a.mobileLabel}>Seats</span><strong>{row.seats}</strong></span><span className={a.measure}><span className={a.mobileLabel}>Recorded date</span>{row.date ? <time dateTime={row.date}>{date(row.date)}</time> : <small>{row.month ?? 'Not recorded'}</small>}</span></div><Arrow/>
    </Link></li>) : pageRows(filtered, page).map(row => <li key={row.id}><Link section="Results" id={`q3:${row.id}`} selection={{ lane: "q3", filter, search, page: visiblePage(page, filtered.length) }} onNavigate={onNavigate} className={a.record}>
      <span className={a.ballotNumber}><span className={s.srOnly}>Ballot </span>{String(row.ballot).padStart(2, '0')}</span>
      <div className={a.identity}><h3>{row.title}</h3><div className={a.meta}>{row.applicant.trim().toLowerCase() !== row.title.trim().toLowerCase() && <span>{row.applicant}</span>}<span className={a.outcome} data-funded={row.published === 'Funded'}>{row.published}</span></div></div>
      <div className={`${a.measures} ${a.resultMeasures}`}><span className={a.measure}><span className={a.mobileLabel}>Accept share<span className={s.srOnly}>, excludes abstentions</span></span><strong className={a.accept}>{acceptShare(row.approveShare)}</strong>{row.approveShare !== null && <span className={a.track} aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(1, row.approveShare)) * 100}%` }}/></span>}</span>
      <span className={a.measure}><span className={a.mobileLabel}>Weight · ZEC</span><strong>{number(row.total)}</strong></span></div><Arrow/>
    </Link></li>)}</ul>
    {!(isElection ? filteredElections.length : filtered.length) && <Empty onReset={() => { onSearch(''); onFilter('all'); }}/>}
  </Collection>;
}
