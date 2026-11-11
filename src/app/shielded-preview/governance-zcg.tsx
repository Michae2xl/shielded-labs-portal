'use client';

import type { GrantRecord, Source } from '@/lib/shielded-preview/governance-types';
import { scheduledRows, scheduleGroups, scheduleMonths, scheduleRowUrl, scheduleTotal, type ScheduledPayment } from '@/lib/shielded-preview/zcg-schedule';
import type { MeetingMinutes } from '@/lib/shielded-preview/zcg-minutes';
import { Arrow, Collection, Empty, Link, Search, SourceInfo, Tabs, grantProgramTabs, pageRows, visiblePage, type Controls, type GrantLaneTab } from './governance-collections';
import GovernanceGlyph from './governance-glyph';
import s from './governance-collections.module.css';
import a from './governance-archive.module.css';
import c from './coinholder-proposals.module.css';
import z from './governance-zcg.module.css';

/** The two records of the ZCG committee that sit beside the funding ledger. */
export const scheduleLane = 'schedule';
export const minutesLane = 'minutes';

type LaneProps = Controls & {
  grants: Source<GrantRecord[]>; lanes: readonly GrantLaneTab[];
  onLane: (lane: string) => void;
  /** Back to the ledger, on one of its program tabs. */
  onLedger: (program: string) => void;
  busy: boolean;
};

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const compact = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const longDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const monthName = (value: string) => new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01`));
const matches = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase());
const milestoneName = (value: string) => /^\d+$/.test(value) ? `Milestone ${value}` : value || 'Milestone not named';

function LaneTabs({ value, grants, lanes, onLane, onLedger }: Pick<LaneProps, 'grants' | 'lanes' | 'onLane' | 'onLedger'> & { value: string }) {
  return <Tabs label="Grant programs and ZCG records" value={value} onChange={id => lanes.some(lane => lane.id === id) ? onLane(id) : onLedger(id)} items={[...grantProgramTabs(grants.data), ...lanes]}/>;
}
function Unavailable({ busy, loading, failed }: { busy: boolean; loading: string; failed: string }) {
  return <div className={c.empty} role="status"><h3>{busy ? loading : failed}</h3><p>{busy ? 'Reading the source.' : 'The source could not be read. Try refreshing the data below.'}</p></div>;
}
function SourceState({ source, read }: { source: Source<unknown>; read: string }) {
  return <div className={c.sourceState}>{source.observedAt && <span>{source.state === 'snapshot' ? 'Saved' : read} <time dateTime={source.observedAt}>{date(source.observedAt)}</time></span>}{source.error && <span>Refresh unavailable</span>}</div>;
}

const scheduleNotice = 'Estimates and amounts are the ones ZCG records in its sheet. An estimate is not a commitment to pay on that day, and “not recorded” means only that the sheet shows no payment yet.';
const scheduleGroupsShown = [['upcoming', 'Upcoming'], ['past', 'Past estimate'], ['earlier', 'Earlier years'], ['undated', 'Date not set']] as const;

export function ZcgScheduleCollection({ source, grants, lanes, onLane, onLedger, busy, ...controls }: LaneProps & { source: Source<ScheduledPayment[] | null> }) {
  const { search, onSearch, filter, onFilter, page, onPage, onNavigate } = controls;
  const tabs = <LaneTabs value={scheduleLane} grants={grants} lanes={lanes} onLane={onLane} onLedger={onLedger}/>;
  const aside = <><div><h3>How the schedule is read</h3><dl className={s.definitions}>
    <div><dt>Scheduled</dt><dd>Upcoming estimates plus those already past this year, all without a recorded payment.</dd></div>
    <div><dt>Upcoming</dt><dd>Open milestones with an estimate on or after the day the sheet was read.</dd></div>
    <div><dt>Past estimate</dt><dd>Open milestones whose estimate passed earlier this year and that show no payment.</dd></div>
    <div><dt>Earlier years</dt><dd>Open milestones with an estimate from a previous year. Not counted as scheduled.</dd></div>
    <div><dt>Date not set</dt><dd>Open milestones with no date, or with a condition in its place. Not counted as scheduled.</dd></div>
    <div><dt>Left out</dt><dd>Paid, cancelled and completed milestones, and rows without an amount.</dd></div>
  </dl></div><SourceInfo name="ZCG grants sheet" source={source}/></>;
  if (!source.data || !source.observedAt) return <Collection archive id="zcg-schedule" title="Scheduled payments" context="Zcash Community Grants" tabs={tabs} toolbar={null} total={null} page={page} onPage={onPage} notice={scheduleNotice} aside={aside}>
    <Unavailable busy={busy} loading="Loading the schedule…" failed="Schedule unavailable"/>
  </Collection>;

  const groups = scheduleGroups(source.data, source.observedAt.slice(0, 10));
  const group = filter === 'past' || filter === 'earlier' || filter === 'undated' ? filter : 'upcoming';
  const scheduled = scheduledRows(groups);
  const rows = groups[group].filter(row => matches(`${row.project} ${row.grantee} ${row.category} ${milestoneName(row.milestone)}`, search));
  const months = scheduleMonths(groups.upcoming);
  const largest = Math.max(1, ...months.map(month => month.usd));
  const recorded = new Set(grants.data.filter(grant => grant.program === 'zcg_regular').map(grant => grant.grant));
  const selection = { lane: scheduleLane, filter, search, page: visiblePage(page, rows.length) };

  return <Collection archive id="zcg-schedule" title="Scheduled payments" context="Zcash Community Grants" tabs={tabs}
    toolbar={<><Search name="Search scheduled payments" value={search} onChange={onSearch}/><select aria-label="Part of the schedule" value={group} onChange={event => onFilter(event.target.value === 'upcoming' ? 'all' : event.target.value)}>{scheduleGroupsShown.map(([id, name]) => <option key={id} value={id}>{name} · {groups[id].length}</option>)}</select></>}
    summary={<div className={z.summary}><div className={`${c.summary} ${c.roundSummary}`}><dl>
      <div><dt>Scheduled payments</dt><dd>{scheduled.length}</dd></div>
      <div><dt>Scheduled · USD</dt><dd>{money(scheduleTotal(scheduled))}</dd></div>
      <div><dt>Upcoming · USD</dt><dd>{money(scheduleTotal(groups.upcoming))}</dd></div>
    </dl><SourceState source={source} read="Sheet read"/></div>
    {group === 'upcoming' && months.length > 1 && <ol className={z.months} aria-label="Upcoming payments by month">{months.map(month => <li key={month.month}>
      <span className={z.bar} aria-hidden="true"><span style={{ height: `${Math.max(4, month.usd / largest * 100)}%` }}/></span>
      <strong>{compact(month.usd)}</strong><span>{monthName(month.month)}</span><small>{month.count} {month.count === 1 ? 'payment' : 'payments'}</small>
    </li>)}</ol>}
    {group !== 'upcoming' && <p className={z.part}>{groups[group].length} {groups[group].length === 1 ? 'payment' : 'payments'} · {money(scheduleTotal(groups[group]))} in this part of the schedule.</p>}</div>}
    total={rows.length} page={page} onPage={onPage} notice={scheduleNotice} aside={aside}
  >
    <div className={a.columns} aria-hidden="true"><span>Grant & milestone</span><div className={a.measures}><span>Estimated date</span><span>Budget · USD</span></div><span/></div>
    <ul className={a.rows} aria-label="Scheduled payments">{pageRows(rows, page).map(row => {
      const body = <>
        <span className={a.symbol} aria-hidden="true"><GovernanceGlyph kind="grants" size={23}/></span>
        <div className={a.identity}><h3>{row.project}</h3><div className={a.meta}><span>{milestoneName(row.milestone)}</span>{row.grantee && <span>{row.grantee}</span>}{row.category && <span>{row.category}</span>}</div></div>
        <div className={a.measures}>
          <span className={a.measure}><span className={a.mobileLabel}>Estimated date</span>{row.estimate ? <time dateTime={row.estimate}>{date(row.estimate)}</time> : <small>{row.condition ?? 'Not set'}</small>}</span>
          <span className={a.measure}><span className={a.mobileLabel}>Budget · USD</span><strong>{money(row.usd)}</strong></span>
        </div><Arrow/>
      </>;
      // Every scheduled project has a grant record of the same name; if one ever does not, the row opens the sheet instead.
      return <li key={row.row}>{recorded.has(row.project)
        ? <Link section="Grants" id={`zcg_regular|${row.project}`} selection={selection} onNavigate={onNavigate} className={a.record}>{body}</Link>
        : <a className={a.record} href={scheduleRowUrl(row.row)} target="_blank" rel="noopener noreferrer">{body}</a>}</li>;
    })}</ul>
    {!rows.length && (search ? <Empty onReset={() => onSearch('')}/> : <div className={c.empty}><h3>Nothing in this part of the schedule</h3><p>The sheet lists no open milestone here.</p></div>)}
  </Collection>;
}

const minutesNotice = 'Minutes are written and published by the ZCG committee on the Zcash Community Forum. This list links to them and does not summarise or interpret what was decided.';

export function ZcgMinutesCollection({ source, grants, lanes, onLane, onLedger, busy, ...controls }: LaneProps & { source: Source<MeetingMinutes[] | null> }) {
  const { search, onSearch, filter, onFilter, page, onPage } = controls;
  const tabs = <LaneTabs value={minutesLane} grants={grants} lanes={lanes} onLane={onLane} onLedger={onLedger}/>;
  const aside = <><div><h3>What is listed</h3><p>Topics titled as meeting minutes in the committee’s “Community Grants Updates” category. The meeting day is read from each title.</p></div><SourceInfo name="Community Grants Updates · Zcash Community Forum" source={source}/></>;
  if (!source.data) return <Collection archive id="zcg-minutes" title="Meeting minutes" context="Zcash Community Grants" tabs={tabs} toolbar={null} total={null} page={page} onPage={onPage} notice={minutesNotice} aside={aside}>
    <Unavailable busy={busy} loading="Loading the minutes…" failed="Minutes unavailable"/>
  </Collection>;

  const held = (row: MeetingMinutes) => row.meeting ?? row.posted.slice(0, 10);
  const years = [...new Set(source.data.map(row => held(row).slice(0, 4)))].sort().reverse();
  const year = years.includes(filter) ? filter : 'all';
  const rows = source.data.filter(row => (year === 'all' || held(row).startsWith(year)) && matches(`${row.title} ${longDate(held(row))}`, search));
  const latest = source.data[0];

  return <Collection archive id="zcg-minutes" title="Meeting minutes" context="Zcash Community Grants" tabs={tabs}
    toolbar={<><Search name="Search meeting minutes" value={search} onChange={onSearch}/><select aria-label="Meeting year" value={year} onChange={event => onFilter(event.target.value)}><option value="all">All years</option>{years.map(item => <option key={item} value={item}>{item}</option>)}</select></>}
    summary={<div className={`${c.summary} ${c.roundSummary}`}><dl>
      <div><dt>Minutes published</dt><dd>{source.data.length}</dd></div>
      {latest && <div><dt>Latest meeting</dt><dd><time dateTime={held(latest)}>{date(held(latest))}</time></dd></div>}
    </dl><SourceState source={source} read="Forum read"/></div>}
    total={rows.length} page={page} onPage={onPage} notice={minutesNotice} aside={aside}
  >
    <div className={a.columns} aria-hidden="true"><span>Committee meeting</span><div className={a.measures}><span>Minutes posted</span><span>Replies</span></div><span/></div>
    <ul className={a.rows} aria-label="ZCG meeting minutes">{pageRows(rows, page).map(row => <li key={row.id}><a className={a.record} href={row.url} target="_blank" rel="noopener noreferrer" title={row.title}>
      <span className={a.symbol} aria-hidden="true"><GovernanceGlyph kind="history" size={23}/></span>
      <div className={a.identity}><h3>{row.meeting ? <time dateTime={row.meeting}>{longDate(row.meeting)}</time> : row.title}</h3><span className={s.srOnly}>Minutes on the forum, opens in a new tab</span></div>
      <div className={a.measures}>
        <span className={a.measure}><span className={a.mobileLabel}>Minutes posted</span><time dateTime={row.posted}>{date(row.posted)}</time></span>
        <span className={a.measure}><span className={a.mobileLabel}>Replies</span><strong>{row.replies}</strong></span>
      </div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>
    </a></li>)}</ul>
    {!rows.length && <Empty onReset={() => { onSearch(''); onFilter('all'); }}/>}
  </Collection>;
}
