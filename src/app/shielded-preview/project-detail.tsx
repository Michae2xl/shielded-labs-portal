'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { milestones, projects, REVIEWED, sources, type Project } from '@/lib/shielded-preview/content';
import type { PortalData } from '@/lib/shielded-preview/types';
import { projectGuides } from '@/lib/shielded-preview/project-guides';
import { editorialCatalog, editorialHref } from '@/lib/shielded-preview/editorial/library';
import { EditorialLink } from './editorial';
import s from './project-detail.module.css';
import ContributorAvatar from './contributor-avatar';
import { activityHref } from '@/lib/shielded-preview/development-navigation';
import { directoryHref } from '@/lib/shielded-preview/directory';

export const projectHref = (project: Project) => `?view=projects&project=${project.id}`;

export function ProjectLink({ project, onSelect, children, className }: {
  project: Project; onSelect: (project: Project) => void; children: ReactNode; className?: string;
}) {
  return <a href={projectHref(project)} className={className} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onSelect(project);
  }}>{children}</a>;
}

function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true" style={back ? { transform: 'rotate(180deg)' } : undefined}><path d="M4 12h16m-6-6 6 6-6 6"/></svg>;
}
function EvidenceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={s.evidenceLink}>{children}<ExternalArrow/></a>;
}
function ExternalArrow() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>; }
function DateStamp({ date }: { date: string }) {
  return <time dateTime={date}>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))}</time>;
}

