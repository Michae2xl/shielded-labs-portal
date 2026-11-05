'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { leavingLink, sourceHref } from '@/lib/shielded-preview/editorial/library';
import { milestones, sources, team, TEAM_REVIEWED, type Project } from '@/lib/shielded-preview/content';
import { directoryHref, milestoneGroupItems, peopleGroups, personId, type DirectoryView } from '@/lib/shielded-preview/directory';
import type { Repository } from '@/lib/shielded-preview/types';
import SectionMenu from './section-menu';
import MilestonesView from './milestones-view';
import MilestoneRecord from './milestone-record';
import PersonRecord, { Portrait } from './person-record';
import s from './directory.module.css';

type Navigate = (section: string, record?: string) => void;
const dateLabel = (date: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
function Arrow({ external = false }: { external?: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>; }
function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  const target = sourceHref(href);
  return <a className={s.sourceLink} href={target} {...leavingLink(target)}>{children}<Arrow external={!target.startsWith('?')}/></a>;
}
function EntryLink({ view, section, record, onNavigate, className, children }: { view: DirectoryView; section: string; record: string; onNavigate: Navigate; className: string; children: ReactNode }) {
  return <a className={className} href={directoryHref(view, section, record)} onClick={event => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onNavigate(section, record); }}>{children}</a>;
}

export default function Directory({ view, section, record, onNavigate, onProject, onFollow, repositories, checkedAt }: { view: DirectoryView; section: string | null; record: string | null; onNavigate: Navigate; onProject: (project: Project) => void; onFollow: (href: string) => void; repositories?: Repository[]; checkedAt?: string }) {
  const person = view === 'people' ? team.find(person => `person:${personId(person)}` === record) : undefined;
  const milestone = view === 'impact' ? milestones.find(milestone => `milestone:${milestone.date}` === record) : undefined;
  const groups = view === 'people' ? peopleGroups : milestoneGroupItems;
  const recordGroup = person?.group.toLowerCase() ?? milestone?.type.toLowerCase();
  const activeGroup = groups.some(group => group.id === section) ? section! : recordGroup ?? 'all';
  const heading = useRef<HTMLHeadingElement>(null);
  const hasRecord = Boolean(person || milestone);
  useEffect(() => { if (!record || !hasRecord) heading.current?.focus({ preventScroll: true }); }, [view, activeGroup, record, hasRecord]);

  return <div className={s.directory}>
    {!milestone && !person && <SectionMenu items={groups} value={activeGroup} onChange={onNavigate} label={view === 'people' ? 'Team navigation' : 'Milestones navigation'}/>}
    {!record && view === 'people' && <h1 ref={heading} tabIndex={-1} className={s.srOnly}>{activeGroup === 'all' ? 'Team' : `Team · ${groups.find(group => group.id === activeGroup)?.label}`}</h1>}

    {!record && view === 'impact' && <MilestonesView group={activeGroup} headingRef={heading} onNavigate={onNavigate}/>}

    {milestone && <MilestoneRecord milestone={milestone} group={activeGroup} onNavigate={onNavigate} onProject={onProject} onFollow={onFollow}/>}

    {!record && view === 'people' && <>
      <div className={s.peopleGrid}>{team.filter(person => activeGroup === 'all' || person.group.toLowerCase() === activeGroup).map(person => <EntryLink key={person.name} view="people" section={activeGroup} record={`person:${personId(person)}`} onNavigate={onNavigate} className={s.personCard}><div className={s.personIdentity}><Portrait person={person}/><div><h2>{person.name}</h2><p>{person.role}</p></div></div><Arrow/></EntryLink>)}</div>
      <div className={s.directoryFooter}><p>Names, roles and photos match the official team page, checked {dateLabel(TEAM_REVIEWED)}</p><SourceLink href={sources.team}>Official team</SourceLink><a className={s.sourceLink} href="?view=about&section=careers">Careers<Arrow/></a></div>
    </>}

    {person && <PersonRecord person={person} group={activeGroup} repositories={repositories} checkedAt={checkedAt} onNavigate={onNavigate} onFollow={onFollow}/>}

    {record && !person && !milestone && <section className={s.empty}><h1 ref={heading} tabIndex={-1}>Record not found</h1><p>This record is not available in the current directory.</p><button onClick={() => onNavigate('all')}>Back to {view === 'people' ? 'team' : 'milestones'}</button></section>}
  </div>;
}
