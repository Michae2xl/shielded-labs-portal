'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { MILESTONES_REVIEWED, type Milestone, type Project } from '@/lib/shielded-preview/content';
import { milestoneGovernanceHref, milestoneProject, milestoneYears, securityAttribution, upgradeAttribution } from '@/lib/shielded-preview/directory';
import { officialProjectExcerpts } from '@/lib/shielded-preview/official-project-excerpts';
import { projectPublications, publicationQuote } from '@/lib/shielded-preview/project-publications';
import { ProjectLink } from './project-detail';
import { Arrow, ViewLink, type Navigate } from './milestones-view';
import s from './milestone-record.module.css';

const fullDate = (date: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className={s.sourceLink} href={href} target="_blank" rel="noopener noreferrer">{children}<Arrow external/></a>;
}

export default function MilestoneRecord({ milestone, group, onNavigate, onProject }: {
  milestone: Milestone; group: string; onNavigate: Navigate; onProject: (project: Project) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [milestone.date]);
  const project = milestoneProject(milestone);
  const excerpt = officialProjectExcerpts[project.id];
  const publication = projectPublications[project.id];
  const governanceRecord = milestoneGovernanceHref(milestone);
  const workstream = milestoneYears(milestone.type.toLowerCase()).flatMap(year => year.entries);
  const upgrade = milestone.recordType === 'Network upgrade';
  const security = milestone.type === 'Security' && !upgrade;
  const attribution = upgrade ? upgradeAttribution : security ? securityAttribution : null;

  return <article className={s.page} aria-labelledby="milestone-record-title">
    <ViewLink section={group} onNavigate={onNavigate} className={s.back}><Arrow back/>{group === 'all' ? 'All milestones' : `All ${group} milestones`}</ViewLink>

    <header className={s.header}>
      <span className={s.eyebrow}>{[project.name, milestone.step].filter(Boolean).join(' · ')}</span>
      <h1 id="milestone-record-title" ref={heading} tabIndex={-1}>{milestone.name}</h1>
    </header>

    <dl className={s.facts} aria-label="Record at a glance">
      <div><dt>Recorded date</dt><dd><time dateTime={milestone.date}>{fullDate(milestone.date)}</time></dd></div>
      <div><dt>Workstream</dt><dd>{milestone.type}</dd></div>
      <div><dt>Record type</dt><dd>{milestone.recordType}</dd></div>
    </dl>

    <div className={s.grid}>
      <div className={s.column}>
        <section className={s.card} aria-labelledby="milestone-changed">
          <h2 id="milestone-changed">{milestone.type === 'Governance' ? 'What happened' : 'What changed'}</h2>
          <p>{milestone.detail}</p>
        </section>
        <section className={s.card} aria-labelledby="milestone-context">
          <h2 id="milestone-context">Project context</h2>
          <blockquote cite={excerpt.source}><p>“{excerpt.text}”</p></blockquote>
          <SourceLink href={excerpt.source}>Shielded Labs</SourceLink>
        </section>
        {attribution && <section className={s.card} aria-labelledby="milestone-attribution">
          <h2 id="milestone-attribution">Who did what</h2>
          <dl className={s.attribution}>{attribution.map(item => <div key={item.name}><dt>{item.name}</dt><dd>{item.action}</dd></div>)}</dl>
        </section>}
        {workstream.length > 1 && <section className={s.card} aria-labelledby="milestone-workstream">
          <h2 id="milestone-workstream">In this workstream</h2>
          <ol className={s.stream}>{workstream.map(item => <li key={item.date}>
            {item.date === milestone.date
              ? <span className={s.streamRow} aria-current="page"><time dateTime={item.date}>{fullDate(item.date)}</time><strong>{item.name}</strong></span>
              : <ViewLink section={group} record={`milestone:${item.date}`} onNavigate={onNavigate} className={s.streamRow}><time dateTime={item.date}>{fullDate(item.date)}</time><span>{item.name}</span><Arrow/></ViewLink>}
          </li>)}</ol>
        </section>}
      </div>

      <div className={s.column}>
        <aside className={s.card} id="milestone-sources" aria-labelledby="milestone-sources-title">
          <h2 id="milestone-sources-title">Sources & context</h2>
          <p className={s.note}>{security ? 'The disclosure does not establish that no prior exploitation occurred. Attribution follows the published account; no estimate of funds saved is made.' : upgrade ? 'Attribution follows the Shielded Labs Ironwood guide, linked here as the project reference.' : project.boundary}</p>
          <div className={s.sourceList}>
            <SourceLink href={milestone.source}>Primary source</SourceLink>
            {milestone.context && <SourceLink href={milestone.context}>Proposal announcement</SourceLink>}
            {project.source !== milestone.source && <SourceLink href={project.source}>Project reference</SourceLink>}
            {governanceRecord && <a className={s.sourceLink} href={governanceRecord}>Governance record<Arrow/></a>}
          </div>
          <p className={s.reviewed}>Reviewed {fullDate(MILESTONES_REVIEWED)}</p>
        </aside>
        <section className={s.card} aria-labelledby="milestone-follow">
          <h2 id="milestone-follow">Follow the work</h2>
          <ProjectLink project={project} onSelect={onProject} className={s.project}>
            <span><strong>{project.name}</strong><q cite={publication.presentation.source}>{publicationQuote(publication.presentation)}</q></span><Arrow/>
          </ProjectLink>
        </section>
      </div>
    </div>
  </article>;
}
