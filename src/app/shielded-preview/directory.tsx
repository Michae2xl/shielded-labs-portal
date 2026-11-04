'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, type ReactNode } from 'react';
import { milestones, projects, REVIEWED, sources, team, type Project } from '@/lib/shielded-preview/content';
import { directoryHref, milestoneGroups, milestoneProject, peopleGroups, personId, securityAttribution, teamContext, type DirectoryView, type Person } from '@/lib/shielded-preview/directory';
import { projectPublications, publicationQuote } from '@/lib/shielded-preview/project-publications';
import { officialProjectExcerpts } from '@/lib/shielded-preview/official-project-excerpts';
import portraitData from '@/lib/shielded-preview/team-portraits.json';
import RecordLayout from './governance-record';
import SectionMenu from './section-menu';
import { ProjectLink } from './project-detail';
import s from './directory.module.css';

type Navigate = (section: string, record?: string) => void;
const portraits = portraitData.portraits as Record<string, { src: string }>;
const dateLabel = (date: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
function Arrow({ external = false }: { external?: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>; }
function SourceLink({ href, children }: { href: string; children: ReactNode }) { return <a className={s.sourceLink} href={href} target="_blank" rel="noopener noreferrer">{children}<Arrow external/></a>; }
function Stat({ label, children }: { label: string; children: ReactNode }) { return <div><span>{label}</span><strong>{children}</strong></div>; }
function EntryLink({ view, section, record, onNavigate, className, children }: { view: DirectoryView; section: string; record: string; onNavigate: Navigate; className: string; children: ReactNode }) {
  return <a className={className} href={directoryHref(view, section, record)} onClick={event => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onNavigate(section, record); }}>{children}</a>;
}
function Portrait({ person, detail = false }: { person: Person; detail?: boolean }) {
  const src = portraits[personId(person)]?.src;
  return src ? <img className={detail ? s.detailPortrait : s.portrait} src={src} width={detail ? 108 : 64} height={detail ? 108 : 64} alt="" loading={detail ? 'eager' : 'lazy'}/> : <span className={s.initials} aria-hidden="true">{person.name.split(' ').slice(0, 2).map(word => word[0]).join('')}</span>;
}
function ProjectRows({ ids, onProject }: { ids: string[]; onProject: (project: Project) => void }) { return <div className={s.projectRows}>{ids.map(id => projects.find(project => project.id === id)).filter((project): project is Project => !!project).map(project => <ProjectLink key={project.id} project={project} onSelect={onProject} className={s.projectRow}><div><h3>{project.name}</h3><p><q cite={projectPublications[project.id].presentation.source}>{publicationQuote(projectPublications[project.id].presentation)}</q></p></div><Arrow/></ProjectLink>)}</div>; }

export default function Directory({ view, section, record, onNavigate, onProject }: { view: DirectoryView; section: string | null; record: string | null; onNavigate: Navigate; onProject: (project: Project) => void }) {
  const person = view === 'people' ? team.find(person => `person:${personId(person)}` === record) : undefined;
  const milestone = view === 'impact' ? milestones.find(milestone => `milestone:${milestone.date}` === record) : undefined;
  const groups = view === 'people' ? peopleGroups : milestoneGroups;
  const recordGroup = person?.group.toLowerCase() ?? milestone?.type.toLowerCase();
  const activeGroup = groups.some(group => group.id === section) ? section! : recordGroup ?? 'all';
  const heading = useRef<HTMLHeadingElement>(null);
  const hasRecord = Boolean(person || milestone);
  useEffect(() => { if (!record || !hasRecord) heading.current?.focus({ preventScroll: true }); }, [view, activeGroup, record, hasRecord]);
  const relatedProject = milestone ? milestoneProject(milestone) : undefined;
  const context = person ? teamContext[person.group] : undefined;
  const colleagues = person ? team.filter(other => other.group === person.group && other.name !== person.name) : [];
  const chronology = milestones.slice().reverse();

  return <div className={s.directory}>
    <SectionMenu items={groups} value={activeGroup} onChange={onNavigate} label={view === 'people' ? 'Team navigation' : 'Milestones navigation'}/>
    {!record && <h1 ref={heading} tabIndex={-1} className={s.srOnly}>{view === 'people' && activeGroup === 'all' ? 'Team' : `${view === 'people' ? 'Team' : 'Milestones'} · ${groups.find(group => group.id === activeGroup)?.label}`}</h1>}

    {!record && view === 'impact' && <>
      <div className={s.timeline}>{chronology.filter(item => activeGroup === 'all' || item.type.toLowerCase() === activeGroup).map(item => <EntryLink key={item.date} view="impact" section={activeGroup} record={`milestone:${item.date}`} onNavigate={onNavigate} className={s.milestoneRow}>
        <time className={s.dateColumn} dateTime={item.date}>{dateLabel(item.date)}</time>
        <div className={s.milestoneCopy}><span className={s.category}>{milestoneProject(item).name}{activeGroup === 'all' && ` · ${item.type}`}</span><h2>{item.name}</h2><p>{item.detail}</p></div>
        <Arrow/>
      </EntryLink>)}</div>
      <p className={s.footnote}>Sources reviewed {dateLabel(REVIEWED)}</p>
    </>}

    {milestone && relatedProject && <RecordLayout idPrefix="milestone" title={milestone.name} context={milestone.type} subtitle={relatedProject.name}
      metrics={<><Stat label="Recorded date">{dateLabel(milestone.date)}</Stat><Stat label="Workstream">{milestone.type}</Stat><Stat label="Record type">{milestone.type === 'Engineering' ? 'Prototype milestone' : milestone.type === 'Research' ? 'Research announcement' : milestone.date === '2026-05-29' ? 'Vulnerability discovery' : 'Emergency response'}</Stat></>}
      sections={[{ label: 'Context', id: 'milestone-context' }, ...(milestone.type === 'Security' ? [{ label: 'Attribution', id: 'milestone-attribution' }] : []), { label: 'Related work', id: 'milestone-related' }]}
      backLabel={activeGroup === 'all' ? 'All milestones' : `All ${activeGroup} milestones`} onBack={() => onNavigate(activeGroup)}
      sources={<><p>{milestone.type === 'Security' ? 'The disclosure does not establish that no prior exploitation occurred. Attribution follows the published account; no estimate of funds saved is made.' : relatedProject.boundary}</p><SourceLink href={milestone.source}>Primary source</SourceLink>{relatedProject.source !== milestone.source && <SourceLink href={relatedProject.source}>Project reference</SourceLink>}<p className={s.sourceDate}>Reviewed {dateLabel(REVIEWED)}</p></>}
    >
      <section id="milestone-context"><h2>What changed</h2><p>{milestone.detail}</p><h3>Project context</h3><p><q cite={officialProjectExcerpts[relatedProject.id].source}>{officialProjectExcerpts[relatedProject.id].text}</q></p><SourceLink href={officialProjectExcerpts[relatedProject.id].source}>Shielded Labs</SourceLink></section>
      {milestone.type === 'Security' && <section id="milestone-attribution"><h2>Who did what</h2><dl className={s.attribution}>{securityAttribution.map(item => <div key={item.name}><dt>{item.name}</dt><dd>{item.action}</dd></div>)}</dl></section>}
      <section id="milestone-related"><h2>Follow the work</h2><ProjectRows ids={[relatedProject.id]} onProject={onProject}/><div className={s.relatedEvents}>{chronology.filter(item => item.date !== milestone.date && item.type === milestone.type).map(item => <EntryLink key={item.date} view="impact" section={activeGroup} record={`milestone:${item.date}`} onNavigate={onNavigate} className={s.relatedEvent}><div><time dateTime={item.date}>{dateLabel(item.date)}</time><span>{item.name}</span></div><Arrow/></EntryLink>)}</div></section>
    </RecordLayout>}

    {!record && view === 'people' && <>
      <div className={s.peopleGrid}>{team.filter(person => activeGroup === 'all' || person.group.toLowerCase() === activeGroup).map(person => <EntryLink key={person.name} view="people" section={activeGroup} record={`person:${personId(person)}`} onNavigate={onNavigate} className={s.personCard}><div className={s.personIdentity}><Portrait person={person}/><div><h2>{person.name}</h2><p>{person.role}</p></div></div><Arrow/></EntryLink>)}</div>
      <div className={s.directoryFooter}><p>Team information reviewed {dateLabel(REVIEWED)}</p><SourceLink href={sources.team}>Official team</SourceLink><a className={s.sourceLink} href="?view=about&section=careers">Careers<Arrow/></a></div>
    </>}

    {person && context && <RecordLayout idPrefix="person" title={person.name} context="Team profile" subtitle={person.role} portrait={<Portrait person={person} detail/>}
      metrics={<><Stat label="Team focus">{person.group}</Stat><Stat label="Reviewed">{dateLabel(REVIEWED)}</Stat></>}
      sections={[{ label: 'Related work', id: 'person-work' }, ...(colleagues.length ? [{ label: 'Team', id: 'person-team' }] : [])]}
      backLabel={activeGroup === 'all' ? 'All team members' : `Back to ${activeGroup}`} onBack={() => onNavigate(activeGroup)}
      sources={<><p>Role and portrait from Shielded Labs’ published team page. Project links provide organizational context; they are not a complete record of individual contributions.</p><SourceLink href={sources.team}>Official team</SourceLink>{person.group === 'Cryptography' && <SourceLink href={sources.epoch}>Epoch team announcement</SourceLink>}<a className={s.sourceLink} href="?view=about&section=careers">Careers<Arrow/></a></>}
    >
      <section id="person-work"><h2>{context.title}</h2><p>{context.text}</p><ProjectRows ids={context.projects} onProject={onProject}/></section>
      {colleagues.length > 0 && <section id="person-team"><h2>Also in {person.group.toLowerCase()}</h2><div className={s.colleagues}>{colleagues.map(other => <EntryLink key={other.name} view="people" section={activeGroup} record={`person:${personId(other)}`} onNavigate={onNavigate} className={s.colleague}><Portrait person={other}/><div><h3>{other.name}</h3><p>{other.role}</p></div><Arrow/></EntryLink>)}</div></section>}
    </RecordLayout>}

    {record && !person && !milestone && <section className={s.empty}><h1 ref={heading} tabIndex={-1}>Record not found</h1><p>This record is not available in the current directory.</p><button onClick={() => onNavigate('all')}>Back to {view === 'people' ? 'team' : 'milestones'}</button></section>}
  </div>;
}