export default function ProjectDetail({ project, data, glyph, onBack, onSelect, onFollow }: {
  project: Project; data: PortalData; glyph: ReactNode; onBack: () => void; onSelect: (project: Project) => void; onFollow: (href: string) => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, [project.id]);
  const position = projects.findIndex(p => p.id === project.id);
  const next = projects[(position + 1) % projects.length];
  const guide = projectGuides[project.id];
  const repositories = data.repos.filter(repo => (project.repos as readonly string[]).includes(repo.name));
  const commits = repositories.flatMap(repo => repo.commits.map(commit => ({ ...commit, repo: repo.name, fork: repo.fork })))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const reading = editorialCatalog.filter(entry => entry.projects.includes(project.id));
  const resources = reading.filter(entry => entry.view === 'resources');
  const articles = reading.filter(entry => entry.view === 'blog');
  const history = milestones.filter(m => project.id === 'crosslink' ? m.type === 'Engineering' : project.id === 'epoch' ? m.type === 'Research' : project.id === 'ironwood' ? m.type === 'Security' : false);

  return <article className={s.page} aria-labelledby="project-title">
    <div className={s.recordNav}><button className={s.back} onClick={onBack}><Arrow back/>All projects</button><nav className={s.sectionNav} aria-label="Project sections"><a href="#project-overview">Overview</a><a href="#project-progress">Progress</a>{history.length > 0 && <a href="#project-milestones">Milestones</a>}{commits.length > 0 && <a href="#project-development">Code updates</a>}<a href="#project-resources">Resources & FAQs</a><a href="#project-sources">Sources</a></nav></div>
    <header className={s.intro}>
      <div className={s.identity}>
        <span className={s.projectIcon} aria-hidden="true">{glyph}</span>
        <div><h1 id="project-title" ref={title} tabIndex={-1}>{project.name}</h1></div>
      </div>
      <p className={s.lead}>{guide.lead}</p>
      <ul className={s.tags} aria-label="Project focus">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>

    </header>

    <section className={s.statusPanel} id="project-progress" aria-labelledby="project-stage">
      <span className={s.sectionLabel}>Current stage</span>
      <h2 id="project-stage">{project.status}</h2>
      <p>{project.milestone}</p>
      <div className={s.nextStep}><h3>Next step</h3><p>{project.next}</p></div>
    </section>

    <div className={s.body}>
      <section id="project-overview" className={s.section}>
        <h2>Purpose & scope</h2><p>{guide.benefit}</p>
        <div className={s.scope}><span className={s.sectionLabel}>Focus</span><p>{project.scope}</p></div>
        <details className={s.technicalContext}><summary>Technical context & terms</summary><div><p>{project.purpose}</p><dl>{guide.terms.map(item=><div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl></div></details>
      </section>

      <section id="project-resources" className={s.section}>
        <h2>Resources & FAQs</h2>
        <div className={s.readingLinks}>{resources.map(entry => <EditorialLink key={entry.id} href={editorialHref(entry)} onFollow={onFollow}><span><small>{entry.category}</small>{entry.title}</span><Arrow/></EditorialLink>)}</div>
        {articles.length > 0 && <div className={s.readingLinks}><h3>From the blog</h3>{articles.slice(0, 3).map(entry => <EditorialLink key={entry.id} href={editorialHref(entry)} onFollow={onFollow}><span><small><DateStamp date={entry.publishedAt}/></small>{entry.title}</span><Arrow/></EditorialLink>)}</div>}
      </section>

      {history.length > 0 && <section id="project-milestones" className={s.section}>
        <h2>{project.id === 'ironwood' ? 'Security milestones' : 'Milestones'}</h2>
        <ol className={s.timeline} aria-label={project.id === 'ironwood' ? 'Security context' : 'Project milestones'}>{history.map(m => <li key={m.date}><DateStamp date={m.date}/><div><h3>{m.name}</h3><p>{m.detail}</p><EditorialLink className={s.evidenceLink} href={directoryHref('impact', m.type.toLowerCase(), `milestone:${m.date}`)} onFollow={onFollow}>Milestone details<Arrow/></EditorialLink></div></li>)}</ol>
      </section>}

      {commits.length > 0 && <section id="project-development" className={s.section}>
        <h2>Code activity</h2>
        {repositories.some(repo => repo.fork) && <p className={s.notice}>Fork history may include upstream work and is excluded from Shielded Labs core activity counts.</p>}
        <div className={s.commits}>{commits.map(c => <EditorialLink key={c.repo+c.sha} href={activityHref({ repo: c.repo, includeForks: c.fork, record: `commit:${c.sha}` })} onFollow={onFollow}><ContributorAvatar name={c.author} login={c.login} size={30}/><div><span className={s.repoName}>{c.repo}</span><h3>{c.title}</h3><p>{c.author} · <DateStamp date={c.date}/></p></div><Arrow/></EditorialLink>)}</div>
      </section>}
    </div>

    <aside className={s.evidence} id="project-sources" aria-labelledby="project-sources-heading">
      <div className={s.sourceHeading}><h2 id="project-sources-heading">Sources & context</h2><span>Reviewed <DateStamp date={REVIEWED}/></span></div>
      <p>{project.boundary}</p>
      <div className={s.sourceLinks}><EvidenceLink href={project.source}>Primary project reference</EvidenceLink>{project.id === 'ironwood' && <EvidenceLink href={sources.epoch}>October update · NU6.3</EvidenceLink>}</div>
      {repositories.length > 0 && <div className={s.repositories}><h3>Repositories</h3>{repositories.map(repo => <div key={repo.name}><EditorialLink className={s.evidenceLink} href={activityHref({ repo: repo.name, includeForks: repo.fork, record: `repo:${repo.name}` })} onFollow={onFollow}>{repo.name}<Arrow/></EditorialLink><p>{repo.fork ? 'Fork' : 'Core repository'} · {repo.branch}</p><p>{repo.state === 'live' ? 'Retrieved' : 'Saved record'} <DateStamp date={repo.fetchedAt}/></p></div>)}</div>}

    </aside>

    <footer className={s.footer}><ProjectLink project={next} onSelect={onSelect} className={s.nextProject}><span>Next project<strong>{next.name}</strong></span><Arrow/></ProjectLink></footer>
  </article>;
}
