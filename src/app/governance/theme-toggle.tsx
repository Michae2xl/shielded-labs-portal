'use client';

import { useEffect, useState } from 'react';
import { THEME_EVENT, THEME_KEY } from './theme';
import s from './theme-toggle.module.css';

const isLight = () => document.documentElement.dataset.govTheme === 'light';

/** A thin-line sun on the dark theme and a crescent on the light one, no circle. Every copy on the page stays in step. */
export default function ThemeToggle({ className }: { className?: string }) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const sync = () => setLight(isLight());
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);
  function toggle() {
    const next = !isLight();
    if (next) document.documentElement.dataset.govTheme = 'light';
    else delete document.documentElement.dataset.govTheme;
    try {
      window.localStorage.setItem(THEME_KEY, next ? 'light' : 'dark');
    } catch {
      // Private windows may refuse storage: the theme still changes for this visit.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }
  const label = light ? 'Switch to the dark theme' : 'Switch to the light theme';
  return (
    <button type="button" className={`${s.toggle} ${className ?? ''}`} onClick={toggle} aria-label={label} title={label}>
      <svg className={`${s.mark} ${s.sun}`} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
      <svg className={`${s.mark} ${s.moon}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z" />
      </svg>
    </button>
  );
}
