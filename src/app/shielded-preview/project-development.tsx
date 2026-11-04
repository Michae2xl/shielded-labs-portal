'use client';

import type { Ref } from 'react';
import type { Project } from '@/lib/shielded-preview/content';
import type { PortalData } from '@/lib/shielded-preview/types';
import { developmentCommits, repositoryLabels } from '@/lib/shielded-preview/development-metrics';
import { activityHref } from '@/lib/shielded-preview/development-navigation';
import { projectHref } from '@/lib/shielded-preview/project-navigation';
import { EditorialLink } from './editorial';
import ContributorAvatar from './contributor-avatar';
import s from './project-development.module.css';

function Arrow() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>;
}
function CodeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/></svg>;
}
function DateStamp({ date }: { date: string }) {
  return <time dateTime={date}>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))}</time>;
}

export default function ProjectDevelopment({ project, data, headingRef, onFollow }: {
  project: Project; data: PortalData; headingRef: Ref<HTMLHeadingElement>; onFollow: (href: string) => void;
}) {
  const repositories = data.repos.filter(repo => (project.repos as readonly string[]).includes(repo.name));
  const commits = developmentCommits(repositories, true).slice(0, 5);
  const hasForks = repositories.some(repo => repo.fork);

  if (!project.repos.length) return <section id="project-development" className={`${s.card} ${s.emptyState}`} aria-labelledby="project-panel-heading">
    <div><h2 id="project-panel-heading" ref={headingRef} tabIndex={-1}>No repository linked yet</h2><p>Code activity will appear when a repository is linked to {project.name} in this portal.</p></div>
    <EditorialLink href={projectHref(project, 'resources')} onFollow={onFollow} className={s.action}>Research & guides<Arrow/></EditorialLink>
  </section>;

  return <div id="project-development" className={s.grid}>
    <section className={`${s.card} ${s.activity}`} aria-labelledby="project-panel-heading">
      <header className={s.heading}><h2 id="project-panel-heading" ref={headingRef} tabIndex={-1}>Recent commits</h2><span>Dates in UTC</span></header>
      {commits.length ? <ol className={s.commits}>{commits.map(commit => {
        const repo = repositories.find(item => item.name === commit.sourceRepository)!;
        return <li key={commit.sha}><EditorialLink href={activityHref({ repo: repo.name, includeForks: repo.fork, record: `commit:${commit.sha}` })} onFollow={onFollow}>
          <ContributorAvatar name={commit.author} login={commit.login} size={28}/>
          <div className={s.commitCopy}>
            <h3>{commit.title}</h3>
            <div className={s.commitMeta}><span>{commit.author}</span><DateStamp date={commit.date}/>{project.repos.length > 1 && <span className={s.commitRepo}>{repositoryLabels[repo.name] ?? repo.name}</span>}</div>
          </div><Arrow/>
        </EditorialLink></li>;
      })}</ol> : <p className={s.emptyCopy}>{repositories.length ? 'No commits are available in this repository sample.' : 'Repository activity is currently unavailable.'}</p>}
      <EditorialLink href={activityHref(repositories.length === 1 ? { repo: repositories[0].name, includeForks: repositories[0].fork } : {})} onFollow={onFollow} className={s.action}>{repositories.length === 1 ? 'Explore repository activity' : 'All code activity'}<Arrow/></EditorialLink>
    </section>

    <aside className={s.repositoryStack} aria-label="Project repositories">
      {project.repos.map(name => {
        const repo = repositories.find(item => item.name === name);
        const label = repositoryLabels[name] ?? name;
        if (!repo) return <section key={name} className={`${s.card} ${s.unavailable}`}><h3>{label}</h3><p>Repository record currently unavailable.</p></section>;
        return <EditorialLink key={name} href={activityHref({ repo: name, includeForks: repo.fork, record: `repo:${name}` })} onFollow={onFollow} className={`${s.card} ${s.repository}`}>
          <header className={s.repositoryHeading}><span className={s.codeIcon}><CodeIcon/></span><div><span>{repo.fork ? 'Fork repository' : 'Core repository'}</span><h3>{label}</h3></div><Arrow/></header>
          {label !== name && <code className={s.repositoryName}>{name}</code>}
          <dl className={s.facts}><div><dt>Branch</dt><dd>{repo.branch}</dd></div><div><dt>Language</dt><dd>{repo.language ?? 'Not specified'}</dd></div></dl>
          <div className={s.retrieved}><span>{repo.state === 'live' ? 'Retrieved' : 'Saved record'}</span><DateStamp date={repo.fetchedAt}/></div>
          {repo.refreshError && <small className={s.refreshNote}>{repo.refreshError === 'rate-limited' ? 'Refresh paused · GitHub rate limit' : 'Latest refresh unavailable'}</small>}
        </EditorialLink>;
      })}
      <section className={`${s.card} ${s.sample}`} aria-labelledby="project-activity-sample"><h3 id="project-activity-sample">About this activity</h3><p>Up to 100 latest commits per branch. This is a sample, not the full history.</p>{hasForks && <p>Forks may include upstream work and are excluded from core activity totals.</p>}</section>
    </aside>
  </div>;
}
