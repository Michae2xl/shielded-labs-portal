'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import dynamic from 'next/dynamic';
import { projects, sources, REVIEWED, MILESTONES_REVIEWED, type Project } from '@/lib/shielded-preview/content';
import { legacyProjectResourceHref, resolveEditorialLink } from '@/lib/shielded-preview/editorial/library';
import { isProjectSection, projectHref, type ProjectSection } from '@/lib/shielded-preview/project-navigation';
import { searchPortal } from '@/lib/shielded-preview/portal-search';
import type { PortalData } from '@/lib/shielded-preview/types';
import s from './portal.module.css';
import pc from './project-collection.module.css';
import PortalNavigation, { portalNavigation as navigation, type PortalView as View } from './portal-navigation';
import PortalFooter from './portal-footer';
import Overview from './overview';
import ProjectDetail from './project-detail';
import ProjectCard from './project-card';

const Governance = dynamic(() => import('./governance'));
const Development = dynamic(() => import('./development'));
const Editorial = dynamic(() => import('./editorial'));
const Directory = dynamic(() => import('./directory'));
const WebsiteProposal = dynamic(() => import('./website-proposal'));
const defaultView: View = 'governance';
const isPortalView = (value: string | null | undefined): value is View => value === 'website' || value === 'resources' || navigation.some(item => item.id === value);
const legacyProjectSections: Record<string, ProjectSection> = {
  '#project-overview': 'overview', '#project-progress': 'progress', '#project-milestones': 'progress',
  '#project-resources': 'resources', '#project-development': 'development',
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    network: <><circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 8-4 7m8-7 4 7M8 18h8"/></>,
    cube: <><path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/></>,
    code: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/></>,
    flag: <><path d="M5 22V3m0 0c5-4 9 4 15 0v11c-6 4-10-4-15 0"/></>,
    people: <><circle cx="9" cy="7" r="4"/><path d="M1 22v-3a8 8 0 0 1 16 0v3m0-19a4 4 0 0 1 0 8m3 4a7 7 0 0 1 3 7"/></>,
    window: <><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20M6 6h1m3 0h1"/></>,
    search: <><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
    shield: <><path d="m12 2 9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6z"/><path d="m8 12 3 3 5-6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    external: <><path d="M14 3h7v7m0-7L10 14m-1-9H3v16h16v-6"/></>,
    check: <path d="m5 12 4 4L20 5"/>,
    refresh: <><path d="M21 11a9 9 0 1 0-3 7M21 3v8h-8"/></>,
    cross: <><path d="m7 2 5 3v6l-5 3-5-3V5Zm10 8 5 3v6l-5 3-5-3v-6Z"/><path d="m7 6 10 12M7 10l10 4"/></>,
    orbit: <><path d="M3 5h18M3 12h18M3 19h18M5 3v18M12 3v18M19 3v18"/><circle cx="5" cy="5" r="2" fill="var(--bg)"/><circle cx="12" cy="12" r="2" fill="var(--bg)"/><circle cx="19" cy="19" r="2" fill="var(--bg)"/></>,
    cycle: <><path d="M20 8a9 9 0 0 0-16 0M4 16a9 9 0 0 0 16 0M20 2v6h-6M4 22v-6h6"/></>,
    wave: <path d="M2 12c4-16 6 16 10 0s6 16 10 0"/>,
    close: <path d="m5 5 14 14M5 19 19 5"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.grid}</svg>;
}
function External({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <a className={className ?? s.textLink} href={href} target="_blank" rel="noopener noreferrer">{children}<Icon name="external" size={13}/></a>;
}
function DateLabel({ value }: { value: string }) {
  return <time dateTime={value}>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))}</time>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = ref.current; node?.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { node?.close(); document.body.style.overflow = previous; }; }, []);
  return <dialog ref={ref} className={s.dialog} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-label={title}>
    <div className={s.dialogTop}><button className={s.iconButton} onClick={onClose} aria-label="Close details"><Icon name="close"/></button></div>
    <h2>{title}</h2>{children}
  </dialog>;
}

