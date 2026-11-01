'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { milestones, projects, type Project } from '@/lib/shielded-preview/content';
import { developmentDays, repositoryLabels, windowCommits, developmentCommits } from '@/lib/shielded-preview/development-metrics';
import type { PortalData } from '@/lib/shielded-preview/types';
import ContributorAvatar from './contributor-avatar';
import { ProjectLink } from './project-detail';
import { ShieldSculpture } from './shield';
import { editorialCatalog } from '@/lib/shielded-preview/editorial/library';
import Image from 'next/image';
import s from './overview.module.css';

type OverviewView = 'projects' | 'governance' | 'activity' | 'impact' | 'blog';
type Navigate = (view: OverviewView, section?: string, record?: string) => void;

const governance = [
  { section: 'proposals', title: 'Proposals', description: 'Applications under review' },
  { section: 'voting', title: 'Voting', description: 'Eligibility and rules' },
  { section: 'grants', title: 'Grants', description: 'Payments and milestones' },
  { section: 'results', title: 'Results', description: 'Ballots and outcomes' },
  { section: 'zcap', title: 'ZCAP', description: 'Members and responses' },
  { section: 'insights', title: 'Insights', description: 'Data and comparisons' },
];

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

export default function Overview({ data, onNavigate, onProject }: {
  data: PortalData; onNavigate: Navigate; onProject: (project: Project) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const days = developmentDays(data.checkedAt, 35);
  const commits = windowCommits(developmentCommits(data.repos), days);
  const recentRepositories = data.repos.filter(repo => !repo.fork).flatMap(repo => {
    const latest = commits.find(commit => commit.repositories.includes(repo.name));
    return latest ? [{ repo, latest }] : [];
  }).sort((a, b) => b.latest.date.localeCompare(a.latest.date)).slice(0, 3);
  const recentMilestones = [...milestones].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const latestNews = editorialCatalog.filter(entry => entry.view === 'blog').slice(0, 3);

  return <div className={s.overview}>
    <header className={s.intro}>
      <h1 ref={heading} tabIndex={-1}>Independent. <span>For Zcash.</span></h1>
      <div className={s.shield}><ShieldSculpture/></div>
    </header>

    <section aria-labelledby="overview-governance" className={s.governance}>
      <div className={s.governanceIntro}>
        <h2 id="overview-governance">Zcash Governance Panel</h2>
        <p>The decisions, funding and community participation shaping Zcash.</p>
        <PortalLink view="governance" section="overview" onNavigate={onNavigate} className={s.governanceAction}>Open the panel<Arrow/></PortalLink>
      </div>
      <div className={s.governanceLinks}>{governance.map(item => <PortalLink key={item.section} view="governance" section={item.section} onNavigate={onNavigate}>
        <div><h3>{item.title}</h3><p>{item.description}</p></div><Arrow/>
      </PortalLink>)}</div>
    </section>

    <section aria-labelledby="overview-news" className={s.news}>
      <header className={s.sectionHeader}><h2 id="overview-news">Latest news</h2><PortalLink view="blog" onNavigate={onNavigate} label="All articles"><Arrow/></PortalLink></header>
      <div className={s.newsGrid}>{latestNews.map(entry => <PortalLink key={entry.id} view="blog" section="all" record={entry.id} onNavigate={onNavigate} className={s.newsCard}>
        {entry.image && <Image src={entry.image.src} alt="" width={entry.image.width} height={entry.image.height} sizes="(max-width: 650px) 100px, (max-width: 900px) calc((100vw - 104px) / 3), calc((100vw - 368px) / 3)"/>}
        <div><DateStamp date={entry.publishedAt}/><h3>{entry.title}</h3></div><Arrow/>
      </PortalLink>)}</div>
    </section>

    <div className={s.workspace}>
      <section aria-labelledby="overview-projects" className={s.projects}>
        <header className={s.sectionHeader}><h2 id="overview-projects">Projects</h2><PortalLink view="projects" onNavigate={onNavigate} label="All projects"><Arrow/></PortalLink></header>
        <div className={s.projectGrid}>{projects.map(project => <ProjectLink key={project.id} project={project} onSelect={onProject} className={s.project}>
          <div className={s.projectTitle}><h3>{project.name}</h3><Arrow/></div>
          <p>{project.description}</p>
          <span className={s.stage}>{project.status}</span>
        </ProjectLink>)}</div>
      </section>

      <section aria-labelledby="overview-code" className={s.code}>
        <header className={s.sectionHeader}><h2 id="overview-code">Code activity</h2><PortalLink view="activity" onNavigate={onNavigate} label="All code activity"><Arrow/></PortalLink></header>
        <div className={s.recentCode}>{recentRepositories.map(({ repo, latest }) => <PortalLink key={repo.name} view="activity" section={repo.name} onNavigate={onNavigate} className={s.repository} label={`Explore ${repositoryLabels[repo.name] ?? repo.name} activity`}>
          <ContributorAvatar name={latest.author} login={latest.login} size={36}/>
          <div><h3>{repositoryLabels[repo.name] ?? repo.name}</h3><p>{latest.title}</p><span className={s.codeMeta}>{latest.author}<DateStamp date={latest.date}/></span></div><Arrow/>
        </PortalLink>)}</div>
        {!recentRepositories.length && <p className={s.empty}>No repository activity in the available 35-day sample.</p>}
      </section>

      <section aria-labelledby="overview-milestones" className={s.milestones}>
        <header className={s.sectionHeader}><h2 id="overview-milestones">Milestones</h2><PortalLink view="impact" onNavigate={onNavigate} label="All milestones"><Arrow/></PortalLink></header>
        <div>{recentMilestones.map(milestone => <PortalLink key={milestone.date} view="impact" section={milestone.type.toLowerCase()} record={`milestone:${milestone.date}`} onNavigate={onNavigate} className={s.milestone}>
          <div><DateStamp date={milestone.date}/><h3>{milestone.name}</h3><p>{milestone.detail}</p></div><Arrow/>
        </PortalLink>)}</div>
      </section>
    </div>
  </div>;
}
