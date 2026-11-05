'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, type ReactNode } from 'react';
import { milestones, projects, REVIEWED, sources, team, type Project } from '@/lib/shielded-preview/content';
import { directoryHref, milestoneGroupItems, peopleGroups, personId, teamContext, type DirectoryView, type Person } from '@/lib/shielded-preview/directory';
import { projectPublications, publicationQuote } from '@/lib/shielded-preview/project-publications';
import portraitData from '@/lib/shielded-preview/team-portraits.json';
import RecordLayout from './governance-record';
import SectionMenu from './section-menu';
import MilestonesView from './milestones-view';
import MilestoneRecord from './milestone-record';
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

export default function Directory({ view, section, record, onNavigate, onProject, onFollow }: { view: DirectoryView; section: string | null; record: string | null; onNavigate: Navigate; onProject: (project: Project) => void; onFollow: (href: string) => void }) {
  const person = view === 'people' ? team.find(person => `person:${personId(person)}` === record) : undefined;
  const milestone = view === 'impact' ? milestones.find(milestone => `milestone:${milestone.date}` === record) : undefined;
  const groups = view === 'people' ? peopleGroups : milestoneGroupItems;
  const recordGroup = person?.group.toLowerCase() ?? milestone?.type.toLowerCase();
  const activeGroup = groups.some(group => group.id === section) ? section! : recordGroup ?? 'all';
  const heading = useRef<HTMLHeadingElement>(null);
  const hasRecord = Boolean(person || milestone);
  useEffect(() => { if (!record || !hasRecord) heading.current?.focus({ preventScroll: true }); }, [view, activeGroup, record, hasRecord]);
  const context = person ? teamContext[person.group] : undefined;
  const colleagues = person ? team.filter(other => other.group === person.group && other.name !== person.name) : [];

  return <div className={s.directory}>
    {!milestone && <SectionMenu items={groups} value={activeGroup} onChange={onNavigate} label={view === 'people' ? 'Team navigation' : 'Milestones navigation'}/>}
    {!record && view === 'people' && <h1 ref={heading} tabIndex={-1} className={s.srOnly}>{activeGroup === 'all' ? 'Team' : `Team · ${groups.find(group => group.id === activeGroup)?.label}`}</h1>}

    {!record && view === 'impact' && <MilestonesView group={activeGroup} headingRef={heading} onNavigate={onNavigate}/>}

    {milestone && <MilestoneRecord milestone={milestone} group={activeGroup} onNavigate={onNavigate} onProject={onProject} onFollow={onFollow}/>}

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