export default function Portal({ initial, initialView = defaultView, initialProjectId, initialSection, initialRecord }: { initial: PortalData; initialView?: string; initialProjectId?: string; initialSection?: string; initialRecord?: string }) {
  const [view, setView] = useState<View>(isPortalView(initialView) ? initialView : defaultView);
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [project, setProject] = useState<Project | null>(initialView === 'projects' ? projects.find(p => p.id === initialProjectId) ?? null : null);
  const [showSources, setShowSources] = useState(false);
  const [directorySection, setDirectorySection] = useState<string | null>(initialSection ?? null);
  const [directoryRecord, setDirectoryRecord] = useState<string | null>(initialRecord ?? null);
  const inFlight = useRef(false);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try { const response = await fetch('/api/shielded-preview', { signal: AbortSignal.timeout(15000) }); if (!response.ok) throw new Error(); setData(await response.json()); setError(false); }
    catch { setError(true); } finally { inFlight.current = false; setBusy(false); }
  }, []);
  useEffect(() => {
    const loadView = () => { const canonical = legacyProjectResourceHref(location.search + location.hash); if (canonical) window.history.replaceState(null, '', canonical); const params = new URLSearchParams(location.search); const value = params.get('view'); setView(isPortalView(value) ? value : defaultView); setProject(value === 'projects' ? projects.find(p => p.id === params.get('project')) ?? null : null); setDirectorySection(params.get('section') ?? (value === 'projects' ? legacyProjectSections[location.hash] ?? null : null)); setDirectoryRecord(params.get('record')); setQuery(''); };
    const initialLoad = setTimeout(() => { loadView(); void refresh(); }, 0);
    window.addEventListener('popstate', loadView);
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 300000);
    return () => { clearTimeout(initialLoad); clearInterval(timer); window.removeEventListener('popstate', loadView); };
  }, [refresh]);
  function go(next: View, section?: string, recordId?: string) { const params = new URLSearchParams({ view: next }); if (section) params.set('section', section); if (recordId) params.set('record', recordId); if (next === 'resources') { followEditorial(`?${params}`); return; } setView(next); setProject(null); setQuery(''); setDirectorySection(section ?? null); setDirectoryRecord(recordId ?? null); window.history.pushState(null, '', `?${params}`); window.dispatchEvent(new Event('shielded:navigate')); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function openProject(next: Project, section: ProjectSection = 'overview', record?: string) { setView('projects'); setProject(next); setDirectorySection(section); setDirectoryRecord(record ?? null); setQuery(''); window.history.pushState(null, '', projectHref(next, section, record)); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function changeProjectSection(section: ProjectSection) { if (!project) return; setDirectorySection(section); setDirectoryRecord(null); window.history.pushState(null, '', projectHref(project, section)); window.dispatchEvent(new Event('shielded:navigate')); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function changeProjectRecord(record?: string) {
    if (!project) return;
    setDirectoryRecord(record ?? null);
    window.history.pushState(null, '', projectHref(project, isProjectSection(directorySection) ? directorySection : 'overview', record));
    window.dispatchEvent(new Event('shielded:navigate'));
  }
  function followEditorial(href: string) {
    const target = new URL(resolveEditorialLink(href) ?? href, window.location.href);
    const nextView = target.searchParams.get('view');
    if (!isPortalView(nextView)) return;
    const nextProject = nextView === 'projects' ? projects.find(item => item.id === target.searchParams.get('project')) : null;
    const targetSection = target.searchParams.get('section');
    if (nextProject) openProject(nextProject, isProjectSection(targetSection) ? targetSection : 'overview', target.searchParams.get('record') ?? undefined);
    else go(nextView, target.searchParams.get('section') ?? undefined, target.searchParams.get('record') ?? undefined);
    // The whole address belongs to the destination: lanes, filters and anchors included.
    window.history.replaceState(null, '', `${target.search}${target.hash}`);
    window.dispatchEvent(new Event('shielded:navigate'));
    if (target.hash) {
      let anchor = target.hash.slice(1);
      try { anchor = decodeURIComponent(anchor); } catch { /* Keep malformed fragments inert. */ }
      requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
    }
  }
  /** A portal link with no handler of its own navigates in place instead of reloading the page. */
  function followPortalLink(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    const href = link?.getAttribute('href');
    if (!link || !href?.startsWith('?view=') || link.target) return;
    if (!isPortalView(new URLSearchParams(href.split('#')[0]).get('view'))) return;
    event.preventDefault();
    followEditorial(href);
  }
  const liveCount = data.repos.filter(r => r.state === 'live').length;
  const searchResults = searchPortal(query, navigation).map(result => ({ ...result, run: () => followEditorial(result.href) }));



  return <div className={s.portal} onClick={followPortalLink}>
    <a className={s.skip} href="#portal-main">Skip to content</a>
    <PortalNavigation view={view} onNavigate={go} search={{ query, onChange: setQuery, results: searchResults }}/>

    <div className={s.workspace}>
      <main id="portal-main" className={s.main} tabIndex={-1}>
        {view === 'overview' && <Overview data={data} onNavigate={go} onProject={openProject} onFollow={followEditorial} projectGlyph={project => <Icon name={project.symbol} size={30}/>}/>}

        {view === 'projects' && <div className={pc.collection} data-detail={project ? true : undefined}>
          {!project && <h1 className={s.srOnly}>Projects</h1>}
          {project && <div className={pc.projectPicker}>
            <button type="button" onClick={() => go('projects')}><Icon name="arrow" size={16}/>All projects</button>
            <label><span className={s.srOnly}>Choose a project</span><select value={project.id} onChange={event => { const next = projects.find(item => item.id === event.target.value); if (next) openProject(next); }}>{projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>}
          {project ? <ProjectDetail onFollow={followEditorial} onRecord={changeProjectRecord} key={project.id} project={project} section={directorySection} record={directoryRecord} data={data} glyph={<Icon name={project.symbol} size={90}/>} onSection={changeProjectSection}/> : <>
            <div className={pc.grid}>{projects.map(p=><ProjectCard key={p.id} item={p} repositories={data.repos} glyph={<Icon name={p.symbol} size={30}/>} arrow={<Icon name="arrow"/>} onSelect={openProject} onFollow={followEditorial}/>)}</div>

          </>}
        </div>}

        {view === 'activity' && <Development initialRepository={directorySection} initialRecord={directoryRecord} data={data} busy={busy} failed={error} onRefresh={() => void refresh()}/>}

        {view === 'governance' && <Governance/>}

        {(view === 'impact' || view === 'people') && <Directory onFollow={followEditorial} key={view} view={view} section={directorySection} record={directoryRecord} onNavigate={(section, record) => go(view, section, record)} onProject={openProject}/>}

        {(view === 'blog' || view === 'resources' || view === 'about') && <Editorial key={view} view={view} section={directorySection} record={directoryRecord} onFollow={followEditorial}/>}

        {view === 'website' && <WebsiteProposal section={directorySection} onNavigate={section => go('website', section)} onExplore={destination => { const target = destination.projectId ? projects.find(item => item.id === destination.projectId) : null; if (target) openProject(target); else go(destination.view, destination.section); }}/>}
        <PortalFooter compact={view === 'governance'} onHome={() => go('overview')} onContact={() => go('about', 'contact')} onPrivacy={() => go('about', 'privacy')} onSources={() => setShowSources(true)}/>
      </main>
    </div>


    {showSources && <Modal title="Sources & methodology" onClose={()=>setShowSources(false)}><p className={s.dialogLead}>Coverage, verification dates and primary sources.</p><div className={s.sourceRow}><strong>Engineering observations</strong><p>Six selected repositories, up to 100 latest commits per tracked branch. Core counts exclude forks and deduplicate commit hashes. Author identities are not an employee count.</p><small>{liveCount}/6 sources refreshed · Last check <DateLabel value={data.checkedAt}/>{error?' · Refresh failed; retaining prior observations.':''}</small></div><div className={s.sourceRow}><strong>Grant records</strong><p>Grant records come from OpenZcash. Each dataset keeps its source and observation date.</p><External href="https://openzcash.org/zcg/methodology">OpenZcash methodology</External></div><div className={s.sourceRow}><strong>Content review</strong><p>Project summaries and team roles reviewed on {REVIEWED}; historical milestones reviewed on {MILESTONES_REVIEWED}. Organizational statements are attributed; governance guidance is kept distinct from advocacy.</p></div><div className={s.resourceList}>{Object.entries(sources).map(([label,url])=><External key={label} href={url}>{label.charAt(0).toUpperCase()+label.slice(1)}</External>)}</div></Modal>}
  </div>;
}
