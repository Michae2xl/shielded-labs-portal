'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { ShieldMark } from './shield';
import s from './portal-navigation.module.css';

export type PortalView = 'overview' | 'governance' | 'projects' | 'activity' | 'impact' | 'people' | 'blog' | 'resources' | 'about' | 'website';
type NavigationView = Exclude<PortalView, 'website'>;
export const portalNavigation: { id: NavigationView; title: string; group: 'explore' | 'labs'; keywords?: string }[] = [
  { id: 'overview', title: 'Overview', group: 'explore' },
  { id: 'governance', title: 'Zcash governance', group: 'explore', keywords: 'grants funding proposals votes polls panels' },
  { id: 'blog', title: 'Blog', group: 'explore', keywords: 'articles news announcements updates' },
  { id: 'resources', title: 'Resources', group: 'explore', keywords: 'faq guides documentation questions roadmap' },
  { id: 'projects', title: 'Projects', group: 'labs' },
  { id: 'activity', title: 'Code activity', group: 'labs', keywords: 'development commits developers repositories' },
  { id: 'impact', title: 'Milestones', group: 'labs' },
  { id: 'people', title: 'Team & community', group: 'labs', keywords: 'people contributors communities' },
  { id: 'about', title: 'About', group: 'labs', keywords: 'mission values board careers jobs contact privacy' },
];

function NavigationIcon({ view }: { view: NavigationView }) {
  const paths: Record<NavigationView, ReactNode> = {
    overview: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></>,
    governance: <><path d="m7 10-4 4v7h18v-7l-4-4M3 14h18M9 17h6"/><path d="m8 4 8-2 2 8-8 2Z"/><path d="m11 6 2 1 2-3"/></>,
    projects: <><path d="M3 8V5a2 2 0 0 1 2-2h5l3 3h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Zm0 1h18"/></>,
    activity: <><circle cx="7" cy="5" r="2.5"/><circle cx="7" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M7 7.5v9M18 7.5v1a6 6 0 0 1-6 6H7"/></>,
    impact: <><circle cx="5" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><path d="M5 7v3m0 4v3M11 5h10M11 12h7M11 19h10"/></>,
    blog: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 12h10M7 17h6"/></>,
    resources: <><path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15"/></>,
    about: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
    people: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v3"/></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[view]}</svg>;
}

export default function PortalNavigation({ view, onNavigate }: { view: PortalView; onNavigate: (view: PortalView) => void }) {
  const [open, setOpen] = useState(false);
  const aside = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

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

  function items(group: 'explore' | 'labs') {
    return <ul>{portalNavigation.filter(item => item.group === group).map(item => <li key={item.id}>
      <a href={`?view=${item.id}`} className={s.item} aria-current={view === item.id ? 'page' : undefined} onClick={event => navigate(event, item.id)}>
        <NavigationIcon view={item.id}/><span>{item.title}</span>
      </a>
    </li>)}</ul>;
  }

  return <aside className={s.sidebar} ref={aside} aria-label="Portal sidebar">
    <div className={s.header}>
      <a className={s.brand} href="?view=overview" onClick={event => navigate(event, 'overview')} aria-label="Shielded Labs overview"><ShieldMark/><span>SHIELDED<span>LABS</span></span></a>
      <button ref={toggle} className={s.toggle} aria-expanded={open} aria-controls="portal-navigation" onClick={() => setOpen(value => !value)}>
        <span>{open ? 'Close' : 'Menu'}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">{open ? <path d="m6 6 12 12M6 18 18 6"/> : <path d="M4 7h16M4 12h16M4 17h16"/>}</svg>
      </button>
    </div>
    <div id="portal-navigation" className={`${s.panel} ${open ? s.open : ''}`}>
      <nav aria-label="Portal navigation" className={s.navigation}>
        <div className={s.group}><p className={s.label}>Explore</p>{items('explore')}</div>
        <div className={s.group}><p className={s.label}>Shielded Labs</p>{items('labs')}</div>
      </nav>
    </div>
  </aside>;
}
