'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { PortalData } from '@/lib/shielded-preview/types';
import { developmentCommits, developmentContributors, developmentDays, filterDevelopment, heatLevel, windowCommits, type ObservedCommit } from '@/lib/shielded-preview/development-metrics';
import ContributorAvatar from './contributor-avatar';
import DevelopmentRecord from './development-record';
import { Arrow, CommitRow, PersonRow, RepoIcon, repoName, RepositoryRow, shortDate } from './activity-rows';
import { activityHref, readActivityLocation, type ActivityLocation } from '@/lib/shielded-preview/development-navigation';
import ui from './activity-rows.module.css';
import s from './development.module.css';

type Cell = { key: string; row: string; column: string; label: string; commits: ObservedCommit[]; repo: string; contributor?: string; day?: string };
const fullDateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fullDate = (date: string) => fullDateFormatter.format(new Date(date));

export default function Development({ data, busy, failed = false, onRefresh, initialRepository, initialRecord }: { data: PortalData; busy: boolean; failed?: boolean; onRefresh: () => void; initialRepository?: string | null; initialRecord?: string | null }) {
  const [activity, setActivity] = useState<ActivityLocation>(() => ({ ...readActivityLocation(new URLSearchParams()), repo: initialRepository ?? '', record: initialRecord ?? null }));
  const activityRef = useRef(activity);
  const restoreScroll = useRef(0);
  const restoreLink = useRef<string | null>(null);
  useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') !== 'activity') return;
      const next = readActivityLocation(params);
      activityRef.current = next;
      setActivity(next);
    };
    const timer = setTimeout(read, 0);
    window.addEventListener('popstate', read);
    window.addEventListener('shielded:navigate', read);
    return () => { clearTimeout(timer); window.removeEventListener('popstate', read); window.removeEventListener('shielded:navigate', read); };
  }, []);
  function updateActivity(patch: Partial<ActivityLocation>, push = false) {
    const next = { ...activityRef.current, ...patch };
    activityRef.current = next;
    setActivity(next);
    window.history[push ? 'pushState' : 'replaceState'](null, '', activityHref(next));
  }
  const { mode, period, includeForks, repo, contributor, query, selected } = activity;
  const setMode = (value: ActivityLocation['mode']) => updateActivity({ mode: value });
  const setPeriod = (value: number) => updateActivity({ period: value === 84 ? 84 : 35 });
  const setIncludeForks = (value: boolean) => updateActivity({ includeForks: value });
  const setRepo = (value: string) => updateActivity({ repo: value });
  const setContributor = (value: string) => updateActivity({ contributor: value });
  const setQuery = (value: string) => updateActivity({ query: value });
  const setSelected = (value: string | null) => updateActivity({ selected: value });
  function openRecord(record: string, context?: ActivityLocation) {
    if (!activityRef.current.record) {
      restoreScroll.current = window.scrollY;
      restoreLink.current = document.activeElement?.closest('a')?.getAttribute('href') ?? null;
    }
    updateActivity({ ...context, record }, true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function closeRecord() {
    updateActivity({ record: null }, true);
    requestAnimationFrame(() => {
      window.scrollTo({ top: restoreScroll.current, behavior: 'instant' });
      const origin = [...document.querySelectorAll<HTMLAnchorElement>('a')].find(link => link.getAttribute('href') === restoreLink.current);
      (origin ?? feedHeading.current ?? document.getElementById('development-people'))?.focus({ preventScroll: true });
    });
  }
  const [inspected, setInspected] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [limit, setLimit] = useState(12);
  const [otherAuthorsOpen, setOtherAuthorsOpen] = useState(false);
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const feed = useRef<HTMLElement>(null);
  const feedHeading = useRef<HTMLHeadingElement>(null);
  const heatScroll = useRef<HTMLDivElement>(null);
  // Narrow screens scroll the map sideways, so the newest days come first.
  useEffect(() => {
    if (heatScroll.current) heatScroll.current.scrollLeft = mode === 'days' ? heatScroll.current.scrollWidth : 0;
  }, [mode, period, activity.record]);
  const days = useMemo(() => developmentDays(data.checkedAt, period), [data.checkedAt, period]);
  const repositories = data.repos.filter(r => includeForks || !r.fork);
  const entries = useMemo(() => windowCommits(developmentCommits(data.repos, includeForks), days), [data.repos, includeForks, days]);
  const people = useMemo(() => developmentContributors(entries), [entries]);
  const linked = people.filter(p => p.login && !p.bot);
  const unlinked = people.filter(p => !p.login);
  const bots = people.filter(p => p.bot);
  const filtered = filterDevelopment(entries, { repo, contributor, query });
  const shownRepos = repositories.filter(r => !repo || r.name === repo);
  const shownPeople = people.filter(p => !contributor || p.id === contributor);
  const columns = mode === 'days' ? days : shownRepos.map(r => r.name);
  const rows = mode === 'days' ? shownRepos.map(r => ({ id: r.name, label: repoName(r.name), login: null as string | null, caption: r.fork ? 'Fork history' : r.language ?? 'Repository' })) : shownPeople.map(p => ({ id: p.id, label: p.name, login: p.login, caption: p.bot ? 'Automation' : p.login ? '@' + p.login : 'Unlinked Git author' }));
  const cells: Cell[] = rows.flatMap(row => columns.map(column => {
    const conditions = mode === 'days' ? { repo: row.id, day: column } : { repo: column, contributor: row.id };
    return { key: `${mode}|${row.id}|${column}`, row: row.id, column, label: mode === 'days' ? `${row.label} · ${fullDate(column)}` : `${row.label} · ${repoName(column)}`, commits: filterDevelopment(filtered, conditions), ...conditions };
  }));
  const activeCell = cells.find(cell => cell.key === selected);
  const unavailableSelection = Boolean(selected && !activeCell);
  const inspection = activeCell ?? cells.find(cell => cell.key === inspected);
  const matching = selected ? activeCell?.commits ?? [] : filtered;
  const live = data.repos.filter(r => r.state === 'live').length;
  const rateLimited = data.repos.some(r => r.refreshError === 'rate-limited');
  const observedAt = data.repos.map(r => r.fetchedAt).sort()[0] ?? data.checkedAt;
  const tabKey = cells.some(cell => cell.key === focused) ? focused : cells[0]?.key;

  function resetSelection() { setSelected(null); setInspected(null); setFocused(null); setLimit(12); }
  function chooseRepo(value: string) { setRepo(value); resetSelection(); }
  function choosePerson(value: string) { setContributor(value); resetSelection(); }
  function clearFilters() { setRepo(''); setContributor(''); setQuery(''); resetSelection(); }
  function showCommits() {
    const top = feed.current?.getBoundingClientRect().top ?? 0;
    // The list usually sits right below the map; moving it would hide the map being explored.
    if (top < 0 || top > window.innerHeight * 0.7) feed.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    feedHeading.current?.focus({ preventScroll: true });
  }
  function chooseCell(cell: Cell) {
    const next = selected === cell.key ? null : cell.key;
    setSelected(next);
    setLimit(12);
    if (next) requestAnimationFrame(showCommits);
  }
  function navigateCell(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next++;
    else if (event.key === 'ArrowLeft') next--;
    else if (event.key === 'ArrowDown') next += columns.length;
    else if (event.key === 'ArrowUp') next -= columns.length;
    else if (event.key === 'Home') next -= index % columns.length;
    else if (event.key === 'End') next += columns.length - 1 - index % columns.length;
    else if (event.key === 'Escape') { event.preventDefault(); resetSelection(); return; }
    else return;
    event.preventDefault();
    const cell = cells[Math.max(0, Math.min(cells.length - 1, next))];
    if (cell) cellRefs.current.get(cell.key)?.focus();
  }

  if (activity.record) return <DevelopmentRecord data={data} location={activity} onOpen={openRecord} onBack={closeRecord} onExplore={filters => {
    updateActivity({ ...filters, record: null }, true);
    requestAnimationFrame(() => document.getElementById('development-map')?.scrollIntoView({ block: 'start' }));
  }}/>;

  const status = `${failed ? 'Refresh unavailable · retained observations' : rateLimited ? `${live}/${data.repos.length} sources refreshed · GitHub rate limit` : live ? `${live}/${data.repos.length} sources refreshed` : 'Saved GitHub data'} · ${fullDate(observedAt)}`;
  const outdated = failed || live < data.repos.length;
  const inspectedCount = inspection?.commits.length ?? 0;
  const rowProps = { location: activity, onOpen: openRecord };

  return <div className={s.development}>
    <h1 id="development-title" className={s.srOnly} tabIndex={-1}>Code activity</h1>

    <section className={`${ui.card} ${s.map}`} aria-labelledby="development-map">
      <h2 id="development-map" className={s.srOnly}>Activity</h2>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <label className={s.periodFilter}><span className={s.srOnly}>Activity period</span><select aria-label="Activity period" value={period} onChange={e => { setPeriod(Number(e.target.value)); clearFilters(); }}><option value={35}>Last 35 days</option><option value={84}>Last 84 days</option></select></label>
          <label className={s.repoFilter}><span className={s.srOnly}>Filter development by repository</span><select aria-label="Filter development by repository" value={repo} onChange={e => chooseRepo(e.target.value)}><option value="">All repositories</option>{repo && !repositories.some(r => r.name === repo) && <option value={repo}>{repoName(repo)} · unavailable in this sample</option>}{repositories.map(r => <option key={r.name} value={r.name}>{repoName(r.name)}{r.fork ? ' · fork' : ''}</option>)}</select></label>
          <label className={s.repoFilter}><span className={s.srOnly}>Filter development by contributor</span><select aria-label="Filter development by contributor" value={contributor} onChange={e => choosePerson(e.target.value)}><option value="">All contributors</option>{contributor && !people.some(p => p.id === contributor) && <option value={contributor}>{contributor} · unavailable in this sample</option>}{people.map(p => <option key={p.id} value={p.id}>{p.name}{p.bot ? ' · automation' : !p.login ? ' · Git author' : ` · @${p.login}`}</option>)}</select></label>
          <label className={s.forkToggle}><input type="checkbox" checked={includeForks} onChange={e => { setIncludeForks(e.target.checked); setRepo(''); setContributor(''); resetSelection(); }}/>Include forks</label>
          {(repo || contributor || query || selected) && <button className={s.clear} onClick={clearFilters}>Reset filters</button>}
        </div>
        <div className={s.segmented} aria-label="Activity view"><button aria-pressed={mode === 'days'} onClick={() => { setMode('days'); resetSelection(); }}>By day</button><button aria-pressed={mode === 'contributors'} onClick={() => { setMode('contributors'); resetSelection(); }}>By contributor</button></div>
      </div>
      {includeForks && <p className={s.forkNote}>Forks may contain inherited work from other organizations.</p>}
      <p className={s.srOnly} id="development-map-help">{mode === 'days' ? 'Rows are repositories; columns are UTC days.' : 'Rows are contributor identities; columns are repositories.'} Brighter cells mean more commits in the sample. Use arrow keys to move, Enter to view commits and Escape to clear.</p>
      <div className={s.heatScroll} ref={heatScroll} role="region" aria-label="Interactive activity heatmap">
        <table className={`${s.heatTable} ${mode === 'contributors' ? s.contributorTable : ''}`} data-dense={period === 84 || undefined} style={{ '--columns': columns.length } as CSSProperties}>
          <caption className={s.srOnly}>Sampled commits by {mode === 'days' ? 'repository and UTC day' : 'contributor identity and repository'}.</caption>
          <thead><tr><th scope="col">{mode === 'days' ? 'Repository' : 'Contributor'}</th>{columns.map((column, index) => <th key={column} scope="col" title={mode === 'days' ? fullDate(column) : column}>{mode === 'days' ? <span className={s.dayLabel}>{index % 7 === 0 || index === columns.length - 1 ? shortDate(column) : ''}</span> : repoName(column)}</th>)}</tr></thead>
          <tbody>{rows.map((row, rowIndex) => <tr key={row.id}><th scope="row"><button className={s.rowLabel} onClick={() => mode === 'days' ? chooseRepo(repo === row.id ? '' : row.id) : choosePerson(contributor === row.id ? '' : row.id)}>
            {mode === 'contributors' ? <ContributorAvatar name={row.label} login={row.login} size={28}/> : <RepoIcon size={17}/>}<span>{row.label}{mode === 'contributors' && <small>{row.caption}</small>}</span>
          </button></th>{columns.map((column, columnIndex) => {
            const index = rowIndex * columns.length + columnIndex;
            const cell = cells[index];
            const count = cell.commits.length;
            return <td key={column}><button className={s.heatCell} data-level={heatLevel(count)} aria-label={`${cell.label}: ${count ? `${count} sampled commit${count === 1 ? '' : 's'}` : 'no commits in sample'}`} aria-pressed={selected === cell.key} aria-describedby="development-map-help" aria-controls="development-commit-list" title={`${cell.label}: ${count} sampled commits`} tabIndex={tabKey === cell.key ? 0 : -1} ref={node => { if (node) cellRefs.current.set(cell.key, node); else cellRefs.current.delete(cell.key); }} onFocus={() => { setFocused(cell.key); setInspected(cell.key); }} onMouseEnter={() => setInspected(cell.key)} onKeyDown={event => navigateCell(event, index)} onClick={() => chooseCell(cell)}>{mode === 'contributors' && count > 0 ? count : <span className={s.srOnly}>{count}</span>}</button></td>;
          })}</tr>)}</tbody>
        </table>
        {rows.length === 0 && <p className={s.empty}>{mode === 'days' ? 'No repositories match this selection.' : 'No contributor identities match this selection.'}</p>}
      </div>
      <div className={s.mapFooter}>
        <p className={s.inspector} aria-live="polite">{inspection ? <>{inspection.label} <strong>{inspectedCount} sampled commit{inspectedCount === 1 ? '' : 's'}</strong></> : outdated ? status : 'Select a cell to view its commits.'}</p>
        <div className={s.legend}><span>Commits</span>{['0', '1', '2–4', '5–9', '10+'].map((label, level) => <span key={level}><i data-level={level}/>{label}</span>)}</div>
        <span className={s.range}>{shortDate(days[0])} – {shortDate(days[days.length - 1])} · UTC</span>
      </div>
    </section>

    <div className={s.grid}>
      <section className={`${ui.card} ${s.feed}`} id="development-commit-list" ref={feed} aria-labelledby="development-commits">
        <div className={ui.heading}><h2 id="development-commits" ref={feedHeading} tabIndex={-1}>Commits<span className={ui.count}>{matching.length}</span></h2><label className={s.search}><span className={s.srOnly}>Search development commits</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg><input aria-label="Search development commits" value={query} onChange={e => { setQuery(e.target.value); setLimit(12); }} placeholder="Search commits…"/></label></div>
        {(repo || contributor || selected) && <div className={s.activeFilters}><span>{unavailableSelection ? 'Selected cell unavailable' : activeCell?.label ?? [repo ? repoName(repo) : '', contributor ? people.find(p => p.id === contributor)?.name ?? contributor : ''].filter(Boolean).join(' · ')}</span><button className={s.clear} onClick={clearFilters}>Show all</button></div>}
        {matching.length > 0 && <ul className={ui.rows}>{matching.slice(0, limit).map(commit => <li key={commit.sha}><CommitRow commit={commit} {...rowProps}/></li>)}</ul>}
        {matching.length === 0 && <p className={s.empty}>{unavailableSelection ? 'The selected cell is not available in this period. Choose another cell or reset the filters.' : 'No commits match this selection. Change the period or reset the filters.'}</p>}
        {matching.length > limit && <div className={s.more}><button className={s.secondary} onClick={() => setLimit(limit + 24)}>Show more commits</button><span>{Math.min(limit, matching.length)} of {matching.length}</span></div>}
      </section>

      <div className={s.column}>
        <section className={ui.card} aria-labelledby="development-repositories">
          <div className={ui.heading}><h2 id="development-repositories">Repositories</h2><span className={ui.note}>Sampled commits, last {period} days</span></div>
          <ul className={ui.rows}>{repositories.map(repository => <li key={repository.name}><RepositoryRow repository={repository} commits={entries.filter(commit => commit.repositories.includes(repository.name)).length} {...rowProps}/></li>)}</ul>
        </section>

        <section className={ui.card} aria-labelledby="development-people">
          <div className={ui.heading}><h2 id="development-people" tabIndex={-1}>Contributors</h2></div>
          {linked.length > 0 && <ul className={ui.rows}>{linked.map(person => <li key={person.id}><PersonRow person={person} {...rowProps}/></li>)}</ul>}
          {(unlinked.length > 0 || bots.length > 0) && <details className={s.otherAuthors} open={otherAuthorsOpen} onToggle={event => setOtherAuthorsOpen(event.currentTarget.open)}>
            <summary><span>Other authors & automation <small>{unlinked.length + bots.length}</small></span></summary>
            <ul className={ui.rows}>{[...unlinked, ...bots].map(person => <li key={person.id}><PersonRow person={person} {...rowProps}/></li>)}</ul>
          </details>}
        </section>

        <section className={ui.card} aria-labelledby="development-sources">
          <div className={ui.heading}><h2 id="development-sources">Sources</h2></div>
          <div className={s.sourceStatus}>
            <span role="status">{status}</span>
            <button className={s.refresh} disabled={busy} onClick={onRefresh} aria-label="Refresh development activity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M20 10a8 8 0 1 0-2 8M20 3v7h-7"/></svg>
              {busy ? 'Checking…' : 'Refresh'}
            </button>
          </div>
          <details className={s.methodology}>
            <summary><span>Data & methodology</span></summary>
            <p>This is a sample of up to 100 latest commits per tracked branch, filtered to {period} days using Git author dates in UTC. It is not a complete activity history; empty cells do not establish inactivity.</p>
            <p>Identical hashes count once across repositories but can appear in multiple repository cells. Unlinked Git names, GitHub profiles and automation remain distinct. These counts do not measure team size, effort or performance. Forks may contain inherited work and do not attribute that work to Shielded Labs.</p>
            <p>Profiles use public GitHub avatars. Sources refresh every five minutes; failed requests retain the last dated record.</p>
            <div className={s.sourceDates}>{data.repos.map(r => <div key={r.name}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}<Arrow external/></a><span>{r.commits.length} commits · {r.branch} · {r.state === 'live' ? 'Retrieved' : 'Saved record'} {fullDate(r.fetchedAt)}{r.refreshError === 'rate-limited' ? ' · GitHub rate limit' : r.refreshError === 'invalid-response' ? ' · Invalid source response' : r.refreshError ? ' · Source unavailable' : ''}</span></div>)}</div>
          </details>
        </section>
      </div>
    </div>
  </div>;
}
