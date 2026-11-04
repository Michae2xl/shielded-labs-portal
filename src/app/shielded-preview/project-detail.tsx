'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { sources, type Project } from '@/lib/shielded-preview/content';
import type { PortalData } from '@/lib/shielded-preview/types';
import { projectGuides } from '@/lib/shielded-preview/project-guides';
import { officialProjectExcerpts } from '@/lib/shielded-preview/official-project-excerpts';
import { projectPublications, projectCopyReviewedAt, publicationQuote, type PublicationExcerpt, type PublicationRecord } from '@/lib/shielded-preview/project-publications';
import { editorialCatalog, editorialHref } from '@/lib/shielded-preview/editorial/library';
import type { EditorialEntry } from '@/lib/shielded-preview/editorial/types';
import { projectHref, type ProjectSection } from '@/lib/shielded-preview/project-navigation';
import { EditorialLink, ProjectDocument } from './editorial';
import ProjectFaq from './project-faq';
import ProjectDevelopment from './project-development';
import ContextNotice from './context-notice';
import s from './project-detail.module.css';

export function ProjectLink({ project, onSelect, children, className }: {
  project: Project; onSelect: (project: Project) => void; children: ReactNode; className?: string;
}) {
  return <a href={projectHref(project)} className={className} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onSelect(project);
  }}>{children}</a>;
}

function Arrow({ external = false }: { external?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>;
}
function SectionIcon({ kind }: { kind: ProjectSection }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    progress: <><path d="M6 4v16M10 6h10M10 12h7M10 18h10"/><circle cx="6" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="6" cy="18" r="2"/></>,
    resources: <><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/></>,
    faq: <><path d="M4 3h16v14H9l-5 4Z"/><path d="M10 8a2 2 0 1 1 3 1.7c-.7.4-1 1-1 1.8M12 14h.01"/></>,
    development: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}
function DateStamp({ date }: { date: string }) {
  return <time dateTime={date}>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))}</time>;
}
function SectionLink({ project, section, onSection, children, className, current }: {
  project: Project; section: ProjectSection; onSection: (section: ProjectSection) => void;
  children: ReactNode; className?: string; current?: boolean;
}) {
  return <a href={projectHref(project, section)} className={className} aria-current={current ? 'page' : undefined} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onSection(section);
  }}>{children}</a>;
}
const resourcePriority: Record<string, number> = { Guide: 0, 'Guide & FAQ': 0, 'Research guide': 0, FAQ: 1, Simulator: 2, Roadmap: 3, 'Technical reference': 4 };
const resourceHints: Record<string, string> = {
  Guide: 'Understand the project', 'Guide & FAQ': 'An introduction and common questions', 'Research guide': 'Explore the research',
  FAQ: 'Answers to common questions', Simulator: 'Explore the assumptions', Roadmap: 'Follow the planned work', 'Technical reference': 'Explore implementation details',
};
function ResourceLink({ entry, onFollow }: { entry: EditorialEntry; onFollow: (href: string) => void }) {
  return <EditorialLink href={editorialHref(entry)} onFollow={onFollow} className={s.resourceLink}>
    <span className={s.resourceIcon}><SectionIcon kind={entry.category === 'Technical reference' ? 'development' : entry.category === 'FAQ' ? 'faq' : 'resources'}/></span>
    <span className={s.resourceCopy}><small>{resourceHints[entry.category] ?? entry.category}</small><strong>{entry.title}</strong></span><Arrow/>
  </EditorialLink>;
}

function publicationHref(reference: PublicationRecord) {
  if (reference.href) return reference.href;
  const entry = editorialCatalog.find(entry => entry.id === reference.documentId);
  return entry ? `${editorialHref(entry)}${reference.anchor ? `#${reference.anchor}` : ''}` : reference.source;
}
function PublishedCopy({ excerpt, project, field, children }: {
  excerpt: PublicationExcerpt; project: Project; field: 'presentation' | 'progress' | 'next'; children?: ReactNode;
}) {
  const quote = publicationQuote(excerpt);
  return <div className={`${s.publishedCopy}${field === 'presentation' ? ` ${s.publishedLead}` : ''}`} data-publication={field}>
    {quote !== null ? <p><q cite={excerpt.source}>{quote}</q></p> : !excerpt.steps?.length && <p className={s.unpublished}>Not specified in this source.</p>}
    {excerpt.detail && <small className={s.publicationDetail}>{excerpt.detail}</small>}
    {excerpt.steps && <ul className={s.publishedSteps}>{excerpt.steps.map(step => <li key={step}><q cite={excerpt.source}>{step}</q></li>)}</ul>}
    {excerpt.window && <small className={s.publicationDetail}>Published window · {excerpt.window}</small>}
    {children}
    <div className={s.publicationSource}>
      <a href={excerpt.source} target="_blank" rel="noopener noreferrer" aria-label={`Shielded Labs source for ${project.name} ${field}`}>Shielded Labs<Arrow external/></a>
      {field !== 'presentation' && excerpt.publishedAt && <span>Published <DateStamp date={excerpt.publishedAt}/></span>}
    </div>
  </div>;
}

