'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import Image from 'next/image';
import type { LabsView } from '@/lib/shielded-preview/portals';
import s from './portal-navigation.module.css';

export type PortalView = LabsView;
type NavigationView = Exclude<PortalView, 'website' | 'resources'>;
/** The pages of this portal, in menu order. Governance is a portal of its own and is not one of them. */
export const portalNavigation: { id: NavigationView; title: string; keywords?: string }[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'projects', title: 'Projects', keywords: 'research faq guides documentation questions resources roadmap' },
  { id: 'impact', title: 'Milestones' },
  { id: 'activity', title: 'Code activity', keywords: 'development commits developers repositories' },
  { id: 'people', title: 'Team', keywords: 'people contributors' },
  { id: 'blog', title: 'Blog', keywords: 'articles news announcements updates' },
  { id: 'about', title: 'About', keywords: 'mission values board careers jobs contact privacy' },
];
/** What the sidebar search can open: these pages and, as a way across, the governance portal. */
export const portalSearchIndex: { id: string; title: string; keywords?: string }[] = [{ id: 'governance', title: 'Zcash governance', keywords: 'grants funding proposals votes polls panels' }, ...portalNavigation];

function NavigationIcon({ view }: { view: NavigationView }) {
  const paths: Record<NavigationView, ReactNode> = {
    overview: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></>,
    projects: <><path d="M3 8V5a2 2 0 0 1 2-2h5l3 3h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Zm0 1h18"/></>,
    activity: <><circle cx="7" cy="5" r="2.5"/><circle cx="7" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M7 7.5v9M18 7.5v1a6 6 0 0 1-6 6H7"/></>,
    impact: <><circle cx="5" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><path d="M5 7v3m0 4v3M11 5h10M11 12h7M11 19h10"/></>,
    blog: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 12h10M7 17h6"/></>,
    about: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
    people: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v3"/></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[view]}</svg>;
}

type PortalSearch = { query: string; onChange: (query: string) => void; results: { title: string; kind: string; run: () => void }[] };

export default function PortalNavigation({ view, onNavigate, search }: { view: PortalView; onNavigate: (view: PortalView) => void; search?: PortalSearch }) {
  const [open, setOpen] = useState(false);
  const aside = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !aside.current?.contains(event.target)) setOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 901px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('pointerdown', closeOutside);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('pointerdown', closeOutside);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [open]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, next: PortalView) {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setOpen(false);
    onNavigate(next);
    document.getElementById('portal-main')?.focus({ preventScroll: true });
  }

  return <aside className={s.sidebar} ref={aside} aria-label="Portal sidebar">
    <div className={s.header}>
      <a className={s.mobileBrand} href="?view=overview" onClick={event => navigate(event, 'overview')}><Image src="/logos/shielded-labs-horizontal.png" alt="Shielded Labs" width={800} height={200} sizes="160px"/></a>
      <button ref={toggle} className={s.toggle} aria-expanded={open} aria-controls="portal-navigation" onClick={() => setOpen(value => !value)}>
        <span>{open ? 'Close' : 'Menu'}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">{open ? <path d="m6 6 12 12M6 18 18 6"/> : <path d="M4 7h16M4 12h16M4 17h16"/>}</svg>
      </button>
    </div>
    <div id="portal-navigation" className={`${s.panel} ${open ? s.open : ''}`}>
      <nav aria-label="Portal navigation" className={s.navigation}>
        <ul>{portalNavigation.map(item => <li key={item.id}>
          <a href={`?view=${item.id}`} className={s.item} aria-current={view === item.id ? 'page' : undefined} onClick={event => navigate(event, item.id)}>
            <NavigationIcon view={item.id}/><span>{item.title}</span>
          </a>
        </li>)}</ul>
      </nav>
      {search && <div className={s.searchArea} role="search" aria-label="Portal search">
        <div className={s.searchField}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg>
          <input ref={searchInput} type="search" aria-label="Search the portal" aria-controls="portal-search-results" placeholder="Search pages & people…" value={search.query} onChange={event => search.onChange(event.target.value)}/>
          {search.query && <button type="button" className={s.clearSearch} aria-label="Clear search" onClick={() => { search.onChange(''); searchInput.current?.focus(); }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 5 14 14M5 19 19 5"/></svg></button>}
        </div>
        <div id="portal-search-results" className={s.searchResults} role="region" aria-label="Search results">
          {search.query.trim() && <>
            <p>Titles, summaries, projects, milestones &amp; team.</p>
            <p role="status">{search.results.length ? `${search.results.length} results` : 'No results found.'}</p>
            {search.results.map((result, index) => <button type="button" key={`${result.kind}:${result.title}:${index}`} onClick={() => {
              setOpen(false);
              result.run();
              document.getElementById('portal-main')?.focus({ preventScroll: true });
            }}><span>{result.title}</span><small>{result.kind}</small></button>)}
          </>}
        </div>
      </div>}
    </div>
  </aside>;
}
