'use client';

import { useEffect, useState } from 'react';
import { THEME_EVENT, THEME_KEY } from './theme';

const isLight = () => document.documentElement.dataset.govTheme === 'light';

/** A sun on the dark theme and a moon on the light one: the emoji alone, no circle. Every copy on the page stays in step. */
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
    <button type="button" className={className} onClick={toggle} aria-label={label} title={label}>
      <span aria-hidden="true">{light ? '🌙' : '☀️'}</span>
    </button>
  );
}