export default function ProjectDetail({ project, section, record, data, glyph, onSection, onFollow }: {
  project: Project; section: string | null; record: string | null; data: PortalData; glyph: ReactNode;
  onSection: (section: ProjectSection) => void; onFollow: (href: string) => void;
}) {
  const reading = editorialCatalog.filter(entry => entry.projects.includes(project.id));
  const allResources = reading.filter(entry => entry.view === 'resources')
    .sort((a, b) => (resourcePriority[a.category] ?? 5) - (resourcePriority[b.category] ?? 5));
  const resources = allResources.filter(entry => entry.category !== 'FAQ');
  const faqs = allResources.filter(entry => entry.category.includes('FAQ'));
  const document = allResources.find(entry => entry.id === record);
  const faq = record ? faqs.find(entry => entry.id === record) : faqs[0];
  const sections: { id: ProjectSection; label: string }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'progress', label: 'Progress' }, { id: 'resources', label: 'Research' },
    ...(faqs.length ? [{ id: 'faq' as const, label: 'FAQ' }] : []),
    { id: 'development', label: 'Development' },
  ];
  const active = sections.find(item => item.id === section)?.id ?? 'overview';
  const compact = active !== 'overview';
  const title = useRef<HTMLHeadingElement>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    (firstRender.current ? title : panelHeading).current?.focus({ preventScroll: true });
    firstRender.current = false;
  }, [active, record]);
  const guide = projectGuides[project.id];
  const excerpt = officialProjectExcerpts[project.id];
  const publication = projectPublications[project.id];
  const articles = reading.filter(entry => entry.view === 'blog').sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const latest = articles[0];

  return <article className={s.page} aria-labelledby="project-title">
    <header className={`${s.hero}${compact ? ` ${s.compactHero}` : ''}`}>
      <div className={s.identity}>
        <span className={s.projectIcon} aria-hidden="true">{glyph}</span>
        <div className={s.identityCopy}>
          <h1 id="project-title" ref={title} tabIndex={-1}>{project.name}</h1>
          <div className={s.projectMeta}>
            <span className={s.projectCategory} data-has-status={Boolean(publication.badge)}>{project.category}</span>
            {publication.badge && <span className={s.projectStatus}><span aria-hidden="true"/>{publication.badge.text}</span>}
          </div>
        </div>
      </div>
      {!compact && <PublishedCopy excerpt={publication.presentation} project={project} field="presentation"/>}
    </header>

    <nav className={s.sectionNav} aria-label="Project sections">
      {sections.map(item => <SectionLink key={item.id} project={project} section={item.id} onSection={onSection} current={active === item.id}><SectionIcon kind={item.id}/>{item.label}</SectionLink>)}
    </nav>

    <div className={s.panel} key={active}>
      {active === 'overview' && <>
        <div className={`${s.overviewGrid}${allResources.length < 2 ? ` ${s.compactReading}` : ''}`} id="project-overview">
          <section className={`${s.card} ${s.purpose}`} aria-labelledby="project-panel-heading">
            <div className={s.excerptHeading}>
              <h2 id="project-panel-heading" ref={panelHeading} tabIndex={-1}>Why it matters</h2>
              <a href={excerpt.source} target="_blank" rel="noopener noreferrer" aria-label={`Shielded Labs source for ${project.name}`} className={s.textLink}>Shielded Labs<Arrow external/></a>
            </div>
            <blockquote className={s.officialExcerpt} cite={excerpt.source}><p>“{excerpt.text}”</p></blockquote>
          </section>
          <section className={`${s.card} ${s.progressCard}`} aria-labelledby="project-progress-heading" id="project-progress">
            <h2 id="project-progress-heading">Progress</h2>
            <PublishedCopy excerpt={publication.progress} project={project} field="progress">
              {publication.summaryReferences && <div className={s.publicationChips}>{publication.records.map(item => <EditorialLink key={item.title} href={publicationHref(item)} onFollow={onFollow}>{item.title}<Arrow external/></EditorialLink>)}</div>}
            </PublishedCopy>
            <SectionLink project={project} section="progress" onSection={onSection} className={s.cardAction}>Explore progress<Arrow/></SectionLink>
          </section>
          <section className={`${s.card} ${s.nextStep}`} aria-labelledby="project-next-heading">
            <h2 id="project-next-heading">What comes next</h2><PublishedCopy excerpt={publication.next} project={project} field="next"/>
          </section>
          <aside className={`${s.card} ${s.startHere}`} aria-labelledby="project-start-heading">
            <div className={s.sectionHeading}><h2 id="project-start-heading">Start here</h2></div>
            <div className={s.resourceList}>{allResources.slice(0, 3).map(entry => <ResourceLink key={entry.id} entry={entry} onFollow={onFollow}/>)}</div>
            {allResources.length > 1 && <SectionLink project={project} section="resources" onSection={onSection} className={s.cardAction}>Research & guides<Arrow/></SectionLink>}
          </aside>
          {latest && <EditorialLink href={editorialHref(latest)} onFollow={onFollow} className={s.latestUpdate}><span className={s.updateLabel}>Latest project update<small><DateStamp date={latest.publishedAt}/></small></span><strong>{latest.title}</strong><Arrow/></EditorialLink>}
        </div>
        <details className={s.technicalContext}>
          <summary>How it works & key terms</summary>
          <div className={s.technicalBody}><div><p>{project.purpose}</p><h3>Project scope</h3><p>{project.scope}</p><ul className={s.tags} aria-label="Project focus">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul></div><dl>{guide.terms.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl></div>
        </details>
      </>}

      {active === 'progress' && <div className={s.progressGrid}>
        <section className={s.card} aria-labelledby="project-panel-heading" id="project-milestones">
          <h2 id="project-panel-heading" ref={panelHeading} tabIndex={-1}>Progress</h2>
          <PublishedCopy excerpt={publication.progress} project={project} field="progress"/>
          <h3 className={s.publicationRecordsHeading}>{publication.recordsHeading}</h3>
          <ul className={s.publicationRecords}>{publication.records.map(item => <li key={item.title}><EditorialLink href={publicationHref(item)} onFollow={onFollow}>
            <span>{item.date && <small>{item.dateLabel} <DateStamp date={item.date}/></small>}<strong>{item.title}</strong></span><Arrow external={Boolean(item.href)}/>
          </EditorialLink></li>)}</ul>
        </section>
        <aside className={`${s.card} ${s.nextCard}`}><h2>What comes next</h2><PublishedCopy excerpt={publication.next} project={project} field="next"/></aside>
      </div>}

      {active === 'resources' && (record ? document ? <ProjectDocument key={document.id} entry={document} onFollow={onFollow}/> : <div className={s.empty}><h2 id="project-panel-heading" ref={panelHeading} tabIndex={-1}>Document not found</h2><SectionLink project={project} section="resources" onSection={onSection} className={s.textLink}>Back to research & guides<Arrow/></SectionLink></div> : <div className={s.resourcesGrid} id="project-resources">
        <section className={s.card} aria-labelledby="project-panel-heading"><div className={s.sectionHeading}><h2 id="project-panel-heading" ref={panelHeading} tabIndex={-1}>Research & guides</h2></div><div className={s.resourceCollection}>{resources.map(entry => <ResourceLink key={entry.id} entry={entry} onFollow={onFollow}/>)}</div>{faq && <SectionLink project={project} section="faq" onSection={onSection} className={s.faqCallout}><span className={s.resourceIcon}><SectionIcon kind="faq"/></span><span><strong>Frequently asked questions</strong></span><Arrow/></SectionLink>}</section>
        <section className={s.card} aria-labelledby="project-articles-heading"><div className={s.sectionHeading}><h2 id="project-articles-heading">From the blog</h2></div>{articles.length ? <div className={s.articleList}>{articles.map(entry => <EditorialLink key={entry.id} href={editorialHref(entry)} onFollow={onFollow}><span><small><DateStamp date={entry.publishedAt}/></small><strong>{entry.title}</strong></span><Arrow/></EditorialLink>)}</div> : <p className={s.empty}>Project updates will appear here when they are available in the portal.</p>}</section>
      </div>)}

      {active === 'faq' && (faq ? <ProjectFaq key={faq.id} entry={faq} onFollow={onFollow}/> : <div className={s.empty}><h2 id="project-panel-heading" ref={panelHeading} tabIndex={-1}>Document not found</h2><SectionLink project={project} section="faq" onSection={onSection} className={s.textLink}>Back to frequently asked questions<Arrow/></SectionLink></div>)}

      {active === 'development' && <ProjectDevelopment project={project} data={data} headingRef={panelHeading} onFollow={onFollow}/>}
    </div>

    {active !== 'faq' && !(active === 'resources' && document) && <><ContextNotice>{project.boundary}</ContextNotice>
    <footer className={s.sources} id="project-sources" aria-label="Project sources">
      <span>Official excerpts checked <DateStamp date={projectCopyReviewedAt}/></span>
      <div><a href={project.source} target="_blank" rel="noopener noreferrer">Primary project reference<Arrow external/></a>{project.id === 'ironwood' && <a href={sources.epoch} target="_blank" rel="noopener noreferrer">October update · NU6.3<Arrow external/></a>}</div>
    </footer></>}
  </article>;
}
