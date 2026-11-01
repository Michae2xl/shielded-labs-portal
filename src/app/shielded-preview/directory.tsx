'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, type ReactNode } from 'react';
import { COMMUNITIES } from '@/lib/communities/data';
import { milestones, projects, REVIEWED, sources, team, type Project } from '@/lib/shielded-preview/content';
import { directoryHref, milestoneGroups, milestoneProject, peopleGroups, personId, securityAttribution, teamContext, type DirectoryView, type Person } from '@/lib/shielded-preview/directory';
import { projectGuides } from '@/lib/shielded-preview/project-guides';
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
function ProjectRows({ ids, onProject }: { ids: string[]; onProject: (project: Project) => void }) { return <div className={s.projectRows}>{ids.map(id => projects.find(project => project.id === id)).filter((project): project is Project => !!project).map(project => <ProjectLink key={project.id} project={project} onSelect={onProject} className={s.projectRow}><div><h3>{project.name}</h3><p>{projectGuides[project.id].lead}</p></div><Arrow/></ProjectLink>)}</div>; }

export default function Directory({ view, section, record, onNavigate, onProject }: { view: DirectoryView; section: string | null; record: string | null; onNavigate: Navigate; onProject: (project: Project) => void }) {
  const person = view === 'people' ? team.find(person => `person:${personId(person)}` === record) : undefined;
  const community = view === 'people' ? COMMUNITIES.find(community => `community:${community.id}` === record) : undefined;
  const milestone = view === 'impact' ? milestones.find(milestone => `milestone:${milestone.date}` === record) : undefined;
  const groups = view === 'people' ? peopleGroups : milestoneGroups;
  const recordGroup = person?.group.toLowerCase() ?? (community ? 'communities' : milestone?.type.toLowerCase());
  const activeGroup = groups.some(group => group.id === section) ? section! : recordGroup ?? 'all';
  const heading = useRef<HTMLHeadingElement>(null);
  const hasRecord = Boolean(person || community || milestone);
  useEffect(() => { if (!record || !hasRecord) heading.current?.focus({ preventScroll: true }); }, [view, activeGroup, record, hasRecord]);
  const relatedProject = milestone ? milestoneProject(milestone) : undefined;
  const context = person ? teamContext[person.group] : undefined;
  const colleagues = person ? team.filter(other => other.group === person.group && other.name !== person.name) : [];
  const chronology = milestones.slice().reverse();

  return <div className={s.directory}>
    <SectionMenu items={groups} value={activeGroup} onChange={onNavigate} label={view === 'people' ? 'Team & community navigation' : 'Milestones navigation'}/>
    {!record && <h1 ref={heading} tabIndex={-1} className={s.srOnly}>{view === 'people' ? 'Team & community' : 'Milestones'} · {groups.find(group => group.id === activeGroup)?.label}</h1>}

    {!record && view === 'impact' && <>
      <div className={s.timeline}>{chronology.filter(item => activeGroup === 'all' || item.type.toLowerCase() === activeGroup).map(item => <EntryLink key={item.date} view="impact" section={activeGroup} record={`milestone:${item.date}`} onNavigate={onNavigate} className={s.milestoneRow}>
        <div className={s.milestoneCopy}><span className={s.category}>{milestoneProject(item).name} · {item.type}</span><h2>{item.name}</h2><p>{item.detail}</p></div>
        <div className={s.cardFooter}><time dateTime={item.date}>{dateLabel(item.date)}</time><Arrow/></div>
      </EntryLink>)}</div>
      <p className={s.footnote}>Sources reviewed {dateLabel(REVIEWED)}</p>
    </>}

    {milestone && relatedProject && <RecordLayout idPrefix="milestone" title={milestone.name} context={milestone.type} subtitle={relatedProject.name}
      metrics={<><Stat label="Recorded date">{dateLabel(milestone.date)}</Stat><Stat label="Workstream">{milestone.type}</Stat><Stat label="Record type">{milestone.type === 'Engineering' ? 'Prototype milestone' : milestone.type === 'Research' ? 'Research announcement' : milestone.date === '2026-05-29' ? 'Vulnerability discovery' : 'Emergency response'}</Stat></>}
      sections={[{ label: 'Context', id: 'milestone-context' }, ...(milestone.type === 'Security' ? [{ label: 'Attribution', id: 'milestone-attribution' }] : []), { label: 'Related work', id: 'milestone-related' }]}
      backLabel={activeGroup === 'all' ? 'All milestones' : `All ${activeGroup} milestones`} onBack={() => onNavigate(activeGroup)}
      sources={<><p>{milestone.type === 'Security' ? 'The disclosure does not establish that no prior exploitation occurred. Attribution follows the published account; no estimate of funds saved is made.' : relatedProject.boundary}</p><SourceLink href={milestone.source}>Primary source</SourceLink>{relatedProject.source !== milestone.source && <SourceLink href={relatedProject.source}>Project reference</SourceLink>}<p className={s.sourceDate}>Reviewed {dateLabel(REVIEWED)}</p></>}
    >
      <section id="milestone-context"><h2>What changed</h2><p>{milestone.detail}</p><h3>Project context</h3><p>{projectGuides[relatedProject.id].benefit}</p></section>
      {milestone.type === 'Security' && <section id="milestone-attribution"><h2>Who did what</h2><dl className={s.attribution}>{securityAttribution.map(item => <div key={item.name}><dt>{item.name}</dt><dd>{item.action}</dd></div>)}</dl></section>}
      <section id="milestone-related"><h2>Follow the work</h2><ProjectRows ids={[relatedProject.id]} onProject={onProject}/><div className={s.relatedEvents}>{chronology.filter(item => item.date !== milestone.date && item.type === milestone.type).map(item => <EntryLink key={item.date} view="impact" section={activeGroup} record={`milestone:${item.date}`} onNavigate={onNavigate} className={s.relatedEvent}><div><time dateTime={item.date}>{dateLabel(item.date)}</time><span>{item.name}</span></div><Arrow/></EntryLink>)}</div></section>
    </RecordLayout>}

    {!record && view === 'people' && activeGroup !== 'communities' && <>
      <div className={s.peopleGrid}>{team.filter(person => activeGroup === 'all' || person.group.toLowerCase() === activeGroup).map(person => <EntryLink key={person.name} view="people" section={activeGroup} record={`person:${personId(person)}`} onNavigate={onNavigate} className={s.personCard}><div className={s.personIdentity}><Portrait person={person}/><div><h2>{person.name}</h2><p>{person.role}</p></div></div><div className={s.cardFooter}><span>{person.group}</span><Arrow/></div></EntryLink>)}</div>
      <div className={s.directoryFooter}><p>Team information reviewed {dateLabel(REVIEWED)}</p><SourceLink href={sources.team}>Official team</SourceLink><a className={s.sourceLink} href="?view=about&section=careers">Careers<Arrow/></a></div>
    </>}

    {person && context && <RecordLayout idPrefix="person" title={person.name} context="Team profile" subtitle={person.role} portrait={<Portrait person={person} detail/>}
      metrics={<><Stat label="Team focus">{person.group}</Stat><Stat label="Reviewed">{dateLabel(REVIEWED)}</Stat><Stat label="Related projects">{context.projects.length}</Stat></>}
      sections={[{ label: 'Related work', id: 'person-work' }, ...(colleagues.length ? [{ label: 'Team', id: 'person-team' }] : [])]}
      backLabel={activeGroup === 'all' ? 'All team members' : `Back to ${activeGroup}`} onBack={() => onNavigate(activeGroup)}
      sources={<><p>Role and portrait from Shielded Labs’ published team page. Project links provide organizational context; they are not a complete record of individual contributions.</p><SourceLink href={sources.team}>Official team</SourceLink>{person.group === 'Cryptography' && <SourceLink href={sources.epoch}>Epoch team announcement</SourceLink>}<a className={s.sourceLink} href="?view=about&section=careers">Careers<Arrow/></a></>}
    >
      <section id="person-work"><h2>{context.title}</h2><p>{context.text}</p><ProjectRows ids={context.projects} onProject={onProject}/></section>
      {colleagues.length > 0 && <section id="person-team"><h2>Also in {person.group.toLowerCase()}</h2><div className={s.colleagues}>{colleagues.map(other => <EntryLink key={other.name} view="people" section={activeGroup} record={`person:${personId(other)}`} onNavigate={onNavigate} className={s.colleague}><Portrait person={other}/><div><h3>{other.name}</h3><p>{other.role}</p></div><Arrow/></EntryLink>)}</div></section>}
    </RecordLayout>}

    {!record && view === 'people' && activeGroup === 'communities' && <>
      <div className={s.communityGrid}>{COMMUNITIES.map(community => <EntryLink key={community.id} view="people" section="communities" record={`community:${community.id}`} onNavigate={onNavigate} className={s.communityCard}><div><h2>{community.name}</h2><p>{community.region} · {community.language}</p></div><Arrow/></EntryLink>)}</div>
      <div className={s.directoryFooter}><p>Community information from OpenZcash.</p><SourceLink href="https://openzcash.org/communities">Source directory</SourceLink></div>
    </>}

    {community && <RecordLayout idPrefix="community" title={community.name} context="Zcash community" subtitle={community.country}
      metrics={<><Stat label="Region">{community.region}</Stat><Stat label="Language">{community.language}</Stat><Stat label="Public record since">{community.since ?? 'Not recorded'}</Stat></>}
      sections={[{ label: 'Community', id: 'community-about' }, { label: 'Public channels', id: 'community-channels' }]}
      backLabel="All communities" onBack={() => onNavigate('communities')}
      sources={<><p>Community description and public channels come from the OpenZcash directory. A directory entry does not imply affiliation with Shielded Labs.</p><SourceLink href="https://openzcash.org/communities">OpenZcash directory</SourceLink></>}
    >
      <section id="community-about"><h2>About the community</h2><p>{community.about}</p></section>
      <section id="community-channels"><h2>Public channels</h2><div className={s.publicLinks}>{Object.entries(community.links).filter(([key]) => ['site','x','telegram','discord','youtube','instagram'].includes(key)).map(([key, href]) => <SourceLink key={key} href={href!}>{key === 'site' ? 'Website' : key === 'x' ? 'X' : key.charAt(0).toUpperCase()+key.slice(1)}</SourceLink>)}{community.links.forumUser && <SourceLink href={`https://forum.zcashcommunity.com/u/${encodeURIComponent(community.links.forumUser)}`}>Community forum</SourceLink>}</div></section>
    </RecordLayout>}

    {record && !person && !community && !milestone && <section className={s.empty}><h1 ref={heading} tabIndex={-1}>Record not found</h1><p>This record is not available in the current directory.</p><button onClick={() => onNavigate('all')}>Back to {view === 'people' ? 'team & community' : 'milestones'}</button></section>}
  </div>;
}
