'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { PortalData } from '@/lib/shielded-preview/types';
import { developmentCommits, developmentContributors, developmentDays, windowCommits, contributorKey } from '@/lib/shielded-preview/development-metrics';
import type { ActivityLocation } from '@/lib/shielded-preview/development-navigation';
import { directoryHref, personId } from '@/lib/shielded-preview/directory';
import { teamMemberFor } from '@/lib/shielded-preview/team-profiles';
import ContributorAvatar from './contributor-avatar';
import { Arrow, CommitRow, PersonRow, personCaption, RepoIcon, repoName, RepositoryRow, type OpenRecord } from './activity-rows';
import ui from './activity-rows.module.css';
import s from './development-record.module.css';

export { ActivityLink } from './activity-rows';

const COMMITS_SHOWN = 12;
const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const exactDate = (value: string) => new Date(value).toISOString().replace('T', ' ').replace('.000Z', '');

function Card({ id, title, aside, children }: { id: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return <section className={ui.card} aria-labelledby={id}><div className={ui.heading}><h2 id={id}>{title}{aside}</h2></div>{children}</section>;
}
function Outbound({ href, children }: { href: string; children: ReactNode }) {
  return <a className={s.action} href={href} target="_blank" rel="noopener noreferrer">{children}<Arrow external/></a>;
}

export default function DevelopmentRecord({ data, location, onOpen, onBack, onExplore }: {
  data: PortalData; location: ActivityLocation; onOpen: OpenRecord; onBack: () => void; onExplore: (filters: Partial<ActivityLocation>) => void;
}) {
  const all = developmentCommits(data.repos, true);
  const commit = all.find(item => `commit:${item.sha}` === location.record);
  const repository = data.repos.find(item => `repo:${item.name}` === location.record);
  const person = developmentContributors(all).find(item => `person:${item.id}` === location.record);
  const missing = !commit && !repository && !person;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [location.record]);
  if (missing) return <section className={s.empty}><h1 ref={heading} tabIndex={-1}>Record not found</h1><p>This record is not available in the current data.</p><button onClick={onBack}>Back to code activity</button></section>;

  const includesForks = location.includeForks || Boolean(repository?.fork) || Boolean(commit && commit.repositories.every(name => data.repos.find(item => item.name === name)?.fork));
  const recordLocation = { ...location, includeForks: includesForks };
  const days = developmentDays(data.checkedAt, location.period);
  const periodCommits = windowCommits(developmentCommits(data.repos, includesForks), days);
  const matching = person ? periodCommits.filter(item => contributorKey(item) === person.id) : repository ? periodCommits.filter(item => item.repositories.includes(repository.name)) : [];
  const repoNames = commit ? commit.repositories : repository ? [repository.name] : [...new Set(matching.flatMap(item => item.repositories))];
  const repositories = data.repos.filter(item => repoNames.includes(item.name) && (commit || includesForks || !item.fork));
  const identity = commit ? developmentContributors([commit])[0] : person;
  const member = person ? teamMemberFor(person) : null;
  const rowProps = { location: recordLocation, onOpen };

  const note = <section className={s.note} aria-label="Where this record comes from">
    <p>{commit ? 'The portal preserves the commit title, author, date and repository references. The original commit contains the file changes.' : `Up to 100 latest commits per tracked branch, filtered to ${location.period} days. This sample does not measure effort or performance.`}</p>
    {includesForks && <p>Includes fork history, which may contain inherited work from other organizations.</p>}
    {person && <p>GitHub accounts and unlinked Git author names remain distinct; similar names do not establish the same identity.</p>}
    {repositories.map(item => <div key={item.name} className={s.source}><a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}<Arrow external/></a><small>{item.branch} · {item.state === 'live' ? 'Retrieved' : 'Saved record'} {date(item.fetchedAt)}{item.refreshError === 'rate-limited' ? ' · GitHub rate limit' : item.refreshError ? ' · Refresh unavailable' : ''}</small></div>)}
  </section>;

  const commits = !commit && <Card id="activity-commits" title="Commits" aside={<span className={ui.count}>{matching.length}</span>}>
    {matching.length > 0
      ? <ul className={ui.rows}>{matching.slice(0, COMMITS_SHOWN).map(item => <li key={item.sha}><CommitRow commit={item} {...rowProps}/></li>)}</ul>
      : <p className={s.none}>No commits in this period’s sample. Use Explore activity to change the period.</p>}
    <div className={s.footer}><button type="button" onClick={() => onExplore({ repo: repository?.name ?? '', contributor: person?.id ?? '', includeForks: includesForks, selected: null, query: '' })}>Explore activity<Arrow/></button></div>
  </Card>;

  return <article className={s.record} aria-labelledby="activity-record-title">
    <button type="button" className={s.back} onClick={onBack}><Arrow back/>Back to code activity</button>

    <header className={s.header}>
      {identity ? <ContributorAvatar name={identity.name} login={identity.login} size={64}/> : <span className={s.repoMark}><RepoIcon size={26}/></span>}
      <div className={s.identity}>
        <h1 id="activity-record-title" ref={heading} tabIndex={-1}>{commit?.title ?? (repository ? repoName(repository.name) : person!.name)}</h1>
        <p className={s.subtitle}>{commit ? `${commit.author} · ${date(commit.date)}` : repository ? repository.description || repository.name : personCaption(person!)}</p>
      </div>
      <div className={s.actions}>
        {commit && <Outbound href={commit.url}>Open on GitHub</Outbound>}
        {repository && <Outbound href={repository.url}>Open on GitHub</Outbound>}
        {person?.profileUrl && <Outbound href={person.profileUrl}>GitHub profile</Outbound>}
        {member && <a className={s.action} href={directoryHref('people', 'all', `person:${personId(member)}`)}>Team profile<Arrow/></a>}
      </div>
    </header>

    <div className={s.grid}>
      <div className={s.column}>
        {commit && <Card id="activity-details" title="Details"><dl className={s.facts}>
          <div><dt>Full hash</dt><dd><code>{commit.sha}</code></dd></div>
          <div><dt>Author date · UTC</dt><dd>{exactDate(commit.date)}</dd></div>
        </dl></Card>}
        {commits}
      </div>
      <aside className={s.column}>
        {commit && identity && <Card id="activity-author" title="Author"><ul className={ui.rows}><li><PersonRow person={identity} {...rowProps}/></li></ul></Card>}
        {repository && <Card id="activity-repository" title="Details"><dl className={s.facts}>
          <div><dt>Repository</dt><dd>{repository.name}</dd></div>
          <div><dt>Tracked branch</dt><dd>{repository.branch}</dd></div>
          <div><dt>Language</dt><dd>{repository.language ?? 'Not specified'}</dd></div>
          <div><dt>History</dt><dd>{repository.fork ? 'Fork · may include upstream work' : 'Non-fork repository'}</dd></div>
        </dl></Card>}
        {repository && <Card id="activity-identities" title="Contributors">{developmentContributors(matching).length > 0 ? <ul className={ui.rows}>{developmentContributors(matching).map(item => <li key={item.id}><PersonRow person={item} {...rowProps}/></li>)}</ul> : <p className={s.none}>No contributor identities in this period’s sample.</p>}</Card>}
        {!repository && repositories.length > 0 && <Card id="activity-repositories" title={repositories.length === 1 ? 'Repository' : 'Repositories'}><ul className={ui.rows}>{repositories.map(item => <li key={item.name}><RepositoryRow repository={item} commits={person ? matching.filter(entry => entry.repositories.includes(item.name)).length : undefined} {...rowProps}/></li>)}</ul></Card>}
        {note}
      </aside>
    </div>
  </article>;
}
