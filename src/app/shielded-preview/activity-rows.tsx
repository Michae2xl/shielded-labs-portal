'use client';

import type { ReactNode } from 'react';
import { repositoryLabels, type Contributor, type ObservedCommit } from '@/lib/shielded-preview/development-metrics';
import { activityHref, type ActivityLocation } from '@/lib/shielded-preview/development-navigation';
import type { Repository } from '@/lib/shielded-preview/types';
import ContributorAvatar from './contributor-avatar';
import s from './activity-rows.module.css';

export type OpenRecord = (record: string, context?: ActivityLocation) => void;
type RowProps = { location: ActivityLocation; onOpen: OpenRecord };

const shortDateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
export const shortDate = (date: string) => shortDateFormatter.format(new Date(date));
export const repoName = (name: string) => repositoryLabels[name] ?? name;
export const personCaption = (person: Pick<Contributor, 'bot' | 'login'>) => person.bot ? 'Automation' : person.login ? `@${person.login}` : 'Unlinked Git author';

export function Arrow({ external = false, back = false }: { external?: boolean; back?: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" style={back ? { transform: 'rotate(180deg)' } : undefined}><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>;
}
export function RepoIcon({ size = 18 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18m4-13h4m-4 4h4"/></svg>;
}

export function ActivityLink({ location, record, onOpen, className, children }: RowProps & { record: string; className?: string; children: ReactNode }) {
  return <a href={activityHref({ ...location, record })} className={className} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onOpen(record, location);
  }}>{children}</a>;
}

export function CommitRow({ commit, location, onOpen }: RowProps & { commit: ObservedCommit }) {
  return <ActivityLink location={location} record={`commit:${commit.sha}`} onOpen={onOpen} className={s.commit}>
    <time className={s.date} dateTime={commit.date}>{shortDate(commit.date)}</time>
    <span className={s.commitBody}>
      <span className={s.commitTitle}>{commit.title}</span>
      <span className={s.commitMeta}><ContributorAvatar name={commit.author} login={commit.login} size={20}/><span>{commit.author}</span><span>{commit.repositories.map(repoName).join(' · ')}</span><code>{commit.sha.slice(0, 7)}</code></span>
    </span>
    <Arrow/>
  </ActivityLink>;
}

export function RepositoryRow({ repository, commits, location, onOpen }: RowProps & { repository: Repository; commits?: number }) {
  return <ActivityLink location={location} record={`repo:${repository.name}`} onOpen={onOpen} className={s.repository}>
    <RepoIcon/>
    <span className={s.rowBody}><strong>{repoName(repository.name)}</strong><small>{repository.fork ? 'Fork' : repository.language ?? 'Source code'} · {repository.branch}</small></span>
    {commits !== undefined && <span className={s.rowCount}>{commits}</span>}
    <Arrow/>
  </ActivityLink>;
}

export function PersonRow({ person, location, onOpen }: RowProps & { person: Contributor }) {
  return <ActivityLink location={location} record={`person:${person.id}`} onOpen={onOpen} className={s.person}>
    <ContributorAvatar name={person.name} login={person.login} size={36}/>
    <span className={s.rowBody}><strong>{person.name}</strong><small>{personCaption(person)}</small></span>
    <Arrow/>
  </ActivityLink>;
}
