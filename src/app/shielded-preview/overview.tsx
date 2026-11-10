'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { milestones, projects, type Project } from '@/lib/shielded-preview/content';
import { developmentDays, isMergeCommit, repositoryLabels, windowCommits, developmentCommits } from '@/lib/shielded-preview/development-metrics';
import type { PortalData } from '@/lib/shielded-preview/types';
import ContributorAvatar from './contributor-avatar';
import ProjectCard from './project-card';
import BlockRewardSplit from './block-reward-split';
import { editorialCatalog } from '@/lib/shielded-preview/editorial/library';
import Image from 'next/image';
import s from './overview.module.css';
import pc from './project-collection.module.css';

type OverviewView = 'projects' | 'governance' | 'activity' | 'impact' | 'blog';
type Navigate = (view: OverviewView, section?: string, record?: string) => void;

function Arrow() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>;
}

function PortalLink({ view, section, record, onNavigate, className, children, label }: {
  view: OverviewView; section?: string; record?: string; onNavigate: Navigate;
  className?: string; children: ReactNode; label?: string;
}) {
  const params = new URLSearchParams({ view });
  if (section) params.set('section', section);
  if (record) params.set('record', record);
  return <a href={`?${params}`} className={className} aria-label={label} onClick={event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(view, section, record);
  }}>{children}</a>;
}

function DateStamp({ date }: { date: string }) {
  return <time dateTime={date}>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))}</time>;
}

export default function Overview({ data, onNavigate, onProject, onFollow, projectGlyph }: {
  data: PortalData; onNavigate: Navigate; onProject: (project: Project) => void;
  onFollow: (href: string) => void; projectGlyph: (project: Project) => ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const days = developmentDays(data.checkedAt, 35);
  const commits = windowCommits(developmentCommits(data.repos), days).filter(commit => !isMergeCommit(commit));
  const recentRepositories = data.repos.filter(repo => !repo.fork).flatMap(repo => {
    const latest = commits.find(commit => commit.repositories.includes(repo.name));
    return latest ? [{ repo, latest }] : [];
  }).sort((a, b) => b.latest.date.localeCompare(a.latest.date)).slice(0, 3);
  const repositories = data.repos.filter(repo => !repo.fork).length;
  const recentMilestones = [...milestones].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const latestNews = editorialCatalog.filter(entry => entry.view === 'blog').slice(0, 3);

  return <div className={s.overview}>
    <header className={s.hero}>
      <div className={s.heroArt} aria-hidden="true"/>
      <div className={s.heroCopy}>
        <h1 ref={heading} tabIndex={-1}><Image src="/logos/shielded-labs-horizontal.png" alt="Shielded Labs" width={800} height={200} priority sizes="(max-width: 700px) 190px, 240px"/></h1>
        <p>Projects, milestones, code activity and Zcash governance in one place.</p>
      </div>
      <ul className={s.facts} aria-label="At a glance">
        <li><PortalLink view="projects" onNavigate={onNavigate}><span>Projects</span><strong>{projects.length}</strong></PortalLink></li>
        <li><PortalLink view="activity" onNavigate={onNavigate}><span>Repositories</span><strong>{repositories}</strong></PortalLink></li>
        <li><PortalLink view="activity" onNavigate={onNavigate}><span>Commits · 35 days</span><strong>{commits.length}</strong></PortalLink></li>
        {recentMilestones[0] && <li><PortalLink view="impact" onNavigate={onNavigate}><span>Latest milestone</span><strong><DateStamp date={recentMilestones[0].date}/></strong></PortalLink></li>}
      </ul>
    </header>

    <section aria-labelledby="overview-projects" className={s.projects}>
      <header className={s.sectionHeader}><h2 id="overview-projects">Projects</h2></header>
      <div className={pc.collection}><div className={`${pc.grid} ${pc.compactNarrow}`}>{projects.map(project => <ProjectCard key={project.id} item={project} repositories={data.repos} glyph={projectGlyph(project)} arrow={<Arrow/>} heading="h3" onSelect={onProject} onFollow={onFollow}/>)}</div></div>
    </section>

    <div className={s.updates}>
      <section aria-labelledby="overview-milestones" className={s.milestones}>
        <header className={s.sectionHeader}><h2 id="overview-milestones">Milestones</h2></header>
        <div>{recentMilestones.map(milestone => <PortalLink key={milestone.date} view="impact" section="all" record={`milestone:${milestone.date}`} onNavigate={onNavigate} className={s.milestone}>
          <div><DateStamp date={milestone.date}/><h3>{milestone.name}</h3><p>{milestone.detail}</p></div><Arrow/>
        </PortalLink>)}</div>
        <PortalLink view="impact" onNavigate={onNavigate} className={s.cardAction}>All milestones<Arrow/></PortalLink>
      </section>

      <section aria-labelledby="overview-code" className={s.code}>
        <header className={s.sectionHeader}><h2 id="overview-code">Code activity</h2><span className={s.period}>35-day sample</span></header>
        <div className={s.recentCode}>{recentRepositories.map(({ repo, latest }) => <PortalLink key={repo.name} view="activity" section={repo.name} record={`repo:${repo.name}`} onNavigate={onNavigate} className={s.repository} label={`Explore ${repositoryLabels[repo.name] ?? repo.name} activity`}>
          <ContributorAvatar name={latest.author} login={latest.login} size={36}/>
          <div><h3>{repositoryLabels[repo.name] ?? repo.name}</h3><p>{latest.title}</p><span className={s.codeMeta}>{latest.author}<DateStamp date={latest.date}/></span></div><Arrow/>
        </PortalLink>)}</div>
        {!recentRepositories.length && <p className={s.empty}>No repository activity in the available 35-day sample.</p>}
        <PortalLink view="activity" onNavigate={onNavigate} className={s.cardAction}>All activity<Arrow/></PortalLink>
      </section>

    <section aria-labelledby="overview-news" className={s.news}>
      <header className={s.sectionHeader}><h2 id="overview-news">From the blog</h2></header>
      <div className={s.newsGrid}>{latestNews.map(entry => <PortalLink key={entry.id} view="blog" section="all" record={entry.id} onNavigate={onNavigate} className={s.newsCard}>
        {entry.image && <Image src={entry.image.src} alt="" width={entry.image.width} height={entry.image.height} sizes="80px"/>}
        <div><DateStamp date={entry.publishedAt}/><h3>{entry.title}</h3></div><Arrow/>
      </PortalLink>)}</div>
      <PortalLink view="blog" onNavigate={onNavigate} className={s.cardAction}>All articles<Arrow/></PortalLink>
    </section>

    <section aria-labelledby="overview-governance" className={s.governance}>
      <header className={s.governanceHead}><Image src="/logos/zcash.svg" width={30} height={30} alt=""/><h2 id="overview-governance">Zcash Governance</h2></header>
      <p className={s.governanceIntro}>Follow proposals, funding, voting and published outcomes across the Zcash ecosystem.</p>
      <div className={s.governanceFigure}><BlockRewardSplit/></div>
      <PortalLink view="governance" section="overview" onNavigate={onNavigate} className={s.cardAction}>Open governance<Arrow/></PortalLink>
    </section>
    </div>
  </div>;
}
