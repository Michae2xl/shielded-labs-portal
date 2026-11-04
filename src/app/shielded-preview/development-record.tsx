'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { PortalData } from '@/lib/shielded-preview/types';
import { contributorKey, developmentCommits, developmentContributors, developmentDays, repositoryLabels, windowCommits } from '@/lib/shielded-preview/development-metrics';
import { activityHref, type ActivityLocation } from '@/lib/shielded-preview/development-navigation';
import ContributorAvatar from './contributor-avatar';
import RecordLayout from './governance-record';
import s from './development-record.module.css';

const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const label = (name: string) => repositoryLabels[name] ?? name;
function Arrow({ external = false }: { external?: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>; }
function Stat({ label, children }: { label: string; children: ReactNode }) { return <div><span>{label}</span><strong>{children}</strong></div>; }

export function ActivityLink({ location, record, onOpen, className, children }: { location: ActivityLocation; record: string; onOpen: (record: string, context?: ActivityLocation) => void; className?: string; children: ReactNode }) {
  return <a href={activityHref({ ...location, record })} className={className} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onOpen(record, location);
  }}>{children}</a>;
}

export default function DevelopmentRecord({ data, location, onOpen, onBack, onExplore }: {
  data: PortalData; location: ActivityLocation; onOpen: (record: string, context?: ActivityLocation) => void;
  onBack: () => void; onExplore: (filters: Partial<ActivityLocation>) => void;
}) {
  const all = developmentCommits(data.repos, true);
  const commit = all.find(c => `commit:${c.sha}` === location.record);
  const repository = data.repos.find(r => `repo:${r.name}` === location.record);
  const person = developmentContributors(all).find(p => `person:${p.id}` === location.record);
  const missing = !commit && !repository && !person;
  const missingHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (missing) missingHeading.current?.focus({ preventScroll: true }); }, [missing, location.record]);
  if (missing) return <section className={s.empty}><h1 ref={missingHeading} tabIndex={-1}>Record not found</h1><p>This record is not available in the current data.</p><button onClick={onBack}>Back to code activity</button></section>;

  const includesForks = location.includeForks || Boolean(repository?.fork) || Boolean(commit && commit.repositories.every(name => data.repos.find(r => r.name === name)?.fork));
  const recordLocation = { ...location, includeForks: includesForks };
  const days = developmentDays(data.checkedAt, location.period);
  const periodCommits = windowCommits(developmentCommits(data.repos, includesForks), days);
  const matching = person ? periodCommits.filter(c => contributorKey(c) === person.id) : repository ? periodCommits.filter(c => c.repositories.includes(repository.name)) : [commit!];
  const repoNames = commit ? commit.repositories : repository ? [repository.name] : [...new Set(matching.flatMap(c => c.repositories))];
  const repositories = data.repos.filter(r => repoNames.includes(r.name) && (commit || includesForks || !r.fork));
  const title = commit?.title ?? (repository ? label(repository.name) : person!.name);
  const identity = commit ? developmentContributors([commit])[0] : person;
  const link = (record: string, children: ReactNode, className = s.card) => <ActivityLink location={recordLocation} record={record} onOpen={onOpen} className={className}>{children}</ActivityLink>;
  return <div className={s.record}>
    <RecordLayout idPrefix="activity" title={title} context={commit ? 'Commit' : repository ? 'Repository' : person!.bot ? 'Automation profile' : 'Contributor profile'}
      subtitle={repository?.description ?? (identity?.login ? `@${identity.login}` : identity ? 'Unlinked Git author' : '')}
      portrait={identity ? <ContributorAvatar name={identity.name} login={identity.login} size={64}/> : undefined}
      backLabel="Back to code activity" onBack={onBack}
      sections={[{ label: commit ? 'Commit details' : 'Commits', id: 'activity-details' }, { label: 'Repositories', id: 'activity-repositories' }]}
      metrics={commit ? <><Stat label="Authored · UTC">{date(commit.date)}</Stat><Stat label="Commit hash">{commit.sha.slice(0, 12)}</Stat><Stat label="Repository sources">{repositories.length}</Stat></> : <><Stat label="Sampled commits">{matching.length}</Stat><Stat label={repository ? 'Contributor identities' : 'Repositories'}>{repository ? developmentContributors(matching).length : repositories.length}</Stat><Stat label="Period · UTC">{date(days[0])} – {date(days.at(-1)!)}</Stat></>}
      sources={<>
        {commit && <a href={commit.url} target="_blank" rel="noopener noreferrer">Original commit & file changes<Arrow external/></a>}
        {person?.profileUrl && <a href={person.profileUrl} target="_blank" rel="noopener noreferrer">GitHub profile<Arrow external/></a>}
        <p>{commit ? 'The portal preserves the commit title, author, date and repository references. The original commit contains the file changes.' : `Up to 100 latest commits per tracked branch, filtered to ${location.period} days. This sample does not measure effort or performance.`}</p>
        {includesForks && <p>Includes fork history, which may contain inherited work from other organizations.</p>}
        {repositories.map(r => <div key={r.name} className={s.source}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}<Arrow external/></a><small>{r.branch} · {r.state === 'live' ? 'Retrieved' : 'Saved record'} {date(r.fetchedAt)}{r.refreshError === 'rate-limited' ? ' · GitHub rate limit' : r.refreshError ? ' · Refresh unavailable' : ''}</small></div>)}
        {person && <p>GitHub accounts and unlinked Git author names remain distinct; similar names do not establish the same identity.</p>}
      </>}
    >
      <section id="activity-details">
        <div className={s.heading}><h2>{commit ? 'Commit details' : 'Recent commits'}</h2>{!commit && <button onClick={() => onExplore({ repo: repository?.name ?? '', contributor: person?.id ?? '', includeForks: includesForks, selected: null, query: '' })}>Explore activity<Arrow/></button>}</div>
        {commit ? <>
          <dl className={s.commitFacts}><div><dt>Full hash</dt><dd><code>{commit.sha}</code></dd></div><div><dt>Author date · UTC</dt><dd>{new Date(commit.date).toISOString().replace('T', ' ').replace('.000Z', '')}</dd></div></dl>
          {link(`person:${contributorKey(commit)}`, <><ContributorAvatar name={commit.author} login={commit.login} size={40}/><span><strong>{commit.author}</strong><small>{commit.login ? `@${commit.login}` : 'Unlinked Git author'}</small></span><Arrow/></>)}
        </> : <div className={s.grid}>{matching.slice(0, 12).map(c => <ActivityLink key={c.sha} location={recordLocation} record={`commit:${c.sha}`} onOpen={onOpen} className={s.commitCard}><span>{c.title}</span><div><small>{date(c.date)} · {c.sha.slice(0, 7)}</small><Arrow/></div></ActivityLink>)}{!matching.length && <p>No commits in this period’s sample. Use Explore activity to change the period.</p>}</div>}
      </section>
      <section id="activity-repositories"><h2>{repository ? 'Repository details' : 'Repositories'}</h2>{repository ? <dl className={s.commitFacts}><div><dt>Repository</dt><dd>{repository.name}</dd></div><div><dt>Tracked branch</dt><dd>{repository.branch}</dd></div><div><dt>Language</dt><dd>{repository.language ?? 'Not specified'}</dd></div><div><dt>History</dt><dd>{repository.fork ? 'Fork · may include upstream work' : 'Non-fork repository'}</dd></div></dl> : <div className={s.grid}>{repositories.map(r => <ActivityLink key={r.name} location={recordLocation} record={`repo:${r.name}`} onOpen={onOpen} className={s.card}><span><strong>{label(r.name)}</strong><small>{r.name} · {r.fork ? 'Fork' : r.language ?? 'Source code'}</small></span><Arrow/></ActivityLink>)}</div>}</section>
      {repository && <section><h2>Contributor identities</h2><div className={s.grid}>{developmentContributors(matching).map(p => <ActivityLink key={p.id} location={recordLocation} record={`person:${p.id}`} onOpen={onOpen} className={s.card}><ContributorAvatar name={p.name} login={p.login} size={36}/><span><strong>{p.name}</strong><small>{p.bot ? 'Automation' : p.login ? `@${p.login}` : 'Unlinked Git author'}</small></span><Arrow/></ActivityLink>)}</div></section>}
    </RecordLayout>
  </div>;
}
